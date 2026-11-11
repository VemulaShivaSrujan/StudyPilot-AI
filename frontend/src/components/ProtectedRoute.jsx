
import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {

    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div className="auth-container">
                <h2>Checking authentication...</h2>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
