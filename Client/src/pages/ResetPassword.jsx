import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/apiServices';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import '../assets/Css/Auth.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setError('Lien de réinitialisation de mot de passe invalide ou manquant.');
    }
  }, [token, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await authAPI.resetPassword({ token, email, newPassword });
      setSuccess(true);
      toast.success('Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Échec de la réinitialisation du mot de passe. Le lien a peut-être expiré.');
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="auth-container">
        <div className="auth-header">
          <h2>Réinitialiser le mot de passe</h2>
        </div>
        <div className="error-message" style={{ color: 'var(--danger)', textAlign: 'center', fontWeight: 500 }}>{error}</div>
      </div>
    );
  }

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
        <h2>Réinitialiser le mot de passe</h2>
        <p>Entrez votre nouveau mot de passe ci-dessous.</p>
      </motion.div>
      {success ? (
        <div className="success-message" style={{ textAlign: 'center', color: 'var(--success)', fontWeight: 500 }}>
          Votre mot de passe a été réinitialisé. Redirection vers la connexion...
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <motion.div 
            className="login-form-group"
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <label htmlFor="newPassword" className={newPassword ? 'active' : ''}>Nouveau mot de passe</label>
            <input
              id="newPassword"
              type="password"
              name="newPassword"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder=" "
              required
              minLength={6}
            />
            <motion.div 
              className="input-underline"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: newPassword ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
          <motion.div 
            className="login-form-group"
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <label htmlFor="confirmPassword" className={confirmPassword ? 'active' : ''}>Confirmer le mot de passe</label>
            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder=" "
              required
              minLength={6}
            />
            <motion.div 
              className="input-underline"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: confirmPassword ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
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
            {isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
          </motion.button>
        </form>
      )}
    </motion.div>
  );
};

export default ResetPassword;