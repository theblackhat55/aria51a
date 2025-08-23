// AI Governance Module - Frontend Components
// Handles AI system management, risk assessments, and real-time monitoring

class AIGovernanceManager {
  constructor() {
    this.apiBase = '/api/ai-governance';
    this.riskApiBase = '/api/ai-risk';
    this.currentView = null;
    this.refreshInterval = null;
    this.aiSystems = [];
    this.metrics = new Map();
  }

  // Initialize AI Governance module
  async initialize() {
    console.log('Initializing AI Governance module');
    this.setupEventHandlers();
  }

  // Setup event handlers for AI governance navigation
  setupEventHandlers() {
    // Listen for AI governance page navigation
    document.addEventListener('navigate-to-page', async (event) => {
      const page = event.detail.page;
      if (page.startsWith('ai-')) {
        await this.renderAIGovernancePage(page);
      }
    });
  }

  // Main router for AI governance pages
  async renderAIGovernancePage(page) {
    this.currentView = page;
    
    // Clear any existing refresh intervals
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    switch (page) {
      case 'ai-dashboard':
        await this.renderAIDashboard();
        break;
      case 'ai-systems':
        await this.renderAISystemsRegistry();
        break;
      case 'ai-risk-assessments':
        await this.renderRiskAssessments();
        break;
      case 'ai-incidents':
        await this.renderAIIncidents();
        break;
      case 'ai-monitoring':
        await this.renderRealTimeMonitoring();
        break;
      case 'ai-compliance':
        await this.renderComplianceStatus();
        break;
      default:
        await this.renderAIDashboard();
    }
  }

  // AI Governance Dashboard
  async renderAIDashboard() {
    try {
      const dashboardData = await this.fetchDashboardData();
      
      const content = `
        <div class="max-w-7xl mx-auto py-8">
          <!-- Header -->
          <div class="mb-8">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-3xl font-bold text-gray-900">
                  <i class="fas fa-robot mr-3 text-purple-600"></i>AI Governance Dashboard
                </h1>
                <p class="text-gray-600 mt-2">Real-time oversight of AI systems, risks, and compliance</p>
              </div>
              <div class="flex space-x-3">
                <button onclick="aiGovernanceManager.registerNewAISystem()" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors">
                  <i class="fas fa-plus mr-2"></i>Register AI System
                </button>
                <button onclick="aiGovernanceManager.refreshDashboard()" class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors">
                  <i class="fas fa-sync-alt mr-2"></i>Refresh
                </button>
              </div>
            </div>
          </div>

          <!-- Key Metrics -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div class="flex items-center">
                <div class="p-3 bg-purple-100 rounded-lg">
                  <i class="fas fa-microchip text-purple-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Total AI Systems</p>
                  <p class="text-2xl font-bold text-gray-900">${dashboardData.summary.totalSystems}</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div class="flex items-center">
                <div class="p-3 bg-red-100 rounded-lg">
                  <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">High Risk Systems</p>
                  <p class="text-2xl font-bold text-gray-900">${dashboardData.summary.highRiskSystems}</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div class="flex items-center">
                <div class="p-3 bg-yellow-100 rounded-lg">
                  <i class="fas fa-bell text-yellow-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Active Incidents</p>
                  <p class="text-2xl font-bold text-gray-900">${dashboardData.summary.activeIncidents}</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div class="flex items-center">
                <div class="p-3 bg-orange-100 rounded-lg">
                  <i class="fas fa-clock text-orange-600 text-xl"></i>
                </div>
                <div class="ml-4">
                  <p class="text-sm font-medium text-gray-600">Overdue Assessments</p>
                  <p class="text-2xl font-bold text-gray-900">${dashboardData.summary.overdueAssessments}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Charts and Analysis -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <!-- Risk Level Distribution -->
            <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Risk Level Distribution</h3>
              <div class="space-y-3">
                ${this.renderRiskLevelChart(dashboardData.riskLevelBreakdown)}
              </div>
            </div>

            <!-- System Status -->
            <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Operational Status</h3>
              <div class="space-y-3">
                ${this.renderStatusChart(dashboardData.statusBreakdown)}
              </div>
            </div>
          </div>

          <!-- High Risk Systems Table -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900">High Risk AI Systems</h3>
            </div>
            <div class="overflow-x-auto">
              ${this.renderHighRiskSystemsTable(dashboardData.highRiskSystems)}
            </div>
          </div>
        </div>
      `;
      
      document.getElementById('content').innerHTML = content;
      
      // Setup auto-refresh for dashboard
      this.refreshInterval = setInterval(() => this.refreshDashboard(), 30000); // 30 seconds
      
    } catch (error) {
      console.error('Error rendering AI dashboard:', error);
      this.showError('Failed to load AI governance dashboard');
    }
  }

  // AI Systems Registry
  async renderAISystemsRegistry() {
    try {
      const systems = await this.fetchAISystems();
      
      const content = `
        <div class="max-w-7xl mx-auto py-8">
          <!-- Header -->
          <div class="mb-8">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-3xl font-bold text-gray-900">
                  <i class="fas fa-microchip mr-3 text-blue-600"></i>AI Systems Registry
                </h1>
                <p class="text-gray-600 mt-2">Comprehensive inventory of organizational AI systems</p>
              </div>
              <div class="flex space-x-3">
                <button onclick="aiGovernanceManager.registerNewAISystem()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  <i class="fas fa-plus mr-2"></i>Register AI System
                </button>
                <button onclick="aiGovernanceManager.scanForAISystems()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors">
                  <i class="fas fa-search mr-2"></i>Auto-Discover
                </button>
              </div>
            </div>
          </div>

          <!-- Filters -->
          <div class="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
            <div class="flex flex-wrap items-center gap-4">
              <div>
                <label class="text-sm font-medium text-gray-700">Risk Level:</label>
                <select id="risk-filter" class="ml-2 border border-gray-300 rounded px-3 py-1 text-sm">
                  <option value="">All</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700">Status:</label>
                <select id="status-filter" class="ml-2 border border-gray-300 rounded px-3 py-1 text-sm">
                  <option value="">All</option>
                  <option value="production">Production</option>
                  <option value="testing">Testing</option>
                  <option value="development">Development</option>
                </select>
              </div>
              <div>
                <label class="text-sm font-medium text-gray-700">Provider:</label>
                <select id="provider-filter" class="ml-2 border border-gray-300 rounded px-3 py-1 text-sm">
                  <option value="">All</option>
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="google">Google</option>
                  <option value="internal">Internal</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Systems Table -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="overflow-x-auto">
              ${this.renderAISystemsTable(systems)}
            </div>
          </div>
        </div>
      `;
      
      document.getElementById('content').innerHTML = content;
      
      // Setup filter handlers
      this.setupSystemFilters();
      
    } catch (error) {
      console.error('Error rendering AI systems:', error);
      this.showError('Failed to load AI systems registry');
    }
  }

  // Risk Assessments Page
  async renderRiskAssessments() {
    try {
      const assessments = await this.fetchRiskAssessments();
      
      const content = `
        <div class="max-w-7xl mx-auto py-8">
          <!-- Header -->
          <div class="mb-8">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-3xl font-bold text-gray-900">
                  <i class="fas fa-balance-scale mr-3 text-orange-600"></i>AI Risk Assessments
                </h1>
                <p class="text-gray-600 mt-2">Comprehensive risk evaluation and management</p>
              </div>
              <button onclick="aiGovernanceManager.createRiskAssessment()" class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors">
                <i class="fas fa-plus mr-2"></i>New Assessment
              </button>
            </div>
          </div>

          <!-- Assessments Table -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="overflow-x-auto">
              ${this.renderRiskAssessmentsTable(assessments)}
            </div>
          </div>
        </div>
      `;
      
      document.getElementById('content').innerHTML = content;
      
    } catch (error) {
      console.error('Error rendering risk assessments:', error);
      this.showError('Failed to load risk assessments');
    }
  }

  // Real-time Monitoring Page  
  async renderRealTimeMonitoring() {
    try {
      const systems = await this.fetchAISystems();
      
      const content = `
        <div class="max-w-7xl mx-auto py-8">
          <!-- Header -->
          <div class="mb-8">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-3xl font-bold text-gray-900">
                  <i class="fas fa-chart-line mr-3 text-green-600"></i>Real-time AI Monitoring
                </h1>
                <p class="text-gray-600 mt-2">Live performance, bias, and drift monitoring</p>
              </div>
              <div class="flex items-center space-x-3">
                <span class="text-sm text-gray-600">Auto-refresh:</span>
                <div class="flex items-center">
                  <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  <span class="text-sm font-medium text-green-600">Active</span>
                </div>
              </div>
            </div>
          </div>

          <!-- System Selection -->
          <div class="bg-white rounded-lg shadow-sm p-4 mb-6 border border-gray-200">
            <div class="flex items-center gap-4">
              <label class="text-sm font-medium text-gray-700">Select AI System:</label>
              <select id="monitoring-system-select" class="border border-gray-300 rounded px-3 py-2" onchange="aiGovernanceManager.loadSystemMetrics(this.value)">
                <option value="">Choose a system...</option>
                ${systems.map(system => `
                  <option value="${system.id}">${system.name} (${system.system_type})</option>
                `).join('')}
              </select>
            </div>
          </div>

          <!-- Monitoring Dashboard -->
          <div id="monitoring-dashboard" class="hidden">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <!-- Performance Metrics -->
              <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                <canvas id="performance-chart" width="400" height="200"></canvas>
              </div>

              <!-- Bias Detection -->
              <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Bias Monitoring</h3>
                <canvas id="bias-chart" width="400" height="200"></canvas>
              </div>

              <!-- Data Drift -->
              <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Data Drift Detection</h3>
                <canvas id="drift-chart" width="400" height="200"></canvas>
              </div>

              <!-- Usage Statistics -->
              <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">Usage Statistics</h3>
                <canvas id="usage-chart" width="400" height="200"></canvas>
              </div>
            </div>
          </div>

          <!-- No System Selected -->
          <div id="no-system-selected" class="bg-gray-50 rounded-lg p-12 text-center">
            <i class="fas fa-chart-line text-6xl text-gray-300 mb-4"></i>
            <h3 class="text-xl font-semibold text-gray-600 mb-2">Select an AI System to Monitor</h3>
            <p class="text-gray-500">Choose an AI system from the dropdown above to view real-time monitoring data</p>
          </div>
        </div>
      `;
      
      document.getElementById('content').innerHTML = content;
      
      // Setup real-time monitoring
      this.setupRealTimeMonitoring();
      
    } catch (error) {
      console.error('Error rendering monitoring page:', error);
      this.showError('Failed to load monitoring dashboard');
    }
  }

  // Helper method to render risk level chart
  renderRiskLevelChart(riskLevels) {
    if (!riskLevels || riskLevels.length === 0) {
      return '<p class="text-gray-500 text-center py-4">No data available</p>';
    }

    return riskLevels.map(level => {
      const colors = {
        critical: 'bg-red-500',
        high: 'bg-orange-500', 
        medium: 'bg-yellow-500',
        low: 'bg-green-500',
        minimal: 'bg-blue-500'
      };
      
      const total = riskLevels.reduce((sum, l) => sum + l.count, 0);
      const percentage = total > 0 ? Math.round((level.count / total) * 100) : 0;
      
      return `
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="w-4 h-4 ${colors[level.current_risk_level] || 'bg-gray-400'} rounded mr-3"></div>
            <span class="text-sm font-medium capitalize">${level.current_risk_level || 'Unknown'}</span>
          </div>
          <div class="flex items-center">
            <span class="text-sm text-gray-600 mr-2">${level.count}</span>
            <div class="w-16 bg-gray-200 rounded-full h-2">
              <div class="h-2 ${colors[level.current_risk_level] || 'bg-gray-400'} rounded-full" style="width: ${percentage}%"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Helper method to render status chart
  renderStatusChart(statusLevels) {
    if (!statusLevels || statusLevels.length === 0) {
      return '<p class="text-gray-500 text-center py-4">No data available</p>';
    }

    return statusLevels.map(status => {
      const colors = {
        production: 'bg-green-500',
        testing: 'bg-yellow-500',
        development: 'bg-blue-500',
        deprecated: 'bg-gray-500'
      };
      
      const total = statusLevels.reduce((sum, s) => sum + s.count, 0);
      const percentage = total > 0 ? Math.round((status.count / total) * 100) : 0;
      
      return `
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="w-4 h-4 ${colors[status.operational_status] || 'bg-gray-400'} rounded mr-3"></div>
            <span class="text-sm font-medium capitalize">${status.operational_status || 'Unknown'}</span>
          </div>
          <div class="flex items-center">
            <span class="text-sm text-gray-600 mr-2">${status.count}</span>
            <div class="w-16 bg-gray-200 rounded-full h-2">
              <div class="h-2 ${colors[status.operational_status] || 'bg-gray-400'} rounded-full" style="width: ${percentage}%"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  // Helper method to render high risk systems table
  renderHighRiskSystemsTable(systems) {
    if (!systems || systems.length === 0) {
      return `
        <div class="p-8 text-center">
          <i class="fas fa-check-circle text-6xl text-green-300 mb-4"></i>
          <h3 class="text-lg font-semibold text-gray-600 mb-2">No High Risk Systems</h3>
          <p class="text-gray-500">All AI systems are operating within acceptable risk levels.</p>
        </div>
      `;
    }

    return `
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">System Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Level</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${systems.map(system => `
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="flex-shrink-0 h-10 w-10">
                    <div class="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <i class="fas fa-microchip text-purple-600"></i>
                    </div>
                  </div>
                  <div class="ml-4">
                    <div class="text-sm font-medium text-gray-900">${system.name}</div>
                    <div class="text-sm text-gray-500">${system.system_type || 'N/A'}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                ${this.renderRiskBadge(system.current_risk_level)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                ${this.renderStatusBadge(system.operational_status)}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${dayjs(system.created_at).format('MMM DD, YYYY')}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button onclick="aiGovernanceManager.viewSystemDetails(${system.id})" class="text-indigo-600 hover:text-indigo-900">
                  View Details
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // Helper method to render risk badge
  renderRiskBadge(riskLevel) {
    const badges = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800', 
      low: 'bg-green-100 text-green-800',
      minimal: 'bg-blue-100 text-blue-800'
    };
    
    return `
      <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badges[riskLevel] || 'bg-gray-100 text-gray-800'}">
        ${riskLevel ? riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1) : 'Unknown'}
      </span>
    `;
  }

  // Helper method to render status badge  
  renderStatusBadge(status) {
    const badges = {
      production: 'bg-green-100 text-green-800',
      testing: 'bg-yellow-100 text-yellow-800',
      development: 'bg-blue-100 text-blue-800',
      deprecated: 'bg-gray-100 text-gray-800'
    };
    
    return `
      <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${badges[status] || 'bg-gray-100 text-gray-800'}">
        ${status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
      </span>
    `;
  }

  // API Methods
  async fetchDashboardData() {
    const response = await fetch(`${this.apiBase}/dashboard`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch dashboard data');
    }
    
    const result = await response.json();
    return result.data;
  }

  async fetchAISystems() {
    const response = await fetch(`${this.apiBase}/systems`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch AI systems');
    }
    
    const result = await response.json();
    this.aiSystems = result.data;
    return result.data;
  }

  async fetchRiskAssessments() {
    const response = await fetch(`${this.riskApiBase}/assessments`, {
      headers: this.getAuthHeaders()
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch risk assessments');
    }
    
    const result = await response.json();
    return result.data;
  }

  // Utility methods
  getAuthHeaders() {
    const token = localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      'X-Org-ID': '1' // Default org for demo
    };
  }

  showError(message) {
    document.getElementById('content').innerHTML = `
      <div class="max-w-4xl mx-auto py-12 text-center">
        <i class="fas fa-exclamation-triangle text-6xl text-red-300 mb-4"></i>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Error</h2>
        <p class="text-gray-600">${message}</p>
        <button onclick="location.reload()" class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
          Retry
        </button>
      </div>
    `;
  }

  // AI Provider Settings Modal
  showAIProviderSettings() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-96 overflow-y-auto">
        <div class="p-6 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-gray-900">
              <i class="fas fa-robot mr-2 text-purple-600"></i>AI Provider Integrations
            </h2>
            <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <p class="text-gray-600 mt-2">Configure AI service providers for comprehensive governance monitoring and risk assessment.</p>
        </div>
        
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- OpenAI Integration -->
            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center space-x-3 mb-4">
                <div class="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-openai text-green-600"></i>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900">OpenAI</h3>
                  <p class="text-sm text-gray-500">GPT models monitoring</p>
                </div>
              </div>
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input type="password" placeholder="sk-..." class="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Organization ID (Optional)</label>
                  <input type="text" placeholder="org-..." class="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                </div>
              </div>
              <button class="w-full mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium">
                Test Connection
              </button>
            </div>

            <!-- Anthropic Integration -->
            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center space-x-3 mb-4">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-brain text-blue-600"></i>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900">Anthropic</h3>
                  <p class="text-sm text-gray-500">Claude models monitoring</p>
                </div>
              </div>
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input type="password" placeholder="sk-ant-..." class="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Model Version</label>
                  <select class="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                    <option>claude-3-5-sonnet-20241022</option>
                    <option>claude-3-opus-20240229</option>
                    <option>claude-3-haiku-20240307</option>
                  </select>
                </div>
              </div>
              <button class="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium">
                Test Connection
              </button>
            </div>

            <!-- Google AI Integration -->
            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center space-x-3 mb-4">
                <div class="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <i class="fab fa-google text-red-600"></i>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900">Google AI</h3>
                  <p class="text-sm text-gray-500">Gemini models monitoring</p>
                </div>
              </div>
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input type="password" placeholder="AIza..." class="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
                  <input type="text" placeholder="your-project-id" class="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                </div>
              </div>
              <button class="w-full mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm font-medium">
                Test Connection
              </button>
            </div>

            <!-- Azure OpenAI Integration -->
            <div class="border border-gray-200 rounded-lg p-4">
              <div class="flex items-center space-x-3 mb-4">
                <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i class="fab fa-microsoft text-blue-600"></i>
                </div>
                <div>
                  <h3 class="font-semibold text-gray-900">Azure OpenAI</h3>
                  <p class="text-sm text-gray-500">Enterprise AI monitoring</p>
                </div>
              </div>
              <div class="space-y-3">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input type="password" placeholder="..." class="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Endpoint</label>
                  <input type="text" placeholder="https://your-resource.openai.azure.com/" class="w-full border border-gray-300 rounded px-3 py-2 text-sm">
                </div>
              </div>
              <button class="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium">
                Test Connection
              </button>
            </div>
          </div>
          
          <div class="mt-6 pt-6 border-t border-gray-200">
            <div class="flex justify-between items-center">
              <div>
                <h4 class="font-medium text-gray-900">Monitoring Configuration</h4>
                <p class="text-sm text-gray-500">Configure how AI systems are monitored for governance</p>
              </div>
              <div class="flex space-x-3">
                <button onclick="this.closest('.fixed').remove()" class="px-4 py-2 border border-gray-300 rounded text-sm font-medium text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button onclick="aiGovernanceManager.saveAIProviderSettings()" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm font-medium">
                  Save Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
  }

  async saveAIProviderSettings() {
    // TODO: Implement saving AI provider settings
    alert('AI provider settings saved successfully!');
    document.querySelector('.fixed.inset-0').remove();
  }

  // Actions
  async refreshDashboard() {
    if (this.currentView === 'ai-dashboard') {
      await this.renderAIDashboard();
    }
  }

  registerNewAISystem() {
    // TODO: Implement AI system registration modal
    alert('AI System registration modal - To be implemented');
  }

  viewSystemDetails(systemId) {
    // TODO: Implement system details view
    alert(`View details for system ID: ${systemId} - To be implemented`);
  }
}

// Initialize AI Governance Manager
const aiGovernanceManager = new AIGovernanceManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  aiGovernanceManager.initialize();
});