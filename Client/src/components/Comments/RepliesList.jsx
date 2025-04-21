import React, { useState } from 'react';
import ReplyItem from './ReplyItem';

const RepliesList = ({ replies, userId, parentId, onEditReply, onDeleteReply }) => {
  const [showReplies, setShowReplies] = useState(false);

  if (replies.length === 0) return null;

  return (
    <div>
      <button 
        onClick={() => setShowReplies(!showReplies)} 
        className="toggle-replies"
      >
        {showReplies ? 'Masquer les réponses' : `Afficher ${replies.length} réponse(s)`}
      </button>
      <ul className={`replies-list ${showReplies ? 'visible' : ''}`}>
        {replies.map((reply) => (
          <ReplyItem
            key={reply.id}
            reply={reply}
            userId={userId}
            parentId={parentId}
            onEditReply={onEditReply}
            onDeleteReply={onDeleteReply}
          />
        ))}
      </ul>
    </div>
  );
};

export default RepliesList;