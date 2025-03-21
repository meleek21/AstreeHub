import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { userAPI, userStatusAPI } from '../services/apiServices';

const UserBadge = ({ userId }) => {
  const { user } = useAuth();
  const loggedInUserId = user?.id;

  const defaultProfilePicture = 'https://res.cloudinary.com/REMOVED/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1742278756/blueAvatar_mezaen.jpg';

  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    profilePicture: defaultProfilePicture,
    isOnline: false,
    lastSeen: '',
  });

  const fetchUserInfo = async () => {
    if (!userId) return;

    try {
      const [userInfoResponse, userStatusResponse] = await Promise.all([
        userAPI.getUserInfo(userId),
        userStatusAPI.getUserStatus(userId),
      ]);

      const lastSeenResponse = await fetch(`/api/UserOnlineStatus/${userId}/last-seen`);
      const lastSeen = await lastSeenResponse.text();

      setUserInfo({
        firstName: userInfoResponse.data.firstName,
        lastName: userInfoResponse.data.lastName,
        profilePicture: userInfoResponse.data.profilePictureUrl || defaultProfilePicture,
        isOnline: userStatusResponse.data.isOnline,
        lastSeen,
      });
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, [userId]);

  const profileUrl = userId === loggedInUserId ? `/profile/edit/${userId}` : `/profile/view/${userId}`;

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
          {userInfo.isOnline && (
            <div
              style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                backgroundColor: 'green',
                border: '2px solid white',
              }}
            />
          )}
        </div>
        <div>
          <div style={{ fontWeight: 'bold', color:'#0047AB'}}>{`${userInfo.firstName} ${userInfo.lastName}`}</div>
          <div style={{ color: '#666666', fontSize: '0.8em' }}>
            {userInfo.isOnline ? 'Online' : `Last seen ${userInfo.lastSeen}`}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default UserBadge;