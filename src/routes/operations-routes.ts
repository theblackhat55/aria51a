import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import type { CloudflareBindings } from '../types';

export function createOperationsRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware to all routes
  app.use('*', requireAuth);
  
  // Main operations page - Asset Management Dashboard
  app.get('/', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Operations - Asset Management',
        user,
        content: renderAssetManagementDashboard(user)
      })
    );
  });
  
  // Asset Inventory
  app.get('/inventory', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Asset Inventory',
        user,
        content: renderAssetInventory(user)
      })
    );
  });
  
  // Asset Details
  app.get('/asset/:id', async (c) => {
    const user = c.get('user');
    const assetId = c.req.param('id');
    
    return c.html(
      cleanLayout({
        title: 'Asset Details',
        user,
        content: renderAssetDetails(user, assetId)
      })
    );
  });
  
  // Risk Assessment
  app.get('/risk-assessment', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Risk Assessment',
        user,
        content: renderRiskAssessment(user)
      })
    );
  });
  
  // Compliance Tracking
  app.get('/compliance', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Compliance Tracking',
        user,
        content: renderComplianceTracking(user)
      })
    );
  });
  
  // Vulnerability Management
  app.get('/vulnerabilities', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Vulnerability Management',
        user,
        content: renderVulnerabilityManagement(user)
      })
    );
  });
  
  // API Endpoints for dynamic data
  app.get('/api/assets/search', async (c) => {
    const query = c.req.query('q') || '';
    const type = c.req.query('type') || 'all';
    const riskLevel = c.req.query('risk') || 'all';
    
    const assets = getFilteredAssets(query, type, riskLevel);
    
    return c.json({
      success: true,
      assets,
      count: assets.length
    });
  });
  
  app.get('/api/assets/metrics', async (c) => {
    const metrics = getAssetMetrics();
    return c.json(metrics);
  });
  
  app.post('/api/assets/:id/update-risk', async (c) => {
    const assetId = c.req.param('id');
    const { confidentiality, integrity, availability, riskScore } = await c.req.json();
    
    // In a real implementation, update database
    return c.json({
      success: true,
      message: 'Asset risk assessment updated successfully',
      assetId,
      newRisk: { confidentiality, integrity, availability, riskScore }
    });
  });
  
  app.get('/api/vulnerabilities/scan', async (c) => {
    const assetId = c.req.query('asset');
    const vulnerabilities = getAssetVulnerabilities(assetId);
    
    return c.json({
      success: true,
      vulnerabilities,
      scanTime: new Date().toISOString()
    });
  });
  
  return app;
}

const renderOperationsPage = (user: any) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Operations Center</h1>
        <p class="mt-2 text-lg text-gray-600">Monitor and manage operational security activities</p>
      </div>
      
      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-shield-check text-2xl text-green-500"></i>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">System Status</p>
              <p class="text-2xl font-semibold text-gray-900">Operational</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-exclamation-triangle text-2xl text-yellow-500"></i>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Active Alerts</p>
              <p class="text-2xl font-semibold text-gray-900">3</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-users text-2xl text-blue-500"></i>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Active Users</p>
              <p class="text-2xl font-semibold text-gray-900">127</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-clock text-2xl text-purple-500"></i>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Uptime</p>
              <p class="text-2xl font-semibold text-gray-900">99.8%</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Operations Sections -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- System Monitoring -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">System Monitoring</h2>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div class="flex items-center">
                  <i class="fas fa-server text-green-600 mr-3"></i>
                  <div>
                    <p class="font-medium text-gray-900">Web Services</p>
                    <p class="text-sm text-gray-500">All systems operational</p>
                  </div>
                </div>
                <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Healthy</span>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div class="flex items-center">
                  <i class="fas fa-database text-green-600 mr-3"></i>
                  <div>
                    <p class="font-medium text-gray-900">Database</p>
                    <p class="text-sm text-gray-500">Connection stable</p>
                  </div>
                </div>
                <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Healthy</span>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div class="flex items-center">
                  <i class="fas fa-network-wired text-yellow-600 mr-3"></i>
                  <div>
                    <p class="font-medium text-gray-900">Network</p>
                    <p class="text-sm text-gray-500">Minor latency detected</p>
                  </div>
                </div>
                <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Warning</span>
              </div>
            </div>
            
            <div class="mt-6">
              <a href="/operations/monitoring" class="text-blue-600 hover:text-blue-500 font-medium">
                View Detailed Monitoring →
              </a>
            </div>
          </div>
        </div>
        
        <!-- Recent Activities -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">Recent Activities</h2>
          </div>
          <div class="p-6">
            <div class="flow-root">
              <ul class="-mb-8">
                <li class="relative pb-8">
                  <div class="flex space-x-3">
                    <div class="flex-shrink-0">
                      <span class="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                        <i class="fas fa-check text-white text-xs"></i>
                      </span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div>
                        <p class="text-sm text-gray-500">
                          <span class="font-medium text-gray-900">Security scan completed</span>
                        </p>
                        <p class="mt-1 text-sm text-gray-500">2 minutes ago</p>
                      </div>
                    </div>
                  </div>
                </li>
                
                <li class="relative pb-8">
                  <div class="flex space-x-3">
                    <div class="flex-shrink-0">
                      <span class="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                        <i class="fas fa-user text-white text-xs"></i>
                      </span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div>
                        <p class="text-sm text-gray-500">
                          <span class="font-medium text-gray-900">New user logged in</span>
                        </p>
                        <p class="mt-1 text-sm text-gray-500">15 minutes ago</p>
                      </div>
                    </div>
                  </div>
                </li>
                
                <li class="relative">
                  <div class="flex space-x-3">
                    <div class="flex-shrink-0">
                      <span class="h-8 w-8 rounded-full bg-yellow-500 flex items-center justify-center">
                        <i class="fas fa-exclamation text-white text-xs"></i>
                      </span>
                    </div>
                    <div class="min-w-0 flex-1">
                      <div>
                        <p class="text-sm text-gray-500">
                          <span class="font-medium text-gray-900">High CPU usage detected</span>
                        </p>
                        <p class="mt-1 text-sm text-gray-500">1 hour ago</p>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

const renderMonitoringPage = (user: any) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Operations Monitoring</h1>
      
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600">Detailed monitoring dashboard coming soon...</p>
        
        <div class="mt-4">
          <a href="/operations" class="text-blue-600 hover:text-blue-500">← Back to Operations</a>
        </div>
      </div>
    </div>
  </div>
`;

// Risk Assessment Page
const renderRiskAssessment = (user: any) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 flex items-center">
          <i class="fas fa-chart-line mr-3 text-orange-600"></i>
          Risk Assessment
        </h1>
        <p class="mt-2 text-lg text-gray-600">Comprehensive risk analysis with CIA ratings and risk scoring</p>
      </div>
      
      <!-- Risk Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Critical Risk</p>
              <p class="text-3xl font-bold text-red-600">18</p>
            </div>
            <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">High Risk</p>
              <p class="text-3xl font-bold text-orange-600">31</p>
            </div>
            <i class="fas fa-exclamation-circle text-2xl text-orange-500"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Medium Risk</p>
              <p class="text-3xl font-bold text-yellow-600">64</p>
            </div>
            <i class="fas fa-exclamation text-2xl text-yellow-500"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Low Risk</p>
              <p class="text-3xl font-bold text-green-600">134</p>
            </div>
            <i class="fas fa-check-circle text-2xl text-green-500"></i>
          </div>
        </div>
      </div>
      
      <!-- Risk Assessment Tools -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- CIA Rating Calculator -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i class="fas fa-calculator text-blue-500 mr-2"></i>
            CIA Rating Calculator
          </h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Confidentiality Impact</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option>Low (1-3)</option>
                <option>Medium (4-6)</option>
                <option>High (7-8)</option>
                <option>Critical (9-10)</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Integrity Impact</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option>Low (1-3)</option>
                <option>Medium (4-6)</option>
                <option>High (7-8)</option>
                <option>Critical (9-10)</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Availability Impact</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option>Low (1-3)</option>
                <option>Medium (4-6)</option>
                <option>High (7-8)</option>
                <option>Critical (9-10)</option>
              </select>
            </div>
            <button class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Calculate Risk Score
            </button>
          </div>
        </div>
        
        <!-- Risk Matrix -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i class="fas fa-th text-purple-500 mr-2"></i>
            Risk Matrix
          </h2>
          <div class="grid grid-cols-5 gap-1 text-xs">
            <!-- Risk matrix cells -->
            <div class="p-2 text-center font-medium">Impact \\ Probability</div>
            <div class="p-2 text-center bg-gray-100 font-medium">Very Low</div>
            <div class="p-2 text-center bg-gray-100 font-medium">Low</div>
            <div class="p-2 text-center bg-gray-100 font-medium">Medium</div>
            <div class="p-2 text-center bg-gray-100 font-medium">High</div>
            
            <div class="p-2 text-center bg-gray-100 font-medium">Critical</div>
            <div class="p-2 text-center bg-yellow-300">Medium</div>
            <div class="p-2 text-center bg-orange-300">High</div>
            <div class="p-2 text-center bg-red-400">Critical</div>
            <div class="p-2 text-center bg-red-600 text-white">Critical</div>
            
            <div class="p-2 text-center bg-gray-100 font-medium">High</div>
            <div class="p-2 text-center bg-green-300">Low</div>
            <div class="p-2 text-center bg-yellow-300">Medium</div>
            <div class="p-2 text-center bg-orange-300">High</div>
            <div class="p-2 text-center bg-red-400">Critical</div>
            
            <div class="p-2 text-center bg-gray-100 font-medium">Medium</div>
            <div class="p-2 text-center bg-green-200">Low</div>
            <div class="p-2 text-center bg-green-300">Low</div>
            <div class="p-2 text-center bg-yellow-300">Medium</div>
            <div class="p-2 text-center bg-orange-300">High</div>
            
            <div class="p-2 text-center bg-gray-100 font-medium">Low</div>
            <div class="p-2 text-center bg-green-100">Very Low</div>
            <div class="p-2 text-center bg-green-200">Low</div>
            <div class="p-2 text-center bg-green-300">Low</div>
            <div class="p-2 text-center bg-yellow-300">Medium</div>
          </div>
        </div>
      </div>
      
      <!-- High Risk Assets Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">High Risk Assets Requiring Attention</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Score</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CIA Rating</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key Risks</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${getHighRiskAssetRows()}
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="mt-6">
        <a href="/operations" class="text-blue-600 hover:text-blue-500 flex items-center">
          <i class="fas fa-arrow-left mr-2"></i>
          Back to Operations Dashboard
        </a>
      </div>
    </div>
  </div>
`;

// Compliance Tracking Page
const renderComplianceTracking = (user: any) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 flex items-center">
          <i class="fas fa-clipboard-check mr-3 text-green-600"></i>
          Compliance Tracking
        </h1>
        <p class="mt-2 text-lg text-gray-600">Monitor regulatory compliance across all assets</p>
      </div>
      
      <!-- Compliance Overview -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Overall Compliance</p>
              <p class="text-3xl font-bold text-green-600">87%</p>
            </div>
            <i class="fas fa-shield-check text-2xl text-green-500"></i>
          </div>
          <div class="mt-2">
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-green-500 h-2 rounded-full" style="width: 87%"></div>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">SOC 2 Compliance</p>
              <p class="text-3xl font-bold text-green-600">94%</p>
            </div>
            <i class="fas fa-certificate text-2xl text-green-500"></i>
          </div>
          <div class="mt-2">
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-green-500 h-2 rounded-full" style="width: 94%"></div>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">ISO 27001</p>
              <p class="text-3xl font-bold text-yellow-600">78%</p>
            </div>
            <i class="fas fa-award text-2xl text-yellow-500"></i>
          </div>
          <div class="mt-2">
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-yellow-500 h-2 rounded-full" style="width: 78%"></div>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">PCI DSS</p>
              <p class="text-3xl font-bold text-red-600">65%</p>
            </div>
            <i class="fas fa-credit-card text-2xl text-red-500"></i>
          </div>
          <div class="mt-2">
            <div class="w-full bg-gray-200 rounded-full h-2">
              <div class="bg-red-500 h-2 rounded-full" style="width: 65%"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Compliance Framework Details -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">SOC 2 Type II Status</h2>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-2 border rounded">
              <span class="text-sm">Security Controls</span>
              <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Compliant</span>
            </div>
            <div class="flex items-center justify-between p-2 border rounded">
              <span class="text-sm">Availability Controls</span>
              <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Compliant</span>
            </div>
            <div class="flex items-center justify-between p-2 border rounded">
              <span class="text-sm">Processing Integrity</span>
              <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">In Progress</span>
            </div>
            <div class="flex items-center justify-between p-2 border rounded">
              <span class="text-sm">Confidentiality</span>
              <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Compliant</span>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Compliance Violations</h2>
          <div class="space-y-3">
            <div class="flex items-center p-3 bg-red-50 rounded-lg">
              <i class="fas fa-exclamation-triangle text-red-500 mr-3"></i>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">Encryption Policy Violation</p>
                <p class="text-xs text-gray-600">3 assets missing encryption</p>
              </div>
              <span class="text-xs text-red-600">Critical</span>
            </div>
            <div class="flex items-center p-3 bg-yellow-50 rounded-lg">
              <i class="fas fa-exclamation text-yellow-500 mr-3"></i>
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-900">Patch Management Gap</p>
                <p class="text-xs text-gray-600">12 assets pending updates</p>
              </div>
              <span class="text-xs text-yellow-600">Medium</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Non-Compliant Assets -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Non-Compliant Assets</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Framework</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Violation</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${getNonCompliantAssetRows()}
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="mt-6">
        <a href="/operations" class="text-blue-600 hover:text-blue-500 flex items-center">
          <i class="fas fa-arrow-left mr-2"></i>
          Back to Operations Dashboard
        </a>
      </div>
    </div>
  </div>
`;

// Vulnerability Management Page  
const renderVulnerabilityManagement = (user: any) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 flex items-center">
          <i class="fas fa-bug mr-3 text-red-600"></i>
          Vulnerability Management
        </h1>
        <p class="mt-2 text-lg text-gray-600">Track and remediate security vulnerabilities across your infrastructure</p>
      </div>
      
      <!-- Vulnerability Summary -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Critical</p>
              <p class="text-3xl font-bold text-red-600">24</p>
            </div>
            <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
          </div>
          <p class="text-xs text-gray-600 mt-1">CVSS 9.0-10.0</p>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">High</p>
              <p class="text-3xl font-bold text-orange-600">67</p>
            </div>
            <i class="fas fa-exclamation-circle text-2xl text-orange-500"></i>
          </div>
          <p class="text-xs text-gray-600 mt-1">CVSS 7.0-8.9</p>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Medium</p>
              <p class="text-3xl font-bold text-yellow-600">143</p>
            </div>
            <i class="fas fa-exclamation text-2xl text-yellow-500"></i>
          </div>
          <p class="text-xs text-gray-600 mt-1">CVSS 4.0-6.9</p>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Low</p>
              <p class="text-3xl font-bold text-blue-600">89</p>
            </div>
            <i class="fas fa-info-circle text-2xl text-blue-500"></i>
          </div>
          <p class="text-xs text-gray-600 mt-1">CVSS 0.1-3.9</p>
        </div>
      </div>
      
      <!-- Scan Controls -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900">Vulnerability Scanning</h2>
          <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
            <i class="fas fa-play mr-2"></i>
            Start Full Scan
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 border rounded-lg">
            <h3 class="font-medium text-gray-900 mb-2">Last Full Scan</h3>
            <p class="text-sm text-gray-600">September 3, 2025 - 14:30</p>
            <p class="text-xs text-green-600">323 vulnerabilities detected</p>
          </div>
          
          <div class="p-4 border rounded-lg">
            <h3 class="font-medium text-gray-900 mb-2">Next Scheduled Scan</h3>
            <p class="text-sm text-gray-600">September 10, 2025 - 02:00</p>
            <p class="text-xs text-blue-600">Weekly automated scan</p>
          </div>
          
          <div class="p-4 border rounded-lg">
            <h3 class="font-medium text-gray-900 mb-2">Assets Scanned</h3>
            <p class="text-sm text-gray-600">247 of 247 assets</p>
            <p class="text-xs text-green-600">100% coverage</p>
          </div>
        </div>
      </div>
      
      <!-- Critical Vulnerabilities Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">Critical Vulnerabilities (24)</h2>
          <div class="flex space-x-2">
            <button class="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
              Bulk Remediate
            </button>
            <button class="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
              Export Report
            </button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CVE ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asset</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CVSS Score</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">First Detected</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${getCriticalVulnerabilityRows()}
            </tbody>
          </table>
        </div>
      </div>
      
      <div class="mt-6">
        <a href="/operations" class="text-blue-600 hover:text-blue-500 flex items-center">
          <i class="fas fa-arrow-left mr-2"></i>
          Back to Operations Dashboard
        </a>
      </div>
    </div>
  </div>
`;

// Data Helper Functions

// Sample asset data
const sampleAssets = [
  {
    id: 'SRV-WEB-01',
    name: 'Production Web Server',
    type: 'Server',
    ip: '192.168.1.100',
    owner: 'IT Operations',
    location: 'Data Center A',
    confidentiality: 'High',
    integrity: 'High', 
    availability: 'Medium',
    riskScore: 8.5,
    riskLevel: 'High',
    compliance: 'Non-Compliant',
    lastUpdated: '2025-09-03',
    vulnerabilities: ['CVE-2024-0132', 'CVE-2024-0089']
  },
  {
    id: 'SRV-DB-01',
    name: 'Customer Database',
    type: 'Server', 
    ip: '192.168.1.110',
    owner: 'Database Team',
    location: 'Data Center A',
    confidentiality: 'Critical',
    integrity: 'Critical',
    availability: 'High',
    riskScore: 9.2,
    riskLevel: 'Critical',
    compliance: 'Compliant',
    lastUpdated: '2025-09-02',
    vulnerabilities: ['CVE-2024-0156']
  },
  {
    id: 'WS-FINANCE-12',
    name: 'Finance Workstation',
    type: 'Workstation',
    ip: '192.168.2.45',
    owner: 'Finance Dept',
    location: 'Floor 3',
    confidentiality: 'High',
    integrity: 'Medium',
    availability: 'Low',
    riskScore: 6.8,
    riskLevel: 'Medium',
    compliance: 'Compliant',
    lastUpdated: '2025-09-01',
    vulnerabilities: []
  },
  {
    id: 'NET-RTR-03',
    name: 'Core Network Router',
    type: 'Network Equipment',
    ip: '192.168.0.1',
    owner: 'Network Team', 
    location: 'Network Room',
    confidentiality: 'Medium',
    integrity: 'High',
    availability: 'Critical',
    riskScore: 7.9,
    riskLevel: 'High',
    compliance: 'Non-Compliant',
    lastUpdated: '2025-08-28',
    vulnerabilities: ['CVE-2024-0132', 'CVE-2024-0201']
  }
];

// Get asset table rows
function getAssetTableRows() {
  return sampleAssets.map(asset => html`
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <div>
            <div class="text-sm font-medium text-gray-900">
              <a href="/operations/asset/${asset.id}" class="text-blue-600 hover:text-blue-500">
                ${asset.id}
              </a>
            </div>
            <div class="text-sm text-gray-500">${asset.name}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <i class="fas fa-${getTypeIcon(asset.type)} text-gray-400 mr-2"></i>
          <span class="text-sm text-gray-900">${asset.type}</span>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-xs space-y-1">
          <div class="flex justify-between">
            <span class="text-gray-500">C:</span>
            <span class="font-medium ${getCIAColor(asset.confidentiality)}">${asset.confidentiality}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">I:</span>
            <span class="font-medium ${getCIAColor(asset.integrity)}">${asset.integrity}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">A:</span>
            <span class="font-medium ${getCIAColor(asset.availability)}">${asset.availability}</span>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-center">
          <span class="text-lg font-bold ${getRiskScoreColor(asset.riskScore)}">${asset.riskScore}</span>
          <div class="text-xs text-gray-500">/10.0</div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getComplianceColor(asset.compliance)}">
          ${asset.compliance}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${asset.lastUpdated}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div class="flex space-x-2">
          <button class="text-blue-600 hover:text-blue-500 text-xs">
            <i class="fas fa-eye"></i>
          </button>
          <button class="text-green-600 hover:text-green-500 text-xs">
            <i class="fas fa-edit"></i>
          </button>
          <button class="text-orange-600 hover:text-orange-500 text-xs">
            <i class="fas fa-shield-alt"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Get high risk asset rows
function getHighRiskAssetRows() {
  const highRiskAssets = sampleAssets.filter(asset => 
    asset.riskLevel === 'Critical' || asset.riskLevel === 'High'
  );
  
  return highRiskAssets.map(asset => html`
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">${asset.id}</div>
        <div class="text-sm text-gray-500">${asset.name}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-center">
          <span class="text-lg font-bold ${getRiskScoreColor(asset.riskScore)}">${asset.riskScore}</span>
          <div class="text-xs text-gray-500">/10.0</div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-xs">
          <div class="mb-1">C: <span class="${getCIAColor(asset.confidentiality)}">${asset.confidentiality}</span></div>
          <div class="mb-1">I: <span class="${getCIAColor(asset.integrity)}">${asset.integrity}</span></div>
          <div>A: <span class="${getCIAColor(asset.availability)}">${asset.availability}</span></div>
        </div>
      </td>
      <td class="px-6 py-4">
        <div class="text-sm text-gray-900">
          ${asset.vulnerabilities.length > 0 ? 
            asset.vulnerabilities.map(vuln => `<div class="text-xs text-red-600">${vuln}</div>`).join('') :
            '<div class="text-xs text-green-600">Configuration risks</div>'
          }
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div class="flex space-x-1">
          <button class="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
            Assess
          </button>
          <button class="px-2 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700">
            Mitigate
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Get non-compliant asset rows
function getNonCompliantAssetRows() {
  const nonCompliantAssets = sampleAssets.filter(asset => 
    asset.compliance === 'Non-Compliant'
  );
  
  return nonCompliantAssets.map(asset => html`
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">${asset.id}</div>
        <div class="text-sm text-gray-500">${asset.name}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="text-sm text-gray-900">SOC 2</span>
      </td>
      <td class="px-6 py-4">
        <div class="text-sm text-gray-900">Missing encryption controls</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
          Critical
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        2025-09-15
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button class="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">
          Remediate
        </button>
      </td>
    </tr>
  `).join('');
}

// Get critical vulnerability rows
function getCriticalVulnerabilityRows() {
  const criticalVulns = [
    {
      cve: 'CVE-2024-0132',
      asset: 'SRV-WEB-01',
      cvss: '9.8',
      description: 'Remote Code Execution in Apache',
      detected: '2025-09-01'
    },
    {
      cve: 'CVE-2024-0156', 
      asset: 'SRV-DB-01',
      cvss: '9.1',
      description: 'SQL Injection in MySQL',
      detected: '2025-08-28'
    },
    {
      cve: 'CVE-2024-0201',
      asset: 'NET-RTR-03', 
      cvss: '9.0',
      description: 'Authentication Bypass',
      detected: '2025-08-25'
    }
  ];
  
  return criticalVulns.map(vuln => html`
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-blue-600">${vuln.cve}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-900">${vuln.asset}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-center">
        <span class="text-lg font-bold text-red-600">${vuln.cvss}</span>
        <div class="text-xs text-gray-500">Critical</div>
      </td>
      <td class="px-6 py-4">
        <div class="text-sm text-gray-900">${vuln.description}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${vuln.detected}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div class="flex space-x-1">
          <button class="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">
            Patch
          </button>
          <button class="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700">
            Details
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Helper functions for styling
function getTypeIcon(type: string): string {
  const icons: { [key: string]: string } = {
    'Server': 'server',
    'Workstation': 'desktop',
    'Network Equipment': 'network-wired',
    'Mobile Device': 'mobile-alt'
  };
  return icons[type] || 'question-circle';
}

function getCIAColor(level: string): string {
  const colors: { [key: string]: string } = {
    'Critical': 'text-red-600',
    'High': 'text-orange-600', 
    'Medium': 'text-yellow-600',
    'Low': 'text-green-600'
  };
  return colors[level] || 'text-gray-600';
}

function getRiskScoreColor(score: number): string {
  if (score >= 9) return 'text-red-600';
  if (score >= 7) return 'text-orange-600';
  if (score >= 5) return 'text-yellow-600';
  return 'text-green-600';
}

function getComplianceColor(status: string): string {
  const colors: { [key: string]: string } = {
    'Compliant': 'bg-green-100 text-green-800',
    'Non-Compliant': 'bg-red-100 text-red-800',
    'Pending Review': 'bg-yellow-100 text-yellow-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

// Data filtering functions
function getFilteredAssets(query: string, type: string, riskLevel: string) {
  return sampleAssets.filter(asset => {
    const matchesQuery = !query || 
      asset.id.toLowerCase().includes(query.toLowerCase()) ||
      asset.name.toLowerCase().includes(query.toLowerCase()) ||
      asset.ip.includes(query);
    
    const matchesType = type === 'all' || asset.type === type;
    const matchesRisk = riskLevel === 'all' || asset.riskLevel.toLowerCase() === riskLevel.toLowerCase();
    
    return matchesQuery && matchesType && matchesRisk;
  });
}

function getAssetMetrics() {
  return {
    totalAssets: sampleAssets.length,
    criticalRisk: sampleAssets.filter(a => a.riskLevel === 'Critical').length,
    highRisk: sampleAssets.filter(a => a.riskLevel === 'High').length,
    mediumRisk: sampleAssets.filter(a => a.riskLevel === 'Medium').length,
    lowRisk: sampleAssets.filter(a => a.riskLevel === 'Low').length,
    compliant: sampleAssets.filter(a => a.compliance === 'Compliant').length,
    nonCompliant: sampleAssets.filter(a => a.compliance === 'Non-Compliant').length,
    complianceRate: Math.round((sampleAssets.filter(a => a.compliance === 'Compliant').length / sampleAssets.length) * 100)
  };
}

function getAssetVulnerabilities(assetId?: string) {
  const vulns = [
    {
      cve: 'CVE-2024-0132',
      severity: 'Critical',
      cvss: 9.8,
      description: 'Remote Code Execution vulnerability',
      status: 'Open'
    },
    {
      cve: 'CVE-2024-0089', 
      severity: 'Medium',
      cvss: 6.5,
      description: 'Privilege escalation vulnerability', 
      status: 'Open'
    }
  ];
  
  return assetId ? vulns : vulns;
}