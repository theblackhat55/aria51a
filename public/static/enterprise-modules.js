// Enterprise Modules - Assets, Settings, Microsoft Integrations
// Asset Management, Settings, SAML, and Microsoft Defender Integration

// Assets Management Module
async function showAssets() {
  updateActiveNavigation('assets');
  currentModule = 'assets';
  
  const mainContent = document.getElementById('main-content');
  
  mainContent.innerHTML = `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Asset Management</h2>
          <p class="text-gray-600 mt-1">Manage IT assets, devices, and infrastructure components</p>
        </div>
        <div class="flex space-x-3">
          <button onclick="syncMicrosoftAssets()" class="btn-secondary">
            <i class="fas fa-sync-alt mr-2"></i>Sync Microsoft Defender
          </button>
          <button onclick="showImportAssetsModal()" class="btn-secondary">
            <i class="fas fa-upload mr-2"></i>Import
          </button>
          <button onclick="exportAssets()" class="btn-secondary">
            <i class="fas fa-download mr-2"></i>Export
          </button>
          <button onclick="showAddAssetModal()" class="btn-primary">
            <i class="fas fa-plus mr-2"></i>Add Asset
          </button>
        </div>
      </div>
      
      <!-- Asset Statistics -->
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
              <p class="text-lg font-semibold text-gray-900" id="total-assets">0</p>
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
              <p class="text-lg font-semibold text-gray-900" id="high-risk-assets">0</p>
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
              <p class="text-lg font-semibold text-gray-900" id="unassigned-assets">0</p>
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
              <p class="text-lg font-semibold text-gray-900" id="last-sync">Never</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Asset Filters -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-64">
            <input 
              type="text" 
              id="asset-search" 
              placeholder="Search assets..." 
              class="form-input"
              onkeyup="filterAssets()"
            />
          </div>
          <select id="asset-type-filter" class="form-select" onchange="filterAssets()">
            <option value="">All Types</option>
            <option value="server">Server</option>
            <option value="workstation">Workstation</option>
            <option value="mobile">Mobile</option>
            <option value="network_device">Network Device</option>
            <option value="iot">IoT Device</option>
          </select>
          <select id="asset-risk-filter" class="form-select" onchange="filterAssets()">
            <option value="">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
            <option value="critical">Critical Risk</option>
          </select>
          <select id="asset-service-filter" class="form-select" onchange="filterAssets()">
            <option value="">All Services</option>
          </select>
        </div>
      </div>
      
      <!-- Assets Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody id="assets-table-body" class="bg-white divide-y divide-gray-200">
              <!-- Asset rows will be populated here -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  // Load assets data
  await loadAssets();
  await loadAssetsDropdowns();
}

async function loadAssets() {
  try {
    const token = localStorage.getItem('dmt_token');
    const response = await axios.get('/api/assets', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      renderAssetsTable(response.data.data);
      updateAssetsStatistics(response.data.data);
    }
  } catch (error) {
    console.error('Error loading assets:', error);
    showToast('Failed to load assets', 'error');
  }
}

async function loadAssetsDropdowns() {
  const token = localStorage.getItem('dmt_token');
  
  try {
    // Load services for filter dropdown
    const servicesResponse = await axios.get('/api/services', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const serviceFilter = document.getElementById('asset-service-filter');
    if (servicesResponse.data.success && serviceFilter) {
      serviceFilter.innerHTML = '<option value="">All Services</option>' + 
        servicesResponse.data.data.map(service => 
          `<option value="${service.id}">${service.name}</option>`
        ).join('');
    }
  } catch (error) {
    console.error('Error loading assets dropdowns:', error);
  }
}

function renderAssetsTable(assets) {
  const tbody = document.getElementById('assets-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = assets.map(asset => `
    <tr class="table-row">
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <div class="flex-shrink-0 w-8 h-8">
            <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <i class="fas fa-${getAssetIcon(asset.asset_type)} text-gray-600"></i>
            </div>
          </div>
          <div class="ml-4">
            <div class="text-sm font-medium text-gray-900">${asset.name}</div>
            <div class="text-sm text-gray-500">${asset.asset_id}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          ${capitalizeFirst(asset.asset_type.replace('_', ' '))}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${asset.service_name || 'Unassigned'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <div class="flex-shrink-0 w-16 h-2 bg-gray-200 rounded-full mr-2">
            <div class="h-2 rounded-full ${getRiskScoreColor(asset.risk_score)}" style="width: ${Math.min(asset.risk_score * 10, 100)}%"></div>
          </div>
          <span class="text-sm font-medium text-gray-900">${asset.risk_score.toFixed(1)}</span>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getExposureLevelClass(asset.exposure_level)}">
          ${capitalizeFirst(asset.exposure_level)}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${asset.first_name ? `${asset.first_name} ${asset.last_name}` : 'Unassigned'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div class="flex space-x-2">
          <button onclick="viewAsset(${asset.id})" class="text-blue-600 hover:text-blue-900" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
          <button onclick="editAsset(${asset.id})" class="text-indigo-600 hover:text-indigo-900" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteAsset(${asset.id})" class="text-red-600 hover:text-red-900" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function updateAssetsStatistics(assets) {
  const totalAssets = assets.length;
  const highRiskAssets = assets.filter(a => a.risk_score >= 4).length;
  const unassignedAssets = assets.filter(a => !a.service_id).length;
  
  document.getElementById('total-assets').textContent = totalAssets;
  document.getElementById('high-risk-assets').textContent = highRiskAssets;
  document.getElementById('unassigned-assets').textContent = unassignedAssets;
}

function getAssetIcon(assetType) {
  const icons = {
    'server': 'server',
    'workstation': 'desktop',
    'mobile': 'mobile-alt',
    'network_device': 'network-wired',
    'iot': 'microchip',
    'cloud_resource': 'cloud'
  };
  return icons[assetType] || 'server';
}

function getRiskScoreColor(score) {
  if (score >= 7) return 'bg-red-500';
  if (score >= 4) return 'bg-orange-500';
  if (score >= 2) return 'bg-yellow-500';
  return 'bg-green-500';
}

function getExposureLevelClass(level) {
  const classes = {
    'low': 'bg-green-100 text-green-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'high': 'bg-orange-100 text-orange-800',
    'critical': 'bg-red-100 text-red-800'
  };
  return classes[level] || 'bg-gray-100 text-gray-800';
}

// Settings Management Module
async function showSettings() {
  updateActiveNavigation('settings');
  currentModule = 'settings';
  
  const mainContent = document.getElementById('main-content');
  
  mainContent.innerHTML = `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Settings</h2>
          <p class="text-gray-600 mt-1">Configure system settings, integrations, and user management</p>
        </div>
      </div>
      
      <!-- Settings Navigation Tabs -->
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8">
          <button onclick="showSettingsTab('users')" id="settings-tab-users" class="settings-tab active">
            <i class="fas fa-users mr-2"></i>User Management
          </button>
          <button onclick="showSettingsTab('microsoft')" id="settings-tab-microsoft" class="settings-tab">
            <i class="fab fa-microsoft mr-2"></i>Microsoft Integration
          </button>
          <button onclick="showSettingsTab('saml')" id="settings-tab-saml" class="settings-tab">
            <i class="fas fa-key mr-2"></i>SAML Authentication
          </button>
          <button onclick="showSettingsTab('system')" id="settings-tab-system" class="settings-tab">
            <i class="fas fa-cog mr-2"></i>System Settings
          </button>
        </nav>
      </div>
      
      <!-- Settings Content -->
      <div id="settings-content">
        <!-- Content will be loaded based on selected tab -->
      </div>
    </div>
  `;
  
  // Show default tab (users)
  showSettingsTab('users');
}

function showSettingsTab(tab) {
  // Update active tab
  document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(`settings-tab-${tab}`).classList.add('active');
  
  const content = document.getElementById('settings-content');
  
  switch(tab) {
    case 'users':
      showUsersSettings();
      break;
    case 'microsoft':
      showMicrosoftSettings();
      break;
    case 'saml':
      showSAMLSettings();
      break;
    case 'system':
      showSystemSettings();
      break;
  }
}

async function showUsersSettings() {
  const content = document.getElementById('settings-content');
  
  content.innerHTML = `
    <div class="space-y-6">
      <!-- User Management Header -->
      <div class="flex justify-between items-center">
        <div>
          <h3 class="text-lg font-medium text-gray-900">User Management</h3>
          <p class="text-gray-600 mt-1">Manage system users, roles, and permissions</p>
        </div>
        <div class="flex space-x-3">
          <button onclick="showImportUsersModal()" class="btn-secondary">
            <i class="fas fa-upload mr-2"></i>Import
          </button>
          <button onclick="exportUsers()" class="btn-secondary">
            <i class="fas fa-download mr-2"></i>Export
          </button>
          <button onclick="showAddUserModal()" class="btn-primary">
            <i class="fas fa-plus mr-2"></i>Add User
          </button>
        </div>
      </div>
      
      <!-- User Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-users text-blue-600"></i>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Total Users</p>
              <p class="text-lg font-semibold text-gray-900" id="total-users">0</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-user-check text-green-600"></i>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Active Users</p>
              <p class="text-lg font-semibold text-gray-900" id="active-users">0</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-user-shield text-purple-600"></i>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Administrators</p>
              <p class="text-lg font-semibold text-gray-900" id="admin-users">0</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-key text-yellow-600"></i>
              </div>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">SAML Users</p>
              <p class="text-lg font-semibold text-gray-900" id="saml-users">0</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Users Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Auth Provider</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody id="users-table-body" class="bg-white divide-y divide-gray-200">
              <!-- User rows will be populated here -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  // Load users data (reuse existing showUsers functionality)
  await loadUsers();
}

async function showMicrosoftSettings() {
  const content = document.getElementById('settings-content');
  
  content.innerHTML = `
    <div class="space-y-6">
      <!-- Microsoft Integration Header -->
      <div>
        <h3 class="text-lg font-medium text-gray-900">Microsoft Integration</h3>
        <p class="text-gray-600 mt-1">Configure Microsoft Entra ID and Defender integration</p>
      </div>
      
      <!-- Microsoft Entra ID Configuration -->
      <div class="bg-white rounded-lg shadow p-6">
        <h4 class="text-md font-medium text-gray-900 mb-4">Microsoft Entra ID Configuration</h4>
        <form id="microsoft-config-form" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Tenant ID</label>
              <input type="text" id="tenant-id" class="form-input" placeholder="00000000-0000-0000-0000-000000000000">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Client ID</label>
              <input type="text" id="client-id" class="form-input" placeholder="Application (client) ID">
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Client Secret</label>
            <input type="password" id="client-secret" class="form-input" placeholder="Enter client secret">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Redirect URI</label>
            <input type="text" id="redirect-uri" class="form-input" placeholder="https://your-app.pages.dev/auth/callback">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">Required Scopes</label>
            <div class="mt-2 space-y-2">
              <label class="flex items-center">
                <input type="checkbox" class="form-checkbox h-4 w-4 text-blue-600" checked disabled>
                <span class="ml-2 text-sm text-gray-700">SecurityEvents.Read.All</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" class="form-checkbox h-4 w-4 text-blue-600" checked disabled>
                <span class="ml-2 text-sm text-gray-700">Device.Read.All</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" class="form-checkbox h-4 w-4 text-blue-600" checked disabled>
                <span class="ml-2 text-sm text-gray-700">SecurityIncidents.Read.All</span>
              </label>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="flex items-center">
                <input type="checkbox" id="sync-enabled" class="form-checkbox h-4 w-4 text-blue-600">
                <span class="ml-2 text-sm text-gray-700">Enable automatic sync</span>
              </label>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Sync Frequency (seconds)</label>
              <input type="number" id="sync-frequency" class="form-input" value="3600" min="300">
            </div>
          </div>
          
          <div class="flex justify-end space-x-3">
            <button type="button" onclick="testMicrosoftConnection()" class="btn-secondary">
              <i class="fas fa-plug mr-2"></i>Test Connection
            </button>
            <button type="submit" class="btn-primary">
              <i class="fas fa-save mr-2"></i>Save Configuration
            </button>
          </div>
        </form>
      </div>
      
      <!-- Sync Status -->
      <div class="bg-white rounded-lg shadow p-6">
        <h4 class="text-md font-medium text-gray-900 mb-4">Sync Status</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="text-center">
            <div class="text-2xl font-bold text-blue-600" id="synced-assets">0</div>
            <div class="text-sm text-gray-500">Assets Synced</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-orange-600" id="synced-incidents">0</div>
            <div class="text-sm text-gray-500">Incidents Synced</div>
          </div>
          <div class="text-center">
            <div class="text-2xl font-bold text-green-600" id="last-sync-time">Never</div>
            <div class="text-sm text-gray-500">Last Sync</div>
          </div>
        </div>
        <div class="mt-4 flex space-x-3">
          <button onclick="syncMicrosoftAssets()" class="btn-secondary">
            <i class="fas fa-sync-alt mr-2"></i>Sync Assets Now
          </button>
          <button onclick="syncMicrosoftIncidents()" class="btn-secondary">
            <i class="fas fa-sync-alt mr-2"></i>Sync Incidents Now
          </button>
          <button onclick="syncMicrosoftVulnerabilities()" class="btn-secondary">
            <i class="fas fa-shield-alt mr-2"></i>Sync Vulnerabilities Now
          </button>
        </div>
      </div>
    </div>
  `;
  
  // Load current Microsoft configuration
  await loadMicrosoftConfig();
}

async function showSAMLSettings() {
  const content = document.getElementById('settings-content');
  
  content.innerHTML = `
    <div class="space-y-6">
      <!-- SAML Configuration Header -->
      <div>
        <h3 class="text-lg font-medium text-gray-900">SAML Authentication</h3>
        <p class="text-gray-600 mt-1">Configure SAML SSO with Microsoft Entra ID</p>
      </div>
      
      <!-- SAML Configuration Form -->
      <div class="bg-white rounded-lg shadow p-6">
        <h4 class="text-md font-medium text-gray-900 mb-4">SAML Configuration</h4>
        <form id="saml-config-form" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Entity ID (SP)</label>
            <input type="text" id="saml-entity-id" class="form-input" placeholder="https://your-app.pages.dev">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">SSO URL (IdP)</label>
            <input type="text" id="saml-sso-url" class="form-input" placeholder="https://login.microsoftonline.com/tenant-id/saml2">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700">X.509 Certificate</label>
            <textarea id="saml-certificate" class="form-input" rows="6" placeholder="-----BEGIN CERTIFICATE-----"></textarea>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Name ID Format</label>
              <select id="saml-name-id-format" class="form-select">
                <option value="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">Email Address</option>
                <option value="urn:oasis:names:tc:SAML:2.0:nameid-format:persistent">Persistent</option>
                <option value="urn:oasis:names:tc:SAML:2.0:nameid-format:transient">Transient</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Binding Type</label>
              <select id="saml-binding-type" class="form-select">
                <option value="HTTP-POST">HTTP-POST</option>
                <option value="HTTP-Redirect">HTTP-Redirect</option>
              </select>
            </div>
          </div>
          
          <div>
            <label class="flex items-center">
              <input type="checkbox" id="saml-enabled" class="form-checkbox h-4 w-4 text-blue-600">
              <span class="ml-2 text-sm text-gray-700">Enable SAML Authentication</span>
            </label>
          </div>
          
          <div class="flex justify-end space-x-3">
            <button type="button" onclick="downloadSAMLMetadata()" class="btn-secondary">
              <i class="fas fa-download mr-2"></i>Download SP Metadata
            </button>
            <button type="submit" class="btn-primary">
              <i class="fas fa-save mr-2"></i>Save Configuration
            </button>
          </div>
        </form>
      </div>
      
      <!-- Attribute Mapping -->
      <div class="bg-white rounded-lg shadow p-6">
        <h4 class="text-md font-medium text-gray-900 mb-4">Attribute Mapping</h4>
        <div class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Email Attribute</label>
              <input type="text" class="form-input" value="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress" readonly>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">First Name Attribute</label>
              <input type="text" class="form-input" value="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname" readonly>
            </div>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700">Last Name Attribute</label>
              <input type="text" class="form-input" value="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname" readonly>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">Role Attribute</label>
              <input type="text" class="form-input" value="http://schemas.microsoft.com/ws/2008/06/identity/claims/role" readonly>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Load current SAML configuration
  await loadSAMLConfig();
}

// Microsoft Integration Functions
async function syncMicrosoftAssets() {
  try {
    const token = localStorage.getItem('dmt_token');
    const response = await axios.post('/api/microsoft/sync-assets', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast('Microsoft Defender asset sync initiated', 'success');
      setTimeout(() => loadAssets(), 2000); // Refresh after 2 seconds
    }
  } catch (error) {
    showToast('Failed to sync assets from Microsoft Defender', 'error');
  }
}

async function syncMicrosoftIncidents() {
  try {
    const token = localStorage.getItem('dmt_token');
    const response = await axios.post('/api/microsoft/sync-incidents', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast('Microsoft Defender incident sync initiated', 'success');
    }
  } catch (error) {
    showToast('Failed to sync incidents from Microsoft Defender', 'error');
  }
}

async function syncMicrosoftVulnerabilities() {
  try {
    const token = localStorage.getItem('dmt_token');
    
    showToast('Syncing vulnerabilities from Microsoft Defender...', 'info');
    
    const response = await axios.post('/api/microsoft/sync-vulnerabilities', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast(`${response.data.message}`, 'success');
      
      // Refresh assets if we're on the assets page to show updated risk scores
      if (currentModule === 'assets') {
        setTimeout(() => loadAssets(), 2000);
      }
    } else {
      showToast('Failed to sync vulnerabilities: ' + (response.data.error || 'Unknown error'), 'error');
    }
  } catch (error) {
    console.error('Error syncing vulnerabilities:', error);
    const errorMessage = error.response?.data?.error || 'Failed to sync vulnerabilities from Microsoft Defender';
    showToast(errorMessage, 'error');
  }
}

// Asset Management Functions
function showAddAssetModal() {
  const modalHTML = `
    <div id="add-asset-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style="display: block;">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <!-- Modal Header -->
          <div class="flex justify-between items-center pb-4 border-b">
            <h3 class="text-lg font-medium text-gray-900">Add New Asset</h3>
            <button onclick="closeAddAssetModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <!-- Modal Body -->
          <form id="add-asset-form" class="mt-6 space-y-6">
            <!-- Basic Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Asset Name *</label>
                <input type="text" id="asset-name" name="name" required class="form-input" placeholder="e.g., WEB-SERVER-01">
                <div class="text-xs text-gray-500 mt-1">Unique identifier for the asset</div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Asset ID</label>
                <input type="text" id="asset-id" name="asset_id" class="form-input" placeholder="Auto-generated if empty">
                <div class="text-xs text-gray-500 mt-1">Leave empty for auto-generation</div>
              </div>
            </div>

            <!-- Asset Type and OS -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Asset Type *</label>
                <select id="asset-type" name="asset_type" required class="form-select">
                  <option value="">Select asset type</option>
                  <option value="server">Server</option>
                  <option value="workstation">Workstation</option>
                  <option value="mobile">Mobile Device</option>
                  <option value="network_device">Network Device</option>
                  <option value="iot">IoT Device</option>
                  <option value="cloud_resource">Cloud Resource</option>
                  <option value="database">Database</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Operating System</label>
                <select id="operating-system" name="operating_system" class="form-select">
                  <option value="">Select OS</option>
                  <option value="Windows Server 2022">Windows Server 2022</option>
                  <option value="Windows Server 2019">Windows Server 2019</option>
                  <option value="Windows 11">Windows 11</option>
                  <option value="Windows 10">Windows 10</option>
                  <option value="Ubuntu 22.04">Ubuntu 22.04</option>
                  <option value="Ubuntu 20.04">Ubuntu 20.04</option>
                  <option value="CentOS 8">CentOS 8</option>
                  <option value="RHEL 9">Red Hat Enterprise Linux 9</option>
                  <option value="macOS">macOS</option>
                  <option value="iOS">iOS</option>
                  <option value="Android">Android</option>
                </select>
              </div>
            </div>

            <!-- Network Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">IP Address</label>
                <input type="text" id="ip-address" name="ip_address" class="form-input" placeholder="192.168.1.100" pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$">
                <div class="text-xs text-gray-500 mt-1">IPv4 address format</div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">MAC Address</label>
                <input type="text" id="mac-address" name="mac_address" class="form-input" placeholder="00:1A:2B:3C:4D:5E" pattern="^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$">
                <div class="text-xs text-gray-500 mt-1">MAC address format</div>
              </div>
            </div>

            <!-- Risk Assessment -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Initial Risk Score</label>
                <input type="range" id="risk-score" name="risk_score" min="0" max="10" step="0.1" value="5" class="w-full" oninput="updateRiskScoreDisplay(this.value)">
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low (0)</span>
                  <span id="risk-score-display" class="font-medium">5.0</span>
                  <span>Critical (10)</span>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Exposure Level</label>
                <select id="exposure-level" name="exposure_level" class="form-select">
                  <option value="low">Low - Internal network only</option>
                  <option value="medium" selected>Medium - Limited external access</option>
                  <option value="high">High - Internet accessible</option>
                  <option value="critical">Critical - Public facing</option>
                </select>
              </div>
            </div>

            <!-- Organization Assignment -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Organization *</label>
                <select id="organization-id" name="organization_id" required class="form-select">
                  <option value="">Select organization</option>
                  <!-- Options will be populated dynamically -->
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Service</label>
                <select id="service-id" name="service_id" class="form-select">
                  <option value="">Select service (optional)</option>
                  <!-- Options will be populated dynamically -->
                </select>
              </div>
            </div>

            <!-- Asset Owner -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Asset Owner</label>
              <select id="owner-id" name="owner_id" class="form-select">
                <option value="">Auto-assign to current user</option>
                <!-- Options will be populated dynamically -->
              </select>
            </div>

            <!-- Device Tags -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Device Tags</label>
              <input type="text" id="device-tags" name="device_tags" class="form-input" placeholder="web-server, production, critical">
              <div class="text-xs text-gray-500 mt-1">Comma-separated tags for categorization</div>
            </div>

            <!-- Modal Footer -->
            <div class="flex justify-end space-x-3 pt-6 border-t">
              <button type="button" onclick="closeAddAssetModal()" class="btn-secondary">
                <i class="fas fa-times mr-2"></i>Cancel
              </button>
              <button type="submit" class="btn-primary">
                <i class="fas fa-plus mr-2"></i>Add Asset
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  // Insert modal into DOM
  document.body.insertAdjacentHTML('beforeend', modalHTML);

  // Load dropdown data and setup form handlers
  loadAssetModalDropdowns();
  setupAssetFormHandlers();
}

function closeAddAssetModal() {
  const modal = document.getElementById('add-asset-modal');
  if (modal) {
    modal.remove();
  }
}

function updateRiskScoreDisplay(value) {
  const display = document.getElementById('risk-score-display');
  if (display) {
    display.textContent = parseFloat(value).toFixed(1);
  }
}

async function loadAssetModalDropdowns() {
  const token = localStorage.getItem('dmt_token');
  
  try {
    // Load organizations
    const orgsResponse = await axios.get('/api/organizations', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const orgSelect = document.getElementById('organization-id');
    if (orgsResponse.data.success && orgSelect) {
      orgSelect.innerHTML = '<option value="">Select organization</option>' + 
        orgsResponse.data.data.map(org => 
          `<option value="${org.id}">${org.name}</option>`
        ).join('');
    }

    // Load services
    const servicesResponse = await axios.get('/api/services', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const serviceSelect = document.getElementById('service-id');
    if (servicesResponse.data.success && serviceSelect) {
      serviceSelect.innerHTML = '<option value="">Select service (optional)</option>' + 
        servicesResponse.data.data.map(service => 
          `<option value="${service.id}">${service.name}</option>`
        ).join('');
    }

    // Load users
    const usersResponse = await axios.get('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const ownerSelect = document.getElementById('owner-id');
    if (usersResponse.data.success && ownerSelect) {
      ownerSelect.innerHTML = '<option value="">Auto-assign to current user</option>' + 
        usersResponse.data.data.map(user => 
          `<option value="${user.id}">${user.first_name} ${user.last_name} (${user.email})</option>`
        ).join('');
    }

  } catch (error) {
    console.error('Error loading dropdown data:', error);
    showToast('Failed to load form data', 'error');
  }
}

function setupAssetFormHandlers() {
  const form = document.getElementById('add-asset-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(form);
    const assetData = {
      name: formData.get('name'),
      asset_id: formData.get('asset_id') || generateAssetId(),
      asset_type: formData.get('asset_type'),
      operating_system: formData.get('operating_system') || null,
      ip_address: formData.get('ip_address') || null,
      mac_address: formData.get('mac_address') || null,
      risk_score: parseFloat(formData.get('risk_score')) || 0,
      exposure_level: formData.get('exposure_level'),
      organization_id: parseInt(formData.get('organization_id')),
      service_id: formData.get('service_id') ? parseInt(formData.get('service_id')) : null,
      owner_id: formData.get('owner_id') ? parseInt(formData.get('owner_id')) : null,
      device_tags: formData.get('device_tags') ? formData.get('device_tags').split(',').map(tag => tag.trim()) : []
    };

    // Validation
    if (!assetData.name || !assetData.asset_type || !assetData.organization_id) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('dmt_token');
      const response = await axios.post('/api/assets', assetData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        showToast(`Asset "${assetData.name}" created successfully`, 'success');
        closeAddAssetModal();
        
        // Refresh assets table if we're on the assets page
        if (currentModule === 'assets') {
          await loadAssets();
        }
      } else {
        showToast('Failed to create asset: ' + (response.data.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error creating asset:', error);
      const errorMessage = error.response?.data?.error || 'Failed to create asset';
      showToast(errorMessage, 'error');
    }
  });

  // Auto-generate asset ID based on name and type
  const nameInput = document.getElementById('asset-name');
  const typeInput = document.getElementById('asset-type');
  const idInput = document.getElementById('asset-id');

  if (nameInput && typeInput && idInput) {
    const updateAssetId = () => {
      if (!idInput.value && nameInput.value && typeInput.value) {
        const prefix = typeInput.value.toUpperCase().substring(0, 3);
        const name = nameInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8);
        const timestamp = Date.now().toString().slice(-4);
        idInput.value = `${prefix}-${name}-${timestamp}`;
      }
    };

    nameInput.addEventListener('blur', updateAssetId);
    typeInput.addEventListener('change', updateAssetId);
  }
}

function generateAssetId() {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `AST-${timestamp.slice(-6)}-${random}`;
}

function viewAsset(id) {
  showToast(`View Asset ${id} - Implementation in progress`, 'info');
}

function editAsset(id) {
  showToast(`Edit Asset ${id} - Implementation in progress`, 'info');
}

function deleteAsset(id) {
  showToast(`Delete Asset ${id} - Implementation in progress`, 'info');
}

function showImportAssetsModal() {
  showToast('Import Assets modal - Implementation in progress', 'info');
}

function exportAssets() {
  showToast('Export Assets - Implementation in progress', 'info');
}

function filterAssets() {
  showToast('Filter Assets - Implementation in progress', 'info');
}

// Settings utility functions
async function loadMicrosoftConfig() {
  // Implementation for loading Microsoft configuration
  showToast('Loading Microsoft configuration...', 'info');
}

async function loadSAMLConfig() {
  // Implementation for loading SAML configuration
  showToast('Loading SAML configuration...', 'info');
}

function testMicrosoftConnection() {
  showToast('Testing Microsoft connection...', 'info');
}

function downloadSAMLMetadata() {
  showToast('Downloading SAML metadata...', 'info');
}

function showSystemSettings() {
  const content = document.getElementById('settings-content');
  content.innerHTML = `
    <div class="text-center py-12">
      <i class="fas fa-cog text-6xl text-gray-400 mb-4"></i>
      <h3 class="text-lg font-medium text-gray-900 mb-2">System Settings</h3>
      <p class="text-gray-600">System configuration options coming soon</p>
    </div>
  `;
}

// Make functions globally accessible
window.showAssets = showAssets;
window.showSettings = showSettings;
window.showSettingsTab = showSettingsTab;
window.syncMicrosoftAssets = syncMicrosoftAssets;
window.syncMicrosoftIncidents = syncMicrosoftIncidents;
window.syncMicrosoftVulnerabilities = syncMicrosoftVulnerabilities;
window.showAddAssetModal = showAddAssetModal;
window.closeAddAssetModal = closeAddAssetModal;
window.updateRiskScoreDisplay = updateRiskScoreDisplay;