/**
 * ARIA5 Compliance Automation API Routes
 * 
 * Provides REST endpoints for:
 * - Workflow management and execution
 * - Continuous monitoring and alerting
 * - Automated testing and validation
 * - Evidence collection automation
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import ComplianceWorkflowEngine from '../services/compliance-workflow-engine';
import ComplianceMonitoringEngine from '../services/compliance-monitoring-engine';

const app = new Hono<{ Bindings: { DB: D1Database; AI: any } }>();

// Enable CORS for API endpoints
app.use('/api/compliance-automation/*', cors());

/**
 * POST /api/compliance-automation/workflows
 * Create a new compliance workflow
 */
app.post('/workflows', async (c) => {
  try {
    const { workflowDefinition, createdBy } = await c.req.json();

    if (!workflowDefinition || !createdBy) {
      return c.json({ error: 'Missing workflow definition or creator' }, 400);
    }

    const workflowEngine = new ComplianceWorkflowEngine(c.env.DB);
    const workflowId = await workflowEngine.createWorkflow(workflowDefinition, createdBy);

    return c.json({
      success: true,
      data: {
        workflowId,
        message: 'Workflow created successfully'
      }
    });

  } catch (error) {
    console.error('Create Workflow Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * POST /api/compliance-automation/workflows/:workflowId/execute
 * Execute a compliance workflow
 */
app.post('/workflows/:workflowId/execute', async (c) => {
  try {
    const workflowId = c.req.param('workflowId');
    const { triggerData, executionContext } = await c.req.json();

    const workflowEngine = new ComplianceWorkflowEngine(c.env.DB);
    const executionId = await workflowEngine.executeWorkflow(
      workflowId,
      triggerData || {},
      executionContext || {}
    );

    return c.json({
      success: true,
      data: {
        executionId,
        message: 'Workflow execution started'
      }
    });

  } catch (error) {
    console.error('Execute Workflow Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * GET /api/compliance-automation/executions/:executionId
 * Get workflow execution status
 */
app.get('/executions/:executionId', async (c) => {
  try {
    const executionId = c.req.param('executionId');

    const workflowEngine = new ComplianceWorkflowEngine(c.env.DB);
    const execution = await workflowEngine.getExecutionStatus(executionId);

    if (!execution) {
      return c.json({ error: 'Execution not found' }, 404);
    }

    return c.json({
      success: true,
      data: execution
    });

  } catch (error) {
    console.error('Get Execution Status Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * POST /api/compliance-automation/workflows/monitoring/create
 * Create automated monitoring workflow for a framework
 */
app.post('/workflows/monitoring/create', async (c) => {
  try {
    const { frameworkId, controlIds } = await c.req.json();

    if (!frameworkId) {
      return c.json({ error: 'Framework ID required' }, 400);
    }

    const workflowEngine = new ComplianceWorkflowEngine(c.env.DB);
    const workflowId = await workflowEngine.createMonitoringWorkflow(
      frameworkId,
      controlIds || []
    );

    return c.json({
      success: true,
      data: {
        workflowId,
        message: 'Monitoring workflow created successfully'
      }
    });

  } catch (error) {
    console.error('Create Monitoring Workflow Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * POST /api/compliance-automation/workflows/remediation/create
 * Create automated remediation workflow
 */
app.post('/workflows/remediation/create', async (c) => {
  try {
    const { frameworkId, gapAnalysis, createdBy } = await c.req.json();

    if (!frameworkId || !createdBy) {
      return c.json({ error: 'Framework ID and creator required' }, 400);
    }

    const workflowEngine = new ComplianceWorkflowEngine(c.env.DB);
    const workflowId = await workflowEngine.createRemediationWorkflow(
      frameworkId,
      gapAnalysis || {},
      createdBy
    );

    return c.json({
      success: true,
      data: {
        workflowId,
        message: 'Remediation workflow created successfully'
      }
    });

  } catch (error) {
    console.error('Create Remediation Workflow Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * POST /api/compliance-automation/monitoring/rules
 * Create a new monitoring rule
 */
app.post('/monitoring/rules', async (c) => {
  try {
    const { rule, createdBy } = await c.req.json();

    if (!rule || !createdBy) {
      return c.json({ error: 'Rule definition and creator required' }, 400);
    }

    const monitoringEngine = new ComplianceMonitoringEngine(c.env.DB);
    const ruleId = await monitoringEngine.createMonitoringRule(rule, createdBy);

    return c.json({
      success: true,
      data: {
        ruleId,
        message: 'Monitoring rule created successfully'
      }
    });

  } catch (error) {
    console.error('Create Monitoring Rule Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * POST /api/compliance-automation/monitoring/check
 * Run monitoring checks manually
 */
app.post('/monitoring/check', async (c) => {
  try {
    const monitoringEngine = new ComplianceMonitoringEngine(c.env.DB);
    const alerts = await monitoringEngine.runMonitoringChecks();

    return c.json({
      success: true,
      data: {
        alertsGenerated: alerts.length,
        alerts: alerts.slice(0, 10), // Return first 10 alerts
        message: 'Monitoring checks completed'
      }
    });

  } catch (error) {
    console.error('Run Monitoring Checks Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * GET /api/compliance-automation/monitoring/metrics
 * Get monitoring dashboard metrics
 */
app.get('/monitoring/metrics', async (c) => {
  try {
    const monitoringEngine = new ComplianceMonitoringEngine(c.env.DB);
    const metrics = await monitoringEngine.getMonitoringMetrics();

    return c.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Get Monitoring Metrics Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * GET /api/compliance-automation/monitoring/alerts
 * Get recent monitoring alerts
 */
app.get('/monitoring/alerts', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '20');
    
    const monitoringEngine = new ComplianceMonitoringEngine(c.env.DB);
    const alerts = await monitoringEngine.getRecentAlerts(limit);

    return c.json({
      success: true,
      data: alerts
    });

  } catch (error) {
    console.error('Get Recent Alerts Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * POST /api/compliance-automation/monitoring/setup/:frameworkId
 * Setup default monitoring rules for a framework
 */
app.post('/monitoring/setup/:frameworkId', async (c) => {
  try {
    const frameworkId = parseInt(c.req.param('frameworkId'));

    if (!frameworkId) {
      return c.json({ error: 'Invalid framework ID' }, 400);
    }

    const monitoringEngine = new ComplianceMonitoringEngine(c.env.DB);
    const ruleIds = await monitoringEngine.setupDefaultMonitoringRules(frameworkId);

    return c.json({
      success: true,
      data: {
        rulesCreated: ruleIds.length,
        ruleIds,
        message: 'Default monitoring rules setup completed'
      }
    });

  } catch (error) {
    console.error('Setup Default Monitoring Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

/**
 * GET /api/compliance-automation/dashboard
 * Get comprehensive automation dashboard data
 */
app.get('/dashboard', async (c) => {
  try {
    const workflowEngine = new ComplianceWorkflowEngine(c.env.DB);
    const monitoringEngine = new ComplianceMonitoringEngine(c.env.DB);

    // Get monitoring metrics
    const monitoringMetrics = await monitoringEngine.getMonitoringMetrics();
    
    // Get recent alerts
    const recentAlerts = await monitoringEngine.getRecentAlerts(10);
    
    // Get workflow statistics
    const workflowStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_workflows,
        COUNT(CASE WHEN automation_level = 'fully_automated' THEN 1 END) as automated_workflows,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_workflows
      FROM compliance_workflows_advanced
    `).first();

    // Get execution statistics
    const executionStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_executions,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_executions,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_executions,
        COUNT(CASE WHEN started_at > datetime('now', '-24 hours') THEN 1 END) as executions_24h
      FROM compliance_workflow_executions
    `).first();

    const dashboard = {
      monitoring: monitoringMetrics,
      alerts: recentAlerts,
      workflows: {
        total: workflowStats?.total_workflows || 0,
        automated: workflowStats?.automated_workflows || 0,
        active: workflowStats?.active_workflows || 0
      },
      executions: {
        total: executionStats?.total_executions || 0,
        completed: executionStats?.completed_executions || 0,
        failed: executionStats?.failed_executions || 0,
        last24h: executionStats?.executions_24h || 0,
        successRate: executionStats?.total_executions > 0 
          ? ((executionStats?.completed_executions || 0) / executionStats.total_executions * 100) 
          : 0
      },
      automationCoverage: {
        totalControls: 0, // Would be calculated from database
        automatedControls: 0,
        monitoredControls: 0,
        coveragePercentage: 0
      }
    };

    return c.json({
      success: true,
      data: dashboard
    });

  } catch (error) {
    console.error('Get Automation Dashboard Error:', error);
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
});

export default app;