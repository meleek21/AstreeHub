import React, { createContext, useContext, useState, useCallback } from "react";
import { useNavigate } from 'react-router-dom';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Handler for selecting a conversation - fetches messages and updates state
  const handleSelectConversation = useCallback(async (conversation) => {
    if (!conversation) return;
    
    setLoading(true);
    setSelectedConversation(conversation);
    setMessages([]); // Clear previous messages immediately

    // If this is a temporary conversation, don't try to fetch messages
    if (conversation.isTemporary) {
      setLoading(false);
      return;
    }

    try {
      // Import messagesAPI and connectionManager here to avoid circular dependencies
      const { messagesAPI } = await import('../services/apiServices');
      const connectionManager = await import('../services/connectionManager').then(module => module.default);
      
      // Get the current user from the conversation participants or from auth context
      const currentUserId = conversation.participants.find(p => {
        // Handle both object and string participant formats
        return typeof p === 'object' ? p.id !== (conversation.participants.find(x => x.id !== p.id)?.id) : p;
      })?.id;

      if (!currentUserId || !conversation.id) {
        console.error('Missing user ID or conversation ID');
        setLoading(false);
        return;
      }

      // Update unreadCount for this conversation to 0 in UI
      setConversations(prevConvs => 
        prevConvs.map(conv => conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv)
      );

      // Fetch messages for the conversation
      const response = await messagesAPI.getConversationMessages(conversation.id, currentUserId);
      const fetchedMessages = response.data;
      setMessages(fetchedMessages);

      // Mark fetched messages as read via SignalR
      const unreadMessages = fetchedMessages.filter(msg => !msg.isRead && msg.senderId !== currentUserId);
      if (unreadMessages.length > 0) {
        console.log(`Marking ${unreadMessages.length} messages as read for conversation ${conversation.id}`);
        await Promise.all(
          unreadMessages.map(msg =>
            connectionManager.markMessageAsRead(msg.id)
              .catch(err => console.error(`Failed to mark message ${msg.id} as read via SignalR:`, err))
          )
        );
        
        // Optimistically update local state
        setMessages(prev => prev.map(msg =>
          unreadMessages.some(unread => unread.id === msg.id) ? { ...msg, isRead: true } : msg
        ));
      }
    } catch (error) {
      console.error('Error fetching conversation messages:', error);
    } finally {
      setLoading(false);
    }
  }, [setSelectedConversation, setMessages, setLoading, setConversations]);

  const value = {
    conversations,
    setConversations,
    selectedConversation,
    setSelectedConversation,
    messages,
    setMessages,
    loading,
    setLoading,
    unreadCount,
    setUnreadCount,
    selectedEmployee,
    setSelectedEmployee,
    handleSelectConversation,
    handleSelectEmployee: async (employee, currentUser) => {
      setSelectedEmployee(employee);
      // Check if a conversation already exists with this employee
      const existingConversation = conversations.find(conv => {
        if (conv.isGroup) return false;
        // Check if the employee is a participant in this conversation
        return conv.participants.some(p => {
          // Compare IDs directly, handling both string and object formats
          const participantId = typeof p === 'object' ? p.id : p;
          const employeeId = typeof employee === 'object' ? employee.id : employee;
          return participantId === employeeId;
        });
      });
      
      // Navigate to the messages page
      navigate('/messages');
      
      if (existingConversation) {
        console.log('Found existing conversation:', existingConversation);
        // If conversation exists, select it
        handleSelectConversation(existingConversation);
      } else {
        console.log('Creating temporary conversation with:', employee);
        // If no conversation exists, create a temporary conversation object
        const tempConversation = {
          id: `temp-${employee.id}`,
          participants: [employee, currentUser],
          isTemporary: true,
          isGroup: false,
          lastMessage: null,
          unreadCount: 0
        };
        setSelectedConversation(tempConversation);
        setMessages([]);
      }
    },
    // handlers will be added in the next step
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};