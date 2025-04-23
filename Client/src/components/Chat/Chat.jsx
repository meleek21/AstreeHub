import React, { useState, useEffect, useContext } from 'react';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import EmployeeList from './EmployeeList';
import { AuthContext } from '../../Context/AuthContext';
import '../../assets/Css/Chat.css';
import connectionManager from '../../services/connectionManager';
import { messagesAPI } from '../../services/apiServices';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import '../../assets/Css/Chat.css';

const Chat = () => {
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const { onlineUsers } = useOnlineStatus();
  const [signalRConnected, setSignalRConnected] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const currentUserId = localStorage.getItem('userId');
  
  useEffect(() => {
    const initializeChat = async () => {
      try {
        await connectionManager.start();
        setSignalRConnected(true);
        console.log('Chat component mounted, SignalR initialized.');
      } catch (error) {
        console.error('Failed to initialize SignalR in Chat component:', error);
        setSignalRConnected(false);
      }
    };
    
    initializeChat();
    
    // Add state change listener
    connectionManager.addStateListener((state) => {
      setSignalRConnected(state === 'Connected');
    });
    
    return () => {
      connectionManager.stop();
      console.log('Chat component unmounted, SignalR stopped.');
    };
  }, []);
  
  const handleSelectConversation = (conversationId) => {
    setSelectedConversationId(conversationId);
  };
  
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  const handleSelectEmployee = async (employee) => {
    try {
      setSelectedEmployee(employee);
      
      try {
        const response = await messagesAPI.getOrCreateConversationWithUser(employee.id);
        
        if (response && response.data && response.data.id) {
          setSelectedConversationId(response.data.id);
          return;
        }
      } catch (error) {
        if (error.response && error.response.status === 404) {
          console.log('No existing conversation with this user');
        } else {
          throw error;
        }
      }
      
      setSelectedConversationId(null);
    } catch (error) {
      console.error('Error handling employee selection:', error);
    }
  };
  
  const handleCreateGroup = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowCreateGroupModal(true);
  };
  
  const handleGroupCreated = (newGroup) => {
    setSelectedConversationId(newGroup.id);
    setShowCreateGroupModal(false);
  };
  
  return (
    <>
      <EmployeeList 
        onSelectEmployee={handleSelectEmployee}
        selectedEmployee={selectedEmployee}
      />
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
          selectedEmployee={selectedEmployee}
          signalRConnected={signalRConnected} // Pass the prop here
        />
      </div>
    </>
  );
};

export default Chat;
