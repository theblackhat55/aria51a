/**
 * UpdateRiskHandler - Handles risk update commands
 */

import { CommandHandler } from '@/shared/application/CommandHandler';
import { UpdateRiskCommand } from '../commands/UpdateRiskCommand';
import { IRiskRepository } from '../../core/repositories/IRiskRepository';
import { RiskDTOMapper, RiskDTO } from '../dto/RiskDTO';

export class UpdateRiskHandler implements CommandHandler<UpdateRiskCommand, RiskDTO> {
  constructor(private riskRepository: IRiskRepository) {}

  async handle(command: UpdateRiskCommand): Promise<RiskDTO> {
    const { payload } = command;

    // Fetch existing risk
    const risk = await this.riskRepository.findById(
      payload.id,
      payload.organizationId
    );

    if (!risk) {
      throw new Error(`Risk not found: ${payload.id}`);
    }

    // Update assessment if probability or impact changed
    if (payload.probability !== undefined || payload.impact !== undefined) {
      const newProbability = payload.probability ?? risk.probability;
      const newImpact = payload.impact ?? risk.impact;
      risk.updateAssessment(newProbability, newImpact);
    }

    // Update other fields
    const updateData: any = {};
    if (payload.title) updateData.title = payload.title;
    if (payload.description) updateData.description = payload.description;
    if (payload.category) updateData.category = payload.category;
    if (payload.subcategory !== undefined) updateData.subcategory = payload.subcategory;
    if (payload.source !== undefined) updateData.source = payload.source;
    if (payload.affectedAssets !== undefined) updateData.affectedAssets = payload.affectedAssets;
    if (payload.ownerId) updateData.ownerId = payload.ownerId;
    
    if (payload.reviewDate !== undefined) {
      updateData.reviewDate = payload.reviewDate ? new Date(payload.reviewDate) : undefined;
    }
    
    if (payload.dueDate !== undefined) {
      updateData.dueDate = payload.dueDate ? new Date(payload.dueDate) : undefined;
    }

    if (Object.keys(updateData).length > 0) {
      risk.update(updateData);
    }

    // Save updated risk
    const updatedRisk = await this.riskRepository.update(risk);

    // TODO: Publish domain events
    // await this.eventBus.publish(updatedRisk.getDomainEvents());

    // Clear events
    updatedRisk.clearDomainEvents();

    return RiskDTOMapper.toDTO(updatedRisk);
  }
}
