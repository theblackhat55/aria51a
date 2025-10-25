/**
 * Shared Presentation Layer
 * 
 * Exports middleware, responses, and presentation utilities
 */

// Responses
export { ApiResponse, type ApiResponseData, type ApiError, type PaginationMetadata } from './responses/ApiResponse';

// Middleware
export { authMiddleware, requireRole, requirePermission, getCurrentUser, type AuthenticatedUser } from './middleware/auth.middleware';
export { validateMiddleware, getValidatedData, type RequestPart } from './middleware/validate.middleware';
export { 
  errorMiddleware,
  HttpError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ValidationError
} from './middleware/error.middleware';
