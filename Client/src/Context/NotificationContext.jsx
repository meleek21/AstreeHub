import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { notificationAPI } from '../services/apiServices';
import connectionManager from '../services/connectionManager';
import { toast } from 'react-hot-toast';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Use ref to track if we're currently fetching to prevent race conditions
  const isFetchingRef = useRef(false);
  
  // Keep track of processed notification IDs to prevent duplicates
  const processedNotificationsRef = useRef(new Set());

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    if (!user || isFetchingRef.current) return;
    
    try {
      isFetchingRef.current = true;
      setLoading(true);
      const response = await notificationAPI.getNotifications(user.id);
      
      // Ensure we have valid data
      const notificationsData = Array.isArray(response.data) ? response.data : [];
      
      setNotifications(notificationsData);
      
      // Count unread notifications more reliably
      const unreadNotifications = notificationsData.filter(n => n && !n.isRead);
      const unreadCountValue = unreadNotifications.length;
      
      console.log('Fetched notifications:', notificationsData.length, 'Unread:', unreadCountValue);
      setUnreadCount(unreadCountValue);
      
      // Update processed notifications set
      processedNotificationsRef.current = new Set(notificationsData.map(n => n.id));
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // On error, don't reset the state completely, just log the error
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [user]);

  // Get unread count separately (more reliable)
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await notificationAPI.getUnreadCount(user.id);
      const countValue = typeof response.data === 'object' ? response.data.count : response.data;
      console.log('Fetched unread count from API:', countValue);
      setUnreadCount(countValue || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user]);

  // Mark a notification as read
  const markAsRead = useCallback(async (notificationId) => {
    if (!user) return;
    
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
      
      // Update unread count more carefully
      setUnreadCount(prev => {
        const newCount = Math.max(0, prev - 1);
        console.log('Marked as read, new unread count:', newCount);
        return newCount;
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [user]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user) return;
    
    try {
      await notificationAPI.markAllAsRead(user.id);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      
      // Reset unread count
      console.log('Marked all as read, resetting unread count to 0');
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  }, [user]);

  // Delete a notification
  const deleteNotification = useCallback(async (notificationId) => {
    if (!user) return;
    
    try {
      await notificationAPI.deleteNotification(notificationId, user.id);
      
      // Update local state
      const deletedNotification = notifications.find(n => n.id === notificationId);
      const updatedNotifications = notifications.filter(n => n.id !== notificationId);
      setNotifications(updatedNotifications);
      
      // Update unread count if needed
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => {
          const newCount = Math.max(0, prev - 1);
          console.log('Deleted unread notification, new count:', newCount);
          return newCount;
        });
      }
      
      // Remove from processed set
      processedNotificationsRef.current.delete(notificationId);
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, [user, notifications]);

  // Improved notification handler to prevent duplicates
  const handleReceiveNotification = useCallback((notification) => {
    console.log('Received real-time notification:', notification);
    
    // Check if we've already processed this notification
    if (processedNotificationsRef.current.has(notification.id)) {
      console.log('Notification already processed, skipping duplicate:', notification.id);
      return;
    }
    
    // Add to processed set immediately
    processedNotificationsRef.current.add(notification.id);
    
    // Add the new notification to the list
    setNotifications(prev => {
      // Double-check if notification exists in current state
      const exists = prev.some(item => item.id === notification.id);
      if (exists) {
        console.log('Notification already exists in state, skipping duplicate');
        return prev;
      }
      
      console.log('Adding new notification to state');
      
      // Show toast for new notification
      const notificationText = notification.title || notification.message || notification.content || 'You have a new notification!';
      toast(notificationText, {
        position: 'top-right',
        duration: 5000,
        icon: '🔔',
      });
      
      // Add the new notification to the beginning of the list
      return [notification, ...prev];
    });
    
    // Only update unread count if the notification is unread
    if (!notification.isRead) {
      setUnreadCount(prev => {
        const newCount = prev + 1;
        console.log('New unread notification, count updated to:', newCount);
        return newCount;
      });
    }
  }, []);

  // Setup real-time notification handling
  useEffect(() => {
    if (!user) {
      // Reset state when user logs out
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      processedNotificationsRef.current.clear();
      return;
    }

    let mounted = true;

    // Setup connection and fetch initial data
    const initializeNotifications = async () => {
      try {
        console.log('Initializing notifications for user:', user.id);
        
        // Fetch initial notifications
        await fetchNotifications();
        
        // Ensure connection manager is started
        if (!connectionManager.isConnected()) {
          console.log('Starting connection manager...');
          await connectionManager.start();
        }
        
        // Setup real-time notifications
        console.log('Setting up real-time notification connection...');
        await connectionManager.ensureNotificationConnection();
        
        // Register the notification handler (only once)
        connectionManager.registerNotificationHandler('ReceiveNotification', handleReceiveNotification);
        
        console.log('Real-time notifications setup complete');
        
      } catch (error) {
        console.error('Error initializing notifications:', error);
        // Even if real-time setup fails, we should still show fetched notifications
      }
    };

    initializeNotifications();

    // Cleanup function
    return () => {
      mounted = false;
      console.log('Cleaning up notification handlers');
      connectionManager.unregisterNotificationHandler('ReceiveNotification', handleReceiveNotification);
    };
  }, [user?.id, handleReceiveNotification, fetchNotifications]);

  // Periodic sync to ensure count accuracy (optional but recommended)
  useEffect(() => {
    if (!user) return;
    
    const syncInterval = setInterval(() => {
      console.log('Syncing notification count...');
      fetchUnreadCount();
    }, 30000); // Sync every 30 seconds
    
    return () => clearInterval(syncInterval);
  }, [user, fetchUnreadCount]);

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