import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import type { CloudflareBindings } from '../types';

export function createIncidentsRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware to all routes
  app.use('*', requireAuth);
  
  // Main Incidents Dashboard
  app.get('/', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Incident Management',
        user,
        content: renderIncidentsDashboard()
      })
    );
  });
  
  // Security Events
  app.get('/security-events', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Security Events',
        user,
        content: renderSecurityEvents()
      })
    );
  });
  
  // Response Actions
  app.get('/response-actions', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Response Actions',
        user,
        content: renderResponseActions()
      })
    );
  });
  
  // API: Get incidents list
  app.get('/api/incidents', async (c) => {
    try {
      const result = await c.env.DB.prepare(`
        SELECT * FROM incidents 
        ORDER BY created_at DESC
        LIMIT 50
      `).all();
      
      return c.json({ success: true, incidents: result.results || [] });
    } catch (error) {
      console.error('Error fetching incidents:', error);
      return c.json({ success: false, error: 'Failed to fetch incidents' }, 500);
    }
  });
  
  // API: Get incident details
  app.get('/api/incidents/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const result = await c.env.DB.prepare(`
        SELECT * FROM incidents WHERE id = ?
      `).bind(id).first();
      
      if (!result) {
        return c.json({ success: false, error: 'Incident not found' }, 404);
      }
      
      return c.json({ success: true, incident: result });
    } catch (error) {
      console.error('Error fetching incident:', error);
      return c.json({ success: false, error: 'Failed to fetch incident' }, 500);
    }
  });
  
  // API: Create new incident
  app.post('/api/incidents', async (c) => {
    try {
      const body = await c.req.json();
      const user = c.get('user');
      
      const result = await c.env.DB.prepare(`
        INSERT INTO incidents (
          title, description, severity, status, category, 
          source, assigned_to, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        body.title,
        body.description,
        body.severity || 'medium',
        body.status || 'open',
        body.category || 'security',
        body.source || 'manual',
        body.assigned_to || null,
        user.id
      ).run();
      
      return c.json({ 
        success: true, 
        incident: { id: result.meta.last_row_id, ...body } 
      });
    } catch (error) {
      console.error('Error creating incident:', error);
      return c.json({ success: false, error: 'Failed to create incident' }, 500);
    }
  });
  
  // API: Update incident
  app.put('/api/incidents/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      
      await c.env.DB.prepare(`
        UPDATE incidents 
        SET 
          title = COALESCE(?, title),
          description = COALESCE(?, description),
          severity = COALESCE(?, severity),
          status = COALESCE(?, status),
          assigned_to = COALESCE(?, assigned_to),
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(
        body.title,
        body.description,
        body.severity,
        body.status,
        body.assigned_to,
        id
      ).run();
      
      return c.json({ success: true, message: 'Incident updated' });
    } catch (error) {
      console.error('Error updating incident:', error);
      return c.json({ success: false, error: 'Failed to update incident' }, 500);
    }
  });
  
  // ========== Week 6: Workflow Automation API Endpoints ==========
  
  /**
   * Trigger workflow automation for an incident
   */
  app.post('/api/incidents/:id/trigger-workflow', async (c) => {
    try {
      const incidentId = parseInt(c.req.param('id'));
      const user = c.get('user');
      
      // Import workflow engine
      const { IncidentWorkflowEngine } = await import('../lib/incident-workflow-engine');
      const engine = new IncidentWorkflowEngine(c.env.DB);
      
      // Get incident details
      const incident = await c.env.DB.prepare(`
        SELECT * FROM incidents WHERE id = ?
      `).bind(incidentId).first();
      
      if (!incident) {
        return c.json({ success: false, error: 'Incident not found' }, 404);
      }
      
      // Find matching workflows
      const workflows = await engine.findMatchingWorkflows(incident, user.organizationId || 1);
      
      if (workflows.length === 0) {
        return c.json({ 
          success: false, 
          message: 'No matching workflows found for this incident' 
        });
      }
      
      // Execute the first matching workflow
      const execution = await engine.executeWorkflow(incidentId, workflows[0], user.id);
      
      return c.json({
        success: true,
        message: `Workflow "${workflows[0].name}" triggered successfully`,
        execution
      });
      
    } catch (error) {
      console.error('Error triggering workflow:', error);
      return c.json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to trigger workflow' 
      }, 500);
    }
  });
  
  /**
   * Get workflow executions for an incident
   */
  app.get('/api/incidents/:id/workflows', async (c) => {
    try {
      const incidentId = parseInt(c.req.param('id'));
      
      const { IncidentWorkflowEngine } = await import('../lib/incident-workflow-engine');
      const engine = new IncidentWorkflowEngine(c.env.DB);
      
      const executions = await engine.getIncidentWorkflows(incidentId);
      
      return c.json({ success: true, executions });
      
    } catch (error) {
      console.error('Error fetching workflows:', error);
      return c.json({ success: false, error: 'Failed to fetch workflows' }, 500);
    }
  });
  
  /**
   * Get response actions for an incident
   */
  app.get('/api/incidents/:id/actions', async (c) => {
    try {
      const incidentId = parseInt(c.req.param('id'));
      
      const { IncidentWorkflowEngine } = await import('../lib/incident-workflow-engine');
      const engine = new IncidentWorkflowEngine(c.env.DB);
      
      const actions = await engine.getIncidentActions(incidentId);
      
      return c.json({ success: true, actions });
      
    } catch (error) {
      console.error('Error fetching actions:', error);
      return c.json({ success: false, error: 'Failed to fetch actions' }, 500);
    }
  });
  
  /**
   * Update response action status
   */
  app.put('/api/actions/:id/status', async (c) => {
    try {
      const actionId = parseInt(c.req.param('id'));
      const { status, notes } = await c.req.json();
      
      const { IncidentWorkflowEngine } = await import('../lib/incident-workflow-engine');
      const engine = new IncidentWorkflowEngine(c.env.DB);
      
      await engine.updateActionStatus(actionId, status, notes);
      
      return c.json({ success: true, message: 'Action status updated' });
      
    } catch (error) {
      console.error('Error updating action:', error);
      return c.json({ success: false, error: 'Failed to update action' }, 500);
    }
  });
  
  /**
   * Get all workflows (for management)
   */
  app.get('/api/workflows', async (c) => {
    try {
      const user = c.get('user');
      
      const result = await c.env.DB.prepare(`
        SELECT * FROM incident_workflows
        WHERE organization_id = ?
        ORDER BY is_active DESC, name ASC
      `).bind(user.organizationId || 1).all();
      
      return c.json({ success: true, workflows: result.results || [] });
      
    } catch (error) {
      console.error('Error fetching workflows:', error);
      return c.json({ success: false, error: 'Failed to fetch workflows' }, 500);
    }
  });
  
  return app;
}

// Main Incidents Dashboard
const renderIncidentsDashboard = () => html`
  <div class="min-h-screen bg-gray-50 py-6 sm:py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-6 sm:mb-8">
        <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
          <i class="fas fa-exclamation-circle text-orange-600 mr-2 sm:mr-3 text-lg sm:text-xl lg:text-2xl"></i>
          Active Incidents
        </h1>
        <p class="mt-2 text-sm sm:text-base text-gray-600">
          Manage and track security incidents from Microsoft Defender and ServiceNow
        </p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Open Incidents</p>
              <p class="text-3xl font-bold text-red-600" id="open-count">--</p>
            </div>
            <i class="fas fa-exclamation-circle text-red-500 text-3xl opacity-20"></i>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">In Progress</p>
              <p class="text-3xl font-bold text-yellow-600" id="progress-count">--</p>
            </div>
            <i class="fas fa-tasks text-yellow-500 text-3xl opacity-20"></i>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Today</p>
              <p class="text-3xl font-bold text-blue-600" id="today-count">--</p>
            </div>
            <i class="fas fa-calendar-day text-blue-500 text-3xl opacity-20"></i>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Resolved</p>
              <p class="text-3xl font-bold text-green-600" id="resolved-count">--</p>
            </div>
            <i class="fas fa-check-circle text-green-500 text-3xl opacity-20"></i>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
        <h2 class="text-lg font-semibold mb-4 flex items-center">
          <i class="fas fa-bolt text-blue-600 mr-2"></i>
          Quick Actions
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button onclick="createIncident()" class="flex items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors">
            <i class="fas fa-plus-circle text-orange-600 mr-2"></i>
            <span class="font-medium text-orange-800">Create Incident</span>
          </button>
          
          <a href="/incidents/security-events" class="flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition-colors">
            <i class="fas fa-shield-alt text-purple-600 mr-2"></i>
            <span class="font-medium text-purple-800">Security Events</span>
          </a>
          
          <a href="/incidents/response-actions" class="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors">
            <i class="fas fa-tasks text-blue-600 mr-2"></i>
            <span class="font-medium text-blue-800">Response Actions</span>
          </a>
        </div>
      </div>

      <!-- Incidents Table -->
      <div class="bg-white rounded-lg shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">Recent Incidents</h2>
          <div class="flex items-center space-x-2">
            <input type="text" placeholder="Search incidents..." 
                   class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <i class="fas fa-search"></i>
            </button>
          </div>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incident</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody id="incidents-table-body" class="bg-white divide-y divide-gray-200">
              <tr>
                <td colspan="7" class="px-6 py-12 text-center text-gray-500">
                  <i class="fas fa-spinner fa-spin text-3xl mb-3 text-gray-300"></i>
                  <p>Loading incidents...</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <script>
    // Load incidents on page load
    async function loadIncidents() {
      try {
        const response = await fetch('/incidents/api/incidents');
        const data = await response.json();
        
        if (data.success) {
          updateStats(data.incidents);
          renderIncidentsTable(data.incidents);
        }
      } catch (error) {
        console.error('Error loading incidents:', error);
        document.getElementById('incidents-table-body').innerHTML = \`
          <tr>
            <td colspan="7" class="px-6 py-8 text-center text-red-600">
              <i class="fas fa-exclamation-triangle mr-2"></i>
              Failed to load incidents
            </td>
          </tr>
        \`;
      }
    }
    
    function updateStats(incidents) {
      const openCount = incidents.filter(i => i.status === 'open').length;
      const progressCount = incidents.filter(i => i.status === 'in_progress').length;
      const resolvedCount = incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length;
      const today = new Date().toISOString().split('T')[0];
      const todayCount = incidents.filter(i => i.created_at?.startsWith(today)).length;
      
      document.getElementById('open-count').textContent = openCount;
      document.getElementById('progress-count').textContent = progressCount;
      document.getElementById('resolved-count').textContent = resolvedCount;
      document.getElementById('today-count').textContent = todayCount;
    }
    
    function renderIncidentsTable(incidents) {
      const tbody = document.getElementById('incidents-table-body');
      
      if (incidents.length === 0) {
        tbody.innerHTML = \`
          <tr>
            <td colspan="7" class="px-6 py-8 text-center text-gray-500">
              <i class="fas fa-info-circle mr-2"></i>
              No incidents found. You're all clear!
            </td>
          </tr>
        \`;
        return;
      }
      
      tbody.innerHTML = incidents.map(incident => \`
        <tr class="hover:bg-gray-50">
          <td class="px-6 py-4">
            <div class="text-sm font-medium text-gray-900">\${incident.title || 'Untitled'}</div>
            <div class="text-sm text-gray-500">\${incident.description?.substring(0, 50) || ''}...</div>
          </td>
          <td class="px-6 py-4">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full \${getSeverityColor(incident.severity)}">
              \${incident.severity || 'medium'}
            </span>
          </td>
          <td class="px-6 py-4">
            <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full \${getStatusColor(incident.status)}">
              \${incident.status || 'open'}
            </span>
          </td>
          <td class="px-6 py-4 text-sm text-gray-500">
            \${incident.source || 'Manual'}
          </td>
          <td class="px-6 py-4 text-sm text-gray-500">
            \${incident.assigned_to || 'Unassigned'}
          </td>
          <td class="px-6 py-4 text-sm text-gray-500">
            \${new Date(incident.created_at).toLocaleString()}
          </td>
          <td class="px-6 py-4 text-sm font-medium">
            <button onclick="viewIncident(\${incident.id})" class="text-blue-600 hover:text-blue-900 mr-3">
              <i class="fas fa-eye"></i>
            </button>
            <button onclick="editIncident(\${incident.id})" class="text-green-600 hover:text-green-900">
              <i class="fas fa-edit"></i>
            </button>
          </td>
        </tr>
      \`).join('');
    }
    
    function getSeverityColor(severity) {
      switch(severity?.toLowerCase()) {
        case 'critical': return 'bg-red-100 text-red-800';
        case 'high': return 'bg-orange-100 text-orange-800';
        case 'medium': return 'bg-yellow-100 text-yellow-800';
        case 'low': return 'bg-green-100 text-green-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    }
    
    function getStatusColor(status) {
      switch(status?.toLowerCase()) {
        case 'open': return 'bg-red-100 text-red-800';
        case 'in_progress': return 'bg-yellow-100 text-yellow-800';
        case 'resolved': return 'bg-green-100 text-green-800';
        case 'closed': return 'bg-gray-100 text-gray-800';
        default: return 'bg-blue-100 text-blue-800';
      }
    }
    
    function createIncident() {
      alert('Create incident modal - Coming soon!');
    }
    
    function viewIncident(id) {
      window.location.href = \`/incidents/\${id}\`;
    }
    
    function editIncident(id) {
      alert(\`Edit incident \${id} - Coming soon!\`);
    }
    
    // Load incidents when page loads
    loadIncidents();
  </script>
`;

// Security Events Page
const renderSecurityEvents = () => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 flex items-center">
          <i class="fas fa-shield-alt text-purple-600 mr-3"></i>
          Security Events
        </h1>
        <p class="mt-2 text-lg text-gray-600">Event correlation from SIEM & EDR systems</p>
      </div>

      <div class="bg-blue-50 border-l-4 border-blue-500 p-6 mb-8">
        <div class="flex items-center">
          <i class="fas fa-info-circle text-blue-500 mr-3 text-2xl"></i>
          <div>
            <h3 class="text-lg font-medium text-blue-900">Integration Status</h3>
            <p class="text-sm text-blue-700 mt-1">
              Microsoft Defender for Endpoint integration active. Real-time event correlation in progress.
            </p>
          </div>
        </div>
      </div>

      <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold">Recent Security Events</h2>
        </div>
        <div class="p-6">
          <p class="text-gray-600">Security event monitoring will display here...</p>
        </div>
      </div>
    </div>
  </div>
`;

// Response Actions Page
const renderResponseActions = () => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 flex items-center">
          <i class="fas fa-tasks text-blue-600 mr-3"></i>
          Response Actions
        </h1>
        <p class="mt-2 text-lg text-gray-600">Track remediation tasks and playbooks</p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold mb-4">Active Playbooks</h3>
          <p class="text-4xl font-bold text-blue-600">3</p>
          <p class="text-sm text-gray-500 mt-2">Currently executing</p>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold mb-4">Pending Tasks</h3>
          <p class="text-4xl font-bold text-yellow-600">8</p>
          <p class="text-sm text-gray-500 mt-2">Awaiting action</p>
        </div>
        
        <div class="bg-white rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold mb-4">Completed Today</h3>
          <p class="text-4xl font-bold text-green-600">12</p>
          <p class="text-sm text-gray-500 mt-2">Successfully resolved</p>
        </div>
      </div>

      <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold">Response Action Queue</h2>
        </div>
        <div class="p-6">
          <p class="text-gray-600">Response actions and automated playbooks will display here...</p>
        </div>
      </div>
    </div>
  </div>
`;
