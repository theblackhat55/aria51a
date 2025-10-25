/**
 * Base Domain Event Class
 * 
 * Represents something that happened in the domain.
 * Used for event-driven architecture and loose coupling.
 * 
 * @abstract
 */

export abstract class DomainEvent {
  public readonly occurredOn: Date;
  public readonly eventId: string;
  public readonly eventType: string;

  constructor(eventType?: string) {
    this.occurredOn = new Date();
    this.eventId = this.generateEventId();
    this.eventType = eventType || this.constructor.name;
  }

  /**
   * Generate a unique event ID
   */
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Get the aggregate ID that this event relates to
   */
  public abstract getAggregateId(): number | string;

  /**
   * Convert event to JSON for serialization/messaging
   */
  public toJSON(): Record<string, any> {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      occurredOn: this.occurredOn.toISOString(),
      aggregateId: this.getAggregateId(),
      ...this.getEventData()
    };
  }

  /**
   * Get event-specific data
   */
  protected abstract getEventData(): Record<string, any>;
}
