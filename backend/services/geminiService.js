
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
            throw new Error('GEMINI_API_KEY is missing.');
        }

        if (!topicName || !extractedText || extractedText.trim().length < 50) {
            throw new Error('Valid topic information and PDF content are required.');
        }

        const ai = new GoogleGenAI({
            apiKey,
            httpOptions: {
                timeout: 60000,
                retryOptions: {
                    attempts: 1
                }
            }
        });

        const documentText = extractedText.slice(0, 10000);

        const prompt = `
You are StudyPilot AI, an educational quiz creator.

Create exactly 5 medium-difficulty multiple-choice questions.

Topic: ${topicName}

Description: ${topicDescription || 'Not provided'}

Study material:
${documentText}

Rules:
- Generate exactly 5 questions.
- Each question must have exactly 4 options.
- Only one option must be correct.
- Include conceptual and application-based questions.
- Use the supplied study material as the primary source.
- Avoid duplicate questions.
- correctAnswer must be the zero-based index (0-3).
- Include an explanation for each answer.

Return only valid JSON matching the requested schema.
`;

        console.log('Starting Gemini quiz generation...');

        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: 'ARRAY',
                    items: {
                        type: 'OBJECT',
                        properties: {
                            question: { type: 'STRING' },
                            options: {
                                type: 'ARRAY',
                                items: { type: 'STRING' }
                            },
                            correctAnswer: { type: 'INTEGER' },
                            explanation: { type: 'STRING' }
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

        const questions = JSON.parse(response.text);

        if (!Array.isArray(questions) || questions.length !== 5) {
            throw new Error('Gemini did not generate exactly 5 questions.');
        }

        for (const question of questions) {
            if (
                typeof question.question !== 'string' ||
                !question.question.trim() ||
                !Array.isArray(question.options) ||
                question.options.length !== 4 ||
                question.options.some(option =>
                    typeof option !== 'string' || !option.trim()
                ) ||
                !Number.isInteger(question.correctAnswer) ||
                question.correctAnswer < 0 ||
                question.correctAnswer > 3 ||
                typeof question.explanation !== 'string' ||
                !question.explanation.trim()
            ) {
                throw new Error('Gemini generated an invalid quiz question.');
            }
        }

        console.log(`Successfully generated ${questions.length} quiz questions.`);

        return questions;

    } catch (error) {
        console.error('Gemini quiz generation error:', error.message);
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


// ==========================================
// GENERATE AI LEARNING CONTENT
// ==========================================

export const generateLearningContent = async ({
    topic,
    mode
}) => {
    try {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is missing.');
        }

        if (!topic || !topic.trim()) {
            throw new Error('Please provide a topic.');
        }

        const learningPrompts = {
            explain: `
Explain "${topic}" to a student in simple language.

Include:
1. Introduction
2. Important concepts
3. Step-by-step explanation
4. Practical examples
5. Real-world applications
6. Key points to remember
`,

            notes: `
Generate detailed and well-organized study notes about "${topic}".

Include:
1. Topic introduction
2. Important definitions
3. Main concepts
4. Detailed explanations
5. Examples
6. Important points for exams
7. Quick revision notes
`,

            summary: `
Create a concise study summary about "${topic}".

Include:
1. Overview
2. Main concepts
3. Important definitions
4. Key takeaways
5. Quick revision points

Keep the summary easy to understand.
`,

            questions: `
Generate 10 practice questions about "${topic}".

Include:
1. A mixture of conceptual and application-based questions.
2. Different difficulty levels.
3. Four options for each question.
4. The correct answer.
5. A short explanation.

Present the questions in a clear format.
`
        };

        if (!learningPrompts[mode]) {
            throw new Error('Invalid learning mode.');
        }

        const ai = new GoogleGenAI({ apiKey });

        const prompt = `
You are StudyPilot AI, an expert educational tutor.

Your task is to help students learn effectively.

${learningPrompts[mode]}

IMPORTANT RULES:
- Use clear and simple language.
- Organize the response with headings.
- Use examples wherever useful.
- Avoid unnecessary repetition.
- Make the response educational and accurate.
- Format the response using Markdown.

Return only the learning content.
`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.5-flash-lite',
            contents: prompt
        });

        const content = response.text;

        if (!content || !content.trim()) {
            throw new Error('AI returned an empty learning response.');
        }

        return content.trim();

    } catch (error) {
        console.error(
            'Gemini learning generation error:',
            error.message
        );

        throw error;
    }
};
