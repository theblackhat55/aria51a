/**
 * Base Value Object Class
 * 
 * Represents an immutable value without identity.
 * Value objects are compared by their attributes, not identity.
 * 
 * @abstract
 */

export abstract class ValueObject<T> {
  protected readonly _value: T;

  constructor(value: T) {
    this._value = Object.freeze(value);
  }

  /**
   * Get the underlying value
   */
  get value(): T {
    return this._value;
  }

  /**
   * Check equality based on value
   */
  public equals(vo?: ValueObject<T>): boolean {
    if (!vo) {
      return false;
    }

    if (this === vo) {
      return true;
    }

    return this.compareValues(this._value, vo._value);
  }

  /**
   * Deep comparison of values
   */
  private compareValues(value1: T, value2: T): boolean {
    if (value1 === value2) {
      return true;
    }

    // Handle null/undefined
    if (value1 == null || value2 == null) {
      return false;
    }

    // Handle primitive types
    if (typeof value1 !== 'object' || typeof value2 !== 'object') {
      return value1 === value2;
    }

    // Handle objects
    const keys1 = Object.keys(value1);
    const keys2 = Object.keys(value2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      const val1 = (value1 as any)[key];
      const val2 = (value2 as any)[key];

      if (!this.compareValues(val1, val2)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Convert value object to string
   */
  public toString(): string {
    if (typeof this._value === 'object') {
      return JSON.stringify(this._value);
    }
    return String(this._value);
  }

  /**
   * Convert value object to JSON
   */
  public toJSON(): T {
    return this._value;
  }
}
