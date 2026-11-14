
import { useEffect, useState } from 'react';

import {
    UserRound,
    Mail,
    Phone,
    GraduationCap,
    BookOpen,
    Save
} from 'lucide-react';

import api from '../services/api';
import './Profile.css';
import ChangePassword from '../components/ChangePassword';

const Profile = () => {

    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        college: '',
        course: ''
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    // Get authentication token from localStorage
    const token = localStorage.getItem('token');

    useEffect(() => {

        const fetchProfile = async () => {

            try {
                const response = await api.get('/auth/profile', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                setProfile(response.data.student);

            } catch (error) {
                setError(
                    error.response?.data?.message ||
                    'Unable to load your profile.'
                );

            } finally {
                setLoading(false);
            }
        };

        fetchProfile();

    }, [token]);

    const handleChange = (e) => {

        const { name, value } = e.target;

        setProfile((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError('');
        setMessage('');
        setSaving(true);

        try {
            const response = await api.put(
                '/auth/profile',
                {
                    name: profile.name,
                    phone: profile.phone,
                    college: profile.college,
                    course: profile.course
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage(response.data.message);

        } catch (error) {
            setError(
                error.response?.data?.message ||
                'Unable to update your profile.'
            );

        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="profile-loading">
                Loading profile...
            </div>
        );
    }

    return (
        <div className="profile-page">

            <div className="profile-heading">
                <h1>My Profile</h1>
                <p>Manage your personal and academic information.</p>
            </div>

            <div className="profile-card">

                <div className="profile-avatar">
                    <UserRound size={40} />
                </div>

                <h2>{profile.name}</h2>

                <p className="profile-subtitle">
                    StudyPilot AI Student
                </p>

                {error && (
                    <div className="profile-error">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="profile-success">
                        {message}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    {/* Email Address */}
                    <div className="profile-field">
                        <label>Email Address</label>

                        <div className="profile-input">
                            <Mail size={19} />

                            <input
                                type="email"
                                value={profile.email}
                                readOnly
                            />
                        </div>

                        <small>
                            Email address cannot be changed.
                        </small>
                    </div>

                    {/* Full Name */}
                    <div className="profile-field">
                        <label>Full Name</label>

                        <div className="profile-input">
                            <UserRound size={19} />

                            <input
                                type="text"
                                name="name"
                                value={profile.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    {/* Phone Number */}
                    <div className="profile-field">
                        <label>Phone Number</label>

                        <div className="profile-input">
                            <Phone size={19} />

                            <input
                                type="tel"
                                name="phone"
                                value={profile.phone}
                                onChange={handleChange}
                                placeholder="Enter phone number"
                            />
                        </div>
                    </div>

                    {/* College */}
                    <div className="profile-field">
                        <label>College</label>

                        <div className="profile-input">
                            <GraduationCap size={19} />

                            <input
                                type="text"
                                name="college"
                                value={profile.college}
                                onChange={handleChange}
                                placeholder="Enter college name"
                            />
                        </div>
                    </div>

                    {/* Course */}
                    <div className="profile-field">
                        <label>Course</label>

                        <div className="profile-input">
                            <BookOpen size={19} />

                            <input
                                type="text"
                                name="course"
                                value={profile.course}
                                onChange={handleChange}
                                placeholder="Enter your course"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="profile-save"
                        disabled={saving}
                    >
                        <Save size={18} />

                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>

                </form>
            </div>

            {/* Change Password Section */}
            <ChangePassword />

        </div>
    );
};

export default Profile;
