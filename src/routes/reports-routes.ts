import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { baseLayout } from '../templates/layout';
import { DatabaseService } from '../lib/database';
import type { CloudflareBindings } from '../types';

export function createReportsRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware
  app.use('*', requireAuth);
  
  // Main reports page
  app.get('/', async (c) => {
    const user = c.get('user');
    return c.html(
      baseLayout({
        title: 'Reports & Analytics',
        user,
        content: renderReportsPage()
      })
    );
  });
  
  // Generate risk report
  app.post('/generate/risk', async (c) => {
    const formData = await c.req.parseBody();
    const format = formData.format || 'pdf';
    
    try {
      // Generate report (mock implementation)
      const reportUrl = await generateRiskReport(format);
      return c.html(`
        <div class="bg-green-50 border-l-4 border-green-500 p-4">
          <div class="flex items-center">
            <i class="fas fa-check-circle text-green-500 mr-2"></i>
            <div>
              <p class="text-green-700 font-medium">Risk report generated successfully!</p>
              <a href="${reportUrl}" target="_blank" class="text-green-600 underline text-sm">Download Report</a>
            </div>
          </div>
        </div>
      `);
    } catch (error) {
      return c.html(`
        <div class="bg-red-50 border-l-4 border-red-500 p-4">
          <p class="text-red-700">Error generating report: ${error.message}</p>
        </div>
      `);
    }
  });
  
  // Generate compliance report
  app.post('/generate/compliance', async (c) => {
    const formData = await c.req.parseBody();
    const format = formData.format || 'pdf';
    
    try {
      const reportUrl = await generateComplianceReport(format);
      return c.html(`
        <div class="bg-green-50 border-l-4 border-green-500 p-4">
          <div class="flex items-center">
            <i class="fas fa-check-circle text-green-500 mr-2"></i>
            <div>
              <p class="text-green-700 font-medium">Compliance report generated successfully!</p>
              <a href="${reportUrl}" target="_blank" class="text-green-600 underline text-sm">Download Report</a>
            </div>
          </div>
        </div>
      `);
    } catch (error) {
      return c.html(`
        <div class="bg-red-50 border-l-4 border-red-500 p-4">
          <p class="text-red-700">Error generating report: ${error.message}</p>
        </div>
      `);
    }
  });
  
  // Generate incident report
  app.post('/generate/incident', async (c) => {
    const formData = await c.req.parseBody();
    const format = formData.format || 'pdf';
    
    try {
      const reportUrl = await generateIncidentReport(format);
      return c.html(`
        <div class="bg-green-50 border-l-4 border-green-500 p-4">
          <div class="flex items-center">
            <i class="fas fa-check-circle text-green-500 mr-2"></i>
            <div>
              <p class="text-green-700 font-medium">Incident report generated successfully!</p>
              <a href="${reportUrl}" target="_blank" class="text-green-600 underline text-sm">Download Report</a>
            </div>
          </div>
        </div>
      `);
    } catch (error) {
      return c.html(`
        <div class="bg-red-50 border-l-4 border-red-500 p-4">
          <p class="text-red-700">Error generating report: ${error.message}</p>
        </div>
      `);
    }
  });
  
  // Generate executive summary
  app.post('/generate/executive', async (c) => {
    const formData = await c.req.parseBody();
    const format = formData.format || 'pdf';
    
    try {
      const reportUrl = await generateExecutiveReport(format);
      return c.html(`
        <div class="bg-green-50 border-l-4 border-green-500 p-4">
          <div class="flex items-center">
            <i class="fas fa-check-circle text-green-500 mr-2"></i>
            <div>
              <p class="text-green-700 font-medium">Executive summary generated successfully!</p>
              <a href="${reportUrl}" target="_blank" class="text-green-600 underline text-sm">Download Report</a>
            </div>
          </div>
        </div>
      `);
    } catch (error) {
      return c.html(`
        <div class="bg-red-50 border-l-4 border-red-500 p-4">
          <p class="text-red-700">Error generating report: ${error.message}</p>
        </div>
      `);
    }
  });
  
  // Export current view
  app.get('/export/modal', async (c) => {
    return c.html(renderExportModal());
  });
  
  // Schedule report modal
  app.get('/schedule/modal', async (c) => {
    return c.html(renderScheduleModal());
  });
  
  // Schedule report
  app.post('/schedule', async (c) => {
    const formData = await c.req.parseBody();
    
    try {
      await scheduleReport(formData);
      return c.html(`
        <div class="bg-green-50 border-l-4 border-green-500 p-4">
          <p class="text-green-700">Report scheduled successfully!</p>
        </div>
        <script>
          setTimeout(() => {
            document.getElementById('modal-container').innerHTML = '';
          }, 2000);
        </script>
      `);
    } catch (error) {
      return c.html(`
        <div class="bg-red-50 border-l-4 border-red-500 p-4">
          <p class="text-red-700">Error scheduling report: ${error.message}</p>
        </div>
      `);
    }
  });
  
  // Dashboard analytics data
  app.get('/analytics/dashboard', async (c) => {
    const data = await getDashboardAnalytics();
    return c.json(data);
  });
  
  // Risk trend data
  app.get('/analytics/risk-trend', async (c) => {
    const period = c.req.query('period') || '30d';
    const data = await getRiskTrendData(period);
    return c.json(data);
  });
  
  // Compliance metrics
  app.get('/analytics/compliance', async (c) => {
    const data = await getComplianceMetrics();
    return c.json(data);
  });
  
  return app;
}

// Template functions
const renderReportsPage = () => html`
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex justify-between items-center">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
        <p class="text-gray-600 mt-1">Generate comprehensive reports and analyze platform data</p>
      </div>
    </div>
    
    <!-- Notification Area -->
    <div id="notification-area"></div>
    
    <!-- Report Categories -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- Risk Assessment Report -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center space-x-4 mb-4">
          <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Risk Assessment Report</h3>
            <p class="text-sm text-gray-600">Comprehensive risk analysis and metrics</p>
          </div>
        </div>
        <form hx-post="/reports/generate/risk" hx-target="#notification-area" hx-swap="innerHTML">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <select name="format" class="form-select">
              <option value="pdf">PDF Report</option>
              <option value="excel">Excel Spreadsheet</option>
            </select>
          </div>
          <button type="submit" class="w-full btn-primary">
            <i class="fas fa-file-pdf mr-2"></i>Generate Risk Report
          </button>
        </form>
      </div>
      
      <!-- Compliance Report -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center space-x-4 mb-4">
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-clipboard-check text-green-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Compliance Report</h3>
            <p class="text-sm text-gray-600">Compliance status and findings</p>
          </div>
        </div>
        <form hx-post="/reports/generate/compliance" hx-target="#notification-area" hx-swap="innerHTML">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <select name="format" class="form-select">
              <option value="pdf">PDF Report</option>
              <option value="excel">Excel Spreadsheet</option>
            </select>
          </div>
          <button type="submit" class="w-full btn-primary">
            <i class="fas fa-file-pdf mr-2"></i>Generate Compliance Report
          </button>
        </form>
      </div>
      
      <!-- Incident Report -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center space-x-4 mb-4">
          <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-bell text-orange-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Incident Report</h3>
            <p class="text-sm text-gray-600">Security incidents and response</p>
          </div>
        </div>
        <form hx-post="/reports/generate/incident" hx-target="#notification-area" hx-swap="innerHTML">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <select name="format" class="form-select">
              <option value="pdf">PDF Report</option>
              <option value="excel">Excel Spreadsheet</option>
            </select>
          </div>
          <button type="submit" class="w-full btn-primary">
            <i class="fas fa-file-pdf mr-2"></i>Generate Incident Report
          </button>
        </form>
      </div>
      
      <!-- Executive Summary -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center space-x-4 mb-4">
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-chart-bar text-blue-600 text-xl"></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Executive Summary</h3>
            <p class="text-sm text-gray-600">High-level overview for leadership</p>
          </div>
        </div>
        <form hx-post="/reports/generate/executive" hx-target="#notification-area" hx-swap="innerHTML">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <select name="format" class="form-select">
              <option value="pdf">PDF Report</option>
              <option value="excel">Excel Spreadsheet</option>
            </select>
          </div>
          <button type="submit" class="w-full btn-primary">
            <i class="fas fa-file-pdf mr-2"></i>Generate Executive Summary
          </button>
        </form>
      </div>
    </div>
    
    <!-- Quick Actions -->
    <div class="bg-white rounded-lg shadow p-6">
      <h4 class="font-medium text-gray-900 mb-4">Quick Actions</h4>
      <div class="flex flex-wrap gap-3">
        <button 
          hx-get="/reports/export/modal"
          hx-target="#modal-container"
          hx-swap="innerHTML"
          class="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium">
          <i class="fas fa-download mr-2"></i>Export Current View
        </button>
        <button 
          hx-get="/reports/schedule/modal"
          hx-target="#modal-container"
          hx-swap="innerHTML"
          class="px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium">
          <i class="fas fa-calendar mr-2"></i>Schedule Report
        </button>
        <button class="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-sm font-medium">
          <i class="fas fa-share mr-2"></i>Share Report
        </button>
      </div>
    </div>
    
    <!-- Analytics Dashboard -->
    <div class="bg-white rounded-lg shadow p-6">
      <h4 class="font-medium text-gray-900 mb-4">Analytics Dashboard</h4>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Risk Trend Chart -->
        <div>
          <h5 class="text-sm font-medium text-gray-700 mb-3">Risk Trend (Last 30 Days)</h5>
          <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <canvas id="risk-trend-chart"></canvas>
          </div>
        </div>
        
        <!-- Compliance Status Chart -->
        <div>
          <h5 class="text-sm font-medium text-gray-700 mb-3">Compliance Status</h5>
          <div class="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <canvas id="compliance-chart"></canvas>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Chart.js Integration -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script>
    // Load analytics data and render charts
    document.addEventListener('DOMContentLoaded', function() {
      loadRiskTrendChart();
      loadComplianceChart();
    });
    
    function loadRiskTrendChart() {
      fetch('/reports/analytics/risk-trend')
        .then(response => response.json())
        .then(data => {
          const ctx = document.getElementById('risk-trend-chart').getContext('2d');
          new Chart(ctx, {
            type: 'line',
            data: {
              labels: data.labels,
              datasets: [{
                label: 'Total Risks',
                data: data.total,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.1
              }, {
                label: 'Critical Risks',
                data: data.critical,
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                tension: 0.1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'top',
                }
              }
            }
          });
        });
    }
    
    function loadComplianceChart() {
      fetch('/reports/analytics/compliance')
        .then(response => response.json())
        .then(data => {
          const ctx = document.getElementById('compliance-chart').getContext('2d');
          new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: data.labels,
              datasets: [{
                data: data.values,
                backgroundColor: [
                  'rgb(34, 197, 94)',
                  'rgb(249, 115, 22)',
                  'rgb(239, 68, 68)',
                  'rgb(156, 163, 175)'
                ]
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'right',
                }
              }
            }
          });
        });
    }
  </script>
`;

const renderExportModal = () => html`
  <div id="export-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <div class="flex justify-between items-center pb-4 border-b">
          <h3 class="text-lg font-medium text-gray-900">Export Report</h3>
          <button onclick="document.getElementById('modal-container').innerHTML = ''" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <div class="mt-6 space-y-6">
          <!-- Export Format Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="relative">
                <input type="radio" id="export-pdf" name="exportFormat" value="pdf" class="sr-only" checked>
                <label for="export-pdf" class="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors duration-200">
                  <div class="flex items-center">
                    <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                      <i class="fas fa-file-pdf text-red-600 text-xl"></i>
                    </div>
                    <div>
                      <div class="font-medium text-gray-900">PDF Report</div>
                      <div class="text-sm text-gray-500">Professional formatted document with charts</div>
                    </div>
                  </div>
                </label>
              </div>
              
              <div class="relative">
                <input type="radio" id="export-excel" name="exportFormat" value="excel" class="sr-only">
                <label for="export-excel" class="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 transition-colors duration-200">
                  <div class="flex items-center">
                    <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                      <i class="fas fa-file-excel text-green-600 text-xl"></i>
                    </div>
                    <div>
                      <div class="font-medium text-gray-900">Excel Spreadsheet</div>
                      <div class="text-sm text-gray-500">Raw data for analysis and manipulation</div>
                    </div>
                  </div>
                </label>
              </div>
            </div>
          </div>
          
          <!-- Report Content Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">Include in Report</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input type="checkbox" name="includeCharts" checked class="form-checkbox">
                <span class="ml-2 text-sm text-gray-700">Charts and visualizations</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" name="includeData" checked class="form-checkbox">
                <span class="ml-2 text-sm text-gray-700">Raw data tables</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" name="includeSummary" checked class="form-checkbox">
                <span class="ml-2 text-sm text-gray-700">Executive summary</span>
              </label>
            </div>
          </div>
          
          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="btn-secondary">
              Cancel
            </button>
            <button type="button" class="btn-primary">
              Export Report
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

const renderScheduleModal = () => html`
  <div id="schedule-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <div class="flex justify-between items-center pb-4 border-b">
          <h3 class="text-lg font-medium text-gray-900">Schedule Report</h3>
          <button onclick="document.getElementById('modal-container').innerHTML = ''" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <form hx-post="/reports/schedule" hx-target="#modal-container" hx-swap="innerHTML" class="mt-6 space-y-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select name="reportType" required class="form-select">
              <option value="">Select report type</option>
              <option value="risk">Risk Assessment Report</option>
              <option value="compliance">Compliance Report</option>
              <option value="incident">Incident Report</option>
              <option value="executive">Executive Summary</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
            <select name="frequency" required class="form-select">
              <option value="">Select frequency</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
            <textarea name="recipients" required class="form-input" rows="3" placeholder="Enter email addresses (one per line)"></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <input type="date" name="startDate" required class="form-input">
          </div>
          
          <div class="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onclick="document.getElementById('modal-container').innerHTML = ''" class="btn-secondary">
              Cancel
            </button>
            <button type="submit" class="btn-primary">
              Schedule Report
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
`;

// Data functions (mock implementations)
async function generateRiskReport(format: string) {
  // Mock report generation - in production, this would generate actual reports
  const reportId = `risk-report-${Date.now()}`;
  const reportUrl = `/api/reports/download/${reportId}.${format}`;
  return reportUrl;
}

async function generateComplianceReport(format: string) {
  const reportId = `compliance-report-${Date.now()}`;
  const reportUrl = `/api/reports/download/${reportId}.${format}`;
  return reportUrl;
}

async function generateIncidentReport(format: string) {
  const reportId = `incident-report-${Date.now()}`;
  const reportUrl = `/api/reports/download/${reportId}.${format}`;
  return reportUrl;
}

async function generateExecutiveReport(format: string) {
  const reportId = `executive-report-${Date.now()}`;
  const reportUrl = `/api/reports/download/${reportId}.${format}`;
  return reportUrl;
}

async function scheduleReport(data: any) {
  // Mock scheduling - in production, this would set up actual scheduled reports
  return true;
}

async function getDashboardAnalytics() {
  return {
    totalRisks: 45,
    criticalRisks: 8,
    complianceScore: 78,
    openIncidents: 3
  };
}

async function getRiskTrendData(period: string) {
  // Mock trend data
  return {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    total: [42, 45, 43, 45],
    critical: [6, 8, 7, 8]
  };
}

async function getComplianceMetrics() {
  return {
    labels: ['Compliant', 'Partially Compliant', 'Non-Compliant', 'Not Assessed'],
    values: [65, 20, 10, 5]
  };
}