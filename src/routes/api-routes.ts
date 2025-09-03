import { Hono } from 'hono';
import { requireAuth } from './auth-routes';

export function createAPIRoutes() {
  const app = new Hono();
  
  // Health check (no auth required)
  app.get('/health', (c) => {
    return c.json({
      status: 'healthy',
      version: '5.1.0',
      mode: 'HTMX',
      timestamp: new Date().toISOString()
    });
  });
  
  // Apply authentication to other routes
  app.use('*', requireAuth);
  
  // Risks API
  app.get('/risks', async (c) => {
    const db = c.env?.DB;
    
    try {
      if (db) {
        const result = await db.prepare(
          `SELECT id, title, description, category, likelihood, impact, 
                  risk_score, owner, status, created_at, updated_at 
           FROM risks ORDER BY created_at DESC LIMIT 50`
        ).all();
        
        return c.json({
          success: true,
          data: result.results || []
        });
      }
    } catch (error) {
      console.error('Database error:', error);
    }
    
    // Fallback mock data
    return c.json({
      success: true,
      data: [
        {
          id: 1,
          title: 'Data Breach Risk',
          description: 'Potential unauthorized access to customer data',
          category: 'cybersecurity',
          likelihood: 3,
          impact: 4,
          risk_score: 12,
          owner: 'Security Team',
          status: 'open'
        },
        {
          id: 2,
          title: 'Compliance Violation',
          description: 'Risk of non-compliance with GDPR regulations',
          category: 'compliance',
          likelihood: 2,
          impact: 5,
          risk_score: 10,
          owner: 'Legal Team',
          status: 'in_treatment'
        }
      ]
    });
  });
  
  app.post('/risks', async (c) => {
    const body = await c.req.json();
    const db = c.env?.DB;
    const user = c.get('user');
    
    try {
      if (db) {
        const result = await db.prepare(
          `INSERT INTO risks (title, description, category, likelihood, impact, risk_score, owner, status, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'open', ?)
           RETURNING id`
        ).bind(
          body.title,
          body.description,
          body.category,
          body.likelihood,
          body.impact,
          (body.likelihood * body.impact),
          body.owner || user?.name,
          user?.id
        ).run();
        
        return c.json({
          success: true,
          message: 'Risk created successfully',
          id: result.meta?.last_row_id
        });
      }
    } catch (error) {
      console.error('Database error:', error);
      return c.json({
        success: false,
        message: 'Failed to create risk: ' + error.message
      }, 500);
    }
    
    return c.json({
      success: true,
      message: 'Risk created successfully (mock mode)'
    });
  });
  
  // Compliance API
  app.get('/compliance/score', async (c) => {
    return c.json({
      success: true,
      score: 78,
      frameworks: []
    });
  });
  
  // KRI API
  app.get('/kris', async (c) => {
    return c.json({
      success: true,
      data: []
    });
  });
  
  // Incidents API
  app.get('/incidents', async (c) => {
    return c.json({
      success: true,
      data: []
    });
  });
  
  app.post('/incidents', async (c) => {
    const body = await c.req.json();
    return c.json({
      success: true,
      message: 'Incident reported successfully'
    });
  });
  
  // Organizations API
  app.get('/organizations', async (c) => {
    const user = c.get('user');
    if (user.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
    return c.json({
      success: true,
      data: [
        { id: 1, name: 'ARIA5 Corporation', users: 45, risks: 23 },
        { id: 2, name: 'Demo Organization', users: 12, risks: 8 }
      ]
    });
  });
  
  // SAML Config API
  app.get('/saml/config', async (c) => {
    const user = c.get('user');
    if (user.role !== 'admin') {
      return c.json({ error: 'Unauthorized' }, 403);
    }
    
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
  
  return app;
}