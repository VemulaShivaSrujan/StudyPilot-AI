import express from 'express';
import { authenticateStudent } from '../middleware/authMiddleware.js';
import { getStudyRecommendations } from '../controllers/recommendationController.js';

const router = express.Router();

router.get('/', authenticateStudent, getStudyRecommendations);

export default router;

