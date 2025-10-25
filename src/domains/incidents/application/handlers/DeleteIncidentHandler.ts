/**
 * DeleteIncidentHandler
 * 
 * Handles DeleteIncidentCommand to soft delete incidents.
 * Follows CQRS pattern with command handling.
 * 
 * Part of the Incident Response Domain (Application Layer).
 */

import { CommandHandler } from '../../../../shared/application/CommandHandler';
import { DeleteIncidentCommand } from '../commands/DeleteIncidentCommand';
import { IIncidentRepository } from '../../core/repositories/IIncidentRepository';

export class DeleteIncidentHandler implements CommandHandler<DeleteIncidentCommand, boolean> {
  constructor(private readonly repository: IIncidentRepository) {}

  async handle(command: DeleteIncidentCommand): Promise<boolean> {
    const { payload } = command;

    // Check if incident exists
    const exists = await this.repository.exists(payload.id, payload.organizationId);
    if (!exists) {
      throw new Error(`Incident with ID ${payload.id} not found`);
    }

    // Delete incident
    return await this.repository.delete(payload.id, payload.organizationId);
  }
}
