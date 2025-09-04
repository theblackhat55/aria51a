/**
 * Role-Based Access Control (RBAC) Service
 * 
 * Provides comprehensive role and permission management for the ARIA5-Ubuntu platform.
 * Implements hierarchical roles, fine-grained permissions, and resource-based access control.
 */

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;  // e.g., 'assets', 'services', 'risks', 'settings'
  action: string;    // e.g., 'read', 'write', 'delete', 'manage'
  conditions?: string; // JSON string for conditional logic
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  level: number;     // Hierarchy level (1=lowest, 100=highest)
  is_system: boolean; // System roles cannot be deleted
  permissions: string[]; // Array of permission IDs
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  user_id: string;
  role_id: string;
  granted_by: string;
  granted_at: string;
  expires_at?: string;
  is_active: boolean;
}

export interface AccessRequest {
  user_id: string;
  resource: string;
  action: string;
  resource_id?: string;
  context?: Record<string, any>;
}

export interface AccessResult {
  granted: boolean;
  reason?: string;
  role?: string;
  permission?: string;
  conditions_met?: boolean;
}

export interface RoleHierarchy {
  role_id: string;
  parent_role_id: string;
  inherits_permissions: boolean;
}

export class RBACService {
  constructor(private db: D1Database) {}

  /**
   * Initialize RBAC tables and default roles
   */
  async initializeTables(): Promise<void> {
    // Create permissions table
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS rbac_permissions (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        resource TEXT NOT NULL,
        action TEXT NOT NULL,
        conditions TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(resource, action)
      )
    `).run();

    // Create roles table
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS rbac_roles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        description TEXT,
        level INTEGER NOT NULL DEFAULT 1,
        is_system BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    // Create role permissions junction table
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS rbac_role_permissions (
        role_id TEXT,
        permission_id TEXT,
        granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (role_id, permission_id),
        FOREIGN KEY (role_id) REFERENCES rbac_roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES rbac_permissions(id) ON DELETE CASCADE
      )
    `).run();

    // Create user roles table
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS rbac_user_roles (
        user_id TEXT,
        role_id TEXT,
        granted_by TEXT,
        granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME,
        is_active BOOLEAN DEFAULT TRUE,
        PRIMARY KEY (user_id, role_id),
        FOREIGN KEY (role_id) REFERENCES rbac_roles(id) ON DELETE CASCADE,
        FOREIGN KEY (granted_by) REFERENCES users(id)
      )
    `).run();

    // Create role hierarchy table
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS rbac_role_hierarchy (
        role_id TEXT,
        parent_role_id TEXT,
        inherits_permissions BOOLEAN DEFAULT TRUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (role_id, parent_role_id),
        FOREIGN KEY (role_id) REFERENCES rbac_roles(id) ON DELETE CASCADE,
        FOREIGN KEY (parent_role_id) REFERENCES rbac_roles(id) ON DELETE CASCADE
      )
    `).run();

    // Create access log table for auditing
    await this.db.prepare(`
      CREATE TABLE IF NOT EXISTS rbac_access_log (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        resource TEXT NOT NULL,
        action TEXT NOT NULL,
        resource_id TEXT,
        granted BOOLEAN,
        role_used TEXT,
        permission_used TEXT,
        reason TEXT,
        ip_address TEXT,
        user_agent TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `).run();

    // Create indexes for performance
    await this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_rbac_permissions_resource ON rbac_permissions(resource)`).run();
    await this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_rbac_roles_level ON rbac_roles(level)`).run();
    await this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_rbac_user_roles_active ON rbac_user_roles(user_id, is_active)`).run();
    await this.db.prepare(`CREATE INDEX IF NOT EXISTS idx_rbac_access_log_user ON rbac_access_log(user_id, timestamp)`).run();

    // Initialize default permissions and roles
    await this.initializeDefaultData();
  }

  /**
   * Initialize default permissions and roles
   */
  private async initializeDefaultData(): Promise<void> {
    // Default permissions
    const defaultPermissions = [
      // Asset Management
      { resource: 'assets', action: 'read', description: 'View assets' },
      { resource: 'assets', action: 'write', description: 'Create and edit assets' },
      { resource: 'assets', action: 'delete', description: 'Delete assets' },
      { resource: 'assets', action: 'import', description: 'Import assets from external sources' },
      
      // Service Management
      { resource: 'services', action: 'read', description: 'View services' },
      { resource: 'services', action: 'write', description: 'Create and edit services' },
      { resource: 'services', action: 'delete', description: 'Delete services' },
      { resource: 'services', action: 'manage', description: 'Full service management' },
      
      // Risk Management
      { resource: 'risks', action: 'read', description: 'View risk assessments' },
      { resource: 'risks', action: 'write', description: 'Create and edit risk assessments' },
      { resource: 'risks', action: 'delete', description: 'Delete risk assessments' },
      { resource: 'risks', action: 'approve', description: 'Approve risk assessments' },
      { resource: 'risks', action: 'ai_analyze', description: 'Use AI analysis features' },
      
      // User Management
      { resource: 'users', action: 'read', description: 'View user accounts' },
      { resource: 'users', action: 'write', description: 'Create and edit user accounts' },
      { resource: 'users', action: 'delete', description: 'Delete user accounts' },
      { resource: 'users', action: 'manage_roles', description: 'Assign roles to users' },
      
      // System Administration
      { resource: 'system', action: 'settings', description: 'Modify system settings' },
      { resource: 'system', action: 'audit', description: 'Access audit logs' },
      { resource: 'system', action: 'backup', description: 'Perform system backups' },
      { resource: 'system', action: 'admin', description: 'Full system administration' },
      
      // Reporting
      { resource: 'reports', action: 'read', description: 'View reports' },
      { resource: 'reports', action: 'generate', description: 'Generate new reports' },
      { resource: 'reports', action: 'export', description: 'Export reports' },
      
      // Operations
      { resource: 'operations', action: 'read', description: 'View operations data' },
      { resource: 'operations', action: 'manage', description: 'Manage operations' }
    ];

    for (const perm of defaultPermissions) {
      const id = `perm_${perm.resource}_${perm.action}`;
      await this.db.prepare(`
        INSERT OR IGNORE INTO rbac_permissions (id, name, description, resource, action)
        VALUES (?, ?, ?, ?, ?)
      `).bind(id, `${perm.resource}:${perm.action}`, perm.description, perm.resource, perm.action).run();
    }

    // Default roles with hierarchy
    const defaultRoles = [
      {
        id: 'role_viewer',
        name: 'Viewer',
        description: 'Read-only access to basic information',
        level: 10,
        is_system: true,
        permissions: ['perm_assets_read', 'perm_services_read', 'perm_risks_read', 'perm_reports_read', 'perm_operations_read']
      },
      {
        id: 'role_analyst',
        name: 'Risk Analyst',
        description: 'Can create and edit risk assessments',
        level: 20,
        is_system: true,
        permissions: [
          'perm_assets_read', 'perm_services_read', 'perm_risks_read', 'perm_risks_write', 
          'perm_risks_ai_analyze', 'perm_reports_read', 'perm_reports_generate', 'perm_operations_read'
        ]
      },
      {
        id: 'role_manager',
        name: 'Security Manager',
        description: 'Can manage services and approve risk assessments',
        level: 30,
        is_system: true,
        permissions: [
          'perm_assets_read', 'perm_assets_write', 'perm_services_read', 'perm_services_write',
          'perm_risks_read', 'perm_risks_write', 'perm_risks_approve', 'perm_risks_ai_analyze',
          'perm_reports_read', 'perm_reports_generate', 'perm_reports_export', 'perm_operations_read'
        ]
      },
      {
        id: 'role_admin',
        name: 'Administrator',
        description: 'Full administrative access',
        level: 50,
        is_system: true,
        permissions: [
          'perm_assets_read', 'perm_assets_write', 'perm_assets_delete', 'perm_assets_import',
          'perm_services_read', 'perm_services_write', 'perm_services_delete', 'perm_services_manage',
          'perm_risks_read', 'perm_risks_write', 'perm_risks_delete', 'perm_risks_approve', 'perm_risks_ai_analyze',
          'perm_users_read', 'perm_users_write', 'perm_users_manage_roles',
          'perm_reports_read', 'perm_reports_generate', 'perm_reports_export',
          'perm_system_settings', 'perm_system_audit', 'perm_operations_read', 'perm_operations_manage'
        ]
      },
      {
        id: 'role_superadmin',
        name: 'Super Administrator',
        description: 'Unrestricted system access',
        level: 100,
        is_system: true,
        permissions: [] // Will get all permissions
      }
    ];

    // Insert roles
    for (const role of defaultRoles) {
      await this.db.prepare(`
        INSERT OR IGNORE INTO rbac_roles (id, name, description, level, is_system)
        VALUES (?, ?, ?, ?, ?)
      `).bind(role.id, role.name, role.description, role.level, role.is_system).run();

      // Assign permissions to role
      if (role.id === 'role_superadmin') {
        // Super admin gets all permissions
        const allPermissions = await this.db.prepare(`SELECT id FROM rbac_permissions`).all();
        for (const perm of allPermissions.results) {
          await this.db.prepare(`
            INSERT OR IGNORE INTO rbac_role_permissions (role_id, permission_id)
            VALUES (?, ?)
          `).bind(role.id, (perm as any).id).run();
        }
      } else {
        // Assign specific permissions
        for (const permId of role.permissions) {
          await this.db.prepare(`
            INSERT OR IGNORE INTO rbac_role_permissions (role_id, permission_id)
            VALUES (?, ?)
          `).bind(role.id, permId).run();
        }
      }
    }
  }

  /**
   * Check if user has access to a specific resource and action
   */
  async checkAccess(request: AccessRequest, context?: { ip?: string; userAgent?: string }): Promise<AccessResult> {
    const logId = `log_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    try {
      // Get user's active roles
      const userRoles = await this.db.prepare(`
        SELECT r.*, ur.expires_at
        FROM rbac_roles r
        JOIN rbac_user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = ? AND ur.is_active = TRUE
        AND (ur.expires_at IS NULL OR ur.expires_at > datetime('now'))
        ORDER BY r.level DESC
      `).bind(request.user_id).all();

      if (!userRoles.results || userRoles.results.length === 0) {
        await this.logAccess(logId, request, false, null, null, 'No active roles', context);
        return { granted: false, reason: 'No active roles assigned' };
      }

      // Check each role for the required permission
      for (const role of userRoles.results as any[]) {
        // Get role permissions (including inherited permissions)
        const permissions = await this.getRolePermissions(role.id, true);
        
        // Check if any permission matches the request
        for (const permission of permissions) {
          if (permission.resource === request.resource && permission.action === request.action) {
            // Check conditions if any
            if (permission.conditions) {
              const conditionsMet = await this.evaluateConditions(
                permission.conditions, 
                request, 
                { userId: request.user_id, roleLevel: role.level }
              );
              
              if (!conditionsMet) {
                continue; // Try next permission
              }
            }

            // Access granted
            await this.logAccess(logId, request, true, role.name, permission.name, 'Access granted', context);
            return {
              granted: true,
              role: role.name,
              permission: permission.name,
              conditions_met: true
            };
          }
        }
      }

      // No matching permission found
      await this.logAccess(logId, request, false, null, null, 'No matching permission', context);
      return { granted: false, reason: 'Insufficient permissions' };

    } catch (error) {
      await this.logAccess(logId, request, false, null, null, `Error: ${error}`, context);
      throw error;
    }
  }

  /**
   * Get all permissions for a role (with optional inheritance)
   */
  async getRolePermissions(roleId: string, includeInherited: boolean = false): Promise<Permission[]> {
    let query = `
      SELECT p.*
      FROM rbac_permissions p
      JOIN rbac_role_permissions rp ON p.id = rp.permission_id
      WHERE rp.role_id = ?
    `;

    const params = [roleId];

    if (includeInherited) {
      // Include permissions from parent roles
      query = `
        WITH RECURSIVE role_hierarchy AS (
          SELECT role_id, parent_role_id, 1 as level
          FROM rbac_role_hierarchy
          WHERE role_id = ?
          
          UNION ALL
          
          SELECT rh.role_id, rh.parent_role_id, h.level + 1
          FROM rbac_role_hierarchy rh
          JOIN role_hierarchy h ON rh.role_id = h.parent_role_id
          WHERE h.level < 10  -- Prevent infinite recursion
        )
        SELECT DISTINCT p.*
        FROM rbac_permissions p
        JOIN rbac_role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id IN (
          SELECT DISTINCT COALESCE(parent_role_id, ?) FROM role_hierarchy
          UNION SELECT ?
        )
      `;
      params.push(roleId, roleId);
    }

    const result = await this.db.prepare(query).bind(...params).all();
    return result.results as Permission[];
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: string, roleId: string, grantedBy: string, expiresAt?: string): Promise<void> {
    // Check if granter has permission to assign roles
    const canAssign = await this.checkAccess({
      user_id: grantedBy,
      resource: 'users',
      action: 'manage_roles'
    });

    if (!canAssign.granted) {
      throw new Error('Insufficient permissions to assign roles');
    }

    // Check if role exists
    const role = await this.db.prepare(`
      SELECT * FROM rbac_roles WHERE id = ?
    `).bind(roleId).first();

    if (!role) {
      throw new Error('Role not found');
    }

    // Assign role
    await this.db.prepare(`
      INSERT OR REPLACE INTO rbac_user_roles (user_id, role_id, granted_by, expires_at)
      VALUES (?, ?, ?, ?)
    `).bind(userId, roleId, grantedBy, expiresAt).run();
  }

  /**
   * Remove role from user
   */
  async removeRole(userId: string, roleId: string, removedBy: string): Promise<void> {
    // Check permissions
    const canRemove = await this.checkAccess({
      user_id: removedBy,
      resource: 'users',
      action: 'manage_roles'
    });

    if (!canRemove.granted) {
      throw new Error('Insufficient permissions to remove roles');
    }

    await this.db.prepare(`
      UPDATE rbac_user_roles 
      SET is_active = FALSE 
      WHERE user_id = ? AND role_id = ?
    `).bind(userId, roleId).run();
  }

  /**
   * Create new custom role
   */
  async createRole(roleData: Omit<Role, 'id' | 'created_at' | 'updated_at'>, createdBy: string): Promise<string> {
    // Check permissions
    const canCreate = await this.checkAccess({
      user_id: createdBy,
      resource: 'system',
      action: 'admin'
    });

    if (!canCreate.granted) {
      throw new Error('Insufficient permissions to create roles');
    }

    const roleId = `role_${Date.now()}_${Math.random().toString(36).substring(2)}`;
    
    await this.db.prepare(`
      INSERT INTO rbac_roles (id, name, description, level, is_system)
      VALUES (?, ?, ?, ?, ?)
    `).bind(roleId, roleData.name, roleData.description, roleData.level, false).run();

    // Assign permissions if provided
    if (roleData.permissions && roleData.permissions.length > 0) {
      for (const permissionId of roleData.permissions) {
        await this.db.prepare(`
          INSERT INTO rbac_role_permissions (role_id, permission_id)
          VALUES (?, ?)
        `).bind(roleId, permissionId).run();
      }
    }

    return roleId;
  }

  /**
   * Get user's roles and permissions
   */
  async getUserRolesAndPermissions(userId: string): Promise<{
    roles: Role[];
    permissions: Permission[];
    effectiveLevel: number;
  }> {
    // Get active roles
    const roles = await this.db.prepare(`
      SELECT r.*
      FROM rbac_roles r
      JOIN rbac_user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ? AND ur.is_active = TRUE
      AND (ur.expires_at IS NULL OR ur.expires_at > datetime('now'))
      ORDER BY r.level DESC
    `).bind(userId).all();

    const userRoles = roles.results as Role[];
    let allPermissions: Permission[] = [];
    let effectiveLevel = 0;

    // Collect all permissions from all roles
    const permissionMap = new Map<string, Permission>();
    
    for (const role of userRoles) {
      effectiveLevel = Math.max(effectiveLevel, role.level);
      const rolePermissions = await this.getRolePermissions(role.id, true);
      
      for (const permission of rolePermissions) {
        permissionMap.set(permission.id, permission);
      }
    }

    allPermissions = Array.from(permissionMap.values());

    return {
      roles: userRoles,
      permissions: allPermissions,
      effectiveLevel
    };
  }

  /**
   * Evaluate conditions for conditional permissions
   */
  private async evaluateConditions(
    conditions: string, 
    request: AccessRequest, 
    context: { userId: string; roleLevel: number }
  ): Promise<boolean> {
    try {
      const conditionObj = JSON.parse(conditions);
      
      // Simple condition evaluation - can be extended
      if (conditionObj.resource_owner_only) {
        // Check if user owns the resource
        if (request.resource_id) {
          const ownerCheck = await this.checkResourceOwnership(
            request.resource, 
            request.resource_id, 
            context.userId
          );
          return ownerCheck;
        }
      }

      if (conditionObj.min_role_level) {
        return context.roleLevel >= conditionObj.min_role_level;
      }

      if (conditionObj.time_based) {
        const now = new Date();
        const currentHour = now.getHours();
        
        if (conditionObj.time_based.business_hours_only) {
          return currentHour >= 9 && currentHour <= 17;
        }
      }

      return true;
    } catch (error) {
      console.error('Error evaluating conditions:', error);
      return false;
    }
  }

  /**
   * Check if user owns a specific resource
   */
  private async checkResourceOwnership(resource: string, resourceId: string, userId: string): Promise<boolean> {
    let query = '';
    
    switch (resource) {
      case 'risks':
        query = 'SELECT 1 FROM risk_assessments WHERE id = ? AND created_by = ?';
        break;
      case 'services':
        query = 'SELECT 1 FROM services WHERE id = ? AND created_by = ?';
        break;
      case 'assets':
        query = 'SELECT 1 FROM assets WHERE id = ? AND created_by = ?';
        break;
      default:
        return false;
    }

    const result = await this.db.prepare(query).bind(resourceId, userId).first();
    return !!result;
  }

  /**
   * Log access attempt for auditing
   */
  private async logAccess(
    logId: string,
    request: AccessRequest, 
    granted: boolean, 
    roleUsed: string | null, 
    permissionUsed: string | null,
    reason: string,
    context?: { ip?: string; userAgent?: string }
  ): Promise<void> {
    await this.db.prepare(`
      INSERT INTO rbac_access_log (
        id, user_id, resource, action, resource_id, granted, 
        role_used, permission_used, reason, ip_address, user_agent
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      logId,
      request.user_id,
      request.resource,
      request.action,
      request.resource_id,
      granted,
      roleUsed,
      permissionUsed,
      reason,
      context?.ip,
      context?.userAgent
    ).run();
  }

  /**
   * Get access logs for auditing
   */
  async getAccessLogs(options: {
    userId?: string;
    resource?: string;
    granted?: boolean;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ logs: any[]; total: number }> {
    let whereClause = '1=1';
    const params: any[] = [];

    if (options.userId) {
      whereClause += ' AND user_id = ?';
      params.push(options.userId);
    }

    if (options.resource) {
      whereClause += ' AND resource = ?';
      params.push(options.resource);
    }

    if (options.granted !== undefined) {
      whereClause += ' AND granted = ?';
      params.push(options.granted);
    }

    if (options.startDate) {
      whereClause += ' AND timestamp >= ?';
      params.push(options.startDate);
    }

    if (options.endDate) {
      whereClause += ' AND timestamp <= ?';
      params.push(options.endDate);
    }

    // Get total count
    const countResult = await this.db.prepare(`
      SELECT COUNT(*) as count FROM rbac_access_log WHERE ${whereClause}
    `).bind(...params).first();

    const total = (countResult as any)?.count || 0;

    // Get logs with pagination
    const limit = options.limit || 50;
    const offset = options.offset || 0;

    const logs = await this.db.prepare(`
      SELECT *, 
        (SELECT email FROM users WHERE id = user_id) as user_email
      FROM rbac_access_log 
      WHERE ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    return {
      logs: logs.results || [],
      total
    };
  }

  /**
   * Clean up expired roles and old logs
   */
  async cleanup(): Promise<void> {
    // Deactivate expired roles
    await this.db.prepare(`
      UPDATE rbac_user_roles 
      SET is_active = FALSE 
      WHERE expires_at <= datetime('now') AND is_active = TRUE
    `).run();

    // Clean up old access logs (keep last 90 days)
    await this.db.prepare(`
      DELETE FROM rbac_access_log 
      WHERE timestamp < datetime('now', '-90 days')
    `).run();
  }

  /**
   * Get role statistics
   */
  async getRoleStatistics(): Promise<{
    totalRoles: number;
    totalPermissions: number;
    activeUserRoles: number;
    recentAccess: number;
  }> {
    const stats = await Promise.all([
      this.db.prepare('SELECT COUNT(*) as count FROM rbac_roles').first(),
      this.db.prepare('SELECT COUNT(*) as count FROM rbac_permissions').first(),
      this.db.prepare('SELECT COUNT(*) as count FROM rbac_user_roles WHERE is_active = TRUE').first(),
      this.db.prepare('SELECT COUNT(*) as count FROM rbac_access_log WHERE timestamp > datetime("now", "-24 hours")').first()
    ]);

    return {
      totalRoles: (stats[0] as any)?.count || 0,
      totalPermissions: (stats[1] as any)?.count || 0,
      activeUserRoles: (stats[2] as any)?.count || 0,
      recentAccess: (stats[3] as any)?.count || 0
    };
  }
}