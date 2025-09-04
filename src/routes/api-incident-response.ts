import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { IncidentResponseService } from '../services/incident-response';

const apiIncidentResponseRoutes = new Hono();

// Apply authentication middleware to all routes
apiIncidentResponseRoutes.use('*', requireAuth);

// Initialize service
const incidentService = new IncidentResponseService();

// Incident Response Overview API
apiIncidentResponseRoutes.get('/overview', requirePermission('incident:view'), async (c) => {
  try {
    const overview = await incidentService.getIncidentResponseOverview();
    return c.json(overview);
  } catch (error) {
    console.error('Error getting incident response overview:', error);
    return c.json({ error: 'Failed to get incident response overview' }, 500);
  }
});

// Incident Management API
apiIncidentResponseRoutes.get('/incidents', requirePermission('incident:view'), async (c) => {
  try {
    const status = c.req.query('status');
    const priority = c.req.query('priority');
    const category = c.req.query('category');
    const assignee = c.req.query('assignee');
    
    const filters = { status, priority, category, assignee };
    const incidents = await incidentService.getAllIncidents(filters);
    return c.json(incidents);
  } catch (error) {
    console.error('Error getting incidents:', error);
    return c.json({ error: 'Failed to get incidents' }, 500);
  }
});

apiIncidentResponseRoutes.get('/incidents/active', requirePermission('incident:view'), async (c) => {
  try {
    const incidents = await incidentService.getActiveIncidents();
    return c.json(incidents);
  } catch (error) {
    console.error('Error getting active incidents:', error);
    return c.json({ error: 'Failed to get active incidents' }, 500);
  }
});

apiIncidentResponseRoutes.post('/incidents', requirePermission('incident:create'), async (c) => {
  try {
    const incidentData = await c.req.json();
    const userEmail = getCookie(c, 'user_email') || '';
    
    // Validate required fields
    const requiredFields = ['title', 'priority', 'description'];
    for (const field of requiredFields) {
      if (!incidentData[field]) {
        return c.json({ error: `Missing required field: ${field}` }, 400);
      }
    }

    const incident = await incidentService.createIncident(incidentData, userEmail);
    
    // Auto-trigger workflow if requested
    if (incidentData.auto_workflow) {
      try {
        const workflows = await incidentService.evaluateIncidentTriggers(incident);
        if (workflows.length > 0) {
          const workflow = workflows[0]; // Use the first matching workflow
          await incidentService.executeWorkflow(incident.id, workflow.id, userEmail);
        }
      } catch (workflowError) {
        console.error('Error auto-triggering workflow:', workflowError);
        // Don't fail the incident creation if workflow fails
      }
    }
    
    return c.json(incident);
  } catch (error) {
    console.error('Error creating incident:', error);
    return c.json({ error: 'Failed to create incident' }, 500);
  }
});

apiIncidentResponseRoutes.get('/incidents/:id', requirePermission('incident:view'), async (c) => {
  try {
    const id = c.req.param('id');
    const incident = await incidentService.getIncidentById(id);
    
    if (!incident) {
      return c.json({ error: 'Incident not found' }, 404);
    }
    
    return c.json(incident);
  } catch (error) {
    console.error('Error getting incident:', error);
    return c.json({ error: 'Failed to get incident' }, 500);
  }
});

apiIncidentResponseRoutes.patch('/incidents/:id', requirePermission('incident:manage'), async (c) => {
  try {
    const id = c.req.param('id');
    const updateData = await c.req.json();
    const userEmail = getCookie(c, 'user_email') || '';
    
    const result = await incidentService.updateIncident(id, updateData, userEmail);
    return c.json(result);
  } catch (error) {
    console.error('Error updating incident:', error);
    return c.json({ error: 'Failed to update incident' }, 500);
  }
});

apiIncidentResponseRoutes.post('/incidents/:id/escalate', requirePermission('incident:manage'), async (c) => {
  try {
    const id = c.req.param('id');
    const userEmail = getCookie(c, 'user_email') || '';
    
    const result = await incidentService.escalateIncident(id, userEmail);
    return c.json(result);
  } catch (error) {
    console.error('Error escalating incident:', error);
    return c.json({ error: 'Failed to escalate incident' }, 500);
  }
});

// Workflow Management API
apiIncidentResponseRoutes.get('/workflows', requirePermission('incident:view'), async (c) => {
  try {
    const type = c.req.query('type');
    const status = c.req.query('status');
    
    const filters = { type, status };
    const workflows = await incidentService.getAllWorkflows(filters);
    return c.json(workflows);
  } catch (error) {
    console.error('Error getting workflows:', error);
    return c.json({ error: 'Failed to get workflows' }, 500);
  }
});

apiIncidentResponseRoutes.post('/workflows', requirePermission('incident:create'), async (c) => {
  try {
    const workflowData = await c.req.json();
    const userEmail = getCookie(c, 'user_email') || '';
    
    // Validate required fields
    const requiredFields = ['name', 'type', 'steps'];
    for (const field of requiredFields) {
      if (!workflowData[field]) {
        return c.json({ error: `Missing required field: ${field}` }, 400);
      }
    }

    const workflow = await incidentService.createWorkflow(workflowData, userEmail);
    return c.json(workflow);
  } catch (error) {
    console.error('Error creating workflow:', error);
    return c.json({ error: 'Failed to create workflow' }, 500);
  }
});

apiIncidentResponseRoutes.get('/workflows/:id', requirePermission('incident:view'), async (c) => {
  try {
    const id = c.req.param('id');
    const workflow = await incidentService.getWorkflowById(id);
    
    if (!workflow) {
      return c.json({ error: 'Workflow not found' }, 404);
    }
    
    return c.json(workflow);
  } catch (error) {
    console.error('Error getting workflow:', error);
    return c.json({ error: 'Failed to get workflow' }, 500);
  }
});

apiIncidentResponseRoutes.post('/workflows/:id/execute', requirePermission('incident:execute'), async (c) => {
  try {
    const workflowId = c.req.param('id');
    const { incidentId } = await c.req.json();
    const userEmail = getCookie(c, 'user_email') || '';
    
    if (!incidentId) {
      return c.json({ error: 'Missing required field: incidentId' }, 400);
    }

    const execution = await incidentService.executeWorkflow(incidentId, workflowId, userEmail);
    return c.json(execution);
  } catch (error) {
    console.error('Error executing workflow:', error);
    return c.json({ error: 'Failed to execute workflow' }, 500);
  }
});

apiIncidentResponseRoutes.get('/workflows/executions/:executionId', requirePermission('incident:view'), async (c) => {
  try {
    const executionId = c.req.param('executionId');
    const execution = await incidentService.getWorkflowExecution(executionId);
    
    if (!execution) {
      return c.json({ error: 'Workflow execution not found' }, 404);
    }
    
    return c.json(execution);
  } catch (error) {
    console.error('Error getting workflow execution:', error);
    return c.json({ error: 'Failed to get workflow execution' }, 500);
  }
});

// Playbook Management API
apiIncidentResponseRoutes.get('/playbooks', requirePermission('incident:view'), async (c) => {
  try {
    const category = c.req.query('category');
    const status = c.req.query('status');
    
    const filters = { category, status };
    const playbooks = await incidentService.getAllPlaybooks(filters);
    return c.json(playbooks);
  } catch (error) {
    console.error('Error getting playbooks:', error);
    return c.json({ error: 'Failed to get playbooks' }, 500);
  }
});

apiIncidentResponseRoutes.post('/playbooks', requirePermission('incident:create'), async (c) => {
  try {
    const playbookData = await c.req.json();
    const userEmail = getCookie(c, 'user_email') || '';
    
    // Validate required fields
    const requiredFields = ['name', 'category', 'steps'];
    for (const field of requiredFields) {
      if (!playbookData[field]) {
        return c.json({ error: `Missing required field: ${field}` }, 400);
      }
    }

    const playbook = await incidentService.createPlaybook(playbookData, userEmail);
    return c.json(playbook);
  } catch (error) {
    console.error('Error creating playbook:', error);
    return c.json({ error: 'Failed to create playbook' }, 500);
  }
});

apiIncidentResponseRoutes.get('/playbooks/:id', requirePermission('incident:view'), async (c) => {
  try {
    const id = c.req.param('id');
    const playbook = await incidentService.getPlaybookById(id);
    
    if (!playbook) {
      return c.json({ error: 'Playbook not found' }, 404);
    }
    
    return c.json(playbook);
  } catch (error) {
    console.error('Error getting playbook:', error);
    return c.json({ error: 'Failed to get playbook' }, 500);
  }
});

apiIncidentResponseRoutes.post('/playbooks/:id/use', requirePermission('incident:execute'), async (c) => {
  try {
    const playbookId = c.req.param('id');
    const { incidentId } = await c.req.json();
    const userEmail = getCookie(c, 'user_email') || '';
    
    const result = await incidentService.activatePlaybook(playbookId, incidentId, userEmail);
    return c.json(result);
  } catch (error) {
    console.error('Error using playbook:', error);
    return c.json({ error: 'Failed to use playbook' }, 500);
  }
});

// Automation Engine API
apiIncidentResponseRoutes.get('/automation/triggers', requirePermission('incident:view'), async (c) => {
  try {
    const triggers = await incidentService.getAutomationTriggers();
    return c.json(triggers);
  } catch (error) {
    console.error('Error getting automation triggers:', error);
    return c.json({ error: 'Failed to get automation triggers' }, 500);
  }
});

apiIncidentResponseRoutes.post('/automation/triggers', requirePermission('incident:manage'), async (c) => {
  try {
    const triggerData = await c.req.json();
    const userEmail = getCookie(c, 'user_email') || '';
    
    const trigger = await incidentService.createAutomationTrigger(triggerData, userEmail);
    return c.json(trigger);
  } catch (error) {
    console.error('Error creating automation trigger:', error);
    return c.json({ error: 'Failed to create automation trigger' }, 500);
  }
});

apiIncidentResponseRoutes.get('/automation/actions', requirePermission('incident:view'), async (c) => {
  try {
    const actions = await incidentService.getAutomationActions();
    return c.json(actions);
  } catch (error) {
    console.error('Error getting automation actions:', error);
    return c.json({ error: 'Failed to get automation actions' }, 500);
  }
});

apiIncidentResponseRoutes.post('/automation/actions/execute', requirePermission('incident:execute'), async (c) => {
  try {
    const { actionId, parameters } = await c.req.json();
    const userEmail = getCookie(c, 'user_email') || '';
    
    const result = await incidentService.executeAutomationAction(actionId, parameters, userEmail);
    return c.json(result);
  } catch (error) {
    console.error('Error executing automation action:', error);
    return c.json({ error: 'Failed to execute automation action' }, 500);
  }
});

// Incident Timeline API
apiIncidentResponseRoutes.get('/incidents/:id/timeline', requirePermission('incident:view'), async (c) => {
  try {
    const id = c.req.param('id');
    const timeline = await incidentService.getIncidentTimeline(id);
    return c.json(timeline);
  } catch (error) {
    console.error('Error getting incident timeline:', error);
    return c.json({ error: 'Failed to get incident timeline' }, 500);
  }
});

apiIncidentResponseRoutes.post('/incidents/:id/timeline', requirePermission('incident:manage'), async (c) => {
  try {
    const id = c.req.param('id');
    const timelineData = await c.req.json();
    const userEmail = getCookie(c, 'user_email') || '';
    
    const entry = await incidentService.addTimelineEntry(id, timelineData, userEmail);
    return c.json(entry);
  } catch (error) {
    console.error('Error adding timeline entry:', error);
    return c.json({ error: 'Failed to add timeline entry' }, 500);
  }
});

// Evidence Management API
apiIncidentResponseRoutes.get('/incidents/:id/evidence', requirePermission('incident:view'), async (c) => {
  try {
    const id = c.req.param('id');
    const evidence = await incidentService.getIncidentEvidence(id);
    return c.json(evidence);
  } catch (error) {
    console.error('Error getting incident evidence:', error);
    return c.json({ error: 'Failed to get incident evidence' }, 500);
  }
});

apiIncidentResponseRoutes.post('/incidents/:id/evidence', requirePermission('incident:manage'), async (c) => {
  try {
    const id = c.req.param('id');
    const evidenceData = await c.req.json();
    const userEmail = getCookie(c, 'user_email') || '';
    
    const evidence = await incidentService.addEvidence(id, evidenceData, userEmail);
    return c.json(evidence);
  } catch (error) {
    console.error('Error adding evidence:', error);
    return c.json({ error: 'Failed to add evidence' }, 500);
  }
});

// Incident Communications API
apiIncidentResponseRoutes.get('/incidents/:id/communications', requirePermission('incident:view'), async (c) => {
  try {
    const id = c.req.param('id');
    const communications = await incidentService.getIncidentCommunications(id);
    return c.json(communications);
  } catch (error) {
    console.error('Error getting incident communications:', error);
    return c.json({ error: 'Failed to get incident communications' }, 500);
  }
});

apiIncidentResponseRoutes.post('/incidents/:id/communications', requirePermission('incident:manage'), async (c) => {
  try {
    const id = c.req.param('id');
    const commData = await c.req.json();
    const userEmail = getCookie(c, 'user_email') || '';
    
    const communication = await incidentService.sendCommunication(id, commData, userEmail);
    return c.json(communication);
  } catch (error) {
    console.error('Error sending communication:', error);
    return c.json({ error: 'Failed to send communication' }, 500);
  }
});

// Incident Metrics API
apiIncidentResponseRoutes.get('/metrics/overview', requirePermission('incident:view'), async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '30');
    const metrics = await incidentService.getIncidentMetrics(days);
    return c.json(metrics);
  } catch (error) {
    console.error('Error getting incident metrics:', error);
    return c.json({ error: 'Failed to get incident metrics' }, 500);
  }
});

apiIncidentResponseRoutes.get('/metrics/response-times', requirePermission('incident:view'), async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '30');
    const responseTimes = await incidentService.getResponseTimeMetrics(days);
    return c.json(responseTimes);
  } catch (error) {
    console.error('Error getting response time metrics:', error);
    return c.json({ error: 'Failed to get response time metrics' }, 500);
  }
});

apiIncidentResponseRoutes.get('/metrics/sla-compliance', requirePermission('incident:view'), async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '30');
    const slaCompliance = await incidentService.getSLAComplianceMetrics(days);
    return c.json(slaCompliance);
  } catch (error) {
    console.error('Error getting SLA compliance metrics:', error);
    return c.json({ error: 'Failed to get SLA compliance metrics' }, 500);
  }
});

// Incident Reporting API
apiIncidentResponseRoutes.post('/incidents/:id/report', requirePermission('incident:view'), async (c) => {
  try {
    const id = c.req.param('id');
    const { format = 'pdf' } = await c.req.json();
    const userEmail = getCookie(c, 'user_email') || '';
    
    const report = await incidentService.generateIncidentReport(id, format, userEmail);
    
    return new Response(report.content, {
      headers: {
        'Content-Type': report.mimeType,
        'Content-Disposition': `attachment; filename="${report.filename}"`
      }
    });
  } catch (error) {
    console.error('Error generating incident report:', error);
    return c.json({ error: 'Failed to generate incident report' }, 500);
  }
});

export { apiIncidentResponseRoutes };