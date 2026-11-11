
import {
    findPreferencesByStudentId,
    savePreferences
} from '../models/preferenceModel.js';

const isValidTime = (time) => {
    return typeof time === 'string' &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
};

// Get student study preferences
export const getStudentPreferences = async (req, res) => {
    try {
        const preferences = await findPreferencesByStudentId(
            req.studentId
        );

        return res.status(200).json({
            success: true,
            preferences
        });

    } catch (error) {
        console.error('Get preferences error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve study preferences.'
        });
    }
};

// Create or update student study preferences
export const updateStudentPreferences = async (req, res) => {
    try {
        const {
            dailyStudyHours,
            preferredStartTime,
            preferredEndTime,
            sessionDuration,
            breakDuration,
            studyDays
        } = req.body;

        if (
            !Number.isInteger(dailyStudyHours) ||
            dailyStudyHours < 1 ||
            dailyStudyHours > 12
        ) {
            return res.status(400).json({
                success: false,
                message: 'Daily study hours must be between 1 and 12.'
            });
        }

        if (
            !isValidTime(preferredStartTime) ||
            !isValidTime(preferredEndTime) ||
            preferredStartTime >= preferredEndTime
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please provide valid study start and end times.'
            });
        }

        if (
            !Number.isInteger(sessionDuration) ||
            sessionDuration < 15 ||
            sessionDuration > 120
        ) {
            return res.status(400).json({
                success: false,
                message: 'Session duration must be between 15 and 120 minutes.'
            });
        }

        if (
            !Number.isInteger(breakDuration) ||
            breakDuration < 5 ||
            breakDuration > 60
        ) {
            return res.status(400).json({
                success: false,
                message: 'Break duration must be between 5 and 60 minutes.'
            });
        }

        const validDays = [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday'
        ];

        if (
            !Array.isArray(studyDays) ||
            studyDays.length === 0 ||
            !studyDays.every(day => validDays.includes(day)) ||
            new Set(studyDays).size !== studyDays.length
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please select at least one valid study day.'
            });
        }

        await savePreferences(req.studentId, {
            dailyStudyHours,
            preferredStartTime,
            preferredEndTime,
            sessionDuration,
            breakDuration,
            studyDays
        });

        return res.status(200).json({
            success: true,
            message: 'Study preferences saved successfully!'
        });

    } catch (error) {
        console.error('Update preferences error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Failed to save study preferences.'
        });
    }
};
