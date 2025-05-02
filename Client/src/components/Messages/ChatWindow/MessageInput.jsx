import React, { useState, useEffect } from 'react';
import EmojiPicker from '../../EmojiPicker';


const MessageInput = ({ 
  messageText, 
  setMessageText, 
  handleSubmit, 
  handleAttachmentChange, 
  attachmentPreview, 
  removeAttachment,
  conversation,
  currentUser,
  attachment
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleInputChange = (e) => {
    setMessageText(e.target.value);
    if (conversation && currentUser) {
      connectionManager.sendTypingIndicator && connectionManager.sendTypingIndicator(conversation.id);
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessageText(prev => prev + (emoji.native || ''));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="message-input-area">
      {attachmentPreview && (
        <div className="attachment-preview">
          <img src={attachmentPreview} alt="Aperçu de la pièce jointe" />
          <button 
            type="button" 
            className="remove-attachment"
            onClick={removeAttachment}
          >
            <lord-icon
    src="https://cdn.lordicon.com/nqtddedc.json"
    trigger="hover"
    colors="primary:#c71f16"
    style={{width:'30px',height:'30px'}}>
</lord-icon>
          </button>
        </div>
      )}

      <div className="input-container">
        <div className="input-wrapper">
          <input
            type="text"
            value={messageText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Écrivez un message..."
            className="message-input"
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={!messageText.trim() && !attachment}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 2L11 13"></path>
              <path d="M22 2l-7 20-4-9-9-4 20-7z"></path>
            </svg>
          </button>
        </div>
        
        <div className="input-actions">
          <EmojiPicker onSelect={handleEmojiSelect} show={showEmojiPicker} setShow={setShowEmojiPicker} />
          <label className="attachment-button">
            <input
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              onChange={handleAttachmentChange}
            />
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          </label>
        </div>
      </div>
    </form>
  );
};

export default MessageInput;