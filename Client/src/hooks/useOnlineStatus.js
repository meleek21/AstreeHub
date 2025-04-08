import { useOnlineStatus as useOnlineStatusFromContext } from '../Context/OnlineStatusContext';
import { userOnlineStatusAPI } from '../services/apiServices';

/**
 * Custom hook to access online status information throughout the application
 * @returns {Object} Online status methods and data
 */
const useOnlineStatus = () => {
  const context = useOnlineStatusFromContext();
  
  // Add a method to get last seen time
  const getLastSeenTime = async (userId) => {
    try {
      const response = await userOnlineStatusAPI.getLastSeen(userId);
      return response.data;
    } catch (error) {
      console.error('Error fetching last seen time:', error);
      return 'Unknown';
    }
  };
  
  return {
    ...context,
    getLastSeenTime
  };
};

export default useOnlineStatus;
