
import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

const TOPICS_COLLECTION = 'topics';

export const getTopicsCollection = () => {
    const db = getDB();
    return db.collection(TOPICS_COLLECTION);
};

// Create a new topic
export const createTopic = async (topicData) => {
    const topics = getTopicsCollection();

    return await topics.insertOne({
        ...topicData,
        completed: false,
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

// Delete a topic
export const deleteTopic = async (topicId, studentId) => {
    const topics = getTopicsCollection();

    return await topics.deleteOne({
        _id: new ObjectId(topicId),
        studentId: new ObjectId(studentId)
    });
};
