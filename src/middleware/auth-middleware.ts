// ARIA5.1 - Production Security Middleware
import { Context, Next } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { verifyJWT } from '../lib/security';

// JWT secret from environment or fallback
function getJWTSecret(env: any): string {
  return env?.JWT_SECRET || 'aria5-production-jwt-secret-2024-change-in-production-32-chars-minimum';
}

// Authentication middleware
export async function authMiddleware(c: Context, next: Next) {
  const token = getCookie(c, 'aria_token');
  
  if (!token) {
    return c.redirect('/login');
  }

  try {
    const secret = getJWTSecret(c.env);
    const payload = await verifyJWT(token, secret);
    
    if (!payload || !payload.userId) {
      return c.redirect('/login');
    }

    // Get user from database
    const user = await c.env.DB.prepare(`
      SELECT id, username, email, first_name, last_name, role, is_active
      FROM users 
      WHERE id = ? AND is_active = 1
    `).bind(payload.userId).first();

    if (!user) {
      return c.redirect('/login');
    }

    // Set user context
    c.set('user', user);
    
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.redirect('/login');
  }
}

// Role-based access control
export function requireRole(allowedRoles: string[]) {
  return async (c: Context, next: Next) => {
    const user = c.get('user');
    
    if (!user || !allowedRoles.includes(user.role)) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }
    
    await next();
  };
}

// Admin-only access
export async function requireAdmin(c: Context, next: Next) {
  const user = c.get('user');
  
  if (!user || user.role !== 'admin') {
    return c.json({ error: 'Admin access required' }, 403);
  }
  
  await next();
}

// CSRF protection middleware
export async function csrfMiddleware(c: Context, next: Next) {
  const method = c.req.method.toUpperCase();
  
  // Only check CSRF for state-changing operations
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const token = c.req.header('X-CSRF-Token') || 
                  (await c.req.parseBody())?.csrf_token as string;
    
    const sessionToken = getCookie(c, 'csrf_token');
    
    if (!token || !sessionToken || token !== sessionToken) {
      return c.json({ error: 'CSRF token mismatch' }, 403);
    }
  }
  
  await next();
}

// Generate CSRF token
export function generateCSRFToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Set CSRF token in cookie and return for forms
export function setCSRFToken(c: Context): string {
  const token = generateCSRFToken();
  
  setCookie(c, 'csrf_token', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
    maxAge: 3600 // 1 hour
  });
  
  return token;
}