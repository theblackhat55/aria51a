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
    // TODO: Fetch from database
    return c.json({
      success: true,
      data: []
    });
  });
  
  app.post('/risks', async (c) => {
    const body = await c.req.json();
    // TODO: Create risk in database
    return c.json({
      success: true,
      message: 'Risk created successfully'
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