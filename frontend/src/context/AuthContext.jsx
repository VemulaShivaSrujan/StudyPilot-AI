
import {
    createContext,
    useContext,
    useState,
    useEffect
} from 'react';

import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {

    const [student, setStudent] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const checkAuthentication = async () => {

            const token = localStorage.getItem('token');

            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await api.get('/auth/profile', {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });

                if (response.data.success) {
                    setStudent(response.data.student);
                    setIsAuthenticated(true);
                }

            } catch (error) {
                localStorage.removeItem('token');
                setStudent(null);
                setIsAuthenticated(false);

            } finally {
                setLoading(false);
            }
        };

        checkAuthentication();

    }, []);

    const login = async (token) => {

        localStorage.setItem('token', token);

        try {
            const response = await api.get('/auth/profile', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setStudent(response.data.student);
            setIsAuthenticated(true);

            return true;

        } catch (error) {

            localStorage.removeItem('token');
            setStudent(null);
            setIsAuthenticated(false);

            return false;
        }
    };

    const logout = () => {

        localStorage.removeItem('token');

        setStudent(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider
            value={{
                student,
                isAuthenticated,
                loading,
                login,
                logout
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
