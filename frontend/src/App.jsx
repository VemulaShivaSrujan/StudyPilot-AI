
import {
    BrowserRouter,
    Routes,
    Route,
    Navigate
} from 'react-router-dom';


import Home from './pages/Home';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyOTP from './pages/VerifyOTP';
import VerifyLoginOTP from './pages/VerifyLoginOTP';

import { AuthProvider, useAuth } from './context/AuthContext';
import Profile from './pages/Profile';
import Exams from './pages/Exams';
import Subjects from './pages/Subjects';
import Topics from './pages/Topics';
import Preferences from './pages/Preferences';

function Timetable() {
    return <h1>My Timetable</h1>;
}

function AIAssistant() {
    return <h1>AI Study Assistant</h1>;
}

function Progress() {
    return <h1>My Progress</h1>;
}

function RootRedirect() {

    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <h2>Loading...</h2>;
    }

    return (
        <Navigate
            to={isAuthenticated ? "/dashboard" : "/home"}
            replace
        />
    );
}

function App() {

    return (
        <AuthProvider>
            <BrowserRouter>

                <Routes>
                    
                    <Route path="/home" element={<Home />} />
                    {/* Public Routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/verify-otp" element={<VerifyOTP />} />
                    <Route
                        path="/verify-login-otp"
                        element={<VerifyLoginOTP />}
                    />

                    {/* Protected Routes */}
                    <Route element={<ProtectedRoute />}>

                        <Route element={<Navbar />}>
                            <Route
                                path="/dashboard"
                                element={<Dashboard />}
                            />

                            <Route path="/exams" element={<Exams />} />
                            <Route path="/subjects" element={<Subjects />} />
                            <Route path="/topics" element={<Topics />} />
                            <Route path="/preferences" element={<Preferences />} />

                            <Route
                                path="/timetable"
                                element={<Timetable />}
                            />

                            <Route
                                path="/ai-assistant"
                                element={<AIAssistant />}
                            />

                            <Route path="/progress" element={<Progress />} />

                            <Route path="/profile" element={<Profile />} />
                        </Route>

                    </Route>

                    <Route path="/" element={<RootRedirect />} />

                    <Route path="*" element={<RootRedirect />} />   

                </Routes>

            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
