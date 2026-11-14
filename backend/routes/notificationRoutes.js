
import express from 'express';

import { authenticateStudent } from '../middleware/authMiddleware.js';

import { getNotifications } from '../controllers/notificationController.js';

const router = express.Router();

// Get notifications for the authenticated student
router.get('/', authenticateStudent, getNotifications);

export default router;
