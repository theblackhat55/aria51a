/**
 * GetIncidentStatisticsHandler
 * 
 * Handles GetIncidentStatisticsQuery to retrieve incident statistics.
 * Follows CQRS pattern with query handling.
 * 
 * Part of the Incident Response Domain (Application Layer).
 */

import { QueryHandler } from '../../../../shared/application/QueryHandler';
import { GetIncidentStatisticsQuery } from '../queries/GetIncidentStatisticsQuery';
import { IIncidentRepository, IncidentStatistics } from '../../core/repositories/IIncidentRepository';

export class GetIncidentStatisticsHandler implements QueryHandler<GetIncidentStatisticsQuery, IncidentStatistics> {
  constructor(private readonly repository: IIncidentRepository) {}

  async handle(query: GetIncidentStatisticsQuery): Promise<IncidentStatistics> {
    const { payload } = query;

    const dateFrom = payload.dateFrom ? new Date(payload.dateFrom) : undefined;
    const dateTo = payload.dateTo ? new Date(payload.dateTo) : undefined;

    return await this.repository.getStatistics(payload.organizationId, dateFrom, dateTo);
  }
}
