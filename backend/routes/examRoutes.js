
import express from 'express';

import {
    addExam,
    getExams,
    editExam,
    removeExam
} from '../controllers/examController.js';

import { authenticateStudent } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateStudent);

router.post('/', addExam);

router.get('/', getExams);

router.put('/:examId', editExam);

router.delete('/:examId', removeExam);

export default router;
