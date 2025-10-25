/**
 * GetRiskStatisticsHandler - Handles fetching risk statistics
 */

import { QueryHandler } from '@/shared/application/QueryHandler';
import { GetRiskStatisticsQuery } from '../queries/GetRiskStatisticsQuery';
import { IRiskRepository } from '../../core/repositories/IRiskRepository';
import { RiskDTOMapper, RiskStatisticsDTO } from '../dto/RiskDTO';

export class GetRiskStatisticsHandler implements QueryHandler<GetRiskStatisticsQuery, RiskStatisticsDTO> {
  constructor(private riskRepository: IRiskRepository) {}

  async handle(query: GetRiskStatisticsQuery): Promise<RiskStatisticsDTO> {
    const { payload } = query;

    const stats = await this.riskRepository.getStatistics(payload.organizationId);

    return RiskDTOMapper.toStatisticsDTO(stats);
  }
}
