// DMT Risk Assessment System v2.0 - API Routes
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { AuthService, authMiddleware, requireRole, ARIAAssistant, SecurityUtils, RiskScoring } from './auth';
import { CloudflareBindings, Risk, Control, ComplianceAssessment, Incident, DashboardData, ApiResponse, CreateRiskRequest, CreateControlRequest } from './types';
import { createEnterpriseAPI } from './enterprise-api';

export function createAPI() {
  const api = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Mount enterprise API routes
  const enterpriseAPI = createEnterpriseAPI();
  api.route('/', enterpriseAPI);

  // CORS middleware
  api.use('/api/*', cors({
    origin: ['http://localhost:3000', 'https://*.pages.dev'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }));

  // Health check endpoint
  api.get('/api/health', (c) => {
    return c.json<ApiResponse<{status: string, timestamp: string}>>({ 
      success: true, 
      data: { 
        status: 'healthy', 
        timestamp: new Date().toISOString() 
      },
      message: 'API is running'
    });
  });

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



      const dashboardData: DashboardData = {
        total_risks: totalRisks?.count || 0,
        high_risks: highRisks?.count || 0,
        open_findings: openFindings?.count || 0,
        compliance_score: complianceScore,
        risk_trend: riskTrend,
        top_risks: topRisks.results || [],
        recent_incidents: recentIncidents.results || [],
        control_effectiveness: controlEffectiveness.results || []
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

  api.get('/api/risks/:id', authMiddleware, async (c) => {
    try {
      const id = c.req.param('id');
      const risk = await c.env.DB.prepare(`
        SELECT r.*, c.name as category_name, o.name as organization_name, 
               u.first_name, u.last_name
        FROM risks r
        LEFT JOIN risk_categories c ON r.category_id = c.id
        LEFT JOIN organizations o ON r.organization_id = o.id
        LEFT JOIN users u ON r.owner_id = u.id
        WHERE r.id = ?
      `).bind(id).first();

      if (!risk) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Risk not found' 
        }, 404);
      }

      return c.json<ApiResponse<typeof risk>>({ 
        success: true, 
        data: risk 
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to fetch risk' 
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
      console.error('Create risk error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to create risk' 
      }, 500);
    }
  });

  api.put('/api/risks/:id', authMiddleware, requireRole(['admin', 'risk_manager']), async (c) => {
    try {
      const id = c.req.param('id');
      const riskData = await c.req.json();

      // Calculate risk score if probability or impact changed
      let riskScore = riskData.risk_score;
      if (riskData.probability && riskData.impact) {
        riskScore = RiskScoring.calculateRiskScore(riskData.probability, riskData.impact);
      }

      const result = await c.env.DB.prepare(`
        UPDATE risks SET
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          category_id = COALESCE(?, category_id),
          organization_id = COALESCE(?, organization_id),
          owner_id = COALESCE(?, owner_id),
          status = COALESCE(?, status),
          probability = COALESCE(?, probability),
          impact = COALESCE(?, impact),
          risk_score = COALESCE(?, risk_score),
          root_cause = COALESCE(?, root_cause),
          potential_impact = COALESCE(?, potential_impact),
          treatment_strategy = COALESCE(?, treatment_strategy),
          mitigation_plan = COALESCE(?, mitigation_plan),
          next_review_date = COALESCE(?, next_review_date),
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        riskData.title, riskData.description, riskData.category_id,
        riskData.organization_id, riskData.owner_id, riskData.status,
        riskData.probability, riskData.impact, riskScore, riskData.root_cause,
        riskData.potential_impact, riskData.treatment_strategy, riskData.mitigation_plan,
        riskData.next_review_date, id
      ).run();

      if (result.changes === 0) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Risk not found' 
        }, 404);
      }

      return c.json<ApiResponse<{updated: boolean}>>({ 
        success: true, 
        data: { updated: true },
        message: 'Risk updated successfully' 
      });
    } catch (error) {
      console.error('Update risk error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to update risk' 
      }, 500);
    }
  });

  api.delete('/api/risks/:id', authMiddleware, requireRole(['admin', 'risk_manager']), async (c) => {
    try {
      const id = c.req.param('id');
      
      const result = await c.env.DB.prepare('DELETE FROM risks WHERE id = ?').bind(id).run();
      
      if (result.changes === 0) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Risk not found' 
        }, 404);
      }

      return c.json<ApiResponse<{deleted: boolean}>>({ 
        success: true, 
        data: { deleted: true },
        message: 'Risk deleted successfully' 
      });
    } catch (error) {
      console.error('Delete risk error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to delete risk' 
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

  api.get('/api/controls/:id', authMiddleware, async (c) => {
    try {
      const id = c.req.param('id');
      const control = await c.env.DB.prepare(`
        SELECT c.*, o.name as organization_name, u.first_name, u.last_name
        FROM controls c
        LEFT JOIN organizations o ON c.organization_id = o.id
        LEFT JOIN users u ON c.owner_id = u.id
        WHERE c.id = ?
      `).bind(id).first();

      if (!control) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Control not found' 
        }, 404);
      }

      return c.json<ApiResponse<typeof control>>({ 
        success: true, 
        data: control 
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to fetch control' 
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
      console.error('Create control error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to create control' 
      }, 500);
    }
  });

  api.put('/api/controls/:id', authMiddleware, requireRole(['admin', 'risk_manager', 'compliance_officer']), async (c) => {
    try {
      const id = c.req.param('id');
      const controlData = await c.req.json();

      const result = await c.env.DB.prepare(`
        UPDATE controls SET
          name = COALESCE(?, name),
          description = COALESCE(?, description),
          control_type = COALESCE(?, control_type),
          control_category = COALESCE(?, control_category),
          framework = COALESCE(?, framework),
          control_family = COALESCE(?, control_family),
          control_objective = COALESCE(?, control_objective),
          frequency = COALESCE(?, frequency),
          automation_level = COALESCE(?, automation_level),
          owner_id = COALESCE(?, owner_id),
          organization_id = COALESCE(?, organization_id),
          design_effectiveness = COALESCE(?, design_effectiveness),
          operating_effectiveness = COALESCE(?, operating_effectiveness),
          status = COALESCE(?, status),
          last_tested = COALESCE(?, last_tested),
          next_test_date = COALESCE(?, next_test_date),
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        controlData.name, controlData.description, controlData.control_type,
        controlData.control_category, controlData.framework, controlData.control_family,
        controlData.control_objective, controlData.frequency, controlData.automation_level,
        controlData.owner_id, controlData.organization_id, controlData.design_effectiveness,
        controlData.operating_effectiveness, controlData.status, controlData.last_tested,
        controlData.next_test_date, id
      ).run();

      if (result.changes === 0) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Control not found' 
        }, 404);
      }

      return c.json<ApiResponse<{updated: boolean}>>({ 
        success: true, 
        data: { updated: true },
        message: 'Control updated successfully' 
      });
    } catch (error) {
      console.error('Update control error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to update control' 
      }, 500);
    }
  });

  api.delete('/api/controls/:id', authMiddleware, requireRole(['admin', 'risk_manager', 'compliance_officer']), async (c) => {
    try {
      const id = c.req.param('id');
      
      const result = await c.env.DB.prepare('DELETE FROM controls WHERE id = ?').bind(id).run();
      
      if (result.changes === 0) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Control not found' 
        }, 404);
      }

      return c.json<ApiResponse<{deleted: boolean}>>({ 
        success: true, 
        data: { deleted: true },
        message: 'Control deleted successfully' 
      });
    } catch (error) {
      console.error('Delete control error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to delete control' 
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

  // Complete Compliance Assessments CRUD API
  api.get('/api/assessments/:id', authMiddleware, async (c) => {
    try {
      const id = c.req.param('id');
      const assessment = await c.env.DB.prepare(`
        SELECT a.*, o.name as organization_name, u.first_name, u.last_name
        FROM compliance_assessments a
        LEFT JOIN organizations o ON a.organization_id = o.id
        LEFT JOIN users u ON a.lead_assessor_id = u.id
        WHERE a.id = ?
      `).bind(id).first();

      if (!assessment) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Assessment not found' 
        }, 404);
      }

      return c.json<ApiResponse<typeof assessment>>({ 
        success: true, 
        data: assessment 
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to fetch assessment' 
      }, 500);
    }
  });

  api.post('/api/assessments', authMiddleware, requireRole(['admin', 'compliance_officer']), async (c) => {
    try {
      const user = c.get('user');
      const assessmentData = await c.req.json();

      // Generate unique assessment ID
      const assessmentId = SecurityUtils.generateSecureId('DMT', 'ASMT');

      const result = await c.env.DB.prepare(`
        INSERT INTO compliance_assessments (
          assessment_id, name, framework, description, organization_id,
          lead_assessor_id, status, planned_start_date, planned_end_date,
          actual_start_date, scope, methodology, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        assessmentId, assessmentData.name, assessmentData.framework, assessmentData.description,
        assessmentData.organization_id, assessmentData.lead_assessor_id, 'planning',
        assessmentData.planned_start_date, assessmentData.planned_end_date,
        assessmentData.actual_start_date, assessmentData.scope, assessmentData.methodology, user.id
      ).run();

      return c.json<ApiResponse<{id: number, assessment_id: string}>>({ 
        success: true, 
        data: { id: result.meta.last_row_id as number, assessment_id: assessmentId },
        message: 'Assessment created successfully' 
      }, 201);
    } catch (error) {
      console.error('Create assessment error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to create assessment' 
      }, 500);
    }
  });

  api.put('/api/assessments/:id', authMiddleware, requireRole(['admin', 'compliance_officer']), async (c) => {
    try {
      const id = c.req.param('id');
      const assessmentData = await c.req.json();

      const result = await c.env.DB.prepare(`
        UPDATE compliance_assessments SET
          name = COALESCE(?, name),
          framework = COALESCE(?, framework),
          description = COALESCE(?, description),
          organization_id = COALESCE(?, organization_id),
          lead_assessor_id = COALESCE(?, lead_assessor_id),
          status = COALESCE(?, status),
          planned_start_date = COALESCE(?, planned_start_date),
          planned_end_date = COALESCE(?, planned_end_date),
          actual_start_date = COALESCE(?, actual_start_date),
          actual_end_date = COALESCE(?, actual_end_date),
          scope = COALESCE(?, scope),
          methodology = COALESCE(?, methodology),
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        assessmentData.name, assessmentData.framework, assessmentData.description,
        assessmentData.organization_id, assessmentData.lead_assessor_id, assessmentData.status,
        assessmentData.planned_start_date, assessmentData.planned_end_date,
        assessmentData.actual_start_date, assessmentData.actual_end_date,
        assessmentData.scope, assessmentData.methodology, id
      ).run();

      if (result.changes === 0) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Assessment not found' 
        }, 404);
      }

      return c.json<ApiResponse<{updated: boolean}>>({ 
        success: true, 
        data: { updated: true },
        message: 'Assessment updated successfully' 
      });
    } catch (error) {
      console.error('Update assessment error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to update assessment' 
      }, 500);
    }
  });

  api.delete('/api/assessments/:id', authMiddleware, requireRole(['admin', 'compliance_officer']), async (c) => {
    try {
      const id = c.req.param('id');
      
      const result = await c.env.DB.prepare('DELETE FROM compliance_assessments WHERE id = ?').bind(id).run();
      
      if (result.changes === 0) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Assessment not found' 
        }, 404);
      }

      return c.json<ApiResponse<{deleted: boolean}>>({ 
        success: true, 
        data: { deleted: true },
        message: 'Assessment deleted successfully' 
      });
    } catch (error) {
      console.error('Delete assessment error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to delete assessment' 
      }, 500);
    }
  });

  // Complete Incidents Management CRUD API
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

  api.get('/api/incidents/:id', authMiddleware, async (c) => {
    try {
      const id = c.req.param('id');
      const incident = await c.env.DB.prepare(`
        SELECT i.*, u1.first_name as assigned_first_name, u1.last_name as assigned_last_name,
               u2.first_name as reporter_first_name, u2.last_name as reporter_last_name
        FROM incidents i
        LEFT JOIN users u1 ON i.assigned_to = u1.id
        LEFT JOIN users u2 ON i.created_by = u2.id
        WHERE i.id = ?
      `).bind(id).first();

      if (!incident) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Incident not found' 
        }, 404);
      }

      return c.json<ApiResponse<typeof incident>>({ 
        success: true, 
        data: incident 
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to fetch incident' 
      }, 500);
    }
  });

  api.post('/api/incidents', authMiddleware, requireRole(['admin', 'incident_manager', 'risk_manager']), async (c) => {
    try {
      const user = c.get('user');
      const incidentData = await c.req.json();

      // Generate unique incident ID
      const incidentId = SecurityUtils.generateSecureId('DMT', 'INC');

      const result = await c.env.DB.prepare(`
        INSERT INTO incidents (
          incident_id, title, description, incident_type, severity, status,
          assigned_to, reported_at, detection_method, initial_response,
          created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        incidentId, incidentData.title, incidentData.description, incidentData.incident_type,
        incidentData.severity, 'new', incidentData.assigned_to, incidentData.reported_at || new Date().toISOString(),
        incidentData.detection_method, incidentData.initial_response, user.id
      ).run();

      return c.json<ApiResponse<{id: number, incident_id: string}>>({ 
        success: true, 
        data: { id: result.meta.last_row_id as number, incident_id: incidentId },
        message: 'Incident created successfully' 
      }, 201);
    } catch (error) {
      console.error('Create incident error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to create incident' 
      }, 500);
    }
  });

  api.put('/api/incidents/:id', authMiddleware, requireRole(['admin', 'incident_manager', 'risk_manager']), async (c) => {
    try {
      const id = c.req.param('id');
      const incidentData = await c.req.json();

      const result = await c.env.DB.prepare(`
        UPDATE incidents SET
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          incident_type = COALESCE(?, incident_type),
          severity = COALESCE(?, severity),
          status = COALESCE(?, status),
          assigned_to = COALESCE(?, assigned_to),
          reported_at = COALESCE(?, reported_at),
          detection_method = COALESCE(?, detection_method),
          initial_response = COALESCE(?, initial_response),
          containment_actions = COALESCE(?, containment_actions),
          eradication_actions = COALESCE(?, eradication_actions),
          recovery_actions = COALESCE(?, recovery_actions),
          lessons_learned = COALESCE(?, lessons_learned),
          closed_at = COALESCE(?, closed_at),
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        incidentData.title, incidentData.description, incidentData.incident_type,
        incidentData.severity, incidentData.status, incidentData.assigned_to,
        incidentData.reported_at, incidentData.detection_method, incidentData.initial_response,
        incidentData.containment_actions, incidentData.eradication_actions,
        incidentData.recovery_actions, incidentData.lessons_learned,
        incidentData.closed_at, id
      ).run();

      if (result.changes === 0) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Incident not found' 
        }, 404);
      }

      return c.json<ApiResponse<{updated: boolean}>>({ 
        success: true, 
        data: { updated: true },
        message: 'Incident updated successfully' 
      });
    } catch (error) {
      console.error('Update incident error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to update incident' 
      }, 500);
    }
  });

  api.delete('/api/incidents/:id', authMiddleware, requireRole(['admin', 'incident_manager']), async (c) => {
    try {
      const id = c.req.param('id');
      
      const result = await c.env.DB.prepare('DELETE FROM incidents WHERE id = ?').bind(id).run();
      
      if (result.changes === 0) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Incident not found' 
        }, 404);
      }

      return c.json<ApiResponse<{deleted: boolean}>>({ 
        success: true, 
        data: { deleted: true },
        message: 'Incident deleted successfully' 
      });
    } catch (error) {
      console.error('Delete incident error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to delete incident' 
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

  // Reference Data API - for dropdowns and lookups
  api.get('/api/reference/categories', authMiddleware, async (c) => {
    try {
      const categories = await c.env.DB.prepare('SELECT * FROM risk_categories ORDER BY name').all();
      return c.json<ApiResponse<typeof categories.results>>({ 
        success: true, 
        data: categories.results 
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to fetch categories' 
      }, 500);
    }
  });

  api.get('/api/reference/organizations', authMiddleware, async (c) => {
    try {
      const organizations = await c.env.DB.prepare('SELECT * FROM organizations ORDER BY name').all();
      return c.json<ApiResponse<typeof organizations.results>>({ 
        success: true, 
        data: organizations.results 
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to fetch organizations' 
      }, 500);
    }
  });

  api.get('/api/reference/users', authMiddleware, async (c) => {
    try {
      const users = await c.env.DB.prepare('SELECT id, first_name, last_name, email, department FROM users WHERE is_active = 1 ORDER BY first_name, last_name').all();
      return c.json<ApiResponse<typeof users.results>>({ 
        success: true, 
        data: users.results 
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to fetch users' 
      }, 500);
    }
  });

  // Complete User Management CRUD API
  api.get('/api/users', authMiddleware, requireRole(['admin']), async (c) => {
    try {
      const page = Number(c.req.query('page')) || 1;
      const limit = Number(c.req.query('limit')) || 50;
      const offset = (page - 1) * limit;

      const users = await c.env.DB.prepare(`
        SELECT id, email, username, first_name, last_name, department, job_title, 
               phone, role, is_active, last_login, created_at, updated_at
        FROM users
        ORDER BY first_name, last_name
        LIMIT ? OFFSET ?
      `).bind(limit, offset).all();

      const totalCount = await c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first<{count: number}>();

      return c.json<ApiResponse<typeof users.results>>({ 
        success: true, 
        data: users.results,
        total: totalCount?.count || 0,
        page,
        limit
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to fetch users' 
      }, 500);
    }
  });

  api.get('/api/users/:id', authMiddleware, requireRole(['admin']), async (c) => {
    try {
      const id = c.req.param('id');
      const user = await c.env.DB.prepare(`
        SELECT id, email, username, first_name, last_name, department, job_title, 
               phone, role, is_active, last_login, created_at, updated_at
        FROM users
        WHERE id = ?
      `).bind(id).first();

      if (!user) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'User not found' 
        }, 404);
      }

      return c.json<ApiResponse<typeof user>>({ 
        success: true, 
        data: user 
      });
    } catch (error) {
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to fetch user' 
      }, 500);
    }
  });

  api.post('/api/users', authMiddleware, requireRole(['admin']), async (c) => {
    try {
      const userData = await c.req.json();

      // Validate required fields
      if (!userData.email || !userData.username || !userData.password || !userData.first_name || !userData.last_name || !userData.role) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Missing required fields: email, username, password, first_name, last_name, role' 
        }, 400);
      }

      // Check if username or email already exists
      const existingUser = await c.env.DB.prepare(
        'SELECT id FROM users WHERE username = ? OR email = ?'
      ).bind(userData.username, userData.email).first();

      if (existingUser) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Username or email already exists' 
        }, 400);
      }

      // Hash password (simple demo hash - in production use bcrypt)
      const passwordHash = Buffer.from(userData.password + 'salt').toString('base64');

      const result = await c.env.DB.prepare(`
        INSERT INTO users (
          email, username, password_hash, first_name, last_name, 
          department, job_title, phone, role, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        userData.email, userData.username, passwordHash, userData.first_name, userData.last_name,
        userData.department, userData.job_title, userData.phone, userData.role, 1
      ).run();

      return c.json<ApiResponse<{id: number}>>({ 
        success: true, 
        data: { id: result.meta.last_row_id as number },
        message: 'User created successfully' 
      }, 201);
    } catch (error) {
      console.error('Create user error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to create user' 
      }, 500);
    }
  });

  api.put('/api/users/:id', authMiddleware, requireRole(['admin']), async (c) => {
    try {
      const id = c.req.param('id');
      const userData = await c.req.json();

      // Check if email is being changed and if it already exists
      if (userData.email) {
        const existingUser = await c.env.DB.prepare(
          'SELECT id FROM users WHERE email = ? AND id != ?'
        ).bind(userData.email, id).first();

        if (existingUser) {
          return c.json<ApiResponse<null>>({ 
            success: false, 
            error: 'Email already exists' 
          }, 400);
        }
      }

      const result = await c.env.DB.prepare(`
        UPDATE users SET
          email = COALESCE(?, email),
          first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          department = COALESCE(?, department),
          job_title = COALESCE(?, job_title),
          phone = COALESCE(?, phone),
          role = COALESCE(?, role),
          is_active = COALESCE(?, is_active),
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        userData.email, userData.first_name, userData.last_name,
        userData.department, userData.job_title, userData.phone,
        userData.role, userData.is_active, id
      ).run();

      if (result.changes === 0) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'User not found' 
        }, 404);
      }

      return c.json<ApiResponse<{updated: boolean}>>({ 
        success: true, 
        data: { updated: true },
        message: 'User updated successfully' 
      });
    } catch (error) {
      console.error('Update user error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to update user' 
      }, 500);
    }
  });

  api.delete('/api/users/:id', authMiddleware, requireRole(['admin']), async (c) => {
    try {
      const id = c.req.param('id');
      const currentUser = c.get('user');

      // Prevent deleting self
      if (currentUser.id.toString() === id) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Cannot delete your own account' 
        }, 400);
      }

      // Soft delete - deactivate user instead of hard delete
      const result = await c.env.DB.prepare(`
        UPDATE users SET is_active = 0, updated_at = datetime('now') WHERE id = ?
      `).bind(id).run();

      if (result.changes === 0) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'User not found' 
        }, 404);
      }

      return c.json<ApiResponse<{deleted: boolean}>>({ 
        success: true, 
        data: { deleted: true },
        message: 'User deactivated successfully' 
      });
    } catch (error) {
      console.error('Delete user error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to delete user' 
      }, 500);
    }
  });

  api.post('/api/users/:id/reset-password', authMiddleware, requireRole(['admin']), async (c) => {
    try {
      const id = c.req.param('id');
      
      // Generate temporary password
      const tempPassword = 'TempPass' + Math.random().toString(36).substring(2, 8);
      const passwordHash = Buffer.from(tempPassword + 'salt').toString('base64');

      const result = await c.env.DB.prepare(`
        UPDATE users SET 
          password_hash = ?, 
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(passwordHash, id).run();

      if (result.changes === 0) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'User not found' 
        }, 404);
      }

      return c.json<ApiResponse<{temporary_password: string}>>({ 
        success: true, 
        data: { temporary_password: tempPassword },
        message: 'Password reset successfully' 
      });
    } catch (error) {
      console.error('Reset password error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to reset password' 
      }, 500);
    }
  });

  return api;
}