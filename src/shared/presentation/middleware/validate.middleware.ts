/**
 * Validation Middleware
 * 
 * Validates request bodies against Zod schemas
 */

import { Context, Next } from 'hono';
import { z, ZodSchema } from 'zod';
import { ApiResponse } from '../responses/ApiResponse';

export type RequestPart = 'body' | 'query' | 'params';

/**
 * Create a validation middleware for a specific schema
 */
export function validateMiddleware(schema: ZodSchema, part: RequestPart = 'body') {
  return async (c: Context, next: Next) => {
    try {
      let data: any;

      switch (part) {
        case 'body':
          data = await c.req.json();
          break;
        case 'query':
          data = c.req.query();
          break;
        case 'params':
          data = c.req.param();
          break;
      }

      // Validate against schema
      const validated = schema.parse(data);

      // Store validated data in context
      c.set(`validated${capitalize(part)}`, validated);

      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          code: 'VALIDATION_ERROR',
          message: err.message,
          field: err.path.join('.'),
          details: {
            code: err.code,
            expected: (err as any).expected,
            received: (err as any).received
          }
        }));

        return c.json(
          ApiResponse.validationError(errors),
          400
        );
      }

      // Unknown error
      console.error('Validation middleware error:', error);
      return c.json(
        ApiResponse.serverError('Validation failed'),
        500
      );
    }
  };
}

/**
 * Helper to capitalize first letter
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Get validated data from context
 */
export function getValidatedData<T>(c: Context, part: RequestPart = 'body'): T {
  return c.get(`validated${capitalize(part)}`);
}
