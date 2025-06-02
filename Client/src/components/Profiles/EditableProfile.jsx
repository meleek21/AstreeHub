import React, { useState, useEffect, useRef } from 'react';
import { userAPI , departmentAPI } from '../../services/apiServices';
import { toast } from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../../assets/Css/EditableProfile.css';
import ChangePassword from '../Authentification/ChangePassword';

const EditableProfile = () => {
  const { userId } = useParams();
  const defaultProfilePicture = 'https://res.cloudinary.com/REMOVED/image/upload/frheqydmq3cexbfntd7e.jpg';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    profilePicture: defaultProfilePicture,
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    departmentId: '',
  });

  const [departments, setDepartments] = useState([]);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await departmentAPI.getAllDepartments(); 
        setDepartments(response.data);
      } catch (error) {
        console.error('Error fetching departments:', error);
        toast.error('Failed to load departments');
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await userAPI.getUserInfo(userId);
        const userData = response.data;
        const formattedDate = userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '';
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          profilePicture: userData.profilePictureUrl || defaultProfilePicture,
          email: userData.email || '',
          phoneNumber: userData.phoneNumber || '',
          dateOfBirth: formattedDate,
          departmentId: userData.departmentId || '',
        });
      } catch (error) {
        console.error('Erreur lors de la récupération des données utilisateur:', error);
        toast.error('Échec du chargement du profil utilisateur');
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    if (!userId) {
      toast.error('ID utilisateur requis');
      return;
    }
    setIsLoading(true);
    try {
      const formDataToSend = new FormData();

      if (formData.firstName?.trim()) {
        formDataToSend.append('firstName', formData.firstName.trim());
      }
      if (formData.lastName?.trim()) {
        formDataToSend.append('lastName', formData.lastName.trim());
      }
      if (formData.email?.trim()) {
        formDataToSend.append('email', formData.email.trim());
      }
      if (formData.phoneNumber?.trim()) {
        formDataToSend.append('phoneNumber', formData.phoneNumber.trim());
      }
      if (formData.dateOfBirth) {
        formDataToSend.append('dateOfBirth', formData.dateOfBirth);
      }
      if (formData.departmentId) {
        formDataToSend.append('departmentId', formData.departmentId);
      }

      if (formData.profilePicture instanceof File) {
        formDataToSend.append('file', formData.profilePicture);
      }

      if (Array.from(formDataToSend.entries()).length === 0) {
        toast.error('Veuillez mettre à jour au moins un champ');
        return;
      }

      const response = await userAPI.updateProfile(userId, formDataToSend);
      const updatedUserData = await userAPI.getUserInfo(userId);
      setFormData((prev) => ({
        ...prev,
        ...updatedUserData.data,
        profilePicture: updatedUserData.data.profilePictureUrl || defaultProfilePicture,
      }));

      toast.success('Profil mis à jour avec succès');
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 1000);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      const errorMessage = error.response?.data || 'Échec de la mise à jour du profil';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, profilePicture: file }));
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: '',
      lastName: '',
      profilePicture: defaultProfilePicture,
      email: '',
      phoneNumber: '',
      dateOfBirth: '',
      departmentId: '',
    });
    toast('Modifications annulées', { icon: '⚠️' });
  };

  const handlePasswordChangeSuccess = () => {
    setShowChangePassword(false);
    toast.success('Mot de passe changé avec succès');
  };

  const handleCancelPasswordChange = () => {
    setShowChangePassword(false);
  };

  return (
    <motion.div 
      className="profile-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {showChangePassword ? (
        <div className="password-change-container">
          <ChangePassword 
            onSuccess={handlePasswordChangeSuccess}
            onCancel={handleCancelPasswordChange}
            isFirstLogin={false}
          />
        </div>
      ) : (
        <>
          <div className="profile-picture-container">
            <div className="profile-picture-wrapper">
              <motion.img
                src={
                  formData.profilePicture instanceof File
                    ? URL.createObjectURL(formData.profilePicture)
                    : formData.profilePicture
                }
                alt={`${formData.firstName} ${formData.lastName}`}
                className="profile-picture"
                whileHover={{ scale: 1.03 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              />
              <motion.button
                className="upload-button"
                onClick={() => fileInputRef.current.click()}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                +
              </motion.button>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div className="profile-form">
            <div className="form-row">
              <motion.div 
                className="form-group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label>Prénom:</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Prénom"
                />
              </motion.div>
              <motion.div 
                className="form-group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label>Nom de famille:</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Nom de famille"
                />
              </motion.div>
            </div>
            <div className="form-row">
              <motion.div 
                className="form-group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label>Email:</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  className="form-control"
                  placeholder="Email"
                />
              </motion.div>
              <motion.div 
                className="form-group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label>Numéro de téléphone:</label>
                <input
                  type="text"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="Numéro de téléphone"
                />
              </motion.div>
            </div>
            <div className="form-row">
              <motion.div 
                className="form-group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label>Date de naissance:</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                />
              </motion.div>
              <motion.div 
                className="form-group"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <label>Département:</label>
                <input
                  type="text"
                  name="departmentId"
                  value={departments.find(dept => dept.id === parseInt(formData.departmentId))?.name || 'Département non assigné'}
                  readOnly
                  className="form-control"
                />
              </motion.div>
            </div>
            <div className="button-group">
            <motion.button 
                onClick={() => setShowChangePassword(true)}
                className="change-password-button"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                Changer le mot de passe
              </motion.button>
              <motion.button
                onClick={handleSave}
                className={`save-button ${isSuccess ? 'success' : ''} ${isLoading ? 'loading' : ''}`}
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                animate={isSuccess ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5 }}
                disabled={isLoading}
              >
                {isLoading ? 'Enregistrement...' : 'Enregistrer'}
              </motion.button>
              <motion.button 
                onClick={handleCancel} 
                className="cancel-edit-button"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
              >
                Annuler
              </motion.button>
              
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

export default EditableProfile;