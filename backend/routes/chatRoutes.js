
import express from 'express';
import { authenticateStudent } from '../middleware/authMiddleware.js';
import { sendChatMessage } from '../controllers/chatController.js';

const router = express.Router();

// Send message to StudyPilot AI
router.post('/', authenticateStudent, sendChatMessage);

export default router;
