/**
 * UpdateResponseActionCommand
 * 
 * Command to update an existing response action.
 */

import { Command } from '../../../../shared/application/Command';
import { ActionStatus } from '../../core/value-objects/ActionStatus';

export interface UpdateResponseActionPayload {
  id: number;
  status?: ActionStatus;
  outcome?: string;
  durationMinutes?: number;
  cost?: number;
  toolsUsed?: string[];
  affectedSystems?: string[];
  notes?: string;
  organizationId: number;
}

export class UpdateResponseActionCommand extends Command<UpdateResponseActionPayload> {
  constructor(payload: UpdateResponseActionPayload) {
    super(payload);
  }
}
