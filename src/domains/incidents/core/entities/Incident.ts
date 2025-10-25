/**
 * Incident - Aggregate Root for security incident management
 * 
 * Represents a security incident through its complete lifecycle
 */

import { AggregateRoot } from '@/shared/domain/AggregateRoot';
import { IncidentSeverity, IncidentSeverityVO } from '../value-objects/IncidentSeverity';
import { IncidentStatus, IncidentStatusVO } from '../value-objects/IncidentStatus';
import { ImpactLevel, ImpactLevelVO } from '../value-objects/ImpactLevel';
import { IncidentCategory, IncidentCategoryVO } from '../value-objects/IncidentCategory';

export interface IncidentProps {
  id: number;
  incidentId: string;            // e.g., "INC-2024-001"
  title: string;
  description: string;
  category: IncidentCategory;
  severity: IncidentSeverity;
  status: IncidentStatus;
  impactLevel: ImpactLevel;
  detectedAt: Date;
  reportedBy: string;
  reporterId?: number;
  assignedTo?: number;
  affectedSystems?: string;      // Comma-separated or JSON
  affectedUsers?: number;
  dataCompromised: boolean;
  estimatedCost?: number;
  actualCost?: number;
  containedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  rootCause?: string;
  lessonsLearned?: string;
  relatedRiskIds?: string;       // JSON array of risk IDs
  relatedAssetIds?: string;      // JSON array of asset IDs
  organizationId: number;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Incident extends AggregateRoot<number> {
  private _incidentId: string;
  private _title: string;
  private _description: string;
  private _category: IncidentCategoryVO;
  private _severity: IncidentSeverityVO;
  private _status: IncidentStatusVO;
  private _impactLevel: ImpactLevelVO;
  private _detectedAt: Date;
  private _reportedBy: string;
  private _reporterId?: number;
  private _assignedTo?: number;
  private _affectedSystems?: string;
  private _affectedUsers?: number;
  private _dataCompromised: boolean;
  private _estimatedCost?: number;
  private _actualCost?: number;
  private _containedAt?: Date;
  private _resolvedAt?: Date;
  private _closedAt?: Date;
  private _rootCause?: string;
  private _lessonsLearned?: string;
  private _relatedRiskIds?: string;
  private _relatedAssetIds?: string;
  private _organizationId: number;
  private _createdBy: number;

  private constructor(props: IncidentProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._incidentId = props.incidentId;
    this._title = props.title;
    this._description = props.description;
    this._category = IncidentCategoryVO.create(props.category);
    this._severity = IncidentSeverityVO.create(props.severity);
    this._status = IncidentStatusVO.create(props.status);
    this._impactLevel = ImpactLevelVO.create(props.impactLevel);
    this._detectedAt = props.detectedAt;
    this._reportedBy = props.reportedBy;
    this._reporterId = props.reporterId;
    this._assignedTo = props.assignedTo;
    this._affectedSystems = props.affectedSystems;
    this._affectedUsers = props.affectedUsers;
    this._dataCompromised = props.dataCompromised;
    this._estimatedCost = props.estimatedCost;
    this._actualCost = props.actualCost;
    this._containedAt = props.containedAt;
    this._resolvedAt = props.resolvedAt;
    this._closedAt = props.closedAt;
    this._rootCause = props.rootCause;
    this._lessonsLearned = props.lessonsLearned;
    this._relatedRiskIds = props.relatedRiskIds;
    this._relatedAssetIds = props.relatedAssetIds;
    this._organizationId = props.organizationId;
    this._createdBy = props.createdBy;
  }

  /**
   * Create a new Incident
   */
  static create(props: Omit<IncidentProps, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Incident {
    // Validation
    Incident.validateTitle(props.title);
    Incident.validateDescription(props.description);
    Incident.validateIncidentId(props.incidentId);

    return new Incident({
      id: 0,
      status: IncidentStatus.Detected,  // Initial status
      ...props,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(props: IncidentProps): Incident {
    return new Incident(props);
  }

  // Getters
  get incidentId(): string {
    return this._incidentId;
  }

  get title(): string {
    return this._title;
  }

  get description(): string {
    return this._description;
  }

  get category(): IncidentCategoryVO {
    return this._category;
  }

  get severity(): IncidentSeverityVO {
    return this._severity;
  }

  get status(): IncidentStatusVO {
    return this._status;
  }

  get impactLevel(): ImpactLevelVO {
    return this._impactLevel;
  }

  get detectedAt(): Date {
    return this._detectedAt;
  }

  get reportedBy(): string {
    return this._reportedBy;
  }

  get reporterId(): number | undefined {
    return this._reporterId;
  }

  get assignedTo(): number | undefined {
    return this._assignedTo;
  }

  get affectedSystems(): string | undefined {
    return this._affectedSystems;
  }

  get affectedUsers(): number | undefined {
    return this._affectedUsers;
  }

  get dataCompromised(): boolean {
    return this._dataCompromised;
  }

  get estimatedCost(): number | undefined {
    return this._estimatedCost;
  }

  get actualCost(): number | undefined {
    return this._actualCost;
  }

  get containedAt(): Date | undefined {
    return this._containedAt;
  }

  get resolvedAt(): Date | undefined {
    return this._resolvedAt;
  }

  get closedAt(): Date | undefined {
    return this._closedAt;
  }

  get rootCause(): string | undefined {
    return this._rootCause;
  }

  get lessonsLearned(): string | undefined {
    return this._lessonsLearned;
  }

  get relatedRiskIds(): string | undefined {
    return this._relatedRiskIds;
  }

  get relatedAssetIds(): string | undefined {
    return this._relatedAssetIds;
  }

  get organizationId(): number {
    return this._organizationId;
  }

  get createdBy(): number {
    return this._createdBy;
  }

  // Business Logic Methods

  /**
   * Update incident status with validation and timestamp tracking
   */
  updateStatus(newStatus: IncidentStatus): void {
    if (!this._status.canTransitionTo(newStatus)) {
      throw new Error(`Cannot transition from ${this._status.value} to ${newStatus}`);
    }

    const oldStatus = this._status.value;
    this._status = IncidentStatusVO.create(newStatus);

    // Update timestamps based on status changes
    if (newStatus === IncidentStatus.Contained && !this._containedAt) {
      this._containedAt = new Date();
    }
    if (newStatus === IncidentStatus.Resolved && !this._resolvedAt) {
      this._resolvedAt = new Date();
    }
    if (newStatus === IncidentStatus.Closed && !this._closedAt) {
      this._closedAt = new Date();
    }

    this.touch();
  }

  /**
   * Escalate incident severity
   */
  escalate(newSeverity: IncidentSeverity): void {
    if (this._severity.priority >= IncidentSeverityVO.create(newSeverity).priority) {
      throw new Error('Can only escalate to higher severity');
    }
    this._severity = IncidentSeverityVO.create(newSeverity);
    this.touch();
  }

  /**
   * Assign incident to a responder
   */
  assignTo(userId: number): void {
    this._assignedTo = userId;
    this.touch();
  }

  /**
   * Update impact assessment
   */
  updateImpact(impactLevel: ImpactLevel, affectedUsers?: number, estimatedCost?: number): void {
    this._impactLevel = ImpactLevelVO.create(impactLevel);
    if (affectedUsers !== undefined) {
      this._affectedUsers = affectedUsers;
    }
    if (estimatedCost !== undefined) {
      this._estimatedCost = estimatedCost;
    }
    this.touch();
  }

  /**
   * Record root cause analysis
   */
  recordRootCause(rootCause: string): void {
    if (rootCause.length < 10) {
      throw new Error('Root cause must be at least 10 characters');
    }
    this._rootCause = rootCause;
    this.touch();
  }

  /**
   * Record lessons learned
   */
  recordLessonsLearned(lessons: string): void {
    if (lessons.length < 10) {
      throw new Error('Lessons learned must be at least 10 characters');
    }
    this._lessonsLearned = lessons;
    this.touch();
  }

  /**
   * Mark as data breach
   */
  markAsDataBreach(): void {
    this._dataCompromised = true;
    // Auto-escalate severity if not already critical
    if (this._severity.value !== IncidentSeverity.Critical) {
      this._severity = IncidentSeverityVO.create(IncidentSeverity.Critical);
    }
    this.touch();
  }

  /**
   * Calculate time to contain (in hours)
   */
  getTimeToContain(): number | null {
    if (!this._containedAt) {
      return null;
    }
    const diff = this._containedAt.getTime() - this._detectedAt.getTime();
    return Math.round(diff / (1000 * 60 * 60) * 10) / 10; // Hours with 1 decimal
  }

  /**
   * Calculate time to resolve (in hours)
   */
  getTimeToResolve(): number | null {
    if (!this._resolvedAt) {
      return null;
    }
    const diff = this._resolvedAt.getTime() - this._detectedAt.getTime();
    return Math.round(diff / (1000 * 60 * 60) * 10) / 10;
  }

  /**
   * Check if SLA is breached
   */
  isSLABreached(): boolean {
    if (this._status.isClosed()) {
      return false;  // Closed incidents don't count
    }
    
    const now = new Date();
    const hoursSinceDetection = (now.getTime() - this._detectedAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceDetection > this._severity.slaHours;
  }

  /**
   * Get hours remaining before SLA breach
   */
  getSLAHoursRemaining(): number {
    const now = new Date();
    const hoursSinceDetection = (now.getTime() - this._detectedAt.getTime()) / (1000 * 60 * 60);
    const remaining = this._severity.slaHours - hoursSinceDetection;
    return Math.max(0, Math.round(remaining * 10) / 10);
  }

  // Validation Methods
  private static validateIncidentId(incidentId: string): void {
    if (!incidentId || incidentId.trim().length === 0) {
      throw new Error('Incident ID is required');
    }
    if (incidentId.length > 50) {
      throw new Error('Incident ID must not exceed 50 characters');
    }
  }

  private static validateTitle(title: string): void {
    if (!title || title.trim().length < 5) {
      throw new Error('Incident title must be at least 5 characters long');
    }
    if (title.length > 200) {
      throw new Error('Incident title must not exceed 200 characters');
    }
  }

  private static validateDescription(description: string): void {
    if (!description || description.trim().length < 10) {
      throw new Error('Incident description must be at least 10 characters long');
    }
    if (description.length > 5000) {
      throw new Error('Incident description must not exceed 5000 characters');
    }
  }

  public toJSON(): Record<string, any> {
    return {
      id: this._id,
      incidentId: this._incidentId,
      title: this._title,
      description: this._description,
      category: this._category.value,
      categoryDisplay: this._category.display,
      categoryIcon: this._category.icon,
      severity: this._severity.value,
      severityDisplay: this._severity.display,
      severityColor: this._severity.color,
      severityPriority: this._severity.priority,
      status: this._status.value,
      statusDisplay: this._status.display,
      statusColor: this._status.color,
      statusPhase: this._status.phase,
      progressPercentage: this._status.progressPercentage,
      impactLevel: this._impactLevel.value,
      impactDisplay: this._impactLevel.display,
      impactColor: this._impactLevel.color,
      impactScore: this._impactLevel.score,
      detectedAt: this._detectedAt,
      reportedBy: this._reportedBy,
      reporterId: this._reporterId,
      assignedTo: this._assignedTo,
      affectedSystems: this._affectedSystems,
      affectedUsers: this._affectedUsers,
      dataCompromised: this._dataCompromised,
      estimatedCost: this._estimatedCost,
      actualCost: this._actualCost,
      containedAt: this._containedAt,
      resolvedAt: this._resolvedAt,
      closedAt: this._closedAt,
      timeToContain: this.getTimeToContain(),
      timeToResolve: this.getTimeToResolve(),
      slaBreached: this.isSLABreached(),
      slaHoursRemaining: this.getSLAHoursRemaining(),
      rootCause: this._rootCause,
      lessonsLearned: this._lessonsLearned,
      relatedRiskIds: this._relatedRiskIds ? JSON.parse(this._relatedRiskIds) : [],
      relatedAssetIds: this._relatedAssetIds ? JSON.parse(this._relatedAssetIds) : [],
      requiresForensics: this._category.requiresForensics(),
      requiresLegalReview: this._category.requiresLegalReview(),
      requiresExecutiveNotification: this._impactLevel.requiresExecutiveNotification(),
      organizationId: this._organizationId,
      createdBy: this._createdBy,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
}
