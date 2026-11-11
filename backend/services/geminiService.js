
import { GoogleGenAI } from '@google/genai';

export const generateTopicsFromText = async (extractedText) => {
    try {
        // Check Gemini API key
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error(
                'GEMINI_API_KEY is missing. Check your backend .env file.'
            );
        }

        const ai = new GoogleGenAI({ apiKey });

        // Validate extracted PDF text
        if (!extractedText || extractedText.trim().length < 50) {
            throw new Error(
                'Not enough text to generate study topics.'
            );
        }

        // Limit input size
        const documentText = extractedText.slice(0, 100000);

        // Gemini prompt
        const prompt = `
You are an expert educational assistant.

Analyze this study material and generate 5 to 25
important study topics.

Rules:
1. Identify the main topics.
2. Avoid duplicate topics.
3. Keep topics relevant to the document.
4. Give a short explanation for each topic.
5. Estimate study time in minutes.
6. Do not invent unrelated topics.
7. Return topics in a logical learning order.

Study material:
${documentText}
`;

        // Retry Gemini API up to 3 times
        let response;
        let lastError;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(
                    `Gemini generation attempt ${attempt}/3`
                );

                response = await ai.models.generateContent({
                    model: 'gemini-3.8-flash',
                    contents: prompt,
                    config: {
                        thinkingConfig: {
                            thinkingLevel: 'low'
                        },
                        responseMimeType: 'application/json',
                        responseSchema: {
                            type: 'ARRAY',
                            items: {
                                type: 'OBJECT',
                                properties: {
                                    topicName: {
                                        type: 'STRING'
                                    },
                                    description: {
                                        type: 'STRING'
                                    },
                                    estimatedTime: {
                                        type: 'INTEGER'
                                    }
                                },
                                required: [
                                    'topicName',
                                    'description',
                                    'estimatedTime'
                                ]
                            }
                        }
                    }
                });

                // Successful response
                break;

            } catch (error) {
                lastError = error;

                console.error(
                    `Gemini attempt ${attempt} failed:`,
                    error.message
                );

                if (attempt === 3) {
                    throw error;
                }

                // Wait before retrying
                const delay = attempt * 3000;

                console.log(
                    `Retrying Gemini in ${delay / 1000} seconds...`
                );

                await new Promise(resolve =>
                    setTimeout(resolve, delay)
                );
            }
        }

        if (!response) {
            throw lastError || new Error(
                'Gemini generation failed.'
            );
        }

        // Parse generated JSON
        const topics = JSON.parse(response.text);

        // Validate generated topics
        if (!Array.isArray(topics) || topics.length === 0) {
            throw new Error(
                'Gemini did not generate valid topics.'
            );
        }

        if (topics.length > 25) {
            throw new Error(
                'Gemini generated too many topics.'
            );
        }

        for (const topic of topics) {
            if (
                typeof topic.topicName !== 'string' ||
                !topic.topicName.trim() ||
                typeof topic.description !== 'string' ||
                !topic.description.trim() ||
                !Number.isInteger(topic.estimatedTime) ||
                topic.estimatedTime <= 0
            ) {
                throw new Error(
                    'Gemini generated an invalid topic structure.'
                );
            }
        }

        console.log(
            `Successfully generated ${topics.length} topics.`
        );

        return topics;

    } catch (error) {
        console.error(
            'Gemini topic generation error:',
            error.message
        );

        throw error;
    }
};
