/**
 * Error Handling Middleware
 * 
 * Catches errors and returns consistent error responses
 */

import { Context, Next } from 'hono';
import { ApiResponse } from '../responses/ApiResponse';

export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class NotFoundError extends HttpError {
  constructor(resource: string = 'Resource', id?: string | number) {
    const message = id
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;
    super(404, message, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends HttpError {
  constructor(message: string = 'Validation failed', details?: Record<string, any>) {
    super(400, message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Global error handling middleware
 */
export async function errorMiddleware(c: Context, next: Next) {
  try {
    await next();
  } catch (error) {
    console.error('Error caught by middleware:', error);

    // Handle known HTTP errors
    if (error instanceof HttpError) {
      return c.json(
        ApiResponse.error(error.message, [{
          code: error.code || 'ERROR',
          message: error.message,
          details: error.details
        }]),
        error.statusCode
      );
    }

    // Handle unknown errors
    const message = error instanceof Error ? error.message : 'Internal server error';
    return c.json(
      ApiResponse.serverError(message),
      500
    );
  }
}
