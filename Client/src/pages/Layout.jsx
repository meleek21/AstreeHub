import { Outlet, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import React from 'react';
import { useAuth } from '../Context/AuthContext';
import '../assets/Css/Layout.css';
import ChatSidebar from '../components/Messages/ChatSidebar';

function Layout() {
  const { isAuthenticated, isLoading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const {user}=useAuth();
  // Show loading indicator while checking authentication
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }
  console.log('User role:', user && user.role);
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting from Layout');
    return <Navigate to="/login" replace />;
  }
  return (
    <div className={`layout-container${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <Sidebar onToggleCollapse={setSidebarCollapsed} />
      <Navbar sidebarCollapsed={sidebarCollapsed} />
      {user && user.role === 'SUPERADMIN' && (
        <button
          className="peeking-ticket superadmin-ticket"
          onClick={() => window.location.href = '/dashboard'}
        style={{top:'60%'}}>
          <lord-icon
            src="https://cdn.lordicon.com/umuwriak.json"
            trigger="hover"
            colors="primary:#ffebd0ff"
            style={{ width: '35px', height: '35px', transform: 'rotate(-180deg)', transition: 'transform 0.3s ease' }}
          ></lord-icon>
          <span className="peeking-tooltip">Configuration</span>
        </button>
      )}
           <ChatSidebar />
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;