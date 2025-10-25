/**
 * IncidentSeverity - Value Object for incident severity classification
 * 
 * Based on industry standards (NIST, ISO 27035)
 */

export enum IncidentSeverity {
  Critical = 'critical',       // Complete system compromise, data breach
  High = 'high',              // Significant impact, widespread disruption
  Medium = 'medium',          // Limited impact, contained
  Low = 'low',                // Minor impact, easy to resolve
  Informational = 'informational'  // FYI, no immediate action required
}

export class IncidentSeverityVO {
  private constructor(private readonly _value: IncidentSeverity) {}

  static create(value: string): IncidentSeverityVO {
    const lowerValue = value.toLowerCase();
    
    const severityMap: Record<string, IncidentSeverity> = {
      'critical': IncidentSeverity.Critical,
      'high': IncidentSeverity.High,
      'medium': IncidentSeverity.Medium,
      'low': IncidentSeverity.Low,
      'informational': IncidentSeverity.Informational,
      'info': IncidentSeverity.Informational
    };

    const severity = severityMap[lowerValue];
    if (!severity) {
      const validSeverities = Object.values(IncidentSeverity).join(', ');
      throw new Error(`Invalid incident severity: ${value}. Must be one of: ${validSeverities}`);
    }

    return new IncidentSeverityVO(severity);
  }

  get value(): IncidentSeverity {
    return this._value;
  }

  get display(): string {
    const displayMap: Record<IncidentSeverity, string> = {
      [IncidentSeverity.Critical]: 'Critical',
      [IncidentSeverity.High]: 'High',
      [IncidentSeverity.Medium]: 'Medium',
      [IncidentSeverity.Low]: 'Low',
      [IncidentSeverity.Informational]: 'Informational'
    };
    return displayMap[this._value];
  }

  get color(): string {
    const colorMap: Record<IncidentSeverity, string> = {
      [IncidentSeverity.Critical]: '#7F1D1D',      // Dark Red
      [IncidentSeverity.High]: '#DC2626',          // Red
      [IncidentSeverity.Medium]: '#F59E0B',        // Amber
      [IncidentSeverity.Low]: '#10B981',           // Green
      [IncidentSeverity.Informational]: '#3B82F6'  // Blue
    };
    return colorMap[this._value];
  }

  get priority(): number {
    const priorityMap: Record<IncidentSeverity, number> = {
      [IncidentSeverity.Critical]: 1,
      [IncidentSeverity.High]: 2,
      [IncidentSeverity.Medium]: 3,
      [IncidentSeverity.Low]: 4,
      [IncidentSeverity.Informational]: 5
    };
    return priorityMap[this._value];
  }

  get slaHours(): number {
    // SLA response time in hours
    const slaMap: Record<IncidentSeverity, number> = {
      [IncidentSeverity.Critical]: 1,        // 1 hour
      [IncidentSeverity.High]: 4,            // 4 hours
      [IncidentSeverity.Medium]: 24,         // 24 hours
      [IncidentSeverity.Low]: 72,            // 3 days
      [IncidentSeverity.Informational]: 168  // 7 days
    };
    return slaMap[this._value];
  }

  equals(other: IncidentSeverityVO): boolean {
    return this._value === other._value;
  }

  isHighPriority(): boolean {
    return this._value === IncidentSeverity.Critical || 
           this._value === IncidentSeverity.High;
  }

  requiresEscalation(): boolean {
    return this._value === IncidentSeverity.Critical;
  }
}
