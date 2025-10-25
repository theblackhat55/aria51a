/**
 * Event Bus
 * 
 * Manages domain event publishing and subscription.
 * Enables loose coupling between domains through events.
 */

import { DomainEvent } from '../domain/DomainEvent';

export type EventHandler = (event: DomainEvent) => Promise<void> | void;

export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  /**
   * Subscribe to a specific event type
   * 
   * @param eventType - The type of event to subscribe to
   * @param handler - The handler function to call when event is published
   */
  public subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    const handlers = this.handlers.get(eventType)!;
    handlers.push(handler);
  }

  /**
   * Unsubscribe from a specific event type
   * 
   * @param eventType - The type of event to unsubscribe from
   * @param handler - The handler function to remove
   */
  public unsubscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (!handlers) {
      return;
    }

    const index = handlers.indexOf(handler);
    if (index !== -1) {
      handlers.splice(index, 1);
    }

    // Clean up empty handler arrays
    if (handlers.length === 0) {
      this.handlers.delete(eventType);
    }
  }

  /**
   * Publish a single domain event
   * 
   * @param event - The domain event to publish
   */
  public async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType);
    if (!handlers || handlers.length === 0) {
      return;
    }

    // Execute all handlers for this event type
    await Promise.all(handlers.map(handler => handler(event)));
  }

  /**
   * Publish multiple domain events
   * 
   * @param events - Array of domain events to publish
   */
  public async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * Clear all event handlers
   * Useful for testing
   */
  public clearHandlers(): void {
    this.handlers.clear();
  }

  /**
   * Get the number of handlers for a specific event type
   * 
   * @param eventType - The event type to check
   * @returns Number of registered handlers
   */
  public getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.length || 0;
  }

  /**
   * Get all registered event types
   * 
   * @returns Array of event types
   */
  public getRegisteredEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}
