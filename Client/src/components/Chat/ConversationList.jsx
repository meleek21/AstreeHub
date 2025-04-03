import React, { useState, useEffect } from 'react';
import { messagesAPI } from '../../services/apiServices';
import chatSignalRService from '../../services/chatSignalRService';

const ConversationList = ({ onSelectConversation, selectedConversationId, onlineUsers }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const currentUserId = localStorage.getItem('userId');
  
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await messagesAPI.getUserConversations();
        setConversations(response.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching conversations:', error);
        setLoading(false);
      }
    };
    
    fetchConversations();
    
    // Set up SignalR event handlers for conversation updates
    const handleNewMessage = (message) => {
      setConversations(prevConversations => {
        // Find the conversation this message belongs to
        const conversationIndex = prevConversations.findIndex(
          conv => conv.id === message.conversationId
        );
        
        if (conversationIndex === -1) {
          // If this is a new conversation, fetch all conversations again
          fetchConversations();
          return prevConversations;
        }
        
        // Update the conversation with the new message
        const updatedConversations = [...prevConversations];
        const conversation = { ...updatedConversations[conversationIndex] };
        
        // Update last message
        conversation.lastMessage = message;
        
        // Update unread count if the message is not from current user
        if (message.senderId !== currentUserId) {
          conversation.unreadCount = (conversation.unreadCount || 0) + 1;
        }
        
        // Update the conversation
        updatedConversations[conversationIndex] = conversation;
        
        // Sort conversations by last message timestamp
        return updatedConversations.sort((a, b) => {
          const dateA = a.lastMessage ? new Date(a.lastMessage.timestamp) : new Date(a.updatedAt);
          const dateB = b.lastMessage ? new Date(b.lastMessage.timestamp) : new Date(b.updatedAt);
          return dateB - dateA;
        });
      });
    };
    
    const handleMessageRead = (messageId, userId) => {
      if (userId === currentUserId) {
        setConversations(prevConversations => {
          return prevConversations.map(conv => {
            if (conv.lastMessage && conv.lastMessage.id === messageId) {
              return {
                ...conv,
                lastMessage: {
                  ...conv.lastMessage,
                  isRead: true,
                  readAt: new Date()
                }
              };
            }
            return conv;
          });
        });
      }
    };
    
    chatSignalRService.connection?.on('ReceiveMessage', handleNewMessage);
    chatSignalRService.connection?.on('MessageRead', handleMessageRead);
    
    return () => {
      chatSignalRService.connection?.off('ReceiveMessage', handleNewMessage);
      chatSignalRService.connection?.off('MessageRead', handleMessageRead);
    };
  }, [currentUserId]);
  
  const getConversationName = (conversation) => {
    if (conversation.isGroup) {
      return conversation.title;
    }
    
    const otherParticipant = conversation.participants.find(
      p => p.id !== currentUserId
    );
    
    return otherParticipant ? otherParticipant.name : 'Unknown User';
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
  
  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };
  
  const getParticipantStatus = (conversation) => {
    if (conversation.isGroup) return null;
    
    const otherParticipant = conversation.participants.find(
      p => p.id !== currentUserId
    );
    
    if (!otherParticipant) return null;
    
    return isUserOnline(otherParticipant.id);
  };
  
  const filteredConversations = conversations?.filter(conversation => {
    if (!conversation) return false;
    const name = getConversationName(conversation)?.toLowerCase() || '';
    return name.includes(searchTerm.toLowerCase());
  }) || [];
  
  if (loading) {
    return (
      <div className="user-list">
        <h2>Conversations</h2>
        <div className="loading-message">Loading conversations...</div>
      </div>
    );
  }
  
  return (
    <div className="user-list">
      <h2>Conversations</h2>
      
      <div className="search-container">
        <input
          type="text"
          placeholder="Search conversations..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      
      {filteredConversations.length === 0 ? (
        <div className="empty-list">No conversations found</div>
      ) : (
        filteredConversations.map(conversation => {
          const isSelected = selectedConversationId === conversation.id;
          const isOnline = getParticipantStatus(conversation);
          const lastMessageTime = conversation.lastMessage 
            ? formatTimestamp(conversation.lastMessage.timestamp)
            : formatTimestamp(conversation.updatedAt);
          
          return (
            <div 
              key={conversation.id} 
              className={`user-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <div className="conversation-info">
                <div className="conversation-header">
                  <p className="conversation-name">{getConversationName(conversation)}</p>
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