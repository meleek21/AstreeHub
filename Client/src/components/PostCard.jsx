import React, { useState } from 'react';
import Reaction from './Reaction';
import '../assets/Css/PostCard.css';

const PostCard = ({ post, userId, isAuthenticated, token, onDeletePost, onUpdatePost, openCommentsModal }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for 3-dot menu

  // Toggle the dropdown menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close the dropdown menu
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Helper to format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Render files based on type
  const renderFile = (file) => {
    const { fileUrl, fileName, fileType, fileSize } = file;
    console.log('Rendering file:', file);

    if (fileType?.startsWith('image/')) {
      return (
        <div className="file-item">
          <img src={fileUrl} alt={fileName} className="post-image" />
          <p>{fileName} ({formatFileSize(fileSize)})</p>
        </div>
      );
    } else if (fileType === 'application/pdf') {
      return (
        <div className="file-item">
          <a href={fileUrl} target="_blank" rel="noopener noreferrer">
            {fileName} ({formatFileSize(fileSize)})
          </a>
        </div>
      );
    } else {
      return (
        <div className="file-item">
          <a href={fileUrl} download={fileName}>
            {fileName} ({formatFileSize(fileSize)})
          </a>
        </div>
      );
    }
  };

  return (
    <div key={post.id || post._id} className="post-card">
      {/* Post Header with Author, Date, and 3-Dot Menu */}
      <div className="post-header">
        <div className="post-meta">
          <span className="post-author">Publié par : {post.authorName || 'Inconnu'}</span>
          <span className="post-date">
            Date : {new Date(post.createdAt || post.timestamp).toLocaleDateString()}
          </span>
        </div>
        {/* 3-Dot Menu for Posts by the Logged-In User */}
        {post.authorId === userId && (
          <div className="post-actions">
            <div className="post-edit-menu custom-post-edit-menu">
              <button
                className="post-edit-toggle"
                aria-label="Options"
                onClick={toggleMenu} // Toggle menu on click
              >
                ⋮
              </button>
              {/* Conditionally render the dropdown menu */}
              {isMenuOpen && (
                <div className="post-edit-options custom-post-edit-options">
                  <button onClick={() => { onUpdatePost(post.id); closeMenu(); }}>Modifier</button>
                  <button onClick={() => { onDeletePost(post.id); closeMenu(); }}>Supprimer</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Post Content */}
      <p className="post-content">{post.content}</p>

      {/* Attached Files */}
      {(post.files?.length > 0 || post.Files?.length > 0) && (
        <div className="post-files">
          <h4>Fichiers joints :</h4>
          {(post.files || post.Files || []).map((file) => (
            <div key={file.id}>{renderFile(file)}</div>
          ))}
        </div>
      )}

      {/* Reaction and Comment Buttons */}
      <div className="post-interaction-buttons">
        <button className="view-comments-button" onClick={() => openCommentsModal(post.id)}>
          Commentaires
        </button>
        <Reaction postId={post.id} employeeId={userId} />
      </div>
    </div>
  );
};

export default PostCard;