
import { useEffect, useMemo, useState } from 'react';
import {
    Clock,
    BookOpen,
    CalendarDays,
    Target,
    ArrowRight,
    GraduationCap,
    CheckCircle2,
    Circle,
    Loader2,
    AlertCircle,
    RefreshCw,
    Sparkles
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Dashboard.css';

const getLocalDate = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
};

const getExamDate = (exam) => {
    return exam.examDate || exam.date || exam.examinationDate || '';
};

const Dashboard = () => {
    const { student } = useAuth();

    const [exams, setExams] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const today = new Date();
    const todayString = getLocalDate(today);

    const formattedToday = today.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('token');

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            const [examResponse, timetableResponse] = await Promise.all([
                api.get('/exams', config),
                api.get('/timetable', config).catch((err) => {
                    if (err.response?.status === 404) {
                        return { data: { timetable: { sessions: [] } } };
                    }
                    throw err;
                })
            ]);

            setExams(examResponse.data.exams || []);

            setSessions(
                timetableResponse.data.timetable?.sessions || []
            );

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to load dashboard information.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const todaySessions = useMemo(() => {
        return sessions
            .filter((session) => session.date === todayString)
            .sort((a, b) =>
                (a.startTime || '').localeCompare(b.startTime || '')
            );
    }, [sessions, todayString]);

    const upcomingExams = useMemo(() => {
        return exams
            .filter((exam) => {
                const date = getExamDate(exam);
                return date && date.slice(0, 10) >= todayString;
            })
            .sort((a, b) =>
                getExamDate(a).localeCompare(getExamDate(b))
            );
    }, [exams, todayString]);

    const completedSessions = sessions.filter(
        (session) => session.completed
    ).length;

    const totalSessions = sessions.length;

    const studyProgress = totalSessions
        ? Math.round((completedSessions / totalSessions) * 100)
        : 0;

    const completedStudyMinutes = todaySessions
        .filter((session) => session.completed)
        .reduce(
            (total, session) => total + Number(session.duration || 0),
            0
        );

    const formatStudyTime = (minutes) => {
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;

        if (hours === 0) return `${remainingMinutes} min`;
        if (remainingMinutes === 0) return `${hours} Hours`;

        return `${hours}h ${remainingMinutes}m`;
    };

    const getDaysRemaining = (date) => {
        const examDate = new Date(`${date.slice(0, 10)}T00:00:00`);
        const currentDate = new Date(`${todayString}T00:00:00`);

        return Math.ceil(
            (examDate - currentDate) / (1000 * 60 * 60 * 24)
        );
    };

    const formatExamDate = (date) => {
        if (!date) return '';

        const [year, month, day] = date.slice(0, 10)
            .split('-')
            .map(Number);

        return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const stats = [
        {
            title: "Today's Study Time",
            value: formatStudyTime(completedStudyMinutes),
            icon: Clock,
            description: 'Completed study time today'
        },
        {
            title: 'Upcoming Exams',
            value: upcomingExams.length,
            icon: CalendarDays,
            description: 'Examinations scheduled'
        },
        {
            title: 'Completed Sessions',
            value: completedSessions,
            icon: BookOpen,
            description: `Out of ${totalSessions} total sessions`
        },
        {
            title: 'Study Progress',
            value: `${studyProgress}%`,
            icon: Target,
            description: 'Overall timetable completion'
        }
    ];

    if (loading) {
        return (
            <div className="dashboard">
                <div className="dashboard-loading">
                    <Loader2 size={32} className="dashboard-spin" />
                    <p>Loading your study dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">

            {/* Dashboard Header */}
            <div className="dashboard-header">
                <div>
                    <span className="dashboard-label">YOUR STUDY OVERVIEW</span>

                    <h1>
                        Welcome back, {student?.name || 'Student'}! 👋
                    </h1>

                    <p>Let's make today a productive study day.</p>

                    <small>{formattedToday}</small>
                </div>

                <button
                    className="dashboard-refresh-btn"
                    onClick={fetchDashboardData}
                    disabled={loading}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="dashboard-error">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Statistics */}
            <div className="stats-grid">
                {stats.map((stat, index) => {
                    const Icon = stat.icon;

                    return (
                        <div className="stat-card" key={index}>
                            <div className="stat-icon">
                                <Icon size={24} />
                            </div>

                            <h3>{stat.title}</h3>
                            <h2>{stat.value}</h2>
                            <small>{stat.description}</small>
                        </div>
                    );
                })}
            </div>

            {/* Overall Progress */}
            <div className="dashboard-progress-card">
                <div className="dashboard-progress-heading">
                    <div>
                        <h2>Overall Study Progress</h2>
                        <p>
                            {completedSessions} of {totalSessions} sessions
                            completed
                        </p>
                    </div>

                    <strong>{studyProgress}%</strong>
                </div>

                <div className="dashboard-progress-track">
                    <div
                        className="dashboard-progress-fill"
                        style={{ width: `${studyProgress}%` }}
                    />
                </div>
            </div>

            {/* Smart Study Recommendations */}
            <div className="dashboard-recommendations-card">
                <div className="dashboard-recommendations-content">
                    <div className="dashboard-recommendations-icon">
                        <Sparkles size={25} />
                    </div>

                    <div>
                        <h2>Smart Study Recommendations</h2>
                        <p>
                            Discover which topics you should study next based on
                            your performance, weak areas, and upcoming examinations.
                        </p>
                    </div>
                </div>

                <Link
                    to="/recommendations"
                    className="dashboard-recommendations-button"
                >
                    View Recommendations
                    <ArrowRight size={17} />
                </Link>
            </div>

            {/* Dashboard Sections */}
            <div className="dashboard-sections">

                {/* Today's Study Plan */}
                <div className="dashboard-card">
                    <div className="dashboard-card-heading">
                        <Clock size={23} />
                        <h2>Today's Study Plan</h2>
                    </div>

                    {todaySessions.length > 0 ? (
                        <div className="dashboard-today-sessions">
                            {todaySessions.map((session) => (
                                <div
                                    className="dashboard-today-session"
                                    key={session.sessionId}
                                >
                                    <div className="dashboard-session-status">
                                        {session.completed ? (
                                            <CheckCircle2
                                                size={20}
                                                className="dashboard-completed-icon"
                                            />
                                        ) : (
                                            <Circle size={20} />
                                        )}
                                    </div>

                                    <div className="dashboard-session-info">
                                        <h3>{session.topicName}</h3>
                                        <p>
                                            {session.subjectName}
                                            {' · '}
                                            {session.examName}
                                        </p>
                                        <span>
                                            {session.startTime} – {session.endTime}
                                            {' · '}
                                            {session.duration} min
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>
                            No study sessions scheduled for today.
                            Generate your combined timetable to start planning.
                        </p>
                    )}

                    <Link to="/timetable" className="dashboard-button">
                        View Timetable
                        <ArrowRight size={16} />
                    </Link>
                </div>

                {/* Upcoming Exams */}
                <div className="dashboard-card">
                    <div className="dashboard-card-heading">
                        <GraduationCap size={23} />
                        <h2>Upcoming Examinations</h2>
                    </div>

                    {upcomingExams.length > 0 ? (
                        <div className="dashboard-upcoming-exams">
                            {upcomingExams.slice(0, 5).map((exam) => {
                                const examDate = getExamDate(exam);
                                const daysRemaining = getDaysRemaining(examDate);

                                return (
                                    <div
                                        className="dashboard-exam-item"
                                        key={exam.id || exam._id}
                                    >
                                        <div>
                                            <h3>{exam.examName}</h3>
                                            <span>
                                                {formatExamDate(examDate)}
                                            </span>
                                        </div>

                                        <strong>
                                            {daysRemaining === 0
                                                ? 'Today'
                                                : daysRemaining === 1
                                                    ? '1 day left'
                                                    : `${daysRemaining} days left`}
                                        </strong>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p>
                            No upcoming examinations found.
                            Add an examination to track your preparation.
                        </p>
                    )}

                    <Link to="/exams" className="dashboard-button">
                        View Examinations
                        <ArrowRight size={16} />
                    </Link>
                </div>

            </div>

        </div>
    );
};

export default Dashboard;
