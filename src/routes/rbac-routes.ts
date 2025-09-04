/**
 * RBAC (Role-Based Access Control) Routes
 * 
 * Provides endpoints for managing roles, permissions, and user access control.
 */

import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { RBACService, AccessRequest } from '../services/rbac-service';

const rbacRoutes = new Hono<{ Bindings: { DB: D1Database } }>();

// Helper function to get current user
async function getCurrentUser(c: any) {
  const sessionId = getCookie(c, 'session_id');
  if (!sessionId) return null;
  
  const session = await c.env.DB.prepare(`
    SELECT u.* FROM users u 
    JOIN user_sessions s ON u.id = s.user_id 
    WHERE s.session_id = ? AND s.expires_at > datetime('now')
  `).bind(sessionId).first();
  
  return session;
}

// Helper function to check RBAC access
async function checkAccess(c: any, resource: string, action: string, resourceId?: string) {
  const user = await getCurrentUser(c);
  if (!user) return { granted: false, reason: 'Not authenticated' };
  
  const rbac = new RBACService(c.env.DB);
  const request: AccessRequest = {
    user_id: (user as any).id,
    resource,
    action,
    resource_id: resourceId
  };
  
  return await rbac.checkAccess(request, {
    ip: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
    userAgent: c.req.header('User-Agent')
  });
}

/**
 * RBAC Dashboard - Main management interface
 */
rbacRoutes.get('/rbac', async (c) => {
  const access = await checkAccess(c, 'system', 'admin');
  if (!access.granted) {
    return c.html(`
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 class="text-red-800 font-medium">Access Denied</h3>
        <p class="text-red-600">You don't have permission to access RBAC management.</p>
      </div>
    `);
  }

  const rbac = new RBACService(c.env.DB);
  await rbac.initializeTables();
  
  const stats = await rbac.getRoleStatistics();

  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>RBAC Management - ARIA5-Ubuntu</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://unpkg.com/htmx.org@1.9.10"></script>
      <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
      <div class="min-h-screen">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-4">
              <div class="flex items-center space-x-4">
                <a href="/" class="text-blue-600 hover:text-blue-800">
                  <i class="fas fa-arrow-left"></i> Back to Dashboard
                </a>
                <h1 class="text-2xl font-bold text-gray-900">
                  <i class="fas fa-shield-alt mr-2"></i>
                  RBAC Management
                </h1>
              </div>
            </div>
          </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <!-- Statistics Cards -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="p-2 bg-blue-500 rounded-lg">
                  <i class="fas fa-users text-white"></i>
                </div>
                <div class="ml-4">
                  <h3 class="text-sm font-medium text-gray-500">Total Roles</h3>
                  <p class="text-2xl font-semibold text-gray-900">${stats.totalRoles}</p>
                </div>
              </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="p-2 bg-green-500 rounded-lg">
                  <i class="fas fa-key text-white"></i>
                </div>
                <div class="ml-4">
                  <h3 class="text-sm font-medium text-gray-500">Permissions</h3>
                  <p class="text-2xl font-semibold text-gray-900">${stats.totalPermissions}</p>
                </div>
              </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="p-2 bg-yellow-500 rounded-lg">
                  <i class="fas fa-user-check text-white"></i>
                </div>
                <div class="ml-4">
                  <h3 class="text-sm font-medium text-gray-500">Active Assignments</h3>
                  <p class="text-2xl font-semibold text-gray-900">${stats.activeUserRoles}</p>
                </div>
              </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="p-2 bg-purple-500 rounded-lg">
                  <i class="fas fa-chart-line text-white"></i>
                </div>
                <div class="ml-4">
                  <h3 class="text-sm font-medium text-gray-500">24h Access</h3>
                  <p class="text-2xl font-semibold text-gray-900">${stats.recentAccess}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Navigation Tabs -->
          <div class="bg-white rounded-lg shadow mb-6">
            <div class="border-b border-gray-200">
              <nav class="-mb-px flex space-x-8" aria-label="Tabs">
                <button class="rbac-tab py-4 px-6 border-b-2 border-blue-500 font-medium text-sm text-blue-600" 
                        onclick="showTab('roles')" data-tab="roles">
                  <i class="fas fa-users mr-2"></i>Roles
                </button>
                <button class="rbac-tab py-4 px-6 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700" 
                        onclick="showTab('permissions')" data-tab="permissions">
                  <i class="fas fa-key mr-2"></i>Permissions
                </button>
                <button class="rbac-tab py-4 px-6 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700" 
                        onclick="showTab('users')" data-tab="users">
                  <i class="fas fa-user-cog mr-2"></i>User Assignments
                </button>
                <button class="rbac-tab py-4 px-6 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700" 
                        onclick="showTab('audit')" data-tab="audit">
                  <i class="fas fa-clipboard-list mr-2"></i>Access Audit
                </button>
              </nav>
            </div>

            <!-- Tab Content -->
            <div id="tab-content" class="p-6">
              <div id="roles-content">
                <div hx-get="/rbac/roles" hx-trigger="load" hx-target="#roles-list">
                  <div class="text-center py-8">
                    <i class="fas fa-spinner fa-spin text-gray-400 text-2xl"></i>
                    <p class="text-gray-500 mt-2">Loading roles...</p>
                  </div>
                </div>
                <div id="roles-list"></div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <script>
        function showTab(tabName) {
          // Update tab buttons
          document.querySelectorAll('.rbac-tab').forEach(tab => {
            tab.classList.remove('border-blue-500', 'text-blue-600');
            tab.classList.add('border-transparent', 'text-gray-500');
          });
          
          document.querySelector(\`[data-tab="\${tabName}"]\`).classList.remove('border-transparent', 'text-gray-500');
          document.querySelector(\`[data-tab="\${tabName}"]\`).classList.add('border-blue-500', 'text-blue-600');
          
          // Load content
          const content = document.getElementById('tab-content');
          
          switch(tabName) {
            case 'roles':
              content.innerHTML = \`
                <div hx-get="/rbac/roles" hx-trigger="load" hx-target="#roles-list">
                  <div class="text-center py-8">
                    <i class="fas fa-spinner fa-spin text-gray-400 text-2xl"></i>
                    <p class="text-gray-500 mt-2">Loading roles...</p>
                  </div>
                </div>
                <div id="roles-list"></div>
              \`;
              htmx.process(content);
              break;
              
            case 'permissions':
              content.innerHTML = \`
                <div hx-get="/rbac/permissions" hx-trigger="load">
                  <div class="text-center py-8">
                    <i class="fas fa-spinner fa-spin text-gray-400 text-2xl"></i>
                    <p class="text-gray-500 mt-2">Loading permissions...</p>
                  </div>
                </div>
              \`;
              htmx.process(content);
              break;
              
            case 'users':
              content.innerHTML = \`
                <div hx-get="/rbac/user-assignments" hx-trigger="load">
                  <div class="text-center py-8">
                    <i class="fas fa-spinner fa-spin text-gray-400 text-2xl"></i>
                    <p class="text-gray-500 mt-2">Loading user assignments...</p>
                  </div>
                </div>
              \`;
              htmx.process(content);
              break;
              
            case 'audit':
              content.innerHTML = \`
                <div hx-get="/rbac/audit" hx-trigger="load">
                  <div class="text-center py-8">
                    <i class="fas fa-spinner fa-spin text-gray-400 text-2xl"></i>
                    <p class="text-gray-500 mt-2">Loading audit logs...</p>
                  </div>
                </div>
              \`;
              htmx.process(content);
              break;
          }
        }
      </script>
    </body>
    </html>
  `);
});

/**
 * Get all roles
 */
rbacRoutes.get('/rbac/roles', async (c) => {
  const access = await checkAccess(c, 'system', 'admin');
  if (!access.granted) {
    return c.html('<div class="text-red-600">Access denied</div>');
  }

  const roles = await c.env.DB.prepare(`
    SELECT r.*, 
           COUNT(ur.user_id) as user_count,
           GROUP_CONCAT(p.name) as permissions
    FROM rbac_roles r
    LEFT JOIN rbac_user_roles ur ON r.id = ur.role_id AND ur.is_active = TRUE
    LEFT JOIN rbac_role_permissions rp ON r.id = rp.role_id
    LEFT JOIN rbac_permissions p ON rp.permission_id = p.id
    GROUP BY r.id
    ORDER BY r.level DESC, r.name
  `).all();

  return c.html(`
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-semibold">Role Management</h2>
        <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                hx-get="/rbac/roles/create" hx-target="#role-form-modal" hx-swap="innerHTML">
          <i class="fas fa-plus mr-2"></i>Create Role
        </button>
      </div>

      <div class="grid gap-4">
        ${(roles.results as any[]).map(role => `
          <div class="bg-gray-50 rounded-lg p-4 border">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center space-x-2">
                  <h3 class="font-semibold text-gray-900">${role.name}</h3>
                  <span class="px-2 py-1 text-xs rounded-full ${role.is_system ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'}">
                    ${role.is_system ? 'System' : 'Custom'} - Level ${role.level}
                  </span>
                </div>
                <p class="text-gray-600 mt-1">${role.description || 'No description'}</p>
                <div class="mt-2">
                  <span class="text-sm text-gray-500">
                    <i class="fas fa-users mr-1"></i>${role.user_count} users assigned
                  </span>
                </div>
              </div>
              <div class="flex space-x-2">
                <button class="text-blue-600 hover:text-blue-800"
                        hx-get="/rbac/roles/${role.id}/permissions" hx-target="#role-permissions-modal" hx-swap="innerHTML">
                  <i class="fas fa-key"></i>
                </button>
                ${!role.is_system ? `
                  <button class="text-green-600 hover:text-green-800"
                          hx-get="/rbac/roles/${role.id}/edit" hx-target="#role-form-modal" hx-swap="innerHTML">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="text-red-600 hover:text-red-800"
                          hx-delete="/rbac/roles/${role.id}" hx-confirm="Are you sure?">
                    <i class="fas fa-trash"></i>
                  </button>
                ` : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Modals -->
    <div id="role-form-modal"></div>
    <div id="role-permissions-modal"></div>
  `);
});

/**
 * Get all permissions
 */
rbacRoutes.get('/rbac/permissions', async (c) => {
  const access = await checkAccess(c, 'system', 'admin');
  if (!access.granted) {
    return c.html('<div class="text-red-600">Access denied</div>');
  }

  const permissions = await c.env.DB.prepare(`
    SELECT p.*, COUNT(rp.role_id) as role_count
    FROM rbac_permissions p
    LEFT JOIN rbac_role_permissions rp ON p.id = rp.permission_id
    GROUP BY p.id
    ORDER BY p.resource, p.action
  `).all();

  // Group by resource
  const grouped = (permissions.results as any[]).reduce((acc, perm) => {
    if (!acc[perm.resource]) acc[perm.resource] = [];
    acc[perm.resource].push(perm);
    return acc;
  }, {} as Record<string, any[]>);

  return c.html(`
    <div class="space-y-6">
      <h2 class="text-lg font-semibold">Permission Overview</h2>
      
      ${Object.entries(grouped).map(([resource, perms]) => `
        <div class="bg-gray-50 rounded-lg p-4">
          <h3 class="font-semibold text-gray-900 mb-3 capitalize">
            <i class="fas fa-shield-alt mr-2"></i>${resource} Resource
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            ${perms.map(perm => `
              <div class="bg-white rounded p-3 border">
                <div class="flex justify-between items-center">
                  <code class="text-sm font-mono text-blue-600">${perm.action}</code>
                  <span class="text-xs text-gray-500">${perm.role_count} roles</span>
                </div>
                <p class="text-sm text-gray-600 mt-1">${perm.description}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `);
});

/**
 * Get user role assignments
 */
rbacRoutes.get('/rbac/user-assignments', async (c) => {
  const access = await checkAccess(c, 'users', 'manage_roles');
  if (!access.granted) {
    return c.html('<div class="text-red-600">Access denied</div>');
  }

  const assignments = await c.env.DB.prepare(`
    SELECT u.email, u.name, r.name as role_name, r.level,
           ur.granted_at, ur.expires_at, ur.is_active,
           (SELECT email FROM users WHERE id = ur.granted_by) as granted_by_email
    FROM rbac_user_roles ur
    JOIN users u ON ur.user_id = u.id
    JOIN rbac_roles r ON ur.role_id = r.id
    ORDER BY u.name, r.level DESC
  `).all();

  const users = await c.env.DB.prepare(`
    SELECT id, email, name FROM users ORDER BY name
  `).all();

  return c.html(`
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h2 class="text-lg font-semibold">User Role Assignments</h2>
        <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                hx-get="/rbac/user-assignments/assign" hx-target="#assignment-modal" hx-swap="innerHTML">
          <i class="fas fa-plus mr-2"></i>Assign Role
        </button>
      </div>

      <div class="bg-white rounded-lg border overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Level</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Granted By</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            ${(assignments.results as any[]).map(assignment => `
              <tr>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <i class="fas fa-user text-gray-600 text-sm"></i>
                    </div>
                    <div class="ml-3">
                      <div class="text-sm font-medium text-gray-900">${assignment.name}</div>
                      <div class="text-sm text-gray-500">${assignment.email}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${assignment.role_name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${assignment.level}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  ${assignment.is_active ? 
                    '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Active</span>' :
                    '<span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Inactive</span>'
                  }
                  ${assignment.expires_at ? 
                    `<div class="text-xs text-gray-500 mt-1">Expires: ${new Date(assignment.expires_at).toLocaleDateString()}</div>` : 
                    ''
                  }
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${assignment.granted_by_email || 'System'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button class="text-red-600 hover:text-red-800"
                          hx-delete="/rbac/user-assignments/remove" 
                          hx-vals='{"user_email": "${assignment.email}", "role_name": "${assignment.role_name}"}'
                          hx-confirm="Remove role from user?">
                    Remove
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div id="assignment-modal"></div>
  `);
});

/**
 * Get access audit logs
 */
rbacRoutes.get('/rbac/audit', async (c) => {
  const access = await checkAccess(c, 'system', 'audit');
  if (!access.granted) {
    return c.html('<div class="text-red-600">Access denied</div>');
  }

  const rbac = new RBACService(c.env.DB);
  const logs = await rbac.getAccessLogs({ limit: 50 });

  return c.html(`
    <div class="space-y-4">
      <h2 class="text-lg font-semibold">Access Audit Logs</h2>
      
      <div class="bg-white rounded-lg border overflow-hidden">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resource</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Result</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            ${logs.logs.map((log: any) => `
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${new Date(log.timestamp).toLocaleString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${log.user_email || 'Unknown'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <code class="text-blue-600">${log.resource}</code>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <code class="text-green-600">${log.action}</code>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  ${log.granted ? 
                    '<span class="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Granted</span>' :
                    '<span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Denied</span>'
                  }
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${log.reason}
                  ${log.role_used ? `<div class="text-xs text-blue-600">via ${log.role_used}</div>` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `);
});

/**
 * Check user access (API endpoint)
 */
rbacRoutes.post('/rbac/check-access', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Not authenticated' }, 401);
  }

  const { resource, action, resourceId } = await c.req.json();
  
  const rbac = new RBACService(c.env.DB);
  const request: AccessRequest = {
    user_id: (user as any).id,
    resource,
    action,
    resource_id: resourceId
  };
  
  const result = await rbac.checkAccess(request, {
    ip: c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For'),
    userAgent: c.req.header('User-Agent')
  });
  
  return c.json(result);
});

export { rbacRoutes };