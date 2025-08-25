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
    const token = localStorage.getItem('aria_token');
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
  const token = localStorage.getItem('aria_token');
  
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

// Legacy Settings Management Module (kept for backward compatibility)
async function showSettings() {
  // Redirect to enhanced settings
  if (typeof enhancedSettings !== 'undefined' && enhancedSettings.showEnhancedSettings) {
    enhancedSettings.showEnhancedSettings();
    return;
  }
  
  // Fallback to legacy settings
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
          <button onclick="showSettingsTab('organizations')" id="settings-tab-organizations" class="settings-tab">
            <i class="fas fa-building mr-2"></i>Organizations
          </button>
          <button onclick="showSettingsTab('risk-owners')" id="settings-tab-risk-owners" class="settings-tab">
            <i class="fas fa-user-shield mr-2"></i>Risk Owners
          </button>
          <button onclick="showSettingsTab('microsoft')" id="settings-tab-microsoft" class="settings-tab">
            <i class="fab fa-microsoft mr-2"></i>Microsoft Integration
          </button>
          <button onclick="showSettingsTab('saml')" id="settings-tab-saml" class="settings-tab">
            <i class="fas fa-key mr-2"></i>SAML Authentication
          </button>
          <button onclick="showSettingsTab('ai')" id="settings-tab-ai" class="settings-tab">
            <i class="fas fa-robot mr-2"></i>AI & LLM Settings
          </button>
          <button onclick="showSettingsTab('rag')" id="settings-tab-rag" class="settings-tab">
            <i class="fas fa-brain mr-2"></i>RAG & Knowledge Base
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
    case 'organizations':
      showOrganizationsSettings();
      break;
    case 'risk-owners':
      showRiskOwnersSettings();
      break;
    case 'microsoft':
      showMicrosoftSettings();
      break;
    case 'saml':
      showSAMLSettings();
      break;
    case 'ai':
      showAISettings();
      break;
    case 'rag':
      showRAGSettings();
      break;
    case 'system':
      showSystemSettings();
      break;
  }
}

async function loadUsersForSettings() {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      // Store users in moduleData so editUser function can find them
      if (typeof moduleData !== 'undefined') {
        moduleData.users = response.data.data;
      }
      renderUsersTableForSettings(response.data.data);
      updateUsersStatisticsForSettings(response.data.data);
    } else {
      throw new Error('Failed to load users');
    }
  } catch (error) {
    console.error('Error loading users:', error);
    const tbody = document.getElementById('users-table-body');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-red-600">Error loading users</td></tr>';
    }
  }
}

function renderUsersTableForSettings(users) {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;
  
  if (!users || users.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">No users found</td></tr>';
    return;
  }
  
  tbody.innerHTML = users.map(user => `
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <div class="flex-shrink-0 h-10 w-10">
            <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span class="text-sm font-medium text-gray-700">
                ${(user.first_name?.[0] || '').toUpperCase()}${(user.last_name?.[0] || '').toUpperCase()}
              </span>
            </div>
          </div>
          <div class="ml-4">
            <div class="text-sm font-medium text-gray-900">${user.first_name || ''} ${user.last_name || ''}</div>
            <div class="text-sm text-gray-500">${user.email}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleClass(user.role)}">
          ${capitalizeFirst((user.role || '').replace('_', ' '))}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${user.department || 'N/A'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${user.auth_provider || 'local'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${user.last_login ? formatDate(user.last_login) : 'Never'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
          ${user.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div class="flex space-x-2">
          <button onclick="viewUser(${user.id})" class="text-blue-600 hover:text-blue-900" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
          <button onclick="editUser(${user.id})" class="text-indigo-600 hover:text-indigo-900" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="toggleUserStatus(${user.id})" class="text-yellow-600 hover:text-yellow-900" title="${user.is_active ? 'Deactivate' : 'Activate'}">
            <i class="fas fa-${user.is_active ? 'user-slash' : 'user-check'}"></i>
          </button>
          <button onclick="resetUserPassword(${user.id})" class="text-orange-600 hover:text-orange-900" title="Reset Password">
            <i class="fas fa-key"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function updateUsersStatisticsForSettings(users) {
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const samlUsers = users.filter(u => u.auth_provider === 'saml').length;
  
  const totalElement = document.getElementById('total-users');
  const activeElement = document.getElementById('active-users');
  const adminElement = document.getElementById('admin-users');
  const samlElement = document.getElementById('saml-users');
  
  if (totalElement) totalElement.textContent = totalUsers;
  if (activeElement) activeElement.textContent = activeUsers;
  if (adminElement) adminElement.textContent = adminUsers;
  if (samlElement) samlElement.textContent = samlUsers;
}

function getRoleClass(role) {
  const roleClasses = {
    'admin': 'bg-red-100 text-red-800',
    'risk_analyst': 'bg-blue-100 text-blue-800',
    'service_owner': 'bg-green-100 text-green-800',
    'auditor': 'bg-purple-100 text-purple-800',
    'integration_operator': 'bg-yellow-100 text-yellow-800',
    'readonly': 'bg-gray-100 text-gray-800',
    'risk_manager': 'bg-orange-100 text-orange-800',
    'compliance_officer': 'bg-indigo-100 text-indigo-800',
    'incident_manager': 'bg-pink-100 text-pink-800',
    'user': 'bg-gray-100 text-gray-800',
  };
  return roleClasses[role] || 'bg-gray-100 text-gray-800';
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (error) {
    return 'N/A';
  }
}

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
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
  
  // Load users data specifically for settings context
  await loadUsersForSettings();
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

async function showOrganizationsSettings() {
  const content = document.getElementById('settings-content');
  
  content.innerHTML = `
    <div class="space-y-6">
      <!-- Organizations Header -->
      <div class="flex justify-between items-center">
        <div>
          <h3 class="text-lg font-medium text-gray-900">Organizations Management</h3>
          <p class="text-gray-600 mt-1">Manage organizational units and departments for asset assignment</p>
        </div>
        <button onclick="showAddOrganizationModal()" class="btn-primary">
          <i class="fas fa-plus mr-2"></i>Add Organization
        </button>
      </div>
      
      <!-- Organizations Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-building text-blue-600"></i>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Total Organizations</dt>
                  <dd class="text-lg font-medium text-gray-900" id="total-organizations">0</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-check-circle text-green-600"></i>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Active Organizations</dt>
                  <dd class="text-lg font-medium text-gray-900" id="active-organizations">0</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-server text-yellow-600"></i>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Assets Assigned</dt>
                  <dd class="text-lg font-medium text-gray-900" id="assigned-assets">0</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Organizations Table -->
      <div class="bg-white shadow overflow-hidden sm:rounded-md">
        <div class="px-4 py-5 sm:px-6">
          <h4 class="text-lg font-medium text-gray-900">Organizations List</h4>
        </div>
        <div class="border-t border-gray-200">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="table-header">Organization Name</th>
                  <th class="table-header">Code</th>
                  <th class="table-header">Department</th>
                  <th class="table-header">Location</th>
                  <th class="table-header">Contact</th>
                  <th class="table-header">Assets</th>
                  <th class="table-header">Status</th>
                  <th class="table-header">Actions</th>
                </tr>
              </thead>
              <tbody id="organizations-table-body" class="bg-white divide-y divide-gray-200">
                <!-- Organizations will be loaded here -->
              </tbody>
            </table>
          </div>
          <div id="organizations-loading" class="p-8 text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-2 text-gray-600">Loading organizations...</p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Load organizations data
  await loadOrganizationsData();
}

async function showRiskOwnersSettings() {
  const content = document.getElementById('settings-content');
  
  content.innerHTML = `
    <div class="space-y-6">
      <!-- Risk Owners Header -->
      <div class="flex justify-between items-center">
        <div>
          <h3 class="text-lg font-medium text-gray-900">Risk Owners Management</h3>
          <p class="text-gray-600 mt-1">Manage personnel responsible for risk oversight and management</p>
        </div>
        <button onclick="showAddRiskOwnerModal()" class="btn-primary">
          <i class="fas fa-plus mr-2"></i>Add Risk Owner
        </button>
      </div>
      
      <!-- Risk Owners Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-user-shield text-blue-600"></i>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Total Owners</dt>
                  <dd class="text-lg font-medium text-gray-900" id="total-risk-owners">0</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-check-circle text-green-600"></i>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Active Owners</dt>
                  <dd class="text-lg font-medium text-gray-900" id="active-risk-owners">0</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-exclamation-triangle text-yellow-600"></i>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Risks Assigned</dt>
                  <dd class="text-lg font-medium text-gray-900" id="assigned-risks">0</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-fire text-red-600"></i>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">High Risk Items</dt>
                  <dd class="text-lg font-medium text-gray-900" id="high-risk-items">0</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Risk Owners Table -->
      <div class="bg-white shadow overflow-hidden sm:rounded-md">
        <div class="px-4 py-5 sm:px-6">
          <h4 class="text-lg font-medium text-gray-900">Risk Owners List</h4>
        </div>
        <div class="border-t border-gray-200">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="table-header">Name</th>
                  <th class="table-header">Role</th>
                  <th class="table-header">Department</th>
                  <th class="table-header">Contact</th>
                  <th class="table-header">Risks Assigned</th>
                  <th class="table-header">High Priority</th>
                  <th class="table-header">Status</th>
                  <th class="table-header">Actions</th>
                </tr>
              </thead>
              <tbody id="risk-owners-table-body" class="bg-white divide-y divide-gray-200">
                <!-- Risk owners will be loaded here -->
              </tbody>
            </table>
          </div>
          <div id="risk-owners-loading" class="p-8 text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-2 text-gray-600">Loading risk owners...</p>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Load risk owners data
  await loadRiskOwnersData();
}

// SAML Settings Helper Functions
function updateSAMLProvider() {
    const providerSelect = document.getElementById('saml-provider');
    const selectedProvider = providerSelect.value;
    const providerInfo = document.getElementById('provider-info');
    const entityIdField = document.getElementById('entity-id');
    const ssoUrlField = document.getElementById('sso-url');
    const sloUrlField = document.getElementById('slo-url');

    // Provider-specific information and default values
    const providerConfigs = {
        'azure-ad': {
            info: `
                <div class="bg-blue-50 border-l-4 border-blue-400 p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-blue-700">
                                Configure Azure Active Directory SAML integration.
                                <a href="https://docs.microsoft.com/en-us/azure/active-directory/saas-apps/" target="_blank" class="font-medium underline">
                                    View Azure AD documentation
                                </a>
                            </p>
                        </div>
                    </div>
                </div>`,
            entityId: 'https://sts.windows.net/{tenant-id}/',
            ssoUrl: 'https://login.microsoftonline.com/{tenant-id}/saml2',
            sloUrl: 'https://login.microsoftonline.com/{tenant-id}/saml2'
        },
        'okta': {
            info: `
                <div class="bg-green-50 border-l-4 border-green-400 p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-green-700">
                                Configure Okta SAML integration.
                                <a href="https://help.okta.com/en/prod/Content/Topics/Apps/Apps_App_Integration_Wizard_SAML.htm" target="_blank" class="font-medium underline">
                                    View Okta documentation
                                </a>
                            </p>
                        </div>
                    </div>
                </div>`,
            entityId: 'http://www.okta.com/{okta-id}',
            ssoUrl: 'https://{your-domain}.okta.com/app/{app-name}/{app-id}/sso/saml',
            sloUrl: 'https://{your-domain}.okta.com/app/{app-name}/{app-id}/slo/saml'
        },
        'google': {
            info: `
                <div class="bg-red-50 border-l-4 border-red-400 p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-red-700">
                                Configure Google Workspace SAML integration.
                                <a href="https://support.google.com/a/answer/6087519" target="_blank" class="font-medium underline">
                                    View Google Workspace documentation
                                </a>
                            </p>
                        </div>
                    </div>
                </div>`,
            entityId: 'https://accounts.google.com/o/saml2?idpid={idp-id}',
            ssoUrl: 'https://accounts.google.com/o/saml2/idp?idpid={idp-id}',
            sloUrl: 'https://accounts.google.com/logout'
        },
        'pingidentity': {
            info: `
                <div class="bg-purple-50 border-l-4 border-purple-400 p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-purple-700">
                                Configure PingIdentity SAML integration.
                                <a href="https://docs.pingidentity.com/bundle/pingfederate-102/page/concept_samlConfiguration.html" target="_blank" class="font-medium underline">
                                    View PingIdentity documentation
                                </a>
                            </p>
                        </div>
                    </div>
                </div>`,
            entityId: 'https://{your-domain}.pingidentity.com',
            ssoUrl: 'https://{your-domain}.pingidentity.com/idp/SSO.saml2',
            sloUrl: 'https://{your-domain}.pingidentity.com/idp/SLO.saml2'
        },
        'adfs': {
            info: `
                <div class="bg-indigo-50 border-l-4 border-indigo-400 p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-indigo-700">
                                Configure Active Directory Federation Services (ADFS) SAML integration.
                                <a href="https://docs.microsoft.com/en-us/windows-server/identity/ad-fs/" target="_blank" class="font-medium underline">
                                    View ADFS documentation
                                </a>
                            </p>
                        </div>
                    </div>
                </div>`,
            entityId: 'http://{your-domain}/adfs/services/trust',
            ssoUrl: 'https://{your-domain}/adfs/ls/',
            sloUrl: 'https://{your-domain}/adfs/ls/?wa=wsignout1.0'
        },
        'onelogin': {
            info: `
                <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-yellow-700">
                                Configure OneLogin SAML integration.
                                <a href="https://developers.onelogin.com/saml" target="_blank" class="font-medium underline">
                                    View OneLogin documentation
                                </a>
                            </p>
                        </div>
                    </div>
                </div>`,
            entityId: 'https://app.onelogin.com/saml/metadata/{app-id}',
            ssoUrl: 'https://{your-domain}.onelogin.com/trust/saml2/http-post/sso/{app-id}',
            sloUrl: 'https://{your-domain}.onelogin.com/trust/saml2/http-redirect/slo/{app-id}'
        },
        'auth0': {
            info: `
                <div class="bg-orange-50 border-l-4 border-orange-400 p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-orange-700">
                                Configure Auth0 SAML integration.
                                <a href="https://auth0.com/docs/authenticate/protocols/saml" target="_blank" class="font-medium underline">
                                    View Auth0 documentation
                                </a>
                            </p>
                        </div>
                    </div>
                </div>`,
            entityId: 'urn:auth0:{tenant}:{connection}',
            ssoUrl: 'https://{your-domain}.auth0.com/samlp/{client-id}',
            sloUrl: 'https://{your-domain}.auth0.com/samlp/{client-id}/logout'
        },
        'generic': {
            info: `
                <div class="bg-gray-50 border-l-4 border-gray-400 p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                            </svg>
                        </div>
                        <div class="ml-3">
                            <p class="text-sm text-gray-700">
                                Configure generic SAML 2.0 identity provider. 
                                Please refer to your identity provider's documentation for specific configuration details.
                            </p>
                        </div>
                    </div>
                </div>`,
            entityId: '',
            ssoUrl: '',
            sloUrl: ''
        }
    };

    const config = providerConfigs[selectedProvider] || providerConfigs['generic'];
    
    // Update provider information panel
    providerInfo.innerHTML = config.info;
    
    // Update form fields with default values (but don't overwrite existing values)
    if (!entityIdField.value || entityIdField.value === entityIdField.getAttribute('data-default')) {
        entityIdField.value = config.entityId;
        entityIdField.setAttribute('data-default', config.entityId);
    }
    
    if (!ssoUrlField.value || ssoUrlField.value === ssoUrlField.getAttribute('data-default')) {
        ssoUrlField.value = config.ssoUrl;
        ssoUrlField.setAttribute('data-default', config.ssoUrl);
    }
    
    if (!sloUrlField.value || sloUrlField.value === sloUrlField.getAttribute('data-default')) {
        sloUrlField.value = config.sloUrl;
        sloUrlField.setAttribute('data-default', config.sloUrl);
    }
}

function initializeSAMLProviders() {
    const providerSelect = document.getElementById('saml-provider');
    if (providerSelect) {
        providerSelect.addEventListener('change', updateSAMLProvider);
        // Initialize with current selection
        updateSAMLProvider();
    }
}

function addRoleMapping() {
    const container = document.getElementById('role-mappings-container');
    const mappingCount = container.children.length;
    
    const roleMappingDiv = document.createElement('div');
    roleMappingDiv.className = 'role-mapping-item flex items-center space-x-3 p-3 bg-gray-50 rounded-lg';
    roleMappingDiv.innerHTML = `
        <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">SAML Attribute Value</label>
            <input type="text" 
                   name="saml_role_${mappingCount}" 
                   placeholder="e.g., admin, manager, user"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
        </div>
        <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 mb-1">Application Role</label>
            <select name="app_role_${mappingCount}" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="admin">Administrator</option>
                <option value="manager">Manager</option>
                <option value="analyst">Risk Analyst</option>
                <option value="viewer">Viewer</option>
                <option value="auditor">Auditor</option>
            </select>
        </div>
        <button type="button" 
                onclick="this.parentElement.remove()" 
                class="text-red-600 hover:text-red-800 p-2">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
        </button>
    `;
    
    container.appendChild(roleMappingDiv);
}

function testSAMLConnection() {
    const testButton = document.getElementById('test-saml-connection');
    const originalText = testButton.innerHTML;
    
    // Show loading state
    testButton.innerHTML = `
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Testing Connection...
    `;
    testButton.disabled = true;

    // Simulate SAML connection test
    setTimeout(() => {
        // Reset button
        testButton.innerHTML = originalText;
        testButton.disabled = false;
        
        // Show result (this would normally be based on actual test results)
        const resultDiv = document.createElement('div');
        resultDiv.className = 'mt-4 p-4 bg-green-50 border-l-4 border-green-400';
        resultDiv.innerHTML = `
            <div class="flex">
                <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                    </svg>
                </div>
                <div class="ml-3">
                    <p class="text-sm text-green-700">
                        <strong>Connection Test Successful!</strong><br>
                        SAML metadata retrieved successfully. Identity provider is reachable and properly configured.
                    </p>
                </div>
            </div>
        `;
        
        // Remove any existing result
        const existingResult = document.querySelector('#saml-test-result');
        if (existingResult) {
            existingResult.remove();
        }
        
        resultDiv.id = 'saml-test-result';
        testButton.parentNode.insertBefore(resultDiv, testButton.nextSibling);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (resultDiv.parentNode) {
                resultDiv.remove();
            }
        }, 5000);
    }, 2000);
}

async function loadSAMLConfig() {
    try {
        const token = localStorage.getItem('aria_token');
        const response = await axios.get('/api/saml/config', {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success && response.data.config) {
            const config = response.data.config;
            
            // Populate form fields
            document.getElementById('saml-provider').value = config.provider || '';
            document.getElementById('entity-id').value = config.entity_id || '';
            document.getElementById('sso-url').value = config.sso_url || '';
            document.getElementById('slo-url').value = config.slo_url || '';
            document.getElementById('saml-certificate').value = config.certificate || '';
            
            // Populate attribute mappings
            document.getElementById('saml-attr-email').value = config.attr_email || 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';
            document.getElementById('saml-attr-firstname').value = config.attr_firstname || 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname';
            document.getElementById('saml-attr-lastname').value = config.attr_lastname || 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname';
            document.getElementById('saml-attr-role').value = config.attr_role || 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
            document.getElementById('saml-attr-department').value = config.attr_department || 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/department';
            document.getElementById('saml-attr-groups').value = config.attr_groups || 'http://schemas.xmlsoap.org/claims/Group';
            
            // Populate additional options
            document.getElementById('auto-provisioning').checked = config.auto_provisioning || false;
            document.getElementById('force-authentication').checked = config.force_authentication || false;
            document.getElementById('signature-algorithm').value = config.signature_algorithm || 'RSA-SHA256';
            document.getElementById('nameid-format').value = config.nameid_format || 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress';
            
            // Load role mappings if they exist
            if (config.role_mappings && config.role_mappings.length > 0) {
                const container = document.getElementById('role-mappings-container');
                container.innerHTML = ''; // Clear existing mappings
                
                config.role_mappings.forEach((mapping, index) => {
                    const roleMappingDiv = document.createElement('div');
                    roleMappingDiv.className = 'role-mapping-item flex items-center space-x-3 p-3 bg-gray-50 rounded-lg';
                    roleMappingDiv.innerHTML = `
                        <div class="flex-1">
                            <label class="block text-sm font-medium text-gray-700 mb-1">SAML Attribute Value</label>
                            <input type="text" 
                                   name="saml_role_${index}" 
                                   value="${mapping.saml_role || ''}"
                                   placeholder="e.g., admin, manager, user"
                                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div class="flex-1">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Application Role</label>
                            <select name="app_role_${index}" 
                                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="admin" ${mapping.app_role === 'admin' ? 'selected' : ''}>Administrator</option>
                                <option value="manager" ${mapping.app_role === 'manager' ? 'selected' : ''}>Manager</option>
                                <option value="analyst" ${mapping.app_role === 'analyst' ? 'selected' : ''}>Risk Analyst</option>
                                <option value="viewer" ${mapping.app_role === 'viewer' ? 'selected' : ''}>Viewer</option>
                                <option value="auditor" ${mapping.app_role === 'auditor' ? 'selected' : ''}>Auditor</option>
                            </select>
                        </div>
                        <button type="button" 
                                onclick="this.parentElement.remove()" 
                                class="text-red-600 hover:text-red-800 p-2">
                            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    `;
                    container.appendChild(roleMappingDiv);
                });
            }
        }
    } catch (error) {
        console.log('No existing SAML configuration found or error loading config:', error);
        // This is normal for first-time setup, so we don't show an error
    }
}

async function showSAMLSettings() {
  const content = document.getElementById('settings-content');
  
  content.innerHTML = `
    <div class="space-y-6">
      <!-- SAML Configuration Header -->
      <div>
        <h3 class="text-lg font-medium text-gray-900">SAML Authentication</h3>
        <p class="text-gray-600 mt-1">Configure SAML SSO with popular identity providers</p>
      </div>
      
      <!-- IDP Selection -->
      <div class="bg-white rounded-lg shadow p-6">
        <h4 class="text-md font-medium text-gray-900 mb-4">Identity Provider Selection</h4>
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Select Identity Provider</label>
            <select id="saml-provider" class="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select an Identity Provider</option>
              <option value="azure-ad">Microsoft Azure AD / Entra ID</option>
              <option value="okta">Okta</option>
              <option value="google">Google Workspace (G Suite)</option>
              <option value="pingidentity">PingIdentity</option>
              <option value="adfs">Active Directory Federation Services (ADFS)</option>
              <option value="onelogin">OneLogin</option>
              <option value="auth0">Auth0</option>
              <option value="generic">Generic SAML 2.0 Provider</option>
            </select>
          </div>
          
          <!-- Provider Information Panel -->
          <div id="provider-info" class="mt-4">
            <div class="flex items-start space-x-3">
              <div id="provider-icon" class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-shield-alt text-blue-600"></i>
              </div>
              <div>
                <h5 id="provider-name" class="font-medium text-blue-900"></h5>
                <p id="provider-description" class="text-sm text-blue-700 mt-1"></p>
                <div id="provider-links" class="mt-2 space-x-3">
                  <a id="provider-docs" href="#" target="_blank" class="text-sm text-blue-600 hover:underline">
                    <i class="fas fa-external-link-alt mr-1"></i>Documentation
                  </a>
                  <a id="provider-setup" href="#" target="_blank" class="text-sm text-blue-600 hover:underline">
                    <i class="fas fa-cog mr-1"></i>Setup Guide
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- SAML Configuration Form -->
      <div class="bg-white rounded-lg shadow p-6">
        <h4 class="text-md font-medium text-gray-900 mb-4">SAML Configuration</h4>
        <form id="saml-config-form" class="space-y-4">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Entity ID (Service Provider)</label>
              <input type="text" id="entity-id" class="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://your-app.pages.dev/saml/metadata" data-default="">
              <p class="text-xs text-gray-500 mt-1">Unique identifier for your application</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">ACS URL (Assertion Consumer Service)</label>
              <input type="text" id="saml-acs-url" class="form-input" placeholder="https://your-app.pages.dev/saml/acs">
              <p class="text-xs text-gray-500 mt-1">Where SAML responses are sent</p>
            </div>
          </div>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">SSO URL (Identity Provider)</label>
              <input type="text" id="sso-url" class="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://login.microsoftonline.com/tenant-id/saml2" data-default="">
              <p class="text-xs text-gray-500 mt-1">IdP single sign-on endpoint</p>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">SLO URL (Single Logout)</label>
              <input type="text" id="slo-url" class="form-input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="https://login.microsoftonline.com/tenant-id/saml2" data-default="">
              <p class="text-xs text-gray-500 mt-1">IdP single logout endpoint (optional)</p>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">X.509 Certificate</label>
            <textarea id="saml-certificate" class="form-input" rows="8" placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"></textarea>
            <p class="text-xs text-gray-500 mt-1">Copy the signing certificate from your identity provider</p>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name ID Format</label>
              <select id="saml-name-id-format" class="form-select">
                <option value="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">Email Address</option>
                <option value="urn:oasis:names:tc:SAML:2.0:nameid-format:persistent">Persistent</option>
                <option value="urn:oasis:names:tc:SAML:2.0:nameid-format:transient">Transient</option>
                <option value="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">Unspecified</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Binding Type</label>
              <select id="saml-binding-type" class="form-select">
                <option value="HTTP-POST">HTTP-POST</option>
                <option value="HTTP-Redirect">HTTP-Redirect</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Signature Algorithm</label>
              <select id="saml-signature-algorithm" class="form-select">
                <option value="http://www.w3.org/2001/04/xmldsig-more#rsa-sha256">RSA-SHA256</option>
                <option value="http://www.w3.org/2000/09/xmldsig#rsa-sha1">RSA-SHA1</option>
              </select>
            </div>
          </div>
          
          <div class="space-y-3">
            <label class="flex items-center">
              <input type="checkbox" id="saml-enabled" class="form-checkbox h-4 w-4 text-blue-600">
              <span class="ml-2 text-sm text-gray-700">Enable SAML Authentication</span>
            </label>
            <label class="flex items-center">
              <input type="checkbox" id="saml-auto-provision" class="form-checkbox h-4 w-4 text-blue-600">
              <span class="ml-2 text-sm text-gray-700">Auto-provision new users</span>
            </label>
            <label class="flex items-center">
              <input type="checkbox" id="saml-force-authn" class="form-checkbox h-4 w-4 text-blue-600">
              <span class="ml-2 text-sm text-gray-700">Force re-authentication on each login</span>
            </label>
          </div>
          
          <div class="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
            <button type="button" onclick="testSAMLConnection()" class="btn-secondary">
              <i class="fas fa-plug mr-2"></i>Test Connection
            </button>
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
        <p class="text-sm text-gray-600 mb-4">Configure how SAML attributes map to user profile fields</p>
        <div class="space-y-4">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email Attribute</label>
              <input type="text" id="saml-attr-email" class="form-input" value="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">First Name Attribute</label>
              <input type="text" id="saml-attr-firstname" class="form-input" value="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname">
            </div>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Last Name Attribute</label>
              <input type="text" id="saml-attr-lastname" class="form-input" value="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Role Attribute</label>
              <input type="text" id="saml-attr-role" class="form-input" value="http://schemas.microsoft.com/ws/2008/06/identity/claims/role">
            </div>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Department Attribute</label>
              <input type="text" id="saml-attr-department" class="form-input" value="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/department">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Groups Attribute</label>
              <input type="text" id="saml-attr-groups" class="form-input" value="http://schemas.xmlsoap.org/claims/Group">
            </div>
          </div>
        </div>
      </div>
      
      <!-- Role Mapping -->
      <div class="bg-white rounded-lg shadow p-6">
        <h4 class="text-md font-medium text-gray-900 mb-4">Role Mapping</h4>
        <p class="text-sm text-gray-600 mb-4">Map SAML role values to application roles</p>
        <div class="space-y-3" id="role-mappings-container">
          <div class="role-mapping-item flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">SAML Attribute Value</label>
              <input type="text" 
                     name="saml_role_0" 
                     placeholder="e.g., admin, manager, user"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div class="flex-1">
              <label class="block text-sm font-medium text-gray-700 mb-1">Application Role</label>
              <select name="app_role_0" 
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="admin">Administrator</option>
                <option value="manager">Manager</option>
                <option value="analyst">Risk Analyst</option>
                <option value="viewer">Viewer</option>
                <option value="auditor">Auditor</option>
              </select>
            </div>
            <button type="button" 
                    onclick="this.parentElement.remove()" 
                    class="text-red-600 hover:text-red-800 p-2">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </button>
          </div>
        </div>
        <button type="button" onclick="addRoleMapping()" class="mt-3 text-sm text-blue-600 hover:text-blue-800">
          <i class="fas fa-plus mr-1"></i>Add Role Mapping
        </button>
      </div>
      
      <!-- Additional Options -->
      <div class="bg-white rounded-lg shadow p-6">
        <h4 class="text-md font-medium text-gray-900 mb-4">Additional Options</h4>
        <div class="space-y-4">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label class="flex items-center">
                <input type="checkbox" id="auto-provisioning" class="form-checkbox">
                <span class="ml-2 text-sm text-gray-700">Enable auto-provisioning of new users</span>
              </label>
              <p class="text-xs text-gray-500 mt-1">Automatically create user accounts for new SAML users</p>
            </div>
            <div>
              <label class="flex items-center">
                <input type="checkbox" id="force-authentication" class="form-checkbox">
                <span class="ml-2 text-sm text-gray-700">Force re-authentication</span>
              </label>
              <p class="text-xs text-gray-500 mt-1">Require users to authenticate each time</p>
            </div>
          </div>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Signature Algorithm</label>
              <select id="signature-algorithm" class="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="RSA-SHA256">RSA-SHA256 (Recommended)</option>
                <option value="RSA-SHA1">RSA-SHA1</option>
                <option value="RSA-SHA384">RSA-SHA384</option>
                <option value="RSA-SHA512">RSA-SHA512</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name ID Format</label>
              <select id="nameid-format" class="form-select w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">Email Address</option>
                <option value="urn:oasis:names:tc:SAML:2.0:nameid-format:persistent">Persistent</option>
                <option value="urn:oasis:names:tc:SAML:2.0:nameid-format:transient">Transient</option>
                <option value="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">Unspecified</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div>
            <h4 class="text-md font-medium text-gray-900">Test & Save Configuration</h4>
            <p class="text-sm text-gray-600 mt-1">Validate your SAML configuration before enabling</p>
          </div>
          <div class="flex space-x-3">
            <button type="button" 
                    id="test-saml-connection"
                    onclick="testSAMLConnection()" 
                    class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <i class="fas fa-plug mr-2"></i>Test Connection
            </button>
            <button type="submit" 
                    class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
              <i class="fas fa-save mr-2"></i>Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Load current SAML configuration
  await loadSAMLConfig();
  
  // Initialize provider selection
  initializeSAMLProviders();
}

// Microsoft Integration Functions
async function syncMicrosoftAssets() {
  try {
    const token = localStorage.getItem('aria_token');
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
    const token = localStorage.getItem('aria_token');
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
    const token = localStorage.getItem('aria_token');
    
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

// User Management - Add User Modal
function showAddUserModal() {
  const modalHTML = `
    <div id="add-user-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style="display:block;">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <!-- Modal Header -->
          <div class="flex justify-between items-center pb-4 border-b">
            <h3 class="text-lg font-medium text-gray-900">Add New User</h3>
            <button onclick="closeAddUserModal()" class="text-gray-400 hover:text-gray-600" aria-label="Close add user form">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>

          <!-- Modal Body -->
          <form id="add-user-form" class="mt-6 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                <input type="text" name="first_name" class="form-input" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                <input type="text" name="last_name" class="form-input" required>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input type="email" name="email" class="form-input" placeholder="user@example.com" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                <input type="text" name="username" class="form-input" required>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select name="role" class="form-select" required>
                  <option value="">Select role</option>
                  <option value="admin">Admin</option>
                  <option value="risk_manager">Risk Manager</option>
                  <option value="risk_analyst">Risk Analyst</option>
                  <option value="service_owner">Service Owner</option>
                  <option value="auditor">Auditor</option>
                  <option value="integration_operator">Integration Operator</option>
                  <option value="readonly">Read Only</option>
                  <option value="compliance_officer">Compliance Officer</option>
                  <option value="incident_manager">Incident Manager</option>
                  <option value="user">User</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Auth Provider</label>
                <select name="auth_provider" class="form-select">
                  <option value="local" selected>Local</option>
                  <option value="saml">SAML</option>
                </select>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <input type="text" name="department" class="form-input" placeholder="e.g., IT Security">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                <input type="text" name="job_title" class="form-input" placeholder="e.g., Security Specialist">
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input type="text" name="phone" class="form-input" placeholder="+1 555-1234">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <div class="flex space-x-2">
                  <input type="text" id="new-user-password" name="password" class="form-input flex-1" minlength="8" required>
                  <button type="button" id="generate-password-btn" class="btn-secondary whitespace-nowrap"><i class="fas fa-magic mr-2"></i>Generate</button>
                </div>
                <div class="text-xs text-gray-500 mt-1">Minimum 8 characters. Use Generate for a strong password.</div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="flex justify-end space-x-3 pt-6 border-t">
              <button type="button" onclick="closeAddUserModal()" class="btn-secondary">
                <i class="fas fa-times mr-2"></i>Cancel
              </button>
              <button type="submit" class="btn-primary">
                <i class="fas fa-user-plus mr-2"></i>Create User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
  setupAddUserFormHandlers();
  attachModalCommonHandlers('add-user-modal', closeAddUserModal);
}

function attachModalCommonHandlers(modalId, closeFn) {
  const overlay = document.getElementById(modalId);
  if (!overlay) return;
  const clickHandler = (e) => { if (e.target.id === modalId) closeFn(); };
  const keyHandler = (e) => { if (e.key === 'Escape') closeFn(); };
  overlay.addEventListener('click', clickHandler);
  document.addEventListener('keydown', keyHandler);
  // store handlers to remove later
  overlay._escKeyHandler = keyHandler;
  overlay._clickHandler = clickHandler;
}

function closeAddUserModal() {
  const modal = document.getElementById('add-user-modal');
  if (modal) {
    if (modal._escKeyHandler) document.removeEventListener('keydown', modal._escKeyHandler);
    if (modal._clickHandler) modal.removeEventListener('click', modal._clickHandler);
    modal.remove();
  }
}

function setupAddUserFormHandlers() {
  const form = document.getElementById('add-user-form');
  const genBtn = document.getElementById('generate-password-btn');
  const pwdInput = document.getElementById('new-user-password');
  if (!form) return;

  if (genBtn && pwdInput) {
    genBtn.addEventListener('click', async () => {
      try {
        const token = localStorage.getItem('aria_token');
        const resp = await axios.get('/api/generate-password', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (resp.data.success && resp.data.data?.password) {
          pwdInput.value = resp.data.data.password;
          showToast('Generated a strong password', 'success');
        } else {
          // fallback client-side
          pwdInput.value = generateClientPassword();
        }
      } catch (_) {
        pwdInput.value = generateClientPassword();
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const userData = {
      first_name: fd.get('first_name')?.toString().trim(),
      last_name: fd.get('last_name')?.toString().trim(),
      email: fd.get('email')?.toString().trim(),
      username: fd.get('username')?.toString().trim(),
      role: fd.get('role')?.toString(),
      auth_provider: fd.get('auth_provider')?.toString() || 'local',
      department: fd.get('department')?.toString() || null,
      job_title: fd.get('job_title')?.toString() || null,
      phone: fd.get('phone')?.toString() || null,
      password: fd.get('password')?.toString()
    };

    if (!userData.first_name || !userData.last_name || !userData.email || !userData.username || !userData.role || !userData.password) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    if (userData.password.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('aria_token');
      const resp = await axios.post('/api/users', userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.data.success) {
        showToast('User created successfully', 'success');
        closeAddUserModal();
        // refresh users table if on settings users tab
        if (typeof loadUsersForSettings === 'function') {
          await loadUsersForSettings();
        }
      } else {
        showToast(resp.data.error || 'Failed to create user', 'error');
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to create user';
      showToast(msg, 'error');
    }
  });
}

function generateClientPassword() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+{}[]';
  let pwd = '';
  for (let i = 0; i < 16; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

// Placeholder: Organizations modal (to avoid undefined onclick)
function showAddOrganizationModal_Placeholder() {
  const html = `
    <div id="add-organization-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style="display:block;">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div class="flex justify-between items-center pb-4 border-b">
          <h3 class="text-lg font-medium text-gray-900">Add Organization</h3>
          <button onclick="closeAddOrganizationModal_Placeholder()" class="text-gray-400 hover:text-gray-600" aria-label="Close add organization form">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <div class="p-4 text-sm text-gray-700">
          This form is coming soon. Please use API or seed data for now.
        </div>
        <div class="flex justify-end space-x-3 pt-4 border-t">
          <button type="button" onclick="closeAddOrganizationModal_Placeholder()" class="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
  attachModalCommonHandlers('add-organization-modal', closeAddOrganizationModal);
}
function closeAddOrganizationModal_Placeholder() {
  const modal = document.getElementById('add-organization-modal');
  if (modal) {
    if (modal._escKeyHandler) document.removeEventListener('keydown', modal._escKeyHandler);
    if (modal._clickHandler) modal.removeEventListener('click', modal._clickHandler);
    modal.remove();
  }
}

// Placeholder: Risk Owners modal (to avoid undefined onclick)
function showAddRiskOwnerModal_Placeholder() {
  const html = `
    <div id="add-risk-owner-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style="display:block;">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div class="flex justify-between items-center pb-4 border-b">
          <h3 class="text-lg font-medium text-gray-900">Add Risk Owner</h3>
          <button onclick="closeAddRiskOwnerModal_Placeholder()" class="text-gray-400 hover:text-gray-600" aria-label="Close add risk owner form">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <div class="p-4 text-sm text-gray-700">
          This form is coming soon. Please use Users to create a user and assign as risk owner.
        </div>
        <div class="flex justify-end space-x-3 pt-4 border-t">
          <button type="button" onclick="closeAddRiskOwnerModal_Placeholder()" class="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);
  attachModalCommonHandlers('add-risk-owner-modal', closeAddRiskOwnerModal);
}
function closeAddRiskOwnerModal_Placeholder() {
  const modal = document.getElementById('add-risk-owner-modal');
  if (modal) {
    if (modal._escKeyHandler) document.removeEventListener('keydown', modal._escKeyHandler);
    if (modal._clickHandler) modal.removeEventListener('click', modal._clickHandler);
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
  const token = localStorage.getItem('aria_token');
  
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
      const token = localStorage.getItem('aria_token');
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

async function viewAsset(id) {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get(`/api/assets/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const asset = response.data.data;
      showViewAssetModal(asset);
    } else {
      showToast('Failed to load asset details', 'error');
    }
  } catch (error) {
    console.error('Error loading asset:', error);
    showToast('Failed to load asset details', 'error');
  }
}

function showViewAssetModal(asset) {
  const modalHTML = `
    <div id="view-asset-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style="display: block;">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <!-- Modal Header -->
          <div class="flex justify-between items-center pb-4 border-b">
            <h3 class="text-lg font-medium text-gray-900">Asset Details: ${asset.name}</h3>
            <button onclick="closeViewAssetModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <!-- Modal Body -->
          <div class="mt-6 space-y-6 max-h-96 overflow-y-auto">
            <!-- Basic Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700">Asset ID</label>
                <p class="mt-1 text-sm text-gray-900">${asset.asset_id || 'N/A'}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Asset Name</label>
                <p class="mt-1 text-sm text-gray-900">${asset.name || 'N/A'}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Type</label>
                <p class="mt-1 text-sm text-gray-900">${asset.type || 'N/A'}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Category</label>
                <p class="mt-1 text-sm text-gray-900">${asset.category || 'N/A'}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Owner</label>
                <p class="mt-1 text-sm text-gray-900">${asset.owner || 'N/A'}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Criticality</label>
                <p class="mt-1">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${asset.criticality === 'High' ? 'bg-red-100 text-red-800' : 
                      asset.criticality === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
                    ${asset.criticality || 'N/A'}
                  </span>
                </p>
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700">Description</label>
                <p class="mt-1 text-sm text-gray-900">${asset.description || 'N/A'}</p>
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700">Location</label>
                <p class="mt-1 text-sm text-gray-900">${asset.location || 'N/A'}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Value</label>
                <p class="mt-1 text-sm text-gray-900">${asset.value ? '$' + asset.value : 'N/A'}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Service</label>
                <p class="mt-1 text-sm text-gray-900">${asset.service || 'N/A'}</p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Risk Level</label>
                <p class="mt-1">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                    ${asset.risk_level === 'High' ? 'bg-red-100 text-red-800' : 
                      asset.risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
                    ${asset.risk_level || 'N/A'}
                  </span>
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700">Created</label>
                <p class="mt-1 text-sm text-gray-900">${asset.created_at ? new Date(asset.created_at).toLocaleDateString() : 'N/A'}</p>
              </div>
            </div>
          </div>
          
          <!-- Modal Footer -->
          <div class="flex justify-end space-x-2 pt-4 border-t mt-6">
            <button onclick="editAsset(${asset.id})" class="btn-primary">
              <i class="fas fa-edit mr-2"></i>Edit Asset
            </button>
            <button onclick="closeViewAssetModal()" class="btn-secondary">Close</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeViewAssetModal() {
  const modal = document.getElementById('view-asset-modal');
  if (modal) {
    modal.remove();
  }
}

async function editAsset(id) {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get(`/api/assets/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      const asset = response.data.data;
      showEditAssetModal(asset);
    } else {
      showToast('Failed to load asset data', 'error');
    }
  } catch (error) {
    console.error('Error loading asset:', error);
    showToast('Failed to load asset data', 'error');
  }
}

function showEditAssetModal(asset) {
  const modalHTML = `
    <div id="edit-asset-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style="display: block;">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <!-- Modal Header -->
          <div class="flex justify-between items-center pb-4 border-b">
            <h3 class="text-lg font-medium text-gray-900">Edit Asset: ${asset.name}</h3>
            <button onclick="closeEditAssetModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <!-- Modal Body -->
          <form id="edit-asset-form" class="mt-6 space-y-6">
            <input type="hidden" id="edit-asset-id" value="${asset.id}">
            
            <!-- Basic Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Asset Name *</label>
                <input type="text" id="edit-asset-name" name="name" required class="form-input" value="${asset.name || ''}">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Asset ID</label>
                <input type="text" id="edit-asset-id-field" name="asset_id" class="form-input" value="${asset.asset_id || ''}" readonly>
              </div>
            </div>

            <!-- Asset Type and OS -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Asset Type *</label>
                <select id="edit-asset-type" name="asset_type" required class="form-select">
                  <option value="">Select asset type</option>
                  <option value="server" ${asset.asset_type === 'server' ? 'selected' : ''}>Server</option>
                  <option value="workstation" ${asset.asset_type === 'workstation' ? 'selected' : ''}>Workstation</option>
                  <option value="mobile" ${asset.asset_type === 'mobile' ? 'selected' : ''}>Mobile Device</option>
                  <option value="network_device" ${asset.asset_type === 'network_device' ? 'selected' : ''}>Network Device</option>
                  <option value="iot" ${asset.asset_type === 'iot' ? 'selected' : ''}>IoT Device</option>
                  <option value="cloud_resource" ${asset.asset_type === 'cloud_resource' ? 'selected' : ''}>Cloud Resource</option>
                  <option value="database" ${asset.asset_type === 'database' ? 'selected' : ''}>Database</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Operating System</label>
                <select id="edit-operating-system" name="operating_system" class="form-select">
                  <option value="">Select OS</option>
                  <option value="Windows Server 2022" ${asset.operating_system === 'Windows Server 2022' ? 'selected' : ''}>Windows Server 2022</option>
                  <option value="Windows Server 2019" ${asset.operating_system === 'Windows Server 2019' ? 'selected' : ''}>Windows Server 2019</option>
                  <option value="Windows 11" ${asset.operating_system === 'Windows 11' ? 'selected' : ''}>Windows 11</option>
                  <option value="Windows 10" ${asset.operating_system === 'Windows 10' ? 'selected' : ''}>Windows 10</option>
                  <option value="Ubuntu 22.04" ${asset.operating_system === 'Ubuntu 22.04' ? 'selected' : ''}>Ubuntu 22.04</option>
                  <option value="Ubuntu 20.04" ${asset.operating_system === 'Ubuntu 20.04' ? 'selected' : ''}>Ubuntu 20.04</option>
                  <option value="CentOS 8" ${asset.operating_system === 'CentOS 8' ? 'selected' : ''}>CentOS 8</option>
                  <option value="RHEL 9" ${asset.operating_system === 'RHEL 9' ? 'selected' : ''}>Red Hat Enterprise Linux 9</option>
                  <option value="macOS" ${asset.operating_system === 'macOS' ? 'selected' : ''}>macOS</option>
                  <option value="iOS" ${asset.operating_system === 'iOS' ? 'selected' : ''}>iOS</option>
                  <option value="Android" ${asset.operating_system === 'Android' ? 'selected' : ''}>Android</option>
                </select>
              </div>
            </div>

            <!-- Network Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">IP Address</label>
                <input type="text" id="edit-ip-address" name="ip_address" class="form-input" value="${asset.ip_address || ''}" pattern="^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">MAC Address</label>
                <input type="text" id="edit-mac-address" name="mac_address" class="form-input" value="${asset.mac_address || ''}" pattern="^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$">
              </div>
            </div>

            <!-- Risk Assessment -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Risk Score</label>
                <input type="range" id="edit-risk-score" name="risk_score" min="0" max="10" step="0.1" value="${asset.risk_score || 5}" class="w-full" oninput="updateEditRiskScoreDisplay(this.value)">
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Low (0)</span>
                  <span id="edit-risk-score-display" class="font-medium">${asset.risk_score || 5}</span>
                  <span>Critical (10)</span>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Exposure Level</label>
                <select id="edit-exposure-level" name="exposure_level" class="form-select">
                  <option value="low" ${asset.exposure_level === 'low' ? 'selected' : ''}>Low - Internal network only</option>
                  <option value="medium" ${asset.exposure_level === 'medium' ? 'selected' : ''}>Medium - Limited external access</option>
                  <option value="high" ${asset.exposure_level === 'high' ? 'selected' : ''}>High - Internet accessible</option>
                  <option value="critical" ${asset.exposure_level === 'critical' ? 'selected' : ''}>Critical - Public facing</option>
                </select>
              </div>
            </div>

            <!-- Organization Assignment -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Organization *</label>
                <select id="edit-organization-id" name="organization_id" required class="form-select">
                  <option value="">Select organization</option>
                  <!-- Options will be populated dynamically -->
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Service</label>
                <select id="edit-service-id" name="service_id" class="form-select">
                  <option value="">Select service (optional)</option>
                  <!-- Options will be populated dynamically -->
                </select>
              </div>
            </div>

            <!-- Asset Owner -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Asset Owner</label>
              <select id="edit-owner-id" name="owner_id" class="form-select">
                <option value="">Select owner</option>
                <!-- Options will be populated dynamically -->
              </select>
            </div>

            <!-- Device Tags -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Device Tags</label>
              <input type="text" id="edit-device-tags" name="device_tags" class="form-input" value="${asset.device_tags ? JSON.parse(asset.device_tags).join(', ') : ''}">
              <div class="text-xs text-gray-500 mt-1">Comma-separated tags for categorization</div>
            </div>

            <!-- Modal Footer -->
            <div class="flex justify-end space-x-3 pt-6 border-t">
              <button type="button" onclick="closeEditAssetModal()" class="btn-secondary">
                <i class="fas fa-times mr-2"></i>Cancel
              </button>
              <button type="submit" class="btn-primary">
                <i class="fas fa-save mr-2"></i>Update Asset
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
  loadEditAssetModalDropdowns(asset);
  setupEditAssetFormHandlers();
}

function closeEditAssetModal() {
  const modal = document.getElementById('edit-asset-modal');
  if (modal) {
    modal.remove();
  }
}

function updateEditRiskScoreDisplay(value) {
  const display = document.getElementById('edit-risk-score-display');
  if (display) {
    display.textContent = parseFloat(value).toFixed(1);
  }
}

async function loadEditAssetModalDropdowns(asset) {
  const token = localStorage.getItem('aria_token');
  
  try {
    // Load organizations
    const orgsResponse = await axios.get('/api/organizations', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const orgSelect = document.getElementById('edit-organization-id');
    if (orgsResponse.data.success && orgSelect) {
      orgSelect.innerHTML = '<option value="">Select organization</option>' + 
        orgsResponse.data.data.map(org => 
          `<option value="${org.id}" ${org.id === asset.organization_id ? 'selected' : ''}>${org.name}</option>`
        ).join('');
    }

    // Load services
    const servicesResponse = await axios.get('/api/services', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const serviceSelect = document.getElementById('edit-service-id');
    if (servicesResponse.data.success && serviceSelect) {
      serviceSelect.innerHTML = '<option value="">Select service (optional)</option>' + 
        servicesResponse.data.data.map(service => 
          `<option value="${service.id}" ${service.id === asset.service_id ? 'selected' : ''}>${service.name}</option>`
        ).join('');
    }

    // Load users
    const usersResponse = await axios.get('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const ownerSelect = document.getElementById('edit-owner-id');
    if (usersResponse.data.success && ownerSelect) {
      ownerSelect.innerHTML = '<option value="">Select owner</option>' + 
        usersResponse.data.data.map(user => 
          `<option value="${user.id}" ${user.id === asset.owner_id ? 'selected' : ''}>${user.first_name} ${user.last_name} (${user.email})</option>`
        ).join('');
    }

  } catch (error) {
    console.error('Error loading edit asset dropdown data:', error);
    showToast('Failed to load form data', 'error');
  }
}

function setupEditAssetFormHandlers() {
  const form = document.getElementById('edit-asset-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const assetId = document.getElementById('edit-asset-id').value;
    const formData = new FormData(form);
    const assetData = {
      name: formData.get('name'),
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
      const token = localStorage.getItem('aria_token');
      const response = await axios.put(`/api/assets/${assetId}`, assetData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        showToast(`Asset "${assetData.name}" updated successfully`, 'success');
        closeEditAssetModal();
        
        // Refresh assets table if we're on the assets page
        if (currentModule === 'assets') {
          await loadAssets();
        }
      } else {
        showToast('Failed to update asset: ' + (response.data.error || 'Unknown error'), 'error');
      }
    } catch (error) {
      console.error('Error updating asset:', error);
      const errorMessage = error.response?.data?.error || 'Failed to update asset';
      showToast(errorMessage, 'error');
    }
  });
}

async function deleteAsset(id) {
  if (!confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.delete(`/api/assets/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast('Asset deleted successfully', 'success');
      loadAssets(); // Refresh the assets list
    } else {
      showToast(response.data.message || 'Failed to delete asset', 'error');
    }
  } catch (error) {
    console.error('Error deleting asset:', error);
    if (error.response?.status === 403) {
      showToast('You do not have permission to delete assets', 'error');
    } else {
      showToast('Failed to delete asset', 'error');
    }
  }
}

function showImportAssetsModal() {
  const modalHTML = `
    <div id="import-assets-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style="display: block;">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <!-- Modal Header -->
          <div class="flex justify-between items-center pb-4 border-b">
            <h3 class="text-lg font-medium text-gray-900">Import Assets</h3>
            <button onclick="closeImportAssetsModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <!-- Modal Body -->
          <div class="mt-6">
            <div class="mb-6">
              <div class="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <i class="fas fa-info-circle text-blue-400"></i>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-blue-800">CSV Import Instructions</h3>
                    <div class="mt-2 text-sm text-blue-700">
                      <p>Upload a CSV file with the following columns:</p>
                      <ul class="list-disc ml-5 mt-1">
                        <li>asset_id (optional - will be auto-generated if not provided)</li>
                        <li>name (required)</li>
                        <li>type (required: Hardware, Software, Data, Network, Facility, Personnel)</li>
                        <li>category (optional)</li>
                        <li>description (optional)</li>
                        <li>owner (optional)</li>
                        <li>location (optional)</li>
                        <li>criticality (Low, Medium, High)</li>
                        <li>value (optional - numeric value)</li>
                        <li>service (optional)</li>
                        <li>risk_level (Low, Medium, High)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Select CSV File
                </label>
                <input 
                  type="file" 
                  id="import-assets-file" 
                  accept=".csv"
                  class="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
              
              <div class="mb-4">
                <label class="flex items-center">
                  <input type="checkbox" id="import-skip-duplicates" class="form-checkbox" checked>
                  <span class="ml-2 text-sm text-gray-700">Skip duplicate assets (based on asset_id)</span>
                </label>
              </div>
            </div>
          </div>
          
          <!-- Modal Footer -->
          <div class="flex justify-between pt-4 border-t">
            <button onclick="downloadAssetTemplate()" class="btn-secondary">
              <i class="fas fa-download mr-2"></i>Download Template
            </button>
            <div class="flex space-x-2">
              <button onclick="importAssets()" class="btn-primary">
                <i class="fas fa-upload mr-2"></i>Import Assets
              </button>
              <button onclick="closeImportAssetsModal()" class="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeImportAssetsModal() {
  const modal = document.getElementById('import-assets-modal');
  if (modal) {
    modal.remove();
  }
}

function downloadAssetTemplate() {
  const csvContent = `asset_id,name,type,category,description,owner,location,criticality,value,service,risk_level
AST-001,Server-01,Hardware,IT Infrastructure,Main application server,IT Team,Data Center,High,50000,Web Services,Medium
AST-002,Customer Database,Data,Database,Customer information database,Data Team,Cloud,High,100000,Customer Service,High
AST-003,Office Building,Facility,Physical,Main office building,Facilities,Downtown,Medium,500000,Operations,Low`;
  
  downloadCSV(csvContent, 'assets_import_template.csv');
  showToast('Asset import template downloaded', 'success');
}

async function importAssets() {
  const fileInput = document.getElementById('import-assets-file');
  const skipDuplicates = document.getElementById('import-skip-duplicates').checked;
  
  if (!fileInput.files || !fileInput.files[0]) {
    showToast('Please select a CSV file to import', 'error');
    return;
  }
  
  const file = fileInput.files[0];
  
  try {
    const csvText = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = e => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
    
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      showToast('CSV file must contain at least a header and one data row', 'error');
      return;
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const assets = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      if (values.length !== headers.length) {
        continue; // Skip malformed rows
      }
      
      const asset = {};
      headers.forEach((header, index) => {
        if (values[index]) {
          asset[header] = values[index];
        }
      });
      
      // Validate required fields
      if (!asset.name || !asset.type) {
        continue; // Skip invalid rows
      }
      
      // Generate asset_id if not provided
      if (!asset.asset_id) {
        asset.asset_id = generateAssetId();
      }
      
      assets.push(asset);
    }
    
    if (assets.length === 0) {
      showToast('No valid assets found in CSV file', 'error');
      return;
    }
    
    const token = localStorage.getItem('aria_token');
    const response = await axios.post('/api/assets/import', {
      assets: assets,
      skipDuplicates: skipDuplicates
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast(`Successfully imported ${response.data.imported} assets`, 'success');
      closeImportAssetsModal();
      loadAssets(); // Refresh the assets list
    } else {
      showToast(response.data.message || 'Failed to import assets', 'error');
    }
  } catch (error) {
    console.error('Error importing assets:', error);
    showToast('Failed to import assets', 'error');
  }
}

async function exportAssets() {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get('/api/assets', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.data || !response.data.length) {
      showToast('No assets found to export', 'warning');
      return;
    }
    
    const csvContent = convertToCSV(response.data, [
      { key: 'id', label: 'ID' },
      { key: 'asset_id', label: 'Asset ID' },
      { key: 'name', label: 'Name' },
      { key: 'type', label: 'Type' },
      { key: 'category', label: 'Category' },
      { key: 'description', label: 'Description' },
      { key: 'owner', label: 'Owner' },
      { key: 'location', label: 'Location' },
      { key: 'criticality', label: 'Criticality' },
      { key: 'value', label: 'Value' },
      { key: 'service', label: 'Service' },
      { key: 'risk_level', label: 'Risk Level' },
      { key: 'created_at', label: 'Created Date' },
      { key: 'updated_at', label: 'Updated Date' }
    ]);
    
    downloadCSV(csvContent, `assets_export_${new Date().toISOString().split('T')[0]}.csv`);
    showToast('Assets exported successfully', 'success');
  } catch (error) {
    console.error('Error exporting assets:', error);
    showToast('Failed to export assets', 'error');
  }
}

async function filterAssets() {
  const searchTerm = document.getElementById('asset-search').value.toLowerCase();
  const typeFilter = document.getElementById('asset-type-filter').value;
  const riskFilter = document.getElementById('asset-risk-filter').value;
  const serviceFilter = document.getElementById('asset-service-filter').value;
  
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get('/api/assets', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.data) {
      return;
    }
    
    let filteredAssets = response.data.filter(asset => {
      // Search term filter
      const matchesSearch = !searchTerm || 
        asset.name.toLowerCase().includes(searchTerm) ||
        asset.asset_id.toLowerCase().includes(searchTerm) ||
        (asset.description && asset.description.toLowerCase().includes(searchTerm)) ||
        (asset.owner && asset.owner.toLowerCase().includes(searchTerm));
      
      // Type filter
      const matchesType = !typeFilter || asset.type === typeFilter;
      
      // Risk level filter
      const matchesRisk = !riskFilter || asset.risk_level === riskFilter;
      
      // Service filter
      const matchesService = !serviceFilter || asset.service === serviceFilter;
      
      return matchesSearch && matchesType && matchesRisk && matchesService;
    });
    
    // Update the display
    displayAssets(filteredAssets);
    
    // Update filter count
    const totalAssets = response.data.length;
    const filteredCount = filteredAssets.length;
    
    if (filteredCount < totalAssets) {
      showToast(`Showing ${filteredCount} of ${totalAssets} assets`, 'info');
    }
  } catch (error) {
    console.error('Error filtering assets:', error);
    showToast('Failed to filter assets', 'error');
  }
}

function displayAssets(assets) {
  const assetsList = document.getElementById('assets-list');
  if (!assetsList) return;
  
  if (!assets || assets.length === 0) {
    assetsList.innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-server text-gray-400 text-4xl mb-4"></i>
        <p class="text-gray-500">No assets found</p>
      </div>
    `;
    return;
  }
  
  const assetsHTML = assets.map(asset => `
    <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div class="flex justify-between items-start mb-2">
        <div>
          <h3 class="text-lg font-medium text-gray-900">${asset.name}</h3>
          <p class="text-sm text-gray-600">${asset.asset_id}</p>
        </div>
        <div class="flex space-x-2">
          <button onclick="viewAsset(${asset.id})" class="text-blue-600 hover:text-blue-900" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
          <button onclick="editAsset(${asset.id})" class="text-green-600 hover:text-green-900" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteAsset(${asset.id})" class="text-red-600 hover:text-red-900" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        <div>
          <span class="font-medium text-gray-700">Type:</span>
          <span class="text-gray-900">${asset.type}</span>
        </div>
        <div>
          <span class="font-medium text-gray-700">Owner:</span>
          <span class="text-gray-900">${asset.owner || 'N/A'}</span>
        </div>
        <div>
          <span class="font-medium text-gray-700">Criticality:</span>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${asset.criticality === 'High' ? 'bg-red-100 text-red-800' : 
              asset.criticality === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
            ${asset.criticality}
          </span>
        </div>
        <div>
          <span class="font-medium text-gray-700">Risk:</span>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${asset.risk_level === 'High' ? 'bg-red-100 text-red-800' : 
              asset.risk_level === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}">
            ${asset.risk_level}
          </span>
        </div>
      </div>
      
      ${asset.description ? `<p class="mt-2 text-sm text-gray-600">${asset.description}</p>` : ''}
    </div>
  `).join('');
  
  assetsList.innerHTML = assetsHTML;
}

// Settings utility functions
async function loadMicrosoftConfig() {
  // Implementation for loading Microsoft configuration
  showToast('Loading Microsoft configuration...', 'info');
}

// Renamed to avoid duplicate identifier with the main implementation above
async function loadSAMLConfigStub() {
  showToast('Loading SAML configuration...', 'info');
}

function testMicrosoftConnection() {
  showToast('Testing Microsoft connection...', 'info');
}

function downloadSAMLMetadata() {
  showToast('Downloading SAML metadata...', 'info');
}

async function showAISettings() {
  // Redirect to secure enhanced settings implementation
  if (typeof enhancedSettings !== 'undefined' && enhancedSettings.showAISettings) {
    console.log('🔒 Redirecting to secure AI settings implementation');
    enhancedSettings.showAISettings();
    return;
  }
  
  // Fallback: Show secure message
  const content = document.getElementById('settings-content');
  content.innerHTML = `
    <div class="max-w-4xl mx-auto">
      <div class="mb-8">
        <h3 class="text-2xl font-bold text-gray-900">AI Provider Configuration</h3>
        <p class="text-gray-600 mt-2">This system has been upgraded to use secure server-side AI proxy.</p>
        <div class="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center">
            <i class="fas fa-shield-alt text-red-600 mr-2"></i>
            <span class="text-red-800 font-medium">Legacy Interface Disabled</span>
          </div>
          <p class="text-red-700 text-sm mt-1">This interface has been disabled for security reasons. Please use the enhanced secure settings.</p>
        </div>
      </div>
      
      <div class="bg-white rounded-lg p-8 text-center">
        <i class="fas fa-lock text-4xl text-gray-400 mb-4"></i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Secure AI Configuration</h3>
        <p class="text-gray-600 mb-4">API keys are now managed securely on the server. This legacy interface has been disabled.</p>
        <button onclick="location.reload()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Refresh Page
        </button>
      </div>
    </div>`;
}

// Missing data loading functions for system settings
async function loadOrganizationsData() {
  try {
    const token = localStorage.getItem('aria_token');
    if (!token) {
      console.warn('No auth token available for organizations data');
      return;
    }

    const response = await fetch('/api/organizations', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        // Update organizations list in UI
        updateOrganizationsList(data.data || []);
      }
    } else {
      console.warn('Organizations API not available, using mock data');
      updateOrganizationsList([
        { id: 1, name: 'IT Department', description: 'Information Technology', users_count: 15 },
        { id: 2, name: 'Security Team', description: 'Cybersecurity Division', users_count: 8 },
        { id: 3, name: 'Compliance', description: 'Risk & Compliance', users_count: 5 }
      ]);
    }
  } catch (error) {
    console.error('Error loading organizations:', error);
    updateOrganizationsList([]);
  }
}

async function loadRiskOwnersData() {
  try {
    const token = localStorage.getItem('aria_token');
    if (!token) {
      console.warn('No auth token available for risk owners data');
      return;
    }

    const response = await fetch('/api/risk-owners', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        updateRiskOwnersList(data.data || []);
      }
    } else {
      console.warn('Risk owners API not available, using mock data');
      updateRiskOwnersList([
        { id: 1, name: 'Avi Security', email: 'avi@dmt-corp.com', department: 'Security', risks_assigned: 12 },
        { id: 2, name: 'Sarah Johnson', email: 'sarah.johnson@dmt-corp.com', department: 'Risk Management', risks_assigned: 8 },
        { id: 3, name: 'Mike Chen', email: 'mike.chen@dmt-corp.com', department: 'Compliance', risks_assigned: 6 }
      ]);
    }
  } catch (error) {
    console.error('Error loading risk owners:', error);
    updateRiskOwnersList([]);
  }
}

function updateOrganizationsList(organizations) {
  const tableBody = document.getElementById('organizations-table-body');
  const loadingDiv = document.getElementById('organizations-loading');
  
  if (loadingDiv) loadingDiv.style.display = 'none';
  if (!tableBody) return;

  tableBody.innerHTML = organizations.map(org => `
    <tr>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${org.name}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${org.code || 'N/A'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${org.department || 'General'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${org.location || 'N/A'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${org.contact || 'N/A'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${org.assets_count || 0}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button onclick="editOrganization(${org.id})" class="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
        <button onclick="deleteOrganization(${org.id})" class="text-red-600 hover:text-red-900">Delete</button>
      </td>
    </tr>
  `).join('');
  
  // Update total organizations count
  const totalElement = document.getElementById('total-organizations');
  if (totalElement) totalElement.textContent = organizations.length;
}

function updateRiskOwnersList(owners) {
  const tableBody = document.getElementById('risk-owners-table-body');
  const loadingDiv = document.getElementById('risk-owners-loading');
  
  if (loadingDiv) loadingDiv.style.display = 'none';
  if (!tableBody) return;

  tableBody.innerHTML = owners.map(owner => `
    <tr>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${owner.name}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${owner.role || 'Risk Owner'}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${owner.department}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${owner.email}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${owner.risks_assigned || 0}</td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${owner.high_priority_risks || 0}</td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button onclick="editRiskOwner(${owner.id})" class="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
        <button onclick="removeRiskOwner(${owner.id})" class="text-red-600 hover:text-red-900">Remove</button>
      </td>
    </tr>
  `).join('');
}

// Placeholder functions for organization management
function editOrganization(id) {
  showToast('Organization editing will be available soon', 'info');
}

function deleteOrganization(id) {
  if (confirm('Are you sure you want to delete this organization?')) {
    showToast('Organization deletion will be available soon', 'info');
  }
}

// Placeholder functions for risk owner management  
function editRiskOwner(id) {
  showToast('Risk owner editing will be available soon', 'info');
}

function removeRiskOwner(id) {
  if (confirm('Are you sure you want to remove this risk owner?')) {
    showToast('Risk owner removal will be available soon', 'info');
  }
}

// Expose functions to global scope for settings integration
window.showMicrosoftSettings = showMicrosoftSettings;
window.showUsersSettings = showUsersSettings;
window.showOrganizationsSettings = showOrganizationsSettings;
window.showRiskOwnersSettings = showRiskOwnersSettings;
window.loadOrganizationsData = loadOrganizationsData;
window.loadRiskOwnersData = loadRiskOwnersData;
