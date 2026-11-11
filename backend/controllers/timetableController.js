
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

import { findPreferencesByStudentId } from '../models/preferenceModel.js';

import {
    findTimetableByStudentId,
    saveTimetable,
    updateSessionCompletion,
    deleteTimetable
} from '../models/timetableModel.js';

const DAYS = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
];

const TIME_ZONE = 'Asia/Kolkata';

const getIndiaDateTime = () => {
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    }).formatToParts(new Date());

    const values = {};

    parts.forEach((part) => {
        values[part.type] = part.value;
    });

    return {
        date: `${values.year}-${values.month}-${values.day}`,
        minutes: Number(values.hour) * 60 + Number(values.minute)
    };
};

const addDays = (dateString, days) => {
    const [year, month, day] = dateString.split('-').map(Number);

    const date = new Date(Date.UTC(year, month - 1, day + days));

    return date.toISOString().slice(0, 10);
};

const getDayName = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);

    return DAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
};

const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${String(hours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
};

const getExamDate = (examDate) => {
    if (!examDate) return null;

    if (typeof examDate === 'string') {
        return examDate.slice(0, 10);
    }

    if (examDate instanceof Date) {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: TIME_ZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(examDate);
    }

    return null;
};

// Generate a conflict-free timetable for all upcoming examinations
const generateStudySessions = (exams, subjects, topics, preferences) => {
    const { date: today, minutes: currentMinutes } = getIndiaDateTime();

    const dailyStudyHours = Number(preferences.dailyStudyHours) || 4;
    const sessionDuration = Number(preferences.sessionDuration) || 50;
    const breakDuration = Number(preferences.breakDuration) || 10;

    const preferredStart = preferences.preferredStartTime || '18:00';
    const preferredEnd = preferences.preferredEndTime || '22:00';

    const startParts = preferredStart.split(':').map(Number);
    const endParts = preferredEnd.split(':').map(Number);

    const preferredStartMinutes = startParts[0] * 60 + startParts[1];
    const preferredEndMinutes = endParts[0] * 60 + endParts[1];

    const studyDays = preferences.studyDays || DAYS;

    const examMap = new Map();
    const subjectMap = new Map();

    exams.forEach((exam) => {
        examMap.set(exam._id.toString(), exam);
    });

    subjects.forEach((subject) => {
        subjectMap.set(subject._id.toString(), subject);
    });

    // Sort topics by their examination date.
    const topicQueue = topics
        .map((topic) => {
            const subject = subjectMap.get(topic.subjectId.toString());

            if (!subject) return null;

            const exam = examMap.get(subject.examId.toString());

            if (!exam) return null;

            return {
                topicId: topic._id.toString(),
                topicName: topic.topicName,
                subjectId: subject._id.toString(),
                subjectName: subject.subjectName,
                examId: exam._id.toString(),
                examName: exam.examName,
                examDate: getExamDate(exam.examDate),
                remainingMinutes: Math.max(
                    1,
                    Number(topic.estimatedTime) || 30
                )
            };
        })
        .filter((topic) => topic && topic.examDate)
        .sort((a, b) => {
            return a.examDate.localeCompare(b.examDate);
        });

    if (!topicQueue.length) {
        return {
            sessions: [],
            remainingTopics: 0
        };
    }

    const latestExamDate = topicQueue.reduce((latest, topic) => {
        return topic.examDate > latest ? topic.examDate : latest;
    }, today);

    const sessions = [];

    // Tracks occupied time slots across every examination.
    const occupiedSlots = new Map();

    for (
        let date = today;
        date < latestExamDate;
        date = addDays(date, 1)
    ) {
        const dayName = getDayName(date);

        if (!studyDays.includes(dayName)) {
            continue;
        }

        const endOfDay = preferredEndMinutes;
        let currentTime = preferredStartMinutes;

        // On today's date, do not schedule sessions in the past.
        if (date === today) {
            currentTime = Math.max(currentTime, currentMinutes);
        }

        let usedMinutes = 0;

        while (
            usedMinutes < dailyStudyHours * 60 &&
            currentTime + sessionDuration <= endOfDay
        ) {
            const availableTopic = topicQueue.find((topic) => {
                // Stop studying a particular exam's topics after its exam date.
                return (
                    topic.remainingMinutes > 0 &&
                    date < topic.examDate
                );
            });

            if (!availableTopic) break;

            const duration = Math.min(
                sessionDuration,
                availableTopic.remainingMinutes
            );

            const sessionEnd = currentTime + duration;

            // Check that this time slot is not already occupied.
            const slotKey = `${date}-${currentTime}-${sessionEnd}`;

            if (occupiedSlots.has(slotKey)) {
                currentTime += 1;
                continue;
            }

            occupiedSlots.set(slotKey, true);

            sessions.push({
                date,
                day: dayName,
                startTime: formatTime(currentTime),
                endTime: formatTime(sessionEnd),
                examId: availableTopic.examId,
                examName: availableTopic.examName,
                subjectId: availableTopic.subjectId,
                subjectName: availableTopic.subjectName,
                topicId: availableTopic.topicId,
                topicName: availableTopic.topicName,
                duration,
                completed: false
            });

            availableTopic.remainingMinutes -= duration;
            usedMinutes += duration;

            currentTime = sessionEnd + breakDuration;
        }
    }

    const remainingTopics = topicQueue.filter(
        (topic) => topic.remainingMinutes > 0
    ).length;

    return {
        sessions,
        remainingTopics
    };
};

// POST /api/timetable/generate
export const generateTimetable = async (req, res) => {
    try {
        const studentId = req.studentId;
        const db = getDB();

        const today = getIndiaDateTime().date;

        // Get all upcoming examinations belonging to this student.
        const exams = await db.collection('exams')
            .find({
                studentId: new ObjectId(studentId)
            })
            .toArray();

        const upcomingExams = exams.filter((exam) => {
            const examDate = getExamDate(exam.examDate);

            return examDate && examDate > today;
        });

        if (!upcomingExams.length) {
            return res.status(400).json({
                success: false,
                message: 'No upcoming examinations found.'
            });
        }

        const examIds = upcomingExams.map((exam) => exam._id);

        const subjects = await db.collection('subjects')
            .find({
                studentId: new ObjectId(studentId),
                examId: { $in: examIds }
            })
            .toArray();

        if (!subjects.length) {
            return res.status(400).json({
                success: false,
                message: 'Please add subjects to your upcoming examinations first.'
            });
        }

        const subjectIds = subjects.map((subject) => subject._id);

        const topics = await db.collection('topics')
            .find({
                studentId: new ObjectId(studentId),
                subjectId: { $in: subjectIds },
                completed: false
            })
            .toArray();

        if (!topics.length) {
            return res.status(400).json({
                success: false,
                message: 'No incomplete topics found in your upcoming examinations.'
            });
        }

        const preferences = await findPreferencesByStudentId(studentId) || {
            dailyStudyHours: 4,
            preferredStartTime: '18:00',
            preferredEndTime: '22:00',
            sessionDuration: 50,
            breakDuration: 10,
            studyDays: DAYS.filter((day) => day !== 'Sunday')
        };

        const result = generateStudySessions(
            upcomingExams,
            subjects,
            topics,
            preferences
        );

        if (!result.sessions.length) {
            return res.status(400).json({
                success: false,
                message: 'No study sessions could be scheduled. Please check your study preferences and examination dates.'
            });
        }

        await saveTimetable(studentId, result.sessions);

        return res.status(200).json({
            success: true,
            message: result.remainingTopics > 0
                ? 'Combined timetable generated, but some topics could not fit before their examinations.'
                : 'Combined timetable generated successfully!',
            examCount: upcomingExams.length,
            topicCount: topics.length,
            sessionCount: result.sessions.length,
            remainingTopics: result.remainingTopics,
            sessions: result.sessions
        });

    } catch (error) {
        console.error('Generate combined timetable error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Failed to generate combined timetable.'
        });
    }
};

// GET /api/timetable
export const getTimetable = async (req, res) => {
    try {
        const timetable = await findTimetableByStudentId(req.studentId);

        if (!timetable) {
            return res.status(404).json({
                success: false,
                message: 'No combined timetable found.'
            });
        }

        return res.status(200).json({
            success: true,
            timetable: {
                generatedAt: timetable.generatedAt,
                sessions: timetable.sessions || []
            }
        });

    } catch (error) {
        console.error('Get combined timetable error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve combined timetable.'
        });
    }
};

// PATCH /api/timetable/sessions/:sessionId
export const updateTimetableSession = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { completed } = req.body;

        if (!ObjectId.isValid(sessionId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid session ID.'
            });
        }

        if (typeof completed !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'Completed must be true or false.'
            });
        }

        const result = await updateSessionCompletion(
            req.studentId,
            sessionId,
            completed
        );

        if (!result.matchedCount) {
            return res.status(404).json({
                success: false,
                message: 'Timetable session not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Timetable session updated successfully.'
        });

    } catch (error) {
        console.error('Update timetable session error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Failed to update timetable session.'
        });
    }
};

// DELETE /api/timetable
export const removeTimetable = async (req, res) => {
    try {
        await deleteTimetable(req.studentId);

        return res.status(200).json({
            success: true,
            message: 'Combined timetable deleted successfully.'
        });

    } catch (error) {
        console.error('Delete combined timetable error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Failed to delete combined timetable.'
        });
    }
};
