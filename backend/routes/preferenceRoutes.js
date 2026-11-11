
import express from 'express';

import {
    getStudentPreferences,
    updateStudentPreferences
} from '../controllers/preferenceController.js';

import { authenticateStudent } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateStudent);

router.get('/', getStudentPreferences);

router.put('/', updateStudentPreferences);

export default router;
