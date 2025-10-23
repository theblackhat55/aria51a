/**
 * ListRisksQueryDTO - Query parameters for listing risks
 * Used for filtering, sorting, and paginating risk lists
 */

export interface ListRisksQueryDTO {
  // Pagination
  page?: number; // Default: 1
  limit?: number; // Default: 20, Max: 100
  
  // Filters
  status?: string | string[]; // Single or multiple statuses
  category?: string | string[]; // Single or multiple categories
  riskLevel?: 'low' | 'medium' | 'high' | 'critical' | string[]; // Single or multiple levels
  ownerId?: number;
  organizationId?: number;
  
  // Score range
  minScore?: number;
  maxScore?: number;
  
  // Search
  search?: string; // Search in title/description
  tags?: string | string[]; // Filter by tags
  
  // Date filters
  createdAfter?: string; // ISO date string
  createdBefore?: string; // ISO date string
  updatedAfter?: string; // ISO date string
  updatedBefore?: string; // ISO date string
  
  // Boolean filters
  reviewOverdue?: boolean; // Only risks with overdue reviews
  needsAttention?: boolean; // Only critical active risks
  activeOnly?: boolean; // Only active risks
  criticalOnly?: boolean; // Only critical risks (score >= 20)
  
  // Sorting
  sortBy?: 'score' | 'createdAt' | 'updatedAt' | 'title' | 'status';
  sortOrder?: 'asc' | 'desc';
  
  // Include related data
  includeOwner?: boolean; // Include owner details
  includeCreator?: boolean; // Include creator details
}

/**
 * Default values for list query
 */
export const ListRisksQueryDefaults = {
  page: 1,
  limit: 20,
  maxLimit: 100,
  sortBy: 'createdAt' as const,
  sortOrder: 'desc' as const
};

/**
 * Validation rules for ListRisksQueryDTO
 */
export const ListRisksQueryValidation = {
  page: {
    type: 'number',
    min: 1,
    message: 'Page must be a positive number'
  },
  limit: {
    type: 'number',
    min: 1,
    max: 100,
    message: 'Limit must be between 1 and 100'
  },
  status: {
    enum: ['active', 'mitigated', 'accepted', 'transferred', 'avoided', 'closed', 'monitoring'],
    message: 'Status must be a valid risk status'
  },
  category: {
    enum: [
      'strategic', 'operational', 'financial', 'compliance', 'reputational',
      'technology', 'cybersecurity', 'environmental', 'legal', 'human_resources',
      'supply_chain', 'market', 'credit', 'liquidity', 'other'
    ],
    message: 'Category must be a valid risk category'
  },
  riskLevel: {
    enum: ['low', 'medium', 'high', 'critical'],
    message: 'Risk level must be: low, medium, high, or critical'
  },
  minScore: {
    type: 'number',
    min: 1,
    max: 25,
    message: 'Min score must be between 1 and 25'
  },
  maxScore: {
    type: 'number',
    min: 1,
    max: 25,
    message: 'Max score must be between 1 and 25'
  },
  sortBy: {
    enum: ['score', 'createdAt', 'updatedAt', 'title', 'status'],
    message: 'Sort by must be: score, createdAt, updatedAt, title, or status'
  },
  sortOrder: {
    enum: ['asc', 'desc'],
    message: 'Sort order must be: asc or desc'
  }
};
