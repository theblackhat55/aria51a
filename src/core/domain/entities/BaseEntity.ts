/**
 * BaseEntity - Base class for all domain entities
 * Provides common functionality like ID management and equality comparison
 */

export abstract class BaseEntity<T> {
  protected readonly _id: T;
  protected _createdAt: Date;
  protected _updatedAt: Date;

  constructor(id: T) {
    this._id = id;
    this._createdAt = new Date();
    this._updatedAt = new Date();
  }

  get id(): T {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  protected touch(): void {
    this._updatedAt = new Date();
  }

  /**
   * Entities are equal if they have the same ID
   */
  public equals(entity?: BaseEntity<T>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    if (!(entity instanceof BaseEntity)) {
      return false;
    }

    return this._id === entity._id;
  }

  /**
   * Get hash code for entity (useful for collections)
   */
  public hashCode(): string {
    return String(this._id);
  }
}
