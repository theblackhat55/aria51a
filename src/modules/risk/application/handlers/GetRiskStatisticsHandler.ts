/**
 * GetRiskStatisticsHandler
 * Handles the GetRiskStatisticsQuery by retrieving risk statistics
 * Connects application layer with domain layer
 */

import { GetRiskStatisticsQuery } from '../queries';
import { RiskStatisticsDTO } from '../dto';
import { IRiskRepository } from '../../domain/repositories/IRiskRepository';
import { ValidationException } from '../../../../core/domain/exceptions/ValidationException';

export class GetRiskStatisticsHandler {
  constructor(private readonly riskRepository: IRiskRepository) {}

  /**
   * Execute the get risk statistics query
   */
  async execute(query: GetRiskStatisticsQuery): Promise<RiskStatisticsDTO> {
    // Validate query
    if (!query.validate()) {
      throw ValidationException.fromField('command', 'Invalid get risk statistics query data');
    }

    // Get statistics from repository
    const stats = await this.riskRepository.getStatistics(query.organizationId);

    // Convert to DTO (already matches the structure)
    return {
      total: stats.total,
      byStatus: stats.byStatus,
      byLevel: stats.byLevel,
      byCategory: stats.byCategory,
      averageScore: stats.averageScore,
      activeCount: stats.activeCount,
      closedCount: stats.closedCount,
      reviewOverdueCount: stats.reviewOverdueCount
    };
  }
}
