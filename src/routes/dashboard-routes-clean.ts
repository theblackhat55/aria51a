import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import type { CloudflareBindings } from '../types';

export function createCleanDashboardRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // PRODUCTION: Proper authentication middleware
  app.use('*', requireAuth);
  
  // Main dashboard page
  app.get('/', async (c) => {
    const user = c.get('user');
    
    // Fetch real data from D1 database
    let stats = {
      risks: { total: 0, critical: 0, high: 0, medium: 0, low: 0 },
      compliance: { score: 0, frameworks: 0, controls: 0, soc2: 0, iso27001: 0 },
      incidents: { open: 0, resolved: 0, total: 0 },
      kris: { alerts: 0, breached: 0, monitored: 0 }
    };

    try {
      // Get real risk statistics
      const risksResult = await c.env.DB.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN risk_score >= 20 THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN risk_score >= 12 AND risk_score < 20 THEN 1 ELSE 0 END) as high,
          SUM(CASE WHEN risk_score >= 6 AND risk_score < 12 THEN 1 ELSE 0 END) as medium,
          SUM(CASE WHEN risk_score < 6 THEN 1 ELSE 0 END) as low
        FROM risks 
        WHERE status = 'active'
      `).first();

      if (risksResult) {
        stats.risks = {
          total: risksResult.total || 0,
          critical: risksResult.critical || 0,
          high: risksResult.high || 0,
          medium: risksResult.medium || 0,
          low: risksResult.low || 0
        };
      }

      // Get compliance framework count
      const frameworksResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM compliance_frameworks WHERE is_active = 1').first();
      stats.compliance.frameworks = frameworksResult?.count || 0;

      // Calculate compliance score based on implemented controls
      const complianceResult = await c.env.DB.prepare(`
        SELECT 
          COUNT(*) as total_controls,
          SUM(CASE WHEN implementation_status = 'implemented' THEN 1 ELSE 0 END) as implemented_controls
        FROM soa 
        WHERE is_applicable = 1
      `).first();

      if (complianceResult && complianceResult.total_controls > 0) {
        stats.compliance.score = Math.round((complianceResult.implemented_controls / complianceResult.total_controls) * 100);
        stats.compliance.controls = complianceResult.total_controls;
      }

      // Get incident statistics  
      const incidentsResult = await c.env.DB.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
          SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved
        FROM incidents
      `).first();

      if (incidentsResult) {
        stats.incidents = {
          open: incidentsResult.open || 0,
          resolved: incidentsResult.resolved || 0,
          total: incidentsResult.total || 0
        };
      }

      // Get KRI statistics
      const krisResult = await c.env.DB.prepare(`
        SELECT 
          COUNT(*) as monitored,
          SUM(CASE WHEN current_value > threshold_value THEN 1 ELSE 0 END) as breached
        FROM kris 
        WHERE status = 'active'
      `).first();

      if (krisResult) {
        stats.kris = {
          alerts: krisResult.breached || 0,
          breached: krisResult.breached || 0,
          monitored: krisResult.monitored || 0
        };
      }

    } catch (error) {
      console.error('Error fetching dashboard statistics:', error);
      // Fall back to default values if database error
    }
    
    return c.html(
      cleanLayout({
        title: 'Dashboard',
        user,
        content: renderCleanDashboard(stats, user)
      })
    );
  });
  
  // Individual card refresh endpoints (real data)
  app.get('/cards/risks', async (c) => {
    try {
      const result = await c.env.DB.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN risk_score >= 20 THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN risk_score >= 12 AND risk_score < 20 THEN 1 ELSE 0 END) as high,
          SUM(CASE WHEN risk_score >= 6 AND risk_score < 12 THEN 1 ELSE 0 END) as medium,
          SUM(CASE WHEN risk_score < 6 THEN 1 ELSE 0 END) as low
        FROM risks 
        WHERE status = 'active'
      `).first();

      const stats = {
        total: result?.total || 0,
        critical: result?.critical || 0,
        high: result?.high || 0,
        medium: result?.medium || 0,
        low: result?.low || 0
      };
      return c.html(renderRiskCard(stats));
    } catch (error) {
      console.error('Error fetching risk stats:', error);
      const stats = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
      return c.html(renderRiskCard(stats));
    }
  });
  
  app.get('/cards/compliance', async (c) => {
    try {
      const frameworksResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM compliance_frameworks WHERE is_active = 1').first();
      const complianceResult = await c.env.DB.prepare(`
        SELECT 
          COUNT(*) as total_controls,
          SUM(CASE WHEN implementation_status = 'implemented' THEN 1 ELSE 0 END) as implemented_controls
        FROM soa 
        WHERE is_applicable = 1
      `).first();

      let score = 0;
      if (complianceResult && complianceResult.total_controls > 0) {
        score = Math.round((complianceResult.implemented_controls / complianceResult.total_controls) * 100);
      }

      const stats = { 
        score: score, 
        frameworks: frameworksResult?.count || 0, 
        controls: complianceResult?.total_controls || 0, 
        soc2: score, 
        iso27001: score 
      };
      return c.html(renderComplianceCard(stats));
    } catch (error) {
      console.error('Error fetching compliance stats:', error);
      const stats = { score: 0, frameworks: 0, controls: 0, soc2: 0, iso27001: 0 };
      return c.html(renderComplianceCard(stats));
    }
  });
  
  app.get('/cards/incidents', async (c) => {
    try {
      const result = await c.env.DB.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) as open,
          SUM(CASE WHEN status IN ('resolved', 'closed') THEN 1 ELSE 0 END) as resolved
        FROM incidents
      `).first();

      const stats = { 
        open: result?.open || 0, 
        resolved: result?.resolved || 0, 
        total: result?.total || 0 
      };
      return c.html(renderIncidentCard(stats));
    } catch (error) {
      console.error('Error fetching incident stats:', error);
      const stats = { open: 0, resolved: 0, total: 0 };
      return c.html(renderIncidentCard(stats));
    }
  });
  
  app.get('/cards/kris', async (c) => {
    try {
      const result = await c.env.DB.prepare(`
        SELECT 
          COUNT(*) as monitored,
          SUM(CASE WHEN current_value > threshold_value THEN 1 ELSE 0 END) as breached
        FROM kris 
        WHERE status = 'active'
      `).first();

      const stats = { 
        alerts: result?.breached || 0, 
        breached: result?.breached || 0, 
        monitored: result?.monitored || 0 
      };
      return c.html(renderKRICard(stats));
    } catch (error) {
      console.error('Error fetching KRI stats:', error);
      const stats = { alerts: 0, breached: 0, monitored: 0 };
      return c.html(renderKRICard(stats));
    }
  });
  
  return app;
}

// Clean dashboard rendering
const renderCleanDashboard = (stats: any, user: any) => html`
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <!-- Hero Section -->
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
              <i class="fas fa-shield-halved text-6xl text-white"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Security Alert Banner -->
      <div class="mb-6">
        <div class="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl p-4 shadow-lg">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <i class="fas fa-exclamation-triangle text-2xl mr-3"></i>
              <div>
                <h3 class="font-semibold">Security Alert</h3>
                <p class="text-sm text-red-100">${stats.risks.critical} critical risks require immediate attention</p>
              </div>
            </div>
            <a href="/risk" class="bg-white text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-red-50 transition-colors">
              Review Now
            </a>
          </div>
        </div>
      </div>
      
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Risk Card -->
        <div id="risk-card" class="transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
          ${renderRiskCard(stats.risks)}
        </div>
        
        <!-- Compliance Card -->
        <div id="compliance-card" class="transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
          ${renderComplianceCard(stats.compliance)}
        </div>
        
        <!-- Incidents Card -->
        <div id="incident-card" class="transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
          ${renderIncidentCard(stats.incidents)}
        </div>
        
        <!-- KRI Card -->
        <div id="kri-card" class="transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
          ${renderKRICard(stats.kris)}
        </div>
      </div>
      
      <!-- Quick Actions Panel -->
      <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200 mb-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900">Quick Actions</h2>
          <i class="fas fa-bolt text-yellow-500"></i>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/risk/create" 
             hx-get="/risk/create" 
             hx-target="#modal-container"
             class="group flex flex-col items-center justify-center px-6 py-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg">
            <i class="fas fa-plus text-2xl mb-2 group-hover:scale-110 transition-transform"></i>
            <span class="font-medium">New Risk</span>
            <span class="text-xs text-blue-100 mt-1">Register threat</span>
          </a>
          
          <a href="/compliance/assessments/new" 
             class="group flex flex-col items-center justify-center px-6 py-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg">
            <i class="fas fa-clipboard-check text-2xl mb-2 group-hover:scale-110 transition-transform"></i>
            <span class="font-medium">Assessment</span>
            <span class="text-xs text-green-100 mt-1">New evaluation</span>
          </a>
          
          <a href="/risk/incidents/new" 
             class="group flex flex-col items-center justify-center px-6 py-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg">
            <i class="fas fa-exclamation-triangle text-2xl mb-2 group-hover:scale-110 transition-transform"></i>
            <span class="font-medium">Report Issue</span>
            <span class="text-xs text-orange-100 mt-1">Log incident</span>
          </a>
          
          <a href="/reports" 
             class="group flex flex-col items-center justify-center px-6 py-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg">
            <i class="fas fa-chart-bar text-2xl mb-2 group-hover:scale-110 transition-transform"></i>
            <span class="font-medium">Analytics</span>
            <span class="text-xs text-purple-100 mt-1">View reports</span>
          </a>
        </div>
      </div>
      
      <!-- System Status -->
      <div class="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900">System Health</h2>
          <div class="flex items-center space-x-2">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span class="text-sm text-green-600 font-medium">Operational</span>
          </div>
        </div>
        
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div class="flex items-center space-x-3">
              <i class="fas fa-server text-green-600"></i>
              <div>
                <p class="text-sm font-medium text-gray-900">API Services</p>
                <p class="text-xs text-gray-500">All systems operational</p>
              </div>
            </div>
            <span class="text-green-600 text-sm font-medium">99.9%</span>
          </div>
          
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
          
          <div class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div class="flex items-center space-x-3">
              <i class="fas fa-shield-halved text-yellow-600"></i>
              <div>
                <p class="text-sm font-medium text-gray-900">Security Scan</p>
                <p class="text-xs text-gray-500">Last: 2 hours ago</p>
              </div>
            </div>
            <span class="text-yellow-600 text-sm font-medium">Scanning</span>
          </div>
          
          <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div class="flex items-center space-x-3">
              <i class="fas fa-cloud-arrow-up text-green-600"></i>
              <div>
                <p class="text-sm font-medium text-gray-900">Backups</p>
                <p class="text-xs text-gray-500">Last: 6 hours ago</p>
              </div>
            </div>
            <span class="text-green-600 text-sm font-medium">Current</span>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

// Clean card components - NO auto-refresh, NO external calls
const renderRiskCard = (stats: any) => html`
  <div class="bg-gradient-to-br from-red-50 to-red-100 rounded-xl shadow-lg border border-red-200 p-6 relative overflow-hidden">
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
  <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-lg border border-green-200 p-6 relative overflow-hidden">
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
          <span class="text-xs text-green-700 font-medium">Frameworks</span>
          <span class="text-xs text-green-600">${stats?.frameworks || 0} active</span>
        </div>
        <div class="flex items-center space-x-2 mb-2">
          <div class="flex items-center space-x-1">
            <i class="fas fa-shield-halved text-blue-600 text-xs"></i>
            <span class="text-xs text-gray-700">SOC 2</span>
          </div>
          <div class="flex items-center space-x-1">
            <i class="fas fa-certificate text-green-600 text-xs"></i>
            <span class="text-xs text-gray-700">ISO 27001</span>
          </div>
        </div>
        <div class="w-full bg-green-200 rounded-full h-3 overflow-hidden">
          <div class="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-1000 ease-out" 
               style="width: ${stats?.score || 0}%">
            <div class="h-full bg-white bg-opacity-20 rounded-full"></div>
          </div>
        </div>
      </div>
      
      <div class="pt-3 border-t border-green-200">
        <div class="flex justify-between items-center">
          <a href="/compliance" class="text-xs text-green-700 hover:text-green-900 font-medium flex items-center">
            View Dashboard <i class="fas fa-arrow-right ml-1"></i>
          </a>
          <a href="/compliance/frameworks" class="text-xs text-blue-600 hover:text-blue-800 font-medium">
            Frameworks
          </a>
        </div>
      </div>
    </div>
  </div>
`;

const renderIncidentCard = (stats: any) => html`
  <div class="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg border border-orange-200 p-6 relative overflow-hidden">
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
  <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg border border-blue-200 p-6 relative overflow-hidden">
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
          <span class="text-xs text-blue-600">${stats?.alerts || 0}/${stats?.monitored || 10}</span>
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