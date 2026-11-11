
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

const SUBJECTS_COLLECTION = 'subjects';

export const getSubjectsCollection = () => {
    const db = getDB();
    return db.collection(SUBJECTS_COLLECTION);
};

export const createSubject = async (subjectData) => {
    const subjects = getSubjectsCollection();

    return await subjects.insertOne({
        ...subjectData,
        createdAt: new Date(),
        updatedAt: new Date()
    });
};

export const findSubjectsByExamId = async (examId, studentId) => {
    const subjects = getSubjectsCollection();

    return await subjects.find({
        examId: new ObjectId(examId),
        studentId: new ObjectId(studentId)
    })
    .sort({ createdAt: 1 })
    .toArray();
};

export const findSubjectById = async (subjectId, studentId) => {
    const subjects = getSubjectsCollection();

    return await subjects.findOne({
        _id: new ObjectId(subjectId),
        studentId: new ObjectId(studentId)
    });
};

export const updateSubject = async (
    subjectId,
    studentId,
    subjectData
) => {
    const subjects = getSubjectsCollection();

    return await subjects.updateOne(
        {
            _id: new ObjectId(subjectId),
            studentId: new ObjectId(studentId)
        },
        {
            $set: {
                ...subjectData,
                updatedAt: new Date()
            }
        }
    );
};

export const deleteSubject = async (subjectId, studentId) => {
    const subjects = getSubjectsCollection();

    return await subjects.deleteOne({
        _id: new ObjectId(subjectId),
        studentId: new ObjectId(studentId)
    });
};