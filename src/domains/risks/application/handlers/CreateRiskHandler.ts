/**
 * CreateRiskHandler - Handles risk creation commands
 */

import { CommandHandler } from '@/shared/application/CommandHandler';
import { CreateRiskCommand } from '../commands/CreateRiskCommand';
import { IRiskRepository } from '../../core/repositories/IRiskRepository';
import { Risk } from '../../core/entities/Risk';
import { RiskDTOMapper, RiskDTO } from '../dto/RiskDTO';

export class CreateRiskHandler implements CommandHandler<CreateRiskCommand, RiskDTO> {
  constructor(private riskRepository: IRiskRepository) {}

  async handle(command: CreateRiskCommand): Promise<RiskDTO> {
    const { payload } = command;

    // Convert date strings to Date objects if needed
    const reviewDate = payload.reviewDate 
      ? new Date(payload.reviewDate)
      : undefined;
    
    const dueDate = payload.dueDate
      ? new Date(payload.dueDate)
      : undefined;

    // Create risk entity using factory method
    const risk = Risk.create({
      title: payload.title,
      description: payload.description,
      category: payload.category,
      subcategory: payload.subcategory,
      probability: payload.probability,
      impact: payload.impact,
      ownerId: payload.ownerId,
      organizationId: payload.organizationId,
      source: payload.source,
      affectedAssets: payload.affectedAssets,
      reviewDate,
      dueDate
    });

    // Save to repository
    const savedRisk = await this.riskRepository.save(risk);

    // TODO: Publish domain events
    // await this.eventBus.publish(savedRisk.getDomainEvents());

    // Clear events after publishing
    savedRisk.clearDomainEvents();

    // Return DTO
    return RiskDTOMapper.toDTO(savedRisk);
  }
}
