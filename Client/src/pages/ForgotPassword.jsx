import React, { useState } from 'react';
import { authAPI } from '../services/apiServices';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import '../assets/Css/Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authAPI.requestPasswordReset({ email });
      setSubmitted(true);
      toast.success('If an account with that email exists, a reset link has been sent.', {
        style: {
          background: 'var(--success)',
          color: 'var(--text-on-dark)'
        }
      });
    } catch (err) {
      // Always show success message for security
      setSubmitted(true);
      toast.success('If an account with that email exists, a reset link has been sent.', {
        style: {
          background: 'var(--success)',
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
        <h2>Forgot Password</h2>
        <p>Enter your email address to receive a password reset link.</p>
      </motion.div>
      {submitted ? (
        <div className="success-message" style={{ textAlign: 'center', color: 'var(--success)', fontWeight: 500 }}>
          If an account with that email exists, a reset link has been sent.
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <motion.div 
            className="login-form-group"
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 400, damping: 10 }}
          >
            <label htmlFor="email" className={email ? 'active' : ''}>Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder=" "
              required
            />
            <motion.div 
              className="input-underline"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: email ? 1 : 0 }}
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
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </motion.button>
        </form>
      )}
    </motion.div>
  );
};

export default ForgotPassword;