import { HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr';
import signalRService from './signalRService';

// Extend the existing SignalR service with chat-specific functionality
class ChatSignalRService {
  constructor() {
    this.connection = null;
    this.connectionPromise = null;
    this.callbacks = {
      onReceiveMessage: null,
      onMessageRead: null,
      onUserTyping: null
      // Removed onUserOnline and onUserOffline callbacks as they're now handled by OnlineStatusContext
    };
  }

  // Initialize connection and register chat-specific event handlers
  async initialize() {
    // Return existing promise if there's already a connection attempt in progress
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    
    // If we already have a connected connection, use it
    if (this.connection && this.connection.state === 'Connected') {
      return Promise.resolve(this.connection);
    }
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Create a new connection specifically for the message hub
      this.connection = new HubConnectionBuilder()
        .withUrl('http://localhost:5126/hubs/message', {
          accessTokenFactory: () => token,
          withCredentials: false,
          skipNegotiation: true,
          transport: HttpTransportType.WebSockets,
          timeout: 10000
        })
        .withAutomaticReconnect([0, 1000, 2000, 5000])
        .configureLogging(LogLevel.Warning)
        .build();
      
      this.setupEventHandlers();
      
      // Start the connection
      this.connectionPromise = this.connection.start();
      await this.connectionPromise;
      
      console.log('Chat SignalR connected successfully to message hub');
      return this.connection;
    } catch (error) {
      console.error('Chat SignalR connection error:', error);
      this.connectionPromise = null;
      throw error;
    } finally {
      this.connectionPromise = null;
    }
  }

  setupEventHandlers() {
    if (!this.connection) return;

    // Message events
    this.connection.on('ReceiveMessage', (message) => {
      if (this.callbacks.onReceiveMessage) {
        this.callbacks.onReceiveMessage(message);
      }
    });

    this.connection.on('MessageRead', (messageId, userId) => {
      if (this.callbacks.onMessageRead) {
        this.callbacks.onMessageRead(messageId, userId);
      }
    });

    // Typing indicator
    this.connection.on('UserTyping', (userId, conversationId) => {
      if (this.callbacks.onUserTyping) {
        this.callbacks.onUserTyping(userId, conversationId);
      }
    });

    // Online status events are now completely handled by OnlineStatusContext
    // These handlers have been removed as they're no longer needed here
  }

  // Register event handlers
  onReceiveMessage(callback) {
    this.callbacks.onReceiveMessage = callback;
  }

  onMessageRead(callback) {
    this.callbacks.onMessageRead = callback;
  }

  onUserTyping(callback) {
    this.callbacks.onUserTyping = callback;
  }

  onUserOnline(callback) {
    this.callbacks.onUserOnline = callback;
  }

  onUserOffline(callback) {
    this.callbacks.onUserOffline = callback;
  }

  // Chat-specific methods
  async sendMessage(content, conversationId, attachmentUrl = null) {
    if (!this.connection || this.connection.state !== 'Connected') await this.initialize();
    
    return this.connection.invoke('sendMessage', {
      content,
      conversationId,
      attachmentUrl
    });
  }

  async markMessageAsRead(messageId) {
    if (!this.connection || this.connection.state !== 'Connected') await this.initialize();
    
    return this.connection.invoke('markMessageAsRead', messageId);
  }

  async sendTypingIndicator(conversationId) {
    if (!this.connection || this.connection.state !== 'Connected') await this.initialize();
    
    return this.connection.invoke('sendTypingIndicator', conversationId);
  }

  async joinConversation(conversationId) {
    if (!this.connection || this.connection.state !== 'Connected') await this.initialize();
    
    return this.connection.invoke('joinConversation', conversationId);
  }

  async leaveConversation(conversationId) {
    if (!this.connection || this.connection.state !== 'Connected') await this.initialize();
    
    return this.connection.invoke('leaveConversation', conversationId);
  }
  
  // Method to stop the connection
  async stop() {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('Chat SignalR connection stopped');
        this.connection = null;
      } catch (error) {
        console.error('Error stopping Chat SignalR connection:', error);
      }
    }
  }
}

const chatSignalRService = new ChatSignalRService();
export default chatSignalRService;