// DMT Risk Assessment System v2.0 - API Routes
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AuthService, authMiddleware, requireRole, ARIAAssistant, SecurityUtils, RiskScoring } from './auth';
import { CloudflareBindings, Risk, Control, ComplianceAssessment, Incident, ESGMetric, DashboardData, ApiResponse, CreateRiskRequest, CreateControlRequest } from './types';

export function createAPI() {
  const api = new Hono<{ Bindings: CloudflareBindings }>();

  // CORS middleware
  api.use('/api/*', cors({
    origin: ['http://localhost:3000', 'https://*.pages.dev'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }));

  // Authentication Routes
  api.post('/api/auth/login', async (c) => {
    try {
      const { username, password } = await c.req.json();
      
      if (!username || !password) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Username and password are required' 
        }, 400);
      }

      const authService = new AuthService(c.env.DB);
      const result = await authService.authenticate({ username, password });
      
      return c.json<ApiResponse<typeof result>>({ 
        success: true, 
        data: result,
        message: 'Login successful'
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Authentication failed' 
      }, 401);
    }
  });

  api.get('/api/auth/me', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      const authService = new AuthService(c.env.DB);
      const userData = await authService.getUserById(user.id);
      
      return c.json<ApiResponse<typeof userData>>({ 
        success: true, 
        data: userData 
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to fetch user data' 
      }, 500);
    }
  });

  // Dashboard Analytics
  api.get('/api/dashboard', authMiddleware, async (c) => {
    try {
      const db = c.env.DB;

      // Get dashboard metrics
      const totalRisks = await db.prepare('SELECT COUNT(*) as count FROM risks WHERE status = ?').bind('active').first<{count: number}>();
      const highRisks = await db.prepare('SELECT COUNT(*) as count FROM risks WHERE status = ? AND risk_score >= ?').bind('active', 15).first<{count: number}>();
      const openFindings = await db.prepare('SELECT COUNT(*) as count FROM assessment_findings WHERE status IN (?, ?)').bind('open', 'in_progress').first<{count: number}>();
      
      // Calculate compliance score (percentage of compliant requirements)
      const complianceData = await db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN compliance_status = 'compliant' THEN 1 ELSE 0 END) as compliant
        FROM compliance_requirements
      `).first<{total: number, compliant: number}>();
      
      const complianceScore = complianceData?.total ? Math.round((complianceData.compliant / complianceData.total) * 100) : 0;

      // Get top risks
      const topRisks = await db.prepare(`
        SELECT r.*, c.name as category_name, u.first_name, u.last_name
        FROM risks r
        LEFT JOIN risk_categories c ON r.category_id = c.id
        LEFT JOIN users u ON r.owner_id = u.id
        WHERE r.status = 'active'
        ORDER BY r.risk_score DESC
        LIMIT 5
      `).all<Risk & {category_name: string, first_name: string, last_name: string}>();

      // Get recent incidents
      const recentIncidents = await db.prepare(`
        SELECT i.*, u.first_name, u.last_name
        FROM incidents i
        LEFT JOIN users u ON i.assigned_to = u.id
        WHERE i.status NOT IN ('closed')
        ORDER BY i.created_at DESC
        LIMIT 5
      `).all<Incident & {first_name: string, last_name: string}>();

      // Get risk trend data (simplified for demo)
      const riskTrend = [
        { date: '2024-07-01', score: 12.5 },
        { date: '2024-07-08', score: 13.2 },
        { date: '2024-07-15', score: 11.8 },
        { date: '2024-07-22', score: 14.1 },
        { date: '2024-07-29', score: 12.9 },
        { date: '2024-08-05', score: 13.7 },
        { date: '2024-08-12', score: 12.3 }
      ];

      // Get control effectiveness by framework
      const controlEffectiveness = await db.prepare(`
        SELECT 
          framework,
          COUNT(*) as total,
          SUM(CASE WHEN operating_effectiveness = 'effective' THEN 1 ELSE 0 END) as effective
        FROM controls
        WHERE status = 'active'
        GROUP BY framework
      `).all<{framework: string, total: number, effective: number}>();

      // Get ESG summary
      const esgSummary = await db.prepare(`
        SELECT 
          metric_type,
          AVG(CASE WHEN target_value > 0 THEN (current_value / target_value) * 100 ELSE 0 END) as score
        FROM esg_metrics
        GROUP BY metric_type
      `).all<{metric_type: string, score: number}>();

      const dashboardData: DashboardData = {
        total_risks: totalRisks?.count || 0,
        high_risks: highRisks?.count || 0,
        open_findings: openFindings?.count || 0,
        compliance_score: complianceScore,
        risk_trend: riskTrend,
        top_risks: topRisks.results || [],
        recent_incidents: recentIncidents.results || [],
        control_effectiveness: controlEffectiveness.results || [],
        esg_summary: esgSummary.results || []
      };

      return c.json<ApiResponse<DashboardData>>({ 
        success: true, 
        data: dashboardData 
      });
    } catch (error) {
      console.error('Dashboard error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to fetch dashboard data' 
      }, 500);
    }
  });

  // Risk Management API
  api.get('/api/risks', authMiddleware, async (c) => {
    try {
      const page = Number(c.req.query('page')) || 1;
      const limit = Number(c.req.query('limit')) || 20;
      const offset = (page - 1) * limit;

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

      return c.json<ApiResponse<typeof risks.results>>({ 
        success: true, 
        data: risks.results,
        total: totalCount?.count || 0,
        page,
        limit
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to fetch risks' 
      }, 500);
    }
  });

  api.post('/api/risks', authMiddleware, requireRole(['admin', 'risk_manager']), async (c) => {
    try {
      const user = c.get('user');
      const riskData: CreateRiskRequest = await c.req.json();

      // Generate unique risk ID
      const riskId = SecurityUtils.generateSecureId('DMT', 'RISK');

      // Calculate risk score
      const riskScore = RiskScoring.calculateRiskScore(riskData.probability, riskData.impact);

      const result = await c.env.DB.prepare(`
        INSERT INTO risks (
          risk_id, title, description, category_id, organization_id, owner_id,
          status, risk_type, probability, impact, risk_score, root_cause,
          potential_impact, treatment_strategy, mitigation_plan, identified_date,
          next_review_date, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        riskId, riskData.title, riskData.description, riskData.category_id,
        riskData.organization_id, riskData.owner_id, 'active', 'inherent',
        riskData.probability, riskData.impact, riskScore, riskData.root_cause,
        riskData.potential_impact, riskData.treatment_strategy, riskData.mitigation_plan,
        riskData.identified_date, riskData.next_review_date, user.id
      ).run();

      return c.json<ApiResponse<{id: number, risk_id: string}>>({ 
        success: true, 
        data: { id: result.meta.last_row_id as number, risk_id: riskId },
        message: 'Risk created successfully' 
      }, 201);
    } catch (error) {
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to create risk' 
      }, 500);
    }
  });

  // Controls Management API
  api.get('/api/controls', authMiddleware, async (c) => {
    try {
      const page = Number(c.req.query('page')) || 1;
      const limit = Number(c.req.query('limit')) || 20;
      const offset = (page - 1) * limit;

      const controls = await c.env.DB.prepare(`
        SELECT c.*, o.name as organization_name, u.first_name, u.last_name
        FROM controls c
        LEFT JOIN organizations o ON c.organization_id = o.id
        LEFT JOIN users u ON c.owner_id = u.id
        ORDER BY c.framework, c.control_id
        LIMIT ? OFFSET ?
      `).bind(limit, offset).all();

      const totalCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM controls').first<{count: number}>();

      return c.json<ApiResponse<typeof controls.results>>({ 
        success: true, 
        data: controls.results,
        total: totalCount?.count || 0,
        page,
        limit
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to fetch controls' 
      }, 500);
    }
  });

  api.post('/api/controls', authMiddleware, requireRole(['admin', 'risk_manager', 'compliance_officer']), async (c) => {
    try {
      const user = c.get('user');
      const controlData: CreateControlRequest = await c.req.json();

      // Generate unique control ID
      const controlId = SecurityUtils.generateSecureId('DMT', 'CTRL');

      const result = await c.env.DB.prepare(`
        INSERT INTO controls (
          control_id, name, description, control_type, control_category,
          framework, control_family, control_objective, frequency,
          automation_level, owner_id, organization_id, design_effectiveness,
          operating_effectiveness, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        controlId, controlData.name, controlData.description, controlData.control_type,
        controlData.control_category, controlData.framework, controlData.control_family,
        controlData.control_objective, controlData.frequency, controlData.automation_level,
        controlData.owner_id, controlData.organization_id, 'effective', 'not_tested', 'active'
      ).run();

      return c.json<ApiResponse<{id: number, control_id: string}>>({ 
        success: true, 
        data: { id: result.meta.last_row_id as number, control_id: controlId },
        message: 'Control created successfully' 
      }, 201);
    } catch (error) {
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to create control' 
      }, 500);
    }
  });

  // Compliance Management API
  api.get('/api/assessments', authMiddleware, async (c) => {
    try {
      const assessments = await c.env.DB.prepare(`
        SELECT a.*, o.name as organization_name, u.first_name, u.last_name
        FROM compliance_assessments a
        LEFT JOIN organizations o ON a.organization_id = o.id
        LEFT JOIN users u ON a.lead_assessor_id = u.id
        ORDER BY a.created_at DESC
      `).all();

      return c.json<ApiResponse<typeof assessments.results>>({ 
        success: true, 
        data: assessments.results 
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to fetch assessments' 
      }, 500);
    }
  });

  // Incidents Management API
  api.get('/api/incidents', authMiddleware, async (c) => {
    try {
      const incidents = await c.env.DB.prepare(`
        SELECT i.*, u1.first_name as assigned_first_name, u1.last_name as assigned_last_name,
               u2.first_name as reporter_first_name, u2.last_name as reporter_last_name
        FROM incidents i
        LEFT JOIN users u1 ON i.assigned_to = u1.id
        LEFT JOIN users u2 ON i.created_by = u2.id
        ORDER BY i.severity DESC, i.created_at DESC
      `).all();

      return c.json<ApiResponse<typeof incidents.results>>({ 
        success: true, 
        data: incidents.results 
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to fetch incidents' 
      }, 500);
    }
  });

  // ESG Management API
  api.get('/api/esg', authMiddleware, async (c) => {
    try {
      const metrics = await c.env.DB.prepare(`
        SELECT e.*, o.name as organization_name, u.first_name, u.last_name
        FROM esg_metrics e
        LEFT JOIN organizations o ON e.organization_id = o.id
        LEFT JOIN users u ON e.owner_id = u.id
        ORDER BY e.metric_type, e.metric_name
      `).all();

      return c.json<ApiResponse<typeof metrics.results>>({ 
        success: true, 
        data: metrics.results 
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to fetch ESG metrics' 
      }, 500);
    }
  });

  // AI Assistant (ARIA) API
  api.post('/api/aria/query', authMiddleware, async (c) => {
    try {
      const { query } = await c.req.json();
      const user = c.get('user');

      if (!query) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Query is required' 
        }, 400);
      }

      const aria = new ARIAAssistant(c.env.AI, c.env.DB);
      const response = await aria.processSecurityQuery(query, user);

      return c.json<ApiResponse<{response: string}>>({ 
        success: true, 
        data: { response } 
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to process ARIA query' 
      }, 500);
    }
  });

  // Reporting and Analytics
  api.get('/api/reports/risk-heatmap', authMiddleware, async (c) => {
    try {
      const heatmapData = await c.env.DB.prepare(`
        SELECT 
          rc.name as category,
          r.probability,
          r.impact,
          COUNT(*) as count
        FROM risks r
        JOIN risk_categories rc ON r.category_id = rc.id
        WHERE r.status = 'active'
        GROUP BY rc.name, r.probability, r.impact
        ORDER BY r.probability DESC, r.impact DESC
      `).all();

      return c.json<ApiResponse<typeof heatmapData.results>>({ 
        success: true, 
        data: heatmapData.results 
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to generate risk heatmap' 
      }, 500);
    }
  });

  // Workflow Management (simplified)
  api.get('/api/workflows', authMiddleware, async (c) => {
    try {
      const workflows = await c.env.DB.prepare(`
        SELECT w.*, o.name as organization_name, u.first_name, u.last_name
        FROM workflows w
        LEFT JOIN organizations o ON w.organization_id = o.id
        LEFT JOIN users u ON w.created_by = u.id
        WHERE w.is_active = TRUE
        ORDER BY w.name
      `).all();

      return c.json<ApiResponse<typeof workflows.results>>({ 
        success: true, 
        data: workflows.results 
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to fetch workflows' 
      }, 500);
    }
  });

  return api;
}