/**
 * IRepository - Base repository interface for data access
 * Repositories abstract the data layer from the domain layer
 * Follows the Repository pattern from DDD
 */

export interface IRepository<T, ID = string> {
  /**
   * Find entity by ID
   */
  findById(id: ID): Promise<T | null>;

  /**
   * Find all entities matching criteria
   */
  findAll(criteria?: any): Promise<T[]>;

  /**
   * Save entity (create or update)
   */
  save(entity: T): Promise<void>;

  /**
   * Save multiple entities
   */
  saveMany(entities: T[]): Promise<void>;

  /**
   * Delete entity by ID
   */
  delete(id: ID): Promise<void>;

  /**
   * Delete multiple entities by IDs
   */
  deleteMany(ids: ID[]): Promise<void>;

  /**
   * Check if entity exists
   */
  exists(id: ID): Promise<boolean>;

  /**
   * Count entities matching criteria
   */
  count(criteria?: any): Promise<number>;
}
