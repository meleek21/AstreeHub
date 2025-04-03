import React, { useState, useRef } from 'react';

const MessageInput = ({ onSendMessage, onTyping }) => {
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const handleMessageChange = (e) => {
    setMessage(e.target.value);
    
    // Trigger typing indicator
    if (onTyping) {
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Only trigger if there's actual content
      if (e.target.value.trim()) {
        onTyping();
        
        // Set a new timeout
        typingTimeoutRef.current = setTimeout(() => {
          typingTimeoutRef.current = null;
        }, 2000);
      }
    }
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if ((!message.trim() && !attachment) || isUploading) return;
    
    let attachmentUrl = null;
    
    if (attachment) {
      try {
        setIsUploading(true);
        
        // Create form data for file upload
        const formData = new FormData();
        formData.append('file', attachment);
        
        // Upload file to server
        const response = await fetch('/api/cloudinary/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Failed to upload file');
        }
        
        const data = await response.json();
        attachmentUrl = data.url;
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Failed to upload file. Please try again.');
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }
    
    // Send message
    onSendMessage(message, attachmentUrl);
    
    // Reset form
    setMessage('');
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };
  
  const handleRemoveAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="message-input-container">
      {attachment && (
        <div className="attachment-preview">
          <span>{attachment.name}</span>
          <button 
            type="button" 
            className="remove-attachment-button"
            onClick={handleRemoveAttachment}
          >
            ×
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="message-form">
        <label htmlFor="file-upload" className="file-upload-label">
          <i className="fa fa-paperclip"></i>
        </label>
        <input
          id="file-upload"
          type="file"
          onChange={handleFileChange}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        
        <input
          type="text"
          value={message}
          onChange={handleMessageChange}
          placeholder="Type a message..."
          disabled={isUploading}
        />
        
        <button 
          type="submit" 
          disabled={(!message.trim() && !attachment) || isUploading}
          className="send-button"
        >
          {isUploading ? 'Uploading...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

export default MessageInput;