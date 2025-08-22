// Secure API Key Management System - JavaScript Version
// Provides secure, encrypted storage and management of user API keys for AI providers
import { Hono } from 'hono';
import { verify } from 'hono/jwt';

// For Cloudflare Workers, we need to use Web Crypto API instead of Node.js crypto
// These functions will be replaced with Web Crypto API equivalents

/**
 * Encrypts an API key using Web Crypto API (AES-GCM)
 * @param {string} apiKey - The API key to encrypt
 * @param {Object} env - Environment bindings
 * @returns {Promise<string>} Base64 encoded encrypted key with IV
 */
async function encryptAPIKey(apiKey, env = null) {
  try {
    const encoder = new TextEncoder();
    const keyMaterial = encoder.encode(env?.ENCRYPTION_SECRET || 'default-encryption-key-change-in-production');
    
    // Import key material
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      await crypto.subtle.digest('SHA-256', keyMaterial),
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
    
    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt the API key
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      cryptoKey,
      encoder.encode(apiKey)
    );
    
    // Combine IV + encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);
    
    // Convert to base64
    return Buffer.from(combined).toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt API key');
  }
}

/**
 * Decrypts an API key using Web Crypto API (AES-GCM)
 * @param {string} encryptedKey - Base64 encoded encrypted key
 * @param {Object} env - Environment bindings
 * @returns {Promise<string>} Decrypted API key
 */
async function decryptAPIKey(encryptedKey, env = null) {
  try {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const keyMaterial = encoder.encode(env?.ENCRYPTION_SECRET || 'default-encryption-key-change-in-production');
    
    // Import key material
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      await crypto.subtle.digest('SHA-256', keyMaterial),
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
    
    // Decode base64
    const combined = new Uint8Array(Buffer.from(encryptedKey, 'base64'));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);
    
    // Decrypt
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      cryptoKey,
      encryptedData
    );
    
    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt API key');
  }
}

/**
 * Validates an API key format for a specific provider
 * @param {string} provider - AI provider name
 * @param {string} apiKey - API key to validate
 * @returns {boolean} True if valid format
 */
function validateAPIKeyFormat(provider, apiKey) {
  const patterns = {
    openai: /^sk-(proj-)?[A-Za-z0-9_-]{32,}$/,
    gemini: /^AIza[A-Za-z0-9_-]{35}$/,
    anthropic: /^sk-ant-[A-Za-z0-9_-]{95,}$/
  };
  
  const pattern = patterns[provider];
  return pattern ? pattern.test(apiKey) : false;
}

/**
 * Gets API key prefix for display purposes (first 8 characters)
 * @param {string} apiKey - Full API key
 * @returns {string} Key prefix for display
 */
function getKeyPrefix(apiKey) {
  return apiKey.length > 8 ? apiKey.substring(0, 8) + '...' : apiKey;
}

/**
 * Tests an API key by making a test request to the provider
 * @param {string} provider - AI provider name
 * @param {string} apiKey - API key to test
 * @returns {Promise<Object>} Test result with status and details
 */
async function testAPIKey(provider, apiKey) {
  const testEndpoints = {
    openai: {
      url: 'https://api.openai.com/v1/models',
      headers: { 'Authorization': `Bearer ${apiKey}` }
    },
    gemini: {
      url: `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`,
      headers: {}
    },
    anthropic: {
      url: 'https://api.anthropic.com/v1/messages',
      headers: { 
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      method: 'POST',
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'test' }]
      })
    }
  };

  const config = testEndpoints[provider];
  if (!config) {
    return { valid: false, error: 'Unsupported provider' };
  }

  try {
    const response = await fetch(config.url, {
      method: config.method || 'GET',
      headers: config.headers,
      body: config.body || undefined,
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    return {
      valid: response.ok,
      status: response.status,
      error: response.ok ? null : `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      valid: false,
      error: error.name === 'AbortError' ? 'Timeout' : 'Connection failed'
    };
  }
}

/**
 * Gets user ID from authentication token (supports both JWT and base64 tokens)
 * @param {Object} c - Hono context
 * @returns {Promise<number|null>} User ID or null if not authenticated
 */
async function getUserId(c) {
  try {
    const auth = c.req.header('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) return null;
    
    const token = auth.substring(7);
    
    // Try JWT verification first (for new API system)
    try {
      const JWT_SECRET = c.env.JWT_SECRET || 'development-fallback-secret';
      const payload = await verify(token, JWT_SECRET);
      return payload?.id || null;
    } catch (jwtError) {
      // Fallback to base64 token decoding (for old API system)
      try {
        const decoded = Buffer.from(token, 'base64').toString('utf8');
        const payload = JSON.parse(decoded);
        
        // Check if token is expired
        if (payload.exp && payload.exp < Date.now()) {
          console.log('Base64 token expired');
          return null;
        }
        
        return payload?.id || null;
      } catch (base64Error) {
        console.error('Both JWT and base64 token verification failed:', { jwtError, base64Error });
        return null;
      }
    }
  } catch (error) {
    console.error('Token verification error in getUserId:', error);
    return null;
  }
}

/**
 * Gets user's encrypted API keys from database
 * @param {Object} env - Environment bindings with DB
 * @param {number} userId - User ID
 * @returns {Promise<Object>} User's API keys by provider
 */
async function getUserAPIKeys(env, userId) {
  try {
    const result = await env.DB.prepare(`
      SELECT provider, encrypted_key, key_prefix, is_valid, created_at, last_tested
      FROM user_api_keys 
      WHERE user_id = ? AND deleted_at IS NULL
      ORDER BY provider
    `).bind(userId).all();

    const keys = {};
    for (const row of result.results || []) {
      keys[row.provider] = {
        encrypted: row.encrypted_key,
        prefix: row.key_prefix,
        valid: Boolean(row.is_valid),
        createdAt: row.created_at,
        lastTested: row.last_tested
      };
    }

    return keys;
  } catch (error) {
    console.error('Error getting user API keys:', error);
    return {};
  }
}

/**
 * Creates the secure key management API
 * @returns {Hono} Configured Hono app with key management routes
 */
export function createSecureKeyManagementAPI() {
  const app = new Hono();

  // Middleware to require authentication
  app.use('*', async (c, next) => {
    const userId = await getUserId(c);
    if (!userId) {
      return c.json({ success: false, error: 'Authentication required' }, 401);
    }
    c.set('userId', userId);
    await next();
  });

  // GET /status - Get user's API key status
  app.get('/status', async (c) => {
    try {
      const userId = c.get('userId');
      const userKeys = await getUserAPIKeys(c.env, userId);

      const status = {};
      for (const [provider, keyData] of Object.entries(userKeys)) {
        status[provider] = {
          configured: true,
          valid: keyData.valid,
          prefix: keyData.prefix,
          lastTested: keyData.lastTested,
          createdAt: keyData.createdAt
        };
      }

      // Add unconfigured providers
      const allProviders = ['openai', 'gemini', 'anthropic'];
      for (const provider of allProviders) {
        if (!status[provider]) {
          status[provider] = {
            configured: false,
            valid: false,
            prefix: null,
            lastTested: null,
            createdAt: null
          };
        }
      }

      return c.json({ success: true, data: status });
    } catch (error) {
      console.error('Error getting key status:', error);
      return c.json({ success: false, error: 'Failed to get key status' }, 500);
    }
  });

  // POST /set - Set/update API key for a provider
  app.post('/set', async (c) => {
    try {
      const userId = c.get('userId');
      const { provider, apiKey } = await c.req.json();

      // Validate input
      if (!provider || !apiKey) {
        return c.json({ success: false, error: 'Provider and API key are required' }, 400);
      }

      if (!['openai', 'gemini', 'anthropic'].includes(provider)) {
        return c.json({ success: false, error: 'Invalid provider' }, 400);
      }

      // Validate API key format
      if (!validateAPIKeyFormat(provider, apiKey)) {
        return c.json({ success: false, error: 'Invalid API key format for provider' }, 400);
      }

      // Test the API key
      const testResult = await testAPIKey(provider, apiKey);
      
      // Encrypt the API key
      const encryptedKey = await encryptAPIKey(apiKey, c.env);
      const keyPrefix = getKeyPrefix(apiKey);

      // Store in database (handle upsert manually)
      // First, soft delete any existing key
      await c.env.DB.prepare(`
        UPDATE user_api_keys 
        SET deleted_at = datetime('now')
        WHERE user_id = ? AND provider = ? AND deleted_at IS NULL
      `).bind(userId, provider).run();
      
      // Then insert the new key
      const result = await c.env.DB.prepare(`
        INSERT INTO user_api_keys (user_id, provider, encrypted_key, key_prefix, is_valid, created_at, last_tested)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(userId, provider, encryptedKey, keyPrefix, testResult.valid ? 1 : 0).run();

      // Log the action
      await c.env.DB.prepare(`
        INSERT INTO api_key_audit_log (user_id, provider, action, success, ip_address, user_agent)
        VALUES (?, ?, 'set', ?, ?, ?)
      `).bind(userId, provider, testResult.valid ? 1 : 0, 
             c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
             c.req.header('User-Agent') || 'unknown').run();

      return c.json({ 
        success: true, 
        data: { 
          provider,
          valid: testResult.valid,
          prefix: keyPrefix,
          testResult: testResult.error ? { error: testResult.error } : { status: 'valid' }
        }
      });
    } catch (error) {
      console.error('Error setting API key:', error);
      return c.json({ success: false, error: 'Failed to set API key' }, 500);
    }
  });

  // POST /test - Test API key for a provider
  app.post('/test', async (c) => {
    try {
      const userId = c.get('userId');
      const { provider } = await c.req.json();

      if (!provider || !['openai', 'gemini', 'anthropic'].includes(provider)) {
        return c.json({ success: false, error: 'Invalid provider' }, 400);
      }

      const userKeys = await getUserAPIKeys(c.env, userId);
      const keyData = userKeys[provider];
      
      if (!keyData) {
        return c.json({ success: false, error: 'API key not configured for provider' }, 404);
      }

      // Decrypt and test the API key
      const apiKey = await decryptAPIKey(keyData.encrypted, c.env);
      const testResult = await testAPIKey(provider, apiKey);

      // Update validity in database
      await c.env.DB.prepare(`
        UPDATE user_api_keys 
        SET is_valid = ?, last_tested = datetime('now')
        WHERE user_id = ? AND provider = ?
      `).bind(testResult.valid ? 1 : 0, userId, provider).run();

      // Log the test
      await c.env.DB.prepare(`
        INSERT INTO api_key_audit_log (user_id, provider, action, success, ip_address, user_agent)
        VALUES (?, ?, 'test', ?, ?, ?)
      `).bind(userId, provider, testResult.valid ? 1 : 0,
             c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
             c.req.header('User-Agent') || 'unknown').run();

      return c.json({ 
        success: true, 
        data: { 
          provider,
          valid: testResult.valid,
          status: testResult.status,
          error: testResult.error
        }
      });
    } catch (error) {
      console.error('Error testing API key:', error);
      return c.json({ success: false, error: 'Failed to test API key' }, 500);
    }
  });

  // DELETE /:provider - Delete API key for a provider
  app.delete('/:provider', async (c) => {
    try {
      const userId = c.get('userId');
      const provider = c.req.param('provider');

      if (!['openai', 'gemini', 'anthropic'].includes(provider)) {
        return c.json({ success: false, error: 'Invalid provider' }, 400);
      }

      // Soft delete the API key
      const result = await c.env.DB.prepare(`
        UPDATE user_api_keys 
        SET deleted_at = datetime('now')
        WHERE user_id = ? AND provider = ? AND deleted_at IS NULL
      `).bind(userId, provider).run();

      if (result.changes === 0) {
        return c.json({ success: false, error: 'API key not found or already deleted' }, 404);
      }

      // Log the deletion
      await c.env.DB.prepare(`
        INSERT INTO api_key_audit_log (user_id, provider, action, ip_address, user_agent)
        VALUES (?, ?, 'delete', ?, ?)
      `).bind(userId, provider,
             c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
             c.req.header('User-Agent') || 'unknown').run();

      return c.json({ success: true, data: { provider, action: 'deleted' } });
    } catch (error) {
      console.error('Error deleting API key:', error);
      return c.json({ success: false, error: 'Failed to delete API key' }, 500);
    }
  });

  return app;
}

// Export utility functions for use in AI proxy
export { getUserAPIKeys, decryptAPIKey };