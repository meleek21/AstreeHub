import React, { useState, useEffect, useCallback, useContext } from 'react';
import { List, ListItem, ListItemText, ListItemAvatar, Avatar, Typography, Badge, Box } from '@mui/material';

import connectionManager from '../../services/connectionManager'; // Updated import
// Removed unused fetchConversations import
import { AuthContext } from '../../Context/AuthContext';
import { messagesAPI } from '../../services/apiServices';
import CreateGroupChat from './CreateGroupChat';
import useOnlineStatus from '../../hooks/useOnlineStatus'; // Removed duplicate import

const ConversationList = ({ 
  onSelectConversation, 
  selectedConversationId, 
  onCreateGroup,
  showCreateGroupModal,
  setShowCreateGroupModal,
  onGroupCreated
}) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const currentUserId = localStorage.getItem('userId');
  
  const fetchInitialConversations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await messagesAPI.getUserConversations();
      console.log('Fetched conversations:', response.data);
      // Sort conversations initially by last message timestamp or updated time
      const sortedConversations = response.data.sort((a, b) => {
        const dateA = a.lastMessage ? new Date(a.lastMessage.timestamp) : new Date(a.updatedAt);
        const dateB = b.lastMessage ? new Date(b.lastMessage.timestamp) : new Date(b.updatedAt);
        return dateB - dateA;
      });
      setConversations(sortedConversations);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    }
  }, []);

  // Consolidated useEffect for fetching and SignalR handling
  useEffect(() => {
    fetchInitialConversations();
    
    // Define handlers within useEffect or ensure they are stable
    const handleNewMessage = (message) => {
      setConversations(prevConversations => {
        const conversationIndex = prevConversations.findIndex(
          conv => conv.id === message.conversationId
        );
        
        if (conversationIndex === -1) {
          // If this is a new conversation, fetch all conversations again
          console.log('New conversation detected, fetching all conversations.');
          fetchInitialConversations(); // Corrected: Call the defined fetch function
          return prevConversations; // Return current state until fetch completes
        }
        
        const updatedConversations = [...prevConversations];
        const conversation = { ...updatedConversations[conversationIndex] };
        
        conversation.lastMessage = message;
        
        if (message.senderId !== currentUserId && conversation.id !== selectedConversationId) {
          conversation.unreadCount = (conversation.unreadCount || 0) + 1;
        }
        
        updatedConversations[conversationIndex] = conversation;
        
        return updatedConversations.sort((a, b) => {
          const dateA = a.lastMessage ? new Date(a.lastMessage.timestamp) : new Date(a.updatedAt);
          const dateB = b.lastMessage ? new Date(b.lastMessage.timestamp) : new Date(b.updatedAt);
          return dateB - dateA;
        });
      });
    };
    
    const handleMessageRead = (messageId, readerUserId) => {
      // Update the read status for the specific message across conversations
      // This might affect the 'isRead' status visually if displayed
      setConversations(prevConversations => 
        prevConversations.map(conv => {
          if (conv.lastMessage && conv.lastMessage.id === messageId) {
            // Check if the reader is the current user to potentially update UI elements
            // specific to the current user's view, like read receipts they sent.
            // However, the primary goal is usually to reflect that *someone* read it.
            // If the backend sends 'isRead' updates based on any participant reading,
            // we just update the message state.
            return {
              ...conv,
              lastMessage: {
                ...conv.lastMessage,
                isRead: true, // Mark as read
                // Optionally store who read it and when, if needed
                // readBy: [...(conv.lastMessage.readBy || []), readerUserId],
                // readAt: new Date()
              }
            };
          }
          // Also reset unread count if the message read belongs to the currently selected conversation
          // and the reader is the current user.
          if (conv.id === selectedConversationId && readerUserId === currentUserId) {
             return { ...conv, unreadCount: 0 };
          }
          return conv;
        })
      );
    };

    // Register handlers using connectionManager
    connectionManager.onReceiveMessage(handleNewMessage);
    connectionManager.onMessageRead(handleMessageRead);

    // Cleanup function
    return () => {
      // Unregister handlers
      connectionManager.offReceiveMessage(handleNewMessage); // Use specific off methods if available
      connectionManager.offMessageRead(handleMessageRead);   // Assuming off methods exist, else use null if that's the pattern
    };
  // Dependencies: fetchInitialConversations runs once, currentUserId ensures handlers use correct ID
  // selectedConversationId is added to handle unread count updates correctly within handleNewMessage/handleMessageRead
  }, [fetchInitialConversations, currentUserId, selectedConversationId]); 

  // Function to handle selecting a conversation
  const handleSelectConversation = (conversationId) => {
    onSelectConversation(conversationId);
    // Reset unread count locally when conversation is selected
    setConversations(prev => prev.map(c => 
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    ));
  };

  // Function to get conversation name
  const getConversationName = (conversation) => {
    if (!conversation) return 'Unknown';
       
    // Use the title field that's already set by the backend
    if (conversation.title) {
      return conversation.title;
    }
    
    // Fallback logic in case title is not set
    if (conversation.isGroup) {
      return 'Group Chat';
    }

    // For 1-on-1 chats, find the other participant
    const otherParticipant = conversation.participants?.find(p => p.id !== currentUserId);
    return otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : 'Unknown User';
  };
  
  const getLastMessagePreview = (conversation) => {
    if (!conversation.lastMessage) {
      return 'No messages yet';
    }
    
    const { content, senderId, attachmentUrl } = conversation.lastMessage;
    const isSentByMe = senderId === currentUserId;
    const prefix = isSentByMe ? 'You: ' : '';
    
    if (attachmentUrl) {
      return `${prefix}${content || 'Sent an attachment'}`;
    }
    
    return `${prefix}${content}`;
  };
  
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Today: show time
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffDays < 7) {
      // This week: show day name
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      // Older: show date
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };
  
  // Use the centralized online status hook
  const { isUserOnline } = useOnlineStatus();
  
  const getParticipantStatus = (conversation) => {
    if (conversation.isGroup) return null;
    
    const otherParticipant = conversation.participants.find(
      p => p.id !== currentUserId
    );
    
    if (!otherParticipant) return null;
    
    // Return a string status instead of a boolean
    return isUserOnline(otherParticipant.id) ? 'Online' : 'Offline';
  };
  
  const filteredConversations = conversations?.filter(conversation => {
    if (!conversation) return false; // Ensure conversation object exists
    const name = getConversationName(conversation)?.toLowerCase() || ''; // Get name safely
    const lastMessageContent = conversation.lastMessage?.content?.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    // Search in name or last message content
    return name.includes(searchLower) || lastMessageContent.includes(searchLower);
  }) || [];
  
  if (loading) {
    return (
      <div className="user-list">
        <div className="conversation-header-container">
          <h2>Conversations</h2>
        </div>
        <div className="loading-message">Loading conversations...</div>
      </div>
    );
  }
  
  return (
    <div className="user-list">
      <div className="conversation-header-container">
        <h2>Conversations</h2>
      </div>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <button 
          className="create-group-button" 
          onClick={onCreateGroup}
          aria-label="Create Group Chat"
        >
          <span className="create-group-button-icon">+</span>
          <span className="create-group-button-text">New Group</span>
        </button>
      </div>
      
      {/* Create Group Chat Modal */}
      {showCreateGroupModal && (
        <CreateGroupChat 
          isOpen={showCreateGroupModal} 
          onClose={() => setShowCreateGroupModal(false)}
          onGroupCreated={onGroupCreated}
        />
      )}
      
      {filteredConversations.length === 0 ? (
        <div className="empty-list">No conversations found</div>
      ) : (
        filteredConversations.map(conversation => {
          const isSelected = selectedConversationId === conversation.id;
          const isOnline = getParticipantStatus(conversation);
          const lastMessageTime = conversation.lastMessage 
            ? formatTimestamp(conversation.lastMessage.timestamp)
            : formatTimestamp(conversation.updatedAt);
          
          // Get the conversation name (other recipient's name)
          const conversationName = getConversationName(conversation);
          
          return (
            <div 
              key={conversation.id} 
              className={`user-item ${isSelected ? 'selected' : ''}`}
              onClick={() => handleSelectConversation(conversation.id)} // Corrected call to use the internal handler
            >
              <div className="conversation-info">
                <div className="conversation-header">
                  <p className="conversation-name">{conversationName}</p>
                  {isOnline !== null && (
                    <span className={`status-indicator ${isOnline ? 'online' : 'offline'}`} />
                  )}
                </div>
                
                <p className="last-message">{getLastMessagePreview(conversation)}</p>
              </div>
              
              <div className="conversation-meta">
                <span className="timestamp">{lastMessageTime}</span>
                {conversation.unreadCount > 0 && (
                  <span className="unread-badge">{conversation.unreadCount}</span>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
};

export default ConversationList;