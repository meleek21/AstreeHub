import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userOnlineStatusAPI } from '../services/apiServices';
import connectionManager from '../services/connectionManager';
import { useAuth } from './AuthContext';

const OnlineStatusContext = createContext();
export { OnlineStatusContext };

export const OnlineStatusProvider = ({ children }) => {
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [lastSeenMap, setLastSeenMap] = useState(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionState, setConnectionState] = useState('Disconnected');
  const [isUserActive, setIsUserActive] = useState(true);
  const { user } = useAuth();

  const fetchInitialData = useCallback(async () => {
    try {
      setIsLoading(true);
      // Get online users
      const onlineResponse = await userOnlineStatusAPI.getOnlineUsers();
      const onlineUserIds = onlineResponse.data.map(user => user.userId);
      setOnlineUsers(new Set(onlineUserIds));
      
      // Create a map of last seen times
      const newLastSeenMap = new Map();
      onlineResponse.data.forEach(user => {
        if (user.lastSeenTime) {
          newLastSeenMap.set(user.userId, user.lastSeenTime);
        }
      });
      setLastSeenMap(newLastSeenMap);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching online users:', err);
      setError('Failed to load online users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to ConnectionManager state changes
  useEffect(() => {
    const handleStateChange = (newState) => {
      setConnectionState(newState);
      if (newState === 'Connected') {
        setError(null);
        // Refresh online users list when reconnected
        fetchInitialData();
      } else if (newState === 'Disconnected' || newState === 'Reconnecting') {
        setError('Connection to real-time updates lost. Attempting to reconnect...');
      }
    };

    connectionManager.addStateListener(handleStateChange);

    return () => {
      connectionManager.removeStateListener(handleStateChange);
    };
  }, [fetchInitialData]);

  // Subscribe to ConnectionManager activity changes
  useEffect(() => {
    const handleActivityChange = (isActive) => {
      setIsUserActive(isActive);
    };

    connectionManager.onActivityChange(handleActivityChange);

    return () => {
      connectionManager.offActivityChange(handleActivityChange);
    };
  }, []);

  // Set up SignalR event handlers for user status changes
  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        setIsLoading(true);
        const response = await userOnlineStatusAPI.getOnlineUsers();
        
        // Extract user IDs from the response
        const onlineUserIds = response.data.map(user => user.userId);
        setOnlineUsers(new Set(onlineUserIds));
        
        // Create a map of last seen times
        const newLastSeenMap = new Map();
        response.data.forEach(user => {
          if (user.lastSeenTime) {
            newLastSeenMap.set(user.userId, user.lastSeenTime);
          }
        });
        setLastSeenMap(newLastSeenMap);
        
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
    // Handler for UserStatusChanged event (now includes lastSeen)
    const handleUserStatusChanged = (userId, isOnline, lastSeen) => {
      setOnlineUsers(prevUsers => {
        const newUsers = new Set(prevUsers);
        if (isOnline) {
          newUsers.add(userId);
        } else {
          newUsers.delete(userId);
        }
        return newUsers;
      });
      
      // Update last seen time if provided
      if (lastSeen) {
        setLastSeenMap(prevMap => {
          const newMap = new Map(prevMap);
          newMap.set(userId, lastSeen);
          return newMap;
        });
      }
    };

    // Register the event handler via connectionManager
    connectionManager.onUserStatusChange(handleUserStatusChanged);

    // Clean up event handlers when component unmounts
    return () => {
      connectionManager.offUserStatusChange(handleUserStatusChanged);
    };
  }, []);

  // Check if a user is online
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  // Get last seen time for a user
  const getLastSeenTime = useCallback((userId) => {
    return lastSeenMap.get(userId) || null;
  }, [lastSeenMap]);

  // Get all online user IDs
  const getOnlineUserIds = useCallback(() => {
    return Array.from(onlineUsers);
  }, [onlineUsers]);

  const value = {
    onlineUserIds: getOnlineUserIds(), // Provide the array of IDs
    isLoading,
    error,
    isUserOnline, // Function (userId) => boolean
    getLastSeenTime, // Function (userId) => string | null
    connectionState, // 'Connected', 'Connecting', 'Disconnected', 'Reconnecting'
    isUserActive, // boolean: Is the current user interacting?
    currentUser: user // Expose the current user object
  };

  return <OnlineStatusContext.Provider value={value}>{children}</OnlineStatusContext.Provider>;
};

