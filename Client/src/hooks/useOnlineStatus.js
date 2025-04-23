import { useContext } from 'react';
// Ensure the path is correct based on your project structure
import { OnlineStatusContext } from '../Context/OnlineStatusContext'; 

// Custom hook for using the online status context
const useOnlineStatus = () => {
  const context = useContext(OnlineStatusContext);
  if (!context) {
    throw new Error('useOnlineStatus must be used within an OnlineStatusProvider');
  }

  // Expose the relevant state and functions from the refactored context
  return {
    onlineUserIds: context.onlineUserIds, // Array of online user IDs
    isLoading: context.isLoading,
    error: context.error,
    isUserOnline: context.isUserOnline, // Function: (userId) => boolean
    getLastSeenTime: context.getLastSeenTime, // Function: (userId) => string | null
    connectionState: context.connectionState, // 'Connected', 'Connecting', 'Disconnected', 'Reconnecting'
    isUserActive: context.isUserActive, // boolean: Is the current browser session active?
    currentUser: context.currentUser // The currently authenticated user object from AuthContext
  };
};

export default useOnlineStatus;
