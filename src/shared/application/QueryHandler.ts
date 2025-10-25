/**
 * Query Handler Interface
 * 
 * Handles the execution of queries (read operations).
 * Each query should have exactly one handler.
 * 
 * @interface
 */

import { Query } from './Query';

export interface QueryHandler<TQuery extends Query<TResult>, TResult = any> {
  /**
   * Execute the query and return the result
   * 
   * @param query - The query to execute
   * @returns Promise resolving to the query result
   * @throws Error if query execution fails
   */
  execute(query: TQuery): Promise<TResult>;
}

/**
 * Base Query Handler Abstract Class
 * 
 * Provides common functionality for query handlers
 */
export abstract class BaseQueryHandler<TQuery extends Query<TResult>, TResult = any>
  implements QueryHandler<TQuery, TResult> {
  
  /**
   * Execute the query with pre/post execution hooks
   */
  public async execute(query: TQuery): Promise<TResult> {
    // Validate query before execution
    query.validate();

    // Pre-execution hook
    await this.beforeExecute(query);

    // Execute the query
    const result = await this.handle(query);

    // Post-execution hook
    await this.afterExecute(query, result);

    return result;
  }

  /**
   * Handle the query execution
   * Override this method with actual query logic
   */
  protected abstract handle(query: TQuery): Promise<TResult>;

  /**
   * Hook executed before query handling
   * Override for logging, caching checks, metrics, etc.
   */
  protected async beforeExecute(query: TQuery): Promise<void> {
    // Override in subclasses if needed
  }

  /**
   * Hook executed after successful query handling
   * Override for caching results, logging, metrics, etc.
   */
  protected async afterExecute(query: TQuery, result: TResult): Promise<void> {
    // Override in subclasses if needed
  }
}
