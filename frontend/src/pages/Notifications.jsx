
import { useEffect, useState } from 'react';
import {
    Bell,
    CalendarDays,
    Clock,
    AlertCircle,
    CheckCircle2,
    Loader2,
    RefreshCw
} from 'lucide-react';

import api from '../services/api';
import './Notifications.css';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError('');

            const response = await api.get('/notifications');

            setNotifications(response.data.notifications || []);
        } catch (err) {
            console.error('Failed to fetch notifications:', err);

            setError(
                err.response?.data?.message ||
                'Failed to load notifications.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const getIcon = (type) => {
        switch (type) {
            case 'exam':
                return <CalendarDays size={21} />;

            case 'overdue':
                return <AlertCircle size={21} />;

            case 'study':
                return <Clock size={21} />;

            default:
                return <Bell size={21} />;
        }
    };

    const formatDate = (date) => {
        if (!date) return '';

        const [year, month, day] = date.split('-');

        return new Date(
            Number(year),
            Number(month) - 1,
            Number(day)
        ).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div className="notifications-page">

            <div className="notifications-header">
                <div>
                    <h1>Notifications</h1>
                    <p>
                        Stay updated with your exams and study schedule.
                    </p>
                </div>

                <button
                    className="notification-refresh"
                    onClick={fetchNotifications}
                    disabled={loading}
                >
                    <RefreshCw size={17} />
                    Refresh
                </button>
            </div>

            <div className="notifications-summary">
                <Bell size={22} />

                <div>
                    <h3>
                        {notifications.length} Notifications
                    </h3>
                    <p>
                        Your latest study reminders and updates.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="notifications-state">
                    <Loader2 className="loading-icon" size={32} />
                    <p>Loading notifications...</p>
                </div>
            ) : error ? (
                <div className="notifications-state error-state">
                    <AlertCircle size={32} />
                    <p>{error}</p>

                    <button onClick={fetchNotifications}>
                        Try Again
                    </button>
                </div>
            ) : notifications.length === 0 ? (
                <div className="notifications-state empty-state">
                    <CheckCircle2 size={42} />
                    <h3>You're all caught up!</h3>
                    <p>
                        You don't have any pending notifications right now.
                    </p>
                </div>
            ) : (
                <div className="notifications-list">

                    {notifications.map((notification) => (
                        <div
                            className={`notification-card ${notification.priority}`}
                            key={notification.id}
                        >
                            <div className={`notification-icon ${notification.type}`}>
                                {getIcon(notification.type)}
                            </div>

                            <div className="notification-content">
                                <div className="notification-title-row">
                                    <h3>{notification.title}</h3>

                                    <span className={`priority-badge ${notification.priority}`}>
                                        {notification.priority}
                                    </span>
                                </div>

                                <p>{notification.message}</p>

                                <span className="notification-date">
                                    <CalendarDays size={14} />
                                    {formatDate(notification.date)}
                                </span>
                            </div>
                        </div>
                    ))}

                </div>
            )}

        </div>
    );
};

export default Notifications;
