
import express from 'express';

import {
    authenticateStudent
} from '../middleware/authMiddleware.js';

import {
    generateLearning
} from '../controllers/learningController.js';

const router = express.Router();

// Generate AI learning content
router.post(
    '/',
    authenticateStudent,
    generateLearning
);

export default router;
