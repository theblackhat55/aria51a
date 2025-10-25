/**
 * Integration Sync Dashboard Routes
 * Week 6 UI - Monitor and manage integration sync jobs
 */

import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import type { CloudflareBindings } from '../types';

export function createSyncDashboardRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  app.use('*', requireAuth);
  
  // Sync Dashboard Main Page
  app.get('/', async (c) => {
    const user = c.get('user');
    return c.html(cleanLayout({
      title: 'Integration Sync Dashboard',
      user,
      content: renderSyncDashboard()
    }));
  });
  
  // API: Get all sync jobs
  app.get('/api/sync-jobs', async (c) => {
    try {
      const user = c.get('user');
      const result = await c.env.DB.prepare(`
        SELECT * FROM incident_sync_jobs
        WHERE organization_id = ?
        ORDER BY created_at DESC
        LIMIT 50
      `).bind(user.organizationId || 1).all();
      
      return c.json({ success: true, jobs: result.results || [] });
    } catch (error) {
      return c.json({ success: false, error: 'Failed to fetch sync jobs' }, 500);
    }
  });
  
  // API: Trigger MS Defender sync
  app.post('/api/sync/ms-defender', async (c) => {
    try {
      const response = await fetch('http://localhost:3000/integrations/api/ms-defender/sync-incidents', {
        method: 'POST',
        headers: c.req.raw.headers
      });
      const data = await response.json();
      return c.json(data);
    } catch (error) {
      return c.json({ success: false, error: 'Failed to trigger MS Defender sync' }, 500);
    }
  });
  
  // API: Trigger ServiceNow sync
  app.post('/api/sync/servicenow', async (c) => {
    try {
      const response = await fetch('http://localhost:3000/integrations/api/servicenow/sync-incidents', {
        method: 'POST',
        headers: c.req.raw.headers
      });
      const data = await response.json();
      return c.json(data);
    } catch (error) {
      return c.json({ success: false, error: 'Failed to trigger ServiceNow sync' }, 500);
    }
  });
  
  return app;
}

function renderSyncDashboard() {
  return html`
    <div class="min-h-screen bg-gray-50 py-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-6">
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-sync-alt text-blue-600 mr-3"></i>
            Integration Sync Dashboard
          </h1>
          <p class="mt-2 text-gray-600">Monitor and manage incident synchronization from external sources</p>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p class="text-sm font-medium text-gray-600">Total Sync Jobs</p>
            <p class="text-3xl font-bold text-blue-600" id="total-jobs">--</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p class="text-sm font-medium text-gray-600">Completed</p>
            <p class="text-3xl font-bold text-green-600" id="completed-jobs">--</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <p class="text-sm font-medium text-gray-600">Running</p>
            <p class="text-3xl font-bold text-yellow-600" id="running-jobs">--</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <p class="text-sm font-medium text-gray-600">Failed</p>
            <p class="text-3xl font-bold text-red-600" id="failed-jobs">--</p>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Quick Sync Actions</h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button onclick="syncMSDefender()" 
                    class="flex items-center justify-center px-6 py-4 border-2 border-blue-500 text-blue-700 rounded-lg hover:bg-blue-50 transition">
              <i class="fas fa-shield-alt text-2xl mr-3"></i>
              <div class="text-left">
                <div class="font-semibold">Sync Microsoft Defender</div>
                <div class="text-sm text-gray-600">Pull incidents from MS Defender for Endpoint</div>
              </div>
            </button>
            
            <button onclick="syncServiceNow()" 
                    class="flex items-center justify-center px-6 py-4 border-2 border-green-500 text-green-700 rounded-lg hover:bg-green-50 transition">
              <i class="fas fa-ticket-alt text-2xl mr-3"></i>
              <div class="text-left">
                <div class="font-semibold">Sync ServiceNow</div>
                <div class="text-sm text-gray-600">Pull incidents from ServiceNow ITSM</div>
              </div>
            </button>
          </div>
        </div>

        <!-- Sync History -->
        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div class="px-6 py-4 border-b flex justify-between items-center">
            <h2 class="text-lg font-semibold">Sync History</h2>
            <button onclick="loadJobs()" class="text-blue-600 hover:text-blue-700">
              <i class="fas fa-refresh mr-1"></i>Refresh
            </button>
          </div>
          
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Integration</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Incidents Synced</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Sync</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Next Sync</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200" id="jobs-tbody">
                <tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">
                  <i class="fas fa-spinner fa-spin mr-2"></i>Loading sync history...
                </td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <script>
      async function loadJobs() {
        try {
          const response = await fetch('/sync-dashboard/api/sync-jobs');
          const data = await response.json();
          
          if (data.success) {
            const jobs = data.jobs;
            
            // Update stats
            document.getElementById('total-jobs').textContent = jobs.length;
            document.getElementById('completed-jobs').textContent = 
              jobs.filter(j => j.status === 'completed' || j.status === 'completed_with_errors').length;
            document.getElementById('running-jobs').textContent = 
              jobs.filter(j => j.status === 'running' || j.status === 'pending').length;
            document.getElementById('failed-jobs').textContent = 
              jobs.filter(j => j.status === 'failed').length;
            
            // Render table
            const tbody = document.getElementById('jobs-tbody');
            if (jobs.length === 0) {
              tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No sync jobs found</td></tr>';
            } else {
              tbody.innerHTML = jobs.map(job => {
                const statusColors = {
                  'completed': 'bg-green-100 text-green-800',
                  'completed_with_errors': 'bg-yellow-100 text-yellow-800',
                  'running': 'bg-blue-100 text-blue-800',
                  'pending': 'bg-gray-100 text-gray-800',
                  'failed': 'bg-red-100 text-red-800'
                };
                
                const integrationIcons = {
                  'ms-defender': 'fa-shield-alt',
                  'servicenow': 'fa-ticket-alt'
                };
                
                return \`
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <i class="fas \${integrationIcons[job.integration_key] || 'fa-plug'} text-gray-400 mr-2"></i>
                        <span class="font-medium">\${job.integration_key}</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="px-2 py-1 text-xs font-semibold rounded-full \${statusColors[job.status] || statusColors['pending']}">
                        \${job.status}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      \${job.incidents_synced || 0}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      \${job.last_sync_at ? new Date(job.last_sync_at).toLocaleString() : 'Never'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      \${job.next_sync_at ? new Date(job.next_sync_at).toLocaleString() : 'Not scheduled'}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                      \${job.error_message ? \`
                        <button onclick="showError('\${job.id}')" class="text-red-600 hover:text-red-900">
                          <i class="fas fa-exclamation-circle"></i> View Error
                        </button>
                      \` : '-'}
                    </td>
                  </tr>
                \`;
              }).join('');
            }
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }

      async function syncMSDefender() {
        if (!confirm('Sync incidents from Microsoft Defender?')) return;
        
        const button = event.target.closest('button');
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Syncing...';
        
        try {
          const response = await fetch('/sync-dashboard/api/sync/ms-defender', { method: 'POST' });
          const data = await response.json();
          
          if (data.success) {
            alert(\`Success! Synced \${data.incidents_synced} incidents from MS Defender\`);
            loadJobs();
          } else {
            alert('Sync failed: ' + data.error);
          }
        } catch (error) {
          alert('Sync failed: ' + error.message);
        } finally {
          button.disabled = false;
          button.innerHTML = '<i class="fas fa-shield-alt text-2xl mr-3"></i><div class="text-left"><div class="font-semibold">Sync Microsoft Defender</div><div class="text-sm text-gray-600">Pull incidents from MS Defender for Endpoint</div></div>';
        }
      }

      async function syncServiceNow() {
        if (!confirm('Sync incidents from ServiceNow?')) return;
        
        const button = event.target.closest('button');
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Syncing...';
        
        try {
          const response = await fetch('/sync-dashboard/api/sync/servicenow', { method: 'POST' });
          const data = await response.json();
          
          if (data.success) {
            alert(\`Success! Synced \${data.incidents_synced} incidents from ServiceNow\`);
            loadJobs();
          } else {
            alert('Sync failed: ' + data.error);
          }
        } catch (error) {
          alert('Sync failed: ' + error.message);
        } finally {
          button.disabled = false;
          button.innerHTML = '<i class="fas fa-ticket-alt text-2xl mr-3"></i><div class="text-left"><div class="font-semibold">Sync ServiceNow</div><div class="text-sm text-gray-600">Pull incidents from ServiceNow ITSM</div></div>';
        }
      }

      function showError(jobId) {
        alert('Error details for job ' + jobId);
      }

      document.addEventListener('DOMContentLoaded', loadJobs);
      
      // Auto-refresh every 30 seconds
      setInterval(loadJobs, 30000);
    </script>
  `;
}
