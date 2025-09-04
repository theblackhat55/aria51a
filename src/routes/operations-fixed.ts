import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { baseLayout } from '../templates/layout';
import type { CloudflareBindings } from '../types';
import { getCookie } from 'hono/cookie';

export function createOperationsRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware to all routes
  app.use('*', requireAuth);
  
  // Main operations dashboard
  app.get('/', async (c) => {
    const userEmail = getCookie(c, 'user_email');
    const userRole = getCookie(c, 'user_role');
    const user = { username: userEmail?.split('@')[0] || 'User', role: userRole, email: userEmail };
    
    return c.html(
      baseLayout({
        title: 'Operations Center',
        user,
        content: renderOperationsDashboard()
      })
    );
  });
  
  // Asset Management
  app.get('/assets', async (c) => {
    const userEmail = getCookie(c, 'user_email');
    const userRole = getCookie(c, 'user_role');
    const user = { username: userEmail?.split('@')[0] || 'User', role: userRole, email: userEmail };
    
    return c.html(
      baseLayout({
        title: 'Asset Management',
        user,
        content: renderAssetManagement()
      })
    );
  });
  
  // Service Management
  app.get('/services', async (c) => {
    const userEmail = getCookie(c, 'user_email');
    const userRole = getCookie(c, 'user_role');
    const user = { username: userEmail?.split('@')[0] || 'User', role: userRole, email: userEmail };
    
    return c.html(
      baseLayout({
        title: 'Service Management',
        user,
        content: renderServiceManagement()
      })
    );
  });
  
  // Document Management
  app.get('/documents', async (c) => {
    const userEmail = getCookie(c, 'user_email');
    const userRole = getCookie(c, 'user_role');
    const user = { username: userEmail?.split('@')[0] || 'User', role: userRole, email: userEmail };
    
    return c.html(
      baseLayout({
        title: 'Document Management',
        user,
        content: renderDocumentManagement()
      })
    );
  });

  // Microsoft Defender Integration
  app.get('/defender', async (c) => {
    const userEmail = getCookie(c, 'user_email');
    const userRole = getCookie(c, 'user_role');
    const user = { username: userEmail?.split('@')[0] || 'User', role: userRole, email: userEmail };
    
    return c.html(
      baseLayout({
        title: 'Microsoft Defender Integration',
        user,
        content: renderDefenderIntegration()
      })
    );
  });

  // API endpoints
  app.get('/api/assets', async (c) => {
    const assets = await getAssets();
    return c.json({ success: true, assets });
  });

  app.get('/api/services', async (c) => {
    const services = await getServices();
    return c.json({ success: true, services });
  });

  app.post('/api/assets', async (c) => {
    const assetData = await c.req.json();
    const asset = await createAsset(assetData);
    return c.json({ success: true, asset });
  });

  app.post('/api/services', async (c) => {
    const serviceData = await c.req.json();
    const service = await createService(serviceData);
    return c.json({ success: true, service });
  });

  return app;
}

// Main Operations Dashboard
const renderOperationsDashboard = () => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 flex items-center">
          <i class="fas fa-shield-alt text-blue-600 mr-3"></i>
          Operations Center
        </h1>
        <p class="mt-2 text-lg text-gray-600">Microsoft Defender & security operations management</p>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-server text-2xl text-blue-500"></i>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Total Assets</dt>
                  <dd class="text-lg font-medium text-gray-900">1,247</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-sitemap text-2xl text-green-500"></i>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Active Services</dt>
                  <dd class="text-lg font-medium text-gray-900">85</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-file-alt text-2xl text-purple-500"></i>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Documents</dt>
                  <dd class="text-lg font-medium text-gray-900">2,156</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Security Alerts</dt>
                  <dd class="text-lg font-medium text-gray-900">12</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Operations Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Asset Management -->
        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center mb-4">
            <i class="fas fa-server text-blue-500 mr-3"></i>
            <h2 class="text-lg font-semibold text-gray-900">Asset Management</h2>
          </div>
          <p class="text-gray-600 mb-4">Manage IT assets and infrastructure</p>
          <a href="/operations/assets" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
            <i class="fas fa-arrow-right mr-2"></i>
            Manage Assets
          </a>
        </div>

        <!-- Service Management -->
        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center mb-4">
            <i class="fas fa-sitemap text-green-500 mr-3"></i>
            <h2 class="text-lg font-semibold text-gray-900">Service Management</h2>
          </div>
          <p class="text-gray-600 mb-4">Organize services and calculate CIA ratings</p>
          <a href="/operations/services" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
            <i class="fas fa-arrow-right mr-2"></i>
            Manage Services
          </a>
        </div>

        <!-- Document Management -->
        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center mb-4">
            <i class="fas fa-file-alt text-purple-500 mr-3"></i>
            <h2 class="text-lg font-semibold text-gray-900">Document Management</h2>
          </div>
          <p class="text-gray-600 mb-4">Policies, procedures & documents</p>
          <a href="/operations/documents" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
            <i class="fas fa-arrow-right mr-2"></i>
            Manage Documents
          </a>
        </div>
      </div>

      <!-- Microsoft Defender Integration -->
      <div class="mt-8">
        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center">
              <i class="fas fa-shield-alt text-blue-500 mr-3"></i>
              <h2 class="text-lg font-semibold text-gray-900">Microsoft Defender Integration</h2>
            </div>
            <a href="/operations/defender" class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              View Integration
            </a>
          </div>
          <p class="text-gray-600 mb-4">Real-time security data and threat intelligence</p>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-green-50 p-4 rounded-lg">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <i class="fas fa-check-circle text-green-400"></i>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-green-800">Machines Online</p>
                  <p class="text-sm text-green-600">847 devices</p>
                </div>
              </div>
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-yellow-800">Active Alerts</p>
                  <p class="text-sm text-yellow-600">12 alerts</p>
                </div>
              </div>
            </div>
            
            <div class="bg-red-50 p-4 rounded-lg">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <i class="fas fa-bug text-red-400"></i>
                </div>
                <div class="ml-3">
                  <p class="text-sm font-medium text-red-800">Vulnerabilities</p>
                  <p class="text-sm text-red-600">34 found</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

// Asset Management Page
const renderAssetManagement = () => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-server text-blue-600 mr-3"></i>
            Asset Management
          </h1>
          <p class="mt-2 text-lg text-gray-600">IT assets & infrastructure management</p>
        </div>
        <button hx-get="/operations/api/assets/new" hx-target="#asset-modal" hx-swap="innerHTML" 
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
          <i class="fas fa-plus mr-2"></i>
          Add Asset
        </button>
      </div>

      <!-- Asset Filters -->
      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Asset Type</label>
            <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option>All Types</option>
              <option>Server</option>
              <option>Workstation</option>
              <option>Network Device</option>
              <option>Mobile Device</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>Maintenance</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option>All Locations</option>
              <option>Data Center</option>
              <option>Office</option>
              <option>Remote</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input type="text" placeholder="Search assets..." 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md">
          </div>
        </div>
      </div>

      <!-- Assets Table -->
      <div class="bg-white shadow overflow-hidden rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Assets</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200" hx-get="/operations/api/assets" hx-trigger="load">
              ${renderAssetRows()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Asset Modal Container -->
  <div id="asset-modal"></div>
`;

// Service Management Page  
const renderServiceManagement = () => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-sitemap text-green-600 mr-3"></i>
            Service Management
          </h1>
          <p class="mt-2 text-lg text-gray-600">Manage organizational services and calculate CIA ratings based on linked assets</p>
        </div>
        <button hx-get="/operations/api/services/new" hx-target="#service-modal" hx-swap="innerHTML"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
          <i class="fas fa-plus mr-2"></i>
          Add Service
        </button>
      </div>

      <!-- Services Overview -->
      <div class="bg-white shadow overflow-hidden rounded-lg mb-8">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Services Overview</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assets</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CIA Rating</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${renderServiceRows()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Service Modal Container -->
  <div id="service-modal"></div>
`;

// Document Management Page
const renderDocumentManagement = () => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-file-alt text-purple-600 mr-3"></i>
            Document Management
          </h1>
          <p class="mt-2 text-lg text-gray-600">Policies, procedures & documents</p>
        </div>
        <button class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
          <i class="fas fa-upload mr-2"></i>
          Upload Document
        </button>
      </div>

      <!-- Document Categories -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center mb-4">
            <i class="fas fa-shield-alt text-blue-500 mr-3"></i>
            <h3 class="text-lg font-semibold text-gray-900">Security Policies</h3>
          </div>
          <p class="text-gray-600 mb-4">Information security and data protection policies</p>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            45 documents
          </span>
        </div>

        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center mb-4">
            <i class="fas fa-cog text-gray-500 mr-3"></i>
            <h3 class="text-lg font-semibold text-gray-900">Procedures</h3>
          </div>
          <p class="text-gray-600 mb-4">Operational procedures and work instructions</p>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            78 documents
          </span>
        </div>

        <div class="bg-white shadow rounded-lg p-6">
          <div class="flex items-center mb-4">
            <i class="fas fa-clipboard-check text-green-500 mr-3"></i>
            <h3 class="text-lg font-semibold text-gray-900">Compliance</h3>
          </div>
          <p class="text-gray-600 mb-4">Regulatory and compliance documentation</p>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            32 documents
          </span>
        </div>
      </div>

      <!-- Recent Documents -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Recent Documents</h2>
        </div>
        <div class="divide-y divide-gray-200">
          ${renderDocumentRows()}
        </div>
      </div>
    </div>
  </div>
`;

// Microsoft Defender Integration Page
const renderDefenderIntegration = () => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 flex items-center">
          <i class="fas fa-shield-alt text-blue-600 mr-3"></i>
          Microsoft Defender Integration
        </h1>
        <p class="mt-2 text-lg text-gray-600">Real-time security data and threat intelligence from Microsoft Defender for Endpoint</p>
      </div>

      <!-- Integration Status -->
      <div class="bg-white shadow rounded-lg p-6 mb-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-plug text-green-500 text-2xl"></i>
            </div>
            <div class="ml-4">
              <h2 class="text-lg font-semibold text-gray-900">Integration Status</h2>
              <p class="text-sm text-gray-600">Connected to Microsoft Graph API</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Connected
            </span>
            <button class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
              Sync Now
            </button>
          </div>
        </div>
      </div>

      <!-- Defender Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-desktop text-2xl text-blue-500"></i>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Managed Machines</dt>
                  <dd class="text-lg font-medium text-gray-900">847</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-exclamation-triangle text-2xl text-yellow-500"></i>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Active Alerts</dt>
                  <dd class="text-lg font-medium text-gray-900">12</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-bug text-2xl text-red-500"></i>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Vulnerabilities</dt>
                  <dd class="text-lg font-medium text-gray-900">34</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-clock text-2xl text-green-500"></i>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Last Sync</dt>
                  <dd class="text-lg font-medium text-gray-900">2 min ago</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Alerts -->
      <div class="bg-white shadow rounded-lg">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Recent Security Alerts</h2>
        </div>
        <div class="divide-y divide-gray-200">
          ${renderDefenderAlerts()}
        </div>
      </div>
    </div>
  </div>
`;

// Helper functions
function renderAssetRows() {
  const assets = [
    { name: 'WEB-SRV-01', type: 'Server', status: 'Active', location: 'Data Center', risk: 'Medium' },
    { name: 'DB-SRV-02', type: 'Server', status: 'Active', location: 'Data Center', risk: 'High' },
    { name: 'WS-ADMIN-03', type: 'Workstation', status: 'Active', location: 'Office', risk: 'Low' },
    { name: 'FW-MAIN-01', type: 'Network Device', status: 'Active', location: 'Data Center', risk: 'Critical' }
  ];
  
  return assets.map(asset => html`
    <tr>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">${asset.name}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${asset.type}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ${asset.status}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${asset.location}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(asset.risk)}">
          ${asset.risk}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button class="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
        <button class="text-red-600 hover:text-red-900">Delete</button>
      </td>
    </tr>
  `).join('');
}

function renderServiceRows() {
  const services = [
    { name: 'Customer Portal', assets: 23, c: 'High', i: 'High', a: 'Medium', risk: 'High' },
    { name: 'Payment Gateway', assets: 12, c: 'Critical', i: 'Critical', a: 'High', risk: 'Critical' },
    { name: 'API Services', assets: 45, c: 'High', i: 'High', a: 'High', risk: 'High' },
    { name: 'Data Warehouse', assets: 18, c: 'Critical', i: 'High', a: 'Medium', risk: 'High' }
  ];
  
  return services.map(service => html`
    <tr>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">${service.name}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="text-sm text-gray-900">${service.assets}</span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-xs space-y-1">
          <div>C: <span class="font-medium text-red-600">${service.c}</span></div>
          <div>I: <span class="font-medium text-orange-600">${service.i}</span></div>
          <div>A: <span class="font-medium text-yellow-600">${service.a}</span></div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(service.risk)}">
          ${service.risk}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button class="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
        <button class="text-green-600 hover:text-green-900">Link Assets</button>
      </td>
    </tr>
  `).join('');
}

function renderDocumentRows() {
  const documents = [
    { name: 'Information Security Policy', type: 'Policy', updated: '2 days ago', size: '2.1 MB' },
    { name: 'Incident Response Procedure', type: 'Procedure', updated: '1 week ago', size: '1.8 MB' },
    { name: 'GDPR Compliance Guide', type: 'Compliance', updated: '3 days ago', size: '4.2 MB' },
    { name: 'Access Control Policy', type: 'Policy', updated: '5 days ago', size: '1.5 MB' }
  ];
  
  return documents.map(doc => html`
    <div class="px-6 py-4 flex items-center justify-between">
      <div class="flex items-center">
        <i class="fas fa-file-pdf text-red-500 mr-3"></i>
        <div>
          <div class="text-sm font-medium text-gray-900">${doc.name}</div>
          <div class="text-sm text-gray-500">${doc.type} • ${doc.size} • Updated ${doc.updated}</div>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <button class="text-blue-600 hover:text-blue-900">Download</button>
        <button class="text-gray-600 hover:text-gray-900">View</button>
      </div>
    </div>
  `).join('');
}

function renderDefenderAlerts() {
  const alerts = [
    { title: 'Suspicious PowerShell Activity', severity: 'High', machine: 'WS-DEV-05', time: '5 min ago' },
    { title: 'Malware Detection', severity: 'Critical', machine: 'WS-USER-12', time: '15 min ago' },
    { title: 'Network Anomaly', severity: 'Medium', machine: 'SRV-WEB-01', time: '30 min ago' },
    { title: 'Failed Login Attempts', severity: 'Low', machine: 'DC-MAIN-01', time: '1 hour ago' }
  ];
  
  return alerts.map(alert => html`
    <div class="px-6 py-4 flex items-center justify-between">
      <div class="flex items-center">
        <i class="fas fa-exclamation-triangle text-red-500 mr-3"></i>
        <div>
          <div class="text-sm font-medium text-gray-900">${alert.title}</div>
          <div class="text-sm text-gray-500">${alert.machine} • ${alert.time}</div>
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(alert.severity)}">
          ${alert.severity}
        </span>
        <button class="text-blue-600 hover:text-blue-900">Investigate</button>
      </div>
    </div>
  `).join('');
}

function getRiskColor(risk: string) {
  switch (risk.toLowerCase()) {
    case 'critical': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getSeverityColor(severity: string) {
  switch (severity.toLowerCase()) {
    case 'critical': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// Mock data functions
async function getAssets() {
  return [
    { id: 1, name: 'WEB-SRV-01', type: 'Server', status: 'Active', location: 'Data Center' },
    { id: 2, name: 'DB-SRV-02', type: 'Server', status: 'Active', location: 'Data Center' },
    { id: 3, name: 'WS-ADMIN-03', type: 'Workstation', status: 'Active', location: 'Office' }
  ];
}

async function getServices() {
  return [
    { id: 1, name: 'Customer Portal', assets: 23, risk: 'High' },
    { id: 2, name: 'Payment Gateway', assets: 12, risk: 'Critical' },
    { id: 3, name: 'API Services', assets: 45, risk: 'High' }
  ];
}

async function createAsset(assetData: any) {
  return { id: Date.now(), ...assetData, created: new Date().toISOString() };
}

async function createService(serviceData: any) {
  return { id: Date.now(), ...serviceData, created: new Date().toISOString() };
}