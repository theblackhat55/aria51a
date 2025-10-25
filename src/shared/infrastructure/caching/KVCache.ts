/**
 * KV Cache Manager
 * 
 * Provides a type-safe wrapper around Cloudflare KV storage
 * for caching and session management.
 */

export interface CacheOptions {
  ttl?: number;  // Time to live in seconds
  namespace?: string;  // Namespace prefix for keys
}

export class KVCache {
  private static instance: KVCache | null = null;
  private kv: KVNamespace | null = null;
  private defaultTTL: number = 3600; // 1 hour default

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): KVCache {
    if (!KVCache.instance) {
      KVCache.instance = new KVCache();
    }
    return KVCache.instance;
  }

  /**
   * Initialize the KV store
   */
  public initialize(kvNamespace: KVNamespace, defaultTTL?: number): void {
    this.kv = kvNamespace;
    if (defaultTTL) {
      this.defaultTTL = defaultTTL;
    }
  }

  /**
   * Get the KV namespace
   * @throws Error if KV not initialized
   */
  private getKV(): KVNamespace {
    if (!this.kv) {
      throw new Error('KV not initialized. Call initialize() first.');
    }
    return this.kv;
  }

  /**
   * Generate a namespaced key
   */
  private getKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }

  /**
   * Set a value in cache
   */
  public async set<T>(
    key: string,
    value: T,
    options?: CacheOptions
  ): Promise<void> {
    const kv = this.getKV();
    const finalKey = this.getKey(key, options?.namespace);
    const serialized = JSON.stringify(value);
    
    const kvOptions: KVNamespacePutOptions = {};
    if (options?.ttl) {
      kvOptions.expirationTtl = options.ttl;
    } else {
      kvOptions.expirationTtl = this.defaultTTL;
    }

    await kv.put(finalKey, serialized, kvOptions);
  }

  /**
   * Get a value from cache
   */
  public async get<T>(key: string, namespace?: string): Promise<T | null> {
    const kv = this.getKV();
    const finalKey = this.getKey(key, namespace);
    const value = await kv.get(finalKey);
    
    if (!value) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Failed to parse cached value for key ${finalKey}:`, error);
      return null;
    }
  }

  /**
   * Delete a value from cache
   */
  public async delete(key: string, namespace?: string): Promise<void> {
    const kv = this.getKV();
    const finalKey = this.getKey(key, namespace);
    await kv.delete(finalKey);
  }

  /**
   * Check if a key exists in cache
   */
  public async has(key: string, namespace?: string): Promise<boolean> {
    const value = await this.get(key, namespace);
    return value !== null;
  }

  /**
   * Get or set a value (cache-aside pattern)
   */
  public async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key, options?.namespace);
    
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  /**
   * Invalidate cache by pattern (list keys and delete)
   * Note: KV doesn't support pattern matching natively
   */
  public async invalidateByPrefix(prefix: string): Promise<void> {
    const kv = this.getKV();
    
    // List keys with prefix
    const list = await kv.list({ prefix });
    
    // Delete all matching keys
    const deletePromises = list.keys.map(key => kv.delete(key.name));
    await Promise.all(deletePromises);
  }

  /**
   * Check if KV is initialized
   */
  public isInitialized(): boolean {
    return this.kv !== null;
  }
}
