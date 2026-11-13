
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

const COLLECTION = 'topic_tests';

// Create a new topic test
export const createTopicTest = async (testData) => {
    const db = getDB();

    return await db.collection(COLLECTION).insertOne({
        studentId: new ObjectId(testData.studentId),
        subjectId: new ObjectId(testData.subjectId),
        topicId: new ObjectId(testData.topicId),

        questions: testData.questions,

        score: 0,
        correctAnswers: 0,
        totalQuestions: testData.questions.length,

        passed: false,
        completed: false,

        startedAt: new Date(),
        submittedAt: null,
        createdAt: new Date()
    });
};

// Find test by ID
export const findTopicTestById = async (testId, studentId) => {
    const db = getDB();

    return await db.collection(COLLECTION).findOne({
        _id: new ObjectId(testId),
        studentId: new ObjectId(studentId)
    });
};

// Update test result
export const updateTopicTestResult = async (
    testId,
    studentId,
    result
) => {
    const db = getDB();

    return await db.collection(COLLECTION).updateOne(
        {
            _id: new ObjectId(testId),
            studentId: new ObjectId(studentId),
            completed: false
        },
        {
            $set: {
                score: result.score,
                correctAnswers: result.correctAnswers,
                passed: result.passed,
                completed: true,
                submittedAt: new Date()
            }
        }
    );
};

// Get completed tests for a topic
export const findTopicTestsByTopic = async (
    topicId,
    studentId
) => {
    const db = getDB();

    return await db.collection(COLLECTION)
        .find({
            topicId: new ObjectId(topicId),
            studentId: new ObjectId(studentId),
            completed: true
        })
        .sort({ createdAt: -1 })
        .toArray();
};
