/**
 * RiskStatus Value Object
 * Represents the current status of a risk in its lifecycle
 */

import { ValueObject } from '../../../../core/domain/entities/ValueObject';
import { ValidationException } from '../../../../core/domain/exceptions/ValidationException';

export type RiskStatusType = 
  | 'active'
  | 'mitigated'
  | 'accepted'
  | 'transferred'
  | 'avoided'
  | 'closed'
  | 'monitoring';

interface RiskStatusProps {
  value: RiskStatusType;
}

export class RiskStatus extends ValueObject<RiskStatusProps> {
  private static readonly VALID_STATUSES: RiskStatusType[] = [
    'active',
    'mitigated',
    'accepted',
    'transferred',
    'avoided',
    'closed',
    'monitoring'
  ];

  private static readonly STATUS_DISPLAY: Record<RiskStatusType, string> = {
    active: 'Active',
    mitigated: 'Mitigated',
    accepted: 'Accepted',
    transferred: 'Transferred',
    avoided: 'Avoided',
    closed: 'Closed',
    monitoring: 'Monitoring'
  };

  private static readonly STATUS_COLORS: Record<RiskStatusType, string> = {
    active: 'bg-red-100 text-red-800',
    mitigated: 'bg-green-100 text-green-800',
    accepted: 'bg-yellow-100 text-yellow-800',
    transferred: 'bg-blue-100 text-blue-800',
    avoided: 'bg-purple-100 text-purple-800',
    closed: 'bg-gray-100 text-gray-800',
    monitoring: 'bg-orange-100 text-orange-800'
  };

  private constructor(props: RiskStatusProps) {
    super(props);
  }

  /**
   * Create from string value
   */
  static create(value: string): RiskStatus {
    const normalizedValue = value.toLowerCase().trim() as RiskStatusType;

    if (!RiskStatus.VALID_STATUSES.includes(normalizedValue)) {
      throw ValidationException.fromField(
        'status',
        `Invalid status. Must be one of: ${RiskStatus.VALID_STATUSES.join(', ')}`,
        value
      );
    }

    return new RiskStatus({ value: normalizedValue });
  }

  /**
   * Create default active status
   */
  static createActive(): RiskStatus {
    return new RiskStatus({ value: 'active' });
  }

  /**
   * Get status value
   */
  get value(): RiskStatusType {
    return this.props.value;
  }

  /**
   * Get display name
   */
  get displayName(): string {
    return RiskStatus.STATUS_DISPLAY[this.props.value];
  }

  /**
   * Get status color class
   */
  get colorClass(): string {
    return RiskStatus.STATUS_COLORS[this.props.value];
  }

  /**
   * Get status badge HTML
   */
  getBadge(): string {
    return `<span class="px-2 py-1 text-xs font-semibold rounded ${this.colorClass}">${this.displayName.toUpperCase()}</span>`;
  }

  /**
   * Check if status is active
   */
  isActive(): boolean {
    return this.props.value === 'active';
  }

  /**
   * Check if status is closed
   */
  isClosed(): boolean {
    return this.props.value === 'closed';
  }

  /**
   * Check if status requires monitoring
   */
  requiresMonitoring(): boolean {
    return this.props.value === 'monitoring' || this.props.value === 'active';
  }

  /**
   * Check if risk is resolved
   */
  isResolved(): boolean {
    return ['mitigated', 'accepted', 'transferred', 'avoided', 'closed'].includes(this.props.value);
  }

  /**
   * Check if transition to new status is valid
   */
  canTransitionTo(newStatus: RiskStatus): boolean {
    // Define valid transitions
    const transitions: Record<RiskStatusType, RiskStatusType[]> = {
      active: ['mitigated', 'accepted', 'transferred', 'avoided', 'monitoring', 'closed'],
      monitoring: ['active', 'mitigated', 'accepted', 'closed'],
      mitigated: ['closed', 'monitoring', 'active'], // Can reopen
      accepted: ['closed', 'monitoring'],
      transferred: ['closed', 'monitoring'],
      avoided: ['closed'],
      closed: ['active'] // Can reopen closed risks
    };

    return transitions[this.props.value]?.includes(newStatus.value) ?? false;
  }

  /**
   * Get all possible statuses
   */
  static getAllStatuses(): RiskStatusType[] {
    return [...RiskStatus.VALID_STATUSES];
  }

  /**
   * Get status options for dropdown
   */
  static getStatusOptions(): Array<{ value: RiskStatusType; label: string }> {
    return RiskStatus.VALID_STATUSES.map(status => ({
      value: status,
      label: RiskStatus.STATUS_DISPLAY[status]
    }));
  }

  /**
   * Convert to string
   */
  toString(): string {
    return this.props.value;
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      value: this.props.value,
      displayName: this.displayName,
      isActive: this.isActive(),
      isResolved: this.isResolved()
    };
  }
}
