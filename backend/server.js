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

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/preferences', preferenceRoutes);

app.get('/', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to StudyPilot AI Backend!'
    });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`StudyPilot AI server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
};

startServer();