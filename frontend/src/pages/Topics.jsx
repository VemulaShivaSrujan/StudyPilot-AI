
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
    Plus,
    BookOpen,
    Pencil,
    Trash2,
    CheckCircle2,
    Circle,
    Clock,
    X,
    Loader2,
    Upload,
    Sparkles,
    FileText,
    Save,
    Settings
} from 'lucide-react';

import api from '../services/api';
import './Topics.css';

const Topics = () => {

    // AI topic states
    const [pdfFile, setPdfFile] = useState(null);
    const [generatedTopics, setGeneratedTopics] = useState([]);
    const [generatingTopics, setGeneratingTopics] = useState(false);
    const [selectedGeneratedTopics, setSelectedGeneratedTopics] = useState([]);

    // Study preferences states
    const [showPreferences, setShowPreferences] = useState(false);

    const [preferences, setPreferences] = useState({
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
    });

    const weekdays = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
    ];

    const [searchParams] = useSearchParams();
    const subjectId = searchParams.get('subjectId');

    // Topic states
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTopic, setEditingTopic] = useState(null);

    const [topicName, setTopicName] = useState('');
    const [description, setDescription] = useState('');
    const [estimatedTime, setEstimatedTime] = useState('');

    // Message and saving states
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);

    const token = localStorage.getItem('token');

    const config = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    // Update preference fields
    const handlePreferenceChange = (e) => {
        const { name, value } = e.target;

        setPreferences(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Select or deselect study days
    const handleStudyDayChange = (day) => {
        setPreferences(prev => ({
            ...prev,
            studyDays: prev.studyDays.includes(day)
                ? prev.studyDays.filter(item => item !== day)
                : [...prev.studyDays, day]
        }));
    };

    // Load saved preferences
    const fetchPreferences = async () => {
        try {
            const response = await api.get('/preferences', config);

            if (response.data.success && response.data.preferences) {
                setPreferences(prev => ({
                    ...prev,
                    ...response.data.preferences,
                    studyDays: response.data.preferences.studyDays || prev.studyDays
                }));
            }
        } catch (error) {
            console.error(
                'Error loading preferences:',
                error.response?.data?.message || error.message
            );
        }
    };

    // Save preferences
    const handleSavePreferences = async () => {
        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const response = await api.put(
                '/preferences',
                {
                    ...preferences,
                    dailyStudyHours: Number(preferences.dailyStudyHours),
                    sessionDuration: Number(preferences.sessionDuration),
                    breakDuration: Number(preferences.breakDuration)
                },
                config
            );

            if (response.data.success) {
                setSuccess('Study preferences saved successfully!');
            }

        } catch (error) {
            setError(
                error.response?.data?.message ||
                'Failed to save study preferences.'
            );
        } finally {
            setSaving(false);
        }
    };

    // Fetch existing topics
    const fetchTopics = async () => {
        try {
            setLoading(true);

            const response = await api.get(
                `/topics/subject/${subjectId}`,
                config
            );

            if (response.data.success) {
                setTopics(response.data.topics);
            }

        } catch (error) {
            setError(
                error.response?.data?.message ||
                'Failed to load topics.'
            );
        } finally {
            setLoading(false);
        }
    };

    // Load topics
    useEffect(() => {
        if (!subjectId) {
            setError('Please select a subject first.');
            setLoading(false);
            return;
        }

        fetchTopics();
    }, [subjectId]);

    // Load saved preferences
    useEffect(() => {
        fetchPreferences();
    }, []);

    // Reset manual topic form
    const resetForm = () => {
        setTopicName('');
        setDescription('');
        setEstimatedTime('');
        setEditingTopic(null);
        setShowForm(false);
        setError('');
    };

    // Add or edit manual topic
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const topicData = {
                topicName,
                description,
                estimatedTime: Number(estimatedTime),
                subjectId
            };

            if (editingTopic) {
                await api.put(
                    `/topics/${editingTopic.id}`,
                    {
                        topicName,
                        description,
                        estimatedTime: Number(estimatedTime)
                    },
                    config
                );

                setSuccess('Topic updated successfully!');

            } else {
                await api.post('/topics', topicData, config);

                setSuccess('Topic added successfully!');
            }

            resetForm();
            await fetchTopics();

        } catch (error) {
            setError(
                error.response?.data?.message ||
                'Something went wrong.'
            );
        } finally {
            setSaving(false);
        }
    };

    // Edit topic
    const handleEdit = (topic) => {
        setEditingTopic(topic);
        setTopicName(topic.topicName);
        setDescription(topic.description || '');
        setEstimatedTime(topic.estimatedTime || '');

        setShowForm(true);
        setError('');
        setSuccess('');
    };

    // Delete topic
    const handleDelete = async (topicId) => {
        if (!window.confirm('Are you sure you want to delete this topic?')) {
            return;
        }

        try {
            await api.delete(`/topics/${topicId}`, config);

            setSuccess('Topic deleted successfully!');
            await fetchTopics();

        } catch (error) {
            setError(
                error.response?.data?.message ||
                'Failed to delete topic.'
            );
        }
    };

    // Mark topic completed or incomplete
    const handleToggleComplete = async (topic) => {
        try {
            await api.put(
                `/topics/${topic.id}`,
                {
                    completed: !topic.completed
                },
                config
            );

            await fetchTopics();

        } catch (error) {
            setError(
                error.response?.data?.message ||
                'Failed to update topic status.'
            );
        }
    };

    // Generate topics using Gemini AI
    const handleGenerateTopics = async () => {

        if (!pdfFile) {
            setError('Please select a PDF file first.');
            return;
        }

        if (!subjectId) {
            setError('Subject ID is missing.');
            return;
        }

        try {
            setGeneratingTopics(true);
            setError('');
            setSuccess('');

            setGeneratedTopics([]);
            setSelectedGeneratedTopics([]);

            const formData = new FormData();

            formData.append('pdf', pdfFile);
            formData.append('subjectId', subjectId);

            const response = await api.post(
                '/ai/generate-topics',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );

            if (response.data.success) {
                setGeneratedTopics(response.data.topics);

                setSelectedGeneratedTopics(
                    response.data.topics.map((_, index) => index)
                );

                setSuccess(
                    `${response.data.count} topics generated successfully!`
                );
            }

        } catch (error) {
            console.log('AI generation error:', error);
            console.log('Backend response:', error.response?.data);

            setError(
                error.response?.data?.message ||
                'Failed to generate topics. Please try again.'
            );
        } finally {
            setGeneratingTopics(false);
        }
    };

    // Select or deselect an AI topic
    const handleSelectGeneratedTopic = (index) => {
        setSelectedGeneratedTopics(prev => {
            if (prev.includes(index)) {
                return prev.filter(item => item !== index);
            }

            return [...prev, index];
        });
    };

    // Save selected AI-generated topics
    const handleSaveGeneratedTopics = async () => {
        if (selectedGeneratedTopics.length === 0) {
            setError('Please select at least one topic to save.');
            return;
        }

        try {
            setSaving(true);
            setError('');
            setSuccess('');

            const selectedTopics = selectedGeneratedTopics.map(
                index => generatedTopics[index]
            );

            for (const topic of selectedTopics) {
                await api.post(
                    '/topics',
                    {
                        topicName: topic.topicName,
                        description: topic.description,
                        estimatedTime: topic.estimatedTime,
                        subjectId
                    },
                    config
                );
            }

            setSuccess(
                `${selectedTopics.length} AI-generated topics saved successfully!`
            );

            setGeneratedTopics([]);
            setSelectedGeneratedTopics([]);
            setPdfFile(null);

            await fetchTopics();

        } catch (error) {
            setError(
                error.response?.data?.message ||
                'Failed to save generated topics.'
            );
        } finally {
            setSaving(false);
        }
    };

    // Topic progress
    const completedTopics = topics.filter(
        topic => topic.completed
    ).length;

    const progress = topics.length > 0
        ? Math.round((completedTopics / topics.length) * 100)
        : 0;

    if (loading) {
        return (
            <div className="topics-loading">
                <Loader2 className="spin" size={30} />
                <p>Loading topics...</p>
            </div>
        );
    }

    return (
        <div className="topics-page">

            {/* Header */}
            <div className="topics-header">
                <div>
                    <h1>My Topics</h1>
                    <p>Organize your learning one topic at a time.</p>
                </div>

                <button
                    className="add-topic-btn"
                    onClick={() => {
                        resetForm();
                        setShowForm(true);
                    }}
                >
                    <Plus size={18} />
                    Add Topic
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="topic-message error">
                    {error}
                    <button onClick={() => setError('')}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {success && (
                <div className="topic-message success">
                    {success}
                    <button onClick={() => setSuccess('')}>
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* AI PDF Upload */}
            <div className="ai-topic-card">

                <div className="ai-topic-heading">
                    <div className="ai-topic-icon">
                        <Sparkles size={25} />
                    </div>

                    <div>
                        <h2>Generate Topics with AI</h2>
                        <p>
                            Upload your study material and let Gemini AI
                            identify important topics automatically.
                        </p>
                    </div>
                </div>

                <div className="ai-upload-area">

                    <FileText size={35} />

                    <h3>Upload Your Study Material</h3>

                    <p>
                        Select a PDF document (Maximum 10 MB).
                    </p>

                    <input
                        type="file"
                        id="topic-pdf"
                        accept="application/pdf,.pdf"
                        onChange={(e) => {
                            const file = e.target.files?.[0];

                            if (file) {
                                setPdfFile(file);
                                setError('');
                                setGeneratedTopics([]);
                                setSelectedGeneratedTopics([]);
                            }
                        }}
                    />

                    <label htmlFor="topic-pdf" className="pdf-select-btn">
                        <Upload size={17} />
                        Choose PDF
                    </label>

                    {pdfFile && (
                        <div className="selected-pdf">
                            <FileText size={17} />
                            <span>{pdfFile.name}</span>

                            <button
                                type="button"
                                onClick={() => {
                                    setPdfFile(null);
                                    document.getElementById('topic-pdf').value = '';
                                }}
                                title="Remove PDF"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                </div>

                <button
                    className="generate-ai-btn"
                    onClick={handleGenerateTopics}
                    disabled={!pdfFile || generatingTopics || saving}
                >
                    {generatingTopics ? (
                        <>
                            <Loader2 className="spin" size={18} />
                            Generating Topics...
                        </>
                    ) : (
                        <>
                            <Sparkles size={18} />
                            Generate Topics with AI
                        </>
                    )}
                </button>

            </div>

            {/* AI Generated Topics Preview */}
            {generatedTopics.length > 0 && (

                <div className="generated-topics-card">

                    <div className="generated-topics-header">
                        <div>
                            <h2>
                                <Sparkles size={21} />
                                AI Generated Topics
                            </h2>

                            <p>
                                Review and select the topics you want to save.
                            </p>
                        </div>

                        <span>
                            {selectedGeneratedTopics.length} / {generatedTopics.length} selected
                        </span>
                    </div>

                    <div className="generated-topics-list">

                        {generatedTopics.map((topic, index) => (

                            <div
                                className={`generated-topic-item ${
                                    selectedGeneratedTopics.includes(index)
                                        ? 'selected'
                                        : ''
                                }`}
                                key={index}
                            >

                                <label className="generated-topic-checkbox">

                                    <input
                                        type="checkbox"
                                        checked={selectedGeneratedTopics.includes(index)}
                                        onChange={() => handleSelectGeneratedTopic(index)}
                                    />

                                    <span className="custom-checkbox">
                                        {selectedGeneratedTopics.includes(index) && (
                                            <CheckCircle2 size={18} />
                                        )}
                                    </span>

                                </label>

                                <div className="generated-topic-info">

                                    <h3>
                                        {index + 1}. {topic.topicName}
                                    </h3>

                                    <p>{topic.description}</p>

                                    <span>
                                        <Clock size={14} />
                                        {topic.estimatedTime} minutes
                                    </span>

                                </div>

                            </div>

                        ))}

                    </div>

                    <div className="generated-topics-actions">

                        <button
                            className="select-all-btn"
                            onClick={() => {
                                if (
                                    selectedGeneratedTopics.length === generatedTopics.length
                                ) {
                                    setSelectedGeneratedTopics([]);
                                } else {
                                    setSelectedGeneratedTopics(
                                        generatedTopics.map((_, index) => index)
                                    );
                                }
                            }}
                        >
                            {selectedGeneratedTopics.length === generatedTopics.length
                                ? 'Deselect All'
                                : 'Select All'}
                        </button>

                        <button
                            className="save-generated-btn"
                            onClick={handleSaveGeneratedTopics}
                            disabled={saving || selectedGeneratedTopics.length === 0}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="spin" size={18} />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Save Selected Topics
                                </>
                            )}
                        </button>

                    </div>

                </div>

            )}

            {/* Progress */}
            <div className="topic-progress-card">

                <div className="topic-progress-top">
                    <div>
                        <h3>Topic Progress</h3>

                        <p>
                            {completedTopics} of {topics.length} topics completed
                        </p>
                    </div>

                    <span>{progress}%</span>
                </div>

                <div className="topic-progress-bar">
                    <div style={{ width: `${progress}%` }} />
                </div>

            </div>

            {/* Manual Topic Form */}
            {showForm && (

                <div className="topic-form-card">

                    <div className="topic-form-header">
                        <h2>
                            {editingTopic ? 'Edit Topic' : 'Add New Topic'}
                        </h2>

                        <button onClick={resetForm}>
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="topic-form-group">
                            <label>Topic Name *</label>

                            <input
                                type="text"
                                placeholder="Enter topic name"
                                value={topicName}
                                onChange={(e) => setTopicName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="topic-form-group">
                            <label>Description</label>

                            <textarea
                                placeholder="Enter topic description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows="3"
                            />
                        </div>

                        <div className="topic-form-group">
                            <label>Estimated Study Time (Minutes)</label>

                            <input
                                type="number"
                                min="0"
                                placeholder="Example: 60"
                                value={estimatedTime}
                                onChange={(e) => setEstimatedTime(e.target.value)}
                            />
                        </div>

                        <div className="topic-form-actions">

                            <button
                                type="button"
                                className="cancel-topic-btn"
                                onClick={resetForm}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="save-topic-btn"
                                disabled={saving}
                            >
                                {saving
                                    ? 'Saving...'
                                    : editingTopic
                                        ? 'Update Topic'
                                        : 'Save Topic'}
                            </button>

                        </div>

                    </form>

                </div>

            )}

            {/* All Topics */}
            <div className="topics-section">

                <div className="topics-section-header">
                    <h2>All Topics</h2>
                    <span>{topics.length} Topics</span>
                </div>

                {topics.length === 0 ? (

                    <div className="empty-topics">

                        <BookOpen size={45} />

                        <h3>No Topics Yet</h3>

                        <p>
                            Start adding topics to organize your subject.
                        </p>

                        <button onClick={() => setShowForm(true)}>
                            <Plus size={17} />
                            Add Your First Topic
                        </button>

                    </div>

                ) : (

                    <div className="topics-list">

                        {topics.map((topic, index) => (

                            <div
                                className={`topic-item ${
                                    topic.completed ? 'completed' : ''
                                }`}
                                key={topic.id}
                            >

                                <button
                                    className="topic-complete-btn"
                                    onClick={() => handleToggleComplete(topic)}
                                    title="Toggle completion"
                                >
                                    {topic.completed ? (
                                        <CheckCircle2 size={23} />
                                    ) : (
                                        <Circle size={23} />
                                    )}
                                </button>

                                <div className="topic-item-info">

                                    <h3>
                                        {index + 1}. {topic.topicName}
                                    </h3>

                                    {topic.description && (
                                        <p>{topic.description}</p>
                                    )}

                                    {topic.estimatedTime > 0 && (
                                        <span className="topic-time">
                                            <Clock size={14} />
                                            {topic.estimatedTime} minutes
                                        </span>
                                    )}

                                </div>

                                <div className="topic-item-actions">

                                    <button
                                        onClick={() => handleEdit(topic)}
                                        title="Edit topic"
                                    >
                                        <Pencil size={17} />
                                    </button>

                                    <button
                                        onClick={() => handleDelete(topic.id)}
                                        title="Delete topic"
                                    >
                                        <Trash2 size={17} />
                                    </button>

                                </div>

                            </div>

                        ))}

                    </div>

                )}

            </div>

            {/* Study Preferences - Bottom of Page */}
            <div className="preferences-section">

                <button
                    type="button"
                    className="preferences-header"
                    onClick={() => setShowPreferences(prev => !prev)}
                    aria-expanded={showPreferences}
                >
                    <div className="preferences-title">
                        <Settings size={22} />

                        <div>
                            <h2>Study Preferences</h2>
                            <p>Customize your daily study schedule</p>
                        </div>
                    </div>

                    <span className="preferences-toggle">
                        {showPreferences ? '−' : '+'}
                    </span>
                </button>

                {showPreferences && (

                    <div className="preferences-content">

                        <div className="preference-field">
                            <label>Daily Study Hours</label>

                            <input
                                type="number"
                                name="dailyStudyHours"
                                min="1"
                                max="12"
                                value={preferences.dailyStudyHours}
                                onChange={handlePreferenceChange}
                            />
                        </div>

                        <div className="preference-row">

                            <div className="preference-field">
                                <label>Preferred Start Time</label>

                                <input
                                    type="time"
                                    name="preferredStartTime"
                                    value={preferences.preferredStartTime}
                                    onChange={handlePreferenceChange}
                                />
                            </div>

                            <div className="preference-field">
                                <label>Preferred End Time</label>

                                <input
                                    type="time"
                                    name="preferredEndTime"
                                    value={preferences.preferredEndTime}
                                    onChange={handlePreferenceChange}
                                />
                            </div>

                        </div>

                        <div className="preference-row">

                            <div className="preference-field">
                                <label>Study Session Duration (minutes)</label>

                                <input
                                    type="number"
                                    name="sessionDuration"
                                    min="15"
                                    max="120"
                                    value={preferences.sessionDuration}
                                    onChange={handlePreferenceChange}
                                />
                            </div>

                            <div className="preference-field">
                                <label>Break Duration (minutes)</label>

                                <input
                                    type="number"
                                    name="breakDuration"
                                    min="5"
                                    max="60"
                                    value={preferences.breakDuration}
                                    onChange={handlePreferenceChange}
                                />
                            </div>

                        </div>

                        <div className="preference-field">
                            <label>Study Days</label>

                            <div className="study-days">

                                {weekdays.map(day => (

                                    <label
                                        key={day}
                                        className="study-day-option"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={preferences.studyDays.includes(day)}
                                            onChange={() => handleStudyDayChange(day)}
                                        />

                                        {day.slice(0, 3)}
                                    </label>

                                ))}

                            </div>
                        </div>

                        <button
                            type="button"
                            className="save-preferences-btn"
                            onClick={handleSavePreferences}
                            disabled={saving}
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="spin" size={17} />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save size={17} />
                                    Save Preferences
                                </>
                            )}
                        </button>

                    </div>

                )}

            </div>

        </div>
    );
};

export default Topics;
