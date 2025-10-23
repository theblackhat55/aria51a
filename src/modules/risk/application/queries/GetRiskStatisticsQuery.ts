/**
 * GetRiskStatisticsQuery
 * Query to retrieve statistical information about risks
 * Follows CQRS pattern - queries return data without changing state
 */

export class GetRiskStatisticsQuery {
  constructor(
    public readonly organizationId?: number,
    public readonly dateFrom?: Date,
    public readonly dateTo?: Date
  ) {}

  /**
   * Validate query data
   */
  validate(): boolean {
    // Date range validation
    if (this.dateFrom && this.dateTo) {
      if (this.dateFrom > this.dateTo) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get query name for logging/tracking
   */
  getQueryName(): string {
    return 'GetRiskStatisticsQuery';
  }

  /**
   * Get query metadata
   */
  getMetadata(): Record<string, any> {
    return {
      organizationId: this.organizationId,
      dateFrom: this.dateFrom?.toISOString(),
      dateTo: this.dateTo?.toISOString(),
      hasDateFilter: !!(this.dateFrom || this.dateTo)
    };
  }
}
