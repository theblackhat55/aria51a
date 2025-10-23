/**
 * Validation Middleware for Hono
 * 
 * Provides reusable middleware for Zod schema validation
 * Handles both body and query parameter validation with standardized error responses
 */

import { Context, Next } from 'hono';
import { z, ZodError } from 'zod';

/**
 * Validation error response format
 */
interface ValidationErrorResponse {
  success: false;
  error: string;
  details: Array<{
    field: string;
    message: string;
  }>;
}

/**
 * Format Zod errors into user-friendly format
 * 
 * @param error - ZodError instance
 * @returns Formatted error details
 */
function formatZodError(error: ZodError): ValidationErrorResponse {
  return {
    success: false,
    error: 'Validation failed',
    details: error.issues.map(err => ({
      field: err.path.join('.'),
      message: err.message
    }))
  };
}

/**
 * Validate request body against Zod schema
 * 
 * Usage in routes:
 * app.post('/risk-v2/create', validateBody(CreateRiskSchema), async (c) => {
 *   const data = c.get('validatedData'); // Type-safe validated data
 *   // ... handler logic
 * });
 * 
 * @param schema - Zod schema for validation
 * @returns Hono middleware function
 */
export function validateBody<T extends z.ZodType>(schema: T) {
  return async (c: Context, next: Next) => {
    try {
      const body = await c.req.json();
      const validated = schema.parse(body);
      
      // Store validated data in context
      c.set('validatedData', validated);
      
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        return c.json(formatZodError(error), 400);
      }
      
      // Handle JSON parsing errors
      return c.json({
        success: false,
        error: 'Invalid JSON in request body',
        details: []
      }, 400);
    }
  };
}

/**
 * Validate query parameters against Zod schema
 * 
 * Usage in routes:
 * app.get('/risk-v2/list', validateQuery(ListRisksQuerySchema), async (c) => {
 *   const query = c.get('validatedQuery'); // Type-safe validated query
 *   // ... handler logic
 * });
 * 
 * @param schema - Zod schema for validation
 * @returns Hono middleware function
 */
export function validateQuery<T extends z.ZodType>(schema: T) {
  return async (c: Context, next: Next) => {
    try {
      const query = c.req.query();
      
      // Convert query parameters to appropriate types
      // Query params are always strings, so we need to handle type coercion
      const validated = schema.parse(query);
      
      // Store validated query in context
      c.set('validatedQuery', validated);
      
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        return c.json(formatZodError(error), 400);
      }
      
      return c.json({
        success: false,
        error: 'Invalid query parameters',
        details: []
      }, 400);
    }
  };
}

/**
 * Validate route parameters (path params) against Zod schema
 * 
 * Usage in routes:
 * app.get('/risk-v2/:id', validateParams(z.object({ id: z.coerce.number() })), async (c) => {
 *   const params = c.get('validatedParams'); // Type-safe validated params
 *   // ... handler logic
 * });
 * 
 * @param schema - Zod schema for validation
 * @returns Hono middleware function
 */
export function validateParams<T extends z.ZodType>(schema: T) {
  return async (c: Context, next: Next) => {
    try {
      const params = c.req.param();
      const validated = schema.parse(params);
      
      // Store validated params in context
      c.set('validatedParams', validated);
      
      await next();
    } catch (error) {
      if (error instanceof ZodError) {
        return c.json(formatZodError(error), 400);
      }
      
      return c.json({
        success: false,
        error: 'Invalid route parameters',
        details: []
      }, 400);
    }
  };
}

/**
 * Common parameter schemas
 */
export const IdParamSchema = z.object({
  id: z.coerce.number()
    .int('ID must be an integer')
    .positive('ID must be a positive number')
});

export const RiskIdParamSchema = z.object({
  riskId: z.string()
    .min(1, 'Risk ID is required')
    .regex(/^[A-Z]+-\d+$/, 'Risk ID must be in format: PREFIX-NUMBER')
});

/**
 * Type helpers for validated data
 */
export type ValidatedData<T extends z.ZodType> = z.infer<T>;
