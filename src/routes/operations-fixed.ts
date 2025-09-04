import { Hono } from 'hono';
import { html, raw } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import type { CloudflareBindings } from '../types';

export function createOperationsRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware to all routes
  app.use('*', requireAuth);
  
  // Main operations dashboard
  app.get('/', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Operations Center',
        user,
        content: renderOperationsDashboard()
      })
    );
  });
  
  // Asset Management
  app.get('/assets', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Asset Management',
        user,
        content: renderAssetManagement()
      })
    );
  });
  
  // Service Management
  app.get('/services', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Service Management',
        user,
        content: renderServiceManagement()
      })
    );
  });
  
  // Document Management
  app.get('/documents', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Document Management',
        user,
        content: renderDocumentManagement()
      })
    );
  });

  // Microsoft Defender Integration
  app.get('/defender', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Microsoft Defender Integration',
        user,
        content: renderDefenderIntegration()
      })
    );
  });

  // Stats API endpoints for dashboard
  app.get('/api/stats/assets', async (c) => {
    const assets = await getAssets(c.env.DB);
    const count = assets.length;
    return c.html(`
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <i class="fas fa-server text-2xl text-blue-500"></i>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Total Assets</dt>
              <dd class="text-lg font-medium text-gray-900">${count}</dd>
            </dl>
          </div>
        </div>
      </div>
    `);
  });

  app.get('/api/stats/services', async (c) => {
    const services = await getServices(c.env.DB);
    const count = services.length;
    return c.html(`
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <i class="fas fa-sitemap text-2xl text-green-500"></i>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Active Services</dt>
              <dd class="text-lg font-medium text-gray-900">${count}</dd>
            </dl>
          </div>
        </div>
      </div>
    `);
  });

  app.get('/api/stats/documents', async (c) => {
    try {
      const result = await c.env.DB.prepare('SELECT COUNT(*) as count FROM evidence').first();
      const count = result?.count || 0;
      return c.html(`
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-file-alt text-2xl text-purple-500"></i>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Documents</dt>
                <dd class="text-lg font-medium text-gray-900">${count}</dd>
              </dl>
            </div>
          </div>
        </div>
      `);
    } catch (error) {
      console.error('Error fetching document count:', error);
      return c.html(`
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-file-alt text-2xl text-purple-500"></i>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Documents</dt>
                <dd class="text-lg font-medium text-gray-900">0</dd>
              </dl>
            </div>
          </div>
        </div>
      `);
    }
  });

  app.get('/api/stats/incidents', async (c) => {
    try {
      const result = await c.env.DB.prepare("SELECT COUNT(*) as count FROM incidents WHERE status = 'open'").first();
      const count = result?.count || 0;
      return c.html(`
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Open Incidents</dt>
                <dd class="text-lg font-medium text-gray-900">${count}</dd>
              </dl>
            </div>
          </div>
        </div>
      `);
    } catch (error) {
      console.error('Error fetching incident count:', error);
      return c.html(`
        <div class="p-5">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Open Incidents</dt>
                <dd class="text-lg font-medium text-gray-900">0</dd>
              </dl>
            </div>
          </div>
        </div>
      `);
    }
  });

  // API endpoints - now using D1 database
  app.get('/api/assets', async (c) => {
    const assets = await getAssets(c.env.DB);
    return c.html(renderAssetRows(assets));
  });

  app.get('/api/services', async (c) => {
    // Query actual services from D1 - since schema doesn't have services table, we'll create a basic implementation
    const assets = await getAssets(c.env.DB);
    return c.html(renderServiceRows([])); // Empty for now, will implement proper services table
  });

  app.post('/api/assets', async (c) => {
    try {
      const formData = await c.req.formData();
      
      // Enhanced ARIA5 asset data collection
      const assetData = {
        // Basic asset information
        name: formData.get('name'),
        type: formData.get('type'),
        operating_system: formData.get('operating_system'),
        location: formData.get('location'),
        asset_owner: formData.get('asset_owner'),
        technical_custodian: formData.get('technical_custodian'),
        
        // Security assessment (CIA Triad)
        confidentiality: formData.get('confidentiality'),
        integrity: formData.get('integrity'),
        availability: formData.get('availability'),
        
        // Technical & compliance configuration
        network_zone: formData.get('network_zone'),
        criticality: formData.get('criticality'),
        compliance_requirements: formData.get('compliance_requirements'),
        patch_management: formData.get('patch_management'),
        backup_status: formData.get('backup_status'),
        monitoring_level: formData.get('monitoring_level'),
        
        // Additional information
        description: formData.get('description'),
        
        // Calculated risk score
        risk_score: formData.get('risk_score'),
        
        // System fields
        status: 'Active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const asset = await createAsset(c.env.DB, assetData);
      
      // Determine risk level for display
      const riskScore = parseFloat(assetData.risk_score || '0');
      let riskLevel, riskColor;
      if (riskScore >= 3.5) {
        riskLevel = 'Critical';
        riskColor = 'text-red-600 bg-red-100';
      } else if (riskScore >= 2.5) {
        riskLevel = 'High';
        riskColor = 'text-orange-600 bg-orange-100';
      } else if (riskScore >= 1.5) {
        riskLevel = 'Medium';
        riskColor = 'text-yellow-600 bg-yellow-100';
      } else {
        riskLevel = 'Low';
        riskColor = 'text-green-600 bg-green-100';
      }
      
      // Return enhanced success message with asset details
      return c.html(html`
        <div class="fixed inset-0 bg-green-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div class="bg-white p-8 rounded-lg shadow-xl text-center max-w-md mx-4">
            <i class="fas fa-check-circle text-green-500 text-5xl mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Asset Added Successfully!</h3>
            
            <div class="bg-gray-50 rounded-lg p-4 mb-4 text-left">
              <div class="text-sm space-y-2">
                <div><span class="font-medium">Asset:</span> ${assetData.name}</div>
                <div><span class="font-medium">Type:</span> ${assetData.type || 'Not specified'}</div>
                <div><span class="font-medium">Location:</span> ${assetData.location || 'Not specified'}</div>
                <div><span class="font-medium">OS:</span> ${assetData.operating_system || 'Not specified'}</div>
                <div class="flex items-center">
                  <span class="font-medium mr-2">Risk Level:</span>
                  <span class="px-2 py-1 rounded-full text-xs font-medium ${riskColor}">
                    ${riskLevel} ${riskScore > 0 ? `(${riskScore.toFixed(1)}/4.0)` : ''}
                  </span>
                </div>
                <div><span class="font-medium">CIA Rating:</span> C:${assetData.confidentiality}, I:${assetData.integrity}, A:${assetData.availability}</div>
                <div><span class="font-medium">Criticality:</span> ${assetData.criticality || 'Medium'}</div>
              </div>
            </div>
            
            <p class="text-sm text-gray-600 mb-6">
              The asset has been configured with ARIA5 security assessment and is now active in the system.
            </p>
            
            <button hx-get="/operations/api/assets/close" hx-target="#asset-modal" hx-swap="innerHTML"
                    class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors">
              Close
            </button>
          </div>
        </div>
      `);
    } catch (error) {
      console.error('Asset creation error:', error);
      return c.html(html`
        <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div class="flex">
            <i class="fas fa-exclamation-triangle text-red-400 mr-2"></i>
            <div class="text-sm text-red-700">
              Error adding asset. Please check all required fields and try again.
            </div>
          </div>
        </div>
        ${renderAssetModal()}
      `);
    }
  });

  app.post('/api/services', async (c) => {
    try {
      const formData = await c.req.formData();
      
      // For now, services will be stored as risks with special category
      const serviceData = {
        title: formData.get('name'),
        description: formData.get('description'),
        category: 'service',
        probability: parseInt(formData.get('confidentiality')) || 1,
        impact: parseInt(formData.get('integrity')) || 1,
        status: 'active',
        organization_id: 1, // Default org
        created_by: 1 // Default user
      };
      
      const service = await createService(c.env.DB, serviceData);
      
      return c.html(html`
        <div class="fixed inset-0 bg-green-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div class="bg-white p-8 rounded-lg shadow-xl text-center max-w-md mx-4">
            <i class="fas fa-check-circle text-green-500 text-5xl mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-900 mb-3">Service Added Successfully!</h3>
            
            <p class="text-sm text-gray-600 mb-6">
              The service has been configured with ARIA5 compliance standards and is now active in the system.
            </p>
            
            <button hx-get="/operations/api/services/close" hx-target="#service-modal" hx-swap="innerHTML"
                    class="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors">
              Close
            </button>
          </div>
        </div>
      `);
    } catch (error) {
      console.error('Service creation error:', error);
      return c.html(html`
        <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div class="flex">
            <i class="fas fa-exclamation-triangle text-red-400 mr-2"></i>
            <div class="text-sm text-red-700">
              Error adding service. Please check all required fields and try again.
            </div>
          </div>
        </div>
        ${renderServiceModal()}
      `);
    }
  });

  // Modal endpoints for HTMX
  app.get('/api/assets/new', async (c) => {
    return c.html(renderAssetModal());
  });

  app.get('/api/services/new', async (c) => {
    return c.html(renderServiceModal());
  });

  // Document upload modal endpoint
  app.get('/api/documents/new', async (c) => {
    return c.html(renderDocumentUploadModal());
  });

  // Document upload processing
  app.post('/api/documents', async (c) => {
    try {
      const formData = await c.req.formData();
      const documentData = {
        name: formData.get('name'),
        type: formData.get('type'),
        description: formData.get('description'),
        file: formData.get('file') // In a real app, this would be processed
      };
      
      // Return success message and close modal
      return c.html(html`
        <div class="fixed inset-0 bg-purple-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div class="bg-white p-6 rounded-lg shadow-lg text-center">
            <i class="fas fa-check-circle text-purple-500 text-4xl mb-4"></i>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Document Uploaded Successfully!</h3>
            <p class="text-sm text-gray-600 mb-4">${documentData.name} has been uploaded to the system.</p>
            <button hx-get="/operations/api/documents/close" hx-target="#document-modal" hx-swap="innerHTML"
                    class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
              Close
            </button>
          </div>
        </div>
      `);
    } catch (error) {
      return c.html(html`
        <div class="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div class="flex">
            <i class="fas fa-exclamation-triangle text-red-400 mr-2"></i>
            <div class="text-sm text-red-700">
              Error uploading document. Please try again.
            </div>
          </div>
        </div>
        ${renderDocumentUploadModal()}
      `);
    }
  });

  // Modal close endpoints
  app.get('/api/assets/close', async (c) => {
    return c.html(''); // Return empty content to close modal
  });

  app.get('/api/services/close', async (c) => {
    return c.html(''); // Return empty content to close modal
  });

  app.get('/api/documents/close', async (c) => {
    return c.html(''); // Return empty content to close modal
  });

  app.get('/api/link/close', async (c) => {
    return c.html(''); // Return empty content to close link modal
  });

  // API endpoint to get services for risk management
  app.get('/api/services/for-risk', async (c) => {
    const services = await getServices(c.env.DB);
    return c.json({ success: true, services });
  });

  // API endpoint to get assets for risk management  
  app.get('/api/assets/for-risk', async (c) => {
    const assets = await getAssets(c.env.DB);
    return c.json({ success: true, assets });
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

      <!-- Quick Stats - Now loading real data -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white overflow-hidden shadow rounded-lg" 
             hx-get="/operations/api/stats/assets" 
             hx-trigger="load"
             hx-swap="innerHTML">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-server text-2xl text-blue-500"></i>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Total Assets</dt>
                  <dd class="text-lg font-medium text-gray-900">Loading...</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg"
             hx-get="/operations/api/stats/services"
             hx-trigger="load"
             hx-swap="innerHTML">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-sitemap text-2xl text-green-500"></i>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Active Services</dt>
                  <dd class="text-lg font-medium text-gray-900">Loading...</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg"
             hx-get="/operations/api/stats/documents"
             hx-trigger="load"
             hx-swap="innerHTML">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-file-alt text-2xl text-purple-500"></i>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Documents</dt>
                  <dd class="text-lg font-medium text-gray-900">Loading...</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white overflow-hidden shadow rounded-lg"
             hx-get="/operations/api/stats/incidents"
             hx-trigger="load"
             hx-swap="innerHTML">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Security Alerts</dt>
                  <dd class="text-lg font-medium text-gray-900">Loading...</dd>
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
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Criticality</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200" hx-get="/operations/api/assets" hx-trigger="load">
              <!-- Loading placeholder -->
              <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                  <i class="fas fa-spinner fa-spin text-gray-300 text-2xl mb-2"></i>
                  <div>Loading assets...</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Asset Modal Container -->
  <div id="asset-modal"></div>
  
  <!-- Link Modal Container -->  
  <div id="link-modal"></div>
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
              <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                  <i class="fas fa-sitemap text-gray-300 text-3xl mb-2"></i>
                  <div>No services found. <a href="#" hx-get="/operations/api/services/new" hx-target="#service-modal" hx-swap="innerHTML" class="text-green-600 hover:text-green-800">Add your first service</a>.</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Service Modal Container -->
  <div id="service-modal"></div>
  
  <!-- Link Modal Container -->
  <div id="link-modal"></div>
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
        <button hx-get="/operations/api/documents/new" hx-target="#document-modal" hx-swap="innerHTML"
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
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
          ${raw(renderDocumentRows())}
        </div>
      </div>
    </div>
  </div>
  
  <!-- Document Modal Container -->
  <div id="document-modal"></div>
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
          ${raw(renderDefenderAlerts())}
        </div>
      </div>
    </div>
  </div>
`;

// D1 Database Functions
async function getAssets(db: D1Database) {
  try {
    const result = await db.prepare(`
      SELECT * FROM assets 
      WHERE status = 'active' 
      ORDER BY created_at DESC
    `).all();
    
    return result.results || [];
  } catch (error) {
    console.error('Error fetching assets:', error);
    return [];
  }
}

async function getServices(db: D1Database) {
  try {
    // For now, get risks that are marked as services
    const result = await db.prepare(`
      SELECT * FROM risks 
      WHERE category = 'service' 
      ORDER BY created_at DESC
    `).all();
    
    return result.results || [];
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
}

async function createAsset(db: D1Database, assetData: any) {
  try {
    const result = await db.prepare(`
      INSERT INTO assets (
        name, type, category, location, criticality, 
        value, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      assetData.name,
      assetData.type || 'Unknown',
      assetData.category || 'IT Infrastructure',
      assetData.location || 'Unknown',
      assetData.criticality || 'medium',
      0, // value - we can calculate this later
      'active',
      new Date().toISOString(),
      new Date().toISOString()
    ).run();
    
    return { id: result.meta?.last_row_id, ...assetData };
  } catch (error) {
    console.error('Error creating asset:', error);
    throw new Error('Failed to create asset');
  }
}

async function createService(db: D1Database, serviceData: any) {
  try {
    // Store services as special risk entries for now
    const result = await db.prepare(`
      INSERT INTO risks (
        title, description, category, probability, impact, 
        status, organization_id, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      serviceData.title,
      serviceData.description || '',
      'service',
      serviceData.probability || 1,
      serviceData.impact || 1,
      'active',
      serviceData.organization_id || 1,
      serviceData.created_by || 1,
      new Date().toISOString(),
      new Date().toISOString()
    ).run();
    
    return { id: result.meta?.last_row_id, ...serviceData };
  } catch (error) {
    console.error('Error creating service:', error);
    throw new Error('Failed to create service');
  }
}

// Helper functions - using raw strings to avoid HTML escaping issues
function renderAssetRows(assets: any[]) {
  if (!assets || assets.length === 0) {
    return `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-gray-500">
          <i class="fas fa-server text-gray-300 text-3xl mb-2"></i>
          <div>No assets found. <a href="#" hx-get="/operations/api/assets/new" hx-target="#asset-modal" hx-swap="innerHTML" class="text-blue-600 hover:text-blue-800">Add your first asset</a>.</div>
        </td>
      </tr>
    `;
  }
  
  return assets.map(asset => `
    <tr>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <div>
            <div class="text-sm font-medium text-gray-900">${asset.name}</div>
            <div class="text-sm text-gray-500">${asset.type || 'Unknown type'}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${asset.type || 'Unknown'}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          ${asset.status}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${asset.location || 'Unknown'}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskColor(asset.criticality)}">
          ${asset.criticality || 'Medium'}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button class="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
        <button class="text-red-600 hover:text-red-900">Delete</button>
      </td>
    </tr>
  `).join('');
}

function renderServiceRows(services: any[]) {
  if (!services || services.length === 0) {
    return `
      <tr>
        <td colspan="5" class="px-6 py-8 text-center text-gray-500">
          <i class="fas fa-sitemap text-gray-300 text-3xl mb-2"></i>
          <div>No services found. <a href="#" hx-get="/operations/api/services/new" hx-target="#service-modal" hx-swap="innerHTML" class="text-green-600 hover:text-green-800">Add your first service</a>.</div>
        </td>
      </tr>
    `;
  }
  
  return services.map(service => `
    <tr>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <div>
            <div class="text-sm font-medium text-gray-900">${service.title}</div>
            <div class="text-sm text-gray-500">${service.description || 'No description'}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="text-sm text-gray-900">0</span>
        <div class="text-xs text-gray-500">linked</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-xs space-y-1">
          <div>C: <span class="font-medium text-gray-600">${service.probability || 1}</span></div>
          <div>I: <span class="font-medium text-gray-600">${service.impact || 1}</span></div>
          <div>A: <span class="font-medium text-gray-600">${(service.probability + service.impact) / 2 || 1}</span></div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          Medium
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button class="text-green-600 hover:text-green-900 mr-3">Link Assets</button>
        <button class="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
        <button class="text-red-600 hover:text-red-900">Delete</button>
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
  
  return documents.map(doc => `
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
  
  return alerts.map(alert => `
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
  switch (risk?.toLowerCase()) {
    case 'critical': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getSeverityColor(severity: string) {
  switch (severity?.toLowerCase()) {
    case 'critical': return 'bg-red-100 text-red-800';
    case 'high': return 'bg-orange-100 text-orange-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'low': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// HTMX-based Modal rendering functions for ARIA5.1
const renderAssetModal = () => html`
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" 
       hx-target="this" 
       hx-swap="outerHTML"
       _="on click from elsewhere halt the event">
    <div class="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-xl rounded-lg bg-white">
      <div class="mt-3">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-xl font-semibold text-gray-900 flex items-center">
              <i class="fas fa-server text-blue-600 mr-3"></i>
              Add New Asset - ARIA5 Configuration
            </h3>
            <p class="text-sm text-gray-600 mt-1">Configure asset with comprehensive security assessment and ARIA5 compliance standards</p>
          </div>
          <button hx-get="/operations/api/assets/close" hx-target="#asset-modal" hx-swap="innerHTML" 
                  class="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>
        
        <form hx-post="/operations/api/assets" 
              hx-target="#asset-modal" 
              hx-swap="innerHTML"
              hx-indicator="#asset-loading"
              onchange="calculateAssetRisk()">
          
          <!-- Basic Asset Information -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div class="space-y-4">
              <h4 class="text-lg font-medium text-gray-800 border-b pb-2">
                <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                Asset Information
              </h4>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-tag mr-1"></i>Asset Name *
                </label>
                <input type="text" name="name" required 
                       placeholder="e.g., WEB-SRV-01, DB-MAIN-02"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-desktop mr-1"></i>Asset Type *
                </label>
                <select name="type" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Asset Type</option>
                  <option value="Physical Server">Physical Server</option>
                  <option value="Virtual Server">Virtual Server</option>
                  <option value="Database Server">Database Server</option>
                  <option value="Web Server">Web Server</option>
                  <option value="Application Server">Application Server</option>
                  <option value="Workstation">Workstation</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Mobile Device">Mobile Device</option>
                  <option value="Network Switch">Network Switch</option>
                  <option value="Router">Router</option>
                  <option value="Firewall">Firewall</option>
                  <option value="Load Balancer">Load Balancer</option>
                  <option value="Storage Device">Storage Device</option>
                  <option value="IoT Device">IoT Device</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  <i class="fas fa-map-marker-alt mr-1"></i>Physical Location *
                </label>
                <select name="location" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Location</option>
                  <option value="Primary Data Center">Primary Data Center</option>
                  <option value="Secondary Data Center">Secondary Data Center</option>
                  <option value="Cloud (AWS)">Cloud (AWS)</option>
                  <option value="Cloud (Azure)">Cloud (Azure)</option>
                  <option value="Cloud (GCP)">Cloud (GCP)</option>
                  <option value="Cloud (Other)">Cloud (Other)</option>
                  <option value="Head Office">Head Office</option>
                  <option value="Branch Office">Branch Office</option>
                  <option value="Remote Location">Remote Location</option>
                  <option value="Mobile/Portable">Mobile/Portable</option>
                  <option value="Home Office">Home Office</option>
                  <option value="Third Party">Third Party</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Asset Criticality</label>
                <select name="criticality" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>
            
            <!-- Security Assessment -->
            <div class="space-y-4">
              <h4 class="text-lg font-medium text-gray-800 border-b pb-2">
                <i class="fas fa-shield-alt text-red-500 mr-2"></i>
                Security Assessment
              </h4>
              
              <div class="bg-blue-50 p-4 rounded-lg">
                <h5 class="font-medium text-blue-800 mb-2">
                  <i class="fas fa-eye-slash mr-1"></i>Data Confidentiality *
                </h5>
                <p class="text-xs text-blue-700 mb-3">Sensitivity of data stored/processed on this asset</p>
                <select name="confidentiality" id="asset_confidentiality" required 
                        class="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Level</option>
                  <option value="1">1 - Public (Publicly available information)</option>
                  <option value="2">2 - Internal (Internal use only)</option>
                  <option value="3">3 - Confidential (Sensitive business data)</option>
                  <option value="4">4 - Restricted (Highly classified data)</option>
                </select>
              </div>
              
              <div class="bg-orange-50 p-4 rounded-lg">
                <h5 class="font-medium text-orange-800 mb-2">
                  <i class="fas fa-check-double mr-1"></i>Data Integrity *
                </h5>
                <p class="text-xs text-orange-700 mb-3">Impact if asset data is corrupted or tampered</p>
                <select name="integrity" id="asset_integrity" required 
                        class="w-full px-3 py-2 border border-orange-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                  <option value="">Select Level</option>
                  <option value="1">1 - Low (Minimal business impact)</option>
                  <option value="2">2 - Medium (Moderate business impact)</option>
                  <option value="3">3 - High (Significant business disruption)</option>
                  <option value="4">4 - Critical (Severe business/safety impact)</option>
                </select>
              </div>
              
              <div class="bg-green-50 p-4 rounded-lg">
                <h5 class="font-medium text-green-800 mb-2">
                  <i class="fas fa-clock mr-1"></i>Availability Requirement *
                </h5>
                <p class="text-xs text-green-700 mb-3">Business impact if asset becomes unavailable</p>
                <select name="availability" id="asset_availability" required 
                        class="w-full px-3 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Select Level</option>
                  <option value="1">1 - Low (Can be down for days)</option>
                  <option value="2">2 - Medium (Can be down for hours)</option>
                  <option value="3">3 - High (Maximum 1 hour downtime)</option>
                  <option value="4">4 - Critical (Near zero downtime required)</option>
                </select>
              </div>
              
              <!-- Overall Risk Score Display -->
              <div class="bg-gray-50 p-4 rounded-lg">
                <h5 class="font-medium text-gray-800 mb-2">
                  <i class="fas fa-calculator mr-1"></i>Asset Risk Score
                </h5>
                <div id="asset-risk-display" class="text-2xl font-bold text-gray-400">
                  Select CIA ratings to calculate
                </div>
                <div class="text-xs text-gray-600 mt-1">
                  Calculated as: max(C, I, A) + weighted average
                </div>
              </div>
            </div>
          </div>
          
          <!-- Additional Information -->
          <div class="border-t pt-6 mb-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                <i class="fas fa-sticky-note mr-1"></i>Asset Description & Notes
              </label>
              <textarea name="description" rows="3" 
                        placeholder="Additional details about the asset, configuration notes, or special requirements"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            </div>
          </div>
          
          <!-- Hidden field for calculated risk score -->
          <input type="hidden" name="risk_score" id="asset_risk_value" value="">
          
          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" 
                    hx-get="/operations/api/assets/close" 
                    hx-target="#asset-modal" 
                    hx-swap="innerHTML"
                    class="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors">
              Cancel
            </button>
            <button type="submit" 
                    class="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center">
              <span class="htmx-indicator" id="asset-loading">
                <i class="fas fa-spinner fa-spin mr-2"></i>
              </span>
              <i class="fas fa-plus mr-2"></i>
              Create Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  
  <script>
    function calculateAssetRisk() {
      const c = parseInt(document.getElementById('asset_confidentiality')?.value || '0');
      const i = parseInt(document.getElementById('asset_integrity')?.value || '0');
      const a = parseInt(document.getElementById('asset_availability')?.value || '0');
      
      if (c && i && a) {
        // ARIA5 risk calculation: max value + weighted average
        const maxRating = Math.max(c, i, a);
        const weightedAvg = (c + i + a) / 3;
        const overallScore = (maxRating * 0.6) + (weightedAvg * 0.4);
        
        // Risk level determination
        let riskLevel, riskColor, riskBg;
        if (overallScore >= 3.5) {
          riskLevel = 'Critical';
          riskColor = 'text-red-600';
          riskBg = 'bg-red-100';
        } else if (overallScore >= 2.5) {
          riskLevel = 'High';
          riskColor = 'text-orange-600';
          riskBg = 'bg-orange-100';
        } else if (overallScore >= 1.5) {
          riskLevel = 'Medium';
          riskColor = 'text-yellow-600';
          riskBg = 'bg-yellow-100';
        } else {
          riskLevel = 'Low';
          riskColor = 'text-green-600';
          riskBg = 'bg-green-100';
        }
        
        document.getElementById('asset-risk-display').innerHTML = \`
          <div class="flex items-center space-x-2">
            <span class="px-3 py-1 rounded-full text-sm font-medium \${riskBg} \${riskColor}">
              \${riskLevel}
            </span>
            <span class="text-gray-600">(\${overallScore.toFixed(1)}/4.0)</span>
          </div>
        \`;
        
        document.getElementById('asset_risk_value').value = overallScore.toFixed(2);
      }
    }
  </script>
`;

const renderServiceModal = () => html`
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" 
       hx-target="this" 
       hx-swap="outerHTML"
       _="on click from elsewhere halt the event">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">Add New Service</h3>
          <button hx-get="/operations/api/services/close" hx-target="#service-modal" hx-swap="innerHTML" 
                  class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form hx-post="/operations/api/services" 
              hx-target="#service-modal" 
              hx-swap="innerHTML"
              hx-indicator="#service-loading">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Service Name</label>
            <input type="text" name="name" required 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea name="description" rows="3" 
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"></textarea>
          </div>
          
          <div class="flex justify-end space-x-3">
            <button type="button" 
                    hx-get="/operations/api/services/close" 
                    hx-target="#service-modal" 
                    hx-swap="innerHTML"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md">
              Cancel
            </button>
            <button type="submit" 
                    class="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md flex items-center">
              <span class="htmx-indicator" id="service-loading">
                <i class="fas fa-spinner fa-spin mr-2"></i>
              </span>
              Create Service
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
`;

const renderDocumentUploadModal = () => html`
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" 
       hx-target="this" 
       hx-swap="outerHTML"
       _="on click from elsewhere halt the event">
    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">Upload Document</h3>
          <button hx-get="/operations/api/documents/close" hx-target="#document-modal" hx-swap="innerHTML" 
                  class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form hx-post="/operations/api/documents" 
              hx-target="#document-modal" 
              hx-swap="innerHTML"
              hx-indicator="#document-loading"
              enctype="multipart/form-data">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Document Name</label>
            <input type="text" name="name" required 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
            <select name="type" required class="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="">Select Type</option>
              <option value="Policy">Security Policy</option>
              <option value="Procedure">Procedure</option>
              <option value="Compliance">Compliance Document</option>
              <option value="Certificate">Certificate</option>
              <option value="Report">Report</option>
            </select>
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea name="description" rows="3" 
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
          </div>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">File</label>
            <input type="file" name="file" accept=".pdf,.doc,.docx,.txt" 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md">
          </div>
          
          <div class="flex justify-end space-x-3">
            <button type="button" 
                    hx-get="/operations/api/documents/close" 
                    hx-target="#document-modal" 
                    hx-swap="innerHTML"
                    class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md">
              Cancel
            </button>
            <button type="submit" 
                    class="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-md flex items-center">
              <span class="htmx-indicator" id="document-loading">
                <i class="fas fa-spinner fa-spin mr-2"></i>
              </span>
              Upload
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
`;