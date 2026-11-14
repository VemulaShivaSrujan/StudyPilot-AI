
import { useEffect, useState } from 'react';
import {
    Sparkles,
    BookOpen,
    Target,
    Clock,
    AlertCircle,
    CheckCircle2,
    Loader2,
    RefreshCw,
    CalendarDays
} from 'lucide-react';

import api from '../services/api';
import './Recommendations.css';

const Recommendations = () => {
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchRecommendations = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get('/recommendations');

            setRecommendations(response.data.recommendations || []);
        } catch (err) {
            console.error('Recommendations error:', err);

            setError(
                err.response?.data?.message ||
                'Failed to load study recommendations.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const getPriorityIcon = (priority) => {
        if (priority === 'high') return <AlertCircle size={17} />;
        if (priority === 'medium') return <Clock size={17} />;
        return <BookOpen size={17} />;
    };

    const getTypeLabel = (type) => {
        const labels = {
            revision: 'Revision Needed',
            'exam-preparation': 'Exam Preparation',
            pending: 'Pending Topic'
        };

        return labels[type] || 'Study Recommendation';
    };

    if (loading) {
        return (
            <div className="recommendations-loading">
                <Loader2 className="spin" size={35} />
                <p>Preparing your study recommendations...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="recommendations-error">
                <AlertCircle size={40} />
                <h2>Unable to Load Recommendations</h2>
                <p>{error}</p>

                <button onClick={fetchRecommendations}>
                    <RefreshCw size={17} />
                    Try Again
                </button>
            </div>
        );
    }

    const highPriority = recommendations.filter(
        item => item.priority === 'high'
    ).length;

    return (
        <div className="recommendations-page">

            <div className="recommendations-header">
                <div>
                    <div className="recommendations-title">
                        <Sparkles size={27} />
                        <h1>Smart Study Recommendations</h1>
                    </div>

                    <p>
                        Personalized study suggestions based on your
                        progress, test performance, and upcoming exams.
                    </p>
                </div>
            </div>

            <div className="recommendations-overview">
                <div className="recommendation-stat">
                    <BookOpen size={23} />
                    <div>
                        <h3>{recommendations.length}</h3>
                        <p>Total Recommendations</p>
                    </div>
                </div>

                <div className="recommendation-stat">
                    <Target size={23} />
                    <div>
                        <h3>{highPriority}</h3>
                        <p>High Priority</p>
                    </div>
                </div>
            </div>

            {recommendations.length === 0 ? (
                <div className="recommendations-empty">
                    <CheckCircle2 size={55} />

                    <h2>You're All Caught Up!</h2>

                    <p>
                        There are no pending study recommendations right now.
                        Keep learning and taking tests to receive new suggestions.
                    </p>
                </div>
            ) : (
                <div className="recommendations-list">

                    <div className="recommendations-section-heading">
                        <h2>What Should You Study Next?</h2>
                        <span>{recommendations.length} suggestions</span>
                    </div>

                    {recommendations.map((item, index) => (
                        <div
                            className="recommendation-card"
                            key={`${item.topicId}-${item.type}-${index}`}
                        >
                            <div className="recommendation-card-top">
                                <div className="recommendation-topic">
                                    <div className="recommendation-icon">
                                        {item.type === 'revision' ? (
                                            <Target size={22} />
                                        ) : item.type === 'exam-preparation' ? (
                                            <CalendarDays size={22} />
                                        ) : (
                                            <BookOpen size={22} />
                                        )}
                                    </div>

                                    <div>
                                        <h3>{item.topicName}</h3>

                                        <span>
                                            {getTypeLabel(item.type)}
                                        </span>
                                    </div>
                                </div>

                                <div className={`priority-badge ${item.priority}`}>
                                    {getPriorityIcon(item.priority)}
                                    {item.priority.toUpperCase()}
                                </div>
                            </div>

                            <p className="recommendation-reason">
                                {item.reason}
                            </p>

                            {item.subjectName && (
                                <div className="recommendation-detail">
                                    <BookOpen size={15} />
                                    {item.subjectName}
                                </div>
                            )}

                            {item.examName && (
                                <div className="recommendation-detail">
                                    <CalendarDays size={15} />
                                    {item.examName}
                                    {' · '}
                                    {item.daysLeft === 0
                                        ? 'Exam today'
                                        : `${item.daysLeft} days left`}
                                </div>
                            )}

                            {item.lastScore !== undefined && (
                                <div className="recommendation-score">
                                    Last test score: {item.lastScore}%
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
};

export default Recommendations;
