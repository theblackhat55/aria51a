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
      kris: { alerts: 0, breached: 0, monitored: 0 },
      systemHealth: {
        overall_status: 'operational',
        services: {
          api_services: { name: 'API Services', status: 'operational', uptime: '99.9%', details: 'All systems operational' },
          database: { name: 'Database', status: 'operational', uptime: '100%', details: 'Connection stable' },
          security_scan: { name: 'Security Scan', status: 'operational', details: 'Last: Unknown' },
          backups: { name: 'Backups', status: 'operational', details: 'Last: Unknown' }
        }
      },
      securityStatus: 'operational'
    };

    try {
      // Get real risk statistics - fix: use probability * impact instead of risk_score
      const risksResult = await c.env.DB.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN (probability * impact) >= 20 THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN (probability * impact) >= 12 AND (probability * impact) < 20 THEN 1 ELSE 0 END) as high,
          SUM(CASE WHEN (probability * impact) >= 6 AND (probability * impact) < 12 THEN 1 ELSE 0 END) as medium,
          SUM(CASE WHEN (probability * impact) < 6 THEN 1 ELSE 0 END) as low
        FROM risks 
        WHERE status = 'active'
      `).first();

      if (risksResult) {
        stats.risks = {
          total: Number(risksResult.total) || 0,
          critical: Number(risksResult.critical) || 0,
          high: Number(risksResult.high) || 0,
          medium: Number(risksResult.medium) || 0,
          low: Number(risksResult.low) || 0
        };
        console.log('Dashboard stats - risks loaded:', stats.risks);
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
        stats.compliance.score = Math.round((Number(complianceResult.implemented_controls) / Number(complianceResult.total_controls)) * 100);
        stats.compliance.controls = Number(complianceResult.total_controls);
        console.log('Dashboard stats - compliance loaded:', stats.compliance);
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
          open: Number(incidentsResult.open) || 0,
          resolved: Number(incidentsResult.resolved) || 0,
          total: Number(incidentsResult.total) || 0
        };
        console.log('Dashboard stats - incidents loaded:', stats.incidents);
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
          alerts: Number(krisResult.breached) || 0,
          breached: Number(krisResult.breached) || 0,
          monitored: Number(krisResult.monitored) || 0
        };
        console.log('Dashboard stats - KRIs loaded:', stats.kris);
      }

      // Get real system health data
      try {
        const healthStatus = await c.env.DB.prepare(`
          SELECT 
            service_name,
            display_name,
            status,
            uptime_percentage,
            response_time_ms,
            datetime(last_check, 'localtime') as last_check_formatted
          FROM system_health_status 
          ORDER BY service_name
        `).all();

        // Get latest security scan
        const securityScan = await c.env.DB.prepare(`
          SELECT 
            status,
            findings_count,
            critical_count + high_count as urgent_findings,
            datetime(started_at, 'localtime') as started_at_formatted
          FROM security_scan_results 
          ORDER BY started_at DESC 
          LIMIT 1
        `).first();

        // Get latest backup info
        const backupInfo = await c.env.DB.prepare(`
          SELECT 
            status,
            datetime(completed_at, 'localtime') as completed_at_formatted
          FROM backup_operations 
          ORDER BY started_at DESC 
          LIMIT 1
        `).first();

        // Build real system health data
        const services = {};
        for (const service of healthStatus.results || []) {
          let details = 'Unknown';
          let displayStatus = service.status;
          
          if (service.service_name === 'api_services') {
            details = `${service.response_time_ms}ms avg response`;
          } else if (service.service_name === 'database') {
            details = 'Connection stable';
          } else if (service.service_name === 'security_scan') {
            if (securityScan) {
              const hoursAgo = Math.floor((Date.now() - new Date(securityScan.started_at_formatted + ' UTC').getTime()) / (1000 * 60 * 60));
              details = securityScan.status === 'running' ? 'Scanning now' : `Last: ${hoursAgo} hours ago`;
              displayStatus = securityScan.status === 'running' ? 'scanning' : (securityScan.urgent_findings > 0 ? 'warning' : 'operational');
            }
          } else if (service.service_name === 'backups') {
            if (backupInfo) {
              const hoursAgo = Math.floor((Date.now() - new Date(backupInfo.completed_at_formatted + ' UTC').getTime()) / (1000 * 60 * 60));
              details = backupInfo.status === 'running' ? 'Running now' : `Last: ${hoursAgo} hours ago`;
              displayStatus = backupInfo.status;
            }
          }
          
          services[service.service_name] = {
            name: service.display_name,
            status: displayStatus,
            uptime: service.uptime_percentage ? `${service.uptime_percentage}%` : 'N/A',
            details: details
          };
        }

        stats.systemHealth = {
          overall_status: 'operational',
          services: services
        };

        // Determine overall security status based on critical risks and findings
        const criticalRisks = stats.risks.critical || 0;
        const urgentFindings = securityScan ? securityScan.urgent_findings : 0;
        stats.securityStatus = (criticalRisks > 0 || urgentFindings > 0) ? 'warning' : 'operational';
        
      } catch (healthError) {
        console.error('Error fetching system health:', healthError);
        // Use default system health data if error
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
          SUM(CASE WHEN (probability * impact) >= 20 THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN (probability * impact) >= 12 AND (probability * impact) < 20 THEN 1 ELSE 0 END) as high,
          SUM(CASE WHEN (probability * impact) >= 6 AND (probability * impact) < 12 THEN 1 ELSE 0 END) as medium,
          SUM(CASE WHEN (probability * impact) < 6 THEN 1 ELSE 0 END) as low
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

  // System health refresh endpoint
  app.get('/system-health', async (c) => {
    try {
      // Get real system health data
      const healthStatus = await c.env.DB.prepare(`
        SELECT 
          service_name,
          display_name,
          status,
          uptime_percentage,
          response_time_ms,
          datetime(last_check, 'localtime') as last_check_formatted
        FROM system_health_status 
        ORDER BY service_name
      `).all();

      // Get latest security scan
      const securityScan = await c.env.DB.prepare(`
        SELECT 
          status,
          findings_count,
          critical_count + high_count as urgent_findings,
          datetime(started_at, 'localtime') as started_at_formatted
        FROM security_scan_results 
        ORDER BY started_at DESC 
        LIMIT 1
      `).first();

      // Get latest backup info
      const backupInfo = await c.env.DB.prepare(`
        SELECT 
          status,
          datetime(completed_at, 'localtime') as completed_at_formatted
        FROM backup_operations 
        ORDER BY started_at DESC 
        LIMIT 1
      `).first();

      // Build real system health data
      const services = {};
      for (const service of healthStatus.results || []) {
        let details = 'Unknown';
        let displayStatus = service.status;
        
        if (service.service_name === 'api_services') {
          details = `${service.response_time_ms}ms avg response`;
        } else if (service.service_name === 'database') {
          details = 'Connection stable';
        } else if (service.service_name === 'security_scan') {
          if (securityScan) {
            const hoursAgo = Math.floor((Date.now() - new Date(securityScan.started_at_formatted + ' UTC').getTime()) / (1000 * 60 * 60));
            details = securityScan.status === 'running' ? 'Scanning now' : `Last: ${hoursAgo} hours ago`;
            displayStatus = securityScan.status === 'running' ? 'scanning' : (securityScan.urgent_findings > 0 ? 'warning' : 'operational');
          }
        } else if (service.service_name === 'backups') {
          if (backupInfo) {
            const hoursAgo = Math.floor((Date.now() - new Date(backupInfo.completed_at_formatted + ' UTC').getTime()) / (1000 * 60 * 60));
            details = backupInfo.status === 'running' ? 'Running now' : `Last: ${hoursAgo} hours ago`;
            displayStatus = backupInfo.status;
          }
        }
        
        services[service.service_name] = {
          name: service.display_name,
          status: displayStatus,
          uptime: service.uptime_percentage ? `${service.uptime_percentage}%` : 'N/A',
          details: details
        };
      }

      const systemHealth = {
        overall_status: 'operational',
        services: services
      };

      return c.html(renderSystemHealthServices(systemHealth.services));
    } catch (error) {
      console.error('Error fetching system health:', error);
      return c.html('<div class="text-red-600 p-4">Failed to load system health</div>', 500);
    }
  });
  
  return app;
}

// Clean dashboard rendering
const renderCleanDashboard = (stats: any, user: any) => html`
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <!-- Hero Section -->
    <div class="bg-gradient-to-r from-blue-600 to-purple-600 shadow-xl">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div class="flex items-center justify-between">
          <div class="text-white">
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">
              Welcome back, ${user.firstName || user.username}! 👋
            </h1>
            <p class="text-blue-100 text-sm sm:text-base lg:text-lg">
              Your security intelligence command center
            </p>
            <p class="text-blue-100 text-xs sm:text-sm mt-1 lg:hidden">
              ${new Date().toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </p>
            <p class="hidden lg:block text-blue-100 text-base">
              ${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <div class="flex flex-col sm:flex-row sm:items-center mt-3 sm:mt-4 space-y-2 sm:space-y-0 sm:space-x-6 text-xs sm:text-sm">
              <div class="flex items-center">
                <i class="fas fa-shield-check mr-2"></i>
                <span>Security Status: ${stats.securityStatus === 'operational' ? 'Active' : stats.securityStatus === 'warning' ? 'Alert' : 'Unknown'}</span>
              </div>
              <div class="flex items-center">
                <i class="fas fa-clock mr-2"></i>
                <span class="hidden sm:inline">Last Updated: </span>
                <span class="sm:hidden">Updated: </span>
                <span>${new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          <div class="hidden lg:block">
            <div class="w-24 h-24 xl:w-32 xl:h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <i class="fas fa-shield-halved text-4xl xl:text-6xl text-white"></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Security Alert Banner -->
      <div class="mb-6">
        <div class="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl p-4 shadow-lg">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div class="flex items-center">
              <i class="fas fa-exclamation-triangle text-xl sm:text-2xl mr-3 flex-shrink-0"></i>
              <div>
                <h3 class="font-semibold text-sm sm:text-base">Security Alert</h3>
                <p class="text-xs sm:text-sm text-red-100">${stats.risks.critical} critical risks require immediate attention</p>
              </div>
            </div>
            <a href="/risk" class="bg-white text-red-600 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base font-medium hover:bg-red-50 transition-colors text-center">
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
      <div class="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 mb-6 sm:mb-8">
        <div class="flex items-center justify-between mb-4 sm:mb-6">
          <h2 class="text-lg sm:text-xl font-semibold text-gray-900">Quick Actions</h2>
          <i class="fas fa-bolt text-yellow-500"></i>
        </div>
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <a href="/risk/create" 
             hx-get="/risk/create" 
             hx-target="#modal-container"
             class="group flex flex-col items-center justify-center p-4 sm:px-6 sm:py-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg active:scale-95">
            <i class="fas fa-plus text-xl sm:text-2xl mb-2 group-hover:scale-110 transition-transform"></i>
            <span class="font-medium text-sm sm:text-base">New Risk</span>
            <span class="text-xs text-blue-100 mt-1 hidden sm:block">Register threat</span>
          </a>
          
          <a href="/compliance/assessments/new" 
             class="group flex flex-col items-center justify-center p-4 sm:px-6 sm:py-6 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg active:scale-95">
            <i class="fas fa-clipboard-check text-xl sm:text-2xl mb-2 group-hover:scale-110 transition-transform"></i>
            <span class="font-medium text-sm sm:text-base">Assessment</span>
            <span class="text-xs text-green-100 mt-1 hidden sm:block">New evaluation</span>
          </a>
          
          <a href="/risk/incidents/new" 
             class="group flex flex-col items-center justify-center p-4 sm:px-6 sm:py-6 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg active:scale-95">
            <i class="fas fa-exclamation-triangle text-xl sm:text-2xl mb-2 group-hover:scale-110 transition-transform"></i>
            <span class="font-medium text-sm sm:text-base">Report Issue</span>
            <span class="text-xs text-orange-100 mt-1 hidden sm:block">Log incident</span>
          </a>
          
          <a href="/reports" 
             class="group flex flex-col items-center justify-center p-4 sm:px-6 sm:py-6 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-lg active:scale-95">
            <i class="fas fa-chart-bar text-xl sm:text-2xl mb-2 group-hover:scale-110 transition-transform"></i>
            <span class="font-medium text-sm sm:text-base">Analytics</span>
            <span class="text-xs text-purple-100 mt-1 hidden sm:block">View reports</span>
          </a>
        </div>
      </div>
      
      <!-- System Status -->
      <div class="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200">
        <div class="flex items-center justify-between mb-4 sm:mb-6">
          <h2 class="text-lg sm:text-xl font-semibold text-gray-900">System Health</h2>
          <div class="flex items-center space-x-2">
            <div class="w-2 h-2 ${stats.systemHealth.overall_status === 'operational' ? 'bg-green-500' : stats.systemHealth.overall_status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'} rounded-full animate-pulse"></div>
            <span class="text-xs sm:text-sm ${stats.systemHealth.overall_status === 'operational' ? 'text-green-600' : stats.systemHealth.overall_status === 'warning' ? 'text-yellow-600' : 'text-red-600'} font-medium capitalize">${stats.systemHealth.overall_status}</span>
          </div>
        </div>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" id="system-health-grid">
          ${renderSystemHealthServices(stats.systemHealth.services)}
        </div>
      </div>
      
      <!-- Auto-refresh script for system health -->
      <script>
        // Refresh system health every 30 seconds
        setInterval(() => {
          fetch('/dashboard/system-health')
            .then(response => response.text())
            .then(html => {
              document.getElementById('system-health-grid').innerHTML = html;
            })
            .catch(error => {
              console.error('Failed to refresh system health:', error);
            });
        }, 30000); // 30 seconds
      </script>
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

// Real-time system health services renderer
const renderSystemHealthServices = (services: any) => {
  const serviceOrder = ['api_services', 'database', 'security_scan', 'backups'];
  const icons = {
    'api_services': 'fas fa-server',
    'database': 'fas fa-database', 
    'security_scan': 'fas fa-shield-halved',
    'backups': 'fas fa-cloud-arrow-up'
  };
  
  return html`
    ${serviceOrder.map(serviceKey => {
      const service = services[serviceKey];
      if (!service) return '';
      
      // Determine color scheme based on status
      let colorClass, textColorClass, statusColor, statusText;
      
      switch (service.status) {
        case 'operational':
          colorClass = 'bg-green-50';
          textColorClass = 'text-green-600';
          statusColor = 'text-green-600';
          statusText = service.uptime || 'Active';
          break;
        case 'scanning':
        case 'running':
          colorClass = 'bg-yellow-50';
          textColorClass = 'text-yellow-600';
          statusColor = 'text-yellow-600';
          statusText = 'Running';
          break;
        case 'warning':
          colorClass = 'bg-orange-50';
          textColorClass = 'text-orange-600';
          statusColor = 'text-orange-600';
          statusText = 'Warning';
          break;
        case 'error':
        case 'failed':
          colorClass = 'bg-red-50';
          textColorClass = 'text-red-600';
          statusColor = 'text-red-600';
          statusText = 'Error';
          break;
        default:
          colorClass = 'bg-gray-50';
          textColorClass = 'text-gray-600';
          statusColor = 'text-gray-600';
          statusText = 'Unknown';
      }
      
      return html`
        <div class="flex items-center justify-between p-3 ${colorClass} rounded-lg">
          <div class="flex items-center space-x-2 sm:space-x-3">
            <i class="${icons[serviceKey]} ${textColorClass} text-sm sm:text-base"></i>
            <div class="min-w-0 flex-1">
              <p class="text-xs sm:text-sm font-medium text-gray-900 truncate">${service.name}</p>
              <p class="text-xs text-gray-500 truncate">${service.details}</p>
            </div>
          </div>
          <span class="${statusColor} text-xs sm:text-sm font-medium ml-2">${statusText}</span>
        </div>
      `;
    })}
  `;
};