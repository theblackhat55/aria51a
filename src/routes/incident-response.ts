import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { IncidentResponseService } from '../services/incident-response';
import { RBACService } from '../services/rbac-service';
import { baseLayout } from '../templates/layout';

const incidentResponseRoutes = new Hono();

// Apply authentication middleware to all routes
incidentResponseRoutes.use('*', requireAuth);

// Initialize services
const incidentService = new IncidentResponseService();
const rbacService = new RBACService();

// Main Incident Response Dashboard
incidentResponseRoutes.get('/', requirePermission('incident:view'), async (c) => {
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
                <i class="fas fa-shield-alt mr-3 text-orange-600"></i>
                Incident Response Center
              </h1>
              <p class="mt-2 max-w-4xl text-lg text-gray-500">
                Automated incident response workflows, playbooks, and SOAR capabilities
              </p>
            </div>
            <div class="flex space-x-3">
              <button onclick="createNewIncident()" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                <i class="fas fa-plus mr-2"></i>
                New Incident
              </button>
              <button onclick="refreshIncidents()" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <i class="fas fa-sync-alt mr-2"></i>
                Refresh
              </button>
            </div>
          </div>
        </div>

        <!-- Incident Overview Cards -->
        <div class="px-4 py-5 sm:px-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-exclamation-circle text-red-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Critical Incidents</dt>
                      <dd class="text-lg font-medium text-gray-900" id="critical-incidents">Loading...</dd>
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
                      <dt class="text-sm font-medium text-gray-500 truncate">High Priority</dt>
                      <dd class="text-lg font-medium text-gray-900" id="high-priority-incidents">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-play-circle text-blue-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Active Workflows</dt>
                      <dd class="text-lg font-medium text-gray-900" id="active-workflows">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-robot text-green-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Automated Actions</dt>
                      <dd class="text-lg font-medium text-gray-900" id="automated-actions">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-clock text-purple-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Avg Response Time</dt>
                      <dd class="text-lg font-medium text-gray-900" id="avg-response-time">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-white shadow rounded-lg mb-8">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Incident Response Operations</h3>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <button onclick="window.location.href='/incident-response/incidents'" class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                  <i class="fas fa-list mr-2 text-red-500"></i>
                  Active Incidents
                </button>
                <button onclick="window.location.href='/incident-response/workflows'" class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                  <i class="fas fa-project-diagram mr-2 text-blue-500"></i>
                  Workflows
                </button>
                <button onclick="window.location.href='/incident-response/playbooks'" class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                  <i class="fas fa-book mr-2 text-green-500"></i>
                  Playbooks
                </button>
                <button onclick="window.location.href='/incident-response/automation'" class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
                  <i class="fas fa-robot mr-2 text-purple-500"></i>
                  Automation
                </button>
              </div>
            </div>
          </div>

          <!-- Real-time Incident Status -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <!-- Incident Timeline -->
            <div class="bg-white shadow rounded-lg">
              <div class="px-4 py-5 sm:p-6">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Incident Timeline (Last 24h)</h3>
                <div class="h-64">
                  <canvas id="incidentTimelineChart" width="400" height="200"></canvas>
                </div>
              </div>
            </div>

            <!-- Response Performance -->
            <div class="bg-white shadow rounded-lg">
              <div class="px-4 py-5 sm:p-6">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Response Performance</h3>
                <div class="h-64">
                  <canvas id="responsePerformanceChart" width="400" height="200"></canvas>
                </div>
              </div>
            </div>
          </div>

          <!-- Active Incidents Table -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg leading-6 font-medium text-gray-900">Active Incidents</h3>
                <div class="flex space-x-2">
                  <select id="priorityFilter" onchange="filterIncidents()" class="border border-gray-300 rounded-md px-3 py-1 text-sm">
                    <option value="">All Priorities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <select id="statusFilter" onchange="filterIncidents()" class="border border-gray-300 rounded-md px-3 py-1 text-sm">
                    <option value="">All Status</option>
                    <option value="new">New</option>
                    <option value="investigating">Investigating</option>
                    <option value="contained">Contained</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>
              <div id="incidents-table" class="overflow-x-auto">
                <div class="text-center py-8">
                  <i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
                  <p class="mt-4 text-lg text-gray-500">Loading incidents...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
      let allIncidents = [];
      let timelineChart, performanceChart;
      
      document.addEventListener('DOMContentLoaded', function() {
        loadIncidentData();
        initializeCharts();
      });

      async function loadIncidentData() {
        try {
          // Load overview statistics
          const overviewResponse = await fetch('/api/incident-response/overview');
          const overview = await overviewResponse.json();
          
          document.getElementById('critical-incidents').textContent = overview.criticalIncidents || '0';
          document.getElementById('high-priority-incidents').textContent = overview.highPriorityIncidents || '0';
          document.getElementById('active-workflows').textContent = overview.activeWorkflows || '0';
          document.getElementById('automated-actions').textContent = overview.automatedActions || '0';
          document.getElementById('avg-response-time').textContent = overview.avgResponseTime || '0m';

          // Load active incidents
          const incidentsResponse = await fetch('/api/incident-response/incidents/active');
          const incidents = await incidentsResponse.json();
          
          displayIncidents(incidents);
          allIncidents = incidents;

          // Update charts
          updateTimelineChart(overview.timeline || []);
          updatePerformanceChart(overview.performance || {});
        } catch (error) {
          console.error('Error loading incident data:', error);
        }
      }

      function displayIncidents(incidents) {
        const container = document.getElementById('incidents-table');
        
        if (incidents.length === 0) {
          container.innerHTML = \`
            <div class="text-center py-8">
              <i class="fas fa-shield-alt text-4xl text-green-400"></i>
              <p class="mt-4 text-lg text-green-600">No active incidents</p>
              <p class="text-sm text-gray-500">Your security posture is currently stable</p>
            </div>
          \`;
          return;
        }

        const html = \`
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incident ID</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              \${incidents.map(incident => \`
                <tr class="\${incident.priority === 'critical' ? 'bg-red-50' : incident.priority === 'high' ? 'bg-yellow-50' : ''}">
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    INC-\${incident.id || '0000'}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">\${incident.title || 'Untitled Incident'}</div>
                    <div class="text-sm text-gray-500">\${incident.description?.substring(0, 60) || 'No description'}...</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${getPriorityClass(incident.priority)}">
                      \${incident.priority || 'unknown'}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${getStatusClass(incident.status)}">
                      \${incident.status || 'new'}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${incident.assigned_to || 'Unassigned'}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${new Date(incident.created_at || Date.now()).toLocaleString()}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onclick="viewIncidentDetails('\${incident.id}')" class="text-orange-600 hover:text-orange-900">View</button>
                    <button onclick="executeWorkflow('\${incident.id}')" class="text-blue-600 hover:text-blue-900">Workflow</button>
                    <button onclick="escalateIncident('\${incident.id}')" class="text-red-600 hover:text-red-900">Escalate</button>
                  </td>
                </tr>
              \`).join('')}
            </tbody>
          </table>
        \`;
        
        container.innerHTML = html;
      }

      function getPriorityClass(priority) {
        switch (priority?.toLowerCase()) {
          case 'critical': return 'bg-red-100 text-red-800';
          case 'high': return 'bg-orange-100 text-orange-800';
          case 'medium': return 'bg-yellow-100 text-yellow-800';
          case 'low': return 'bg-blue-100 text-blue-800';
          default: return 'bg-gray-100 text-gray-800';
        }
      }

      function getStatusClass(status) {
        switch (status?.toLowerCase()) {
          case 'new': return 'bg-red-100 text-red-800';
          case 'investigating': return 'bg-yellow-100 text-yellow-800';
          case 'contained': return 'bg-blue-100 text-blue-800';
          case 'resolved': return 'bg-green-100 text-green-800';
          default: return 'bg-gray-100 text-gray-800';
        }
      }

      function initializeCharts() {
        // Incident Timeline Chart
        const timelineCtx = document.getElementById('incidentTimelineChart').getContext('2d');
        timelineChart = new Chart(timelineCtx, {
          type: 'line',
          data: {
            labels: [],
            datasets: [{
              label: 'Incidents Created',
              data: [],
              borderColor: 'rgb(251, 146, 60)',
              backgroundColor: 'rgba(251, 146, 60, 0.1)',
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
                beginAtZero: true
              }
            }
          }
        });

        // Response Performance Chart
        const performanceCtx = document.getElementById('responsePerformanceChart').getContext('2d');
        performanceChart = new Chart(performanceCtx, {
          type: 'doughnut',
          data: {
            labels: ['Within SLA', 'Missed SLA'],
            datasets: [{
              data: [85, 15],
              backgroundColor: ['#10B981', '#EF4444'],
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

      function updateTimelineChart(timelineData) {
        if (timelineChart && timelineData.length > 0) {
          timelineChart.data.labels = timelineData.map(d => d.time);
          timelineChart.data.datasets[0].data = timelineData.map(d => d.count);
          timelineChart.update();
        }
      }

      function updatePerformanceChart(performanceData) {
        if (performanceChart && performanceData.withinSLA !== undefined) {
          performanceChart.data.datasets[0].data = [
            performanceData.withinSLA || 0,
            performanceData.missedSLA || 0
          ];
          performanceChart.update();
        }
      }

      function filterIncidents() {
        const priorityFilter = document.getElementById('priorityFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        
        let filtered = allIncidents;
        
        if (priorityFilter) {
          filtered = filtered.filter(i => i.priority?.toLowerCase() === priorityFilter);
        }
        
        if (statusFilter) {
          filtered = filtered.filter(i => i.status?.toLowerCase() === statusFilter);
        }
        
        displayIncidents(filtered);
      }

      function createNewIncident() {
        window.location.href = '/incident-response/create';
      }

      function viewIncidentDetails(incidentId) {
        window.location.href = \`/incident-response/incidents/\${incidentId}\`;
      }

      function executeWorkflow(incidentId) {
        window.location.href = \`/incident-response/workflows/execute?incident=\${incidentId}\`;
      }

      async function escalateIncident(incidentId) {
        try {
          const response = await fetch(\`/api/incident-response/incidents/\${incidentId}/escalate\`, {
            method: 'POST'
          });
          
          if (response.ok) {
            await loadIncidentData();
            showNotification('Incident escalated successfully', 'success');
          } else {
            throw new Error('Escalation failed');
          }
        } catch (error) {
          console.error('Error escalating incident:', error);
          showNotification('Error escalating incident', 'error');
        }
      }

      function refreshIncidents() {
        loadIncidentData();
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

  return c.html(baseLayout('Incident Response Center', content, user));
});

// Incident Management Page
incidentResponseRoutes.get('/incidents', requirePermission('incident:view'), async (c) => {
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
                <i class="fas fa-list mr-3 text-red-600"></i>
                Incident Management
              </h1>
              <p class="mt-2 max-w-4xl text-lg text-gray-500">
                Comprehensive incident tracking, management, and resolution
              </p>
            </div>
            <div class="flex space-x-3">
              <button onclick="showCreateIncidentForm()" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">
                <i class="fas fa-plus mr-2"></i>
                Create Incident
              </button>
              <button onclick="importIncidents()" class="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <i class="fas fa-upload mr-2"></i>
                Import
              </button>
            </div>
          </div>
        </div>

        <!-- Incident Filters and Search -->
        <div class="px-4 py-5 sm:px-6">
          <div class="bg-white shadow rounded-lg mb-8">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Filter & Search Incidents</h3>
              <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Search</label>
                  <input type="text" id="searchInput" onkeyup="searchIncidents()" placeholder="Search incidents..." class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Priority</label>
                  <select id="priorityFilter" onchange="filterIncidents()" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500">
                    <option value="">All Priorities</option>
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Status</label>
                  <select id="statusFilter" onchange="filterIncidents()" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500">
                    <option value="">All Status</option>
                    <option value="new">New</option>
                    <option value="investigating">Investigating</option>
                    <option value="contained">Contained</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Category</label>
                  <select id="categoryFilter" onchange="filterIncidents()" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500">
                    <option value="">All Categories</option>
                    <option value="malware">Malware</option>
                    <option value="phishing">Phishing</option>
                    <option value="data_breach">Data Breach</option>
                    <option value="system_compromise">System Compromise</option>
                    <option value="policy_violation">Policy Violation</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Assigned To</label>
                  <select id="assigneeFilter" onchange="filterIncidents()" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500">
                    <option value="">All Assignees</option>
                    <option value="unassigned">Unassigned</option>
                    <!-- Dynamic options will be loaded -->
                  </select>
                </div>
                <div class="flex items-end">
                  <button onclick="clearAllFilters()" class="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <i class="fas fa-times mr-2"></i>
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Incident Statistics -->
          <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-list-alt text-gray-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Total Incidents</dt>
                      <dd class="text-lg font-medium text-gray-900" id="total-incidents">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-exclamation-circle text-red-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Critical</dt>
                      <dd class="text-lg font-medium text-gray-900" id="critical-count">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-search text-yellow-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Under Investigation</dt>
                      <dd class="text-lg font-medium text-gray-900" id="investigating-count">Loading...</dd>
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
                      <dt class="text-sm font-medium text-gray-500 truncate">Resolved Today</dt>
                      <dd class="text-lg font-medium text-gray-900" id="resolved-today">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-clock text-blue-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Avg Resolution</dt>
                      <dd class="text-lg font-medium text-gray-900" id="avg-resolution">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Incidents List -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg leading-6 font-medium text-gray-900">All Incidents</h3>
                <div class="flex space-x-2">
                  <button onclick="exportIncidents()" class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <i class="fas fa-download mr-2"></i>
                    Export
                  </button>
                  <button onclick="bulkActions()" class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <i class="fas fa-tasks mr-2"></i>
                    Bulk Actions
                  </button>
                </div>
              </div>
              <div id="incidents-list" class="overflow-x-auto">
                <div class="text-center py-8">
                  <i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
                  <p class="mt-4 text-lg text-gray-500">Loading incidents...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Create Incident Modal -->
      <div id="createIncidentModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div class="relative top-10 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
          <div class="mt-3">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Create New Incident</h3>
            <form id="createIncidentForm" onsubmit="submitIncident(event)">
              <div class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Title *</label>
                    <input type="text" name="title" required placeholder="Incident title..." class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Priority *</label>
                    <select name="priority" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500">
                      <option value="">Select Priority</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Category</label>
                    <select name="category" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500">
                      <option value="">Select Category</option>
                      <option value="malware">Malware Incident</option>
                      <option value="phishing">Phishing Attack</option>
                      <option value="data_breach">Data Breach</option>
                      <option value="system_compromise">System Compromise</option>
                      <option value="policy_violation">Policy Violation</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Assigned To</label>
                    <select name="assigned_to" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500">
                      <option value="">Select Assignee</option>
                      <!-- Dynamic options will be loaded -->
                    </select>
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700">Description *</label>
                  <textarea name="description" required rows="4" placeholder="Describe the incident details, affected systems, and initial observations..." class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500"></textarea>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Affected Systems</label>
                    <input type="text" name="affected_systems" placeholder="System names or IPs (comma-separated)..." class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Source</label>
                    <select name="source" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500">
                      <option value="">Select Source</option>
                      <option value="siem">SIEM Alert</option>
                      <option value="user_report">User Report</option>
                      <option value="automated_detection">Automated Detection</option>
                      <option value="external_report">External Report</option>
                      <option value="penetration_test">Penetration Test</option>
                      <option value="vulnerability_scan">Vulnerability Scan</option>
                    </select>
                  </div>
                </div>

                <div class="flex items-center">
                  <input type="checkbox" name="auto_workflow" id="autoWorkflow" class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded">
                  <label for="autoWorkflow" class="ml-2 block text-sm text-gray-900">
                    Automatically trigger response workflow based on incident type
                  </label>
                </div>
              </div>

              <div class="mt-6 flex justify-end space-x-3">
                <button type="button" onclick="hideCreateIncidentForm()" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">
                  Create Incident
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <script>
      let allIncidents = [];
      let filteredIncidents = [];
      
      document.addEventListener('DOMContentLoaded', function() {
        loadIncidents();
        loadAssignees();
      });

      async function loadIncidents() {
        try {
          const response = await fetch('/api/incident-response/incidents');
          const data = await response.json();
          
          updateIncidentStatistics(data.statistics);
          displayIncidents(data.incidents);
          allIncidents = data.incidents;
          filteredIncidents = data.incidents;
        } catch (error) {
          console.error('Error loading incidents:', error);
          document.getElementById('incidents-list').innerHTML = \`
            <div class="text-center py-8">
              <i class="fas fa-exclamation-triangle text-4xl text-red-400"></i>
              <p class="mt-4 text-lg text-red-500">Error loading incidents</p>
            </div>
          \`;
        }
      }

      async function loadAssignees() {
        try {
          const response = await fetch('/api/users');
          const users = await response.json();
          
          const assigneeSelectors = document.querySelectorAll('select[name="assigned_to"]');
          assigneeSelectors.forEach(select => {
            users.forEach(user => {
              const option = document.createElement('option');
              option.value = user.email;
              option.textContent = user.name;
              select.appendChild(option);
            });
          });

          // Update filter dropdown
          const filterSelect = document.getElementById('assigneeFilter');
          users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.email;
            option.textContent = user.name;
            filterSelect.appendChild(option);
          });
        } catch (error) {
          console.error('Error loading assignees:', error);
        }
      }

      function updateIncidentStatistics(stats) {
        document.getElementById('total-incidents').textContent = stats.total || '0';
        document.getElementById('critical-count').textContent = stats.critical || '0';
        document.getElementById('investigating-count').textContent = stats.investigating || '0';
        document.getElementById('resolved-today').textContent = stats.resolvedToday || '0';
        document.getElementById('avg-resolution').textContent = stats.avgResolution || '0h';
      }

      function displayIncidents(incidents) {
        const container = document.getElementById('incidents-list');
        
        if (incidents.length === 0) {
          container.innerHTML = \`
            <div class="text-center py-8">
              <i class="fas fa-shield-alt text-4xl text-gray-400"></i>
              <p class="mt-4 text-lg text-gray-500">No incidents match the current filters</p>
              <button onclick="clearAllFilters()" class="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">
                Clear Filters
              </button>
            </div>
          \`;
          return;
        }

        const html = \`
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input type="checkbox" onchange="toggleSelectAll(this)" class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded">
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID / Title</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              \${incidents.map(incident => \`
                <tr class="\${incident.priority === 'critical' ? 'bg-red-50' : incident.priority === 'high' ? 'bg-orange-50' : ''}">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <input type="checkbox" name="selectedIncidents" value="\${incident.id}" class="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded">
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">INC-\${incident.id || '0000'}</div>
                    <div class="text-sm text-gray-500 max-w-xs truncate">\${incident.title || 'Untitled Incident'}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${getPriorityClass(incident.priority)}">
                      \${incident.priority || 'unknown'}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${getStatusClass(incident.status)}">
                      \${incident.status || 'new'}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${incident.category || 'N/A'}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${incident.assigned_to || 'Unassigned'}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${new Date(incident.created_at || Date.now()).toLocaleDateString()}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onclick="viewIncident('\${incident.id}')" class="text-red-600 hover:text-red-900">View</button>
                    <button onclick="editIncident('\${incident.id}')" class="text-blue-600 hover:text-blue-900">Edit</button>
                  </td>
                </tr>
              \`).join('')}
            </tbody>
          </table>
        \`;
        
        container.innerHTML = html;
      }

      function getPriorityClass(priority) {
        switch (priority?.toLowerCase()) {
          case 'critical': return 'bg-red-100 text-red-800';
          case 'high': return 'bg-orange-100 text-orange-800';
          case 'medium': return 'bg-yellow-100 text-yellow-800';
          case 'low': return 'bg-blue-100 text-blue-800';
          default: return 'bg-gray-100 text-gray-800';
        }
      }

      function getStatusClass(status) {
        switch (status?.toLowerCase()) {
          case 'new': return 'bg-red-100 text-red-800';
          case 'investigating': return 'bg-yellow-100 text-yellow-800';
          case 'contained': return 'bg-blue-100 text-blue-800';
          case 'resolved': return 'bg-green-100 text-green-800';
          case 'closed': return 'bg-gray-100 text-gray-800';
          default: return 'bg-gray-100 text-gray-800';
        }
      }

      function filterIncidents() {
        const priorityFilter = document.getElementById('priorityFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const categoryFilter = document.getElementById('categoryFilter').value;
        const assigneeFilter = document.getElementById('assigneeFilter').value;
        
        let filtered = allIncidents;
        
        if (priorityFilter) {
          filtered = filtered.filter(i => i.priority?.toLowerCase() === priorityFilter);
        }
        
        if (statusFilter) {
          filtered = filtered.filter(i => i.status?.toLowerCase() === statusFilter);
        }
        
        if (categoryFilter) {
          filtered = filtered.filter(i => i.category?.toLowerCase() === categoryFilter);
        }
        
        if (assigneeFilter) {
          if (assigneeFilter === 'unassigned') {
            filtered = filtered.filter(i => !i.assigned_to || i.assigned_to === '');
          } else {
            filtered = filtered.filter(i => i.assigned_to === assigneeFilter);
          }
        }
        
        filteredIncidents = filtered;
        displayIncidents(filtered);
      }

      function searchIncidents() {
        const searchTerm = document.getElementById('searchInput').value.toLowerCase();
        
        if (!searchTerm) {
          displayIncidents(filteredIncidents);
          return;
        }
        
        const searchResults = filteredIncidents.filter(incident => 
          incident.title?.toLowerCase().includes(searchTerm) ||
          incident.description?.toLowerCase().includes(searchTerm) ||
          incident.id?.toString().includes(searchTerm)
        );
        
        displayIncidents(searchResults);
      }

      function clearAllFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('priorityFilter').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('assigneeFilter').value = '';
        
        filteredIncidents = allIncidents;
        displayIncidents(allIncidents);
      }

      function showCreateIncidentForm() {
        document.getElementById('createIncidentModal').classList.remove('hidden');
      }

      function hideCreateIncidentForm() {
        document.getElementById('createIncidentModal').classList.add('hidden');
        document.getElementById('createIncidentForm').reset();
      }

      async function submitIncident(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const data = {
          title: formData.get('title'),
          priority: formData.get('priority'),
          category: formData.get('category'),
          assigned_to: formData.get('assigned_to'),
          description: formData.get('description'),
          affected_systems: formData.get('affected_systems'),
          source: formData.get('source'),
          auto_workflow: formData.has('auto_workflow')
        };

        try {
          const response = await fetch('/api/incident-response/incidents', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          if (response.ok) {
            hideCreateIncidentForm();
            await loadIncidents();
            showNotification('Incident created successfully!', 'success');
          } else {
            throw new Error('Failed to create incident');
          }
        } catch (error) {
          console.error('Error creating incident:', error);
          showNotification('Error creating incident', 'error');
        }
      }

      function viewIncident(incidentId) {
        window.location.href = \`/incident-response/incidents/\${incidentId}\`;
      }

      function editIncident(incidentId) {
        window.location.href = \`/incident-response/incidents/\${incidentId}/edit\`;
      }

      function toggleSelectAll(checkbox) {
        const checkboxes = document.querySelectorAll('input[name="selectedIncidents"]');
        checkboxes.forEach(cb => cb.checked = checkbox.checked);
      }

      function bulkActions() {
        const selected = Array.from(document.querySelectorAll('input[name="selectedIncidents"]:checked')).map(cb => cb.value);
        
        if (selected.length === 0) {
          showNotification('Please select incidents to perform bulk actions', 'error');
          return;
        }
        
        // Show bulk actions menu
        showNotification(\`Bulk actions for \${selected.length} incidents coming soon\`, 'info');
      }

      function exportIncidents() {
        showNotification('Export functionality coming soon', 'info');
      }

      function importIncidents() {
        showNotification('Import functionality coming soon', 'info');
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

  return c.html(baseLayout('Incident Management - Incident Response', content, user));
});

// Workflows Page
incidentResponseRoutes.get('/workflows', requirePermission('incident:view'), async (c) => {
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
                <i class="fas fa-project-diagram mr-3 text-blue-600"></i>
                Incident Response Workflows
              </h1>
              <p class="mt-2 max-w-4xl text-lg text-gray-500">
                Automated workflow orchestration for incident response and remediation
              </p>
            </div>
            <div class="flex space-x-3">
              <button onclick="createNewWorkflow()" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                <i class="fas fa-plus mr-2"></i>
                Create Workflow
              </button>
            </div>
          </div>
        </div>

        <!-- Workflow Overview -->
        <div class="px-4 py-5 sm:px-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-project-diagram text-blue-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Total Workflows</dt>
                      <dd class="text-lg font-medium text-gray-900" id="total-workflows">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-play text-green-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Active Executions</dt>
                      <dd class="text-lg font-medium text-gray-900" id="active-executions">Loading...</dd>
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
                      <dt class="text-sm font-medium text-gray-500 truncate">Success Rate</dt>
                      <dd class="text-lg font-medium text-gray-900" id="success-rate">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-bolt text-yellow-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Avg Execution Time</dt>
                      <dd class="text-lg font-medium text-gray-900" id="avg-execution-time">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Workflow Templates -->
          <div class="bg-white shadow rounded-lg mb-8">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Workflow Templates</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 cursor-pointer" onclick="createFromTemplate('malware_response')">
                  <div class="text-center">
                    <i class="fas fa-bug text-red-500 text-3xl mb-4"></i>
                    <h4 class="text-lg font-medium text-gray-900">Malware Response</h4>
                    <p class="text-sm text-gray-500 mt-2">Automated malware containment and remediation workflow</p>
                    <div class="mt-4 text-xs text-gray-400">
                      7 Steps • Avg 15 min • 95% Success Rate
                    </div>
                  </div>
                </div>

                <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 cursor-pointer" onclick="createFromTemplate('phishing_response')">
                  <div class="text-center">
                    <i class="fas fa-envelope-open-text text-orange-500 text-3xl mb-4"></i>
                    <h4 class="text-lg font-medium text-gray-900">Phishing Response</h4>
                    <p class="text-sm text-gray-500 mt-2">User notification, email blocking, and security training workflow</p>
                    <div class="mt-4 text-xs text-gray-400">
                      5 Steps • Avg 8 min • 98% Success Rate
                    </div>
                  </div>
                </div>

                <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 cursor-pointer" onclick="createFromTemplate('data_breach')">
                  <div class="text-center">
                    <i class="fas fa-shield-alt text-red-500 text-3xl mb-4"></i>
                    <h4 class="text-lg font-medium text-gray-900">Data Breach Response</h4>
                    <p class="text-sm text-gray-500 mt-2">Evidence collection, notification, and compliance workflow</p>
                    <div class="mt-4 text-xs text-gray-400">
                      12 Steps • Avg 45 min • 87% Success Rate
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Workflows List -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg leading-6 font-medium text-gray-900">All Workflows</h3>
                <div class="flex space-x-2">
                  <select id="workflowFilter" onchange="filterWorkflows()" class="border border-gray-300 rounded-md px-3 py-1 text-sm">
                    <option value="">All Types</option>
                    <option value="malware">Malware Response</option>
                    <option value="phishing">Phishing Response</option>
                    <option value="breach">Data Breach</option>
                    <option value="custom">Custom</option>
                  </select>
                  <button onclick="importWorkflows()" class="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <i class="fas fa-upload mr-2"></i>
                    Import
                  </button>
                </div>
              </div>
              <div id="workflows-list">
                <div class="text-center py-8">
                  <i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
                  <p class="mt-4 text-lg text-gray-500">Loading workflows...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <script>
      let allWorkflows = [];
      
      document.addEventListener('DOMContentLoaded', function() {
        loadWorkflows();
      });

      async function loadWorkflows() {
        try {
          const response = await fetch('/api/incident-response/workflows');
          const data = await response.json();
          
          updateWorkflowStatistics(data.statistics);
          displayWorkflows(data.workflows);
          allWorkflows = data.workflows;
        } catch (error) {
          console.error('Error loading workflows:', error);
          document.getElementById('workflows-list').innerHTML = \`
            <div class="text-center py-8">
              <i class="fas fa-exclamation-triangle text-4xl text-red-400"></i>
              <p class="mt-4 text-lg text-red-500">Error loading workflows</p>
            </div>
          \`;
        }
      }

      function updateWorkflowStatistics(stats) {
        document.getElementById('total-workflows').textContent = stats.total || '0';
        document.getElementById('active-executions').textContent = stats.activeExecutions || '0';
        document.getElementById('success-rate').textContent = (stats.successRate || 0).toFixed(1) + '%';
        document.getElementById('avg-execution-time').textContent = stats.avgExecutionTime || '0m';
      }

      function displayWorkflows(workflows) {
        const container = document.getElementById('workflows-list');
        
        if (workflows.length === 0) {
          container.innerHTML = \`
            <div class="text-center py-8">
              <i class="fas fa-project-diagram text-4xl text-gray-400"></i>
              <p class="mt-4 text-lg text-gray-500">No workflows available</p>
              <button onclick="createNewWorkflow()" class="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                <i class="fas fa-plus mr-2"></i>
                Create First Workflow
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
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Workflow Name</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Steps</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Executed</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                \${workflows.map(workflow => \`
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">\${workflow.name || 'Unnamed Workflow'}</div>
                      <div class="text-sm text-gray-500">\${workflow.description || 'No description'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${getWorkflowTypeClass(workflow.type)}">
                        \${workflow.type || 'custom'}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${(workflow.steps || []).length}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${(workflow.success_rate || 0).toFixed(1)}%</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${workflow.last_executed ? new Date(workflow.last_executed).toLocaleDateString() : 'Never'}</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${getWorkflowStatusClass(workflow.status)}">
                        \${workflow.status || 'active'}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button onclick="viewWorkflow('\${workflow.id}')" class="text-blue-600 hover:text-blue-900">View</button>
                      <button onclick="executeWorkflow('\${workflow.id}')" class="text-green-600 hover:text-green-900">Execute</button>
                      <button onclick="editWorkflow('\${workflow.id}')" class="text-yellow-600 hover:text-yellow-900">Edit</button>
                    </td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          </div>
        \`;
        
        container.innerHTML = html;
      }

      function getWorkflowTypeClass(type) {
        switch (type?.toLowerCase()) {
          case 'malware': return 'bg-red-100 text-red-800';
          case 'phishing': return 'bg-orange-100 text-orange-800';
          case 'breach': return 'bg-purple-100 text-purple-800';
          case 'custom': return 'bg-blue-100 text-blue-800';
          default: return 'bg-gray-100 text-gray-800';
        }
      }

      function getWorkflowStatusClass(status) {
        switch (status?.toLowerCase()) {
          case 'active': return 'bg-green-100 text-green-800';
          case 'inactive': return 'bg-red-100 text-red-800';
          case 'draft': return 'bg-yellow-100 text-yellow-800';
          default: return 'bg-gray-100 text-gray-800';
        }
      }

      function filterWorkflows() {
        const filter = document.getElementById('workflowFilter').value;
        let filtered = allWorkflows;
        
        if (filter) {
          filtered = filtered.filter(w => w.type?.toLowerCase() === filter);
        }
        
        displayWorkflows(filtered);
      }

      function createNewWorkflow() {
        window.location.href = '/incident-response/workflows/create';
      }

      function createFromTemplate(templateType) {
        window.location.href = \`/incident-response/workflows/create?template=\${templateType}\`;
      }

      function viewWorkflow(workflowId) {
        window.location.href = \`/incident-response/workflows/\${workflowId}\`;
      }

      async function executeWorkflow(workflowId) {
        try {
          const response = await fetch(\`/api/incident-response/workflows/\${workflowId}/execute\`, {
            method: 'POST'
          });

          if (response.ok) {
            const result = await response.json();
            showNotification(\`Workflow execution started: \${result.executionId}\`, 'success');
            await loadWorkflows();
          } else {
            throw new Error('Execution failed');
          }
        } catch (error) {
          console.error('Error executing workflow:', error);
          showNotification('Error executing workflow', 'error');
        }
      }

      function editWorkflow(workflowId) {
        window.location.href = \`/incident-response/workflows/\${workflowId}/edit\`;
      }

      function importWorkflows() {
        showNotification('Workflow import functionality coming soon', 'info');
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

  return c.html(baseLayout('Workflows - Incident Response', content, user));
});

// Playbooks Page
incidentResponseRoutes.get('/playbooks', requirePermission('incident:view'), async (c) => {
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
                <i class="fas fa-book mr-3 text-green-600"></i>
                Response Playbooks
              </h1>
              <p class="mt-2 max-w-4xl text-lg text-gray-500">
                Standardized response procedures and best practices for incident handling
              </p>
            </div>
            <div class="flex space-x-3">
              <button onclick="createNewPlaybook()" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                <i class="fas fa-plus mr-2"></i>
                Create Playbook
              </button>
            </div>
          </div>
        </div>

        <!-- Playbook Categories -->
        <div class="px-4 py-5 sm:px-6">
          <div class="bg-white shadow rounded-lg mb-8">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Playbook Categories</h3>
              <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md cursor-pointer" onclick="filterByCategory('malware')">
                  <div class="text-center">
                    <i class="fas fa-bug text-red-500 text-2xl mb-2"></i>
                    <h4 class="text-sm font-medium text-gray-900">Malware Response</h4>
                    <p class="text-xs text-gray-500 mt-1">Containment & Eradication</p>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-2" id="malware-count">0 playbooks</span>
                  </div>
                </div>

                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md cursor-pointer" onclick="filterByCategory('phishing')">
                  <div class="text-center">
                    <i class="fas fa-envelope-open-text text-orange-500 text-2xl mb-2"></i>
                    <h4 class="text-sm font-medium text-gray-900">Phishing Response</h4>
                    <p class="text-xs text-gray-500 mt-1">Email Security & Training</p>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 mt-2" id="phishing-count">0 playbooks</span>
                  </div>
                </div>

                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md cursor-pointer" onclick="filterByCategory('breach')">
                  <div class="text-center">
                    <i class="fas fa-shield-alt text-purple-500 text-2xl mb-2"></i>
                    <h4 class="text-sm font-medium text-gray-900">Data Breach</h4>
                    <p class="text-xs text-gray-500 mt-1">Legal & Compliance</p>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-2" id="breach-count">0 playbooks</span>
                  </div>
                </div>

                <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md cursor-pointer" onclick="filterByCategory('network')">
                  <div class="text-center">
                    <i class="fas fa-network-wired text-blue-500 text-2xl mb-2"></i>
                    <h4 class="text-sm font-medium text-gray-900">Network Security</h4>
                    <p class="text-xs text-gray-500 mt-1">Infrastructure Protection</p>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-2" id="network-count">0 playbooks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Search and Filters -->
          <div class="bg-white shadow rounded-lg mb-8">
            <div class="px-4 py-5 sm:p-6">
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700">Search Playbooks</label>
                  <input type="text" id="playbookSearch" onkeyup="searchPlaybooks()" placeholder="Search by name, description..." class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Category</label>
                  <select id="categoryFilter" onchange="filterPlaybooks()" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500">
                    <option value="">All Categories</option>
                    <option value="malware">Malware Response</option>
                    <option value="phishing">Phishing Response</option>
                    <option value="breach">Data Breach</option>
                    <option value="network">Network Security</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700">Status</label>
                  <select id="statusFilter" onchange="filterPlaybooks()" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500">
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div class="flex items-end">
                  <button onclick="clearPlaybookFilters()" class="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <i class="fas fa-times mr-2"></i>
                    Clear
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Playbooks Grid -->
          <div id="playbooks-container">
            <div class="text-center py-8">
              <i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
              <p class="mt-4 text-lg text-gray-500">Loading playbooks...</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <script>
      let allPlaybooks = [];
      let filteredPlaybooks = [];
      
      document.addEventListener('DOMContentLoaded', function() {
        loadPlaybooks();
      });

      async function loadPlaybooks() {
        try {
          const response = await fetch('/api/incident-response/playbooks');
          const data = await response.json();
          
          allPlaybooks = data.playbooks || [];
          filteredPlaybooks = allPlaybooks;
          
          updateCategoryCounts();
          displayPlaybooks(allPlaybooks);
        } catch (error) {
          console.error('Error loading playbooks:', error);
          document.getElementById('playbooks-container').innerHTML = \`
            <div class="text-center py-8">
              <i class="fas fa-exclamation-triangle text-4xl text-red-400"></i>
              <p class="mt-4 text-lg text-red-500">Error loading playbooks</p>
            </div>
          \`;
        }
      }

      function updateCategoryCounts() {
        const counts = {
          malware: 0,
          phishing: 0,
          breach: 0,
          network: 0
        };

        allPlaybooks.forEach(playbook => {
          if (counts.hasOwnProperty(playbook.category)) {
            counts[playbook.category]++;
          }
        });

        Object.keys(counts).forEach(category => {
          const element = document.getElementById(\`\${category}-count\`);
          if (element) {
            element.textContent = \`\${counts[category]} playbooks\`;
          }
        });
      }

      function displayPlaybooks(playbooks) {
        const container = document.getElementById('playbooks-container');
        
        if (playbooks.length === 0) {
          container.innerHTML = \`
            <div class="text-center py-8">
              <i class="fas fa-book text-4xl text-gray-400"></i>
              <p class="mt-4 text-lg text-gray-500">No playbooks match your criteria</p>
              <button onclick="createNewPlaybook()" class="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                <i class="fas fa-plus mr-2"></i>
                Create First Playbook
              </button>
            </div>
          \`;
          return;
        }

        const html = \`
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            \${playbooks.map(playbook => \`
              <div class="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer" onclick="viewPlaybook('\${playbook.id}')">
                <div class="p-6">
                  <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center">
                      <i class="fas \${getPlaybookIcon(playbook.category)} \${getPlaybookIconColor(playbook.category)} text-2xl mr-3"></i>
                      <div>
                        <h3 class="text-lg font-medium text-gray-900">\${playbook.name || 'Unnamed Playbook'}</h3>
                        <p class="text-sm text-gray-500">\${playbook.category || 'uncategorized'}</p>
                      </div>
                    </div>
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${getStatusClass(playbook.status)}">
                      \${playbook.status || 'active'}
                    </span>
                  </div>
                  
                  <p class="text-sm text-gray-700 mb-4 line-clamp-3">\${playbook.description || 'No description available'}</p>
                  
                  <div class="grid grid-cols-2 gap-4 mb-4">
                    <div class="text-center">
                      <div class="text-lg font-semibold text-gray-900">\${(playbook.steps || []).length}</div>
                      <div class="text-xs text-gray-500">Steps</div>
                    </div>
                    <div class="text-center">
                      <div class="text-lg font-semibold text-gray-900">\${playbook.usage_count || 0}</div>
                      <div class="text-xs text-gray-500">Used</div>
                    </div>
                  </div>
                  
                  <div class="flex items-center justify-between text-xs text-gray-500">
                    <span>Updated \${playbook.updated_at ? new Date(playbook.updated_at).toLocaleDateString() : 'Never'}</span>
                    <span>By \${playbook.updated_by || 'Unknown'}</span>
                  </div>
                  
                  <div class="mt-4 flex justify-between">
                    <button onclick="event.stopPropagation(); usePlaybook('\${playbook.id}')" class="text-green-600 hover:text-green-800 text-sm font-medium">
                      Use Playbook
                    </button>
                    <button onclick="event.stopPropagation(); editPlaybook('\${playbook.id}')" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            \`).join('')}
          </div>
        \`;
        
        container.innerHTML = html;
      }

      function getPlaybookIcon(category) {
        switch (category?.toLowerCase()) {
          case 'malware': return 'fa-bug';
          case 'phishing': return 'fa-envelope-open-text';
          case 'breach': return 'fa-shield-alt';
          case 'network': return 'fa-network-wired';
          default: return 'fa-book';
        }
      }

      function getPlaybookIconColor(category) {
        switch (category?.toLowerCase()) {
          case 'malware': return 'text-red-500';
          case 'phishing': return 'text-orange-500';
          case 'breach': return 'text-purple-500';
          case 'network': return 'text-blue-500';
          default: return 'text-gray-500';
        }
      }

      function getStatusClass(status) {
        switch (status?.toLowerCase()) {
          case 'active': return 'bg-green-100 text-green-800';
          case 'draft': return 'bg-yellow-100 text-yellow-800';
          case 'archived': return 'bg-gray-100 text-gray-800';
          default: return 'bg-green-100 text-green-800';
        }
      }

      function filterByCategory(category) {
        document.getElementById('categoryFilter').value = category;
        filterPlaybooks();
      }

      function filterPlaybooks() {
        const categoryFilter = document.getElementById('categoryFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        
        let filtered = allPlaybooks;
        
        if (categoryFilter) {
          filtered = filtered.filter(p => p.category?.toLowerCase() === categoryFilter);
        }
        
        if (statusFilter) {
          filtered = filtered.filter(p => p.status?.toLowerCase() === statusFilter);
        }
        
        filteredPlaybooks = filtered;
        displayPlaybooks(filtered);
      }

      function searchPlaybooks() {
        const searchTerm = document.getElementById('playbookSearch').value.toLowerCase();
        
        if (!searchTerm) {
          displayPlaybooks(filteredPlaybooks);
          return;
        }
        
        const searchResults = filteredPlaybooks.filter(playbook => 
          playbook.name?.toLowerCase().includes(searchTerm) ||
          playbook.description?.toLowerCase().includes(searchTerm) ||
          playbook.category?.toLowerCase().includes(searchTerm)
        );
        
        displayPlaybooks(searchResults);
      }

      function clearPlaybookFilters() {
        document.getElementById('playbookSearch').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('statusFilter').value = '';
        
        filteredPlaybooks = allPlaybooks;
        displayPlaybooks(allPlaybooks);
      }

      function createNewPlaybook() {
        window.location.href = '/incident-response/playbooks/create';
      }

      function viewPlaybook(playbookId) {
        window.location.href = \`/incident-response/playbooks/\${playbookId}\`;
      }

      function editPlaybook(playbookId) {
        window.location.href = \`/incident-response/playbooks/\${playbookId}/edit\`;
      }

      async function usePlaybook(playbookId) {
        try {
          const response = await fetch(\`/api/incident-response/playbooks/\${playbookId}/use\`, {
            method: 'POST'
          });

          if (response.ok) {
            const result = await response.json();
            showNotification(\`Playbook activated: \${result.workflowId}\`, 'success');
          } else {
            throw new Error('Failed to use playbook');
          }
        } catch (error) {
          console.error('Error using playbook:', error);
          showNotification('Error activating playbook', 'error');
        }
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
    
    <style>
      .line-clamp-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    </style>
  `;

  return c.html(baseLayout('Response Playbooks - Incident Response', content, user));
});

export { incidentResponseRoutes };