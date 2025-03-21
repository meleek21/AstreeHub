import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Reaction from './Reaction';
import UserBadge from './UserBadge';
import '../assets/Css/PostCard.css';

const PostCard = ({ post, userId, isAuthenticated, token, onDeletePost, onUpdatePost, openCommentsModal }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State for 3-dot menu
  const [isEditing, setIsEditing] = useState(false); // State for edit mode
  const [updatedContent, setUpdatedContent] = useState(post.content); // State for updated content
  const [expandedImage, setExpandedImage] = useState(null); // State for expanded image
  const textareaRef = useRef(null); // Ref for auto-focusing the textarea

  // Toggle the dropdown menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Close the dropdown menu
  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Auto-focus the textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  // Handle saving the updated post
  const handleSave = async () => {
    if (!updatedContent.trim()) {
      toast.error('Le contenu ne peut pas être vide.');
      return;
    }
  
    try {
      await onUpdatePost(post.id, {
        content: updatedContent,
        authorId: post.authorId, // Pass the authorId
        isPublic: post.isPublic,
        fileIds: post.fileIds || [],
      });
      setIsEditing(false); // Exit edit mode after successful update
    } catch (err) {
      console.error('Erreur lors de la mise à jour du post :', err);
    }
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
        <motion.div
          className="file-item"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          onClick={() => setExpandedImage(fileUrl)} // Set the expanded image on click
        >
          <motion.img
            src={fileUrl}
            alt={fileName}
            className="post-image"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          />
          <p>{fileName} ({formatFileSize(fileSize)})</p>
        </motion.div>
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
          <UserBadge userId={post.authorId} />
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
                  <button
                    onClick={() => {
                      setIsEditing(true); // Enter edit mode
                      closeMenu(); // Close the dropdown menu
                    }}
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => {
                      onDeletePost(post.id);
                      closeMenu();
                    }}
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Post Content */}
      {isEditing ? (
        <div className="edit-mode">
          <textarea
            ref={textareaRef}
            value={updatedContent}
            onChange={(e) => setUpdatedContent(e.target.value)}
            placeholder="Modifiez votre post..."
            className="edit-textarea"
          />
          <div className="edit-actions">
            <button onClick={handleSave}>Enregistrer</button>
            <button onClick={() => setIsEditing(false)}>Annuler</button>
          </div>
        </div>
      ) : (
        <p className="post-content">{post.content}</p>
      )}

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

      {/* Expanded Image Modal */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div
            className="expanded-image-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedImage(null)} // Close the modal when clicking outside
          >
            <motion.img
              src={expandedImage}
              alt="Expanded"
              className="expanded-image"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PostCard;