
import { findTimetableByStudentId } from '../models/timetableModel.js';
import { findExamsByStudentId } from '../models/examModel.js';

const TIME_ZONE = 'Asia/Kolkata';

// Get today's date in Indian timezone
const getIndiaToday = () => {
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

// Calculate difference between two date strings
const getDaysDifference = (date1, date2) => {
    const first = new Date(date1 + 'T00:00:00Z');
    const second = new Date(date2 + 'T00:00:00Z');

    return Math.round(
        (first.getTime() - second.getTime()) /
        (1000 * 60 * 60 * 24)
    );
};

export const getNotifications = async (req, res) => {
    try {
        const studentId = req.studentId;

        // Fetch timetable and examinations
        const [timetable, exams] = await Promise.all([
            findTimetableByStudentId(studentId),
            findExamsByStudentId(studentId)
        ]);

        const notifications = [];
        const today = getIndiaToday();

        // ==================================
        // UPCOMING EXAM NOTIFICATIONS
        // ==================================

        exams.forEach((exam) => {
            const examDate = getDateString(exam.examDate);

            if (!examDate) return;

            const daysLeft = getDaysDifference(examDate, today);

            if (daysLeft >= 0 && daysLeft <= 7) {
                notifications.push({
                    id: 'exam-' + exam._id.toString(),
                    type: 'exam',
                    title: 'Upcoming Examination',
                    message: daysLeft === 0
                        ? (exam.examName || 'Your examination') +
                          ' is scheduled for today!'
                        : (exam.examName || 'Your examination') +
                          ' is in ' + daysLeft + ' day(s). Start preparing!',
                    date: examDate,
                    priority: daysLeft <= 2 ? 'high' : 'medium'
                });
            }
        });

        // ==================================
        // STUDY SESSION NOTIFICATIONS
        // ==================================

        if (timetable && Array.isArray(timetable.sessions)) {

            timetable.sessions.forEach((session) => {

                // Ignore completed sessions
                if (session.completed) return;

                const sessionDate = getDateString(session.date);

                if (!sessionDate) return;

                const daysDifference = getDaysDifference(
                    sessionDate,
                    today
                );

                const topicName =
                    session.topicName ||
                    session.topic ||
                    'your scheduled topic';

                // Overdue study sessions
                if (daysDifference < 0) {
                    notifications.push({
                        id: 'overdue-' + session.sessionId,
                        type: 'overdue',
                        title: 'Overdue Study Session',
                        message: 'You have a pending study session: ' +
                            topicName + '.',
                        date: sessionDate,
                        priority: 'high'
                    });
                }

                // Today's study sessions
                else if (daysDifference === 0) {
                    notifications.push({
                        id: 'today-' + session.sessionId,
                        type: 'study',
                        title: "Today's Study Session",
                        message: 'Remember to study ' +
                            topicName + ' today.',
                        date: sessionDate,
                        priority: 'medium'
                    });
                }
            });
        }

        // ==================================
        // SORT BY PRIORITY
        // ==================================

        const priorityOrder = {
            high: 1,
            medium: 2,
            low: 3
        };

        notifications.sort((a, b) => {
            return priorityOrder[a.priority] -
                priorityOrder[b.priority];
        });

        // ==================================
        // SEND RESPONSE
        // ==================================

        return res.status(200).json({
            success: true,
            totalNotifications: notifications.length,
            notifications
        });

    } catch (error) {
        console.error('Notification error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to fetch notifications.'
        });
    }
};
