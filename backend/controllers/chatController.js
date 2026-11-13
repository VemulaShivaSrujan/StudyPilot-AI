
import { generateChatResponse } from '../services/geminiService.js';

import {
    findTimetableByStudentId
} from '../models/timetableModel.js';

import {
    findExamsByStudentId
} from '../models/examModel.js';

import {
    findTopicsByStudentId
} from '../models/topicModel.js';

const getTodayDate = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(new Date());

    const values = {};

    parts.forEach((part) => {
        values[part.type] = part.value;
    });

    return `${values.year}-${values.month}-${values.day}`;
};

export const sendChatMessage = async (req, res) => {
    try {
        const { message, history = [] } = req.body;

        // Validate message
        if (
            !message ||
            typeof message !== 'string' ||
            !message.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid message.'
            });
        }

        // Validate conversation history
        if (!Array.isArray(history)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid conversation history.'
            });
        }

        // Keep only the latest 10 messages
        const validHistory = history
            .filter(item =>
                item &&
                ['user', 'assistant'].includes(item.role) &&
                typeof item.content === 'string'
            )
            .slice(-10);

        // Retrieve the authenticated student's data
        const [timetable, exams, topics] = await Promise.all([
            findTimetableByStudentId(req.studentId),
            findExamsByStudentId(req.studentId),
            findTopicsByStudentId(req.studentId)
        ]);

        const today = getTodayDate();

        // Today's timetable sessions
        const todaySessions = (timetable?.sessions || [])
            .filter(session => session.date === today)
            .sort((a, b) =>
                a.startTime.localeCompare(b.startTime)
            );

        // Prepare timetable context
        let studyContext = '';

        if (!timetable) {
            studyContext = `
                The student has not generated a study timetable yet.
                Do not invent any timetable sessions.
                `;
        } else if (todaySessions.length === 0) {
            studyContext = `
Today's date: ${today}

The student has a timetable, but no study sessions
are scheduled for today.
Do not invent any sessions.
`;
        } else {
            studyContext = `
Today's date: ${today}

STUDENT'S ACTUAL STUDY SCHEDULE:

${todaySessions.map((session, index) => `
${index + 1}. ${session.startTime} - ${session.endTime}
Subject: ${session.subjectName}
Topic: ${session.topicName}
Exam: ${session.examName}
Duration: ${session.duration} minutes
Status: ${session.completed ? 'Completed' : 'Pending'}
`).join('\n')}

Use this actual timetable when answering questions
about today's study plan.
Do not invent or change scheduled sessions.
`;
        }

        // Filter upcoming exams
        const upcomingExams = exams.filter(exam => {
            const examDate = new Date(exam.examDate);

            const examDateString = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Kolkata'
            }).format(examDate);

            return examDateString >= today;
        });

        // Prepare upcoming exam context
        let examContext = '';

        if (upcomingExams.length === 0) {
            examContext = `
The student currently has no upcoming exams.
Do not invent any exams.
`;
        } else {
            examContext = `
UPCOMING EXAMS:

${upcomingExams.map((exam, index) => {
    const examDate = new Intl.DateTimeFormat('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    }).format(new Date(exam.examDate));

    return `
${index + 1}. ${exam.examName}
Type: ${exam.examType}
Date: ${examDate}
Priority: ${exam.priority}
Description: ${exam.description || 'Not provided'}
`;
}).join('\n')}

Use these actual exam details when answering
questions about upcoming exams.
Do not invent or change exam information.
`;
        }

        // Calculate personal progress
        const totalTopics = topics.length;

        const completedTopics = topics.filter(
            topic => topic.completed === true
        ).length;

        const pendingTopics = totalTopics - completedTopics;

        const masteredTopics = topics.filter(
            topic => topic.mastered === true
        ).length;

        const totalTestAttempts = topics.reduce(
            (total, topic) => total + (topic.testStats?.attempts || 0),
            0
        );

        const averageBestScore = topics.length > 0
            ? Math.round(
                topics.reduce(
                    (total, topic) => total + (topic.testStats?.bestScore || 0),
                    0
                ) / topics.length
            )
            : 0;

        const weakTopics = topics.filter(
            topic =>
                topic.completed === true &&
                (topic.testStats?.lastScore ?? 0) < 60
        );

        const progressContext = `
        PERSONAL STUDY PROGRESS:

        Total Topics: ${totalTopics}
        Completed Topics: ${completedTopics}
        Pending Topics: ${pendingTopics}
        Mastered Topics: ${masteredTopics}
        Total Test Attempts: ${totalTestAttempts}
        Average Best Score Across Topics: ${averageBestScore}%

        Topics Needing Improvement:
        ${weakTopics.length > 0
                ? weakTopics.map(topic =>
                    `- ${topic.topicName || topic.name || 'Unnamed Topic'} (Last Score: ${topic.testStats?.lastScore ?? 'Not available'}%)`
                ).join('\n')
                : 'No weak topics identified from the available test results.'}

        Use these actual statistics when answering questions
        about the student's learning progress.
        Do not invent progress information.
        `;

        // Combine student context
        const studentContext = `
        ${studyContext}

        ${examContext}

        ${progressContext}
        `;

        // Generate AI response
        const reply = await generateChatResponse({
            message: message.trim(),
            history: validHistory,
            studyContext: studentContext
        });

        return res.status(200).json({
            success: true,
            reply
        });

    } catch (error) {
        console.error(
            'Chat controller error:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message: 'AI assistant is temporarily unavailable. Please try again.'
        });
    }
};
