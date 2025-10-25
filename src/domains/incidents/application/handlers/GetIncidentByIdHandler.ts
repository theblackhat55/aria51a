/**
 * GetIncidentByIdHandler
 * 
 * Handles GetIncidentByIdQuery to retrieve a single incident.
 * Follows CQRS pattern with query handling.
 * 
 * Part of the Incident Response Domain (Application Layer).
 */

import { QueryHandler } from '../../../../shared/application/QueryHandler';
import { GetIncidentByIdQuery } from '../queries/GetIncidentByIdQuery';
import { IIncidentRepository } from '../../core/repositories/IIncidentRepository';
import { Incident } from '../../core/entities/Incident';

export class GetIncidentByIdHandler implements QueryHandler<GetIncidentByIdQuery, Incident> {
  constructor(private readonly repository: IIncidentRepository) {}

  async handle(query: GetIncidentByIdQuery): Promise<Incident> {
    const { payload } = query;

    const incident = await this.repository.findById(payload.id, payload.organizationId);

    if (!incident) {
      throw new Error(`Incident with ID ${payload.id} not found`);
    }

    return incident;
  }
}
