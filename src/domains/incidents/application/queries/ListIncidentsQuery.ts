/**
 * ListIncidentsQuery
 * 
 * Query to list incidents with filtering and pagination.
 */

import { Query } from '../../../../shared/application/Query';
import { IncidentStatus } from '../../core/value-objects/IncidentStatus';
import { IncidentSeverity } from '../../core/value-objects/IncidentSeverity';
import { IncidentCategory } from '../../core/value-objects/IncidentCategory';

export interface ListIncidentsPayload {
  organizationId: number;
  status?: IncidentStatus;
  severity?: IncidentSeverity;
  category?: IncidentCategory;
  assignedTo?: number;
  search?: string;
  slaBreached?: boolean;
  dataCompromised?: boolean;
  requiresLegalReview?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  limit?: number;
  offset?: number;
  sortBy?: 'detected_at' | 'severity' | 'status' | 'updated_at';
  sortOrder?: 'ASC' | 'DESC';
}

export class ListIncidentsQuery extends Query<ListIncidentsPayload> {
  constructor(payload: ListIncidentsPayload) {
    super(payload);
  }
}
