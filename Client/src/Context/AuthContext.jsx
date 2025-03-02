import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Check for token in localStorage on app load
  useEffect(() => {
    const verifyToken = async () => {
      console.log('Verifying authentication token...');
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);

      if (token) {
        try {
          // Set default authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          console.log('Set Authorization header with token');

          // Validate token with backend
          console.log('Attempting to validate token with backend...');
          try {
            // Try to get user data with the token
            const response = await axios.get('http://localhost:5126/api/auth/me');
            console.log('User data retrieved successfully');
            setUser(response.data);
            setIsAuthenticated(true);
          } catch (validationError) {
            console.error('Token validation failed:', validationError.message);
            console.log('Error details:', {
              status: validationError.response?.status,
              data: validationError.response?.data,
            });

            // If validation fails, clear token and set as unauthenticated
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
            setIsAuthenticated(false);
            setUser(null);
          }
        } catch (error) {
          console.error('Error during token verification:', error.message);
          delete axios.defaults.headers.common['Authorization'];
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        console.log('No token found, user is not authenticated');
        delete axios.defaults.headers.common['Authorization'];
        setIsAuthenticated(false);
        setUser(null);
      }
      setIsLoading(false);
    };

    verifyToken();
  }, []);

  // Login function
  const login = async (token) => {
    if (!token) {
      console.error('No token provided');
      return;
    }
    console.log('Login: Storing token and setting authorization header');
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    try {
      // Try to get user data with the token
      const response = await axios.get('http://localhost:5126/api/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user data:', error.message);
    }

    setIsAuthenticated(true);
    navigate('/home');
  };

  // Logout function
  const logout = () => {
    console.log('Logging out: Removing token and authorization header');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Define useAuth outside of AuthProvider
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};