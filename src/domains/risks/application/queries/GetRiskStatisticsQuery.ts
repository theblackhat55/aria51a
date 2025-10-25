/**
 * GetRiskStatisticsQuery - Query for getting risk statistics
 */

import { Query } from '@/shared/application/Query';

export interface GetRiskStatisticsQueryPayload {
  organizationId: number;
}

export class GetRiskStatisticsQuery extends Query<GetRiskStatisticsQueryPayload> {
  constructor(payload: GetRiskStatisticsQueryPayload) {
    super(payload);
  }
}
