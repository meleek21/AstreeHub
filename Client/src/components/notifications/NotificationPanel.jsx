import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import { useNotifications } from '../../Context/NotificationContext';
import NotificationItem from './NotificationItem';
import '../../assets/Css/Notifications.css';

const NotificationPanel = ({ isOpen, onClose }) => {
  const { notifications, unreadCount, loading, markAllAsRead } = useNotifications();
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'unread'
  const [mountedClass, setMountedClass] = useState('');

  // Apply mounted class after initial render for animation
  useEffect(() => {
    if (isOpen) {
      // Small delay to trigger animation
      setTimeout(() => {
        setMountedClass('panel-mounted');
      }, 10);
    } else {
      setMountedClass('');
    }
  }, [isOpen]);

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const filteredNotifications = activeTab === 'all' 
    ? notifications 
    : notifications.filter(notification => !notification.isRead);

  if (!isOpen) return null;

  return (
    <div className={`notification-panel-container ${mountedClass}`}>
      <div className="notification-panel-backdrop" onClick={onClose}></div>
      <div className="notification-panel">
        <div className="notification-header">
          <h3>Notifications</h3>
          <button className="close-button" onClick={onClose}>
          <FontAwesomeIcon
                  icon={faTimes}
                  
                  style={{ color: '#A41623' }}
                />
          </button>
        </div>
        
        <div className="notification-tabs">
          <button 
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button 
            className={`tab-button ${activeTab === 'unread' ? 'active' : ''}`}
            onClick={() => setActiveTab('unread')}
          >
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </button>
          <button 
            className="mark-all-read"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark all as read
          </button>
        </div>
        
        <div className="notification-list">
          {loading ? (
            <div className="notification-loading">Loading notifications...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="notification-empty">
              No {activeTab === 'unread' ? 'unread ' : ''}notifications
            </div>
          ) : (
            filteredNotifications.map(notification => (
              <NotificationItem 
                key={`notification-${notification.id}`} 
                notification={notification} 
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;