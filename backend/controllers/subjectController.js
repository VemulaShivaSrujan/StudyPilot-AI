
import { ObjectId } from 'mongodb';

import {
    createSubject,
    findSubjectsByExamId,
    findSubjectById,
    updateSubject,
    deleteSubject
} from '../models/subjectModel.js';

import { findExamById } from '../models/examModel.js';

// Add Subject
export const addSubject = async (req, res) => {
    try {
        const { examId, subjectName, description } = req.body;

        if (!examId || !ObjectId.isValid(examId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid exam ID is required.'
            });
        }

        if (!subjectName || !subjectName.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Subject name is required.'
            });
        }

        // Check whether the exam belongs to this student
        const exam = await findExamById(
            examId,
            req.studentId
        );

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found.'
            });
        }

        const subjectData = {
            examId: new ObjectId(examId),
            studentId: new ObjectId(req.studentId),
            subjectName: subjectName.trim(),
            description: description?.trim() || ''
        };

        const result = await createSubject(subjectData);

        return res.status(201).json({
            success: true,
            message: 'Subject added successfully!',
            subject: {
                id: result.insertedId.toString(),
                ...subjectData,
                examId: examId,
                studentId: req.studentId
            }
        });

    } catch (error) {
        console.error('Add subject error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to add subject.'
        });
    }
};

// Get Subjects for an Exam
export const getSubjects = async (req, res) => {
    try {
        const { examId } = req.params;

        if (!ObjectId.isValid(examId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid exam ID is required.'
            });
        }

        const exam = await findExamById(
            examId,
            req.studentId
        );

        if (!exam) {
            return res.status(404).json({
                success: false,
                message: 'Exam not found.'
            });
        }

        const subjects = await findSubjectsByExamId(
            examId,
            req.studentId
        );

        return res.status(200).json({
            success: true,
            count: subjects.length,
            subjects: subjects.map(subject => ({
                id: subject._id.toString(),
                examId: subject.examId.toString(),
                subjectName: subject.subjectName,
                description: subject.description
            }))
        });

    } catch (error) {
        console.error('Get subjects error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve subjects.'
        });
    }
};

// Edit Subject
export const editSubject = async (req, res) => {
    try {
        const { subjectId } = req.params;
        const { subjectName, description } = req.body;

        if (!ObjectId.isValid(subjectId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid subject ID is required.'
            });
        }

        if (!subjectName || !subjectName.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Subject name is required.'
            });
        }

        const subject = await findSubjectById(
            subjectId,
            req.studentId
        );

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found.'
            });
        }

        await updateSubject(
            subjectId,
            req.studentId,
            {
                subjectName: subjectName.trim(),
                description: description?.trim() || ''
            }
        );

        return res.status(200).json({
            success: true,
            message: 'Subject updated successfully!'
        });

    } catch (error) {
        console.error('Edit subject error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to update subject.'
        });
    }
};

// Delete Subject
export const removeSubject = async (req, res) => {
    try {
        const { subjectId } = req.params;

        if (!ObjectId.isValid(subjectId)) {
            return res.status(400).json({
                success: false,
                message: 'Valid subject ID is required.'
            });
        }

        const subject = await findSubjectById(
            subjectId,
            req.studentId
        );

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found.'
            });
        }

        await deleteSubject(
            subjectId,
            req.studentId
        );

        return res.status(200).json({
            success: true,
            message: 'Subject deleted successfully!'
        });

    } catch (error) {
        console.error('Delete subject error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to delete subject.'
        });
    }
};
