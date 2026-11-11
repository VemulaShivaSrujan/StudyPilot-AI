
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

const PREFERENCES_COLLECTION = 'study_preferences';

export const getPreferencesCollection = () => {
    return getDB().collection(PREFERENCES_COLLECTION);
};

export const findPreferencesByStudentId = async (studentId) => {
    return getPreferencesCollection().findOne({
        studentId: new ObjectId(studentId)
    });
};

export const savePreferences = async (studentId, preferences) => {
    const now = new Date();

    return getPreferencesCollection().updateOne(
        {
            studentId: new ObjectId(studentId)
        },
        {
            $set: {
                ...preferences,
                studentId: new ObjectId(studentId),
                updatedAt: now
            },
            $setOnInsert: {
                createdAt: now
            }
        },
        {
            upsert: true
        }
    );
};
