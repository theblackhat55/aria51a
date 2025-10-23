/**
 * BulkOperationSchema - Zod validation schemas for bulk operations
 * 
 * Used in bulk create, update, delete, and status change routes
 * Ensures safe batch operations with limits
 */

import { z } from 'zod';
import { CreateRiskSchema } from './CreateRiskSchema';
import { UpdateStatusSchema } from './UpdateStatusSchema';
import { RiskStatusEnum } from './CreateRiskSchema';

/**
 * Bulk Create Schema
 * 
 * Creates multiple risks in one operation
 * Limited to 50 risks per batch for performance
 */
export const BulkCreateRiskSchema = z.object({
  risks: z.array(CreateRiskSchema)
    .min(1, 'At least one risk must be provided')
    .max(50, 'Maximum 50 risks can be created at once')
});

/**
 * Bulk Delete Schema
 * 
 * Deletes multiple risks by ID
 * Limited to 100 IDs per batch
 */
export const BulkDeleteSchema = z.object({
  ids: z.array(
    z.number()
      .int('ID must be an integer')
      .positive('ID must be a positive number')
  )
    .min(1, 'At least one ID must be provided')
    .max(100, 'Maximum 100 risks can be deleted at once'),

  // Optional: User performing deletion (audit trail)
  deletedBy: z.number()
    .int('Deleted By must be an integer')
    .positive('Deleted By must be a positive number')
    .optional(),

  // Optional: Reason for deletion (audit trail)
  reason: z.string()
    .max(500, 'Reason must be 500 characters or less')
    .trim()
    .optional()
});

/**
 * Bulk Delete by Risk ID Schema
 * 
 * Deletes multiple risks by business risk ID (RISK-001, RISK-002, etc.)
 * Limited to 100 risk IDs per batch
 */
export const BulkDeleteByRiskIdSchema = z.object({
  riskIds: z.array(
    z.string()
      .min(1, 'Risk ID cannot be empty')
      .regex(/^[A-Z]+-\d+$/, 'Risk ID must be in format: PREFIX-NUMBER')
  )
    .min(1, 'At least one risk ID must be provided')
    .max(100, 'Maximum 100 risks can be deleted at once'),

  // Optional: User performing deletion (audit trail)
  deletedBy: z.number()
    .int('Deleted By must be an integer')
    .positive('Deleted By must be a positive number')
    .optional(),

  // Optional: Reason for deletion (audit trail)
  reason: z.string()
    .max(500, 'Reason must be 500 characters or less')
    .trim()
    .optional()
});

/**
 * Bulk Update Status Schema
 * 
 * Updates status for multiple risks
 * Limited to 100 IDs per batch
 */
export const BulkUpdateStatusSchema = z.object({
  ids: z.array(
    z.number()
      .int('ID must be an integer')
      .positive('ID must be a positive number')
  )
    .min(1, 'At least one ID must be provided')
    .max(100, 'Maximum 100 risks can be updated at once'),

  // Required: New status
  status: RiskStatusEnum,

  // Optional: User making the change (audit trail)
  updatedBy: z.number()
    .int('Updated By must be an integer')
    .positive('Updated By must be a positive number')
    .optional(),

  // Optional: Reason for status change (audit trail)
  reason: z.string()
    .max(500, 'Reason must be 500 characters or less')
    .trim()
    .optional()
});

/**
 * Type inferences from schemas
 */
export type BulkCreateRiskInput = z.infer<typeof BulkCreateRiskSchema>;
export type BulkDeleteInput = z.infer<typeof BulkDeleteSchema>;
export type BulkDeleteByRiskIdInput = z.infer<typeof BulkDeleteByRiskIdSchema>;
export type BulkUpdateStatusInput = z.infer<typeof BulkUpdateStatusSchema>;

/**
 * Validation functions
 */
export function validateBulkCreateRisk(data: unknown): BulkCreateRiskInput {
  return BulkCreateRiskSchema.parse(data);
}

export function validateBulkDelete(data: unknown): BulkDeleteInput {
  return BulkDeleteSchema.parse(data);
}

export function validateBulkDeleteByRiskId(data: unknown): BulkDeleteByRiskIdInput {
  return BulkDeleteByRiskIdSchema.parse(data);
}

export function validateBulkUpdateStatus(data: unknown): BulkUpdateStatusInput {
  return BulkUpdateStatusSchema.parse(data);
}

/**
 * Safe validation functions
 */
export function safeValidateBulkCreateRisk(data: unknown) {
  return BulkCreateRiskSchema.safeParse(data);
}

export function safeValidateBulkDelete(data: unknown) {
  return BulkDeleteSchema.safeParse(data);
}

export function safeValidateBulkDeleteByRiskId(data: unknown) {
  return BulkDeleteByRiskIdSchema.safeParse(data);
}

export function safeValidateBulkUpdateStatus(data: unknown) {
  return BulkUpdateStatusSchema.safeParse(data);
}
