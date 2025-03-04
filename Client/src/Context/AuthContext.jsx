import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/apiServices';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthError = (event) => {
      console.log('Auth error event received:', event.detail.message);
      logout();
      navigate('/login');
    };

    window.addEventListener('authError', handleAuthError);
    return () => window.removeEventListener('authError', handleAuthError);
  }, [navigate]);

  // Check for token in localStorage on app load
  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');

      if (token) {
        try {
          const response = await authAPI.getUserInfo();
          setUser(response.data);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Token validation failed:', error.message);
          localStorage.removeItem('token');
          setIsAuthenticated(false);
          setUser(null);
          navigate('/login');
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
      setIsLoading(false);
    };

    verifyToken();
  }, [navigate]);

  // Login function
  const login = async (tokenData) => {
    const token = typeof tokenData === 'string' ? tokenData : tokenData?.token;
    const userData = typeof tokenData === 'object' ? tokenData.user : null;
    
    if (!token) {
      console.error('No token provided');
      return;
    }

    localStorage.setItem('token', token);

    if (userData) {
      setUser(userData);
    } else {
      try {
        const response = await authAPI.getUserInfo();
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error.message);
        logout();
        return;
      }
    }

    setIsAuthenticated(true);
    navigate('/home');
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  const value = {
    isAuthenticated,
    isLoading,
    user,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};