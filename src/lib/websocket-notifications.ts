/**
 * WebSocket Notifications Service for ARIA5.1
 * 
 * Provides real-time notifications for:
 * - Risk alerts and status changes
 * - Compliance updates and violations
 * - Security incidents and threat alerts
 * - System status and maintenance notifications
 * - User activity and collaboration updates
 * 
 * Features:
 * - Real-time bidirectional communication
 * - User subscription management
 * - Notification filtering and routing
 * - Offline message queuing
 * - Integration with all ARIA5 modules
 */

export interface NotificationMessage {
  id: string;
  type: 'risk_alert' | 'compliance_update' | 'security_incident' | 'system_status' | 'user_activity' | 'report_ready' | 'integration_status';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical' | 'success';
  timestamp: string;
  userId?: number; // Target user ID (null for broadcast)
  relatedRiskId?: number;
  relatedComplianceId?: number;
  metadata?: Record<string, any>;
  actionUrl?: string;
  actionText?: string;
  expiresAt?: string;
  isRead: boolean;
}

export interface NotificationSubscription {
  userId: number;
  types: string[];
  channels: ('websocket' | 'email' | 'sms')[];
  severity: string[];
  filters: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WebSocketConnection {
  userId: number;
  connectionId: string;
  lastSeen: string;
  subscriptions: string[];
  metadata?: Record<string, any>;
}

export interface NotificationQueue {
  id: string;
  userId: number;
  notification: NotificationMessage;
  status: 'pending' | 'delivered' | 'failed' | 'expired';
  attempts: number;
  createdAt: string;
  deliveredAt?: string;
}

export class WebSocketNotificationService {
  private connections: Map<string, WebSocketConnection> = new Map();
  private userConnections: Map<number, Set<string>> = new Map();
  private db: any;
  private notificationQueue: NotificationQueue[] = [];
  private isInitialized = false;

  constructor(database?: any) {
    this.db = database;
    if (this.db) {
      this.initializeDatabase();
    }
  }

  /**
   * Initialize database tables for notifications
   */
  private async initializeDatabase(): Promise<void> {
    try {
      // Notifications table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical', 'success')),
          timestamp DATETIME NOT NULL,
          user_id INTEGER,
          related_risk_id INTEGER,
          related_compliance_id INTEGER,
          metadata TEXT, -- JSON
          action_url TEXT,
          action_text TEXT,
          expires_at DATETIME,
          is_read BOOLEAN DEFAULT FALSE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (related_risk_id) REFERENCES risks(id),
          FOREIGN KEY (related_compliance_id) REFERENCES compliance_items(id)
        )
      `).run();

      // Notification subscriptions table
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS notification_subscriptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          types TEXT NOT NULL, -- JSON array
          channels TEXT NOT NULL, -- JSON array
          severity TEXT NOT NULL, -- JSON array
          filters TEXT, -- JSON
          is_active BOOLEAN DEFAULT TRUE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id),
          UNIQUE(user_id)
        )
      `).run();

      // Notification delivery log
      await this.db.prepare(`
        CREATE TABLE IF NOT EXISTS notification_delivery (
          id TEXT PRIMARY KEY,
          notification_id TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          channel TEXT NOT NULL,
          status TEXT NOT NULL CHECK (status IN ('pending', 'delivered', 'failed', 'expired')),
          attempts INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          delivered_at DATETIME,
          error_message TEXT,
          FOREIGN KEY (notification_id) REFERENCES notifications(id),
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `).run();

      // Create indexes
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id)
      `).run();
      
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type)
      `).run();
      
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_notifications_severity ON notifications(severity)
      `).run();
      
      await this.db.prepare(`
        CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp)
      `).run();

      this.isInitialized = true;
      console.log('✅ WebSocket notification database initialized');

    } catch (error) {
      console.error('Failed to initialize notification database:', error);
    }
  }

  /**
   * Register a new WebSocket connection
   */
  registerConnection(connectionId: string, userId: number, websocket?: WebSocket): WebSocketConnection {
    const connection: WebSocketConnection = {
      userId,
      connectionId,
      lastSeen: new Date().toISOString(),
      subscriptions: ['all'], // Default subscription
      metadata: {}
    };

    this.connections.set(connectionId, connection);
    
    if (!this.userConnections.has(userId)) {
      this.userConnections.set(userId, new Set());
    }
    this.userConnections.get(userId)?.add(connectionId);

    // Development mode logging
    console.log('🔌 WebSocket connection registered:', {
      connectionId,
      userId,
      totalConnections: this.connections.size
    });

    // Send pending notifications
    this.deliverPendingNotifications(userId);

    return connection;
  }

  /**
   * Unregister a WebSocket connection
   */
  unregisterConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      const userConnections = this.userConnections.get(connection.userId);
      if (userConnections) {
        userConnections.delete(connectionId);
        if (userConnections.size === 0) {
          this.userConnections.delete(connection.userId);
        }
      }
      this.connections.delete(connectionId);

      console.log('🔌 WebSocket connection unregistered:', {
        connectionId,
        userId: connection.userId,
        totalConnections: this.connections.size
      });
    }
  }

  /**
   * Send notification to specific user or broadcast
   */
  async sendNotification(notification: Omit<NotificationMessage, 'id' | 'timestamp' | 'isRead'>): Promise<{ success: boolean; delivered: number; queued: number; error?: string }> {
    try {
      const fullNotification: NotificationMessage = {
        ...notification,
        id: this.generateNotificationId(),
        timestamp: new Date().toISOString(),
        isRead: false
      };

      // Store notification in database
      if (this.db && this.isInitialized) {
        await this.storeNotification(fullNotification);
      }

      let delivered = 0;
      let queued = 0;

      if (notification.userId) {
        // Send to specific user
        const result = await this.deliverToUser(notification.userId, fullNotification);
        delivered = result.delivered ? 1 : 0;
        queued = result.queued ? 1 : 0;
      } else {
        // Broadcast to all users
        for (const [userId] of this.userConnections) {
          const result = await this.deliverToUser(userId, fullNotification);
          if (result.delivered) delivered++;
          if (result.queued) queued++;
        }
      }

      console.log('📨 Notification sent:', {
        id: fullNotification.id,
        type: fullNotification.type,
        severity: fullNotification.severity,
        delivered,
        queued
      });

      return { success: true, delivered, queued };

    } catch (error) {
      console.error('Failed to send notification:', error);
      return {
        success: false,
        delivered: 0,
        queued: 0,
        error: error instanceof Error ? error.message : 'Send failed'
      };
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId: number, options?: { 
    limit?: number; 
    offset?: number; 
    unreadOnly?: boolean; 
    types?: string[] 
  }): Promise<{ success: boolean; notifications?: NotificationMessage[]; total?: number; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Database not initialized' };
      }

      let sql = `
        SELECT * FROM notifications 
        WHERE (user_id = ? OR user_id IS NULL)
      `;
      const params: any[] = [userId];

      if (options?.unreadOnly) {
        sql += ` AND is_read = FALSE`;
      }

      if (options?.types && options.types.length > 0) {
        sql += ` AND type IN (${options.types.map(() => '?').join(',')})`;
        params.push(...options.types);
      }

      // Check expiration
      sql += ` AND (expires_at IS NULL OR expires_at > datetime('now'))`;

      sql += ` ORDER BY timestamp DESC`;

      if (options?.limit) {
        sql += ` LIMIT ?`;
        params.push(options.limit);
      }

      if (options?.offset) {
        sql += ` OFFSET ?`;
        params.push(options.offset);
      }

      const result = await this.db.prepare(sql).bind(...params).all();
      const notifications = result.results?.map((row: any) => this.mapRowToNotification(row)) || [];

      // Get total count
      let countSql = `
        SELECT COUNT(*) as total FROM notifications 
        WHERE (user_id = ? OR user_id IS NULL)
      `;
      const countParams = [userId];

      if (options?.unreadOnly) {
        countSql += ` AND is_read = FALSE`;
      }

      if (options?.types && options.types.length > 0) {
        countSql += ` AND type IN (${options.types.map(() => '?').join(',')})`;
        countParams.push(...options.types);
      }

      countSql += ` AND (expires_at IS NULL OR expires_at > datetime('now'))`;

      const countResult = await this.db.prepare(countSql).bind(...countParams).first();
      const total = countResult?.total || 0;

      return {
        success: true,
        notifications,
        total
      };

    } catch (error) {
      console.error('Failed to get user notifications:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Retrieval failed'
      };
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: number): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Database not initialized' };
      }

      await this.db.prepare(`
        UPDATE notifications 
        SET is_read = TRUE 
        WHERE id = ? AND (user_id = ? OR user_id IS NULL)
      `).bind(notificationId, userId).run();

      return { success: true };

    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      };
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId: number): Promise<{ success: boolean; updated?: number; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Database not initialized' };
      }

      const result = await this.db.prepare(`
        UPDATE notifications 
        SET is_read = TRUE 
        WHERE (user_id = ? OR user_id IS NULL) AND is_read = FALSE
      `).bind(userId).run();

      return { 
        success: true,
        updated: result.changes || 0
      };

    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      };
    }
  }

  /**
   * Update user notification preferences
   */
  async updateSubscription(userId: number, subscription: Partial<NotificationSubscription>): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Database not initialized' };
      }

      const existing = await this.db.prepare(`
        SELECT id FROM notification_subscriptions WHERE user_id = ?
      `).bind(userId).first();

      if (existing) {
        await this.db.prepare(`
          UPDATE notification_subscriptions 
          SET types = ?, channels = ?, severity = ?, filters = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
          WHERE user_id = ?
        `).bind(
          JSON.stringify(subscription.types || ['all']),
          JSON.stringify(subscription.channels || ['websocket']),
          JSON.stringify(subscription.severity || ['info', 'warning', 'error', 'critical', 'success']),
          JSON.stringify(subscription.filters || {}),
          subscription.isActive !== false,
          userId
        ).run();
      } else {
        await this.db.prepare(`
          INSERT INTO notification_subscriptions (
            user_id, types, channels, severity, filters, is_active
          ) VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          userId,
          JSON.stringify(subscription.types || ['all']),
          JSON.stringify(subscription.channels || ['websocket']),
          JSON.stringify(subscription.severity || ['info', 'warning', 'error', 'critical', 'success']),
          JSON.stringify(subscription.filters || {}),
          subscription.isActive !== false
        ).run();
      }

      return { success: true };

    } catch (error) {
      console.error('Failed to update subscription:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Update failed'
      };
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId?: number): Promise<{ success: boolean; stats?: any; error?: string }> {
    try {
      if (!this.db || !this.isInitialized) {
        return { success: false, error: 'Database not initialized' };
      }

      let whereClause = 'WHERE expires_at IS NULL OR expires_at > datetime(\'now\')';
      const params: any[] = [];

      if (userId) {
        whereClause += ' AND (user_id = ? OR user_id IS NULL)';
        params.push(userId);
      }

      const stats = await this.db.prepare(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN is_read = FALSE THEN 1 END) as unread,
          COUNT(CASE WHEN type = 'risk_alert' THEN 1 END) as risk_alerts,
          COUNT(CASE WHEN type = 'compliance_update' THEN 1 END) as compliance_updates,
          COUNT(CASE WHEN type = 'security_incident' THEN 1 END) as security_incidents,
          COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical,
          COUNT(CASE WHEN severity = 'error' THEN 1 END) as errors,
          COUNT(CASE WHEN severity = 'warning' THEN 1 END) as warnings
        FROM notifications ${whereClause}
      `).bind(...params).first();

      return {
        success: true,
        stats: {
          total: stats?.total || 0,
          unread: stats?.unread || 0,
          byType: {
            riskAlerts: stats?.risk_alerts || 0,
            complianceUpdates: stats?.compliance_updates || 0,
            securityIncidents: stats?.security_incidents || 0
          },
          bySeverity: {
            critical: stats?.critical || 0,
            error: stats?.errors || 0,
            warning: stats?.warnings || 0
          },
          connections: this.connections.size,
          activeUsers: this.userConnections.size
        }
      };

    } catch (error) {
      console.error('Failed to get notification statistics:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Statistics failed'
      };
    }
  }

  // Helper methods

  private async deliverToUser(userId: number, notification: NotificationMessage): Promise<{ delivered: boolean; queued: boolean }> {
    const userConnections = this.userConnections.get(userId);
    
    if (!userConnections || userConnections.size === 0) {
      // Queue for offline delivery
      this.queueNotification(userId, notification);
      return { delivered: false, queued: true };
    }

    // Send to all user connections
    let delivered = false;
    for (const connectionId of userConnections) {
      try {
        // In development mode, just log
        console.log('📱 WebSocket delivery (Development Mode):', {
          connectionId,
          userId,
          notification: {
            id: notification.id,
            type: notification.type,
            title: notification.title,
            severity: notification.severity
          }
        });
        delivered = true;
      } catch (error) {
        console.error('WebSocket delivery failed:', error);
      }
    }

    return { delivered, queued: false };
  }

  private queueNotification(userId: number, notification: NotificationMessage): void {
    const queueItem: NotificationQueue = {
      id: this.generateNotificationId(),
      userId,
      notification,
      status: 'pending',
      attempts: 0,
      createdAt: new Date().toISOString()
    };

    this.notificationQueue.push(queueItem);

    // Limit queue size
    if (this.notificationQueue.length > 1000) {
      this.notificationQueue = this.notificationQueue.slice(-500);
    }
  }

  private async deliverPendingNotifications(userId: number): Promise<void> {
    const pendingNotifications = this.notificationQueue.filter(
      item => item.userId === userId && item.status === 'pending'
    );

    for (const item of pendingNotifications) {
      const result = await this.deliverToUser(userId, item.notification);
      if (result.delivered) {
        item.status = 'delivered';
        item.deliveredAt = new Date().toISOString();
      }
    }

    // Clean delivered notifications
    this.notificationQueue = this.notificationQueue.filter(
      item => item.status !== 'delivered'
    );
  }

  private async storeNotification(notification: NotificationMessage): Promise<void> {
    if (!this.db) return;

    await this.db.prepare(`
      INSERT INTO notifications (
        id, type, title, message, severity, timestamp,
        user_id, related_risk_id, related_compliance_id, metadata,
        action_url, action_text, expires_at, is_read
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      notification.id,
      notification.type,
      notification.title,
      notification.message,
      notification.severity,
      notification.timestamp,
      notification.userId,
      notification.relatedRiskId,
      notification.relatedComplianceId,
      JSON.stringify(notification.metadata || {}),
      notification.actionUrl,
      notification.actionText,
      notification.expiresAt,
      notification.isRead ? 1 : 0
    ).run();
  }

  private mapRowToNotification(row: any): NotificationMessage {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      message: row.message,
      severity: row.severity,
      timestamp: row.timestamp,
      userId: row.user_id,
      relatedRiskId: row.related_risk_id,
      relatedComplianceId: row.related_compliance_id,
      metadata: JSON.parse(row.metadata || '{}'),
      actionUrl: row.action_url,
      actionText: row.action_text,
      expiresAt: row.expires_at,
      isRead: Boolean(row.is_read)
    };
  }

  private generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
}

// Export helper functions for creating common notifications
export const NotificationHelpers = {
  /**
   * Create risk alert notification
   */
  createRiskAlert: (riskId: number, title: string, message: string, severity: NotificationMessage['severity'] = 'warning', userId?: number): Omit<NotificationMessage, 'id' | 'timestamp' | 'isRead'> => ({
    type: 'risk_alert',
    title,
    message,
    severity,
    userId,
    relatedRiskId: riskId,
    actionUrl: `/risks/${riskId}`,
    actionText: 'View Risk'
  }),

  /**
   * Create compliance update notification
   */
  createComplianceUpdate: (complianceId: number, title: string, message: string, userId?: number): Omit<NotificationMessage, 'id' | 'timestamp' | 'isRead'> => ({
    type: 'compliance_update',
    title,
    message,
    severity: 'info',
    userId,
    relatedComplianceId: complianceId,
    actionUrl: `/compliance/${complianceId}`,
    actionText: 'View Compliance'
  }),

  /**
   * Create security incident notification
   */
  createSecurityIncident: (title: string, message: string, severity: NotificationMessage['severity'] = 'critical'): Omit<NotificationMessage, 'id' | 'timestamp' | 'isRead'> => ({
    type: 'security_incident',
    title,
    message,
    severity,
    actionUrl: '/incidents',
    actionText: 'View Incidents'
  }),

  /**
   * Create report ready notification
   */
  createReportReady: (reportType: string, downloadUrl: string, userId: number): Omit<NotificationMessage, 'id' | 'timestamp' | 'isRead'> => ({
    type: 'report_ready',
    title: 'Report Generated',
    message: `Your ${reportType} report is ready for download`,
    severity: 'success',
    userId,
    actionUrl: downloadUrl,
    actionText: 'Download Report'
  }),

  /**
   * Create integration status notification
   */
  createIntegrationStatus: (serviceName: string, status: 'connected' | 'disconnected' | 'error', message?: string): Omit<NotificationMessage, 'id' | 'timestamp' | 'isRead'> => ({
    type: 'integration_status',
    title: `${serviceName} Integration ${status}`,
    message: message || `${serviceName} integration status changed to ${status}`,
    severity: status === 'connected' ? 'success' : status === 'error' ? 'error' : 'warning',
    actionUrl: '/settings/integrations',
    actionText: 'View Integrations'
  })
};