import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { authAPI } from '../services/apiServices';
import { useAuth } from '../Context/AuthContext';
import { FaLock, FaUnlock, FaEye, FaEyeSlash, FaArrowRight, FaCheck, FaTimes } from 'react-icons/fa';
import '../assets/Css/Auth.css';

const PasswordInput = ({ 
  label, 
  value, 
  onChange, 
  showPassword, 
  togglePasswordVisibility, 
  id, 
  isFocused,
  onFocus,
  onBlur
}) => {
  return (
    <motion.div 
      className="login-form-group"
      whileHover={{ scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 400, damping: 10 }}
    >
      <label 
        htmlFor={id}
        className={isFocused || value ? 'active' : ''}
      >
        {label}
      </label>
      <div className="password-input">
        <input
          type={showPassword ? 'text' : 'password'}
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder=" "
          required
          className="form-control"
        />
        <motion.button
          type="button"
          className="toggle-password"
          onClick={togglePasswordVisibility}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          aria-label={showPassword ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}
        >
          {showPassword ? <FaEyeSlash /> : <FaEye />}
        </motion.button>
        <motion.div 
          className="input-underline"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isFocused ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </motion.div>
  );
};

const PasswordRequirements = ({ requirements }) => {
  const totalRequirements = 5;
  const metRequirements = requirements ? Object.values(requirements).filter(Boolean).length : 0;
  const progress = (metRequirements / totalRequirements) * 100;

  return (
    <motion.div 
      className="password-requirements-container"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      transition={{ duration: 0.3 }}
    >

      <div className="progress-container">
        <div className="progress" style={{ height: '6px' }}>
          <motion.div
            className="progress-bar"
            role="progressbar"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6 }}
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
          />
        </div>
        <small className="progress-text">
          Force du mot de passe: {metRequirements}/{totalRequirements}
        </small>
      </div>
      
      <ul className="requirements-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', listStyle: 'none', padding: 0 }}>
        <motion.li 
          className={requirements.length ? 'valid' : 'invalid'}
          whileHover={{ x: 5 }}
        >
          {requirements.length ? <FaCheck /> : <FaTimes />} 8 caractères minimum
        </motion.li>
        <motion.li 
          className={requirements.uppercase ? 'valid' : 'invalid'}
          whileHover={{ x: 5 }}
        >
          {requirements.uppercase ? <FaCheck /> : <FaTimes />} 1 lettre majuscule
        </motion.li>
        <motion.li 
          className={requirements.lowercase ? 'valid' : 'invalid'}
          whileHover={{ x: 5 }}
        >
          {requirements.lowercase ? <FaCheck /> : <FaTimes />} 1 lettre minuscule
        </motion.li>
        <motion.li 
          className={requirements.number ? 'valid' : 'invalid'}
          whileHover={{ x: 5 }}
        >
          {requirements.number ? <FaCheck /> : <FaTimes />} 1 chiffre
        </motion.li>
        <motion.li 
          className={requirements.specialChar ? 'valid' : 'invalid'}
          whileHover={{ x: 5 }}
        >
          {requirements.specialChar ? <FaCheck /> : <FaTimes />} 1 caractère spécial
        </motion.li>
      </ul>
    </motion.div>
  );
};

const ChangePassword = () => {
  const { logout } = useAuth();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });
  const [isFocused, setIsFocused] = useState({
    currentPassword: false,
    newPassword: false,
    confirmNewPassword: false
  });
  const navigate = useNavigate();

  const handleFocus = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    setIsFocused(prev => ({ ...prev, [field]: false }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (name === 'newPassword') {
      setPasswordRequirements({
        length: value.length >= 8,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /[0-9]/.test(value),
        specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (formData.newPassword !== formData.confirmNewPassword) {
      setError('Les nouveaux mots de passe ne correspondent pas.');
      toast.error('Les nouveaux mots de passe ne correspondent pas.', {
        style: {
          background: 'var(--error)',
          color: 'var(--text-on-dark)'
        }
      });
      return;
    }
    
    const allRequirementsMet = Object.values(passwordRequirements).every(Boolean);
    if (!allRequirementsMet) {
      setError('Le nouveau mot de passe ne respecte pas tous les critères de sécurité.');
      toast.error('Le nouveau mot de passe ne respecte pas tous les critères de sécurité.', {
        style: {
          background: 'var(--error)',
          color: 'var(--text-on-dark)'
        }
      });
      return;
    }
    
    setIsLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      toast.success('Mot de passe changé avec succès. Veuillez compléter votre profil.', {
        style: {
          background: 'var(--success)',
          color: 'var(--text-on-dark)'
        }
      });
      navigate('/complete-profile');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors du changement de mot de passe.';
      setError(errorMessage);
      toast.error(errorMessage, {
        style: {
          background: 'var(--error)',
          color: 'var(--text-on-dark)'
        }
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      className="auth-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div 
        className="auth-header"
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2>Changer le mot de passe</h2>
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

      <form className='login-form-group' onSubmit={handleSubmit}>
        <PasswordInput
          label="Mot de passe actuel"
          value={formData.currentPassword}
          onChange={handleChange}
          showPassword={showNewPassword}
          togglePasswordVisibility={() => setShowNewPassword(!showNewPassword)}
          id="currentPassword"
          isFocused={isFocused.currentPassword}
          onFocus={() => handleFocus('currentPassword')}
          onBlur={() => handleBlur('currentPassword')}
        />

        <PasswordInput
          label="Nouveau mot de passe"
          value={formData.newPassword}
          onChange={handleChange}
          showPassword={showNewPassword}
          togglePasswordVisibility={() => setShowNewPassword(!showNewPassword)}
          id="newPassword"
          isFocused={isFocused.newPassword}
          onFocus={() => handleFocus('newPassword')}
          onBlur={() => handleBlur('newPassword')}
        />

        <PasswordInput
          label="Confirmer le nouveau mot de passe"
          value={formData.confirmNewPassword}
          onChange={handleChange}
          showPassword={showConfirmNewPassword}
          togglePasswordVisibility={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
          id="confirmNewPassword"
          isFocused={isFocused.confirmNewPassword}
          onFocus={() => handleFocus('confirmNewPassword')}
          onBlur={() => handleBlur('confirmNewPassword')}
        />

        <PasswordRequirements requirements={passwordRequirements} />

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
              <FaLock />
            </motion.span>
          ) : (
            <>
              Changer le mot de passe <FaArrowRight style={{ marginLeft: '8px' }} />
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default ChangePassword;