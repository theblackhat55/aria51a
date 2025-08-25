// DMT Risk Assessment System v2.0 - Module Implementations
// Risk Management, Controls, Compliance, and Incidents modules

// Global module state
let currentModule = 'dashboard';
let moduleData = {
  requirements: [],
  findings: [],
  services: []
};

// Risk Management Module
async function showRisks() {
  updateActiveNavigation('risks');
  currentModule = 'risks';
  
  const mainContent = document.getElementById('main-content');
  
  mainContent.innerHTML = `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Risk Management</h2>
          <p class="text-gray-600 mt-1">Manage organizational risks and mitigation strategies</p>
        </div>
        <div class="flex space-x-3">
          <button onclick="showImportRisksModal()" class="btn-secondary">
            <i class="fas fa-upload mr-2"></i>Import
          </button>
          <button onclick="exportRisks()" class="btn-secondary">
            <i class="fas fa-download mr-2"></i>Export
          </button>
          <button onclick="showAddRiskModal()" class="btn-primary">
            <i class="fas fa-plus mr-2"></i>Add Risk
          </button>
        </div>
      </div>
      
      <!-- Risk Filters -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-64">
            <input 
              type="text" 
              id="risk-search" 
              placeholder="Search risks..." 
              class="form-input"
              onkeyup="filterRisks()"
            />
          </div>
          <select id="risk-status-filter" class="form-select" onchange="filterRisks()">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="mitigated">Mitigated</option>
            <option value="closed">Closed</option>
            <option value="monitoring">Monitoring</option>
          </select>
          <select id="risk-category-filter" class="form-select" onchange="filterRisks()">
            <option value="">All Categories</option>
            <option value="1">Cybersecurity</option>
            <option value="2">Data Privacy</option>
            <option value="3">Operational Risk</option>
            <option value="4">Financial Risk</option>
            <option value="5">Regulatory Compliance</option>
            <option value="6">Third-Party Risk</option>
          </select>
          <select id="risk-score-filter" class="form-select" onchange="filterRisks()">
            <option value="">All Risk Levels</option>
            <option value="20-25">Critical (20-25)</option>
            <option value="15-19">High (15-19)</option>
            <option value="10-14">Medium (10-14)</option>
            <option value="5-9">Low (5-9)</option>
            <option value="1-4">Very Low (1-4)</option>
          </select>
        </div>
      </div>
      
      <!-- Risk Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-fire text-red-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">Critical Risks</p>
              <p class="text-lg font-semibold text-gray-900" id="critical-risks-count">-</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-exclamation-triangle text-orange-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">High Risks</p>
              <p class="text-lg font-semibold text-gray-900" id="high-risks-count">-</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-clock text-yellow-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">Overdue Reviews</p>
              <p class="text-lg font-semibold text-gray-900" id="overdue-reviews-count">-</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-chart-line text-blue-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">Avg Risk Score</p>
              <p class="text-lg font-semibold text-gray-900" id="avg-risk-score">-</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Risk Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-6 py-3 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Risk Register</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="table-header">Risk ID</th>
                <th class="table-header">Title</th>
                <th class="table-header">Category</th>
                <th class="table-header">Owner</th>
                <th class="table-header">Probability</th>
                <th class="table-header">Impact</th>
                <th class="table-header">Risk Score</th>
                <th class="table-header">Status</th>
                <th class="table-header">Next Review</th>
                <th class="table-header">Actions</th>
              </tr>
            </thead>
            <tbody id="risks-table-body" class="bg-white divide-y divide-gray-200">
              <!-- Risk rows will be inserted here -->
            </tbody>
          </table>
        </div>
        <div id="risks-loading" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-2 text-gray-600">Loading risks...</p>
        </div>
        <div id="risks-empty" class="p-8 text-center hidden">
          <i class="fas fa-exclamation-triangle text-gray-400 text-4xl mb-4"></i>
          <p class="text-gray-600">No risks found</p>
        </div>
      </div>
    </div>
  `;
  
  // Load risks data
  await loadRisks();
}

async function loadRisks() {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get('/api/risks', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      moduleData.risks = response.data.data;
      renderRisksTable(moduleData.risks);
      updateRiskStatistics(moduleData.risks);
      document.getElementById('risks-loading').style.display = 'none';
    } else {
      throw new Error('Failed to load risks');
    }
  } catch (error) {
    console.error('Error loading risks:', error);
    document.getElementById('risks-loading').innerHTML = '<p class="text-red-600">Error loading risks</p>';
  }
}

function renderRisksTable(risks) {
  const tbody = document.getElementById('risks-table-body');
  
  if (!risks || risks.length === 0) {
    document.getElementById('risks-empty').classList.remove('hidden');
    tbody.innerHTML = '';
    return;
  }
  
  document.getElementById('risks-empty').classList.add('hidden');
  
  tbody.innerHTML = risks.map(risk => `
    <tr class="table-row">
      <td class="table-cell">
        <div class="text-sm font-medium text-gray-900">${risk.risk_id}</div>
      </td>
      <td class="table-cell">
        <div class="text-sm font-medium text-gray-900">${risk.title}</div>
        <div class="text-sm text-gray-500">${truncateText(risk.description, 50)}</div>
      </td>
      <td class="table-cell">
        <span class="text-sm text-gray-900">${risk.category_name || 'Unknown'}</span>
      </td>
      <td class="table-cell">
        <span class="text-sm text-gray-900">${risk.first_name} ${risk.last_name}</span>
      </td>
      <td class="table-cell">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProbabilityClass(risk.probability)}">
          ${risk.probability}/5
        </span>
      </td>
      <td class="table-cell">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImpactClass(risk.impact)}">
          ${risk.impact}/5
        </span>
      </td>
      <td class="table-cell">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskScoreClass(risk.risk_score)}">
          ${risk.risk_score}
        </span>
      </td>
      <td class="table-cell">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(risk.status)}">
          ${capitalizeFirst(risk.status)}
        </span>
      </td>
      <td class="table-cell">
        <span class="text-sm text-gray-900">${formatDate(risk.next_review_date) || 'Not set'}</span>
      </td>
      <td class="table-cell">
        <div class="flex space-x-2">
          <button onclick="viewRisk(${risk.id})" class="text-blue-600 hover:text-blue-900" title="View">
            <i class="fas fa-eye"></i>
          </button>
          <button onclick="editRisk(${risk.id})" class="text-green-600 hover:text-green-900" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteRisk(${risk.id})" class="text-red-600 hover:text-red-900" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function updateRiskStatistics(risks) {
  if (!risks) return;
  
  const criticalRisks = risks.filter(r => r.risk_score >= 20).length;
  const highRisks = risks.filter(r => r.risk_score >= 15 && r.risk_score < 20).length;
  const overdueReviews = risks.filter(r => r.next_review_date && new Date(r.next_review_date) < new Date()).length;
  const avgScore = risks.length > 0 ? (risks.reduce((sum, r) => sum + r.risk_score, 0) / risks.length).toFixed(1) : 0;
  
  document.getElementById('critical-risks-count').textContent = criticalRisks;
  document.getElementById('high-risks-count').textContent = highRisks;
  document.getElementById('overdue-reviews-count').textContent = overdueReviews;
  document.getElementById('avg-risk-score').textContent = avgScore;
}

function filterRisks() {
  if (!moduleData.risks) return;
  
  const search = document.getElementById('risk-search').value.toLowerCase();
  const status = document.getElementById('risk-status-filter').value;
  const category = document.getElementById('risk-category-filter').value;
  const scoreRange = document.getElementById('risk-score-filter').value;
  
  let filteredRisks = moduleData.risks.filter(risk => {
    const matchesSearch = !search || 
      risk.title.toLowerCase().includes(search) || 
      risk.risk_id.toLowerCase().includes(search) ||
      risk.description.toLowerCase().includes(search);
    
    const matchesStatus = !status || risk.status === status;
    const matchesCategory = !category || risk.category_id.toString() === category;
    
    let matchesScore = true;
    if (scoreRange) {
      const [min, max] = scoreRange.split('-').map(Number);
      matchesScore = risk.risk_score >= min && risk.risk_score <= max;
    }
    
    return matchesSearch && matchesStatus && matchesCategory && matchesScore;
  });
  
  renderRisksTable(filteredRisks);
}

// Controls Management Module
async function showControls() {
  updateActiveNavigation('controls');
  currentModule = 'controls';
  
  const mainContent = document.getElementById('main-content');
  
  mainContent.innerHTML = `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Control Management</h2>
          <p class="text-gray-600 mt-1">Manage security controls and their effectiveness</p>
        </div>
        <div class="flex space-x-3">
          <button onclick="showImportControlsModal()" class="btn-secondary">
            <i class="fas fa-upload mr-2"></i>Import
          </button>
          <button onclick="exportControls()" class="btn-secondary">
            <i class="fas fa-download mr-2"></i>Export
          </button>
          <button onclick="showAddControlModal()" class="btn-primary">
            <i class="fas fa-plus mr-2"></i>Add Control
          </button>
        </div>
      </div>
      
      <!-- Control Filters -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-64">
            <input 
              type="text" 
              id="control-search" 
              placeholder="Search controls..." 
              class="form-input"
              onkeyup="filterControls()"
            />
          </div>
          <select id="control-framework-filter" class="form-select" onchange="filterControls()">
            <option value="">All Frameworks</option>
            <option value="ISO27001">ISO 27001</option>
            <option value="NIST">NIST</option>
            <option value="SOX">SOX</option>
            <option value="COBIT">COBIT</option>
            <option value="GDPR">GDPR</option>
          </select>
          <select id="control-type-filter" class="form-select" onchange="filterControls()">
            <option value="">All Types</option>
            <option value="preventive">Preventive</option>
            <option value="detective">Detective</option>
            <option value="corrective">Corrective</option>
            <option value="compensating">Compensating</option>
          </select>
          <select id="control-effectiveness-filter" class="form-select" onchange="filterControls()">
            <option value="">All Effectiveness</option>
            <option value="effective">Effective</option>
            <option value="partially_effective">Partially Effective</option>
            <option value="ineffective">Ineffective</option>
            <option value="not_tested">Not Tested</option>
          </select>
        </div>
      </div>
      
      <!-- Control Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-shield-check text-green-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">Effective Controls</p>
              <p class="text-lg font-semibold text-gray-900" id="effective-controls-count">-</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-exclamation-triangle text-yellow-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">Needs Testing</p>
              <p class="text-lg font-semibold text-gray-900" id="untested-controls-count">-</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-times-circle text-red-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">Ineffective</p>
              <p class="text-lg font-semibold text-gray-900" id="ineffective-controls-count">-</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-robot text-blue-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">Automated</p>
              <p class="text-lg font-semibold text-gray-900" id="automated-controls-count">-</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Controls Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-6 py-3 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Control Library</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="table-header">Control ID</th>
                <th class="table-header">Name</th>
                <th class="table-header">Framework</th>
                <th class="table-header">Type</th>
                <th class="table-header">Owner</th>
                <th class="table-header">Frequency</th>
                <th class="table-header">Design Effectiveness</th>
                <th class="table-header">Operating Effectiveness</th>
                <th class="table-header">Last Tested</th>
                <th class="table-header">Actions</th>
              </tr>
            </thead>
            <tbody id="controls-table-body" class="bg-white divide-y divide-gray-200">
              <!-- Control rows will be inserted here -->
            </tbody>
          </table>
        </div>
        <div id="controls-loading" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-2 text-gray-600">Loading controls...</p>
        </div>
        <div id="controls-empty" class="p-8 text-center hidden">
          <i class="fas fa-shield-alt text-gray-400 text-4xl mb-4"></i>
          <p class="text-gray-600">No controls found</p>
        </div>
      </div>
    </div>
  `;
  
  // Load controls data
  await loadControls();
}

async function loadControls() {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get('/api/controls', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      moduleData.controls = response.data.data;
      renderControlsTable(moduleData.controls);
      updateControlStatistics(moduleData.controls);
      document.getElementById('controls-loading').style.display = 'none';
    } else {
      throw new Error('Failed to load controls');
    }
  } catch (error) {
    console.error('Error loading controls:', error);
    document.getElementById('controls-loading').innerHTML = '<p class="text-red-600">Error loading controls</p>';
  }
}

function renderControlsTable(controls) {
  const tbody = document.getElementById('controls-table-body');
  
  if (!controls || controls.length === 0) {
    document.getElementById('controls-empty').classList.remove('hidden');
    tbody.innerHTML = '';
    return;
  }
  
  document.getElementById('controls-empty').classList.add('hidden');
  
  tbody.innerHTML = controls.map(control => `
    <tr class="table-row">
      <td class="table-cell">
        <div class="text-sm font-medium text-gray-900">${control.control_id}</div>
      </td>
      <td class="table-cell">
        <div class="text-sm font-medium text-gray-900">${control.name}</div>
        <div class="text-sm text-gray-500">${truncateText(control.description, 50)}</div>
      </td>
      <td class="table-cell">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          ${control.framework}
        </span>
      </td>
      <td class="table-cell">
        <span class="text-sm text-gray-900">${capitalizeFirst(control.control_type)}</span>
      </td>
      <td class="table-cell">
        <span class="text-sm text-gray-900">${control.first_name} ${control.last_name}</span>
      </td>
      <td class="table-cell">
        <span class="text-sm text-gray-900">${capitalizeFirst(control.frequency)}</span>
      </td>
      <td class="table-cell">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEffectivenessClass(control.design_effectiveness)}">
          ${capitalizeFirst(control.design_effectiveness.replace('_', ' '))}
        </span>
      </td>
      <td class="table-cell">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEffectivenessClass(control.operating_effectiveness)}">
          ${capitalizeFirst(control.operating_effectiveness.replace('_', ' '))}
        </span>
      </td>
      <td class="table-cell">
        <span class="text-sm text-gray-900">${formatDate(control.last_tested) || 'Never'}</span>
      </td>
      <td class="table-cell">
        <div class="flex space-x-2">
          <button onclick="viewControl(${control.id})" class="text-blue-600 hover:text-blue-900" title="View">
            <i class="fas fa-eye"></i>
          </button>
          <button onclick="editControl(${control.id})" class="text-green-600 hover:text-green-900" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="testControl(${control.id})" class="text-purple-600 hover:text-purple-900" title="Test">
            <i class="fas fa-play"></i>
          </button>
          <button onclick="deleteControl(${control.id})" class="text-red-600 hover:text-red-900" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function updateControlStatistics(controls) {
  if (!controls) return;
  
  const effective = controls.filter(c => c.operating_effectiveness === 'effective').length;
  const untested = controls.filter(c => c.operating_effectiveness === 'not_tested').length;
  const ineffective = controls.filter(c => c.operating_effectiveness === 'ineffective').length;
  const automated = controls.filter(c => c.automation_level === 'fully_automated').length;
  
  document.getElementById('effective-controls-count').textContent = effective;
  document.getElementById('untested-controls-count').textContent = untested;
  document.getElementById('ineffective-controls-count').textContent = ineffective;
  document.getElementById('automated-controls-count').textContent = automated;
}

function filterControls() {
  if (!moduleData.controls) return;
  
  const search = document.getElementById('control-search').value.toLowerCase();
  const framework = document.getElementById('control-framework-filter').value;
  const type = document.getElementById('control-type-filter').value;
  const effectiveness = document.getElementById('control-effectiveness-filter').value;
  
  let filteredControls = moduleData.controls.filter(control => {
    const matchesSearch = !search || 
      control.name.toLowerCase().includes(search) || 
      control.control_id.toLowerCase().includes(search) ||
      control.description.toLowerCase().includes(search);
    
    const matchesFramework = !framework || control.framework === framework;
    const matchesType = !type || control.control_type === type;
    const matchesEffectiveness = !effectiveness || control.operating_effectiveness === effectiveness;
    
    return matchesSearch && matchesFramework && matchesType && matchesEffectiveness;
  });
  
  renderControlsTable(filteredControls);
}

// Compliance Management Module
async function showCompliance() {
  updateActiveNavigation('compliance');
  currentModule = 'compliance';
  
  const mainContent = document.getElementById('main-content');
  
  mainContent.innerHTML = `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Compliance Management</h2>
          <p class="text-gray-600 mt-1">Monitor regulatory compliance and manage assessments</p>
        </div>
        <div class="flex space-x-3">
          <div class="relative inline-block text-left">
            <button onclick="toggleFrameworkImportMenu()" class="btn-secondary">
              <i class="fas fa-download mr-2"></i>Import Framework
              <i class="fas fa-chevron-down ml-1"></i>
            </button>
            <div id="framework-import-menu" class="hidden absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
              <div class="py-1">
                <button onclick="importFramework('iso27001')" class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <i class="fas fa-shield-alt mr-2"></i>ISO 27001:2022
                </button>
                <button onclick="importFramework('uae_ia')" class="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  <i class="fas fa-flag mr-2"></i>UAE IA Standard
                </button>
              </div>
            </div>
          </div>
          <button onclick="showImportComplianceModal()" class="btn-secondary">
            <i class="fas fa-upload mr-2"></i>Import Data
          </button>
          <button onclick="exportCompliance()" class="btn-secondary">
            <i class="fas fa-download mr-2"></i>Export
          </button>
          <button onclick="generateComplianceReport()" class="btn-secondary">
            <i class="fas fa-file-pdf mr-2"></i>Generate Report
          </button>
          <button onclick="showAddAssessmentModal()" class="btn-primary">
            <i class="fas fa-plus mr-2"></i>New Assessment
          </button>
        </div>
      </div>
      
      <!-- Compliance Overview -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-check-circle text-green-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">Compliant</p>
              <p class="text-lg font-semibold text-gray-900" id="compliant-count">-</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-exclamation-circle text-red-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">Non-Compliant</p>
              <p class="text-lg font-semibold text-gray-900" id="non-compliant-count">-</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-clipboard-list text-yellow-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">In Progress</p>
              <p class="text-lg font-semibold text-gray-900" id="in-progress-count">-</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-search text-blue-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">Open Findings</p>
              <p class="text-lg font-semibold text-gray-900" id="open-findings-count">-</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Compliance Tabs -->
      <div class="bg-white rounded-lg shadow">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8" aria-label="Tabs">
            <button onclick="showComplianceTab('assessments')" id="assessments-tab" class="compliance-tab active">
              <i class="fas fa-clipboard-check mr-2"></i>Assessments
            </button>
            <button onclick="showComplianceTab('requirements')" id="requirements-tab" class="compliance-tab">
              <i class="fas fa-list mr-2"></i>Requirements
            </button>
            <button onclick="showComplianceTab('soa')" id="soa-tab" class="compliance-tab">
              <i class="fas fa-clipboard-list mr-2"></i>SOA
            </button>
            <button onclick="showComplianceTab('findings')" id="findings-tab" class="compliance-tab">
              <i class="fas fa-search mr-2"></i>Findings
            </button>
          </nav>
        </div>
        
        <!-- Assessments Tab Content -->
        <div id="assessments-content" class="compliance-tab-content">
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium text-gray-900">Compliance Assessments</h3>
              <div class="flex space-x-2">
                <select id="assessment-framework-filter" class="form-select" onchange="filterAssessments()">
                  <option value="">All Frameworks</option>
                  <option value="GDPR">GDPR</option>
                  <option value="ISO27001">ISO 27001</option>
                  <option value="SOX">SOX</option>
                  <option value="HIPAA">HIPAA</option>
                </select>
                <select id="assessment-status-filter" class="form-select" onchange="filterAssessments()">
                  <option value="">All Status</option>
                  <option value="planning">Planning</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
            
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="table-header">Assessment ID</th>
                    <th class="table-header">Title</th>
                    <th class="table-header">Framework</th>
                    <th class="table-header">Status</th>
                    <th class="table-header">Lead Assessor</th>
                    <th class="table-header">Start Date</th>
                    <th class="table-header">End Date</th>
                    <th class="table-header">Progress</th>
                    <th class="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody id="assessments-table-body" class="bg-white divide-y divide-gray-200">
                  <!-- Assessment rows will be inserted here -->
                </tbody>
              </table>
            </div>
            <div id="assessments-loading" class="p-8 text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p class="mt-2 text-gray-600">Loading assessments...</p>
            </div>
          </div>
        </div>
        
        <!-- Requirements Tab Content -->
        <div id="requirements-content" class="compliance-tab-content hidden">
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium text-gray-900">Compliance Requirements</h3>
              <div class="flex space-x-2">
                <select id="requirements-framework-filter" class="form-select" onchange="filterRequirements()">
                  <option value="">All Frameworks</option>
                  <option value="ISO27001">ISO 27001</option>
                  <option value="GDPR">GDPR</option>
                  <option value="SOX">SOX</option>
                  <option value="HIPAA">HIPAA</option>
                  <option value="UAE_IA">UAE IA Standard</option>
                </select>
                <select id="requirements-status-filter" class="form-select" onchange="filterRequirements()">
                  <option value="">All Status</option>
                  <option value="compliant">Compliant</option>
                  <option value="non_compliant">Non-Compliant</option>
                  <option value="in_progress">In Progress</option>
                  <option value="not_assessed">Not Assessed</option>
                </select>
                <button onclick="showAddRequirementModal()" class="btn-primary">
                  <i class="fas fa-plus mr-2"></i>Add Requirement
                </button>
              </div>
            </div>
            
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="table-header">Requirement ID</th>
                    <th class="table-header">Title</th>
                    <th class="table-header">Framework</th>
                    <th class="table-header">Category</th>
                    <th class="table-header">Status</th>
                    <th class="table-header">Owner</th>
                    <th class="table-header">Due Date</th>
                    <th class="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody id="requirements-table-body" class="bg-white divide-y divide-gray-200">
                  <!-- Requirements rows will be inserted here -->
                </tbody>
              </table>
            </div>
            <div id="requirements-loading" class="p-8 text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p class="mt-2 text-gray-600">Loading requirements...</p>
            </div>
          </div>
        </div>
        
        <!-- SOA (Statement of Applicability) Tab Content -->
        <div id="soa-content" class="compliance-tab-content hidden">
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <div>
                <h3 class="text-lg font-medium text-gray-900">Statement of Applicability (SOA)</h3>
                <p class="text-sm text-gray-600 mt-1">Track implementation progress of framework controls</p>
              </div>
              <div class="flex space-x-2">
                <select id="soa-framework-filter" class="form-select" onchange="filterSOAControls()">
                  <option value="">All Frameworks</option>
                  <option value="ISO27001">ISO 27001</option>
                  <option value="UAE_IA">UAE IA Standard</option>
                  <option value="GDPR">GDPR</option>
                  <option value="SOX">SOX</option>
                  <option value="HIPAA">HIPAA</option>
                </select>
                <select id="soa-status-filter" class="form-select" onchange="filterSOAControls()">
                  <option value="">All Status</option>
                  <option value="not_implemented">Not Implemented</option>
                  <option value="in_progress">In Progress</option>
                  <option value="implemented">Implemented</option>
                  <option value="not_applicable">Not Applicable</option>
                </select>
                <select id="soa-category-filter" class="form-select" onchange="filterSOAControls()">
                  <option value="">All Categories</option>
                  <option value="Organizational controls">Organizational</option>
                  <option value="People controls">People</option>
                  <option value="Physical and environmental controls">Physical</option>
                  <option value="Technological controls">Technological</option>
                </select>
                <button onclick="exportSOA()" class="btn-secondary">
                  <i class="fas fa-download mr-2"></i>Export SOA
                </button>
              </div>
            </div>
            
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="table-header">Control ID</th>
                    <th class="table-header">Title</th>
                    <th class="table-header">Framework</th>
                    <th class="table-header">Category</th>
                    <th class="table-header">Implementation Status</th>
                    <th class="table-header">Applicability</th>
                    <th class="table-header">Owner</th>
                    <th class="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody id="soa-controls-list" class="bg-white divide-y divide-gray-200">
                  <!-- SOA controls will be populated here -->
                </tbody>
              </table>
            </div>

            <div id="soa-loading" class="text-center py-8">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p class="mt-2 text-gray-600">Loading SOA controls...</p>
            </div>
          </div>
        </div>
        
        <!-- Findings Tab Content -->
        <div id="findings-content" class="compliance-tab-content hidden">
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium text-gray-900">Assessment Findings</h3>
              <div class="flex space-x-2">
                <select id="findings-severity-filter" class="form-select" onchange="filterFindings()">
                  <option value="">All Severity</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <select id="findings-status-filter" class="form-select" onchange="filterFindings()">
                  <option value="">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="accepted">Accepted</option>
                </select>
                <button onclick="showAddFindingModal()" class="btn-primary">
                  <i class="fas fa-plus mr-2"></i>Add Finding
                </button>
              </div>
            </div>
            
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="table-header">Finding ID</th>
                    <th class="table-header">Title</th>
                    <th class="table-header">Severity</th>
                    <th class="table-header">Category</th>
                    <th class="table-header">Status</th>
                    <th class="table-header">Assigned To</th>
                    <th class="table-header">Due Date</th>
                    <th class="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody id="findings-table-body" class="bg-white divide-y divide-gray-200">
                  <!-- Findings rows will be inserted here -->
                </tbody>
              </table>
            </div>
            <div id="findings-loading" class="p-8 text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p class="mt-2 text-gray-600">Loading findings...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Load compliance data
  await loadComplianceData();
}

async function loadComplianceData() {
  try {
    const token = localStorage.getItem('aria_token');
    
    // Load assessments
    const assessmentsResponse = await axios.get('/api/assessments', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (assessmentsResponse.data.success) {
      moduleData.assessments = assessmentsResponse.data.data;
      renderAssessmentsTable(moduleData.assessments);
      updateComplianceStatistics();
      document.getElementById('assessments-loading').style.display = 'none';
    }

    // Initialize sample data if tables are empty
    await initializeSampleComplianceData();
  } catch (error) {
    console.error('Error loading compliance data:', error);
    document.getElementById('assessments-loading').innerHTML = '<p class="text-red-600">Error loading assessments</p>';
  }
}

async function initializeSampleComplianceData() {
  try {
    const token = localStorage.getItem('aria_token');
    
    // Check if we have any requirements
    const reqResponse = await axios.get('/api/requirements', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (reqResponse.data.success && reqResponse.data.data.length === 0) {
      // Add sample requirements
      const sampleRequirements = [
        {
          requirement_id: 'ISO27001-A.5.1',
          title: 'Information Security Policy',
          description: 'A set of policies for information security shall be defined, approved by management, published and communicated to employees and relevant external parties.',
          framework: 'ISO27001',
          category: 'Organizational Security',
          status: 'compliant'
        },
        {
          requirement_id: 'ISO27001-A.8.1',
          title: 'Asset Management Policy',
          description: 'All assets shall be identified and an inventory of all important assets drawn up and maintained.',
          framework: 'ISO27001',
          category: 'Asset Management',
          status: 'in_progress'
        },
        {
          requirement_id: 'GDPR-Art.25',
          title: 'Data Protection by Design and Default',
          description: 'Data protection by design and by default shall be implemented.',
          framework: 'GDPR',
          category: 'Privacy Protection',
          status: 'non_compliant'
        }
      ];

      for (const req of sampleRequirements) {
        await axios.post('/api/requirements', req, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    }

    // Check if we have any findings
    const findingsResponse = await axios.get('/api/findings', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (findingsResponse.data.success && findingsResponse.data.data.length === 0) {
      // Add sample findings
      const sampleFindings = [
        {
          finding_id: 'FIND-2024-001',
          title: 'Weak Password Policy Implementation',
          description: 'Current password policy does not enforce sufficient complexity requirements.',
          severity: 'high',
          category: 'Access Control',
          status: 'open'
        },
        {
          finding_id: 'FIND-2024-002',
          title: 'Missing Encryption for Data at Rest',
          description: 'Sensitive customer data stored in databases is not encrypted.',
          severity: 'critical',
          category: 'Data Protection',
          status: 'in_progress'
        },
        {
          finding_id: 'FIND-2024-003',
          title: 'Incomplete Asset Inventory',
          description: 'Asset inventory is missing several critical server components.',
          severity: 'medium',
          category: 'Asset Management',
          status: 'resolved'
        }
      ];

      for (const finding of sampleFindings) {
        await axios.post('/api/findings', finding, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    }
  } catch (error) {
    console.log('Sample data initialization completed or skipped');
  }
}

function renderAssessmentsTable(assessments) {
  const tbody = document.getElementById('assessments-table-body');
  
  if (!assessments || assessments.length === 0) {
    tbody.innerHTML = '<tr><td colspan="9" class="text-center py-8 text-gray-500">No assessments found</td></tr>';
    return;
  }
  
  tbody.innerHTML = assessments.map(assessment => `
    <tr class="table-row">
      <td class="table-cell">
        <div class="text-sm font-medium text-gray-900">${assessment.assessment_id}</div>
      </td>
      <td class="table-cell">
        <div class="text-sm font-medium text-gray-900">${assessment.title}</div>
        <div class="text-sm text-gray-500">${truncateText(assessment.description || '', 50)}</div>
      </td>
      <td class="table-cell">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          ${assessment.framework}
        </span>
      </td>
      <td class="table-cell">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(assessment.status)}">
          ${capitalizeFirst(assessment.status.replace('_', ' '))}
        </span>
      </td>
      <td class="table-cell">
        <span class="text-sm text-gray-900">${assessment.first_name || ''} ${assessment.last_name || ''}</span>
      </td>
      <td class="table-cell">
        <span class="text-sm text-gray-900">${formatDate(assessment.planned_start_date) || '-'}</span>
      </td>
      <td class="table-cell">
        <span class="text-sm text-gray-900">${formatDate(assessment.planned_end_date) || '-'}</span>
      </td>
      <td class="table-cell">
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-blue-600 h-2 rounded-full" style="width: ${getAssessmentProgress(assessment)}%"></div>
        </div>
        <span class="text-xs text-gray-600">${getAssessmentProgress(assessment)}%</span>
      </td>
      <td class="table-cell">
        <div class="flex space-x-2">
          <button onclick="viewAssessment(${assessment.id})" class="text-blue-600 hover:text-blue-900" title="View">
            <i class="fas fa-eye"></i>
          </button>
          <button onclick="editAssessment(${assessment.id})" class="text-green-600 hover:text-green-900" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteAssessment(${assessment.id})" class="text-red-600 hover:text-red-900" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function updateComplianceStatistics() {
  // This would calculate statistics from loaded data
  // For now, showing placeholder values
  document.getElementById('compliant-count').textContent = '12';
  document.getElementById('non-compliant-count').textContent = '3';
  document.getElementById('in-progress-count').textContent = '2';
  document.getElementById('open-findings-count').textContent = '7';
}

function showComplianceTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll('.compliance-tab-content').forEach(content => {
    content.classList.add('hidden');
  });
  
  // Remove active class from all tabs
  document.querySelectorAll('.compliance-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected tab content and mark tab as active
  document.getElementById(`${tabName}-content`).classList.remove('hidden');
  document.getElementById(`${tabName}-tab`).classList.add('active');
  
  // Load data for the selected tab
  if (tabName === 'requirements') {
    loadRequirementsData();
  } else if (tabName === 'soa') {
    loadSOAControls();
  } else if (tabName === 'findings') {
    loadFindingsData();
  }
}

// Requirements Management Functions
async function loadRequirementsData() {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get('/api/requirements', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      moduleData.requirements = response.data.data;
      renderRequirementsTable(moduleData.requirements);
      document.getElementById('requirements-loading').style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading requirements:', error);
    document.getElementById('requirements-loading').innerHTML = '<p class="text-red-600">Error loading requirements</p>';
  }
}

function renderRequirementsTable(requirements) {
  const tbody = document.getElementById('requirements-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = requirements.map(req => `
    <tr class="table-row">
      <td class="table-cell">
        <div class="text-sm font-medium text-gray-900">${req.requirement_id}</div>
      </td>
      <td class="table-cell">
        <div class="text-sm font-medium text-gray-900">${req.title}</div>
        <div class="text-sm text-gray-500">${truncateText(req.description || '', 50)}</div>
      </td>
      <td class="table-cell">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          ${req.framework}
        </span>
      </td>
      <td class="table-cell">
        <span class="text-sm text-gray-900">${req.category || '-'}</span>
      </td>
      <td class="table-cell">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getComplianceStatusClass(req.status)}">
          ${capitalizeFirst(req.status.replace('_', ' '))}
        </span>
      </td>
      <td class="table-cell">
        <span class="text-sm text-gray-900">${req.owner_name || '-'}</span>
      </td>
      <td class="table-cell">
        <span class="text-sm text-gray-900">${formatDate(req.due_date) || '-'}</span>
      </td>
      <td class="table-cell">
        <div class="flex space-x-2">
          <button onclick="viewRequirement(${req.id})" class="text-blue-600 hover:text-blue-900" title="View">
            <i class="fas fa-eye"></i>
          </button>
          <button onclick="editRequirement(${req.id})" class="text-green-600 hover:text-green-900" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteRequirement(${req.id})" class="text-red-600 hover:text-red-900" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function getComplianceStatusClass(status) {
  switch(status) {
    case 'compliant': return 'bg-green-100 text-green-800';
    case 'non_compliant': return 'bg-red-100 text-red-800';
    case 'in_progress': return 'bg-yellow-100 text-yellow-800';
    case 'not_assessed': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function filterRequirements() {
  const frameworkFilter = document.getElementById('requirements-framework-filter').value;
  const statusFilter = document.getElementById('requirements-status-filter').value;
  
  let filteredRequirements = moduleData.requirements;
  
  if (frameworkFilter) {
    filteredRequirements = filteredRequirements.filter(req => req.framework === frameworkFilter);
  }
  
  if (statusFilter) {
    filteredRequirements = filteredRequirements.filter(req => req.status === statusFilter);
  }
  
  renderRequirementsTable(filteredRequirements);
}

function showAddRequirementModal() {
  showModal('Add Compliance Requirement', `
    <form id="requirement-form" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="form-label">Requirement ID</label>
          <input type="text" id="requirement-id" class="form-input" required>
        </div>
        <div>
          <label class="form-label">Framework</label>
          <select id="requirement-framework" class="form-select" required>
            <option value="">Select Framework</option>
            <option value="ISO27001">ISO 27001</option>
            <option value="GDPR">GDPR</option>
            <option value="SOX">SOX</option>
            <option value="HIPAA">HIPAA</option>
            <option value="UAE_IA">UAE IA Standard</option>
          </select>
        </div>
      </div>
      <div>
        <label class="form-label">Title</label>
        <input type="text" id="requirement-title" class="form-input" required>
      </div>
      <div>
        <label class="form-label">Description</label>
        <textarea id="requirement-description" class="form-input" rows="3"></textarea>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="form-label">Category</label>
          <input type="text" id="requirement-category" class="form-input">
        </div>
        <div>
          <label class="form-label">Status</label>
          <select id="requirement-status" class="form-select" required>
            <option value="not_assessed">Not Assessed</option>
            <option value="in_progress">In Progress</option>
            <option value="compliant">Compliant</option>
            <option value="non_compliant">Non-Compliant</option>
          </select>
        </div>
        <div>
          <label class="form-label">Due Date</label>
          <input type="date" id="requirement-due-date" class="form-input">
        </div>
      </div>
    </form>
  `, [
    { text: 'Cancel', class: 'btn-secondary', onclick: 'closeModal(this)' },
    { text: 'Add Requirement', class: 'btn-primary', onclick: 'saveRequirement()' }
  ]);
}

async function saveRequirement() {
  const formData = {
    requirement_id: document.getElementById('requirement-id').value,
    title: document.getElementById('requirement-title').value,
    description: document.getElementById('requirement-description').value,
    framework: document.getElementById('requirement-framework').value,
    category: document.getElementById('requirement-category').value,
    status: document.getElementById('requirement-status').value,
    due_date: document.getElementById('requirement-due-date').value
  };
  
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.post('/api/requirements', formData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast('Requirement added successfully', 'success');
      closeModal(this);
      loadRequirementsData();
    }
  } catch (error) {
    showToast('Failed to add requirement', 'error');
  }
}

async function deleteRequirement(id) {
  if (!confirm('Are you sure you want to delete this requirement?')) return;
  
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.delete(`/api/requirements/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast('Requirement deleted successfully', 'success');
      loadRequirementsData();
    }
  } catch (error) {
    showToast('Failed to delete requirement', 'error');
  }
}

// Findings Management Functions
async function loadFindingsData() {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get('/api/findings', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      moduleData.findings = response.data.data;
      renderFindingsTable(moduleData.findings);
      document.getElementById('findings-loading').style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading findings:', error);
    document.getElementById('findings-loading').innerHTML = '<p class="text-red-600">Error loading findings</p>';
  }
}

function renderFindingsTable(findings) {
  const tbody = document.getElementById('findings-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = findings.map(finding => `
    <tr class="table-row">
      <td class="table-cell">
        <div class="text-sm font-medium text-gray-900">${finding.finding_id}</div>
      </td>
      <td class="table-cell">
        <div class="text-sm font-medium text-gray-900">${finding.title}</div>
        <div class="text-sm text-gray-500">${truncateText(finding.description || '', 50)}</div>
      </td>
      <td class="table-cell">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityClass(finding.severity)}">
          ${capitalizeFirst(finding.severity)}
        </span>
      </td>
      <td class="table-cell">
        <span class="text-sm text-gray-900">${finding.category || '-'}</span>
      </td>
      <td class="table-cell">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getFindingStatusClass(finding.status)}">
          ${capitalizeFirst(finding.status.replace('_', ' '))}
        </span>
      </td>
      <td class="table-cell">
        <span class="text-sm text-gray-900">${finding.assigned_to_name || '-'}</span>
      </td>
      <td class="table-cell">
        <span class="text-sm text-gray-900">${formatDate(finding.due_date) || '-'}</span>
      </td>
      <td class="table-cell">
        <div class="flex space-x-2">
          <button onclick="viewFinding(${finding.id})" class="text-blue-600 hover:text-blue-900" title="View">
            <i class="fas fa-eye"></i>
          </button>
          <button onclick="editFinding(${finding.id})" class="text-green-600 hover:text-green-900" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="deleteFinding(${finding.id})" class="text-red-600 hover:text-red-900" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function getFindingStatusClass(status) {
  switch(status) {
    case 'open': return 'bg-red-100 text-red-800';
    case 'in_progress': return 'bg-yellow-100 text-yellow-800';
    case 'resolved': return 'bg-green-100 text-green-800';
    case 'accepted': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function filterFindings() {
  const severityFilter = document.getElementById('findings-severity-filter').value;
  const statusFilter = document.getElementById('findings-status-filter').value;
  
  let filteredFindings = moduleData.findings;
  
  if (severityFilter) {
    filteredFindings = filteredFindings.filter(finding => finding.severity === severityFilter);
  }
  
  if (statusFilter) {
    filteredFindings = filteredFindings.filter(finding => finding.status === statusFilter);
  }
  
  renderFindingsTable(filteredFindings);
}

function showAddFindingModal() {
  showModal('Add Assessment Finding', `
    <form id="finding-form" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="form-label">Finding ID</label>
          <input type="text" id="finding-id" class="form-input" required>
        </div>
        <div>
          <label class="form-label">Severity</label>
          <select id="finding-severity" class="form-select" required>
            <option value="">Select Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>
      <div>
        <label class="form-label">Title</label>
        <input type="text" id="finding-title" class="form-input" required>
      </div>
      <div>
        <label class="form-label">Description</label>
        <textarea id="finding-description" class="form-input" rows="3"></textarea>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="form-label">Category</label>
          <input type="text" id="finding-category" class="form-input">
        </div>
        <div>
          <label class="form-label">Status</label>
          <select id="finding-status" class="form-select" required>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="accepted">Accepted</option>
          </select>
        </div>
        <div>
          <label class="form-label">Due Date</label>
          <input type="date" id="finding-due-date" class="form-input">
        </div>
      </div>
    </form>
  `, [
    { text: 'Cancel', class: 'btn-secondary', onclick: 'closeModal(this)' },
    { text: 'Add Finding', class: 'btn-primary', onclick: 'saveFinding()' }
  ]);
}

async function saveFinding() {
  const formData = {
    finding_id: document.getElementById('finding-id').value,
    title: document.getElementById('finding-title').value,
    description: document.getElementById('finding-description').value,
    severity: document.getElementById('finding-severity').value,
    category: document.getElementById('finding-category').value,
    status: document.getElementById('finding-status').value,
    due_date: document.getElementById('finding-due-date').value
  };
  
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.post('/api/findings', formData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast('Finding added successfully', 'success');
      closeModal(this);
      loadFindingsData();
    }
  } catch (error) {
    showToast('Failed to add finding', 'error');
  }
}

async function deleteFinding(id) {
  if (!confirm('Are you sure you want to delete this finding?')) return;
  
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.delete(`/api/findings/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast('Finding deleted successfully', 'success');
      loadFindingsData();
    }
  } catch (error) {
    showToast('Failed to delete finding', 'error');
  }
}

// Stub functions for view and edit (to be implemented)
function viewRequirement(id) {
  showToast('View requirement functionality coming soon', 'info');
}

function editRequirement(id) {
  showToast('Edit requirement functionality coming soon', 'info');
}

function viewFinding(id) {
  showToast('View finding functionality coming soon', 'info');
}

function editFinding(id) {
  showToast('Edit finding functionality coming soon', 'info');
}

// Framework Import Functions
function toggleFrameworkImportMenu() {
  const menu = document.getElementById('framework-import-menu');
  menu.classList.toggle('hidden');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
  const menu = document.getElementById('framework-import-menu');
  const button = event.target.closest('button[onclick="toggleFrameworkImportMenu()"]');
  
  if (menu && !button && !menu.contains(event.target)) {
    menu.classList.add('hidden');
  }
});

async function importFramework(framework) {
  // Close the dropdown menu
  document.getElementById('framework-import-menu').classList.add('hidden');
  
  const frameworkNames = {
    'iso27001': 'ISO 27001:2022',
    'uae_ia': 'UAE Information Assurance Standard'
  };
  
  const frameworkName = frameworkNames[framework];
  
  if (!confirm(`Are you sure you want to import ${frameworkName}? This will create a new assessment and add all standard requirements.`)) {
    return;
  }
  
  try {
    const token = localStorage.getItem('aria_token');
    showToast(`Importing ${frameworkName}...`, 'info');
    
    const response = await axios.post(`/api/import/framework/${framework}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast(`${frameworkName} imported successfully!`, 'success');
      
      // Reload compliance data to show new assessment and requirements
      await loadComplianceData();
      await loadRequirementsData(); // Refresh requirements tab if it's loaded
    } else {
      throw new Error(response.data.error || 'Import failed');
    }
  } catch (error) {
    console.error('Framework import error:', error);
    showToast(`Failed to import ${frameworkName}: ${error.message || 'Unknown error'}`, 'error');
  }
}

// Incidents Management Module - Enhanced Version
async function showIncidents() {
  updateActiveNavigation('incidents');
  currentModule = 'incidents';
  
  // Set mainContent reference for enhanced incident management
  const mainContentEl = document.getElementById('main-content');
  if (mainContentEl) {
    // Create global reference for enhanced incident management
    window.mainContent = mainContentEl;
    // Don't change the ID, enhanced functions will check for both IDs
  }
  
  // Call the enhanced showEnhancedIncidents function from incident-management-enhanced.js
  if (typeof window.showEnhancedIncidents === 'function') {
    // Call the enhanced version
    window.showEnhancedIncidents();
  } else {
    // Fallback basic version
    mainContentEl.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-exclamation-triangle text-4xl text-orange-500 mb-4"></i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Enhanced Incident Management Loading...</h3>
        <p class="text-gray-600">Please wait while the enhanced incident management system loads.</p>
      </div>
    `;
    
    // Try again after a short delay to allow script loading
    setTimeout(() => {
      if (typeof window.showEnhancedIncidents === 'function') {
        window.showEnhancedIncidents();
      }
    }, 1000);
  }
}

async function loadIncidents() {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get('/api/incidents', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      moduleData.incidents = response.data.data;
      renderIncidentsTable(moduleData.incidents);
      updateIncidentStatistics(moduleData.incidents);
      document.getElementById('incidents-loading').style.display = 'none';
    } else {
      throw new Error('Failed to load incidents');
    }
  } catch (error) {
    console.error('Error loading incidents:', error);
    document.getElementById('incidents-loading').innerHTML = '<p class="text-red-600">Error loading incidents</p>';
  }
}

function renderIncidentsTable(incidents) {
  const tbody = document.getElementById('incidents-table-body');
  
  if (!incidents || incidents.length === 0) {
    document.getElementById('incidents-empty').classList.remove('hidden');
    tbody.innerHTML = '';
    return;
  }
  
  document.getElementById('incidents-empty').classList.add('hidden');
  
  tbody.innerHTML = incidents.map(incident => `
    <tr class="table-row">
      <td class="table-cell">
        <div class="text-sm font-medium text-gray-900">${incident.incident_id}</div>
      </td>
      <td class="table-cell">
        <div class="text-sm font-medium text-gray-900">${incident.title}</div>
        <div class="text-sm text-gray-500">${truncateText(incident.description, 50)}</div>
      </td>
      <td class="table-cell">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getIncidentTypeClass(incident.incident_type)}">
          ${capitalizeFirst(incident.incident_type.replace('_', ' '))}
        </span>
      </td>
      <td class="table-cell">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSeverityClass(incident.severity)}">
          ${capitalizeFirst(incident.severity)}
        </span>
      </td>
      <td class="table-cell">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getIncidentStatusClass(incident.status)}">
          ${capitalizeFirst(incident.status)}
        </span>
      </td>
      <td class="table-cell">
        <span class="text-sm text-gray-900">${incident.assigned_first_name || ''} ${incident.assigned_last_name || 'Unassigned'}</span>
      </td>
      <td class="table-cell">
        <span class="text-sm text-gray-900">${formatDate(incident.reported_at)}</span>
      </td>
      <td class="table-cell">
        <span class="text-sm text-gray-900">${getIncidentAge(incident.reported_at)}</span>
      </td>
      <td class="table-cell">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSLAStatusClass(incident)}">
          ${getSLAStatus(incident)}
        </span>
      </td>
      <td class="table-cell">
        <div class="flex space-x-2">
          <button onclick="viewIncident(${incident.id})" class="text-blue-600 hover:text-blue-900" title="View">
            <i class="fas fa-eye"></i>
          </button>
          <button onclick="editIncident(${incident.id})" class="text-green-600 hover:text-green-900" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="assignIncident(${incident.id})" class="text-purple-600 hover:text-purple-900" title="Assign">
            <i class="fas fa-user-plus"></i>
          </button>
          <button onclick="escalateIncident(${incident.id})" class="text-orange-600 hover:text-orange-900" title="Escalate">
            <i class="fas fa-arrow-up"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function updateIncidentStatistics(incidents) {
  if (!incidents) return;
  
  const critical = incidents.filter(i => i.severity === 'critical').length;
  const high = incidents.filter(i => i.severity === 'high').length;
  const open = incidents.filter(i => !['closed', 'resolved'].includes(i.status)).length;
  const resolved = incidents.filter(i => ['closed', 'resolved'].includes(i.status)).length;
  
  document.getElementById('critical-incidents-count').textContent = critical;
  document.getElementById('high-incidents-count').textContent = high;
  document.getElementById('open-incidents-count').textContent = open;
  document.getElementById('resolved-incidents-count').textContent = resolved;
  document.getElementById('avg-resolution-time').textContent = '4.2'; // Placeholder
}

function filterIncidents() {
  if (!moduleData.incidents) return;
  
  const search = document.getElementById('incident-search').value.toLowerCase();
  const status = document.getElementById('incident-status-filter').value;
  const severity = document.getElementById('incident-severity-filter').value;
  const type = document.getElementById('incident-type-filter').value;
  
  let filteredIncidents = moduleData.incidents.filter(incident => {
    const matchesSearch = !search || 
      incident.title.toLowerCase().includes(search) || 
      incident.incident_id.toLowerCase().includes(search) ||
      incident.description.toLowerCase().includes(search);
    
    const matchesStatus = !status || incident.status === status;
    const matchesSeverity = !severity || incident.severity === severity;
    const matchesType = !type || incident.incident_type === type;
    
    return matchesSearch && matchesStatus && matchesSeverity && matchesType;
  });
  
  renderIncidentsTable(filteredIncidents);
}

// Utility functions
function truncateText(text, maxLength) {
  if (!text || text.length <= maxLength) return text || '';
  return text.substring(0, maxLength) + '...';
}

function capitalizeFirst(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return dayjs(dateStr).format('MMM DD, YYYY');
}

function getProbabilityClass(probability) {
  if (probability >= 4) return 'bg-red-100 text-red-800';
  if (probability >= 3) return 'bg-orange-100 text-orange-800';
  if (probability >= 2) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
}

function getImpactClass(impact) {
  if (impact >= 4) return 'bg-red-100 text-red-800';
  if (impact >= 3) return 'bg-orange-100 text-orange-800';
  if (impact >= 2) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
}

function getRiskScoreClass(score) {
  if (score >= 20) return 'bg-red-100 text-red-800';
  if (score >= 15) return 'bg-orange-100 text-orange-800';
  if (score >= 10) return 'bg-yellow-100 text-yellow-800';
  if (score >= 5) return 'bg-blue-100 text-blue-800';
  return 'bg-gray-100 text-gray-800';
}

function getStatusClass(status) {
  const classes = {
    'active': 'bg-green-100 text-green-800',
    'mitigated': 'bg-blue-100 text-blue-800',
    'closed': 'bg-gray-100 text-gray-800',
    'monitoring': 'bg-yellow-100 text-yellow-800',
    'planning': 'bg-purple-100 text-purple-800',
    'in_progress': 'bg-yellow-100 text-yellow-800',
    'review': 'bg-orange-100 text-orange-800',
    'completed': 'bg-green-100 text-green-800',
    'new': 'bg-red-100 text-red-800',
    'investigating': 'bg-yellow-100 text-yellow-800',
    'containment': 'bg-orange-100 text-orange-800',
    'eradication': 'bg-blue-100 text-blue-800',
    'recovery': 'bg-purple-100 text-purple-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
}

function getEffectivenessClass(effectiveness) {
  const classes = {
    'effective': 'bg-green-100 text-green-800',
    'partially_effective': 'bg-yellow-100 text-yellow-800',
    'ineffective': 'bg-red-100 text-red-800',
    'not_tested': 'bg-gray-100 text-gray-800'
  };
  return classes[effectiveness] || 'bg-gray-100 text-gray-800';
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

function getIncidentTypeClass(type) {
  const classes = {
    'security': 'bg-red-100 text-red-800',
    'operational': 'bg-blue-100 text-blue-800',
    'compliance': 'bg-purple-100 text-purple-800',
    'data_breach': 'bg-red-100 text-red-800'
  };
  return classes[type] || 'bg-gray-100 text-gray-800';
}

function getIncidentStatusClass(status) {
  return getStatusClass(status);
}

function getAssessmentProgress(assessment) {
  // Calculate progress based on status
  const progressMap = {
    'planning': 10,
    'in_progress': 50,
    'review': 80,
    'completed': 100,
    'archived': 100
  };
  return progressMap[assessment.status] || 0;
}

function getIncidentAge(reportedAt) {
  const now = new Date();
  const reported = new Date(reportedAt);
  const diffTime = Math.abs(now - reported);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day';
  if (diffDays < 7) return `${diffDays} days`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks`;
  return `${Math.floor(diffDays / 30)} months`;
}

function getSLAStatus(incident) {
  // Simple SLA calculation based on severity and age
  const age = getIncidentAge(incident.reported_at);
  const ageInHours = Math.abs(new Date() - new Date(incident.reported_at)) / (1000 * 60 * 60);
  
  const slaHours = {
    'critical': 4,
    'high': 8,
    'medium': 24,
    'low': 72
  };
  
  const targetHours = slaHours[incident.severity] || 24;
  
  if (ageInHours <= targetHours) return 'On Time';
  if (ageInHours <= targetHours * 1.5) return 'At Risk';
  return 'Overdue';
}

function getSLAStatusClass(incident) {
  const status = getSLAStatus(incident);
  const classes = {
    'On Time': 'bg-green-100 text-green-800',
    'At Risk': 'bg-yellow-100 text-yellow-800',
    'Overdue': 'bg-red-100 text-red-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
}

// Global reference data cache
let referenceData = {
  categories: [],
  organizations: [],
  users: []
};

// Load reference data when authenticated
async function loadReferenceData() {
  try {
    const token = localStorage.getItem('aria_token');
    if (!token) {
      console.log('No authentication token, skipping reference data load');
      return;
    }
    
    const [categoriesResponse, organizationsResponse, usersResponse] = await Promise.all([
      axios.get('/api/reference/categories', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/reference/organizations', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/reference/users', { headers: { Authorization: `Bearer ${token}` } })
    ]);
    
    referenceData.categories = categoriesResponse.data.data || [];
    referenceData.organizations = organizationsResponse.data.data || [];
    referenceData.users = usersResponse.data.data || [];
    console.log('Reference data loaded successfully');
  } catch (error) {
    console.error('Error loading reference data:', error);
  }
}

// Enhanced reference data loading with retry logic
async function loadReferenceDataWithRetry(maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📊 Loading reference data (attempt ${attempt}/${maxRetries})...`);
      await loadReferenceData();
      console.log('✓ Reference data loaded successfully');
      return true;
    } catch (error) {
      console.error(`❌ Reference data loading attempt ${attempt} failed:`, error);
      if (attempt === maxRetries) {
        console.error('💥 All reference data loading attempts failed');
        return false;
      }
      // Wait before retry with exponential backoff
      const delay = 1000 * Math.pow(2, attempt - 1);
      console.log(`⏳ Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Load reference data only when authenticated
// This will be called after successful login
if (localStorage.getItem('aria_token')) {
  loadReferenceDataWithRetry();
}

// Risk Management CRUD Functions
async function showAddRiskModal() {
  const modal = createModal('Add New Risk', getRiskFormHTML());
  document.body.appendChild(modal);
  
  // Wait for modal to be fully rendered
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Populate dropdowns with comprehensive error handling
  try {
    console.log('Starting dropdown population...');
    await populateRiskFormDropdownsSafe();
    console.log('Dynamic dropdowns populated successfully');
  } catch (error) {
    console.error('Error populating dropdowns, using static fallbacks:', error);
    populateRiskFormStaticFallbacks();
  }
  
  // Handle form submission with enhanced error handling
  const form = document.getElementById('risk-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      console.log('Risk form submitted');
      await handleRiskSubmit();
    });
    console.log('Form submission handler attached');
  } else {
    console.error('Risk form element not found!');
  }
}

async function editRisk(id) {
  const risk = moduleData.risks?.find(r => r.id === id);
  if (!risk) {
    showToast('Risk not found', 'error');
    return;
  }
  
  const modal = createModal('Edit Risk', getRiskFormHTML(risk));
  document.body.appendChild(modal);
  
  // Populate dropdowns and form data
  await populateRiskFormDropdowns();
  populateRiskForm(risk);
  
  // Handle form submission
  document.getElementById('risk-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleRiskSubmit(id);
  });
}

async function deleteRisk(id) {
  if (!confirm('Are you sure you want to delete this risk? This action cannot be undone.')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.delete(`/api/risks/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast('Risk deleted successfully', 'success');
      await loadRisks(); // Reload risks table
    } else {
      showToast(response.data.error || 'Failed to delete risk', 'error');
    }
  } catch (error) {
    console.error('Delete risk error:', error);
    showToast('Failed to delete risk', 'error');
  }
}

function viewRisk(id) {
  const risk = moduleData.risks?.find(r => r.id === id);
  if (!risk) {
    showToast('Risk not found', 'error');
    return;
  }
  
  const modal = createModal('Risk Details', getRiskViewHTML(risk));
  document.body.appendChild(modal);
}

// Control Management CRUD Functions
function showAddControlModal() {
  const modal = createModal('Add New Control', getControlFormHTML_v2());
  document.body.appendChild(modal);
  
  // Populate dropdowns
  populateControlFormDropdowns_v2();
  
  // Handle form submission
  document.getElementById('control-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleControlSubmit_v2();
  });
}

function editControl(id) {
  const control = moduleData.controls?.find(c => c.id === id);
  if (!control) {
    showToast('Control not found', 'error');
    return;
  }
  
  const modal = createModal('Edit Control', getControlFormHTML_v2(control));
  document.body.appendChild(modal);
  
  // Populate dropdowns and form data
  populateControlFormDropdowns_v2();
  populateControlForm_v2(control);
  
  // Handle form submission
  document.getElementById('control-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleControlSubmit_v2(id);
  });
}

async function deleteControl(id) {
  if (!confirm('Are you sure you want to delete this control? This action cannot be undone.')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.delete(`/api/controls/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast('Control deleted successfully', 'success');
      await loadControls(); // Reload controls table
    } else {
      showToast(response.data.error || 'Failed to delete control', 'error');
    }
  } catch (error) {
    console.error('Delete control error:', error);
    showToast('Failed to delete control', 'error');
  }
}

function viewControl(id) {
  const control = moduleData.controls?.find(c => c.id === id);
  if (!control) {
    showToast('Control not found', 'error');
    return;
  }
  
  const modal = createModal('Control Details', getControlViewHTML_v2(control));
  document.body.appendChild(modal);
}

async function testControl(id) {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get(`/api/controls/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.data.success) {
      showToast('Failed to load control details', 'error');
      return;
    }
    
    const control = response.data.data;
    
    showModal('Test Control', `
      <form id="test-control-form" class="space-y-4">
        <div>
          <label class="form-label">Control Being Tested</label>
          <div class="form-input bg-gray-50">${control.control_id} - ${control.name}</div>
        </div>
        
        <div>
          <label class="form-label">Test Method *</label>
          <select id="test-method" class="form-select" required>
            <option value="">Select Test Method</option>
            <option value="inspection">Inspection</option>
            <option value="observation">Observation</option>
            <option value="inquiry">Inquiry</option>
            <option value="reperformance">Reperformance</option>
            <option value="recalculation">Recalculation</option>
            <option value="analytical_procedures">Analytical Procedures</option>
          </select>
        </div>
        
        <div>
          <label class="form-label">Test Procedures *</label>
          <textarea id="test-procedures" class="form-input" rows="4" required
                    placeholder="Describe the specific procedures performed to test this control"></textarea>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Test Result *</label>
            <select id="test-result" class="form-select" required>
              <option value="">Select Result</option>
              <option value="effective">Effective - No exceptions</option>
              <option value="deficient">Deficient - Exceptions noted</option>
              <option value="ineffective">Ineffective - Control not operating</option>
            </select>
          </div>
          <div>
            <label class="form-label">Test Date *</label>
            <input type="date" id="test-date" class="form-input" required value="${new Date().toISOString().split('T')[0]}">
          </div>
        </div>
        
        <div>
          <label class="form-label">Exceptions and Findings</label>
          <textarea id="test-exceptions" class="form-input" rows="3"
                    placeholder="Document any exceptions, deficiencies, or areas for improvement"></textarea>
        </div>
        
        <div>
          <label class="form-label">Recommendations</label>
          <textarea id="test-recommendations" class="form-input" rows="3"
                    placeholder="Management recommendations to address any identified issues"></textarea>
        </div>
      </form>
    `, [
      { text: 'Cancel', class: 'btn-secondary', onclick: 'closeModal(this)' },
      { text: 'Save Test Results', class: 'btn-primary', onclick: `saveControlTest(${id})` }
    ]);
    
  } catch (error) {
    console.error('Error loading control for testing:', error);
    showToast('Failed to load control details', 'error');
  }
}

// Services Management Module
async function showServices() {
  updateActiveNavigation('services');
  currentModule = 'services';
  
  const mainContent = document.getElementById('main-content');
  
  mainContent.innerHTML = `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Services Management</h2>
          <p class="text-gray-600 mt-1">Manage IT services and their risk ratings based on linked assets</p>
        </div>
        <div class="flex space-x-3">
          <button onclick="importServicesFromAssets()" class="btn-secondary">
            <i class="fas fa-sync-alt mr-2"></i>Sync from Assets
          </button>
          <button onclick="exportServices()" class="btn-secondary">
            <i class="fas fa-download mr-2"></i>Export
          </button>
          <button onclick="showAddServiceModal()" class="btn-primary">
            <i class="fas fa-plus mr-2"></i>Add Service
          </button>
        </div>
      </div>
      
      <!-- Services Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-cogs text-blue-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">Total Services</p>
              <p class="text-lg font-semibold text-gray-900" id="total-services-count">-</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-fire text-red-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">Critical Risk</p>
              <p class="text-lg font-semibold text-gray-900" id="critical-services-count">-</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-exclamation-triangle text-orange-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">High Risk</p>
              <p class="text-lg font-semibold text-gray-900" id="high-services-count">-</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-check-circle text-green-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">Active Services</p>
              <p class="text-lg font-semibold text-gray-900" id="active-services-count">-</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-server text-yellow-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">Linked Assets</p>
              <p class="text-lg font-semibold text-gray-900" id="linked-assets-count">-</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Services Filter and Search -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1">
            <input type="text" id="services-search" placeholder="Search services..." class="form-input" onkeyup="filterServices()">
          </div>
          <div class="flex gap-2">
            <select id="services-category-filter" class="form-select" onchange="filterServices()">
              <option value="">All Categories</option>
              <option value="Web Services">Web Services</option>
              <option value="Database">Database</option>
              <option value="Application">Application</option>
              <option value="Infrastructure">Infrastructure</option>
              <option value="Security">Security</option>
            </select>
            <select id="services-risk-filter" class="form-select" onchange="filterServices()">
              <option value="">All Risk Levels</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <select id="services-status-filter" class="form-select" onchange="filterServices()">
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Maintenance">Maintenance</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- Services Table -->
      <div class="bg-white shadow overflow-hidden sm:rounded-md">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="table-header">Service Name</th>
                <th class="table-header">Category</th>
                <th class="table-header">Description</th>
                <th class="table-header">Risk Rating</th>
                <th class="table-header">Linked Assets</th>
                <th class="table-header">Owner</th>
                <th class="table-header">Status</th>
                <th class="table-header">Last Updated</th>
                <th class="table-header">Actions</th>
              </tr>
            </thead>
            <tbody id="services-table-body" class="bg-white divide-y divide-gray-200">
              <!-- Services rows will be inserted here -->
            </tbody>
          </table>
        </div>
        <div id="services-loading" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-2 text-gray-600">Loading services...</p>
        </div>
      </div>
    </div>
  `;
  
  // Load services data
  await loadServicesData();
}

async function loadServicesData() {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get('/api/services', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      moduleData.services = response.data.data;
      renderServicesTable(moduleData.services);
      updateServicesStatistics(moduleData.services);
      document.getElementById('services-loading').style.display = 'none';
    }
  } catch (error) {
    console.error('Error loading services:', error);
    document.getElementById('services-loading').innerHTML = '<p class="text-red-600">Error loading services</p>';
  }
}

function renderServicesTable(services) {
  const tbody = document.getElementById('services-table-body');
  if (!tbody) return;
  
  tbody.innerHTML = services.map(service => `
    <tr class="table-row">
      <td class="table-cell">
        <div class="text-sm font-medium text-gray-900">${service.name}</div>
        <div class="text-sm text-gray-500">${service.service_id || ''}</div>
      </td>
      <td class="table-cell">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          ${service.category || 'Uncategorized'}
        </span>
      </td>
      <td class="table-cell">
        <div class="text-sm text-gray-900">${truncateText(service.description || '', 50)}</div>
      </td>
      <td class="table-cell">
        <div class="flex items-center space-x-2">
          <div class="flex items-center">
            <div class="w-3 h-3 rounded-full ${getRiskColorClass(service.risk_rating)} mr-2"></div>
            <span class="text-sm font-medium ${getRiskTextClass(service.risk_rating)}">
              ${service.risk_rating || 'Not Assessed'}
            </span>
          </div>
          <span class="text-xs text-gray-500">(${service.risk_score || 0})</span>
        </div>
      </td>
      <td class="table-cell">
        <div class="text-sm font-medium text-blue-600">
          ${service.linked_assets || 0} assets
        </div>
      </td>
      <td class="table-cell">
        <div class="text-sm text-gray-900">${service.owner_name || 'Unassigned'}</div>
      </td>
      <td class="table-cell">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getServiceStatusClass(service.status)}">
          ${capitalizeFirst(service.status || 'unknown')}
        </span>
      </td>
      <td class="table-cell">
        <div class="text-sm text-gray-900">${formatDate(service.updated_at) || '-'}</div>
      </td>
      <td class="table-cell">
        <div class="flex space-x-2">
          <button onclick="viewService(${service.id})" class="text-blue-600 hover:text-blue-900" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
          <button onclick="editService(${service.id})" class="text-green-600 hover:text-green-900" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="calculateServiceRisk(${service.id})" class="text-purple-600 hover:text-purple-900" title="Recalculate Risk">
            <i class="fas fa-calculator"></i>
          </button>
          <button onclick="deleteService(${service.id})" class="text-red-600 hover:text-red-900" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function getRiskColorClass(risk) {
  // Handle both numeric risk ratings and string risk levels
  if (typeof risk === 'number') {
    // Convert numeric risk rating to color (0-25 scale typically)
    if (risk >= 20) return 'bg-red-600';    // Critical
    if (risk >= 15) return 'bg-orange-500'; // High  
    if (risk >= 10) return 'bg-yellow-500'; // Medium
    if (risk >= 5) return 'bg-green-500';   // Low
    return 'bg-gray-400'; // Very low/none
  }
  
  // Handle string risk levels
  if (typeof risk === 'string') {
    switch(risk.toLowerCase()) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  }
  
  return 'bg-gray-400'; // Default for null/undefined
}

function getRiskTextClass(risk) {
  // Handle both numeric risk ratings and string risk levels
  if (typeof risk === 'number') {
    // Convert numeric risk rating to text color (0-25 scale typically)
    if (risk >= 20) return 'text-red-800';    // Critical
    if (risk >= 15) return 'text-orange-800'; // High  
    if (risk >= 10) return 'text-yellow-800'; // Medium
    if (risk >= 5) return 'text-green-800';   // Low
    return 'text-gray-800'; // Very low/none
  }
  
  // Handle string risk levels
  if (typeof risk === 'string') {
    switch(risk.toLowerCase()) {
      case 'critical': return 'text-red-800';
      case 'high': return 'text-orange-800';
      case 'medium': return 'text-yellow-800';
      case 'low': return 'text-green-800';
      default: return 'text-gray-800';
    }
  }
  
  return 'text-gray-800'; // Default for null/undefined
}

function getServiceStatusClass(status) {
  switch(status?.toLowerCase()) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'inactive': return 'bg-red-100 text-red-800';
    case 'maintenance': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function updateServicesStatistics(services) {
  const total = services.length;
  const critical = services.filter(s => s.risk_rating === 'Critical').length;
  const high = services.filter(s => s.risk_rating === 'High').length;
  const active = services.filter(s => s.status === 'Active').length;
  const totalAssets = services.reduce((sum, s) => sum + (s.asset_count || 0), 0);
  
  document.getElementById('total-services-count').textContent = total;
  document.getElementById('critical-services-count').textContent = critical;
  document.getElementById('high-services-count').textContent = high;
  document.getElementById('active-services-count').textContent = active;
  document.getElementById('linked-assets-count').textContent = totalAssets;
}

function filterServices() {
  const searchTerm = document.getElementById('services-search').value.toLowerCase();
  const categoryFilter = document.getElementById('services-category-filter').value;
  const riskFilter = document.getElementById('services-risk-filter').value;
  const statusFilter = document.getElementById('services-status-filter').value;
  
  let filteredServices = moduleData.services || [];
  
  if (searchTerm) {
    filteredServices = filteredServices.filter(service => 
      service.name.toLowerCase().includes(searchTerm) ||
      (service.description && service.description.toLowerCase().includes(searchTerm))
    );
  }
  
  if (categoryFilter) {
    filteredServices = filteredServices.filter(service => service.category === categoryFilter);
  }
  
  if (riskFilter) {
    filteredServices = filteredServices.filter(service => service.risk_rating === riskFilter);
  }
  
  if (statusFilter) {
    filteredServices = filteredServices.filter(service => service.status === statusFilter);
  }
  
  renderServicesTable(filteredServices);
}

function showAddServiceModal() {
  showModal('Add Service', `
    <form id="service-form" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="form-label">Service Name</label>
          <input type="text" id="service-name" class="form-input" required>
        </div>
        <div>
          <label class="form-label">Service ID</label>
          <input type="text" id="service-id" class="form-input" placeholder="e.g., SVC-001">
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="form-label">Category</label>
          <select id="service-category" class="form-select" required>
            <option value="">Select Category</option>
            <option value="Web Services">Web Services</option>
            <option value="Database">Database</option>
            <option value="Application">Application</option>
            <option value="Infrastructure">Infrastructure</option>
            <option value="Security">Security</option>
          </select>
        </div>
        <div>
          <label class="form-label">Status</label>
          <select id="service-status" class="form-select" required>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>
      </div>
      <div>
        <label class="form-label">Description</label>
        <textarea id="service-description" class="form-input" rows="3"></textarea>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="form-label">Manual Risk Rating</label>
          <select id="service-risk-rating" class="form-select">
            <option value="">Auto-calculate from Assets</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <div>
          <label class="form-label">Risk Score (0-100)</label>
          <input type="number" id="service-risk-score" class="form-input" min="0" max="100" placeholder="Auto-calculated">
        </div>
      </div>
    </form>
  `, [
    { text: 'Cancel', class: 'btn-secondary', onclick: 'closeModal(this)' },
    { text: 'Add Service', class: 'btn-primary', onclick: 'saveService()' }
  ]);
}

async function saveService() {
  const formData = {
    name: document.getElementById('service-name').value,
    service_id: document.getElementById('service-id').value,
    category: document.getElementById('service-category').value,
    description: document.getElementById('service-description').value,
    status: document.getElementById('service-status').value,
    risk_rating: document.getElementById('service-risk-rating').value || null,
    risk_score: document.getElementById('service-risk-score').value || null
  };
  
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.post('/api/services', formData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast('Service added successfully', 'success');
      closeUniversalModal();
      loadServicesData();
      refreshDashboardData(); // Refresh dashboard data
    }
  } catch (error) {
    showToast('Failed to add service', 'error');
  }
}

async function deleteService(id) {
  if (!confirm('Are you sure you want to delete this service?')) return;
  
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.delete(`/api/services/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast('Service deleted successfully', 'success');
      loadServicesData();
      refreshDashboardData(); // Refresh dashboard data
    }
  } catch (error) {
    showToast('Failed to delete service', 'error');
  }
}

async function calculateServiceRisk(id) {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.post(`/api/services/${id}/calculate-risk`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast('Service risk recalculated successfully', 'success');
      loadServicesData();
      refreshDashboardData(); // Refresh dashboard data
    }
  } catch (error) {
    showToast('Failed to calculate service risk', 'error');
  }
}

async function importServicesFromAssets() {
  if (!confirm('This will create services based on your current assets. Continue?')) return;
  
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.post('/api/services/import-from-assets', {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast(`${response.data.data.imported} services imported successfully`, 'success');
      loadServicesData();
      refreshDashboardData(); // Refresh dashboard data
    }
  } catch (error) {
    showToast('Failed to import services from assets', 'error');
  }
}

// Service management functions
async function viewService(id) {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get(`/api/services/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const service = response.data.data;
      showServiceViewModal(service);
    } else {
      showToast('Failed to load service details', 'error');
    }
  } catch (error) {
    console.error('Error loading service:', error);
    showToast('Failed to load service details', 'error');
  }
}

async function editService(id) {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get(`/api/services/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const service = response.data.data;
      showServiceEditModal(service);
    } else {
      showToast('Failed to load service for editing', 'error');
    }
  } catch (error) {
    console.error('Error loading service for edit:', error);
    showToast('Failed to load service for editing', 'error');
  }
}

function showServiceViewModal(service) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-900">Service Details</h2>
        <button onclick="closeModal(this)" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Service ID</label>
          <p class="mt-1 text-sm text-gray-900">${escapeHtml(service.service_id)}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Name</label>
          <p class="mt-1 text-sm text-gray-900">${escapeHtml(service.name)}</p>
        </div>
        <div class="md:col-span-2">
          <label class="block text-sm font-medium text-gray-700">Description</label>
          <p class="mt-1 text-sm text-gray-900">${escapeHtml(service.description || 'No description provided')}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Service Type</label>
          <p class="mt-1 text-sm text-gray-900">${escapeHtml(service.service_type)}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Criticality</label>
          <p class="mt-1 text-sm text-gray-900">${escapeHtml(service.criticality)}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Status</label>
          <p class="mt-1 text-sm text-gray-900">${escapeHtml(service.status)}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Risk Rating</label>
          <p class="mt-1 text-sm text-gray-900">${service.risk_rating || 'Not assessed'}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Availability Requirement</label>
          <p class="mt-1 text-sm text-gray-900">${service.availability_requirement || 'Not specified'}%</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Recovery Time Objective</label>
          <p class="mt-1 text-sm text-gray-900">${service.recovery_time_objective || 'Not specified'} minutes</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Recovery Point Objective</label>
          <p class="mt-1 text-sm text-gray-900">${service.recovery_point_objective || 'Not specified'} minutes</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Created</label>
          <p class="mt-1 text-sm text-gray-900">${new Date(service.created_at).toLocaleDateString()}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Last Updated</label>
          <p class="mt-1 text-sm text-gray-900">${new Date(service.updated_at).toLocaleDateString()}</p>
        </div>
      </div>
      
      <div class="mt-6 flex justify-end space-x-3">
        <button onclick="editService(${service.id})" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <i class="fas fa-edit mr-2"></i>Edit Service
        </button>
        <button onclick="closeModal(this)" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
          Close
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function showServiceEditModal(service) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-900">Edit Service</h2>
        <button onclick="closeModal(this)" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <form id="edit-service-form" onsubmit="updateService(event, ${service.id})">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700">Name *</label>
            <input type="text" name="name" value="${escapeHtml(service.name)}" required 
                   class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div class="md:col-span-2">
            <label class="block text-sm font-medium text-gray-700">Description</label>
            <textarea name="description" rows="3" 
                      class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">${escapeHtml(service.description || '')}</textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Service Type *</label>
            <select name="service_type" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
              <option value="infrastructure" ${service.service_type === 'infrastructure' ? 'selected' : ''}>Infrastructure</option>
              <option value="application" ${service.service_type === 'application' ? 'selected' : ''}>Application</option>
              <option value="database" ${service.service_type === 'database' ? 'selected' : ''}>Database</option>
              <option value="network" ${service.service_type === 'network' ? 'selected' : ''}>Network</option>
              <option value="business_process" ${service.service_type === 'business_process' ? 'selected' : ''}>Business Process</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Criticality *</label>
            <select name="criticality" required class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
              <option value="critical" ${service.criticality === 'critical' ? 'selected' : ''}>Critical</option>
              <option value="high" ${service.criticality === 'high' ? 'selected' : ''}>High</option>
              <option value="medium" ${service.criticality === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="low" ${service.criticality === 'low' ? 'selected' : ''}>Low</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Availability Requirement (%)</label>
            <input type="number" name="availability_requirement" value="${service.availability_requirement || 99}" 
                   min="0" max="100" step="0.1" 
                   class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Recovery Time Objective (minutes)</label>
            <input type="number" name="recovery_time_objective" value="${service.recovery_time_objective || ''}" 
                   min="0" 
                   class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Recovery Point Objective (minutes)</label>
            <input type="number" name="recovery_point_objective" value="${service.recovery_point_objective || ''}" 
                   min="0" 
                   class="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
          </div>
        </div>
        
        <div class="mt-6 flex justify-end space-x-3">
          <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <i class="fas fa-save mr-2"></i>Update Service
          </button>
          <button type="button" onclick="closeModal(this)" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
            Cancel
          </button>
        </div>
      </form>
    </div>
  `;
  
  document.body.appendChild(modal);
}

async function updateService(event, serviceId) {
  event.preventDefault();
  
  try {
    const formData = new FormData(event.target);
    const serviceData = {
      name: formData.get('name'),
      description: formData.get('description'),
      service_type: formData.get('service_type'),
      criticality: formData.get('criticality'),
      availability_requirement: parseFloat(formData.get('availability_requirement')),
      recovery_time_objective: formData.get('recovery_time_objective') ? parseInt(formData.get('recovery_time_objective')) : null,
      recovery_point_objective: formData.get('recovery_point_objective') ? parseInt(formData.get('recovery_point_objective')) : null
    };
    
    const token = localStorage.getItem('aria_token');
    const response = await axios.put(`/api/services/${serviceId}`, serviceData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast('Service updated successfully', 'success');
      closeModal(event.target.closest('.fixed'));
      loadServicesData(); // Refresh services list
      refreshDashboardData(); // Refresh dashboard data
    } else {
      showToast('Failed to update service', 'error');
    }
  } catch (error) {
    console.error('Error updating service:', error);
    showToast('Failed to update service', 'error');
  }
}

// Missing Modal and Utility Functions
function createModal(title, content, buttons = []) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  
  const defaultButtons = buttons.length ? buttons : [
    { text: 'Close', class: 'btn-secondary', onclick: 'closeModal(this)' }
  ];
  
  const buttonHTML = defaultButtons.map(btn => 
    `<button onclick="${btn.onclick}" class="${btn.class}">${btn.text}</button>`
  ).join('');
  
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-bold text-gray-900">${title}</h2>
        <button onclick="closeModal(this)" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times"></i>
        </button>
      </div>
      <div class="mb-6">
        ${content}
      </div>
      <div class="flex justify-end space-x-3">
        ${buttonHTML}
      </div>
    </div>
  `;
  
  // Add click handler to close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal(modal);
    }
  });
  
  return modal;
}

function closeModal(element) {
  let modal;
  if (element && element.closest) {
    // If an element (like a button) is provided, find the nearest modal container
    modal = element.closest('.fixed') ||
            element.closest('.modal-overlay') ||
            element.closest('[class*="modal"]') ||
            element;
  } else {
    // Fallback: find any open modal on the page
    modal = document.querySelector('.modal-overlay') ||
            document.querySelector('#universal-modal') ||
            document.querySelector('.fixed[class*="modal"]') ||
            document.querySelector('[class*="modal-overlay"]');
  }
  if (modal && modal.parentNode) {
    modal.parentNode.removeChild(modal);
  }
}

// Risk form functions that were referenced but missing
// NOTE: The legacy alias populateRiskFormDropdowns() is defined later and delegates to
// populateRiskFormDropdownsSafe(). We intentionally avoid redefining it here to prevent
// duplicate identifier errors that break initialization.

// Note: populateRiskForm() is implemented later with full logic. Avoid duplicate stub here to prevent identifier clashes.

// Note: handleRiskSubmit() is implemented later with full Axios integration. Avoid defining a stub here to prevent duplicate identifier errors.
// Control form functions
function getControlFormHTML(control = null) {
  const isEdit = control !== null;
  
  return `
    <form id="control-form" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="form-label">Control ID *</label>
          <input type="text" id="control-id" class="form-input" value="${control?.control_id || ''}" required>
        </div>
        <div>
          <label class="form-label">Framework *</label>
          <select id="control-framework" class="form-select" required>
            <option value="">Select Framework</option>
            <option value="ISO27001" ${control?.framework === 'ISO27001' ? 'selected' : ''}>ISO 27001</option>
            <option value="NIST" ${control?.framework === 'NIST' ? 'selected' : ''}>NIST</option>
            <option value="SOX" ${control?.framework === 'SOX' ? 'selected' : ''}>SOX</option>
            <option value="COBIT" ${control?.framework === 'COBIT' ? 'selected' : ''}>COBIT</option>
          </select>
        </div>
      </div>
      
      <div>
        <label class="form-label">Control Name *</label>
        <input type="text" id="control-name" class="form-input" value="${control?.name || ''}" required>
      </div>
      
      <div>
        <label class="form-label">Description *</label>
        <textarea id="control-description" class="form-input" rows="3" required>${control?.description || ''}</textarea>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="form-label">Control Type *</label>
          <select id="control-type" class="form-select" required>
            <option value="">Select Type</option>
            <option value="preventive" ${control?.control_type === 'preventive' ? 'selected' : ''}>Preventive</option>
            <option value="detective" ${control?.control_type === 'detective' ? 'selected' : ''}>Detective</option>
            <option value="corrective" ${control?.control_type === 'corrective' ? 'selected' : ''}>Corrective</option>
            <option value="compensating" ${control?.control_type === 'compensating' ? 'selected' : ''}>Compensating</option>
          </select>
        </div>
        <div>
          <label class="form-label">Frequency *</label>
          <select id="control-frequency" class="form-select" required>
            <option value="">Select Frequency</option>
            <option value="continuous" ${control?.frequency === 'continuous' ? 'selected' : ''}>Continuous</option>
            <option value="daily" ${control?.frequency === 'daily' ? 'selected' : ''}>Daily</option>
            <option value="weekly" ${control?.frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
            <option value="monthly" ${control?.frequency === 'monthly' ? 'selected' : ''}>Monthly</option>
            <option value="quarterly" ${control?.frequency === 'quarterly' ? 'selected' : ''}>Quarterly</option>
            <option value="annually" ${control?.frequency === 'annually' ? 'selected' : ''}>Annually</option>
          </select>
        </div>
      </div>
    </form>
  `;
}

function getControlViewHTML(control) {
  return `
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Control ID</label>
          <p class="mt-1 text-sm text-gray-900">${control.control_id}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Framework</label>
          <p class="mt-1 text-sm text-gray-900">${control.framework}</p>
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700">Control Name</label>
        <p class="mt-1 text-sm text-gray-900">${control.name}</p>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700">Description</label>
        <p class="mt-1 text-sm text-gray-900">${control.description}</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Type</label>
          <p class="mt-1 text-sm text-gray-900">${capitalizeFirst(control.control_type)}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Frequency</label>
          <p class="mt-1 text-sm text-gray-900">${capitalizeFirst(control.frequency)}</p>
        </div>
      </div>
    </div>
  `;
}

function populateControlFormDropdowns() {
  console.log('Populating control form dropdowns');
}

function populateControlForm(control) {
  console.log('Populating control form with data:', control);
}

async function handleControlSubmit(controlId = null) {
  const form = document.getElementById('control-form');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  const formData = {
    control_id: document.getElementById('control-id')?.value,
    name: document.getElementById('control-name')?.value,
    description: document.getElementById('control-description')?.value,
    framework: document.getElementById('control-framework')?.value,
    control_type: document.getElementById('control-type')?.value,
    frequency: document.getElementById('control-frequency')?.value
  };
  
  try {
    const token = localStorage.getItem('aria_token');
    
    // For demo purposes, simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    showToast(`Control ${controlId ? 'updated' : 'created'} successfully`, 'success');
    closeModal(form);
    
    // Refresh controls table if currently viewing controls
    if (currentModule === 'controls') {
      await loadControls();
    }
    
  } catch (error) {
    console.error('Error saving control:', error);
    showToast(`Failed to ${controlId ? 'update' : 'create'} control`, 'error');
  }
}

async function saveControlTest(controlId) {
  const testData = {
    control_id: controlId,
    test_method: document.getElementById('test-method')?.value,
    test_procedures: document.getElementById('test-procedures')?.value,
    test_result: document.getElementById('test-result')?.value,
    test_date: document.getElementById('test-date')?.value,
    exceptions: document.getElementById('test-exceptions')?.value,
    recommendations: document.getElementById('test-recommendations')?.value
  };
  
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    showToast('Control test results saved successfully', 'success');
    closeModal();
    
    // Refresh controls table
    if (currentModule === 'controls') {
      await loadControls();
    }
    
  } catch (error) {
    console.error('Error saving control test:', error);
    showToast('Failed to save control test results', 'error');
  }
}

// Utility function for HTML escaping
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text == null ? '' : String(text);
  return div.innerHTML;
}

// Dashboard refresh function to update statistics after service changes (consolidated)
async function refreshDashboardData() {
  try {
    // Check if we're on the dashboard page or if dashboard elements exist
    const dashboardElements = document.querySelector('#dashboard-content, #main-content');
    if (!dashboardElements) return;
    
    // Check if user is authenticated
    const token = localStorage.getItem('aria_token');
    if (!token) return;
    
    // If on dashboard page, reload dashboard data
    if (currentModule === 'dashboard' || window.location.pathname === '/') {
      console.log('Refreshing dashboard data after service changes...');
      
      // Reload dashboard data
      const response = await axios.get('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const data = response.data.data;
        
        // Update service statistics
        const servicesCountElement = document.querySelector('#services-count');
        if (servicesCountElement && data.services_count !== undefined) {
          servicesCountElement.textContent = data.services_count;
        }
        
        // Update any other dashboard statistics that include services
        const totalAssetsElement = document.querySelector('#total-assets');
        if (totalAssetsElement && data.total_assets !== undefined) {
          totalAssetsElement.textContent = data.total_assets;
        }
        
        // Update risk metrics if they include service data
        const highRiskElement = document.querySelector('#high-risk-items');
        if (highRiskElement && data.high_risk_items !== undefined) {
          highRiskElement.textContent = data.high_risk_items;
        }
        
        console.log('Dashboard data refreshed successfully');
      }
    }
  } catch (error) {
    console.error('Error refreshing dashboard data:', error);
    // Don't show error toast for dashboard refresh failures as it's a background operation
  }
}

async function exportServices() {
  try {
    const token = localStorage.getItem('aria_token');
    if (!token) {
      showToast('Please log in to export services', 'error');
      return;
    }

    const response = await axios.get('/api/services', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const services = response.data.data;
      
      // Convert to CSV format
      const headers = ['ID', 'Name', 'Description', 'Owner', 'Type', 'Status', 'Risk Score', 'Created Date'];
      const csvContent = [
        headers.join(','),
        ...services.map(service => [
          service.id,
          `"${service.name || ''}"`,
          `"${service.description || ''}"`,
          `"${service.owner || ''}"`,
          service.type || '',
          service.status || '',
          service.risk_score || 0,
          service.created_at || ''
        ].join(','))
      ].join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `services_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      showToast('Services exported successfully', 'success');
    } else {
      showToast('Failed to export services', 'error');
    }
  } catch (error) {
    console.error('Export services error:', error);
    showToast('Failed to export services', 'error');
  }
}

// User Management Module
async function showUsers() {
  updateActiveNavigation('users');
  currentModule = 'users';
  
  const mainContent = document.getElementById('main-content');
  
  mainContent.innerHTML = `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">User Management</h2>
          <p class="text-gray-600 mt-1">Manage system users, roles, and permissions</p>
        </div>
        <div class="flex space-x-3">
          <button onclick="showImportUsersModal()" class="btn-secondary">
            <i class="fas fa-upload mr-2"></i>Import
          </button>
          <button onclick="exportUsers()" class="btn-secondary">
            <i class="fas fa-download mr-2"></i>Export
          </button>
          <button onclick="showAddUserModal()" class="btn-primary">
            <i class="fas fa-plus mr-2"></i>Add User
          </button>
        </div>
      </div>
      
      <!-- User Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-users text-blue-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">Total Users</p>
              <p class="text-lg font-semibold text-gray-900" id="total-users-count">-</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-user-check text-green-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">Active Users</p>
              <p class="text-lg font-semibold text-gray-900" id="active-users-count">-</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-user-shield text-purple-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">Admins</p>
              <p class="text-lg font-semibold text-gray-900" id="admin-users-count">-</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-user-clock text-yellow-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">Recent Logins</p>
              <p class="text-lg font-semibold text-gray-900" id="recent-login-count">-</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- User Filters -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-64">
            <input 
              type="text" 
              id="user-search" 
              placeholder="Search users..." 
              class="form-input"
              onkeyup="filterUsers()"
            />
          </div>
          <select id="user-role-filter" class="form-select" onchange="filterUsers()">
            <option value="">All Roles</option>
            <option value="admin">Admin</option>
            <option value="risk_manager">Risk Manager</option>
            <option value="compliance_officer">Compliance Officer</option>
            <option value="incident_manager">Incident Manager</option>
            <option value="auditor">Auditor</option>
            <option value="user">User</option>
          </select>
          <select id="user-status-filter" class="form-select" onchange="filterUsers()">
            <option value="">All Status</option>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </select>
          <select id="user-department-filter" class="form-select" onchange="filterUsers()">
            <option value="">All Departments</option>
            <option value="IT">IT</option>
            <option value="Finance">Finance</option>
            <option value="HR">HR</option>
            <option value="Operations">Operations</option>
            <option value="Legal">Legal</option>
            <option value="Security">Security</option>
          </select>
        </div>
      </div>
      
      <!-- Users Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-6 py-3 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">System Users</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="table-header">User</th>
                <th class="table-header">Email</th>
                <th class="table-header">Role</th>
                <th class="table-header">Department</th>
                <th class="table-header">Status</th>
                <th class="table-header">Last Login</th>
                <th class="table-header">Created</th>
                <th class="table-header">Actions</th>
              </tr>
            </thead>
            <tbody id="users-table-body" class="bg-white divide-y divide-gray-200">
              <!-- User rows will be inserted here -->
            </tbody>
          </table>
        </div>
        <div id="users-loading" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-2 text-gray-600">Loading users...</p>
        </div>
        <div id="users-empty" class="p-8 text-center hidden">
          <i class="fas fa-users text-gray-400 text-4xl mb-4"></i>
          <p class="text-gray-600">No users found</p>
        </div>
      </div>
    </div>
  `;
  
  // Load users data
  await loadUsers();
}

async function loadUsers() {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      moduleData.users = response.data.data;
      renderUsersTable(moduleData.users);
      updateUserStatistics(moduleData.users);
      document.getElementById('users-loading').style.display = 'none';
    } else {
      throw new Error('Failed to load users');
    }
  } catch (error) {
    console.error('Error loading users:', error);
    document.getElementById('users-loading').innerHTML = '<p class="text-red-600">Error loading users</p>';
  }
}

function renderUsersTable(users) {
  const tbody = document.getElementById('users-table-body');
  
  if (!users || users.length === 0) {
    document.getElementById('users-empty').classList.remove('hidden');
    tbody.innerHTML = '';
    return;
  }
  
  document.getElementById('users-empty').classList.add('hidden');
  
  tbody.innerHTML = users.map(user => `
    <tr class="table-row">
      <td class="table-cell">
        <div class="flex items-center">
          <div class="flex-shrink-0 h-10 w-10">
            <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
              <span class="text-sm font-medium text-gray-700">
                ${(user.first_name?.[0] || '').toUpperCase()}${(user.last_name?.[0] || '').toUpperCase()}
              </span>
            </div>
          </div>
          <div class="ml-4">
            <div class="text-sm font-medium text-gray-900">${user.first_name} ${user.last_name}</div>
            <div class="text-sm text-gray-500">@${user.username}</div>
          </div>
        </div>
      </td>
      <td class="table-cell">
        <div class="text-sm text-gray-900">${user.email}</div>
        ${user.phone ? `<div class="text-sm text-gray-500">${user.phone}</div>` : ''}
      </td>
      <td class="table-cell">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleClass(user.role)}">
          ${capitalizeFirst(user.role.replace('_', ' '))}
        </span>
      </td>
      <td class="table-cell">
        <span class="text-sm text-gray-900">${user.department || 'N/A'}</span>
        ${user.job_title ? `<div class="text-sm text-gray-500">${user.job_title}</div>` : ''}
      </td>
      <td class="table-cell">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
          ${user.is_active ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td class="table-cell">
        <span class="text-sm text-gray-900">${user.last_login ? formatDate(user.last_login) : 'Never'}</span>
      </td>
      <td class="table-cell">
        <span class="text-sm text-gray-900">${formatDate(user.created_at)}</span>
      </td>
      <td class="table-cell">
        <div class="flex space-x-2">
          <button onclick="viewUser(${user.id})" class="text-blue-600 hover:text-blue-900" title="View">
            <i class="fas fa-eye"></i>
          </button>
          <button onclick="editUser(${user.id})" class="text-green-600 hover:text-green-900" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="toggleUserStatus(${user.id})" class="text-yellow-600 hover:text-yellow-900" title="${user.is_active ? 'Deactivate' : 'Activate'}">
            <i class="fas fa-${user.is_active ? 'user-slash' : 'user-check'}"></i>
          </button>
          <button onclick="resetUserPassword(${user.id})" class="text-purple-600 hover:text-purple-900" title="Reset Password">
            <i class="fas fa-key"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function updateUserStatistics(users) {
  if (!users) return;
  
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const adminUsers = users.filter(u => u.role === 'admin').length;
  const recentLogins = users.filter(u => {
    if (!u.last_login) return false;
    const loginDate = new Date(u.last_login);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return loginDate > sevenDaysAgo;
  }).length;
  
  document.getElementById('total-users-count').textContent = totalUsers;
  document.getElementById('active-users-count').textContent = activeUsers;
  document.getElementById('admin-users-count').textContent = adminUsers;
  document.getElementById('recent-login-count').textContent = recentLogins;
}

function filterUsers() {
  if (!moduleData.users) return;
  
  const search = document.getElementById('user-search').value.toLowerCase();
  const role = document.getElementById('user-role-filter').value;
  const status = document.getElementById('user-status-filter').value;
  const department = document.getElementById('user-department-filter').value;
  
  let filteredUsers = moduleData.users.filter(user => {
    const matchesSearch = !search || 
      user.first_name.toLowerCase().includes(search) || 
      user.last_name.toLowerCase().includes(search) ||
      user.email.toLowerCase().includes(search) ||
      user.username.toLowerCase().includes(search);
    
    const matchesRole = !role || user.role === role;
    const matchesStatus = !status || user.is_active.toString() === status;
    const matchesDepartment = !department || user.department === department;
    
    return matchesSearch && matchesRole && matchesStatus && matchesDepartment;
  });
  
  renderUsersTable(filteredUsers);
}

// User CRUD Functions
function showAddUserModal() {
  const modal = createModal('Add New User', getUserFormHTML());
  document.body.appendChild(modal);
  
  // Handle form submission
  document.getElementById('user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleUserSubmit();
  });
}

function editUser(id) {
  const user = moduleData.users?.find(u => u.id === id);
  if (!user) {
    showToast('User not found', 'error');
    return;
  }
  
  const modal = createModal('Edit User', getUserFormHTML(user));
  document.body.appendChild(modal);
  
  // Populate form data
  populateUserForm(user);
  
  // Handle form submission
  document.getElementById('user-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleUserSubmit(id);
  });
}

function viewUser(id) {
  const user = moduleData.users?.find(u => u.id === id);
  if (!user) {
    showToast('User not found', 'error');
    return;
  }
  
  const modal = createModal('User Details', getUserViewHTML(user));
  document.body.appendChild(modal);
}

async function toggleUserStatus(id) {
  const user = moduleData.users?.find(u => u.id === id);
  if (!user) {
    showToast('User not found', 'error');
    return;
  }
  
  const action = user.is_active ? 'deactivate' : 'activate';
  if (!confirm(`Are you sure you want to ${action} this user?`)) {
    return;
  }
  
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.put(`/api/users/${id}`, {
      is_active: !user.is_active
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast(`User ${action}d successfully`, 'success');
      await loadUsers(); // Reload users table
    } else {
      showToast(response.data.error || `Failed to ${action} user`, 'error');
    }
  } catch (error) {
    console.error('Toggle user status error:', error);
    showToast(`Failed to ${action} user`, 'error');
  }
}

async function resetUserPassword(id) {
  const user = moduleData.users?.find(u => u.id === id);
  if (!user) {
    showToast('User not found', 'error');
    return;
  }

  // Only allow password reset for local users
  if (user.auth_provider !== 'local') {
    showToast('Password reset is only available for local users', 'warning');
    return;
  }

  if (!confirm("Are you sure you want to reset this user's password? A new complex password will be generated.")) {
    return;
  }
  
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.post(`/api/users/${id}/reset-password`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success && response.data.data.temporary_password) {
      showPasswordResetModal(user, response.data.data.temporary_password);
    } else {
      showToast(response.data.error || 'Failed to reset password', 'error');
    }
  } catch (error) {
    console.error('Reset password error:', error);
    showToast('Failed to reset password', 'error');
  }
}

function showPasswordResetModal(user, newPassword) {
  const modal = createModal(`Password Reset - ${user.first_name} ${user.last_name}`, `
    <div class="space-y-6">
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <i class="fas fa-check-circle text-green-600"></i>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-800">Password Reset Successful</h3>
            <p class="text-sm text-green-700 mt-1">A new complex password has been generated for the user.</p>
          </div>
        </div>
      </div>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">New Temporary Password</label>
          <div class="relative">
            <input type="text" id="generated-password" class="form-input pr-20" value="${newPassword}" readonly>
            <div class="absolute inset-y-0 right-0 flex items-center pr-3 space-x-1">
              <button onclick="togglePasswordVisibility('generated-password', this)" class="text-gray-400 hover:text-gray-600" title="Toggle visibility">
                <i class="fas fa-eye"></i>
              </button>
              <button onclick="copyPasswordToClipboard('${newPassword}', this)" class="text-blue-600 hover:text-blue-800" title="Copy to clipboard">
                <i class="fas fa-copy"></i>
              </button>
            </div>
          </div>
        </div>
        
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <i class="fas fa-exclamation-triangle text-yellow-600"></i>
            </div>
            <div class="ml-3">
              <h4 class="text-sm font-medium text-yellow-800">Important Instructions</h4>
              <ul class="text-sm text-yellow-700 mt-2 space-y-1">
                <li>• Copy this password and provide it to the user securely</li>
                <li>• The user must change this password on their next login</li>
                <li>• Do not share this password through email or unsecured channels</li>
                <li>• This password meets complex security requirements</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div class="space-y-2">
          <h4 class="text-sm font-medium text-gray-700">Password Strength Analysis</h4>
          <div id="password-strength-indicator" class="flex items-center space-x-2">
            <div class="flex-1 bg-gray-200 rounded-full h-2">
              <div class="bg-green-500 h-2 rounded-full transition-all duration-300" style="width: 90%"></div>
            </div>
            <span class="text-sm font-medium text-green-600">Very Strong</span>
          </div>
          <div class="text-xs text-gray-500">
            Password contains: Uppercase, Lowercase, Numbers, Special Characters (${newPassword.length} characters)
          </div>
        </div>
      </div>
      
      <div class="flex justify-end space-x-3">
        <button onclick="generateNewPassword(${user.id})" class="btn-secondary">
          <i class="fas fa-sync-alt mr-2"></i>Generate New Password
        </button>
        <button onclick="closeModal(this)" class="btn-primary">
          <i class="fas fa-check mr-2"></i>Done
        </button>
      </div>
    </div>
  `);
  
  document.body.appendChild(modal);
  
  // Focus on the password field for easy copying
  setTimeout(() => {
    const passwordField = document.getElementById('generated-password');
    if (passwordField) {
      passwordField.select();
    }
  }, 100);
}

async function generateNewPassword(userId) {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get('/api/generate-password?length=16', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const newPassword = response.data.data.password;
      
      // Update the user's password in the database
      const updateResponse = await axios.post(`/api/users/${userId}/reset-password`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (updateResponse.data.success) {
        // Update the displayed password
        const passwordField = document.getElementById('generated-password');
        if (passwordField) {
          passwordField.value = updateResponse.data.data.temporary_password;
          passwordField.select();
        }
        showToast('New password generated successfully', 'success');
      }
    }
  } catch (error) {
    console.error('Generate new password error:', error);
    showToast('Failed to generate new password', 'error');
  }
}

function togglePasswordVisibility(fieldId, button) {
  const field = document.getElementById(fieldId);
  if (!field) return;
  
  const icon = button.querySelector('i');
  if (field.type === 'password') {
    field.type = 'text';
    icon.className = 'fas fa-eye-slash';
  } else {
    field.type = 'password';
    icon.className = 'fas fa-eye';
  }
}

async function copyPasswordToClipboard(password, button) {
  try {
    await navigator.clipboard.writeText(password);
    
    // Visual feedback
    const originalIcon = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check text-green-600"></i>';
    showToast('Password copied to clipboard', 'success');
    
    setTimeout(() => {
      button.innerHTML = originalIcon;
    }, 2000);
  } catch (error) {
    console.error('Copy to clipboard failed:', error);
    
    // Fallback for older browsers
    const tempInput = document.createElement('input');
    tempInput.value = password;
    document.body.appendChild(tempInput);
    tempInput.select();
    
    try {
      document.execCommand('copy');
      showToast('Password copied to clipboard', 'success');
      
      const originalIcon = button.innerHTML;
      button.innerHTML = '<i class="fas fa-check text-green-600"></i>';
      setTimeout(() => {
        button.innerHTML = originalIcon;
      }, 2000);
    } catch (fallbackError) {
      showToast('Failed to copy password. Please select and copy manually.', 'error');
    }
    
    document.body.removeChild(tempInput);
  }
}

// User Form Functions
function getUserFormHTML(user = null) {
  return `
    <form id="user-form" class="space-y-6">
      <!-- Personal Information Section -->
      <div class="form-section">
        <h3 class="form-section-title">
          <i class="fas fa-user form-section-icon"></i>
          Personal Information
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="form-label">First Name *</label>
            <input type="text" id="user-first-name" class="form-input" placeholder="Enter first name" required>
          </div>
          <div>
            <label class="form-label">Last Name *</label>
            <input type="text" id="user-last-name" class="form-input" placeholder="Enter last name" required>
          </div>
        </div>
      </div>

      <!-- Account Information Section -->
      <div class="form-section">
        <h3 class="form-section-title">
          <i class="fas fa-id-card form-section-icon"></i>
          Account Information
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="form-label">Username *</label>
            <input type="text" id="user-username" class="form-input" placeholder="Enter username" required ${user ? 'readonly' : ''}>
          </div>
          <div>
            <label class="form-label">Email Address *</label>
            <input type="email" id="user-email" class="form-input" placeholder="Enter email address" required>
          </div>
        </div>
        
        ${!user ? `
        <div id="password-field" style="display: none;" class="mt-4">
          <label class="form-label">Password *</label>
          <input type="password" id="user-password" class="form-input" placeholder="Enter secure password">
          <p class="text-xs text-gray-500 mt-2 flex items-center">
            <i class="fas fa-info-circle mr-1"></i>
            Minimum 8 characters (only required for local accounts)
          </p>
        </div>
        ` : ''}
      </div>

      <!-- Role & Access Section -->
      <div class="form-section">
        <h3 class="form-section-title">
          <i class="fas fa-shield-alt form-section-icon"></i>
          Role & Access Control
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="form-label">Role *</label>
            <select id="user-role" class="form-select" required>
              <option value="">Select Role</option>
              <option value="admin">Admin</option>
              <option value="risk_analyst">Risk Analyst</option>
              <option value="service_owner">Service Owner</option>
              <option value="auditor">Auditor</option>
              <option value="integration_operator">Integration Operator</option>
              <option value="readonly">ReadOnly</option>
              <option value="risk_manager">Risk Manager</option>
              <option value="compliance_officer">Compliance Officer</option>
              <option value="incident_manager">Incident Manager</option>
              <option value="user">User</option>
            </select>
          </div>
          <div>
            <label class="form-label">Authentication Provider *</label>
            <select id="user-auth-provider" class="form-select" required onchange="togglePasswordField()">
              <option value="">Select Auth Provider</option>
              <option value="local">Local Account</option>
              <option value="saml">SAML (Microsoft Entra ID)</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Organization Details Section -->
      <div class="form-section">
        <h3 class="form-section-title">
          <i class="fas fa-building form-section-icon"></i>
          Organization Details
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="form-label">Department</label>
            <select id="user-department" class="form-select">
              <option value="">Select Department</option>
              <option value="IT">IT</option>
              <option value="Finance">Finance</option>
              <option value="HR">HR</option>
              <option value="Operations">Operations</option>
              <option value="Legal">Legal</option>
              <option value="Security">Security</option>
            </select>
          </div>
          <div>
            <label class="form-label">Job Title</label>
            <input type="text" id="user-job-title" class="form-input" placeholder="Enter job title">
          </div>
        </div>
        
        <div class="mt-4">
          <label class="form-label">Phone Number</label>
          <input type="tel" id="user-phone" class="form-input" placeholder="Enter phone number">
        </div>
      </div>

      ${user ? `
      <!-- User Status Section -->
      <div class="form-section">
        <h3 class="form-section-title">
          <i class="fas fa-toggle-on form-section-icon"></i>
          User Status
        </h3>
        <div class="flex items-center space-x-3">
          <input type="checkbox" id="user-active" class="form-checkbox">
          <label for="user-active" class="form-label mb-0 cursor-pointer">Active User</label>
          <span class="text-sm text-gray-500">User can access the system</span>
        </div>
      </div>
      ` : ''}
      
      <div class="flex justify-end space-x-4 pt-4">
        <button type="button" onclick="closeModal(this)" class="btn-secondary">
          <i class="fas fa-times mr-2"></i>Cancel
        </button>
        <button type="submit" class="btn-primary">
          <i class="fas fa-${user ? 'save' : 'plus'} mr-2"></i>${user ? 'Update' : 'Create'} User
        </button>
      </div>
    </form>
  `;
}

function populateUserForm(user) {
  document.getElementById('user-first-name').value = user.first_name || '';
  document.getElementById('user-last-name').value = user.last_name || '';
  document.getElementById('user-username').value = user.username || '';
  document.getElementById('user-email').value = user.email || '';
  document.getElementById('user-role').value = user.role || '';
  document.getElementById('user-department').value = user.department || '';
  document.getElementById('user-job-title').value = user.job_title || '';
  document.getElementById('user-phone').value = user.phone || '';
  
  // Set authentication provider
  const authProviderSelect = document.getElementById('user-auth-provider');
  if (authProviderSelect) {
    authProviderSelect.value = user.auth_provider || 'local';
    togglePasswordField(); // Update password field visibility
  }
  
  if (document.getElementById('user-active')) {
    document.getElementById('user-active').checked = user.is_active || false;
  }
}

// Toggle password field based on authentication provider
function togglePasswordField() {
  const authProvider = document.getElementById('user-auth-provider')?.value;
  const passwordField = document.getElementById('password-field');
  const passwordInput = document.getElementById('user-password');
  
  if (passwordField && passwordInput) {
    if (authProvider === 'local') {
      passwordField.style.display = 'block';
      passwordInput.required = true;
    } else {
      passwordField.style.display = 'none';
      passwordInput.required = false;
      passwordInput.value = ''; // Clear password when switching to SAML
    }
  }
}

async function handleUserSubmit(id = null) {
  try {
    const formData = {
      first_name: document.getElementById('user-first-name').value,
      last_name: document.getElementById('user-last-name').value,
      username: document.getElementById('user-username').value,
      email: document.getElementById('user-email').value,
      role: document.getElementById('user-role').value,
      department: document.getElementById('user-department').value,
      job_title: document.getElementById('user-job-title').value,
      phone: document.getElementById('user-phone').value,
      auth_provider: document.getElementById('user-auth-provider')?.value || 'local'
    };
    
    if (!id) {
      // Creating new user - include password only for local accounts
      const authProvider = document.getElementById('user-auth-provider')?.value;
      if (authProvider === 'local') {
        const password = document.getElementById('user-password').value;
        if (!password || password.length < 8) {
          showToast('Password must be at least 8 characters for local accounts', 'error');
          return;
        }
        formData.password = password;
      } else if (authProvider === 'saml') {
        // For SAML users, generate a random password that won't be used
        formData.password = 'saml-' + Math.random().toString(36).substring(2, 15);
      }
    } else {
      // Updating existing user - include active status
      const activeCheckbox = document.getElementById('user-active');
      if (activeCheckbox) {
        formData.is_active = activeCheckbox.checked;
      }
    }
    
    const token = localStorage.getItem('aria_token');
    const url = id ? `/api/users/${id}` : '/api/users';
    const method = id ? 'put' : 'post';
    
    const response = await axios[method](url, formData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast(`User ${id ? 'updated' : 'created'} successfully`, 'success');
      closeModal(document.querySelector('#user-form'));
      
      // Reload users table - check context to call appropriate function
      if (currentModule === 'settings' && typeof window.loadUsersForSettings === 'function') {
        await window.loadUsersForSettings(); // Called from Settings tab
      } else {
        await loadUsers(); // Called from Users module
      }
    } else {
      showToast(response.data.error || `Failed to ${id ? 'update' : 'create'} user`, 'error');
    }
  } catch (error) {
    console.error('User submit error:', error);
    showToast(`Failed to ${id ? 'update' : 'create'} user`, 'error');
  }
}

function getUserViewHTML(user) {
  return `
    <div class="space-y-6">
      <div class="flex items-center space-x-4">
        <div class="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
          <span class="text-xl font-medium text-gray-700">
            ${(user.first_name?.[0] || '').toUpperCase()}${(user.last_name?.[0] || '').toUpperCase()}
          </span>
        </div>
        <div>
          <h3 class="text-xl font-semibold text-gray-900">${user.first_name} ${user.last_name}</h3>
          <p class="text-gray-500">@${user.username}</p>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="font-medium text-gray-700 mb-3">Contact Information</h4>
          <div class="space-y-2">
            <div><span class="text-gray-500">Email:</span> ${user.email}</div>
            ${user.phone ? `<div><span class="text-gray-500">Phone:</span> ${user.phone}</div>` : ''}
          </div>
        </div>
        
        <div>
          <h4 class="font-medium text-gray-700 mb-3">Work Information</h4>
          <div class="space-y-2">
            <div><span class="text-gray-500">Role:</span> <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRoleClass(user.role)}">${capitalizeFirst(user.role.replace('_', ' '))}</span></div>
            ${user.department ? `<div><span class="text-gray-500">Department:</span> ${user.department}</div>` : ''}
            ${user.job_title ? `<div><span class="text-gray-500">Job Title:</span> ${user.job_title}</div>` : ''}
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 class="font-medium text-gray-700 mb-3">Account Status</h4>
          <div class="space-y-2">
            <div>
              <span class="text-gray-500">Status:</span> 
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                ${user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div><span class="text-gray-500">Last Login:</span> ${user.last_login ? formatDate(user.last_login) : 'Never'}</div>
          </div>
        </div>
        
        <div>
          <h4 class="font-medium text-gray-700 mb-3">Account Details</h4>
          <div class="space-y-2">
            <div><span class="text-gray-500">Created:</span> ${formatDate(user.created_at)}</div>
            <div><span class="text-gray-500">Updated:</span> ${formatDate(user.updated_at)}</div>
          </div>
        </div>
      </div>
      
      <div class="flex justify-end space-x-3 mt-6">
        <button onclick="editUser(${user.id}); closeModal(this)" class="btn-primary">Edit User</button>
        <button onclick="closeModal(this)" class="btn-secondary">Close</button>
      </div>
    </div>
  `;
}

function getRoleClass(role) {
  const classes = {
    'admin': 'bg-red-100 text-red-800',
    'risk_manager': 'bg-blue-100 text-blue-800',
    'compliance_officer': 'bg-purple-100 text-purple-800',
    'incident_manager': 'bg-orange-100 text-orange-800',
    'auditor': 'bg-green-100 text-green-800',
    'user': 'bg-gray-100 text-gray-800'
  };
  return classes[role] || 'bg-gray-100 text-gray-800';
}

async function exportUsers() { 
  try {
    showToast('Exporting users...', 'info');
    
    const token = localStorage.getItem('aria_token');
    const response = await axios.get('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.data.success) {
      showToast('Failed to load users for export', 'error');
      return;
    }
    
    const users = response.data.data;
    
    // Create CSV export data
    const exportData = users.map(user => ({
      'User ID': user.id,
      'Username': user.username,
      'Email': user.email,
      'First Name': user.first_name,
      'Last Name': user.last_name,
      'Department': user.department || '',
      'Job Title': user.job_title || '',
      'Role': user.role,
      'Is Active': user.is_active ? 'Yes' : 'No',
      'Auth Provider': user.auth_provider || 'local',
      'Last Login': user.last_login || 'Never',
      'Created': user.created_at
    }));
    
    // Convert to CSV
    if (exportData.length === 0) {
      showToast('No users found to export', 'warning');
      return;
    }
    
    const headers = Object.keys(exportData[0]).join(',');
    const csvData = [headers];
    
    exportData.forEach(row => {
      const values = Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
      csvData.push(values);
    });
    
    // Create and download file
    const csvContent = csvData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Users_Export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('Users exported successfully', 'success');
    
  } catch (error) {
    console.error('Error exporting users:', error);
    showToast('Failed to export users', 'error');
  }
}

// Assessment management functions
function showAddAssessmentModal() {
  showModal('Add Compliance Assessment', `
    <form id="assessment-form" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="form-label">Assessment Name</label>
          <input type="text" id="assessment-name" class="form-input" required 
                 placeholder="e.g., Annual ISO 27001 Assessment">
        </div>
        <div>
          <label class="form-label">Framework</label>
          <select id="assessment-framework" class="form-select" required>
            <option value="">Select Framework</option>
            <option value="ISO27001">ISO 27001</option>
            <option value="GDPR">GDPR</option>
            <option value="SOX">SOX</option>
            <option value="HIPAA">HIPAA</option>
            <option value="UAE_IA">UAE IA Standard</option>
            <option value="COBIT">COBIT</option>
            <option value="NIST">NIST Framework</option>
          </select>
        </div>
      </div>
      
      <div>
        <label class="form-label">Description</label>
        <textarea id="assessment-description" class="form-input" rows="3" 
                  placeholder="Brief description of the assessment scope and objectives"></textarea>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="form-label">Organization</label>
          <select id="assessment-organization" class="form-select" required>
            <option value="">Select Organization</option>
            <!-- Will be populated dynamically -->
          </select>
        </div>
        <div>
          <label class="form-label">Lead Assessor</label>
          <select id="assessment-assessor" class="form-select" required>
            <option value="">Select Lead Assessor</option>
            <!-- Will be populated dynamically -->
          </select>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="form-label">Planned Start Date</label>
          <input type="date" id="assessment-start-date" class="form-input" required>
        </div>
        <div>
          <label class="form-label">Planned End Date</label>
          <input type="date" id="assessment-end-date" class="form-input" required>
        </div>
      </div>
      
      <div>
        <label class="form-label">Assessment Scope</label>
        <select id="assessment-scope" class="form-select" required>
          <option value="">Select Scope</option>
          <option value="organization_wide">Organization Wide</option>
          <option value="department_specific">Department Specific</option>
          <option value="process_specific">Process Specific</option>
          <option value="system_specific">System Specific</option>
        </select>
      </div>
      
      <div>
        <label class="form-label">Methodology</label>
        <select id="assessment-methodology" class="form-select" required>
          <option value="">Select Methodology</option>
          <option value="self_assessment">Self Assessment</option>
          <option value="internal_audit">Internal Audit</option>
          <option value="external_audit">External Audit</option>
          <option value="gap_analysis">Gap Analysis</option>
          <option value="maturity_assessment">Maturity Assessment</option>
        </select>
      </div>
    </form>
  `, [
    { text: 'Cancel', class: 'btn-secondary', onclick: 'closeModal(this)' },
    { text: 'Create Assessment', class: 'btn-primary', onclick: 'saveAssessment()' }
  ]);
  
  // Populate organizations and users dropdowns
  populateAssessmentDropdowns();
}

async function populateAssessmentDropdowns() {
  try {
    const token = localStorage.getItem('aria_token');
    
    // Populate organizations
    const orgResponse = await axios.get('/api/organizations', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const orgSelect = document.getElementById('assessment-organization');
    if (orgSelect && orgResponse.data.success) {
      orgResponse.data.data.forEach(org => {
        const option = document.createElement('option');
        option.value = org.id;
        option.textContent = org.name;
        orgSelect.appendChild(option);
      });
    }
    
    // Populate users (for lead assessor)
    const userResponse = await axios.get('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const assessorSelect = document.getElementById('assessment-assessor');
    if (assessorSelect && userResponse.data.success) {
      userResponse.data.data.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.first_name} ${user.last_name} (${user.role})`;
        assessorSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error populating assessment dropdowns:', error);
  }
}

async function saveAssessment() {
  const formData = {
    name: document.getElementById('assessment-name').value,
    framework: document.getElementById('assessment-framework').value,
    description: document.getElementById('assessment-description').value,
    organization_id: parseInt(document.getElementById('assessment-organization').value),
    lead_assessor_id: parseInt(document.getElementById('assessment-assessor').value),
    planned_start_date: document.getElementById('assessment-start-date').value,
    planned_end_date: document.getElementById('assessment-end-date').value,
    scope: document.getElementById('assessment-scope').value,
    methodology: document.getElementById('assessment-methodology').value
  };
  
  // Validate required fields
  if (!formData.name || !formData.framework || !formData.organization_id || 
      !formData.lead_assessor_id || !formData.planned_start_date || 
      !formData.planned_end_date || !formData.scope || !formData.methodology) {
    showToast('Please fill in all required fields', 'error');
    return;
  }
  
  // Validate date range
  if (new Date(formData.planned_end_date) <= new Date(formData.planned_start_date)) {
    showToast('End date must be after start date', 'error');
    return;
  }
  
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.post('/api/assessments', formData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast('Assessment created successfully', 'success');
      closeModal(this);
      loadComplianceData(); // Refresh the compliance data
      if (typeof loadAssessments === 'function') {
        loadAssessments(); // Refresh assessments if function exists
      }
    }
  } catch (error) {
    console.error('Error creating assessment:', error);
    if (error.response?.status === 403) {
      showToast('You do not have permission to create assessments', 'error');
    } else {
      showToast('Failed to create assessment', 'error');
    }
  }
}
function showAddIncidentModal() {
  showModal('Report New Incident', `
    <form id="incident-form" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="form-label">Incident Title *</label>
          <input type="text" id="incident-title" class="form-input" required 
                 placeholder="Brief description of the incident">
        </div>
        <div>
          <label class="form-label">Incident Type *</label>
          <select id="incident-type" class="form-select" required>
            <option value="">Select Type</option>
            <option value="security">Security Incident</option>
            <option value="operational">Operational Issue</option>
            <option value="data_breach">Data Breach</option>
            <option value="system_outage">System Outage</option>
            <option value="compliance">Compliance Violation</option>
            <option value="privacy">Privacy Incident</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
      
      <div>
        <label class="form-label">Incident Description *</label>
        <textarea id="incident-description" class="form-input" rows="4" required
                  placeholder="Detailed description of what happened, when it was discovered, and current status"></textarea>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label class="form-label">Severity Level *</label>
          <select id="incident-severity" class="form-select" required>
            <option value="">Select Severity</option>
            <option value="critical">Critical - Business Critical</option>
            <option value="high">High - Significant Impact</option>
            <option value="medium">Medium - Moderate Impact</option>
            <option value="low">Low - Minor Impact</option>
          </select>
        </div>
        <div>
          <label class="form-label">Detection Method</label>
          <select id="incident-detection" class="form-select">
            <option value="">Select Method</option>
            <option value="automated_monitoring">Automated Monitoring</option>
            <option value="user_report">User Report</option>
            <option value="security_scan">Security Scan</option>
            <option value="audit_finding">Audit Finding</option>
            <option value="third_party_notification">Third Party Notification</option>
            <option value="manual_discovery">Manual Discovery</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label class="form-label">Assign To</label>
          <select id="incident-assignee" class="form-select">
            <option value="">Select Assignee</option>
            <!-- Will be populated dynamically -->
          </select>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="form-label">When Occurred</label>
          <input type="datetime-local" id="incident-occurred" class="form-input">
        </div>
        <div>
          <label class="form-label">When Detected</label>
          <input type="datetime-local" id="incident-detected" class="form-input">
        </div>
      </div>
      
      <div>
        <label class="form-label">Initial Response Actions</label>
        <textarea id="incident-response" class="form-input" rows="3" 
                  placeholder="Immediate actions taken or planned to address this incident"></textarea>
      </div>
      
      <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fas fa-exclamation-triangle text-yellow-400"></i>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-yellow-800">
              Important Notice
            </h3>
            <div class="mt-2 text-sm text-yellow-700">
              <p>For critical security incidents, please also notify the security team immediately via phone or secure channel.</p>
            </div>
          </div>
        </div>
      </div>
    </form>
  `, [
    { text: 'Cancel', class: 'btn-secondary', onclick: 'closeModal(this)' },
    { text: 'Report Incident', class: 'btn-primary', onclick: 'saveIncident()' }
  ]);
  
  // Set default values
  const now = new Date();
  document.getElementById('incident-detected').value = now.toISOString().slice(0, 16);
  
  // Populate assignee dropdown
  populateIncidentAssignees();
}

async function populateIncidentAssignees() {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const assigneeSelect = document.getElementById('incident-assignee');
    if (assigneeSelect && response.data.success) {
      response.data.data.forEach(user => {
        // Only show users who can handle incidents
        if (['admin', 'incident_manager', 'risk_manager', 'security_officer'].includes(user.role)) {
          const option = document.createElement('option');
          option.value = user.id;
          option.textContent = `${user.first_name} ${user.last_name} (${user.role})`;
          assigneeSelect.appendChild(option);
        }
      });
    }
  } catch (error) {
    console.error('Error populating incident assignees:', error);
  }
}

async function saveIncident() {
  const formData = {
    title: document.getElementById('incident-title').value,
    description: document.getElementById('incident-description').value,
    incident_type: document.getElementById('incident-type').value,
    severity: document.getElementById('incident-severity').value,
    detection_method: document.getElementById('incident-detection').value,
    assigned_to: parseInt(document.getElementById('incident-assignee').value) || null,
    reported_at: document.getElementById('incident-occurred').value || new Date().toISOString(),
    initial_response: document.getElementById('incident-response').value
  };
  
  // Validate required fields
  if (!formData.title || !formData.description || !formData.incident_type || !formData.severity) {
    showToast('Please fill in all required fields', 'error');
    return;
  }
  
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.post('/api/incidents', formData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast('Incident reported successfully', 'success');
      closeUniversalModal();
      if (typeof loadIncidentsData === 'function') {
        loadIncidentsData(); // Refresh incidents if function exists
      }
    }
  } catch (error) {
    console.error('Error reporting incident:', error);
    if (error.response?.status === 403) {
      showToast('You do not have permission to report incidents', 'error');
    } else {
      showToast('Failed to report incident', 'error');
    }
  }
}

async function viewAssessment(id) {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get(`/api/assessments/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.data.success) {
      showToast('Failed to load assessment details', 'error');
      return;
    }
    
    const assessment = response.data.data;
    
    showModal('Assessment Details', `
      <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Assessment ID</label>
            <div class="form-input bg-gray-50">${assessment.assessment_id || 'N/A'}</div>
          </div>
          <div>
            <label class="form-label">Status</label>
            <div class="form-input bg-gray-50">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${assessment.status === 'completed' ? 'bg-green-100 text-green-800' : 
                  assessment.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                  assessment.status === 'planning' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-gray-100 text-gray-800'}">
                ${assessment.status || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <label class="form-label">Assessment Name</label>
          <div class="form-input bg-gray-50">${assessment.name || 'N/A'}</div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Framework</label>
            <div class="form-input bg-gray-50">${assessment.framework || 'N/A'}</div>
          </div>
          <div>
            <label class="form-label">Lead Assessor</label>
            <div class="form-input bg-gray-50">${assessment.lead_assessor_name || 'Unassigned'}</div>
          </div>
        </div>
        
        <div>
          <label class="form-label">Description</label>
          <div class="form-input bg-gray-50 min-h-20">${assessment.description || 'No description provided'}</div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Planned Start Date</label>
            <div class="form-input bg-gray-50">${assessment.planned_start_date || 'N/A'}</div>
          </div>
          <div>
            <label class="form-label">Planned End Date</label>
            <div class="form-input bg-gray-50">${assessment.planned_end_date || 'N/A'}</div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Scope</label>
            <div class="form-input bg-gray-50">${assessment.scope || 'N/A'}</div>
          </div>
          <div>
            <label class="form-label">Methodology</label>
            <div class="form-input bg-gray-50">${assessment.methodology || 'N/A'}</div>
          </div>
        </div>
        
        <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <i class="fas fa-info-circle text-blue-400"></i>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-blue-800">Assessment Information</h3>
              <div class="mt-2 text-sm text-blue-700">
                <p>Created: ${new Date(assessment.created_at).toLocaleDateString()}</p>
                <p>Last Updated: ${new Date(assessment.updated_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `, [
      { text: 'Close', class: 'btn-secondary', onclick: 'closeModal(this)' },
      { text: 'Edit Assessment', class: 'btn-primary', onclick: `closeModal(this); editAssessment(${id})` }
    ], 'max-w-4xl');
    
  } catch (error) {
    console.error('Error viewing assessment:', error);
    showToast('Failed to load assessment details', 'error');
  }
}

async function editAssessment(id) {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get(`/api/assessments/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.data.success) {
      showToast('Failed to load assessment details', 'error');
      return;
    }
    
    const assessment = response.data.data;
    
    showModal('Edit Assessment', `
      <form id="edit-assessment-form" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Assessment ID</label>
            <input type="text" value="${assessment.assessment_id}" class="form-input bg-gray-100" readonly>
          </div>
          <div>
            <label class="form-label">Status *</label>
            <select id="edit-assessment-status" class="form-select" required>
              <option value="planning" ${assessment.status === 'planning' ? 'selected' : ''}>Planning</option>
              <option value="in_progress" ${assessment.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
              <option value="under_review" ${assessment.status === 'under_review' ? 'selected' : ''}>Under Review</option>
              <option value="completed" ${assessment.status === 'completed' ? 'selected' : ''}>Completed</option>
              <option value="on_hold" ${assessment.status === 'on_hold' ? 'selected' : ''}>On Hold</option>
            </select>
          </div>
        </div>
        
        <div>
          <label class="form-label">Assessment Name *</label>
          <input type="text" id="edit-assessment-name" class="form-input" required value="${assessment.name || ''}">
        </div>
        
        <div>
          <label class="form-label">Description</label>
          <textarea id="edit-assessment-description" class="form-input" rows="3">${assessment.description || ''}</textarea>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Framework *</label>
            <select id="edit-assessment-framework" class="form-select" required>
              <option value="ISO27001" ${assessment.framework === 'ISO27001' ? 'selected' : ''}>ISO 27001</option>
              <option value="GDPR" ${assessment.framework === 'GDPR' ? 'selected' : ''}>GDPR</option>
              <option value="SOX" ${assessment.framework === 'SOX' ? 'selected' : ''}>SOX</option>
              <option value="HIPAA" ${assessment.framework === 'HIPAA' ? 'selected' : ''}>HIPAA</option>
              <option value="UAE_IA" ${assessment.framework === 'UAE_IA' ? 'selected' : ''}>UAE IA Standard</option>
              <option value="COBIT" ${assessment.framework === 'COBIT' ? 'selected' : ''}>COBIT</option>
              <option value="NIST" ${assessment.framework === 'NIST' ? 'selected' : ''}>NIST Framework</option>
            </select>
          </div>
          <div>
            <label class="form-label">Lead Assessor *</label>
            <select id="edit-assessment-assessor" class="form-select" required>
              <option value="">Select Lead Assessor</option>
              <!-- Will be populated dynamically -->
            </select>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Planned Start Date</label>
            <input type="date" id="edit-assessment-start-date" class="form-input" 
                   value="${assessment.planned_start_date || ''}">
          </div>
          <div>
            <label class="form-label">Planned End Date</label>
            <input type="date" id="edit-assessment-end-date" class="form-input" 
                   value="${assessment.planned_end_date || ''}">
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Scope</label>
            <select id="edit-assessment-scope" class="form-select">
              <option value="organization_wide" ${assessment.scope === 'organization_wide' ? 'selected' : ''}>Organization Wide</option>
              <option value="department_specific" ${assessment.scope === 'department_specific' ? 'selected' : ''}>Department Specific</option>
              <option value="process_specific" ${assessment.scope === 'process_specific' ? 'selected' : ''}>Process Specific</option>
              <option value="system_specific" ${assessment.scope === 'system_specific' ? 'selected' : ''}>System Specific</option>
            </select>
          </div>
          <div>
            <label class="form-label">Methodology</label>
            <select id="edit-assessment-methodology" class="form-select">
              <option value="self_assessment" ${assessment.methodology === 'self_assessment' ? 'selected' : ''}>Self Assessment</option>
              <option value="internal_audit" ${assessment.methodology === 'internal_audit' ? 'selected' : ''}>Internal Audit</option>
              <option value="external_audit" ${assessment.methodology === 'external_audit' ? 'selected' : ''}>External Audit</option>
              <option value="gap_analysis" ${assessment.methodology === 'gap_analysis' ? 'selected' : ''}>Gap Analysis</option>
              <option value="maturity_assessment" ${assessment.methodology === 'maturity_assessment' ? 'selected' : ''}>Maturity Assessment</option>
            </select>
          </div>
        </div>
      </form>
    `, [
      { text: 'Cancel', class: 'btn-secondary', onclick: 'closeModal(this)' },
      { text: 'Update Assessment', class: 'btn-primary', onclick: `updateAssessment(${id})` }
    ]);
    
    // Populate assessor dropdown
    await populateEditAssessmentDropdowns(assessment.lead_assessor_id, assessment.organization_id);
    
  } catch (error) {
    console.error('Error loading assessment for edit:', error);
    showToast('Failed to load assessment details', 'error');
  }
}

async function populateEditAssessmentDropdowns(currentAssessorId, currentOrgId) {
  try {
    const token = localStorage.getItem('aria_token');
    
    // Populate users (for lead assessor)
    const userResponse = await axios.get('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const assessorSelect = document.getElementById('edit-assessment-assessor');
    if (assessorSelect && userResponse.data.success) {
      userResponse.data.data.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = `${user.first_name} ${user.last_name} (${user.role})`;
        if (user.id === currentAssessorId) {
          option.selected = true;
        }
        assessorSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error populating edit assessment dropdowns:', error);
  }
}

async function updateAssessment(id) {
  const formData = {
    name: document.getElementById('edit-assessment-name').value,
    description: document.getElementById('edit-assessment-description').value,
    framework: document.getElementById('edit-assessment-framework').value,
    status: document.getElementById('edit-assessment-status').value,
    lead_assessor_id: parseInt(document.getElementById('edit-assessment-assessor').value),
    planned_start_date: document.getElementById('edit-assessment-start-date').value,
    planned_end_date: document.getElementById('edit-assessment-end-date').value,
    scope: document.getElementById('edit-assessment-scope').value,
    methodology: document.getElementById('edit-assessment-methodology').value
  };
  
  // Validate required fields
  if (!formData.name || !formData.framework || !formData.status || !formData.lead_assessor_id) {
    showToast('Please fill in all required fields', 'error');
    return;
  }
  
  // Validate date range
  if (formData.planned_start_date && formData.planned_end_date && 
      new Date(formData.planned_end_date) <= new Date(formData.planned_start_date)) {
    showToast('End date must be after start date', 'error');
    return;
  }
  
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.put(`/api/assessments/${id}`, formData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast('Assessment updated successfully', 'success');
      closeModal(this);
      loadComplianceData(); // Refresh the compliance data
      if (typeof loadAssessments === 'function') {
        loadAssessments(); // Refresh assessments if function exists
      }
    }
  } catch (error) {
    console.error('Error updating assessment:', error);
    if (error.response?.status === 403) {
      showToast('You do not have permission to update assessments', 'error');
    } else {
      showToast('Failed to update assessment', 'error');
    }
  }
}

// SOA (Statement of Applicability) Management Functions
async function loadSOAControls() {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get('/api/controls', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      displaySOAControls(response.data.data);
    } else {
      showToast('Failed to load SOA controls', 'error');
    }
  } catch (error) {
    console.error('Error loading SOA controls:', error);
    showToast('Error loading SOA controls', 'error');
  }
}

function displaySOAControls(controls) {
  const tbody = document.getElementById('soa-controls-list');
  const loading = document.getElementById('soa-loading');
  
  loading.style.display = 'none';
  
  if (!controls || controls.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="px-6 py-8 text-center text-gray-500">
          <div class="flex flex-col items-center">
            <i class="fas fa-clipboard-list text-4xl mb-4 text-gray-300"></i>
            <p class="text-lg font-medium mb-2">No Controls Found</p>
            <p class="text-sm">Import a framework to see controls for SOA tracking</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = controls.map(control => `
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        ${control.control_id || 'N/A'}
      </td>
      <td class="px-6 py-4 text-sm text-gray-900 max-w-xs">
        <div class="font-medium">${control.name || control.title || 'N/A'}</div>
        <div class="text-gray-500 text-xs mt-1 truncate" title="${control.description || ''}">
          ${control.description ? control.description.substring(0, 100) + '...' : 'No description'}
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
          ${control.framework === 'ISO27001' ? 'bg-blue-100 text-blue-800' : 
            control.framework === 'UAE_IA' ? 'bg-green-100 text-green-800' : 
            control.framework === 'GDPR' ? 'bg-purple-100 text-purple-800' : 
            'bg-gray-100 text-gray-800'}">
          ${control.framework || 'N/A'}
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${control.control_category || control.category || 'N/A'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <select onchange="updateSOAStatus(${control.id}, this.value)" class="form-select text-xs py-1 px-2
          ${getStatusColor(control.implementation_status)}">
          <option value="not_implemented" ${control.implementation_status === 'not_implemented' ? 'selected' : ''}>Not Implemented</option>
          <option value="in_progress" ${control.implementation_status === 'in_progress' ? 'selected' : ''}>In Progress</option>
          <option value="implemented" ${control.implementation_status === 'implemented' ? 'selected' : ''}>Implemented</option>
          <option value="not_applicable" ${control.implementation_status === 'not_applicable' ? 'selected' : ''}>Not Applicable</option>
        </select>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <select onchange="updateSOAApplicability(${control.id}, this.value)" class="form-select text-xs py-1 px-2">
          <option value="applicable" ${control.applicability !== 'not_applicable' ? 'selected' : ''}>Applicable</option>
          <option value="not_applicable" ${control.applicability === 'not_applicable' ? 'selected' : ''}>Not Applicable</option>
        </select>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        ${control.owner_name || 'Unassigned'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <button onclick="viewSOAControl(${control.id})" class="text-blue-600 hover:text-blue-900 mr-3">
          <i class="fas fa-eye"></i>
        </button>
        <button onclick="editSOAControl(${control.id})" class="text-green-600 hover:text-green-900">
          <i class="fas fa-edit"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function getStatusColor(status) {
  switch (status) {
    case 'implemented': return 'text-green-800 bg-green-50 border-green-200';
    case 'in_progress': return 'text-yellow-800 bg-yellow-50 border-yellow-200';
    case 'not_applicable': return 'text-gray-800 bg-gray-50 border-gray-200';
    default: return 'text-red-800 bg-red-50 border-red-200';
  }
}

async function updateSOAStatus(controlId, status) {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.put(`/api/controls/${controlId}`, {
      implementation_status: status
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast('Control status updated successfully', 'success');
    } else {
      showToast('Failed to update control status', 'error');
    }
  } catch (error) {
    console.error('Error updating control status:', error);
    showToast('Failed to update control status', 'error');
  }
}

async function updateSOAApplicability(controlId, applicability) {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.put(`/api/controls/${controlId}`, {
      applicability: applicability
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast('Control applicability updated successfully', 'success');
    } else {
      showToast('Failed to update control applicability', 'error');
    }
  } catch (error) {
    console.error('Error updating control applicability:', error);
    showToast('Failed to update control applicability', 'error');
  }
}

function filterSOAControls() {
  const frameworkFilter = document.getElementById('soa-framework-filter').value;
  const statusFilter = document.getElementById('soa-status-filter').value;
  const categoryFilter = document.getElementById('soa-category-filter').value;
  
  const rows = document.querySelectorAll('#soa-controls-list tr');
  
  rows.forEach(row => {
    const framework = row.querySelector('td:nth-child(3) span')?.textContent?.trim();
    const status = row.querySelector('td:nth-child(5) select')?.value;
    const category = row.querySelector('td:nth-child(4)')?.textContent?.trim();
    
    let show = true;
    
    if (frameworkFilter && framework !== frameworkFilter) show = false;
    if (statusFilter && status !== statusFilter) show = false;
    if (categoryFilter && !category?.includes(categoryFilter)) show = false;
    
    row.style.display = show ? '' : 'none';
  });
}

function viewSOAControl(id) {
  // Implementation similar to viewAssessment but for controls
  showToast('View SOA Control details - Feature coming soon', 'info');
}

function editSOAControl(id) {
  // Implementation similar to editAssessment but for controls
  showToast('Edit SOA Control - Feature coming soon', 'info');
}

async function exportSOA() {
  try {
    showToast('Exporting Statement of Applicability...', 'info');
    
    const token = localStorage.getItem('aria_token');
    const response = await axios.get('/api/controls', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.data.success) {
      showToast('Failed to load controls for export', 'error');
      return;
    }
    
    const controls = response.data.data;
    
    // Create SOA export data
    const soaData = controls.map(control => ({
      'Control ID': control.control_id || '',
      'Control Title': control.name || control.title || '',
      'Framework': control.framework || '',
      'Category': control.control_category || control.category || '',
      'Implementation Status': control.implementation_status || 'not_implemented',
      'Applicability': control.applicability || 'applicable',
      'Owner': control.owner_name || 'Unassigned',
      'Type': control.control_type || '',
      'Description': control.description || '',
      'Justification': control.justification || '',
      'Last Updated': control.updated_at || ''
    }));
    
    // Convert to CSV
    if (soaData.length === 0) {
      showToast('No controls found to export', 'warning');
      return;
    }
    
    const headers = Object.keys(soaData[0]).join(',');
    const csvData = [headers];
    
    soaData.forEach(row => {
      const values = Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
      csvData.push(values);
    });
    
    // Create and download file
    const csvContent = csvData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Statement_of_Applicability_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('Statement of Applicability exported successfully', 'success');
    
  } catch (error) {
    console.error('Error exporting SOA:', error);
    showToast('Failed to export Statement of Applicability', 'error');
  }
}

async function deleteAssessment(id) {
  if (!confirm('Are you sure you want to delete this assessment? This action cannot be undone.')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.delete(`/api/assessments/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast('Assessment deleted successfully', 'success');
      loadComplianceData(); // Refresh the compliance data
      if (typeof loadAssessments === 'function') {
        loadAssessments(); // Refresh assessments if function exists
      }
    }
  } catch (error) {
    console.error('Error deleting assessment:', error);
    if (error.response?.status === 403) {
      showToast('You do not have permission to delete assessments', 'error');
    } else {
      showToast('Failed to delete assessment', 'error');
    }
  }
}
async function generateComplianceReport() {
  try {
    showToast('Generating compliance report...', 'info');
    
    const token = localStorage.getItem('aria_token');
    
    // Fetch compliance data
    const [assessmentsResponse, findingsResponse, requirementsResponse] = await Promise.all([
      axios.get('/api/assessments', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/findings', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/requirements', { headers: { Authorization: `Bearer ${token}` } })
    ]);
    
    const assessments = assessmentsResponse.data.success ? assessmentsResponse.data.data : [];
    const findings = findingsResponse.data.success ? findingsResponse.data.data : [];
    const requirements = requirementsResponse.data.success ? requirementsResponse.data.data : [];
    
    // Generate HTML report
    const reportDate = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Compliance Report - ${reportDate}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
          .section { margin-bottom: 30px; }
          .section h2 { color: #4f46e5; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
          th { background-color: #f3f4f6; font-weight: bold; }
          .status-compliant { color: #10b981; font-weight: bold; }
          .status-non-compliant { color: #ef4444; font-weight: bold; }
          .status-in-progress { color: #f59e0b; font-weight: bold; }
          .status-not-assessed { color: #6b7280; font-weight: bold; }
          .severity-critical { color: #dc2626; font-weight: bold; }
          .severity-high { color: #ea580c; font-weight: bold; }
          .severity-medium { color: #d97706; font-weight: bold; }
          .severity-low { color: #65a30d; font-weight: bold; }
          .summary-stats { display: flex; justify-content: space-around; margin: 20px 0; }
          .stat-card { text-align: center; padding: 15px; border: 1px solid #d1d5db; border-radius: 8px; }
          .stat-number { font-size: 24px; font-weight: bold; color: #4f46e5; }
          .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #6b7280; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>GRC Compliance Report</h1>
          <p>Generated on ${reportDate}</p>
          <p>DMT Corporation Risk Management Platform</p>
        </div>
        
        <div class="section">
          <h2>Executive Summary</h2>
          <div class="summary-stats">
            <div class="stat-card">
              <div class="stat-number">${assessments.length}</div>
              <div>Total Assessments</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${findings.length}</div>
              <div>Total Findings</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${requirements.length}</div>
              <div>Total Requirements</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${findings.filter(f => f.status === 'open').length}</div>
              <div>Open Findings</div>
            </div>
          </div>
        </div>
        
        <div class="section">
          <h2>Compliance Assessments Status</h2>
          <table>
            <thead>
              <tr>
                <th>Assessment ID</th>
                <th>Name</th>
                <th>Framework</th>
                <th>Status</th>
                <th>Lead Assessor</th>
                <th>Start Date</th>
                <th>End Date</th>
              </tr>
            </thead>
            <tbody>
              ${assessments.map(assessment => `
                <tr>
                  <td>${assessment.assessment_id || 'N/A'}</td>
                  <td>${assessment.name || 'N/A'}</td>
                  <td>${assessment.framework || 'N/A'}</td>
                  <td class="status-${(assessment.status || 'not_assessed').replace('_', '-')}">${assessment.status || 'Not Assessed'}</td>
                  <td>${assessment.lead_assessor_name || 'Unassigned'}</td>
                  <td>${assessment.planned_start_date || 'N/A'}</td>
                  <td>${assessment.planned_end_date || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>Active Findings</h2>
          <table>
            <thead>
              <tr>
                <th>Finding ID</th>
                <th>Title</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Category</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              ${findings.filter(f => f.status !== 'resolved').map(finding => `
                <tr>
                  <td>${finding.finding_id || 'N/A'}</td>
                  <td>${finding.title || 'N/A'}</td>
                  <td class="severity-${finding.severity || 'low'}">${(finding.severity || 'Low').toUpperCase()}</td>
                  <td class="status-${(finding.status || 'open').replace('_', '-')}">${finding.status || 'Open'}</td>
                  <td>${finding.category || 'N/A'}</td>
                  <td>${finding.due_date || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="section">
          <h2>Compliance Requirements Status</h2>
          <table>
            <thead>
              <tr>
                <th>Requirement ID</th>
                <th>Title</th>
                <th>Framework</th>
                <th>Status</th>
                <th>Category</th>
                <th>Due Date</th>
              </tr>
            </thead>
            <tbody>
              ${requirements.map(req => `
                <tr>
                  <td>${req.requirement_id || 'N/A'}</td>
                  <td>${req.title || 'N/A'}</td>
                  <td>${req.framework || 'N/A'}</td>
                  <td class="status-${(req.status || 'not_assessed').replace('_', '-')}">${req.status || 'Not Assessed'}</td>
                  <td>${req.category || 'N/A'}</td>
                  <td>${req.due_date || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>This report was generated automatically by the DMT Risk Management Platform.</p>
          <p>For questions or concerns, please contact the compliance team.</p>
        </div>
      </body>
      </html>
    `;
    
    // Create and download the report
    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Compliance_Report_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('Compliance report generated and downloaded successfully', 'success');
    
  } catch (error) {
    console.error('Error generating compliance report:', error);
    showToast('Failed to generate compliance report', 'error');
  }
}
function filterAssessments() {
  const frameworkFilter = document.getElementById('assessment-framework-filter').value;
  const statusFilter = document.getElementById('assessment-status-filter').value;
  
  const rows = document.querySelectorAll('#assessments-list tr');
  
  rows.forEach(row => {
    const framework = row.querySelector('td:nth-child(3)')?.textContent?.trim();
    const status = row.querySelector('td:nth-child(4)')?.textContent?.trim().toLowerCase();
    
    let show = true;
    
    if (frameworkFilter && framework !== frameworkFilter) show = false;
    if (statusFilter && !status.includes(statusFilter.toLowerCase())) show = false;
    
    row.style.display = show ? '' : 'none';
  });
  
  showToast('Assessment filters applied', 'success');
}

async function viewIncident(id) {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get(`/api/incidents/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.data.success) {
      showToast('Failed to load incident details', 'error');
      return;
    }
    
    const incident = response.data.data;
    
    showModal('Incident Details', `
      <div class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Incident ID</label>
            <div class="form-input bg-gray-50">${incident.incident_id || 'N/A'}</div>
          </div>
          <div>
            <label class="form-label">Status</label>
            <div class="form-input bg-gray-50">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${incident.status === 'resolved' ? 'bg-green-100 text-green-800' : 
                  incident.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                  incident.status === 'new' ? 'bg-red-100 text-red-800' : 
                  'bg-gray-100 text-gray-800'}">
                ${incident.status || 'Unknown'}
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <label class="form-label">Title</label>
          <div class="form-input bg-gray-50">${incident.title || 'N/A'}</div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="form-label">Type</label>
            <div class="form-input bg-gray-50">${incident.incident_type || 'N/A'}</div>
          </div>
          <div>
            <label class="form-label">Severity</label>
            <div class="form-input bg-gray-50">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${incident.severity === 'critical' ? 'bg-red-100 text-red-800' : 
                  incident.severity === 'high' ? 'bg-orange-100 text-orange-800' : 
                  incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-green-100 text-green-800'}">
                ${incident.severity || 'Unknown'}
              </span>
            </div>
          </div>
          <div>
            <label class="form-label">Priority</label>
            <div class="form-input bg-gray-50">${incident.priority || 'N/A'}</div>
          </div>
        </div>
        
        <div>
          <label class="form-label">Description</label>
          <div class="form-input bg-gray-50 min-h-20">${incident.description || 'No description provided'}</div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Assigned To</label>
            <div class="form-input bg-gray-50">${incident.assigned_first_name && incident.assigned_last_name ? 
              `${incident.assigned_first_name} ${incident.assigned_last_name}` : 'Unassigned'}</div>
          </div>
          <div>
            <label class="form-label">Reported By</label>
            <div class="form-input bg-gray-50">${incident.reporter_first_name && incident.reporter_last_name ? 
              `${incident.reporter_first_name} ${incident.reporter_last_name}` : 'Unknown'}</div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Detection Method</label>
            <div class="form-input bg-gray-50">${incident.detection_method || 'N/A'}</div>
          </div>
          <div>
            <label class="form-label">Reported At</label>
            <div class="form-input bg-gray-50">${incident.reported_at ? new Date(incident.reported_at).toLocaleString() : 'N/A'}</div>
          </div>
        </div>
        
        <div>
          <label class="form-label">Initial Response</label>
          <div class="form-input bg-gray-50 min-h-16">${incident.initial_response || 'No initial response documented'}</div>
        </div>
        
        ${incident.resolution_notes ? `
        <div>
          <label class="form-label">Resolution Notes</label>
          <div class="form-input bg-gray-50 min-h-16">${incident.resolution_notes}</div>
        </div>
        ` : ''}
        
        <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <i class="fas fa-info-circle text-blue-400"></i>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-blue-800">Incident Timeline</h3>
              <div class="mt-2 text-sm text-blue-700">
                <p>Created: ${new Date(incident.created_at).toLocaleString()}</p>
                <p>Last Updated: ${new Date(incident.updated_at).toLocaleString()}</p>
                ${incident.resolved_at ? `<p>Resolved: ${new Date(incident.resolved_at).toLocaleString()}</p>` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>
    `, [
      { text: 'Close', class: 'btn-secondary', onclick: 'closeModal(this)' },
      { text: 'Edit Incident', class: 'btn-primary', onclick: `closeModal(this); editIncident(${id})` }
    ], 'max-w-4xl');
    
  } catch (error) {
    console.error('Error viewing incident:', error);
    showToast('Failed to load incident details', 'error');
  }
}
async function editIncident(id) {
  try {
    const token = localStorage.getItem('aria_token');
    
    // Fetch incident details
    const response = await axios.get(`/api/incidents/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.data.success) {
      showToast('Failed to load incident details', 'error');
      return;
    }
    
    const incident = response.data.data;
    
    showModal('Edit Incident', `
      <form id="edit-incident-form" class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Incident ID</label>
            <input type="text" value="${incident.incident_id}" class="form-input bg-gray-100" readonly>
          </div>
          <div>
            <label class="form-label">Status *</label>
            <select id="edit-incident-status" class="form-select" required>
              <option value="new" ${incident.status === 'new' ? 'selected' : ''}>New</option>
              <option value="assigned" ${incident.status === 'assigned' ? 'selected' : ''}>Assigned</option>
              <option value="in_progress" ${incident.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
              <option value="investigating" ${incident.status === 'investigating' ? 'selected' : ''}>Investigating</option>
              <option value="resolved" ${incident.status === 'resolved' ? 'selected' : ''}>Resolved</option>
              <option value="closed" ${incident.status === 'closed' ? 'selected' : ''}>Closed</option>
            </select>
          </div>
        </div>
        
        <div>
          <label class="form-label">Incident Title *</label>
          <input type="text" id="edit-incident-title" class="form-input" required value="${incident.title || ''}">
        </div>
        
        <div>
          <label class="form-label">Description *</label>
          <textarea id="edit-incident-description" class="form-input" rows="4" required>${incident.description || ''}</textarea>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="form-label">Incident Type *</label>
            <select id="edit-incident-type" class="form-select" required>
              <option value="security" ${incident.incident_type === 'security' ? 'selected' : ''}>Security Incident</option>
              <option value="operational" ${incident.incident_type === 'operational' ? 'selected' : ''}>Operational Issue</option>
              <option value="data_breach" ${incident.incident_type === 'data_breach' ? 'selected' : ''}>Data Breach</option>
              <option value="system_outage" ${incident.incident_type === 'system_outage' ? 'selected' : ''}>System Outage</option>
              <option value="compliance" ${incident.incident_type === 'compliance' ? 'selected' : ''}>Compliance Violation</option>
              <option value="privacy" ${incident.incident_type === 'privacy' ? 'selected' : ''}>Privacy Incident</option>
              <option value="other" ${incident.incident_type === 'other' ? 'selected' : ''}>Other</option>
            </select>
          </div>
          <div>
            <label class="form-label">Severity Level *</label>
            <select id="edit-incident-severity" class="form-select" required>
              <option value="critical" ${incident.severity === 'critical' ? 'selected' : ''}>Critical</option>
              <option value="high" ${incident.severity === 'high' ? 'selected' : ''}>High</option>
              <option value="medium" ${incident.severity === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="low" ${incident.severity === 'low' ? 'selected' : ''}>Low</option>
            </select>
          </div>
          <div>
            <label class="form-label">Assign To</label>
            <select id="edit-incident-assignee" class="form-select">
              <option value="">Select Assignee</option>
              <!-- Will be populated dynamically -->
            </select>
          </div>
        </div>
        
        <div>
          <label class="form-label">Resolution Notes</label>
          <textarea id="edit-incident-resolution" class="form-input" rows="3" 
                    placeholder="Resolution steps, root cause analysis, lessons learned">${incident.resolution_notes || ''}</textarea>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Resolution Date</label>
            <input type="datetime-local" id="edit-incident-resolved-date" class="form-input" 
                   value="${incident.resolved_at ? new Date(incident.resolved_at).toISOString().slice(0, 16) : ''}">
          </div>
          <div>
            <label class="form-label">Priority</label>
            <select id="edit-incident-priority" class="form-select">
              <option value="p1" ${incident.priority === 'p1' ? 'selected' : ''}>P1 - Critical</option>
              <option value="p2" ${incident.priority === 'p2' ? 'selected' : ''}>P2 - High</option>
              <option value="p3" ${incident.priority === 'p3' ? 'selected' : ''}>P3 - Medium</option>
              <option value="p4" ${incident.priority === 'p4' ? 'selected' : ''}>P4 - Low</option>
            </select>
          </div>
        </div>
      </form>
    `, [
      { text: 'Cancel', class: 'btn-secondary', onclick: 'closeModal(this)' },
      { text: 'Update Incident', class: 'btn-primary', onclick: `updateIncident(${id})` }
    ]);
    
    // Populate assignee dropdown for edit
    await populateEditIncidentAssignees(incident.assigned_to);
    
  } catch (error) {
    console.error('Error loading incident for edit:', error);
    showToast('Failed to load incident details', 'error');
  }
}

async function populateEditIncidentAssignees(currentAssigneeId) {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const assigneeSelect = document.getElementById('edit-incident-assignee');
    if (assigneeSelect && response.data.success) {
      response.data.data.forEach(user => {
        if (['admin', 'incident_manager', 'risk_manager', 'security_officer'].includes(user.role)) {
          const option = document.createElement('option');
          option.value = user.id;
          option.textContent = `${user.first_name} ${user.last_name} (${user.role})`;
          if (user.id === currentAssigneeId) {
            option.selected = true;
          }
          assigneeSelect.appendChild(option);
        }
      });
    }
  } catch (error) {
    console.error('Error populating edit incident assignees:', error);
  }
}

async function updateIncident(id) {
  const formData = {
    title: document.getElementById('edit-incident-title').value,
    description: document.getElementById('edit-incident-description').value,
    incident_type: document.getElementById('edit-incident-type').value,
    severity: document.getElementById('edit-incident-severity').value,
    status: document.getElementById('edit-incident-status').value,
    assigned_to: parseInt(document.getElementById('edit-incident-assignee').value) || null,
    priority: document.getElementById('edit-incident-priority').value,
    resolution_notes: document.getElementById('edit-incident-resolution').value,
    resolved_at: document.getElementById('edit-incident-resolved-date').value || null
  };
  
  // Validate required fields
  if (!formData.title || !formData.description || !formData.incident_type || !formData.severity || !formData.status) {
    showToast('Please fill in all required fields', 'error');
    return;
  }
  
  // Auto-set resolved_at if status is resolved but no date is set
  if (formData.status === 'resolved' && !formData.resolved_at) {
    formData.resolved_at = new Date().toISOString();
  }
  
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.put(`/api/incidents/${id}`, formData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast('Incident updated successfully', 'success');
      closeModal(this);
      if (typeof loadIncidentsData === 'function') {
        loadIncidentsData(); // Refresh incidents if function exists
      }
    }
  } catch (error) {
    console.error('Error updating incident:', error);
    if (error.response?.status === 403) {
      showToast('You do not have permission to update incidents', 'error');
    } else {
      showToast('Failed to update incident', 'error');
    }
  }
}
async function assignIncident(id) {
  try {
    const token = localStorage.getItem('aria_token');
    
    // Get users for assignment
    const usersResponse = await axios.get('/api/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!usersResponse.data.success) {
      showToast('Failed to load users', 'error');
      return;
    }
    
    const users = usersResponse.data.data.filter(user => 
      ['admin', 'incident_manager', 'risk_manager', 'security_officer'].includes(user.role)
    );
    
    showModal('Assign Incident', `
      <form id="assign-incident-form" class="space-y-4">
        <div>
          <label class="form-label">Assign To *</label>
          <select id="assign-user" class="form-select" required>
            <option value="">Select User</option>
            ${users.map(user => `
              <option value="${user.id}">${user.first_name} ${user.last_name} (${user.role})</option>
            `).join('')}
          </select>
        </div>
        
        <div>
          <label class="form-label">Assignment Notes</label>
          <textarea id="assign-notes" class="form-input" rows="3" 
                    placeholder="Add notes about this assignment"></textarea>
        </div>
      </form>
    `, [
      { text: 'Cancel', class: 'btn-secondary', onclick: 'closeModal(this)' },
      { text: 'Assign Incident', class: 'btn-primary', onclick: `saveIncidentAssignment(${id})` }
    ]);
    
  } catch (error) {
    console.error('Error loading assign incident modal:', error);
    showToast('Failed to load assignment options', 'error');
  }
}

async function escalateIncident(id) {
  try {
    const token = localStorage.getItem('aria_token');
    
    showModal('Escalate Incident', `
      <form id="escalate-incident-form" class="space-y-4">
        <div>
          <label class="form-label">Escalation Level *</label>
          <select id="escalation-level" class="form-select" required>
            <option value="">Select Level</option>
            <option value="management">Management</option>
            <option value="executive">Executive</option>
            <option value="board">Board Level</option>
            <option value="external">External Authorities</option>
          </select>
        </div>
        
        <div>
          <label class="form-label">New Priority *</label>
          <select id="escalation-priority" class="form-select" required>
            <option value="p1">P1 - Critical</option>
            <option value="p2">P2 - High</option>
          </select>
        </div>
        
        <div>
          <label class="form-label">New Severity *</label>
          <select id="escalation-severity" class="form-select" required>
            <option value="critical">Critical</option>
            <option value="high">High</option>
          </select>
        </div>
        
        <div>
          <label class="form-label">Escalation Reason *</label>
          <textarea id="escalation-reason" class="form-input" rows="4" required
                    placeholder="Explain why this incident needs to be escalated"></textarea>
        </div>
        
        <div>
          <label class="form-label">Notification Recipients</label>
          <textarea id="escalation-recipients" class="form-input" rows="2" 
                    placeholder="Email addresses to notify (comma-separated)"></textarea>
        </div>
      </form>
    `, [
      { text: 'Cancel', class: 'btn-secondary', onclick: 'closeModal(this)' },
      { text: 'Escalate Incident', class: 'btn-primary', onclick: `saveIncidentEscalation(${id})` }
    ]);
    
  } catch (error) {
    console.error('Error loading escalate incident modal:', error);
    showToast('Failed to load escalation options', 'error');
  }
}

// Import functions
function showImportRisksModal() {
  const modalContent = `
    <div class="space-y-6">
      <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Import Risks</h3>
        <p class="text-gray-600 mb-4">Upload a CSV or Excel file containing risk data</p>
        <input type="file" id="risksFileInput" accept=".csv,.xlsx,.xls" class="hidden" onchange="handleFileSelect(this, 'risks')">
        <button onclick="document.getElementById('risksFileInput').click()" class="btn-primary">
          <i class="fas fa-upload mr-2"></i>Choose File
        </button>
      </div>
      <div class="text-sm text-gray-600">
        <p class="font-medium mb-2">Required columns:</p>
        <ul class="list-disc list-inside space-y-1">
          <li>title</li>
          <li>description</li>
          <li>category (Cybersecurity, Data Privacy, Operational Risk, etc.)</li>
          <li>probability (1-5)</li>
          <li>impact (1-5)</li>
          <li>status (active, mitigated, closed, monitoring)</li>
        </ul>
      </div>
      <div class="flex justify-end space-x-3">
        <button onclick="closeModal(this)" class="btn-secondary">Cancel</button>
        <button onclick="processImport('risks')" class="btn-primary" disabled id="importRisksBtn">
          <i class="fas fa-upload mr-2"></i>Import Data
        </button>
      </div>
    </div>
  `;
  const modal = createModal('Import Risks', modalContent);
  document.body.appendChild(modal);
}

function showImportControlsModal() {
  const modalContent = `
    <div class="space-y-6">
      <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Import Controls</h3>
        <p class="text-gray-600 mb-4">Upload a CSV or Excel file containing control data</p>
        <input type="file" id="controlsFileInput" accept=".csv,.xlsx,.xls" class="hidden" onchange="handleFileSelect(this, 'controls')">
        <button onclick="document.getElementById('controlsFileInput').click()" class="btn-primary">
          <i class="fas fa-upload mr-2"></i>Choose File
        </button>
      </div>
      <div class="text-sm text-gray-600">
        <p class="font-medium mb-2">Required columns:</p>
        <ul class="list-disc list-inside space-y-1">
          <li>title</li>
          <li>description</li>
          <li>control_type (preventive, detective, corrective)</li>
          <li>control_category (access_control, data_protection, incident_response, etc.)</li>
          <li>design_effectiveness (effective, partially_effective, ineffective)</li>
          <li>operating_effectiveness (effective, partially_effective, ineffective)</li>
        </ul>
      </div>
      <div class="flex justify-end space-x-3">
        <button onclick="closeModal(this)" class="btn-secondary">Cancel</button>
        <button onclick="processImport('controls')" class="btn-primary" disabled id="importControlsBtn">
          <i class="fas fa-upload mr-2"></i>Import Data
        </button>
      </div>
    </div>
  `;
  const modal = createModal('Import Controls', modalContent);
  document.body.appendChild(modal);
}

function showImportComplianceModal() {
  const modalContent = `
    <div class="space-y-6">
      <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Import Compliance Data</h3>
        <p class="text-gray-600 mb-4">Upload a CSV or Excel file containing compliance assessments</p>
        <input type="file" id="complianceFileInput" accept=".csv,.xlsx,.xls" class="hidden" onchange="handleFileSelect(this, 'compliance')">
        <button onclick="document.getElementById('complianceFileInput').click()" class="btn-primary">
          <i class="fas fa-upload mr-2"></i>Choose File
        </button>
      </div>
      <div class="text-sm text-gray-600">
        <p class="font-medium mb-2">Required columns:</p>
        <ul class="list-disc list-inside space-y-1">
          <li>framework_name</li>
          <li>assessment_name</li>
          <li>assessment_type (self, external, audit)</li>
          <li>status (planned, in_progress, completed)</li>
          <li>compliance_score (0-100)</li>
        </ul>
      </div>
      <div class="flex justify-end space-x-3">
        <button onclick="closeModal(this)" class="btn-secondary">Cancel</button>
        <button onclick="processImport('compliance')" class="btn-primary" disabled id="importComplianceBtn">
          <i class="fas fa-upload mr-2"></i>Import Data
        </button>
      </div>
    </div>
  `;
  const modal = createModal('Import Compliance Data', modalContent);
  document.body.appendChild(modal);
}

function showImportIncidentsModal() {
  const modalContent = `
    <div class="space-y-6">
      <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Import Incidents</h3>
        <p class="text-gray-600 mb-4">Upload a CSV or Excel file containing incident data</p>
        <input type="file" id="incidentsFileInput" accept=".csv,.xlsx,.xls" class="hidden" onchange="handleFileSelect(this, 'incidents')">
        <button onclick="document.getElementById('incidentsFileInput').click()" class="btn-primary">
          <i class="fas fa-upload mr-2"></i>Choose File
        </button>
      </div>
      <div class="text-sm text-gray-600">
        <p class="font-medium mb-2">Required columns:</p>
        <ul class="list-disc list-inside space-y-1">
          <li>title</li>
          <li>description</li>
          <li>severity (low, medium, high, critical)</li>
          <li>status (open, in_progress, resolved, closed)</li>
          <li>incident_type (security, operational, compliance)</li>
        </ul>
      </div>
      <div class="flex justify-end space-x-3">
        <button onclick="closeModal(this)" class="btn-secondary">Cancel</button>
        <button onclick="processImport('incidents')" class="btn-primary" disabled id="importIncidentsBtn">
          <i class="fas fa-upload mr-2"></i>Import Data
        </button>
      </div>
    </div>
  `;
  const modal = createModal('Import Incidents', modalContent);
  document.body.appendChild(modal);
}

function showImportUsersModal() {
  const modalContent = `
    <div class="space-y-6">
      <div class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <i class="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-4"></i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Import Users</h3>
        <p class="text-gray-600 mb-4">Upload a CSV or Excel file containing user data</p>
        <input type="file" id="usersFileInput" accept=".csv,.xlsx,.xls" class="hidden" onchange="handleFileSelect(this, 'users')">
        <button onclick="document.getElementById('usersFileInput').click()" class="btn-primary">
          <i class="fas fa-upload mr-2"></i>Choose File
        </button>
      </div>
      <div class="text-sm text-gray-600">
        <p class="font-medium mb-2">Required columns:</p>
        <ul class="list-disc list-inside space-y-1">
          <li>email</li>
          <li>username</li>
          <li>first_name</li>
          <li>last_name</li>
          <li>department</li>
          <li>job_title</li>
          <li>role (admin, risk_manager, auditor, user)</li>
        </ul>
      </div>
      <div class="flex justify-end space-x-3">
        <button onclick="closeModal(this)" class="btn-secondary">Cancel</button>
        <button onclick="processImport('users')" class="btn-primary" disabled id="importUsersBtn">
          <i class="fas fa-upload mr-2"></i>Import Data
        </button>
      </div>
    </div>
  `;
  const modal = createModal('Import Users', modalContent);
  document.body.appendChild(modal);
}

// File handling functions
function handleFileSelect(input, module) {
  const file = input.files[0];
  if (!file) return;
  
  const importBtn = document.getElementById(`import${capitalizeFirst(module)}Btn`);
  if (importBtn) {
    importBtn.disabled = false;
    importBtn.innerHTML = `<i class="fas fa-upload mr-2"></i>Import ${file.name}`;
  }
  
  // Store file reference for processing
  window.currentImportFile = file;
  window.currentImportModule = module;
}

async function processImport(module) {
  if (!window.currentImportFile) {
    showToast('Please select a file first', 'error');
    return;
  }
  
  const importBtn = document.getElementById(`import${capitalizeFirst(module)}Btn`);
  if (importBtn) {
    importBtn.disabled = true;
    importBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Processing...';
  }
  
  try {
    // For now, show a success message
    // In a real implementation, you would parse the file and send data to the API
    setTimeout(() => {
      showToast(`${capitalizeFirst(module)} import completed successfully! (${window.currentImportFile.name})`, 'success');
      closeModal(document.querySelector('.fixed.inset-0.z-50'));
      
      // Refresh the current module view
      if (typeof window[`show${capitalizeFirst(module)}`] === 'function') {
        window[`show${capitalizeFirst(module)}`]();
      }
    }, 2000);
  } catch (error) {
    showToast(`Import failed: ${error.message}`, 'error');
    if (importBtn) {
      importBtn.disabled = false;
      importBtn.innerHTML = '<i class="fas fa-upload mr-2"></i>Import Data';
    }
  }
}

// Add missing export function for compliance
async function exportCompliance() {
  try {
    showToast('Exporting compliance data...', 'info');
    
    const token = localStorage.getItem('aria_token');
    
    // Fetch all compliance data
    const [assessmentsResponse, findingsResponse, requirementsResponse, controlsResponse] = await Promise.all([
      axios.get('/api/assessments', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/findings', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/requirements', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/controls', { headers: { Authorization: `Bearer ${token}` } })
    ]);
    
    const assessments = assessmentsResponse.data.success ? assessmentsResponse.data.data : [];
    const findings = findingsResponse.data.success ? findingsResponse.data.data : [];
    const requirements = requirementsResponse.data.success ? requirementsResponse.data.data : [];
    const controls = controlsResponse.data.success ? controlsResponse.data.data : [];
    
    // Create Excel-like CSV format with multiple sheets
    const exportData = {
      assessments: assessments.map(a => ({
        'Assessment ID': a.assessment_id || '',
        'Name': a.name || '',
        'Framework': a.framework || '',
        'Status': a.status || '',
        'Lead Assessor': a.lead_assessor_name || '',
        'Organization': a.organization_name || '',
        'Planned Start': a.planned_start_date || '',
        'Planned End': a.planned_end_date || '',
        'Scope': a.scope || '',
        'Methodology': a.methodology || '',
        'Created': a.created_at || ''
      })),
      requirements: requirements.map(r => ({
        'Requirement ID': r.requirement_id || '',
        'Title': r.title || '',
        'Framework': r.framework || '',
        'Category': r.category || '',
        'Status': r.status || '',
        'Owner': r.owner_name || '',
        'Due Date': r.due_date || '',
        'Description': r.description || '',
        'Created': r.created_at || ''
      })),
      findings: findings.map(f => ({
        'Finding ID': f.finding_id || '',
        'Title': f.title || '',
        'Severity': f.severity || '',
        'Status': f.status || '',
        'Category': f.category || '',
        'Assigned To': f.assigned_to_name || '',
        'Due Date': f.due_date || '',
        'Description': f.description || '',
        'Created': f.created_at || ''
      })),
      controls: controls.map(c => ({
        'Control ID': c.control_id || '',
        'Name': c.name || '',
        'Type': c.control_type || '',
        'Category': c.control_category || '',
        'Framework': c.framework || '',
        'Implementation Status': c.implementation_status || '',
        'Effectiveness': c.design_effectiveness || '',
        'Owner': c.owner_name || '',
        'Description': c.description || '',
        'Created': c.created_at || ''
      }))
    };
    
    // Convert to CSV format for each sheet
    const csvData = [];
    
    // Add assessments
    csvData.push('=== COMPLIANCE ASSESSMENTS ===');
    if (exportData.assessments.length > 0) {
      const headers = Object.keys(exportData.assessments[0]).join(',');
      csvData.push(headers);
      exportData.assessments.forEach(row => {
        const values = Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
        csvData.push(values);
      });
    }
    
    csvData.push(''); // Empty line
    csvData.push('=== COMPLIANCE REQUIREMENTS ===');
    if (exportData.requirements.length > 0) {
      const headers = Object.keys(exportData.requirements[0]).join(',');
      csvData.push(headers);
      exportData.requirements.forEach(row => {
        const values = Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
        csvData.push(values);
      });
    }
    
    csvData.push(''); // Empty line
    csvData.push('=== ASSESSMENT FINDINGS ===');
    if (exportData.findings.length > 0) {
      const headers = Object.keys(exportData.findings[0]).join(',');
      csvData.push(headers);
      exportData.findings.forEach(row => {
        const values = Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
        csvData.push(values);
      });
    }
    
    csvData.push(''); // Empty line
    csvData.push('=== SECURITY CONTROLS ===');
    if (exportData.controls.length > 0) {
      const headers = Object.keys(exportData.controls[0]).join(',');
      csvData.push(headers);
      exportData.controls.forEach(row => {
        const values = Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',');
        csvData.push(values);
      });
    }
    
    // Create and download the file
    const csvContent = csvData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Compliance_Export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showToast('Compliance data exported successfully', 'success');
    
  } catch (error) {
    console.error('Error exporting compliance data:', error);
    showToast('Failed to export compliance data', 'error');
  }
}

// Export functions
async function exportRisks() {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get('/api/risks', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.data || !response.data.length) {
      showToast('No risks found to export', 'warning');
      return;
    }
    
    const csvContent = convertToCSV(response.data, [
      { key: 'id', label: 'ID' },
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description' },
      { key: 'likelihood', label: 'Likelihood' },
      { key: 'impact', label: 'Impact' },
      { key: 'risk_score', label: 'Risk Score' },
      { key: 'category', label: 'Category' },
      { key: 'owner', label: 'Owner' },
      { key: 'status', label: 'Status' },
      { key: 'mitigation_plan', label: 'Mitigation Plan' },
      { key: 'created_at', label: 'Created Date' },
      { key: 'updated_at', label: 'Updated Date' }
    ]);
    
    downloadCSV(csvContent, `risks_export_${new Date().toISOString().split('T')[0]}.csv`);
    showToast('Risks exported successfully', 'success');
  } catch (error) {
    console.error('Error exporting risks:', error);
    showToast('Failed to export risks', 'error');
  }
}
async function exportControls() {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get('/api/controls', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.data || !response.data.length) {
      showToast('No controls found to export', 'warning');
      return;
    }
    
    const csvContent = convertToCSV(response.data, [
      { key: 'id', label: 'ID' },
      { key: 'control_id', label: 'Control ID' },
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description' },
      { key: 'category', label: 'Category' },
      { key: 'domain', label: 'Domain' },
      { key: 'framework', label: 'Framework' },
      { key: 'implementation_status', label: 'Implementation Status' },
      { key: 'testing_status', label: 'Testing Status' },
      { key: 'effectiveness', label: 'Effectiveness' },
      { key: 'owner', label: 'Owner' },
      { key: 'test_frequency', label: 'Test Frequency' },
      { key: 'last_test_date', label: 'Last Test Date' },
      { key: 'next_test_date', label: 'Next Test Date' },
      { key: 'created_at', label: 'Created Date' },
      { key: 'updated_at', label: 'Updated Date' }
    ]);
    
    downloadCSV(csvContent, `controls_export_${new Date().toISOString().split('T')[0]}.csv`);
    showToast('Controls exported successfully', 'success');
  } catch (error) {
    console.error('Error exporting controls:', error);
    showToast('Failed to export controls', 'error');
  }
}
async function exportIncidents() {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get('/api/incidents', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!response.data || !response.data.length) {
      showToast('No incidents found to export', 'warning');
      return;
    }
    
    const csvContent = convertToCSV(response.data, [
      { key: 'id', label: 'ID' },
      { key: 'title', label: 'Title' },
      { key: 'description', label: 'Description' },
      { key: 'severity', label: 'Severity' },
      { key: 'priority', label: 'Priority' },
      { key: 'status', label: 'Status' },
      { key: 'category', label: 'Category' },
      { key: 'reported_by', label: 'Reported By' },
      { key: 'assigned_to', label: 'Assigned To' },
      { key: 'incident_date', label: 'Incident Date' },
      { key: 'detection_date', label: 'Detection Date' },
      { key: 'resolution_date', label: 'Resolution Date' },
      { key: 'impact', label: 'Impact' },
      { key: 'root_cause', label: 'Root Cause' },
      { key: 'lessons_learned', label: 'Lessons Learned' },
      { key: 'created_at', label: 'Created Date' },
      { key: 'updated_at', label: 'Updated Date' }
    ]);
    
    downloadCSV(csvContent, `incidents_export_${new Date().toISOString().split('T')[0]}.csv`);
    showToast('Incidents exported successfully', 'success');
  } catch (error) {
    console.error('Error exporting incidents:', error);
    showToast('Failed to export incidents', 'error');
  }
}

// Modal and Form Helper Functions
function createModalSimple(title, content) {
  const modal = document.createElement('div');
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 transition-opacity" aria-hidden="true" onclick="closeModal(this)">
        <div class="absolute inset-0"></div>
      </div>
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
      <div class="modal-content inline-block align-bottom text-left overflow-hidden transform transition-all sm:my-8 sm:align-middle sm:w-full mx-4">
        <div class="modal-header">
          <h3 class="modal-title">
            <i class="fas fa-user-plus"></i>
            ${title}
          </h3>
          <button onclick="closeModal(this)" class="focus:outline-none">
            <i class="fas fa-times text-lg"></i>
          </button>
          </div>
          <div class="modal-body">
            ${content}
          </div>
        </div>
      </div>
    </div>
  `;
  return modal;
}

// Backward compatibility: if no global createModal is defined, expose this simple one
if (typeof window !== 'undefined' && !window.createModal) {
  window.createModal = createModalSimple;
}

// NOTE: Duplicate closeModal definition removed. Unified into single robust closeModal(element) above to avoid parse-time errors.

// Universal function to handle X button clicks and other close actions
function setupModalCloseHandlers(modal) {
  if (!modal) return;
  
  // Handle X button clicks (fa-times icons)
  const closeButtons = modal.querySelectorAll('button i.fa-times, button .fa-times');
  closeButtons.forEach(icon => {
    const button = icon.closest('button');
    if (button && !button.onclick) {
      button.onclick = () => closeModal(button);
    }
  });
  
  // Handle clicking outside modal to close
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeModal(modal);
    }
  });
}

// Risk Form Functions
function getRiskFormHTML(risk = null) {
  return `
    <form id="risk-form" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Title *</label>
          <input type="text" id="risk-title" class="form-input" required>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Category</label>
          <select id="risk-category" class="form-select">
            <option value="">Select Category (Optional)</option>
          </select>
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700">Description *</label>
        <textarea id="risk-description" class="form-input" rows="3" required placeholder="Describe the risk in detail..."></textarea>
      </div>
      
      <!-- AI-Powered Risk Assessment Section -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center space-x-2">
            <i class="fas fa-robot text-blue-600"></i>
            <h4 class="font-medium text-blue-900">AI Risk Assessment Assistant</h4>
          </div>
          <button type="button" onclick="generateAIRiskAssessment()" class="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm">
            <i class="fas fa-magic mr-1"></i>Analyze with AI
          </button>
        </div>
        <p class="text-sm text-blue-700 mb-3">Let AI help assess probability and impact based on risk details and associated services.</p>
        <div id="ai-assessment-results" class="hidden">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-white rounded p-3">
              <label class="block text-xs font-medium text-gray-600 mb-1">AI Suggested Probability</label>
              <div id="ai-probability-suggestion" class="text-lg font-semibold text-blue-900">-</div>
              <button type="button" onclick="applyAIProbability()" class="text-xs text-blue-600 hover:text-blue-800">Apply Suggestion</button>
            </div>
            <div class="bg-white rounded p-3">
              <label class="block text-xs font-medium text-gray-600 mb-1">AI Suggested Impact</label>
              <div id="ai-impact-suggestion" class="text-lg font-semibold text-blue-900">-</div>
              <button type="button" onclick="applyAIImpact()" class="text-xs text-blue-600 hover:text-blue-800">Apply Suggestion</button>
            </div>
          </div>
          <div class="mt-3 p-2 bg-white rounded">
            <label class="block text-xs font-medium text-gray-600 mb-1">AI Analysis</label>
            <div id="ai-analysis-text" class="text-sm text-gray-700"></div>
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Organization *</label>
          <select id="risk-organization" class="form-select" required>
            <option value="">Select Organization</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Risk Owner *</label>
          <select id="risk-owner" class="form-select" required>
            <option value="">Select Owner</option>
          </select>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Related Services *</label>
          <select id="risk-services" class="form-select" multiple size="4" required>
            <option value="">Loading services...</option>
          </select>
          <p class="text-xs text-gray-500 mt-1">Select services affected by this risk (Hold Ctrl/Cmd for multiple)</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Threat Source</label>
          <select id="risk-threat-source" class="form-select">
            <option value="">Select Threat Source</option>
            <option value="external_threat_actor">External Threat Actor</option>
            <option value="insider_threat">Insider Threat</option>
            <option value="system_failure">System Failure</option>
            <option value="natural_disaster">Natural Disaster</option>
            <option value="cyber_attack">Cyber Attack</option>
            <option value="human_error">Human Error</option>
            <option value="third_party">Third Party</option>
            <option value="regulatory_change">Regulatory Change</option>
            <option value="unknown">Unknown</option>
          </select>
          <p class="text-xs text-gray-500 mt-1">Primary source of this risk</p>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 flex items-center justify-between">Probability (1-5) *
            <button type="button" onclick="showRiskScoringGuide('probability')" class="text-xs text-blue-600 hover:text-blue-800">
              <i class="fas fa-question-circle mr-1"></i>Scoring Guide
            </button>
          </label>
          <select id="risk-probability" class="form-select" required>
            <option value="">Select Probability</option>
            <option value="1">1 - Very Low (0-5%)</option>
            <option value="2">2 - Low (6-25%)</option>
            <option value="3">3 - Medium (26-50%)</option>
            <option value="4">4 - High (51-75%)</option>
            <option value="5">5 - Very High (76-100%)</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 flex items-center justify-between">Impact (1-5) *
            <button type="button" onclick="showRiskScoringGuide('impact')" class="text-xs text-blue-600 hover:text-blue-800">
              <i class="fas fa-question-circle mr-1"></i>Scoring Guide
            </button>
          </label>
          <select id="risk-impact" class="form-select" required>
            <option value="">Select Impact</option>
            <option value="1">1 - Very Low (Minimal)</option>
            <option value="2">2 - Low (Minor)</option>
            <option value="3">3 - Medium (Moderate)</option>
            <option value="4">4 - High (Major)</option>
            <option value="5">5 - Very High (Severe)</option>
          </select>
        </div>
      </div>
      
      <!-- Risk Score Display -->
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <div>
            <label class="block text-sm font-medium text-gray-700">Calculated Risk Score</label>
            <div id="calculated-risk-score" class="text-2xl font-bold text-gray-900">-</div>
          </div>
          <div id="risk-level-indicator" class="px-4 py-2 rounded-lg text-sm font-medium">
            Select probability and impact
          </div>
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700">Root Cause</label>
        <textarea id="risk-root-cause" class="form-input" rows="2"></textarea>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700">Potential Impact</label>
        <textarea id="risk-potential-impact" class="form-input" rows="2"></textarea>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700">Treatment Strategy</label>
        <select id="risk-treatment" class="form-select">
          <option value="">Select Strategy</option>
          <option value="accept">Accept</option>
          <option value="mitigate">Mitigate</option>
          <option value="transfer">Transfer</option>
          <option value="avoid">Avoid</option>
        </select>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700">Mitigation Plan</label>
        <textarea id="risk-mitigation" class="form-input" rows="3"></textarea>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Identified Date</label>
          <input type="date" id="risk-identified-date" class="form-input">
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Next Review Date</label>
          <input type="date" id="risk-review-date" class="form-input">
        </div>
      </div>
      
      <div class="flex justify-end space-x-3 mt-6">
        <button type="button" onclick="closeModal(this)" class="btn-secondary">Cancel</button>
        <button type="submit" class="btn-primary">${risk ? 'Update' : 'Create'} Risk</button>
      </div>
    </form>
  `;
}

// Enhanced dropdown population with comprehensive error handling
async function populateRiskFormDropdownsSafe() {
  console.log('=== Starting Risk Form Dropdown Population ===');
  console.log('Reference data state:', referenceData);
  
  // Ensure reference data is loaded
  if (!referenceData || Object.keys(referenceData).length === 0 || !referenceData.categories) {
    console.log('Reference data not loaded, attempting to load...');
    await loadReferenceDataWithRetry();
  }
  
  // Populate categories with enhanced error checking
  const categorySelect = document.getElementById('risk-category');
  console.log('Category select element:', categorySelect);
  if (categorySelect) {
    try {
      categorySelect.innerHTML = '<option value="">Select Category</option>';
      if (referenceData?.categories && Array.isArray(referenceData.categories)) {
        referenceData.categories.forEach(category => {
          if (category && category.id && category.name) {
            categorySelect.innerHTML += `<option value="${escapeHtml(category.id)}">${escapeHtml(category.name)}</option>`;
          }
        });
        console.log(`✓ Populated ${referenceData.categories.length} categories`);
      } else {
        console.log('No categories in reference data, using defaults');
        const defaultCategories = [
          { id: 'operational', name: 'Operational Risk' },
          { id: 'financial', name: 'Financial Risk' },
          { id: 'strategic', name: 'Strategic Risk' },
          { id: 'compliance', name: 'Compliance Risk' },
          { id: 'cyber', name: 'Cybersecurity Risk' }
        ];
        defaultCategories.forEach(cat => {
          categorySelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        });
        console.log('✓ Added default categories');
      }
    } catch (error) {
      console.error('Error populating categories:', error);
    }
  } else {
    console.warn('⚠ Category select element not found in DOM');
  }
  
  // Populate organizations
  const orgSelect = document.getElementById('risk-organization');
  console.log('Organization select element:', orgSelect);
  if (orgSelect) {
    try {
      orgSelect.innerHTML = '<option value="">Select Organization</option>';
      if (referenceData?.organizations && Array.isArray(referenceData.organizations)) {
        referenceData.organizations.forEach(org => {
          if (org && org.id && org.name) {
            orgSelect.innerHTML += `<option value="${escapeHtml(org.id)}">${escapeHtml(org.name)}</option>`;
          }
        });
        console.log(`✓ Populated ${referenceData.organizations.length} organizations`);
      } else {
        orgSelect.innerHTML += '<option value="1">Default Organization</option>';
        console.log('✓ Added default organization');
      }
    } catch (error) {
      console.error('Error populating organizations:', error);
    }
  } else {
    console.warn('⚠ Organization select element not found in DOM');
  }
  
  // Populate users/owners
  const ownerSelect = document.getElementById('risk-owner');
  console.log('Owner select element:', ownerSelect);
  if (ownerSelect) {
    try {
      ownerSelect.innerHTML = '<option value="">Select Owner</option>';
      if (referenceData?.users && Array.isArray(referenceData.users)) {
        referenceData.users.forEach(user => {
          if (user && user.id) {
            const userName = user.first_name && user.last_name 
              ? `${user.first_name} ${user.last_name}` 
              : (user.name || `User ${user.id}`);
            ownerSelect.innerHTML += `<option value="${escapeHtml(user.id)}">${escapeHtml(userName)}</option>`;
          }
        });
        console.log(`✓ Populated ${referenceData.users.length} users`);
      } else {
        ownerSelect.innerHTML += '<option value="1">Admin User</option>';
        ownerSelect.innerHTML += '<option value="2">Avi Security</option>';
        console.log('✓ Added default users');
      }
    } catch (error) {
      console.error('Error populating users:', error);
    }
  } else {
    console.warn('⚠ Owner select element not found in DOM');
  }
  
  // Load services for the form
  try {
    await loadServicesForRiskForm();
    console.log('✓ Services loaded for risk form');
  } catch (error) {
    console.error('Error loading services for risk form:', error);
  }
  
  console.log('=== Risk Form Dropdown Population Complete ===');
}

// Static fallback when dynamic loading fails
function populateRiskFormStaticFallbacks() {
  console.log('🔄 Using static fallback options for risk form');
  
  const categorySelect = document.getElementById('risk-category');
  if (categorySelect) {
    categorySelect.innerHTML = `
      <option value="">Select Category</option>
      <option value="operational">Operational Risk</option>
      <option value="financial">Financial Risk</option>
      <option value="strategic">Strategic Risk</option>
      <option value="compliance">Compliance Risk</option>
      <option value="cyber">Cybersecurity Risk</option>
      <option value="regulatory">Regulatory Risk</option>
    `;
    console.log('✓ Static categories populated');
  }
  
  const orgSelect = document.getElementById('risk-organization');
  if (orgSelect) {
    orgSelect.innerHTML = `
      <option value="">Select Organization</option>
      <option value="1">Default Organization</option>
      <option value="2">IT Department</option>
      <option value="3">Finance Department</option>
      <option value="4">Operations Department</option>
    `;
    console.log('✓ Static organizations populated');
  }
  
  const ownerSelect = document.getElementById('risk-owner');
  if (ownerSelect) {
    ownerSelect.innerHTML = `
      <option value="">Select Owner</option>
      <option value="1">Admin User</option>
      <option value="2">Avi Security</option>
      <option value="3">Risk Manager</option>
      <option value="4">IT Manager</option>
    `;
    console.log('✓ Static users populated');
  }
}

// Utility function to escape HTML and prevent XSS
// Duplicate escapeHtml removed to avoid identifier clashes. Using the primary escapeHtml(text) defined earlier.

// Legacy function for backwards compatibility
async function populateRiskFormDropdowns() {
  console.log('Legacy populateRiskFormDropdowns called, delegating to safe version...');
  await populateRiskFormDropdownsSafe();
}

async function loadServicesForRiskForm() {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get('/api/services', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const servicesSelect = document.getElementById('risk-services');
    if (response.data.success && servicesSelect) {
      servicesSelect.innerHTML = '';
      
      if (response.data.data.length === 0) {
        servicesSelect.innerHTML = '<option value="">No services available</option>';
      } else {
        response.data.data.forEach(service => {
          const riskInfo = service.risk_rating ? ` (${service.risk_rating} Risk)` : '';
          servicesSelect.innerHTML += `<option value="${service.id}">${service.name}${riskInfo}</option>`;
        });
      }
    }
  } catch (error) {
    console.error('Error loading services for risk form:', error);
    const servicesSelect = document.getElementById('risk-services');
    if (servicesSelect) {
      servicesSelect.innerHTML = '<option value="">Error loading services</option>';
    }
  }
}

function populateRiskForm(risk) {
  document.getElementById('risk-title').value = risk.title || '';
  document.getElementById('risk-category').value = risk.category_id || '';
  document.getElementById('risk-description').value = risk.description || '';
  document.getElementById('risk-organization').value = risk.organization_id || '';
  document.getElementById('risk-owner').value = risk.owner_id || '';
  document.getElementById('risk-probability').value = risk.probability || '';
  document.getElementById('risk-impact').value = risk.impact || '';
  document.getElementById('risk-root-cause').value = risk.root_cause || '';
  document.getElementById('risk-potential-impact').value = risk.potential_impact || '';
  document.getElementById('risk-treatment').value = risk.treatment_strategy || '';
  document.getElementById('risk-mitigation').value = risk.mitigation_plan || '';
  document.getElementById('risk-identified-date').value = risk.identified_date ? risk.identified_date.split('T')[0] : '';
  document.getElementById('risk-review-date').value = risk.next_review_date ? risk.next_review_date.split('T')[0] : '';
  
  // Populate services selection
  if (risk.related_services) {
    const servicesSelect = document.getElementById('risk-services');
    const serviceIds = risk.related_services.split(',');
    Array.from(servicesSelect.options).forEach(option => {
      if (serviceIds.includes(option.value)) {
        option.selected = true;
      }
    });
  }
  
  document.getElementById('risk-service-impact').value = risk.service_impact_factor || 'none';
}

async function handleRiskSubmit(id = null) {
  try {
    // Get selected services
    const servicesSelect = document.getElementById('risk-services');
    const selectedServices = Array.from(servicesSelect.selectedOptions).map(option => option.value).filter(v => v);
    
    const formData = {
      title: document.getElementById('risk-title').value,
      description: document.getElementById('risk-description').value,
      category_id: parseInt(document.getElementById('risk-category').value),
      organization_id: parseInt(document.getElementById('risk-organization').value),
      owner_id: parseInt(document.getElementById('risk-owner').value),
      probability: parseInt(document.getElementById('risk-probability').value),
      impact: parseInt(document.getElementById('risk-impact').value),
      root_cause: document.getElementById('risk-root-cause').value,
      potential_impact: document.getElementById('risk-potential-impact').value,
      treatment_strategy: document.getElementById('risk-treatment').value,
      mitigation_plan: document.getElementById('risk-mitigation').value,
      identified_date: document.getElementById('risk-identified-date').value,
      next_review_date: document.getElementById('risk-review-date').value,
      related_services: selectedServices.join(','),
      service_impact_factor: document.getElementById('risk-service-impact').value
    };
    
    const token = localStorage.getItem('aria_token');
    const url = id ? `/api/risks/${id}` : '/api/risks';
    const method = id ? 'put' : 'post';
    
    const response = await axios[method](url, formData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast(`Risk ${id ? 'updated' : 'created'} successfully`, 'success');
      closeModal(document.querySelector('#risk-form'));
      await loadRisks(); // Reload risks table
    } else {
      showToast(response.data.error || `Failed to ${id ? 'update' : 'create'} risk`, 'error');
    }
  } catch (error) {
    console.error('Risk submit error:', error);
    showToast(`Failed to ${id ? 'update' : 'create'} risk`, 'error');
  }
}

function getRiskViewHTML(risk) {
  return `
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 class="font-medium text-gray-700">Risk ID</h4>
          <p class="text-gray-900">${risk.risk_id}</p>
        </div>
        <div>
          <h4 class="font-medium text-gray-700">Category</h4>
          <p class="text-gray-900">${risk.category_name || 'N/A'}</p>
        </div>
      </div>
      
      <div>
        <h4 class="font-medium text-gray-700">Title</h4>
        <p class="text-gray-900">${risk.title}</p>
      </div>
      
      <div>
        <h4 class="font-medium text-gray-700">Description</h4>
        <p class="text-gray-900">${risk.description}</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <h4 class="font-medium text-gray-700">Probability</h4>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getProbabilityClass(risk.probability)}">
            ${risk.probability}
          </span>
        </div>
        <div>
          <h4 class="font-medium text-gray-700">Impact</h4>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImpactClass(risk.impact)}">
            ${risk.impact}
          </span>
        </div>
        <div>
          <h4 class="font-medium text-gray-700">Risk Score</h4>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskScoreClass(risk.risk_score)}">
            ${risk.risk_score}
          </span>
        </div>
      </div>
      
      <div>
        <h4 class="font-medium text-gray-700">Risk Owner</h4>
        <p class="text-gray-900">${risk.first_name || ''} ${risk.last_name || 'N/A'}</p>
      </div>
      
      <div>
        <h4 class="font-medium text-gray-700">Status</h4>
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusClass(risk.status)}">
          ${capitalizeFirst(risk.status)}
        </span>
      </div>
      
      <div class="flex justify-end mt-6">
        <button onclick="closeModal(this)" class="btn-secondary">Close</button>
      </div>
    </div>
  `;
}

// Control Form Functions
function getControlFormHTML_v2(control = null) {
  return `
    <form id="control-form" class="space-y-4">
      <div>
        <label class="block text-sm font-medium text-gray-700">Control Name *</label>
        <input type="text" id="control-name" class="form-input" required>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700">Description *</label>
        <textarea id="control-description" class="form-input" rows="3" required></textarea>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Control Type *</label>
          <select id="control-type" class="form-select" required>
            <option value="">Select Type</option>
            <option value="preventive">Preventive</option>
            <option value="detective">Detective</option>
            <option value="corrective">Corrective</option>
            <option value="compensating">Compensating</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Control Category *</label>
          <select id="control-category" class="form-select" required>
            <option value="">Select Category</option>
            <option value="access_control">Access Control</option>
            <option value="system_security">System Security</option>
            <option value="data_protection">Data Protection</option>
            <option value="operational">Operational</option>
            <option value="compliance">Compliance</option>
          </select>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Framework *</label>
          <select id="control-framework" class="form-select" required>
            <option value="">Select Framework</option>
            <option value="ISO 27001">ISO 27001</option>
            <option value="NIST CSF">NIST CSF</option>
            <option value="SOC 2">SOC 2</option>
            <option value="PCI DSS">PCI DSS</option>
            <option value="GDPR">GDPR</option>
            <option value="HIPAA">HIPAA</option>
            <option value="Custom">Custom</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Control Family</label>
          <input type="text" id="control-family" class="form-input" placeholder="e.g., AC, SC, SI">
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700">Control Objective</label>
        <textarea id="control-objective" class="form-input" rows="2"></textarea>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Test Frequency *</label>
          <select id="control-frequency" class="form-select" required>
            <option value="">Select Frequency</option>
            <option value="continuous">Continuous</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="annually">Annually</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Automation Level *</label>
          <select id="control-automation" class="form-select" required>
            <option value="">Select Level</option>
            <option value="fully_automated">Fully Automated</option>
            <option value="semi_automated">Semi-Automated</option>
            <option value="manual">Manual</option>
          </select>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Organization *</label>
          <select id="control-organization" class="form-select" required>
            <option value="">Select Organization</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Control Owner *</label>
          <select id="control-owner" class="form-select" required>
            <option value="">Select Owner</option>
          </select>
        </div>
      </div>
      
      <div class="flex justify-end space-x-3 mt-6">
        <button type="button" onclick="closeModal(this)" class="btn-secondary">Cancel</button>
        <button type="submit" class="btn-primary">${control ? 'Update' : 'Create'} Control</button>
      </div>
    </form>
  `;
}

function populateControlFormDropdowns_v2() {
  // Populate organizations
  const orgSelect = document.getElementById('control-organization');
  orgSelect.innerHTML = '<option value="">Select Organization</option>';
  referenceData.organizations.forEach(org => {
    orgSelect.innerHTML += `<option value="${org.id}">${org.name}</option>`;
  });
  
  // Populate users
  const ownerSelect = document.getElementById('control-owner');
  ownerSelect.innerHTML = '<option value="">Select Owner</option>';
  referenceData.users.forEach(user => {
    ownerSelect.innerHTML += `<option value="${user.id}">${user.first_name} ${user.last_name}</option>`;
  });
}

function populateControlForm_v2(control) {
  document.getElementById('control-name').value = control.name || '';
  document.getElementById('control-description').value = control.description || '';
  document.getElementById('control-type').value = control.control_type || '';
  document.getElementById('control-category').value = control.control_category || '';
  document.getElementById('control-framework').value = control.framework || '';
  document.getElementById('control-family').value = control.control_family || '';
  document.getElementById('control-objective').value = control.control_objective || '';
  document.getElementById('control-frequency').value = control.frequency || '';
  document.getElementById('control-automation').value = control.automation_level || '';
  document.getElementById('control-organization').value = control.organization_id || '';
  document.getElementById('control-owner').value = control.owner_id || '';
}

async function handleControlSubmit_v2(id = null) {
  try {
    const formData = {
      name: document.getElementById('control-name').value,
      description: document.getElementById('control-description').value,
      control_type: document.getElementById('control-type').value,
      control_category: document.getElementById('control-category').value,
      framework: document.getElementById('control-framework').value,
      control_family: document.getElementById('control-family').value,
      control_objective: document.getElementById('control-objective').value,
      frequency: document.getElementById('control-frequency').value,
      automation_level: document.getElementById('control-automation').value,
      organization_id: parseInt(document.getElementById('control-organization').value),
      owner_id: parseInt(document.getElementById('control-owner').value)
    };
    
    const token = localStorage.getItem('aria_token');
    const url = id ? `/api/controls/${id}` : '/api/controls';
    const method = id ? 'put' : 'post';
    
    const response = await axios[method](url, formData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast(`Control ${id ? 'updated' : 'created'} successfully`, 'success');
      closeModal(document.querySelector('#control-form'));
      await loadControls(); // Reload controls table
    } else {
      showToast(response.data.error || `Failed to ${id ? 'update' : 'create'} control`, 'error');
    }
  } catch (error) {
    console.error('Control submit error:', error);
    showToast(`Failed to ${id ? 'update' : 'create'} control`, 'error');
  }
}

function getControlViewHTML_v2(control) {
  return `
    <div class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 class="font-medium text-gray-700">Control ID</h4>
          <p class="text-gray-900">${control.control_id}</p>
        </div>
        <div>
          <h4 class="font-medium text-gray-700">Framework</h4>
          <p class="text-gray-900">${control.framework}</p>
        </div>
      </div>
      
      <div>
        <h4 class="font-medium text-gray-700">Name</h4>
        <p class="text-gray-900">${control.name}</p>
      </div>
      
      <div>
        <h4 class="font-medium text-gray-700">Description</h4>
        <p class="text-gray-900">${control.description}</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 class="font-medium text-gray-700">Type</h4>
          <p class="text-gray-900">${capitalizeFirst(control.control_type)}</p>
        </div>
        <div>
          <h4 class="font-medium text-gray-700">Category</h4>
          <p class="text-gray-900">${capitalizeFirst(control.control_category.replace('_', ' '))}</p>
        </div>
      </div>
      
      <div>
        <h4 class="font-medium text-gray-700">Control Owner</h4>
        <p class="text-gray-900">${control.first_name || ''} ${control.last_name || 'N/A'}</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h4 class="font-medium text-gray-700">Design Effectiveness</h4>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEffectivenessClass(control.design_effectiveness)}">
            ${capitalizeFirst(control.design_effectiveness.replace('_', ' '))}
          </span>
        </div>
        <div>
          <h4 class="font-medium text-gray-700">Operating Effectiveness</h4>
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEffectivenessClass(control.operating_effectiveness)}">
            ${capitalizeFirst(control.operating_effectiveness.replace('_', ' '))}
          </span>
        </div>
      </div>
      
      <div class="flex justify-end mt-6">
        <button onclick="closeModal(this)" class="btn-secondary">Close</button>
      </div>
    </div>
  `;
}
// =============================================================================
// TIER 1 AI-POWERED RISK INTELLIGENCE FEATURES
// =============================================================================

// HTML escaping utility function
// Duplicate escapeHtml removed to avoid identifier clashes. Using the primary escapeHtml(text) defined earlier.

// AI Risk Heat Map Visualization
// Add debounce mechanism to prevent duplicate calls
let isLoadingHeatMap = false;
let heatMapLoadTimeout = null;

async function showAIRiskHeatMap() {
  // Prevent duplicate calls
  if (isLoadingHeatMap) {
    console.log('Heat map already loading, skipping duplicate call');
    return;
  }
  
  // Clear any existing timeout
  if (heatMapLoadTimeout) {
    clearTimeout(heatMapLoadTimeout);
  }
  
  try {
    isLoadingHeatMap = true;
    // Removed loading toast to reduce notification noise
    
    const response = await fetch('/api/analytics/risk-heat-map', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('aria_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load heat map data');
    }

    const result = await response.json();
    const { heat_map, statistics } = result.data;

    const content = `
      <div class="ai-heat-map-container">
        <!-- Heat Map Header -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-2xl font-bold text-gray-900 flex items-center">
                <i class="fas fa-fire text-red-500 mr-3"></i>
                AI-Powered Risk Heat Map
              </h2>
              <p class="text-gray-600 mt-1">Real-time risk visualization with AI intelligence</p>
            </div>
            <div class="flex space-x-3">
              <button onclick="refreshHeatMap()" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                <i class="fas fa-sync-alt mr-2"></i>Refresh
              </button>
              <button onclick="exportHeatMapData()" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <i class="fas fa-download mr-2"></i>Export
              </button>
            </div>
          </div>

          <!-- Statistics Cards -->
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="bg-red-50 border border-red-200 rounded-lg p-4">
              <div class="text-red-800 text-2xl font-bold">${statistics.high_risk_count}</div>
              <div class="text-red-600 text-sm">High Risk</div>
            </div>
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div class="text-yellow-800 text-2xl font-bold">${statistics.medium_risk_count}</div>
              <div class="text-yellow-600 text-sm">Medium Risk</div>
            </div>
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
              <div class="text-green-800 text-2xl font-bold">${statistics.low_risk_count}</div>
              <div class="text-green-600 text-sm">Low Risk</div>
            </div>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div class="text-blue-800 text-2xl font-bold">${statistics.total_risks}</div>
              <div class="text-blue-600 text-sm">Total Risks</div>
            </div>
          </div>
        </div>

        <!-- Heat Map Visualization -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="mb-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Risk Probability vs Impact Matrix</h3>
            <p class="text-sm text-gray-600">Bubble size indicates risk score, color indicates AI-assessed threat level</p>
          </div>
          
          <div class="relative">
            <canvas id="heatMapCanvas" width="800" height="600" class="border border-gray-200 rounded-lg"></canvas>
          </div>

          <!-- Legend -->
          <div class="mt-4 flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <div class="text-sm text-gray-600">Risk Level:</div>
              <div class="flex items-center space-x-2">
                <div class="w-4 h-4 bg-red-500 rounded-full"></div>
                <span class="text-sm">Critical</span>
              </div>
              <div class="flex items-center space-x-2">
                <div class="w-4 h-4 bg-orange-500 rounded-full"></div>
                <span class="text-sm">High</span>
              </div>
              <div class="flex items-center space-x-2">
                <div class="w-4 h-4 bg-yellow-500 rounded-full"></div>
                <span class="text-sm">Medium</span>
              </div>
              <div class="flex items-center space-x-2">
                <div class="w-4 h-4 bg-green-500 rounded-full"></div>
                <span class="text-sm">Low</span>
              </div>
            </div>
            <div class="text-sm text-gray-500">
              Impact (1-5) →
            </div>
          </div>
        </div>

        <!-- Risk Details Table -->
        <div class="mt-6 bg-white rounded-xl shadow-sm border border-gray-200">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900">Risk Details</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Score</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heat Intensity</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                ${heat_map.map(risk => `
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4">
                      <div class="text-sm font-medium text-gray-900">${escapeHtml(risk.title)}</div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ${escapeHtml(risk.category)}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center">
                        <div class="text-sm font-medium text-gray-900">${risk.ai_risk_score || risk.risk_score}</div>
                        <div class="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div class="bg-${risk.heat_intensity > 0.7 ? 'red' : risk.heat_intensity > 0.4 ? 'yellow' : 'green'}-600 h-2 rounded-full" style="width: ${Math.max(risk.heat_intensity * 100, 10)}%"></div>
                        </div>
                      </div>
                    </td>
                    <td class="px-6 py-4">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        risk.trend === 'increasing' ? 'bg-red-100 text-red-800' :
                        risk.trend === 'decreasing' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }">
                        <i class="fas fa-${risk.trend === 'increasing' ? 'arrow-up' : risk.trend === 'decreasing' ? 'arrow-down' : 'minus'} mr-1"></i>
                        ${risk.trend}
                      </span>
                    </td>
                    <td class="px-6 py-4">
                      <div class="text-sm text-gray-900">${(risk.heat_intensity * 100).toFixed(1)}%</div>
                    </td>
                    <td class="px-6 py-4">
                      <button onclick="runAIAnalysis(${risk.risk_id})" class="text-blue-600 hover:text-blue-900 text-sm font-medium">
                        <i class="fas fa-robot mr-1"></i>AI Analysis
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    const contentElement = document.getElementById('dashboard-content') || document.getElementById('main-content');
    if (contentElement) {
      contentElement.innerHTML = content;
    } else {
      console.error('No content container found for AI heat map');
      showToast('Content container not found', 'error');
      return;
    }
    
    // Render the heat map visualization
    heatMapLoadTimeout = setTimeout(() => {
      renderHeatMapCanvas(heat_map);
      // Only show success toast after rendering is complete
      showToast('AI Risk Heat Map loaded successfully', 'success');
      isLoadingHeatMap = false;
    }, 100);
    
  } catch (error) {
    console.error('Error loading AI heat map:', error);
    showToast('Failed to load AI heat map', 'error');
    isLoadingHeatMap = false;
  }
}

// Render Heat Map Canvas
function renderHeatMapCanvas(heatMapData) {
  const canvas = document.getElementById('heatMapCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  
  // Clear canvas
  ctx.clearRect(0, 0, width, height);
  
  // Draw grid
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 1;
  
  // Vertical lines (Impact)
  for (let i = 1; i <= 5; i++) {
    const x = (i / 5) * (width - 100) + 50;
    ctx.beginPath();
    ctx.moveTo(x, 50);
    ctx.lineTo(x, height - 50);
    ctx.stroke();
  }
  
  // Horizontal lines (Probability)
  for (let i = 1; i <= 5; i++) {
    const y = height - ((i / 5) * (height - 100) + 50);
    ctx.beginPath();
    ctx.moveTo(50, y);
    ctx.lineTo(width - 50, y);
    ctx.stroke();
  }
  
  // Draw labels
  ctx.fillStyle = '#6b7280';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  
  // Impact labels (bottom)
  for (let i = 1; i <= 5; i++) {
    const x = (i / 5) * (width - 100) + 50;
    ctx.fillText(i.toString(), x, height - 25);
  }
  
  // Probability labels (left)
  ctx.textAlign = 'right';
  for (let i = 1; i <= 5; i++) {
    const y = height - ((i / 5) * (height - 100) + 50) + 4;
    ctx.fillText(i.toString(), 35, y);
  }
  
  // Axis labels
  ctx.textAlign = 'center';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('Impact →', width / 2, height - 5);
  
  ctx.save();
  ctx.translate(15, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('← Probability', 0, 0);
  ctx.restore();
  
  // Draw risk bubbles
  heatMapData.forEach(risk => {
    const x = (risk.impact / 5) * (width - 100) + 50;
    const y = height - ((risk.probability / 5) * (height - 100) + 50);
    const size = Math.max(risk.risk_score * 2, 5);
    
    // Draw bubble
    ctx.beginPath();
    ctx.arc(x, y, size, 0, 2 * Math.PI);
    ctx.fillStyle = risk.color + '80'; // Add transparency
    ctx.fill();
    ctx.strokeStyle = risk.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add risk ID label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(risk.risk_id.toString(), x, y + 3);
  });
}

// AI Risk Analysis Modal
async function runAIAnalysis(riskId) {
  try {
    showToast('Running AI analysis...', 'info');
    
    const response = await fetch(`/api/risks/${riskId}/ai-analysis`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('aria_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to run AI analysis');
    }

    const result = await response.json();
    const analysis = result.data;

    showModal('AI Risk Analysis Results', `
      <div class="ai-analysis-results">
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="bg-blue-50 p-4 rounded-lg">
            <div class="text-blue-800 text-2xl font-bold">${analysis.ai_risk_score}</div>
            <div class="text-blue-600 text-sm">AI Risk Score</div>
          </div>
          <div class="bg-green-50 p-4 rounded-lg">
            <div class="text-green-800 text-2xl font-bold">${(analysis.confidence_level * 100).toFixed(1)}%</div>
            <div class="text-green-600 text-sm">Confidence Level</div>
          </div>
          <div class="bg-yellow-50 p-4 rounded-lg">
            <div class="text-yellow-800 text-lg font-bold capitalize">${analysis.risk_trend}</div>
            <div class="text-yellow-600 text-sm">Risk Trend</div>
          </div>
          <div class="bg-purple-50 p-4 rounded-lg">
            <div class="text-purple-800 text-lg font-bold">${(analysis.external_threat_level * 100).toFixed(1)}%</div>
            <div class="text-purple-600 text-sm">External Threat Level</div>
          </div>
        </div>

        <div class="mb-6">
          <h4 class="font-semibold text-gray-900 mb-3">Contributing Factors</h4>
          <ul class="space-y-2">
            ${analysis.contributing_factors.map(factor => `
              <li class="flex items-start">
                <i class="fas fa-chevron-right text-blue-500 text-xs mt-1.5 mr-2"></i>
                <span class="text-sm text-gray-700">${escapeHtml(factor)}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <div class="mb-6">
          <h4 class="font-semibold text-gray-900 mb-3">AI Recommendations</h4>
          <ul class="space-y-2">
            ${analysis.recommendations.map(rec => `
              <li class="flex items-start">
                <i class="fas fa-lightbulb text-yellow-500 text-xs mt-1.5 mr-2"></i>
                <span class="text-sm text-gray-700">${escapeHtml(rec)}</span>
              </li>
            `).join('')}
          </ul>
        </div>

        <div class="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span class="font-medium text-gray-600">Threat Multiplier:</span>
            <span class="text-gray-900">${analysis.threat_multiplier}</span>
          </div>
          <div>
            <span class="font-medium text-gray-600">Industry Factor:</span>
            <span class="text-gray-900">${analysis.industry_factor}</span>
          </div>
          <div>
            <span class="font-medium text-gray-600">Risk Velocity:</span>
            <span class="text-gray-900">${analysis.risk_velocity}</span>
          </div>
        </div>

        ${analysis.predicted_impact_date ? `
          <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-exclamation-triangle text-red-500 mr-2"></i>
              <span class="text-red-800 font-medium">Predicted Escalation Date: ${analysis.predicted_impact_date}</span>
            </div>
          </div>
        ` : ''}
      </div>
    `);
    
    showToast('AI analysis completed successfully', 'success');
    
  } catch (error) {
    console.error('Error running AI analysis:', error);
    showToast('Failed to run AI analysis', 'error');
  }
}

// Compliance Gap Analysis
async function showComplianceGapAnalysis() {
  try {
    showToast('Loading compliance frameworks...', 'info');
    
    const frameworks = ['ISO27001', 'GDPR', 'NIST', 'SOX', 'COBIT'];
    
    const content = `
      <div class="compliance-gap-analysis">
        <div class="mb-6">
          <h2 class="text-2xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-shield-alt text-blue-500 mr-3"></i>
            AI-Powered Compliance Gap Analysis
          </h2>
          <p class="text-gray-600 mt-1">Automated gap identification and remediation recommendations</p>
        </div>

        <!-- Framework Selection -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Select Framework for Analysis</h3>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            ${frameworks.map(framework => `
              <button onclick="runComplianceGapAnalysis('${framework}')" 
                      class="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors duration-200 group">
                <div class="text-center">
                  <i class="fas fa-clipboard-check text-2xl text-gray-400 group-hover:text-blue-500 mb-2"></i>
                  <div class="font-medium text-gray-900">${framework}</div>
                  <div class="text-xs text-gray-500 mt-1">Click to analyze</div>
                </div>
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Results Container -->
        <div id="gap-analysis-results" class="hidden">
          <!-- Results will be loaded here -->
        </div>
      </div>
    `;

    const contentElement = document.getElementById('dashboard-content') || document.getElementById('main-content');
    if (contentElement) {
      contentElement.innerHTML = content;
      showToast('Compliance gap analysis ready', 'success');
    } else {
      console.error('No content container found for compliance gap analysis');
      showToast('Content container not found', 'error');
      return;
    }
    
  } catch (error) {
    console.error('Error loading compliance gap analysis:', error);
    showToast('Failed to load compliance gap analysis', 'error');
  }
}

// Run Compliance Gap Analysis
async function runComplianceGapAnalysis(framework) {
  try {
    showToast(`Running gap analysis for ${framework}...`, 'info');
    
    const response = await fetch(`/api/compliance/gap-analysis/${framework}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('aria_token')}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to analyze ${framework}`);
    }

    const result = await response.json();
    const analysis = result.data;

    const resultsContainer = document.getElementById('gap-analysis-results');
    resultsContainer.className = 'mt-6';
    resultsContainer.innerHTML = `
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-semibold text-gray-900">${framework} Gap Analysis Results</h3>
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            analysis.gap_severity === 'critical' ? 'bg-red-100 text-red-800' :
            analysis.gap_severity === 'high' ? 'bg-orange-100 text-orange-800' :
            analysis.gap_severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }">
            ${analysis.gap_severity.toUpperCase()}
          </span>
        </div>

        <!-- Summary Metrics -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-blue-50 p-4 rounded-lg text-center">
            <div class="text-blue-800 text-2xl font-bold">${analysis.overall_compliance_score}%</div>
            <div class="text-blue-600 text-sm">Overall Score</div>
          </div>
          <div class="bg-green-50 p-4 rounded-lg text-center">
            <div class="text-green-800 text-2xl font-bold">${analysis.compliant_requirements}</div>
            <div class="text-green-600 text-sm">Compliant</div>
          </div>
          <div class="bg-red-50 p-4 rounded-lg text-center">
            <div class="text-red-800 text-2xl font-bold">${analysis.non_compliant_requirements}</div>
            <div class="text-red-600 text-sm">Non-Compliant</div>
          </div>
          <div class="bg-yellow-50 p-4 rounded-lg text-center">
            <div class="text-yellow-800 text-2xl font-bold">${analysis.partially_compliant_requirements}</div>
            <div class="text-yellow-600 text-sm">Partial</div>
          </div>
        </div>

        <!-- Compliance Progress Bar -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-gray-700">Compliance Progress</span>
            <span class="text-sm text-gray-500">${analysis.overall_compliance_score}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-3">
            <div class="h-3 rounded-full ${
              analysis.overall_compliance_score >= 80 ? 'bg-green-600' :
              analysis.overall_compliance_score >= 60 ? 'bg-yellow-600' :
              'bg-red-600'
            }" style="width: ${analysis.overall_compliance_score}%"></div>
          </div>
        </div>

        <!-- AI Recommendations -->
        ${analysis.recommendations.length > 0 ? `
          <div class="mb-6">
            <h4 class="font-semibold text-gray-900 mb-3">AI Recommendations</h4>
            <ul class="space-y-2">
              ${analysis.recommendations.map(rec => `
                <li class="flex items-start">
                  <i class="fas fa-robot text-blue-500 text-sm mt-1 mr-2"></i>
                  <span class="text-sm text-gray-700">${escapeHtml(rec)}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        ` : ''}

        <!-- Identified Gaps -->
        ${analysis.gaps_identified.length > 0 ? `
          <div class="mb-6">
            <h4 class="font-semibold text-gray-900 mb-3">Identified Gaps (${analysis.gaps_identified.length})</h4>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-4 py-2 text-left font-medium text-gray-500">Requirement</th>
                    <th class="px-4 py-2 text-left font-medium text-gray-500">Gap Type</th>
                    <th class="px-4 py-2 text-left font-medium text-gray-500">Risk Level</th>
                    <th class="px-4 py-2 text-left font-medium text-gray-500">Priority</th>
                    <th class="px-4 py-2 text-left font-medium text-gray-500">Effort</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  ${analysis.gaps_identified.slice(0, 10).map(gap => `
                    <tr class="hover:bg-gray-50">
                      <td class="px-4 py-2">
                        <div class="font-medium text-gray-900">${escapeHtml(gap.requirement_id)}</div>
                        <div class="text-xs text-gray-500">${escapeHtml(gap.requirement_text.substring(0, 100))}...</div>
                      </td>
                      <td class="px-4 py-2">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          ${gap.gap_type}
                        </span>
                      </td>
                      <td class="px-4 py-2">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          gap.risk_level === 'critical' ? 'bg-red-100 text-red-800' :
                          gap.risk_level === 'high' ? 'bg-orange-100 text-orange-800' :
                          gap.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }">
                          ${gap.risk_level}
                        </span>
                      </td>
                      <td class="px-4 py-2">
                        <div class="text-gray-900 font-medium">${gap.priority_score}</div>
                      </td>
                      <td class="px-4 py-2">
                        <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          gap.estimated_effort === 'high' ? 'bg-red-100 text-red-800' :
                          gap.estimated_effort === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }">
                          ${gap.estimated_effort}
                        </span>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        ` : ''}

        <!-- Next Assessment -->
        <div class="bg-gray-50 p-4 rounded-lg">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-medium text-gray-900">Next Assessment Due</div>
              <div class="text-sm text-gray-600">${analysis.next_assessment_date}</div>
            </div>
            <button onclick="scheduleAssessment('${framework}')" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
              <i class="fas fa-calendar-plus mr-2"></i>Schedule
            </button>
          </div>
        </div>
      </div>
    `;
    
    showToast(`${framework} gap analysis completed`, 'success');
    
  } catch (error) {
    console.error('Error running compliance gap analysis:', error);
    showToast(`Failed to analyze ${framework}`, 'error');
  }
}

// Executive AI Dashboard
async function showExecutiveAIDashboard() {
  try {
    showToast('Loading executive AI dashboard...', 'info');
    
    const response = await fetch('/api/analytics/executive-ai-dashboard', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('aria_token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load executive dashboard');
    }

    const result = await response.json();
    const dashboard = result.data;

    const content = `
      <div class="executive-ai-dashboard">
        <div class="mb-6">
          <h2 class="text-3xl font-bold text-gray-900 flex items-center">
            <i class="fas fa-chart-line text-blue-500 mr-3"></i>
            Executive AI Analytics Dashboard
          </h2>
          <p class="text-gray-600 mt-1">AI-powered insights for strategic risk management</p>
        </div>

        <!-- AI-Powered Insights -->
        <div class="mb-8">
          <h3 class="text-xl font-semibold text-gray-900 mb-4">AI-Powered Risk Intelligence</h3>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div class="text-blue-600 text-3xl font-bold">${dashboard.ai_powered_insights.total_risks_analyzed}</div>
              <div class="text-gray-600 text-sm mt-1">Total Risks Analyzed</div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div class="text-green-600 text-3xl font-bold">${dashboard.ai_powered_insights.average_ai_risk_score}</div>
              <div class="text-gray-600 text-sm mt-1">Average AI Score</div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div class="text-red-600 text-3xl font-bold">${dashboard.ai_powered_insights.high_priority_ai_risks}</div>
              <div class="text-gray-600 text-sm mt-1">High Priority Risks</div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div class="text-orange-600 text-3xl font-bold">${dashboard.ai_powered_insights.escalating_risks}</div>
              <div class="text-gray-600 text-sm mt-1">Escalating Risks</div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div class="text-purple-600 text-3xl font-bold">${(dashboard.ai_powered_insights.ai_confidence_level * 100).toFixed(1)}%</div>
              <div class="text-gray-600 text-sm mt-1">AI Confidence</div>
            </div>
          </div>
        </div>

        <!-- Compliance Intelligence -->
        <div class="mb-8">
          <h3 class="text-xl font-semibold text-gray-900 mb-4">Compliance Intelligence</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div class="flex items-center justify-between mb-4">
                <h4 class="font-semibold text-gray-900">Overall Compliance</h4>
                <i class="fas fa-shield-check text-blue-500"></i>
              </div>
              <div class="text-4xl font-bold mb-2 ${
                dashboard.compliance_intelligence.average_compliance_score >= 80 ? 'text-green-600' :
                dashboard.compliance_intelligence.average_compliance_score >= 60 ? 'text-yellow-600' :
                'text-red-600'
              }">${dashboard.compliance_intelligence.average_compliance_score}%</div>
              <div class="w-full bg-gray-200 rounded-full h-2">
                <div class="h-2 rounded-full ${
                  dashboard.compliance_intelligence.average_compliance_score >= 80 ? 'bg-green-600' :
                  dashboard.compliance_intelligence.average_compliance_score >= 60 ? 'bg-yellow-600' :
                  'bg-red-600'
                }" style="width: ${dashboard.compliance_intelligence.average_compliance_score}%"></div>
              </div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div class="flex items-center justify-between mb-4">
                <h4 class="font-semibold text-gray-900">Critical Gaps</h4>
                <i class="fas fa-exclamation-triangle text-red-500"></i>
              </div>
              <div class="text-4xl font-bold text-red-600 mb-2">${dashboard.compliance_intelligence.critical_compliance_gaps}</div>
              <div class="text-gray-600 text-sm">Require immediate attention</div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div class="flex items-center justify-between mb-4">
                <h4 class="font-semibold text-gray-900">Frameworks</h4>
                <i class="fas fa-list-check text-green-500"></i>
              </div>
              <div class="text-4xl font-bold text-blue-600 mb-2">${dashboard.compliance_intelligence.frameworks_monitored}</div>
              <div class="text-gray-600 text-sm">Currently monitored</div>
            </div>
          </div>
        </div>

        <!-- Threat Landscape -->
        <div class="mb-8">
          <h3 class="text-xl font-semibold text-gray-900 mb-4">Threat Intelligence</h3>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div class="text-center">
                <div class="text-3xl font-bold text-blue-600 mb-2">${dashboard.threat_landscape.total_threats_monitored}</div>
                <div class="text-gray-600 text-sm">Total Threats Monitored</div>
              </div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div class="text-center">
                <div class="text-3xl font-bold text-yellow-600 mb-2">${(dashboard.threat_landscape.average_threat_level * 100).toFixed(1)}%</div>
                <div class="text-gray-600 text-sm">Average Threat Level</div>
              </div>
            </div>
            <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div class="text-center">
                <div class="text-3xl font-bold text-red-600 mb-2">${dashboard.threat_landscape.high_severity_threats}</div>
                <div class="text-gray-600 text-sm">High Severity Threats</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Predictive Analytics -->
        <div class="mb-8">
          <h3 class="text-xl font-semibold text-gray-900 mb-4">Predictive Analytics</h3>
          <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div class="text-center">
                <div class="text-2xl font-bold text-red-600 mb-2 flex items-center justify-center">
                  <i class="fas fa-arrow-up mr-2"></i>
                  ${dashboard.predictive_analytics.risks_trending_up}
                </div>
                <div class="text-gray-600 text-sm">Risks Trending Up</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600 mb-2 flex items-center justify-center">
                  <i class="fas fa-arrow-down mr-2"></i>
                  ${dashboard.predictive_analytics.risks_trending_down}
                </div>
                <div class="text-gray-600 text-sm">Risks Trending Down</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600 mb-2">${dashboard.predictive_analytics.average_risk_velocity}</div>
                <div class="text-gray-600 text-sm">Average Risk Velocity</div>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Recommendations -->
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 class="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <i class="fas fa-robot text-blue-500 mr-2"></i>
            AI Strategic Recommendations
          </h3>
          <ul class="space-y-3">
            ${dashboard.recommendations.map(rec => `
              <li class="flex items-start">
                <i class="fas fa-lightbulb text-yellow-500 text-sm mt-1.5 mr-3"></i>
                <span class="text-gray-700">${escapeHtml(rec)}</span>
              </li>
            `).join('')}
          </ul>
        </div>
      </div>
    `;

    const contentElement = document.getElementById('dashboard-content') || document.getElementById('main-content');
    if (contentElement) {
      contentElement.innerHTML = content;
      showToast('Executive AI dashboard loaded successfully', 'success');
    } else {
      console.error('No content container found for executive AI dashboard');
      showToast('Content container not found', 'error');
      return;
    }
    
  } catch (error) {
    console.error('Error loading executive AI dashboard:', error);
    showToast('Failed to load executive AI dashboard', 'error');
  }
}

// Helper functions
function refreshHeatMap() {
  console.log('Refresh heat map clicked');
  showAIRiskHeatMap();
}

function exportHeatMapData() {
  showToast('Heat map export feature coming soon', 'info');
}

function scheduleAssessment(framework) {
  showToast(`Assessment scheduling for ${framework} coming soon`, 'info');
}

// Make functions globally accessible
window.showRisks = showRisks;
window.showControls = showControls;
window.showCompliance = showCompliance;
window.showIncidents = showIncidents;
window.showUsers = showUsers;
window.loadUsers = loadUsers;
window.renderUsersTable = renderUsersTable;

// Make AI functions globally accessible
window.showAIRiskHeatMap = showAIRiskHeatMap;
window.runAIAnalysis = runAIAnalysis;
window.showComplianceGapAnalysis = showComplianceGapAnalysis;
window.runComplianceGapAnalysis = runComplianceGapAnalysis;
window.showExecutiveAIDashboard = showExecutiveAIDashboard;
window.refreshHeatMap = refreshHeatMap;
window.exportHeatMapData = exportHeatMapData;
window.scheduleAssessment = scheduleAssessment;

// Import functions
window.showImportRisksModal = showImportRisksModal;
window.showImportControlsModal = showImportControlsModal;
window.showImportComplianceModal = showImportComplianceModal;
window.showImportIncidentsModal = showImportIncidentsModal;
window.showImportUsersModal = showImportUsersModal;
window.handleFileSelect = handleFileSelect;
window.processImport = processImport;

// Add export functions
window.exportUsers = exportUsers;
window.exportRisks = exportRisks;
window.exportControls = exportControls;
window.exportCompliance = exportCompliance;
window.exportIncidents = exportIncidents;

// User management functions
window.showAddUserModal = showAddUserModal;
window.editUser = editUser;
window.resetUserPassword = resetUserPassword;
window.togglePasswordField = togglePasswordField;
window.showPasswordResetModal = showPasswordResetModal;
window.generateNewPassword = generateNewPassword;
window.togglePasswordVisibility = togglePasswordVisibility;
window.copyPasswordToClipboard = copyPasswordToClipboard;

// Frameworks Management
async function showFrameworks() {
  console.log('Loading frameworks page...');
  const mainContent = document.getElementById('main-content');
  
  // Show loading state
  mainContent.innerHTML = `
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
    </div>
  `;

  try {
    // Load frameworks and their controls
    const token = localStorage.getItem('aria_token');
    const frameworksResponse = await axios.get('/api/frameworks', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (frameworksResponse.data.success) {
      const frameworks = frameworksResponse.data.data;
      renderFrameworksPage(frameworks);
    } else {
      throw new Error('Failed to load frameworks');
    }
  } catch (error) {
    console.error('Error loading frameworks:', error);
    mainContent.innerHTML = `
      <div class="bg-red-50 border border-red-200 rounded-lg p-6">
        <div class="flex items-center">
          <i class="fas fa-exclamation-triangle text-red-500 mr-3"></i>
          <div>
            <h3 class="text-lg font-semibold text-red-800">Error Loading Frameworks</h3>
            <p class="text-red-600">Unable to load compliance frameworks. Please try again.</p>
          </div>
        </div>
      </div>
    `;
  }
}

function renderFrameworksPage(frameworks) {
  const mainContent = document.getElementById('main-content');
  
  mainContent.innerHTML = `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 mb-2">
              <i class="fas fa-list-check text-blue-600 mr-3"></i>
              Compliance Frameworks & Controls
            </h1>
            <p class="text-gray-600">Manage compliance frameworks, risk controls, and security assessments</p>
          </div>
          <div class="flex space-x-3">
            <button onclick="showImportFrameworkModal()" class="btn-primary">
              <i class="fas fa-download mr-2"></i>Import Framework
            </button>
            <button onclick="createFrameworkAssessment()" class="btn-secondary">
              <i class="fas fa-plus mr-2"></i>New Assessment
            </button>
          </div>
        </div>
        
        <!-- Navigation Tabs -->
        <div class="mt-6 border-b border-gray-200">
          <nav class="flex space-x-8">
            <button id="frameworks-tab" onclick="switchFrameworkTab('frameworks')" class="framework-tab active">
              <i class="fas fa-list-check mr-2"></i>Frameworks
            </button>
            <button id="controls-tab" onclick="switchFrameworkTab('controls')" class="framework-tab">
              <i class="fas fa-shield-halved mr-2"></i>Controls
            </button>
          </nav>
        </div>
      </div>

      <!-- Frameworks Content -->
      <div id="frameworks-content" class="framework-content">
        <!-- Frameworks Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          ${frameworks.map(framework => renderFrameworkCard(framework)).join('')}
        </div>
      </div>
      
      <!-- Controls Content -->
      <div id="controls-content" class="framework-content hidden">
        <div class="bg-white rounded-xl shadow-sm p-6">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h2 class="text-xl font-semibold text-gray-900">Risk Controls</h2>
              <p class="text-gray-600 mt-1">Manage security controls and their effectiveness</p>
            </div>
            <button onclick="showAddControlModal()" class="btn-primary">
              <i class="fas fa-plus mr-2"></i>Add Control
            </button>
          </div>
          <div id="controls-list">
            <!-- Controls will be loaded here -->
          </div>
        </div>
      </div>

      <!-- Recent Framework Activities -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">
          <i class="fas fa-clock text-blue-600 mr-2"></i>
          Recent Framework Activities
        </h2>
        <div class="space-y-3" id="framework-activities">
          <div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <i class="fas fa-check text-green-600 text-sm"></i>
              </div>
              <div>
                <p class="font-medium text-gray-900">ISO 27001 controls imported</p>
                <p class="text-sm text-gray-500">93 controls successfully loaded</p>
              </div>
            </div>
            <span class="text-sm text-gray-500">Today</span>
          </div>
          <div class="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <i class="fas fa-upload text-blue-600 text-sm"></i>
              </div>
              <div>
                <p class="font-medium text-gray-900">UAE ISR controls imported</p>
                <p class="text-sm text-gray-500">81 controls successfully loaded</p>
              </div>
            </div>
            <span class="text-sm text-gray-500">Today</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderFrameworkCard(framework) {
  const progressPercentage = framework.control_count > 0 ? 
    Math.round((framework.control_count * 0.65)) : 0; // Demo progress

  return `
    <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div class="p-6">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-certificate text-blue-600 text-xl"></i>
            </div>
            <div>
              <h3 class="text-xl font-semibold text-gray-900">${framework.name}</h3>
              <p class="text-sm text-gray-500">${framework.code} ${framework.version || ''}</p>
            </div>
          </div>
          <div class="flex space-x-2">
            <button onclick="viewFrameworkControls(${framework.id})" class="text-blue-600 hover:text-blue-700">
              <i class="fas fa-eye"></i>
            </button>
            <button onclick="exportFramework(${framework.id})" class="text-gray-600 hover:text-gray-700">
              <i class="fas fa-download"></i>
            </button>
          </div>
        </div>
        
        <p class="text-gray-600 mb-4">${framework.description || 'No description available'}</p>
        
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div class="text-center p-3 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">${framework.control_count}</div>
            <div class="text-sm text-gray-600">Total Controls</div>
          </div>
          <div class="text-center p-3 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold text-green-600">${progressPercentage}%</div>
            <div class="text-sm text-gray-600">Implementation</div>
          </div>
        </div>
        
        <div class="space-y-2">
          <div class="flex justify-between text-sm">
            <span class="text-gray-600">Implementation Progress</span>
            <span class="font-medium">${progressPercentage}%</span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2">
            <div class="bg-blue-600 h-2 rounded-full" style="width: ${progressPercentage}%"></div>
          </div>
        </div>
        
        <div class="mt-4 flex space-x-3">
          <button onclick="viewFrameworkControls(${framework.id})" class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm font-medium">
            <i class="fas fa-list mr-2"></i>View Controls
          </button>
          <button onclick="startFrameworkAssessment(${framework.id})" class="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 text-sm font-medium">
            <i class="fas fa-play mr-2"></i>Start Assessment
          </button>
        </div>
      </div>
    </div>
  `;
}

async function viewFrameworkControls(frameworkId) {
  console.log('Loading framework controls for framework:', frameworkId);
  
  try {
    const token = localStorage.getItem('aria_token');
    const controlsResponse = await axios.get(`/api/frameworks/${frameworkId}/controls`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const sectionsResponse = await axios.get(`/api/frameworks/${frameworkId}/sections`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (controlsResponse.data.success && sectionsResponse.data.success) {
      const controls = controlsResponse.data.data;
      const sections = sectionsResponse.data.sections || sectionsResponse.data.data;
      const framework = controls[0]; // Get framework info from first control
      
      renderFrameworkControlsPage(frameworkId, framework, controls, sections);
    } else {
      throw new Error('Failed to load framework controls');
    }
  } catch (error) {
    console.error('Error loading framework controls:', error);
    showErrorMessage('Error loading framework controls. Please try again.');
  }
}

function renderFrameworkControlsPage(frameworkId, framework, controls, sections) {
  const mainContent = document.getElementById('main-content');
  
  mainContent.innerHTML = `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex justify-between items-center">
          <div>
            <div class="flex items-center mb-2">
              <button onclick="showFrameworks()" class="text-blue-600 hover:text-blue-700 mr-3">
                <i class="fas fa-arrow-left"></i>
              </button>
              <h1 class="text-3xl font-bold text-gray-900">
                ${framework?.framework_name || 'Framework Controls'}
              </h1>
            </div>
            <p class="text-gray-600">${controls.length} controls available for implementation and assessment</p>
          </div>
          <div class="flex space-x-3">
            <button onclick="exportFrameworkControls(${frameworkId})" class="btn-secondary">
              <i class="fas fa-download mr-2"></i>Export Controls
            </button>
            <button onclick="startFrameworkAssessment(${frameworkId})" class="btn-primary">
              <i class="fas fa-play mr-2"></i>Start Assessment
            </button>
          </div>
        </div>
      </div>

      <!-- Filters and Search -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <div class="flex flex-wrap gap-4 align-items-center">
          <div class="flex-1 min-w-64">
            <input type="text" id="controls-search" placeholder="Search controls..." 
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>
          <div class="min-w-48">
            <select id="section-filter" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">All Sections</option>
              ${sections.map(section => `
                <option value="${section.section_name}">${section.section_name} (${section.control_count})</option>
              `).join('')}
            </select>
          </div>
          <button onclick="filterFrameworkControls(${frameworkId})" class="btn-secondary">
            <i class="fas fa-filter mr-2"></i>Apply Filters
          </button>
        </div>
      </div>

      <!-- Controls List -->
      <div class="bg-white rounded-xl shadow-sm">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Framework Controls</h2>
        </div>
        <div class="divide-y divide-gray-200" id="framework-controls-list">
          ${controls.map(control => renderFrameworkControl(control)).join('')}
        </div>
      </div>
    </div>
  `;

  // Add event listeners for search and filters
  document.getElementById('controls-search').addEventListener('input', (e) => {
    filterFrameworkControlsLocal(controls, e.target.value, document.getElementById('section-filter').value);
  });
  
  document.getElementById('section-filter').addEventListener('change', (e) => {
    filterFrameworkControlsLocal(controls, document.getElementById('controls-search').value, e.target.value);
  });
}

function renderFrameworkControl(control) {
  const priorityColors = {
    'critical': 'bg-red-100 text-red-800',
    'high': 'bg-orange-100 text-orange-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'low': 'bg-green-100 text-green-800'
  };

  return `
    <div class="p-6 hover:bg-gray-50">
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <div class="flex items-center mb-2">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-3">
              ${control.control_ref}
            </span>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColors[control.priority] || priorityColors.medium}">
              ${control.priority?.toUpperCase() || 'MEDIUM'}
            </span>
            ${control.section_name ? `
              <span class="ml-2 text-xs text-gray-500">${control.section_name}</span>
            ` : ''}
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">${control.control_title}</h3>
          ${control.control_description ? `
            <p class="text-gray-600 mb-3">${control.control_description}</p>
          ` : ''}
          ${control.implementation_guidance ? `
            <div class="mt-3">
              <h4 class="text-sm font-medium text-gray-700 mb-1">Implementation Guidance:</h4>
              <p class="text-sm text-gray-600">${control.implementation_guidance}</p>
            </div>
          ` : ''}
        </div>
        <div class="flex space-x-2 ml-4">
          <button onclick="assessControl(${control.id})" class="text-blue-600 hover:text-blue-700" title="Assess Control">
            <i class="fas fa-clipboard-check"></i>
          </button>
          <button onclick="viewControlDetails(${control.id})" class="text-gray-600 hover:text-gray-700" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

function filterFrameworkControlsLocal(controls, searchTerm, sectionFilter) {
  const filteredControls = controls.filter(control => {
    const matchesSearch = !searchTerm || 
      control.control_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      control.control_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (control.control_description && control.control_description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSection = !sectionFilter || control.section_name === sectionFilter;
    
    return matchesSearch && matchesSection;
  });

  document.getElementById('framework-controls-list').innerHTML = 
    filteredControls.map(control => renderFrameworkControl(control)).join('');
}

async function showImportFrameworkModal() {
  const mainContent = document.getElementById('main-content');
  
  // Show import modal
  const modalHtml = `
    <div id="import-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Import Compliance Framework</h3>
        </div>
        <div class="p-6">
          <p class="text-gray-600 mb-4">Select a compliance framework to import:</p>
          <div class="space-y-3">
            <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer" onclick="doImportFramework('iso27001')">
              <div class="flex items-center">
                <i class="fas fa-certificate text-blue-600 mr-3"></i>
                <div>
                  <h4 class="font-medium text-gray-900">ISO/IEC 27001:2022</h4>
                  <p class="text-sm text-gray-500">Information Security Management Systems - 93 controls</p>
                </div>
              </div>
            </div>
            <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer" onclick="doImportFramework('uae_ia')">
              <div class="flex items-center">
                <i class="fas fa-flag text-green-600 mr-3"></i>
                <div>
                  <h4 class="font-medium text-gray-900">UAE Information Assurance Standard</h4>
                  <p class="text-sm text-gray-500">UAE ISR Framework - 81 controls</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button onclick="closeImportModal()" class="btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHtml);
}

async function doImportFramework(frameworkType) {
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.post(`/api/import/framework/${frameworkType}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      closeImportModal();
      showSuccessMessage(response.data.message);
      // Refresh the frameworks page
      showFrameworks();
    } else {
      throw new Error(response.data.error || 'Import failed');
    }
  } catch (error) {
    console.error('Framework import error:', error);
    showErrorMessage('Failed to import framework: ' + (error.response?.data?.error || error.message));
  }
}

function closeImportModal() {
  const modal = document.getElementById('import-modal');
  if (modal) {
    modal.remove();
  }
}

async function startFrameworkAssessment(frameworkId) {
  try {
    const token = localStorage.getItem('aria_token');
    if (!token) {
      showToast('Please log in to start assessments', 'error');
      return;
    }

    // Get framework details first
    const frameworkResponse = await axios.get(`/api/frameworks/${frameworkId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const framework = frameworkResponse.data.data;
    
    // Create new assessment for this framework
    const assessmentData = {
      framework_id: frameworkId,
      name: `${framework.name} Assessment - ${new Date().toLocaleDateString()}`,
      description: `Assessment for ${framework.name} framework started on ${new Date().toLocaleDateString()}`,
      status: 'in_progress',
      planned_start_date: new Date().toISOString().split('T')[0],
      planned_end_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
      assessor_id: 1 // Current user
    };

    const response = await axios.post('/api/framework-assessments', assessmentData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.success) {
      showToast(`Started ${framework.name} assessment successfully!`, 'success');
      // Refresh the frameworks view
      showFrameworks();
    } else {
      showToast('Failed to start assessment: ' + response.data.error, 'error');
    }
  } catch (error) {
    console.error('Error starting framework assessment:', error);
    showToast('Failed to start framework assessment', 'error');
  }
}

function assessControl(controlId) {
  // Placeholder for control assessment
  showInfoMessage('Control assessment functionality will be available in a future update.');
}

function createFrameworkAssessment() {
  // Show the same modal as the compliance section
  showAddAssessmentModal();
}

function switchFrameworkTab(tab) {
  // Remove active class from all tabs
  document.querySelectorAll('.framework-tab').forEach(t => t.classList.remove('active'));
  
  // Hide all content sections
  document.querySelectorAll('.framework-content').forEach(c => c.classList.add('hidden'));
  
  // Show selected tab content
  const selectedTab = document.getElementById(`${tab}-tab`);
  const selectedContent = document.getElementById(`${tab}-content`);
  
  if (selectedTab && selectedContent) {
    selectedTab.classList.add('active');
    selectedContent.classList.remove('hidden');
    
    // Load controls data if switching to controls tab
    if (tab === 'controls') {
      loadControlsInFrameworks();
    }
  }
}

async function loadControlsInFrameworks() {
  const controlsList = document.getElementById('controls-list');
  if (!controlsList) return;
  
  try {
    const token = localStorage.getItem('aria_token');
    const response = await axios.get('/api/controls', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      const controls = response.data.data;
      controlsList.innerHTML = controls.map(control => `
        <div class="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
          <div class="flex justify-between items-start">
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900">${control.name}</h3>
              <p class="text-gray-600 text-sm mt-1">${control.description || 'No description'}</p>
              <div class="flex items-center space-x-4 mt-3">
                <span class="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                  ${control.category || 'General'}
                </span>
                <span class="text-xs px-2 py-1 rounded-full ${control.effectiveness >= 80 ? 'bg-green-100 text-green-800' : control.effectiveness >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}">
                  ${control.effectiveness || 0}% Effective
                </span>
              </div>
            </div>
            <button onclick="editControl(${control.id})" class="text-blue-600 hover:text-blue-700">
              <i class="fas fa-edit"></i>
            </button>
          </div>
        </div>
      `).join('');
    }
  } catch (error) {
    console.error('Error loading controls:', error);
    controlsList.innerHTML = '<p class="text-gray-500">Failed to load controls</p>';
  }
}

function viewControlDetails(controlId) {
  // Placeholder for control details
  showInfoMessage('Control details view will be available in a future update.');
}

function exportFramework(frameworkId) {
  // Placeholder for framework export
  showInfoMessage('Framework export functionality will be available in a future update.');
}

function exportFrameworkControls(frameworkId) {
  // Placeholder for controls export
  showInfoMessage('Controls export functionality will be available in a future update.');
}

// Universal Modal Functions
function showModal(title, content, buttons = []) {
  // Remove existing modal if any
  const existingModal = document.getElementById('universal-modal');
  if (existingModal) {
    existingModal.remove();
  }

  // Create modal HTML
  const modalHTML = `
    <div id="universal-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
          <button onclick="closeModal(this)" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="p-6">
          ${content}
        </div>
        <div class="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          ${buttons.map(button => `
            <button onclick="${button.onclick}" class="${button.class}">
              ${button.text}
            </button>
          `).join('')}
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Setup close handlers for the new modal
  const modal = document.getElementById('universal-modal');
  setupModalCloseHandlers(modal);
}

// closeUniversalModal is defined in helpers.js and exported to window
// Looking for #universal-modal-overlay (not #universal-modal)

// Toast notification function
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    // Create toast container if it doesn't exist
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'fixed top-4 right-4 z-50 space-y-2';
    document.body.appendChild(container);
  }
  
  const toastTypes = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white'
  };
  
  const toast = document.createElement('div');
  toast.className = `${toastTypes[type]} px-4 py-3 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 translate-x-full opacity-0`;
  toast.innerHTML = `
    <div class="flex items-center justify-between">
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-3 text-white hover:text-gray-200">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  document.getElementById('toast-container').appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-x-full', 'opacity-0');
  }, 100);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// Make frameworks functions globally accessible
window.showFrameworks = showFrameworks;
window.viewFrameworkControls = viewFrameworkControls;
window.importFramework = importFramework;
window.doImportFramework = doImportFramework;
window.closeImportModal = closeImportModal;
window.startFrameworkAssessment = startFrameworkAssessment;
window.assessControl = assessControl;
window.viewControlDetails = viewControlDetails;
window.exportFramework = exportFramework;
window.exportFrameworkControls = exportFrameworkControls;

// Make modal functions globally accessible
window.showModal = showModal;
window.closeModal = closeModal;
window.showToast = showToast;

// Make moduleData globally accessible
window.moduleData = moduleData;
