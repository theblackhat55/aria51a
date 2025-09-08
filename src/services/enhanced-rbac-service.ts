/**
 * Enhanced Role-Based Access Control (RBAC) Service
 * Provides advanced permission checking, role management, and SAML integration
 */

export interface Permission {
  resource: string;
  action: string;
}

export interface Role {
  id: number;
  name: string;
  description: string;
  permissions: Record<string, any>;
  is_system_role: boolean;
}

export interface UserRole {
  user_id: number;
  role_id: number;
  assigned_by: number;
  assigned_at: string;
  expires_at?: string;
}

export interface EnhancedUser {
  id: number;
  username: string;
  email: string;
  role: string; // Legacy role field
  auth_type: 'local' | 'saml';
  department?: string;
  manager_id?: number;
  permissions?: Record<string, any>;
  roles?: Role[];
  is_active: boolean;
  last_login?: string;
  failed_login_attempts: number;
  locked_until?: string;
}

export class EnhancedRBACService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  /**
   * Check if user has permission for a specific resource and action
   */
  async hasPermission(userId: number, resource: string, action: string): Promise<boolean> {
    try {
      const userPermissions = await this.getUserPermissions(userId);
      
      // Check if user has specific permission
      if (userPermissions[resource]) {
        return userPermissions[resource][action] === true || userPermissions[resource].all === true;
      }

      // Check if user has admin.all permission (super admin)
      if (userPermissions.admin && userPermissions.admin.all === true) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  /**
   * Get comprehensive user permissions from roles and individual permissions
   */
  async getUserPermissions(userId: number): Promise<Record<string, any>> {
    try {
      // Get user's roles and permissions
      const userRoles = await this.db.prepare(`
        SELECT r.* 
        FROM roles r
        JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = ? AND (ur.expires_at IS NULL OR ur.expires_at > datetime('now'))
      `).bind(userId).all();

      // Get user-specific permissions
      const user = await this.db.prepare(`
        SELECT permissions 
        FROM users 
        WHERE id = ?
      `).bind(userId).first();

      // Merge all permissions
      let mergedPermissions: Record<string, any> = {};

      // Add role-based permissions
      for (const role of userRoles.results || []) {
        if (role.permissions) {
          const rolePermissions = JSON.parse(role.permissions);
          mergedPermissions = this.mergePermissions(mergedPermissions, rolePermissions);
        }
      }

      // Add user-specific permissions (override role permissions)
      if (user?.permissions) {
        const userPermissions = JSON.parse(user.permissions);
        mergedPermissions = this.mergePermissions(mergedPermissions, userPermissions);
      }

      return mergedPermissions;
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return {};
    }
  }

  /**
   * Merge permission objects with precedence
   */
  private mergePermissions(base: Record<string, any>, override: Record<string, any>): Record<string, any> {
    const merged = { ...base };
    
    for (const [resource, actions] of Object.entries(override)) {
      if (typeof actions === 'object' && !Array.isArray(actions)) {
        merged[resource] = { ...merged[resource], ...actions };
      } else {
        merged[resource] = actions;
      }
    }
    
    return merged;
  }

  /**
   * Get user with enhanced RBAC information
   */
  async getEnhancedUser(userId: number): Promise<EnhancedUser | null> {
    try {
      const user = await this.db.prepare(`
        SELECT u.*, o.name as organization_name
        FROM users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        WHERE u.id = ?
      `).bind(userId).first();

      if (!user) return null;

      // Get user's roles
      const roles = await this.db.prepare(`
        SELECT r.*
        FROM roles r
        JOIN user_roles ur ON r.id = ur.role_id
        WHERE ur.user_id = ? AND (ur.expires_at IS NULL OR ur.expires_at > datetime('now'))
      `).bind(userId).all();

      const userPermissions = await this.getUserPermissions(userId);

      return {
        ...user,
        roles: roles.results || [],
        permissions: userPermissions
      };
    } catch (error) {
      console.error('Error getting enhanced user:', error);
      return null;
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: number, roleId: number, assignedBy: number, expiresAt?: string): Promise<boolean> {
    try {
      await this.db.prepare(`
        INSERT OR REPLACE INTO user_roles (user_id, role_id, assigned_by, expires_at)
        VALUES (?, ?, ?, ?)
      `).bind(userId, roleId, assignedBy, expiresAt || null).run();

      // Log the role assignment
      await this.logUserAction(userId, 'role_assigned', {
        role_id: roleId,
        assigned_by: assignedBy,
        expires_at: expiresAt
      }, assignedBy);

      return true;
    } catch (error) {
      console.error('Error assigning role:', error);
      return false;
    }
  }

  /**
   * Remove role from user
   */
  async removeRole(userId: number, roleId: number, removedBy: number): Promise<boolean> {
    try {
      await this.db.prepare(`
        DELETE FROM user_roles 
        WHERE user_id = ? AND role_id = ?
      `).bind(userId, roleId).run();

      // Log the role removal
      await this.logUserAction(userId, 'role_removed', {
        role_id: roleId,
        removed_by: removedBy
      }, removedBy);

      return true;
    } catch (error) {
      console.error('Error removing role:', error);
      return false;
    }
  }

  /**
   * Get all available roles
   */
  async getAllRoles(): Promise<Role[]> {
    try {
      const roles = await this.db.prepare(`
        SELECT * FROM roles 
        ORDER BY is_system_role DESC, name ASC
      `).all();

      return roles.results?.map((role: any) => ({
        ...role,
        permissions: role.permissions ? JSON.parse(role.permissions) : {}
      })) || [];
    } catch (error) {
      console.error('Error getting roles:', error);
      return [];
    }
  }

  /**
   * Create new role
   */
  async createRole(name: string, description: string, permissions: Record<string, any>, createdBy: number): Promise<number | null> {
    try {
      const result = await this.db.prepare(`
        INSERT INTO roles (name, description, permissions, is_system_role)
        VALUES (?, ?, ?, 0)
      `).bind(name, description, JSON.stringify(permissions)).run();

      // Log role creation
      await this.logUserAction(null, 'role_created', {
        role_id: result.meta.last_row_id,
        name,
        description,
        permissions
      }, createdBy);

      return result.meta.last_row_id as number;
    } catch (error) {
      console.error('Error creating role:', error);
      return null;
    }
  }

  /**
   * Update role permissions
   */
  async updateRole(roleId: number, name: string, description: string, permissions: Record<string, any>, updatedBy: number): Promise<boolean> {
    try {
      await this.db.prepare(`
        UPDATE roles 
        SET name = ?, description = ?, permissions = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND is_system_role = 0
      `).bind(name, description, JSON.stringify(permissions), roleId).run();

      // Log role update
      await this.logUserAction(null, 'role_updated', {
        role_id: roleId,
        name,
        description,
        permissions
      }, updatedBy);

      return true;
    } catch (error) {
      console.error('Error updating role:', error);
      return false;
    }
  }

  /**
   * Check if user account is locked
   */
  async isUserLocked(userId: number): Promise<boolean> {
    try {
      const user = await this.db.prepare(`
        SELECT locked_until FROM users WHERE id = ?
      `).bind(userId).first();

      if (!user?.locked_until) return false;

      const lockExpiry = new Date(user.locked_until);
      const now = new Date();

      return lockExpiry > now;
    } catch (error) {
      console.error('Error checking user lock status:', error);
      return false;
    }
  }

  /**
   * Lock user account
   */
  async lockUser(userId: number, lockDurationMinutes: number = 30, lockedBy: number): Promise<boolean> {
    try {
      const lockUntil = new Date();
      lockUntil.setMinutes(lockUntil.getMinutes() + lockDurationMinutes);

      await this.db.prepare(`
        UPDATE users 
        SET locked_until = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(lockUntil.toISOString(), userId).run();

      // Log user lock
      await this.logUserAction(userId, 'user_locked', {
        locked_until: lockUntil.toISOString(),
        duration_minutes: lockDurationMinutes
      }, lockedBy);

      return true;
    } catch (error) {
      console.error('Error locking user:', error);
      return false;
    }
  }

  /**
   * Unlock user account
   */
  async unlockUser(userId: number, unlockedBy: number): Promise<boolean> {
    try {
      await this.db.prepare(`
        UPDATE users 
        SET locked_until = NULL, failed_login_attempts = 0, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(userId).run();

      // Log user unlock
      await this.logUserAction(userId, 'user_unlocked', {}, unlockedBy);

      return true;
    } catch (error) {
      console.error('Error unlocking user:', error);
      return false;
    }
  }

  /**
   * Record failed login attempt
   */
  async recordFailedLogin(userId: number, maxAttempts: number = 5): Promise<{ locked: boolean; attempts: number }> {
    try {
      // Increment failed attempts
      const result = await this.db.prepare(`
        UPDATE users 
        SET failed_login_attempts = failed_login_attempts + 1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(userId).run();

      // Get updated attempt count
      const user = await this.db.prepare(`
        SELECT failed_login_attempts FROM users WHERE id = ?
      `).bind(userId).first();

      const attempts = user?.failed_login_attempts || 0;

      // Lock account if max attempts exceeded
      if (attempts >= maxAttempts) {
        await this.lockUser(userId, 30, -1); // System lock
        return { locked: true, attempts };
      }

      return { locked: false, attempts };
    } catch (error) {
      console.error('Error recording failed login:', error);
      return { locked: false, attempts: 0 };
    }
  }

  /**
   * Reset failed login attempts on successful login
   */
  async resetFailedLogins(userId: number): Promise<boolean> {
    try {
      await this.db.prepare(`
        UPDATE users 
        SET failed_login_attempts = 0, last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(userId).run();

      return true;
    } catch (error) {
      console.error('Error resetting failed logins:', error);
      return false;
    }
  }

  /**
   * Log user management actions for audit trail
   */
  private async logUserAction(userId: number | null, action: string, details: any, performedBy: number): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT INTO user_audit_log (user_id, action, details, performed_by)
        VALUES (?, ?, ?, ?)
      `).bind(userId, action, JSON.stringify(details), performedBy).run();
    } catch (error) {
      console.error('Error logging user action:', error);
    }
  }

  /**
   * Get user audit trail
   */
  async getUserAuditTrail(userId: number, limit: number = 50): Promise<any[]> {
    try {
      const audit = await this.db.prepare(`
        SELECT 
          ual.*,
          u.username as performed_by_username
        FROM user_audit_log ual
        LEFT JOIN users u ON ual.performed_by = u.id
        WHERE ual.user_id = ?
        ORDER BY ual.timestamp DESC
        LIMIT ?
      `).bind(userId, limit).all();

      return audit.results?.map((entry: any) => ({
        ...entry,
        details: entry.details ? JSON.parse(entry.details) : {}
      })) || [];
    } catch (error) {
      console.error('Error getting user audit trail:', error);
      return [];
    }
  }

  /**
   * Check if user has specific role
   */
  async hasRole(userId: number, roleName: string): Promise<boolean> {
    try {
      const result = await this.db.prepare(`
        SELECT 1
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = ? AND r.name = ? AND (ur.expires_at IS NULL OR ur.expires_at > datetime('now'))
      `).bind(userId, roleName).first();

      return !!result;
    } catch (error) {
      console.error('Error checking user role:', error);
      return false;
    }
  }

  /**
   * Get users with enhanced RBAC information for management interface
   */
  async getUsersWithRoles(filters: {
    searchQuery?: string;
    roleFilter?: string;
    departmentFilter?: string;
    authTypeFilter?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    users: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      const { searchQuery = '', roleFilter = '', departmentFilter = '', authTypeFilter = '', page = 1, limit = 10 } = filters;
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT DISTINCT
          u.*,
          o.name as organization_name,
          GROUP_CONCAT(r.name) as role_names,
          CASE 
            WHEN u.last_login IS NULL THEN 'Never'
            WHEN datetime(u.last_login, '+1 hour') > datetime('now') THEN 'Less than 1 hour ago'
            WHEN datetime(u.last_login, '+1 day') > datetime('now') THEN 'Less than 1 day ago'
            ELSE strftime('%Y-%m-%d', u.last_login)
          END as last_login_formatted,
          CASE
            WHEN u.locked_until IS NOT NULL AND u.locked_until > datetime('now') THEN 1
            ELSE 0
          END as is_locked
        FROM users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND (ur.expires_at IS NULL OR ur.expires_at > datetime('now'))
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE 1=1
      `;
      
      const params: any[] = [];
      
      if (searchQuery) {
        query += ` AND (u.username LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
        const searchTerm = `%${searchQuery}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      if (roleFilter) {
        query += ` AND r.name = ?`;
        params.push(roleFilter);
      }

      if (departmentFilter) {
        query += ` AND u.department = ?`;
        params.push(departmentFilter);
      }

      if (authTypeFilter) {
        query += ` AND u.auth_type = ?`;
        params.push(authTypeFilter);
      }
      
      query += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
      params.push(limit, offset);
      
      const users = await this.db.prepare(query).bind(...params).all();
      
      // Get total count for pagination
      let countQuery = `
        SELECT COUNT(DISTINCT u.id) as total 
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id AND (ur.expires_at IS NULL OR ur.expires_at > datetime('now'))
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE 1=1
      `;
      const countParams: any[] = [];
      
      if (searchQuery) {
        countQuery += ` AND (u.username LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)`;
        const searchTerm = `%${searchQuery}%`;
        countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      if (roleFilter) {
        countQuery += ` AND r.name = ?`;
        countParams.push(roleFilter);
      }

      if (departmentFilter) {
        countQuery += ` AND u.department = ?`;
        countParams.push(departmentFilter);
      }

      if (authTypeFilter) {
        countQuery += ` AND u.auth_type = ?`;
        countParams.push(authTypeFilter);
      }
      
      const totalResult = await this.db.prepare(countQuery).bind(...countParams).first();
      
      return {
        users: users.results || [],
        total: totalResult?.total || 0,
        page,
        limit,
        totalPages: Math.ceil((totalResult?.total || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching users with roles:', error);
      return { users: [], total: 0, page: 1, limit, totalPages: 0 };
    }
  }
}

/**
 * Middleware factory for RBAC permission checking
 */
export function requirePermission(resource: string, action: string) {
  return async (c: any, next: any) => {
    const user = c.get('user');
    if (!user) {
      return c.redirect('/login');
    }

    const rbacService = new EnhancedRBACService(c.env.DB);
    const hasPermission = await rbacService.hasPermission(user.id, resource, action);

    if (!hasPermission) {
      return c.html(`
        <div class="min-h-screen flex items-center justify-center bg-gray-50">
          <div class="max-w-md w-full space-y-8">
            <div class="text-center">
              <i class="fas fa-shield-alt text-6xl text-red-500 mb-4"></i>
              <h2 class="text-3xl font-extrabold text-gray-900">Access Denied</h2>
              <p class="mt-2 text-sm text-gray-600">
                You don't have permission to access this resource.
              </p>
              <p class="mt-1 text-xs text-gray-500">
                Required: ${resource}.${action}
              </p>
              <a href="/dashboard" class="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                <i class="fas fa-arrow-left mr-2"></i>
                Return to Dashboard
              </a>
            </div>
          </div>
        </div>
      `, 403);
    }

    await next();
  };
}

export default EnhancedRBACService;