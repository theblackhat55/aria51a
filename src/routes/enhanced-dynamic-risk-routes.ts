/**
 * Enhanced Dynamic Risk Assessment Routes
 * 
 * Integrates sophisticated dynamic risk scoring with MS Defender data
 * Replaces simple Impact × Probability with multi-factor analysis
 */

import { Hono } from 'hono';
import { html, raw } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import { EnhancedDynamicRiskEngine, type DynamicRiskScore, type RiskLevel } from '../services/enhanced-dynamic-risk-engine';
import type { CloudflareBindings } from '../types';

export function createEnhancedDynamicRiskRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware to all routes
  app.use('*', requireAuth);

  /**
   * Enhanced Risk Assessment Dashboard
   */
  app.get('/', async (c) => {
    const user = c.get('user');
    
    // Get risk statistics with dynamic scores
    const riskStats = await getDynamicRiskStatistics(c.env.DB);
    const recentCalculations = await getRecentCalculations(c.env.DB);
    
    return c.html(
      cleanLayout({
        title: 'Enhanced Dynamic Risk Assessment',
        user,
        content: renderEnhancedRiskDashboard(riskStats, recentCalculations)
      })
    );
  });

  /**
   * Enhanced Risk Creation/Edit Modal with Dynamic Scoring
   */
  app.get('/risk/:id/enhanced', async (c) => {
    const riskId = parseInt(c.req.param('id'));
    
    // Get risk data
    const risk = await getRiskWithDynamicScore(c.env.DB, riskId);
    if (!risk) {
      return c.html('<div class="p-4 text-red-600">Risk not found</div>');
    }
    
    // Get dynamic score calculation
    const engine = new EnhancedDynamicRiskEngine(c.env.DB);
    const dynamicScore = await engine.calculateDynamicRisk(riskId);
    
    return c.html(renderEnhancedRiskModal(risk, dynamicScore));
  });

  /**
   * Create New Enhanced Risk Assessment
   */
  app.get('/new-enhanced', async (c) => {
    const user = c.get('user');
    
    // Get available assets and services for risk mapping
    const assets = await getAvailableAssets(c.env.DB);
    const services = await getAvailableServices(c.env.DB);
    
    return c.html(
      cleanLayout({
        title: 'Create Enhanced Risk Assessment',
        user,
        content: renderNewEnhancedRiskForm(assets, services)
      })
    );
  });

  // ========== API ENDPOINTS ==========

  /**
   * Calculate Dynamic Risk Score
   */
  app.post('/api/calculate/:riskId', async (c) => {
    try {
      const riskId = parseInt(c.req.param('riskId'));
      const engine = new EnhancedDynamicRiskEngine(c.env.DB);
      
      const dynamicScore = await engine.calculateDynamicRisk(riskId);
      
      return c.json({
        success: true,
        data: dynamicScore
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }
  });

  /**
   * Batch Calculate All Active Risks
   */
  app.post('/api/calculate-all', async (c) => {
    try {
      const engine = new EnhancedDynamicRiskEngine(c.env.DB);
      await engine.calculateAllActiveRisks();
      
      return c.json({
        success: true,
        message: 'All active risks recalculated successfully'
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }
  });

  /**
   * Create Enhanced Risk with Asset/Service Mappings
   */
  app.post('/api/create-enhanced', async (c) => {
    try {
      const data = await c.req.json();
      const user = c.get('user');
      
      // Create base risk
      const riskId = await createEnhancedRisk(c.env.DB, data, user.id);
      
      // Create asset mappings
      if (data.assets && data.assets.length > 0) {
        await createRiskAssetMappings(c.env.DB, riskId, data.assets);
      }
      
      // Create service mappings
      if (data.services && data.services.length > 0) {
        await createRiskServiceMappings(c.env.DB, riskId, data.services);
      }
      
      // Calculate initial dynamic score
      const engine = new EnhancedDynamicRiskEngine(c.env.DB);
      const dynamicScore = await engine.calculateDynamicRisk(riskId);
      
      return c.json({
        success: true,
        data: {
          riskId,
          dynamicScore
        }
      });
    } catch (error) {
      console.error('Error creating enhanced risk:', error);
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }
  });

  /**
   * Update Risk Factor Weights
   */
  app.post('/api/update-weights', async (c) => {
    try {
      const { weights } = await c.req.json();
      
      await c.env.DB.prepare(`
        UPDATE risk_scoring_config 
        SET weights = ?, updated_at = datetime('now')
        WHERE active_status = TRUE
      `).bind(JSON.stringify(weights)).run();
      
      return c.json({ success: true });
    } catch (error) {
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }
  });

  /**
   * Get Risk Calculation History
   */
  app.get('/api/history/:riskId', async (c) => {
    try {
      const riskId = parseInt(c.req.param('riskId'));
      
      const history = await c.env.DB.prepare(`
        SELECT 
          calculation_date,
          new_score,
          previous_score,
          score_change,
          change_reason,
          triggered_by
        FROM risk_calculation_history
        WHERE risk_id = ?
        ORDER BY calculation_date DESC
        LIMIT 50
      `).bind(riskId).all();
      
      return c.json({
        success: true,
        data: history.results || []
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }
  });

  /**
   * Get Available Assets for Risk Mapping
   */
  app.get('/api/assets/available', async (c) => {
    try {
      const assets = await c.env.DB.prepare(`
        SELECT 
          a.id, a.name, a.type, a.criticality,
          COUNT(DISTINCT ai.incident_id) as incident_count,
          COUNT(DISTINCT av.vulnerability_id) as vulnerability_count
        FROM assets a
        LEFT JOIN asset_incidents ai ON a.id = ai.asset_id
        LEFT JOIN asset_vulnerabilities av ON a.id = av.asset_id
        GROUP BY a.id, a.name, a.type, a.criticality
        ORDER BY a.name
      `).all();
      
      return c.json({
        success: true,
        data: assets.results || []
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }
  });

  /**
   * Get Available Services for Risk Mapping
   */
  app.get('/api/services/available', async (c) => {
    try {
      const services = await c.env.DB.prepare(`
        SELECT 
          id, name, service_category, business_department,
          criticality_score, availability_numeric
        FROM services
        WHERE service_status = 'Active'
        ORDER BY criticality_score DESC, name
      `).all();
      
      return c.json({
        success: true,
        data: services.results || []
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error.message
      }, 500);
    }
  });

  return app;
}

// ========== HELPER FUNCTIONS ==========

async function getDynamicRiskStatistics(db: D1Database) {
  const stats = await db.prepare(`
    SELECT 
      COUNT(*) as total_risks,
      COUNT(CASE WHEN dynamic_level = 'CRITICAL' THEN 1 END) as critical_risks,
      COUNT(CASE WHEN dynamic_level = 'HIGH' THEN 1 END) as high_risks,
      COUNT(CASE WHEN dynamic_level = 'MEDIUM' THEN 1 END) as medium_risks,
      COUNT(CASE WHEN dynamic_level = 'LOW' THEN 1 END) as low_risks,
      AVG(dynamic_score) as avg_dynamic_score,
      AVG(confidence_score) as avg_confidence,
      COUNT(CASE WHEN dynamic_trend = 'INCREASING' THEN 1 END) as increasing_risks,
      COUNT(CASE WHEN dynamic_trend = 'DECREASING' THEN 1 END) as decreasing_risks
    FROM risks
    WHERE status = 'active' AND dynamic_score IS NOT NULL
  `).first();
  
  return stats || {};
}

async function getRecentCalculations(db: D1Database) {
  const recent = await db.prepare(`
    SELECT 
      rch.risk_id,
      r.title,
      rch.new_score,
      rch.score_change,
      rch.calculation_date,
      rch.triggered_by
    FROM risk_calculation_history rch
    JOIN risks r ON rch.risk_id = r.id
    ORDER BY rch.calculation_date DESC
    LIMIT 10
  `).all();
  
  return recent.results || [];
}

async function getRiskWithDynamicScore(db: D1Database, riskId: number) {
  return await db.prepare(`
    SELECT 
      *,
      dynamic_score,
      dynamic_level,
      dynamic_trend,
      confidence_score
    FROM risks
    WHERE id = ?
  `).bind(riskId).first();
}

async function getAvailableAssets(db: D1Database) {
  const assets = await db.prepare(`
    SELECT 
      a.id, a.name, a.type, a.criticality,
      COUNT(DISTINCT ai.incident_id) as incident_count,
      COUNT(DISTINCT av.vulnerability_id) as vulnerability_count
    FROM assets a
    LEFT JOIN asset_incidents ai ON a.id = ai.asset_id
    LEFT JOIN asset_vulnerabilities av ON a.id = av.asset_id
    GROUP BY a.id
    ORDER BY a.name
  `).all();
  
  return assets.results || [];
}

async function getAvailableServices(db: D1Database) {
  const services = await db.prepare(`
    SELECT id, name, service_category, criticality_score
    FROM services
    WHERE service_status = 'Active'
    ORDER BY criticality_score DESC, name
  `).all();
  
  return services.results || [];
}

async function createEnhancedRisk(db: D1Database, data: any, userId: number): Promise<number> {
  const result = await db.prepare(`
    INSERT INTO risks (
      title, description, category, subcategory,
      probability, impact, inherent_risk,
      status, owner_id, created_by, 
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, datetime('now'), datetime('now'))
  `).bind(
    data.title,
    data.description,
    data.category,
    data.subcategory || '',
    data.probability,
    data.impact,
    data.probability * data.impact,
    data.owner_id || userId,
    userId
  ).run();
  
  return result.meta?.last_row_id as number;
}

async function createRiskAssetMappings(db: D1Database, riskId: number, assets: any[]) {
  for (const asset of assets) {
    await db.prepare(`
      INSERT INTO risk_asset_mappings (
        risk_id, asset_id, impact_weight, exposure_level, 
        mitigation_coverage, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      riskId,
      asset.id,
      asset.impact_weight || 1.0,
      asset.exposure_level || 'medium',
      asset.mitigation_coverage || 0.0
    ).run();
  }
}

async function createRiskServiceMappings(db: D1Database, riskId: number, services: any[]) {
  for (const service of services) {
    await db.prepare(`
      INSERT INTO risk_service_mappings (
        risk_id, service_id, business_impact_level, dependency_criticality,
        availability_requirement, financial_impact_hourly, user_impact_count,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      riskId,
      service.id,
      service.business_impact_level || 'medium',
      service.dependency_criticality || 1.0,
      service.availability_requirement || 0.99,
      service.financial_impact_hourly || 0.0,
      service.user_impact_count || 0
    ).run();
  }
}

// ========== UI RENDERING FUNCTIONS ==========

function renderEnhancedRiskDashboard(stats: any, recentCalculations: any[]) {
  return html`
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold text-gray-900 flex items-center">
                <i class="fas fa-brain text-purple-600 mr-3"></i>
                Enhanced Dynamic Risk Assessment
              </h1>
              <p class="mt-2 text-lg text-gray-600">
                AI-powered multi-factor risk scoring with real-time MS Defender integration
              </p>
            </div>
            <div class="flex space-x-3">
              <button onclick="calculateAllRisks()" 
                      class="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                <i class="fas fa-calculator mr-2"></i>
                Recalculate All
              </button>
              <button onclick="location.href='/risk/enhanced/new-enhanced'" 
                      class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                <i class="fas fa-plus mr-2"></i>
                New Enhanced Risk
              </button>
            </div>
          </div>
        </div>

        <!-- Statistics Cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <!-- Total Dynamic Risks -->
          <div class="bg-white shadow rounded-lg p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Total Dynamic Risks</p>
                <p class="text-3xl font-bold text-gray-900">${stats.total_risks || 0}</p>
              </div>
              <div class="p-3 bg-purple-100 rounded-full">
                <i class="fas fa-shield-alt text-purple-600 text-xl"></i>
              </div>
            </div>
          </div>

          <!-- Critical Risks -->
          <div class="bg-white shadow rounded-lg p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Critical Risks</p>
                <p class="text-3xl font-bold text-red-600">${stats.critical_risks || 0}</p>
              </div>
              <div class="p-3 bg-red-100 rounded-full">
                <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
              </div>
            </div>
          </div>

          <!-- Average Score -->
          <div class="bg-white shadow rounded-lg p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Average Dynamic Score</p>
                <p class="text-3xl font-bold text-blue-600">${Math.round(stats.avg_dynamic_score || 0)}</p>
              </div>
              <div class="p-3 bg-blue-100 rounded-full">
                <i class="fas fa-chart-line text-blue-600 text-xl"></i>
              </div>
            </div>
          </div>

          <!-- Confidence -->
          <div class="bg-white shadow rounded-lg p-6">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-medium text-gray-600">Avg Confidence</p>
                <p class="text-3xl font-bold text-green-600">${Math.round((stats.avg_confidence || 0) * 100)}%</p>
              </div>
              <div class="p-3 bg-green-100 rounded-full">
                <i class="fas fa-check-circle text-green-600 text-xl"></i>
              </div>
            </div>
          </div>
        </div>

        <!-- Risk Level Distribution -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <!-- Risk Level Chart -->
          <div class="bg-white shadow rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i class="fas fa-chart-pie text-purple-600 mr-2"></i>
              Dynamic Risk Level Distribution
            </h3>
            <div class="space-y-4">
              ${renderRiskLevelBar('Critical', stats.critical_risks || 0, stats.total_risks || 1, 'bg-red-500')}
              ${renderRiskLevelBar('High', stats.high_risks || 0, stats.total_risks || 1, 'bg-orange-500')}
              ${renderRiskLevelBar('Medium', stats.medium_risks || 0, stats.total_risks || 1, 'bg-yellow-500')}
              ${renderRiskLevelBar('Low', stats.low_risks || 0, stats.total_risks || 1, 'bg-green-500')}
            </div>
          </div>

          <!-- Risk Trends -->
          <div class="bg-white shadow rounded-lg p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <i class="fas fa-trending-up text-blue-600 mr-2"></i>
              Risk Trends
            </h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <i class="fas fa-arrow-up text-red-500 mr-2"></i>
                  <span class="text-sm font-medium">Increasing Risks</span>
                </div>
                <span class="text-lg font-bold text-red-600">${stats.increasing_risks || 0}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <i class="fas fa-arrow-down text-green-500 mr-2"></i>
                  <span class="text-sm font-medium">Decreasing Risks</span>
                </div>
                <span class="text-lg font-bold text-green-600">${stats.decreasing_risks || 0}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <i class="fas fa-minus text-gray-500 mr-2"></i>
                  <span class="text-sm font-medium">Stable Risks</span>
                </div>
                <span class="text-lg font-bold text-gray-600">${(stats.total_risks || 0) - (stats.increasing_risks || 0) - (stats.decreasing_risks || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Calculations -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-semibold text-gray-900 flex items-center">
              <i class="fas fa-history text-blue-600 mr-2"></i>
              Recent Dynamic Risk Calculations
            </h3>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">New Score</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Triggered By</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${recentCalculations.map(calc => `
                  <tr>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">${calc.title}</div>
                      <div class="text-sm text-gray-500">ID: ${calc.risk_id}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="text-lg font-bold text-blue-600">${Math.round(calc.new_score)}</span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        calc.score_change > 0 ? 'bg-red-100 text-red-800' : 
                        calc.score_change < 0 ? 'bg-green-100 text-green-800' : 
                        'bg-gray-100 text-gray-800'
                      }">
                        ${calc.score_change > 0 ? '+' : ''}${Math.round(calc.score_change * 10) / 10}
                      </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${calc.triggered_by}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${new Date(calc.calculation_date).toLocaleString()}
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
      async function calculateAllRisks() {
        try {
          const response = await fetch('/risk/enhanced/api/calculate-all', {
            method: 'POST'
          });
          const result = await response.json();
          
          if (result.success) {
            location.reload(); // Refresh to show updated scores
          } else {
            alert('Failed to recalculate risks: ' + result.error);
          }
        } catch (error) {
          alert('Error: ' + error.message);
        }
      }
    </script>
  `;
}

function renderRiskLevelBar(level: string, count: number, total: number, colorClass: string) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return html`
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-3">
        <span class="text-sm font-medium text-gray-700 w-16">${level}</span>
        <div class="flex-1 bg-gray-200 rounded-full h-2 w-32">
          <div class="${colorClass} h-2 rounded-full" style="width: ${percentage}%"></div>
        </div>
      </div>
      <span class="text-sm font-medium text-gray-900">${count} (${Math.round(percentage)}%)</span>
    </div>
  `;
}

function renderEnhancedRiskModal(risk: any, dynamicScore: DynamicRiskScore) {
  return html`
    <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div class="relative top-20 mx-auto p-5 border w-11/12 max-w-6xl shadow-lg rounded-md bg-white">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-medium text-gray-900 flex items-center">
            <i class="fas fa-brain text-purple-500 mr-2"></i>
            Enhanced Risk Analysis: ${risk.title}
          </h3>
          <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <!-- Dynamic Score Overview -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-4 rounded-lg">
            <div class="text-center">
              <div class="text-3xl font-bold">${Math.round(dynamicScore.score)}</div>
              <div class="text-sm">Dynamic Score</div>
            </div>
          </div>
          <div class="bg-white border-2 border-gray-200 p-4 rounded-lg">
            <div class="text-center">
              <div class="text-2xl font-bold text-${getRiskLevelColor(dynamicScore.level)}">${dynamicScore.level}</div>
              <div class="text-sm text-gray-600">Risk Level</div>
            </div>
          </div>
          <div class="bg-white border-2 border-gray-200 p-4 rounded-lg">
            <div class="text-center">
              <div class="text-2xl font-bold text-${getTrendColor(dynamicScore.trend)}">${dynamicScore.trend}</div>
              <div class="text-sm text-gray-600">Trend</div>
            </div>
          </div>
          <div class="bg-white border-2 border-gray-200 p-4 rounded-lg">
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">${Math.round(dynamicScore.confidence * 100)}%</div>
              <div class="text-sm text-gray-600">Confidence</div>
            </div>
          </div>
        </div>

        <!-- Component Breakdown -->
        <div class="bg-gray-50 p-6 rounded-lg mb-6">
          <h4 class="text-lg font-semibold text-gray-900 mb-4">Risk Component Breakdown</h4>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            ${Object.entries(dynamicScore.components).map(([key, value]) => `
              <div class="text-center">
                <div class="text-xl font-bold text-blue-600">${Math.round(value as number)}</div>
                <div class="text-xs text-gray-600">${formatComponentName(key)}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Traditional vs Dynamic Comparison -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div class="bg-white border p-4 rounded-lg">
            <h5 class="font-semibold text-gray-900 mb-3">Traditional Scoring</h5>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span>Probability:</span>
                <span class="font-medium">${risk.probability || 'N/A'}</span>
              </div>
              <div class="flex justify-between">
                <span>Impact:</span>
                <span class="font-medium">${risk.impact || 'N/A'}</span>
              </div>
              <div class="flex justify-between border-t pt-2">
                <span>Simple Score:</span>
                <span class="font-bold">${(risk.probability || 0) * (risk.impact || 0)}</span>
              </div>
            </div>
          </div>
          
          <div class="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 p-4 rounded-lg">
            <h5 class="font-semibold text-gray-900 mb-3 flex items-center">
              <i class="fas fa-brain text-purple-500 mr-2"></i>
              Enhanced Dynamic Scoring
            </h5>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span>Asset Integration:</span>
                <span class="font-medium">${dynamicScore.metadata.assetsCount || 0} assets</span>
              </div>
              <div class="flex justify-between">
                <span>Service Integration:</span>
                <span class="font-medium">${dynamicScore.metadata.servicesCount || 0} services</span>
              </div>
              <div class="flex justify-between">
                <span>Threat Sources:</span>
                <span class="font-medium">${dynamicScore.metadata.threatSources || 0} sources</span>
              </div>
              <div class="flex justify-between border-t pt-2">
                <span>Dynamic Score:</span>
                <span class="font-bold text-purple-600">${Math.round(dynamicScore.score)}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end space-x-3">
          <button onclick="viewCalculationHistory(${risk.id})" 
                  class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            <i class="fas fa-history mr-2"></i>
            View History
          </button>
          <button onclick="recalculateRisk(${risk.id})" 
                  class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
            <i class="fas fa-calculator mr-2"></i>
            Recalculate
          </button>
          <button onclick="closeModal()" 
                  class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
            Close
          </button>
        </div>
      </div>
    </div>
  `;
}

function renderNewEnhancedRiskForm(assets: any[], services: any[]) {
  return html`
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white shadow rounded-lg p-6">
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900 flex items-center">
              <i class="fas fa-brain text-purple-600 mr-3"></i>
              Create Enhanced Risk Assessment
            </h1>
            <p class="mt-2 text-gray-600">Create a new risk with dynamic scoring capabilities</p>
          </div>

          <form id="enhancedRiskForm" onsubmit="submitEnhancedRisk(event)">
            <!-- Basic Risk Information -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Risk Title</label>
                <input type="text" name="title" required 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select name="category" required 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <option value="">Select Category</option>
                  <option value="Operational">Operational</option>
                  <option value="Financial">Financial</option>
                  <option value="Strategic">Strategic</option>
                  <option value="Compliance">Compliance</option>
                  <option value="Technology">Technology</option>
                </select>
              </div>
            </div>

            <div class="mb-6">
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea name="description" rows="3" 
                        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"></textarea>
            </div>

            <!-- Traditional Risk Factors -->
            <div class="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Traditional Risk Factors</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Probability (1-5)</label>
                  <select name="probability" required 
                          class="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="1">1 - Very Low</option>
                    <option value="2">2 - Low</option>
                    <option value="3" selected>3 - Medium</option>
                    <option value="4">4 - High</option>
                    <option value="5">5 - Very High</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Impact (1-5)</label>
                  <select name="impact" required 
                          class="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="1">1 - Very Low</option>
                    <option value="2">2 - Low</option>
                    <option value="3" selected>3 - Medium</option>
                    <option value="4">4 - High</option>
                    <option value="5">5 - Very High</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Asset Mappings -->
            <div class="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <i class="fas fa-server text-blue-600 mr-2"></i>
                Affected Assets (Dynamic Scoring)
              </h3>
              <div id="assetMappings">
                ${assets.map(asset => `
                  <div class="flex items-center justify-between p-3 bg-white rounded border mb-2">
                    <div class="flex items-center">
                      <input type="checkbox" name="assets" value="${asset.id}" 
                             class="mr-3" onchange="toggleAssetDetails(this)">
                      <div>
                        <div class="font-medium">${asset.name}</div>
                        <div class="text-sm text-gray-600">
                          ${asset.type} • ${asset.criticality} • 
                          ${asset.incident_count} incidents, ${asset.vulnerability_count} vulns
                        </div>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Service Mappings -->
            <div class="bg-green-50 p-4 rounded-lg mb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <i class="fas fa-sitemap text-green-600 mr-2"></i>
                Affected Services (Dynamic Scoring)
              </h3>
              <div id="serviceMappings">
                ${services.map(service => `
                  <div class="flex items-center justify-between p-3 bg-white rounded border mb-2">
                    <div class="flex items-center">
                      <input type="checkbox" name="services" value="${service.id}" class="mr-3">
                      <div>
                        <div class="font-medium">${service.name}</div>
                        <div class="text-sm text-gray-600">
                          ${service.service_category} • ${service.business_department} • 
                          Criticality: ${service.criticality_score}
                        </div>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Submit -->
            <div class="flex justify-end space-x-3">
              <button type="button" onclick="history.back()" 
                      class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
                Cancel
              </button>
              <button type="submit" 
                      class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                <i class="fas fa-brain mr-2"></i>
                Create Enhanced Risk
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <script>
      async function submitEnhancedRisk(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const selectedAssets = Array.from(document.querySelectorAll('input[name="assets"]:checked'))
          .map(input => ({ id: parseInt(input.value) }));
        const selectedServices = Array.from(document.querySelectorAll('input[name="services"]:checked'))
          .map(input => ({ id: parseInt(input.value) }));
        
        const data = {
          title: formData.get('title'),
          description: formData.get('description'),
          category: formData.get('category'),
          probability: parseInt(formData.get('probability')),
          impact: parseInt(formData.get('impact')),
          assets: selectedAssets,
          services: selectedServices
        };
        
        try {
          const response = await fetch('/risk/enhanced/api/create-enhanced', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
          });
          
          const result = await response.json();
          
          if (result.success) {
            alert('Enhanced risk created successfully with dynamic score: ' + Math.round(result.data.dynamicScore.score));
            location.href = '/risk/enhanced/';
          } else {
            alert('Failed to create risk: ' + result.error);
          }
        } catch (error) {
          alert('Error: ' + error.message);
        }
      }

      function toggleAssetDetails(checkbox) {
        // Could add asset detail expansion here
      }
    </script>
  `;
}

// Helper functions
function getRiskLevelColor(level: RiskLevel): string {
  const colors = {
    'CRITICAL': 'red-600',
    'HIGH': 'orange-600',
    'MEDIUM': 'yellow-600',
    'LOW': 'green-600',
    'MINIMAL': 'blue-600'
  };
  return colors[level] || 'gray-600';
}

function getTrendColor(trend: string): string {
  const colors = {
    'INCREASING': 'red-600',
    'DECREASING': 'green-600',
    'STABLE': 'gray-600'
  };
  return colors[trend] || 'gray-600';
}

function formatComponentName(key: string): string {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

export default createEnhancedDynamicRiskRoutes;