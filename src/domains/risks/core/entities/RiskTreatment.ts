/**
 * RiskTreatment - Entity representing risk mitigation actions
 */

import { Entity } from '@/shared/domain/Entity';
import { DomainEvent } from '@/shared/domain/DomainEvent';

export enum TreatmentType {
  Mitigate = 'mitigate',   // Reduce likelihood or impact
  Accept = 'accept',       // Accept the risk
  Transfer = 'transfer',   // Transfer to third party (insurance, outsource)
  Avoid = 'avoid'          // Eliminate the risk entirely
}

export enum TreatmentStatus {
  Planned = 'planned',
  InProgress = 'in_progress',
  Completed = 'completed',
  Cancelled = 'cancelled',
  Overdue = 'overdue'
}

export interface CreateTreatmentProps {
  riskId: number;
  title: string;
  description: string;
  treatmentType: TreatmentType;
  ownerId: number;
  estimatedCost?: number;
  targetDate?: Date;
  priority: number; // 1-5, where 5 is highest
}

export interface TreatmentProps extends CreateTreatmentProps {
  id: number;
  status: TreatmentStatus;
  completedDate?: Date;
  actualCost?: number;
  effectiveness?: number; // 1-5 rating after completion
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Domain Events
 */
export class TreatmentCreatedEvent extends DomainEvent {
  constructor(
    public readonly treatmentId: number,
    public readonly riskId: number,
    public readonly treatmentType: TreatmentType
  ) {
    super();
  }

  getAggregateId(): number {
    return this.treatmentId;
  }

  protected getEventData(): Record<string, any> {
    return {
      treatmentId: this.treatmentId,
      riskId: this.riskId,
      treatmentType: this.treatmentType
    };
  }
}

export class TreatmentCompletedEvent extends DomainEvent {
  constructor(
    public readonly treatmentId: number,
    public readonly riskId: number,
    public readonly effectiveness?: number
  ) {
    super();
  }

  getAggregateId(): number {
    return this.treatmentId;
  }

  protected getEventData(): Record<string, any> {
    return {
      treatmentId: this.treatmentId,
      riskId: this.riskId,
      effectiveness: this.effectiveness
    };
  }
}

/**
 * RiskTreatment Entity
 */
export class RiskTreatment extends Entity<number> {
  private _riskId: number;
  private _title: string;
  private _description: string;
  private _treatmentType: TreatmentType;
  private _status: TreatmentStatus;
  private _ownerId: number;
  private _estimatedCost?: number;
  private _actualCost?: number;
  private _targetDate?: Date;
  private _completedDate?: Date;
  private _priority: number;
  private _effectiveness?: number;

  private constructor(props: TreatmentProps) {
    super(props.id);
    this._riskId = props.riskId;
    this._title = props.title;
    this._description = props.description;
    this._treatmentType = props.treatmentType;
    this._status = props.status;
    this._ownerId = props.ownerId;
    this._estimatedCost = props.estimatedCost;
    this._actualCost = props.actualCost;
    this._targetDate = props.targetDate;
    this._completedDate = props.completedDate;
    this._priority = props.priority;
    this._effectiveness = props.effectiveness;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  static create(props: CreateTreatmentProps): RiskTreatment {
    // Validate
    RiskTreatment.validateTitle(props.title);
    RiskTreatment.validateDescription(props.description);
    RiskTreatment.validatePriority(props.priority);

    const treatment = new RiskTreatment({
      id: 0,
      ...props,
      status: TreatmentStatus.Planned,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    treatment.addDomainEvent(
      new TreatmentCreatedEvent(0, props.riskId, props.treatmentType)
    );

    return treatment;
  }

  static reconstitute(props: TreatmentProps): RiskTreatment {
    return new RiskTreatment(props);
  }

  // Getters
  get riskId(): number {
    return this._riskId;
  }

  get title(): string {
    return this._title;
  }

  get description(): string {
    return this._description;
  }

  get treatmentType(): TreatmentType {
    return this._treatmentType;
  }

  get status(): TreatmentStatus {
    return this._status;
  }

  get ownerId(): number {
    return this._ownerId;
  }

  get estimatedCost(): number | undefined {
    return this._estimatedCost;
  }

  get actualCost(): number | undefined {
    return this._actualCost;
  }

  get targetDate(): Date | undefined {
    return this._targetDate;
  }

  get completedDate(): Date | undefined {
    return this._completedDate;
  }

  get priority(): number {
    return this._priority;
  }

  get effectiveness(): number | undefined {
    return this._effectiveness;
  }

  /**
   * Start treatment execution
   */
  start(): void {
    if (this._status !== TreatmentStatus.Planned) {
      throw new Error('Only planned treatments can be started');
    }
    this._status = TreatmentStatus.InProgress;
    this.touch();
  }

  /**
   * Complete treatment with optional effectiveness rating
   */
  complete(actualCost?: number, effectiveness?: number): void {
    if (this._status !== TreatmentStatus.InProgress && this._status !== TreatmentStatus.Overdue) {
      throw new Error('Only in-progress or overdue treatments can be completed');
    }

    if (effectiveness !== undefined) {
      RiskTreatment.validateEffectiveness(effectiveness);
      this._effectiveness = effectiveness;
    }

    this._status = TreatmentStatus.Completed;
    this._completedDate = new Date();
    this._actualCost = actualCost;
    this.touch();

    this.addDomainEvent(
      new TreatmentCompletedEvent(this.id, this._riskId, this._effectiveness)
    );
  }

  /**
   * Cancel treatment
   */
  cancel(): void {
    if (this._status === TreatmentStatus.Completed) {
      throw new Error('Cannot cancel completed treatment');
    }
    this._status = TreatmentStatus.Cancelled;
    this.touch();
  }

  /**
   * Mark as overdue (typically done by a background job)
   */
  markOverdue(): void {
    if (this._status === TreatmentStatus.InProgress && this.isOverdue()) {
      this._status = TreatmentStatus.Overdue;
      this.touch();
    }
  }

  /**
   * Update treatment details
   */
  update(props: {
    title?: string;
    description?: string;
    ownerId?: number;
    estimatedCost?: number;
    targetDate?: Date;
    priority?: number;
  }): void {
    if (this._status === TreatmentStatus.Completed || this._status === TreatmentStatus.Cancelled) {
      throw new Error('Cannot update completed or cancelled treatment');
    }

    if (props.title) {
      RiskTreatment.validateTitle(props.title);
      this._title = props.title;
    }

    if (props.description) {
      RiskTreatment.validateDescription(props.description);
      this._description = props.description;
    }

    if (props.priority !== undefined) {
      RiskTreatment.validatePriority(props.priority);
      this._priority = props.priority;
    }

    if (props.ownerId) this._ownerId = props.ownerId;
    if (props.estimatedCost !== undefined) this._estimatedCost = props.estimatedCost;
    if (props.targetDate !== undefined) this._targetDate = props.targetDate;

    this.touch();
  }

  /**
   * Check if treatment is overdue
   */
  isOverdue(): boolean {
    if (!this._targetDate) return false;
    if (this._status === TreatmentStatus.Completed || this._status === TreatmentStatus.Cancelled) {
      return false;
    }
    return new Date() > this._targetDate;
  }

  /**
   * Get days until/since target date
   */
  daysUntilTarget(): number | null {
    if (!this._targetDate) return null;
    const today = new Date();
    const diff = this._targetDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Calculate cost variance (actual vs estimated)
   */
  costVariance(): number | null {
    if (!this._estimatedCost || !this._actualCost) return null;
    return this._actualCost - this._estimatedCost;
  }

  // Validation
  private static validateTitle(title: string): void {
    if (!title || title.trim().length < 3) {
      throw new Error('Treatment title must be at least 3 characters');
    }
    if (title.length > 200) {
      throw new Error('Treatment title must not exceed 200 characters');
    }
  }

  private static validateDescription(description: string): void {
    if (!description || description.trim().length < 10) {
      throw new Error('Treatment description must be at least 10 characters');
    }
    if (description.length > 1000) {
      throw new Error('Treatment description must not exceed 1000 characters');
    }
  }

  private static validatePriority(priority: number): void {
    if (!Number.isInteger(priority) || priority < 1 || priority > 5) {
      throw new Error('Priority must be an integer between 1 and 5');
    }
  }

  private static validateEffectiveness(effectiveness: number): void {
    if (!Number.isInteger(effectiveness) || effectiveness < 1 || effectiveness > 5) {
      throw new Error('Effectiveness must be an integer between 1 and 5');
    }
  }

  toJSON(): Record<string, any> {
    return {
      id: this.id,
      riskId: this._riskId,
      title: this._title,
      description: this._description,
      treatmentType: this._treatmentType,
      status: this._status,
      ownerId: this._ownerId,
      estimatedCost: this._estimatedCost,
      actualCost: this._actualCost,
      targetDate: this._targetDate?.toISOString(),
      completedDate: this._completedDate?.toISOString(),
      priority: this._priority,
      effectiveness: this._effectiveness,
      isOverdue: this.isOverdue(),
      daysUntilTarget: this.daysUntilTarget(),
      costVariance: this.costVariance(),
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString()
    };
  }
}
