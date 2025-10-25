/**
 * DeleteIncidentCommand
 * 
 * Command to delete an incident from the system.
 */

import { Command } from '../../../../shared/application/Command';

export interface DeleteIncidentPayload {
  id: number;
  organizationId: number;
}

export class DeleteIncidentCommand extends Command<DeleteIncidentPayload> {
  constructor(payload: DeleteIncidentPayload) {
    super(payload);
  }
}
