import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { baseLayout } from '../templates/layout';
import { DatabaseService } from '../lib/database';
import type { CloudflareBindings } from '../types';

export function createAssetsRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware
  app.use('*', requireAuth);
  
  // Main assets page
  app.get('/', async (c) => {
    const user = c.get('user');
    return c.html(
      baseLayout({
        title: 'Asset Management',
        user,
        content: renderAssetsPage()
      })
    );
  });
  
  // Assets table content (for HTMX updates)
  app.get('/table', async (c) => {
    const search = c.req.query('search') || '';
    const type = c.req.query('type') || '';
    const riskLevel = c.req.query('risk_level') || '';
    
    // Get assets from database or use mock data
    const assets = await getAssets({ search, type, riskLevel });
    return c.html(renderAssetsTable(assets));
  });
  
  // Asset statistics cards (for HTMX updates)
  app.get('/stats', async (c) => {
    const stats = await getAssetStatistics();
    return c.html(renderAssetStats(stats));
  });
  
  // Create asset modal
  app.get('/create', async (c) => {
    return c.html(renderCreateAssetModal());
  });
  
  // Create asset action
  app.post('/', async (c) => {
    const formData = await c.req.parseBody();
    const user = c.get('user');
    
    try {
      const newAsset = await createAsset(formData, user.id);
      c.header('HX-Trigger', 'assetCreated');
      return c.html(`
        <div class="bg-green-50 border-l-4 border-green-500 p-4">
          <p class="text-green-700">Asset created successfully!</p>
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
  
  // Edit asset modal
  app.get('/:id/edit', async (c) => {
    const id = c.req.param('id');
    const asset = await getAssetById(id);
    return c.html(renderEditAssetModal(asset));
  });
  
  // Update asset
  app.put('/:id', async (c) => {
    const id = c.req.param('id');
    const formData = await c.req.parseBody();
    const user = c.get('user');
    
    try {
      await updateAsset(id, formData, user.id);
      c.header('HX-Trigger', 'assetUpdated');
      return c.html(`
        <div class="bg-green-50 border-l-4 border-green-500 p-4">
          <p class="text-green-700">Asset updated successfully!</p>
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
  
  // Delete asset
  app.delete('/:id', async (c) => {
    const id = c.req.param('id');
    
    try {
      await deleteAsset(id);
      c.header('HX-Trigger', 'assetDeleted');
      return c.html('');
    } catch (error) {
      return c.html(`
        <div class="bg-red-50 border-l-4 border-red-500 p-4">
          <p class="text-red-700">Error: ${error.message}</p>
        </div>
      `, 400);
    }
  });
  
  // Sync Microsoft Defender assets
  app.post('/sync/microsoft', async (c) => {
    try {
      const result = await syncMicrosoftAssets();
      c.header('HX-Trigger', 'assetsSynced');
      return c.html(`
        <div class="bg-blue-50 border-l-4 border-blue-500 p-4">
          <p class="text-blue-700">Microsoft Defender sync completed. ${result.count} assets synchronized.</p>
        </div>
      `);
    } catch (error) {
      return c.html(`
        <div class="bg-red-50 border-l-4 border-red-500 p-4">
          <p class="text-red-700">Sync failed: ${error.message}</p>
        </div>
      `);
    }
  });
  
  return app;
}

// Template functions
const renderAssetsPage = () => html`
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Asset Management</h2>
        <p class="text-gray-600 mt-1">Manage IT assets, devices, and infrastructure components</p>
      </div>
      <div class="flex space-x-3">
        <button 
          hx-post="/assets/sync/microsoft" 
          hx-target="#notification-area" 
          hx-swap="innerHTML"
          class="btn-secondary">
          <i class="fas fa-sync-alt mr-2"></i>Sync Microsoft Defender
        </button>
        <button class="btn-secondary">
          <i class="fas fa-upload mr-2"></i>Import
        </button>
        <button class="btn-secondary">
          <i class="fas fa-download mr-2"></i>Export
        </button>
        <button 
          hx-get="/assets/create" 
          hx-target="#modal-container" 
          hx-swap="innerHTML"
          class="btn-primary">
          <i class="fas fa-plus mr-2"></i>Add Asset
        </button>
      </div>
    </div>
    
    <!-- Notification Area -->
    <div id="notification-area"></div>
    
    <!-- Asset Statistics -->
    <div id="asset-stats-container" hx-get="/assets/stats" hx-trigger="load, assetCreated from:body, assetUpdated from:body, assetDeleted from:body, assetsSynced from:body">
      <!-- Stats will be loaded here -->
    </div>
    
    <!-- Asset Filters -->
    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-64">
          <input 
            type="text" 
            name="search"
            placeholder="Search assets..." 
            class="form-input"
            hx-get="/assets/table"
            hx-trigger="keyup changed delay:500ms"
            hx-target="#assets-table-container"
            hx-include="[name='type'], [name='risk_level']"
          />
        </div>
        <select 
          name="type" 
          class="form-select"
          hx-get="/assets/table"
          hx-trigger="change"
          hx-target="#assets-table-container"
          hx-include="[name='search'], [name='risk_level']">
          <option value="">All Types</option>
          <option value="server">Server</option>
          <option value="workstation">Workstation</option>
          <option value="mobile">Mobile</option>
          <option value="network_device">Network Device</option>
          <option value="iot">IoT Device</option>
        </select>
        <select 
          name="risk_level" 
          class="form-select"
          hx-get="/assets/table"
          hx-trigger="change"
          hx-target="#assets-table-container"
          hx-include="[name='search'], [name='type']">
          <option value="">All Risk Levels</option>
          <option value="low">Low Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="high">High Risk</option>
          <option value="critical">Critical Risk</option>
        </select>
      </div>
    </div>
    
    <!-- Assets Table -->
    <div id="assets-table-container" hx-get="/assets/table" hx-trigger="load, assetCreated from:body, assetUpdated from:body, assetDeleted from:body, assetsSynced from:body">
      <!-- Table will be loaded here -->
    </div>
  </div>
`;

const renderAssetStats = (stats: any) => html`
  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-server text-blue-600"></i>
          </div>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-500">Total Assets</p>
          <p class="text-lg font-semibold text-gray-900">${stats.total}</p>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-exclamation-triangle text-red-600"></i>
          </div>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-500">High Risk Assets</p>
          <p class="text-lg font-semibold text-gray-900">${stats.highRisk}</p>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-shield-alt text-yellow-600"></i>
          </div>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-500">Unassigned Assets</p>
          <p class="text-lg font-semibold text-gray-900">${stats.unassigned}</p>
        </div>
      </div>
    </div>
    
    <div class="bg-white rounded-lg shadow p-4">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-sync-alt text-green-600"></i>
          </div>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-500">Last Sync</p>
          <p class="text-lg font-semibold text-gray-900">${stats.lastSync || 'Never'}</p>
        </div>
      </div>
    </div>
  </div>
`;

const renderAssetsTable = (assets: any[]) => html`
  <div class="bg-white rounded-lg shadow overflow-hidden">
    <div class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${assets.map(asset => html`
            <tr>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center">
                      <i class="fas ${getAssetIcon(asset.type)} text-gray-600"></i>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">${asset.name}</div>
                    <div class="text-sm text-gray-500">${asset.hostname}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  ${asset.type}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelClass(asset.riskLevel)}">
                  ${asset.riskScore}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(asset.status)}">
                  ${asset.status}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ${asset.owner || 'Unassigned'}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                  hx-get="/assets/${asset.id}/edit"
                  hx-target="#modal-container"
                  hx-swap="innerHTML"
                  class="text-blue-600 hover:text-blue-900 mr-3">
                  <i class="fas fa-edit"></i>
                </button>
                <button 
                  hx-delete="/assets/${asset.id}"
                  hx-confirm="Are you sure you want to delete this asset?"
                  hx-target="closest tr"
                  hx-swap="outerHTML"
                  class="text-red-600 hover:text-red-900">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  </div>
`;

const renderCreateAssetModal = () => html`
  <div id="asset-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <div class="flex justify-between items-center pb-4 border-b">
          <h3 class="text-lg font-medium text-gray-900">Add New Asset</h3>
          <button onclick="document.getElementById('modal-container').innerHTML = ''" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <form hx-post="/assets" hx-target="#modal-container" hx-swap="innerHTML" class="mt-6 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Asset Name</label>
              <input type="text" name="name" required class="form-input" placeholder="Enter asset name">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Hostname/IP</label>
              <input type="text" name="hostname" class="form-input" placeholder="Enter hostname or IP">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Asset Type</label>
              <select name="type" required class="form-select">
                <option value="">Select type</option>
                <option value="server">Server</option>
                <option value="workstation">Workstation</option>
                <option value="mobile">Mobile</option>
                <option value="network_device">Network Device</option>
                <option value="iot">IoT Device</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
              <select name="risk_level" class="form-select">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select name="status" class="form-select">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
                <option value="retired">Retired</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Owner</label>
              <input type="text" name="owner" class="form-input" placeholder="Asset owner">
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea name="description" rows="3" class="form-input" placeholder="Asset description"></textarea>
          </div>
          
          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary">
              Create Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
`;

const renderEditAssetModal = (asset: any) => html`
  <div id="asset-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <div class="flex justify-between items-center pb-4 border-b">
          <h3 class="text-lg font-medium text-gray-900">Edit Asset</h3>
          <button onclick="document.getElementById('modal-container').innerHTML = ''" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <form hx-put="/assets/${asset.id}" hx-target="#modal-container" hx-swap="innerHTML" class="mt-6 space-y-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Asset Name</label>
              <input type="text" name="name" value="${asset.name}" required class="form-input">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Hostname/IP</label>
              <input type="text" name="hostname" value="${asset.hostname}" class="form-input">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Asset Type</label>
              <select name="type" required class="form-select">
                <option value="server" ${asset.type === 'server' ? 'selected' : ''}>Server</option>
                <option value="workstation" ${asset.type === 'workstation' ? 'selected' : ''}>Workstation</option>
                <option value="mobile" ${asset.type === 'mobile' ? 'selected' : ''}>Mobile</option>
                <option value="network_device" ${asset.type === 'network_device' ? 'selected' : ''}>Network Device</option>
                <option value="iot" ${asset.type === 'iot' ? 'selected' : ''}>IoT Device</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Risk Level</label>
              <select name="risk_level" class="form-select">
                <option value="low" ${asset.risk_level === 'low' ? 'selected' : ''}>Low</option>
                <option value="medium" ${asset.risk_level === 'medium' ? 'selected' : ''}>Medium</option>
                <option value="high" ${asset.risk_level === 'high' ? 'selected' : ''}>High</option>
                <option value="critical" ${asset.risk_level === 'critical' ? 'selected' : ''}>Critical</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select name="status" class="form-select">
                <option value="active" ${asset.status === 'active' ? 'selected' : ''}>Active</option>
                <option value="inactive" ${asset.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                <option value="maintenance" ${asset.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                <option value="retired" ${asset.status === 'retired' ? 'selected' : ''}>Retired</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Owner</label>
              <input type="text" name="owner" value="${asset.owner}" class="form-input">
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea name="description" rows="3" class="form-input">${asset.description}</textarea>
          </div>
          
          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary">
              Update Asset
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
`;

// Data functions (mock data for now)
async function getAssets(filters: any) {
  // Mock asset data
  const mockAssets = [
    { id: 1, name: 'Web Server 01', hostname: 'web01.company.com', type: 'server', riskLevel: 'medium', riskScore: 12, status: 'active', owner: 'IT Team' },
    { id: 2, name: 'Database Server', hostname: 'db01.company.com', type: 'server', riskLevel: 'high', riskScore: 18, status: 'active', owner: 'DBA Team' },
    { id: 3, name: 'Admin Workstation', hostname: 'admin-ws-01', type: 'workstation', riskLevel: 'critical', riskScore: 22, status: 'active', owner: 'John Admin' },
    { id: 4, name: 'Network Switch', hostname: '192.168.1.1', type: 'network_device', riskLevel: 'low', riskScore: 5, status: 'active', owner: 'Network Team' }
  ];
  
  return mockAssets.filter(asset => {
    if (filters.search && !asset.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
    if (filters.type && asset.type !== filters.type) return false;
    if (filters.riskLevel && asset.riskLevel !== filters.riskLevel) return false;
    return true;
  });
}

async function getAssetStatistics() {
  return {
    total: 156,
    highRisk: 12,
    unassigned: 8,
    lastSync: '2 hours ago'
  };
}

async function getAssetById(id: string) {
  return {
    id,
    name: 'Web Server 01',
    hostname: 'web01.company.com',
    type: 'server',
    risk_level: 'medium',
    status: 'active',
    owner: 'IT Team',
    description: 'Primary web server hosting company website'
  };
}

async function createAsset(data: any, userId: number) {
  // Mock creation
  return { id: Date.now(), ...data };
}

async function updateAsset(id: string, data: any, userId: number) {
  // Mock update
  return true;
}

async function deleteAsset(id: string) {
  // Mock deletion
  return true;
}

async function syncMicrosoftAssets() {
  // Mock Microsoft Defender sync
  return { count: 25 };
}

// Helper functions
function getAssetIcon(type: string) {
  const icons = {
    server: 'fa-server',
    workstation: 'fa-desktop',
    mobile: 'fa-mobile-alt',
    network_device: 'fa-network-wired',
    iot: 'fa-microchip'
  };
  return icons[type] || 'fa-question';
}

function getRiskLevelClass(level: string) {
  const classes = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };
  return classes[level] || 'bg-gray-100 text-gray-800';
}

function getStatusClass(status: string) {
  const classes = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
    retired: 'bg-red-100 text-red-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
}