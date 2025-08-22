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
  
  const token = localStorage.getItem('dmt_token') || localStorage.getItem('authToken');
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
    const token = localStorage.getItem('dmt_token');
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
    localStorage.removeItem('dmt_token');
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
  const token = localStorage.getItem('dmt_token');
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
    localStorage.removeItem('dmt_token');
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
          <p class="text-gray-600 mt-2">Please log in to access the GRC platform</p>
        </div>
        <div class="space-y-4">
          <button onclick="window.location.href='/login'" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
            <i class="fas fa-sign-in-alt mr-2"></i>Go to Login
          </button>
          <div class="text-sm text-gray-600 text-center">
            <p><strong>Demo Credentials:</strong></p>
            <p>Username: <code>admin</code> | Password: <code>demo123</code></p>
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
        <h1 class="text-3xl font-bold text-gray-900 mb-2">DMT Risk Assessment System v2.0</h1>
        <p class="text-gray-600 mb-8">Next-Generation Enterprise GRC Platform</p>
        <button onclick="window.location.href='/login'" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
          <i class="fas fa-sign-in-alt mr-2"></i>Login to Continue
        </button>
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
  
  // Setup auth button
  const authButton = document.getElementById('auth-button');
  if (authButton) {
    authButton.addEventListener('click', (e) => {
      e.preventDefault();
      const token = localStorage.getItem('dmt_token');
      if (token) {
        logout();
      } else {
        window.location.href = '/login';
      }
    });
    console.log('Added event handler for auth button');
  } else {
    console.warn('Auth button not found');
  }
  
  // Update welcome message and auth button based on login status
  await updateAuthUI();
  
  console.log('Navigation initialization complete');
  navigationInitialized = true;
}

// Update authentication UI
async function updateAuthUI() {
  console.log('🔄 updateAuthUI called');
  const token = localStorage.getItem('dmt_token');
  console.log('🔑 Token status:', token ? 'Present' : 'Missing');
  console.log('👤 Current user:', currentUser ? 'Loaded' : 'Not loaded');
  
  // Authentication is valid only if we have both token AND currentUser
  const isAuthenticated = !!(token && currentUser);
  console.log('✅ Is authenticated:', isAuthenticated);
  
  const welcomeMessage = document.getElementById('welcome-message');
  const authButton = document.getElementById('auth-button');
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
    // Show internal features after login
    if (internalNav) internalNav.classList.remove('hidden');
    if (notificationsContainer) notificationsContainer.classList.remove('hidden');
    if (ariaButton) ariaButton.classList.remove('hidden');
    
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
    if (internalNav) internalNav.classList.add('hidden');
    if (notificationsContainer) notificationsContainer.classList.add('hidden');
    if (ariaButton) ariaButton.classList.add('hidden');
    
    // Show public landing page
    showPublicLandingPage();
  }
}

// Show public landing page for non-authenticated users
function showPublicLandingPage() {
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="max-w-4xl mx-auto text-center py-16">
        <div class="mb-8">
          <div class="mx-auto h-24 w-24 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mb-6">
            <i class="fas fa-shield-alt text-white text-3xl"></i>
          </div>
          <h1 class="text-4xl font-bold text-gray-900 mb-4">Risk Management Platform</h1>
          <p class="text-xl text-gray-600 mb-8">Next-Generation Enterprise GRC Platform with AI-Powered Intelligence & Advanced Analytics</p>
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
          <p class="text-gray-600 mb-6">Sign in to access the full GRC platform with advanced risk management capabilities.</p>
          <button onclick="window.location.href='/login'" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors duration-200">
            <i class="fas fa-sign-in-alt mr-2"></i>Sign In
          </button>
          
          <div class="mt-6 text-sm text-gray-500">
            <p><strong>Demo Accounts:</strong></p>
            <div class="mt-2 space-y-1">
              <p><strong>Admin:</strong> admin / demo123</p>
              <p><strong>Risk Manager:</strong> avi_security / demo123</p>
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
    const token = localStorage.getItem('dmt_token');
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
  const token = localStorage.getItem('dmt_token');
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
      default:
        showBasicDashboard();
    }
  } catch (error) {
    console.error('Navigation error:', error);
    showError('Navigation error: ' + error.message);
  }
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
  localStorage.removeItem('dmt_token');
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
    
    const token = localStorage.getItem('dmt_token');
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
    <div class="space-y-8">
      <!-- Modern Header -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold mb-2">Risk Management Dashboard</h1>
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
    const token = localStorage.getItem('dmt_token');
    const res = await axios.get('/api/soa', { headers: { Authorization: `Bearer ${token}` } });
    const rows = res.data.data || [];
    main.innerHTML = `
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
    `;
  } catch (e) {
    showError('Failed to load SoA');
  }
}

window.editSoA = function(id) {
  const token = localStorage.getItem('dmt_token');
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
    const token = localStorage.getItem('dmt_token');
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

// Treatments UI (includes Acceptances/Exceptions)
async function showTreatments() {
  updateActiveNavigation && updateActiveNavigation('treatments');
  showLoading('main-content');
  try {
    const token = localStorage.getItem('dmt_token');
    const [treatRes, excRes] = await Promise.all([
      axios.get('/api/treatments', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/exceptions', { headers: { Authorization: `Bearer ${token}` } })
    ]);
    const treatments = treatRes.data.data || [];
    const exceptions = excRes.data.data || [];
    const main = document.getElementById('main-content');
    main.innerHTML = `
      <div class="space-y-8">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-gray-900">Risk Treatments</h2>
          <div class="text-sm text-gray-500">Read-only (write coming soon)</div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">Risk</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">Strategy</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">Owner</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">Due</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${treatments.map(t => `
                <tr>
                  <td class="px-4 py-3 text-sm"><div class="font-medium">${t.risk_title || '-'}</div><div class="text-xs text-gray-500">${t.risk_id || ''}</div></td>
                  <td class="px-4 py-3 text-sm">${t.strategy}</td>
                  <td class="px-4 py-3 text-sm">${t.owner_username || '-'}</td>
                  <td class="px-4 py-3 text-sm">${t.status}</td>
                  <td class="px-4 py-3 text-sm">${t.due_date || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        <div class="flex items-center justify-between mt-8">
          <h2 class="text-2xl font-bold text-gray-900">Risk Acceptances / Exceptions</h2>
          <div class="text-sm text-gray-500">Read-only (write coming soon)</div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">Control</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">Risk</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">Expiry</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500">Justification</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${exceptions.map(e => `
                <tr>
                  <td class="px-4 py-3 text-sm">${e.control_name || '-'} <span class="text-xs text-gray-500">(ID: ${e.control_id})</span></td>
                  <td class="px-4 py-3 text-sm">${e.risk_title || '-'} <span class="text-xs text-gray-500">${e.risk_id || ''}</span></td>
                  <td class="px-4 py-3 text-sm">${e.status}</td>
                  <td class="px-4 py-3 text-sm">${e.expiry_date || '-'}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">${e.justification || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (e) {
    showError('Failed to load treatments/acceptances');
  }
}

// KRIs UI
async function showKRIs() {
  updateActiveNavigation && updateActiveNavigation('kris');
  showLoading('main-content');
  try {
    const token = localStorage.getItem('dmt_token');
    const res = await axios.get('/api/kris', { headers: { Authorization: `Bearer ${token}` } });
    const kris = res.data.data || [];
    const main = document.getElementById('main-content');
    main.innerHTML = `
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-2xl font-bold text-gray-900">Key Risk Indicators</h2>
          <div class="text-sm text-gray-500">Read-only dashboard</div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div class="lg:col-span-1 space-y-2">
            ${kris.map(k => `
              <div class="p-3 bg-white rounded-lg shadow-sm border hover:border-blue-300 cursor-pointer" onclick="selectKRI(${k.id}, '${k.name.replace(/'/g, "&#39;")}')">
                <div class="flex justify-between items-center">
                  <div>
                    <div class="font-medium text-gray-900">${k.name}</div>
                    <div class="text-xs text-gray-500">Threshold: ${k.threshold} (${k.direction})</div>
                  </div>
                  <div class="text-xs text-gray-500">${k.frequency || ''}</div>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="lg:col-span-2">
            <div class="bg-white rounded-xl shadow-sm border p-4">
              <h3 id="kri-title" class="text-lg font-semibold mb-2">Select a KRI</h3>
              <canvas id="kriChart" height="200"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (e) {
    showError('Failed to load KRIs');
  }
}

window.selectKRI = async function(id, name) {
  try {
    document.getElementById('kri-title').textContent = name;
    const token = localStorage.getItem('dmt_token');
    const res = await axios.get(`/api/kris/${id}/readings`, { headers: { Authorization: `Bearer ${token}` } });
    const readings = res.data.data || [];
    const labels = readings.map(r => new Date(r.timestamp).toLocaleString());
    const data = readings.map(r => r.value);
    const ctx = document.getElementById('kriChart').getContext('2d');
    if (window.kriChart) window.kriChart.destroy();
    window.kriChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets: [{ label: name, data, borderColor: '#3B82F6', backgroundColor: 'rgba(59,130,246,0.1)', fill: true }] },
      options: { responsive: true, maintainAspectRatio: false }
    });
  } catch (e) {
    showError('Failed to load KRI readings');
  }
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
function updateARIAProviderDisplay() {
  const providerDisplay = document.getElementById('current-provider');
  if (!providerDisplay) return;
  
  const aiSettings = JSON.parse(localStorage.getItem('dmt_ai_settings') || '{}');
  
  // Get enabled and configured providers (priority > 0 means enabled)
  const enabledProviders = [];
  if (aiSettings.openai?.priority > 0 && aiSettings.openai?.apiKey) {
    enabledProviders.push('OpenAI GPT-4');
  }
  if (aiSettings.gemini?.priority > 0 && aiSettings.gemini?.apiKey) {
    enabledProviders.push('Google Gemini');
  }
  if (aiSettings.anthropic?.priority > 0 && aiSettings.anthropic?.apiKey) {
    enabledProviders.push('Anthropic Claude');
  }
  if (aiSettings.local?.priority > 0 && aiSettings.local?.endpoint) {
    enabledProviders.push('Local/Custom');
  }
  
  if (enabledProviders.length === 0) {
    providerDisplay.innerHTML = '<span class="text-red-600"><i class="fas fa-exclamation-triangle mr-1"></i>Not Configured</span>';
    providerDisplay.title = 'No AI providers configured. Go to Settings to configure.';
  } else if (enabledProviders.length === 1) {
    providerDisplay.innerHTML = `<span class="text-green-600"><i class="fas fa-check-circle mr-1"></i>${enabledProviders[0]}</span>`;
    providerDisplay.title = `Using: ${enabledProviders[0]}`;
  } else {
    providerDisplay.innerHTML = `<span class="text-blue-600"><i class="fas fa-layer-group mr-1"></i>${enabledProviders.length} Providers</span>`;
    providerDisplay.title = `Priority fallback: ${enabledProviders.join(' → ')}`;
  }
}

async function sendARIAMessage() {
  const ariaInput = document.getElementById('aria-input');
  const ariaChat = document.getElementById('aria-chat');
  const query = ariaInput.value.trim();
  
  if (!query) return;
  
  // Load AI settings from localStorage (with fallback logic matching the settings save)
  let aiSettings;
  try {
    // Try dmt_ai_settings first, then fallback to ai_settings (same as loadAISettings function)
    let settings = localStorage.getItem('dmt_ai_settings');
    if (!settings) {
      settings = localStorage.getItem('ai_settings');
    }
    aiSettings = settings ? JSON.parse(settings) : {};
  } catch (error) {
    console.error('Error loading AI settings for ARIA:', error);
    aiSettings = {};
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
    const token = localStorage.getItem('dmt_token');
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
            headers: { Authorization: `Bearer ${localStorage.getItem('dmt_token')}` },
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
    const token = localStorage.getItem('dmt_token');
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
    const token = localStorage.getItem('dmt_token');
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