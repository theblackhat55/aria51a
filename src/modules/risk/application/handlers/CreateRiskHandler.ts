/**
 * CreateRiskHandler
 * Handles the CreateRiskCommand by creating a new Risk aggregate
 * Connects application layer with domain layer
 */

import { CreateRiskCommand } from '../commands';
import { RiskResponseDTO } from '../dto';
import { IRiskRepository } from '../../domain/repositories/IRiskRepository';
import { Risk, RiskCategory, RiskScore, RiskStatus } from '../../domain';
import { ValidationException } from '../../../../core/domain/exceptions/ValidationException';

export class CreateRiskHandler {
  constructor(private readonly riskRepository: IRiskRepository) {}

  /**
   * Execute the create risk command
   */
  async execute(command: CreateRiskCommand): Promise<RiskResponseDTO> {
    // Validate command
    if (!command.validate()) {
      throw ValidationException.fromField('command', 'Invalid create risk command data');
    }

    // Check if risk ID already exists
    const exists = await this.riskRepository.exists(command.data.riskId);
    if (exists) {
      throw ValidationException.fromField(
        'riskId',
        'Risk ID already exists',
        command.data.riskId
      );
    }

    // Create domain objects from DTOs
    const category = RiskCategory.create(command.data.category);

    // Create Risk aggregate using domain factory
    const risk = Risk.create({
      riskId: command.data.riskId,
      title: command.data.title,
      description: command.data.description,
      category,
      probability: command.data.probability,
      impact: command.data.impact,
      organizationId: command.data.organizationId,
      ownerId: command.data.ownerId,
      createdBy: command.data.createdBy,
      riskType: command.data.riskType,
      mitigationPlan: command.data.mitigationPlan,
      contingencyPlan: command.data.contingencyPlan,
      reviewDate: command.data.reviewDate ? new Date(command.data.reviewDate) : undefined,
      tags: command.data.tags
    });

    // Save to repository (will publish domain events)
    const savedRisk = await this.riskRepository.save(risk);

    // Convert to response DTO
    return this.toResponseDTO(savedRisk);
  }

  /**
   * Convert Risk entity to RiskResponseDTO
   */
  private toResponseDTO(risk: Risk): RiskResponseDTO {
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
