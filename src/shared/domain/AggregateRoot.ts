/**
 * Aggregate Root Class
 * 
 * Special type of entity that serves as the entry point to an aggregate.
 * Enforces consistency boundaries and manages domain events.
 * 
 * @abstract
 */

import { Entity } from './Entity';
import { DomainEvent } from './DomainEvent';

export abstract class AggregateRoot<T = number> extends Entity<T> {
  /**
   * Apply and add a domain event
   * 
   * This method allows aggregates to apply events to themselves
   * and maintain a list of events for publishing.
   */
  protected applyEvent(event: DomainEvent): void {
    this.addDomainEvent(event);
    this.touch();
  }

  /**
   * Check if the aggregate has any pending events
   */
  public hasPendingEvents(): boolean {
    return this.getDomainEvents().length > 0;
  }

  /**
   * Get the number of pending events
   */
  public pendingEventsCount(): number {
    return this.getDomainEvents().length;
  }
}
