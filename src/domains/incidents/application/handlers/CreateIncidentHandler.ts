/**
 * CreateIncidentHandler
 * 
 * Handles CreateIncidentCommand to create new incidents.
 * Follows CQRS pattern with command handling.
 * 
 * Part of the Incident Response Domain (Application Layer).
 */

import { CommandHandler } from '../../../../shared/application/CommandHandler';
import { CreateIncidentCommand } from '../commands/CreateIncidentCommand';
import { IIncidentRepository } from '../../core/repositories/IIncidentRepository';
import { Incident, IncidentProps } from '../../core/entities/Incident';
import { IncidentSeverityVO } from '../../core/value-objects/IncidentSeverity';
import { IncidentStatusVO } from '../../core/value-objects/IncidentStatus';
import { IncidentCategoryVO } from '../../core/value-objects/IncidentCategory';
import { ImpactLevelVO } from '../../core/value-objects/ImpactLevel';

export class CreateIncidentHandler implements CommandHandler<CreateIncidentCommand, Incident> {
  constructor(private readonly repository: IIncidentRepository) {}

  async handle(command: CreateIncidentCommand): Promise<Incident> {
    const { payload } = command;

    // Create value objects
    const severity = IncidentSeverityVO.create(payload.severity);
    const status = payload.status 
      ? IncidentStatusVO.create(payload.status)
      : IncidentStatusVO.create('detected' as any);
    const category = IncidentCategoryVO.create(payload.category);
    const impact = ImpactLevelVO.create(payload.impact);

    // Build incident props
    const incidentProps: IncidentProps = {
      title: payload.title,
      description: payload.description,
      severity,
      status,
      category,
      impact,
      assignedTo: payload.assignedTo,
      detectedAt: payload.detectedAt || new Date(),
      sourceIp: payload.sourceIp,
      targetAsset: payload.targetAsset,
      affectedSystems: payload.affectedSystems || [],
      estimatedCost: payload.estimatedCost,
      dataCompromised: payload.dataCompromised || false,
      customersAffected: payload.customersAffected,
      relatedRisks: payload.relatedRisks || [],
      relatedAssets: payload.relatedAssets || [],
      organizationId: payload.organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Create incident entity
    const incident = Incident.create(incidentProps);

    // Save to repository
    return await this.repository.save(incident);
  }
}
