/**
 * Risk Forms Templates
 * 
 * Create, Edit, and View modals for risks
 * Follows ARIA5 design patterns
 */

import { html } from 'hono/html';
import { getRiskLevel, renderStatusBadge, renderRiskLevelBadge } from './riskComponents';
import type { RiskRow } from './riskTable';

/**
 * Render create risk modal
 */
export function renderCreateRiskModal() {
  return html`
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-5 mx-auto p-0 border w-full max-w-4xl shadow-xl rounded-lg bg-white mb-10">
        <!-- Modal Header -->
        <div class="flex justify-between items-center px-6 py-4 border-b bg-gray-50 rounded-t-md">
          <h3 class="text-lg font-semibold text-gray-900">Create New Risk</h3>
          <button onclick="document.getElementById('modal-container').innerHTML = ''" 
                  class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <!-- Form Container -->
        <div class="max-h-[70vh] overflow-y-auto p-6">
          <form id="risk-form" 
                hx-post="/risk-v2/create"
                hx-swap="none"
                class="space-y-6">
            
            <!-- Basic Information -->
            <div class="border-b pb-4">
              <h4 class="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
              
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

                <!-- Risk Type -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Risk Type</label>
                  <select name="riskType" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="business">Business</option>
                    <option value="technical">Technical</option>
                    <option value="strategic">Strategic</option>
                    <option value="operational">Operational</option>
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

            <!-- Risk Assessment -->
            <div class="border-b pb-4">
              <h4 class="text-md font-medium text-gray-900 mb-4">Risk Assessment</h4>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Probability -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Probability (1-5) <span class="text-red-500">*</span>
                  </label>
                  <input type="number" 
                         name="probability" 
                         min="1" 
                         max="5" 
                         required
                         hx-post="/risk-v2/ui/calculate-score"
                         hx-trigger="input changed delay:300ms"
                         hx-target="#risk-score-display"
                         hx-include="[name='probability'],[name='impact']"
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
                         min="1" 
                         max="5" 
                         required
                         hx-post="/risk-v2/ui/calculate-score"
                         hx-trigger="input changed delay:300ms"
                         hx-target="#risk-score-display"
                         hx-include="[name='probability'],[name='impact']"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <p class="text-xs text-gray-500 mt-1">1=Minimal, 5=Severe</p>
                </div>

                <!-- Risk Score (calculated) -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Risk Score</label>
                  <div id="risk-score-display">
                    <input type="text" 
                           value="TBD" 
                           readonly
                           class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
                  </div>
                </div>
              </div>
            </div>

            <!-- Ownership -->
            <div class="border-b pb-4">
              <h4 class="text-md font-medium text-gray-900 mb-4">Ownership</h4>
              
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
              <h4 class="text-md font-medium text-gray-900 mb-4">Mitigation & Planning</h4>
              
              <div class="space-y-4">
                <!-- Mitigation Plan -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Mitigation Plan</label>
                  <textarea name="mitigationPlan" 
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
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
              </div>
            </div>

            <!-- Tags & Metadata -->
            <div>
              <h4 class="text-md font-medium text-gray-900 mb-4">Tags & Metadata</h4>
              
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
                      class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit"
                      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                Create Risk
              </button>
            </div>

            <!-- Form Result -->
            <div id="form-result" class="mt-4"></div>
          </form>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render risk score calculation result
 */
export function renderRiskScoreDisplay(probability: number, impact: number) {
  const score = probability * impact;
  const level = getRiskLevel(score);
  
  let colorClass = 'text-gray-600';
  if (score >= 20) {
    colorClass = 'text-red-600';
  } else if (score >= 12) {
    colorClass = 'text-orange-600';
  } else if (score >= 6) {
    colorClass = 'text-yellow-600';
  } else {
    colorClass = 'text-green-600';
  }
  
  return html`
    <input type="text" 
           name="risk_score" 
           value="${score} - ${level}" 
           readonly
           class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-medium ${colorClass}">
  `;
}

/**
 * Render view risk modal (read-only)
 */
export function renderViewRiskModal(risk: RiskRow) {
  return html`
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-5 mx-auto p-0 border w-full max-w-4xl shadow-xl rounded-lg bg-white mb-10">
        <!-- Modal Header -->
        <div class="flex justify-between items-center px-6 py-4 border-b bg-gray-50 rounded-t-md">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Risk Details</h3>
            <p class="text-sm text-gray-500">${risk.riskId}</p>
          </div>
          <button onclick="document.getElementById('modal-container').innerHTML = ''" 
                  class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <!-- Content -->
        <div class="max-h-[70vh] overflow-y-auto p-6 space-y-6">
          <!-- Basic Info -->
          <div>
            <h4 class="text-md font-semibold text-gray-900 mb-3">Basic Information</h4>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-500">Title</p>
                <p class="text-sm font-medium text-gray-900">${risk.title}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Category</p>
                <p class="text-sm font-medium text-gray-900">${risk.category}</p>
              </div>
              <div class="col-span-2">
                <p class="text-sm text-gray-500">Description</p>
                <p class="text-sm text-gray-900">${risk.description}</p>
              </div>
            </div>
          </div>

          <!-- Risk Assessment -->
          <div class="border-t pt-4">
            <h4 class="text-md font-semibold text-gray-900 mb-3">Risk Assessment</h4>
            <div class="grid grid-cols-3 gap-4">
              <div>
                <p class="text-sm text-gray-500">Probability</p>
                <p class="text-2xl font-bold text-gray-900">${risk.probability}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Impact</p>
                <p class="text-2xl font-bold text-gray-900">${risk.impact}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Risk Score</p>
                <p class="text-2xl font-bold text-gray-900">${risk.riskScore} (${risk.riskLevel})</p>
              </div>
            </div>
          </div>

          <!-- Status -->
          <div class="border-t pt-4">
            <h4 class="text-md font-semibold text-gray-900 mb-3">Status</h4>
            <div>${renderStatusBadge(risk.status)}</div>
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex justify-end space-x-3 px-6 py-4 border-t bg-gray-50">
          <button onclick="document.getElementById('modal-container').innerHTML = ''"
                  class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
            Close
          </button>
          <button hx-get="/risk-v2/ui/edit/${risk.id}"
                  hx-target="#modal-container"
                  hx-swap="innerHTML"
                  class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
            Edit Risk
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render edit risk modal
 */
export function renderEditRiskModal(risk: RiskRow) {
  // Format review date for input (YYYY-MM-DD)
  const reviewDateValue = risk.reviewDate ? new Date(risk.reviewDate).toISOString().split('T')[0] : '';
  
  return html`
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-5 mx-auto p-0 border w-full max-w-4xl shadow-xl rounded-lg bg-white mb-10">
        <!-- Modal Header -->
        <div class="flex justify-between items-center px-6 py-4 border-b bg-gray-50 rounded-t-md">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Edit Risk</h3>
            <p class="text-sm text-gray-500">${risk.riskId}</p>
          </div>
          <button onclick="document.getElementById('modal-container').innerHTML = ''" 
                  class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <!-- Form Container -->
        <div class="max-h-[70vh] overflow-y-auto p-6">
          <form id="risk-edit-form" 
                hx-put="/risk-v2/${risk.id}"
                hx-swap="none"
                class="space-y-6">
            
            <!-- Basic Information -->
            <div class="border-b pb-4">
              <h4 class="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Risk ID (read-only) -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Risk ID</label>
                  <input type="text" 
                         value="${risk.riskId}" 
                         readonly
                         class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
                </div>

                <!-- Risk Type -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Risk Type</label>
                  <select name="riskType" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="business" ${risk.category === 'business' ? 'selected' : ''}>Business</option>
                    <option value="technical" ${risk.category === 'technical' ? 'selected' : ''}>Technical</option>
                    <option value="strategic" ${risk.category === 'strategic' ? 'selected' : ''}>Strategic</option>
                    <option value="operational" ${risk.category === 'operational' ? 'selected' : ''}>Operational</option>
                    <option value="compliance" ${risk.category === 'compliance' ? 'selected' : ''}>Compliance</option>
                  </select>
                </div>

                <!-- Title -->
                <div class="md:col-span-2">
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Title <span class="text-red-500">*</span>
                  </label>
                  <input type="text" 
                         name="title" 
                         value="${risk.title}"
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
                            rows="3"
                            required
                            maxlength="2000"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">${risk.description}</textarea>
                </div>

                <!-- Category -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Category <span class="text-red-500">*</span>
                  </label>
                  <select name="category" 
                          required
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select category...</option>
                    <option value="strategic" ${risk.category === 'strategic' ? 'selected' : ''}>Strategic</option>
                    <option value="operational" ${risk.category === 'operational' ? 'selected' : ''}>Operational</option>
                    <option value="financial" ${risk.category === 'financial' ? 'selected' : ''}>Financial</option>
                    <option value="compliance" ${risk.category === 'compliance' ? 'selected' : ''}>Compliance</option>
                    <option value="reputational" ${risk.category === 'reputational' ? 'selected' : ''}>Reputational</option>
                    <option value="technology" ${risk.category === 'technology' ? 'selected' : ''}>Technology</option>
                    <option value="cybersecurity" ${risk.category === 'cybersecurity' ? 'selected' : ''}>Cybersecurity</option>
                    <option value="environmental" ${risk.category === 'environmental' ? 'selected' : ''}>Environmental</option>
                    <option value="legal" ${risk.category === 'legal' ? 'selected' : ''}>Legal</option>
                    <option value="human_resources" ${risk.category === 'human_resources' ? 'selected' : ''}>Human Resources</option>
                    <option value="supply_chain" ${risk.category === 'supply_chain' ? 'selected' : ''}>Supply Chain</option>
                    <option value="market" ${risk.category === 'market' ? 'selected' : ''}>Market</option>
                    <option value="credit" ${risk.category === 'credit' ? 'selected' : ''}>Credit</option>
                    <option value="liquidity" ${risk.category === 'liquidity' ? 'selected' : ''}>Liquidity</option>
                    <option value="other" ${risk.category === 'other' ? 'selected' : ''}>Other</option>
                  </select>
                </div>

                <!-- Status -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select name="status" 
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="active" ${risk.status === 'active' ? 'selected' : ''}>Active</option>
                    <option value="pending" ${risk.status === 'pending' ? 'selected' : ''}>Pending</option>
                    <option value="mitigated" ${risk.status === 'mitigated' ? 'selected' : ''}>Mitigated</option>
                    <option value="monitoring" ${risk.status === 'monitoring' ? 'selected' : ''}>Monitoring</option>
                    <option value="accepted" ${risk.status === 'accepted' ? 'selected' : ''}>Accepted</option>
                    <option value="transferred" ${risk.status === 'transferred' ? 'selected' : ''}>Transferred</option>
                    <option value="avoided" ${risk.status === 'avoided' ? 'selected' : ''}>Avoided</option>
                    <option value="closed" ${risk.status === 'closed' ? 'selected' : ''}>Closed</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Risk Assessment -->
            <div class="border-b pb-4">
              <h4 class="text-md font-medium text-gray-900 mb-4">Risk Assessment</h4>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <!-- Probability -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">
                    Probability (1-5) <span class="text-red-500">*</span>
                  </label>
                  <input type="number" 
                         name="probability" 
                         min="1" 
                         max="5" 
                         value="${risk.probability}"
                         required
                         hx-post="/risk-v2/ui/calculate-score"
                         hx-trigger="input changed delay:300ms"
                         hx-target="#risk-score-display-edit"
                         hx-include="[name='probability'],[name='impact']"
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
                         min="1" 
                         max="5" 
                         value="${risk.impact}"
                         required
                         hx-post="/risk-v2/ui/calculate-score"
                         hx-trigger="input changed delay:300ms"
                         hx-target="#risk-score-display-edit"
                         hx-include="[name='probability'],[name='impact']"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <p class="text-xs text-gray-500 mt-1">1=Minimal, 5=Severe</p>
                </div>

                <!-- Risk Score (calculated) -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Risk Score</label>
                  <div id="risk-score-display-edit">
                    ${renderRiskScoreDisplay(risk.probability, risk.impact)}
                  </div>
                </div>
              </div>
            </div>

            <!-- Ownership (read-only display) -->
            <div class="border-b pb-4">
              <h4 class="text-md font-medium text-gray-900 mb-4">Ownership</h4>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Organization ID</label>
                  <input type="text" 
                         value="${risk.organizationId}" 
                         readonly
                         class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                  <input type="text" 
                         value="${risk.ownerName || 'Unassigned'}" 
                         readonly
                         class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Owner ID</label>
                  <input type="number" 
                         name="ownerId"
                         value="${risk.ownerId}"
                         min="1"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
              </div>
            </div>

            <!-- Mitigation & Planning -->
            <div class="border-b pb-4">
              <h4 class="text-md font-medium text-gray-900 mb-4">Mitigation & Planning</h4>
              
              <div class="space-y-4">
                <!-- Mitigation Plan -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Mitigation Plan</label>
                  <textarea name="mitigationPlan" 
                            rows="3"
                            maxlength="5000"
                            placeholder="Describe the planned mitigation actions..."
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>

                <!-- Contingency Plan -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Contingency Plan</label>
                  <textarea name="contingencyPlan" 
                            rows="3"
                            maxlength="5000"
                            placeholder="Describe the contingency actions if the risk materializes..."
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>

                <!-- Review Date -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Next Review Date</label>
                  <input type="date" 
                         name="reviewDate"
                         value="${reviewDateValue}"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
              </div>
            </div>

            <!-- Tags & Metadata -->
            <div>
              <h4 class="text-md font-medium text-gray-900 mb-4">Tags & Metadata</h4>
              
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
                      class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit"
                      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                <i class="fas fa-save mr-2"></i>
                Save Changes
              </button>
            </div>

            <!-- Form Result -->
            <div id="form-result" class="mt-4"></div>
          </form>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render status change modal
 */
export function renderStatusChangeModal(risk: RiskRow) {
  return html`
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-0 border w-full max-w-md shadow-xl rounded-lg bg-white">
        <!-- Modal Header -->
        <div class="flex justify-between items-center px-6 py-4 border-b bg-gray-50 rounded-t-md">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Change Risk Status</h3>
            <p class="text-sm text-gray-500">${risk.riskId}</p>
          </div>
          <button onclick="document.getElementById('modal-container').innerHTML = ''" 
                  class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <!-- Form Container -->
        <div class="p-6">
          <form hx-patch="/risk-v2/${risk.id}/status"
                hx-swap="none"
                class="space-y-4">
            
            <!-- Current Status Display -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
              <div>${renderStatusBadge(risk.status)}</div>
            </div>

            <!-- New Status Selection -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                New Status <span class="text-red-500">*</span>
              </label>
              <select name="status" 
                      required
                      class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select new status...</option>
                <option value="active" ${risk.status === 'active' ? 'disabled' : ''}>Active</option>
                <option value="pending" ${risk.status === 'pending' ? 'disabled' : ''}>Pending</option>
                <option value="mitigated" ${risk.status === 'mitigated' ? 'disabled' : ''}>Mitigated</option>
                <option value="monitoring" ${risk.status === 'monitoring' ? 'disabled' : ''}>Monitoring</option>
                <option value="accepted" ${risk.status === 'accepted' ? 'disabled' : ''}>Accepted</option>
                <option value="transferred" ${risk.status === 'transferred' ? 'disabled' : ''}>Transferred</option>
                <option value="avoided" ${risk.status === 'avoided' ? 'disabled' : ''}>Avoided</option>
                <option value="closed" ${risk.status === 'closed' ? 'disabled' : ''}>Closed</option>
              </select>
            </div>

            <!-- Status Change Reason -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Reason for Status Change
              </label>
              <textarea name="statusChangeReason" 
                        rows="3"
                        placeholder="Explain why the status is being changed..."
                        maxlength="500"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
              <p class="text-xs text-gray-500 mt-1">Optional: Provide context for this status change</p>
            </div>

            <!-- Form Actions -->
            <div class="flex justify-end space-x-3 pt-4 border-t">
              <button type="button"
                      onclick="document.getElementById('modal-container').innerHTML = ''"
                      class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit"
                      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                <i class="fas fa-check mr-2"></i>
                Update Status
              </button>
            </div>

            <!-- Form Result -->
            <div id="form-result"></div>
          </form>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render import risks modal
 */
export function renderImportRisksModal() {
  return html`
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-0 border w-full max-w-3xl shadow-xl rounded-lg bg-white">
        <!-- Modal Header -->
        <div class="flex justify-between items-center px-6 py-4 border-b bg-gray-50 rounded-t-md">
          <div>
            <h3 class="text-lg font-semibold text-gray-900">Import Risks from CSV</h3>
            <p class="text-sm text-gray-500 mt-1">Upload a CSV file to bulk import risks</p>
          </div>
          <button onclick="document.getElementById('modal-container').innerHTML = ''" 
                  class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <!-- Form Container -->
        <div class="p-6">
          <form id="import-form"
                hx-post="/risk-v2/ui/import"
                hx-encoding="multipart/form-data"
                hx-swap="none"
                class="space-y-6">
            
            <!-- Instructions -->
            <div class="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h4 class="text-sm font-medium text-blue-900 mb-2">
                <i class="fas fa-info-circle mr-2"></i>CSV Format Requirements
              </h4>
              <ul class="text-sm text-blue-800 space-y-1 ml-6 list-disc">
                <li>First row must contain column headers</li>
                <li>Required columns: <code class="bg-blue-100 px-1 rounded">risk_id, title, description, category, probability, impact, status</code></li>
                <li>Optional columns: <code class="bg-blue-100 px-1 rounded">subcategory, owner_id, organization_id, review_date, source, tags, mitigation_plan</code></li>
                <li>Probability and Impact must be numbers between 1-5</li>
                <li>Status must be one of: active, monitoring, mitigated, accepted, transferred, closed, pending</li>
              </ul>
            </div>

            <!-- Download Template -->
            <div class="flex items-center justify-between p-4 border border-gray-300 rounded-md bg-gray-50">
              <div>
                <h5 class="text-sm font-medium text-gray-900">Need a template?</h5>
                <p class="text-sm text-gray-500">Download our CSV template with sample data</p>
              </div>
              <a href="/risk-v2/ui/import/template" 
                 download="risk_import_template.csv"
                 class="px-4 py-2 bg-white border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                <i class="fas fa-download mr-2"></i>Download Template
              </a>
            </div>

            <!-- File Upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Upload CSV File <span class="text-red-500">*</span>
              </label>
              <div class="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-400 transition-colors">
                <div class="space-y-1 text-center">
                  <i class="fas fa-file-csv text-4xl text-gray-400 mb-3"></i>
                  <div class="flex text-sm text-gray-600">
                    <label for="file-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none">
                      <span>Upload a file</span>
                      <input id="file-upload" 
                             name="file" 
                             type="file" 
                             accept=".csv"
                             required
                             class="sr-only">
                    </label>
                    <p class="pl-1">or drag and drop</p>
                  </div>
                  <p class="text-xs text-gray-500">CSV files only, up to 10MB</p>
                </div>
              </div>
              <div id="file-preview" class="mt-2 text-sm text-gray-600"></div>
            </div>

            <!-- Import Options -->
            <div class="space-y-3">
              <h4 class="text-sm font-medium text-gray-900">Import Options</h4>
              
              <div class="flex items-center">
                <input id="skip-duplicates" 
                       name="skipDuplicates" 
                       type="checkbox" 
                       value="true"
                       checked
                       class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                <label for="skip-duplicates" class="ml-2 block text-sm text-gray-700">
                  Skip duplicate risk_id entries
                </label>
              </div>

              <div class="flex items-center">
                <input id="validate-only" 
                       name="validateOnly" 
                       type="checkbox" 
                       value="true"
                       class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                <label for="validate-only" class="ml-2 block text-sm text-gray-700">
                  Validate only (don't import, just check for errors)
                </label>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="flex justify-end space-x-3 pt-4 border-t">
              <button type="button"
                      onclick="document.getElementById('modal-container').innerHTML = ''"
                      class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit"
                      class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                <i class="fas fa-file-import mr-2"></i>
                Import Risks
              </button>
            </div>

            <!-- Form Result -->
            <div id="import-result" class="mt-4"></div>
          </form>
        </div>
      </div>
    </div>

    <!-- File preview script -->
    <script>
      document.getElementById('file-upload').addEventListener('change', function(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('file-preview');
        if (file) {
          preview.innerHTML = '<i class="fas fa-check-circle text-green-600 mr-2"></i>Selected: ' + file.name + ' (' + (file.size / 1024).toFixed(2) + ' KB)';
        } else {
          preview.innerHTML = '';
        }
      });
    </script>
  `;
}
