/**
 * ListSecurityEventsHandler
 * 
 * Handles ListSecurityEventsQuery to retrieve security events with filtering.
 * Follows CQRS pattern with query handling.
 * 
 * Part of the Incident Response Domain (Application Layer).
 */

import { QueryHandler } from '../../../../shared/application/QueryHandler';
import { ListSecurityEventsQuery } from '../queries/ListSecurityEventsQuery';
import { ISecurityEventRepository, ListSecurityEventsOptions } from '../../core/repositories/ISecurityEventRepository';
import { SecurityEvent } from '../../core/entities/SecurityEvent';

export interface ListSecurityEventsResult {
  events: SecurityEvent[];
  total: number;
  limit: number;
  offset: number;
}

export class ListSecurityEventsHandler implements QueryHandler<ListSecurityEventsQuery, ListSecurityEventsResult> {
  constructor(private readonly repository: ISecurityEventRepository) {}

  async handle(query: ListSecurityEventsQuery): Promise<ListSecurityEventsResult> {
    const { payload } = query;

    // Build repository options
    const options: ListSecurityEventsOptions = {
      organizationId: payload.organizationId,
      eventType: payload.eventType,
      severity: payload.severity,
      source: payload.source,
      sourceSystem: payload.sourceSystem,
      sourceIp: payload.sourceIp,
      destinationIp: payload.destinationIp,
      userId: payload.userId,
      assetId: payload.assetId,
      incidentId: payload.incidentId,
      falsePositive: payload.falsePositive,
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
      events: result.events,
      total: result.total,
      limit: options.limit!,
      offset: options.offset!
    };
  }
}
