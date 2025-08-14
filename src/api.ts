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

      // First check if risks table has services columns, add if missing
      try {
        await c.env.DB.prepare(`
          ALTER TABLE risks ADD COLUMN related_services TEXT
        `).run();
      } catch (e) {
        // Column might already exist
      }
      
      try {
        await c.env.DB.prepare(`
          ALTER TABLE risks ADD COLUMN service_impact_factor TEXT DEFAULT 'none'
        `).run();
      } catch (e) {
        // Column might already exist
      }

      const result = await c.env.DB.prepare(`
        INSERT INTO risks (
          risk_id, title, description, category_id, organization_id, owner_id,
          status, risk_type, probability, impact, risk_score, root_cause,
          potential_impact, treatment_strategy, mitigation_plan, identified_date,
          next_review_date, related_services, service_impact_factor, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        riskId, riskData.title, riskData.description, riskData.category_id,
        riskData.organization_id, riskData.owner_id, 'active', 'inherent',
        riskData.probability, riskData.impact, riskScore, riskData.root_cause,
        riskData.potential_impact, riskData.treatment_strategy, riskData.mitigation_plan,
        riskData.identified_date, riskData.next_review_date, riskData.related_services || null,
        riskData.service_impact_factor || 'none', user.id
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
          related_services = COALESCE(?, related_services),
          service_impact_factor = COALESCE(?, service_impact_factor),
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        riskData.title, riskData.description, riskData.category_id,
        riskData.organization_id, riskData.owner_id, riskData.status,
        riskData.probability, riskData.impact, riskScore, riskData.root_cause,
        riskData.potential_impact, riskData.treatment_strategy, riskData.mitigation_plan,
        riskData.next_review_date, riskData.related_services, riskData.service_impact_factor, id
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
               phone, role, is_active, last_login, auth_provider, created_at, updated_at
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
          department, job_title, phone, role, auth_provider, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        userData.email, userData.username, passwordHash, userData.first_name, userData.last_name,
        userData.department, userData.job_title, userData.phone, userData.role, 
        userData.auth_provider || 'local', 1
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
          auth_provider = COALESCE(?, auth_provider),
          is_active = COALESCE(?, is_active),
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        userData.email, userData.first_name, userData.last_name,
        userData.department, userData.job_title, userData.phone,
        userData.role, userData.auth_provider, userData.is_active, id
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
      
      // Generate complex temporary password
      const tempPassword = generateComplexPassword();
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
        message: 'Complex password generated successfully' 
      });
    } catch (error) {
      console.error('Reset password error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to reset password' 
      }, 500);
    }
  });

  // Password generation endpoint for frontend use
  api.get('/api/generate-password', authMiddleware, requireRole(['admin']), async (c) => {
    try {
      const length = parseInt(c.req.query('length') || '16');
      const includeSymbols = c.req.query('symbols') !== 'false';
      const includeNumbers = c.req.query('numbers') !== 'false';
      const includeUppercase = c.req.query('uppercase') !== 'false';
      const includeLowercase = c.req.query('lowercase') !== 'false';
      
      const password = generateComplexPassword(length, {
        includeSymbols,
        includeNumbers,
        includeUppercase,
        includeLowercase
      });

      return c.json<ApiResponse<{password: string, strength: string}>>({ 
        success: true, 
        data: { 
          password,
          strength: calculatePasswordStrength(password)
        },
        message: 'Password generated successfully' 
      });
    } catch (error) {
      console.error('Generate password error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to generate password' 
      }, 500);
    }
  });

  // Requirements API endpoints
  api.get('/api/requirements', authMiddleware, async (c) => {
    try {
      // Create requirements table if it doesn't exist
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS requirements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          requirement_id TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          framework TEXT NOT NULL,
          category TEXT,
          status TEXT NOT NULL DEFAULT 'not_assessed',
          owner_id INTEGER,
          due_date DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (owner_id) REFERENCES users(id)
        )
      `).run();

      const results = await c.env.DB.prepare(`
        SELECT r.*, u.first_name || ' ' || u.last_name as owner_name
        FROM requirements r
        LEFT JOIN users u ON r.owner_id = u.id
        ORDER BY r.created_at DESC
      `).all();

      return c.json<ApiResponse<any[]>>({ 
        success: true, 
        data: results.results || [] 
      });
    } catch (error) {
      console.error('Get requirements error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to fetch requirements' 
      }, 500);
    }
  });

  api.post('/api/requirements', authMiddleware, async (c) => {
    try {
      const data = await c.req.json();
      const user = c.get('user');
      
      // Create requirements table if it doesn't exist
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS requirements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          requirement_id TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          framework TEXT NOT NULL,
          category TEXT,
          status TEXT NOT NULL DEFAULT 'not_assessed',
          owner_id INTEGER,
          due_date DATE,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (owner_id) REFERENCES users(id)
        )
      `).run();

      const result = await c.env.DB.prepare(`
        INSERT INTO requirements (requirement_id, title, description, framework, category, status, owner_id, due_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        data.requirement_id,
        data.title,
        data.description,
        data.framework,
        data.category,
        data.status,
        user?.id || null,
        data.due_date || null
      ).run();

      return c.json<ApiResponse<{id: number}>>({ 
        success: true, 
        data: { id: result.meta.last_row_id as number },
        message: 'Requirement created successfully' 
      });
    } catch (error) {
      console.error('Create requirement error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to create requirement' 
      }, 500);
    }
  });

  api.delete('/api/requirements/:id', authMiddleware, async (c) => {
    try {
      const id = c.req.param('id');
      
      const result = await c.env.DB.prepare(`
        DELETE FROM requirements WHERE id = ?
      `).bind(id).run();

      if (result.changes === 0) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Requirement not found' 
        }, 404);
      }

      return c.json<ApiResponse<{deleted: boolean}>>({ 
        success: true, 
        data: { deleted: true },
        message: 'Requirement deleted successfully' 
      });
    } catch (error) {
      console.error('Delete requirement error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to delete requirement' 
      }, 500);
    }
  });

  // Findings API endpoints
  api.get('/api/findings', authMiddleware, async (c) => {
    try {
      // Create findings table if it doesn't exist
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS findings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          finding_id TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          severity TEXT NOT NULL,
          category TEXT,
          status TEXT NOT NULL DEFAULT 'open',
          assigned_to INTEGER,
          due_date DATE,
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (assigned_to) REFERENCES users(id),
          FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `).run();

      const results = await c.env.DB.prepare(`
        SELECT f.*, u.first_name || ' ' || u.last_name as assigned_to_name
        FROM findings f
        LEFT JOIN users u ON f.assigned_to = u.id
        ORDER BY f.created_at DESC
      `).all();

      return c.json<ApiResponse<any[]>>({ 
        success: true, 
        data: results.results || [] 
      });
    } catch (error) {
      console.error('Get findings error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to fetch findings' 
      }, 500);
    }
  });

  api.post('/api/findings', authMiddleware, async (c) => {
    try {
      const data = await c.req.json();
      const user = c.get('user');
      
      // Create findings table if it doesn't exist
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS findings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          finding_id TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          severity TEXT NOT NULL,
          category TEXT,
          status TEXT NOT NULL DEFAULT 'open',
          assigned_to INTEGER,
          due_date DATE,
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (assigned_to) REFERENCES users(id),
          FOREIGN KEY (created_by) REFERENCES users(id)
        )
      `).run();

      const result = await c.env.DB.prepare(`
        INSERT INTO findings (finding_id, title, description, severity, category, status, assigned_to, due_date, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        data.finding_id,
        data.title,
        data.description,
        data.severity,
        data.category,
        data.status,
        user?.id || null, // For now, assign to creator
        data.due_date || null,
        user?.id || null
      ).run();

      return c.json<ApiResponse<{id: number}>>({ 
        success: true, 
        data: { id: result.meta.last_row_id as number },
        message: 'Finding created successfully' 
      });
    } catch (error) {
      console.error('Create finding error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to create finding' 
      }, 500);
    }
  });

  api.delete('/api/findings/:id', authMiddleware, async (c) => {
    try {
      const id = c.req.param('id');
      
      const result = await c.env.DB.prepare(`
        DELETE FROM findings WHERE id = ?
      `).bind(id).run();

      if (result.changes === 0) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Finding not found' 
        }, 404);
      }

      return c.json<ApiResponse<{deleted: boolean}>>({ 
        success: true, 
        data: { deleted: true },
        message: 'Finding deleted successfully' 
      });
    } catch (error) {
      console.error('Delete finding error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to delete finding' 
      }, 500);
    }
  });

  // Framework Import endpoints
  api.post('/api/import/framework/:framework', authMiddleware, requireRole(['admin', 'compliance_officer']), async (c) => {
    try {
      const framework = c.req.param('framework');
      
      if (framework === 'iso27001') {
        await importISO27001Framework(c.env.DB);
      } else if (framework === 'uae_ia') {
        await importUAEIAFramework(c.env.DB);
      } else {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Unsupported framework' 
        }, 400);
      }

      return c.json<ApiResponse<{imported: boolean}>>({ 
        success: true, 
        data: { imported: true },
        message: `${framework.toUpperCase()} framework imported successfully` 
      });
    } catch (error) {
      console.error('Framework import error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to import framework' 
      }, 500);
    }
  });

  // Organizations API endpoints
  api.get('/api/organizations', authMiddleware, async (c) => {
    try {
      const results = await c.env.DB.prepare(`
        SELECT o.*, 
               COUNT(a.id) as asset_count
        FROM organizations o
        LEFT JOIN assets a ON o.id = a.organization_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `).all();

      return c.json<ApiResponse<any[]>>({ 
        success: true, 
        data: results.results || [] 
      });
    } catch (error) {
      console.error('Get organizations error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to fetch organizations' 
      }, 500);
    }
  });

  api.post('/api/organizations', authMiddleware, async (c) => {
    try {
      const data = await c.req.json();
      
      // Create organizations table if it doesn't exist
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS organizations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          code TEXT,
          department TEXT,
          location TEXT,
          contact_email TEXT,
          description TEXT,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      const result = await c.env.DB.prepare(`
        INSERT INTO organizations (name, code, department, location, contact_email, description)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        data.name,
        data.code,
        data.department,
        data.location,
        data.contact_email,
        data.description
      ).run();

      return c.json<ApiResponse<{id: number}>>({ 
        success: true, 
        data: { id: result.meta.last_row_id as number },
        message: 'Organization created successfully' 
      });
    } catch (error) {
      console.error('Create organization error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to create organization' 
      }, 500);
    }
  });

  api.delete('/api/organizations/:id', authMiddleware, async (c) => {
    try {
      const id = c.req.param('id');
      
      const result = await c.env.DB.prepare(`
        DELETE FROM organizations WHERE id = ?
      `).bind(id).run();

      if (result.changes === 0) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Organization not found' 
        }, 404);
      }

      return c.json<ApiResponse<{deleted: boolean}>>({ 
        success: true, 
        data: { deleted: true },
        message: 'Organization deleted successfully' 
      });
    } catch (error) {
      console.error('Delete organization error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to delete organization' 
      }, 500);
    }
  });

  // Risk Owners API endpoints
  api.get('/api/risk-owners', authMiddleware, async (c) => {
    try {
      const results = await c.env.DB.prepare(`
        SELECT ro.*, 
               COUNT(r.id) as risks_assigned,
               COUNT(CASE WHEN r.likelihood = 'High' OR r.impact = 'High' THEN 1 END) as high_priority_risks
        FROM risk_owners ro
        LEFT JOIN risks r ON ro.id = r.owner_id
        GROUP BY ro.id
        ORDER BY ro.created_at DESC
      `).all();

      return c.json<ApiResponse<any[]>>({ 
        success: true, 
        data: results.results || [] 
      });
    } catch (error) {
      console.error('Get risk owners error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to fetch risk owners' 
      }, 500);
    }
  });

  api.post('/api/risk-owners', authMiddleware, async (c) => {
    try {
      const data = await c.req.json();
      
      // Create risk_owners table if it doesn't exist
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS risk_owners (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          first_name TEXT NOT NULL,
          last_name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          phone TEXT,
          job_title TEXT,
          department TEXT,
          is_active INTEGER DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      const result = await c.env.DB.prepare(`
        INSERT INTO risk_owners (first_name, last_name, email, phone, job_title, department)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        data.first_name,
        data.last_name,
        data.email,
        data.phone,
        data.job_title,
        data.department
      ).run();

      return c.json<ApiResponse<{id: number}>>({ 
        success: true, 
        data: { id: result.meta.last_row_id as number },
        message: 'Risk owner created successfully' 
      });
    } catch (error) {
      console.error('Create risk owner error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to create risk owner' 
      }, 500);
    }
  });

  api.delete('/api/risk-owners/:id', authMiddleware, async (c) => {
    try {
      const id = c.req.param('id');
      
      const result = await c.env.DB.prepare(`
        DELETE FROM risk_owners WHERE id = ?
      `).bind(id).run();

      if (result.changes === 0) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Risk owner not found' 
        }, 404);
      }

      return c.json<ApiResponse<{deleted: boolean}>>({ 
        success: true, 
        data: { deleted: true },
        message: 'Risk owner deleted successfully' 
      });
    } catch (error) {
      console.error('Delete risk owner error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to delete risk owner' 
      }, 500);
    }
  });

  // Services API endpoints
  // Services API endpoints are handled by enterprise-api.ts

  api.delete('/api/services/:id', authMiddleware, async (c) => {
    try {
      const id = c.req.param('id');
      
      // Delete service asset links first
      await c.env.DB.prepare(`
        DELETE FROM service_assets WHERE service_id = ?
      `).bind(id).run();
      
      // Delete the service
      const result = await c.env.DB.prepare(`
        DELETE FROM services WHERE id = ?
      `).bind(id).run();

      if (result.changes === 0) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Service not found' 
        }, 404);
      }

      return c.json<ApiResponse<{deleted: boolean}>>({ 
        success: true, 
        data: { deleted: true },
        message: 'Service deleted successfully' 
      });
    } catch (error) {
      console.error('Delete service error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to delete service' 
      }, 500);
    }
  });

  api.post('/api/services/:id/calculate-risk', authMiddleware, async (c) => {
    try {
      const id = c.req.param('id');
      
      // Get all assets linked to this service
      const linkedAssets = await c.env.DB.prepare(`
        SELECT a.risk_score, a.criticality_level 
        FROM assets a
        JOIN service_assets sa ON a.id = sa.asset_id
        WHERE sa.service_id = ?
      `).bind(id).all();

      let riskScore = 0;
      let riskRating = 'Low';
      
      if (linkedAssets.results && linkedAssets.results.length > 0) {
        // Calculate average risk score from linked assets
        const totalRisk = linkedAssets.results.reduce((sum: number, asset: any) => 
          sum + (asset.risk_score || 0), 0);
        riskScore = Math.round(totalRisk / linkedAssets.results.length);
        
        // Determine risk rating based on score
        if (riskScore >= 80) riskRating = 'Critical';
        else if (riskScore >= 60) riskRating = 'High';
        else if (riskScore >= 40) riskRating = 'Medium';
        else riskRating = 'Low';
      } else {
        // Default risk for services without linked assets
        riskScore = 30;
        riskRating = 'Medium';
      }

      // Update the service
      const result = await c.env.DB.prepare(`
        UPDATE services SET 
          risk_score = ?,
          risk_rating = ?,
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(riskScore, riskRating, id).run();

      if (result.changes === 0) {
        return c.json<ApiResponse<null>>({ 
          success: false, 
          error: 'Service not found' 
        }, 404);
      }

      return c.json<ApiResponse<{risk_score: number, risk_rating: string}>>({ 
        success: true, 
        data: { risk_score: riskScore, risk_rating: riskRating },
        message: 'Service risk calculated successfully' 
      });
    } catch (error) {
      console.error('Calculate service risk error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to calculate service risk' 
      }, 500);
    }
  });

  api.post('/api/services/import-from-assets', authMiddleware, async (c) => {
    try {
      const user = c.get('user');
      
      // Get all assets that don't already have a service
      const assets = await c.env.DB.prepare(`
        SELECT a.id, a.name, a.asset_type, a.risk_score, a.organization_id
        FROM assets a
        WHERE a.service_id IS NULL
      `).all();

      let imported = 0;
      
      if (assets.results && assets.results.length > 0) {
        for (const asset of assets.results as any[]) {
          // Create service based on asset
          const serviceName = `${asset.name} Service`;
          const serviceType = asset.asset_type === 'Server' ? 'infrastructure' : 
                            asset.asset_type === 'Database' ? 'database' : 
                            asset.asset_type === 'Application' ? 'application' : 'infrastructure';
          
          // Convert risk_score to criticality
          let criticality = 'medium';
          if (asset.risk_score >= 80) criticality = 'critical';
          else if (asset.risk_score >= 60) criticality = 'high';
          else if (asset.risk_score >= 40) criticality = 'medium';
          else criticality = 'low';

          // Convert risk_score to risk_rating (0-5 scale)
          const riskRating = Math.min(5, Math.max(0, (asset.risk_score || 50) / 20));

          const serviceResult = await c.env.DB.prepare(`
            INSERT INTO services (
              service_id, name, description, service_type, criticality, 
              service_owner_id, organization_id, status, risk_rating, 
              availability_requirement, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `).bind(
            `SVC-${String(asset.id).padStart(3, '0')}`,
            serviceName,
            `Service generated from asset: ${asset.name}`,
            serviceType,
            criticality,
            user?.id || null,
            asset.organization_id || 1,
            'active',
            riskRating,
            99.0
          ).run();

          // Update the asset to link it to this service
          if (serviceResult.meta.last_row_id) {
            await c.env.DB.prepare(`
              UPDATE assets SET service_id = ? WHERE id = ?
            `).bind(serviceResult.meta.last_row_id, asset.id).run();
          }

          imported++;
        }
      }

      return c.json<ApiResponse<{imported: number}>>({ 
        success: true, 
        data: { imported },
        message: `${imported} services imported successfully from assets` 
      });
    } catch (error) {
      console.error('Import services error:', error);
      return c.json<ApiResponse<null>>({ 
        success: false, 
        error: 'Failed to import services from assets' 
      }, 500);
    }
  });

  return api;
}

// Password generation utility functions
function generateComplexPassword(length: number = 16, options: {
  includeSymbols?: boolean;
  includeNumbers?: boolean;
  includeUppercase?: boolean;
  includeLowercase?: boolean;
} = {}): string {
  const {
    includeSymbols = true,
    includeNumbers = true,
    includeUppercase = true,
    includeLowercase = true
  } = options;

  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  let charset = '';
  let requiredChars = '';

  if (includeLowercase) {
    charset += lowercase;
    requiredChars += lowercase[Math.floor(Math.random() * lowercase.length)];
  }
  if (includeUppercase) {
    charset += uppercase;
    requiredChars += uppercase[Math.floor(Math.random() * uppercase.length)];
  }
  if (includeNumbers) {
    charset += numbers;
    requiredChars += numbers[Math.floor(Math.random() * numbers.length)];
  }
  if (includeSymbols) {
    charset += symbols;
    requiredChars += symbols[Math.floor(Math.random() * symbols.length)];
  }

  if (!charset) {
    throw new Error('At least one character type must be enabled');
  }

  // Generate remaining characters
  let password = requiredChars;
  for (let i = requiredChars.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle the password to avoid predictable patterns
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

function calculatePasswordStrength(password: string): string {
  let score = 0;
  
  // Length scoring
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  
  // Character variety scoring
  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  
  // Pattern penalties
  if (/(.)\1{2,}/.test(password)) score -= 1; // Repeated characters
  if (/123|abc|qwe/i.test(password)) score -= 1; // Common sequences
  
  if (score >= 6) return 'Very Strong';
  if (score >= 4) return 'Strong';
  if (score >= 3) return 'Medium';
  if (score >= 2) return 'Weak';
  return 'Very Weak';
}

// Framework import functions
async function importISO27001Framework(db: any) {
  // Create required tables if they don't exist
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS compliance_assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      framework TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'planning',
      lead_assessor_id INTEGER,
      organization_id INTEGER,
      planned_start_date DATE,
      planned_end_date DATE,
      actual_start_date DATE,
      actual_end_date DATE,
      scope TEXT,
      methodology TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_assessor_id) REFERENCES users(id),
      FOREIGN KEY (organization_id) REFERENCES organizations(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `).run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requirement_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      framework TEXT NOT NULL,
      category TEXT,
      status TEXT NOT NULL DEFAULT 'not_assessed',
      owner_id INTEGER,
      due_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `).run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS controls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      control_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      control_type TEXT NOT NULL DEFAULT 'preventive',
      implementation_status TEXT NOT NULL DEFAULT 'not_implemented',
      effectiveness_rating INTEGER DEFAULT 0,
      owner_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `).run();

  // Create the assessment
  const assessmentResult = await db.prepare(`
    INSERT OR REPLACE INTO compliance_assessments (
      assessment_id, title, description, framework, status, 
      planned_start_date, planned_end_date, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    'ISO27001-2024-001',
    'ISO 27001:2022 Information Security Management Assessment',
    'Comprehensive assessment against ISO 27001:2022 standard covering all control domains',
    'ISO27001',
    'planning',
    new Date().toISOString().split('T')[0],
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 90 days from now
  ).run();

  // Import complete ISO 27001:2022 controls set (93 controls)
  const iso27001Controls = [
    // A.5 Organizational controls
    { id: 'A.5.1', title: 'Policies for information security', description: 'Information security policy and topic-specific policies shall be defined, approved by management, published, communicated to and acknowledged by relevant personnel and relevant external parties, and reviewed at planned intervals or if significant changes occur.', category: 'Organizational controls' },
    { id: 'A.5.2', title: 'Information security roles and responsibilities', description: 'Information security roles and responsibilities shall be defined and allocated according to the organization needs.', category: 'Organizational controls' },
    { id: 'A.5.3', title: 'Segregation of duties', description: 'Conflicting duties and conflicting areas of responsibility shall be segregated.', category: 'Organizational controls' },
    { id: 'A.5.4', title: 'Management responsibilities', description: 'Management shall require all personnel to apply information security in accordance with the established policies and procedures of the organization.', category: 'Organizational controls' },
    { id: 'A.5.5', title: 'Contact with authorities', description: 'Appropriate contacts with relevant authorities shall be maintained.', category: 'Organizational controls' },
    { id: 'A.5.6', title: 'Contact with special interest groups', description: 'Appropriate contacts with special interest groups or other specialist security forums and professional associations shall be maintained.', category: 'Organizational controls' },
    { id: 'A.5.7', title: 'Threat intelligence', description: 'Information relating to information security threats shall be collected and analysed to produce threat intelligence.', category: 'Organizational controls' },
    { id: 'A.5.8', title: 'Information security in project management', description: 'Information security shall be integrated into project management.', category: 'Organizational controls' },
    { id: 'A.5.9', title: 'Inventory of information and other associated assets', description: 'An inventory of information and other associated assets, including owners, shall be developed and maintained.', category: 'Organizational controls' },
    { id: 'A.5.10', title: 'Acceptable use of information and other associated assets', description: 'Rules for the acceptable use and procedures for handling information and other associated assets shall be identified, documented and implemented.', category: 'Organizational controls' },
    { id: 'A.5.11', title: 'Return of assets', description: 'Personnel and other interested parties as appropriate shall return all of the organization assets in their possession upon termination of their employment, contract or agreement.', category: 'Organizational controls' },
    { id: 'A.5.12', title: 'Classification of information', description: 'Information shall be classified according to the information security requirements of the organization based on confidentiality, integrity, availability and relevant interested party requirements.', category: 'Organizational controls' },
    { id: 'A.5.13', title: 'Labelling of information', description: 'An appropriate set of procedures for information labelling shall be developed and implemented in accordance with the information classification scheme adopted by the organization.', category: 'Organizational controls' },
    { id: 'A.5.14', title: 'Information transfer', description: 'Information transfer rules, procedures, or agreements shall be in place for all types of transfer facilities within the organization and between the organization and other parties.', category: 'Organizational controls' },
    { id: 'A.5.15', title: 'Access control', description: 'Rules to control physical and logical access to information and other associated assets shall be established and implemented based on business and information security requirements.', category: 'Organizational controls' },
    { id: 'A.5.16', title: 'Identity management', description: 'The full life cycle of identities shall be managed.', category: 'Organizational controls' },
    { id: 'A.5.17', title: 'Authentication information', description: 'Allocation and management of authentication information shall be controlled by a management process, including advising personnel on appropriate handling of authentication information.', category: 'Organizational controls' },
    { id: 'A.5.18', title: 'Access rights', description: 'Access rights to information and other associated assets shall be provisioned, reviewed, modified and removed in accordance with the organization topic-specific policy on access control.', category: 'Organizational controls' },
    { id: 'A.5.19', title: 'Information security in supplier relationships', description: 'Processes and procedures shall be defined and implemented to manage the information security risks associated with the use of supplier products or services.', category: 'Organizational controls' },
    { id: 'A.5.20', title: 'Addressing information security within supplier agreements', description: 'Relevant information security requirements shall be established and agreed with each supplier that may access, process, store, communicate, or provide IT infrastructure components for, the organization information.', category: 'Organizational controls' },
    { id: 'A.5.21', title: 'Managing information security in the ICT supply chain', description: 'Processes and procedures shall be defined and implemented to manage the information security risks associated with the ICT products and services supply chain.', category: 'Organizational controls' },
    { id: 'A.5.22', title: 'Monitoring, review and change management of supplier services', description: 'The organization shall regularly monitor, review, evaluate and manage change in supplier information security practices and service delivery.', category: 'Organizational controls' },
    { id: 'A.5.23', title: 'Information security for use of cloud services', description: 'Processes for acquisition, use, management and exit from cloud services shall be established in accordance with the organization information security requirements.', category: 'Organizational controls' },
    { id: 'A.5.24', title: 'Information security incident management planning and preparation', description: 'The organization shall plan and prepare for managing information security incidents by defining, establishing and communicating information security incident management processes, roles and responsibilities.', category: 'Organizational controls' },
    { id: 'A.5.25', title: 'Assessment and decision on information security events', description: 'The organization shall assess information security events and decide if they are to be categorized as information security incidents.', category: 'Organizational controls' },
    { id: 'A.5.26', title: 'Response to information security incidents', description: 'Information security incidents shall be responded to in accordance with the documented procedures.', category: 'Organizational controls' },
    { id: 'A.5.27', title: 'Learning from information security incidents', description: 'Knowledge gained from information security incidents shall be used to strengthen and improve the information security controls.', category: 'Organizational controls' },
    { id: 'A.5.28', title: 'Collection of evidence', description: 'The organization shall establish and implement procedures for the identification, collection, acquisition and preservation of information that can serve as evidence.', category: 'Organizational controls' },
    { id: 'A.5.29', title: 'Information security during disruption', description: 'The organization shall plan how to maintain information security at an appropriate level during disruption.', category: 'Organizational controls' },
    { id: 'A.5.30', title: 'ICT readiness for business continuity', description: 'ICT readiness shall be planned, implemented, maintained and tested based on business continuity objectives and ICT continuity requirements.', category: 'Organizational controls' },
    { id: 'A.5.31', title: 'Legal, statutory, regulatory and contractual requirements', description: 'Legal, statutory, regulatory and contractual requirements relevant to information security and the organization approach to meet these requirements shall be identified, documented and kept up to date.', category: 'Organizational controls' },
    { id: 'A.5.32', title: 'Intellectual property rights', description: 'The organization shall implement appropriate procedures to protect intellectual property rights.', category: 'Organizational controls' },
    { id: 'A.5.33', title: 'Protection of records', description: 'Records shall be protected from loss, destruction, falsification, unauthorized access and unauthorized release.', category: 'Organizational controls' },
    { id: 'A.5.34', title: 'Privacy and protection of PII', description: 'The organization shall identify and meet requirements regarding the preservation of privacy and protection of PII according to applicable laws and regulations and contractual requirements.', category: 'Organizational controls' },
    { id: 'A.5.35', title: 'Independent review of information security', description: 'The organization approach to managing information security and its implementation shall be reviewed independently at planned intervals or when significant changes occur.', category: 'Organizational controls' },
    { id: 'A.5.36', title: 'Compliance with policies, rules and standards for information security', description: 'Compliance with the organization information security policy, topic-specific policies, rules and standards shall be regularly reviewed.', category: 'Organizational controls' },
    { id: 'A.5.37', title: 'Documented operating procedures', description: 'Operating procedures for information processing facilities shall be documented and made available to personnel who need them.', category: 'Organizational controls' },
    
    // A.6 People controls  
    { id: 'A.6.1', title: 'Screening', description: 'Background verification checks on all candidates for employment shall be carried out in accordance with relevant laws, regulations and ethics and shall be proportional to the business requirements, the classification of the information to be accessed and the perceived risks.', category: 'People controls' },
    { id: 'A.6.2', title: 'Terms and conditions of employment', description: 'The employment contractual agreements shall state the personnel and the organization responsibilities for information security.', category: 'People controls' },
    { id: 'A.6.3', title: 'Information security awareness, education and training', description: 'Personnel of the organization and relevant interested parties shall receive appropriate information security awareness, education and training and regular updates of the organization information security policy, topic-specific policies and procedures, as relevant for their job function.', category: 'People controls' },
    { id: 'A.6.4', title: 'Disciplinary process', description: 'A disciplinary process shall be formalized and communicated to take actions against personnel and other relevant interested parties who have committed an information security policy violation.', category: 'People controls' },
    { id: 'A.6.5', title: 'Responsibilities after termination or change of employment', description: 'Information security responsibilities and duties that remain valid after termination or change of employment shall be defined, enforced and communicated to relevant personnel and other interested parties.', category: 'People controls' },
    { id: 'A.6.6', title: 'Confidentiality or non-disclosure agreements', description: 'Confidentiality or non-disclosure agreements reflecting the organization needs for the protection of information shall be identified, documented, regularly reviewed and signed by personnel and other relevant interested parties.', category: 'People controls' },
    { id: 'A.6.7', title: 'Remote working', description: 'Security measures shall be defined and implemented when personnel are working remotely to protect information accessed, processed or stored at remote working sites.', category: 'People controls' },
    { id: 'A.6.8', title: 'Information security event reporting', description: 'The organization shall provide a mechanism for personnel to report observed or suspected information security events through appropriate channels in a timely manner.', category: 'People controls' },
    
    // A.7 Physical and environmental controls
    { id: 'A.7.1', title: 'Physical security perimeters', description: 'Physical security perimeters for areas containing information and other associated assets shall be defined and used.', category: 'Physical and environmental controls' },
    { id: 'A.7.2', title: 'Physical entry', description: 'Secure areas shall be protected by appropriate entry controls to ensure that only authorized personnel are allowed access.', category: 'Physical and environmental controls' },
    { id: 'A.7.3', title: 'Protection against environmental threats', description: 'Protection against environmental threats, such as natural disasters and other intentional or unintentional physical threats to infrastructure shall be designed and implemented.', category: 'Physical and environmental controls' },
    { id: 'A.7.4', title: 'Working in secure areas', description: 'Physical protection and guidelines for working in secure areas shall be designed and implemented.', category: 'Physical and environmental controls' },
    { id: 'A.7.5', title: 'Locking of rooms, drawers and cabinets', description: 'Rooms, drawers and cabinets containing information and other associated assets shall be physically protected against unauthorized access.', category: 'Physical and environmental controls' },
    { id: 'A.7.6', title: 'Secure disposal or reuse of equipment', description: 'Items of equipment containing information shall be verified to ensure that any sensitive information and licensed software is removed or securely overwritten prior to disposal or reuse.', category: 'Physical and environmental controls' },
    { id: 'A.7.7', title: 'Unattended user equipment', description: 'Users shall ensure that unattended equipment has appropriate protection.', category: 'Physical and environmental controls' },
    { id: 'A.7.8', title: 'Desk and screen clear', description: 'Clear desk rules for papers and removable storage media and clear screen rules for information processing facilities shall be defined and appropriately enforced.', category: 'Physical and environmental controls' },
    { id: 'A.7.9', title: 'Equipment siting and protection', description: 'Equipment shall be sited and protected to reduce the risks from environmental threats and hazards, and opportunities for unauthorized access.', category: 'Physical and environmental controls' },
    { id: 'A.7.10', title: 'Equipment maintenance', description: 'Equipment shall be correctly maintained to ensure its continued availability and integrity.', category: 'Physical and environmental controls' },
    { id: 'A.7.11', title: 'Supporting utilities', description: 'Information processing facilities shall be protected from power failures and other disruptions caused by failures in supporting utilities.', category: 'Physical and environmental controls' },
    { id: 'A.7.12', title: 'Cabling security', description: 'Cables carrying power, data or supporting information services shall be protected from interception, interference or damage.', category: 'Physical and environmental controls' },
    { id: 'A.7.13', title: 'Equipment removal', description: 'Information processing equipment, information or software shall not be taken off-site without prior authorization.', category: 'Physical and environmental controls' },
    { id: 'A.7.14', title: 'Secure disposal or reuse of information storage media', description: 'Information storage media shall be disposed of securely when no longer required, using formal procedures.', category: 'Physical and environmental controls' },
    
    // A.8 Technological controls (first 30 of 45 technological controls)
    { id: 'A.8.1', title: 'User endpoint devices', description: 'Information stored on, processed by or accessible via user endpoint devices shall be protected.', category: 'Technological controls' },
    { id: 'A.8.2', title: 'Privileged access rights', description: 'The allocation and use of privileged access rights shall be restricted and managed.', category: 'Technological controls' },
    { id: 'A.8.3', title: 'Information access restriction', description: 'Access to information and other associated assets shall be restricted in accordance with the established topic-specific policy on access control.', category: 'Technological controls' },
    { id: 'A.8.4', title: 'Access to source code', description: 'Read and write access to source code, development tools and software libraries shall be appropriately managed.', category: 'Technological controls' },
    { id: 'A.8.5', title: 'Secure authentication', description: 'Secure authentication technologies and procedures shall be implemented based on information access restrictions and the topic-specific policy on access control.', category: 'Technological controls' },
    { id: 'A.8.6', title: 'Capacity management', description: 'The use of resources shall be monitored and tuned, and projections of future capacity requirements shall be made to ensure the required system performance.', category: 'Technological controls' },
    { id: 'A.8.7', title: 'Protection against malware', description: 'Protection against malware shall be implemented and supported by appropriate user awareness.', category: 'Technological controls' },
    { id: 'A.8.8', title: 'Management of technical vulnerabilities', description: 'Information about technical vulnerabilities of information systems being used shall be obtained, the organization exposure to such vulnerabilities evaluated and appropriate measures taken to address the associated risk.', category: 'Technological controls' },
    { id: 'A.8.9', title: 'Configuration management', description: 'Configurations, including security configurations, of hardware, software, services and networks shall be established, documented, implemented, monitored and reviewed.', category: 'Technological controls' },
    { id: 'A.8.10', title: 'Information deletion', description: 'Information stored in information systems, devices or in any other storage media shall be deleted when no longer required.', category: 'Technological controls' },
    { id: 'A.8.11', title: 'Data masking', description: 'Data masking shall be used in accordance with the organization topic-specific policy on access control and other related topic-specific policies, and business requirements, taking applicable legislation into consideration.', category: 'Technological controls' },
    { id: 'A.8.12', title: 'Data leakage prevention', description: 'Data leakage prevention measures shall be applied to systems, networks and any other devices that process, store or transmit sensitive information.', category: 'Technological controls' },
    { id: 'A.8.13', title: 'Information backup', description: 'Backup copies of information, software and systems shall be maintained and regularly tested in accordance with the agreed topic-specific policy on backup.', category: 'Technological controls' },
    { id: 'A.8.14', title: 'Redundancy of information processing facilities', description: 'Information processing facilities shall be implemented with redundancy sufficient to meet availability requirements.', category: 'Technological controls' },
    { id: 'A.8.15', title: 'Logging', description: 'Logs that record activities, exceptions, faults and other relevant events shall be produced, stored, protected and analysed.', category: 'Technological controls' },
    { id: 'A.8.16', title: 'Monitoring activities', description: 'Networks, systems and applications shall be monitored for anomalous behaviour and appropriate actions taken to evaluate potential information security incidents.', category: 'Technological controls' },
    { id: 'A.8.17', title: 'Clock synchronization', description: 'The clocks of information processing systems used by the organization shall be synchronized to approved time sources.', category: 'Technological controls' },
    { id: 'A.8.18', title: 'Use of privileged utility programs', description: 'The use of utility programs that might be capable of overriding system and application controls shall be restricted and tightly controlled.', category: 'Technological controls' },
    { id: 'A.8.19', title: 'Installation of software on operational systems', description: 'Procedures shall be implemented to control the installation of software on operational systems.', category: 'Technological controls' },
    { id: 'A.8.20', title: 'Networks security', description: 'Networks and network devices shall be managed and controlled to protect information in systems and applications.', category: 'Technological controls' },
    { id: 'A.8.21', title: 'Security of network services', description: 'Security mechanisms, service levels and requirements of network services shall be identified, implemented and monitored.', category: 'Technological controls' },
    { id: 'A.8.22', title: 'Segregation of networks', description: 'Groups of information services, users and information systems shall be segregated in the organization networks.', category: 'Technological controls' },
    { id: 'A.8.23', title: 'Web filtering', description: 'Access to external websites shall be managed to reduce exposure to malicious content.', category: 'Technological controls' },
    { id: 'A.8.24', title: 'Use of cryptography', description: 'Rules for the effective use of cryptography, including cryptographic key management, shall be defined and implemented.', category: 'Technological controls' },
    { id: 'A.8.25', title: 'Secure system development life cycle', description: 'Rules for the secure development of software and systems shall be established and applied.', category: 'Technological controls' },
    { id: 'A.8.26', title: 'Application security requirements', description: 'Information security requirements shall be identified, specified and approved when developing or acquiring applications.', category: 'Technological controls' },
    { id: 'A.8.27', title: 'Secure system architecture and engineering principles', description: 'Principles for engineering secure systems shall be established, documented, maintained and applied to any information system development activities.', category: 'Technological controls' },
    { id: 'A.8.28', title: 'Secure coding', description: 'Secure coding principles shall be applied to software development.', category: 'Technological controls' },
    { id: 'A.8.29', title: 'Security testing in development and acceptance', description: 'Security testing processes shall be defined and implemented in the development life cycle.', category: 'Technological controls' },
    { id: 'A.8.30', title: 'Outsourced development', description: 'The organization shall direct, monitor and review the activities related to outsourced system development.', category: 'Technological controls' },
    { id: 'A.8.31', title: 'Separation of development, test and production environments', description: 'Development, testing and production environments shall be separated and secured.', category: 'Technological controls' },
    { id: 'A.8.32', title: 'Change management', description: 'Changes to information processing facilities and information systems shall be subject to change management procedures.', category: 'Technological controls' },
    { id: 'A.8.33', title: 'Test information', description: 'Test information shall be appropriately selected, protected and managed.', category: 'Technological controls' },
    { id: 'A.8.34', title: 'Protection of information systems during audit testing', description: 'Audit tests and other assurance activities involving assessment of operational systems shall be planned and agreed between the tester and appropriate management.', category: 'Technological controls' }
  ];

  // Import requirements
  for (const control of iso27001Controls) {
    await db.prepare(`
      INSERT OR REPLACE INTO requirements (
        requirement_id, title, description, framework, category, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(control.id, control.title, control.description, 'ISO27001', control.category, 'not_assessed').run();
  }

  // Import as controls as well
  for (const control of iso27001Controls) {
    await db.prepare(`
      INSERT OR REPLACE INTO controls (
        control_id, title, description, control_type, implementation_status, 
        effectiveness_rating, owner_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      control.id, 
      control.title, 
      control.description, 
      'preventive', 
      'not_implemented', 
      0, 
      null
    ).run();
  }
}

async function importUAEIAFramework(db: any) {
  // Create required tables if they don't exist (same as ISO 27001)
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS compliance_assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      assessment_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      framework TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'planning',
      lead_assessor_id INTEGER,
      organization_id INTEGER,
      planned_start_date DATE,
      planned_end_date DATE,
      actual_start_date DATE,
      actual_end_date DATE,
      scope TEXT,
      methodology TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_assessor_id) REFERENCES users(id),
      FOREIGN KEY (organization_id) REFERENCES organizations(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `).run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS requirements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      requirement_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      framework TEXT NOT NULL,
      category TEXT,
      status TEXT NOT NULL DEFAULT 'not_assessed',
      owner_id INTEGER,
      due_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `).run();

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS controls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      control_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      control_type TEXT NOT NULL DEFAULT 'preventive',
      implementation_status TEXT NOT NULL DEFAULT 'not_implemented',
      effectiveness_rating INTEGER DEFAULT 0,
      owner_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `).run();

  // Create the assessment
  const assessmentResult = await db.prepare(`
    INSERT OR REPLACE INTO compliance_assessments (
      assessment_id, title, description, framework, status, 
      planned_start_date, planned_end_date, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    'UAE-IA-2024-001',
    'UAE Information Assurance Standard Assessment',
    'Assessment against UAE Information Assurance Framework covering all mandatory controls',
    'UAE_IA',
    'planning',
    new Date().toISOString().split('T')[0],
    new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 120 days from now
  ).run();

  // Import comprehensive UAE IA Standard controls
  const uaeIAControls = [
    // 1. Governance and Risk Management
    { id: 'UAE-IA-1.1', title: 'Information Security Governance', description: 'Establish and maintain an information security governance framework that aligns with organizational objectives and regulatory requirements.', category: 'Governance and Risk Management' },
    { id: 'UAE-IA-1.2', title: 'Risk Management Framework', description: 'Implement a comprehensive risk management framework for information assets that includes risk identification, assessment, treatment, and monitoring.', category: 'Governance and Risk Management' },
    { id: 'UAE-IA-1.3', title: 'Business Continuity Management', description: 'Develop and maintain business continuity and disaster recovery plans to ensure operational resilience.', category: 'Governance and Risk Management' },
    { id: 'UAE-IA-1.4', title: 'Regulatory Compliance', description: 'Ensure compliance with all applicable UAE laws, regulations, and standards related to information security.', category: 'Governance and Risk Management' },
    { id: 'UAE-IA-1.5', title: 'Third-Party Risk Management', description: 'Assess and manage information security risks associated with third-party relationships and outsourcing arrangements.', category: 'Governance and Risk Management' },

    // 2. Policy and Procedures
    { id: 'UAE-IA-2.1', title: 'Security Policy Framework', description: 'Develop, implement, and maintain comprehensive information security policies that are approved by senior management.', category: 'Policy and Procedures' },
    { id: 'UAE-IA-2.2', title: 'Security Awareness and Training', description: 'Establish security awareness programs and provide regular training to all personnel on information security responsibilities.', category: 'Policy and Procedures' },
    { id: 'UAE-IA-2.3', title: 'Roles and Responsibilities', description: 'Define and document clear roles and responsibilities for information security across the organization.', category: 'Policy and Procedures' },
    { id: 'UAE-IA-2.4', title: 'Security Procedures', description: 'Develop detailed security procedures that support the implementation of security policies.', category: 'Policy and Procedures' },
    { id: 'UAE-IA-2.5', title: 'Document Management', description: 'Implement document management procedures to ensure security policies and procedures are current and accessible.', category: 'Policy and Procedures' },

    // 3. Asset Management
    { id: 'UAE-IA-3.1', title: 'Asset Inventory Management', description: 'Identify, classify, and maintain an accurate inventory of all information assets including their ownership and handling requirements.', category: 'Asset Management' },
    { id: 'UAE-IA-3.2', title: 'Data Classification and Handling', description: 'Classify information based on sensitivity and criticality levels and implement appropriate handling procedures.', category: 'Asset Management' },
    { id: 'UAE-IA-3.3', title: 'Asset Lifecycle Management', description: 'Manage information assets throughout their lifecycle from creation to secure disposal.', category: 'Asset Management' },
    { id: 'UAE-IA-3.4', title: 'Media Handling', description: 'Implement secure procedures for handling, storing, and disposing of information storage media.', category: 'Asset Management' },
    { id: 'UAE-IA-3.5', title: 'Asset Return Procedures', description: 'Establish procedures for the return of assets upon termination of employment or contracts.', category: 'Asset Management' },

    // 4. Access Control
    { id: 'UAE-IA-4.1', title: 'Access Control Policy', description: 'Implement access control mechanisms based on business requirements, security policies, and principle of least privilege.', category: 'Access Control' },
    { id: 'UAE-IA-4.2', title: 'User Access Management', description: 'Manage user access rights throughout the user lifecycle including provisioning, modification, and deprovisioning.', category: 'Access Control' },
    { id: 'UAE-IA-4.3', title: 'Privileged Access Management', description: 'Implement enhanced controls for privileged access including monitoring, logging, and approval processes.', category: 'Access Control' },
    { id: 'UAE-IA-4.4', title: 'Authentication and Authorization', description: 'Implement multi-factor authentication and robust authorization mechanisms for system access.', category: 'Access Control' },
    { id: 'UAE-IA-4.5', title: 'Remote Access Security', description: 'Secure remote access to organizational systems and information through encrypted connections and access controls.', category: 'Access Control' },
    { id: 'UAE-IA-4.6', title: 'Session Management', description: 'Implement secure session management controls including session timeouts and concurrent session limitations.', category: 'Access Control' },

    // 5. Cryptography and Data Protection
    { id: 'UAE-IA-5.1', title: 'Cryptographic Controls', description: 'Implement appropriate cryptographic controls to protect information confidentiality, integrity, and authenticity.', category: 'Cryptography and Data Protection' },
    { id: 'UAE-IA-5.2', title: 'Key Management', description: 'Establish secure cryptographic key management processes including generation, distribution, storage, and destruction.', category: 'Cryptography and Data Protection' },
    { id: 'UAE-IA-5.3', title: 'Data Loss Prevention', description: 'Implement data loss prevention measures to prevent unauthorized disclosure of sensitive information.', category: 'Cryptography and Data Protection' },
    { id: 'UAE-IA-5.4', title: 'Data Retention and Disposal', description: 'Implement secure data retention and disposal procedures in accordance with legal and business requirements.', category: 'Cryptography and Data Protection' },
    { id: 'UAE-IA-5.5', title: 'Backup and Recovery', description: 'Implement secure backup and recovery procedures to ensure data availability and integrity.', category: 'Cryptography and Data Protection' },

    // 6. Physical and Environmental Security
    { id: 'UAE-IA-6.1', title: 'Physical Security Perimeters', description: 'Establish physical security perimeters and access controls to protect facilities containing information systems.', category: 'Physical and Environmental Security' },
    { id: 'UAE-IA-6.2', title: 'Equipment Protection', description: 'Protect equipment from physical and environmental threats including theft, damage, and unauthorized access.', category: 'Physical and Environmental Security' },
    { id: 'UAE-IA-6.3', title: 'Environmental Controls', description: 'Implement environmental controls to protect against fire, flood, earthquake, and other natural disasters.', category: 'Physical and Environmental Security' },
    { id: 'UAE-IA-6.4', title: 'Secure Areas', description: 'Designate and secure areas containing critical information processing facilities with appropriate access controls.', category: 'Physical and Environmental Security' },
    { id: 'UAE-IA-6.5', title: 'Equipment Maintenance', description: 'Implement secure equipment maintenance procedures including authorized personnel and secure disposal.', category: 'Physical and Environmental Security' },

    // 7. Network and System Security
    { id: 'UAE-IA-7.1', title: 'Network Security Management', description: 'Implement network security controls including firewalls, intrusion detection, and network segmentation.', category: 'Network and System Security' },
    { id: 'UAE-IA-7.2', title: 'System Security Configuration', description: 'Implement secure system configurations and hardening procedures for all information systems.', category: 'Network and System Security' },
    { id: 'UAE-IA-7.3', title: 'Vulnerability Management', description: 'Implement vulnerability management processes including scanning, assessment, and remediation procedures.', category: 'Network and System Security' },
    { id: 'UAE-IA-7.4', title: 'Malware Protection', description: 'Implement comprehensive malware protection measures including prevention, detection, and response capabilities.', category: 'Network and System Security' },
    { id: 'UAE-IA-7.5', title: 'System Monitoring and Logging', description: 'Implement comprehensive system monitoring and logging capabilities to detect and respond to security events.', category: 'Network and System Security' },
    { id: 'UAE-IA-7.6', title: 'Wireless Network Security', description: 'Implement security controls for wireless networks including encryption, access control, and monitoring.', category: 'Network and System Security' },

    // 8. Application Security
    { id: 'UAE-IA-8.1', title: 'Secure Development Lifecycle', description: 'Implement secure software development practices throughout the application development lifecycle.', category: 'Application Security' },
    { id: 'UAE-IA-8.2', title: 'Application Security Testing', description: 'Perform regular security testing of applications including static and dynamic analysis.', category: 'Application Security' },
    { id: 'UAE-IA-8.3', title: 'Web Application Security', description: 'Implement security controls for web applications including input validation and output encoding.', category: 'Application Security' },
    { id: 'UAE-IA-8.4', title: 'Database Security', description: 'Implement database security controls including encryption, access control, and monitoring.', category: 'Application Security' },
    { id: 'UAE-IA-8.5', title: 'API Security', description: 'Implement security controls for application programming interfaces including authentication and rate limiting.', category: 'Application Security' },

    // 9. Incident Management
    { id: 'UAE-IA-9.1', title: 'Incident Response Planning', description: 'Establish and maintain an incident response capability with documented procedures and trained personnel.', category: 'Incident Management' },
    { id: 'UAE-IA-9.2', title: 'Incident Detection and Reporting', description: 'Implement incident detection mechanisms and establish reporting procedures for security incidents.', category: 'Incident Management' },
    { id: 'UAE-IA-9.3', title: 'Incident Response and Recovery', description: 'Respond to security incidents in accordance with established procedures and implement recovery measures.', category: 'Incident Management' },
    { id: 'UAE-IA-9.4', title: 'Forensic Investigation', description: 'Establish capabilities for forensic investigation of security incidents including evidence collection and analysis.', category: 'Incident Management' },
    { id: 'UAE-IA-9.5', title: 'Lessons Learned', description: 'Conduct post-incident reviews to identify lessons learned and improve security controls and procedures.', category: 'Incident Management' },

    // 10. Compliance and Audit
    { id: 'UAE-IA-10.1', title: 'Compliance Monitoring', description: 'Implement continuous monitoring processes to ensure ongoing compliance with information security requirements.', category: 'Compliance and Audit' },
    { id: 'UAE-IA-10.2', title: 'Internal Audit', description: 'Conduct regular internal audits of information security controls and management systems.', category: 'Compliance and Audit' },
    { id: 'UAE-IA-10.3', title: 'External Audit Coordination', description: 'Coordinate with external auditors and regulatory bodies for compliance assessments and inspections.', category: 'Compliance and Audit' },
    { id: 'UAE-IA-10.4', title: 'Corrective Actions', description: 'Implement corrective actions to address identified non-conformities and security control deficiencies.', category: 'Compliance and Audit' },
    { id: 'UAE-IA-10.5', title: 'Management Review', description: 'Conduct regular management reviews of the information security management system effectiveness.', category: 'Compliance and Audit' }
  ];

  // Import requirements
  for (const control of uaeIAControls) {
    await db.prepare(`
      INSERT OR REPLACE INTO requirements (
        requirement_id, title, description, framework, category, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(control.id, control.title, control.description, 'UAE_IA', control.category, 'not_assessed').run();
  }

  // Import as controls as well
  for (const control of uaeIAControls) {
    await db.prepare(`
      INSERT OR REPLACE INTO controls (
        control_id, title, description, control_type, implementation_status, 
        effectiveness_rating, owner_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(
      control.id, 
      control.title, 
      control.description, 
      'preventive', 
      'not_implemented', 
      0, 
      null
    ).run();
  }
}