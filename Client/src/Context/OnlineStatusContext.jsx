import { createContext, useContext, useState, useEffect } from 'react';
import { userOnlineStatusAPI } from '../services/apiServices';
import signalRService from '../services/signalRService';

const OnlineStatusContext = createContext();

export const OnlineStatusProvider = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connected', 'disconnected', 'connecting'

  // Initialize online status data
  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        setIsLoading(true);
        const response = await userOnlineStatusAPI.getOnlineUsers();
        
        // Extract user IDs from the response
        const onlineUserIds = response.data.map(user => user.userId);
        setOnlineUsers(onlineUserIds);
        setError(null);
      } catch (err) {
        console.error('Error fetching online users:', err);
        setError('Failed to load online users');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOnlineUsers();
  }, []);

  // Set up SignalR event handlers for user status changes
  useEffect(() => {
    const handleUserStatusChanged = (userId, isOnline) => {
      setOnlineUsers(prevUsers => {
        if (isOnline && !prevUsers.includes(userId)) {
          return [...prevUsers, userId];
        } else if (!isOnline && prevUsers.includes(userId)) {
          return prevUsers.filter(id => id !== userId);
        }
        return prevUsers;
      });
    };

    // Connect to UserHub via SignalR
    const connectToUserHub = async () => {
      try {
        // Register the event handler for UserStatusChanged
        signalRService.onUserStatusChange(handleUserStatusChanged);
        
        // Start the connection if not already started
        if (!signalRService.isConnected()) {
          await signalRService.start();
        }
      } catch (err) {
        console.error('Error connecting to UserHub:', err);
        setError('Failed to connect to real-time updates');
        
        // Attempt to reconnect after a delay
        setTimeout(() => {
          connectToUserHub();
        }, 5000);
      }
    };

    connectToUserHub();

    // Clean up event handlers when component unmounts
    return () => {
      // Properly remove the event handler
      signalRService.onUserStatusChange(null);
    };
  }, []);

  // Add connection status change handler
  useEffect(() => {
    const handleConnectionChange = (isConnected) => {
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
      
      if (!isConnected) {
        setError('Connection to real-time updates lost. Attempting to reconnect...');
      } else {
        setError(null);
        // Refresh online users list when reconnected
        const fetchOnlineUsers = async () => {
          try {
            const response = await userOnlineStatusAPI.getOnlineUsers();
            const onlineUserIds = response.data.map(user => user.userId);
            setOnlineUsers(onlineUserIds);
          } catch (err) {
            console.error('Error refreshing online users:', err);
          }
        };
        fetchOnlineUsers();
      }
    };
    
    signalRService.onConnectionChange(handleConnectionChange);
    
    return () => {
      signalRService.onConnectionChange(null);
    };
  }, []);

  // Set up a heartbeat to update last activity time
  useEffect(() => {
    const currentUserId = localStorage.getItem('userId');
    if (!currentUserId) return;
    
    const updateActivity = async () => {
      try {
        await userOnlineStatusAPI.updateLastActivity(currentUserId);
      } catch (err) {
        console.error('Error updating last activity:', err);
      }
    };
    
    // Update activity immediately
    updateActivity();
    
    // Set up interval to update activity every 5 minutes
    const heartbeatInterval = setInterval(updateActivity, 5 * 60 * 1000);
    
    return () => {
      clearInterval(heartbeatInterval);
    };
  }, []);

  // Add browser online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      console.log('Browser is online');
      // Reconnect SignalR
      if (!signalRService.isConnected()) {
        const connectToUserHub = async () => {
          try {
            await signalRService.start();
          } catch (err) {
            console.error('Error reconnecting to SignalR:', err);
          }
        };
        connectToUserHub();
      }
    };
    
    const handleOffline = () => {
      console.log('Browser is offline');
      setError('You are currently offline. Online status updates are paused.');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check if a user is online
  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };

  // Get all online users
  const getOnlineUsers = () => {
    return [...onlineUsers];
  };

  // Update a user's status manually (if needed)
  const updateUserStatus = async (userId, isOnline) => {
    try {
      // Use the SignalR hub method instead of direct API call
      if (signalRService.isConnected()) {
        await signalRService.invokeHubMethod('UpdateUserStatus', userId, isOnline);
        return true;
      } else {
        // Fall back to API call if SignalR is not connected
        await userOnlineStatusAPI.updateUserStatus(userId, isOnline);
        
        // Update local state
        setOnlineUsers(prevUsers => {
          if (isOnline && !prevUsers.includes(userId)) {
            return [...prevUsers, userId];
          } else if (!isOnline && prevUsers.includes(userId)) {
            return prevUsers.filter(id => id !== userId);
          }
          return prevUsers;
        });
        
        return true;
      }
    } catch (err) {
      console.error('Error updating user status:', err);
      return false;
    }
  };

  const value = {
    onlineUsers,
    isLoading,
    error,
    isUserOnline,
    getOnlineUsers,
    updateUserStatus,
    connectionStatus
  };

  return <OnlineStatusContext.Provider value={value}>{children}</OnlineStatusContext.Provider>;
};

// Custom hook for using the online status context
export const useOnlineStatus = () => {
  const context = useContext(OnlineStatusContext);
  if (!context) {
    throw new Error('useOnlineStatus must be used within an OnlineStatusProvider');
  }
  return context;
};
