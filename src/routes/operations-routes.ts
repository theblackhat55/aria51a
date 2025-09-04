import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import type { CloudflareBindings } from '../types';

export function createOperationsRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware to all routes
  app.use('*', requireAuth);
  
  // Main operations page
  app.get('/', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Operations',
        user,
        content: renderOperationsPage(user)
      })
    );
  });
  
  // Operations sections
  app.get('/monitoring', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Operations Monitoring',
        user,
        content: renderMonitoringPage(user)
      })
    );
  });
  
  app.get('/incidents', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Incident Management',
        user,
        content: renderIncidentsPage(user)
      })
    );
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

const renderIncidentsPage = (user: any) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Incident Management</h1>
      
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600">Incident management system coming soon...</p>
        
        <div class="mt-4">
          <a href="/operations" class="text-blue-600 hover:text-blue-500">← Back to Operations</a>
        </div>
      </div>
    </div>
  </div>
`;