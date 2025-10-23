/**
 * Risk Routes - /risk-v2/* endpoints
 * 
 * Clean Architecture implementation with:
 * - Zod validation schemas
 * - Application layer handlers (CQRS)
 * - Standardized error handling
 * - Type-safe request/response
 * 
 * Routes mirror existing /risk/* functionality with improved architecture
 */

import { Hono } from 'hono';
import { D1Database } from '@cloudflare/workers-types';

// Validation schemas
import {
  validateBody,
  validateQuery,
  validateParams,
  IdParamSchema,
  RiskIdParamSchema,
  type ValidatedData
} from '../middleware';

import {
  CreateRiskSchema,
  UpdateRiskSchema,
  ListRisksQuerySchema,
  UpdateStatusSchema,
  BulkCreateRiskSchema,
  BulkDeleteSchema,
  BulkUpdateStatusSchema,
  type CreateRiskInput,
  type UpdateRiskInput,
  type ListRisksQueryInput,
  type UpdateStatusInput
} from '../validation';

// Application layer
import { CreateRiskHandler } from '../../application/handlers/CreateRiskHandler';
import { UpdateRiskHandler } from '../../application/handlers/UpdateRiskHandler';
import { DeleteRiskHandler } from '../../application/handlers/DeleteRiskHandler';
import { ChangeRiskStatusHandler } from '../../application/handlers/ChangeRiskStatusHandler';
import { GetRiskByIdHandler } from '../../application/handlers/GetRiskByIdHandler';
import { ListRisksHandler } from '../../application/handlers/ListRisksHandler';
import { GetRiskStatisticsHandler } from '../../application/handlers/GetRiskStatisticsHandler';
import { SearchRisksHandler } from '../../application/handlers/SearchRisksHandler';

import { CreateRiskCommand } from '../../application/commands/CreateRiskCommand';
import { UpdateRiskCommand } from '../../application/commands/UpdateRiskCommand';
import { DeleteRiskCommand } from '../../application/commands/DeleteRiskCommand';
import { ChangeRiskStatusCommand } from '../../application/commands/ChangeRiskStatusCommand';
import { GetRiskByIdQuery } from '../../application/queries/GetRiskByIdQuery';
import { ListRisksQuery } from '../../application/queries/ListRisksQuery';
import { GetRiskStatisticsQuery } from '../../application/queries/GetRiskStatisticsQuery';
import { SearchRisksQuery } from '../../application/queries/SearchRisksQuery';

// Infrastructure
import { D1RiskRepository } from '../../infrastructure/repositories/D1RiskRepository';

// Types
interface CloudflareBindings {
  DB: D1Database;
}

// Extended context variables for validated data
type Variables = {
  validatedData: any;
  validatedQuery: any;
  validatedParams: any;
};

/**
 * Create Risk Routes
 * 
 * @returns Hono app with all /risk-v2/* routes
 */
export function createRiskRoutesV2() {
  const app = new Hono<{ Bindings: CloudflareBindings; Variables: Variables }>();

  // ===== Helper: Initialize handlers =====
  function getHandlers(db: D1Database) {
    const repository = new D1RiskRepository(db);
    
    return {
      createRisk: new CreateRiskHandler(repository),
      updateRisk: new UpdateRiskHandler(repository),
      deleteRisk: new DeleteRiskHandler(repository),
      updateStatus: new ChangeRiskStatusHandler(repository),
      getRiskById: new GetRiskByIdHandler(repository),
      listRisks: new ListRisksHandler(repository),
      getStatistics: new GetRiskStatisticsHandler(repository),
      searchRisks: new SearchRisksHandler(repository)
    };
  }

  // ===== Core CRUD Operations =====

  /**
   * POST /risk-v2/create
   * Create a new risk
   */
  app.post('/create', validateBody(CreateRiskSchema), async (c) => {
    try {
      const data = c.get('validatedData') as CreateRiskInput;
      const handlers = getHandlers(c.env.DB);

      const command = new CreateRiskCommand({
        riskId: data.riskId,
        title: data.title,
        description: data.description,
        category: data.category,
        probability: data.probability,
        impact: data.impact,
        organizationId: data.organizationId,
        ownerId: data.ownerId,
        createdBy: data.createdBy,
        riskType: data.riskType,
        status: data.status,
        mitigationPlan: data.mitigationPlan,
        contingencyPlan: data.contingencyPlan,
        reviewDate: data.reviewDate,
        tags: data.tags,
        metadata: data.metadata
      });

      const result = await handlers.createRisk.execute(command);

      return c.json({
        success: true,
        data: result,
        message: 'Risk created successfully'
      }, 201);
    } catch (error: any) {
      console.error('Error creating risk:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to create risk',
        details: error.details || []
      }, 500);
    }
  });

  /**
   * GET /risk-v2/:id
   * Get risk by database ID
   */
  app.get('/:id', validateParams(IdParamSchema), async (c) => {
    try {
      const { id } = c.get('validatedParams') as { id: number };
      const handlers = getHandlers(c.env.DB);

      const query = new GetRiskByIdQuery(id);
      const result = await handlers.getRiskById.execute(query);

      if (!result) {
        return c.json({
          success: false,
          error: 'Risk not found'
        }, 404);
      }

      return c.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Error fetching risk:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to fetch risk'
      }, 500);
    }
  });

  /**
   * GET /risk-v2/riskId/:riskId
   * Get risk by business risk ID (e.g., RISK-001)
   */
  app.get('/riskId/:riskId', validateParams(RiskIdParamSchema), async (c) => {
    try {
      const { riskId } = c.get('validatedParams') as { riskId: string };
      const handlers = getHandlers(c.env.DB);

      // Note: GetRiskByIdQuery takes database ID, but we need to look up by riskId first
      const repository = new D1RiskRepository(c.env.DB);
      const risk = await repository.findByRiskId(riskId);
      
      if (!risk) {
        return c.json({
          success: false,
          error: 'Risk not found'
        }, 404);
      }

      const query = new GetRiskByIdQuery(risk.id);
      const result = await handlers.getRiskById.execute(query);

      if (!result) {
        return c.json({
          success: false,
          error: 'Risk not found'
        }, 404);
      }

      return c.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Error fetching risk:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to fetch risk'
      }, 500);
    }
  });

  /**
   * PUT /risk-v2/:id
   * Update risk (full or partial)
   */
  app.put('/:id', 
    validateParams(IdParamSchema), 
    validateBody(UpdateRiskSchema), 
    async (c) => {
      try {
        const { id } = c.get('validatedParams') as { id: number };
        const data = c.get('validatedData') as UpdateRiskInput;
        const handlers = getHandlers(c.env.DB);

        const command = new UpdateRiskCommand(id, data);
        const result = await handlers.updateRisk.execute(command);

        return c.json({
          success: true,
          data: result,
          message: 'Risk updated successfully'
        });
      } catch (error: any) {
        console.error('Error updating risk:', error);
        return c.json({
          success: false,
          error: error.message || 'Failed to update risk'
        }, 500);
      }
    }
  );

  /**
   * PATCH /risk-v2/:id/status
   * Update risk status with audit trail
   */
  app.patch('/:id/status',
    validateParams(IdParamSchema),
    validateBody(UpdateStatusSchema),
    async (c) => {
      try {
        const { id } = c.get('validatedParams') as { id: number };
        const data = c.get('validatedData') as UpdateStatusInput;
        const handlers = getHandlers(c.env.DB);

        const command = new ChangeRiskStatusCommand(
          id,
          data.status,
          data.reason,
          data.updatedBy
        );

        const result = await handlers.updateStatus.execute(command);

        return c.json({
          success: true,
          data: result,
          message: 'Risk status updated successfully'
        });
      } catch (error: any) {
        console.error('Error updating risk status:', error);
        return c.json({
          success: false,
          error: error.message || 'Failed to update risk status'
        }, 500);
      }
    }
  );

  /**
   * DELETE /risk-v2/:id
   * Delete risk by database ID
   */
  app.delete('/:id', validateParams(IdParamSchema), async (c) => {
    try {
      const { id } = c.get('validatedParams') as { id: number };
      const handlers = getHandlers(c.env.DB);

      const command = new DeleteRiskCommand(id);
      await handlers.deleteRisk.execute(command);

      return c.json({
        success: true,
        message: 'Risk deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting risk:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to delete risk'
      }, 500);
    }
  });

  /**
   * DELETE /risk-v2/riskId/:riskId
   * Delete risk by business risk ID
   */
  app.delete('/riskId/:riskId', validateParams(RiskIdParamSchema), async (c) => {
    try {
      const { riskId } = c.get('validatedParams') as { riskId: string };
      const handlers = getHandlers(c.env.DB);

      // Look up database ID first
      const repository = new D1RiskRepository(c.env.DB);
      const risk = await repository.findByRiskId(riskId);
      
      if (!risk) {
        return c.json({
          success: false,
          error: 'Risk not found'
        }, 404);
      }

      const command = new DeleteRiskCommand(risk.id);
      await handlers.deleteRisk.execute(command);

      return c.json({
        success: true,
        message: 'Risk deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting risk:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to delete risk'
      }, 500);
    }
  });

  // ===== List & Query Operations =====

  /**
   * GET /risk-v2/list
   * List risks with filters, sorting, and pagination
   */
  app.get('/list', validateQuery(ListRisksQuerySchema), async (c) => {
    try {
      const queryData = c.get('validatedQuery') as ListRisksQueryInput;
      const handlers = getHandlers(c.env.DB);

      const query = new ListRisksQuery(queryData);
      const result = await handlers.listRisks.execute(query);

      return c.json({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
          hasNext: result.hasNext,
          hasPrevious: result.hasPrevious
        }
      });
    } catch (error: any) {
      console.error('Error listing risks:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to list risks'
      }, 500);
    }
  });

  /**
   * GET /risk-v2/search
   * Search risks by query string
   */
  app.get('/search', async (c) => {
    try {
      const query = c.req.query('q') || '';
      const organizationId = c.req.query('organizationId');
      const handlers = getHandlers(c.env.DB);

      const searchQuery = new SearchRisksQuery(
        query,
        organizationId ? parseInt(organizationId) : undefined
      );

      const result = await handlers.searchRisks.execute(searchQuery);

      return c.json({
        success: true,
        data: result,
        count: result.length
      });
    } catch (error: any) {
      console.error('Error searching risks:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to search risks'
      }, 500);
    }
  });

  /**
   * GET /risk-v2/statistics
   * Get risk statistics (aggregated data)
   */
  app.get('/statistics', async (c) => {
    try {
      const organizationId = c.req.query('organizationId');
      const handlers = getHandlers(c.env.DB);

      const query = new GetRiskStatisticsQuery(
        organizationId ? parseInt(organizationId) : undefined
      );

      const result = await handlers.getStatistics.execute(query);

      return c.json({
        success: true,
        data: result
      });
    } catch (error: any) {
      console.error('Error fetching statistics:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to fetch statistics'
      }, 500);
    }
  });

  // ===== Specialized Query Operations =====

  /**
   * GET /risk-v2/critical
   * Get all critical risks (score >= 20)
   */
  app.get('/critical', async (c) => {
    try {
      const organizationId = c.req.query('organizationId');
      const repository = new D1RiskRepository(c.env.DB);
      
      const risks = await repository.findCriticalRisks(
        organizationId ? parseInt(organizationId) : undefined
      );

      // Convert to DTOs
      const risksDTO = risks.map(risk => ({
        id: risk.id,
        riskId: risk.riskId,
        title: risk.title,
        description: risk.description,
        category: risk.category.value,
        probability: risk.score.probability,
        impact: risk.score.impact,
        riskScore: risk.score.score,
        riskLevel: risk.score.level,
        status: risk.status.value,
        organizationId: risk.organizationId,
        ownerId: risk.ownerId,
        createdBy: risk.createdBy,
        riskType: risk.riskType,
        mitigationPlan: risk.mitigationPlan,
        contingencyPlan: risk.contingencyPlan,
        reviewDate: risk.reviewDate?.toISOString(),
        lastReviewDate: risk.lastReviewDate?.toISOString(),
        tags: risk.tags,
        metadata: risk.metadata,
        createdAt: risk.createdAt.toISOString(),
        updatedAt: risk.updatedAt.toISOString()
      }));

      return c.json({
        success: true,
        data: risksDTO,
        count: risksDTO.length
      });
    } catch (error: any) {
      console.error('Error fetching critical risks:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to fetch critical risks'
      }, 500);
    }
  });

  /**
   * GET /risk-v2/needs-attention
   * Get risks needing attention (active + high/critical or overdue)
   */
  app.get('/needs-attention', async (c) => {
    try {
      const organizationId = c.req.query('organizationId');
      const repository = new D1RiskRepository(c.env.DB);
      
      const risks = await repository.findNeedingAttention(
        organizationId ? parseInt(organizationId) : undefined
      );

      // Convert to DTOs
      const risksDTO = risks.map(risk => ({
        id: risk.id,
        riskId: risk.riskId,
        title: risk.title,
        description: risk.description,
        category: risk.category.value,
        probability: risk.score.probability,
        impact: risk.score.impact,
        riskScore: risk.score.score,
        riskLevel: risk.score.level,
        status: risk.status.value,
        organizationId: risk.organizationId,
        ownerId: risk.ownerId,
        createdBy: risk.createdBy,
        riskType: risk.riskType,
        mitigationPlan: risk.mitigationPlan,
        contingencyPlan: risk.contingencyPlan,
        reviewDate: risk.reviewDate?.toISOString(),
        lastReviewDate: risk.lastReviewDate?.toISOString(),
        tags: risk.tags,
        metadata: risk.metadata,
        createdAt: risk.createdAt.toISOString(),
        updatedAt: risk.updatedAt.toISOString()
      }));

      return c.json({
        success: true,
        data: risksDTO,
        count: risksDTO.length
      });
    } catch (error: any) {
      console.error('Error fetching risks needing attention:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to fetch risks needing attention'
      }, 500);
    }
  });

  /**
   * GET /risk-v2/overdue-reviews
   * Get risks with overdue reviews
   */
  app.get('/overdue-reviews', async (c) => {
    try {
      const organizationId = c.req.query('organizationId');
      const repository = new D1RiskRepository(c.env.DB);
      
      const risks = await repository.findOverdueReviews(
        organizationId ? parseInt(organizationId) : undefined
      );

      // Convert to DTOs
      const risksDTO = risks.map(risk => ({
        id: risk.id,
        riskId: risk.riskId,
        title: risk.title,
        description: risk.description,
        category: risk.category.value,
        probability: risk.score.probability,
        impact: risk.score.impact,
        riskScore: risk.score.score,
        riskLevel: risk.score.level,
        status: risk.status.value,
        organizationId: risk.organizationId,
        ownerId: risk.ownerId,
        createdBy: risk.createdBy,
        riskType: risk.riskType,
        mitigationPlan: risk.mitigationPlan,
        contingencyPlan: risk.contingencyPlan,
        reviewDate: risk.reviewDate?.toISOString(),
        lastReviewDate: risk.lastReviewDate?.toISOString(),
        tags: risk.tags,
        metadata: risk.metadata,
        createdAt: risk.createdAt.toISOString(),
        updatedAt: risk.updatedAt.toISOString()
      }));

      return c.json({
        success: true,
        data: risksDTO,
        count: risksDTO.length
      });
    } catch (error: any) {
      console.error('Error fetching overdue reviews:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to fetch overdue reviews'
      }, 500);
    }
  });

  // ===== Bulk Operations =====

  /**
   * POST /risk-v2/bulk/create
   * Create multiple risks (max 50)
   */
  app.post('/bulk/create', validateBody(BulkCreateRiskSchema), async (c) => {
    try {
      const { risks } = c.get('validatedData') as { risks: CreateRiskInput[] };
      const handlers = getHandlers(c.env.DB);

      // Create all risks
      const created = [];
      for (const riskData of risks) {
        const command = new CreateRiskCommand({
          riskId: riskData.riskId,
          title: riskData.title,
          description: riskData.description,
          category: riskData.category,
          probability: riskData.probability,
          impact: riskData.impact,
          organizationId: riskData.organizationId,
          ownerId: riskData.ownerId,
          createdBy: riskData.createdBy,
          riskType: riskData.riskType,
          status: riskData.status,
          mitigationPlan: riskData.mitigationPlan,
          contingencyPlan: riskData.contingencyPlan,
          reviewDate: riskData.reviewDate,
          tags: riskData.tags,
          metadata: riskData.metadata
        });

        const result = await handlers.createRisk.execute(command);
        created.push(result);
      }

      return c.json({
        success: true,
        data: created,
        count: created.length,
        message: `Successfully created ${created.length} risks`
      }, 201);
    } catch (error: any) {
      console.error('Error creating risks in bulk:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to create risks in bulk'
      }, 500);
    }
  });

  /**
   * DELETE /risk-v2/bulk/delete
   * Delete multiple risks by IDs (max 100)
   */
  app.delete('/bulk/delete', validateBody(BulkDeleteSchema), async (c) => {
    try {
      const { ids } = c.get('validatedData') as { ids: number[] };
      const repository = new D1RiskRepository(c.env.DB);

      await repository.deleteMany(ids);

      return c.json({
        success: true,
        count: ids.length,
        message: `Successfully deleted ${ids.length} risks`
      });
    } catch (error: any) {
      console.error('Error deleting risks in bulk:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to delete risks in bulk'
      }, 500);
    }
  });

  /**
   * PATCH /risk-v2/bulk/status
   * Update status for multiple risks (max 100)
   */
  app.patch('/bulk/status', validateBody(BulkUpdateStatusSchema), async (c) => {
    try {
      const { ids, status } = c.get('validatedData') as { ids: number[]; status: string };
      const repository = new D1RiskRepository(c.env.DB);

      // Import RiskStatus to convert string to RiskStatus value object
      const { RiskStatus } = await import('../../domain/value-objects/RiskStatus');
      const riskStatus = RiskStatus.create(status);
      
      await repository.updateStatusBulk(ids, riskStatus);

      return c.json({
        success: true,
        count: ids.length,
        message: `Successfully updated status for ${ids.length} risks`
      });
    } catch (error: any) {
      console.error('Error updating status in bulk:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to update status in bulk'
      }, 500);
    }
  });

  // ===== Risk Reclassification (Dynamic Risk Rating) =====

  /**
   * POST /risk-v2/reclassify/:id
   * Manually trigger reclassification for a specific risk
   */
  app.post('/reclassify/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'));
      
      // Import here to avoid circular dependencies
      const { RiskReclassificationService } = await import('../../application/services/RiskReclassificationService');
      const service = new RiskReclassificationService(c.env.DB);
      
      const result = await service.reclassifyRisk(id);
      
      if (!result) {
        return c.json({
          success: true,
          message: 'No reclassification needed - risk has no linked assets or scores unchanged',
          data: null
        });
      }

      return c.json({
        success: true,
        message: 'Risk reclassified successfully',
        data: result
      });
    } catch (error: any) {
      console.error('Error reclassifying risk:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to reclassify risk'
      }, 500);
    }
  });

  /**
   * POST /risk-v2/reclassify-by-asset/:assetId
   * Reclassify all risks linked to a specific asset
   * Useful when asset criticality changes
   */
  app.post('/reclassify-by-asset/:assetId', async (c) => {
    try {
      const assetId = parseInt(c.req.param('assetId'));
      
      const { RiskReclassificationService } = await import('../../application/services/RiskReclassificationService');
      const service = new RiskReclassificationService(c.env.DB);
      
      const results = await service.reclassifyRisksByAsset(assetId);
      
      return c.json({
        success: true,
        message: `Reclassified ${results.length} risk(s) affected by asset ${assetId}`,
        data: results,
        count: results.length
      });
    } catch (error: any) {
      console.error('Error reclassifying risks by asset:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to reclassify risks'
      }, 500);
    }
  });

  /**
   * POST /risk-v2/reclassify-all
   * Bulk reclassification of all risks with linked assets
   * Use for periodic recalculation
   */
  app.post('/reclassify-all', async (c) => {
    try {
      const { RiskReclassificationService } = await import('../../application/services/RiskReclassificationService');
      const service = new RiskReclassificationService(c.env.DB);
      
      const results = await service.reclassifyAllRisks();
      
      return c.json({
        success: true,
        message: `Bulk reclassification complete: ${results.length} risk(s) updated`,
        data: results,
        count: results.length
      });
    } catch (error: any) {
      console.error('Error in bulk reclassification:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to reclassify risks'
      }, 500);
    }
  });

  /**
   * GET /risk-v2/preview-reclassify/:id
   * Preview reclassification without applying changes
   */
  app.get('/preview-reclassify/:id', async (c) => {
    try {
      const id = parseInt(c.req.param('id'));
      
      const { RiskReclassificationService } = await import('../../application/services/RiskReclassificationService');
      const service = new RiskReclassificationService(c.env.DB);
      
      const preview = await service.previewReclassification(id);
      
      if (!preview) {
        return c.json({
          success: true,
          message: 'No reclassification preview available - risk has no linked assets',
          data: null
        });
      }

      return c.json({
        success: true,
        message: 'Reclassification preview generated',
        data: preview
      });
    } catch (error: any) {
      console.error('Error previewing reclassification:', error);
      return c.json({
        success: false,
        error: error.message || 'Failed to preview reclassification'
      }, 500);
    }
  });

  // ===== Health & Debug =====

  /**
   * GET /risk-v2/health
   * Health check endpoint
   */
  app.get('/health', async (c) => {
    try {
      // Test database connectivity
      await c.env.DB.prepare('SELECT 1').first();

      return c.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0'
      });
    } catch (error: any) {
      return c.json({
        success: false,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }, 503);
    }
  });

  return app;
}
