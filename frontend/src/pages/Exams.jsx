
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    Plus,
    CalendarDays,
    BookOpen,
    Pencil,
    Trash2,
    X,
    AlertCircle,
    GraduationCap,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';

import api from '../services/api';
import './Exams.css';

const Exams = () => {
    const navigate = useNavigate();

    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [showForm, setShowForm] = useState(false);
    const [editingExam, setEditingExam] = useState(null);

    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [examToDelete, setExamToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteFeedback, setDeleteFeedback] = useState(null);

    const initialForm = {
        examName: '',
        examType: 'University',
        examDate: '',
        priority: 'Medium',
        description: ''
    };

    const [formData, setFormData] = useState(initialForm);

    const token = localStorage.getItem('token');

    const config = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    // Fetch all exams
    const fetchExams = async () => {
        try {
            const response = await api.get('/exams', config);
            setExams(response.data.exams || []);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                'Unable to load exams.'
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExams();
    }, []);

    // Handle input changes
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    // Open add form
    const handleAddExam = () => {
        setEditingExam(null);
        setFormData(initialForm);
        setError('');
        setMessage('');
        setShowForm(true);
    };

    // Open edit form
    const handleEditExam = (exam) => {
        setEditingExam(exam);

        setFormData({
            examName: exam.examName,
            examType: exam.examType,
            examDate: new Date(exam.examDate)
                .toISOString()
                .split('T')[0],
            priority: exam.priority,
            description: exam.description || ''
        });

        setError('');
        setMessage('');
        setShowForm(true);
    };

    // Submit exam form
    const handleSubmit = async (e) => {
        e.preventDefault();

        setError('');
        setMessage('');
        setSaving(true);

        try {
            if (editingExam) {
                await api.put(
                    `/exams/${editingExam.id}`,
                    formData,
                    config
                );

                setMessage('Exam updated successfully!');
            } else {
                await api.post('/exams', formData, config);

                setMessage('Exam added successfully!');
            }

            setFormData(initialForm);
            setEditingExam(null);
            setShowForm(false);

            await fetchExams();

        } catch (error) {
            setError(
                error.response?.data?.message ||
                'Unable to save exam.'
            );
        } finally {
            setSaving(false);
        }
    };

    // Open delete confirmation
    const handleDeleteExam = (exam) => {
        setExamToDelete(exam);
        setShowDeleteModal(true);
        setDeleteFeedback(null);
        setError('');
        setMessage('');
    };

    // Cancel deletion
    const handleCancelDelete = () => {
        if (deleting) return;

        setShowDeleteModal(false);
        setExamToDelete(null);
    };

    // Confirm deletion
    const confirmDelete = async () => {
        if (!examToDelete || deleting) return;

        try {
            setDeleting(true);
            setError('');
            setMessage('');

            await api.delete(`/exams/${examToDelete.id}`, config);

            setShowDeleteModal(false);
            setExamToDelete(null);

            await fetchExams();

            setDeleteFeedback({
                type: 'success',
                message: 'Exam deleted successfully!'
            });

        } catch (error) {
            setShowDeleteModal(false);
            setExamToDelete(null);

            setDeleteFeedback({
                type: 'error',
                message: error.response?.data?.message ||
                    'Unable to delete exam. Please try again.'
            });
        } finally {
            setDeleting(false);
        }
    };

    // Open subjects belonging to an exam
    const handleOpenSubjects = (examId) => {
        navigate(`/subjects?examId=${examId}`);
    };

    // Calculate exam status
    const getExamStatus = (examDate) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const date = new Date(examDate);
        date.setHours(0, 0, 0, 0);

        if (date < today) return 'Completed';

        if (date.getTime() === today.getTime()) {
            return 'Today';
        }

        return 'Upcoming';
    };

    // Format exam date
    const formatDate = (examDate) => {
        return new Date(examDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const upcomingExams = exams.filter(
        exam => getExamStatus(exam.examDate) !== 'Completed'
    );

    const completedExams = exams.filter(
        exam => getExamStatus(exam.examDate) === 'Completed'
    );

    if (loading) {
        return (
            <div className="exams-loading">
                Loading your exams...
            </div>
        );
    }

    return (
        <div className="exams-page">

            {/* Page Header */}
            <div className="exams-header">
                <div>
                    <h1>My Exams</h1>
                    <p>
                        Manage your examinations and stay prepared.
                    </p>
                </div>

                <button
                    className="add-exam-button"
                    onClick={handleAddExam}
                >
                    <Plus size={19} />
                    Add Exam
                </button>
            </div>

            {/* Messages */}
            {error && (
                <div className="exam-message exam-error">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {message && (
                <div className="exam-message exam-success">
                    <CheckCircle2 size={18} />
                    {message}
                </div>
            )}

            {/* Statistics */}
            <div className="exam-stats">
                <div className="exam-stat-card">
                    <CalendarDays size={25} />
                    <div>
                        <h3>{exams.length}</h3>
                        <p>Total Exams</p>
                    </div>
                </div>

                <div className="exam-stat-card">
                    <BookOpen size={25} />
                    <div>
                        <h3>{upcomingExams.length}</h3>
                        <p>Upcoming Exams</p>
                    </div>
                </div>

                <div className="exam-stat-card">
                    <GraduationCap size={25} />
                    <div>
                        <h3>{completedExams.length}</h3>
                        <p>Completed Exams</p>
                    </div>
                </div>
            </div>

            {/* Add / Edit Form */}
            {showForm && (
                <div className="exam-form-card">
                    <div className="exam-form-heading">
                        <h2>
                            {editingExam ? 'Edit Exam' : 'Add New Exam'}
                        </h2>

                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="exam-close-button"
                        >
                            <X size={22} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="exam-form-grid">
                            <div className="exam-field">
                                <label>Exam Name *</label>
                                <input
                                    type="text"
                                    name="examName"
                                    value={formData.examName}
                                    onChange={handleChange}
                                    placeholder="Enter exam name"
                                    maxLength={100}
                                    required
                                />
                            </div>

                            <div className="exam-field">
                                <label>Exam Type *</label>
                                <select
                                    name="examType"
                                    value={formData.examType}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="University">University</option>
                                    <option value="Competitive">Competitive</option>
                                    <option value="School">School</option>
                                    <option value="Entrance">Entrance</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            <div className="exam-field">
                                <label>Exam Date *</label>
                                <input
                                    type="date"
                                    name="examDate"
                                    value={formData.examDate}
                                    onChange={handleChange}
                                    min={new Date().toLocaleDateString('en-CA')}
                                    required
                                />
                            </div>

                            <div className="exam-field">
                                <label>Priority *</label>
                                <select
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                </select>
                            </div>

                            <div className="exam-field exam-description">
                                <label>Description</label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="Enter exam details..."
                                    rows="3"
                                    maxLength={1000}
                                />
                            </div>
                        </div>

                        <div className="exam-form-actions">
                            <button
                                type="button"
                                className="exam-cancel-button"
                                onClick={() => setShowForm(false)}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="exam-save-button"
                                disabled={saving}
                            >
                                {saving
                                    ? 'Saving...'
                                    : editingExam
                                        ? 'Update Exam'
                                        : 'Save Exam'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Upcoming Exams */}
            <div className="exam-section">
                <h2>Upcoming Exams</h2>

                {upcomingExams.length === 0 ? (
                    <div className="exam-empty">
                        <CalendarDays size={42} />
                        <h3>No Upcoming Exams</h3>
                        <p>
                            Add your examinations to start planning.
                        </p>
                    </div>
                ) : (
                    <div className="exam-grid">
                        {upcomingExams.map((exam) => (
                            <div
                                className="exam-card"
                                key={exam.id}
                                onClick={() => handleOpenSubjects(exam.id)}
                                style={{ cursor: 'pointer' }}
                                title="Click to view subjects"
                            >
                                <div className="exam-card-top">
                                    <span className={`priority-badge ${exam.priority.toLowerCase()}`}>
                                        {exam.priority} Priority
                                    </span>

                                    <span className={`exam-status ${getExamStatus(exam.examDate).toLowerCase()}`}>
                                        {getExamStatus(exam.examDate)}
                                    </span>
                                </div>

                                <h3>{exam.examName}</h3>

                                <p className="exam-type">
                                    {exam.examType}
                                </p>

                                <div className="exam-date">
                                    <CalendarDays size={17} />
                                    {formatDate(exam.examDate)}
                                </div>

                                {exam.description && (
                                    <p className="exam-description-text">
                                        {exam.description}
                                    </p>
                                )}

                                <div className="exam-card-actions">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleEditExam(exam);
                                        }}
                                        className="exam-edit-button"
                                    >
                                        <Pencil size={16} />
                                        Edit
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteExam(exam);
                                        }}
                                        className="exam-delete-button"
                                    >
                                        <Trash2 size={16} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Completed Exams */}
            {completedExams.length > 0 && (
                <div className="exam-section">
                    <h2>Completed Exams</h2>

                    <div className="exam-grid">
                        {completedExams.map((exam) => (
                            <div
                                className="exam-card completed-exam"
                                key={exam.id}
                                onClick={() => handleOpenSubjects(exam.id)}
                                style={{ cursor: 'pointer' }}
                                title="Click to view subjects"
                            >
                                <span className="exam-status completed">
                                    Completed
                                </span>

                                <h3>{exam.examName}</h3>

                                <p className="exam-type">
                                    {exam.examType}
                                </p>

                                <div className="exam-date">
                                    <CalendarDays size={17} />
                                    {formatDate(exam.examDate)}
                                </div>

                                <div className="exam-card-actions">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteExam(exam);
                                        }}
                                        className="exam-delete-button"
                                    >
                                        <Trash2 size={16} />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Delete Confirmation Popup */}
            {showDeleteModal && examToDelete && (
                <div
                    className="delete-modal-overlay"
                    onClick={handleCancelDelete}
                >
                    <div
                        className="delete-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="exam-delete-title"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="delete-modal-icon">
                            <AlertTriangle size={30} />
                        </div>

                        <h2 id="exam-delete-title">
                            Delete Exam?
                        </h2>

                        <p>
                            Are you sure you want to delete
                            {' '}
                            <strong>{examToDelete.examName}</strong>?
                            {' '}
                            This action cannot be undone.
                        </p>

                        <div className="delete-modal-actions">
                            <button
                                className="delete-cancel-btn"
                                onClick={handleCancelDelete}
                                disabled={deleting}
                            >
                                Cancel
                            </button>

                            <button
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
                            {deleteFeedback.type === 'success'
                                ? <CheckCircle2 size={32} />
                                : <AlertCircle size={32} />}
                        </div>

                        <h2>
                            {deleteFeedback.type === 'success'
                                ? 'Successfully Deleted!'
                                : 'Deletion Failed'}
                        </h2>

                        <p>{deleteFeedback.message}</p>

                        <button
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

export default Exams;
