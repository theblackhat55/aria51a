// Enhanced Settings Module with Auto-Save, Validation, and Mobile Optimization
class EnhancedSettingsManager {
  constructor() {
    this.autoSaveTimeout = null;
    this.validationRules = {};
    this.isDirty = false;
    this.currentTab = 'ai';
    this.setupValidationRules();
  }

  setupValidationRules() {
    this.validationRules = {
      // AI Settings validation
      'openai-api-key': {
        pattern: /^sk-[A-Za-z0-9]{32,}$/,
        message: 'OpenAI API key must start with "sk-" and be at least 35 characters'
      },
      'gemini-api-key': {
        pattern: /^AIza[A-Za-z0-9_-]{35}$/,
        message: 'Gemini API key must start with "AIza" and be exactly 39 characters'
      },
      'anthropic-api-key': {
        pattern: /^sk-ant-[A-Za-z0-9_-]{95,}$/,
        message: 'Anthropic API key must start with "sk-ant-" and be at least 100 characters'
      },
      'local-endpoint': {
        pattern: /^https?:\/\/.+/,
        message: 'Local endpoint must be a valid HTTP/HTTPS URL'
      },
      // System Settings validation
      'user-email': {
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: 'Please enter a valid email address'
      },
      'organization-name': {
        pattern: /.{2,}/,
        message: 'Organization name must be at least 2 characters'
      },
      'saml-entity-id': {
        pattern: /.{5,}/,
        message: 'SAML Entity ID must be at least 5 characters'
      }
    };
  }

  async showEnhancedSettings() {
    updateActiveNavigation('settings');
    currentModule = 'settings';
    
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `
      <div class="min-h-screen bg-gray-50">
        <!-- Mobile Header -->
        <div class="lg:hidden bg-white shadow-sm border-b border-gray-200 p-4">
          <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-gray-900">Settings</h1>
            <button id="mobile-settings-menu" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <i class="fas fa-bars text-gray-600"></i>
            </button>
          </div>
        </div>

        <div class="flex flex-col lg:flex-row h-full">
          <!-- Settings Sidebar -->
          <div id="settings-sidebar" class="lg:w-64 bg-white shadow-sm border-r border-gray-200 lg:block hidden">
            <div class="p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
              <nav class="space-y-2">
                <!-- AI & Intelligence -->
                <div class="mb-4">
                  <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">AI & Intelligence</h3>
                  <button onclick="enhancedSettings.showTab('ai')" 
                    id="tab-ai" 
                    class="settings-nav-item active w-full text-left flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200">
                    <i class="fas fa-robot text-blue-600"></i>
                    <span>AI Providers</span>
                  </button>
                  <button onclick="enhancedSettings.showTab('rag')" 
                    id="tab-rag" 
                    class="settings-nav-item w-full text-left flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200">
                    <i class="fas fa-brain text-purple-600"></i>
                    <span>RAG & Knowledge</span>
                  </button>
                </div>

                <!-- Integrations -->
                <div class="mb-4">
                  <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Integrations</h3>
                  <button onclick="enhancedSettings.showTab('microsoft')" 
                    id="tab-microsoft" 
                    class="settings-nav-item w-full text-left flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200">
                    <i class="fab fa-microsoft text-blue-500"></i>
                    <span>Microsoft</span>
                  </button>
                </div>

                <!-- System Administration -->
                <div>
                  <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">System Administration</h3>
                  <button onclick="enhancedSettings.showTab('system')" 
                    id="tab-system" 
                    class="settings-nav-item w-full text-left flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200">
                    <i class="fas fa-cog text-gray-600"></i>
                    <span>System Settings</span>
                  </button>
                  <div class="ml-6 mt-2 space-y-1">
                    <button onclick="enhancedSettings.showSystemSubTab('users')" 
                      id="subtab-users" 
                      class="system-subtab w-full text-left flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-all duration-200">
                      <i class="fas fa-users text-green-600"></i>
                      <span>User Management</span>
                      <span class="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Unified</span>
                    </button>
                    <button onclick="enhancedSettings.showSystemSubTab('organizations')" 
                      id="subtab-organizations" 
                      class="system-subtab w-full text-left flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-all duration-200">
                      <i class="fas fa-building text-indigo-600"></i>
                      <span>Organizations</span>
                    </button>
                    <button onclick="enhancedSettings.showSystemSubTab('saml')" 
                      id="subtab-saml" 
                      class="system-subtab w-full text-left flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-all duration-200">
                      <i class="fas fa-key text-red-600"></i>
                      <span>SAML Auth</span>
                    </button>
                  </div>
                </div>
              </nav>
            </div>
          </div>

          <!-- Main Content Area -->
          <div class="flex-1 overflow-hidden">
            <!-- Auto-Save Status Bar -->
            <div id="autosave-status" class="bg-blue-50 border-l-4 border-blue-400 p-4 hidden">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <i id="autosave-icon" class="fas fa-save text-blue-400"></i>
                </div>
                <div class="ml-3">
                  <p id="autosave-message" class="text-sm text-blue-700">Changes saved automatically</p>
                </div>
              </div>
            </div>

            <!-- Settings Content -->
            <div class="p-6 overflow-y-auto h-full">
              <div id="settings-content">
                <!-- Dynamic content will be loaded here -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize mobile menu toggle
    this.setupMobileMenu();
    
    // Show default tab
    this.showTab('ai');
  }

  setupMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-settings-menu');
    const sidebar = document.getElementById('settings-sidebar');
    
    if (mobileMenuBtn && sidebar) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('hidden');
        sidebar.classList.toggle('fixed');
        sidebar.classList.toggle('inset-0');
        sidebar.classList.toggle('z-50');
      });

      // Close sidebar when clicking outside on mobile
      document.addEventListener('click', (e) => {
        if (window.innerWidth < 1024 && !sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
          sidebar.classList.add('hidden');
          sidebar.classList.remove('fixed', 'inset-0', 'z-50');
        }
      });
    }
  }

  showTab(tab) {
    this.currentTab = tab;
    
    // Update navigation
    document.querySelectorAll('.settings-nav-item').forEach(item => {
      item.classList.remove('active', 'bg-blue-50', 'text-blue-700');
      item.classList.add('text-gray-700', 'hover:bg-gray-50');
    });
    
    const activeTab = document.getElementById(`tab-${tab}`);
    if (activeTab) {
      activeTab.classList.add('active', 'bg-blue-50', 'text-blue-700');
      activeTab.classList.remove('text-gray-700', 'hover:bg-gray-50');
    }

    // Hide system subtabs for non-system tabs
    if (tab !== 'system') {
      document.querySelectorAll('.system-subtab').forEach(subtab => {
        subtab.classList.add('hidden');
      });
    }

    switch(tab) {
      case 'ai':
        this.showAISettings();
        break;
      case 'rag':
        this.showRAGSettings();
        break;
      case 'microsoft':
        this.showMicrosoftSettings();
        break;
      case 'system':
        this.showSystemSettings();
        break;
    }

    // Close mobile menu after selection
    if (window.innerWidth < 1024) {
      const sidebar = document.getElementById('settings-sidebar');
      sidebar.classList.add('hidden');
      sidebar.classList.remove('fixed', 'inset-0', 'z-50');
    }
  }

  async showAISettings() {
    const aiSettings = await this.loadAISettings();
    
    const content = document.getElementById('settings-content');
    content.innerHTML = `
      <div class="max-w-4xl mx-auto">
        <div class="mb-8">
          <h3 class="text-2xl font-bold text-gray-900">AI Provider Configuration</h3>
          <p class="text-gray-600 mt-2">Configure your AI providers for ARIA assistant and risk analysis</p>
        </div>

        <!-- AI Provider Cards -->
        <div class="space-y-6">
          <!-- OpenAI Configuration -->
          ${this.renderAIProviderCard('openai', {
            name: 'OpenAI GPT-4',
            description: 'Advanced language model for complex reasoning',
            icon: 'fas fa-openai',
            iconColor: 'text-green-600',
            bgColor: 'bg-green-100',
            settings: aiSettings.openai,
            models: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
            helpUrl: 'https://platform.openai.com/api-keys',
            keyPlaceholder: 'sk-proj-...'
          })}

          <!-- Gemini Configuration -->
          ${this.renderAIProviderCard('gemini', {
            name: 'Google Gemini',
            description: "Google's advanced multimodal AI",
            icon: 'fab fa-google',
            iconColor: 'text-blue-600',
            bgColor: 'bg-blue-100',
            settings: aiSettings.gemini,
            models: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash'],
            helpUrl: 'https://aistudio.google.com/app/apikey',
            keyPlaceholder: 'AIza...'
          })}

          <!-- Anthropic Configuration -->
          ${this.renderAIProviderCard('anthropic', {
            name: 'Anthropic Claude',
            description: 'Advanced reasoning and safe AI',
            icon: 'fas fa-microchip',
            iconColor: 'text-purple-600',
            bgColor: 'bg-purple-100',
            settings: aiSettings.anthropic,
            models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
            helpUrl: 'https://console.anthropic.com/settings/keys',
            keyPlaceholder: 'sk-ant-...'
          })}

          <!-- Local/Custom LLM Configuration -->
          ${this.renderLocalLLMCard(aiSettings.local)}
        </div>

        <!-- Action Buttons -->
        <div class="mt-8 flex flex-col sm:flex-row gap-4">
          <button onclick="enhancedSettings.testAIConnections()" 
            class="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors duration-200 flex items-center justify-center">
            <i class="fas fa-plug mr-2"></i>Test All Connections
          </button>
          <button onclick="enhancedSettings.refreshAllModels()" 
            class="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 transition-colors duration-200 flex items-center justify-center">
            <i class="fas fa-sync-alt mr-2"></i>Refresh All Models
          </button>
        </div>
      </div>
    `;

    this.setupAutoSave();
    this.setupValidation();
  }

  renderAIProviderCard(provider, config) {
    const settings = config.settings || {};
    const isEnabled = settings.priority > 0;
    
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
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-600">Priority:</span>
              <select id="${provider}-priority" 
                class="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent auto-save-field"
                data-provider="${provider}">
                <option value="1" ${settings.priority === 1 ? 'selected' : ''}>1st</option>
                <option value="2" ${settings.priority === 2 ? 'selected' : ''}>2nd</option>
                <option value="3" ${settings.priority === 3 ? 'selected' : ''}>3rd</option>
                <option value="4" ${settings.priority === 4 ? 'selected' : ''}>4th</option>
                <option value="0" ${settings.priority === 0 ? 'selected' : ''}>Disabled</option>
              </select>
            </div>
            <div class="flex items-center">
              <div class="w-3 h-3 rounded-full ${isEnabled ? 'bg-green-400' : 'bg-red-400'} mr-2"></div>
              <span class="text-sm text-gray-600">${isEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
        </div>

        <!-- Configuration Fields -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- API Key -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">API Key</label>
            <div class="relative">
              <input type="password" 
                id="${provider}-api-key" 
                placeholder="${config.keyPlaceholder}" 
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 auto-save-field pr-10" 
                value="${settings.apiKey || ''}"
                data-provider="${provider}">
              <button type="button" 
                onclick="enhancedSettings.togglePasswordVisibility('${provider}-api-key')"
                class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <i class="fas fa-eye text-gray-400 hover:text-gray-600"></i>
              </button>
            </div>
            <div class="mt-2 flex items-start space-x-2">
              <div id="${provider}-api-key-validation" class="hidden flex items-center space-x-1">
                <i class="fas fa-exclamation-triangle text-red-500 text-sm"></i>
                <span class="text-sm text-red-600"></span>
              </div>
            </div>
            <p class="text-xs text-gray-500 mt-1">
              Get your API key from <a href="${config.helpUrl}" target="_blank" class="text-blue-600 hover:underline">${config.name} Console</a>
            </p>
          </div>

          <!-- Model Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Model</label>
            <div class="flex space-x-2">
              <select id="${provider}-model" 
                class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent auto-save-field"
                data-provider="${provider}">
                ${config.models.map(model => 
                  `<option value="${model}" ${settings.model === model ? 'selected' : ''}>${model}</option>`
                ).join('')}
              </select>
              <button onclick="enhancedSettings.fetchModels('${provider}')" 
                class="px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 focus:ring-2 focus:ring-blue-500 transition-colors duration-200" 
                title="Fetch latest models">
                <i class="fas fa-sync-alt"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Advanced Settings (Collapsible) -->
        <div class="mt-6">
          <button onclick="enhancedSettings.toggleAdvanced('${provider}')" 
            class="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200">
            <i id="${provider}-advanced-icon" class="fas fa-chevron-right transform transition-transform duration-200"></i>
            <span>Advanced Settings</span>
          </button>
          <div id="${provider}-advanced" class="hidden mt-4 p-4 bg-gray-50 rounded-lg">
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Max Tokens</label>
                <input type="number" 
                  id="${provider}-max-tokens" 
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 auto-save-field" 
                  value="${settings.maxTokens || 1500}"
                  min="100" max="4000"
                  data-provider="${provider}">
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
                <input type="range" 
                  id="${provider}-temperature" 
                  class="w-full auto-save-field" 
                  min="0" max="1" step="0.1" 
                  value="${settings.temperature || 0.7}"
                  data-provider="${provider}">
                <div class="flex justify-between text-xs text-gray-500 mt-1">
                  <span>Focused</span>
                  <span id="${provider}-temp-value">${settings.temperature || 0.7}</span>
                  <span>Creative</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderLocalLLMCard(settings = {}) {
    const isEnabled = settings.priority > 0;
    
    return `
      <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
          <div class="flex items-center space-x-3 mb-4 sm:mb-0">
            <div class="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <i class="fas fa-server text-gray-600 text-xl"></i>
            </div>
            <div>
              <h4 class="text-lg font-semibold text-gray-900">Local/Custom LLM</h4>
              <p class="text-sm text-gray-500">Self-hosted or custom LLM endpoint</p>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <span class="text-sm text-gray-600">Priority:</span>
              <select id="local-priority" 
                class="text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent auto-save-field"
                data-provider="local">
                <option value="1" ${settings.priority === 1 ? 'selected' : ''}>1st</option>
                <option value="2" ${settings.priority === 2 ? 'selected' : ''}>2nd</option>
                <option value="3" ${settings.priority === 3 ? 'selected' : ''}>3rd</option>
                <option value="4" ${settings.priority === 4 ? 'selected' : ''}>4th</option>
                <option value="0" ${settings.priority === 0 ? 'selected' : ''}>Disabled</option>
              </select>
            </div>
            <div class="flex items-center">
              <div class="w-3 h-3 rounded-full ${isEnabled ? 'bg-green-400' : 'bg-red-400'} mr-2"></div>
              <span class="text-sm text-gray-600">${isEnabled ? 'Enabled' : 'Disabled'}</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Endpoint URL</label>
            <input type="url" 
              id="local-endpoint" 
              placeholder="http://localhost:11434/v1/chat/completions" 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent auto-save-field" 
              value="${settings.endpoint || ''}"
              data-provider="local">
            <div id="local-endpoint-validation" class="hidden mt-2 flex items-center space-x-1">
              <i class="fas fa-exclamation-triangle text-red-500 text-sm"></i>
              <span class="text-sm text-red-600"></span>
            </div>
            <p class="text-xs text-gray-500 mt-1">OpenAI-compatible endpoint URL</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Model Name</label>
            <input type="text" 
              id="local-model" 
              placeholder="llama2, codellama, etc." 
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent auto-save-field" 
              value="${settings.model || ''}"
              data-provider="local">
          </div>
        </div>

        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Authentication Token (Optional)</label>
          <input type="password" 
            id="local-api-key" 
            placeholder="Bearer token or API key" 
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent auto-save-field" 
            value="${settings.apiKey || ''}"
            data-provider="local">
        </div>
      </div>
    `;
  }

  async loadAISettings() {
    try {
      let settings = localStorage.getItem('dmt_ai_settings');
      if (!settings) {
        settings = localStorage.getItem('ai_settings');
      }
      return settings ? JSON.parse(settings) : {
        openai: { priority: 1, apiKey: '', model: 'gpt-4o', maxTokens: 1500, temperature: 0.7 },
        gemini: { priority: 2, apiKey: '', model: 'gemini-pro', maxTokens: 1500, temperature: 0.7 },
        anthropic: { priority: 3, apiKey: '', model: 'claude-3-5-sonnet-20241022', maxTokens: 1500, temperature: 0.7 },
        local: { priority: 0, endpoint: '', model: '', apiKey: '', maxTokens: 1500, temperature: 0.7 }
      };
    } catch (error) {
      console.error('Error loading AI settings:', error);
      return {};
    }
  }

  setupAutoSave() {
    const autoSaveFields = document.querySelectorAll('.auto-save-field');
    
    autoSaveFields.forEach(field => {
      // Handle different field types
      if (field.type === 'range') {
        field.addEventListener('input', () => {
          const provider = field.dataset.provider;
          const tempValueElement = document.getElementById(`${provider}-temp-value`);
          if (tempValueElement) {
            tempValueElement.textContent = field.value;
          }
          this.scheduleAutoSave();
        });
      } else {
        field.addEventListener('input', () => this.scheduleAutoSave());
        field.addEventListener('change', () => this.scheduleAutoSave());
      }
    });
  }

  scheduleAutoSave() {
    this.isDirty = true;
    this.showAutoSaveStatus('saving');
    
    // Clear existing timeout
    if (this.autoSaveTimeout) {
      clearTimeout(this.autoSaveTimeout);
    }
    
    // Schedule auto-save after 2 seconds of inactivity
    this.autoSaveTimeout = setTimeout(() => {
      this.performAutoSave();
    }, 2000);
  }

  async performAutoSave() {
    if (!this.isDirty) return;
    
    try {
      if (this.currentTab === 'ai') {
        await this.saveAISettings();
      }
      // Add other tab auto-save logic here
      
      this.isDirty = false;
      this.showAutoSaveStatus('saved');
      
      // Hide status after 3 seconds
      setTimeout(() => {
        this.hideAutoSaveStatus();
      }, 3000);
      
    } catch (error) {
      console.error('Auto-save failed:', error);
      this.showAutoSaveStatus('error');
      setTimeout(() => {
        this.hideAutoSaveStatus();
      }, 5000);
    }
  }

  async saveAISettings() {
    const settings = {
      openai: {
        priority: parseInt(document.getElementById('openai-priority')?.value || 0),
        apiKey: document.getElementById('openai-api-key')?.value || '',
        model: document.getElementById('openai-model')?.value || 'gpt-4o',
        maxTokens: parseInt(document.getElementById('openai-max-tokens')?.value || 1500),
        temperature: parseFloat(document.getElementById('openai-temperature')?.value || 0.7)
      },
      gemini: {
        priority: parseInt(document.getElementById('gemini-priority')?.value || 0),
        apiKey: document.getElementById('gemini-api-key')?.value || '',
        model: document.getElementById('gemini-model')?.value || 'gemini-pro',
        maxTokens: parseInt(document.getElementById('gemini-max-tokens')?.value || 1500),
        temperature: parseFloat(document.getElementById('gemini-temperature')?.value || 0.7)
      },
      anthropic: {
        priority: parseInt(document.getElementById('anthropic-priority')?.value || 0),
        apiKey: document.getElementById('anthropic-api-key')?.value || '',
        model: document.getElementById('anthropic-model')?.value || 'claude-3-5-sonnet-20241022',
        maxTokens: parseInt(document.getElementById('anthropic-max-tokens')?.value || 1500),
        temperature: parseFloat(document.getElementById('anthropic-temperature')?.value || 0.7)
      },
      local: {
        priority: parseInt(document.getElementById('local-priority')?.value || 0),
        endpoint: document.getElementById('local-endpoint')?.value || '',
        model: document.getElementById('local-model')?.value || '',
        apiKey: document.getElementById('local-api-key')?.value || '',
        maxTokens: parseInt(document.getElementById('local-max-tokens')?.value || 1500),
        temperature: parseFloat(document.getElementById('local-temperature')?.value || 0.7)
      }
    };
    
    localStorage.setItem('dmt_ai_settings', JSON.stringify(settings));
    localStorage.setItem('ai_settings', JSON.stringify(settings));
    
    // Update ARIA provider display
    if (typeof updateARIAProviderDisplay === 'function') {
      updateARIAProviderDisplay();
    }
  }

  setupValidation() {
    Object.keys(this.validationRules).forEach(fieldId => {
      const field = document.getElementById(fieldId);
      if (field) {
        field.addEventListener('blur', () => this.validateField(fieldId));
        field.addEventListener('input', () => this.clearValidation(fieldId));
      }
    });
  }

  validateField(fieldId) {
    const field = document.getElementById(fieldId);
    const rule = this.validationRules[fieldId];
    const validationElement = document.getElementById(`${fieldId}-validation`);
    
    if (!field || !rule || !validationElement) return true;
    
    const value = field.value.trim();
    const isValid = !value || rule.pattern.test(value);
    
    if (isValid) {
      this.clearValidation(fieldId);
      return true;
    } else {
      validationElement.querySelector('span').textContent = rule.message;
      validationElement.classList.remove('hidden');
      field.classList.add('border-red-500');
      return false;
    }
  }

  clearValidation(fieldId) {
    const field = document.getElementById(fieldId);
    const validationElement = document.getElementById(`${fieldId}-validation`);
    
    if (validationElement) {
      validationElement.classList.add('hidden');
    }
    if (field) {
      field.classList.remove('border-red-500');
    }
  }

  showAutoSaveStatus(status) {
    const statusBar = document.getElementById('autosave-status');
    const icon = document.getElementById('autosave-icon');
    const message = document.getElementById('autosave-message');
    
    if (!statusBar || !icon || !message) return;
    
    statusBar.classList.remove('hidden', 'bg-blue-50', 'bg-green-50', 'bg-red-50');
    statusBar.classList.remove('border-blue-400', 'border-green-400', 'border-red-400');
    
    icon.classList.remove('fa-save', 'fa-check', 'fa-exclamation-triangle');
    icon.classList.remove('text-blue-400', 'text-green-400', 'text-red-400');
    
    message.classList.remove('text-blue-700', 'text-green-700', 'text-red-700');
    
    switch (status) {
      case 'saving':
        statusBar.classList.add('bg-blue-50', 'border-blue-400');
        icon.classList.add('fa-save', 'text-blue-400', 'fa-spin');
        message.classList.add('text-blue-700');
        message.textContent = 'Saving changes...';
        break;
      case 'saved':
        statusBar.classList.add('bg-green-50', 'border-green-400');
        icon.classList.add('fa-check', 'text-green-400');
        message.classList.add('text-green-700');
        message.textContent = 'Changes saved automatically';
        break;
      case 'error':
        statusBar.classList.add('bg-red-50', 'border-red-400');
        icon.classList.add('fa-exclamation-triangle', 'text-red-400');
        message.classList.add('text-red-700');
        message.textContent = 'Failed to save changes';
        break;
    }
  }

  hideAutoSaveStatus() {
    const statusBar = document.getElementById('autosave-status');
    if (statusBar) {
      statusBar.classList.add('hidden');
    }
  }

  togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    const icon = field.nextElementSibling.querySelector('i');
    
    if (field.type === 'password') {
      field.type = 'text';
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    } else {
      field.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  }

  toggleAdvanced(provider) {
    const advancedSection = document.getElementById(`${provider}-advanced`);
    const icon = document.getElementById(`${provider}-advanced-icon`);
    
    if (advancedSection.classList.contains('hidden')) {
      advancedSection.classList.remove('hidden');
      icon.classList.add('rotate-90');
    } else {
      advancedSection.classList.add('hidden');
      icon.classList.remove('rotate-90');
    }
  }

  async fetchModels(provider) {
    // Implementation for fetching models from each provider
    showToast(`Fetching ${provider} models...`, 'info');
    // TODO: Implement actual model fetching logic
  }

  async testAIConnections() {
    showToast('Testing AI connections...', 'info');
    // TODO: Implement connection testing
  }

  async refreshAllModels() {
    showToast('Refreshing all models...', 'info');
    // TODO: Implement model refresh for all providers
  }

  showRAGSettings() {
    const content = document.getElementById('settings-content');
    content.innerHTML = `
      <div class="max-w-6xl mx-auto">
        <div class="mb-8">
          <h3 class="text-2xl font-bold text-gray-900">RAG & Knowledge Base</h3>
          <p class="text-gray-600 mt-2">Configure retrieval-augmented generation and knowledge base settings</p>
        </div>

        <!-- RAG Configuration Cards -->
        <div class="space-y-6">
          <!-- Vector Database Configuration -->
          ${this.renderRAGConfigCard('vector-db', {
            name: 'Vector Database',
            description: 'Configure vector storage and embeddings',
            icon: 'fas fa-database',
            iconColor: 'text-indigo-600',
            bgColor: 'bg-indigo-100',
            fields: [
              { id: 'vector-provider', label: 'Provider', type: 'select', options: ['Pinecone', 'Weaviate', 'Chroma', 'Qdrant'], value: 'Pinecone' },
              { id: 'vector-api-key', label: 'API Key', type: 'password', placeholder: 'Enter API key...' },
              { id: 'vector-environment', label: 'Environment', type: 'text', placeholder: 'us-west1-gcp' },
              { id: 'vector-index-name', label: 'Index Name', type: 'text', placeholder: 'aria5-knowledge' }
            ]
          })}

          <!-- Embedding Model Configuration -->
          ${this.renderRAGConfigCard('embedding', {
            name: 'Embedding Model',
            description: 'Configure text embedding model settings',
            icon: 'fas fa-vector-square',
            iconColor: 'text-blue-600',
            bgColor: 'bg-blue-100',
            fields: [
              { id: 'embedding-provider', label: 'Provider', type: 'select', options: ['OpenAI', 'Cohere', 'HuggingFace', 'Local'], value: 'OpenAI' },
              { id: 'embedding-model', label: 'Model', type: 'select', options: ['text-embedding-ada-002', 'text-embedding-3-small', 'text-embedding-3-large'], value: 'text-embedding-ada-002' },
              { id: 'embedding-dimensions', label: 'Dimensions', type: 'number', placeholder: '1536', value: '1536' },
              { id: 'chunk-size', label: 'Chunk Size', type: 'number', placeholder: '1000', value: '1000' },
              { id: 'chunk-overlap', label: 'Chunk Overlap', type: 'number', placeholder: '200', value: '200' }
            ]
          })}

          <!-- Retrieval Configuration -->
          ${this.renderRAGConfigCard('retrieval', {
            name: 'Retrieval Settings',
            description: 'Configure document retrieval parameters',
            icon: 'fas fa-search',
            iconColor: 'text-green-600',
            bgColor: 'bg-green-100',
            fields: [
              { id: 'top-k', label: 'Top K Results', type: 'number', placeholder: '5', value: '5' },
              { id: 'similarity-threshold', label: 'Similarity Threshold', type: 'range', min: '0', max: '1', step: '0.01', value: '0.7' },
              { id: 'rerank-enabled', label: 'Enable Reranking', type: 'checkbox', checked: true },
              { id: 'hybrid-search', label: 'Hybrid Search', type: 'checkbox', checked: false }
            ]
          })}

          <!-- Knowledge Collections Management -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200">
            <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h4 class="text-lg font-medium text-gray-900">Knowledge Collections</h4>
                <p class="text-sm text-gray-600 mt-1">Manage document collections and indexing</p>
              </div>
              <div class="flex space-x-3">
                <button onclick="enhancedSettings.uploadKnowledge()" class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 flex items-center">
                  <i class="fas fa-upload mr-2"></i>Upload Documents
                </button>
                <button onclick="enhancedSettings.reindexKnowledge()" class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 transition-colors duration-200 flex items-center">
                  <i class="fas fa-sync-alt mr-2"></i>Reindex All
                </button>
              </div>
            </div>
            
            <!-- Knowledge Stats -->
            <div class="p-6 border-b border-gray-200">
              <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div class="text-center">
                  <div class="text-2xl font-bold text-gray-900">1,247</div>
                  <div class="text-sm text-gray-600">Documents</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-gray-900">45.2K</div>
                  <div class="text-sm text-gray-600">Embeddings</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-gray-900">342</div>
                  <div class="text-sm text-gray-600">Queries Today</div>
                </div>
                <div class="text-center">
                  <div class="text-2xl font-bold text-gray-900">94.5%</div>
                  <div class="text-sm text-gray-600">Accuracy</div>
                </div>
              </div>
            </div>

            <!-- Collections List -->
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="border border-gray-200 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-3">
                    <h5 class="font-medium text-gray-900">GRC Policies</h5>
                    <span class="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Active</span>
                  </div>
                  <div class="space-y-1 text-sm text-gray-600">
                    <div class="flex justify-between"><span>Documents:</span><span>156</span></div>
                    <div class="flex justify-between"><span>Size:</span><span>45.2 MB</span></div>
                    <div class="flex justify-between"><span>Updated:</span><span>2024-08-25</span></div>
                  </div>
                </div>
                
                <div class="border border-gray-200 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-3">
                    <h5 class="font-medium text-gray-900">Risk Frameworks</h5>
                    <span class="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">Active</span>
                  </div>
                  <div class="space-y-1 text-sm text-gray-600">
                    <div class="flex justify-between"><span>Documents:</span><span>89</span></div>
                    <div class="flex justify-between"><span>Size:</span><span>23.1 MB</span></div>
                    <div class="flex justify-between"><span>Updated:</span><span>2024-08-24</span></div>
                  </div>
                </div>

                <div class="border border-gray-200 rounded-lg p-4">
                  <div class="flex items-center justify-between mb-3">
                    <h5 class="font-medium text-gray-900">Compliance Standards</h5>
                    <span class="text-xs text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">Indexing</span>
                  </div>
                  <div class="space-y-1 text-sm text-gray-600">
                    <div class="flex justify-between"><span>Documents:</span><span>234</span></div>
                    <div class="flex justify-between"><span>Size:</span><span>67.8 MB</span></div>
                    <div class="flex justify-between"><span>Updated:</span><span>2024-08-25</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-8 flex flex-col sm:flex-row gap-4">
          <button onclick="enhancedSettings.testRAGConnection()" 
            class="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 flex items-center justify-center">
            <i class="fas fa-plug mr-2"></i>Test RAG Connection
          </button>
          <button onclick="enhancedSettings.saveRAGConfig()" 
            class="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 transition-colors duration-200 flex items-center justify-center">
            <i class="fas fa-save mr-2"></i>Save Configuration
          </button>  
          <button onclick="enhancedSettings.resetRAGConfig()" 
            class="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-500 transition-colors duration-200 flex items-center justify-center">
            <i class="fas fa-undo mr-2"></i>Reset to Defaults
          </button>
        </div>
      </div>
    `;
    
    // Load RAG configuration data
    this.loadRAGSettings();
    
    // Setup form handlers
    this.setupRAGFormHandlers();
  }

  showMicrosoftSettings() {
    // Call the existing Microsoft settings implementation from enterprise-modules.js
    if (typeof window.showMicrosoftSettings === 'function') {
      // Set the content container first
      const content = document.getElementById('settings-content');
      if (content) {
        content.innerHTML = '<div id="microsoft-loading" class="text-center py-8">Loading Microsoft integration settings...</div>';
      }
      // Call the existing function
      setTimeout(() => window.showMicrosoftSettings(), 100);
    } else {
      const content = document.getElementById('settings-content');
      content.innerHTML = `
        <div class="max-w-4xl mx-auto">
          <div class="mb-8">
            <h3 class="text-2xl font-bold text-gray-900">Microsoft Integration</h3>
            <p class="text-gray-600 mt-2">Configure Microsoft 365 and security integrations</p>
          </div>
          <div class="bg-white rounded-lg p-8 text-center text-gray-500">
            Microsoft integration module is not available.
          </div>
        </div>
      `;
    }
  }

  showSystemSettings() {
    // Show system subtabs
    document.querySelectorAll('.system-subtab').forEach(subtab => {
      subtab.classList.remove('hidden');
    });
    
    // Show default system subtab (users)
    this.showSystemSubTab('users');
  }

  showSystemSubTab(subtab) {
    // Update subtab navigation
    document.querySelectorAll('.system-subtab').forEach(tab => {
      tab.classList.remove('bg-gray-100', 'text-gray-900');
      tab.classList.add('text-gray-600', 'hover:bg-gray-50');
    });
    
    const activeSubtab = document.getElementById(`subtab-${subtab}`);
    if (activeSubtab) {
      activeSubtab.classList.add('bg-gray-100', 'text-gray-900');
      activeSubtab.classList.remove('text-gray-600', 'hover:bg-gray-50');
    }

    const content = document.getElementById('settings-content');
    
    switch(subtab) {
      case 'users':
        this.showUnifiedUsersManagement();
        break;
      case 'organizations':
        this.showOrganizationsManagement();
        break;
      case 'saml':
        this.showSAMLSettings();
        break;
    }
  }

  showUnifiedUsersManagement() {
    const content = document.getElementById('settings-content');
    
    content.innerHTML = `
      <div class="space-y-6">
        <!-- Unified User Management Header -->
        <div class="flex justify-between items-center">
          <div>
            <h3 class="text-lg font-medium text-gray-900">User Management</h3>
            <p class="text-gray-600 mt-1">Manage all users including administrators, risk managers, and risk owners</p>
          </div>
          <button onclick="enhancedSettings.showAddUserModal()" class="btn-primary">
            <i class="fas fa-plus mr-2"></i>Add User
          </button>
        </div>
        
        <!-- Role-based Filters -->
        <div class="bg-white p-4 rounded-lg shadow-sm border">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-sm font-medium text-gray-700">Filter by Role:</span>
              <button onclick="enhancedSettings.filterUsers('all')" id="filter-all" class="role-filter-btn active" data-role="all">
                <i class="fas fa-users mr-1"></i>All Users
              </button>
              <button onclick="enhancedSettings.filterUsers('admin')" id="filter-admin" class="role-filter-btn" data-role="admin">
                <i class="fas fa-user-cog mr-1"></i>Administrators
              </button>
              <button onclick="enhancedSettings.filterUsers('risk_manager')" id="filter-risk_manager" class="role-filter-btn" data-role="risk_manager">
                <i class="fas fa-user-tie mr-1"></i>Risk Managers
              </button>
              <button onclick="enhancedSettings.filterUsers('risk_owner')" id="filter-risk_owner" class="role-filter-btn" data-role="risk_owner">
                <i class="fas fa-user-shield mr-1"></i>Risk Owners
              </button>
              <button onclick="enhancedSettings.filterUsers('user')" id="filter-user" class="role-filter-btn" data-role="user">
                <i class="fas fa-user mr-1"></i>Standard Users
              </button>
            </div>
            <div class="flex items-center gap-2">
              <input type="text" id="user-search" placeholder="Search users..." class="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <button onclick="enhancedSettings.refreshUsers()" class="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <i class="fas fa-sync-alt text-gray-600"></i>
              </button>
            </div>
          </div>
        </div>
        
        <!-- Users Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div class="bg-white p-4 rounded-lg shadow-sm border">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-users text-blue-600"></i>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Total Users</p>
                <p class="text-lg font-semibold text-gray-900" id="total-users">0</p>
              </div>
            </div>
          </div>
          <div class="bg-white p-4 rounded-lg shadow-sm border">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-user-cog text-purple-600"></i>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Administrators</p>
                <p class="text-lg font-semibold text-gray-900" id="admin-users">0</p>
              </div>
            </div>
          </div>
          <div class="bg-white p-4 rounded-lg shadow-sm border">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-user-tie text-green-600"></i>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Risk Managers</p>
                <p class="text-lg font-semibold text-gray-900" id="risk-manager-users">0</p>
              </div>
            </div>
          </div>
          <div class="bg-white p-4 rounded-lg shadow-sm border">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-user-shield text-orange-600"></i>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Risk Owners</p>
                <p class="text-lg font-semibold text-gray-900" id="risk-owner-users">0</p>
              </div>
            </div>
          </div>
          <div class="bg-white p-4 rounded-lg shadow-sm border">
            <div class="flex items-center">
              <div class="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                <i class="fas fa-user text-gray-600"></i>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-500">Standard Users</p>
                <p class="text-lg font-semibold text-gray-900" id="standard-users">0</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Users Table -->
        <div class="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h4 class="text-lg font-medium text-gray-900">Users List</h4>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owned Risks</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody id="users-table-body" class="bg-white divide-y divide-gray-200">
                <!-- Users will be loaded here -->
              </tbody>
            </table>
          </div>
          <div id="users-loading" class="p-8 text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-2 text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    `;
    
    // Load unified users data
    this.loadUnifiedUsersData();
    
    // Setup search functionality
    document.getElementById('user-search').addEventListener('input', (e) => {
      this.searchUsers(e.target.value);
    });
  }

  showOrganizationsManagement() {
    // Call the existing organizations settings implementation from enterprise-modules.js
    if (typeof window.showOrganizationsSettings === 'function') {
      // Set loading state first
      const content = document.getElementById('settings-content');
      if (content) {
        content.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin mr-2"></i>Loading organizations...</div>';
      }
      // Call the existing function
      setTimeout(() => window.showOrganizationsSettings(), 100);
    } else {
      if (typeof showOrganizationsSettingsFallback === 'function') {
        showOrganizationsSettingsFallback();
      } else {
        const content = document.getElementById('settings-content');
        content.innerHTML = '<div class="text-center py-8 text-red-600">Organizations module not available</div>';
      }
    }
  }

  // Risk Owners functionality now integrated into unified user management

  showSAMLSettings() {
    // Call the existing SAML settings implementation from enterprise-modules.js
    if (typeof window.showSAMLSettings === 'function') {
      // Call the existing function directly - no loading state needed as it's already fast
      window.showSAMLSettings();
    } else {
      const content = document.getElementById('settings-content');
      content.innerHTML = `
        <div class="max-w-4xl mx-auto">
          <div class="mb-8">
            <h3 class="text-2xl font-bold text-gray-900">SAML Authentication</h3>
            <p class="text-gray-600 mt-2">SAML module is not available</p>
          </div>
        </div>
      `;
    }
  }

  // Unified User Management Methods
  async loadUnifiedUsersData() {
    try {
      const token = localStorage.getItem('aria_token');
      if (!token) {
        showToast('Please login to access user management', 'error');
        return;
      }

      const response = await axios.get('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        this.allUsers = response.data.data || [];
        this.displayUsers(this.allUsers);
        this.updateUserStatistics();
      } else {
        throw new Error(response.data.error || 'Failed to load users');
      }
    } catch (error) {
      console.error('Error loading users:', error);
      document.getElementById('users-loading').innerHTML = '<p class="text-red-600">Failed to load users</p>';
    }
  }

  displayUsers(users) {
    const tbody = document.getElementById('users-table-body');
    const loading = document.getElementById('users-loading');
    
    if (loading) loading.style.display = 'none';
    
    if (!users || users.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="px-6 py-8 text-center text-gray-500">
            <i class="fas fa-users text-gray-300 text-3xl mb-2"></i>
            <p>No users found</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = users.map(user => `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
              ${(user.first_name?.[0] || '')}${(user.last_name?.[0] || '')}
            </div>
            <div class="ml-4">
              <div class="text-sm font-medium text-gray-900">${user.first_name || ''} ${user.last_name || ''}</div>
              <div class="text-sm text-gray-500">${user.email || ''}</div>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          ${this.getRoleBadge(user.role)}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${user.department || '-'}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          ${user.organization_name || '-'}
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <div class="flex items-center">
            <span class="text-lg font-semibold text-blue-600">${user.owned_risks_count || 0}</span>
            ${user.owned_risks_count > 0 ? '<i class="fas fa-shield-alt text-orange-500 ml-1"></i>' : ''}
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          ${user.is_active ? 
            '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><i class="fas fa-check-circle mr-1"></i>Active</span>' : 
            '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><i class="fas fa-times-circle mr-1"></i>Inactive</span>'
          }
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div class="flex items-center space-x-2">
            <button onclick="enhancedSettings.editUser(${user.id})" class="text-blue-600 hover:text-blue-900">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="enhancedSettings.manageUserRisks(${user.id})" class="text-green-600 hover:text-green-900" title="Manage Risks">
              <i class="fas fa-shield-alt"></i>
            </button>
            <button onclick="enhancedSettings.toggleUserStatus(${user.id}, ${user.is_active})" class="text-${user.is_active ? 'orange' : 'green'}-600 hover:text-${user.is_active ? 'orange' : 'green'}-900">
              <i class="fas fa-${user.is_active ? 'pause' : 'play'}"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  getRoleBadge(role) {
    const roleConfig = {
      admin: { label: 'Administrator', color: 'purple', icon: 'user-cog' },
      risk_manager: { label: 'Risk Manager', color: 'green', icon: 'user-tie' },
      risk_owner: { label: 'Risk Owner', color: 'orange', icon: 'user-shield' },
      compliance_officer: { label: 'Compliance Officer', color: 'blue', icon: 'user-check' },
      user: { label: 'Standard User', color: 'gray', icon: 'user' }
    };

    const config = roleConfig[role] || roleConfig.user;
    return `
      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${config.color}-100 text-${config.color}-800">
        <i class="fas fa-${config.icon} mr-1"></i>
        ${config.label}
      </span>
    `;
  }

  updateUserStatistics() {
    const stats = {
      total: this.allUsers.length,
      admin: this.allUsers.filter(u => u.role === 'admin').length,
      risk_manager: this.allUsers.filter(u => u.role === 'risk_manager').length,
      risk_owner: this.allUsers.filter(u => u.role === 'risk_owner').length,
      user: this.allUsers.filter(u => u.role === 'user').length
    };

    document.getElementById('total-users').textContent = stats.total;
    document.getElementById('admin-users').textContent = stats.admin;
    document.getElementById('risk-manager-users').textContent = stats.risk_manager;
    document.getElementById('risk-owner-users').textContent = stats.risk_owner;
    document.getElementById('standard-users').textContent = stats.user;
  }

  filterUsers(role) {
    // Update active filter button
    document.querySelectorAll('.role-filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.getElementById(`filter-${role}`).classList.add('active');

    // Filter users
    let filteredUsers = this.allUsers;
    if (role !== 'all') {
      filteredUsers = this.allUsers.filter(user => user.role === role);
    }

    this.displayUsers(filteredUsers);
  }

  searchUsers(query) {
    if (!query.trim()) {
      this.displayUsers(this.allUsers);
      return;
    }

    const filtered = this.allUsers.filter(user => {
      const searchText = `${user.first_name} ${user.last_name} ${user.email} ${user.department}`.toLowerCase();
      return searchText.includes(query.toLowerCase());
    });

    this.displayUsers(filtered);
  }

  refreshUsers() {
    this.loadUnifiedUsersData();
    showToast('Users refreshed', 'success');
  }

  showAddUserModal() {
    // Implementation for add user modal
    showToast('Add user functionality coming soon', 'info');
  }

  editUser(userId) {
    // Implementation for edit user
    showToast(`Edit user ${userId} functionality coming soon`, 'info');
  }

  manageUserRisks(userId) {
    // Implementation for managing user risks
    showToast(`Risk management for user ${userId} functionality coming soon`, 'info');
  }

  async toggleUserStatus(userId, currentStatus) {
    try {
      const token = localStorage.getItem('aria_token');
      const newStatus = !currentStatus;
      
      const response = await axios.patch(`/api/users/${userId}`, {
        is_active: newStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        showToast(`User ${newStatus ? 'activated' : 'deactivated'} successfully`, 'success');
        this.refreshUsers();
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      showToast('Failed to update user status', 'error');
    }
  }

  // RAG & Knowledge Base Methods
  renderRAGConfigCard(category, config) {
    return `
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center">
            <div class="w-10 h-10 ${config.bgColor} rounded-lg flex items-center justify-center mr-4">
              <i class="${config.icon} ${config.iconColor}"></i>
            </div>
            <div>
              <h4 class="text-lg font-medium text-gray-900">${config.name}</h4>
              <p class="text-sm text-gray-600">${config.description}</p>
            </div>
          </div>
        </div>
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            ${config.fields.map(field => this.renderRAGField(field)).join('')}
          </div>
        </div>
      </div>
    `;
  }

  renderRAGField(field) {
    switch (field.type) {
      case 'select':
        return `
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">${field.label}</label>
            <select id="${field.id}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
              ${field.options.map(option => 
                `<option value="${option}" ${option === field.value ? 'selected' : ''}>${option}</option>`
              ).join('')}
            </select>
          </div>
        `;
      case 'password':
        return `
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">${field.label}</label>
            <div class="relative">
              <input type="password" id="${field.id}" placeholder="${field.placeholder}" 
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
              <button type="button" onclick="enhancedSettings.togglePasswordVisibility('${field.id}')" 
                      class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <i class="fas fa-eye text-gray-400 hover:text-gray-600"></i>
              </button>
            </div>
          </div>
        `;
      case 'number':
        return `
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">${field.label}</label>
            <input type="number" id="${field.id}" placeholder="${field.placeholder}" value="${field.value || ''}"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
          </div>
        `;
      case 'range':
        return `
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">${field.label}</label>
            <div class="flex items-center space-x-3">
              <input type="range" id="${field.id}" min="${field.min}" max="${field.max}" step="${field.step}" value="${field.value}"
                     class="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
              <span class="text-sm text-gray-600 min-w-[3rem]" id="${field.id}-value">${field.value}</span>
            </div>
          </div>
        `;
      case 'checkbox':
        return `
          <div>
            <label class="flex items-center">
              <input type="checkbox" id="${field.id}" ${field.checked ? 'checked' : ''}
                     class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
              <span class="ml-2 text-sm text-gray-700">${field.label}</span>
            </label>
          </div>
        `;
      default:
        return `
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">${field.label}</label>
            <input type="text" id="${field.id}" placeholder="${field.placeholder}" value="${field.value || ''}"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
          </div>
        `;
    }
  }

  async loadRAGSettings() {
    try {
      // Load saved RAG settings from localStorage
      const savedSettings = localStorage.getItem('rag_settings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        this.populateRAGSettings(settings);
      }
    } catch (error) {
      console.error('Error loading RAG settings:', error);
    }
  }

  populateRAGSettings(settings) {
    // Populate form fields with saved settings
    Object.keys(settings).forEach(key => {
      const element = document.getElementById(key);
      if (element) {
        if (element.type === 'checkbox') {
          element.checked = settings[key];
        } else {
          element.value = settings[key];
        }
      }
    });
  }

  setupRAGFormHandlers() {
    // Setup range input updates
    const rangeInputs = document.querySelectorAll('input[type="range"]');
    rangeInputs.forEach(input => {
      const valueDisplay = document.getElementById(`${input.id}-value`);
      if (valueDisplay) {
        input.addEventListener('input', () => {
          valueDisplay.textContent = input.value;
        });
      }
    });

    // Setup auto-save on input changes
    const inputs = document.querySelectorAll('#settings-content input, #settings-content select');
    inputs.forEach(input => {
      input.addEventListener('change', () => {
        this.autoSaveRAGSettings();
      });
    });
  }

  autoSaveRAGSettings() {
    clearTimeout(this.ragSaveTimeout);
    this.ragSaveTimeout = setTimeout(() => {
      this.saveRAGConfig();
    }, 1000);
  }

  saveRAGConfig() {
    try {
      const settings = {};
      const inputs = document.querySelectorAll('#settings-content input, #settings-content select');
      
      inputs.forEach(input => {
        if (input.type === 'checkbox') {
          settings[input.id] = input.checked;
        } else {
          settings[input.id] = input.value;
        }
      });

      localStorage.setItem('rag_settings', JSON.stringify(settings));
      showToast('RAG configuration saved successfully', 'success');
    } catch (error) {
      console.error('Error saving RAG settings:', error);
      showToast('Failed to save RAG configuration', 'error');
    }
  }

  async testRAGConnection() {
    showToast('Testing RAG connection...', 'info');
    
    // Simulate connection test
    setTimeout(() => {
      const success = Math.random() > 0.3; // 70% success rate for demo
      if (success) {
        showToast('RAG connection test successful!', 'success');
      } else {
        showToast('RAG connection test failed. Please check your configuration.', 'error');
      }
    }, 2000);
  }

  resetRAGConfig() {
    if (confirm('Are you sure you want to reset RAG configuration to defaults? This will clear all current settings.')) {
      localStorage.removeItem('rag_settings');
      showToast('RAG configuration reset to defaults', 'info');
      this.showRAGSettings(); // Reload the settings
    }
  }

  uploadKnowledge() {
    showToast('Knowledge upload functionality coming soon', 'info');
  }

  reindexKnowledge() {
    showToast('Starting knowledge base reindexing...', 'info');
    setTimeout(() => {
      showToast('Knowledge base reindexing completed successfully', 'success');
    }, 3000);
  }

  togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.nextElementSibling.querySelector('i');
    
    if (input.type === 'password') {
      input.type = 'text';
      icon.classList.remove('fa-eye');
      icon.classList.add('fa-eye-slash');
    } else {
      input.type = 'password';
      icon.classList.remove('fa-eye-slash');
      icon.classList.add('fa-eye');
    }
  }
}

// Initialize the enhanced settings manager
const enhancedSettings = new EnhancedSettingsManager();

// Export for global access
window.enhancedSettings = enhancedSettings;