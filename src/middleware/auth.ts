import { Context, Next } from 'hono';
import { getCookie } from 'hono/cookie';
import { CloudflareBindings } from '../types';

/**
 * Simple authentication middleware that checks for user session
 */
export async function requireAuth(c: Context<{ Bindings: CloudflareBindings }>, next: Next) {
  const userEmail = getCookie(c, 'user_email');
  const userRole = getCookie(c, 'user_role');
  
  if (!userEmail || !userRole) {
    return c.redirect('/login');
  }
  
  // Set user context for the request
  c.set('userEmail', userEmail);
  c.set('userRole', userRole);
  
  await next();
}

/**
 * Simple admin role check middleware
 */
export async function requireAdmin(c: Context<{ Bindings: CloudflareBindings }>, next: Next) {
  const userRole = getCookie(c, 'user_role');
  
  if (userRole !== 'admin') {
    return c.text('Access denied - Admin role required', 403);
  }
  
  await next();
}

/**
 * Role-based middleware factory
 */
export function requireRole(allowedRoles: string[]) {
  return async (c: Context<{ Bindings: CloudflareBindings }>, next: Next) => {
    const userRole = getCookie(c, 'user_role');
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      return c.text('Access denied - Insufficient permissions', 403);
    }
    
    await next();
  };
}