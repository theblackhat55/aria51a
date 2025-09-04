/**
 * Advanced Audit Logging Service
 * Comprehensive logging and monitoring for security, compliance, and operational events
 */

export interface AuditEvent {
  id?: string;
  eventType: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'system_event' | 'security_event';
  action: string;
  resource?: string;
  resourceId?: string;
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'success' | 'failure' | 'error';
  details: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface AuditQuery {
  eventType?: string[];
  action?: string[];
  userId?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  severity?: string[];
  status?: string[];
  limit?: number;
  offset?: number;
  sortBy?: 'timestamp' | 'severity' | 'eventType';
  sortOrder?: 'asc' | 'desc';
}

export interface AuditStatistics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsByAction: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  eventsByStatus: Record<string, number>;
  topUsers: Array<{ userId: string; count: number }>;
  recentEvents: AuditEvent[];
  timeRange: {
    start: string;
    end: string;
  };
}

export interface ComplianceReport {
  period: string;
  totalEvents: number;
  securityEvents: number;
  accessEvents: number;
  dataEvents: number;
  failedLogins: number;
  privilegedAccess: number;
  anomalies: Array<{
    type: string;
    description: string;
    count: number;
    severity: string;
  }>;
  compliance: {
    gdpr: {
      dataAccess: number;
      dataModification: number;
      retentionCompliance: boolean;
    };
    sox: {
      financialAccess: number;
      adminChanges: number;
      segregationViolations: number;
    };
    pci: {
      cardDataAccess: number;
      systemChanges: number;
      vulnerabilityEvents: number;
    };
  };
}

/**
 * Audit Logging Service
 */
export class AuditService {
  private db: D1Database;
  private retentionDays: number = 2555; // 7 years for compliance

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Initialize audit tables
   */
  async initializeTables(): Promise<void> {
    try {
      // Main audit log table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS audit_log (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          event_type TEXT NOT NULL,
          action TEXT NOT NULL,
          resource TEXT,
          resource_id TEXT,
          user_id TEXT,
          session_id TEXT,
          ip_address TEXT,
          user_agent TEXT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
          status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'error')),
          details TEXT, -- JSON
          metadata TEXT, -- JSON
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // User session tracking table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS audit_sessions (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          session_id TEXT UNIQUE NOT NULL,
          user_id TEXT NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
          end_time DATETIME,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated')),
          events_count INTEGER DEFAULT 0
        );
      `);

      // Security alerts table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS audit_alerts (
          id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
          alert_type TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
          user_id TEXT,
          ip_address TEXT,
          event_ids TEXT, -- JSON array of related event IDs
          status TEXT DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'false_positive')),
          assigned_to TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          resolved_at DATETIME
        );
      `);

      // Data retention policy table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS audit_retention (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_type TEXT NOT NULL,
          retention_days INTEGER NOT NULL,
          archive_location TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create indexes for better performance
      await this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON audit_log(event_type);
        CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
        CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);
        CREATE INDEX IF NOT EXISTS idx_audit_log_severity ON audit_log(severity);
        CREATE INDEX IF NOT EXISTS idx_audit_log_status ON audit_log(status);
        CREATE INDEX IF NOT EXISTS idx_audit_log_ip_address ON audit_log(ip_address);
        CREATE INDEX IF NOT EXISTS idx_audit_sessions_user_id ON audit_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_sessions_start_time ON audit_sessions(start_time);
        CREATE INDEX IF NOT EXISTS idx_audit_alerts_severity ON audit_alerts(severity);
        CREATE INDEX IF NOT EXISTS idx_audit_alerts_status ON audit_alerts(status);
      `);

      // Insert default retention policies
      await this.db.exec(`
        INSERT OR IGNORE INTO audit_retention (event_type, retention_days) VALUES
        ('authentication', 2555), -- 7 years
        ('authorization', 2555),   -- 7 years
        ('data_access', 2555),     -- 7 years
        ('data_modification', 2555), -- 7 years
        ('system_event', 1095),    -- 3 years
        ('security_event', 2555);  -- 7 years
      `);

      console.log('Audit tables initialized successfully');
    } catch (error) {
      console.error('Error initializing audit tables:', error);
      throw error;
    }
  }

  /**
   * Log an audit event
   */
  async logEvent(event: AuditEvent): Promise<string> {
    try {
      const eventId = event.id || this.generateEventId();
      
      await this.db.prepare(`
        INSERT INTO audit_log (
          id, event_type, action, resource, resource_id, user_id, session_id,
          ip_address, user_agent, timestamp, severity, status, details, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        eventId,
        event.eventType,
        event.action,
        event.resource || null,
        event.resourceId || null,
        event.userId || null,
        event.sessionId || null,
        event.ipAddress || null,
        event.userAgent || null,
        event.timestamp,
        event.severity,
        event.status,
        JSON.stringify(event.details),
        event.metadata ? JSON.stringify(event.metadata) : null
      ).run();

      // Update session activity if session ID provided
      if (event.sessionId) {
        await this.updateSessionActivity(event.sessionId);
      }

      // Check for security alerts
      await this.checkSecurityAlerts(event);

      return eventId;
    } catch (error) {
      console.error('Error logging audit event:', error);
      throw error;
    }
  }

  /**
   * Convenience methods for common audit events
   */
  async logAuthentication(
    userId: string,
    action: 'login' | 'logout' | '2fa_verify' | 'password_change',
    status: 'success' | 'failure',
    details: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string
  ): Promise<string> {
    return this.logEvent({
      eventType: 'authentication',
      action,
      userId,
      ipAddress,
      userAgent,
      timestamp: new Date().toISOString(),
      severity: status === 'failure' ? 'medium' : 'low',
      status,
      details: {
        ...details,
        action_description: `User ${action} ${status}`
      }
    });
  }

  async logDataAccess(
    userId: string,
    resource: string,
    resourceId: string,
    action: 'read' | 'export' | 'search',
    details: Record<string, any> = {},
    ipAddress?: string
  ): Promise<string> {
    return this.logEvent({
      eventType: 'data_access',
      action,
      resource,
      resourceId,
      userId,
      ipAddress,
      timestamp: new Date().toISOString(),
      severity: action === 'export' ? 'medium' : 'low',
      status: 'success',
      details: {
        ...details,
        action_description: `User accessed ${resource}`
      }
    });
  }

  async logDataModification(
    userId: string,
    resource: string,
    resourceId: string,
    action: 'create' | 'update' | 'delete',
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    ipAddress?: string
  ): Promise<string> {
    return this.logEvent({
      eventType: 'data_modification',
      action,
      resource,
      resourceId,
      userId,
      ipAddress,
      timestamp: new Date().toISOString(),
      severity: action === 'delete' ? 'high' : 'medium',
      status: 'success',
      details: {
        action_description: `User ${action}d ${resource}`,
        old_values: oldValues || {},
        new_values: newValues || {}
      }
    });
  }

  async logSecurityEvent(
    eventType: string,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: Record<string, any> = {},
    userId?: string,
    ipAddress?: string
  ): Promise<string> {
    return this.logEvent({
      eventType: 'security_event',
      action: eventType,
      userId,
      ipAddress,
      timestamp: new Date().toISOString(),
      severity,
      status: 'success',
      details: {
        ...details,
        description
      }
    });
  }

  async logSystemEvent(
    action: string,
    details: Record<string, any> = {},
    userId?: string
  ): Promise<string> {
    return this.logEvent({
      eventType: 'system_event',
      action,
      userId,
      timestamp: new Date().toISOString(),
      severity: 'low',
      status: 'success',
      details
    });
  }

  /**
   * Query audit logs
   */
  async queryLogs(query: AuditQuery): Promise<{ events: AuditEvent[]; total: number }> {
    try {
      const {
        eventType,
        action,
        userId,
        dateRange,
        severity,
        status,
        limit = 100,
        offset = 0,
        sortBy = 'timestamp',
        sortOrder = 'desc'
      } = query;

      let sql = `
        SELECT id, event_type, action, resource, resource_id, user_id, session_id,
               ip_address, user_agent, timestamp, severity, status, details, metadata
        FROM audit_log
        WHERE 1=1
      `;

      const bindings: any[] = [];

      // Add filters
      if (eventType && eventType.length > 0) {
        sql += ` AND event_type IN (${eventType.map(() => '?').join(',')})`;
        bindings.push(...eventType);
      }

      if (action && action.length > 0) {
        sql += ` AND action IN (${action.map(() => '?').join(',')})`;
        bindings.push(...action);
      }

      if (userId && userId.length > 0) {
        sql += ` AND user_id IN (${userId.map(() => '?').join(',')})`;
        bindings.push(...userId);
      }

      if (dateRange) {
        sql += ` AND timestamp BETWEEN ? AND ?`;
        bindings.push(dateRange.start, dateRange.end);
      }

      if (severity && severity.length > 0) {
        sql += ` AND severity IN (${severity.map(() => '?').join(',')})`;
        bindings.push(...severity);
      }

      if (status && status.length > 0) {
        sql += ` AND status IN (${status.map(() => '?').join(',')})`;
        bindings.push(...status);
      }

      // Add sorting
      sql += ` ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;

      // Get total count
      const countSql = sql.replace(/SELECT.*FROM/, 'SELECT COUNT(*) as total FROM').replace(/ORDER BY.*/, '');
      const countResult = await this.db.prepare(countSql).bind(...bindings).first();
      const total = countResult?.total || 0;

      // Add pagination
      sql += ` LIMIT ? OFFSET ?`;
      bindings.push(limit, offset);

      // Execute query
      const result = await this.db.prepare(sql).bind(...bindings).all();

      const events: AuditEvent[] = result.results.map((row: any) => ({
        id: row.id,
        eventType: row.event_type,
        action: row.action,
        resource: row.resource,
        resourceId: row.resource_id,
        userId: row.user_id,
        sessionId: row.session_id,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        timestamp: row.timestamp,
        severity: row.severity,
        status: row.status,
        details: row.details ? JSON.parse(row.details) : {},
        metadata: row.metadata ? JSON.parse(row.metadata) : {}
      }));

      return { events, total };
    } catch (error) {
      console.error('Error querying audit logs:', error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  async getStatistics(days: number = 30): Promise<AuditStatistics> {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      // Total events
      const totalResult = await this.db.prepare(`
        SELECT COUNT(*) as total FROM audit_log 
        WHERE timestamp >= ?
      `).bind(startDate).first();

      // Events by type
      const typeResults = await this.db.prepare(`
        SELECT event_type, COUNT(*) as count FROM audit_log 
        WHERE timestamp >= ? 
        GROUP BY event_type
      `).bind(startDate).all();

      // Events by action
      const actionResults = await this.db.prepare(`
        SELECT action, COUNT(*) as count FROM audit_log 
        WHERE timestamp >= ? 
        GROUP BY action 
        ORDER BY count DESC 
        LIMIT 10
      `).bind(startDate).all();

      // Events by severity
      const severityResults = await this.db.prepare(`
        SELECT severity, COUNT(*) as count FROM audit_log 
        WHERE timestamp >= ? 
        GROUP BY severity
      `).bind(startDate).all();

      // Events by status
      const statusResults = await this.db.prepare(`
        SELECT status, COUNT(*) as count FROM audit_log 
        WHERE timestamp >= ? 
        GROUP BY status
      `).bind(startDate).all();

      // Top users
      const userResults = await this.db.prepare(`
        SELECT user_id, COUNT(*) as count FROM audit_log 
        WHERE timestamp >= ? AND user_id IS NOT NULL 
        GROUP BY user_id 
        ORDER BY count DESC 
        LIMIT 10
      `).bind(startDate).all();

      // Recent events
      const recentResult = await this.db.prepare(`
        SELECT id, event_type, action, resource, user_id, timestamp, severity, status, details
        FROM audit_log 
        WHERE timestamp >= ?
        ORDER BY timestamp DESC 
        LIMIT 20
      `).bind(startDate).all();

      return {
        totalEvents: totalResult?.total || 0,
        eventsByType: Object.fromEntries(
          typeResults.results.map((row: any) => [row.event_type, row.count])
        ),
        eventsByAction: Object.fromEntries(
          actionResults.results.map((row: any) => [row.action, row.count])
        ),
        eventsBySeverity: Object.fromEntries(
          severityResults.results.map((row: any) => [row.severity, row.count])
        ),
        eventsByStatus: Object.fromEntries(
          statusResults.results.map((row: any) => [row.status, row.count])
        ),
        topUsers: userResults.results.map((row: any) => ({
          userId: row.user_id,
          count: row.count
        })),
        recentEvents: recentResult.results.map((row: any) => ({
          id: row.id,
          eventType: row.event_type,
          action: row.action,
          resource: row.resource,
          userId: row.user_id,
          timestamp: row.timestamp,
          severity: row.severity,
          status: row.status,
          details: row.details ? JSON.parse(row.details) : {}
        })),
        timeRange: {
          start: startDate,
          end: endDate
        }
      };
    } catch (error) {
      console.error('Error getting audit statistics:', error);
      throw error;
    }
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(period: string = 'monthly'): Promise<ComplianceReport> {
    try {
      const days = period === 'monthly' ? 30 : period === 'quarterly' ? 90 : 365;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

      const stats = await this.getStatistics(days);

      // Calculate compliance metrics
      const securityEvents = stats.eventsByType['security_event'] || 0;
      const accessEvents = stats.eventsByType['data_access'] || 0;
      const dataEvents = stats.eventsByType['data_modification'] || 0;

      // Failed login attempts
      const failedLoginsResult = await this.db.prepare(`
        SELECT COUNT(*) as count FROM audit_log 
        WHERE event_type = 'authentication' AND action = 'login' AND status = 'failure'
        AND timestamp >= ?
      `).bind(startDate).first();

      // Privileged access events
      const privilegedAccessResult = await this.db.prepare(`
        SELECT COUNT(*) as count FROM audit_log 
        WHERE event_type = 'authorization' AND details LIKE '%admin%'
        AND timestamp >= ?
      `).bind(startDate).first();

      return {
        period,
        totalEvents: stats.totalEvents,
        securityEvents,
        accessEvents,
        dataEvents,
        failedLogins: failedLoginsResult?.count || 0,
        privilegedAccess: privilegedAccessResult?.count || 0,
        anomalies: [
          {
            type: 'Multiple Failed Logins',
            description: 'Users with more than 5 failed login attempts',
            count: 0, // Would calculate from actual data
            severity: 'medium'
          }
        ],
        compliance: {
          gdpr: {
            dataAccess: accessEvents,
            dataModification: dataEvents,
            retentionCompliance: true
          },
          sox: {
            financialAccess: 0, // Would calculate from actual financial system access
            adminChanges: 0,
            segregationViolations: 0
          },
          pci: {
            cardDataAccess: 0, // Would calculate from card data access
            systemChanges: 0,
            vulnerabilityEvents: securityEvents
          }
        }
      };
    } catch (error) {
      console.error('Error generating compliance report:', error);
      throw error;
    }
  }

  /**
   * Clean up old audit logs based on retention policy
   */
  async cleanupOldLogs(): Promise<{ deleted: number }> {
    try {
      let totalDeleted = 0;

      // Get retention policies
      const retentionPolicies = await this.db.prepare(`
        SELECT event_type, retention_days FROM audit_retention
      `).all();

      for (const policy of retentionPolicies.results) {
        const cutoffDate = new Date(Date.now() - policy.retention_days * 24 * 60 * 60 * 1000).toISOString();
        
        const deleteResult = await this.db.prepare(`
          DELETE FROM audit_log 
          WHERE event_type = ? AND timestamp < ?
        `).bind(policy.event_type, cutoffDate).run();

        totalDeleted += deleteResult.changes || 0;
      }

      console.log(`Cleaned up ${totalDeleted} old audit log entries`);
      return { deleted: totalDeleted };
    } catch (error) {
      console.error('Error cleaning up audit logs:', error);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private async updateSessionActivity(sessionId: string): Promise<void> {
    try {
      await this.db.prepare(`
        UPDATE audit_sessions 
        SET last_activity = CURRENT_TIMESTAMP, events_count = events_count + 1 
        WHERE session_id = ?
      `).bind(sessionId).run();
    } catch (error) {
      console.error('Error updating session activity:', error);
    }
  }

  private async checkSecurityAlerts(event: AuditEvent): Promise<void> {
    try {
      // Check for failed login attempts
      if (event.eventType === 'authentication' && event.action === 'login' && event.status === 'failure') {
        const recentFailures = await this.db.prepare(`
          SELECT COUNT(*) as count FROM audit_log 
          WHERE event_type = 'authentication' AND action = 'login' AND status = 'failure'
          AND user_id = ? AND timestamp > datetime('now', '-15 minutes')
        `).bind(event.userId).first();

        if (recentFailures && recentFailures.count >= 5) {
          await this.createSecurityAlert(
            'multiple_failed_logins',
            'Multiple Failed Login Attempts',
            `User ${event.userId} has ${recentFailures.count} failed login attempts in 15 minutes`,
            'high',
            event.userId,
            event.ipAddress
          );
        }
      }

      // Check for privileged access
      if (event.eventType === 'authorization' && event.details.role === 'admin') {
        await this.createSecurityAlert(
          'privileged_access',
          'Privileged Access Event',
          `Admin access granted to user ${event.userId}`,
          'medium',
          event.userId,
          event.ipAddress
        );
      }
    } catch (error) {
      console.error('Error checking security alerts:', error);
    }
  }

  private async createSecurityAlert(
    alertType: string,
    title: string,
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    userId?: string,
    ipAddress?: string
  ): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT INTO audit_alerts (alert_type, title, description, severity, user_id, ip_address)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(alertType, title, description, severity, userId || null, ipAddress || null).run();
    } catch (error) {
      console.error('Error creating security alert:', error);
    }
  }

  /**
   * Test audit functionality
   */
  async testAudit(): Promise<{ success: boolean; message: string; eventId?: string }> {
    try {
      // Initialize tables
      await this.initializeTables();

      // Log test event
      const eventId = await this.logAuthentication(
        'test_user',
        'login',
        'success',
        { test: true },
        '127.0.0.1',
        'Test-Agent/1.0'
      );

      // Query the event back
      const query = await this.queryLogs({
        userId: ['test_user'],
        limit: 1
      });

      if (query.events.length > 0 && query.events[0].id === eventId) {
        return {
          success: true,
          message: 'Audit functionality working correctly',
          eventId
        };
      } else {
        return {
          success: false,
          message: 'Failed to retrieve logged event'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Audit test failed: ${error.message}`
      };
    }
  }
}

/**
 * Factory function to create audit service
 */
export function createAuditService(db: D1Database): AuditService {
  return new AuditService(db);
}

/**
 * Default export
 */
export default AuditService;