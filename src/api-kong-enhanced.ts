// Kong-Enhanced API Routes for Risk Management Platform
// This version integrates with Kong Gateway for enterprise-grade API management

import { Hono } from 'hono';
import { CloudflareBindings, ApiResponse, Risk } from './types';
import { KongIntegration, KongContext } from './kong-integration';

export function createKongEnhancedAPI() {
  const api = new Hono<{ Bindings: CloudflareBindings }>();

  // Kong integration middleware (replaces basic middleware)
  api.use('*', KongIntegration.createRequestTransformerMiddleware());
  api.use('/api/*', KongIntegration.createKongJWTMiddleware());
  api.use('*', KongIntegration.createKongCORSMiddleware());

  // Enhanced health check with Kong context
  api.get('/api/health', (c) => {
    const kongContext: KongContext = c.get('kongContext');
    
    return c.json<ApiResponse<{
      status: string;
      timestamp: string;
      kong: {
        requestId: string;
        clientIP: string;
        consumerId?: string;
      };
    }>>({ 
      success: true, 
      data: { 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        kong: {
          requestId: kongContext.requestId,
          clientIP: kongContext.clientIP,
          consumerId: kongContext.consumerId
        }
      },
      message: 'API is running with Kong Gateway'
    });
  });

  // Enhanced authentication endpoints (Kong-aware)
  api.post('/api/auth/login', async (c) => {
    try {
      const kongContext: KongContext = c.get('kongContext');
      const { username, password } = await c.req.json();

      KongIntegration.logWithKongContext('info', 'Login attempt', kongContext, { username });

      // Your existing login logic here
      // ... (validate credentials)
      
      // For Kong integration, you might want to create a Kong consumer
      const kongAdmin = KongIntegration.createKongAdminClient();
      
      // Example: Create or update consumer in Kong
      if (username && password) {
        // Simulate successful authentication
        const token = 'demo_token_' + username; // Your JWT generation logic
        
        KongIntegration.logWithKongContext('info', 'Login successful', kongContext, { username });
        
        return c.json<ApiResponse<{token: string, user: any}>>({
          success: true,
          data: {
            token,
            user: { id: 1, username, role: 'risk_manager' }
          },
          message: 'Login successful'
        });
      }

      return c.json<ApiResponse<null>>({
        success: false,
        error: 'Invalid credentials'
      }, 401);

    } catch (error) {
      const kongContext: KongContext = c.get('kongContext');
      KongIntegration.logWithKongContext('error', 'Login error', kongContext, { error: error.message });
      
      return c.json<ApiResponse<null>>({
        success: false,
        error: 'Login failed'
      }, 500);
    }
  });

  // Enhanced risks API with Kong features
  api.get('/api/risks', async (c) => {
    try {
      const kongContext: KongContext = c.get('kongContext');
      
      // Check Kong rate limiting status
      if (KongIntegration.shouldRateLimit(c.req.header())) {
        return c.json<ApiResponse<null>>({
          success: false,
          error: 'Rate limit exceeded',
          requestId: kongContext.requestId
        }, 429);
      }

      const page = Number(c.req.query('page')) || 1;
      const limit = Number(c.req.query('limit')) || 20;
      const offset = (page - 1) * limit;

      // Your existing risks query
      const risks = await c.env.DB.prepare(`
        SELECT r.*, c.name as category_name, o.name as organization_name, 
               u.first_name, u.last_name
        FROM risks r
        LEFT JOIN risk_categories c ON r.category_id = c.id
        LEFT JOIN organizations o ON r.organization_id = o.id
        LEFT JOIN users u ON r.owner_id = u.id
        ORDER BY r.risk_score DESC
        LIMIT ? OFFSET ?
      `).bind(limit, offset).all();

      const totalCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM risks').first<{count: number}>();

      KongIntegration.logWithKongContext('info', 'Risks retrieved', kongContext, {
        count: risks.results?.length || 0,
        page,
        consumerId: kongContext.consumerId
      });

      return c.json<ApiResponse<typeof risks.results>>({ 
        success: true, 
        data: risks.results,
        total: totalCount?.count || 0,
        page,
        limit,
        requestId: kongContext.requestId
      });

    } catch (error) {
      const kongContext: KongContext = c.get('kongContext');
      KongIntegration.logWithKongContext('error', 'Risks retrieval failed', kongContext, { error: error.message });
      
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to fetch risks',
        requestId: kongContext.requestId
      }, 500);
    }
  });

  // Enhanced AI risk assessment with Kong logging
  api.post('/api/risks/ai-assessment', async (c) => {
    try {
      const kongContext: KongContext = c.get('kongContext');
      const { title, description, related_services } = await c.req.json();

      if (!title) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Risk title is required for AI assessment',
          requestId: kongContext.requestId
        }, 400);
      }

      KongIntegration.logWithKongContext('info', 'AI risk assessment started', kongContext, {
        title,
        hasDescription: !!description,
        hasServices: !!related_services
      });

      // Your existing AI assessment logic
      const aiAssessment = {
        probability: Math.floor(Math.random() * 5) + 1,
        probability_reasoning: "Based on industry standards and threat landscape analysis",
        impact: Math.floor(Math.random() * 5) + 1,
        impact_reasoning: "Considering business operations and service dependencies",
        threat_source: ["internal", "external", "technical_failure", "human_error", "process_failure"][Math.floor(Math.random() * 5)],
        root_cause: "System vulnerability or process gap requiring attention",
        mitigation_recommendations: [
          "Implement additional monitoring and controls",
          "Review and update security policies",
          "Conduct regular security assessments",
          "Enhance staff training and awareness"
        ],
        timeline_urgency: ["immediate", "short_term", "medium_term"][Math.floor(Math.random() * 3)]
      };

      const riskScore = aiAssessment.probability * aiAssessment.impact;
      aiAssessment.risk_score = riskScore;

      KongIntegration.logWithKongContext('info', 'AI risk assessment completed', kongContext, {
        riskScore,
        threatSource: aiAssessment.threat_source,
        urgency: aiAssessment.timeline_urgency
      });

      return c.json<ApiResponse<any>>({ 
        success: true, 
        data: aiAssessment,
        message: 'AI risk assessment completed successfully',
        requestId: kongContext.requestId
      });

    } catch (error) {
      const kongContext: KongContext = c.get('kongContext');
      KongIntegration.logWithKongContext('error', 'AI assessment failed', kongContext, { error: error.message });
      
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to perform AI risk assessment',
        requestId: kongContext.requestId
      }, 500);
    }
  });

  // Kong metrics endpoint for monitoring
  api.get('/api/kong/metrics', async (c) => {
    try {
      const kongContext: KongContext = c.get('kongContext');
      
      // Only allow admin users to access metrics
      const user = c.get('user');
      if (!user || user.role !== 'admin') {
        return c.json<ApiResponse<null>>({
          success: false,
          error: 'Admin access required',
          requestId: kongContext.requestId
        }, 403);
      }

      const kongAdmin = KongIntegration.createKongAdminClient();
      const metrics = await kongAdmin.getAPIMetrics();

      return c.json<ApiResponse<any>>({
        success: true,
        data: {
          kong: metrics,
          context: kongContext
        },
        requestId: kongContext.requestId
      });

    } catch (error) {
      const kongContext: KongContext = c.get('kongContext');
      KongIntegration.logWithKongContext('error', 'Metrics retrieval failed', kongContext, { error: error.message });
      
      return c.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to retrieve metrics',
        requestId: kongContext.requestId
      }, 500);
    }
  });

  // Kong consumer management endpoint
  api.post('/api/kong/consumers', async (c) => {
    try {
      const kongContext: KongContext = c.get('kongContext');
      const { username, rateLimit } = await c.req.json();
      
      // Only allow admin users to manage consumers
      const user = c.get('user');
      if (!user || user.role !== 'admin') {
        return c.json<ApiResponse<null>>({
          success: false,
          error: 'Admin access required',
          requestId: kongContext.requestId
        }, 403);
      }

      const kongAdmin = KongIntegration.createKongAdminClient();
      
      // Update consumer rate limit
      if (rateLimit) {
        const result = await kongAdmin.updateConsumerRateLimit(username, rateLimit);
        
        KongIntegration.logWithKongContext('info', 'Consumer rate limit updated', kongContext, {
          username,
          rateLimit
        });

        return c.json<ApiResponse<any>>({
          success: true,
          data: result,
          message: 'Consumer updated successfully',
          requestId: kongContext.requestId
        });
      }

      return c.json<ApiResponse<null>>({
        success: false,
        error: 'Invalid consumer update request',
        requestId: kongContext.requestId
      }, 400);

    } catch (error) {
      const kongContext: KongContext = c.get('kongContext');
      KongIntegration.logWithKongContext('error', 'Consumer management failed', kongContext, { error: error.message });
      
      return c.json<ApiResponse<null>>({
        success: false,
        error: 'Failed to manage consumer',
        requestId: kongContext.requestId
      }, 500);
    }
  });

  return api;
}

// Export Kong plugin configurations for easy setup
export const kongPluginConfigs = KongIntegration.getKongPluginConfig();