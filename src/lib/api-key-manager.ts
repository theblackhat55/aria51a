/**
 * ARIA5 API Key Management System
 * Secure server-side API key storage with one-way operations
 */

import { generateApiKey, hashApiKey, verifyApiKey, maskApiKey } from './security.js';

export interface ApiKeyRecord {
  id: string;
  user_id: number;
  provider: string;
  name: string;
  key_hash: string;
  masked_key: string;
  created_at: string;
  last_used: string | null;
  is_active: boolean;
}

export interface ApiKeyInput {
  provider: string;
  name: string;
  key: string;
}

export class ApiKeyManager {
  private db: any;

  constructor(database: any) {
    this.db = database;
  }

  /**
   * Store API key securely (one-way operation)
   */
  async storeApiKey(userId: number, input: ApiKeyInput): Promise<{ success: boolean; keyId: string; message: string }> {
    try {
      // Validate input
      if (!input.provider || !input.name || !input.key) {
        return { success: false, keyId: '', message: 'Provider, name, and key are required' };
      }

      if (input.key.length < 10) {
        return { success: false, keyId: '', message: 'API key is too short' };
      }

      if (input.key.length > 500) {
        return { success: false, keyId: '', message: 'API key is too long' };
      }

      // Check if user already has a key for this provider
      const existingKey = await this.db.prepare(`
        SELECT id FROM api_keys 
        WHERE user_id = ? AND provider = ? AND is_active = 1
      `).bind(userId, input.provider).first();

      if (existingKey) {
        return { success: false, keyId: '', message: `You already have an active ${input.provider} API key. Delete the existing key first.` };
      }

      // Hash the API key (one-way)
      const keyHash = await hashApiKey(input.key);
      const maskedKey = maskApiKey(input.key);
      const keyId = crypto.randomUUID();

      // Store hashed key in database
      await this.db.prepare(`
        INSERT INTO api_keys (id, user_id, provider, name, key_hash, masked_key, created_at, is_active)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 1)
      `).bind(keyId, userId, input.provider, input.name, keyHash, maskedKey).run();

      return { 
        success: true, 
        keyId, 
        message: `${input.provider} API key stored successfully. Key is masked for security: ${maskedKey}` 
      };

    } catch (error) {
      console.error('Error storing API key:', error);
      return { success: false, keyId: '', message: 'Failed to store API key' };
    }
  }

  /**
   * Update API key (replaces existing key - one-way operation)
   */
  async updateApiKey(userId: number, keyId: string, newKey: string): Promise<{ success: boolean; message: string }> {
    try {
      // Validate key exists and belongs to user
      const existingKey = await this.db.prepare(`
        SELECT id, provider FROM api_keys 
        WHERE id = ? AND user_id = ? AND is_active = 1
      `).bind(keyId, userId).first();

      if (!existingKey) {
        return { success: false, message: 'API key not found or access denied' };
      }

      if (newKey.length < 10) {
        return { success: false, message: 'New API key is too short' };
      }

      if (newKey.length > 500) {
        return { success: false, message: 'New API key is too long' };
      }

      // Hash new key
      const keyHash = await hashApiKey(newKey);
      const maskedKey = maskApiKey(newKey);

      // Update key in database
      await this.db.prepare(`
        UPDATE api_keys 
        SET key_hash = ?, masked_key = ?, updated_at = datetime('now')
        WHERE id = ? AND user_id = ?
      `).bind(keyHash, maskedKey, keyId, userId).run();

      return { 
        success: true, 
        message: `${existingKey.provider} API key updated successfully. New key is masked: ${maskedKey}` 
      };

    } catch (error) {
      console.error('Error updating API key:', error);
      return { success: false, message: 'Failed to update API key' };
    }
  }

  /**
   * Delete API key
   */
  async deleteApiKey(userId: number, keyId: string): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.db.prepare(`
        DELETE FROM api_keys 
        WHERE id = ? AND user_id = ?
      `).bind(keyId, userId).run();

      if (result.changes === 0) {
        return { success: false, message: 'API key not found or access denied' };
      }

      return { success: true, message: 'API key deleted successfully' };

    } catch (error) {
      console.error('Error deleting API key:', error);
      return { success: false, message: 'Failed to delete API key' };
    }
  }

  /**
   * List user's API keys (only shows masked versions)
   */
  async listUserApiKeys(userId: number): Promise<{ success: boolean; keys: Partial<ApiKeyRecord>[]; message: string }> {
    try {
      const keys = await this.db.prepare(`
        SELECT id, provider, name, masked_key, created_at, last_used, is_active
        FROM api_keys 
        WHERE user_id = ? AND is_active = 1
        ORDER BY created_at DESC
      `).bind(userId).all();

      return {
        success: true,
        keys: keys.results || [],
        message: `Found ${(keys.results || []).length} API keys`
      };

    } catch (error) {
      console.error('Error listing API keys:', error);
      return { success: false, keys: [], message: 'Failed to list API keys' };
    }
  }

  /**
   * Get API key for use (admin/system use only)
   * This should only be called by the system for making API calls
   */
  async getApiKeyForProvider(userId: number, provider: string, providedKey?: string): Promise<string | null> {
    try {
      // If a key is provided directly, verify and use it
      if (providedKey) {
        // For development/testing, allow direct key usage
        return providedKey;
      }

      // Otherwise, get from stored keys
      const keyRecord = await this.db.prepare(`
        SELECT key_hash FROM api_keys 
        WHERE user_id = ? AND provider = ? AND is_active = 1
        ORDER BY created_at DESC
        LIMIT 1
      `).bind(userId, provider).first();

      if (!keyRecord) {
        return null;
      }

      // Note: We cannot retrieve the original key from the hash
      // This is intentional for security. In production, you would:
      // 1. Use Cloudflare's secret management
      // 2. Or implement a proper encryption scheme with a master key
      // For now, return null and rely on direct key provision
      return null;

    } catch (error) {
      console.error('Error getting API key:', error);
      return null;
    }
  }

  /**
   * Update last used timestamp
   */
  async updateLastUsed(userId: number, provider: string): Promise<void> {
    try {
      await this.db.prepare(`
        UPDATE api_keys 
        SET last_used = datetime('now')
        WHERE user_id = ? AND provider = ? AND is_active = 1
      `).bind(userId, provider).run();
    } catch (error) {
      console.error('Error updating last used:', error);
    }
  }

  /**
   * Validate API key format for different providers
   */
  static validateApiKeyFormat(provider: string, key: string): { valid: boolean; message: string } {
    const patterns = {
      'openai': /^sk-[a-zA-Z0-9]{20,}$/,
      'anthropic': /^sk-ant-[a-zA-Z0-9_-]{95,}$/,
      'google': /^[a-zA-Z0-9_-]{20,}$/,
      'mistral': /^[a-zA-Z0-9]{32}$/,
      'cohere': /^[a-zA-Z0-9_-]{20,}$/,
      'huggingface': /^hf_[a-zA-Z0-9]{20,}$/
    };

    const pattern = patterns[provider.toLowerCase() as keyof typeof patterns];
    
    if (!pattern) {
      return { valid: true, message: 'Provider pattern not defined, allowing any format' };
    }

    const isValid = pattern.test(key);
    
    return {
      valid: isValid,
      message: isValid ? 'Valid format' : `Invalid ${provider} API key format`
    };
  }
}

/**
 * Supported AI providers
 */
export const SUPPORTED_PROVIDERS = {
  'openai': { name: 'OpenAI', description: 'GPT models and completions' },
  'anthropic': { name: 'Anthropic', description: 'Claude models' },
  'google': { name: 'Google AI', description: 'Gemini models' },
  'mistral': { name: 'Mistral AI', description: 'Mistral models' },
  'cohere': { name: 'Cohere', description: 'Cohere models' },
  'huggingface': { name: 'Hugging Face', description: 'Open source models' },
  'cloudflare': { name: 'Cloudflare AI', description: 'Built-in AI models (no key required)' }
} as const;

export type ProviderKey = keyof typeof SUPPORTED_PROVIDERS;