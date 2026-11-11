
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

const VerifyOTP = () => {
    const [otp, setOtp] = useState('');
    const [showOtp, setShowOtp] = useState(false);
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const location = useLocation();
    const navigate = useNavigate();

    const { login } = useAuth();

    const email = location.state?.email;

    const maskEmail = (email) => {
        const [local, domain] = email.split('@');
        const [domainName, ...extensions] = domain.split('.');

        return `${local[0]}***@${domainName[0]}***.${extensions.join('.')}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setError('');
        setMessage('');
        setLoading(true);

        try {
            const response = await api.post(
                '/auth/verify-otp',
                { email, otp }
            );

            if (response.data.success) {

                // Automatically log in using the token
                const loginSuccess = await login(response.data.token);

                if (loginSuccess) {
                    navigate('/dashboard', { replace: true });
                } else {
                    setError(
                        'Email verified, but unable to load your profile. Please try again.'
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

    const handleResendOTP = async () => {
        setError('');
        setMessage('');
        setResending(true);

        try {
            const response = await api.post(
                '/auth/resend-otp',
                { email }
            );

            setMessage(response.data.message);

        } catch (error) {
            setError(
                error.response?.data?.message ||
                'Unable to resend OTP. Please try again.'
            );
        } finally {
            setResending(false);
        }
    };

    if (!email) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-logo">
                        <GraduationCap size={35} />
                        <h2>StudyPilot AI</h2>
                    </div>

                    <h2>Registration session not found</h2>
                    <p>Please register again to receive your OTP.</p>

                    <Link to="/register">Go to Sign Up</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <form className="auth-card" onSubmit={handleSubmit}>

                <div className="auth-logo">
                    <GraduationCap size={35} />
                    <h2>StudyPilot AI</h2>
                </div>

                <h1>Verify Your Email</h1>

                <p>
                    Enter the six-digit OTP sent to your email.
                </p>

                {error && (
                    <div className="auth-error">{error}</div>
                )}

                {message && (
                    <div className="auth-success">{message}</div>
                )}

                <label>Email Address</label>

                <div className="auth-input">
                    <Mail size={19} />

                    <input
                        type="text"
                        value={maskEmail(email)}
                        readOnly
                    />
                </div>

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

                    <button
                        type="button"
                        className="otp-toggle"
                        onClick={() => setShowOtp(!showOtp)}
                        aria-label={showOtp ? 'Hide OTP' : 'Show OTP'}
                    >
                        {showOtp
                            ? <EyeOff size={20} />
                            : <Eye size={20} />
                        }
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={loading || otp.length !== 6}
                >
                    {loading ? 'Verifying...' : 'Verify Email'}
                </button>

                <p className="auth-footer">
                    Didn't receive the OTP?
                </p>

                <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={resending}
                >
                    {resending ? 'Sending...' : 'Resend OTP'}
                </button>

            </form>
        </div>
    );
};

export default VerifyOTP;
