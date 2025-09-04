import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import type { CloudflareBindings } from '../types';

export function createRiskRoutesHTMX() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware
  app.use('*', requireAuth);
  
  // Main risks page - Completely rebuilt with HTMX
  app.get('/', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Risk Management',
        user,
        content: renderRiskManagementPage(user)
      })
    );
  });

  // Risk Create Modal - Full ARIA5 functionality in HTMX
  app.get('/create', async (c) => {
    return c.html(renderRiskModal());
  });

  // Risk Edit Modal
  app.get('/edit/:id', async (c) => {
    const riskId = c.req.param('id');
    // In a real implementation, fetch risk data from database
    const risk = {
      id: riskId,
      risk_id: `RISK-${riskId}`,
      title: 'Sample Risk',
      description: 'Sample description',
      category_id: 1,
      organization_id: 1,
      owner_id: 1,
      probability: 3,
      impact: 4,
      risk_score: 12,
      status: 'active',
      priority: 'high'
    };
    
    return c.html(renderRiskModal(risk));
  });

  // AI Analysis endpoint
  app.post('/analyze-ai', async (c) => {
    const body = await c.req.parseBody();
    const riskData = {
      title: body.title,
      description: body.description,
      category: body.category,
      assetType: body.assetType,
      serviceType: body.serviceType
    };
    
    return c.html(renderAISuggestions(riskData));
  });

  // Control mapping suggestions
  app.get('/controls/:standard', async (c) => {
    const standard = c.req.param('standard');
    return c.html(renderControlMappings(standard));
  });

  // Risk Score Calculator
  app.post('/calculate-score', async (c) => {
    const body = await c.req.parseBody();
    const probability = parseInt(body.probability as string);
    const impact = parseInt(body.impact as string);
    const score = probability * impact;
    const level = getRiskLevel(score);
    
    return c.html(html`
      <div class="form-input bg-gray-50 text-center font-bold ${level.color}">
        ${score} - ${level.label}
      </div>
    `);
  });

  // Risk form submission
  app.post('/submit', async (c) => {
    const body = await c.req.parseBody();
    
    // Here you would save to database
    console.log('Risk submission:', body);
    
    // Return success response for HTMX
    return c.html(html`
      <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-center">
          <i class="fas fa-check-circle text-green-500 mr-2"></i>
          <span class="text-green-700 font-medium">Risk saved successfully!</span>
        </div>
      </div>
    `);
  });

  // Risk table data (for main page)
  app.get('/table', async (c) => {
    const page = parseInt(c.req.query('page') || '1');
    const search = c.req.query('search') || '';
    const status = c.req.query('status') || '';
    const category = c.req.query('category') || '';
    
    // Mock data for now
    const risks = generateMockRisks();
    return c.html(renderRiskTable(risks, { page, search, status, category }));
  });

  // Risk statistics
  app.get('/stats', async (c) => {
    const stats = {
      total: 45,
      critical: 8,
      high: 12,
      medium: 15,
      low: 10,
      active: 32,
      mitigated: 8,
      accepted: 5
    };
    return c.html(renderRiskStats(stats));
  });

  return app;
}

// Main Risk Management Page - Rebuilt with HTMX
const renderRiskManagementPage = (user: any) => html`
  <div class="min-h-screen bg-gray-50">
    <!-- Header Section -->
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Risk Management</h1>
            <p class="mt-1 text-sm text-gray-600">
              Comprehensive risk identification, assessment, and mitigation platform
            </p>
          </div>
          <div class="flex space-x-3">
            <button hx-get="/risk/create" 
                    hx-target="#modal-container" 
                    hx-swap="innerHTML"
                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
              <i class="fas fa-plus mr-2"></i>New Risk
            </button>
            <button class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center">
              <i class="fas fa-download mr-2"></i>Export
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Statistics Cards -->
      <div id="risk-stats" 
           hx-get="/risk/stats" 
           hx-trigger="load"
           hx-swap="innerHTML"
           class="mb-8">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-white p-4 rounded-lg shadow animate-pulse">
            <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div class="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>

      <!-- Filters and Search -->
      <div class="bg-white rounded-lg shadow mb-6 p-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input type="text" 
                   name="search"
                   placeholder="Search risks..."
                   hx-get="/risk/table"
                   hx-trigger="keyup changed delay:300ms"
                   hx-target="#risk-table"
                   hx-include="[name='status'], [name='category']"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status"
                    hx-get="/risk/table"
                    hx-trigger="change"
                    hx-target="#risk-table"
                    hx-include="[name='search'], [name='category']"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="mitigated">Mitigated</option>
              <option value="accepted">Accepted</option>
              <option value="monitoring">Monitoring</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select name="category"
                    hx-get="/risk/table"
                    hx-trigger="change"
                    hx-target="#risk-table"
                    hx-include="[name='search'], [name='status']"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Categories</option>
              <option value="1">Cybersecurity</option>
              <option value="2">Data Privacy</option>
              <option value="3">Operational Risk</option>
              <option value="4">Financial Risk</option>
              <option value="5">Regulatory Compliance</option>
              <option value="6">Third-Party Risk</option>
            </select>
          </div>
          
          <div class="flex items-end">
            <button hx-get="/risk/table"
                    hx-target="#risk-table"
                    hx-include="[name='search'], [name='status'], [name='category']"
                    class="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md">
              <i class="fas fa-sync mr-2"></i>Refresh
            </button>
          </div>
        </div>
      </div>

      <!-- Risk Table -->
      <div class="bg-white rounded-lg shadow">
        <div id="risk-table" 
             hx-get="/risk/table" 
             hx-trigger="load"
             hx-swap="innerHTML">
          <!-- Loading placeholder -->
          <div class="p-8 text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p class="text-gray-600 mt-2">Loading risks...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

// Complete Risk Modal - Replicating all ARIA5 functionality with HTMX
const renderRiskModal = (risk: any = null) => {
  const isEdit = risk !== null;
  
  return html`
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" id="risk-modal">
      <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <!-- Modal Header -->
        <div class="flex justify-between items-center pb-3 border-b">
          <h3 class="text-xl font-semibold text-gray-900">
            <i class="fas fa-exclamation-triangle text-red-500 mr-2"></i>
            ${isEdit ? 'Edit Risk' : 'Create New Risk'}
          </h3>
          <button onclick="document.getElementById('risk-modal').remove()" 
                  class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <!-- Risk Form -->
        <div class="mt-4 max-h-96 overflow-y-auto">
          <form id="risk-form" 
                hx-post="/risk/submit"
                hx-target="#form-result"
                hx-swap="innerHTML"
                class="space-y-6">
            
            <!-- Basic Risk Information -->
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 class="text-lg font-medium text-blue-900 mb-4 flex items-center">
                <i class="fas fa-info-circle mr-2"></i>
                Risk Information
              </h4>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Risk ID *</label>
                  <input type="text" 
                         name="risk_id" 
                         value="${risk?.risk_id || ''}" 
                         ${isEdit ? 'readonly' : ''}
                         required
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Risk Category *</label>
                  <select name="category_id" 
                          required
                          hx-post="/risk/analyze-ai"
                          hx-trigger="change"
                          hx-target="#ai-suggestions"
                          hx-include="[name='title'], [name='description']"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
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
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Organization *</label>
                  <select name="organization_id" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Organization</option>
                    <option value="1" ${risk?.organization_id === 1 ? 'selected' : ''}>Default Organization</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Risk Owner *</label>
                  <select name="owner_id" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Owner</option>
                    <option value="1" ${risk?.owner_id === 1 ? 'selected' : ''}>Admin User</option>
                    <option value="2" ${risk?.owner_id === 2 ? 'selected' : ''}>Avi Security</option>
                  </select>
                </div>
              </div>
              
              <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Risk Title *</label>
                <input type="text" 
                       name="title" 
                       value="${risk?.title || ''}" 
                       required
                       hx-post="/risk/analyze-ai"
                       hx-trigger="keyup changed delay:500ms"
                       hx-target="#ai-suggestions"
                       hx-include="[name='description'], [name='category_id']"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              
              <div class="mt-4">
                <label class="block text-sm font-medium text-gray-700 mb-1">Risk Description *</label>
                <textarea name="description" 
                          rows="4" 
                          required 
                          placeholder="Provide detailed description of the risk scenario and potential impacts..."
                          hx-post="/risk/analyze-ai"
                          hx-trigger="keyup changed delay:500ms"
                          hx-target="#ai-suggestions"
                          hx-include="[name='title'], [name='category_id']"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">${risk?.description || ''}</textarea>
                <p class="text-sm text-blue-600 mt-1">
                  <i class="fas fa-robot mr-1"></i>
                  Detailed descriptions help AI suggest relevant controls automatically
                </p>
              </div>
            </div>

            <!-- Risk Assessment -->
            <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 class="text-lg font-medium text-orange-900 mb-4 flex items-center">
                <i class="fas fa-chart-line mr-2"></i>
                Risk Assessment
              </h4>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Likelihood (1-5) *</label>
                  <select name="probability" 
                          required
                          hx-post="/risk/calculate-score"
                          hx-trigger="change"
                          hx-target="#risk-score-display"
                          hx-include="[name='impact']"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select</option>
                    <option value="1" ${risk?.probability === 1 ? 'selected' : ''}>1 - Very Low (0-5%)</option>
                    <option value="2" ${risk?.probability === 2 ? 'selected' : ''}>2 - Low (6-25%)</option>
                    <option value="3" ${risk?.probability === 3 ? 'selected' : ''}>3 - Medium (26-50%)</option>
                    <option value="4" ${risk?.probability === 4 ? 'selected' : ''}>4 - High (51-75%)</option>
                    <option value="5" ${risk?.probability === 5 ? 'selected' : ''}>5 - Very High (76-100%)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Impact (1-5) *</label>
                  <select name="impact" 
                          required
                          hx-post="/risk/calculate-score"
                          hx-trigger="change"
                          hx-target="#risk-score-display"
                          hx-include="[name='probability']"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select</option>
                    <option value="1" ${risk?.impact === 1 ? 'selected' : ''}>1 - Minimal</option>
                    <option value="2" ${risk?.impact === 2 ? 'selected' : ''}>2 - Minor</option>
                    <option value="3" ${risk?.impact === 3 ? 'selected' : ''}>3 - Moderate</option>
                    <option value="4" ${risk?.impact === 4 ? 'selected' : ''}>4 - Major</option>
                    <option value="5" ${risk?.impact === 5 ? 'selected' : ''}>5 - Severe</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Risk Score</label>
                  <div id="risk-score-display" class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-center font-bold">
                    ${risk?.risk_score || 'Auto-calculated'}
                  </div>
                </div>
              </div>
            </div>

            <!-- AI-Powered Control Mapping -->
            <div class="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 class="text-lg font-medium text-indigo-900 mb-4 flex items-center">
                <i class="fas fa-robot mr-2"></i>
                AI-Powered Control Mapping
              </h4>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-1">Compliance Standard</label>
                  <select name="compliance_standard" 
                          hx-get="/risk/controls/{value}"
                          hx-trigger="change"
                          hx-target="#control-mappings"
                          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Standard for AI Mapping</option>
                    <option value="SOC2">SOC 2</option>
                    <option value="ISO27001">ISO 27001</option>
                    <option value="NIST">NIST Framework</option>
                  </select>
                </div>
                <div class="flex items-end">
                  <button type="button" 
                          hx-post="/risk/analyze-ai"
                          hx-target="#ai-suggestions"
                          hx-include="form"
                          class="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md">
                    <i class="fas fa-brain mr-2"></i>Analyze Risk with AI
                  </button>
                </div>
              </div>
              
              <!-- AI Suggestions Container -->
              <div id="ai-suggestions">
                <!-- AI suggestions will be populated here via HTMX -->
              </div>
              
              <!-- Control Mappings Container -->
              <div id="control-mappings">
                <!-- Control mappings will be populated here via HTMX -->
              </div>
            </div>

            <!-- Form Result Area -->
            <div id="form-result"></div>

            <!-- Form Actions -->
            <div class="flex justify-end space-x-3 pt-4 border-t">
              <button type="button" 
                      onclick="document.getElementById('risk-modal').remove()"
                      class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md">
                Cancel
              </button>
              <button type="submit" 
                      class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                <i class="fas fa-save mr-2"></i>
                ${isEdit ? 'Update Risk' : 'Create Risk'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
};

// AI Suggestions Component
const renderAISuggestions = (riskData: any) => html`
  <div class="bg-white border border-indigo-200 rounded p-4 mt-4">
    <h5 class="font-medium text-gray-900 mb-3 flex items-center">
      <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
      AI-Suggested Control Mappings
    </h5>
    <div class="space-y-2">
      <!-- Mock AI suggestions based on risk data -->
      <label class="flex items-center">
        <input type="checkbox" name="suggested_controls[]" value="AC-2" class="mr-2">
        <span class="text-sm">AC-2: Account Management - Implement proper user account lifecycle</span>
      </label>
      <label class="flex items-center">
        <input type="checkbox" name="suggested_controls[]" value="SI-4" class="mr-2">
        <span class="text-sm">SI-4: Information System Monitoring - Deploy monitoring solutions</span>
      </label>
      <label class="flex items-center">
        <input type="checkbox" name="suggested_controls[]" value="RA-5" class="mr-2">
        <span class="text-sm">RA-5: Vulnerability Scanning - Regular vulnerability assessments</span>
      </label>
    </div>
    <div class="mt-3 pt-3 border-t border-gray-200">
      <button type="button" class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-sm">
        <i class="fas fa-check mr-1"></i>Apply Selected Suggestions
      </button>
    </div>
  </div>
`;

// Control Mappings Component
const renderControlMappings = (standard: string) => html`
  <div class="bg-white border border-indigo-200 rounded p-4 mt-4">
    <h5 class="font-medium text-gray-900 mb-3">${standard} Control Framework</h5>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
      ${standard === 'SOC2' ? html`
        <div>• CC6.1 - Logical and Physical Access Controls</div>
        <div>• CC6.2 - System Access is Removed</div>
        <div>• CC7.1 - System Boundaries and Components</div>
        <div>• CC8.1 - Change Management</div>
      ` : standard === 'ISO27001' ? html`
        <div>• A.9.1.1 - Access Control Policy</div>
        <div>• A.12.6.1 - Management of Technical Vulnerabilities</div>
        <div>• A.16.1.1 - Responsibilities and Procedures</div>
        <div>• A.18.1.1 - Identification of Applicable Legislation</div>
      ` : html`
        <div>• ID.AM-1 - Physical devices and systems</div>
        <div>• PR.AC-1 - Identities and credentials</div>
        <div>• DE.CM-1 - Network monitoring</div>
        <div>• RS.RP-1 - Response plan executed</div>
      `}
    </div>
  </div>
`;

// Risk Statistics Component
const renderRiskStats = (stats: any) => html`
  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div class="bg-white p-6 rounded-lg shadow">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-500">Total Risks</p>
          <p class="text-2xl font-semibold text-gray-900">${stats.total}</p>
        </div>
      </div>
    </div>
    
    <div class="bg-white p-6 rounded-lg shadow">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <i class="fas fa-fire text-2xl text-red-600"></i>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-500">Critical</p>
          <p class="text-2xl font-semibold text-red-600">${stats.critical}</p>
        </div>
      </div>
    </div>
    
    <div class="bg-white p-6 rounded-lg shadow">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <i class="fas fa-shield-check text-2xl text-green-500"></i>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-500">Mitigated</p>
          <p class="text-2xl font-semibold text-green-600">${stats.mitigated}</p>
        </div>
      </div>
    </div>
    
    <div class="bg-white p-6 rounded-lg shadow">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <i class="fas fa-chart-line text-2xl text-blue-500"></i>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-500">Active</p>
          <p class="text-2xl font-semibold text-blue-600">${stats.active}</p>
        </div>
      </div>
    </div>
  </div>
`;

// Risk Table Component
const renderRiskTable = (risks: any[], filters: any) => html`
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk ID</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        ${risks.map(risk => html`
          <tr class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              ${risk.risk_id}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
              ${risk.title}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              ${risk.category}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskScoreColor(risk.score)}">
                ${risk.score} - ${getRiskLevel(risk.score).label}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(risk.status)}">
                ${risk.status}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              ${risk.owner}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button hx-get="/risk/edit/${risk.id}"
                      hx-target="#modal-container"
                      class="text-indigo-600 hover:text-indigo-900 mr-3">
                <i class="fas fa-edit"></i>
              </button>
              <button class="text-red-600 hover:text-red-900">
                <i class="fas fa-trash"></i>
              </button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
`;

// Helper functions
const getRiskLevel = (score: number) => {
  if (score >= 20) return { label: 'Critical', color: 'text-red-600' };
  if (score >= 15) return { label: 'High', color: 'text-orange-600' };
  if (score >= 10) return { label: 'Medium', color: 'text-yellow-600' };
  if (score >= 5) return { label: 'Low', color: 'text-green-600' };
  return { label: 'Very Low', color: 'text-gray-600' };
};

const getRiskScoreColor = (score: number) => {
  if (score >= 20) return 'bg-red-100 text-red-800';
  if (score >= 15) return 'bg-orange-100 text-orange-800';
  if (score >= 10) return 'bg-yellow-100 text-yellow-800';
  if (score >= 5) return 'bg-green-100 text-green-800';
  return 'bg-gray-100 text-gray-800';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-red-100 text-red-800';
    case 'mitigated': return 'bg-green-100 text-green-800';
    case 'accepted': return 'bg-yellow-100 text-yellow-800';
    case 'monitoring': return 'bg-blue-100 text-blue-800';
    case 'closed': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

// Mock data generator
const generateMockRisks = () => {
  return [
    {
      id: 1,
      risk_id: 'RISK-001',
      title: 'Unauthorized Database Access',
      category: 'Cybersecurity',
      score: 16,
      status: 'active',
      owner: 'Avi Security'
    },
    {
      id: 2,
      risk_id: 'RISK-002',
      title: 'GDPR Compliance Gap',
      category: 'Data Privacy',
      score: 12,
      status: 'mitigated',
      owner: 'Admin User'
    },
    {
      id: 3,
      risk_id: 'RISK-003',
      title: 'Third-Party Vendor Risk',
      category: 'Third-Party Risk',
      score: 8,
      status: 'monitoring',
      owner: 'Avi Security'
    }
  ];
};