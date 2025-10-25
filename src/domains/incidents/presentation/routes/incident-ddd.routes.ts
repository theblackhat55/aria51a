/**
 * Incident Response Domain Routes - DDD Implementation
 * 
 * RESTful API for incident response management using DDD with CQRS
 * Implements NIST SP 800-61 incident handling framework
 * 
 * Part of the Incident Response Domain (Presentation Layer).
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

// Validators
import {
  CreateIncidentSchema,
  UpdateIncidentSchema,
  ListIncidentsSchema,
  GetIncidentStatisticsSchema
} from '../validators/IncidentValidators';

import {
  CreateResponseActionSchema,
  UpdateResponseActionSchema,
  ListResponseActionsSchema
} from '../validators/ResponseActionValidators';

import {
  CreateSecurityEventSchema,
  UpdateSecurityEventSchema,
  ListSecurityEventsSchema
} from '../validators/SecurityEventValidators';

// Commands
import { CreateIncidentCommand } from '../../application/commands/CreateIncidentCommand';
import { UpdateIncidentCommand } from '../../application/commands/UpdateIncidentCommand';
import { DeleteIncidentCommand } from '../../application/commands/DeleteIncidentCommand';
import { CreateResponseActionCommand } from '../../application/commands/CreateResponseActionCommand';
import { UpdateResponseActionCommand } from '../../application/commands/UpdateResponseActionCommand';
import { CreateSecurityEventCommand } from '../../application/commands/CreateSecurityEventCommand';
import { UpdateSecurityEventCommand } from '../../application/commands/UpdateSecurityEventCommand';

// Queries
import { ListIncidentsQuery } from '../../application/queries/ListIncidentsQuery';
import { GetIncidentByIdQuery } from '../../application/queries/GetIncidentByIdQuery';
import { GetIncidentStatisticsQuery } from '../../application/queries/GetIncidentStatisticsQuery';
import { ListResponseActionsQuery } from '../../application/queries/ListResponseActionsQuery';
import { ListSecurityEventsQuery } from '../../application/queries/ListSecurityEventsQuery';

// Handlers
import { CreateIncidentHandler } from '../../application/handlers/CreateIncidentHandler';
import { UpdateIncidentHandler } from '../../application/handlers/UpdateIncidentHandler';
import { DeleteIncidentHandler } from '../../application/handlers/DeleteIncidentHandler';
import { ListIncidentsHandler } from '../../application/handlers/ListIncidentsHandler';
import { GetIncidentByIdHandler } from '../../application/handlers/GetIncidentByIdHandler';
import { GetIncidentStatisticsHandler } from '../../application/handlers/GetIncidentStatisticsHandler';
import { CreateResponseActionHandler } from '../../application/handlers/CreateResponseActionHandler';
import { ListResponseActionsHandler } from '../../application/handlers/ListResponseActionsHandler';
import { CreateSecurityEventHandler } from '../../application/handlers/CreateSecurityEventHandler';
import { ListSecurityEventsHandler } from '../../application/handlers/ListSecurityEventsHandler';

// Infrastructure
import { D1IncidentRepository } from '../../infrastructure/persistence/D1IncidentRepository';
import { D1ResponseActionRepository } from '../../infrastructure/persistence/D1ResponseActionRepository';
import { D1SecurityEventRepository } from '../../infrastructure/persistence/D1SecurityEventRepository';

// Mappers
import { IncidentMapper } from '../../application/mappers/IncidentMapper';
import { ResponseActionMapper } from '../../application/mappers/ResponseActionMapper';
import { SecurityEventMapper } from '../../application/mappers/SecurityEventMapper';

const app = new Hono<{ Bindings: { DB: D1Database }; Variables: { organizationId: number; userId: number } }>();

// =============================================
// INCIDENT ROUTES
// =============================================

/**
 * GET /incidents - List incidents with filtering
 */
app.get('/incidents', zValidator('query', ListIncidentsSchema), async (c) => {
  try {
    const params = c.req.valid('query');
    const organizationId = c.get('organizationId');

    const repository = new D1IncidentRepository(c.env.DB);
    const query = new ListIncidentsQuery({ organizationId, ...params });
    const handler = new ListIncidentsHandler(repository);
    const result = await handler.handle(query);

    return c.json({
      success: true,
      data: result.incidents.map(i => IncidentMapper.toListDTO(i)),
      meta: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        page: Math.floor(result.offset / result.limit) + 1,
        pages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (error) {
    console.error('Error in GET /incidents:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list incidents'
    }, 500);
  }
});

/**
 * GET /incidents/statistics - Get incident statistics
 */
app.get('/incidents/statistics', zValidator('query', GetIncidentStatisticsSchema), async (c) => {
  try {
    const params = c.req.valid('query');
    const organizationId = c.get('organizationId');

    const repository = new D1IncidentRepository(c.env.DB);
    const query = new GetIncidentStatisticsQuery({ organizationId, ...params });
    const handler = new GetIncidentStatisticsHandler(repository);
    const stats = await handler.handle(query);

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
});

/**
 * GET /incidents/:id - Get incident by ID
 */
app.get('/incidents/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const organizationId = c.get('organizationId');

    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid incident ID' }, 400);
    }

    const repository = new D1IncidentRepository(c.env.DB);
    const query = new GetIncidentByIdQuery({ id, organizationId });
    const handler = new GetIncidentByIdHandler(repository);
    const incident = await handler.handle(query);

    return c.json({
      success: true,
      data: IncidentMapper.toDTO(incident)
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get incident'
    }, error instanceof Error && error.message.includes('not found') ? 404 : 500);
  }
});

/**
 * POST /incidents - Create new incident
 */
app.post('/incidents', zValidator('json', CreateIncidentSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    const organizationId = c.get('organizationId');

    const repository = new D1IncidentRepository(c.env.DB);
    const command = new CreateIncidentCommand({ ...body, organizationId });
    const handler = new CreateIncidentHandler(repository);
    const incident = await handler.handle(command);

    return c.json({
      success: true,
      data: IncidentMapper.toDTO(incident)
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create incident'
    }, 500);
  }
});

/**
 * PUT /incidents/:id - Update incident
 */
app.put('/incidents/:id', zValidator('json', UpdateIncidentSchema), async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const body = c.req.valid('json');
    const organizationId = c.get('organizationId');

    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid incident ID' }, 400);
    }

    const repository = new D1IncidentRepository(c.env.DB);
    const command = new UpdateIncidentCommand({ id, ...body, organizationId });
    const handler = new UpdateIncidentHandler(repository);
    const incident = await handler.handle(command);

    return c.json({
      success: true,
      data: IncidentMapper.toDTO(incident)
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update incident'
    }, error instanceof Error && error.message.includes('not found') ? 404 : 500);
  }
});

/**
 * DELETE /incidents/:id - Delete incident
 */
app.delete('/incidents/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'));
    const organizationId = c.get('organizationId');

    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid incident ID' }, 400);
    }

    const repository = new D1IncidentRepository(c.env.DB);
    const command = new DeleteIncidentCommand({ id, organizationId });
    const handler = new DeleteIncidentHandler(repository);
    await handler.handle(command);

    return new Response(null, { status: 204 });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete incident'
    }, error instanceof Error && error.message.includes('not found') ? 404 : 500);
  }
});

// =============================================
// RESPONSE ACTION ROUTES
// =============================================

/**
 * GET /response-actions - List response actions with filtering
 */
app.get('/response-actions', zValidator('query', ListResponseActionsSchema), async (c) => {
  try {
    const params = c.req.valid('query');
    const organizationId = c.get('organizationId');

    const repository = new D1ResponseActionRepository(c.env.DB);
    const query = new ListResponseActionsQuery({ organizationId, ...params });
    const handler = new ListResponseActionsHandler(repository);
    const result = await handler.handle(query);

    return c.json({
      success: true,
      data: result.actions.map(a => ResponseActionMapper.toDTO(a)),
      meta: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        page: Math.floor(result.offset / result.limit) + 1,
        pages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list response actions'
    }, 500);
  }
});

/**
 * POST /response-actions - Create new response action
 */
app.post('/response-actions', zValidator('json', CreateResponseActionSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    const organizationId = c.get('organizationId');
    const userId = c.get('userId');

    const repository = new D1ResponseActionRepository(c.env.DB);
    const command = new CreateResponseActionCommand({
      ...body,
      performedBy: body.performedBy || userId,
      organizationId
    });
    const handler = new CreateResponseActionHandler(repository);
    const action = await handler.handle(command);

    return c.json({
      success: true,
      data: ResponseActionMapper.toDTO(action)
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create response action'
    }, 500);
  }
});

// =============================================
// SECURITY EVENT ROUTES
// =============================================

/**
 * GET /security-events - List security events with filtering
 */
app.get('/security-events', zValidator('query', ListSecurityEventsSchema), async (c) => {
  try {
    const params = c.req.valid('query');
    const organizationId = c.get('organizationId');

    const repository = new D1SecurityEventRepository(c.env.DB);
    const query = new ListSecurityEventsQuery({ organizationId, ...params });
    const handler = new ListSecurityEventsHandler(repository);
    const result = await handler.handle(query);

    return c.json({
      success: true,
      data: result.events.map(e => SecurityEventMapper.toDTO(e)),
      meta: {
        total: result.total,
        limit: result.limit,
        offset: result.offset,
        page: Math.floor(result.offset / result.limit) + 1,
        pages: Math.ceil(result.total / result.limit)
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list security events'
    }, 500);
  }
});

/**
 * POST /security-events - Create new security event
 */
app.post('/security-events', zValidator('json', CreateSecurityEventSchema), async (c) => {
  try {
    const body = c.req.valid('json');
    const organizationId = c.get('organizationId');

    const repository = new D1SecurityEventRepository(c.env.DB);
    const command = new CreateSecurityEventCommand({ ...body, organizationId });
    const handler = new CreateSecurityEventHandler(repository);
    const event = await handler.handle(command);

    return c.json({
      success: true,
      data: SecurityEventMapper.toDTO(event)
    }, 201);
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create security event'
    }, 500);
  }
});

/**
 * GET /security-events/uncorrelated - Get uncorrelated security events
 */
app.get('/security-events/uncorrelated', async (c) => {
  try {
    const organizationId = c.get('organizationId');
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 50;

    const repository = new D1SecurityEventRepository(c.env.DB);
    const events = await repository.findUncorrelated(organizationId, limit);

    return c.json({
      success: true,
      data: events.map(e => SecurityEventMapper.toDTO(e)),
      meta: {
        total: events.length,
        limit
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get uncorrelated events'
    }, 500);
  }
});

export default app;
