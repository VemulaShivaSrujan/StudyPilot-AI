
import { PDFParse } from 'pdf-parse';

export const extractPDFText = async (fileBuffer) => {
    let parser;

    try {
        if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
            throw new Error('Invalid PDF file.');
        }

        parser = new PDFParse({
            data: fileBuffer
        });

        const pdfData = await parser.getText();

        const extractedText = pdfData.text.trim();

        if (!extractedText) {
            throw new Error(
                'No readable text found in this PDF. Please upload a text-based PDF.'
            );
        }

        return {
            text: extractedText,
            pages: pdfData.total
        };

    } catch (error) {
        console.error('PDF extraction error:', error.message);
        throw error;

    } finally {
        if (parser) {
            await parser.destroy();
        }
    }
};
