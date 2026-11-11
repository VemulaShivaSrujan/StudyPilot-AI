
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap, Mail, Lock } from 'lucide-react';
import api from '../services/api';
import './Auth.css';

const Login = () => {
    const [formData, setFormData] = useState({
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
            const response = await api.post('/auth/login', formData);

            if (response.data.success) {
                navigate('/verify-login-otp', {
                    state: { email: formData.email }
                });
            }
        } catch (error) {
            setError(
                error.response?.data?.message ||
                'Unable to login. Please try again.'
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

                <h1>Welcome Back!</h1>
                <p>Login to continue your learning journey.</p>

                {error && <div className="auth-error">{error}</div>}

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
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Please wait...' : 'Login'}
                </button>

                <p className="auth-footer">
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </form>
        </div>
    );
};

export default Login;
