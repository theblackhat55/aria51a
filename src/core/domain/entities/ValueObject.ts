/**
 * ValueObject - Base class for value objects in DDD
 * Value objects are immutable and defined by their attributes, not identity
 * They are compared by value, not by reference
 */

export abstract class ValueObject<T> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze(props);
  }

  /**
   * Value objects are equal if all their properties are equal
   */
  public equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }

    if (vo.props === undefined) {
      return false;
    }

    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }

  /**
   * Get hash code for value object
   */
  public hashCode(): string {
    return JSON.stringify(this.props);
  }

  /**
   * Get the value of the value object
   */
  public getValue(): T {
    return this.props;
  }
}
