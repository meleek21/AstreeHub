import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { userAPI } from '../services/apiServices';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import '../assets/Css/ProfileCard.css';

const ProfileCard = () => {
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

  const copyEmailToClipboard = () => {
    if (!userInfo.email) return;
    
    navigator.clipboard.writeText(userInfo.email)
      .then(() => {
        toast.success('Email copié dans le presse-papiers!', {
          icon: '📋',
        });
      })
      .catch(() => {
        toast.error('Échec de la copie');
      });
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get('http://localhost:5126/api/department/public');
        setDepartments(response.data);
      } catch (error) {
        console.error('Erreur lors de la récupération des départements:', error);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        if (!userId) {
          console.error('ID utilisateur non défini');
          return;
        }

        const response = await userAPI.getUserInfo(userId);
        const userData = response.data;
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
        console.error('Erreur lors de la récupération des informations utilisateur:', error);
        toast.error('Échec du chargement du profil', {
          position: 'top-center',
        });
      }
    };

    fetchUserInfo();
  }, [userId]);

  return (
    <motion.div
      className="profile-card-container"
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
          className="detail-row email-row"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300 }}
          onClick={copyEmailToClipboard}
        >
          <span className="detail-label">Email :</span>
          <span className="detail-value email-value">
            {userInfo.email}
            <FontAwesomeIcon 
              icon={faCopy} 
              className="copy-icon" 
              title="Copier l'email"
            />
          </span>
        </motion.div>
        
        <motion.div
          className="detail-row"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <span className="detail-label">Téléphone :</span>
          <span className="detail-value">{userInfo.phoneNumber}</span>
        </motion.div>
        
        <motion.div
          className="detail-row"
          whileHover={{ scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <span className="detail-label">Département :</span>
          <span className="detail-value">
            {departments.find(dept => dept.id === parseInt(userInfo.departmentId))?.name || 'Non assigné'}
          </span>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ProfileCard;