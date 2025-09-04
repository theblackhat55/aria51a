import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import { createAIService } from '../services/ai-providers';
import type { CloudflareBindings } from '../types';

export function createRiskRoutesARIA5() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware
  app.use('*', requireAuth);
  
  // Main risk management page - exact match to ARIA5
  app.get('/', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Risk Management',
        user,
        content: renderARIA5RiskManagement()
      })
    );
  });

  // Risk statistics (HTMX endpoint) - D1 Database Integration
  app.get('/stats', async (c) => {
    try {
      const result = await c.env.DB.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN risk_score >= 20 THEN 1 ELSE 0 END) as critical,
          SUM(CASE WHEN risk_score >= 12 AND risk_score < 20 THEN 1 ELSE 0 END) as high,
          SUM(CASE WHEN risk_score >= 6 AND risk_score < 12 THEN 1 ELSE 0 END) as medium,
          SUM(CASE WHEN risk_score < 6 THEN 1 ELSE 0 END) as low
        FROM risks 
        WHERE status = 'active'
      `).first();

      const stats = {
        total: result?.total || 0,
        critical: result?.critical || 0,
        high: result?.high || 0,
        medium: result?.medium || 0,
        low: result?.low || 0
      };

      return c.html(renderRiskStats(stats));
    } catch (error) {
      console.error('Error fetching risk statistics:', error);
      // Fallback to empty stats
      const stats = { total: 0, critical: 0, high: 0, medium: 0, low: 0 };
      return c.html(renderRiskStats(stats));
    }
  });

  // Risk table (HTMX endpoint) - D1 Database Integration
  app.get('/table', async (c) => {
    try {
      const result = await c.env.DB.prepare(`
        SELECT 
          r.*,
          u.first_name || ' ' || u.last_name as owner_name
        FROM risks r
        LEFT JOIN users u ON r.owner_id = u.id
        WHERE r.status = 'active'
        ORDER BY r.risk_score DESC, r.created_at DESC
        LIMIT 50
      `).all();

      const risks = result.results || [];
      return c.html(renderRiskTable(risks));
    } catch (error) {
      console.error('Error fetching risk table data:', error);
      return c.html(renderRiskTable([]));
    }
  });

  // Create risk modal
  app.get('/create', async (c) => {
    return c.html(renderCreateRiskModal());
  });

  // Risk score calculation endpoint
  app.post('/calculate-score', async (c) => {
    const body = await c.req.parseBody();
    const likelihood = parseInt(body.likelihood as string);
    const impact = parseInt(body.impact as string);
    
    if (!likelihood || !impact) {
      return c.html(`<input type="text" name="risk_score" value="TBD" readonly class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">`);
    }
    
    const score = likelihood * impact;
    let level = 'Low';
    let colorClass = 'text-green-600';
    
    if (score >= 20) {
      level = 'Critical';
      colorClass = 'text-red-600';
    } else if (score >= 15) {
      level = 'High'; 
      colorClass = 'text-orange-600';
    } else if (score >= 10) {
      level = 'Medium';
      colorClass = 'text-yellow-600';
    } else if (score >= 5) {
      level = 'Low';
      colorClass = 'text-green-600';
    } else {
      level = 'Very Low';
      colorClass = 'text-gray-600';
    }
    
    return c.html(`
      <input type="text" 
             name="risk_score" 
             value="${score} - ${level}" 
             readonly
             class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 font-medium ${colorClass}">
    `);
  });

  // AI Risk Analysis endpoint
  app.post('/analyze-ai', async (c) => {
    const { env } = c;
    const formData = await c.req.parseBody();
    
    try {
      const aiService = createAIService(env);
      
      if (!aiService) {
        return c.html(html`
          <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
              <span class="text-yellow-800 font-medium">AI providers not configured</span>
            </div>
            <p class="text-yellow-700 text-sm mt-1">
              Configure OpenAI, Anthropic, or Gemini API keys to enable AI risk analysis.
            </p>
          </div>
        `);
      }

      // Extract risk information from form
      const riskRequest = {
        title: formData.title as string || 'Untitled Risk',
        description: formData.description as string || 'No description provided',
        category: formData.category as string,
        affectedServices: Array.isArray(formData['affected_services[]']) 
          ? formData['affected_services[]'] as string[]
          : formData['affected_services[]'] ? [formData['affected_services[]'] as string] : [],
        existingControls: []
      };

      // Show loading state first
      const loadingHtml = html`
        <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div class="flex items-center">
            <i class="fas fa-spinner fa-spin text-blue-500 mr-2"></i>
            <span class="text-blue-700 font-medium">Analyzing risk with AI...</span>
          </div>
          <p class="text-blue-600 text-sm mt-1">This may take a few moments.</p>
        </div>
      `;

      // Perform AI analysis
      const analysis = await aiService.analyzeRisk(riskRequest);
      
      return c.html(html`
        <div class="space-y-4">
          <!-- Risk Assessment Results -->
          <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-center mb-3">
              <i class="fas fa-check-circle text-green-500 mr-2"></i>
              <span class="text-green-700 font-medium">AI Analysis Complete</span>
            </div>
            
            <!-- Risk Score Assessment -->
            <div class="bg-white rounded p-3 mb-3">
              <h4 class="font-semibold text-gray-900 mb-2">Risk Assessment</h4>
              <div class="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span class="text-gray-600">Likelihood:</span>
                  <span class="ml-1 font-medium">${analysis.riskAssessment.likelihood}/5</span>
                </div>
                <div>
                  <span class="text-gray-600">Impact:</span>
                  <span class="ml-1 font-medium">${analysis.riskAssessment.impact}/5</span>
                </div>
                <div>
                  <span class="text-gray-600">Risk Score:</span>
                  <span class="ml-1 font-medium">${analysis.riskAssessment.riskScore}/25</span>
                </div>
              </div>
              <p class="text-gray-700 text-sm mt-2">${analysis.riskAssessment.reasoning}</p>
            </div>

            <!-- Control Suggestions -->
            <div class="bg-white rounded p-3 mb-3">
              <h4 class="font-semibold text-gray-900 mb-2">Recommended Controls</h4>
              <div class="space-y-2">
                ${analysis.controlSuggestions.slice(0, 3).map(control => html`
                  <div class="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div>
                      <span class="font-medium text-sm">${control.framework} ${control.controlId}</span>
                      <p class="text-xs text-gray-600">${control.controlName}</p>
                    </div>
                    <span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      ${control.relevance}/10
                    </span>
                  </div>
                `)}
              </div>
            </div>

            <!-- Mitigation Strategies -->
            <div class="bg-white rounded p-3">
              <h4 class="font-semibold text-gray-900 mb-2">Mitigation Strategies</h4>
              <ul class="text-sm text-gray-700 space-y-1">
                ${analysis.mitigationStrategies.slice(0, 3).map(strategy => html`
                  <li class="flex items-start">
                    <i class="fas fa-arrow-right text-gray-400 mr-2 mt-1 text-xs"></i>
                    ${strategy}
                  </li>
                `)}
              </ul>
            </div>
          </div>
        </div>
      `);
    } catch (error) {
      console.error('AI analysis error:', error);
      return c.html(html`
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center">
            <i class="fas fa-times-circle text-red-500 mr-2"></i>
            <span class="text-red-700 font-medium">AI analysis failed</span>
          </div>
          <p class="text-red-600 text-sm mt-1">${error.message}</p>
        </div>
      `);
    }
  });

  // Risk form submission - D1 Database Integration
  app.post('/create', async (c) => {
    const formData = await c.req.parseBody();
    
    try {
      // Process comprehensive form data
      const riskData = {
        title: formData.title as string,
        description: formData.description as string || '',
        category: formData.category as string || 'operational',
        subcategory: formData.threat_source as string || '',
        probability: parseInt(formData.likelihood as string) || 1,
        impact: parseInt(formData.impact as string) || 1,
        status: 'active',
        owner_id: 2, // Default to Avi Security user
        organization_id: 1, // Default organization
        created_by: 2,
        affected_assets: JSON.stringify(formData['affected_services[]'] || []),
        source: formData.treatment_strategy as string || 'manual_assessment',
        review_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days from now
      };

      // Save to D1 database
      const result = await c.env.DB.prepare(`
        INSERT INTO risks (
          title, description, category, subcategory, probability, impact, 
          status, owner_id, organization_id, created_by, affected_assets, 
          source, review_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        riskData.title,
        riskData.description,
        riskData.category,
        riskData.subcategory,
        riskData.probability,
        riskData.impact,
        riskData.status,
        riskData.owner_id,
        riskData.organization_id,
        riskData.created_by,
        riskData.affected_assets,
        riskData.source,
        riskData.review_date,
        new Date().toISOString(),
        new Date().toISOString()
      ).run();

      const riskId = result.meta?.last_row_id;
      const riskScore = riskData.probability * riskData.impact;

      console.log('Risk created in D1 database:', { id: riskId, ...riskData });
      
      // Return success response
      return c.html(`
        <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-center">
            <i class="fas fa-check-circle text-green-500 mr-2"></i>
            <span class="text-green-700 font-medium">Risk assessment created successfully!</span>
          </div>
          <div class="mt-2 text-sm text-green-600">
            Risk ID: ${riskId} | Title: ${riskData.title} | Score: ${riskScore} | Saved to Database
          </div>
        </div>
        <script>
          setTimeout(() => {
            document.getElementById('modal-container').innerHTML = '';
            // Refresh the risk table and dashboard stats
            htmx.ajax('GET', '/risk/table', '#risk-table');
            htmx.ajax('GET', '/dashboard/cards/risks', '#risk-card');
          }, 3000);
        </script>
      `);
    } catch (error) {
      console.error('Error creating risk in database:', error);
      
      return c.html(`
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center">
            <i class="fas fa-exclamation-triangle text-red-500 mr-2"></i>
            <span class="text-red-700 font-medium">Error creating risk assessment</span>
          </div>
          <div class="mt-2 text-sm text-red-600">
            Please check all required fields and try again. Error: ${error.message}
          </div>
        </div>
      `);
    }
  });

  return app;
}

// Helper Functions for Risk Management
function getRiskLevel(score: number): string {
  if (score >= 20) return 'Critical';
  if (score >= 15) return 'High';
  if (score >= 10) return 'Medium';
  if (score >= 5) return 'Low';
  return 'Very Low';
}

function getRiskColorClass(level: string): string {
  const colorMap: Record<string, string> = {
    'Critical': 'bg-red-100 text-red-800',
    'High': 'bg-orange-100 text-orange-800',
    'Medium': 'bg-yellow-100 text-yellow-800',
    'Low': 'bg-green-100 text-green-800',
    'Very Low': 'bg-gray-100 text-gray-800'
  };
  return colorMap[level] || 'bg-gray-100 text-gray-800';
}

// Main Risk Management Page - Matching ARIA5 Design Exactly
const renderARIA5RiskManagement = () => html`
  <div class="min-h-screen bg-gray-50">
    <!-- Page Header -->
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Risk Management</h1>
            <p class="mt-1 text-sm text-gray-600">Manage organizational risks and mitigation strategies</p>
          </div>
          <div class="flex space-x-3">
            <button class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center">
              <i class="fas fa-upload mr-2"></i>Import
            </button>
            <button class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center">
              <i class="fas fa-download mr-2"></i>Export  
            </button>
            <button hx-get="/risk/create"
                    hx-target="#modal-container"
                    hx-swap="innerHTML"
                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
              <i class="fas fa-plus mr-2"></i>Add Risk
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
           class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <!-- Loading placeholders -->
        <div class="bg-white rounded-lg shadow p-6 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div class="bg-white rounded-lg shadow p-6 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div class="bg-white rounded-lg shadow p-6 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
        <div class="bg-white rounded-lg shadow p-6 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>

      <!-- Filters Section -->
      <div class="bg-white rounded-lg shadow mb-6 p-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input type="text" 
                   name="search"
                   placeholder="Search risks..."
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">All Status</label>
            <select name="status" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="mitigated">Mitigated</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">All Categories</label>
            <select name="category" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Categories</option>
              <option value="cybersecurity">Cybersecurity</option>
              <option value="data-privacy">Data Privacy</option>
              <option value="third-party">Third-Party Risk</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">All Risk Levels</label>
            <select name="risk_level" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Risk Levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Risk Register Table -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Risk Register</h3>
        </div>
        
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

// Risk Statistics Cards - Real Database Data
const renderRiskStats = (stats: any) => html`
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <i class="fas fa-exclamation-triangle text-2xl text-red-500"></i>
      </div>
      <div class="ml-4">
        <p class="text-sm font-medium text-gray-500">Critical Risks</p>
        <p class="text-2xl font-semibold text-gray-900">${stats?.critical || 0}</p>
      </div>
    </div>
  </div>
  
  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <i class="fas fa-fire text-2xl text-orange-500"></i>
      </div>
      <div class="ml-4">
        <p class="text-sm font-medium text-gray-500">High Risks</p>
        <p class="text-2xl font-semibold text-gray-900">${stats?.high || 0}</p>
      </div>
    </div>
  </div>

  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <i class="fas fa-check-circle text-2xl text-green-500"></i>
      </div>
      <div class="ml-4">
        <p class="text-sm font-medium text-gray-500">Medium Risks</p>
        <p class="text-2xl font-semibold text-gray-900">${stats?.medium || 0}</p>
      </div>
    </div>
  </div>

  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <i class="fas fa-info-circle text-2xl text-yellow-500"></i>
      </div>
      <div class="ml-4">
        <p class="text-sm font-medium text-gray-500">Low Risks</p>
        <p class="text-2xl font-semibold text-gray-900">${stats?.low || 0}</p>
      </div>
    </div>
  </div>

  <div class="bg-white rounded-lg shadow p-6">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <i class="fas fa-chart-line text-2xl text-blue-500"></i>
      </div>
      <div class="ml-4">
        <p class="text-sm font-medium text-gray-500">Total Risks</p>
        <p class="text-2xl font-semibold text-gray-900">${stats?.total || 0}</p>
      </div>
    </div>
  </div>
`;

// Risk Table matching ARIA5 design - Real Database Data
const renderRiskTable = (risks: any[]) => html`
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk ID</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Probability</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impact</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Review</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        ${risks.length === 0 ? `
          <tr>
            <td colspan="10" class="px-6 py-8 text-center text-gray-500">
              <i class="fas fa-exclamation-triangle text-gray-300 text-3xl mb-2"></i>
              <div>No risks found. <a href="#" hx-get="/risk/create" hx-target="#modal-container" hx-swap="innerHTML" class="text-blue-600 hover:text-blue-800">Create your first risk</a>.</div>
            </td>
          </tr>
        ` : risks.map(risk => {
          const riskScore = risk.risk_score || (risk.probability * risk.impact);
          const riskLevel = getRiskLevel(riskScore);
          const riskColor = getRiskColorClass(riskLevel);
          const statusColor = risk.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
          const createdDate = new Date(risk.created_at).toLocaleDateString();
          
          return `
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">RISK-${risk.id}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${risk.title}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${risk.category}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${risk.owner_name || 'Unassigned'}</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${risk.probability}/5</td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${risk.impact}/5</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${riskColor}">${riskScore}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor}">${risk.status}</span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${createdDate}</td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button class="text-indigo-600 hover:text-indigo-900 mr-3">
                  <i class="fas fa-eye"></i>
                </button>
                <button class="text-indigo-600 hover:text-indigo-900 mr-3">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="text-red-600 hover:text-red-900">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  </div>
`;

// Enhanced Risk Assessment Modal - Matching ARIA5 Exactly
const renderCreateRiskModal = () => html`
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" id="risk-modal">
    <div class="relative top-10 mx-auto p-0 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
      <!-- Modal Header -->
      <div class="flex justify-between items-center px-6 py-4 border-b bg-gray-50 rounded-t-md">
        <h3 class="text-lg font-semibold text-gray-900">Create Enhanced Risk Assessment</h3>
        <button onclick="document.getElementById('risk-modal').remove()" 
                class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>

      <!-- Risk Form -->
      <div class="max-h-96 overflow-y-auto">
        <form id="risk-form" 
              hx-post="/risk/create"
              hx-target="#form-result"
              hx-swap="innerHTML"
              class="p-6 space-y-6">
          
          <!-- 1. Risk Identification Section -->
          <div class="space-y-4">
            <div class="flex items-center mb-4">
              <div class="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">1</div>
              <h4 class="text-md font-medium text-gray-900">Risk Identification</h4>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 ml-9">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Risk ID *</label>
                <input type="text" 
                       name="risk_id" 
                       placeholder=""
                       required
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Risk Category (Optional)</label>
                <select name="category" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Category (Optional)</option>
                  <option value="cybersecurity">Cybersecurity</option>
                  <option value="operational">Operational</option>
                  <option value="financial">Financial</option>
                  <option value="compliance">Compliance</option>
                  <option value="strategic">Strategic</option>
                  <option value="reputational">Reputational</option>
                </select>
              </div>
            </div>
            
            <div class="ml-9">
              <label class="block text-sm font-medium text-gray-700 mb-1">Risk Title *</label>
              <input type="text" 
                     name="title" 
                     placeholder="e.g., Unauthorized access to customer database"
                     required
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div class="ml-9">
              <label class="block text-sm font-medium text-gray-700 mb-1">Risk Description *</label>
              <textarea name="description" 
                        rows="3" 
                        placeholder="Describe the risk scenario, potential causes, and business impact"
                        required
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            </div>
            
            <div class="ml-9">
              <label class="block text-sm font-medium text-gray-700 mb-1">Threat Source *</label>
              <select name="threat_source" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Threat Source</option>
                <option value="external-malicious">External - Malicious</option>
                <option value="external-accidental">External - Accidental</option>
                <option value="internal-malicious">Internal - Malicious</option>
                <option value="internal-accidental">Internal - Accidental</option>
                <option value="natural-disaster">Natural Disaster</option>
                <option value="system-failure">System Failure</option>
              </select>
            </div>
          </div>

          <!-- 2. Affected Services Section -->
          <div class="space-y-4 bg-green-50 p-4 rounded-lg">
            <div class="flex items-center mb-4">
              <div class="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">2</div>
              <h4 class="text-md font-medium text-gray-900">Affected Services</h4>
            </div>
            
            <div class="ml-9">
              <label class="block text-sm font-medium text-gray-700 mb-2">Related Services</label>
              <div class="space-y-2">
                <label class="flex items-center">
                  <input type="checkbox" name="affected_services[]" value="customer_portal" class="mr-2">
                  <span class="text-sm">Customer Portal (Standard)</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" name="affected_services[]" value="api_gateway" class="mr-2">
                  <span class="text-sm">API Gateway (Standard)</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" name="affected_services[]" value="payment_system" class="mr-2">
                  <span class="text-sm">Payment Processing System</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" name="affected_services[]" value="data_warehouse" class="mr-2">
                  <span class="text-sm">Data Warehouse</span>
                </label>
              </div>
            </div>
          </div>

          <!-- 3. Risk Assessment Section -->
          <div class="space-y-4 bg-red-50 p-4 rounded-lg">
            <div class="flex items-center mb-4">
              <div class="w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">3</div>
              <h4 class="text-md font-medium text-gray-900">Risk Assessment</h4>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 ml-9">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Likelihood *</label>
                <select name="likelihood" 
                        required 
                        hx-post="/risk/calculate-score"
                        hx-trigger="change"
                        hx-target="#risk-score-container"
                        hx-include="[name='impact']"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Likelihood</option>
                  <option value="1">1 - Very Low (0-5%)</option>
                  <option value="2">2 - Low (6-25%)</option>
                  <option value="3">3 - Medium (26-50%)</option>
                  <option value="4">4 - High (51-75%)</option>
                  <option value="5">5 - Very High (76-100%)</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Impact *</label>
                <select name="impact" 
                        required 
                        hx-post="/risk/calculate-score"
                        hx-trigger="change"
                        hx-target="#risk-score-container"
                        hx-include="[name='likelihood']"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Impact</option>
                  <option value="1">1 - Minimal</option>
                  <option value="2">2 - Minor</option>
                  <option value="3">3 - Moderate</option>
                  <option value="4">4 - Major</option>
                  <option value="5">5 - Severe</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Risk Score</label>
                <div id="risk-score-container">
                  <input type="text" 
                         name="risk_score" 
                         value="TBD"
                         readonly
                         class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
                </div>
              </div>
            </div>
            
            <div class="ml-9">
              <p class="text-sm text-gray-600">Select likelihood and impact to calculate risk score</p>
            </div>
          </div>

          <!-- 4. AI Risk Assessment Section -->
          <div class="space-y-4 bg-purple-50 p-4 rounded-lg">
            <div class="flex items-center mb-4">
              <div class="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">4</div>
              <h4 class="text-md font-medium text-gray-900">AI Risk Assessment</h4>
            </div>
            
            <div class="ml-9">
              <p class="text-sm text-gray-600 mb-4">Get AI-powered risk analysis based on your risk details and related services</p>
              <button type="button" 
                      hx-post="/risk/analyze-ai"
                      hx-target="#ai-analysis-result"
                      hx-swap="innerHTML"
                      hx-include="[name='title'], [name='description'], [name='category'], [name='affected_services[]']"
                      class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md flex items-center">
                <i class="fas fa-robot mr-2"></i>Analyze with AI
              </button>
              <div id="ai-analysis-result" class="mt-4"></div>
            </div>
          </div>

          <!-- 5. Risk Treatment & Controls Section -->
          <div class="space-y-4 bg-yellow-50 p-4 rounded-lg">
            <div class="flex items-center mb-4">
              <div class="w-6 h-6 bg-yellow-600 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">5</div>
              <h4 class="text-md font-medium text-gray-900">Risk Treatment & Controls</h4>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 ml-9">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Treatment Strategy *</label>
                <select name="treatment_strategy" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Strategy</option>
                  <option value="accept">Accept</option>
                  <option value="mitigate">Mitigate</option>
                  <option value="transfer">Transfer</option>
                  <option value="avoid">Avoid</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Risk Owner *</label>
                <select name="owner" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Owner</option>
                  <option value="avi_security">Avi Security</option>
                  <option value="admin_user">Admin User</option>
                  <option value="mike_chen">Mike Chen</option>
                  <option value="sarah_johnson">Sarah Johnson</option>
                  <option value="system_admin">System Admin</option>
                </select>
              </div>
            </div>
            
            <div class="ml-9">
              <label class="block text-sm font-medium text-gray-700 mb-1">Mitigation Actions</label>
              <textarea name="mitigation_actions" 
                        rows="3" 
                        placeholder="Describe planned or implemented risk mitigation actions"
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
            </div>
          </div>

          <!-- Form Result Area -->
          <div id="form-result"></div>

          <!-- Form Actions -->
          <div class="flex justify-end space-x-3 pt-6 border-t">
            <button type="button" 
                    onclick="document.getElementById('risk-modal').remove()"
                    class="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md">
              Cancel
            </button>
            <button type="submit" 
                    class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
              Create Risk
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
`;