/**
 * Comprehensive Audit Logging Service
 * Tracks all user activities including login with public IP, logout, changes, and other activities
 */

export interface AuditLogEntry {
  // User Information
  userId?: number;
  username?: string;
  userEmail?: string;
  userRole?: string;
  
  // Activity Information
  activityType: 'login' | 'logout' | 'create' | 'update' | 'delete' | 'view' | 'export' | 'config_change' | 'system' | 'security_event';
  activityDescription: string;
  activityCategory?: 'authentication' | 'risk_management' | 'compliance' | 'system' | 'data_access' | 'security';
  
  // Target Information
  targetType?: 'risk' | 'user' | 'compliance_framework' | 'asset' | 'system_config' | 'session' | 'database';
  targetId?: string | number;
  targetName?: string;
  
  // Request Information
  httpMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  requestUrl?: string;
  requestPath?: string;
  userAgent?: string;
  
  // Network Information
  publicIp?: string;
  forwardedIp?: string;
  sessionId?: string;
  
  // Change Details
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  
  // Security & Compliance
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  complianceRelevant?: boolean;
  
  // Status
  success?: boolean;
  errorMessage?: string;
  responseCode?: number;
}

export interface UserSessionData {
  sessionId: string;
  userId?: number;
  username?: string;
  loginIp?: string;
  loginUserAgent?: string;
  status?: 'active' | 'expired' | 'logged_out' | 'terminated';
  logoutReason?: 'user_logout' | 'timeout' | 'admin_termination' | 'security_violation';
  country?: string;
  city?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  browser?: string;
  complianceSession?: boolean;
}

export class AuditLoggingService {
  private db: any;

  constructor(database: any) {
    this.db = database;
  }

  /**
   * Log user activity with comprehensive details
   */
  async logActivity(entry: AuditLogEntry): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT INTO audit_logs (
          user_id, username, user_email, user_role,
          activity_type, activity_description, activity_category,
          target_type, target_id, target_name,
          http_method, request_url, request_path, user_agent,
          public_ip, forwarded_ip, session_id,
          old_values, new_values,
          risk_level, compliance_relevant,
          success, error_message, response_code,
          created_at
        ) VALUES (
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?,
          ?, ?,
          ?, ?,
          ?, ?, ?,
          CURRENT_TIMESTAMP
        )
      `).bind(
        entry.userId || null,
        entry.username || null,
        entry.userEmail || null,
        entry.userRole || null,
        entry.activityType,
        entry.activityDescription,
        entry.activityCategory || null,
        entry.targetType || null,
        entry.targetId ? String(entry.targetId) : null,
        entry.targetName || null,
        entry.httpMethod || null,
        entry.requestUrl || null,
        entry.requestPath || null,
        entry.userAgent || null,
        entry.publicIp || null,
        entry.forwardedIp || null,
        entry.sessionId || null,
        entry.oldValues ? JSON.stringify(entry.oldValues) : null,
        entry.newValues ? JSON.stringify(entry.newValues) : null,
        entry.riskLevel || 'low',
        entry.complianceRelevant ? 1 : 0,
        entry.success !== false ? 1 : 0,
        entry.errorMessage || null,
        entry.responseCode || null
      ).run();
    } catch (error) {
      console.error('Failed to log audit entry:', error);
      // Don't throw - audit logging should not break the application
    }
  }

  /**
   * Log user login with IP address and device information
   */
  async logLogin(userId: number, username: string, publicIp: string, userAgent: string, sessionId: string, success: boolean = true, errorMessage?: string): Promise<void> {
    await this.logActivity({
      userId,
      username,
      activityType: 'login',
      activityDescription: success ? `User ${username} successfully logged in` : `Failed login attempt for ${username}`,
      activityCategory: 'authentication',
      targetType: 'user',
      targetId: userId,
      targetName: username,
      httpMethod: 'POST',
      requestPath: '/auth/login',
      userAgent,
      publicIp,
      sessionId,
      riskLevel: success ? 'low' : 'high',
      complianceRelevant: true,
      success,
      errorMessage
    });

    // Also create or update session record
    if (success) {
      await this.createUserSession({
        sessionId,
        userId,
        username,
        loginIp: publicIp,
        loginUserAgent: userAgent,
        status: 'active',
        deviceType: this.getDeviceType(userAgent),
        browser: this.getBrowser(userAgent)
      });
    }
  }

  /**
   * Log user logout
   */
  async logLogout(userId: number, username: string, sessionId: string, reason: 'user_logout' | 'timeout' | 'admin_termination' = 'user_logout'): Promise<void> {
    await this.logActivity({
      userId,
      username,
      activityType: 'logout',
      activityDescription: `User ${username} logged out (${reason})`,
      activityCategory: 'authentication',
      targetType: 'user',
      targetId: userId,
      targetName: username,
      sessionId,
      riskLevel: reason === 'admin_termination' ? 'high' : 'low',
      complianceRelevant: true,
      success: true
    });

    // Update session record
    await this.endUserSession(sessionId, reason);
  }

  /**
   * Log data changes (create, update, delete)
   */
  async logDataChange(
    activityType: 'create' | 'update' | 'delete',
    userId: number,
    username: string,
    targetType: string,
    targetId: string | number,
    targetName: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    httpMethod?: string,
    requestPath?: string
  ): Promise<void> {
    const descriptions = {
      create: `Created new ${targetType}: ${targetName}`,
      update: `Updated ${targetType}: ${targetName}`,
      delete: `Deleted ${targetType}: ${targetName}`
    };

    await this.logActivity({
      userId,
      username,
      activityType,
      activityDescription: descriptions[activityType],
      activityCategory: this.getCategoryFromTargetType(targetType),
      targetType: targetType as any,
      targetId,
      targetName,
      httpMethod: httpMethod as any,
      requestPath,
      oldValues,
      newValues,
      riskLevel: activityType === 'delete' ? 'medium' : 'low',
      complianceRelevant: true,
      success: true
    });
  }

  /**
   * Log security events
   */
  async logSecurityEvent(
    description: string,
    userId?: number,
    username?: string,
    publicIp?: string,
    riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'high',
    errorMessage?: string
  ): Promise<void> {
    await this.logActivity({
      userId,
      username,
      activityType: 'security_event',
      activityDescription: description,
      activityCategory: 'security',
      publicIp,
      riskLevel,
      complianceRelevant: true,
      success: !errorMessage,
      errorMessage
    });
  }

  /**
   * Log system configuration changes
   */
  async logConfigChange(
    userId: number,
    username: string,
    configType: string,
    configName: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>
  ): Promise<void> {
    await this.logActivity({
      userId,
      username,
      activityType: 'config_change',
      activityDescription: `System configuration changed: ${configType} - ${configName}`,
      activityCategory: 'system',
      targetType: 'system_config',
      targetId: configType,
      targetName: configName,
      oldValues,
      newValues,
      riskLevel: 'medium',
      complianceRelevant: true,
      success: true
    });
  }

  /**
   * Create user session record
   */
  private async createUserSession(sessionData: UserSessionData): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT INTO user_sessions (
          session_id, user_id, username, login_ip, login_user_agent,
          status, device_type, browser, compliance_session,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        sessionData.sessionId,
        sessionData.userId || null,
        sessionData.username || null,
        sessionData.loginIp || null,
        sessionData.loginUserAgent || null,
        sessionData.status || 'active',
        sessionData.deviceType || null,
        sessionData.browser || null,
        sessionData.complianceSession ? 1 : 0
      ).run();
    } catch (error) {
      console.error('Failed to create user session:', error);
    }
  }

  /**
   * End user session
   */
  private async endUserSession(sessionId: string, reason: string): Promise<void> {
    try {
      await this.db.prepare(`
        UPDATE user_sessions 
        SET status = 'logged_out', logout_timestamp = CURRENT_TIMESTAMP, logout_reason = ?, updated_at = CURRENT_TIMESTAMP
        WHERE session_id = ?
      `).bind(reason, sessionId).run();
    } catch (error) {
      console.error('Failed to end user session:', error);
    }
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filters: {
    userId?: number;
    activityType?: string;
    activityCategory?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<any[]> {
    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params: any[] = [];

    if (filters.userId) {
      query += ' AND user_id = ?';
      params.push(filters.userId);
    }
    
    if (filters.activityType) {
      query += ' AND activity_type = ?';
      params.push(filters.activityType);
    }

    if (filters.activityCategory) {
      query += ' AND activity_category = ?';
      params.push(filters.activityCategory);
    }

    if (filters.startDate) {
      query += ' AND created_at >= ?';
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      query += ' AND created_at <= ?';
      params.push(filters.endDate);
    }

    query += ' ORDER BY created_at DESC';

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

  /**
   * Get user sessions
   */
  async getUserSessions(filters: {
    userId?: number;
    status?: string;
    limit?: number;
  } = {}): Promise<any[]> {
    let query = 'SELECT * FROM user_sessions WHERE 1=1';
    const params: any[] = [];

    if (filters.userId) {
      query += ' AND user_id = ?';
      params.push(filters.userId);
    }

    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY login_timestamp DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    try {
      const result = await this.db.prepare(query).bind(...params).all();
      return result.results || [];
    } catch (error) {
      console.error('Failed to get user sessions:', error);
      return [];
    }
  }

  /**
   * Helper methods
   */
  private getCategoryFromTargetType(targetType: string): string {
    const categoryMap: Record<string, string> = {
      'risk': 'risk_management',
      'compliance_framework': 'compliance',
      'asset': 'system',
      'user': 'system',
      'system_config': 'system'
    };
    return categoryMap[targetType] || 'data_access';
  }

  private getDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
    if (/Mobile|Android|iPhone/.test(userAgent)) return 'mobile';
    if (/iPad|Tablet/.test(userAgent)) return 'tablet';
    return 'desktop';
  }

  private getBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
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