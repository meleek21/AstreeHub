import { HubConnectionBuilder, LogLevel, HttpTransportType } from '@microsoft/signalr';

const ConnectionState = {
  DISCONNECTED: 'Disconnected',
  CONNECTING: 'Connecting',
  CONNECTED: 'Connected',
  RECONNECTING: 'Reconnecting',
};

class ConnectionManager {
  constructor() {
    this.userConnection = null;
    this.messageConnection = null;
    this.userConnectionPromise = null;
    this.messageConnectionPromise = null;
    this.state = ConnectionState.DISCONNECTED;
    this.stateListeners = new Set();
    this.userCallbacks = {}; // Callbacks for user hub events
    this.messageCallbacks = {}; // Callbacks for message hub events
    this.connectionChangeCallback = null; // Callback for connection state changes
    this.activityListeners = new Set(); // Listeners for user activity changes
    this.lastActivityTime = Date.now();
    this.heartbeatIntervalId = null;
    this.inactivityTimeoutId = null;
    this.isUserActive = true; // Track user activity state
    this.HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds
    this.INACTIVITY_TIMEOUT = 60 * 1000; // 1 minute

    // Bind methods
    this.handleUserActivity = this.handleUserActivity.bind(this);
    this.sendHeartbeat = this.sendHeartbeat.bind(this);
    this.checkInactivity = this.checkInactivity.bind(this);
  }

  // --- State Management ---
  setState(newState) {
    if (this.state !== newState) {
      console.log(`Connection state changed: ${this.state} -> ${newState}`);
      this.state = newState;
      this.notifyStateChange();
    }
  }

  addStateListener(listener) {
    this.stateListeners.add(listener);
    // Immediately notify the new listener of the current state
    listener(this.state);
  }

  removeStateListener(listener) {
    this.stateListeners.delete(listener);
  }

  notifyStateChange() {
    this.stateListeners.forEach(listener => listener(this.state));
    // Notify connection change callback if set
    if (this.connectionChangeCallback) {
      this.connectionChangeCallback(this.state === ConnectionState.CONNECTED);
    }
  }

  // Add onConnectionChange method
  onConnectionChange(callback) {
    this.connectionChangeCallback = callback;
    if (callback) {
      // Immediately notify of current state
      callback(this.state === ConnectionState.CONNECTED);
    }
  }

  // Add offConnectionChange method
  offConnectionChange() {
    this.connectionChangeCallback = null;
  }

  // --- Activity Tracking --- 
    startActivityTracking() {
        if (this.heartbeatIntervalId) return; // Already running

        console.log('Starting activity tracking...');
        this.lastActivityTime = Date.now();
        this.isUserActive = true;
        this.notifyActivityChange();

        // Initial heartbeat
        this.sendHeartbeat(); 

        // Set up heartbeat interval
        this.heartbeatIntervalId = setInterval(this.sendHeartbeat, this.HEARTBEAT_INTERVAL);

        // Set up inactivity check
        this.resetInactivityTimeout();

        // Add event listeners for user activity
        window.addEventListener('mousemove', this.handleUserActivity, { passive: true });
        window.addEventListener('keydown', this.handleUserActivity, { passive: true });
        window.addEventListener('scroll', this.handleUserActivity, { passive: true });
    }

    stopActivityTracking() {
        if (this.heartbeatIntervalId) {
            clearInterval(this.heartbeatIntervalId);
            this.heartbeatIntervalId = null;
        }
        if (this.inactivityTimeoutId) {
            clearTimeout(this.inactivityTimeoutId);
            this.inactivityTimeoutId = null;
        }
        window.removeEventListener('mousemove', this.handleUserActivity);
        window.removeEventListener('keydown', this.handleUserActivity);
        window.removeEventListener('scroll', this.handleUserActivity);
        this.isUserActive = false; // Mark as inactive when tracking stops
        this.notifyActivityChange();
        console.log('Activity tracking stopped.');
    }

    handleUserActivity() {
        this.lastActivityTime = Date.now();
        if (!this.isUserActive) {
            this.isUserActive = true;
            this.notifyActivityChange();
            console.log('User became active.');
            // Optionally send an immediate update to the server
            this.sendHeartbeat(); 
        }
        // Reset inactivity timer on any activity
        this.resetInactivityTimeout();
    }

    resetInactivityTimeout() {
        if (this.inactivityTimeoutId) {
            clearTimeout(this.inactivityTimeoutId);
        }
        this.inactivityTimeoutId = setTimeout(this.checkInactivity, this.INACTIVITY_TIMEOUT);
    }

    checkInactivity() {
        const now = Date.now();
        if (this.isUserActive && (now - this.lastActivityTime >= this.INACTIVITY_TIMEOUT)) {
            this.isUserActive = false;
            this.notifyActivityChange();
            console.log('User became inactive due to timeout.');
            // Server will detect inactivity based on lack of heartbeats
        }
        // Schedule the next check (even if inactive, keep checking)
        this.resetInactivityTimeout(); 
    }

    async sendHeartbeat() {
        if (this.state !== ConnectionState.CONNECTED || !this.userConnection) {
            // console.log('Cannot send heartbeat, connection not established.');
            return;
        }
        try {
            // Ensure UserHub has an 'UpdateActivity' method
            await this.invokeHubMethod('UserHub', 'UpdateActivity');
            // console.log('Heartbeat sent successfully.');
        } catch (error) {
            // Avoid logging frequent errors if server isn't ready or during disconnects
            if (this.state === ConnectionState.CONNECTED) { 
              console.error('Failed to send heartbeat:', error);
            }
        }
    }

    // --- Activity State Subscription ---
    onActivityChange(listener) {
        this.activityListeners.add(listener);
        // Immediately notify with current state
        listener(this.isUserActive);
    }

    offActivityChange(listener) {
        this.activityListeners.delete(listener);
    }

    notifyActivityChange() {
        this.activityListeners.forEach(listener => listener(this.isUserActive));
    }

  // --- Connection Factory (Internal) ---
  createConnection(hubPath) {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error(`Authentication token not found for ${hubPath}`);
      throw new Error('Authentication token not found');
    }

    return new HubConnectionBuilder()
      .withUrl(`http://localhost:5126${hubPath}`, {
        accessTokenFactory: () => token,
        withCredentials: false,
        skipNegotiation: true,
        transport: HttpTransportType.WebSockets,
        timeout: 10000, // Consider making timeout configurable
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .configureLogging(LogLevel.Information) // Adjust log level as needed
      .build();
  }

  // --- Unified Start/Stop --- 
  // In connectionManager.js - enhance the start method
async start() {
    if (this.state === ConnectionState.CONNECTED) {
      console.log('Connection manager already started.');
      // Ensure activity tracking is running if already connected
      this.startActivityTracking();
      return Promise.resolve();
    }
    
    if (this.state === ConnectionState.CONNECTING) {
      console.log('Connection manager already starting.');
      return Promise.all([this.userConnectionPromise, this.messageConnectionPromise]
        .filter(Boolean));
    }
  
    this.setState(ConnectionState.CONNECTING);
    
    // Add retry logic
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        // Try to connect
        this.userConnectionPromise = this.startSpecificConnection('/hubs/user', 'user');
        this.messageConnectionPromise = this.startSpecificConnection('/hubs/message', 'message');
        
        await Promise.all([this.userConnectionPromise, this.messageConnectionPromise]);
        this.checkAndUpdateGlobalState();
        
        if (this.state === ConnectionState.CONNECTED) {
          return;
        }
        
        throw new Error('Failed to establish connections properly');
      } catch (error) {
        console.error(`Connection attempt ${retryCount + 1} failed:`, error);
        retryCount++;
        
        if (retryCount >= maxRetries) {
          this.setState(ConnectionState.DISCONNECTED);
          await this.stop();
          throw new Error(`Failed to connect after ${maxRetries} attempts`);
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  async startSpecificConnection(hubPath, connectionType) {
      let connection = connectionType === 'user' ? this.userConnection : this.messageConnection;
      let connectionPromiseField = connectionType === 'user' ? 'userConnectionPromise' : 'messageConnectionPromise';
  
      // Avoid restarting if already connected or connecting
      if (connection && (connection.state === 'Connected' || connection.state === 'Connecting')) {
          console.log(`${connectionType} connection already established or connecting.`);
          return this[connectionPromiseField] || Promise.resolve(); 
      }
  
      // Return existing promise if a start attempt is already in progress
      if (this[connectionPromiseField]) {
          console.log(`Waiting for existing ${connectionType} connection attempt...`);
          return this[connectionPromiseField];
      }
  
      const promise = (async () => {
          try {
              console.log(`Attempting to establish ${connectionType} SignalR connection...`);
              connection = this.createConnection(hubPath);
              
              if (connectionType === 'user') {
                  this.userConnection = connection;
                  this.setupEventHandlers(this.userConnection, connectionType, this.userCallbacks);
              } else {
                  this.messageConnection = connection;
                  this.setupEventHandlers(this.messageConnection, connectionType, this.messageCallbacks);
              }
  
              // Setup common handlers
              this.setupCommonConnectionHandlers(connection, connectionType);
  
              console.log(`Starting ${connectionType} SignalR connection...`);
              await connection.start();
  
              console.log(`${connectionType} SignalR connected successfully. Connection ID: ${connection.connectionId}`);
              // Check if the *other* connection is also connected to potentially update global state
              this.checkAndUpdateGlobalState(); 
  
          } catch (error) {
              console.error(`${connectionType} SignalR connection failed:`, error);
              if (connectionType === 'user') {
                  this.userConnection = null;
              } else {
                  this.messageConnection = null;
              }
              this.checkAndUpdateGlobalState(); // Update global state after failure
              throw error; // Re-throw error to be caught by the main start() method or caller
          } finally {
              // If the connection succeeded, start activity tracking
              if (connection && connection.state === 'Connected') {
                  this.startActivityTracking();
              }
          }
      })();
  
      this[connectionPromiseField] = promise;
      return promise;
  }

  setupCommonConnectionHandlers(connection, connectionType) {
      connection.onreconnecting((error) => {
          console.warn(`${connectionType} SignalR connection lost. Attempting to reconnect... Error: ${error}`);
          // If either connection starts reconnecting, the overall state is RECONNECTING
          this.setState(ConnectionState.RECONNECTING);
      });

      connection.onreconnected((connectionId) => {
          console.log(`${connectionType} SignalR connection reestablished. New Connection ID: ${connectionId}`);
          // Re-apply event handlers as they might be lost on reconnect
          if (connectionType === 'user') {
              this.setupEventHandlers(this.userConnection, 'user', this.userCallbacks);
          } else {
              this.setupEventHandlers(this.messageConnection, 'message', this.messageCallbacks);
          }
          // Check if both are connected now to potentially move back to CONNECTED state
          this.checkAndUpdateGlobalState();
      });

      connection.onclose((error) => {
          console.error(`${connectionType} SignalR connection closed permanently (will not reconnect automatically). Error: ${error || 'No error provided'}`);
          if (connectionType === 'user') {
              this.userConnection = null;
              this.userConnectionPromise = null; // Clear promise on close
          } else {
              this.messageConnection = null;
              this.messageConnectionPromise = null; // Clear promise on close
          }
          // If either connection closes permanently, update the overall state.
          this.checkAndUpdateGlobalState(); 
      });
  }

  checkAndUpdateGlobalState() {
      const userState = this.userConnection?.state;
      const messageState = this.messageConnection?.state;

      if (userState === 'Connected' && messageState === 'Connected') {
          this.setState(ConnectionState.CONNECTED);
      } else if (userState === 'Reconnecting' || messageState === 'Reconnecting') {
          // If at least one is reconnecting (and none are disconnected unexpectedly)
          this.setState(ConnectionState.RECONNECTING);
      } else if (!this.userConnection && !this.messageConnection) {
           // Both connections are definitively gone (closed or never started properly)
           this.setState(ConnectionState.DISCONNECTED);
      } else if (userState === 'Connecting' || messageState === 'Connecting') {
           // If at least one is still in the initial connecting phase
           this.setState(ConnectionState.CONNECTING); 
      } else {
          // Handle partial states or other scenarios. 
          // If one is connected and the other is null/Disconnected, 
          // or any other combination not covered above, default to DISCONNECTED.
          // Avoid overriding RECONNECTING state prematurely.
           if (this.state !== ConnectionState.RECONNECTING) { 
                this.setState(ConnectionState.DISCONNECTED);
           }
      }
  }

  async stop() {
    console.log('Stopping connection manager...');
    this.stopActivityTracking(); // Stop heartbeats and activity listeners
    const previousState = this.state;
    this.setState(ConnectionState.DISCONNECTED); // Assume disconnection immediately

    // Clear promises to prevent new callers attaching to old stop attempts
    const userStopPromise = this.userConnectionPromise;
    const messageStopPromise = this.messageConnectionPromise;
    this.userConnectionPromise = null;
    this.messageConnectionPromise = null;

    // Wait for any ongoing start attempts before stopping
    try {
        await Promise.all([userStopPromise, messageStopPromise].filter(p => p));
    } catch (error) {
        console.warn('Error during pending connection start while stopping:', error);
        // Proceed with stop regardless
    }

    const stopUser = this.userConnection ? this.userConnection.stop() : Promise.resolve();
    const stopMessage = this.messageConnection ? this.messageConnection.stop() : Promise.resolve();

    try {
      await Promise.all([stopUser, stopMessage]);
      console.log('Both connections stopped.');
    } catch (error) {
      console.error('Error stopping connections:', error);
      // Handle potential errors during stop
    } finally {
      this.userConnection = null;
      this.messageConnection = null;
      // Clear activity listeners on final stop
      this.activityListeners.clear(); 
      // Ensure state is DISCONNECTED unless a reconnect started somehow
      if (this.state !== ConnectionState.RECONNECTING) {
          this.setState(ConnectionState.DISCONNECTED);
      }
      console.log('Connection manager stopped.');
    }
  }

  // --- Event Handlers Setup --- 
  setupEventHandlers(connection, connectionType, callbacks) {
    if (!connection) return;
    console.log(`Setting up event handlers for ${connectionType}...`);

    // Use connection.off().on() pattern to ensure handlers are correctly (re)applied
    if (connectionType === 'user') {
        // Example: Register user-specific handlers using callbacks object
        if (callbacks.onUserStatusChange) {
            connection.off('UserStatusChanged'); 
            connection.on('UserStatusChanged', callbacks.onUserStatusChange);
        }
        // Add file-related event handlers
        if (callbacks.onNewFile) {
            connection.off('ReceiveNewFile');
            connection.on('ReceiveNewFile', callbacks.onNewFile);
        }
        if (callbacks.onUpdatedFile) {
            connection.off('ReceiveUpdatedFile');
            connection.on('ReceiveUpdatedFile', callbacks.onUpdatedFile);
        }
        if (callbacks.onDeletedFile) {
            connection.off('ReceiveDeletedFile');
            connection.on('ReceiveDeletedFile', callbacks.onDeletedFile);
        }
        // Add post-related event handlers
        if (callbacks.onNewPost) {
            connection.off('NewPost');
            connection.on('NewPost', callbacks.onNewPost);
        }
        // Add reply-related event handlers
        if (callbacks.onNewReply) {
            connection.off('NewReply');
            connection.on('NewReply', callbacks.onNewReply);
        }
        if (callbacks.onUpdatedReply) {
            connection.off('UpdatedReply');
            connection.on('UpdatedReply', callbacks.onUpdatedReply);
        }
        if (callbacks.onDeletedReply) {
            connection.off('DeletedReply');
            connection.on('DeletedReply', callbacks.onDeletedReply);
        }
        if (callbacks.onUpdatedPost) {
            connection.off('UpdatedPost');
            connection.on('UpdatedPost', callbacks.onUpdatedPost);
        }
        if (callbacks.onDeletedPost) {
            connection.off('DeletedPost');
            connection.on('DeletedPost', callbacks.onDeletedPost);
        }
        if (callbacks.onPostSummary) {
            connection.off('PostSummary');
            connection.on('PostSummary', callbacks.onPostSummary);
        }
        // Add comment-related event handlers
        if (callbacks.onNewComment) {
            connection.off('NewComment');
            connection.on('NewComment', callbacks.onNewComment);
        }
        if (callbacks.onUpdatedComment) {
            connection.off('UpdatedComment');
            connection.on('UpdatedComment', callbacks.onUpdatedComment);
        }
        if (callbacks.onDeletedComment) {
            connection.off('DeletedComment');
            connection.on('DeletedComment', callbacks.onDeletedComment);
        }
        // Add reaction-related event handlers
        if (callbacks.onNewReaction) {
            connection.off('NewReaction');
            connection.on('NewReaction', callbacks.onNewReaction);
        }
        if (callbacks.onUpdatedReaction) {
            connection.off('UpdatedReaction');
            connection.on('UpdatedReaction', callbacks.onUpdatedReaction);
        }
        if (callbacks.onDeletedReaction) {
            connection.off('DeletedReaction');
            connection.on('DeletedReaction', callbacks.onDeletedReaction);
        }
        if (callbacks.onReactionSummary) {
            connection.off('ReactionSummary');
            connection.on('ReactionSummary', callbacks.onReactionSummary);
        }

    } else if (connectionType === 'message') {
        // Register message-specific handlers using callbacks object
        if (callbacks.onReceiveMessage) {
            connection.off('ReceiveMessage');
            connection.on('ReceiveMessage', callbacks.onReceiveMessage);
        }
        if (callbacks.onMessageRead) {
            connection.off('MessageRead');
            connection.on('MessageRead', callbacks.onMessageRead);
        }
        if (callbacks.onUserTyping) {
            connection.off('UserTyping');
            connection.on('UserTyping', callbacks.onUserTyping);
        }
        // Add other message hub event handlers here
    }
  }

  // File Hub Callbacks
  onNewFile(callback) {
    this.userCallbacks.onNewFile = callback;
    if (this.userConnection?.state === 'Connected') {
      this.setupEventHandlers(this.userConnection, 'user', this.userCallbacks);
    }
  }

  offNewFile() {
    delete this.userCallbacks.onNewFile;
    if (this.userConnection?.state === 'Connected') {
      this.userConnection.off('ReceiveNewFile');
    }
  }

  onUpdatedFile(callback) {
    this.userCallbacks.onUpdatedFile = callback;
    if (this.userConnection?.state === 'Connected') {
      this.setupEventHandlers(this.userConnection, 'user', this.userCallbacks);
    }
  }

  offUpdatedFile() {
    delete this.userCallbacks.onUpdatedFile;
    if (this.userConnection?.state === 'Connected') {
      this.userConnection.off('ReceiveUpdatedFile');
    }
  }

  onDeletedFile(callback) {
    this.userCallbacks.onDeletedFile = callback;
    if (this.userConnection?.state === 'Connected') {
      this.setupEventHandlers(this.userConnection, 'user', this.userCallbacks);
    }
  }

  offDeletedFile() {
    delete this.userCallbacks.onDeletedFile;
    if (this.userConnection?.state === 'Connected') {
      this.userConnection.off('ReceiveDeletedFile');
    }
  }

  // Post Hub Callbacks
  onNewPost(callback) {
    this.userCallbacks.onNewPost = callback;
    if (this.userConnection?.state === 'Connected') {
      this.setupEventHandlers(this.userConnection, 'user', this.userCallbacks);
    }
  }

  offNewPost() {
    delete this.userCallbacks.onNewPost;
    if (this.userConnection?.state === 'Connected') {
      this.userConnection.off('NewPost');
    }
  }

  onUpdatedPost(callback) {
    this.userCallbacks.onUpdatedPost = callback;
    if (this.userConnection?.state === 'Connected') {
      this.setupEventHandlers(this.userConnection, 'user', this.userCallbacks);
    }
  }

  offUpdatedPost() {
    delete this.userCallbacks.onUpdatedPost;
    if (this.userConnection?.state === 'Connected') {
      this.userConnection.off('UpdatedPost');
    }
  }

  onDeletedPost(callback) {
    this.userCallbacks.onDeletedPost = callback;
    if (this.userConnection?.state === 'Connected') {
      this.setupEventHandlers(this.userConnection, 'user', this.userCallbacks);
    }
  }

  offDeletedPost() {
    delete this.userCallbacks.onDeletedPost;
    if (this.userConnection?.state === 'Connected') {
      this.userConnection.off('DeletedPost');
    }
  }

  onPostSummary(callback) {
    this.userCallbacks.onPostSummary = callback;
    if (this.userConnection?.state === 'Connected') {
      this.setupEventHandlers(this.userConnection, 'user', this.userCallbacks);
    }
  }

  offPostSummary() {
    delete this.userCallbacks.onPostSummary;
    if (this.userConnection?.state === 'Connected') {
      this.userConnection.off('PostSummary');
    }
  }

  // Comment Hub Callbacks
  onNewComment(callback) {
    this.userCallbacks.onNewComment = callback;
    if (this.userConnection?.state === 'Connected') {
        this.setupEventHandlers(this.userConnection, 'user', this.userCallbacks);
    }
  }

  offNewComment() {
    delete this.userCallbacks.onNewComment;
    if (this.userConnection?.state === 'Connected') {
        this.userConnection.off('NewComment');
    }
  }

  onUpdatedComment(callback) {
    this.userCallbacks.onUpdatedComment = callback;
    if (this.userConnection?.state === 'Connected') {
        this.setupEventHandlers(this.userConnection, 'user', this.userCallbacks);
    }
  }

  offUpdatedComment() {
    delete this.userCallbacks.onUpdatedComment;
    if (this.userConnection?.state === 'Connected') {
        this.userConnection.off('UpdatedComment');
    }
  }

  onDeletedComment(callback) {
    this.userCallbacks.onDeletedComment = callback;
    if (this.userConnection?.state === 'Connected') {
        this.setupEventHandlers(this.userConnection, 'user', this.userCallbacks);
    }
  }

  offDeletedComment() {
    delete this.userCallbacks.onDeletedComment;
    if (this.userConnection?.state === 'Connected') {
        this.userConnection.off('DeletedComment');
    }
  }

  // Reaction Hub Callbacks
  onNewReaction(callback) {
    this.userCallbacks.onNewReaction = callback;
    if (this.userConnection?.state === 'Connected') {
        this.setupEventHandlers(this.userConnection, 'user', this.userCallbacks);
    }
  }

  offNewReaction() {
    delete this.userCallbacks.onNewReaction;
    if (this.userConnection?.state === 'Connected') {
        this.userConnection.off('NewReaction');
    }
  }

  onUpdatedReaction(callback) {
    this.userCallbacks.onUpdatedReaction = callback;
    if (this.userConnection?.state === 'Connected') {
        this.setupEventHandlers(this.userConnection, 'user', this.userCallbacks);
    }
  }

  offUpdatedReaction() {
    delete this.userCallbacks.onUpdatedReaction;
    if (this.userConnection?.state === 'Connected') {
        this.userConnection.off('UpdatedReaction');
    }
  }

  onDeletedReaction(callback) {
    this.userCallbacks.onDeletedReaction = callback;
    if (this.userConnection?.state === 'Connected') {
        this.setupEventHandlers(this.userConnection, 'user', this.userCallbacks);
    }
  }

  offDeletedReaction() {
    delete this.userCallbacks.onDeletedReaction;
    if (this.userConnection?.state === 'Connected') {
        this.userConnection.off('DeletedReaction');
    }
  }

  onReactionSummary(callback) {
    this.userCallbacks.onReactionSummary = callback;
    if (this.userConnection?.state === 'Connected') {
        this.setupEventHandlers(this.userConnection, 'user', this.userCallbacks);
    }
  }

  offReactionSummary() {
    delete this.userCallbacks.onReactionSummary;
    if (this.userConnection?.state === 'Connected') {
        this.userConnection.off('ReactionSummary');
    }
  }

  // Reply Hub Callbacks
  onNewReply(callback) {
    this.userCallbacks.onNewReply = callback;
    if (this.userConnection?.state === 'Connected') {
        this.setupEventHandlers(this.userConnection, 'user', this.userCallbacks);
    }
  }

  offNewReply() {
    delete this.userCallbacks.onNewReply;
    if (this.userConnection?.state === 'Connected') {
        this.userConnection.off('NewReply');
    }
  }

  onUpdatedReply(callback) {
    this.userCallbacks.onUpdatedReply = callback;
    if (this.userConnection?.state === 'Connected') {
        this.setupEventHandlers(this.userConnection, 'user', this.userCallbacks);
    }
  }

  offUpdatedReply() {
    delete this.userCallbacks.onUpdatedReply;
    if (this.userConnection?.state === 'Connected') {
        this.userConnection.off('UpdatedReply');
    }
  }

  onDeletedReply(callback) {
    this.userCallbacks.onDeletedReply = callback;
    if (this.userConnection?.state === 'Connected') {
        this.setupEventHandlers(this.userConnection, 'user', this.userCallbacks);
    }
  }

  offDeletedReply() {
    delete this.userCallbacks.onDeletedReply;
    if (this.userConnection?.state === 'Connected') {
        this.userConnection.off('DeletedReply');
    }
  }

  // --- Method Invocation --- 
  async invokeHub(connectionType, methodName, ...args) {
      const connection = connectionType === 'user' ? this.userConnection : this.messageConnection;
      const hubName = connectionType === 'user' ? 'User' : 'Message';

      if (!connection || connection.state !== 'Connected') {
          console.warn(`${hubName} hub connection not ready for ${methodName}. Attempting to ensure connection...`);
          try {
              await this.start(); // Ensure connections are attempted/re-established
              const updatedConnection = connectionType === 'user' ? this.userConnection : this.messageConnection;
              if (!updatedConnection || updatedConnection.state !== 'Connected') {
                  throw new Error(`${hubName} hub connection failed or not ready after attempt for invoking ${methodName}`);
              }
              // If connection re-established, use the new connection object
              return await updatedConnection.invoke(methodName, ...args);
          } catch (error) {
              console.error(`Error ensuring connection for ${hubName} hub method ${methodName}:`, error);
              throw error; // Re-throw the error after attempting to connect
          }
      }
      // If already connected, proceed with invocation
      try {
          return await connection.invoke(methodName, ...args);
      } catch (error) {
          console.error(`Error invoking ${hubName} hub method ${methodName}:`, error);
          // Potentially check for specific error types (e.g., connection closed during invoke)
          throw error;
      }
  }

  async invokeUserHub(methodName, ...args) {
      return this.invokeHub('user', methodName, ...args);
  }

  async invokeMessageHub(methodName, ...args) {
      return this.invokeHub('message', methodName, ...args);
  }

  // --- Specific Message Hub Methods ---
  async sendMessage(content, conversationId, attachmentUrl = null) {
    return this.invokeMessageHub('sendMessage', { content, conversationId, attachmentUrl });
  }

  async markMessageAsRead(messageId) {
    return this.invokeMessageHub('markMessageAsRead', messageId);
  }

  async sendTypingIndicator(conversationId) {
    return this.invokeMessageHub('sendTypingIndicator', conversationId);
  }

  async joinConversation(conversationId) {
    return this.invokeMessageHub('joinConversation', conversationId);
  }

  async leaveConversation(conversationId) {
    return this.invokeMessageHub('leaveConversation', conversationId);
  }

  // --- Getters ---
  isConnected() {
      return this.state === ConnectionState.CONNECTED;
  }

  getCurrentState() {
      return this.state;
  }

  // User Status Change Callbacks
  onUserStatusChange(callback) {
    this.userCallbacks.onUserStatusChange = callback;
    if (this.userConnection?.state === 'Connected') {
      this.setupEventHandlers(this.userConnection, 'user', this.userCallbacks);
    }
  }

  offUserStatusChange() {
    delete this.userCallbacks.onUserStatusChange;
    if (this.userConnection?.state === 'Connected') {
      this.userConnection.off('UserStatusChanged');
    }
  }

  // Message Hub Callbacks
  onReceiveMessage(callback) {
    this.messageCallbacks.onReceiveMessage = callback;
    if (this.messageConnection?.state === 'Connected') {
      this.setupEventHandlers(this.messageConnection, 'message', this.messageCallbacks);
    }
  }

  offReceiveMessage() {
    delete this.messageCallbacks.onReceiveMessage;
    if (this.messageConnection?.state === 'Connected') {
      this.messageConnection.off('ReceiveMessage');
    }
  }

  onMessageRead(callback) {
    this.messageCallbacks.onMessageRead = callback;
    if (this.messageConnection?.state === 'Connected') {
      this.setupEventHandlers(this.messageConnection, 'message', this.messageCallbacks);
    }
  }

  offMessageRead() {
    delete this.messageCallbacks.onMessageRead;
    if (this.messageConnection?.state === 'Connected') {
      this.messageConnection.off('MessageRead');
    }
  }

  onUserTyping(callback) {
    this.messageCallbacks.onUserTyping = callback;
    if (this.messageConnection?.state === 'Connected') {
      this.setupEventHandlers(this.messageConnection, 'message', this.messageCallbacks);
    }
  }

  offUserTyping() {
    delete this.messageCallbacks.onUserTyping;
    if (this.messageConnection?.state === 'Connected') {
      this.messageConnection.off('UserTyping');
    }
  }
}

// Create a singleton instance
const connectionManager = new ConnectionManager();

export default connectionManager;
export { ConnectionState }; // Export the enum for use in components
