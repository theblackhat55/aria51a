// System Settings Integration - Bridges existing functionality with enhanced settings

// Enhanced wrappers for existing system settings functions (fallback implementations)
function showUsersSettingsFallback() {
  const content = document.getElementById('settings-content');
  if (!content) return;
  
  content.innerHTML = `
    <div class="max-w-6xl mx-auto">
      <div class="mb-8 flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h3 class="text-2xl font-bold text-gray-900">User Management</h3>
          <p class="text-gray-600 mt-2">Manage system users, roles, and permissions</p>
        </div>
        <div class="mt-4 sm:mt-0">
          <button onclick="showAddUserModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors duration-200">
            <i class="fas fa-plus mr-2"></i>Add User
          </button>
        </div>
      </div>
      
      <!-- Search and Filters -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Search Users</label>
            <input type="text" placeholder="Search by name or email..." class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="user">User</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- Users Table -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Active</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody id="users-table-body" class="bg-white divide-y divide-gray-200">
              <!-- Users will be loaded here -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  // Load users data
  if (typeof window.loadUsersForSettings === 'function') {
    window.loadUsersForSettings();
  } else {
    loadUsersForSettingsFallback();
  }
}

function showOrganizationsSettingsFallback() {
  const content = document.getElementById('settings-content');
  if (!content) return;
  
  content.innerHTML = `
    <div class="max-w-6xl mx-auto">
      <div class="mb-8 flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h3 class="text-2xl font-bold text-gray-900">Organizations</h3>
          <p class="text-gray-600 mt-2">Manage organizations and their configurations</p>
        </div>
        <div class="mt-4 sm:mt-0">
          <button onclick="showAddOrganizationModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors duration-200">
            <i class="fas fa-plus mr-2"></i>Add Organization
          </button>
        </div>
      </div>
      
      <!-- Organizations Grid -->
      <div id="organizations-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <!-- Organizations will be loaded here -->
      </div>
    </div>
  `;
  
  // Load organizations data
  loadOrganizationsForSettings();
}

function showRiskOwnersSettingsFallback() {
  const content = document.getElementById('settings-content');
  if (!content) return;
  
  content.innerHTML = `
    <div class="max-w-6xl mx-auto">
      <div class="mb-8 flex flex-col sm:flex-row sm:items-center justify-between">
        <div>
          <h3 class="text-2xl font-bold text-gray-900">Risk Owners</h3>
          <p class="text-gray-600 mt-2">Manage risk owners and their assignments</p>
        </div>
        <div class="mt-4 sm:mt-0">
          <button onclick="showAddRiskOwnerModal()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors duration-200">
            <i class="fas fa-plus mr-2"></i>Add Risk Owner
          </button>
        </div>
      </div>
      
      <!-- Risk Owners Table -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Owner</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Categories</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned Risks</th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody id="risk-owners-table-body" class="bg-white divide-y divide-gray-200">
              <!-- Risk owners will be loaded here -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  
  // Load risk owners data
  loadRiskOwnersForSettings();
}

// SAML Settings removed - using original implementation from enterprise-modules.js

// Placeholder functions for data loading (integrate with existing implementations)
async function loadUsersForSettingsFallback() {
  // Implementation will use existing loadUsersForSettings function from enterprise-modules.js
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      renderUsersTable(response.data.data);
    }
  } catch (error) {
    console.error('Failed to load users:', error);
    showToast('Failed to load users', 'error');
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = users.map(user => `
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <div class="flex-shrink-0 h-10 w-10">
            <div class="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
              <span class="text-sm font-medium text-blue-600">${user.first_name?.[0]}${user.last_name?.[0]}</span>
            </div>
          </div>
          <div class="ml-4">
            <div class="text-sm font-medium text-gray-900">${user.first_name} ${user.last_name}</div>
            <div class="text-sm text-gray-500">${user.email}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(user.role)}">
          ${user.role}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(user.status)}">
          ${user.status || 'active'}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${user.last_login ? formatDate(user.last_login) : 'Never'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button onclick="editUser(${user.id})" class="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
        ${user.role !== 'admin' ? `<button onclick="deleteUser(${user.id})" class="text-red-600 hover:text-red-900">Delete</button>` : ''}
      </td>
    </tr>
  `).join('');
}

function getRoleBadgeClass(role) {
  const classes = {
    'admin': 'bg-red-100 text-red-800',
    'user': 'bg-blue-100 text-blue-800',
    'viewer': 'bg-gray-100 text-gray-800'
  };
  return classes[role] || 'bg-gray-100 text-gray-800';
}

function getStatusBadgeClass(status) {
  const classes = {
    'active': 'bg-green-100 text-green-800',
    'inactive': 'bg-red-100 text-red-800',
    'pending': 'bg-yellow-100 text-yellow-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
}

async function loadOrganizationsForSettings() {
  // Placeholder for organizations loading
  const grid = document.getElementById('organizations-grid');
  if (grid) {
    grid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-8">Organizations loading...</div>';
  }
}

async function loadRiskOwnersForSettings() {
  // Placeholder for risk owners loading
  const tbody = document.getElementById('risk-owners-table-body');
  if (tbody) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center text-gray-500 py-8">Risk owners loading...</td></tr>';
  }
}

// SAML settings loading removed - using original implementation

// Utility functions
function formatDate(dateString) {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Enhanced Modal and form functions
function showAddUserModal() {
  const modalHTML = `
    <div id="add-user-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style="display: block;">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <!-- Modal Header -->
          <div class="flex justify-between items-center pb-4 border-b">
            <h3 class="text-lg font-medium text-gray-900">Add New User</h3>
            <button onclick="closeAddUserModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <!-- Modal Body -->
          <form id="add-user-form" class="mt-6 space-y-6" onsubmit="handleAddUser(event)">
            <!-- Basic Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                <input type="text" id="user-first-name" name="firstName" required 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Enter first name">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                <input type="text" id="user-last-name" name="lastName" required 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Enter last name">
              </div>
            </div>

            <!-- Contact Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input type="email" id="user-email" name="email" required 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="user@example.com">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input type="tel" id="user-phone" name="phone" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="+1 (555) 123-4567">
              </div>
            </div>

            <!-- Username and Password -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                <input type="text" id="user-username" name="username" required 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Enter username">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <div class="relative">
                  <input type="password" id="user-password" name="password" required 
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         placeholder="Enter password">
                  <button type="button" onclick="togglePasswordVisibility('user-password')" 
                          class="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <i class="fas fa-eye text-gray-400 hover:text-gray-600"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Role and Organization -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select id="user-role" name="role" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Role</option>
                  <option value="admin">Administrator</option>
                  <option value="manager">Manager</option>
                  <option value="analyst">Risk Analyst</option>
                  <option value="auditor">Auditor</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Organization</label>
                <select id="user-organization" name="organizationId" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Organization</option>
                  <option value="1">IT Department</option>
                  <option value="2">Security Team</option>
                  <option value="3">Compliance Division</option>
                  <option value="4">Risk Management</option>
                </select>
              </div>
            </div>

            <!-- Department and Title -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <input type="text" id="user-department" name="department" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Enter department">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                <input type="text" id="user-title" name="title" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       placeholder="Enter job title">
              </div>
            </div>

            <!-- Status and Permissions -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select id="user-status" name="status" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending Activation</option>
                </select>
              </div>
              <div>
                <label class="flex items-center">
                  <input type="checkbox" id="user-mfa" name="mfaEnabled" class="form-checkbox">
                  <span class="ml-2 text-sm text-gray-700">Enable Multi-Factor Authentication</span>
                </label>
                <label class="flex items-center mt-2">
                  <input type="checkbox" id="user-notify" name="emailNotifications" class="form-checkbox" checked>
                  <span class="ml-2 text-sm text-gray-700">Send email notifications</span>
                </label>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="flex justify-end space-x-3 pt-6 border-t">
              <button type="button" onclick="closeAddUserModal()" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Cancel
              </button>
              <button type="submit" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <i class="fas fa-user-plus mr-2"></i>Create User
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeAddUserModal() {
  const modal = document.getElementById('add-user-modal');
  if (modal) {
    modal.remove();
  }
}

function togglePasswordVisibility(inputId) {
  const input = document.getElementById(inputId);
  const icon = input.nextElementSibling.querySelector('i');
  
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.remove('fa-eye');
    icon.classList.add('fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.remove('fa-eye-slash');
    icon.classList.add('fa-eye');
  }
}

async function handleAddUser(event) {
  event.preventDefault();
  
  const formData = new FormData(event.target);
  const userData = Object.fromEntries(formData.entries());
  
  // Add checkbox values
  userData.mfaEnabled = document.getElementById('user-mfa').checked;
  userData.emailNotifications = document.getElementById('user-notify').checked;
  
  try {
    // Show loading state
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating...';
    submitBtn.disabled = true;
    
    // Simulate API call (replace with actual API)
    const response = await simulateUserCreation(userData);
    
    if (response.success) {
      showToast('User created successfully!', 'success');
      closeAddUserModal();
      
      // Refresh users list if it exists
      if (typeof loadUsersData === 'function') {
        await loadUsersData();
      }
      
      // Add to notification center
      if (typeof notificationManager !== 'undefined' && notificationManager.isInitialized) {
        notificationManager.addNotificationFromToast(
          `New user "${userData.firstName} ${userData.lastName}" has been created`,
          'success',
          'User Management'
        );
      }
    } else {
      throw new Error(response.error || 'Failed to create user');
    }
  } catch (error) {
    console.error('Error creating user:', error);
    showToast('Failed to create user: ' + error.message, 'error');
    
    // Reset button
    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.innerHTML = '<i class="fas fa-user-plus mr-2"></i>Create User';
    submitBtn.disabled = false;
  }
}

async function simulateUserCreation(userData) {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Basic validation
  if (!userData.firstName || !userData.lastName || !userData.email || !userData.username) {
    return { success: false, error: 'Required fields are missing' };
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(userData.email)) {
    return { success: false, error: 'Invalid email format' };
  }
  
  // Generate user ID and timestamps
  const newUser = {
    id: Date.now(),
    ...userData,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_login: null
  };
  
  // Store in localStorage for demo purposes
  let users = JSON.parse(localStorage.getItem('demo_users') || '[]');
  
  // Check for duplicate email/username
  if (users.some(u => u.email === userData.email)) {
    return { success: false, error: 'Email address already exists' };
  }
  
  if (users.some(u => u.username === userData.username)) {
    return { success: false, error: 'Username already exists' };
  }
  
  users.push(newUser);
  localStorage.setItem('demo_users', JSON.stringify(users));
  
  return { success: true, data: newUser };
}

function showAddOrganizationModal() {
  const modalHTML = `
    <div id="add-org-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style="display: block;">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <div class="flex justify-between items-center pb-4 border-b">
            <h3 class="text-lg font-medium text-gray-900">Add New Organization</h3>
            <button onclick="closeAddOrgModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <form id="add-org-form" class="mt-6 space-y-6" onsubmit="handleAddOrganization(event)">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Organization Name *</label>
                <input type="text" name="name" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter organization name">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select name="type" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="department">Department</option>
                  <option value="division">Division</option>
                  <option value="subsidiary">Subsidiary</option>
                  <option value="external">External Partner</option>
                </select>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea name="description" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Organization description..."></textarea>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Risk Tolerance</label>
                <select name="riskTolerance" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select name="status" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            <div class="flex justify-end space-x-3 pt-6 border-t">
              <button type="button" onclick="closeAddOrgModal()" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
              <button type="submit" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"><i class="fas fa-building mr-2"></i>Create Organization</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeAddOrgModal() {
  const modal = document.getElementById('add-org-modal');
  if (modal) modal.remove();
}

async function handleAddOrganization(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const orgData = Object.fromEntries(formData.entries());
  
  // Simulate organization creation
  showToast('Organization created successfully!', 'success');
  closeAddOrgModal();
}

function showAddRiskOwnerModal() {
  const modalHTML = `
    <div id="add-risk-owner-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style="display: block;">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <div class="flex justify-between items-center pb-4 border-b">
            <h3 class="text-lg font-medium text-gray-900">Add Risk Owner</h3>
            <button onclick="closeAddRiskOwnerModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <form id="add-risk-owner-form" class="mt-6 space-y-6" onsubmit="handleAddRiskOwner(event)">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Select User *</label>
                <select name="userId" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select User</option>
                  <option value="1">John Doe (john@example.com)</option>
                  <option value="2">Jane Smith (jane@example.com)</option>
                  <option value="3">Bob Johnson (bob@example.com)</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Risk Categories *</label>
                <select name="categories" multiple class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="operational">Operational Risk</option>
                  <option value="financial">Financial Risk</option>
                  <option value="strategic">Strategic Risk</option>
                  <option value="compliance">Compliance Risk</option>
                  <option value="technology">Technology Risk</option>
                </select>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Responsibilities</label>
              <textarea name="responsibilities" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Describe risk owner responsibilities..."></textarea>
            </div>
            
            <div class="flex justify-end space-x-3 pt-6 border-t">
              <button type="button" onclick="closeAddRiskOwnerModal()" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
              <button type="submit" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"><i class="fas fa-user-shield mr-2"></i>Assign Risk Owner</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeAddRiskOwnerModal() {
  const modal = document.getElementById('add-risk-owner-modal');
  if (modal) modal.remove();
}

async function handleAddRiskOwner(event) {
  event.preventDefault();
  showToast('Risk owner assigned successfully!', 'success');
  closeAddRiskOwnerModal();
}

function editUser(userId) {
  // Get user data (in real app, fetch from API)
  const users = JSON.parse(localStorage.getItem('demo_users') || '[]');
  const user = users.find(u => u.id == userId) || {
    id: userId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    username: 'johndoe',
    role: 'analyst',
    department: 'IT Security',
    title: 'Security Analyst',
    phone: '+1 (555) 123-4567',
    status: 'active',
    organizationId: '1',
    mfaEnabled: false,
    emailNotifications: true
  };
  
  const modalHTML = `
    <div id="edit-user-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style="display: block;">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <div class="flex justify-between items-center pb-4 border-b">
            <h3 class="text-lg font-medium text-gray-900">Edit User</h3>
            <button onclick="closeEditUserModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <form id="edit-user-form" class="mt-6 space-y-6" onsubmit="handleEditUser(event, ${userId})">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
                <input type="text" name="firstName" value="${user.firstName}" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
                <input type="text" name="lastName" value="${user.lastName}" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input type="email" name="email" value="${user.email}" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                <input type="tel" name="phone" value="${user.phone || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <select name="role" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrator</option>
                  <option value="manager" ${user.role === 'manager' ? 'selected' : ''}>Manager</option>
                  <option value="analyst" ${user.role === 'analyst' ? 'selected' : ''}>Risk Analyst</option>
                  <option value="auditor" ${user.role === 'auditor' ? 'selected' : ''}>Auditor</option>
                  <option value="viewer" ${user.role === 'viewer' ? 'selected' : ''}>Viewer</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select name="status" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option>
                  <option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                  <option value="pending" ${user.status === 'pending' ? 'selected' : ''}>Pending</option>
                </select>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <input type="text" name="department" value="${user.department || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                <input type="text" name="title" value="${user.title || ''}" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
            
            <div>
              <label class="flex items-center">
                <input type="checkbox" name="mfaEnabled" ${user.mfaEnabled ? 'checked' : ''} class="form-checkbox">
                <span class="ml-2 text-sm text-gray-700">Enable Multi-Factor Authentication</span>
              </label>
              <label class="flex items-center mt-2">
                <input type="checkbox" name="emailNotifications" ${user.emailNotifications ? 'checked' : ''} class="form-checkbox">
                <span class="ml-2 text-sm text-gray-700">Send email notifications</span>
              </label>
            </div>
            
            <div class="flex justify-end space-x-3 pt-6 border-t">
              <button type="button" onclick="closeEditUserModal()" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
              <button type="button" onclick="resetUserPassword(${userId})" class="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-md hover:bg-yellow-700"><i class="fas fa-key mr-2"></i>Reset Password</button>
              <button type="submit" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"><i class="fas fa-save mr-2"></i>Update User</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeEditUserModal() {
  const modal = document.getElementById('edit-user-modal');
  if (modal) modal.remove();
}

async function handleEditUser(event, userId) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const userData = Object.fromEntries(formData.entries());
  
  // Add checkbox values
  userData.mfaEnabled = event.target.querySelector('[name="mfaEnabled"]').checked;
  userData.emailNotifications = event.target.querySelector('[name="emailNotifications"]').checked;
  
  showToast('User updated successfully!', 'success');
  closeEditUserModal();
  
  // Add notification
  if (typeof notificationManager !== 'undefined' && notificationManager.isInitialized) {
    notificationManager.addNotificationFromToast(
      `User "${userData.firstName} ${userData.lastName}" has been updated`,
      'success',
      'User Management'
    );
  }
}

function resetUserPassword(userId) {
  const newPassword = generateRandomPassword();
  
  const modalHTML = `
    <div id="password-reset-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style="display: block;">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/3 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <div class="flex justify-between items-center pb-4 border-b">
            <h3 class="text-lg font-medium text-gray-900">Password Reset</h3>
            <button onclick="closePasswordResetModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <div class="mt-6">
            <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-yellow-700">
                    A new temporary password has been generated. Please share this securely with the user.
                  </p>
                </div>
              </div>
            </div>
            
            <div class="bg-gray-50 rounded-lg p-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">New Temporary Password</label>
              <div class="flex items-center space-x-2">
                <input type="text" id="temp-password" value="${newPassword}" readonly class="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-md font-mono text-lg">
                <button onclick="copyToClipboard('temp-password')" class="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  <i class="fas fa-copy"></i>
                </button>
              </div>
            </div>
            
            <div class="mt-4">
              <label class="flex items-center">
                <input type="checkbox" id="force-change" checked class="form-checkbox">
                <span class="ml-2 text-sm text-gray-700">Force password change on next login</span>
              </label>
              <label class="flex items-center mt-2">
                <input type="checkbox" id="send-email" checked class="form-checkbox">
                <span class="ml-2 text-sm text-gray-700">Send password reset email to user</span>
              </label>
            </div>
          </div>
          
          <div class="flex justify-end space-x-3 pt-6 border-t mt-6">
            <button type="button" onclick="closePasswordResetModal()" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Close</button>
            <button type="button" onclick="confirmPasswordReset(${userId})" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"><i class="fas fa-check mr-2"></i>Confirm Reset</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closePasswordResetModal() {
  const modal = document.getElementById('password-reset-modal');
  if (modal) modal.remove();
}

function generateRandomPassword() {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

function copyToClipboard(elementId) {
  const element = document.getElementById(elementId);
  element.select();
  document.execCommand('copy');
  showToast('Password copied to clipboard!', 'success');
}

function confirmPasswordReset(userId) {
  const forceChange = document.getElementById('force-change').checked;
  const sendEmail = document.getElementById('send-email').checked;
  
  showToast('Password reset successfully!', 'success');
  closePasswordResetModal();
  
  if (typeof notificationManager !== 'undefined' && notificationManager.isInitialized) {
    notificationManager.addNotificationFromToast(
      `Password reset for user ID ${userId}`,
      'success',
      'User Management'
    );
  }
}

function deleteUser(userId) {
  const confirmModalHTML = `
    <div id="delete-user-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style="display: block;">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/3 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <div class="flex justify-between items-center pb-4 border-b">
            <h3 class="text-lg font-medium text-gray-900">Confirm User Deletion</h3>
            <button onclick="closeDeleteUserModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <div class="mt-6">
            <div class="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <i class="fas fa-exclamation-triangle text-red-400"></i>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-red-700">
                    <strong>Warning:</strong> This action cannot be undone. All user data, including associated risks, assessments, and activity history will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>
            
            <p class="text-gray-700 mb-4">Are you sure you want to delete this user account?</p>
            
            <div class="bg-gray-50 rounded-lg p-3">
              <p class="text-sm"><strong>User ID:</strong> ${userId}</p>
              <p class="text-sm"><strong>Action:</strong> Permanent deletion</p>
            </div>
          </div>
          
          <div class="flex justify-end space-x-3 pt-6 border-t mt-6">
            <button type="button" onclick="closeDeleteUserModal()" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
            <button type="button" onclick="confirmDeleteUser(${userId})" class="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700"><i class="fas fa-trash mr-2"></i>Delete User</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', confirmModalHTML);
}

function closeDeleteUserModal() {
  const modal = document.getElementById('delete-user-modal');
  if (modal) modal.remove();
}

function confirmDeleteUser(userId) {
  // Simulate user deletion
  showToast('User deleted successfully!', 'success');
  closeDeleteUserModal();
  
  if (typeof notificationManager !== 'undefined' && notificationManager.isInitialized) {
    notificationManager.addNotificationFromToast(
      `User ID ${userId} has been deleted`,
      'warning',
      'User Management'
    );
  }
}

// SAML functions removed - using original implementations from enterprise-modules.js