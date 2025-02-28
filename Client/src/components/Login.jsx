import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { FaLock, FaUnlock } from 'react-icons/fa'; // For lock icons
import '../assets/Css/Signup.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post('http://localhost:5126/api/auth/login', formData);
      localStorage.setItem('token', response.data.token);
      toast.success('Connexion réussie ! Redirection en cours...');
      setTimeout(() => navigate('/dashboard'), 1500); // Redirect after 1.5 seconds
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue. Veuillez réessayer.');
      toast.error(err.response?.data?.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Connexion</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Email :</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Entrez votre email"
            required
          />
        </div>
        <div className="form-group">
          <label>Mot de passe :</label>
          <div className="password-input">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Entrez votre mot de passe"
              required
            />
            <span
              className="toggle-password"
              onClick={() => setShowPassword(!showPassword)}
              role="button"
              tabIndex={0}
              aria-label={showPassword ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <FaUnlock /> : <FaLock />}
            </span>
          </div>
        </div>
        <button type="submit" className="login-button" disabled={isLoading}>
          {isLoading ? 'Connexion en cours...' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
};

export default Login;