/**
 * Base Entity Class
 * 
 * Represents a domain entity with identity and lifecycle.
 * Entities are distinguished by their ID, not their attributes.
 * 
 * @abstract
 */

import { DomainEvent } from './DomainEvent';

export abstract class Entity<T = number> {
  protected readonly _id: T;
  private _domainEvents: DomainEvent[] = [];
  protected _createdAt: Date;
  protected _updatedAt: Date;

  constructor(id: T) {
    this._id = id;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  /**
   * Get the entity's unique identifier
   */
  get id(): T {
    return this._id;
  }

  /**
   * Get creation timestamp
   */
  get createdAt(): Date {
    return this._createdAt;
  }

  /**
   * Get last update timestamp
   */
  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Add a domain event to be published
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Get all domain events for this entity
   */
  public getDomainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  /**
   * Clear all domain events (usually after publishing)
   */
  public clearDomainEvents(): void {
    this._domainEvents = [];
  }

  /**
   * Check equality based on ID
   */
  public equals(entity?: Entity<T>): boolean {
    if (!entity) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    return this._id === entity._id;
  }

  /**
   * Update the updated_at timestamp
   */
  protected touch(): void {
    this._updatedAt = new Date();
  }

  /**
   * Convert entity to plain object for serialization
   */
  public abstract toJSON(): Record<string, any>;
}
