import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth, requireAdmin } from './auth-routes';
import { baseLayout } from '../templates/layout';

export function createAdminRoutes() {
  const app = new Hono();
  
  // Apply authentication and admin middleware
  app.use('*', requireAuth);
  app.use('*', requireAdmin);
  
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
    return c.html(
      baseLayout({
        title: 'User Management',
        user,
        content: html`
          <div class="min-h-screen bg-gray-50 py-8">
            <div class="max-w-7xl mx-auto px-4">
              <h1 class="text-3xl font-bold text-gray-900 mb-8">User Management</h1>
              <div class="bg-white rounded-lg shadow p-6">
                <p class="text-gray-500">User management interface coming soon...</p>
              </div>
            </div>
          </div>
        `
      })
    );
  });
  
  // Organizations management page
  app.get('/organizations', async (c) => {
    const user = c.get('user');
    return c.html(
      baseLayout({
        title: 'Organization Management',
        user,
        content: html`
          <div class="min-h-screen bg-gray-50 py-8">
            <div class="max-w-7xl mx-auto px-4">
              <h1 class="text-3xl font-bold text-gray-900 mb-8">Organization Management</h1>
              <div class="bg-white rounded-lg shadow p-6">
                <p class="text-gray-500">Organization management interface coming soon...</p>
              </div>
            </div>
          </div>
        `
      })
    );
  });
  
  return app;
}