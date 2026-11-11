
import { useState } from 'react';

import {
    useLocation,
    useNavigate,
    Link
} from 'react-router-dom';

import {
    GraduationCap,
    Mail,
    Eye,
    EyeOff
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

import api from '../services/api';
import './Auth.css';

const VerifyLoginOTP = () => {

    const [otp, setOtp] = useState('');
    const [showOtp, setShowOtp] = useState(false);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const location = useLocation();
    const navigate = useNavigate();

    const { login } = useAuth();

    const email = location.state?.email;

    // Mask email address
    const maskEmail = (email) => {
        const [local, domain] = email.split('@');
        const [domainName, ...extensions] = domain.split('.');

        return `${local[0]}***@${domainName[0]}***.${extensions.join('.')}`;
    };

    // Verify login OTP
    const handleSubmit = async (e) => {

        e.preventDefault();

        setError('');
        setLoading(true);

        try {

            const response = await api.post(
                '/auth/verify-login-otp',
                {
                    email,
                    otp
                }
            );

            if (response.data.success) {

                // Save token and load student profile
                const loginSuccess = await login(
                    response.data.token
                );

                if (loginSuccess) {

                    navigate('/dashboard', {
                        replace: true
                    });

                } else {

                    setError(
                        'Login successful, but unable to load your profile. Please try again.'
                    );

                }
            }

        } catch (error) {

            setError(
                error.response?.data?.message ||
                'OTP verification failed. Please try again.'
            );

        } finally {

            setLoading(false);

        }
    };

    // Check login session
    if (!email) {

        return (
            <div className="auth-container">

                <div className="auth-card">

                    <div className="auth-logo">
                        <GraduationCap size={35} />
                        <h2>StudyPilot AI</h2>
                    </div>

                    <h2>Login session not found</h2>

                    <p>
                        Please login again to receive a new OTP.
                    </p>

                    <Link to="/login">
                        Go to Login
                    </Link>

                </div>

            </div>
        );
    }

    return (
        <div className="auth-container">

            <form
                className="auth-card"
                onSubmit={handleSubmit}
            >

                {/* Logo */}
                <div className="auth-logo">
                    <GraduationCap size={35} />
                    <h2>StudyPilot AI</h2>
                </div>

                {/* Heading */}
                <h1>Verify Your Login</h1>

                <p>
                    Enter the six-digit OTP sent to your email.
                </p>

                {/* Error Message */}
                {error && (
                    <div className="auth-error">
                        {error}
                    </div>
                )}

                {/* Email Address */}
                <label>Email Address</label>

                <div className="auth-input">

                    <Mail size={19} />

                    <input
                        type="text"
                        value={maskEmail(email)}
                        readOnly
                    />

                </div>

                {/* OTP Input */}
                <label>Enter OTP</label>

                <div className="auth-input otp-input">

                    <input
                        type={showOtp ? 'text' : 'password'}
                        placeholder="Enter 6-digit OTP"
                        value={otp}
                        onChange={(e) => {
                            setOtp(
                                e.target.value
                                    .replace(/\D/g, '')
                                    .slice(0, 6)
                            );
                        }}
                        inputMode="numeric"
                        maxLength={6}
                        autoComplete="one-time-code"
                        required
                    />

                    {/* Show / Hide OTP */}
                    <button
                        type="button"
                        className="otp-toggle"
                        onClick={() => setShowOtp(!showOtp)}
                        aria-label={
                            showOtp ? 'Hide OTP' : 'Show OTP'
                        }
                    >
                        {showOtp ? (
                            <EyeOff size={20} />
                        ) : (
                            <Eye size={20} />
                        )}
                    </button>

                </div>

                {/* Verify Button */}
                <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                >
                    {loading ? 'Verifying...' : 'Verify & Login'}
                </button>

                <p className="auth-footer">
                    Your account security is protected by OTP verification.
                </p>

            </form>

        </div>
    );
};

export default VerifyLoginOTP;
