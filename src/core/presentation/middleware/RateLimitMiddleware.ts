/**
 * RateLimitMiddleware - Rate Limiting Protection
 * 
 * Prevents abuse by limiting request rates per client.
 * Supports multiple rate limiting strategies.
 */

import { Context, Next } from 'hono';
import { ResponseDTO } from '../../../application/dto/ResponseDTO';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /**
   * Maximum number of requests allowed
   */
  maxRequests: number;
  
  /**
   * Time window in milliseconds
   */
  windowMs: number;
  
  /**
   * Storage backend for rate limit data
   */
  store?: RateLimitStore;
  
  /**
   * Key generator function (default: IP address)
   */
  keyGenerator?: (c: Context) => string;
  
  /**
   * Handler when rate limit is exceeded
   */
  handler?: (c: Context) => Response;
  
  /**
   * Whether to skip rate limiting for failed requests
   */
  skipFailedRequests?: boolean;
  
  /**
   * Whether to skip rate limiting for successful requests
   */
  skipSuccessfulRequests?: boolean;
  
  /**
   * Custom headers to include in response
   */
  standardHeaders?: boolean;
  
  /**
   * Message to return when rate limit exceeded
   */
  message?: string;
}

/**
 * Rate limit store interface
 */
export interface RateLimitStore {
  /**
   * Increment counter for key
   */
  increment(key: string): Promise<number>;
  
  /**
   * Reset counter for key
   */
  reset(key: string): Promise<void>;
  
  /**
   * Get current count for key
   */
  get(key: string): Promise<number>;
  
  /**
   * Get time until reset
   */
  getResetTime(key: string): Promise<number>;
}

/**
 * In-memory rate limit store
 */
class MemoryStore implements RateLimitStore {
  private store: Map<string, { count: number; resetTime: number }> = new Map();
  private windowMs: number;

  constructor(windowMs: number) {
    this.windowMs = windowMs;
    
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  async increment(key: string): Promise<number> {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired one
      this.store.set(key, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return 1;
    }

    // Increment existing entry
    entry.count++;
    return entry.count;
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key);
  }

  async get(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry || entry.resetTime < Date.now()) {
      return 0;
    }
    return entry.count;
  }

  async getResetTime(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) {
      return Date.now() + this.windowMs;
    }
    return entry.resetTime;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime < now) {
        this.store.delete(key);
      }
    }
  }
}

/**
 * Rate limit middleware factory
 * 
 * @example
 * ```typescript
 * // Basic rate limiting: 100 requests per 15 minutes
 * app.use('/api/*', rateLimit({
 *   maxRequests: 100,
 *   windowMs: 15 * 60 * 1000
 * }));
 * 
 * // Strict rate limiting for authentication
 * app.post('/api/login', rateLimit({
 *   maxRequests: 5,
 *   windowMs: 15 * 60 * 1000,
 *   message: 'Too many login attempts. Please try again later.'
 * }));
 * ```
 */
export function rateLimit(config: RateLimitConfig) {
  const store = config.store || new MemoryStore(config.windowMs);
  const keyGenerator = config.keyGenerator || defaultKeyGenerator;
  const standardHeaders = config.standardHeaders ?? true;
  const message = config.message || 'Too many requests. Please try again later.';

  return async (c: Context, next: Next) => {
    try {
      // Generate key for this client
      const key = keyGenerator(c);
      
      // Increment request count
      const count = await store.increment(key);
      const resetTime = await store.getResetTime(key);
      const remaining = Math.max(0, config.maxRequests - count);

      // Add rate limit headers
      if (standardHeaders) {
        c.header('X-RateLimit-Limit', config.maxRequests.toString());
        c.header('X-RateLimit-Remaining', remaining.toString());
        c.header('X-RateLimit-Reset', new Date(resetTime).toISOString());
      }

      // Check if limit exceeded
      if (count > config.maxRequests) {
        const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
        c.header('Retry-After', retryAfter.toString());
        
        if (config.handler) {
          return config.handler(c);
        }
        
        return c.json(
          ResponseDTO.error(
            'RATE_LIMIT_EXCEEDED',
            message,
            {
              limit: config.maxRequests,
              windowMs: config.windowMs,
              retryAfter
            }
          ),
          429
        );
      }

      await next();

      // Handle skip options
      if (config.skipSuccessfulRequests && c.res.status < 400) {
        await store.reset(key);
      } else if (config.skipFailedRequests && c.res.status >= 400) {
        await store.reset(key);
      }
      
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // On error, allow request to proceed (fail open)
      await next();
    }
  };
}

/**
 * Default key generator using IP address
 */
function defaultKeyGenerator(c: Context): string {
  // Try to get real IP from headers
  const forwardedFor = c.req.header('X-Forwarded-For');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  const realIp = c.req.header('X-Real-IP');
  if (realIp) {
    return realIp;
  }
  
  // Fallback to connection IP (may not be available in all environments)
  return c.req.header('CF-Connecting-IP') || 'unknown';
}

/**
 * Create a rate limit key generator based on user ID
 * 
 * @example
 * ```typescript
 * app.use('/api/user/*', rateLimit({
 *   maxRequests: 1000,
 *   windowMs: 60 * 60 * 1000,
 *   keyGenerator: userIdKeyGenerator()
 * }));
 * ```
 */
export function userIdKeyGenerator(): (c: Context) => string {
  return (c: Context) => {
    const user = c.get('user');
    if (user && user.id) {
      return `user:${user.id}`;
    }
    // Fallback to IP if no user
    return defaultKeyGenerator(c);
  };
}

/**
 * Create a rate limit key generator based on API key
 * 
 * @example
 * ```typescript
 * app.use('/api/*', rateLimit({
 *   maxRequests: 10000,
 *   windowMs: 60 * 60 * 1000,
 *   keyGenerator: apiKeyGenerator('X-API-Key')
 * }));
 * ```
 */
export function apiKeyGenerator(headerName: string = 'X-API-Key'): (c: Context) => string {
  return (c: Context) => {
    const apiKey = c.req.header(headerName);
    if (apiKey) {
      return `api:${apiKey}`;
    }
    // Fallback to IP if no API key
    return defaultKeyGenerator(c);
  };
}

/**
 * Create a Cloudflare D1-based rate limit store
 * Useful for distributed deployments
 * 
 * @example
 * ```typescript
 * const d1Store = createD1RateLimitStore(env.DB, 15 * 60 * 1000);
 * app.use('/api/*', rateLimit({
 *   maxRequests: 100,
 *   windowMs: 15 * 60 * 1000,
 *   store: d1Store
 * }));
 * ```
 */
export function createD1RateLimitStore(
  db: D1Database, 
  windowMs: number
): RateLimitStore {
  return {
    async increment(key: string): Promise<number> {
      const now = Date.now();
      const resetTime = now + windowMs;
      
      // Try to insert or increment
      const result = await db.prepare(`
        INSERT INTO rate_limits (key, count, reset_time) 
        VALUES (?, 1, ?)
        ON CONFLICT(key) DO UPDATE SET 
          count = CASE 
            WHEN reset_time < ? THEN 1 
            ELSE count + 1 
          END,
          reset_time = CASE 
            WHEN reset_time < ? THEN ? 
            ELSE reset_time 
          END
        RETURNING count
      `).bind(key, resetTime, now, now, resetTime).first<{ count: number }>();
      
      return result?.count || 1;
    },
    
    async reset(key: string): Promise<void> {
      await db.prepare(`DELETE FROM rate_limits WHERE key = ?`).bind(key).run();
    },
    
    async get(key: string): Promise<number> {
      const result = await db.prepare(`
        SELECT count FROM rate_limits 
        WHERE key = ? AND reset_time > ?
      `).bind(key, Date.now()).first<{ count: number }>();
      
      return result?.count || 0;
    },
    
    async getResetTime(key: string): Promise<number> {
      const result = await db.prepare(`
        SELECT reset_time FROM rate_limits WHERE key = ?
      `).bind(key).first<{ reset_time: number }>();
      
      return result?.reset_time || Date.now() + windowMs;
    }
  };
}

/**
 * Rate limit presets for common use cases
 */
export const RateLimitPresets = {
  /**
   * Strict rate limit for authentication endpoints
   */
  auth: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Too many authentication attempts. Please try again later.'
  },
  
  /**
   * Standard API rate limit
   */
  api: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000 // 15 minutes
  },
  
  /**
   * Permissive rate limit for public endpoints
   */
  public: {
    maxRequests: 1000,
    windowMs: 15 * 60 * 1000 // 15 minutes
  },
  
  /**
   * Very strict rate limit for expensive operations
   */
  expensive: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000 // 1 hour
  }
};
