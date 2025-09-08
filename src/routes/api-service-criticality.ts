/**
 * API Routes for AI-Driven Service Criticality Assessment
 * 
 * Provides endpoints for automated service criticality calculation,
 * batch processing, and real-time insights.
 */

import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { AIServiceCriticalityEngine, type CriticalityAssessment } from '../services/ai-service-criticality';
import type { CloudflareBindings } from '../types';

export function createServiceCriticalityAPI() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware
  app.use('*', requireAuth);
  
  // Initialize AI criticality engine
  let criticalityEngine: AIServiceCriticalityEngine;
  
  app.use('*', async (c, next) => {
    criticalityEngine = new AIServiceCriticalityEngine(c.env.DB);
    await next();
  });

  /**
   * Calculate criticality for a specific service
   */
  app.post('/calculate/:serviceId', async (c) => {
    try {
      const serviceId = c.req.param('serviceId');
      const assessment = await criticalityEngine.calculateServiceCriticality(serviceId);
      
      return c.json({
        success: true,
        assessment,
        message: 'Service criticality calculated successfully'
      });
    } catch (error) {
      console.error('Error calculating service criticality:', error);
      return c.json({
        success: false,
        error: 'Failed to calculate service criticality',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * Get criticality assessment with HTMX response for UI updates
   */
  app.get('/assessment/:serviceId', async (c) => {
    try {
      const serviceId = c.req.param('serviceId');
      const assessment = await criticalityEngine.calculateServiceCriticality(serviceId);
      
      return c.html(renderCriticalityAssessment(assessment));
    } catch (error) {
      console.error('Error fetching service assessment:', error);
      return c.html(`
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-center">
            <i class="fas fa-exclamation-triangle text-red-500 mr-2"></i>
            <span class="text-red-800">Failed to load criticality assessment</span>
          </div>
        </div>
      `);
    }
  });

  /**
   * Batch process all services for criticality assessment
   */
  app.post('/batch-assess', async (c) => {
    try {
      const assessments = await criticalityEngine.batchAssessAllServices();
      
      return c.json({
        success: true,
        assessments_count: assessments.length,
        assessments,
        message: 'Batch assessment completed successfully'
      });
    } catch (error) {
      console.error('Error in batch assessment:', error);
      return c.json({
        success: false,
        error: 'Failed to complete batch assessment',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 500);
    }
  });

  /**
   * Get real-time criticality insights
   */
  app.get('/insights/:serviceId', async (c) => {
    try {
      const serviceId = c.req.param('serviceId');
      const insights = await criticalityEngine.getRealtimeCriticalityInsights(serviceId);
      
      return c.html(renderCriticalityInsights(insights));
    } catch (error) {
      console.error('Error fetching criticality insights:', error);
      return c.html(`
        <div class="text-gray-500 text-center p-4">
          <i class="fas fa-exclamation-triangle mb-2"></i>
          <div>Unable to load insights</div>
        </div>
      `);
    }
  });

  /**
   * Update service criticality in the database
   */
  app.post('/update-criticality/:serviceId', async (c) => {
    try {
      const serviceId = c.req.param('serviceId');
      const formData = await c.req.formData();
      const newCriticality = formData.get('criticality') as string;
      const reason = formData.get('reason') as string;
      
      // Update service criticality in database
      await c.env.DB.prepare(`
        UPDATE assets_enhanced 
        SET criticality = ?, 
            updated_at = datetime('now'),
            criticality_reason = ?
        WHERE asset_id = ? AND category = 'service'
      `).bind(newCriticality, reason, serviceId).run();
      
      // Recalculate assessment with new criticality
      const assessment = await criticalityEngine.calculateServiceCriticality(serviceId);
      
      return c.html(renderCriticalityAssessment(assessment));
    } catch (error) {
      console.error('Error updating service criticality:', error);
      return c.html(`
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="text-red-800">Failed to update service criticality</div>
        </div>
      `);
    }
  });

  /**
   * Get criticality statistics for dashboard
   */
  app.get('/stats', async (c) => {
    try {
      // Get criticality distribution
      const stats = await c.env.DB.prepare(`
        SELECT 
          criticality,
          COUNT(*) as count
        FROM assets_enhanced 
        WHERE category = 'service' AND active_status = TRUE
        GROUP BY criticality
      `).all();
      
      const distribution = { Critical: 0, High: 0, Medium: 0, Low: 0 };
      (stats.results || []).forEach((row: any) => {
        distribution[row.criticality as keyof typeof distribution] = row.count;
      });
      
      return c.html(renderCriticalityStats(distribution));
    } catch (error) {
      console.error('Error fetching criticality stats:', error);
      return c.html(`
        <div class="text-gray-500 text-center p-4">
          <div>Stats unavailable</div>
        </div>
      `);
    }
  });

  return app;
}

/**
 * Render criticality assessment component
 */
function renderCriticalityAssessment(assessment: CriticalityAssessment) {
  const criticalityColors = {
    'Critical': 'bg-red-100 text-red-800 border-red-200',
    'High': 'bg-orange-100 text-orange-800 border-orange-200',
    'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Low': 'bg-green-100 text-green-800 border-green-200'
  };

  return html`
    <div class="bg-white border border-gray-200 rounded-lg p-6">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center space-x-3">
          <div class="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <i class="fas fa-brain text-blue-600"></i>
          </div>
          <div>
            <h3 class="text-lg font-semibold text-gray-900">AI Criticality Assessment</h3>
            <p class="text-sm text-gray-500">Generated ${new Date(assessment.last_assessment).toLocaleDateString()}</p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${criticalityColors[assessment.calculated_criticality]}">
            ${assessment.calculated_criticality}
          </span>
          <div class="text-right">
            <div class="text-lg font-bold text-gray-900">${assessment.criticality_score}/100</div>
            <div class="text-xs text-gray-500">${Math.round(assessment.confidence_level * 100)}% confidence</div>
          </div>
        </div>
      </div>

      <!-- Score Breakdown -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div class="bg-gray-50 rounded-lg p-3">
          <div class="text-xs font-medium text-gray-500 mb-1">CIA Impact</div>
          <div class="text-lg font-bold text-blue-600">${Math.round(assessment.contributing_factors.cia_weighted_score)}</div>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <div class="text-xs font-medium text-gray-500 mb-1">Asset Dependencies</div>
          <div class="text-lg font-bold text-purple-600">${Math.round(assessment.contributing_factors.asset_dependency_impact)}</div>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <div class="text-xs font-medium text-gray-500 mb-1">Risk Correlation</div>
          <div class="text-lg font-bold text-red-600">${Math.round(assessment.contributing_factors.risk_correlation_impact)}</div>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <div class="text-xs font-medium text-gray-500 mb-1">Business Impact</div>
          <div class="text-lg font-bold text-green-600">${Math.round(assessment.contributing_factors.business_impact_score)}</div>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <div class="text-xs font-medium text-gray-500 mb-1">Technical Req.</div>
          <div class="text-lg font-bold text-indigo-600">${Math.round(assessment.contributing_factors.technical_requirements_score)}</div>
        </div>
        <div class="bg-gray-50 rounded-lg p-3">
          <div class="text-xs font-medium text-gray-500 mb-1">Historical</div>
          <div class="text-lg font-bold text-orange-600">${Math.round(assessment.contributing_factors.historical_pattern_score)}</div>
        </div>
      </div>

      <!-- Recommendations -->
      ${assessment.recommendations.length > 0 ? html`
        <div class="mb-4">
          <h4 class="text-sm font-semibold text-gray-900 mb-2 flex items-center">
            <i class="fas fa-lightbulb text-yellow-500 mr-2"></i>
            AI Recommendations
          </h4>
          <ul class="space-y-1">
            ${assessment.recommendations.slice(0, 4).map(rec => html`
              <li class="text-sm text-gray-600 flex items-start">
                <i class="fas fa-chevron-right text-gray-400 text-xs mt-1 mr-2"></i>
                <span>${rec}</span>
              </li>
            `)}
          </ul>
        </div>
      ` : ''}

      <!-- Actions -->
      <div class="flex items-center justify-between pt-4 border-t border-gray-200">
        <div class="text-xs text-gray-500">
          Next assessment: ${new Date(assessment.next_assessment_due).toLocaleDateString()}
        </div>
        <div class="flex space-x-2">
          <button 
            onclick="recalculateCriticality('${assessment.service_id}')"
            class="inline-flex items-center px-3 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 bg-white hover:bg-gray-50">
            <i class="fas fa-sync text-xs mr-1"></i>
            Recalculate
          </button>
          <button 
            onclick="showCriticalityDetails('${assessment.service_id}')"
            class="inline-flex items-center px-3 py-1 border border-transparent rounded text-xs font-medium text-white bg-blue-600 hover:bg-blue-700">
            <i class="fas fa-chart-bar text-xs mr-1"></i>
            Details
          </button>
        </div>
      </div>
    </div>

    <!-- Auto-refresh assessment every 5 minutes -->
    <div hx-get="/operations/api/service-criticality/assessment/${assessment.service_id}" 
         hx-trigger="every 300s" 
         hx-swap="outerHTML"></div>
  `;
}

/**
 * Render criticality insights component
 */
function renderCriticalityInsights(insights: any) {
  return html`
    <div class="space-y-4">
      <!-- Trending Factors -->
      ${insights.trending_factors.length > 0 ? html`
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 class="text-sm font-semibold text-blue-900 mb-2 flex items-center">
            <i class="fas fa-trending-up text-blue-600 mr-2"></i>
            Trending Factors
          </h4>
          <ul class="space-y-1">
            ${insights.trending_factors.map((factor: string) => html`
              <li class="text-sm text-blue-800 flex items-center">
                <i class="fas fa-dot-circle text-blue-500 text-xs mr-2"></i>
                ${factor}
              </li>
            `)}
          </ul>
        </div>
      ` : ''}

      <!-- Immediate Actions -->
      ${insights.immediate_actions.length > 0 ? html`
        <div class="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 class="text-sm font-semibold text-orange-900 mb-2 flex items-center">
            <i class="fas fa-exclamation-triangle text-orange-600 mr-2"></i>
            Immediate Actions Required
          </h4>
          <ul class="space-y-1">
            ${insights.immediate_actions.map((action: string) => html`
              <li class="text-sm text-orange-800 flex items-center">
                <i class="fas fa-arrow-right text-orange-500 text-xs mr-2"></i>
                ${action}
              </li>
            `)}
          </ul>
        </div>
      ` : ''}

      <!-- Risk Alerts -->
      ${insights.risk_alerts.length > 0 ? html`
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 class="text-sm font-semibold text-red-900 mb-2 flex items-center">
            <i class="fas fa-shield-alt text-red-600 mr-2"></i>
            Risk Alerts
          </h4>
          <ul class="space-y-1">
            ${insights.risk_alerts.map((alert: string) => html`
              <li class="text-sm text-red-800 flex items-center">
                <i class="fas fa-warning text-red-500 text-xs mr-2"></i>
                ${alert}
              </li>
            `)}
          </ul>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render criticality statistics
 */
function renderCriticalityStats(distribution: Record<string, number>) {
  const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
  
  return html`
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
        <div class="text-2xl font-bold text-red-600">${distribution.Critical}</div>
        <div class="text-sm text-red-800">Critical</div>
        <div class="text-xs text-red-500">${total > 0 ? Math.round((distribution.Critical / total) * 100) : 0}%</div>
      </div>
      <div class="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
        <div class="text-2xl font-bold text-orange-600">${distribution.High}</div>
        <div class="text-sm text-orange-800">High</div>
        <div class="text-xs text-orange-500">${total > 0 ? Math.round((distribution.High / total) * 100) : 0}%</div>
      </div>
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
        <div class="text-2xl font-bold text-yellow-600">${distribution.Medium}</div>
        <div class="text-sm text-yellow-800">Medium</div>
        <div class="text-xs text-yellow-500">${total > 0 ? Math.round((distribution.Medium / total) * 100) : 0}%</div>
      </div>
      <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
        <div class="text-2xl font-bold text-green-600">${distribution.Low}</div>
        <div class="text-sm text-green-800">Low</div>
        <div class="text-xs text-green-500">${total > 0 ? Math.round((distribution.Low / total) * 100) : 0}%</div>
      </div>
    </div>
  `;
}