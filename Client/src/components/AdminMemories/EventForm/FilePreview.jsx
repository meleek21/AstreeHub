import React from "react";
import { formatFileSize } from "../../../utils/fileUtils";

function FilePreview({ files, onRemove }) {
  return (
    <div className="file-preview-grid">
      {files.map((file, index) => (
        <div key={index} className="file-preview">
          {file.type && file.type.startsWith("image") ? (
            <img 
              src={URL.createObjectURL(file)} 
              alt={file.name} 
              className="file-preview-image" 
            />
          ) : (
            <div className="file-icon">
              <lord-icon 
                src="https://cdn.lordicon.com/hnqamtrw.json" 
                colors="primary:#ebe6ef,secondary:var(--primary)" 
                className="icon"
              ></lord-icon>
            </div>
          )}
          <div className="file-info">
            <div className="file-name">{file.name}</div>
            <div className="file-size">{formatFileSize(file.size)}</div>
          </div>
          <button 
            type="button" 
            onClick={() => onRemove(index)} 
            className="remove-file-button"
            aria-label="Supprimer le fichier"
          >
            <svg viewBox="0 0 24 24" className="remove-icon">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

export default FilePreview;