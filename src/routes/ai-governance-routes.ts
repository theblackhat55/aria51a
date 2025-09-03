import { Hono } from 'hono'
import { getMockData } from '../lib/mock-data'

const app = new Hono()

// AI Governance Dashboard
app.get('/', async (c) => {
  const dashboardData = await getAIGovernanceDashboard()
  
  return c.html(`
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">
            <i class="fas fa-robot mr-3 text-purple-600"></i>AI Governance Dashboard
          </h2>
          <p class="text-gray-600 mt-1">Real-time oversight of AI systems, risks, and compliance</p>
        </div>
        <div class="flex space-x-3">
          <button 
            hx-get="/ai-governance/systems/create"
            hx-target="#modal-content"
            hx-trigger="click"
            class="btn-primary">
            <i class="fas fa-plus mr-2"></i>Register AI System
          </button>
          <button 
            hx-get="/ai-governance"
            hx-target="#main-content"
            hx-trigger="click"
            class="btn-secondary">
            <i class="fas fa-sync-alt mr-2"></i>Refresh
          </button>
        </div>
      </div>

      <!-- Key Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="ai-metrics">
        ${renderAIMetricsCards(dashboardData.summary)}
      </div>

      <!-- Charts and Analysis -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Risk Level Distribution -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Risk Level Distribution</h3>
          <canvas id="ai-risk-chart" width="400" height="200"></canvas>
        </div>

        <!-- System Status -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Operational Status</h3>
          <canvas id="ai-status-chart" width="400" height="200"></canvas>
        </div>
      </div>

      <!-- High Risk Systems -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-900">High Risk AI Systems</h3>
          <button 
            hx-get="/ai-governance/systems"
            hx-target="#main-content"
            hx-trigger="click"
            class="text-purple-600 hover:text-purple-700 text-sm font-medium">
            View All Systems →
          </button>
        </div>
        <div class="overflow-x-auto" id="high-risk-systems">
          ${renderHighRiskSystemsTable(dashboardData.highRiskSystems)}
        </div>
      </div>
    </div>

    <script>
      // Initialize charts after content loads
      window.aiGovernanceData = ${JSON.stringify(dashboardData)};
      
      // Initialize charts when Chart.js and functions are available
      function initCharts() {
        if (typeof Chart !== 'undefined' && typeof initializeAIGovernanceCharts !== 'undefined') {
          initializeAIGovernanceCharts(window.aiGovernanceData);
        } else {
          setTimeout(initCharts, 100);
        }
      }
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCharts);
      } else {
        initCharts();
      }
    </script>
  `)
})

// AI Systems Registry
app.get('/systems', async (c) => {
  const search = c.req.query('search') || ''
  const status = c.req.query('status') || ''
  const riskLevel = c.req.query('risk_level') || ''
  
  const systems = await getAISystems({ search, status, riskLevel })
  
  return c.html(`
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">
            <i class="fas fa-microchip mr-3 text-blue-600"></i>AI Systems Registry
          </h2>
          <p class="text-gray-600 mt-1">Comprehensive inventory of organizational AI systems</p>
        </div>
        <div class="flex space-x-3">
          <button 
            hx-get="/ai-governance/systems/create"
            hx-target="#modal-content"
            hx-trigger="click"
            class="btn-primary">
            <i class="fas fa-plus mr-2"></i>Register System
          </button>
          <button 
            hx-get="/ai-governance/systems/bulk-assessment"
            hx-target="#modal-content"
            hx-trigger="click"
            class="btn-secondary">
            <i class="fas fa-tasks mr-2"></i>Bulk Assessment
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Search Systems</label>
            <input 
              type="text" 
              name="search" 
              value="${search}"
              placeholder="Search by name, owner, or purpose..." 
              class="form-input"
              hx-get="/ai-governance/systems/table"
              hx-target="#systems-table"
              hx-trigger="keyup changed delay:300ms"
              hx-include="[name='status'], [name='risk_level']">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              name="status" 
              class="form-select"
              hx-get="/ai-governance/systems/table"
              hx-target="#systems-table"
              hx-trigger="change"
              hx-include="[name='search'], [name='risk_level']">
              <option value="">All Statuses</option>
              <option value="development" ${status === 'development' ? 'selected' : ''}>Development</option>
              <option value="testing" ${status === 'testing' ? 'selected' : ''}>Testing</option>
              <option value="production" ${status === 'production' ? 'selected' : ''}>Production</option>
              <option value="retired" ${status === 'retired' ? 'selected' : ''}>Retired</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
            <select 
              name="risk_level" 
              class="form-select"
              hx-get="/ai-governance/systems/table"
              hx-target="#systems-table"
              hx-trigger="change"
              hx-include="[name='search'], [name='status']">
              <option value="">All Risk Levels</option>
              <option value="critical" ${riskLevel === 'critical' ? 'selected' : ''}>Critical</option>
              <option value="high" ${riskLevel === 'high' ? 'selected' : ''}>High</option>
              <option value="medium" ${riskLevel === 'medium' ? 'selected' : ''}>Medium</option>
              <option value="low" ${riskLevel === 'low' ? 'selected' : ''}>Low</option>
            </select>
          </div>
          <div class="flex items-end">
            <button 
              hx-get="/ai-governance/systems/export"
              hx-trigger="click"
              class="btn-outline w-full">
              <i class="fas fa-download mr-2"></i>Export
            </button>
          </div>
        </div>
      </div>

      <!-- Systems Table -->
      <div id="systems-table">
        ${renderAISystemsTable(systems)}
      </div>
    </div>
  `)
})

// AI Systems table content (for HTMX updates)
app.get('/systems/table', async (c) => {
  const search = c.req.query('search') || ''
  const status = c.req.query('status') || ''
  const riskLevel = c.req.query('risk_level') || ''
  
  const systems = await getAISystems({ search, status, riskLevel })
  return c.html(renderAISystemsTable(systems))
})

// Create AI System modal
app.get('/systems/create', async (c) => {
  const systemTypes = await getAISystemTypes()
  const riskCategories = await getAIRiskCategories()
  
  return c.html(`
    <div class="modal-header">
      <h3 class="text-lg font-semibold text-gray-900">Register New AI System</h3>
    </div>
    <form hx-post="/ai-governance/systems" hx-target="#main-content" hx-swap="outerHTML">
      <div class="modal-body space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">System Name *</label>
            <input type="text" name="name" required class="form-input" 
              placeholder="e.g., Customer Support Chatbot">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">System Type *</label>
            <select name="type" required class="form-select">
              <option value="">Select Type</option>
              ${systemTypes.map(type => `<option value="${type.value}">${type.label}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">System Owner *</label>
            <input type="text" name="owner" required class="form-input" 
              placeholder="e.g., John Doe">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Business Unit *</label>
            <select name="business_unit" required class="form-select">
              <option value="">Select Business Unit</option>
              <option value="IT">Information Technology</option>
              <option value="HR">Human Resources</option>
              <option value="Finance">Finance</option>
              <option value="Marketing">Marketing</option>
              <option value="Operations">Operations</option>
              <option value="Legal">Legal & Compliance</option>
            </select>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Purpose & Description *</label>
          <textarea name="purpose" required rows="3" class="form-textarea" 
            placeholder="Describe the AI system's purpose, functionality, and business objectives..."></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Data Sources</label>
            <textarea name="data_sources" rows="3" class="form-textarea" 
              placeholder="List data sources used by this AI system..."></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Risk Categories</label>
            <div class="space-y-2 max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
              ${riskCategories.map(category => `
                <label class="flex items-center">
                  <input type="checkbox" name="risk_categories" value="${category.value}" class="mr-2">
                  <span class="text-sm">${category.label}</span>
                </label>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Initial Risk Level</label>
            <select name="risk_level" class="form-select">
              <option value="low">Low</option>
              <option value="medium" selected>Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" class="form-select">
              <option value="development" selected>Development</option>
              <option value="testing">Testing</option>
              <option value="production">Production</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Compliance Framework</label>
            <select name="compliance_framework" class="form-select">
              <option value="">None Selected</option>
              <option value="gdpr">GDPR</option>
              <option value="ccpa">CCPA</option>
              <option value="hipaa">HIPAA</option>
              <option value="sox">SOX</option>
              <option value="iso27001">ISO 27001</option>
            </select>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
        <button type="submit" class="btn-primary">Register System</button>
      </div>
    </form>
  `)
})

// Create AI System
app.post('/systems', async (c) => {
  try {
    const formData = await c.req.parseBody()
    
    const system = {
      id: generateId(),
      name: formData.name,
      type: formData.type,
      owner: formData.owner,
      business_unit: formData.business_unit,
      purpose: formData.purpose,
      data_sources: formData.data_sources,
      risk_categories: Array.isArray(formData.risk_categories) ? formData.risk_categories : [formData.risk_categories].filter(Boolean),
      risk_level: formData.risk_level,
      status: formData.status,
      compliance_framework: formData.compliance_framework,
      created_at: new Date().toISOString(),
      last_assessment: null,
      next_review: getNextReviewDate(formData.risk_level)
    }

    // In a real implementation, save to database
    await createAISystem(system)

    return c.html(`
      <div class="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fas fa-check-circle text-green-500"></i>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-800">System Registered Successfully</h3>
            <p class="text-sm text-green-700 mt-1">
              AI System "${system.name}" has been registered and added to the governance registry.
            </p>
          </div>
        </div>
      </div>
      <script>
        setTimeout(() => {
          htmx.ajax('GET', '/ai-governance/systems', {target: '#main-content'});
          closeModal();
        }, 2000);
      </script>
    `)
  } catch (error) {
    return c.html(`
      <div class="bg-red-50 border-l-4 border-red-500 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fas fa-exclamation-circle text-red-500"></i>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Registration Failed</h3>
            <p class="text-sm text-red-700 mt-1">${error.message}</p>
          </div>
        </div>
      </div>
    `)
  }
})

// AI Risk Assessments
app.get('/risk-assessments', async (c) => {
  const assessments = await getAIRiskAssessments()
  
  return c.html(`
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">
            <i class="fas fa-shield-alt mr-3 text-orange-600"></i>AI Risk Assessments
          </h2>
          <p class="text-gray-600 mt-1">Comprehensive risk evaluations for AI systems</p>
        </div>
        <div class="flex space-x-3">
          <button 
            hx-get="/ai-governance/risk-assessments/create"
            hx-target="#modal-content"
            hx-trigger="click"
            class="btn-primary">
            <i class="fas fa-plus mr-2"></i>New Assessment
          </button>
          <button 
            hx-get="/ai-governance/risk-assessments/bulk"
            hx-target="#modal-content"
            hx-trigger="click"
            class="btn-secondary">
            <i class="fas fa-tasks mr-2"></i>Bulk Actions
          </button>
        </div>
      </div>

      <!-- Assessment Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        ${renderAssessmentStats(assessments)}
      </div>

      <!-- Assessment Filters -->
      <div class="bg-white rounded-lg shadow p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input 
              type="text" 
              name="search"
              placeholder="Search assessments..." 
              class="form-input"
              hx-get="/ai-governance/risk-assessments/table"
              hx-target="#assessments-table"
              hx-trigger="keyup changed delay:300ms"
              hx-include="[name='status'], [name='risk_level'], [name='type']">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" class="form-select"
              hx-get="/ai-governance/risk-assessments/table"
              hx-target="#assessments-table"
              hx-trigger="change"
              hx-include="[name='search'], [name='risk_level'], [name='type']">
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Risk Level</label>
            <select name="risk_level" class="form-select"
              hx-get="/ai-governance/risk-assessments/table"
              hx-target="#assessments-table"
              hx-trigger="change"
              hx-include="[name='search'], [name='status'], [name='type']">
              <option value="">All Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Assessment Type</label>
            <select name="type" class="form-select"
              hx-get="/ai-governance/risk-assessments/table"
              hx-target="#assessments-table"
              hx-trigger="change"
              hx-include="[name='search'], [name='status'], [name='risk_level']">
              <option value="">All Types</option>
              <option value="initial">Initial Assessment</option>
              <option value="periodic">Periodic Review</option>
              <option value="change">Change Assessment</option>
              <option value="incident">Incident Response</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Assessments Table -->
      <div id="assessments-table">
        ${renderAssessmentsTable(assessments)}
      </div>
    </div>
  `)
})

// AI Incidents Management
app.get('/incidents', async (c) => {
  const incidents = await getAIIncidents()
  
  return c.html(`
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">
            <i class="fas fa-exclamation-triangle mr-3 text-red-600"></i>AI Incidents
          </h2>
          <p class="text-gray-600 mt-1">Track and manage AI-related security and operational incidents</p>
        </div>
        <div class="flex space-x-3">
          <button 
            hx-get="/ai-governance/incidents/create"
            hx-target="#modal-content"
            hx-trigger="click"
            class="btn-primary">
            <i class="fas fa-plus mr-2"></i>Report Incident
          </button>
          <button 
            hx-get="/ai-governance/incidents/analysis"
            hx-target="#modal-content"
            hx-trigger="click"
            class="btn-secondary">
            <i class="fas fa-chart-bar mr-2"></i>Incident Analysis
          </button>
        </div>
      </div>

      <!-- Incident Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        ${renderIncidentStats(incidents)}
      </div>

      <!-- Active Incidents Alert -->
      ${renderActiveIncidentsAlert(incidents)}

      <!-- Incidents Table -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">All AI Incidents</h3>
        </div>
        <div class="overflow-x-auto">
          ${renderIncidentsTable(incidents)}
        </div>
      </div>
    </div>
  `)
})

// Mock data functions
async function getAIGovernanceDashboard() {
  return {
    summary: {
      totalSystems: 24,
      highRiskSystems: 3,
      activeIncidents: 2,
      overdueAssessments: 5
    },
    riskLevelBreakdown: {
      critical: 2,
      high: 3,
      medium: 12,
      low: 7
    },
    statusBreakdown: {
      development: 6,
      testing: 4,
      production: 12,
      retired: 2
    },
    highRiskSystems: [
      {
        id: '1',
        name: 'Customer Credit Scoring AI',
        owner: 'Jane Smith',
        riskLevel: 'critical',
        lastAssessment: '2024-08-15',
        status: 'production',
        issues: 3
      },
      {
        id: '2', 
        name: 'Automated Trading System',
        owner: 'Mike Johnson',
        riskLevel: 'high',
        lastAssessment: '2024-08-20',
        status: 'production',
        issues: 1
      }
    ]
  }
}

async function getAISystems(filters: any = {}) {
  // Mock data - in real implementation, query from database
  const allSystems = [
    {
      id: '1',
      name: 'Customer Credit Scoring AI',
      type: 'Machine Learning Model',
      owner: 'Jane Smith',
      businessUnit: 'Finance',
      status: 'production',
      riskLevel: 'critical',
      lastAssessment: '2024-08-15',
      nextReview: '2024-11-15',
      complianceFramework: 'GDPR, SOX'
    },
    {
      id: '2',
      name: 'Customer Support Chatbot', 
      type: 'Natural Language Processing',
      owner: 'Bob Wilson',
      businessUnit: 'Customer Service',
      status: 'production',
      riskLevel: 'medium',
      lastAssessment: '2024-09-01',
      nextReview: '2025-03-01',
      complianceFramework: 'GDPR'
    },
    // Add more mock systems...
  ]
  
  return allSystems.filter(system => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      if (!system.name.toLowerCase().includes(searchLower) &&
          !system.owner.toLowerCase().includes(searchLower)) {
        return false
      }
    }
    if (filters.status && system.status !== filters.status) return false
    if (filters.riskLevel && system.riskLevel !== filters.riskLevel) return false
    return true
  })
}

// Helper functions for rendering
function renderAIMetricsCards(summary: any) {
  return `
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center">
        <div class="p-3 bg-purple-100 rounded-lg">
          <i class="fas fa-microchip text-purple-600 text-xl"></i>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Total AI Systems</p>
          <p class="text-2xl font-bold text-gray-900">${summary.totalSystems}</p>
        </div>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center">
        <div class="p-3 bg-red-100 rounded-lg">
          <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">High Risk Systems</p>
          <p class="text-2xl font-bold text-gray-900">${summary.highRiskSystems}</p>
        </div>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center">
        <div class="p-3 bg-yellow-100 rounded-lg">
          <i class="fas fa-bell text-yellow-600 text-xl"></i>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Active Incidents</p>
          <p class="text-2xl font-bold text-gray-900">${summary.activeIncidents}</p>
        </div>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center">
        <div class="p-3 bg-orange-100 rounded-lg">
          <i class="fas fa-clock text-orange-600 text-xl"></i>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Overdue Assessments</p>
          <p class="text-2xl font-bold text-gray-900">${summary.overdueAssessments}</p>
        </div>
      </div>
    </div>
  `
}

function renderHighRiskSystemsTable(systems: any[]) {
  if (!systems.length) {
    return `
      <div class="text-center py-8">
        <i class="fas fa-shield-alt text-4xl text-gray-300 mb-4"></i>
        <p class="text-gray-500">No high-risk systems found</p>
      </div>
    `
  }
  
  return `
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Assessment</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        ${systems.map(system => `
          <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <i class="fas fa-microchip text-gray-400 mr-3"></i>
                <div>
                  <div class="text-sm font-medium text-gray-900">${system.name}</div>
                  <div class="text-sm text-gray-500">ID: ${system.id}</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${system.owner}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full 
                ${system.riskLevel === 'critical' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}">
                ${system.riskLevel.charAt(0).toUpperCase() + system.riskLevel.slice(1)}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${system.lastAssessment}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                ${system.status.charAt(0).toUpperCase() + system.status.slice(1)}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
              <button 
                hx-get="/ai-governance/systems/${system.id}/assess"
                hx-target="#modal-content"
                hx-trigger="click"
                class="text-purple-600 hover:text-purple-900 mr-3">
                Assess
              </button>
              <button 
                hx-get="/ai-governance/systems/${system.id}"
                hx-target="#modal-content"
                hx-trigger="click"
                class="text-blue-600 hover:text-blue-900">
                View
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

function renderAISystemsTable(systems: any[]) {
  if (!systems.length) {
    return `
      <div class="bg-white rounded-lg shadow text-center py-12">
        <i class="fas fa-microchip text-4xl text-gray-300 mb-4"></i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No AI Systems Found</h3>
        <p class="text-gray-500 mb-6">Get started by registering your first AI system.</p>
        <button 
          hx-get="/ai-governance/systems/create"
          hx-target="#modal-content"
          hx-trigger="click"
          class="btn-primary">
          <i class="fas fa-plus mr-2"></i>Register AI System
        </button>
      </div>
    `
  }

  return `
    <div class="bg-white rounded-lg shadow overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Review</th>
            <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${systems.map(system => `
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <i class="fas fa-microchip text-gray-400 mr-3"></i>
                  <div>
                    <div class="text-sm font-medium text-gray-900">${system.name}</div>
                    <div class="text-sm text-gray-500">${system.businessUnit}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${system.type}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${system.owner}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full 
                  ${getRiskLevelColor(system.riskLevel)}">
                  ${system.riskLevel.charAt(0).toUpperCase() + system.riskLevel.slice(1)}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full 
                  ${getStatusColor(system.status)}">
                  ${system.status.charAt(0).toUpperCase() + system.status.slice(1)}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${system.nextReview}</td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                  hx-get="/ai-governance/systems/${system.id}"
                  hx-target="#modal-content"
                  hx-trigger="click"
                  class="text-blue-600 hover:text-blue-900 mr-3">
                  View
                </button>
                <button 
                  hx-get="/ai-governance/systems/${system.id}/edit"
                  hx-target="#modal-content"
                  hx-trigger="click"
                  class="text-gray-600 hover:text-gray-900">
                  Edit
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `
}

// Utility functions
function getRiskLevelColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'critical': return 'bg-red-100 text-red-800'
    case 'high': return 'bg-orange-100 text-orange-800'
    case 'medium': return 'bg-yellow-100 text-yellow-800'
    case 'low': return 'bg-green-100 text-green-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'production': return 'bg-green-100 text-green-800'
    case 'testing': return 'bg-blue-100 text-blue-800'
    case 'development': return 'bg-yellow-100 text-yellow-800'
    case 'retired': return 'bg-gray-100 text-gray-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

function getNextReviewDate(riskLevel: string): string {
  const now = new Date()
  const months = riskLevel === 'critical' ? 3 : riskLevel === 'high' ? 6 : 12
  now.setMonth(now.getMonth() + months)
  return now.toISOString().split('T')[0]
}

// Additional mock data functions
async function getAISystemTypes() {
  return [
    { value: 'machine_learning', label: 'Machine Learning Model' },
    { value: 'nlp', label: 'Natural Language Processing' },
    { value: 'computer_vision', label: 'Computer Vision' },
    { value: 'chatbot', label: 'Chatbot/Virtual Assistant' },
    { value: 'recommendation', label: 'Recommendation Engine' },
    { value: 'predictive_analytics', label: 'Predictive Analytics' },
    { value: 'robotic_process', label: 'Robotic Process Automation' },
    { value: 'expert_system', label: 'Expert System' }
  ]
}

async function getAIRiskCategories() {
  return [
    { value: 'data_privacy', label: 'Data Privacy & Protection' },
    { value: 'algorithmic_bias', label: 'Algorithmic Bias & Fairness' },
    { value: 'explainability', label: 'Explainability & Transparency' },
    { value: 'security', label: 'Cybersecurity & Adversarial Attacks' },
    { value: 'reliability', label: 'Reliability & Robustness' },
    { value: 'regulatory', label: 'Regulatory Compliance' },
    { value: 'ethical', label: 'Ethical Considerations' },
    { value: 'operational', label: 'Operational Risk' }
  ]
}

async function createAISystem(system: any) {
  // Mock implementation - in real app, save to database
  console.log('Creating AI system:', system)
  return system
}

async function getAIRiskAssessments() {
  // Mock data for risk assessments
  return []
}

async function getAIIncidents() {
  // Mock data for AI incidents
  return []
}

function renderAssessmentStats(assessments: any[]) {
  return `
    <div class="bg-white rounded-lg shadow p-4">
      <div class="text-center">
        <p class="text-2xl font-bold text-gray-900">0</p>
        <p class="text-sm text-gray-600">Total Assessments</p>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-4">
      <div class="text-center">
        <p class="text-2xl font-bold text-orange-600">0</p>
        <p class="text-sm text-gray-600">Pending</p>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-4">
      <div class="text-center">
        <p class="text-2xl font-bold text-blue-600">0</p>
        <p class="text-sm text-gray-600">In Progress</p>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-4">
      <div class="text-center">
        <p class="text-2xl font-bold text-green-600">0</p>
        <p class="text-sm text-gray-600">Completed</p>
      </div>
    </div>
  `
}

function renderAssessmentsTable(assessments: any[]) {
  return `
    <div class="bg-white rounded-lg shadow text-center py-12">
      <i class="fas fa-clipboard-list text-4xl text-gray-300 mb-4"></i>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No Risk Assessments Found</h3>
      <p class="text-gray-500 mb-6">Create your first AI risk assessment.</p>
      <button 
        hx-get="/ai-governance/risk-assessments/create"
        hx-target="#modal-content"
        hx-trigger="click"
        class="btn-primary">
        <i class="fas fa-plus mr-2"></i>New Assessment
      </button>
    </div>
  `
}

function renderIncidentStats(incidents: any[]) {
  return `
    <div class="bg-white rounded-lg shadow p-4">
      <div class="text-center">
        <p class="text-2xl font-bold text-gray-900">0</p>
        <p class="text-sm text-gray-600">Total Incidents</p>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-4">
      <div class="text-center">
        <p class="text-2xl font-bold text-red-600">0</p>
        <p class="text-sm text-gray-600">Critical</p>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-4">
      <div class="text-center">
        <p class="text-2xl font-bold text-orange-600">0</p>
        <p class="text-sm text-gray-600">High Priority</p>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-4">
      <div class="text-center">
        <p class="text-2xl font-bold text-blue-600">0</p>
        <p class="text-sm text-gray-600">Open</p>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-4">
      <div class="text-center">
        <p class="text-2xl font-bold text-green-600">0</p>
        <p class="text-sm text-gray-600">Resolved</p>
      </div>
    </div>
  `
}

function renderActiveIncidentsAlert(incidents: any[]) {
  return `
    <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <i class="fas fa-exclamation-triangle text-yellow-400"></i>
        </div>
        <div class="ml-3">
          <p class="text-sm text-yellow-700">
            No active AI incidents requiring immediate attention.
          </p>
        </div>
      </div>
    </div>
  `
}

function renderIncidentsTable(incidents: any[]) {
  return `
    <div class="text-center py-12">
      <i class="fas fa-shield-alt text-4xl text-gray-300 mb-4"></i>
      <h3 class="text-lg font-medium text-gray-900 mb-2">No AI Incidents Reported</h3>
      <p class="text-gray-500 mb-6">All AI systems are operating normally.</p>
      <button 
        hx-get="/ai-governance/incidents/create"
        hx-target="#modal-content"
        hx-trigger="click"
        class="btn-primary">
        <i class="fas fa-plus mr-2"></i>Report Incident
      </button>
    </div>
  `
}

export default app