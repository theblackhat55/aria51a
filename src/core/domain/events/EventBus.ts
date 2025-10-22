/**
 * EventBus - In-memory event bus for domain events
 * Allows decoupled communication between aggregates and modules
 * Supports synchronous event handling with priority
 */

import { DomainEvent } from './DomainEvent';
import { IEventHandler } from './IEventHandler';

interface EventSubscription {
  handler: IEventHandler<DomainEvent>;
  priority: number;
}

export class EventBus {
  private static instance: EventBus;
  private subscriptions: Map<string, EventSubscription[]> = new Map();
  private globalHandlers: EventSubscription[] = [];

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Subscribe to a specific event type
   */
  public subscribe<T extends DomainEvent>(
    eventType: string,
    handler: IEventHandler<T>,
    priority: number = 0
  ): void {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, []);
    }

    const handlers = this.subscriptions.get(eventType)!;
    handlers.push({ handler: handler as IEventHandler<DomainEvent>, priority });
    
    // Sort by priority (higher priority first)
    handlers.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Subscribe to all events (global handler)
   */
  public subscribeToAll(handler: IEventHandler<DomainEvent>, priority: number = 0): void {
    this.globalHandlers.push({ handler, priority });
    this.globalHandlers.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Unsubscribe from a specific event type
   */
  public unsubscribe(eventType: string, handler: IEventHandler<DomainEvent>): void {
    const handlers = this.subscriptions.get(eventType);
    if (handlers) {
      const index = handlers.findIndex(sub => sub.handler === handler);
      if (index !== -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Publish a single event
   */
  public async publish(event: DomainEvent): Promise<void> {
    const eventType = event.eventType;

    // Execute specific handlers
    const handlers = this.subscriptions.get(eventType) || [];
    for (const subscription of handlers) {
      try {
        await subscription.handler.handle(event);
      } catch (error) {
        console.error(`Error handling event ${eventType}:`, error);
        // Continue processing other handlers
      }
    }

    // Execute global handlers
    for (const subscription of this.globalHandlers) {
      try {
        await subscription.handler.handle(event);
      } catch (error) {
        console.error(`Error in global handler for event ${eventType}:`, error);
      }
    }
  }

  /**
   * Publish multiple events in sequence
   */
  public async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  /**
   * Clear all subscriptions (useful for testing)
   */
  public clearSubscriptions(): void {
    this.subscriptions.clear();
    this.globalHandlers = [];
  }

  /**
   * Get count of subscribers for an event type
   */
  public getSubscriberCount(eventType: string): number {
    return (this.subscriptions.get(eventType)?.length || 0) + this.globalHandlers.length;
  }
}
