
import { useState } from 'react';

import {
    Bot,
    MessageCircle,
    Send,
    X,
    Minimize2,
    Sparkles,
    User,
    Loader2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../services/api';
import './ChatAssistant.css';

const ChatAssistant = () => {

    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');

    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hi! 👋 I am your StudyPilot AI assistant. Ask me anything about your studies!'
        }
    ]);

    const [loading, setLoading] = useState(false);

    const handleSendMessage = async (e) => {

        e.preventDefault();

        if (!message.trim() || loading) return;

        const userMessage = message.trim();

        // Save current conversation before adding the latest message
        const history = messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));

        setMessages(prev => [
            ...prev,
            {
                role: 'user',
                content: userMessage
            }
        ]);

        setMessage('');
        setLoading(true);

        try {

            const token = localStorage.getItem('token');

            const response = await api.post(
                '/chat',
                {
                    message: userMessage,
                    history
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {

                setMessages(prev => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: response.data.reply
                    }
                ]);

            } else {

                throw new Error('Unable to generate AI response.');

            }

        } catch (error) {

            console.error(
                'Chat assistant error:',
                error.response?.data || error.message
            );

            const errorMessage =
                error.response?.data?.message ||
                'Sorry, I could not process your question. Please try again.';

            setMessages(prev => [
                ...prev,
                {
                    role: 'assistant',
                    content: errorMessage
                }
            ]);

        } finally {

            setLoading(false);

        }
    };

    return (
        <div className="chat-assistant">

            {isOpen && (

                <div className="chat-window">

                    <div className="chat-header">

                        <div className="chat-header-info">

                            <div className="chat-avatar">
                                <Bot size={22} />
                            </div>

                            <div>
                                <h3>StudyPilot AI</h3>

                                <span>
                                    <span className="online-dot"></span>
                                    Your study assistant
                                </span>
                            </div>

                        </div>

                        <div className="chat-header-actions">

                            <button
                                onClick={() => setIsOpen(false)}
                                title="Minimize"
                            >
                                <Minimize2 size={18} />
                            </button>

                            <button
                                onClick={() => setIsOpen(false)}
                                title="Close"
                            >
                                <X size={19} />
                            </button>

                        </div>

                    </div>

                    <div className="chat-messages">

                        <div className="chat-welcome">
                            <Sparkles size={18} />
                            <span>How can I help you learn today?</span>
                        </div>

                        {messages.map((msg, index) => (

                            <div
                                key={index}
                                className={`chat-message ${msg.role}`}
                            >

                                <div className="message-avatar">

                                    {msg.role === 'assistant'
                                        ? <Bot size={17} />
                                        : <User size={17} />
                                    }

                                </div>

                                <div className="message-content">
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.content}
                                    </ReactMarkdown>
                                </div>

                            </div>

                        ))}

                        {loading && (

                            <div className="chat-message assistant">

                                <div className="message-avatar">
                                    <Bot size={17} />
                                </div>

                                <div className="message-content typing">

                                    <Loader2
                                        size={17}
                                        className="spin"
                                    />

                                    Thinking...

                                </div>

                            </div>

                        )}

                    </div>

                    <form
                        className="chat-input-area"
                        onSubmit={handleSendMessage}
                    >

                        <input
                            type="text"
                            placeholder="Ask your study question..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            disabled={loading}
                        />

                        <button
                            type="submit"
                            disabled={!message.trim() || loading}
                        >
                            <Send size={18} />
                        </button>

                    </form>

                    <div className="chat-footer">
                        Powered by StudyPilot AI
                    </div>

                </div>

            )}

            <button
                className={`chat-toggle ${isOpen ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                title="Chat with StudyPilot AI"
            >

                {isOpen
                    ? <X size={25} />
                    : <MessageCircle size={26} />
                }

            </button>

        </div>
    );
};

export default ChatAssistant;
