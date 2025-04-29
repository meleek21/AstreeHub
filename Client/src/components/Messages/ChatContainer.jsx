import React, { useState, useEffect } from 'react';
import { messagesAPI } from '../../services/apiServices';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import '../../assets/Css/Chat.css';
import {useAuth} from '../../Context/AuthContext';
import connectionManager from '../../services/connectionManager';

const ChatContainer = () => {
  const { user: currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser || !currentUser.id) return;
    fetchConversations();
    fetchUnreadCount();
    // Subscribe to real-time message events
    connectionManager.onReceiveMessage((message) => {
      // Only update if the message belongs to the selected conversation
      setMessages(prevMessages => {
        if (selectedConversation && message.conversationId === selectedConversation.id) {
          return [...prevMessages, message];
        }
        return prevMessages;
      });
      // Optionally, refresh conversations/unread count
      fetchConversations();
      fetchUnreadCount();
    });
    return () => {
      connectionManager.offReceiveMessage && connectionManager.offReceiveMessage();
    };
  }, [currentUser && currentUser.id, selectedConversation]);

  const fetchConversations = async () => {
    if (!currentUser || !currentUser.id) return;
    try {
      const response = await messagesAPI.getUserConversations(currentUser.id);
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchUnreadCount = async () => {
    if (!currentUser || !currentUser.id) return;
    try {
      const response = await messagesAPI.getUnreadMessagesCount(currentUser.id);
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleSelectConversation = async (conversation) => {
    if (!currentUser || !currentUser.id) return;
    setLoading(true);
    setSelectedConversation(conversation);
    // Immediately update unreadCount for this conversation to 0 in UI
    setConversations(prevConvs => prevConvs.map(conv => conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv));
    try {
      const response = await messagesAPI.getConversationMessages(
        conversation.id,
        currentUser.id
      );
      setMessages(response.data);
      // Mark messages as read
      await Promise.all(
        response.data
          .filter(msg => !msg.isRead && msg.senderId !== currentUser.id)
          .map(msg => messagesAPI.markMessageAsRead(msg.id, {
            MessageId: msg.id,
            IsRead: true,
            UserId: currentUser.id
          }))
      );
      // Update local messages state with read status
      setMessages(prev => prev.map(msg => ({
        ...msg,
        isRead: msg.senderId !== currentUser.id ? true : msg.isRead
      })));
      fetchUnreadCount();
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (messageText, attachment) => {
    if (!selectedConversation || !currentUser || !currentUser.id) return;
    let attachmentUrl = null;
    if (attachment) {
      try {
        const formData = new FormData();
        formData.append('file', attachment);
        const response = await messagesAPI.uploadMessageAttachment(formData);
        attachmentUrl = response.data.fileUrl || response.data.FileUrl;
      } catch (error) {
        console.error('Attachment upload failed:', error);
        alert('Failed to upload attachment.');
        return;
      }
    }
    const newMessage = {
      content: messageText.trim(),
      conversationId: selectedConversation.id,
      userId: currentUser.id,
      attachmentUrl
    };
    console.log('Sending message:', newMessage);
    if (!newMessage.conversationId || !newMessage.userId || (!newMessage.content && !newMessage.attachmentUrl)) {
      alert('Missing required fields');
      return;
    }
    console.log('Sending message payload:', JSON.stringify(newMessage, null, 2));
    try {
      const response = await messagesAPI.sendMessage(newMessage)
      .catch(error => {
        console.error('Detailed error:', {
          config: error.config,
          response: error.response?.data
        });
        throw error;
      });
      setMessages(prev => [...prev, response.data]);
    } catch (error) {
      alert('Failed to send message');
    }
  };

  // Handler for editing a message
const handleEditMessage = async (messageId, messageData) => {
  try {
    await messagesAPI.editMessage(messageId, messageData);
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, content: messageData.content, isEdited: true } : m
    ));
  } catch (error) {
    alert('Failed to edit message');
  }
};

// Handler for unsending a message
const handleUnsendMessage = async (messageId, userId) => {
  if (!window.confirm('Are you sure you want to unsend this message?')) return;
  try {
    await messagesAPI.unsendMessage(messageId, userId);
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, isUnsent: true } : m
    ));
  } catch (error) {
    console.error('Error unsending message:', error);
    alert('Failed to unsend message. Please try again later.');
  }
};

// Handler for soft deleting a message
const handleSoftDeleteMessage = async (messageId, userId) => {
  if (!window.confirm('Delete this message for you?')) return;
  try {
    await messagesAPI.softDeleteMessage(messageId, userId);
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, deletedForUsers: [...(m.deletedForUsers || []), userId] } : m
    ));
  } catch (error) {
    console.error('Error deleting message:', error);
    alert('Failed to delete message. Please try again later.');
  }
};

  return (
    <div className="chat-container">
      <ConversationList 
        conversations={conversations}
        unreadCount={unreadCount}
        currentUser={currentUser}
        onSelectConversation={handleSelectConversation}
      />
      <ChatWindow
        conversation={selectedConversation}
        messages={messages}
        loading={loading}
        currentUser={currentUser}
        onSendMessage={handleSendMessage}
        onEditMessage={handleEditMessage}
        onUnsendMessage={handleUnsendMessage}
        onSoftDeleteMessage={handleSoftDeleteMessage}
      />
    </div>
  );
};

export default ChatContainer;