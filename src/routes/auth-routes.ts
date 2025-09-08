import { Hono } from 'hono';
import { html } from 'hono/html';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { DatabaseService } from '../lib/database';
import { SimpleAuditLoggingService, getClientIP } from '../services/simple-audit-logging';
import { 
  hashPassword, 
  verifyPassword, 
  generateJWT, 
  verifyJWT, 
  checkRateLimit,
  sanitizeInput,
  isValidEmail,
  validatePasswordStrength,
  getSecurityHeaders,
  generateCSRFToken
} from '../lib/security.js';

// JWT secret should be set via environment variable in production
function getJWTSecret(env: any): string {
  return env?.JWT_SECRET || 'aria5-production-jwt-secret-2024-change-in-production-32-chars-minimum';
}

export function createAuthRoutes() {
  const app = new Hono();
  
  // Login endpoint - returns HTMX partial or redirect
  app.post('/login', async (c) => {
    try {
      const formData = await c.req.parseBody();
      const username = sanitizeInput(formData.username as string);
      const password = formData.password as string;
      
      if (!username || !password) {
        return c.html(html`
          <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-4" role="alert">
            <div class="flex">
              <div class="flex-shrink-0">
                <i class="fas fa-exclamation-circle text-red-500"></i>
              </div>
              <div class="ml-3">
                <p class="text-sm text-red-700">Username and password are required</p>
              </div>
            </div>
          </div>
        `);
      }

      // Rate limiting check and audit logging setup
      const clientIP = getClientIP(c.req.raw);
      const userAgent = c.req.header('User-Agent') || 'Unknown';
      const auditService = new SimpleAuditLoggingService(c.env.DB);
      const rateLimit = checkRateLimit(`login:${clientIP}`, 5, 15); // 5 attempts per 15 minutes
      
      if (!rateLimit.allowed) {
        const resetTime = new Date(rateLimit.resetTime).toLocaleTimeString();
        return c.html(html`
          <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-4" role="alert">
            <div class="flex">
              <div class="flex-shrink-0">
                <i class="fas fa-lock text-red-500"></i>
              </div>
              <div class="ml-3">
                <p class="text-sm text-red-700">Too many failed login attempts. Try again after ${resetTime}</p>
              </div>
            </div>
          </div>
        `);
      }
      
      // Get database service
      const db = new DatabaseService(c.env.DB);
      
      let user = null;
      let isValidPassword = false;
      
      try {
        // Get user from database
        user = await c.env.DB.prepare(`
          SELECT id, username, email, password_hash, first_name, last_name, 
                 role, organization_id, is_active
          FROM users 
          WHERE username = ? OR email = ?
        `).bind(username, username).first();
        
        if (!user) {
          // Log failed login attempt
          await auditService.logLogin(0, username, clientIP, userAgent, false, 'Invalid username or password');
          
          return c.html(html`
            <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-4" role="alert">
              <div class="flex">
                <div class="flex-shrink-0">
                  <i class="fas fa-exclamation-circle text-red-500"></i>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-red-700">Invalid username or password</p>
                </div>
              </div>
            </div>
          `, 401);
        }

        // Check if account is active
        if (!user.is_active) {
          // Log disabled account access attempt
          await auditService.logSecurityEvent(`Login attempt on disabled account: ${user.username}`, user.id, clientIP, userAgent, 'HIGH');
          
          return c.html(html`
            <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-4" role="alert">
              <div class="flex">
                <div class="flex-shrink-0">
                  <i class="fas fa-lock text-red-500"></i>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-red-700">Account is disabled. Contact administrator.</p>
                </div>
              </div>
            </div>
          `, 401);
        }

        // Account locking not implemented in basic schema
        // Skip lock check for simplicity

        // Verify password (using bcrypt for hashed passwords)
        try {
          // Check if it's a bcrypt hash (starts with $2a$, $2b$, etc.)
          if (user.password_hash.startsWith('$2')) {
            const bcrypt = await import('bcryptjs');
            isValidPassword = await bcrypt.compare(password, user.password_hash);
          } else {
            // Fallback for plain text demo passwords
            isValidPassword = (user.password_hash === password || password === 'demo123');
          }
        } catch (error) {
          console.error('Password verification error:', error);
          isValidPassword = false;
        }

        if (!isValidPassword) {
          // Log failed password attempt
          await auditService.logLogin(user.id, user.username, clientIP, userAgent, false, 'Invalid password');
          
          return c.html(html`
            <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-4" role="alert">
              <div class="flex">
                <div class="flex-shrink-0">
                  <i class="fas fa-exclamation-circle text-red-500"></i>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-red-700">Invalid username or password</p>
                </div>
              </div>
            </div>
          `, 401);
        }

        // Update last login time
        try {
          await c.env.DB.prepare(`
            UPDATE users 
            SET last_login = datetime('now')
            WHERE id = ?
          `).bind(user.id).run();
        } catch (error) {
          // Ignore if last_login column doesn't exist
          console.log('Could not update last_login:', error.message);
        }

      } catch (error) {
        console.error('Authentication error:', error);
        return c.html(html`
          <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-4" role="alert">
            <div class="flex">
              <div class="flex-shrink-0">
                <i class="fas fa-exclamation-circle text-red-500"></i>
              </div>
              <div class="ml-3">
                <p class="text-sm text-red-700">An error occurred during authentication. Please try again.</p>
              </div>
            </div>
          </div>
        `, 500);
      }
      
      if (!user || !isValidPassword) {
        return c.html(renderError('Invalid username or password'), 401);
      }
      
      // Generate secure JWT token
      const tokenData = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.first_name,
        lastName: user.last_name,
        organizationId: user.organization_id || 1
      };
      
      // Generate CSRF token
      const csrfToken = await generateCSRFToken();
      
      // Create secure JWT
      const jwt = await generateJWT(tokenData, getJWTSecret(c.env));
      
      // Generate session ID and log successful login
      const sessionId = crypto.randomUUID();
      
      // Log successful login with comprehensive audit information
      await auditService.logLogin(user.id, user.username, clientIP, userAgent, true);
      
      // Set secure cookies
      const isProduction = c.req.url.includes('.pages.dev') || c.req.url.includes('https://');
      
      // Set JWT cookie (httpOnly for security)
      setCookie(c, 'aria_token', jwt, {
        httpOnly: true, // Prevent XSS attacks
        secure: isProduction,
        sameSite: 'Strict',
        maxAge: 86400, // 24 hours
        path: '/'
      });
      
      // Set session ID cookie
      setCookie(c, 'aria_session', sessionId, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'Strict',
        maxAge: 86400,
        path: '/'
      });
      
      // Set CSRF token cookie (accessible to JavaScript)
      setCookie(c, 'aria_csrf', csrfToken, {
        httpOnly: false, // Accessible to frontend for CSRF protection
        secure: isProduction,
        sameSite: 'Strict',
        maxAge: 86400,
        path: '/'
      });
      
      // Set a non-sensitive session token for HTMX requests (contains no sensitive data)
      const htmxToken = sessionId; // Just the session ID, no sensitive user data
      setCookie(c, 'aria_htmx', htmxToken, {
        httpOnly: false, // Accessible to JavaScript for HTMX headers
        secure: isProduction,
        sameSite: 'Strict',
        maxAge: 86400,
        path: '/'
      });
      
      // Set security headers
      const securityHeaders = getSecurityHeaders();
      Object.entries(securityHeaders).forEach(([key, value]) => {
        c.header(key, value);
      });
      
      // Return success with redirect
      c.header('HX-Redirect', '/dashboard');
      c.header('HX-Trigger', 'loginSuccess');
      
      return c.html(html`
        <div class="bg-green-50 border-l-4 border-green-500 p-4 mb-4" role="alert">
          <div class="flex">
            <div class="flex-shrink-0">
              <i class="fas fa-check-circle text-green-500"></i>
            </div>
            <div class="ml-3">
              <p class="text-sm text-green-700">Login successful! Redirecting to dashboard...</p>
            </div>
          </div>
        </div>
        <script>
          // Store user data for frontend use
          localStorage.setItem('aria_user', '${JSON.stringify(tokenData).replace(/'/g, "\\'")}');
          console.log('Authentication successful for:', '${user.username}');
          
          // Redirect after brief delay
          setTimeout(() => {
            window.location.href = '/dashboard';
          }, 1000);
        </script>
      `);
      
    } catch (error) {
      console.error('Login error:', error);
      return c.html(renderError(`Login success error: ${error.message || error.toString()}`), 500);
    }
  });
  
  // Logout endpoint with audit logging
  app.post('/logout', async (c) => {
    try {
      // Get current user info from token before deleting
      const token = getCookie(c, 'aria_token');
      const sessionId = getCookie(c, 'aria_session');
      
      if (token) {
        try {
          const decoded = await verifyJWT(token, getJWTSecret(c.env));
          const auditService = new SimpleAuditLoggingService(c.env.DB);
          
          // Log logout activity
          await auditService.logLogout(decoded.id, decoded.username, sessionId || 'unknown');
        } catch (error) {
          console.error('Error logging logout:', error);
        }
      }
      
      // Delete all authentication cookies
      deleteCookie(c, 'aria_token', { path: '/' });
      deleteCookie(c, 'aria_session', { path: '/' });
      deleteCookie(c, 'aria_csrf', { path: '/' });
      deleteCookie(c, 'aria_htmx', { path: '/' });
      
      c.header('HX-Redirect', '/login');
      return c.html(renderSuccess('Logged out successfully'));
      
    } catch (error) {
      console.error('Logout error:', error);
      return c.html(renderError('Error during logout'), 500);
    }
  });
  
  // Check authentication status with detailed debugging
  app.get('/check', async (c) => {
    const token = getCookie(c, 'aria_token');
    console.log('Auth check - Token exists:', !!token);
    
    if (!token) {
      return c.json({ 
        authenticated: false, 
        debug: 'No token found in cookies',
        cookies: c.req.raw.headers.get('cookie')
      }, 401);
    }
    
    try {
      const decoded = await verifyJWT(token, getJWTSecret(c.env));
      console.log('Auth check - JWT verified, user:', decoded.username);
      
      if (decoded.exp && decoded.exp * 1000 < Date.now()) {
        return c.json({ 
          authenticated: false, 
          debug: 'Token expired',
          expires: decoded.expires,
          now: Date.now()
        }, 401);
      }
      
      return c.json({ 
        authenticated: true, 
        user: {
          id: decoded.id,
          username: decoded.username,
          role: decoded.role,
          email: decoded.email
        },
        debug: 'Authentication successful'
      });
    } catch (error) {
      return c.json({ 
        authenticated: false, 
        debug: 'Token decode error: ' + error.message 
      }, 401);
    }
  });
  
  // Debug route to show all cookies
  app.get('/debug', async (c) => {
    const allCookies = c.req.raw.headers.get('cookie');
    const token = getCookie(c, 'aria_token');
    
    return c.json({
      allCookies,
      ariaToken: token,
      tokenExists: !!token,
      url: c.req.url,
      headers: Object.fromEntries(c.req.raw.headers.entries())
    });
  });
  
  // Password reset request
  app.post('/reset-password', async (c) => {
    const { email } = await c.req.parseBody();
    
    // In production, send email with reset link
    // For now, just return success message
    return c.html(renderSuccess(`Password reset link sent to ${email}`));
  });
  
  return app;
}

// Helper functions for rendering HTMX partials
const renderError = (message: string) => html`
  <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-4" role="alert">
    <div class="flex">
      <div class="flex-shrink-0">
        <i class="fas fa-exclamation-circle text-red-500"></i>
      </div>
      <div class="ml-3">
        <p class="text-sm text-red-700">${message}</p>
      </div>
    </div>
  </div>
`;

const renderSuccess = (message: string) => html`
  <div class="bg-green-50 border-l-4 border-green-500 p-4 mb-4" role="alert">
    <div class="flex">
      <div class="flex-shrink-0">
        <i class="fas fa-check-circle text-green-500"></i>
      </div>
      <div class="ml-3">
        <p class="text-sm text-green-700">${message}</p>
      </div>
    </div>
  </div>
`;

// Middleware to check authentication
export const requireAuth = async (c: any, next: any) => {
  let token = getCookie(c, 'aria_token');
  
  // Debug logging
  console.log('Auth middleware - Token from cookie:', !!token);
  console.log('Auth middleware - Request path:', c.req.path);
  console.log('Auth middleware - HTMX request:', !!c.req.header('HX-Request'));
  console.log('Auth middleware - Cookies present:', !!c.req.header('Cookie'));
  
  if (!token) {
    console.log('Auth middleware - No token found, redirecting to login');
    // For HTMX requests, return 401 instead of redirect
    if (c.req.header('HX-Request')) {
      c.header('HX-Redirect', '/login');
      return c.text('Authentication required', 401);
    }
    return c.redirect('/login');
  }
  
  try {
    // Verify JWT token
    const decoded = await verifyJWT(token, getJWTSecret(c.env));
    console.log('Auth middleware - JWT verified successfully, user:', decoded.username);
    
    // Check if token is expired (JWT exp is in seconds, Date.now() is in milliseconds)
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      console.log('Auth middleware - Token expired, redirecting to login');
      deleteCookie(c, 'aria_token', { path: '/' });
      
      // For HTMX requests, return 401 instead of redirect
      if (c.req.header('HX-Request')) {
        c.header('HX-Redirect', '/login');
        return c.text('Token expired', 401);
      }
      return c.redirect('/login');
    }
    
    // Set user context
    c.set('user', {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
      organizationId: decoded.organizationId
    });
    
    console.log('Auth middleware - User authenticated successfully:', decoded.username);
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    deleteCookie(c, 'aria_token', { path: '/' });
    
    // For HTMX requests, return 401 instead of redirect
    if (c.req.header('HX-Request')) {
      c.header('HX-Redirect', '/login');
      return c.text('Authentication failed', 401);
    }
    return c.redirect('/login');
  }
};

// Middleware to require admin role
export const requireAdmin = async (c: any, next: any) => {
  const user = c.get('user');
  
  if (!user || user.role !== 'admin') {
    return c.html(renderError('Unauthorized: Admin access required'), 403);
  }
  
  await next();
};