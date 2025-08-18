// API module for Node.js/Docker deployment with Keycloak integration
import { Hono } from 'hono';
import { getDatabase, createQueryHelpers } from '../database/sqlite.js';
import { createKeycloakAPI } from './keycloak.js';

export function createAPI() {
  const app = new Hono();
  
  // Add database to context for compatibility
  app.use('*', async (c, next) => {
    const db = getDatabase();
    c.env = {
      DB: createQueryHelpers(db)
    };
    await next();
  });

  // Health check
  app.get('/api/health', (c) => {
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.1',
      database: 'connected',
      keycloak: 'configured'
    });
  });

  // Mount Keycloak Authentication API
  const keycloakAPI = createKeycloakAPI();
  app.route('/api', keycloakAPI);

  // Legacy authentication routes (deprecated - use Keycloak instead)
  app.post('/api/auth/login', async (c) => {
    try {
      const { username, password } = await c.req.json();

      if (!username || !password) {
        return c.json({ success: false, error: 'Username and password are required' }, 400);
      }

      // Query user from database
      const result = c.env.DB.prepare(
        'SELECT * FROM users WHERE username = ? AND is_active = TRUE'
      ).first(username);

      if (!result.success || !result.result) {
        return c.json({ success: false, error: 'Invalid credentials' }, 401);
      }

      const user = result.result;

      // For demo purposes, we'll use simple SHA-256 hash verification
      // In production, use proper password hashing with bcrypt
      const crypto = await import('crypto');
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

      if (user.password_hash !== hashedPassword) {
        return c.json({ success: false, error: 'Invalid credentials' }, 401);
      }

      // Generate JWT token (simplified for demo)
      const token = Buffer.from(JSON.stringify({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        exp: Date.now() + 86400000 // 24 hours
      })).toString('base64');

      // Update last login
      c.env.DB.prepare(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
      ).run(user.id);

      // Remove password hash from response
      delete user.password_hash;

      return c.json({
        success: true,
        data: {
          user,
          token,
          expires_at: new Date(Date.now() + 86400000).toISOString()
        },
        message: 'Login successful'
      });

    } catch (error) {
      console.error('Login error:', error);
      return c.json({ success: false, error: 'Internal server error' }, 500);
    }
  });

  // Get current user
  app.get('/api/auth/me', async (c) => {
    try {
      const auth = c.req.header('Authorization');
      if (!auth || !auth.startsWith('Bearer ')) {
        return c.json({ success: false, error: 'No token provided' }, 401);
      }

      const token = auth.substring(7);
      
      try {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString());
        
        if (payload.exp < Date.now()) {
          return c.json({ success: false, error: 'Token expired' }, 401);
        }

        const result = c.env.DB.prepare(
          'SELECT id, username, email, first_name, last_name, role, department, job_title FROM users WHERE id = ? AND is_active = TRUE'
        ).first(payload.id);

        if (!result.success || !result.result) {
          return c.json({ success: false, error: 'User not found' }, 401);
        }

        return c.json({
          success: true,
          data: { user: result.result }
        });

      } catch (tokenError) {
        return c.json({ success: false, error: 'Invalid token' }, 401);
      }

    } catch (error) {
      console.error('Auth check error:', error);
      return c.json({ success: false, error: 'Internal server error' }, 500);
    }
  });

  // Get risks
  app.get('/api/risks', async (c) => {
    try {
      const page = parseInt(c.req.query('page')) || 1;
      const limit = parseInt(c.req.query('limit')) || 20;
      const offset = (page - 1) * limit;

      const result = c.env.DB.prepare(`
        SELECT r.*, 
               rc.name as category_name,
               o.name as organization_name,
               u.first_name,
               u.last_name
        FROM risks r
        LEFT JOIN risk_categories rc ON r.category_id = rc.id
        LEFT JOIN organizations o ON r.organization_id = o.id
        LEFT JOIN users u ON r.owner_id = u.id
        ORDER BY r.risk_score DESC, r.created_at DESC
        LIMIT ? OFFSET ?
      `).all(limit, offset);

      const countResult = c.env.DB.prepare('SELECT COUNT(*) as total FROM risks').first();

      return c.json({
        success: true,
        data: result.results || [],
        total: countResult.result?.total || 0,
        page,
        limit
      });

    } catch (error) {
      console.error('Get risks error:', error);
      return c.json({ success: false, error: 'Internal server error' }, 500);
    }
  });

  // Get notifications count
  app.get('/api/notifications/count', async (c) => {
    try {
      // For now, return static count since we don't have user context
      return c.json({
        success: true,
        data: {
          total: 0,
          unread: 0
        }
      });
    } catch (error) {
      console.error('Notifications count error:', error);
      return c.json({ success: false, error: 'Internal server error' }, 500);
    }
  });

  // Get reference data
  app.get('/api/reference/users', async (c) => {
    try {
      const result = c.env.DB.prepare(`
        SELECT id, username, email, first_name, last_name, role, department, job_title
        FROM users 
        WHERE is_active = TRUE
        ORDER BY first_name, last_name
      `).all();

      return c.json({
        success: true,
        data: result.results || []
      });
    } catch (error) {
      console.error('Get users error:', error);
      return c.json({ success: false, error: 'Internal server error' }, 500);
    }
  });

  app.get('/api/reference/organizations', async (c) => {
    try {
      const result = c.env.DB.prepare(`
        SELECT id, name, description, org_type, risk_tolerance
        FROM organizations
        ORDER BY name
      `).all();

      return c.json({
        success: true,
        data: result.results || []
      });
    } catch (error) {
      console.error('Get organizations error:', error);
      return c.json({ success: false, error: 'Internal server error' }, 500);
    }
  });

  app.get('/api/reference/categories', async (c) => {
    try {
      const result = c.env.DB.prepare(`
        SELECT id, name, description, category_type, risk_appetite
        FROM risk_categories
        ORDER BY name
      `).all();

      return c.json({
        success: true,
        data: result.results || []
      });
    } catch (error) {
      console.error('Get categories error:', error);
      return c.json({ success: false, error: 'Internal server error' }, 500);
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', async (c) => {
    try {
      const totalRisks = c.env.DB.prepare('SELECT COUNT(*) as count FROM risks').first();
      const highRisks = c.env.DB.prepare('SELECT COUNT(*) as count FROM risks WHERE risk_score >= 15').first();
      const activeIncidents = c.env.DB.prepare("SELECT COUNT(*) as count FROM incidents WHERE status IN ('new', 'investigating', 'containment', 'recovery')").first();
      const recentRisks = c.env.DB.prepare("SELECT COUNT(*) as count FROM risks WHERE created_at >= datetime('now', '-30 days')").first();

      return c.json({
        success: true,
        data: {
          totalRisks: totalRisks.result?.count || 0,
          highRisks: highRisks.result?.count || 0,
          activeIncidents: activeIncidents.result?.count || 0,
          recentRisks: recentRisks.result?.count || 0
        }
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      return c.json({ success: false, error: 'Internal server error' }, 500);
    }
  });

  return app;
}

// Helper functions for Keycloak integration

// Generate secure random state for OAuth flow
function generateState() {
  const array = new Uint8Array(32);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    // Fallback for Node.js environment
    const crypto = require('crypto');
    const buffer = crypto.randomBytes(32);
    for (let i = 0; i < 32; i++) {
      array[i] = buffer[i];
    }
  }
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Map Keycloak roles to application roles
function mapKeycloakRoleToAppRole(roles) {
  // Priority order for role mapping
  const rolePriority = ['admin', 'risk_manager', 'compliance_officer', 'auditor', 'risk_owner'];
  
  for (const priority of rolePriority) {
    if (roles.includes(priority)) {
      return priority;
    }
  }
  
  return 'risk_owner'; // Default role
}