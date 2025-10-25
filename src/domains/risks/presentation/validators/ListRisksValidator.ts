/**
 * ListRisksValidator - Zod schema for listing risks with filters
 */

import { z } from 'zod';
import { RiskStatus } from '../../core/value-objects/RiskStatus';

export const ListRisksSchema = z.object({
  status: z.nativeEnum(RiskStatus).optional(),
  
  category: z.string().optional(),
  
  ownerId: z.number().int().positive().optional(),
  
  searchQuery: z.string().optional(),
  
  limit: z.number()
    .int()
    .positive()
    .max(100, 'Limit cannot exceed 100')
    .default(50)
    .optional(),
  
  offset: z.number()
    .int()
    .min(0)
    .default(0)
    .optional(),
  
  sortBy: z.enum(['created_at', 'updated_at', 'risk_score', 'title'])
    .default('created_at')
    .optional(),
  
  sortOrder: z.enum(['asc', 'desc'])
    .default('desc')
    .optional()
});

export type ListRisksInput = z.infer<typeof ListRisksSchema>;
