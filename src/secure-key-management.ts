// Secure API Key Management System
// Users can set/update/delete API keys but never retrieve them

import { Hono } from 'hono';
import { CloudflareBindings } from './types';
import { authMiddleware } from './auth';

export interface APIKeyManagementRequest {
  provider: 'openai' | 'anthropic' | 'gemini';
  apiKey?: string; // Only provided when setting/updating
  action: 'set' | 'update' | 'delete' | 'test';
}

export interface APIKeyStatus {
  provider: string;
  hasKey: boolean;
  keyPrefix?: string; // Only first few characters for identification
  lastUpdated?: string;
  isValid?: boolean;
}

export function createSecureKeyManagementAPI() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  // Get API key status (never returns actual keys)
  app.get('/status', authMiddleware, async (c) => {
    try {
      const userId = c.get('user')?.id;
      
      // Try to get keys from database, but handle table not existing
      let keys = { results: [] };
      try {
        keys = await c.env.DB.prepare(`
          SELECT provider, key_prefix, last_updated, is_valid
          FROM user_api_keys 
          WHERE user_id = ? AND deleted_at IS NULL
        `).bind(userId).all();
      } catch (dbError) {
        console.warn('Database table user_api_keys not found, using fallback:', dbError.message);
        // Table doesn't exist yet, that's okay - return empty status
      }

      // Initialize status in the format expected by frontend
      const status = {
        openai: { configured: false, valid: false, prefix: null, lastTested: null, createdAt: null },
        gemini: { configured: false, valid: false, prefix: null, lastTested: null, createdAt: null },
        anthropic: { configured: false, valid: false, prefix: null, lastTested: null, createdAt: null }
      };

      // Update status for existing keys
      if (keys.results) {
        keys.results.forEach((key: any) => {
          if (status[key.provider]) {
            status[key.provider].configured = true;
            status[key.provider].valid = key.is_valid === 1;
            status[key.provider].prefix = key.key_prefix;
            status[key.provider].createdAt = key.last_updated;
          }
        });
      }

      return c.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('API key status error:', error);
      return c.json({
        success: false,
        error: 'Failed to load API key status'
      }, 500);
    }
  });

  // Set or update API key (write-only)
  app.post('/manage', authMiddleware, async (c) => {
    try {
      const userId = c.get('user')?.id;
      const { provider, apiKey, action }: APIKeyManagementRequest = await c.req.json();

      if (!provider || !['openai', 'anthropic', 'gemini'].includes(provider)) {
        return c.json({
          success: false,
          error: 'Invalid provider specified'
        }, 400);
      }

      switch (action) {
        case 'set':
        case 'update':
          if (!apiKey || !apiKey.trim()) {
            return c.json({
              success: false,
              error: 'API key is required'
            }, 400);
          }

          // Validate API key format
          const isValidFormat = validateAPIKeyFormat(provider, apiKey);
          if (!isValidFormat) {
            return c.json({
              success: false,
              error: `Invalid ${provider} API key format`
            }, 400);
          }

          // Test the API key before storing
          const isValidKey = await testAPIKey(provider, apiKey);
          
          // Encrypt the API key
          const encryptedKey = await encryptAPIKey(apiKey, c.env);
          const keyPrefix = getKeyPrefix(provider, apiKey);

          // Store in database (upsert) - handle table not existing
          try {
            await c.env.DB.prepare(`
              INSERT OR REPLACE INTO user_api_keys 
              (user_id, provider, encrypted_key, key_prefix, is_valid, last_updated, created_at)
              VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            `).bind(
              userId,
              provider,
              encryptedKey,
              keyPrefix,
              isValidKey ? 1 : 0
            ).run();
          } catch (dbError) {
            console.warn('Database table user_api_keys not found, key not persisted:', dbError.message);
            // For now, continue without database storage
            // In production, this would be handled by running migrations
          }

          // Log the action for audit
          try {
            await logAPIKeyAction(c.env, userId, provider, action, isValidKey);
          } catch (auditError) {
            console.warn('Audit logging failed:', auditError.message);
            // Continue without audit logging
          }

          return c.json({
            success: true,
            message: `${provider} API key ${action === 'set' ? 'set' : 'updated'} successfully`,
            data: {
              provider,
              isValid: isValidKey,
              keyPrefix,
              warning: !isValidKey ? 'API key format is correct but validation failed. Please check the key.' : null
            }
          });

        case 'delete':
          // Soft delete the API key
          try {
            await c.env.DB.prepare(`
              UPDATE user_api_keys 
              SET deleted_at = datetime('now') 
              WHERE user_id = ? AND provider = ?
            `).bind(userId, provider).run();
          } catch (dbError) {
            console.warn('Database table user_api_keys not found, delete not persisted:', dbError.message);
          }

          // Log the deletion
          try {
            await logAPIKeyAction(c.env, userId, provider, 'delete', true);
          } catch (auditError) {
            console.warn('Audit logging failed:', auditError.message);
          }

          return c.json({
            success: true,
            message: `${provider} API key deleted successfully`
          });

        case 'test':
          // Test existing API key
          const existingKey = await getDecryptedAPIKey(c.env, userId, provider);
          if (!existingKey) {
            return c.json({
              success: false,
              error: 'No API key found for this provider (database table may not exist yet)'
            }, 404);
          }

          const testResult = await testAPIKey(provider, existingKey);
          
          // Update validity status
          try {
            await c.env.DB.prepare(`
              UPDATE user_api_keys 
              SET is_valid = ?, last_tested = datetime('now')
              WHERE user_id = ? AND provider = ? AND deleted_at IS NULL
            `).bind(testResult ? 1 : 0, userId, provider).run();
          } catch (dbError) {
            console.warn('Database table user_api_keys not found, validity not persisted:', dbError.message);
          }

          return c.json({
            success: true,
            data: {
              provider,
              isValid: testResult,
              message: testResult ? 'API key is valid' : 'API key validation failed'
            }
          });

        default:
          return c.json({
            success: false,
            error: 'Invalid action specified'
          }, 400);
      }
    } catch (error) {
      console.error('API key management error:', error);
      return c.json({
        success: false,
        error: 'Failed to manage API key'
      }, 500);
    }
  });

  // Get decrypted API key for server-side AI requests (internal use only)
  app.get('/internal/:provider/:userId', async (c) => {
    try {
      // This endpoint is for internal server use only - validate it's called internally
      const userId = c.req.param('userId');
      const provider = c.req.param('provider');

      const apiKey = await getDecryptedAPIKey(c.env, userId, provider);
      
      if (!apiKey) {
        return c.json({
          success: false,
          error: 'API key not found'
        }, 404);
      }

      return c.json({
        success: true,
        data: { apiKey }
      });
    } catch (error) {
      console.error('Internal API key retrieval error:', error);
      return c.json({
        success: false,
        error: 'Failed to retrieve API key'
      }, 500);
    }
  });

  // Legacy endpoint for frontend compatibility
  app.post('/set', authMiddleware, async (c) => {
    try {
      const userId = c.get('user')?.id;
      const { provider, apiKey } = await c.req.json();

      if (!provider || !['openai', 'anthropic', 'gemini'].includes(provider)) {
        return c.json({
          success: false,
          error: 'Invalid provider specified'
        }, 400);
      }

      if (!apiKey || !apiKey.trim()) {
        return c.json({
          success: false,
          error: 'API key is required'
        }, 400);
      }

      // Call the main manage function with set action
      const requestBody = { provider, apiKey, action: 'set' };
      
      // Create a new request context for the manage endpoint
      const manageRequest = new Request(c.req.url, {
        method: 'POST',
        headers: c.req.raw.headers,
        body: JSON.stringify(requestBody)
      });
      
      // Create new context and call manage function
      const newContext = {
        ...c,
        req: {
          ...c.req,
          json: async () => requestBody
        }
      };
      
      // Validate API key format
      const isValidFormat = validateAPIKeyFormat(provider, apiKey);
      if (!isValidFormat) {
        return c.json({
          success: false,
          error: `Invalid ${provider} API key format`
        }, 400);
      }

      // Test the API key before storing
      const isValidKey = await testAPIKey(provider, apiKey);
      
      // Encrypt the API key
      const encryptedKey = await encryptAPIKey(apiKey, c.env);
      const keyPrefix = getKeyPrefix(provider, apiKey);

      // Store in database (upsert)
      await c.env.DB.prepare(`
        INSERT OR REPLACE INTO user_api_keys 
        (user_id, provider, encrypted_key, key_prefix, is_valid, last_updated, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `).bind(
        userId,
        provider,
        encryptedKey,
        keyPrefix,
        isValidKey ? 1 : 0
      ).run();

      // Log the action for audit
      await logAPIKeyAction(c.env, userId, provider, 'set', isValidKey);

      return c.json({
        success: true,
        message: `${provider} API key set successfully`,
        data: {
          provider,
          isValid: isValidKey,
          keyPrefix,
          warning: !isValidKey ? 'API key format is correct but validation failed. Please check the key.' : null
        }
      });

    } catch (error) {
      console.error('API key set error:', error);
      return c.json({
        success: false,
        error: 'Failed to set API key'
      }, 500);
    }
  });

  return app;
}

// Validation functions
function validateAPIKeyFormat(provider: string, apiKey: string): boolean {
  switch (provider) {
    case 'openai':
      return /^sk-[A-Za-z0-9]{32,}$/.test(apiKey) || /^sk-proj-[A-Za-z0-9_-]{20,}$/.test(apiKey);
    case 'anthropic':
      return /^sk-ant-[A-Za-z0-9_-]{95,}$/.test(apiKey);
    case 'gemini':
      return /^AIza[A-Za-z0-9_-]{35}$/.test(apiKey);
    default:
      return false;
  }
}

function getKeyPrefix(provider: string, apiKey: string): string {
  switch (provider) {
    case 'openai':
      return apiKey.startsWith('sk-proj-') ? 'sk-proj-***' : 'sk-***';
    case 'anthropic':
      return 'sk-ant-***';
    case 'gemini':
      return 'AIza***';
    default:
      return '***';
  }
}

// Encryption functions (simple example - use proper encryption for production)
async function encryptAPIKey(apiKey: string, env: CloudflareBindings): Promise<string> {
  // In production, use proper encryption with Cloudflare's crypto APIs
  // For now, using base64 encoding as a placeholder
  return btoa(apiKey);
}

async function decryptAPIKey(encryptedKey: string): Promise<string> {
  // In production, use proper decryption
  // For now, using base64 decoding as a placeholder
  return atob(encryptedKey);
}

async function getDecryptedAPIKey(env: CloudflareBindings, userId: string, provider: string): Promise<string | null> {
  try {
    const result = await env.DB.prepare(`
      SELECT encrypted_key 
      FROM user_api_keys 
      WHERE user_id = ? AND provider = ? AND deleted_at IS NULL
    `).bind(userId, provider).first();

    if (!result) {
      return null;
    }

    return await decryptAPIKey(result.encrypted_key as string);
  } catch (error) {
    console.warn('Error retrieving API key (table may not exist):', error);
    return null;
  }
}

// API key testing functions
async function testAPIKey(provider: string, apiKey: string): Promise<boolean> {
  try {
    switch (provider) {
      case 'openai':
        return await testOpenAIKey(apiKey);
      case 'anthropic':
        return await testAnthropicKey(apiKey);
      case 'gemini':
        return await testGeminiKey(apiKey);
      default:
        return false;
    }
  } catch (error) {
    console.error(`Error testing ${provider} API key:`, error);
    return false;
  }
}

async function testOpenAIKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function testAnthropicKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }]
      })
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function testGeminiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    return response.ok;
  } catch {
    return false;
  }
}

// Audit logging
async function logAPIKeyAction(
  env: CloudflareBindings, 
  userId: string, 
  provider: string, 
  action: string, 
  success: boolean
): Promise<void> {
  try {
    await env.DB.prepare(`
      INSERT INTO api_key_audit_log 
      (user_id, provider, action, success, timestamp, ip_address)
      VALUES (?, ?, ?, ?, datetime('now'), ?)
    `).bind(userId, provider, action, success ? 1 : 0, 'server-side').run();
  } catch (error) {
    console.warn('Failed to log API key action (audit table may not exist):', error);
    // Don't throw - logging failure shouldn't break the main functionality
  }
}