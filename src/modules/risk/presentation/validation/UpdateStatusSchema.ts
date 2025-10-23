/**
 * UpdateStatusSchema - Zod validation schema for updating risk status
 * 
 * Used in PATCH /risk-v2/:id/status or PATCH /risk-v2/:riskId/status routes
 * Specifically for status transitions with audit trail
 */

import { z } from 'zod';
import { RiskStatusEnum } from './CreateRiskSchema';

/**
 * Update Status Schema
 * 
 * Requires new status and user ID
 * Optional reason for status change (audit trail)
 */
export const UpdateStatusSchema = z.object({
  // Required: New status
  status: RiskStatusEnum,

  // Required: User making the change
  updatedBy: z.number()
    .int('Updated By must be an integer')
    .positive('Updated By must be a positive number'),

  // Optional: Reason for status change (audit trail)
  reason: z.string()
    .max(500, 'Reason must be 500 characters or less')
    .trim()
    .optional(),

  // Optional: Additional context/metadata
  metadata: z.record(z.string(), z.any())
    .optional()
});

/**
 * Type inference from schema
 */
export type UpdateStatusInput = z.infer<typeof UpdateStatusSchema>;

/**
 * Parse and validate update status input
 * 
 * @param data - Raw input data
 * @returns Validated data or throws ZodError
 */
export function validateUpdateStatus(data: unknown): UpdateStatusInput {
  return UpdateStatusSchema.parse(data);
}

/**
 * Safe parse with error handling
 * 
 * @param data - Raw input data
 * @returns Success result or error details
 */
export function safeValidateUpdateStatus(data: unknown) {
  return UpdateStatusSchema.safeParse(data);
}
