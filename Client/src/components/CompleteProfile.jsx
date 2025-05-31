import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { userAPI } from '../services/apiServices';
import { useAuth } from '../Context/AuthContext';
import { FaArrowRight, FaArrowLeft, FaCheck, FaTimes, FaUserCircle } from 'react-icons/fa';
import '../assets/Css/Auth.css';

const CompleteProfile = () => {
  const { user, logout } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.PhoneNumber || '',
    dateOfBirth: user?.DateOfBirth ? user.DateOfBirth.split('T')[0] : '',
    file: null
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();

  // Clean up image preview URL
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file') {
      if (files && files[0]) {
        const preview = URL.createObjectURL(files[0]);
        setImagePreview(preview);
        setFormData({ ...formData, file: files[0] });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const data = new FormData();
      data.append('FirstName', formData.firstName);
      data.append('LastName', formData.lastName);
      data.append('Email', formData.email);
      data.append('PhoneNumber', formData.phoneNumber);
      data.append('DateOfBirth', formData.dateOfBirth);
      if (formData.file) {
        data.append('File', formData.file);
      }
      await userAPI.updateOwnProfile(data);
      toast.success('Profil complété avec succès. Veuillez vous reconnecter.');
      await logout();
      navigate('/login');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la mise à jour du profil.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (formData.firstName && formData.lastName && formData.dateOfBirth) {
      setCurrentStep(2);
    }
  };

  return (
    <motion.div 
      className="auth-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
        <motion.button
                  type="button"
                  className="secondary-button"
                  onClick={() => setCurrentStep(1)}
                  whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-sm)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  <lord-icon
          src="https://cdn.lordicon.com/ternnbni.json"
          trigger="hover"
          colors="primary:#f4b69c"
          style={{
            width: '30px',
            height: '30px',
            transform:'rotate(-90deg)' ,
            transition: 'transform 0.3s ease'
          }}
        ></lord-icon>
                </motion.button>
      <motion.div 
        className="auth-header"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2>Compléter le profil <span>({currentStep}/2)</span></h2>
        <p>Veuillez compléter vos informations personnelles</p>
      </motion.div>
      
      <AnimatePresence>
        {error && (
          <motion.div 
            className="error-message"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              className="form-step"
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="form-group">
                <label>Email :</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="disabled-field"
                />
              </div>

              <div className="form-row">
                <motion.div 
                  className="form-group"
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <label>Prénom :</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </motion.div>

                <motion.div 
                  className="form-group"
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <label>Nom :</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </motion.div>
              </div>

              <div className="form-row">
                <motion.div 
                  className="form-group"
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <label>Téléphone :</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                  />
                </motion.div>

                <motion.div 
                  className="form-group"
                  whileHover={{ scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <label>Date de naissance :</label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    required
                  />
                </motion.div>
              </div>

              <motion.button
                type="button"
                className="login-button"
                onClick={handleNext}
                whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-md)' }}
                whileTap={{ scale: 0.98 }}
              >
                Suivant <FaArrowRight style={{ marginLeft: '8px' }} />
              </motion.button>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              className="form-step"
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <motion.div 
                className="form-group"
                whileHover={{ scale: 1.01 }}
                transition={{ type: 'spring', stiffness: 400, damping: 10 }}
              >
                <label>Photo de profil :</label>
                <div className="file-input-container">
                  <label htmlFor="file-upload" className="file-upload-label">
                    {imagePreview ? (
                      <div className="image-preview-box">
                        <img
                          src={imagePreview}
                          alt="Aperçu de la photo de profil"
                          className="preview-image"
                        />
                        <motion.button
                          type="button"
                          className="remove-image"
                          onClick={() => {
                            setImagePreview(null);
                            setFormData({ ...formData, file: null });
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <FaTimes />
                        </motion.button>
                      </div>
                    ) : (
                      <div className="file-upload-placeholder">
                        <FaUserCircle size={48} />
                        <span>Cliquez pour télécharger une image</span>
                      </div>
                    )}
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    name="file"
                    accept="image/*"
                    onChange={handleChange}
                    className="file-input"
                  />
                </div>
              </motion.div>

              <div className="form-buttons">
                
                <motion.button
                  type="submit"
                  className="login-button"
                  disabled={isLoading}
                  whileHover={!isLoading ? { scale: 1.02, boxShadow: 'var(--shadow-md)' } : {}}
                  whileTap={!isLoading ? { scale: 0.98 } : {}}
                  initial={{ background: 'var(--primary)' }}
                  animate={{ 
                    background: isLoading ? 'var(--primary-light)' : 'var(--primary)'
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {isLoading ? (
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    >
                      <FaCheck />
                    </motion.span>
                  ) : (
                    'Terminer'
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </motion.div>
  );
};

export default CompleteProfile;