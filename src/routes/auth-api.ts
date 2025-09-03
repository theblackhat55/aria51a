import { Hono } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { DatabaseService } from '../lib/database';
import type { CloudflareBindings } from '../types';
import jwt from 'jsonwebtoken';
import * as bcrypt from 'bcryptjs';

const JWT_SECRET = 'aria5-htmx-secret-key-change-in-production';

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

  // Login endpoint
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

      let user = null;
      let isValidPassword = false;

      // Try database first if available
      if (c.env?.DB) {
        try {
          const db = new DatabaseService(c.env.DB);
          user = await db.getUserByUsername(username);
          
          if (user) {
            isValidPassword = await db.validatePassword(password, user.password_hash);
            if (isValidPassword) {
              await db.updateLastLogin(user.id);
            }
          }
        } catch (dbError) {
          console.error('Database error, falling back to demo users:', dbError);
        }
      }

      // Fallback to demo users
      if (!user && DEMO_USERS[username]) {
        const demoUser = DEMO_USERS[username];
        if (demoUser.password === password) {
          user = demoUser;
          isValidPassword = true;
        }
      }

      if (!user || !isValidPassword) {
        return c.json({ 
          success: false, 
          error: 'Invalid username or password' 
        }, 401);
      }

      // Create JWT token
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role || 'user',
          firstName: user.first_name,
          lastName: user.last_name
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Set cookie
      setCookie(c, 'aria_token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'Lax',
        maxAge: 86400,
        path: '/'
      });

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
      const payload = jwt.verify(token, JWT_SECRET) as any;
      return c.json({
        success: true,
        user: {
          id: payload.id,
          username: payload.username,
          email: payload.email,
          role: payload.role,
          firstName: payload.firstName,
          lastName: payload.lastName
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
      const payload = jwt.verify(token, JWT_SECRET) as any;
      return c.json({
        success: true,
        data: {
          id: payload.id,
          username: payload.username,
          email: payload.email,
          role: payload.role,
          firstName: payload.firstName,
          lastName: payload.lastName
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
      const payload = jwt.verify(token, JWT_SECRET) as any;
      return c.json({
        success: true,
        data: {
          user: {
            id: payload.id,
            username: payload.username,
            email: payload.email,
            role: payload.role,
            firstName: payload.firstName,
            lastName: payload.lastName
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