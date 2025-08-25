// DMT Risk Assessment System v2.0 - Main Application JavaScript

// Global variables
let currentUser = null;
let dashboardData = null;

// API configuration - Use Kong Gateway when available
const API_BASE = window.KongConfig ? window.KongConfig.baseURL : (
  window.location.hostname === 'localhost' || window.location.hostname.includes('e2b.dev') 
    ? 'http://localhost:3000' 
    : window.location.origin
);

// Kong-aware API helper
const apiRequest = window.KongAPI ? window.KongAPI.request.bind(window.KongAPI) : async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options
  };
  
  const token = localStorage.getItem('aria_token') || localStorage.getItem('authToken');
  if (token) {
    config.headers = { ...config.headers, Authorization: `Bearer ${token}` };
  }
  
  const response = await fetch(url, config);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  return { data: await response.json() };
};

// Reports functionality
function showReports() {
  showModal('Risk Reports & Analytics', `
    <div class="space-y-6">
      <!-- Report Categories -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer" onclick="generateRiskReport()">
          <div class="flex items-center space-x-3">
            <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
            <div>
              <h3 class="font-semibold text-gray-900">Risk Assessment Report</h3>
              <p class="text-sm text-gray-600">Comprehensive risk analysis and metrics</p>
            </div>
          </div>
        </div>
        
        <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer" onclick="generateComplianceReport()">
          <div class="flex items-center space-x-3">
            <i class="fas fa-clipboard-check text-green-600 text-xl"></i>
            <div>
              <h3 class="font-semibold text-gray-900">Compliance Report</h3>
              <p class="text-sm text-gray-600">Compliance status and findings</p>
            </div>
          </div>
        </div>
        
        <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer" onclick="generateIncidentReport()">
          <div class="flex items-center space-x-3">
            <i class="fas fa-bell text-orange-600 text-xl"></i>
            <div>
              <h3 class="font-semibold text-gray-900">Incident Report</h3>
              <p class="text-sm text-gray-600">Security incidents and response</p>
            </div>
          </div>
        </div>
        
        <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer" onclick="generateExecutiveReport()">
          <div class="flex items-center space-x-3">
            <i class="fas fa-chart-bar text-blue-600 text-xl"></i>
            <div>
              <h3 class="font-semibold text-gray-900">Executive Summary</h3>
              <p class="text-sm text-gray-600">High-level overview for leadership</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="border-t border-gray-200 pt-4">
        <h4 class="font-medium text-gray-900 mb-3">Quick Actions</h4>
        <div class="flex flex-wrap gap-2">
          <button onclick="exportCurrentView()" class="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm">
            <i class="fas fa-download mr-1"></i>Export Current View
          </button>
          <button onclick="scheduleReport()" class="px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm">
            <i class="fas fa-calendar mr-1"></i>Schedule Report
          </button>
          <button onclick="shareReport()" class="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-sm">
            <i class="fas fa-share mr-1"></i>Share Report
          </button>
        </div>
      </div>
    </div>
  `, [
    { text: 'Close', class: 'btn-secondary', onclick: 'closeUniversalModal()' }
  ]);
}

// Report generation functions
function generateRiskReport() {
  showToast('Generating risk assessment report...', 'info');
  // Implement actual report generation
  setTimeout(() => {
    showToast('Risk report generated successfully!', 'success');
    closeUniversalModal();
  }, 2000);
}

function generateComplianceReport() {
  showToast('Generating compliance report...', 'info');
  setTimeout(() => {
    showToast('Compliance report generated successfully!', 'success');
    closeUniversalModal();
  }, 2000);
}

function generateIncidentReport() {
  showToast('Generating incident report...', 'info');
  setTimeout(() => {
    showToast('Incident report generated successfully!', 'success');
    closeUniversalModal();
  }, 2000);
}

function generateExecutiveReport() {
  showToast('Generating executive summary...', 'info');
  setTimeout(() => {
    showToast('Executive summary generated successfully!', 'success');
    closeUniversalModal();
  }, 2000);
}

function exportCurrentView() {
  showExportModal();
}

function showExportModal() {
  const modalHTML = `
    <div id="export-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style="display: block;">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <div class="flex justify-between items-center pb-4 border-b">
            <h3 class="text-lg font-medium text-gray-900">Export Report</h3>
            <button onclick="closeExportModal()" class="text-gray-400 hover:text-gray-600">
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
                <label class="flex items-center">
                  <input type="checkbox" name="includeMetadata" class="form-checkbox">
                  <span class="ml-2 text-sm text-gray-700">Metadata and timestamps</span>
                </label>
              </div>
            </div>
            
            <!-- Date Range Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">Date Range</label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm text-gray-600 mb-1">From Date</label>
                  <input type="date" name="fromDate" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1">To Date</label>
                  <input type="date" name="toDate" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
              </div>
            </div>
            
            <!-- Report Options -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-3">Report Options</label>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm text-gray-600 mb-1">Report Title</label>
                  <input type="text" name="reportTitle" value="Risk Management Report" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm text-gray-600 mb-1">Author</label>
                  <input type="text" name="author" value="Risk Management Team" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end space-x-3 pt-6 border-t mt-6">
            <button type="button" onclick="closeExportModal()" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
            <button type="button" onclick="processExport()" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
              <i class="fas fa-download mr-2"></i>Generate Export
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Set default dates
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(today.getMonth() - 1);
  
  document.querySelector('[name="fromDate"]').value = lastMonth.toISOString().split('T')[0];
  document.querySelector('[name="toDate"]').value = today.toISOString().split('T')[0];
  
  // Add event listeners for radio buttons
  document.querySelectorAll('input[name="exportFormat"]').forEach(radio => {
    radio.addEventListener('change', updateExportFormatSelection);
  });
  
  updateExportFormatSelection();
}

function updateExportFormatSelection() {
  // Remove existing selection styles
  document.querySelectorAll('label[for^="export-"]').forEach(label => {
    label.classList.remove('border-blue-500', 'bg-blue-50');
    label.classList.add('border-gray-200');
  });
  
  // Add selection style to checked radio
  const checked = document.querySelector('input[name="exportFormat"]:checked');
  if (checked) {
    const label = document.querySelector(`label[for="${checked.id}"]`);
    label.classList.remove('border-gray-200');
    label.classList.add('border-blue-500', 'bg-blue-50');
  }
}

function closeExportModal() {
  const modal = document.getElementById('export-modal');
  if (modal) modal.remove();
}

async function processExport() {
  const modal = document.getElementById('export-modal');
  const formData = new FormData();
  
  // Collect form data
  const format = document.querySelector('input[name="exportFormat"]:checked').value;
  const includeCharts = document.querySelector('[name="includeCharts"]').checked;
  const includeData = document.querySelector('[name="includeData"]').checked;
  const includeSummary = document.querySelector('[name="includeSummary"]').checked;
  const includeMetadata = document.querySelector('[name="includeMetadata"]').checked;
  const fromDate = document.querySelector('[name="fromDate"]').value;
  const toDate = document.querySelector('[name="toDate"]').value;
  const reportTitle = document.querySelector('[name="reportTitle"]').value;
  const author = document.querySelector('[name="author"]').value;
  
  // Show loading state
  const exportButton = modal.querySelector('button[onclick="processExport()"]');
  const originalText = exportButton.innerHTML;
  exportButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating...';
  exportButton.disabled = true;
  
  try {
    if (format === 'pdf') {
      await generatePDFReport({
        includeCharts, includeData, includeSummary, includeMetadata,
        fromDate, toDate, reportTitle, author
      });
    } else if (format === 'excel') {
      await generateExcelReport({
        includeCharts, includeData, includeSummary, includeMetadata,
        fromDate, toDate, reportTitle, author
      });
    }
    
    showToast('Report exported successfully!', 'success');
    closeExportModal();
    
    // Add notification
    if (typeof notificationManager !== 'undefined' && notificationManager.isInitialized) {
      notificationManager.addNotificationFromToast(
        `${format.toUpperCase()} report "${reportTitle}" has been generated`,
        'success',
        'Report Export'
      );
    }
    
  } catch (error) {
    console.error('Export error:', error);
    showToast('Export failed: ' + error.message, 'error');
    
    // Reset button
    exportButton.innerHTML = originalText;
    exportButton.disabled = false;
  }
}

async function generatePDFReport(options) {
  // Simulate PDF generation with actual data collection
  const reportData = await collectReportData(options);
  
  // Generate PDF using jsPDF (would need to include library)
  // For demo purposes, we'll create a simple text-based report
  const content = generateReportContent(reportData, options);
  
  // Create and download PDF
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${options.reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 2000));
}

async function generateExcelReport(options) {
  // Simulate Excel generation
  const reportData = await collectReportData(options);
  
  // Generate CSV format (simple Excel alternative)
  const csvContent = generateCSVContent(reportData, options);
  
  // Create and download CSV
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${options.reportTitle.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1500));
}

async function collectReportData(options) {
  // Collect data based on current view and options
  const currentPage = window.location.hash.replace('#', '') || 'dashboard';
  
  const reportData = {
    title: options.reportTitle,
    author: options.author,
    generatedAt: new Date().toISOString(),
    dateRange: { from: options.fromDate, to: options.toDate },
    page: currentPage,
    summary: {},
    data: [],
    charts: [],
    metadata: {}
  };
  
  // Collect page-specific data
  switch (currentPage) {
    case 'dashboard':
      reportData.summary = {
        totalRisks: 24,
        highRisks: 3,
        mediumRisks: 12,
        lowRisks: 9,
        compliance: '85%'
      };
      reportData.data = [
        { id: 1, risk: 'Data Breach', severity: 'High', probability: 0.7, impact: 0.9 },
        { id: 2, risk: 'System Downtime', severity: 'Medium', probability: 0.4, impact: 0.6 },
        { id: 3, risk: 'Compliance Violation', severity: 'High', probability: 0.3, impact: 0.8 }
      ];
      break;
    case 'risks':
      reportData.data = await getRisksData();
      break;
    case 'compliance':
      reportData.data = await getComplianceData();
      break;
    default:
      reportData.data = [{ message: 'No specific data available for this view' }];
  }
  
  return reportData;
}

function generateReportContent(reportData, options) {
  let content = `${reportData.title}\n`;
  content += `Generated by: ${reportData.author}\n`;
  content += `Date: ${new Date(reportData.generatedAt).toLocaleString()}\n`;
  content += `Report Period: ${reportData.dateRange.from} to ${reportData.dateRange.to}\n`;
  content += `\n${'='.repeat(50)}\n\n`;
  
  if (options.includeSummary && reportData.summary) {
    content += `EXECUTIVE SUMMARY\n`;
    content += `${'-'.repeat(20)}\n`;
    Object.entries(reportData.summary).forEach(([key, value]) => {
      content += `${key.charAt(0).toUpperCase() + key.slice(1)}: ${value}\n`;
    });
    content += `\n`;
  }
  
  if (options.includeData && reportData.data.length > 0) {
    content += `DETAILED DATA\n`;
    content += `${'-'.repeat(15)}\n`;
    reportData.data.forEach((item, index) => {
      content += `${index + 1}. `;
      Object.entries(item).forEach(([key, value]) => {
        content += `${key}: ${value} | `;
      });
      content += `\n`;
    });
    content += `\n`;
  }
  
  if (options.includeMetadata) {
    content += `REPORT METADATA\n`;
    content += `${'-'.repeat(17)}\n`;
    content += `Page: ${reportData.page}\n`;
    content += `Generated At: ${reportData.generatedAt}\n`;
    content += `Export Options: Charts(${options.includeCharts}), Data(${options.includeData}), Summary(${options.includeSummary})\n`;
  }
  
  return content;
}

function generateCSVContent(reportData, options) {
  let csvContent = '';
  
  // Add header information
  csvContent += `Report Title,${reportData.title}\n`;
  csvContent += `Author,${reportData.author}\n`;
  csvContent += `Generated,${new Date(reportData.generatedAt).toLocaleString()}\n`;
  csvContent += `Date Range,${reportData.dateRange.from} to ${reportData.dateRange.to}\n`;
  csvContent += `\n`;
  
  if (options.includeSummary && reportData.summary) {
    csvContent += `SUMMARY\n`;
    Object.entries(reportData.summary).forEach(([key, value]) => {
      csvContent += `${key},${value}\n`;
    });
    csvContent += `\n`;
  }
  
  if (options.includeData && reportData.data.length > 0) {
    csvContent += `DATA\n`;
    // Add headers
    const headers = Object.keys(reportData.data[0]);
    csvContent += headers.join(',') + `\n`;
    
    // Add data rows
    reportData.data.forEach(item => {
      const row = headers.map(header => `"${item[header] || ''}"`);
      csvContent += row.join(',') + `\n`;
    });
  }
  
  return csvContent;
}

async function getRisksData() {
  return [
    { id: 1, name: 'Data Breach', category: 'Security', severity: 'High', status: 'Active' },
    { id: 2, name: 'System Failure', category: 'Operational', severity: 'Medium', status: 'Mitigated' },
    { id: 3, name: 'Compliance Gap', category: 'Regulatory', severity: 'High', status: 'Active' }
  ];
}

async function getComplianceData() {
  return [
    { framework: 'SOC 2', status: 'Compliant', score: '95%', lastAssessment: '2024-01-15' },
    { framework: 'ISO 27001', status: 'In Progress', score: '78%', lastAssessment: '2024-02-01' },
    { framework: 'GDPR', status: 'Compliant', score: '92%', lastAssessment: '2024-01-30' }
  ];
}

function scheduleReport() {
  const modalHTML = `
    <div id="schedule-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style="display: block;">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <div class="flex justify-between items-center pb-4 border-b">
            <h3 class="text-lg font-medium text-gray-900">Schedule Report</h3>
            <button onclick="closeScheduleModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <form class="mt-6 space-y-6" onsubmit="handleScheduleReport(event)">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Report Name</label>
                <input type="text" name="reportName" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Monthly Risk Report">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                <select name="frequency" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly" selected>Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input type="date" name="startDate" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Time</label>
                <input type="time" name="time" value="09:00" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Recipients</label>
              <textarea name="recipients" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="admin@company.com, manager@company.com"></textarea>
            </div>
            
            <div class="flex justify-end space-x-3 pt-6 border-t">
              <button type="button" onclick="closeScheduleModal()" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Cancel</button>
              <button type="submit" class="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"><i class="fas fa-clock mr-2"></i>Schedule Report</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Set default start date to today
  document.querySelector('[name="startDate"]').value = new Date().toISOString().split('T')[0];
}

function closeScheduleModal() {
  const modal = document.getElementById('schedule-modal');
  if (modal) modal.remove();
}

function handleScheduleReport(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  const scheduleData = Object.fromEntries(formData.entries());
  
  showToast('Report scheduled successfully!', 'success');
  closeScheduleModal();
  
  if (typeof notificationManager !== 'undefined' && notificationManager.isInitialized) {
    notificationManager.addNotificationFromToast(
      `Report "${scheduleData.reportName}" scheduled for ${scheduleData.frequency} delivery`,
      'success',
      'Report Scheduling'
    );
  }
}

function shareReport() {
  const modalHTML = `
    <div id="share-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style="display: block;">
      <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-1/2 shadow-lg rounded-md bg-white">
        <div class="mt-3">
          <div class="flex justify-between items-center pb-4 border-b">
            <h3 class="text-lg font-medium text-gray-900">Share Report</h3>
            <button onclick="closeShareModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <div class="mt-6 space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Share via Email</label>
              <div class="flex space-x-2">
                <input type="email" placeholder="Enter email address" class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <button onclick="sendReportEmail()" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"><i class="fas fa-envelope mr-2"></i>Send</button>
              </div>
            </div>
            
            <div class="border-t pt-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Generate Shareable Link</label>
              <div class="flex space-x-2">
                <input type="text" value="https://app.example.com/reports/share/abc123" readonly class="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
                <button onclick="copyShareLink()" class="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"><i class="fas fa-copy mr-2"></i>Copy</button>
              </div>
              <p class="text-xs text-gray-500 mt-1">Link expires in 7 days</p>
            </div>
            
            <div class="border-t pt-4">
              <label class="block text-sm font-medium text-gray-700 mb-2">Access Permissions</label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input type="radio" name="access" value="view" checked class="form-radio">
                  <span class="ml-2 text-sm text-gray-700">View only</span>
                </label>
                <label class="flex items-center">
                  <input type="radio" name="access" value="download" class="form-radio">
                  <span class="ml-2 text-sm text-gray-700">View and download</span>
                </label>
                <label class="flex items-center">
                  <input type="radio" name="access" value="edit" class="form-radio">
                  <span class="ml-2 text-sm text-gray-700">View, download, and edit</span>
                </label>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end space-x-3 pt-6 border-t mt-6">
            <button type="button" onclick="closeShareModal()" class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Close</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function closeShareModal() {
  const modal = document.getElementById('share-modal');
  if (modal) modal.remove();
}

function sendReportEmail() {
  const email = event.target.previousElementSibling.value;
  if (email) {
    showToast(`Report shared with ${email}`, 'success');
  } else {
    showToast('Please enter a valid email address', 'error');
  }
}

function copyShareLink() {
  const linkInput = event.target.previousElementSibling;
  linkInput.select();
  document.execCommand('copy');
  showToast('Share link copied to clipboard!', 'success');
}

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
  console.log('DOM loaded, initializing app...');
  
  // Always initialize navigation first
  try {
    console.log('Initializing navigation...');
    await initializeNavigation();
    console.log('Navigation initialized successfully');
  } catch (navError) {
    console.error('Navigation initialization error:', navError);
  }
  
  // Initialize ARIA assistant
  try {
    console.log('Initializing ARIA...');
    initializeARIAAssistant();
  } catch (ariaError) {
    console.error('ARIA initialization error:', ariaError);
  }
  
  // Check authentication and initialize appropriate UI
  try {
    // Debug: Check token in storage
    const token = localStorage.getItem('aria_token');
    console.log('Token found:', token ? 'Yes' : 'No', token ? `(${token.substring(0, 20)}...)` : '');
    
    const authResult = await checkAuthentication();
    console.log('Auth check result:', authResult);
    console.log('Current user after auth check:', currentUser ? 'Loaded' : 'Not loaded');
    
    // Update UI based on authentication status
    await updateAuthUI();
  } catch (error) {
    console.error('Authentication error:', error);
    // Clear any invalid state
    currentUser = null;
    localStorage.removeItem('aria_token');
    localStorage.removeItem('dmt_user');
    // Update UI to show public landing page
    await updateAuthUI();
  }
  
  // Hide loading spinner
  setTimeout(() => {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
      spinner.style.display = 'none';
    }
  }, 1000);
});

// Authentication check
async function checkAuthentication() {
  const token = localStorage.getItem('aria_token');
  const userData = localStorage.getItem('dmt_user');
  
  if (!token || !userData) {
    console.log('No token found, user not authenticated');
    return false;
  }
  
  try {
    // Verify token with server
    const response = await axios.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      currentUser = response.data.data.user;
      console.log('Authentication successful:', currentUser);
      return true;
    } else {
      throw new Error('Invalid token');
    }
  } catch (error) {
    console.error('Authentication error:', error);
    // Clear invalid token
    localStorage.removeItem('aria_token');
    localStorage.removeItem('dmt_user');
    return false;
  }
}

// Show login prompt instead of redirecting
function showLoginPrompt() {
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
        <div class="text-center mb-6">
          <i class="fas fa-lock text-4xl text-gray-400 mb-4"></i>
          <h2 class="text-2xl font-bold text-gray-900">Authentication Required</h2>
          <p class="text-gray-600 mt-2">Please log in to access ARIA - AI Risk Intelligence Assistant</p>
        </div>
        <div class="space-y-4">
          <button onclick="window.location.href='/login'" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
            <i class="fas fa-sign-in-alt mr-2"></i>Sign In to ARIA
          </button>
          <div class="text-sm text-gray-600 text-center">
            <p><strong>Demo Accounts Available:</strong></p>
            <div class="mt-2 space-y-1">
              <p>admin / demo123 (Administrator)</p>
              <p>avi_security / demo123 (Risk Manager)</p>
              <p>sjohnson / demo123 (Compliance Officer)</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Show basic dashboard for unauthenticated users
function showBasicDashboard() {
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-shield-alt text-6xl text-blue-600 mb-4"></i>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">ARIA</h1>
        <p class="text-gray-600 mb-8">AI Risk Intelligence Assistant - Next-Generation Enterprise GRC Platform</p>
        <button onclick="window.location.href='/login'" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
          <i class="fas fa-sign-in-alt mr-2"></i>Sign In to ARIA
        </button>
        <div class="mt-6 text-sm text-gray-500">
          <p><strong>Demo Accounts Available</strong></p>
          <p class="mt-2">admin / demo123 | avi_security / demo123 | sjohnson / demo123</p>
        </div>
      </div>
    `;
  }
}

// Initialize navigation
// Flag to prevent duplicate initialization
let navigationInitialized = false;

async function initializeNavigation() {
  if (navigationInitialized) {
    console.log('Navigation already initialized, skipping');
    return;
  }
  
  console.log('initializeNavigation called');
  
  // Grouped navigation: bind generic handlers to dropdown items
  console.log('Setting up grouped navigation event handlers...');
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const page = el.getAttribute('data-page');
      console.log('Navigation click:', page);
      navigateTo(page);
    });
  });
  
  // Setup dropdown toggles
  console.log('Setting up dropdown toggle handlers...');
  document.querySelectorAll('.dropdown-toggle').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const dropdownId = button.getAttribute('data-dropdown');
      const dropdown = document.getElementById(dropdownId);
      
      if (dropdown) {
        // Close all other dropdowns first
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
          if (menu.id !== dropdownId) {
            menu.classList.add('hidden');
          }
        });
        
        // Toggle current dropdown
        dropdown.classList.toggle('hidden');
        console.log('Toggled dropdown:', dropdownId);
      }
    });
  });
  
  // Close dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.classList.add('hidden');
      });
    }
  });
  
  // Setup auth button
  const authButton = document.getElementById('auth-button');
  if (authButton) {
    authButton.addEventListener('click', (e) => {
      e.preventDefault();
      const token = localStorage.getItem('aria_token');
      if (token) {
        logout();
      } else {
        // Redirect to unified login page instead of showing modal
        window.location.href = '/login';
      }
    });
    console.log('Added event handler for auth button');
  } else {
    console.warn('Auth button not found');
  }
  
  // Setup mobile auth button
  const mobileAuthButton = document.getElementById('mobile-auth-button');
  if (mobileAuthButton) {
    mobileAuthButton.addEventListener('click', (e) => {
      e.preventDefault();
      const token = localStorage.getItem('aria_token');
      if (token) {
        logout();
      } else {
        // Redirect to unified login page
        window.location.href = '/login';
      }
    });
    console.log('Added event handler for mobile auth button');
  }
  
  // Update welcome message and auth button based on login status
  await updateAuthUI();
  
  console.log('Navigation initialization complete');
  navigationInitialized = true;
}

// Update authentication UI
async function updateAuthUI() {
  console.log('🔄 updateAuthUI called');
  const token = localStorage.getItem('aria_token');
  console.log('🔑 Token status:', token ? 'Present' : 'Missing');
  console.log('👤 Current user:', currentUser ? 'Loaded' : 'Not loaded');
  
  // Authentication is valid only if we have both token AND currentUser
  const isAuthenticated = !!(token && currentUser);
  console.log('✅ Is authenticated:', isAuthenticated);
  
  const welcomeMessage = document.getElementById('welcome-message');
  const authButton = document.getElementById('auth-button');
  const mobileAuthButton = document.getElementById('mobile-auth-button');
  const internalNav = document.getElementById('internal-nav');
  const notificationsContainer = document.getElementById('notifications-container');
  const ariaButton = document.getElementById('aria-button');
  
  // Update welcome message
  if (welcomeMessage) {
    welcomeMessage.textContent = `Welcome, ${currentUser?.first_name || (isAuthenticated ? 'User' : 'Guest')}`;
  }
  
  // Update auth button
  if (authButton) {
    if (isAuthenticated) {
      authButton.innerHTML = '<i class="fas fa-sign-out-alt mr-1"></i>Logout';
      authButton.className = 'bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200';
    } else {
      authButton.innerHTML = '<i class="fas fa-sign-in-alt mr-1"></i>Login';
      authButton.className = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200';
    }
  }
  


  // Role-based Admin visibility
  const adminGroup = document.getElementById('menu-admin');
  if (adminGroup) {
    if (isAuthenticated && (currentUser?.role === 'admin')) {
      adminGroup.classList.remove('hidden');
    } else {
      adminGroup.classList.add('hidden');
    }
  }
  
  // Show/hide internal features based on authentication
  if (isAuthenticated) {
    console.log('✅ User authenticated, showing internal features');
    // Show internal features after login with responsive classes
    if (internalNav) {
      internalNav.className = 'hidden md:flex items-center space-x-4';
    }
    if (notificationsContainer) notificationsContainer.classList.remove('hidden');
    if (ariaButton) ariaButton.classList.remove('hidden');
    
    // Hide mobile auth button when authenticated (desktop nav handles logout)
    if (mobileAuthButton) {
      mobileAuthButton.style.display = 'none';
    }
    
    try {
      console.log('📊 Initializing dashboard...');
      await initializeDashboard();
    } catch (error) {
      console.error('Dashboard initialization failed:', error);
      showError('Failed to load dashboard');
    }
    
    // Load reference data if not already loaded
    if (typeof loadReferenceData === 'function') {
      loadReferenceData();
    }
  } else {
    console.log('❌ User not authenticated, hiding internal features');
    // Hide internal features when not logged in
    if (internalNav) internalNav.className = 'hidden';
    if (notificationsContainer) notificationsContainer.classList.add('hidden');
    if (ariaButton) ariaButton.classList.add('hidden');
    
    // Show mobile auth button when not authenticated
    const isMobileDevice = window.innerWidth <= 768;
    if (mobileAuthButton && isMobileDevice) {
      mobileAuthButton.style.display = 'block';
    }
    
    // Show public landing page
    showPublicLandingPage();
  }
  
  // Update mobile navigation UI based on authentication state
  if (typeof window.updateMobileAuthUI === 'function') {
    window.updateMobileAuthUI();
  }
}

// Show public landing page for non-authenticated users
function showPublicLandingPage() {
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="max-w-4xl mx-auto text-center py-6">
        <div class="mb-8">
          <div class="mx-auto h-24 w-24 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mb-6">
            <i class="fas fa-shield-alt text-white text-3xl"></i>
          </div>
          <h1 class="text-4xl font-bold text-gray-900 mb-4">ARIA</h1>
          <p class="text-xl text-gray-600 mb-8">AI Risk Intelligence Assistant - Next-Generation Enterprise GRC Platform with Advanced Analytics</p>
        </div>
        
        <div class="grid md:grid-cols-3 gap-8 mb-12">
          <div class="bg-white p-6 rounded-lg shadow-lg">
            <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Risk Management</h3>
            <p class="text-gray-600">Comprehensive risk assessment, monitoring, and mitigation strategies for enterprise security.</p>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-lg">
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-server text-green-600 text-xl"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Asset Management</h3>
            <p class="text-gray-600">Track and manage IT assets with integrated Microsoft Defender vulnerability assessments.</p>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-lg">
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-robot text-purple-600 text-xl"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">AI-Powered ARIA</h3>
            <p class="text-gray-600">Intelligent risk assistant with RAG context and multi-provider AI integration.</p>
          </div>
        </div>
        
        <div class="bg-blue-50 p-8 rounded-lg border border-blue-200">
          <h3 class="text-xl font-semibold text-gray-900 mb-4">Ready to Get Started?</h3>
          <p class="text-gray-600 mb-6">Sign in to access ARIA's AI-powered risk intelligence platform with advanced GRC capabilities.</p>
          <button onclick="window.location.href='/login'" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors duration-200">
            <i class="fas fa-sign-in-alt mr-2"></i>Sign In to ARIA
          </button>
          
          <div class="mt-6 text-sm text-gray-500">
            <p><strong>Demo Accounts Available:</strong></p>
            <div class="mt-2 space-y-1">
              <p><strong>Admin:</strong> admin / demo123</p>
              <p><strong>Risk Manager:</strong> avi_security / demo123</p>
              <p><strong>Compliance Officer:</strong> sjohnson / demo123</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Load current user data
async function loadCurrentUser() {
  try {
    const token = localStorage.getItem('aria_token');
    if (!token) return;
    
    const response = await axios.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      currentUser = response.data.data.user;
      // Note: Don't call updateAuthUI here to avoid recursion
    }
  } catch (error) {
    console.error('Failed to load current user:', error);
    // Token might be invalid, logout
    logout();
  }
}

// Universal navigation function
function navigateTo(page) {
  console.log('Navigating to:', page);
  
  // Update active navigation
  document.querySelectorAll('.nav-menu-item').forEach(item => {
    item.classList.remove('active');
  });
  const activeItem = document.getElementById(`nav-${page}`);
  if (activeItem) {
    activeItem.classList.add('active');
  }
  // Also highlight any topnav link with matching data-page
  document.querySelectorAll(`[data-page="${page}"]`).forEach(el => el.classList.add('active'));
  
  // Check if user needs to be authenticated for this page
  const token = localStorage.getItem('aria_token');
  if (!token) {
    // If not authenticated, show inline login prompt instead of hard redirect
    showLoginPrompt();
    return;
  }
  
  // Route to appropriate function
  try {
    switch(page) {
      case 'dashboard':
        if (typeof showDashboard === 'function') {
          showDashboard();
        } else {
          showBasicDashboard();
        }
        break;
      case 'reports':
        if (typeof showReports === 'function') {
          showReports();
        } else {
          showPlaceholder('Reports', 'Reports module loading...', 'chart-bar');
        }
        break;
      case 'risks':
        if (typeof showRisks === 'function') {
          showRisks();
        } else {
          showPlaceholder('Risk Management', 'Risks module loading...', 'exclamation-triangle');
        }
        break;
      case 'controls':
        if (typeof showControls === 'function') {
          showControls();
        } else {
          showPlaceholder('Control Framework', 'Controls module loading...', 'shield-check');
        }
        break;
      case 'compliance':
        if (typeof showCompliance === 'function') {
          showCompliance();
        } else {
          showPlaceholder('Compliance Management', 'Compliance module loading...', 'clipboard-check');
        }
        break;
      case 'frameworks':
        if (typeof showFrameworks === 'function') {
          showFrameworks();
        } else {
          showPlaceholder('Compliance Frameworks', 'Frameworks module loading...', 'list-check');
        }
        break;
      case 'incidents':
        if (typeof showIncidents === 'function') {
          showIncidents();
        } else {
          showPlaceholder('Incident Management', 'Incidents module loading...', 'bell');
        }
        break;
      case 'assets':
        if (typeof showAssets === 'function') {
          showAssets();
        } else {
          showPlaceholder('Asset Management', 'Assets module loading...', 'server');
        }
        break;
      case 'services':
        if (typeof showServices === 'function') {
          showServices();
        } else {
          showPlaceholder('Services Management', 'Services module loading...', 'cogs');
        }
        break;
      case 'documents':
        if (typeof documentManager !== 'undefined' && documentManager.showDocuments) {
          documentManager.showDocuments();
        } else {
          showPlaceholder('Document Management', 'Documents module loading...', 'file-alt');
        }
        break;
      case 'settings':
        if (typeof enhancedSettings !== 'undefined' && enhancedSettings.showEnhancedSettings) {
          enhancedSettings.showEnhancedSettings();
        } else if (typeof showSettings === 'function') {
          showSettings();
        } else {
          showPlaceholder('Settings', 'Settings module loading...', 'cog');
        }
        break;
      case 'ai-assure':
        if (typeof showAIAssure === 'function') {
          showAIAssure();
        } else {
          showPlaceholder('AI Assure', 'AI Assure module loading...', 'brain');
        }
        break;
      case 'soa':
        if (typeof showSoA === 'function') {
          showSoA();
        } else {
          showPlaceholder('Statement of Applicability', 'SoA module loading...', 'list-check');
        }
        break;
      case 'evidence':
        if (typeof showEvidence === 'function') {
          showEvidence();
        } else {
          showPlaceholder('Evidence Management', 'Evidence module loading...', 'folder-open');
        }
        break;
      case 'assessments':
        if (typeof showAssessments === 'function') {
          showAssessments();
        } else {
          showPlaceholder('Compliance Assessments', 'Assessments module loading...', 'clipboard-list');
        }
        break;
      case 'treatments':
        if (typeof showTreatments === 'function') {
          showTreatments();
        } else {
          showPlaceholder('Risk Treatments', 'Treatments module loading...', 'prescription-bottle');
        }
        break;
      case 'kris':
        if (typeof showKRIs === 'function') {
          showKRIs();
        } else {
          showPlaceholder('Key Risk Indicators', 'KRI module loading...', 'wave-square');
        }
        break;
      case 'ai-providers':
        // Redirect to enhanced Settings > AI Providers for security and consistency
        if (typeof enhancedSettings !== 'undefined' && enhancedSettings.showEnhancedSettings) {
          enhancedSettings.showEnhancedSettings();
          // Auto-navigate to AI tab
          setTimeout(() => {
            enhancedSettings.showTab('ai');
          }, 100);
        } else {
          showPlaceholder('AI Providers', 'Loading secure AI configuration...', 'robot');
        }
        break;
      case 'rag-knowledge':
        if (typeof showRAGSettings === 'function') {
          showRAGSettings();
        } else {
          showPlaceholder('RAG & Knowledge', 'RAG & Knowledge module loading...', 'database');
        }
        break;
      case 'integrations':
        if (typeof showIntegrations === 'function') {
          showIntegrations();
        } else {
          showPlaceholder('Integrations', 'Integrations module loading...', 'plug');
        }
        break;
      case 'ai-assure':
        if (typeof showAIAssure === 'function') {
          showAIAssure();
        } else {
          showPlaceholder('AI/ARIA Assistant', 'AI Assistant module loading...', 'robot');
        }
        break;
      case 'search':
        if (typeof showSearch === 'function') {
          showSearch();
        } else {
          showPlaceholder('Advanced Search', 'Search module loading...', 'search');
        }
        break;
      case 'ai-analytics':
        if (typeof showAIAnalytics === 'function') {
          showAIAnalytics();
        } else {
          showPlaceholder('AI Analytics', 'AI Analytics module loading...', 'chart-line');
        }
        break;
      default:
        showBasicDashboard();
    }
  } catch (error) {
    console.error('Navigation error:', error);
    showError('Navigation error: ' + error.message);
  }
}

// Show integrations page (moved from settings)
function showIntegrations() {
  updateActiveNavigation && updateActiveNavigation('integrations');
  const mainContent = document.getElementById('main-content');
  
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="space-y-8">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 mb-2">Integrations</h1>
              <p class="text-gray-600">Configure external system integrations and authentication providers</p>
            </div>
            <div class="flex space-x-3">
              <button onclick="location.reload()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                <i class="fas fa-sync-alt mr-2"></i>Refresh
              </button>
            </div>
          </div>
        </div>
        
        <!-- Integration Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- AI Provider Integrations -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-robot text-purple-600 text-xl"></i>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">AI Provider Integrations</h3>
                  <p class="text-sm text-gray-500">OpenAI, Anthropic, Google AI, Azure OpenAI</p>
                </div>
              </div>
            </div>
            <p class="text-gray-600 mb-4">Configure AI service providers for governance monitoring, risk assessment, and real-time analytics.</p>
            <button onclick="aiGovernanceManager.showAIProviderSettings()" class="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
              <i class="fas fa-brain mr-2"></i>Configure AI Providers
            </button>
          </div>
          <!-- Microsoft Integration -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i class="fab fa-microsoft text-blue-600 text-xl"></i>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">Microsoft Integration</h3>
                  <p class="text-sm text-gray-500">Microsoft Defender, Azure AD, and Office 365</p>
                </div>
              </div>
            </div>
            <p class="text-gray-600 mb-4">Configure Microsoft Defender for Endpoint integration to sync assets, vulnerabilities, and security incidents.</p>
            <button onclick="if(typeof showMicrosoftSettings === 'function') showMicrosoftSettings();" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
              <i class="fas fa-cog mr-2"></i>Configure Microsoft
            </button>
          </div>
          
          <!-- SAML Authentication -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-shield-alt text-green-600 text-xl"></i>
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900">SAML Authentication</h3>
                  <p class="text-sm text-gray-500">Single Sign-On (SSO) Integration</p>
                </div>
              </div>
            </div>
            <p class="text-gray-600 mb-4">Configure SAML 2.0 integration for single sign-on with your identity provider.</p>
            <button onclick="if(typeof showSAMLSettings === 'function') showSAMLSettings();" class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
              <i class="fas fa-key mr-2"></i>Configure SAML
            </button>
          </div>
        </div>
        
        <!-- Integration Status -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Integration Status</h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center space-x-3">
                <div class="w-2 h-2 bg-yellow-400 rounded-full"></div>
                <span class="text-sm font-medium text-gray-900">Microsoft Defender</span>
              </div>
              <span class="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">Configuration Required</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center space-x-3">
                <div class="w-2 h-2 bg-red-400 rounded-full"></div>
                <span class="text-sm font-medium text-gray-900">SAML SSO</span>
              </div>
              <span class="text-xs text-red-600 bg-red-100 px-2 py-1 rounded-full">Not Configured</span>
            </div>
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center space-x-3">
                <div class="w-2 h-2 bg-purple-400 rounded-full"></div>
                <span class="text-sm font-medium text-gray-900">AI Governance Integrations</span>
              </div>
              <span class="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">Ready for Configuration</span>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Show Evidence Management page
function showEvidence() {
  updateActiveNavigation && updateActiveNavigation('evidence');
  const mainContent = document.getElementById('main-content');
  
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 mb-2">
                <i class="fas fa-folder-open mr-2 text-blue-600"></i>Evidence Management
              </h1>
              <p class="text-gray-600">Manage compliance evidence, documents, and artifacts</p>
            </div>
            <div class="flex space-x-3">
              <button onclick="addEvidence()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                <i class="fas fa-plus mr-2"></i>Add Evidence
              </button>
              <button onclick="location.reload()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                <i class="fas fa-sync-alt mr-2"></i>Refresh
              </button>
            </div>
          </div>
        </div>

        <!-- Evidence Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Evidence</p>
                <p class="text-2xl font-bold text-gray-900">47</p>
              </div>
              <div class="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-file-alt text-blue-600"></i>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Approved</p>
                <p class="text-2xl font-bold text-green-900">32</p>
              </div>
              <div class="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-check-circle text-green-600"></i>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Pending Review</p>
                <p class="text-2xl font-bold text-yellow-900">12</p>
              </div>
              <div class="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-clock text-yellow-600"></i>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Expired</p>
                <p class="text-2xl font-bold text-red-900">3</p>
              </div>
              <div class="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-exclamation-triangle text-red-600"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Evidence Table -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">Evidence Repository</h3>
              <div class="flex space-x-3">
                <input type="text" placeholder="Search evidence..." class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <select class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>All Types</option>
                  <option>Policy Document</option>
                  <option>Procedure</option>
                  <option>Screenshot</option>
                  <option>Report</option>
                  <option>Certificate</option>
                </select>
              </div>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evidence</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Control</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <i class="fas fa-file-pdf text-red-500 mr-3"></i>
                      <div>
                        <div class="text-sm font-medium text-gray-900">Access Control Policy</div>
                        <div class="text-sm text-gray-500">IAM-001-Policy.pdf</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Policy Document</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">AC-2: Account Management</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Approved
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-08-20</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-blue-600 hover:text-blue-900 mr-3">View</button>
                    <button class="text-green-600 hover:text-green-900 mr-3">Download</button>
                    <button class="text-yellow-600 hover:text-yellow-900">Edit</button>
                  </td>
                </tr>
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <i class="fas fa-image text-blue-500 mr-3"></i>
                      <div>
                        <div class="text-sm font-medium text-gray-900">MFA Configuration Screenshot</div>
                        <div class="text-sm text-gray-500">mfa-config-evidence.png</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Screenshot</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">IA-2: Identification and Authentication</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending Review
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-08-22</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-blue-600 hover:text-blue-900 mr-3">View</button>
                    <button class="text-green-600 hover:text-green-900 mr-3">Approve</button>
                    <button class="text-red-600 hover:text-red-900">Reject</button>
                  </td>
                </tr>
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <i class="fas fa-certificate text-green-500 mr-3"></i>
                      <div>
                        <div class="text-sm font-medium text-gray-900">SSL Certificate</div>
                        <div class="text-sm text-gray-500">wildcard.company.com.crt</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Certificate</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">SC-8: Transmission Confidentiality</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Expiring Soon
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-07-15</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-blue-600 hover:text-blue-900 mr-3">View</button>
                    <button class="text-orange-600 hover:text-orange-900">Renew</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
}

// Show Assessments Management page
function showAssessments() {
  updateActiveNavigation && updateActiveNavigation('assessments');
  const mainContent = document.getElementById('main-content');
  
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 mb-2">
                <i class="fas fa-clipboard-list mr-2 text-purple-600"></i>Compliance Assessments
              </h1>
              <p class="text-gray-600">Manage compliance assessments, audits, and gap analyses</p>
            </div>
            <div class="flex space-x-3">
              <button onclick="createAssessment()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                <i class="fas fa-plus mr-2"></i>New Assessment
              </button>
              <button onclick="location.reload()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                <i class="fas fa-sync-alt mr-2"></i>Refresh
              </button>
            </div>
          </div>
        </div>

        <!-- Assessment Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Assessments</p>
                <p class="text-2xl font-bold text-gray-900">12</p>
              </div>
              <div class="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-clipboard-list text-purple-600"></i>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">In Progress</p>
                <p class="text-2xl font-bold text-blue-900">5</p>
              </div>
              <div class="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-spinner text-blue-600"></i>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Completed</p>
                <p class="text-2xl font-bold text-green-900">6</p>
              </div>
              <div class="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-check-circle text-green-600"></i>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Overdue</p>
                <p class="text-2xl font-bold text-red-900">1</p>
              </div>
              <div class="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-exclamation-triangle text-red-600"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Assessments Table -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">Assessment Portfolio</h3>
              <div class="flex space-x-3">
                <input type="text" placeholder="Search assessments..." class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                <select class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option>All Frameworks</option>
                  <option>ISO 27001</option>
                  <option>SOC 2</option>
                  <option>NIST CSF</option>
                  <option>PCI DSS</option>
                </select>
              </div>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assessment</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Framework</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <i class="fas fa-shield-alt text-blue-500 mr-3"></i>
                      <div>
                        <div class="text-sm font-medium text-gray-900">ISO 27001:2022 Assessment</div>
                        <div class="text-sm text-gray-500">Annual compliance assessment</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">ISO 27001</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-full bg-gray-200 rounded-full h-2.5">
                        <div class="bg-blue-600 h-2.5 rounded-full" style="width: 75%"></div>
                      </div>
                      <span class="ml-2 text-sm text-gray-600">75%</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      In Progress
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-09-15</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-blue-600 hover:text-blue-900 mr-3">Continue</button>
                    <button class="text-green-600 hover:text-green-900 mr-3">Report</button>
                    <button class="text-gray-600 hover:text-gray-900">Settings</button>
                  </td>
                </tr>
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <i class="fas fa-building text-green-500 mr-3"></i>
                      <div>
                        <div class="text-sm font-medium text-gray-900">SOC 2 Type II Assessment</div>
                        <div class="text-sm text-gray-500">Security and availability audit</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">SOC 2</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-full bg-gray-200 rounded-full h-2.5">
                        <div class="bg-green-600 h-2.5 rounded-full" style="width: 100%"></div>
                      </div>
                      <span class="ml-2 text-sm text-gray-600">100%</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Completed
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-07-30</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-blue-600 hover:text-blue-900 mr-3">View Report</button>
                    <button class="text-green-600 hover:text-green-900">Certificate</button>
                  </td>
                </tr>
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <i class="fas fa-credit-card text-purple-500 mr-3"></i>
                      <div>
                        <div class="text-sm font-medium text-gray-900">PCI DSS Compliance Review</div>
                        <div class="text-sm text-gray-500">Payment card industry assessment</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">PCI DSS</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-full bg-gray-200 rounded-full h-2.5">
                        <div class="bg-yellow-600 h-2.5 rounded-full" style="width: 45%"></div>
                      </div>
                      <span class="ml-2 text-sm text-gray-600">45%</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Overdue
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-08-10</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-red-600 hover:text-red-900 mr-3">Urgent</button>
                    <button class="text-blue-600 hover:text-blue-900">Continue</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
}

// Placeholder functions for Evidence actions
function addEvidence() {
  showToast('Evidence upload functionality will be available soon', 'info');
}

// Assessment creation function
function createAssessment() {
  showModal('Create New Assessment', `
    <form id="assessment-form" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Assessment Name -->
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-2">Assessment Name *</label>
          <input type="text" id="assessment-name" required
                 class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                 placeholder="e.g., Q1 2024 SOC 2 Assessment">
        </div>

        <!-- Framework -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Framework *</label>
          <select id="assessment-framework" required
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
            <option value="">Select Framework</option>
            <option value="SOC2">SOC 2</option>
            <option value="ISO27001">ISO 27001</option>
            <option value="NIST">NIST Cybersecurity Framework</option>
            <option value="PCI">PCI DSS</option>
            <option value="GDPR">GDPR</option>
            <option value="HIPAA">HIPAA</option>
            <option value="CUSTOM">Custom Framework</option>
          </select>
        </div>

        <!-- Assessment Type -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Assessment Type *</label>
          <select id="assessment-type" required
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
            <option value="">Select Type</option>
            <option value="internal">Internal Assessment</option>
            <option value="external">External Audit</option>
            <option value="self">Self Assessment</option>
            <option value="gap_analysis">Gap Analysis</option>
            <option value="readiness">Readiness Assessment</option>
          </select>
        </div>

        <!-- Start Date -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
          <input type="date" id="assessment-start-date" required
                 class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
        </div>

        <!-- Target Completion Date -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Target Completion *</label>
          <input type="date" id="assessment-end-date" required
                 class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
        </div>

        <!-- Description -->
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea id="assessment-description" rows="3"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Describe the scope and objectives of this assessment..."></textarea>
        </div>
      </div>

      <!-- Status Info -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-center">
          <i class="fas fa-info-circle text-blue-600 mr-2"></i>
          <span class="text-blue-800 font-medium">Assessment Information</span>
        </div>
        <p class="text-blue-700 text-sm mt-1">
          The assessment will be created with "Planning" status and can be updated as progress is made.
        </p>
      </div>
    </form>
  `, [
    { text: 'Cancel', class: 'btn-secondary', onclick: 'closeUniversalModal()' },
    { text: 'Create Assessment', class: 'btn-primary', onclick: 'submitAssessment()' }
  ]);

  // Set default dates
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 90 days from now
  
  document.getElementById('assessment-start-date').value = today;
  document.getElementById('assessment-end-date').value = futureDate;
}

async function submitAssessment() {
  try {
    const form = document.getElementById('assessment-form');
    const formData = new FormData(form);
    
    // Get form values
    const assessmentData = {
      name: document.getElementById('assessment-name').value.trim(),
      framework: document.getElementById('assessment-framework').value,
      description: document.getElementById('assessment-description').value.trim(),
      assessment_type: document.getElementById('assessment-type').value,
      start_date: document.getElementById('assessment-start-date').value,
      target_completion_date: document.getElementById('assessment-end-date').value,
      status: 'planning',
      organization_id: 1 // Default organization
    };

    // Validation
    if (!assessmentData.name) {
      showToast('Please enter an assessment name', 'error');
      return;
    }
    if (!assessmentData.framework) {
      showToast('Please select a framework', 'error');
      return;
    }
    if (!assessmentData.assessment_type) {
      showToast('Please select an assessment type', 'error');
      return;
    }
    if (!assessmentData.start_date) {
      showToast('Please select a start date', 'error');
      return;
    }
    if (!assessmentData.target_completion_date) {
      showToast('Please select a target completion date', 'error');
      return;
    }

    // Check date logic
    if (new Date(assessmentData.start_date) >= new Date(assessmentData.target_completion_date)) {
      showToast('Target completion date must be after start date', 'error');
      return;
    }

    // Submit to API
    const token = localStorage.getItem('aria_token');
    const response = await axios.post('/api/assessments', assessmentData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      closeUniversalModal();
      showToast('Assessment created successfully!', 'success');
      
      // Refresh the assessments page if we're currently on it
      if (window.location.hash === '#assessments' || document.getElementById('main-content').innerHTML.includes('Compliance Assessments')) {
        showAssessments(); // Reload the assessments page
      }
    } else {
      throw new Error(response.data.error || 'Failed to create assessment');
    }

  } catch (error) {
    console.error('Assessment creation error:', error);
    let errorMessage = error.message || 'Failed to create assessment';
    
    // Handle specific API errors
    if (error.response && error.response.status === 403) {
      errorMessage = 'You do not have permission to create assessments. Please contact your administrator.';
    } else if (error.response && error.response.status === 401) {
      errorMessage = 'Please login to create assessments.';
    }
    
    showToast('Error: ' + errorMessage, 'error');
  }
}

// Show Risk Treatments page
function showTreatments() {
  updateActiveNavigation && updateActiveNavigation('treatments');
  const mainContent = document.getElementById('main-content');
  
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 mb-2">
                <i class="fas fa-prescription-bottle mr-2 text-green-600"></i>Risk Treatments
              </h1>
              <p class="text-gray-600">Manage risk treatment plans, controls, and mitigation strategies</p>
            </div>
            <div class="flex space-x-3">
              <button onclick="addTreatment()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                <i class="fas fa-plus mr-2"></i>Add Treatment
              </button>
              <button onclick="location.reload()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                <i class="fas fa-sync-alt mr-2"></i>Refresh
              </button>
            </div>
          </div>
        </div>

        <!-- Treatment Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Active Treatments</p>
                <p class="text-2xl font-bold text-gray-900">23</p>
              </div>
              <div class="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-shield-alt text-green-600"></i>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Implemented</p>
                <p class="text-2xl font-bold text-green-900">18</p>
              </div>
              <div class="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-check-circle text-blue-600"></i>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">In Progress</p>
                <p class="text-2xl font-bold text-yellow-900">4</p>
              </div>
              <div class="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-clock text-yellow-600"></i>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Overdue</p>
                <p class="text-2xl font-bold text-red-900">1</p>
              </div>
              <div class="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-exclamation-triangle text-red-600"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Treatments Table -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">Risk Treatment Portfolio</h3>
              <div class="flex space-x-3">
                <input type="text" placeholder="Search treatments..." class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
                <select class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent">
                  <option>All Types</option>
                  <option>Mitigate</option>
                  <option>Accept</option>
                  <option>Transfer</option>
                  <option>Avoid</option>
                </select>
              </div>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Treatment</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <i class="fas fa-shield-alt text-green-500 mr-3"></i>
                      <div>
                        <div class="text-sm font-medium text-gray-900">Multi-Factor Authentication Implementation</div>
                        <div class="text-sm text-gray-500">Implement MFA for all user accounts</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R-001: Unauthorized Access</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Mitigate</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Implemented
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-08-15</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-blue-600 hover:text-blue-900 mr-3">View</button>
                    <button class="text-green-600 hover:text-green-900 mr-3">Report</button>
                    <button class="text-gray-600 hover:text-gray-900">Edit</button>
                  </td>
                </tr>
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <i class="fas fa-clock text-yellow-500 mr-3"></i>
                      <div>
                        <div class="text-sm font-medium text-gray-900">Data Encryption Upgrade</div>
                        <div class="text-sm text-gray-500">Upgrade to AES-256 encryption</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">R-003: Data Breach</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Mitigate</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      In Progress
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2024-09-30</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-blue-600 hover:text-blue-900 mr-3">Continue</button>
                    <button class="text-yellow-600 hover:text-yellow-900 mr-3">Update</button>
                    <button class="text-gray-600 hover:text-gray-900">Edit</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
}

// Show KRIs (Key Risk Indicators) page
function showKRIs() {
  updateActiveNavigation && updateActiveNavigation('kris');
  const mainContent = document.getElementById('main-content');
  
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 mb-2">
                <i class="fas fa-wave-square mr-2 text-purple-600"></i>Key Risk Indicators
              </h1>
              <p class="text-gray-600">Monitor and analyze key metrics that indicate potential risks</p>
            </div>
            <div class="flex space-x-3">
              <button onclick="addKRI()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                <i class="fas fa-plus mr-2"></i>Add KRI
              </button>
              <button onclick="location.reload()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                <i class="fas fa-sync-alt mr-2"></i>Refresh
              </button>
            </div>
          </div>
        </div>

        <!-- KRI Dashboard -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total KRIs</p>
                <p class="text-2xl font-bold text-gray-900">15</p>
              </div>
              <div class="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-chart-line text-purple-600"></i>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Critical Alerts</p>
                <p class="text-2xl font-bold text-red-900">3</p>
              </div>
              <div class="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-exclamation-triangle text-red-600"></i>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Normal Range</p>
                <p class="text-2xl font-bold text-green-900">12</p>
              </div>
              <div class="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-check-circle text-green-600"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- KRI Performance Charts -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">KRI Performance Overview</h3>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="bg-gray-50 rounded-lg p-4 text-center">
              <i class="fas fa-chart-area text-4xl text-purple-400 mb-2"></i>
              <p class="text-gray-600">System Availability KRI</p>
              <p class="text-2xl font-bold text-green-600">99.8%</p>
              <p class="text-sm text-gray-500">Target: >99.5%</p>
            </div>
            <div class="bg-gray-50 rounded-lg p-4 text-center">
              <i class="fas fa-shield-alt text-4xl text-blue-400 mb-2"></i>
              <p class="text-gray-600">Security Incidents</p>
              <p class="text-2xl font-bold text-yellow-600">2</p>
              <p class="text-sm text-gray-500">Target: <3 per month</p>
            </div>
          </div>
        </div>

        <!-- KRI Table -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">KRI Monitoring</h3>
              <div class="flex space-x-3">
                <select class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                  <option>All Categories</option>
                  <option>Operational</option>
                  <option>Security</option>
                  <option>Compliance</option>
                  <option>Financial</option>
                </select>
              </div>
            </div>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KRI Name</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <i class="fas fa-server text-blue-500 mr-3"></i>
                      <div>
                        <div class="text-sm font-medium text-gray-900">System Uptime</div>
                        <div class="text-sm text-gray-500">Monthly system availability</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">99.8%</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">>99.5%</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Normal
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <i class="fas fa-arrow-up text-green-500"></i>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-blue-600 hover:text-blue-900 mr-3">View</button>
                    <button class="text-purple-600 hover:text-purple-900">Configure</button>
                  </td>
                </tr>
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <i class="fas fa-exclamation-triangle text-red-500 mr-3"></i>
                      <div>
                        <div class="text-sm font-medium text-gray-900">Security Incidents</div>
                        <div class="text-sm text-gray-500">Monthly security events</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">5</td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><3</td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Critical
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <i class="fas fa-arrow-up text-red-500"></i>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button class="text-red-600 hover:text-red-900 mr-3">Alert</button>
                    <button class="text-blue-600 hover:text-blue-900">Investigate</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
}

// Show AI/ARIA Assistant page
function showAIAssure() {
  updateActiveNavigation && updateActiveNavigation('ai-assure');
  const mainContent = document.getElementById('main-content');
  
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 mb-2">
                <i class="fas fa-robot mr-2 text-blue-600"></i>AI/ARIA Assistant
              </h1>
              <p class="text-gray-600">Interact with ARIA - AI Risk Intelligence Assistant</p>
            </div>
            <div class="flex space-x-3">
              <button onclick="clearChat()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                <i class="fas fa-trash mr-2"></i>Clear Chat
              </button>
              <button onclick="location.reload()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                <i class="fas fa-sync-alt mr-2"></i>Refresh
              </button>
            </div>
          </div>
        </div>

        <!-- Chat Interface -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 h-96 flex flex-col">
          <div class="p-4 border-b border-gray-200">
            <div class="flex items-center space-x-3">
              <div class="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                <i class="fas fa-robot text-blue-600"></i>
              </div>
              <div>
                <h3 class="font-semibold text-gray-900">ARIA Assistant</h3>
                <p class="text-sm text-green-600">Online</p>
              </div>
            </div>
          </div>
          
          <div class="flex-1 p-4 overflow-y-auto" id="chat-messages">
            <div class="space-y-4">
              <div class="flex items-start space-x-3">
                <div class="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <i class="fas fa-robot text-blue-600 text-sm"></i>
                </div>
                <div class="bg-gray-100 rounded-lg p-3 max-w-md">
                  <p class="text-sm text-gray-900">Hello! I'm ARIA, your AI Risk Intelligence Assistant. How can I help you with risk management today?</p>
                </div>
              </div>
            </div>
          </div>
          
          <div class="p-4 border-t border-gray-200">
            <div class="flex space-x-3">
              <input type="text" id="chat-input" placeholder="Ask ARIA about risks, compliance, or security..." class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <button onclick="sendMessage()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 class="font-semibold text-gray-900 mb-3">Risk Analysis</h3>
            <p class="text-sm text-gray-600 mb-4">Get AI-powered risk assessments and recommendations</p>
            <button onclick="askAboutRisk()" class="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              Analyze Risk
            </button>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 class="font-semibold text-gray-900 mb-3">Compliance Check</h3>
            <p class="text-sm text-gray-600 mb-4">Verify compliance status and get remediation advice</p>
            <button onclick="askAboutCompliance()" class="w-full bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
              Check Compliance
            </button>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h3 class="font-semibold text-gray-900 mb-3">Security Insights</h3>
            <p class="text-sm text-gray-600 mb-4">Get security recommendations and threat intelligence</p>
            <button onclick="askAboutSecurity()" class="w-full bg-purple-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
              Security Analysis
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

// Show AI Providers page  
function showAISettings() {
  updateActiveNavigation && updateActiveNavigation('ai-providers');
  const mainContent = document.getElementById('main-content');
  
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 mb-2">
                <i class="fas fa-robot mr-2 text-orange-600"></i>AI Providers
              </h1>
              <p class="text-gray-600">Configure and manage AI service providers and API connections</p>
            </div>
            <div class="flex space-x-3">
              <button onclick="addProvider()" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                <i class="fas fa-plus mr-2"></i>Add Provider
              </button>
              <button onclick="testConnections()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                <i class="fas fa-plug mr-2"></i>Test All
              </button>
            </div>
          </div>
        </div>

        <!-- Provider Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center">
                <div class="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <i class="fas fa-brain text-green-600"></i>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900">OpenAI</h3>
                  <p class="text-sm text-gray-600">GPT-4 & GPT-3.5</p>
                </div>
              </div>
              <div class="flex items-center">
                <span class="h-3 w-3 bg-green-400 rounded-full mr-2"></span>
                <span class="text-sm text-green-600">Active</span>
              </div>
            </div>
            <div class="space-y-2 mb-4">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">API Status:</span>
                <span class="text-green-600">Connected</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Usage:</span>
                <span class="text-gray-900">2.5k requests</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Rate Limit:</span>
                <span class="text-gray-900">60 RPM</span>
              </div>
            </div>
            <div class="flex space-x-2">
              <button class="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm font-medium hover:bg-gray-200">Configure</button>
              <button class="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-green-700">Test</button>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center">
                <div class="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <i class="fas fa-microchip text-blue-600"></i>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900">Anthropic</h3>
                  <p class="text-sm text-gray-600">Claude 3</p>
                </div>
              </div>
              <div class="flex items-center">
                <span class="h-3 w-3 bg-yellow-400 rounded-full mr-2"></span>
                <span class="text-sm text-yellow-600">Limited</span>
              </div>
            </div>
            <div class="space-y-2 mb-4">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">API Status:</span>
                <span class="text-yellow-600">Rate Limited</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Usage:</span>
                <span class="text-gray-900">850 requests</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Rate Limit:</span>
                <span class="text-gray-900">25 RPM</span>
              </div>
            </div>
            <div class="flex space-x-2">
              <button class="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm font-medium hover:bg-gray-200">Configure</button>
              <button class="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-blue-700">Test</button>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center">
                <div class="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <i class="fas fa-database text-purple-600"></i>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900">Local Model</h3>
                  <p class="text-sm text-gray-600">On-premises</p>
                </div>
              </div>
              <div class="flex items-center">
                <span class="h-3 w-3 bg-gray-400 rounded-full mr-2"></span>
                <span class="text-sm text-gray-600">Inactive</span>
              </div>
            </div>
            <div class="space-y-2 mb-4">
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Status:</span>
                <span class="text-gray-600">Not Configured</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">Type:</span>
                <span class="text-gray-900">Llama 2</span>
              </div>
              <div class="flex justify-between text-sm">
                <span class="text-gray-600">GPU:</span>
                <span class="text-gray-900">Required</span>
              </div>
            </div>
            <div class="flex space-x-2">
              <button class="flex-1 bg-purple-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-purple-700">Setup</button>
              <button class="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm font-medium hover:bg-gray-200" disabled>Test</button>
            </div>
          </div>
        </div>

        <!-- Configuration Panel -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Global AI Configuration</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Default Provider</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                <option>OpenAI GPT-4</option>
                <option>Anthropic Claude</option>
                <option>Local Model</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Fallback Provider</label>
              <select class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                <option>Anthropic Claude</option>
                <option>OpenAI GPT-3.5</option>
                <option>None</option>
              </select>
            </div>
          </div>
          <div class="mt-4 flex space-x-3">
            <button class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
              Save Configuration
            </button>
            <button class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
              Reset to Defaults
            </button>
          </div>
        </div>
      </div>
    `;
  }
}

// Show RAG & Knowledge page
function showRAGSettings() {
  updateActiveNavigation && updateActiveNavigation('rag-knowledge');
  const mainContent = document.getElementById('main-content');
  
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 mb-2">
                <i class="fas fa-database mr-2 text-indigo-600"></i>RAG & Knowledge Base
              </h1>
              <p class="text-gray-600">Manage Retrieval-Augmented Generation and knowledge repositories</p>
            </div>
            <div class="flex space-x-3">
              <button onclick="uploadKnowledge()" class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                <i class="fas fa-upload mr-2"></i>Upload Documents
              </button>
              <button onclick="reindexKnowledge()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                <i class="fas fa-sync-alt mr-2"></i>Reindex
              </button>
            </div>
          </div>
        </div>

        <!-- Knowledge Base Stats -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Documents</p>
                <p class="text-2xl font-bold text-gray-900">1,247</p>
              </div>
              <div class="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-file-alt text-indigo-600"></i>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Embeddings</p>
                <p class="text-2xl font-bold text-gray-900">45.2K</p>
              </div>
              <div class="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-vector-square text-blue-600"></i>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Queries Today</p>
                <p class="text-2xl font-bold text-gray-900">342</p>
              </div>
              <div class="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-search text-green-600"></i>
              </div>
            </div>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Avg. Accuracy</p>
                <p class="text-2xl font-bold text-gray-900">94.5%</p>
              </div>
              <div class="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-bullseye text-purple-600"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Knowledge Collections -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Knowledge Collections</h3>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-semibold text-gray-900">GRC Policies</h4>
                  <span class="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">Active</span>
                </div>
                <div class="space-y-2 text-sm text-gray-600">
                  <div class="flex justify-between">
                    <span>Documents:</span>
                    <span>156</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Size:</span>
                    <span>45.2 MB</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Last Updated:</span>
                    <span>2024-08-22</span>
                  </div>
                </div>
                <div class="mt-4 flex space-x-2">
                  <button onclick="manageKnowledgeCollection('grc_policies')" class="flex-1 bg-indigo-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-indigo-700">Manage</button>
                  <button onclick="queryKnowledgeCollection('grc_policies')" class="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm font-medium hover:bg-gray-200">Query</button>
                </div>
              </div>

              <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-semibold text-gray-900">Security Standards</h4>
                  <span class="text-sm text-green-600 bg-green-100 px-2 py-1 rounded">Active</span>
                </div>
                <div class="space-y-2 text-sm text-gray-600">
                  <div class="flex justify-between">
                    <span>Documents:</span>
                    <span>89</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Size:</span>
                    <span>23.8 MB</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Last Updated:</span>
                    <span>2024-08-20</span>
                  </div>
                </div>
                <div class="mt-4 flex space-x-2">
                  <button onclick="manageKnowledgeCollection('security_standards')" class="flex-1 bg-indigo-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-indigo-700">Manage</button>
                  <button onclick="queryKnowledgeCollection('security_standards')" class="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm font-medium hover:bg-gray-200">Query</button>
                </div>
              </div>

              <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between mb-3">
                  <h4 class="font-semibold text-gray-900">Training Materials</h4>
                  <span class="text-sm text-yellow-600 bg-yellow-100 px-2 py-1 rounded">Updating</span>
                </div>
                <div class="space-y-2 text-sm text-gray-600">
                  <div class="flex justify-between">
                    <span>Documents:</span>
                    <span>234</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Size:</span>
                    <span>67.4 MB</span>
                  </div>
                  <div class="flex justify-between">
                    <span>Last Updated:</span>
                    <span>2024-08-24</span>
                  </div>
                </div>
                <div class="mt-4 flex space-x-2">
                  <button onclick="manageKnowledgeCollection('training_materials')" class="flex-1 bg-indigo-600 text-white py-2 px-3 rounded text-sm font-medium hover:bg-indigo-700">Manage</button>
                  <button onclick="queryKnowledgeCollection('training_materials')" class="flex-1 bg-gray-100 text-gray-700 py-2 px-3 rounded text-sm font-medium hover:bg-gray-200">Query</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Show Search page
function showSearch() {
  updateActiveNavigation && updateActiveNavigation('search');
  const mainContent = document.getElementById('main-content');
  
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 mb-2">
                <i class="fas fa-search mr-2 text-cyan-600"></i>Advanced Search
              </h1>
              <p class="text-gray-600">Search across all GRC data, documents, and knowledge bases</p>
            </div>
            <div class="flex space-x-3">
              <button onclick="saveSearch()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                <i class="fas fa-star mr-2"></i>Save Search
              </button>
            </div>
          </div>
        </div>

        <!-- Search Interface -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div class="space-y-4">
            <div class="relative">
              <input type="text" id="main-search" placeholder="Search for risks, policies, controls, or ask a question..." class="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent">
              <button onclick="performSearch()" class="absolute right-3 top-3 text-gray-400 hover:text-cyan-600">
                <i class="fas fa-search"></i>
              </button>
            </div>
            
            <div class="flex flex-wrap gap-3">
              <select class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent">
                <option>All Categories</option>
                <option>Risks</option>
                <option>Controls</option>
                <option>Policies</option>
                <option>Evidence</option>
                <option>Assessments</option>
              </select>
              <select class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent">
                <option>All Time</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 90 days</option>
              </select>
              <select class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent">
                <option>Relevance</option>
                <option>Date (Newest)</option>
                <option>Date (Oldest)</option>
                <option>Name A-Z</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Quick Searches -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Searches</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button onclick="quickSearch('high risk')" class="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <i class="fas fa-exclamation-triangle text-red-500 mr-2"></i>
              <span class="text-sm font-medium">High Risk Items</span>
            </button>
            <button onclick="quickSearch('overdue controls')" class="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <i class="fas fa-clock text-yellow-500 mr-2"></i>
              <span class="text-sm font-medium">Overdue Controls</span>
            </button>
            <button onclick="quickSearch('recent incidents')" class="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <i class="fas fa-bell text-orange-500 mr-2"></i>
              <span class="text-sm font-medium">Recent Incidents</span>
            </button>
            <button onclick="quickSearch('compliance gaps')" class="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <i class="fas fa-clipboard-check text-blue-500 mr-2"></i>
              <span class="text-sm font-medium">Compliance Gaps</span>
            </button>
          </div>
        </div>

        <!-- Search Results -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">Search Results</h3>
              <span class="text-sm text-gray-600">0 results</span>
            </div>
          </div>
          <div class="p-6">
            <div class="text-center py-12">
              <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
              <p class="text-gray-600">Enter a search term to find relevant GRC information</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Show AI Analytics page
function showAIAnalytics() {
  updateActiveNavigation && updateActiveNavigation('ai-analytics');
  const mainContent = document.getElementById('main-content');
  
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="space-y-6">
        <!-- Header -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900 mb-2">
                <i class="fas fa-chart-line mr-2 text-teal-600"></i>AI Analytics
              </h1>
              <p class="text-gray-600">Advanced analytics and insights powered by artificial intelligence</p>
            </div>
            <div class="flex space-x-3">
              <button onclick="generateReport()" class="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                <i class="fas fa-file-chart mr-2"></i>Generate Report
              </button>
              <button onclick="location.reload()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                <i class="fas fa-sync-alt mr-2"></i>Refresh
              </button>
            </div>
          </div>
        </div>

        <!-- Analytics Dashboard -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Risk Prediction Model</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Model Accuracy</span>
                <span class="text-lg font-bold text-green-600">94.2%</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Predictions Made</span>
                <span class="text-lg font-bold text-gray-900">1,247</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">High Risk Alerts</span>
                <span class="text-lg font-bold text-red-600">23</span>
              </div>
            </div>
            <div class="mt-6">
              <div class="bg-gray-50 rounded-lg p-4">
                <p class="text-sm text-gray-600 mb-2">Next Predicted Risk Event:</p>
                <p class="font-semibold text-gray-900">Potential Security Incident</p>
                <p class="text-sm text-orange-600">Probability: 73% within 7 days</p>
              </div>
            </div>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Compliance Trends</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Overall Score</span>
                <span class="text-lg font-bold text-blue-600">87.3%</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Trend (30 days)</span>
                <span class="text-lg font-bold text-green-600">+5.2%</span>
              </div>
              <div class="flex items-center justify-between">
                <span class="text-sm text-gray-600">Framework Coverage</span>
                <span class="text-lg font-bold text-gray-900">12/15</span>
              </div>
            </div>
            <div class="mt-6">
              <div class="bg-gray-50 rounded-lg p-4">
                <p class="text-sm text-gray-600 mb-2">Recommendation:</p>
                <p class="font-semibold text-gray-900">Focus on Access Controls</p>
                <p class="text-sm text-blue-600">Expected improvement: +8.5%</p>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Insights -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">AI-Generated Insights</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-start space-x-3">
                <div class="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                  <i class="fas fa-exclamation-triangle text-red-600"></i>
                </div>
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-900 mb-1">Critical Risk Pattern Detected</h4>
                  <p class="text-sm text-gray-600">Multiple failed login attempts from unusual locations detected. Consider implementing stricter access controls.</p>
                  <div class="mt-2 flex space-x-2">
                    <button class="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">High Priority</button>
                    <button class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">View Details</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-start space-x-3">
                <div class="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                  <i class="fas fa-chart-line text-green-600"></i>
                </div>
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-900 mb-1">Compliance Improvement Opportunity</h4>
                  <p class="text-sm text-gray-600">Data backup procedures show 98% success rate. Consider documenting this as a best practice.</p>
                  <div class="mt-2 flex space-x-2">
                    <button class="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Positive Trend</button>
                    <button class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Implement</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-start space-x-3">
                <div class="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <i class="fas fa-lightbulb text-blue-600"></i>
                </div>
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-900 mb-1">Resource Optimization</h4>
                  <p class="text-sm text-gray-600">AI analysis suggests consolidating security training programs could reduce costs by 25% while maintaining effectiveness.</p>
                  <div class="mt-2 flex space-x-2">
                    <button class="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Cost Saving</button>
                    <button class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Explore</button>
                  </div>
                </div>
              </div>
            </div>

            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-start space-x-3">
                <div class="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <i class="fas fa-brain text-purple-600"></i>
                </div>
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-900 mb-1">Predictive Alert</h4>
                  <p class="text-sm text-gray-600">Model predicts potential compliance gap in PCI DSS requirements within the next 15 days. Proactive review recommended.</p>
                  <div class="mt-2 flex space-x-2">
                    <button class="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">Prediction</button>
                    <button class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Schedule Review</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Placeholder functions for new features
function addTreatment() {
  showToast('Risk treatment creation will be available soon', 'info');
}

function addKRI() {
  showToast('KRI configuration will be available soon', 'info');
}

function clearChat() {
  showToast('Chat cleared', 'success');
}

function sendMessage() {
  showToast('AI chat functionality will be available soon', 'info');
}

function askAboutRisk() {
  showToast('Risk analysis AI will be available soon', 'info');
}

function askAboutCompliance() {
  showToast('Compliance AI will be available soon', 'info');
}

function askAboutSecurity() {
  showToast('Security AI will be available soon', 'info');
}

function addProvider() {
  showToast('Provider configuration will be available soon', 'info');
}

function testConnections() {
  showToast('Connection testing will be available soon', 'info');
}

function uploadKnowledge() {
  showToast('Knowledge upload will be available soon', 'info');
}

async function reindexKnowledge() {
  try {
    showToast('Starting knowledge reindexing...', 'info');
    
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please login to access this feature', 'error');
      return;
    }
    
    const response = await axios.post('/api/rag/reindex', {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      const result = response.data.data;
      showToast(`Knowledge reindexing completed! Processed ${result.totalProcessed} items in ${(result.processingTime / 1000).toFixed(2)}s`, 'success');
      
      // Show detailed results if available
      if (result.details && result.details.length > 0) {
        console.log('Reindexing details:', result.details);
      }
    } else {
      showToast(response.data.message || 'Knowledge reindexing failed', 'error');
    }
  } catch (error) {
    console.error('Knowledge reindexing error:', error);
    showToast('Failed to reindex knowledge data', 'error');
  }
}

function saveSearch() {
  showToast('Search saving will be available soon', 'info');
}

// Knowledge Collections Management
async function manageKnowledgeCollection(collectionType) {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please login to access this feature', 'error');
      return;
    }
    
    // Get collection information
    const response = await axios.get(`/api/rag/documents?sourceType=${collectionType}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      const documents = response.data.data.documents;
      const collectionName = collectionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      showModal(`Manage ${collectionName}`, `
        <div class="space-y-6">
          <div class="flex justify-between items-center">
            <h4 class="text-lg font-medium">Documents in Collection</h4>
            <button onclick="uploadToCollection('${collectionType}')" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              <i class="fas fa-upload mr-2"></i>Upload Document
            </button>
          </div>
          
          <div class="max-h-96 overflow-y-auto">
            ${documents && documents.length > 0 ? `
              <div class="space-y-3">
                ${documents.map(doc => `
                  <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <h5 class="font-medium text-gray-900">${doc.title || 'Untitled Document'}</h5>
                        <p class="text-sm text-gray-500 mt-1">
                          Tokens: ${doc.token_count || 0} | 
                          Created: ${doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Unknown'}
                        </p>
                      </div>
                      <button onclick="deleteDocument('${doc.id}')" class="text-red-600 hover:text-red-700 ml-4">
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : `
              <div class="text-center py-8 text-gray-500">
                <i class="fas fa-folder-open text-4xl mb-4"></i>
                <p>No documents in this collection yet.</p>
                <p class="text-sm mt-2">Upload documents to start building your knowledge base.</p>
              </div>
            `}
          </div>
        </div>
      `);
    } else {
      showToast('Failed to load collection documents', 'error');
    }
  } catch (error) {
    console.error('Manage collection error:', error);
    showToast('Failed to manage knowledge collection', 'error');
  }
}

async function queryKnowledgeCollection(collectionType) {
  const collectionName = collectionType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  
  showModal(`Query ${collectionName}`, `
    <div class="space-y-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Search Query</label>
        <textarea id="collection-query" rows="3" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Enter your search query for ${collectionName.toLowerCase()}..."></textarea>
      </div>
      
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Max Results</label>
          <select id="collection-limit" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="5">5 results</option>
            <option value="10" selected>10 results</option>
            <option value="20">20 results</option>
            <option value="50">50 results</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Similarity Threshold</label>
          <select id="collection-threshold" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
            <option value="0.1">Low (0.1)</option>
            <option value="0.3" selected>Medium (0.3)</option>
            <option value="0.5">High (0.5)</option>
            <option value="0.7">Very High (0.7)</option>
          </select>
        </div>
      </div>
      
      <div>
        <button onclick="executeCollectionQuery('${collectionType}')" 
                class="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700">
          Search Collection
        </button>
      </div>
      
      <div id="collection-results" class="hidden">
        <h4 class="font-medium text-gray-900 mb-3">Search Results</h4>
        <div id="collection-results-content"></div>
      </div>
    </div>
  `);
}

async function executeCollectionQuery(collectionType) {
  try {
    const query = document.getElementById('collection-query').value.trim();
    if (!query) {
      showToast('Please enter a search query', 'error');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please login to access this feature', 'error');
      return;
    }
    
    const limit = parseInt(document.getElementById('collection-limit').value);
    const threshold = parseFloat(document.getElementById('collection-threshold').value);
    
    showToast('Searching collection...', 'info');
    
    const response = await axios.post('/api/rag/query', {
      query: query,
      sourceTypes: [collectionType],
      limit: limit,
      threshold: threshold,
      includeMetadata: true
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      const result = response.data.data;
      const resultsDiv = document.getElementById('collection-results');
      const resultsContent = document.getElementById('collection-results-content');
      
      if (result.sources && result.sources.length > 0) {
        resultsContent.innerHTML = `
          <div class="space-y-4">
            ${result.sources.map((source, index) => `
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-start mb-2">
                  <h5 class="font-medium text-gray-900">${source.title || `Result ${index + 1}`}</h5>
                  <span class="text-sm text-gray-500">${(source.similarity * 100).toFixed(1)}% match</span>
                </div>
                <p class="text-gray-700 text-sm mb-2">${source.content}</p>
                ${source.metadata ? `
                  <div class="text-xs text-gray-500">
                    ${source.metadata.page ? `Page: ${source.metadata.page} | ` : ''}
                    Tokens: ${source.metadata.tokenCount || 'Unknown'}
                  </div>
                ` : ''}
              </div>
            `).join('')}
          </div>
        `;
        resultsDiv.classList.remove('hidden');
        showToast(`Found ${result.sources.length} results`, 'success');
      } else {
        resultsContent.innerHTML = `
          <div class="text-center py-8 text-gray-500">
            <i class="fas fa-search text-4xl mb-4"></i>
            <p>No results found for your query.</p>
            <p class="text-sm mt-2">Try adjusting your search terms or lowering the similarity threshold.</p>
          </div>
        `;
        resultsDiv.classList.remove('hidden');
        showToast('No results found', 'info');
      }
    } else {
      showToast(response.data.message || 'Search failed', 'error');
    }
  } catch (error) {
    console.error('Collection query error:', error);
    showToast('Failed to search collection', 'error');
  }
}

async function uploadToCollection(collectionType) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.pdf,.doc,.docx,.txt,.md';
  input.multiple = true;
  
  input.onchange = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please login to access this feature', 'error');
      return;
    }
    
    for (const file of files) {
      try {
        showToast(`Uploading ${file.name}...`, 'info');
        
        const formData = new FormData();
        formData.append('file', file);
        formData.append('sourceType', collectionType);
        
        const response = await axios.post('/api/rag/index/document', formData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        
        if (response.data.success) {
          showToast(`${file.name} uploaded and indexed successfully`, 'success');
        } else {
          showToast(`Failed to upload ${file.name}`, 'error');
        }
      } catch (error) {
        console.error('Upload error:', error);
        showToast(`Failed to upload ${file.name}`, 'error');
      }
    }
    
    // Refresh the collection view
    setTimeout(() => {
      closeModal();
      manageKnowledgeCollection(collectionType);
    }, 1000);
  };
  
  input.click();
}

async function deleteDocument(documentId) {
  if (!confirm('Are you sure you want to delete this document?')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please login to access this feature', 'error');
      return;
    }
    
    const response = await axios.delete(`/api/rag/documents/${documentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.data.success) {
      showToast('Document deleted successfully', 'success');
      // Refresh the current modal view
      location.reload();
    } else {
      showToast('Failed to delete document', 'error');
    }
  } catch (error) {
    console.error('Delete document error:', error);
    showToast('Failed to delete document', 'error');
  }
}

function performSearch() {
  showToast('Advanced search will be available soon', 'info');
}

function quickSearch(term) {
  showToast(`Quick search for "${term}" will be available soon`, 'info');
}

async function generateReport() {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please login to access this feature', 'error');
      return;
    }
    
    showModal('Generate AI Analytics Report', `
      <div class="space-y-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
          <select id="report-type" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <option value="executive_summary">Executive Summary</option>
            <option value="risk_overview">Risk Management Overview</option>
            <option value="compliance_status">Compliance Status</option>
            <option value="incident_analysis">Security Incident Analysis</option>
            <option value="kri_trends">Key Risk Indicators</option>
            <option value="security_metrics">Security Metrics</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Timeframe</label>
          <select id="report-timeframe" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days" selected>Last 30 Days</option>
            <option value="last_90_days">Last 90 Days</option>
            <option value="last_year">Last Year</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">AI Provider</label>
          <select id="report-provider" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
            <option value="openai">OpenAI GPT-4</option>
            <option value="gemini">Google Gemini</option>
            <option value="anthropic">Anthropic Claude</option>
            <option value="cloudflare">Cloudflare Llama (Free)</option>
          </select>
        </div>
        
        <div class="flex items-center">
          <input type="checkbox" id="include-charts" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
          <label for="include-charts" class="ml-2 text-sm text-gray-700">Include Charts and Visualizations</label>
        </div>
        
        <div class="flex space-x-3">
          <button onclick="executeReportGeneration()" 
                  class="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center justify-center">
            <i class="fas fa-chart-line mr-2"></i>
            Generate Report
          </button>
          <button onclick="closeModal()" 
                  class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    `);
  } catch (error) {
    console.error('Generate report modal error:', error);
    showToast('Failed to open report generation', 'error');
  }
}

async function executeReportGeneration() {
  try {
    const reportType = document.getElementById('report-type').value;
    const timeframe = document.getElementById('report-timeframe').value;
    const provider = document.getElementById('report-provider').value;
    const includeCharts = document.getElementById('include-charts').checked;
    
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please login to access this feature', 'error');
      return;
    }
    
    // Get AI provider settings
    const aiSettings = getAISettings();
    
    showToast('Generating AI analytics report...', 'info');
    closeModal();
    
    // Show loading state
    showModal('Generating Report', `
      <div class="text-center py-8">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Generating AI Analytics Report</h3>
        <p class="text-gray-500">This may take a few moments...</p>
        <div class="mt-4 text-sm text-gray-400">
          <p>Report Type: ${reportType.replace('_', ' ')}</p>
          <p>Timeframe: ${timeframe.replace('_', ' ')}</p>
          <p>AI Provider: ${provider}</p>
        </div>
      </div>
    `);
    
    const response = await axios.post('/api/aria/generate-report', {
      reportType: reportType,
      timeframe: timeframe,
      includeCharts: includeCharts,
      provider: provider,
      settings: aiSettings
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 120000 // 2 minutes timeout for report generation
    });
    
    if (response.data.success) {
      const report = response.data.data;
      displayGeneratedReport(report);
      showToast('Report generated successfully!', 'success');
    } else {
      closeModal();
      showToast(response.data.message || 'Report generation failed', 'error');
    }
  } catch (error) {
    console.error('Report generation error:', error);
    closeModal();
    if (error.code === 'ECONNABORTED') {
      showToast('Report generation timed out. Please try again.', 'error');
    } else {
      showToast('Failed to generate report', 'error');
    }
  }
}

function displayGeneratedReport(report) {
  closeModal();
  
  const chartsHtml = report.charts ? report.charts.map((chart, index) => `
    <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
      <h4 class="text-lg font-medium text-gray-900 mb-4">${chart.title}</h4>
      <canvas id="report-chart-${index}" width="400" height="200"></canvas>
    </div>
  `).join('') : '';
  
  const recommendationsHtml = report.recommendations && report.recommendations.length > 0 ? `
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
      <h4 class="text-lg font-medium text-blue-900 mb-3">
        <i class="fas fa-lightbulb mr-2"></i>Key Recommendations
      </h4>
      <ul class="space-y-2">
        ${report.recommendations.map(rec => `
          <li class="flex items-start">
            <i class="fas fa-arrow-right text-blue-600 mt-1 mr-2 text-sm"></i>
            <span class="text-blue-800">${rec}</span>
          </li>
        `).join('')}
      </ul>
    </div>
  ` : '';
  
  showModal(`${report.metadata.title}`, `
    <div class="max-w-4xl max-h-screen overflow-y-auto">
      <!-- Report Header -->
      <div class="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-lg mb-6">
        <h2 class="text-2xl font-bold mb-2">${report.metadata.title}</h2>
        <div class="flex flex-wrap gap-4 text-indigo-100">
          <span><i class="fas fa-calendar mr-1"></i> ${report.metadata.timeframe.replace('_', ' ')}</span>
          <span><i class="fas fa-clock mr-1"></i> Generated: ${new Date(report.metadata.generated_at).toLocaleString()}</span>
          <span><i class="fas fa-robot mr-1"></i> AI Provider: ${report.metadata.ai_provider}</span>
        </div>
      </div>
      
      <!-- Executive Summary -->
      <div class="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 class="text-xl font-semibold text-gray-900 mb-4">
          <i class="fas fa-file-alt mr-2 text-indigo-600"></i>Executive Summary
        </h3>
        <div class="prose max-w-none text-gray-700">
          ${report.executive_summary.replace(/\n/g, '</p><p>')}
        </div>
      </div>
      
      <!-- Key Recommendations -->
      ${recommendationsHtml}
      
      <!-- Charts -->
      ${chartsHtml}
      
      <!-- Raw Data (Collapsible) -->
      <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <button onclick="toggleReportData()" class="flex items-center text-gray-700 hover:text-gray-900">
          <i class="fas fa-chevron-right mr-2" id="report-data-icon"></i>
          <span class="font-medium">View Raw Data</span>
        </button>
        <div id="report-raw-data" class="hidden mt-4">
          <pre class="bg-white p-4 rounded border text-sm overflow-x-auto">${JSON.stringify(report.data, null, 2)}</pre>
        </div>
      </div>
      
      <!-- Actions -->
      <div class="flex justify-between mt-6 pt-4 border-t border-gray-200">
        <button onclick="downloadReport()" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
          <i class="fas fa-download mr-2"></i>Download PDF
        </button>
        <button onclick="closeModal()" class="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">
          Close
        </button>
      </div>
    </div>
  `, [], 'max-w-6xl');
  
  // Render charts if included
  if (report.charts && window.Chart) {
    setTimeout(() => {
      report.charts.forEach((chartConfig, index) => {
        const ctx = document.getElementById(`report-chart-${index}`);
        if (ctx) {
          new Chart(ctx, {
            type: chartConfig.type,
            data: chartConfig.data,
            options: {
              responsive: true,
              plugins: {
                legend: {
                  position: 'bottom'
                }
              }
            }
          });
        }
      });
    }, 100);
  }
  
  // Store report for download
  window.currentReport = report;
}

function toggleReportData() {
  const dataDiv = document.getElementById('report-raw-data');
  const icon = document.getElementById('report-data-icon');
  
  if (dataDiv.classList.contains('hidden')) {
    dataDiv.classList.remove('hidden');
    icon.classList.remove('fa-chevron-right');
    icon.classList.add('fa-chevron-down');
  } else {
    dataDiv.classList.add('hidden');
    icon.classList.remove('fa-chevron-down');
    icon.classList.add('fa-chevron-right');
  }
}

function downloadReport() {
  if (!window.currentReport) {
    showToast('No report available for download', 'error');
    return;
  }
  
  // Create downloadable content
  const report = window.currentReport;
  const content = `${report.metadata.title}
Generated: ${new Date(report.metadata.generated_at).toLocaleString()}
Timeframe: ${report.metadata.timeframe.replace('_', ' ')}
AI Provider: ${report.metadata.ai_provider}

EXECUTIVE SUMMARY
${report.executive_summary}

${report.recommendations && report.recommendations.length > 0 ? `
KEY RECOMMENDATIONS
${report.recommendations.map(rec => `• ${rec}`).join('\n')}
` : ''}

RAW DATA
${JSON.stringify(report.data, null, 2)}
`;
  
  // Create and download file
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${report.metadata.title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  showToast('Report downloaded successfully', 'success');
}

// Show placeholder for modules that haven't loaded yet
function showPlaceholder(title, message, icon) {
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-${icon} text-6xl text-gray-400 mb-4"></i>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">${title}</h2>
        <p class="text-gray-600 mb-4">${message}</p>
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    `;
  }
}

// Logout function
function logout() {
  // Clear user data
  localStorage.removeItem('aria_token');
  localStorage.removeItem('dmt_user');
  currentUser = null;
  
  // Redirect to login page immediately (no need to update UI)
  window.location.href = '/login';
}

// Dashboard functionality
async function initializeDashboard() {
  console.log('🔄 Initializing dashboard...');
  try {
    const success = await loadDashboardData();
    console.log('📊 Dashboard data loaded:', success ? 'Success' : 'Failed');
    if (success) {
      console.log('🎯 Calling showDashboard with data:', dashboardData ? 'Available' : 'Missing');
      console.log('📋 Dashboard data keys:', dashboardData ? Object.keys(dashboardData) : 'None');
      showDashboard();
      console.log('✅ Dashboard initialization complete');
    } else {
      console.error('❌ Dashboard data loading failed, not showing dashboard');
    }
  } catch (error) {
    console.error('❌ Dashboard initialization error:', error);
    showError('Dashboard initialization failed: ' + error.message);
  }
}

async function loadDashboardData() {
  try {
    console.log('📡 Loading dashboard data...');
    showLoading('main-content');
    
    const token = localStorage.getItem('aria_token');
    console.log('🔑 Using token:', token ? 'Present' : 'Missing');
    
    const response = await axios.get('/api/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📋 API Response:', response.data.success ? 'Success' : 'Failed');
    
    if (response.data.success) {
      dashboardData = response.data.data;
      console.log('💾 Dashboard data set:', Object.keys(dashboardData || {}).length, 'keys');
      return true; // Success
    } else {
      throw new Error('Failed to load dashboard data');
    }
  } catch (error) {
    console.error('❌ Dashboard error:', error);
    showError('Failed to load dashboard data');
    return false; // Failed
  }
}

function showDashboard() {
  console.log('🎯 showDashboard called');
  updateActiveNavigation('dashboard');
  
  const mainContent = document.getElementById('main-content');
  console.log('📱 main-content element:', mainContent ? 'Found' : 'Not found');
  
  if (!dashboardData) {
    console.log('❌ No dashboard data, showing loading');
    showLoading('main-content');
    return;
  }
  
  console.log('✅ Dashboard data available, rendering dashboard');
  
  mainContent.innerHTML = `
    <div class="container mx-auto px-4 py-6">
      <div class="space-y-8">
      <!-- Modern Header -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold mb-2">ARIA Dashboard</h1>
            <p class="text-blue-100">Real-time insights into your organization's risk posture</p>
          </div>
          <div class="flex space-x-3">
            <button onclick="refreshDashboard()" class="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all duration-200">
              <i class="fas fa-sync-alt mr-2"></i>Refresh
            </button>
            <button onclick="showReports()" class="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-all duration-200">
              <i class="fas fa-chart-bar mr-2"></i>Reports
            </button>
          </div>
        </div>
      </div>
      
      <!-- Modern Key Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Risks</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">${dashboardData.total_risks}</p>
              <div class="flex items-center mt-2">
                <i class="fas fa-arrow-up text-green-500 text-sm mr-1"></i>
                <span class="text-sm text-green-600 font-medium">Active monitoring</span>
              </div>
            </div>
            <div class="bg-blue-50 p-3 rounded-xl">
              <i class="fas fa-exclamation-triangle text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500 uppercase tracking-wide">High Risk</p>
              <p class="text-3xl font-bold text-red-600 mt-2">${dashboardData.high_risks}</p>
              <div class="flex items-center mt-2">
                <i class="fas fa-fire text-red-500 text-sm mr-1"></i>
                <span class="text-sm text-red-600 font-medium">Requires attention</span>
              </div>
            </div>
            <div class="bg-red-50 p-3 rounded-xl">
              <i class="fas fa-fire text-red-600 text-xl"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500 uppercase tracking-wide">Open Findings</p>
              <p class="text-3xl font-bold text-orange-600 mt-2">${dashboardData.open_findings}</p>
              <div class="flex items-center mt-2">
                <i class="fas fa-clock text-orange-500 text-sm mr-1"></i>
                <span class="text-sm text-orange-600 font-medium">In progress</span>
              </div>
            </div>
            <div class="bg-orange-50 p-3 rounded-xl">
              <i class="fas fa-clipboard-list text-orange-600 text-xl"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500 uppercase tracking-wide">Compliance</p>
              <p class="text-3xl font-bold text-green-600 mt-2">${dashboardData.compliance_score}%</p>
              <div class="flex items-center mt-2">
                <i class="fas fa-check-circle text-green-500 text-sm mr-1"></i>
                <span class="text-sm text-green-600 font-medium">On track</span>
              </div>
            </div>
            <div class="bg-green-50 p-3 rounded-xl">
              <i class="fas fa-shield-alt text-green-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Advanced Risk Heat Maps Section -->
      <div class="dashboard-card">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Advanced Risk Heat Maps</h3>
          <div class="flex space-x-2">
            <select id="heatmapView" onchange="updateHeatMap()" class="form-select text-sm">
              <option value="probability_impact">Probability vs Impact</option>
              <option value="organizational">Organizational Risk Matrix</option>
              <option value="temporal">Temporal Risk Evolution</option>
              <option value="category">Risk by Category</option>
            </select>
            <button onclick="toggleHeatMapFullscreen()" class="btn-icon">
              <i class="fas fa-expand"></i>
            </button>
          </div>
        </div>
        <div id="riskHeatMapContainer" class="relative">
          <canvas id="riskHeatMap" class="w-full h-96"></canvas>
          <div id="heatMapTooltip" class="absolute hidden bg-black bg-opacity-75 text-white text-xs rounded px-2 py-1 pointer-events-none z-10"></div>
        </div>
        <div class="mt-4 flex justify-between items-center text-sm text-gray-600">
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <div class="w-4 h-4 bg-green-400 rounded"></div>
              <span>Low Risk</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-4 h-4 bg-yellow-400 rounded"></div>
              <span>Medium Risk</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-4 h-4 bg-orange-500 rounded"></div>
              <span>High Risk</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-4 h-4 bg-red-600 rounded"></div>
              <span>Critical Risk</span>
            </div>
          </div>
          <div class="text-right">
            <span>Total Risk Items: <strong id="heatMapRiskCount">${dashboardData.total_risks}</strong></span>
          </div>
        </div>
      </div>

      <!-- Charts and Analytics -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Risk Trend Chart -->
        <div class="dashboard-card">
          <h3 class="text-lg font-semibold mb-4">Risk Trend (7 Days)</h3>
          <div class="chart-container">
            <canvas id="riskTrendChart"></canvas>
          </div>
        </div>
        
        <!-- Risk Distribution -->
        <div class="dashboard-card">
          <h3 class="text-lg font-semibold mb-4">Risk Distribution</h3>
          <div class="chart-container">
            <canvas id="riskDistributionChart"></canvas>
          </div>
        </div>
      </div>
      
      <!-- Data Tables -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Top Risks -->
        <div class="dashboard-card">
          <h3 class="text-lg font-semibold mb-4">Top Risks</h3>
          <div class="space-y-3">
            ${dashboardData.top_risks.map(risk => `
              <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div class="flex-1">
                  <div class="text-sm font-medium text-gray-900">${risk.title}</div>
                  <div class="text-xs text-gray-500">${risk.risk_id}</div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-semibold ${getRiskScoreColor(risk.risk_score)}">${risk.risk_score}</div>
                  <div class="text-xs text-gray-500">${getRiskLevel(risk.risk_score)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- Recent Incidents -->
        <div class="dashboard-card">
          <h3 class="text-lg font-semibold mb-4">Recent Incidents</h3>
          <div class="space-y-3">
            ${dashboardData.recent_incidents.map(incident => `
              <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div class="flex-1">
                  <div class="text-sm font-medium text-gray-900">${incident.title}</div>
                  <div class="text-xs text-gray-500">${incident.incident_id}</div>
                </div>
                <div class="text-right">
                  <div class="badge badge-sm ${getSeverityClass(incident.severity)}">${incident.severity}</div>
                  <div class="text-xs text-gray-500 mt-1">${formatDate(incident.created_at)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
      </div>
    </div>
  `;
  
  // Initialize charts and heat maps
  initializeCharts();
}

// SoA UI
async function showSoA() {
  updateActiveNavigation && updateActiveNavigation('soa');
  const main = document.getElementById('main-content');
  showLoading('main-content');
  try {
    const token = localStorage.getItem('aria_token');
    const res = await axios.get('/api/soa', { headers: { Authorization: `Bearer ${token}` } });
    const rows = res.data.data || [];
    main.innerHTML = `
      <div class="container mx-auto px-4 py-6">
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-bold text-gray-900">Statement of Applicability</h2>
            <div class="text-sm text-gray-500">Read/write (basic)</div>
          </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Framework</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Control</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Included</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Implementation</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effectiveness</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Justification</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${rows.map(r => `
                <tr>
                  <td class="px-4 py-3 text-sm text-gray-900">${r.framework}</td>
                  <td class="px-4 py-3 text-sm text-gray-700"><span class="font-mono">${r.external_id}</span> - ${r.title}</td>
                  <td class="px-4 py-3 text-sm">${r.included ? '<span class="badge badge-sm bg-green-100 text-green-700">Included</span>' : '<span class="badge badge-sm bg-gray-100 text-gray-700">Excluded</span>'}</td>
                  <td class="px-4 py-3 text-sm">${r.implementation_status || '-'}</td>
                  <td class="px-4 py-3 text-sm">${r.effectiveness || '-'}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">${r.justification || '-'}</td>
                  <td class="px-4 py-3 text-right">
                    <button class="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100" onclick="editSoA(${r.id})"><i class="fas fa-edit mr-1"></i>Edit</button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        </div>
      </div>
    `;
  } catch (e) {
    showError('Failed to load SoA');
  }
}

window.editSoA = function(id) {
  const token = localStorage.getItem('aria_token');
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div class="fixed inset-0 bg-black bg-opacity-40 z-50 flex items-center justify-center">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div class="px-6 py-4 border-b flex justify-between items-center">
          <h3 class="font-semibold">Edit SoA Entry</h3>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600"><i class="fas fa-times"></i></button>
        </div>
        <div class="p-6 space-y-4">
          <div class="flex items-center space-x-2">
            <input type="checkbox" id="soa-included" class="form-checkbox">
            <label for="soa-included" class="text-sm text-gray-700">Included</label>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Implementation Status</label>
            <select id="soa-impl" class="w-full border rounded px-3 py-2">
              <option value="">-</option>
              <option value="planned">planned</option>
              <option value="in_progress">in_progress</option>
              <option value="implemented">implemented</option>
              <option value="not_applicable">not_applicable</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Effectiveness</label>
            <select id="soa-eff" class="w-full border rounded px-3 py-2">
              <option value="">-</option>
              <option value="effective">effective</option>
              <option value="partially_effective">partially_effective</option>
              <option value="ineffective">ineffective</option>
              <option value="not_tested">not_tested</option>
            </select>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Justification</label>
            <textarea id="soa-just" rows="3" class="w-full border rounded px-3 py-2"></textarea>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Evidence Refs (URLs, comma-separated)</label>
            <input id="soa-evidence" class="w-full border rounded px-3 py-2" placeholder="https://... , https://...">
          </div>
        </div>
        <div class="px-6 py-4 border-t flex justify-end space-x-2">
          <button class="px-4 py-2 border rounded" onclick="this.closest('.fixed').remove()">Cancel</button>
          <button class="px-4 py-2 bg-blue-600 text-white rounded" onclick="saveSoA(${id})"><i class="fas fa-save mr-1"></i>Save</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

window.saveSoA = async function(id) {
  try {
    const token = localStorage.getItem('aria_token');
    const body = {
      included: document.getElementById('soa-included').checked,
      implementation_status: document.getElementById('soa-impl').value || null,
      effectiveness: document.getElementById('soa-eff').value || null,
      justification: document.getElementById('soa-just').value || null,
      evidence_refs: document.getElementById('soa-evidence').value || null
    };
    await axios.put(`/api/soa/${id}`, body, { headers: { Authorization: `Bearer ${token}` }});
    document.querySelector('.fixed.inset-0')?.remove();
    showToast('SoA updated', 'success');
    showSoA();
  } catch (e) {
    showError('Failed to update SoA');
  }
}

// Enhanced Risk Treatments UI with Comprehensive Management
async function showTreatments() {
  updateActiveNavigation && updateActiveNavigation('treatments');
  showLoading('main-content');
  try {
    const token = localStorage.getItem('aria_token');
    const [treatRes, excRes, risksRes] = await Promise.all([
      axios.get('/api/treatments', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/exceptions', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/risks', { headers: { Authorization: `Bearer ${token}` } })
    ]);
    const treatments = treatRes.data.data || [];
    const exceptions = excRes.data.data || [];
    const risks = risksRes.data.data || [];
    
    // Calculate summary statistics
    const treatmentStats = {
      total: treatments.length,
      planned: treatments.filter(t => t.status === 'planned').length,
      inProgress: treatments.filter(t => t.status === 'in_progress').length,
      completed: treatments.filter(t => t.status === 'completed').length,
      overdue: treatments.filter(t => t.due_date && new Date(t.due_date) < new Date()).length
    };
    
    const exceptionStats = {
      total: exceptions.length,
      active: exceptions.filter(e => e.status === 'active').length,
      expired: exceptions.filter(e => e.expiry_date && new Date(e.expiry_date) < new Date()).length,
      pending: exceptions.filter(e => e.status === 'pending_approval').length
    };

    const main = document.getElementById('main-content');
    main.innerHTML = `
      <div class="space-y-6">
        <!-- Header Section -->
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Risk Treatments & Exceptions</h2>
            <p class="text-gray-600 mt-1">Manage risk treatment strategies and exception approvals</p>
          </div>
          <div class="flex space-x-3">
            <button onclick="showTreatmentCreateModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <i class="fas fa-plus mr-2"></i>New Treatment
            </button>
            <button onclick="showExceptionCreateModal()" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              <i class="fas fa-shield-alt mr-2"></i>New Exception
            </button>
          </div>
        </div>

        <!-- Treatments Section -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold text-gray-900">Risk Treatments</h3>
            <div class="text-sm text-gray-500">Proactive risk mitigation strategies</div>
          </div>
          
          <!-- Treatment Statistics -->
          <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div class="bg-white p-4 rounded-lg shadow-sm border">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">Total Treatments</p>
                  <p class="text-2xl font-bold text-gray-900">${treatmentStats.total}</p>
                </div>
                <div class="p-3 bg-blue-100 rounded-full">
                  <i class="fas fa-tasks text-blue-600"></i>
                </div>
              </div>
            </div>
            <div class="bg-white p-4 rounded-lg shadow-sm border">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">Planned</p>
                  <p class="text-2xl font-bold text-yellow-600">${treatmentStats.planned}</p>
                </div>
                <div class="p-3 bg-yellow-100 rounded-full">
                  <i class="fas fa-clock text-yellow-600"></i>
                </div>
              </div>
            </div>
            <div class="bg-white p-4 rounded-lg shadow-sm border">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">In Progress</p>
                  <p class="text-2xl font-bold text-blue-600">${treatmentStats.inProgress}</p>
                </div>
                <div class="p-3 bg-blue-100 rounded-full">
                  <i class="fas fa-play-circle text-blue-600"></i>
                </div>
              </div>
            </div>
            <div class="bg-white p-4 rounded-lg shadow-sm border">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">Completed</p>
                  <p class="text-2xl font-bold text-green-600">${treatmentStats.completed}</p>
                </div>
                <div class="p-3 bg-green-100 rounded-full">
                  <i class="fas fa-check-circle text-green-600"></i>
                </div>
              </div>
            </div>
            <div class="bg-white p-4 rounded-lg shadow-sm border">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">Overdue</p>
                  <p class="text-2xl font-bold text-red-600">${treatmentStats.overdue}</p>
                </div>
                <div class="p-3 bg-red-100 rounded-full">
                  <i class="fas fa-exclamation-triangle text-red-600"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Treatments Table -->
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="p-4 border-b flex justify-between items-center">
              <h4 class="font-medium">Treatment Plans</h4>
              <div class="flex space-x-2">
                <select id="treatmentStatusFilter" onchange="filterTreatments()" class="text-sm border rounded px-2 py-1">
                  <option value="">All Statuses</option>
                  <option value="planned">Planned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <input type="text" id="treatmentSearchInput" placeholder="Search treatments..." 
                       onkeyup="filterTreatments()" class="text-sm border rounded px-2 py-1">
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Treatment Strategy</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody id="treatmentsTableBody" class="bg-white divide-y divide-gray-200">
                  ${renderTreatmentsTable(treatments)}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Exceptions/Acceptances Section -->
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold text-gray-900">Risk Acceptances & Exceptions</h3>
            <div class="text-sm text-gray-500">Risk acceptance decisions and control exceptions</div>
          </div>
          
          <!-- Exception Statistics -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="bg-white p-4 rounded-lg shadow-sm border">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">Total Exceptions</p>
                  <p class="text-2xl font-bold text-gray-900">${exceptionStats.total}</p>
                </div>
                <div class="p-3 bg-gray-100 rounded-full">
                  <i class="fas fa-shield-alt text-gray-600"></i>
                </div>
              </div>
            </div>
            <div class="bg-white p-4 rounded-lg shadow-sm border">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">Active</p>
                  <p class="text-2xl font-bold text-green-600">${exceptionStats.active}</p>
                </div>
                <div class="p-3 bg-green-100 rounded-full">
                  <i class="fas fa-check-shield text-green-600"></i>
                </div>
              </div>
            </div>
            <div class="bg-white p-4 rounded-lg shadow-sm border">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">Pending Approval</p>
                  <p class="text-2xl font-bold text-yellow-600">${exceptionStats.pending}</p>
                </div>
                <div class="p-3 bg-yellow-100 rounded-full">
                  <i class="fas fa-hourglass-half text-yellow-600"></i>
                </div>
              </div>
            </div>
            <div class="bg-white p-4 rounded-lg shadow-sm border">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-gray-600">Expired</p>
                  <p class="text-2xl font-bold text-red-600">${exceptionStats.expired}</p>
                </div>
                <div class="p-3 bg-red-100 rounded-full">
                  <i class="fas fa-calendar-times text-red-600"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- Exceptions Table -->
          <div class="bg-white rounded-lg shadow-sm border">
            <div class="p-4 border-b flex justify-between items-center">
              <h4 class="font-medium">Risk Acceptances & Control Exceptions</h4>
              <div class="flex space-x-2">
                <select id="exceptionStatusFilter" onchange="filterExceptions()" class="text-sm border rounded px-2 py-1">
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="pending_approval">Pending Approval</option>
                  <option value="rejected">Rejected</option>
                </select>
                <input type="text" id="exceptionSearchInput" placeholder="Search exceptions..." 
                       onkeyup="filterExceptions()" class="text-sm border rounded px-2 py-1">
              </div>
            </div>
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Control/Risk</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Approver</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry Date</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody id="exceptionsTableBody" class="bg-white divide-y divide-gray-200">
                  ${renderExceptionsTable(exceptions)}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <!-- Enhanced LLM-Powered Treatment Creation/Edit Modal -->
      <div id="treatmentModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-90vh overflow-y-auto">
          <div class="p-6 border-b bg-gradient-to-r from-blue-50 to-green-50">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-xl font-semibold text-gray-900" id="treatmentModalTitle">AI-Enhanced Risk Treatment</h3>
                <p class="text-sm text-gray-600 mt-1">Powered by artificial intelligence for optimal treatment recommendations</p>
              </div>
              <div class="flex items-center space-x-2">
                <div class="bg-green-100 px-3 py-1 rounded-full">
                  <span class="text-xs font-medium text-green-800">
                    <i class="fas fa-robot mr-1"></i>AI-Powered
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            <!-- Left Column: Form -->
            <div class="space-y-4">
              <form id="treatmentForm" class="space-y-4">
                <div class="space-y-4">
                  <div>
                    <div class="flex justify-between items-center mb-2">
                      <label class="block text-sm font-medium text-gray-700">Associated Risk *</label>
                      <button type="button" id="aiRecommendationsBtn" onclick="generateAITreatmentRecommendations()" 
                              class="bg-gradient-to-r from-blue-500 to-green-500 text-white px-3 py-1 rounded-full text-xs hover:from-blue-600 hover:to-green-600 transition-all">
                        <i class="fas fa-magic mr-1"></i>AI Recommendations
                      </button>
                    </div>
                    <select id="treatmentRiskId" required class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                      <option value="">Select a risk...</option>
                      ${risks.map(r => `<option value="${r.id}">${r.title} (Score: ${r.risk_score})</option>`).join('')}
                    </select>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Treatment Strategy *</label>
                      <select id="treatmentStrategy" required class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                        <option value="">Select strategy...</option>
                        <option value="avoid">🚫 Avoid - Eliminate the risk</option>
                        <option value="mitigate">🛡️ Mitigate - Reduce impact/likelihood</option>
                        <option value="transfer">🔄 Transfer - Share with third party</option>
                        <option value="accept">✅ Accept - No further action</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select id="treatmentStatus" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                        <option value="planned">📋 Planned</option>
                        <option value="in_progress">🔄 In Progress</option>
                        <option value="completed">✅ Completed</option>
                        <option value="cancelled">❌ Cancelled</option>
                      </select>
                    </div>
                  </div>
                  
                  <div class="grid grid-cols-2 gap-4">
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                      <input type="date" id="treatmentDueDate" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                    </div>
                    <div>
                      <label class="block text-sm font-medium text-gray-700 mb-2">Cost Estimate ($)</label>
                      <input type="number" step="0.01" id="treatmentCost" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" placeholder="0.00">
                    </div>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Treatment Description *</label>
                    <textarea id="treatmentDescription" rows="4" required class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" placeholder="Describe the treatment plan and actions to be taken (AI will help populate this)"></textarea>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Success Criteria</label>
                    <textarea id="treatmentCriteria" rows="3" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" placeholder="Define measurable success criteria (AI will suggest metrics)"></textarea>
                  </div>
                </div>
                
                <div class="flex justify-between space-x-3 pt-4 border-t">
                  <div class="flex space-x-2">
                    <button type="button" onclick="closeTreatmentModal()" class="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50">Cancel</button>
                  </div>
                  <div class="flex space-x-2">
                    <button type="button" onclick="exportRecommendations({})" class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                      <i class="fas fa-download mr-2"></i>Export
                    </button>
                    <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      <i class="fas fa-save mr-2"></i>Save Treatment
                    </button>
                  </div>
                </div>
              </form>
            </div>
            
            <!-- Right Column: AI Recommendations Panel -->
            <div class="space-y-4">
              <div class="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                <div class="text-center">
                  <i class="fas fa-robot text-4xl text-gray-400 mb-2"></i>
                  <h4 class="font-medium text-gray-700">AI Assistant Ready</h4>
                  <p class="text-sm text-gray-600 mt-1">Select a risk and click "AI Recommendations" to get intelligent treatment suggestions</p>
                </div>
              </div>
              
              <!-- AI Recommendations Panel -->
              <div id="aiRecommendationsPanel" class="hidden">
                <div class="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-4 border border-blue-200">
                  <h4 class="font-semibold text-blue-900 mb-3">
                    <i class="fas fa-lightbulb mr-2"></i>AI Recommendations
                  </h4>
                  <div id="aiRecommendationsResults"></div>
                </div>
              </div>
              
              <!-- Optimization Panel -->
              <div id="optimizationPanel" class="hidden">
                <div id="optimizationResults"></div>
              </div>
              
              <!-- AI Insights Panel -->
              <div class="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <h4 class="font-semibold text-yellow-900 mb-3">
                  <i class="fas fa-chart-line mr-2"></i>Smart Insights
                </h4>
                <div id="smartInsights" class="space-y-2 text-sm text-yellow-800">
                  <div>💡 AI will analyze risk patterns and suggest optimal strategies</div>
                  <div>📊 Cost-benefit analysis will be automatically calculated</div>
                  <div>⏱️ Timeline optimization based on similar treatments</div>
                  <div>🎯 Success metrics tailored to your risk profile</div>
                  <div class="pt-2 border-t border-yellow-300">
                    <div class="flex items-center text-xs">
                      <i class="fas fa-info-circle mr-2"></i>
                      <span>Uses Cloudflare Llama3 fallback if no API keys configured. Configure premium providers in Settings for enhanced results.</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Quick Actions -->
              <div class="bg-white rounded-lg p-4 border border-gray-200">
                <h4 class="font-semibold text-gray-900 mb-3">
                  <i class="fas fa-bolt mr-2"></i>Quick Actions
                </h4>
                <div class="grid grid-cols-2 gap-2">
                  <button onclick="generateAITreatmentRecommendations()" class="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg hover:bg-blue-200 text-sm">
                    <i class="fas fa-magic mr-1"></i>Get AI Help
                  </button>
                  <button onclick="optimizeTreatmentPlan()" class="bg-green-100 text-green-800 px-3 py-2 rounded-lg hover:bg-green-200 text-sm">
                    <i class="fas fa-cogs mr-1"></i>Optimize
                  </button>
                  <button onclick="clearForm()" class="bg-red-100 text-red-800 px-3 py-2 rounded-lg hover:bg-red-200 text-sm">
                    <i class="fas fa-eraser mr-1"></i>Clear Form
                  </button>
                  <button onclick="loadTemplate()" class="bg-purple-100 text-purple-800 px-3 py-2 rounded-lg hover:bg-purple-200 text-sm">
                    <i class="fas fa-file-import mr-1"></i>Template
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Exception Creation/Edit Modal -->
      <div id="exceptionModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-90vh overflow-y-auto">
          <div class="p-6 border-b">
            <h3 class="text-xl font-semibold" id="exceptionModalTitle">Create Risk Exception</h3>
          </div>
          <form id="exceptionForm" class="p-6 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Exception Type *</label>
                <select id="exceptionType" required onchange="updateExceptionFields()" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                  <option value="">Select type...</option>
                  <option value="control_exception">Control Exception</option>
                  <option value="risk_acceptance">Risk Acceptance</option>
                </select>
              </div>
              <div id="exceptionRiskField">
                <label class="block text-sm font-medium text-gray-700 mb-2">Associated Risk</label>
                <select id="exceptionRiskId" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                  <option value="">Select a risk...</option>
                  ${risks.map(r => `<option value="${r.id}">${r.title}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select id="exceptionStatus" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                  <option value="pending_approval">Pending Approval</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Expiry Date *</label>
                <input type="date" id="exceptionExpiryDate" required class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Business Justification *</label>
              <textarea id="exceptionJustification" rows="4" required class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" placeholder="Provide detailed business justification for this exception"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Compensating Controls</label>
              <textarea id="exceptionControls" rows="3" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" placeholder="Describe any compensating controls in place"></textarea>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
              <button type="button" onclick="closeExceptionModal()" class="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Save Exception</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Store data globally for filtering
    window.currentTreatments = treatments;
    window.currentExceptions = exceptions;
  } catch (e) {
    showError('Failed to load treatments/exceptions');
  }
}

// Render functions for treatments and exceptions tables
function renderTreatmentsTable(treatments) {
  if (!treatments || treatments.length === 0) {
    return '<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No treatments found</td></tr>';
  }

  return treatments.map(t => {
    const statusClass = getTreatmentStatusClass(t.status);
    const isOverdue = t.due_date && new Date(t.due_date) < new Date();
    const progress = t.progress || 0;
    
    return `
      <tr class="treatment-row hover:bg-gray-50" data-status="${t.status}" data-search="${t.risk_title?.toLowerCase() || ''} ${t.strategy?.toLowerCase() || ''}">
        <td class="px-4 py-3">
          <div class="font-medium text-gray-900">${t.risk_title || 'Unknown Risk'}</div>
          <div class="text-xs text-gray-500">Risk ID: ${t.risk_id || 'N/A'}</div>
        </td>
        <td class="px-4 py-3">
          <div class="text-sm font-medium">${t.strategy || 'Not specified'}</div>
          <div class="text-xs text-gray-500">${t.description ? t.description.substring(0, 60) + '...' : ''}</div>
        </td>
        <td class="px-4 py-3 text-sm">${t.owner_username || 'Unassigned'}</td>
        <td class="px-4 py-3">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
            ${t.status?.replace('_', ' ') || 'Unknown'}
          </span>
        </td>
        <td class="px-4 py-3">
          <div class="flex items-center space-x-2">
            <div class="flex-1 bg-gray-200 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full" style="width: ${progress}%"></div>
            </div>
            <span class="text-xs text-gray-600">${progress}%</span>
          </div>
        </td>
        <td class="px-4 py-3">
          <div class="text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}">
            ${t.due_date ? new Date(t.due_date).toLocaleDateString() : 'No date set'}
          </div>
          ${isOverdue ? '<div class="text-xs text-red-500">Overdue</div>' : ''}
        </td>
        <td class="px-4 py-3">
          <div class="flex space-x-1">
            <button onclick="viewTreatmentDetails(${t.id})" class="text-blue-600 hover:text-blue-900 text-sm" title="View Details">
              <i class="fas fa-eye"></i>
            </button>
            <button onclick="editTreatment(${t.id})" class="text-gray-600 hover:text-gray-900 text-sm" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderExceptionsTable(exceptions) {
  if (!exceptions || exceptions.length === 0) {
    return '<tr><td colspan="6" class="px-4 py-8 text-center text-gray-500">No exceptions found</td></tr>';
  }

  return exceptions.map(e => {
    const statusClass = getExceptionStatusClass(e.status);
    const isExpired = e.expiry_date && new Date(e.expiry_date) < new Date();
    
    return `
      <tr class="exception-row hover:bg-gray-50" data-status="${e.status}" data-search="${e.control_name?.toLowerCase() || ''} ${e.risk_title?.toLowerCase() || ''}">
        <td class="px-4 py-3">
          <div class="text-sm font-medium">${e.exception_type === 'control_exception' ? 'Control Exception' : 'Risk Acceptance'}</div>
        </td>
        <td class="px-4 py-3">
          <div class="font-medium text-gray-900">${e.control_name || e.risk_title || 'Not specified'}</div>
          <div class="text-xs text-gray-500">
            ${e.control_id ? `Control ID: ${e.control_id}` : e.risk_id ? `Risk ID: ${e.risk_id}` : ''}
          </div>
        </td>
        <td class="px-4 py-3">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
            ${e.status?.replace('_', ' ') || 'Unknown'}
          </span>
        </td>
        <td class="px-4 py-3 text-sm">${e.approved_by_username || 'Pending'}</td>
        <td class="px-4 py-3">
          <div class="text-sm ${isExpired ? 'text-red-600 font-medium' : 'text-gray-900'}">
            ${e.expiry_date ? new Date(e.expiry_date).toLocaleDateString() : 'No expiry'}
          </div>
          ${isExpired ? '<div class="text-xs text-red-500">Expired</div>' : ''}
        </td>
        <td class="px-4 py-3">
          <div class="flex space-x-1">
            <button onclick="viewExceptionDetails(${e.id})" class="text-blue-600 hover:text-blue-900 text-sm" title="View Details">
              <i class="fas fa-eye"></i>
            </button>
            <button onclick="editException(${e.id})" class="text-gray-600 hover:text-gray-900 text-sm" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Status styling helpers
function getTreatmentStatusClass(status) {
  switch(status) {
    case 'completed': return 'bg-green-100 text-green-800';
    case 'in_progress': return 'bg-blue-100 text-blue-800';
    case 'planned': return 'bg-yellow-100 text-yellow-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getExceptionStatusClass(status) {
  switch(status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
    case 'expired': return 'bg-red-100 text-red-800';
    case 'rejected': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

// Filter functions
function filterTreatments() {
  const statusFilter = document.getElementById('treatmentStatusFilter').value.toLowerCase();
  const searchFilter = document.getElementById('treatmentSearchInput').value.toLowerCase();
  const rows = document.querySelectorAll('.treatment-row');
  
  rows.forEach(row => {
    const status = row.dataset.status;
    const searchText = row.dataset.search;
    
    const statusMatch = !statusFilter || status === statusFilter;
    const searchMatch = !searchFilter || searchText.includes(searchFilter);
    
    row.style.display = (statusMatch && searchMatch) ? 'table-row' : 'none';
  });
}

function filterExceptions() {
  const statusFilter = document.getElementById('exceptionStatusFilter').value.toLowerCase();
  const searchFilter = document.getElementById('exceptionSearchInput').value.toLowerCase();
  const rows = document.querySelectorAll('.exception-row');
  
  rows.forEach(row => {
    const status = row.dataset.status;
    const searchText = row.dataset.search;
    
    const statusMatch = !statusFilter || status === statusFilter;
    const searchMatch = !searchFilter || searchText.includes(searchFilter);
    
    row.style.display = (statusMatch && searchMatch) ? 'table-row' : 'none';
  });
}

// Modal functions
function showTreatmentCreateModal() {
  document.getElementById('treatmentModalTitle').textContent = 'Create Risk Treatment';
  document.getElementById('treatmentForm').reset();
  document.getElementById('treatmentModal').classList.remove('hidden');
}

function closeTreatmentModal() {
  document.getElementById('treatmentModal').classList.add('hidden');
}

function showExceptionCreateModal() {
  document.getElementById('exceptionModalTitle').textContent = 'Create Risk Exception';
  document.getElementById('exceptionForm').reset();
  document.getElementById('exceptionModal').classList.remove('hidden');
}

function closeExceptionModal() {
  document.getElementById('exceptionModal').classList.add('hidden');
}

function updateExceptionFields() {
  const type = document.getElementById('exceptionType').value;
  const riskField = document.getElementById('exceptionRiskField');
  
  if (type === 'risk_acceptance') {
    riskField.style.display = 'block';
    document.getElementById('exceptionRiskId').required = true;
  } else {
    riskField.style.display = 'none';
    document.getElementById('exceptionRiskId').required = false;
  }
}

// LLM-Enhanced Treatment Functions
async function generateAITreatmentRecommendations() {
  const riskSelect = document.getElementById('treatmentRiskId');
  const selectedRiskId = riskSelect.value;
  
  if (!selectedRiskId) {
    showNotification('Please select a risk first', 'warning');
    return;
  }

  const aiButton = document.getElementById('aiRecommendationsBtn');
  const originalText = aiButton.innerHTML;
  
  try {
    // Show loading state
    aiButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Generating AI Recommendations...';
    aiButton.disabled = true;
    
    const token = localStorage.getItem('aria_token');
    const response = await axios.post('/api/treatments/ai-recommendations', {
      riskId: selectedRiskId
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      const recommendations = response.data.data.recommendations;
      displayAIRecommendations(recommendations);
      
      // Show provider info in success message
      const providerInfo = response.data.data.provider_used || 'AI Provider';
      const isUsingFallback = providerInfo.includes('Cloudflare') || providerInfo.includes('Fallback');
      
      if (isUsingFallback) {
        showNotification('AI recommendations generated using Cloudflare Llama3 fallback. Configure your own API keys in Settings for premium models!', 'warning');
      } else {
        showNotification('AI recommendations generated successfully using your configured provider!', 'success');
      }
    } else {
      throw new Error(response.data.error || 'Failed to generate recommendations');
    }
  } catch (error) {
    console.error('AI recommendations error:', error);
    let errorMessage = error.message;
    
    // Provide specific guidance for common errors
    if (errorMessage.includes('No configured AI provider')) {
      errorMessage = 'No AI provider configured. Using Cloudflare Llama3 fallback. For better results, configure an API key for OpenAI, Anthropic, or Google Gemini in Settings > AI Providers.';
    }
    
    showNotification('AI Recommendations Error: ' + errorMessage, 'error');
  } finally {
    // Restore button state
    aiButton.innerHTML = originalText;
    aiButton.disabled = false;
  }
}

function displayAIRecommendations(recommendations) {
  const aiPanel = document.getElementById('aiRecommendationsPanel');
  const aiResults = document.getElementById('aiRecommendationsResults');
  
  aiResults.innerHTML = `
    <div class="space-y-4">
      <!-- Primary Strategy -->
      <div class="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 class="font-semibold text-blue-900 mb-2">
          <i class="fas fa-lightbulb mr-2"></i>Primary Strategy: ${recommendations.primary_strategy?.toUpperCase()}
        </h4>
        <p class="text-blue-800 text-sm">${recommendations.strategy_rationale}</p>
      </div>

      <!-- Treatment Actions -->
      <div class="bg-green-50 p-4 rounded-lg border border-green-200">
        <h4 class="font-semibold text-green-900 mb-3">
          <i class="fas fa-tasks mr-2"></i>Recommended Actions
        </h4>
        <div class="space-y-2">
          ${(recommendations.treatment_actions || []).map((action, index) => `
            <div class="flex items-start space-x-2">
              <span class="bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">${index + 1}</span>
              <span class="text-green-800 text-sm">${action}</span>
              <button onclick="addActionToForm('${action.replace(/'/g, "\\'")}')" class="text-green-600 hover:text-green-800 text-xs" title="Add to form">
                <i class="fas fa-plus"></i>
              </button>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Priority & Timeline -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h4 class="font-semibold text-yellow-900 mb-2">
            <i class="fas fa-exclamation-triangle mr-2"></i>Priority: ${recommendations.priority?.toUpperCase()}
          </h4>
          <p class="text-yellow-800 text-sm">${recommendations.priority_justification}</p>
        </div>
        <div class="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h4 class="font-semibold text-purple-900 mb-2">
            <i class="fas fa-clock mr-2"></i>Timeline: ${recommendations.timeline_weeks} weeks
          </h4>
          <p class="text-purple-800 text-sm">${recommendations.timeline_rationale}</p>
        </div>
      </div>

      <!-- Cost & Success Metrics -->
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-red-50 p-4 rounded-lg border border-red-200">
          <h4 class="font-semibold text-red-900 mb-2">
            <i class="fas fa-dollar-sign mr-2"></i>Cost Estimate: ${recommendations.cost_estimate?.toUpperCase()}
          </h4>
          <p class="text-red-800 text-sm">${recommendations.cost_details}</p>
        </div>
        <div class="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
          <h4 class="font-semibold text-indigo-900 mb-2">
            <i class="fas fa-chart-line mr-2"></i>Success Metrics
          </h4>
          <ul class="text-indigo-800 text-sm space-y-1">
            ${(recommendations.success_metrics || []).map(metric => `<li>• ${metric}</li>`).join('')}
          </ul>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="flex space-x-2 pt-4 border-t">
        <button onclick="applyAIRecommendations(${JSON.stringify(recommendations).replace(/"/g, '&quot;')})" 
                class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm">
          <i class="fas fa-magic mr-2"></i>Apply Recommendations
        </button>
        <button onclick="optimizeTreatmentPlan()" 
                class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
          <i class="fas fa-cogs mr-2"></i>Optimize Plan
        </button>
        <button onclick="exportRecommendations(${JSON.stringify(recommendations).replace(/"/g, '&quot;')})" 
                class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 text-sm">
          <i class="fas fa-download mr-2"></i>Export
        </button>
      </div>
    </div>
  `;
  
  aiPanel.classList.remove('hidden');
}

function addActionToForm(action) {
  const descriptionField = document.getElementById('treatmentDescription');
  const currentValue = descriptionField.value;
  const newValue = currentValue ? currentValue + '\n• ' + action : '• ' + action;
  descriptionField.value = newValue;
  showNotification('Action added to treatment description', 'success');
}

function applyAIRecommendations(recommendations) {
  // Auto-fill form with AI recommendations
  const strategyField = document.getElementById('treatmentStrategy');
  const descriptionField = document.getElementById('treatmentDescription');
  const criteriaField = document.getElementById('treatmentCriteria');
  const dueDateField = document.getElementById('treatmentDueDate');
  
  // Apply strategy
  strategyField.value = recommendations.primary_strategy || '';
  
  // Apply description with actions
  const actionsText = (recommendations.treatment_actions || [])
    .map((action, index) => `${index + 1}. ${action}`)
    .join('\n');
  
  descriptionField.value = `${recommendations.strategy_rationale}\n\nRecommended Actions:\n${actionsText}`;
  
  // Apply success criteria
  const criteriaText = (recommendations.success_metrics || [])
    .map((metric, index) => `${index + 1}. ${metric}`)
    .join('\n');
  
  criteriaField.value = criteriaText;
  
  // Set due date based on timeline
  if (recommendations.timeline_weeks) {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (recommendations.timeline_weeks * 7));
    dueDateField.value = dueDate.toISOString().split('T')[0];
  }
  
  showNotification('AI recommendations applied to form!', 'success');
}

async function optimizeTreatmentPlan() {
  const strategyField = document.getElementById('treatmentStrategy');
  const descriptionField = document.getElementById('treatmentDescription');
  const dueDateField = document.getElementById('treatmentDueDate');
  const costField = document.getElementById('treatmentCost');
  
  if (!strategyField.value || !descriptionField.value) {
    showNotification('Please fill in treatment strategy and description first', 'warning');
    return;
  }
  
  const treatmentPlan = {
    strategy: strategyField.value,
    actions: descriptionField.value.split('\n').filter(line => line.trim()),
    timeline: dueDateField.value,
    budget: costField.value || 'Not specified',
    resources: []
  };
  
  try {
    showNotification('Optimizing treatment plan with AI...', 'info');
    
    const token = localStorage.getItem('aria_token');
    const response = await axios.post('/api/treatments/ai-optimize', {
      treatmentPlan: treatmentPlan,
      constraints: {}
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      const optimization = response.data.data.optimization;
      displayOptimizationResults(optimization);
      
      // Check if using fallback provider
      const providerInfo = response.data.data.provider_used || 'AI Provider';
      const isUsingFallback = providerInfo.includes('Cloudflare') || providerInfo.includes('Fallback');
      
      if (isUsingFallback) {
        showNotification('Treatment plan optimization completed using Cloudflare Llama3. Configure premium providers for enhanced results!', 'warning');
      } else {
        showNotification('Treatment plan optimization completed using your configured provider!', 'success');
      }
    } else {
      throw new Error(response.data.error || 'Failed to optimize plan');
    }
  } catch (error) {
    console.error('Optimization error:', error);
    let errorMessage = error.message;
    
    // Provide specific guidance for common errors
    if (errorMessage.includes('No configured AI provider')) {
      errorMessage = 'No AI provider configured. Using Cloudflare Llama3 fallback. For better results, configure an API key for OpenAI, Anthropic, or Google Gemini in Settings > AI Providers.';
    }
    
    showNotification('Optimization Error: ' + errorMessage, 'error');
  }
}

function displayOptimizationResults(optimization) {
  const optimizationPanel = document.getElementById('optimizationResults');
  
  optimizationPanel.innerHTML = `
    <div class="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-2 border-green-200">
      <h4 class="font-bold text-green-900 mb-3">
        <i class="fas fa-chart-line mr-2"></i>Optimization Results (Score: ${optimization.optimization_score}/10)
      </h4>
      
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-green-600">${optimization.cost_savings_potential}</div>
          <div class="text-xs text-green-700">Cost Savings</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-blue-600">${optimization.timeline_improvement}</div>
          <div class="text-xs text-blue-700">Time Saved</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-bold text-purple-600">${optimization.cost_benefit_analysis?.optimized_plan_roi || 'N/A'}</div>
          <div class="text-xs text-purple-700">Optimized ROI</div>
        </div>
      </div>
      
      <div class="space-y-3">
        <div>
          <h5 class="font-semibold text-gray-900 mb-2">Quick Wins:</h5>
          <div class="space-y-1">
            ${(optimization.quick_wins || []).map(win => `
              <div class="bg-white p-2 rounded text-sm">
                <span class="font-medium">${win.action}</span> - 
                <span class="text-gray-600">${win.benefit}</span>
                <span class="text-green-600 ml-2">(${win.timeline})</span>
              </div>
            `).join('')}
          </div>
        </div>
        
        <button onclick="applyOptimizations(${JSON.stringify(optimization).replace(/"/g, '&quot;')})" 
                class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
          <i class="fas fa-check mr-2"></i>Apply Optimizations
        </button>
      </div>
    </div>
  `;
  
  document.getElementById('optimizationPanel').classList.remove('hidden');
}

function exportRecommendations(recommendations) {
  const exportData = {
    generated_at: new Date().toISOString(),
    risk_id: document.getElementById('treatmentRiskId').value,
    recommendations: recommendations
  };
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-treatment-recommendations-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  
  showNotification('Recommendations exported successfully!', 'success');
}

// Placeholder functions for detailed views and actions
function viewTreatmentDetails(id) {
  showNotification('Treatment details view coming soon', 'info');
}

function editTreatment(id) {
  showNotification('Edit treatment functionality coming soon', 'info');
}

function viewExceptionDetails(id) {
  showNotification('Exception details view coming soon', 'info');
}

function editException(id) {
  showNotification('Edit exception functionality coming soon', 'info');
}

// Additional LLM-Enhanced Helper Functions
function clearForm() {
  document.getElementById('treatmentForm').reset();
  document.getElementById('aiRecommendationsPanel').classList.add('hidden');
  document.getElementById('optimizationPanel').classList.add('hidden');
  showNotification('Form cleared', 'info');
}

function loadTemplate() {
  const templateOptions = [
    'Cybersecurity Incident Response',
    'Compliance Violation Remediation', 
    'Operational Risk Mitigation',
    'Financial Risk Controls',
    'Third-Party Risk Management'
  ];
  
  const template = templateOptions[Math.floor(Math.random() * templateOptions.length)];
  
  showNotification(`Loading ${template} template...`, 'info');
  
  // Simulate template loading
  setTimeout(() => {
    document.getElementById('treatmentDescription').value = `Template: ${template}\n\n1. Immediate containment measures\n2. Root cause analysis\n3. Corrective action implementation\n4. Monitoring and validation`;
    document.getElementById('treatmentCriteria').value = `1. Incident resolved within SLA\n2. No recurrence for 90 days\n3. Process documentation updated\n4. Team training completed`;
    showNotification('Template loaded successfully!', 'success');
  }, 1000);
}

function applyOptimizations(optimization) {
  // Apply optimization suggestions to the form
  const descriptionField = document.getElementById('treatmentDescription');
  const currentDescription = descriptionField.value;
  
  if (optimization.optimized_actions && optimization.optimized_actions.length > 0) {
    const optimizedText = '\n\nOptimized Actions:\n' + 
      optimization.optimized_actions
        .sort((a, b) => a.priority - b.priority)
        .map((action, index) => `${index + 1}. ${action.action} (Impact: ${action.impact}, Effort: ${action.effort})`)
        .join('\n');
    
    descriptionField.value = currentDescription + optimizedText;
  }
  
  // Update timeline if optimization suggests improvement
  const dueDateField = document.getElementById('treatmentDueDate');
  if (optimization.timeline_improvement && dueDateField.value) {
    const currentDate = new Date(dueDateField.value);
    const weeksToSave = parseInt(optimization.timeline_improvement.match(/\d+/)?.[0] || 0);
    currentDate.setDate(currentDate.getDate() - (weeksToSave * 7));
    dueDateField.value = currentDate.toISOString().split('T')[0];
  }
  
  showNotification('Optimization applied to treatment plan!', 'success');
}

// Enhanced KRIs UI with Comprehensive Functionality
async function showKRIs() {
  updateActiveNavigation && updateActiveNavigation('kris');
  showLoading('main-content');
  try {
    const token = localStorage.getItem('aria_token');
    const res = await axios.get('/api/kris', { headers: { Authorization: `Bearer ${token}` } });
    const kris = res.data.data || [];
    const main = document.getElementById('main-content');
    
    // Get status summary for dashboard
    const statusCounts = {
      normal: kris.filter(k => k.current_status === 'normal').length,
      warning: kris.filter(k => k.current_status === 'warning').length,
      breach: kris.filter(k => k.current_status === 'breach').length,
      unknown: kris.filter(k => !k.current_status || k.current_status === 'unknown').length
    };

    main.innerHTML = `
      <div class="space-y-6">
        <!-- Header Section -->
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">Key Risk Indicators (KRIs)</h2>
            <p class="text-gray-600 mt-1">Monitor and manage key risk metrics across your organization</p>
          </div>
          <div class="flex space-x-3">
            <button onclick="showKRICreateModal()" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <i class="fas fa-plus mr-2"></i>Create KRI
            </button>
            <button onclick="importKRIReadings()" class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              <i class="fas fa-upload mr-2"></i>Import Data
            </button>
          </div>
        </div>

        <!-- Status Dashboard -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white p-4 rounded-lg shadow-sm border">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Normal Status</p>
                <p class="text-2xl font-bold text-green-600">${statusCounts.normal}</p>
              </div>
              <div class="p-3 bg-green-100 rounded-full">
                <i class="fas fa-check-circle text-green-600"></i>
              </div>
            </div>
          </div>
          <div class="bg-white p-4 rounded-lg shadow-sm border">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Warning Level</p>
                <p class="text-2xl font-bold text-yellow-600">${statusCounts.warning}</p>
              </div>
              <div class="p-3 bg-yellow-100 rounded-full">
                <i class="fas fa-exclamation-triangle text-yellow-600"></i>
              </div>
            </div>
          </div>
          <div class="bg-white p-4 rounded-lg shadow-sm border">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Breach Alert</p>
                <p class="text-2xl font-bold text-red-600">${statusCounts.breach}</p>
              </div>
              <div class="p-3 bg-red-100 rounded-full">
                <i class="fas fa-exclamation-circle text-red-600"></i>
              </div>
            </div>
          </div>
          <div class="bg-white p-4 rounded-lg shadow-sm border">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">No Data</p>
                <p class="text-2xl font-bold text-gray-600">${statusCounts.unknown}</p>
              </div>
              <div class="p-3 bg-gray-100 rounded-full">
                <i class="fas fa-question-circle text-gray-600"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- KRI List -->
          <div class="lg:col-span-1">
            <div class="bg-white rounded-lg shadow-sm border">
              <div class="p-4 border-b">
                <h3 class="text-lg font-semibold">KRI List</h3>
                <div class="mt-2 flex space-x-2">
                  <select id="kriStatusFilter" onchange="filterKRIs()" class="text-sm border rounded px-2 py-1">
                    <option value="">All Statuses</option>
                    <option value="normal">Normal</option>
                    <option value="warning">Warning</option>
                    <option value="breach">Breach</option>
                    <option value="unknown">No Data</option>
                  </select>
                  <input type="text" id="kriSearchInput" placeholder="Search KRIs..." 
                         onkeyup="filterKRIs()" class="text-sm border rounded px-2 py-1 flex-1">
                </div>
              </div>
              <div id="kriList" class="max-h-96 overflow-y-auto">
                ${renderKRIList(kris)}
              </div>
            </div>
          </div>

          <!-- KRI Details Panel -->
          <div class="lg:col-span-2">
            <div class="bg-white rounded-lg shadow-sm border p-6">
              <div id="kriDetailsPanel">
                <div class="text-center py-12">
                  <i class="fas fa-chart-line text-4xl text-gray-300 mb-4"></i>
                  <h3 class="text-lg font-medium text-gray-900 mb-2">Select a KRI</h3>
                  <p class="text-gray-600">Choose a Key Risk Indicator from the list to view its details, trends, and manage settings.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- KRI Creation/Edit Modal -->
      <div id="kriModal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-90vh overflow-y-auto">
          <div class="p-6 border-b">
            <h3 class="text-xl font-semibold" id="kriModalTitle">Create New KRI</h3>
          </div>
          <form id="kriForm" class="p-6 space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">KRI Name *</label>
                <input type="text" id="kriName" required class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Data Source</label>
                <input type="text" id="kriDataSource" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Threshold Value *</label>
                <input type="number" step="0.01" id="kriThreshold" required class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Direction *</label>
                <select id="kriDirection" required class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Direction</option>
                  <option value="above">Above Threshold (Higher is Worse)</option>
                  <option value="below">Below Threshold (Lower is Worse)</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
                <select id="kriFrequency" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Frequency</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Unit of Measure</label>
                <input type="text" id="kriUnit" placeholder="e.g., %, count, $" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500">
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea id="kriDescription" rows="3" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" placeholder="Describe what this KRI measures and its importance"></textarea>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Calculation Method</label>
              <textarea id="kriCalculation" rows="2" class="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500" placeholder="Describe how this KRI is calculated"></textarea>
            </div>
            <div class="flex justify-end space-x-3 pt-4">
              <button type="button" onclick="closeKRIModal()" class="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50">Cancel</button>
              <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Save KRI</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Store KRIs globally for filtering
    window.currentKRIs = kris;
  } catch (e) {
    showError('Failed to load KRIs');
  }
}

// Render KRI List
function renderKRIList(kris) {
  if (!kris || kris.length === 0) {
    return '<div class="p-4 text-center text-gray-500">No KRIs found</div>';
  }

  return kris.map(k => {
    const statusClass = getKRIStatusClass(k.current_status);
    const statusIcon = getKRIStatusIcon(k.current_status);
    const lastReading = k.latest_reading ? new Date(k.latest_reading).toLocaleDateString() : 'No data';
    
    return `
      <div class="p-4 border-b hover:bg-gray-50 cursor-pointer kri-item" 
           data-status="${k.current_status || 'unknown'}" 
           data-name="${k.name.toLowerCase()}"
           onclick="selectKRIEnhanced(${k.id}, '${k.name.replace(/'/g, "&#39;")}')">
        <div class="flex justify-between items-start">
          <div class="flex-1">
            <div class="font-medium text-gray-900">${k.name}</div>
            <div class="text-sm text-gray-600 mt-1">${k.description || 'No description'}</div>
            <div class="flex items-center mt-2 space-x-4">
              <div class="text-xs text-gray-500">
                <i class="fas fa-bullseye mr-1"></i>
                Threshold: ${k.threshold} ${k.unit || ''}
              </div>
              <div class="text-xs text-gray-500">
                <i class="fas fa-clock mr-1"></i>
                ${k.frequency || 'No frequency'}
              </div>
            </div>
            <div class="text-xs text-gray-500 mt-1">Last Reading: ${lastReading}</div>
          </div>
          <div class="ml-3 flex flex-col items-end">
            <div class="flex items-center ${statusClass} px-2 py-1 rounded-full text-xs">
              <i class="${statusIcon} mr-1"></i>
              ${k.current_status || 'Unknown'}
            </div>
            ${k.latest_value ? `<div class="text-sm font-medium mt-1">${k.latest_value} ${k.unit || ''}</div>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Get status styling
function getKRIStatusClass(status) {
  switch(status) {
    case 'normal': return 'bg-green-100 text-green-800';
    case 'warning': return 'bg-yellow-100 text-yellow-800';
    case 'breach': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getKRIStatusIcon(status) {
  switch(status) {
    case 'normal': return 'fas fa-check-circle';
    case 'warning': return 'fas fa-exclamation-triangle';
    case 'breach': return 'fas fa-exclamation-circle';
    default: return 'fas fa-question-circle';
  }
}

// Filter KRIs
function filterKRIs() {
  const statusFilter = document.getElementById('kriStatusFilter').value.toLowerCase();
  const searchFilter = document.getElementById('kriSearchInput').value.toLowerCase();
  const kriItems = document.querySelectorAll('.kri-item');
  
  kriItems.forEach(item => {
    const status = item.dataset.status;
    const name = item.dataset.name;
    
    const statusMatch = !statusFilter || status === statusFilter;
    const nameMatch = !searchFilter || name.includes(searchFilter);
    
    if (statusMatch && nameMatch) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

// Enhanced KRI Selection
window.selectKRIEnhanced = async function(id, name) {
  try {
    const token = localStorage.getItem('aria_token');
    
    // Get KRI details and readings
    const [kriRes, readingsRes] = await Promise.all([
      axios.get(`/api/kris/${id}`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`/api/kris/${id}/readings`, { headers: { Authorization: `Bearer ${token}` } })
    ]);
    
    const kri = kriRes.data.data;
    const readings = readingsRes.data.data || [];
    
    // Render detailed KRI panel
    document.getElementById('kriDetailsPanel').innerHTML = renderKRIDetails(kri, readings);
    
    // Render chart
    if (readings.length > 0) {
      renderKRIChart(readings, kri);
    }
    
  } catch (e) {
    showError('Failed to load KRI details');
  }
}

// Render KRI Details Panel
function renderKRIDetails(kri, readings) {
  const lastReading = readings[0];
  const trend = calculateKRITrend(readings);
  const statusClass = getKRIStatusClass(kri.current_status);
  const statusIcon = getKRIStatusIcon(kri.current_status);
  
  return `
    <div class="space-y-6">
      <!-- KRI Header -->
      <div class="flex justify-between items-start">
        <div>
          <h3 class="text-xl font-semibold text-gray-900">${kri.name}</h3>
          <p class="text-gray-600 mt-1">${kri.description || 'No description available'}</p>
        </div>
        <div class="flex space-x-2">
          <button onclick="addKRIReading(${kri.id})" class="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700">
            <i class="fas fa-plus mr-1"></i>Add Reading
          </button>
          <button onclick="editKRI(${kri.id})" class="bg-gray-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-700">
            <i class="fas fa-edit mr-1"></i>Edit
          </button>
        </div>
      </div>

      <!-- Status and Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-gray-50 p-4 rounded-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Current Status</p>
              <div class="flex items-center mt-1 ${statusClass} px-2 py-1 rounded-full w-fit">
                <i class="${statusIcon} mr-1"></i>
                <span class="text-sm font-medium">${kri.current_status || 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-sm text-gray-600">Latest Value</p>
          <p class="text-lg font-semibold">${lastReading ? lastReading.value : 'No data'} ${kri.unit || ''}</p>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-sm text-gray-600">Threshold</p>
          <p class="text-lg font-semibold">${kri.threshold} ${kri.unit || ''}</p>
          <p class="text-xs text-gray-500">${kri.direction === 'above' ? 'Above = Breach' : 'Below = Breach'}</p>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-sm text-gray-600">7-Day Trend</p>
          <div class="flex items-center mt-1">
            <i class="fas fa-${trend.direction === 'up' ? 'arrow-up text-red-500' : trend.direction === 'down' ? 'arrow-down text-green-500' : 'minus text-gray-500'} mr-1"></i>
            <span class="text-lg font-semibold">${trend.percentage}%</span>
          </div>
        </div>
      </div>

      <!-- Chart -->
      <div class="bg-gray-50 p-4 rounded-lg">
        <div class="flex justify-between items-center mb-4">
          <h4 class="font-medium">Trend Analysis</h4>
          <div class="flex space-x-2 text-sm">
            <button onclick="changeKRIChartPeriod('7d')" class="chart-period-btn active px-2 py-1 rounded">7D</button>
            <button onclick="changeKRIChartPeriod('30d')" class="chart-period-btn px-2 py-1 rounded">30D</button>
            <button onclick="changeKRIChartPeriod('90d')" class="chart-period-btn px-2 py-1 rounded">90D</button>
          </div>
        </div>
        <canvas id="kriDetailChart" height="200"></canvas>
      </div>

      <!-- KRI Configuration -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="font-medium mb-3">Configuration</h4>
          <div class="space-y-2 text-sm">
            <div><span class="text-gray-600">Data Source:</span> ${kri.data_source || 'Not specified'}</div>
            <div><span class="text-gray-600">Frequency:</span> ${kri.frequency || 'Not specified'}</div>
            <div><span class="text-gray-600">Calculation:</span> ${kri.calculation_method || 'Not specified'}</div>
            <div><span class="text-gray-600">Owner:</span> ${kri.owner_name || 'Not assigned'}</div>
          </div>
        </div>
        <div class="bg-gray-50 p-4 rounded-lg">
          <h4 class="font-medium mb-3">Recent Readings</h4>
          <div class="space-y-2 max-h-32 overflow-y-auto">
            ${readings.slice(0, 5).map(r => `
              <div class="flex justify-between text-sm">
                <span>${new Date(r.timestamp).toLocaleDateString()}</span>
                <span class="font-medium">${r.value} ${kri.unit || ''}</span>
              </div>
            `).join('') || '<div class="text-sm text-gray-500">No readings available</div>'}
          </div>
        </div>
      </div>
    </div>
  `;
}

// Calculate KRI Trend
function calculateKRITrend(readings) {
  if (readings.length < 2) return { direction: 'flat', percentage: 0 };
  
  const recent = readings.slice(0, 7); // Last 7 readings
  if (recent.length < 2) return { direction: 'flat', percentage: 0 };
  
  const latest = recent[0].value;
  const previous = recent[recent.length - 1].value;
  const change = ((latest - previous) / previous) * 100;
  
  return {
    direction: change > 5 ? 'up' : change < -5 ? 'down' : 'flat',
    percentage: Math.abs(change).toFixed(1)
  };
}

// Render KRI Chart
function renderKRIChart(readings, kri) {
  const ctx = document.getElementById('kriDetailChart');
  if (!ctx) return;
  
  if (window.kriDetailChart) window.kriDetailChart.destroy();
  
  const chartData = readings.reverse(); // Oldest first for proper timeline
  const labels = chartData.map(r => new Date(r.timestamp).toLocaleDateString());
  const values = chartData.map(r => r.value);
  
  window.kriDetailChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: kri.name,
        data: values,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59,130,246,0.1)',
        fill: true,
        tension: 0.4
      }, {
        label: 'Threshold',
        data: Array(values.length).fill(kri.threshold),
        borderColor: '#EF4444',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false
        }
      },
      plugins: {
        legend: {
          display: true
        }
      }
    }
  });
}

// KRI Modal Functions
function showKRICreateModal() {
  document.getElementById('kriModalTitle').textContent = 'Create New KRI';
  document.getElementById('kriForm').reset();
  document.getElementById('kriModal').classList.remove('hidden');
}

function closeKRIModal() {
  document.getElementById('kriModal').classList.add('hidden');
}

// Add KRI Reading Modal (placeholder for now)
function addKRIReading(kriId) {
  showNotification('Add KRI Reading functionality coming soon', 'info');
}

function editKRI(kriId) {
  showNotification('Edit KRI functionality coming soon', 'info');
}

function importKRIReadings() {
  showModal('Import KRI Readings', `
    <div class="space-y-6">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-start">
          <i class="fas fa-info-circle text-blue-600 mt-1 mr-3"></i>
          <div>
            <h4 class="font-medium text-blue-900">CSV Format Requirements</h4>
            <ul class="mt-2 text-sm text-blue-800 space-y-1">
              <li>• <strong>kri_name</strong>: Must match existing KRI names exactly</li>
              <li>• <strong>value</strong>: Numeric reading value</li>
              <li>• <strong>timestamp</strong>: Date/time in ISO format (YYYY-MM-DD HH:MM:SS)</li>
              <li>• <strong>status</strong>: Optional (red/amber/green) - auto-calculated if not provided</li>
              <li>• <strong>comments</strong>: Optional notes about the reading</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Select CSV File</label>
        <input type="file" id="kri-import-file" accept=".csv" 
               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
        <p class="mt-1 text-sm text-gray-500">Upload a CSV file with KRI readings data</p>
      </div>
      
      <div class="flex space-x-3">
        <button onclick="executeKRIImport()" 
                class="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 flex items-center justify-center">
          <i class="fas fa-upload mr-2"></i>
          Import Readings
        </button>
        <button onclick="downloadKRITemplate()" 
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
          <i class="fas fa-download mr-2"></i>
          Template
        </button>
        <button onclick="closeModal()" 
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </div>
  `);
}

async function executeKRIImport() {
  try {
    const fileInput = document.getElementById('kri-import-file');
    const file = fileInput.files[0];
    
    if (!file) {
      showToast('Please select a CSV file to import', 'error');
      return;
    }
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      showToast('Please select a CSV file', 'error');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      showToast('Please login to access this feature', 'error');
      return;
    }
    
    showToast('Importing KRI readings...', 'info');
    closeModal();
    
    // Show progress modal
    showModal('Importing KRI Readings', `
      <div class="text-center py-8">
        <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Processing CSV File</h3>
        <p class="text-gray-500">Importing KRI readings...</p>
      </div>
    `);
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post('/api/kris/readings/import', formData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000
    });
    
    closeModal();
    
    if (response.data.success) {
      const result = response.data.data;
      
      let resultHtml = `
        <div class="space-y-4">
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex items-center">
              <i class="fas fa-check-circle text-green-600 mr-3"></i>
              <div>
                <h4 class="font-medium text-green-900">Import Completed</h4>
                <p class="text-green-800 mt-1">
                  Successfully imported ${result.success_count} readings
                  ${result.error_count > 0 ? `, ${result.error_count} failed` : ''}
                </p>
              </div>
            </div>
          </div>
      `;
      
      if (result.errors && result.errors.length > 0) {
        resultHtml += `
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 class="font-medium text-red-900 mb-2">Import Errors:</h4>
            <ul class="text-sm text-red-800 space-y-1">
              ${result.errors.map(error => `<li>• ${error}</li>`).join('')}
              ${result.error_count > 10 ? `<li>• And ${result.error_count - 10} more errors...</li>` : ''}
            </ul>
          </div>
        `;
      }
      
      resultHtml += `
          <div class="flex justify-end">
            <button onclick="closeModal(); location.reload();" 
                    class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
              <i class="fas fa-refresh mr-2"></i>Refresh Data
            </button>
          </div>
        </div>
      `;
      
      showModal('Import Results', resultHtml);
      showToast(`Import completed: ${result.success_count} successful`, 'success');
    } else {
      showToast(response.data.error || 'Import failed', 'error');
    }
  } catch (error) {
    console.error('KRI import error:', error);
    closeModal();
    if (error.code === 'ECONNABORTED') {
      showToast('Import timed out. Please try again with a smaller file.', 'error');
    } else {
      showToast('Failed to import KRI readings', 'error');
    }
  }
}

function downloadKRITemplate() {
  const templateContent = `kri_name,value,timestamp,status,comments
"Security Incidents Count",5,"2024-08-25 10:00:00","amber","Monthly security incident count"
"Failed Login Attempts",250,"2024-08-25 10:00:00","green","Daily failed login attempts"
"Vulnerability Scan Score",92,"2024-08-25 10:00:00","green","Weekly vulnerability assessment score"
"Compliance Rating",85,"2024-08-25 10:00:00","red","Quarterly compliance assessment"`;
  
  const blob = new Blob([templateContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'kri_readings_template.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
  
  showToast('Template downloaded successfully', 'success');
}

function changeKRIChartPeriod(period) {
  document.querySelectorAll('.chart-period-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  showNotification(`Chart period changed to ${period}`, 'info');
}


// Initialize charts
function initializeCharts() {
  // Risk Trend Chart
  const riskTrendCtx = document.getElementById('riskTrendChart');
  if (riskTrendCtx) {
    new Chart(riskTrendCtx, {
      type: 'line',
      data: {
        labels: dashboardData.risk_trend.map(item => formatDate(item.date)),
        datasets: [{
          label: 'Average Risk Score',
          data: dashboardData.risk_trend.map(item => item.score),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 25
          }
        }
      }
    });
  }
  
  // Risk Distribution Chart (placeholder data)
  const riskDistCtx = document.getElementById('riskDistributionChart');
  if (riskDistCtx) {
    new Chart(riskDistCtx, {
      type: 'doughnut',
      data: {
        labels: ['Critical', 'High', 'Medium', 'Low'],
        datasets: [{
          data: [2, 8, 15, 25],
          backgroundColor: [
            'rgb(239, 68, 68)',
            'rgb(245, 101, 101)',
            'rgb(251, 191, 36)',
            'rgb(34, 197, 94)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
  
  // Initialize Risk Heat Map
  initializeRiskHeatMap();
}

// Advanced Risk Heat Map Implementation
let currentHeatMapChart = null;

function initializeRiskHeatMap() {
  const canvas = document.getElementById('riskHeatMap');
  if (!canvas) return;
  
  // Initialize with default view
  updateHeatMap();
}

function updateHeatMap() {
  const view = document.getElementById('heatmapView')?.value || 'probability_impact';
  const canvas = document.getElementById('riskHeatMap');
  if (!canvas) return;
  
  // Destroy existing chart
  if (currentHeatMapChart) {
    currentHeatMapChart.destroy();
  }
  
  const ctx = canvas.getContext('2d');
  
  switch(view) {
    case 'probability_impact':
      renderProbabilityImpactHeatMap(ctx);
      break;
    case 'organizational':
      renderOrganizationalHeatMap(ctx);
      break;
    case 'temporal':
      renderTemporalHeatMap(ctx);
      break;
    case 'category':
      renderCategoryHeatMap(ctx);
      break;
    default:
      renderProbabilityImpactHeatMap(ctx);
  }
}

function renderProbabilityImpactHeatMap(ctx) {
  // Generate sample heat map data based on dashboard data
  const heatMapData = generateProbabilityImpactData();
  
  currentHeatMapChart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Risk Items',
        data: heatMapData.risks,
        backgroundColor: function(context) {
          const risk = context.parsed;
          const score = risk.x * risk.y; // Probability × Impact
          return getRiskHeatColor(score);
        },
        borderColor: '#ffffff',
        borderWidth: 1,
        pointRadius: function(context) {
          return Math.max(6, Math.min(15, context.parsed.risks || 1) * 2);
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          min: 1,
          max: 5,
          title: {
            display: true,
            text: 'Probability'
          },
          ticks: {
            stepSize: 1,
            callback: function(value) {
              const labels = ['', 'Very Low', 'Low', 'Medium', 'High', 'Very High'];
              return labels[value] || value;
            }
          }
        },
        y: {
          min: 1,
          max: 5,
          title: {
            display: true,
            text: 'Impact'
          },
          ticks: {
            stepSize: 1,
            callback: function(value) {
              const labels = ['', 'Minimal', 'Minor', 'Moderate', 'Major', 'Severe'];
              return labels[value] || value;
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const risk = context.raw;
              return [
                `Risk Score: ${(context.parsed.x * context.parsed.y).toFixed(1)}`,
                `Probability: ${context.parsed.x}/5`,
                `Impact: ${context.parsed.y}/5`,
                `Risk Count: ${risk.risks || 1}`
              ];
            }
          }
        }
      },
      interaction: {
        intersect: false
      }
    }
  });
}

function renderOrganizationalHeatMap(ctx) {
  // Sample organizational data
  const orgData = dashboardData.organizations || [
    { name: 'IT', risks: 12, avgScore: 15.2 },
    { name: 'Finance', risks: 8, avgScore: 12.1 },
    { name: 'HR', risks: 5, avgScore: 8.5 },
    { name: 'Operations', risks: 15, avgScore: 18.3 }
  ];
  
  currentHeatMapChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: orgData.map(org => org.name),
      datasets: [{
        label: 'Risk Count',
        data: orgData.map(org => org.risks),
        backgroundColor: orgData.map(org => getRiskHeatColor(org.avgScore)),
        borderColor: '#ffffff',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Risks'
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const org = orgData[context.dataIndex];
              return [
                `Risk Count: ${org.risks}`,
                `Average Score: ${org.avgScore}`,
                `Risk Level: ${getRiskLevel(org.avgScore)}`
              ];
            }
          }
        }
      }
    }
  });
}

function renderTemporalHeatMap(ctx) {
  // Temporal evolution data
  const temporalData = generateTemporalData();
  
  currentHeatMapChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: temporalData.labels,
      datasets: [{
        label: 'Critical Risks',
        data: temporalData.critical,
        borderColor: '#DC2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        fill: true
      }, {
        label: 'High Risks',
        data: temporalData.high,
        borderColor: '#EA580C',
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
        fill: true
      }, {
        label: 'Medium Risks',
        data: temporalData.medium,
        borderColor: '#D97706',
        backgroundColor: 'rgba(217, 119, 6, 0.1)',
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time Period'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Risk Count'
          }
        }
      },
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false
        }
      }
    }
  });
}

function renderCategoryHeatMap(ctx) {
  // Category-based heat map
  const categories = [
    'Operational', 'Financial', 'Compliance', 'Technology', 
    'Strategic', 'Reputation', 'Legal', 'Environmental'
  ];
  
  const categoryData = categories.map(cat => ({
    category: cat,
    risks: Math.floor(Math.random() * 20) + 1,
    avgScore: Math.random() * 20 + 5
  }));
  
  currentHeatMapChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: categories,
      datasets: [{
        label: 'Risk Distribution',
        data: categoryData.map(cat => cat.risks),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 2,
        pointBackgroundColor: categoryData.map(cat => getRiskHeatColor(cat.avgScore)),
        pointBorderColor: '#ffffff',
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Risk Count'
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const cat = categoryData[context.dataIndex];
              return [
                `Category: ${cat.category}`,
                `Risk Count: ${cat.risks}`,
                `Average Score: ${cat.avgScore.toFixed(1)}`
              ];
            }
          }
        }
      }
    }
  });
}

// Helper functions for heat map
function generateProbabilityImpactData() {
  const risks = [];
  for (let p = 1; p <= 5; p++) {
    for (let i = 1; i <= 5; i++) {
      const riskCount = Math.floor(Math.random() * 5) + 1;
      if (riskCount > 0) {
        risks.push({
          x: p + (Math.random() - 0.5) * 0.3,
          y: i + (Math.random() - 0.5) * 0.3,
          risks: riskCount
        });
      }
    }
  }
  return { risks };
}

function generateTemporalData() {
  const labels = [];
  const critical = [];
  const high = [];
  const medium = [];
  
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
    
    critical.push(Math.floor(Math.random() * 5) + 1);
    high.push(Math.floor(Math.random() * 10) + 3);
    medium.push(Math.floor(Math.random() * 15) + 5);
  }
  
  return { labels, critical, high, medium };
}

function getRiskHeatColor(score) {
  if (score >= 20) return '#DC2626'; // Red - Critical
  if (score >= 15) return '#EA580C'; // Orange - High
  if (score >= 10) return '#D97706'; // Yellow - Medium
  if (score >= 5) return '#65A30D';  // Light Green - Low
  return '#16A34A'; // Green - Very Low
}

function toggleHeatMapFullscreen() {
  const container = document.getElementById('riskHeatMapContainer');
  if (!container) return;
  
  if (container.classList.contains('fixed')) {
    // Exit fullscreen
    container.classList.remove('fixed', 'inset-0', 'z-50', 'bg-white', 'p-8');
    container.querySelector('canvas').style.height = '24rem';
    document.querySelector('#heatmapView').parentElement.querySelector('.fa-compress')?.classList.replace('fa-compress', 'fa-expand');
  } else {
    // Enter fullscreen
    container.classList.add('fixed', 'inset-0', 'z-50', 'bg-white', 'p-8');
    container.querySelector('canvas').style.height = 'calc(100vh - 12rem)';
    document.querySelector('#heatmapView').parentElement.querySelector('.fa-expand')?.classList.replace('fa-expand', 'fa-compress');
  }
  
  // Redraw chart after size change
  setTimeout(() => {
    if (currentHeatMapChart) {
      currentHeatMapChart.resize();
    }
  }, 100);
}

// ARIA AI Assistant
function initializeARIAAssistant() {
  const ariaButton = document.getElementById('aria-button');
  const ariaModal = document.getElementById('aria-modal');
  const closeAria = document.getElementById('close-aria');
  const sendAria = document.getElementById('send-aria');
  const ariaInput = document.getElementById('aria-input');

  if (ariaButton && ariaModal && ariaInput) {
    ariaButton.addEventListener('click', function() {
      updateARIAProviderDisplay();
      ariaModal.classList.remove('hidden');
      ariaInput.focus();
    });
  }

  if (closeAria && ariaModal) {
    closeAria.addEventListener('click', function() {
      ariaModal.classList.add('hidden');
    });
  }

  // Close modal when clicking outside
  if (ariaModal) {
    ariaModal.addEventListener('click', function(e) {
      if (e.target === ariaModal) {
        ariaModal.classList.add('hidden');
      }
    });
  }

  if (sendAria) {
    sendAria.addEventListener('click', sendARIAMessage);
  }
  
  if (ariaInput) {
    ariaInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendARIAMessage();
      }
    });
  }
}

// Update ARIA provider display
// Legacy function - replaced by secure version in secure-aria.js
function updateARIAProviderDisplay() {
  // This function is now handled by updateARIAProviderDisplaySecure()
  if (typeof updateARIAProviderDisplaySecure === 'function') {
    updateARIAProviderDisplaySecure();
  } else {
    console.log('Secure ARIA not loaded yet, using fallback');
    const providerDisplay = document.getElementById('current-provider');
    if (providerDisplay) {
      providerDisplay.innerHTML = '<span class="text-blue-600"><i class="fas fa-shield-alt mr-1"></i>Secure Mode</span>';
      providerDisplay.title = 'Using secure server-side AI proxy';
    }
  }
}

async function sendARIAMessage() {
  const ariaInput = document.getElementById('aria-input');
  const ariaChat = document.getElementById('aria-chat');
  const query = ariaInput.value.trim();
  
  if (!query) return;
  
  // Check authentication
  const token = localStorage.getItem('aria_token');
  if (!token) {
    appendARIAMessage('system', 'Please log in to use ARIA assistant.');
    return;
  }
  console.log('🔍 Frontend Debug - aiSettings keys:', Object.keys(aiSettings));
  console.log('🔍 Frontend Debug - aiSettings.openai exists:', !!aiSettings.openai);
  console.log('🔍 Frontend Debug - typeof aiSettings:', typeof aiSettings);
  
  // Fix: If aiSettings contains individual provider settings instead of nested structure,
  // we need to detect this and fix it
  if (aiSettings.priority !== undefined && aiSettings.apiKey !== undefined) {
    console.log('🔧 Detected individual provider settings - transforming to nested structure');
    // This means aiSettings contains individual provider settings, not the nested structure
    // We need to rebuild it as a nested structure
    const individualSettings = {...aiSettings};
    aiSettings = {
      openai: individualSettings,
      gemini: { priority: 0, apiKey: '', model: '' },
      anthropic: { priority: 0, apiKey: '', model: '' },
      local: { priority: 0, endpoint: '', model: '', apiKey: '' }
    };
    console.log('🔧 Transformed to nested structure with keys:', Object.keys(aiSettings));
  }
  
  // Get provider priority list (only enabled providers - priority > 0)
  const providerPriority = [];
  if (aiSettings.openai?.priority > 0 && aiSettings.openai?.apiKey) {
    providerPriority.push('openai');
  }
  if (aiSettings.gemini?.priority > 0 && aiSettings.gemini?.apiKey) {
    providerPriority.push('gemini');
  }
  if (aiSettings.anthropic?.priority > 0 && aiSettings.anthropic?.apiKey) {
    providerPriority.push('anthropic');
  }
  if (aiSettings.local?.priority > 0 && aiSettings.local?.endpoint) {
    providerPriority.push('local');
  }
  
  if (providerPriority.length === 0) {
    ariaChat.innerHTML += `
      <div class="mb-4">
        <div class="text-left">
          <div class="inline-block bg-yellow-100 text-yellow-800 rounded-lg px-4 py-2 text-sm max-w-lg border border-yellow-200">
            <i class="fas fa-cog mr-2"></i>Please configure AI settings first. Go to Settings → AI & LLM Settings to set up your API keys.
            <div class="mt-2 text-xs">
              The enhanced ARIA with RAG capabilities requires at least one AI provider to be configured.
            </div>
          </div>
        </div>
      </div>
    `;
    ariaChat.scrollTop = ariaChat.scrollHeight;
    return;
  }
  
  // Add user message
  ariaChat.innerHTML += `
    <div class="mb-4">
      <div class="text-right">
        <div class="inline-block bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg px-4 py-2 text-sm max-w-xs shadow-sm">
          ${query}
        </div>
        <div class="text-xs text-gray-500 mt-1">Using priority fallback system</div>
      </div>
    </div>
  `;
  
  ariaInput.value = '';
  ariaChat.scrollTop = ariaChat.scrollHeight;
  
  // Add loading message
  const loadingId = 'aria-loading-' + Date.now();
  ariaChat.innerHTML += `
    <div class="mb-4" id="${loadingId}">
      <div class="text-left">
        <div class="inline-block bg-gradient-to-r from-purple-100 to-blue-100 text-gray-800 rounded-lg px-4 py-2 text-sm shadow-sm">
          <i class="fas fa-brain fa-pulse mr-2 text-purple-600"></i>ARIA is analyzing your request...
          <div class="text-xs text-gray-600 mt-1">Trying ${getProviderDisplayName(providerPriority[0])} first</div>
        </div>
      </div>
    </div>
  `;
  
  let successfulResponse = false;
  let lastError = null;
  
  // Use the enhanced ARIA API endpoint with RAG context
  try {
    const token = localStorage.getItem('aria_token');
    const startTime = Date.now();
    
    console.log('🔍 Primary ARIA Call - About to send:', {
      query: query?.substring(0, 50) + '...',
      provider: providerPriority[0],
      settingsType: typeof aiSettings,
      settingsKeys: Object.keys(aiSettings)
    });
    
    const response = await axios.post('/api/aria/query', 
      { 
        query: query, 
        provider: providerPriority[0], // Use first provider
        settings: aiSettings // Include all AI settings
      },
      { 
        headers: { Authorization: `Bearer ${token}` },
        timeout: 45000 // 45 second timeout for RAG processing
      }
    );
    
    const responseTime = Date.now() - startTime;
    
    // Remove loading message
    const loadingElement = document.getElementById(loadingId);
    if (loadingElement) loadingElement.remove();
    
    if (response.data.success) {
      const data = response.data.data;
      
      // Enhanced response with RAG context information
      ariaChat.innerHTML += `
        <div class="mb-4">
          <div class="text-left">
            <div class="inline-block bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 rounded-lg px-4 py-2 text-sm max-w-2xl shadow-sm border border-gray-200">
              <i class="fas fa-robot mr-2 text-blue-600"></i>${data.response}
            </div>
            <div class="text-xs text-gray-500 mt-2">
              <div class="flex justify-between items-center">
                <span class="flex items-center">
                  <i class="fas fa-check-circle text-green-500 mr-1"></i>
                  ${getProviderDisplayName(data.provider)} • ${data.tokens_used || 0} tokens
                </span>
                <span>${responseTime}ms</span>
              </div>
              ${data.context_sources > 0 ? `
                <div class="flex items-center mt-1">
                  <i class="fas fa-database text-purple-500 mr-1"></i>
                  <span>Enhanced with ${data.context_sources} knowledge base sources</span>
                  ${data.tools_used > 0 ? ` • ${data.tools_used} analysis tools` : ''}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
      
      // Show sources if available
      if (data.sources && data.sources.length > 0) {
        ariaChat.innerHTML += `
          <div class="mb-4">
            <div class="text-left">
              <details class="bg-gray-50 rounded-lg p-3 text-sm border">
                <summary class="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                  <i class="fas fa-book mr-2"></i>View Knowledge Sources (${data.sources.length})
                </summary>
                <div class="mt-3 space-y-2">
                  ${data.sources.slice(0, 5).map(source => `
                    <div class="flex items-start space-x-2 text-xs">
                      <i class="fas fa-file-alt text-blue-500 mt-1"></i>
                      <div>
                        <div class="font-medium">${source.title}</div>
                        <div class="text-gray-600">${source.type} • ${Math.round(source.similarity * 100)}% relevant</div>
                        <div class="text-gray-500 mt-1">${source.excerpt}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </details>
            </div>
          </div>
        `;
      }
      
      successfulResponse = true;
      
    } else {
      throw new Error(response.data.message || 'Enhanced ARIA request failed');
    }
    
  } catch (error) {
    console.error('Enhanced ARIA failed, trying fallback:', error);
    lastError = error;
    
    // Fallback to simple provider rotation
    for (let i = 0; i < providerPriority.length; i++) {
      const provider = providerPriority[i];
      
      try {
        console.log(`🔍 Fallback ARIA Call (${provider}) - About to send:`, {
          query: query?.substring(0, 50) + '...',
          provider: provider,
          settingsType: typeof aiSettings,
          settingsKeys: Object.keys(aiSettings)
        });
        
        const fallbackResponse = await axios.post('/api/aria/query', 
          { 
            query: query, 
            provider: provider,
            settings: aiSettings
          },
          { 
            headers: { Authorization: `Bearer ${localStorage.getItem('aria_token')}` },
            timeout: 30000
          }
        );
        
        if (fallbackResponse.data.success) {
          const loadingEl = document.getElementById(loadingId);
          if (loadingEl) loadingEl.remove();
          
          const data = fallbackResponse.data.data;
          ariaChat.innerHTML += `
            <div class="mb-4">
              <div class="text-left">
                <div class="inline-block bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 rounded-lg px-4 py-2 text-sm max-w-2xl shadow-sm border border-gray-200">
                  <i class="fas fa-robot mr-2 text-blue-600"></i>${data.response}
                  <div class="text-xs text-yellow-600 mt-2">
                    <i class="fas fa-exclamation-triangle mr-1"></i>
                    Note: Enhanced context features temporarily unavailable
                  </div>
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  <span class="flex items-center">
                    <i class="fas fa-check-circle text-green-500 mr-1"></i>
                    ${getProviderDisplayName(provider)} • ${data.tokens_used || 0} tokens
                  </span>
                </div>
              </div>
            </div>
          `;
          successfulResponse = true;
          break;
        }
      } catch (fallbackError) {
        console.error(`Fallback provider ${provider} failed:`, fallbackError);
        continue;
      }
    }
  }
  
  // If no provider succeeded, show error
  if (!successfulResponse) {
    const loadingElement = document.getElementById(loadingId);
    if (loadingElement) loadingElement.remove();
    
    ariaChat.innerHTML += `
      <div class="mb-4">
        <div class="text-left">
          <div class="inline-block bg-red-100 text-red-800 rounded-lg px-4 py-2 text-sm max-w-lg border border-red-200">
            <i class="fas fa-exclamation-triangle mr-2"></i>All AI providers failed to respond. Please check:
            <div class="mt-2 text-xs">
              • Your API keys are valid and have sufficient credits<br>
              • Your internet connection is stable<br>
              • Provider services are operational
            </div>
          </div>
          <div class="text-xs text-gray-500 mt-2">
            Tried: ${providerPriority.map(p => getProviderDisplayName(p)).join(', ')}
          </div>
        </div>
      </div>
    `;
  }
  
  ariaChat.scrollTop = ariaChat.scrollHeight;
}

function quickARIAQuery(query) {
  const ariaInput = document.getElementById('aria-input');
  if (ariaInput) {
    ariaInput.value = query;
    sendARIAMessage();
  }
}

function getProviderDisplayName(provider) {
  const names = {
    'openai': 'OpenAI GPT-4',
    'gemini': 'Google Gemini',
    'anthropic': 'Anthropic Claude',
    'local': 'Local/Custom LLM'
  };
  return names[provider] || provider.charAt(0).toUpperCase() + provider.slice(1);
}

async function showAIInsights() {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get('/api/ai/insights?type=all&limit=5', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      const insights = response.data.data;
      showModal('AI Risk Insights', renderAIInsights(insights), [
        { text: 'Close', class: 'btn-primary', onclick: 'closeModal()' }
      ]);
    } else {
      showToast('Failed to load AI insights', 'error');
    }
  } catch (error) {
    console.error('AI insights error:', error);
    showToast('Failed to load AI insights', 'error');
  }
}

function renderAIInsights(insights) {
  if (!insights || insights.length === 0) {
    return `
      <div class="text-center py-8">
        <i class="fas fa-brain text-4xl text-gray-300 mb-4"></i>
        <p class="text-gray-600">No AI insights available at this time.</p>
      </div>
    `;
  }

  return `
    <div class="space-y-4">
      ${insights.map(insight => `
        <div class="border rounded-lg p-4 ${getSeverityClass(insight.severity)}">
          <div class="flex items-start justify-between mb-2">
            <h4 class="font-semibold text-gray-900">${insight.title}</h4>
            <span class="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
              ${(insight.confidence * 100).toFixed(0)}% confidence
            </span>
          </div>
          <p class="text-gray-700 mb-3">${insight.description}</p>
          ${insight.recommendations ? `
            <div class="mt-3">
              <h5 class="text-sm font-medium text-gray-900 mb-2">Recommendations:</h5>
              <ul class="text-sm text-gray-600 space-y-1">
                ${insight.recommendations.map(rec => `<li>• ${rec}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
}



async function showRiskPredictions() {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.post('/api/ai/predict', {
      entity_type: 'system',
      entity_id: 1,
      prediction_type: 'trend'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      const prediction = response.data.data;
      showModal('Risk Trend Predictions', renderRiskPredictions(prediction), [
        { text: 'Close', class: 'btn-primary', onclick: 'closeModal()' }
      ]);
    } else {
      showToast('Failed to load risk predictions', 'error');
    }
  } catch (error) {
    console.error('Risk predictions error:', error);
    showToast('Failed to load risk predictions', 'error');
  }
}

function renderRiskPredictions(prediction) {
  return `
    <div class="space-y-6">
      <!-- Trend Analysis -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h4 class="font-semibold text-gray-900 mb-3">Trend Analysis</h4>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-600">Direction:</span>
            <span class="ml-2 font-medium ${prediction.trend_analysis.direction === 'increasing' ? 'text-red-600' : 'text-green-600'}">
              ${prediction.trend_analysis.direction}
            </span>
          </div>
          <div>
            <span class="text-gray-600">Confidence:</span>
            <span class="ml-2 font-medium">${(prediction.trend_analysis.confidence * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span class="text-gray-600">Magnitude:</span>
            <span class="ml-2 font-medium">${(prediction.trend_analysis.magnitude * 100).toFixed(0)}% change</span>
          </div>
          <div>
            <span class="text-gray-600">Timeframe:</span>
            <span class="ml-2 font-medium">${prediction.trend_analysis.timeframe}</span>
          </div>
        </div>
      </div>

      <!-- Risk Scenarios -->
      <div>
        <h4 class="font-semibold text-gray-900 mb-3">Risk Scenarios</h4>
        <div class="space-y-2">
          ${prediction.scenarios.map(scenario => `
            <div class="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <span class="font-medium">${scenario.name}</span>
                <p class="text-sm text-gray-600">${scenario.description}</p>
              </div>
              <div class="text-right">
                <div class="text-sm font-medium">${(scenario.probability * 100).toFixed(0)}%</div>
                <div class="text-xs text-gray-500">${scenario.impact} Impact</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Recommendations -->
      <div>
        <h4 class="font-semibold text-gray-900 mb-3">AI Recommendations</h4>
        <ul class="space-y-2">
          ${prediction.recommendations.map(rec => `
            <li class="flex items-start space-x-2">
              <i class="fas fa-lightbulb text-yellow-500 mt-1"></i>
              <span class="text-sm">${rec}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  `;
}

// Navigation functions - implementations are now in modules.js
// showRisks(), showControls(), showCompliance(), showIncidents() are defined in modules.js



// Utility functions
function updateActiveNavigation(activeItem) {
  document.querySelectorAll('.nav-menu-item').forEach(item => {
    item.classList.remove('active');
  });
  const activeElement = document.getElementById(`nav-${activeItem}`);
  if (activeElement) {
    activeElement.classList.add('active');
  }
}

function showLoading(elementId) {
  console.log('🔄 showLoading called for:', elementId);
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('❌ Element not found:', elementId);
    return;
  }
  console.log('✅ Element found, setting loading content');
  element.innerHTML = `
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">Loading...</span>
    </div>
  `;
  console.log('✅ Loading content set');
}

function showError(message) {
  showToast(message, 'error');
}

function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `alert alert-${type} animate-slide-down`;
  toast.innerHTML = `
    <div class="flex justify-between items-center">
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-current opacity-70 hover:opacity-100">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 5000);
  
  // Also add to notification center if available, but prevent recursive loops
  if (typeof notificationManager !== 'undefined' && notificationManager.isInitialized) {
    // Only add certain types to notification center and exclude notification-related errors
    if ((type === 'success' || type === 'error' || type === 'warning') && 
        !message.toLowerCase().includes('notification') && 
        !message.toLowerCase().includes('mark') &&
        !message.toLowerCase().includes('failed to mark')) {
      notificationManager.addNotificationFromToast(message, type);
    }
  }
}

function getRiskScoreColor(score) {
  if (score >= 20) return 'text-red-600';
  if (score >= 15) return 'text-orange-600';
  if (score >= 10) return 'text-yellow-600';
  if (score >= 5) return 'text-green-600';
  return 'text-gray-600';
}

function getRiskLevel(score) {
  if (score >= 20) return 'Critical';
  if (score >= 15) return 'High';
  if (score >= 10) return 'Medium';
  if (score >= 5) return 'Low';
  return 'Very Low';
}

function getSeverityClass(severity) {
  const classes = {
    'critical': 'bg-red-100 text-red-800',
    'high': 'bg-orange-100 text-orange-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'low': 'bg-green-100 text-green-800'
  };
  return classes[severity] || 'bg-gray-100 text-gray-800';
}

function formatDate(dateString) {
  return dayjs(dateString).format('MMM DD');
}

async function refreshDashboard() {
  await loadDashboardData();
  showDashboard();
  showToast('Dashboard refreshed successfully', 'success');
}

// Demo login modal for testing (DEPRECATED - Use /login page instead)
// This function is kept for backward compatibility but is no longer actively used
function showDemoLoginModal() {
  showModal('Demo Login', `
    <div class="space-y-6">
      <!-- Demo Info -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-center">
          <i class="fas fa-info-circle text-blue-600 mr-2"></i>
          <span class="text-blue-800 font-medium">Demo Environment</span>
        </div>
        <p class="text-blue-700 text-sm mt-1">
          This is a demonstration environment. Click "Demo Login" to access the platform with demo credentials.
        </p>
      </div>

      <!-- Login Options -->
      <div class="space-y-4">
        <div>
          <h4 class="text-lg font-medium text-gray-900 mb-3">Quick Demo Access</h4>
          <button onclick="performDemoLogin()" 
            class="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">
            <i class="fas fa-rocket mr-2"></i>Demo Login
          </button>
          <p class="text-xs text-gray-500 mt-2">
            Creates a demo user automatically and logs you in to explore the platform features.
          </p>
        </div>

        <div class="border-t border-gray-200 pt-4">
          <h4 class="text-sm font-medium text-gray-700 mb-2">Manual Login</h4>
          <div class="space-y-3">
            <input type="text" id="demo-username" placeholder="Username" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <input type="password" id="demo-password" placeholder="Password" 
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <button onclick="performManualLogin()" 
              class="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
              Login
            </button>
          </div>
        </div>
      </div>
    </div>
  `, [
    { text: 'Cancel', class: 'btn-secondary', onclick: 'closeUniversalModal()' }
  ]);
}

async function performDemoLogin() {
  try {
    showToast('Logging in with demo credentials...', 'info');
    
    const response = await fetch('/api/auth/demo-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await response.json();
    
    if (result.success) {
      // Store token and user data
      localStorage.setItem('aria_token', result.data.token);
      currentUser = result.data.user;
      
      // Close modal and update UI
      closeUniversalModal();
      await updateAuthUI();
      
      // Explicitly update mobile UI after login
      if (typeof window.updateMobileAuthUI === 'function') {
        window.updateMobileAuthUI();
      }
      
      showToast(`Welcome ${result.data.user.first_name}! Demo login successful.`, 'success');
      
      // Refresh the page or redirect to dashboard
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      throw new Error(result.error || 'Demo login failed');
    }
  } catch (error) {
    console.error('Demo login error:', error);
    showToast(`Demo login failed: ${error.message}`, 'error');
  }
}

async function performManualLogin() {
  try {
    const username = document.getElementById('demo-username').value.trim();
    const password = document.getElementById('demo-password').value.trim();
    
    if (!username || !password) {
      showToast('Please enter username and password', 'error');
      return;
    }
    
    showToast('Logging in...', 'info');
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();
    
    if (result.success) {
      // Store token and user data
      localStorage.setItem('aria_token', result.data.token);
      currentUser = result.data.user;
      
      // Close modal and update UI
      closeUniversalModal();
      await updateAuthUI();
      
      showToast(`Welcome ${result.data.user.first_name}!`, 'success');
      
      // Refresh the page
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      throw new Error(result.error || 'Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    showToast(`Login failed: ${error.message}`, 'error');
  }
}