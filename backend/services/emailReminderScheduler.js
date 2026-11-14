
import cron from 'node-cron';

import {
    checkAndSendEmailReminders
} from './emailReminderService.js';

let isChecking = false;

export const startEmailReminderScheduler = () => {
    console.log('Email reminder scheduler initialized.');

    // Run every day at 9:00 AM Indian time
    cron.schedule(
        '0 9 * * *',
        async () => {
            if (isChecking) {
                console.log('Previous reminder check is still running.');
                return;
            }

            isChecking = true;

            try {
                console.log('Starting scheduled email reminders...');

                await checkAndSendEmailReminders();

            } catch (error) {
                console.error(
                    'Scheduled email reminder error:',
                    error
                );
            } finally {
                isChecking = false;
            }
        },
        {
            timezone: 'Asia/Kolkata'
        }
    );
};
