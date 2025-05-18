import React, { useRef } from "react";
import { useState } from "react";
import { motion } from "framer-motion";
import FileSearching from "../../../assets/FileSearching.png";
import FilePreview from "./FilePreview";

function FileUpload({ files, setFiles, inputRef, handleBrowseClick }) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles((prevFiles) => [...prevFiles, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileChange = (e) => {
    setFiles((prevFiles) => [...prevFiles, ...Array.from(e.target.files)]);
  };

  const removeFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        style={{ display: "none" }}
        aria-label="File input"
      />
      
      <div
        className={`file-upload-dropzone ${dragActive ? "drag-active" : ""}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        {files.length === 0 ? (
          <div className="dropzone-empty" onClick={handleBrowseClick}>
            <img src={FileSearching} alt="Recherche de fichiers" className="dropzone-image" />
            <div className="dropzone-text">Faites glisser et déposez les fichiers ici</div>
          </div>
        ) : (
          <FilePreview files={files} onRemove={removeFile} />
        )}
      </div>
    </>
  );
}

export default FileUpload;