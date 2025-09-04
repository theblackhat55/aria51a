import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import { createDefenderService, type DefenderMachine, type DefenderAlert } from '../services/microsoft-defender';
import type { CloudflareBindings } from '../types';

export function createOperationsDefenderRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware to all routes
  app.use('*', requireAuth);
  
  // Main operations dashboard with real Microsoft Defender integration
  app.get('/', async (c) => {
    const user = c.get('user');
    const { env } = c;
    
    return c.html(
      cleanLayout({
        title: 'Operations - Service Intelligence Center',
        user,
        content: renderServiceIntelligenceDashboard(user)
      })
    );
  });

  // Microsoft Defender integration dashboard
  app.get('/defender', async (c) => {
    const user = c.get('user');
    const { env } = c;
    
    return c.html(
      cleanLayout({
        title: 'Microsoft Defender Integration',
        user,
        content: renderDefenderDashboard(user)
      })
    );
  });

  // Test Microsoft Defender connection
  app.post('/defender/test-connection', async (c) => {
    const { env } = c;
    
    try {
      const defenderService = createDefenderService(env);
      
      if (!defenderService) {
        return c.html(html`
          <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-exclamation-circle text-red-500 mr-2"></i>
              <span class="text-red-700 font-medium">Microsoft Defender not configured</span>
            </div>
            <p class="text-red-600 text-sm mt-1">
              Please configure DEFENDER_TENANT_ID, DEFENDER_CLIENT_ID, and DEFENDER_CLIENT_SECRET in your environment.
            </p>
          </div>
        `);
      }

      const result = await defenderService.testConnection();
      
      if (result.success) {
        return c.html(html`
          <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-check-circle text-green-500 mr-2"></i>
              <span class="text-green-700 font-medium">${result.message}</span>
            </div>
            ${result.machineCount !== undefined ? html`
              <p class="text-green-600 text-sm mt-1">
                Found ${result.machineCount} machines available for sync.
              </p>
            ` : ''}
          </div>
        `);
      } else {
        return c.html(html`
          <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-times-circle text-red-500 mr-2"></i>
              <span class="text-red-700 font-medium">${result.message}</span>
            </div>
          </div>
        `);
      }
    } catch (error) {
      console.error('Defender test connection error:', error);
      return c.html(html`
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center">
            <i class="fas fa-times-circle text-red-500 mr-2"></i>
            <span class="text-red-700 font-medium">Connection test failed: ${error.message}</span>
          </div>
        </div>
      `);
    }
  });

  // Sync assets from Microsoft Defender
  app.post('/defender/sync-assets', async (c) => {
    const { env } = c;
    
    try {
      const defenderService = createDefenderService(env);
      
      if (!defenderService) {
        return c.html(html`
          <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-exclamation-circle text-red-500 mr-2"></i>
              <span class="text-red-700 font-medium">Microsoft Defender not configured</span>
            </div>
          </div>
        `);
      }

      // Show loading state first
      const loadingResponse = html`
        <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-center">
            <i class="fas fa-spinner fa-spin text-blue-500 mr-2"></i>
            <span class="text-blue-700 font-medium">Syncing assets from Microsoft Defender...</span>
          </div>
          <p class="text-blue-600 text-sm mt-1">This may take a few moments.</p>
        </div>
      `;

      // In a real implementation, you would:
      // 1. Sync assets from Defender
      // 2. Store them in D1 database
      // 3. Return success/failure status
      
      const syncResult = await defenderService.syncMachinesToAssets();
      
      if (syncResult.success) {
        // TODO: Save assets to D1 database
        // await saveAssetsToDatabase(c.env.DB, syncResult.assets);
        
        return c.html(html`
          <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-check-circle text-green-500 mr-2"></i>
              <span class="text-green-700 font-medium">${syncResult.message}</span>
            </div>
            <div class="mt-2 text-green-600 text-sm space-y-1">
              <p>• Assets synced: ${syncResult.assets.length}</p>
              <p>• Active alerts: ${syncResult.alertCount}</p>
              <p>• Vulnerabilities: ${syncResult.vulnerabilityCount}</p>
            </div>
          </div>
          <script>
            // Refresh the asset table after successful sync
            setTimeout(() => {
              htmx.ajax('GET', '/operations/assets/table', '#assets-table');
            }, 2000);
          </script>
        `);
      } else {
        return c.html(html`
          <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-times-circle text-red-500 mr-2"></i>
              <span class="text-red-700 font-medium">${syncResult.message}</span>
            </div>
          </div>
        `);
      }
    } catch (error) {
      console.error('Defender sync error:', error);
      return c.html(html`
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center">
            <i class="fas fa-times-circle text-red-500 mr-2"></i>
            <span class="text-red-700 font-medium">Sync failed: ${error.message}</span>
          </div>
        </div>
      `);
    }
  });

  // Get asset details with Defender data
  app.get('/assets/:id/defender-details', async (c) => {
    const assetId = c.req.param('id');
    const { env } = c;
    
    try {
      const defenderService = createDefenderService(env);
      
      if (!defenderService) {
        return c.html(html`
          <div class="text-red-500">Microsoft Defender not configured</div>
        `);
      }

      // Get machine details from Defender
      const machine = await defenderService.getMachine(assetId);
      const alerts = await defenderService.getMachineAlerts(assetId);
      const vulnerabilities = await defenderService.getMachineVulnerabilities(assetId);

      return c.html(renderAssetDefenderDetails(machine, alerts.value, vulnerabilities.value));
    } catch (error) {
      console.error('Error fetching Defender details:', error);
      return c.html(html`
        <div class="text-red-500">Failed to fetch Defender data: ${error.message}</div>
      `);
    }
  });

  // API endpoints
  app.get('/api/defender/machines', async (c) => {
    const { env } = c;
    
    try {
      const defenderService = createDefenderService(env);
      
      if (!defenderService) {
        return c.json({ error: 'Microsoft Defender not configured' }, 400);
      }

      const filter = c.req.query('filter');
      const top = c.req.query('top') ? parseInt(c.req.query('top')!) : undefined;
      
      const result = await defenderService.getMachines(filter, top);
      return c.json(result);
    } catch (error) {
      console.error('API error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  app.get('/api/defender/alerts', async (c) => {
    const { env } = c;
    
    try {
      const defenderService = createDefenderService(env);
      
      if (!defenderService) {
        return c.json({ error: 'Microsoft Defender not configured' }, 400);
      }

      const filter = c.req.query('filter');
      const top = c.req.query('top') ? parseInt(c.req.query('top')!) : undefined;
      
      const result = await defenderService.getAlerts(filter, top);
      return c.json(result);
    } catch (error) {
      console.error('API error:', error);
      return c.json({ error: error.message }, 500);
    }
  });

  return app;
}

// Render functions
const renderServiceIntelligenceDashboard = (user: any) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 flex items-center">
          <i class="fas fa-shield-alt mr-3 text-blue-600"></i>
          Service Intelligence Center
        </h1>
        <p class="mt-2 text-lg text-gray-600">
          Import assets from Microsoft Defender, link to services with CIA ratings, and conduct AI-powered risk assessments
        </p>
      </div>

      <!-- Quick Actions -->
      <div class="mb-8">
        <div class="flex flex-wrap gap-4">
          <button hx-get="/operations/defender" 
                  hx-target="#main-content" 
                  hx-swap="innerHTML"
                  class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200">
            <i class="fas fa-shield-alt mr-2"></i>
            Microsoft Defender Integration
          </button>
          
          <button hx-get="/operations/services" 
                  hx-target="#main-content" 
                  hx-swap="innerHTML"
                  class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-200">
            <i class="fas fa-cogs mr-2"></i>
            Service Management
          </button>
          
          <button hx-get="/operations/risk-assessment" 
                  hx-target="#main-content" 
                  hx-swap="innerHTML"
                  class="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition duration-200">
            <i class="fas fa-chart-line mr-2"></i>
            AI Risk Assessment
          </button>
        </div>
      </div>

      <!-- Dashboard Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Assets</p>
              <p class="text-3xl font-bold text-blue-600">247</p>
            </div>
            <div class="bg-blue-100 rounded-full p-3">
              <i class="fas fa-server text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Active Services</p>
              <p class="text-3xl font-bold text-green-600">12</p>
            </div>
            <div class="bg-green-100 rounded-full p-3">
              <i class="fas fa-cogs text-green-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Risk Assessments</p>
              <p class="text-3xl font-bold text-purple-600">18</p>
            </div>
            <div class="bg-purple-100 rounded-full p-3">
              <i class="fas fa-chart-line text-purple-600 text-xl"></i>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">AI Analyses</p>
              <p class="text-3xl font-bold text-orange-600">34</p>
            </div>
            <div class="bg-orange-100 rounded-full p-3">
              <i class="fas fa-brain text-orange-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- Integration Status -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Integration Status</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="flex items-center p-4 bg-green-50 rounded-lg">
            <div class="bg-green-100 rounded-full p-2 mr-3">
              <i class="fas fa-shield-alt text-green-600"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Microsoft Defender</h3>
              <p class="text-sm text-gray-600">Ready for asset import</p>
            </div>
          </div>
          
          <div class="flex items-center p-4 bg-blue-50 rounded-lg">
            <div class="bg-blue-100 rounded-full p-2 mr-3">
              <i class="fas fa-brain text-blue-600"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">AI Providers</h3>
              <p class="text-sm text-gray-600">OpenAI, Claude, Gemini</p>
            </div>
          </div>
          
          <div class="flex items-center p-4 bg-purple-50 rounded-lg">
            <div class="bg-purple-100 rounded-full p-2 mr-3">
              <i class="fas fa-database text-purple-600"></i>
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Service Registry</h3>
              <p class="text-sm text-gray-600">CIA ratings enabled</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

const renderDefenderDashboard = (user: any) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 flex items-center">
              <i class="fas fa-shield-alt mr-3 text-blue-600"></i>
              Microsoft Defender Integration
            </h1>
            <p class="mt-2 text-lg text-gray-600">
              Connect to Microsoft Defender for Endpoint to import assets with security context
            </p>
          </div>
          <button hx-get="/operations" 
                  hx-target="#main-content" 
                  hx-swap="innerHTML"
                  class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700">
            <i class="fas fa-arrow-left mr-2"></i>Back to Operations
          </button>
        </div>
      </div>

      <!-- Connection Test -->
      <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Connection Test</h2>
        <div class="flex items-center space-x-4 mb-4">
          <button hx-post="/operations/defender/test-connection"
                  hx-target="#connection-status"
                  hx-swap="innerHTML"
                  class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <i class="fas fa-plug mr-2"></i>Test Connection
          </button>
          <button hx-post="/operations/defender/sync-assets"
                  hx-target="#sync-status"
                  hx-swap="innerHTML"
                  hx-confirm="This will sync all assets from Microsoft Defender. Continue?"
                  class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            <i class="fas fa-sync mr-2"></i>Sync Assets
          </button>
        </div>
        <div id="connection-status" class="mb-4"></div>
        <div id="sync-status"></div>
      </div>

      <!-- Configuration Guide -->
      <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Configuration Guide</h2>
        <div class="space-y-4">
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 class="font-semibold text-blue-900 mb-2">Required Environment Variables</h3>
            <div class="space-y-2 text-sm text-blue-800">
              <p><strong>DEFENDER_TENANT_ID</strong>: Your Azure Active Directory tenant ID</p>
              <p><strong>DEFENDER_CLIENT_ID</strong>: Application (client) ID from Azure AD app registration</p>
              <p><strong>DEFENDER_CLIENT_SECRET</strong>: Client secret for the registered application</p>
            </div>
          </div>
          
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 class="font-semibold text-yellow-900 mb-2">Required API Permissions</h3>
            <div class="space-y-1 text-sm text-yellow-800">
              <p>• <strong>Machine.Read.All</strong>: Read all machine information</p>
              <p>• <strong>Alert.Read.All</strong>: Read all alerts</p>
              <p>• <strong>Vulnerability.Read.All</strong>: Read vulnerability information</p>
              <p>• <strong>Score.Read.All</strong>: Read security scores</p>
            </div>
          </div>
          
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 class="font-semibold text-green-900 mb-2">Setup Steps</h3>
            <ol class="list-decimal list-inside space-y-1 text-sm text-green-800">
              <li>Register application in Azure Active Directory</li>
              <li>Add required API permissions for Microsoft Defender for Endpoint</li>
              <li>Generate client secret and note the tenant ID</li>
              <li>Configure environment variables in Cloudflare Workers</li>
              <li>Test connection using the button above</li>
            </ol>
          </div>
        </div>
      </div>

      <!-- Asset Preview -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Asset Import Preview</h2>
        <p class="text-gray-600 mb-4">
          When assets are synced from Microsoft Defender, they will include the following security context:
        </p>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Name</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CIA Rating</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">DESKTOP-ABC123</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Workstation</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Active</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Low</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">C:7 I:7 A:9</td>
              </tr>
              <!-- More rows would be populated from real data -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
`;

const renderAssetDefenderDetails = (machine: DefenderMachine, alerts: any[], vulnerabilities: any[]) => html`
  <div class="space-y-6">
    <!-- Machine Info -->
    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <h3 class="font-semibold text-gray-900 mb-3">Microsoft Defender Details</h3>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-gray-600">Health Status:</span>
          <span class="ml-2 font-medium">${machine.healthStatus}</span>
        </div>
        <div>
          <span class="text-gray-600">Risk Score:</span>
          <span class="ml-2 font-medium">${machine.riskScore}</span>
        </div>
        <div>
          <span class="text-gray-600">OS Version:</span>
          <span class="ml-2 font-medium">${machine.osVersion}</span>
        </div>
        <div>
          <span class="text-gray-600">Agent Version:</span>
          <span class="ml-2 font-medium">${machine.agentVersion}</span>
        </div>
      </div>
    </div>

    <!-- Active Alerts -->
    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <h3 class="font-semibold text-gray-900 mb-3">Active Alerts (${alerts.length})</h3>
      ${alerts.length > 0 ? alerts.slice(0, 3).map(alert => html`
        <div class="border-l-4 border-red-400 bg-red-50 p-3 mb-2">
          <div class="flex justify-between items-center">
            <h4 class="font-medium text-red-800">${alert.title}</h4>
            <span class="text-xs px-2 py-1 bg-red-200 text-red-800 rounded">${alert.severity}</span>
          </div>
          <p class="text-sm text-red-700 mt-1">${alert.description}</p>
        </div>
      `) : html`
        <p class="text-gray-500 text-sm">No active alerts</p>
      `}
    </div>

    <!-- Vulnerabilities -->
    <div class="bg-white rounded-lg border border-gray-200 p-4">
      <h3 class="font-semibold text-gray-900 mb-3">Vulnerabilities (${vulnerabilities.length})</h3>
      ${vulnerabilities.length > 0 ? vulnerabilities.slice(0, 3).map(vuln => html`
        <div class="border-l-4 border-yellow-400 bg-yellow-50 p-3 mb-2">
          <div class="flex justify-between items-center">
            <h4 class="font-medium text-yellow-800">${vuln.name}</h4>
            <span class="text-xs px-2 py-1 bg-yellow-200 text-yellow-800 rounded">${vuln.severity}</span>
          </div>
          <p class="text-sm text-yellow-700 mt-1">CVSS: ${vuln.cvssV3}</p>
        </div>
      `) : html`
        <p class="text-gray-500 text-sm">No vulnerabilities detected</p>
      `}
    </div>
  </div>
`;

export default createOperationsDefenderRoutes;