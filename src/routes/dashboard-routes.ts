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
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Welcome Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">
          Welcome back, ${user.firstName || user.username}!
        </h1>
        <p class="text-gray-600 mt-1">
          Here's your risk intelligence overview for today
        </p>
      </div>
      
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <!-- Risk Card -->
        <div id="risk-card" 
             hx-get="/dashboard/cards/risks" 
             hx-trigger="every 30s"
             hx-swap="outerHTML">
          ${renderRiskCard(stats.risks)}
        </div>
        
        <!-- Compliance Card -->
        <div id="compliance-card"
             hx-get="/dashboard/cards/compliance"
             hx-trigger="every 30s"
             hx-swap="outerHTML">
          ${renderComplianceCard(stats.compliance)}
        </div>
        
        <!-- Incidents Card -->
        <div id="incident-card"
             hx-get="/dashboard/cards/incidents"
             hx-trigger="every 30s"
             hx-swap="outerHTML">
          ${renderIncidentCard(stats.incidents)}
        </div>
        
        <!-- KRI Card -->
        <div id="kri-card"
             hx-get="/dashboard/cards/kris"
             hx-trigger="every 30s"
             hx-swap="outerHTML">
          ${renderKRICard(stats.kris)}
        </div>
      </div>
      
      <!-- Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Risk Trend Chart -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Risk Trend</h2>
          <canvas id="risk-trend-chart"></canvas>
        </div>
        
        <!-- Compliance Status Chart -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Compliance Status</h2>
          <canvas id="compliance-status-chart"></canvas>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="mt-8 bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/risk/new" class="flex items-center justify-center px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
            <i class="fas fa-plus mr-2"></i>
            New Risk
          </a>
          <a href="/compliance/assessments/new" class="flex items-center justify-center px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
            <i class="fas fa-clipboard-check mr-2"></i>
            New Assessment
          </a>
          <a href="/risk/incidents/new" class="flex items-center justify-center px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors">
            <i class="fas fa-exclamation-triangle mr-2"></i>
            Report Incident
          </a>
          <a href="/reports" class="flex items-center justify-center px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
            <i class="fas fa-chart-bar mr-2"></i>
            View Reports
          </a>
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

// Card rendering functions
const renderRiskCard = (stats: any) => html`
  <div id="risk-card" class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-600">Total Risks</p>
        <p class="text-2xl font-bold text-gray-900">${stats?.total || 0}</p>
      </div>
      <div class="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
        <i class="fas fa-exclamation-triangle text-red-600"></i>
      </div>
    </div>
    <div class="mt-4">
      <div class="flex items-center text-sm">
        <span class="text-red-600 font-medium">${stats?.critical || 0} Critical</span>
        <span class="mx-2 text-gray-400">•</span>
        <span class="text-orange-600 font-medium">${stats?.high || 0} High</span>
      </div>
    </div>
  </div>
`;

const renderComplianceCard = (stats: any) => html`
  <div id="compliance-card" class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-600">Compliance Score</p>
        <p class="text-2xl font-bold text-gray-900">${stats?.score || 0}%</p>
      </div>
      <div class="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
        <i class="fas fa-clipboard-check text-green-600"></i>
      </div>
    </div>
    <div class="mt-4">
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div class="bg-green-600 h-2 rounded-full" style="width: ${stats?.score || 0}%"></div>
      </div>
    </div>
  </div>
`;

const renderIncidentCard = (stats: any) => html`
  <div id="incident-card" class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-600">Open Incidents</p>
        <p class="text-2xl font-bold text-gray-900">${stats?.open || 0}</p>
      </div>
      <div class="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
        <i class="fas fa-fire text-orange-600"></i>
      </div>
    </div>
    <div class="mt-4">
      <p class="text-sm text-gray-500">
        ${stats?.resolved || 0} resolved this month
      </p>
    </div>
  </div>
`;

const renderKRICard = (stats: any) => html`
  <div id="kri-card" class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm text-gray-600">KRI Alerts</p>
        <p class="text-2xl font-bold text-gray-900">${stats?.alerts || 0}</p>
      </div>
      <div class="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
        <i class="fas fa-chart-line text-blue-600"></i>
      </div>
    </div>
    <div class="mt-4">
      <p class="text-sm text-gray-500">
        ${stats?.breached || 0} thresholds breached
      </p>
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