
import express from 'express';

import upload from '../middleware/uploadMiddleware.js';

import { authenticateStudent } from '../middleware/authMiddleware.js';

import {
    generateTopicsFromPDF
} from '../controllers/aiController.js';

const router = express.Router();

router.use(authenticateStudent);

router.post(
    '/generate-topics',
    upload.single('pdf'),
    generateTopicsFromPDF
);

export default router;
