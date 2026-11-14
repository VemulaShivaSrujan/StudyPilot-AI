
import { getDB } from '../config/db.js';

const COLLECTION = 'email_reminders';

export const getEmailRemindersCollection = () => {
    return getDB().collection(COLLECTION);
};

// Check whether a reminder has already been sent
export const hasReminderBeenSent = async (reminderKey) => {
    const collection = getEmailRemindersCollection();

    const existing = await collection.findOne({
        reminderKey
    });

    return Boolean(existing);
};

// Record a successfully sent reminder
export const saveEmailReminder = async (reminderData) => {
    const collection = getEmailRemindersCollection();

    return await collection.insertOne({
        ...reminderData,
        sentAt: new Date()
    });
};
