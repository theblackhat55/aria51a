/**
 * Assessment - Entity representing a compliance assessment/audit
 * 
 * Records the results of compliance assessments for controls
 */

import { Entity } from '@/shared/domain/Entity';
import { AssessmentResult, AssessmentResultVO } from '../value-objects/AssessmentResult';

export interface AssessmentProps {
  id: number;
  controlId: number;
  frameworkId: number;
  assessmentDate: Date;
  assessor: string;
  assessorId?: number;
  result: AssessmentResult;
  score?: number;
  findings?: string;
  recommendations?: string;
  evidenceIds?: string;          // JSON array of evidence IDs
  remediationRequired: boolean;
  remediationDeadline?: Date;
  remediationCompletedDate?: Date;
  nextAssessmentDate?: Date;
  organizationId: number;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export class Assessment extends Entity<number> {
  private _controlId: number;
  private _frameworkId: number;
  private _assessmentDate: Date;
  private _assessor: string;
  private _assessorId?: number;
  private _result: AssessmentResultVO;
  private _score?: number;
  private _findings?: string;
  private _recommendations?: string;
  private _evidenceIds?: string;
  private _remediationRequired: boolean;
  private _remediationDeadline?: Date;
  private _remediationCompletedDate?: Date;
  private _nextAssessmentDate?: Date;
  private _organizationId: number;
  private _createdBy: number;

  private constructor(props: AssessmentProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._controlId = props.controlId;
    this._frameworkId = props.frameworkId;
    this._assessmentDate = props.assessmentDate;
    this._assessor = props.assessor;
    this._assessorId = props.assessorId;
    this._result = AssessmentResultVO.create(props.result);
    this._score = props.score;
    this._findings = props.findings;
    this._recommendations = props.recommendations;
    this._evidenceIds = props.evidenceIds;
    this._remediationRequired = props.remediationRequired;
    this._remediationDeadline = props.remediationDeadline;
    this._remediationCompletedDate = props.remediationCompletedDate;
    this._nextAssessmentDate = props.nextAssessmentDate;
    this._organizationId = props.organizationId;
    this._createdBy = props.createdBy;
  }

  /**
   * Create a new Assessment
   */
  static create(props: Omit<AssessmentProps, 'id' | 'createdAt' | 'updatedAt'>): Assessment {
    // Validation
    Assessment.validateAssessor(props.assessor);
    if (props.findings) {
      Assessment.validateFindings(props.findings);
    }

    return new Assessment({
      id: 0,
      ...props,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(props: AssessmentProps): Assessment {
    return new Assessment(props);
  }

  // Getters
  get controlId(): number {
    return this._controlId;
  }

  get frameworkId(): number {
    return this._frameworkId;
  }

  get assessmentDate(): Date {
    return this._assessmentDate;
  }

  get assessor(): string {
    return this._assessor;
  }

  get assessorId(): number | undefined {
    return this._assessorId;
  }

  get result(): AssessmentResultVO {
    return this._result;
  }

  get score(): number | undefined {
    return this._score;
  }

  get findings(): string | undefined {
    return this._findings;
  }

  get recommendations(): string | undefined {
    return this._recommendations;
  }

  get evidenceIds(): string | undefined {
    return this._evidenceIds;
  }

  get remediationRequired(): boolean {
    return this._remediationRequired;
  }

  get remediationDeadline(): Date | undefined {
    return this._remediationDeadline;
  }

  get remediationCompletedDate(): Date | undefined {
    return this._remediationCompletedDate;
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
   * Update assessment result
   */
  updateResult(result: AssessmentResult, score?: number): void {
    this._result = AssessmentResultVO.create(result);
    this._score = score;
    this._remediationRequired = this._result.requiresAction();
    this.touch();
  }

  /**
   * Add findings
   */
  addFindings(findings: string): void {
    Assessment.validateFindings(findings);
    this._findings = findings;
    this.touch();
  }

  /**
   * Add recommendations
   */
  addRecommendations(recommendations: string): void {
    this._recommendations = recommendations;
    this.touch();
  }

  /**
   * Set remediation deadline
   */
  setRemediationDeadline(deadline: Date): void {
    if (deadline <= new Date()) {
      throw new Error('Remediation deadline must be in the future');
    }
    this._remediationDeadline = deadline;
    this._remediationRequired = true;
    this.touch();
  }

  /**
   * Mark remediation as completed
   */
  completeRemediation(completionDate: Date = new Date()): void {
    if (!this._remediationRequired) {
      throw new Error('No remediation was required');
    }
    this._remediationCompletedDate = completionDate;
    this._remediationRequired = false;
    this.touch();
  }

  /**
   * Check if remediation is overdue
   */
  isRemediationOverdue(): boolean {
    if (!this._remediationRequired || !this._remediationDeadline) {
      return false;
    }
    return this._remediationDeadline < new Date();
  }

  /**
   * Schedule next assessment
   */
  scheduleNextAssessment(date: Date): void {
    if (date <= this._assessmentDate) {
      throw new Error('Next assessment date must be after current assessment date');
    }
    this._nextAssessmentDate = date;
    this.touch();
  }

  /**
   * Get assessment age in days
   */
  getAssessmentAgeDays(): number {
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - this._assessmentDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Parse evidence IDs from JSON string
   */
  getEvidenceIdList(): number[] {
    if (!this._evidenceIds) {
      return [];
    }
    try {
      return JSON.parse(this._evidenceIds);
    } catch {
      return [];
    }
  }

  // Validation Methods
  private static validateAssessor(assessor: string): void {
    if (!assessor || assessor.trim().length < 2) {
      throw new Error('Assessor name must be at least 2 characters long');
    }
    if (assessor.length > 100) {
      throw new Error('Assessor name must not exceed 100 characters');
    }
  }

  private static validateFindings(findings: string): void {
    if (findings && findings.length > 5000) {
      throw new Error('Findings must not exceed 5000 characters');
    }
  }

  public toJSON(): Record<string, any> {
    return {
      id: this._id,
      controlId: this._controlId,
      frameworkId: this._frameworkId,
      assessmentDate: this._assessmentDate,
      assessor: this._assessor,
      assessorId: this._assessorId,
      result: this._result.value,
      resultDisplay: this._result.display,
      resultColor: this._result.color,
      score: this._score,
      findings: this._findings,
      recommendations: this._recommendations,
      evidenceIds: this.getEvidenceIdList(),
      remediationRequired: this._remediationRequired,
      remediationDeadline: this._remediationDeadline,
      remediationCompletedDate: this._remediationCompletedDate,
      remediationOverdue: this.isRemediationOverdue(),
      nextAssessmentDate: this._nextAssessmentDate,
      assessmentAgeDays: this.getAssessmentAgeDays(),
      organizationId: this._organizationId,
      createdBy: this._createdBy,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
}
