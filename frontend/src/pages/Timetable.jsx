
import { useEffect, useMemo, useState } from 'react';
import {
    CalendarDays,
    Clock,
    CheckCircle2,
    Circle,
    Trash2,
    Loader2,
    BookOpen,
    AlertCircle,
    RefreshCw
} from 'lucide-react';

import api from '../services/api';
import './Timetable.css';

const Timetable = () => {
    const [exams, setExams] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [selectedExamId, setSelectedExamId] = useState('all');

    const [loading, setLoading] = useState(true);
    const [updatingSession, setUpdatingSession] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [generatedAt, setGeneratedAt] = useState(null);

    const token = localStorage.getItem('token');

    const authConfig = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            setError('');
            setMessage('');

            const [examResponse, timetableResponse] = await Promise.all([
                api.get('/exams', authConfig),
                api.get('/timetable', authConfig)
            ]);

            const examList = examResponse.data.exams || [];
            setExams(examList);

            const timetable = timetableResponse.data.timetable;

            setSessions(timetable?.sessions || []);
            setGeneratedAt(timetable?.generatedAt || null);

        } catch (err) {
            if (err.response?.status === 404) {
                setSessions([]);
                setMessage('You have not generated a combined timetable yet.');
            } else {
                setError(
                    err.response?.data?.message ||
                    'Failed to load your timetable.'
                );
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredSessions = useMemo(() => {
        if (selectedExamId === 'all') {
            return sessions;
        }

        return sessions.filter(
            (session) => session.examId === selectedExamId
        );
    }, [sessions, selectedExamId]);

    const completedCount = filteredSessions.filter(
        (session) => session.completed
    ).length;

    const remainingCount = filteredSessions.length - completedCount;

    const progress = filteredSessions.length
        ? Math.round((completedCount / filteredSessions.length) * 100)
        : 0;

    const groupedSessions = useMemo(() => {
        const groups = {};

        filteredSessions.forEach((session) => {
            if (!groups[session.date]) {
                groups[session.date] = [];
            }

            groups[session.date].push(session);
        });

        return Object.entries(groups)
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
            .map(([date, daySessions]) => ({
                date,
                sessions: daySessions.sort((a, b) =>
                    a.startTime.localeCompare(b.startTime)
                )
            }));
    }, [filteredSessions]);

    const formatDate = (date) => {
        if (!date) return '';

        const [year, month, day] = date.slice(0, 10)
            .split('-')
            .map(Number);

        return new Date(year, month - 1, day).toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const handleToggleSession = async (session) => {
        try {
            setUpdatingSession(session.sessionId);
            setError('');

            await api.patch(
                `/timetable/sessions/${session.sessionId}`,
                { completed: !session.completed },
                authConfig
            );

            setSessions((previous) =>
                previous.map((item) =>
                    item.sessionId === session.sessionId
                        ? { ...item, completed: !item.completed }
                        : item
                )
            );

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Failed to update study session.'
            );
        } finally {
            setUpdatingSession(null);
        }
    };

    const handleDeleteTimetable = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to delete your combined timetable?'
        );

        if (!confirmed) return;

        try {
            setDeleting(true);
            setError('');

            await api.delete('/timetable', authConfig);

            setSessions([]);
            setGeneratedAt(null);
            setSelectedExamId('all');
            setMessage('Combined timetable deleted successfully!');

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Failed to delete timetable.'
            );
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="timetable-page">
                <div className="timetable-loading">
                    <Loader2 className="spin" size={30} />
                    <p>Loading your combined timetable...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="timetable-page">

            <div className="timetable-header">
                <div>
                    <span className="section-label">STUDY PLANNER</span>
                    <h1>My Combined Timetable</h1>
                    <p>
                        Your study schedule for all upcoming examinations.
                    </p>
                </div>

                <button
                    className="timetable-refresh-btn"
                    onClick={fetchData}
                    disabled={loading}
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {error && (
                <div className="timetable-error">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {message && sessions.length === 0 && (
                <div className="timetable-empty">
                    <CalendarDays size={42} />
                    <h2>No timetable available</h2>
                    <p>{message}</p>
                    <p>
                        Visit your Topics page and generate a combined
                        timetable for your upcoming examinations.
                    </p>
                </div>
            )}

            {sessions.length > 0 && (
                <>
                    <div className="timetable-filter">
                        <label htmlFor="examFilter">
                            Filter by examination
                        </label>

                        <select
                            id="examFilter"
                            value={selectedExamId}
                            onChange={(e) => setSelectedExamId(e.target.value)}
                        >
                            <option value="all">All examinations</option>

                            {exams.map((exam) => (
                                <option
                                    key={exam.id || exam._id}
                                    value={exam.id || exam._id}
                                >
                                    {exam.examName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="timetable-stats">

                        <div className="timetable-stat-card">
                            <CalendarDays size={22} />
                            <div>
                                <h3>{filteredSessions.length}</h3>
                                <p>Total Sessions</p>
                            </div>
                        </div>

                        <div className="timetable-stat-card">
                            <CheckCircle2 size={22} />
                            <div>
                                <h3>{completedCount}</h3>
                                <p>Completed</p>
                            </div>
                        </div>

                        <div className="timetable-stat-card">
                            <Clock size={22} />
                            <div>
                                <h3>{remainingCount}</h3>
                                <p>Remaining</p>
                            </div>
                        </div>

                    </div>

                    <div className="timetable-progress-card">
                        <div className="timetable-progress-heading">
                            <div>
                                <h3>Study Progress</h3>
                                <p>
                                    {completedCount} of {filteredSessions.length}
                                    {' '}sessions completed
                                </p>
                            </div>

                            <strong>{progress}%</strong>
                        </div>

                        <div className="timetable-progress-track">
                            <div
                                className="timetable-progress-fill"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>

                    <div className="timetable-schedule-heading">
                        <div>
                            <h2>Your Study Schedule</h2>
                            <p>
                                {selectedExamId === 'all'
                                    ? 'Sessions across all examinations'
                                    : 'Sessions for the selected examination'}
                            </p>
                        </div>

                        <button
                            className="timetable-delete-btn"
                            onClick={handleDeleteTimetable}
                            disabled={deleting}
                        >
                            {deleting
                                ? <Loader2 size={16} className="spin" />
                                : <Trash2 size={16} />
                            }
                            Delete Timetable
                        </button>
                    </div>

                    {groupedSessions.length === 0 ? (
                        <div className="timetable-empty">
                            <BookOpen size={35} />
                            <p>No sessions found for this examination.</p>
                        </div>
                    ) : (
                        <div className="timetable-days">

                            {groupedSessions.map((group) => {
                                const dayCompleted = group.sessions.filter(
                                    (session) => session.completed
                                ).length;

                                return (
                                    <section
                                        className="timetable-day"
                                        key={group.date}
                                    >
                                        <div className="timetable-day-header">
                                            <div>
                                                <h3>{formatDate(group.date)}</h3>
                                                <span>
                                                    {dayCompleted} / {group.sessions.length}
                                                    {' '}completed
                                                </span>
                                            </div>
                                        </div>

                                        <div className="timetable-day-sessions">

                                            {group.sessions.map((session) => (
                                                <div
                                                    className={`timetable-session ${
                                                        session.completed
                                                            ? 'completed'
                                                            : ''
                                                    }`}
                                                    key={session.sessionId}
                                                >
                                                    <button
                                                        className="timetable-session-check"
                                                        onClick={() =>
                                                            handleToggleSession(session)
                                                        }
                                                        disabled={
                                                            updatingSession ===
                                                            session.sessionId
                                                        }
                                                        title="Mark session as completed"
                                                    >
                                                        {updatingSession ===
                                                        session.sessionId ? (
                                                            <Loader2
                                                                size={21}
                                                                className="spin"
                                                            />
                                                        ) : session.completed ? (
                                                            <CheckCircle2
                                                                size={22}
                                                            />
                                                        ) : (
                                                            <Circle size={22} />
                                                        )}
                                                    </button>

                                                    <div className="timetable-session-time">
                                                        <strong>
                                                            {session.startTime}
                                                        </strong>
                                                        <span>
                                                            {session.endTime}
                                                        </span>
                                                    </div>

                                                    <div className="timetable-session-details">
                                                        <h4>{session.topicName}</h4>

                                                        <p>
                                                            {session.subjectName}
                                                        </p>

                                                        <span className="timetable-exam-name">
                                                            {session.examName}
                                                        </span>
                                                    </div>

                                                    <div className="timetable-session-duration">
                                                        <Clock size={14} />
                                                        {session.duration} min
                                                    </div>
                                                </div>
                                            ))}

                                        </div>
                                    </section>
                                );
                            })}

                        </div>
                    )}

                    {generatedAt && (
                        <p className="timetable-generated-at">
                            Last generated: {new Date(generatedAt).toLocaleString('en-IN')}
                        </p>
                    )}
                </>
            )}

        </div>
    );
};

export default Timetable;
