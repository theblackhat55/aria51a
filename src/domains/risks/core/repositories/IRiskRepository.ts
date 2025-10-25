/**
 * IRiskRepository - Repository interface for Risk aggregate
 * 
 * Defines the contract for Risk persistence operations.
 * Implementation will be in infrastructure layer (D1RiskRepository).
 */

import { Risk } from '../entities/Risk';
import { RiskStatus } from '../value-objects/RiskStatus';

export interface ListRisksOptions {
  organizationId: number;
  status?: RiskStatus;
  category?: string;
  ownerId?: number;
  searchQuery?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'updated_at' | 'risk_score' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface IRiskRepository {
  /**
   * Find a single risk by ID
   */
  findById(id: number, organizationId: number): Promise<Risk | null>;

  /**
   * Find all risks for an organization
   */
  findByOrganization(organizationId: number): Promise<Risk[]>;

  /**
   * List risks with filters and pagination
   */
  list(options: ListRisksOptions): Promise<{ risks: Risk[]; total: number }>;

  /**
   * Find risks by status
   */
  findByStatus(organizationId: number, status: RiskStatus): Promise<Risk[]>;

  /**
   * Find risks by category
   */
  findByCategory(organizationId: number, category: string): Promise<Risk[]>;

  /**
   * Find risks by owner
   */
  findByOwner(organizationId: number, ownerId: number): Promise<Risk[]>;

  /**
   * Find critical risks (high severity)
   */
  findCritical(organizationId: number): Promise<Risk[]>;

  /**
   * Find overdue risks (past review date)
   */
  findOverdue(organizationId: number): Promise<Risk[]>;

  /**
   * Search risks by query string
   */
  search(organizationId: number, query: string): Promise<Risk[]>;

  /**
   * Save a new risk
   */
  save(risk: Risk): Promise<Risk>;

  /**
   * Update an existing risk
   */
  update(risk: Risk): Promise<Risk>;

  /**
   * Delete a risk
   */
  delete(id: number, organizationId: number): Promise<void>;

  /**
   * Check if a risk exists
   */
  exists(id: number, organizationId: number): Promise<boolean>;

  /**
   * Count risks for an organization
   */
  count(organizationId: number): Promise<number>;

  /**
   * Count risks by status
   */
  countByStatus(organizationId: number, status: RiskStatus): Promise<number>;

  /**
   * Get risk statistics
   */
  getStatistics(organizationId: number): Promise<{
    total: number;
    byStatus: Record<string, number>;
    bySeverity: Record<string, number>;
    byCategory: Record<string, number>;
  }>;
}
