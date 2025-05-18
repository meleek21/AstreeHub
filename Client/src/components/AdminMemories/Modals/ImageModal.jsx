import React from "react";
import { motion } from "framer-motion";
import ModalPortal from "../../ModalPortal";

function ImageModal({ image, onClose }) {
  if (!image) return null;

  return (
    <ModalPortal
      isOpen={!!image}
      onRequestClose={onClose}
      contentLabel="Image Preview"
      ariaHideApp={false}
    >
      <motion.div 
        className="image-modal-overlay" 
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div 
          className="image-modal-content"
          onClick={e => e.stopPropagation()}
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
        >
          <button 
            className="image-modal-close"
            onClick={onClose}
            aria-label="Fermer l'aperçu de l'image"
          >
            &times;
          </button>
          <img 
            src={image.fileUrl || URL.createObjectURL(image)} 
            alt={image.fileName || image.name} 
            className="image-modal-image"
          />
        </motion.div>
      </motion.div>
    </ModalPortal>
  );
}

export default ImageModal;