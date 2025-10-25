/**
 * CreateResponseActionCommand
 * 
 * Command to create a new response action for an incident.
 */

import { Command } from '../../../../shared/application/Command';
import { ResponseType } from '../../core/value-objects/ResponseType';
import { ActionStatus } from '../../core/value-objects/ActionStatus';

export interface CreateResponseActionPayload {
  incidentId: number;
  actionType: ResponseType;
  description: string;
  performedBy: number; // userId
  performedAt: Date;
  status?: ActionStatus; // defaults to pending
  durationMinutes?: number;
  cost?: number;
  toolsUsed?: string[];
  affectedSystems?: string[];
  notes?: string;
  organizationId: number;
}

export class CreateResponseActionCommand extends Command<CreateResponseActionPayload> {
  constructor(payload: CreateResponseActionPayload) {
    super(payload);
  }
}
