/**
 * ListSecurityEventsQuery
 * 
 * Query to list security events with filtering and pagination.
 */

import { Query } from '../../../../shared/application/Query';
import { EventSeverity } from '../../core/value-objects/EventSeverity';
import { EventSource } from '../../core/value-objects/EventSource';

export interface ListSecurityEventsPayload {
  organizationId: number;
  severity?: EventSeverity;
  source?: EventSource;
  eventType?: string;
  incidentId?: number;
  userId?: number;
  assetId?: string;
  sourceIp?: string;
  destinationIp?: string;
  falsePositive?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  minConfidence?: number;
  requiresInvestigation?: boolean;
  unlinked?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'detected_at' | 'severity' | 'confidence' | 'created_at';
  sortOrder?: 'ASC' | 'DESC';
}

export class ListSecurityEventsQuery extends Query<ListSecurityEventsPayload> {
  constructor(payload: ListSecurityEventsPayload) {
    super(payload);
  }
}
