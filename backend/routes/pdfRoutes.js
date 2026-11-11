
import express from 'express';

import upload from '../middleware/uploadMiddleware.js';

import {
    uploadAndExtractPDF
} from '../controllers/pdfController.js';

import {
    authenticateStudent
} from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticateStudent);

router.post(
    '/upload',
    upload.single('pdf'),
    uploadAndExtractPDF
);

export default router;
