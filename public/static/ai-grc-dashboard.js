// AI GRC Dashboard - Frontend Components
// Asset Risk Analysis, Service Risk Management, and Dynamic Risk Assessment

// ====================
// AI GRC DASHBOARD MAIN
// ====================

function initializeAIGRCDashboard() {
  console.log('🤖 Initializing AI GRC Dashboard');
  
  // Initialize dashboard tabs
  setupAIGRCTabs();
  
  // Load initial data
  loadAIGRCOverview();
}

function setupAIGRCTabs() {
  const tabsHTML = `
    <div class="ai-grc-tabs border-b border-gray-200 mb-6">
      <nav class="-mb-px flex space-x-8">
        <button class="ai-grc-tab-btn active border-blue-500 text-blue-600 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm" data-tab="overview">
          <i class="fas fa-chart-pie mr-2"></i>Overview
        </button>
        <button class="ai-grc-tab-btn border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm" data-tab="assets">
          <i class="fas fa-server mr-2"></i>Asset Risk Analysis
        </button>
        <button class="ai-grc-tab-btn border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm" data-tab="services">
          <i class="fas fa-cogs mr-2"></i>Service Risk Analysis
        </button>
        <button class="ai-grc-tab-btn border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm" data-tab="dynamic">
          <i class="fas fa-bolt mr-2"></i>Dynamic Risk Assessment
        </button>
        <button class="ai-grc-tab-btn border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm" data-tab="vulnerabilities">
          <i class="fas fa-shield-alt mr-2"></i>Vulnerability Management
        </button>
        <button class="ai-grc-tab-btn border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm" data-tab="settings">
          <i class="fas fa-cog mr-2"></i>AI Configuration
        </button>
      </nav>
    </div>
    
    <div id="ai-grc-content" class="ai-grc-content">
      <!-- Content will be loaded here -->
    </div>
  `;

  const container = document.getElementById('dashboard-content');
  if (container) {
    container.innerHTML = tabsHTML;
    
    // Add tab click handlers
    document.querySelectorAll('.ai-grc-tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const tabName = btn.getAttribute('data-tab');
        switchAIGRCTab(tabName);
      });
    });
  }
}

function switchAIGRCTab(tabName) {
  // Update tab active states
  document.querySelectorAll('.ai-grc-tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === tabName) {
      btn.classList.add('active', 'border-blue-500', 'text-blue-600');
      btn.classList.remove('border-transparent', 'text-gray-500');
    } else {
      btn.classList.remove('active', 'border-blue-500', 'text-blue-600');
      btn.classList.add('border-transparent', 'text-gray-500');
    }
  });

  // Load tab content
  switch (tabName) {
    case 'overview':
      loadAIGRCOverview();
      break;
    case 'assets':
      loadAssetRiskAnalysis();
      break;
    case 'services':
      loadServiceRiskAnalysis();
      break;
    case 'dynamic':
      loadDynamicRiskAssessment();
      break;
    case 'vulnerabilities':
      loadVulnerabilityManagement();
      break;
    case 'settings':
      loadAIGRCSettings();
      break;
  }
}

// ====================
// OVERVIEW DASHBOARD
// ====================

async function loadAIGRCOverview() {
  const contentDiv = document.getElementById('ai-grc-content');
  contentDiv.innerHTML = createLoadingSpinner('Loading AI GRC Overview...');

  try {
    const [assetDashboard, serviceDashboard, queueStatus] = await Promise.all([
      fetchWithAuth('/api/ai-grc/assets/risk-dashboard'),
      fetchWithAuth('/api/ai-grc/services/risk-dashboard'),
      fetchWithAuth('/api/ai-grc/ai-analysis/queue')
    ]);

    const overviewHTML = `
      <div class="space-y-6">
        <!-- AI Engine Header -->
        <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div class="flex justify-between items-center">
            <div>
              <h2 class="text-2xl font-bold mb-2">🤖 AI Engine Intelligence</h2>
              <p class="text-blue-100">Advanced risk analysis with Microsoft Defender integration</p>
            </div>
            <div class="text-right">
              <div class="text-3xl font-bold">${new Date().toLocaleDateString()}</div>
              <div class="text-blue-100">Last Updated: ${new Date().toLocaleTimeString()}</div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button onclick="triggerAssetAnalysis()" class="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border-2 border-dashed border-blue-200 text-center transition-colors">
            <i class="fas fa-server text-2xl text-blue-600 mb-2"></i>
            <div class="font-medium text-gray-900">Analyze Assets</div>
            <div class="text-sm text-gray-500">AI-powered asset risk analysis</div>
          </button>
          
          <button onclick="triggerServiceAnalysis()" class="p-4 bg-green-50 hover:bg-green-100 rounded-lg border-2 border-dashed border-green-200 text-center transition-colors">
            <i class="fas fa-cogs text-2xl text-green-600 mb-2"></i>
            <div class="font-medium text-gray-900">Analyze Services</div>
            <div class="text-sm text-gray-500">Service dependency risk analysis</div>
          </button>
          
          <button onclick="triggerDynamicRiskAnalysis()" class="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border-2 border-dashed border-purple-200 text-center transition-colors">
            <i class="fas fa-bolt text-2xl text-purple-600 mb-2"></i>
            <div class="font-medium text-gray-900">Dynamic Risks</div>
            <div class="text-sm text-gray-500">Real-time risk assessment</div>
          </button>
          
          <button onclick="syncDefenderData()" class="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg border-2 border-dashed border-orange-200 text-center transition-colors">
            <i class="fas fa-sync text-2xl text-orange-600 mb-2"></i>
            <div class="font-medium text-gray-900">Sync Defender</div>
            <div class="text-sm text-gray-500">Microsoft Defender integration</div>
          </button>
        </div>

        <!-- Risk Distribution Overview -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Asset Risk Distribution -->
          <div class="bg-white p-6 rounded-lg shadow">
            <h3 class="text-lg font-semibold mb-4">Asset Risk Distribution</h3>
            <div id="asset-risk-chart" style="height: 300px;"></div>
            <div class="mt-4 grid grid-cols-4 gap-4 text-center">
              ${generateRiskDistributionStats(assetDashboard.data?.risk_distribution || [])}
            </div>
          </div>

          <!-- Service Risk Distribution -->
          <div class="bg-white p-6 rounded-lg shadow">
            <h3 class="text-lg font-semibold mb-4">Service Risk Distribution</h3>
            <div id="service-risk-chart" style="height: 300px;"></div>
            <div class="mt-4 grid grid-cols-4 gap-4 text-center">
              ${generateRiskDistributionStats(serviceDashboard.data?.risk_distribution || [])}
            </div>
          </div>
        </div>

        <!-- Top Risk Items -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Top Risk Assets -->
          <div class="bg-white p-6 rounded-lg shadow">
            <h3 class="text-lg font-semibold mb-4">Top Risk Assets</h3>
            <div class="space-y-3">
              ${generateTopRiskAssets(assetDashboard.data?.top_risk_assets || [])}
            </div>
          </div>

          <!-- Critical Services -->
          <div class="bg-white p-6 rounded-lg shadow">
            <h3 class="text-lg font-semibold mb-4">Critical Services</h3>
            <div class="space-y-3">
              ${generateCriticalServices(serviceDashboard.data?.critical_services || [])}
            </div>
          </div>
        </div>

        <!-- Analysis Queue Status -->
        <div class="bg-white p-6 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-4">AI Analysis Queue Status</h3>
          ${generateQueueStatus(queueStatus.data)}
        </div>
      </div>
    `;

    contentDiv.innerHTML = overviewHTML;
    
    // Render charts
    renderAssetRiskChart(assetDashboard.data?.risk_distribution || []);
    renderServiceRiskChart(serviceDashboard.data?.risk_distribution || []);

  } catch (error) {
    console.error('Failed to load AI GRC overview:', error);
    contentDiv.innerHTML = createErrorMessage('Failed to load AI GRC overview');
  }
}

function generateRiskDistributionStats(distribution) {
  const riskLevels = ['critical', 'high', 'medium', 'low'];
  const colors = {
    critical: 'text-red-600 bg-red-50',
    high: 'text-orange-600 bg-orange-50',
    medium: 'text-yellow-600 bg-yellow-50',
    low: 'text-green-600 bg-green-50'
  };

  return riskLevels.map(level => {
    const count = distribution.find(d => d.ai_risk_level === level)?.count || 0;
    return `
      <div class="p-3 rounded-lg ${colors[level]}">
        <div class="text-2xl font-bold">${count}</div>
        <div class="text-sm capitalize">${level}</div>
      </div>
    `;
  }).join('');
}

function generateTopRiskAssets(assets) {
  if (assets.length === 0) {
    return '<div class="text-gray-500 text-center py-4">No asset risk data available</div>';
  }

  return assets.map(asset => `
    <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
      <div class="flex-1">
        <div class="font-medium">${asset.name}</div>
        <div class="text-sm text-gray-500">${asset.asset_type} • ${asset.vulnerability_count || 0} vulnerabilities</div>
      </div>
      <div class="text-right">
        <div class="text-sm font-medium text-${getRiskColor(asset.ai_risk_level)}-600">
          ${(asset.ai_risk_score || 0).toFixed(1)}
        </div>
        <div class="text-xs text-gray-400 uppercase">${asset.ai_risk_level || 'unknown'}</div>
      </div>
    </div>
  `).join('');
}

function generateCriticalServices(services) {
  if (services.length === 0) {
    return '<div class="text-gray-500 text-center py-4">No critical services identified</div>';
  }

  return services.map(service => `
    <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
      <div class="flex-1">
        <div class="font-medium">${service.name}</div>
        <div class="text-sm text-gray-500">${service.service_type} • ${service.criticality} criticality</div>
      </div>
      <div class="text-right">
        <div class="text-sm font-medium text-${getRiskColor(service.ai_risk_level)}-600">
          ${(service.ai_risk_score || 0).toFixed(1)}
        </div>
        <div class="text-xs text-gray-400 uppercase">${service.ai_risk_level || 'unknown'}</div>
      </div>
    </div>
  `).join('');
}

function generateQueueStatus(queueData) {
  if (!queueData || !queueData.queue_status) {
    return '<div class="text-gray-500">Queue status unavailable</div>';
  }

  const statusSummary = queueData.queue_status.reduce((acc, item) => {
    if (!acc[item.status]) acc[item.status] = 0;
    acc[item.status] += item.count;
    return acc;
  }, {});

  const pendingCount = queueData.pending_items?.length || 0;

  return `
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="text-center p-4 bg-blue-50 rounded-lg">
        <div class="text-2xl font-bold text-blue-600">${statusSummary.pending || 0}</div>
        <div class="text-sm text-gray-600">Pending</div>
      </div>
      <div class="text-center p-4 bg-yellow-50 rounded-lg">
        <div class="text-2xl font-bold text-yellow-600">${statusSummary.processing || 0}</div>
        <div class="text-sm text-gray-600">Processing</div>
      </div>
      <div class="text-center p-4 bg-green-50 rounded-lg">
        <div class="text-2xl font-bold text-green-600">${statusSummary.completed || 0}</div>
        <div class="text-sm text-gray-600">Completed</div>
      </div>
      <div class="text-center p-4 bg-red-50 rounded-lg">
        <div class="text-2xl font-bold text-red-600">${statusSummary.failed || 0}</div>
        <div class="text-sm text-gray-600">Failed</div>
      </div>
    </div>
    
    ${pendingCount > 0 ? `
    <div class="mt-4">
      <button onclick="processAnalysisQueue()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        <i class="fas fa-play mr-2"></i>Process Queue (${pendingCount} items)
      </button>
    </div>
    ` : ''}
  `;
}

// ====================
// ASSET RISK ANALYSIS
// ====================

async function loadAssetRiskAnalysis() {
  const contentDiv = document.getElementById('ai-grc-content');
  contentDiv.innerHTML = createLoadingSpinner('Loading Asset Risk Analysis...');

  try {
    const dashboard = await fetchWithAuth('/api/ai-grc/assets/risk-dashboard');
    
    const assetAnalysisHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h2 class="text-2xl font-bold text-gray-900">🖥️ AI Engine Asset Analysis</h2>
          <div class="flex space-x-3">
            <button onclick="analyzeAllAssets()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              <i class="fas fa-brain mr-2"></i>Analyze All Assets
            </button>
            <button onclick="exportAssetRisks()" class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              <i class="fas fa-download mr-2"></i>Export Report
            </button>
          </div>
        </div>

        <!-- Asset Risk Metrics -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          ${generateAssetRiskMetrics(dashboard.data)}
        </div>

        <!-- Asset Risk Table -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold">Asset Risk Assessment Results</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Risk Score</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vulnerabilities</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Incidents</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Analysis</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody id="asset-risk-table-body" class="bg-white divide-y divide-gray-200">
                ${generateAssetRiskTableRows(dashboard.data?.top_risk_assets || [])}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Vulnerability Summary -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold">Vulnerability Summary</h3>
          </div>
          <div class="p-6">
            ${generateVulnerabilitySummary(dashboard.data?.vulnerability_summary || [])}
          </div>
        </div>
      </div>
    `;

    contentDiv.innerHTML = assetAnalysisHTML;
  } catch (error) {
    console.error('Failed to load asset risk analysis:', error);
    contentDiv.innerHTML = createErrorMessage('Failed to load asset risk analysis');
  }
}

function generateAssetRiskMetrics(data) {
  const distribution = data?.risk_distribution || [];
  const total = distribution.reduce((sum, item) => sum + item.count, 0);
  const critical = distribution.find(d => d.ai_risk_level === 'critical')?.count || 0;
  const high = distribution.find(d => d.ai_risk_level === 'high')?.count || 0;
  const vulnerabilities = data?.vulnerability_summary || [];
  const activeVulns = vulnerabilities.filter(v => v.status === 'active').reduce((sum, v) => sum + v.count, 0);

  return `
    <div class="bg-white p-6 rounded-lg shadow">
      <div class="text-2xl font-bold text-gray-900">${total}</div>
      <div class="text-sm text-gray-500">Total Assets</div>
      <div class="mt-2 flex items-center text-green-600">
        <i class="fas fa-server mr-1"></i>
        <span class="text-xs">Under AI Analysis</span>
      </div>
    </div>
    
    <div class="bg-white p-6 rounded-lg shadow">
      <div class="text-2xl font-bold text-red-600">${critical}</div>
      <div class="text-sm text-gray-500">Critical Risk</div>
      <div class="mt-2 flex items-center text-red-600">
        <i class="fas fa-exclamation-triangle mr-1"></i>
        <span class="text-xs">Immediate Attention</span>
      </div>
    </div>
    
    <div class="bg-white p-6 rounded-lg shadow">
      <div class="text-2xl font-bold text-orange-600">${high}</div>
      <div class="text-sm text-gray-500">High Risk</div>
      <div class="mt-2 flex items-center text-orange-600">
        <i class="fas fa-exclamation mr-1"></i>
        <span class="text-xs">Action Required</span>
      </div>
    </div>
    
    <div class="bg-white p-6 rounded-lg shadow">
      <div class="text-2xl font-bold text-purple-600">${activeVulns}</div>
      <div class="text-sm text-gray-500">Active Vulnerabilities</div>
      <div class="mt-2 flex items-center text-purple-600">
        <i class="fas fa-shield-alt mr-1"></i>
        <span class="text-xs">Defender Data</span>
      </div>
    </div>
  `;
}

function generateAssetRiskTableRows(assets) {
  if (assets.length === 0) {
    return '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">No asset risk data available</td></tr>';
  }

  return assets.map(asset => `
    <tr class="hover:bg-gray-50">
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <i class="fas fa-server text-gray-400 mr-3"></i>
          <div>
            <div class="text-sm font-medium text-gray-900">${asset.name}</div>
            <div class="text-xs text-gray-500">${asset.asset_id}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">${asset.asset_type}</span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <div class="text-sm font-medium text-${getRiskColor(asset.ai_risk_level)}-600">
            ${(asset.ai_risk_score || 0).toFixed(1)}
          </div>
          <span class="ml-2 px-2 py-1 text-xs font-medium bg-${getRiskColor(asset.ai_risk_level)}-100 text-${getRiskColor(asset.ai_risk_level)}-800 rounded uppercase">
            ${asset.ai_risk_level || 'unknown'}
          </span>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-900">${asset.vulnerability_count || 0}</div>
        <div class="text-xs text-red-600">${asset.critical_vulnerability_count || 0} critical</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="text-sm text-gray-900">${asset.incident_count || 0}</div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${asset.last_ai_analysis ? formatDateTime(asset.last_ai_analysis) : 'Never'}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button onclick="analyzeAsset('${asset.asset_id}')" class="text-blue-600 hover:text-blue-900 mr-3">
          <i class="fas fa-brain"></i>
        </button>
        <button onclick="viewAssetDetails('${asset.asset_id}')" class="text-gray-600 hover:text-gray-900">
          <i class="fas fa-eye"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

// ====================
// HELPER FUNCTIONS
// ====================

function getRiskColor(riskLevel) {
  const colors = {
    critical: 'red',
    high: 'orange',
    medium: 'yellow',
    low: 'green'
  };
  return colors[riskLevel] || 'gray';
}

function formatDateTime(dateString) {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
}

function createLoadingSpinner(message = 'Loading...') {
  return `
    <div class="flex items-center justify-center p-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
      <span class="text-gray-600">${message}</span>
    </div>
  `;
}

function createErrorMessage(message) {
  return `
    <div class="bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex">
        <i class="fas fa-exclamation-circle text-red-400 mr-3 mt-1"></i>
        <div class="text-red-800">${message}</div>
      </div>
    </div>
  `;
}

// ====================
// ACTION HANDLERS
// ====================

async function triggerAssetAnalysis() {
  try {
    showToast('Triggering bulk asset analysis...', 'info');
    
    // Get all asset IDs
    const assetsResponse = await fetchWithAuth('/api/assets');
    const assetIds = assetsResponse.data.map(asset => asset.asset_id);
    
    if (assetIds.length === 0) {
      showToast('No assets found to analyze', 'warning');
      return;
    }

    const response = await fetchWithAuth('/api/ai-grc/assets/analyze-bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_ids: assetIds, priority: 'high' })
    });

    if (response.success) {
      showToast(`${response.data.queued_count} asset analyses queued successfully`, 'success');
      setTimeout(() => loadAIGRCOverview(), 2000); // Refresh after 2 seconds
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Asset analysis trigger failed:', error);
    showToast('Failed to trigger asset analysis', 'error');
  }
}

async function triggerServiceAnalysis() {
  try {
    showToast('Triggering service analysis...', 'info');
    
    const servicesResponse = await fetchWithAuth('/api/services');
    const serviceIds = servicesResponse.data.map(service => service.service_id);
    
    if (serviceIds.length === 0) {
      showToast('No services found to analyze', 'warning');
      return;
    }

    // Services don't have bulk analysis yet, so analyze one by one
    for (const serviceId of serviceIds.slice(0, 5)) { // Limit to first 5
      await fetchWithAuth(`/api/ai-grc/services/${serviceId}/analyze`, {
        method: 'POST'
      });
    }

    showToast('Service analyses started', 'success');
    setTimeout(() => loadAIGRCOverview(), 3000);
  } catch (error) {
    console.error('Service analysis trigger failed:', error);
    showToast('Failed to trigger service analysis', 'error');
  }
}

async function triggerDynamicRiskAnalysis() {
  try {
    showToast('Triggering dynamic risk analysis...', 'info');
    
    const risksResponse = await fetchWithAuth('/api/risks');
    const riskIds = risksResponse.data.slice(0, 10).map(risk => risk.id); // Limit to first 10

    const response = await fetchWithAuth('/api/ai-grc/risks/dynamic-analysis-bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ risk_ids: riskIds, priority: 'high' })
    });

    if (response.success) {
      showToast(`${response.data.queued_count} dynamic risk analyses queued`, 'success');
      setTimeout(() => loadAIGRCOverview(), 2000);
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Dynamic risk analysis trigger failed:', error);
    showToast('Failed to trigger dynamic risk analysis', 'error');
  }
}

async function processAnalysisQueue() {
  try {
    showToast('Processing analysis queue...', 'info');
    
    const response = await fetchWithAuth('/api/ai-grc/ai-analysis/process-queue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ batch_size: 10 })
    });

    if (response.success) {
      showToast(`Processed ${response.data.processed} analyses`, 'success');
      setTimeout(() => loadAIGRCOverview(), 3000);
    } else {
      throw new Error(response.error);
    }
  } catch (error) {
    console.error('Queue processing failed:', error);
    showToast('Failed to process analysis queue', 'error');
  }
}

async function syncDefenderData() {
  showToast('Microsoft Defender sync not yet implemented', 'info');
  // This would integrate with the DefenderIntegrationService
  // await fetchWithAuth('/api/ai-grc/defender/sync', { method: 'POST' });
}

// Chart rendering functions (using Chart.js)
function renderAssetRiskChart(data) {
  const ctx = document.getElementById('asset-risk-chart');
  if (!ctx) return;

  const chartData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [{
      data: [
        data.find(d => d.ai_risk_level === 'critical')?.count || 0,
        data.find(d => d.ai_risk_level === 'high')?.count || 0,
        data.find(d => d.ai_risk_level === 'medium')?.count || 0,
        data.find(d => d.ai_risk_level === 'low')?.count || 0
      ],
      backgroundColor: ['#dc2626', '#ea580c', '#d97706', '#65a30d'],
      borderWidth: 0
    }]
  };

  new Chart(ctx, {
    type: 'doughnut',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

function renderServiceRiskChart(data) {
  const ctx = document.getElementById('service-risk-chart');
  if (!ctx) return;

  const chartData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [{
      data: [
        data.find(d => d.ai_risk_level === 'critical')?.count || 0,
        data.find(d => d.ai_risk_level === 'high')?.count || 0,
        data.find(d => d.ai_risk_level === 'medium')?.count || 0,
        data.find(d => d.ai_risk_level === 'low')?.count || 0
      ],
      backgroundColor: ['#dc2626', '#ea580c', '#d97706', '#65a30d'],
      borderWidth: 0
    }]
  };

  new Chart(ctx, {
    type: 'doughnut',
    data: chartData,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' }
      }
    }
  });
}

// Placeholder functions for other tabs (to be implemented)
function loadServiceRiskAnalysis() {
  const contentDiv = document.getElementById('ai-grc-content');
  contentDiv.innerHTML = '<div class="p-8 text-center text-gray-500">Service Risk Analysis - Coming Soon</div>';
}

function loadDynamicRiskAssessment() {
  const contentDiv = document.getElementById('ai-grc-content');
  contentDiv.innerHTML = '<div class="p-8 text-center text-gray-500">Dynamic Risk Assessment - Coming Soon</div>';
}

function loadVulnerabilityManagement() {
  const contentDiv = document.getElementById('ai-grc-content');
  contentDiv.innerHTML = '<div class="p-8 text-center text-gray-500">Vulnerability Management - Coming Soon</div>';
}

function loadAIGRCSettings() {
  const contentDiv = document.getElementById('ai-grc-content');
  contentDiv.innerHTML = '<div class="p-8 text-center text-gray-500">AI Configuration - Coming Soon</div>';
}

// Initialize when the module loads
if (typeof window !== 'undefined') {
  window.initializeAIGRCDashboard = initializeAIGRCDashboard;
  window.triggerAssetAnalysis = triggerAssetAnalysis;
  window.triggerServiceAnalysis = triggerServiceAnalysis;
  window.triggerDynamicRiskAnalysis = triggerDynamicRiskAnalysis;
  window.processAnalysisQueue = processAnalysisQueue;
  window.syncDefenderData = syncDefenderData;
}