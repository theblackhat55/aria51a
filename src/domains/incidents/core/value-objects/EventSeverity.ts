/**
 * EventSeverity Value Object
 * 
 * Represents the severity level of a security event.
 * Used for prioritizing events and determining response actions.
 */

import { ValueObject } from '../../../../shared/core/ValueObject';

export enum EventSeverity {
  Critical = 'critical',     // Immediate threat requiring urgent action
  High = 'high',            // Significant threat requiring prompt action
  Medium = 'medium',        // Moderate threat requiring investigation
  Low = 'low',              // Minor threat or suspicious activity
  Informational = 'informational' // Informational events for awareness
}

export class EventSeverityVO extends ValueObject<EventSeverity> {
  private constructor(value: EventSeverity) {
    super(value);
  }

  public static create(value: EventSeverity): EventSeverityVO {
    if (!Object.values(EventSeverity).includes(value)) {
      throw new Error(`Invalid event severity: ${value}`);
    }
    return new EventSeverityVO(value);
  }

  /**
   * Get human-readable label
   */
  public getLabel(): string {
    const labels: Record<EventSeverity, string> = {
      [EventSeverity.Critical]: 'Critical',
      [EventSeverity.High]: 'High',
      [EventSeverity.Medium]: 'Medium',
      [EventSeverity.Low]: 'Low',
      [EventSeverity.Informational]: 'Informational'
    };
    return labels[this._value];
  }

  /**
   * Get color for UI display
   */
  public getColor(): string {
    const colors: Record<EventSeverity, string> = {
      [EventSeverity.Critical]: '#DC2626',  // red-600
      [EventSeverity.High]: '#EA580C',      // orange-600
      [EventSeverity.Medium]: '#D97706',    // amber-600
      [EventSeverity.Low]: '#0891B2',       // cyan-600
      [EventSeverity.Informational]: '#64748B' // slate-500
    };
    return colors[this._value];
  }

  /**
   * Get numeric score (0-100)
   */
  public getScore(): number {
    const scores: Record<EventSeverity, number> = {
      [EventSeverity.Critical]: 100,
      [EventSeverity.High]: 75,
      [EventSeverity.Medium]: 50,
      [EventSeverity.Low]: 25,
      [EventSeverity.Informational]: 5
    };
    return scores[this._value];
  }

  /**
   * Get threat score (0-50) for threat level calculation
   */
  public getThreatScore(): number {
    const scores: Record<EventSeverity, number> = {
      [EventSeverity.Critical]: 50,
      [EventSeverity.High]: 40,
      [EventSeverity.Medium]: 25,
      [EventSeverity.Low]: 10,
      [EventSeverity.Informational]: 0
    };
    return scores[this._value];
  }

  /**
   * Get response time SLA in minutes
   */
  public getResponseTimeSLA(): number {
    const sla: Record<EventSeverity, number> = {
      [EventSeverity.Critical]: 15,      // 15 minutes
      [EventSeverity.High]: 60,          // 1 hour
      [EventSeverity.Medium]: 240,       // 4 hours
      [EventSeverity.Low]: 1440,         // 24 hours
      [EventSeverity.Informational]: 0   // No SLA
    };
    return sla[this._value];
  }

  /**
   * Check if severity is critical
   */
  public isCritical(): boolean {
    return this._value === EventSeverity.Critical;
  }

  /**
   * Check if severity is high
   */
  public isHigh(): boolean {
    return this._value === EventSeverity.High;
  }

  /**
   * Check if severity is medium or lower
   */
  public isMediumOrLower(): boolean {
    return [
      EventSeverity.Medium,
      EventSeverity.Low,
      EventSeverity.Informational
    ].includes(this._value);
  }

  /**
   * Check if severity requires immediate attention
   */
  public requiresImmediateAttention(): boolean {
    return this._value === EventSeverity.Critical || 
           this._value === EventSeverity.High;
  }

  /**
   * Check if severity requires notification
   */
  public requiresNotification(): boolean {
    return this._value !== EventSeverity.Informational;
  }

  /**
   * Compare severity levels
   */
  public isHigherThan(other: EventSeverityVO): boolean {
    return this.getScore() > other.getScore();
  }

  public isLowerThan(other: EventSeverityVO): boolean {
    return this.getScore() < other.getScore();
  }

  /**
   * Get icon for UI display
   */
  public getIcon(): string {
    const icons: Record<EventSeverity, string> = {
      [EventSeverity.Critical]: '🔴',
      [EventSeverity.High]: '🟠',
      [EventSeverity.Medium]: '🟡',
      [EventSeverity.Low]: '🔵',
      [EventSeverity.Informational]: '⚪'
    };
    return icons[this._value];
  }

  /**
   * Get priority for sorting (lower = higher priority)
   */
  public getPriority(): number {
    const priorities: Record<EventSeverity, number> = {
      [EventSeverity.Critical]: 1,
      [EventSeverity.High]: 2,
      [EventSeverity.Medium]: 3,
      [EventSeverity.Low]: 4,
      [EventSeverity.Informational]: 5
    };
    return priorities[this._value];
  }

  /**
   * Get escalation level
   */
  public getEscalationLevel(): string {
    const levels: Record<EventSeverity, string> = {
      [EventSeverity.Critical]: 'Executive',
      [EventSeverity.High]: 'Management',
      [EventSeverity.Medium]: 'Team Lead',
      [EventSeverity.Low]: 'Analyst',
      [EventSeverity.Informational]: 'None'
    };
    return levels[this._value];
  }
}
