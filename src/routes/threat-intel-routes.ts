/**
 * Threat Intelligence Routes
 * Week 7 UI - STIX/TAXII and IOC Management
 */

import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import type { CloudflareBindings } from '../types';
import { TAXIIClientService } from '../lib/taxii-client-service';
import { STIXParserService } from '../lib/stix-parser-service';

export function createThreatIntelRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  app.use('*', requireAuth);
  
  // TAXII Servers Page
  app.get('/taxii-servers', async (c) => {
    const user = c.get('user');
    return c.html(cleanLayout({
      title: 'TAXII Servers',
      user,
      content: renderTAXIIServers()
    }));
  });
  
  // STIX Objects Page
  app.get('/stix-objects', async (c) => {
    const user = c.get('user');
    return c.html(cleanLayout({
      title: 'STIX Objects',
      user,
      content: renderSTIXObjects()
    }));
  });
  
  // IOC Management Page
  app.get('/iocs', async (c) => {
    const user = c.get('user');
    return c.html(cleanLayout({
      title: 'IOC Management',
      user,
      content: renderIOCManagement()
    }));
  });
  
  // API: Get TAXII servers
  app.get('/api/taxii-servers', async (c) => {
    try {
      const user = c.get('user');
      const result = await c.env.DB.prepare(`
        SELECT id, name, api_root_url, is_active, last_connection_test, last_error
        FROM taxii_servers
        WHERE organization_id = ?
        ORDER BY name ASC
      `).bind(user.organizationId || 1).all();
      
      return c.json({ success: true, servers: result.results || [] });
    } catch (error) {
      return c.json({ success: false, error: 'Failed to fetch TAXII servers' }, 500);
    }
  });
  
  // API: Get STIX objects
  app.get('/api/stix-objects', async (c) => {
    try {
      const user = c.get('user');
      const result = await c.env.DB.prepare(`
        SELECT id, stix_id, stix_type, name, severity, tlp_marking, created, modified
        FROM stix_objects
        WHERE organization_id = ?
        ORDER BY created DESC
        LIMIT 100
      `).bind(user.organizationId || 1).all();
      
      return c.json({ success: true, objects: result.results || [] });
    } catch (error) {
      return c.json({ success: false, error: 'Failed to fetch STIX objects' }, 500);
    }
  });
  
  // API: Get IOCs
  app.get('/api/iocs', async (c) => {
    try {
      const user = c.get('user');
      const result = await c.env.DB.prepare(`
        SELECT id, ioc_type, ioc_value, threat_type, confidence, severity,
               first_seen, last_seen, is_active, false_positive, detection_count
        FROM iocs
        WHERE organization_id = ?
        ORDER BY confidence DESC, last_seen DESC
        LIMIT 100
      `).bind(user.organizationId || 1).all();
      
      return c.json({ success: true, iocs: result.results || [] });
    } catch (error) {
      return c.json({ success: false, error: 'Failed to fetch IOCs' }, 500);
    }
  });
  
  // API: Mark IOC as false positive
  app.post('/api/iocs/:id/false-positive', async (c) => {
    try {
      const iocId = c.req.param('id');
      const { reason } = await c.req.json();
      
      await c.env.DB.prepare(`
        UPDATE iocs
        SET false_positive = 1, whitelist_reason = ?, is_active = 0
        WHERE id = ?
      `).bind(reason || 'Marked as false positive', iocId).run();
      
      return c.json({ success: true, message: 'IOC marked as false positive' });
    } catch (error) {
      return c.json({ success: false, error: 'Failed to mark IOC' }, 500);
    }
  });
  
  // API: Test TAXII server connection
  app.post('/api/taxii-servers/test-connection', async (c) => {
    try {
      const serverData = await c.req.json();
      const taxiiClient = new TAXIIClientService(c.env.DB);
      
      const result = await taxiiClient.testConnection(serverData as any);
      
      return c.json({ success: result.success, ...result });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });
  
  // API: Discover collections from a TAXII server
  app.post('/api/taxii-servers/:id/discover', async (c) => {
    try {
      const serverId = parseInt(c.req.param('id'));
      const taxiiClient = new TAXIIClientService(c.env.DB);
      
      const count = await taxiiClient.discoverCollections(serverId);
      
      return c.json({ 
        success: true, 
        message: `Discovered ${count} collections`,
        collectionsCount: count
      });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });
  
  // API: Poll a specific collection
  app.post('/api/taxii-collections/:id/poll', async (c) => {
    try {
      const collectionId = parseInt(c.req.param('id'));
      const taxiiClient = new TAXIIClientService(c.env.DB);
      
      const result = await taxiiClient.pollCollection(collectionId);
      
      return c.json({ success: true, ...result });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });
  
  // API: Poll all due collections
  app.post('/api/taxii-collections/poll-all', async (c) => {
    try {
      const taxiiClient = new TAXIIClientService(c.env.DB);
      
      const result = await taxiiClient.pollDueCollections();
      
      return c.json({ success: true, ...result });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });
  
  // API: Get polling statistics
  app.get('/api/taxii/polling-stats', async (c) => {
    try {
      const taxiiClient = new TAXIIClientService(c.env.DB);
      
      const stats = await taxiiClient.getPollingStatistics();
      
      return c.json({ success: true, ...stats });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });
  
  // API: Get STIX statistics
  app.get('/api/stix/statistics', async (c) => {
    try {
      const stixParser = new STIXParserService(c.env.DB);
      
      const stats = await stixParser.getStatistics();
      
      return c.json({ success: true, ...stats });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  });
  
  return app;
}

function renderTAXIIServers() {
  return html`
    <div class="min-h-screen bg-gray-50 py-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-6 flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 flex items-center">
              <i class="fas fa-server text-purple-600 mr-3"></i>
              TAXII 2.1 Servers
            </h1>
            <p class="mt-2 text-gray-600">Configure external threat intelligence sources</p>
          </div>
          <button class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg">
            <i class="fas fa-plus mr-2"></i>Add Server
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <p class="text-sm font-medium text-gray-600">Total Servers</p>
            <p class="text-3xl font-bold text-purple-600" id="total-servers">--</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p class="text-sm font-medium text-gray-600">Active</p>
            <p class="text-3xl font-bold text-green-600" id="active-servers">--</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p class="text-sm font-medium text-gray-600">Collections</p>
            <p class="text-3xl font-bold text-blue-600" id="total-collections">--</p>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div class="px-6 py-4 border-b">
            <h2 class="text-lg font-semibold">Configured Servers</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Server Name</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">API Root</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Test</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200" id="servers-tbody">
                <tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">
                  <i class="fas fa-spinner fa-spin mr-2"></i>Loading...
                </td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <script>
      async function loadServers() {
        try {
          const response = await fetch('/threat-intel/api/taxii-servers');
          const data = await response.json();
          
          if (data.success) {
            const servers = data.servers;
            document.getElementById('total-servers').textContent = servers.length;
            document.getElementById('active-servers').textContent = servers.filter(s => s.is_active).length;
            
            const tbody = document.getElementById('servers-tbody');
            if (servers.length === 0) {
              tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No TAXII servers configured. Add your first server to start collecting threat intelligence.</td></tr>';
            } else {
              tbody.innerHTML = servers.map(s => \`
                <tr>
                  <td class="px-6 py-4 font-medium">\${s.name}</td>
                  <td class="px-6 py-4 text-sm text-gray-600">\${s.api_root_url}</td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full \${s.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                      \${s.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-gray-500">
                    \${s.last_connection_test ? new Date(s.last_connection_test).toLocaleString() : 'Never'}
                  </td>
                  <td class="px-6 py-4 text-sm">
                    <button class="text-blue-600 hover:text-blue-900 mr-3">
                      <i class="fas fa-vial"></i> Test
                    </button>
                    <button class="text-green-600 hover:text-green-900">
                      <i class="fas fa-edit"></i> Edit
                    </button>
                  </td>
                </tr>
              \`).join('');
            }
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }
      
      document.addEventListener('DOMContentLoaded', loadServers);
      
      // Auto-refresh every 60 seconds
      setInterval(loadServers, 60000);
    </script>
  `;
}

function renderSTIXObjects() {
  return html`
    <div class="min-h-screen bg-gray-50 py-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-6 flex items-center">
          <i class="fas fa-cube text-indigo-600 mr-3"></i>
          STIX 2.1 Objects
        </h1>

        <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-indigo-500">
            <p class="text-sm font-medium text-gray-600">Total Objects</p>
            <p class="text-3xl font-bold text-indigo-600" id="total-objects">--</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <p class="text-sm font-medium text-gray-600">Indicators</p>
            <p class="text-3xl font-bold text-red-600" id="indicators-count">--</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <p class="text-sm font-medium text-gray-600">Malware</p>
            <p class="text-3xl font-bold text-yellow-600" id="malware-count">--</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
            <p class="text-sm font-medium text-gray-600">Threat Actors</p>
            <p class="text-3xl font-bold text-purple-600" id="actors-count">--</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
            <p class="text-sm font-medium text-gray-600">Campaigns</p>
            <p class="text-3xl font-bold text-blue-600" id="campaigns-count">--</p>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div class="px-6 py-4 border-b">
            <h2 class="text-lg font-semibold">Recent STIX Objects</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">TLP</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200" id="objects-tbody">
                <tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">
                  <i class="fas fa-spinner fa-spin mr-2"></i>Loading...
                </td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <script>
      async function loadObjects() {
        try {
          const response = await fetch('/threat-intel/api/stix-objects');
          const data = await response.json();
          
          if (data.success) {
            const objects = data.objects;
            document.getElementById('total-objects').textContent = objects.length;
            document.getElementById('indicators-count').textContent = objects.filter(o => o.stix_type === 'indicator').length;
            document.getElementById('malware-count').textContent = objects.filter(o => o.stix_type === 'malware').length;
            document.getElementById('actors-count').textContent = objects.filter(o => o.stix_type === 'threat-actor').length;
            document.getElementById('campaigns-count').textContent = objects.filter(o => o.stix_type === 'campaign').length;
            
            const tbody = document.getElementById('objects-tbody');
            if (objects.length === 0) {
              tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-gray-500">No STIX objects found. Configure TAXII servers to start collecting threat intelligence.</td></tr>';
            } else {
              tbody.innerHTML = objects.map(o => \`
                <tr>
                  <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full bg-indigo-100 text-indigo-800">
                      \${o.stix_type}
                    </span>
                  </td>
                  <td class="px-6 py-4 font-medium">\${o.name || o.stix_id}</td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full \${
                      o.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      o.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      o.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }">
                      \${o.severity || 'info'}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm">\${o.tlp_marking || 'TLP:WHITE'}</td>
                  <td class="px-6 py-4 text-sm text-gray-500">
                    \${new Date(o.created).toLocaleDateString()}
                  </td>
                </tr>
              \`).join('');
            }
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }
      
      document.addEventListener('DOMContentLoaded', loadObjects);
      
      // Auto-refresh every 60 seconds
      setInterval(loadObjects, 60000);
    </script>
  `;
}

function renderIOCManagement() {
  return html`
    <div class="min-h-screen bg-gray-50 py-6">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-6 flex items-center">
          <i class="fas fa-exclamation-triangle text-red-600 mr-3"></i>
          IOC Management
        </h1>

        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
            <p class="text-sm font-medium text-gray-600">Total IOCs</p>
            <p class="text-3xl font-bold text-red-600" id="total-iocs">--</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
            <p class="text-sm font-medium text-gray-600">High Confidence</p>
            <p class="text-3xl font-bold text-green-600" id="high-confidence">--</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
            <p class="text-sm font-medium text-gray-600">Detections</p>
            <p class="text-3xl font-bold text-yellow-600" id="total-detections">--</p>
          </div>
          <div class="bg-white rounded-lg shadow p-6 border-l-4 border-gray-500">
            <p class="text-sm font-medium text-gray-600">False Positives</p>
            <p class="text-3xl font-bold text-gray-600" id="false-positives">--</p>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow overflow-hidden">
          <div class="px-6 py-4 border-b">
            <h2 class="text-lg font-semibold">Indicators of Compromise</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Threat</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Confidence</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detections</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200" id="iocs-tbody">
                <tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">
                  <i class="fas fa-spinner fa-spin mr-2"></i>Loading...
                </td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <script>
      async function loadIOCs() {
        try {
          const response = await fetch('/threat-intel/api/iocs');
          const data = await response.json();
          
          if (data.success) {
            const iocs = data.iocs;
            document.getElementById('total-iocs').textContent = iocs.length;
            document.getElementById('high-confidence').textContent = iocs.filter(i => i.confidence >= 70).length;
            document.getElementById('total-detections').textContent = iocs.reduce((sum, i) => sum + (i.detection_count || 0), 0);
            document.getElementById('false-positives').textContent = iocs.filter(i => i.false_positive).length;
            
            const tbody = document.getElementById('iocs-tbody');
            if (iocs.length === 0) {
              tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">No IOCs found.</td></tr>';
            } else {
              tbody.innerHTML = iocs.map(ioc => \`
                <tr class="\${ioc.false_positive ? 'bg-gray-50 opacity-60' : ''}">
                  <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      \${ioc.ioc_type}
                    </span>
                  </td>
                  <td class="px-6 py-4 font-mono text-sm">\${ioc.ioc_value}</td>
                  <td class="px-6 py-4 text-sm">\${ioc.threat_type || '-'}</td>
                  <td class="px-6 py-4">
                    <div class="flex items-center">
                      <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div class="bg-green-500 h-2 rounded-full" style="width: \${ioc.confidence}%"></div>
                      </div>
                      <span class="text-sm">\${ioc.confidence}%</span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full \${
                      ioc.severity === 'critical' ? 'bg-red-100 text-red-800' :
                      ioc.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                      ioc.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }">
                      \${ioc.severity}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm">\${ioc.detection_count || 0}</td>
                  <td class="px-6 py-4 text-sm">
                    \${!ioc.false_positive ? \`
                      <button onclick="markFalsePositive(\${ioc.id})" class="text-gray-600 hover:text-gray-900">
                        <i class="fas fa-flag"></i> Mark FP
                      </button>
                    \` : '<span class="text-gray-400">False Positive</span>'}
                  </td>
                </tr>
              \`).join('');
            }
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }

      async function markFalsePositive(iocId) {
        const reason = prompt('Enter reason for marking as false positive:');
        if (!reason) return;
        
        try {
          const response = await fetch(\`/threat-intel/api/iocs/\${iocId}/false-positive\`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason })
          });
          const data = await response.json();
          if (data.success) {
            loadIOCs();
          } else {
            alert('Failed: ' + data.error);
          }
        } catch (error) {
          alert('Failed to mark IOC');
        }
      }
      
      document.addEventListener('DOMContentLoaded', loadIOCs);
      
      // Auto-refresh every 60 seconds
      setInterval(loadIOCs, 60000);
    </script>
  `;
}
