/**
 * RiskUpdatedEvent
 * Domain event fired when a risk is updated
 */

import { DomainEvent } from '../../../../core/domain/events/DomainEvent';

export interface RiskUpdatedPayload {
  riskId: string;
  updatedFields: string[]; // List of fields that were updated
  changes: Record<string, { old: any; new: any }>; // Detailed change tracking
  updatedBy?: number;
  reason?: string;
}

export class RiskUpdatedEvent extends DomainEvent {
  constructor(aggregateId: string, payload: RiskUpdatedPayload) {
    super('RiskUpdated', aggregateId, payload);
  }

  get riskId(): string {
    return this.payload.riskId;
  }

  get updatedFields(): string[] {
    return this.payload.updatedFields;
  }

  get changes(): Record<string, { old: any; new: any }> {
    return this.payload.changes;
  }

  get updatedBy(): number | undefined {
    return this.payload.updatedBy;
  }

  get reason(): string | undefined {
    return this.payload.reason;
  }

  /**
   * Check if specific field was updated
   */
  hasFieldUpdated(fieldName: string): boolean {
    return this.payload.updatedFields.includes(fieldName);
  }

  /**
   * Check if score was changed
   */
  get scoreChanged(): boolean {
    return this.hasFieldUpdated('probability') || this.hasFieldUpdated('impact') || this.hasFieldUpdated('score');
  }

  /**
   * Check if category was changed
   */
  get categoryChanged(): boolean {
    return this.hasFieldUpdated('category');
  }

  /**
   * Get change details for specific field
   */
  getFieldChange(fieldName: string): { old: any; new: any } | undefined {
    return this.payload.changes[fieldName];
  }
}
