import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { ThreatIntelligenceService } from '../services/threat-intelligence';
import { RBACService } from '../services/rbac-service';
import { baseLayout } from '../templates/layout';

const threatIntelRoutes = new Hono();

// Apply authentication middleware to all routes
threatIntelRoutes.use('*', requireAuth);

// Initialize services
const threatIntelService = new ThreatIntelligenceService();
const rbacService = new RBACService();

// Main Threat Intelligence Dashboard
threatIntelRoutes.get('/', requirePermission('threat_intel:view'), async (c) => {
  const userEmail = getCookie(c, 'user_email') || '';
  const user = await rbacService.getUserByEmail(userEmail);

  const content = `
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="px-4 py-5 sm:px-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold leading-tight text-gray-900">
                <i class="fas fa-shield-alt mr-3 text-purple-600"></i>
                Threat Intelligence Center
              </h1>
              <p class="mt-2 max-w-4xl text-lg text-gray-500">
                Advanced threat correlation, IOC management, and threat hunting operations
              </p>
            </div>
            <div class="flex space-x-3">
              <button onclick="refreshThreatData()" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                <i class="fas fa-sync-alt mr-2"></i>
                Refresh Intelligence
              </button>
            </div>
          </div>
        </div>

        <!-- Threat Intelligence Overview Cards -->
        <div class="px-4 py-5 sm:px-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-eye text-red-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Active IOCs</dt>
                      <dd class="text-lg font-medium text-gray-900" id="active-iocs-count">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-network-wired text-blue-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Correlations Found</dt>
                      <dd class="text-lg font-medium text-gray-900" id="correlations-count">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-search text-green-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Hunt Queries</dt>
                      <dd class="text-lg font-medium text-gray-900" id="hunt-queries-count">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-exclamation-triangle text-yellow-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Threat Level</dt>
                      <dd class="text-lg font-medium text-gray-900" id="threat-level">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-white shadow rounded-lg mb-8">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Threat Intelligence Operations</h3>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button onclick="window.location.href='/threat-intel/iocs'" class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                  <i class="fas fa-eye mr-2 text-red-500"></i>
                  IOC Management
                </button>
                <button onclick="window.location.href='/threat-intel/correlations'" class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                  <i class="fas fa-network-wired mr-2 text-blue-500"></i>
                  Correlations
                </button>
                <button onclick="window.location.href='/threat-intel/hunting'" class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                  <i class="fas fa-search mr-2 text-green-500"></i>
                  Threat Hunting
                </button>
                <button onclick="window.location.href='/threat-intel/feeds'" class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                  <i class="fas fa-rss mr-2 text-orange-500"></i>
                  Intel Feeds
                </button>
              </div>
            </div>
          </div>

          <!-- Real-time Threat Analysis -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <!-- Threat Level Timeline -->
            <div class="bg-white shadow rounded-lg">
              <div class="px-4 py-5 sm:p-6">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Threat Level Timeline</h3>
                <div class="h-64">
                  <canvas id="threatLevelChart" width="400" height="200"></canvas>
                </div>
              </div>
            </div>

            <!-- IOC Distribution -->
            <div class="bg-white shadow rounded-lg">
              <div class="px-4 py-5 sm:p-6">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">IOC Distribution by Type</h3>
                <div class="h-64">
                  <canvas id="iocDistributionChart" width="400" height="200"></canvas>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Threat Activity -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Threat Activity</h3>
              <div id="recent-threat-activity" class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threat</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detection Time</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody id="threat-activity-table-body" class="bg-white divide-y divide-gray-200">
                    <tr>
                      <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">Loading threat activity...</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
      // Initialize charts and load data
      document.addEventListener('DOMContentLoaded', function() {
        loadThreatIntelligenceData();
        initializeThreatCharts();
      });

      async function loadThreatIntelligenceData() {
        try {
          // Load overview statistics
          const overviewResponse = await fetch('/api/threat-intelligence/overview');
          const overview = await overviewResponse.json();
          
          document.getElementById('active-iocs-count').textContent = overview.activeIOCs || '0';
          document.getElementById('correlations-count').textContent = overview.correlationsFound || '0';
          document.getElementById('hunt-queries-count').textContent = overview.huntQueries || '0';
          document.getElementById('threat-level').textContent = overview.threatLevel || 'Low';

          // Load recent threat activity
          const activityResponse = await fetch('/api/threat-intelligence/activity/recent');
          const activity = await activityResponse.json();
          
          displayRecentThreatActivity(activity);
        } catch (error) {
          console.error('Error loading threat intelligence data:', error);
        }
      }

      function displayRecentThreatActivity(activity) {
        const tbody = document.getElementById('threat-activity-table-body');
        tbody.innerHTML = '';
        
        if (activity.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">No recent threat activity detected</td></tr>';
          return;
        }

        activity.forEach(threat => {
          const row = document.createElement('tr');
          row.innerHTML = \`
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="text-sm font-medium text-gray-900">\${threat.name || 'Unknown Threat'}</div>
              <div class="text-sm text-gray-500">\${threat.description || 'No description'}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${getThreatTypeClass(threat.type)}">
                \${threat.type || 'Unknown'}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${getSeverityClass(threat.severity)}">
                \${threat.severity || 'Unknown'}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${(threat.confidence || 0).toFixed(1)}%</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${new Date(threat.detected_at || Date.now()).toLocaleString()}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button onclick="viewThreatDetails('\${threat.id}')" class="text-purple-600 hover:text-purple-900 mr-3">View</button>
              <button onclick="investigateThreat('\${threat.id}')" class="text-blue-600 hover:text-blue-900">Investigate</button>
            </td>
          \`;
          tbody.appendChild(row);
        });
      }

      function getThreatTypeClass(type) {
        switch (type?.toLowerCase()) {
          case 'malware': return 'bg-red-100 text-red-800';
          case 'phishing': return 'bg-orange-100 text-orange-800';
          case 'c2': return 'bg-purple-100 text-purple-800';
          case 'exploit': return 'bg-yellow-100 text-yellow-800';
          default: return 'bg-gray-100 text-gray-800';
        }
      }

      function getSeverityClass(severity) {
        switch (severity?.toLowerCase()) {
          case 'critical': return 'bg-red-100 text-red-800';
          case 'high': return 'bg-orange-100 text-orange-800';
          case 'medium': return 'bg-yellow-100 text-yellow-800';
          case 'low': return 'bg-blue-100 text-blue-800';
          default: return 'bg-gray-100 text-gray-800';
        }
      }

      function initializeThreatCharts() {
        // Threat Level Chart
        const threatCtx = document.getElementById('threatLevelChart').getContext('2d');
        new Chart(threatCtx, {
          type: 'line',
          data: {
            labels: ['6h ago', '5h ago', '4h ago', '3h ago', '2h ago', '1h ago', 'Now'],
            datasets: [{
              label: 'Threat Level',
              data: [2, 3, 2, 4, 3, 3, 2],
              borderColor: 'rgb(147, 51, 234)',
              backgroundColor: 'rgba(147, 51, 234, 0.1)',
              tension: 0.4,
              fill: true
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 5,
                ticks: {
                  callback: function(value) {
                    const levels = ['', 'Low', 'Medium', 'High', 'Critical', 'Extreme'];
                    return levels[value] || value;
                  }
                }
              }
            }
          }
        });

        // IOC Distribution Chart
        const iocCtx = document.getElementById('iocDistributionChart').getContext('2d');
        new Chart(iocCtx, {
          type: 'doughnut',
          data: {
            labels: ['IP Addresses', 'Domains', 'File Hashes', 'URLs', 'Email Addresses'],
            datasets: [{
              data: [35, 25, 20, 15, 5],
              backgroundColor: [
                '#EF4444', // Red
                '#F97316', // Orange  
                '#EAB308', // Yellow
                '#22C55E', // Green
                '#3B82F6'  // Blue
              ],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      }

      function refreshThreatData() {
        loadThreatIntelligenceData();
      }

      function viewThreatDetails(threatId) {
        window.location.href = \`/threat-intel/threats/\${threatId}\`;
      }

      function investigateThreat(threatId) {
        window.location.href = \`/threat-intel/investigate/\${threatId}\`;
      }
    </script>
  `;

  return c.html(baseLayout('Threat Intelligence Center', content, user));
});

// IOC Management Page
threatIntelRoutes.get('/iocs', requirePermission('threat_intel:view'), async (c) => {
  const userEmail = getCookie(c, 'user_email') || '';
  const user = await rbacService.getUserByEmail(userEmail);

  const content = `
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="px-4 py-5 sm:px-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold leading-tight text-gray-900">
                <i class="fas fa-eye mr-3 text-red-600"></i>
                Indicators of Compromise (IOCs)
              </h1>
              <p class="mt-2 max-w-4xl text-lg text-gray-500">
                Comprehensive IOC management and correlation analysis
              </p>
            </div>
            <div class="flex space-x-3">
              <button onclick="showAddIOCForm()" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">
                <i class="fas fa-plus mr-2"></i>
                Add IOC
              </button>
              <button onclick="importIOCs()" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <i class="fas fa-upload mr-2"></i>
                Import IOCs
              </button>
            </div>
          </div>
        </div>

        <!-- IOC Filters -->
        <div class="px-4 py-5 sm:px-6">
          <div class="bg-white shadow rounded-lg mb-8">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Filter IOCs</h3>
              <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">IOC Type</label>
                  <select id="iocTypeFilter" onchange="filterIOCs()" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500">
                    <option value="">All Types</option>
                    <option value="ip">IP Address</option>
                    <option value="domain">Domain</option>
                    <option value="hash">File Hash</option>
                    <option value="url">URL</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Threat Type</label>
                  <select id="threatTypeFilter" onchange="filterIOCs()" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500">
                    <option value="">All Threat Types</option>
                    <option value="malware">Malware</option>
                    <option value="phishing">Phishing</option>
                    <option value="c2">C2 Infrastructure</option>
                    <option value="exploit">Exploit</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Confidence</label>
                  <select id="confidenceFilter" onchange="filterIOCs()" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500">
                    <option value="">All Confidence</option>
                    <option value="high">High (80-100%)</option>
                    <option value="medium">Medium (50-79%)</option>
                    <option value="low">Low (0-49%)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Status</label>
                  <select id="statusFilter" onchange="filterIOCs()" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="investigating">Investigating</option>
                    <option value="false_positive">False Positive</option>
                  </select>
                </div>
                <div class="flex items-end">
                  <button onclick="clearFilters()" class="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <i class="fas fa-times mr-2"></i>
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- IOC Statistics -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-eye text-red-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Total IOCs</dt>
                      <dd class="text-lg font-medium text-gray-900" id="total-iocs">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-check-circle text-green-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Active IOCs</dt>
                      <dd class="text-lg font-medium text-gray-900" id="active-iocs">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-search text-blue-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Under Investigation</dt>
                      <dd class="text-lg font-medium text-gray-900" id="investigating-iocs">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-exclamation-triangle text-yellow-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">False Positives</dt>
                      <dd class="text-lg font-medium text-gray-900" id="false-positive-iocs">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- IOCs List -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Indicators of Compromise</h3>
              <div id="iocs-list" class="overflow-x-auto">
                <div class="text-center py-8">
                  <i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
                  <p class="mt-4 text-lg text-gray-500">Loading IOCs...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Add IOC Modal -->
      <div id="addIOCModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Add New IOC</h3>
            <form id="addIOCForm" onsubmit="submitIOC(event)">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">IOC Type</label>
                  <select name="type" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500">
                    <option value="">Select Type</option>
                    <option value="ip">IP Address</option>
                    <option value="domain">Domain</option>
                    <option value="hash">File Hash</option>
                    <option value="url">URL</option>
                    <option value="email">Email Address</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">IOC Value</label>
                  <input type="text" name="value" required placeholder="Enter IOC value..." class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Threat Type</label>
                  <select name="threat_type" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500">
                    <option value="">Select Threat Type</option>
                    <option value="malware">Malware</option>
                    <option value="phishing">Phishing</option>
                    <option value="c2">C2 Infrastructure</option>
                    <option value="exploit">Exploit</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Confidence (%)</label>
                  <input type="number" name="confidence" min="0" max="100" value="75" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Source</label>
                  <input type="text" name="source" placeholder="e.g., VirusTotal, AlienVault..." class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Tags</label>
                  <input type="text" name="tags" placeholder="Comma-separated tags..." class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500">
                </div>
              </div>
              <div class="mt-6 flex justify-end space-x-3">
                <button type="button" onclick="hideAddIOCForm()" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">
                  Add IOC
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <script>
      let allIOCs = [];
      
      document.addEventListener('DOMContentLoaded', function() {
        loadIOCs();
      });

      async function loadIOCs() {
        try {
          const response = await fetch('/api/threat-intelligence/iocs');
          const data = await response.json();
          
          updateIOCStatistics(data.statistics);
          displayIOCs(data.iocs);
          allIOCs = data.iocs;
        } catch (error) {
          console.error('Error loading IOCs:', error);
          document.getElementById('iocs-list').innerHTML = \`
            <div class="text-center py-8">
              <i class="fas fa-exclamation-triangle text-4xl text-red-400"></i>
              <p class="mt-4 text-lg text-red-500">Error loading IOCs</p>
            </div>
          \`;
        }
      }

      function updateIOCStatistics(stats) {
        document.getElementById('total-iocs').textContent = stats.total || '0';
        document.getElementById('active-iocs').textContent = stats.active || '0';
        document.getElementById('investigating-iocs').textContent = stats.investigating || '0';
        document.getElementById('false-positive-iocs').textContent = stats.falsePositives || '0';
      }

      function displayIOCs(iocs) {
        const container = document.getElementById('iocs-list');
        
        if (iocs.length === 0) {
          container.innerHTML = \`
            <div class="text-center py-8">
              <i class="fas fa-eye text-4xl text-gray-400"></i>
              <p class="mt-4 text-lg text-gray-500">No IOCs available</p>
              <button onclick="showAddIOCForm()" class="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">
                <i class="fas fa-plus mr-2"></i>
                Add First IOC
              </button>
            </div>
          \`;
          return;
        }

        const html = \`
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IOC Value</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threat Type</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              \${iocs.map(ioc => \`
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-mono text-gray-900">\${ioc.value || 'Unknown'}</div>
                    \${ioc.tags ? \`<div class="text-xs text-gray-500">\${ioc.tags.split(',').map(tag => \`<span class="inline-block bg-gray-100 px-2 py-1 rounded mr-1">\${tag.trim()}</span>\`).join('')}</div>\` : ''}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${getIOCTypeClass(ioc.type)}">
                      \${ioc.type || 'unknown'}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${getThreatTypeClass(ioc.threat_type)}">
                      \${ioc.threat_type || 'unknown'}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${(ioc.confidence || 0).toFixed(0)}%</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${getStatusClass(ioc.status)}">
                      \${ioc.status || 'active'}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${ioc.source || 'Manual'}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onclick="viewIOCDetails('\${ioc.id}')" class="text-red-600 hover:text-red-900">View</button>
                    <button onclick="correlateIOC('\${ioc.id}')" class="text-blue-600 hover:text-blue-900">Correlate</button>
                    <button onclick="updateIOCStatus('\${ioc.id}')" class="text-green-600 hover:text-green-900">Update</button>
                  </td>
                </tr>
              \`).join('')}
            </tbody>
          </table>
        \`;
        
        container.innerHTML = html;
      }

      function getIOCTypeClass(type) {
        switch (type?.toLowerCase()) {
          case 'ip': return 'bg-red-100 text-red-800';
          case 'domain': return 'bg-blue-100 text-blue-800';
          case 'hash': return 'bg-green-100 text-green-800';
          case 'url': return 'bg-yellow-100 text-yellow-800';
          case 'email': return 'bg-purple-100 text-purple-800';
          default: return 'bg-gray-100 text-gray-800';
        }
      }

      function getThreatTypeClass(type) {
        switch (type?.toLowerCase()) {
          case 'malware': return 'bg-red-100 text-red-800';
          case 'phishing': return 'bg-orange-100 text-orange-800';
          case 'c2': return 'bg-purple-100 text-purple-800';
          case 'exploit': return 'bg-yellow-100 text-yellow-800';
          default: return 'bg-gray-100 text-gray-800';
        }
      }

      function getStatusClass(status) {
        switch (status?.toLowerCase()) {
          case 'active': return 'bg-green-100 text-green-800';
          case 'investigating': return 'bg-yellow-100 text-yellow-800';
          case 'false_positive': return 'bg-red-100 text-red-800';
          default: return 'bg-gray-100 text-gray-800';
        }
      }

      function filterIOCs() {
        const typeFilter = document.getElementById('iocTypeFilter').value;
        const threatTypeFilter = document.getElementById('threatTypeFilter').value;
        const confidenceFilter = document.getElementById('confidenceFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        
        let filtered = allIOCs;
        
        if (typeFilter) {
          filtered = filtered.filter(ioc => ioc.type?.toLowerCase() === typeFilter);
        }
        
        if (threatTypeFilter) {
          filtered = filtered.filter(ioc => ioc.threat_type?.toLowerCase() === threatTypeFilter);
        }
        
        if (confidenceFilter) {
          switch (confidenceFilter) {
            case 'high':
              filtered = filtered.filter(ioc => ioc.confidence >= 80);
              break;
            case 'medium':
              filtered = filtered.filter(ioc => ioc.confidence >= 50 && ioc.confidence < 80);
              break;
            case 'low':
              filtered = filtered.filter(ioc => ioc.confidence < 50);
              break;
          }
        }
        
        if (statusFilter) {
          filtered = filtered.filter(ioc => ioc.status?.toLowerCase() === statusFilter);
        }
        
        displayIOCs(filtered);
      }

      function clearFilters() {
        document.getElementById('iocTypeFilter').value = '';
        document.getElementById('threatTypeFilter').value = '';
        document.getElementById('confidenceFilter').value = '';
        document.getElementById('statusFilter').value = '';
        displayIOCs(allIOCs);
      }

      function showAddIOCForm() {
        document.getElementById('addIOCModal').classList.remove('hidden');
      }

      function hideAddIOCForm() {
        document.getElementById('addIOCModal').classList.add('hidden');
        document.getElementById('addIOCForm').reset();
      }

      async function submitIOC(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const data = {
          type: formData.get('type'),
          value: formData.get('value'),
          threat_type: formData.get('threat_type'),
          confidence: parseFloat(formData.get('confidence')),
          source: formData.get('source'),
          tags: formData.get('tags')
        };

        try {
          const response = await fetch('/api/threat-intelligence/iocs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          if (response.ok) {
            hideAddIOCForm();
            await loadIOCs();
            showNotification('IOC added successfully!', 'success');
          } else {
            throw new Error('Failed to add IOC');
          }
        } catch (error) {
          console.error('Error adding IOC:', error);
          showNotification('Error adding IOC', 'error');
        }
      }

      function viewIOCDetails(iocId) {
        window.location.href = \`/threat-intel/iocs/\${iocId}\`;
      }

      function correlateIOC(iocId) {
        window.location.href = \`/threat-intel/correlations?ioc=\${iocId}\`;
      }

      async function updateIOCStatus(iocId) {
        // Simple status update - in real implementation, this would show a modal
        try {
          const response = await fetch(\`/api/threat-intelligence/iocs/\${iocId}/status\`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'investigating' })
          });

          if (response.ok) {
            await loadIOCs();
            showNotification('IOC status updated', 'success');
          }
        } catch (error) {
          console.error('Error updating IOC status:', error);
          showNotification('Error updating IOC status', 'error');
        }
      }

      function importIOCs() {
        // Placeholder for IOC import functionality
        showNotification('IOC import feature coming soon', 'info');
      }

      function showNotification(message, type) {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
        notification.className = \`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg \${bgColor} text-white\`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.remove();
        }, 3000);
      }
    </script>
  `;

  return c.html(baseLayout('IOC Management - Threat Intelligence', content, user));
});

// Threat Hunting Page
threatIntelRoutes.get('/hunting', requirePermission('threat_intel:view'), async (c) => {
  const userEmail = getCookie(c, 'user_email') || '';
  const user = await rbacService.getUserByEmail(userEmail);

  const content = `
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="px-4 py-5 sm:px-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold leading-tight text-gray-900">
                <i class="fas fa-search mr-3 text-green-600"></i>
                Threat Hunting
              </h1>
              <p class="mt-2 max-w-4xl text-lg text-gray-500">
                Proactive threat detection through advanced hunting queries and analysis
              </p>
            </div>
            <div class="flex space-x-3">
              <button onclick="showNewHuntForm()" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                <i class="fas fa-plus mr-2"></i>
                New Hunt
              </button>
              <button onclick="showSavedQueries()" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <i class="fas fa-save mr-2"></i>
                Saved Queries
              </button>
            </div>
          </div>
        </div>

        <!-- Quick Hunt Templates -->
        <div class="px-4 py-5 sm:px-6">
          <div class="bg-white shadow rounded-lg mb-8">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Hunt Templates</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onclick="loadHuntTemplate('suspicious_network')" class="text-left p-4 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  <div class="flex items-center">
                    <i class="fas fa-network-wired text-blue-500 text-xl mr-3"></i>
                    <div>
                      <h4 class="text-sm font-medium text-gray-900">Suspicious Network Activity</h4>
                      <p class="text-xs text-gray-500">Hunt for unusual network connections and data flows</p>
                    </div>
                  </div>
                </button>
                
                <button onclick="loadHuntTemplate('malware_execution')" class="text-left p-4 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  <div class="flex items-center">
                    <i class="fas fa-bug text-red-500 text-xl mr-3"></i>
                    <div>
                      <h4 class="text-sm font-medium text-gray-900">Malware Execution</h4>
                      <p class="text-xs text-gray-500">Detect potential malware execution patterns</p>
                    </div>
                  </div>
                </button>
                
                <button onclick="loadHuntTemplate('privilege_escalation')" class="text-left p-4 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                  <div class="flex items-center">
                    <i class="fas fa-user-shield text-yellow-500 text-xl mr-3"></i>
                    <div>
                      <h4 class="text-sm font-medium text-gray-900">Privilege Escalation</h4>
                      <p class="text-xs text-gray-500">Hunt for unauthorized privilege elevation attempts</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- Hunt Query Builder -->
          <div class="bg-white shadow rounded-lg mb-8">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Hunt Query Builder</h3>
              <form id="huntQueryForm" onsubmit="executeHunt(event)">
                <div class="space-y-6">
                  <!-- Query Name and Description -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Hunt Name</label>
                      <input type="text" id="huntName" name="name" placeholder="Enter hunt name..." class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Time Range</label>
                      <select id="timeRange" name="timeRange" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500">
                        <option value="1h">Last 1 Hour</option>
                        <option value="24h" selected>Last 24 Hours</option>
                        <option value="7d">Last 7 Days</option>
                        <option value="30d">Last 30 Days</option>
                      </select>
                    </div>
                  </div>

                  <!-- Query Builder -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Hunt Query</label>
                    <textarea id="huntQuery" name="query" rows="8" placeholder="Enter your threat hunting query here...

Examples:
- Find processes with unusual network connections
- Detect file execution from temp directories
- Identify suspicious registry modifications
- Hunt for privilege escalation attempts

Use KQL-like syntax for advanced queries." class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 font-mono text-sm"></textarea>
                  </div>

                  <!-- Query Options -->
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Data Sources</label>
                      <div class="mt-2 space-y-2">
                        <label class="inline-flex items-center">
                          <input type="checkbox" name="sources" value="endpoint_logs" checked class="form-checkbox h-4 w-4 text-green-600">
                          <span class="ml-2 text-sm text-gray-700">Endpoint Logs</span>
                        </label>
                        <label class="inline-flex items-center">
                          <input type="checkbox" name="sources" value="network_logs" class="form-checkbox h-4 w-4 text-green-600">
                          <span class="ml-2 text-sm text-gray-700">Network Logs</span>
                        </label>
                        <label class="inline-flex items-center">
                          <input type="checkbox" name="sources" value="security_events" checked class="form-checkbox h-4 w-4 text-green-600">
                          <span class="ml-2 text-sm text-gray-700">Security Events</span>
                        </label>
                      </div>
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-gray-700">Result Limit</label>
                      <select name="limit" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500">
                        <option value="100">100 results</option>
                        <option value="500" selected>500 results</option>
                        <option value="1000">1000 results</option>
                        <option value="5000">5000 results</option>
                      </select>
                    </div>
                    
                    <div class="flex items-end">
                      <label class="inline-flex items-center">
                        <input type="checkbox" name="save_query" class="form-checkbox h-4 w-4 text-green-600">
                        <span class="ml-2 text-sm text-gray-700">Save this query</span>
                      </label>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="flex justify-between">
                    <div class="flex space-x-3">
                      <button type="button" onclick="validateQuery()" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        <i class="fas fa-check-circle mr-2"></i>
                        Validate Query
                      </button>
                      <button type="button" onclick="previewQuery()" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        <i class="fas fa-eye mr-2"></i>
                        Preview Results
                      </button>
                    </div>
                    <button type="submit" class="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                      <i class="fas fa-play mr-2"></i>
                      Execute Hunt
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <!-- Hunt Results -->
          <div id="huntResults" class="hidden bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg leading-6 font-medium text-gray-900">Hunt Results</h3>
                <div class="flex space-x-2">
                  <button onclick="exportResults()" class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <i class="fas fa-download mr-2"></i>
                    Export
                  </button>
                  <button onclick="createIOCsFromResults()" class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <i class="fas fa-eye mr-2"></i>
                    Create IOCs
                  </button>
                </div>
              </div>
              <div id="huntResultsContent">
                <!-- Results will be populated here -->
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- New Hunt Modal -->
      <div id="newHuntModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Create New Hunt</h3>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onclick="selectHuntType('advanced_persistent_threat')" class="p-4 border-2 border-gray-300 rounded-lg hover:border-green-500 focus:outline-none focus:border-green-500">
                <i class="fas fa-user-secret text-purple-500 text-2xl mb-2"></i>
                <h4 class="font-medium text-gray-900">APT Detection</h4>
                <p class="text-sm text-gray-500">Hunt for advanced persistent threats</p>
              </button>
              
              <button onclick="selectHuntType('insider_threat')" class="p-4 border-2 border-gray-300 rounded-lg hover:border-green-500 focus:outline-none focus:border-green-500">
                <i class="fas fa-user-times text-red-500 text-2xl mb-2"></i>
                <h4 class="font-medium text-gray-900">Insider Threat</h4>
                <p class="text-sm text-gray-500">Detect malicious insider activity</p>
              </button>
              
              <button onclick="selectHuntType('lateral_movement')" class="p-4 border-2 border-gray-300 rounded-lg hover:border-green-500 focus:outline-none focus:border-green-500">
                <i class="fas fa-arrows-alt text-blue-500 text-2xl mb-2"></i>
                <h4 class="font-medium text-gray-900">Lateral Movement</h4>
                <p class="text-sm text-gray-500">Hunt for lateral movement patterns</p>
              </button>
              
              <button onclick="selectHuntType('data_exfiltration')" class="p-4 border-2 border-gray-300 rounded-lg hover:border-green-500 focus:outline-none focus:border-green-500">
                <i class="fas fa-download text-yellow-500 text-2xl mb-2"></i>
                <h4 class="font-medium text-gray-900">Data Exfiltration</h4>
                <p class="text-sm text-gray-500">Detect unauthorized data transfer</p>
              </button>
              
              <button onclick="selectHuntType('living_off_land')" class="p-4 border-2 border-gray-300 rounded-lg hover:border-green-500 focus:outline-none focus:border-green-500">
                <i class="fas fa-terminal text-green-500 text-2xl mb-2"></i>
                <h4 class="font-medium text-gray-900">Living off the Land</h4>
                <p class="text-sm text-gray-500">Hunt for legitimate tool abuse</p>
              </button>
              
              <button onclick="selectHuntType('custom')" class="p-4 border-2 border-gray-300 rounded-lg hover:border-green-500 focus:outline-none focus:border-green-500">
                <i class="fas fa-cogs text-gray-500 text-2xl mb-2"></i>
                <h4 class="font-medium text-gray-900">Custom Hunt</h4>
                <p class="text-sm text-gray-500">Build your own hunting query</p>
              </button>
            </div>
            <div class="mt-6 flex justify-end">
              <button onclick="hideNewHuntForm()" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <script>
      document.addEventListener('DOMContentLoaded', function() {
        // Initialize any needed data
      });

      function showNewHuntForm() {
        document.getElementById('newHuntModal').classList.remove('hidden');
      }

      function hideNewHuntForm() {
        document.getElementById('newHuntModal').classList.add('hidden');
      }

      function selectHuntType(type) {
        hideNewHuntForm();
        loadHuntTemplate(type);
      }

      function loadHuntTemplate(templateType) {
        const templates = {
          suspicious_network: {
            name: 'Suspicious Network Activity Hunt',
            query: \`// Hunt for suspicious network connections
SecurityEvent
| where EventID in (5156, 5157) // Network connection events
| where DestinationPort in (22, 23, 135, 139, 445, 3389, 5985, 5986) // Common attack ports
| where SourceAddress != DestinationAddress
| summarize count() by SourceAddress, DestinationAddress, DestinationPort
| where count_ > 10 // Multiple connections
| order by count_ desc\`
          },
          malware_execution: {
            name: 'Malware Execution Detection',
            query: \`// Hunt for potential malware execution
ProcessCreationEvents
| where ProcessName contains "temp" or ProcessName contains "appdata"
| where CommandLine contains_any ("powershell", "cmd", "wscript", "cscript")
| where CommandLine contains_any ("-enc", "-exec", "downloadstring", "invoke")
| project TimeGenerated, ComputerName, ProcessName, CommandLine, ParentProcessName
| order by TimeGenerated desc\`
          },
          privilege_escalation: {
            name: 'Privilege Escalation Hunt',
            query: \`// Hunt for privilege escalation attempts
SecurityEvent
| where EventID in (4672, 4624, 4625) // Privilege use and logon events
| where TargetUserName != "SYSTEM" and TargetUserName != "LOCAL SERVICE"
| summarize LogonCount=count() by TargetUserName, LogonType
| where LogonCount > 5 // Multiple privilege use events
| order by LogonCount desc\`
          },
          advanced_persistent_threat: {
            name: 'APT Behavior Detection',
            query: \`// Hunt for APT-like behavior
union 
  (ProcessCreationEvents | where ProcessName contains_any ("at.exe", "schtasks.exe", "wmic.exe")),
  (NetworkConnections | where DestinationPort in (80, 443, 53) | where isprivate(DestinationIP) == false),
  (FileCreationEvents | where FileName contains_any (".bat", ".vbs", ".ps1") | where FilePath contains "temp")
| summarize Activities=make_list(Activity) by ComputerName, bin(TimeGenerated, 1h)
| where array_length(Activities) >= 3 // Multiple suspicious activities
| order by TimeGenerated desc\`
          }
        };

        const template = templates[templateType];
        if (template) {
          document.getElementById('huntName').value = template.name;
          document.getElementById('huntQuery').value = template.query;
        }
      }

      async function validateQuery() {
        const query = document.getElementById('huntQuery').value;
        if (!query.trim()) {
          showNotification('Please enter a hunt query', 'error');
          return;
        }

        try {
          const response = await fetch('/api/threat-intelligence/hunting/validate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query })
          });

          const result = await response.json();
          if (result.valid) {
            showNotification('Query syntax is valid', 'success');
          } else {
            showNotification(\`Query validation error: \${result.error}\`, 'error');
          }
        } catch (error) {
          console.error('Error validating query:', error);
          showNotification('Error validating query', 'error');
        }
      }

      async function previewQuery() {
        const query = document.getElementById('huntQuery').value;
        if (!query.trim()) {
          showNotification('Please enter a hunt query', 'error');
          return;
        }

        try {
          const response = await fetch('/api/threat-intelligence/hunting/preview', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              query,
              limit: 10 // Preview limit
            })
          });

          const result = await response.json();
          displayHuntResults(result, true);
          document.getElementById('huntResults').classList.remove('hidden');
        } catch (error) {
          console.error('Error previewing query:', error);
          showNotification('Error previewing query results', 'error');
        }
      }

      async function executeHunt(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const sources = Array.from(formData.getAll('sources'));
        
        const huntData = {
          name: formData.get('name'),
          query: formData.get('query'),
          timeRange: formData.get('timeRange'),
          sources: sources,
          limit: parseInt(formData.get('limit')),
          saveQuery: formData.has('save_query')
        };

        if (!huntData.query.trim()) {
          showNotification('Please enter a hunt query', 'error');
          return;
        }

        try {
          // Show loading state
          const submitButton = event.target.querySelector('button[type="submit"]');
          const originalHTML = submitButton.innerHTML;
          submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Executing...';
          submitButton.disabled = true;

          const response = await fetch('/api/threat-intelligence/hunting/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(huntData)
          });

          const result = await response.json();
          
          if (response.ok) {
            displayHuntResults(result, false);
            document.getElementById('huntResults').classList.remove('hidden');
            showNotification(\`Hunt executed successfully. Found \${result.results?.length || 0} results.\`, 'success');
          } else {
            throw new Error(result.error || 'Hunt execution failed');
          }
        } catch (error) {
          console.error('Error executing hunt:', error);
          showNotification('Error executing hunt: ' + error.message, 'error');
        } finally {
          // Restore button state
          const submitButton = event.target.querySelector('button[type="submit"]');
          submitButton.innerHTML = '<i class="fas fa-play mr-2"></i>Execute Hunt';
          submitButton.disabled = false;
        }
      }

      function displayHuntResults(data, isPreview = false) {
        const container = document.getElementById('huntResultsContent');
        const results = data.results || [];
        
        if (results.length === 0) {
          container.innerHTML = \`
            <div class="text-center py-8">
              <i class="fas fa-search text-4xl text-gray-400"></i>
              <p class="mt-4 text-lg text-gray-500">No results found</p>
              <p class="text-sm text-gray-400">Try adjusting your query or time range</p>
            </div>
          \`;
          return;
        }

        const previewBanner = isPreview ? \`
          <div class="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <div class="flex">
              <i class="fas fa-info-circle text-blue-400 mt-0.5 mr-2"></i>
              <div>
                <h4 class="text-sm font-medium text-blue-800">Preview Mode</h4>
                <p class="text-sm text-blue-700">Showing first 10 results. Execute the hunt to see all results.</p>
              </div>
            </div>
          </div>
        \` : '';

        const html = \`
          \${previewBanner}
          <div class="mb-4">
            <p class="text-sm text-gray-600">
              Found <strong>\${results.length}</strong> results 
              \${data.executionTime ? \`in \${data.executionTime}ms\` : ''}
              \${isPreview ? '(preview)' : ''}
            </p>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  \${Object.keys(results[0] || {}).map(key => \`
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">\${key}</th>
                  \`).join('')}
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                \${results.map((result, index) => \`
                  <tr class="\${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}">
                    \${Object.entries(result).map(([key, value]) => \`
                      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div class="max-w-xs truncate" title="\${String(value)}">\${String(value)}</div>
                      </td>
                    \`).join('')}
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onclick="investigateResult(\${index})" class="text-green-600 hover:text-green-900 mr-2">Investigate</button>
                      <button onclick="createIOCFromResult(\${index})" class="text-red-600 hover:text-red-900">Create IOC</button>
                    </td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          </div>
        \`;
        
        container.innerHTML = html;
      }

      function investigateResult(index) {
        // In a real implementation, this would open a detailed investigation view
        showNotification('Investigation feature coming soon', 'info');
      }

      function createIOCFromResult(index) {
        // In a real implementation, this would extract IOCs from the result
        showNotification('IOC creation from results coming soon', 'info');
      }

      function exportResults() {
        showNotification('Export functionality coming soon', 'info');
      }

      function createIOCsFromResults() {
        showNotification('Bulk IOC creation coming soon', 'info');
      }

      function showSavedQueries() {
        window.location.href = '/threat-intel/hunting/saved';
      }

      function showNotification(message, type) {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
        notification.className = \`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg \${bgColor} text-white max-w-sm\`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.remove();
        }, 4000);
      }
    </script>
  `;

  return c.html(baseLayout('Threat Hunting - Threat Intelligence', content, user));
});

// Correlations Page
threatIntelRoutes.get('/correlations', requirePermission('threat_intel:view'), async (c) => {
  const userEmail = getCookie(c, 'user_email') || '';
  const user = await rbacService.getUserByEmail(userEmail);

  const content = `
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="px-4 py-5 sm:px-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold leading-tight text-gray-900">
                <i class="fas fa-network-wired mr-3 text-blue-600"></i>
                Threat Correlations
              </h1>
              <p class="mt-2 max-w-4xl text-lg text-gray-500">
                Advanced correlation analysis to identify related threats and attack patterns
              </p>
            </div>
            <div class="flex space-x-3">
              <button onclick="runCorrelationAnalysis()" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                <i class="fas fa-play mr-2"></i>
                Run Analysis
              </button>
            </div>
          </div>
        </div>

        <!-- Correlation Overview -->
        <div class="px-4 py-5 sm:px-6">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-link text-blue-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Total Correlations</dt>
                      <dd class="text-lg font-medium text-gray-900" id="total-correlations">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">High Risk Correlations</dt>
                      <dd class="text-lg font-medium text-gray-900" id="high-risk-correlations">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-clock text-green-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Last Analysis</dt>
                      <dd class="text-lg font-medium text-gray-900" id="last-analysis">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Correlation Network Visualization -->
          <div class="bg-white shadow rounded-lg mb-8">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Threat Correlation Network</h3>
              <div class="h-96 border border-gray-200 rounded-lg flex items-center justify-center">
                <div id="correlation-network" class="w-full h-full flex items-center justify-center">
                  <div class="text-center">
                    <i class="fas fa-project-diagram text-6xl text-gray-300"></i>
                    <p class="mt-4 text-lg text-gray-500">Correlation network will appear here</p>
                    <p class="text-sm text-gray-400">Run correlation analysis to visualize threat relationships</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Correlation Results -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg leading-6 font-medium text-gray-900">Correlation Results</h3>
                <div class="flex space-x-2">
                  <select id="correlationFilter" onchange="filterCorrelations()" class="border border-gray-300 rounded-md px-3 py-1 text-sm">
                    <option value="">All Correlations</option>
                    <option value="high">High Confidence</option>
                    <option value="medium">Medium Confidence</option>
                    <option value="low">Low Confidence</option>
                  </select>
                  <button onclick="exportCorrelations()" class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <i class="fas fa-download mr-2"></i>
                    Export
                  </button>
                </div>
              </div>
              <div id="correlations-list">
                <div class="text-center py-8">
                  <i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
                  <p class="mt-4 text-lg text-gray-500">Loading correlations...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <script>
      let allCorrelations = [];
      
      document.addEventListener('DOMContentLoaded', function() {
        loadCorrelations();
      });

      async function loadCorrelations() {
        try {
          const response = await fetch('/api/threat-intelligence/correlations');
          const data = await response.json();
          
          updateCorrelationStatistics(data.statistics);
          displayCorrelations(data.correlations);
          allCorrelations = data.correlations;
        } catch (error) {
          console.error('Error loading correlations:', error);
          document.getElementById('correlations-list').innerHTML = \`
            <div class="text-center py-8">
              <i class="fas fa-exclamation-triangle text-4xl text-red-400"></i>
              <p class="mt-4 text-lg text-red-500">Error loading correlations</p>
            </div>
          \`;
        }
      }

      function updateCorrelationStatistics(stats) {
        document.getElementById('total-correlations').textContent = stats.total || '0';
        document.getElementById('high-risk-correlations').textContent = stats.highRisk || '0';
        document.getElementById('last-analysis').textContent = stats.lastAnalysis || 'Never';
      }

      function displayCorrelations(correlations) {
        const container = document.getElementById('correlations-list');
        
        if (correlations.length === 0) {
          container.innerHTML = \`
            <div class="text-center py-8">
              <i class="fas fa-network-wired text-4xl text-gray-400"></i>
              <p class="mt-4 text-lg text-gray-500">No correlations found</p>
              <button onclick="runCorrelationAnalysis()" class="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                <i class="fas fa-play mr-2"></i>
                Run First Analysis
              </button>
            </div>
          \`;
          return;
        }

        const html = \`
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correlation</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entities</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detected</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                \${correlations.map(correlation => \`
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">\${correlation.title || 'Unnamed Correlation'}</div>
                      <div class="text-sm text-gray-500">\${correlation.description || 'No description'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm text-gray-900">\${(correlation.entities || []).length} entities</div>
                      <div class="text-xs text-gray-500">\${(correlation.entities || []).slice(0, 3).map(e => e.value).join(', ')}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${(correlation.confidence || 0).toFixed(1)}%</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${getRiskLevelClass(correlation.risk_level)}">
                        \${correlation.risk_level || 'unknown'}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${new Date(correlation.detected_at || Date.now()).toLocaleString()}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button onclick="viewCorrelationDetails('\${correlation.id}')" class="text-blue-600 hover:text-blue-900">View</button>
                      <button onclick="investigateCorrelation('\${correlation.id}')" class="text-green-600 hover:text-green-900">Investigate</button>
                      <button onclick="createIncident('\${correlation.id}')" class="text-red-600 hover:text-red-900">Create Incident</button>
                    </td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          </div>
        \`;
        
        container.innerHTML = html;
      }

      function getRiskLevelClass(level) {
        switch (level?.toLowerCase()) {
          case 'critical': return 'bg-red-100 text-red-800';
          case 'high': return 'bg-orange-100 text-orange-800';
          case 'medium': return 'bg-yellow-100 text-yellow-800';
          case 'low': return 'bg-blue-100 text-blue-800';
          default: return 'bg-gray-100 text-gray-800';
        }
      }

      function filterCorrelations() {
        const filter = document.getElementById('correlationFilter').value;
        let filtered = allCorrelations;
        
        if (filter) {
          switch (filter) {
            case 'high':
              filtered = filtered.filter(c => c.confidence >= 80);
              break;
            case 'medium':
              filtered = filtered.filter(c => c.confidence >= 50 && c.confidence < 80);
              break;
            case 'low':
              filtered = filtered.filter(c => c.confidence < 50);
              break;
          }
        }
        
        displayCorrelations(filtered);
      }

      async function runCorrelationAnalysis() {
        try {
          const button = event.target;
          button.disabled = true;
          button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';
          
          const response = await fetch('/api/threat-intelligence/correlations/analyze', {
            method: 'POST'
          });
          
          if (response.ok) {
            await loadCorrelations();
            showNotification('Correlation analysis completed successfully', 'success');
          } else {
            throw new Error('Analysis failed');
          }
        } catch (error) {
          console.error('Error running correlation analysis:', error);
          showNotification('Error running correlation analysis', 'error');
        } finally {
          const button = document.querySelector('button[onclick="runCorrelationAnalysis()"]');
          button.disabled = false;
          button.innerHTML = '<i class="fas fa-play mr-2"></i>Run Analysis';
        }
      }

      function viewCorrelationDetails(correlationId) {
        window.location.href = \`/threat-intel/correlations/\${correlationId}\`;
      }

      function investigateCorrelation(correlationId) {
        window.location.href = \`/threat-intel/investigate/\${correlationId}\`;
      }

      function createIncident(correlationId) {
        window.location.href = \`/incident-response/create?correlation=\${correlationId}\`;
      }

      function exportCorrelations() {
        showNotification('Export functionality coming soon', 'info');
      }

      function showNotification(message, type) {
        const notification = document.createElement('div');
        const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
        notification.className = \`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg \${bgColor} text-white\`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.remove();
        }, 3000);
      }
    </script>
  `;

  return c.html(baseLayout('Threat Correlations - Threat Intelligence', content, user));
});

export { threatIntelRoutes };