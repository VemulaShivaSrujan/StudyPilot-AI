
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { connectDB } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import examRoutes from './routes/examRoutes.js';
import subjectRoutes from './routes/subjectRoutes.js';
import topicRoutes from './routes/topicRoutes.js';
import pdfRoutes from './routes/pdfRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import preferenceRoutes from './routes/preferenceRoutes.js';
import timetableRoutes from './routes/timetableRoutes.js';
import topicTestRoutes from './routes/topicTestRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import learningRoutes from './routes/learningRoutes.js';
import progressRoutes from './routes/progressRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';

import {
    startEmailReminderScheduler
} from './services/emailReminderScheduler.js';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/preferences', preferenceRoutes);
app.use('/api/timetable', timetableRoutes);

// Topic test routes
app.use('/api/topic-tests', topicTestRoutes);

// Chat assistant routes
app.use('/api/chat', chatRoutes);

// AI Learning workspace routes
app.use('/api/learning', learningRoutes);

// Progress and analytics routes
app.use('/api/progress', progressRoutes);

// Smart study recommendations routes
app.use('/api/recommendations', recommendationRoutes);

// Notifications and reminders routes
app.use('/api/notifications', notificationRoutes);

// Welcome route
app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to StudyPilot AI Backend!'
    });
});

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
    try {
        await connectDB();

        // Start automatic email reminders
        startEmailReminderScheduler();

        app.listen(PORT, () => {
            console.log(`StudyPilot AI server running on port ${PORT}`);
        });

    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();
