
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
    Plus,
    BookOpen,
    Pencil,
    Trash2,
    X,
    Layers,
    AlertCircle,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';

import api from '../services/api';
import './Subjects.css';

const isValidMongoId = (id) => {
    return /^[a-fA-F0-9]{24}$/.test(String(id || ''));
};

const getId = (item) => {
    return String(item?.id || item?._id || '');
};

const Subjects = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const requestedExamId = searchParams.get('examId');
    const token = localStorage.getItem('token');

    const config = {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };

    const [exams, setExams] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [selectedExam, setSelectedExam] = useState('');

    const [loadingExams, setLoadingExams] = useState(true);
    const [loadingSubjects, setLoadingSubjects] = useState(false);

    const [showForm, setShowForm] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);

    const [subjectData, setSubjectData] = useState({
        subjectName: '',
        description: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Delete popup states
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [subjectToDelete, setSubjectToDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [deleteFeedback, setDeleteFeedback] = useState(null);

    // Fetch examinations
    const fetchExams = async () => {
        try {
            setLoadingExams(true);
            setError('');

            const response = await api.get('/exams', config);
            const examList = response.data.exams || [];

            setExams(examList);

            if (examList.length > 0) {
                const requestedExam = examList.find(
                    exam => getId(exam) === String(requestedExamId || '')
                );

                const examId = requestedExam
                    ? getId(requestedExam)
                    : getId(examList[0]);

                if (isValidMongoId(examId)) {
                    setSelectedExam(examId);
                } else {
                    setError('The examination has an invalid ID. Please refresh the page.');
                }
            } else {
                setSelectedExam('');
            }

        } catch (err) {
            console.error('Fetch exams error:', err.response?.data || err.message);

            setError(
                err.response?.data?.message ||
                'Unable to load examinations.'
            );

        } finally {
            setLoadingExams(false);
        }
    };

    // Fetch subjects
    const fetchSubjects = async (examId) => {
        if (!isValidMongoId(examId)) {
            setSubjects([]);
            return;
        }

        try {
            setLoadingSubjects(true);
            setError('');

            const response = await api.get(
                `/subjects/exam/${examId}`,
                config
            );

            setSubjects(response.data.subjects || []);

        } catch (err) {
            console.error('Fetch subjects error:', err.response?.data || err.message);

            setSubjects([]);

            setError(
                err.response?.data?.message ||
                'Unable to load subjects.'
            );

        } finally {
            setLoadingSubjects(false);
        }
    };

    useEffect(() => {
        fetchExams();
    }, []);

    useEffect(() => {
        if (selectedExam && isValidMongoId(selectedExam)) {
            fetchSubjects(selectedExam);
        } else {
            setSubjects([]);
        }
    }, [selectedExam]);

    // Handle examination selection
    const handleExamChange = (event) => {
        setSelectedExam(event.target.value);
        setShowForm(false);
        setEditingSubject(null);
        setError('');
        setSuccess('');
    };

    // Add subject
    const handleAddSubject = () => {
        setEditingSubject(null);

        setSubjectData({
            subjectName: '',
            description: ''
        });

        setError('');
        setSuccess('');
        setShowForm(true);
    };

    // Edit subject
    const handleEdit = (subject) => {
        setEditingSubject(subject);

        setSubjectData({
            subjectName: subject.subjectName || '',
            description: subject.description || ''
        });

        setError('');
        setSuccess('');
        setShowForm(true);
    };

    // Handle form changes
    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setSubjectData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Add or update subject
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!isValidMongoId(selectedExam)) {
            setError('Invalid examination ID. Please select an examination again.');
            return;
        }

        if (!subjectData.subjectName.trim()) {
            setError('Please enter a subject name.');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            if (editingSubject) {
                const subjectId = getId(editingSubject);

                if (!isValidMongoId(subjectId)) {
                    setError('Invalid subject ID.');
                    return;
                }

                await api.put(
                    `/subjects/${subjectId}`,
                    {
                        subjectName: subjectData.subjectName.trim(),
                        description: subjectData.description.trim()
                    },
                    config
                );

                setSuccess('Subject updated successfully!');

            } else {
                await api.post(
                    '/subjects',
                    {
                        subjectName: subjectData.subjectName.trim(),
                        description: subjectData.description.trim(),
                        examId: selectedExam
                    },
                    config
                );

                setSuccess('Subject added successfully!');
            }

            setShowForm(false);
            setEditingSubject(null);

            setSubjectData({
                subjectName: '',
                description: ''
            });

            await fetchSubjects(selectedExam);

        } catch (err) {
            console.error('Save subject error:', err.response?.data || err.message);

            setError(
                err.response?.data?.message ||
                'Unable to save subject.'
            );

        } finally {
            setLoading(false);
        }
    };

    // Open delete confirmation
    const handleDelete = (subject) => {
        const subjectId = getId(subject);

        if (!isValidMongoId(subjectId)) {
            setError('Invalid subject ID.');
            return;
        }

        setSubjectToDelete(subject);
        setShowDeleteModal(true);
        setDeleteFeedback(null);
    };

    // Cancel deletion
    const handleCancelDelete = () => {
        if (deleting) return;

        setShowDeleteModal(false);
        setSubjectToDelete(null);
    };

    // Confirm deletion
    const confirmDelete = async () => {
        if (!subjectToDelete || deleting) return;

        const subjectId = getId(subjectToDelete);

        try {
            setDeleting(true);
            setError('');
            setSuccess('');

            await api.delete(
                `/subjects/${subjectId}`,
                config
            );

            setShowDeleteModal(false);
            setSubjectToDelete(null);

            await fetchSubjects(selectedExam);

            setDeleteFeedback({
                type: 'success',
                message: 'Subject deleted successfully!'
            });

        } catch (err) {
            console.error('Delete subject error:', err.response?.data || err.message);

            setShowDeleteModal(false);
            setSubjectToDelete(null);

            setDeleteFeedback({
                type: 'error',
                message: err.response?.data?.message ||
                    'Unable to delete subject. Please try again.'
            });

        } finally {
            setDeleting(false);
        }
    };

    // Navigate to topics
    const handleViewTopics = (subject) => {
        const subjectId = getId(subject);

        if (!isValidMongoId(subjectId)) {
            setError('Invalid subject ID.');
            return;
        }

        navigate(`/topics?subjectId=${subjectId}`);
    };

    // Cancel form
    const handleCancel = () => {
        setShowForm(false);
        setEditingSubject(null);

        setSubjectData({
            subjectName: '',
            description: ''
        });

        setError('');
    };

    if (loadingExams) {
        return (
            <div className="subjects-page">
                <div className="subjects-loading">
                    Loading examinations...
                </div>
            </div>
        );
    }

    return (
        <div className="subjects-page">

            <div className="subjects-header">
                <div>
                    <h1>My Subjects</h1>
                    <p>
                        Organize your subjects and manage their topics.
                    </p>
                </div>

                <button
                    className="add-subject-btn"
                    onClick={handleAddSubject}
                    disabled={!selectedExam}
                >
                    <Plus size={18} />
                    Add Subject
                </button>
            </div>

            {/* Examination selection */}
            <div className="exam-selection">
                <label htmlFor="examSelect">
                    Select Examination
                </label>

                <select
                    id="examSelect"
                    value={selectedExam}
                    onChange={handleExamChange}
                >
                    {exams.map(exam => (
                        <option
                            key={getId(exam)}
                            value={getId(exam)}
                        >
                            {exam.examName}
                        </option>
                    ))}
                </select>
            </div>

            {/* Error message */}
            {error && (
                <div className="subjects-message error-message">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Success message */}
            {success && (
                <div className="subjects-message success-message">
                    <CheckCircle2 size={18} />
                    {success}
                </div>
            )}

            {/* Subject form */}
            {showForm && (
                <div className="subject-form-container">

                    <div className="subject-form-header">
                        <h2>
                            {editingSubject ? 'Edit Subject' : 'Add New Subject'}
                        </h2>

                        <button
                            type="button"
                            className="close-form-btn"
                            onClick={handleCancel}
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>

                        <div className="form-group">
                            <label htmlFor="subjectName">
                                Subject Name
                            </label>

                            <input
                                id="subjectName"
                                type="text"
                                name="subjectName"
                                placeholder="Enter subject name"
                                value={subjectData.subjectName}
                                onChange={handleInputChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="description">
                                Description
                            </label>

                            <textarea
                                id="description"
                                name="description"
                                placeholder="Enter subject description (optional)"
                                value={subjectData.description}
                                onChange={handleInputChange}
                                rows="3"
                            />
                        </div>

                        <div className="subject-form-actions">

                            <button
                                type="button"
                                className="cancel-btn"
                                onClick={handleCancel}
                                disabled={loading}
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="save-subject-btn"
                                disabled={loading}
                            >
                                {loading
                                    ? 'Saving...'
                                    : editingSubject
                                        ? 'Update Subject'
                                        : 'Save Subject'}
                            </button>

                        </div>

                    </form>
                </div>
            )}

            {/* Subjects list */}
            <div className="subjects-content">

                {loadingSubjects ? (

                    <div className="subjects-loading">
                        Loading subjects...
                    </div>

                ) : subjects.length === 0 ? (

                    <div className="empty-subjects">
                        <BookOpen size={48} />

                        <h2>No Subjects Yet</h2>

                        <p>
                            Add subjects to this examination to start
                            organizing your study topics.
                        </p>

                        {selectedExam && (
                            <button
                                className="add-subject-btn"
                                onClick={handleAddSubject}
                            >
                                <Plus size={18} />
                                Add Your First Subject
                            </button>
                        )}
                    </div>

                ) : (

                    <div className="subjects-grid">

                        {subjects.map(subject => (

                            <div
                                className="subject-card"
                                key={getId(subject)}
                            >

                                <div className="subject-card-icon">
                                    <BookOpen size={24} />
                                </div>

                                <div className="subject-card-content">
                                    <h3>{subject.subjectName}</h3>

                                    <p>
                                        {subject.description ||
                                            'No description added.'}
                                    </p>
                                </div>

                                <div className="subject-card-actions">

                                    <button
                                        className="view-topics-btn"
                                        onClick={() => handleViewTopics(subject)}
                                    >
                                        <Layers size={16} />
                                        View Topics
                                    </button>

                                    <button
                                        className="edit-subject-btn"
                                        onClick={() => handleEdit(subject)}
                                        title="Edit subject"
                                    >
                                        <Pencil size={16} />
                                    </button>

                                    <button
                                        className="delete-subject-btn"
                                        onClick={() => handleDelete(subject)}
                                        title="Delete subject"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                </div>

                            </div>

                        ))}

                    </div>
                )}

            </div>

            {/* Delete confirmation popup */}
            {showDeleteModal && subjectToDelete && (
                <div
                    className="delete-modal-overlay"
                    onClick={handleCancelDelete}
                >
                    <div
                        className="delete-modal"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-modal-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="delete-modal-icon">
                            <AlertTriangle size={30} />
                        </div>

                        <h2 id="delete-modal-title">
                            Delete Subject?
                        </h2>

                        <p>
                            Are you sure you want to delete
                            {' '}
                            <strong>{subjectToDelete.subjectName}</strong>?
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

            {/* Delete success/error popup */}
            {deleteFeedback && (
                <div
                    className="delete-modal-overlay"
                    onClick={() => setDeleteFeedback(null)}
                >
                    <div
                        className={`delete-feedback-modal ${deleteFeedback.type}`}
                        role="alertdialog"
                        aria-modal="true"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className={`feedback-icon ${deleteFeedback.type}`}>
                            {deleteFeedback.type === 'success'
                                ? <CheckCircle2 size={32} />
                                : <AlertCircle size={32} />
                            }
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

export default Subjects;
