/**
 * GetIncidentByIdQuery
 * 
 * Query to retrieve a specific incident by ID.
 */

import { Query } from '../../../../shared/application/Query';

export interface GetIncidentByIdPayload {
  id: number;
  organizationId: number;
}

export class GetIncidentByIdQuery extends Query<GetIncidentByIdPayload> {
  constructor(payload: GetIncidentByIdPayload) {
    super(payload);
  }
}
