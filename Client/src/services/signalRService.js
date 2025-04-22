import {
  HubConnectionBuilder,
  LogLevel,
  HttpTransportType,
} from "@microsoft/signalr";

class SignalRService {
  constructor() {
    this.connection = null;
    this.connectionPromise = null;
    // Remove custom reconnect logic, rely on withAutomaticReconnect
    // this.reconnectAttempts = 0;
    // this.maxReconnectAttempts = 3;
    // this.reconnectInterval = 1000;
    // Remove custom connection pooling
    // this.connectionPool = new Map();
    this.isInitialized = false;
    // Remove connection cache
    // this.connectionCache = new Map();
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

  async start() {
    // Remove groupName parameter
    // Return existing promise if there's already a connection attempt in progress
    if (this.connectionPromise) {
      console.log("SignalR connection attempt already in progress.");
      return this.connectionPromise;
    }

    // Check if connection already exists and is connected
    if (this.connection && this.connection.state === "Connected") {
      console.log("SignalR connection already established.");
      return Promise.resolve();
    }

    // Remove custom pooling/caching logic
    // const cachedConnection = this.connectionCache.get(groupName);
    // if (cachedConnection && cachedConnection.state === 'Connected') {
    //   this.connection = cachedConnection;
    //   return Promise.resolve();
    // }
    // if (this.connectionPool.has(groupName) && this.connectionPool.get(groupName).state === 'Connected') {
    //   this.connection = this.connectionPool.get(groupName);
    //   this.connectionCache.set(groupName, this.connection);
    //   return Promise.resolve();
    // }
    // const existingConnection = Array.from(this.connectionPool.values())
    //   .find(conn => conn.state === 'Connected');
    // if (existingConnection) {
    //   this.connection = existingConnection;
    //   this.connectionPool.set(groupName, existingConnection);
    //   this.connectionCache.set(groupName, existingConnection);
    //   return Promise.resolve();
    // }

    try {
      // Create a new connection if none exists or not connected
      console.log("Attempting to establish SignalR connection...");
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("Authentication token not found for SignalR connection.");
        throw new Error("Authentication token not found");
      }

      this.connection = new HubConnectionBuilder()
        .withUrl("http://localhost:5126/hubs/user", {
          accessTokenFactory: () => token,
          withCredentials: false,
          skipNegotiation: true,
          transport: HttpTransportType.WebSockets,
          timeout: 10000,
        })
        .withAutomaticReconnect([0, 2000, 5000, 10000]) // Standard reconnect intervals
        .configureLogging(LogLevel.Information) // Increase log level for more details
        .build();

      // Set up event handlers only once
      if (!this.eventHandlersRegistered) {
        console.log("Setting up SignalR event handlers.");
        this.setupEventHandlers();
        this.eventHandlersRegistered = true;
      }

      // Start the connection
      console.log("Starting SignalR connection...");
      this.connectionPromise = this.connection.start();
      await this.connectionPromise;

      // Add a check to ensure connection is not null before accessing connectionId
      if (this.connection) {
        console.log(
          `SignalR connected successfully. Connection ID: ${this.connection.connectionId}`
        );
      }
      // Remove custom reconnect attempts logic
      // this.reconnectAttempts = 0;

      // Remove pooling/caching logic
      // this.connectionPool.set(groupName, this.connection);
      // this.connectionCache.set(groupName, this.connection);
      this.isInitialized = true;

      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(true);
      }

      return this.connectionPromise;
    } catch (error) {
      console.error("SignalR connection failed:", error);
      this.connectionPromise = null; // Reset promise on failure
      this.connection = null; // Reset connection object

      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(false);
      }

      // Rely on withAutomaticReconnect, remove manual retry logic
      // if (this.reconnectAttempts < this.maxReconnectAttempts) {
      //   return this.attemptReconnect();
      // }

      throw error; // Re-throw error after logging
    } finally {
      // Clear the connection promise to allow future connection attempts
      this.connectionPromise = null;
    }
  }

  setupEventHandlers() {
    if (!this.connection) return;

    // Connection state handlers with logging
    this.connection.onreconnecting((error) => {
      console.warn(
        `SignalR connection lost. Attempting to reconnect... Error: ${error}`
      );
      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(false);
      }
    });

    this.connection.onreconnected((connectionId) => {
      console.log(
        `SignalR connection reestablished. New Connection ID: ${connectionId}`
      );
      // Remove custom reconnect attempts logic
      // this.reconnectAttempts = 0;
      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(true);
      }
    });

    this.connection.onclose((error) => {
      console.error(`SignalR connection closed. Error: ${error}`);
      this.isInitialized = false; // Mark as not initialized
      this.connection = null; // Clear connection object
      if (this.callbacks.onConnectionChange) {
        this.callbacks.onConnectionChange(false);
      }
      // No need for manual attemptReconnect, withAutomaticReconnect handles it
      // this.attemptReconnect();
    });

    // User status events with logging
    this.connection.on("UserStatusChanged", (userId, isOnline) => {
      console.log(
        `Received UserStatusChanged event: User ID ${userId}, Is Online: ${isOnline}`
      );
      if (this.callbacks.onUserStatusChange) {
        this.callbacks.onUserStatusChange(userId, isOnline);
      }
    });

    // Post events
    this.connection.on("ReceiveNewPost", (post) => {
      if (this.callbacks.onNewPost) {
        this.callbacks.onNewPost(post);
      }
    });

    this.connection.on("ReceiveUpdatedPost", (post) => {
      if (this.callbacks.onUpdatedPost) {
        this.callbacks.onUpdatedPost(post);
      }
    });

    this.connection.on("ReceiveDeletedPost", (postId) => {
      if (this.callbacks.onDeletedPost) {
        this.callbacks.onDeletedPost(postId);
      }
    });

    // Comment events
    this.connection.on("ReceiveNewComment", (comment) => {
      if (this.callbacks.onNewComment) {
        this.callbacks.onNewComment(comment);
      }
    });

    this.connection.on("ReceiveUpdatedComment", (comment) => {
      if (this.callbacks.onUpdatedComment) {
        this.callbacks.onUpdatedComment(comment);
      }
    });

    this.connection.on("ReceiveDeletedComment", (commentId) => {
      if (this.callbacks.onDeletedComment) {
        this.callbacks.onDeletedComment(commentId);
      }
    });

    this.connection.on("ReceiveNewReply", (reply, parentCommentId) => {
      if (this.callbacks.onNewReply) {
        this.callbacks.onNewReply(reply, parentCommentId);
      }
    });

    // Reaction events
    this.connection.on("ReceiveNewReaction", (reaction) => {
      if (this.callbacks.onNewReaction) {
        this.callbacks.onNewReaction(reaction);
      }
    });

    this.connection.on("ReceiveUpdatedReaction", (reaction) => {
      if (this.callbacks.onUpdatedReaction) {
        this.callbacks.onUpdatedReaction(reaction);
      }
    });

    this.connection.on("ReceiveReactionDeleted", (reactionInfo) => {
      if (this.callbacks.onDeletedReaction) {
        const reactionId = reactionInfo.reactionId || reactionInfo.ReactionId;
        const postId = reactionInfo.postId || reactionInfo.PostId;
        this.callbacks.onDeletedReaction(reactionId, postId);
      }
    });

    this.connection.on("ReceiveReactionSummary", (postId, summary) => {
      if (this.callbacks.onReactionSummary) {
        this.callbacks.onReactionSummary(postId, summary);
      }
    });

    // File events
    this.connection.on("ReceiveNewFile", (file) => {
      if (this.callbacks.onNewFile) {
        this.callbacks.onNewFile(file);
      }
    });

    this.connection.on("ReceiveUpdatedFile", (file) => {
      if (this.callbacks.onUpdatedFile) {
        this.callbacks.onUpdatedFile(file);
      }
    });

    this.connection.on("ReceiveDeletedFile", (fileId) => {
      if (this.callbacks.onDeletedFile) {
        this.callbacks.onDeletedFile(fileId);
      }
    });
  }

  async attemptReconnect() {
    // Remove custom reconnect logic, rely on withAutomaticReconnect
    // if (this.reconnectAttempts >= this.maxReconnectAttempts) {
    //   console.error('Maximum reconnection attempts reached');
    //   return;
    // }

    // this.reconnectAttempts++;
    // const backoffTime = this.reconnectInterval;

    // console.log(`Attempting to reconnect in ${backoffTime}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    // return new Promise((resolve) => {
    //   setTimeout(async () => {
    //     try {
    //       // Check for any active connection first - REMOVED
    //       // for (const groupName of this.connectionPool.keys()) {
    //       //   const conn = this.connectionPool.get(groupName);
    //       //   if (conn && conn.state === 'Connected') {
    //       //     this.connection = conn;
    //       //     this.connectionCache.set('default', conn);
    //       //     console.log('Reused existing connection');
    //       //     resolve();
    //       //     return;
    //       //   }
    //       // }

    // Create a new connection if needed (start handles this)
    //       await this.start();
    //       console.log('Reconnected successfully');
    //       resolve();
    //     } catch (error) {
    //       console.error('Reconnection attempt failed:', error);
    // Rely on withAutomaticReconnect
    // if (this.reconnectAttempts < this.maxReconnectAttempts) {
    //   this.attemptReconnect().then(resolve);
    // } else {
    //   resolve(); // Resolve anyway to prevent hanging promises
    // }
    //     }
    //   }, backoffTime);
    // });
    // The entire custom reconnect logic is removed as withAutomaticReconnect handles it.
    console.warn(
      "AttemptReconnect called, but relying on withAutomaticReconnect."
    );
    return Promise.resolve(); // Return a resolved promise as reconnect is automatic
  }

  async stop() {
    // Remove groupName parameter
    // const connection = this.connectionPool.get(groupName); // Removed
    if (!this.connection) return;

    try {
      // Remove all event handlers for this connection
      // No need to iterate methods if we stop the connection directly
      // if (this.connection.methods) {
      //   Object.keys(this.connection.methods).forEach(method => {
      //     this.connection.off(method);
      //   });
      // }

      await this.connection.stop();
      console.log(`SignalR connection stopped.`); // Removed groupName
      // this.connectionPool.delete(groupName); // Removed
      // this.connectionCache.delete(groupName); // Removed

      // if (this.connection === connection) { // Condition always true now
      this.connection = null;
      // }
    } catch (error) {
      console.error(`Error stopping SignalR connection:`, error); // Removed groupName
    }
  }

  async stopAll() {
    // Remove all event handlers
    if (this.connection) {
      // It's generally better to just stop the connection, which implicitly removes handlers.
      // Explicitly removing might be needed in specific scenarios, but often redundant.
      // this.connection.off('UserStatusChanged');
      this.connection.off("ReceiveNewPost");
      this.connection.off("ReceiveUpdatedPost");
      this.connection.off("ReceiveDeletedPost");
      this.connection.off("ReceiveNewComment");
      this.connection.off("ReceiveUpdatedComment");
      this.connection.off("ReceiveDeletedComment");
      this.connection.off("ReceiveNewReply");
      this.connection.off("ReceiveNewReaction");
      this.connection.off("ReceiveUpdatedReaction");
      this.connection.off("ReceiveReactionDeleted");
      this.connection.off("ReceiveReactionSummary");
      this.connection.off("ReceiveNewFile");
      this.connection.off("ReceiveUpdatedFile");
      this.connection.off("ReceiveDeletedFile");
    }

    // Stop all connections - Simplified to stop the single connection
    // const stopPromises = Array.from(this.connectionPool.keys()).map(groupName => this.stop(groupName));
    // await Promise.all(stopPromises);

    // Clear all collections
    // this.connectionCache.clear(); // Removed
    // this.connectionPool.clear(); // Removed
    this.isInitialized = false;
    this.connectionPromise = null;
    this.connection = null;
    this.eventHandlersRegistered = false;

    // Reset all callbacks
    Object.keys(this.callbacks).forEach((key) => {
      this.callbacks[key] = null;
    });
  }

  async joinFeedGroup(groupName) {
    if (!groupName) {
      throw new Error("Group name is required");
    }

    try {
      // await this.start(groupName); // Remove groupName from start call
      await this.start();

      if (!this.connection) {
        throw new Error("No active connection available");
      }

      await this.connection.invoke("JoinFeedGroup", groupName);
      console.log(`Joined feed group: ${groupName}`);
    } catch (error) {
      console.error(`Error joining feed group ${groupName}:`, error);
      throw error;
    }
  }

  async leaveFeedGroup(groupName) {
    // Keep groupName for invoke
    if (!this.connection || this.connection.state !== "Connected") {
      console.warn(`Cannot leave group ${groupName}: No active connection`);
      return;
    }

    try {
      await this.connection.invoke("LeaveFeedGroup", groupName);
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
      this.connection.off("UserStatusChanged");
    }

    // Store the callback
    this.callbacks.onUserStatusChange = callback;

    // Register new handler only if callback exists and connection is active
    if (callback && this.connection && this.connection.state === "Connected") {
      this.connection.on("UserStatusChanged", (userId, isOnline) => {
        callback(userId, isOnline);
      });
    } else if (callback && this.connection) {
      // If connection exists but not connected yet, register after reconnected
      const reconnectedHandler = () => {
        if (this.callbacks.onUserStatusChange === callback) {
          // Check if callback hasn't changed
          this.connection.on("UserStatusChanged", (userId, isOnline) => {
            callback(userId, isOnline);
          });
        }
        this.connection.off("onreconnected", reconnectedHandler); // Clean up listener
      };
      this.connection.on("onreconnected", reconnectedHandler);
    }
  }

  isConnected(/* groupName = 'default' */) {
    // Remove groupName parameter
    // const connection = this.connectionPool.get(groupName); // Removed
    // return !!connection && connection.state === 'Connected'; // Use this.connection
    return !!this.connection && this.connection.state === "Connected";
  }

  getActiveConnectionCount() {
    // return Array.from(this.connectionPool.values())
    //   .filter(conn => conn.state === 'Connected')
    //   .length;
    return this.isConnected() ? 1 : 0; // Only one connection now
  }

  async invokeHubMethod(methodName, ...args) {
    if (!this.connection || this.connection.state !== "Connected") {
      throw new Error(
        `Cannot invoke method ${methodName}: No active connection`
      );
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
