
import { getDB } from '../config/db.js';

import { ObjectId } from 'mongodb';

const STUDENTS_COLLECTION = 'students';

export const getStudentsCollection = () => {
    const db = getDB();

    return db.collection(STUDENTS_COLLECTION);
};


export const findStudentByEmail = async (email) => {
    const students = getStudentsCollection();

    return await students.findOne({
        email: email.toLowerCase().trim()
    });
};

export const createStudent = async (studentData) => {
    const students = getStudentsCollection();

    return await students.insertOne(studentData);
};

export const deleteStudentByEmail = async (email) => {
    const students = getStudentsCollection();

    return await students.deleteOne({
        email: email.toLowerCase().trim(),
        isEmailVerified: false
    });
};

export const verifyStudentEmail = async (email) => {
    const students = getStudentsCollection();

    return await students.updateOne(
        {
            email: email.toLowerCase().trim(),
            isEmailVerified: false
        },
        {
            $set: {
                isEmailVerified: true,
                updatedAt: new Date()
            }
        }
    );
};

export const findStudentById = async (studentId) => {
    const students = getStudentsCollection();

    return await students.findOne({
        _id: new ObjectId(studentId)
    });
};

export const updateStudentProfile = async (studentId, profileData) => {
    const students = getStudentsCollection();

    return await students.updateOne(
        {
            _id: new ObjectId(studentId)
        },
        {
            $set: {
                ...profileData,
                updatedAt: new Date()
            }
        }
    );
};

export const updateStudentPassword = async (studentId, passwordHash) => {
    const students = getStudentsCollection();

    return await students.updateOne(
        {
            _id: new ObjectId(studentId)
        },
        {
            $set: {
                passwordHash,
                updatedAt: new Date()
            }
        }
    );
};