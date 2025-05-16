import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../Context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import '../../assets/Css/Notifications.css';

const NotificationItem = ({ notification, onOpenPostModal }) => {
  const navigate = useNavigate();
  const { markAsRead, deleteNotification } = useNotifications();

  const handleClick = () => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    switch (notification.notificationType) {
      case 'Message':
        navigate('/messages');
        break;
      case 'PostReaction':
      case 'Comment':
        if (onOpenPostModal && notification.relatedEntityId) {
          onOpenPostModal(notification.relatedEntityId);
        } else {
          navigate('/feed');
        }
        break;
      case 'EventInvitation':
      case 'EventUpdate':
      case 'EventStatusChange':
      case 'Birthday':
        navigate('/evenement');
        break;
      case 'ChannelPost':
        navigate('/channels');
        break;
      default:
        if (notification.actionUrl) {
          navigate(notification.actionUrl);
        }
        break;
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    deleteNotification(notification.id);
  };

  // Format the timestamp
  const timeAgo = formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true });

  // Get icon and style based on notification type
  const getNotificationTypeInfo = () => {
    switch (notification.notificationType) {
      case 'Message':
        return { icon: '✉️', className: 'notification-message' };
      case 'PostReaction':
        return { icon: '👍', className: 'notification-reaction' };
      case 'Comment':
        return { icon: '💬', className: 'notification-comment' };
      case 'EventInvitation':
        return { icon: '📅', className: 'notification-invitation' };
      case 'EventUpdate':
        return { icon: '🔄', className: 'notification-update' };
      case 'Birthday':
        return { icon: '🎂', className: 'notification-birthday' };
      case 'EventStatusChange':
        return { icon: '📝', className: 'notification-status' };
      case 'ChannelPost':
        return { icon: '📢', className: 'notification-channel' };
      default:
        return { icon: '🔔', className: 'notification-default' };
    }
  };

  const { icon, className } = getNotificationTypeInfo();

  return (
    <div 
      className={`notification-item ${className} ${notification.isRead ? 'read' : 'unread'}`}
      onClick={handleClick}
    >
      <div className="notification-icon">{icon}</div>
      <div className="notification-content">
        {notification.title && (
          <div className="notification-title">{notification.title}</div>
        )}
        <div className="notification-message">{notification.content}</div>
        <div className="notification-time">{timeAgo}</div>
      </div>
      <button className="notification-delete" onClick={handleDelete}>
        &times;
      </button>
    </div>
  );
};

export default NotificationItem;