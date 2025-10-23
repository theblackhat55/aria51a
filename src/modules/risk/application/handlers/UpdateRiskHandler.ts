/**
 * UpdateRiskHandler
 * Handles the UpdateRiskCommand by updating an existing Risk aggregate
 * Connects application layer with domain layer
 */

import { UpdateRiskCommand } from '../commands';
import { RiskResponseDTO } from '../dto';
import { IRiskRepository } from '../../domain/repositories/IRiskRepository';
import { RiskCategory, RiskStatus } from '../../domain';
import { ValidationException } from '../../../../core/domain/exceptions/ValidationException';
import { NotFoundException } from '../../../../core/domain/exceptions/NotFoundException';

export class UpdateRiskHandler {
  constructor(private readonly riskRepository: IRiskRepository) {}

  /**
   * Execute the update risk command
   */
  async execute(command: UpdateRiskCommand): Promise<RiskResponseDTO> {
    // Validate command
    if (!command.validate()) {
      throw ValidationException.fromField('command', 'Invalid update risk command data');
    }

    // Find existing risk
    const risk = await this.riskRepository.findById(command.riskId);
    if (!risk) {
      throw new NotFoundException('Risk', command.riskId.toString());
    }

    // Update risk details if provided
    const updates: any = {};

    if (command.data.title !== undefined) {
      updates.title = command.data.title;
    }

    if (command.data.description !== undefined) {
      updates.description = command.data.description;
    }

    if (command.data.category !== undefined) {
      updates.category = RiskCategory.create(command.data.category);
    }

    if (command.data.mitigationPlan !== undefined) {
      updates.mitigationPlan = command.data.mitigationPlan;
    }

    if (command.data.contingencyPlan !== undefined) {
      updates.contingencyPlan = command.data.contingencyPlan;
    }

    if (command.data.tags !== undefined) {
      updates.tags = command.data.tags;
    }

    // Apply detail updates if any
    if (Object.keys(updates).length > 0) {
      risk.updateDetails(updates);
    }

    // Update score if probability or impact changed
    if (command.data.probability !== undefined || command.data.impact !== undefined) {
      const newProbability = command.data.probability ?? risk.score.probability;
      const newImpact = command.data.impact ?? risk.score.impact;
      risk.updateScore(newProbability, newImpact);
    }

    // Update status if changed
    if (command.data.status !== undefined && command.data.status !== risk.status.value) {
      const newStatus = RiskStatus.create(command.data.status);
      risk.changeStatus(newStatus, command.data.updateReason);
    }

    // Update owner if changed
    if (command.data.ownerId !== undefined && command.data.ownerId !== risk.ownerId) {
      risk.assignTo(command.data.ownerId);
    }

    // Update review date if provided
    if (command.data.reviewDate !== undefined) {
      risk.scheduleReview(new Date(command.data.reviewDate));
    }

    // Update metadata if provided
    if (command.data.metadata !== undefined) {
      for (const [key, value] of Object.entries(command.data.metadata)) {
        risk.updateMetadata(key, value);
      }
    }

    // Save updated risk
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
