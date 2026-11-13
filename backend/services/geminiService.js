
import { GoogleGenAI } from '@google/genai';

// ==========================================
// GENERATE TOPICS FROM PDF TEXT
// ==========================================

export const generateTopicsFromText = async (extractedText) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error(
                'GEMINI_API_KEY is missing. Check your backend .env file.'
            );
        }

        const ai = new GoogleGenAI({ apiKey });

        if (!extractedText || extractedText.trim().length < 50) {
            throw new Error(
                'Not enough text to generate study topics.'
            );
        }

        const documentText = extractedText.slice(0, 100000);

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

        let response;
        let lastError;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(
                    `Gemini generation attempt ${attempt}/3`
                );

                response = await ai.models.generateContent({
                    model: 'gemini-3.5-flash-lite',
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

        const topics = JSON.parse(response.text);

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


// ==========================================
// GENERATE TOPIC-SPECIFIC QUIZ
// ==========================================

export const generateTopicQuiz = async ({
    topicName,
    topicDescription,
    extractedText
}) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error(
                'GEMINI_API_KEY is missing. Check your backend .env file.'
            );
        }

        const ai = new GoogleGenAI({ apiKey });

        if (!topicName || !topicDescription || !extractedText) {
            throw new Error(
                'Topic information and PDF study material are required.'
            );
        }

        if (extractedText.trim().length < 50) {
            throw new Error(
                'Not enough PDF content to generate a quiz.'
            );
        }

        const documentText = extractedText.slice(0, 100000);

        const prompt = `
You are an expert educational examination creator.

Create exactly 10 multiple-choice questions for the following topic.

TOPIC:
${topicName}

TOPIC DESCRIPTION:
${topicDescription}

STUDY MATERIAL:
${documentText}

RULES:

1. Generate exactly 10 questions.
2. Every question must have exactly 4 options.
3. Only one option must be correct.
4. Questions must be medium difficulty.
5. Questions must test understanding and knowledge.
6. Include conceptual and application-based questions.
7. Questions must be relevant to the selected topic.
8. Use the PDF content as the primary source.
9. Do not invent facts that are not supported by the PDF.
10. Avoid duplicate or very similar questions.
11. correctAnswer must be the zero-based index of the correct option.
12. Provide a clear explanation for each correct answer.
13. Do not reveal the correct answer in the question text.

Return only valid JSON matching the requested schema.
`;

        let response;
        let lastError;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                console.log(
                    `Gemini quiz generation attempt ${attempt}/3`
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
                                    question: {
                                        type: 'STRING'
                                    },
                                    options: {
                                        type: 'ARRAY',
                                        items: {
                                            type: 'STRING'
                                        }
                                    },
                                    correctAnswer: {
                                        type: 'INTEGER'
                                    },
                                    explanation: {
                                        type: 'STRING'
                                    }
                                },
                                required: [
                                    'question',
                                    'options',
                                    'correctAnswer',
                                    'explanation'
                                ]
                            }
                        }
                    }
                });

                break;

            } catch (error) {
                lastError = error;

                console.error(
                    `Gemini quiz attempt ${attempt} failed:`,
                    error.message
                );

                if (attempt === 3) {
                    throw error;
                }

                const delay = attempt * 3000;

                console.log(
                    `Retrying quiz generation in ${delay / 1000} seconds...`
                );

                await new Promise(resolve =>
                    setTimeout(resolve, delay)
                );
            }
        }

        if (!response) {
            throw lastError || new Error(
                'Gemini quiz generation failed.'
            );
        }

        const questions = JSON.parse(response.text);

        if (
            !Array.isArray(questions) ||
            questions.length !== 10
        ) {
            throw new Error(
                'Gemini did not generate exactly 10 questions.'
            );
        }

        for (const question of questions) {
            if (
                typeof question.question !== 'string' ||
                !question.question.trim() ||
                !Array.isArray(question.options) ||
                question.options.length !== 4 ||
                question.options.some(
                    option =>
                        typeof option !== 'string' ||
                        !option.trim()
                ) ||
                !Number.isInteger(question.correctAnswer) ||
                question.correctAnswer < 0 ||
                question.correctAnswer > 3 ||
                typeof question.explanation !== 'string' ||
                !question.explanation.trim()
            ) {
                throw new Error(
                    'Gemini generated an invalid quiz question.'
                );
            }
        }

        console.log(
            `Successfully generated ${questions.length} quiz questions for ${topicName}.`
        );

        return questions;

    } catch (error) {
        console.error(
            'Gemini quiz generation error:',
            error.message
        );

        throw error;
    }
};


// ==========================================
// GENERATE AI CHAT ASSISTANT RESPONSE
// ==========================================

export const generateChatResponse = async ({
    message,
    history = [],
    studyContext = ''
}) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is missing.');
        }

        if (!message || !message.trim()) {
            throw new Error('Please enter a message.');
        }

        const ai = new GoogleGenAI({ apiKey });

        const conversationHistory = history
            .slice(-10)
            .map(item => {
                const role = item.role === 'assistant'
                    ? 'Assistant'
                    : 'Student';

                return `${role}: ${item.content}`;
            })
            .join('\n');

        const prompt = `
You are StudyPilot AI, a friendly and knowledgeable
educational assistant.

Your responsibilities:
1. Help students understand difficult concepts.
2. Explain topics in simple language.
3. Give examples when useful.
4. Help with exam preparation.
5. Provide study tips and learning strategies.
6. Answer programming and academic questions.
7. Keep answers clear and well structured.
8. If a question is unrelated to education, politely
   answer briefly and guide the student back to learning.

IMPORTANT STUDENT DATA:

The following information comes from the authenticated
student's actual StudyPilot account.

Use it when relevant.
Never invent timetable sessions, subjects, topics, or times.

${studyContext || 'No additional student data is available.'}

Previous conversation:
${conversationHistory || 'No previous conversation.'}

Student's latest question:
${message}

Provide a helpful and accurate response.

If the student asks about today's plan, use the actual
study schedule above.

If no sessions are scheduled or no timetable exists,
clearly explain that instead of making up a schedule.
`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents: prompt
        });

        const answer = response.text;

        if (!answer || !answer.trim()) {
            throw new Error('AI returned an empty response.');
        }

        return answer.trim();

    } catch (error) {
        console.error(
            'Gemini chatbot error:',
            error.message
        );

        throw error;
    }
};