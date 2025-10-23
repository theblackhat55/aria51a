/**
 * Risk UI Routes - /risk-v2/ui/* endpoints
 * 
 * HTMX-powered UI routes that serve HTML templates
 * Follows ARIA5 design patterns
 */

import { Hono } from 'hono';
import { D1Database } from '@cloudflare/workers-types';

// Templates
import {
  renderRiskManagementPage,
  renderRiskStatistics,
  renderRiskTable,
  renderCreateRiskModal,
  renderViewRiskModal,
  renderEditRiskModal,
  renderStatusChangeModal,
  renderRiskScoreDisplay,
  type RiskStatistics,
  type RiskRow
} from '../templates';

// Application handlers
import { ListRisksHandler } from '../../application/handlers/ListRisksHandler';
import { GetRiskStatisticsHandler } from '../../application/handlers/GetRiskStatisticsHandler';
import { GetRiskByIdHandler } from '../../application/handlers/GetRiskByIdHandler';
import { ListRisksQuery } from '../../application/queries/ListRisksQuery';
import { GetRiskStatisticsQuery } from '../../application/queries/GetRiskStatisticsQuery';
import { GetRiskByIdQuery } from '../../application/queries/GetRiskByIdQuery';

// Infrastructure
import { D1RiskRepository } from '../../infrastructure/repositories/D1RiskRepository';

// Types
interface CloudflareBindings {
  DB: D1Database;
}

/**
 * Create Risk UI Routes
 * 
 * @returns Hono app with all /risk-v2/ui/* routes
 */
export function createRiskUIRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  // ===== Main Page =====

  /**
   * GET /risk-v2/ui
   * Main risk management page
   */
  app.get('/', async (c) => {
    return c.html(renderRiskManagementPage());
  });

  // ===== HTMX Endpoints =====

  /**
   * GET /risk-v2/ui/stats
   * Statistics cards (HTMX endpoint)
   */
  app.get('/stats', async (c) => {
    try {
      const repository = new D1RiskRepository(c.env.DB);
      const handler = new GetRiskStatisticsHandler(repository);
      const query = new GetRiskStatisticsQuery();
      
      const stats = await handler.execute(query);
      
      return c.html(renderRiskStatistics(stats as RiskStatistics));
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      // Return fallback stats
      const fallbackStats: RiskStatistics = {
        total: 0,
        byStatus: {},
        byLevel: { low: 0, medium: 0, high: 0, critical: 0 },
        byCategory: {},
        averageScore: 0,
        activeCount: 0,
        closedCount: 0,
        reviewOverdueCount: 0
      };
      return c.html(renderRiskStatistics(fallbackStats));
    }
  });

  /**
   * GET /risk-v2/ui/table
   * Risk table with filters (HTMX endpoint)
   */
  app.get('/table', async (c) => {
    try {
      const repository = new D1RiskRepository(c.env.DB);
      const handler = new ListRisksHandler(repository);
      
      // Parse query parameters
      const search = c.req.query('search');
      const status = c.req.query('status');
      const category = c.req.query('category');
      const riskLevel = c.req.query('riskLevel');
      const sortBy = c.req.query('sortBy') || 'createdAt';
      const sortOrder = c.req.query('sortOrder') || 'desc';
      const page = parseInt(c.req.query('page') || '1');
      const limit = parseInt(c.req.query('limit') || '20');
      
      // Build query
      const queryParams: any = {
        page,
        limit,
        sortBy,
        sortOrder
      };
      
      if (search) queryParams.search = search;
      if (status) queryParams.status = status;
      if (category) queryParams.category = category;
      if (riskLevel) queryParams.riskLevel = riskLevel;
      
      const query = new ListRisksQuery(queryParams);
      const result = await handler.execute(query);
      
      // Convert to RiskRow format
      const risks: RiskRow[] = result.items.map(item => ({
        id: item.id,
        riskId: item.riskId,
        title: item.title,
        description: item.description,
        category: item.category,
        status: item.status,
        probability: item.probability,
        impact: item.impact,
        riskScore: item.riskScore,
        riskLevel: item.riskLevel,
        organizationId: item.organizationId,
        ownerId: item.ownerId,
        ownerName: undefined, // TODO: Load from users table
        reviewDate: item.reviewDate,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      }));
      
      return c.html(renderRiskTable(risks));
    } catch (error: any) {
      console.error('Error fetching risks:', error);
      return c.html(renderRiskTable([]));
    }
  });

  /**
   * GET /risk-v2/ui/create
   * Create risk modal (HTMX endpoint)
   */
  app.get('/create', async (c) => {
    return c.html(renderCreateRiskModal());
  });

  /**
   * GET /risk-v2/ui/view/:id
   * View risk modal (HTMX endpoint)
   */
  app.get('/view/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'));
      const repository = new D1RiskRepository(c.env.DB);
      const handler = new GetRiskByIdHandler(repository);
      const query = new GetRiskByIdQuery(id);
      
      const risk = await handler.execute(query);
      
      if (!risk) {
        return c.html('<div class="p-6 text-center text-red-600">Risk not found</div>');
      }
      
      // Convert to RiskRow format
      const riskRow: RiskRow = {
        id: risk.id,
        riskId: risk.riskId,
        title: risk.title,
        description: risk.description,
        category: risk.category,
        status: risk.status,
        probability: risk.probability,
        impact: risk.impact,
        riskScore: risk.riskScore,
        riskLevel: risk.riskLevel,
        organizationId: risk.organizationId,
        ownerId: risk.ownerId,
        reviewDate: risk.reviewDate,
        createdAt: risk.createdAt,
        updatedAt: risk.updatedAt
      };
      
      return c.html(renderViewRiskModal(riskRow));
    } catch (error: any) {
      console.error('Error fetching risk:', error);
      return c.html('<div class="p-6 text-center text-red-600">Error loading risk details</div>');
    }
  });

  /**
   * GET /risk-v2/ui/edit/:id
   * Edit risk modal (HTMX endpoint)
   */
  app.get('/edit/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'));
      const repository = new D1RiskRepository(c.env.DB);
      const handler = new GetRiskByIdHandler(repository);
      const query = new GetRiskByIdQuery(id);
      
      const risk = await handler.execute(query);
      
      if (!risk) {
        return c.html('<div class="p-6 text-center text-red-600">Risk not found</div>');
      }
      
      // Convert to RiskRow format
      const riskRow: RiskRow = {
        id: risk.id,
        riskId: risk.riskId,
        title: risk.title,
        description: risk.description,
        category: risk.category,
        status: risk.status,
        probability: risk.probability,
        impact: risk.impact,
        riskScore: risk.riskScore,
        riskLevel: risk.riskLevel,
        organizationId: risk.organizationId,
        ownerId: risk.ownerId,
        reviewDate: risk.reviewDate,
        createdAt: risk.createdAt,
        updatedAt: risk.updatedAt
      };
      
      return c.html(renderEditRiskModal(riskRow));
    } catch (error: any) {
      console.error('Error fetching risk:', error);
      return c.html('<div class="p-6 text-center text-red-600">Error loading risk for editing</div>');
    }
  });

  /**
   * GET /risk-v2/ui/status/:id
   * Change status modal (HTMX endpoint)
   */
  app.get('/status/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'));
      const repository = new D1RiskRepository(c.env.DB);
      const handler = new GetRiskByIdHandler(repository);
      const query = new GetRiskByIdQuery(id);
      
      const risk = await handler.execute(query);
      
      if (!risk) {
        return c.html('<div class="p-6 text-center text-red-600">Risk not found</div>');
      }
      
      // Convert to RiskRow format
      const riskRow: RiskRow = {
        id: risk.id,
        riskId: risk.riskId,
        title: risk.title,
        description: risk.description,
        category: risk.category,
        status: risk.status,
        probability: risk.probability,
        impact: risk.impact,
        riskScore: risk.riskScore,
        riskLevel: risk.riskLevel,
        organizationId: risk.organizationId,
        ownerId: risk.ownerId,
        reviewDate: risk.reviewDate,
        createdAt: risk.createdAt,
        updatedAt: risk.updatedAt
      };
      
      return c.html(renderStatusChangeModal(riskRow));
    } catch (error: any) {
      console.error('Error fetching risk:', error);
      return c.html('<div class="p-6 text-center text-red-600">Error loading risk for status change</div>');
    }
  });

  /**
   * POST /risk-v2/ui/calculate-score
   * Calculate risk score (HTMX endpoint for live calculation)
   */
  app.post('/calculate-score', async (c) => {
    try {
      const body = await c.req.parseBody();
      const probability = parseInt(body.probability as string) || 0;
      const impact = parseInt(body.impact as string) || 0;
      
      if (!probability || !impact) {
        return c.html(`
          <input type="text" 
                 value="TBD" 
                 readonly
                 class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600">
        `);
      }
      
      return c.html(renderRiskScoreDisplay(probability, impact));
    } catch (error: any) {
      console.error('Error calculating score:', error);
      return c.html(`
        <input type="text" 
               value="Error" 
               readonly
               class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-red-600">
      `);
    }
  });

  /**
   * GET /risk-v2/ui/import
   * Import modal (placeholder)
   */
  app.get('/import', async (c) => {
    return c.html('<div class="p-6 text-center">Import modal - Coming soon</div>');
  });

  /**
   * POST /risk-v2/ui/export
   * Export risks (placeholder)
   */
  app.post('/export', async (c) => {
    return c.json({ success: true, message: 'Export functionality coming soon' });
  });

  return app;
}
