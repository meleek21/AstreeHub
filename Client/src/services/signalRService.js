import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

class SignalRService {
  constructor() {
    this.connection = null;
    this.connectionPromise = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 2000; // Start with 2 seconds
    this.callbacks = {
      onNewPost: null,
      onUpdatedPost: null,
      onDeletedPost: null,
      onConnectionChange: null,
      // Add callbacks for comments
      onNewComment: null,
      onUpdatedComment: null,
      onDeletedComment: null,
      onNewReply: null,
      // Add callbacks for reactions
      onNewReaction: null,
      onUpdatedReaction: null,
      onDeletedReaction: null,
      onReactionSummary: null,
    };
  }

  // Initialize the connection
  async start() {
    if (this.connection) {
      return this.connectionPromise;
    }

    try {
      // Create the connection
      this.connection = new HubConnectionBuilder()
        .withUrl('http://localhost:5126/feedHub', {
          accessTokenFactory: () => localStorage.getItem('token'),
        })
        .withAutomaticReconnect([
          0, 2000, 5000, 10000, 15000, 30000 // Reconnect intervals in milliseconds
        ])
        .configureLogging(LogLevel.Information)
        .build();

      // Set up event handlers
      this.setupEventHandlers();

      // Start the connection
      this.connectionPromise = this.connection.start();
      await this.connectionPromise;
      
      console.log('SignalR connected successfully');
      this.reconnectAttempts = 0;
      
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
      
      // Try to reconnect
      this.attemptReconnect();
      throw error;
    }
  }

  // Set up event handlers for the connection
  setupEventHandlers() {
    if (!this.connection) return;

    // Handle new posts
    this.connection.on('ReceiveNewPost', (post) => {
      console.log('New post received:', post);
      if (this.callbacks.onNewPost) {
        this.callbacks.onNewPost(post);
      }
    });

    // Handle updated posts
    this.connection.on('ReceiveUpdatedPost', (post) => {
      console.log('Updated post received:', post);
      if (this.callbacks.onUpdatedPost) {
        this.callbacks.onUpdatedPost(post);
      }
    });

    // Handle deleted posts
    this.connection.on('ReceiveDeletedPost', (postId) => {
      console.log('Deleted post received:', postId);
      if (this.callbacks.onDeletedPost) {
        this.callbacks.onDeletedPost(postId);
      }
    });

    // Handle new comments
    this.connection.on('ReceiveNewComment', (comment) => {
      console.log('New comment received:', comment);
      if (this.callbacks.onNewComment) {
        this.callbacks.onNewComment(comment);
      }
    });

    // Handle updated comments
    this.connection.on('ReceiveUpdatedComment', (comment) => {
      console.log('Updated comment received:', comment);
      if (this.callbacks.onUpdatedComment) {
        this.callbacks.onUpdatedComment(comment);
      }
    });

    // Handle deleted comments
    this.connection.on('ReceiveDeletedComment', (commentId) => {
      console.log('Deleted comment received:', commentId);
      if (this.callbacks.onDeletedComment) {
        this.callbacks.onDeletedComment(commentId);
      }
    });

    // Handle new replies
    this.connection.on('ReceiveNewReply', (reply, parentCommentId) => {
      console.log('New reply received:', reply, 'Parent comment ID:', parentCommentId);
      if (this.callbacks.onNewReply) {
        this.callbacks.onNewReply(reply, parentCommentId);
      }
    });

    // Handle new reactions
    this.connection.on('ReceiveNewReaction', (reaction) => {
      console.log('New reaction received:', reaction);
      if (this.callbacks.onNewReaction) {
        this.callbacks.onNewReaction(reaction);
      }
    });

    // Handle updated reactions
    this.connection.on('ReceiveUpdatedReaction', (reaction) => {
      console.log('Updated reaction received:', reaction);
      if (this.callbacks.onUpdatedReaction) {
        this.callbacks.onUpdatedReaction(reaction);
      }
    });

    // Handle deleted reactions
    this.connection.on('ReceiveDeletedReaction', (reactionId) => {
      console.log('Deleted reaction received:', reactionId);
      if (this.callbacks.onDeletedReaction) {
        this.callbacks.onDeletedReaction(reactionId);
      }
    });

    // Handle reaction summary updates
    this.connection.on('ReceiveReactionSummary', (postId, summary) => {
      console.log('Reaction summary update received:', postId, summary);
      if (this.callbacks.onReactionSummary) {
        this.callbacks.onReactionSummary(postId, summary);
      }
    });

    // Handle reconnection
    this.connection.onreconnecting((error) => {
      console.log('SignalR attempting to reconnect:', error);
      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(false);
      }
    });

    this.connection.onreconnected((connectionId) => {
      console.log('SignalR reconnected. ConnectionId:', connectionId);
      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(true);
      }
    });

    this.connection.onclose((error) => {
      console.log('SignalR connection closed:', error);
      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(false);
      }
      this.attemptReconnect();
    });
  }

  // Attempt to reconnect with exponential backoff
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Maximum reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
      this.connection = null;
      this.connectionPromise = null;
      this.start().catch(() => {});
    }, delay);
  }

  // Stop the connection
  async stop() {
    if (this.connection) {
      try {
        await this.connection.stop();
        console.log('SignalR connection stopped');
      } catch (error) {
        console.error('Error stopping SignalR connection:', error);
      } finally {
        this.connection = null;
        this.connectionPromise = null;
      }
    }
  }

  // Join a specific feed group
  async joinFeedGroup(groupName) {
    if (!this.connection) {
      await this.start();
    }
    
    try {
      await this.connection.invoke('JoinFeedGroup', groupName);
      console.log(`Joined feed group: ${groupName}`);
    } catch (error) {
      console.error(`Error joining feed group ${groupName}:`, error);
      throw error;
    }
  }

  // Leave a feed group
  async leaveFeedGroup(groupName) {
    if (!this.connection) return;
    
    try {
      await this.connection.invoke('LeaveFeedGroup', groupName);
      console.log(`Left feed group: ${groupName}`);
    } catch (error) {
      console.error(`Error leaving feed group ${groupName}:`, error);
    }
  }

  // Register callbacks for events
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

  // Register callbacks for comment events
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

  // Register callbacks for reaction events
  onNewReaction(callback) {
    this.callbacks.onNewReaction = callback;
  }

  onUpdatedReaction(callback) {
    this.callbacks.onUpdatedReaction = callback;
  }

  onDeletedReaction(callback) {
    this.callbacks.onDeletedReaction = callback;
  }

  // Register callback for reaction summary updates
  onReactionSummary(callback) {
    this.callbacks.onReactionSummary = callback;
  }

  // Check if the connection is active
  isConnected() {
    return this.connection?.state === 'Connected';
  }
}

// Create a singleton instance
const signalRService = new SignalRService();

export default signalRService;