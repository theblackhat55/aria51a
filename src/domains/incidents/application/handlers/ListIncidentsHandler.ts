/**
 * ListIncidentsHandler
 * 
 * Handles ListIncidentsQuery to retrieve incidents with filtering.
 * Follows CQRS pattern with query handling.
 * 
 * Part of the Incident Response Domain (Application Layer).
 */

import { QueryHandler } from '../../../../shared/application/QueryHandler';
import { ListIncidentsQuery } from '../queries/ListIncidentsQuery';
import { IIncidentRepository, ListIncidentsOptions } from '../../core/repositories/IIncidentRepository';
import { Incident } from '../../core/entities/Incident';

export interface ListIncidentsResult {
  incidents: Incident[];
  total: number;
  limit: number;
  offset: number;
}

export class ListIncidentsHandler implements QueryHandler<ListIncidentsQuery, ListIncidentsResult> {
  constructor(private readonly repository: IIncidentRepository) {}

  async handle(query: ListIncidentsQuery): Promise<ListIncidentsResult> {
    const { payload } = query;

    // Build repository options
    const options: ListIncidentsOptions = {
      organizationId: payload.organizationId,
      status: payload.status,
      severity: payload.severity,
      category: payload.category,
      assignedTo: payload.assignedTo,
      slaBreached: payload.slaBreached,
      dataCompromised: payload.dataCompromised,
      dateFrom: payload.dateFrom ? new Date(payload.dateFrom) : undefined,
      dateTo: payload.dateTo ? new Date(payload.dateTo) : undefined,
      limit: payload.limit || 10,
      offset: payload.offset || 0,
      sortBy: payload.sortBy || 'detected_at',
      sortOrder: payload.sortOrder || 'desc'
    };

    // Retrieve from repository
    const result = await this.repository.list(options);

    return {
      incidents: result.incidents,
      total: result.total,
      limit: options.limit!,
      offset: options.offset!
    };
  }
}
