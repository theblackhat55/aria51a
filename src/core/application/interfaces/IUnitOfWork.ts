/**
 * IUnitOfWork - Unit of Work pattern interface
 * Maintains a list of objects affected by a business transaction
 * Coordinates writing out changes and resolving concurrency problems
 */

export interface IUnitOfWork {
  /**
   * Begin a new transaction
   */
  begin(): Promise<void>;

  /**
   * Commit the current transaction
   */
  commit(): Promise<void>;

  /**
   * Rollback the current transaction
   */
  rollback(): Promise<void>;

  /**
   * Execute a function within a transaction
   */
  transaction<T>(work: () => Promise<T>): Promise<T>;

  /**
   * Check if a transaction is active
   */
  isActive(): boolean;
}
