/**
 * ListRisksQuery
 * Query to retrieve a list of risks with filtering, sorting, and pagination
 * Follows CQRS pattern - queries return data without changing state
 */

import { ListRisksQueryDTO } from '../dto';

export class ListRisksQuery {
  constructor(public readonly params: ListRisksQueryDTO) {}

  /**
   * Validate query data
   */
  validate(): boolean {
    // Validate pagination
    if (this.params.page !== undefined && this.params.page < 1) {
      return false;
    }

    if (this.params.limit !== undefined) {
      if (this.params.limit < 1 || this.params.limit > 100) {
        return false;
      }
    }

    // Validate score range
    if (this.params.minScore !== undefined && (this.params.minScore < 1 || this.params.minScore > 25)) {
      return false;
    }

    if (this.params.maxScore !== undefined && (this.params.maxScore < 1 || this.params.maxScore > 25)) {
      return false;
    }

    // Validate sort order
    if (this.params.sortOrder !== undefined) {
      if (!['asc', 'desc'].includes(this.params.sortOrder)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get query name for logging/tracking
   */
  getQueryName(): string {
    return 'ListRisksQuery';
  }

  /**
   * Get query metadata
   */
  getMetadata(): Record<string, any> {
    return {
      page: this.params.page || 1,
      limit: this.params.limit || 20,
      hasFilters: Object.keys(this.params).length > 2,
      organizationId: this.params.organizationId
    };
  }

  /**
   * Get filter summary for logging
   */
  getFilterSummary(): string {
    const filters: string[] = [];
    
    if (this.params.status) filters.push(`status:${this.params.status}`);
    if (this.params.category) filters.push(`category:${this.params.category}`);
    if (this.params.riskLevel) filters.push(`level:${this.params.riskLevel}`);
    if (this.params.ownerId) filters.push(`owner:${this.params.ownerId}`);
    if (this.params.search) filters.push(`search:"${this.params.search}"`);
    if (this.params.criticalOnly) filters.push('critical-only');
    if (this.params.activeOnly) filters.push('active-only');
    if (this.params.reviewOverdue) filters.push('review-overdue');

    return filters.length > 0 ? filters.join(', ') : 'no-filters';
  }
}
