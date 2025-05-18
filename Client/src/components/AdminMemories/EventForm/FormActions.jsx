import React from "react";

function FormActions({ uploading, loading, editingId, onPreview, onCancelEdit }) {
  return (
    <div className="form-actions">
      <button 
        type="button" 
        onClick={onPreview} 
        disabled={uploading || loading} 
        className="preview-button"
      >
        Aperçu de la publication
      </button>
      <button 
        type="submit" 
        disabled={uploading || loading} 
        className="memories-submit-button"
      >
        {editingId ? "Mettre à jour l'événement" : uploading ? "Téléchargement..." : "Ajouter un événement"}
      </button>
      {editingId && (
        <button 
          type="button" 
          onClick={onCancelEdit} 
          className="cancel-button"
        >
          Annuler
        </button>
      )}
    </div>
  );
}

export default FormActions;