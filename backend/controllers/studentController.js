
import bcrypt from 'bcrypt';

import {
    findStudentByEmail,
    findStudentById,
    createStudent,
    deleteStudentByEmail,
    verifyStudentEmail,
    updateStudentProfile,
    updateStudentPassword
} from '../models/studentModel.js';

import {
    generateOTP,
    hashOTP,
    verifyOTP
} from '../utils/otpUtils.js';

import {
    saveOTP,
    findOTPByEmail,
    deleteOTP,
    getOTPCollection
} from '../models/otpModel.js';

import { sendEmail } from '../services/emailService.js';

import jwt from 'jsonwebtoken';

export const registerStudent = async (req, res) => {
    let normalizedEmail;
    let studentCreated = false;

    try {
        
        const { name, email, password } = req.body;

        
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email and password are required'
            });
        }

        const normalizedName = name.trim();
        normalizedEmail = email.trim().toLowerCase();

        if (
            !normalizedName ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid name and email'
            });
        }

        if (typeof password !== 'string' || password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must contain at least 8 characters'
            });
        }

        const existingStudent = await findStudentByEmail(normalizedEmail);

        if (existingStudent) {
            return res.status(409).json({
                success: false,
                message: 'Unable to register with these details'
            });
        }

        const passwordHash = await bcrypt.hash(password, 12);

        
        const studentData = {
            name: normalizedName,
            email: normalizedEmail,
            passwordHash,
            isEmailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        
        await createStudent(studentData);
        studentCreated = true;

        
        const otp = generateOTP();

    
        const otpHash = hashOTP(otp);

        
        await saveOTP(normalizedEmail, otpHash);

        
        await sendEmail(
            normalizedEmail,
            'StudyPilot AI - Email Verification',
            `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>Welcome to StudyPilot AI!</h2>

                    <p>Hello ${normalizedName},</p>

                    <p>
                        Thank you for registering with StudyPilot AI.
                        Please use the OTP below to verify your email address.
                    </p>

                    <h1 style="letter-spacing: 8px;">${otp}</h1>

                    <p>This OTP is valid for 5 minutes.</p>

                    <p>Do not share this OTP with anyone.</p>

                    <p>Study smarter. Achieve more.</p>

                    <strong>StudyPilot AI Team</strong>
                </div>
            `
        );

        
        return res.status(201).json({
            success: true,
            message: 'Registration successful. Please check your email for the verification OTP.'
        });

    } catch (error) {
        console.error('Registration error:', error.message);

        
        if (studentCreated && normalizedEmail) {
            try {
                await deleteOTP(normalizedEmail);
                await deleteStudentByEmail(normalizedEmail);
            } catch (cleanupError) {
                console.error(
                    'Registration cleanup failed:',
                    cleanupError.message
                );
            }
        }

        return res.status(500).json({
            success: false,
            message: 'Something went wrong during registration'
        });
    }
};

export const verifyStudentOTP = async (req, res) => {
    try {

        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (typeof otp !== 'string' || !/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid six-digit OTP'
            });
        }

        const student = await findStudentByEmail(normalizedEmail);

        if (!student) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification request'
            });
        }

        if (student.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        const otpRecord = await findOTPByEmail(normalizedEmail);

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'OTP not found. Please request a new OTP.'
            });
        }

        if (new Date() > otpRecord.expiresAt) {
            await deleteOTP(normalizedEmail);

            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new OTP.'
            });
        }

        if (otpRecord.attempts >= 5) {
            await deleteOTP(normalizedEmail);

            return res.status(429).json({
                success: false,
                message: 'Too many incorrect attempts. Please request a new OTP.'
            });
        }

        const isValidOTP = verifyOTP(otp, otpRecord.otpHash);

        if (!isValidOTP) {
            const otpCollection = getOTPCollection();

            await otpCollection.updateOne(
                {
                    _id: otpRecord._id,
                    attempts: otpRecord.attempts
                },
                {
                    $inc: { attempts: 1 }
                }
            );

            return res.status(400).json({
                success: false,
                message: 'Incorrect OTP. Please try again.'
            });
        }

        
    const result = await verifyStudentEmail(normalizedEmail);

    if (result.modifiedCount !== 1) {
        throw new Error('Student email verification failed');
    }

    await deleteOTP(normalizedEmail);

    const token = jwt.sign(
        {
            studentId: student._id.toString()
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '7d'
        }
    );

    return res.status(200).json({
        success: true,
        message: 'Email verified successfully! You are now logged in.',
        token,
        student: {
            id: student._id.toString(),
            name: student.name
        }
    });
    } catch (error) {
        console.error('OTP verification error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Something went wrong during OTP verification'
        });
    }
};

export const resendStudentOTP = async (req, res) => {
    try {

        const { email } = req.body;

        if (!email || typeof email !== 'string') {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const student = await findStudentByEmail(normalizedEmail);

        if (!student) {
            return res.status(400).json({
                success: false,
                message: 'Unable to process OTP request'
            });
        }

        if (student.isEmailVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        const existingOTP = await findOTPByEmail(normalizedEmail);

        if (existingOTP) {
            const timePassed =
                Date.now() - new Date(existingOTP.createdAt).getTime();

            const cooldown = 60 * 1000;

            if (timePassed < cooldown) {
                const remainingSeconds = Math.ceil(
                    (cooldown - timePassed) / 1000
                );

                return res.status(429).json({
                    success: false,
                    message: `Please wait ${remainingSeconds} seconds before requesting another OTP.`
                });
            }
        }

        const otp = generateOTP();

        const otpHash = hashOTP(otp);

        await saveOTP(normalizedEmail, otpHash);

    
        await sendEmail(
            normalizedEmail,
            'StudyPilot AI - New Verification OTP',
            `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>StudyPilot AI</h2>

                    <p>Hello ${student.name},</p>

                    <p>You requested a new email verification OTP.</p>

                    <h1 style="letter-spacing: 8px;">${otp}</h1>

                    <p>This OTP is valid for 5 minutes.</p>

                    <p>Do not share this OTP with anyone.</p>

                    <strong>StudyPilot AI Team</strong>
                </div>
            `
        );

        
        return res.status(200).json({
            success: true,
            message: 'A new OTP has been sent to your email.'
        });

    } catch (error) {
        console.error('Resend OTP error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Something went wrong while resending OTP'
        });
    }
};


export const loginStudent = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const student = await findStudentByEmail(normalizedEmail);

        if (!student) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        if (!student.isEmailVerified) {
            return res.status(403).json({
                success: false,
                message: 'Please verify your email before logging in'
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            password,
            student.passwordHash
        );

        if (!isPasswordCorrect) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const otp = generateOTP();
        const otpHash = hashOTP(otp);

        await saveOTP(
            normalizedEmail,
            otpHash,
            'login'
        );

        await sendEmail(
            normalizedEmail,
            'StudyPilot AI - Login OTP',
            `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2>StudyPilot AI</h2>
                    <p>Hello ${student.name},</p>
                    <p>Your login verification OTP is:</p>
                    <h1 style="letter-spacing: 8px;">${otp}</h1>
                    <p>This OTP is valid for 5 minutes.</p>
                    <p>Do not share this OTP with anyone.</p>
                    <strong>StudyPilot AI Team</strong>
                </div>
            `
        );

        return res.status(200).json({
            success: true,
            message: 'Login OTP sent successfully. Please verify your email.',
            email: normalizedEmail
        });

    } catch (error) {
        console.error('Login error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Something went wrong during login'
        });
    }
};

export const verifyLoginOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid 6-digit OTP'
            });
        }

        const student = await findStudentByEmail(normalizedEmail);

        if (!student || !student.isEmailVerified) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired login request'
            });
        }

        const otpRecord = await findOTPByEmail(
            normalizedEmail,
            'login'
        );

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'Login OTP not found. Please log in again.'
            });
        }

        if (new Date(otpRecord.expiresAt) < new Date()) {
            await deleteOTP(normalizedEmail, 'login');

            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please log in again.'
            });
        }

        if (otpRecord.attempts >= 5) {
            await deleteOTP(normalizedEmail, 'login');

            return res.status(429).json({
                success: false,
                message: 'Maximum OTP attempts reached. Please log in again.'
            });
        }

        const isOTPValid = verifyOTP(otp, otpRecord.otpHash);

        if (!isOTPValid) {
            await getOTPCollection().updateOne(
                {
                    _id: otpRecord._id,
                    attempts: otpRecord.attempts
                },
                {
                    $inc: { attempts: 1 }
                }
            );

            return res.status(400).json({
                success: false,
                message: 'Incorrect OTP. Please try again.'
            });
        }

        await deleteOTP(normalizedEmail, 'login');


        const token = jwt.sign(
            {
                studentId: student._id.toString()
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '7d'
            }
        );

        return res.status(200).json({
            success: true,
            message: 'Login successful!',
            token,
            student: {
                id: student._id,
                name: student.name,
                email: student.email
            }
        });

    } catch (error) {
        console.error('Login OTP verification error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Something went wrong during OTP verification'
        });
    }
};


export const getStudentProfile = async (req, res) => {
    try {
        const student = await findStudentById(req.studentId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Student profile retrieved successfully',
            student:{
                id: student._id.toString(),
                name: student.name,
                email: student.email,
                phone: student.phone || '',
                college: student.college || '',
                course: student.course || ''
            }
        });

    } catch (error) {
        console.error('Get profile error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to retrieve student profile'
        });
    }
};



export const updateStudentProfileController = async (req, res) => {
    try {
        const studentId = req.studentId;
        const { name, phone, college, course } = req.body;

        const profileData = {};

        if (name !== undefined) {
            if (typeof name !== 'string' || !name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Name cannot be empty.'
                });
            }

            profileData.name = name.trim();
        }

        if (phone !== undefined) {
            if (typeof phone !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid phone number.'
                });
            }

            profileData.phone = phone.trim();
        }

        if (college !== undefined) {
            if (typeof college !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid college.'
                });
            }

            profileData.college = college.trim();
        }

        if (course !== undefined) {
            if (typeof course !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid course.'
                });
            }

            profileData.course = course.trim();
        }

        if (Object.keys(profileData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No valid profile fields provided.'
            });
        }

        const result = await updateStudentProfile(
            studentId,
            profileData
        );

        if (result.matchedCount !== 1) {
            return res.status(404).json({
                success: false,
                message: 'Student not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully!'
        });

    } catch (error) {
        console.error('Update profile error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to update profile.'
        });
    }
};

export const changeStudentPassword = async (req, res) => {
    try {
        const studentId = req.studentId;

        const {
            currentPassword,
            newPassword,
            confirmPassword
        } = req.body;

        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'All password fields are required.'
            });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'New password must contain at least 8 characters.'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password and confirmation do not match.'
            });
        }

        const student = await findStudentById(studentId);

        if (!student) {
            return res.status(404).json({
                success: false,
                message: 'Student not found.'
            });
        }

        const isPasswordCorrect = await bcrypt.compare(
            currentPassword,
            student.passwordHash
        );

        if (!isPasswordCorrect) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect.'
            });
        }

        const isSamePassword = await bcrypt.compare(
            newPassword,
            student.passwordHash
        );

        if (isSamePassword) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from the current password.'
            });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, 12);

        await updateStudentPassword(
            studentId,
            newPasswordHash
        );

        return res.status(200).json({
            success: true,
            message: 'Password changed successfully!'
        });

    } catch (error) {
        console.error('Change password error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to change password.'
        });
    }
};