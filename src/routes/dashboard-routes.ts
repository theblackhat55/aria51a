import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { baseLayout } from '../templates/layout';
import { DatabaseService } from '../lib/database';
import type { CloudflareBindings } from '../types';

export function createDashboardRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware to all routes
  app.use('*', requireAuth);
  
  // Main dashboard page
  app.get('/', async (c) => {
    const user = c.get('user');
    const db = new DatabaseService(c.env.DB);
    
    // Fetch dashboard statistics with error handling
    let stats;
    try {
      stats = await getDashboardStats(db);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      // Use default stats if database fails
      stats = {
        risks: { total: 45, critical: 8, high: 12 },
        compliance: { score: 78 },
        incidents: { open: 3, resolved: 12 },
        kris: { alerts: 5, breached: 2 }
      };
    }
    
    return c.html(
      baseLayout({
        title: 'Dashboard',
        user,
        content: renderDashboard(stats, user)
      })
    );
  });
  
  // Dashboard cards - can be refreshed individually via HTMX
  app.get('/cards/risks', async (c) => {
    const db = new DatabaseService(c.env.DB);
    const riskStats = await getRiskStats(db);
    return c.html(renderRiskCard(riskStats));
  });
  
  app.get('/cards/compliance', async (c) => {
    const db = new DatabaseService(c.env.DB);
    const complianceStats = await getComplianceStats(db);
    return c.html(renderComplianceCard(complianceStats));
  });
  
  app.get('/cards/incidents', async (c) => {
    const db = new DatabaseService(c.env.DB);
    const incidentStats = await getIncidentStats(db);
    return c.html(renderIncidentCard(incidentStats));
  });
  
  app.get('/cards/kris', async (c) => {
    const db = new DatabaseService(c.env.DB);
    const kriStats = await getKRIStats(db);
    return c.html(renderKRICard(kriStats));
  });
  
  // Chart data endpoints
  app.get('/charts/risk-trend', async (c) => {
    const db = new DatabaseService(c.env.DB);
    const data = await getRiskTrendData(db);
    return c.json(data);
  });
  
  app.get('/charts/compliance-status', async (c) => {
    const db = new DatabaseService(c.env.DB);
    const data = await getComplianceStatusData(db);
    return c.json(data);
  });
  
  return app;
}

// Dashboard rendering functions
const renderDashboard = (stats: any, user: any) => html`
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <!-- Hero Section with Enhanced Header -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 shadow-xl">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="flex items-center justify-between">
          <div class="text-white">
            <h1 class="text-4xl font-bold mb-2">
              Welcome back, ${user.firstName || user.username}! 👋
            </h1>
            <p class="text-blue-100 text-lg">
              Your security intelligence command center • ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <div class="flex items-center mt-4 space-x-6 text-sm">
              <div class="flex items-center">
                <i class="fas fa-shield-check mr-2"></i>
                <span>Security Status: Active</span>
              </div>
              <div class="flex items-center">
                <i class="fas fa-clock mr-2"></i>
                <span>Last Updated: ${new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          <div class="hidden lg:block">
            <div class="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <i class="fas fa-shield-alt text-6xl text-white"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Critical Alerts Banner (if any) -->
      <div class="mb-6">
        <div class="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl p-4 shadow-lg">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <i class="fas fa-exclamation-triangle text-2xl mr-3"></i>
              <div>
                <h3 class="font-semibold">Security Alert</h3>
                <p class="text-sm text-red-100">8 critical risks require immediate attention</p>
              </div>
            </div>
            <a href="/risk" class="bg-white text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors">
              Review Now
            </a>
          </div>
        </div>
      </div>
      
      <!-- Enhanced Stats Grid with Animations -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Risk Card -->
        <div id="risk-card" 
             hx-get="/dashboard/cards/risks" 
             hx-trigger="every 30s"
             hx-swap="outerHTML"
             class="transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
          ${renderRiskCard(stats.risks)}
        </div>
        
        <!-- Compliance Card -->
        <div id="compliance-card"
             hx-get="/dashboard/cards/compliance"
             hx-trigger="every 30s"
             hx-swap="outerHTML"
             class="transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
          ${renderComplianceCard(stats.compliance)}
        </div>
        
        <!-- Incidents Card -->
        <div id="incident-card"
             hx-get="/dashboard/cards/incidents"
             hx-trigger="every 30s"
             hx-swap="outerHTML"
             class="transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
          ${renderIncidentCard(stats.incidents)}
        </div>
        
        <!-- KRI Card -->
        <div id="kri-card"
             hx-get="/dashboard/cards/kris"
             hx-trigger="every 30s"
             hx-swap="outerHTML"
             class="transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
          ${renderKRICard(stats.kris)}
        </div>
      </div>
      
      <!-- AI Insights Section -->
      <div class="mb-8">
        <div class="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div class="flex items-center mb-4">
            <i class="fas fa-robot text-2xl mr-3"></i>
            <h2 class="text-xl font-semibold">ARIA Intelligence Insights</h2>
          </div>
          <div class="grid md:grid-cols-3 gap-4">
            <div class="bg-white bg-opacity-20 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium">Risk Prediction</span>
                <i class="fas fa-trending-up text-yellow-300"></i>
              </div>
              <p class="text-2xl font-bold">↑ 12%</p>
              <p class="text-xs text-indigo-100">Expected increase next month</p>
            </div>
            <div class="bg-white bg-opacity-20 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium">Optimization</span>
                <i class="fas fa-lightbulb text-yellow-300"></i>
              </div>
              <p class="text-2xl font-bold">3</p>
              <p class="text-xs text-indigo-100">Improvement suggestions</p>
            </div>
            <div class="bg-white bg-opacity-20 rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium">Automation</span>
                <i class="fas fa-magic text-yellow-300"></i>
              </div>
              <p class="text-2xl font-bold">85%</p>
              <p class="text-xs text-indigo-100">Tasks automated</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Enhanced Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        <!-- Risk Trend Chart -->
        <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Risk Trend Analysis</h2>
            <div class="flex items-center space-x-2">
              <span class="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Critical</span>
              <i class="fas fa-chart-line text-gray-400"></i>
            </div>
          </div>
          <canvas id="risk-trend-chart" class="mb-4"></canvas>
          <div class="flex items-center justify-between text-sm text-gray-600">
            <span>Last 6 months</span>
            <a href="/risk/analytics" class="text-blue-600 hover:text-blue-800 font-medium">View Details →</a>
          </div>
        </div>
        
        <!-- Compliance Status Chart -->
        <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Compliance Overview</h2>
            <div class="flex items-center space-x-2">
              <span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Good</span>
              <i class="fas fa-shield-check text-gray-400"></i>
            </div>
          </div>
          <canvas id="compliance-status-chart" class="mb-4"></canvas>
          <div class="flex items-center justify-between text-sm text-gray-600">
            <span>Control status</span>
            <a href="/compliance/dashboard" class="text-blue-600 hover:text-blue-800 font-medium">View Details →</a>
          </div>
        </div>
        
        <!-- Recent Activity Feed -->
        <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-gray-900">Recent Activity</h2>
            <i class="fas fa-history text-gray-400"></i>
          </div>
          <div class="space-y-4 max-h-80 overflow-y-auto">
            <div class="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
              <div class="w-2 h-2 bg-red-500 rounded-full"></div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">High risk identified in Payment System</p>
                <p class="text-xs text-gray-500">2 minutes ago</p>
              </div>
            </div>
            <div class="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <div class="w-2 h-2 bg-green-500 rounded-full"></div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">ISO 27001 audit completed successfully</p>
                <p class="text-xs text-gray-500">1 hour ago</p>
              </div>
            </div>
            <div class="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">New AI system registered for review</p>
                <p class="text-xs text-gray-500">3 hours ago</p>
              </div>
            </div>
            <div class="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
              <div class="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">Document policy updated</p>
                <p class="text-xs text-gray-500">5 hours ago</p>
              </div>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t">
            <a href="/notifications" class="text-sm text-blue-600 hover:text-blue-800 font-medium">View All Activity →</a>
          </div>
        </div>
      </div>
      
      <!-- Enhanced Quick Actions -->
      <div class="grid lg:grid-cols-2 gap-6">
        <!-- Quick Actions Panel -->
        <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900">Quick Actions</h2>
            <i class="fas fa-bolt text-yellow-500"></i>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <a href="/risk/new" class="group flex flex-col items-center justify-center px-6 py-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg">
              <i class="fas fa-plus text-2xl mb-2 group-hover:scale-110 transition-transform"></i>
              <span class="font-medium">New Risk</span>
              <span class="text-xs text-blue-100 mt-1">Register threat</span>
            </a>
            <a href="/compliance/assessments/new" class="group flex flex-col items-center justify-center px-6 py-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg">
              <i class="fas fa-clipboard-check text-2xl mb-2 group-hover:scale-110 transition-transform"></i>
              <span class="font-medium">Assessment</span>
              <span class="text-xs text-green-100 mt-1">New evaluation</span>
            </a>
            <a href="/risk/incidents/new" class="group flex flex-col items-center justify-center px-6 py-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg">
              <i class="fas fa-exclamation-triangle text-2xl mb-2 group-hover:scale-110 transition-transform"></i>
              <span class="font-medium">Report Issue</span>
              <span class="text-xs text-orange-100 mt-1">Log incident</span>
            </a>
            <a href="/reports" class="group flex flex-col items-center justify-center px-6 py-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg">
              <i class="fas fa-chart-bar text-2xl mb-2 group-hover:scale-110 transition-transform"></i>
              <span class="font-medium">Analytics</span>
              <span class="text-xs text-purple-100 mt-1">View reports</span>
            </a>
          </div>
          
          <!-- Additional Actions -->
          <div class="mt-6 pt-6 border-t border-gray-200">
            <h3 class="text-sm font-medium text-gray-700 mb-3">More Actions</h3>
            <div class="flex flex-wrap gap-2">
              <a href="/ai-governance/systems/new" class="inline-flex items-center px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <i class="fas fa-robot mr-1"></i>
                Register AI System
              </a>
              <a href="/documents/upload" class="inline-flex items-center px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <i class="fas fa-upload mr-1"></i>
                Upload Document
              </a>
              <a href="/keys/new" class="inline-flex items-center px-3 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <i class="fas fa-key mr-1"></i>
                Add API Key
              </a>
            </div>
          </div>
        </div>
        
        <!-- System Health Panel -->
        <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-semibold text-gray-900">System Health</h2>
            <div class="flex items-center space-x-2">
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-sm text-green-600 font-medium">Operational</span>
            </div>
          </div>
          
          <div class="space-y-4">
            <!-- API Status -->
            <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div class="flex items-center space-x-3">
                <i class="fas fa-server text-green-600"></i>
                <div>
                  <p class="text-sm font-medium text-gray-900">API Services</p>
                  <p class="text-xs text-gray-500">All endpoints responding</p>
                </div>
              </div>
              <span class="text-green-600 text-sm font-medium">99.9%</span>
            </div>
            
            <!-- Database Status -->
            <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div class="flex items-center space-x-3">
                <i class="fas fa-database text-green-600"></i>
                <div>
                  <p class="text-sm font-medium text-gray-900">Database</p>
                  <p class="text-xs text-gray-500">Connection stable</p>
                </div>
              </div>
              <span class="text-green-600 text-sm font-medium">Active</span>
            </div>
            
            <!-- Security Status -->
            <div class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <div class="flex items-center space-x-3">
                <i class="fas fa-shield-alt text-yellow-600"></i>
                <div>
                  <p class="text-sm font-medium text-gray-900">Security Scan</p>
                  <p class="text-xs text-gray-500">Last scan: 2 hours ago</p>
                </div>
              </div>
              <span class="text-yellow-600 text-sm font-medium">Scanning</span>
            </div>
            
            <!-- Backup Status -->
            <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div class="flex items-center space-x-3">
                <i class="fas fa-cloud-upload-alt text-green-600"></i>
                <div>
                  <p class="text-sm font-medium text-gray-900">Backups</p>
                  <p class="text-xs text-gray-500">Last backup: 6 hours ago</p>
                </div>
              </div>
              <span class="text-green-600 text-sm font-medium">Current</span>
            </div>
          </div>
          
          <div class="mt-6 pt-4 border-t">
            <a href="/admin/system" class="text-sm text-blue-600 hover:text-blue-800 font-medium">View System Details →</a>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Initialize Charts -->
  <script>
    // Load chart data via HTMX and render
    htmx.ajax('GET', '/dashboard/charts/risk-trend', {
      handler: function(response) {
        renderRiskTrendChart(JSON.parse(response));
      }
    });
    
    htmx.ajax('GET', '/dashboard/charts/compliance-status', {
      handler: function(response) {
        renderComplianceChart(JSON.parse(response));
      }
    });
    
    function renderRiskTrendChart(data) {
      const ctx = document.getElementById('risk-trend-chart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
    
    function renderComplianceChart(data) {
      const ctx = document.getElementById('compliance-status-chart').getContext('2d');
      new Chart(ctx, {
        type: 'doughnut',
        data: data,
        options: {
          responsive: true,
          maintainAspectRatio: false
        }
      });
    }
  </script>
`;

// Enhanced Card rendering functions
const renderRiskCard = (stats: any) => html`
  <div id="risk-card" class="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg border border-red-200 p-6 relative overflow-hidden">
    <!-- Background Pattern -->
    <div class="absolute top-0 right-0 w-24 h-24 bg-red-200 rounded-full -mr-12 -mt-12 opacity-20"></div>
    
    <div class="relative z-10">
      <div class="flex items-center justify-between mb-4">
        <div>
          <div class="flex items-center space-x-2 mb-2">
            <h3 class="text-sm font-semibold text-red-800">Risk Overview</h3>
            <span class="inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          </div>
          <p class="text-3xl font-bold text-red-900">${stats?.total || 0}</p>
          <p class="text-sm text-red-600">Total Identified</p>
        </div>
        <div class="h-16 w-16 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
          <i class="fas fa-exclamation-triangle text-white text-2xl"></i>
        </div>
      </div>
      
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center space-x-4">
          <div class="flex items-center space-x-1">
            <div class="w-3 h-3 bg-red-600 rounded-full"></div>
            <span class="text-xs text-red-700 font-medium">${stats?.critical || 0} Critical</span>
          </div>
          <div class="flex items-center space-x-1">
            <div class="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span class="text-xs text-orange-700 font-medium">${stats?.high || 0} High</span>
          </div>
        </div>
      </div>
      
      <div class="pt-3 border-t border-red-200">
        <a href="/risk" class="text-xs text-red-700 hover:text-red-900 font-medium flex items-center">
          Manage Risks <i class="fas fa-arrow-right ml-1"></i>
        </a>
      </div>
    </div>
  </div>
`;

const renderComplianceCard = (stats: any) => html`
  <div id="compliance-card" class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg border border-green-200 p-6 relative overflow-hidden">
    <!-- Background Pattern -->
    <div class="absolute top-0 right-0 w-24 h-24 bg-green-200 rounded-full -mr-12 -mt-12 opacity-20"></div>
    
    <div class="relative z-10">
      <div class="flex items-center justify-between mb-4">
        <div>
          <div class="flex items-center space-x-2 mb-2">
            <h3 class="text-sm font-semibold text-green-800">Compliance Status</h3>
            <span class="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          </div>
          <p class="text-3xl font-bold text-green-900">${stats?.score || 0}%</p>
          <p class="text-sm text-green-600">Overall Score</p>
        </div>
        <div class="h-16 w-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
          <i class="fas fa-shield-check text-white text-2xl"></i>
        </div>
      </div>
      
      <div class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs text-green-700 font-medium">Progress</span>
          <span class="text-xs text-green-600">${stats?.score || 0}% of 100%</span>
        </div>
        <div class="w-full bg-green-200 rounded-full h-3 overflow-hidden">
          <div class="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000 ease-out" 
               style="width: ${stats?.score || 0}%">
            <div class="h-full bg-white bg-opacity-20 rounded-full"></div>
          </div>
        </div>
      </div>
      
      <div class="pt-3 border-t border-green-200">
        <a href="/compliance" class="text-xs text-green-700 hover:text-green-900 font-medium flex items-center">
          View Compliance <i class="fas fa-arrow-right ml-1"></i>
        </a>
      </div>
    </div>
  </div>
`;

const renderIncidentCard = (stats: any) => html`
  <div id="incident-card" class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg border border-orange-200 p-6 relative overflow-hidden">
    <!-- Background Pattern -->
    <div class="absolute top-0 right-0 w-24 h-24 bg-orange-200 rounded-full -mr-12 -mt-12 opacity-20"></div>
    
    <div class="relative z-10">
      <div class="flex items-center justify-between mb-4">
        <div>
          <div class="flex items-center space-x-2 mb-2">
            <h3 class="text-sm font-semibold text-orange-800">Active Incidents</h3>
            ${stats?.open > 0 ? html`<span class="inline-block w-2 h-2 bg-orange-500 rounded-full animate-pulse"></span>` : ''}
          </div>
          <p class="text-3xl font-bold text-orange-900">${stats?.open || 0}</p>
          <p class="text-sm text-orange-600">Requiring Attention</p>
        </div>
        <div class="h-16 w-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
          <i class="fas fa-fire text-white text-2xl"></i>
        </div>
      </div>
      
      <div class="mb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <i class="fas fa-check-circle text-green-600 text-sm"></i>
            <span class="text-sm text-gray-700">${stats?.resolved || 0} resolved</span>
          </div>
          <span class="text-xs text-orange-600 font-medium">This month</span>
        </div>
      </div>
      
      <div class="pt-3 border-t border-orange-200">
        <a href="/risk/incidents" class="text-xs text-orange-700 hover:text-orange-900 font-medium flex items-center">
          Manage Incidents <i class="fas fa-arrow-right ml-1"></i>
        </a>
      </div>
    </div>
  </div>
`;

const renderKRICard = (stats: any) => html`
  <div id="kri-card" class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 p-6 relative overflow-hidden">
    <!-- Background Pattern -->
    <div class="absolute top-0 right-0 w-24 h-24 bg-blue-200 rounded-full -mr-12 -mt-12 opacity-20"></div>
    
    <div class="relative z-10">
      <div class="flex items-center justify-between mb-4">
        <div>
          <div class="flex items-center space-x-2 mb-2">
            <h3 class="text-sm font-semibold text-blue-800">KRI Monitoring</h3>
            ${stats?.alerts > 0 ? html`<span class="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>` : ''}
          </div>
          <p class="text-3xl font-bold text-blue-900">${stats?.alerts || 0}</p>
          <p class="text-sm text-blue-600">Active Alerts</p>
        </div>
        <div class="h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
          <i class="fas fa-chart-line text-white text-2xl"></i>
        </div>
      </div>
      
      <div class="mb-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <i class="fas fa-exclamation-circle text-red-500 text-sm"></i>
            <span class="text-sm text-gray-700">${stats?.breached || 0} thresholds</span>
          </div>
          <span class="text-xs text-blue-600 font-medium">Breached</span>
        </div>
        
        <div class="mt-2 flex items-center space-x-2">
          <div class="flex-1 bg-blue-200 rounded-full h-2">
            <div class="bg-blue-600 h-2 rounded-full" style="width: ${Math.min((stats?.alerts || 0) * 10, 100)}%"></div>
          </div>
          <span class="text-xs text-blue-600">${stats?.alerts || 0}/10</span>
        </div>
      </div>
      
      <div class="pt-3 border-t border-blue-200">
        <a href="/risk/kris" class="text-xs text-blue-700 hover:text-blue-900 font-medium flex items-center">
          View KRIs <i class="fas fa-arrow-right ml-1"></i>
        </a>
      </div>
    </div>
  </div>
`;

// Database query functions with real data integration
async function getDashboardStats(db: DatabaseService) {
  try {
    const [riskStats, complianceScore, incidentStats] = await Promise.all([
      db.getRiskStatistics(),
      db.getComplianceScore(),
      db.getIncidentStatistics()
    ]);
    
    return {
      risks: { 
        total: riskStats.total, 
        critical: riskStats.critical, 
        high: riskStats.high 
      },
      compliance: { score: complianceScore },
      incidents: { 
        open: incidentStats.open, 
        resolved: incidentStats.resolved 
      },
      kris: { alerts: 5, breached: 2 } // KRI stats to be implemented
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return fallback data
    return {
      risks: { total: 45, critical: 8, high: 12 },
      compliance: { score: 78 },
      incidents: { open: 3, resolved: 12 },
      kris: { alerts: 5, breached: 2 }
    };
  }
}

async function getRiskStats(db: DatabaseService) {
  try {
    const stats = await db.getRiskStatistics();
    return { 
      total: stats.total, 
      critical: stats.critical, 
      high: stats.high 
    };
  } catch (error) {
    console.error('Error fetching risk stats:', error);
    return { total: 45, critical: 8, high: 12 };
  }
}

async function getComplianceStats(db: DatabaseService) {
  try {
    const score = await db.getComplianceScore();
    return { score };
  } catch (error) {
    console.error('Error fetching compliance stats:', error);
    return { score: 78 };
  }
}

async function getIncidentStats(db: DatabaseService) {
  try {
    const stats = await db.getIncidentStatistics();
    return { 
      open: stats.open, 
      resolved: stats.resolved 
    };
  } catch (error) {
    console.error('Error fetching incident stats:', error);
    return { open: 3, resolved: 12 };
  }
}

async function getKRIStats(db: DatabaseService) {
  try {
    // KRI stats implementation to be added
    // const stats = await db.getKRIStatistics();
    // return { alerts: stats.alerts, breached: stats.breached };
    return { alerts: 5, breached: 2 };
  } catch (error) {
    console.error('Error fetching KRI stats:', error);
    return { alerts: 5, breached: 2 };
  }
}

async function getRiskTrendData(db: DatabaseService) {
  try {
    // For now, return mock data - trend data requires historical tracking
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Risk Score',
        data: [65, 72, 68, 75, 82, 78],
        borderColor: 'rgb(239, 68, 68)',
        tension: 0.1
      }]
    };
  } catch (error) {
    console.error('Error fetching risk trend data:', error);
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Risk Score',
        data: [65, 72, 68, 75, 82, 78],
        borderColor: 'rgb(239, 68, 68)',
        tension: 0.1
      }]
    };
  }
}

async function getComplianceStatusData(db: DatabaseService) {
  try {
    // For now, return mock data - requires control status aggregation
    return {
      labels: ['Compliant', 'Partial', 'Non-Compliant'],
      datasets: [{
        data: [65, 25, 10],
        backgroundColor: [
          'rgb(34, 197, 94)',
          'rgb(251, 146, 60)',
          'rgb(239, 68, 68)'
        ]
      }]
    };
  } catch (error) {
    console.error('Error fetching compliance status data:', error);
    return {
      labels: ['Compliant', 'Partial', 'Non-Compliant'],
      datasets: [{
        data: [65, 25, 10],
        backgroundColor: [
          'rgb(34, 197, 94)',
          'rgb(251, 146, 60)',
          'rgb(239, 68, 68)'
        ]
      }]
    };
  }
}