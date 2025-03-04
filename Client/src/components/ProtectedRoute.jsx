import { Navigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

// Protected route wrapper component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return <div className="loading-container">Checking authentication...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render the protected component
  return children;
};

export default ProtectedRoute;