/**
 * RiskCreatedEvent
 * Domain event fired when a new risk is created
 */

import { DomainEvent } from '../../../../core/domain/events/DomainEvent';

export interface RiskCreatedPayload {
  riskId: string;
  title: string;
  description: string;
  category: string;
  probability: number;
  impact: number;
  riskScore: number;
  riskLevel: string;
  status: string;
  organizationId: number;
  ownerId: number;
  createdBy: number;
  riskType: string;
}

export class RiskCreatedEvent extends DomainEvent {
  constructor(aggregateId: string, payload: RiskCreatedPayload) {
    super('RiskCreated', aggregateId, payload);
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

  get ownerId(): number {
    return this.payload.ownerId;
  }

  get organizationId(): number {
    return this.payload.organizationId;
  }

  /**
   * Check if this is a critical risk creation
   */
  get isCriticalRisk(): boolean {
    return this.payload.riskScore >= 20;
  }

  /**
   * Check if this risk needs immediate attention
   */
  get needsImmediateAttention(): boolean {
    return this.payload.riskScore >= 15;
  }
}
