/**
 * Control - Entity representing a security/compliance control
 * 
 * A control is a specific requirement or safeguard within a compliance framework
 */

import { Entity } from '@/shared/domain/Entity';
import { ControlStatus, ControlStatusVO } from '../value-objects/ControlStatus';

export interface ControlProps {
  id: number;
  frameworkId: number;
  controlId: string;              // e.g., "AC-1", "PR.AC-1"
  title: string;
  description: string;
  category?: string;
  status: ControlStatus;
  implementationNotes?: string;
  assignedTo?: number;            // User ID
  evidenceRequired: boolean;
  testingRequired: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  implementationDate?: Date;
  lastAssessedDate?: Date;
  nextAssessmentDate?: Date;
  organizationId: number;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Control extends Entity<number> {
  private _frameworkId: number;
  private _controlId: string;
  private _title: string;
  private _description: string;
  private _category?: string;
  private _status: ControlStatusVO;
  private _implementationNotes?: string;
  private _assignedTo?: number;
  private _evidenceRequired: boolean;
  private _testingRequired: boolean;
  private _priority: 'critical' | 'high' | 'medium' | 'low';
  private _implementationDate?: Date;
  private _lastAssessedDate?: Date;
  private _nextAssessmentDate?: Date;
  private _organizationId: number;
  private _createdBy: number;

  private constructor(props: ControlProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._frameworkId = props.frameworkId;
    this._controlId = props.controlId;
    this._title = props.title;
    this._description = props.description;
    this._category = props.category;
    this._status = ControlStatusVO.create(props.status);
    this._implementationNotes = props.implementationNotes;
    this._assignedTo = props.assignedTo;
    this._evidenceRequired = props.evidenceRequired;
    this._testingRequired = props.testingRequired;
    this._priority = props.priority;
    this._implementationDate = props.implementationDate;
    this._lastAssessedDate = props.lastAssessedDate;
    this._nextAssessmentDate = props.nextAssessmentDate;
    this._organizationId = props.organizationId;
    this._createdBy = props.createdBy;
  }

  /**
   * Create a new Control
   */
  static create(props: Omit<ControlProps, 'id' | 'createdAt' | 'updatedAt'>): Control {
    // Validation
    Control.validateControlId(props.controlId);
    Control.validateTitle(props.title);
    Control.validateDescription(props.description);

    return new Control({
      id: 0, // Will be assigned by repository
      ...props,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(props: ControlProps): Control {
    return new Control(props);
  }

  // Getters
  get frameworkId(): number {
    return this._frameworkId;
  }

  get controlId(): string {
    return this._controlId;
  }

  get title(): string {
    return this._title;
  }

  get description(): string {
    return this._description;
  }

  get category(): string | undefined {
    return this._category;
  }

  get status(): ControlStatusVO {
    return this._status;
  }

  get implementationNotes(): string | undefined {
    return this._implementationNotes;
  }

  get assignedTo(): number | undefined {
    return this._assignedTo;
  }

  get evidenceRequired(): boolean {
    return this._evidenceRequired;
  }

  get testingRequired(): boolean {
    return this._testingRequired;
  }

  get priority(): 'critical' | 'high' | 'medium' | 'low' {
    return this._priority;
  }

  get implementationDate(): Date | undefined {
    return this._implementationDate;
  }

  get lastAssessedDate(): Date | undefined {
    return this._lastAssessedDate;
  }

  get nextAssessmentDate(): Date | undefined {
    return this._nextAssessmentDate;
  }

  get organizationId(): number {
    return this._organizationId;
  }

  get createdBy(): number {
    return this._createdBy;
  }

  // Business Logic Methods

  /**
   * Update control status with validation
   */
  updateStatus(newStatus: ControlStatus): void {
    if (!this._status.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${this._status.value} to ${newStatus}`);
    }
    this._status = ControlStatusVO.create(newStatus);
    this.touch();
  }

  /**
   * Assign control to a user
   */
  assignTo(userId: number): void {
    this._assignedTo = userId;
    this.touch();
  }

  /**
   * Update implementation notes
   */
  updateImplementationNotes(notes: string): void {
    this._implementationNotes = notes;
    this.touch();
  }

  /**
   * Mark control as implemented
   */
  markAsImplemented(implementationDate: Date = new Date()): void {
    this._status = ControlStatusVO.create(ControlStatus.Implemented);
    this._implementationDate = implementationDate;
    this.touch();
  }

  /**
   * Record assessment
   */
  recordAssessment(assessmentDate: Date = new Date(), nextAssessmentDate?: Date): void {
    this._lastAssessedDate = assessmentDate;
    if (nextAssessmentDate) {
      this._nextAssessmentDate = nextAssessmentDate;
    }
    this.touch();
  }

  /**
   * Check if assessment is overdue
   */
  isAssessmentOverdue(): boolean {
    if (!this._nextAssessmentDate) {
      return false;
    }
    return this._nextAssessmentDate < new Date();
  }

  /**
   * Get completion percentage based on status
   */
  getCompletionPercentage(): number {
    return this._status.percentage;
  }

  // Validation Methods
  private static validateControlId(controlId: string): void {
    if (!controlId || controlId.trim().length === 0) {
      throw new Error('Control ID is required');
    }
    if (controlId.length > 50) {
      throw new Error('Control ID must not exceed 50 characters');
    }
  }

  private static validateTitle(title: string): void {
    if (!title || title.trim().length < 3) {
      throw new Error('Control title must be at least 3 characters long');
    }
    if (title.length > 200) {
      throw new Error('Control title must not exceed 200 characters');
    }
  }

  private static validateDescription(description: string): void {
    if (!description || description.trim().length < 10) {
      throw new Error('Control description must be at least 10 characters long');
    }
    if (description.length > 2000) {
      throw new Error('Control description must not exceed 2000 characters');
    }
  }

  public toJSON(): Record<string, any> {
    return {
      id: this._id,
      frameworkId: this._frameworkId,
      controlId: this._controlId,
      title: this._title,
      description: this._description,
      category: this._category,
      status: this._status.value,
      statusDisplay: this._status.display,
      statusColor: this._status.color,
      completionPercentage: this.getCompletionPercentage(),
      implementationNotes: this._implementationNotes,
      assignedTo: this._assignedTo,
      evidenceRequired: this._evidenceRequired,
      testingRequired: this._testingRequired,
      priority: this._priority,
      implementationDate: this._implementationDate,
      lastAssessedDate: this._lastAssessedDate,
      nextAssessmentDate: this._nextAssessmentDate,
      assessmentOverdue: this.isAssessmentOverdue(),
      organizationId: this._organizationId,
      createdBy: this._createdBy,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
}
