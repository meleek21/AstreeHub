import React, { useState, useEffect } from 'react';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import chatSignalRService from '../../services/chatSignalRService';

const Chat = () => {
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [signalRConnected, setSignalRConnected] = useState(false);
  
  useEffect(() => {
    // Initialize SignalR connection
    const initializeSignalR = async () => {
      try {
        // Handle online/offline status
        chatSignalRService.onUserOnline((userId) => {
          setOnlineUsers(prev => [...prev, userId]);
          setSignalRConnected(true);
        });
        
        chatSignalRService.onUserOffline((userId) => {
          setOnlineUsers(prev => prev.filter(id => id !== userId));
        });
        
        await chatSignalRService.initialize();
        setSignalRConnected(true);
      } catch (error) {
        console.error('Error initializing SignalR for chat:', error);
        setSignalRConnected(false);
      }
    };
    
    initializeSignalR();
    
    return () => {
      // Clean up event handlers
      chatSignalRService.onUserOnline(null);
      chatSignalRService.onUserOffline(null);
      chatSignalRService.stop();
    };
  }, []);
  
  const handleSelectConversation = (conversationId) => {
    setSelectedConversationId(conversationId);
  };
  
  return (
    <div className="chat-container">
      <ConversationList 
        onSelectConversation={handleSelectConversation}
        selectedConversationId={selectedConversationId}
        onlineUsers={onlineUsers}
      />
      <ChatWindow 
        conversationId={selectedConversationId}
        onlineUsers={onlineUsers}
      />
    </div>
  );
};

export default Chat;