/**
 * Enhanced Risk Modal with AI Capabilities and Dynamic Service-Based Risk Rating
 * 
 * Features:
 * - AI-powered risk analysis and recommendations
 * - Dynamic risk rating based on linked services' criticality
 * - Automatic recalculation when services are reclassified
 * - Enhanced UX with visual service criticality indicators
 * - Intelligent probability and impact suggestions based on services
 * - Real-time risk score updates
 */

import { html, raw } from 'hono/html';
import type { D1Database } from '@cloudflare/workers-types';

/**
 * Service criticality breakdown for risk scoring
 */
interface ServiceCriticality {
  service_id: string;
  name: string;
  criticality: string;
  criticality_score: number;
  business_department: string;
  cia_score: number;
  dependency_count: number;
  risk_count: number;
}

/**
 * Calculate aggregate risk rating from selected services
 */
function calculateAggregateRiskFromServices(services: ServiceCriticality[]): {
  suggestedProbability: number;
  suggestedImpact: number;
  reasoning: string[];
} {
  if (services.length === 0) {
    return {
      suggestedProbability: 3,
      suggestedImpact: 3,
      reasoning: ['No services selected. Using baseline medium ratings.']
    };
  }

  const reasoning: string[] = [];
  
  // Calculate weighted impact based on service criticality
  const avgCriticality = services.reduce((sum, s) => sum + s.criticality_score, 0) / services.length;
  const maxCriticality = Math.max(...services.map(s => s.criticality_score));
  const criticalServiceCount = services.filter(s => s.criticality_score >= 80).length;
  const highServiceCount = services.filter(s => s.criticality_score >= 60).length;
  
  // Calculate suggested impact (1-5) based on service criticality
  let suggestedImpact = 3; // baseline
  if (maxCriticality >= 80) {
    suggestedImpact = 5;
    reasoning.push(`Critical services affected (criticality ≥80) suggests SEVERE impact`);
  } else if (maxCriticality >= 60) {
    suggestedImpact = 4;
    reasoning.push(`High criticality services (60-79) suggests MAJOR impact`);
  } else if (avgCriticality >= 50) {
    suggestedImpact = 3;
    reasoning.push(`Medium criticality services suggests MODERATE impact`);
  } else {
    suggestedImpact = 2;
    reasoning.push(`Lower criticality services suggests MINOR impact`);
  }
  
  // Calculate suggested probability based on service characteristics
  let suggestedProbability = 3; // baseline
  const totalDependencies = services.reduce((sum, s) => sum + (s.dependency_count || 0), 0);
  const totalRisks = services.reduce((sum, s) => sum + (s.risk_count || 0), 0);
  
  if (totalRisks > 5 || totalDependencies > 10) {
    suggestedProbability = 4;
    reasoning.push(`High risk count (${totalRisks}) or dependencies (${totalDependencies}) increases probability to HIGH`);
  } else if (services.length > 3) {
    suggestedProbability = 4;
    reasoning.push(`Multiple services (${services.length}) affected increases probability to HIGH`);
  } else if (criticalServiceCount > 0) {
    suggestedProbability = 3;
    reasoning.push(`${criticalServiceCount} critical service(s) affected suggests MEDIUM probability`);
  }
  
  // Additional reasoning based on service diversity
  const uniqueDepts = new Set(services.map(s => s.business_department)).size;
  if (uniqueDepts > 2) {
    reasoning.push(`Risk spans ${uniqueDepts} departments, indicating broader organizational impact`);
  }
  
  return {
    suggestedProbability,
    suggestedImpact,
    reasoning
  };
}

/**
 * Render enhanced risk creation modal with AI and dynamic service-based rating
 */
export async function renderEnhancedRiskModal(db: D1Database, csrfToken?: string) {
  // Pre-load services with enhanced data
  let services: ServiceCriticality[] = [];
  try {
    const result = await db.prepare(`
      SELECT 
        s.service_id,
        s.name,
        s.business_department,
        s.criticality,
        s.criticality_score,
        s.confidentiality_numeric as cia_conf,
        s.integrity_numeric as cia_int,
        s.availability_numeric as cia_avail,
        (COALESCE(s.confidentiality_numeric, 0) + COALESCE(s.integrity_numeric, 0) + COALESCE(s.availability_numeric, 0)) / 3 as cia_score,
        (SELECT COUNT(*) FROM service_asset_links sal WHERE sal.service_id = s.service_id) as dependency_count,
        (SELECT COUNT(*) FROM service_risk_links srl WHERE srl.service_id = s.service_id) as risk_count
      FROM services s 
      WHERE s.service_status = 'Active'
      ORDER BY s.criticality_score DESC, s.created_at DESC
    `).all();
    services = (result.results || []) as any;
  } catch (error) {
    console.error('Error pre-loading services:', error);
  }

  return html`
  <div class="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
    <div class="relative w-full max-w-7xl bg-white rounded-2xl shadow-2xl">
      
      <!-- Header with gradient -->
      <div class="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white px-8 py-6 rounded-t-2xl">
        <div class="flex justify-between items-start">
          <div class="flex items-center space-x-4">
            <div class="w-14 h-14 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <i class="fas fa-shield-alt text-3xl"></i>
            </div>
            <div>
              <h3 class="text-2xl font-bold">Enhanced Risk Assessment</h3>
              <p class="text-blue-100 text-sm mt-1 flex items-center">
                <i class="fas fa-robot mr-2"></i>
                AI-Powered Analysis with Dynamic Service-Based Rating
              </p>
            </div>
          </div>
          <button onclick="document.getElementById('modal-container').innerHTML = ''" 
                  class="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white hover:bg-opacity-10 rounded-lg">
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
      </div>

      <!-- Form Container with enhanced styling -->
      <div class="max-h-[calc(100vh-200px)] overflow-y-auto">
        <form id="enhanced-risk-form" 
              hx-post="/risk/create"
              hx-target="#form-result"
              hx-swap="innerHTML"
              class="p-8 space-y-6">
          
          <!-- CSRF Token -->
          <input type="hidden" name="csrf_token" value="${csrfToken || ''}">
          
          <!-- Dynamic Risk Intelligence Panel -->
          <div id="risk-intelligence-panel" class="hidden bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl p-6 shadow-lg">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div class="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                  <i class="fas fa-brain text-white text-lg"></i>
                </div>
                <div>
                  <h4 class="text-lg font-bold text-purple-900">AI Risk Intelligence</h4>
                  <p class="text-sm text-purple-700">Dynamic rating based on selected services</p>
                </div>
              </div>
              <div id="intelligence-badge" class="px-4 py-2 bg-white rounded-lg shadow-sm">
                <div class="text-xs text-gray-500">Confidence</div>
                <div class="text-lg font-bold text-purple-600">--</div>
              </div>
            </div>
            
            <!-- Suggested Ratings -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div class="bg-white rounded-lg p-4 border border-purple-100 shadow-sm">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-gray-700">Suggested Probability</span>
                  <i class="fas fa-chart-line text-purple-500"></i>
                </div>
                <div class="text-3xl font-bold text-purple-600" id="suggested-probability">--</div>
                <div class="text-xs text-gray-500 mt-1" id="probability-label">Based on service analysis</div>
              </div>
              
              <div class="bg-white rounded-lg p-4 border border-purple-100 shadow-sm">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-medium text-gray-700">Suggested Impact</span>
                  <i class="fas fa-exclamation-triangle text-orange-500"></i>
                </div>
                <div class="text-3xl font-bold text-orange-600" id="suggested-impact">--</div>
                <div class="text-xs text-gray-500 mt-1" id="impact-label">Based on service criticality</div>
              </div>
            </div>
            
            <!-- AI Reasoning -->
            <div id="ai-reasoning" class="bg-white rounded-lg p-4 border border-purple-100">
              <div class="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
                Analysis Reasoning
              </div>
              <ul id="reasoning-list" class="space-y-1 text-sm text-gray-600">
                <li class="flex items-start">
                  <i class="fas fa-chevron-right text-purple-400 text-xs mt-1 mr-2"></i>
                  <span>Select services to see dynamic risk analysis</span>
                </li>
              </ul>
            </div>
            
            <!-- Quick Apply Button -->
            <div class="mt-4 flex justify-end">
              <button type="button" 
                      onclick="applyAISuggestions()"
                      class="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center">
                <i class="fas fa-magic mr-2"></i>
                Apply AI Suggestions
              </button>
            </div>
          </div>

          <!-- Section 1: Risk Identification -->
          <div class="bg-white border-2 border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div class="flex items-center mb-6">
              <div class="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center text-lg font-bold mr-4 shadow-lg">1</div>
              <div>
                <h4 class="text-xl font-bold text-gray-900">Risk Identification</h4>
                <p class="text-sm text-gray-500">Define the risk scenario and context</p>
              </div>
            </div>
            
            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Risk Category *
                    <span class="text-gray-400 font-normal ml-1">(Primary classification)</span>
                  </label>
                  <select name="category" required 
                          class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                    <option value="">Select Category</option>
                    <option value="cybersecurity">🛡️ Cybersecurity</option>
                    <option value="operational">⚙️ Operational</option>
                    <option value="financial">💰 Financial</option>
                    <option value="compliance">📋 Compliance</option>
                    <option value="strategic">🎯 Strategic</option>
                    <option value="reputational">⭐ Reputational</option>
                  </select>
                </div>
                
                <div>
                  <label class="block text-sm font-semibold text-gray-700 mb-2">
                    Threat Source *
                    <span class="text-gray-400 font-normal ml-1">(Origin of risk)</span>
                  </label>
                  <select name="threat_source" required 
                          class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all">
                    <option value="">Select Threat Source</option>
                    <option value="external-malicious">🔴 External - Malicious (Hackers, APTs)</option>
                    <option value="external-accidental">🟡 External - Accidental (User error, vendors)</option>
                    <option value="internal-malicious">🔴 Internal - Malicious (Insider threats)</option>
                    <option value="internal-accidental">🟡 Internal - Accidental (Employee errors)</option>
                    <option value="natural-disaster">🌪️ Natural Disaster</option>
                    <option value="system-failure">⚠️ System Failure</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Risk Title *
                  <span class="text-gray-400 font-normal ml-1">(Clear, concise description)</span>
                </label>
                <input type="text" 
                       name="title" 
                       id="risk-title"
                       placeholder="e.g., Unauthorized access to customer database"
                       required
                       class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-lg">
              </div>
              
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Risk Description *
                  <span class="text-gray-400 font-normal ml-1">(Detailed scenario and potential impact)</span>
                </label>
                <textarea name="description" 
                          id="risk-description"
                          rows="4" 
                          placeholder="Describe the risk scenario, potential causes, attack vectors, and expected business impact..."
                          required
                          class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"></textarea>
              </div>
            </div>
          </div>

          <!-- Section 2: Affected Services (Enhanced with visual indicators) -->
          <div class="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-6 shadow-sm">
            <div class="flex items-center justify-between mb-6">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-green-600 text-white rounded-full flex items-center justify-center text-lg font-bold mr-4 shadow-lg">2</div>
                <div>
                  <h4 class="text-xl font-bold text-gray-900">Affected Services</h4>
                  <p class="text-sm text-green-700">Select services impacted by this risk • Drives dynamic risk rating</p>
                </div>
              </div>
              <div id="service-selection-count" class="bg-white px-4 py-2 rounded-lg shadow-sm">
                <span class="text-sm text-gray-500">Selected:</span>
                <span class="text-xl font-bold text-green-600 ml-2">0</span>
              </div>
            </div>
            
            <div class="mb-4 flex items-center justify-between bg-white rounded-lg p-3 shadow-sm">
              <div class="flex items-center space-x-4">
                <input type="text" 
                       id="service-search" 
                       placeholder="🔍 Search services..."
                       class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 w-64">
                <select id="criticality-filter" class="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">All Criticality Levels</option>
                  <option value="critical">Critical Only</option>
                  <option value="high">High+</option>
                  <option value="medium">Medium+</option>
                </select>
              </div>
              <div class="text-sm text-gray-600">
                <i class="fas fa-info-circle mr-1"></i>
                Criticality affects risk rating
              </div>
            </div>
            
            <div id="services-container" class="space-y-3 max-h-96 overflow-y-auto pr-2">
              ${raw(services.length > 0 ? services.map(service => {
                const criticalityColor = 
                  service.criticality_score >= 80 ? 'border-red-300 bg-red-50 hover:bg-red-100' :
                  service.criticality_score >= 60 ? 'border-orange-300 bg-orange-50 hover:bg-orange-100' :
                  service.criticality_score >= 40 ? 'border-yellow-300 bg-yellow-50 hover:bg-yellow-100' :
                  'border-green-300 bg-green-50 hover:bg-green-100';
                
                const criticalityBadge = 
                  service.criticality_score >= 80 ? 'bg-red-600 text-white' :
                  service.criticality_score >= 60 ? 'bg-orange-500 text-white' :
                  service.criticality_score >= 40 ? 'bg-yellow-500 text-white' :
                  'bg-green-500 text-white';
                
                return `
                  <label class="service-item flex items-start gap-4 p-4 bg-white border-2 ${criticalityColor} rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer"
                         data-criticality="${service.criticality}"
                         data-criticality-score="${service.criticality_score}"
                         data-service-name="${service.name.toLowerCase()}"
                         data-service-id="${service.service_id}"
                         data-cia-score="${service.cia_score}"
                         data-dependency-count="${service.dependency_count}"
                         data-risk-count="${service.risk_count}">
                    <input type="checkbox" 
                           name="affected_services[]" 
                           value="${service.service_id}" 
                           onchange="updateServiceSelection()"
                           class="mt-1.5 h-5 w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded">
                    <div class="flex-1">
                      <div class="flex items-center justify-between mb-2">
                        <div class="text-base font-bold text-gray-900">${service.name}</div>
                        <div class="flex items-center space-x-2">
                          <span class="px-3 py-1 rounded-full text-xs font-bold ${criticalityBadge} shadow-sm">
                            ${service.criticality || 'Medium'} • ${service.criticality_score}
                          </span>
                        </div>
                      </div>
                      <div class="flex items-center flex-wrap gap-3 text-xs text-gray-600">
                        <span class="flex items-center">
                          <i class="fas fa-building text-blue-500 mr-1"></i>
                          ${service.business_department || 'Unknown Dept'}
                        </span>
                        <span class="flex items-center">
                          <i class="fas fa-shield-alt text-purple-500 mr-1"></i>
                          CIA: ${Math.round(service.cia_score)}/5
                        </span>
                        ${service.dependency_count > 0 ? `
                        <span class="flex items-center">
                          <i class="fas fa-link text-green-500 mr-1"></i>
                          ${service.dependency_count} dependencies
                        </span>
                        ` : ''}
                        ${service.risk_count > 0 ? `
                        <span class="flex items-center">
                          <i class="fas fa-exclamation-triangle text-red-500 mr-1"></i>
                          ${service.risk_count} existing risks
                        </span>
                        ` : ''}
                      </div>
                    </div>
                  </label>
                `;
              }).join('') : `
                <div class="text-center py-12 bg-white rounded-xl border-2 border-dashed border-gray-300">
                  <i class="fas fa-inbox text-gray-400 text-5xl mb-4"></i>
                  <p class="text-gray-600 mb-2">No active services found</p>
                  <a href="/operations/services" class="text-green-600 hover:text-green-700 font-medium underline">
                    <i class="fas fa-plus mr-1"></i>
                    Add services first
                  </a>
                </div>
              `)}
            </div>
          </div>

          <!-- Section 3: Risk Assessment (Manual ratings with AI suggestions) -->
          <div class="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-300 rounded-xl p-6 shadow-sm">
            <div class="flex items-center mb-6">
              <div class="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center text-lg font-bold mr-4 shadow-lg">3</div>
              <div>
                <h4 class="text-xl font-bold text-gray-900">Risk Assessment</h4>
                <p class="text-sm text-red-700">Evaluate probability and impact • AI will suggest values based on services</p>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Probability *
                  <span class="text-gray-400 font-normal ml-1">(Likelihood of occurrence)</span>
                </label>
                <select name="probability" 
                        id="probability-select"
                        required 
                        hx-post="/risk/calculate-score"
                        hx-trigger="change"
                        hx-target="#risk-score-container"
                        hx-include="[name='impact']"
                        class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-lg font-medium">
                  <option value="">Select Likelihood</option>
                  <option value="1">1 - Very Low (0-5%)</option>
                  <option value="2">2 - Low (6-25%)</option>
                  <option value="3">3 - Medium (26-50%)</option>
                  <option value="4">4 - High (51-75%)</option>
                  <option value="5">5 - Very High (76-100%)</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Impact *
                  <span class="text-gray-400 font-normal ml-1">(Consequence severity)</span>
                </label>
                <select name="impact" 
                        id="impact-select"
                        required 
                        hx-post="/risk/calculate-score"
                        hx-trigger="change"
                        hx-target="#risk-score-container"
                        hx-include="[name='probability']"
                        class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all text-lg font-medium">
                  <option value="">Select Impact</option>
                  <option value="1">1 - Minimal</option>
                  <option value="2">2 - Minor</option>
                  <option value="3">3 - Moderate</option>
                  <option value="4">4 - Major</option>
                  <option value="5">5 - Severe</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Risk Score
                  <span class="text-gray-400 font-normal ml-1">(Calculated)</span>
                </label>
                <div id="risk-score-container">
                  <div class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg bg-gray-100 text-gray-500 text-lg font-bold text-center">
                    -- TBD --
                  </div>
                </div>
              </div>
            </div>
            
            <div class="mt-4 bg-white rounded-lg p-4 border border-red-200">
              <p class="text-sm text-gray-600 flex items-center">
                <i class="fas fa-info-circle text-blue-500 mr-2"></i>
                Select services first to get AI-powered rating suggestions, or set manually
              </p>
            </div>
          </div>

          <!-- Section 4: AI-Powered Analysis -->
          <div class="bg-gradient-to-br from-purple-50 to-violet-50 border-2 border-purple-300 rounded-xl p-6 shadow-sm">
            <div class="flex items-center mb-6">
              <div class="w-10 h-10 bg-purple-600 text-white rounded-full flex items-center justify-center text-lg font-bold mr-4 shadow-lg">4</div>
              <div>
                <h4 class="text-xl font-bold text-gray-900">AI Risk Analysis</h4>
                <p class="text-sm text-purple-700">Get comprehensive AI-powered risk assessment</p>
              </div>
            </div>
            
            <div class="bg-white rounded-lg p-6 border border-purple-200">
              <p class="text-gray-700 mb-4">
                <i class="fas fa-robot text-purple-600 mr-2"></i>
                Analyze your risk using Cloudflare AI. Provide as much detail as possible in the risk title, description, and affected services.
              </p>
              <button type="button" 
                      id="ai-analyze-btn"
                      hx-post="/risk/analyze-ai"
                      hx-target="#ai-analysis-result"
                      hx-swap="innerHTML"
                      hx-include="[name='title'], [name='description'], [name='category'], [name='affected_services[]']"
                      class="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all flex items-center">
                <i class="fas fa-brain mr-2 text-lg"></i>
                Analyze Risk with AI
              </button>
              <div id="ai-analysis-result" class="mt-4"></div>
            </div>
          </div>

          <!-- Section 5: Risk Treatment & Controls -->
          <div class="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-6 shadow-sm">
            <div class="flex items-center mb-6">
              <div class="w-10 h-10 bg-yellow-600 text-white rounded-full flex items-center justify-center text-lg font-bold mr-4 shadow-lg">5</div>
              <div>
                <h4 class="text-xl font-bold text-gray-900">Risk Treatment & Controls</h4>
                <p class="text-sm text-yellow-700">Define response strategy and mitigation plan</p>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Treatment Strategy *
                  <span class="text-gray-400 font-normal ml-1">(How will you handle this risk?)</span>
                </label>
                <select name="treatment_strategy" 
                        id="treatment-strategy"
                        required 
                        class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all">
                  <option value="">Select Strategy</option>
                  <option value="accept">Accept - Monitor without active controls</option>
                  <option value="mitigate">Mitigate - Implement controls to reduce risk</option>
                  <option value="transfer">Transfer - Share risk with third party</option>
                  <option value="avoid">Avoid - Eliminate risk entirely</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">
                  Risk Owner *
                  <span class="text-gray-400 font-normal ml-1">(Accountable person)</span>
                </label>
                <select name="owner" required 
                        class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all">
                  <option value="">Select Owner</option>
                  <option value="avi_security">Avi Security</option>
                  <option value="admin_user">Admin User</option>
                  <option value="mike_chen">Mike Chen</option>
                  <option value="sarah_johnson">Sarah Johnson</option>
                  <option value="system_admin">System Admin</option>
                </select>
              </div>
            </div>
            
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-2">
                Mitigation Actions
                <span class="text-gray-400 font-normal ml-1">(Specific steps to reduce risk)</span>
              </label>
              <textarea name="mitigation_actions" 
                        id="mitigation-actions"
                        rows="4" 
                        placeholder="Describe planned or implemented risk mitigation actions:&#10;• Control measures&#10;• Process improvements&#10;• Technical solutions&#10;• Training requirements"
                        class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-all"></textarea>
            </div>
          </div>

          <!-- Form Result Area -->
          <div id="form-result"></div>

          <!-- Form Actions with enhanced styling -->
          <div class="flex justify-between items-center pt-6 border-t-2 border-gray-200">
            <div class="text-sm text-gray-500">
              <i class="fas fa-info-circle mr-1"></i>
              All fields marked with * are required
            </div>
            <div class="flex space-x-3">
              <button type="button" 
                      onclick="document.getElementById('modal-container').innerHTML = ''"
                      class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium transition-all">
                <i class="fas fa-times mr-2"></i>
                Cancel
              </button>
              <button type="submit" 
                      class="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all">
                <i class="fas fa-shield-alt mr-2"></i>
                Create Risk Assessment
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
    
    <script>
      // Enhanced service selection tracking with dynamic risk analysis
      let selectedServices = [];
      
      function updateServiceSelection() {
        const checkboxes = document.querySelectorAll('input[name="affected_services[]"]:checked');
        const count = checkboxes.length;
        
        // Update count display
        const countElement = document.getElementById('service-selection-count');
        if (countElement) {
          countElement.querySelector('span:last-child').textContent = count;
        }
        
        // Collect selected service data
        selectedServices = Array.from(checkboxes).map(checkbox => {
          const label = checkbox.closest('.service-item');
          return {
            service_id: label.dataset.serviceId,
            name: label.dataset.serviceName,
            criticality: label.dataset.criticality,
            criticality_score: parseFloat(label.dataset.criticalityScore),
            business_department: label.querySelector('.fa-building')?.parentElement?.textContent?.trim() || 'Unknown',
            cia_score: parseFloat(label.dataset.ciaScore) || 3,
            dependency_count: parseInt(label.dataset.dependencyCount) || 0,
            risk_count: parseInt(label.dataset.riskCount) || 0
          };
        });
        
        // Update AI intelligence panel
        if (count > 0) {
          updateAIIntelligencePanel(selectedServices);
        } else {
          hideAIIntelligencePanel();
        }
      }
      
      function updateAIIntelligencePanel(services) {
        const panel = document.getElementById('risk-intelligence-panel');
        if (!panel) return;
        
        // Calculate suggestions
        const avgCriticality = services.reduce((sum, s) => sum + s.criticality_score, 0) / services.length;
        const maxCriticality = Math.max(...services.map(s => s.criticality_score));
        const criticalCount = services.filter(s => s.criticality_score >= 80).length;
        const highCount = services.filter(s => s.criticality_score >= 60).length;
        const totalDeps = services.reduce((sum, s) => sum + s.dependency_count, 0);
        const totalRisks = services.reduce((sum, s) => sum + s.risk_count, 0);
        
        // Calculate suggested values
        let suggestedImpact = 3;
        if (maxCriticality >= 80) suggestedImpact = 5;
        else if (maxCriticality >= 60) suggestedImpact = 4;
        else if (avgCriticality >= 50) suggestedImpact = 3;
        else suggestedImpact = 2;
        
        let suggestedProbability = 3;
        if (totalRisks > 5 || totalDeps > 10) suggestedProbability = 4;
        else if (services.length > 3) suggestedProbability = 4;
        else if (criticalCount > 0) suggestedProbability = 3;
        
        // Generate reasoning
        const reasoning = [];
        if (maxCriticality >= 80) {
          reasoning.push(\`Critical services affected (score ≥80) → SEVERE impact recommended\`);
        } else if (maxCriticality >= 60) {
          reasoning.push(\`High criticality services (60-79) → MAJOR impact recommended\`);
        }
        
        if (totalRisks > 5) {
          reasoning.push(\`High existing risk count (\${totalRisks}) → Elevated probability\`);
        }
        
        if (services.length > 3) {
          reasoning.push(\`Multiple services affected (\${services.length}) → Broader impact\`);
        }
        
        const uniqueDepts = new Set(services.map(s => s.business_department)).size;
        if (uniqueDepts > 2) {
          reasoning.push(\`Spans \${uniqueDepts} departments → Cross-functional impact\`);
        }
        
        if (criticalCount > 0) {
          reasoning.push(\`\${criticalCount} critical service(s) selected → High priority\`);
        }
        
        // Update panel display
        panel.classList.remove('hidden');
        document.getElementById('suggested-probability').textContent = suggestedProbability;
        document.getElementById('suggested-impact').textContent = suggestedImpact;
        
        const probabilityLabels = ['', 'Very Low', 'Low', 'Medium', 'High', 'Very High'];
        const impactLabels = ['', 'Minimal', 'Minor', 'Moderate', 'Major', 'Severe'];
        document.getElementById('probability-label').textContent = probabilityLabels[suggestedProbability];
        document.getElementById('impact-label').textContent = impactLabels[suggestedImpact];
        
        // Confidence based on data completeness
        const confidence = Math.min(95, 60 + (services.length * 5) + (criticalCount * 10));
        document.getElementById('intelligence-badge').querySelector('.text-lg').textContent = confidence + '%';
        
        // Update reasoning list
        const reasoningList = document.getElementById('reasoning-list');
        reasoningList.innerHTML = reasoning.map(r => 
          \`<li class="flex items-start">
            <i class="fas fa-chevron-right text-purple-400 text-xs mt-1 mr-2"></i>
            <span>\${r}</span>
          </li>\`
        ).join('');
        
        // Store for apply function
        window.aiSuggestions = {
          probability: suggestedProbability,
          impact: suggestedImpact
        };
      }
      
      function hideAIIntelligencePanel() {
        const panel = document.getElementById('risk-intelligence-panel');
        if (panel) {
          panel.classList.add('hidden');
        }
        window.aiSuggestions = null;
      }
      
      function applyAISuggestions() {
        if (!window.aiSuggestions) return;
        
        const probSelect = document.getElementById('probability-select');
        const impactSelect = document.getElementById('impact-select');
        
        if (probSelect) {
          probSelect.value = window.aiSuggestions.probability;
          probSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        if (impactSelect) {
          impactSelect.value = window.aiSuggestions.impact;
          impactSelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // Show confirmation
        const panel = document.getElementById('risk-intelligence-panel');
        const originalBg = panel.className;
        panel.className = panel.className.replace('from-purple-50 to-indigo-50', 'from-green-50 to-emerald-50');
        setTimeout(() => {
          panel.className = originalBg;
        }, 1000);
      }
      
      // Service search and filter
      document.getElementById('service-search')?.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        const items = document.querySelectorAll('.service-item');
        items.forEach(item => {
          const name = item.dataset.serviceName;
          item.style.display = name.includes(searchTerm) ? '' : 'none';
        });
      });
      
      document.getElementById('criticality-filter')?.addEventListener('change', function(e) {
        const filter = e.target.value;
        const items = document.querySelectorAll('.service-item');
        items.forEach(item => {
          const crit = item.dataset.criticality.toLowerCase();
          let show = true;
          if (filter === 'critical' && crit !== 'critical') show = false;
          if (filter === 'high' && !['critical', 'high'].includes(crit)) show = false;
          if (filter === 'medium' && !['critical', 'high', 'medium'].includes(crit)) show = false;
          item.style.display = show ? '' : 'none';
        });
      });
    </script>
  </div>
  `;
}
