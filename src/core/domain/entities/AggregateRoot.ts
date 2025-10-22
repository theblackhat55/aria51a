/**
 * AggregateRoot - Base class for aggregate roots in DDD
 * Aggregates are clusters of entities and value objects with a single entry point
 * They manage domain events and ensure consistency within their boundaries
 */

import { BaseEntity } from './BaseEntity';
import { DomainEvent } from '../events/DomainEvent';

export abstract class AggregateRoot<T> extends BaseEntity<T> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  /**
   * Add a domain event to be published when aggregate is persisted
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Clear all domain events (typically after publishing)
   */
  public clearEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Check if aggregate has pending domain events
   */
  public hasPendingEvents(): boolean {
    return this._domainEvents.length > 0;
  }

  /**
   * Get and clear all domain events (for publishing)
   */
  public pullDomainEvents(): DomainEvent[] {
    const events = [...this._domainEvents];
    this.clearEvents();
    return events;
  }
}
