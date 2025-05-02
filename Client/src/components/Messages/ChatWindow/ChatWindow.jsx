import React, { useEffect, useRef, useState } from 'react';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import EmptyState from './EmptyState';
import connectionManager from '../../../services/connectionManager';
import '../../../assets/Css/ChatWindow.css';
const ChatWindow = ({ 
  conversation, 
  messages = [], 
  loading, 
  currentUser, 
  onSendMessage,
  onEditMessage,
  onUnsendMessage,
  onSoftDeleteMessage,
  onSoftDeleteConversation
}) => {
  const [messageText, setMessageText] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [typingUsers, setTypingUsers] = useState([]);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const typingTimeouts = useRef({});
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!conversation) return;
    
    const handleTyping = ({ userId, conversationId }) => {
      if (conversationId === conversation.id && userId !== currentUser.id) {
        setTypingUsers(prev => {
          if (!prev.includes(userId)) return [...prev, userId];
          return prev;
        });
        
        if (typingTimeouts.current[userId]) clearTimeout(typingTimeouts.current[userId]);
        typingTimeouts.current[userId] = setTimeout(() => {
          setTypingUsers(prev => prev.filter(id => id !== userId));
        }, 2500);
      }
    };

    connectionManager.onUserTyping(handleTyping);
    
    return () => {
      Object.values(typingTimeouts.current).forEach(clearTimeout);
      typingTimeouts.current = {};
      connectionManager.offUserTyping && connectionManager.offUserTyping(handleTyping);
    };
  }, [conversation, currentUser]);

  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setAttachment(file);
    
    if (file.type.match('image.*')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachmentPreview(event.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview(null);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (messageText.trim() === '' && !attachment) return;
    onSendMessage(messageText, attachment);
    setMessageText('');
    setAttachment(null);
    setAttachmentPreview(null);
  };

  if (!conversation) {
    return <EmptyState />;
  }

  return (
    <div className="chat-window">
      <ChatHeader 
        conversation={conversation}
        currentUser={currentUser}
        typingUsers={typingUsers}
        onSoftDeleteConversation={onSoftDeleteConversation}
        showGroupMenu={showGroupMenu}
        setShowGroupMenu={setShowGroupMenu}
        refreshConversations={typeof onSoftDeleteConversation === 'function' ? onSoftDeleteConversation : () => {}}
      />

      <div className="messages-container" ref={messagesContainerRef}>
        {loading ? (
          <div className="loading-messages">
            <div className="spinner"></div>
            <span>Chargement des messages...</span>
          </div>
        ) : (
          <MessageList 
            messages={messages}
            currentUser={currentUser}
            conversation={conversation}
            onEditMessage={onEditMessage}
            onUnsendMessage={onUnsendMessage}
            onSoftDeleteMessage={onSoftDeleteMessage}
          />
        )}
        <div ref={messagesEndRef} />
      </div>

      <MessageInput 
        messageText={messageText}
        setMessageText={setMessageText}
        handleSubmit={handleSubmit}
        handleAttachmentChange={handleAttachmentChange}
        attachmentPreview={attachmentPreview}
        removeAttachment={removeAttachment}
        conversation={conversation}
        currentUser={currentUser}
        attachment={attachment}
      />
    </div>
  );
};

export default ChatWindow;