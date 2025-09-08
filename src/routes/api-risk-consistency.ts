// ===============================================
// CONSISTENT RISK API ROUTES
// Ensures all risk data queries return consistent results
// regardless of database schema differences
// ===============================================

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { RiskDataConsistency } from '../lib/risk-data-consistency';

const app = new Hono();

// Apply CORS
app.use('*', cors());

/**
 * STANDARDIZED RISK SUMMARY ENDPOINT
 * Returns consistent risk counts regardless of database schema
 * Used by: Dashboard, Risk Register, AI Assistant, All Components
 */
app.get('/risks/summary', async (c) => {
  try {
    const riskData = new RiskDataConsistency(c.env.DB);
    const summary = await riskData.getRiskSummary();
    
    return c.json({
      success: true,
      data: summary,
      metadata: {
        source: 'risk_data_consistency_layer',
        calculation_method: 'COALESCE(risk_score, probability * impact)',
        thresholds: {
          critical: '≥ 20',
          high: '12-19', 
          medium: '6-11',
          low: '< 6'
        },
        timestamp: new Date().toISOString(),
        note: 'This endpoint ensures data consistency across all components'
      }
    });
  } catch (error) {
    console.error('Risk summary error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch risk summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET ALL RISKS WITH CALCULATED LEVELS
 * Returns risks with consistent risk level calculations
 */
app.get('/risks', async (c) => {
  try {
    const riskData = new RiskDataConsistency(c.env.DB);
    const risks = await riskData.getRisksWithLevels();
    
    return c.json({
      success: true,
      data: risks,
      count: risks.length,
      metadata: {
        calculation_method: 'Real-time level calculation based on risk_score',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Risks fetch error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch risks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET RISKS BY LEVEL
 * Returns risks filtered by specific risk level
 */
app.get('/risks/level/:level', async (c) => {
  try {
    const level = c.req.param('level');
    const validLevels = ['critical', 'high', 'medium', 'low'];
    
    if (!validLevels.includes(level)) {
      return c.json({
        success: false,
        error: 'Invalid risk level',
        valid_levels: validLevels
      }, 400);
    }

    const riskData = new RiskDataConsistency(c.env.DB);
    const risks = await riskData.getRisksByLevel(level);
    
    return c.json({
      success: true,
      data: risks,
      level: level,
      count: risks.length,
      metadata: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Risks by level error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch risks by level',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * DASHBOARD METRICS ENDPOINT
 * Consistent data for dashboard components
 */
app.get('/dashboard/metrics', async (c) => {
  try {
    const riskData = new RiskDataConsistency(c.env.DB);
    const metrics = await riskData.getDashboardMetrics();
    
    return c.json({
      success: true,
      data: metrics,
      metadata: {
        source: 'unified_consistency_layer',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Dashboard metrics error:', error);
    return c.json({
      success: false,
      error: 'Failed to fetch dashboard metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * DATA VALIDATION AND FIX ENDPOINT
 * Validates and fixes any inconsistent risk scores
 */
app.post('/risks/validate-fix', async (c) => {
  try {
    const riskData = new RiskDataConsistency(c.env.DB);
    const result = await riskData.validateAndFixRiskScores();
    
    return c.json({
      success: true,
      data: {
        total_risks_checked: result.total,
        risks_fixed: result.fixed,
        status: result.fixed > 0 ? 'Fixed inconsistencies' : 'All data consistent'
      },
      metadata: {
        timestamp: new Date().toISOString(),
        action: 'validate_and_fix'
      }
    });
  } catch (error) {
    console.error('Risk validation error:', error);
    return c.json({
      success: false,
      error: 'Failed to validate/fix risks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * HEALTH CHECK FOR RISK CONSISTENCY
 */
app.get('/health', async (c) => {
  try {
    const riskData = new RiskDataConsistency(c.env.DB);
    const summary = await riskData.getRiskSummary();
    
    return c.json({
      service: 'Risk Data Consistency Layer',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      sample_data: {
        total_risks: summary.total_risks,
        calculation_method: 'COALESCE(risk_score, probability * impact)',
        thresholds_applied: true
      },
      endpoints: [
        'GET /risks/summary - Standardized risk counts',
        'GET /risks - All risks with levels',
        'GET /risks/level/{level} - Risks by level',
        'GET /dashboard/metrics - Dashboard data',
        'POST /risks/validate-fix - Fix inconsistencies'
      ]
    });
  } catch (error) {
    return c.json({
      service: 'Risk Data Consistency Layer', 
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, 500);
  }
});

export default app;