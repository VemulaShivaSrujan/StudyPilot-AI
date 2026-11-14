
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

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
    Settings,
    CalendarDays,
    Award,
    History,
    AlertCircle,
    AlertTriangle
} from 'lucide-react';

import api from '../services/api';
import './Topics.css';

const Topics = () => {
    const [pdfFile, setPdfFile] = useState(null);
    const [generatedTopics, setGeneratedTopics] = useState([]);
    const [generatingTopics, setGeneratingTopics] = useState(false);
    const [selectedGeneratedTopics, setSelectedGeneratedTopics] = useState([]);

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
    const navigate = useNavigate();
    const subjectId = searchParams.get('subjectId');

    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingTopic, setEditingTopic] = useState(null);

    const [topicName, setTopicName] = useState('');
    const [description, setDescription] = useState('');
    const [estimatedTime, setEstimatedTime] = useState('');

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [saving, setSaving] = useState(false);
    const [generatingTimetable, setGeneratingTimetable] = useState(false);

    // Custom delete popup states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [topicToDelete, setTopicToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteFeedback, setDeleteFeedback] = useState(null);

    const [activeTest, setActiveTest] = useState(null);
    const [testAnswers, setTestAnswers] = useState([]);
    const [testTimeLeft, setTestTimeLeft] = useState(0);

    const [generatingTest, setGeneratingTest] = useState(false);
    const [submittingTest, setSubmittingTest] = useState(false);
    const [autoSubmitAttempted, setAutoSubmitAttempted] = useState(false);

    const [testResult, setTestResult] = useState(null);
    const [testHistory, setTestHistory] = useState([]);
    const [showTestHistory, setShowTestHistory] = useState(false);
    const [historyTopicName, setHistoryTopicName] = useState('');

    const token = localStorage.getItem('token');

    const config = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    // -----------------------------------------
    // STUDY PREFERENCES
    // -----------------------------------------

    const handlePreferenceChange = (e) => {
        const { name, value } = e.target;

        setPreferences(prev => ({
            ...prev,
            [name]: value
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

    const fetchPreferences = async () => {
        try {
            const response = await api.get('/preferences', config);

            if (response.data.success && response.data.preferences) {
                setPreferences(prev => ({
                    ...prev,
                    ...response.data.preferences,
                    studyDays:
                        response.data.preferences.studyDays || prev.studyDays
                }));
            }
        } catch (error) {
            console.error(
                'Error loading preferences:',
                error.response?.data?.message || error.message
            );
        }
    };

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

    // -----------------------------------------
    // TOPICS
    // -----------------------------------------

    const fetchTopics = async () => {
        if (!subjectId) return;

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

    useEffect(() => {
        if (!subjectId) {
            setError('Please select a subject first.');
            setLoading(false);
            return;
        }

        fetchTopics();
    }, [subjectId]);

    useEffect(() => {
        fetchPreferences();
    }, []);

    const resetForm = () => {
        setTopicName('');
        setDescription('');
        setEstimatedTime('');
        setEditingTopic(null);
        setShowForm(false);
        setError('');
    };

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

    const handleEdit = (topic) => {
        setEditingTopic(topic);
        setTopicName(topic.topicName);
        setDescription(topic.description || '');
        setEstimatedTime(topic.estimatedTime || '');

        setShowForm(true);
        setError('');
        setSuccess('');
    };

    // Open custom delete confirmation
    const handleDelete = (topic) => {
        if (!topic?.id) {
            setError('Invalid topic ID.');
            return;
        }

        setTopicToDelete(topic);
        setShowDeleteModal(true);
        setDeleteFeedback(null);
    };

    const handleCancelDelete = () => {
        if (deleting) return;

        setShowDeleteModal(false);
        setTopicToDelete(null);
    };

    // Confirm and delete topic
    const confirmDelete = async () => {
        if (!topicToDelete?.id || deleting) return;

        try {
            setDeleting(true);

            await api.delete(
                `/topics/${topicToDelete.id}`,
                config
            );

            setShowDeleteModal(false);
            setTopicToDelete(null);

            await fetchTopics();

            setDeleteFeedback({
                type: 'success',
                message: 'The topic has been deleted successfully.'
            });
        } catch (error) {
            setShowDeleteModal(false);
            setTopicToDelete(null);

            setDeleteFeedback({
                type: 'error',
                message:
                    error.response?.data?.message ||
                    'Failed to delete topic. Please try again.'
            });
        } finally {
            setDeleting(false);
        }
    };

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

    // -----------------------------------------
    // AI PDF TOPIC GENERATION
    // -----------------------------------------

    const handleGenerateTopics = async () => {
        if (!pdfFile) {
            setError('Please select a PDF file first.');
            return;
        }

        if (!subjectId) {
            setError('Subject ID is missing.');
            return;
        }

        if (pdfFile.size > 10 * 1024 * 1024) {
            setError('PDF file must be smaller than 10 MB.');
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
            console.error('AI generation error:', error);
            console.error('Backend response:', error.response?.data);

            setError(
                error.response?.data?.message ||
                'Failed to generate topics. Please try again.'
            );
        } finally {
            setGeneratingTopics(false);
        }
    };

    const handleSelectGeneratedTopic = (index) => {
        setSelectedGeneratedTopics(prev => {
            if (prev.includes(index)) {
                return prev.filter(item => item !== index);
            }

            return [...prev, index];
        });
    };

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

            const pdfInput = document.getElementById('topic-pdf');

            if (pdfInput) {
                pdfInput.value = '';
            }

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

    // -----------------------------------------
    // AI TOPIC TEST
    // -----------------------------------------

    const handleGenerateTest = async (topic) => {
        try {
            setGeneratingTest(true);
            setError('');
            setTestResult(null);
            setTestHistory([]);
            setShowTestHistory(false);
            setAutoSubmitAttempted(false);

            const response = await api.post(
                `/topic-tests/generate/${topic.id}`,
                {},
                config
            );

            const test = response.data;

            setActiveTest(test);

            setTestAnswers(
                new Array(test.totalQuestions).fill(null)
            );

            setTestTimeLeft(test.duration * 60);
        } catch (error) {
            console.error('Generate test error:', error);

            alert(
                error.response?.data?.message ||
                'Failed to generate the test.'
            );
        } finally {
            setGeneratingTest(false);
        }
    };

    const handleAnswerSelect = (questionIndex, answerIndex) => {
        if (!activeTest || testTimeLeft <= 0 || submittingTest) {
            return;
        }

        setTestAnswers(previousAnswers => {
            const updatedAnswers = [...previousAnswers];
            updatedAnswers[questionIndex] = answerIndex;
            return updatedAnswers;
        });
    };

    const handleSubmitTest = async (autoSubmit = false) => {
        if (!activeTest || submittingTest) return;

        if (
            !autoSubmit &&
            testAnswers.some(answer => answer === null)
        ) {
            alert('Please answer all questions before submitting.');
            return;
        }

        try {
            setSubmittingTest(true);

            const answersToSubmit = testAnswers.map(
                answer => answer === null ? -1 : answer
            );

            const response = await api.post(
                `/topic-tests/submit/${activeTest.testId}`,
                {
                    answers: answersToSubmit
                },
                config
            );

            setTestResult({
                ...response.data.result,
                topicName: activeTest.topicName
            });

            setActiveTest(null);
            setTestTimeLeft(0);
            setTestAnswers([]);

            await fetchTopics();
        } catch (error) {
            console.error('Submit test error:', error);

            alert(
                error.response?.data?.message ||
                'Failed to submit the test.'
            );
        } finally {
            setSubmittingTest(false);
        }
    };

    const handleGetTestHistory = async (topic) => {
        try {
            const response = await api.get(
                `/topic-tests/history/${topic.id}`,
                config
            );

            setTestHistory(response.data.tests || []);
            setHistoryTopicName(topic.topicName);
            setShowTestHistory(true);
        } catch (error) {
            console.error('Test history error:', error);

            alert(
                error.response?.data?.message ||
                'Failed to load test history.'
            );
        }
    };

    const handleCloseTest = () => {
        if (
            activeTest &&
            !window.confirm(
                'Are you sure you want to close this test? Your answers will be lost.'
            )
        ) {
            return;
        }

        setActiveTest(null);
        setTestAnswers([]);
        setTestTimeLeft(0);
        setAutoSubmitAttempted(false);
    };

    const closeResultModal = () => {
        setTestResult(null);
    };

    useEffect(() => {
        if (!activeTest || submittingTest) {
            return;
        }

        if (testTimeLeft <= 0) {
            if (!autoSubmitAttempted) {
                setAutoSubmitAttempted(true);
                handleSubmitTest(true);
            }

            return;
        }

        const timer = setTimeout(() => {
            setTestTimeLeft(previousTime => previousTime - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [
        activeTest,
        testTimeLeft,
        submittingTest,
        autoSubmitAttempted
    ]);

    const formatTestTime = (seconds) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;

        return `${String(minutes).padStart(2, '0')}:${String(
            remainingSeconds
        ).padStart(2, '0')}`;
    };

    // -----------------------------------------
    // COMBINED TIMETABLE
    // -----------------------------------------

    const handleGenerateTimetable = async () => {
        try {
            setGeneratingTimetable(true);
            setError('');
            setSuccess('');

            const response = await api.post(
                '/timetable/generate',
                {},
                config
            );

            if (response.data.success) {
                navigate('/timetable');
            } else {
                setError(
                    response.data.message ||
                    'Failed to generate timetable.'
                );
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                'Failed to generate combined timetable.'
            );
        } finally {
            setGeneratingTimetable(false);
        }
    };

    // -----------------------------------------
    // PROGRESS
    // -----------------------------------------

    const completedTopics = topics.filter(
        topic => topic.completed
    ).length;

    const masteredTopics = topics.filter(
        topic => topic.mastered
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

    // -----------------------------------------
    // PAGE UI
    // -----------------------------------------

    return (
        <div className="topics-page">

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
                                if (file.size > 10 * 1024 * 1024) {
                                    setError('PDF file must be smaller than 10 MB.');
                                    e.target.value = '';
                                    return;
                                }

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

                                    const input = document.getElementById('topic-pdf');

                                    if (input) input.value = '';
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

            {/* Topic Progress */}
            <div className="topic-progress-card">
                <div className="topic-progress-top">
                    <div>
                        <h3>Topic Progress</h3>

                        <p>
                            {completedTopics} of {topics.length} topics studied
                        </p>

                        <p>
                            {masteredTopics} topics mastered through tests
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

                                    {topic.mastered && (
                                        <span className="topic-mastered">
                                            <Award size={15} />
                                            Mastered
                                        </span>
                                    )}

                                    {topic.completed && (
                                        <div className="topic-test-actions">
                                            <button
                                                type="button"
                                                className="start-topic-test-btn"
                                                onClick={() => handleGenerateTest(topic)}
                                                disabled={generatingTest}
                                            >
                                                {generatingTest ? (
                                                    <>
                                                        <Loader2 className="spin" size={16} />
                                                        Generating Test...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles size={16} />
                                                        Start AI Test
                                                    </>
                                                )}
                                            </button>

                                            <button
                                                type="button"
                                                className="topic-test-history-btn"
                                                onClick={() => handleGetTestHistory(topic)}
                                            >
                                                <History size={16} />
                                                View Test History
                                            </button>
                                        </div>
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
                                        onClick={() => handleDelete(topic)}
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

            {/* Study Preferences */}
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

            {/* Combined Timetable */}
            <div className="generate-timetable-section">
                <button
                    type="button"
                    className="generate-timetable-btn"
                    onClick={handleGenerateTimetable}
                    disabled={generatingTimetable || saving}
                >
                    {generatingTimetable ? (
                        <>
                            <Loader2 className="spin" size={18} />
                            Generating Combined Timetable...
                        </>
                    ) : (
                        <>
                            <CalendarDays size={18} />
                            Generate Combined Timetable
                        </>
                    )}
                </button>

                <p>
                    Create one conflict-free study schedule for all your upcoming examinations.
                </p>
            </div>

            {/* AI Test Modal */}
            {activeTest && (
                <div className="topic-test-overlay">
                    <div className="topic-test-modal">
                        <div className="topic-test-modal-header">
                            <div>
                                <h2>
                                    <Sparkles size={21} />
                                    AI Topic Test
                                </h2>

                                <p>{activeTest.topicName}</p>
                            </div>

                            <button
                                type="button"
                                onClick={handleCloseTest}
                                title="Close test"
                                disabled={submittingTest}
                            >
                                <X size={21} />
                            </button>
                        </div>

                        <div className="topic-test-info">
                            <span>
                                <FileText size={16} />
                                {activeTest.totalQuestions} Questions
                            </span>

                            <span
                                className={
                                    testTimeLeft <= 60
                                        ? 'test-timer warning'
                                        : 'test-timer'
                                }
                            >
                                <Clock size={16} />
                                {formatTestTime(testTimeLeft)}
                            </span>
                        </div>

                        {testTimeLeft === 0 && (
                            <div className="test-time-expired">
                                <AlertCircle size={17} />
                                Time is up! Your test is being submitted automatically.
                            </div>
                        )}

                        <div className="topic-test-progress">
                            <div>
                                <span>
                                    Answered: {testAnswers.filter(answer => answer !== null).length}
                                    {' / '}
                                    {activeTest.totalQuestions}
                                </span>
                            </div>

                            <div className="topic-test-progress-bar">
                                <div
                                    style={{
                                        width: `${
                                            (testAnswers.filter(answer => answer !== null).length /
                                                activeTest.totalQuestions) * 100
                                        }%`
                                    }}
                                />
                            </div>
                        </div>

                        <div className="topic-test-questions">
                            {activeTest.questions.map((question, questionIndex) => (
                                <div
                                    className="topic-test-question"
                                    key={questionIndex}
                                >
                                    <h3>
                                        <span>Q{question.questionNumber || questionIndex + 1}.</span>
                                        {' '}
                                        {question.question}
                                    </h3>

                                    <div className="topic-test-options">
                                        {question.options.map((option, optionIndex) => (
                                            <button
                                                type="button"
                                                key={optionIndex}
                                                className={`topic-test-option ${
                                                    testAnswers[questionIndex] === optionIndex
                                                        ? 'selected'
                                                        : ''
                                                }`}
                                                onClick={() =>
                                                    handleAnswerSelect(questionIndex, optionIndex)
                                                }
                                                disabled={testTimeLeft <= 0 || submittingTest}
                                            >
                                                <span className="option-letter">
                                                    {String.fromCharCode(65 + optionIndex)}
                                                </span>

                                                <span>{option}</span>

                                                {testAnswers[questionIndex] === optionIndex && (
                                                    <CheckCircle2 size={18} />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="topic-test-modal-actions">
                            <button
                                type="button"
                                className="cancel-topic-btn"
                                onClick={handleCloseTest}
                                disabled={submittingTest}
                            >
                                Close Test
                            </button>

                            <button
                                type="button"
                                className="submit-topic-test-btn"
                                onClick={() => handleSubmitTest(false)}
                                disabled={submittingTest}
                            >
                                {submittingTest ? (
                                    <>
                                        <Loader2 className="spin" size={17} />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={17} />
                                        Submit Test
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Test Result Modal */}
            {testResult && (
                <div className="topic-test-overlay">
                    <div className="topic-test-modal topic-test-result-modal">
                        <div className="topic-test-modal-header">
                            <div>
                                <h2>
                                    <Award size={22} />
                                    Test Result
                                </h2>

                                <p>{testResult.topicName}</p>
                            </div>

                            <button
                                type="button"
                                onClick={closeResultModal}
                                title="Close result"
                            >
                                <X size={21} />
                            </button>
                        </div>

                        <div
                            className={`test-result-summary ${
                                testResult.passed ? 'passed' : 'failed'
                            }`}
                        >
                            {testResult.passed ? (
                                <CheckCircle2 size={42} />
                            ) : (
                                <AlertCircle size={42} />
                            )}

                            <h2>{testResult.score}%</h2>

                            <h3>
                                {testResult.passed
                                    ? 'Congratulations! You passed.'
                                    : 'Keep practicing! You did not pass.'}
                            </h3>

                            <p>
                                {testResult.correctAnswers} correct out of{' '}
                                {testResult.totalQuestions} questions
                            </p>

                            <span>
                                Passing score: {testResult.passMark}%
                            </span>
                        </div>

                        <div className="test-result-review">
                            <h3>Answer Review</h3>

                            {testResult.review.map((item, index) => (
                                <div
                                    className={`test-review-item ${
                                        item.isCorrect ? 'correct' : 'incorrect'
                                    }`}
                                    key={index}
                                >
                                    <h4>
                                        {item.isCorrect ? (
                                            <CheckCircle2 size={17} />
                                        ) : (
                                            <X size={17} />
                                        )}

                                        Question {item.questionNumber}
                                    </h4>

                                    <p>{item.question}</p>

                                    <div>
                                        Your answer:{' '}
                                        <strong>
                                            {item.selectedAnswer === -1
                                                ? 'Not answered'
                                                : item.options[item.selectedAnswer] || 'Not answered'}
                                        </strong>
                                    </div>

                                    {!item.isCorrect && (
                                        <div>
                                            Correct answer:{' '}
                                            <strong>
                                                {item.options[item.correctAnswer]}
                                            </strong>
                                        </div>
                                    )}

                                    {item.explanation && (
                                        <p className="test-review-explanation">
                                            <strong>Explanation:</strong>{' '}
                                            {item.explanation}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="topic-test-modal-actions">
                            <button
                                type="button"
                                className="cancel-topic-btn"
                                onClick={closeResultModal}
                            >
                                Close
                            </button>

                            <button
                                type="button"
                                className="submit-topic-test-btn"
                                onClick={() => {
                                    const topic = topics.find(
                                        item => item.topicName === testResult.topicName
                                    );

                                    closeResultModal();

                                    if (topic) {
                                        handleGenerateTest(topic);
                                    }
                                }}
                            >
                                <Sparkles size={17} />
                                Retake Test
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Test History Modal */}
            {showTestHistory && (
                <div className="topic-test-overlay">
                    <div className="topic-test-modal topic-test-history-modal">
                        <div className="topic-test-modal-header">
                            <div>
                                <h2>
                                    <History size={21} />
                                    Test History
                                </h2>

                                <p>{historyTopicName}</p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowTestHistory(false)}
                                title="Close history"
                            >
                                <X size={21} />
                            </button>
                        </div>

                        {testHistory.length === 0 ? (
                            <div className="empty-test-history">
                                <History size={40} />

                                <h3>No Test Attempts Yet</h3>

                                <p>
                                    Your completed test attempts will appear here.
                                </p>
                            </div>
                        ) : (
                            <div className="topic-test-history-list">
                                {testHistory.map((test, index) => (
                                    <div
                                        className="topic-test-history-item"
                                        key={test.id || index}
                                    >
                                        <div>
                                            <h3>Attempt {testHistory.length - index}</h3>

                                            <p>
                                                {test.submittedAt
                                                    ? new Date(test.submittedAt).toLocaleString()
                                                    : 'Date unavailable'}
                                            </p>

                                            <span>
                                                {test.correctAnswers} / {test.totalQuestions} correct
                                            </span>
                                        </div>

                                        <div
                                            className={`history-score ${
                                                test.passed ? 'passed' : 'failed'
                                            }`}
                                        >
                                            <strong>{test.score}%</strong>

                                            <span>
                                                {test.passed ? 'Passed' : 'Not passed'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="topic-test-modal-actions">
                            <button
                                type="button"
                                className="cancel-topic-btn"
                                onClick={() => setShowTestHistory(false)}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Popup */}
            {showDeleteModal && topicToDelete && (
                <div
                    className="delete-modal-overlay"
                    onClick={handleCancelDelete}
                >
                    <div
                        className="delete-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-modal-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="delete-modal-icon">
                            <AlertTriangle size={30} />
                        </div>

                        <h2 id="delete-modal-title">
                            Delete Topic?
                        </h2>

                        <p>
                            Are you sure you want to delete{' '}
                            <strong>{topicToDelete.topicName}</strong>?
                            This action cannot be undone.
                        </p>

                        <div className="delete-modal-actions">
                            <button
                                type="button"
                                className="delete-cancel-btn"
                                onClick={handleCancelDelete}
                                disabled={deleting}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                className="delete-confirm-btn"
                                onClick={confirmDelete}
                                disabled={deleting}
                            >
                                {deleting ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Success / Error Popup */}
            {deleteFeedback && (
                <div
                    className="delete-modal-overlay"
                    onClick={() => setDeleteFeedback(null)}
                >
                    <div
                        className={`delete-feedback-modal ${deleteFeedback.type}`}
                        role="alertdialog"
                        aria-modal="true"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={`feedback-icon ${deleteFeedback.type}`}>
                            {deleteFeedback.type === 'success' ? (
                                <CheckCircle2 size={32} />
                            ) : (
                                <AlertCircle size={32} />
                            )}
                        </div>

                        <h2>
                            {deleteFeedback.type === 'success'
                                ? 'Deleted Successfully!'
                                : 'Deletion Failed'}
                        </h2>

                        <p>{deleteFeedback.message}</p>

                        <button
                            type="button"
                            className="feedback-ok-btn"
                            onClick={() => setDeleteFeedback(null)}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Topics;
