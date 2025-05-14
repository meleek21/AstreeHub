import { Navigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

// Protected route wrapper component
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Show loading while checking authentication
  if (isLoading) {
    return <div className="loading-container">Checking authentication...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/authen" replace />;
  }

  // Role-based access control
  if (requiredRole && user?.role !== requiredRole) {
    return <div className="access-denied">Access Denied: You do not have permission to view this page.</div>;
  }

  // Render the protected component
  return children;
};

export default ProtectedRoute;