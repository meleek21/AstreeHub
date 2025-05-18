import React from "react";
import { motion } from "framer-motion";
import ModalPortal from "../../ModalPortal";
import { getFileIconClass } from "../../../utils/fileUtils";

function PreviewModal({ isOpen, onClose, form, files, onSubmit }) {
  if (!isOpen) return null;

  return (
    <ModalPortal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="Preview Event Post"
      ariaHideApp={false}
    >
      <div className="post-editor-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="preview-title">
        <div className="post-editor-content" onClick={e => e.stopPropagation()}>
          <h3 className="preview-title" id="preview-title" tabIndex="0">Aperçu de la publication d'événement</h3>
          <div className="preview-section">
            <strong>Contenu :</strong>
            <div className="preview-content" tabIndex="0">{form.content}</div>
          </div>
          {files.length > 0 && (
            <div className="preview-section">
              <strong>Fichiers :</strong>
              <div className="quilted-grid-preview">
                {files.map((file, idx) => (
                  <motion.div
                    key={idx}
                    className={`quilted-item quilted-item-${idx % 9}`}
                    whileHover={{ scale: 1.05 }}
                    tabIndex="0"
                    aria-label={file.name || file.fileName}
                  >
                    {file.type && file.type.startsWith("image") ? (
                      <img 
                        src={URL.createObjectURL(file)} 
                        alt={file.name} 
                      />
                    ) : (
                      <div className="quilted-file-icon">
                        <span className={getFileIconClass(file.type)}></span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          <div className="preview-actions">
            <button type="button" onClick={onClose} className="preview-cancel" aria-label="Annuler l'aperçu" tabIndex="0">Annuler</button>
            <button 
              type="button"
              onClick={onSubmit} 
              className="preview-confirm"
              aria-label="Confirmer et publier"
              tabIndex="0"
            >
              Confirmer et publier
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

export default PreviewModal;