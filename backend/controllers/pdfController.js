
import { extractPDFText } from '../services/pdfService.js';

export const uploadAndExtractPDF = async (req, res) => {
    try {
        // Check whether a PDF was uploaded
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload a PDF file.'
            });
        }

        // Extract text from the uploaded PDF
        const pdfData = await extractPDFText(req.file.buffer);

        return res.status(200).json({
            success: true,
            message: 'PDF uploaded and text extracted successfully!',
            pages: pdfData.pages,
            extractedText: pdfData.text
        });

    } catch (error) {
        console.error('PDF controller error:', error.message);

        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to process PDF.'
        });
    }
};
