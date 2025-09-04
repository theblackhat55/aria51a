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

  // Risk form submission
  app.post('/create', async (c) => {
    const formData = await c.req.parseBody();
    
    // Process form data here
    console.log('Risk creation:', formData);
    
    // Return success response
    return c.html(`
      <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-center">
          <i class="fas fa-check-circle text-green-500 mr-2"></i>
          <span class="text-green-700 font-medium">Risk created successfully!</span>
        </div>
      </div>
      <script>
        setTimeout(() => {
          document.getElementById('modal-container').innerHTML = '';
          // Refresh the page or update the table
          htmx.trigger('#risk-table', 'refresh');
        }, 2000);
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

// Create Risk Modal
const renderCreateRiskModal = () => html`
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" id="risk-modal">
    <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
      <!-- Modal Header -->
      <div class="flex justify-between items-center pb-3 border-b">
        <h3 class="text-xl font-semibold text-gray-900">Add New Risk</h3>
        <button onclick="document.getElementById('risk-modal').remove()" 
                class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>

      <!-- Risk Form -->
      <div class="mt-4">
        <form id="risk-form" 
              hx-post="/risk/create"
              hx-target="#form-result"
              hx-swap="innerHTML"
              class="space-y-4">
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Risk ID</label>
              <input type="text" 
                     name="risk_id" 
                     placeholder="e.g., RISK-CYBER-2025-001"
                     required
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select name="category" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Category</option>
                <option value="cybersecurity">Cybersecurity</option>
                <option value="data-privacy">Data Privacy</option>
                <option value="operational">Operational Risk</option>
                <option value="financial">Financial Risk</option>
                <option value="third-party">Third-Party Risk</option>
              </select>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Risk Title</label>
            <input type="text" 
                   name="title" 
                   placeholder="Brief description of the risk"
                   required
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" 
                      rows="3" 
                      placeholder="Detailed description of the risk scenario"
                      required
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Probability (1-5)</label>
              <select name="probability" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select</option>
                <option value="1">1 - Very Low</option>
                <option value="2">2 - Low</option>
                <option value="3">3 - Medium</option>
                <option value="4">4 - High</option>
                <option value="5">5 - Very High</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Impact (1-5)</label>
              <select name="impact" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select</option>
                <option value="1">1 - Minimal</option>
                <option value="2">2 - Minor</option>
                <option value="3">3 - Moderate</option>
                <option value="4">4 - Major</option>
                <option value="5">5 - Severe</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Owner</label>
              <select name="owner" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Owner</option>
                <option value="avi_security">Avi Security</option>
                <option value="admin_user">Admin User</option>
                <option value="mike_chen">Mike Chen</option>
                <option value="sarah_johnson">Sarah Johnson</option>
              </select>
            </div>
          </div>

          <!-- Form Result Area -->
          <div id="form-result"></div>

          <!-- Form Actions -->
          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" 
                    onclick="document.getElementById('risk-modal').remove()"
                    class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md">
              Cancel
            </button>
            <button type="submit" 
                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
              <i class="fas fa-save mr-2"></i>Create Risk
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
`;