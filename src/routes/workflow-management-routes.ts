/**
 * Workflow Management Routes
 * Week 6 UI - Incident Workflow Automation Interface
 */

import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import type { CloudflareBindings } from '../types';

export function createWorkflowManagementRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  app.use('*', requireAuth);
  
  // Workflow List Page
  app.get('/', async (c) => {
    const user = c.get('user');
    return c.html(cleanLayout({
      title: 'Workflow Management',
      user,
      content: renderWorkflowList()
    }));
  });
  
  // Create Workflow Page
  app.get('/create', async (c) => {
    const user = c.get('user');
    return c.html(cleanLayout({
      title: 'Create Workflow',
      user,
      content: renderWorkflowCreate()
    }));
  });
  
  // API: Get all workflows
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
      return c.json({ success: false, error: 'Failed to fetch workflows' }, 500);
    }
  });
  
  // API: Create workflow
  app.post('/api/workflows', async (c) => {
    try {
      const user = c.get('user');
      const body = await c.req.json();
      
      const result = await c.env.DB.prepare(`
        INSERT INTO incident_workflows (
          name, description, trigger_conditions, workflow_steps,
          is_active, organization_id, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        RETURNING id
      `).bind(
        body.name,
        body.description || null,
        JSON.stringify(body.trigger_conditions),
        JSON.stringify(body.workflow_steps),
        body.is_active ?? 1,
        user.organizationId || 1,
        user.id
      ).first();
      
      return c.json({ success: true, workflow_id: result?.id });
    } catch (error) {
      return c.json({ success: false, error: 'Failed to create workflow' }, 500);
    }
  });
  
  // API: Toggle workflow
  app.post('/api/workflows/:id/toggle', async (c) => {
    try {
      const workflowId = c.req.param('id');
      await c.env.DB.prepare(`
        UPDATE incident_workflows
        SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(workflowId).run();
      
      return c.json({ success: true, message: 'Workflow status toggled' });
    } catch (error) {
      return c.json({ success: false, error: 'Failed to toggle workflow' }, 500);
    }
  });
  
  // API: Delete workflow
  app.delete('/api/workflows/:id', async (c) => {
    try {
      const workflowId = c.req.param('id');
      await c.env.DB.prepare(`
        DELETE FROM incident_workflows WHERE id = ?
      `).bind(workflowId).run();
      
      return c.json({ success: true, message: 'Workflow deleted' });
    } catch (error) {
      return c.json({ success: false, error: 'Failed to delete workflow' }, 500);
    }
  });
  
  return app;
}

function renderWorkflowList() {
  return html`
    <div class="min-h-screen bg-gray-50 py-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-6 flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 flex items-center">
              <i class="fas fa-project-diagram text-blue-600 mr-3"></i>
              Workflow Management
            </h1>
            <p class="mt-2 text-gray-600">Automated incident response workflows (NIST SP 800-61)</p>
          </div>
          <a href="/workflows/create" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium">
            <i class="fas fa-plus mr-2"></i>Create Workflow
          </a>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p class="text-sm font-medium text-gray-600">Total Workflows</p>
            <p class="text-3xl font-bold text-blue-600" id="total-workflows">--</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p class="text-sm font-medium text-gray-600">Active</p>
            <p class="text-3xl font-bold text-green-600" id="active-workflows">--</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <p class="text-sm font-medium text-gray-600">Inactive</p>
            <p class="text-3xl font-bold text-yellow-600" id="inactive-workflows">--</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <p class="text-sm font-medium text-gray-600">Total Steps</p>
            <p class="text-3xl font-bold text-purple-600" id="total-steps">--</p>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div class="px-6 py-4 border-b">
            <h2 class="text-lg font-semibold">Workflows</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Triggers</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Steps</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200" id="workflows-tbody">
                <tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">
                  <i class="fas fa-spinner fa-spin mr-2"></i>Loading...
                </td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <script>
      async function loadWorkflows() {
        try {
          const response = await fetch('/workflows/api/workflows');
          const data = await response.json();
          
          if (data.success) {
            const workflows = data.workflows;
            document.getElementById('total-workflows').textContent = workflows.length;
            document.getElementById('active-workflows').textContent = workflows.filter(w => w.is_active === 1).length;
            document.getElementById('inactive-workflows').textContent = workflows.filter(w => w.is_active === 0).length;
            
            let totalSteps = 0;
            workflows.forEach(w => {
              const steps = JSON.parse(w.workflow_steps || '[]');
              totalSteps += steps.length;
            });
            document.getElementById('total-steps').textContent = totalSteps;
            
            const tbody = document.getElementById('workflows-tbody');
            if (workflows.length === 0) {
              tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No workflows found</td></tr>';
            } else {
              tbody.innerHTML = workflows.map(w => {
                const conditions = JSON.parse(w.trigger_conditions || '{}');
                const steps = JSON.parse(w.workflow_steps || '[]');
                return \`
                  <tr>
                    <td class="px-6 py-4">
                      <div class="font-medium text-gray-900">\${w.name}</div>
                      <div class="text-sm text-gray-500">\${w.description || 'No description'}</div>
                    </td>
                    <td class="px-6 py-4 text-sm">
                      \${conditions.severity ? 'Severity: ' + conditions.severity.join(', ') : 'Any'}
                    </td>
                    <td class="px-6 py-4 text-sm">\${steps.length} steps</td>
                    <td class="px-6 py-4">
                      <span class="px-2 py-1 text-xs font-semibold rounded-full \${w.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        \${w.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-sm">
                      <button onclick="toggleWorkflow(\${w.id})" class="text-blue-600 hover:text-blue-900 mr-3">
                        <i class="fas fa-power-off"></i>
                      </button>
                      <button onclick="deleteWorkflow(\${w.id})" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                \`;
              }).join('');
            }
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }

      async function toggleWorkflow(id) {
        try {
          const response = await fetch(\`/workflows/api/workflows/\${id}/toggle\`, { method: 'POST' });
          const data = await response.json();
          if (data.success) loadWorkflows();
        } catch (error) {
          alert('Failed to toggle workflow');
        }
      }

      async function deleteWorkflow(id) {
        if (!confirm('Delete this workflow?')) return;
        try {
          const response = await fetch(\`/workflows/api/workflows/\${id}\`, { method: 'DELETE' });
          const data = await response.json();
          if (data.success) loadWorkflows();
        } catch (error) {
          alert('Failed to delete workflow');
        }
      }

      document.addEventListener('DOMContentLoaded', loadWorkflows);
    </script>
  `;
}

function renderWorkflowCreate() {
  return html`
    <div class="min-h-screen bg-gray-50 py-6">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-6">Create Workflow</h1>
        
        <div class="bg-white rounded-lg shadow p-6">
          <form id="workflow-form" class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Workflow Name *</label>
              <input type="text" name="name" required class="w-full px-3 py-2 border rounded-md">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea name="description" rows="3" class="w-full px-3 py-2 border rounded-md"></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Trigger on Severity</label>
              <div class="space-x-4">
                <label><input type="checkbox" name="severity" value="critical"> Critical</label>
                <label><input type="checkbox" name="severity" value="high"> High</label>
                <label><input type="checkbox" name="severity" value="medium"> Medium</label>
                <label><input type="checkbox" name="severity" value="low"> Low</label>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Trigger on Category</label>
              <div class="space-x-4">
                <label><input type="checkbox" name="category" value="security"> Security</label>
                <label><input type="checkbox" name="category" value="operational"> Operational</label>
                <label><input type="checkbox" name="category" value="compliance"> Compliance</label>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Workflow Steps</label>
              <div id="steps-container" class="space-y-3"></div>
              <button type="button" onclick="addStep()" class="mt-3 text-blue-600 hover:text-blue-700">
                <i class="fas fa-plus mr-1"></i>Add Step
              </button>
            </div>

            <div class="flex justify-end space-x-4 pt-6 border-t">
              <a href="/workflows" class="px-6 py-2 border rounded-md hover:bg-gray-50">Cancel</a>
              <button type="submit" class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Create Workflow
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <script>
      let stepCount = 0;

      function addStep() {
        stepCount++;
        const html = \`
          <div class="border rounded-lg p-4" id="step-\${stepCount}">
            <div class="flex justify-between mb-3">
              <span class="font-medium">Step \${stepCount}</span>
              <button type="button" onclick="removeStep(\${stepCount})" class="text-red-600">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <select name="step_type_\${stepCount}" class="px-3 py-2 border rounded-md">
                <option value="notify">Notify</option>
                <option value="investigate">Investigate</option>
                <option value="contain">Contain</option>
                <option value="remediate">Remediate</option>
                <option value="document">Document</option>
                <option value="escalate">Escalate</option>
              </select>
              <input type="text" name="step_action_\${stepCount}" placeholder="Action description" class="px-3 py-2 border rounded-md">
            </div>
          </div>
        \`;
        document.getElementById('steps-container').insertAdjacentHTML('beforeend', html);
      }

      function removeStep(id) {
        document.getElementById(\`step-\${id}\`)?.remove();
      }

      addStep(); // Add initial step

      document.getElementById('workflow-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        
        const steps = [];
        for (let i = 1; i <= stepCount; i++) {
          const type = formData.get(\`step_type_\${i}\`);
          const action = formData.get(\`step_action_\${i}\`);
          if (type && action) {
            steps.push({ id: String(i), type, action, parameters: {} });
          }
        }
        
        const workflow = {
          name: formData.get('name'),
          description: formData.get('description'),
          trigger_conditions: {
            severity: Array.from(formData.getAll('severity')),
            category: Array.from(formData.getAll('category'))
          },
          workflow_steps: steps,
          is_active: 1
        };
        
        try {
          const response = await fetch('/workflows/api/workflows', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(workflow)
          });
          const data = await response.json();
          if (data.success) {
            alert('Workflow created!');
            window.location.href = '/workflows';
          } else {
            alert('Error: ' + data.error);
          }
        } catch (error) {
          alert('Failed to create workflow');
        }
      });
    </script>
  `;
}
