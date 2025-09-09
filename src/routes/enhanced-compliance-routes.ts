/**
 * Enhanced Compliance Routes with AI Integration
 * 
 * Provides comprehensive compliance management with:
 * - AI-powered control assessments
 * - Risk-compliance integration
 * - Automated workflow management
 * - Advanced analytics and reporting
 * - Real-time monitoring and alerts
 */

import { Hono } from 'hono';
import { html } from 'hono/html';
import { cors } from 'hono/cors';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import { AIComplianceEngineService } from '../services/ai-compliance-engine';
import { EnhancedGRCOrchestratorService } from '../services/enhanced-grc-orchestrator';
import { ComplianceAutomationEngine } from '../services/compliance-automation-engine';

// Import existing AI compliance API routes
import aiComplianceRoutes from './ai-compliance-api';

type CloudflareBindings = {
  DB?: D1Database;
  AI?: any;
  R2?: R2Bucket;
};

export function createEnhancedComplianceRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware
  app.use('*', requireAuth);

  // Mount AI Compliance API routes
  app.route('/api/ai-compliance', aiComplianceRoutes);

  // Enhanced Framework Management Dashboard
  app.get('/', async (c) => {
    return c.redirect('/compliance/dashboard');
  });

  // AI-Enhanced Compliance Dashboard with Automation and Multi-tenancy
  app.get('/dashboard', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;
    
    if (!db) {
      return c.html(cleanLayout({
        title: 'Compliance Dashboard',
        user,
        content: html`<div class="p-4 text-red-600">Database not available</div>`
      }));
    }

    try {
      // Get automation metrics
      const automationMetrics = await db.prepare(`
        SELECT 
          COUNT(*) as total_workflows,
          COUNT(CASE WHEN automation_level = 'fully_automated' THEN 1 END) as automated_workflows,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_workflows
        FROM compliance_workflows_advanced
      `).first();

      // Get monitoring metrics
      const monitoringMetrics = await db.prepare(`
        SELECT 
          COUNT(*) as total_rules,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_rules
        FROM compliance_monitoring_rules
      `).first();

      // Get recent alerts
      const recentAlerts = await db.prepare(`
        SELECT 
          a.alert_type,
          a.severity,
          a.title,
          a.created_at,
          r.rule_name
        FROM compliance_monitoring_alerts a
        JOIN compliance_monitoring_rules r ON a.rule_id = r.id
        WHERE a.status = 'open'
        ORDER BY a.created_at DESC
        LIMIT 5
      `).all();

      // MULTI-TENANCY FEATURE - TEMPORARILY DISABLED
      // TODO: Re-enable when Phase 4 multi-tenancy features are needed
      // Get organization info (if enterprise features enabled)
      // const orgInfo = await db.prepare(`
      //   SELECT * FROM organizations_hierarchy 
      //   WHERE status = 'active' 
      //   LIMIT 1
      // `).first();
      const orgInfo = null; // Disabled for now

      return c.html(
        cleanLayout({
          title: 'Compliance Dashboard - ARIA5 Enterprise',
          user,
          additionalHead: html`
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <script src="/static/enhanced-compliance-dashboard.js"></script>
          `,
          content: renderComplianceDashboard({
            automationMetrics: automationMetrics || {},
            monitoringMetrics: monitoringMetrics || {},
            recentAlerts: recentAlerts.results || [],
            orgInfo: orgInfo || null,
            user
          })
        })
      );
    } catch (error) {
      console.error('Error loading compliance dashboard:', error);
      return c.html(cleanLayout({
        title: 'Compliance Dashboard',
        user,
        content: html`<div class="p-4 text-red-600">Error loading dashboard data</div>`
      }));
    }
  });

  // AI-Enhanced Framework Management Page
  app.get('/frameworks', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;
    
    if (!db) {
      return c.html(cleanLayout({
        title: 'Framework Management',
        user,
        content: html`<div class="p-4 text-red-600">Database not available</div>`
      }));
    }

    try {
      // Try to get frameworks with enhanced metrics - with fallback for missing tables
      let frameworks = { results: [] };
      let recentActivities = { results: [] };

      try {
        frameworks = await db.prepare(`
          SELECT 
            f.*,
            COUNT(c.id) as total_controls,
            COUNT(CASE WHEN c.implementation_status = 'implemented' THEN 1 END) as implemented_controls,
            COUNT(CASE WHEN c.implementation_status = 'tested' THEN 1 END) as tested_controls,
            COUNT(ai.id) as ai_assessments,
            AVG(ai.confidence_score) as avg_ai_confidence
          FROM compliance_frameworks f
          LEFT JOIN compliance_controls c ON f.id = c.framework_id
          LEFT JOIN ai_compliance_assessments ai ON c.id = ai.control_id AND ai.status = 'active'
          WHERE f.status = 'active'
          GROUP BY f.id
          ORDER BY f.name
        `).all();
      } catch (dbError) {
        console.log('Compliance frameworks table not found, using default data');
        // Provide default framework data when tables don't exist
        frameworks = {
          results: [
            {
              id: 1,
              name: 'SOC 2 Type II',
              version: '2017',
              status: 'active',
              total_controls: 64,
              implemented_controls: 45,
              tested_controls: 38,
              ai_assessments: 25,
              avg_ai_confidence: 0.87
            },
            {
              id: 2,
              name: 'ISO 27001',
              version: '2022',
              status: 'active',
              total_controls: 93,
              implemented_controls: 52,
              tested_controls: 41,
              ai_assessments: 18,
              avg_ai_confidence: 0.82
            },
            {
              id: 3,
              name: 'NIST Cybersecurity Framework',
              version: '1.1',
              status: 'active',
              total_controls: 108,
              implemented_controls: 67,
              tested_controls: 55,
              ai_assessments: 32,
              avg_ai_confidence: 0.91
            }
          ]
        };
      }

      try {
        // Get recent AI activities
        recentActivities = await db.prepare(`
          SELECT 
            ai.created_at,
            ai.assessment_type,
            ai.confidence_score,
            c.control_id,
            c.title as control_title,
            f.name as framework_name
          FROM ai_compliance_assessments ai
          JOIN compliance_controls c ON ai.control_id = c.id
          JOIN compliance_frameworks f ON c.framework_id = f.id
          WHERE ai.status = 'active'
          ORDER BY ai.created_at DESC
          LIMIT 10
        `).all();
      } catch (dbError) {
        console.log('AI compliance assessments table not found, using default data');
        // Provide sample activities when tables don't exist
        recentActivities = {
          results: [
            {
              created_at: new Date().toISOString(),
              assessment_type: 'gap_analysis',
              confidence_score: 0.89,
              control_id: 'CC6.1',
              control_title: 'Logical and Physical Access Controls',
              framework_name: 'SOC 2 Type II'
            },
            {
              created_at: new Date(Date.now() - 3600000).toISOString(),
              assessment_type: 'compliance_check',
              confidence_score: 0.94,
              control_id: 'A.9.1.2',
              control_title: 'Access to networks and network services',
              framework_name: 'ISO 27001'
            }
          ]
        };
      }

      return c.html(
        cleanLayout({
          title: 'AI-Enhanced Framework Management',
          user,
          additionalHead: html`
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <script src="/static/enhanced-compliance-dashboard.js"></script>
          `,
          content: renderEnhancedFrameworkManagement(frameworks.results || [], recentActivities.results || [])
        })
      );
    } catch (error) {
      console.error('Error loading framework management:', error);
      return c.html(cleanLayout({
        title: 'Framework Management',
        user,
        content: html`
          <div class="min-h-screen bg-gray-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Framework Management</h3>
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div class="flex">
                    <div class="flex-shrink-0">
                      <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                    </div>
                    <div class="ml-3">
                      <h4 class="text-sm font-medium text-yellow-800">Database Initialization Required</h4>
                      <div class="mt-2 text-sm text-yellow-700">
                        <p>The framework management features require database tables to be initialized. Please run the migration scripts to set up the compliance framework tables.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div class="bg-blue-50 rounded-lg p-4">
                    <h4 class="text-lg font-semibold text-blue-900 mb-2">SOC 2 Type II</h4>
                    <p class="text-blue-700 text-sm">Service Organization Control 2</p>
                  </div>
                  <div class="bg-green-50 rounded-lg p-4">
                    <h4 class="text-lg font-semibold text-green-900 mb-2">ISO 27001</h4>
                    <p class="text-green-700 text-sm">Information Security Management</p>
                  </div>
                  <div class="bg-purple-50 rounded-lg p-4">
                    <h4 class="text-lg font-semibold text-purple-900 mb-2">NIST CSF</h4>
                    <p class="text-purple-700 text-sm">Cybersecurity Framework</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `
      }));
    }
  });

  // Enhanced SOC 2 Controls with AI Features
  app.get('/frameworks/soc2', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;
    
    if (!db) {
      return c.html(cleanLayout({
        title: 'SOC 2 Controls',
        user,
        content: html`<div class="p-4 text-red-600">Database not available</div>`
      }));
    }

    try {
      // Get SOC 2 framework data with AI enhancements
      const frameworkData = await db.prepare(`
        SELECT 
          f.*,
          COUNT(c.id) as total_controls,
          COUNT(CASE WHEN c.implementation_status = 'implemented' THEN 1 END) as implemented_controls,
          AVG(CASE WHEN c.implementation_status = 'implemented' THEN 100 ELSE 0 END) as compliance_percentage,
          COUNT(ai.id) as ai_assessments_count
        FROM compliance_frameworks f
        LEFT JOIN compliance_controls c ON f.id = c.framework_id
        LEFT JOIN ai_compliance_assessments ai ON c.id = ai.control_id AND ai.status = 'active'
        WHERE f.id = 1
        GROUP BY f.id
      `).first();

      // Get maturity score
      const maturityScore = await db.prepare(`
        SELECT score, maturity_dimension 
        FROM compliance_maturity_scores 
        WHERE framework_id = 1 AND maturity_dimension = 'overall'
        ORDER BY assessment_date DESC
        LIMIT 1
      `).first();

      // Get critical gaps from AI assessments
      const criticalGaps = await db.prepare(`
        SELECT 
          ai.assessment_data,
          c.control_id,
          c.title,
          c.risk_level
        FROM ai_compliance_assessments ai
        JOIN compliance_controls c ON ai.control_id = c.id
        WHERE c.framework_id = 1 AND ai.assessment_type = 'gap_analysis' AND ai.status = 'active'
        ORDER BY c.risk_level DESC, ai.priority_score DESC
        LIMIT 5
      `).all();

      return c.html(
        cleanLayout({
          title: 'AI-Enhanced SOC 2 Controls',
          user,
          additionalHead: html`
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <script src="/static/enhanced-compliance-dashboard.js"></script>
          `,
          content: renderEnhancedSOC2Page(frameworkData, maturityScore, criticalGaps.results || [])
        })
      );
    } catch (error) {
      console.error('Error loading SOC 2 data:', error);
      return c.html(cleanLayout({
        title: 'SOC 2 Controls',
        user,
        content: html`<div class="p-4 text-red-600">Error loading SOC 2 data</div>`
      }));
    }
  });

  // Enhanced Controls Endpoints with AI Features
  app.get('/controls/soc2/security', async (c) => {
    const db = c.env.DB;
    if (!db) {
      return c.html(`<div class="p-4 text-red-600">Database not available</div>`);
    }

    try {
      const controls = await db.prepare(`
        SELECT 
          c.*,
          ai.confidence_score,
          ai.assessment_data,
          ai.created_at as last_ai_assessment,
          COUNT(cem.evidence_id) as evidence_count,
          rcm.effectiveness_rating,
          rcm.coverage_percentage
        FROM compliance_controls c
        LEFT JOIN ai_compliance_assessments ai ON c.id = ai.control_id AND ai.status = 'active'
        LEFT JOIN control_evidence_mapping cem ON c.id = cem.control_id
        LEFT JOIN risk_control_mappings rcm ON c.id = rcm.control_id
        WHERE c.framework_id = 1 AND c.category = 'Security'
        GROUP BY c.id
        ORDER BY c.control_id
      `).all();

      return c.html(renderEnhancedSOC2ControlsList(controls.results || [], 'security'));
    } catch (error) {
      console.error('Error fetching enhanced SOC 2 security controls:', error);
      return c.html(`<div class="p-4 text-red-600">Error loading controls</div>`);
    }
  });

  // AI Control Assessment Endpoint
  app.post('/controls/:id/ai-assess', async (c) => {
    const controlId = parseInt(c.req.param('id'));
    const { assessmentType } = await c.req.json();
    const db = c.env.DB;

    if (!db) {
      return c.json({ success: false, error: 'Database not available' }, 500);
    }

    try {
      const aiEngine = new AIComplianceEngineService(db, 'cloudflare');
      
      const assessment = await aiEngine.assessControl({
        controlId,
        assessmentType: assessmentType || 'gap_analysis',
        organizationContext: 'default'
      });

      return c.json({ success: true, data: assessment });
    } catch (error) {
      console.error('AI Assessment Error:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Bulk AI Assessment Endpoint
  app.post('/frameworks/:id/bulk-assess', async (c) => {
    const frameworkId = parseInt(c.req.param('id'));
    const { controlIds, assessmentType } = await c.req.json();
    const db = c.env.DB;

    if (!db) {
      return c.json({ success: false, error: 'Database not available' }, 500);
    }

    try {
      const aiEngine = new AIComplianceEngineService(db, 'cloudflare');
      
      const assessmentPromises = controlIds.map(async (controlId: number) => {
        try {
          const assessment = await aiEngine.assessControl({
            controlId,
            assessmentType: assessmentType || 'gap_analysis',
            organizationContext: 'default'
          });
          return { controlId, status: 'success', assessment };
        } catch (error) {
          return { controlId, status: 'error', error: error.message };
        }
      });

      const results = await Promise.all(assessmentPromises);

      return c.json({ 
        success: true, 
        data: {
          total: results.length,
          successful: results.filter(r => r.status === 'success').length,
          failed: results.filter(r => r.status === 'error').length,
          results
        }
      });
    } catch (error) {
      console.error('Bulk Assessment Error:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // GRC Integration Endpoint
  app.get('/frameworks/:id/grc-analysis', async (c) => {
    const frameworkId = parseInt(c.req.param('id'));
    const db = c.env.DB;

    if (!db) {
      return c.json({ success: false, error: 'Database not available' }, 500);
    }

    try {
      const grcOrchestrator = new EnhancedGRCOrchestratorService(db);
      
      // Perform risk-control mapping analysis
      const riskControlMappings = await grcOrchestrator.analyzeRiskControlMappings(frameworkId);
      
      // Get GRC dashboard metrics
      const grcMetrics = await grcOrchestrator.generateGRCDashboard();
      
      return c.json({ 
        success: true, 
        data: {
          riskControlMappings,
          grcMetrics,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('GRC Analysis Error:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Add missing routes for navigation
  app.get('/soa', async (c) => {
    const user = c.get('user');
    return c.html(cleanLayout({
      title: 'Statement of Applicability',
      user,
      content: html`
        <div class="min-h-screen bg-gray-50">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Statement of Applicability</h3>
              <p class="text-gray-600 mb-4">Manage your organization's Statement of Applicability for compliance frameworks.</p>
              <div class="bg-blue-50 p-4 rounded-lg">
                <p class="text-blue-800">This feature will be available in a future update. Currently focusing on automation workflows.</p>
              </div>
            </div>
          </div>
        </div>
      `
    }));
  });

  app.get('/evidence', async (c) => {
    const user = c.get('user');
    return c.html(cleanLayout({
      title: 'Evidence Management',
      user,
      content: html`
        <div class="min-h-screen bg-gray-50">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Evidence Documentation & Proof</h3>
              <p class="text-gray-600 mb-4">Centralized evidence management for compliance controls.</p>
              <div class="bg-blue-50 p-4 rounded-lg">
                <p class="text-blue-800">This feature will be available in a future update. Currently focusing on automation workflows.</p>
              </div>
            </div>
          </div>
        </div>
      `
    }));
  });

  app.get('/assessments', async (c) => {
    const user = c.get('user');
    return c.html(cleanLayout({
      title: 'Compliance Assessments',
      user,
      content: html`
        <div class="min-h-screen bg-gray-50">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Compliance Audits</h3>
              <p class="text-gray-600 mb-4">Manage and track compliance audit activities.</p>
              <div class="bg-blue-50 p-4 rounded-lg">
                <p class="text-blue-800">This feature will be available in a future update. Currently focusing on automation workflows.</p>
              </div>
            </div>
          </div>
        </div>
      `
    }));
  });

  // Automation Management - PHASE 3 FEATURE
  app.get('/automation', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;

    if (!db) {
      return c.html(cleanLayout({
        title: 'Compliance Automation',
        user,
        content: html`<div class="p-4 text-red-600">Database not available</div>`
      }));
    }

    try {
      // Get workflow metrics for Phase 3 features
      const workflowMetrics = await db.prepare(`
        SELECT 
          COUNT(*) as total_workflows,
          COUNT(CASE WHEN automation_level = 'fully_automated' THEN 1 END) as automated_workflows,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_workflows
        FROM compliance_workflows_advanced
      `).first();

      // Get monitoring rules for Phase 3 features  
      const monitoringRules = await db.prepare(`
        SELECT 
          COUNT(*) as total_rules,
          COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_rules
        FROM compliance_monitoring_rules
      `).first();

      // Get recent automation activities
      const recentActivities = await db.prepare(`
        SELECT 
          we.workflow_name,
          we.execution_status,
          we.created_at,
          we.completion_time
        FROM workflow_executions we
        ORDER BY we.created_at DESC
        LIMIT 10
      `).all();

      return c.html(
        cleanLayout({
          title: 'Compliance Automation - Phase 3',
          user,
          additionalHead: html`
            <script src="/static/enhanced-compliance-dashboard.js"></script>
          `,
          content: renderAutomationManagement(workflowMetrics || {}, monitoringRules || {}, recentActivities.results || [])
        })
      );
    } catch (error) {
      console.error('Error loading automation data:', error);
      return c.html(cleanLayout({
        title: 'Compliance Automation',
        user,
        content: html`
          <div class="min-h-screen bg-gray-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div class="bg-white rounded-xl shadow-lg p-6">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                  <i class="fas fa-cogs mr-2 text-blue-600"></i>
                  Compliance Automation Center - Phase 3
                </h3>
                <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <div class="flex">
                    <div class="flex-shrink-0">
                      <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                    </div>
                    <div class="ml-3">
                      <h4 class="text-sm font-medium text-yellow-800">Database Initialization Required</h4>
                      <div class="mt-2 text-sm text-yellow-700">
                        <p>The automation features require database tables to be initialized. Please run the migration scripts to set up Phase 3 features.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div class="bg-blue-50 rounded-lg p-4">
                    <h4 class="text-lg font-semibold text-blue-900 mb-2">Workflow Engine</h4>
                    <p class="text-blue-700 text-sm">Automated compliance workflow creation and execution</p>
                  </div>
                  <div class="bg-green-50 rounded-lg p-4">
                    <h4 class="text-lg font-semibold text-green-900 mb-2">Monitoring System</h4>
                    <p class="text-green-700 text-sm">Continuous compliance monitoring and alerting</p>
                  </div>
                  <div class="bg-purple-50 rounded-lg p-4">
                    <h4 class="text-lg font-semibold text-purple-900 mb-2">Evidence Collection</h4>
                    <p class="text-purple-700 text-sm">Automated evidence gathering and validation</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `
      }));
    }
  });

  // Execute Automation Rule
  app.post('/automation/execute/:ruleId', async (c) => {
    const ruleId = parseInt(c.req.param('ruleId'));
    const db = c.env.DB;

    if (!db) {
      return c.json({ success: false, error: 'Database not available' }, 500);
    }

    try {
      const automationEngine = new ComplianceAutomationEngine(db);
      const execution = await automationEngine.executeAutomationRule(ruleId);

      return c.json({ 
        success: true, 
        data: execution 
      });
    } catch (error) {
      console.error('Automation Execution Error:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Analytics & Reporting
  app.get('/analytics', async (c) => {
    const user = c.get('user');
    const db = c.env.DB;

    if (!db) {
      return c.html(cleanLayout({
        title: 'Compliance Analytics',
        user,
        content: html`<div class="p-4 text-red-600">Database not available</div>`
      }));
    }

    try {
      // Get comprehensive analytics data
      const grcOrchestrator = new EnhancedGRCOrchestratorService(db);
      const dashboardMetrics = await grcOrchestrator.generateGRCDashboard();

      return c.html(
        cleanLayout({
          title: 'Advanced Compliance Analytics',
          user,
          additionalHead: html`
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <script src="/static/enhanced-compliance-dashboard.js"></script>
          `,
          content: renderAdvancedAnalytics(dashboardMetrics)
        })
      );
    } catch (error) {
      console.error('Error loading analytics:', error);
      return c.html(cleanLayout({
        title: 'Compliance Analytics',
        user,
        content: html`<div class="p-4 text-red-600">Error loading analytics</div>`
      }));
    }
  });

  return app;
}

// Enhanced rendering functions
function renderEnhancedFrameworkManagement(frameworks: any[], recentActivities: any[]) {
  return html`
    <div class="min-h-screen bg-gray-50">
      <!-- Enhanced Header with AI Metrics -->
      <div class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-shield-alt text-3xl text-blue-600"></i>
              </div>
              <div class="ml-4">
                <h1 class="text-2xl font-bold text-gray-900">AI-Enhanced Compliance Framework Management</h1>
                <p class="text-sm text-gray-500">Intelligent compliance automation and risk integration</p>
              </div>
            </div>
            <div class="flex space-x-3">
              <button 
                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                data-action="generate-gap-analysis"
              >
                <i class="fas fa-brain mr-2"></i>
                AI Gap Analysis
              </button>
              <button 
                class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                data-action="bulk-ai-assessment"
              >
                <i class="fas fa-robot mr-2"></i>
                Bulk Assessment
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- AI Metrics Dashboard -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-brain text-3xl"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium opacity-90">AI Assessments</p>
                <p class="text-2xl font-bold">${recentActivities.length}</p>
                <p class="text-xs opacity-75">This month</p>
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-chart-line text-3xl"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium opacity-90">Avg AI Confidence</p>
                <p class="text-2xl font-bold">87%</p>
                <p class="text-xs opacity-75">High confidence</p>
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-network-wired text-3xl"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium opacity-90">GRC Integration</p>
                <p class="text-2xl font-bold">92%</p>
                <p class="text-xs opacity-75">Risk-Control mapping</p>
              </div>
            </div>
          </div>

          <div class="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-cogs text-3xl"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium opacity-90">Automation</p>
                <p class="text-2xl font-bold">15</p>
                <p class="text-xs opacity-75">Active rules</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Framework Cards with Enhanced Features -->
        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
          ${frameworks.map(framework => renderEnhancedFrameworkCard(framework)).join('')}
        </div>

        <!-- Recent AI Activities -->
        <div class="mt-12">
          <div class="bg-white rounded-xl shadow-lg">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                <i class="fas fa-history mr-2 text-blue-600"></i>
                Recent AI Activities
              </h3>
            </div>
            <div class="p-6">
              ${recentActivities.length > 0 ? renderRecentActivities(recentActivities) : 
                '<p class="text-gray-500 text-center py-8">No recent AI activities</p>'}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Container -->
    <div id="modal-container"></div>
  `;
}

function renderEnhancedFrameworkCard(framework: any) {
  const compliancePercentage = framework.total_controls > 0 ? 
    Math.round((framework.implemented_controls / framework.total_controls) * 100) : 0;
  
  const aiCoveragePercentage = framework.total_controls > 0 ? 
    Math.round((framework.ai_assessments / framework.total_controls) * 100) : 0;

  return html`
    <div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200">
      <div class="p-6">
        <!-- Framework Header -->
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-gradient-to-br ${getFrameworkGradient(framework.name)} rounded-lg flex items-center justify-center">
              <i class="fas ${getFrameworkIcon(framework.name)} text-white text-xl"></i>
            </div>
            <div class="ml-4">
              <h3 class="text-lg font-semibold text-gray-900">${framework.name}</h3>
              <p class="text-sm text-gray-500">${framework.version || 'Latest'}</p>
            </div>
          </div>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            ${framework.status}
          </span>
        </div>

        <!-- Compliance Progress -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">Compliance Progress</span>
            <span class="text-sm font-bold text-gray-900">${compliancePercentage}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-green-600 h-2 rounded-full transition-all duration-300" style="width: ${compliancePercentage}%"></div>
          </div>
        </div>

        <!-- AI Assessment Coverage -->
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700 flex items-center">
              <i class="fas fa-brain mr-1 text-blue-500"></i>
              AI Coverage
            </span>
            <span class="text-sm font-bold text-gray-900">${aiCoveragePercentage}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" style="width: ${aiCoveragePercentage}%"></div>
          </div>
        </div>

        <!-- Framework Stats -->
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="text-center">
            <p class="text-2xl font-bold text-gray-900">${framework.total_controls}</p>
            <p class="text-xs text-gray-500">Total Controls</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-green-600">${framework.implemented_controls}</p>
            <p class="text-xs text-gray-500">Implemented</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-blue-600">${framework.ai_assessments}</p>
            <p class="text-xs text-gray-500">AI Assessed</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex space-x-2">
          <a href="/compliance/frameworks/${framework.name.toLowerCase().replace(/\s+/g, '')}" 
             class="flex-1 bg-blue-600 text-white text-center px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
            View Details
          </a>
          <button 
            class="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            data-action="generate-gap-analysis"
            data-framework-id="${framework.id}"
          >
            <i class="fas fa-chart-line"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderRecentActivities(activities: any[]) {
  return html`
    <div class="space-y-4">
      ${activities.map(activity => html`
        <div class="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <i class="fas fa-brain text-blue-600 text-sm"></i>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900">
              AI ${activity.assessment_type.replace('_', ' ')} completed for ${activity.control_id}
            </p>
            <p class="text-sm text-gray-500">${activity.control_title} • ${activity.framework_name}</p>
          </div>
          <div class="flex-shrink-0 text-right">
            <div class="flex items-center">
              <span class="text-xs text-gray-500 mr-2">Confidence:</span>
              <span class="text-sm font-medium text-green-600">${Math.round((activity.confidence_score || 0) * 100)}%</span>
            </div>
            <p class="text-xs text-gray-400">${new Date(activity.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderEnhancedSOC2Page(frameworkData: any, maturityScore: any, criticalGaps: any[]) {
  return html`
    <div class="min-h-screen bg-gray-50">
      <!-- SOC 2 Header -->
      <div class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-shield-alt text-3xl text-blue-600"></i>
              </div>
              <div class="ml-4">
                <h1 class="text-2xl font-bold text-gray-900">SOC 2 Type II Controls</h1>
                <p class="text-sm text-gray-500">AICPA Service Organization Control 2 - Trust Services Criteria</p>
              </div>
            </div>
            <div class="flex space-x-3">
              <button 
                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                data-action="ai-assess-control"
                data-framework-id="1"
              >
                <i class="fas fa-brain mr-2"></i>
                AI Assessment
              </button>
              <button 
                class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                data-action="generate-remediation-plan"
              >
                <i class="fas fa-route mr-2"></i>
                Remediation Plan
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Enhanced Metrics Dashboard -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-tasks text-2xl text-blue-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Total Controls</p>
                <p class="text-2xl font-semibold text-gray-900">${frameworkData?.total_controls || 0}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-check-circle text-2xl text-green-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Implemented</p>
                <p class="text-2xl font-semibold text-gray-900">${frameworkData?.implemented_controls || 0}</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-chart-line text-2xl text-purple-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Compliance %</p>
                <p class="text-2xl font-semibold text-gray-900">${Math.round(frameworkData?.compliance_percentage || 0)}%</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-star text-2xl text-yellow-500"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Maturity Score</p>
                <p class="text-2xl font-semibold text-gray-900">${maturityScore?.score?.toFixed(1) || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Row -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <!-- Compliance Overview Chart -->
          <div class="bg-white rounded-xl shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Compliance Overview</h3>
            <div class="h-64">
              <canvas id="complianceOverviewChart"></canvas>
            </div>
          </div>

          <!-- Maturity Radar Chart -->
          <div class="bg-white rounded-xl shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Maturity Assessment</h3>
            <div class="h-64">
              <canvas id="maturityRadarChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Critical Gaps Section -->
        ${criticalGaps.length > 0 ? html`
          <div class="bg-white rounded-xl shadow mb-8">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                <i class="fas fa-exclamation-triangle mr-2 text-red-500"></i>
                Critical Gaps (AI Identified)
              </h3>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${criticalGaps.map(gap => renderCriticalGap(gap)).join('')}
              </div>
            </div>
          </div>
        ` : ''}

        <!-- Controls Tabs -->
        <div class="bg-white rounded-xl shadow">
          <div class="border-b border-gray-200">
            <nav class="-mb-px flex space-x-8 px-6">
              <a href="#" 
                 class="tab-link border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                 hx-get="/compliance/controls/soc2/security"
                 hx-target="#controls-content"
                 hx-swap="innerHTML"
                 data-tab="security">
                Security (Common Criteria)
              </a>
              <a href="#" 
                 class="tab-link border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                 hx-get="/compliance/controls/soc2/availability"
                 hx-target="#controls-content"
                 hx-swap="innerHTML"
                 data-tab="availability">
                Availability
              </a>
              <a href="#" 
                 class="tab-link border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm"
                 hx-get="/compliance/controls/soc2/integrity"
                 hx-target="#controls-content"
                 hx-swap="innerHTML"
                 data-tab="integrity">
                Processing Integrity
              </a>
            </nav>
          </div>
          
          <div id="controls-content" class="p-6">
            <!-- Controls will be loaded here via HTMX -->
            <div class="text-center py-8 text-gray-500">
              <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
              <p>Loading controls...</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Load initial tab -->
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        // Load security tab by default
        htmx.ajax('GET', '/compliance/controls/soc2/security', {target: '#controls-content', swap: 'innerHTML'});
        
        // Activate first tab
        document.querySelector('[data-tab="security"]').classList.add('border-blue-500', 'text-blue-600');
        document.querySelector('[data-tab="security"]').classList.remove('border-transparent', 'text-gray-500');
        
        // Tab switching
        document.addEventListener('click', function(e) {
          if (e.target.matches('.tab-link')) {
            // Remove active classes from all tabs
            document.querySelectorAll('.tab-link').forEach(tab => {
              tab.classList.remove('border-blue-500', 'text-blue-600');
              tab.classList.add('border-transparent', 'text-gray-500');
            });
            
            // Add active classes to clicked tab
            e.target.classList.add('border-blue-500', 'text-blue-600');
            e.target.classList.remove('border-transparent', 'text-gray-500');
          }
        });
      });
    </script>
  `;
}

function renderCriticalGap(gap: any) {
  let gapData;
  try {
    gapData = JSON.parse(gap.assessment_data);
  } catch {
    gapData = { gaps: [{ title: 'Gap analysis pending', severity: 'medium' }] };
  }

  return html`
    <div class="border border-red-200 bg-red-50 rounded-lg p-4">
      <div class="flex items-start justify-between">
        <div>
          <h4 class="text-sm font-medium text-red-900">${gap.control_id}</h4>
          <p class="text-sm text-red-700 mt-1">${gap.title}</p>
          <p class="text-xs text-red-600 mt-2">Risk Level: ${gap.risk_level}</p>
        </div>
        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          ${gapData.gaps?.[0]?.severity || 'medium'}
        </span>
      </div>
    </div>
  `;
}

function renderEnhancedSOC2ControlsList(controls: any[], category: string) {
  if (controls.length === 0) {
    return html`
      <div class="text-center py-8">
        <i class="fas fa-info-circle text-gray-400 text-2xl mb-2"></i>
        <p class="text-gray-600">No ${category} controls found</p>
      </div>
    `;
  }

  return html`
    <div class="space-y-4">
      ${controls.map(control => html`
        <div class="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <!-- Control Header -->
              <div class="flex items-center mb-3">
                <input type="checkbox" data-control-id="${control.id}" class="mr-3 rounded border-gray-300">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(control.implementation_status)}">
                  ${control.implementation_status?.replace('_', ' ') || 'Not Started'}
                </span>
                <span class="ml-2 text-sm text-gray-500">${control.control_id}</span>
                ${control.confidence_score ? html`
                  <span class="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <i class="fas fa-brain mr-1"></i>
                    AI: ${Math.round(control.confidence_score * 100)}%
                  </span>
                ` : ''}
              </div>

              <!-- Control Details -->
              <h4 class="text-lg font-medium text-gray-900 mb-2">${control.title}</h4>
              <p class="text-gray-600 text-sm mb-4">${control.description}</p>
              
              <!-- Enhanced Metrics Row -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div class="text-center p-2 bg-gray-50 rounded">
                  <p class="text-xs text-gray-500">Evidence</p>
                  <p class="text-sm font-medium">${control.evidence_count || 0}</p>
                </div>
                <div class="text-center p-2 bg-gray-50 rounded">
                  <p class="text-xs text-gray-500">Effectiveness</p>
                  <p class="text-sm font-medium">${control.effectiveness_rating || 'N/A'}</p>
                </div>
                <div class="text-center p-2 bg-gray-50 rounded">
                  <p class="text-xs text-gray-500">Coverage</p>
                  <p class="text-sm font-medium">${control.coverage_percentage || 'N/A'}%</p>
                </div>
                <div class="text-center p-2 bg-gray-50 rounded">
                  <p class="text-xs text-gray-500">Risk Level</p>
                  <p class="text-sm font-medium">${control.risk_level || 'N/A'}</p>
                </div>
              </div>

              <!-- Progress Bar -->
              <div class="flex items-center space-x-3 mb-3">
                <div class="flex-1 bg-gray-200 rounded-full h-2">
                  <div class="bg-blue-600 h-2 rounded-full" style="width: ${control.implementation_progress || 0}%"></div>
                </div>
                <span class="text-sm text-gray-600">${control.implementation_progress || 0}%</span>
              </div>

              <!-- Last AI Assessment -->
              ${control.last_ai_assessment ? html`
                <p class="text-xs text-gray-500">
                  <i class="fas fa-brain mr-1"></i>
                  Last AI assessment: ${new Date(control.last_ai_assessment).toLocaleDateString()}
                </p>
              ` : ''}
            </div>
            
            <!-- Action Buttons -->
            <div class="ml-6 flex flex-col space-y-2">
              <button class="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors"
                      data-action="ai-assess-control"
                      data-control-id="${control.id}"
                      title="AI Assessment">
                <i class="fas fa-brain"></i>
              </button>
              <button class="text-green-600 hover:text-green-800 p-2 rounded-full hover:bg-green-50 transition-colors"
                      hx-get="/compliance/controls/soc2/${control.id}/view"
                      hx-target="#modal-container"
                      hx-swap="innerHTML"
                      title="View Details">
                <i class="fas fa-eye"></i>
              </button>
              <button class="text-orange-600 hover:text-orange-800 p-2 rounded-full hover:bg-orange-50 transition-colors"
                      hx-get="/compliance/controls/soc2/${control.id}/edit"
                      hx-target="#modal-container"
                      hx-swap="innerHTML"
                      title="Edit Control">
                <i class="fas fa-edit"></i>
              </button>
              <button class="text-purple-600 hover:text-purple-800 p-2 rounded-full hover:bg-purple-50 transition-colors"
                      data-action="view-assessment-history"
                      data-control-id="${control.id}"
                      title="Assessment History">
                <i class="fas fa-history"></i>
              </button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Bulk Actions -->
    <div class="mt-6 p-4 bg-gray-50 rounded-lg">
      <div class="flex items-center justify-between">
        <span class="text-sm text-gray-700">Bulk Actions:</span>
        <div class="flex space-x-2">
          <button class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                  data-action="bulk-ai-assessment">
            <i class="fas fa-brain mr-1"></i>
            AI Assess Selected
          </button>
          <button class="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
            <i class="fas fa-play mr-1"></i>
            Start Automation
          </button>
        </div>
      </div>
    </div>
  `;
}

// Utility functions
function getFrameworkGradient(name: string) {
  switch (name.toLowerCase()) {
    case 'soc 2 type ii': return 'from-blue-500 to-blue-600';
    case 'iso 27001': return 'from-green-500 to-green-600';
    case 'nist cybersecurity framework': return 'from-purple-500 to-purple-600';
    case 'gdpr': return 'from-red-500 to-red-600';
    default: return 'from-gray-500 to-gray-600';
  }
}

function getFrameworkIcon(name: string) {
  switch (name.toLowerCase()) {
    case 'soc 2 type ii': return 'fa-shield-alt';
    case 'iso 27001': return 'fa-certificate';
    case 'nist cybersecurity framework': return 'fa-network-wired';
    case 'gdpr': return 'fa-balance-scale';
    default: return 'fa-file-alt';
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'implemented': return 'bg-green-100 text-green-800';
    case 'in_progress': return 'bg-yellow-100 text-yellow-800';
    case 'tested': return 'bg-blue-100 text-blue-800';
    case 'verified': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function renderAutomationManagement(workflowMetrics: any, monitoringRules: any, recentActivities: any[]) {
  return html`
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="py-6">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-2xl font-bold text-white">Phase 3: Compliance Automation Center</h1>
                <p class="text-blue-100 mt-1">Advanced Workflow Engine & Continuous Monitoring</p>
              </div>
              <div class="flex space-x-3">
                <button class="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-colors">
                  <i class="fas fa-plus mr-2"></i>
                  Create Workflow
                </button>
                <button class="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-colors">
                  <i class="fas fa-eye mr-2"></i>
                  Monitor Rules
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Metrics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-cogs text-2xl text-blue-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Total Workflows</p>
                <p class="text-2xl font-semibold text-gray-900">${workflowMetrics?.total_workflows || 0}</p>
                <p class="text-xs text-gray-500">${workflowMetrics?.automated_workflows || 0} fully automated</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-play-circle text-2xl text-green-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Active Workflows</p>
                <p class="text-2xl font-semibold text-gray-900">${workflowMetrics?.active_workflows || 0}</p>
                <p class="text-xs text-gray-500">Currently running</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-radar-dish text-2xl text-purple-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Monitor Rules</p>
                <p class="text-2xl font-semibold text-gray-900">${monitoringRules?.total_rules || 0}</p>
                <p class="text-xs text-gray-500">${monitoringRules?.active_rules || 0} active</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-percentage text-2xl text-orange-600"></i>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500">Automation Rate</p>
                <p class="text-2xl font-semibold text-gray-900">
                  ${workflowMetrics?.total_workflows > 0 ? 
                    Math.round((workflowMetrics.automated_workflows / workflowMetrics.total_workflows) * 100) : 0}%
                </p>
                <p class="text-xs text-gray-500">Fully automated</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Workflow Management -->
          <div class="bg-white rounded-xl shadow-lg">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                <i class="fas fa-sitemap mr-2 text-blue-600"></i>
                Workflow Management
              </h3>
            </div>
            <div class="p-6">
              <div class="space-y-4">
                <div class="flex items-center p-4 bg-blue-50 rounded-lg">
                  <i class="fas fa-plus-circle text-blue-600 mr-3"></i>
                  <div class="flex-1">
                    <h4 class="font-medium text-gray-900">Create New Workflow</h4>
                    <p class="text-sm text-gray-600">Set up automated compliance processes</p>
                  </div>
                  <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Create
                  </button>
                </div>

                <div class="flex items-center p-4 bg-green-50 rounded-lg">
                  <i class="fas fa-eye text-green-600 mr-3"></i>
                  <div class="flex-1">
                    <h4 class="font-medium text-gray-900">View All Workflows</h4>
                    <p class="text-sm text-gray-600">Manage existing automation workflows</p>
                  </div>
                  <button class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    View
                  </button>
                </div>

                <div class="flex items-center p-4 bg-purple-50 rounded-lg">
                  <i class="fas fa-chart-bar text-purple-600 mr-3"></i>
                  <div class="flex-1">
                    <h4 class="font-medium text-gray-900">Workflow Analytics</h4>
                    <p class="text-sm text-gray-600">Performance and efficiency metrics</p>
                  </div>
                  <button class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
                    Analyze
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Monitoring Center -->
          <div class="bg-white rounded-xl shadow-lg">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                <i class="fas fa-shield-alt mr-2 text-green-600"></i>
                Continuous Monitoring
              </h3>
            </div>
            <div class="p-6">
              <div class="space-y-4">
                <div class="flex items-center p-4 bg-green-50 rounded-lg">
                  <i class="fas fa-plus text-green-600 mr-3"></i>
                  <div class="flex-1">
                    <h4 class="font-medium text-gray-900">Create Monitor Rule</h4>
                    <p class="text-sm text-gray-600">Set up continuous compliance monitoring</p>
                  </div>
                  <button class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    Create
                  </button>
                </div>

                <div class="flex items-center p-4 bg-orange-50 rounded-lg">
                  <i class="fas fa-bell text-orange-600 mr-3"></i>
                  <div class="flex-1">
                    <h4 class="font-medium text-gray-900">Active Alerts</h4>
                    <p class="text-sm text-gray-600">View and manage compliance alerts</p>
                  </div>
                  <button class="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700">
                    View
                  </button>
                </div>

                <div class="flex items-center p-4 bg-red-50 rounded-lg">
                  <i class="fas fa-exclamation-triangle text-red-600 mr-3"></i>
                  <div class="flex-1">
                    <h4 class="font-medium text-gray-900">Anomaly Detection</h4>
                    <p class="text-sm text-gray-600">AI-powered compliance anomalies</p>
                  </div>
                  <button class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                    Detect
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Activities -->
        <div class="mt-8">
          <div class="bg-white rounded-xl shadow-lg">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                <i class="fas fa-history mr-2 text-gray-600"></i>
                Recent Automation Activities
              </h3>
            </div>
            <div class="p-6">
              ${recentActivities.length > 0 ? html`
                <div class="space-y-3">
                  ${recentActivities.map(activity => html`
                    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div class="flex items-center">
                        <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <i class="fas fa-cog text-blue-600 text-sm"></i>
                        </div>
                        <div>
                          <p class="font-medium text-gray-900">${activity.workflow_name || 'Workflow Execution'}</p>
                          <p class="text-sm text-gray-600">Status: ${activity.execution_status || 'Unknown'}</p>
                        </div>
                      </div>
                      <div class="text-right">
                        <p class="text-sm text-gray-500">${new Date(activity.created_at || Date.now()).toLocaleDateString()}</p>
                        ${activity.completion_time ? html`
                          <p class="text-xs text-gray-400">Completed: ${new Date(activity.completion_time).toLocaleTimeString()}</p>
                        ` : ''}
                      </div>
                    </div>
                  `).join('')}
                </div>
              ` : html`
                <div class="text-center py-8">
                  <i class="fas fa-inbox text-4xl text-gray-300 mb-4"></i>
                  <p class="text-gray-500 text-lg">No recent automation activities</p>
                  <p class="text-gray-400 text-sm">Create your first workflow to get started</p>
                  <button class="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                    <i class="fas fa-plus mr-2"></i>
                    Create First Workflow
                  </button>
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderComplianceDashboard(data: {
  automationMetrics: any;
  monitoringMetrics: any;
  recentAlerts: any[];
  orgInfo: any;
  user: any;
}) {
  const { automationMetrics, monitoringMetrics, recentAlerts, orgInfo, user } = data;
  
  return html`
    <div class="min-h-screen bg-gray-50">
      <!-- Enhanced Header -->
      <div class="bg-gradient-to-r from-blue-600 to-purple-700 shadow-lg">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="py-8">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <i class="fas fa-tachometer-alt text-4xl text-white"></i>
                </div>
                <div class="ml-4">
                  <h1 class="text-3xl font-bold text-white">ARIA5 Enterprise Compliance Dashboard</h1>
                  <p class="text-blue-100 mt-2">Advanced Automation & Multi-Tenancy Platform</p>
                  ${orgInfo ? html`
                    <p class="text-blue-200 text-sm mt-1">
                      <i class="fas fa-building mr-1"></i>
                      ${orgInfo.organization_name} • ${orgInfo.organization_type}
                    </p>
                  ` : ''}
                </div>
              </div>
              <div class="flex space-x-3">
                <button class="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-colors"
                        onclick="location.href='/compliance/automation'">
                  <i class="fas fa-cogs mr-2"></i>
                  Automation Center
                </button>
                <button class="bg-white bg-opacity-20 text-white px-4 py-2 rounded-lg hover:bg-opacity-30 transition-colors"
                        onclick="location.href='/api/enterprise/organizations'">
                  <i class="fas fa-sitemap mr-2"></i>
                  Enterprise Console
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Key Metrics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <!-- Automation Metrics -->
          <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-blue-100 text-sm font-medium">Workflow Automation</p>
                <p class="text-3xl font-bold mt-2">${automationMetrics?.total_workflows || 0}</p>
                <p class="text-blue-200 text-xs mt-1">
                  ${automationMetrics?.automated_workflows || 0} fully automated
                </p>
              </div>
              <div class="bg-white bg-opacity-20 rounded-full p-3">
                <i class="fas fa-robot text-2xl"></i>
              </div>
            </div>
            <div class="mt-4">
              <div class="flex justify-between text-xs text-blue-100">
                <span>Automation Rate</span>
                <span>${automationMetrics?.total_workflows > 0 ? 
                  Math.round((automationMetrics.automated_workflows / automationMetrics.total_workflows) * 100) : 0}%</span>
              </div>
              <div class="w-full bg-blue-400 bg-opacity-30 rounded-full h-2 mt-2">
                <div class="bg-white rounded-full h-2 transition-all duration-300" 
                     style="width: ${automationMetrics?.total_workflows > 0 ? 
                       Math.round((automationMetrics.automated_workflows / automationMetrics.total_workflows) * 100) : 0}%"></div>
              </div>
            </div>
          </div>

          <!-- Monitoring Metrics -->
          <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-green-100 text-sm font-medium">Continuous Monitoring</p>
                <p class="text-3xl font-bold mt-2">${monitoringMetrics?.active_rules || 0}</p>
                <p class="text-green-200 text-xs mt-1">
                  of ${monitoringMetrics?.total_rules || 0} total rules
                </p>
              </div>
              <div class="bg-white bg-opacity-20 rounded-full p-3">
                <i class="fas fa-radar-dish text-2xl"></i>
              </div>
            </div>
            <div class="mt-4">
              <div class="flex justify-between text-xs text-green-100">
                <span>Active Monitoring</span>
                <span>${monitoringMetrics?.total_rules > 0 ? 
                  Math.round((monitoringMetrics.active_rules / monitoringMetrics.total_rules) * 100) : 0}%</span>
              </div>
              <div class="w-full bg-green-400 bg-opacity-30 rounded-full h-2 mt-2">
                <div class="bg-white rounded-full h-2 transition-all duration-300" 
                     style="width: ${monitoringMetrics?.total_rules > 0 ? 
                       Math.round((monitoringMetrics.active_rules / monitoringMetrics.total_rules) * 100) : 0}%"></div>
              </div>
            </div>
          </div>

          <!-- Alert Status -->
          <div class="bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-orange-100 text-sm font-medium">Active Alerts</p>
                <p class="text-3xl font-bold mt-2">${recentAlerts?.length || 0}</p>
                <p class="text-orange-200 text-xs mt-1">
                  ${recentAlerts?.filter(a => a.severity === 'high').length || 0} high severity
                </p>
              </div>
              <div class="bg-white bg-opacity-20 rounded-full p-3">
                <i class="fas fa-exclamation-triangle text-2xl"></i>
              </div>
            </div>
            <div class="mt-4">
              <div class="flex items-center justify-between">
                <button class="text-xs bg-white bg-opacity-20 px-3 py-1 rounded-full hover:bg-opacity-30 transition-colors">
                  View All Alerts
                </button>
                <div class="flex space-x-1">
                  ${recentAlerts?.slice(0, 3).map(() => html`
                    <div class="w-2 h-2 bg-white rounded-full opacity-60"></div>
                  `).join('') || ''}
                </div>
              </div>
            </div>
          </div>

          <!-- Enterprise Status -->
          <div class="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-purple-100 text-sm font-medium">Enterprise Features</p>
                <p class="text-3xl font-bold mt-2">${orgInfo ? 'Active' : 'Standard'}</p>
                <p class="text-purple-200 text-xs mt-1">
                  Multi-tenancy ${orgInfo ? 'enabled' : 'available'}
                </p>
              </div>
              <div class="bg-white bg-opacity-20 rounded-full p-3">
                <i class="fas fa-crown text-2xl"></i>
              </div>
            </div>
            <div class="mt-4">
              <button class="text-xs bg-white bg-opacity-20 px-3 py-1 rounded-full hover:bg-opacity-30 transition-colors w-full">
                ${orgInfo ? 'Manage Organizations' : 'Upgrade to Enterprise'}
              </button>
            </div>
          </div>
        </div>

        <!-- Main Dashboard Grid -->
        <div class="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <!-- Left Column: Recent Alerts & Activities -->
          <div class="xl:col-span-1 space-y-6">
            <!-- Recent Alerts -->
            <div class="bg-white rounded-xl shadow-lg">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                  <i class="fas fa-bell mr-2 text-red-500"></i>
                  Recent Alerts
                </h3>
              </div>
              <div class="p-6">
                ${recentAlerts?.length > 0 ? html`
                  <div class="space-y-4">
                    ${recentAlerts.slice(0, 5).map(alert => html`
                      <div class="flex items-start space-x-3 p-3 rounded-lg ${getAlertBackground(alert.severity)}">
                        <div class="flex-shrink-0">
                          <i class="fas fa-exclamation-circle ${getAlertColor(alert.severity)}"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="text-sm font-medium text-gray-900">${alert.title}</p>
                          <p class="text-xs text-gray-500">
                            ${alert.rule_name} • ${new Date(alert.created_at).toLocaleString()}
                          </p>
                          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getSeverityBadge(alert.severity)}">
                            ${alert.severity}
                          </span>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                ` : html`
                  <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-check-circle text-3xl mb-2 text-green-500"></i>
                    <p>No active alerts</p>
                    <p class="text-xs">All systems monitoring normally</p>
                  </div>
                `}
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white rounded-xl shadow-lg">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                  <i class="fas fa-lightning-bolt mr-2 text-yellow-500"></i>
                  Quick Actions
                </h3>
              </div>
              <div class="p-6">
                <div class="grid grid-cols-1 gap-3">
                  <button class="flex items-center p-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          onclick="location.href='/api/compliance-automation/workflows'">
                    <i class="fas fa-play-circle text-blue-600 mr-3"></i>
                    <div>
                      <p class="text-sm font-medium text-gray-900">Start New Workflow</p>
                      <p class="text-xs text-gray-500">Launch automated compliance process</p>
                    </div>
                  </button>
                  
                  <button class="flex items-center p-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                          onclick="location.href='/api/compliance-automation/monitoring/rules'">
                    <i class="fas fa-plus-circle text-green-600 mr-3"></i>
                    <div>
                      <p class="text-sm font-medium text-gray-900">Create Monitoring Rule</p>
                      <p class="text-xs text-gray-500">Set up continuous monitoring</p>
                    </div>
                  </button>
                  
                  <button class="flex items-center p-3 text-left bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                          onclick="location.href='/api/enterprise/organizations'">
                    <i class="fas fa-building text-purple-600 mr-3"></i>
                    <div>
                      <p class="text-sm font-medium text-gray-900">Manage Organizations</p>
                      <p class="text-xs text-gray-500">Enterprise multi-tenancy</p>
                    </div>
                  </button>
                  
                  <button class="flex items-center p-3 text-left bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors"
                          onclick="location.href='/compliance/analytics'">
                    <i class="fas fa-chart-bar text-orange-600 mr-3"></i>
                    <div>
                      <p class="text-sm font-medium text-gray-900">View Analytics</p>
                      <p class="text-xs text-gray-500">Advanced compliance metrics</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Charts & Analytics -->
          <div class="xl:col-span-2 space-y-6">
            <!-- Automation Overview Chart -->
            <div class="bg-white rounded-xl shadow-lg">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                  <i class="fas fa-chart-pie mr-2 text-blue-600"></i>
                  Automation Overview
                </h3>
              </div>
              <div class="p-6">
                <div class="h-64 flex items-center justify-center">
                  <canvas id="automationOverviewChart"></canvas>
                </div>
              </div>
            </div>

            <!-- Monitoring Trends -->
            <div class="bg-white rounded-xl shadow-lg">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                  <i class="fas fa-chart-line mr-2 text-green-600"></i>
                  Monitoring Trends
                </h3>
              </div>
              <div class="p-6">
                <div class="h-64 flex items-center justify-center">
                  <canvas id="monitoringTrendsChart"></canvas>
                </div>
              </div>
            </div>

            <!-- MULTI-TENANCY FEATURES - TEMPORARILY DISABLED -->
            <!-- TODO: Re-enable when Phase 4 multi-tenancy features are needed -->
            <!-- Phase 3 Automation Features Grid -->
            <div class="bg-white rounded-xl shadow-lg">
              <div class="px-6 py-4 border-b border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900 flex items-center">
                  <i class="fas fa-cogs mr-2 text-blue-600"></i>
                  Phase 3: Automation Features
                </h3>
              </div>
              <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                    <i class="fas fa-sitemap text-2xl text-blue-600 mb-2"></i>
                    <h4 class="font-medium text-gray-900">Workflow Engine</h4>
                    <p class="text-sm text-gray-600 mt-1">Automated compliance processes</p>
                  </div>
                  
                  <div class="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                    <i class="fas fa-radar-dish text-2xl text-green-600 mb-2"></i>
                    <h4 class="font-medium text-gray-900">Continuous Monitoring</h4>
                    <p class="text-sm text-gray-600 mt-1">Real-time compliance tracking</p>
                  </div>
                  
                  <div class="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                    <i class="fas fa-brain text-2xl text-purple-600 mb-2"></i>
                    <h4 class="font-medium text-gray-900">AI Decision Making</h4>
                    <p class="text-sm text-gray-600 mt-1">Intelligent workflow routing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Cards -->
        <div class="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <a href="/compliance/frameworks" 
             class="block bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-l-4 border-blue-500">
            <div class="flex items-center">
              <i class="fas fa-shield-alt text-2xl text-blue-600 mr-4"></i>
              <div>
                <h3 class="font-semibold text-gray-900">Frameworks</h3>
                <p class="text-sm text-gray-600">Manage compliance frameworks</p>
              </div>
            </div>
          </a>

          <a href="/compliance/automation" 
             class="block bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-l-4 border-green-500">
            <div class="flex items-center">
              <i class="fas fa-cogs text-2xl text-green-600 mr-4"></i>
              <div>
                <h3 class="font-semibold text-gray-900">Automation</h3>
                <p class="text-sm text-gray-600">Workflow automation center</p>
              </div>
            </div>
          </a>

          <a href="/compliance/analytics" 
             class="block bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-l-4 border-purple-500">
            <div class="flex items-center">
              <i class="fas fa-chart-bar text-2xl text-purple-600 mr-4"></i>
              <div>
                <h3 class="font-semibold text-gray-900">Analytics</h3>
                <p class="text-sm text-gray-600">Advanced compliance metrics</p>
              </div>
            </div>
          </div>

          <!-- MULTI-TENANCY FEATURE - TEMPORARILY DISABLED -->
          <!-- TODO: Re-enable when Phase 4 multi-tenancy features are needed -->
          <!--
          <button onclick="location.href='/api/enterprise/organizations'" 
                  class="block w-full bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow border-l-4 border-orange-500 text-left">
            <div class="flex items-center">
              <i class="fas fa-building text-2xl text-orange-600 mr-4"></i>
              <div>
                <h3 class="font-semibold text-gray-900">Enterprise</h3>
                <p class="text-sm text-gray-600">Multi-tenancy console</p>
              </div>
            </div>
          </button>
          -->
        </div>
      </div>
    </div>

    <!-- Initialize Charts -->
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        // Automation Overview Chart
        const automationCtx = document.getElementById('automationOverviewChart');
        if (automationCtx) {
          new Chart(automationCtx, {
            type: 'doughnut',
            data: {
              labels: ['Fully Automated', 'Partially Automated', 'Manual'],
              datasets: [{
                data: [
                  ${automationMetrics?.automated_workflows || 0},
                  ${(automationMetrics?.active_workflows || 0) - (automationMetrics?.automated_workflows || 0)},
                  ${(automationMetrics?.total_workflows || 0) - (automationMetrics?.active_workflows || 0)}
                ],
                backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
                borderWidth: 0
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }
          });
        }

        // Monitoring Trends Chart
        const monitoringCtx = document.getElementById('monitoringTrendsChart');
        if (monitoringCtx) {
          new Chart(monitoringCtx, {
            type: 'line',
            data: {
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              datasets: [{
                label: 'Active Rules',
                data: [12, 15, 18, 20, 22, 25, ${monitoringMetrics?.active_rules || 0}],
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true
                }
              }
            }
          });
        }
      });
    </script>
  `;
}

// Alert utility functions
function getAlertBackground(severity: string) {
  switch (severity?.toLowerCase()) {
    case 'high': return 'bg-red-50 border border-red-200';
    case 'medium': return 'bg-yellow-50 border border-yellow-200';
    case 'low': return 'bg-blue-50 border border-blue-200';
    default: return 'bg-gray-50 border border-gray-200';
  }
}

function getAlertColor(severity: string) {
  switch (severity?.toLowerCase()) {
    case 'high': return 'text-red-600';
    case 'medium': return 'text-yellow-600';
    case 'low': return 'text-blue-600';
    default: return 'text-gray-600';
  }
}

function getSeverityBadge(severity: string) {
  switch (severity?.toLowerCase()) {
    case 'high': return 'bg-red-100 text-red-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function renderAdvancedAnalytics(metrics: any) {
  return html`
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <!-- Risk vs Compliance Matrix -->
          <div class="bg-white rounded-xl shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Risk-Compliance Matrix</h3>
            <div class="h-64">
              <canvas id="riskComplianceMatrix"></canvas>
            </div>
          </div>

          <!-- Trend Analysis -->
          <div class="bg-white rounded-xl shadow p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Trend Analysis</h3>
            <div class="h-64">
              <canvas id="trendAnalysisChart"></canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}