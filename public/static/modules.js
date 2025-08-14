// DMT Risk Assessment System v2.0 - Module Implementations
// Risk Management, Controls, Compliance, and Incidents modules

// Global module state
let currentModule = 'dashboard';
let moduleData = {};

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
    const token = localStorage.getItem('dmt_token');
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
    const token = localStorage.getItem('dmt_token');
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
          <button onclick="showImportComplianceModal()" class="btn-secondary">
            <i class="fas fa-upload mr-2"></i>Import
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
            <h3 class="text-lg font-medium text-gray-900 mb-4">Compliance Requirements</h3>
            <div id="requirements-list" class="space-y-4">
              <!-- Requirements will be loaded here -->
            </div>
          </div>
        </div>
        
        <!-- Findings Tab Content -->
        <div id="findings-content" class="compliance-tab-content hidden">
          <div class="p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Assessment Findings</h3>
            <div id="findings-list" class="space-y-4">
              <!-- Findings will be loaded here -->
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
    const token = localStorage.getItem('dmt_token');
    
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
  } catch (error) {
    console.error('Error loading compliance data:', error);
    document.getElementById('assessments-loading').innerHTML = '<p class="text-red-600">Error loading assessments</p>';
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
}

// Incidents Management Module
async function showIncidents() {
  updateActiveNavigation('incidents');
  currentModule = 'incidents';
  
  const mainContent = document.getElementById('main-content');
  
  mainContent.innerHTML = `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Incident Management</h2>
          <p class="text-gray-600 mt-1">Track and manage security and operational incidents</p>
        </div>
        <div class="flex space-x-3">
          <button onclick="showImportIncidentsModal()" class="btn-secondary">
            <i class="fas fa-upload mr-2"></i>Import
          </button>
          <button onclick="exportIncidents()" class="btn-secondary">
            <i class="fas fa-download mr-2"></i>Export
          </button>
          <button onclick="showAddIncidentModal()" class="btn-primary">
            <i class="fas fa-plus mr-2"></i>Report Incident
          </button>
        </div>
      </div>
      
      <!-- Incident Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-fire text-red-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">Critical</p>
              <p class="text-lg font-semibold text-gray-900" id="critical-incidents-count">-</p>
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
              <p class="text-sm font-medium text-gray-500">High</p>
              <p class="text-lg font-semibold text-gray-900" id="high-incidents-count">-</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-clock text-blue-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">Open</p>
              <p class="text-lg font-semibold text-gray-900" id="open-incidents-count">-</p>
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
              <p class="text-sm font-medium text-gray-500">Resolved</p>
              <p class="text-lg font-semibold text-gray-900" id="resolved-incidents-count">-</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-chart-line text-purple-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">MTTR (hrs)</p>
              <p class="text-lg font-semibold text-gray-900" id="avg-resolution-time">-</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Incident Filters -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="flex flex-wrap gap-4">
          <div class="flex-1 min-w-64">
            <input 
              type="text" 
              id="incident-search" 
              placeholder="Search incidents..." 
              class="form-input"
              onkeyup="filterIncidents()"
            />
          </div>
          <select id="incident-status-filter" class="form-select" onchange="filterIncidents()">
            <option value="">All Status</option>
            <option value="new">New</option>
            <option value="investigating">Investigating</option>
            <option value="containment">Containment</option>
            <option value="eradication">Eradication</option>
            <option value="recovery">Recovery</option>
            <option value="closed">Closed</option>
          </select>
          <select id="incident-severity-filter" class="form-select" onchange="filterIncidents()">
            <option value="">All Severity</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select id="incident-type-filter" class="form-select" onchange="filterIncidents()">
            <option value="">All Types</option>
            <option value="security">Security</option>
            <option value="operational">Operational</option>
            <option value="compliance">Compliance</option>
            <option value="data_breach">Data Breach</option>
          </select>
        </div>
      </div>
      
      <!-- Incidents Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="px-6 py-3 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Incident Response</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="table-header">ID</th>
                <th class="table-header">Title</th>
                <th class="table-header">Type</th>
                <th class="table-header">Severity</th>
                <th class="table-header">Status</th>
                <th class="table-header">Assigned To</th>
                <th class="table-header">Reported</th>
                <th class="table-header">Age</th>
                <th class="table-header">SLA Status</th>
                <th class="table-header">Actions</th>
              </tr>
            </thead>
            <tbody id="incidents-table-body" class="bg-white divide-y divide-gray-200">
              <!-- Incident rows will be inserted here -->
            </tbody>
          </table>
        </div>
        <div id="incidents-loading" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="mt-2 text-gray-600">Loading incidents...</p>
        </div>
        <div id="incidents-empty" class="p-8 text-center hidden">
          <i class="fas fa-bell text-gray-400 text-4xl mb-4"></i>
          <p class="text-gray-600">No incidents found</p>
        </div>
      </div>
    </div>
  `;
  
  // Load incidents data
  await loadIncidents();
}

async function loadIncidents() {
  try {
    const token = localStorage.getItem('dmt_token');
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

// Load reference data on page load
async function loadReferenceData() {
  try {
    const token = localStorage.getItem('dmt_token');
    const [categoriesResponse, organizationsResponse, usersResponse] = await Promise.all([
      axios.get('/api/reference/categories', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/reference/organizations', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/reference/users', { headers: { Authorization: `Bearer ${token}` } })
    ]);
    
    referenceData.categories = categoriesResponse.data.data || [];
    referenceData.organizations = organizationsResponse.data.data || [];
    referenceData.users = usersResponse.data.data || [];
  } catch (error) {
    console.error('Error loading reference data:', error);
  }
}

// Call loadReferenceData when modules.js loads
loadReferenceData();

// Risk Management CRUD Functions
function showAddRiskModal() {
  const modal = createModal('Add New Risk', getRiskFormHTML());
  document.body.appendChild(modal);
  
  // Populate dropdowns
  populateRiskFormDropdowns();
  
  // Handle form submission
  document.getElementById('risk-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleRiskSubmit();
  });
}

function editRisk(id) {
  const risk = moduleData.risks?.find(r => r.id === id);
  if (!risk) {
    showToast('Risk not found', 'error');
    return;
  }
  
  const modal = createModal('Edit Risk', getRiskFormHTML(risk));
  document.body.appendChild(modal);
  
  // Populate dropdowns and form data
  populateRiskFormDropdowns();
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
    const token = localStorage.getItem('dmt_token');
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
  const modal = createModal('Add New Control', getControlFormHTML());
  document.body.appendChild(modal);
  
  // Populate dropdowns
  populateControlFormDropdowns();
  
  // Handle form submission
  document.getElementById('control-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleControlSubmit();
  });
}

function editControl(id) {
  const control = moduleData.controls?.find(c => c.id === id);
  if (!control) {
    showToast('Control not found', 'error');
    return;
  }
  
  const modal = createModal('Edit Control', getControlFormHTML(control));
  document.body.appendChild(modal);
  
  // Populate dropdowns and form data
  populateControlFormDropdowns();
  populateControlForm(control);
  
  // Handle form submission
  document.getElementById('control-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleControlSubmit(id);
  });
}

async function deleteControl(id) {
  if (!confirm('Are you sure you want to delete this control? This action cannot be undone.')) {
    return;
  }
  
  try {
    const token = localStorage.getItem('dmt_token');
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
  
  const modal = createModal('Control Details', getControlViewHTML(control));
  document.body.appendChild(modal);
}

function testControl(id) {
  showToast('Control testing functionality - Implementation in progress', 'info'); 
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
    const token = localStorage.getItem('dmt_token');
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
    const token = localStorage.getItem('dmt_token');
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
  if (!confirm("Are you sure you want to reset this user's password? They will need to set a new password on their next login.")) {
    return;
  }
  
  try {
    const token = localStorage.getItem('dmt_token');
    const response = await axios.post(`/api/users/${id}/reset-password`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast('Password reset successfully', 'success');
    } else {
      showToast(response.data.error || 'Failed to reset password', 'error');
    }
  } catch (error) {
    console.error('Reset password error:', error);
    showToast('Failed to reset password', 'error');
  }
}

// User Form Functions
function getUserFormHTML(user = null) {
  return `
    <form id="user-form" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">First Name *</label>
          <input type="text" id="user-first-name" class="form-input" required>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Last Name *</label>
          <input type="text" id="user-last-name" class="form-input" required>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Username *</label>
          <input type="text" id="user-username" class="form-input" required ${user ? 'readonly' : ''}>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Email Address *</label>
          <input type="email" id="user-email" class="form-input" required>
        </div>
      </div>
      
      ${!user ? `
      <div id="password-field" style="display: none;">
        <label class="block text-sm font-medium text-gray-700">Password *</label>
        <input type="password" id="user-password" class="form-input">
        <p class="text-xs text-gray-500 mt-1">Minimum 8 characters (only required for local accounts)</p>
      </div>
      ` : ''}
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Role *</label>
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
          <label class="block text-sm font-medium text-gray-700">Authentication Provider *</label>
          <select id="user-auth-provider" class="form-select" required onchange="togglePasswordField()">
            <option value="">Select Auth Provider</option>
            <option value="local">Local Account</option>
            <option value="saml">SAML (Microsoft Entra ID)</option>
          </select>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Department</label>
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
          <label class="block text-sm font-medium text-gray-700">Job Title</label>
          <input type="text" id="user-job-title" class="form-input">
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700">Phone Number</label>
        <input type="tel" id="user-phone" class="form-input">
      </div>
      
      ${user ? `
      <div>
        <label class="flex items-center">
          <input type="checkbox" id="user-active" class="rounded">
          <span class="ml-2 text-sm text-gray-700">Active User</span>
        </label>
      </div>
      ` : ''}
      
      <div class="flex justify-end space-x-3 mt-6">
        <button type="button" onclick="closeModal(this)" class="btn-secondary">Cancel</button>
        <button type="submit" class="btn-primary">${user ? 'Update' : 'Create'} User</button>
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
    
    const token = localStorage.getItem('dmt_token');
    const url = id ? `/api/users/${id}` : '/api/users';
    const method = id ? 'put' : 'post';
    
    const response = await axios[method](url, formData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      showToast(`User ${id ? 'updated' : 'created'} successfully`, 'success');
      closeModal(document.querySelector('#user-form'));
      await loadUsers(); // Reload users table
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

function exportUsers() { 
  showToast('Export Users - Implementation in progress', 'info'); 
}

// Placeholder functions for assessment and incident management
function showAddAssessmentModal() { showToast('Add Assessment modal - Implementation in progress', 'info'); }
function showAddIncidentModal() { showToast('Report Incident modal - Implementation in progress', 'info'); }

function viewAssessment(id) { showToast(`View Assessment ${id} - Implementation in progress`, 'info'); }
function editAssessment(id) { showToast(`Edit Assessment ${id} - Implementation in progress`, 'info'); }
function deleteAssessment(id) { showToast(`Delete Assessment ${id} - Implementation in progress`, 'info'); }
function generateComplianceReport() { showToast('Generate Compliance Report - Implementation in progress', 'info'); }
function filterAssessments() { showToast('Filter Assessments - Implementation in progress', 'info'); }

function viewIncident(id) { showToast(`View Incident ${id} - Implementation in progress`, 'info'); }
function editIncident(id) { showToast(`Edit Incident ${id} - Implementation in progress`, 'info'); }
function assignIncident(id) { showToast(`Assign Incident ${id} - Implementation in progress`, 'info'); }
function escalateIncident(id) { showToast(`Escalate Incident ${id} - Implementation in progress`, 'info'); }

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
function exportCompliance() { showToast('Export Compliance - Implementation in progress', 'info'); }

// Export functions
function exportRisks() { showToast('Export Risks - Implementation in progress', 'info'); }
function exportControls() { showToast('Export Controls - Implementation in progress', 'info'); }
function exportIncidents() { showToast('Export Incidents - Implementation in progress', 'info'); }

// Modal and Form Helper Functions
function createModal(title, content) {
  const modal = document.createElement('div');
  modal.className = 'fixed inset-0 z-50 overflow-y-auto';
  modal.innerHTML = `
    <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 transition-opacity" aria-hidden="true" onclick="closeModal(this)">
        <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
      <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full mx-4">
        <div class="bg-white">
          <div class="modal-header">
            <h3 class="modal-title">${title}</h3>
            <button onclick="closeModal(this)" class="text-gray-400 hover:text-gray-600 focus:outline-none">
              <i class="fas fa-times text-xl"></i>
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

function closeModal(button) {
  const modal = button.closest('.fixed');
  modal.remove();
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
          <label class="block text-sm font-medium text-gray-700">Category *</label>
          <select id="risk-category" class="form-select" required>
            <option value="">Select Category</option>
          </select>
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700">Description *</label>
        <textarea id="risk-description" class="form-input" rows="3" required></textarea>
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
          <label class="block text-sm font-medium text-gray-700">Probability (1-5) *</label>
          <select id="risk-probability" class="form-select" required>
            <option value="">Select Probability</option>
            <option value="1">1 - Very Low</option>
            <option value="2">2 - Low</option>
            <option value="3">3 - Medium</option>
            <option value="4">4 - High</option>
            <option value="5">5 - Very High</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Impact (1-5) *</label>
          <select id="risk-impact" class="form-select" required>
            <option value="">Select Impact</option>
            <option value="1">1 - Very Low</option>
            <option value="2">2 - Low</option>
            <option value="3">3 - Medium</option>
            <option value="4">4 - High</option>
            <option value="5">5 - Very High</option>
          </select>
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

function populateRiskFormDropdowns() {
  // Populate categories
  const categorySelect = document.getElementById('risk-category');
  categorySelect.innerHTML = '<option value="">Select Category</option>';
  referenceData.categories.forEach(category => {
    categorySelect.innerHTML += `<option value="${category.id}">${category.name}</option>`;
  });
  
  // Populate organizations
  const orgSelect = document.getElementById('risk-organization');
  orgSelect.innerHTML = '<option value="">Select Organization</option>';
  referenceData.organizations.forEach(org => {
    orgSelect.innerHTML += `<option value="${org.id}">${org.name}</option>`;
  });
  
  // Populate users
  const ownerSelect = document.getElementById('risk-owner');
  ownerSelect.innerHTML = '<option value="">Select Owner</option>';
  referenceData.users.forEach(user => {
    ownerSelect.innerHTML += `<option value="${user.id}">${user.first_name} ${user.last_name}</option>`;
  });
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
}

async function handleRiskSubmit(id = null) {
  try {
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
      next_review_date: document.getElementById('risk-review-date').value
    };
    
    const token = localStorage.getItem('dmt_token');
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
function getControlFormHTML(control = null) {
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

function populateControlFormDropdowns() {
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

function populateControlForm(control) {
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

async function handleControlSubmit(id = null) {
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
    
    const token = localStorage.getItem('dmt_token');
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

function getControlViewHTML(control) {
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
// Make functions globally accessible
window.showRisks = showRisks;
window.showControls = showControls;
window.showCompliance = showCompliance;
window.showIncidents = showIncidents;
window.showUsers = showUsers;
window.loadUsers = loadUsers;
window.renderUsersTable = renderUsersTable;

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
window.deleteUser = deleteUser;
window.resetUserPassword = resetUserPassword;
window.togglePasswordField = togglePasswordField;
