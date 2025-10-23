/**
 * CreateRiskSchema - Zod validation schema for creating a new risk
 * 
 * Maps to CreateRiskDTO with strict runtime validation
 * Used in POST /risk-v2/create route
 */

import { z } from 'zod';

/**
 * Risk categories enum
 */
export const RiskCategoryEnum = z.enum([
  'strategic',
  'operational',
  'financial',
  'compliance',
  'reputational',
  'technology',
  'cybersecurity',
  'environmental',
  'legal',
  'human_resources',
  'supply_chain',
  'market',
  'credit',
  'liquidity',
  'other'
]);

/**
 * Risk status enum
 */
export const RiskStatusEnum = z.enum([
  'active',
  'mitigated',
  'accepted',
  'transferred',
  'avoided',
  'closed',
  'monitoring'
]);

/**
 * Risk type enum
 */
export const RiskTypeEnum = z.enum([
  'business',
  'technical',
  'strategic',
  'operational',
  'compliance'
]);

/**
 * Risk ID format validation
 * Format: PREFIX-NUMBER (e.g., RISK-001, RISK-1234)
 */
const riskIdRegex = /^[A-Z]+-\d+$/;

/**
 * Create Risk Schema
 * 
 * All required fields must be provided
 * Optional fields have sensible defaults or can be omitted
 */
export const CreateRiskSchema = z.object({
  // Required: Business identifier
  riskId: z.string()
    .min(1, 'Risk ID is required')
    .regex(riskIdRegex, 'Risk ID must be in format: PREFIX-NUMBER (e.g., RISK-001)')
    .toUpperCase(),

  // Required: Title
  title: z.string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .trim(),

  // Required: Description
  description: z.string()
    .min(1, 'Description is required')
    .max(2000, 'Description must be 2000 characters or less')
    .trim(),

  // Required: Category
  category: RiskCategoryEnum,

  // Required: Probability (1-5)
  probability: z.number()
    .int('Probability must be an integer')
    .min(1, 'Probability must be at least 1')
    .max(5, 'Probability must be at most 5'),

  // Required: Impact (1-5)
  impact: z.number()
    .int('Impact must be an integer')
    .min(1, 'Impact must be at least 1')
    .max(5, 'Impact must be at most 5'),

  // Required: Organization ID
  organizationId: z.number()
    .int('Organization ID must be an integer')
    .positive('Organization ID must be a positive number'),

  // Required: Owner ID
  ownerId: z.number()
    .int('Owner ID must be an integer')
    .positive('Owner ID must be a positive number'),

  // Required: Created By
  createdBy: z.number()
    .int('Created By must be an integer')
    .positive('Created By must be a positive number'),

  // Optional: Risk Type (defaults to 'business')
  riskType: RiskTypeEnum.optional().default('business'),

  // Optional: Status (defaults to 'active')
  status: RiskStatusEnum.optional().default('active'),

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
    .or(z.string().date('Review date must be a valid date')),

  // Optional: Tags (array of strings)
  tags: z.array(z.string().trim().min(1))
    .max(20, 'Maximum 20 tags allowed')
    .optional()
    .default([]),

  // Optional: Metadata (flexible key-value pairs)
  metadata: z.record(z.string(), z.any())
    .optional()
    .default({})
});

/**
 * Type inference from schema
 */
export type CreateRiskInput = z.infer<typeof CreateRiskSchema>;

/**
 * Parse and validate create risk input
 * 
 * @param data - Raw input data
 * @returns Validated data or throws ZodError
 */
export function validateCreateRisk(data: unknown): CreateRiskInput {
  return CreateRiskSchema.parse(data);
}

/**
 * Safe parse with error handling
 * 
 * @param data - Raw input data
 * @returns Success result or error details
 */
export function safeValidateCreateRisk(data: unknown) {
  return CreateRiskSchema.safeParse(data);
}
