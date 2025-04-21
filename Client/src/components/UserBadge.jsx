import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { userAPI } from '../services/apiServices';
import useOnlineStatus from '../hooks/useOnlineStatus';

const UserBadge = ({ userId }) => {
  const { user } = useAuth();
  const { isUserOnline, getLastSeenTime } = useOnlineStatus();
  const loggedInUserId = user?.id;

  const defaultProfilePicture = 'https://res.cloudinary.com/REMOVED/image/upload/frheqydmq3cexbfntd7e.jpg';

  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    profilePicture: defaultProfilePicture,
  });
  
  const [lastSeen, setLastSeen] = useState('Unknown');

  const fetchUserInfo = async () => {
    if (!userId) return;

    try {
      const userInfoResponse = await userAPI.getUserInfo(userId);
      
      // Get last seen time from the API only if user is offline
      if (!isUserOnline(userId)) {
        const lastSeenResponse = await getLastSeenTime(userId);
        setLastSeen(lastSeenResponse || 'Unknown');
      }

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
    
    // Refresh user info when online status changes
    const refreshInterval = setInterval(fetchUserInfo, 60000); // Refresh every minute
    
    return () => clearInterval(refreshInterval);
  }, [userId, isUserOnline(userId)]);

  const profileUrl = userId === loggedInUserId ? `/profile/edit/${userId}` : `/profile/view/${userId}`;
  const isOnline = isUserOnline(userId);

  return (
    <Link to={profileUrl} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '10px', cursor: 'pointer' }}>
        <div style={{ position: 'relative', marginRight: '10px' }}>
          <img
            src={userInfo.profilePicture}
            alt={`${userInfo.firstName} ${userInfo.lastName}`}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              transition: 'transform 0.2s ease-in-out',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          />
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
            {isOnline ? '' : ` ${lastSeen}`}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default UserBadge;
