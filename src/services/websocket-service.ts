/**
 * WebSocket Service for Real-time Updates
 * Provides real-time communication for live notifications and updates
 * Note: Cloudflare Workers support WebSockets via Durable Objects
 */

export interface WebSocketMessage {
  type: 'notification' | 'risk_update' | 'asset_change' | 'compliance_update' | 'system_alert';
  data: any;
  timestamp: string;
  userId?: string;
  broadcast?: boolean;
}

export interface WebSocketConnection {
  id: string;
  userId: string;
  websocket: WebSocket;
  lastPing: number;
  subscriptions: string[];
}

export interface NotificationMessage {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: 'security' | 'compliance' | 'risk' | 'incident' | 'system';
  userId?: string;
  url?: string;
  actions?: Array<{
    label: string;
    action: string;
    style?: 'primary' | 'secondary' | 'danger';
  }>;
}

/**
 * WebSocket Manager using Cloudflare Durable Objects
 */
export class WebSocketManager {
  private connections: Map<string, WebSocketConnection> = new Map();
  private rooms: Map<string, Set<string>> = new Map(); // room -> connection IDs
  private userConnections: Map<string, Set<string>> = new Map(); // userId -> connection IDs

  constructor() {
    // Set up periodic cleanup
    setInterval(() => this.cleanup(), 30000); // Every 30 seconds
  }

  /**
   * Handle new WebSocket connection
   */
  async handleConnection(request: Request, userId: string): Promise<Response> {
    try {
      const upgradeHeader = request.headers.get('Upgrade');
      if (upgradeHeader !== 'websocket') {
        return new Response('Expected Upgrade: websocket', { status: 426 });
      }

      // Create WebSocket pair
      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);

      // Accept the connection
      server.accept();

      // Generate connection ID
      const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      // Store connection
      const connection: WebSocketConnection = {
        id: connectionId,
        userId,
        websocket: server,
        lastPing: Date.now(),
        subscriptions: ['global'] // Default subscription
      };

      this.connections.set(connectionId, connection);

      // Track user connections
      if (!this.userConnections.has(userId)) {
        this.userConnections.set(userId, new Set());
      }
      this.userConnections.get(userId)!.add(connectionId);

      // Join default room
      this.joinRoom(connectionId, 'global');
      this.joinRoom(connectionId, `user_${userId}`);

      // Set up connection handlers
      this.setupConnectionHandlers(connection);

      // Send welcome message
      this.sendToConnection(connectionId, {
        type: 'notification',
        data: {
          id: 'welcome',
          title: 'Connected',
          message: 'Real-time updates enabled',
          type: 'success',
          category: 'system'
        },
        timestamp: new Date().toISOString()
      });

      console.log(`WebSocket connection established: ${connectionId} (user: ${userId})`);

      // Return the client WebSocket as response
      return new Response(null, {
        status: 101,
        webSocket: client
      });

    } catch (error) {
      console.error('WebSocket connection error:', error);
      return new Response('WebSocket connection failed', { status: 500 });
    }
  }

  /**
   * Set up event handlers for a connection
   */
  private setupConnectionHandlers(connection: WebSocketConnection): void {
    const { websocket, id, userId } = connection;

    websocket.addEventListener('message', (event) => {
      try {
        const message = JSON.parse(event.data as string);
        this.handleMessage(id, message);
      } catch (error) {
        console.error(`Error handling message from ${id}:`, error);
      }
    });

    websocket.addEventListener('close', (event) => {
      console.log(`WebSocket connection closed: ${id} (user: ${userId})`);
      this.removeConnection(id);
    });

    websocket.addEventListener('error', (event) => {
      console.error(`WebSocket error for ${id}:`, event);
      this.removeConnection(id);
    });

    // Send periodic ping
    const pingInterval = setInterval(() => {
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.send(JSON.stringify({ type: 'ping', timestamp: new Date().toISOString() }));
        connection.lastPing = Date.now();
      } else {
        clearInterval(pingInterval);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Handle incoming messages from clients
   */
  private handleMessage(connectionId: string, message: any): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    switch (message.type) {
      case 'pong':
        connection.lastPing = Date.now();
        break;
        
      case 'subscribe':
        if (message.room) {
          this.joinRoom(connectionId, message.room);
          connection.subscriptions.push(message.room);
        }
        break;
        
      case 'unsubscribe':
        if (message.room) {
          this.leaveRoom(connectionId, message.room);
          connection.subscriptions = connection.subscriptions.filter(sub => sub !== message.room);
        }
        break;
        
      case 'risk_update':
      case 'asset_change':
      case 'compliance_update':
        // Broadcast to relevant subscribers
        this.broadcastToRoom(message.room || 'global', {
          type: message.type,
          data: message.data,
          timestamp: new Date().toISOString(),
          userId: connection.userId
        });
        break;

      default:
        console.log(`Unknown message type from ${connectionId}:`, message.type);
    }
  }

  /**
   * Send message to a specific connection
   */
  sendToConnection(connectionId: string, message: WebSocketMessage): boolean {
    const connection = this.connections.get(connectionId);
    if (!connection || connection.websocket.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      connection.websocket.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error(`Error sending to ${connectionId}:`, error);
      this.removeConnection(connectionId);
      return false;
    }
  }

  /**
   * Send message to all connections for a user
   */
  sendToUser(userId: string, message: WebSocketMessage): number {
    const userConnIds = this.userConnections.get(userId);
    if (!userConnIds) return 0;

    let sentCount = 0;
    for (const connectionId of userConnIds) {
      if (this.sendToConnection(connectionId, message)) {
        sentCount++;
      }
    }

    return sentCount;
  }

  /**
   * Broadcast message to all connections in a room
   */
  broadcastToRoom(room: string, message: WebSocketMessage): number {
    const roomConnections = this.rooms.get(room);
    if (!roomConnections) return 0;

    let sentCount = 0;
    for (const connectionId of roomConnections) {
      if (this.sendToConnection(connectionId, message)) {
        sentCount++;
      }
    }

    console.log(`Broadcasted to room ${room}: ${sentCount} connections`);
    return sentCount;
  }

  /**
   * Broadcast to all connections
   */
  broadcastToAll(message: WebSocketMessage): number {
    return this.broadcastToRoom('global', message);
  }

  /**
   * Join a room
   */
  private joinRoom(connectionId: string, room: string): void {
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)!.add(connectionId);
  }

  /**
   * Leave a room
   */
  private leaveRoom(connectionId: string, room: string): void {
    const roomConnections = this.rooms.get(room);
    if (roomConnections) {
      roomConnections.delete(connectionId);
      if (roomConnections.size === 0) {
        this.rooms.delete(room);
      }
    }
  }

  /**
   * Remove connection
   */
  private removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    // Remove from all rooms
    for (const [room, connections] of this.rooms.entries()) {
      connections.delete(connectionId);
      if (connections.size === 0) {
        this.rooms.delete(room);
      }
    }

    // Remove from user connections
    const userConnections = this.userConnections.get(connection.userId);
    if (userConnections) {
      userConnections.delete(connectionId);
      if (userConnections.size === 0) {
        this.userConnections.delete(connection.userId);
      }
    }

    // Remove connection
    this.connections.delete(connectionId);

    console.log(`Removed connection: ${connectionId}`);
  }

  /**
   * Clean up stale connections
   */
  private cleanup(): void {
    const now = Date.now();
    const staleThreshold = 60000; // 1 minute

    for (const [connectionId, connection] of this.connections.entries()) {
      if (now - connection.lastPing > staleThreshold) {
        console.log(`Cleaning up stale connection: ${connectionId}`);
        this.removeConnection(connectionId);
      }
    }
  }

  /**
   * Get connection statistics
   */
  getStats(): {
    totalConnections: number;
    activeUsers: number;
    rooms: number;
    connections: Array<{ id: string; userId: string; subscriptions: string[] }>;
  } {
    return {
      totalConnections: this.connections.size,
      activeUsers: this.userConnections.size,
      rooms: this.rooms.size,
      connections: Array.from(this.connections.values()).map(conn => ({
        id: conn.id,
        userId: conn.userId,
        subscriptions: conn.subscriptions
      }))
    };
  }
}

/**
 * Notification Service for real-time notifications
 */
export class NotificationService {
  private wsManager: WebSocketManager;

  constructor(wsManager: WebSocketManager) {
    this.wsManager = wsManager;
  }

  /**
   * Send notification to specific user
   */
  async sendToUser(userId: string, notification: NotificationMessage): Promise<number> {
    const message: WebSocketMessage = {
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString(),
      userId
    };

    return this.wsManager.sendToUser(userId, message);
  }

  /**
   * Send notification to all users
   */
  async broadcast(notification: NotificationMessage): Promise<number> {
    const message: WebSocketMessage = {
      type: 'notification',
      data: notification,
      timestamp: new Date().toISOString(),
      broadcast: true
    };

    return this.wsManager.broadcastToAll(message);
  }

  /**
   * Send risk update notification
   */
  async notifyRiskUpdate(riskId: string, title: string, changes: any, userId?: string): Promise<number> {
    const notification: NotificationMessage = {
      id: `risk_update_${riskId}_${Date.now()}`,
      title: 'Risk Updated',
      message: `Risk "${title}" has been updated`,
      type: 'info',
      category: 'risk',
      url: `/risk/view/${riskId}`,
      actions: [
        { label: 'View Risk', action: 'navigate', style: 'primary' }
      ]
    };

    const message: WebSocketMessage = {
      type: 'risk_update',
      data: { riskId, title, changes, notification },
      timestamp: new Date().toISOString(),
      userId
    };

    if (userId) {
      return this.wsManager.sendToUser(userId, message);
    } else {
      return this.wsManager.broadcastToRoom('risks', message);
    }
  }

  /**
   * Send asset change notification
   */
  async notifyAssetChange(assetId: string, name: string, changeType: 'created' | 'updated' | 'deleted', userId?: string): Promise<number> {
    const notification: NotificationMessage = {
      id: `asset_change_${assetId}_${Date.now()}`,
      title: `Asset ${changeType}`,
      message: `Asset "${name}" has been ${changeType}`,
      type: changeType === 'deleted' ? 'warning' : 'info',
      category: 'security',
      url: changeType !== 'deleted' ? `/operations/asset/${assetId}` : undefined,
      actions: changeType !== 'deleted' ? [
        { label: 'View Asset', action: 'navigate', style: 'primary' }
      ] : undefined
    };

    const message: WebSocketMessage = {
      type: 'asset_change',
      data: { assetId, name, changeType, notification },
      timestamp: new Date().toISOString(),
      userId
    };

    if (userId) {
      return this.wsManager.sendToUser(userId, message);
    } else {
      return this.wsManager.broadcastToRoom('assets', message);
    }
  }

  /**
   * Send compliance update notification
   */
  async notifyComplianceUpdate(framework: string, controlId: string, status: string, userId?: string): Promise<number> {
    const notification: NotificationMessage = {
      id: `compliance_update_${framework}_${controlId}_${Date.now()}`,
      title: 'Compliance Update',
      message: `${framework} control ${controlId} status changed to ${status}`,
      type: status === 'compliant' ? 'success' : 'warning',
      category: 'compliance',
      url: `/compliance/frameworks/${framework.toLowerCase()}`,
      actions: [
        { label: 'View Framework', action: 'navigate', style: 'primary' }
      ]
    };

    const message: WebSocketMessage = {
      type: 'compliance_update',
      data: { framework, controlId, status, notification },
      timestamp: new Date().toISOString(),
      userId
    };

    if (userId) {
      return this.wsManager.sendToUser(userId, message);
    } else {
      return this.wsManager.broadcastToRoom('compliance', message);
    }
  }

  /**
   * Send system alert
   */
  async sendSystemAlert(title: string, message: string, severity: 'info' | 'success' | 'warning' | 'error', userId?: string): Promise<number> {
    const notification: NotificationMessage = {
      id: `system_alert_${Date.now()}`,
      title,
      message,
      type: severity,
      category: 'system'
    };

    const wsMessage: WebSocketMessage = {
      type: 'system_alert',
      data: notification,
      timestamp: new Date().toISOString(),
      userId
    };

    if (userId) {
      return this.wsManager.sendToUser(userId, wsMessage);
    } else {
      return this.wsManager.broadcastToAll(wsMessage);
    }
  }
}

/**
 * Global WebSocket Manager instance
 */
let globalWSManager: WebSocketManager | null = null;

/**
 * Get or create WebSocket Manager
 */
export function getWebSocketManager(): WebSocketManager {
  if (!globalWSManager) {
    globalWSManager = new WebSocketManager();
  }
  return globalWSManager;
}

/**
 * Get Notification Service
 */
export function getNotificationService(): NotificationService {
  const wsManager = getWebSocketManager();
  return new NotificationService(wsManager);
}

/**
 * Default exports
 */
export default {
  WebSocketManager,
  NotificationService,
  getWebSocketManager,
  getNotificationService
};