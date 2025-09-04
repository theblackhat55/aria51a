import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import type { CloudflareBindings } from '../types';

export function createRiskRoutesARIA5() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware
  app.use('*', requireAuth);
  
  // Main risk management page - exact match to ARIA5
  app.get('/', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Risk Management',
        user,
        content: renderARIA5RiskManagement()
      })
    );
  });

  // Risk statistics (HTMX endpoint)
  app.get('/stats', async (c) => {
    return c.html(renderRiskStats());
  });

  // Risk table (HTMX endpoint)  
  app.get('/table', async (c) => {
    return c.html(renderRiskTable());
  });

  // Create risk modal
  app.get('/create', async (c) => {
    return c.html(renderCreateRiskModal());
  });

  // Risk score calculation endpoint
  app.post('/calculate-score', async (c) => {
    const body = await c.req.parseBody();
    const likelihood = parseInt(body.likelihood as string);
    const impact = parseInt(body.impact as string);
    
    if (!likelihood || !impact) {
      return c.html(`<input type="text" name="risk_score" value="TBD" readonly class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">`);
    }
    
    const score = likelihood * impact;
    let level = 'Low';
    let colorClass = 'text-green-600';
    
    if (score >= 20) {
      level = 'Critical';
      colorClass = 'text-red-600';
    } else if (score >= 15) {
      level = 'High'; 
      colorClass = 'text-orange-600';
    } else if (score >= 10) {
      level = 'Medium';
      colorClass = 'text-yellow-600';
    } else if (score >= 5) {
      level = 'Low';
      colorClass = 'text-green-600';
    } else {
      level = 'Very Low';
      colorClass = 'text-gray-600';
    }
    
    return c.html(`
      <input type="text" 
             name="risk_score" 
             value="${score} - ${level}" 
             readonly
             class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-medium ${colorClass}">
    `);
  });

  // Risk form submission
  app.post('/create', async (c) => {
    const formData = await c.req.parseBody();
    
    // Process comprehensive form data
    const riskData = {
      risk_id: formData.risk_id,
      category: formData.category,
      title: formData.title,
      description: formData.description,
      threat_source: formData.threat_source,
      affected_services: formData['affected_services[]'] || [],
      likelihood: parseInt(formData.likelihood as string),
      impact: parseInt(formData.impact as string),
      risk_score: formData.risk_score,
      treatment_strategy: formData.treatment_strategy,
      owner: formData.owner,
      mitigation_actions: formData.mitigation_actions
    };
    
    console.log('Enhanced Risk creation:', riskData);
    
    // Return success response
    return c.html(`
      <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-center">
          <i class="fas fa-check-circle text-green-500 mr-2"></i>
          <span class="text-green-700 font-medium">Enhanced risk assessment created successfully!</span>
        </div>
        <div class="mt-2 text-sm text-green-600">
          Risk ID: ${riskData.risk_id} | Score: ${riskData.risk_score} | Owner: ${riskData.owner}
        </div>
      </div>
      <script>
        setTimeout(() => {
          document.getElementById('modal-container').innerHTML = '';
          // Refresh the risk table
          htmx.ajax('GET', '/risk/table', '#risk-table');
        }, 3000);
      </script>
    `);
  });

  return app;
}

// Main Risk Management Page - Matching ARIA5 Design Exactly
const renderARIA5RiskManagement = () => html`
  <div class="min-h-screen bg-gray-50">
    <!-- Page Header -->
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Risk Management</h1>
            <p class="mt-1 text-sm text-gray-600">Manage organizational risks and mitigation strategies</p>
          </div>
          <div class="flex space-x-3">
            <button class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center">
              <i class="fas fa-upload mr-2"></i>Import
            </button>
            <button class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center">
              <i class="fas fa-download mr-2"></i>Export  
            </button>
            <button hx-get="/risk/create"
                    hx-target="#modal-container"
                    hx-swap="innerHTML"
                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
              <i class="fas fa-plus mr-2"></i>Add Risk
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Statistics Cards -->
      <div id="risk-stats" 
           hx-get="/risk/stats" 
           hx-trigger="load"
           hx-swap="innerHTML"
           class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <!-- Loading placeholders -->
        <div class="bg-white rounded-lg shadow p-6 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div class="bg-white rounded-lg shadow p-6 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div class="bg-white rounded-lg shadow p-6 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div class="bg-white rounded-lg shadow p-6 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="bg-white rounded-lg shadow mb-6 p-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input type="text" 
                   name="search"
                   placeholder="Search risks..."
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">All Status</label>
            <select name="status" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="mitigated">Mitigated</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">All Categories</label>
            <select name="category" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Categories</option>
              <option value="cybersecurity">Cybersecurity</option>
              <option value="data-privacy">Data Privacy</option>
              <option value="third-party">Third-Party Risk</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">All Risk Levels</label>
            <select name="risk_level" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Risk Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Risk Register Table -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Risk Register</h3>
        </div>
        
        <div id="risk-table"
             hx-get="/risk/table"
             hx-trigger="load"
             hx-swap="innerHTML">
          <!-- Loading placeholder -->
          <div class="p-8 text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p class="text-gray-600 mt-2">Loading risks...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

// Risk Statistics Cards
const renderRiskStats = () => html`
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
      </div>
      <div class="ml-4">
        <p class="text-sm font-medium text-gray-500">Critical Risks</p>
        <p class="text-2xl font-semibold text-gray-900">2</p>
      </div>
    </div>
  </div>
  
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <i class="fas fa-fire text-2xl text-orange-500"></i>
      </div>
      <div class="ml-4">
        <p class="text-sm font-medium text-gray-500">High Risks</p>
        <p class="text-2xl font-semibold text-gray-900">6</p>
      </div>
    </div>
  </div>

  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <i class="fas fa-check-circle text-2xl text-green-500"></i>
      </div>
      <div class="ml-4">
        <p class="text-sm font-medium text-gray-500">Overdue Reviews</p>
        <p class="text-2xl font-semibold text-gray-900">3</p>
      </div>
    </div>
  </div>

  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <i class="fas fa-chart-line text-2xl text-blue-500"></i>
      </div>
      <div class="ml-4">
        <p class="text-sm font-medium text-gray-500">Avg Risk Score</p>
        <p class="text-2xl font-semibold text-gray-900">12.2</p>
      </div>
    </div>
  </div>
`;

// Risk Table matching ARIA5 design
const renderRiskTable = () => html`
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk ID</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Probability</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impact</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Review</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr class="hover:bg-gray-50">
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">RISK-CYBER-2025-001</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Ransomware Attack Risk</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Cybersecurity</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Avi Security</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">4/5</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">5/5</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">20</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Active</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Apr 15</td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button class="text-indigo-600 hover:text-indigo-900 mr-3">
              <i class="fas fa-eye"></i>
            </button>
            <button class="text-indigo-600 hover:text-indigo-900 mr-3">
              <i class="fas fa-edit"></i>
            </button>
            <button class="text-red-600 hover:text-red-900">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
        
        <tr class="hover:bg-gray-50">
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">DMT-RISK-2024-001</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Data Breach Risk</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Cybersecurity</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Avi Security</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">4/5</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">5/5</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">20</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Active</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Dec 15</td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button class="text-indigo-600 hover:text-indigo-900 mr-3">
              <i class="fas fa-eye"></i>
            </button>
            <button class="text-indigo-600 hover:text-indigo-900 mr-3">
              <i class="fas fa-edit"></i>
            </button>
            <button class="text-red-600 hover:text-red-900">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>

        <tr class="hover:bg-gray-50">
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">RISK-CYBER-2025-002</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Unauthorized Database Access</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Cybersecurity</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Avi Security</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3/5</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">4/5</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">12</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Active</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Apr 20</td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button class="text-indigo-600 hover:text-indigo-900 mr-3">
              <i class="fas fa-eye"></i>
            </button>
            <button class="text-indigo-600 hover:text-indigo-900 mr-3">
              <i class="fas fa-edit"></i>
            </button>
            <button class="text-red-600 hover:text-red-900">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>

        <tr class="hover:bg-gray-50">
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">DMT-RISK-2024-005</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Vendor Risk Incident</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Third-Party Risk</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mike Chen</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3/5</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">4/5</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">12</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Active</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Nov 15</td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button class="text-indigo-600 hover:text-indigo-900 mr-3">
              <i class="fas fa-eye"></i>
            </button>
            <button class="text-indigo-600 hover:text-indigo-900 mr-3">
              <i class="fas fa-edit"></i>
            </button>
            <button class="text-red-600 hover:text-red-900">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>

        <tr class="hover:bg-gray-50">
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">RISK-OPS-2025-002</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">GDPR Compliance Gap</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Data Privacy</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sarah Johnson</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3/5</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">3/5</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">9</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Active</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">May 31</td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button class="text-indigo-600 hover:text-indigo-900 mr-3">
              <i class="fas fa-eye"></i>
            </button>
            <button class="text-indigo-600 hover:text-indigo-900 mr-3">
              <i class="fas fa-edit"></i>
            </button>
            <button class="text-red-600 hover:text-red-900">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>

        <tr class="hover:bg-gray-50">
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">RISK-OPS-2025-001</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Key Personnel Departure</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Data Privacy</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Admin User</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">-</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">-</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">-</td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <button class="text-indigo-600 hover:text-indigo-900 mr-3">
              <i class="fas fa-eye"></i>
            </button>
            <button class="text-indigo-600 hover:text-indigo-900 mr-3">
              <i class="fas fa-edit"></i>
            </button>
            <button class="text-red-600 hover:text-red-900">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
`;

// Enhanced Risk Assessment Modal - Matching ARIA5 Exactly
const renderCreateRiskModal = () => html`
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" id="risk-modal">
    <div class="relative top-10 mx-auto p-0 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
      <!-- Modal Header -->
      <div class="flex justify-between items-center px-6 py-4 border-b bg-gray-50 rounded-t-md">
        <h3 class="text-lg font-semibold text-gray-900">Create Enhanced Risk Assessment</h3>
        <button onclick="document.getElementById('risk-modal').remove()" 
                class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>

      <!-- Risk Form -->
      <div class="max-h-96 overflow-y-auto">
        <form id="risk-form" 
              hx-post="/risk/create"
              hx-target="#form-result"
              hx-swap="innerHTML"
              class="p-6 space-y-6">
          
          <!-- 1. Risk Identification Section -->
          <div class="space-y-4">
            <div class="flex items-center mb-4">
              <div class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">1</div>
              <h4 class="text-md font-medium text-gray-900">Risk Identification</h4>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 ml-9">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Risk ID *</label>
                <input type="text" 
                       name="risk_id" 
                       placeholder=""
                       required
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Risk Category (Optional)</label>
                <select name="category" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Category (Optional)</option>
                  <option value="cybersecurity">Cybersecurity</option>
                  <option value="operational">Operational</option>
                  <option value="financial">Financial</option>
                  <option value="compliance">Compliance</option>
                  <option value="strategic">Strategic</option>
                  <option value="reputational">Reputational</option>
                </select>
              </div>
            </div>
            
            <div class="ml-9">
              <label class="block text-sm font-medium text-gray-700 mb-1">Risk Title *</label>
              <input type="text" 
                     name="title" 
                     placeholder="e.g., Unauthorized access to customer database"
                     required
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div class="ml-9">
              <label class="block text-sm font-medium text-gray-700 mb-1">Risk Description *</label>
              <textarea name="description" 
                        rows="3" 
                        placeholder="Describe the risk scenario, potential causes, and business impact"
                        required
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            </div>
            
            <div class="ml-9">
              <label class="block text-sm font-medium text-gray-700 mb-1">Threat Source *</label>
              <select name="threat_source" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Threat Source</option>
                <option value="external-malicious">External - Malicious</option>
                <option value="external-accidental">External - Accidental</option>
                <option value="internal-malicious">Internal - Malicious</option>
                <option value="internal-accidental">Internal - Accidental</option>
                <option value="natural-disaster">Natural Disaster</option>
                <option value="system-failure">System Failure</option>
              </select>
            </div>
          </div>

          <!-- 2. Affected Services Section -->
          <div class="space-y-4 bg-green-50 p-4 rounded-lg">
            <div class="flex items-center mb-4">
              <div class="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">2</div>
              <h4 class="text-md font-medium text-gray-900">Affected Services</h4>
            </div>
            
            <div class="ml-9">
              <label class="block text-sm font-medium text-gray-700 mb-2">Related Services</label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input type="checkbox" name="affected_services[]" value="customer_portal" class="mr-2">
                  <span class="text-sm">Customer Portal (Standard)</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" name="affected_services[]" value="api_gateway" class="mr-2">
                  <span class="text-sm">API Gateway (Standard)</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" name="affected_services[]" value="payment_system" class="mr-2">
                  <span class="text-sm">Payment Processing System</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" name="affected_services[]" value="data_warehouse" class="mr-2">
                  <span class="text-sm">Data Warehouse</span>
                </label>
              </div>
            </div>
          </div>

          <!-- 3. Risk Assessment Section -->
          <div class="space-y-4 bg-red-50 p-4 rounded-lg">
            <div class="flex items-center mb-4">
              <div class="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">3</div>
              <h4 class="text-md font-medium text-gray-900">Risk Assessment</h4>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 ml-9">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Likelihood *</label>
                <select name="likelihood" 
                        required 
                        hx-post="/risk/calculate-score"
                        hx-trigger="change"
                        hx-target="#risk-score-container"
                        hx-include="[name='impact']"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Likelihood</option>
                  <option value="1">1 - Very Low (0-5%)</option>
                  <option value="2">2 - Low (6-25%)</option>
                  <option value="3">3 - Medium (26-50%)</option>
                  <option value="4">4 - High (51-75%)</option>
                  <option value="5">5 - Very High (76-100%)</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Impact *</label>
                <select name="impact" 
                        required 
                        hx-post="/risk/calculate-score"
                        hx-trigger="change"
                        hx-target="#risk-score-container"
                        hx-include="[name='likelihood']"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Impact</option>
                  <option value="1">1 - Minimal</option>
                  <option value="2">2 - Minor</option>
                  <option value="3">3 - Moderate</option>
                  <option value="4">4 - Major</option>
                  <option value="5">5 - Severe</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Risk Score</label>
                <div id="risk-score-container">
                  <input type="text" 
                         name="risk_score" 
                         value="TBD"
                         readonly
                         class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
                </div>
              </div>
            </div>
            
            <div class="ml-9">
              <p class="text-sm text-gray-600">Select likelihood and impact to calculate risk score</p>
            </div>
          </div>

          <!-- 4. AI Risk Assessment Section -->
          <div class="space-y-4 bg-purple-50 p-4 rounded-lg">
            <div class="flex items-center mb-4">
              <div class="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">4</div>
              <h4 class="text-md font-medium text-gray-900">AI Risk Assessment</h4>
            </div>
            
            <div class="ml-9">
              <p class="text-sm text-gray-600 mb-4">Get AI-powered risk analysis based on your risk details and related services</p>
              <button type="button" 
                      class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center">
                <i class="fas fa-robot mr-2"></i>Analyze with AI
              </button>
            </div>
          </div>

          <!-- 5. Risk Treatment & Controls Section -->
          <div class="space-y-4 bg-yellow-50 p-4 rounded-lg">
            <div class="flex items-center mb-4">
              <div class="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">5</div>
              <h4 class="text-md font-medium text-gray-900">Risk Treatment & Controls</h4>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 ml-9">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Treatment Strategy *</label>
                <select name="treatment_strategy" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Strategy</option>
                  <option value="accept">Accept</option>
                  <option value="mitigate">Mitigate</option>
                  <option value="transfer">Transfer</option>
                  <option value="avoid">Avoid</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Risk Owner *</label>
                <select name="owner" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Owner</option>
                  <option value="avi_security">Avi Security</option>
                  <option value="admin_user">Admin User</option>
                  <option value="mike_chen">Mike Chen</option>
                  <option value="sarah_johnson">Sarah Johnson</option>
                  <option value="system_admin">System Admin</option>
                </select>
              </div>
            </div>
            
            <div class="ml-9">
              <label class="block text-sm font-medium text-gray-700 mb-1">Mitigation Actions</label>
              <textarea name="mitigation_actions" 
                        rows="3" 
                        placeholder="Describe planned or implemented risk mitigation actions"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            </div>
          </div>

          <!-- Form Result Area -->
          <div id="form-result"></div>

          <!-- Form Actions -->
          <div class="flex justify-end space-x-3 pt-6 border-t">
            <button type="button" 
                    onclick="document.getElementById('risk-modal').remove()"
                    class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md">
              Cancel
            </button>
            <button type="submit" 
                    class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
              Create Risk
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
`;