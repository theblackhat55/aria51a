/**
 * ResponseAction Validators
 * 
 * Zod schemas for validating response action-related API requests.
 * 
 * Part of the Incident Response Domain (Presentation Layer).
 */

import { z } from 'zod';

// Enums
const ResponseTypeEnum = z.enum(['isolate', 'contain', 'eradicate', 'recover', 'investigate', 'analyze', 'document', 'notify', 'monitor', 'remediate']);
const ActionStatusEnum = z.enum(['pending', 'in_progress', 'completed', 'failed', 'cancelled']);

// Create ResponseAction Schema
export const CreateResponseActionSchema = z.object({
  incidentId: z.number().int().positive(),
  actionType: ResponseTypeEnum,
  description: z.string().min(1),
  performedBy: z.number().int().positive().optional(),
  performedAt: z.string().datetime().optional(),
  status: ActionStatusEnum.optional(),
  outcome: z.string().optional(),
  evidenceUrls: z.array(z.string().url()).optional(),
  durationMinutes: z.number().int().positive().optional(),
  cost: z.number().positive().optional(),
  toolsUsed: z.array(z.string()).optional(),
  affectedSystems: z.array(z.string()).optional(),
  notes: z.string().optional()
});

// Update ResponseAction Schema
export const UpdateResponseActionSchema = z.object({
  actionType: ResponseTypeEnum.optional(),
  description: z.string().min(1).optional(),
  status: ActionStatusEnum.optional(),
  outcome: z.string().optional(),
  evidenceUrls: z.array(z.string().url()).optional(),
  durationMinutes: z.number().int().positive().optional(),
  cost: z.number().positive().optional(),
  toolsUsed: z.array(z.string()).optional(),
  affectedSystems: z.array(z.string()).optional(),
  notes: z.string().optional(),
  reviewedBy: z.number().int().positive().optional(),
  reviewedAt: z.string().datetime().optional(),
  reviewComments: z.string().optional()
});

// List ResponseActions Schema
export const ListResponseActionsSchema = z.object({
  incidentId: z.coerce.number().int().positive().optional(),
  actionType: ResponseTypeEnum.optional(),
  status: ActionStatusEnum.optional(),
  performedBy: z.coerce.number().int().positive().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(100).default(10),
  offset: z.coerce.number().int().nonnegative().default(0),
  sortBy: z.enum(['performed_at', 'action_type', 'status', 'duration_minutes']).default('performed_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});
