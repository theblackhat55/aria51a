/**
 * SearchRisksHandler
 * Handles the SearchRisksQuery by searching for risks
 * Connects application layer with domain layer
 */

import { SearchRisksQuery } from '../queries';
import { RiskListItemDTO } from '../dto';
import { IRiskRepository } from '../../domain/repositories/IRiskRepository';
import { ValidationException } from '../../../../core/domain/exceptions/ValidationException';

export class SearchRisksHandler {
  constructor(private readonly riskRepository: IRiskRepository) {}

  /**
   * Execute the search risks query
   */
  async execute(query: SearchRisksQuery): Promise<RiskListItemDTO[]> {
    // Validate query
    if (!query.validate()) {
      throw ValidationException.fromField('command', 'Invalid search risks query data');
    }

    // Search risks
    const risks = await this.riskRepository.search(
      query.getNormalizedSearchTerm(),
      query.organizationId
    );

    // Apply limit if provided
    const limitedRisks = query.limit ? risks.slice(0, query.limit) : risks;

    // Convert to DTOs
    return limitedRisks.map(risk => this.toListItemDTO(risk));
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
