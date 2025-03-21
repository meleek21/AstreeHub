import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FaLock, FaUnlock } from 'react-icons/fa';
import { toast } from 'react-hot-toast'; 
import '../assets/Css/Signup.css';

// PasswordInput Component
const PasswordInput = ({ label, value, onChange, showPassword, togglePasswordVisibility, id, requirements }) => {
  const totalRequirements = 5;
  const metRequirements = Object.values(requirements).filter(Boolean).length;
  const progress = (metRequirements / totalRequirements) * 100;

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}:</label>
      <div className="password-input">
        <input
          type={showPassword ? 'text' : 'password'}
          id={id}
          name={id}
          value={value}
          onChange={onChange}
          placeholder={`Entrez votre ${label.toLowerCase()}`}
          required
          aria-describedby={`${id}Help`}
          className="form-control"
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
      {id === 'password' && (
        <div id="passwordHelp" className="password-requirements">
          <div className="progress mt-2" style={{ height: '10px' }}>
            <div
              className="progress-bar"
              role="progressbar"
              style={{ width: `${progress}%` }}
              aria-valuenow={progress}
              aria-valuemin="0"
              aria-valuemax="100"
            ></div>
          </div>
          <small className="text-muted">
            Force du mot de passe: {metRequirements}/{totalRequirements}
          </small>
          <ul className="list-unstyled mt-2">
            <li className={requirements.length ? 'text-success' : 'text-danger'}>
              {requirements.length ? '✓' : '✗'} 8 caractères minimum
            </li>
            <li className={requirements.uppercase ? 'text-success' : 'text-danger'}>
              {requirements.uppercase ? '✓' : '✗'} 1 lettre majuscule
            </li>
            <li className={requirements.lowercase ? 'text-success' : 'text-danger'}>
              {requirements.lowercase ? '✓' : '✗'} 1 lettre minuscule
            </li>
            <li className={requirements.number ? 'text-success' : 'text-danger'}>
              {requirements.number ? '✓' : '✗'} 1 chiffre
            </li>
            <li className={requirements.specialChar ? 'text-success' : 'text-danger'}>
              {requirements.specialChar ? '✓' : '✗'} 1 caractère spécial
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

// Signup Component
const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    departmentId: '',
    role: 'EMPLOYEE',
    dateOfBirth: '',
  });
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false,
  });
  const [departments, setDepartments] = useState([]); // Store departments
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
      toast.error('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5126/api/auth/register', formData);
      toast.success('Inscription réussie ! Redirection en cours...');
      setTimeout(() => navigate('/login'), 2000); // Redirect after 2 seconds
    } catch (err) {
      toast.error(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get('http://localhost:5126/api/department/public');
        setDepartments(response.data); // Assume response contains an array of departments
      } catch (error) {
        toast.error('Erreur lors du chargement des départements');
      }
    };
    fetchDepartments();
  }, []);

  return (
    <div className="auth-container mt-5">
      <h2 className="text-center mb-4">Inscription</h2>
      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6">
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
                className="form-control"
              />
            </div>
          </div>
          <div className="col-md-6">
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
                className="form-control"
              />
            </div>
          </div>
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
            className="form-control"
          />
        </div>
        <div className="row">
          <div className="col-md-6">
            <div className="form-group">
              <label htmlFor="departmentId">Département:</label>
              <select
                id="departmentId"
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                
                className="form-control select-dropdown"
              >
                <option value="">Sélectionner un département</option>
                {departments.map((department) => (
                  <option key={department.id} value={department.id}>
                    {department.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-group">
              <label htmlFor="role">Rôle:</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="form-control select-dropdown"
              >
                <option value="EMPLOYEE">Employé</option>
                <option value="Admin">Administrateur</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
          </div>
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
            className="form-control"
          />
        </div>
        <div className="row">
          <div className="col-md-6">
            <PasswordInput
              label="Mot de passe"
              value={formData.password}
              onChange={handleChange}
              showPassword={showPassword}
              togglePasswordVisibility={() => setShowPassword(!showPassword)}
              id="password"
              requirements={passwordRequirements}
            />
          </div>
          <div className="col-md-6">
            <PasswordInput
              label="Confirmez le mot de passe"
              value={formData.confirmPassword}
              onChange={handleChange}
              showPassword={showConfirmPassword}
              togglePasswordVisibility={() => setShowConfirmPassword(!showConfirmPassword)}
              id="confirmPassword"
              requirements={{}}
            />
          </div>
        </div>
        <button type="submit" className="signup-button" disabled={isLoading}>
          {isLoading ? 'Chargement...' : 'S\'inscrire'}
        </button>
      </form>
    </div>
  );
};

export default Signup;
