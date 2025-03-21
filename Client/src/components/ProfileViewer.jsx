import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { userAPI } from '../services/apiServices';

const ProfileViewer = () => {
  const { userId } = useParams(); // Extract userId from the URL
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    profilePicture: '',
    lastActivity: null,
  });

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        if (!userId) {
          console.error('User ID is undefined');
          return;
        }

        const response = await userAPI.getUserInfo(userId);
        setUserInfo({
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          profilePicture: response.data.profilePictureUrl,
          lastActivity: response.data.lastActivity,
        });
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo();
  }, [userId]);

  return (
    <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px', maxWidth: '400px' }}>
      <div style={{ textAlign: 'center' }}>
        <img
          src={userInfo.profilePicture}
          alt={`${userInfo.firstName} ${userInfo.lastName}`}
          style={{ width: '100px', height: '100px', borderRadius: '50%' }}
        />
        <h2>{`${userInfo.firstName} ${userInfo.lastName}`}</h2>
      </div>

      {userInfo.lastActivity && <p>{`Last Activity: ${userInfo.lastActivity}`}</p>}
    </div>
  );
};

export default ProfileViewer;