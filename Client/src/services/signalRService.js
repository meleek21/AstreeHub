import { HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr';

class SignalRService {
  constructor() {
    this.connection = null;
    this.connectionPromise = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 3;
    this.reconnectInterval = 1000;
    this.connectionPool = new Map();
    this.isInitialized = false;
    this.connectionCache = new Map();
    this.callbacks = {
      onNewPost: null,
      onUpdatedPost: null,
      onDeletedPost: null,
      onConnectionChange: null,
      onNewComment: null,
      onUpdatedComment: null,
      onDeletedComment: null,
      onNewReply: null,
      onNewReaction: null,
      onUpdatedReaction: null,
      onDeletedReaction: null,
      onReactionSummary: null,
      onNewFile: null,
      onUpdatedFile: null,
      onDeletedFile: null,
      onUserStatusChange: null,
    };
    this.eventHandlersRegistered = false;
  }

  async start(groupName = 'default') {
    // Return existing promise if there's already a connection attempt in progress
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // Check connection cache first
    const cachedConnection = this.connectionCache.get(groupName);
    if (cachedConnection && cachedConnection.state === 'Connected') {
      this.connection = cachedConnection;
      return Promise.resolve();
    }

    // Check if a connection exists in the pool
    if (this.connectionPool.has(groupName) && this.connectionPool.get(groupName).state === 'Connected') {
      this.connection = this.connectionPool.get(groupName);
      this.connectionCache.set(groupName, this.connection);
      return Promise.resolve();
    }

    // Try to find any connected connection in the pool
    const existingConnection = Array.from(this.connectionPool.values())
      .find(conn => conn.state === 'Connected');
    
    if (existingConnection) {
      this.connection = existingConnection;
      this.connectionPool.set(groupName, existingConnection);
      this.connectionCache.set(groupName, existingConnection);
      return Promise.resolve();
    }

    try {
      // Create a new connection if none exists
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      this.connection = new HubConnectionBuilder()
        .withUrl('http://localhost:5126/hubs/user', {
          accessTokenFactory: () => token,
          withCredentials: false,
          skipNegotiation: true,
          transport: HttpTransportType.WebSockets,
          timeout: 10000
        })
        .withAutomaticReconnect([0, 1000, 2000, 5000])
        .configureLogging(LogLevel.Warning)
        .build();

      // Set up event handlers only once
      if (!this.eventHandlersRegistered) {
        this.setupEventHandlers();
        this.eventHandlersRegistered = true;
      }

      // Start the connection
      this.connectionPromise = this.connection.start();
      await this.connectionPromise;
      
      console.log('SignalR connected successfully');
      this.reconnectAttempts = 0;
      
      // Add the connection to the pool and cache
      this.connectionPool.set(groupName, this.connection);
      this.connectionCache.set(groupName, this.connection);
      this.isInitialized = true;
      
      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(true);
      }
      
      return this.connectionPromise;
    } catch (error) {
      console.error('SignalR connection error:', error);
      this.connectionPromise = null;
      
      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(false);
      }
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        return this.attemptReconnect();
      }
      
      throw error;
    } finally {
      // Clear the connection promise to allow future connection attempts
      this.connectionPromise = null;
    }
  }

  setupEventHandlers() {
    if (!this.connection) return;

    // Connection state handlers
    this.connection.onreconnecting((error) => {
      console.log('Connection lost. Attempting to reconnect...', error);
      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(false);
      }
    });
    
    // User status events
    this.connection.on('UserStatusChanged', (userId, isOnline) => {
      if (this.callbacks.onUserStatusChange) {
        this.callbacks.onUserStatusChange(userId, isOnline);
      }
    });

    this.connection.onreconnected((connectionId) => {
      console.log('Connection reestablished. ID:', connectionId);
      this.reconnectAttempts = 0;
      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(true);
      }
    });

    this.connection.onclose((error) => {
      console.log('Connection closed:', error);
      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(false);
      }
      this.attemptReconnect();
    });

    // Post events
    this.connection.on('ReceiveNewPost', (post) => {
      if (this.callbacks.onNewPost) {
        this.callbacks.onNewPost(post);
      }
    });

    this.connection.on('ReceiveUpdatedPost', (post) => {
      if (this.callbacks.onUpdatedPost) {
        this.callbacks.onUpdatedPost(post);
      }
    });

    this.connection.on('ReceiveDeletedPost', (postId) => {
      if (this.callbacks.onDeletedPost) {
        this.callbacks.onDeletedPost(postId);
      }
    });

    // Comment events
    this.connection.on('ReceiveNewComment', (comment) => {
      if (this.callbacks.onNewComment) {
        this.callbacks.onNewComment(comment);
      }
    });

    this.connection.on('ReceiveUpdatedComment', (comment) => {
      if (this.callbacks.onUpdatedComment) {
        this.callbacks.onUpdatedComment(comment);
      }
    });

    this.connection.on('ReceiveDeletedComment', (commentId) => {
      if (this.callbacks.onDeletedComment) {
        this.callbacks.onDeletedComment(commentId);
      }
    });

    this.connection.on('ReceiveNewReply', (reply, parentCommentId) => {
      if (this.callbacks.onNewReply) {
        this.callbacks.onNewReply(reply, parentCommentId);
      }
    });

    // Reaction events
    this.connection.on('ReceiveNewReaction', (reaction) => {
      if (this.callbacks.onNewReaction) {
        this.callbacks.onNewReaction(reaction);
      }
    });

    this.connection.on('ReceiveUpdatedReaction', (reaction) => {
      if (this.callbacks.onUpdatedReaction) {
        this.callbacks.onUpdatedReaction(reaction);
      }
    });

    this.connection.on('ReceiveReactionDeleted', (reactionInfo) => {
      if (this.callbacks.onDeletedReaction) {
        const reactionId = reactionInfo.reactionId || reactionInfo.ReactionId;
        const postId = reactionInfo.postId || reactionInfo.PostId;
        this.callbacks.onDeletedReaction(reactionId, postId);
      }
    });

    this.connection.on('ReceiveReactionSummary', (postId, summary) => {
      if (this.callbacks.onReactionSummary) {
        this.callbacks.onReactionSummary(postId, summary);
      }
    });

    // File events
    this.connection.on('ReceiveNewFile', (file) => {
      if (this.callbacks.onNewFile) {
        this.callbacks.onNewFile(file);
      }
    });

    this.connection.on('ReceiveUpdatedFile', (file) => {
      if (this.callbacks.onUpdatedFile) {
        this.callbacks.onUpdatedFile(file);
      }
    });

    this.connection.on('ReceiveDeletedFile', (fileId) => {
      if (this.callbacks.onDeletedFile) {
        this.callbacks.onDeletedFile(fileId);
      }
    });
  }

  async attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Maximum reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const backoffTime = this.reconnectInterval;

    console.log(`Attempting to reconnect in ${backoffTime}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          // Check for any active connection first
          for (const groupName of this.connectionPool.keys()) {
            const conn = this.connectionPool.get(groupName);
            if (conn && conn.state === 'Connected') {
              this.connection = conn;
              this.connectionCache.set('default', conn);
              console.log('Reused existing connection');
              resolve();
              return;
            }
          }

          // Create a new connection
          await this.start();
          console.log('Reconnected successfully');
          resolve();
        } catch (error) {
          console.error('Reconnection attempt failed:', error);
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.attemptReconnect().then(resolve);
          } else {
            resolve(); // Resolve anyway to prevent hanging promises
          }
        }
      }, backoffTime);
    });
  }

  async stop(groupName = 'default') {
    const connection = this.connectionPool.get(groupName);
    if (!connection) return;

    try {
      // Remove all event handlers for this connection
      if (connection.methods) {
        Object.keys(connection.methods).forEach(method => {
          connection.off(method);
        });
      }

      await connection.stop();
      console.log(`SignalR connection stopped for group: ${groupName}`);
      this.connectionPool.delete(groupName);
      this.connectionCache.delete(groupName);
      
      if (this.connection === connection) {
        this.connection = null;
      }
    } catch (error) {
      console.error(`Error stopping SignalR connection for group ${groupName}:`, error);
    }
  }

  async stopAll() {
    // Remove all event handlers
    if (this.connection) {
      this.connection.off('UserStatusChanged');
      this.connection.off('ReceiveNewPost');
      this.connection.off('ReceiveUpdatedPost');
      this.connection.off('ReceiveDeletedPost');
      this.connection.off('ReceiveNewComment');
      this.connection.off('ReceiveUpdatedComment');
      this.connection.off('ReceiveDeletedComment');
      this.connection.off('ReceiveNewReply');
      this.connection.off('ReceiveNewReaction');
      this.connection.off('ReceiveUpdatedReaction');
      this.connection.off('ReceiveReactionDeleted');
      this.connection.off('ReceiveReactionSummary');
      this.connection.off('ReceiveNewFile');
      this.connection.off('ReceiveUpdatedFile');
      this.connection.off('ReceiveDeletedFile');
    }
    
    // Stop all connections
    const stopPromises = Array.from(this.connectionPool.keys()).map(groupName => this.stop(groupName));
    await Promise.all(stopPromises);
    
    // Clear all collections
    this.connectionCache.clear();
    this.connectionPool.clear();
    this.isInitialized = false;
    this.connectionPromise = null;
    this.connection = null;
    this.eventHandlersRegistered = false;
    
    // Reset all callbacks
    Object.keys(this.callbacks).forEach(key => {
      this.callbacks[key] = null;
    });
  }

  async joinFeedGroup(groupName) {
    if (!groupName) {
      throw new Error('Group name is required');
    }
    
    try {
      await this.start(groupName);
      
      if (!this.connection) {
        throw new Error('No active connection available');
      }
      
      await this.connection.invoke('JoinFeedGroup', groupName);
      console.log(`Joined feed group: ${groupName}`);
    } catch (error) {
      console.error(`Error joining feed group ${groupName}:`, error);
      throw error;
    }
  }

  async leaveFeedGroup(groupName) {
    if (!this.connection || this.connection.state !== 'Connected') {
      console.warn(`Cannot leave group ${groupName}: No active connection`);
      return;
    }
    
    try {
      await this.connection.invoke('LeaveFeedGroup', groupName);
      console.log(`Left feed group: ${groupName}`);
    } catch (error) {
      console.error(`Error leaving feed group ${groupName}:`, error);
    }
  }

  // Register callbacks (keeping the existing implementation)
  onNewPost(callback) {
    this.callbacks.onNewPost = callback;
  }

  onUpdatedPost(callback) {
    this.callbacks.onUpdatedPost = callback;
  }

  onDeletedPost(callback) {
    this.callbacks.onDeletedPost = callback;
  }

  onConnectionChange(callback) {
    this.callbacks.onConnectionChange = callback;
  }

  onNewComment(callback) {
    this.callbacks.onNewComment = callback;
  }

  onUpdatedComment(callback) {
    this.callbacks.onUpdatedComment = callback;
  }

  onDeletedComment(callback) {
    this.callbacks.onDeletedComment = callback;
  }

  onNewReply(callback) {
    this.callbacks.onNewReply = callback;
  }

  onNewReaction(callback) {
    this.callbacks.onNewReaction = callback;
  }

  onUpdatedReaction(callback) {
    this.callbacks.onUpdatedReaction = callback;
  }

  onDeletedReaction(callback) {
    this.callbacks.onDeletedReaction = callback;
  }

  onReactionSummary(callback) {
    this.callbacks.onReactionSummary = callback;
  }

  onNewFile(callback) {
    this.callbacks.onNewFile = callback;
  }

  onUpdatedFile(callback) {
    this.callbacks.onUpdatedFile = callback;
  }

  onDeletedFile(callback) {
    this.callbacks.onDeletedFile = callback;
  }

  onUserStatusChange(callback) {
    // Remove existing handler if any
    if (this.connection) {
      this.connection.off('UserStatusChanged');
    }
    
    // Store the callback
    this.callbacks.onUserStatusChange = callback;
    
    // Register new handler only if callback exists
    if (callback && this.connection) {
      this.connection.on('UserStatusChanged', (userId, isOnline) => {
        callback(userId, isOnline);
      });
    }
  }

  isConnected(groupName = 'default') {
    const connection = this.connectionPool.get(groupName);
    return !!connection && connection.state === 'Connected';
  }

  getActiveConnectionCount() {
    return Array.from(this.connectionPool.values())
      .filter(conn => conn.state === 'Connected')
      .length;
  }

  async invokeHubMethod(methodName, ...args) {
    if (!this.connection || this.connection.state !== 'Connected') {
      throw new Error(`Cannot invoke method ${methodName}: No active connection`);
    }
    
    try {
      return await this.connection.invoke(methodName, ...args);
    } catch (error) {
      console.error(`Error invoking hub method ${methodName}:`, error);
      throw error;
    }
  }
}

// Create a singleton instance
const signalRService = new SignalRService();

export default signalRService;
