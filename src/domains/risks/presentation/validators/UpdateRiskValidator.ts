/**
 * UpdateRiskValidator - Zod schema for risk updates
 */

import { z } from 'zod';

export const UpdateRiskSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters')
    .optional(),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must not exceed 2000 characters')
    .optional(),
  
  category: z.string().optional(),
  
  subcategory: z.string().optional(),
  
  probability: z.number()
    .int('Probability must be an integer')
    .min(1, 'Probability must be between 1 and 5')
    .max(5, 'Probability must be between 1 and 5')
    .optional(),
  
  impact: z.number()
    .int('Impact must be an integer')
    .min(1, 'Impact must be between 1 and 5')
    .max(5, 'Impact must be between 1 and 5')
    .optional(),
  
  ownerId: z.number()
    .int()
    .positive('Owner ID must be positive')
    .optional(),
  
  source: z.string().optional(),
  
  affectedAssets: z.string().optional(),
  
  reviewDate: z.string().datetime().optional()
    .or(z.date().optional()),
  
  dueDate: z.string().datetime().optional()
    .or(z.date().optional())
});

export type UpdateRiskInput = z.infer<typeof UpdateRiskSchema>;
