/**
 * AI-Enhanced Compliance API Routes for ARIA5
 * 
 * Provides REST API endpoints for:
 * - AI-powered control assessments
 * - Intelligent gap analysis
 * - Automated remediation planning
 * - Compliance maturity scoring
 * - Risk-compliance integration
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AIComplianceEngineService } from '../services/ai-compliance-engine';

const app = new Hono<{ Bindings: { DB: D1Database; AI: any } }>();

// Enable CORS for API endpoints
app.use('/api/ai-compliance/*', cors());

/**
 * POST /api/ai-compliance/assess-control
 * Perform AI-powered control assessment
 */
app.post('/assess-control', async (c) => {
  try {
    const { controlId, assessmentType, organizationContext, currentImplementation, riskProfile } = await c.req.json();

    if (!controlId || !assessmentType) {
      return c.json({ error: 'Missing required fields: controlId, assessmentType' }, 400);
    }

    const aiEngine = new AIComplianceEngineService(c.env.DB, 'cloudflare');
    
    const assessment = await aiEngine.assessControl({
      controlId,
      assessmentType,
      organizationContext,
      currentImplementation,
      riskProfile
    });

    return c.json({
      success: true,
      data: assessment,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('AI Control Assessment Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * POST /api/ai-compliance/gap-analysis
 * Perform comprehensive gap analysis for framework
 */
app.post('/gap-analysis', async (c) => {
  try {
    const { frameworkId, organizationContext } = await c.req.json();

    if (!frameworkId) {
      return c.json({ error: 'Missing required field: frameworkId' }, 400);
    }

    const aiEngine = new AIComplianceEngineService(c.env.DB, 'cloudflare');
    
    const gapAnalysis = await aiEngine.performGapAnalysis(frameworkId, organizationContext);

    return c.json({
      success: true,
      data: gapAnalysis,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Gap Analysis Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * GET /api/ai-compliance/maturity-score/:frameworkId
 * Calculate compliance maturity score
 */
app.get('/maturity-score/:frameworkId', async (c) => {
  try {
    const frameworkId = parseInt(c.req.param('frameworkId'));

    if (!frameworkId) {
      return c.json({ error: 'Invalid frameworkId' }, 400);
    }

    const aiEngine = new AIComplianceEngineService(c.env.DB, 'cloudflare');
    
    const maturityScore = await aiEngine.calculateMaturityScore(frameworkId);

    return c.json({
      success: true,
      data: maturityScore,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Maturity Score Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * POST /api/ai-compliance/remediation-plan
 * Generate AI-powered remediation plan
 */
app.post('/remediation-plan', async (c) => {
  try {
    const gapAnalysisData = await c.req.json();

    if (!gapAnalysisData.frameworkId) {
      return c.json({ error: 'Missing frameworkId in gap analysis data' }, 400);
    }

    const aiEngine = new AIComplianceEngineService(c.env.DB, 'cloudflare');
    
    const remediationPlan = await aiEngine.generateRemediationPlan(gapAnalysisData);

    return c.json({
      success: true,
      data: remediationPlan,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Remediation Plan Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * GET /api/ai-compliance/assessments/:controlId
 * Get AI assessment history for control
 */
app.get('/assessments/:controlId', async (c) => {
  try {
    const controlId = parseInt(c.req.param('controlId'));
    const limit = parseInt(c.req.query('limit') || '10');

    const assessments = await c.env.DB
      .prepare(`
        SELECT * FROM ai_compliance_assessments 
        WHERE control_id = ? AND status = 'active'
        ORDER BY created_at DESC 
        LIMIT ?
      `)
      .bind(controlId, limit)
      .all();

    return c.json({
      success: true,
      data: assessments.results || [],
      total: assessments.results?.length || 0
    });

  } catch (error) {
    console.error('Get Assessments Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * GET /api/ai-compliance/dashboard/:frameworkId
 * Get AI-enhanced compliance dashboard data
 */
app.get('/dashboard/:frameworkId', async (c) => {
  try {
    const frameworkId = parseInt(c.req.param('frameworkId'));

    // Get framework details
    const framework = await c.env.DB
      .prepare('SELECT * FROM compliance_frameworks WHERE id = ?')
      .bind(frameworkId)
      .first();

    if (!framework) {
      return c.json({ error: 'Framework not found' }, 404);
    }

    // Get controls summary with AI assessments
    const controlsSummary = await c.env.DB
      .prepare(`
        SELECT 
          c.implementation_status,
          c.risk_level,
          COUNT(*) as count,
          AVG(ai.confidence_score) as avg_ai_confidence,
          COUNT(ai.id) as ai_assessments_count
        FROM compliance_controls c
        LEFT JOIN ai_compliance_assessments ai ON c.id = ai.control_id AND ai.status = 'active'
        WHERE c.framework_id = ?
        GROUP BY c.implementation_status, c.risk_level
      `)
      .bind(frameworkId)
      .all();

    // Get recent AI assessments
    const recentAssessments = await c.env.DB
      .prepare(`
        SELECT 
          ai.*, 
          c.control_id, 
          c.title as control_title
        FROM ai_compliance_assessments ai
        JOIN compliance_controls c ON ai.control_id = c.id
        WHERE c.framework_id = ? AND ai.status = 'active'
        ORDER BY ai.created_at DESC
        LIMIT 10
      `)
      .bind(frameworkId)
      .all();

    // Get maturity scores
    const maturityScores = await c.env.DB
      .prepare(`
        SELECT * FROM compliance_maturity_scores 
        WHERE framework_id = ?
        ORDER BY assessment_date DESC
        LIMIT 5
      `)
      .bind(frameworkId)
      .all();

    // Get critical gaps (from AI assessments)
    const criticalGaps = await c.env.DB
      .prepare(`
        SELECT 
          ai.assessment_data,
          c.control_id,
          c.title as control_title,
          c.risk_level
        FROM ai_compliance_assessments ai
        JOIN compliance_controls c ON ai.control_id = c.id
        WHERE c.framework_id = ? AND ai.assessment_type = 'gap_analysis' AND ai.status = 'active'
        ORDER BY c.risk_level DESC, ai.priority_score DESC
        LIMIT 15
      `)
      .bind(frameworkId)
      .all();

    const dashboard = {
      framework: framework,
      controlsSummary: controlsSummary.results || [],
      recentAssessments: recentAssessments.results || [],
      maturityScores: maturityScores.results || [],
      criticalGaps: criticalGaps.results || [],
      aiMetrics: {
        totalAssessments: recentAssessments.results?.length || 0,
        averageConfidence: this.calculateAverageConfidence(recentAssessments.results || []),
        assessmentCoverage: this.calculateAssessmentCoverage(controlsSummary.results || [])
      }
    };

    return c.json({
      success: true,
      data: dashboard,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * POST /api/ai-compliance/bulk-assess
 * Perform bulk AI assessment for multiple controls
 */
app.post('/bulk-assess', async (c) => {
  try {
    const { frameworkId, controlIds, assessmentType, organizationContext } = await c.req.json();

    if (!frameworkId || !controlIds || !Array.isArray(controlIds)) {
      return c.json({ error: 'Missing required fields: frameworkId, controlIds (array)' }, 400);
    }

    const aiEngine = new AIComplianceEngineService(c.env.DB, 'cloudflare');
    
    const assessmentPromises = controlIds.map(async (controlId: number) => {
      try {
        const assessment = await aiEngine.assessControl({
          controlId,
          assessmentType: assessmentType || 'gap_analysis',
          organizationContext
        });
        return { controlId, status: 'success', assessment };
      } catch (error) {
        return { controlId, status: 'error', error: error.message };
      }
    });

    const results = await Promise.all(assessmentPromises);

    const summary = {
      total: results.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length,
      results: results
    };

    return c.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Bulk Assessment Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * GET /api/ai-compliance/recommendations/:frameworkId
 * Get prioritized AI recommendations for framework
 */
app.get('/recommendations/:frameworkId', async (c) => {
  try {
    const frameworkId = parseInt(c.req.param('frameworkId'));
    const limit = parseInt(c.req.query('limit') || '20');

    const recommendations = await c.env.DB
      .prepare(`
        SELECT 
          ai.recommendations,
          ai.priority_score,
          c.control_id,
          c.title as control_title,
          c.risk_level,
          ai.created_at
        FROM ai_compliance_assessments ai
        JOIN compliance_controls c ON ai.control_id = c.id
        WHERE c.framework_id = ? AND ai.status = 'active' AND ai.recommendations IS NOT NULL
        ORDER BY ai.priority_score DESC, c.risk_level DESC
        LIMIT ?
      `)
      .bind(frameworkId, limit)
      .all();

    // Parse and aggregate recommendations
    const parsedRecommendations = (recommendations.results || []).flatMap(row => {
      try {
        const recs = JSON.parse(row.recommendations);
        return recs.map((rec: any) => ({
          ...rec,
          controlId: row.control_id,
          controlTitle: row.control_title,
          riskLevel: row.risk_level,
          assessmentDate: row.created_at
        }));
      } catch (error) {
        console.warn('Failed to parse recommendations:', error);
        return [];
      }
    });

    // Sort by priority and remove duplicates
    const uniqueRecommendations = parsedRecommendations
      .sort((a, b) => b.priority - a.priority)
      .slice(0, limit);

    return c.json({
      success: true,
      data: uniqueRecommendations,
      total: uniqueRecommendations.length
    });

  } catch (error) {
    console.error('Recommendations Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

// Helper functions
function calculateAverageConfidence(assessments: any[]): number {
  if (assessments.length === 0) return 0;
  const sum = assessments.reduce((acc, assessment) => acc + (assessment.confidence_score || 0), 0);
  return Math.round((sum / assessments.length) * 100) / 100;
}

function calculateAssessmentCoverage(controlsSummary: any[]): number {
  const totalControls = controlsSummary.reduce((acc, row) => acc + row.count, 0);
  const assessedControls = controlsSummary.reduce((acc, row) => acc + row.ai_assessments_count, 0);
  
  if (totalControls === 0) return 0;
  return Math.round((assessedControls / totalControls) * 100);
}

export default app;