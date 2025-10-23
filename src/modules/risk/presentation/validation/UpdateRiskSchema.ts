/**
 * UpdateRiskSchema - Zod validation schema for updating an existing risk
 * 
 * Maps to UpdateRiskDTO with partial validation
 * All fields are optional (partial update)
 * Used in PUT/PATCH /risk-v2/:id or /risk-v2/:riskId routes
 */

import { z } from 'zod';
import { RiskCategoryEnum, RiskStatusEnum, RiskTypeEnum } from './CreateRiskSchema';

/**
 * Update Risk Schema
 * 
 * All fields are optional for partial updates
 * At least one field must be provided
 */
export const UpdateRiskSchema = z.object({
  // Optional: Title
  title: z.string()
    .min(1, 'Title cannot be empty if provided')
    .max(200, 'Title must be 200 characters or less')
    .trim()
    .optional(),

  // Optional: Description
  description: z.string()
    .min(1, 'Description cannot be empty if provided')
    .max(2000, 'Description must be 2000 characters or less')
    .trim()
    .optional(),

  // Optional: Category
  category: RiskCategoryEnum.optional(),

  // Optional: Probability (1-5)
  probability: z.number()
    .int('Probability must be an integer')
    .min(1, 'Probability must be at least 1')
    .max(5, 'Probability must be at most 5')
    .optional(),

  // Optional: Impact (1-5)
  impact: z.number()
    .int('Impact must be an integer')
    .min(1, 'Impact must be at least 1')
    .max(5, 'Impact must be at most 5')
    .optional(),

  // Optional: Status
  status: RiskStatusEnum.optional(),

  // Optional: Owner ID
  ownerId: z.number()
    .int('Owner ID must be an integer')
    .positive('Owner ID must be a positive number')
    .optional(),

  // Optional: Risk Type
  riskType: RiskTypeEnum.optional(),

  // Optional: Mitigation Plan
  mitigationPlan: z.string()
    .max(5000, 'Mitigation plan must be 5000 characters or less')
    .trim()
    .optional(),

  // Optional: Contingency Plan
  contingencyPlan: z.string()
    .max(5000, 'Contingency plan must be 5000 characters or less')
    .trim()
    .optional(),

  // Optional: Review Date (ISO 8601 date string)
  reviewDate: z.string()
    .datetime({ message: 'Review date must be a valid ISO 8601 datetime' })
    .optional()
    .or(z.string().date('Review date must be a valid date'))
    .nullable(),

  // Optional: Tags (array of strings)
  tags: z.array(z.string().trim().min(1))
    .max(20, 'Maximum 20 tags allowed')
    .optional(),

  // Optional: Metadata (flexible key-value pairs)
  metadata: z.record(z.string(), z.any())
    .optional(),

  // Optional: Updated By (for audit trail)
  updatedBy: z.number()
    .int('Updated By must be an integer')
    .positive('Updated By must be a positive number')
    .optional(),

  // Optional: Update Reason (for audit trail)
  updateReason: z.string()
    .max(500, 'Update reason must be 500 characters or less')
    .trim()
    .optional()
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field must be provided for update' }
);

/**
 * Type inference from schema
 */
export type UpdateRiskInput = z.infer<typeof UpdateRiskSchema>;

/**
 * Parse and validate update risk input
 * 
 * @param data - Raw input data
 * @returns Validated data or throws ZodError
 */
export function validateUpdateRisk(data: unknown): UpdateRiskInput {
  return UpdateRiskSchema.parse(data);
}

/**
 * Safe parse with error handling
 * 
 * @param data - Raw input data
 * @returns Success result or error details
 */
export function safeValidateUpdateRisk(data: unknown) {
  return UpdateRiskSchema.safeParse(data);
}
