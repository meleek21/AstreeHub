import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import EmojiPicker from '../EmojiPicker';

const CommentForm = ({ onCreateComment }) => {
  const [newComment, setNewComment] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onCreateComment(newComment);
    setNewComment('');
    textareaRef.current?.focus();
  };

  const handleEmojiSelect = (emoji) => {
    setNewComment(prev => prev + emoji.native);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <div className="comment-input-container">
        <textarea
          ref={textareaRef}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Ajouter un commentaire..."
          rows="3"
          aria-label="Comment input"
          className="comment-textarea"
        />
      </div>
      <div className="comment-form-actions">
        <div className="actions-group">
          <EmojiPicker 
            onSelect={handleEmojiSelect}
            show={showEmojiPicker}
            setShow={setShowEmojiPicker}
          />
          <button 
            type="submit"
            className="send-button"
            disabled={!newComment.trim()}
            aria-disabled={!newComment.trim()}
          >
            <FontAwesomeIcon icon={faPaperPlane} />
          </button>
        </div>
      </div>
    </form>
  );
};

export default CommentForm;