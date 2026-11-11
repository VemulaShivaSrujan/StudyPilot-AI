
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
    Plus,
    BookOpen,
    Pencil,
    Trash2,
    X,
    Layers,
    AlertCircle
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

    // Fetch student's examinations
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

    // Fetch subjects belonging to selected examination
    const fetchSubjects = async (examId) => {
        console.log('========== SUBJECT FETCH DEBUG ==========');
        console.log('Exam ID received:', JSON.stringify(examId));
        console.log('Exam ID type:', typeof examId);
        console.log('Exam ID length:', String(examId).length);

        if (!isValidMongoId(examId)) {
            console.error('Invalid examination ID:', examId);
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

            console.log('Subjects API response:', response.data);

            setSubjects(response.data.subjects || []);

        } catch (err) {
            console.error('Subjects API status:', err.response?.status);
            console.error('Subjects API response:', err.response?.data);
            console.error('Subjects API error:', err.message);

            setSubjects([]);

            setError(
                err.response?.data?.message ||
                'Unable to load subjects.'
            );

        } finally {
            setLoadingSubjects(false);
        }
    };

    // Initial exam loading
    useEffect(() => {
        fetchExams();
    }, []);

    // Load subjects whenever selected examination changes
    useEffect(() => {
        if (selectedExam && isValidMongoId(selectedExam)) {
            fetchSubjects(selectedExam);
        } else {
            setSubjects([]);
        }
    }, [selectedExam]);

    // Handle examination dropdown
    const handleExamChange = (event) => {
        const examId = event.target.value;

        setSelectedExam(examId);
        setShowForm(false);
        setEditingSubject(null);
        setError('');
        setSuccess('');
    };

    // Open add subject form
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

    // Open edit subject form
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

    // Handle input changes
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

    // Delete subject
    const handleDelete = async (subject) => {
        const subjectId = getId(subject);

        if (!isValidMongoId(subjectId)) {
            setError('Invalid subject ID.');
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to delete "${subject.subjectName}"?`
        );

        if (!confirmed) return;

        try {
            setError('');
            setSuccess('');

            await api.delete(
                `/subjects/${subjectId}`,
                config
            );

            setSuccess('Subject deleted successfully!');

            await fetchSubjects(selectedExam);

        } catch (err) {
            console.error('Delete subject error:', err.response?.data || err.message);

            setError(
                err.response?.data?.message ||
                'Unable to delete subject.'
            );
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
                    {success}
                </div>
            )}

            {/* Subject form */}
            {showForm && (
                <div className="subject-form-container">

                    <div className="subject-form-header">
                        <h2>
                            {editingSubject
                                ? 'Edit Subject'
                                : 'Add New Subject'}
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

                                    <h3>
                                        {subject.subjectName}
                                    </h3>

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

        </div>
    );
};

export default Subjects;
