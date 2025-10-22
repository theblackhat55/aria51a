/**
 * IEventBus - Interface for event bus
 * Allows for different implementations (in-memory, message queue, etc.)
 */

import { DomainEvent } from '../../domain/events/DomainEvent';
import { IEventHandler } from '../../domain/events/IEventHandler';

export interface IEventBus {
  /**
   * Publish a single event
   */
  publish(event: DomainEvent): Promise<void>;

  /**
   * Publish multiple events
   */
  publishAll(events: DomainEvent[]): Promise<void>;

  /**
   * Subscribe to a specific event type
   */
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: IEventHandler<T>,
    priority?: number
  ): void;

  /**
   * Unsubscribe from an event type
   */
  unsubscribe(eventType: string, handler: IEventHandler<DomainEvent>): void;
}
