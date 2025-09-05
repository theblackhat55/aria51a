import { Hono } from 'hono'
import { cleanLayout } from '../templates/layout-clean.js'
import { renderEnhancedRiskWizard, renderEnhancedRiskDashboard } from '../templates/enhanced-risk-wizard.js'

type Bindings = {
  DB: D1Database
}

const enhancedRiskRoutes = new Hono<{ Bindings: Bindings }>()

// Enhanced Risk Dashboard
enhancedRiskRoutes.get('/enhanced-dashboard', async (c) => {
  const user = c.get('user')
  
  if (!user) {
    return c.redirect('/auth/login')
  }

  const content = renderEnhancedRiskDashboard()
  
  return c.html(cleanLayout({ 
    title: 'Enhanced Risk Management', 
    content, 
    user, 
    activeSection: 'risk' 
  }))
})

// Enhanced Risk Assessment Wizard
enhancedRiskRoutes.get('/enhanced-wizard', async (c) => {
  const user = c.get('user')
  
  if (!user) {
    return c.redirect('/auth/login')
  }

  const content = renderEnhancedRiskWizard()
  
  return c.html(cleanLayout({ 
    title: 'Enhanced Risk Assessment Wizard', 
    content, 
    user, 
    activeSection: 'risk' 
  }))
})

// API: Get Threat Sources
enhancedRiskRoutes.get('/api/threat-sources', async (c) => {
  const user = c.get('user')
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const { env } = c
    
    const threatSources = await env.DB.prepare(`
      SELECT 
        id, name, category, subcategory, description, 
        likelihood_score, impact_potential, active_status
      FROM threat_sources 
      WHERE active_status = TRUE
      ORDER BY category, subcategory, name
    `).all()

    return c.json({
      success: true,
      data: threatSources.results || []
    })
  } catch (error) {
    console.error('Error fetching threat sources:', error)
    return c.json({ 
      error: 'Failed to fetch threat sources',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: Get Threat Events by Source
enhancedRiskRoutes.get('/api/threat-events/:sourceId', async (c) => {
  const user = c.get('user')
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const { env } = c
    const sourceId = c.req.param('sourceId')
    
    const threatEvents = await env.DB.prepare(`
      SELECT 
        te.id, te.name, te.description, te.event_type,
        te.impact_level, te.frequency_estimate, te.attack_vector,
        ts.name as threat_source_name
      FROM threat_events te
      JOIN threat_sources ts ON te.threat_source_id = ts.id
      WHERE te.threat_source_id = ? AND te.active_status = TRUE
      ORDER BY te.impact_level DESC, te.name
    `).bind(sourceId).all()

    return c.json({
      success: true,
      data: threatEvents.results || []
    })
  } catch (error) {
    console.error('Error fetching threat events:', error)
    return c.json({ 
      error: 'Failed to fetch threat events',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: Get Vulnerabilities
enhancedRiskRoutes.get('/api/vulnerabilities', async (c) => {
  const user = c.get('user')
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const { env } = c
    
    const vulnerabilities = await env.DB.prepare(`
      SELECT 
        id, name, description, vulnerability_type, category,
        severity, cvss_score, exploitability, remediation_status,
        remediation_due_date, business_impact
      FROM vulnerabilities_enhanced 
      WHERE active_status = TRUE
      ORDER BY 
        CASE severity 
          WHEN 'Critical' THEN 4
          WHEN 'High' THEN 3
          WHEN 'Medium' THEN 2
          ELSE 1 
        END DESC, name
    `).all()

    return c.json({
      success: true,
      data: vulnerabilities.results || []
    })
  } catch (error) {
    console.error('Error fetching vulnerabilities:', error)
    return c.json({ 
      error: 'Failed to fetch vulnerabilities',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: Get Assets
enhancedRiskRoutes.get('/api/assets', async (c) => {
  const user = c.get('user')
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const { env } = c
    
    const assets = await env.DB.prepare(`
      SELECT 
        id, name, asset_type, category, subcategory,
        criticality, business_function, business_impact,
        confidentiality_requirement, integrity_requirement, 
        availability_requirement, data_classification
      FROM assets_enhanced 
      WHERE active_status = TRUE
      ORDER BY 
        asset_type,
        CASE criticality 
          WHEN 'Critical' THEN 4
          WHEN 'High' THEN 3
          WHEN 'Medium' THEN 2
          ELSE 1 
        END DESC, name
    `).all()

    return c.json({
      success: true,
      data: assets.results || []
    })
  } catch (error) {
    console.error('Error fetching assets:', error)
    return c.json({ 
      error: 'Failed to fetch assets',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: Get Controls
enhancedRiskRoutes.get('/api/controls', async (c) => {
  const user = c.get('user')
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const { env } = c
    
    const controls = await env.DB.prepare(`
      SELECT 
        id, name, control_type, control_category, control_family,
        control_id, description, effectiveness_rating, maturity_level,
        implementation_status, implementation_date, automation_level
      FROM controls_enhanced 
      WHERE active_status = TRUE
      ORDER BY control_type, control_category, name
    `).all()

    return c.json({
      success: true,
      data: controls.results || []
    })
  } catch (error) {
    console.error('Error fetching controls:', error)
    return c.json({ 
      error: 'Failed to fetch controls',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: Create Enhanced Risk Assessment
enhancedRiskRoutes.post('/api/risk-assessment', async (c) => {
  const user = c.get('user')
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const { env } = c
    const body = await c.req.json()
    
    const {
      name, description, assessment_type = 'Comprehensive',
      threat_source_id, threat_event_id, vulnerability_id, primary_asset_id,
      threat_likelihood, vulnerability_severity, asset_criticality, control_effectiveness,
      treatment_strategy, treatment_plan
    } = body

    // Calculate risk scores
    const inherentRisk = threat_likelihood * vulnerability_severity * asset_criticality
    const residualRisk = control_effectiveness > 0 ? inherentRisk / control_effectiveness : inherentRisk
    
    // Determine risk level
    let riskLevel = 'Very Low'
    if (residualRisk > 20) riskLevel = 'Very High'
    else if (residualRisk > 15) riskLevel = 'High'
    else if (residualRisk > 10) riskLevel = 'Medium'
    else if (residualRisk > 5) riskLevel = 'Low'

    const result = await env.DB.prepare(`
      INSERT INTO risk_assessments_enhanced (
        name, description, assessment_type,
        threat_source_id, threat_event_id, vulnerability_id, primary_asset_id,
        threat_likelihood, vulnerability_severity, asset_criticality, control_effectiveness,
        inherent_risk_score, residual_risk_score, risk_level,
        treatment_strategy, treatment_plan,
        assessor_id, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      name, description, assessment_type,
      threat_source_id, threat_event_id, vulnerability_id, primary_asset_id,
      threat_likelihood, vulnerability_severity, asset_criticality, control_effectiveness,
      inherentRisk, residualRisk, riskLevel,
      treatment_strategy, treatment_plan,
      user.id, user.id
    ).run()

    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id,
        inherent_risk_score: inherentRisk,
        residual_risk_score: residualRisk,
        risk_level: riskLevel
      }
    })
  } catch (error) {
    console.error('Error creating risk assessment:', error)
    return c.json({ 
      error: 'Failed to create risk assessment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// API: Risk Statistics for Dashboard
enhancedRiskRoutes.get('/api/risk-stats', async (c) => {
  const user = c.get('user')
  
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  try {
    const { env } = c
    
    // Get threat source count
    const threatSources = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM threat_sources WHERE active_status = TRUE
    `).first()

    // Get vulnerability count
    const vulnerabilities = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM vulnerabilities_enhanced 
      WHERE active_status = TRUE AND remediation_status != 'Remediated'
    `).first()

    // Get critical asset count
    const criticalAssets = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM assets_enhanced 
      WHERE active_status = TRUE AND criticality IN ('High', 'Critical')
    `).first()

    // Get active control count
    const activeControls = await env.DB.prepare(`
      SELECT COUNT(*) as count FROM controls_enhanced 
      WHERE active_status = TRUE AND implementation_status = 'Implemented'
    `).first()

    // Get top risks
    const topRisks = await env.DB.prepare(`
      SELECT 
        ra.name, ra.risk_level, ra.residual_risk_score,
        ts.name as threat_source, te.name as threat_event
      FROM risk_assessments_enhanced ra
      LEFT JOIN threat_sources ts ON ra.threat_source_id = ts.id
      LEFT JOIN threat_events te ON ra.threat_event_id = te.id
      WHERE ra.active_status = TRUE
      ORDER BY ra.residual_risk_score DESC
      LIMIT 5
    `).all()

    return c.json({
      success: true,
      data: {
        threat_sources: threatSources?.count || 0,
        vulnerabilities: vulnerabilities?.count || 0,
        critical_assets: criticalAssets?.count || 0,
        active_controls: activeControls?.count || 0,
        top_risks: topRisks.results || []
      }
    })
  } catch (error) {
    console.error('Error fetching risk statistics:', error)
    return c.json({ 
      error: 'Failed to fetch risk statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export { enhancedRiskRoutes }