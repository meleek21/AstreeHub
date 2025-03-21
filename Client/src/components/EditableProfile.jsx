import React, { useState, useEffect, useRef } from 'react';
import { userAPI } from '../services/apiServices';
import { toast } from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../assets/Css/EditableProfile.css';


const EditableProfile = () => {
  const { userId } = useParams();
  const defaultProfilePicture = 'https://res.cloudinary.com/REMOVED/image/upload/w_1000,c_fill,ar_1:1,g_auto,r_max,bo_5px_solid_red,b_rgb:262c35/v1742278756/blueAvatar_mezaen.jpg';

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    profilePicture: defaultProfilePicture,
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    departmentId: '',
  });

  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await userAPI.getUserInfo(userId);
        const userData = response.data;
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          profilePicture: userData.profilePictureUrl || defaultProfilePicture,
          email: userData.email || '',
          phoneNumber: userData.phoneNumber || '',
          dateOfBirth: userData.dateOfBirth || '',
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
    console.log('Sauvegarde du profil...');
    try {
      const formDataToSend = new FormData();

      // Validate and append form data
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
      if (formData.departmentId?.trim()) {
        formDataToSend.append('departmentId', formData.departmentId.trim());
      }

      // Handle profile picture
      if (formData.profilePicture instanceof File) {
        formDataToSend.append('file', formData.profilePicture);
      }

      // Add validation to ensure at least one field is being updated
      if (Array.from(formDataToSend.entries()).length === 0) {
        toast.error('Veuillez mettre à jour au moins un champ');
        return;
      }

      const response = await userAPI.updateProfile(userId, formDataToSend);

      // After successful update, fetch the updated user data
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

  return (
    <div className="profile-container">
      <div className="profile-picture-container">
        <div className="profile-picture-wrapper">
          <img
            src={
              formData.profilePicture instanceof File
                ? URL.createObjectURL(formData.profilePicture)
                : formData.profilePicture
            }
            alt={`${formData.firstName} ${formData.lastName}`}
            className="profile-picture"
          />
          <button
            className="upload-button"
            onClick={() => fileInputRef.current.click()}
          >
            +
          </button>
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
          <div className="form-group">
            <label>Prénom:</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Prénom"
            />
          </div>
          <div className="form-group">
            <label>Nom de famille:</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Nom de famille"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Email:</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
            />
          </div>
          <div className="form-group">
            <label>Numéro de téléphone:</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="Numéro de téléphone"
            />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>Date de naissance:</label>
            <input
              type="date"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>ID du département:</label>
            <input
              type="text"
              name="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
              placeholder="ID du département"
            />
          </div>
        </div>
        <div className="button-group">
          <motion.button
            onClick={handleSave}
            className={`save-button ${isSuccess ? 'success' : ''} ${isLoading ? 'loading' : ''}`}
            whileTap={{ scale: 0.95 }}
            animate={isSuccess ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5 }}
            disabled={isLoading}
          >
            <lord-icon
              src="https://cdn.lordicon.com/oqdmuxru.json"
              trigger="hover"
              colors="primary:#66d7ee"
              style={{ width: '24px', height: '24px', marginRight: '8px' }}
            />
            {isLoading ? 'Enregistrement...' : 'Enregistrer'}
          </motion.button>
          <button onClick={handleCancel} className="cancel-button">
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditableProfile;