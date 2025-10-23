/**
 * RiskStatusChangedEvent
 * Domain event fired when a risk's status changes
 */

import { DomainEvent } from '../../../../core/domain/events/DomainEvent';

export interface RiskStatusChangedPayload {
  riskId: string;
  oldStatus: string;
  newStatus: string;
  reason?: string;
  changedBy?: number;
  riskScore: number;
  isCritical: boolean;
}

export class RiskStatusChangedEvent extends DomainEvent {
  constructor(aggregateId: string, payload: RiskStatusChangedPayload) {
    super('RiskStatusChanged', aggregateId, payload);
  }

  get riskId(): string {
    return this.payload.riskId;
  }

  get oldStatus(): string {
    return this.payload.oldStatus;
  }

  get newStatus(): string {
    return this.payload.newStatus;
  }

  get reason(): string | undefined {
    return this.payload.reason;
  }

  get changedBy(): number | undefined {
    return this.payload.changedBy;
  }

  get riskScore(): number {
    return this.payload.riskScore;
  }

  get isCritical(): boolean {
    return this.payload.isCritical;
  }

  /**
   * Check if status was changed to active
   */
  get wasActivated(): boolean {
    return this.payload.newStatus === 'active';
  }

  /**
   * Check if status was changed to closed
   */
  get wasClosed(): boolean {
    return this.payload.newStatus === 'closed';
  }

  /**
   * Check if status was changed to mitigated
   */
  get wasMitigated(): boolean {
    return this.payload.newStatus === 'mitigated';
  }

  /**
   * Check if status was changed to monitoring
   */
  get isNowMonitoring(): boolean {
    return this.payload.newStatus === 'monitoring';
  }

  /**
   * Check if risk was resolved (moved to terminal or resolved state)
   */
  get wasResolved(): boolean {
    return ['mitigated', 'accepted', 'transferred', 'avoided', 'closed'].includes(this.payload.newStatus);
  }

  /**
   * Check if risk was reopened
   */
  get wasReopened(): boolean {
    return this.payload.oldStatus === 'closed' && this.payload.newStatus === 'active';
  }

  /**
   * Check if critical risk status changed
   */
  get isCriticalStatusChange(): boolean {
    return this.payload.isCritical && (this.wasActivated || this.wasClosed);
  }
}
