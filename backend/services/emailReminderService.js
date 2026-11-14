
import { sendEmail } from './emailService.js';

import { getExamsCollection } from '../models/examModel.js';
import { findStudentById } from '../models/studentModel.js';
import { findTimetableByStudentId } from '../models/timetableModel.js';

import {
    hasReminderBeenSent,
    saveEmailReminder
} from '../models/emailReminderModel.js';

const TIME_ZONE = 'Asia/Kolkata';

// Get today's date in Indian timezone
const getToday = () => {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: TIME_ZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(new Date());
};

// Convert dates into YYYY-MM-DD format
const getDateString = (date) => {
    if (!date) return null;

    if (typeof date === 'string') {
        return date.slice(0, 10);
    }

    if (date instanceof Date) {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: TIME_ZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(date);
    }

    return null;
};

// Calculate days between dates
const getDaysDifference = (targetDate, today) => {
    const target = new Date(targetDate + 'T00:00:00Z');
    const current = new Date(today + 'T00:00:00Z');

    return Math.round(
        (target.getTime() - current.getTime()) /
        (1000 * 60 * 60 * 24)
    );
};

// Safely display text inside HTML emails
const escapeHtml = (value) => {
    return String(value || '').replace(/[&<>"']/g, (character) => {
        const entities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };

        return entities[character];
    });
};

// Send an exam reminder
const sendExamReminder = async (exam, student, daysLeft) => {
    const examDate = getDateString(exam.examDate);

    const reminderKey =
        `exam:${exam._id.toString()}:${examDate}:${daysLeft}`;

    if (await hasReminderBeenSent(reminderKey)) {
        return;
    }

    const examName = escapeHtml(exam.examName || 'Your examination');

    const subject = daysLeft === 7
        ? `StudyPilot AI: ${exam.examName} is in 7 days`
        : `StudyPilot AI: ${exam.examName} is tomorrow`;

    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2563eb;">StudyPilot AI</h2>

            <h3>Upcoming Examination Reminder</h3>

            <p>Hello ${escapeHtml(student.name || 'Student')},</p>

            <p>
                Your examination
                <strong>${examName}</strong>
                is ${daysLeft === 1 ? 'tomorrow' : 'in 7 days'}.
            </p>

            <p>
                Examination date:
                <strong>${examDate}</strong>
            </p>

            <p>Stay consistent with your preparation. Good luck!</p>

            <p>Regards,<br>StudyPilot AI Team</p>
        </div>
    `;

    await sendEmail(student.email, subject, html);

    await saveEmailReminder({
        reminderKey,
        studentId: exam.studentId,
        type: 'exam',
        examId: exam._id,
        examDate
    });

    console.log(`Exam reminder sent to ${student.email}`);
};

// Send an overdue study session reminder
const sendOverdueReminder = async (
    session,
    student,
    studentId
) => {
    const sessionDate = getDateString(session.date);

    const reminderKey =
        `session:${studentId}:${session.sessionId}:${sessionDate}`;

    if (await hasReminderBeenSent(reminderKey)) {
        return;
    }

    const topicName = escapeHtml(
        session.topicName || 'your scheduled topic'
    );

    const subject = 'StudyPilot AI: Pending Study Session Reminder';

    const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2 style="color: #2563eb;">StudyPilot AI</h2>

            <h3>Pending Study Session</h3>

            <p>Hello ${escapeHtml(student.name || 'Student')},</p>

            <p>
                You have an incomplete study session for:
                <strong>${topicName}</strong>.
            </p>

            <p>
                Originally scheduled for:
                <strong>${sessionDate}</strong>
            </p>

            <p>Try to complete this topic as soon as possible.</p>

            <p>Keep learning!<br>StudyPilot AI Team</p>
        </div>
    `;

    await sendEmail(student.email, subject, html);

    await saveEmailReminder({
        reminderKey,
        studentId,
        type: 'overdue',
        sessionId: session.sessionId,
        sessionDate
    });

    console.log(`Study reminder sent to ${student.email}`);
};

// Main reminder checking function
export const checkAndSendEmailReminders = async () => {
    console.log('Checking automatic email reminders...');

    const today = getToday();

    // Check upcoming examinations
    const exams = await getExamsCollection()
        .find({})
        .toArray();

    for (const exam of exams) {
        try {
            const examDate = getDateString(exam.examDate);

            if (!examDate) continue;

            const daysLeft = getDaysDifference(examDate, today);

            if (daysLeft !== 7 && daysLeft !== 1) continue;

            const student = await findStudentById(
                exam.studentId.toString()
            );

            if (!student || !student.isEmailVerified || !student.email) {
                continue;
            }

            await sendExamReminder(exam, student, daysLeft);

        } catch (error) {
            console.error(
                'Exam reminder failed:',
                exam._id,
                error.message
            );
        }
    }

    // Check overdue study sessions
    const { getDB } = await import('../config/db.js');

    const timetables = await getDB()
        .collection('combined_timetables')
        .find({})
        .toArray();

    for (const timetable of timetables) {
        try {
            const studentId = timetable.studentId.toString();

            const student = await findStudentById(studentId);

            if (!student || !student.isEmailVerified || !student.email) {
                continue;
            }

            const sessions = timetable.sessions || [];

            for (const session of sessions) {
                try {
                    if (session.completed) continue;

                    const sessionDate = getDateString(session.date);

                    if (!sessionDate) continue;

                    const daysDifference = getDaysDifference(
                        sessionDate,
                        today
                    );

                    if (daysDifference >= 0) continue;

                    await sendOverdueReminder(
                        session,
                        student,
                        studentId
                    );

                } catch (error) {
                    console.error(
                        'Study session reminder failed:',
                        error.message
                    );
                }
            }

        } catch (error) {
            console.error(
                'Timetable reminder failed:',
                error.message
            );
        }
    }

    console.log('Email reminder check completed.');
};
