// AI Systems Management API
// Handles CRUD operations for AI system registry and monitoring

import { Hono } from 'hono';
import { cors } from 'hono/cors';

const aiSystemsApi = new Hono();

// Enable CORS for all AI governance endpoints
aiSystemsApi.use('*', cors());

// Get all AI systems for an organization
aiSystemsApi.get('/systems', async (c) => {
  const { DB } = c.env;
  const orgId = c.req.header('X-Org-ID') || '1'; // Default to org 1 for demo
  
  try {
    const stmt = DB.prepare(`
      SELECT 
        s.*,
        bo.first_name || ' ' || bo.last_name as business_owner_name,
        tech.first_name || ' ' || tech.last_name as technical_owner_name,
        COUNT(DISTINCT ra.id) as assessment_count,
        COUNT(DISTINCT i.id) as incident_count,
        MAX(ra.assessment_date) as last_assessment_date
      FROM ai_systems s
      LEFT JOIN users bo ON s.business_owner_id = bo.id
      LEFT JOIN users tech ON s.technical_owner_id = tech.id
      LEFT JOIN ai_risk_assessments ra ON s.id = ra.ai_system_id
      LEFT JOIN ai_incidents i ON s.id = i.ai_system_id AND i.status != 'closed'
      WHERE s.org_id = ?
      GROUP BY s.id
      ORDER BY s.created_at DESC
    `);
    
    const result = await stmt.bind(orgId).all();
    
    if (!result.success) {
      return c.json({ error: 'Database query failed' }, 500);
    }

    return c.json({ 
      success: true, 
      data: result.results,
      count: result.results.length 
    });
  } catch (error) {
    console.error('Error fetching AI systems:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get specific AI system details
aiSystemsApi.get('/systems/:id', async (c) => {
  const { DB } = c.env;
  const systemId = c.req.param('id');
  const orgId = c.req.header('X-Org-ID') || '1';
  
  try {
    const systemStmt = DB.prepare(`
      SELECT 
        s.*,
        bo.first_name || ' ' || bo.last_name as business_owner_name,
        tech.first_name || ' ' || tech.last_name as technical_owner_name
      FROM ai_systems s
      LEFT JOIN users bo ON s.business_owner_id = bo.id
      LEFT JOIN users tech ON s.technical_owner_id = tech.id
      WHERE s.id = ? AND s.org_id = ?
    `);
    
    const systemResult = await systemStmt.bind(systemId, orgId).first();
    
    if (!systemResult) {
      return c.json({ error: 'AI system not found' }, 404);
    }

    // Get latest risk assessment
    const assessmentStmt = DB.prepare(`
      SELECT * FROM ai_risk_assessments
      WHERE ai_system_id = ?
      ORDER BY assessment_date DESC
      LIMIT 1
    `);
    
    const assessment = await assessmentStmt.bind(systemId).first();

    // Get recent metrics (last 7 days)
    const metricsStmt = DB.prepare(`
      SELECT * FROM ai_system_metrics
      WHERE ai_system_id = ? AND timestamp > datetime('now', '-7 days')
      ORDER BY timestamp DESC
      LIMIT 20
    `);
    
    const metrics = await metricsStmt.bind(systemId).all();

    // Get recent incidents
    const incidentsStmt = DB.prepare(`
      SELECT * FROM ai_incidents
      WHERE ai_system_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    const incidents = await incidentsStmt.bind(systemId).all();

    return c.json({ 
      success: true, 
      data: {
        system: systemResult,
        latest_assessment: assessment,
        recent_metrics: metrics.results || [],
        recent_incidents: incidents.results || []
      }
    });
  } catch (error) {
    console.error('Error fetching AI system details:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create new AI system
aiSystemsApi.post('/systems', async (c) => {
  const { DB } = c.env;
  const orgId = c.req.header('X-Org-ID') || '1';
  
  try {
    const body = await c.req.json();
    
    const stmt = DB.prepare(`
      INSERT INTO ai_systems (
        org_id, name, description, system_type, deployment_type,
        discovery_method, model_provider, model_name, business_purpose,
        ai_act_classification, current_risk_level, operational_status,
        business_owner_id, technical_owner_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      RETURNING *
    `);
    
    const result = await stmt.bind(
      orgId,
      body.name,
      body.description || null,
      body.system_type,
      body.deployment_type,
      body.discovery_method || 'manual_registration',
      body.model_provider || null,
      body.model_name || null,
      body.business_purpose || null,
      body.ai_act_classification || 'minimal',
      body.current_risk_level || 'unassessed',
      body.operational_status || 'development',
      body.business_owner_id || null,
      body.technical_owner_id || null
    ).first();
    
    return c.json({ 
      success: true, 
      data: result,
      message: 'AI system registered successfully'
    });
  } catch (error) {
    console.error('Error creating AI system:', error);
    return c.json({ error: 'Failed to create AI system' }, 500);
  }
});

// Update AI system
aiSystemsApi.put('/systems/:id', async (c) => {
  const { DB } = c.env;
  const systemId = c.req.param('id');
  const orgId = c.req.header('X-Org-ID') || '1';
  
  try {
    const body = await c.req.json();
    
    const stmt = DB.prepare(`
      UPDATE ai_systems SET
        name = ?, description = ?, system_type = ?, deployment_type = ?,
        model_provider = ?, model_name = ?, business_purpose = ?,
        ai_act_classification = ?, current_risk_level = ?, operational_status = ?,
        business_owner_id = ?, technical_owner_id = ?, updated_at = datetime('now')
      WHERE id = ? AND org_id = ?
      RETURNING *
    `);
    
    const result = await stmt.bind(
      body.name,
      body.description,
      body.system_type,
      body.deployment_type,
      body.model_provider,
      body.model_name,
      body.business_purpose,
      body.ai_act_classification,
      body.current_risk_level,
      body.operational_status,
      body.business_owner_id,
      body.technical_owner_id,
      systemId,
      orgId
    ).first();
    
    if (!result) {
      return c.json({ error: 'AI system not found' }, 404);
    }
    
    return c.json({ 
      success: true, 
      data: result,
      message: 'AI system updated successfully'
    });
  } catch (error) {
    console.error('Error updating AI system:', error);
    return c.json({ error: 'Failed to update AI system' }, 500);
  }
});

// Get AI governance dashboard data
aiSystemsApi.get('/dashboard', async (c) => {
  const { DB } = c.env;
  const orgId = c.req.header('X-Org-ID') || '1';
  
  try {
    // Get system counts by risk level
    const riskLevelStmt = DB.prepare(`
      SELECT current_risk_level, COUNT(*) as count
      FROM ai_systems 
      WHERE org_id = ?
      GROUP BY current_risk_level
    `);
    
    const riskLevelCounts = await riskLevelStmt.bind(orgId).all();

    // Get system counts by operational status
    const statusStmt = DB.prepare(`
      SELECT operational_status, COUNT(*) as count
      FROM ai_systems 
      WHERE org_id = ?
      GROUP BY operational_status
    `);
    
    const statusCounts = await statusStmt.bind(orgId).all();

    // Get recent incidents count
    const incidentsStmt = DB.prepare(`
      SELECT COUNT(*) as count
      FROM ai_incidents 
      WHERE org_id = ? AND status != 'closed'
    `);
    
    const activeIncidents = await incidentsStmt.bind(orgId).first();

    // Get overdue assessments
    const overdueStmt = DB.prepare(`
      SELECT COUNT(*) as count
      FROM ai_systems s
      LEFT JOIN ai_risk_assessments ra ON s.id = ra.ai_system_id
      WHERE s.org_id = ? 
      AND (
        ra.next_assessment_due < datetime('now') 
        OR ra.next_assessment_due IS NULL
      )
    `);
    
    const overdueAssessments = await overdueStmt.bind(orgId).first();

    // Get systems needing approval
    const approvalStmt = DB.prepare(`
      SELECT COUNT(*) as count
      FROM ai_systems 
      WHERE org_id = ? AND approval_status = 'pending'
    `);
    
    const needingApproval = await approvalStmt.bind(orgId).first();

    // Get recent high-risk systems
    const highRiskStmt = DB.prepare(`
      SELECT name, current_risk_level, operational_status, created_at
      FROM ai_systems 
      WHERE org_id = ? AND current_risk_level IN ('high', 'critical')
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    const highRiskSystems = await highRiskStmt.bind(orgId).all();

    return c.json({ 
      success: true, 
      data: {
        summary: {
          totalSystems: riskLevelCounts.results?.reduce((sum, item) => sum + item.count, 0) || 0,
          highRiskSystems: riskLevelCounts.results?.find((item) => item.current_risk_level === 'high')?.count || 0,
          activeIncidents: activeIncidents?.count || 0,
          overdueAssessments: overdueAssessments?.count || 0,
          needingApproval: needingApproval?.count || 0
        },
        riskLevelBreakdown: riskLevelCounts.results || [],
        statusBreakdown: statusCounts.results || [],
        highRiskSystems: highRiskSystems.results || []
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default aiSystemsApi;