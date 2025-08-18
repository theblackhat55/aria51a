// Kong Gateway Integration for Risk Management Platform
// This module provides utilities to work with Kong Gateway features

export interface KongHeaders {
  'X-Kong-Request-ID'?: string;
  'X-Kong-Proxy-Latency'?: string;
  'X-Kong-Upstream-Latency'?: string;
  'X-Forwarded-For'?: string;
  'X-Real-IP'?: string;
  'X-Consumer-ID'?: string;
  'X-Consumer-Username'?: string;
  'X-Anonymous-Consumer'?: string;
}

export interface KongContext {
  requestId: string;
  consumerId?: string;
  consumerUsername?: string;
  isAnonymous: boolean;
  proxyLatency?: number;
  upstreamLatency?: number;
  clientIP: string;
}

export class KongIntegration {
  
  /**
   * Extract Kong context from request headers
   */
  static extractKongContext(headers: Record<string, string>): KongContext {
    return {
      requestId: headers['x-kong-request-id'] || this.generateRequestId(),
      consumerId: headers['x-consumer-id'],
      consumerUsername: headers['x-consumer-username'],
      isAnonymous: headers['x-anonymous-consumer'] === 'true',
      proxyLatency: headers['x-kong-proxy-latency'] ? 
        parseFloat(headers['x-kong-proxy-latency']) : undefined,
      upstreamLatency: headers['x-kong-upstream-latency'] ? 
        parseFloat(headers['x-kong-upstream-latency']) : undefined,
      clientIP: headers['x-real-ip'] || 
                headers['x-forwarded-for']?.split(',')[0]?.trim() || 
                'unknown'
    };
  }

  /**
   * Kong-aware rate limiting check
   * Returns true if request should be rate limited based on Kong headers
   */
  static shouldRateLimit(headers: Record<string, string>): boolean {
    // Kong handles rate limiting, so we check if it's already applied
    const rateLimitRemaining = headers['x-ratelimit-remaining'];
    const rateLimitLimit = headers['x-ratelimit-limit'];
    
    if (rateLimitRemaining && rateLimitLimit) {
      const remaining = parseInt(rateLimitRemaining);
      const limit = parseInt(rateLimitLimit);
      
      // Log rate limit status for monitoring
      console.log(`Rate limit status: ${remaining}/${limit} remaining`);
      
      return remaining <= 0;
    }
    
    return false; // Let Kong handle rate limiting
  }

  /**
   * Enhanced logging with Kong context
   */
  static logWithKongContext(
    level: 'info' | 'warn' | 'error', 
    message: string, 
    context: KongContext, 
    additional?: any
  ) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      kong: {
        requestId: context.requestId,
        consumerId: context.consumerId,
        consumerUsername: context.consumerUsername,
        isAnonymous: context.isAnonymous,
        clientIP: context.clientIP,
        proxyLatency: context.proxyLatency,
        upstreamLatency: context.upstreamLatency
      },
      ...additional
    };
    
    console.log(JSON.stringify(logEntry));
  }

  /**
   * Kong JWT validation middleware
   * Works with Kong's JWT plugin
   */
  static createKongJWTMiddleware() {
    return async (c: any, next: () => Promise<void>) => {
      const kongContext = this.extractKongContext(c.req.header());
      
      // If Kong JWT plugin is enabled, it will set consumer headers
      if (kongContext.consumerId) {
        // Set user context from Kong consumer
        c.set('kongContext', kongContext);
        c.set('user', {
          id: kongContext.consumerId,
          username: kongContext.consumerUsername,
          isAnonymous: kongContext.isAnonymous
        });
        
        this.logWithKongContext('info', 'Kong JWT validation successful', kongContext);
      } else if (!kongContext.isAnonymous) {
        // No Kong consumer but not anonymous - might be an error
        this.logWithKongContext('warn', 'No Kong consumer found for authenticated request', kongContext);
        
        return c.json({ 
          success: false, 
          error: 'Authentication failed',
          requestId: kongContext.requestId
        }, 401);
      }
      
      await next();
    };
  }

  /**
   * Kong-aware CORS middleware (disable if Kong handles CORS)
   */
  static createKongCORSMiddleware() {
    return async (c: any, next: () => Promise<void>) => {
      const kongContext = this.extractKongContext(c.req.header());
      
      // Check if Kong CORS plugin is handling CORS
      const hasCORSHeaders = c.req.header('Access-Control-Allow-Origin') || 
                            c.req.header('access-control-allow-origin');
      
      if (!hasCORSHeaders) {
        // Kong CORS plugin not active, handle CORS in application
        this.logWithKongContext('info', 'Handling CORS in application (Kong CORS not detected)', kongContext);
        
        c.header('Access-Control-Allow-Origin', '*');
        c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        c.header('Access-Control-Max-Age', '86400');
      } else {
        this.logWithKongContext('info', 'Kong CORS plugin detected, skipping application CORS', kongContext);
      }
      
      await next();
    };
  }

  /**
   * Kong-aware request/response transformation
   */
  static createRequestTransformerMiddleware() {
    return async (c: any, next: () => Promise<void>) => {
      const kongContext = this.extractKongContext(c.req.header());
      
      // Add Kong context to request
      c.set('kongContext', kongContext);
      
      // Add standard headers for downstream services
      c.req.headers.set('X-Request-ID', kongContext.requestId);
      c.req.headers.set('X-Client-IP', kongContext.clientIP);
      
      // Log request with Kong context
      this.logWithKongContext('info', `${c.req.method} ${c.req.url}`, kongContext, {
        method: c.req.method,
        path: new URL(c.req.url).pathname,
        userAgent: c.req.header('User-Agent')
      });
      
      const startTime = Date.now();
      
      await next();
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Add response headers
      c.header('X-Request-ID', kongContext.requestId);
      c.header('X-Response-Time', `${responseTime}ms`);
      
      // Log response with Kong context
      this.logWithKongContext('info', `Response ${c.res.status}`, kongContext, {
        status: c.res.status,
        responseTime: `${responseTime}ms`,
        totalLatency: (context.proxyLatency || 0) + responseTime
      });
    };
  }

  /**
   * Kong Admin API client for runtime configuration
   */
  static createKongAdminClient(adminUrl: string = 'http://localhost:8001') {
    return {
      // Get service health
      async getServiceHealth(serviceName: string) {
        try {
          const response = await fetch(`${adminUrl}/services/${serviceName}/health`);
          return response.json();
        } catch (error) {
          console.error('Kong admin API error:', error);
          return null;
        }
      },

      // Update rate limiting for a consumer
      async updateConsumerRateLimit(consumerId: string, config: any) {
        try {
          const response = await fetch(`${adminUrl}/consumers/${consumerId}/plugins`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'rate-limiting',
              config
            })
          });
          return response.json();
        } catch (error) {
          console.error('Kong rate limit update error:', error);
          return null;
        }
      },

      // Get API analytics
      async getAPIMetrics() {
        try {
          const response = await fetch(`${adminUrl}/status`);
          return response.json();
        } catch (error) {
          console.error('Kong metrics error:', error);
          return null;
        }
      }
    };
  }

  /**
   * Generate request ID if Kong doesn't provide one
   */
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Kong plugin configuration helpers
   */
  static getKongPluginConfig() {
    return {
      // JWT Plugin Configuration
      jwt: {
        name: 'jwt',
        config: {
          uri_param_names: ['jwt'],
          cookie_names: ['jwt'],
          header_names: ['authorization'],
          claims_to_verify: ['exp', 'nbf'],
          key_claim_name: 'iss',
          secret_is_base64: false
        }
      },

      // Rate Limiting Plugin Configuration  
      rateLimiting: {
        name: 'rate-limiting',
        config: {
          minute: 100,
          hour: 1000,
          day: 10000,
          policy: 'redis',
          redis_host: 'kong-redis',
          redis_port: 6379,
          hide_client_headers: false
        }
      },

      // CORS Plugin Configuration
      cors: {
        name: 'cors',
        config: {
          origins: ['http://localhost:3000', 'https://*.pages.dev'],
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          headers: ['Accept', 'Authorization', 'Content-Type', 'X-Requested-With'],
          credentials: true,
          max_age: 86400
        }
      },

      // Request/Response Transformer
      requestTransformer: {
        name: 'request-transformer',
        config: {
          add: {
            headers: ['X-Powered-By:Risk-Management-Platform']
          }
        }
      },

      // Security Headers
      responseTransformer: {
        name: 'response-transformer', 
        config: {
          add: {
            headers: [
              'X-Content-Type-Options:nosniff',
              'X-Frame-Options:DENY', 
              'X-XSS-Protection:1; mode=block',
              'Strict-Transport-Security:max-age=31536000'
            ]
          }
        }
      }
    };
  }
}