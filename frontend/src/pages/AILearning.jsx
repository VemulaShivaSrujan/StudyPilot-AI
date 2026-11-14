
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    Sparkles,
    BookOpen,
    FileText,
    Brain,
    MessageCircle,
    Loader2
} from 'lucide-react';

import api from '../services/api';
import './AILearning.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const AILearning = () => {
    const [searchParams] = useSearchParams();

    const topicId = searchParams.get('topicId');

    const [topic, setTopic] = useState('');
    const [learningMode, setLearningMode] = useState('explain');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const learningModes = [
        {
            id: 'explain',
            label: 'Explain Topic',
            description: 'Understand concepts in simple language.',
            icon: BookOpen
        },
        {
            id: 'notes',
            label: 'Generate Notes',
            description: 'Create structured study notes.',
            icon: FileText
        },
        {
            id: 'summary',
            label: 'Summarize',
            description: 'Get concise revision material.',
            icon: Brain
        },
        {
            id: 'questions',
            label: 'Practice Questions',
            description: 'Generate questions to test yourself.',
            icon: MessageCircle
        }
    ];

    
const handleGenerate = async () => {
    if (!topic.trim()) {
        setError('Please enter a topic to continue.');
        return;
    }

    setLoading(true);
    setError('');
    setResponse('');

    try {
        const result = await api.post('/learning', {
            topic: topic.trim(),
            mode: learningMode
        });

        setResponse(result.data.content);

    } catch (error) {
        console.error('AI Learning error:', error);

        setError(
            error.response?.data?.message ||
            'Failed to generate learning content. Please try again.'
        );

    } finally {
        setLoading(false);
    }
};


    return (
        <div className="ai-learning-page">
            <div className="ai-learning-header">
                <div className="ai-learning-heading-icon">
                    <Sparkles size={28} />
                </div>

                <div>
                    <h1>AI Learning Workspace</h1>
                    <p>
                        Learn smarter with AI-powered explanations,
                        notes and practice questions.
                    </p>
                </div>
            </div>

            <div className="ai-learning-input-card">
                <label htmlFor="learning-topic">
                    What would you like to learn?
                </label>

                <textarea
                    id="learning-topic"
                    placeholder="Enter a topic, for example: JavaScript Closures..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    rows={3}
                />

                {error && (
                    <p className="ai-learning-error">{error}</p>
                )}

                <h3>Choose your learning mode</h3>

                <div className="learning-modes">
                    {learningModes.map((mode) => {
                        const Icon = mode.icon;

                        return (
                            <button
                                type="button"
                                key={mode.id}
                                className={`learning-mode ${
                                    learningMode === mode.id ? 'active' : ''
                                }`}
                                onClick={() => setLearningMode(mode.id)}
                            >
                                <Icon size={22} />

                                <strong>{mode.label}</strong>

                                <span>{mode.description}</span>
                            </button>
                        );
                    })}
                </div>

                <button
                    type="button"
                    className="generate-learning-btn"
                    onClick={handleGenerate}
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="spin" size={18} />
                            Generating...
                        </>
                    ) : (
                        <>
                            <Sparkles size={18} />
                            Start Learning
                        </>
                    )}
                </button>
            </div>

            {response && (
                <div className="ai-learning-response">
                    <h2>
                        <Sparkles size={21} />
                        AI Learning Result
                    </h2>

                    <div className="ai-learning-markdown">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {response}
                        </ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AILearning;
