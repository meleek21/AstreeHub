import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { formatDateOrRelative } from '../../utils/formatDate';
import UserBadge from '../Profiles/UserBadge';
import ReplyForm from './ReplyForm';
import RepliesList from './RepliesList';

const CommentItem = ({ 
  comment, 
  userId, 
  onAddReply, 
  onDeleteComment,
  onEditReply,
  onDeleteReply,
  isEditing,
  onStartEdit,
  onCancelEdit,
  onUpdateComment,
  editingContent,
  onEditingContentChange
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const handleStartEdit = () => {
    onStartEdit(comment.id, comment.content);
  };

  const handleDelete = () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")) {
      onDeleteComment(comment.id);
    }
  };

  return (
    <li
      className="comment-item"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="comment-content">
        <div className="comment-header">
          <UserBadge userId={comment.authorId} />
          <small className="comment-date">{formatDateOrRelative(comment.createdAt || comment.timestamp)}</small>
        </div>
        
        {isEditing ? (
          <div className="edit-comment-form">
            <textarea
              value={editingContent}
              onChange={(e) => onEditingContentChange(e.target.value)}
              placeholder="Modifier le commentaire..."
              className="edit-textarea"
            />
            <div className="edit-actions">
              <button onClick={onUpdateComment} className="save-button">
                Enregistrer
              </button>
              <button onClick={onCancelEdit} className="cancel-button">
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="comment-text">{comment.content}</p>
            {comment.authorId === userId && isHovered && (
              <div className="comment-actions">
                <button onClick={handleStartEdit} className="action-button" aria-label="Edit comment">
                  <FontAwesomeIcon icon={faEdit} />
                </button>
                <button onClick={handleDelete} className="action-button" aria-label="Delete comment">
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      
      <RepliesList
        replies={comment.replies || []}
        userId={userId}
        parentId={comment.id}
        onEditReply={onEditReply}
        onDeleteReply={onDeleteReply}
      />
      <ReplyForm 
        onAddReply={(content) => onAddReply(comment.id, content)} 
      />
    </li>
  );
};

export default CommentItem;