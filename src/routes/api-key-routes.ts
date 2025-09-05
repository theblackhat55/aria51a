/**
 * ARIA5 API Key Management Routes
 * Secure server-side API key management with one-way operations
 */

import { Hono } from 'hono';
import { html } from 'hono/html';
import { ApiKeyManager, SUPPORTED_PROVIDERS, type ProviderKey } from '../lib/api-key-manager.js';
import { sanitizeInput } from '../lib/security.js';
import { authMiddleware, requireAdmin, auditMiddleware } from '../middleware/auth-middleware.js';

export function createApiKeyRoutes() {
  const app = new Hono();

  // Apply authentication to all routes
  app.use('*', authMiddleware);

  // API Keys management page (admin only)
  app.get('/admin/api-keys', requireAdmin, async (c) => {
    const user = c.get('user');
    const keyManager = new ApiKeyManager(c.env.DB);
    
    try {
      const { keys } = await keyManager.listUserApiKeys(user.id);
      
      return c.html(renderApiKeysPage(keys, user));
    } catch (error) {
      console.error('Error loading API keys:', error);
      return c.html(renderApiKeysPage([], user, 'Failed to load API keys'));
    }
  });

  // Add new API key
  app.post('/admin/api-keys/add', requireAdmin, auditMiddleware('add_api_key', 'api_key'), async (c) => {
    const user = c.get('user');
    const keyManager = new ApiKeyManager(c.env.DB);
    
    try {
      const formData = await c.req.parseBody();
      const provider = sanitizeInput(formData.provider as string);
      const name = sanitizeInput(formData.name as string);
      const key = formData.key as string; // Don't sanitize the actual key
      
      if (!provider || !name || !key) {
        return c.html(renderError('Provider, name, and API key are required'));
      }

      // Validate provider
      if (!(provider in SUPPORTED_PROVIDERS)) {
        return c.html(renderError('Unsupported provider'));
      }

      // Validate key format
      const validation = ApiKeyManager.validateApiKeyFormat(provider, key);
      if (!validation.valid) {
        return c.html(renderError(validation.message));
      }

      const result = await keyManager.storeApiKey(user.id, {
        provider,
        name,
        key
      });

      if (result.success) {
        return c.html(html`
          <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div class="flex items-center">
              <i class="fas fa-check-circle text-green-500 mr-2"></i>
              <span class="text-green-700 font-medium">${result.message}</span>
            </div>
          </div>
          <script>
            setTimeout(() => {
              htmx.ajax('GET', '/admin/api-keys/list', '#api-keys-list');
              document.getElementById('add-key-form').reset();
              document.getElementById('add-key-modal').style.display = 'none';
            }, 2000);
          </script>
        `);
      } else {
        return c.html(renderError(result.message));
      }

    } catch (error) {
      console.error('Error adding API key:', error);
      return c.html(renderError('Failed to add API key'));
    }
  });

  // Update existing API key
  app.post('/admin/api-keys/:keyId/update', requireAdmin, auditMiddleware('update_api_key', 'api_key'), async (c) => {
    const user = c.get('user');
    const keyManager = new ApiKeyManager(c.env.DB);
    const keyId = c.req.param('keyId');
    
    try {
      const formData = await c.req.parseBody();
      const newKey = formData.key as string;
      
      if (!newKey) {
        return c.html(renderError('New API key is required'));
      }

      const result = await keyManager.updateApiKey(user.id, keyId, newKey);

      if (result.success) {
        return c.html(html`
          <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div class="flex items-center">
              <i class="fas fa-check-circle text-green-500 mr-2"></i>
              <span class="text-green-700 font-medium">${result.message}</span>
            </div>
          </div>
          <script>
            setTimeout(() => {
              htmx.ajax('GET', '/admin/api-keys/list', '#api-keys-list');
              document.getElementById('update-key-modal-${keyId}').style.display = 'none';
            }, 2000);
          </script>
        `);
      } else {
        return c.html(renderError(result.message));
      }

    } catch (error) {
      console.error('Error updating API key:', error);
      return c.html(renderError('Failed to update API key'));
    }
  });

  // Delete API key
  app.delete('/admin/api-keys/:keyId', requireAdmin, auditMiddleware('delete_api_key', 'api_key'), async (c) => {
    const user = c.get('user');
    const keyManager = new ApiKeyManager(c.env.DB);
    const keyId = c.req.param('keyId');
    
    try {
      const result = await keyManager.deleteApiKey(user.id, keyId);

      if (result.success) {
        return c.html(html`
          <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <div class="flex items-center">
              <i class="fas fa-check-circle text-green-500 mr-2"></i>
              <span class="text-green-700 font-medium">${result.message}</span>
            </div>
          </div>
          <script>
            setTimeout(() => {
              htmx.ajax('GET', '/admin/api-keys/list', '#api-keys-list');
            }, 1000);
          </script>
        `);
      } else {
        return c.html(renderError(result.message));
      }

    } catch (error) {
      console.error('Error deleting API key:', error);
      return c.html(renderError('Failed to delete API key'));
    }
  });

  // List API keys (HTMX endpoint)
  app.get('/admin/api-keys/list', requireAdmin, async (c) => {
    const user = c.get('user');
    const keyManager = new ApiKeyManager(c.env.DB);
    
    try {
      const { keys } = await keyManager.listUserApiKeys(user.id);
      return c.html(renderApiKeysList(keys));
    } catch (error) {
      console.error('Error loading API keys list:', error);
      return c.html('<div class="text-red-600">Failed to load API keys</div>');
    }
  });

  return app;
}

// Render functions
function renderApiKeysPage(keys: any[], user: any, error?: string) {
  return html`
    <div class="min-h-screen bg-gray-50">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Header -->
        <div class="bg-white shadow rounded-lg mb-6">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex justify-between items-center">
              <div>
                <h1 class="text-2xl font-bold text-gray-900">API Key Management</h1>
                <p class="mt-1 text-sm text-gray-600">Secure server-side storage for AI provider API keys</p>
              </div>
              <button onclick="showAddKeyModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                <i class="fas fa-plus mr-2"></i>Add API Key
              </button>
            </div>
          </div>

          <!-- Security Notice -->
          <div class="px-6 py-4 bg-blue-50 border-l-4 border-blue-500">
            <div class="flex">
              <div class="flex-shrink-0">
                <i class="fas fa-shield-alt text-blue-500"></i>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-blue-800">Security Notice</h3>
                <div class="mt-1 text-sm text-blue-700">
                  <ul class="list-disc pl-5 space-y-1">
                    <li>API keys are securely hashed and stored on the server</li>
                    <li>Keys cannot be viewed after storage - only updated or deleted</li>
                    <li>All key operations are logged for audit purposes</li>
                    <li>Keys are never transmitted to the frontend</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        ${error ? html`
          <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div class="flex items-center">
              <i class="fas fa-exclamation-circle text-red-500 mr-2"></i>
              <span class="text-red-700">${error}</span>
            </div>
          </div>
        ` : ''}

        <!-- API Keys List -->
        <div class="bg-white shadow rounded-lg">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">Your API Keys</h2>
          </div>
          <div id="api-keys-list" hx-get="/admin/api-keys/list" hx-trigger="load">
            ${renderApiKeysList(keys)}
          </div>
        </div>
      </div>
    </div>

    <!-- Add Key Modal -->
    <div id="add-key-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div class="p-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">Add New API Key</h3>
            <button onclick="closeAddKeyModal()" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <form id="add-key-form" hx-post="/admin/api-keys/add" hx-target="#add-key-result">
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Provider</label>
                <select name="provider" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select provider...</option>
                  ${Object.entries(SUPPORTED_PROVIDERS).filter(([key]) => key !== 'cloudflare').map(([key, provider]) => html`
                    <option value="${key}">${provider.name}</option>
                  `)}
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Key Name</label>
                <input type="text" name="name" required placeholder="e.g., Production API Key" 
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                <textarea name="key" required placeholder="Paste your API key here..." rows="3"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                <p class="text-xs text-gray-500 mt-1">Key will be securely hashed and cannot be viewed after storage</p>
              </div>
            </div>
            
            <div class="flex justify-end space-x-3 mt-6">
              <button type="button" onclick="closeAddKeyModal()" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Add Key
              </button>
            </div>
            
            <div id="add-key-result" class="mt-4"></div>
          </form>
        </div>
      </div>
    </div>

    <script>
      function showAddKeyModal() {
        document.getElementById('add-key-modal').classList.remove('hidden');
      }
      
      function closeAddKeyModal() {
        document.getElementById('add-key-modal').classList.add('hidden');
        document.getElementById('add-key-result').innerHTML = '';
      }
    </script>
  `;
}

function renderApiKeysList(keys: any[]) {
  if (keys.length === 0) {
    return html`
      <div class="text-center py-12">
        <i class="fas fa-key text-gray-400 text-4xl mb-4"></i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No API Keys</h3>
        <p class="text-gray-500">Add your first API key to get started with AI providers</p>
      </div>
    `;
  }

  return html`
    <div class="divide-y divide-gray-200">
      ${keys.map(key => html`
        <div class="px-6 py-4 flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div class="flex-shrink-0">
              <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <i class="fas fa-key text-white text-sm"></i>
              </div>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-900">${key.name}</h4>
              <div class="flex items-center space-x-2 text-xs text-gray-500">
                <span class="px-2 py-1 bg-gray-100 rounded">${SUPPORTED_PROVIDERS[key.provider as ProviderKey]?.name || key.provider}</span>
                <span>•</span>
                <span>${key.masked_key}</span>
                <span>•</span>
                <span>Added ${new Date(key.created_at).toLocaleDateString()}</span>
                ${key.last_used ? html`
                  <span>•</span>
                  <span>Last used ${new Date(key.last_used).toLocaleDateString()}</span>
                ` : ''}
              </div>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <button onclick="showUpdateKeyModal('${key.id}')" class="text-blue-600 hover:text-blue-800 text-sm">
              <i class="fas fa-edit mr-1"></i>Update
            </button>
            <button hx-delete="/admin/api-keys/${key.id}" hx-target="#api-keys-list" 
                    hx-confirm="Are you sure you want to delete this API key? This action cannot be undone."
                    class="text-red-600 hover:text-red-800 text-sm">
              <i class="fas fa-trash mr-1"></i>Delete
            </button>
          </div>
        </div>
      `)}
    </div>
  `;
}

function renderError(message: string) {
  return html`
    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
      <div class="flex items-center">
        <i class="fas fa-exclamation-circle text-red-500 mr-2"></i>
        <span class="text-red-700">${message}</span>
      </div>
    </div>
  `;
}