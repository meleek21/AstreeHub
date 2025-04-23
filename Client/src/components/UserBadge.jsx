import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { userAPI } from '../services/apiServices';
import useOnlineStatus from '../hooks/useOnlineStatus';

const UserBadge = ({ userId }) => {
  const { user: loggedInUser } = useAuth(); // Rename to avoid conflict if needed
  // Use the updated hook which provides isUserOnline and getLastSeenTime directly
  const { isUserOnline, getLastSeenTime: getLastSeenTimeFromHook } = useOnlineStatus(); 
  const loggedInUserId = loggedInUser?.id;

  const defaultProfilePicture = 'https://res.cloudinary.com/REMOVED/image/upload/frheqydmq3cexbfntd7e.jpg';

  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    profilePicture: defaultProfilePicture,
  });
  
  // Get online status and last seen time directly from the hook for the specific userId
  const isOnline = isUserOnline(userId);
  const lastSeen = getLastSeenTimeFromHook(userId);

  const fetchUserInfo = async () => {
    if (!userId) return;

    try {
      // Fetch only basic user info (name, picture)
      const userInfoResponse = await userAPI.getUserInfo(userId); 
      // Last seen time is now handled by the hook/context

      setUserInfo({
        firstName: userInfoResponse.data.firstName,
        lastName: userInfoResponse.data.lastName,
        profilePicture: userInfoResponse.data.profilePictureUrl || defaultProfilePicture,
      });
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  useEffect(() => {
    fetchUserInfo();
    // No need for interval refresh based on online status here,
    // the hook/context updates will trigger re-renders when status changes.
    // Fetch basic info only when userId changes.
  }, [userId]);

  const profileUrl = userId === loggedInUserId ? `/profile/edit/${userId}` : `/profile/view/${userId}`;
  // isOnline and lastSeen are now derived from the hook earlier

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px' }}>
      <div style={{ position: 'relative', marginRight: '10px' }}>
        <Link to={profileUrl} style={{ textDecoration: 'none', color: 'inherit' }}>
          <img
            src={userInfo.profilePicture}
            alt={`${userInfo.firstName} ${userInfo.lastName}`}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              transition: 'transform 0.2s ease-in-out',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
        </Link>
        {isOnline && (
          <div
            style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              backgroundColor: '#4CAF50',
              border: '2px solid white',
            }}
          />
        )}
      </div>
      <div>
        <div style={{ fontWeight: 'bold', color: '#0047AB' }}>{`${userInfo.firstName} ${userInfo.lastName}`}</div>
        <div style={{ color: '#666666', fontSize: '0.8em' }}>
          {/* Display status based on hook values */}
          {isOnline ? 'Online' : (lastSeen ? `Last seen: ${formatLastSeen(lastSeen)}` : 'Offline')}
        </div>
      </div>
    </div>
  );
};

// Helper function to format the last seen time (optional, adjust as needed)
const formatLastSeen = (timestamp) => {
  if (!timestamp) return 'Offline';
  // Implement more sophisticated date formatting if desired (e.g., using date-fns)
  const date = new Date(timestamp);
  // Basic formatting example:
  return date.toLocaleString(); 
};

export default UserBadge;
