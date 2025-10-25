/**
 * ListFrameworksValidator - Zod schema for listing frameworks
 */

import { z } from 'zod';
import { FrameworkType } from '../../core/value-objects/FrameworkType';

export const ListFrameworksSchema = z.object({
  type: z.nativeEnum(FrameworkType).optional(),
  
  isActive: z.boolean().optional(),
  
  limit: z.number()
    .int()
    .positive()
    .max(100)
    .default(50)
    .optional(),
  
  offset: z.number()
    .int()
    .min(0)
    .default(0)
    .optional(),
  
  sortBy: z.enum(['name', 'created_at', 'completion_percentage'])
    .default('created_at')
    .optional(),
  
  sortOrder: z.enum(['asc', 'desc'])
    .default('desc')
    .optional()
});

export type ListFrameworksInput = z.infer<typeof ListFrameworksSchema>;
