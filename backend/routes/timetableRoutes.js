
import express from 'express';

import {
    generateTimetable,
    getTimetable,
    updateTimetableSession,
    removeTimetable
} from '../controllers/timetableController.js';

import { authenticateStudent } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateStudent);

router.post('/generate', generateTimetable);

router.get('/', getTimetable);

router.patch('/sessions/:sessionId', updateTimetableSession);

router.delete('/', removeTimetable);

export default router;
