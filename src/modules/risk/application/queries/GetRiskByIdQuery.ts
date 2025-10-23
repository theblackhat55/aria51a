/**
 * GetRiskByIdQuery
 * Query to retrieve a single risk by its ID
 * Follows CQRS pattern - queries return data without changing state
 */

export class GetRiskByIdQuery {
  constructor(
    public readonly riskId: number, // Database ID
    public readonly includeOwner?: boolean,
    public readonly includeCreator?: boolean
  ) {}

  /**
   * Validate query data
   */
  validate(): boolean {
    return this.riskId > 0;
  }

  /**
   * Get query name for logging/tracking
   */
  getQueryName(): string {
    return 'GetRiskByIdQuery';
  }

  /**
   * Get query metadata
   */
  getMetadata(): Record<string, any> {
    return {
      riskId: this.riskId,
      includeOwner: this.includeOwner,
      includeCreator: this.includeCreator
    };
  }
}
