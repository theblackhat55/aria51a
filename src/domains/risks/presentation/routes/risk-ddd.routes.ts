/**
 * Risk Domain Routes - DDD Implementation
 * 
 * New modular routes using DDD architecture with CQRS handlers
 */

import { Hono } from 'hono';

// Validators
import { CreateRiskSchema } from '../validators/CreateRiskValidator';
import { UpdateRiskSchema } from '../validators/UpdateRiskValidator';
import { ListRisksSchema } from '../validators/ListRisksValidator';

// Commands & Queries
import { CreateRiskCommand } from '../../application/commands/CreateRiskCommand';
import { UpdateRiskCommand } from '../../application/commands/UpdateRiskCommand';
import { DeleteRiskCommand } from '../../application/commands/DeleteRiskCommand';
import { GetRiskByIdQuery } from '../../application/queries/GetRiskByIdQuery';
import { ListRisksQuery } from '../../application/queries/ListRisksQuery';
import { SearchRisksQuery } from '../../application/queries/SearchRisksQuery';
import { GetRiskStatisticsQuery } from '../../application/queries/GetRiskStatisticsQuery';

// Handlers
import { CreateRiskHandler } from '../../application/handlers/CreateRiskHandler';
import { UpdateRiskHandler } from '../../application/handlers/UpdateRiskHandler';
import { DeleteRiskHandler } from '../../application/handlers/DeleteRiskHandler';
import { GetRiskByIdHandler } from '../../application/handlers/GetRiskByIdHandler';
import { ListRisksHandler } from '../../application/handlers/ListRisksHandler';
import { GetRiskStatisticsHandler } from '../../application/handlers/GetRiskStatisticsHandler';

// Infrastructure
import { D1RiskRepository } from '../../infrastructure/persistence/D1RiskRepository';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

/**
 * POST /api/v2/risks - Create new risk
 */
app.post(
  '/',
  async (c) => {
    try {
      const body = await c.req.json();
      const validation = CreateRiskSchema.safeParse(body);
      
      if (!validation.success) {
        return c.json({
          success: false,
          error: 'Validation failed',
          details: validation.error.errors
        }, 400);
      }
      
      const data = validation.data;
      const organizationId = c.get('organizationId') as number || 1; // From auth middleware
      const userId = c.get('userId') as number || 1;

      // Create repository
      const repository = new D1RiskRepository(c.env.DB);

      // Create command
      const command = new CreateRiskCommand({
        ...data,
        organizationId,
        createdBy: userId
      });

      // Execute handler
      const handler = new CreateRiskHandler(repository);
      const result = await handler.handle(command);

      return c.json({
        success: true,
        data: result,
        message: 'Risk created successfully'
      }, 201);
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create risk'
      }, 400);
    }
  }
);

/**
 * GET /api/v2/risks - List risks with filters
 */
app.get(
  '/',
  async (c) => {
    try {
      // Parse query parameters
      const queryParams = c.req.query();
      
      // Validate query parameters
      const validation = ListRisksSchema.safeParse({
        limit: queryParams.limit ? parseInt(queryParams.limit) : undefined,
        offset: queryParams.offset ? parseInt(queryParams.offset) : undefined,
        status: queryParams.status,
        category: queryParams.category,
        ownerId: queryParams.ownerId ? parseInt(queryParams.ownerId) : undefined,
        searchQuery: queryParams.searchQuery,
        sortBy: queryParams.sortBy,
        sortOrder: queryParams.sortOrder
      });
      
      if (!validation.success) {
        return c.json({
          success: false,
          error: 'Validation failed',
          details: validation.error.errors
        }, 400);
      }
      
      const params = validation.data;
      const organizationId = c.get('organizationId') as number || 1;

      // Create repository
      const repository = new D1RiskRepository(c.env.DB);

      // Create query
      const query = new ListRisksQuery({
        organizationId,
        ...params
      });

      // Execute handler
      const handler = new ListRisksHandler(repository);
      const result = await handler.handle(query);

      return c.json({
        success: true,
        data: result.risks,
        meta: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          page: Math.floor(result.offset / result.limit) + 1,
          pages: Math.ceil(result.total / result.limit)
        }
      });
    } catch (error) {
      console.error('Error in GET /api/v2/risks:', error);
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list risks',
        stack: error instanceof Error ? error.stack : undefined
      }, 500);
    }
  }
);

/**
 * GET /api/v2/risks/statistics - Get risk statistics
 */
app.get(
  '/statistics',
  async (c) => {
    try {
      const organizationId = c.get('organizationId') as number || 1;

      // Create repository
      const repository = new D1RiskRepository(c.env.DB);

      // Create query
      const query = new GetRiskStatisticsQuery({ organizationId });

      // Execute handler
      const handler = new GetRiskStatisticsHandler(repository);
      const result = await handler.handle(query);

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get statistics'
      }, 400);
    }
  }
);

/**
 * GET /api/v2/risks/:id - Get risk by ID
 */
app.get(
  '/:id',
  async (c) => {
    try {
      const id = parseInt(c.req.param('id'));
      const organizationId = c.get('organizationId') as number || 1;

      if (isNaN(id)) {
        return c.json({
          success: false,
          error: 'Invalid risk ID'
        }, 400);
      }

      // Create repository
      const repository = new D1RiskRepository(c.env.DB);

      // Create query
      const query = new GetRiskByIdQuery({ id, organizationId });

      // Execute handler
      const handler = new GetRiskByIdHandler(repository);
      const result = await handler.handle(query);

      return c.json({
        success: true,
        data: result
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return c.json({
          success: false,
          error: 'Risk not found'
        }, 404);
      }

      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get risk'
      }, 400);
    }
  }
);

/**
 * PUT /api/v2/risks/:id - Update risk
 */
app.put(
  '/:id',
  async (c) => {
    try {
      const id = parseInt(c.req.param('id'));
      const body = await c.req.json();
      const validation = UpdateRiskSchema.safeParse(body);
      
      if (!validation.success) {
        return c.json({
          success: false,
          error: 'Validation failed',
          details: validation.error.errors
        }, 400);
      }
      
      const data = validation.data;
      const organizationId = c.get('organizationId') as number || 1;
      const userId = c.get('userId') as number || 1;

      if (isNaN(id)) {
        return c.json({
          success: false,
          error: 'Invalid risk ID'
        }, 400);
      }

      // Create repository
      const repository = new D1RiskRepository(c.env.DB);

      // Create command
      const command = new UpdateRiskCommand({
        id,
        organizationId,
        ...data,
        updatedBy: userId
      });

      // Execute handler
      const handler = new UpdateRiskHandler(repository);
      const result = await handler.handle(command);

      return c.json({
        success: true,
        data: result,
        message: 'Risk updated successfully'
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return c.json({
          success: false,
          error: 'Risk not found'
        }, 404);
      }

      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update risk'
      }, 400);
    }
  }
);

/**
 * DELETE /api/v2/risks/:id - Delete risk
 */
app.delete(
  '/:id',
  async (c) => {
    try {
      const id = parseInt(c.req.param('id'));
      const organizationId = c.get('organizationId') as number || 1;
      const userId = c.get('userId') as number || 1;

      if (isNaN(id)) {
        return c.json({
          success: false,
          error: 'Invalid risk ID'
        }, 400);
      }

      // Create repository
      const repository = new D1RiskRepository(c.env.DB);

      // Create command
      const command = new DeleteRiskCommand({
        id,
        organizationId,
        deletedBy: userId
      });

      // Execute handler
      const handler = new DeleteRiskHandler(repository);
      await handler.handle(command);

      // 204 No Content - no body allowed
      return new Response(null, { status: 204 });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return c.json({
          success: false,
          error: 'Risk not found'
        }, 404);
      }

      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete risk'
      }, 400);
    }
  }
);

export default app;
