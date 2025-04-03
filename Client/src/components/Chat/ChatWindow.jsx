import React, { useState, useEffect, useRef, useCallback } from 'react';
import { messagesAPI } from '../../services/apiServices';
import chatSignalRService from '../../services/chatSignalRService';
import MessageInput from './MessageInput';
import Message from './Message';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import 'intersection-observer';

const ChatWindow = ({ conversationId, onlineUsers }) => {
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const loadMoreRef = useRef(null);
  const currentUserId = localStorage.getItem('userId');
  const queryClient = useQueryClient();
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
  } = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam = 0 }) => {
      const response = await messagesAPI.getConversationMessages(conversationId, pageParam, 50);
      return response.data;
    },
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 50 ? allPages.length * 50 : undefined;
    },
    enabled: !!conversationId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
    cacheTime: 1000 * 60 * 30, // Keep unused data for 30 minutes
  });

  // Flatten pages and ensure messages are sorted by timestamp (oldest first for display)
  const messages = data?.pages.flat().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) || [];
  
  // Fetch conversation details
  useEffect(() => {
    if (!conversationId) return;
    
    const fetchConversation = async () => {
      try {
        setLoading(true);
        const response = await messagesAPI.getConversationById(conversationId);
        setConversation(response.data);
      } catch (error) {
        console.error('Error fetching conversation:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchConversation();
  }, [conversationId]);
  
  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current) return;
    
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );
    
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);
  
  // Mark messages as read
  useEffect(() => {
    if (!messages.length) return;
    
    const unreadMessages = messages.filter(
      msg => !msg.isRead && msg.senderId !== currentUserId
    );
    
    if (unreadMessages.length > 0) {
      unreadMessages.forEach(msg => {
        chatSignalRService.markMessageAsRead(msg.id);
      });
    }
  }, [messages, currentUserId]);
    
    // Set up event handlers
    const handleReceiveMessage = useCallback((message) => {
      console.log('Received message via SignalR:', message);
      if (message.conversationId === conversationId) {
        queryClient.setQueryData(['messages', conversationId], (oldData) => {
          if (!oldData) return oldData;
          
          // Check if message already exists in any page
          const messageExists = oldData.pages.some(page =>
            page.some(msg => msg.id === message.id)
          );
          
          if (messageExists) return oldData;
          
          // Add to the most recent page and sort
          const newPages = [...oldData.pages];
          newPages[newPages.length - 1] = [...newPages[newPages.length - 1], message].sort(
            (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          
          return {
            ...oldData,
            pages: newPages
          };
        });

        
        // Mark as read if not from current user
        if (message.senderId !== currentUserId) {
          chatSignalRService.markMessageAsRead(message.id);
        }
      }
    }, [conversationId, currentUserId, queryClient]);
    
    
    const handleMessageRead = useCallback((messageId, userId) => {
      if (userId !== currentUserId) {
        queryClient.setQueryData(['messages', conversationId], (oldData) => {
          if (!oldData) return oldData;
          
          // Check if message exists and update its read status
          const messageExists = oldData.pages.some(page =>
            page.some(msg => msg.id === messageId)
          );
          
          if (!messageExists) return oldData;
          
          return {
            ...oldData,
            pages: oldData.pages.map(page =>
              page.map(msg =>
                msg.id === messageId ? { ...msg, isRead: true, readAt: new Date() } : msg
              )
            )
          };
        });
      }
    }, [conversationId, currentUserId, queryClient]);
    
    const handleUserTyping = useCallback((userId, convId) => {
      if (convId === conversationId && userId !== currentUserId) {
        // Find user name
        const typingUser = conversation?.participants.find(p => p.id === userId);
        if (typingUser) {
          setTypingUsers(prev => {
            if (!prev.some(u => u.id === userId)) {
              return [...prev, { id: userId, name: typingUser.name }];
            }
            return prev;
          });
          
          // Remove typing indicator after 3 seconds
          setTimeout(() => {
            setTypingUsers(prev => prev.filter(u => u.id !== userId));
          }, 3000);
        }
      }
    }, [conversationId, currentUserId, conversation]);
    
    // Join the conversation group in SignalR
    const joinConversation = async () => {
      try {
        await chatSignalRService.joinConversation(conversationId);
      } catch (error) {
        console.error('Error joining conversation:', error);
      }
    };
    
    useEffect(() => {
      if (!conversationId) return;
      
      // Initialize chat connection and join conversation
      chatSignalRService.initialize().then(() => {
        joinConversation();
      }).catch(error => {
        console.error('Error initializing chat connection:', error);
      });
      
      // Set up SignalR event handlers
      chatSignalRService.onReceiveMessage(handleReceiveMessage);
      chatSignalRService.onMessageRead(handleMessageRead);
      chatSignalRService.onUserTyping(handleUserTyping);
      
      return () => {
        // Clean up event handlers
        chatSignalRService.onReceiveMessage(null);
        chatSignalRService.onMessageRead(null);
        chatSignalRService.onUserTyping(null);
        
        // Leave the conversation group
        chatSignalRService.leaveConversation(conversationId).catch(err => {
          console.error('Error leaving conversation:', err);
        });
      };
    }, [conversationId, currentUserId, conversation, handleReceiveMessage, handleMessageRead, handleUserTyping]);
  
  // Add scroll event listener to chat box
  useEffect(() => {
    const chatBox = document.querySelector('.chat-box');
    if (!chatBox) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatBox;
      const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 50;
      setShouldAutoScroll(isAtBottom);
    };

    chatBox.addEventListener('scroll', handleScroll);
    return () => chatBox.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldAutoScroll]);
  
  const handleSendMessage = async (content, attachmentUrl = null) => {
    if (!content.trim() && !attachmentUrl) return;
    
    try {
      // First, send the message through SignalR for real-time delivery
      await chatSignalRService.sendMessage(content, conversationId, attachmentUrl);
      
      // No need to update UI manually as the SignalR 'ReceiveMessage' handler will do it
      // The message will be received through the SignalR connection and added to the messages state
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Fallback to REST API if SignalR fails
      try {
        const response = await messagesAPI.sendMessage({
          content,
          conversationId,
          attachmentUrl,
          senderId: currentUserId
        });
        
        // Update UI immediately with the sent message
        const newMessage = response.data;
        setMessages(prevMessages => [...prevMessages, newMessage]);
      } catch (apiError) {
        console.error('Error sending message via API fallback:', apiError);
      }
    }
  };
  
  const handleTyping = () => {
    chatSignalRService.sendTypingIndicator(conversationId).catch(err => {
      console.error('Error sending typing indicator:', err);
    });
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const groupMessagesByDate = () => {
    const groups = {};
    
    messages.forEach(message => {
      const date = new Date(message.timestamp).toLocaleDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };
  
  const getConversationName = () => {
    if (!conversation) return '';
    
    if (conversation.isGroup) {
      return conversation.title;
    }
    
    const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);
    return otherParticipant ? otherParticipant.name : 'Unknown User';
  };
  
  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId);
  };
  
  const getParticipantStatus = () => {
    if (!conversation || conversation.isGroup) return '';
    
    const otherParticipant = conversation.participants.find(p => p.id !== currentUserId);
    if (!otherParticipant) return '';
    
    return isUserOnline(otherParticipant.id) ? 'Online' : 'Offline';
  };
  
  if (!conversationId) {
    return (
      <div className="chat-window">
        <div className="empty-chat">
          Select a conversation to start chatting
        </div>
      </div>
    );
  }
  
  if (status === 'loading') {
    return (
      <div className="chat-window">
        <div className="loading-message">
          Loading conversation...
        </div>
      </div>
    );
  }
  
  const messageGroups = groupMessagesByDate();
  
  return (
    <div className="chat-window">
      <div className="chat-header">
        <div>
          <h2>{getConversationName()}</h2>
          {!conversation?.isGroup && <p>{getParticipantStatus()}</p>}
          {conversation?.isGroup && (
            <p>{conversation.participants.length} participants</p>
          )}
        </div>
      </div>
      
      <div className="chat-box">
        <div ref={loadMoreRef} className="load-more-trigger">
          {isFetchingNextPage ? 'Loading more...' : hasNextPage ? 'Load more' : ''}
        </div>
        
        {Object.keys(messageGroups).map(date => (
          <div key={date}>
            <div className="date-label">{date}</div>
            {messageGroups[date].map(message => (
              <Message
                key={message.id}
                message={message}
                isSentByMe={message.senderId === currentUserId}
                formatDate={formatDate}
                conversation={conversation}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        ))}
        
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            {typingUsers.length === 1 
              ? `${typingUsers[0].name} is typing...` 
              : `${typingUsers.length} people are typing...`}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <MessageInput 
        onSendMessage={handleSendMessage} 
        onTyping={handleTyping} 
      />
    </div>
  );
};

export default ChatWindow;