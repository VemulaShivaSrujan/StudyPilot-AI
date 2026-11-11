
import {
    Clock,
    BookOpen,
    CalendarDays,
    Target,
    ArrowRight,
    GraduationCap
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

import { Link } from 'react-router-dom';

import './Dashboard.css';

const Dashboard = () => {

    const { student } = useAuth();

    const today = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const stats = [
        {
            title: "Today's Study Time",
            value: '0 Hours',
            icon: Clock,
            description: 'Study tracking coming soon'
        },
        {
            title: 'Upcoming Exams',
            value: '0',
            icon: CalendarDays,
            description: 'No exams added yet'
        },
        {
            title: 'Completed Sessions',
            value: '0',
            icon: BookOpen,
            description: 'Study sessions coming soon'
        },
        {
            title: 'Study Progress',
            value: '0%',
            icon: Target,
            description: 'Progress tracking coming soon'
        }
    ];

    return (
        <div className="dashboard">

            {/* Dashboard Header */}
            <div className="dashboard-header">

                <div>
                    <h1>
                        Welcome back, {student?.name || 'Student'}! 👋
                    </h1>

                    <p>
                        Let's make today a productive study day.
                    </p>

                    <small>{today}</small>
                </div>

            </div>

            {/* Statistics */}
            <div className="stats-grid">

                {stats.map((stat, index) => {

                    const Icon = stat.icon;

                    return (
                        <div className="stat-card" key={index}>

                            <div className="stat-icon">
                                <Icon size={24} />
                            </div>

                            <h3>{stat.title}</h3>

                            <h2>{stat.value}</h2>

                            <small>{stat.description}</small>

                        </div>
                    );
                })}

            </div>

            {/* Dashboard Sections */}
            <div className="dashboard-sections">

                {/* Today's Study Plan */}
                <div className="dashboard-card">

                    <div className="dashboard-card-heading">
                        <Clock size={23} />
                        <h2>Today's Study Plan</h2>
                    </div>

                    <p>
                        Your daily study timetable will appear here.
                        Add your exams and subjects to start planning.
                    </p>

                    <Link to="/timetable" className="dashboard-button">
                        View Timetable
                        <ArrowRight size={16} />
                    </Link>

                </div>

                {/* Upcoming Exams */}
                <div className="dashboard-card">

                    <div className="dashboard-card-heading">
                        <GraduationCap size={23} />
                        <h2>Upcoming Exams</h2>
                    </div>

                    <p>
                        Keep track of your examination dates and
                        preparation progress in one place.
                    </p>

                    <Link to="/exams" className="dashboard-button">
                        View Exams
                        <ArrowRight size={16} />
                    </Link>

                </div>

            </div>

        </div>
    );
};

export default Dashboard;
