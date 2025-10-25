/**
 * GetRiskByIdHandler - Handles fetching a single risk by ID
 */

import { QueryHandler } from '@/shared/application/QueryHandler';
import { GetRiskByIdQuery } from '../queries/GetRiskByIdQuery';
import { IRiskRepository } from '../../core/repositories/IRiskRepository';
import { RiskDTOMapper, RiskDTO } from '../dto/RiskDTO';

export class GetRiskByIdHandler implements QueryHandler<GetRiskByIdQuery, RiskDTO> {
  constructor(private riskRepository: IRiskRepository) {}

  async handle(query: GetRiskByIdQuery): Promise<RiskDTO> {
    const { payload } = query;

    const risk = await this.riskRepository.findById(
      payload.id,
      payload.organizationId
    );

    if (!risk) {
      throw new Error(`Risk not found: ${payload.id}`);
    }

    return RiskDTOMapper.toDTO(risk);
  }
}
