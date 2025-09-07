/**
 * TI-GRC Integration API Routes
 * 
 * Phase 1: Enhanced Threat Intelligence API endpoints for GRC integration
 * Focuses specifically on TI-risk integration functionality
 */

import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { EnhancedThreatIntelligenceService } from '../services/enhanced-threat-intelligence';

const tiGrcRoutes = new Hono();

// Apply authentication middleware to all routes
tiGrcRoutes.use('*', requireAuth);

// ========================================
// TI-GRC INTEGRATION API ENDPOINTS 
// ========================================

// Process IOCs for Dynamic Risk Creation
tiGrcRoutes.post('/process-risks', requirePermission('threat_intel:manage'), async (c) => {
  try {
    // Get database from context bindings
    const { DB } = c.env as { DB: any };
    const enhancedService = new EnhancedThreatIntelligenceService(DB);
    
    const userEmail = getCookie(c, 'user_email') || '';
    const { force_reprocessing = false } = await c.req.json().catch(() => ({}));
    
    const result = await enhancedService.processIOCsForRiskCreation(force_reprocessing);
    
    // Log the processing activity
    console.log(`TI Risk Processing initiated by ${userEmail}:`, {
      processed_iocs: result.processed_iocs,
      risks_created: result.risks_created,
      force_reprocessing
    });
    
    return c.json({
      success: true,
      message: `Processed ${result.processed_iocs} IOCs, created ${result.risks_created} new risks`,
      data: result
    });
  } catch (error) {
    console.error('Error processing IOCs for risk creation:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to process IOCs for risk creation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get Dynamic Risks from TI Sources
tiGrcRoutes.get('/dynamic-risks', requirePermission('threat_intel:view'), async (c) => {
  try {
    const { DB } = c.env as { DB: any };
    const enhancedService = new EnhancedThreatIntelligenceService(DB);
    
    const filters = {
      state: c.req.query('state') as any,
      confidence_min: c.req.query('confidence_min') ? parseFloat(c.req.query('confidence_min')!) : undefined,
      created_after: c.req.query('created_after'),
      limit: c.req.query('limit') ? parseInt(c.req.query('limit')!) : 50,
      offset: c.req.query('offset') ? parseInt(c.req.query('offset')!) : 0
    };

    const risks = await enhancedService.getTIDynamicRisks(filters);
    
    return c.json({
      success: true,
      data: risks,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: risks.length
      }
    });
  } catch (error) {
    console.error('Error getting TI dynamic risks:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to get TI dynamic risks',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get TI Processing Pipeline Statistics
tiGrcRoutes.get('/pipeline-stats', requirePermission('threat_intel:view'), async (c) => {
  try {
    const { DB } = c.env as { DB: any };
    const enhancedService = new EnhancedThreatIntelligenceService(DB);
    
    const days = parseInt(c.req.query('days') || '7');
    const stats = await enhancedService.getTIPipelineStats(days);
    
    return c.json({
      success: true,
      data: stats,
      period: {
        days: days,
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting TI pipeline stats:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to get TI pipeline statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Update Risk State in TI Lifecycle (Manual Transition)
tiGrcRoutes.patch('/dynamic-risks/:riskId/state', requirePermission('threat_intel:manage'), async (c) => {
  try {
    const { DB } = c.env as { DB: any };
    const enhancedService = new EnhancedThreatIntelligenceService(DB);
    
    const riskId = parseInt(c.req.param('riskId'));
    const { new_state, reason } = await c.req.json();
    const userEmail = getCookie(c, 'user_email') || '';
    
    // Validate the new state
    const validStates = ['detected', 'draft', 'validated', 'active', 'retired'];
    if (!validStates.includes(new_state)) {
      return c.json({ 
        success: false, 
        error: 'Invalid state. Must be one of: ' + validStates.join(', ')
      }, 400);
    }
    
    await enhancedService.transitionRiskState(
      riskId, 
      new_state, 
      reason || `State updated by ${userEmail}`
    );
    
    return c.json({
      success: true,
      message: `Risk ${riskId} state updated to ${new_state}`
    });
  } catch (error) {
    console.error('Error updating risk state:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to update risk state',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get Risk Creation Rules (Public Access)
tiGrcRoutes.get('/risk-creation-rules', requirePermission('threat_intel:view'), async (c) => {
  try {
    const { DB } = c.env as { DB: any };
    const enhancedService = new EnhancedThreatIntelligenceService(DB);
    
    const rules = await enhancedService.getRiskCreationRulesPublic();
    
    return c.json({
      success: true,
      data: rules,
      total: rules.length
    });
  } catch (error) {
    console.error('Error getting risk creation rules:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to get risk creation rules',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get TI-Generated Risk Summary
tiGrcRoutes.get('/risk-summary', requirePermission('threat_intel:view'), async (c) => {
  try {
    const { DB } = c.env as { DB: any };
    const enhancedService = new EnhancedThreatIntelligenceService(DB);
    
    const period = c.req.query('period') || '30'; // days
    const summary = await enhancedService.getTIRiskSummaryPublic(parseInt(period));
    
    return c.json({
      success: true,
      data: summary,
      period: {
        days: parseInt(period),
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting TI risk summary:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to get TI risk summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export { tiGrcRoutes };