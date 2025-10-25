/**
 * SearchRisksQuery - Query for searching risks
 */

import { Query } from '@/shared/application/Query';

export interface SearchRisksQueryPayload {
  organizationId: number;
  query: string;
  limit?: number;
}

export class SearchRisksQuery extends Query<SearchRisksQueryPayload> {
  constructor(payload: SearchRisksQueryPayload) {
    super(payload);
  }
}
