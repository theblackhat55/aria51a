/**
 * ChangeRiskStatusHandler
 * Handles the ChangeRiskStatusCommand by changing the status of a Risk aggregate
 * Connects application layer with domain layer
 */

import { ChangeRiskStatusCommand } from '../commands';
import { RiskResponseDTO } from '../dto';
import { IRiskRepository } from '../../domain/repositories/IRiskRepository';
import { RiskStatus } from '../../domain';
import { ValidationException } from '../../../../core/domain/exceptions/ValidationException';
import { NotFoundException } from '../../../../core/domain/exceptions/NotFoundException';

export class ChangeRiskStatusHandler {
  constructor(private readonly riskRepository: IRiskRepository) {}

  /**
   * Execute the change risk status command
   */
  async execute(command: ChangeRiskStatusCommand): Promise<RiskResponseDTO> {
    // Validate command
    if (!command.validate()) {
      throw ValidationException.fromField('command', 'Invalid change risk status command data');
    }

    // Find existing risk
    const risk = await this.riskRepository.findById(command.riskId);
    if (!risk) {
      throw new NotFoundException('Risk', command.riskId.toString());
    }

    // Create new status value object
    const newStatus = RiskStatus.create(command.newStatus);

    // Change status (will validate transition)
    risk.changeStatus(newStatus, command.reason);

    // Save updated risk (will publish RiskStatusChangedEvent)
    const savedRisk = await this.riskRepository.save(risk);

    // Convert to response DTO
    return this.toResponseDTO(savedRisk);
  }

  /**
   * Convert Risk entity to RiskResponseDTO
   */
  private toResponseDTO(risk: any): RiskResponseDTO {
    const riskObject = risk.toObject();

    return {
      id: riskObject.id,
      riskId: riskObject.riskId,
      title: riskObject.title,
      description: riskObject.description,
      category: riskObject.category,
      categoryDisplay: riskObject.categoryDisplay,
      categoryIcon: riskObject.categoryIcon,
      probability: riskObject.probability,
      impact: riskObject.impact,
      riskScore: riskObject.riskScore,
      riskLevel: riskObject.riskLevel,
      status: riskObject.status,
      statusDisplay: riskObject.statusDisplay,
      organizationId: riskObject.organizationId,
      ownerId: riskObject.ownerId,
      createdBy: riskObject.createdBy,
      riskType: riskObject.riskType,
      mitigationPlan: riskObject.mitigationPlan,
      contingencyPlan: riskObject.contingencyPlan,
      reviewDate: riskObject.reviewDate,
      lastReviewDate: riskObject.lastReviewDate,
      isReviewOverdue: riskObject.isReviewOverdue,
      tags: riskObject.tags || [],
      metadata: riskObject.metadata,
      isActive: riskObject.isActive,
      isCritical: riskObject.isCritical,
      needsImmediateAttention: riskObject.needsImmediateAttention,
      createdAt: riskObject.createdAt,
      updatedAt: riskObject.updatedAt
    };
  }
}
