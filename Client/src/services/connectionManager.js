import {
  HubConnectionBuilder,
  LogLevel,
  HttpTransportType,
} from "@microsoft/signalr";

const ConnectionState = {
  DISCONNECTED: "Disconnected",
  CONNECTING: "Connecting",
  CONNECTED: "Connected",
  RECONNECTING: "Reconnecting",
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
    this.invokeHub = this.invokeHub.bind(this);
    this.ensureUserConnection = this.ensureUserConnection.bind(this);
    this.ensureMessageConnection = this.ensureMessageConnection.bind(this);
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
    this.stateListeners.forEach((listener) => listener(this.state));
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

    console.log("Starting activity tracking...");
    this.lastActivityTime = Date.now();
    this.isUserActive = true;
    this.notifyActivityChange();

    // Initial heartbeat
    this.sendHeartbeat();

    // Set up heartbeat interval using an arrow function to ensure 'this' context
    this.heartbeatIntervalId = setInterval(
      () => this.sendHeartbeat(), // Use arrow function to preserve 'this'
      this.HEARTBEAT_INTERVAL
    );

    // Set up inactivity check
    this.resetInactivityTimeout();

    // Add event listeners for user activity
    window.addEventListener("mousemove", this.handleUserActivity, {
      passive: true,
    });
    window.addEventListener("keydown", this.handleUserActivity, {
      passive: true,
    });
    window.addEventListener("scroll", this.handleUserActivity, {
      passive: true,
    });
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
    window.removeEventListener("mousemove", this.handleUserActivity);
    window.removeEventListener("keydown", this.handleUserActivity);
    window.removeEventListener("scroll", this.handleUserActivity);
    this.isUserActive = false; // Mark as inactive when tracking stops
    this.notifyActivityChange();
    console.log("Activity tracking stopped.");
  }

  handleUserActivity() {
    this.lastActivityTime = Date.now();
    if (!this.isUserActive) {
      this.isUserActive = true;
      this.notifyActivityChange();
      console.log("User became active.");
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
    this.inactivityTimeoutId = setTimeout(
      this.checkInactivity,
      this.INACTIVITY_TIMEOUT
    );
  }

  checkInactivity() {
    const now = Date.now();
    if (
      this.isUserActive &&
      now - this.lastActivityTime >= this.INACTIVITY_TIMEOUT
    ) {
      this.isUserActive = false;
      this.notifyActivityChange();
      console.log("User became inactive due to timeout.");
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
      // Use invokeUserHub instead of invokeHubMethod
      await this.invokeUserHub("UpdateActivity");
      // console.log('Heartbeat sent successfully.');
    } catch (error) {
      // Avoid logging frequent errors if server isn't ready or during disconnects
      if (this.state === ConnectionState.CONNECTED) {
        console.error("Failed to send heartbeat:", error);
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
    this.activityListeners.forEach((listener) => listener(this.isUserActive));
  }

  // --- Connection Factory (Internal) ---
  createConnection(hubPath) {
    const token = localStorage.getItem("token");
    if (!token) {
      console.error(`Authentication token not found for ${hubPath}`);
      throw new Error("Authentication token not found");
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
  async start() {
    if (this.state === ConnectionState.CONNECTED) {
      console.log("Connection manager already started.");
      // Ensure activity tracking is running if already connected
      this.startActivityTracking();
      return Promise.resolve();
    }

    if (this.state === ConnectionState.CONNECTING) {
      console.log("Connection manager already starting.");
      return Promise.all(
        [this.userConnectionPromise, this.messageConnectionPromise].filter(
          Boolean
        )
      );
    }

    this.setState(ConnectionState.CONNECTING);

    // Add retry logic
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        // Try to connect
        this.userConnectionPromise = this.startSpecificConnection(
          "/hubs/user",
          "user"
        );
        this.messageConnectionPromise = this.startSpecificConnection(
          "/hubs/message",
          "message"
        );

        await Promise.all([
          this.userConnectionPromise,
          this.messageConnectionPromise,
        ]);
        this.checkAndUpdateGlobalState();

        if (this.state === ConnectionState.CONNECTED) {
          return;
        }

        throw new Error("Failed to establish connections properly");
      } catch (error) {
        console.error(`Connection attempt ${retryCount + 1} failed:`, error);
        retryCount++;

        if (retryCount >= maxRetries) {
          this.setState(ConnectionState.DISCONNECTED);
          await this.stop();
          throw new Error(`Failed to connect after ${maxRetries} attempts`);
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  async startSpecificConnection(hubPath, connectionType) {
    let connection =
      connectionType === "user" ? this.userConnection : this.messageConnection;
    let connectionPromiseField =
      connectionType === "user"
        ? "userConnectionPromise"
        : "messageConnectionPromise";

    // Avoid restarting if already connected or connecting
    if (
      connection &&
      (connection.state === "Connected" || connection.state === "Connecting")
    ) {
      console.log(
        `${connectionType} connection already established or connecting.`
      );
      return this[connectionPromiseField] || Promise.resolve();
    }

    // Return existing promise if a start attempt is already in progress
    if (this[connectionPromiseField]) {
      console.log(
        `Waiting for existing ${connectionType} connection attempt...`
      );
      return this[connectionPromiseField];
    }

    const promise = (async () => {
      try {
        console.log(
          `Attempting to establish ${connectionType} SignalR connection...`
        );
        connection = this.createConnection(hubPath);

        if (connectionType === "user") {
          this.userConnection = connection;
          this.setupEventHandlers(
            this.userConnection,
            connectionType,
            this.userCallbacks
          );
        } else {
          this.messageConnection = connection;
          this.setupEventHandlers(
            this.messageConnection,
            connectionType,
            this.messageCallbacks
          );
        }

        // Setup common handlers
        this.setupCommonConnectionHandlers(connection, connectionType);

        console.log(`Starting ${connectionType} SignalR connection...`);
        await connection.start();

        console.log(
          `${connectionType} SignalR connected successfully. Connection ID: ${connection.connectionId}`
        );
        // Check if the *other* connection is also connected to potentially update global state
        this.checkAndUpdateGlobalState();
      } catch (error) {
        console.error(`${connectionType} SignalR connection failed:`, error);
        if (connectionType === "user") {
          this.userConnection = null;
        } else {
          this.messageConnection = null;
        }
        this.checkAndUpdateGlobalState(); // Update global state after failure
        throw error; // Re-throw error to be caught by the main start() method or caller
      } finally {
        // If the connection succeeded, start activity tracking
        if (connection && connection.state === "Connected") {
          this.startActivityTracking();
        }
      }
    })();

    this[connectionPromiseField] = promise;
    return promise;
  }

  setupCommonConnectionHandlers(connection, connectionType) {
    connection.onreconnecting((error) => {
      console.warn(
        `${connectionType} SignalR connection lost. Attempting to reconnect... Error: ${error}`
      );
      // If either connection starts reconnecting, the overall state is RECONNECTING
      this.setState(ConnectionState.RECONNECTING);
    });

    connection.onreconnected((connectionId) => {
      console.log(
        `${connectionType} SignalR connection reestablished. New Connection ID: ${connectionId}`
      );
      // Re-apply event handlers as they might be lost on reconnect
      if (connectionType === "user") {
        this.setupEventHandlers(
          this.userConnection,
          "user",
          this.userCallbacks
        );
      } else {
        this.setupEventHandlers(
          this.messageConnection,
          "message",
          this.messageCallbacks
        );
      }
      // Check if both are connected now to potentially move back to CONNECTED state
      this.checkAndUpdateGlobalState();
    });

    connection.onclose((error) => {
      console.error(
        `${connectionType} SignalR connection closed permanently (will not reconnect automatically). Error: ${
          error || "No error provided"
        }`
      );
      if (connectionType === "user") {
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

    if (userState === "Connected" && messageState === "Connected") {
      this.setState(ConnectionState.CONNECTED);
    } else if (
      userState === "Reconnecting" ||
      messageState === "Reconnecting"
    ) {
      // If at least one is reconnecting (and none are disconnected unexpectedly)
      this.setState(ConnectionState.RECONNECTING);
    } else if (!this.userConnection && !this.messageConnection) {
      // Both connections are definitively gone (closed or never started properly)
      this.setState(ConnectionState.DISCONNECTED);
    } else if (userState === "Connecting" || messageState === "Connecting") {
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
    console.log("Stopping connection manager...");
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
      await Promise.all([userStopPromise, messageStopPromise].filter((p) => p));
    } catch (error) {
      console.warn(
        "Error during pending connection start while stopping:",
        error
      );
      // Proceed with stop regardless
    }

    const stopUser = this.userConnection
      ? this.userConnection.stop()
      : Promise.resolve();
    const stopMessage = this.messageConnection
      ? this.messageConnection.stop()
      : Promise.resolve();

    try {
      await Promise.all([stopUser, stopMessage]);
      console.log("Both connections stopped.");
    } catch (error) {
      console.error("Error stopping connections:", error);
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
      console.log("Connection manager stopped.");
    }
  }

  // --- Event Handlers Setup ---
  setupEventHandlers(connection, connectionType, callbacks) {
    if (!connection) return;
    console.log(`Setting up event handlers for ${connectionType}...`);

    // Use connection.off().on() pattern to ensure handlers are correctly (re)applied
    if (connectionType === "user") {
      // Fix for userstatuschanged case sensitivity issue
      if (callbacks.onUserStatusChange) {
        // First, remove any existing handlers to avoid duplicates
        connection.off("UserStatusChanged");
        connection.off("userstatuschanged");
        
        // Register with both case variations to ensure compatibility
        connection.on("UserStatusChanged", (userId, isOnline, lastSeen) => {
          callbacks.onUserStatusChange(userId, isOnline, lastSeen);
        });
        
        connection.on("userstatuschanged", (userId, isOnline, lastSeen) => {
          callbacks.onUserStatusChange(userId, isOnline, lastSeen);
        });
      }
    } else if (connectionType === "message") {
      // Register message-specific handlers using callbacks object
      if (callbacks.onReceiveMessage) {
        connection.off("ReceiveMessage");
        connection.off("receivemessage");
        connection.on("ReceiveMessage", callbacks.onReceiveMessage);
        connection.on("receivemessage", callbacks.onReceiveMessage);
      }
      
      if (callbacks.onMessageRead) {
        connection.off("MessageRead");
        connection.off("messageread");
        connection.on("MessageRead", callbacks.onMessageRead);
        connection.on("messageread", callbacks.onMessageRead);
      }
      
      if (callbacks.onUserTyping) {
        connection.off("UserTyping");
        connection.off("usertyping");
        // Register with both case variations to ensure compatibility
        connection.on("UserTyping", callbacks.onUserTyping);
        connection.on("usertyping", callbacks.onUserTyping);
      }
      
      if (callbacks.onMessageEdited) {
        connection.off("MessageEdited");
        connection.off("messageedited");
        connection.on("MessageEdited", callbacks.onMessageEdited);
        connection.on("messageedited", callbacks.onMessageEdited);
      }
      
      if (callbacks.onMessageUnsent) {
        connection.off("MessageUnsent");
        connection.off("messageunsent");
        connection.on("MessageUnsent", callbacks.onMessageUnsent);
        connection.on("messageunsent", callbacks.onMessageUnsent);
      }
      
      if (callbacks.onMessageDeleted) {
        connection.off("MessageDeleted");
        connection.off("messagedeleted");
        connection.on("MessageDeleted", callbacks.onMessageDeleted);
        connection.on("messagedeleted", callbacks.onMessageDeleted);
      }
    }
  }

  // --- Message Hub Event Handling ---
  registerMessageHandler(eventName, callback) {
    if (!this.messageCallbacks[eventName]) {
      this.messageCallbacks[eventName] = new Set();
    }
    this.messageCallbacks[eventName].add(callback);

    // Ensure the SignalR handler is registered only once
    if (this.messageConnection && this.messageCallbacks[eventName].size === 1) {
      // Register with original case
      this.messageConnection.on(eventName, (...args) => {
        this.messageCallbacks[eventName].forEach(cb => cb(...args));
      });
      
      // Register with lowercase version too
      const lowerCaseEventName = eventName.toLowerCase();
      if (lowerCaseEventName !== eventName) {
        this.messageConnection.on(lowerCaseEventName, (...args) => {
          this.messageCallbacks[eventName].forEach(cb => cb(...args));
        });
      }
    }
  }

  unregisterMessageHandler(eventName, callback) {
    if (this.messageCallbacks[eventName]) {
      this.messageCallbacks[eventName].delete(callback);
      if (this.messageCallbacks[eventName].size === 0 && this.messageConnection) {
        // Clean up both case variations
        this.messageConnection.off(eventName);
        this.messageConnection.off(eventName.toLowerCase());
      }
    }
  }

  // --- Connection Readiness Checks ---
  async ensureUserConnection() {
    if (this.userConnection && this.userConnection.state === "Connected") {
      return; // Already connected
    }
    if (!this.userConnectionPromise) {
      console.warn("User connection start not initiated, attempting to start...");
      // Optionally trigger start if not already in progress, or throw error
      await this.start(); // Start connection if not already in progress
    }
    console.log("Waiting for user connection to be ready...");
    await this.userConnectionPromise;
    if (!this.userConnection || this.userConnection.state !== "Connected") {
      throw new Error("Failed to establish user connection.");
    }
    console.log("User connection is ready.");
  }

  async ensureMessageConnection() {
    if (this.messageConnection && this.messageConnection.state === "Connected") {
      return; // Already connected
    }
    if (!this.messageConnectionPromise) {
      console.warn("Message connection start not initiated, attempting to start...");
      // Optionally trigger start if not already in progress
      await this.start(); // Start connection if not already in progress
    }
    console.log("Waiting for message connection to be ready...");
    await this.messageConnectionPromise;
    if (!this.messageConnection || this.messageConnection.state !== "Connected") {
      throw new Error("Failed to establish message connection.");
    }
    console.log("Message connection is ready.");
  }

  // --- Invoke Hub Methods ---
  async invokeHub(hubType, methodName, ...args) {
    let connection;
    let connectionName;

    if (hubType === "user") {
      await this.ensureUserConnection(); // Ensure connection is ready
      connection = this.userConnection;
      connectionName = "UserHub";
    } else if (hubType === "message") {
      await this.ensureMessageConnection(); // Ensure connection is ready
      connection = this.messageConnection;
      connectionName = "MessageHub";
    } else {
      console.error(`Invalid hub type specified: ${hubType}`);
      throw new Error(`Invalid hub type: ${hubType}`);
    }

    if (!connection || connection.state !== "Connected") {
      console.error(`Cannot invoke ${methodName}, ${connectionName} connection not ready.`);
      throw new Error(`${connectionName} connection not available`);
    }

    try {
      console.debug(`Invoking ${methodName} on ${connectionName} with args:`, args);
      return await connection.invoke(methodName, ...args);
    } catch (err) {
      console.error(`Error invoking ${methodName} on ${connectionName}:`, err);
      // Handle specific errors, e.g., re-authentication
      throw err;
    }
  }

  // --- Specific User Hub Methods ---
  async invokeUserHub(methodName, ...args) {
    return this.invokeHub("user", methodName, ...args);
  }

  // --- Specific Message Hub Methods ---
  async invokeMessageHub(methodName, ...args) {
    return this.invokeHub("message", methodName, ...args);
  }

  // --- Specific Message Hub Methods ---
  async sendMessage(messageDto) {
    try {
      console.log(`Sending message to conversation ${messageDto.conversationId}`, messageDto);
      return await this.invokeHub("message", "SendMessage", messageDto);
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  async markMessageAsRead(messageId) {
    return this.invokeHub("message", "MarkMessageAsRead", messageId);
  }

  async sendTypingIndicator(conversationId) {
    return this.invokeHub("message", "SendTypingIndicator", conversationId);
  }

  async stopTypingIndicator(conversationId) {
    // Client-side handling for typing indicator timeout
    console.log("Client stopped typing indicator display for", conversationId);
  }

  async editMessage(editDto) {
    try {
      console.log(`Editing message ${editDto.messageId}`, editDto);
      // Try both case variations to ensure compatibility with server implementation
      try {
        return await this.invokeHub("message", "EditMessage", editDto.messageId, editDto.updatedContent);
      } catch (error) {
        // If the first attempt fails, try with lowercase method name
        if (error.message && error.message.includes("Unauthorized")) {
          console.warn("Authorization error with EditMessage, checking message ownership...");
          throw error; // Re-throw the authorization error as it's a legitimate error
        }
        // Try lowercase version as fallback for other errors
        return await this.invokeHub("message", "editmessage", editDto.messageId, editDto.updatedContent);
      }
    } catch (error) {
      console.error("Error editing message:", error);
      throw error;
    }
  }

  async unsendMessage(messageId) {
    return this.invokeHub("message", "UnsendMessage", messageId);
  }

  async deleteMessage(messageId) {
    return this.invokeHub("message", "DeleteMessageForUser", messageId);
  }

  async joinConversation(conversationId) {
    return this.invokeHub("message", "JoinConversation", conversationId);
  }

  async leaveConversation(conversationId) {
    return this.invokeHub("message", "LeaveConversation", conversationId);
  }

  // --- Getters ---
  isConnected() {
    return this.state === ConnectionState.CONNECTED;
  }

  getCurrentState() {
    return this.state;
  }

  // --- Event Registration Methods ---
  // User Status Change Callbacks
  onUserStatusChange(callback) {
    this.userCallbacks.onUserStatusChange = (userId, isOnline, lastSeen) => {
      callback(userId, isOnline, lastSeen);
    };

    if (this.userConnection?.state === "Connected") {
      this.setupEventHandlers(this.userConnection, "user", this.userCallbacks);
    }
  }

  offUserStatusChange() {
    delete this.userCallbacks.onUserStatusChange;
    if (this.userConnection?.state === "Connected") {
      this.userConnection.off("UserStatusChanged");
      this.userConnection.off("userstatuschanged");
    }
  }

  // Message Hub Callbacks
  onReceiveMessage(callback) {
    this.messageCallbacks.onReceiveMessage = callback;
    if (this.messageConnection?.state === "Connected") {
      this.messageConnection.off("ReceiveMessage");
      this.messageConnection.off("receivemessage");
      this.messageConnection.on("ReceiveMessage", callback);
      this.messageConnection.on("receivemessage", callback);
    }
  }

  offReceiveMessage() {
    delete this.messageCallbacks.onReceiveMessage;
    if (this.messageConnection?.state === "Connected") {
      this.messageConnection.off("ReceiveMessage");
      this.messageConnection.off("receivemessage");
    }
  }

  onMessageRead(callback) {
    this.messageCallbacks.onMessageRead = callback;
    if (this.messageConnection?.state === "Connected") {
      this.messageConnection.off("MessageRead");
      this.messageConnection.off("messageread");
      this.messageConnection.on("MessageRead", callback);
      this.messageConnection.on("messageread", callback);
    }
  }

  offMessageRead() {
    delete this.messageCallbacks.onMessageRead;
    if (this.messageConnection?.state === "Connected") {
      this.messageConnection.off("MessageRead");
      this.messageConnection.off("messageread");
    }
  }

  onUserTyping(callback) {
    this.messageCallbacks.onUserTyping = callback;
    if (this.messageConnection?.state === "Connected") {
      this.messageConnection.off("UserTyping");
      this.messageConnection.off("usertyping");
      this.messageConnection.on("UserTyping", callback);
      this.messageConnection.on("usertyping", callback);
    }
  }

  offUserTyping() {
    delete this.messageCallbacks.onUserTyping;
    if (this.messageConnection?.state === "Connected") {
      this.messageConnection.off("UserTyping");
      this.messageConnection.off("usertyping");
    }
  }

  onMessageEdited(callback) {
    this.messageCallbacks.onMessageEdited = callback;
    if (this.messageConnection?.state === "Connected") {
      this.messageConnection.off("MessageEdited");
      this.messageConnection.off("messageedited");
      this.messageConnection.on("MessageEdited", callback);
      this.messageConnection.on("messageedited", callback);
    }
  }

  offMessageEdited() {
    delete this.messageCallbacks.onMessageEdited;
    if (this.messageConnection?.state === "Connected") {
      this.messageConnection.off("MessageEdited");
      this.messageConnection.off("messageedited");
    }
  }

  onMessageUnsent(callback) {
    this.messageCallbacks.onMessageUnsent = callback;
    if (this.messageConnection?.state === "Connected") {
      this.messageConnection.off("MessageUnsent");
      this.messageConnection.off("messageunsent");
      this.messageConnection.on("MessageUnsent", callback);
      this.messageConnection.on("messageunsent", callback);
    }
  }

  offMessageUnsent() {
    delete this.messageCallbacks.onMessageUnsent;
    if (this.messageConnection?.state === "Connected") {
      this.messageConnection.off("MessageUnsent");
      this.messageConnection.off("messageunsent");
    }
  }

  onMessageDeleted(callback) {
    this.messageCallbacks.onMessageDeleted = callback;
    if (this.messageConnection?.state === "Connected") {
      this.messageConnection.off("MessageDeleted");
      this.messageConnection.off("messagedeleted");
      this.messageConnection.on("MessageDeleted", callback);
      this.messageConnection.on("messagedeleted", callback);
    }
  }

  offMessageDeleted() {
    delete this.messageCallbacks.onMessageDeleted;
    if (this.messageConnection?.state === "Connected") {
      this.messageConnection.off("MessageDeleted");
      this.messageConnection.off("messagedeleted");
    }
  }
}

// Create a singleton instance
const connectionManager = new ConnectionManager();

export default connectionManager;
export { ConnectionState }; // Export the enum for use in components