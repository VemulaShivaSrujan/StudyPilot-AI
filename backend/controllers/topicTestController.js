
import { ObjectId } from 'mongodb';

import {
    findTopicById,
    updateTopicTestStats
} from '../models/topicModel.js';

import {
    findStudyMaterialBySubject
} from '../models/studyMaterialModel.js';

import {
    createTopicTest,
    findTopicTestById,
    updateTopicTestResult,
    findTopicTestsByTopic
} from '../models/topicTestModel.js';

import {
    generateTopicQuiz
} from '../services/geminiService.js';

const TEST_DURATION = 15 * 60 * 1000;
const PASS_MARK = 60;

// Generate a test for a studied topic
export const generateTopicTest = async (req, res) => {
    try {
        const { topicId } = req.params;
        const studentId = req.studentId;

        if (!ObjectId.isValid(topicId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid topic ID.'
            });
        }

        const topic = await findTopicById(topicId, studentId);

        if (!topic) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found.'
            });
        }

        if (!topic.completed) {
            return res.status(400).json({
                success: false,
                message: 'Please mark this topic as studied before taking the test.'
            });
        }

        const material = await findStudyMaterialBySubject(
            topic.subjectId.toString(),
            studentId
        );

        if (!material || !material.extractedText) {
            return res.status(404).json({
                success: false,
                message: 'Study material not found. Please upload the subject PDF first.'
            });
        }

        const questions = await generateTopicQuiz({
            topicName: topic.topicName,
            topicDescription: topic.description || '',
            extractedText: material.extractedText
        });

        const test = await createTopicTest({
            studentId,
            subjectId: topic.subjectId,
            topicId,
            questions
        });

        const safeQuestions = questions.map((question, index) => ({
            questionNumber: index + 1,
            question: question.question,
            options: question.options
        }));

        return res.status(201).json({
            success: true,
            message: 'Topic test generated successfully.',
            testId: test.insertedId,
            topicName: topic.topicName,
            duration: 15,
            totalQuestions: safeQuestions.length,
            questions: safeQuestions
        });

    } catch (error) {
        console.error('Generate topic test error:', error.message);

        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate topic test.'
        });
    }
};


// Submit and evaluate a test
export const submitTopicTest = async (req, res) => {
    try {
        const { testId } = req.params;
        const { answers } = req.body;
        const studentId = req.studentId;

        if (!ObjectId.isValid(testId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid test ID.'
            });
        }

        if (!Array.isArray(answers)) {
            return res.status(400).json({
                success: false,
                message: 'Answers must be provided as an array.'
            });
        }

        const test = await findTopicTestById(testId, studentId);

        if (!test) {
            return res.status(404).json({
                success: false,
                message: 'Test not found.'
            });
        }

        if (test.completed) {
            return res.status(400).json({
                success: false,
                message: 'This test has already been submitted.'
            });
        }

        if (
            Date.now() - new Date(test.startedAt).getTime() >
            TEST_DURATION + 30000
        ) {
            return res.status(400).json({
                success: false,
                message: 'Test time has expired. Please generate a new test.'
            });
        }

        if (answers.length !== test.questions.length) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an answer for every question.'
            });
        }

        // -1 means the question was not answered.
        const invalidAnswer = answers.some(answer =>
            !Number.isInteger(answer) ||
            answer < -1 ||
            answer > 3
        );

        if (invalidAnswer) {
            return res.status(400).json({
                success: false,
                message: 'Invalid answer selection.'
            });
        }

        let correctAnswers = 0;

        const review = test.questions.map((question, index) => {
            const selectedAnswer = answers[index];

            const isCorrect =
                selectedAnswer !== -1 &&
                selectedAnswer === question.correctAnswer;

            if (isCorrect) {
                correctAnswers++;
            }

            return {
                questionNumber: index + 1,
                question: question.question,
                options: question.options,
                selectedAnswer,
                correctAnswer: question.correctAnswer,
                isCorrect,
                explanation: question.explanation
            };
        });

        const totalQuestions = test.questions.length;

        const score = totalQuestions > 0
            ? Math.round((correctAnswers / totalQuestions) * 100)
            : 0;

        const passed = score >= PASS_MARK;

        const updateResult = await updateTopicTestResult(
            testId,
            studentId,
            {
                score,
                correctAnswers,
                passed
            }
        );

        if (updateResult.modifiedCount !== 1) {
            return res.status(400).json({
                success: false,
                message: 'Unable to submit this test. Please try again.'
            });
        }

        // Update topic mastery and test statistics.
        await updateTopicTestStats(
            test.topicId.toString(),
            studentId,
            score,
            passed
        );

        return res.status(200).json({
            success: true,
            message: 'Test submitted successfully.',
            result: {
                score,
                correctAnswers,
                totalQuestions,
                passed,
                passMark: PASS_MARK,
                review
            }
        });

    } catch (error) {
        console.error('Submit topic test error:', error.message);

        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to submit test.'
        });
    }
};


// Get topic test history
export const getTopicTestHistory = async (req, res) => {
    try {
        const { topicId } = req.params;
        const studentId = req.studentId;

        if (!ObjectId.isValid(topicId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid topic ID.'
            });
        }

        const topic = await findTopicById(topicId, studentId);

        if (!topic) {
            return res.status(404).json({
                success: false,
                message: 'Topic not found.'
            });
        }

        const tests = await findTopicTestsByTopic(
            topicId,
            studentId
        );

        return res.status(200).json({
            success: true,
            tests: tests.map(test => ({
                id: test._id,
                score: test.score,
                correctAnswers: test.correctAnswers,
                totalQuestions: test.totalQuestions,
                passed: test.passed,
                submittedAt: test.submittedAt
            }))
        });

    } catch (error) {
        console.error('Get topic test history error:', error.message);

        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to get test history.'
        });
    }
};
