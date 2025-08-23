// AI Risk Assessment API
// Handles AI risk assessments, monitoring, and compliance tracking

import { Hono } from 'hono';
import { cors } from 'hono/cors';

const aiRiskApi = new Hono();

// Enable CORS for all AI risk endpoints
aiRiskApi.use('*', cors());

// Get all risk assessments for an organization
aiRiskApi.get('/assessments', async (c) => {
  const { DB } = c.env;
  const orgId = c.req.header('X-Org-ID') || '1';
  
  try {
    const stmt = DB.prepare(`
      SELECT 
        ra.*,
        s.name as system_name,
        s.system_type,
        s.operational_status,
        u.first_name || ' ' || u.last_name as assessor_name
      FROM ai_risk_assessments ra
      JOIN ai_systems s ON ra.ai_system_id = s.id
      LEFT JOIN users u ON ra.assessor_id = u.id
      WHERE ra.org_id = ?
      ORDER BY ra.assessment_date DESC
    `);
    
    const result = await stmt.bind(orgId).all();
    
    return c.json({ 
      success: true, 
      data: result.results || [],
      count: result.results?.length || 0 
    });
  } catch (error) {
    console.error('Error fetching risk assessments:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create new risk assessment
aiRiskApi.post('/assessments', async (c) => {
  const { DB } = c.env;
  const orgId = c.req.header('X-Org-ID') || '1';
  
  try {
    const body = await c.req.json();
    
    // Calculate composite risk score
    const riskScores = [
      body.bias_risk_score,
      body.privacy_risk_score,
      body.security_risk_score,
      body.transparency_risk_score,
      body.reliability_risk_score,
      body.human_oversight_score
    ].filter(score => score != null);
    
    const compositeScore = riskScores.length > 0 
      ? riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length 
      : null;
    
    // Determine risk level based on composite score
    let riskLevel = 'minimal';
    if (compositeScore >= 4) riskLevel = 'unacceptable';
    else if (compositeScore >= 3.5) riskLevel = 'high';
    else if (compositeScore >= 2.5) riskLevel = 'limited';
    
    const stmt = DB.prepare(`
      INSERT INTO ai_risk_assessments (
        org_id, ai_system_id, assessment_type, assessment_framework,
        bias_risk_score, privacy_risk_score, security_risk_score,
        transparency_risk_score, reliability_risk_score, human_oversight_score,
        composite_risk_score, risk_level, assessor_id,
        findings_json, recommendations_json, next_assessment_due,
        assessment_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      RETURNING *
    `);
    
    const result = await stmt.bind(
      orgId,
      body.ai_system_id,
      body.assessment_type || 'periodic',
      body.assessment_framework || 'nist_ai_rmf',
      body.bias_risk_score || null,
      body.privacy_risk_score || null,
      body.security_risk_score || null,
      body.transparency_risk_score || null,
      body.reliability_risk_score || null,
      body.human_oversight_score || null,
      compositeScore,
      riskLevel,
      body.assessor_id,
      body.findings_json || null,
      body.recommendations_json || null,
      body.next_assessment_due || null
    ).first();
    
    // Update the AI system's current risk level
    const updateSystemStmt = DB.prepare(`
      UPDATE ai_systems 
      SET current_risk_level = ?, last_risk_assessment = datetime('now'), updated_at = datetime('now')
      WHERE id = ? AND org_id = ?
    `);
    
    await updateSystemStmt.bind(riskLevel, body.ai_system_id, orgId).run();
    
    return c.json({ 
      success: true, 
      data: result,
      message: 'Risk assessment created successfully'
    });
  } catch (error) {
    console.error('Error creating risk assessment:', error);
    return c.json({ error: 'Failed to create risk assessment' }, 500);
  }
});

// Get risk assessment details
aiRiskApi.get('/assessments/:id', async (c) => {
  const { DB } = c.env;
  const assessmentId = c.req.param('id');
  const orgId = c.req.header('X-Org-ID') || '1';
  
  try {
    const stmt = DB.prepare(`
      SELECT 
        ra.*,
        s.name as system_name,
        s.system_type,
        s.model_provider,
        u.first_name || ' ' || u.last_name as assessor_name
      FROM ai_risk_assessments ra
      JOIN ai_systems s ON ra.ai_system_id = s.id
      LEFT JOIN users u ON ra.assessor_id = u.id
      WHERE ra.id = ? AND ra.org_id = ?
    `);
    
    const result = await stmt.bind(assessmentId, orgId).first();
    
    if (!result) {
      return c.json({ error: 'Risk assessment not found' }, 404);
    }
    
    return c.json({ 
      success: true, 
      data: result
    });
  } catch (error) {
    console.error('Error fetching risk assessment:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get AI incidents
aiRiskApi.get('/incidents', async (c) => {
  const { DB } = c.env;
  const orgId = c.req.header('X-Org-ID') || '1';
  
  try {
    const stmt = DB.prepare(`
      SELECT 
        i.*,
        s.name as system_name,
        s.system_type,
        u.first_name || ' ' || u.last_name as assigned_to_name
      FROM ai_incidents i
      JOIN ai_systems s ON i.ai_system_id = s.id
      LEFT JOIN users u ON i.assigned_to_id = u.id
      WHERE i.org_id = ?
      ORDER BY i.created_at DESC
    `);
    
    const result = await stmt.bind(orgId).all();
    
    return c.json({ 
      success: true, 
      data: result.results || [],
      count: result.results?.length || 0 
    });
  } catch (error) {
    console.error('Error fetching AI incidents:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Create new AI incident
aiRiskApi.post('/incidents', async (c) => {
  const { DB } = c.env;
  const orgId = c.req.header('X-Org-ID') || '1';
  
  try {
    const body = await c.req.json();
    
    const stmt = DB.prepare(`
      INSERT INTO ai_incidents (
        org_id, ai_system_id, incident_type, severity, title, description,
        detection_method, detection_timestamp, impact_assessment,
        assigned_to_id, created_by_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      RETURNING *
    `);
    
    const result = await stmt.bind(
      orgId,
      body.ai_system_id,
      body.incident_type,
      body.severity,
      body.title,
      body.description,
      body.detection_method || 'manual_report',
      body.detection_timestamp || 'datetime("now")',
      body.impact_assessment || null,
      body.assigned_to_id || null,
      body.created_by_id
    ).first();
    
    return c.json({ 
      success: true, 
      data: result,
      message: 'AI incident created successfully'
    });
  } catch (error) {
    console.error('Error creating AI incident:', error);
    return c.json({ error: 'Failed to create AI incident' }, 500);
  }
});

// Update AI incident status
aiRiskApi.put('/incidents/:id/status', async (c) => {
  const { DB } = c.env;
  const incidentId = c.req.param('id');
  const orgId = c.req.header('X-Org-ID') || '1';
  
  try {
    const body = await c.req.json();
    
    const stmt = DB.prepare(`
      UPDATE ai_incidents 
      SET status = ?, updated_at = datetime('now')
      WHERE id = ? AND org_id = ?
      RETURNING *
    `);
    
    const result = await stmt.bind(body.status, incidentId, orgId).first();
    
    if (!result) {
      return c.json({ error: 'AI incident not found' }, 404);
    }
    
    return c.json({ 
      success: true, 
      data: result,
      message: 'Incident status updated successfully'
    });
  } catch (error) {
    console.error('Error updating incident status:', error);
    return c.json({ error: 'Failed to update incident status' }, 500);
  }
});

// Get AI risk metrics for monitoring
aiRiskApi.get('/metrics/:systemId', async (c) => {
  const { DB } = c.env;
  const systemId = c.req.param('systemId');
  const orgId = c.req.header('X-Org-ID') || '1';
  const timeframe = c.req.query('timeframe') || '7d';
  
  try {
    // Convert timeframe to SQL interval
    let interval = '-7 days';
    switch (timeframe) {
      case '1h': interval = '-1 hours'; break;
      case '24h': interval = '-1 days'; break;
      case '7d': interval = '-7 days'; break;
      case '30d': interval = '-30 days'; break;
    }
    
    const stmt = DB.prepare(`
      SELECT * FROM ai_system_metrics
      WHERE ai_system_id = ? 
      AND org_id = ?
      AND timestamp > datetime('now', ?)
      ORDER BY timestamp DESC
      LIMIT 100
    `);
    
    const result = await stmt.bind(systemId, orgId, interval).all();
    
    return c.json({ 
      success: true, 
      data: result.results || [],
      timeframe,
      count: result.results?.length || 0 
    });
  } catch (error) {
    console.error('Error fetching AI metrics:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Record new AI system metrics
aiRiskApi.post('/metrics', async (c) => {
  const { DB } = c.env;
  const orgId = c.req.header('X-Org-ID') || '1';
  
  try {
    const body = await c.req.json();
    
    const stmt = DB.prepare(`
      INSERT INTO ai_system_metrics (
        org_id, ai_system_id, metric_type, accuracy, precision_score,
        recall_score, f1_score, latency_ms, throughput_rps,
        demographic_parity, equalized_odds, calibration_score,
        data_drift_score, concept_drift_score, prediction_drift_score,
        total_requests, unique_users, error_rate,
        compute_cost_usd, api_cost_usd, anomaly_score,
        measurement_window_start, measurement_window_end, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      RETURNING *
    `);
    
    const result = await stmt.bind(
      orgId,
      body.ai_system_id,
      body.metric_type,
      body.accuracy || null,
      body.precision_score || null,
      body.recall_score || null,
      body.f1_score || null,
      body.latency_ms || null,
      body.throughput_rps || null,
      body.demographic_parity || null,
      body.equalized_odds || null,
      body.calibration_score || null,
      body.data_drift_score || null,
      body.concept_drift_score || null,
      body.prediction_drift_score || null,
      body.total_requests || null,
      body.unique_users || null,
      body.error_rate || null,
      body.compute_cost_usd || null,
      body.api_cost_usd || null,
      body.anomaly_score || null,
      body.measurement_window_start || null,
      body.measurement_window_end || null
    ).first();
    
    return c.json({ 
      success: true, 
      data: result,
      message: 'Metrics recorded successfully'
    });
  } catch (error) {
    console.error('Error recording metrics:', error);
    return c.json({ error: 'Failed to record metrics' }, 500);
  }
});

// Get compliance status overview
aiRiskApi.get('/compliance', async (c) => {
  const { DB } = c.env;
  const orgId = c.req.header('X-Org-ID') || '1';
  
  try {
    // Get EU AI Act compliance status
    const euActStmt = DB.prepare(`
      SELECT 
        ai_act_classification,
        COUNT(*) as count,
        COUNT(CASE WHEN approval_status = 'approved' THEN 1 END) as approved_count
      FROM ai_systems 
      WHERE org_id = ? AND ai_act_classification IS NOT NULL
      GROUP BY ai_act_classification
    `);
    
    const euActResults = await euActStmt.bind(orgId).all();

    // Get systems needing risk assessment
    const assessmentStmt = DB.prepare(`
      SELECT COUNT(*) as count
      FROM ai_systems s
      LEFT JOIN ai_risk_assessments ra ON s.id = ra.ai_system_id
      WHERE s.org_id = ? 
      AND s.current_risk_level IN ('high', 'critical')
      AND (ra.next_assessment_due < datetime('now') OR ra.next_assessment_due IS NULL)
    `);
    
    const overdueAssessments = await assessmentStmt.bind(orgId).first();

    // Get high-risk systems without proper oversight
    const oversightStmt = DB.prepare(`
      SELECT COUNT(*) as count
      FROM ai_systems s
      LEFT JOIN ai_risk_assessments ra ON s.id = ra.ai_system_id
      WHERE s.org_id = ? 
      AND s.ai_act_classification = 'high'
      AND (ra.human_oversight_score IS NULL OR ra.human_oversight_score < 3)
    `);
    
    const oversightGaps = await oversightStmt.bind(orgId).first();

    return c.json({ 
      success: true, 
      data: {
        euAiAct: {
          systemsByClassification: euActResults.results || [],
          complianceRate: euActResults.results ? 
            euActResults.results.reduce((sum, item) => sum + item.approved_count, 0) /
            euActResults.results.reduce((sum, item) => sum + item.count, 0) * 100 : 0
        },
        riskManagement: {
          overdueAssessments: overdueAssessments?.count || 0,
          oversightGaps: oversightGaps?.count || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching compliance data:', error);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

export default aiRiskApi;