import React from 'react';
import ModalPortal from './ModalPortal';
import '../assets/CSS/ConfirmationModal.css';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="confirmation-modal-overlay">
        <div className="confirmation-modal-content">
          <div className="confirmation-modal-header">
            <h3>{title}</h3>
          </div>
          <div className="modal-body">
            <p>{message}</p>
          </div>
          <div className="modal-actions">
            <button onClick={onClose} className="modal-button cancel">
              Annuler
            </button>
            <button onClick={onConfirm} className="modal-button confirm">
              Confirmer
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};

export default ConfirmationModal;