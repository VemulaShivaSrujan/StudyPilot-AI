
import { findTopicsByStudentId } from '../models/topicModel.js';
import { findExamsByStudentId } from '../models/examModel.js';
import { findSubjectsByExamId } from '../models/subjectModel.js';
import { findTopicsBySubjectId } from '../models/topicModel.js';

export const getStudyRecommendations = async (req, res) => {
    try {
        const studentId = req.studentId;

        const [topics, exams] = await Promise.all([
            findTopicsByStudentId(studentId),
            findExamsByStudentId(studentId)
        ]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcomingExams = exams.filter(exam => {
            const examDate = new Date(exam.examDate);
            examDate.setHours(0, 0, 0, 0);

            return examDate >= today;
        });

        const examSubjectMap = {};

        await Promise.all(
            upcomingExams.map(async exam => {
                const subjects = await findSubjectsByExamId(
                    exam._id.toString(),
                    studentId
                );

                examSubjectMap[exam._id.toString()] = subjects;
            })
        );

        const recommendations = [];

        // 1. Identify weak topics
        topics.forEach(topic => {
            const lastScore = Number(topic.testStats?.lastScore);

            if (
                topic.completed &&
                topic.testStats?.lastScore !== null &&
                topic.testStats?.lastScore !== undefined &&
                lastScore < 60
            ) {
                recommendations.push({
                    topicId: topic._id,
                    topicName: topic.topicName,
                    subjectId: topic.subjectId,
                    priority: 'high',
                    type: 'revision',
                    reason: `Your last test score was ${lastScore}%. Revise this topic to improve your understanding.`,
                    lastScore
                });
            }
        });

        // 2. Identify pending topics for upcoming exams
        for (const exam of upcomingExams) {
            const subjects = examSubjectMap[exam._id.toString()] || [];

            for (const subject of subjects) {
                const subjectTopics = await findTopicsBySubjectId(
                    subject._id.toString(),
                    studentId
                );

                const daysLeft = Math.ceil(
                    (new Date(exam.examDate).setHours(0, 0, 0, 0) - today.getTime()) /
                    (1000 * 60 * 60 * 24)
                );

                for (const topic of subjectTopics) {
                    if (!topic.completed) {
                        recommendations.push({
                            topicId: topic._id,
                            topicName: topic.topicName,
                            subjectId: subject._id,
                            subjectName: subject.subjectName,
                            examName: exam.examName,
                            examDate: exam.examDate,
                            daysLeft,
                            priority: daysLeft <= 7 ? 'high' : 'medium',
                            type: 'exam-preparation',
                            reason: `This topic is pending and your ${exam.examName} exam is in ${daysLeft} days.`
                        });
                    }
                }
            }
        }

        // 3. Recommend other pending topics
        topics.forEach(topic => {
            if (!topic.completed) {
                const alreadyRecommended = recommendations.some(
                    item => item.topicId.toString() === topic._id.toString()
                );

                if (!alreadyRecommended) {
                    recommendations.push({
                        topicId: topic._id,
                        topicName: topic.topicName,
                        subjectId: topic.subjectId,
                        priority: 'normal',
                        type: 'pending',
                        reason: 'This topic has not been completed yet. Start studying it to maintain your progress.'
                    });
                }
            }
        });

        // Sort recommendations by priority
        const priorityOrder = {
            high: 1,
            medium: 2,
            normal: 3
        };

        recommendations.sort(
            (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
        );

        return res.status(200).json({
            success: true,
            totalRecommendations: recommendations.length,
            recommendations
        });

    } catch (error) {
        console.error('Study recommendations error:', error);

        return res.status(500).json({
            success: false,
            message: 'Failed to generate study recommendations.'
        });
    }
};
