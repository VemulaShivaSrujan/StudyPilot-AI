
import express from 'express';

import { authenticateStudent } from '../middleware/authMiddleware.js';

import {
    generateTopicTest,
    submitTopicTest,
    getTopicTestHistory
} from '../controllers/topicTestController.js';

const router = express.Router();

router.use(authenticateStudent);

// Generate a test for a topic
router.post(
    '/generate/:topicId',
    generateTopicTest
);

// Submit test answers
router.post(
    '/submit/:testId',
    submitTopicTest
);

// Get previous test attempts
router.get(
    '/history/:topicId',
    getTopicTestHistory
);

export default router;
