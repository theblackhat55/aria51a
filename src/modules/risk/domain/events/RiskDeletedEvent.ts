/**
 * RiskDeletedEvent
 * Domain event fired when a risk is deleted
 */

import { DomainEvent } from '../../../../core/domain/events/DomainEvent';

export interface RiskDeletedPayload {
  riskId: string;
  title: string;
  category: string;
  riskScore: number;
  riskLevel: string;
  status: string;
  organizationId: number;
  ownerId: number;
  deletedBy?: number;
  reason?: string;
  deletedAt: Date;
}

export class RiskDeletedEvent extends DomainEvent {
  constructor(aggregateId: string, payload: RiskDeletedPayload) {
    super('RiskDeleted', aggregateId, payload);
  }

  get riskId(): string {
    return this.payload.riskId;
  }

  get title(): string {
    return this.payload.title;
  }

  get category(): string {
    return this.payload.category;
  }

  get riskScore(): number {
    return this.payload.riskScore;
  }

  get riskLevel(): string {
    return this.payload.riskLevel;
  }

  get status(): string {
    return this.payload.status;
  }

  get organizationId(): number {
    return this.payload.organizationId;
  }

  get ownerId(): number {
    return this.payload.ownerId;
  }

  get deletedBy(): number | undefined {
    return this.payload.deletedBy;
  }

  get reason(): string | undefined {
    return this.payload.reason;
  }

  get deletedAt(): Date {
    return this.payload.deletedAt;
  }

  /**
   * Check if deleted risk was critical
   */
  get wasCritical(): boolean {
    return this.payload.riskScore >= 20;
  }

  /**
   * Check if deleted risk was active
   */
  get wasActive(): boolean {
    return this.payload.status === 'active';
  }
}
