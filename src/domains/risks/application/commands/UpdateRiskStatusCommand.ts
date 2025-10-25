/**
 * UpdateRiskStatusCommand - Command for updating risk status
 */

import { Command } from '@/shared/application/Command';
import { RiskStatus } from '../../core/value-objects/RiskStatus';

export interface UpdateRiskStatusCommandPayload {
  id: number;
  organizationId: number;
  newStatus: RiskStatus;
  updatedBy: number;
  reason?: string;
}

export class UpdateRiskStatusCommand extends Command<UpdateRiskStatusCommandPayload> {
  constructor(payload: UpdateRiskStatusCommandPayload) {
    super(payload);
  }
}
