import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { ThreatIntelligenceService } from '../services/threat-intelligence';

const apiThreatIntelRoutes = new Hono();

// Apply authentication middleware to all routes
apiThreatIntelRoutes.use('*', requireAuth);

// Initialize service
const threatIntelService = new ThreatIntelligenceService();

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

export { apiThreatIntelRoutes };