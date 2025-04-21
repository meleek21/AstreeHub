import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { formatDateOrRelative } from '../../utils/formatDate';
import UserBadge from '../UserBadge';

const ReplyItem = ({ reply, userId, parentId, onEditReply, onDeleteReply }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingContent, setEditingContent] = useState(reply.content);

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditingContent(reply.content);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingContent(reply.content);
  };

  const handleUpdate = async () => {
    if (!editingContent.trim()) return;
    try {
      await onEditReply(parentId, reply.id, editingContent);
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update reply:", err);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette réponse ?")) {
      onDeleteReply(parentId, reply.id);
    }
  };

  return (
    <li
      className="reply-item"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="reply-content">
        <div className="reply-header">
          <UserBadge userId={reply.authorId} />
          <small className="reply-date">{formatDateOrRelative(reply.createdAt || reply.timestamp)}</small>
        </div>
        
        {isEditing ? (
          <div className="edit-reply-form">
            <textarea
              value={editingContent}
              onChange={(e) => setEditingContent(e.target.value)}
              placeholder="Modifier la réponse..."
              className="edit-textarea"
            />
            <div className="edit-actions">
              <button onClick={handleUpdate} className="save-button">
                Enregistrer
              </button>
              <button onClick={handleCancelEdit} className="cancel-button">
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="reply-text">{reply.content}</p>
            {reply.authorId === userId && isHovered && (
              <div className="reply-actions">
                <button onClick={handleStartEdit} className="action-button" aria-label="Edit reply">
                  <FontAwesomeIcon icon={faEdit} />
                </button>
                <button onClick={handleDelete} className="action-button" aria-label="Delete reply">
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </li>
  );
};

export default ReplyItem;