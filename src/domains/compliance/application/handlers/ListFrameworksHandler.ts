/**
 * ListFrameworksHandler - Handler for listing compliance frameworks
 */

import { QueryHandler } from '@/shared/application/QueryHandler';
import { ListFrameworksQuery } from '../queries/ListFrameworksQuery';
import { IComplianceFrameworkRepository } from '../../core/repositories/IComplianceFrameworkRepository';
import { ComplianceFrameworkDTOMapper, ComplianceFrameworkListDTO } from '../dto/ComplianceFrameworkDTO';

export class ListFrameworksHandler implements QueryHandler<ListFrameworksQuery, ComplianceFrameworkListDTO> {
  constructor(private frameworkRepository: IComplianceFrameworkRepository) {}

  async handle(query: ListFrameworksQuery): Promise<ComplianceFrameworkListDTO> {
    const { payload } = query;

    // Set defaults
    const limit = payload.limit ?? 50;
    const offset = payload.offset ?? 0;

    // Query repository
    const { frameworks, total } = await this.frameworkRepository.list({
      organizationId: payload.organizationId,
      type: payload.type,
      isActive: payload.isActive,
      limit,
      offset,
      sortBy: payload.sortBy ?? 'created_at',
      sortOrder: payload.sortOrder ?? 'desc'
    });

    // Convert to DTOs
    return ComplianceFrameworkDTOMapper.toListDTO(frameworks, total, limit, offset);
  }
}
