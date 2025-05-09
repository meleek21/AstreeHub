import React, { useState, useEffect, useCallback } from 'react';
import { messagesAPI } from '../../services/apiServices';
import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow/ChatWindow';
import ChatSidebar from './ChatSidebar';
import '../../assets/Css/Chat.css';
import {useAuth} from '../../Context/AuthContext';
import connectionManager from '../../services/connectionManager';
import ConfirmationModal from '../ConfirmationModal';
import { useChat } from '../../Context/ChatContext';

const ChatContainer = () => {
  const { conversations, setConversations, selectedConversation, setSelectedConversation, messages, setMessages, loading, setLoading, unreadCount, setUnreadCount, selectedEmployee, setSelectedEmployee } = useChat();
  const { user: currentUser } = useAuth();
  const [confirmModal, setConfirmModal] = useState({ open: false, onConfirm: null, title: '', message: '' });
  

  const fetchConversations = useCallback(async () => {
    if (!currentUser || !currentUser.id) return;
    try {
      const response = await messagesAPI.getUserConversations(currentUser.id);
      setConversations(response.data);
    } catch (error) {
      console.error('Erreur lors de la récupération des conversations :', error);
    }
  }, [currentUser]);

  const fetchUnreadCount = useCallback(async () => {
    if (!currentUser || !currentUser.id) return;
    try {
      const response = await messagesAPI.getUnreadMessagesCount(currentUser.id);
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Erreur lors de la récupération du nombre de messages non lus :', error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !currentUser.id) return;

    fetchConversations();
    fetchUnreadCount();

    const handleReceiveMessage = (message) => {
      console.log('Received message:', message);
      if (selectedConversation && message.conversationId === selectedConversation.id) {
        setMessages(prevMessages => [...prevMessages, message]);
        // If the current user received a message in the open chat, mark it as read immediately
        if (message.senderId !== currentUser.id) {
          connectionManager.markMessageAsRead(message.id).catch(err => console.error("Failed to mark message as read on receive:", err));
        }
      } else {
        // Update conversation list for the non-selected conversation
        setConversations(prevConvs => prevConvs.map(conv =>
          conv.id === message.conversationId
            ? { ...conv, lastMessage: message.content, unreadCount: (conv.unreadCount || 0) + 1 }
            : conv
        ));
        fetchUnreadCount(); // Refresh total unread count
      }
    };

    const handleMessageRead = (messageId, readerUserId) => {
      console.log(`Message ${messageId} read by ${readerUserId}`);
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
      // Optionally update conversation list if needed, though typically handled on selection
      fetchUnreadCount(); // Ensure total count is accurate
    };

    const handleMessageEdited = (messageId, updatedContent) => {
      console.log(`Message ${messageId} edited`);
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId ? { ...msg, content: updatedContent, isEdited: true } : msg
        )
      );
      // Update last message in conversation list if it was the edited one
      setConversations(prevConvs => prevConvs.map(conv => {
        if (conv.lastMessageId === messageId) {
          return { ...conv, lastMessage: updatedContent };
        }
        return conv;
      }));
    };

    const handleMessageUnsent = (messageId) => {
      console.log(`Message ${messageId} unsent`);
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId ? { ...msg, content: 'Message unsent', isUnsent: true, attachmentUrl: null } : msg
        )
      );
       // Update last message in conversation list if it was the unsent one
       setConversations(prevConvs => prevConvs.map(conv => {
        if (conv.lastMessageId === messageId) {
          // Fetch previous message or set a placeholder
          // This might require an API call or more complex logic
          return { ...conv, lastMessage: 'Message unsent' };
        }
        return conv;
      }));
    };

    const handleMessageDeleted = (messageId, deletedByUserId) => {
      console.log(`Message ${messageId} deleted by ${deletedByUserId}`);
      // Only remove from view if the current user deleted it for themselves
      if (deletedByUserId === currentUser.id) {
        setMessages(prevMessages =>
          prevMessages.map(msg =>
            msg.id === messageId ? { ...msg, deletedForUsers: [...(msg.deletedForUsers || []), deletedByUserId] } : msg
          )
        );
      }
      // Note: No broadcast for soft delete, this handler might only be needed if
      // the backend *did* broadcast, or if the confirmation modal directly updated state.
      // The current implementation relies on the caller getting confirmation.
    };

    // Subscribe to SignalR events
    connectionManager.onReceiveMessage(handleReceiveMessage);
    connectionManager.onMessageRead(handleMessageRead);
    connectionManager.onMessageEdited(handleMessageEdited);
    connectionManager.onMessageUnsent(handleMessageUnsent);
    connectionManager.onMessageDeleted(handleMessageDeleted); // Listen for confirmation from backend

    // Cleanup function
    return () => {
      connectionManager.offReceiveMessage(handleReceiveMessage);
      connectionManager.offMessageRead(handleMessageRead);
      connectionManager.offMessageEdited(handleMessageEdited);
      connectionManager.offMessageUnsent(handleMessageUnsent);
      connectionManager.offMessageDeleted(handleMessageDeleted);
    };
  }, [currentUser, selectedConversation, fetchConversations, fetchUnreadCount]); // Added dependencies

  // Removed the duplicate useEffect for onReceiveMessage

  const handleSelectConversation = async (conversation) => {
    if (!currentUser || !currentUser.id || (selectedConversation && selectedConversation.id === conversation.id)) return;
    setLoading(true);
    setSelectedConversation(conversation);
    setMessages([]); // Clear previous messages immediately

    // Immediately update unreadCount for this conversation to 0 in UI
    setConversations(prevConvs => prevConvs.map(conv => conv.id === conversation.id ? { ...conv, unreadCount: 0 } : conv));
    // Update the total unread count based on the change
    fetchUnreadCount();

    try {
      const response = await messagesAPI.getConversationMessages(
        conversation.id,
        currentUser.id
      );
      const fetchedMessages = response.data;
      setMessages(fetchedMessages);

      // Mark fetched messages as read via SignalR
      const unreadMessages = fetchedMessages.filter(msg => !msg.isRead && msg.senderId !== currentUser.id);
      if (unreadMessages.length > 0) {
        console.log(`Marking ${unreadMessages.length} messages as read for conversation ${conversation.id}`);
        await Promise.all(
          unreadMessages.map(msg =>
            connectionManager.markMessageAsRead(msg.id)
              .catch(err => console.error(`Failed to mark message ${msg.id} as read via SignalR:`, err))
          )
        );
        // Optimistically update local state - backend confirmation will follow via onMessageRead
        setMessages(prev => prev.map(msg =>
          unreadMessages.some(unread => unread.id === msg.id)
            ? { ...msg, isRead: true }
            : msg
        ));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des messages :', error);
      // Handle error state, maybe show a toast
    } finally {
      setLoading(false);
    }
  };

// Fix for the handleSendMessage function in ChatContainer.jsx
const handleSendMessage = async (messageText, attachment) => {
  if (!selectedConversation || !currentUser || !currentUser.id) return;
  let attachmentUrl = null;
  
  // Handle file attachment upload if present
  if (attachment) {
    try {
      const formData = new FormData();
      formData.append('file', attachment);
      // Use the API service for upload, not SignalR
      const response = await messagesAPI.uploadMessageAttachment(formData);
      attachmentUrl = response.data.fileUrl || response.data.FileUrl;
    } catch (error) {
      console.error('Échec du téléversement de la pièce jointe :', error);
      alert('Échec du téléversement de la pièce jointe.');
      return;
    }
  }
  
  // If this is a temporary conversation, create it first
  // If this is a temporary conversation, create it first
  let conversationId = selectedConversation.id;
  
  // Check if the conversation ID is a valid MongoDB ObjectId (24-character hex string)
  const isValidMongoId = /^[0-9a-f]{24}$/.test(conversationId);
  
  if (selectedConversation.isTemporary || !isValidMongoId) {
    try {
      // Find the other participant (not the current user)
      const otherParticipant = selectedConversation.participants.find(
        p => p.id !== currentUser.id
      );
      
      // Create the conversation with the correctly structured DTO
      const createConvResponse = await messagesAPI.createConversation({
        participantIds: [currentUser.id, otherParticipant.id],
        creatorId: currentUser.id,
        isGroup: false,
        title: "" // Empty string instead of null
      });
      
      conversationId = createConvResponse.data.id;
      
      // Update the conversation in state
      const newConversation = {
        ...selectedConversation,
        id: conversationId,
        isTemporary: false
      };
      
      setSelectedConversation(newConversation);
      
      // Add to conversations list
      setConversations(prev => [newConversation, ...prev]);
      
      // Join the conversation's SignalR group
      try {
        await connectionManager.joinConversation(conversationId);
        console.log(`Joined SignalR group for conversation: ${conversationId}`);
      } catch (err) {
        console.warn(`Failed to join SignalR group: ${err.message}`);
        // Non-fatal error, continue with message sending
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Failed to create conversation.');
      return;
    }
  
  }
  const messageContent = messageText.trim();
  if (!messageContent && !attachmentUrl) {
    alert('Message cannot be empty');
    return;
  }

  const messageDto = {
    content: messageContent,
    conversationId: conversationId, // Using the resolved conversationId
    // UserId will be set by the backend Hub based on the connection's identity
    attachmentUrl
  };

  console.log('Invoking SendMessage via SignalR:', messageDto);
  try {
    // Use ConnectionManager to send via SignalR
    await connectionManager.sendMessage(messageDto);
    // The message will be added to state via the onReceiveMessage listener
    // No need to call setMessages here directly
    console.log('SendMessage invoked successfully.');
    // Refresh conversation list to show new last message immediately
    fetchConversations();
  } catch (error) {
    console.error("Échec de l'envoi du message via SignalR:", error);
    alert("Échec de l'envoi du message");
  }
};

  const handleEditMessage = async (messageId, newContent) => {
    // Optimistic UI update can be done here or rely solely on the listener
    // setMessages(prev => prev.map(m =>
    //   m.id === messageId ? { ...m, content: newContent, isEdited: true } : m
    // ));
    try {
      // Create the editDto object expected by connectionManager.editMessage
      const editDto = {
        messageId: messageId,
        updatedContent: newContent.content || newContent
      };
      await connectionManager.editMessage(editDto);
      console.log(`EditMessage invoked for ${messageId}`);
      // State update will happen via onMessageEdited listener
    } catch (error) {
      console.error('Échec de la modification du message via SignalR:', error);
      alert('Échec de la modification du message');
      // Revert optimistic update if applied
    }
  };

  const handleUnsendMessage = async (messageId) => {
    setConfirmModal({
      open: true,
      title: "Annuler l'envoi du message",
      message: "Êtes-vous sûr de vouloir annuler l'envoi de ce message ?",
      onConfirm: async () => {
        setConfirmModal(modal => ({ ...modal, open: false }));
        // Optimistic UI update can be done here or rely solely on the listener
        // setMessages(prev => prev.map(m =>
        //   m.id === messageId ? { ...m, isUnsent: true, content: 'Message unsent' } : m
        // ));
        try {
          await connectionManager.unsendMessage(messageId);
          console.log(`UnsendMessage invoked for ${messageId}`);
          // State update will happen via onMessageUnsent listener
        } catch (error) {
          console.error("Erreur lors de l'annulation de l'envoi du message via SignalR :", error);
          alert("Échec de l'annulation de l'envoi du message. Veuillez réessayer plus tard.");
          // Revert optimistic update if applied
        }
      }
    });
  };

  const handleSoftDeleteMessage = async (messageId) => {
    setConfirmModal({
      open: true,
      title: 'Supprimer le message',
      message: 'Supprimer ce message pour vous ?', // Only affects the current user's view
      onConfirm: async () => {
        setConfirmModal(modal => ({ ...modal, open: false }));
        // Optimistic UI update
        setMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, deletedForUsers: [...(m.deletedForUsers || []), currentUser.id] } : m
        ));
        try {
          await connectionManager.deleteMessage(messageId);
          console.log(`DeleteMessageForUser invoked for ${messageId}`);
          // Backend confirms via onMessageDeleted, but we already updated optimistically.
        } catch (error) {
          console.error('Erreur lors de la suppression du message via SignalR :', error);
          alert('Échec de la suppression du message. Veuillez réessayer plus tard.');
          // Revert optimistic update
          setMessages(prev => prev.map(m =>
            m.id === messageId ? { ...m, deletedForUsers: (m.deletedForUsers || []).filter(id => id !== currentUser.id) } : m
          ));
        }
      }
    });
  };

  const handleDeleteGroup = async (conversationId, userId) => {
    setConfirmModal({
      open: true,
      title: 'Supprimer le groupe',
      message: 'Êtes-vous sûr de vouloir supprimer définitivement ce groupe ?',
      onConfirm: async () => {
        setConfirmModal(modal => ({ ...modal, open: false }));
        try {
          await messagesAPI.permanentlyDeleteGroup(conversationId, userId);
          setConversations(prev => prev.filter(conv => conv.id !== conversationId));
          setSelectedConversation(null);
          setMessages([]);
          fetchUnreadCount();
        } catch (error) {
          console.error('Échec de la suppression du groupe :', error);
        }
      }
    });
  };

  const handleSoftDeleteConversation = async (conversationId, userId) => {
    setConfirmModal({
      open: true,
      title: 'Supprimer la conversation',
      message: 'Supprimer cette conversation pour vous ?',
      onConfirm: async () => {
        setConfirmModal(modal => ({ ...modal, open: false }));
        try {
          await messagesAPI.softDeleteConversation(conversationId, userId);
          setConversations(prev => prev.filter(conv => conv.id !== conversationId));
          setSelectedConversation(null);
          setMessages([]);
          fetchUnreadCount();
        } catch (error) {
          console.error('Erreur lors de la suppression de la conversation :', error);
          alert('Échec de la suppression de la conversation. Veuillez réessayer plus tard.');
        }
      }
    });
  };

  // Use the handleSelectEmployee from ChatContext
  const handleSelectEmployee = async (employee) => {
    // Get the context's handleSelectEmployee function without destructuring to avoid naming conflicts
    const chatContext = useChat();
    // Call the context function with the employee and current user
    await chatContext.handleSelectEmployee(employee, currentUser);
  };
  
  return (
    <div className="chat-container">
      <ConversationList
        conversations={conversations}
        selectedConversationId={selectedConversation?.id}
        unreadCount={unreadCount} // Pass total unread count if needed by the list
        currentUser={currentUser}
        onSelectConversation={handleSelectConversation}
      />
      <ChatWindow
        key={selectedConversation?.id || 'empty'} // Add key to force re-render on conversation change
        conversation={selectedConversation}
        messages={messages.filter(msg => !(msg.deletedForUsers || []).includes(currentUser.id))}
        loading={loading}
        currentUser={currentUser}
        onSendMessage={handleSendMessage}
        onEditMessage={handleEditMessage}
        onUnsendMessage={handleUnsendMessage}
        onSoftDeleteMessage={handleSoftDeleteMessage}
        onSoftDeleteConversation={handleSoftDeleteConversation}
        onLeaveGroup={handleDeleteGroup}
      />

      <ConfirmationModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal(modal => ({ ...modal, open: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
      />
    </div>
  );
};

export default ChatContainer;