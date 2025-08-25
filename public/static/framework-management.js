// DMT Risk Assessment System v2.0 - Framework Management Module
// SOC 2 Control Editing and Custom Framework Management

let frameworkData = {
  frameworks: [],
  controls: [],
  customFrameworks: [],
  controlTests: []
};

// Main Frameworks Management Function
async function showFrameworks() {
  updateActiveNavigation('frameworks');
  currentModule = 'frameworks';
  
  const mainContent = document.getElementById('main-content');
  
  mainContent.innerHTML = `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Framework Management</h2>
          <p class="text-gray-600 mt-1">Manage compliance frameworks, edit SOC 2 controls, and create custom frameworks</p>
        </div>
        <div class="flex space-x-3">
          <button onclick="importStandardFramework()" class="btn-secondary">
            <i class="fas fa-download mr-2"></i>Import Standard
          </button>
          <button onclick="exportFramework()" class="btn-secondary">
            <i class="fas fa-upload mr-2"></i>Export
          </button>
          <button onclick="createCustomFramework()" class="btn-primary">
            <i class="fas fa-plus mr-2"></i>Create Custom Framework
          </button>
        </div>
      </div>
      
      <!-- Framework Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-list-check text-blue-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">Total Frameworks</p>
              <p class="text-lg font-semibold text-gray-900" id="total-frameworks-count">-</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-shield-check text-green-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">Total Controls</p>
              <p class="text-lg font-semibold text-gray-900" id="total-controls-count">-</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-cogs text-purple-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">Custom Frameworks</p>
              <p class="text-lg font-semibold text-gray-900" id="custom-frameworks-count">-</p>
            </div>
          </div>
        </div>
        <div class="bg-white rounded-lg shadow p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-edit text-yellow-600"></i>
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500">Modified Controls</p>
              <p class="text-lg font-semibold text-gray-900" id="modified-controls-count">-</p>
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
              <p class="text-sm font-medium text-gray-500">Missing Tests</p>
              <p class="text-lg font-semibold text-gray-900" id="missing-tests-count">-</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Framework Tabs -->
      <div class="bg-white rounded-lg shadow">
        <div class="border-b border-gray-200">
          <nav class="-mb-px flex space-x-8" aria-label="Tabs">
            <button onclick="showFrameworkTab('overview')" id="overview-tab" class="framework-tab active">
              <i class="fas fa-th-large mr-2"></i>Overview
            </button>
            <button onclick="showFrameworkTab('soc2')" id="soc2-tab" class="framework-tab">
              <i class="fas fa-shield-alt mr-2"></i>SOC 2 Controls
            </button>
            <button onclick="showFrameworkTab('custom')" id="custom-tab" class="framework-tab">
              <i class="fas fa-wrench mr-2"></i>Custom Frameworks
            </button>
            <button onclick="showFrameworkTab('testing')" id="testing-tab" class="framework-tab">
              <i class="fas fa-vial mr-2"></i>Control Testing
            </button>
            <button onclick="showFrameworkTab('mapping')" id="mapping-tab" class="framework-tab">
              <i class="fas fa-project-diagram mr-2"></i>Control Mapping
            </button>
          </nav>
        </div>
        
        <!-- Overview Tab Content -->
        <div id="overview-content" class="framework-tab-content">
          <div class="p-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Standard Frameworks -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Standard Frameworks</h3>
                <div class="space-y-3" id="standard-frameworks-list">
                  <!-- Standard frameworks will be loaded here -->
                </div>
              </div>
              
              <!-- Custom Frameworks -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h3 class="text-lg font-medium text-gray-900 mb-4">Custom Frameworks</h3>
                <div class="space-y-3" id="custom-frameworks-list">
                  <!-- Custom frameworks will be loaded here -->
                </div>
                <button onclick="createCustomFramework()" class="mt-4 w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-300 hover:text-blue-600">
                  <i class="fas fa-plus mr-2"></i>Create New Framework
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- SOC 2 Controls Tab Content -->
        <div id="soc2-content" class="framework-tab-content hidden">
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <div>
                <h3 class="text-lg font-medium text-gray-900">SOC 2 Control Library</h3>
                <p class="text-sm text-gray-600 mt-1">Edit and customize SOC 2 controls to match your organization's needs</p>
              </div>
              <div class="flex space-x-2">
                <select id="soc2-category-filter" class="form-select" onchange="filterSOC2Controls()">
                  <option value="">All Categories</option>
                  <option value="Security">Security (CC6)</option>
                  <option value="Availability">Availability (A1)</option>
                  <option value="Processing Integrity">Processing Integrity (PI1)</option>
                  <option value="Confidentiality">Confidentiality (C1)</option>
                  <option value="Privacy">Privacy (P1-P8)</option>
                </select>
                <select id="soc2-status-filter" class="form-select" onchange="filterSOC2Controls()">
                  <option value="">All Status</option>
                  <option value="standard">Standard</option>
                  <option value="customized">Customized</option>
                  <option value="not_applicable">Not Applicable</option>
                </select>
                <button onclick="importSOC2Template()" class="btn-secondary">
                  <i class="fas fa-download mr-2"></i>Import Template
                </button>
              </div>
            </div>
            
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="table-header">Control ID</th>
                    <th class="table-header">Control Name</th>
                    <th class="table-header">Category</th>
                    <th class="table-header">Status</th>
                    <th class="table-header">Last Modified</th>
                    <th class="table-header">Actions</th>
                  </tr>
                </thead>
                <tbody id="soc2-controls-table" class="bg-white divide-y divide-gray-200">
                  <!-- SOC 2 controls will be loaded here -->
                </tbody>
              </table>
            </div>
            
            <div id="soc2-controls-loading" class="p-8 text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p class="mt-2 text-gray-600">Loading SOC 2 controls...</p>
            </div>
          </div>
        </div>
        
        <!-- Custom Frameworks Tab Content -->
        <div id="custom-content" class="framework-tab-content hidden">
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-lg font-medium text-gray-900">Custom Framework Management</h3>
              <button onclick="createCustomFramework()" class="btn-primary">
                <i class="fas fa-plus mr-2"></i>Create New Framework
              </button>
            </div>
            
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6" id="custom-frameworks-grid">
              <!-- Custom frameworks will be loaded here -->
            </div>
            
            <div id="custom-frameworks-empty" class="text-center py-12 hidden">
              <i class="fas fa-layer-group text-gray-400 text-6xl mb-4"></i>
              <h3 class="text-lg font-medium text-gray-900">No Custom Frameworks</h3>
              <p class="text-gray-600 mt-2">Create your first custom framework to get started</p>
              <button onclick="createCustomFramework()" class="mt-4 btn-primary">
                <i class="fas fa-plus mr-2"></i>Create Framework
              </button>
            </div>
          </div>
        </div>
        
        <!-- Control Testing Tab Content -->
        <div id="testing-content" class="framework-tab-content hidden">
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <div>
                <h3 class="text-lg font-medium text-gray-900">Control Testing Workflow</h3>
                <p class="text-sm text-gray-600 mt-1">Design and execute control testing procedures</p>
              </div>
              <div class="flex space-x-2">
                <button onclick="bulkTestControls()" class="btn-secondary">
                  <i class="fas fa-tasks mr-2"></i>Bulk Test
                </button>
                <button onclick="createTestProcedure()" class="btn-primary">
                  <i class="fas fa-plus mr-2"></i>New Test Procedure
                </button>
              </div>
            </div>
            
            <div class="bg-white border border-gray-200 rounded-lg">
              <div class="px-6 py-3 border-b border-gray-200">
                <div class="flex items-center space-x-4">
                  <select id="test-framework-filter" class="form-select" onchange="filterControlTests()">
                    <option value="">All Frameworks</option>
                    <option value="SOC2">SOC 2</option>
                    <option value="ISO27001">ISO 27001</option>
                    <option value="Custom">Custom Frameworks</option>
                  </select>
                  <select id="test-status-filter" class="form-select" onchange="filterControlTests()">
                    <option value="">All Test Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                    <option value="not_applicable">Not Applicable</option>
                  </select>
                  <input type="text" id="test-search" placeholder="Search controls..." class="form-input" onkeyup="filterControlTests()">
                </div>
              </div>
              
              <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                  <thead class="bg-gray-50">
                    <tr>
                      <th class="table-header">Control</th>
                      <th class="table-header">Framework</th>
                      <th class="table-header">Test Status</th>
                      <th class="table-header">Last Tested</th>
                      <th class="table-header">Next Test Due</th>
                      <th class="table-header">Assignee</th>
                      <th class="table-header">Actions</th>
                    </tr>
                  </thead>
                  <tbody id="control-tests-table" class="bg-white divide-y divide-gray-200">
                    <!-- Control tests will be loaded here -->
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Control Mapping Tab Content -->
        <div id="mapping-content" class="framework-tab-content hidden">
          <div class="p-6">
            <div class="flex justify-between items-center mb-6">
              <div>
                <h3 class="text-lg font-medium text-gray-900">Control Mapping & Relationships</h3>
                <p class="text-sm text-gray-600 mt-1">Map controls across frameworks and manage relationships</p>
              </div>
              <div class="flex space-x-2">
                <button onclick="exportControlMapping()" class="btn-secondary">
                  <i class="fas fa-download mr-2"></i>Export Mapping
                </button>
                <button onclick="createControlMapping()" class="btn-primary">
                  <i class="fas fa-plus mr-2"></i>New Mapping
                </button>
              </div>
            </div>
            
            <div class="bg-white border border-gray-200 rounded-lg p-6">
              <h4 class="text-md font-medium text-gray-900 mb-4">Framework Cross-References</h4>
              <div id="control-mapping-matrix">
                <!-- Control mapping matrix will be loaded here -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Load framework data
  await loadFrameworksData();
  await loadSOC2Controls();
}

// Framework Tab Management
function showFrameworkTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll('.framework-tab-content').forEach(content => {
    content.classList.add('hidden');
  });
  
  // Remove active class from all tabs
  document.querySelectorAll('.framework-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  
  // Show selected tab content and mark tab as active
  document.getElementById(`${tabName}-content`).classList.remove('hidden');
  document.getElementById(`${tabName}-tab`).classList.add('active');
  
  // Load data for specific tabs
  switch(tabName) {
    case 'overview':
      loadFrameworkOverview();
      break;
    case 'soc2':
      loadSOC2Controls();
      break;
    case 'custom':
      loadCustomFrameworks();
      break;
    case 'testing':
      loadControlTests();
      break;
    case 'mapping':
      loadControlMappings();
      break;
  }
}

// Load Framework Data
async function loadFrameworksData() {
  try {
    const token = localStorage.getItem('aria_token');
    
    // Initialize with default data if no API response
    frameworkData = {
      frameworks: [
        {
          id: 1,
          name: 'SOC 2',
          type: 'standard',
          description: 'System and Organization Controls 2',
          controls_count: 64,
          status: 'active',
          version: '2017'
        },
        {
          id: 2, 
          name: 'ISO 27001',
          type: 'standard',
          description: 'Information Security Management System',
          controls_count: 114,
          status: 'active',
          version: '2022'
        }
      ],
      customFrameworks: [],
      controls: [],
      controlTests: []
    };
    
    updateFrameworkStatistics();
    loadFrameworkOverview();
  } catch (error) {
    console.error('Error loading frameworks data:', error);
  }
}

// Load Framework Overview
function loadFrameworkOverview() {
  const standardList = document.getElementById('standard-frameworks-list');
  const customList = document.getElementById('custom-frameworks-list');
  
  if (standardList) {
    standardList.innerHTML = frameworkData.frameworks.map(framework => `
      <div class="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-shield-alt text-blue-600"></i>
          </div>
          <div>
            <h4 class="font-medium text-gray-900">${framework.name}</h4>
            <p class="text-sm text-gray-600">${framework.controls_count} controls</p>
          </div>
        </div>
        <div class="flex space-x-2">
          <button onclick="viewFramework(${framework.id})" class="text-blue-600 hover:text-blue-900" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
          <button onclick="editFrameworkControls(${framework.id})" class="text-green-600 hover:text-green-900" title="Edit Controls">
            <i class="fas fa-edit"></i>
          </button>
        </div>
      </div>
    `).join('');
  }
  
  if (customList) {
    if (frameworkData.customFrameworks.length === 0) {
      customList.innerHTML = '<p class="text-gray-600 text-sm">No custom frameworks created yet</p>';
    } else {
      customList.innerHTML = frameworkData.customFrameworks.map(framework => `
        <div class="flex items-center justify-between p-3 bg-white rounded border border-gray-200">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <i class="fas fa-wrench text-purple-600"></i>
            </div>
            <div>
              <h4 class="font-medium text-gray-900">${framework.name}</h4>
              <p class="text-sm text-gray-600">${framework.controls_count || 0} controls</p>
            </div>
          </div>
          <div class="flex space-x-2">
            <button onclick="viewCustomFramework(${framework.id})" class="text-blue-600 hover:text-blue-900" title="View Details">
              <i class="fas fa-eye"></i>
            </button>
            <button onclick="editCustomFramework(${framework.id})" class="text-green-600 hover:text-green-900" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteCustomFramework(${framework.id})" class="text-red-600 hover:text-red-900" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `).join('');
    }
  }
}

// Load SOC 2 Controls
async function loadSOC2Controls() {
  try {
    // Initialize default SOC 2 controls
    const soc2Controls = [
      {
        id: 'CC6.1',
        name: 'Logical and Physical Access Controls',
        category: 'Security',
        description: 'The entity implements logical and physical access controls to prevent unauthorized access to the system.',
        status: 'standard',
        last_modified: null,
        implementation_guidance: 'Implement access controls including user authentication, authorization, and physical security measures.',
        testing_procedures: 'Review access control lists, test authentication mechanisms, and inspect physical security controls.'
      },
      {
        id: 'CC6.2',
        name: 'Transmission and Disposal of Confidential Information',
        category: 'Security', 
        description: 'Prior to transmission or disposal, the entity protects confidential information.',
        status: 'standard',
        last_modified: null,
        implementation_guidance: 'Encrypt data in transit and at rest. Implement secure disposal procedures for confidential information.',
        testing_procedures: 'Review encryption protocols, test data transmission security, and verify disposal procedures.'
      },
      {
        id: 'CC6.3',
        name: 'System Access Monitoring',
        category: 'Security',
        description: 'The entity monitors system components and the operation of device and user access controls.',
        status: 'standard',
        last_modified: null,
        implementation_guidance: 'Implement logging and monitoring systems to track access attempts and system activities.',
        testing_procedures: 'Review access logs, test monitoring systems, and verify alert mechanisms.'
      },
      {
        id: 'A1.1',
        name: 'System Availability',
        category: 'Availability',
        description: 'The entity maintains, monitors, and evaluates current processing capacity.',
        status: 'standard',
        last_modified: null,
        implementation_guidance: 'Monitor system performance, plan capacity, and implement redundancy measures.',
        testing_procedures: 'Review capacity monitoring reports and test failover procedures.'
      },
      {
        id: 'A1.2',
        name: 'System Recovery and Backup',
        category: 'Availability',
        description: 'The entity authorizes, designs, develops, implements, and maintains recovery and backup procedures.',
        status: 'standard',
        last_modified: null,
        implementation_guidance: 'Implement backup procedures, test recovery processes, and maintain recovery documentation.',
        testing_procedures: 'Test backup restoration and review recovery time objectives.'
      },
      {
        id: 'PI1.1',
        name: 'Processing Integrity Controls',
        category: 'Processing Integrity',
        description: 'The entity implements controls to provide reasonable assurance that system processing is complete, valid, accurate, and authorized.',
        status: 'standard',
        last_modified: null,
        implementation_guidance: 'Implement data validation, error checking, and processing controls.',
        testing_procedures: 'Test data validation rules and review processing error logs.'
      },
      {
        id: 'C1.1',
        name: 'Confidentiality Controls',
        category: 'Confidentiality',
        description: 'The entity identifies and maintains confidential information.',
        status: 'standard',
        last_modified: null,
        implementation_guidance: 'Classify confidential information and implement appropriate protection measures.',
        testing_procedures: 'Review data classification and test protection mechanisms.'
      },
      {
        id: 'P1.1',
        name: 'Privacy Notice and Choice',
        category: 'Privacy',
        description: 'The entity provides notice to data subjects about privacy practices and choices.',
        status: 'standard',
        last_modified: null,
        implementation_guidance: 'Develop privacy notices and provide data subject choices.',
        testing_procedures: 'Review privacy notices and test consent mechanisms.'
      }
    ];
    
    frameworkData.soc2Controls = soc2Controls;
    renderSOC2ControlsTable(soc2Controls);
    
    const loadingElement = document.getElementById('soc2-controls-loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
  } catch (error) {
    console.error('Error loading SOC 2 controls:', error);
  }
}

// Render SOC 2 Controls Table
function renderSOC2ControlsTable(controls) {
  const tbody = document.getElementById('soc2-controls-table');
  if (!tbody) return;
  
  tbody.innerHTML = controls.map(control => `
    <tr class="table-row">
      <td class="table-cell">
        <div class="text-sm font-medium text-gray-900">${control.id}</div>
      </td>
      <td class="table-cell">
        <div class="text-sm font-medium text-gray-900">${control.name}</div>
        <div class="text-sm text-gray-500">${truncateText(control.description, 80)}</div>
      </td>
      <td class="table-cell">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryClass(control.category)}">
          ${control.category}
        </span>
      </td>
      <td class="table-cell">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getControlStatusClass(control.status)}">
          ${capitalizeFirst(control.status.replace('_', ' '))}
        </span>
      </td>
      <td class="table-cell">
        <span class="text-sm text-gray-900">${control.last_modified ? formatDate(control.last_modified) : 'Never'}</span>
      </td>
      <td class="table-cell">
        <div class="flex space-x-2">
          <button onclick="viewSOC2Control('${control.id}')" class="text-blue-600 hover:text-blue-900" title="View Details">
            <i class="fas fa-eye"></i>
          </button>
          <button onclick="editSOC2Control('${control.id}')" class="text-green-600 hover:text-green-900" title="Edit Control">
            <i class="fas fa-edit"></i>
          </button>
          <button onclick="customizeSOC2Control('${control.id}')" class="text-purple-600 hover:text-purple-900" title="Customize">
            <i class="fas fa-wrench"></i>
          </button>
          <button onclick="testSOC2Control('${control.id}')" class="text-orange-600 hover:text-orange-900" title="Test Control">
            <i class="fas fa-vial"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// SOC 2 Control Management Functions
function viewSOC2Control(controlId) {
  const control = frameworkData.soc2Controls?.find(c => c.id === controlId);
  if (!control) {
    showToast('Control not found', 'error');
    return;
  }
  
  showModal('SOC 2 Control Details', `
    <div class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Control ID</label>
          <p class="mt-1 text-sm text-gray-900">${control.id}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Category</label>
          <p class="mt-1 text-sm text-gray-900">${control.category}</p>
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
      
      <div>
        <label class="block text-sm font-medium text-gray-700">Implementation Guidance</label>
        <p class="mt-1 text-sm text-gray-900">${control.implementation_guidance || 'No guidance provided'}</p>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700">Testing Procedures</label>
        <p class="mt-1 text-sm text-gray-900">${control.testing_procedures || 'No testing procedures defined'}</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Status</label>
          <p class="mt-1 text-sm text-gray-900">${capitalizeFirst(control.status.replace('_', ' '))}</p>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">Last Modified</label>
          <p class="mt-1 text-sm text-gray-900">${control.last_modified ? formatDate(control.last_modified) : 'Never'}</p>
        </div>
      </div>
    </div>
  `, [
    { text: 'Edit Control', class: 'btn-primary', onclick: `editSOC2Control('${control.id}')` },
    { text: 'Close', class: 'btn-secondary', onclick: 'closeModal(this)' }
  ]);
}

function editSOC2Control(controlId) {
  const control = frameworkData.soc2Controls?.find(c => c.id === controlId);
  if (!control) {
    showToast('Control not found', 'error');
    return;
  }
  
  showModal('Edit SOC 2 Control', `
    <form id="edit-soc2-control-form" class="space-y-6">
      <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <div class="flex">
          <i class="fas fa-exclamation-triangle text-yellow-400 mt-0.5 mr-3"></i>
          <div class="text-sm text-yellow-800">
            <p><strong>Important:</strong> Editing standard SOC 2 controls will mark them as customized. 
            Consider creating a custom framework instead if you need significant modifications.</p>
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="form-label">Control ID</label>
          <input type="text" id="control-id" class="form-input bg-gray-50" value="${control.id}" readonly>
        </div>
        <div>
          <label class="form-label">Category</label>
          <select id="control-category" class="form-select" required>
            <option value="Security" ${control.category === 'Security' ? 'selected' : ''}>Security</option>
            <option value="Availability" ${control.category === 'Availability' ? 'selected' : ''}>Availability</option>
            <option value="Processing Integrity" ${control.category === 'Processing Integrity' ? 'selected' : ''}>Processing Integrity</option>
            <option value="Confidentiality" ${control.category === 'Confidentiality' ? 'selected' : ''}>Confidentiality</option>
            <option value="Privacy" ${control.category === 'Privacy' ? 'selected' : ''}>Privacy</option>
          </select>
        </div>
      </div>
      
      <div>
        <label class="form-label">Control Name *</label>
        <input type="text" id="control-name" class="form-input" value="${control.name}" required>
      </div>
      
      <div>
        <label class="form-label">Description *</label>
        <textarea id="control-description" class="form-input" rows="3" required>${control.description}</textarea>
      </div>
      
      <div>
        <label class="form-label">Implementation Guidance</label>
        <textarea id="control-guidance" class="form-input" rows="4" placeholder="Provide specific implementation guidance for this control...">${control.implementation_guidance || ''}</textarea>
      </div>
      
      <div>
        <label class="form-label">Testing Procedures</label>
        <textarea id="control-testing" class="form-input" rows="4" placeholder="Define testing procedures and methods for this control...">${control.testing_procedures || ''}</textarea>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="form-label">Control Status</label>
          <select id="control-status" class="form-select">
            <option value="standard" ${control.status === 'standard' ? 'selected' : ''}>Standard</option>
            <option value="customized" ${control.status === 'customized' ? 'selected' : ''}>Customized</option>
            <option value="not_applicable" ${control.status === 'not_applicable' ? 'selected' : ''}>Not Applicable</option>
          </select>
        </div>
        <div>
          <label class="form-label">Risk Level</label>
          <select id="control-risk" class="form-select">
            <option value="">Not Specified</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>
    </form>
  `, [
    { text: 'Cancel', class: 'btn-secondary', onclick: 'closeModal()' },
    { text: 'Save Changes', class: 'btn-primary', onclick: `saveSOC2Control('${control.id}')` }
  ]);
}

function saveSOC2Control(controlId) {
  const form = document.getElementById('edit-soc2-control-form');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  const formData = {
    id: controlId,
    name: document.getElementById('control-name').value,
    category: document.getElementById('control-category').value,
    description: document.getElementById('control-description').value,
    implementation_guidance: document.getElementById('control-guidance').value,
    testing_procedures: document.getElementById('control-testing').value,
    status: document.getElementById('control-status').value,
    risk_level: document.getElementById('control-risk').value,
    last_modified: new Date().toISOString()
  };
  
  // Update control in memory
  const controlIndex = frameworkData.soc2Controls.findIndex(c => c.id === controlId);
  if (controlIndex !== -1) {
    frameworkData.soc2Controls[controlIndex] = { ...frameworkData.soc2Controls[controlIndex], ...formData };
    
    // Mark as customized if not already
    if (frameworkData.soc2Controls[controlIndex].status === 'standard') {
      frameworkData.soc2Controls[controlIndex].status = 'customized';
    }
  }
  
  // Save to localStorage for persistence in demo
  localStorage.setItem('soc2_controls', JSON.stringify(frameworkData.soc2Controls));
  
  showToast('SOC 2 control updated successfully', 'success');
  closeModal();
  renderSOC2ControlsTable(frameworkData.soc2Controls);
  updateFrameworkStatistics();
}

// Custom Framework Management
function createCustomFramework() {
  showModal('Create Custom Framework', `
    <form id="create-custom-framework-form" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="form-label">Framework Name *</label>
          <input type="text" id="framework-name" class="form-input" required placeholder="e.g., Company Security Framework">
        </div>
        <div>
          <label class="form-label">Framework Code *</label>
          <input type="text" id="framework-code" class="form-input" required placeholder="e.g., CSF, CUSTOM-001">
        </div>
      </div>
      
      <div>
        <label class="form-label">Description</label>
        <textarea id="framework-description" class="form-input" rows="3" placeholder="Describe the purpose and scope of this framework..."></textarea>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="form-label">Framework Type</label>
          <select id="framework-type" class="form-select" required>
            <option value="security">Security Framework</option>
            <option value="compliance">Compliance Framework</option>
            <option value="operational">Operational Framework</option>
            <option value="risk">Risk Management Framework</option>
            <option value="governance">Governance Framework</option>
          </select>
        </div>
        <div>
          <label class="form-label">Industry</label>
          <select id="framework-industry" class="form-select">
            <option value="">Not Specified</option>
            <option value="financial">Financial Services</option>
            <option value="healthcare">Healthcare</option>
            <option value="technology">Technology</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="retail">Retail</option>
            <option value="government">Government</option>
          </select>
        </div>
      </div>
      
      <div>
        <label class="form-label">Based on Existing Framework (Optional)</label>
        <select id="base-framework" class="form-select" onchange="handleBaseFrameworkSelection()">
          <option value="">Start from scratch</option>
          <option value="soc2">Copy from SOC 2</option>
          <option value="iso27001">Copy from ISO 27001</option>
          <option value="nist">Copy from NIST Framework</option>
        </select>
        <p class="text-sm text-gray-600 mt-1">Select an existing framework to copy its controls as a starting point</p>
      </div>
      
      <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
        <div class="flex">
          <i class="fas fa-info-circle text-blue-400 mt-0.5 mr-3"></i>
          <div class="text-sm text-blue-800">
            <p><strong>Next Steps:</strong> After creating the framework, you'll be able to add custom controls, 
            import controls from other frameworks, and define testing procedures.</p>
          </div>
        </div>
      </div>
    </form>
  `, [
    { text: 'Cancel', class: 'btn-secondary', onclick: 'closeModal()' },
    { text: 'Create Framework', class: 'btn-primary', onclick: 'saveCustomFramework()' }
  ]);
}

function saveCustomFramework() {
  const form = document.getElementById('create-custom-framework-form');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  const frameworkData = {
    id: Date.now(), // Simple ID for demo
    name: document.getElementById('framework-name').value,
    code: document.getElementById('framework-code').value,
    description: document.getElementById('framework-description').value,
    type: document.getElementById('framework-type').value,
    industry: document.getElementById('framework-industry').value,
    base_framework: document.getElementById('base-framework').value,
    status: 'draft',
    created_at: new Date().toISOString(),
    controls_count: 0,
    controls: []
  };
  
  // Get existing custom frameworks or initialize empty array
  let customFrameworks = [];
  try {
    const stored = localStorage.getItem('custom_frameworks');
    if (stored) {
      customFrameworks = JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading custom frameworks:', error);
    customFrameworks = [];
  }
  
  // Add new framework to the list
  customFrameworks.push(frameworkData);
  
  // Save to localStorage for demo persistence
  localStorage.setItem('custom_frameworks', JSON.stringify(customFrameworks));
  
  showToast('Custom framework created successfully', 'success');
  closeModal();
  
  // Refresh the display
  loadCustomFrameworks();
  updateFrameworkStatistics();
  
  // Offer to add controls immediately
  setTimeout(() => {
    if (confirm('Would you like to add controls to your new framework now?')) {
      editCustomFramework(frameworkData.id);
    }
  }, 500);
}

// Load Custom Frameworks
function loadCustomFrameworks() {
  try {
    const saved = localStorage.getItem('custom_frameworks');
    frameworkData.customFrameworks = saved ? JSON.parse(saved) : [];
    
    const grid = document.getElementById('custom-frameworks-grid');
    const emptyState = document.getElementById('custom-frameworks-empty');
    
    if (frameworkData.customFrameworks.length === 0) {
      if (grid) grid.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
    } else {
      if (emptyState) emptyState.classList.add('hidden');
      if (grid) {
        grid.innerHTML = frameworkData.customFrameworks.map(framework => `
          <div class="bg-white border border-gray-200 rounded-lg p-6">
            <div class="flex items-start justify-between">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-wrench text-purple-600 text-xl"></i>
                </div>
                <div>
                  <h4 class="text-lg font-medium text-gray-900">${framework.name}</h4>
                  <p class="text-sm text-gray-600">${framework.code}</p>
                </div>
              </div>
              <div class="flex space-x-2">
                <button onclick="editCustomFramework(${framework.id})" class="text-green-600 hover:text-green-900" title="Edit">
                  <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteCustomFramework(${framework.id})" class="text-red-600 hover:text-red-900" title="Delete">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            
            <p class="text-sm text-gray-700 mt-3">${framework.description || 'No description provided'}</p>
            
            <div class="flex items-center justify-between mt-4">
              <div class="flex items-center space-x-4">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  ${capitalizeFirst(framework.type)}
                </span>
                <span class="text-sm text-gray-600">${framework.controls_count || 0} controls</span>
              </div>
              <div class="flex space-x-2">
                <button onclick="addControlsToFramework(${framework.id})" class="text-sm btn-secondary">
                  <i class="fas fa-plus mr-1"></i>Add Controls
                </button>
                <button onclick="exportCustomFramework(${framework.id})" class="text-sm btn-secondary">
                  <i class="fas fa-download mr-1"></i>Export
                </button>
              </div>
            </div>
          </div>
        `).join('');
      }
    }
  } catch (error) {
    console.error('Error loading custom frameworks:', error);
  }
}

// Update Framework Statistics
function updateFrameworkStatistics() {
  const totalFrameworks = (frameworkData.frameworks?.length || 0) + (frameworkData.customFrameworks?.length || 0);
  const totalControls = frameworkData.soc2Controls?.length || 0;
  const customFrameworksCount = frameworkData.customFrameworks?.length || 0;
  const modifiedControls = frameworkData.soc2Controls?.filter(c => c.status === 'customized').length || 0;
  const missingTests = frameworkData.soc2Controls?.filter(c => !c.testing_procedures).length || 0;
  
  document.getElementById('total-frameworks-count').textContent = totalFrameworks;
  document.getElementById('total-controls-count').textContent = totalControls;
  document.getElementById('custom-frameworks-count').textContent = customFrameworksCount;
  document.getElementById('modified-controls-count').textContent = modifiedControls;
  document.getElementById('missing-tests-count').textContent = missingTests;
}

// Filter Functions
function filterSOC2Controls() {
  const categoryFilter = document.getElementById('soc2-category-filter')?.value;
  const statusFilter = document.getElementById('soc2-status-filter')?.value;
  
  let filteredControls = frameworkData.soc2Controls || [];
  
  if (categoryFilter) {
    filteredControls = filteredControls.filter(c => c.category === categoryFilter);
  }
  
  if (statusFilter) {
    filteredControls = filteredControls.filter(c => c.status === statusFilter);
  }
  
  renderSOC2ControlsTable(filteredControls);
}

// Utility Functions
function getCategoryClass(category) {
  const classes = {
    'Security': 'bg-red-100 text-red-800',
    'Availability': 'bg-green-100 text-green-800', 
    'Processing Integrity': 'bg-blue-100 text-blue-800',
    'Confidentiality': 'bg-purple-100 text-purple-800',
    'Privacy': 'bg-yellow-100 text-yellow-800'
  };
  return classes[category] || 'bg-gray-100 text-gray-800';
}

function getControlStatusClass(status) {
  const classes = {
    'standard': 'bg-blue-100 text-blue-800',
    'customized': 'bg-orange-100 text-orange-800',
    'not_applicable': 'bg-gray-100 text-gray-800'
  };
  return classes[status] || 'bg-gray-100 text-gray-800';
}

// Placeholder functions for additional features
function importStandardFramework() {
  showModal('Import Standard Framework', `
    <div class="space-y-6">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="flex items-start">
          <i class="fas fa-info-circle text-blue-600 mt-1 mr-3"></i>
          <div>
            <h4 class="font-medium text-blue-900">Available Standard Frameworks</h4>
            <p class="mt-1 text-sm text-blue-800">
              Select from pre-configured industry standard compliance frameworks
            </p>
          </div>
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Framework Type</label>
        <select id="import-framework-type" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          <option value="">Select a framework...</option>
          <option value="ISO27001">ISO 27001:2022 - Information Security Management</option>
          <option value="SOC2">SOC 2 Type II - Service Organization Control</option>
          <option value="NIST">NIST Cybersecurity Framework</option>
          <option value="PCI-DSS">PCI DSS - Payment Card Industry</option>
          <option value="GDPR">GDPR - General Data Protection Regulation</option>
          <option value="HIPAA">HIPAA - Health Insurance Portability</option>
          <option value="CIS">CIS Controls - Center for Internet Security</option>
        </select>
      </div>
      
      <div class="flex space-x-3">
        <button onclick="executeFrameworkImport()" 
                class="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700">
          <i class="fas fa-download mr-2"></i>Import Framework
        </button>
        <button onclick="closeModal()" 
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </div>
  `);
}

async function executeFrameworkImport() {
  try {
    const frameworkType = document.getElementById('import-framework-type').value;
    
    if (!frameworkType) {
      showToast('Please select a framework to import', 'error');
      return;
    }
    
    showToast('Importing standard framework...', 'info');
    closeModal();
    
    // Simulate framework import (in a real system, this would call an API)
    const frameworkData = generateStandardFramework(frameworkType);
    
    // Save to localStorage for demo
    let frameworks = [];
    try {
      const stored = localStorage.getItem('standard_frameworks');
      if (stored) {
        frameworks = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading frameworks:', error);
    }
    
    frameworks.push(frameworkData);
    localStorage.setItem('standard_frameworks', JSON.stringify(frameworks));
    
    showToast(`${frameworkType} framework imported successfully`, 'success');
    
    // Refresh the page to show new framework
    setTimeout(() => location.reload(), 1000);
    
  } catch (error) {
    console.error('Framework import error:', error);
    showToast('Failed to import framework', 'error');
  }
}

function generateStandardFramework(type) {
  const frameworks = {
    'ISO27001': {
      id: Date.now(),
      name: 'ISO 27001:2022',
      code: 'ISO27001',
      description: 'Information Security Management System standard',
      type: 'security',
      industry: 'general',
      status: 'active',
      created_at: new Date().toISOString(),
      controls_count: 93,
      controls: ['A.5.1', 'A.5.2', 'A.5.3', 'A.6.1', 'A.6.2'] // Sample controls
    },
    'SOC2': {
      id: Date.now(),
      name: 'SOC 2 Type II',
      code: 'SOC2',
      description: 'Service Organization Control 2 framework',
      type: 'compliance',
      industry: 'technology',
      status: 'active',
      created_at: new Date().toISOString(),
      controls_count: 64,
      controls: ['CC1.1', 'CC1.2', 'CC2.1', 'CC3.1', 'CC4.1']
    },
    'NIST': {
      id: Date.now(),
      name: 'NIST Cybersecurity Framework',
      code: 'NIST-CSF',
      description: 'NIST Framework for Improving Critical Infrastructure Cybersecurity',
      type: 'security',
      industry: 'general',
      status: 'active',
      created_at: new Date().toISOString(),
      controls_count: 108,
      controls: ['ID.AM-1', 'ID.AM-2', 'PR.AC-1', 'PR.AC-2', 'DE.AE-1']
    }
  };
  
  return frameworks[type] || frameworks['ISO27001'];
}

function exportFramework() {
  showModal('Export Framework', `
    <div class="space-y-6">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Select Framework to Export</label>
        <select id="export-framework-select" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          <option value="">Loading frameworks...</option>
        </select>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
        <select id="export-format" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500">
          <option value="json">JSON Format</option>
          <option value="csv">CSV Format</option>
          <option value="xlsx">Excel Format (XLSX)</option>
        </select>
      </div>
      
      <div class="flex items-center">
        <input type="checkbox" id="include-controls" checked class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500">
        <label for="include-controls" class="ml-2 text-sm text-gray-700">Include Control Details</label>
      </div>
      
      <div class="flex space-x-3">
        <button onclick="executeFrameworkExport()" 
                class="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700">
          <i class="fas fa-download mr-2"></i>Export Framework
        </button>
        <button onclick="closeModal()" 
                class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
          Cancel
        </button>
      </div>
    </div>
  `);
  
  // Load available frameworks
  setTimeout(() => {
    const select = document.getElementById('export-framework-select');
    if (select) {
      // Load from localStorage (demo data)
      let frameworks = [];
      try {
        const standardFrameworks = localStorage.getItem('standard_frameworks');
        const customFrameworks = localStorage.getItem('custom_frameworks');
        
        if (standardFrameworks) {
          frameworks = frameworks.concat(JSON.parse(standardFrameworks));
        }
        if (customFrameworks) {
          frameworks = frameworks.concat(JSON.parse(customFrameworks));
        }
      } catch (error) {
        console.error('Error loading frameworks:', error);
      }
      
      select.innerHTML = frameworks.length > 0 ? 
        '<option value="">Select framework...</option>' + 
        frameworks.map(f => `<option value="${f.id}">${f.name} (${f.code})</option>`).join('') :
        '<option value="">No frameworks available</option>';
    }
  }, 100);
}

function executeFrameworkExport() {
  try {
    const frameworkId = document.getElementById('export-framework-select').value;
    const format = document.getElementById('export-format').value;
    const includeControls = document.getElementById('include-controls').checked;
    
    if (!frameworkId) {
      showToast('Please select a framework to export', 'error');
      return;
    }
    
    // Find the framework
    let framework = null;
    try {
      const standardFrameworks = JSON.parse(localStorage.getItem('standard_frameworks') || '[]');
      const customFrameworks = JSON.parse(localStorage.getItem('custom_frameworks') || '[]');
      const allFrameworks = standardFrameworks.concat(customFrameworks);
      
      framework = allFrameworks.find(f => f.id == frameworkId);
    } catch (error) {
      console.error('Error loading framework:', error);
    }
    
    if (!framework) {
      showToast('Framework not found', 'error');
      return;
    }
    
    let exportContent = '';
    let fileName = `${framework.code}_framework_export_${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'json') {
      exportContent = JSON.stringify(framework, null, 2);
      fileName += '.json';
    } else if (format === 'csv') {
      const headers = ['Property', 'Value'];
      const rows = [
        ['Name', framework.name],
        ['Code', framework.code],
        ['Description', framework.description],
        ['Type', framework.type],
        ['Industry', framework.industry],
        ['Status', framework.status],
        ['Controls Count', framework.controls_count],
        ['Created Date', framework.created_at]
      ];
      
      if (includeControls && framework.controls) {
        framework.controls.forEach((control, index) => {
          rows.push([`Control ${index + 1}`, control]);
        });
      }
      
      exportContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
      fileName += '.csv';
    } else if (format === 'xlsx') {
      // For Excel, we'll export as CSV for now (full Excel export would need a library)
      showToast('Excel export will be available soon. Exporting as CSV instead.', 'info');
      format = 'csv';
      fileName = fileName.replace('.xlsx', '.csv');
      executeFrameworkExport();
      return;
    }
    
    // Download the file
    const blob = new Blob([exportContent], { type: format === 'json' ? 'application/json' : 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    closeModal();
    showToast(`Framework exported successfully as ${format.toUpperCase()}`, 'success');
    
  } catch (error) {
    console.error('Framework export error:', error);
    showToast('Failed to export framework', 'error');
  }
}

function customizeSOC2Control(controlId) {
  showToast('SOC 2 control customization wizard coming soon', 'info');
}

function testSOC2Control(controlId) {
  showToast('Control testing functionality coming soon', 'info');
}

function loadControlTests() {
  showToast('Control testing module loading...', 'info');
}

function loadControlMappings() {
  showToast('Control mapping module loading...', 'info');
}

function deleteCustomFramework(id) {
  if (!confirm('Are you sure you want to delete this custom framework? This action cannot be undone.')) {
    return;
  }
  
  // Remove from array
  frameworkData.customFrameworks = frameworkData.customFrameworks.filter(f => f.id !== id);
  
  // Update localStorage
  localStorage.setItem('custom_frameworks', JSON.stringify(frameworkData.customFrameworks));
  
  showToast('Custom framework deleted successfully', 'success');
  loadCustomFrameworks();
  updateFrameworkStatistics();
}

function editCustomFramework(id) {
  showToast('Custom framework editor coming soon', 'info');
}

function addControlsToFramework(id) {
  showToast('Add controls to framework functionality coming soon', 'info');
}

function exportCustomFramework(id) {
  showToast('Export custom framework functionality coming soon', 'info');
}

// Initialize framework data when module loads
document.addEventListener('DOMContentLoaded', function() {
  // Load saved SOC 2 controls from localStorage
  const savedControls = localStorage.getItem('soc2_controls');
  if (savedControls) {
    try {
      frameworkData.soc2Controls = JSON.parse(savedControls);
    } catch (error) {
      console.error('Error loading saved SOC 2 controls:', error);
    }
  }
  
  // Load saved custom frameworks from localStorage
  const savedFrameworks = localStorage.getItem('custom_frameworks');
  if (savedFrameworks) {
    try {
      frameworkData.customFrameworks = JSON.parse(savedFrameworks);
    } catch (error) {
      console.error('Error loading saved custom frameworks:', error);
    }
  }
});

// Export showFrameworks for global access
window.showFrameworks = showFrameworks;