
import {
    Link,
    NavLink,
    Outlet,
    useNavigate
} from 'react-router-dom';

import {
    GraduationCap,
    UserRound,
    LogOut,
    Bell
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

import './Navbar.css';

const Navbar = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const navLinks = [
        { name: 'Dashboard', path: '/dashboard' },
        { name: 'My Exams', path: '/exams' },
        { name: 'Timetable', path: '/timetable' },
        { name: 'AI Assistant', path: '/ai-assistant' },
        { name: 'My Progress', path: '/progress' }
    ];

    return (
        <>
            <nav className="navbar">

                {/* Logo */}
                <Link to="/dashboard" className="navbar-logo">
                    <GraduationCap size={28} />
                    <span>StudyPilot AI</span>
                </Link>

                {/* Navigation Links */}
                <div className="navbar-links">
                    {navLinks.map((link) => (
                        <NavLink
                            key={link.path}
                            to={link.path}
                            className={({ isActive }) =>
                                isActive
                                    ? 'nav-link active'
                                    : 'nav-link'
                            }
                        >
                            {link.name}
                        </NavLink>
                    ))}
                </div>

                {/* Notification Bell */}
                <Link
                    to="/notifications"
                    className="navbar-notification"
                    title="Notifications"
                    aria-label="View notifications"
                >
                    <Bell size={21} />
                </Link>

                {/* Student Profile */}
                <Link
                    to="/profile"
                    className="navbar-profile"
                >
                    <UserRound size={20} />
                    <span>My Profile</span>
                </Link>

                {/* Logout */}
                <button
                    className="navbar-logout"
                    onClick={handleLogout}
                    type="button"
                >
                    <LogOut size={19} />
                    <span>Logout</span>
                </button>

            </nav>

            <Outlet />
        </>
    );
};

export default Navbar;
