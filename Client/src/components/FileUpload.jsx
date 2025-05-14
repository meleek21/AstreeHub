import React, { useState, useEffect, useRef } from 'react';
import { libraryAPI, authAPI, postsAPI } from '../services/apiServices';
import toast from 'react-hot-toast';
import { useAuth } from '../Context/AuthContext';
import '../assets/Css/FileUpload.css';
import FileSearching from '../assets/FileSearching.png';

function FileUpload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [checkedAuth, setCheckedAuth] = useState(false);
  const [content, setContent] = useState('');
  const { user } = useAuth();
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const authorId = user?.id;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await authAPI.getUserInfo();
        const role = res.data?.role || [];
        setIsSuperAdmin(role === 'SUPERADMIN');
      } catch (e) {
        setIsSuperAdmin(false);
      } finally {
        setCheckedAuth(true);
      }
    };
    fetchUser();
  }, []);

  const handleFileChange = (e) => {
    setFiles((prevFiles) => [...prevFiles, ...Array.from(e.target.files)]);
  };

  const removeFile = (index) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
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

  const handleBrowseClick = () => {
    inputRef.current.click();
  };

  const uploadFilesToBackend = async () => {
    const uploadedFiles = [];
    let uploadedCount = 0;
    for (const file of files) {
      const formData = new FormData();
      formData.append('files', file);
      try {
        const response = await postsAPI.uploadFile(formData);
        if (Array.isArray(response.data) && response.data.length > 0) {
          const fileData = response.data[0];
          if (fileData.id && fileData.fileUrl) {
            uploadedFiles.push({
              fileUrl: fileData.fileUrl,
              fileId: fileData.id,
              name: file.name
            });
          }
        }
        uploadedCount++;
        setProgress(Math.round((uploadedCount / files.length) * 100));
      } catch (error) {
        console.error('Erreur de téléchargement de fichier:', error);
        toast.error('Échec du téléchargement du fichier.');
        throw error;
      }
    }
    return uploadedFiles;
  };

  const handleClear = () => {
    setFiles([]);
    setProgress(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);
    setProgress(0);
    if (files.length === 0 && !content.trim()) {
      toast.error('Veuillez ajouter du texte ou sélectionner des fichiers à télécharger.');
      setUploading(false);
      return;
    }
    try {
      let uploadedFiles = [];
      if (files.length > 0) {
        uploadedFiles = await uploadFilesToBackend();
      }
      const postData = {
        content: content || '',
        authorId: authorId || '',
        isPublic: false,
        isLibraryPost: true,
        fileIds: uploadedFiles.map((file) => file.fileId)
      };
      await libraryAPI.AddLibraryPost(postData);
      toast.success('Publication de la bibliothèque créée avec succès.');
      setFiles([]);
      setContent('');
      setProgress(0);
    } catch (err) {
      console.error('Erreur lors de la création de la publication:', err);
      toast.error('Échec de la création de la publication dans la bibliothèque.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const totalFileSize = files.reduce((acc, f) => acc + f.size, 0);

  if (!checkedAuth) {
    return <div className="file-upload-loading">Vérification des permissions...</div>;
  }

  if (!isSuperAdmin) {
    return <div className="file-upload-error">Vous n'avez pas la permission de télécharger des fichiers dans la bibliothèque.</div>;
  }

  return (
    <div className="file-upload-container">
      <input 
        type='text'
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder="Ajoutez une description"
        className="file-upload-textarea"
        aria-label="Content description"/>
      <form 
        onSubmit={handleSubmit} 
        className="file-upload-form" 
        onDragEnter={handleDrag}>
        <div className="file-upload-toolbar">
          <button 
            type="button" 
            className="file-upload-action file-upload-browse" 
            onClick={handleBrowseClick}
            aria-label="Browse files">
            <lord-icon 
              src="https://cdn.lordicon.com/ucjqqgja.json" 
              trigger="click"
              state="hover-upload-2"
              colors="primary:#1663c7"
              style={{width:'30px',height:'30px'}}>
            </lord-icon>
          </button>
          <button 
            type="submit" 
            className="file-upload-action file-upload-upload" 
            disabled={uploading || files.length === 0}
            aria-label="Upload files">
            <lord-icon
              src="https://cdn.lordicon.com/sbuaiykm.json"
              trigger="click"
              stroke="bold"
              colors="primary:#1663c7,secondary:#e8b730"
              style={{width:'30px',height:'30px'}}>
            </lord-icon>
          </button>
          <button 
            type="button" 
            className="file-upload-action file-upload-clear" 
            onClick={handleClear} 
            disabled={files.length === 0 || uploading}
            aria-label="Clear files">
            <lord-icon
              src="https://cdn.lordicon.com/ebyacdql.json"
              colors="primary:#A41623"
              trigger="click"
              style={{width:'30px',height:'30px'}}>
            </lord-icon>
          </button>
          <div className="file-upload-progress-info">
            <span className="file-upload-size-info">
              {formatFileSize(totalFileSize)} / 1 MB
            </span>
            <div className="file-upload-progress-bar">
              <div 
                className="file-upload-progress" 
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={handleFileChange}
          className="file-upload-input"
          aria-label="File input"
        />
        <div
          className={`file-upload-dropzone ${dragActive ? 'drag-active' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {files.length === 0 ? (
            <div className="file-upload-dropzone-content">
              <img src={FileSearching} alt="Astree Logo" className="file-upload-dropzone-icon" />
              <div className="file-upload-dropzone-text">
                Drag and Drop Files Here
              </div>
            </div>
          ) : (
            <div className="file-preview-area file-preview-in-dropzone">
              {files.map((file, index) => (
                <div key={index} className="file-preview-item">
                  {file.type && file.type.startsWith('image') ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="file-preview-thumbnail"
                    />
                  ) : (
                    <div className="file-preview-icon">
                      <lord-icon
                        src="https://cdn.lordicon.com/hnqamtrw.json"
                        colors="primary:#ebe6ef,secondary:#911710"
                        style={{width:'50px',height:'50px'}}>
                      </lord-icon>
                    </div>
                  )}
                  <div className="file-preview-details">
                    <span className="file-preview-name">{file.name}</span>
                    <span className="file-preview-size">{formatFileSize(file.size)}</span>
                    <span className="file-preview-date">{new Date().toLocaleDateString()}</span>
                  </div>
                  <button 
                    type="button" 
                    className="file-preview-remove" 
                    onClick={() => removeFile(index)}
                    aria-label="Remove file"
                  >
                    <svg viewBox="0 0 24 24">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={uploading}
          className={`file-upload-submit ${uploading ? 'uploading' : ''}`}
        >
          {uploading ? 'Téléchargement en cours...' : 'Télécharger dans la bibliothèque'}
        </button>
      </form>
    </div>
  );
}

export default FileUpload;