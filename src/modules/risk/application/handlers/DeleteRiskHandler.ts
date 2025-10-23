/**
 * DeleteRiskHandler
 * Handles the DeleteRiskCommand by deleting a Risk aggregate
 * Connects application layer with domain layer
 */

import { DeleteRiskCommand } from '../commands';
import { RiskDeletedDTO } from '../dto';
import { IRiskRepository } from '../../domain/repositories/IRiskRepository';
import { ValidationException } from '../../../../core/domain/exceptions/ValidationException';
import { NotFoundException } from '../../../../core/domain/exceptions/NotFoundException';

export class DeleteRiskHandler {
  constructor(private readonly riskRepository: IRiskRepository) {}

  /**
   * Execute the delete risk command
   */
  async execute(command: DeleteRiskCommand): Promise<RiskDeletedDTO> {
    // Validate command
    if (!command.validate()) {
      throw ValidationException.fromField('command', 'Invalid delete risk command data');
    }

    // Find existing risk
    const risk = await this.riskRepository.findById(command.riskId);
    if (!risk) {
      throw new NotFoundException('Risk', command.riskId.toString());
    }

    // Check if risk can be deleted (business rules)
    risk.prepareForDeletion(); // This will throw if deletion is not allowed

    // Store risk details for response
    const riskDetails = {
      id: risk.id,
      riskId: risk.riskId,
      title: risk.title
    };

    // Delete from repository (will publish RiskDeletedEvent)
    await this.riskRepository.delete(command.riskId);

    // Return deletion confirmation
    return {
      id: riskDetails.id,
      riskId: riskDetails.riskId,
      title: riskDetails.title,
      deleted: true,
      deletedAt: new Date().toISOString(),
      message: command.reason || 'Risk successfully deleted'
    };
  }
}
