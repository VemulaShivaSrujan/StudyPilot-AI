
import express from 'express';

import { authenticateStudent } from '../middleware/authMiddleware.js';

import {
    registerStudent,
    verifyStudentOTP,
    resendStudentOTP,
    loginStudent,
    verifyLoginOTP,
    getStudentProfile,
    updateStudentProfileController,
    changeStudentPassword
} from '../controllers/studentController.js';

const router = express.Router();

router.post('/register', registerStudent);

router.post('/verify-otp', verifyStudentOTP);

router.post('/resend-otp', resendStudentOTP);

router.post('/login', loginStudent);

router.post('/verify-login-otp', verifyLoginOTP);

router.get(
    '/profile',
    authenticateStudent,
    getStudentProfile
);

router.put(
    '/profile',
    authenticateStudent,
    updateStudentProfileController
);

router.put(
    '/change-password',
    authenticateStudent,
    changeStudentPassword
);

export default router;
