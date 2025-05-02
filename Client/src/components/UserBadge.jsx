import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { userAPI, userOnlineStatusAPI } from '../services/apiServices';
import useOnlineStatus from '../hooks/useOnlineStatus';

const UserBadge = ({ userId }) => {
  const { user: loggedInUser } = useAuth();
  const { isUserOnline } = useOnlineStatus();
  const loggedInUserId = loggedInUser?.id;
  const [formattedLastSeen, setFormattedLastSeen] = useState('');

  const defaultProfilePicture = 'https://res.cloudinary.com/REMOVED/image/upload/frheqydmq3cexbfntd7e.jpg';

  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    profilePicture: defaultProfilePicture,
  });
  
  const isOnline = isUserOnline(userId);

  const fetchUserInfo = async () => {
    if (!userId) return;

    try {
      const userInfoResponse = await userAPI.getUserInfo(userId);
      setUserInfo({
        firstName: userInfoResponse.data.firstName,
        lastName: userInfoResponse.data.lastName,
        profilePicture: userInfoResponse.data.profilePictureUrl || defaultProfilePicture,
      });
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const fetchLastSeen = async () => {
    if (!userId || isOnline) return;
    
    try {
      const response = await userOnlineStatusAPI.getLastSeen(userId);
      // Assuming the API returns a formatted string in response.data
      setFormattedLastSeen(response.data);
    } catch (error) {
      console.error('Error fetching last seen time:', error);
      setFormattedLastSeen('Offline');
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, [userId]);

  useEffect(() => {
    // Fetch last seen when the component mounts or when online status changes
    fetchLastSeen();
  }, [userId, isOnline]);

  const profileUrl = userId === loggedInUserId ? `/profile/edit/${userId}` : `/profile/view/${userId}`;

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
        {!isOnline && formattedLastSeen && (
          <div
            style={{
              position: 'absolute',
              bottom: '0',
              right: '-10px',
              padding: '2px 6px',
              borderRadius: '10px',
              backgroundColor: '#f0f0f0',
              fontSize: '0.7em',
              color: '#666',
            }}
          >
            {formattedLastSeen}
          </div>
        )}
      </div>
      <div>
        <div style={{ fontWeight: 'bold', color: '#0047AB' }}>{`${userInfo.firstName} ${userInfo.lastName}`}</div>
        
      </div>
    </div>
  );
};

export default UserBadge;