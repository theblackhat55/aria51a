/**
 * Workflow Management Routes
 * Week 6 UI - Incident Workflow Automation Interface
 * 
 * Features:
 * - List all workflows
 * - Create/edit workflows
 * - View workflow executions
 * - Monitor automation status
 */

import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import type { CloudflareBindings } from '../types';

export function createWorkflowManagementRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware
  app.use('*', requireAuth);
  
  /**
   * Workflow List Page
   */
  app.get('/', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Workflow Management',
        user,
        content: renderWorkflowList()
      })
    );
  });
  
  /**
   * Create Workflow Page
   */
  app.get('/create', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Create Workflow',
        user,
        content: renderWorkflowCreate()
      })
    );
  });
  
  /**
   * Edit Workflow Page
   */
  app.get('/:id/edit', async (c) => {
    const user = c.get('user');
    const workflowId = c.req.param('id');
    
    return c.html(
      cleanLayout({
        title: 'Edit Workflow',
        user,
        content: renderWorkflowEdit(workflowId)
      })
    );
  });
  
  /**
   * Workflow Execution History
   */
  app.get('/:id/executions', async (c) => {
    const user = c.get('user');
    const workflowId = c.req.param('id');
    
    return c.html(
      cleanLayout({
        title: 'Workflow Executions',
        user,
        content: renderWorkflowExecutions(workflowId)
      })
    );
  });
  
  /**
   * API: Get all workflows
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
      return c.json({ success: false, error: 'Failed to fetch workflows' }, 500);
    }
  });
  
  /**
   * API: Create workflow
   */
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
  
  /**
   * API: Update workflow
   */
  app.put('/api/workflows/:id', async (c) => {
    try {
      const workflowId = c.req.param('id');
      const body = await c.req.json();
      
      await c.env.DB.prepare(`
        UPDATE incident_workflows
        SET name = ?, description = ?, trigger_conditions = ?,
            workflow_steps = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        body.name,
        body.description || null,
        JSON.stringify(body.trigger_conditions),
        JSON.stringify(body.workflow_steps),
        body.is_active ?? 1,
        workflowId
      ).run();
      
      return c.json({ success: true, message: 'Workflow updated' });
    } catch (error) {
      return c.json({ success: false, error: 'Failed to update workflow' }, 500);
    }
  });
  
  /**
   * API: Delete workflow
   */
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
  
  /**
   * API: Toggle workflow active status
   */
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
  
  return app;
}

// ========== UI RENDERING FUNCTIONS ==========

function renderWorkflowList() {
  return html`
    <div class="min-h-screen bg-gray-50 py-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-6 flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 flex items-center">
              <i class="fas fa-project-diagram text-blue-600 mr-3"></i>
              Workflow Management
            </h1>
            <p class="mt-2 text-gray-600">
              Automated incident response workflows based on NIST SP 800-61
            </p>
          </div>
          <a href="/workflows/create"
             class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium flex items-center">
            <i class="fas fa-plus mr-2"></i>
            Create Workflow
          </a>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Workflows</p>
                <p class="text-3xl font-bold text-blue-600" id="total-workflows">--</p>
              </div>
              <i class="fas fa-project-diagram text-blue-500 text-3xl opacity-20"></i>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Active</p>
                <p class="text-3xl font-bold text-green-600" id="active-workflows">--</p>
              </div>
              <i class="fas fa-check-circle text-green-500 text-3xl opacity-20"></i>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Executions Today</p>
                <p class="text-3xl font-bold text-yellow-600" id="executions-today">--</p>
              </div>
              <i class="fas fa-play-circle text-yellow-500 text-3xl opacity-20"></i>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Success Rate</p>
                <p class="text-3xl font-bold text-purple-600" id="success-rate">--</p>
              </div>
              <i class="fas fa-chart-line text-purple-500 text-3xl opacity-20"></i>
            </div>
          </div>
        </div>

        <!-- Workflows Table -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Workflows</h2>
          </div>
          
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200" id="workflows-table">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trigger Conditions
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Steps
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200" id="workflows-tbody">
                <tr>
                  <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                    <i class="fas fa-spinner fa-spin mr-2"></i>
                    Loading workflows...
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <script>
      // Load workflows on page load
      async function loadWorkflows() {
        try {
          const response = await fetch('/workflows/api/workflows');
          const data = await response.json();
          
          if (data.success) {
            const workflows = data.workflows;
            
            // Update stats
            document.getElementById('total-workflows').textContent = workflows.length;
            document.getElementById('active-workflows').textContent = 
              workflows.filter(w => w.is_active === 1).length;
            
            // Render table
            const tbody = document.getElementById('workflows-tbody');
            if (workflows.length === 0) {
              tbody.innerHTML = \`
                <tr>
                  <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                    No workflows found. Create your first workflow to get started.
                  </td>
                </tr>
              \`;
            } else {
              tbody.innerHTML = workflows.map(workflow => {
                const conditions = JSON.parse(workflow.trigger_conditions || '{}');
                const steps = JSON.parse(workflow.workflow_steps || '[]');
                
                return \`
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="font-medium text-gray-900">\${workflow.name}</div>
                      <div class="text-sm text-gray-500">\${workflow.description || 'No description'}</div>
                    </td>
                    <td class="px-6 py-4">
                      <div class="text-sm text-gray-900">
                        \${conditions.severity ? \`Severity: \${conditions.severity.join(', ')}\` : ''}
                        \${conditions.category ? \`<br>Category: \${conditions.category.join(', ')}\` : ''}
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="text-sm text-gray-900">\${steps.length} steps</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full \${
                        workflow.is_active === 1 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }">
                        \${workflow.is_active === 1 ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onclick="toggleWorkflow(\${workflow.id})" 
                              class="text-blue-600 hover:text-blue-900 mr-3">
                        <i class="fas fa-power-off"></i>
                      </button>
                      <a href="/workflows/\${workflow.id}/edit" 
                         class="text-indigo-600 hover:text-indigo-900 mr-3">
                        <i class="fas fa-edit"></i>
                      </a>
                      <a href="/workflows/\${workflow.id}/executions" 
                         class="text-green-600 hover:text-green-900 mr-3">
                        <i class="fas fa-history"></i>
                      </a>
                      <button onclick="deleteWorkflow(\${workflow.id})" 
                              class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                \`;
              }).join('');
            }
          }
        } catch (error) {
          console.error('Error loading workflows:', error);
          alert('Failed to load workflows');
        }
      }

      async function toggleWorkflow(id) {
        try {
          const response = await fetch(\`/workflows/api/workflows/\${id}/toggle\`, {
            method: 'POST'
          });
          const data = await response.json();
          
          if (data.success) {
            loadWorkflows();
          } else {
            alert('Failed to toggle workflow: ' + data.error);
          }
        } catch (error) {
          console.error('Error toggling workflow:', error);
          alert('Failed to toggle workflow');
        }
      }

      async function deleteWorkflow(id) {
        if (!confirm('Are you sure you want to delete this workflow?')) {
          return;
        }
        
        try {
          const response = await fetch(\`/workflows/api/workflows/\${id}\`, {
            method: 'DELETE'
          });
          const data = await response.json();
          
          if (data.success) {
            loadWorkflows();
          } else {
            alert('Failed to delete workflow: ' + data.error);
          }
        } catch (error) {
          console.error('Error deleting workflow:', error);
          alert('Failed to delete workflow');
        }
      }

      // Load on page ready
      document.addEventListener('DOMContentLoaded', loadWorkflows);
    </script>
  `;
}

function renderWorkflowCreate() {
  return html`
    <div class="min-h-screen bg-gray-50 py-6">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-6">
          <h1 class="text-3xl font-bold text-gray-900">Create Workflow</h1>
          <p class="mt-2 text-gray-600">
            Define an automated incident response workflow
          </p>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <form id="workflow-form" class="space-y-6">
            <!-- Basic Information -->
            <div>
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
              
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Workflow Name *
                  </label>
                  <input type="text" name="name" required
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                         placeholder="e.g., Critical Malware Response">
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea name="description" rows="3"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Describe what this workflow does..."></textarea>
                </div>
              </div>
            </div>

            <!-- Trigger Conditions -->
            <div>
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Trigger Conditions</h2>
              
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Severity Levels
                  </label>
                  <div class="space-x-4">
                    <label class="inline-flex items-center">
                      <input type="checkbox" name="severity" value="critical" class="rounded text-blue-600">
                      <span class="ml-2 text-sm">Critical</span>
                    </label>
                    <label class="inline-flex items-center">
                      <input type="checkbox" name="severity" value="high" class="rounded text-blue-600">
                      <span class="ml-2 text-sm">High</span>
                    </label>
                    <label class="inline-flex items-center">
                      <input type="checkbox" name="severity" value="medium" class="rounded text-blue-600">
                      <span class="ml-2 text-sm">Medium</span>
                    </label>
                    <label class="inline-flex items-center">
                      <input type="checkbox" name="severity" value="low" class="rounded text-blue-600">
                      <span class="ml-2 text-sm">Low</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Categories
                  </label>
                  <div class="space-x-4">
                    <label class="inline-flex items-center">
                      <input type="checkbox" name="category" value="security" class="rounded text-blue-600">
                      <span class="ml-2 text-sm">Security</span>
                    </label>
                    <label class="inline-flex items-center">
                      <input type="checkbox" name="category" value="operational" class="rounded text-blue-600">
                      <span class="ml-2 text-sm">Operational</span>
                    </label>
                    <label class="inline-flex items-center">
                      <input type="checkbox" name="category" value="compliance" class="rounded text-blue-600">
                      <span class="ml-2 text-sm">Compliance</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Workflow Steps -->
            <div>
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Workflow Steps</h2>
              
              <div id="steps-container" class="space-y-4">
                <!-- Steps will be added here -->
              </div>

              <button type="button" onclick="addStep()" 
                      class="mt-4 text-blue-600 hover:text-blue-700 font-medium">
                <i class="fas fa-plus mr-2"></i>
                Add Step
              </button>
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-4 pt-6 border-t">
              <a href="/workflows" 
                 class="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                Cancel
              </a>
              <button type="submit" 
                      class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <i class="fas fa-save mr-2"></i>
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
        const container = document.getElementById('steps-container');
        const stepHtml = \`
          <div class="border border-gray-200 rounded-lg p-4" id="step-\${stepCount}">
            <div class="flex justify-between items-center mb-4">
              <h3 class="font-medium text-gray-900">Step \${stepCount}</h3>
              <button type="button" onclick="removeStep(\${stepCount})" 
                      class="text-red-600 hover:text-red-700">
                <i class="fas fa-times"></i>
              </button>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Step Type
                </label>
                <select name="step_type_\${stepCount}" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="notify">Notify</option>
                  <option value="investigate">Investigate</option>
                  <option value="contain">Contain</option>
                  <option value="remediate">Remediate</option>
                  <option value="document">Document</option>
                  <option value="escalate">Escalate</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">
                  Action Description
                </label>
                <input type="text" name="step_action_\${stepCount}" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md"
                       placeholder="Describe the action...">
              </div>
            </div>
          </div>
        \`;
        container.insertAdjacentHTML('beforeend', stepHtml);
      }

      function removeStep(id) {
        document.getElementById(\`step-\${id}\`)?.remove();
      }

      // Add initial step
      addStep();

      // Form submission
      document.getElementById('workflow-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        
        // Build trigger conditions
        const severities = Array.from(formData.getAll('severity'));
        const categories = Array.from(formData.getAll('category'));
        
        // Build workflow steps
        const steps = [];
        for (let i = 1; i <= stepCount; i++) {
          const type = formData.get(\`step_type_\${i}\`);
          const action = formData.get(\`step_action_\${i}\`);
          
          if (type && action) {
            steps.push({
              id: String(i),
              type: type,
              action: action,
              parameters: {}
            });
          }
        }
        
        const workflow = {
          name: formData.get('name'),
          description: formData.get('description'),
          trigger_conditions: {
            severity: severities,
            category: categories
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
            alert('Workflow created successfully!');
            window.location.href = '/workflows';
          } else {
            alert('Failed to create workflow: ' + data.error);
          }
        } catch (error) {
          console.error('Error creating workflow:', error);
          alert('Failed to create workflow');
        }
      });
    </script>
  `;
}

function renderWorkflowEdit(workflowId: string) {
  return html`
    <div class="min-h-screen bg-gray-50 py-6">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-6">
          <h1 class="text-3xl font-bold text-gray-900">Edit Workflow</h1>
          <p class="mt-2 text-gray-600">
            Modify workflow configuration
          </p>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-center py-12">
            <i class="fas fa-spinner fa-spin text-4xl text-gray-400 mb-4"></i>
            <p class="text-gray-600">Loading workflow...</p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderWorkflowExecutions(workflowId: string) {
  return html`
    <div class="min-h-screen bg-gray-50 py-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-6">
          <h1 class="text-3xl font-bold text-gray-900">Workflow Execution History</h1>
          <p class="mt-2 text-gray-600">
            View past executions and their results
          </p>
        </div>

        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Recent Executions</h2>
          </div>
          
          <div class="p-6">
            <div class="text-center py-12">
              <i class="fas fa-history text-4xl text-gray-400 mb-4"></i>
              <p class="text-gray-600">No execution history available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
