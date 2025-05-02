import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';

const Message = ({ message, currentUser, conversation, onEditMessage, onUnsendMessage, onSoftDeleteMessage }) => {
  const isOwn = message.senderId === currentUser.id;
  const canEditOrUnsend = isOwn && !message.isUnsent && (Date.now() - new Date(message.timestamp).getTime()) < 5 * 60 * 1000;
  const [hovered, setHovered] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImage, setModalImage] = useState(null);
  const messageRef = useRef(null);

  const handleImageClick = (imageUrl) => {
    setModalImage(imageUrl);
    setShowImageModal(true);
  };

  const closeModal = (e) => {
    if (e.target.classList.contains('image-modal')) {
      setShowImageModal(false);
    }
  };

  // Close modal on ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowImageModal(false);
      }
    };

    if (showImageModal) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showImageModal]);

  return (
    <>
      <div 
        className={`message ${isOwn ? 'sent' : 'received'}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        ref={messageRef}
      >
        {!isOwn && !conversation.isGroup && (
          <div className="sender-avatar">
            {message.senderName?.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="message-content">
          {!isOwn && conversation.isGroup && (
            <div className="sender-name">{message.senderName}</div>
          )}
          <MessageContent 
            message={message} 
            onImageClick={handleImageClick} 
          />
          <MessageMeta message={message} isOwn={isOwn} />
          {(hovered || canEditOrUnsend) && isOwn && !message.isUnsent && (
            <MessageActions 
              message={message}
              currentUser={currentUser}
              onEditMessage={onEditMessage}
              onUnsendMessage={onUnsendMessage}
              onSoftDeleteMessage={onSoftDeleteMessage}
              canEditOrUnsend={canEditOrUnsend}
            />
          )}
        </div>
      </div>

      {showImageModal && (
        <div className="image-modal" onClick={closeModal}>
          <div className="modal-content">
            <img src={modalImage} alt="Enlarged content" />
            <button 
              className="close-modal"
              onClick={() => setShowImageModal(false)}
              aria-label="Close image"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M18 6L6 18M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const MessageContent = ({ message, onImageClick }) => (
  <div className="message-text">
    {message.isUnsent ? (
      <i>Ce message a été annulé</i>
    ) : (
      <span id={`message-${message.id}`}>{message.content}</span>
    )}
    {message.isEdited && !message.isUnsent && (
      <span className="edited-badge">(modifié)</span>
    )}
    {message.attachmentUrl && !message.isUnsent && (
      <MessageAttachment 
        attachmentUrl={message.attachmentUrl} 
        onImageClick={onImageClick}
      />
    )}
  </div>
);

const MessageAttachment = ({ attachmentUrl, onImageClick }) => {
  if (attachmentUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i)) {
    return (
      <img 
        src={attachmentUrl} 
        alt="pièce jointe" 
        className="image-attachment"
        onClick={() => onImageClick(attachmentUrl)}
      />
    );
  }
  if (attachmentUrl.match(/\.(mp4|webm|ogg)$/i)) {
    return (
      <video controls className="video-attachment">
        <source src={attachmentUrl} />
      </video>
    );
  }
  return (
    <a href={attachmentUrl} target="_blank" rel="noopener noreferrer" className="file-attachment">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
      </svg>
      <span>Voir le fichier</span>
    </a>
  );
};

const MessageMeta = ({ message, isOwn }) => (
  <div className="message-meta">
    <span className="timestamp">{format(new Date(message.timestamp), 'h:mm a')}</span>
    {isOwn && (
      <span className={`status-icon ${message.isRead ? 'read' : 'sent'}`}>
        {message.isRead ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.06 14.54L7.4 12l1.41-1.41 2.12 2.12 4.24-4.24 1.41 1.41-5.64 5.66z" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
          </svg>
        )}
      </span>
    )}
  </div>
);

const MessageActions = ({ message, currentUser, onEditMessage, onUnsendMessage, onSoftDeleteMessage, canEditOrUnsend }) => {
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef(null);

  const handleEdit = () => {
    if (!canEditOrUnsend) return;
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
  };

  return (
    <div 
      className={`message-actions ${showActions ? 'visible' : ''}`}
      ref={actionsRef}
    >
      {canEditOrUnsend && (
        <button 
          className="icon-button" 
          onClick={handleEdit} 
          title="Modifier"
          onMouseEnter={() => setShowActions(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#173b61ff">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </button>
      )}
      {canEditOrUnsend && (
        <button 
          className="icon-button" 
          onClick={() => onUnsendMessage(message.id, currentUser.id)} 
          title="Annuler l'envoi"
          onMouseEnter={() => setShowActions(true)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#17616eff">
            <path d="M1 4v6h6"></path>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
          </svg>
        </button>
      )}
      <button 
        className="icon-button" 
        onClick={() => onSoftDeleteMessage(message.id, currentUser.id)} 
        title="Supprimer"
        onMouseEnter={() => setShowActions(true)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A41623">
          <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      </button>
    </div>
  );
};

export default Message;