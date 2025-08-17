// DMT Risk Assessment System v2.0 - Enhanced Risk Management Module  
// Risk Lifecycle Management + AI-Powered Control Mapping
// Integrated with NIST 800-37 RMF and ISO 27001:2022 compliant framework

// Risk Management Enhancement Module
let riskEnhancementData = {
  risks: [],
  riskHistory: [],
  controlMappings: [],
  aiMappingCache: {},
  complianceStandards: {
    'SOC2': {
      name: 'SOC 2',
      categories: ['Security', 'Availability', 'Processing Integrity', 'Confidentiality', 'Privacy']
    },
    'ISO27001': {
      name: 'ISO 27001',
      categories: ['Information Security Policy', 'Organization of Information Security', 'Human Resource Security', 'Asset Management', 'Access Control']
    },
    'NIST': {
      name: 'NIST Framework',
      categories: ['Identify', 'Protect', 'Detect', 'Respond', 'Recover']
    }
  }
};

// Enhanced Risk Form HTML Generator
function getRiskFormHTML(risk = null) {
  const isEdit = risk !== null;
  
  return `
    <div class="modal-form-container">
      <form id="risk-form" class="space-y-6" data-risk-id="${risk?.id || ''}">
        <!-- Basic Risk Information -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 class="text-lg font-medium text-blue-900 mb-4 flex items-center">
          <i class="fas fa-info-circle mr-2"></i>
          Risk Information
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Risk ID *</label>
            <input type="text" id="risk-id" class="form-input" value="${risk?.risk_id || ''}" ${isEdit ? 'readonly' : ''} required>
          </div>
          <div>
            <label class="form-label">Risk Category *</label>
            <select id="risk-category" class="form-select" required onchange="updateAISuggestions()">
              <option value="">Select Category</option>
              <option value="1" ${risk?.category_id === 1 ? 'selected' : ''}>Cybersecurity</option>
              <option value="2" ${risk?.category_id === 2 ? 'selected' : ''}>Data Privacy</option>
              <option value="3" ${risk?.category_id === 3 ? 'selected' : ''}>Operational Risk</option>
              <option value="4" ${risk?.category_id === 4 ? 'selected' : ''}>Financial Risk</option>
              <option value="5" ${risk?.category_id === 5 ? 'selected' : ''}>Regulatory Compliance</option>
              <option value="6" ${risk?.category_id === 6 ? 'selected' : ''}>Third-Party Risk</option>
            </select>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Organization *</label>
            <select id="risk-organization" class="form-select" required>
              <option value="">Select Organization</option>
              <option value="1" ${risk?.organization_id === 1 ? 'selected' : ''}>Default Organization</option>
            </select>
          </div>
          <div>
            <label class="form-label">Risk Owner *</label>
            <select id="risk-owner" class="form-select" required>
              <option value="">Select Owner</option>
              <option value="1" ${risk?.owner_id === 1 ? 'selected' : ''}>Admin User</option>
              <option value="2" ${risk?.owner_id === 2 ? 'selected' : ''}>Avi Security</option>
            </select>
          </div>
        </div>
        
        <div>
          <label class="form-label">Risk Title *</label>
          <input type="text" id="risk-title" class="form-input" value="${risk?.title || ''}" required>
        </div>
        
        <div>
          <label class="form-label">Risk Description *</label>
          <textarea id="risk-description" class="form-input" rows="4" required placeholder="Provide detailed description of the risk scenario and potential impacts...">${risk?.description || ''}</textarea>
          <p class="text-sm text-blue-600 mt-1">
            <i class="fas fa-robot mr-1"></i>
            Detailed descriptions help AI suggest relevant controls automatically
          </p>
        </div>
      </div>
      
      <!-- Risk Assessment -->
      <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h3 class="text-lg font-medium text-orange-900 mb-4 flex items-center">
          <i class="fas fa-chart-line mr-2"></i>
          Risk Assessment
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="form-label">Likelihood (1-5) *</label>
            <select id="risk-probability" class="form-select" required onchange="calculateRiskScore()">
              <option value="">Select</option>
              <option value="1" ${risk?.probability === 1 ? 'selected' : ''}>1 - Very Low (0-5%)</option>
              <option value="2" ${risk?.probability === 2 ? 'selected' : ''}>2 - Low (6-25%)</option>
              <option value="3" ${risk?.probability === 3 ? 'selected' : ''}>3 - Medium (26-50%)</option>
              <option value="4" ${risk?.probability === 4 ? 'selected' : ''}>4 - High (51-75%)</option>
              <option value="5" ${risk?.probability === 5 ? 'selected' : ''}>5 - Very High (76-100%)</option>
            </select>
          </div>
          <div>
            <label class="form-label">Impact (1-5) *</label>
            <select id="risk-impact" class="form-select" required onchange="calculateRiskScore()">
              <option value="">Select</option>
              <option value="1" ${risk?.impact === 1 ? 'selected' : ''}>1 - Minimal</option>
              <option value="2" ${risk?.impact === 2 ? 'selected' : ''}>2 - Minor</option>
              <option value="3" ${risk?.impact === 3 ? 'selected' : ''}>3 - Moderate</option>
              <option value="4" ${risk?.impact === 4 ? 'selected' : ''}>4 - Major</option>
              <option value="5" ${risk?.impact === 5 ? 'selected' : ''}>5 - Severe</option>
            </select>
          </div>
          <div>
            <label class="form-label">Risk Score</label>
            <div id="risk-score-display" class="form-input bg-gray-50 text-center font-bold">
              ${risk?.risk_score || 'Auto-calculated'}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Asset/Service Association -->
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 class="text-lg font-medium text-green-900 mb-4 flex items-center">
          <i class="fas fa-server mr-2"></i>
          Affected Assets/Services
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Primary Asset Type</label>
            <select id="asset-type" class="form-select" onchange="updateAISuggestions()">
              <option value="">Select Asset Type</option>
              <option value="server">Server/Infrastructure</option>
              <option value="database">Database</option>
              <option value="application">Application</option>
              <option value="network">Network Equipment</option>
              <option value="endpoint">Endpoints</option>
              <option value="cloud">Cloud Services</option>
              <option value="data">Data/Information</option>
            </select>
          </div>
          <div>
            <label class="form-label">Service Category</label>
            <select id="service-type" class="form-select" onchange="updateAISuggestions()">
              <option value="">Select Service Type</option>
              <option value="web">Web Services</option>
              <option value="database">Database Services</option>
              <option value="api">API Services</option>
              <option value="authentication">Authentication Services</option>
              <option value="storage">Storage Services</option>
              <option value="communication">Communication Services</option>
              <option value="business">Business Applications</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- Risk Status and Lifecycle -->
      <div class="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h3 class="text-lg font-medium text-purple-900 mb-4 flex items-center">
          <i class="fas fa-tasks mr-2"></i>
          Risk Status & Management
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="form-label">Current Status *</label>
            <select id="risk-status" class="form-select" required onchange="handleStatusChange()">
              <option value="active" ${risk?.status === 'active' ? 'selected' : ''}>Active - Ongoing monitoring required</option>
              <option value="mitigated" ${risk?.status === 'mitigated' ? 'selected' : ''}>Mitigated - Controls implemented</option>
              <option value="accepted" ${risk?.status === 'accepted' ? 'selected' : ''}>Accepted - Risk tolerance acceptable</option>
              <option value="monitoring" ${risk?.status === 'monitoring' ? 'selected' : ''}>Monitoring - Under review</option>
              <option value="closed" ${risk?.status === 'closed' ? 'selected' : ''}>Closed - Risk no longer applicable</option>
            </select>
          </div>
          <div>
            <label class="form-label">Risk Priority</label>
            <select id="risk-priority" class="form-select">
              <option value="low" ${risk?.priority === 'low' ? 'selected' : ''}>Low Priority</option>
              <option value="medium" ${risk?.priority === 'medium' ? 'selected' : ''}>Medium Priority</option>
              <option value="high" ${risk?.priority === 'high' ? 'selected' : ''}>High Priority</option>
              <option value="critical" ${risk?.priority === 'critical' ? 'selected' : ''}>Critical Priority</option>
            </select>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label class="form-label">Next Review Date</label>
            <input type="date" id="next-review-date" class="form-input" value="${risk?.next_review_date ? risk.next_review_date.split('T')[0] : ''}">
          </div>
          <div id="mitigation-date-container" class="hidden">
            <label class="form-label">Expected Mitigation Date</label>
            <input type="date" id="mitigation-date" class="form-input">
          </div>
        </div>
        
        <!-- Status Change Reason (appears when status changes) -->
        <div id="status-change-reason" class="mt-4 hidden">
          <label class="form-label">Reason for Status Change *</label>
          <textarea id="status-reason" class="form-input" rows="3" placeholder="Explain the reason for changing the risk status..."></textarea>
        </div>
      </div>
      
      <!-- AI-Powered Control Mapping -->
      <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <h3 class="text-lg font-medium text-indigo-900 mb-4 flex items-center">
          <i class="fas fa-robot mr-2"></i>
          AI-Powered Control Mapping
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="form-label">Compliance Standard</label>
            <select id="compliance-standard" class="form-select" onchange="generateControlMappings()">
              <option value="">Select Standard for AI Mapping</option>
              <option value="SOC2">SOC 2</option>
              <option value="ISO27001">ISO 27001</option>
              <option value="NIST">NIST Framework</option>
            </select>
          </div>
          <div>
            <button type="button" id="ai-analyze-btn" class="btn-secondary w-full" onclick="analyzeRiskWithAI()">
              <i class="fas fa-brain mr-2"></i>Analyze Risk with AI
            </button>
          </div>
        </div>
        
        <!-- AI Suggestions Container -->
        <div id="ai-suggestions" class="hidden">
          <div class="bg-white border border-indigo-200 rounded p-4">
            <h4 class="font-medium text-gray-900 mb-3 flex items-center">
              <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
              AI-Suggested Control Mappings
            </h4>
            <div id="suggested-controls" class="space-y-2">
              <!-- AI suggestions will be populated here -->
            </div>
            <div class="mt-3 pt-3 border-t border-gray-200">
              <button type="button" class="btn-primary" onclick="applyAISuggestions()">
                <i class="fas fa-check mr-2"></i>Apply Selected Suggestions
              </button>
            </div>
          </div>
        </div>
        
        <!-- Manual Control Selection -->
        <div class="mt-4">
          <label class="form-label">Additional Manual Control Mappings</label>
          <div id="manual-controls" class="space-y-2">
            <!-- Manual control mappings will be added here -->
          </div>
          <button type="button" class="btn-secondary mt-2" onclick="addManualControlMapping()">
            <i class="fas fa-plus mr-2"></i>Add Manual Control Mapping
          </button>
        </div>
      </div>
      
      <!-- Risk Treatment Plan -->
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 class="text-lg font-medium text-yellow-900 mb-4 flex items-center">
          <i class="fas fa-clipboard-list mr-2"></i>
          Treatment Plan & Actions
        </h3>
        
        <div>
          <label class="form-label">Mitigation Strategy</label>
          <textarea id="mitigation-strategy" class="form-input" rows="3" placeholder="Describe the strategy to mitigate this risk...">${risk?.mitigation_strategy || ''}</textarea>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label class="form-label">Treatment Type</label>
            <select id="treatment-type" class="form-select">
              <option value="mitigate">Mitigate - Reduce likelihood/impact</option>
              <option value="accept">Accept - Acknowledge and monitor</option>
              <option value="transfer">Transfer - Insurance/third-party</option>
              <option value="avoid">Avoid - Eliminate the risk source</option>
            </select>
          </div>
          <div>
            <label class="form-label">Priority Level</label>
            <select id="priority-level" class="form-select">
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
              <option value="critical">Critical Priority</option>
            </select>
          </div>
        </div>
        </div>
      </form>
    </div>
    
    <script>
      // Initialize form behavior
      document.addEventListener('DOMContentLoaded', function() {
        calculateRiskScore();
        if (${isEdit}) {
          handleStatusChange();
        }
      });
    </script>
  `;
}

// Enhanced Risk View HTML Generator
function getRiskViewHTML(risk) {
  return `
    <div class="space-y-6">
      <!-- Risk Header -->
      <div class="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-lg">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold">${risk.risk_id} - ${risk.title}</h2>
            <p class="text-blue-100 mt-2">${risk.description}</p>
          </div>
          <div class="text-right">
            <div class="text-3xl font-bold">${risk.risk_score}</div>
            <div class="text-sm text-blue-100">Risk Score</div>
          </div>
        </div>
      </div>
      
      <!-- Risk Status and Actions -->
      <div class="bg-white border rounded-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">Risk Status & Actions</h3>
          <div class="flex space-x-2">
            <button onclick="changeRiskStatus(${risk.id})" class="btn-primary">
              <i class="fas fa-edit mr-2"></i>Update Status
            </button>
            <button onclick="addRiskAction(${risk.id})" class="btn-secondary">
              <i class="fas fa-plus mr-2"></i>Add Action
            </button>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Current Status</label>
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(risk.status)}">
              ${capitalizeFirst(risk.status)}
            </span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Risk Owner</label>
            <p class="text-sm text-gray-900">${risk.first_name} ${risk.last_name}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Next Review</label>
            <p class="text-sm text-gray-900">${formatDate(risk.next_review_date) || 'Not set'}</p>
          </div>
        </div>
      </div>
      
      <!-- Risk Assessment Details -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white border rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Risk Assessment</h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-gray-600">Likelihood:</span>
              <span class="font-medium">${risk.probability}/5</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Impact:</span>
              <span class="font-medium">${risk.impact}/5</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600">Risk Score:</span>
              <span class="font-bold text-lg">${risk.risk_score}</span>
            </div>
          </div>
        </div>
        
        <div class="bg-white border rounded-lg p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">Control Mappings</h3>
          <div id="risk-controls-${risk.id}">
            <button onclick="loadRiskControls(${risk.id})" class="btn-secondary w-full">
              <i class="fas fa-shield-alt mr-2"></i>Load Mapped Controls
            </button>
          </div>
        </div>
      </div>
      
      <!-- Risk History -->
      <div class="bg-white border rounded-lg p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Risk History</h3>
        <div id="risk-history-${risk.id}">
          <button onclick="loadRiskHistory(${risk.id})" class="btn-secondary">
            <i class="fas fa-history mr-2"></i>Load Risk History
          </button>
        </div>
      </div>
    </div>
  `;
}

// Risk Status Change Management
function handleStatusChange() {
  const statusSelect = document.getElementById('risk-status');
  const statusChangeReason = document.getElementById('status-change-reason');
  const mitigationDateContainer = document.getElementById('mitigation-date-container');
  
  if (!statusSelect) return;
  
  const currentStatus = statusSelect.value;
  
  // Show reason field for status changes (except for initial creation)
  if (statusSelect.dataset.originalValue && statusSelect.dataset.originalValue !== currentStatus) {
    statusChangeReason.classList.remove('hidden');
    document.getElementById('status-reason').required = true;
  } else {
    statusChangeReason.classList.add('hidden');
    document.getElementById('status-reason').required = false;
  }
  
  // Show mitigation date for active risks
  if (currentStatus === 'active' || currentStatus === 'mitigated') {
    mitigationDateContainer.classList.remove('hidden');
  } else {
    mitigationDateContainer.classList.add('hidden');
  }
}

// Risk Score Calculation
function calculateRiskScore() {
  const probability = parseInt(document.getElementById('risk-probability')?.value || 0);
  const impact = parseInt(document.getElementById('risk-impact')?.value || 0);
  const score = probability * impact;
  
  const scoreDisplay = document.getElementById('risk-score-display');
  if (scoreDisplay) {
    scoreDisplay.textContent = score || 'Auto-calculated';
    scoreDisplay.className = `form-input bg-gray-50 text-center font-bold ${getRiskScoreColorClass(score)}`;
  }
  
  return score;
}

function getRiskScoreColorClass(score) {
  if (score >= 20) return 'text-red-600 bg-red-50';
  if (score >= 15) return 'text-orange-600 bg-orange-50';
  if (score >= 10) return 'text-yellow-600 bg-yellow-50';
  if (score >= 5) return 'text-blue-600 bg-blue-50';
  return 'text-gray-600 bg-gray-50';
}

// AI-Powered Control Mapping System
async function analyzeRiskWithAI() {
  const analyzeBtn = document.getElementById('ai-analyze-btn');
  const suggestionsContainer = document.getElementById('ai-suggestions');
  const suggestedControlsDiv = document.getElementById('suggested-controls');
  
  if (!analyzeBtn || !suggestionsContainer) return;
  
  // Get risk information
  const riskData = {
    title: document.getElementById('risk-title')?.value,
    description: document.getElementById('risk-description')?.value,
    category: document.getElementById('risk-category')?.value,
    assetType: document.getElementById('asset-type')?.value,
    serviceType: document.getElementById('service-type')?.value,
    complianceStandard: document.getElementById('compliance-standard')?.value
  };
  
  // Validate required fields
  if (!riskData.description || !riskData.complianceStandard) {
    showToast('Please provide risk description and select a compliance standard', 'error');
    return;
  }
  
  // Show loading state
  analyzeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';
  analyzeBtn.disabled = true;
  
  try {
    // Simulate AI analysis (in real implementation, this would call an AI service)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const suggestions = generateAIControlSuggestions(riskData);
    
    // Display suggestions
    suggestedControlsDiv.innerHTML = suggestions.map(control => `
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded border">
        <div class="flex items-center space-x-3">
          <input type="checkbox" id="ai-control-${control.id}" class="form-checkbox" checked>
          <div>
            <div class="font-medium text-gray-900">${control.id} - ${control.name}</div>
            <div class="text-sm text-gray-600">${control.rationale}</div>
            <div class="text-xs text-blue-600 mt-1">Confidence: ${control.confidence}%</div>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryClass(control.category)}">
            ${control.category}
          </span>
        </div>
      </div>
    `).join('');
    
    suggestionsContainer.classList.remove('hidden');
    
  } catch (error) {
    console.error('AI Analysis Error:', error);
    showToast('Failed to analyze risk with AI', 'error');
  } finally {
    analyzeBtn.innerHTML = '<i class="fas fa-brain mr-2"></i>Analyze Risk with AI';
    analyzeBtn.disabled = false;
  }
}

// Generate AI Control Suggestions (Mock Implementation)
function generateAIControlSuggestions(riskData) {
  const controlDatabase = {
    'SOC2': [
      {
        id: 'CC6.1',
        name: 'Logical and Physical Access Controls',
        category: 'Security',
        keywords: ['access', 'authentication', 'authorization', 'login', 'password', 'user', 'permissions']
      },
      {
        id: 'CC6.2',
        name: 'Transmission and Disposal of Confidential Information',
        category: 'Security',
        keywords: ['encryption', 'data', 'transmission', 'disposal', 'confidential', 'secure', 'communication']
      },
      {
        id: 'CC6.3',
        name: 'System Access Monitoring',
        category: 'Security',
        keywords: ['monitoring', 'logging', 'audit', 'tracking', 'surveillance', 'detection']
      },
      {
        id: 'A1.1',
        name: 'System Availability',
        category: 'Availability',
        keywords: ['uptime', 'availability', 'performance', 'capacity', 'redundancy', 'failover']
      },
      {
        id: 'A1.2',
        name: 'System Recovery and Backup',
        category: 'Availability',
        keywords: ['backup', 'recovery', 'restore', 'disaster', 'continuity', 'resilience']
      },
      {
        id: 'PI1.1',
        name: 'Processing Integrity Controls',
        category: 'Processing Integrity',
        keywords: ['validation', 'integrity', 'accuracy', 'completeness', 'processing', 'calculation']
      },
      {
        id: 'C1.1',
        name: 'Confidentiality Controls',
        category: 'Confidentiality',
        keywords: ['confidential', 'sensitive', 'classification', 'protection', 'privacy']
      }
    ],
    'ISO27001': [
      {
        id: 'A.5.1',
        name: 'Information Security Policy',
        category: 'Organizational',
        keywords: ['policy', 'governance', 'management', 'framework', 'security']
      },
      {
        id: 'A.8.1',
        name: 'Asset Management',
        category: 'Asset Management',
        keywords: ['asset', 'inventory', 'classification', 'handling', 'disposal']
      },
      {
        id: 'A.9.1',
        name: 'Access Control Policy',
        category: 'Access Control',
        keywords: ['access', 'control', 'authorization', 'authentication', 'permissions']
      }
    ],
    'NIST': [
      {
        id: 'ID.AM-1',
        name: 'Physical devices and systems are inventoried',
        category: 'Identify',
        keywords: ['inventory', 'asset', 'device', 'system', 'catalog']
      },
      {
        id: 'PR.AC-1',
        name: 'Identities and credentials are managed',
        category: 'Protect',
        keywords: ['identity', 'credential', 'authentication', 'access', 'management']
      }
    ]
  };
  
  const standardControls = controlDatabase[riskData.complianceStandard] || [];
  const riskDescription = riskData.description.toLowerCase();
  
  // Simple keyword matching algorithm (in real implementation, use NLP/ML)
  const suggestions = standardControls
    .map(control => {
      let matchScore = 0;
      let matchedKeywords = [];
      
      control.keywords.forEach(keyword => {
        if (riskDescription.includes(keyword)) {
          matchScore += 10;
          matchedKeywords.push(keyword);
        }
      });
      
      // Boost score based on asset/service type relevance
      if (riskData.assetType && control.keywords.some(k => k.includes(riskData.assetType))) {
        matchScore += 15;
      }
      
      if (matchScore > 0) {
        return {
          ...control,
          confidence: Math.min(95, matchScore + Math.random() * 20),
          rationale: `Relevant keywords found: ${matchedKeywords.join(', ')}. This control addresses similar risk scenarios.`
        };
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 5); // Top 5 suggestions
  
  return suggestions;
}

// Apply AI Suggestions
function applyAISuggestions() {
  const checkboxes = document.querySelectorAll('#suggested-controls input[type="checkbox"]:checked');
  let appliedCount = 0;
  
  checkboxes.forEach(checkbox => {
    const controlId = checkbox.id.replace('ai-control-', '');
    // In real implementation, this would save the control mapping
    appliedCount++;
  });
  
  showToast(`Applied ${appliedCount} AI-suggested control mappings`, 'success');
  
  // Hide suggestions after applying
  document.getElementById('ai-suggestions').classList.add('hidden');
}

// Risk Status Change Workflow
async function changeRiskStatus(riskId) {
  const risk = moduleData.risks?.find(r => r.id === riskId);
  if (!risk) {
    showToast('Risk not found', 'error');
    return;
  }
  
  showModal('Change Risk Status', `
    <form id="status-change-form" class="space-y-4">
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 class="font-medium text-blue-900 mb-2">Current Risk: ${risk.risk_id} - ${risk.title}</h4>
        <p class="text-sm text-blue-700">Current Status: <strong>${capitalizeFirst(risk.status)}</strong></p>
      </div>
      
      <div>
        <label class="form-label">New Status *</label>
        <select id="new-status" class="form-select" required onchange="handleNewStatusSelection()">
          <option value="">Select New Status</option>
          <option value="active" ${risk.status === 'active' ? 'disabled' : ''}>Active - Ongoing monitoring required</option>
          <option value="mitigated" ${risk.status === 'mitigated' ? 'disabled' : ''}>Mitigated - Controls implemented</option>
          <option value="accepted" ${risk.status === 'accepted' ? 'disabled' : ''}>Accepted - Risk tolerance acceptable</option>
          <option value="monitoring" ${risk.status === 'monitoring' ? 'disabled' : ''}>Monitoring - Under review</option>
          <option value="closed" ${risk.status === 'closed' ? 'disabled' : ''}>Closed - Risk no longer applicable</option>
        </select>
      </div>
      
      <div>
        <label class="form-label">Reason for Status Change *</label>
        <textarea id="change-reason" class="form-input" rows="4" required placeholder="Explain the reason for this status change, actions taken, or evidence supporting the change..."></textarea>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label class="form-label">Changed By</label>
          <input type="text" class="form-input bg-gray-50" value="${currentUser?.first_name} ${currentUser?.last_name}" readonly>
        </div>
        <div>
          <label class="form-label">Change Date</label>
          <input type="date" id="change-date" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
        </div>
      </div>
      
      <div id="mitigation-details" class="hidden">
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 class="font-medium text-green-900 mb-3">Mitigation Details</h4>
          <div class="space-y-3">
            <div>
              <label class="form-label">Controls Implemented</label>
              <textarea id="controls-implemented" class="form-input" rows="3" placeholder="List the controls that have been implemented to mitigate this risk..."></textarea>
            </div>
            <div>
              <label class="form-label">Residual Risk Assessment</label>
              <select id="residual-risk" class="form-select">
                <option value="">Select Residual Risk Level</option>
                <option value="low">Low - Risk adequately controlled</option>
                <option value="medium">Medium - Some residual risk remains</option>
                <option value="high">High - Significant risk remains</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div id="acceptance-details" class="hidden">
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 class="font-medium text-yellow-900 mb-3">Risk Acceptance Details</h4>
          <div class="space-y-3">
            <div>
              <label class="form-label">Business Justification</label>
              <textarea id="business-justification" class="form-input" rows="3" placeholder="Explain why this risk is being accepted and the business rationale..."></textarea>
            </div>
            <div>
              <label class="form-label">Approved By</label>
              <select id="approval-authority" class="form-select">
                <option value="">Select Approval Authority</option>
                <option value="cio">CIO</option>
                <option value="ciso">CISO</option>
                <option value="ceo">CEO</option>
                <option value="board">Board of Directors</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </form>
  `, [
    { text: 'Cancel', class: 'btn-secondary', onclick: 'closeModal(this)' },
    { text: 'Update Status', class: 'btn-primary', onclick: `saveRiskStatusChange(${riskId})` }
  ]);
}

// Handle new status selection in change form
function handleNewStatusSelection() {
  const newStatus = document.getElementById('new-status')?.value;
  const mitigationDetails = document.getElementById('mitigation-details');
  const acceptanceDetails = document.getElementById('acceptance-details');
  
  // Hide all conditional sections first
  mitigationDetails?.classList.add('hidden');
  acceptanceDetails?.classList.add('hidden');
  
  // Show relevant sections based on status
  if (newStatus === 'mitigated') {
    mitigationDetails?.classList.remove('hidden');
  } else if (newStatus === 'accepted') {
    acceptanceDetails?.classList.remove('hidden');
  }
}

// Save Risk Status Change
async function saveRiskStatusChange(riskId) {
  const form = document.getElementById('status-change-form');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }
  
  const formData = {
    riskId: riskId,
    newStatus: document.getElementById('new-status').value,
    changeReason: document.getElementById('change-reason').value,
    changeDate: document.getElementById('change-date').value,
    changedBy: currentUser?.id,
    controlsImplemented: document.getElementById('controls-implemented')?.value,
    residualRisk: document.getElementById('residual-risk')?.value,
    businessJustification: document.getElementById('business-justification')?.value,
    approvalAuthority: document.getElementById('approval-authority')?.value
  };
  
  try {
    // In real implementation, this would call the API
    const token = localStorage.getItem('dmt_token');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update risk status in memory
    const risk = moduleData.risks?.find(r => r.id === riskId);
    if (risk) {
      risk.status = formData.newStatus;
      risk.last_updated = new Date().toISOString();
    }
    
    // Add to risk history
    addRiskHistoryEntry(riskId, formData);
    
    showToast('Risk status updated successfully', 'success');
    closeModal();
    
    // Refresh the risks table if currently viewing risks
    if (currentModule === 'risks') {
      await loadRisks();
    }
    
  } catch (error) {
    console.error('Error updating risk status:', error);
    showToast('Failed to update risk status', 'error');
  }
}

// Add Risk History Entry
function addRiskHistoryEntry(riskId, changeData) {
  if (!riskEnhancementData.riskHistory) {
    riskEnhancementData.riskHistory = [];
  }
  
  const historyEntry = {
    id: Date.now(),
    riskId: riskId,
    action: 'status_change',
    oldStatus: moduleData.risks?.find(r => r.id === riskId)?.status,
    newStatus: changeData.newStatus,
    reason: changeData.changeReason,
    changedBy: changeData.changedBy,
    changedAt: changeData.changeDate,
    metadata: {
      controlsImplemented: changeData.controlsImplemented,
      residualRisk: changeData.residualRisk,
      businessJustification: changeData.businessJustification,
      approvalAuthority: changeData.approvalAuthority
    }
  };
  
  riskEnhancementData.riskHistory.push(historyEntry);
  
  // Save to localStorage for demo persistence
  localStorage.setItem('risk_history', JSON.stringify(riskEnhancementData.riskHistory));
}

// Load Risk History
function loadRiskHistory(riskId) {
  const historyContainer = document.getElementById(`risk-history-${riskId}`);
  if (!historyContainer) return;
  
  // Load from localStorage
  const savedHistory = localStorage.getItem('risk_history');
  const allHistory = savedHistory ? JSON.parse(savedHistory) : [];
  const riskHistory = allHistory.filter(h => h.riskId === riskId);
  
  if (riskHistory.length === 0) {
    historyContainer.innerHTML = '<p class="text-gray-600 text-sm">No history entries found</p>';
    return;
  }
  
  const historyHTML = riskHistory
    .sort((a, b) => new Date(b.changedAt) - new Date(a.changedAt))
    .map(entry => `
      <div class="border-l-4 border-blue-500 pl-4 py-3">
        <div class="flex items-center justify-between">
          <div class="font-medium text-gray-900">
            Status changed from <span class="text-orange-600">${capitalizeFirst(entry.oldStatus)}</span> 
            to <span class="text-green-600">${capitalizeFirst(entry.newStatus)}</span>
          </div>
          <div class="text-sm text-gray-500">${formatDate(entry.changedAt)}</div>
        </div>
        <p class="text-sm text-gray-700 mt-1">${entry.reason}</p>
        <div class="text-xs text-gray-500 mt-1">
          Changed by: User ${entry.changedBy}
        </div>
      </div>
    `).join('');
  
  historyContainer.innerHTML = historyHTML;
}

// Additional utility functions
function addRiskAction(riskId) {
  showToast('Add risk action functionality coming soon', 'info');
}

function loadRiskControls(riskId) {
  showToast('Risk control mapping display coming soon', 'info');
}

function addManualControlMapping() {
  showToast('Manual control mapping functionality coming soon', 'info');
}

function updateAISuggestions() {
  // This function would trigger AI analysis when key fields change
  console.log('AI suggestions would be updated here');
}

// Enhanced Risk Form Functions
function getEnhancedRiskFormHTML(risk = null) {
    return getRiskFormHTML(risk);
}

// Safe dropdown population for enhanced risk form
async function populateEnhancedRiskFormDropdowns() {
    try {
        // Populate categories (if element exists)
        const categorySelect = document.getElementById('risk-category');
        if (categorySelect && referenceData?.categories) {
            categorySelect.innerHTML = '<option value="">Select Category</option>';
            referenceData.categories.forEach(category => {
                categorySelect.innerHTML += `<option value="${category.id}">${category.name}</option>`;
            });
        }
        
        // Populate organizations (if element exists)
        const orgSelect = document.getElementById('risk-organization');
        if (orgSelect) {
            orgSelect.innerHTML = '<option value="">Select Organization</option>';
            if (referenceData?.organizations) {
                referenceData.organizations.forEach(org => {
                    orgSelect.innerHTML += `<option value="${org.id}">${org.name}</option>`;
                });
            } else {
                // Fallback options
                orgSelect.innerHTML += '<option value="1">Default Organization</option>';
            }
        }
        
        // Populate users (if element exists)
        const ownerSelect = document.getElementById('risk-owner');
        if (ownerSelect) {
            ownerSelect.innerHTML = '<option value="">Select Owner</option>';
            if (referenceData?.users) {
                referenceData.users.forEach(user => {
                    ownerSelect.innerHTML += `<option value="${user.id}">${user.first_name} ${user.last_name}</option>`;
                });
            } else {
                // Fallback options
                ownerSelect.innerHTML += '<option value="1">Admin User</option>';
                ownerSelect.innerHTML += '<option value="2">Avi Security</option>';
            }
        }
        
        console.log('Enhanced risk form dropdowns populated successfully');
    } catch (error) {
        console.error('Error populating enhanced risk form dropdowns:', error);
    }
}

// Submit risk form function
function submitRiskForm() {
    const form = document.getElementById('risk-form');
    if (form) {
        // Trigger form validation and submission
        if (form.checkValidity()) {
            // Get the current risk ID for editing (if exists)
            const riskId = form.dataset.riskId || null;
            handleEnhancedRiskSubmit(riskId);
        } else {
            form.reportValidity();
        }
    }
}

function submitRiskFormEdit(riskId) {
    const form = document.getElementById('risk-form');
    if (form) {
        // Trigger form validation and submission
        if (form.checkValidity()) {
            handleEnhancedRiskSubmit(riskId);
        } else {
            form.reportValidity();
        }
    }
}

async function handleEnhancedRiskSubmit(riskId = null) {
    const form = document.getElementById('risk-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Get form data
    const formData = {
        risk_id: document.getElementById('risk-id')?.value,
        title: document.getElementById('risk-title')?.value,
        description: document.getElementById('risk-description')?.value,
        category_id: parseInt(document.getElementById('risk-category')?.value),
        organization_id: parseInt(document.getElementById('risk-organization')?.value),
        probability: parseInt(document.getElementById('risk-probability')?.value),
        impact: parseInt(document.getElementById('risk-impact')?.value),
        status: document.getElementById('risk-status')?.value || 'active',
        owner_id: parseInt(document.getElementById('risk-owner')?.value),
        next_review_date: document.getElementById('next-review-date')?.value,
        mitigation_strategy: document.getElementById('mitigation-strategy')?.value,
        asset_type: document.getElementById('asset-type')?.value,
        service_type: document.getElementById('service-type')?.value,
        treatment_type: document.getElementById('treatment-type')?.value,
        priority_level: document.getElementById('priority-level')?.value,
        priority: document.getElementById('risk-priority')?.value
    };
    
    // Calculate enhanced risk score
    formData.risk_score = calculateRiskScore();
    
    try {
        const token = localStorage.getItem('dmt_token');
        const url = riskId ? `/api/risks/${riskId}` : '/api/risks';
        const method = riskId ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(`Risk ${riskId ? 'updated' : 'created'} successfully`, 'success');
            closeModal();
            
            // Refresh the current view
            if (typeof showRisks === 'function') {
                showRisks();
            }
        } else {
            showToast(result.error || `Failed to ${riskId ? 'update' : 'create'} risk`, 'error');
        }
        
    } catch (error) {
        console.error('Error submitting enhanced risk:', error);
        showToast(`Failed to ${riskId ? 'update' : 'create'} risk`, 'error');
    }
}

// Export functions for global access
window.getRiskFormHTML = getRiskFormHTML;
window.getEnhancedRiskFormHTML = getEnhancedRiskFormHTML;
window.handleEnhancedRiskSubmit = handleEnhancedRiskSubmit;
window.populateEnhancedRiskFormDropdowns = populateEnhancedRiskFormDropdowns;
window.submitRiskForm = submitRiskForm;
window.submitRiskFormEdit = submitRiskFormEdit;
window.getRiskViewHTML = getRiskViewHTML;
window.changeRiskStatus = changeRiskStatus;
window.analyzeRiskWithAI = analyzeRiskWithAI;
window.handleStatusChange = handleStatusChange;
window.calculateRiskScore = calculateRiskScore;
window.loadRiskHistory = loadRiskHistory;
window.addRiskAction = addRiskAction;
window.loadRiskControls = loadRiskControls;
window.applyAISuggestions = applyAISuggestions;
window.addManualControlMapping = addManualControlMapping;
window.updateAISuggestions = updateAISuggestions;
window.handleNewStatusSelection = handleNewStatusSelection;
window.saveRiskStatusChange = saveRiskStatusChange;
window.generateControlMappings = () => showToast('Control mappings functionality enhanced - see AI analysis', 'info');
// Enhanced Risk Framework Integration
// Override the standard risk form with the enhanced NIST/ISO compliant version
function createEnhancedRisk() {
    if (typeof getEnhancedRiskFormHTML === 'function') {
        const content = getEnhancedRiskFormHTML();
        const buttons = [
            { text: 'Cancel', class: 'btn-secondary', onclick: 'closeModal(this)' },
            { text: 'Create Risk', class: 'btn-primary', onclick: 'submitRiskForm()' }
        ];
        const modal = createModal('Create Enhanced Risk Assessment', content, buttons);
        document.body.appendChild(modal);
        
        // Wait for modal to be added to DOM, then populate dropdowns
        setTimeout(async () => {
            // Use safe dropdown population
            await populateEnhancedRiskFormDropdowns();
            
            // Handle form submission with enhanced framework
            const form = document.getElementById('risk-form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await handleEnhancedRiskSubmit();
                });
            }
        }, 100);
    } else {
        // Fallback to standard form if enhanced framework not loaded
        console.warn('Enhanced risk framework not loaded, using standard form');
        const content = getRiskFormHTML();
        const buttons = [
            { text: 'Cancel', class: 'btn-secondary', onclick: 'closeModal(this)' },
            { text: 'Create Risk', class: 'btn-primary', onclick: 'submitRiskForm()' }
        ];
        const modal = createModal('Create Risk Assessment', content, buttons);
        document.body.appendChild(modal);
        
        setTimeout(async () => {
            // Use safe dropdown population
            await populateEnhancedRiskFormDropdowns();
            
            const form = document.getElementById('risk-form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await handleRiskSubmit();
                });
            }
        }, 100);
    }
}

function editEnhancedRisk(riskId) {
    const risks = JSON.parse(localStorage.getItem('risks') || '[]');
    const risk = risks.find(r => r.id === riskId || r.risk_id === riskId);
    
    if (!risk) {
        showToast('Risk not found', 'error');
        return;
    }
    
    if (typeof getEnhancedRiskFormHTML === 'function') {
        const content = getEnhancedRiskFormHTML(risk);
        const buttons = [
            { text: 'Cancel', class: 'btn-secondary', onclick: 'closeModal(this)' },
            { text: 'Update Risk', class: 'btn-primary', onclick: `submitRiskFormEdit(${riskId})` }
        ];
        const modal = createModal('Edit Enhanced Risk Assessment', content, buttons);
        document.body.appendChild(modal);
        
        setTimeout(async () => {
            // Use safe dropdown population
            await populateEnhancedRiskFormDropdowns();
            
            // Handle form submission with enhanced framework
            const form = document.getElementById('risk-form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await handleEnhancedRiskSubmit(riskId);
                });
            }
        }, 100);
    } else {
        // Fallback to standard form
        console.warn('Enhanced risk framework not loaded, using standard form');
        const content = getRiskFormHTML(risk);
        const buttons = [
            { text: 'Cancel', class: 'btn-secondary', onclick: 'closeModal(this)' },
            { text: 'Update Risk', class: 'btn-primary', onclick: `submitRiskFormEdit(${riskId})` }
        ];
        const modal = createModal('Edit Risk Assessment', content, buttons);
        document.body.appendChild(modal);
        
        setTimeout(() => {
            const form = document.getElementById('risk-form');
            if (form) {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    await handleRiskSubmit(riskId);
                });
            }
        }, 100);
    }
}

// Override global functions to use enhanced versions
window.createEnhancedRisk = createEnhancedRisk;
window.editEnhancedRisk = editEnhancedRisk;
window.showAddRiskModal = createEnhancedRisk;

// Auto-upgrade existing functions if enhanced framework is available
document.addEventListener('DOMContentLoaded', function() {
    if (typeof IntegratedRiskFramework !== 'undefined') {
        console.log('Enhanced Risk Framework detected, enabling advanced features');
        
        // Replace standard risk creation with enhanced version
        if (window.showAddRiskModal) {
            window.showAddRiskModal = createEnhancedRisk;
        }
        if (window.createRisk) {
            window.createRisk = createEnhancedRisk;
        }
        
        // Replace standard risk editing with enhanced version  
        if (window.editRisk) {
            window.editRisk = editEnhancedRisk;
        }
    } else {
        console.log('Standard risk framework in use');
    }
});
