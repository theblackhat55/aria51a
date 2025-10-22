/**
 * PaginationDTO - Data Transfer Object for pagination
 */

export interface PaginationRequest {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export class PaginationDTO {
  /**
   * Create pagination response
   */
  static createResponse<T>(
    items: T[],
    total: number,
    page: number,
    limit: number
  ): PaginationResponse<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1
    };
  }

  /**
   * Calculate offset from page and limit
   */
  static calculateOffset(page: number, limit: number): number {
    return (page - 1) * limit;
  }

  /**
   * Validate pagination parameters
   */
  static validate(page: number, limit: number): boolean {
    return page > 0 && limit > 0 && limit <= 100;
  }
}
