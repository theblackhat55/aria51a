/**
 * RiskStatus - Value object representing risk lifecycle status
 */

export enum RiskStatus {
  Active = 'active',
  Mitigated = 'mitigated',
  Accepted = 'accepted',
  Transferred = 'transferred',
  Avoided = 'avoided',
  Closed = 'closed',
  UnderReview = 'under_review'
}

export class RiskStatusVO {
  private constructor(private readonly _value: RiskStatus) {}

  static create(value: string): RiskStatusVO {
    const upperValue = value.toLowerCase();
    
    // Validate against enum
    if (!Object.values(RiskStatus).includes(upperValue as RiskStatus)) {
      throw new Error(`Invalid risk status: ${value}. Must be one of: ${Object.values(RiskStatus).join(', ')}`);
    }

    return new RiskStatusVO(upperValue as RiskStatus);
  }

  static fromEnum(status: RiskStatus): RiskStatusVO {
    return new RiskStatusVO(status);
  }

  get value(): RiskStatus {
    return this._value;
  }

  get displayName(): string {
    const names: Record<RiskStatus, string> = {
      [RiskStatus.Active]: 'Active',
      [RiskStatus.Mitigated]: 'Mitigated',
      [RiskStatus.Accepted]: 'Accepted',
      [RiskStatus.Transferred]: 'Transferred',
      [RiskStatus.Avoided]: 'Avoided',
      [RiskStatus.Closed]: 'Closed',
      [RiskStatus.UnderReview]: 'Under Review'
    };
    return names[this._value];
  }

  get color(): string {
    const colors: Record<RiskStatus, string> = {
      [RiskStatus.Active]: '#DC2626',      // Red
      [RiskStatus.Mitigated]: '#10B981',   // Green
      [RiskStatus.Accepted]: '#F59E0B',    // Yellow
      [RiskStatus.Transferred]: '#3B82F6', // Blue
      [RiskStatus.Avoided]: '#6B7280',     // Gray
      [RiskStatus.Closed]: '#059669',      // Dark Green
      [RiskStatus.UnderReview]: '#F97316'  // Orange
    };
    return colors[this._value];
  }

  isActive(): boolean {
    return this._value === RiskStatus.Active;
  }

  isClosed(): boolean {
    return this._value === RiskStatus.Closed;
  }

  canTransitionTo(newStatus: RiskStatus): boolean {
    // Define valid transitions
    const validTransitions: Record<RiskStatus, RiskStatus[]> = {
      [RiskStatus.Active]: [RiskStatus.Mitigated, RiskStatus.Accepted, RiskStatus.Transferred, RiskStatus.Avoided, RiskStatus.UnderReview],
      [RiskStatus.UnderReview]: [RiskStatus.Active, RiskStatus.Mitigated, RiskStatus.Accepted],
      [RiskStatus.Mitigated]: [RiskStatus.Closed, RiskStatus.Active],
      [RiskStatus.Accepted]: [RiskStatus.Closed, RiskStatus.Active],
      [RiskStatus.Transferred]: [RiskStatus.Closed, RiskStatus.Active],
      [RiskStatus.Avoided]: [RiskStatus.Closed, RiskStatus.Active],
      [RiskStatus.Closed]: [] // No transitions from closed
    };

    return validTransitions[this._value]?.includes(newStatus) ?? false;
  }

  equals(other: RiskStatusVO): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
