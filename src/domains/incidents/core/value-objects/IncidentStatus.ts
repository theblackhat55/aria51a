/**
 * IncidentStatus - Value Object for incident lifecycle status
 * 
 * Based on NIST SP 800-61 incident handling phases
 */

export enum IncidentStatus {
  Detected = 'detected',           // Initial detection
  Triaged = 'triaged',            // Analyzed and prioritized
  Investigating = 'investigating', // Active investigation
  Contained = 'contained',         // Threat contained
  Eradicating = 'eradicating',    // Removing threat
  Recovering = 'recovering',       // System recovery
  Resolved = 'resolved',           // Incident resolved
  Closed = 'closed'                // Post-incident review complete
}

export class IncidentStatusVO {
  private constructor(private readonly _value: IncidentStatus) {}

  static create(value: string): IncidentStatusVO {
    const lowerValue = value.toLowerCase();
    
    const statusMap: Record<string, IncidentStatus> = {
      'detected': IncidentStatus.Detected,
      'triaged': IncidentStatus.Triaged,
      'investigating': IncidentStatus.Investigating,
      'contained': IncidentStatus.Contained,
      'eradicating': IncidentStatus.Eradicating,
      'recovering': IncidentStatus.Recovering,
      'resolved': IncidentStatus.Resolved,
      'closed': IncidentStatus.Closed
    };

    const status = statusMap[lowerValue];
    if (!status) {
      const validStatuses = Object.values(IncidentStatus).join(', ');
      throw new Error(`Invalid incident status: ${value}. Must be one of: ${validStatuses}`);
    }

    return new IncidentStatusVO(status);
  }

  get value(): IncidentStatus {
    return this._value;
  }

  get display(): string {
    const displayMap: Record<IncidentStatus, string> = {
      [IncidentStatus.Detected]: 'Detected',
      [IncidentStatus.Triaged]: 'Triaged',
      [IncidentStatus.Investigating]: 'Investigating',
      [IncidentStatus.Contained]: 'Contained',
      [IncidentStatus.Eradicating]: 'Eradicating',
      [IncidentStatus.Recovering]: 'Recovering',
      [IncidentStatus.Resolved]: 'Resolved',
      [IncidentStatus.Closed]: 'Closed'
    };
    return displayMap[this._value];
  }

  get color(): string {
    const colorMap: Record<IncidentStatus, string> = {
      [IncidentStatus.Detected]: '#DC2626',        // Red - needs attention
      [IncidentStatus.Triaged]: '#F59E0B',         // Amber - analyzing
      [IncidentStatus.Investigating]: '#3B82F6',   // Blue - in progress
      [IncidentStatus.Contained]: '#8B5CF6',       // Purple - controlled
      [IncidentStatus.Eradicating]: '#06B6D4',     // Cyan - removing threat
      [IncidentStatus.Recovering]: '#10B981',      // Green - recovering
      [IncidentStatus.Resolved]: '#059669',        // Dark Green - resolved
      [IncidentStatus.Closed]: '#6B7280'           // Gray - closed
    };
    return colorMap[this._value];
  }

  get phase(): 'preparation' | 'detection' | 'analysis' | 'containment' | 'eradication' | 'recovery' | 'post-incident' {
    const phaseMap: Record<IncidentStatus, any> = {
      [IncidentStatus.Detected]: 'detection',
      [IncidentStatus.Triaged]: 'analysis',
      [IncidentStatus.Investigating]: 'analysis',
      [IncidentStatus.Contained]: 'containment',
      [IncidentStatus.Eradicating]: 'eradication',
      [IncidentStatus.Recovering]: 'recovery',
      [IncidentStatus.Resolved]: 'post-incident',
      [IncidentStatus.Closed]: 'post-incident'
    };
    return phaseMap[this._value];
  }

  get progressPercentage(): number {
    const progressMap: Record<IncidentStatus, number> = {
      [IncidentStatus.Detected]: 10,
      [IncidentStatus.Triaged]: 20,
      [IncidentStatus.Investigating]: 40,
      [IncidentStatus.Contained]: 60,
      [IncidentStatus.Eradicating]: 75,
      [IncidentStatus.Recovering]: 85,
      [IncidentStatus.Resolved]: 95,
      [IncidentStatus.Closed]: 100
    };
    return progressMap[this._value];
  }

  equals(other: IncidentStatusVO): boolean {
    return this._value === other._value;
  }

  canTransitionTo(newStatus: IncidentStatus): boolean {
    const transitions: Record<IncidentStatus, IncidentStatus[]> = {
      [IncidentStatus.Detected]: [IncidentStatus.Triaged, IncidentStatus.Closed],
      [IncidentStatus.Triaged]: [IncidentStatus.Investigating, IncidentStatus.Closed],
      [IncidentStatus.Investigating]: [IncidentStatus.Contained, IncidentStatus.Resolved, IncidentStatus.Closed],
      [IncidentStatus.Contained]: [IncidentStatus.Eradicating, IncidentStatus.Investigating],
      [IncidentStatus.Eradicating]: [IncidentStatus.Recovering, IncidentStatus.Contained],
      [IncidentStatus.Recovering]: [IncidentStatus.Resolved, IncidentStatus.Investigating],
      [IncidentStatus.Resolved]: [IncidentStatus.Closed, IncidentStatus.Investigating],
      [IncidentStatus.Closed]: []  // Terminal state
    };

    return transitions[this._value]?.includes(newStatus) ?? false;
  }

  isActive(): boolean {
    return ![IncidentStatus.Resolved, IncidentStatus.Closed].includes(this._value);
  }

  isClosed(): boolean {
    return this._value === IncidentStatus.Closed;
  }
}
