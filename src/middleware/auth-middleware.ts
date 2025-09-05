/**
 * ARIA5 Authentication Middleware
 * Secure authentication and authorization middleware for Cloudflare Workers
 */

import { getCookie } from 'hono/cookie';
import { verifyJWT, getSecurityHeaders } from '../lib/security.js';
import { html } from 'hono/html';

// JWT secret should be set via environment variable in production
function getJWTSecret(env: any): string {
  return env?.JWT_SECRET || 'aria5-production-jwt-secret-2024-change-in-production-32-chars-minimum';
}

export interface AuthUser {
  id: number;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  organizationId: number;
}

/**
 * Authentication middleware - verifies JWT and sets user context
 */
export async function authMiddleware(c: any, next: any) {
  try {
    // Add security headers to all responses
    const securityHeaders = getSecurityHeaders();
    Object.entries(securityHeaders).forEach(([key, value]) => {
      c.header(key, value);
    });

    // Get JWT token from cookie
    const token = getCookie(c, 'aria_token');
    
    if (!token) {
      // No token - redirect to login
      return redirectToLogin(c);
    }

    // Verify JWT token
    const payload = await verifyJWT(token, getJWTSecret(c.env));
    
    if (!payload) {
      // Invalid token - redirect to login
      return redirectToLogin(c);
    }

    // Verify session exists and is active
    const sessionId = getCookie(c, 'aria_session');
    if (sessionId && c.env.DB) {
      try {
        const session = await c.env.DB.prepare(`
          SELECT id, user_id, expires_at, is_active 
          FROM user_sessions 
          WHERE id = ? AND user_id = ? AND is_active = 1
        `).bind(sessionId, payload.id).first();

        if (!session) {
          return redirectToLogin(c);
        }

        // Check if session expired
        if (new Date(session.expires_at) < new Date()) {
          // Deactivate expired session
          await c.env.DB.prepare(`
            UPDATE user_sessions SET is_active = 0 WHERE id = ?
          `).bind(sessionId).run();
          return redirectToLogin(c);
        }

        // Update last activity
        await c.env.DB.prepare(`
          UPDATE user_sessions SET last_activity = datetime('now') WHERE id = ?
        `).bind(sessionId).run();
        
      } catch (dbError) {
        console.error('Session verification error:', dbError);
        // Continue with JWT validation only
      }
    }

    // Set user in context
    c.set('user', payload as AuthUser);
    
    await next();
    
  } catch (error) {
    console.error('Auth middleware error:', error);
    return redirectToLogin(c);
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(allowedRoles: string[]) {
  return async (c: any, next: any) => {
    const user = c.get('user') as AuthUser;
    
    if (!user) {
      return redirectToLogin(c);
    }

    if (!allowedRoles.includes(user.role)) {
      return c.html(html`
        <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
            <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
              <div class="text-center">
                <i class="fas fa-lock text-red-500 text-4xl mb-4"></i>
                <h2 class="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
                <p class="text-gray-600 mb-4">You don't have permission to access this resource.</p>
                <p class="text-sm text-gray-500 mb-6">Required roles: ${allowedRoles.join(', ')}</p>
                <a href="/dashboard" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                  Return to Dashboard
                </a>
              </div>
            </div>
          </div>
        </div>
      `, 403);
    }

    await next();
  };
}

/**
 * Admin-only middleware
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Risk manager or admin middleware
 */
export const requireRiskManager = requireRole(['admin', 'risk_manager']);

/**
 * Compliance officer or admin middleware
 */
export const requireCompliance = requireRole(['admin', 'compliance_officer']);

/**
 * API authentication middleware (for API endpoints)
 */
export async function apiAuthMiddleware(c: any, next: any) {
  try {
    // Check for Bearer token in Authorization header
    const authHeader = c.req.header('Authorization');
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Fallback to cookie
      token = getCookie(c, 'aria_token');
    }

    if (!token) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    // Verify JWT token
    const payload = await verifyJWT(token, getJWTSecret(c.env));
    
    if (!payload) {
      return c.json({ error: 'Invalid or expired token' }, 401);
    }

    // Set user in context
    c.set('user', payload as AuthUser);
    
    await next();
    
  } catch (error) {
    console.error('API auth middleware error:', error);
    return c.json({ error: 'Authentication failed' }, 401);
  }
}

/**
 * CSRF protection middleware
 */
export async function csrfMiddleware(c: any, next: any) {
  // Skip CSRF for GET requests
  if (c.req.method === 'GET') {
    await next();
    return;
  }

  try {
    const csrfToken = getCookie(c, 'aria_csrf');
    const headerToken = c.req.header('X-CSRF-Token');
    
    // Check for CSRF token in header or form data
    if (!headerToken) {
      const formData = await c.req.parseBody();
      const formToken = formData._csrf;
      
      if (!formToken || formToken !== csrfToken) {
        return c.json({ error: 'CSRF token mismatch' }, 403);
      }
    } else if (headerToken !== csrfToken) {
      return c.json({ error: 'CSRF token mismatch' }, 403);
    }

    await next();
    
  } catch (error) {
    console.error('CSRF middleware error:', error);
    return c.json({ error: 'CSRF validation failed' }, 403);
  }
}

/**
 * Audit logging middleware
 */
export function auditMiddleware(action: string, entityType?: string) {
  return async (c: any, next: any) => {
    const user = c.get('user') as AuthUser;
    const startTime = Date.now();
    
    await next();
    
    // Log the action after request completion
    if (user && c.env.DB) {
      try {
        const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
        const userAgent = c.req.header('User-Agent') || '';
        const duration = Date.now() - startTime;
        
        await c.env.DB.prepare(`
          INSERT INTO audit_logs (user_id, action, entity_type, ip_address, user_agent, created_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'))
        `).bind(user.id, action, entityType || 'unknown', clientIP, userAgent).run();
        
      } catch (error) {
        console.error('Audit logging error:', error);
      }
    }
  };
}

/**
 * Rate limiting middleware
 */
export function rateLimitMiddleware(maxRequests: number = 100, windowMinutes: number = 1) {
  return async (c: any, next: any) => {
    const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    const endpoint = c.req.path;
    const identifier = `${clientIP}:${endpoint}`;
    
    // Simple in-memory rate limiting (for production, use Cloudflare's rate limiting)
    // This is a basic implementation - consider using Cloudflare's built-in rate limiting
    
    await next(); // For now, skip rate limiting and just continue
  };
}

/**
 * Redirect to login page
 */
function redirectToLogin(c: any) {
  // Check if it's an HTMX request
  const isHtmx = c.req.header('HX-Request') === 'true';
  
  if (isHtmx) {
    // For HTMX requests, return redirect header
    c.header('HX-Redirect', '/login');
    return c.text('', 401);
  }
  
  // For regular requests, redirect to login
  return c.redirect('/login', 302);
}

/**
 * Optional authentication (user context if available, but doesn't require auth)
 */
export async function optionalAuthMiddleware(c: any, next: any) {
  try {
    const token = getCookie(c, 'aria_token');
    
    if (token) {
      const payload = await verifyJWT(token, getJWTSecret(c.env));
      if (payload) {
        c.set('user', payload as AuthUser);
      }
    }
    
    await next();
    
  } catch (error) {
    // Ignore auth errors for optional auth
    await next();
  }
}