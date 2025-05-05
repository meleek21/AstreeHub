import React, { useState, useEffect, useRef, useCallback } from 'react';
import EmojiPicker from '../../EmojiPicker';
import connectionManager from '../../../services/connectionManager'; // Import connectionManager
import { debounce } from 'lodash'; // Import debounce

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
  const typingTimeoutRef = useRef(null); // Ref to store timeout ID

  // Debounced function to send typing indicator
  const sendTypingIndicatorDebounced = useCallback(
    debounce((convId) => {
      if (convId) {
        connectionManager.sendTypingIndicator(convId)
          .catch(err => console.error("Failed to send typing indicator:", err));
      }
    }, 500), // Send indicator after 500ms of inactivity
    [] // Empty dependency array ensures the debounced function is created only once
  );

  const handleInputChange = (e) => {
    const newText = e.target.value;
    setMessageText(newText);

    // Send typing indicator if text is not empty and conversation exists
    if (newText.trim() && conversation && currentUser) {
      sendTypingIndicatorDebounced(conversation.id);
    }

    // Clear previous timeout if user continues typing
    // if (typingTimeoutRef.current) {
    //   clearTimeout(typingTimeoutRef.current);
    // }

    // Set a new timeout to potentially send a 'stop typing' event later if needed
    // Note: The current setup relies on the receiver's timeout to clear the indicator
    // typingTimeoutRef.current = setTimeout(() => {
    //   // Optionally send a 'stop typing' event if the backend supports it
    //   // connectionManager.stopTypingIndicator(conversation.id);
    // }, 3000); // Example: stop after 3 seconds of inactivity
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Cancel any pending debounced calls on unmount
      sendTypingIndicatorDebounced.cancel();
    };
  }, [sendTypingIndicatorDebounced]);

  const handleEmojiSelect = (emoji) => {
    setMessageText(prev => prev + (emoji.native || ''));
    // Trigger typing indicator when emoji is added
    if (conversation && currentUser) {
      sendTypingIndicatorDebounced(conversation.id);
    }
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
            onChange={handleInputChange} // Use updated handler
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