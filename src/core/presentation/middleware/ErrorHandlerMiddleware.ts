/**
 * ErrorHandlerMiddleware - Global Error Handling
 * 
 * Catches and handles all unhandled errors in the application.
 * Provides consistent error responses and logging.
 */

import { Context, Next } from 'hono';
import { DomainException } from '../../../domain/exceptions/DomainException';
import { ValidationException } from '../../../domain/exceptions/ValidationException';
import { NotFoundException } from '../../../domain/exceptions/NotFoundException';
import { ResponseDTO } from '../../../application/dto/ResponseDTO';
import { ILogger } from '../../../application/interfaces/ILogger';

/**
 * Error handling configuration
 */
export interface ErrorHandlerConfig {
  /**
   * Logger instance for error logging
   */
  logger?: ILogger;
  
  /**
   * Whether to include stack traces in response
   * @default true in development, false in production
   */
  includeStackTrace?: boolean;
  
  /**
   * Custom error handler for specific error types
   */
  customHandlers?: Map<string, (error: Error, c: Context) => Promise<Response>>;
  
  /**
   * Whether to log errors to console
   * @default true
   */
  logToConsole?: boolean;
}

/**
 * Error handler middleware factory
 * 
 * @example
 * ```typescript
 * app.use('*', errorHandler({ 
 *   logger: myLogger,
 *   includeStackTrace: false 
 * }));
 * ```
 */
export function errorHandler(config: ErrorHandlerConfig = {}) {
  const includeStackTrace = config.includeStackTrace ?? 
    (process.env.NODE_ENV === 'development');
  const logToConsole = config.logToConsole ?? true;

  return async (c: Context, next: Next) => {
    try {
      await next();
      
      // Handle 404 Not Found
      if (c.res.status === 404) {
        return c.json(
          ResponseDTO.notFound('endpoint', c.req.path),
          404
        );
      }
      
    } catch (error) {
      // Log error
      if (logToConsole) {
        console.error('Error caught by error handler:', error);
      }
      
      if (config.logger) {
        config.logger.error('Request error', {
          error: error instanceof Error ? error.message : String(error),
          path: c.req.path,
          method: c.req.method,
          stack: error instanceof Error ? error.stack : undefined
        });
      }

      // Check for custom handler
      if (config.customHandlers && error instanceof Error) {
        const handler = config.customHandlers.get(error.constructor.name);
        if (handler) {
          return await handler(error, c);
        }
      }

      // Handle known error types
      if (error instanceof ValidationException) {
        return handleValidationError(error, c);
      }
      
      if (error instanceof NotFoundException) {
        return handleNotFoundError(error, c);
      }
      
      if (error instanceof DomainException) {
        return handleDomainError(error, c);
      }

      // Handle HTTP errors from Hono
      if (error && typeof error === 'object' && 'status' in error) {
        const httpError = error as any;
        return c.json(
          ResponseDTO.error(
            `HTTP_${httpError.status}`,
            httpError.message || 'Request failed',
            undefined,
            includeStackTrace ? httpError.stack : undefined
          ),
          httpError.status || 500
        );
      }

      // Handle generic errors
      return handleGenericError(error, c, includeStackTrace);
    }
  };
}

/**
 * Handle ValidationException
 */
function handleValidationError(error: ValidationException, c: Context): Response {
  return c.json(
    ResponseDTO.validationError(error.errors),
    400
  );
}

/**
 * Handle NotFoundException
 */
function handleNotFoundError(error: NotFoundException, c: Context): Response {
  return c.json(
    ResponseDTO.error(
      error.code,
      error.message,
      error.details
    ),
    404
  );
}

/**
 * Handle DomainException
 */
function handleDomainError(error: DomainException, c: Context): Response {
  // Determine HTTP status based on error code
  let status = 400;
  
  if (error.code.includes('UNAUTHORIZED')) status = 401;
  else if (error.code.includes('FORBIDDEN')) status = 403;
  else if (error.code.includes('NOT_FOUND')) status = 404;
  else if (error.code.includes('CONFLICT')) status = 409;
  else if (error.code.includes('VALIDATION')) status = 400;
  
  return c.json(
    ResponseDTO.error(
      error.code,
      error.message,
      error.details
    ),
    status
  );
}

/**
 * Handle generic/unknown errors
 */
function handleGenericError(
  error: unknown, 
  c: Context, 
  includeStackTrace: boolean
): Response {
  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  const stack = error instanceof Error ? error.stack : undefined;

  return c.json(
    ResponseDTO.error(
      'INTERNAL_SERVER_ERROR',
      message,
      undefined,
      includeStackTrace ? stack : undefined
    ),
    500
  );
}

/**
 * Async error wrapper for route handlers
 * 
 * Automatically catches async errors and passes them to error handler
 * 
 * @example
 * ```typescript
 * app.get('/api/users', asyncHandler(async (c) => {
 *   const users = await userService.getAll();
 *   return c.json(users);
 * }));
 * ```
 */
export function asyncHandler(
  handler: (c: Context) => Promise<Response>
) {
  return async (c: Context) => {
    try {
      return await handler(c);
    } catch (error) {
      throw error; // Will be caught by error handler middleware
    }
  };
}

/**
 * Create a custom error handler for specific error types
 * 
 * @example
 * ```typescript
 * const customHandlers = new Map();
 * customHandlers.set('DatabaseError', async (error, c) => {
 *   return c.json({ error: 'Database connection failed' }, 503);
 * });
 * ```
 */
export function createCustomErrorHandler(
  errorType: string,
  handler: (error: Error, c: Context) => Promise<Response>
): [string, (error: Error, c: Context) => Promise<Response>] {
  return [errorType, handler];
}
