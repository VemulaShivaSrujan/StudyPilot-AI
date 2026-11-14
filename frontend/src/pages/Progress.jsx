import { useEffect, useState } from 'react';

import {
    Target,
    BookOpen,
    CheckCircle2,
    Clock,
    Trophy,
    TrendingUp,
    AlertCircle,
    Loader2,
    RefreshCw
} from 'lucide-react';

import api from '../services/api';
import './Progress.css';

const Progress = () => {
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchProgress = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get('/progress');

            setProgress(response.data);

        } catch (err) {
            console.error('Progress fetching error:', err);

            setError(
                err.response?.data?.message ||
                'Failed to load your progress.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProgress();
    }, []);

    if (loading) {
        return (
            <div className="progress-loading">
                <Loader2 className="spin" size={35} />
                <p>Loading your progress...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="progress-error">
                <AlertCircle size={35} />
                <p>{error}</p>
                <button onClick={fetchProgress}>
                    Try Again
                </button>
            </div>
        );
    }

    const overview = progress?.overview || {};

    const stats = [
        {
            label: 'Total Topics',
            value: overview.totalTopics || 0,
            icon: BookOpen,
            color: 'blue'
        },
        {
            label: 'Completed Topics',
            value: overview.completedTopics || 0,
            icon: CheckCircle2,
            color: 'green'
        },
        {
            label: 'Pending Topics',
            value: overview.pendingTopics || 0,
            icon: Clock,
            color: 'orange'
        },
        {
            label: 'Mastered Topics',
            value: overview.masteredTopics || 0,
            icon: Trophy,
            color: 'purple'
        },
        {
            label: 'Tests Attempted',
            value: overview.totalTests || 0,
            icon: Target,
            color: 'pink'
        },
        {
            label: 'Average Score',
            value: `${overview.averageScore || 0}%`,
            icon: TrendingUp,
            color: 'cyan'
        }
    ];

    return (
        <div className="progress-page">

            <div className="progress-header">
                <div>
                    <h1>My Progress</h1>
                    <p>
                        Track your learning journey and academic performance.
                    </p>
                </div>

                <button
                    className="progress-refresh"
                    onClick={fetchProgress}
                >
                    <RefreshCw size={17} />
                    Refresh
                </button>
            </div>

            <div className="progress-stats-grid">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;

                    return (
                        <div
                            className="progress-stat-card"
                            key={index}
                        >
                            <div className={`progress-stat-icon ${stat.color}`}>
                                <Icon size={23} />
                            </div>

                            <div>
                                <p>{stat.label}</p>
                                <h2>{stat.value}</h2>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="progress-main-grid">

                <div className="progress-card">
                    <h2>
                        <Target size={21} />
                        Topic Completion
                    </h2>

                    <div
                        className="completion-circle"
                        style={{
                            '--completion': overview.completionPercentage || 0
                        }}
                    >
                        <div className="completion-circle-inner">
                            <strong>
                                {overview.completionPercentage || 0}%
                            </strong>
                            <span>Completed</span>
                        </div>
                    </div>

                    <p className="completion-description">
                        You have completed {overview.completedTopics || 0} out of{' '}
                        {overview.totalTopics || 0} topics.
                    </p>
                </div>

                <div className="progress-card">
                    <h2>
                        <TrendingUp size={21} />
                        Test Performance
                    </h2>

                    <div className="performance-row">
                        <span>Average Score</span>
                        <strong>{overview.averageScore || 0}%</strong>
                    </div>

                    <div className="performance-row">
                        <span>Passed Tests</span>
                        <strong className="passed-value">
                            {overview.passedTests || 0}
                        </strong>
                    </div>

                    <div className="performance-row">
                        <span>Failed Tests</span>
                        <strong className="failed-value">
                            {overview.failedTests || 0}
                        </strong>
                    </div>

                    <div className="performance-row">
                        <span>Pass Rate</span>
                        <strong>{overview.passRate || 0}%</strong>
                    </div>
                </div>

            </div>

            <div className="progress-card progress-section">
                <h2>
                    <AlertCircle size={21} />
                    Topics That Need Attention
                </h2>

                {progress?.weakTopics?.length > 0 ? (
                    <div className="weak-topics-list">
                        {progress.weakTopics.map(topic => (
                            <div
                                className="weak-topic-item"
                                key={String(topic.id)}
                            >
                                <div>
                                    <strong>{topic.topicName}</strong>
                                    <p>Last test score</p>
                                </div>

                                <span className="weak-topic-score">
                                    {topic.lastScore}%
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="progress-empty">
                        No weak topics found. Keep up the good work!
                    </p>
                )}
            </div>

            <div className="progress-card progress-section">
                <h2>
                    <Clock size={21} />
                    Recent Test History
                </h2>

                {progress?.recentTests?.length > 0 ? (
                    <div className="recent-tests-list">
                        {progress.recentTests.map(test => (
                            <div
                                className="recent-test-item"
                                key={String(test.id)}
                            >
                                <div>
                                    <strong>
                                        Topic Test
                                    </strong>
                                    <p>
                                        {test.correctAnswers} correct out of{' '}
                                        {test.totalQuestions} questions
                                    </p>
                                    <small>
                                        {test.submittedAt
                                            ? new Date(test.submittedAt).toLocaleDateString()
                                            : 'Date unavailable'}
                                    </small>
                                </div>

                                <div className="recent-test-result">
                                    <strong>{test.score}%</strong>
                                    <span className={test.passed ? 'test-passed' : 'test-failed'}>
                                        {test.passed ? 'Passed' : 'Failed'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="progress-empty">
                        You haven't completed any tests yet.
                    </p>
                )}
            </div>

        </div>
    );
};

export default Progress;