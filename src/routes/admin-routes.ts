import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth, requireAdmin } from './auth-routes';
import { baseLayout } from '../templates/layout';

import type { CloudflareBindings } from '../types';

export function createAdminRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication and admin middleware
  app.use('*', requireAuth);
  app.use('*', requireAdmin);
  
  // Main admin/settings page
  app.get('/', async (c) => {
    const user = c.get('user');
    return c.redirect('/admin/settings');
  });
  
  // Settings page
  app.get('/settings', async (c) => {
    const user = c.get('user');
    return c.html(
      baseLayout({
        title: 'Admin Settings',
        user,
        content: html`
          <div class="min-h-screen bg-gray-50 py-8">
            <div class="max-w-7xl mx-auto px-4">
              <h1 class="text-3xl font-bold text-gray-900 mb-8">System Settings</h1>
              
              <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- SAML Configuration -->
                <div class="bg-white rounded-lg shadow p-6">
                  <h2 class="text-lg font-semibold mb-4">
                    <i class="fas fa-key text-blue-600 mr-2"></i>SAML Configuration
                  </h2>
                  <p class="text-gray-600 mb-4">Configure enterprise SSO settings</p>
                  <button class="text-blue-600 hover:text-blue-700 font-medium">
                    Configure →
                  </button>
                </div>
                
                <!-- Organizations -->
                <div class="bg-white rounded-lg shadow p-6">
                  <h2 class="text-lg font-semibold mb-4">
                    <i class="fas fa-building text-green-600 mr-2"></i>Organizations
                  </h2>
                  <p class="text-gray-600 mb-4">Manage organization registry</p>
                  <button class="text-blue-600 hover:text-blue-700 font-medium"
                          hx-get="/admin/organizations"
                          hx-target="#main-content"
                          hx-push-url="true">
                    Manage →
                  </button>
                </div>
                
                <!-- Users -->
                <div class="bg-white rounded-lg shadow p-6">
                  <h2 class="text-lg font-semibold mb-4">
                    <i class="fas fa-users text-purple-600 mr-2"></i>Users
                  </h2>
                  <p class="text-gray-600 mb-4">Manage user accounts and roles</p>
                  <button class="text-blue-600 hover:text-blue-700 font-medium"
                          hx-get="/admin/users"
                          hx-target="#main-content"
                          hx-push-url="true">
                    Manage →
                  </button>
                </div>
              </div>
            </div>
          </div>
        `
      })
    );
  });
  
  // Users management page
  app.get('/users', async (c) => {
    const user = c.get('user');
    const db = c.env?.DB;
    
    // Mock user data (in production, fetch from database)
    const users = [
      { id: 1, username: 'admin', name: 'Admin User', email: 'admin@aria5.com', role: 'admin', status: 'active', lastLogin: '2024-09-03' },
      { id: 2, username: 'avi_security', name: 'Avi Security', email: 'avi@aria5.com', role: 'security_manager', status: 'active', lastLogin: '2024-09-02' },
      { id: 3, username: 'john_analyst', name: 'John Analyst', email: 'john@aria5.com', role: 'analyst', status: 'active', lastLogin: '2024-09-01' },
      { id: 4, username: 'sarah_auditor', name: 'Sarah Auditor', email: 'sarah@aria5.com', role: 'auditor', status: 'inactive', lastLogin: '2024-08-15' }
    ];
    
    return c.html(
      baseLayout({
        title: 'User Management',
        user,
        content: html`
          <div class="min-h-screen bg-gray-50 py-8">
            <div class="max-w-7xl mx-auto px-4">
              <!-- Header -->
              <div class="flex justify-between items-center mb-8">
                <h1 class="text-3xl font-bold text-gray-900">User Management</h1>
                <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                        hx-get="/admin/users/create"
                        hx-target="#modal-container"
                        hx-swap="innerHTML">
                  <i class="fas fa-plus mr-2"></i>Add User
                </button>
              </div>
              
              <!-- Stats Cards -->
              <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow p-6">
                  <div class="flex items-center">
                    <div class="p-3 rounded-full bg-blue-100">
                      <i class="fas fa-users text-blue-600"></i>
                    </div>
                    <div class="ml-4">
                      <p class="text-sm font-medium text-gray-600">Total Users</p>
                      <p class="text-2xl font-bold text-gray-900">${users.length}</p>
                    </div>
                  </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                  <div class="flex items-center">
                    <div class="p-3 rounded-full bg-green-100">
                      <i class="fas fa-check-circle text-green-600"></i>
                    </div>
                    <div class="ml-4">
                      <p class="text-sm font-medium text-gray-600">Active Users</p>
                      <p class="text-2xl font-bold text-gray-900">${users.filter(u => u.status === 'active').length}</p>
                    </div>
                  </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                  <div class="flex items-center">
                    <div class="p-3 rounded-full bg-yellow-100">
                      <i class="fas fa-shield-alt text-yellow-600"></i>
                    </div>
                    <div class="ml-4">
                      <p class="text-sm font-medium text-gray-600">Admins</p>
                      <p class="text-2xl font-bold text-gray-900">${users.filter(u => u.role === 'admin').length}</p>
                    </div>
                  </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                  <div class="flex items-center">
                    <div class="p-3 rounded-full bg-red-100">
                      <i class="fas fa-user-times text-red-600"></i>
                    </div>
                    <div class="ml-4">
                      <p class="text-sm font-medium text-gray-600">Inactive</p>
                      <p class="text-2xl font-bold text-gray-900">${users.filter(u => u.status === 'inactive').length}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Users Table -->
              <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200">
                  <h2 class="text-lg font-semibold text-gray-900">Users</h2>
                </div>
                <div class="overflow-x-auto">
                  <table class="min-w-full divide-y divide-gray-200">
                    <thead class="bg-gray-50">
                      <tr>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                        <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      ${users.map(u => html`
                        <tr>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <div class="flex items-center">
                              <div class="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <i class="fas fa-user text-gray-600"></i>
                              </div>
                              <div class="ml-4">
                                <div class="text-sm font-medium text-gray-900">${u.name}</div>
                                <div class="text-sm text-gray-500">${u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                              u.role === 'admin' ? 'bg-red-100 text-red-800' :
                              u.role === 'security_manager' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }">
                              ${u.role.replace('_', ' ').toUpperCase()}
                            </span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap">
                            <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                              u.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }">
                              ${u.status.toUpperCase()}
                            </span>
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${u.lastLogin}
                          </td>
                          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button class="text-blue-600 hover:text-blue-700">
                              <i class="fas fa-edit mr-1"></i>Edit
                            </button>
                            <button class="text-red-600 hover:text-red-700">
                              <i class="fas fa-trash mr-1"></i>Delete
                            </button>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Modal Container -->
          <div id="modal-container"></div>
        `
      })
    );
  });
  
  // Organizations management page
  app.get('/organizations', async (c) => {
    const user = c.get('user');
    const db = c.env?.DB;
    
    // Mock organization data (in production, fetch from database)
    const organizations = [
      { id: 1, name: 'ARIA5 Corporation', domain: 'aria5.com', users: 45, risks: 23, compliance: 85, status: 'active' },
      { id: 2, name: 'Demo Organization', domain: 'demo.com', users: 12, risks: 8, compliance: 72, status: 'active' },
      { id: 3, name: 'Test Corp', domain: 'test.com', users: 5, risks: 3, compliance: 60, status: 'inactive' }
    ];
    
    return c.html(
      baseLayout({
        title: 'Organization Management',
        user,
        content: html`
          <div class="min-h-screen bg-gray-50 py-8">
            <div class="max-w-7xl mx-auto px-4">
              <!-- Header -->
              <div class="flex justify-between items-center mb-8">
                <h1 class="text-3xl font-bold text-gray-900">Organization Management</h1>
                <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  <i class="fas fa-plus mr-2"></i>Add Organization
                </button>
              </div>
              
              <!-- Stats Overview -->
              <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow p-6">
                  <div class="flex items-center">
                    <div class="p-3 rounded-full bg-blue-100">
                      <i class="fas fa-building text-blue-600"></i>
                    </div>
                    <div class="ml-4">
                      <p class="text-sm font-medium text-gray-600">Total Organizations</p>
                      <p class="text-2xl font-bold text-gray-900">${organizations.length}</p>
                    </div>
                  </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                  <div class="flex items-center">
                    <div class="p-3 rounded-full bg-green-100">
                      <i class="fas fa-users text-green-600"></i>
                    </div>
                    <div class="ml-4">
                      <p class="text-sm font-medium text-gray-600">Total Users</p>
                      <p class="text-2xl font-bold text-gray-900">${organizations.reduce((sum, org) => sum + org.users, 0)}</p>
                    </div>
                  </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                  <div class="flex items-center">
                    <div class="p-3 rounded-full bg-red-100">
                      <i class="fas fa-exclamation-triangle text-red-600"></i>
                    </div>
                    <div class="ml-4">
                      <p class="text-sm font-medium text-gray-600">Total Risks</p>
                      <p class="text-2xl font-bold text-gray-900">${organizations.reduce((sum, org) => sum + org.risks, 0)}</p>
                    </div>
                  </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                  <div class="flex items-center">
                    <div class="p-3 rounded-full bg-yellow-100">
                      <i class="fas fa-chart-line text-yellow-600"></i>
                    </div>
                    <div class="ml-4">
                      <p class="text-sm font-medium text-gray-600">Avg Compliance</p>
                      <p class="text-2xl font-bold text-gray-900">${Math.round(organizations.reduce((sum, org) => sum + org.compliance, 0) / organizations.length)}%</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Organizations Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${organizations.map(org => html`
                  <div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
                    <div class="p-6">
                      <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center">
                          <div class="h-12 w-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                            <i class="fas fa-building text-white"></i>
                          </div>
                          <div class="ml-3">
                            <h3 class="text-lg font-semibold text-gray-900">${org.name}</h3>
                            <p class="text-sm text-gray-500">${org.domain}</p>
                          </div>
                        </div>
                        <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                          org.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }">
                          ${org.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div class="space-y-3">
                        <div class="flex justify-between items-center">
                          <span class="text-sm text-gray-600">Users</span>
                          <span class="font-semibold text-gray-900">${org.users}</span>
                        </div>
                        <div class="flex justify-between items-center">
                          <span class="text-sm text-gray-600">Risks</span>
                          <span class="font-semibold text-gray-900">${org.risks}</span>
                        </div>
                        <div class="flex justify-between items-center">
                          <span class="text-sm text-gray-600">Compliance Score</span>
                          <div class="flex items-center">
                            <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div class="bg-blue-600 h-2 rounded-full" style="width: ${org.compliance}%"></div>
                            </div>
                            <span class="text-sm font-semibold">${org.compliance}%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div class="mt-6 flex space-x-2">
                        <button class="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
                          <i class="fas fa-eye mr-1"></i>View
                        </button>
                        <button class="flex-1 px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm">
                          <i class="fas fa-edit mr-1"></i>Edit
                        </button>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `
      })
    );
  });
  
  return app;
}