/**
 * ControlStatus - Value Object for control implementation status
 * 
 * Represents the current implementation status of a security control
 */

export enum ControlStatus {
  NotImplemented = 'not_implemented',
  Planned = 'planned',
  PartiallyImplemented = 'partially_implemented',
  Implemented = 'implemented',
  Tested = 'tested',
  Verified = 'verified',
  Operational = 'operational',
  Decommissioned = 'decommissioned'
}

export class ControlStatusVO {
  private constructor(private readonly _value: ControlStatus) {}

  static create(value: string): ControlStatusVO {
    const lowerValue = value.toLowerCase();
    
    const statusMap: Record<string, ControlStatus> = {
      'not_implemented': ControlStatus.NotImplemented,
      'planned': ControlStatus.Planned,
      'partially_implemented': ControlStatus.PartiallyImplemented,
      'implemented': ControlStatus.Implemented,
      'tested': ControlStatus.Tested,
      'verified': ControlStatus.Verified,
      'operational': ControlStatus.Operational,
      'decommissioned': ControlStatus.Decommissioned
    };

    const status = statusMap[lowerValue];
    if (!status) {
      const validStatuses = Object.values(ControlStatus).join(', ');
      throw new Error(`Invalid control status: ${value}. Must be one of: ${validStatuses}`);
    }

    return new ControlStatusVO(status);
  }

  get value(): ControlStatus {
    return this._value;
  }

  get display(): string {
    const displayMap: Record<ControlStatus, string> = {
      [ControlStatus.NotImplemented]: 'Not Implemented',
      [ControlStatus.Planned]: 'Planned',
      [ControlStatus.PartiallyImplemented]: 'Partially Implemented',
      [ControlStatus.Implemented]: 'Implemented',
      [ControlStatus.Tested]: 'Tested',
      [ControlStatus.Verified]: 'Verified',
      [ControlStatus.Operational]: 'Operational',
      [ControlStatus.Decommissioned]: 'Decommissioned'
    };
    return displayMap[this._value];
  }

  get color(): string {
    const colorMap: Record<ControlStatus, string> = {
      [ControlStatus.NotImplemented]: '#DC2626',      // Red
      [ControlStatus.Planned]: '#FBBF24',             // Amber
      [ControlStatus.PartiallyImplemented]: '#F59E0B', // Orange
      [ControlStatus.Implemented]: '#10B981',         // Green
      [ControlStatus.Tested]: '#059669',              // Dark Green
      [ControlStatus.Verified]: '#047857',            // Darker Green
      [ControlStatus.Operational]: '#065F46',         // Darkest Green
      [ControlStatus.Decommissioned]: '#6B7280'       // Gray
    };
    return colorMap[this._value];
  }

  get percentage(): number {
    const percentageMap: Record<ControlStatus, number> = {
      [ControlStatus.NotImplemented]: 0,
      [ControlStatus.Planned]: 10,
      [ControlStatus.PartiallyImplemented]: 40,
      [ControlStatus.Implemented]: 70,
      [ControlStatus.Tested]: 85,
      [ControlStatus.Verified]: 95,
      [ControlStatus.Operational]: 100,
      [ControlStatus.Decommissioned]: 0
    };
    return percentageMap[this._value];
  }

  equals(other: ControlStatusVO): boolean {
    return this._value === other._value;
  }

  canTransitionTo(newStatus: ControlStatus): boolean {
    const transitions: Record<ControlStatus, ControlStatus[]> = {
      [ControlStatus.NotImplemented]: [ControlStatus.Planned],
      [ControlStatus.Planned]: [ControlStatus.PartiallyImplemented, ControlStatus.NotImplemented],
      [ControlStatus.PartiallyImplemented]: [ControlStatus.Implemented, ControlStatus.NotImplemented],
      [ControlStatus.Implemented]: [ControlStatus.Tested, ControlStatus.PartiallyImplemented],
      [ControlStatus.Tested]: [ControlStatus.Verified, ControlStatus.Implemented],
      [ControlStatus.Verified]: [ControlStatus.Operational, ControlStatus.Tested],
      [ControlStatus.Operational]: [ControlStatus.Decommissioned, ControlStatus.Tested],
      [ControlStatus.Decommissioned]: [ControlStatus.Planned]
    };

    return transitions[this._value]?.includes(newStatus) ?? false;
  }
}
