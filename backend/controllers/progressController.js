
import { findTopicsByStudentId } from '../models/topicModel.js';
import { findTopicTestsByStudentId } from '../models/topicTestModel.js';

export const getStudentProgress = async (req, res) => {
    try {
        const studentId = req.studentId;

        const [topics, tests] = await Promise.all([
            findTopicsByStudentId(studentId),
            findTopicTestsByStudentId(studentId)
        ]);

        const totalTopics = topics.length;

        const completedTopics = topics.filter(
            topic => topic.completed
        ).length;

        const pendingTopics = totalTopics - completedTopics;

        const masteredTopics = topics.filter(
            topic => topic.mastered
        ).length;

        const completionPercentage = totalTopics
            ? Math.round((completedTopics / totalTopics) * 100)
            : 0;

        const totalTests = tests.length;

        const passedTests = tests.filter(
            test => test.passed
        ).length;

        const failedTests = totalTests - passedTests;

        const averageScore = totalTests
            ? Math.round(
                tests.reduce(
                    (total, test) => total + (Number(test.score) || 0),
                    0
                ) / totalTests
            )
            : 0;

        const passRate = totalTests
            ? Math.round((passedTests / totalTests) * 100)
            : 0;

        const weakTopics = topics
            .filter(topic =>
                topic.completed &&
                topic.testStats?.lastScore !== null &&
                topic.testStats?.lastScore !== undefined &&
                Number(topic.testStats.lastScore) < 60
            )
            .map(topic => ({
                id: topic._id.toString(),
                topicName: topic.topicName,
                lastScore: Number(topic.testStats.lastScore)
            }));

        const recentTests = tests.slice(0, 5).map(test => {
            const topic = topics.find(
                item => item._id.toString() === test.topicId.toString()
            );

            return {
                id: test._id.toString(),
                topicName: topic?.topicName || 'Unknown Topic',
                score: test.score,
                correctAnswers: test.correctAnswers,
                totalQuestions: test.totalQuestions,
                passed: test.passed,
                submittedAt: test.submittedAt
            };
        });

        return res.status(200).json({
            success: true,
            overview: {
                totalTopics,
                completedTopics,
                pendingTopics,
                masteredTopics,
                completionPercentage,
                totalTests,
                passedTests,
                failedTests,
                averageScore,
                passRate
            },
            weakTopics,
            recentTests
        });

    } catch (error) {
        console.error('Get student progress error:', error.message);

        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve student progress.'
        });
    }
};
