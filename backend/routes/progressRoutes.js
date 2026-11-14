import express from 'express';
import { authenticateStudent } from '../middleware/authMiddleware.js';
import { getStudentProgress } from '../controllers/progressController.js';

const router = express.Router();

router.get('/', authenticateStudent, getStudentProgress);

export default router;