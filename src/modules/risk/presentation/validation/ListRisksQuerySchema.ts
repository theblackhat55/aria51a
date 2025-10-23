/**
 * ListRisksQuerySchema - Zod validation schema for list/query parameters
 * 
 * Maps to ListRisksQueryDTO with strict validation
 * Used in GET /risk-v2/list route
 */

import { z } from 'zod';
import { RiskCategoryEnum, RiskStatusEnum } from './CreateRiskSchema';

/**
 * Risk level enum
 */
export const RiskLevelEnum = z.enum(['low', 'medium', 'high', 'critical']);

/**
 * Sort field enum
 */
export const SortFieldEnum = z.enum(['score', 'createdAt', 'updatedAt', 'title', 'status']);

/**
 * Sort order enum
 */
export const SortOrderEnum = z.enum(['asc', 'desc']);

/**
 * List Risks Query Schema
 * 
 * All fields are optional with sensible defaults
 * Supports pagination, filtering, sorting, and search
 */
export const ListRisksQuerySchema = z.object({
  // Pagination
  page: z.coerce.number()
    .int('Page must be an integer')
    .positive('Page must be a positive number')
    .optional()
    .default(1),

  limit: z.coerce.number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(100, 'Limit must be at most 100')
    .optional()
    .default(20),

  // Filters: Status (single or multiple)
  status: z.union([
    RiskStatusEnum,
    z.array(RiskStatusEnum)
  ]).optional(),

  // Filters: Category (single or multiple)
  category: z.union([
    RiskCategoryEnum,
    z.array(RiskCategoryEnum)
  ]).optional(),

  // Filters: Risk Level (single or multiple)
  riskLevel: z.union([
    RiskLevelEnum,
    z.array(RiskLevelEnum)
  ]).optional(),

  // Filters: Owner ID
  ownerId: z.coerce.number()
    .int('Owner ID must be an integer')
    .positive('Owner ID must be a positive number')
    .optional(),

  // Filters: Organization ID
  organizationId: z.coerce.number()
    .int('Organization ID must be an integer')
    .positive('Organization ID must be a positive number')
    .optional(),

  // Score Range Filters
  minScore: z.coerce.number()
    .int('Min score must be an integer')
    .min(1, 'Min score must be at least 1')
    .max(25, 'Min score must be at most 25')
    .optional(),

  maxScore: z.coerce.number()
    .int('Max score must be an integer')
    .min(1, 'Max score must be at least 1')
    .max(25, 'Max score must be at most 25')
    .optional(),

  // Search
  search: z.string()
    .trim()
    .max(200, 'Search query must be 200 characters or less')
    .optional(),

  // Tags Filter (single or multiple)
  tags: z.union([
    z.string(),
    z.array(z.string())
  ]).optional(),

  // Date Filters (ISO 8601 strings)
  createdAfter: z.string()
    .datetime({ message: 'Created after must be a valid ISO 8601 datetime' })
    .optional()
    .or(z.string().date('Created after must be a valid date')),

  createdBefore: z.string()
    .datetime({ message: 'Created before must be a valid ISO 8601 datetime' })
    .optional()
    .or(z.string().date('Created before must be a valid date')),

  updatedAfter: z.string()
    .datetime({ message: 'Updated after must be a valid ISO 8601 datetime' })
    .optional()
    .or(z.string().date('Updated after must be a valid date')),

  updatedBefore: z.string()
    .datetime({ message: 'Updated before must be a valid ISO 8601 datetime' })
    .optional()
    .or(z.string().date('Updated before must be a valid date')),

  // Boolean Filters
  reviewOverdue: z.coerce.boolean().optional(),
  needsAttention: z.coerce.boolean().optional(),
  activeOnly: z.coerce.boolean().optional(),
  criticalOnly: z.coerce.boolean().optional(),

  // Sorting
  sortBy: SortFieldEnum.optional().default('createdAt'),
  sortOrder: SortOrderEnum.optional().default('desc'),

  // Include Related Data
  includeOwner: z.coerce.boolean().optional().default(false),
  includeCreator: z.coerce.boolean().optional().default(false)
}).refine(
  (data) => {
    // Validate that minScore <= maxScore if both provided
    if (data.minScore !== undefined && data.maxScore !== undefined) {
      return data.minScore <= data.maxScore;
    }
    return true;
  },
  { message: 'Min score must be less than or equal to max score' }
).refine(
  (data) => {
    // Validate that createdAfter <= createdBefore if both provided
    if (data.createdAfter && data.createdBefore) {
      return new Date(data.createdAfter) <= new Date(data.createdBefore);
    }
    return true;
  },
  { message: 'Created after must be before or equal to created before' }
).refine(
  (data) => {
    // Validate that updatedAfter <= updatedBefore if both provided
    if (data.updatedAfter && data.updatedBefore) {
      return new Date(data.updatedAfter) <= new Date(data.updatedBefore);
    }
    return true;
  },
  { message: 'Updated after must be before or equal to updated before' }
);

/**
 * Type inference from schema
 */
export type ListRisksQueryInput = z.infer<typeof ListRisksQuerySchema>;

/**
 * Parse and validate list risks query
 * 
 * @param data - Raw query parameters
 * @returns Validated data or throws ZodError
 */
export function validateListRisksQuery(data: unknown): ListRisksQueryInput {
  return ListRisksQuerySchema.parse(data);
}

/**
 * Safe parse with error handling
 * 
 * @param data - Raw query parameters
 * @returns Success result or error details
 */
export function safeValidateListRisksQuery(data: unknown) {
  return ListRisksQuerySchema.safeParse(data);
}
