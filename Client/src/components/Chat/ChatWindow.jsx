import React, { useState, useEffect, useRef, useCallback } from 'react';
import { messagesAPI } from '../../services/apiServices';
import MessageInput from './MessageInput';
import Message from './Message';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import 'intersection-observer';
import useOnlineStatus from '../../hooks/useOnlineStatus';
import connectionManager from '../../services/connectionManager';

const ChatWindow = ({ conversationId, signalRConnected }) => {
  const { onlineUsers, isUserOnline } = useOnlineStatus();
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(false);
  const {user}=useAuth();
  const [typingUsers, setTypingUsers] = useState([]);
  const messagesEndRef = useRef(null);
  const loadMoreRef = useRef(null);
  const currentUserId =  user?.id;
  const queryClient = useQueryClient();
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const typingTimeoutRef = useRef(null);

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
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });

  const messages = data?.pages.flat().sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) || [];
  
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
  
  useEffect(() => {
    if (!messages.length || !signalRConnected || !conversationId) return;
    
    // Use a short delay to ensure the UI has rendered first
    const timeoutId = setTimeout(() => {
      const unreadMessages = messages.filter(
        msg => !msg.isRead && msg.senderId !== currentUserId
      );
      
      if (unreadMessages.length > 0) {
        unreadMessages.forEach(msg => {
          connectionManager.markMessageAsRead(msg.id);
        });
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [messages, currentUserId, signalRConnected, conversationId]);
    
  const handleReceiveMessage = useCallback((message) => {
    console.log('Received message via SignalR:', message);
    if (message.conversationId === conversationId) {
      queryClient.setQueryData(['messages', conversationId], (oldData) => {
        if (!oldData) return { pages: [[message]], pageParams: [0] };
        
        const newPages = oldData.pages.map((page, i) => {
          if (i === oldData.pages.length - 1) {
            return [...page, message];
          }
          return page;
        });
        
        return {
          ...oldData,
          pages: newPages,
        };
      });
      
      if (shouldAutoScroll) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [conversationId, queryClient, shouldAutoScroll]);

  const handleMessageRead = useCallback((messageId) => {
    queryClient.setQueryData(['messages', conversationId], (oldData) => {
      if (!oldData) return oldData;
      
      const newPages = oldData.pages.map(page => {
        return page.map(msg => {
          if (msg.id === messageId) {
            return { ...msg, isRead: true };
          }
          return msg;
        });
      });
      
      return {
        ...oldData,
        pages: newPages,
      };
    });
  }, [conversationId, queryClient]);

  const handleUserTyping = useCallback((data) => {
    if (data.conversationId === conversationId && data.userId !== currentUserId) {
      setTypingUsers(prev => {
        if (!prev.includes(data.userId)) {
          return [...prev, data.userId];
        }
        return prev;
      });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        setTypingUsers(prev => prev.filter(id => id !== data.userId));
      }, 3000);
    }
  }, [conversationId, currentUserId]);

  useEffect(() => {
    if (!signalRConnected) return;

    connectionManager.onReceiveMessage(handleReceiveMessage);
    connectionManager.onMessageRead(handleMessageRead);
    connectionManager.onUserTyping(handleUserTyping);
    
    if (conversationId) {
      connectionManager.joinConversation(conversationId);
    }
    
    return () => {
      connectionManager.offReceiveMessage();
      connectionManager.offMessageRead();
      connectionManager.offUserTyping();
      
      if (conversationId) {
        connectionManager.leaveConversation(conversationId);
      }
    };
  }, [conversationId, handleReceiveMessage, handleMessageRead, handleUserTyping, signalRConnected]);

  const handleSendMessage = async (content, attachmentUrl = null) => {
    if (!signalRConnected) {
      console.error('Cannot send message: SignalR connection not established');
      return;
    }
    try {
      await connectionManager.sendMessage(content, conversationId, attachmentUrl);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleTypingIndicator = useCallback(async () => {
    if (!signalRConnected) return;
    try {
      await connectionManager.sendTypingIndicator(conversationId);
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  }, [conversationId, signalRConnected]);

  if (!conversationId) {
    return (
      <div className="chat-window empty-state">
        <p>Select a conversation to start chatting</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="chat-window">
        <div className="new-conversation">
          <div className="chat-header">
            <h2>New conversation with {selectedEmployee.name}</h2>
          </div>
          <div className="chat-box empty-chat">
            <div className="empty-chat-message">
              <p>Send a message to start the conversation</p>
            </div>
            {typingUsers.filter(u => u.id !== currentUserId).length > 0 && (
              <div className="typing-indicator">
                {typingUsers.filter(u => u.id !== currentUserId).length === 1 
                  ? `${typingUsers.filter(u => u.id !== currentUserId)[0].name} is typing...` 
                  : `${typingUsers.filter(u => u.id !== currentUserId).length} people are typing...`}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <MessageInput onSendMessage={handleSendMessage} onTyping={handleTyping} />
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {!signalRConnected && (
        <div className="connection-status warning">
          Connecting to chat service...
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
        
        {typingUsers.filter(u => u.id !== currentUserId).length > 0 && (
          <div className="typing-indicator">
            {typingUsers.filter(u => u.id !== currentUserId).length === 1 
              ? `${typingUsers.filter(u => u.id !== currentUserId)[0].name} is typing...` 
              : `${typingUsers.filter(u => u.id !== currentUserId).length} people are typing...`}
          </div>
        )}
        <div ref={messagesEndRef} />
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            {typingUsers.map(userId => conversation?.participants.find(p => p.id === userId)?.name).join(', ')}
            {typingUsers.length === 1 ? ' is ' : ' are '}
            typing...
          </div>
        )}
      </div>
      <MessageInput onSendMessage={handleSendMessage} onTyping={handleTyping} />
    </div>
  );
};

export default ChatWindow;