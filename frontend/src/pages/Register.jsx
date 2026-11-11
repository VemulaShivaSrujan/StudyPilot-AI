
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, UserRound, Mail, Lock } from 'lucide-react';
import api from '../services/api';
import './Auth.css';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post(
                '/auth/register',
                formData
            );

            if (response.data.success) {
                navigate('/verify-otp', {
                    state: { email: formData.email }
                });
            }

        } catch (error) {
            setError(
                error.response?.data?.message ||
                'Registration failed. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <form className="auth-card" onSubmit={handleSubmit}>

                <div className="auth-logo">
                    <GraduationCap size={35} />
                    <h2>StudyPilot AI</h2>
                </div>

                <h1>Create Account</h1>

                <p>Start your smarter learning journey today.</p>

                {error && (
                    <div className="auth-error">{error}</div>
                )}

                <label>Full Name</label>

                <div className="auth-input">
                    <UserRound size={19} />

                    <input
                        type="text"
                        name="name"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

                <label>Email Address</label>

                <div className="auth-input">
                    <Mail size={19} />

                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <label>Password</label>

                <div className="auth-input">
                    <Lock size={19} />

                    <input
                        type="password"
                        name="password"
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Sign Up'}
                </button>

                <p className="auth-footer">
                    Already have an account?{' '}
                    <Link to="/login">Login</Link>
                </p>

            </form>
        </div>
    );
};

export default Register;
