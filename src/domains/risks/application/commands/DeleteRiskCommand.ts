/**
 * DeleteRiskCommand - Command for deleting a risk
 */

import { Command } from '@/shared/application/Command';

export interface DeleteRiskCommandPayload {
  id: number;
  organizationId: number;
  deletedBy: number;
}

export class DeleteRiskCommand extends Command<DeleteRiskCommandPayload> {
  constructor(payload: DeleteRiskCommandPayload) {
    super(payload);
  }
}
