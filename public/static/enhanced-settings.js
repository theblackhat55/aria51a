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
                    </button>
                    <button onclick="enhancedSettings.showSystemSubTab('organizations')" 
                      id="subtab-organizations" 
                      class="system-subtab w-full text-left flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-all duration-200">
                      <i class="fas fa-building text-indigo-600"></i>
                      <span>Organizations</span>
                    </button>
                    <button onclick="enhancedSettings.showSystemSubTab('risk-owners')" 
                      id="subtab-risk-owners" 
                      class="system-subtab w-full text-left flex items-center space-x-2 px-3 py-2 text-sm rounded-lg transition-all duration-200">
                      <i class="fas fa-user-shield text-orange-600"></i>
                      <span>Risk Owners</span>
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
          <p class="text-gray-600 mt-2">Configure your AI provider preferences. API keys are managed securely by administrators.</p>
          <div class="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-shield-alt text-green-600 mr-2"></i>
              <span class="text-green-800 font-medium">Secure Configuration</span>
            </div>
            <p class="text-green-700 text-sm mt-1">API keys are stored securely on the server. You can only configure provider preferences and model settings.</p>
          </div>
        </div>

        <!-- AI Provider Cards -->
        <div class="space-y-6">
          <!-- API Key Management Section -->
          <div class="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center space-x-3">
                <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <i class="fas fa-key text-blue-600 text-xl"></i>
                </div>
                <div>
                  <h4 class="text-lg font-semibold text-gray-900">Personal API Key Management</h4>
                  <p class="text-sm text-gray-600">Manage your personal AI provider API keys securely</p>
                </div>
              </div>
              <button onclick="secureKeyManager.showKeyManagementDialog()" 
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 transition-colors duration-200">
                <i class="fas fa-cog mr-2"></i>Manage Keys
              </button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div id="openai-key-status" class="p-3 bg-white rounded-lg border border-gray-200">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">OpenAI</span>
                  <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span class="text-xs text-gray-500">Not Set</span>
                  </div>
                </div>
              </div>
              <div id="gemini-key-status" class="p-3 bg-white rounded-lg border border-gray-200">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">Gemini</span>
                  <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span class="text-xs text-gray-500">Not Set</span>
                  </div>
                </div>
              </div>
              <div id="anthropic-key-status" class="p-3 bg-white rounded-lg border border-gray-200">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">Anthropic</span>
                  <div class="flex items-center space-x-2">
                    <div class="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span class="text-xs text-gray-500">Not Set</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- OpenAI Configuration -->
          ${this.renderAIProviderCard('openai', {
            name: 'OpenAI GPT-4',
            description: 'Advanced language model for complex reasoning',
            icon: 'fas fa-openai',
            iconColor: 'text-green-600',
            bgColor: 'bg-green-100',
            enabled: aiSettings.openai?.enabled || false,
            priority: aiSettings.openai?.priority || 1,
            model: aiSettings.openai?.model || 'gpt-4o',
            maxTokens: aiSettings.openai?.maxTokens || 1500,
            temperature: aiSettings.openai?.temperature || 0.7,
            models: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
            helpUrl: 'https://platform.openai.com/api-keys'
          })}

          <!-- Gemini Configuration -->
          ${this.renderAIProviderCard('gemini', {
            name: 'Google Gemini',
            description: "Google's advanced multimodal AI",
            icon: 'fab fa-google',
            iconColor: 'text-blue-600',
            bgColor: 'bg-blue-100',
            enabled: aiSettings.gemini?.enabled || false,
            priority: aiSettings.gemini?.priority || 2,
            model: aiSettings.gemini?.model || 'gemini-pro',
            maxTokens: aiSettings.gemini?.maxTokens || 1500,
            temperature: aiSettings.gemini?.temperature || 0.7,
            models: ['gemini-pro', 'gemini-pro-vision', 'gemini-1.5-pro', 'gemini-1.5-flash'],
            helpUrl: 'https://aistudio.google.com/app/apikey'
          })}

          <!-- Anthropic Configuration -->
          ${this.renderAIProviderCard('anthropic', {
            name: 'Anthropic Claude',
            description: 'Advanced reasoning and safe AI',
            icon: 'fas fa-microchip',
            iconColor: 'text-purple-600',
            bgColor: 'bg-purple-100',
            enabled: aiSettings.anthropic?.enabled || false,
            priority: aiSettings.anthropic?.priority || 3,
            model: aiSettings.anthropic?.model || 'claude-3-5-sonnet-20241022',
            maxTokens: aiSettings.anthropic?.maxTokens || 1500,
            temperature: aiSettings.anthropic?.temperature || 0.7,
            models: ['claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'],
            helpUrl: 'https://console.anthropic.com/settings/keys'
          })}

          <!-- Local/Custom LLM removed for security -->
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
    
    // Initialize secure key manager and update key status
    if (typeof secureKeyManager !== 'undefined') {
      this.updateKeyStatusDisplay();
    }
  }

  renderAIProviderCard(provider, config) {
    const settings = config.settings || config; // Use config directly for new secure format
    const isEnabled = settings.enabled || false;
    
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
                <option value="0" ${settings.priority === 0 || !settings.enabled ? 'selected' : ''}>Disabled</option>
              </select>
            </div>
            <div class="flex items-center">
              <div class="w-3 h-3 rounded-full ${isEnabled ? 'bg-green-400' : 'bg-red-400'} mr-2"></div>
              <span class="text-sm text-gray-600">${isEnabled ? 'Available' : 'Not Configured'}</span>
            </div>
          </div>
        </div>

        <!-- Configuration Fields -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Server Status -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Server Configuration</label>
            <div class="px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <div class="w-3 h-3 rounded-full ${isEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}"></div>
                  <span class="text-sm font-medium">${isEnabled ? 'Available' : 'Not Configured'}</span>
                </div>
                <i class="fas fa-server text-gray-400"></i>
              </div>
              <p class="text-xs text-gray-500 mt-2">
                ${isEnabled ? 'API key configured by administrator' : 'Contact administrator to configure API key'}
              </p>
            </div>
          </div>

          <!-- Model Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Model</label>
            <div class="flex space-x-2">
              <select id="${provider}-model" 
                class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent auto-save-field"
                data-provider="${provider}">
                ${config.models?.map(model => 
                  `<option value="${model}" ${settings.model === model ? 'selected' : ''}>${model}</option>`
                ).join('') || ''}
              </select>
              <button onclick="enhancedSettings.fetchModels('${provider}')" 
                class="px-4 py-3 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 focus:ring-2 focus:ring-blue-500 transition-colors duration-200" 
                title="Refresh models">
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
            <div class="mt-4">
              <div class="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div class="flex items-center">
                  <i class="fas fa-info-circle text-blue-600 mr-2"></i>
                  <span class="text-blue-800 text-sm">These settings control your preferences only. API keys are managed securely by administrators.</span>
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
      const token = localStorage.getItem('dmt_token');
      if (!token) {
        console.log('No auth token, using default settings');
        return this.getDefaultAISettings();
      }

      const response = await fetch('/api/ai/config', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        console.error('Failed to load AI settings from server');
        return this.getDefaultAISettings();
      }

      const result = await response.json();
      return result.success ? result.data : this.getDefaultAISettings();
    } catch (error) {
      console.error('Error loading AI settings:', error);
      return this.getDefaultAISettings();
    }
  }

  getDefaultAISettings() {
    return {
      openai: { enabled: false, priority: 1, model: 'gpt-4o', maxTokens: 1500, temperature: 0.7 },
      gemini: { enabled: false, priority: 2, model: 'gemini-pro', maxTokens: 1500, temperature: 0.7 },
      anthropic: { enabled: false, priority: 3, model: 'claude-3-5-sonnet-20241022', maxTokens: 1500, temperature: 0.7 }
    };
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
    try {
      const providerConfigs = {
        openai: {
          priority: parseInt(document.getElementById('openai-priority')?.value || 0),
          model: document.getElementById('openai-model')?.value || 'gpt-4o',
          maxTokens: parseInt(document.getElementById('openai-max-tokens')?.value || 1500),
          temperature: parseFloat(document.getElementById('openai-temperature')?.value || 0.7)
        },
        gemini: {
          priority: parseInt(document.getElementById('gemini-priority')?.value || 0),
          model: document.getElementById('gemini-model')?.value || 'gemini-pro',
          maxTokens: parseInt(document.getElementById('gemini-max-tokens')?.value || 1500),
          temperature: parseFloat(document.getElementById('gemini-temperature')?.value || 0.7)
        },
        anthropic: {
          priority: parseInt(document.getElementById('anthropic-priority')?.value || 0),
          model: document.getElementById('anthropic-model')?.value || 'claude-3-5-sonnet-20241022',
          maxTokens: parseInt(document.getElementById('anthropic-max-tokens')?.value || 1500),
          temperature: parseFloat(document.getElementById('anthropic-temperature')?.value || 0.7)
        }
      };

      const token = localStorage.getItem('dmt_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/ai/config', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ providerConfigs })
      });

      if (!response.ok) {
        throw new Error('Failed to save AI settings');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Save failed');
      }

      // Update ARIA provider display
      if (typeof updateARIAProviderDisplay === 'function') {
        updateARIAProviderDisplay();
      }

      console.log('AI settings saved successfully');
    } catch (error) {
      console.error('Error saving AI settings:', error);
      throw error;
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
    try {
      showToast('Testing AI connections...', 'info');
      
      const token = localStorage.getItem('dmt_token');
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/ai/test-connections', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to test connections');
      }

      const result = await response.json();
      if (result.success) {
        const results = result.data;
        let message = 'Connection Test Results:\n';
        
        Object.entries(results).forEach(([provider, status]) => {
          const statusText = status.status === 'connected' ? '✅' : 
                           status.status === 'not_configured' ? '⚠️' : '❌';
          message += `${statusText} ${provider.toUpperCase()}: ${status.status}${status.error ? ` (${status.error})` : ''}\n`;
        });

        showToast(message, 'success');
        
        // Update key status display after test
        this.updateKeyStatusDisplay();
      } else {
        throw new Error(result.error || 'Test failed');
      }
    } catch (error) {
      console.error('Connection test error:', error);
      showToast(`Connection test failed: ${error.message}`, 'error');
    }
  }

  async refreshAllModels() {
    showToast('Refreshing all models...', 'info');
    // TODO: Implement model refresh for all providers
  }

  async updateKeyStatusDisplay() {
    try {
      const token = localStorage.getItem('dmt_token');
      if (!token) return;

      const response = await fetch('/api/keys/status', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) return;

      const result = await response.json();
      if (result.success) {
        const keyStatus = result.data;
        
        ['openai', 'gemini', 'anthropic'].forEach(provider => {
          const statusEl = document.getElementById(`${provider}-key-status`);
          if (statusEl) {
            const status = keyStatus[provider];
            const indicator = statusEl.querySelector('.w-3.h-3');
            const text = statusEl.querySelector('.text-xs');
            
            if (status && status.configured) {
              indicator.className = 'w-3 h-3 rounded-full ' + (status.valid ? 'bg-green-400' : 'bg-yellow-400');
              text.textContent = status.valid ? 'Valid' : 'Invalid';
              text.className = 'text-xs ' + (status.valid ? 'text-green-600' : 'text-yellow-600');
            } else {
              indicator.className = 'w-3 h-3 rounded-full bg-gray-400';
              text.textContent = 'Not Set';
              text.className = 'text-xs text-gray-500';
            }
          }
        });
      }
    } catch (error) {
      console.error('Error updating key status:', error);
    }
  }

  showRAGSettings() {
    // Call the existing RAG settings implementation from enterprise-modules.js
    if (typeof window.showRAGSettings === 'function') {
      // Set the content container first
      const content = document.getElementById('settings-content');
      if (content) {
        content.innerHTML = '<div id="rag-loading" class="text-center py-8">Loading RAG settings...</div>';
      }
      // Call the existing function
      setTimeout(() => window.showRAGSettings(), 100);
    } else {
      const content = document.getElementById('settings-content');
      content.innerHTML = `
        <div class="max-w-4xl mx-auto">
          <div class="mb-8">
            <h3 class="text-2xl font-bold text-gray-900">RAG & Knowledge Base</h3>
            <p class="text-gray-600 mt-2">Configure retrieval-augmented generation and knowledge base settings</p>
          </div>
          <div class="bg-white rounded-lg p-8 text-center text-gray-500">
            RAG module is not available.
          </div>
        </div>
      `;
    }
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
        this.showUsersManagement();
        break;
      case 'organizations':
        this.showOrganizationsManagement();
        break;
      case 'risk-owners':
        this.showRiskOwnersManagement();
        break;
      case 'saml':
        this.showSAMLSettings();
        break;
    }
  }

  showUsersManagement() {
    // Call the existing users settings implementation from enterprise-modules.js
    if (typeof window.showUsersSettings === 'function') {
      // Set loading state first
      const content = document.getElementById('settings-content');
      if (content) {
        content.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin mr-2"></i>Loading users...</div>';
      }
      // Call the existing function
      setTimeout(() => window.showUsersSettings(), 100);
    } else {
      // Fallback implementation from system-settings-integration.js
      if (typeof showUsersSettingsFallback === 'function') {
        showUsersSettingsFallback();
      } else {
        const content = document.getElementById('settings-content');
        content.innerHTML = '<div class="text-center py-8 text-red-600">User management module not available</div>';
      }
    }
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

  showRiskOwnersManagement() {
    // Call the existing risk owners settings implementation from enterprise-modules.js
    if (typeof window.showRiskOwnersSettings === 'function') {
      // Set loading state first
      const content = document.getElementById('settings-content');
      if (content) {
        content.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin mr-2"></i>Loading risk owners...</div>';
      }
      // Call the existing function
      setTimeout(() => window.showRiskOwnersSettings(), 100);
    } else {
      if (typeof showRiskOwnersSettingsFallback === 'function') {
        showRiskOwnersSettingsFallback();
      } else {
        const content = document.getElementById('settings-content');
        content.innerHTML = '<div class="text-center py-8 text-red-600">Risk owners module not available</div>';
      }
    }
  }

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
}

// Initialize the enhanced settings manager
const enhancedSettings = new EnhancedSettingsManager();

// Export for global access
window.enhancedSettings = enhancedSettings;