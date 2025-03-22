import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { userAPI } from '../services/apiServices';
import { motion } from 'framer-motion';
import '../assets/Css/ProfileViewer.css';

const ProfileViewer = () => {
  const defaultProfilePicture = 'https://res.cloudinary.com/REMOVED/image/upload/frheqydmq3cexbfntd7e.jpg';

  const { userId } = useParams();
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    profilePicture: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    departmentId: '',
    lastActivity: null,
  });

  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get('http://localhost:5126/api/department/public');
        setDepartments(response.data);
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        if (!userId) {
          console.error('User ID is undefined');
          return;
        }

        const response = await userAPI.getUserInfo(userId);
        const userData = response.data;
        console.log("user info", userData);
        const formattedDate = userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '';

        setUserInfo({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          profilePicture: userData.profilePictureUrl || defaultProfilePicture,
          email: userData.email || '',
          phoneNumber: userData.phoneNumber || '',
          dateOfBirth: formattedDate,
          departmentId: userData.departmentId || '',
          lastActivity: userData.lastActivity || null,
        });
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo();
  }, [userId]);

  return (
    <motion.div
      className="profile-viewer-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="profile-header">
        <motion.div
          className="profile-picture-container"
          whileHover={{ scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <img
            src={userInfo.profilePicture}
            alt={`${userInfo.firstName} ${userInfo.lastName}`}
            className="profile-picture"
          />
        </motion.div>
        <motion.h1
          className="profile-name"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {`${userInfo.firstName} ${userInfo.lastName}`}
        </motion.h1>
      </div>

      <motion.div
        className="profile-details"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <motion.div
          className="detail-row"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <span className="detail-label">Email:</span>
          <span className="detail-value">{userInfo.email}</span>
        </motion.div>
        <motion.div
          className="detail-row"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <span className="detail-label">Phone Number:</span>
          <span className="detail-value">{userInfo.phoneNumber}</span>
        </motion.div>
        <motion.div
          className="detail-row"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <span className="detail-label">Date of Birth:</span>
          <span className="detail-value">{userInfo.dateOfBirth}</span>
        </motion.div>
        <motion.div
          className="detail-row"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <span className="detail-label">Department:</span>
          <span className="detail-value">{departments.find(dept => dept.id === parseInt(userInfo.departmentId))?.name || 'Not Assigned'}</span>
        </motion.div>
        {userInfo.lastActivity && (
          <motion.div
            className="detail-row"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <span className="detail-label">Last Activity:</span>
            <span className="detail-value">{userInfo.lastActivity}</span>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default ProfileViewer;