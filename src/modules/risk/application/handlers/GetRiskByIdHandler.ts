/**
 * GetRiskByIdHandler
 * Handles the GetRiskByIdQuery by retrieving a single risk
 * Connects application layer with domain layer
 */

import { GetRiskByIdQuery } from '../queries';
import { RiskResponseDTO } from '../dto';
import { IRiskRepository } from '../../domain/repositories/IRiskRepository';
import { ValidationException } from '../../../../core/domain/exceptions/ValidationException';
import { NotFoundException } from '../../../../core/domain/exceptions/NotFoundException';

export class GetRiskByIdHandler {
  constructor(private readonly riskRepository: IRiskRepository) {}

  /**
   * Execute the get risk by ID query
   */
  async execute(query: GetRiskByIdQuery): Promise<RiskResponseDTO> {
    // Validate query
    if (!query.validate()) {
      throw ValidationException.fromField('command', 'Invalid get risk by ID query data');
    }

    // Find risk
    const risk = await this.riskRepository.findById(query.riskId);
    if (!risk) {
      throw new NotFoundException('Risk', query.riskId.toString());
    }

    // Convert to response DTO
    return this.toResponseDTO(risk);
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
