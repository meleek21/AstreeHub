import React, { useState, useEffect } from 'react';
import { adminAPI } from '../services/apiServices';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import ModalPortal from './ModalPortal';
import "../assets/Css/AdminModals.css";

const AdminEmployeeModal = ({ show, onClose, refreshEmployees }) => {
  const [formData, setFormData] = useState({
    FirstName: '',
    LastName: '',
    Email: '',
    DepartmentId: '',
    role: 'EMPLOYEE'
  });

  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get('http://localhost:5126/api/department/public');
        setDepartments(response.data);
      } catch (error) {
        toast.error('Échec du chargement des départements');
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.FirstName.trim()) newErrors.FirstName = 'Le prénom est requis';
    if (!formData.LastName.trim()) newErrors.LastName = 'Le nom est requis';
    if (!formData.Email.trim()) {
      newErrors.Email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
      newErrors.Email = "Veuillez entrer un email valide";
    }
    if (!formData.DepartmentId) newErrors.DepartmentId = 'Le département est requis';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        FirstName: formData.FirstName,
        LastName: formData.LastName,
        DepartmentId: Number(formData.DepartmentId),
        Role: formData.role,
        Email: formData.Email
      };
      await adminAPI.createEmployee(payload);
      toast.success('Employé créé avec succès');
      refreshEmployees();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Échec de la création');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('post-editor-overlay')) {
      onClose();
    }
  };

  return (
    <ModalPortal>
      <div className="post-editor-overlay" onClick={handleOverlayClick}>
        <div className="post-editor-content enhanced-modal-layout">
          <div className="post-editor-header">
            <h3>Créer un nouvel employé</h3>
            <button 
              className="close-icon-button" 
              onClick={onClose}
              aria-label="Fermer"
            >
              <FontAwesomeIcon icon={faTimes} className="close-icon"/>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="modal-form enhanced-form-layout">
            <div className="form-columns">
              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="FirstName">Prénom*</label>
                  <input
                    id="FirstName"
                    name="FirstName"
                    value={formData.FirstName}
                    onChange={handleChange}
                    placeholder="Entrez le prénom"
                    className={`modal-input ${errors.FirstName ? 'input-error' : ''}`}
                    required
                  />
                  {errors.FirstName && <span className="error-message">{errors.FirstName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="LastName">Nom*</label>
                  <input
                    id="LastName"
                    name="LastName"
                    value={formData.LastName}
                    onChange={handleChange}
                    placeholder="Entrez le nom"
                    className={`modal-input ${errors.LastName ? 'input-error' : ''}`}
                    required
                  />
                  {errors.LastName && <span className="error-message">{errors.LastName}</span>}
                </div>
              </div>

              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="Email">Email*</label>
                  <input
                    id="Email"
                    type="email"
                    name="Email"
                    value={formData.Email}
                    onChange={handleChange}
                    placeholder="exemple@entreprise.com"
                    className={`modal-input ${errors.Email ? 'input-error' : ''}`}
                    required
                  />
                  {errors.Email && <span className="error-message">{errors.Email}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="DepartmentId">Département*</label>
                  <select
                    id="DepartmentId"
                    name="DepartmentId"
                    value={formData.DepartmentId}
                    onChange={handleChange}
                    className={`modal-select ${errors.DepartmentId ? 'input-error' : ''}`}
                    required
                  >
                    <option value="">Sélectionnez un département</option>
                    {departments.map(dep => (
                      <option key={dep.id} value={dep.id}>{dep.name}</option>
                    ))}
                  </select>
                  {errors.DepartmentId && <span className="error-message">{errors.DepartmentId}</span>}
                </div>
              </div>
            </div>

            <div className="full-width-field">
              <div className="form-group">
                <label htmlFor="role">Rôle*</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className={`modal-select ${errors.role ? 'input-error' : ''}`}
                  required
                >
                  <option value="EMPLOYEE">Employé</option>
                  <option value="ADMIN">Administrateur</option>
                </select>
                {errors.role && <span className="error-message">{errors.role}</span>}
              </div>
            </div>

            <div className="modal-actions enhanced-actions">
              <button 
                type="button" 
                onClick={onClose} 
                className="modal-button modal-button-cancel"
                disabled={loading}
              >
                Annuler
              </button>
              <button 
                type="submit" 
                className="modal-button modal-button-save" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Création...
                  </>
                ) : "Créer l'employé"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};

export default AdminEmployeeModal;