/**
 * ListRisksQuery - Query for listing risks with filters
 */

import { Query } from '@/shared/application/Query';
import { RiskStatus } from '../../core/value-objects/RiskStatus';

export interface ListRisksQueryPayload {
  organizationId: number;
  status?: RiskStatus;
  category?: string;
  ownerId?: number;
  searchQuery?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'created_at' | 'updated_at' | 'risk_score' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export class ListRisksQuery extends Query<ListRisksQueryPayload> {
  constructor(payload: ListRisksQueryPayload) {
    super(payload);
  }
}
