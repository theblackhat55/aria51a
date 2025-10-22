/**
 * DomainEvent - Base class for all domain events
 * Domain events represent something that happened in the domain
 * They are immutable and can be used for event sourcing or messaging
 */

export interface IDomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly occurredOn: Date;
  readonly aggregateId: string;
  readonly payload: any;
}

export abstract class DomainEvent implements IDomainEvent {
  public readonly eventId: string;
  public readonly eventType: string;
  public readonly occurredOn: Date;
  public readonly aggregateId: string;
  public readonly payload: any;

  constructor(eventType: string, aggregateId: string, payload?: any) {
    this.eventId = this.generateEventId();
    this.eventType = eventType;
    this.aggregateId = aggregateId;
    this.occurredOn = new Date();
    this.payload = payload || {};
  }

  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Serialize event to JSON
   */
  public toJSON(): object {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      occurredOn: this.occurredOn.toISOString(),
      aggregateId: this.aggregateId,
      payload: this.payload
    };
  }
}
