/**
 * IComplianceFrameworkRepository - Repository interface for ComplianceFramework aggregate
 */

import { ComplianceFramework } from '../entities/ComplianceFramework';
import { FrameworkType } from '../value-objects/FrameworkType';

export interface ListFrameworksOptions {
  organizationId: number;
  type?: FrameworkType;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'created_at' | 'completion_percentage';
  sortOrder?: 'asc' | 'desc';
}

export interface IComplianceFrameworkRepository {
  /**
   * Find framework by ID
   */
  findById(id: number, organizationId: number): Promise<ComplianceFramework | null>;

  /**
   * List frameworks with filters
   */
  list(options: ListFrameworksOptions): Promise<{ frameworks: ComplianceFramework[]; total: number }>;

  /**
   * Save new framework
   */
  save(framework: ComplianceFramework): Promise<ComplianceFramework>;

  /**
   * Update existing framework
   */
  update(framework: ComplianceFramework): Promise<ComplianceFramework>;

  /**
   * Delete framework
   */
  delete(id: number, organizationId: number): Promise<void>;

  /**
   * Get framework statistics
   */
  getStatistics(organizationId: number): Promise<{
    total: number;
    byType: Record<string, number>;
    certified: number;
    expired: number;
    averageCompletion: number;
  }>;

  /**
   * Find frameworks by type
   */
  findByType(organizationId: number, type: FrameworkType): Promise<ComplianceFramework[]>;

  /**
   * Find active frameworks
   */
  findActive(organizationId: number): Promise<ComplianceFramework[]>;
}
