/**
 * Comprehensive API Routes for ARIA5.1 Enterprise Security Intelligence Platform
 * 
 * Provides complete REST API coverage for:
 * - Risk management and assessment
 * - Compliance automation and reporting
 * - Threat modeling and security analysis
 * - File storage and document management
 * - Real-time notifications and alerts
 * - Machine learning analytics
 * - Behavioral analysis and anomaly detection
 * - Integration with external security tools
 */

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { jwt, verify } from 'hono/jwt'
import { sign } from 'hono/jwt'
import { validator } from 'hono/validator'

// Import all service classes
import { AIProviderService } from '../lib/ai-providers'
import { MicrosoftDefenderService } from '../lib/microsoft-defender'
import { ReportGeneratorService } from '../lib/report-generator'
import { SIEMIntegrationService } from '../lib/siem-integrations'
import { TicketingIntegrationService } from '../lib/ticketing-integrations'
import { FileStorageService } from '../lib/file-storage'
import { WebSocketNotificationService } from '../lib/websocket-notifications'
import { AdvancedSearchService } from '../lib/advanced-search'
import { MLAnalyticsService } from '../lib/ml-analytics'
import { BehavioralAnalysisService } from '../lib/behavioral-analysis'
import { ThreatModelingService } from '../lib/threat-modeling'
import { ComplianceAutomationService } from '../lib/compliance-automation'

// Types for API responses
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId: string;
}

interface PaginatedResponse<T = any> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

type Bindings = {
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  // Environment variables
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  MICROSOFT_TENANT_ID?: string;
  MICROSOFT_CLIENT_ID?: string;
  MICROSOFT_CLIENT_SECRET?: string;
  JWT_SECRET?: string;
}

const api = new Hono<{ Bindings: Bindings }>()

// Middleware
api.use('*', cors({
  origin: ['http://localhost:3000', 'https://*.pages.dev'],
  credentials: true
}))

api.use('*', logger())

// JWT Authentication middleware (except for auth routes)
api.use('/api/*', async (c, next) => {
  const path = c.req.path;
  if (path.includes('/auth/') || path.includes('/health') || path.includes('/saml/')) {
    return next();
  }

  // Check for token in Authorization header first, then cookies
  let token = c.req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    // Try to get token from cookie
    token = c.req.header('Cookie')?.split(';')
      .find(cookie => cookie.trim().startsWith('aria_token='))
      ?.split('=')[1];
  }

  if (!token) {
    return c.json(createResponse(false, null, 'no authorization included in request'), 401);
  }

  try {
    const jwtSecret = c.env.JWT_SECRET || 'your-jwt-secret';
    const payload = await verify(token, jwtSecret);
    c.set('jwtPayload', payload);
    return next();
  } catch (error) {
    return c.json(createResponse(false, null, 'Token invalid'), 401);
  }
})

// Request ID middleware
api.use('*', async (c, next) => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  c.set('requestId', requestId);
  return next();
})

// Helper function to create consistent API responses
function createResponse<T>(
  success: boolean,
  data?: T,
  error?: string,
  message?: string,
  requestId?: string
): APIResponse<T> {
  return {
    success,
    data,
    error,
    message,
    timestamp: new Date().toISOString(),
    requestId: requestId || `req_${Date.now()}`
  };
}

function createPaginatedResponse<T>(
  success: boolean,
  data: T[],
  pagination: PaginatedResponse<T>['pagination'],
  requestId?: string
): PaginatedResponse<T> {
  return {
    success,
    data,
    pagination,
    timestamp: new Date().toISOString(),
    requestId: requestId || `req_${Date.now()}`
  };
}

// Health check endpoint
api.get('/api/health', (c) => {
  return c.json(createResponse(true, {
    status: 'healthy',
    version: '2.0.0',
    services: {
      database: !!c.env.DB,
      storage: !!c.env.R2,
      cache: !!c.env.KV
    }
  }, undefined, 'ARIA5.1 Enterprise Security Intelligence Platform', c.get('requestId')));
})

// =============================================================================
// AUTHENTICATION & USER MANAGEMENT
// =============================================================================

// SAML Configuration endpoints (for compatibility)
api.get('/api/saml/config', (c) => {
  return c.json(createResponse(true, {
    enabled: false,
    provider: 'none',
    message: 'SAML SSO not configured - using demo authentication'
  }, undefined, 'SAML configuration status', c.get('requestId')));
})

api.get('/api/saml/sso-url', (c) => {
  return c.json(createResponse(false, null, 'SAML SSO not configured'), 404);
})

api.post('/api/auth/login', 
  validator('json', (value, c) => {
    if (!value.email || !value.password) {
      return c.json(createResponse(false, null, 'Email and password required'), 400);
    }
    return value;
  }),
  async (c) => {
    try {
      const { email, password } = await c.req.json();
      
      // Demo authentication - supports multiple demo credentials
      const validCredentials = [
        { email: 'admin@aria5.com', password: 'admin123' },
        { email: 'admin', password: 'demo123' },
        { email: 'demo@aria5.com', password: 'demo123' }
      ];
      
      const isValidCredentials = validCredentials.some(cred => 
        (cred.email === email && cred.password === password)
      );
      
      if (isValidCredentials) {
        const token = await sign({
          userId: 1,
          email: email.includes('@') ? email : 'admin@aria5.com',
          role: 'admin',
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
        }, c.env.JWT_SECRET || 'your-jwt-secret');

        return c.json(createResponse(true, {
          token,
          user: {
            id: 1,
            email: email.includes('@') ? email : 'admin@aria5.com',
            role: 'admin',
            name: 'System Administrator'
          }
        }, undefined, 'Login successful', c.get('requestId')));
      }

      return c.json(createResponse(false, null, 'Invalid credentials'), 401);
    } catch (error) {
      return c.json(createResponse(false, null, 'Authentication failed'), 500);
    }
  }
)

api.get('/api/auth/me', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    return c.json(createResponse(true, {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
      name: 'System Administrator'
    }, undefined, 'User profile retrieved', c.get('requestId')));
  } catch (error) {
    return c.json(createResponse(false, null, 'User not found'), 404);
  }
})

api.get('/api/auth/verify', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    return c.json(createResponse(true, {
      valid: true,
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    }, undefined, 'Token verified', c.get('requestId')));
  } catch (error) {
    return c.json(createResponse(false, null, 'Token invalid'), 401);
  }
})

// =============================================================================
// RISK MANAGEMENT API
// =============================================================================

api.get('/api/risks', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const status = c.req.query('status');
    const severity = c.req.query('severity');

    // Mock implementation - replace with actual database queries
    const risks = [
      {
        id: 1,
        title: 'Unauthorized Access to Customer Data',
        description: 'Potential unauthorized access to customer personal information',
        status: 'open',
        severity: 'high',
        likelihood: 7,
        impact: 8,
        riskScore: 56,
        owner: 'Security Team',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-20T15:30:00Z'
      },
      {
        id: 2,
        title: 'Insider Threat - Data Exfiltration',
        description: 'Risk of malicious insider accessing and exfiltrating sensitive data',
        status: 'in_progress',
        severity: 'critical',
        likelihood: 4,
        impact: 9,
        riskScore: 36,
        owner: 'CISO',
        createdAt: '2024-01-18T14:22:00Z',
        updatedAt: '2024-01-22T09:15:00Z'
      }
    ];

    const filteredRisks = risks.filter(risk => {
      if (status && risk.status !== status) return false;
      if (severity && risk.severity !== severity) return false;
      return true;
    });

    const total = filteredRisks.length;
    const pages = Math.ceil(total / limit);
    const startIndex = (page - 1) * limit;
    const paginatedRisks = filteredRisks.slice(startIndex, startIndex + limit);

    return c.json(createPaginatedResponse(true, paginatedRisks, {
      page,
      limit,
      total,
      pages
    }, c.get('requestId')));
  } catch (error) {
    return c.json(createResponse(false, null, 'Failed to retrieve risks'), 500);
  }
})

api.post('/api/risks',
  validator('json', (value, c) => {
    if (!value.title || !value.description) {
      return c.json(createResponse(false, null, 'Title and description required'), 400);
    }
    return value;
  }),
  async (c) => {
    try {
      const riskData = await c.req.json();
      
      // Mock implementation - replace with actual database insert
      const newRisk = {
        id: Date.now(),
        ...riskData,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return c.json(createResponse(true, newRisk, undefined, 'Risk created successfully', c.get('requestId')), 201);
    } catch (error) {
      return c.json(createResponse(false, null, 'Failed to create risk'), 500);
    }
  }
)

api.get('/api/risks/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    
    // Mock implementation - replace with actual database query
    const risk = {
      id,
      title: 'Unauthorized Access to Customer Data',
      description: 'Potential unauthorized access to customer personal information',
      status: 'open',
      severity: 'high',
      likelihood: 7,
      impact: 8,
      riskScore: 56,
      owner: 'Security Team',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T15:30:00Z',
      mitigations: [
        {
          id: 1,
          description: 'Implement multi-factor authentication',
          status: 'in_progress',
          dueDate: '2024-02-01'
        }
      ],
      comments: [
        {
          id: 1,
          content: 'Risk assessment completed, mitigation plan approved',
          author: 'Risk Manager',
          createdAt: '2024-01-20T15:30:00Z'
        }
      ]
    };

    return c.json(createResponse(true, risk, undefined, 'Risk retrieved successfully', c.get('requestId')));
  } catch (error) {
    return c.json(createResponse(false, null, 'Risk not found'), 404);
  }
})

// =============================================================================
// AI PROVIDERS API
// =============================================================================

api.get('/api/ai/providers', async (c) => {
  try {
    const aiService = new AIProviderService();
    const providers = await aiService.listProviders();
    
    return c.json(createResponse(true, providers, undefined, 'AI providers retrieved', c.get('requestId')));
  } catch (error) {
    return c.json(createResponse(false, null, 'Failed to retrieve AI providers'), 500);
  }
})

api.post('/api/ai/analyze-risk',
  validator('json', (value, c) => {
    if (!value.riskId || !value.analysisType) {
      return c.json(createResponse(false, null, 'Risk ID and analysis type required'), 400);
    }
    return value;
  }),
  async (c) => {
    try {
      const { riskId, analysisType, providerId } = await c.req.json();
      
      const aiService = new AIProviderService();
      const result = await aiService.analyzeRisk({
        riskId,
        analysisType,
        context: 'Enterprise security risk analysis'
      }, providerId);

      return c.json(createResponse(true, result, undefined, 'Risk analysis completed', c.get('requestId')));
    } catch (error) {
      return c.json(createResponse(false, null, 'AI analysis failed'), 500);
    }
  }
)

// =============================================================================
// MICROSOFT DEFENDER API
// =============================================================================

api.get('/api/defender/alerts', async (c) => {
  try {
    const severity = c.req.query('severity')?.split(',');
    const status = c.req.query('status')?.split(',');
    const timeRange = c.req.query('timeRange') || '24h';

    const defenderService = new MicrosoftDefenderService(
      c.env.MICROSOFT_TENANT_ID,
      c.env.MICROSOFT_CLIENT_ID,
      c.env.MICROSOFT_CLIENT_SECRET
    );

    const alerts = await defenderService.getAlerts({
      severity,
      status,
      timeRange
    });

    return c.json(createResponse(true, alerts, undefined, 'Defender alerts retrieved', c.get('requestId')));
  } catch (error) {
    return c.json(createResponse(false, null, 'Failed to retrieve Defender alerts'), 500);
  }
})

api.post('/api/defender/sync-risks', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.userId;

    const defenderService = new MicrosoftDefenderService(
      c.env.MICROSOFT_TENANT_ID,
      c.env.MICROSOFT_CLIENT_ID,
      c.env.MICROSOFT_CLIENT_SECRET
    );

    const result = await defenderService.syncAlertsToRisks(c.env.DB, userId);

    return c.json(createResponse(true, result, undefined, 'Defender alerts synced to risks', c.get('requestId')));
  } catch (error) {
    return c.json(createResponse(false, null, 'Failed to sync Defender alerts'), 500);
  }
})

// =============================================================================
// REPORTS API
// =============================================================================

api.post('/api/reports/generate',
  validator('json', (value, c) => {
    if (!value.type || !value.format) {
      return c.json(createResponse(false, null, 'Report type and format required'), 400);
    }
    return value;
  }),
  async (c) => {
    try {
      const reportRequest = await c.req.json();
      
      const reportService = new ReportGeneratorService();
      const result = await reportService.generateReport(reportRequest.data, {
        format: reportRequest.format,
        template: reportRequest.template || 'default',
        includeCharts: reportRequest.includeCharts !== false,
        watermark: 'ARIA5.1 Enterprise Security Platform'
      });

      return c.json(createResponse(true, result, undefined, 'Report generated successfully', c.get('requestId')));
    } catch (error) {
      return c.json(createResponse(false, null, 'Report generation failed'), 500);
    }
  }
)

// =============================================================================
// SIEM INTEGRATIONS API
// =============================================================================

api.get('/api/siem/integrations', async (c) => {
  try {
    const siemService = new SIEMIntegrationService();
    const integrations = await siemService.getConnections();

    return c.json(createResponse(true, integrations, undefined, 'SIEM integrations retrieved', c.get('requestId')));
  } catch (error) {
    return c.json(createResponse(false, null, 'Failed to retrieve SIEM integrations'), 500);
  }
})

api.post('/api/siem/:siemId/events',
  validator('json', (value, c) => {
    if (!Array.isArray(value.events)) {
      return c.json(createResponse(false, null, 'Events array required'), 400);
    }
    return value;
  }),
  async (c) => {
    try {
      const siemId = c.req.param('siemId');
      const { events } = await c.req.json();

      const siemService = new SIEMIntegrationService();
      const result = await siemService.sendEvents(siemId, events);

      return c.json(createResponse(true, result, undefined, 'Events sent to SIEM', c.get('requestId')));
    } catch (error) {
      return c.json(createResponse(false, null, 'Failed to send events to SIEM'), 500);
    }
  }
)

// =============================================================================
// TICKETING INTEGRATIONS API
// =============================================================================

api.get('/api/ticketing/systems', async (c) => {
  try {
    const ticketingService = new TicketingIntegrationService();
    const systems = await ticketingService.getConfiguredSystems();

    return c.json(createResponse(true, systems, undefined, 'Ticketing systems retrieved', c.get('requestId')));
  } catch (error) {
    return c.json(createResponse(false, null, 'Failed to retrieve ticketing systems'), 500);
  }
})

api.post('/api/ticketing/:systemId/tickets',
  validator('json', (value, c) => {
    if (!value.title || !value.description) {
      return c.json(createResponse(false, null, 'Title and description required'), 400);
    }
    return value;
  }),
  async (c) => {
    try {
      const systemId = c.req.param('systemId');
      const ticketData = await c.req.json();

      const ticketingService = new TicketingIntegrationService();
      const result = await ticketingService.createTicket(systemId, ticketData);

      return c.json(createResponse(true, result, undefined, 'Ticket created successfully', c.get('requestId')));
    } catch (error) {
      return c.json(createResponse(false, null, 'Failed to create ticket'), 500);
    }
  }
)

// =============================================================================
// FILE STORAGE API
// =============================================================================

api.post('/api/files/upload', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.userId;

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'document';
    const relatedRiskId = formData.get('relatedRiskId') ? parseInt(formData.get('relatedRiskId') as string) : undefined;

    if (!file) {
      return c.json(createResponse(false, null, 'No file provided'), 400);
    }

    const fileService = new FileStorageService(c.env.R2, c.env.DB);
    const result = await fileService.uploadFile({
      file,
      filename: file.name,
      mimeType: file.type,
      category: category as any,
      relatedRiskId
    }, userId);

    if (result.success) {
      return c.json(createResponse(true, result, undefined, 'File uploaded successfully', c.get('requestId')));
    } else {
      return c.json(createResponse(false, null, result.error), 400);
    }
  } catch (error) {
    return c.json(createResponse(false, null, 'File upload failed'), 500);
  }
})

api.get('/api/files/:fileId', async (c) => {
  try {
    const fileId = c.req.param('fileId');
    const payload = c.get('jwtPayload');
    const userId = payload.userId;

    const fileService = new FileStorageService(c.env.R2, c.env.DB);
    const result = await fileService.getFile(fileId, userId);

    if (result.success && result.file && result.metadata) {
      // Return file content with proper headers
      const headers = new Headers();
      headers.set('Content-Type', result.metadata.mimeType);
      headers.set('Content-Disposition', `attachment; filename="${result.metadata.originalName}"`);
      
      return new Response(result.file.body, { headers });
    } else {
      return c.json(createResponse(false, null, result.error), 404);
    }
  } catch (error) {
    return c.json(createResponse(false, null, 'File retrieval failed'), 500);
  }
})

api.get('/api/files', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.userId;

    const query = c.req.query('q') || '';
    const category = c.req.query('category');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');

    const fileService = new FileStorageService(c.env.R2, c.env.DB);
    const result = await fileService.searchFiles({
      query,
      category: category as any,
      limit,
      offset: (page - 1) * limit
    }, userId);

    if (result.success) {
      return c.json(createPaginatedResponse(true, result.files || [], {
        page,
        limit,
        total: result.total || 0,
        pages: Math.ceil((result.total || 0) / limit)
      }, c.get('requestId')));
    } else {
      return c.json(createResponse(false, null, result.error), 500);
    }
  } catch (error) {
    return c.json(createResponse(false, null, 'File search failed'), 500);
  }
})

// =============================================================================
// NOTIFICATIONS API
// =============================================================================

api.get('/api/notifications', async (c) => {
  try {
    const payload = c.get('jwtPayload');
    const userId = payload.userId;

    const unreadOnly = c.req.query('unreadOnly') === 'true';
    const types = c.req.query('types')?.split(',');
    const limit = parseInt(c.req.query('limit') || '50');

    const notificationService = new WebSocketNotificationService(c.env.DB);
    const result = await notificationService.getUserNotifications(userId, {
      unreadOnly,
      types,
      limit
    });

    if (result.success) {
      return c.json(createResponse(true, {
        notifications: result.notifications,
        total: result.total
      }, undefined, 'Notifications retrieved', c.get('requestId')));
    } else {
      return c.json(createResponse(false, null, result.error), 500);
    }
  } catch (error) {
    return c.json(createResponse(false, null, 'Failed to retrieve notifications'), 500);
  }
})

api.post('/api/notifications/:id/read', async (c) => {
  try {
    const notificationId = c.req.param('id');
    const payload = c.get('jwtPayload');
    const userId = payload.userId;

    const notificationService = new WebSocketNotificationService(c.env.DB);
    const result = await notificationService.markAsRead(notificationId, userId);

    if (result.success) {
      return c.json(createResponse(true, null, undefined, 'Notification marked as read', c.get('requestId')));
    } else {
      return c.json(createResponse(false, null, result.error), 500);
    }
  } catch (error) {
    return c.json(createResponse(false, null, 'Failed to mark notification as read'), 500);
  }
})

// =============================================================================
// SEARCH API
// =============================================================================

api.get('/api/search', async (c) => {
  try {
    const query = c.req.query('q') || '';
    const entities = c.req.query('entities')?.split(',');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');

    if (!query.trim()) {
      return c.json(createResponse(false, null, 'Search query required'), 400);
    }

    const searchService = new AdvancedSearchService(c.env.DB);
    const result = await searchService.search({
      query,
      entities: entities as any,
      limit,
      offset,
      highlight: true
    });

    if (result.success) {
      return c.json(createResponse(true, {
        results: result.results,
        total: result.total,
        took: result.took,
        facets: result.facets,
        suggestions: result.suggestions
      }, undefined, 'Search completed', c.get('requestId')));
    } else {
      return c.json(createResponse(false, null, result.error), 500);
    }
  } catch (error) {
    return c.json(createResponse(false, null, 'Search failed'), 500);
  }
})

// =============================================================================
// MACHINE LEARNING ANALYTICS API
// =============================================================================

api.get('/api/ml/models', async (c) => {
  try {
    const mlService = new MLAnalyticsService(c.env.DB);
    const stats = await mlService.getAnalyticsStats();

    if (stats.success) {
      return c.json(createResponse(true, stats.stats, undefined, 'ML models retrieved', c.get('requestId')));
    } else {
      return c.json(createResponse(false, null, stats.error), 500);
    }
  } catch (error) {
    return c.json(createResponse(false, null, 'Failed to retrieve ML models'), 500);
  }
})

api.post('/api/ml/predict-risk',
  validator('json', (value, c) => {
    if (!value.entityId || !value.features) {
      return c.json(createResponse(false, null, 'Entity ID and features required'), 400);
    }
    return value;
  }),
  async (c) => {
    try {
      const { entityId, entityType, features, modelId } = await c.req.json();

      const mlService = new MLAnalyticsService(c.env.DB);
      const result = await mlService.predictRisk(
        parseInt(entityId),
        entityType || 'risk',
        features,
        modelId
      );

      if (result.success) {
        return c.json(createResponse(true, result.prediction, undefined, 'Risk prediction completed', c.get('requestId')));
      } else {
        return c.json(createResponse(false, null, result.error), 500);
      }
    } catch (error) {
      return c.json(createResponse(false, null, 'Risk prediction failed'), 500);
    }
  }
)

// =============================================================================
// BEHAVIORAL ANALYSIS API
// =============================================================================

api.post('/api/behavioral/events', 
  validator('json', (value, c) => {
    if (!value.entityId || !value.eventType) {
      return c.json(createResponse(false, null, 'Entity ID and event type required'), 400);
    }
    return value;
  }),
  async (c) => {
    try {
      const eventData = await c.req.json();

      const behavioralService = new BehavioralAnalysisService(c.env.DB);
      const result = await behavioralService.recordEvent(eventData);

      if (result.success) {
        return c.json(createResponse(true, { eventId: result.eventId }, undefined, 'Event recorded', c.get('requestId')));
      } else {
        return c.json(createResponse(false, null, result.error), 500);
      }
    } catch (error) {
      return c.json(createResponse(false, null, 'Failed to record behavioral event'), 500);
    }
  }
)

api.get('/api/behavioral/analysis/:userId', async (c) => {
  try {
    const userId = parseInt(c.req.param('userId'));
    const periodDays = parseInt(c.req.query('period') || '30');

    const behavioralService = new BehavioralAnalysisService(c.env.DB);
    const result = await behavioralService.analyzeUserBehavior(userId, periodDays);

    if (result.success) {
      return c.json(createResponse(true, result.analysis, undefined, 'Behavioral analysis completed', c.get('requestId')));
    } else {
      return c.json(createResponse(false, null, result.error), 500);
    }
  } catch (error) {
    return c.json(createResponse(false, null, 'Behavioral analysis failed'), 500);
  }
})

// =============================================================================
// THREAT MODELING API
// =============================================================================

api.post('/api/threat-models',
  validator('json', (value, c) => {
    if (!value.name || !value.scope) {
      return c.json(createResponse(false, null, 'Name and scope required'), 400);
    }
    return value;
  }),
  async (c) => {
    try {
      const modelConfig = await c.req.json();

      const threatService = new ThreatModelingService(c.env.DB);
      const result = await threatService.createThreatModel(modelConfig);

      if (result.success) {
        return c.json(createResponse(true, result.model, undefined, 'Threat model created', c.get('requestId')));
      } else {
        return c.json(createResponse(false, null, result.error), 500);
      }
    } catch (error) {
      return c.json(createResponse(false, null, 'Threat model creation failed'), 500);
    }
  }
)

api.post('/api/threat-models/:id/analyze-paths', async (c) => {
  try {
    const modelId = c.req.param('id');

    const threatService = new ThreatModelingService(c.env.DB);
    const result = await threatService.analyzeAttackPaths(modelId);

    if (result.success) {
      return c.json(createResponse(true, result.paths, undefined, 'Attack paths analyzed', c.get('requestId')));
    } else {
      return c.json(createResponse(false, null, result.error), 500);
    }
  } catch (error) {
    return c.json(createResponse(false, null, 'Attack path analysis failed'), 500);
  }
})

// =============================================================================
// COMPLIANCE AUTOMATION API
// =============================================================================

api.get('/api/compliance/frameworks', async (c) => {
  try {
    const complianceService = new ComplianceAutomationService(c.env.DB);
    const stats = await complianceService.getComplianceStats();

    if (stats.success) {
      return c.json(createResponse(true, stats.stats, undefined, 'Compliance frameworks retrieved', c.get('requestId')));
    } else {
      return c.json(createResponse(false, null, stats.error), 500);
    }
  } catch (error) {
    return c.json(createResponse(false, null, 'Failed to retrieve compliance frameworks'), 500);
  }
})

api.post('/api/compliance/frameworks/:id/gap-analysis', async (c) => {
  try {
    const frameworkId = c.req.param('id');

    const complianceService = new ComplianceAutomationService(c.env.DB);
    const result = await complianceService.performGapAnalysis(frameworkId);

    if (result.success) {
      return c.json(createResponse(true, {
        gaps: result.gaps,
        analysis: result.analysis
      }, undefined, 'Gap analysis completed', c.get('requestId')));
    } else {
      return c.json(createResponse(false, null, result.error), 500);
    }
  } catch (error) {
    return c.json(createResponse(false, null, 'Gap analysis failed'), 500);
  }
})

// =============================================================================
// DASHBOARD & ANALYTICS API
// =============================================================================

api.get('/api/dashboard/overview', async (c) => {
  try {
    // Mock dashboard data - replace with actual service calls
    const overview = {
      risks: {
        total: 156,
        open: 42,
        critical: 8,
        high: 15,
        trend: '+12%'
      },
      compliance: {
        frameworks: 4,
        overallScore: 87.5,
        gaps: 23,
        trend: '+5%'
      },
      threats: {
        models: 8,
        highRiskPaths: 12,
        mitigations: 34,
        trend: 'stable'
      },
      incidents: {
        total: 89,
        resolved: 76,
        pending: 13,
        trend: '-8%'
      },
      behavioral: {
        anomalies: 5,
        users: 234,
        riskScore: 6.2,
        trend: 'improving'
      }
    };

    return c.json(createResponse(true, overview, undefined, 'Dashboard overview retrieved', c.get('requestId')));
  } catch (error) {
    return c.json(createResponse(false, null, 'Failed to retrieve dashboard overview'), 500);
  }
})

api.get('/api/dashboard/metrics', async (c) => {
  try {
    const timeRange = c.req.query('timeRange') || '30d';
    const metrics = c.req.query('metrics')?.split(',') || ['risks', 'compliance', 'threats'];

    // Mock metrics data - replace with actual service calls
    const metricsData = {
      risks: {
        timeSeries: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          total: 150 + Math.floor(Math.random() * 20),
          critical: 8 + Math.floor(Math.random() * 5),
          resolved: 120 + Math.floor(Math.random() * 10)
        }))
      },
      compliance: {
        scores: [
          { framework: 'ISO 27001', score: 89, target: 95 },
          { framework: 'SOC 2', score: 92, target: 95 },
          { framework: 'NIST CSF', score: 85, target: 90 },
          { framework: 'GDPR', score: 91, target: 95 }
        ]
      },
      threats: {
        distribution: [
          { category: 'spoofing', count: 15 },
          { category: 'tampering', count: 12 },
          { category: 'repudiation', count: 8 },
          { category: 'information_disclosure', count: 25 },
          { category: 'denial_of_service', count: 18 },
          { category: 'elevation_of_privilege', count: 22 }
        ]
      }
    };

    const filteredMetrics = metrics.reduce((acc, metric) => {
      if (metricsData[metric as keyof typeof metricsData]) {
        acc[metric] = metricsData[metric as keyof typeof metricsData];
      }
      return acc;
    }, {} as any);

    return c.json(createResponse(true, filteredMetrics, undefined, 'Dashboard metrics retrieved', c.get('requestId')));
  } catch (error) {
    return c.json(createResponse(false, null, 'Failed to retrieve dashboard metrics'), 500);
  }
})

// =============================================================================
// WEBSOCKET CONNECTIONS
// =============================================================================

api.get('/api/ws', async (c) => {
  // WebSocket upgrade handling
  const upgradeHeader = c.req.header('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return c.json(createResponse(false, null, 'WebSocket upgrade required'), 400);
  }

  const payload = c.get('jwtPayload');
  const userId = payload.userId;

  // This would be handled by the WebSocket server
  // For now, return connection info
  return c.json(createResponse(true, {
    message: 'WebSocket connection endpoint',
    userId,
    endpoint: '/api/ws'
  }, undefined, 'WebSocket endpoint info', c.get('requestId')));
})

// =============================================================================
// ERROR HANDLING
// =============================================================================

api.onError((err, c) => {
  console.error('API Error:', err);
  
  return c.json(createResponse(false, null, 'Internal server error', err.message, c.get('requestId')), 500);
})

api.notFound((c) => {
  return c.json(createResponse(false, null, 'Endpoint not found'), 404);
})

export default api