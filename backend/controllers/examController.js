
import {
    createExam,
    findExamsByStudentId,
    findExamById,
    updateExam,
    deleteExam
} from '../models/examModel.js';

import { ObjectId } from 'mongodb';

// Add a new exam
export const addExam = async (req, res) => {
    try {
        const {
            examName,
            examType,
            examDate,
            priority,
            description
        } = req.body;

        if (!examName || !examType || !examDate || !priority) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required exam details.'
            });
        }

        if (
            typeof examName !== 'string' ||
            typeof examType !== 'string' ||
            typeof priority !== 'string' ||
            typeof examDate !== 'string'
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid exam details.'
            });
        }

        const validPriorities = ['Low', 'Medium', 'High'];

        if (!validPriorities.includes(priority)) {
            return res.status(400).json({
                success: false,
                message: 'Priority must be Low, Medium, or High.'
            });
        }

        const parsedDate = new Date(examDate);

        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid exam date.'
            });
        }

        if (parsedDate < new Date(new Date().setHours(0, 0, 0, 0))) {
            return res.status(400).json({
                success: false,
                message: 'Exam date cannot be in the past.'
            });
        }

        const examData = {
            studentId: new ObjectId(req.studentId),
            examName: examName.trim(),
            examType: examType.trim(),
            examDate: parsedDate,
            priority,
            description: typeof description === 'string'
                ? description.trim()
                : ''
        };

        const result = await createExam(examData);

        return res.status(201).json({
            success: true,
            message: 'Exam added successfully!',
            exam: {
                id: result.insertedId.toString(),
                ...examData,
                studentId: req.studentId
            }
        });

    } catch (error) {
        console.error('Add exam error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to add exam.'
        });
    }
};


// Get all exams of logged-in student
export const getExams = async (req, res) => {
    try {
        const exams = await findExamsByStudentId(req.studentId);

        return res.status(200).json({
            success: true,
            count: exams.length,
            exams: exams.map((exam) => ({
                ...exam,
                id: exam._id.toString(),
                _id: undefined,
                studentId: exam.studentId.toString()
            }))
        });

    } catch (error) {
        console.error('Get exams error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to retrieve exams.'
        });
    }
};


// Update an existing exam
export const editExam = async (req, res) => {
    try {
        const { examId } = req.params;

        const {
            examName,
            examType,
            examDate,
            priority,
            description
        } = req.body;

        if (!ObjectId.isValid(examId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid exam ID.'
            });
        }

        if (!examName || !examType || !examDate || !priority) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all required exam details.'
            });
        }

        if (
            typeof examName !== 'string' ||
            typeof examType !== 'string' ||
            typeof priority !== 'string' ||
            typeof examDate !== 'string' ||
            (description !== undefined && typeof description !== 'string')
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid exam details.'
            });
        }

        if (!['Low', 'Medium', 'High'].includes(priority)) {
            return res.status(400).json({
                success: false,
                message: 'Priority must be Low, Medium, or High.'
            });
        }

        const parsedDate = new Date(examDate);

        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid exam date.'
            });
        }

        if (parsedDate < new Date(new Date().setHours(0, 0, 0, 0))) {
            return res.status(400).json({
                success: false,
                message: 'Exam date cannot be in the past.'
            });
        }

        const existingExam = await findExamById(
            examId,
            req.studentId
        );

        if (!existingExam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found.'
            });
        }

        const examData = {
            examName: examName.trim(),
            examType: examType.trim(),
            examDate: parsedDate,
            priority,
            description: typeof description === 'string'
                ? description.trim()
                : ''
        };

        await updateExam(
            examId,
            req.studentId,
            examData
        );

        return res.status(200).json({
            success: true,
            message: 'Exam updated successfully!'
        });

    } catch (error) {
        console.error('Update exam error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to update exam.'
        });
    }
};


// Delete an exam
export const removeExam = async (req, res) => {
    try {
        const { examId } = req.params;

        if (!ObjectId.isValid(examId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid exam ID.'
            });
        }

        const result = await deleteExam(
            examId,
            req.studentId
        );

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found.'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Exam deleted successfully!'
        });

    } catch (error) {
        console.error('Delete exam error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Unable to delete exam.'
        });
    }
};
