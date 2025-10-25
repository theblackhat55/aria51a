/**
 * DeleteRiskHandler - Handles risk deletion commands
 */

import { CommandHandler } from '@/shared/application/CommandHandler';
import { DeleteRiskCommand } from '../commands/DeleteRiskCommand';
import { IRiskRepository } from '../../core/repositories/IRiskRepository';

export class DeleteRiskHandler implements CommandHandler<DeleteRiskCommand, void> {
  constructor(private riskRepository: IRiskRepository) {}

  async handle(command: DeleteRiskCommand): Promise<void> {
    const { payload } = command;

    // Check if risk exists
    const risk = await this.riskRepository.findById(
      payload.id,
      payload.organizationId
    );

    if (!risk) {
      throw new Error(`Risk not found: ${payload.id}`);
    }

    // Business rule: Cannot delete mitigated risks
    // (You may want to soft delete instead)
    if (risk.status.value === 'mitigated') {
      throw new Error('Cannot delete mitigated risks. Please close the risk instead.');
    }

    // Delete the risk
    await this.riskRepository.delete(payload.id, payload.organizationId);

    // TODO: Publish RiskDeletedEvent
  }
}
