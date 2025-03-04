import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/apiServices';

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
          // Validate token with backend using apiServices
          console.log('Attempting to validate token with backend...');
          try {
            // Try to get user data with the token
            const response = await authAPI.getUserInfo();
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
            setIsAuthenticated(false);
            setUser(null);
          }
        } catch (error) {
          console.error('Error during token verification:', error.message);
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        console.log('No token found, user is not authenticated');
        setIsAuthenticated(false);
        setUser(null);
      }
      setIsLoading(false);
    };

    verifyToken();
  }, []);

  // Login function
  const login = async (tokenData) => {
    // Check if tokenData is a string (just the token) or an object with token and user
    const token = typeof tokenData === 'string' ? tokenData : tokenData?.token;
    const userData = typeof tokenData === 'object' ? tokenData.user : null;
    
    if (!token) {
      console.error('No token provided');
      return;
    }
    console.log('Login: Storing token and setting authorization header');
    localStorage.setItem('token', token);

    // If user data was provided directly, use it
    if (userData) {
      console.log('User data provided with login');
      setUser(userData);
    } else {
      // Otherwise fetch user data
      try {
        // Try to get user data with the token using apiServices
        const response = await authAPI.getUserInfo();
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user data:', error.message);
      }
    }

    setIsAuthenticated(true);
    navigate('/home');
  };

  // Logout function
  const logout = () => {
    console.log('Logging out: Removing token and authorization header');
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

  return (
    <AuthContext.Provider value={value}>
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