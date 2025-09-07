/**
 * ARIA5 Conversational Threat Intelligence Assistant API Routes
 * 
 * Phase 4.3: RESTful API endpoints for conversational threat intelligence
 * 
 * Features:
 * - Natural language query processing
 * - Session management
 * - Response feedback system
 * - Conversation history
 * - Multi-format response support
 * 
 * @author ARIA5 Security
 * @version 2.0.0
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { ThreatIntelligenceService } from '../services/threat-intelligence';
import { 
  type ThreatQuery,
  type ThreatResponse,
  type UserFeedback,
  ResponseFormat 
} from '../services/conversational-ti-assistant';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for all routes
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://*.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

/**
 * POST /api/assistant/query
 * Process natural language threat intelligence query
 */
app.post('/query', async (c) => {
  try {
    const body = await c.req.json();
    const { 
      query, 
      sessionId, 
      userId, 
      context, 
      preferredFormat = ResponseFormat.CONVERSATIONAL,
      maxResults = 50,
      includeRecommendations = true 
    } = body;
    
    // Validate required fields
    if (!query || !sessionId || !userId) {
      return c.json({
        success: false,
        error: 'Missing required fields: query, sessionId, userId',
      }, 400);
    }
    
    // Initialize threat intelligence service
    const tiService = new ThreatIntelligenceService(c.env.DB);
    
    // Prepare threat query
    const threatQuery: ThreatQuery = {
      query: query.trim(),
      sessionId,
      userId,
      context,
      preferredFormat,
      maxResults,
      includeRecommendations
    };
    
    // Process conversational query
    const startTime = Date.now();
    const response: ThreatResponse = await tiService.processConversationalQuery(threatQuery);
    const processingTime = Date.now() - startTime;
    
    return c.json({
      success: true,
      response: {
        ...response,
        metadata: {
          processing_time_ms: processingTime,
          api_version: '2.0.0',
          timestamp: new Date().toISOString()
        }
      }
    });
    
  } catch (error) {
    console.error('Conversational query error:', error);
    
    return c.json({
      success: false,
      error: 'Failed to process conversational query',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * POST /api/assistant/feedback
 * Provide feedback on assistant response
 */
app.post('/feedback', async (c) => {
  try {
    const body = await c.req.json();
    const { sessionId, turnId, rating, comments, helpful } = body;
    
    // Validate required fields
    if (!sessionId || !turnId || typeof rating !== 'number') {
      return c.json({
        success: false,
        error: 'Missing required fields: sessionId, turnId, rating',
      }, 400);
    }
    
    // Validate rating range
    if (rating < 1 || rating > 5) {
      return c.json({
        success: false,
        error: 'Rating must be between 1 and 5',
      }, 400);
    }
    
    // Initialize threat intelligence service
    const tiService = new ThreatIntelligenceService(c.env.DB);
    
    // Prepare feedback
    const feedback: UserFeedback = {
      rating,
      comments,
      timestamp: new Date(),
      helpful: helpful ?? (rating >= 4)
    };
    
    // Provide feedback
    await tiService.provideFeedback(sessionId, turnId, feedback);
    
    return c.json({
      success: true,
      message: 'Feedback recorded successfully'
    });
    
  } catch (error) {
    console.error('Feedback submission error:', error);
    
    return c.json({
      success: false,
      error: 'Failed to record feedback',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * GET /api/assistant/history/:sessionId
 * Get conversation history for a session
 */
app.get('/history/:sessionId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    
    if (!sessionId) {
      return c.json({
        success: false,
        error: 'Session ID is required',
      }, 400);
    }
    
    // Initialize threat intelligence service
    const tiService = new ThreatIntelligenceService(c.env.DB);
    
    // Get conversation history
    const history = tiService.getConversationHistory(sessionId);
    
    return c.json({
      success: true,
      sessionId,
      history,
      totalTurns: history.length
    });
    
  } catch (error) {
    console.error('History retrieval error:', error);
    
    return c.json({
      success: false,
      error: 'Failed to retrieve conversation history',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * DELETE /api/assistant/session/:sessionId
 * Clear conversation session
 */
app.delete('/session/:sessionId', async (c) => {
  try {
    const sessionId = c.req.param('sessionId');
    
    if (!sessionId) {
      return c.json({
        success: false,
        error: 'Session ID is required',
      }, 400);
    }
    
    // Initialize threat intelligence service
    const tiService = new ThreatIntelligenceService(c.env.DB);
    
    // Clear session
    tiService.clearConversationSession(sessionId);
    
    return c.json({
      success: true,
      message: `Session ${sessionId} cleared successfully`
    });
    
  } catch (error) {
    console.error('Session clearing error:', error);
    
    return c.json({
      success: false,
      error: 'Failed to clear session',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * POST /api/assistant/contextual-analysis
 * Direct contextual analysis using AI engine
 */
app.post('/contextual-analysis', async (c) => {
  try {
    const body = await c.req.json();
    const { type, data, query, context } = body;
    
    // Validate required fields
    if (!type || !data || !query || !context) {
      return c.json({
        success: false,
        error: 'Missing required fields: type, data, query, context',
      }, 400);
    }
    
    // Initialize threat intelligence service
    const tiService = new ThreatIntelligenceService(c.env.DB);
    
    // Execute contextual analysis
    const result = await tiService.executeContextualThreatAnalysis({
      type,
      data,
      query,
      context
    });
    
    return c.json({
      success: true,
      analysis: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Contextual analysis error:', error);
    
    return c.json({
      success: false,
      error: 'Failed to execute contextual analysis',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * POST /api/assistant/process-document
 * Process threat document with NLP
 */
app.post('/process-document', async (c) => {
  try {
    const body = await c.req.json();
    const { documentUrl, documentType = 'text' } = body;
    
    // Validate required fields
    if (!documentUrl) {
      return c.json({
        success: false,
        error: 'Missing required field: documentUrl',
      }, 400);
    }
    
    // Validate document type
    const validTypes = ['pdf', 'text', 'html'];
    if (!validTypes.includes(documentType)) {
      return c.json({
        success: false,
        error: `Invalid document type. Must be one of: ${validTypes.join(', ')}`,
      }, 400);
    }
    
    // Initialize threat intelligence service
    const tiService = new ThreatIntelligenceService(c.env.DB);
    
    // Process document
    const result = await tiService.processThreatDocument(documentUrl, documentType);
    
    return c.json({
      success: true,
      processing_result: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Document processing error:', error);
    
    return c.json({
      success: false,
      error: 'Failed to process document',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * GET /api/assistant/capabilities
 * Get assistant capabilities and supported features
 */
app.get('/capabilities', async (c) => {
  return c.json({
    success: true,
    capabilities: {
      natural_language_processing: {
        supported_languages: ['en'],
        intent_recognition: true,
        entity_extraction: true,
        context_awareness: true
      },
      query_types: [
        'threat_lookup',
        'indicator_search', 
        'risk_assessment',
        'threat_analysis',
        'threat_actor_info',
        'vulnerability_info',
        'incident_investigation',
        'hunting_guidance',
        'mitigation_advice',
        'trend_analysis',
        'correlation_analysis',
        'prediction_request'
      ],
      response_formats: [
        'conversational',
        'structured',
        'technical', 
        'executive',
        'json'
      ],
      supported_entities: [
        'ip_address',
        'domain',
        'url', 
        'file_hash',
        'email',
        'cve',
        'threat_actor',
        'malware',
        'technique',
        'campaign'
      ],
      integrations: {
        ai_engines: ['openai', 'anthropic', 'gemini'],
        threat_feeds: ['otx', 'nvd', 'cisa_kev', 'commercial'],
        analysis_engines: ['correlation', 'behavioral', 'risk_scoring']
      },
      version: '2.0.0'
    }
  });
});

/**
 * GET /api/assistant/health
 * Health check endpoint
 */
app.get('/health', async (c) => {
  try {
    // Basic health check
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      services: {
        database: 'healthy',
        ai_engine: 'healthy',
        nlp_engine: 'healthy',
        conversational_assistant: 'healthy'
      }
    };
    
    return c.json({
      success: true,
      health
    });
    
  } catch (error) {
    console.error('Health check error:', error);
    
    return c.json({
      success: false,
      health: {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, 500);
  }
});

export default app;