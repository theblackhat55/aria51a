/**
 * ResponseDTO - Standardized API response structure
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ErrorDetail;
  meta?: ResponseMeta;
  timestamp: string;
}

export interface ErrorDetail {
  code: string;
  message: string;
  details?: any;
  stack?: string;
}

export interface ResponseMeta {
  requestId?: string;
  version?: string;
  [key: string]: any;
}

export class ResponseDTO {
  /**
   * Create success response
   */
  static success<T>(data: T, meta?: ResponseMeta): ApiResponse<T> {
    return {
      success: true,
      data,
      meta,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create error response
   */
  static error(
    code: string,
    message: string,
    details?: any,
    stack?: string
  ): ApiResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details,
        stack: process.env.NODE_ENV === 'development' ? stack : undefined
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Create validation error response
   */
  static validationError(errors: any[]): ApiResponse {
    return ResponseDTO.error(
      'VALIDATION_ERROR',
      'Validation failed',
      { errors }
    );
  }

  /**
   * Create not found error response
   */
  static notFound(resource: string, id: string | number): ApiResponse {
    return ResponseDTO.error(
      'NOT_FOUND',
      `${resource} with ID '${id}' not found`
    );
  }

  /**
   * Create unauthorized error response
   */
  static unauthorized(message: string = 'Unauthorized'): ApiResponse {
    return ResponseDTO.error('UNAUTHORIZED', message);
  }

  /**
   * Create forbidden error response
   */
  static forbidden(message: string = 'Forbidden'): ApiResponse {
    return ResponseDTO.error('FORBIDDEN', message);
  }
}
