
import { ObjectId } from 'mongodb';

import {
    createTopic,
    findTopicsBySubjectId,
    findTopicById,
    updateTopic,
    deleteTopic
} from '../models/topicModel.js';

import { findSubjectById } from '../models/subjectModel.js';

// Add a new topic
export const addTopic = async (req, res) => {
    try {
        const { topicName, description, estimatedTime, subjectId } = req.body;

        if (!topicName || !subjectId) {
            return res.status(400).json({
                success: false,
                message: 'Topic name and subject are required.'
            });
        }

        if (!ObjectId.isValid(subjectId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subject ID.'
            });
        }

        const subject = await findSubjectById(subjectId, req.studentId);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found.'
            });
        }

        const topicData = {
            topicName: topicName.trim(),
            description: description?.trim() || '',
            estimatedTime: Number(estimatedTime) || 0,
            subjectId: new ObjectId(subjectId),
            studentId: new ObjectId(req.studentId)
        };

        const result = await createTopic(topicData);

        return res.status(201).json({
            success: true,
            message: 'Topic added successfully!',
            topic: {
                id: result.insertedId,
                ...topicData,
                completed: false
            }
        });

    } catch (error) {
        console.error('Add topic error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to add topic.'
        });
    }
};

// Get topics by subject
export const getTopics = async (req, res) => {
    try {
        const { subjectId } = req.params;

        if (!ObjectId.isValid(subjectId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subject ID.'
            });
        }

        const subject = await findSubjectById(subjectId, req.studentId);

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found.'
            });
        }

        const topics = await findTopicsBySubjectId(
            subjectId,
            req.studentId
        );

        return res.status(200).json({
            success: true,
            count: topics.length,
            topics: topics.map(topic => ({
                ...topic,
                id: topic._id
            }))
        });

    } catch (error) {
        console.error('Get topics error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve topics.'
        });
    }
};

// Update a topic
export const editTopic = async (req, res) => {
    try {
        const { topicId } = req.params;
        const { topicName, description, estimatedTime, completed } = req.body;

        if (!ObjectId.isValid(topicId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid topic ID.'
            });
        }

        const topic = await findTopicById(topicId, req.studentId);

        if (!topic) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found.'
            });
        }

        const updateData = {};

        if (topicName !== undefined) {
            if (typeof topicName !== 'string' || !topicName.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Topic name cannot be empty.'
                });
            }

            updateData.topicName = topicName.trim();
        }

        if (description !== undefined) {
            updateData.description = description;
        }

        if (estimatedTime !== undefined) {
            const time = Number(estimatedTime);

            if (!Number.isFinite(time) || time < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Estimated time must be a valid non-negative number.'
                });
            }

            updateData.estimatedTime = time;
        }

        if (completed !== undefined) {
            if (typeof completed !== 'boolean') {
                return res.status(400).json({
                    success: false,
                    message: 'Completed must be true or false.'
                });
            }

            updateData.completed = completed;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide at least one field to update.'
            });
        }

        const result = await updateTopic(
            topicId,
            req.studentId,
            updateData
        );

        return res.status(200).json({
            success: true,
            message: 'Topic updated successfully!'
        });

    } catch (error) {
        console.error('Edit topic error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to update topic.'
        });
    }
};

// Delete a topic
export const removeTopic = async (req, res) => {
    try {
        const { topicId } = req.params;

        if (!ObjectId.isValid(topicId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid topic ID.'
            });
        }

        const topic = await findTopicById(topicId, req.studentId);

        if (!topic) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found.'
            });
        }

        await deleteTopic(topicId, req.studentId);

        return res.status(200).json({
            success: true,
            message: 'Topic deleted successfully!'
        });

    } catch (error) {
        console.error('Delete topic error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to delete topic.'
        });
    }
};
