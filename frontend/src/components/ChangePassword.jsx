
import { useState } from 'react';

import {
    Lock,
    Eye,
    EyeOff,
    Save
} from 'lucide-react';

import api from '../services/api';
import './ChangePassword.css';

const ChangePassword = () => {

    const [formData, setFormData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const togglePassword = (field) => {
        setShowPasswords((prev) => ({
            ...prev,
            [field]: !prev[field]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError('');
        setMessage('');

        if (formData.newPassword !== formData.confirmPassword) {
            setError('New passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            // Get token from localStorage
            const token = localStorage.getItem('token');

            const response = await api.put(
                '/auth/change-password',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMessage(response.data.message);

            setFormData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });

        } catch (error) {
            setError(
                error.response?.data?.message ||
                'Unable to change password.'
            );

        } finally {
            setLoading(false);
        }
    };

    const renderPasswordField = (label, name, field) => (
        <div className="password-field">

            <label>{label}</label>

            <div className="password-input-wrapper">

                <Lock size={19} />

                <input
                    type={showPasswords[field] ? 'text' : 'password'}
                    name={name}
                    value={formData[name]}
                    onChange={handleChange}
                    placeholder={`Enter ${label.toLowerCase()}`}
                    required
                />

                <button
                    type="button"
                    className="password-eye"
                    onClick={() => togglePassword(field)}
                    aria-label={
                        showPasswords[field]
                            ? 'Hide password'
                            : 'Show password'
                    }
                >
                    {showPasswords[field] ? (
                        <EyeOff size={19} />
                    ) : (
                        <Eye size={19} />
                    )}
                </button>

            </div>
        </div>
    );

    return (
        <div className="change-password-card">

            <div className="change-password-heading">

                <div className="change-password-icon">
                    <Lock size={25} />
                </div>

                <div>
                    <h2>Change Password</h2>
                    <p>
                        Keep your account secure with a strong password.
                    </p>
                </div>

            </div>

            {error && (
                <div className="password-error">
                    {error}
                </div>
            )}

            {message && (
                <div className="password-success">
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>

                {renderPasswordField(
                    'Current Password',
                    'currentPassword',
                    'current'
                )}

                {renderPasswordField(
                    'New Password',
                    'newPassword',
                    'new'
                )}

                {renderPasswordField(
                    'Confirm New Password',
                    'confirmPassword',
                    'confirm'
                )}

                <small className="password-hint">
                    Your new password must contain at least 8 characters.
                </small>

                <button
                    type="submit"
                    className="change-password-button"
                    disabled={loading}
                >
                    <Save size={18} />

                    {loading ? 'Updating...' : 'Update Password'}
                </button>

            </form>

        </div>
    );
};

export default ChangePassword;
