/**
 * Simple Audit Logging Service
 * Works with existing audit_logs table structure
 */

export interface SimpleAuditLogEntry {
  userId?: number;
  action: string;
  entityType?: string;
  entityId?: number;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export class SimpleAuditLoggingService {
  private db: any;

  constructor(database: any) {
    this.db = database;
  }

  /**
   * Log user activity with existing schema
   */
  async logActivity(entry: SimpleAuditLogEntry): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT INTO audit_logs (
          user_id, action, entity_type, entity_id,
          old_values, new_values, ip_address, user_agent,
          created_at
        ) VALUES (
          ?, ?, ?, ?,
          ?, ?, ?, ?,
          CURRENT_TIMESTAMP
        )
      `).bind(
        entry.userId || null,
        entry.action,
        entry.entityType || null,
        entry.entityId || null,
        entry.oldValues ? JSON.stringify(entry.oldValues) : null,
        entry.newValues ? JSON.stringify(entry.newValues) : null,
        entry.ipAddress || null,
        entry.userAgent || null
      ).run();
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Don't throw - audit logging should not break the application
    }
  }

  /**
   * Log user login
   */
  async logLogin(userId: number, username: string, ipAddress: string, userAgent: string, success: boolean = true, errorMessage?: string): Promise<void> {
    const action = success 
      ? `LOGIN_SUCCESS - User ${username} logged in successfully`
      : `LOGIN_FAILED - ${errorMessage || 'Login failed'} for user ${username}`;

    await this.logActivity({
      userId: success ? userId : undefined,
      action,
      entityType: 'user',
      entityId: userId,
      ipAddress,
      userAgent,
      newValues: { 
        username, 
        login_time: new Date().toISOString(),
        success 
      }
    });
  }

  /**
   * Log user logout
   */
  async logLogout(userId: number, username: string, sessionId: string): Promise<void> {
    await this.logActivity({
      userId,
      action: `LOGOUT - User ${username} logged out`,
      entityType: 'user',
      entityId: userId,
      newValues: { 
        username, 
        logout_time: new Date().toISOString(),
        session_id: sessionId
      }
    });
  }

  /**
   * Log data changes (create, update, delete)
   */
  async logDataChange(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    userId: number,
    entityType: string,
    entityId: number,
    entityName: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    const actionText = `${action} - ${entityType} '${entityName}' ${action.toLowerCase()}d`;

    await this.logActivity({
      userId,
      action: actionText,
      entityType,
      entityId,
      oldValues,
      newValues,
      ipAddress,
      userAgent
    });
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    description: string,
    userId?: number,
    ipAddress?: string,
    userAgent?: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'HIGH'
  ): Promise<void> {
    await this.logActivity({
      userId,
      action: `SECURITY_EVENT - ${severity} - ${description}`,
      entityType: 'security',
      ipAddress,
      userAgent,
      newValues: {
        severity,
        description,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log system configuration changes
   */
  async logConfigChange(
    userId: number,
    configType: string,
    configName: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.logActivity({
      userId,
      action: `CONFIG_CHANGE - ${configType} configuration '${configName}' modified`,
      entityType: 'system_config',
      oldValues,
      newValues,
      ipAddress,
      userAgent
    });
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filters: {
    userId?: number;
    action?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    let query = `
      SELECT a.*, u.username, u.email 
      FROM audit_logs a 
      LEFT JOIN users u ON a.user_id = u.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters.userId) {
      query += ' AND a.user_id = ?';
      params.push(filters.userId);
    }
    
    if (filters.action) {
      query += ' AND a.action LIKE ?';
      params.push(`%${filters.action}%`);
    }

    if (filters.entityType) {
      query += ' AND a.entity_type = ?';
      params.push(filters.entityType);
    }

    if (filters.startDate) {
      query += ' AND a.created_at >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ' AND a.created_at <= ?';
      params.push(filters.endDate);
    }

    query += ' ORDER BY a.created_at DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
      
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    try {
      const result = await this.db.prepare(query).bind(...params).all();
      return result.results || [];
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }
}

/**
 * Helper function to extract client IP address from request
 */
export function getClientIP(request: Request): string {
  // Try various headers that might contain the real IP
  const cfConnectingIp = request.headers.get('CF-Connecting-IP');
  const xForwardedFor = request.headers.get('X-Forwarded-For');
  const xRealIp = request.headers.get('X-Real-IP');
  
  // Cloudflare provides the real IP in CF-Connecting-IP
  if (cfConnectingIp) return cfConnectingIp;
  
  // Parse X-Forwarded-For (first IP is usually the client)
  if (xForwardedFor) {
    const ips = xForwardedFor.split(',').map(ip => ip.trim());
    return ips[0];
  }
  
  // Fallback to X-Real-IP
  if (xRealIp) return xRealIp;
  
  // Default fallback
  return '127.0.0.1';
}