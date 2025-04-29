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

const PostCard = ({ post, userId, isAuthenticated, token, onDeletePost, onUpdatePost, openCommentsModal, onCommentClick }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [updatedContent, setUpdatedContent] = useState(post.content);
  const [expandedImage, setExpandedImage] = useState(null);
  const textareaRef = useRef(null);

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
          <p>{fileName}</p>
        </motion.div>
      );
    } else if (fileType === 'application/pdf') {
      return (
        <div className="file-item">
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="file-link">
            {fileName}
          </a>
        </div>
      );
    } else {
      return (
        <div className="file-item">
          <a href={fileUrl} download={fileName} className="file-link">
            {fileName}
          </a>
        </div>
      );
    }
  };

  const openReactionsModal = (postId) => {
    setSelectedPostId(postId);
    setIsReactionsModalOpen(true);
  };

  return (
    <div key={post.id || post._id} className="post-card">
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
            <div className="post-edit-menu">
              <button
                className="post-edit-toggle"
                aria-label="Options"
                onClick={toggleMenu}
              >
                ⋮
              </button>
              {isMenuOpen && (
                <div className="post-edit-options">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      closeMenu();
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
            <button onClick={handleSave} className="save-button">Enregistrer</button>
            <button onClick={() => setIsEditing(false)} className="cancel-button">Annuler</button>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PostCard;