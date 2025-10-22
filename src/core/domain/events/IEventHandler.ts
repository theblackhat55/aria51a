/**
 * IEventHandler - Interface for domain event handlers
 * Event handlers are responsible for reacting to domain events
 */

import { DomainEvent } from './DomainEvent';

export interface IEventHandler<T extends DomainEvent = DomainEvent> {
  /**
   * Handle the domain event
   */
  handle(event: T): Promise<void> | void;
}
