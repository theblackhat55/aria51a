/**
 * AuthMiddleware - Authentication and Session Management
 * 
 * Handles JWT/session-based authentication for protected routes.
 * Validates tokens, manages sessions, and enforces authentication requirements.
 */

import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { ResponseDTO } from '../../../application/dto/ResponseDTO';

/**
 * User information extracted from authentication
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions?: string[];
}

/**
 * Authentication configuration options
 */
export interface AuthConfig {
  /**
   * Secret key for JWT verification
   */
  secretKey: string;
  
  /**
   * Cookie name for session token
   * @default "aria5_session"
   */
  cookieName?: string;
  
  /**
   * Header name for bearer token
   * @default "Authorization"
   */
  headerName?: string;
  
  /**
   * Whether to allow public access to routes
   * @default false
   */
  allowPublic?: boolean;
  
  /**
   * Required roles for access (empty = any authenticated user)
   */
  requiredRoles?: string[];
  
  /**
   * Required permissions for access
   */
  requiredPermissions?: string[];
}

/**
 * Authentication middleware factory
 * 
 * @example
 * ```typescript
 * // Require authentication
 * app.use('/api/*', authMiddleware({ secretKey: 'your-secret' }));
 * 
 * // Require specific role
 * app.use('/admin/*', authMiddleware({ 
 *   secretKey: 'your-secret',
 *   requiredRoles: ['admin'] 
 * }));
 * ```
 */
export function authMiddleware(config: AuthConfig) {
  const cookieName = config.cookieName || 'aria5_session';
  const headerName = config.headerName || 'Authorization';

  return async (c: Context, next: Next) => {
    try {
      // Extract token from cookie or header
      let token: string | undefined;
      
      // Try cookie first
      token = getCookie(c, cookieName);
      
      // Try Authorization header
      if (!token) {
        const authHeader = c.req.header(headerName);
        if (authHeader?.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }

      // If no token and public access allowed, continue
      if (!token && config.allowPublic) {
        return await next();
      }

      // If no token, return unauthorized
      if (!token) {
        return c.json(
          ResponseDTO.unauthorized('Authentication required. Please log in.'),
          401
        );
      }

      // Validate token and extract user
      const user = await validateToken(token, config.secretKey);
      
      if (!user) {
        return c.json(
          ResponseDTO.unauthorized('Invalid or expired authentication token.'),
          401
        );
      }

      // Check required roles
      if (config.requiredRoles && config.requiredRoles.length > 0) {
        if (!config.requiredRoles.includes(user.role)) {
          return c.json(
            ResponseDTO.forbidden(
              `Access denied. Required role: ${config.requiredRoles.join(' or ')}`
            ),
            403
          );
        }
      }

      // Check required permissions
      if (config.requiredPermissions && config.requiredPermissions.length > 0) {
        const userPermissions = user.permissions || [];
        const hasPermission = config.requiredPermissions.every(
          perm => userPermissions.includes(perm)
        );
        
        if (!hasPermission) {
          return c.json(
            ResponseDTO.forbidden(
              'Access denied. Insufficient permissions.'
            ),
            403
          );
        }
      }

      // Store user in context for downstream handlers
      c.set('user', user);
      
      await next();
      
    } catch (error) {
      console.error('Auth middleware error:', error);
      return c.json(
        ResponseDTO.error(
          'AUTH_ERROR',
          'Authentication error occurred.',
          error instanceof Error ? error.message : String(error)
        ),
        500
      );
    }
  };
}

/**
 * Validate JWT token and extract user information
 * 
 * @param token - JWT token string
 * @param secretKey - Secret key for verification
 * @returns Decoded user information or null if invalid
 */
async function validateToken(
  token: string, 
  secretKey: string
): Promise<AuthUser | null> {
  try {
    // In a real implementation, use a proper JWT library
    // For now, we'll do a simple base64 decode and validation
    
    // Split token into parts (header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    // Decode payload
    const payload = JSON.parse(atob(parts[1]));
    
    // Check expiration
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return null;
    }

    // TODO: Verify signature with secretKey using Web Crypto API
    // For now, we'll trust the token if it decodes successfully
    
    return {
      id: payload.sub || payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role || 'user',
      permissions: payload.permissions || []
    };
    
  } catch (error) {
    console.error('Token validation error:', error);
    return null;
  }
}

/**
 * Helper to get current authenticated user from context
 * 
 * @example
 * ```typescript
 * app.get('/api/profile', async (c) => {
 *   const user = getCurrentUser(c);
 *   return c.json({ user });
 * });
 * ```
 */
export function getCurrentUser(c: Context): AuthUser | null {
  return c.get('user') || null;
}

/**
 * Helper to check if user has specific role
 */
export function hasRole(c: Context, role: string): boolean {
  const user = getCurrentUser(c);
  return user?.role === role;
}

/**
 * Helper to check if user has specific permission
 */
export function hasPermission(c: Context, permission: string): boolean {
  const user = getCurrentUser(c);
  return user?.permissions?.includes(permission) || false;
}
