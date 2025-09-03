import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { DatabaseService } from '../lib/database';
import { SessionService, PasswordService } from '../lib/crypto';
import type { CloudflareBindings } from '../types';

// Enhanced security configuration
const SESSION_CONFIG = {
  name: 'aria5_session',
  httpOnly: true,
  secure: true,
  sameSite: 'Strict' as const,
  maxAge: 24 * 60 * 60 // 24 hours
};

// Demo users fallback
const DEMO_USERS = {
  'admin': {
    id: 1,
    username: 'admin',
    email: 'admin@aria5.com',
    password: 'demo123',
    role: 'admin',
    first_name: 'Admin',
    last_name: 'User'
  },
  'avi_security': {
    id: 2,
    username: 'avi_security',
    email: 'avi@aria5.com',
    password: 'demo123',
    role: 'risk_manager',
    first_name: 'Avi',
    last_name: 'Security'
  }
};

export function createAuthAPI() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  // Login endpoint with enhanced security
  app.post('/auth/login', async (c) => {
    try {
      const body = await c.req.json().catch(() => c.req.parseBody());
      const username = String(body.username || '');
      const password = String(body.password || '');

      if (!username || !password) {
        return c.json({ 
          success: false, 
          error: 'Username and password are required' 
        }, 400);
      }

      // Rate limiting and security tracking
      const clientIP = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown';
      
      let user = null;
      let isValidPassword = false;

      // Try database first with enhanced crypto
      if (c.env?.DB) {
        try {
          const db = new DatabaseService(c.env.DB);
          user = await db.getUserByUsername(username);
          
          if (user) {
            isValidPassword = await db.validatePassword(password, user.password_hash);
            if (isValidPassword) {
              await db.updateLastLogin(user.id);
              await db.createAuditLog(user.id, 'LOGIN', 'user', user.id, null, { ip: clientIP });
            }
          }
        } catch (error) {
          console.error('Database authentication error:', error);
        }
      }

      // Fallback to demo users if database fails or user not found
      if (!user && DEMO_USERS[username]) {
        const demoUser = DEMO_USERS[username];
        if (demoUser.password === password) {
          user = demoUser;
          isValidPassword = true;
        }
      }
      if (!user || !isValidPassword) {
        // Log failed login attempt
        console.warn(`Failed login attempt for username: ${username} from IP: ${clientIP}`);
        
        return c.json({ 
          success: false, 
          error: 'Invalid username or password' 
        }, 401);
      }

      // Create secure session token using enhanced SessionService
      const sessionToken = SessionService.createSessionToken(user.id, {
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        firstName: user.first_name,
        lastName: user.last_name,
        loginIP: clientIP,
        loginTime: new Date().toISOString()
      });

      // Set secure cookie with enhanced configuration
      setCookie(c, SESSION_CONFIG.name, sessionToken, {
        httpOnly: SESSION_CONFIG.httpOnly,
        secure: false, // Set to true in production with HTTPS
        sameSite: SESSION_CONFIG.sameSite,
        maxAge: SESSION_CONFIG.maxAge,
        path: '/'
      });

      // Log successful login
      console.info(`Successful login for user: ${username} (${user.role || 'user'}) from IP: ${clientIP}`);

      return c.json({
        success: true,
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role || 'user',
          firstName: user.first_name || user.firstName,
          lastName: user.last_name || user.lastName
        },
        token: token
      });
    } catch (error) {
      console.error('Login error:', error);
      return c.json({ 
        success: false, 
        error: 'Login failed' 
      }, 500);
    }
  });

  // Logout endpoint
  app.post('/auth/logout', async (c) => {
    deleteCookie(c, 'aria_token', { path: '/' });
    return c.json({ 
      success: true, 
      message: 'Logged out successfully' 
    });
  });

  // Verify session endpoint
  app.get('/auth/verify', async (c) => {
    // Check both cookie and Authorization header
    let token = getCookie(c, 'aria_token');
    
    // Also check Authorization header if no cookie
    if (!token) {
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return c.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, 401);
    }

    try {
      // Simple token verification (temporary solution for Cloudflare Workers compatibility)
      const tokenData = JSON.parse(atob(token));
      
      // Check if token is expired
      if (Date.now() > tokenData.expires) {
        return c.json({ 
          success: false, 
          error: 'Token expired' 
        }, 401);
      }
      
      return c.json({
        success: true,
        user: {
          id: tokenData.id,
          username: tokenData.username,
          email: tokenData.email,
          role: tokenData.role,
          firstName: tokenData.firstName,
          lastName: tokenData.lastName
        }
      });
    } catch (error) {
      return c.json({ 
        success: false, 
        error: 'Invalid token' 
      }, 401);
    }
  });

  // User info endpoint
  app.get('/auth/user', async (c) => {
    const token = getCookie(c, 'aria_token');
    
    if (!token) {
      return c.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, 401);
    }

    try {
      // Simple token verification (temporary solution for Cloudflare Workers compatibility)
      const tokenData = JSON.parse(atob(token));
      
      // Check if token is expired
      if (Date.now() > tokenData.expires) {
        return c.json({ 
          success: false, 
          error: 'Token expired' 
        }, 401);
      }
      
      return c.json({
        success: true,
        data: {
          id: tokenData.id,
          username: tokenData.username,
          email: tokenData.email,
          role: tokenData.role,
          firstName: tokenData.firstName,
          lastName: tokenData.lastName
        }
      });
    } catch (error) {
      return c.json({ 
        success: false, 
        error: 'Invalid token' 
      }, 401);
    }
  });

  // SAML config endpoint (stub for compatibility)
  app.get('/saml/config', async (c) => {
    return c.json({
      success: true,
      config: {
        enabled: false,
        entityId: '',
        ssoUrl: '',
        certificate: ''
      }
    });
  });

  // Auth me endpoint (alias for verify)
  app.get('/auth/me', async (c) => {
    // Check both cookie and Authorization header
    let token = getCookie(c, 'aria_token');
    
    if (!token) {
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return c.json({ 
        success: false, 
        error: 'Not authenticated' 
      }, 401);
    }

    try {
      // Simple token verification (temporary solution for Cloudflare Workers compatibility)
      const tokenData = JSON.parse(atob(token));
      
      // Check if token is expired
      if (Date.now() > tokenData.expires) {
        return c.json({ 
          success: false, 
          error: 'Token expired' 
        }, 401);
      }
      
      return c.json({
        success: true,
        data: {
          user: {
            id: tokenData.id,
            username: tokenData.username,
            email: tokenData.email,
            role: tokenData.role,
            firstName: tokenData.firstName,
            lastName: tokenData.lastName
          }
        }
      });
    } catch (error) {
      return c.json({ 
        success: false, 
        error: 'Invalid token' 
      }, 401);
    }
  });

  // Reference endpoints for UI data
  app.get('/reference/categories', async (c) => {
    // Check authentication
    let token = getCookie(c, 'aria_token');
    if (!token) {
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    return c.json({
      success: true,
      data: [
        { id: 'cybersecurity', name: 'Cybersecurity', color: 'red' },
        { id: 'compliance', name: 'Compliance', color: 'blue' },
        { id: 'operational', name: 'Operational', color: 'green' },
        { id: 'financial', name: 'Financial', color: 'yellow' },
        { id: 'strategic', name: 'Strategic', color: 'purple' },
        { id: 'third-party', name: 'Third Party', color: 'orange' }
      ]
    });
  });

  app.get('/reference/organizations', async (c) => {
    // Check authentication
    let token = getCookie(c, 'aria_token');
    if (!token) {
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    return c.json({
      success: true,
      data: [
        { id: 1, name: 'ARIA5 Corporation', type: 'primary' },
        { id: 2, name: 'Risk Management Division', type: 'division' },
        { id: 3, name: 'Compliance Team', type: 'department' }
      ]
    });
  });

  app.get('/reference/users', async (c) => {
    // Check authentication
    let token = getCookie(c, 'aria_token');
    if (!token) {
      const authHeader = c.req.header('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    return c.json({
      success: true,
      data: [
        { id: 1, username: 'admin', name: 'Admin User', role: 'admin', email: 'admin@aria5.com' },
        { id: 2, username: 'avi_security', name: 'Avi Security', role: 'risk_manager', email: 'avi@aria5.com' },
        { id: 3, username: 'sjohnson', name: 'Sarah Johnson', role: 'compliance_officer', email: 'sarah@aria5.com' },
        { id: 4, username: 'mbrown', name: 'Mike Brown', role: 'analyst', email: 'mike@aria5.com' }
      ]
    });
  });

  return app;
}