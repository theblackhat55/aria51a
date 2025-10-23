/**
 * RiskResponseDTO - Data Transfer Object for risk responses
 * Used to return risk data from API endpoints
 */

export interface RiskResponseDTO {
  // Identifiers
  id: number;
  riskId: string;
  
  // Core fields
  title: string;
  description: string;
  
  // Category
  category: string;
  categoryDisplay: string;
  categoryIcon: string;
  
  // Score
  probability: number;
  impact: number;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  
  // Status
  status: string;
  statusDisplay: string;
  
  // Ownership
  organizationId: number;
  ownerId: number;
  ownerName?: string; // Joined from users table
  createdBy: number;
  createdByName?: string; // Joined from users table
  
  // Risk type
  riskType: string;
  
  // Plans
  mitigationPlan?: string;
  contingencyPlan?: string;
  
  // Review
  reviewDate?: string; // ISO date string
  lastReviewDate?: string; // ISO date string
  isReviewOverdue?: boolean;
  
  // Tags & metadata
  tags: string[];
  metadata?: Record<string, any>;
  
  // Computed properties
  isActive: boolean;
  isCritical: boolean;
  needsImmediateAttention: boolean;
  
  // Timestamps
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/**
 * Minimal risk response (for list views)
 */
export interface RiskListItemDTO {
  id: number;
  riskId: string;
  title: string;
  category: string;
  categoryIcon: string;
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  statusDisplay: string;
  ownerId: number;
  ownerName?: string;
  isActive: boolean;
  isCritical: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Statistics response DTO
 */
export interface RiskStatisticsDTO {
  total: number;
  byStatus: Record<string, number>;
  byLevel: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  byCategory: Record<string, number>;
  averageScore: number;
  activeCount: number;
  closedCount: number;
  reviewOverdueCount: number;
}

/**
 * Paginated risk list response
 */
export interface PaginatedRiskListDTO {
  items: RiskListItemDTO[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Risk deletion response
 */
export interface RiskDeletedDTO {
  id: number;
  riskId: string;
  title: string;
  deleted: boolean;
  deletedAt: string;
  message?: string;
}

/**
 * Bulk operation response
 */
export interface BulkOperationResultDTO {
  success: number;
  failed: number;
  errors: Array<{
    id: number;
    riskId: string;
    error: string;
  }>;
}
