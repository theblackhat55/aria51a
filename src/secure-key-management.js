// Secure API Key Management System - JavaScript Version
// Provides secure, encrypted storage and management of user API keys for AI providers
import { Hono } from 'hono';
import { createHash, createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Encryption key derivation from environment or fallback
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'default-encryption-key-change-in-production';

/**
 * Encrypts an API key using AES-256-GCM encryption
 * @param {string} apiKey - The API key to encrypt
 * @param {Object} env - Environment bindings (not used in Node.js version)
 * @returns {Promise<string>} Base64 encoded encrypted key with IV and salt
 */
async function encryptAPIKey(apiKey, env = null) {
  try {
    const salt = randomBytes(16);
    const iv = randomBytes(16);
    
    // Derive key from secret and salt
    const key = await scryptAsync(ENCRYPTION_SECRET, salt, 32);
    
    // Create cipher
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    
    // Encrypt the API key
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Combine salt + iv + authTag + encrypted data
    const combined = Buffer.concat([
      salt,
      iv, 
      authTag,
      Buffer.from(encrypted, 'hex')
    ]);
    
    return combined.toString('base64');
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt API key');
  }
}

/**
 * Decrypts an API key using AES-256-GCM decryption
 * @param {string} encryptedKey - Base64 encoded encrypted key
 * @param {Object} env - Environment bindings (not used in Node.js version)
 * @returns {Promise<string>} Decrypted API key
 */
async function decryptAPIKey(encryptedKey, env = null) {
  try {
    const combined = Buffer.from(encryptedKey, 'base64');
    
    // Extract components
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 32);
    const authTag = combined.slice(32, 48);
    const encrypted = combined.slice(48);
    
    // Derive key from secret and salt
    const key = await scryptAsync(ENCRYPTION_SECRET, salt, 32);
    
    // Create decipher
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, null, 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
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
    openai: /^sk-[A-Za-z0-9]{32,}$/,
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
 * Gets user ID from authentication token
 * @param {Object} c - Hono context
 * @returns {number|null} User ID or null if not authenticated
 */
function getUserId(c) {
  try {
    const auth = c.req.header('Authorization');
    if (!auth || !auth.startsWith('Bearer ')) return null;
    
    const token = auth.substring(7);
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    
    return payload?.id || null;
  } catch (error) {
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
    const result = env.DB.prepare(`
      SELECT provider, encrypted_key, key_prefix, is_valid, created_at, last_tested
      FROM user_api_keys 
      WHERE user_id = ? AND deleted_at IS NULL
      ORDER BY provider
    `).all(userId);

    if (!result.success) {
      return {};
    }

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
    const userId = getUserId(c);
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
      c.env.DB.prepare(`
        UPDATE user_api_keys 
        SET deleted_at = datetime('now')
        WHERE user_id = ? AND provider = ? AND deleted_at IS NULL
      `).run(userId, provider);
      
      // Then insert the new key
      const result = c.env.DB.prepare(`
        INSERT INTO user_api_keys (user_id, provider, encrypted_key, key_prefix, is_valid, created_at, last_tested)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).run(userId, provider, encryptedKey, keyPrefix, testResult.valid ? 1 : 0);

      if (!result.success) {
        throw new Error('Database operation failed');
      }

      // Log the action
      c.env.DB.prepare(`
        INSERT INTO api_key_audit_log (user_id, provider, action, success, ip_address, user_agent)
        VALUES (?, ?, 'set', ?, ?, ?)
      `).run(userId, provider, testResult.valid ? 1 : 0, 
             c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
             c.req.header('User-Agent') || 'unknown');

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
      c.env.DB.prepare(`
        UPDATE user_api_keys 
        SET is_valid = ?, last_tested = datetime('now')
        WHERE user_id = ? AND provider = ?
      `).run(testResult.valid ? 1 : 0, userId, provider);

      // Log the test
      c.env.DB.prepare(`
        INSERT INTO api_key_audit_log (user_id, provider, action, success, ip_address, user_agent)
        VALUES (?, ?, 'test', ?, ?, ?)
      `).run(userId, provider, testResult.valid ? 1 : 0,
             c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
             c.req.header('User-Agent') || 'unknown');

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
      const result = c.env.DB.prepare(`
        UPDATE user_api_keys 
        SET deleted_at = datetime('now'), last_updated = datetime('now')
        WHERE user_id = ? AND provider = ? AND deleted_at IS NULL
      `).run(userId, provider);

      if (!result.success || result.changes === 0) {
        return c.json({ success: false, error: 'API key not found or already deleted' }, 404);
      }

      // Log the deletion
      c.env.DB.prepare(`
        INSERT INTO api_key_audit_log (user_id, provider, action, ip_address, user_agent)
        VALUES (?, ?, 'delete', ?, ?)
      `).run(userId, provider,
             c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown',
             c.req.header('User-Agent') || 'unknown');

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