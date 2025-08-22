// API module for Node.js/Docker deployment with Keycloak integration
import { Hono } from 'hono';
import { getDatabase, createQueryHelpers } from '../database/sqlite.js';
// import { createKeycloakAPI } from './keycloak.js';
import { createSecureKeyManagementAPI } from '../secure-key-management.js';

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

  // Helper: get authenticated user from Bearer token (basic mode)
  function getAuthUser(c) {
    try {
      const auth = c.req.header('Authorization');
      if (!auth || !auth.startsWith('Bearer ')) return null;
      const token = auth.substring(7);
      const payload = JSON.parse(Buffer.from(token, 'base64').toString());
      if (!payload?.id || payload.exp < Date.now()) return null;
      const result = c.env.DB.prepare(
        'SELECT id, username, email, first_name, last_name, role FROM users WHERE id = ? AND is_active = TRUE'
      ).first(payload.id);
      return result.success ? result.result : null;
    } catch (_e) {
      return null;
    }
  }

  // Health check
  app.get('/api/health', (c) => {
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.1',
      database: 'connected',
      keycloak: 'disabled'
    });
  });

  // Mount Keycloak Authentication API
  // Keycloak API disabled for basic auth mode
  // const keycloakAPI = createKeycloakAPI();
  // app.route('/api', keycloakAPI);

  // Simple rate limiter for auth endpoints
  const __rate = new Map();
  function rateLimited(key, limit = 8, windowMs = 60_000) {
    const now = Date.now();
    const entry = __rate.get(key) || { count: 0, reset: now + windowMs };
    if (now > entry.reset) {
      entry.count = 0;
      entry.reset = now + windowMs;
    }
    entry.count += 1;
    __rate.set(key, entry);
    return entry.count > limit;
  }

  // Legacy authentication routes (deprecated - use Keycloak instead)
  app.post('/api/auth/login', async (c) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || c.req.header('x-real-ip') || 'local';
    if (rateLimited(`login:${ip}`, 8, 60_000)) {
      return c.json({ success: false, error: 'Too many attempts, please try again later' }, 429);
    }
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

  // Demo login - creates demo user if none exist
  app.post('/api/auth/demo-login', async (c) => {
    try {
      // Check if any users exist
      const userCount = c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
      
      if (!userCount.success || userCount.result.count === 0) {
        // Create demo user
        const crypto = await import('crypto');
        const hashedPassword = crypto.createHash('sha256').update('demo123').digest('hex');
        
        const result = c.env.DB.prepare(`
          INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active, created_at)
          VALUES ('demo', 'demo@example.com', ?, 'Demo', 'User', 'admin', TRUE, datetime('now'))
        `).run(hashedPassword);

        if (!result.success) {
          return c.json({ success: false, error: 'Failed to create demo user' }, 500);
        }
      }

      // Login as demo user
      const user = c.env.DB.prepare(
        'SELECT * FROM users WHERE username = ? AND is_active = TRUE'
      ).first('demo');

      if (!user.success || !user.result) {
        return c.json({ success: false, error: 'Demo user not found' }, 500);
      }

      // Generate token
      const token = Buffer.from(JSON.stringify({
        id: user.result.id,
        username: user.result.username,
        email: user.result.email,
        role: user.result.role,
        exp: Date.now() + 86400000 // 24 hours
      })).toString('base64');

      // Update last login
      c.env.DB.prepare(
        'UPDATE users SET last_login = datetime(\'now\') WHERE id = ?'
      ).run(user.result.id);

      const userData = { ...user.result };
      delete userData.password_hash;

      return c.json({
        success: true,
        data: {
          user: userData,
          token,
          expires_at: new Date(Date.now() + 86400000).toISOString()
        },
        message: 'Demo login successful'
      });

    } catch (error) {
      console.error('Demo login error:', error);
      return c.json({ success: false, error: 'Internal server error' }, 500);
    }
  });

  // Demo registration endpoint for testing
  app.post('/api/auth/register', async (c) => {
    try {
      const { username, email, password, firstName, lastName } = await c.req.json();

      if (!username || !email || !password) {
        return c.json({ success: false, error: 'Username, email, and password are required' }, 400);
      }

      // Check if user already exists
      const existingUser = c.env.DB.prepare(
        'SELECT id FROM users WHERE username = ? OR email = ?'
      ).first(username, email);

      if (existingUser.success && existingUser.result) {
        return c.json({ success: false, error: 'User already exists' }, 409);
      }

      // Hash password
      const crypto = await import('crypto');
      const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

      // Create user
      const result = c.env.DB.prepare(`
        INSERT INTO users (username, email, password_hash, first_name, last_name, role, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, 'admin', TRUE, datetime('now'))
      `).run(username, email, hashedPassword, firstName || username, lastName || '');

      if (!result.success) {
        return c.json({ success: false, error: 'Failed to create user' }, 500);
      }

      // Generate token for immediate login
      const token = Buffer.from(JSON.stringify({
        id: result.meta.last_row_id,
        username,
        email,
        role: 'admin',
        exp: Date.now() + 86400000 // 24 hours
      })).toString('base64');

      return c.json({
        success: true,
        data: {
          user: {
            id: result.meta.last_row_id,
            username,
            email,
            first_name: firstName || username,
            last_name: lastName || '',
            role: 'admin'
          },
          token,
          expires_at: new Date(Date.now() + 86400000).toISOString()
        },
        message: 'Registration successful'
      });

    } catch (error) {
      console.error('Registration error:', error);
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
      // Basic placeholder using findings/incidents as sources for demo
      const openFindings = c.env.DB.prepare("SELECT COUNT(*) as count FROM assessment_findings WHERE status IN ('open','in_progress')").first();
      const recentHighIncidents = c.env.DB.prepare("SELECT COUNT(*) as count FROM incidents WHERE severity IN ('high','critical') AND date(reported_at) >= date('now','-30 days')").first();
      return c.json({
        success: true,
        data: {
          total: (openFindings.result?.count || 0) + (recentHighIncidents.result?.count || 0),
          unread: openFindings.result?.count || 0
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

  // Dashboard stats (legacy minimal endpoint kept for compatibility)
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

  // Full dashboard endpoint expected by frontend (/public/static/app.js)
  app.get('/api/dashboard', async (c) => {
    try {
      // Key metrics
      const totalRisks = c.env.DB.prepare('SELECT COUNT(*) AS count FROM risks').first();
      const highRisks = c.env.DB.prepare('SELECT COUNT(*) AS count FROM risks WHERE risk_score >= 15').first();
      const openFindings = c.env.DB.prepare("SELECT COUNT(*) AS count FROM assessment_findings WHERE status IN ('open','in_progress')").first();

      // Compliance score: percentage of completed assessments marked compliant
      const assessmentsTotal = c.env.DB.prepare("SELECT COUNT(*) AS count FROM compliance_assessments WHERE status = 'completed'").first();
      const assessmentsCompliant = c.env.DB.prepare("SELECT COUNT(*) AS count FROM compliance_assessments WHERE status = 'completed' AND (lower(overall_rating) = 'compliant')").first();
      let complianceScore = 0;
      if ((assessmentsTotal.result?.count || 0) > 0) {
        complianceScore = Math.round((assessmentsCompliant.result?.count || 0) * 100 / assessmentsTotal.result.count);
      } else {
        // Fallback sensible default for demo if no data
        complianceScore = 85;
      }

      // Top risks
      const topRisksRes = c.env.DB.prepare(
        `SELECT title, risk_id, COALESCE(risk_score, probability * impact, 0) AS risk_score
         FROM risks
         ORDER BY risk_score DESC, created_at DESC
         LIMIT 5`
      ).all();
      const topRisks = (topRisksRes.results || []).map(r => ({
        title: r.title,
        risk_id: r.risk_id,
        risk_score: Number(r.risk_score || 0)
      }));

      // Recent incidents
      const recentIncRes = c.env.DB.prepare(
        `SELECT title, incident_id, severity, COALESCE(reported_at, created_at) AS created_at
         FROM incidents
         ORDER BY COALESCE(reported_at, created_at) DESC
         LIMIT 5`
      ).all();
      const recentIncidents = (recentIncRes.results || []).map(i => ({
        title: i.title,
        incident_id: i.incident_id,
        severity: i.severity,
        created_at: i.created_at
      }));

      // Organizations summary
      const orgRes = c.env.DB.prepare(
        `SELECT o.name, COUNT(r.id) AS risks, COALESCE(ROUND(AVG(r.risk_score), 1), 0) AS avgScore
         FROM organizations o
         LEFT JOIN risks r ON r.organization_id = o.id
         GROUP BY o.id
         ORDER BY risks DESC, o.name ASC
         LIMIT 6`
      ).all();
      const organizations = (orgRes.results || []).map(o => ({
        name: o.name,
        risks: Number(o.risks || 0),
        avgScore: Number(o.avgScore || 0)
      }));

      // Risk trend for last 7 days (average score per day)
      const trendRes = c.env.DB.prepare(
        `SELECT date(created_at) AS d, ROUND(AVG(COALESCE(risk_score, probability * impact, 0)), 1) AS s
         FROM risks
         WHERE date(created_at) >= date('now', '-6 days')
         GROUP BY date(created_at)
         ORDER BY d`
      ).all();
      const trendMap = new Map((trendRes.results || []).map(row => [row.d, Number(row.s || 0)]));
      const risk_trend = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const day = d.toISOString().slice(0, 10);
        risk_trend.push({ date: day, score: trendMap.get(day) ?? 0 });
      }

      return c.json({
        success: true,
        data: {
          total_risks: totalRisks.result?.count || 0,
          high_risks: highRisks.result?.count || 0,
          open_findings: openFindings.result?.count || 0,
          compliance_score: complianceScore,
          top_risks: topRisks,
          recent_incidents: recentIncidents,
          risk_trend,
          organizations
        }
      });
    } catch (error) {
      console.error('Dashboard endpoint error:', error);
      return c.json({ success: false, error: 'Internal server error' }, 500);
    }
  });

  // KRIs API
  app.get('/api/kris', (c) => {
    const kris = c.env.DB.prepare('SELECT * FROM kris ORDER BY id').all();
    return c.json({ success: true, data: kris.results || [] });
  });

  app.get('/api/kris/:id/readings', (c) => {
    const id = parseInt(c.req.param('id'));
    const readings = c.env.DB.prepare('SELECT * FROM kri_readings WHERE kri_id = ? ORDER BY timestamp DESC LIMIT 50').all(id);
    return c.json({ success: true, data: readings.results || [] });
  });

  // SoA API
  app.get('/api/soa', (c) => {
    const rows = c.env.DB.prepare(`
      SELECT soa.id, cc.framework, cc.external_id, cc.title, soa.included, soa.implementation_status, soa.effectiveness, soa.justification, soa.evidence_refs
      FROM statement_of_applicability soa
      JOIN control_catalog cc ON cc.id = soa.catalog_id
      ORDER BY cc.framework, cc.external_id
    `).all();
    return c.json({ success: true, data: rows.results || [] });
  });

  // Update SoA entry (basic editor)
  app.put('/api/soa/:id', async (c) => {
    const user = getAuthUser(c);
    if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401);
    try {
      const id = parseInt(c.req.param('id'));
      const body = await c.req.json();
      const allowedImpl = new Set(['planned','in_progress','implemented','not_applicable', null, undefined, '']);
      const allowedEff = new Set(['effective','partially_effective','ineffective','not_tested', null, undefined, '']);

      const included = body.included === true || body.included === 1 ? 1 : (body.included === false ? 0 : undefined);
      const implementation_status = allowedImpl.has(body.implementation_status) ? (body.implementation_status || null) : null;
      const effectiveness = allowedEff.has(body.effectiveness) ? (body.effectiveness || null) : null;
      const justification = typeof body.justification === 'string' ? body.justification : null;
      const evidence_refs = typeof body.evidence_refs === 'string' ? body.evidence_refs : null;

      // Build dynamic update
      const fields = [];
      const params = [];
      if (included !== undefined) { fields.push('included = ?'); params.push(included); }
      if (implementation_status !== undefined) { fields.push('implementation_status = ?'); params.push(implementation_status); }
      if (effectiveness !== undefined) { fields.push('effectiveness = ?'); params.push(effectiveness); }
      if (justification !== null) { fields.push('justification = ?'); params.push(justification); }
      if (evidence_refs !== null) { fields.push('evidence_refs = ?'); params.push(evidence_refs); }
      fields.push('last_updated = CURRENT_TIMESTAMP');

      if (fields.length === 0) {
        return c.json({ success: false, error: 'No valid fields provided' }, 400);
      }

      const sql = `UPDATE statement_of_applicability SET ${fields.join(', ')} WHERE id = ?`;
      params.push(id);
      const res = c.env.DB.prepare(sql).run(...params);
      if (!res.success || res.meta.changes === 0) {
        return c.json({ success: false, error: 'SoA entry not found or not updated' }, 404);
      }
      const row = c.env.DB.prepare(`
        SELECT soa.id, cc.framework, cc.external_id, cc.title, soa.included, soa.implementation_status, soa.effectiveness, soa.justification, soa.evidence_refs
        FROM statement_of_applicability soa
        JOIN control_catalog cc ON cc.id = soa.catalog_id
        WHERE soa.id = ?
      `).first(id);
      return c.json({ success: true, data: row.result });
    } catch (error) {
      console.error('SoA update error:', error);
      return c.json({ success: false, error: 'Internal server error' }, 500);
    }
  });

  // Treatments API (read-only for now)
  app.get('/api/treatments', (c) => {
    const rows = c.env.DB.prepare(`
      SELECT t.*, r.title as risk_title, r.risk_id, u.username as owner_username
      FROM risk_treatments t
      LEFT JOIN risks r ON r.id = t.risk_id
      LEFT JOIN users u ON u.id = t.owner_id
      ORDER BY COALESCE(t.updated_at, t.created_at) DESC
    `).all();
    return c.json({ success: true, data: rows.results || [] });
  });

  // Exceptions API (read-only for now)
  app.get('/api/exceptions', (c) => {
    const rows = c.env.DB.prepare(`
      SELECT e.*, r.title as risk_title, r.risk_id, c.name as control_name
      FROM risk_exceptions e
      LEFT JOIN risks r ON r.id = e.risk_id
      LEFT JOIN controls c ON c.id = e.control_id
      ORDER BY e.created_at DESC
    `).all();
    return c.json({ success: true, data: rows.results || [] });
  });

  // Evidence API (read-only for now)
  app.get('/api/evidence', (c) => {
    const rows = c.env.DB.prepare(`
      SELECT * FROM evidence ORDER BY created_at DESC LIMIT 100
    `).all();
    return c.json({ success: true, data: rows.results || [] });
  });

  // --- Helper: Audit log ---
  function logAudit(c, entity, entity_id, action, beforeObj, afterObj, user_id) {
    try {
      c.env.DB.prepare(
        'INSERT INTO audit_log (entity, entity_id, action, user_id, before_json, after_json) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(entity, entity_id ?? null, action, user_id ?? null, JSON.stringify(beforeObj ?? null), JSON.stringify(afterObj ?? null));
    } catch (e) {
      console.error('Audit log failed:', e);
    }
  }

  // --- Treatments CRUD ---
  app.post('/api/treatments', async (c) => {
    const user = getAuthUser(c);
    if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401);
    try {
      const b = await c.req.json();
      const allowedStrategies = new Set(['accept','avoid','mitigate','transfer']);
      if (!b.risk_id || !allowedStrategies.has(b.strategy)) {
        return c.json({ success: false, error: 'risk_id and valid strategy are required' }, 400);
      }
      const res = c.env.DB.prepare(`
        INSERT INTO risk_treatments (risk_id, strategy, actions, owner_id, budget, start_date, due_date, status, approval_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, 'planning'), COALESCE(?, 'pending'))
      `).run(b.risk_id, b.strategy, b.actions ?? null, b.owner_id ?? null, b.budget ?? null, b.start_date ?? null, b.due_date ?? null, b.status, b.approval_status);
      const created = c.env.DB.prepare('SELECT * FROM risk_treatments WHERE id = ?').first(res.meta.last_row_id);
      logAudit(c, 'risk_treatments', res.meta.last_row_id, 'create', null, created.result, user.id);
      return c.json({ success: true, data: created.result });
    } catch (e) {
      console.error('Create treatment error:', e);
      return c.json({ success: false, error: 'Internal server error' }, 500);
    }
  });

  app.put('/api/treatments/:id', async (c) => {
    const user = getAuthUser(c);
    if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401);
    try {
      const id = parseInt(c.req.param('id'));
      const before = c.env.DB.prepare('SELECT * FROM risk_treatments WHERE id = ?').first(id);
      if (!before.success || !before.result) return c.json({ success: false, error: 'Not found' }, 404);
      const b = await c.req.json();
      const fields = [];
      const params = [];
      const allowed = ['strategy','actions','owner_id','budget','start_date','due_date','status','approval_status','acceptance_justification','acceptance_expiry'];
      for (const k of allowed) {
        if (k in b) { fields.push(`${k} = ?`); params.push(b[k]); }
      }
      fields.push('updated_at = CURRENT_TIMESTAMP');
      const sql = `UPDATE risk_treatments SET ${fields.join(', ')} WHERE id = ?`;
      params.push(id);
      const res = c.env.DB.prepare(sql).run(...params);
      if (!res.success) return c.json({ success: false, error: 'Update failed' }, 400);
      const after = c.env.DB.prepare('SELECT * FROM risk_treatments WHERE id = ?').first(id);
      logAudit(c, 'risk_treatments', id, 'update', before.result, after.result, user.id);
      return c.json({ success: true, data: after.result });
    } catch (e) {
      console.error('Update treatment error:', e);
      return c.json({ success: false, error: 'Internal server error' }, 500);
    }
  });

  app.delete('/api/treatments/:id', (c) => {
    const user = getAuthUser(c);
    if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401);
    const id = parseInt(c.req.param('id'));
    const before = c.env.DB.prepare('SELECT * FROM risk_treatments WHERE id = ?').first(id);
    const res = c.env.DB.prepare('DELETE FROM risk_treatments WHERE id = ?').run(id);
    if (!res.success || res.meta.changes === 0) return c.json({ success: false, error: 'Not found' }, 404);
    logAudit(c, 'risk_treatments', id, 'delete', before.result, null, user.id);
    return c.json({ success: true });
  });

  // --- Exceptions CRUD ---
  app.post('/api/exceptions', async (c) => {
    const user = getAuthUser(c);
    if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401);
    try {
      const b = await c.req.json();
      if (!b.control_id || !b.justification) {
        return c.json({ success: false, error: 'control_id and justification required' }, 400);
      }
      const res = c.env.DB.prepare(`
        INSERT INTO risk_exceptions (control_id, risk_id, justification, approver_id, expiry_date, status, created_by)
        VALUES (?, ?, ?, ?, ?, COALESCE(?, 'active'), ?)
      `).run(b.control_id, b.risk_id ?? null, b.justification, b.approver_id ?? null, b.expiry_date ?? null, b.status, user.id);
      const created = c.env.DB.prepare('SELECT * FROM risk_exceptions WHERE id = ?').first(res.meta.last_row_id);
      logAudit(c, 'risk_exceptions', res.meta.last_row_id, 'create', null, created.result, user.id);
      return c.json({ success: true, data: created.result });
    } catch (e) {
      console.error('Create exception error:', e);
      return c.json({ success: false, error: 'Internal server error' }, 500);
    }
  });

  app.put('/api/exceptions/:id', async (c) => {
    const user = getAuthUser(c);
    if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401);
    try {
      const id = parseInt(c.req.param('id'));
      const before = c.env.DB.prepare('SELECT * FROM risk_exceptions WHERE id = ?').first(id);
      if (!before.success || !before.result) return c.json({ success: false, error: 'Not found' }, 404);
      const b = await c.req.json();
      const fields = [];
      const params = [];
      const allowed = ['control_id','risk_id','justification','approver_id','expiry_date','status'];
      for (const k of allowed) if (k in b) { fields.push(`${k} = ?`); params.push(b[k]); }
      const sql = `UPDATE risk_exceptions SET ${fields.join(', ')} WHERE id = ?`;
      params.push(id);
      const res = c.env.DB.prepare(sql).run(...params);
      if (!res.success) return c.json({ success: false, error: 'Update failed' }, 400);
      const after = c.env.DB.prepare('SELECT * FROM risk_exceptions WHERE id = ?').first(id);
      logAudit(c, 'risk_exceptions', id, 'update', before.result, after.result, user.id);
      return c.json({ success: true, data: after.result });
    } catch (e) {
      console.error('Update exception error:', e);
      return c.json({ success: false, error: 'Internal server error' }, 500);
    }
  });

  app.delete('/api/exceptions/:id', (c) => {
    const user = getAuthUser(c);
    if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401);
    const id = parseInt(c.req.param('id'));
    const before = c.env.DB.prepare('SELECT * FROM risk_exceptions WHERE id = ?').first(id);
    const res = c.env.DB.prepare('DELETE FROM risk_exceptions WHERE id = ?').run(id);
    if (!res.success || res.meta.changes === 0) return c.json({ success: false, error: 'Not found' }, 404);
    logAudit(c, 'risk_exceptions', id, 'delete', before.result, null, user.id);
    return c.json({ success: true });
  });

  // --- KRIs CRUD ---
  app.post('/api/kris', async (c) => {
    const user = getAuthUser(c);
    if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401);
    try {
      const b = await c.req.json();
      if (!b.name || typeof b.threshold === 'undefined' || !b.direction) {
        return c.json({ success: false, error: 'name, threshold, direction required' }, 400);
      }
      const res = c.env.DB.prepare(`
        INSERT INTO kris (name, description, data_source, threshold, direction, frequency, unit, owner_id, calculation_method, alerting_policy, breach_workflow_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(b.name, b.description ?? null, b.data_source ?? null, b.threshold, b.direction, b.frequency ?? null, b.unit ?? null, b.owner_id ?? null, b.calculation_method ?? null, b.alerting_policy ?? null, b.breach_workflow_id ?? null);
      const created = c.env.DB.prepare('SELECT * FROM kris WHERE id = ?').first(res.meta.last_row_id);
      logAudit(c, 'kris', res.meta.last_row_id, 'create', null, created.result, user.id);
      return c.json({ success: true, data: created.result });
    } catch (e) {
      console.error('Create KRI error:', e);
      return c.json({ success: false, error: 'Internal server error' }, 500);
    }
  });

  app.put('/api/kris/:id', async (c) => {
    const user = getAuthUser(c);
    if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401);
    try {
      const id = parseInt(c.req.param('id'));
      const before = c.env.DB.prepare('SELECT * FROM kris WHERE id = ?').first(id);
      if (!before.success || !before.result) return c.json({ success: false, error: 'Not found' }, 404);
      const b = await c.req.json();
      const fields = [];
      const params = [];
      const allowed = ['name','description','data_source','threshold','direction','frequency','unit','owner_id','calculation_method','alerting_policy','breach_workflow_id'];
      for (const k of allowed) if (k in b) { fields.push(`${k} = ?`); params.push(b[k]); }
      const sql = `UPDATE kris SET ${fields.join(', ')} WHERE id = ?`;
      params.push(id);
      const res = c.env.DB.prepare(sql).run(...params);
      if (!res.success) return c.json({ success: false, error: 'Update failed' }, 400);
      const after = c.env.DB.prepare('SELECT * FROM kris WHERE id = ?').first(id);
      logAudit(c, 'kris', id, 'update', before.result, after.result, user.id);
      return c.json({ success: true, data: after.result });
    } catch (e) {
      console.error('Update KRI error:', e);
      return c.json({ success: false, error: 'Internal server error' }, 500);
    }
  });

  app.delete('/api/kris/:id', (c) => {
    const user = getAuthUser(c);
    if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401);
    const id = parseInt(c.req.param('id'));
    const before = c.env.DB.prepare('SELECT * FROM kris WHERE id = ?').first(id);
    const res = c.env.DB.prepare('DELETE FROM kris WHERE id = ?').run(id);
    if (!res.success || res.meta.changes === 0) return c.json({ success: false, error: 'Not found' }, 404);
    logAudit(c, 'kris', id, 'delete', before.result, null, user.id);
    return c.json({ success: true });
  });

  // Add KRI reading
  app.post('/api/kris/:id/readings', async (c) => {
    const user = getAuthUser(c);
    if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401);
    try {
      const id = parseInt(c.req.param('id'));
      const b = await c.req.json();
      const kriRes = c.env.DB.prepare('SELECT * FROM kris WHERE id = ?').first(id);
      if (!kriRes.success || !kriRes.result) return c.json({ success: false, error: 'KRI not found' }, 404);
      const kri = kriRes.result;
      const value = Number(b.value);
      if (Number.isNaN(value)) return c.json({ success: false, error: 'Numeric value required' }, 400);
      const breached = (kri.direction === 'above_is_bad' && value > kri.threshold) || (kri.direction === 'below_is_bad' && value < kri.threshold);
      const status = breached ? 'breached' : 'ok';
      const res = c.env.DB.prepare('INSERT INTO kri_readings (kri_id, timestamp, value, status) VALUES (?, COALESCE(?, CURRENT_TIMESTAMP), ?, ?)').run(id, b.timestamp ?? null, value, status);
      const created = c.env.DB.prepare('SELECT * FROM kri_readings WHERE id = ?').first(res.meta.last_row_id);
      logAudit(c, 'kri_readings', res.meta.last_row_id, 'create', null, created.result, user.id);
      return c.json({ success: true, data: created.result });
    } catch (e) {
      console.error('Add KRI reading error:', e);
      return c.json({ success: false, error: 'Internal server error' }, 500);
    }
  });

  // --- Basic search endpoint (used by ARIA) ---
  app.get('/api/search', (c) => {
    const q = (c.req.query('q') || '').trim();
    if (!q) return c.json({ success: true, data: { risks: [], incidents: [], documents: [] } });
    const term = `%${q}%`;
    const risks = c.env.DB.prepare("SELECT id, risk_id, title, risk_score, created_at FROM risks WHERE title LIKE ? OR description LIKE ? ORDER BY created_at DESC LIMIT 10").all(term, term);
    const incidents = c.env.DB.prepare("SELECT id, incident_id, title, severity, COALESCE(reported_at, created_at) AS created_at FROM incidents WHERE title LIKE ? OR description LIKE ? ORDER BY created_at DESC LIMIT 10").all(term, term);
    const documents = c.env.DB.prepare("SELECT id, title, file_url, created_at FROM documents WHERE title LIKE ? OR description LIKE ? ORDER BY created_at DESC LIMIT 10").all(term, term);
    return c.json({ success: true, data: { risks: risks.results || [], incidents: incidents.results || [], documents: documents.results || [] }});
  });

  // --- Simple AI chat endpoint (local, no external calls) ---
  app.post('/api/ai/chat', async (c) => {
    const user = getAuthUser(c);
    if (!user) return c.json({ success: false, error: 'Unauthorized' }, 401);
    try {
      const body = await c.req.json();
      const message = (body.message || '').toString().trim();
      if (!message) return c.json({ success: false, error: 'Message is required' }, 400);
      const term = `%${message}%`;
      const risks = c.env.DB.prepare("SELECT title AS name, risk_id AS id, risk_score FROM risks WHERE title LIKE ? OR description LIKE ? ORDER BY created_at DESC LIMIT 3").all(term, term);
      const incidents = c.env.DB.prepare("SELECT title AS name, incident_id AS id, severity FROM incidents WHERE title LIKE ? OR description LIKE ? ORDER BY COALESCE(reported_at, created_at) DESC LIMIT 3").all(term, term);
      const documents = c.env.DB.prepare("SELECT title AS name, file_url AS id FROM documents WHERE title LIKE ? OR description LIKE ? ORDER BY created_at DESC LIMIT 3").all(term, term);
      const sources = [
        ...(risks.results || []).map(x => ({ type: 'risk', id: x.id, title: x.name })),
        ...(incidents.results || []).map(x => ({ type: 'incident', id: x.id, title: x.name })),
        ...(documents.results || []).map(x => ({ type: 'document', id: x.id, title: x.name }))
      ];
      const reply = sources.length
        ? `Here are the most relevant references I found based on your question:\n` +
          sources.map((s, i) => `${i+1}. [${s.type}] ${s.title} (${s.id})`).join('\n') +
          `\n\nYou can refine your query or open the related module for details.`
        : `I couldn't find direct matches. Try rephrasing or select a specific module (Risks, Incidents, Documents).`;
      return c.json({ success: true, data: { reply, sources } });
    } catch (e) {
      console.error('AI chat error:', e);
      return c.json({ success: false, error: 'Internal server error' }, 500);
    }
  });

  // --- Secure API Key Management endpoints ---
  const keyManagementAPI = createSecureKeyManagementAPI();
  app.route('/api/keys', keyManagementAPI);

  // --- RAG admin endpoints (placeholders) ---
  app.get('/api/rag/stats', (c) => {
    // Placeholder stats until full RAG wiring
    return c.json({ success: true, data: { vectorStore: { totalDocuments: 0 }, embeddings: { cacheSize: 0 }}});
  });
  app.post('/api/rag/reindex', (c) => {
    // Placeholder: trigger background reindex in full implementation
    return c.json({ success: true, message: 'Re-index started (placeholder)' });
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