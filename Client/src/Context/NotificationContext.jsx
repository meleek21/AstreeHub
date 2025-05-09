import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { notificationAPI } from '../services/apiServices';
import connectionManager from '../services/connectionManager';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await notificationAPI.getNotifications(user.id);
      setNotifications(response.data);
      
      // Count unread notifications
      const unreadNotifications = response.data.filter(n => !n.isRead);
      setUnreadCount(unreadNotifications.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unread count
  const fetchUnreadCount = async () => {
    if (!user) return;
    
    try {
      const response = await notificationAPI.getUnreadCount(user.id);
      setUnreadCount(response.data);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  // Mark a notification as read
  const markAsRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId, user.id);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead(user.id);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete a notification
  const deleteNotification = async (notificationId) => {
    try {
      await notificationAPI.deleteNotification(notificationId, user.id);
      
      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      setNotifications(updatedNotifications);
      
      // Update unread count if needed
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Setup real-time notification handling
  useEffect(() => {
    if (!user) return;

    const handleReceiveNotification = (notification) => {
      // Add the new notification to the list if it doesn't exist already
      setNotifications(prev => {
        // Check if this notification already exists in the array
        const exists = prev.some(item => item.id === notification.id);
        if (exists) {
          // If it exists, don't add it again
          return prev;
        }
        
        // Add the new notification to the list
        return [notification, ...prev];
      });
      
      // Only update unread count if the notification is unread
      if (!notification.isRead) {
        setUnreadCount(count => count + 1);
      }
    };

    // Register for real-time notifications
    const setupNotificationConnection = async () => {
      try {
        await connectionManager.ensureNotificationConnection();
        connectionManager.registerNotificationHandler('ReceiveNotification', handleReceiveNotification);
      } catch (error) {
        console.error('Error setting up notification connection:', error);
      }
    };

    // Initial data fetch
    fetchNotifications();
    setupNotificationConnection();

    // Cleanup
    return () => {
      connectionManager.unregisterNotificationHandler('ReceiveNotification', handleReceiveNotification);
    };
  }, [user]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};