/**
 * ListFrameworksQuery - Query for listing compliance frameworks with filters
 */

import { Query } from '@/shared/application/Query';
import { FrameworkType } from '../../core/value-objects/FrameworkType';

export interface ListFrameworksQueryPayload {
  organizationId: number;
  type?: FrameworkType;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'created_at' | 'completion_percentage';
  sortOrder?: 'asc' | 'desc';
}

export class ListFrameworksQuery extends Query<ListFrameworksQueryPayload> {
  constructor(payload: ListFrameworksQueryPayload) {
    super(payload);
  }
}
