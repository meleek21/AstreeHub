import React from 'react';

const TypingIndicator = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;
  
  return (
    <div className="typing-indicator">
      {typingUsers.length === 1 ? 'écrit...' : 'plusieurs écrivent...'}
    </div>
  );
};

export default TypingIndicator;