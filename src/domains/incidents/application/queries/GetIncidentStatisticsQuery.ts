/**
 * GetIncidentStatisticsQuery
 * 
 * Query to retrieve incident statistics.
 */

import { Query } from '../../../../shared/application/Query';

export interface GetIncidentStatisticsPayload {
  organizationId: number;
  dateFrom?: Date;
  dateTo?: Date;
}

export class GetIncidentStatisticsQuery extends Query<GetIncidentStatisticsPayload> {
  constructor(payload: GetIncidentStatisticsPayload) {
    super(payload);
  }
}
