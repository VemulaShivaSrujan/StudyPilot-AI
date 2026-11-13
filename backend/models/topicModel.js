
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

const TOPICS_COLLECTION = 'topics';

export const getTopicsCollection = () => {
    const db = getDB();
    return db.collection(TOPICS_COLLECTION);
};

export const findTopicsByStudentId = async (studentId) => {
    const topics = getTopicsCollection();

    return await topics.find({
        studentId: new ObjectId(studentId)
    }).toArray();
};
// Create a new topic
export const createTopic = async (topicData) => {
    const topics = getTopicsCollection();

    return await topics.insertOne({
        ...topicData,
        completed: false,
        mastered: false,
        testStats: {
            attempts: 0,
            bestScore: 0,
            lastScore: null,
            passed: false
        },
        createdAt: new Date(),
        updatedAt: new Date()
    });
};

// Get topics belonging to a subject
export const findTopicsBySubjectId = async (subjectId, studentId) => {
    const topics = getTopicsCollection();

    return await topics.find({
        subjectId: new ObjectId(subjectId),
        studentId: new ObjectId(studentId)
    }).sort({ createdAt: 1 }).toArray();
};

// Find one topic
export const findTopicById = async (topicId, studentId) => {
    const topics = getTopicsCollection();

    return await topics.findOne({
        _id: new ObjectId(topicId),
        studentId: new ObjectId(studentId)
    });
};

// Update a topic
export const updateTopic = async (topicId, studentId, topicData) => {
    const topics = getTopicsCollection();

    return await topics.updateOne(
        {
            _id: new ObjectId(topicId),
            studentId: new ObjectId(studentId)
        },
        {
            $set: {
                ...topicData,
                updatedAt: new Date()
            }
        }
    );
};

// Update topic test statistics
export const updateTopicTestStats = async (
    topicId,
    studentId,
    score,
    passed
) => {
    const topics = getTopicsCollection();

    const topic = await findTopicById(topicId, studentId);

    if (!topic) {
        throw new Error('Topic not found.');
    }

    const previousStats = topic.testStats || {
        attempts: 0,
        bestScore: 0,
        lastScore: null,
        passed: false
    };

    return await topics.updateOne(
        {
            _id: new ObjectId(topicId),
            studentId: new ObjectId(studentId)
        },
        {
            $set: {
                mastered: topic.mastered === true || passed,
                testStats: {
                    attempts: previousStats.attempts + 1,
                    bestScore: Math.max(
                        previousStats.bestScore || 0,
                        score
                    ),
                    lastScore: score,
                    passed: topic.mastered === true || passed
                },
                updatedAt: new Date()
            }
        }
    );
};

// Delete a topic
export const deleteTopic = async (topicId, studentId) => {
    const topics = getTopicsCollection();

    return await topics.deleteOne({
        _id: new ObjectId(topicId),
        studentId: new ObjectId(studentId)
    });
};
