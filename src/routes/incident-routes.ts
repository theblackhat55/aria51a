import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { baseLayout } from '../templates/layout';
import { DatabaseService } from '../lib/database';
import type { CloudflareBindings } from '../types';

export function createIncidentRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware
  app.use('*', requireAuth);
  
  // Main incidents page
  app.get('/', async (c) => {
    const user = c.get('user');
    const db = new DatabaseService(c.env.DB);
    
    return c.html(
      baseLayout({
        title: 'Incident Management',
        user,
        content: renderIncidentsPage()
      })
    );
  });
  
  // Create incident form
  app.get('/create', async (c) => {
    const user = c.get('user');
    
    return c.html(
      baseLayout({
        title: 'Report Incident',
        user,
        content: renderCreateIncidentForm()
      })
    );
  });
  
  // Create incident action
  app.post('/', async (c) => {
    const formData = await c.req.parseBody();
    const user = c.get('user');
    const db = new DatabaseService(c.env.DB);
    
    try {
      // Create incident in database
      const incident = await db.createIncident({
        title: String(formData.title || ''),
        description: String(formData.description || ''),
        severity: String(formData.severity || 'medium'),
        status: 'open',
        reported_by: user.id,
        category: String(formData.category || 'security')
      });
      
      // Redirect to incidents page with success message
      return c.redirect('/incidents?success=created');
    } catch (error) {
      console.error('Error creating incident:', error);
      return c.html(
        baseLayout({
          title: 'Report Incident',
          user,
          content: renderCreateIncidentForm('Failed to create incident. Please try again.')
        })
      );
    }
  });
  
  return app;
}

// Template functions
const renderIncidentsPage = () => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8 flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Incident Management</h1>
          <p class="text-gray-600 mt-1">Track and manage security incidents</p>
        </div>
        <a href="/incidents/create" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
          <i class="fas fa-plus mr-2"></i>Report Incident
        </a>
      </div>
      
      <!-- Incident Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Open Incidents</p>
              <p class="text-2xl font-bold text-gray-900">3</p>
            </div>
            <div class="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <i class="fas fa-fire text-red-600"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">In Progress</p>
              <p class="text-2xl font-bold text-gray-900">5</p>
            </div>
            <div class="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <i class="fas fa-spinner text-yellow-600"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Resolved</p>
              <p class="text-2xl font-bold text-gray-900">12</p>
            </div>
            <div class="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <i class="fas fa-check-circle text-green-600"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Critical</p>
              <p class="text-2xl font-bold text-gray-900">1</p>
            </div>
            <div class="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
              <i class="fas fa-exclamation-circle text-purple-600"></i>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Incidents Table -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Recent Incidents</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">INC-001</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Unauthorized Access Attempt</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">Critical</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Open</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2025-09-03</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <a href="#" class="text-blue-600 hover:text-blue-900">View</a>
                </td>
              </tr>
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">INC-002</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Data Leak Prevention Alert</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-orange-100 text-orange-800">High</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">In Progress</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2025-09-02</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <a href="#" class="text-blue-600 hover:text-blue-900">View</a>
                </td>
              </tr>
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">INC-003</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Phishing Email Reported</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Medium</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Resolved</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2025-09-01</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <a href="#" class="text-blue-600 hover:text-blue-900">View</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
`;

const renderCreateIncidentForm = (error?: string) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Report New Incident</h1>
        <p class="text-gray-600 mt-1">Document security incidents for tracking and resolution</p>
      </div>
      
      ${error ? html`
        <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p class="text-red-700">${error}</p>
        </div>
      ` : ''}
      
      <div class="bg-white rounded-lg shadow p-6">
        <form method="POST" action="/incidents">
          <div class="space-y-6">
            <div>
              <label for="title" class="block text-sm font-medium text-gray-700">Incident Title</label>
              <input type="text" name="title" id="title" required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
            </div>
            
            <div>
              <label for="category" class="block text-sm font-medium text-gray-700">Category</label>
              <select name="category" id="category" required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option value="security">Security Breach</option>
                <option value="data">Data Loss</option>
                <option value="access">Unauthorized Access</option>
                <option value="malware">Malware/Virus</option>
                <option value="phishing">Phishing</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label for="severity" class="block text-sm font-medium text-gray-700">Severity</label>
              <select name="severity" id="severity" required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
              <textarea name="description" id="description" rows="4" required
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="Provide detailed description of the incident..."></textarea>
            </div>
            
            <div class="flex justify-end space-x-3">
              <a href="/incidents" class="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
                Cancel
              </a>
              <button type="submit" class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                <i class="fas fa-exclamation-triangle mr-2"></i>Report Incident
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
`;