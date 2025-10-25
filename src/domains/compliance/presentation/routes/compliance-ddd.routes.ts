/**
 * Compliance Domain Routes - DDD Implementation
 * 
 * RESTful API for compliance framework management using DDD with CQRS
 */

import { Hono } from 'hono';

// Validators
import { ListFrameworksSchema } from '../validators/ListFrameworksValidator';

// Queries
import { ListFrameworksQuery } from '../../application/queries/ListFrameworksQuery';

// Handlers
import { ListFrameworksHandler } from '../../application/handlers/ListFrameworksHandler';

// Infrastructure
import { D1ComplianceFrameworkRepository } from '../../infrastructure/persistence/D1ComplianceFrameworkRepository';

const app = new Hono<{ Bindings: { DB: D1Database } }>();

/**
 * GET /api/v2/compliance/frameworks - List compliance frameworks with filters
 */
app.get(
  '/frameworks',
  async (c) => {
    try {
      // Parse query parameters
      const queryParams = c.req.query();
      
      // Validate query parameters
      const validation = ListFrameworksSchema.safeParse({
        limit: queryParams.limit ? parseInt(queryParams.limit) : undefined,
        offset: queryParams.offset ? parseInt(queryParams.offset) : undefined,
        type: queryParams.type,
        isActive: queryParams.isActive === 'true' ? true : queryParams.isActive === 'false' ? false : undefined,
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
      const repository = new D1ComplianceFrameworkRepository(c.env.DB);

      // Create query
      const query = new ListFrameworksQuery({
        organizationId,
        ...params
      });

      // Execute handler
      const handler = new ListFrameworksHandler(repository);
      const result = await handler.handle(query);

      return c.json({
        success: true,
        data: result.frameworks,
        meta: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          page: Math.floor(result.offset / result.limit) + 1,
          pages: Math.ceil(result.total / result.limit)
        }
      });
    } catch (error) {
      console.error('Error in GET /api/v2/compliance/frameworks:', error);
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list frameworks',
        stack: error instanceof Error ? error.stack : undefined
      }, 500);
    }
  }
);

/**
 * GET /api/v2/compliance/frameworks/statistics - Get framework statistics
 */
app.get(
  '/frameworks/statistics',
  async (c) => {
    try {
      const organizationId = c.get('organizationId') as number || 1;

      // Create repository
      const repository = new D1ComplianceFrameworkRepository(c.env.DB);

      // Get statistics
      const stats = await repository.getStatistics(organizationId);

      return c.json({
        success: true,
        data: stats
      });
    } catch (error) {
      return c.json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get statistics'
      }, 500);
    }
  }
);

export default app;
