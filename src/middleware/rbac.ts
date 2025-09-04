import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { CloudflareBindings } from '../types';

/**
 * Simple permission-based middleware
 * For now, we'll use role-based permissions mapping
 */
export function requirePermission(permission: string) {
  return async (c: Context<{ Bindings: CloudflareBindings }>, next: Next) => {
    const userRole = getCookie(c, 'user_role');
    
    if (!userRole) {
      return c.redirect('/login');
    }
    
    // Simple permission mapping based on roles
    const rolePermissions: Record<string, string[]> = {
      'admin': ['*'], // Admin has all permissions
      'security_analyst': [
        'analytics:view', 'analytics:create',
        'threat_intel:view', 'threat_intel:create',
        'incident:view', 'incident:create', 'incident:execute',
        'risks:view', 'compliance:view'
      ],
      'compliance_officer': [
        'compliance:view', 'compliance:create',
        'risks:view', 'risks:create',
        'analytics:view'
      ],
      'risk_analyst': [
        'risks:view', 'risks:create',
        'analytics:view', 'analytics:create',
        'compliance:view'
      ],
      'viewer': [
        'analytics:view', 'risks:view', 'compliance:view'
      ]
    };
    
    const userPermissions = rolePermissions[userRole] || [];
    
    // Check if user has permission (admin has all permissions with '*')
    if (!userPermissions.includes('*') && !userPermissions.includes(permission)) {
      return c.text(`Access denied - Missing permission: ${permission}`, 403);
    }
    
    await next();
  };
}