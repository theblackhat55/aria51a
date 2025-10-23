/**
 * Enhanced Risk Forms Templates
 * 
 * Combines v1's AI analysis with v2's clean architecture
 * Adds service/asset linking for dynamic risk scoring
 * Implements RMF: Risks → Services → Assets → Incidents/Vulnerabilities
 */

import { html } from 'hono/html';
import { getRiskLevel, renderStatusBadge, renderRiskLevelBadge } from './riskComponents';
import type { RiskRow } from './riskTable';

/**
 * Render enhanced create risk modal with AI analysis and service/asset linking
 */
export function renderEnhancedCreateRiskModal() {
  return html`
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-5 mx-auto p-0 border w-full max-w-5xl shadow-xl rounded-lg bg-white mb-10">
        <!-- Modal Header -->
        <div class="flex justify-between items-center px-6 py-4 border-b bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-md">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg flex items-center justify-center mr-3">
              <i class="fas fa-shield-alt"></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">Create New Risk</h3>
              <p class="text-xs text-gray-600 mt-0.5">
                <i class="fas fa-robot text-purple-600 mr-1"></i>AI-Powered Risk Analysis
                <span class="mx-2">•</span>
                <i class="fas fa-sitemap text-blue-600 mr-1"></i>Service & Asset Linking
              </p>
            </div>
          </div>
          <button onclick="document.getElementById('modal-container').innerHTML = ''" 
                  class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <!-- Form Container -->
        <div class="max-h-[75vh] overflow-y-auto p-6">
          <form id="risk-form" 
                hx-post="/risk-v2/create"
                hx-swap="none"
                class="space-y-6">
            
            <!-- AI Analysis Section -->
            <div class="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-5">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center">
                  <div class="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg flex items-center justify-center mr-3">
                    <i class="fas fa-robot text-sm"></i>
                  </div>
                  <div>
                    <h4 class="text-md font-semibold text-gray-900">AI Risk Analysis</h4>
                    <p class="text-xs text-gray-600">Let AI analyze your risk and suggest values</p>
                  </div>
                </div>
                <button type="button"
                        id="ai-analyze-btn"
                        hx-post="/risk-v2/ui/analyze-ai"
                        hx-target="#ai-analysis-result"
                        hx-include="#risk-title-ai, #risk-description-ai, #risk-category-ai"
                        class="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center shadow-lg">
                  <i class="fas fa-magic mr-2"></i>
                  Analyze with AI
                </button>
              </div>

              <!-- Quick Input for AI Analysis -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <input type="text" 
                       id="risk-title-ai"
                       name="title_preview" 
                       placeholder="Risk title for AI analysis..."
                       class="px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm">
                <textarea id="risk-description-ai"
                          name="description_preview"
                          rows="1"
                          placeholder="Brief description..."
                          class="px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm"></textarea>
                <select id="risk-category-ai"
                        name="category_preview"
                        class="px-3 py-2 border border-purple-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm">
                  <option value="">Category...</option>
                  <option value="strategic">Strategic</option>
                  <option value="operational">Operational</option>
                  <option value="financial">Financial</option>
                  <option value="compliance">Compliance</option>
                  <option value="cybersecurity">Cybersecurity</option>
                  <option value="technology">Technology</option>
                  <option value="reputational">Reputational</option>
                </select>
              </div>

              <!-- AI Analysis Result -->
              <div id="ai-analysis-result"></div>
            </div>

            <!-- Basic Information -->
            <div class="border-b pb-4">
              <div class="flex items-center mb-4">
                <div class="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center mr-3">
                  <span class="text-sm font-semibold">1</span>
                </div>
                <h4 class="text-md font-semibold text-gray-900">Basic Information</h4>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Risk ID -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Risk ID <span class="text-red-500">*</span>
                  </label>
                  <input type="text" 
                         name="riskId" 
                         placeholder="RISK-001"
                         required
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <p class="text-xs text-gray-500 mt-1">Format: PREFIX-NUMBER (e.g., RISK-001)</p>
                </div>

                <!-- Category -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Category <span class="text-red-500">*</span>
                  </label>
                  <select name="category" 
                          id="risk-category-main"
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

                <!-- Title -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Title <span class="text-red-500">*</span>
                  </label>
                  <input type="text" 
                         name="title" 
                         id="risk-title-main"
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
                            id="risk-description-main"
                            rows="3"
                            placeholder="Detailed description of the risk and its potential impact..."
                            required
                            maxlength="2000"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
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

            <!-- Service & Asset Linking (RMF) -->
            <div class="border-b pb-4">
              <div class="flex items-center mb-4">
                <div class="w-8 h-8 bg-purple-600 text-white rounded-lg flex items-center justify-center mr-3">
                  <i class="fas fa-sitemap text-sm"></i>
                </div>
                <div class="flex-1">
                  <h4 class="text-md font-semibold text-gray-900">Service & Asset Linking</h4>
                  <p class="text-xs text-gray-600 mt-0.5">
                    Link services and assets to enable dynamic risk scoring
                  </p>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Services Selection -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    <i class="fas fa-server text-purple-600 mr-1"></i>
                    Affected Services
                  </label>
                  <select name="services" 
                          id="service-selector"
                          multiple
                          size="4"
                          hx-get="/risk-v2/ui/assets-by-services"
                          hx-trigger="change"
                          hx-target="#asset-selector-container"
                          hx-swap="innerHTML"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="">Loading services...</option>
                  </select>
                  <p class="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                </div>

                <!-- Assets Selection (filtered by services) -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    <i class="fas fa-cube text-blue-600 mr-1"></i>
                    Affected Assets
                  </label>
                  <div id="asset-selector-container">
                    <select name="assets" 
                            id="asset-selector"
                            multiple
                            size="4"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select services first...</option>
                    </select>
                  </div>
                  <p class="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
                </div>
              </div>

              <!-- Dynamic Risk Impact Info -->
              <div class="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div class="flex items-start">
                  <i class="fas fa-info-circle text-blue-600 mr-2 mt-0.5"></i>
                  <div class="text-xs text-blue-800">
                    <p class="font-medium">Dynamic Risk Scoring</p>
                    <p class="mt-1">Final risk score will be adjusted based on the criticality of linked services and assets. High-criticality services will increase the overall risk impact.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Risk Assessment -->
            <div class="border-b pb-4">
              <div class="flex items-center mb-4">
                <div class="w-8 h-8 bg-orange-600 text-white rounded-lg flex items-center justify-center mr-3">
                  <span class="text-sm font-semibold">2</span>
                </div>
                <h4 class="text-md font-semibold text-gray-900">Risk Assessment</h4>
              </div>
              
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
                         hx-post="/risk-v2/ui/calculate-dynamic-score"
                         hx-trigger="input changed delay:300ms"
                         hx-target="#risk-score-display"
                         hx-include="#probability-input, #impact-input, #service-selector, #asset-selector"
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
                         hx-post="/risk-v2/ui/calculate-dynamic-score"
                         hx-trigger="input changed delay:300ms"
                         hx-target="#risk-score-display"
                         hx-include="#probability-input, #impact-input, #service-selector, #asset-selector"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <p class="text-xs text-gray-500 mt-1">1=Minimal, 5=Severe</p>
                </div>

                <!-- Risk Score (calculated dynamically) -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    <i class="fas fa-calculator text-blue-600 mr-1"></i>
                    Risk Score
                  </label>
                  <div id="risk-score-display">
                    <input type="text" 
                           value="9 - Medium (Base)" 
                           readonly
                           class="w-full px-3 py-2 border border-gray-300 rounded-md bg-yellow-50 text-yellow-700 font-semibold">
                    <p class="text-xs text-gray-500 mt-1">Base score • No adjustments</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Ownership -->
            <div class="border-b pb-4">
              <div class="flex items-center mb-4">
                <div class="w-8 h-8 bg-green-600 text-white rounded-lg flex items-center justify-center mr-3">
                  <span class="text-sm font-semibold">3</span>
                </div>
                <h4 class="text-md font-semibold text-gray-900">Ownership</h4>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Organization ID -->
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

                <!-- Owner ID -->
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

                <!-- Created By -->
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
              <div class="flex items-center mb-4">
                <div class="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center mr-3">
                  <span class="text-sm font-semibold">4</span>
                </div>
                <h4 class="text-md font-semibold text-gray-900">Mitigation & Planning</h4>
              </div>
              
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
              <div class="flex items-center mb-4">
                <div class="w-8 h-8 bg-gray-600 text-white rounded-lg flex items-center justify-center mr-3">
                  <i class="fas fa-tags text-sm"></i>
                </div>
                <h4 class="text-md font-semibold text-gray-900">Tags & Metadata</h4>
              </div>
              
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
              </div>
            </div>

            <!-- Form Actions -->
            <div class="flex justify-end space-x-3 pt-4 border-t">
              <button type="button"
                      onclick="document.getElementById('modal-container').innerHTML = ''"
                      class="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors">
                Cancel
              </button>
              <button type="submit"
                      class="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-medium transition-all shadow-lg flex items-center">
                <i class="fas fa-save mr-2"></i>
                Create Risk
              </button>
            </div>

            <!-- Form Result -->
            <div id="form-result" class="mt-4"></div>
          </form>
        </div>
      </div>
    </div>

    <!-- Load services on modal open -->
    <script>
      (function() {
        // Load services list
        htmx.ajax('GET', '/risk-v2/ui/services', {
          target: '#service-selector',
          swap: 'innerHTML'
        });
        
        // Sync AI preview fields to main form fields
        const syncFields = () => {
          const titleAI = document.getElementById('risk-title-ai');
          const descAI = document.getElementById('risk-description-ai');
          const categoryAI = document.getElementById('risk-category-ai');
          
          const titleMain = document.getElementById('risk-title-main');
          const descMain = document.getElementById('risk-description-main');
          const categoryMain = document.getElementById('risk-category-main');
          
          if (titleAI && titleMain && titleAI.value) titleMain.value = titleAI.value;
          if (descAI && descMain && descAI.value) descMain.value = descAI.value;
          if (categoryAI && categoryMain && categoryAI.value) categoryMain.value = categoryAI.value;
        };
        
        // Auto-sync every 500ms
        setInterval(syncFields, 500);
      })();
    </script>
  `;
}

/**
 * Helper function to parse AI analysis for structured data
 */
function parseAIAnalysis(analysis: string) {
  const aiData = {
    probability: 3,
    impact: 3,
    owner: 'Risk Management Team',
    treatmentStrategy: 'Mitigate',
    mitigationActions: '',
    reviewDate: '',
    targetDate: ''
  };

  try {
    // Extract structured data using regex patterns
    const probabilityMatch = analysis.match(/PROBABILITY_SCORE:\s*(\d+)/i);
    if (probabilityMatch) aiData.probability = parseInt(probabilityMatch[1]);

    const impactMatch = analysis.match(/IMPACT_SCORE:\s*(\d+)/i);
    if (impactMatch) aiData.impact = parseInt(impactMatch[1]);

    const ownerMatch = analysis.match(/RISK_OWNER:\s*([^\n]+)/i);
    if (ownerMatch) aiData.owner = ownerMatch[1].trim();

    const strategyMatch = analysis.match(/TREATMENT_STRATEGY:\s*([^\n]+)/i);
    if (strategyMatch) aiData.treatmentStrategy = strategyMatch[1].trim();

    const actionsMatch = analysis.match(/MITIGATION_ACTIONS:\s*([^\n]+)/i);
    if (actionsMatch) aiData.mitigationActions = actionsMatch[1].trim().replace(/;/g, '\n');

    const reviewMatch = analysis.match(/REVIEW_DATE:\s*([^\n]+)/i);
    if (reviewMatch) aiData.reviewDate = reviewMatch[1].trim();

    const targetMatch = analysis.match(/TARGET_DATE:\s*([^\n]+)/i);
    if (targetMatch) aiData.targetDate = targetMatch[1].trim();

  } catch (error) {
    console.error('Error parsing AI analysis:', error);
  }

  return aiData;
}

/**
 * Render AI analysis result with auto-fill button
 */
export function renderAIAnalysisResult(analysis: string, title: string, description: string, category: string) {
  return html`
    <div class="mt-3 p-4 bg-white border border-purple-200 rounded-lg">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center">
          <i class="fas fa-robot text-purple-500 mr-2"></i>
          <span class="text-purple-800 font-medium">AI Risk Analysis Complete</span>
          <span class="ml-2 text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">Powered by Cloudflare AI</span>
        </div>
        <button 
          type="button"
          id="fill-ai-form-btn"
          data-analysis="${analysis.replace(/"/g, '&quot;').replace(/'/g, '&#39;')}"
          class="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center shadow">
          <i class="fas fa-magic mr-2"></i>
          Auto-Fill Form
        </button>
      </div>
      <div class="text-gray-800 whitespace-pre-line text-sm leading-relaxed max-h-64 overflow-y-auto p-3 bg-gray-50 rounded border border-gray-200">
        ${analysis}
      </div>
      <div class="mt-3 pt-3 border-t border-purple-200">
        <p class="text-purple-600 text-xs">
          <i class="fas fa-info-circle mr-1"></i>
          Analysis generated using Cloudflare Workers AI (Llama 3.1 8B) • Click "Auto-Fill Form" to populate fields
        </p>
      </div>
    </div>

    <script>
      document.getElementById('fill-ai-form-btn').addEventListener('click', function() {
        try {
          const analysis = this.dataset.analysis;
          const aiData = parseAIData(analysis);
          
          // Fill probability and impact
          const probField = document.getElementById('probability-input');
          const impactField = document.getElementById('impact-input');
          if (probField && aiData.probability) probField.value = aiData.probability;
          if (impactField && aiData.impact) impactField.value = aiData.impact;
          
          // Fill mitigation plan
          const mitigationField = document.getElementById('mitigation-plan-input');
          if (mitigationField && aiData.mitigationActions) {
            mitigationField.value = aiData.mitigationActions;
          }
          
          // Fill review date
          const reviewField = document.getElementById('review-date-input');
          if (reviewField && aiData.reviewDate) {
            reviewField.value = aiData.reviewDate;
          }
          
          // Trigger risk score recalculation
          if (probField) {
            htmx.trigger(probField, 'input');
          }
          
          // Show success message
          this.innerHTML = '<i class="fas fa-check mr-2"></i>Form Filled!';
          this.classList.remove('from-green-600', 'to-blue-600');
          this.classList.add('from-green-500', 'to-green-600');
          
          setTimeout(() => {
            this.innerHTML = '<i class="fas fa-magic mr-2"></i>Auto-Fill Form';
            this.classList.remove('from-green-500', 'to-green-600');
            this.classList.add('from-green-600', 'to-blue-600');
          }, 2000);
          
        } catch (error) {
          console.error('Error auto-filling form:', error);
        }
      });
      
      function parseAIData(analysis) {
        const data = { probability: 3, impact: 3, mitigationActions: '', reviewDate: '' };
        
        const probMatch = analysis.match(/PROBABILITY_SCORE:\\s*(\\d+)/i);
        if (probMatch) data.probability = probMatch[1];
        
        const impactMatch = analysis.match(/IMPACT_SCORE:\\s*(\\d+)/i);
        if (impactMatch) data.impact = impactMatch[1];
        
        const actionsMatch = analysis.match(/MITIGATION_ACTIONS:\\s*([^\\n]+)/i);
        if (actionsMatch) data.mitigationActions = actionsMatch[1].trim().replace(/;/g, '\\n');
        
        const reviewMatch = analysis.match(/REVIEW_DATE:\\s*([^\\n]+)/i);
        if (reviewMatch) data.reviewDate = reviewMatch[1].trim();
        
        return data;
      }
    </script>
  `;
}

/**
 * Render dynamic risk score display with service/asset adjustments
 */
export function renderDynamicRiskScoreDisplay(baseScore: number, adjustedScore: number, adjustmentFactor: number, level: string) {
  const hasAdjustment = adjustmentFactor !== 1.0;
  const colorClass = adjustedScore >= 20 ? 'text-red-600' : adjustedScore >= 12 ? 'text-orange-600' : adjustedScore >= 6 ? 'text-yellow-600' : 'text-green-600';
  const bgClass = adjustedScore >= 20 ? 'bg-red-50' : adjustedScore >= 12 ? 'bg-orange-50' : adjustedScore >= 6 ? 'bg-yellow-50' : 'bg-green-50';
  
  return html`
    <input type="text" 
           name="risk_score" 
           value="${adjustedScore} - ${level}" 
           readonly
           class="w-full px-3 py-2 border border-gray-300 rounded-md ${bgClass} font-semibold ${colorClass}">
    ${hasAdjustment ? html`
      <p class="text-xs text-gray-600 mt-1">
        <i class="fas fa-chart-line mr-1"></i>
        Base: ${baseScore} × ${adjustmentFactor.toFixed(2)} = ${adjustedScore}
      </p>
    ` : html`
      <p class="text-xs text-gray-500 mt-1">Base score • No adjustments</p>
    `}
  `;
}

/**
 * Render services options for selection
 */
export function renderServicesOptions(services: Array<{id: number, name: string, criticality_score: number, type: string}>) {
  if (services.length === 0) {
    return html`<option value="">No services available</option>`;
  }
  
  return html`
    <option value="">Select services...</option>
    ${services.map(service => html`
      <option value="${service.id}" data-criticality="${service.criticality_score}">
        ${service.name} (${service.type}) [Criticality: ${service.criticality_score}/5]
      </option>
    `)}
  `;
}

/**
 * Render assets options for selection (filtered by services)
 */
export function renderAssetsOptions(assets: Array<{id: number, name: string, criticality: string, type: string}>) {
  if (assets.length === 0) {
    return html`<option value="">No assets linked to selected services</option>`;
  }
  
  return html`
    <option value="">Select assets...</option>
    ${assets.map(asset => html`
      <option value="${asset.id}">
        ${asset.name} (${asset.type}) [${asset.criticality}]
      </option>
    `)}
  `;
}

export { parseAIAnalysis };
