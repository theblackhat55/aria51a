/**
 * IRiskRepository - Repository interface for Risk aggregate
 * Defines the contract for risk data access operations
 */

import { Risk } from '../entities/Risk';
import { RiskStatus } from '../value-objects/RiskStatus';
import { RiskCategory } from '../value-objects/RiskCategory';

/**
 * Filter options for listing risks
 */
export interface RiskListFilters {
  status?: string | string[];
  category?: string | string[];
  ownerId?: number;
  organizationId?: number;
  minScore?: number;
  maxScore?: number;
  riskLevel?: string | string[]; // 'low', 'medium', 'high', 'critical'
  search?: string; // Search in title/description
  tags?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  reviewOverdue?: boolean;
}

/**
 * Sort options for listing risks
 */
export interface RiskListSort {
  field: 'score' | 'createdAt' | 'updatedAt' | 'title' | 'status';
  order: 'asc' | 'desc';
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page: number;
  limit: number;
}

/**
 * Paginated result
 */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

/**
 * Risk statistics result
 */
export interface RiskStatistics {
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
 * Repository interface for Risk aggregate
 */
export interface IRiskRepository {
  /**
   * Save a new or existing risk
   * If risk.id is 0, create new; otherwise update existing
   */
  save(risk: Risk): Promise<Risk>;

  /**
   * Find risk by database ID
   */
  findById(id: number): Promise<Risk | null>;

  /**
   * Find risk by business identifier (riskId)
   */
  findByRiskId(riskId: string): Promise<Risk | null>;

  /**
   * Find multiple risks by IDs
   */
  findByIds(ids: number[]): Promise<Risk[]>;

  /**
   * List risks with filters, sorting, and pagination
   */
  list(
    filters?: RiskListFilters,
    sort?: RiskListSort,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Risk>>;

  /**
   * Find all risks (use with caution - prefer list() with pagination)
   */
  findAll(): Promise<Risk[]>;

  /**
   * Find risks by owner
   */
  findByOwner(ownerId: number): Promise<Risk[]>;

  /**
   * Find risks by organization
   */
  findByOrganization(organizationId: number): Promise<Risk[]>;

  /**
   * Find risks by status
   */
  findByStatus(status: RiskStatus): Promise<Risk[]>;

  /**
   * Find risks by category
   */
  findByCategory(category: RiskCategory): Promise<Risk[]>;

  /**
   * Find critical risks (score >= 20)
   */
  findCriticalRisks(organizationId?: number): Promise<Risk[]>;

  /**
   * Find active risks that need immediate attention
   */
  findNeedingAttention(organizationId?: number): Promise<Risk[]>;

  /**
   * Find risks with overdue reviews
   */
  findOverdueReviews(organizationId?: number): Promise<Risk[]>;

  /**
   * Search risks by text (title, description)
   */
  search(query: string, organizationId?: number): Promise<Risk[]>;

  /**
   * Get risk statistics
   */
  getStatistics(organizationId?: number): Promise<RiskStatistics>;

  /**
   * Check if risk with given riskId exists
   */
  exists(riskId: string): Promise<boolean>;

  /**
   * Delete risk by ID
   */
  delete(id: number): Promise<void>;

  /**
   * Delete risk by riskId
   */
  deleteByRiskId(riskId: string): Promise<void>;

  /**
   * Count risks matching filters
   */
  count(filters?: RiskListFilters): Promise<number>;

  /**
   * Get next available risk ID number for given prefix
   * Example: getNextRiskIdNumber('RISK') returns 5 if RISK-004 exists
   */
  getNextRiskIdNumber(prefix: string): Promise<number>;

  /**
   * Bulk operations
   */
  
  /**
   * Save multiple risks in a transaction
   */
  saveMany(risks: Risk[]): Promise<Risk[]>;

  /**
   * Delete multiple risks by IDs
   */
  deleteMany(ids: number[]): Promise<void>;

  /**
   * Update risk status in bulk
   */
  updateStatusBulk(ids: number[], newStatus: RiskStatus, reason?: string): Promise<void>;
}
