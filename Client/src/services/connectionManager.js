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
            this[connectionPromiseField] = null; // Clear the promise on failure
            throw error; // Re-throw error to be caught by the main start() method or caller
        } finally {
             // Clear the promise field once the connection attempt is fully resolved or rejected
             // This might need adjustment depending on how retries interact
             // If using withAutomaticReconnect, the connection object persists, 
             // but the initial start promise should resolve/reject.
             // Let's clear it here for now.
             // this[connectionPromiseField] = null; 
             // Reconsidering: Don't clear here, let start() manage the top-level promises.
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
        // Add other user hub event handlers here (e.g., onUserNotification)
        // connection.off('ReceiveNotification');
        // connection.on('ReceiveNotification', callbacks.onReceiveNotification);

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

  // --- Callback Registration and Removal --- 
  // User Hub Callbacks
  onUserStatusChange(callback) {
    this.userCallbacks.onUserStatusChange = callback;
    // Re-apply handler if connection is active
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

  // Add other message hub callback registration methods here...

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
}

// Create a singleton instance
const connectionManager = new ConnectionManager();

export default connectionManager;
export { ConnectionState }; // Export the enum for use in components