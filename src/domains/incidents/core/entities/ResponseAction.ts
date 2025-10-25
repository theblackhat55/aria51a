/**
 * ResponseAction Entity
 * 
 * Represents an individual action taken during incident response.
 * Each response action tracks what was done, who did it, when, and the outcome.
 * 
 * Part of the Incident Response Domain following NIST SP 800-61 framework.
 */

import { Entity } from '../../../../shared/core/Entity';
import { ResponseType, ResponseTypeVO } from '../value-objects/ResponseType';
import { ActionStatus, ActionStatusVO } from '../value-objects/ActionStatus';

export interface ResponseActionProps {
  incidentId: number;
  actionType: ResponseType;
  description: string;
  performedBy: number; // userId
  performedAt: Date;
  status: ActionStatus;
  outcome?: string;
  evidenceUrls?: string[]; // JSON array of evidence/artifact URLs
  durationMinutes?: number;
  cost?: number;
  toolsUsed?: string[]; // JSON array of tools/systems used
  affectedSystems?: string[]; // JSON array of affected systems/assets
  notes?: string;
  reviewedBy?: number; // userId - for peer review
  reviewedAt?: Date;
  reviewComments?: string;
  organizationId: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ResponseAction extends Entity<number> {
  private _incidentId: number;
  private _actionType: ResponseTypeVO;
  private _description: string;
  private _performedBy: number;
  private _performedAt: Date;
  private _status: ActionStatusVO;
  private _outcome?: string;
  private _evidenceUrls: string[];
  private _durationMinutes?: number;
  private _cost?: number;
  private _toolsUsed: string[];
  private _affectedSystems: string[];
  private _notes?: string;
  private _reviewedBy?: number;
  private _reviewedAt?: Date;
  private _reviewComments?: string;
  private _organizationId: number;
  private _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: ResponseActionProps, id?: number) {
    super(id);
    this._incidentId = props.incidentId;
    this._actionType = ResponseTypeVO.create(props.actionType);
    this._description = props.description;
    this._performedBy = props.performedBy;
    this._performedAt = props.performedAt;
    this._status = ActionStatusVO.create(props.status);
    this._outcome = props.outcome;
    this._evidenceUrls = props.evidenceUrls || [];
    this._durationMinutes = props.durationMinutes;
    this._cost = props.cost;
    this._toolsUsed = props.toolsUsed || [];
    this._affectedSystems = props.affectedSystems || [];
    this._notes = props.notes;
    this._reviewedBy = props.reviewedBy;
    this._reviewedAt = props.reviewedAt;
    this._reviewComments = props.reviewComments;
    this._organizationId = props.organizationId;
    this._createdAt = props.createdAt || new Date();
    this._updatedAt = props.updatedAt || new Date();
  }

  public static create(props: ResponseActionProps, id?: number): ResponseAction {
    // Validation
    if (!props.incidentId || props.incidentId <= 0) {
      throw new Error('incidentId is required and must be positive');
    }
    if (!props.description || props.description.trim().length === 0) {
      throw new Error('description is required');
    }
    if (props.description.length > 2000) {
      throw new Error('description must be 2000 characters or less');
    }
    if (!props.performedBy || props.performedBy <= 0) {
      throw new Error('performedBy is required and must be valid user ID');
    }
    if (!props.organizationId || props.organizationId <= 0) {
      throw new Error('organizationId is required and must be positive');
    }
    if (props.durationMinutes !== undefined && props.durationMinutes < 0) {
      throw new Error('durationMinutes cannot be negative');
    }
    if (props.cost !== undefined && props.cost < 0) {
      throw new Error('cost cannot be negative');
    }

    return new ResponseAction(props, id);
  }

  // Getters
  public get incidentId(): number {
    return this._incidentId;
  }

  public get actionType(): ResponseTypeVO {
    return this._actionType;
  }

  public get description(): string {
    return this._description;
  }

  public get performedBy(): number {
    return this._performedBy;
  }

  public get performedAt(): Date {
    return this._performedAt;
  }

  public get status(): ActionStatusVO {
    return this._status;
  }

  public get outcome(): string | undefined {
    return this._outcome;
  }

  public get evidenceUrls(): string[] {
    return [...this._evidenceUrls];
  }

  public get durationMinutes(): number | undefined {
    return this._durationMinutes;
  }

  public get cost(): number | undefined {
    return this._cost;
  }

  public get toolsUsed(): string[] {
    return [...this._toolsUsed];
  }

  public get affectedSystems(): string[] {
    return [...this._affectedSystems];
  }

  public get notes(): string | undefined {
    return this._notes;
  }

  public get reviewedBy(): number | undefined {
    return this._reviewedBy;
  }

  public get reviewedAt(): Date | undefined {
    return this._reviewedAt;
  }

  public get reviewComments(): string | undefined {
    return this._reviewComments;
  }

  public get organizationId(): number {
    return this._organizationId;
  }

  public get createdAt(): Date {
    return this._createdAt;
  }

  public get updatedAt(): Date {
    return this._updatedAt;
  }

  // Business logic methods

  /**
   * Update action status
   */
  public updateStatus(newStatus: ActionStatus): void {
    if (!this._status.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${this._status.value} to ${newStatus}`);
    }

    this._status = ActionStatusVO.create(newStatus);
    this.touch();
  }

  /**
   * Complete the action with outcome
   */
  public complete(outcome: string): void {
    if (this._status.value === ActionStatus.Completed) {
      throw new Error('Action is already completed');
    }
    if (this._status.value === ActionStatus.Cancelled) {
      throw new Error('Cannot complete a cancelled action');
    }

    this._status = ActionStatusVO.create(ActionStatus.Completed);
    this._outcome = outcome;
    this.touch();
  }

  /**
   * Cancel the action with reason
   */
  public cancel(reason: string): void {
    if (this._status.value === ActionStatus.Completed) {
      throw new Error('Cannot cancel a completed action');
    }
    if (this._status.value === ActionStatus.Cancelled) {
      throw new Error('Action is already cancelled');
    }

    this._status = ActionStatusVO.create(ActionStatus.Cancelled);
    this._outcome = `Cancelled: ${reason}`;
    this.touch();
  }

  /**
   * Add evidence URL
   */
  public addEvidence(url: string): void {
    if (!url || url.trim().length === 0) {
      throw new Error('Evidence URL cannot be empty');
    }
    if (this._evidenceUrls.includes(url)) {
      throw new Error('Evidence URL already exists');
    }

    this._evidenceUrls.push(url);
    this.touch();
  }

  /**
   * Remove evidence URL
   */
  public removeEvidence(url: string): void {
    const index = this._evidenceUrls.indexOf(url);
    if (index === -1) {
      throw new Error('Evidence URL not found');
    }

    this._evidenceUrls.splice(index, 1);
    this.touch();
  }

  /**
   * Add tool used
   */
  public addTool(tool: string): void {
    if (!tool || tool.trim().length === 0) {
      throw new Error('Tool name cannot be empty');
    }
    if (this._toolsUsed.includes(tool)) {
      throw new Error('Tool already added');
    }

    this._toolsUsed.push(tool);
    this.touch();
  }

  /**
   * Add affected system
   */
  public addAffectedSystem(system: string): void {
    if (!system || system.trim().length === 0) {
      throw new Error('System name cannot be empty');
    }
    if (this._affectedSystems.includes(system)) {
      throw new Error('System already added');
    }

    this._affectedSystems.push(system);
    this.touch();
  }

  /**
   * Set duration in minutes
   */
  public setDuration(minutes: number): void {
    if (minutes < 0) {
      throw new Error('Duration cannot be negative');
    }

    this._durationMinutes = minutes;
    this.touch();
  }

  /**
   * Set cost
   */
  public setCost(cost: number): void {
    if (cost < 0) {
      throw new Error('Cost cannot be negative');
    }

    this._cost = cost;
    this.touch();
  }

  /**
   * Add or update notes
   */
  public updateNotes(notes: string): void {
    if (notes && notes.length > 2000) {
      throw new Error('Notes must be 2000 characters or less');
    }

    this._notes = notes;
    this.touch();
  }

  /**
   * Submit for peer review
   */
  public submitForReview(): void {
    if (this._status.value !== ActionStatus.Completed) {
      throw new Error('Only completed actions can be submitted for review');
    }
    if (this._reviewedBy) {
      throw new Error('Action already reviewed');
    }

    // Action is ready for review (reviewedBy will be set by reviewer)
    this.touch();
  }

  /**
   * Peer review the action
   */
  public review(reviewerId: number, comments: string): void {
    if (this._status.value !== ActionStatus.Completed) {
      throw new Error('Only completed actions can be reviewed');
    }
    if (this._reviewedBy) {
      throw new Error('Action already reviewed');
    }
    if (reviewerId === this._performedBy) {
      throw new Error('Cannot review your own action');
    }

    this._reviewedBy = reviewerId;
    this._reviewedAt = new Date();
    this._reviewComments = comments;
    this.touch();
  }

  /**
   * Check if action is overdue (if status is pending/in_progress and performed_at is in the past)
   */
  public isOverdue(): boolean {
    if (this._status.isCompleted() || this._status.value === ActionStatus.Cancelled) {
      return false;
    }

    // If action was scheduled for the past and still not completed
    return this._performedAt < new Date();
  }

  /**
   * Check if action requires review
   */
  public requiresReview(): boolean {
    return this._actionType.requiresPeerReview() && 
           this._status.value === ActionStatus.Completed && 
           !this._reviewedBy;
  }

  /**
   * Check if action has been reviewed
   */
  public isReviewed(): boolean {
    return !!this._reviewedBy && !!this._reviewedAt;
  }

  /**
   * Get action effectiveness score (0-100)
   * Based on completion, timeliness, documentation quality
   */
  public getEffectivenessScore(): number {
    let score = 0;

    // Completion (40 points)
    if (this._status.value === ActionStatus.Completed) {
      score += 40;
    } else if (this._status.value === ActionStatus.InProgress) {
      score += 20;
    }

    // Documentation quality (30 points)
    if (this._outcome && this._outcome.length > 50) score += 10;
    if (this._evidenceUrls.length > 0) score += 10;
    if (this._notes && this._notes.length > 50) score += 10;

    // Timeliness (15 points)
    if (!this.isOverdue()) score += 15;

    // Peer review (15 points)
    if (this.isReviewed()) score += 15;

    return Math.min(score, 100);
  }

  /**
   * Calculate response time efficiency
   * Returns percentage: 100% = on time, <100% = overdue
   */
  public getResponseEfficiency(): number | null {
    if (!this._durationMinutes || this._status.value !== ActionStatus.Completed) {
      return null;
    }

    const expectedDuration = this._actionType.getTypicalDurationMinutes();
    if (expectedDuration === 0) return 100;

    const efficiency = (expectedDuration / this._durationMinutes) * 100;
    return Math.round(efficiency * 10) / 10;
  }

  /**
   * Update timestamp
   */
  private touch(): void {
    this._updatedAt = new Date();
  }

  /**
   * Convert to plain object for serialization
   */
  public toJSON(): any {
    return {
      id: this._id,
      incidentId: this._incidentId,
      actionType: this._actionType.value,
      actionTypeLabel: this._actionType.getLabel(),
      actionTypePriority: this._actionType.getPriority(),
      description: this._description,
      performedBy: this._performedBy,
      performedAt: this._performedAt.toISOString(),
      status: this._status.value,
      statusLabel: this._status.getLabel(),
      statusPhase: this._status.getPhase(),
      outcome: this._outcome,
      evidenceUrls: this._evidenceUrls,
      evidenceCount: this._evidenceUrls.length,
      durationMinutes: this._durationMinutes,
      durationHours: this._durationMinutes ? Math.round(this._durationMinutes / 60 * 10) / 10 : null,
      cost: this._cost,
      toolsUsed: this._toolsUsed,
      toolsCount: this._toolsUsed.length,
      affectedSystems: this._affectedSystems,
      affectedSystemsCount: this._affectedSystems.length,
      notes: this._notes,
      reviewedBy: this._reviewedBy,
      reviewedAt: this._reviewedAt?.toISOString(),
      reviewComments: this._reviewComments,
      isReviewed: this.isReviewed(),
      requiresReview: this.requiresReview(),
      isOverdue: this.isOverdue(),
      effectivenessScore: this.getEffectivenessScore(),
      responseEfficiency: this.getResponseEfficiency(),
      requiresPeerReview: this._actionType.requiresPeerReview(),
      typicalDuration: this._actionType.getTypicalDurationMinutes(),
      organizationId: this._organizationId,
      createdAt: this._createdAt.toISOString(),
      updatedAt: this._updatedAt.toISOString()
    };
  }
}
