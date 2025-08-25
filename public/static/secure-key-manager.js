// Secure API Key Management - Frontend Interface
// Users can set/update/delete API keys but never view them

class SecureKeyManager {
  constructor() {
    this.apiKeyStatus = {};
    this.isLoading = false;
  }

  async loadKeyStatus() {
    try {
      const token = localStorage.getItem('aria_token');
      
      // Debug token retrieval in loadKeyStatus
      console.log('🔑 SecureKeyManager.loadKeyStatus - Token check:', {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        allLocalStorageKeys: Object.keys(localStorage)
      });
      
      if (!token) {
        console.log('⚠️ No token found in loadKeyStatus, returning default status');
        // Return default status for unauthenticated users
        this.apiKeyStatus = {
          openai: { configured: false, valid: false, prefix: null, lastTested: null, createdAt: null },
          gemini: { configured: false, valid: false, prefix: null, lastTested: null, createdAt: null },
          anthropic: { configured: false, valid: false, prefix: null, lastTested: null, createdAt: null }
        };
        return this.apiKeyStatus;
      }

      const response = await fetch('/api/keys/status', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token is invalid or expired, clear it and return default status
          localStorage.removeItem('aria_token');
          this.apiKeyStatus = {
            openai: { configured: false, valid: false, prefix: null, lastTested: null, createdAt: null },
            gemini: { configured: false, valid: false, prefix: null, lastTested: null, createdAt: null },
            anthropic: { configured: false, valid: false, prefix: null, lastTested: null, createdAt: null }
          };
          return this.apiKeyStatus;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      if (result.success) {
        this.apiKeyStatus = result.data; // API returns object directly
        return this.apiKeyStatus;
      } else {
        throw new Error(result.error || 'Load failed');
      }
    } catch (error) {
      console.error('Error loading API key status:', error);
      // Return default status if there's any error
      this.apiKeyStatus = {
        openai: { configured: false, valid: false, prefix: null, lastTested: null, createdAt: null },
        gemini: { configured: false, valid: false, prefix: null, lastTested: null, createdAt: null },
        anthropic: { configured: false, valid: false, prefix: null, lastTested: null, createdAt: null }
      };
      return this.apiKeyStatus;
    }
  }

  async setAPIKey(provider, apiKey) {
    return await this.manageKey(provider, 'set', apiKey);
  }

  async updateAPIKey(provider, apiKey) {
    return await this.manageKey(provider, 'update', apiKey);
  }

  async deleteAPIKey(provider) {
    return await this.manageKey(provider, 'delete');
  }

  async testAPIKey(provider) {
    return await this.manageKey(provider, 'test');
  }

  async manageKey(provider, action, apiKey = null) {
    try {
      this.isLoading = true;
      const token = localStorage.getItem('aria_token');
      
      // Debug token retrieval
      console.log('🔑 SecureKeyManager - Token check:', {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        tokenPrefix: token ? token.substring(0, 10) + '...' : 'null',
        allKeys: Object.keys(localStorage),
        dmtKeys: Object.keys(localStorage).filter(k => k.startsWith('dmt_'))
      });
      
      if (!token) {
        throw new Error('Please log in to manage API keys');
      }

      let endpoint, method, body;
      
      switch (action) {
        case 'set':
        case 'update':
          endpoint = '/api/keys/manage';
          method = 'POST';
          body = JSON.stringify({ provider, apiKey, action });
          break;
        case 'delete':
          endpoint = '/api/keys/manage';
          method = 'POST';
          body = JSON.stringify({ provider, action });
          break;
        case 'test':
          endpoint = '/api/keys/manage';
          method = 'POST';
          body = JSON.stringify({ provider, action });
          break;
        default:
          throw new Error(`Unknown action: ${action}`);
      }

      const response = await fetch(endpoint, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('aria_token');
          throw new Error('Session expired. Please log in again');
        }
        let errorMessage;
        try {
          const error = await response.json();
          errorMessage = error.error || `Failed to ${action} API key`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (result.success) {
        // Refresh status after successful operation
        await this.loadKeyStatus();
        return result;
      } else {
        throw new Error(result.error || `${action} failed`);
      }
    } catch (error) {
      console.error(`Error ${action} API key:`, error);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  renderSecureKeyInterface() {
    return `
      <div class="max-w-4xl mx-auto">
        <div class="mb-8">
          <h3 class="text-2xl font-bold text-gray-900">Secure API Key Management</h3>
          <p class="text-gray-600 mt-2">Set up your personal AI provider API keys. Keys are encrypted and stored securely on the server.</p>
          <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-shield-alt text-blue-600 mr-2"></i>
              <span class="text-blue-800 font-medium">Enhanced Security</span>
            </div>
            <p class="text-blue-700 text-sm mt-1">Your API keys are encrypted and stored securely. Once set, they cannot be viewed - only updated or deleted.</p>
          </div>
        </div>

        <!-- API Key Management Cards -->
        <div class="space-y-6" id="key-management-cards">
          <!-- Cards will be loaded here -->
        </div>

        <!-- Action Buttons -->
        <div class="mt-8 flex flex-col sm:flex-row gap-4">
          <button onclick="secureKeyManager.testAllKeys()" 
            class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors duration-200 flex items-center justify-center">
            <i class="fas fa-plug mr-2"></i>Test All Keys
          </button>
          <button onclick="secureKeyManager.refreshStatus()" 
            class="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 transition-colors duration-200 flex items-center justify-center">
            <i class="fas fa-sync-alt mr-2"></i>Refresh Status
          </button>
        </div>
      </div>
    `;
  }

  renderProviderCard(provider, config) {
    const status = this.apiKeyStatus[provider] || { configured: false, valid: false, prefix: null };
    const hasKey = status.configured;
    const isValid = status.valid;
    const lastUpdated = status.lastTested;

    return `
      <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        <!-- Provider Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div class="flex items-center space-x-3 mb-4 sm:mb-0">
            <div class="w-12 h-12 ${config.bgColor} rounded-xl flex items-center justify-center">
              <i class="${config.icon} ${config.iconColor} text-xl"></i>
            </div>
            <div>
              <h4 class="text-lg font-semibold text-gray-900">${config.name}</h4>
              <p class="text-sm text-gray-500">${config.description}</p>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <div class="flex items-center">
              <div class="w-3 h-3 rounded-full ${hasKey && isValid ? 'bg-green-400' : hasKey ? 'bg-yellow-400' : 'bg-red-400'} mr-2"></div>
              <span class="text-sm text-gray-600">
                ${hasKey && isValid ? 'Valid Key' : hasKey ? 'Key Set (Unvalidated)' : 'No Key'}
              </span>
            </div>
          </div>
        </div>

        <!-- Key Status -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
            <div class="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  ${hasKey ? 
                    `<span class="text-sm font-medium">Key: ${status.prefix || '***'}</span>` : 
                    `<span class="text-sm text-gray-500">No API key set</span>`
                  }
                </div>
                ${hasKey ? `<i class="fas fa-check-circle text-green-500"></i>` : `<i class="fas fa-plus-circle text-gray-400"></i>`}
              </div>
              ${lastUpdated ? `<p class="text-xs text-gray-500 mt-1">Last updated: ${new Date(lastUpdated).toLocaleDateString()}</p>` : ''}
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Quick Actions</label>
            <div class="flex space-x-2">
              ${hasKey ? 
                `<button onclick="secureKeyManager.showUpdateDialog('${provider}')" 
                   class="flex-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium transition-colors duration-200">
                   <i class="fas fa-edit mr-1"></i>Update
                 </button>
                 <button onclick="secureKeyManager.showDeleteDialog('${provider}')" 
                   class="flex-1 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium transition-colors duration-200">
                   <i class="fas fa-trash mr-1"></i>Delete
                 </button>` : 
                `<button onclick="secureKeyManager.showSetDialog('${provider}')" 
                   class="w-full px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium transition-colors duration-200">
                   <i class="fas fa-plus mr-1"></i>Set API Key
                 </button>`
              }
            </div>
          </div>
        </div>

        <!-- Key Information -->
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">Security Info:</span>
            <span class="text-gray-800">🔒 Encrypted server-side storage</span>
          </div>
          <p class="text-xs text-gray-500 mt-2">
            Get your API key from <a href="${config.helpUrl}" target="_blank" class="text-blue-600 hover:underline">${config.name} Console</a>
          </p>
        </div>
      </div>
    `;
  }

  async refreshStatus() {
    try {
      showToast('Refreshing API key status...', 'info');
      await this.loadKeyStatus();
      this.updateDisplay();
      showToast('Status refreshed successfully', 'success');
    } catch (error) {
      showToast(`Failed to refresh status: ${error.message}`, 'error');
    }
  }

  async testAllKeys() {
    try {
      showToast('Testing all API keys...', 'info');
      const providers = Object.keys(this.apiKeyStatus).filter(p => this.apiKeyStatus[p].configured);
      
      if (providers.length === 0) {
        showToast('No API keys to test', 'warning');
        return;
      }

      const results = [];
      for (const provider of providers) {
        try {
          const result = await this.testAPIKey(provider);
          results.push(`✅ ${provider.toUpperCase()}: ${result.data.message}`);
        } catch (error) {
          results.push(`❌ ${provider.toUpperCase()}: ${error.message}`);
        }
      }

      showModal('API Key Test Results', `
        <div class="space-y-2">
          ${results.map(result => `<p class="text-sm">${result}</p>`).join('')}
        </div>
      `);

      this.updateDisplay();
    } catch (error) {
      showToast(`Test failed: ${error.message}`, 'error');
    }
  }

  showSetDialog(provider) {
    const config = this.getProviderConfig(provider);
    showModal(`Set ${config.name} API Key`, `
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">API Key</label>
          <input type="password" id="api-key-input" 
                 placeholder="${config.keyPlaceholder}" 
                 class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          <p class="text-xs text-gray-500 mt-1">Your API key will be encrypted and stored securely. It cannot be viewed once set.</p>
        </div>
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div class="flex items-center">
            <i class="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
            <span class="text-yellow-800 text-sm font-medium">Security Notice</span>
          </div>
          <p class="text-yellow-700 text-xs mt-1">Once saved, your API key will be encrypted and cannot be retrieved. You can only update or delete it.</p>
        </div>
      </div>
    `, [
      { text: 'Cancel', class: 'btn-secondary', onclick: 'closeUniversalModal()' },
      { text: 'Set API Key', class: 'btn-primary', onclick: `secureKeyManager.handleSetKey('${provider}')` }
    ]);
  }

  showUpdateDialog(provider) {
    const config = this.getProviderConfig(provider);
    showModal(`Update ${config.name} API Key`, `
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">New API Key</label>
          <input type="password" id="api-key-input" 
                 placeholder="${config.keyPlaceholder}" 
                 class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          <p class="text-xs text-gray-500 mt-1">Enter your new API key to replace the existing one.</p>
        </div>
      </div>
    `, [
      { text: 'Cancel', class: 'btn-secondary', onclick: 'closeUniversalModal()' },
      { text: 'Update Key', class: 'btn-primary', onclick: `secureKeyManager.handleUpdateKey('${provider}')` }
    ]);
  }

  showDeleteDialog(provider) {
    const config = this.getProviderConfig(provider);
    showModal(`Delete ${config.name} API Key`, `
      <div class="space-y-4">
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-center">
            <i class="fas fa-exclamation-triangle text-red-600 mr-2"></i>
            <span class="text-red-800 font-medium">Confirm Deletion</span>
          </div>
          <p class="text-red-700 text-sm mt-2">
            Are you sure you want to delete your ${config.name} API key? This action cannot be undone.
          </p>
        </div>
      </div>
    `, [
      { text: 'Cancel', class: 'btn-secondary', onclick: 'closeUniversalModal()' },
      { text: 'Delete Key', class: 'btn-danger', onclick: `secureKeyManager.handleDeleteKey('${provider}')` }
    ]);
  }

  async handleSetKey(provider) {
    const apiKey = document.getElementById('api-key-input').value.trim();
    if (!apiKey) {
      showToast('Please enter an API key', 'error');
      return;
    }

    try {
      showToast('Setting API key...', 'info');
      const result = await this.setAPIKey(provider, apiKey);
      closeUniversalModal();
      showToast(`API key set for ${provider}`, result.data.valid ? 'success' : 'warning');
      this.updateDisplay();
      // Refresh AI provider display if settings page is active
      if (typeof enhancedSettings !== 'undefined' && enhancedSettings.refreshAIProviderDisplay) {
        enhancedSettings.refreshAIProviderDisplay();
      }
    } catch (error) {
      showToast(`Failed to set API key: ${error.message}`, 'error');
    }
  }

  async handleUpdateKey(provider) {
    const apiKey = document.getElementById('api-key-input').value.trim();
    if (!apiKey) {
      showToast('Please enter an API key', 'error');
      return;
    }

    try {
      showToast('Updating API key...', 'info');
      const result = await this.updateAPIKey(provider, apiKey);
      closeUniversalModal();
      showToast(`API key updated for ${provider}`, result.data.valid ? 'success' : 'warning');
      this.updateDisplay();
      // Refresh AI provider display if settings page is active
      if (typeof enhancedSettings !== 'undefined' && enhancedSettings.refreshAIProviderDisplay) {
        enhancedSettings.refreshAIProviderDisplay();
      }
    } catch (error) {
      showToast(`Failed to update API key: ${error.message}`, 'error');
    }
  }

  async handleDeleteKey(provider) {
    try {
      showToast('Deleting API key...', 'info');
      const result = await this.deleteAPIKey(provider);
      closeUniversalModal();
      showToast(`API key deleted for ${provider}`, 'success');
      this.updateDisplay();
      // Refresh AI provider display if settings page is active
      if (typeof enhancedSettings !== 'undefined' && enhancedSettings.refreshAIProviderDisplay) {
        enhancedSettings.refreshAIProviderDisplay();
      }
    } catch (error) {
      showToast(`Failed to delete API key: ${error.message}`, 'error');
    }
  }

  updateDisplay() {
    const container = document.getElementById('key-management-cards');
    if (!container) return;

    const providers = [
      {
        id: 'openai',
        name: 'OpenAI GPT-4',
        description: 'Advanced language model for complex reasoning',
        icon: 'fas fa-brain',
        iconColor: 'text-green-600',
        bgColor: 'bg-green-100',
        keyPlaceholder: 'sk-proj-... or sk-...',
        helpUrl: 'https://platform.openai.com/api-keys'
      },
      {
        id: 'anthropic',
        name: 'Anthropic Claude',
        description: 'Advanced reasoning and safe AI',
        icon: 'fas fa-microchip',
        iconColor: 'text-purple-600',
        bgColor: 'bg-purple-100',
        keyPlaceholder: 'sk-ant-...',
        helpUrl: 'https://console.anthropic.com/settings/keys'
      },
      {
        id: 'gemini',
        name: 'Google Gemini',
        description: "Google's advanced multimodal AI",
        icon: 'fab fa-google',
        iconColor: 'text-blue-600',
        bgColor: 'bg-blue-100',
        keyPlaceholder: 'AIza...',
        helpUrl: 'https://aistudio.google.com/app/apikey'
      }
    ];

    container.innerHTML = providers.map(provider => 
      this.renderProviderCard(provider.id, provider)
    ).join('');
  }

  async showKeyManagementDialog() {
    try {
      // Load current key status
      await this.loadKeyStatus();
      
      showModal('Secure API Key Management', `
        <div class="space-y-6">
          <!-- Header Info -->
          <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-center">
              <i class="fas fa-shield-alt text-blue-600 mr-2"></i>
              <span class="text-blue-800 font-medium">Secure Key Management</span>
            </div>
            <p class="text-blue-700 text-sm mt-1">
              Manage your AI provider API keys securely. Keys are encrypted and stored server-side.
            </p>
          </div>

          <!-- Key Management Cards -->
          <div id="key-management-cards" class="space-y-4">
            <!-- Cards will be populated here -->
          </div>

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row gap-3">
            <button onclick="secureKeyManager.refreshStatus()" 
              class="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
              <i class="fas fa-sync-alt mr-2"></i>Refresh Status
            </button>
            <button onclick="secureKeyManager.testAllKeys()" 
              class="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
              <i class="fas fa-vial mr-2"></i>Test All Keys
            </button>
          </div>
        </div>
      `, [
        { text: 'Close', class: 'btn-secondary', onclick: 'closeUniversalModal()' }
      ], 'max-w-4xl');

      // Update the display after modal is shown
      setTimeout(() => {
        this.updateDisplay();
      }, 100);
      
    } catch (error) {
      console.error('Error showing key management dialog:', error);
      showToast(`Failed to load key management interface`, 'error');
    }
  }

  getProviderConfig(provider) {
    const configs = {
      openai: {
        name: 'OpenAI GPT-4',
        keyPlaceholder: 'sk-proj-... or sk-...',
        helpUrl: 'https://platform.openai.com/api-keys'
      },
      anthropic: {
        name: 'Anthropic Claude',
        keyPlaceholder: 'sk-ant-...',
        helpUrl: 'https://console.anthropic.com/settings/keys'
      },
      gemini: {
        name: 'Google Gemini',
        keyPlaceholder: 'AIza...',
        helpUrl: 'https://aistudio.google.com/app/apikey'
      }
    };
    return configs[provider] || {};
  }
}

// Initialize the secure key manager
const secureKeyManager = new SecureKeyManager();

// Export for global access
window.secureKeyManager = secureKeyManager;

console.log('🔒 Secure Key Manager loaded');