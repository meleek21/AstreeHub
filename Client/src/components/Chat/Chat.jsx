import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import EmployeeList from './EmployeeList';
import chatSignalRService from '../../services/chatSignalRService';
import { messagesAPI } from '../../services/apiServices';
import useOnlineStatus from '../../hooks/useOnlineStatus';

const Chat = () => {
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  // Using the centralized online status context instead of local state
  const { onlineUsers } = useOnlineStatus();
  const [signalRConnected, setSignalRConnected] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const currentUserId = localStorage.getItem('userId');
  
  useEffect(() => {
    // Initialize SignalR connection
    const initializeSignalR = async () => {
      try {
        // No need to handle online/offline status here anymore
        // It's now managed by the OnlineStatusContext
        
        await chatSignalRService.initialize();
        setSignalRConnected(true);
      } catch (error) {
        console.error('Error initializing SignalR for chat:', error);
        setSignalRConnected(false);
      }
    };
    
    initializeSignalR();
    
    return () => {
      // Clean up connection
      chatSignalRService.stop();
    };
  }, []);
  
  const handleSelectConversation = (conversationId) => {
    setSelectedConversationId(conversationId);
  };
  
  const handleSelectEmployee = async (employee) => {
    try {
      // Use the new API method to get or create a conversation with this employee
      const response = await messagesAPI.getOrCreateConversationWithUser(employee.id);
      
      // If we got a valid response with an ID, select the conversation
      if (response && response.data && response.data.id) {
        setSelectedConversationId(response.data.id);
      } else {
        console.error('Failed to get/create conversation: Invalid response format');
      }
    } catch (error) {
      console.error('Error handling employee selection:', error);
    }
  };
  
  const handleCreateGroup = (e) => {
    e.preventDefault(); // Prevent default button behavior
    e.stopPropagation(); // Stop event propagation
    setShowCreateGroupModal(true);
  };
  
  const handleGroupCreated = (newGroup) => {
    setSelectedConversationId(newGroup.id);
    setShowCreateGroupModal(false);
  };
  
  return (
    <div className="chat-container">
      <ConversationList 
        onSelectConversation={handleSelectConversation}
        selectedConversationId={selectedConversationId}
        onCreateGroup={handleCreateGroup}
        showCreateGroupModal={showCreateGroupModal}
        setShowCreateGroupModal={setShowCreateGroupModal}
        onGroupCreated={handleGroupCreated}
      />
      <ChatWindow 
        conversationId={selectedConversationId}
      />
      <EmployeeList 
        onSelectEmployee={handleSelectEmployee}
      />
    </div>
  );
};

export default Chat;
