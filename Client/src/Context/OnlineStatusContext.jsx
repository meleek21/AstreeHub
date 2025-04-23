import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { userOnlineStatusAPI } from '../services/apiServices';
import connectionManager from '../services/connectionManager';
import { useAuth } from './AuthContext'; // Import useAuth to get user ID

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
      const response = await userOnlineStatusAPI.getOnlineUsers();
      const onlineUserIds = response.data.map(user => user.userId);
      setOnlineUsers(new Set(onlineUserIds));
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

  // Set up SignalR event handlers for user status changes from ConnectionManager
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
        setLastSeenMap(prevMap => new Map(prevMap).set(userId, lastSeen));
      } else if (!isOnline) {
        // If going offline and no specific lastSeen provided, maybe fetch it or use current time?
        // For now, let's just remove if they go offline without a timestamp.
        // Or perhaps the server *always* sends lastSeen when isOnline is false.
        // Assuming server sends lastSeen when user goes offline.
      }
    };

    // Register the event handler via connectionManager
    // Assuming connectionManager exposes a method like `onUserStatusChange`
    connectionManager.onUserStatusChange(handleUserStatusChanged);

    // Clean up event handlers when component unmounts
    return () => {
      connectionManager.offUserStatusChange(handleUserStatusChanged); // Use a corresponding off method
    };
  }, []);

  // Remove direct heartbeat logic - handled by ConnectionManager
  // Remove direct connection status handling - handled by ConnectionManager state listener
  // Remove browser online/offline detection - ConnectionManager handles reconnect attempts

  // Check if a user is online
  const isUserOnline = useCallback((userId) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  // Get last seen time for a user
  const getLastSeenTime = useCallback((userId) => {
    return lastSeenMap.get(userId) || null; // Return null if not found
  }, [lastSeenMap]);

  // Get all online user IDs
  const getOnlineUserIds = useCallback(() => {
    return Array.from(onlineUsers);
  }, [onlineUsers]);

  // Remove manual updateUserStatus - status is driven by server events via ConnectionManager

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

// Custom hook for using the online status context
// Change how the hook is exported to make it compatible with Fast Refresh
export function useOnlineStatus() {
  const context = useContext(OnlineStatusContext);
  if (!context) {
    throw new Error('useOnlineStatus must be used within an OnlineStatusProvider');
  }
  return context;
}

// Remove the previous export const declaration if it exists
