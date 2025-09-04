import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { requireAuth } from '../middleware/auth';
import { requirePermission } from '../middleware/rbac';
import { MLAnalyticsService } from '../services/ml-analytics';
import { RBACService } from '../services/rbac-service';
import { baseLayout } from '../templates/layout';

const mlAnalyticsRoutes = new Hono();

// Apply authentication middleware to all routes
mlAnalyticsRoutes.use('*', requireAuth);

// Initialize services
const mlService = new MLAnalyticsService();
const rbacService = new RBACService();

// Main Analytics Dashboard
mlAnalyticsRoutes.get('/', requirePermission('analytics:view'), async (c) => {
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
                <i class="fas fa-brain mr-3 text-blue-600"></i>
                ML Analytics Center
              </h1>
              <p class="mt-2 max-w-4xl text-lg text-gray-500">
                Advanced machine learning analytics for risk prediction, trend analysis, and anomaly detection
              </p>
            </div>
            <div class="flex space-x-3">
              <button onclick="refreshAnalytics()" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <i class="fas fa-sync-alt mr-2"></i>
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        <!-- Analytics Overview Cards -->
        <div class="px-4 py-5 sm:px-6">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-chart-line text-green-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Risk Predictions</dt>
                      <dd class="text-lg font-medium text-gray-900" id="risk-predictions-count">Loading...</dd>
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
                      <dt class="text-sm font-medium text-gray-500 truncate">Anomalies Detected</dt>
                      <dd class="text-lg font-medium text-gray-900" id="anomalies-count">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-robot text-blue-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">ML Models Active</dt>
                      <dd class="text-lg font-medium text-gray-900" id="models-count">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-percentage text-purple-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Prediction Accuracy</dt>
                      <dd class="text-lg font-medium text-gray-900" id="accuracy-rate">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="bg-white shadow rounded-lg mb-8">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Analytics Actions</h3>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onclick="window.location.href='/analytics/predictions'" class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <i class="fas fa-crystal-ball mr-2 text-blue-500"></i>
                  Risk Predictions
                </button>
                <button onclick="window.location.href='/analytics/trends'" class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <i class="fas fa-chart-area mr-2 text-green-500"></i>
                  Trend Analysis
                </button>
                <button onclick="window.location.href='/analytics/anomalies'" class="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <i class="fas fa-search mr-2 text-red-500"></i>
                  Anomaly Detection
                </button>
              </div>
            </div>
          </div>

          <!-- Real-time Analytics Charts -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Risk Trend Chart -->
            <div class="bg-white shadow rounded-lg">
              <div class="px-4 py-5 sm:p-6">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Risk Level Trends</h3>
                <div class="h-64">
                  <canvas id="riskTrendChart" width="400" height="200"></canvas>
                </div>
              </div>
            </div>

            <!-- Prediction Accuracy Chart -->
            <div class="bg-white shadow rounded-lg">
              <div class="px-4 py-5 sm:p-6">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Model Performance</h3>
                <div class="h-64">
                  <canvas id="accuracyChart" width="400" height="200"></canvas>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Predictions Table -->
          <div class="bg-white shadow rounded-lg mt-8">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Risk Predictions</h3>
              <div id="recent-predictions" class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prediction Time</th>
                      <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody id="predictions-table-body" class="bg-white divide-y divide-gray-200">
                    <tr>
                      <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">Loading predictions...</td>
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
        loadAnalyticsData();
        initializeCharts();
      });

      async function loadAnalyticsData() {
        try {
          // Load overview statistics
          const overviewResponse = await fetch('/api/ml-analytics/overview');
          const overview = await overviewResponse.json();
          
          document.getElementById('risk-predictions-count').textContent = overview.totalPredictions || '0';
          document.getElementById('anomalies-count').textContent = overview.anomaliesDetected || '0';
          document.getElementById('models-count').textContent = overview.activeModels || '0';
          document.getElementById('accuracy-rate').textContent = (overview.averageAccuracy || 0).toFixed(1) + '%';

          // Load recent predictions
          const predictionsResponse = await fetch('/api/ml-analytics/predictions/recent');
          const predictions = await predictionsResponse.json();
          
          displayRecentPredictions(predictions);
        } catch (error) {
          console.error('Error loading analytics data:', error);
        }
      }

      function displayRecentPredictions(predictions) {
        const tbody = document.getElementById('predictions-table-body');
        tbody.innerHTML = '';
        
        if (predictions.length === 0) {
          tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">No predictions available</td></tr>';
          return;
        }

        predictions.forEach(prediction => {
          const row = document.createElement('tr');
          row.innerHTML = \`
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">\${prediction.asset_name || 'Unknown Asset'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${getRiskScoreClass(prediction.risk_score)}">
                \${prediction.risk_score || 0}%
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${(prediction.confidence || 0).toFixed(1)}%</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${new Date(prediction.created_at || Date.now()).toLocaleString()}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button onclick="viewPredictionDetails('\${prediction.id}')" class="text-blue-600 hover:text-blue-900">View Details</button>
            </td>
          \`;
          tbody.appendChild(row);
        });
      }

      function getRiskScoreClass(score) {
        if (score >= 80) return 'bg-red-100 text-red-800';
        if (score >= 60) return 'bg-yellow-100 text-yellow-800';
        if (score >= 40) return 'bg-blue-100 text-blue-800';
        return 'bg-green-100 text-green-800';
      }

      function initializeCharts() {
        // Risk Trend Chart
        const riskCtx = document.getElementById('riskTrendChart').getContext('2d');
        new Chart(riskCtx, {
          type: 'line',
          data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
              label: 'Average Risk Score',
              data: [45, 52, 48, 61, 55, 49],
              borderColor: 'rgb(59, 130, 246)',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              tension: 0.4
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
                max: 100
              }
            }
          }
        });

        // Accuracy Chart
        const accuracyCtx = document.getElementById('accuracyChart').getContext('2d');
        new Chart(accuracyCtx, {
          type: 'doughnut',
          data: {
            labels: ['Accurate Predictions', 'Inaccurate Predictions'],
            datasets: [{
              data: [87, 13],
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

      function refreshAnalytics() {
        loadAnalyticsData();
      }

      function viewPredictionDetails(predictionId) {
        window.location.href = \`/analytics/predictions/\${predictionId}\`;
      }
    </script>
  `;

  return c.html(baseLayout('ML Analytics Center', content, user));
});

// Risk Predictions Page
mlAnalyticsRoutes.get('/predictions', requirePermission('analytics:view'), async (c) => {
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
                <i class="fas fa-crystal-ball mr-3 text-blue-600"></i>
                Risk Predictions
              </h1>
              <p class="mt-2 max-w-4xl text-lg text-gray-500">
                AI-powered risk prediction models for proactive security management
              </p>
            </div>
            <div class="flex space-x-3">
              <button onclick="showPredictionForm()" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                <i class="fas fa-plus mr-2"></i>
                New Prediction
              </button>
            </div>
          </div>
        </div>

        <!-- Prediction Form Modal -->
        <div id="predictionModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div class="mt-3">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Generate Risk Prediction</h3>
              <form id="predictionForm" onsubmit="submitPrediction(event)">
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Asset Type</label>
                    <select name="asset_type" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                      <option value="server">Server</option>
                      <option value="workstation">Workstation</option>
                      <option value="network_device">Network Device</option>
                      <option value="application">Application</option>
                      <option value="database">Database</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Vulnerability Count</label>
                    <input type="number" name="vulnerability_count" min="0" max="100" value="5" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Patch Level (%)</label>
                    <input type="number" name="patch_level" min="0" max="100" value="85" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Exposure Score</label>
                    <input type="number" name="exposure_score" min="0" max="100" step="0.1" value="25.5" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700">Historical Incidents</label>
                    <input type="number" name="historical_incidents" min="0" max="50" value="2" class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                  </div>
                </div>
                <div class="mt-6 flex justify-end space-x-3">
                  <button type="button" onclick="hidePredictionForm()" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Cancel
                  </button>
                  <button type="submit" class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                    Generate Prediction
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- Predictions List -->
        <div class="px-4 py-5 sm:px-6">
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <div id="predictions-list">
                <div class="text-center py-8">
                  <i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
                  <p class="mt-4 text-lg text-gray-500">Loading predictions...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <script>
      document.addEventListener('DOMContentLoaded', function() {
        loadPredictions();
      });

      async function loadPredictions() {
        try {
          const response = await fetch('/api/ml-analytics/predictions');
          const predictions = await response.json();
          displayPredictions(predictions);
        } catch (error) {
          console.error('Error loading predictions:', error);
          document.getElementById('predictions-list').innerHTML = \`
            <div class="text-center py-8">
              <i class="fas fa-exclamation-triangle text-4xl text-red-400"></i>
              <p class="mt-4 text-lg text-red-500">Error loading predictions</p>
            </div>
          \`;
        }
      }

      function displayPredictions(predictions) {
        const container = document.getElementById('predictions-list');
        
        if (predictions.length === 0) {
          container.innerHTML = \`
            <div class="text-center py-8">
              <i class="fas fa-crystal-ball text-4xl text-gray-400"></i>
              <p class="mt-4 text-lg text-gray-500">No predictions generated yet</p>
              <button onclick="showPredictionForm()" class="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
                <i class="fas fa-plus mr-2"></i>
                Generate First Prediction
              </button>
            </div>
          \`;
          return;
        }

        const html = \`
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            \${predictions.map(prediction => \`
              <div class="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-medium text-gray-900">\${prediction.asset_name || 'Unknown Asset'}</h3>
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${getRiskScoreClass(prediction.risk_score)}">
                    \${prediction.risk_score || 0}%
                  </span>
                </div>
                <div class="space-y-2 text-sm text-gray-600">
                  <div class="flex justify-between">
                    <span>Confidence:</span>
                    <span class="font-medium">\${(prediction.confidence || 0).toFixed(1)}%</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Asset Type:</span>
                    <span class="font-medium">\${prediction.asset_type || 'Unknown'}</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Generated:</span>
                    <span class="font-medium">\${new Date(prediction.created_at || Date.now()).toLocaleDateString()}</span>
                  </div>
                </div>
                <div class="mt-4 pt-4 border-t border-gray-200">
                  <button onclick="viewPredictionDetails('\${prediction.id}')" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    View Details →
                  </button>
                </div>
              </div>
            \`).join('')}
          </div>
        \`;
        
        container.innerHTML = html;
      }

      function showPredictionForm() {
        document.getElementById('predictionModal').classList.remove('hidden');
      }

      function hidePredictionForm() {
        document.getElementById('predictionModal').classList.add('hidden');
      }

      async function submitPrediction(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const data = {
          asset_type: formData.get('asset_type'),
          vulnerability_count: parseInt(formData.get('vulnerability_count')),
          patch_level: parseInt(formData.get('patch_level')),
          exposure_score: parseFloat(formData.get('exposure_score')),
          historical_incidents: parseInt(formData.get('historical_incidents'))
        };

        try {
          const response = await fetch('/api/ml-analytics/predictions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });

          if (response.ok) {
            hidePredictionForm();
            loadPredictions();
            // Show success message
            showNotification('Risk prediction generated successfully!', 'success');
          } else {
            throw new Error('Failed to generate prediction');
          }
        } catch (error) {
          console.error('Error generating prediction:', error);
          showNotification('Error generating prediction', 'error');
        }
      }

      function getRiskScoreClass(score) {
        if (score >= 80) return 'bg-red-100 text-red-800';
        if (score >= 60) return 'bg-yellow-100 text-yellow-800';
        if (score >= 40) return 'bg-blue-100 text-blue-800';
        return 'bg-green-100 text-green-800';
      }

      function viewPredictionDetails(predictionId) {
        window.location.href = \`/analytics/predictions/\${predictionId}\`;
      }

      function showNotification(message, type) {
        // Simple notification system
        const notification = document.createElement('div');
        notification.className = \`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg \${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white\`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.remove();
        }, 3000);
      }
    </script>
  `;

  return c.html(baseLayout('Risk Predictions - ML Analytics', content, user));
});

// Trend Analysis Page
mlAnalyticsRoutes.get('/trends', requirePermission('analytics:view'), async (c) => {
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
                <i class="fas fa-chart-area mr-3 text-green-600"></i>
                Trend Analysis
              </h1>
              <p class="mt-2 max-w-4xl text-lg text-gray-500">
                Advanced statistical analysis of security trends and patterns
              </p>
            </div>
            <div class="flex space-x-3">
              <select id="timeRange" onchange="updateTrendAnalysis()" class="border border-gray-300 rounded-md px-3 py-2 text-sm">
                <option value="7">Last 7 Days</option>
                <option value="30" selected>Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="365">Last Year</option>
              </select>
              <button onclick="generateTrendReport()" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700">
                <i class="fas fa-file-export mr-2"></i>
                Export Report
              </button>
            </div>
          </div>
        </div>

        <!-- Trend Overview -->
        <div class="px-4 py-5 sm:px-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <!-- Risk Trend Chart -->
            <div class="bg-white shadow rounded-lg">
              <div class="px-4 py-5 sm:p-6">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Risk Level Trends</h3>
                <div class="h-80">
                  <canvas id="riskTrendChart" width="400" height="320"></canvas>
                </div>
              </div>
            </div>

            <!-- Incident Trend Chart -->
            <div class="bg-white shadow rounded-lg">
              <div class="px-4 py-5 sm:p-6">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Incident Patterns</h3>
                <div class="h-80">
                  <canvas id="incidentTrendChart" width="400" height="320"></canvas>
                </div>
              </div>
            </div>
          </div>

          <!-- Trend Statistics -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white shadow rounded-lg">
              <div class="px-4 py-5 sm:p-6">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-trending-up text-green-500 text-2xl"></i>
                  </div>
                  <div class="ml-5">
                    <h3 class="text-lg font-medium text-gray-900">Improving Trends</h3>
                    <p class="text-3xl font-bold text-green-600" id="improving-trends">Loading...</p>
                    <p class="text-sm text-gray-500">Categories showing improvement</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white shadow rounded-lg">
              <div class="px-4 py-5 sm:p-6">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-trending-down text-red-500 text-2xl"></i>
                  </div>
                  <div class="ml-5">
                    <h3 class="text-lg font-medium text-gray-900">Declining Trends</h3>
                    <p class="text-3xl font-bold text-red-600" id="declining-trends">Loading...</p>
                    <p class="text-sm text-gray-500">Categories needing attention</p>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white shadow rounded-lg">
              <div class="px-4 py-5 sm:p-6">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-equals text-blue-500 text-2xl"></i>
                  </div>
                  <div class="ml-5">
                    <h3 class="text-lg font-medium text-gray-900">Stable Trends</h3>
                    <p class="text-3xl font-bold text-blue-600" id="stable-trends">Loading...</p>
                    <p class="text-sm text-gray-500">Categories maintaining levels</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Detailed Trend Analysis -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Detailed Trend Analysis</h3>
              <div id="trend-analysis-details">
                <div class="text-center py-8">
                  <i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
                  <p class="mt-4 text-lg text-gray-500">Analyzing trends...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
      let riskChart, incidentChart;
      
      document.addEventListener('DOMContentLoaded', function() {
        loadTrendAnalysis();
      });

      async function loadTrendAnalysis() {
        const timeRange = document.getElementById('timeRange').value;
        
        try {
          const response = await fetch(\`/api/ml-analytics/trends?days=\${timeRange}\`);
          const data = await response.json();
          
          updateTrendStatistics(data.statistics);
          updateTrendCharts(data.chartData);
          displayDetailedAnalysis(data.analysis);
        } catch (error) {
          console.error('Error loading trend analysis:', error);
        }
      }

      function updateTrendStatistics(stats) {
        document.getElementById('improving-trends').textContent = stats.improving || '0';
        document.getElementById('declining-trends').textContent = stats.declining || '0';
        document.getElementById('stable-trends').textContent = stats.stable || '0';
      }

      function updateTrendCharts(chartData) {
        // Destroy existing charts
        if (riskChart) riskChart.destroy();
        if (incidentChart) incidentChart.destroy();

        // Risk Trend Chart
        const riskCtx = document.getElementById('riskTrendChart').getContext('2d');
        riskChart = new Chart(riskCtx, {
          type: 'line',
          data: {
            labels: chartData.risk.labels || [],
            datasets: [{
              label: 'Average Risk Score',
              data: chartData.risk.data || [],
              borderColor: 'rgb(34, 197, 94)',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
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
                max: 100
              }
            }
          }
        });

        // Incident Trend Chart
        const incidentCtx = document.getElementById('incidentTrendChart').getContext('2d');
        incidentChart = new Chart(incidentCtx, {
          type: 'bar',
          data: {
            labels: chartData.incidents.labels || [],
            datasets: [{
              label: 'Daily Incidents',
              data: chartData.incidents.data || [],
              backgroundColor: 'rgba(239, 68, 68, 0.8)',
              borderColor: 'rgb(239, 68, 68)',
              borderWidth: 1
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
      }

      function displayDetailedAnalysis(analysis) {
        const container = document.getElementById('trend-analysis-details');
        
        if (!analysis || analysis.length === 0) {
          container.innerHTML = \`
            <div class="text-center py-8">
              <i class="fas fa-chart-area text-4xl text-gray-400"></i>
              <p class="mt-4 text-lg text-gray-500">No trend analysis data available</p>
            </div>
          \`;
          return;
        }

        const html = \`
          <div class="space-y-6">
            \${analysis.map(item => \`
              <div class="border-l-4 \${getTrendBorderClass(item.trend)} pl-4">
                <h4 class="text-lg font-medium text-gray-900">\${item.category}</h4>
                <p class="text-sm text-gray-600 mt-1">\${item.description}</p>
                <div class="mt-3 flex items-center space-x-4">
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${getTrendClass(item.trend)}">
                    <i class="fas \${getTrendIcon(item.trend)} mr-1"></i>
                    \${item.trend}
                  </span>
                  <span class="text-sm text-gray-500">Change: \${item.change > 0 ? '+' : ''}\${item.change}%</span>
                  <span class="text-sm text-gray-500">Confidence: \${item.confidence}%</span>
                </div>
              </div>
            \`).join('')}
          </div>
        \`;
        
        container.innerHTML = html;
      }

      function getTrendBorderClass(trend) {
        switch (trend.toLowerCase()) {
          case 'improving': return 'border-green-500';
          case 'declining': return 'border-red-500';
          default: return 'border-blue-500';
        }
      }

      function getTrendClass(trend) {
        switch (trend.toLowerCase()) {
          case 'improving': return 'bg-green-100 text-green-800';
          case 'declining': return 'bg-red-100 text-red-800';
          default: return 'bg-blue-100 text-blue-800';
        }
      }

      function getTrendIcon(trend) {
        switch (trend.toLowerCase()) {
          case 'improving': return 'fa-trending-up';
          case 'declining': return 'fa-trending-down';
          default: return 'fa-equals';
        }
      }

      function updateTrendAnalysis() {
        loadTrendAnalysis();
      }

      async function generateTrendReport() {
        try {
          const timeRange = document.getElementById('timeRange').value;
          const response = await fetch(\`/api/ml-analytics/trends/report?days=\${timeRange}\`, {
            method: 'POST'
          });
          
          if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = \`trend-analysis-\${new Date().toISOString().split('T')[0]}.pdf\`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
          } else {
            throw new Error('Failed to generate report');
          }
        } catch (error) {
          console.error('Error generating report:', error);
          alert('Error generating trend report');
        }
      }
    </script>
  `;

  return c.html(baseLayout('Trend Analysis - ML Analytics', content, user));
});

// Anomaly Detection Page
mlAnalyticsRoutes.get('/anomalies', requirePermission('analytics:view'), async (c) => {
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
                <i class="fas fa-search mr-3 text-red-600"></i>
                Anomaly Detection
              </h1>
              <p class="mt-2 max-w-4xl text-lg text-gray-500">
                AI-powered detection of unusual patterns and potential security threats
              </p>
            </div>
            <div class="flex space-x-3">
              <button onclick="runAnomalyDetection()" class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700">
                <i class="fas fa-play mr-2"></i>
                Run Detection
              </button>
            </div>
          </div>
        </div>

        <!-- Detection Status -->
        <div class="px-4 py-5 sm:px-6">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">High Risk Anomalies</dt>
                      <dd class="text-lg font-medium text-gray-900" id="high-risk-count">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-exclamation-circle text-yellow-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Medium Risk Anomalies</dt>
                      <dd class="text-lg font-medium text-gray-900" id="medium-risk-count">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-5">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-info-circle text-blue-500 text-2xl"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">Low Risk Anomalies</dt>
                      <dd class="text-lg font-medium text-gray-900" id="low-risk-count">Loading...</dd>
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
                      <dt class="text-sm font-medium text-gray-500 truncate">Last Scan</dt>
                      <dd class="text-lg font-medium text-gray-900" id="last-scan-time">Loading...</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Anomaly Detection Chart -->
          <div class="bg-white shadow rounded-lg mb-8">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Anomaly Detection Timeline</h3>
              <div class="h-64">
                <canvas id="anomalyChart" width="400" height="200"></canvas>
              </div>
            </div>
          </div>

          <!-- Anomaly List -->
          <div class="bg-white shadow rounded-lg">
            <div class="px-4 py-5 sm:p-6">
              <div class="flex items-center justify-between mb-4">
                <h3 class="text-lg leading-6 font-medium text-gray-900">Detected Anomalies</h3>
                <div class="flex space-x-2">
                  <select id="severityFilter" onchange="filterAnomalies()" class="border border-gray-300 rounded-md px-3 py-1 text-sm">
                    <option value="">All Severities</option>
                    <option value="high">High Risk</option>
                    <option value="medium">Medium Risk</option>
                    <option value="low">Low Risk</option>
                  </select>
                  <select id="statusFilter" onchange="filterAnomalies()" class="border border-gray-300 rounded-md px-3 py-1 text-sm">
                    <option value="">All Status</option>
                    <option value="new">New</option>
                    <option value="investigating">Investigating</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              </div>
              <div id="anomalies-list">
                <div class="text-center py-8">
                  <i class="fas fa-spinner fa-spin text-4xl text-gray-400"></i>
                  <p class="mt-4 text-lg text-gray-500">Loading anomalies...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script>
      let anomalyChart;
      let allAnomalies = [];
      
      document.addEventListener('DOMContentLoaded', function() {
        loadAnomalyData();
      });

      async function loadAnomalyData() {
        try {
          const response = await fetch('/api/ml-analytics/anomalies');
          const data = await response.json();
          
          updateAnomalyStatistics(data.statistics);
          updateAnomalyChart(data.chartData);
          displayAnomalies(data.anomalies);
          allAnomalies = data.anomalies;
        } catch (error) {
          console.error('Error loading anomaly data:', error);
        }
      }

      function updateAnomalyStatistics(stats) {
        document.getElementById('high-risk-count').textContent = stats.high || '0';
        document.getElementById('medium-risk-count').textContent = stats.medium || '0';
        document.getElementById('low-risk-count').textContent = stats.low || '0';
        document.getElementById('last-scan-time').textContent = stats.lastScan || 'Never';
      }

      function updateAnomalyChart(chartData) {
        if (anomalyChart) anomalyChart.destroy();

        const ctx = document.getElementById('anomalyChart').getContext('2d');
        anomalyChart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: chartData.labels || [],
            datasets: [{
              label: 'Anomalies Detected',
              data: chartData.data || [],
              borderColor: 'rgb(239, 68, 68)',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
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
      }

      function displayAnomalies(anomalies) {
        const container = document.getElementById('anomalies-list');
        
        if (anomalies.length === 0) {
          container.innerHTML = \`
            <div class="text-center py-8">
              <i class="fas fa-check-circle text-4xl text-green-400"></i>
              <p class="mt-4 text-lg text-green-600">No anomalies detected</p>
              <p class="text-sm text-gray-500">Your systems appear to be operating normally</p>
            </div>
          \`;
          return;
        }

        const html = \`
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Anomaly</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Confidence</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detected</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                \${anomalies.map(anomaly => \`
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">\${anomaly.title || 'Unnamed Anomaly'}</div>
                      <div class="text-sm text-gray-500">\${anomaly.description || 'No description'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${getSeverityClass(anomaly.severity)}">
                        \${anomaly.severity || 'unknown'}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">\${(anomaly.confidence || 0).toFixed(1)}%</td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium \${getStatusClass(anomaly.status)}">
                        \${anomaly.status || 'new'}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">\${new Date(anomaly.detected_at || Date.now()).toLocaleString()}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button onclick="viewAnomalyDetails('\${anomaly.id}')" class="text-blue-600 hover:text-blue-900">View</button>
                      <button onclick="investigateAnomaly('\${anomaly.id}')" class="text-yellow-600 hover:text-yellow-900">Investigate</button>
                      <button onclick="resolveAnomaly('\${anomaly.id}')" class="text-green-600 hover:text-green-900">Resolve</button>
                    </td>
                  </tr>
                \`).join('')}
              </tbody>
            </table>
          </div>
        \`;
        
        container.innerHTML = html;
      }

      function getSeverityClass(severity) {
        switch (severity?.toLowerCase()) {
          case 'high': return 'bg-red-100 text-red-800';
          case 'medium': return 'bg-yellow-100 text-yellow-800';
          case 'low': return 'bg-blue-100 text-blue-800';
          default: return 'bg-gray-100 text-gray-800';
        }
      }

      function getStatusClass(status) {
        switch (status?.toLowerCase()) {
          case 'new': return 'bg-red-100 text-red-800';
          case 'investigating': return 'bg-yellow-100 text-yellow-800';
          case 'resolved': return 'bg-green-100 text-green-800';
          default: return 'bg-gray-100 text-gray-800';
        }
      }

      function filterAnomalies() {
        const severityFilter = document.getElementById('severityFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        
        let filtered = allAnomalies;
        
        if (severityFilter) {
          filtered = filtered.filter(a => a.severity?.toLowerCase() === severityFilter);
        }
        
        if (statusFilter) {
          filtered = filtered.filter(a => a.status?.toLowerCase() === statusFilter);
        }
        
        displayAnomalies(filtered);
      }

      async function runAnomalyDetection() {
        try {
          const button = event.target;
          button.disabled = true;
          button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Running...';
          
          const response = await fetch('/api/ml-analytics/anomalies/detect', {
            method: 'POST'
          });
          
          if (response.ok) {
            await loadAnomalyData();
            showNotification('Anomaly detection completed successfully', 'success');
          } else {
            throw new Error('Detection failed');
          }
        } catch (error) {
          console.error('Error running anomaly detection:', error);
          showNotification('Error running anomaly detection', 'error');
        } finally {
          const button = document.querySelector('button[onclick="runAnomalyDetection()"]');
          button.disabled = false;
          button.innerHTML = '<i class="fas fa-play mr-2"></i>Run Detection';
        }
      }

      async function viewAnomalyDetails(anomalyId) {
        window.location.href = \`/analytics/anomalies/\${anomalyId}\`;
      }

      async function investigateAnomaly(anomalyId) {
        try {
          const response = await fetch(\`/api/ml-analytics/anomalies/\${anomalyId}/investigate\`, {
            method: 'POST'
          });
          
          if (response.ok) {
            await loadAnomalyData();
            showNotification('Anomaly marked for investigation', 'success');
          }
        } catch (error) {
          console.error('Error investigating anomaly:', error);
          showNotification('Error updating anomaly status', 'error');
        }
      }

      async function resolveAnomaly(anomalyId) {
        try {
          const response = await fetch(\`/api/ml-analytics/anomalies/\${anomalyId}/resolve\`, {
            method: 'POST'
          });
          
          if (response.ok) {
            await loadAnomalyData();
            showNotification('Anomaly resolved', 'success');
          }
        } catch (error) {
          console.error('Error resolving anomaly:', error);
          showNotification('Error updating anomaly status', 'error');
        }
      }

      function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = \`fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg \${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white\`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
          notification.remove();
        }, 3000);
      }
    </script>
  `;

  return c.html(baseLayout('Anomaly Detection - ML Analytics', content, user));
});

export { mlAnalyticsRoutes };