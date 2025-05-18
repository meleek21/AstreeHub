import React from "react";
import { formatFileSize } from "../../../utils/fileUtils";

function FileToolbar({ files, progress, onClear, handleBrowseClick }) {
  const totalFileSize = files.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="file-upload-toolbar">
      <button 
        type="button" 
        onClick={handleBrowseClick} 
        className="toolbar-button"
        aria-label="Parcourir les fichiers"
      >
        <lord-icon 
          src="https://cdn.lordicon.com/ucjqqgja.json" 
          trigger="click" 
          state="hover-upload-2" 
          colors="primary:#1663c7"
          style={{width:'30px',height:'30px'}}
        ></lord-icon>
      </button>
      <button 
        type="button" 
        onClick={onClear} 
        disabled={files.length === 0} 
        className="toolbar-button"
        aria-label="Effacer les fichiers"
      >
        <lord-icon 
          src="https://cdn.lordicon.com/ebyacdql.json" 
          colors="primary:#A41623"
          trigger="click" 
          style={{width:'30px',height:'30px'}}
        ></lord-icon>
      </button>
      <span className="file-size">{formatFileSize(totalFileSize)} / 1 MB</span>
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${progress}%` }}></div>
      </div>
    </div>
  );
}

export default FileToolbar;