/**
 * GetRiskByIdQuery - Query for fetching a single risk by ID
 */

import { Query } from '@/shared/application/Query';

export interface GetRiskByIdQueryPayload {
  id: number;
  organizationId: number;
}

export class GetRiskByIdQuery extends Query<GetRiskByIdQueryPayload> {
  constructor(payload: GetRiskByIdQueryPayload) {
    super(payload);
  }
}
