import React from "react";
import ModalPortal from '../ModalPortal';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes } from "@fortawesome/free-solid-svg-icons";
import "../../assets/Css/AdminModals.css";

const EditEmployeeModal = ({
  show,
  editForm,
  departments,
  onChange,
  onCancel,
  onSave,
  loading,
  errors = {}
}) => {
  if (!show) return null;

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('post-editor-overlay')) {
      onCancel();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };
  
  return (
    <ModalPortal>
      <div className="post-editor-overlay" onClick={handleOverlayClick}>
        <div className="post-editor-content enhanced-modal-layout">
          <div className="post-editor-header">
            <h3>Modifier un employé</h3>
            <button 
              className="close-icon-button" 
              onClick={onCancel}
              aria-label="Fermer"
            >
              <FontAwesomeIcon icon={faTimes} className="close-icon"/>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="modal-form enhanced-form-layout">
            <div className="form-columns">
              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="firstName">Prénom*</label>
                  <input
                    id="firstName"
                    name="firstName"
                    value={editForm.firstName}
                    onChange={onChange}
                    placeholder="Entrez le prénom"
                    className={`modal-input ${errors.firstName ? 'input-error' : ''}`}
                    required
                  />
                  {errors.firstName && <span className="error-message">{errors.firstName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Nom*</label>
                  <input
                    id="lastName"
                    name="lastName"
                    value={editForm.lastName}
                    onChange={onChange}
                    placeholder="Entrez le nom"
                    className={`modal-input ${errors.lastName ? 'input-error' : ''}`}
                    required
                  />
                  {errors.lastName && <span className="error-message">{errors.lastName}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email*</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={onChange}
                    placeholder="exemple@entreprise.com"
                    className={`modal-input ${errors.email ? 'input-error' : ''}`}
                    required
                  />
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
              </div>

              <div className="form-column">
                <div className="form-group">
                  <label htmlFor="phoneNumber">Téléphone</label>
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={editForm.phoneNumber}
                    onChange={onChange}
                    placeholder="+33 6 12 34 56 78"
                    className={`modal-input ${errors.phoneNumber ? 'input-error' : ''}`}
                  />
                  {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="dateOfBirth">Date de naissance</label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    name="dateOfBirth"
                    value={editForm.dateOfBirth}
                    onChange={onChange}
                    className={`modal-input ${errors.dateOfBirth ? 'input-error' : ''}`}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {errors.dateOfBirth && <span className="error-message">{errors.dateOfBirth}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="departmentId">Département*</label>
                  <select
                    id="departmentId"
                    name="departmentId"
                    value={editForm.departmentId}
                    onChange={onChange}
                    className={`modal-select ${errors.departmentId ? 'input-error' : ''}`}
                    required
                  >
                    <option value="">Sélectionnez un département</option>
                    {departments.map(dep => (
                      <option key={dep.id} value={dep.id}>{dep.name}</option>
                    ))}
                  </select>
                  {errors.departmentId && <span className="error-message">{errors.departmentId}</span>}
                </div>
              </div>
            </div>

            <div className="full-width-field">
              <div className="form-group">
                <label htmlFor="role">Poste*</label>
                <input
                  id="role"
                  name="role"
                  value={editForm.role}
                  onChange={onChange}
                  placeholder="Développeur front-end, Chef de projet..."
                  className={`modal-input ${errors.role ? 'input-error' : ''}`}
                  required
                />
                {errors.role && <span className="error-message">{errors.role}</span>}
              </div>
            </div>

            <div className="modal-actions enhanced-actions">
              <button 
                type="button" 
                onClick={onCancel} 
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
                    Enregistrement...
                  </>
                ) : "Enregistrer les modifications"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};

export default EditEmployeeModal;