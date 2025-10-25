/**
 * ListResponseActionsHandler
 * 
 * Handles ListResponseActionsQuery to retrieve response actions with filtering.
 * Follows CQRS pattern with query handling.
 * 
 * Part of the Incident Response Domain (Application Layer).
 */

import { QueryHandler } from '../../../../shared/application/QueryHandler';
import { ListResponseActionsQuery } from '../queries/ListResponseActionsQuery';
import { IResponseActionRepository, ListResponseActionsOptions } from '../../core/repositories/IResponseActionRepository';
import { ResponseAction } from '../../core/entities/ResponseAction';

export interface ListResponseActionsResult {
  actions: ResponseAction[];
  total: number;
  limit: number;
  offset: number;
}

export class ListResponseActionsHandler implements QueryHandler<ListResponseActionsQuery, ListResponseActionsResult> {
  constructor(private readonly repository: IResponseActionRepository) {}

  async handle(query: ListResponseActionsQuery): Promise<ListResponseActionsResult> {
    const { payload } = query;

    // Build repository options
    const options: ListResponseActionsOptions = {
      organizationId: payload.organizationId,
      incidentId: payload.incidentId,
      actionType: payload.actionType,
      status: payload.status,
      performedBy: payload.performedBy,
      dateFrom: payload.dateFrom ? new Date(payload.dateFrom) : undefined,
      dateTo: payload.dateTo ? new Date(payload.dateTo) : undefined,
      limit: payload.limit || 10,
      offset: payload.offset || 0,
      sortBy: payload.sortBy || 'performed_at',
      sortOrder: payload.sortOrder || 'desc'
    };

    // Retrieve from repository
    const result = await this.repository.list(options);

    return {
      actions: result.actions,
      total: result.total,
      limit: options.limit!,
      offset: options.offset!
    };
  }
}
