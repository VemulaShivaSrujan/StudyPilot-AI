
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

const COLLECTION = 'study_materials';

// Save or replace PDF study material for a subject
export const saveStudyMaterial = async (materialData) => {
    const db = getDB();

    return await db.collection(COLLECTION).updateOne(
        {
            subjectId: new ObjectId(materialData.subjectId),
            studentId: new ObjectId(materialData.studentId)
        },
        {
            $set: {
                extractedText: materialData.extractedText,
                pages: materialData.pages,
                fileName: materialData.fileName,
                updatedAt: new Date()
            },
            $setOnInsert: {
                createdAt: new Date()
            }
        },
        { upsert: true }
    );
};

// Get PDF material for a specific subject and student
export const findStudyMaterialBySubject = async (
    subjectId,
    studentId
) => {
    const db = getDB();

    return await db.collection(COLLECTION).findOne({
        subjectId: new ObjectId(subjectId),
        studentId: new ObjectId(studentId)
    });
};
