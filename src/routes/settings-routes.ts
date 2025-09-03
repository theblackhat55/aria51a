import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { baseLayout } from '../templates/layout';
import type { CloudflareBindings } from '../types';

export function createSettingsRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware
  app.use('*', requireAuth);
  
  // Main settings page
  app.get('/', async (c) => {
    const user = c.get('user');
    return c.html(
      baseLayout({
        title: 'Settings',
        user,
        content: renderSettingsPage()
      })
    );
  });
  
  // General settings tab content
  app.get('/general', async (c) => {
    const settings = await getGeneralSettings();
    return c.html(renderGeneralSettings(settings));
  });
  
  // Security settings tab content
  app.get('/security', async (c) => {
    const settings = await getSecuritySettings();
    return c.html(renderSecuritySettings(settings));
  });
  
  // AI providers tab content
  app.get('/ai-providers', async (c) => {
    const providers = await getAIProviders();
    return c.html(renderAIProvidersSettings(providers));
  });
  
  // Integrations tab content
  app.get('/integrations', async (c) => {
    const integrations = await getIntegrations();
    return c.html(renderIntegrationsSettings(integrations));
  });
  
  // Notifications tab content
  app.get('/notifications', async (c) => {
    const settings = await getNotificationSettings();
    return c.html(renderNotificationSettings(settings));
  });
  
  // Update general settings
  app.post('/general', async (c) => {
    const formData = await c.req.parseBody();
    
    try {
      await updateGeneralSettings(formData);
      return c.html(`
        <div class="bg-green-50 border-l-4 border-green-500 p-4">
          <p class="text-green-700">General settings updated successfully!</p>
        </div>
      `);
    } catch (error) {
      return c.html(`
        <div class="bg-red-50 border-l-4 border-red-500 p-4">
          <p class="text-red-700">Error updating settings: ${error.message}</p>
        </div>
      `);
    }
  });
  
  // Update security settings
  app.post('/security', async (c) => {
    const formData = await c.req.parseBody();
    
    try {
      await updateSecuritySettings(formData);
      return c.html(`
        <div class="bg-green-50 border-l-4 border-green-500 p-4">
          <p class="text-green-700">Security settings updated successfully!</p>
        </div>
      `);
    } catch (error) {
      return c.html(`
        <div class="bg-red-50 border-l-4 border-red-500 p-4">
          <p class="text-red-700">Error updating security settings: ${error.message}</p>
        </div>
      `);
    }
  });
  
  // Update AI provider configuration
  app.post('/ai-providers/:provider', async (c) => {
    const provider = c.req.param('provider');
    const formData = await c.req.parseBody();
    
    try {
      await updateAIProviderConfig(provider, formData);
      return c.html(`
        <div class="bg-green-50 border-l-4 border-green-500 p-4">
          <p class="text-green-700">${provider} configuration updated successfully!</p>
        </div>
      `);
    } catch (error) {
      return c.html(`
        <div class="bg-red-50 border-l-4 border-red-500 p-4">
          <p class="text-red-700">Error updating ${provider} configuration: ${error.message}</p>
        </div>
      `);
    }
  });
  
  // Test AI provider connection
  app.post('/ai-providers/:provider/test', async (c) => {
    const provider = c.req.param('provider');
    
    try {
      const result = await testAIProviderConnection(provider);
      return c.html(`
        <div class="bg-green-50 border-l-4 border-green-500 p-4">
          <p class="text-green-700">✅ ${provider} connection successful!</p>
          <p class="text-sm text-green-600">Response time: ${result.responseTime}ms</p>
        </div>
      `);
    } catch (error) {
      return c.html(`
        <div class="bg-red-50 border-l-4 border-red-500 p-4">
          <p class="text-red-700">❌ ${provider} connection failed: ${error.message}</p>
        </div>
      `);
    }
  });
  
  // Update integration settings
  app.post('/integrations/:integration', async (c) => {
    const integration = c.req.param('integration');
    const formData = await c.req.parseBody();
    
    try {
      await updateIntegrationConfig(integration, formData);
      return c.html(`
        <div class="bg-green-50 border-l-4 border-green-500 p-4">
          <p class="text-green-700">${integration} integration updated successfully!</p>
        </div>
      `);
    } catch (error) {
      return c.html(`
        <div class="bg-red-50 border-l-4 border-red-500 p-4">
          <p class="text-red-700">Error updating ${integration} integration: ${error.message}</p>
        </div>
      `);
    }
  });
  
  // Update notification settings
  app.post('/notifications', async (c) => {
    const formData = await c.req.parseBody();
    
    try {
      await updateNotificationSettings(formData);
      return c.html(`
        <div class="bg-green-50 border-l-4 border-green-500 p-4">
          <p class="text-green-700">Notification settings updated successfully!</p>
        </div>
      `);
    } catch (error) {
      return c.html(`
        <div class="bg-red-50 border-l-4 border-red-500 p-4">
          <p class="text-red-700">Error updating notification settings: ${error.message}</p>
        </div>
      `);
    }
  });
  
  return app;
}

// Template functions
const renderSettingsPage = () => html`
  <div class="space-y-6">
    <!-- Page Header -->
    <div>
      <h2 class="text-2xl font-bold text-gray-900">Settings</h2>
      <p class="text-gray-600 mt-1">Configure platform settings and integrations</p>
    </div>
    
    <!-- Notification Area -->
    <div id="notification-area"></div>
    
    <!-- Settings Tabs -->
    <div class="bg-white rounded-lg shadow">
      <!-- Tab Navigation -->
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8 px-6">
          <button 
            class="settings-tab active py-4 px-1 border-b-2 border-blue-500 font-medium text-sm text-blue-600"
            data-tab="general"
            hx-get="/settings/general"
            hx-target="#settings-content"
            hx-swap="innerHTML">
            General
          </button>
          <button 
            class="settings-tab py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
            data-tab="security"
            hx-get="/settings/security"
            hx-target="#settings-content"
            hx-swap="innerHTML">
            Security
          </button>
          <button 
            class="settings-tab py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
            data-tab="ai-providers"
            hx-get="/settings/ai-providers"
            hx-target="#settings-content"
            hx-swap="innerHTML">
            AI Providers
          </button>
          <button 
            class="settings-tab py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
            data-tab="integrations"
            hx-get="/settings/integrations"
            hx-target="#settings-content"
            hx-swap="innerHTML">
            Integrations
          </button>
          <button 
            class="settings-tab py-4 px-1 border-b-2 border-transparent font-medium text-sm text-gray-500 hover:text-gray-700 hover:border-gray-300"
            data-tab="notifications"
            hx-get="/settings/notifications"
            hx-target="#settings-content"
            hx-swap="innerHTML">
            Notifications
          </button>
        </nav>
      </div>
      
      <!-- Tab Content -->
      <div id="settings-content" hx-get="/settings/general" hx-trigger="load">
        <!-- Content will be loaded here -->
      </div>
    </div>
  </div>
  
  <script>
    // Handle tab switching
    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('settings-tab')) {
        // Remove active class from all tabs
        document.querySelectorAll('.settings-tab').forEach(tab => {
          tab.classList.remove('active', 'border-blue-500', 'text-blue-600');
          tab.classList.add('border-transparent', 'text-gray-500');
        });
        
        // Add active class to clicked tab
        e.target.classList.add('active', 'border-blue-500', 'text-blue-600');
        e.target.classList.remove('border-transparent', 'text-gray-500');
      }
    });
  </script>
`;

const renderGeneralSettings = (settings: any) => html`
  <div class="p-6">
    <form hx-post="/settings/general" hx-target="#notification-area" hx-swap="innerHTML" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Organization Name</label>
          <input type="text" name="organizationName" value="${settings.organizationName}" class="form-input" required>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
          <select name="timezone" class="form-select">
            <option value="UTC" ${settings.timezone === 'UTC' ? 'selected' : ''}>UTC</option>
            <option value="America/New_York" ${settings.timezone === 'America/New_York' ? 'selected' : ''}>Eastern Time</option>
            <option value="America/Chicago" ${settings.timezone === 'America/Chicago' ? 'selected' : ''}>Central Time</option>
            <option value="America/Denver" ${settings.timezone === 'America/Denver' ? 'selected' : ''}>Mountain Time</option>
            <option value="America/Los_Angeles" ${settings.timezone === 'America/Los_Angeles' ? 'selected' : ''}>Pacific Time</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
          <select name="dateFormat" class="form-select">
            <option value="MM/DD/YYYY" ${settings.dateFormat === 'MM/DD/YYYY' ? 'selected' : ''}>MM/DD/YYYY</option>
            <option value="DD/MM/YYYY" ${settings.dateFormat === 'DD/MM/YYYY' ? 'selected' : ''}>DD/MM/YYYY</option>
            <option value="YYYY-MM-DD" ${settings.dateFormat === 'YYYY-MM-DD' ? 'selected' : ''}>YYYY-MM-DD</option>
          </select>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Language</label>
          <select name="language" class="form-select">
            <option value="en" ${settings.language === 'en' ? 'selected' : ''}>English</option>
            <option value="es" ${settings.language === 'es' ? 'selected' : ''}>Spanish</option>
            <option value="fr" ${settings.language === 'fr' ? 'selected' : ''}>French</option>
            <option value="de" ${settings.language === 'de' ? 'selected' : ''}>German</option>
          </select>
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Platform Theme</label>
        <div class="space-y-2">
          <label class="flex items-center">
            <input type="radio" name="theme" value="light" ${settings.theme === 'light' ? 'checked' : ''} class="form-radio">
            <span class="ml-2 text-sm text-gray-700">Light Theme</span>
          </label>
          <label class="flex items-center">
            <input type="radio" name="theme" value="dark" ${settings.theme === 'dark' ? 'checked' : ''} class="form-radio">
            <span class="ml-2 text-sm text-gray-700">Dark Theme</span>
          </label>
          <label class="flex items-center">
            <input type="radio" name="theme" value="auto" ${settings.theme === 'auto' ? 'checked' : ''} class="form-radio">
            <span class="ml-2 text-sm text-gray-700">Auto (System)</span>
          </label>
        </div>
      </div>
      
      <div class="flex justify-end">
        <button type="submit" class="btn-primary">
          Save General Settings
        </button>
      </div>
    </form>
  </div>
`;

const renderSecuritySettings = (settings: any) => html`
  <div class="p-6">
    <form hx-post="/settings/security" hx-target="#notification-area" hx-swap="innerHTML" class="space-y-6">
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-4">Authentication Settings</h3>
        
        <div class="space-y-4">
          <div>
            <label class="flex items-center">
              <input type="checkbox" name="twoFactorAuth" ${settings.twoFactorAuth ? 'checked' : ''} class="form-checkbox">
              <span class="ml-2 text-sm text-gray-700">Enable Two-Factor Authentication</span>
            </label>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
            <select name="sessionTimeout" class="form-select">
              <option value="30" ${settings.sessionTimeout === 30 ? 'selected' : ''}>30 minutes</option>
              <option value="60" ${settings.sessionTimeout === 60 ? 'selected' : ''}>1 hour</option>
              <option value="240" ${settings.sessionTimeout === 240 ? 'selected' : ''}>4 hours</option>
              <option value="480" ${settings.sessionTimeout === 480 ? 'selected' : ''}>8 hours</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Password Requirements</label>
            <div class="space-y-2">
              <label class="flex items-center">
                <input type="checkbox" name="requireUppercase" ${settings.requireUppercase ? 'checked' : ''} class="form-checkbox">
                <span class="ml-2 text-sm text-gray-700">Require uppercase letters</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" name="requireNumbers" ${settings.requireNumbers ? 'checked' : ''} class="form-checkbox">
                <span class="ml-2 text-sm text-gray-700">Require numbers</span>
              </label>
              <label class="flex items-center">
                <input type="checkbox" name="requireSpecialChars" ${settings.requireSpecialChars ? 'checked' : ''} class="form-checkbox">
                <span class="ml-2 text-sm text-gray-700">Require special characters</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-4">SAML SSO Configuration</h3>
        
        <div class="space-y-4">
          <div>
            <label class="flex items-center">
              <input type="checkbox" name="samlEnabled" ${settings.samlEnabled ? 'checked' : ''} class="form-checkbox">
              <span class="ml-2 text-sm text-gray-700">Enable SAML SSO</span>
            </label>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Identity Provider URL</label>
            <input type="url" name="samlIdpUrl" value="${settings.samlIdpUrl || ''}" class="form-input" placeholder="https://your-idp.com/saml">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Entity ID</label>
            <input type="text" name="samlEntityId" value="${settings.samlEntityId || ''}" class="form-input" placeholder="aria5-platform">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">X.509 Certificate</label>
            <textarea name="samlCertificate" class="form-input" rows="4" placeholder="-----BEGIN CERTIFICATE-----">${settings.samlCertificate || ''}</textarea>
          </div>
        </div>
      </div>
      
      <div class="flex justify-end">
        <button type="submit" class="btn-primary">
          Save Security Settings
        </button>
      </div>
    </form>
  </div>
`;

const renderAIProvidersSettings = (providers: any) => html`
  <div class="p-6">
    <div class="space-y-6">
      ${providers.map(provider => html`
        <div class="border border-gray-200 rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-${provider.color}-100 rounded-lg flex items-center justify-center">
                <i class="${provider.icon} text-${provider.color}-600"></i>
              </div>
              <div>
                <h3 class="text-lg font-medium text-gray-900">${provider.name}</h3>
                <p class="text-sm text-gray-500">${provider.description}</p>
              </div>
            </div>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${provider.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
              ${provider.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          
          <form hx-post="/settings/ai-providers/${provider.id}" hx-target="#notification-area" hx-swap="innerHTML" class="space-y-4">
            <div>
              <label class="flex items-center">
                <input type="checkbox" name="enabled" ${provider.enabled ? 'checked' : ''} class="form-checkbox">
                <span class="ml-2 text-sm text-gray-700">Enable ${provider.name}</span>
              </label>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                <input type="password" name="apiKey" value="${provider.apiKey ? '••••••••••••••••' : ''}" class="form-input" placeholder="Enter API key">
              </div>
              
              ${provider.hasModel ? html`
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Model</label>
                  <input type="text" name="model" value="${provider.model || ''}" class="form-input" placeholder="Enter model name">
                </div>
              ` : ''}
              
              ${provider.hasEndpoint ? html`
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Endpoint URL</label>
                  <input type="url" name="endpoint" value="${provider.endpoint || ''}" class="form-input" placeholder="Enter endpoint URL">
                </div>
              ` : ''}
            </div>
            
            <div class="flex justify-between">
              <button 
                type="button" 
                hx-post="/settings/ai-providers/${provider.id}/test"
                hx-target="#notification-area"
                hx-swap="innerHTML"
                class="btn-secondary">
                Test Connection
              </button>
              <button type="submit" class="btn-primary">
                Save Configuration
              </button>
            </div>
          </form>
        </div>
      `).join('')}
    </div>
  </div>
`;

const renderIntegrationsSettings = (integrations: any) => html`
  <div class="p-6">
    <div class="space-y-6">
      ${integrations.map(integration => html`
        <div class="border border-gray-200 rounded-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-${integration.color}-100 rounded-lg flex items-center justify-center">
                <i class="${integration.icon} text-${integration.color}-600"></i>
              </div>
              <div>
                <h3 class="text-lg font-medium text-gray-900">${integration.name}</h3>
                <p class="text-sm text-gray-500">${integration.description}</p>
              </div>
            </div>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${integration.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
              ${integration.enabled ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          
          <form hx-post="/settings/integrations/${integration.id}" hx-target="#notification-area" hx-swap="innerHTML" class="space-y-4">
            <div>
              <label class="flex items-center">
                <input type="checkbox" name="enabled" ${integration.enabled ? 'checked' : ''} class="form-checkbox">
                <span class="ml-2 text-sm text-gray-700">Enable ${integration.name} integration</span>
              </label>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${integration.fields.map(field => html`
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">${field.label}</label>
                  <input type="${field.type}" name="${field.name}" value="${field.value || ''}" class="form-input" placeholder="${field.placeholder}">
                </div>
              `).join('')}
            </div>
            
            <div class="flex justify-end">
              <button type="submit" class="btn-primary">
                Save Integration
              </button>
            </div>
          </form>
        </div>
      `).join('')}
    </div>
  </div>
`;

const renderNotificationSettings = (settings: any) => html`
  <div class="p-6">
    <form hx-post="/settings/notifications" hx-target="#notification-area" hx-swap="innerHTML" class="space-y-6">
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-4">Email Notifications</h3>
        
        <div class="space-y-3">
          <label class="flex items-center">
            <input type="checkbox" name="emailRiskAlerts" ${settings.emailRiskAlerts ? 'checked' : ''} class="form-checkbox">
            <span class="ml-2 text-sm text-gray-700">New risk alerts</span>
          </label>
          <label class="flex items-center">
            <input type="checkbox" name="emailIncidents" ${settings.emailIncidents ? 'checked' : ''} class="form-checkbox">
            <span class="ml-2 text-sm text-gray-700">Security incidents</span>
          </label>
          <label class="flex items-center">
            <input type="checkbox" name="emailCompliance" ${settings.emailCompliance ? 'checked' : ''} class="form-checkbox">
            <span class="ml-2 text-sm text-gray-700">Compliance updates</span>
          </label>
          <label class="flex items-center">
            <input type="checkbox" name="emailReports" ${settings.emailReports ? 'checked' : ''} class="form-checkbox">
            <span class="ml-2 text-sm text-gray-700">Weekly reports</span>
          </label>
        </div>
      </div>
      
      <div>
        <h3 class="text-lg font-medium text-gray-900 mb-4">In-App Notifications</h3>
        
        <div class="space-y-3">
          <label class="flex items-center">
            <input type="checkbox" name="inAppRiskAlerts" ${settings.inAppRiskAlerts ? 'checked' : ''} class="form-checkbox">
            <span class="ml-2 text-sm text-gray-700">Risk alerts</span>
          </label>
          <label class="flex items-center">
            <input type="checkbox" name="inAppTaskUpdates" ${settings.inAppTaskUpdates ? 'checked' : ''} class="form-checkbox">
            <span class="ml-2 text-sm text-gray-700">Task updates</span>
          </label>
          <label class="flex items-center">
            <input type="checkbox" name="inAppSystemUpdates" ${settings.inAppSystemUpdates ? 'checked' : ''} class="form-checkbox">
            <span class="ml-2 text-sm text-gray-700">System updates</span>
          </label>
        </div>
      </div>
      
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">Notification Frequency</label>
        <select name="notificationFrequency" class="form-select">
          <option value="immediate" ${settings.notificationFrequency === 'immediate' ? 'selected' : ''}>Immediate</option>
          <option value="hourly" ${settings.notificationFrequency === 'hourly' ? 'selected' : ''}>Hourly digest</option>
          <option value="daily" ${settings.notificationFrequency === 'daily' ? 'selected' : ''}>Daily digest</option>
          <option value="weekly" ${settings.notificationFrequency === 'weekly' ? 'selected' : ''}>Weekly digest</option>
        </select>
      </div>
      
      <div class="flex justify-end">
        <button type="submit" class="btn-primary">
          Save Notification Settings
        </button>
      </div>
    </form>
  </div>
`;

// Data functions (mock implementations)
async function getGeneralSettings() {
  return {
    organizationName: 'ARIA5 Corporation',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    language: 'en',
    theme: 'light'
  };
}

async function getSecuritySettings() {
  return {
    twoFactorAuth: false,
    sessionTimeout: 60,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
    samlEnabled: false,
    samlIdpUrl: '',
    samlEntityId: '',
    samlCertificate: ''
  };
}

async function getAIProviders() {
  return [
    {
      id: 'openai',
      name: 'OpenAI',
      description: 'GPT-4 and GPT-3.5 models for analysis and recommendations',
      icon: 'fas fa-brain',
      color: 'green',
      enabled: false,
      apiKey: '',
      hasModel: true,
      model: 'gpt-4',
      hasEndpoint: false
    },
    {
      id: 'anthropic',
      name: 'Anthropic Claude',
      description: 'Claude 3 models for advanced reasoning and analysis',
      icon: 'fas fa-robot',
      color: 'orange',
      enabled: false,
      apiKey: '',
      hasModel: true,
      model: 'claude-3-sonnet-20240229',
      hasEndpoint: false
    },
    {
      id: 'google',
      name: 'Google Gemini',
      description: 'Gemini models for multimodal AI capabilities',
      icon: 'fas fa-google',
      color: 'blue',
      enabled: false,
      apiKey: '',
      hasModel: true,
      model: 'gemini-pro',
      hasEndpoint: false
    },
    {
      id: 'azure',
      name: 'Azure OpenAI',
      description: 'Enterprise OpenAI models via Microsoft Azure',
      icon: 'fas fa-cloud',
      color: 'blue',
      enabled: false,
      apiKey: '',
      hasModel: true,
      model: 'gpt-4',
      hasEndpoint: true,
      endpoint: ''
    }
  ];
}

async function getIntegrations() {
  return [
    {
      id: 'microsoft-defender',
      name: 'Microsoft Defender',
      description: 'Sync security alerts and asset information',
      icon: 'fas fa-shield-alt',
      color: 'blue',
      enabled: false,
      fields: [
        { name: 'tenantId', label: 'Tenant ID', type: 'text', placeholder: 'Enter tenant ID', value: '' },
        { name: 'clientId', label: 'Client ID', type: 'text', placeholder: 'Enter client ID', value: '' },
        { name: 'clientSecret', label: 'Client Secret', type: 'password', placeholder: 'Enter client secret', value: '' }
      ]
    },
    {
      id: 'splunk',
      name: 'Splunk',
      description: 'Import security events and log data',
      icon: 'fas fa-search',
      color: 'green',
      enabled: false,
      fields: [
        { name: 'host', label: 'Splunk Host', type: 'url', placeholder: 'https://splunk.company.com', value: '' },
        { name: 'token', label: 'API Token', type: 'password', placeholder: 'Enter API token', value: '' },
        { name: 'index', label: 'Index Name', type: 'text', placeholder: 'security', value: '' }
      ]
    },
    {
      id: 'jira',
      name: 'Jira',
      description: 'Create and sync incident tickets',
      icon: 'fas fa-ticket-alt',
      color: 'blue',
      enabled: false,
      fields: [
        { name: 'host', label: 'Jira Host', type: 'url', placeholder: 'https://company.atlassian.net', value: '' },
        { name: 'email', label: 'Email', type: 'email', placeholder: 'Enter email', value: '' },
        { name: 'apiToken', label: 'API Token', type: 'password', placeholder: 'Enter API token', value: '' },
        { name: 'project', label: 'Project Key', type: 'text', placeholder: 'SEC', value: '' }
      ]
    }
  ];
}

async function getNotificationSettings() {
  return {
    emailRiskAlerts: true,
    emailIncidents: true,
    emailCompliance: false,
    emailReports: true,
    inAppRiskAlerts: true,
    inAppTaskUpdates: true,
    inAppSystemUpdates: false,
    notificationFrequency: 'immediate'
  };
}

async function updateGeneralSettings(data: any) {
  // Mock update
  return true;
}

async function updateSecuritySettings(data: any) {
  // Mock update
  return true;
}

async function updateAIProviderConfig(provider: string, data: any) {
  // Mock update
  return true;
}

async function testAIProviderConnection(provider: string) {
  // Mock test
  return { responseTime: Math.floor(Math.random() * 500) + 100 };
}

async function updateIntegrationConfig(integration: string, data: any) {
  // Mock update
  return true;
}

async function updateNotificationSettings(data: any) {
  // Mock update
  return true;
}