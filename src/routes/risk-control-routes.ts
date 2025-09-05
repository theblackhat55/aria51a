import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import { AIRiskControlMapper } from '../lib/risk-control-ai-mapper';
import type { CloudflareBindings } from '../types';

export function createRiskControlRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Authentication middleware
  app.use('*', requireAuth);
  
  /**
   * Risk-Control Mapping Dashboard
   */
  app.get('/', async (c) => {
    const user = c.get('user');
    
    try {
      // Get risk-control mapping statistics
      const stats = await c.env.DB.prepare(`
        SELECT 
          COUNT(DISTINCT r.id) as total_risks,
          COUNT(DISTINCT rcm.id) as mapped_controls,
          COUNT(DISTINCT CASE WHEN rcm.id IS NULL THEN r.id END) as unmapped_risks,
          AVG(rcm.effectiveness_rating) as avg_effectiveness,
          AVG(rcm.mapping_confidence) as avg_confidence
        FROM risks r
        LEFT JOIN risk_control_mappings rcm ON r.id = rcm.risk_id
        WHERE r.status = 'active'
      `).first();

      // Get detailed risk-control mappings
      const mappings = await c.env.DB.prepare(`
        SELECT 
          r.id as risk_id,
          r.title as risk_title,
          r.category as risk_category,
          (r.probability * r.impact) as risk_score,
          COUNT(rcm.id) as control_count,
          AVG(rcm.effectiveness_rating) as avg_effectiveness,
          AVG(rcm.mapping_confidence) as avg_confidence,
          GROUP_CONCAT(cf.name, ', ') as frameworks
        FROM risks r
        LEFT JOIN risk_control_mappings rcm ON r.id = rcm.risk_id
        LEFT JOIN compliance_frameworks cf ON rcm.framework_id = cf.id
        WHERE r.status = 'active'
        GROUP BY r.id, r.title, r.category, r.probability, r.impact
        ORDER BY risk_score DESC
      `).all();

      return c.html(
        cleanLayout({
          title: 'Risk-Control Mapping',
          user,
          content: renderRiskControlDashboard(stats, mappings.results)
        })
      );
    } catch (error) {
      console.error('Error fetching risk-control data:', error);
      return c.text('Error loading risk-control mapping dashboard', 500);
    }
  });

  /**
   * Trigger AI Auto-Mapping for All Risks
   */
  app.post('/ai-map', async (c) => {
    try {
      const mapper = new AIRiskControlMapper(c.env.DB);
      const mappedCount = await mapper.mapAllUnmappedRisks();
      
      return c.json({
        success: true,
        message: `Successfully auto-mapped ${mappedCount} risks to controls using AI`,
        mapped_count: mappedCount
      });
    } catch (error) {
      console.error('Error in AI mapping:', error);
      return c.json({
        success: false,
        message: 'Failed to perform AI mapping',
        error: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * Manual Risk-Control Mapping
   */
  app.post('/map/:riskId', async (c) => {
    const riskId = parseInt(c.req.param('riskId'));
    
    try {
      const formData = await c.req.formData();
      const controlId = formData.get('control_id') as string;
      const frameworkId = parseInt(formData.get('framework_id') as string);
      const controlType = formData.get('control_type') as string;
      const effectivenessRating = parseInt(formData.get('effectiveness_rating') as string);

      await c.env.DB.prepare(`
        INSERT OR REPLACE INTO risk_control_mappings 
        (risk_id, control_id, framework_id, control_type, effectiveness_rating, mapping_confidence, ai_rationale, manual_override, created_at)
        VALUES (?, ?, ?, ?, ?, 1.0, 'Manually mapped by user', TRUE, CURRENT_TIMESTAMP)
      `).bind(riskId, controlId, frameworkId, controlType, effectivenessRating).run();

      return c.json({ success: true, message: 'Risk-control mapping added successfully' });
    } catch (error) {
      console.error('Error adding manual mapping:', error);
      return c.json({ success: false, message: 'Failed to add mapping' }, 500);
    }
  });

  /**
   * Get Risk Details with Control Mappings
   */
  app.get('/risk/:riskId', async (c) => {
    const riskId = parseInt(c.req.param('riskId'));
    const user = c.get('user');
    
    try {
      // Get risk details
      const risk = await c.env.DB.prepare(`
        SELECT * FROM risks WHERE id = ?
      `).bind(riskId).first();

      if (!risk) {
        return c.text('Risk not found', 404);
      }

      // Get control mappings
      const mapper = new AIRiskControlMapper(c.env.DB);
      const mappings = await mapper.getRiskControlMappings(riskId);

      // Get available controls and frameworks for manual mapping
      const frameworks = await c.env.DB.prepare(`
        SELECT * FROM compliance_frameworks WHERE is_active = 1
      `).all();

      return c.html(
        cleanLayout({
          title: `Risk Controls - ${(risk as any).title}`,
          user,
          content: renderRiskControlDetail(risk, mappings, frameworks.results)
        })
      );
    } catch (error) {
      console.error('Error fetching risk control details:', error);
      return c.text('Error loading risk control details', 500);
    }
  });

  /**
   * Remove Risk-Control Mapping
   */
  app.delete('/mapping/:mappingId', async (c) => {
    const mappingId = parseInt(c.req.param('mappingId'));
    
    try {
      await c.env.DB.prepare(`
        DELETE FROM risk_control_mappings WHERE id = ?
      `).bind(mappingId).run();

      return c.json({ success: true, message: 'Mapping removed successfully' });
    } catch (error) {
      console.error('Error removing mapping:', error);
      return c.json({ success: false, message: 'Failed to remove mapping' }, 500);
    }
  });

  return app;
}

/**
 * Render Risk-Control Mapping Dashboard
 */
const renderRiskControlDashboard = (stats: any, mappings: any[]) => html`
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Risk-Control Mapping</h1>
            <p class="text-gray-600 mt-1">AI-powered risk to control framework linkage</p>
          </div>
          <div class="flex space-x-3">
            <button onclick="triggerAIMapping()" 
                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center">
              <i class="fas fa-robot mr-2"></i>
              AI Auto-Map All Risks
            </button>
            <a href="/risk" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              <i class="fas fa-arrow-left mr-2"></i>
              Back to Risks
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Risks</p>
              <p class="text-3xl font-bold text-blue-600">${stats?.total_risks || 0}</p>
            </div>
            <i class="fas fa-exclamation-triangle text-blue-500 text-2xl"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Mapped Controls</p>
              <p class="text-3xl font-bold text-green-600">${stats?.mapped_controls || 0}</p>
            </div>
            <i class="fas fa-link text-green-500 text-2xl"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Unmapped Risks</p>
              <p class="text-3xl font-bold text-red-600">${stats?.unmapped_risks || 0}</p>
            </div>
            <i class="fas fa-unlink text-red-500 text-2xl"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Avg Effectiveness</p>
              <p class="text-3xl font-bold text-purple-600">${stats?.avg_effectiveness ? Math.round(stats.avg_effectiveness * 10) / 10 : 0}/5</p>
            </div>
            <i class="fas fa-chart-line text-purple-500 text-2xl"></i>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">AI Confidence</p>
              <p class="text-3xl font-bold text-orange-600">${stats?.avg_confidence ? Math.round(stats.avg_confidence * 100) : 0}%</p>
            </div>
            <i class="fas fa-brain text-orange-500 text-2xl"></i>
          </div>
        </div>
      </div>

      <!-- Risk-Control Mappings Table -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">Risk-Control Linkages</h2>
        </div>
        
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Risk Score</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Controls</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effectiveness</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frameworks</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${mappings.map(mapping => html`
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${mapping.risk_title}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      ${mapping.risk_category || 'General'}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <span class="text-sm font-medium ${
                        mapping.risk_score >= 20 ? 'text-red-600' :
                        mapping.risk_score >= 12 ? 'text-orange-600' :
                        mapping.risk_score >= 6 ? 'text-yellow-600' : 'text-green-600'
                      }">${mapping.risk_score}</span>
                      <div class="ml-2 w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div class="h-full ${
                          mapping.risk_score >= 20 ? 'bg-red-500' :
                          mapping.risk_score >= 12 ? 'bg-orange-500' :
                          mapping.risk_score >= 6 ? 'bg-yellow-500' : 'bg-green-500'
                        }" style="width: ${Math.min(mapping.risk_score * 4, 100)}%"></div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        mapping.control_count > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }">
                        ${mapping.control_count || 0} controls
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      ${mapping.avg_effectiveness ? html`
                        <div class="flex">
                          ${Array.from({length: 5}, (_, i) => html`
                            <i class="fas fa-star text-sm ${i < Math.round(mapping.avg_effectiveness) ? 'text-yellow-400' : 'text-gray-300'}"></i>
                          `)}
                        </div>
                        <span class="ml-2 text-sm text-gray-600">${Math.round(mapping.avg_effectiveness * 10) / 10}</span>
                      ` : html`
                        <span class="text-sm text-gray-400">Not mapped</span>
                      `}
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${mapping.frameworks || 'None'}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <a href="/risk-controls/risk/${mapping.risk_id}" class="text-blue-600 hover:text-blue-900 mr-3">
                      <i class="fas fa-eye mr-1"></i>View
                    </a>
                    ${mapping.control_count === 0 ? html`
                      <button onclick="mapRiskAI(${mapping.risk_id})" class="text-green-600 hover:text-green-900">
                        <i class="fas fa-robot mr-1"></i>AI Map
                      </button>
                    ` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <script>
    async function triggerAIMapping() {
      const button = event.target;
      button.disabled = true;
      button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>AI Mapping...';
      
      try {
        const response = await fetch('/risk-controls/ai-map', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        if (result.success) {
          alert('✅ ' + result.message);
          location.reload();
        } else {
          alert('❌ ' + result.message);
        }
      } catch (error) {
        alert('❌ Error performing AI mapping');
      } finally {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-robot mr-2"></i>AI Auto-Map All Risks';
      }
    }

    async function mapRiskAI(riskId) {
      try {
        const response = await fetch('/risk-controls/ai-map', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ risk_id: riskId })
        });
        
        const result = await response.json();
        if (result.success) {
          alert('✅ Risk mapped successfully');
          location.reload();
        } else {
          alert('❌ Failed to map risk');
        }
      } catch (error) {
        alert('❌ Error mapping risk');
      }
    }
  </script>
`;

/**
 * Render Risk Control Detail Page
 */
const renderRiskControlDetail = (risk: any, mappings: any[], frameworks: any[]) => html`
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
    <!-- Header -->
    <div class="bg-white shadow-sm border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">${risk.title}</h1>
            <p class="text-gray-600 mt-1">Risk-Control Mapping Details</p>
          </div>
          <a href="/risk-controls" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            <i class="fas fa-arrow-left mr-2"></i>
            Back to Mappings
          </a>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Risk Information -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Risk Information</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700">Risk Score</label>
            <p class="mt-1 text-2xl font-bold text-red-600">${(risk.probability || 0) * (risk.impact || 0)}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Category</label>
            <p class="mt-1 text-sm text-gray-900">${risk.category || 'Not specified'}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Status</label>
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              risk.status === 'active' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
            }">
              ${risk.status}
            </span>
          </div>
          <div class="md:col-span-3">
            <label class="block text-sm font-medium text-gray-700">Description</label>
            <p class="mt-1 text-sm text-gray-900">${risk.description || 'No description provided'}</p>
          </div>
        </div>
      </div>

      <!-- Control Mappings -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900">Linked Controls</h2>
            <button onclick="showAddMappingModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
              <i class="fas fa-plus mr-2"></i>Add Manual Mapping
            </button>
          </div>
        </div>

        ${mappings.length > 0 ? html`
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Control</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Framework</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Effectiveness</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Confidence</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${mappings.map(mapping => html`
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4">
                      <div class="text-sm font-medium text-gray-900">${mapping.control_id}</div>
                      <div class="text-sm text-gray-500">${mapping.control_title || 'No title'}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        ${mapping.framework_name}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        mapping.control_type === 'preventive' ? 'bg-green-100 text-green-800' :
                        mapping.control_type === 'detective' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }">
                        ${mapping.control_type}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        ${Array.from({length: 5}, (_, i) => html`
                          <i class="fas fa-star text-sm ${i < mapping.effectiveness_rating ? 'text-yellow-400' : 'text-gray-300'}"></i>
                        `)}
                        <span class="ml-2 text-sm text-gray-600">${mapping.effectiveness_rating}/5</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="w-16 bg-gray-200 rounded-full h-2">
                          <div class="bg-blue-600 h-2 rounded-full" style="width: ${mapping.mapping_confidence * 100}%"></div>
                        </div>
                        <span class="ml-2 text-sm text-gray-600">${Math.round(mapping.mapping_confidence * 100)}%</span>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button onclick="removeMapping(${mapping.id})" class="text-red-600 hover:text-red-900">
                        <i class="fas fa-trash mr-1"></i>Remove
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : html`
          <div class="px-6 py-8 text-center">
            <i class="fas fa-unlink text-gray-400 text-4xl mb-4"></i>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No Controls Mapped</h3>
            <p class="text-gray-500 mb-4">This risk is not yet linked to any compliance controls.</p>
            <button onclick="triggerAIMapping()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              <i class="fas fa-robot mr-2"></i>Use AI to Auto-Map Controls
            </button>
          </div>
        `}
      </div>
    </div>
  </div>

  <script>
    function showAddMappingModal() {
      alert('Manual mapping modal would open here');
      // Implementation for manual mapping modal
    }

    async function removeMapping(mappingId) {
      if (!confirm('Are you sure you want to remove this mapping?')) return;
      
      try {
        const response = await fetch('/risk-controls/mapping/' + mappingId, {
          method: 'DELETE'
        });
        
        const result = await response.json();
        if (result.success) {
          location.reload();
        } else {
          alert('Failed to remove mapping');
        }
      } catch (error) {
        alert('Error removing mapping');
      }
    }

    async function triggerAIMapping() {
      try {
        const response = await fetch('/risk-controls/ai-map', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        
        const result = await response.json();
        if (result.success) {
          alert('✅ AI mapping completed successfully!');
          location.reload();
        } else {
          alert('❌ AI mapping failed: ' + result.message);
        }
      } catch (error) {
        alert('❌ Error performing AI mapping');
      }
    }
  </script>
`;