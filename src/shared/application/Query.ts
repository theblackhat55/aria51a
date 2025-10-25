/**
 * Base Query Class
 * 
 * Represents a request to read data from the system (read operation).
 * Queries should be named with Get/List/Search prefixes (e.g., GetRiskById, ListUsers).
 * 
 * @abstract
 */

export abstract class Query<TResult = any> {
  public readonly queryId: string;
  public readonly timestamp: Date;

  constructor() {
    this.queryId = this.generateQueryId();
    this.timestamp = new Date();
  }

  /**
   * Generate a unique query ID
   */
  private generateQueryId(): string {
    return `qry_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Validate the query before execution
   * Override this method for query-specific validation
   */
  public validate(): void {
    // Override in subclasses for validation logic
  }
}
