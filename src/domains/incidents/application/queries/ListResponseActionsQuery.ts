/**
 * ListResponseActionsQuery
 * 
 * Query to list response actions with filtering and pagination.
 */

import { Query } from '../../../../shared/application/Query';
import { ResponseType } from '../../core/value-objects/ResponseType';
import { ActionStatus } from '../../core/value-objects/ActionStatus';

export interface ListResponseActionsPayload {
  organizationId: number;
  incidentId?: number;
  actionType?: ResponseType;
  status?: ActionStatus;
  performedBy?: number;
  dateFrom?: Date;
  dateTo?: Date;
  requiresReview?: boolean;
  isOverdue?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'performed_at' | 'status' | 'action_type' | 'created_at';
  sortOrder?: 'ASC' | 'DESC';
}

export class ListResponseActionsQuery extends Query<ListResponseActionsPayload> {
  constructor(payload: ListResponseActionsPayload) {
    super(payload);
  }
}
