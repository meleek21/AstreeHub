import React, { useEffect, useRef, useState } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import connectionManager from '../../services/connectionManager';

const ChatWindow = ({ 
  conversation, 
  messages = [], 
  loading, 
  currentUser, 
  onSendMessage,
  onEditMessage,
  onUnsendMessage,
  onSoftDeleteMessage 
}) => {
  const [messageText, setMessageText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const typingTimeouts = useRef({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!conversation) return;
    // Listen for typing events
    connectionManager.onUserTyping(({ userId, conversationId }) => {
      if (conversationId === conversation.id && userId !== currentUser.id) {
        setTypingUsers(prev => {
          if (!prev.includes(userId)) return [...prev, userId];
          return prev;
        });
        // Remove typing indicator after 2.5s
        if (typingTimeouts.current[userId]) clearTimeout(typingTimeouts.current[userId]);
        typingTimeouts.current[userId] = setTimeout(() => {
          setTypingUsers(prev => prev.filter(id => id !== userId));
        }, 2500);
      }
    });
    return () => {
      // Clean up listeners and timeouts
      Object.values(typingTimeouts.current).forEach(clearTimeout);
      typingTimeouts.current = {};
      connectionManager.offUserTyping && connectionManager.offUserTyping();
    };
  }, [conversation, currentUser]);

  const handleInputChange = (e) => {
    setMessageText(e.target.value);
    if (conversation && currentUser) {
      connectionManager.sendTypingIndicator && connectionManager.sendTypingIndicator(conversation.id);
    }
  };
  const handleSubmit = (e) => {
    e.preventDefault();
    if (messageText.trim() === '' && !attachment) return;
    onSendMessage(messageText, attachment);
    setMessageText('');
    setAttachment(null);
  };

  if (!conversation) {
    return (
      <div className="chat-window empty">
        <div className="empty-state">
          <h3>Select a conversation</h3>
          <p>Choose a chat from the list to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>{conversation.isGroup ? conversation.title : 
          conversation.participants.find(p => p.id !== currentUser.id)?.name}
        </h3>
      </div>

      <div className="messages-container">
        {loading ? (
          <div className="loading">Loading messages...</div>
        ) : (
          (() => {
            let lastDate = null;
            // Sort messages by timestamp ascending (oldest first)
            const sortedMessages = [...messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            return sortedMessages
              .filter(message => !message.deletedForUsers || !message.deletedForUsers.includes(currentUser.id))
              .map((message, idx) => {
                const dateObj = new Date(message.timestamp);
                const dateStr = dateObj && !isNaN(dateObj.getTime()) ? format(dateObj, 'yyyy-MM-dd') : '';
                let showDateSeparator = false;
                if (dateStr !== lastDate) {
                  showDateSeparator = true;
                  lastDate = dateStr;
                }
                let separatorLabel = '';
                if (showDateSeparator) {
                  if (isToday(dateObj)) {
                    separatorLabel = 'Today';
                  } else if (isYesterday(dateObj)) {
                    separatorLabel = 'Yesterday';
                  } else if (dateStr) {
                    separatorLabel = format(dateObj, 'EEEE, MMM d, yyyy');
                  }
                }
                const isOwn = message.senderId === currentUser.id;
                const canEditOrUnsend = isOwn && !message.isUnsent && (Date.now() - new Date(message.timestamp).getTime()) < 5 * 60 * 1000;
                return (
                  <React.Fragment key={message.id}>
                    {showDateSeparator && separatorLabel && (
                      <div className="date-separator">{separatorLabel}</div>
                    )}
                    <div 
                      className={`message ${isOwn ? 'sent' : 'received'}`}
                    >
                      <div className="message-content">
                        <div className="message-text">
                          {message.isUnsent ? <i>This message was unsent.</i> : <span id={`message-${message.id}`}>{message.content}</span>}
                          {message.isEdited && !message.isUnsent && <span style={{fontSize:'0.8em',color:'#888',marginLeft:'6px'}}>(edited)</span>}
                        </div>
                        {message.attachmentUrl && !message.isUnsent && (
                          <div className="message-attachment">
                            {message.attachmentUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                              <img src={message.attachmentUrl} alt="attachment" style={{ maxWidth: '200px', maxHeight: '200px', marginTop: '8px', borderRadius: '8px' }} />
                            ) : message.attachmentUrl.match(/\.(mp4|webm|ogg)$/i) ? (
                              <video controls style={{ maxWidth: '250px', maxHeight: '200px', marginTop: '8px', borderRadius: '8px' }}>
                                <source src={message.attachmentUrl} />
                                Your browser does not support the video tag.
                              </video>
                            ) : (
                              <a href={message.attachmentUrl} target="_blank" rel="noopener noreferrer">View Attachment</a>
                            )}
                          </div>
                        )}
                        <div className="message-meta">
                          <span>{format(new Date(message.timestamp), 'HH:mm')}</span>
                          {isOwn && (
                            <span style={{marginLeft:'8px',color:message.isSent ? '#2196F3' : '#aaa',fontSize:'0.9em'}} title={message.isSent ? "Sent" : "Not sent"}>{message.isRead ? '✔️✔️' :'✔️' }</span>
                          )}
                          {canEditOrUnsend && (
                            <span style={{marginLeft:'10px'}}>
                             <button 
  style={{marginRight:'4px'}} 
  disabled={!canEditOrUnsend} 
  onClick={() => {
    const messageElement = document.getElementById(`message-${message.id}`);
    if (messageElement) {
      messageElement.contentEditable = true;
      messageElement.focus();
      const range = document.createRange();
      range.selectNodeContents(messageElement);
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      const handleBlur = () => {
        messageElement.contentEditable = false;
        const newContent = messageElement.innerText.trim();
        if (newContent !== message.content && newContent !== '') {
          onEditMessage(message.id, {
            content: newContent,
            conversationId: message.conversationId,
            attachmentUrl: message.attachmentUrl || null,
            userId: currentUser.id
          });
        } else {
          messageElement.innerText = message.content;
        }
        messageElement.removeEventListener('blur', handleBlur);
        messageElement.removeEventListener('keydown', handleKeyDown);
      };

      const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          messageElement.blur();
        } else if (e.key === 'Escape') {
          messageElement.innerText = message.content;
          messageElement.blur();
        }
      };

      messageElement.addEventListener('blur', handleBlur);
      messageElement.addEventListener('keydown', handleKeyDown);
    }
  }} 
  title="Edit"
>
  ✏️
</button>

<button 
  style={{marginRight:'4px'}} 
  disabled={!canEditOrUnsend} 
  onClick={() => onUnsendMessage(message.id, currentUser.id)} 
  title="Unsend"
>
  🕒
</button>

<button 
  onClick={() => onSoftDeleteMessage(message.id, currentUser.id)} 
  title="Delete"
>
  🗑️
</button>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </React.Fragment>
                );
              });
          })()
        )}
        {typingUsers.length > 0 && (
          <div className="typing-indicator" style={{marginLeft:10, color:'#888', fontStyle:'italic'}}>
            {typingUsers.length === 1 ? 'Someone is typing...' : 'Several people are typing...'}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="message-input">
        <input
          type="text"
          value={messageText}
          onChange={handleInputChange}
          placeholder="Type a message..."
        />
        <input
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
          onChange={e => setAttachment(e.target.files[0])}
        />
        <button type="submit" disabled={!messageText.trim() && !attachment}>
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
