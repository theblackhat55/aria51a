/**
 * ComplianceFramework - Aggregate Root for compliance frameworks
 * 
 * Represents a compliance/security framework (e.g., NIST CSF, ISO 27001)
 * Manages the lifecycle and consistency of related controls
 */

import { AggregateRoot } from '@/shared/domain/AggregateRoot';
import { FrameworkType, FrameworkTypeVO } from '../value-objects/FrameworkType';

export interface ComplianceFrameworkProps {
  id: number;
  name: string;
  type: FrameworkType;
  version: string;
  description: string;
  scope?: string;
  targetCompletionDate?: Date;
  certificationDate?: Date;
  expiryDate?: Date;
  isActive: boolean;
  totalControls: number;
  implementedControls: number;
  organizationId: number;
  ownerId?: number;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ComplianceFramework extends AggregateRoot<number> {
  private _name: string;
  private _type: FrameworkTypeVO;
  private _version: string;
  private _description: string;
  private _scope?: string;
  private _targetCompletionDate?: Date;
  private _certificationDate?: Date;
  private _expiryDate?: Date;
  private _isActive: boolean;
  private _totalControls: number;
  private _implementedControls: number;
  private _organizationId: number;
  private _ownerId?: number;
  private _createdBy: number;

  private constructor(props: ComplianceFrameworkProps) {
    super(props.id, props.createdAt, props.updatedAt);
    this._name = props.name;
    this._type = FrameworkTypeVO.create(props.type);
    this._version = props.version;
    this._description = props.description;
    this._scope = props.scope;
    this._targetCompletionDate = props.targetCompletionDate;
    this._certificationDate = props.certificationDate;
    this._expiryDate = props.expiryDate;
    this._isActive = props.isActive;
    this._totalControls = props.totalControls;
    this._implementedControls = props.implementedControls;
    this._organizationId = props.organizationId;
    this._ownerId = props.ownerId;
    this._createdBy = props.createdBy;
  }

  /**
   * Create a new ComplianceFramework
   */
  static create(props: Omit<ComplianceFrameworkProps, 'id' | 'totalControls' | 'implementedControls' | 'createdAt' | 'updatedAt'>): ComplianceFramework {
    // Validation
    ComplianceFramework.validateName(props.name);
    ComplianceFramework.validateDescription(props.description);
    ComplianceFramework.validateVersion(props.version);

    return new ComplianceFramework({
      id: 0,
      totalControls: 0,
      implementedControls: 0,
      ...props,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Reconstitute from persistence
   */
  static reconstitute(props: ComplianceFrameworkProps): ComplianceFramework {
    return new ComplianceFramework(props);
  }

  // Getters
  get name(): string {
    return this._name;
  }

  get type(): FrameworkTypeVO {
    return this._type;
  }

  get version(): string {
    return this._version;
  }

  get description(): string {
    return this._description;
  }

  get scope(): string | undefined {
    return this._scope;
  }

  get targetCompletionDate(): Date | undefined {
    return this._targetCompletionDate;
  }

  get certificationDate(): Date | undefined {
    return this._certificationDate;
  }

  get expiryDate(): Date | undefined {
    return this._expiryDate;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get totalControls(): number {
    return this._totalControls;
  }

  get implementedControls(): number {
    return this._implementedControls;
  }

  get organizationId(): number {
    return this._organizationId;
  }

  get ownerId(): number | undefined {
    return this._ownerId;
  }

  get createdBy(): number {
    return this._createdBy;
  }

  // Business Logic Methods

  /**
   * Calculate completion percentage
   */
  getCompletionPercentage(): number {
    if (this._totalControls === 0) {
      return 0;
    }
    return Math.round((this._implementedControls / this._totalControls) * 100);
  }

  /**
   * Check if framework is overdue
   */
  isOverdue(): boolean {
    if (!this._targetCompletionDate) {
      return false;
    }
    return this._targetCompletionDate < new Date() && this.getCompletionPercentage() < 100;
  }

  /**
   * Check if certification is expired
   */
  isCertificationExpired(): boolean {
    if (!this._expiryDate) {
      return false;
    }
    return this._expiryDate < new Date();
  }

  /**
   * Check if certification is expiring soon (within 90 days)
   */
  isCertificationExpiringSoon(): boolean {
    if (!this._expiryDate) {
      return false;
    }
    const ninetyDaysFromNow = new Date();
    ninetyDaysFromNow.setDate(ninetyDaysFromNow.getDate() + 90);
    return this._expiryDate <= ninetyDaysFromNow && this._expiryDate > new Date();
  }

  /**
   * Update control counts
   */
  updateControlCounts(totalControls: number, implementedControls: number): void {
    if (totalControls < 0 || implementedControls < 0) {
      throw new Error('Control counts cannot be negative');
    }
    if (implementedControls > totalControls) {
      throw new Error('Implemented controls cannot exceed total controls');
    }
    this._totalControls = totalControls;
    this._implementedControls = implementedControls;
    this.touch();
  }

  /**
   * Mark framework as certified
   */
  markAsCertified(certificationDate: Date = new Date(), expiryDate?: Date): void {
    this._certificationDate = certificationDate;
    if (expiryDate) {
      if (expiryDate <= certificationDate) {
        throw new Error('Expiry date must be after certification date');
      }
      this._expiryDate = expiryDate;
    }
    this.touch();
  }

  /**
   * Deactivate framework
   */
  deactivate(): void {
    this._isActive = false;
    this.touch();
  }

  /**
   * Reactivate framework
   */
  reactivate(): void {
    this._isActive = true;
    this.touch();
  }

  /**
   * Update scope
   */
  updateScope(scope: string): void {
    this._scope = scope;
    this.touch();
  }

  /**
   * Assign owner
   */
  assignOwner(ownerId: number): void {
    this._ownerId = ownerId;
    this.touch();
  }

  /**
   * Update target completion date
   */
  updateTargetCompletionDate(date: Date): void {
    this._targetCompletionDate = date;
    this.touch();
  }

  // Validation Methods
  private static validateName(name: string): void {
    if (!name || name.trim().length < 3) {
      throw new Error('Framework name must be at least 3 characters long');
    }
    if (name.length > 200) {
      throw new Error('Framework name must not exceed 200 characters');
    }
  }

  private static validateDescription(description: string): void {
    if (!description || description.trim().length < 10) {
      throw new Error('Framework description must be at least 10 characters long');
    }
    if (description.length > 2000) {
      throw new Error('Framework description must not exceed 2000 characters');
    }
  }

  private static validateVersion(version: string): void {
    if (!version || version.trim().length === 0) {
      throw new Error('Framework version is required');
    }
    if (version.length > 50) {
      throw new Error('Framework version must not exceed 50 characters');
    }
  }

  public toJSON(): Record<string, any> {
    return {
      id: this._id,
      name: this._name,
      type: this._type.value,
      typeDisplay: this._type.display,
      typeShortName: this._type.shortName,
      version: this._version,
      description: this._description,
      scope: this._scope,
      targetCompletionDate: this._targetCompletionDate,
      certificationDate: this._certificationDate,
      expiryDate: this._expiryDate,
      isActive: this._isActive,
      totalControls: this._totalControls,
      implementedControls: this._implementedControls,
      completionPercentage: this.getCompletionPercentage(),
      isOverdue: this.isOverdue(),
      isCertified: !!this._certificationDate,
      isCertificationExpired: this.isCertificationExpired(),
      isCertificationExpiringSoon: this.isCertificationExpiringSoon(),
      isRegulatory: this._type.isRegulatory(),
      isCertifiable: this._type.isCertifiable(),
      organizationId: this._organizationId,
      ownerId: this._ownerId,
      createdBy: this._createdBy,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt
    };
  }
}
