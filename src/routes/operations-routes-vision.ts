import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import type { CloudflareBindings } from '../types';

export function createOperationsVisionRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware to all routes
  app.use('*', requireAuth);
  
  // Main operations page - Service-Centric Asset Management Dashboard
  app.get('/', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Operations - Service Intelligence Center',
        user,
        content: renderServiceIntelligenceDashboard(user)
      })
    );
  });
  
  // Microsoft Defender Integration
  app.get('/defender-integration', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Microsoft Defender Integration',
        user,
        content: renderDefenderIntegration(user)
      })
    );
  });
  
  // Service Management
  app.get('/services', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Service Management',
        user,
        content: renderServiceManagement(user)
      })
    );
  });
  
  // AI-Powered Risk Assessment
  app.get('/ai-risk-assessment', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'AI-Powered Risk Assessment',
        user,
        content: renderAIRiskAssessment(user)
      })
    );
  });
  
  // Service-Asset Linking
  app.get('/service-asset-linking', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Service-Asset Linking',
        user,
        content: renderServiceAssetLinking(user)
      })
    );
  });
  
  // API Endpoints for Microsoft Defender Integration
  app.post('/api/defender/sync', async (c) => {
    // Simulate Microsoft Defender asset import
    const syncedAssets = await syncDefenderAssets();
    
    return c.json({
      success: true,
      message: 'Assets synchronized from Microsoft Defender',
      assets: syncedAssets,
      count: syncedAssets.length,
      timestamp: new Date().toISOString()
    });
  });
  
  // API for AI-powered risk analysis
  app.post('/api/ai/analyze-risk', async (c) => {
    const { riskDetails, serviceDetails, linkedAssets } = await c.req.json();
    
    // Simulate AI analysis using configured LLM
    const aiAnalysis = await analyzeRiskWithAI(riskDetails, serviceDetails, linkedAssets);
    
    return c.json({
      success: true,
      analysis: aiAnalysis,
      suggestions: aiAnalysis.suggestions,
      autoFillData: aiAnalysis.autoFillData
    });
  });
  
  // API for service linking
  app.post('/api/services/link-assets', async (c) => {
    const { serviceId, assetIds } = await c.req.json();
    
    const linkedService = await linkAssetsToService(serviceId, assetIds);
    
    return c.json({
      success: true,
      service: linkedService,
      message: `${assetIds.length} assets linked to service`
    });
  });
  
  // API for CIA rating calculation
  app.post('/api/services/calculate-cia', async (c) => {
    const { serviceId } = await c.req.json();
    
    const ciaRating = await calculateServiceCIARating(serviceId);
    
    return c.json({
      success: true,
      serviceId,
      ciaRating,
      riskLevel: ciaRating.overallRisk
    });
  });
  
  return app;
}

// Service Intelligence Dashboard - Core Vision Implementation
const renderServiceIntelligenceDashboard = (user: any) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header with Microsoft Defender Integration Status -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 flex items-center">
          <i class="fas fa-shield-alt mr-3 text-blue-600"></i>
          Service Intelligence Center
        </h1>
        <p class="mt-2 text-lg text-gray-600">
          Import assets from Microsoft Defender, link to services with CIA ratings, and conduct AI-powered risk assessments
        </p>
        
        <!-- Integration Status Bar -->
        <div class="mt-4 flex items-center justify-between bg-white rounded-lg border border-gray-200 p-4">
          <div class="flex items-center space-x-6">
            <div class="flex items-center">
              <div class="w-3 h-3 bg-green-400 rounded-full mr-2 animate-pulse"></div>
              <span class="text-sm font-medium text-gray-700">Microsoft Defender Connected</span>
            </div>
            <div class="flex items-center">
              <div class="w-3 h-3 bg-blue-400 rounded-full mr-2"></div>
              <span class="text-sm font-medium text-gray-700">AI Analytics Enabled</span>
            </div>
            <div class="flex items-center">
              <div class="w-3 h-3 bg-purple-400 rounded-full mr-2"></div>
              <span class="text-sm font-medium text-gray-700">Service Mapping Active</span>
            </div>
          </div>
          <div class="flex space-x-2">
            <button hx-post="/operations/api/defender/sync"
                    hx-target="#sync-status" 
                    hx-swap="innerHTML"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center">
              <i class="fas fa-sync-alt mr-2"></i>
              Sync from Defender
            </button>
          </div>
        </div>
        
        <div id="sync-status" class="mt-2"></div>
      </div>
      
      <!-- Service Overview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Total Services</p>
              <p class="text-3xl font-bold text-gray-900">12</p>
              <p class="text-xs text-blue-600 mt-1">8 critical services</p>
            </div>
            <i class="fas fa-cogs text-2xl text-blue-500"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Linked Assets</p>
              <p class="text-3xl font-bold text-gray-900">247</p>
              <p class="text-xs text-green-600 mt-1">From Defender sync</p>
            </div>
            <i class="fas fa-link text-2xl text-green-500"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">AI Risk Assessments</p>
              <p class="text-3xl font-bold text-gray-900">34</p>
              <p class="text-xs text-orange-600 mt-1">18 auto-filled</p>
            </div>
            <i class="fas fa-robot text-2xl text-orange-500"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500">Critical Incidents</p>
              <p class="text-3xl font-bold text-gray-900">7</p>
              <p class="text-xs text-red-600 mt-1">Needs attention</p>
            </div>
            <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
          </div>
        </div>
      </div>
      
      <!-- Main Action Panels -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <!-- Service Management -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900 flex items-center">
              <i class="fas fa-sitemap text-blue-500 mr-2"></i>
              Service Management & CIA Rating
            </h2>
          </div>
          <div class="p-6">
            <p class="text-gray-600 mb-4">
              Manage organizational services and calculate CIA ratings based on linked assets
            </p>
            
            <!-- Service Quick List -->
            <div class="space-y-3 mb-6">
              ${renderServiceQuickList()}
            </div>
            
            <div class="flex space-x-2">
              <a href="/operations/services" 
                 class="flex-1 bg-blue-600 text-white text-center py-2 rounded-lg hover:bg-blue-700 transition">
                Manage Services
              </a>
              <a href="/operations/service-asset-linking" 
                 class="flex-1 bg-green-600 text-white text-center py-2 rounded-lg hover:bg-green-700 transition">
                Link Assets
              </a>
            </div>
          </div>
        </div>
        
        <!-- AI Risk Assessment -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900 flex items-center">
              <i class="fas fa-brain text-purple-500 mr-2"></i>
              AI-Powered Risk Assessment
            </h2>
          </div>
          <div class="p-6">
            <p class="text-gray-600 mb-4">
              Create risks linked to services with AI auto-fill using configured LLM providers
            </p>
            
            <!-- AI Features -->
            <div class="space-y-3 mb-6">
              <div class="flex items-center p-3 bg-purple-50 rounded-lg">
                <i class="fas fa-magic text-purple-600 mr-3"></i>
                <div>
                  <p class="font-medium text-gray-900">Analyze with AI</p>
                  <p class="text-sm text-gray-600">Auto-fill risk forms using service context</p>
                </div>
              </div>
              <div class="flex items-center p-3 bg-blue-50 rounded-lg">
                <i class="fas fa-chart-line text-blue-600 mr-3"></i>
                <div>
                  <p class="font-medium text-gray-900">Risk Predictions</p>
                  <p class="text-sm text-gray-600">ML-powered risk forecasting</p>
                </div>
              </div>
              <div class="flex items-center p-3 bg-green-50 rounded-lg">
                <i class="fas fa-lightbulb text-green-600 mr-3"></i>
                <div>
                  <p class="font-medium text-gray-900">Impact Analysis</p>
                  <p class="text-sm text-gray-600">Service-based impact assessment</p>
                </div>
              </div>
            </div>
            
            <a href="/operations/ai-risk-assessment" 
               class="w-full bg-purple-600 text-white text-center py-2 rounded-lg hover:bg-purple-700 transition block">
              Start AI Risk Assessment
            </a>
          </div>
        </div>
      </div>
      
      <!-- Microsoft Defender Integration Panel -->
      <div class="bg-white rounded-lg shadow mb-8">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900 flex items-center">
            <i class="fab fa-microsoft text-blue-500 mr-2"></i>
            Microsoft Defender Integration
          </h2>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Asset Import -->
            <div class="text-center">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-download text-2xl text-blue-600"></i>
              </div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">Asset Import</h3>
              <p class="text-sm text-gray-600 mb-4">
                Import assets with criticality ratings and vulnerability data from Microsoft Defender
              </p>
              <button hx-post="/operations/api/defender/sync"
                      hx-target="#import-status"
                      hx-swap="innerHTML"
                      class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Import Assets
              </button>
            </div>
            
            <!-- Incident Sync -->
            <div class="text-center">
              <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-exclamation-circle text-2xl text-red-600"></i>
              </div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">Incident Sync</h3>
              <p class="text-sm text-gray-600 mb-4">
                Synchronize security incidents and alerts from Defender for Endpoint
              </p>
              <button class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                Sync Incidents
              </button>
            </div>
            
            <!-- Vulnerability Scan -->
            <div class="text-center">
              <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-shield-virus text-2xl text-orange-600"></i>
              </div>
              <h3 class="text-lg font-medium text-gray-900 mb-2">Vulnerability Data</h3>
              <p class="text-sm text-gray-600 mb-4">
                Pull vulnerability assessments and patch status from Defender
              </p>
              <button class="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
                Sync Vulnerabilities
              </button>
            </div>
          </div>
          
          <div id="import-status" class="mt-6"></div>
          
          <div class="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500">
            <div class="flex items-start">
              <i class="fas fa-info-circle text-blue-500 mt-1 mr-2"></i>
              <div>
                <p class="text-sm font-medium text-blue-800">Integration Status</p>
                <p class="text-sm text-blue-700 mt-1">
                  Last sync: 2 hours ago • Next scheduled sync: In 4 hours • API Status: Connected
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Recent AI Analytics -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900 flex items-center">
            <i class="fas fa-chart-bar text-indigo-500 mr-2"></i>
            Recent AI Analytics & Predictions
          </h2>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            ${renderRecentAIAnalytics()}
          </div>
          
          <div class="mt-6 text-center">
            <a href="/operations/ai-risk-assessment" 
               class="text-indigo-600 hover:text-indigo-500 font-medium">
              View All AI Analytics →
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

// Helper Functions for Service Intelligence

function renderServiceQuickList() {
  const services = [
    { name: 'Customer Portal', assets: 23, cia: 'H/H/M', risk: 'High' },
    { name: 'Payment Gateway', assets: 12, cia: 'C/C/H', risk: 'Critical' },
    { name: 'API Services', assets: 45, cia: 'H/H/H', risk: 'High' },
    { name: 'Data Warehouse', assets: 18, cia: 'C/H/M', risk: 'High' }
  ];
  
  return services.map(service => html`
    <div class="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
      <div>
        <p class="font-medium text-gray-900">${service.name}</p>
        <p class="text-sm text-gray-600">${service.assets} assets • CIA: ${service.cia}</p>
      </div>
      <div class="flex items-center space-x-2">
        <span class="px-2 py-1 text-xs font-medium rounded-full ${getRiskBadgeColor(service.risk)}">
          ${service.risk}
        </span>
        <button class="text-blue-600 hover:text-blue-500 text-sm">
          <i class="fas fa-link"></i>
        </button>
      </div>
    </div>
  `).join('');
}

function renderRecentAIAnalytics() {
  const analytics = [
    {
      type: 'Risk Prediction',
      service: 'Payment Gateway',
      prediction: 'Elevated risk due to new vulnerabilities',
      confidence: '94%',
      icon: 'chart-line',
      color: 'red'
    },
    {
      type: 'Impact Analysis',
      service: 'Customer Portal',
      prediction: 'Service disruption could affect 15,000 users',
      confidence: '87%',
      icon: 'users',
      color: 'orange'
    },
    {
      type: 'Auto-Fill Success',
      service: 'API Services',
      prediction: 'Risk assessment completed with AI suggestions',
      confidence: '91%',
      icon: 'magic',
      color: 'green'
    }
  ];
  
  return analytics.map(item => html`
    <div class="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg">
      <div class="flex-shrink-0">
        <div class="w-8 h-8 bg-${item.color}-100 rounded-full flex items-center justify-center">
          <i class="fas fa-${item.icon} text-${item.color}-600 text-sm"></i>
        </div>
      </div>
      <div class="flex-1">
        <div class="flex items-center justify-between">
          <p class="text-sm font-medium text-gray-900">${item.type}</p>
          <span class="text-xs text-gray-500">${item.confidence} confidence</span>
        </div>
        <p class="text-sm text-gray-600">${item.service}: ${item.prediction}</p>
      </div>
    </div>
  `).join('');
}

function getRiskBadgeColor(risk: string): string {
  const colors: { [key: string]: string } = {
    'Critical': 'bg-red-100 text-red-800',
    'High': 'bg-orange-100 text-orange-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'Low': 'bg-green-100 text-green-800'
  };
  return colors[risk] || 'bg-gray-100 text-gray-800';
}

// Microsoft Defender Integration Page
const renderDefenderIntegration = (user: any) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 flex items-center">
          <i class="fab fa-microsoft mr-3 text-blue-600"></i>
          Microsoft Defender Integration
        </h1>
        <p class="mt-2 text-lg text-gray-600">
          Configure and manage Microsoft Defender for Endpoint integration for asset import and incident synchronization
        </p>
      </div>
      
      <!-- Configuration Panel -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Integration Configuration</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tenant ID</label>
            <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md" 
                   placeholder="Enter Azure AD Tenant ID">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Application ID</label>
            <input type="text" class="w-full px-3 py-2 border border-gray-300 rounded-md" 
                   placeholder="Enter Application (Client) ID">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Client Secret</label>
            <input type="password" class="w-full px-3 py-2 border border-gray-300 rounded-md" 
                   placeholder="Enter Client Secret">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Sync Interval</label>
            <select class="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option>Every 4 hours</option>
              <option>Every 8 hours</option>
              <option>Daily</option>
              <option>Manual only</option>
            </select>
          </div>
        </div>
        
        <div class="mt-6 flex space-x-4">
          <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Test Connection
          </button>
          <button class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            Save Configuration
          </button>
        </div>
      </div>
      
      <!-- Import Summary -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Asset Import</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span>Total Assets:</span>
              <span class="font-medium">247</span>
            </div>
            <div class="flex justify-between">
              <span>With Vulnerabilities:</span>
              <span class="font-medium text-red-600">89</span>
            </div>
            <div class="flex justify-between">
              <span>Last Import:</span>
              <span class="font-medium">2 hours ago</span>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Incidents Sync</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span>Active Incidents:</span>
              <span class="font-medium">7</span>
            </div>
            <div class="flex justify-between">
              <span>Critical:</span>
              <span class="font-medium text-red-600">2</span>
            </div>
            <div class="flex justify-between">
              <span>Last Sync:</span>
              <span class="font-medium">1 hour ago</span>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">API Status</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span>Connection:</span>
              <span class="font-medium text-green-600">Active</span>
            </div>
            <div class="flex justify-between">
              <span>Rate Limit:</span>
              <span class="font-medium">45/100 calls</span>
            </div>
            <div class="flex justify-between">
              <span>Token Expires:</span>
              <span class="font-medium">23 hours</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

// Service Management Page
const renderServiceManagement = (user: any) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-sitemap mr-3 text-blue-600"></i>
            Service Management
          </h1>
          <p class="mt-2 text-lg text-gray-600">
            Manage organizational services and calculate CIA ratings based on linked assets
          </p>
        </div>
        <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
          <i class="fas fa-plus mr-2"></i>
          Add Service
        </button>
      </div>
      
      <!-- Services Overview -->
      <div class="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Services Overview</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assets</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CIA Rating</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Level</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${renderServiceTableRows()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
`;

// AI Risk Assessment Page
const renderAIRiskAssessment = (user: any) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 flex items-center">
          <i class="fas fa-brain mr-3 text-purple-600"></i>
          AI-Powered Risk Assessment
        </h1>
        <p class="mt-2 text-lg text-gray-600">
          Create service-linked risk assessments with AI auto-fill using configured LLM providers
        </p>
      </div>
      
      <!-- Risk Assessment Form -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Create New Risk Assessment</h2>
        
        <form hx-post="/operations/api/ai/analyze-risk" hx-target="#ai-results" hx-swap="innerHTML">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Risk Basic Info -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Risk Title</label>
              <input type="text" name="riskTitle" class="w-full px-3 py-2 border border-gray-300 rounded-md">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Linked Service</label>
              <select name="serviceId" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                <option value="">Select Service</option>
                <option value="customer-portal">Customer Portal</option>
                <option value="payment-gateway">Payment Gateway</option>
                <option value="api-services">API Services</option>
                <option value="data-warehouse">Data Warehouse</option>
              </select>
            </div>
            
            <!-- Risk Description -->
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">Risk Description</label>
              <textarea name="riskDescription" rows="3" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Describe the risk scenario..."></textarea>
            </div>
          </div>
          
          <!-- AI Analysis Button -->
          <div class="mt-6 text-center">
            <button type="submit" 
                    class="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center mx-auto">
              <i class="fas fa-magic mr-2"></i>
              Analyze with AI
            </button>
          </div>
        </form>
        
        <!-- AI Results -->
        <div id="ai-results" class="mt-6"></div>
      </div>
      
      <!-- AI Analytics Dashboard -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Risk Predictions</h3>
          <div class="space-y-4">
            ${renderRiskPredictions()}
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Impact Analysis</h3>
          <div class="space-y-4">
            ${renderImpactAnalysis()}
          </div>
        </div>
      </div>
    </div>
  </div>
`;

// Service-Asset Linking Page
const renderServiceAssetLinking = (user: any) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 flex items-center">
          <i class="fas fa-link mr-3 text-green-600"></i>
          Service-Asset Linking
        </h1>
        <p class="mt-2 text-lg text-gray-600">
          Link imported assets to services for comprehensive CIA rating calculation
        </p>
      </div>
      
      <!-- Linking Interface -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Services Panel -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Services</h2>
          </div>
          <div class="p-6">
            <div class="space-y-3">
              ${renderServiceLinkingList()}
            </div>
          </div>
        </div>
        
        <!-- Assets Panel -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Available Assets</h2>
          </div>
          <div class="p-6">
            <div class="mb-4">
              <input type="text" placeholder="Search assets..." 
                     class="w-full px-3 py-2 border border-gray-300 rounded-md">
            </div>
            <div class="space-y-2 max-h-96 overflow-y-auto">
              ${renderAssetLinkingList()}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

// Helper functions for rendering components
function renderServiceTableRows() {
  const services = [
    { name: 'Customer Portal', assets: 23, c: 'High', i: 'High', a: 'Medium', risk: 'High' },
    { name: 'Payment Gateway', assets: 12, c: 'Critical', i: 'Critical', a: 'High', risk: 'Critical' },
    { name: 'API Services', assets: 45, c: 'High', i: 'High', a: 'High', risk: 'High' },
    { name: 'Data Warehouse', assets: 18, c: 'Critical', i: 'High', a: 'Medium', risk: 'High' }
  ];
  
  return services.map(service => html`
    <tr>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm font-medium text-gray-900">${service.name}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="text-sm text-gray-900">${service.assets}</span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-xs">
          <div>C: <span class="${getCIAColor(service.c)}">${service.c}</span></div>
          <div>I: <span class="${getCIAColor(service.i)}">${service.i}</span></div>
          <div>A: <span class="${getCIAColor(service.a)}">${service.a}</span></div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 py-1 text-xs font-medium rounded-full ${getRiskBadgeColor(service.risk)}">
          ${service.risk}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button class="text-blue-600 hover:text-blue-500 mr-2">Edit</button>
        <button class="text-green-600 hover:text-green-500">Link Assets</button>
      </td>
    </tr>
  `).join('');
}

function renderRiskPredictions() {
  return [
    'Payment system vulnerability trend increasing',
    'Customer portal attack surface expanding', 
    'API rate limiting bypass attempts detected'
  ].map(prediction => html`
    <div class="p-3 bg-orange-50 border-l-4 border-orange-500 rounded">
      <p class="text-sm text-orange-800">${prediction}</p>
    </div>
  `).join('');
}

function renderImpactAnalysis() {
  return [
    'Service outage could affect 15,000 users',
    'Data breach impact: $2.3M estimated cost',
    'Recovery time objective: 4 hours'
  ].map(impact => html`
    <div class="p-3 bg-red-50 border-l-4 border-red-500 rounded">
      <p class="text-sm text-red-800">${impact}</p>
    </div>
  `).join('');
}

function renderServiceLinkingList() {
  return [
    'Customer Portal (23 assets)',
    'Payment Gateway (12 assets)',
    'API Services (45 assets)'
  ].map(service => html`
    <div class="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
      <p class="text-sm font-medium">${service}</p>
    </div>
  `).join('');
}

function renderAssetLinkingList() {
  return [
    'SRV-WEB-01 (Web Server)',
    'SRV-DB-01 (Database)',
    'WS-FINANCE-12 (Workstation)'
  ].map(asset => html`
    <div class="flex items-center justify-between p-2 border border-gray-200 rounded">
      <span class="text-sm">${asset}</span>
      <button class="text-green-600 hover:text-green-500 text-xs">Link</button>
    </div>
  `).join('');
}

function getCIAColor(level: string): string {
  const colors: { [key: string]: string } = {
    'Critical': 'text-red-600',
    'High': 'text-orange-600',
    'Medium': 'text-yellow-600',
    'Low': 'text-green-600'
  };
  return colors[level] || 'text-gray-600';
}

// Mock data functions for demonstration
async function syncDefenderAssets() {
  // Simulate Microsoft Defender API call
  return [
    { id: 'DEF-001', name: 'DESKTOP-ABC123', type: 'Workstation', criticality: 'Medium', vulnerabilities: 3 },
    { id: 'DEF-002', name: 'SERVER-XYZ789', type: 'Server', criticality: 'High', vulnerabilities: 7 },
    { id: 'DEF-003', name: 'LAPTOP-QWE456', type: 'Mobile', criticality: 'Low', vulnerabilities: 1 }
  ];
}

async function analyzeRiskWithAI(riskDetails: any, serviceDetails: any, linkedAssets: any) {
  // Simulate AI analysis using configured LLM
  return {
    riskScore: 8.5,
    likelihood: 'High',
    impact: 'Critical',
    suggestions: [
      'Implement multi-factor authentication',
      'Regular security assessments',
      'Employee training programs'
    ],
    autoFillData: {
      category: 'Cybersecurity',
      owner: 'IT Security Team',
      mitigation: 'Enhance access controls and monitoring'
    }
  };
}

async function linkAssetsToService(serviceId: string, assetIds: string[]) {
  // Simulate service-asset linking
  return {
    id: serviceId,
    name: 'Customer Portal',
    linkedAssets: assetIds,
    ciaRating: { c: 'High', i: 'High', a: 'Medium' },
    overallRisk: 'High'
  };
}

async function calculateServiceCIARating(serviceId: string) {
  // Calculate CIA rating based on linked assets
  return {
    confidentiality: 'High',
    integrity: 'High', 
    availability: 'Medium',
    overallRisk: 'High',
    assetCount: 23,
    calculation: 'Based on 23 linked assets with weighted criticality'
  };
}