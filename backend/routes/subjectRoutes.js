
import express from 'express';

import {
    addSubject,
    getSubjects,
    editSubject,
    removeSubject
} from '../controllers/subjectController.js';

import { authenticateStudent } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateStudent);

router.post('/', addSubject);

router.get('/exam/:examId', getSubjects);

router.put('/:subjectId', editSubject);

router.delete('/:subjectId', removeSubject);

export default router;
