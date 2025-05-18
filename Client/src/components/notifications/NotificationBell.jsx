import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../Context/NotificationContext';
import NotificationPanel from './NotificationPanel';
import '../../assets/Css/Notifications.css';

const NotificationBell = ({ onOpenPostModal }) => {
  const { unreadCount } = useNotifications();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Close panel with ESC key
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.keyCode === 27 && isPanelOpen) {
        setIsPanelOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    
    // Clean up event listener
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isPanelOpen]);

  // Prevent body scrolling when panel is open
  useEffect(() => {
    if (isPanelOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isPanelOpen]);

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
  };

  const closePanel = () => {
    setIsPanelOpen(false);
  };

  return (
    <div className="notification-bell">
      <div onClick={togglePanel}>
          <lord-icon
            src="https://cdn.lordicon.com/lznlxwtc.json"
            trigger="hover"
            colors="primary:#FFC107"
            style={{ width: '30px', height: '30px' }}
          ></lord-icon>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>
      <NotificationPanel isOpen={isPanelOpen} onClose={closePanel} onOpenPostModal={onOpenPostModal} />
    </div>
  );
};

export default NotificationBell;