
import { useEffect, useState } from 'react';
import { Clock, Save, BookOpen } from 'lucide-react';
import api from '../services/api';
import './Preferences.css';

const defaultPreferences = {
    dailyStudyHours: 4,
    preferredStartTime: '18:00',
    preferredEndTime: '22:00',
    sessionDuration: 50,
    breakDuration: 10,
    studyDays: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday'
    ]
};

const weekdays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
];

const Preferences = () => {
    const [preferences, setPreferences] = useState(defaultPreferences);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            setLoading(true);

            const response = await api.get('/preferences', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data.preferences) {
                setPreferences({
                    ...defaultPreferences,
                    ...response.data.preferences
                });
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Failed to load study preferences.'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;

        setPreferences(prev => ({
            ...prev,
            [name]: [
                'dailyStudyHours',
                'sessionDuration',
                'breakDuration'
            ].includes(name)
                ? Number(value)
                : value
        }));
    };

    const handleStudyDayChange = (day) => {
        setPreferences(prev => ({
            ...prev,
            studyDays: prev.studyDays.includes(day)
                ? prev.studyDays.filter(item => item !== day)
                : [...prev.studyDays, day]
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const response = await api.put(
                '/preferences',
                preferences,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setSuccess('Study preferences saved successfully!');
            }
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Failed to save study preferences.'
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="preferences-loading">
            Loading preferences...
        </div>;
    }

    return (
        <div className="preferences-page">
            <div className="preferences-header">
                <div>
                    <h1>Study Preferences</h1>
                    <p>
                        Customize your study routine to create
                        a personalized timetable.
                    </p>
                </div>

                <div className="preferences-icon">
                    <BookOpen size={30} />
                </div>
            </div>

            <form onSubmit={handleSave} className="preferences-form">

                <section className="preference-card">
                    <div className="preference-card-title">
                        <Clock size={22} />
                        <div>
                            <h2>Daily Study Schedule</h2>
                            <p>Choose your preferred study hours.</p>
                        </div>
                    </div>

                    <div className="preference-grid">
                        <div className="preference-field">
                            <label>Daily Study Hours</label>
                            <select
                                name="dailyStudyHours"
                                value={preferences.dailyStudyHours}
                                onChange={handleChange}
                            >
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(hour => (
                                    <option key={hour} value={hour}>
                                        {hour} {hour === 1 ? 'Hour' : 'Hours'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="preference-field">
                            <label>Study Start Time</label>
                            <input
                                type="time"
                                name="preferredStartTime"
                                value={preferences.preferredStartTime}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="preference-field">
                            <label>Study End Time</label>
                            <input
                                type="time"
                                name="preferredEndTime"
                                value={preferences.preferredEndTime}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>
                </section>

                <section className="preference-card">
                    <div className="preference-card-title">
                        <Clock size={22} />
                        <div>
                            <h2>Study Session Settings</h2>
                            <p>Manage your study and break durations.</p>
                        </div>
                    </div>

                    <div className="preference-grid">
                        <div className="preference-field">
                            <label>Study Session Duration</label>
                            <select
                                name="sessionDuration"
                                value={preferences.sessionDuration}
                                onChange={handleChange}
                            >
                                {[15, 25, 30, 45, 50, 60, 90, 120].map(time => (
                                    <option key={time} value={time}>
                                        {time} Minutes
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="preference-field">
                            <label>Break Duration</label>
                            <select
                                name="breakDuration"
                                value={preferences.breakDuration}
                                onChange={handleChange}
                            >
                                {[5, 10, 15, 20, 30, 45, 60].map(time => (
                                    <option key={time} value={time}>
                                        {time} Minutes
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </section>

                <section className="preference-card">
                    <div className="preference-card-title">
                        <BookOpen size={22} />
                        <div>
                            <h2>Preferred Study Days</h2>
                            <p>Select the days you are available to study.</p>
                        </div>
                    </div>

                    <div className="study-days-grid">
                        {weekdays.map(day => (
                            <label
                                key={day}
                                className={`study-day-option ${
                                    preferences.studyDays.includes(day)
                                        ? 'selected'
                                        : ''
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={preferences.studyDays.includes(day)}
                                    onChange={() => handleStudyDayChange(day)}
                                />
                                {day}
                            </label>
                        ))}
                    </div>
                </section>

                {error && (
                    <div className="preferences-error">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="preferences-success">
                        {success}
                    </div>
                )}

                <button
                    type="submit"
                    className="save-preferences-btn"
                    disabled={saving}
                >
                    <Save size={18} />
                    {saving ? 'Saving...' : 'Save Preferences'}
                </button>

            </form>
        </div>
    );
};

export default Preferences;
