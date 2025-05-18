import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Reaction from './Reactions/Reaction';
import '../assets/Css/Reactions.css';
import '../assets/Css/Comment.css';
import UserBadge from './UserBadge';
import toast from 'react-hot-toast';
import DOMPurify from 'dompurify';
import { useNavigate } from 'react-router-dom';
import '../assets/Css/PostCard.css';
import { formatDateOrRelative } from '../utils/formatDate';

const PostCard = ({ post, userId, isAuthenticated, token, onDeletePost, onUpdatePost, openCommentsModal, onCommentClick, setSelectedPostId }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedContent, setUpdatedContent] = useState(post.content);
  const [expandedImage, setExpandedImage] = useState(null);
  const textareaRef = useRef(null);
  const menuRef = useRef(null);
  const handleCommentClick = onCommentClick || openCommentsModal;

  const formatContent = (content) => {
    if (!content) return '';
    
    let formattedContent = content.replace(
      /@\[([^\]]+)\]\(user:([^\)]+)\)/g,
      '<a href="/profile/view/$2" class="user-mention">@$1</a>'
    );
    
    formattedContent = formattedContent.replace(
      /(https?:\/\/[^\s]+)/g, 
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    return DOMPurify.sanitize(formattedContent, {
      ALLOWED_TAGS: ['a', 'br', 'p'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'class']
    });
  };

  const handleContentClick = (e) => {
    if (e.target.classList.contains('user-mention')) {
      e.preventDefault();
      const href = e.target.getAttribute('href');
      navigate(href);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  useEffect(() => {
    if (isMenuOpen) {
      const handleClickOutside = (event) => {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          closeMenu();
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isMenuOpen]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (!updatedContent.trim()) {
      toast.error('Le contenu ne peut pas être vide.');
      return;
    }
  
    try {
      await onUpdatePost(post.id, {
        content: updatedContent,
        authorId: post.authorId,
        isPublic: post.isPublic,
        fileIds: post.fileIds || [],
      });
      setIsEditing(false);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du post :', err);
      if (err.message === 'Network Error') {
        toast.error('Erreur de connexion. Veuillez vérifier votre connexion internet.');
      } else {
        toast.error(err.response?.data?.message || 'Erreur lors de la mise à jour de la publication.');
      }
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderFile = (file) => {
    const { fileUrl, fileName, fileType, fileSize } = file;

    if (fileType?.startsWith('image/')) {
      return (
        <motion.div
          className="file-item"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          onClick={() => setExpandedImage(fileUrl)}
        >
          <motion.img
            src={fileUrl}
            alt={fileName}
            className="post-image"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.3 }}
          />
          <div className="file-meta">
            <span className="file-name">{fileName}</span>
            <span className="file-size">{formatFileSize(fileSize)}</span>
          </div>
        </motion.div>
      );
    } else if (fileType === 'application/pdf') {
      return (
        <div className="file-item file-document">
          <div className="file-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <path d="M10 13v-1h2.5v6H10v-1"></path>
              <path d="M14 13v-1h2v6h-2v-1"></path>
              <path d="M6 13h1.5v3H6v-3z"></path>
            </svg>
          </div>
          <div className="file-meta">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="file-link">
              {fileName}
            </a>
            <span className="file-size">{formatFileSize(fileSize)}</span>
          </div>
        </div>
      );
    } else {
      return (
        <div className="file-item file-document">
          <div className="file-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>
          <div className="file-meta">
            <a href={fileUrl} download={fileName} className="file-link">
              {fileName}
            </a>
            <span className="file-size">{formatFileSize(fileSize)}</span>
          </div>
        </div>
      );
    }
  };

  const openReactionsModal = (postId) => {
    setSelectedPostId(postId);
    setIsReactionsModalOpen(true);
  };

  return (
    <motion.div 
      key={post.id || post._id} 
      className="post-card"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Post Header */}
      <div className="post-header">
        <div className="post-meta">
          <UserBadge userId={post.authorId} />
          <span className="post-date">
            {formatDateOrRelative(post.createdAt || post.timestamp)}
          </span>
        </div>
        
        {post.authorId === userId && (
          <div className="post-actions">
            <div className="post-edit-menu" ref={menuRef}>
              <button
                className="post-edit-toggle"
                aria-label="Options"
                onClick={toggleMenu}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="5" cy="12" r="2"/>
                  <circle cx="12" cy="12" r="2"/>
                  <circle cx="19" cy="12" r="2"/>
                </svg>
              </button>
              {isMenuOpen && (
                <motion.div 
                  className="post-edit-options"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      closeMenu();
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Modifier
                  </button>
                  <button
                    onClick={() => {
                      onDeletePost(post.id);
                      closeMenu();
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Supprimer
                  </button>
                </motion.div>
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
            <button onClick={handleSave} className="save-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                <polyline points="17 21 17 13 7 13 7 21"></polyline>
                <polyline points="7 3 7 8 15 8"></polyline>
              </svg>
              Enregistrer
            </button>
            <button onClick={() => setIsEditing(false)} className="cancel-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <div 
          className="post-content"
          dangerouslySetInnerHTML={{ __html: formatContent(post.content) }}
          onClick={handleContentClick}
        />
      )}

      {/* Attached Files */}
      {(post.files?.length > 0 || post.Files?.length > 0) && (
        <div className="post-files">
          {(post.files || post.Files || []).map((file) => (
            <div key={file.id}>{renderFile(file)}</div>
          ))}
        </div>
      )}

      {/* Interaction Buttons */}
      <div className="post-interaction-buttons">
        <button className="view-comments-button" onClick={() => handleCommentClick(post.id)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          Commentaires
        </button>
        <Reaction postId={post.id} employeeId={userId} openReactionsModal={openReactionsModal} />
      </div>

      {/* Expanded Image Modal */}
      <AnimatePresence>
        {expandedImage && (
          <motion.div
            className="expanded-image-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setExpandedImage(null)}
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
            <button className="close-expanded-image">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default PostCard;