/**
 * ListRisksHandler - Handles listing risks with filters
 */

import { QueryHandler } from '@/shared/application/QueryHandler';
import { ListRisksQuery } from '../queries/ListRisksQuery';
import { IRiskRepository } from '../../core/repositories/IRiskRepository';
import { RiskDTOMapper, RiskListDTO } from '../dto/RiskDTO';

export class ListRisksHandler implements QueryHandler<ListRisksQuery, RiskListDTO> {
  constructor(private riskRepository: IRiskRepository) {}

  async handle(query: ListRisksQuery): Promise<RiskListDTO> {
    const { payload } = query;

    // Set defaults
    const limit = payload.limit ?? 50;
    const offset = payload.offset ?? 0;

    // Query repository with filters
    const { risks, total } = await this.riskRepository.list({
      organizationId: payload.organizationId,
      status: payload.status,
      category: payload.category,
      ownerId: payload.ownerId,
      searchQuery: payload.searchQuery,
      limit,
      offset,
      sortBy: payload.sortBy ?? 'created_at',
      sortOrder: payload.sortOrder ?? 'desc'
    });

    // Convert to DTOs
    return RiskDTOMapper.toListDTO(risks, total, limit, offset);
  }
}
