
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

const TIMETABLES_COLLECTION = 'combined_timetables';

export const getTimetablesCollection = () => {
    return getDB().collection(TIMETABLES_COLLECTION);
};

// Find the combined timetable for a student
export const findTimetableByStudentId = async (studentId) => {
    return getTimetablesCollection().findOne({
        studentId: new ObjectId(studentId)
    });
};

// Save or replace the student's combined timetable
export const saveTimetable = async (studentId, sessions) => {
    const now = new Date();

    const timetableSessions = sessions.map((session) => ({
        ...session,
        sessionId: new ObjectId(),
        completed: false
    }));

    return getTimetablesCollection().updateOne(
        {
            studentId: new ObjectId(studentId)
        },
        {
            $set: {
                sessions: timetableSessions,
                generatedAt: now,
                updatedAt: now
            },
            $setOnInsert: {
                studentId: new ObjectId(studentId),
                createdAt: now
            }
        },
        {
            upsert: true
        }
    );
};

// Update a session's completion status
export const updateSessionCompletion = async (
    studentId,
    sessionId,
    completed
) => {
    return getTimetablesCollection().updateOne(
        {
            studentId: new ObjectId(studentId),
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

// Delete the student's combined timetable
export const deleteTimetable = async (studentId) => {
    return getTimetablesCollection().deleteOne({
        studentId: new ObjectId(studentId)
    });
};
