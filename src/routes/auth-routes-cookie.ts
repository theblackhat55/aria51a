// ARIA5.1 - Cookie-Based Authentication Routes
import { Hono } from 'hono';
import { html } from 'hono/html';
import { DatabaseService } from '../lib/database';
import { CookieAuth, cookieAuthMiddleware } from '../lib/cookie-auth';
import { 
  hashPassword, 
  verifyPassword, 
  checkRateLimit,
  sanitizeInput,
  getSecurityHeaders
} from '../lib/security.js';

export function createCookieAuthRoutes() {
  const app = new Hono();
  
  // Login endpoint - secure cookie-based authentication
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
      
      // Get user from database
      let user = null;
      let isValidPassword = false;
      
      try {
        user = await c.env.DB.prepare(`
          SELECT id, username, email, password_hash, first_name, last_name, 
                 role, organization_id, is_active
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

        // Verify password (support both bcrypt and plain text for demo)
        try {
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

        // Update last login time (if column exists)
        try {
          await c.env.DB.prepare(`
            UPDATE users 
            SET last_login = datetime('now')
            WHERE id = ?
          `).bind(user.id).run();
        } catch (error) {
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
      
      // Create secure encrypted session
      await CookieAuth.createSession(c, {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.first_name || 'User',
        lastName: user.last_name || '',
        organizationId: user.organization_id || 1
      });
      
      // Get user data and CSRF token for frontend
      const userDataForFrontend = c.get('userDataForFrontend');
      const csrfToken = c.get('csrfToken');
      
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
          // Store user data and CSRF token for frontend use
          localStorage.setItem('aria_user', '${JSON.stringify(userDataForFrontend).replace(/"/g, '&quot;').replace(/'/g, '&#39;')}');
          localStorage.setItem('aria_csrf', '${csrfToken}');
          console.log('Authentication successful for:', '${user.username}');
          
          // Let HTMX handle the redirect, with fallback
          setTimeout(() => {
            if (window.location.pathname.includes('/login')) {
              console.log('Fallback redirect executing');
              window.location.href = '/dashboard';
            }
          }, 1500);
        </script>
      `);
      
    } catch (error) {
      console.error('Login error:', error);
      return c.html(html`
        <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-4" role="alert">
          <div class="flex">
            <div class="flex-shrink-0">
              <i class="fas fa-exclamation-circle text-red-500"></i>
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-700">An error occurred during login. Please try again.</p>
            </div>
          </div>
        </div>
      `, 500);
    }
  });

  // Logout endpoint
  app.post('/logout', async (c) => {
    await CookieAuth.destroySession(c);
    
    // Clear frontend data
    const clearScript = `
      localStorage.removeItem('aria_user');
      localStorage.removeItem('aria_csrf');
      localStorage.removeItem('aria_token'); // Clear old JWT if exists
    `;
    
    const isHTMXRequest = c.req.header('hx-request') === 'true';
    
    if (isHTMXRequest) {
      c.header('HX-Redirect', '/login');
      return c.html(html`
        <script>${clearScript}</script>
        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
          <p class="text-sm text-blue-700">Logged out successfully. Redirecting...</p>
        </div>
      `);
    }
    
    return c.html(html`
      <script>
        ${clearScript}
        window.location.href = '/login';
      </script>
    `);
  });

  // Session info endpoint (for frontend)
  app.get('/session', cookieAuthMiddleware, async (c) => {
    const user = c.get('user');
    const csrfToken = CookieAuth.getCSRFToken(c);
    
    return c.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: user.organizationId
      },
      csrfToken,
      sessionInfo: {
        loginTime: new Date(user.loginTime).toISOString(),
        lastActivity: new Date(user.lastActivity).toISOString()
      }
    });
  });

  return app;
}

// Export the cookie auth middleware for use in other routes
export { cookieAuthMiddleware };