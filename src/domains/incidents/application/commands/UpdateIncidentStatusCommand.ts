/**
 * UpdateIncidentStatusCommand
 * 
 * Command to update the status of an incident.
 * This is a separate command because status changes are critical operations.
 */

import { Command } from '../../../../shared/application/Command';
import { IncidentStatus } from '../../core/value-objects/IncidentStatus';

export interface UpdateIncidentStatusPayload {
  id: number;
  newStatus: IncidentStatus;
  notes?: string;
  organizationId: number;
}

export class UpdateIncidentStatusCommand extends Command<UpdateIncidentStatusPayload> {
  constructor(payload: UpdateIncidentStatusPayload) {
    super(payload);
  }
}
