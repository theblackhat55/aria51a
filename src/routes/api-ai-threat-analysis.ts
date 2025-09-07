/**
 * AI Threat Analysis API Routes - Phase 2 Implementation
 * 
 * RESTful API endpoints for AI-driven threat intelligence analysis:
 * - IOC AI analysis and enrichment
 * - Campaign intelligence and attribution
 * - Enhanced correlation analysis
 * - Intelligent risk scoring
 * - Business impact assessment
 * - Mitigation recommendations
 */

import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { AIThreatAnalysisService } from '../services/ai-threat-analysis';
import { EnhancedCorrelationEngine } from '../services/enhanced-correlation-engine';
import { IntelligentRiskScoringEngine } from '../services/intelligent-risk-scoring';

const aiThreatAnalysisRoutes = new Hono();

// Apply authentication middleware to all routes
aiThreatAnalysisRoutes.use('*', requireAuth);

// ========================================
// AI THREAT ANALYSIS API ENDPOINTS
// ========================================

// IOC AI Analysis Endpoints

/**
 * POST /api/ai-threat/analyze-ioc
 * Analyze a single IOC using AI models for enrichment and contextualization
 */
aiThreatAnalysisRoutes.post('/analyze-ioc', requirePermission('ai_threat:analyze'), async (c) => {
  try {
    const { DB, AI, OPENAI_API_KEY, ANTHROPIC_API_KEY } = c.env as any;
    const aiAnalysisService = new AIThreatAnalysisService(DB, c.env);
    
    const { ioc_id, ioc_type, ioc_value, analysis_depth = 'detailed' } = await c.req.json();
    
    // Validate required fields
    if (!ioc_id || !ioc_type || !ioc_value) {
      return c.json({
        success: false,
        error: 'Missing required fields: ioc_id, ioc_type, ioc_value'
      }, 400);
    }
    
    // Validate IOC type
    const validTypes = ['ip', 'domain', 'hash', 'url', 'email', 'file_path', 'registry_key'];
    if (!validTypes.includes(ioc_type)) {
      return c.json({
        success: false,
        error: `Invalid IOC type. Must be one of: ${validTypes.join(', ')}`
      }, 400);
    }
    
    const analysisRequest = {
      ioc_id,
      ioc_type,
      ioc_value,
      analysis_depth,
      existing_context: {}
    };
    
    const analysisResult = await aiAnalysisService.analyzeIOCWithAI(analysisRequest);
    
    return c.json({
      success: true,
      message: `AI analysis completed for IOC ${ioc_value}`,
      data: analysisResult
    });
    
  } catch (error) {
    console.error('Error in IOC AI analysis:', error);
    return c.json({
      success: false,
      error: 'Failed to analyze IOC with AI',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /api/ai-threat/ioc-analysis/:iocId
 * Get existing AI analysis results for an IOC
 */
aiThreatAnalysisRoutes.get('/ioc-analysis/:iocId', requirePermission('ai_threat:view'), async (c) => {
  try {
    const { DB } = c.env as any;
    const aiAnalysisService = new AIThreatAnalysisService(DB, c.env);
    
    const iocId = c.req.param('iocId');
    const analysisResults = await aiAnalysisService.getIOCAnalysisResults(iocId);
    
    return c.json({
      success: true,
      data: analysisResults,
      total: analysisResults.length
    });
    
  } catch (error) {
    console.error('Error getting IOC analysis results:', error);
    return c.json({
      success: false,
      error: 'Failed to get IOC analysis results',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /api/ai-threat/batch-analyze-iocs
 * Batch process multiple IOCs for AI analysis
 */
aiThreatAnalysisRoutes.post('/batch-analyze-iocs', requirePermission('ai_threat:analyze'), async (c) => {
  try {
    const { DB } = c.env as any;
    const aiAnalysisService = new AIThreatAnalysisService(DB, c.env);
    
    const { ioc_ids, analysis_depth = 'detailed' } = await c.req.json();
    
    if (!Array.isArray(ioc_ids) || ioc_ids.length === 0) {
      return c.json({
        success: false,
        error: 'ioc_ids must be a non-empty array'
      }, 400);
    }
    
    if (ioc_ids.length > 100) {
      return c.json({
        success: false,
        error: 'Maximum 100 IOCs allowed per batch request'
      }, 400);
    }
    
    const batchResult = await aiAnalysisService.batchProcessIOCsForAIAnalysis(ioc_ids);
    
    return c.json({
      success: true,
      message: `Batch AI analysis completed: ${batchResult.successful} successful, ${batchResult.failed} failed`,
      data: batchResult
    });
    
  } catch (error) {
    console.error('Error in batch IOC AI analysis:', error);
    return c.json({
      success: false,
      error: 'Failed to batch analyze IOCs with AI',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Campaign Analysis Endpoints

/**
 * POST /api/ai-threat/analyze-campaign
 * Perform AI-driven threat campaign analysis and attribution
 */
aiThreatAnalysisRoutes.post('/analyze-campaign', requirePermission('ai_threat:analyze'), async (c) => {
  try {
    const { DB } = c.env as any;
    const aiAnalysisService = new AIThreatAnalysisService(DB, c.env);
    
    const { ioc_ids, existing_campaign_data } = await c.req.json();
    
    if (!Array.isArray(ioc_ids) || ioc_ids.length === 0) {
      return c.json({
        success: false,
        error: 'ioc_ids must be a non-empty array'
      }, 400);
    }
    
    const campaignAnalysis = await aiAnalysisService.analyzeThreatCampaign(
      ioc_ids,
      existing_campaign_data
    );
    
    return c.json({
      success: true,
      message: `Campaign analysis completed: ${campaignAnalysis.campaign_name}`,
      data: campaignAnalysis
    });
    
  } catch (error) {
    console.error('Error in campaign analysis:', error);
    return c.json({
      success: false,
      error: 'Failed to analyze threat campaign',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /api/ai-threat/campaign-analysis/:campaignId
 * Get existing campaign analysis results
 */
aiThreatAnalysisRoutes.get('/campaign-analysis/:campaignId', requirePermission('ai_threat:view'), async (c) => {
  try {
    const campaignId = c.req.param('campaignId');
    
    // Implementation would retrieve campaign analysis from database
    return c.json({
      success: true,
      message: 'Campaign analysis retrieval - to be implemented',
      data: { campaign_id: campaignId }
    });
    
  } catch (error) {
    console.error('Error getting campaign analysis:', error);
    return c.json({
      success: false,
      error: 'Failed to get campaign analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Enhanced Correlation Analysis Endpoints

/**
 * POST /api/ai-threat/enhance-correlations
 * Perform advanced AI-enhanced correlation analysis
 */
aiThreatAnalysisRoutes.post('/enhance-correlations', requirePermission('ai_threat:analyze'), async (c) => {
  try {
    const { DB } = c.env as any;
    const aiAnalysisService = new AIThreatAnalysisService(DB, c.env);
    const correlationEngine = new EnhancedCorrelationEngine(DB, aiAnalysisService);
    
    const { ioc_ids, analysis_depth = 'detailed' } = await c.req.json();
    
    if (!Array.isArray(ioc_ids) || ioc_ids.length < 2) {
      return c.json({
        success: false,
        error: 'At least 2 IOC IDs required for correlation analysis'
      }, 400);
    }
    
    const correlationClusters = await correlationEngine.performAdvancedCorrelation(
      ioc_ids,
      analysis_depth
    );
    
    return c.json({
      success: true,
      message: `Enhanced correlation analysis completed: ${correlationClusters.length} clusters found`,
      data: {
        clusters: correlationClusters,
        total_clusters: correlationClusters.length
      }
    });
    
  } catch (error) {
    console.error('Error in enhanced correlation analysis:', error);
    return c.json({
      success: false,
      error: 'Failed to perform enhanced correlation analysis',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /api/ai-threat/correlations/advanced
 * Get advanced correlation results with optional filtering
 */
aiThreatAnalysisRoutes.get('/correlations/advanced', requirePermission('ai_threat:view'), async (c) => {
  try {
    const correlation_type = c.req.query('correlation_type');
    const min_confidence = c.req.query('min_confidence') ? parseFloat(c.req.query('min_confidence')!) : 0.5;
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 50;
    
    // Implementation would retrieve correlation results from database with filters
    return c.json({
      success: true,
      message: 'Advanced correlation retrieval - to be implemented',
      data: {
        filters: { correlation_type, min_confidence, limit },
        correlations: []
      }
    });
    
  } catch (error) {
    console.error('Error getting advanced correlations:', error);
    return c.json({
      success: false,
      error: 'Failed to get advanced correlations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Threat Attribution Endpoints

/**
 * POST /api/ai-threat/attribute-threat
 * Perform AI-driven threat actor attribution
 */
aiThreatAnalysisRoutes.post('/attribute-threat', requirePermission('ai_threat:analyze'), async (c) => {
  try {
    const { DB } = c.env as any;
    const aiAnalysisService = new AIThreatAnalysisService(DB, c.env);
    const correlationEngine = new EnhancedCorrelationEngine(DB, aiAnalysisService);
    
    const { correlation_cluster_ids } = await c.req.json();
    
    if (!Array.isArray(correlation_cluster_ids) || correlation_cluster_ids.length === 0) {
      return c.json({
        success: false,
        error: 'correlation_cluster_ids must be a non-empty array'
      }, 400);
    }
    
    // Get correlation clusters first (simplified for demo)
    const correlationClusters = []; // Would retrieve from database
    
    const attributions = await correlationEngine.attributeThreatActor(correlationClusters);
    
    return c.json({
      success: true,
      message: `Threat attribution completed for ${attributions.length} clusters`,
      data: attributions
    });
    
  } catch (error) {
    console.error('Error in threat attribution:', error);
    return c.json({
      success: false,
      error: 'Failed to perform threat attribution',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /api/ai-threat/attributions
 * Get threat actor attributions with confidence filtering
 */
aiThreatAnalysisRoutes.get('/attributions', requirePermission('ai_threat:view'), async (c) => {
  try {
    const min_confidence = c.req.query('min_confidence') ? parseFloat(c.req.query('min_confidence')!) : 0.6;
    const threat_actor = c.req.query('threat_actor');
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 50;
    
    // Implementation would retrieve attribution results from database
    return c.json({
      success: true,
      message: 'Threat attribution retrieval - to be implemented',
      data: {
        filters: { min_confidence, threat_actor, limit },
        attributions: []
      }
    });
    
  } catch (error) {
    console.error('Error getting threat attributions:', error);
    return c.json({
      success: false,
      error: 'Failed to get threat attributions',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Intelligent Risk Assessment Endpoints

/**
 * POST /api/ai-threat/assess-risk
 * Perform AI-driven contextual risk assessment
 */
aiThreatAnalysisRoutes.post('/assess-risk', requirePermission('ai_threat:analyze'), async (c) => {
  try {
    const { DB } = c.env as any;
    const aiAnalysisService = new AIThreatAnalysisService(DB, c.env);
    const riskScoringEngine = new IntelligentRiskScoringEngine(DB, aiAnalysisService);
    
    const { 
      risk_id, 
      threat_intelligence_context, 
      organizational_context 
    } = await c.req.json();
    
    if (!risk_id || !threat_intelligence_context || !organizational_context) {
      return c.json({
        success: false,
        error: 'Missing required fields: risk_id, threat_intelligence_context, organizational_context'
      }, 400);
    }
    
    const contextualRiskScore = await riskScoringEngine.calculateContextualRiskScore(
      risk_id,
      threat_intelligence_context,
      organizational_context
    );
    
    return c.json({
      success: true,
      message: `Contextual risk assessment completed for risk ${risk_id}`,
      data: contextualRiskScore
    });
    
  } catch (error) {
    console.error('Error in AI risk assessment:', error);
    return c.json({
      success: false,
      error: 'Failed to perform AI risk assessment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /api/ai-threat/risk-assessment/:riskId
 * Get existing AI risk assessment results
 */
aiThreatAnalysisRoutes.get('/risk-assessment/:riskId', requirePermission('ai_threat:view'), async (c) => {
  try {
    const { DB } = c.env as any;
    const riskScoringEngine = new IntelligentRiskScoringEngine(DB, new AIThreatAnalysisService(DB, c.env));
    
    const riskId = parseInt(c.req.param('riskId'));
    const riskScores = await riskScoringEngine.getContextualRiskScores([riskId]);
    
    return c.json({
      success: true,
      data: riskScores.length > 0 ? riskScores[0] : null,
      found: riskScores.length > 0
    });
    
  } catch (error) {
    console.error('Error getting AI risk assessment:', error);
    return c.json({
      success: false,
      error: 'Failed to get AI risk assessment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /api/ai-threat/assess-business-impact
 * Perform AI-driven business impact assessment
 */
aiThreatAnalysisRoutes.post('/assess-business-impact', requirePermission('ai_threat:analyze'), async (c) => {
  try {
    const { DB } = c.env as any;
    const aiAnalysisService = new AIThreatAnalysisService(DB, c.env);
    const riskScoringEngine = new IntelligentRiskScoringEngine(DB, aiAnalysisService);
    
    const { 
      risk_id, 
      threat_intelligence_context, 
      organizational_assets,
      organizational_context 
    } = await c.req.json();
    
    if (!risk_id || !organizational_context) {
      return c.json({
        success: false,
        error: 'Missing required fields: risk_id, organizational_context'
      }, 400);
    }
    
    const businessImpactAssessment = await riskScoringEngine.assessBusinessImpact(
      risk_id,
      threat_intelligence_context || {},
      organizational_assets || [],
      organizational_context
    );
    
    return c.json({
      success: true,
      message: `Business impact assessment completed for risk ${risk_id}`,
      data: businessImpactAssessment
    });
    
  } catch (error) {
    console.error('Error in business impact assessment:', error);
    return c.json({
      success: false,
      error: 'Failed to perform business impact assessment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /api/ai-threat/recommend-mitigations
 * Generate AI-driven mitigation recommendations
 */
aiThreatAnalysisRoutes.post('/recommend-mitigations', requirePermission('ai_threat:analyze'), async (c) => {
  try {
    const { DB } = c.env as any;
    const aiAnalysisService = new AIThreatAnalysisService(DB, c.env);
    const riskScoringEngine = new IntelligentRiskScoringEngine(DB, aiAnalysisService);
    
    const { 
      risk_id, 
      risk_score, 
      business_impact, 
      organizational_capabilities 
    } = await c.req.json();
    
    if (!risk_id || !risk_score) {
      return c.json({
        success: false,
        error: 'Missing required fields: risk_id, risk_score'
      }, 400);
    }
    
    const mitigationRecommendations = await riskScoringEngine.recommendMitigations(
      risk_id,
      risk_score,
      business_impact || {},
      organizational_capabilities || []
    );
    
    return c.json({
      success: true,
      message: `Generated ${mitigationRecommendations.length} mitigation recommendations for risk ${risk_id}`,
      data: mitigationRecommendations
    });
    
  } catch (error) {
    console.error('Error generating mitigation recommendations:', error);
    return c.json({
      success: false,
      error: 'Failed to generate mitigation recommendations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// AI Processing Metrics and Performance Endpoints

/**
 * GET /api/ai-threat/metrics
 * Get AI processing performance metrics
 */
aiThreatAnalysisRoutes.get('/metrics', requirePermission('ai_threat:view'), async (c) => {
  try {
    const { DB } = c.env as any;
    const aiAnalysisService = new AIThreatAnalysisService(DB, c.env);
    
    const timeframe = c.req.query('timeframe') || '24h';
    const metrics = await aiAnalysisService.getAIProcessingMetrics(timeframe);
    
    return c.json({
      success: true,
      data: {
        timeframe,
        metrics,
        generated_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error getting AI processing metrics:', error);
    return c.json({
      success: false,
      error: 'Failed to get AI processing metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /api/ai-threat/performance-stats
 * Get comprehensive AI analysis performance statistics
 */
aiThreatAnalysisRoutes.get('/performance-stats', requirePermission('ai_threat:view'), async (c) => {
  try {
    const { DB } = c.env as any;
    const aiAnalysisService = new AIThreatAnalysisService(DB, c.env);
    const riskScoringEngine = new IntelligentRiskScoringEngine(DB, aiAnalysisService);
    
    const timeframe = c.req.query('timeframe') || '30d';
    
    // Get AI processing metrics
    const aiMetrics = await aiAnalysisService.getAIProcessingMetrics(timeframe);
    
    // Get risk scoring metrics
    const riskScoringMetrics = await riskScoringEngine.getRiskScoringMetrics(timeframe);
    
    return c.json({
      success: true,
      data: {
        timeframe,
        ai_processing: aiMetrics,
        risk_scoring: riskScoringMetrics,
        generated_at: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error getting AI performance stats:', error);
    return c.json({
      success: false,
      error: 'Failed to get AI performance statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export { aiThreatAnalysisRoutes };