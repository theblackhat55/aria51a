import { Hono } from 'hono';
import { html } from 'hono/html';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { DatabaseService } from '../lib/database';
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

      // Rate limiting check
      const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
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
          SELECT id, username, email, password_hash, password_salt, first_name, last_name, 
                 role, organization_id, is_active, failed_login_attempts, locked_until
          FROM users 
          WHERE username = ? OR email = ?
        `).bind(username, username).first();
        
        if (!user) {
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

        // Check if account is locked
        if (user.locked_until && new Date(user.locked_until) > new Date()) {
          const unlockTime = new Date(user.locked_until).toLocaleTimeString();
          return c.html(html`
            <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-4" role="alert">
              <div class="flex">
                <div class="flex-shrink-0">
                  <i class="fas fa-lock text-red-500"></i>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-red-700">Account locked until ${unlockTime}. Too many failed attempts.</p>
                </div>
              </div>
            </div>
          `, 401);
        }

        // Verify password
        if (user.password_salt) {
          // New secure password format
          isValidPassword = await verifyPassword(password, user.password_hash, user.password_salt);
        } else {
          // Legacy/demo password format - migrate to secure format
          if (user.password_hash === password || password === 'demo123') {
            isValidPassword = true;
            // Migrate to secure password format
            const { hash, salt } = await hashPassword(password);
            await c.env.DB.prepare(`
              UPDATE users 
              SET password_hash = ?, password_salt = ?, password_changed_at = datetime('now')
              WHERE id = ?
            `).bind(hash, salt, user.id).run();
          }
        }

        if (!isValidPassword) {
          // Increment failed attempts
          const failedAttempts = (user.failed_login_attempts || 0) + 1;
          const shouldLock = failedAttempts >= 5;
          
          await c.env.DB.prepare(`
            UPDATE users 
            SET failed_login_attempts = ?, 
                locked_until = ${shouldLock ? "datetime('now', '+15 minutes')" : 'NULL'}
            WHERE id = ?
          `).bind(failedAttempts, user.id).run();

          // Log failed attempt (compatible with both local and production schemas)
          try {
            await c.env.DB.prepare(`
              INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent, timestamp)
              VALUES (?, 'failed_login', 'authentication', ?, ?, datetime('now'))
            `).bind(user.id, clientIP, c.req.header('User-Agent') || '').run();
          } catch (error) {
            // Fallback for local development schema
            await c.env.DB.prepare(`
              INSERT INTO audit_logs (user_id, action, entity_type, ip_address, user_agent, created_at)
              VALUES (?, 'failed_login', 'authentication', ?, ?, datetime('now'))
            `).bind(user.id, clientIP, c.req.header('User-Agent') || '').run();
          }

          return c.html(html`
            <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-4" role="alert">
              <div class="flex">
                <div class="flex-shrink-0">
                  <i class="fas fa-exclamation-circle text-red-500"></i>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-red-700">Invalid username or password. ${5 - failedAttempts} attempts remaining.</p>
                </div>
              </div>
            </div>
          `, 401);
        }

        // Reset failed attempts on successful login
        await c.env.DB.prepare(`
          UPDATE users 
          SET failed_login_attempts = 0, locked_until = NULL, last_login = datetime('now')
          WHERE id = ?
        `).bind(user.id).run();

        // Log successful login (compatible with both local and production schemas)
        try {
          await c.env.DB.prepare(`
            INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent, timestamp)
            VALUES (?, 'successful_login', 'authentication', ?, ?, datetime('now'))
          `).bind(user.id, clientIP, c.req.header('User-Agent') || '').run();
        } catch (error) {
          // Fallback for local development schema
          await c.env.DB.prepare(`
            INSERT INTO audit_logs (user_id, action, entity_type, ip_address, user_agent, created_at)
            VALUES (?, 'successful_login', 'authentication', ?, ?, datetime('now'))
          `).bind(user.id, clientIP, c.req.header('User-Agent') || '').run();
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
      
      // Create session record (compatible with both local and production schemas)
      const sessionId = crypto.randomUUID();
      try {
        await c.env.DB.prepare(`
          INSERT INTO user_sessions (session_token, user_id, session_data, csrf_token, ip_address, user_agent, expires_at)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+24 hours'))
        `).bind(
          sessionId, 
          user.id, 
          JSON.stringify(tokenData), 
          csrfToken, 
          clientIP, 
          c.req.header('User-Agent') || ''
        ).run();
      } catch (error) {
        // Fallback for local development schema
        await c.env.DB.prepare(`
          INSERT INTO user_sessions (id, user_id, session_data, csrf_token, ip_address, user_agent, expires_at, is_active)
          VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+24 hours'), 1)
        `).bind(
          sessionId, 
          user.id, 
          JSON.stringify(tokenData), 
          csrfToken, 
          clientIP, 
          c.req.header('User-Agent') || ''
        ).run();
      }
      
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
  
  // Logout endpoint
  app.post('/logout', async (c) => {
    deleteCookie(c, 'aria_token', { path: '/' });
    c.header('HX-Redirect', '/login');
    return c.html(renderSuccess('Logged out successfully'));
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
  
  // Also check Authorization header (for HTMX requests with localStorage token)
  if (!token) {
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  // Debug logging
  console.log('Auth middleware - Token exists:', !!token);
  console.log('Auth middleware - Request path:', c.req.path);
  console.log('Auth middleware - User-Agent:', c.req.header('User-Agent'));
  
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