/**
 * Risk - Main aggregate root for Risk domain
 * Represents a business risk with its assessment and lifecycle
 */

import { AggregateRoot } from '@/shared/domain/AggregateRoot';
import { RiskScore } from '../value-objects/RiskScore';
import { RiskStatus, RiskStatusVO } from '../value-objects/RiskStatus';
import { DomainEvent } from '@/shared/domain/DomainEvent';

export interface CreateRiskProps {
  title: string;
  description: string;
  category: string;
  subcategory?: string;
  probability: number;
  impact: number;
  ownerId: number;
  organizationId: number;
  source?: string;
  affectedAssets?: string;
  reviewDate?: Date;
  dueDate?: Date;
}

export interface RiskProps extends CreateRiskProps {
  id: number;
  status: string;
  inherentRisk?: number;
  residualRisk?: number;
  createdBy?: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Domain Events
 */
export class RiskCreatedEvent extends DomainEvent {
  constructor(
    public readonly riskId: number,
    public readonly title: string,
    public readonly severity: string
  ) {
    super();
  }

  getAggregateId(): number {
    return this.riskId;
  }

  protected getEventData(): Record<string, any> {
    return {
      riskId: this.riskId,
      title: this.title,
      severity: this.severity
    };
  }
}

export class RiskStatusChangedEvent extends DomainEvent {
  constructor(
    public readonly riskId: number,
    public readonly oldStatus: string,
    public readonly newStatus: string
  ) {
    super();
  }

  getAggregateId(): number {
    return this.riskId;
  }

  protected getEventData(): Record<string, any> {
    return {
      riskId: this.riskId,
      oldStatus: this.oldStatus,
      newStatus: this.newStatus
    };
  }
}

export class RiskAssessmentUpdatedEvent extends DomainEvent {
  constructor(
    public readonly riskId: number,
    public readonly oldScore: number,
    public readonly newScore: number
  ) {
    super();
  }

  getAggregateId(): number {
    return this.riskId;
  }

  protected getEventData(): Record<string, any> {
    return {
      riskId: this.riskId,
      oldScore: this.oldScore,
      newScore: this.newScore
    };
  }
}

/**
 * Risk Entity - Main aggregate root
 */
export class Risk extends AggregateRoot<number> {
  private _title: string;
  private _description: string;
  private _category: string;
  private _subcategory?: string;
  private _probability: number;
  private _impact: number;
  private _status: RiskStatusVO;
  private _ownerId: number;
  private _organizationId: number;
  private _inherentRisk?: number;
  private _residualRisk?: number;
  private _source?: string;
  private _affectedAssets?: string;
  private _reviewDate?: Date;
  private _dueDate?: Date;
  private _createdBy?: number;

  private constructor(props: RiskProps) {
    super(props.id);
    this._title = props.title;
    this._description = props.description;
    this._category = props.category;
    this._subcategory = props.subcategory;
    this._probability = props.probability;
    this._impact = props.impact;
    this._status = RiskStatusVO.create(props.status);
    this._ownerId = props.ownerId;
    this._organizationId = props.organizationId;
    this._inherentRisk = props.inherentRisk;
    this._residualRisk = props.residualRisk;
    this._source = props.source;
    this._affectedAssets = props.affectedAssets;
    this._reviewDate = props.reviewDate;
    this._dueDate = props.dueDate;
    this._createdBy = props.createdBy;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  /**
   * Factory method to create a new Risk
   */
  static create(props: CreateRiskProps): Risk {
    // Validate business rules
    Risk.validateTitle(props.title);
    Risk.validateDescription(props.description);
    Risk.validateProbability(props.probability);
    Risk.validateImpact(props.impact);

    const risk = new Risk({
      id: 0, // Will be assigned by database
      ...props,
      status: RiskStatus.Active,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Calculate initial risk score
    const riskScore = risk.calculateScore();

    // Emit domain event
    risk.addDomainEvent(
      new RiskCreatedEvent(0, props.title, riskScore.severity)
    );

    return risk;
  }

  /**
   * Factory method to reconstitute Risk from persistence
   */
  static reconstitute(props: RiskProps): Risk {
    return new Risk(props);
  }

  // Getters
  get title(): string {
    return this._title;
  }

  get description(): string {
    return this._description;
  }

  get category(): string {
    return this._category;
  }

  get subcategory(): string | undefined {
    return this._subcategory;
  }

  get probability(): number {
    return this._probability;
  }

  get impact(): number {
    return this._impact;
  }

  get status(): RiskStatusVO {
    return this._status;
  }

  get ownerId(): number {
    return this._ownerId;
  }

  get organizationId(): number {
    return this._organizationId;
  }

  get inherentRisk(): number | undefined {
    return this._inherentRisk;
  }

  get residualRisk(): number | undefined {
    return this._residualRisk;
  }

  get source(): string | undefined {
    return this._source;
  }

  get affectedAssets(): string | undefined {
    return this._affectedAssets;
  }

  get reviewDate(): Date | undefined {
    return this._reviewDate;
  }

  get dueDate(): Date | undefined {
    return this._dueDate;
  }

  get createdBy(): number | undefined {
    return this._createdBy;
  }

  /**
   * Calculate current risk score
   */
  calculateScore(): RiskScore {
    return RiskScore.calculate(this._probability, this._impact);
  }

  /**
   * Update risk assessment (probability and impact)
   */
  updateAssessment(probability: number, impact: number): void {
    Risk.validateProbability(probability);
    Risk.validateImpact(impact);

    const oldScore = this.calculateScore().score;

    this._probability = probability;
    this._impact = impact;
    this.touch();

    const newScore = this.calculateScore().score;

    if (oldScore !== newScore) {
      this.addDomainEvent(
        new RiskAssessmentUpdatedEvent(this.id, oldScore, newScore)
      );
    }
  }

  /**
   * Update risk status with validation
   */
  updateStatus(newStatus: RiskStatus): void {
    const newStatusVO = RiskStatusVO.fromEnum(newStatus);

    // Check if transition is valid
    if (!this._status.canTransitionTo(newStatus)) {
      throw new Error(
        `Invalid status transition from ${this._status.displayName} to ${newStatusVO.displayName}`
      );
    }

    const oldStatus = this._status.value;
    this._status = newStatusVO;
    this.touch();

    this.addDomainEvent(
      new RiskStatusChangedEvent(this.id, oldStatus, newStatus)
    );
  }

  /**
   * Mark risk as mitigated
   */
  mitigate(): void {
    this.updateStatus(RiskStatus.Mitigated);
  }

  /**
   * Mark risk as accepted
   */
  accept(): void {
    this.updateStatus(RiskStatus.Accepted);
  }

  /**
   * Close risk
   */
  close(): void {
    this.updateStatus(RiskStatus.Closed);
  }

  /**
   * Update risk details
   */
  update(props: {
    title?: string;
    description?: string;
    category?: string;
    subcategory?: string;
    source?: string;
    affectedAssets?: string;
    ownerId?: number;
    reviewDate?: Date;
    dueDate?: Date;
  }): void {
    if (props.title) {
      Risk.validateTitle(props.title);
      this._title = props.title;
    }

    if (props.description) {
      Risk.validateDescription(props.description);
      this._description = props.description;
    }

    if (props.category) this._category = props.category;
    if (props.subcategory !== undefined) this._subcategory = props.subcategory;
    if (props.source !== undefined) this._source = props.source;
    if (props.affectedAssets !== undefined) this._affectedAssets = props.affectedAssets;
    if (props.ownerId) this._ownerId = props.ownerId;
    if (props.reviewDate !== undefined) this._reviewDate = props.reviewDate;
    if (props.dueDate !== undefined) this._dueDate = props.dueDate;

    this.touch();
  }

  /**
   * Set residual risk after mitigation
   */
  setResidualRisk(residualRisk: number): void {
    if (residualRisk < 1 || residualRisk > 25) {
      throw new Error('Residual risk must be between 1 and 25');
    }
    this._residualRisk = residualRisk;
    this.touch();
  }

  /**
   * Check if risk requires immediate attention
   */
  requiresImmediateAttention(): boolean {
    return this.calculateScore().requiresImmediateAttention();
  }

  /**
   * Check if risk is overdue for review
   */
  isOverdueForReview(): boolean {
    if (!this._reviewDate) return false;
    return new Date() > this._reviewDate;
  }

  // Validation methods
  private static validateTitle(title: string): void {
    if (!title || title.trim().length < 3) {
      throw new Error('Risk title must be at least 3 characters long');
    }
    if (title.length > 200) {
      throw new Error('Risk title must not exceed 200 characters');
    }
  }

  private static validateDescription(description: string): void {
    if (!description || description.trim().length < 10) {
      throw new Error('Risk description must be at least 10 characters long');
    }
    if (description.length > 2000) {
      throw new Error('Risk description must not exceed 2000 characters');
    }
  }

  private static validateProbability(probability: number): void {
    if (!Number.isInteger(probability) || probability < 1 || probability > 5) {
      throw new Error('Probability must be an integer between 1 and 5');
    }
  }

  private static validateImpact(impact: number): void {
    if (!Number.isInteger(impact) || impact < 1 || impact > 5) {
      throw new Error('Impact must be an integer between 1 and 5');
    }
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON(): Record<string, any> {
    const riskScore = this.calculateScore();
    
    return {
      id: this.id,
      title: this._title,
      description: this._description,
      category: this._category,
      subcategory: this._subcategory,
      probability: this._probability,
      impact: this._impact,
      riskScore: riskScore.toJSON(),
      status: this._status.value,
      statusDisplay: this._status.displayName,
      statusColor: this._status.color,
      ownerId: this._ownerId,
      organizationId: this._organizationId,
      inherentRisk: this._inherentRisk,
      residualRisk: this._residualRisk,
      source: this._source,
      affectedAssets: this._affectedAssets,
      reviewDate: this._reviewDate?.toISOString(),
      dueDate: this._dueDate?.toISOString(),
      createdBy: this._createdBy,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString()
    };
  }
}
