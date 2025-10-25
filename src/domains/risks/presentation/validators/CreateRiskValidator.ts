/**
 * CreateRiskValidator - Zod schema for risk creation
 */

import { z } from 'zod';

export const CreateRiskSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must not exceed 200 characters'),
  
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  
  category: z.string()
    .min(1, 'Category is required'),
  
  subcategory: z.string().optional(),
  
  probability: z.number()
    .int('Probability must be an integer')
    .min(1, 'Probability must be between 1 and 5')
    .max(5, 'Probability must be between 1 and 5'),
  
  impact: z.number()
    .int('Impact must be an integer')
    .min(1, 'Impact must be between 1 and 5')
    .max(5, 'Impact must be between 1 and 5'),
  
  ownerId: z.number()
    .int()
    .positive('Owner ID must be positive'),
  
  source: z.string().optional(),
  
  affectedAssets: z.string().optional(),
  
  reviewDate: z.string().datetime().optional()
    .or(z.date().optional()),
  
  dueDate: z.string().datetime().optional()
    .or(z.date().optional())
});

export type CreateRiskInput = z.infer<typeof CreateRiskSchema>;
