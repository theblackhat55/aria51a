/**
 * DatabaseConnection - Abstract database connection wrapper
 * Provides common interface for database operations
 */

export interface QueryResult<T = any> {
  results: T[];
  success: boolean;
  meta?: {
    changes?: number;
    last_row_id?: number;
    duration?: number;
  };
}

export interface DatabaseConnection {
  /**
   * Execute a query and return results
   */
  query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>>;

  /**
   * Execute a query and return first result
   */
  queryFirst<T = any>(sql: string, params?: any[]): Promise<T | null>;

  /**
   * Execute a statement (INSERT, UPDATE, DELETE)
   */
  execute(sql: string, params?: any[]): Promise<QueryResult>;

  /**
   * Execute batch statements
   */
  batch(statements: Array<{ sql: string; params?: any[] }>): Promise<QueryResult[]>;

  /**
   * Begin transaction
   */
  beginTransaction(): Promise<void>;

  /**
   * Commit transaction
   */
  commit(): Promise<void>;

  /**
   * Rollback transaction
   */
  rollback(): Promise<void>;

  /**
   * Execute within transaction
   */
  transaction<T>(callback: (db: DatabaseConnection) => Promise<T>): Promise<T>;
}

/**
 * D1DatabaseConnection - Cloudflare D1 implementation
 */
export class D1DatabaseConnection implements DatabaseConnection {
  constructor(private db: D1Database) {}

  async query<T = any>(sql: string, params?: any[]): Promise<QueryResult<T>> {
    try {
      const stmt = params ? this.db.prepare(sql).bind(...params) : this.db.prepare(sql);
      const result = await stmt.all<T>();
      
      return {
        results: result.results || [],
        success: result.success,
        meta: result.meta
      };
    } catch (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }
  }

  async queryFirst<T = any>(sql: string, params?: any[]): Promise<T | null> {
    try {
      const stmt = params ? this.db.prepare(sql).bind(...params) : this.db.prepare(sql);
      const result = await stmt.first<T>();
      return result;
    } catch (error) {
      throw new Error(`Database query failed: ${error.message}`);
    }
  }

  async execute(sql: string, params?: any[]): Promise<QueryResult> {
    try {
      const stmt = params ? this.db.prepare(sql).bind(...params) : this.db.prepare(sql);
      const result = await stmt.run();
      
      return {
        results: [],
        success: result.success,
        meta: result.meta
      };
    } catch (error) {
      throw new Error(`Database execution failed: ${error.message}`);
    }
  }

  async batch(statements: Array<{ sql: string; params?: any[] }>): Promise<QueryResult[]> {
    try {
      const stmts = statements.map(({ sql, params }) =>
        params ? this.db.prepare(sql).bind(...params) : this.db.prepare(sql)
      );
      
      const results = await this.db.batch(stmts);
      
      return results.map(result => ({
        results: (result as any).results || [],
        success: (result as any).success,
        meta: (result as any).meta
      }));
    } catch (error) {
      throw new Error(`Database batch failed: ${error.message}`);
    }
  }

  async beginTransaction(): Promise<void> {
    await this.execute('BEGIN TRANSACTION');
  }

  async commit(): Promise<void> {
    await this.execute('COMMIT');
  }

  async rollback(): Promise<void> {
    await this.execute('ROLLBACK');
  }

  async transaction<T>(callback: (db: DatabaseConnection) => Promise<T>): Promise<T> {
    await this.beginTransaction();
    try {
      const result = await callback(this);
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }
}
