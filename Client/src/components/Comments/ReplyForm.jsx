import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faReply } from '@fortawesome/free-solid-svg-icons';

const ReplyForm = ({ onAddReply }) => {
  const [newReply, setNewReply] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newReply.trim()) return;
    onAddReply(newReply);
    setNewReply('');
  };

  return (
    <form className="reply-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={newReply}
        onChange={(e) => setNewReply(e.target.value)}
        placeholder="Écrire une réponse..."
        className="reply-input"
        aria-label="Reply input"
      />
      <button 
        type="submit" 
        className="reply-button"
        disabled={!newReply.trim()}
        aria-label="Submit reply"
      >
        <FontAwesomeIcon icon={faReply} />
      </button>
    </form>
  );
};

export default ReplyForm;