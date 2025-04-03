import React from 'react';

const Message = React.memo(({ 
  message, 
  isSentByMe, 
  formatDate, 
  conversation, 
  currentUserId 
}) => {
  return (
    <div className={`message-item ${isSentByMe ? 'sent' : 'received'}`}>
      {!isSentByMe && conversation?.isGroup && (
        <strong>
          {conversation.participants.find(p => p.id === message.senderId)?.name || 'Unknown'}
        </strong>
      )}
      
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
        {isSentByMe && (
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