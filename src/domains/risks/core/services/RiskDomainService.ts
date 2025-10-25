/**
 * RiskDomainService - Domain service for complex risk operations
 * 
 * Handles business logic that spans multiple entities or
 * requires coordination between aggregates.
 */

import { Risk, CreateRiskProps } from '../entities/Risk';
import { RiskTreatment, TreatmentType } from '../entities/RiskTreatment';
import { RiskStatus } from '../value-objects/RiskStatus';
import { IRiskRepository } from '../repositories/IRiskRepository';
import { ITreatmentRepository } from '../repositories/ITreatmentRepository';

export interface RiskWithTreatments {
  risk: Risk;
  treatments: RiskTreatment[];
  activeTreatmentsCount: number;
  completedTreatmentsCount: number;
}

/**
 * Risk domain service for complex operations
 */
export class RiskDomainService {
  constructor(
    private riskRepository: IRiskRepository,
    private treatmentRepository: ITreatmentRepository
  ) {}

  /**
   * Create a new risk with initial assessment
   */
  async createRiskWithAssessment(
    props: CreateRiskProps
  ): Promise<Risk> {
    // Create the risk entity
    const risk = Risk.create(props);

    // Business rule: High/Critical risks must have an owner
    if (risk.requiresImmediateAttention() && !props.ownerId) {
      throw new Error('High and critical risks must be assigned to an owner');
    }

    // Business rule: Set review date based on severity
    if (!props.reviewDate) {
      const reviewDate = this.calculateReviewDate(risk);
      risk.update({ reviewDate });
    }

    // Save to repository
    return await this.riskRepository.save(risk);
  }

  /**
   * Mitigate a risk with a treatment plan
   */
  async mitigateRisk(
    riskId: number,
    organizationId: number,
    treatment: {
      title: string;
      description: string;
      treatmentType: TreatmentType;
      ownerId: number;
      estimatedCost?: number;
      targetDate?: Date;
      priority: number;
    }
  ): Promise<{ risk: Risk; treatment: RiskTreatment }> {
    // Get the risk
    const risk = await this.riskRepository.findById(riskId, organizationId);
    if (!risk) {
      throw new Error(`Risk not found: ${riskId}`);
    }

    // Business rule: Cannot mitigate closed risks
    if (risk.status.value === RiskStatus.Closed) {
      throw new Error('Cannot mitigate closed risks');
    }

    // Create treatment
    const riskTreatment = RiskTreatment.create({
      riskId,
      ...treatment
    });

    // Save treatment
    const savedTreatment = await this.treatmentRepository.save(riskTreatment);

    // Update risk status if appropriate
    if (risk.status.value === RiskStatus.Active) {
      risk.mitigate();
      await this.riskRepository.update(risk);
    }

    return {
      risk,
      treatment: savedTreatment
    };
  }

  /**
   * Accept a risk (no mitigation planned)
   */
  async acceptRisk(
    riskId: number,
    organizationId: number,
    justification: string,
    acceptedBy: number
  ): Promise<Risk> {
    const risk = await this.riskRepository.findById(riskId, organizationId);
    if (!risk) {
      throw new Error(`Risk not found: ${riskId}`);
    }

    // Business rule: Critical risks require explicit acceptance
    if (risk.requiresImmediateAttention()) {
      if (!justification || justification.length < 50) {
        throw new Error(
          'Critical risks require detailed justification (min 50 characters) for acceptance'
        );
      }
    }

    // Update risk status
    risk.accept();

    // Update metadata (in a real implementation, this would be a separate entity)
    risk.update({ ownerId: acceptedBy });

    return await this.riskRepository.update(risk);
  }

  /**
   * Close a risk with validation
   */
  async closeRisk(
    riskId: number,
    organizationId: number,
    closureReason: string
  ): Promise<Risk> {
    const risk = await this.riskRepository.findById(riskId, organizationId);
    if (!risk) {
      throw new Error(`Risk not found: ${riskId}`);
    }

    // Business rule: Must have treatments completed or risk accepted
    const treatments = await this.treatmentRepository.findByRisk(riskId);
    const hasCompletedTreatments = treatments.some(
      t => t.status === 'completed'
    );
    const isAccepted = risk.status.value === RiskStatus.Accepted;

    if (!hasCompletedTreatments && !isAccepted) {
      throw new Error(
        'Risk can only be closed after treatments are completed or risk is formally accepted'
      );
    }

    // Close the risk
    risk.close();

    return await this.riskRepository.update(risk);
  }

  /**
   * Get comprehensive risk view with all treatments
   */
  async getRiskWithTreatments(
    riskId: number,
    organizationId: number
  ): Promise<RiskWithTreatments> {
    const risk = await this.riskRepository.findById(riskId, organizationId);
    if (!risk) {
      throw new Error(`Risk not found: ${riskId}`);
    }

    const treatments = await this.treatmentRepository.findByRisk(riskId);

    const activeTreatmentsCount = treatments.filter(
      t => t.status === 'in_progress' || t.status === 'planned'
    ).length;

    const completedTreatmentsCount = treatments.filter(
      t => t.status === 'completed'
    ).length;

    return {
      risk,
      treatments,
      activeTreatmentsCount,
      completedTreatmentsCount
    };
  }

  /**
   * Check if risk requires escalation
   */
  async checkEscalationRequired(
    riskId: number,
    organizationId: number
  ): Promise<{
    requiresEscalation: boolean;
    reason: string;
    urgency: 'immediate' | 'high' | 'normal';
  }> {
    const risk = await this.riskRepository.findById(riskId, organizationId);
    if (!risk) {
      throw new Error(`Risk not found: ${riskId}`);
    }

    // Check if risk is overdue for review
    if (risk.isOverdueForReview()) {
      return {
        requiresEscalation: true,
        reason: 'Risk is overdue for review',
        urgency: risk.requiresImmediateAttention() ? 'immediate' : 'high'
      };
    }

    // Check if risk score is critical
    if (risk.calculateScore().severity === 'critical') {
      return {
        requiresEscalation: true,
        reason: 'Risk has critical severity',
        urgency: 'immediate'
      };
    }

    // Check for overdue treatments
    const treatments = await this.treatmentRepository.findByRisk(riskId);
    const overdueTreatments = treatments.filter(t => t.isOverdue());

    if (overdueTreatments.length > 0) {
      return {
        requiresEscalation: true,
        reason: `${overdueTreatments.length} treatment(s) are overdue`,
        urgency: risk.requiresImmediateAttention() ? 'immediate' : 'high'
      };
    }

    return {
      requiresEscalation: false,
      reason: 'Risk is within normal parameters',
      urgency: 'normal'
    };
  }

  /**
   * Calculate next review date based on risk severity
   */
  private calculateReviewDate(risk: Risk): Date {
    const score = risk.calculateScore();
    const today = new Date();
    let daysUntilReview: number;

    switch (score.severity) {
      case 'critical':
        daysUntilReview = 7; // Weekly for critical
        break;
      case 'high':
        daysUntilReview = 30; // Monthly for high
        break;
      case 'medium':
        daysUntilReview = 90; // Quarterly for medium
        break;
      default:
        daysUntilReview = 180; // Semi-annually for low
    }

    const reviewDate = new Date(today);
    reviewDate.setDate(reviewDate.getDate() + daysUntilReview);

    return reviewDate;
  }

  /**
   * Validate risk lifecycle transition
   */
  validateStatusTransition(
    currentStatus: RiskStatus,
    newStatus: RiskStatus
  ): { valid: boolean; reason?: string } {
    // Use value object's built-in validation
    const statusVO = RiskStatusVO.fromEnum(currentStatus);
    const canTransition = statusVO.canTransitionTo(newStatus);

    if (!canTransition) {
      return {
        valid: false,
        reason: `Cannot transition from ${statusVO.displayName} to ${RiskStatusVO.fromEnum(newStatus).displayName}`
      };
    }

    return { valid: true };
  }

  /**
   * Bulk update risk statuses
   */
  async bulkUpdateStatus(
    riskIds: number[],
    organizationId: number,
    newStatus: RiskStatus,
    updatedBy: number
  ): Promise<{ updated: number; failed: number; errors: string[] }> {
    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const riskId of riskIds) {
      try {
        const risk = await this.riskRepository.findById(riskId, organizationId);
        if (!risk) {
          errors.push(`Risk ${riskId} not found`);
          failed++;
          continue;
        }

        risk.updateStatus(newStatus);
        await this.riskRepository.update(risk);
        updated++;
      } catch (error) {
        errors.push(`Risk ${riskId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failed++;
      }
    }

    return { updated, failed, errors };
  }
}

// Import for validation method
import { RiskStatusVO } from '../value-objects/RiskStatus';
