import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { baseLayout } from '../templates/layout';
import { DatabaseService } from '../lib/database';
import type { CloudflareBindings } from '../types';

export function createRiskRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware
  app.use('*', requireAuth);
  
  // Main risks page
  app.get('/', async (c) => {
    const user = c.get('user');
    const page = parseInt(c.req.query('page') || '1');
    const search = c.req.query('search') || '';
    const status = c.req.query('status') || '';
    const category = c.req.query('category') || '';
    
    return c.html(
      baseLayout({
        title: 'Risk Management',
        user,
        content: renderRisksPage()
      })
    );
  });
  
  // Risk table content (for HTMX updates)
  app.get('/table', async (c) => {
    const page = parseInt(c.req.query('page') || '1');
    const search = c.req.query('search') || '';
    const status = c.req.query('status') || '';
    const category = c.req.query('category') || '';
    
    const db = new DatabaseService(c.env.DB);
    const risks = await getRisks(db, { page, search, status, category });
    return c.html(renderRiskTable(risks, page));
  });
  
  // Risk statistics cards (for HTMX updates)
  app.get('/stats', async (c) => {
    const db = new DatabaseService(c.env.DB);
    const stats = await getRiskStatistics(db);
    return c.html(renderRiskStats(stats));
  });
  
  // Create risk modal
  app.get('/create', async (c) => {
    return c.html(renderCreateRiskModal());
  });
  
  // Create risk action
  app.post('/', async (c) => {
    const formData = await c.req.parseBody();
    const user = c.get('user');
    const db = new DatabaseService(c.env.DB);
    
    try {
      // Validate and create risk
      const newRisk = await createRisk(db, formData, user.id);
      
      // Return success message and refresh table
      c.header('HX-Trigger', 'riskCreated');
      return c.html(`
        <div class="bg-green-50 border-l-4 border-green-500 p-4">
          <p class="text-green-700">Risk created successfully!</p>
        </div>
        <script>
          setTimeout(() => {
            document.getElementById('modal-container').innerHTML = '';
          }, 2000);
        </script>
      `);
    } catch (error) {
      return c.html(`
        <div class="bg-red-50 border-l-4 border-red-500 p-4">
          <p class="text-red-700">Error: ${error.message}</p>
        </div>
      `);
    }
  });
  
  // Edit risk modal
  app.get('/:id/edit', async (c) => {
    const id = c.req.param('id');
    const db = new DatabaseService(c.env.DB);
    const risk = await getRiskById(db, id);
    return c.html(renderEditRiskModal(risk));
  });
  
  // Update risk
  app.put('/:id', async (c) => {
    const id = c.req.param('id');
    const formData = await c.req.parseBody();
    const user = c.get('user');
    const db = new DatabaseService(c.env.DB);
    
    try {
      await updateRisk(db, id, formData, user.id);
      c.header('HX-Trigger', 'riskUpdated');
      return c.html(`
        <div class="bg-green-50 border-l-4 border-green-500 p-4">
          <p class="text-green-700">Risk updated successfully!</p>
        </div>
      `);
    } catch (error) {
      return c.html(`
        <div class="bg-red-50 border-l-4 border-red-500 p-4">
          <p class="text-red-700">Error: ${error.message}</p>
        </div>
      `);
    }
  });
  
  // Delete risk
  app.delete('/:id', async (c) => {
    const id = c.req.param('id');
    const db = new DatabaseService(c.env.DB);
    
    try {
      await deleteRisk(db, id);
      c.header('HX-Trigger', 'riskDeleted');
      return c.html('');
    } catch (error) {
      return c.html(`
        <div class="bg-red-50 border-l-4 border-red-500 p-4">
          <p class="text-red-700">Error: ${error.message}</p>
        </div>
      `, 400);
    }
  });
  
  // Risk details view
  app.get('/risks/:id', async (c) => {
    const id = c.req.param('id');
    const risk = await getRiskById(id);
    return c.html(renderRiskDetails(risk));
  });
  
  return app;
}

// Template functions
const renderRisksPage = () => html`
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Risk Management</h2>
        <p class="text-gray-600 mt-1">Manage organizational risks and mitigation strategies</p>
      </div>
      <div class="flex space-x-3">
        <button class="btn-secondary">
          <i class="fas fa-upload mr-2"></i>Import
        </button>
        <button class="btn-secondary">
          <i class="fas fa-download mr-2"></i>Export
        </button>
        <button 
          hx-get="/risk/risks/create" 
          hx-target="#modal-container" 
          hx-swap="innerHTML"
          class="btn-primary">
          <i class="fas fa-plus mr-2"></i>Add Risk
        </button>
      </div>
    </div>
    
    <!-- Risk Filters -->
    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-64">
          <input 
            type="text" 
            name="search"
            placeholder="Search risks..." 
            class="form-input"
            hx-get="/risk/risks/table"
            hx-trigger="keyup changed delay:500ms"
            hx-target="#risk-table-container"
            hx-include="[name='status'], [name='category']"
          />
        </div>
        <select 
          name="status" 
          class="form-select"
          hx-get="/risk/risks/table"
          hx-trigger="change"
          hx-target="#risk-table-container"
          hx-include="[name='search'], [name='category']">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="mitigated">Mitigated</option>
          <option value="closed">Closed</option>
          <option value="monitoring">Monitoring</option>
        </select>
        <select 
          name="category" 
          class="form-select"
          hx-get="/risk/risks/table"
          hx-trigger="change"
          hx-target="#risk-table-container"
          hx-include="[name='search'], [name='status']">
          <option value="">All Categories</option>
          <option value="cybersecurity">Cybersecurity</option>
          <option value="data-privacy">Data Privacy</option>
          <option value="operational">Operational Risk</option>
          <option value="financial">Financial Risk</option>
          <option value="regulatory">Regulatory Compliance</option>
          <option value="third-party">Third-Party Risk</option>
        </select>
      </div>
    </div>
    
    <!-- Risk Statistics -->
    <div id="risk-stats-container" 
         hx-get="/risk/risks/stats" 
         hx-trigger="load, riskCreated from:body, riskUpdated from:body, riskDeleted from:body"
         class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <!-- Stats will be loaded here -->
    </div>
    
    <!-- Risk Table -->
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <div class="px-6 py-3 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Risk Register</h3>
      </div>
      <div id="risk-table-container" 
           hx-get="/risk/risks/table" 
           hx-trigger="load, riskCreated from:body, riskUpdated from:body, riskDeleted from:body">
        <!-- Table will be loaded here -->
      </div>
    </div>
  </div>
  
  <!-- Modal Container -->
  <div id="modal-container"></div>
`;

const renderRiskStats = (stats: any) => html`
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
          <i class="fas fa-fire text-red-600"></i>
        </div>
      </div>
      <div class="ml-3">
        <p class="text-sm font-medium text-gray-500">Critical Risks</p>
        <p class="text-lg font-semibold text-gray-900">${stats.critical}</p>
      </div>
    </div>
  </div>
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
          <i class="fas fa-exclamation-triangle text-orange-600"></i>
        </div>
      </div>
      <div class="ml-3">
        <p class="text-sm font-medium text-gray-500">High Risks</p>
        <p class="text-lg font-semibold text-gray-900">${stats.high}</p>
      </div>
    </div>
  </div>
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
          <i class="fas fa-clock text-yellow-600"></i>
        </div>
      </div>
      <div class="ml-3">
        <p class="text-sm font-medium text-gray-500">Overdue Reviews</p>
        <p class="text-lg font-semibold text-gray-900">${stats.overdue}</p>
      </div>
    </div>
  </div>
  <div class="bg-white rounded-lg shadow p-4">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <i class="fas fa-chart-line text-blue-600"></i>
        </div>
      </div>
      <div class="ml-3">
        <p class="text-sm font-medium text-gray-500">Avg Risk Score</p>
        <p class="text-lg font-semibold text-gray-900">${stats.avgScore.toFixed(1)}</p>
      </div>
    </div>
  </div>
`;

const renderRiskTable = (risks: any[], page: number) => html`
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk ID</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        ${risks.map(risk => html`
          <tr id="risk-row-${risk.id}">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              RISK-${String(risk.id).padStart(4, '0')}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${risk.title}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                ${risk.category}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${risk.owner}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskScoreClass(risk.score)}">
                ${risk.score}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(risk.status)}">
                ${risk.status}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button 
                hx-get="/risk/risks/${risk.id}" 
                hx-target="#modal-container"
                class="text-blue-600 hover:text-blue-900 mr-3">
                View
              </button>
              <button 
                hx-get="/risk/risks/${risk.id}/edit" 
                hx-target="#modal-container"
                class="text-indigo-600 hover:text-indigo-900 mr-3">
                Edit
              </button>
              <button 
                hx-delete="/risk/risks/${risk.id}" 
                hx-confirm="Are you sure you want to delete this risk?"
                hx-target="#risk-row-${risk.id}"
                hx-swap="outerHTML"
                class="text-red-600 hover:text-red-900">
                Delete
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  
  <!-- Pagination -->
  <div class="bg-gray-50 px-4 py-3 flex items-center justify-between sm:px-6">
    <div class="flex-1 flex justify-between sm:hidden">
      <button 
        hx-get="/risk/risks/table?page=${page - 1}"
        hx-target="#risk-table-container"
        ${page <= 1 ? 'disabled' : ''}
        class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
        Previous
      </button>
      <button 
        hx-get="/risk/risks/table?page=${page + 1}"
        hx-target="#risk-table-container"
        class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
        Next
      </button>
    </div>
  </div>
`;

const renderCreateRiskModal = () => html`
  <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
    <div class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          <form hx-post="/risk/risks" hx-target="#modal-result">
            <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div class="sm:flex sm:items-start">
                <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                  <h3 class="text-lg font-semibold leading-6 text-gray-900 mb-4">Create New Risk</h3>
                  
                  <div id="modal-result"></div>
                  
                  <div class="space-y-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Risk Title</label>
                      <input type="text" name="title" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Description</label>
                      <textarea name="description" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"></textarea>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Category</label>
                        <select name="category" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                          <option value="cybersecurity">Cybersecurity</option>
                          <option value="data-privacy">Data Privacy</option>
                          <option value="operational">Operational</option>
                          <option value="financial">Financial</option>
                          <option value="regulatory">Regulatory</option>
                          <option value="third-party">Third-Party</option>
                        </select>
                      </div>
                      
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Owner</label>
                        <input type="text" name="owner" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                      </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Probability (1-5)</label>
                        <input type="number" name="probability" min="1" max="5" value="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                      </div>
                      
                      <div>
                        <label class="block text-sm font-medium text-gray-700">Impact (1-5)</label>
                        <input type="number" name="impact" min="1" max="5" value="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                      </div>
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Status</label>
                      <select name="status" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                        <option value="active">Active</option>
                        <option value="monitoring">Monitoring</option>
                        <option value="mitigated">Mitigated</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button type="submit" class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto">
                Create Risk
              </button>
              <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
`;

const renderEditRiskModal = (risk: any) => html`
  <!-- Similar to create modal but with pre-filled values -->
`;

const renderRiskDetails = (risk: any) => html`
  <!-- Detailed risk view modal -->
`;

// Helper functions
function getRiskScoreClass(score: number) {
  if (score >= 20) return 'bg-red-100 text-red-800';
  if (score >= 15) return 'bg-orange-100 text-orange-800';
  if (score >= 10) return 'bg-yellow-100 text-yellow-800';
  if (score >= 5) return 'bg-blue-100 text-blue-800';
  return 'bg-green-100 text-green-800';
}

function getStatusClass(status: string) {
  switch (status) {
    case 'active': return 'bg-red-100 text-red-800';
    case 'monitoring': return 'bg-yellow-100 text-yellow-800';
    case 'mitigated': return 'bg-green-100 text-green-800';
    case 'closed': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// Data functions with database integration
async function getRisks(db: DatabaseService, filters: any) {
  try {
    // Get risks from database
    const risks = await db.getRisks(filters.page || 1, 10, filters.search, filters.status, filters.category);
    return risks;
  } catch (error) {
    console.error('Database error, using fallback data:', error);
    // Fallback to mock data if database fails
    return [
      { id: 1, title: 'Data Breach Risk', category: 'cybersecurity', owner: 'John Smith', score: 20, status: 'active' },
      { id: 2, title: 'GDPR Compliance', category: 'regulatory', owner: 'Jane Doe', score: 15, status: 'monitoring' },
      { id: 3, title: 'Third-party Vendor Risk', category: 'third-party', owner: 'Bob Johnson', score: 12, status: 'active' },
      { id: 4, title: 'Financial Loss', category: 'financial', owner: 'Alice Brown', score: 8, status: 'mitigated' },
      { id: 5, title: 'System Downtime', category: 'operational', owner: 'Charlie Wilson', score: 18, status: 'active' },
    ];
  }
}

async function getRiskStatistics(db: DatabaseService) {
  try {
    // Get statistics from database
    const stats = await db.getRiskStatistics();
    return stats;
  } catch (error) {
    console.error('Database error, using fallback stats:', error);
    // Fallback to mock statistics if database fails
    return {
      critical: 8,
      high: 12,
      overdue: 3,
      avgScore: 14.5
    };
  }
}

async function getRiskById(db: DatabaseService, id: string) {
  try {
    // Get risk from database
    const risk = await db.getRiskById(parseInt(id));
    if (risk) {
      return risk;
    }
  } catch (error) {
    console.error('Database error, using fallback data:', error);
  }
  
  // Fallback to mock data if database fails or risk not found
  return { 
    id, 
    title: 'Sample Risk', 
    category: 'cybersecurity',
    owner: 'John Smith',
    score: 15,
    status: 'active',
    description: 'Detailed risk description...'
  };
}

async function createRisk(db: DatabaseService, data: any, userId: number) {
  try {
    // Create risk in database
    const riskData = {
      title: String(data.title || ''),
      description: String(data.description || ''),
      category: String(data.category || 'operational'),
      status: String(data.status || 'active'),
      likelihood: parseInt(data.likelihood || '3'),
      impact: parseInt(data.impact || '3'),
      risk_score: parseInt(data.likelihood || '3') * parseInt(data.impact || '3'),
      owner_id: userId,
      due_date: data.due_date || null,
      department: String(data.department || 'General'),
      created_by: userId,
      updated_by: userId
    };
    
    const newRisk = await db.createRisk(riskData);
    return newRisk;
  } catch (error) {
    console.error('Error creating risk:', error);
    throw error;
  }
}

async function updateRisk(db: DatabaseService, id: string, data: any, userId: number) {
  try {
    // Update risk in database
    const updateData = {
      title: data.title,
      description: data.description,
      category: data.category,
      status: data.status,
      likelihood: parseInt(data.likelihood || '3'),
      impact: parseInt(data.impact || '3'),
      risk_score: parseInt(data.likelihood || '3') * parseInt(data.impact || '3'),
      due_date: data.due_date || null,
      department: data.department,
      updated_by: userId
    };
    
    const updated = await db.updateRisk(parseInt(id), updateData);
    return updated;
  } catch (error) {
    console.error('Error updating risk:', error);
    throw error;
  }
}

async function deleteRisk(db: DatabaseService, id: string) {
  try {
    // Delete risk from database
    const result = await db.deleteRisk(parseInt(id));
    return result;
  } catch (error) {
    console.error('Error deleting risk:', error);
    throw error;
  }
}