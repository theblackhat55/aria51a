/**
 * Standard API Response
 * 
 * Provides a consistent response structure for all API endpoints
 */

export interface ApiResponseData<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: ApiError[];
  metadata?: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

export interface ResponseMetadata {
  timestamp: string;
  requestId?: string;
  pagination?: PaginationMetadata;
  [key: string]: any;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export class ApiResponse {
  /**
   * Create a success response
   */
  public static success<T>(
    data: T,
    message?: string,
    metadata?: ResponseMetadata
  ): ApiResponseData<T> {
    return {
      success: true,
      message,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }

  /**
   * Create an error response
   */
  public static error(
    message: string,
    errors?: ApiError[],
    metadata?: ResponseMetadata
  ): ApiResponseData {
    return {
      success: false,
      message,
      errors,
      metadata: {
        timestamp: new Date().toISOString(),
        ...metadata
      }
    };
  }

  /**
   * Create a paginated response
   */
  public static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ): ApiResponseData<T[]> {
    const totalPages = Math.ceil(total / limit);
    
    return {
      success: true,
      message,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrevious: page > 1
        }
      }
    };
  }

  /**
   * Create a validation error response
   */
  public static validationError(
    errors: ApiError[],
    message: string = 'Validation failed'
  ): ApiResponseData {
    return ApiResponse.error(message, errors);
  }

  /**
   * Create an unauthorized response
   */
  public static unauthorized(message: string = 'Unauthorized'): ApiResponseData {
    return ApiResponse.error(message, [{
      code: 'UNAUTHORIZED',
      message
    }]);
  }

  /**
   * Create a forbidden response
   */
  public static forbidden(message: string = 'Forbidden'): ApiResponseData {
    return ApiResponse.error(message, [{
      code: 'FORBIDDEN',
      message
    }]);
  }

  /**
   * Create a not found response
   */
  public static notFound(
    resource: string = 'Resource',
    id?: string | number
  ): ApiResponseData {
    const message = id
      ? `${resource} with ID ${id} not found`
      : `${resource} not found`;
    
    return ApiResponse.error(message, [{
      code: 'NOT_FOUND',
      message
    }]);
  }

  /**
   * Create a server error response
   */
  public static serverError(
    message: string = 'Internal server error'
  ): ApiResponseData {
    return ApiResponse.error(message, [{
      code: 'INTERNAL_ERROR',
      message
    }]);
  }
}
