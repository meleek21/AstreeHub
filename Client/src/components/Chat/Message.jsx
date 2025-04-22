import React from 'react';

const Message = React.memo(({ 
  message, 
  isOwnMessage,
  isOnline 
}) => {
  if (!message) {
    return null;
  }

  // Format date helper function (since it's not being passed)
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <div className={`message-item ${isOwnMessage ? 'sent' : 'received'}`}>
      <p>{message.content}</p>
      
      {message.attachmentUrl && (
        <div className="file-content">
          {message.attachmentUrl.match(/\.(jpeg|jpg|gif|png)$/i) ? (
            <img src={message.attachmentUrl} alt="Attachment" />
          ) : (
            <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer">
              View Attachment
            </a>
          )}
        </div>
      )}
      
      <div className="message-timestamp">
        {formatDate(message.timestamp)}
        {isOwnMessage && (
          <span className="read-receipt">
            {message.isRead ? 'Read' : 'Delivered'}
          </span>
        )}
      </div>
    </div>
  );
});

Message.displayName = 'Message';

export default Message;