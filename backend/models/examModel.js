
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

const EXAMS_COLLECTION = 'exams';

// Get exams collection
export const getExamsCollection = () => {
    const db = getDB();
    return db.collection(EXAMS_COLLECTION);
};

// Create a new exam
export const createExam = async (examData) => {
    const exams = getExamsCollection();

    return await exams.insertOne({
        ...examData,
        createdAt: new Date(),
        updatedAt: new Date()
    });
};

// Find all exams belonging to one student
export const findExamsByStudentId = async (studentId) => {
    const exams = getExamsCollection();

    return await exams
        .find({
            studentId: new ObjectId(studentId)
        })
        .sort({ examDate: 1 })
        .toArray();
};

// Find one exam belonging to one student
export const findExamById = async (examId, studentId) => {
    const exams = getExamsCollection();

    return await exams.findOne({
        _id: new ObjectId(examId),
        studentId: new ObjectId(studentId)
    });
};

// Update an exam
export const updateExam = async (
    examId,
    studentId,
    examData
) => {
    const exams = getExamsCollection();

    return await exams.updateOne(
        {
            _id: new ObjectId(examId),
            studentId: new ObjectId(studentId)
        },
        {
            $set: {
                ...examData,
                updatedAt: new Date()
            }
        }
    );
};

// Delete an exam
export const deleteExam = async (examId, studentId) => {
    const exams = getExamsCollection();

    return await exams.deleteOne({
        _id: new ObjectId(examId),
        studentId: new ObjectId(studentId)
    });
};
