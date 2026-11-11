
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

const TIMETABLES_COLLECTION = 'timetables';

export const getTimetablesCollection = () => {
    return getDB().collection(TIMETABLES_COLLECTION);
};

// Find a timetable for a particular student and examination
export const findTimetableByExam = async (studentId, examId) => {
    return getTimetablesCollection().findOne({
        studentId: new ObjectId(studentId),
        examId: new ObjectId(examId)
    });
};

// Save a new timetable or replace the existing timetable for this exam
export const saveTimetable = async (studentId, examId, sessions) => {
    const now = new Date();

    const timetableSessions = sessions.map((session) => ({
        ...session,
        sessionId: new ObjectId(),
        completed: false
    }));

    return getTimetablesCollection().updateOne(
        {
            studentId: new ObjectId(studentId),
            examId: new ObjectId(examId)
        },
        {
            $set: {
                sessions: timetableSessions,
                generatedAt: now,
                updatedAt: now
            },
            $setOnInsert: {
                studentId: new ObjectId(studentId),
                examId: new ObjectId(examId),
                createdAt: now
            }
        },
        {
            upsert: true
        }
    );
};

// Update the completion status of a timetable session
export const updateSessionCompletion = async (
    studentId,
    examId,
    sessionId,
    completed
) => {
    return getTimetablesCollection().updateOne(
        {
            studentId: new ObjectId(studentId),
            examId: new ObjectId(examId),
            'sessions.sessionId': new ObjectId(sessionId)
        },
        {
            $set: {
                'sessions.$.completed': completed,
                updatedAt: new Date()
            }
        }
    );
};

// Delete a timetable for a particular examination
export const deleteTimetable = async (studentId, examId) => {
    return getTimetablesCollection().deleteOne({
        studentId: new ObjectId(studentId),
        examId: new ObjectId(examId)
    });
};
