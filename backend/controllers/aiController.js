
import { extractPDFText } from '../services/pdfService.js';
import { generateTopicsFromText } from '../services/geminiService.js';

import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

export const generateTopicsFromPDF = async (req, res) => {
    try {
        // Check PDF upload
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a PDF file.'
            });
        }

        // Check subject ID
        const { subjectId } = req.body;

        if (!subjectId || !ObjectId.isValid(subjectId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subject ID.'
            });
        }

        // Verify subject belongs to logged-in student
        const db = getDB();

        const subject = await db.collection('subjects').findOne({
            _id: new ObjectId(subjectId),
            studentId: new ObjectId(req.studentId)
        });

        if (!subject) {
            return res.status(404).json({
                success: false,
                message: 'Subject not found.'
            });
        }

        // Extract PDF text
        const pdfData = await extractPDFText(req.file.buffer);

        // Generate topics using Gemini
        const topics = await generateTopicsFromText(pdfData.text);

        // Return topics for student review
        return res.status(200).json({
            success: true,
            message: 'Topics generated successfully!',
            pages: pdfData.pages,
            count: topics.length,
            topics
        });

    } catch (error) {
        console.error('AI topic generation error:', error.message);

        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to generate topics.'
        });
    }
};
