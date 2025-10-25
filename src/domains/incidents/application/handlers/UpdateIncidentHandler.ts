/**
 * UpdateIncidentHandler
 * 
 * Handles UpdateIncidentCommand to update existing incidents.
 * Follows CQRS pattern with command handling.
 * 
 * Part of the Incident Response Domain (Application Layer).
 */

import { CommandHandler } from '../../../../shared/application/CommandHandler';
import { UpdateIncidentCommand } from '../commands/UpdateIncidentCommand';
import { IIncidentRepository } from '../../core/repositories/IIncidentRepository';
import { Incident } from '../../core/entities/Incident';

export class UpdateIncidentHandler implements CommandHandler<UpdateIncidentCommand, Incident> {
  constructor(private readonly repository: IIncidentRepository) {}

  async handle(command: UpdateIncidentCommand): Promise<Incident> {
    const { payload } = command;

    // Find existing incident
    const incident = await this.repository.findById(payload.id, payload.organizationId);
    if (!incident) {
      throw new Error(`Incident with ID ${payload.id} not found`);
    }

    // Update fields using entity methods
    if (payload.title !== undefined) {
      incident.updateTitle(payload.title);
    }

    if (payload.description !== undefined) {
      incident.updateDescription(payload.description);
    }

    if (payload.severity !== undefined) {
      incident.updateSeverity(payload.severity);
    }

    if (payload.category !== undefined) {
      incident.updateCategory(payload.category);
    }

    if (payload.impact !== undefined) {
      incident.updateImpact(payload.impact);
    }

    if (payload.status !== undefined) {
      incident.updateStatus(payload.status);
    }

    if (payload.assignedTo !== undefined) {
      incident.assignTo(payload.assignedTo);
    }

    if (payload.rootCause !== undefined) {
      incident.setRootCause(payload.rootCause);
    }

    if (payload.resolution !== undefined) {
      incident.setResolution(payload.resolution);
    }

    if (payload.lessonsLearned !== undefined) {
      incident.setLessonsLearned(payload.lessonsLearned);
    }

    if (payload.actualCost !== undefined) {
      incident.setActualCost(payload.actualCost);
    }

    if (payload.dataCompromised !== undefined && payload.dataCompromised) {
      incident.markAsDataBreach();
    }

    if (payload.customersAffected !== undefined) {
      incident.setCustomersAffected(payload.customersAffected);
    }

    if (payload.affectedSystems !== undefined) {
      incident.setAffectedSystems(payload.affectedSystems);
    }

    if (payload.relatedRisks !== undefined) {
      incident.setRelatedRisks(payload.relatedRisks);
    }

    if (payload.relatedAssets !== undefined) {
      incident.setRelatedAssets(payload.relatedAssets);
    }

    // Save updated incident
    return await this.repository.update(incident);
  }
}
