
import {
    generateLearningContent
} from '../services/geminiService.js';

// ==========================================
// GENERATE AI LEARNING CONTENT
// ==========================================

export const generateLearning = async (req, res) => {
    try {
        const { topic, mode } = req.body;

        // Validate topic
        if (!topic || typeof topic !== 'string' || !topic.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Please enter a valid topic.'
            });
        }

        // Validate learning mode
        const allowedModes = [
            'explain',
            'notes',
            'summary',
            'questions'
        ];

        if (!allowedModes.includes(mode)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid learning mode.'
            });
        }

        // Generate AI learning content
        const content = await generateLearningContent({
            topic: topic.trim(),
            mode
        });

        return res.status(200).json({
            success: true,
            topic: topic.trim(),
            mode,
            content
        });

    } catch (error) {
        console.error(
            'Learning controller error:',
            error.message
        );

        return res.status(500).json({
            success: false,
            message: error.message ||
                'Failed to generate learning content.'
        });
    }
};
