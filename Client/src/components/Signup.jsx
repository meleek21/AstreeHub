import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaLock, FaUnlock } from 'react-icons/fa';
import '../assets/Css/Signup.css';

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    departmentId: null,
    role: 'EMPLOYEE',
    dateOfBirth: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

    // Password validation
    if (name === 'password') {
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
    setSuccessMessage('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5126/api/auth/register', formData);
      setSuccessMessage('Inscription réussie ! Redirection en cours...');
      setTimeout(() => navigate('/login'), 2000); // Redirect after 2 seconds
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="auth-container">
      <h2>Inscription</h2>
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="firstName">Prénom:</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="Entrez votre prénom"
            required
            aria-describedby="firstNameHelp"
          />
        </div>
        <div className="form-group">
          <label htmlFor="lastName">Nom de famille:</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Entrez votre nom de famille"
            required
            aria-describedby="lastNameHelp"
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Entrez votre email"
            required
            aria-describedby="emailHelp"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Mot de passe:</label>
          <div className="password-input">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Entrez votre mot de passe"
              required
              aria-describedby="passwordHelp"
            />
            <span
              className="toggle-password"
              onClick={togglePasswordVisibility}
              role="button"
              tabIndex={0}
              aria-label={showPassword ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <FaUnlock /> : <FaLock />}
            </span>
          </div>
          <div id="passwordHelp" className="password-requirements">
            <p>Le mot de passe doit contenir:</p>
            <ul>
              <li className={passwordRequirements.length ? 'valid' : 'invalid'}>8 caractères minimum</li>
              <li className={passwordRequirements.uppercase ? 'valid' : 'invalid'}>1 lettre majuscule</li>
              <li className={passwordRequirements.lowercase ? 'valid' : 'invalid'}>1 lettre minuscule</li>
              <li className={passwordRequirements.number ? 'valid' : 'invalid'}>1 chiffre</li>
              <li className={passwordRequirements.specialChar ? 'valid' : 'invalid'}>1 caractère spécial</li>
            </ul>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">Confirmez le mot de passe:</label>
          <div className="password-input">
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirmez votre mot de passe"
              required
              aria-describedby="confirmPasswordHelp"
            />
            <span
              className="toggle-password"
              onClick={togglePasswordVisibility}
              role="button"
              tabIndex={0}
              aria-label={showPassword ? 'Cacher le mot de passe' : 'Afficher le mot de passe'}
            >
              {showPassword ? <FaUnlock /> : <FaLock />}
            </span>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="departmentId">Département:</label>
          <input
            type="number"
            id="departmentId"
            name="departmentId"
            value={formData.departmentId || ''}
            onChange={handleChange}
            placeholder="Entrez l'ID du département"
            aria-describedby="departmentIdHelp"
          />
        </div>
        <div className="form-group">
          <label htmlFor="role">Rôle:</label>
          <select
            id="role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            required
            aria-describedby="roleHelp"
          >
            <option value="EMPLOYEE">Employé</option>
            <option value="Admin">Administrateur</option>
            <option value="Manager">Manager</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="dateOfBirth">Date de naissance:</label>
          <input
            type="date"
            id="dateOfBirth"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            required
            aria-describedby="dateOfBirthHelp"
          />
        </div>
        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? 'Chargement...' : "S'inscrire"}
        </button>
      </form>
      <p className="login-link">
        Vous avez déjà un compte ? <Link to="/login">Connectez-vous</Link>
      </p>
    </div>
  );
};

export default Signup;