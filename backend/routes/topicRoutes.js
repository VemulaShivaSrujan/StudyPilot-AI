
import express from 'express';

import {
    addTopic,
    getTopics,
    editTopic,
    removeTopic
} from '../controllers/topicController.js';

import { authenticateStudent } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateStudent);

router.post('/', addTopic);

router.get('/subject/:subjectId', getTopics);

router.put('/:topicId', editTopic);

router.delete('/:topicId', removeTopic);

export default router;
