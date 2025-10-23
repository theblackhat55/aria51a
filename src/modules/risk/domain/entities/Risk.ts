/**
 * Risk Entity (Aggregate Root)
 * Central entity for risk management in the domain
 * Manages risk lifecycle, scoring, and business rules
 */

import { AggregateRoot } from '../../../../core/domain/entities/AggregateRoot';
import { RiskScore } from '../value-objects/RiskScore';
import { RiskStatus } from '../value-objects/RiskStatus';
import { RiskCategory } from '../value-objects/RiskCategory';
import { ValidationException } from '../../../../core/domain/exceptions/ValidationException';
import { DomainException } from '../../../../core/domain/exceptions/DomainException';
import { 
  RiskCreatedEvent, 
  RiskUpdatedEvent, 
  RiskStatusChangedEvent, 
  RiskDeletedEvent 
} from '../events';

export interface RiskProps {
  riskId: string; // Business identifier (e.g., "RISK-001")
  title: string;
  description: string;
  category: RiskCategory;
  score: RiskScore;
  status: RiskStatus;
  organizationId: number;
  ownerId: number;
  createdBy: number;
  riskType: string; // e.g., 'business', 'technical', 'strategic'
  
  // Optional fields
  mitigationPlan?: string;
  contingencyPlan?: string;
  reviewDate?: Date;
  lastReviewDate?: Date;
  tags?: string[];
  metadata?: Record<string, any>;
}

export class Risk extends AggregateRoot<number> {
  private props: RiskProps;

  private constructor(id: number, props: RiskProps) {
    super(id);
    this.props = props;
  }

  /**
   * Create a new risk (factory method)
   */
  static create(props: {
    riskId: string;
    title: string;
    description: string;
    category: RiskCategory;
    probability: number;
    impact: number;
    organizationId: number;
    ownerId: number;
    createdBy: number;
    riskType?: string;
    mitigationPlan?: string;
    contingencyPlan?: string;
    reviewDate?: Date;
    tags?: string[];
  }): Risk {
    // Validate required fields
    Risk.validateTitle(props.title);
    Risk.validateDescription(props.description);
    Risk.validateRiskId(props.riskId);

    // Create risk score from probability and impact
    const score = RiskScore.create(props.probability, props.impact);

    // Create with default active status
    const status = RiskStatus.createActive();

    // Create risk entity
    const risk = new Risk(0, { // ID will be assigned by repository
      riskId: props.riskId,
      title: props.title.trim(),
      description: props.description.trim(),
      category: props.category,
      score,
      status,
      organizationId: props.organizationId,
      ownerId: props.ownerId,
      createdBy: props.createdBy,
      riskType: props.riskType || 'business',
      mitigationPlan: props.mitigationPlan?.trim(),
      contingencyPlan: props.contingencyPlan?.trim(),
      reviewDate: props.reviewDate,
      tags: props.tags || [],
      metadata: {}
    });

    // Add domain event - RiskCreated
    risk.addDomainEvent(new RiskCreatedEvent(
      risk.id.toString(),
      {
        riskId: risk.props.riskId,
        title: risk.props.title,
        description: risk.props.description,
        category: risk.props.category.value,
        probability: score.probability,
        impact: score.impact,
        riskScore: score.score,
        riskLevel: score.level,
        status: status.value,
        organizationId: risk.props.organizationId,
        ownerId: risk.props.ownerId,
        createdBy: risk.props.createdBy,
        riskType: risk.props.riskType
      }
    ));

    return risk;
  }

  /**
   * Reconstitute risk from persistence (for repository)
   */
  static reconstitute(
    id: number,
    props: RiskProps,
    createdAt: Date,
    updatedAt: Date
  ): Risk {
    const risk = new Risk(id, props);
    risk._createdAt = createdAt;
    risk._updatedAt = updatedAt;
    return risk;
  }

  // ============ Getters ============

  get riskId(): string {
    return this.props.riskId;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string {
    return this.props.description;
  }

  get category(): RiskCategory {
    return this.props.category;
  }

  get score(): RiskScore {
    return this.props.score;
  }

  get status(): RiskStatus {
    return this.props.status;
  }

  get organizationId(): number {
    return this.props.organizationId;
  }

  get ownerId(): number {
    return this.props.ownerId;
  }

  get createdBy(): number {
    return this.props.createdBy;
  }

  get riskType(): string {
    return this.props.riskType;
  }

  get mitigationPlan(): string | undefined {
    return this.props.mitigationPlan;
  }

  get contingencyPlan(): string | undefined {
    return this.props.contingencyPlan;
  }

  get reviewDate(): Date | undefined {
    return this.props.reviewDate;
  }

  get lastReviewDate(): Date | undefined {
    return this.props.lastReviewDate;
  }

  get tags(): string[] {
    return this.props.tags || [];
  }

  get metadata(): Record<string, any> {
    return this.props.metadata || {};
  }

  // ============ Computed Properties ============

  /**
   * Check if risk is active
   */
  get isActive(): boolean {
    return this.props.status.isActive();
  }

  /**
   * Check if risk is closed
   */
  get isClosed(): boolean {
    return this.props.status.isClosed();
  }

  /**
   * Check if risk is critical
   */
  get isCritical(): boolean {
    return this.props.score.isCritical();
  }

  /**
   * Check if risk needs immediate attention
   */
  get needsImmediateAttention(): boolean {
    return this.props.score.needsImmediateAttention() && this.props.status.isActive();
  }

  /**
   * Check if risk review is overdue
   */
  get isReviewOverdue(): boolean {
    if (!this.props.reviewDate) return false;
    return new Date() > this.props.reviewDate;
  }

  // ============ Business Operations ============

  /**
   * Update risk details
   */
  updateDetails(updates: {
    title?: string;
    description?: string;
    category?: RiskCategory;
    mitigationPlan?: string;
    contingencyPlan?: string;
    tags?: string[];
  }): void {
    if (updates.title !== undefined) {
      Risk.validateTitle(updates.title);
      this.props.title = updates.title.trim();
    }

    if (updates.description !== undefined) {
      Risk.validateDescription(updates.description);
      this.props.description = updates.description.trim();
    }

    if (updates.category !== undefined) {
      this.props.category = updates.category;
    }

    if (updates.mitigationPlan !== undefined) {
      this.props.mitigationPlan = updates.mitigationPlan.trim();
    }

    if (updates.contingencyPlan !== undefined) {
      this.props.contingencyPlan = updates.contingencyPlan.trim();
    }

    if (updates.tags !== undefined) {
      this.props.tags = updates.tags;
    }

    this.touch();
    
    // Add domain event - RiskUpdated
    const updatedFields = Object.keys(updates).filter(key => updates[key] !== undefined);
    const changes: Record<string, { old: any; new: any }> = {};
    
    this.addDomainEvent(new RiskUpdatedEvent(
      this.id.toString(),
      {
        riskId: this.props.riskId,
        updatedFields,
        changes // TODO: Track old vs new values if needed
      }
    ));
  }

  /**
   * Update risk score (probability and impact)
   */
  updateScore(probability: number, impact: number): void {
    const oldScore = this.props.score;
    const newScore = RiskScore.create(probability, impact);
    this.props.score = newScore;
    this.touch();
    
    // Add domain event - RiskScoreChanged (part of RiskUpdated)
    this.addDomainEvent(new RiskUpdatedEvent(
      this.id.toString(),
      {
        riskId: this.props.riskId,
        updatedFields: ['probability', 'impact', 'score'],
        changes: {
          probability: { old: oldScore.probability, new: newScore.probability },
          impact: { old: oldScore.impact, new: newScore.impact },
          score: { old: oldScore.score, new: newScore.score }
        }
      }
    ));
  }

  /**
   * Change risk status with validation
   */
  changeStatus(newStatus: RiskStatus, reason?: string): void {
    // Validate transition
    if (!this.props.status.canTransitionTo(newStatus)) {
      throw new DomainException(
        `Cannot transition from ${this.props.status.value} to ${newStatus.value}`,
        'INVALID_STATUS_TRANSITION'
      );
    }

    // Additional business rule: Cannot close critical active risks without mitigation plan
    if (newStatus.isClosed() && this.isCritical && !this.props.mitigationPlan) {
      throw new DomainException(
        'Critical risks require a mitigation plan before closure',
        'MITIGATION_PLAN_REQUIRED'
      );
    }

    const oldStatus = this.props.status;
    this.props.status = newStatus;
    this.touch();

    // Add domain event - RiskStatusChanged
    this.addDomainEvent(new RiskStatusChangedEvent(
      this.id.toString(),
      {
        riskId: this.props.riskId,
        oldStatus: oldStatus.value,
        newStatus: newStatus.value,
        reason,
        riskScore: this.props.score.score,
        isCritical: this.isCritical
      }
    ));
  }

  /**
   * Assign risk to new owner
   */
  assignTo(newOwnerId: number): void {
    if (newOwnerId === this.props.ownerId) {
      return; // No change
    }

    const oldOwnerId = this.props.ownerId;
    this.props.ownerId = newOwnerId;
    this.touch();

    // Add domain event - RiskAssigned
  }

  /**
   * Schedule review date
   */
  scheduleReview(reviewDate: Date): void {
    if (reviewDate <= new Date()) {
      throw ValidationException.fromField(
        'reviewDate',
        'Review date must be in the future',
        reviewDate
      );
    }

    this.props.reviewDate = reviewDate;
    this.touch();
  }

  /**
   * Mark risk as reviewed
   */
  markAsReviewed(): void {
    this.props.lastReviewDate = new Date();
    
    // Schedule next review based on risk level
    const daysUntilNextReview = this.isCritical ? 30 : 
                                this.props.score.isHighOrCritical() ? 60 : 90;
    
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + daysUntilNextReview);
    this.props.reviewDate = nextReview;
    
    this.touch();
  }

  /**
   * Add tag to risk
   */
  addTag(tag: string): void {
    const normalizedTag = tag.trim().toLowerCase();
    if (!normalizedTag) return;
    
    if (!this.props.tags) {
      this.props.tags = [];
    }
    
    if (!this.props.tags.includes(normalizedTag)) {
      this.props.tags.push(normalizedTag);
      this.touch();
    }
  }

  /**
   * Remove tag from risk
   */
  removeTag(tag: string): void {
    if (!this.props.tags) return;
    
    const normalizedTag = tag.trim().toLowerCase();
    const index = this.props.tags.indexOf(normalizedTag);
    
    if (index > -1) {
      this.props.tags.splice(index, 1);
      this.touch();
    }
  }

  /**
   * Update metadata
   */
  updateMetadata(key: string, value: any): void {
    if (!this.props.metadata) {
      this.props.metadata = {};
    }
    
    this.props.metadata[key] = value;
    this.touch();
  }

  /**
   * Check if risk can be deleted
   */
  canBeDeleted(): boolean {
    // Business rule: Cannot delete critical active risks
    if (this.isCritical && this.isActive) {
      return false;
    }
    
    // Business rule: Can delete closed or resolved risks
    if (this.isClosed || this.props.status.isResolved()) {
      return true;
    }
    
    // Business rule: Can delete low-risk inactive risks
    return !this.isActive && !this.isCritical;
  }

  /**
   * Prepare for deletion (business rules check)
   */
  prepareForDeletion(): void {
    if (!this.canBeDeleted()) {
      throw new DomainException(
        'Cannot delete critical active risks. Please close or mitigate the risk first.',
        'CANNOT_DELETE_CRITICAL_RISK'
      );
    }

    // Add domain event - RiskDeleted
    this.addDomainEvent(new RiskDeletedEvent(
      this.id.toString(),
      {
        riskId: this.props.riskId,
        title: this.props.title,
        category: this.props.category.value,
        riskScore: this.props.score.score,
        riskLevel: this.props.score.level,
        status: this.props.status.value,
        organizationId: this.props.organizationId,
        ownerId: this.props.ownerId,
        deletedAt: new Date()
      }
    ));
  }

  // ============ Validation ============

  private static validateTitle(title: string): void {
    if (!title || title.trim().length === 0) {
      throw ValidationException.fromField('title', 'Title is required', title);
    }

    if (title.length > 200) {
      throw ValidationException.fromField('title', 'Title must be 200 characters or less', title);
    }
  }

  private static validateDescription(description: string): void {
    if (!description || description.trim().length === 0) {
      throw ValidationException.fromField('description', 'Description is required', description);
    }

    if (description.length > 2000) {
      throw ValidationException.fromField('description', 'Description must be 2000 characters or less', description);
    }
  }

  private static validateRiskId(riskId: string): void {
    if (!riskId || riskId.trim().length === 0) {
      throw ValidationException.fromField('riskId', 'Risk ID is required', riskId);
    }

    // Risk ID format: RISK-XXX or similar
    const riskIdPattern = /^[A-Z]+-\d+$/;
    if (!riskIdPattern.test(riskId)) {
      throw ValidationException.fromField(
        'riskId',
        'Risk ID must be in format: PREFIX-NUMBER (e.g., RISK-001)',
        riskId
      );
    }
  }

  // ============ Serialization ============

  /**
   * Convert to plain object for persistence or API response
   */
  toObject(): any {
    return {
      id: this.id,
      riskId: this.props.riskId,
      title: this.props.title,
      description: this.props.description,
      category: this.props.category.value,
      categoryDisplay: this.props.category.displayName,
      categoryIcon: this.props.category.icon,
      probability: this.props.score.probability,
      impact: this.props.score.impact,
      riskScore: this.props.score.score,
      riskLevel: this.props.score.level,
      status: this.props.status.value,
      statusDisplay: this.props.status.displayName,
      organizationId: this.props.organizationId,
      ownerId: this.props.ownerId,
      createdBy: this.props.createdBy,
      riskType: this.props.riskType,
      mitigationPlan: this.props.mitigationPlan,
      contingencyPlan: this.props.contingencyPlan,
      reviewDate: this.props.reviewDate?.toISOString(),
      lastReviewDate: this.props.lastReviewDate?.toISOString(),
      tags: this.props.tags,
      metadata: this.props.metadata,
      isActive: this.isActive,
      isCritical: this.isCritical,
      needsImmediateAttention: this.needsImmediateAttention,
      isReviewOverdue: this.isReviewOverdue,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  /**
   * Convert to JSON for API response
   */
  toJSON(): any {
    return this.toObject();
  }
}
