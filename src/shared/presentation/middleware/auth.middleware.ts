/**
 * Authentication Middleware
 * 
 * Validates user authentication and authorization
 * This is a placeholder - actual implementation would integrate with existing auth system
 */

import { Context, Next } from 'hono';
import { UnauthorizedError, ForbiddenError } from './error.middleware';

export interface AuthenticatedUser {
  id: number;
  username: string;
  email: string;
  role: string;
  organization_id: number;
  permissions?: string[];
}

/**
 * Authentication middleware
 * Verifies that the user is authenticated
 */
export async function authMiddleware(c: Context, next: Next) {
  try {
    // TODO: Integrate with existing auth system
    // For now, check for session cookie or Authorization header
    
    const authHeader = c.req.header('Authorization');
    const sessionCookie = c.req.cookie('session');

    if (!authHeader && !sessionCookie) {
      throw new UnauthorizedError('Authentication required');
    }

    // TODO: Validate token/session and get user info
    // This would call your existing auth service
    
    // For now, set a placeholder user
    // In production, this would come from your auth system
    const user: AuthenticatedUser = {
      id: 1,
      username: 'demo',
      email: 'demo@example.com',
      role: 'admin',
      organization_id: 1,
      permissions: ['read', 'write', 'delete']
    };

    // Store user in context
    c.set('user', user);

    await next();
  } catch (error) {
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }
    throw new UnauthorizedError('Authentication failed');
  }
}

/**
 * Authorization middleware factory
 * Checks if user has required role or permission
 */
export function requireRole(...roles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthenticatedUser;

    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!roles.includes(user.role)) {
      throw new ForbiddenError(`Requires one of: ${roles.join(', ')}`);
    }

    await next();
  };
}

/**
 * Permission-based authorization
 */
export function requirePermission(...permissions: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user') as AuthenticatedUser;

    if (!user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (!user.permissions) {
      throw new ForbiddenError('Insufficient permissions');
    }

    const hasPermission = permissions.some(p => user.permissions?.includes(p));
    if (!hasPermission) {
      throw new ForbiddenError(`Requires one of: ${permissions.join(', ')}`);
    }

    await next();
  };
}

/**
 * Get current authenticated user from context
 */
export function getCurrentUser(c: Context): AuthenticatedUser {
  const user = c.get('user') as AuthenticatedUser;
  if (!user) {
    throw new UnauthorizedError('Authentication required');
  }
  return user;
}
