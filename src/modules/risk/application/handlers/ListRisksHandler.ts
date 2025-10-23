/**
 * ListRisksHandler
 * Handles the ListRisksQuery by retrieving a paginated list of risks
 * Connects application layer with domain layer
 */

import { ListRisksQuery } from '../queries';
import { PaginatedRiskListDTO, RiskListItemDTO } from '../dto';
import { IRiskRepository, RiskListFilters, RiskListSort, PaginationOptions } from '../../domain';
import { ValidationException } from '../../../../core/domain/exceptions/ValidationException';

export class ListRisksHandler {
  constructor(private readonly riskRepository: IRiskRepository) {}

  /**
   * Execute the list risks query
   */
  async execute(query: ListRisksQuery): Promise<PaginatedRiskListDTO> {
    // Validate query
    if (!query.validate()) {
      throw ValidationException.fromField('command', 'Invalid list risks query data');
    }

    // Build filters
    const filters: RiskListFilters = {};

    if (query.params.status) {
      filters.status = query.params.status;
    }

    if (query.params.category) {
      filters.category = query.params.category;
    }

    if (query.params.riskLevel) {
      filters.riskLevel = query.params.riskLevel;
    }

    if (query.params.ownerId) {
      filters.ownerId = query.params.ownerId;
    }

    if (query.params.organizationId) {
      filters.organizationId = query.params.organizationId;
    }

    if (query.params.minScore) {
      filters.minScore = query.params.minScore;
    }

    if (query.params.maxScore) {
      filters.maxScore = query.params.maxScore;
    }

    if (query.params.search) {
      filters.search = query.params.search;
    }

    if (query.params.tags) {
      filters.tags = Array.isArray(query.params.tags) ? query.params.tags : [query.params.tags];
    }

    if (query.params.createdAfter) {
      filters.createdAfter = new Date(query.params.createdAfter);
    }

    if (query.params.createdBefore) {
      filters.createdBefore = new Date(query.params.createdBefore);
    }

    if (query.params.reviewOverdue !== undefined) {
      filters.reviewOverdue = query.params.reviewOverdue;
    }

    // Build sort options
    const sort: RiskListSort = {
      field: query.params.sortBy || 'createdAt',
      order: query.params.sortOrder || 'desc'
    };

    // Build pagination options
    const pagination: PaginationOptions = {
      page: query.params.page || 1,
      limit: Math.min(query.params.limit || 20, 100) // Max 100
    };

    // Execute query
    const result = await this.riskRepository.list(filters, sort, pagination);

    // Convert to DTOs
    const items: RiskListItemDTO[] = result.items.map(risk => this.toListItemDTO(risk));

    return {
      items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      hasNext: result.hasNext,
      hasPrevious: result.hasPrevious
    };
  }

  /**
   * Convert Risk entity to RiskListItemDTO (minimal)
   */
  private toListItemDTO(risk: any): RiskListItemDTO {
    const riskObject = risk.toObject();

    return {
      id: riskObject.id,
      riskId: riskObject.riskId,
      title: riskObject.title,
      category: riskObject.category,
      categoryIcon: riskObject.categoryIcon,
      riskScore: riskObject.riskScore,
      riskLevel: riskObject.riskLevel,
      status: riskObject.status,
      statusDisplay: riskObject.statusDisplay,
      ownerId: riskObject.ownerId,
      isActive: riskObject.isActive,
      isCritical: riskObject.isCritical,
      createdAt: riskObject.createdAt,
      updatedAt: riskObject.updatedAt
    };
  }
}
