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
  // Show loading indicator while checking authentication
  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    console.log('User not authenticated, redirecting from Layout');
    return <Navigate to="/login" replace />;
  }
  return (
    <div className={`layout-container${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
      <Sidebar onToggleCollapse={setSidebarCollapsed} />
      <Navbar sidebarCollapsed={sidebarCollapsed} />
      <ChatSidebar />     
      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;