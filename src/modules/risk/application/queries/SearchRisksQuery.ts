/**
 * SearchRisksQuery
 * Query to search risks by text in title and description
 * Follows CQRS pattern - queries return data without changing state
 */

export class SearchRisksQuery {
  constructor(
    public readonly searchTerm: string,
    public readonly organizationId?: number,
    public readonly limit?: number
  ) {}

  /**
   * Validate query data
   */
  validate(): boolean {
    // Search term must not be empty
    if (!this.searchTerm || this.searchTerm.trim().length === 0) {
      return false;
    }

    // Search term should be at least 2 characters
    if (this.searchTerm.trim().length < 2) {
      return false;
    }

    // Validate limit if provided
    if (this.limit !== undefined) {
      if (this.limit < 1 || this.limit > 100) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get query name for logging/tracking
   */
  getQueryName(): string {
    return 'SearchRisksQuery';
  }

  /**
   * Get query metadata
   */
  getMetadata(): Record<string, any> {
    return {
      searchTerm: this.searchTerm,
      searchLength: this.searchTerm.length,
      organizationId: this.organizationId,
      limit: this.limit || 20
    };
  }

  /**
   * Get normalized search term (lowercase, trimmed)
   */
  getNormalizedSearchTerm(): string {
    return this.searchTerm.trim().toLowerCase();
  }
}
