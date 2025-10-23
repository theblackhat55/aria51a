/**
 * Enhanced Risk Forms with AI Analysis and Dynamic Risk Rating
 * 
 * Features:
 * - AI-powered risk analysis using Cloudflare Workers AI
 * - Asset/Service linking with dynamic risk scoring
 * - RMF Hierarchy: Risks → Services → Assets → Incidents/Vulnerabilities
 * - Auto-reclassification based on asset criticality changes
 */

import { html } from 'hono/html';
import { getRiskLevel, renderStatusBadge, renderRiskLevelBadge } from './riskComponents';
import type { RiskRow } from './riskTable';

/**
 * Render enhanced create risk modal with AI analysis and asset linking
 */
export function renderEnhancedCreateRiskModal() {
  return html`
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-5 mx-auto p-0 border w-full max-w-6xl shadow-xl rounded-lg bg-white mb-10">
        <!-- Modal Header -->
        <div class="flex justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-md">
          <div>
            <h3 class="text-lg font-semibold text-gray-900 flex items-center">
              <i class="fas fa-shield-alt text-blue-600 mr-2"></i>
              Create New Risk - Enhanced with AI
            </h3>
            <p class="text-sm text-gray-500 mt-1">Leverage AI analysis and dynamic risk rating based on asset criticality</p>
          </div>
          <button onclick="document.getElementById('modal-container').innerHTML = ''" 
                  class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <div class="flex">
          <!-- Left Column: Form -->
          <div class="w-2/3 max-h-[75vh] overflow-y-auto p-6 border-r">
            <form id="risk-form" 
                  hx-post="/risk-v2/api/create"
                  hx-swap="none"
                  class="space-y-6">
              
              <!-- Basic Information -->
              <div class="border-b pb-4">
                <h4 class="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                  Basic Information
                </h4>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Risk ID -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Risk ID <span class="text-red-500">*</span>
                    </label>
                    <input type="text" 
                           name="riskId" 
                           id="risk-id-input"
                           placeholder="RISK-001"
                           required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <p class="text-xs text-gray-500 mt-1">Format: PREFIX-NUMBER (e.g., RISK-001)</p>
                  </div>

                  <!-- Risk Type -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Risk Type</label>
                    <select name="riskType" 
                            id="risk-type-input"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="operational">Operational</option>
                      <option value="business">Business</option>
                      <option value="technical">Technical</option>
                      <option value="strategic">Strategic</option>
                      <option value="compliance">Compliance</option>
                    </select>
                  </div>

                  <!-- Title -->
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Title <span class="text-red-500">*</span>
                    </label>
                    <input type="text" 
                           name="title" 
                           id="title-input"
                           placeholder="Brief description of the risk"
                           required
                           maxlength="200"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>

                  <!-- Description -->
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Description <span class="text-red-500">*</span>
                    </label>
                    <textarea name="description" 
                              id="description-input"
                              rows="3"
                              placeholder="Detailed description of the risk and its potential impact..."
                              required
                              maxlength="2000"
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                  </div>

                  <!-- Category -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Category <span class="text-red-500">*</span>
                    </label>
                    <select name="category" 
                            id="category-input"
                            required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select category...</option>
                      <option value="strategic">Strategic</option>
                      <option value="operational">Operational</option>
                      <option value="financial">Financial</option>
                      <option value="compliance">Compliance</option>
                      <option value="reputational">Reputational</option>
                      <option value="technology">Technology</option>
                      <option value="cybersecurity">Cybersecurity</option>
                      <option value="environmental">Environmental</option>
                      <option value="legal">Legal</option>
                      <option value="human_resources">Human Resources</option>
                      <option value="supply_chain">Supply Chain</option>
                      <option value="market">Market</option>
                      <option value="credit">Credit</option>
                      <option value="liquidity">Liquidity</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <!-- Status -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select name="status" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="active" selected>Active</option>
                      <option value="pending">Pending</option>
                      <option value="mitigated">Mitigated</option>
                      <option value="monitoring">Monitoring</option>
                      <option value="accepted">Accepted</option>
                      <option value="transferred">Transferred</option>
                      <option value="avoided">Avoided</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- AI Analysis Section -->
              <div class="border-b pb-4">
                <h4 class="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <i class="fas fa-robot text-purple-500 mr-2"></i>
                  AI-Powered Risk Analysis
                </h4>
                
                <button type="button"
                        id="analyze-ai-btn"
                        hx-post="/risk-v2/ui/analyze-ai"
                        hx-include="#title-input, #description-input, #category-input"
                        hx-target="#ai-analysis-result"
                        hx-swap="innerHTML"
                        class="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg font-medium transition-all flex items-center justify-center">
                  <i class="fas fa-magic mr-2"></i>
                  Analyze Risk with AI
                  <span class="ml-2 text-xs bg-white/20 px-2 py-1 rounded">Powered by Cloudflare AI</span>
                </button>
                
                <div id="ai-analysis-result" class="mt-4">
                  <!-- AI analysis results will appear here -->
                </div>
              </div>

              <!-- Asset Linking & Dynamic Risk Rating -->
              <div class="border-b pb-4">
                <h4 class="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <i class="fas fa-link text-green-500 mr-2"></i>
                  Asset Linking & Dynamic Risk Rating
                </h4>
                
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p class="text-sm text-blue-800">
                    <i class="fas fa-info-circle mr-1"></i>
                    <strong>RMF Hierarchy:</strong> Link this risk to assets. Risk ratings will automatically adjust based on asset criticality changes.
                  </p>
                </div>

                <div class="space-y-4">
                  <!-- Asset Selection -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Linked Assets
                    </label>
                    <select id="asset-selector"
                            multiple
                            size="5"
                            hx-get="/risk-v2/ui/assets/list"
                            hx-trigger="load"
                            hx-swap="innerHTML"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Loading assets...</option>
                    </select>
                    <p class="text-xs text-gray-500 mt-1">
                      Hold Ctrl (Windows) or Cmd (Mac) to select multiple assets
                    </p>
                  </div>

                  <!-- Selected Assets Display -->
                  <div id="selected-assets-display" class="hidden">
                    <label class="block text-sm font-medium text-gray-700 mb-2">Selected Assets:</label>
                    <div id="selected-assets-list" class="space-y-2">
                      <!-- Selected assets will appear here -->
                    </div>
                  </div>

                  <!-- Dynamic Risk Calculation -->
                  <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h5 class="text-sm font-medium text-yellow-900 mb-2">
                      <i class="fas fa-calculator mr-1"></i>
                      Dynamic Risk Calculation
                    </h5>
                    <div id="dynamic-risk-info" class="text-sm text-yellow-800">
                      <p>Select assets to see dynamic risk calculation based on asset criticality.</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Risk Assessment -->
              <div class="border-b pb-4">
                <h4 class="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <i class="fas fa-chart-line text-orange-500 mr-2"></i>
                  Risk Assessment
                </h4>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <!-- Probability -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Probability (1-5) <span class="text-red-500">*</span>
                    </label>
                    <input type="number" 
                           name="probability" 
                           id="probability-input"
                           min="1" 
                           max="5" 
                           value="3"
                           required
                           hx-post="/risk-v2/ui/calculate-score"
                           hx-trigger="input changed delay:300ms"
                           hx-target="#risk-score-display"
                           hx-include="#probability-input, #impact-input"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <p class="text-xs text-gray-500 mt-1">1=Very Low, 5=Very High</p>
                  </div>

                  <!-- Impact -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Impact (1-5) <span class="text-red-500">*</span>
                    </label>
                    <input type="number" 
                           name="impact" 
                           id="impact-input"
                           min="1" 
                           max="5" 
                           value="3"
                           required
                           hx-post="/risk-v2/ui/calculate-score"
                           hx-trigger="input changed delay:300ms"
                           hx-target="#risk-score-display"
                           hx-include="#probability-input, #impact-input"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <p class="text-xs text-gray-500 mt-1">1=Minimal, 5=Severe</p>
                  </div>

                  <!-- Risk Score (calculated) -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Risk Score</label>
                    <div id="risk-score-display">
                      <input type="text" 
                             value="9 - Medium" 
                             readonly
                             class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-yellow-600 font-medium">
                    </div>
                    <p class="text-xs text-gray-500 mt-1">Auto-calculated from probability × impact</p>
                  </div>
                </div>
              </div>

              <!-- Ownership -->
              <div class="border-b pb-4">
                <h4 class="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <i class="fas fa-user-shield text-indigo-500 mr-2"></i>
                  Ownership
                </h4>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Organization ID <span class="text-red-500">*</span>
                    </label>
                    <input type="number" 
                           name="organizationId" 
                           min="1"
                           value="1"
                           required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Owner ID <span class="text-red-500">*</span>
                    </label>
                    <input type="number" 
                           name="ownerId" 
                           min="1"
                           value="1"
                           required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">
                      Created By <span class="text-red-500">*</span>
                    </label>
                    <input type="number" 
                           name="createdBy" 
                           min="1"
                           value="1"
                           required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>
                </div>
              </div>

              <!-- Mitigation & Planning -->
              <div class="border-b pb-4">
                <h4 class="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <i class="fas fa-tasks text-teal-500 mr-2"></i>
                  Mitigation & Planning
                </h4>
                
                <div class="space-y-4">
                  <!-- Mitigation Plan -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Mitigation Plan</label>
                    <textarea name="mitigationPlan" 
                              id="mitigation-plan-input"
                              rows="3"
                              placeholder="Describe the planned mitigation actions..."
                              maxlength="5000"
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                  </div>

                  <!-- Contingency Plan -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Contingency Plan</label>
                    <textarea name="contingencyPlan" 
                              rows="3"
                              placeholder="Describe the contingency actions if the risk materializes..."
                              maxlength="5000"
                              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                  </div>

                  <!-- Review Date -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Next Review Date</label>
                    <input type="date" 
                           name="reviewDate"
                           id="review-date-input"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>
                </div>
              </div>

              <!-- Tags & Metadata -->
              <div>
                <h4 class="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <i class="fas fa-tags text-pink-500 mr-2"></i>
                  Tags & Metadata
                </h4>
                
                <div class="space-y-4">
                  <!-- Tags -->
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                    <input type="text" 
                           name="tags" 
                           placeholder="tag1, tag2, tag3 (comma-separated)"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <p class="text-xs text-gray-500 mt-1">Separate tags with commas</p>
                  </div>

                  <!-- Hidden field for selected assets -->
                  <input type="hidden" name="linkedAssets" id="linked-assets-input" value="">
                </div>
              </div>

              <!-- Form Result -->
              <div id="form-result" class="mt-4"></div>
            </form>
          </div>

          <!-- Right Column: Help & Info -->
          <div class="w-1/3 p-6 bg-gray-50">
            <div class="space-y-6">
              <!-- RMF Hierarchy Info -->
              <div class="bg-white rounded-lg shadow-sm p-4">
                <h5 class="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <i class="fas fa-sitemap text-blue-500 mr-2"></i>
                  Risk Management Framework
                </h5>
                <div class="text-xs text-gray-600 space-y-2">
                  <div class="flex items-start">
                    <i class="fas fa-shield-alt text-blue-500 mt-1 mr-2"></i>
                    <div>
                      <strong>Risks</strong>
                      <p class="text-gray-500">Top-level risk identification</p>
                    </div>
                  </div>
                  <div class="pl-4 border-l-2 border-blue-200">
                    <div class="flex items-start">
                      <i class="fas fa-server text-green-500 mt-1 mr-2"></i>
                      <div>
                        <strong>Assets</strong>
                        <p class="text-gray-500">Linked critical resources</p>
                      </div>
                    </div>
                  </div>
                  <div class="pl-8 border-l-2 border-blue-200">
                    <div class="flex items-start">
                      <i class="fas fa-exclamation-triangle text-orange-500 mt-1 mr-2"></i>
                      <div>
                        <strong>Incidents</strong>
                        <p class="text-gray-500">Real occurrences</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Dynamic Risk Rating Info -->
              <div class="bg-white rounded-lg shadow-sm p-4">
                <h5 class="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <i class="fas fa-bolt text-yellow-500 mr-2"></i>
                  Dynamic Risk Rating
                </h5>
                <p class="text-xs text-gray-600 mb-3">
                  Risk scores automatically adjust when:
                </p>
                <ul class="text-xs text-gray-600 space-y-2">
                  <li class="flex items-start">
                    <i class="fas fa-check text-green-500 mt-1 mr-2"></i>
                    <span>Asset criticality changes</span>
                  </li>
                  <li class="flex items-start">
                    <i class="fas fa-check text-green-500 mt-1 mr-2"></i>
                    <span>New assets are linked</span>
                  </li>
                  <li class="flex items-start">
                    <i class="fas fa-check text-green-500 mt-1 mr-2"></i>
                    <span>Asset status updates occur</span>
                  </li>
                </ul>
              </div>

              <!-- AI Analysis Tips -->
              <div class="bg-white rounded-lg shadow-sm p-4">
                <h5 class="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <i class="fas fa-lightbulb text-purple-500 mr-2"></i>
                  AI Analysis Tips
                </h5>
                <ul class="text-xs text-gray-600 space-y-2">
                  <li class="flex items-start">
                    <i class="fas fa-arrow-right text-purple-400 mt-1 mr-2"></i>
                    <span>Provide detailed descriptions for better AI recommendations</span>
                  </li>
                  <li class="flex items-start">
                    <i class="fas fa-arrow-right text-purple-400 mt-1 mr-2"></i>
                    <span>AI will suggest probability, impact, and mitigation strategies</span>
                  </li>
                  <li class="flex items-start">
                    <i class="fas fa-arrow-right text-purple-400 mt-1 mr-2"></i>
                    <span>Review and adjust AI suggestions as needed</span>
                  </li>
                </ul>
              </div>

              <!-- Criticality Levels -->
              <div class="bg-white rounded-lg shadow-sm p-4">
                <h5 class="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <i class="fas fa-layer-group text-red-500 mr-2"></i>
                  Asset Criticality Levels
                </h5>
                <div class="space-y-2 text-xs">
                  <div class="flex items-center justify-between">
                    <span class="text-red-600 font-medium">Critical</span>
                    <span class="text-gray-500">5x multiplier</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-orange-600 font-medium">High</span>
                    <span class="text-gray-500">4x multiplier</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-yellow-600 font-medium">Medium</span>
                    <span class="text-gray-500">3x multiplier</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-green-600 font-medium">Low</span>
                    <span class="text-gray-500">2x multiplier</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex justify-end space-x-3 px-6 py-4 border-t bg-gray-50">
          <button type="button"
                  onclick="document.getElementById('modal-container').innerHTML = ''"
                  class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit"
                  form="risk-form"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center">
            <i class="fas fa-save mr-2"></i>
            Create Risk
          </button>
        </div>
      </div>
    </div>

    <!-- Asset selection handling script -->
    <script>
      (function() {
        const assetSelector = document.getElementById('asset-selector');
        const linkedAssetsInput = document.getElementById('linked-assets-input');
        const selectedAssetsDisplay = document.getElementById('selected-assets-display');
        const selectedAssetsList = document.getElementById('selected-assets-list');
        const dynamicRiskInfo = document.getElementById('dynamic-risk-info');

        if (assetSelector) {
          assetSelector.addEventListener('change', function() {
            const selectedOptions = Array.from(this.selectedOptions);
            const selectedAssets = selectedOptions.map(opt => ({
              id: opt.value,
              name: opt.text,
              criticality: opt.dataset.criticality || 'medium'
            }));

            // Update hidden field
            linkedAssetsInput.value = JSON.stringify(selectedAssets.map(a => a.id));

            // Display selected assets
            if (selectedAssets.length > 0) {
              selectedAssetsDisplay.classList.remove('hidden');
              selectedAssetsList.innerHTML = selectedAssets.map(asset => {
                const criticalityColor = {
                  'critical': 'text-red-600 bg-red-50',
                  'high': 'text-orange-600 bg-orange-50',
                  'medium': 'text-yellow-600 bg-yellow-50',
                  'low': 'text-green-600 bg-green-50'
                }[asset.criticality.toLowerCase()] || 'text-gray-600 bg-gray-50';

                return \`
                  <div class="flex items-center justify-between p-2 bg-gray-50 rounded border">
                    <span class="text-sm text-gray-900">\${asset.name}</span>
                    <span class="text-xs px-2 py-1 rounded \${criticalityColor}">\${asset.criticality}</span>
                  </div>
                \`;
              }).join('');

              // Calculate dynamic risk info
              const maxCriticality = selectedAssets.map(a => {
                const crit = a.criticality.toLowerCase();
                return crit === 'critical' ? 5 : crit === 'high' ? 4 : crit === 'medium' ? 3 : 2;
              }).reduce((max, val) => Math.max(max, val), 0);

              dynamicRiskInfo.innerHTML = \`
                <p><strong>Linked Assets:</strong> \${selectedAssets.length}</p>
                <p><strong>Max Criticality:</strong> \${maxCriticality}/5</p>
                <p class="text-xs mt-1">Final risk score will be adjusted based on highest asset criticality.</p>
              \`;
            } else {
              selectedAssetsDisplay.classList.add('hidden');
              dynamicRiskInfo.innerHTML = '<p>Select assets to see dynamic risk calculation.</p>';
            }
          });
        }

        console.log('✅ Enhanced risk form initialized with asset linking');
      })();
    </script>
  `;
}

/**
 * Helper function to parse AI analysis and extract structured data
 */
export function parseAIAnalysis(analysis: string): {
  probability: number;
  impact: number;
  owner: string;
  treatmentStrategy: string;
  mitigationActions: string;
  reviewDate: string;
  targetDate: string;
} {
  const result = {
    probability: 3,
    impact: 3,
    owner: '',
    treatmentStrategy: 'mitigate',
    mitigationActions: '',
    reviewDate: '',
    targetDate: ''
  };

  try {
    // Extract PROBABILITY_SCORE
    const probMatch = analysis.match(/PROBABILITY_SCORE:\s*(\d)/);
    if (probMatch) result.probability = parseInt(probMatch[1]);

    // Extract IMPACT_SCORE
    const impactMatch = analysis.match(/IMPACT_SCORE:\s*(\d)/);
    if (impactMatch) result.impact = parseInt(impactMatch[1]);

    // Extract RISK_OWNER
    const ownerMatch = analysis.match(/RISK_OWNER:\s*(.+?)(?:\n|$)/);
    if (ownerMatch) result.owner = ownerMatch[1].trim();

    // Extract TREATMENT_STRATEGY
    const treatmentMatch = analysis.match(/TREATMENT_STRATEGY:\s*(.+?)(?:\n|$)/i);
    if (treatmentMatch) {
      const strategy = treatmentMatch[1].toLowerCase();
      if (strategy.includes('accept')) result.treatmentStrategy = 'accept';
      else if (strategy.includes('transfer')) result.treatmentStrategy = 'transfer';
      else if (strategy.includes('avoid')) result.treatmentStrategy = 'avoid';
      else result.treatmentStrategy = 'mitigate';
    }

    // Extract MITIGATION_ACTIONS
    const mitigationMatch = analysis.match(/MITIGATION_ACTIONS:\s*(.+?)(?:\n[A-Z_]+:|$)/s);
    if (mitigationMatch) result.mitigationActions = mitigationMatch[1].trim();

    // Extract REVIEW_DATE
    const reviewDateMatch = analysis.match(/REVIEW_DATE:\s*(\d{4}-\d{2}-\d{2})/);
    if (reviewDateMatch) result.reviewDate = reviewDateMatch[1];

    // Extract TARGET_DATE
    const targetDateMatch = analysis.match(/TARGET_DATE:\s*(\d{4}-\d{2}-\d{2})/);
    if (targetDateMatch) result.targetDate = targetDateMatch[1];

  } catch (error) {
    console.error('Error parsing AI analysis:', error);
  }

  return result;
}
