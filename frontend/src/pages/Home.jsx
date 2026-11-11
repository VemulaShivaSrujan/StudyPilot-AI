
import {
    GraduationCap,
    CalendarDays,
    BookOpen,
    Brain,
    ChartNoAxesCombined,
    Timer,
    ArrowRight,
    CheckCircle2
} from 'lucide-react';

import { Link } from 'react-router-dom';

import './Home.css';

const Home = () => {

    const features = [
        {
            icon: CalendarDays,
            title: 'Exam Management',
            description: 'Organize multiple examinations and keep track of important dates.'
        },
        {
            icon: BookOpen,
            title: 'Smart Study Timetable',
            description: 'Plan your daily study sessions and manage your available time.'
        },
        {
            icon: Brain,
            title: 'AI Study Assistant',
            description: 'Understand difficult topics and get intelligent study assistance.'
        },
        {
            icon: ChartNoAxesCombined,
            title: 'Progress Tracking',
            description: 'Monitor your preparation and understand your learning progress.'
        },
        {
            icon: Timer,
            title: 'Focus Mode',
            description: 'Improve concentration with structured study sessions.'
        },
        {
            icon: CheckCircle2,
            title: 'Topic Management',
            description: 'Organize subjects, topics and completed learning activities.'
        }
    ];

    return (
        <div className="home-page">

            {/* Navbar */}
            <nav className="home-navbar">

                <Link to="/" className="home-logo">
                    <GraduationCap size={32} />
                    <span>StudyPilot <strong>AI</strong></span>
                </Link>

                <div className="home-nav-links">
                    <a href="#home">Home</a>
                    <a href="#about">About</a>
                    <a href="#features">Features</a>
                </div>

                <div className="home-nav-actions">
                    <Link to="/login" className="home-login">
                        Login
                    </Link>

                    <Link to="/register" className="home-register">
                        Register
                    </Link>
                </div>

            </nav>

            {/* Hero Section */}
            <section className="home-hero" id="home">

                <div className="hero-content">

                    <span className="hero-label">
                        Your Personal AI Study Companion
                    </span>

                    <h1>
                        Study Smarter.
                        <span> Achieve More.</span>
                    </h1>

                    <p>
                        Take control of your academic journey with
                        intelligent study planning, exam management,
                        AI-powered assistance and progress tracking.
                    </p>

                    <div className="hero-buttons">

                        <Link to="/register" className="hero-primary">
                            Get Started
                            <ArrowRight size={19} />
                        </Link>

                        <a href="#features" className="hero-secondary">
                            Explore Features
                        </a>

                    </div>

                    <div className="hero-benefits">
                        <span>
                            <CheckCircle2 size={17} />
                            Smart Planning
                        </span>

                        <span>
                            <CheckCircle2 size={17} />
                            AI Assistance
                        </span>

                        <span>
                            <CheckCircle2 size={17} />
                            Track Progress
                        </span>
                    </div>

                </div>

                <div className="hero-visual">

                    <div className="hero-illustration">
                        <div className="illustration-icon">
                            <GraduationCap size={85} />
                        </div>

                        <h2>Your Goals. Your Plan.</h2>

                        <p>Your journey to academic success starts here.</p>

                        <div className="illustration-progress">
                            <span></span>
                        </div>

                        <small>Learn • Plan • Achieve</small>
                    </div>

                </div>

            </section>

            {/* About Section */}
            <section className="home-about" id="about">

                <div className="section-heading">
                    <span>ABOUT STUDYPILOT AI</span>
                    <h2>A smarter way to prepare for success</h2>
                    <p>
                        StudyPilot AI is designed to help students
                        organize their academic life in one place.
                    </p>
                </div>

                <div className="about-content">

                    <div className="about-card">
                        <GraduationCap size={42} />

                        <h3>One Platform for Your Studies</h3>

                        <p>
                            Manage your exams, subjects, topics and
                            study sessions without switching between
                            multiple applications.
                        </p>
                    </div>

                    <div className="about-card">
                        <Brain size={42} />

                        <h3>Learn with Intelligence</h3>

                        <p>
                            Use AI-powered learning assistance to
                            understand concepts, practice questions
                            and improve your preparation.
                        </p>
                    </div>

                </div>

            </section>

            {/* Features Section */}
            <section className="home-features" id="features">

                <div className="section-heading">
                    <span>OUR FEATURES</span>

                    <h2>Everything you need to study better</h2>

                    <p>
                        Powerful tools to organize your preparation
                        and achieve your academic goals.
                    </p>
                </div>

                <div className="features-grid">

                    {features.map((feature, index) => {

                        const Icon = feature.icon;

                        return (
                            <div className="feature-card" key={index}>

                                <div className="feature-icon">
                                    <Icon size={27} />
                                </div>

                                <h3>{feature.title}</h3>

                                <p>{feature.description}</p>

                            </div>
                        );
                    })}

                </div>

            </section>

            {/* Call To Action */}
            <section className="home-cta">

                <h2>
                    Your success starts with a better study plan.
                </h2>

                <p>
                    Start organizing your studies and make every
                    learning session count.
                </p>

                <Link to="/register" className="cta-button">
                    Create Your Account
                    <ArrowRight size={19} />
                </Link>

            </section>

            {/* Footer */}
            <footer className="home-footer">

                <div className="footer-logo">
                    <GraduationCap size={27} />
                    <span>StudyPilot AI</span>
                </div>

                <p>
                    Study smarter. Achieve more.
                </p>

                <div className="footer-links">
                    <Link to="/">Home</Link>
                    <a href="#about">About</a>
                    <a href="#features">Features</a>
                    <Link to="/login">Login</Link>
                    <Link to="/register">Register</Link>
                </div>

                <small>
                    © {new Date().getFullYear()} StudyPilot AI.
                    All rights reserved.
                </small>

            </footer>

        </div>
    );
};

export default Home;
