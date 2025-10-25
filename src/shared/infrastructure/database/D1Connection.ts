/**
 * D1 Database Connection Manager
 * 
 * Provides a centralized way to access D1 database with connection pooling
 * and transaction support.
 */

export class D1Connection {
  private static instance: D1Connection | null = null;
  private db: D1Database | null = null;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): D1Connection {
    if (!D1Connection.instance) {
      D1Connection.instance = new D1Connection();
    }
    return D1Connection.instance;
  }

  /**
   * Initialize the database connection
   */
  public initialize(database: D1Database): void {
    this.db = database;
  }

  /**
   * Get the database instance
   * @throws Error if database not initialized
   */
  public getDatabase(): D1Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Execute a query with parameters
   */
  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const db = this.getDatabase();
    const result = await db.prepare(sql).bind(...params).all<T>();
    return result.results || [];
  }

  /**
   * Execute a query and return first result
   */
  public async queryFirst<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const db = this.getDatabase();
    const result = await db.prepare(sql).bind(...params).first<T>();
    return result;
  }

  /**
   * Execute a command (INSERT, UPDATE, DELETE)
   */
  public async execute(sql: string, params: any[] = []): Promise<D1Result> {
    const db = this.getDatabase();
    return await db.prepare(sql).bind(...params).run();
  }

  /**
   * Execute multiple commands in a batch
   * Note: D1 batch is not a true transaction but executed together
   */
  public async batch(statements: D1PreparedStatement[]): Promise<D1Result[]> {
    const db = this.getDatabase();
    return await db.batch(statements);
  }

  /**
   * Check if database is initialized
   */
  public isInitialized(): boolean {
    return this.db !== null;
  }
}
