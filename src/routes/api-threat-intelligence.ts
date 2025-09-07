import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { ThreatIntelligenceService } from '../services/threat-intelligence';
import { EnhancedThreatIntelligenceService } from '../services/enhanced-threat-intelligence';

const apiThreatIntelRoutes = new Hono();

// Apply authentication middleware to all routes
apiThreatIntelRoutes.use('*', requireAuth);

// Initialize services
const threatIntelService = new ThreatIntelligenceService();
const enhancedThreatIntelService = new EnhancedThreatIntelligenceService();

// Threat Intelligence Overview API
apiThreatIntelRoutes.get('/overview', requirePermission('threat_intel:view'), async (c) => {
  try {
    const overview = await threatIntelService.getThreatIntelligenceOverview();
    return c.json(overview);
  } catch (error) {
    console.error('Error getting threat intelligence overview:', error);
    return c.json({ error: 'Failed to get threat intelligence overview' }, 500);
  }
});

// IOC Management API
apiThreatIntelRoutes.get('/iocs', requirePermission('threat_intel:view'), async (c) => {
  try {
    const iocs = await threatIntelService.getAllIOCs();
    return c.json(iocs);
  } catch (error) {
    console.error('Error getting IOCs:', error);
    return c.json({ error: 'Failed to get IOCs' }, 500);
  }
});

apiThreatIntelRoutes.post('/iocs', requirePermission('threat_intel:create'), async (c) => {
  try {
    const iocData = await c.req.json();
    const userEmail = getCookie(c, 'user_email') || '';
    
    // Validate required fields
    const requiredFields = ['type', 'value', 'threat_type'];
    for (const field of requiredFields) {
      if (!iocData[field]) {
        return c.json({ error: `Missing required field: ${field}` }, 400);
      }
    }

    const ioc = await threatIntelService.createIOC(iocData, userEmail);
    return c.json(ioc);
  } catch (error) {
    console.error('Error creating IOC:', error);
    return c.json({ error: 'Failed to create IOC' }, 500);
  }
});

apiThreatIntelRoutes.get('/iocs/:id', requirePermission('threat_intel:view'), async (c) => {
  try {
    const id = c.req.param('id');
    const ioc = await threatIntelService.getIOCById(id);
    
    if (!ioc) {
      return c.json({ error: 'IOC not found' }, 404);
    }
    
    return c.json(ioc);
  } catch (error) {
    console.error('Error getting IOC:', error);
    return c.json({ error: 'Failed to get IOC' }, 500);
  }
});

apiThreatIntelRoutes.patch('/iocs/:id/status', requirePermission('threat_intel:manage'), async (c) => {
  try {
    const id = c.req.param('id');
    const { status } = await c.req.json();
    const userEmail = getCookie(c, 'user_email') || '';
    
    const result = await threatIntelService.updateIOCStatus(id, status, userEmail);
    return c.json(result);
  } catch (error) {
    console.error('Error updating IOC status:', error);
    return c.json({ error: 'Failed to update IOC status' }, 500);
  }
});

// Threat Correlations API
apiThreatIntelRoutes.get('/correlations', requirePermission('threat_intel:view'), async (c) => {
  try {
    const indicatorId = c.req.query('indicator');
    const correlations = await threatIntelService.analyzeCorrelations(indicatorId);
    return c.json(correlations);
  } catch (error) {
    console.error('Error getting correlations:', error);
    return c.json({ error: 'Failed to get correlations' }, 500);
  }
});

apiThreatIntelRoutes.post('/correlations/analyze', requirePermission('threat_intel:create'), async (c) => {
  try {
    const userEmail = getCookie(c, 'user_email') || '';
    const result = await threatIntelService.runCorrelationAnalysis(userEmail);
    return c.json(result);
  } catch (error) {
    console.error('Error running correlation analysis:', error);
    return c.json({ error: 'Failed to run correlation analysis' }, 500);
  }
});

apiThreatIntelRoutes.get('/correlations/:id', requirePermission('threat_intel:view'), async (c) => {
  try {
    const id = c.req.param('id');
    const correlation = await threatIntelService.getCorrelationById(id);
    
    if (!correlation) {
      return c.json({ error: 'Correlation not found' }, 404);
    }
    
    return c.json(correlation);
  } catch (error) {
    console.error('Error getting correlation:', error);
    return c.json({ error: 'Failed to get correlation' }, 500);
  }
});

// Threat Hunting API
apiThreatIntelRoutes.get('/hunting/queries', requirePermission('threat_intel:view'), async (c) => {
  try {
    const queries = await threatIntelService.getThreatHuntingQueries();
    return c.json(queries);
  } catch (error) {
    console.error('Error getting hunting queries:', error);
    return c.json({ error: 'Failed to get hunting queries' }, 500);
  }
});

apiThreatIntelRoutes.post('/hunting/validate', requirePermission('threat_intel:view'), async (c) => {
  try {
    const { query } = await c.req.json();
    const validation = await threatIntelService.validateHuntingQuery(query);
    return c.json(validation);
  } catch (error) {
    console.error('Error validating hunting query:', error);
    return c.json({ error: 'Failed to validate hunting query' }, 500);
  }
});

apiThreatIntelRoutes.post('/hunting/preview', requirePermission('threat_intel:view'), async (c) => {
  try {
    const { query, limit = 10 } = await c.req.json();
    const results = await threatIntelService.previewHuntingQuery(query, limit);
    return c.json(results);
  } catch (error) {
    console.error('Error previewing hunting query:', error);
    return c.json({ error: 'Failed to preview hunting query' }, 500);
  }
});

apiThreatIntelRoutes.post('/hunting/execute', requirePermission('threat_intel:create'), async (c) => {
  try {
    const huntData = await c.req.json();
    const userEmail = getCookie(c, 'user_email') || '';
    
    // Validate required fields
    if (!huntData.query) {
      return c.json({ error: 'Missing required field: query' }, 400);
    }

    const results = await threatIntelService.executeHuntingQuery(huntData, userEmail);
    return c.json(results);
  } catch (error) {
    console.error('Error executing hunting query:', error);
    return c.json({ error: 'Failed to execute hunting query' }, 500);
  }
});

apiThreatIntelRoutes.get('/hunting/saved', requirePermission('threat_intel:view'), async (c) => {
  try {
    const userEmail = getCookie(c, 'user_email') || '';
    const queries = await threatIntelService.getSavedHuntingQueries(userEmail);
    return c.json(queries);
  } catch (error) {
    console.error('Error getting saved hunting queries:', error);
    return c.json({ error: 'Failed to get saved hunting queries' }, 500);
  }
});

// Threat Activity API
apiThreatIntelRoutes.get('/activity/recent', requirePermission('threat_intel:view'), async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '20');
    const activity = await threatIntelService.getRecentThreatActivity(limit);
    return c.json(activity);
  } catch (error) {
    console.error('Error getting recent threat activity:', error);
    return c.json({ error: 'Failed to get recent threat activity' }, 500);
  }
});

apiThreatIntelRoutes.get('/activity/timeline', requirePermission('threat_intel:view'), async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '7');
    const timeline = await threatIntelService.getThreatActivityTimeline(days);
    return c.json(timeline);
  } catch (error) {
    console.error('Error getting threat activity timeline:', error);
    return c.json({ error: 'Failed to get threat activity timeline' }, 500);
  }
});

// Threat Analysis API
apiThreatIntelRoutes.get('/analysis', requirePermission('threat_intel:view'), async (c) => {
  try {
    const analysis = await threatIntelService.getThreatAnalysis();
    return c.json(analysis);
  } catch (error) {
    console.error('Error getting threat analysis:', error);
    return c.json({ error: 'Failed to get threat analysis' }, 500);
  }
});

apiThreatIntelRoutes.get('/analysis/:threatId', requirePermission('threat_intel:view'), async (c) => {
  try {
    const threatId = c.req.param('threatId');
    const analysis = await threatIntelService.getThreatAnalysisById(threatId);
    
    if (!analysis) {
      return c.json({ error: 'Threat analysis not found' }, 404);
    }
    
    return c.json(analysis);
  } catch (error) {
    console.error('Error getting threat analysis:', error);
    return c.json({ error: 'Failed to get threat analysis' }, 500);
  }
});

// Intel Feeds API
apiThreatIntelRoutes.get('/feeds', requirePermission('threat_intel:view'), async (c) => {
  try {
    const feeds = await threatIntelService.getIntelligenceFeeds();
    return c.json(feeds);
  } catch (error) {
    console.error('Error getting intelligence feeds:', error);
    return c.json({ error: 'Failed to get intelligence feeds' }, 500);
  }
});

apiThreatIntelRoutes.post('/feeds/:feedId/sync', requirePermission('threat_intel:manage'), async (c) => {
  try {
    const feedId = c.req.param('feedId');
    const userEmail = getCookie(c, 'user_email') || '';
    
    const result = await threatIntelService.syncIntelligenceFeed(feedId, userEmail);
    return c.json(result);
  } catch (error) {
    console.error('Error syncing intelligence feed:', error);
    return c.json({ error: 'Failed to sync intelligence feed' }, 500);
  }
});

// Threat Context API
apiThreatIntelRoutes.get('/context/:indicator', requirePermission('threat_intel:view'), async (c) => {
  try {
    const indicator = c.req.param('indicator');
    const context = await threatIntelService.getThreatContext(indicator);
    return c.json(context);
  } catch (error) {
    console.error('Error getting threat context:', error);
    return c.json({ error: 'Failed to get threat context' }, 500);
  }
});

// IOC Enrichment API
apiThreatIntelRoutes.post('/iocs/:id/enrich', requirePermission('threat_intel:manage'), async (c) => {
  try {
    const id = c.req.param('id');
    const userEmail = getCookie(c, 'user_email') || '';
    
    const result = await threatIntelService.enrichIOC(id, userEmail);
    return c.json(result);
  } catch (error) {
    console.error('Error enriching IOC:', error);
    return c.json({ error: 'Failed to enrich IOC' }, 500);
  }
});

// Threat Actor Profiling API
apiThreatIntelRoutes.get('/actors', requirePermission('threat_intel:view'), async (c) => {
  try {
    const actors = await threatIntelService.getThreatActors();
    return c.json(actors);
  } catch (error) {
    console.error('Error getting threat actors:', error);
    return c.json({ error: 'Failed to get threat actors' }, 500);
  }
});

apiThreatIntelRoutes.get('/actors/:actorId', requirePermission('threat_intel:view'), async (c) => {
  try {
    const actorId = c.req.param('actorId');
    const actor = await threatIntelService.getThreatActorById(actorId);
    
    if (!actor) {
      return c.json({ error: 'Threat actor not found' }, 404);
    }
    
    return c.json(actor);
  } catch (error) {
    console.error('Error getting threat actor:', error);
    return c.json({ error: 'Failed to get threat actor' }, 500);
  }
});

// Threat Campaign Tracking API
apiThreatIntelRoutes.get('/campaigns', requirePermission('threat_intel:view'), async (c) => {
  try {
    const campaigns = await threatIntelService.getThreatCampaigns();
    return c.json(campaigns);
  } catch (error) {
    console.error('Error getting threat campaigns:', error);
    return c.json({ error: 'Failed to get threat campaigns' }, 500);
  }
});

apiThreatIntelRoutes.get('/campaigns/:campaignId', requirePermission('threat_intel:view'), async (c) => {
  try {
    const campaignId = c.req.param('campaignId');
    const campaign = await threatIntelService.getThreatCampaignById(campaignId);
    
    if (!campaign) {
      return c.json({ error: 'Threat campaign not found' }, 404);
    }
    
    return c.json(campaign);
  } catch (error) {
    console.error('Error getting threat campaign:', error);
    return c.json({ error: 'Failed to get threat campaign' }, 500);
  }
});

// ========================================
// TI-GRC INTEGRATION API ENDPOINTS (Phase 1 Enhancement)
// ========================================

// Process IOCs for Dynamic Risk Creation
apiThreatIntelRoutes.post('/process-risks', requirePermission('threat_intel:manage'), async (c) => {
  try {
    const userEmail = getCookie(c, 'user_email') || '';
    const { force_reprocessing = false } = await c.req.json().catch(() => ({}));
    
    const result = await enhancedThreatIntelService.processIOCsForRiskCreation(force_reprocessing);
    
    // Log the processing activity
    console.log(`TI Risk Processing initiated by ${userEmail}:`, {
      processed_iocs: result.processed_iocs,
      risks_created: result.risks_created,
      success_rate: result.success_rate,
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
apiThreatIntelRoutes.get('/dynamic-risks', requirePermission('threat_intel:view'), async (c) => {
  try {
    const filters = {
      state: c.req.query('state') as any,
      confidence_min: c.req.query('confidence_min') ? parseFloat(c.req.query('confidence_min')!) : undefined,
      created_after: c.req.query('created_after'),
      limit: c.req.query('limit') ? parseInt(c.req.query('limit')!) : 50,
      offset: c.req.query('offset') ? parseInt(c.req.query('offset')!) : 0
    };

    const risks = await enhancedThreatIntelService.getTIDynamicRisks(filters);
    
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
apiThreatIntelRoutes.get('/pipeline-stats', requirePermission('threat_intel:view'), async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '7');
    const stats = await enhancedThreatIntelService.getTIPipelineStats(days);
    
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

// Update Risk State in TI Lifecycle
apiThreatIntelRoutes.patch('/dynamic-risks/:riskId/state', requirePermission('threat_intel:manage'), async (c) => {
  try {
    const riskId = parseInt(c.req.param('riskId'));
    const { new_state, reason, confidence_override } = await c.req.json();
    const userEmail = getCookie(c, 'user_email') || '';
    
    // Validate the new state
    const validStates = ['detected', 'draft', 'validated', 'active', 'retired'];
    if (!validStates.includes(new_state)) {
      return c.json({ 
        success: false, 
        error: 'Invalid state. Must be one of: ' + validStates.join(', ')
      }, 400);
    }
    
    const result = await enhancedThreatIntelService.updateRiskLifecycleState(
      riskId, 
      new_state, 
      reason || `State updated by ${userEmail}`,
      false, // not automated
      confidence_override
    );
    
    return c.json({
      success: true,
      message: `Risk ${riskId} state updated to ${new_state}`,
      data: result
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

// Get Risk Creation Rules
apiThreatIntelRoutes.get('/risk-creation-rules', requirePermission('threat_intel:view'), async (c) => {
  try {
    const rules = await enhancedThreatIntelService.getRiskCreationRules();
    
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

// Create or Update Risk Creation Rule
apiThreatIntelRoutes.post('/risk-creation-rules', requirePermission('threat_intel:manage'), async (c) => {
  try {
    const ruleData = await c.req.json();
    const userEmail = getCookie(c, 'user_email') || '';
    
    // Validate required fields
    const requiredFields = ['rule_name', 'conditions', 'confidence_threshold', 'target_category'];
    for (const field of requiredFields) {
      if (!ruleData[field]) {
        return c.json({ 
          success: false, 
          error: `Missing required field: ${field}` 
        }, 400);
      }
    }
    
    const result = await enhancedThreatIntelService.createRiskCreationRule(ruleData);
    
    console.log(`Risk creation rule created by ${userEmail}:`, {
      rule_id: result.id,
      rule_name: ruleData.rule_name,
      enabled: ruleData.enabled
    });
    
    return c.json({
      success: true,
      message: `Risk creation rule '${ruleData.rule_name}' created successfully`,
      data: result
    });
  } catch (error) {
    console.error('Error creating risk creation rule:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to create risk creation rule',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Toggle Risk Creation Rule Status
apiThreatIntelRoutes.patch('/risk-creation-rules/:ruleId/toggle', requirePermission('threat_intel:manage'), async (c) => {
  try {
    const ruleId = parseInt(c.req.param('ruleId'));
    const { enabled } = await c.req.json();
    const userEmail = getCookie(c, 'user_email') || '';
    
    const result = await enhancedThreatIntelService.toggleRiskCreationRule(ruleId, enabled);
    
    console.log(`Risk creation rule ${enabled ? 'enabled' : 'disabled'} by ${userEmail}:`, {
      rule_id: ruleId
    });
    
    return c.json({
      success: true,
      message: `Risk creation rule ${enabled ? 'enabled' : 'disabled'} successfully`,
      data: result
    });
  } catch (error) {
    console.error('Error toggling risk creation rule:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to toggle risk creation rule',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get TI Processing Logs
apiThreatIntelRoutes.get('/processing-logs', requirePermission('threat_intel:view'), async (c) => {
  try {
    const filters = {
      level: c.req.query('level') as any,
      component: c.req.query('component'),
      limit: parseInt(c.req.query('limit') || '100'),
      offset: parseInt(c.req.query('offset') || '0')
    };
    
    const logs = await enhancedThreatIntelService.getTIProcessingLogs(filters);
    
    return c.json({
      success: true,
      data: logs,
      pagination: {
        limit: filters.limit,
        offset: filters.offset
      }
    });
  } catch (error) {
    console.error('Error getting TI processing logs:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to get TI processing logs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Enrich Risk with Additional TI Data
apiThreatIntelRoutes.post('/dynamic-risks/:riskId/enrich', requirePermission('threat_intel:manage'), async (c) => {
  try {
    const riskId = parseInt(c.req.param('riskId'));
    const userEmail = getCookie(c, 'user_email') || '';
    
    const result = await enhancedThreatIntelService.enrichRiskWithTIData(riskId);
    
    console.log(`Risk enrichment initiated by ${userEmail}:`, {
      risk_id: riskId,
      enrichment_success: result.success,
      sources_found: result.sources_found
    });
    
    return c.json({
      success: true,
      message: `Risk ${riskId} enriched with additional TI data`,
      data: result
    });
  } catch (error) {
    console.error('Error enriching risk with TI data:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to enrich risk with TI data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Get TI-Generated Risk Summary
apiThreatIntelRoutes.get('/risk-summary', requirePermission('threat_intel:view'), async (c) => {
  try {
    const period = c.req.query('period') || '30'; // days
    const summary = await enhancedThreatIntelService.getTIRiskSummary(parseInt(period));
    
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

// ========================================
// PHASE 1: TI-GRC INTEGRATION ENDPOINTS
// ========================================

// TI Risk Processing API - Core TI-GRC Integration
apiThreatIntelRoutes.post('/process-risks', requirePermission('threat_intel:manage'), async (c) => {
  try {
    const userEmail = getCookie(c, 'user_email') || '';
    const options = await c.req.json().catch(() => ({}));
    
    const result = await enhancedThreatIntelService.processIOCsForRiskCreation(options);
    
    // Log the processing activity
    console.log(`TI Risk Processing initiated by ${userEmail}:`, {
      processed_iocs: result.processed_iocs,
      risks_created: result.risks_created,
      processing_time: result.processing_time_ms
    });
    
    return c.json(result);
  } catch (error) {
    console.error('Error in TI risk processing:', error);
    return c.json({ 
      error: 'Failed to process IOCs for risk creation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Dynamic Risks API - Get TI-created risks with enhanced filtering
apiThreatIntelRoutes.get('/dynamic-risks', requirePermission('threat_intel:view'), async (c) => {
  try {
    const state = c.req.query('state'); // detected, draft, validated, active, retired
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');
    const confidenceThreshold = parseFloat(c.req.query('confidence_threshold') || '0');
    
    const filters = {
      state,
      limit,
      offset,
      confidenceThreshold
    };
    
    const result = await enhancedThreatIntelService.getTIDynamicRisks(filters);
    return c.json(result);
  } catch (error) {
    console.error('Error getting dynamic risks:', error);
    return c.json({ error: 'Failed to get dynamic risks' }, 500);
  }
});

// TI Pipeline Statistics API - Monitoring and analytics
apiThreatIntelRoutes.get('/pipeline-stats', requirePermission('threat_intel:view'), async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '7');
    const includeDetails = c.req.query('details') === 'true';
    
    const stats = await enhancedThreatIntelService.getTIPipelineStats({
      timeframe_days: days,
      include_breakdown: includeDetails
    });
    
    return c.json(stats);
  } catch (error) {
    console.error('Error getting TI pipeline stats:', error);
    return c.json({ error: 'Failed to get TI pipeline statistics' }, 500);
  }
});

// Risk Creation Rules Management API
apiThreatIntelRoutes.get('/risk-creation-rules', requirePermission('threat_intel:view'), async (c) => {
  try {
    const rules = await enhancedThreatIntelService.getRiskCreationRules();
    return c.json(rules);
  } catch (error) {
    console.error('Error getting risk creation rules:', error);
    return c.json({ error: 'Failed to get risk creation rules' }, 500);
  }
});

apiThreatIntelRoutes.post('/risk-creation-rules', requirePermission('threat_intel:manage'), async (c) => {
  try {
    const ruleData = await c.req.json();
    const userEmail = getCookie(c, 'user_email') || '';
    
    // Validate required fields
    const requiredFields = ['rule_name', 'conditions', 'confidence_threshold', 'target_category'];
    for (const field of requiredFields) {
      if (!ruleData[field]) {
        return c.json({ error: `Missing required field: ${field}` }, 400);
      }
    }
    
    const rule = await enhancedThreatIntelService.createRiskCreationRule(ruleData, userEmail);
    return c.json(rule);
  } catch (error) {
    console.error('Error creating risk creation rule:', error);
    return c.json({ error: 'Failed to create risk creation rule' }, 500);
  }
});

apiThreatIntelRoutes.patch('/risk-creation-rules/:id', requirePermission('threat_intel:manage'), async (c) => {
  try {
    const ruleId = c.req.param('id');
    const updates = await c.req.json();
    const userEmail = getCookie(c, 'user_email') || '';
    
    const rule = await enhancedThreatIntelService.updateRiskCreationRule(ruleId, updates, userEmail);
    return c.json(rule);
  } catch (error) {
    console.error('Error updating risk creation rule:', error);
    return c.json({ error: 'Failed to update risk creation rule' }, 500);
  }
});

// Risk State Management API - Dynamic risk lifecycle
apiThreatIntelRoutes.patch('/dynamic-risks/:id/state', requirePermission('risk:manage'), async (c) => {
  try {
    const riskId = c.req.param('id');
    const { new_state, reason } = await c.req.json();
    const userEmail = getCookie(c, 'user_email') || '';
    
    // Validate state transition
    const validStates = ['detected', 'draft', 'validated', 'active', 'retired'];
    if (!validStates.includes(new_state)) {
      return c.json({ error: 'Invalid risk state' }, 400);
    }
    
    const result = await enhancedThreatIntelService.updateRiskState(riskId, new_state, reason, userEmail);
    return c.json(result);
  } catch (error) {
    console.error('Error updating risk state:', error);
    return c.json({ error: 'Failed to update risk state' }, 500);
  }
});

// IOC-Risk Linkage API - View IOC to risk relationships
apiThreatIntelRoutes.get('/iocs/:id/risks', requirePermission('threat_intel:view'), async (c) => {
  try {
    const iocId = c.req.param('id');
    const risks = await enhancedThreatIntelService.getIOCLinkedRisks(iocId);
    return c.json(risks);
  } catch (error) {
    console.error('Error getting IOC linked risks:', error);
    return c.json({ error: 'Failed to get IOC linked risks' }, 500);
  }
});

// TI Processing Logs API - Audit and troubleshooting
apiThreatIntelRoutes.get('/processing-logs', requirePermission('threat_intel:view'), async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '100');
    const logLevel = c.req.query('level'); // info, warning, error
    const since = c.req.query('since'); // ISO datetime
    
    const filters = {
      limit,
      log_level: logLevel,
      since_timestamp: since
    };
    
    const logs = await enhancedThreatIntelService.getTIProcessingLogs(filters);
    return c.json(logs);
  } catch (error) {
    console.error('Error getting TI processing logs:', error);
    return c.json({ error: 'Failed to get TI processing logs' }, 500);
  }
});

// Batch IOC Risk Processing API - For handling multiple IOCs
apiThreatIntelRoutes.post('/batch-process-risks', requirePermission('threat_intel:manage'), async (c) => {
  try {
    const { ioc_ids, processing_options = {} } = await c.req.json();
    const userEmail = getCookie(c, 'user_email') || '';
    
    if (!Array.isArray(ioc_ids) || ioc_ids.length === 0) {
      return c.json({ error: 'Missing or empty ioc_ids array' }, 400);
    }
    
    const result = await enhancedThreatIntelService.batchProcessIOCsForRisks(ioc_ids, processing_options);
    
    console.log(`Batch TI Risk Processing by ${userEmail}:`, {
      input_iocs: ioc_ids.length,
      processed_iocs: result.processed_iocs,
      risks_created: result.risks_created
    });
    
    return c.json(result);
  } catch (error) {
    console.error('Error in batch TI risk processing:', error);
    return c.json({ error: 'Failed to batch process IOCs for risks' }, 500);
  }
});

// TI Enhancement Status API - Monitor Phase 1 implementation status
apiThreatIntelRoutes.get('/enhancement-status', requirePermission('threat_intel:view'), async (c) => {
  try {
    const status = await enhancedThreatIntelService.getTIEnhancementStatus();
    return c.json(status);
  } catch (error) {
    console.error('Error getting TI enhancement status:', error);
    return c.json({ error: 'Failed to get TI enhancement status' }, 500);
  }
});

export { apiThreatIntelRoutes };