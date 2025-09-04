import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth, requireAdmin } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import type { CloudflareBindings } from '../types';

export function createAdminRoutesARIA5() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication and admin middleware
  app.use('*', requireAuth);
  app.use('*', requireAdmin);
  
  // Main admin dashboard
  app.get('/', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Admin Dashboard',
        user,
        content: renderAdminDashboard()
      })
    );
  });

  // AI Providers Management
  app.get('/ai-providers', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'AI Providers',
        user,
        content: renderAIProvidersPage()
      })
    );
  });

  // AI Provider Configuration Modal
  app.get('/ai-providers/:provider/config', async (c) => {
    const provider = c.req.param('provider');
    return c.html(renderAIProviderConfigModal(provider));
  });

  // Test AI Provider Connection
  app.post('/ai-providers/:provider/test', async (c) => {
    const provider = c.req.param('provider');
    const formData = await c.req.parseBody();
    
    // Mock test - in real implementation, test actual API connection
    const success = Math.random() > 0.3; // 70% success rate for demo
    
    return c.html(html`
      <div class="mt-3 p-3 rounded-lg ${success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
        <div class="flex items-center">
          <i class="fas fa-${success ? 'check-circle text-green-500' : 'exclamation-circle text-red-500'} mr-2"></i>
          <span class="${success ? 'text-green-700' : 'text-red-700'} text-sm font-medium">
            ${success ? `${provider} connection successful!` : `Failed to connect to ${provider}. Please check your API key.`}
          </span>
        </div>
      </div>
    `);
  });

  // Save AI Provider Configuration
  app.post('/ai-providers/:provider/save', async (c) => {
    const provider = c.req.param('provider');
    const formData = await c.req.parseBody();
    
    // In real implementation, save to database/KV storage
    console.log(`Saving ${provider} config:`, formData);
    
    return c.html(html`
      <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-center">
          <i class="fas fa-check-circle text-green-500 mr-2"></i>
          <span class="text-green-700 font-medium">${provider} configuration saved successfully!</span>
        </div>
      </div>
      <script>
        setTimeout(() => {
          document.getElementById('modal-container').innerHTML = '';
          htmx.ajax('GET', '/admin/ai-providers', '#main-content');
        }, 2000);
      </script>
    `);
  });

  // RAG & Knowledge Management
  app.get('/knowledge', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'RAG & Knowledge Management',
        user,
        content: renderKnowledgeManagementPage()
      })
    );
  });

  // Knowledge Base Upload
  app.post('/knowledge/upload', async (c) => {
    const formData = await c.req.parseBody();
    
    // Mock upload processing
    return c.html(html`
      <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div class="flex items-center">
          <i class="fas fa-spinner fa-spin text-blue-500 mr-2"></i>
          <span class="text-blue-700 font-medium">Processing document and building vector embeddings...</span>
        </div>
      </div>
      <script>
        setTimeout(() => {
          document.getElementById('upload-result').innerHTML = \`
            <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div class="flex items-center">
                <i class="fas fa-check-circle text-green-500 mr-2"></i>
                <span class="text-green-700 font-medium">Document processed successfully! Added to knowledge base.</span>
              </div>
            </div>
          \`;
          htmx.ajax('GET', '/admin/knowledge/list', '#knowledge-list');
        }, 3000);
      </script>
    `);
  });

  // Knowledge Base List
  app.get('/knowledge/list', async (c) => {
    return c.html(renderKnowledgeBaseList());
  });

  // Test RAG Query
  app.post('/knowledge/test-query', async (c) => {
    const formData = await c.req.parseBody();
    const query = formData.query as string;
    
    // Mock RAG response
    const mockResponse = `Based on the knowledge base, here are the relevant findings for "${query}":\n\n1. Security Policy Document (Relevance: 95%)\n2. Risk Assessment Framework (Relevance: 87%)\n3. Compliance Guidelines (Relevance: 82%)\n\nKey insights: The documents indicate that ${query.toLowerCase()} should be handled according to established security protocols and risk management procedures.`;
    
    return c.html(html`
      <div class="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 class="font-medium text-blue-900 mb-2">RAG Query Results:</h4>
        <div class="text-sm text-blue-800 whitespace-pre-wrap">${mockResponse}</div>
      </div>
    `);
  });

  // Integrations Management
  app.get('/integrations', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Integrations',
        user,
        content: renderIntegrationsPage()
      })
    );
  });

  // Integration Configuration
  app.get('/integrations/:integration/config', async (c) => {
    const integration = c.req.param('integration');
    return c.html(renderIntegrationConfigModal(integration));
  });

  // Test Integration Connection
  app.post('/integrations/:integration/test', async (c) => {
    const integration = c.req.param('integration');
    const formData = await c.req.parseBody();
    
    // Mock test
    const success = Math.random() > 0.2; // 80% success rate for demo
    
    return c.html(html`
      <div class="mt-3 p-3 rounded-lg ${success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
        <div class="flex items-center">
          <i class="fas fa-${success ? 'check-circle text-green-500' : 'exclamation-circle text-red-500'} mr-2"></i>
          <span class="${success ? 'text-green-700' : 'text-red-700'} text-sm font-medium">
            ${success ? `${integration} integration test successful!` : `Failed to connect to ${integration}. Please verify credentials.`}
          </span>
        </div>
      </div>
    `);
  });

  // System Settings
  app.get('/settings', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'System Settings',
        user,
        content: renderSystemSettingsPage()
      })
    );
  });

  // Save System Settings
  app.post('/settings/save', async (c) => {
    const formData = await c.req.parseBody();
    
    console.log('Saving system settings:', formData);
    
    return c.html(html`
      <div class="fixed top-4 right-4 z-50 p-4 bg-green-50 border border-green-200 rounded-lg shadow-lg">
        <div class="flex items-center">
          <i class="fas fa-check-circle text-green-500 mr-2"></i>
          <span class="text-green-700 font-medium">System settings saved successfully!</span>
        </div>
      </div>
      <script>
        setTimeout(() => {
          document.querySelector('.fixed.top-4').remove();
        }, 3000);
      </script>
    `);
  });

  // Update General Settings
  app.post('/settings/general', async (c) => {
    const formData = await c.req.parseBody();
    
    console.log('Updating general settings:', formData);
    
    return c.html(html`
      <div id="general-success" class="p-3 mb-4 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-center">
          <i class="fas fa-check-circle text-green-500 mr-2"></i>
          <span class="text-green-700 text-sm">General settings updated successfully!</span>
        </div>
      </div>
      <script>
        setTimeout(() => {
          const element = document.getElementById('general-success');
          if (element) element.remove();
        }, 3000);
      </script>
    `);
  });

  // Update Security Settings
  app.post('/settings/security', async (c) => {
    const formData = await c.req.parseBody();
    
    console.log('Updating security settings:', formData);
    
    return c.html(html`
      <div id="security-success" class="p-3 mb-4 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-center">
          <i class="fas fa-shield-alt text-green-500 mr-2"></i>
          <span class="text-green-700 text-sm">Security settings updated successfully!</span>
        </div>
      </div>
      <script>
        setTimeout(() => {
          const element = document.getElementById('security-success');
          if (element) element.remove();
        }, 3000);
      </script>
    `);
  });

  // Update Notification Settings
  app.post('/settings/notifications', async (c) => {
    const formData = await c.req.parseBody();
    
    console.log('Updating notification settings:', formData);
    
    return c.html(html`
      <div id="notification-success" class="p-3 mb-4 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-center">
          <i class="fas fa-bell text-green-500 mr-2"></i>
          <span class="text-green-700 text-sm">Notification settings updated successfully!</span>
        </div>
      </div>
      <script>
        setTimeout(() => {
          const element = document.getElementById('notification-success');
          if (element) element.remove();
        }, 3000);
      </script>
    `);
  });

  // User Management
  app.get('/users', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'User Management',
        user,
        content: renderUserManagementPage()
      })
    );
  });

  // User Creation Modal
  app.get('/users/create', async (c) => {
    return c.html(renderCreateUserModal());
  });

  // Create User
  app.post('/users/create', async (c) => {
    const formData = await c.req.parseBody();
    
    // Mock user creation
    console.log('Creating user:', formData);
    
    return c.html(html`
      <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-center">
          <i class="fas fa-check-circle text-green-500 mr-2"></i>
          <span class="text-green-700 font-medium">User "${formData.username}" created successfully!</span>
        </div>
      </div>
      <script>
        setTimeout(() => {
          document.getElementById('modal-container').innerHTML = '';
          htmx.ajax('GET', '/admin/users/table', '#users-table');
        }, 2000);
      </script>
    `);
  });

  // Users Table
  app.get('/users/table', async (c) => {
    return c.html(renderUsersTable());
  });

  // Organizations Management
  app.get('/organizations', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Organizations',
        user,
        content: renderOrganizationsPage()
      })
    );
  });

  // SAML Configuration
  app.get('/saml', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'SAML Authentication',
        user,
        content: renderSAMLConfigPage()
      })
    );
  });

  // Save SAML Configuration
  app.post('/saml/save', async (c) => {
    const formData = await c.req.parseBody();
    
    console.log('Saving SAML config:', formData);
    
    return c.html(html`
      <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div class="flex items-center">
          <i class="fas fa-check-circle text-green-500 mr-2"></i>
          <span class="text-green-700 font-medium">SAML configuration saved successfully!</span>
        </div>
      </div>
    `);
  });

  return app;
}

// Main Admin Dashboard
const renderAdminDashboard = () => html`
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p class="mt-1 text-sm text-gray-600">Comprehensive system administration and configuration</p>
          </div>
          <div class="flex space-x-3">
            <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center">
              <i class="fas fa-download mr-2"></i>System Report
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Admin Navigation Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        
        <!-- AI Providers Card -->
        <a href="/admin/ai-providers" class="group bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div class="flex items-center justify-between mb-4">
            <i class="fas fa-robot text-3xl opacity-80"></i>
            <span class="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs font-medium">4 Providers</span>
          </div>
          <h3 class="text-xl font-bold mb-2">AI Providers</h3>
          <p class="text-purple-100 text-sm">Configure OpenAI, Claude, Gemini, and custom LLM integrations</p>
          <div class="mt-4 flex items-center text-sm">
            <span>Manage AI Services</span>
            <i class="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
          </div>
        </a>

        <!-- RAG & Knowledge Card -->
        <a href="/admin/knowledge" class="group bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div class="flex items-center justify-between mb-4">
            <i class="fas fa-brain text-3xl opacity-80"></i>
            <span class="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs font-medium">47 Docs</span>
          </div>
          <h3 class="text-xl font-bold mb-2">RAG & Knowledge</h3>
          <p class="text-emerald-100 text-sm">Manage knowledge base, vector embeddings, and RAG capabilities</p>
          <div class="mt-4 flex items-center text-sm">
            <span>Knowledge Management</span>
            <i class="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
          </div>
        </a>

        <!-- Integrations Card -->
        <a href="/admin/integrations" class="group bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div class="flex items-center justify-between mb-4">
            <i class="fas fa-plug text-3xl opacity-80"></i>
            <span class="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs font-medium">8 Active</span>
          </div>
          <h3 class="text-xl font-bold mb-2">Integrations</h3>
          <p class="text-blue-100 text-sm">Connect with external services, APIs, and enterprise tools</p>
          <div class="mt-4 flex items-center text-sm">
            <span>Manage Integrations</span>
            <i class="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
          </div>
        </a>

        <!-- User Management Card -->
        <a href="/admin/users" class="group bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div class="flex items-center justify-between mb-4">
            <i class="fas fa-users text-3xl opacity-80"></i>
            <span class="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs font-medium">23 Users</span>
          </div>
          <h3 class="text-xl font-bold mb-2">User Management</h3>
          <p class="text-orange-100 text-sm">Manage users, roles, permissions, and access controls</p>
          <div class="mt-4 flex items-center text-sm">
            <span>Manage Users</span>
            <i class="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
          </div>
        </a>

        <!-- Organizations Card -->
        <a href="/admin/organizations" class="group bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div class="flex items-center justify-between mb-4">
            <i class="fas fa-building text-3xl opacity-80"></i>
            <span class="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs font-medium">3 Orgs</span>
          </div>
          <h3 class="text-xl font-bold mb-2">Organizations</h3>
          <p class="text-indigo-100 text-sm">Manage organizational structure, departments, and hierarchies</p>
          <div class="mt-4 flex items-center text-sm">
            <span>Manage Organizations</span>
            <i class="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
          </div>
        </a>

        <!-- System Settings Card -->
        <a href="/admin/settings" class="group bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
          <div class="flex items-center justify-between mb-4">
            <i class="fas fa-cogs text-3xl opacity-80"></i>
            <span class="bg-white bg-opacity-20 px-2 py-1 rounded-full text-xs font-medium">Config</span>
          </div>
          <h3 class="text-xl font-bold mb-2">System Settings</h3>
          <p class="text-gray-100 text-sm">Configure system-wide settings, security, and preferences</p>
          <div class="mt-4 flex items-center text-sm">
            <span>System Configuration</span>
            <i class="fas fa-arrow-right ml-2 group-hover:translate-x-1 transition-transform"></i>
          </div>
        </a>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button hx-get="/admin/users/create" 
                  hx-target="#modal-container"
                  class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <i class="fas fa-user-plus text-blue-500 mr-3"></i>
            <span class="text-sm font-medium">Add User</span>
          </button>
          <button class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <i class="fas fa-key text-purple-500 mr-3"></i>
            <span class="text-sm font-medium">Reset API Keys</span>
          </button>
          <button class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <i class="fas fa-shield-alt text-green-500 mr-3"></i>
            <span class="text-sm font-medium">Security Audit</span>
          </button>
          <button class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
            <i class="fas fa-database text-orange-500 mr-3"></i>
            <span class="text-sm font-medium">Backup System</span>
          </button>
        </div>
      </div>
    </div>
  </div>
`;

// AI Providers Management Page
const renderAIProvidersPage = () => html`
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">AI Providers</h1>
            <p class="mt-1 text-sm text-gray-600">Configure and manage AI service integrations</p>
          </div>
          <div class="flex space-x-3">
            <button class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg">
              <i class="fas fa-download mr-2"></i>Export Config
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- AI Providers Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        
        <!-- OpenAI -->
        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center">
              <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                <i class="fas fa-robot text-green-600 text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">OpenAI</h3>
                <p class="text-sm text-gray-600">GPT-4, GPT-3.5, Embeddings</p>
              </div>
            </div>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Connected
            </span>
          </div>
          
          <div class="space-y-3 mb-4">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Models Available:</span>
              <span class="font-medium">GPT-4, GPT-3.5-Turbo</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Last Test:</span>
              <span class="font-medium text-green-600">2 minutes ago ✓</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Usage This Month:</span>
              <span class="font-medium">$47.82</span>
            </div>
          </div>
          
          <div class="flex space-x-2">
            <button hx-get="/admin/ai-providers/openai/config"
                    hx-target="#modal-container"
                    class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm">
              Configure
            </button>
            <button hx-post="/admin/ai-providers/openai/test"
                    hx-target="#openai-test-result"
                    class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm">
              Test
            </button>
          </div>
          <div id="openai-test-result"></div>
        </div>

        <!-- Anthropic Claude -->
        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center">
              <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                <i class="fas fa-brain text-orange-600 text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">Anthropic Claude</h3>
                <p class="text-sm text-gray-600">Claude-3, Claude-2</p>
              </div>
            </div>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
              Connected
            </span>
          </div>
          
          <div class="space-y-3 mb-4">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Models Available:</span>
              <span class="font-medium">Claude-3-Opus, Claude-3-Sonnet</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Last Test:</span>
              <span class="font-medium text-green-600">5 minutes ago ✓</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Usage This Month:</span>
              <span class="font-medium">$23.45</span>
            </div>
          </div>
          
          <div class="flex space-x-2">
            <button hx-get="/admin/ai-providers/claude/config"
                    hx-target="#modal-container"
                    class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm">
              Configure
            </button>
            <button hx-post="/admin/ai-providers/claude/test"
                    hx-target="#claude-test-result"
                    class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm">
              Test
            </button>
          </div>
          <div id="claude-test-result"></div>
        </div>

        <!-- Google Gemini -->
        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center">
              <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <i class="fas fa-google text-blue-600 text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">Google Gemini</h3>
                <p class="text-sm text-gray-600">Gemini Pro, Gemini Ultra</p>
              </div>
            </div>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Not Configured
            </span>
          </div>
          
          <div class="space-y-3 mb-4">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Models Available:</span>
              <span class="font-medium text-gray-400">Configure to view</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Last Test:</span>
              <span class="font-medium text-gray-400">Never</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Usage This Month:</span>
              <span class="font-medium">$0.00</span>
            </div>
          </div>
          
          <div class="flex space-x-2">
            <button hx-get="/admin/ai-providers/gemini/config"
                    hx-target="#modal-container"
                    class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm">
              Configure
            </button>
            <button hx-post="/admin/ai-providers/gemini/test"
                    hx-target="#gemini-test-result"
                    class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm">
              Test
            </button>
          </div>
          <div id="gemini-test-result"></div>
        </div>

        <!-- Custom API -->
        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
          <div class="flex justify-between items-start mb-4">
            <div class="flex items-center">
              <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                <i class="fas fa-code text-purple-600 text-xl"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">Custom API</h3>
                <p class="text-sm text-gray-600">Custom LLM endpoint</p>
              </div>
            </div>
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Not Configured
            </span>
          </div>
          
          <div class="space-y-3 mb-4">
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Endpoint:</span>
              <span class="font-medium text-gray-400">Not set</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Last Test:</span>
              <span class="font-medium text-gray-400">Never</span>
            </div>
            <div class="flex justify-between text-sm">
              <span class="text-gray-600">Status:</span>
              <span class="font-medium text-gray-400">Inactive</span>
            </div>
          </div>
          
          <div class="flex space-x-2">
            <button hx-get="/admin/ai-providers/custom/config"
                    hx-target="#modal-container"
                    class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm">
              Configure
            </button>
            <button hx-post="/admin/ai-providers/custom/test"
                    hx-target="#custom-test-result"
                    class="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded text-sm">
              Test
            </button>
          </div>
          <div id="custom-test-result"></div>
        </div>
      </div>

      <!-- Global AI Settings -->
      <div class="mt-8 bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Global AI Settings</h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Default Provider</label>
            <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>OpenAI (GPT-4)</option>
              <option>Anthropic (Claude-3)</option>
              <option>Google (Gemini Pro)</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Request Timeout (seconds)</label>
            <input type="number" value="30" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Max Tokens per Request</label>
            <input type="number" value="4000" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
        <div class="mt-4">
          <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Save Global Settings
          </button>
        </div>
      </div>
    </div>
  </div>
`;

// AI Provider Configuration Modal
const renderAIProviderConfigModal = (provider: string) => html`
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4">
      <div class="flex justify-between items-center p-6 border-b">
        <h3 class="text-lg font-semibold text-gray-900">Configure ${provider.charAt(0).toUpperCase() + provider.slice(1)}</h3>
        <button onclick="document.getElementById('modal-container').innerHTML=''" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <form hx-post="/admin/ai-providers/${provider}/save" hx-target="#save-result">
        <div class="p-6 space-y-4">
          ${provider === 'openai' ? html`
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">API Key</label>
              <input type="password" name="api_key" placeholder="sk-..." 
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Organization ID (Optional)</label>
              <input type="text" name="org_id" placeholder="org-..."
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Default Model</label>
              <select name="default_model" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              </select>
            </div>
          ` : provider === 'claude' ? html`
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">API Key</label>
              <input type="password" name="api_key" placeholder="sk-ant-..."
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Default Model</label>
              <select name="default_model" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="claude-3-opus-20240229">Claude-3 Opus</option>
                <option value="claude-3-sonnet-20240229">Claude-3 Sonnet</option>
                <option value="claude-3-haiku-20240307">Claude-3 Haiku</option>
              </select>
            </div>
          ` : provider === 'gemini' ? html`
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">API Key</label>
              <input type="password" name="api_key" placeholder="AIza..."
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Default Model</label>
              <select name="default_model" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="gemini-pro">Gemini Pro</option>
                <option value="gemini-pro-vision">Gemini Pro Vision</option>
                <option value="gemini-ultra">Gemini Ultra</option>
              </select>
            </div>
          ` : html`
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">API Endpoint</label>
              <input type="url" name="endpoint" placeholder="https://api.example.com/v1/chat/completions"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">API Key</label>
              <input type="password" name="api_key" placeholder="Your API key"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Model Name</label>
              <input type="text" name="model_name" placeholder="llama-2-70b-chat"
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          `}
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Temperature</label>
            <input type="number" name="temperature" value="0.7" min="0" max="2" step="0.1"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Max Tokens</label>
            <input type="number" name="max_tokens" value="4000" min="1" max="8000"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
        </div>
        
        <div class="flex justify-between items-center p-6 border-t bg-gray-50">
          <button type="button" 
                  hx-post="/admin/ai-providers/${provider}/test"
                  hx-include="closest form"
                  hx-target="#test-result"
                  class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
            Test Connection
          </button>
          <div class="flex space-x-3">
            <button type="button" onclick="document.getElementById('modal-container').innerHTML=''"
                    class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              Save Configuration
            </button>
          </div>
        </div>
        
        <div id="test-result"></div>
        <div id="save-result"></div>
      </form>
    </div>
  </div>
`;

// Knowledge Management Page
const renderKnowledgeManagementPage = () => html`
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">RAG & Knowledge Management</h1>
            <p class="mt-1 text-sm text-gray-600">Manage knowledge base, vector embeddings, and RAG capabilities</p>
          </div>
          <div class="flex space-x-3">
            <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
              <i class="fas fa-brain mr-2"></i>Rebuild Embeddings
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Upload Section -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Upload Documents</h3>
            <form hx-post="/admin/knowledge/upload" hx-target="#upload-result" hx-encoding="multipart/form-data">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Document File</label>
                  <div class="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input type="file" name="document" accept=".pdf,.txt,.doc,.docx,.md" 
                           class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                    <p class="mt-2 text-xs text-gray-500">PDF, TXT, DOC, DOCX, MD files up to 10MB</p>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Document Title</label>
                  <input type="text" name="title" placeholder="Security Policy v2.0" 
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select name="category" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="policy">Policy</option>
                    <option value="procedure">Procedure</option>
                    <option value="standard">Standard</option>
                    <option value="guideline">Guideline</option>
                    <option value="framework">Framework</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                  <input type="text" name="tags" placeholder="security, compliance, risk" 
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                  <i class="fas fa-upload mr-2"></i>Upload & Process
                </button>
              </div>
            </form>
            <div id="upload-result" class="mt-4"></div>
          </div>

          <!-- RAG Testing -->
          <div class="bg-white rounded-lg shadow p-6 mt-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Test RAG Query</h3>
            <form hx-post="/admin/knowledge/test-query" hx-target="#query-result">
              <div class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Query</label>
                  <textarea name="query" rows="3" placeholder="What are the security requirements for data handling?"
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                </div>
                <button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                  <i class="fas fa-search mr-2"></i>Test Query
                </button>
              </div>
            </form>
            <div id="query-result"></div>
          </div>
        </div>

        <!-- Knowledge Base List -->
        <div class="lg:col-span-2">
          <div class="bg-white rounded-lg shadow">
            <div class="p-6 border-b border-gray-200">
              <div class="flex justify-between items-center">
                <h3 class="text-lg font-medium text-gray-900">Knowledge Base</h3>
                <div class="flex items-center space-x-4">
                  <div class="text-sm text-gray-600">47 documents • 2.3M tokens</div>
                  <button class="text-blue-600 hover:text-blue-700">
                    <i class="fas fa-sync-alt mr-1"></i>Refresh
                  </button>
                </div>
              </div>
            </div>
            <div id="knowledge-list" hx-get="/admin/knowledge/list" hx-trigger="load">
              <!-- Knowledge base list will be loaded here -->
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

// Knowledge Base List
const renderKnowledgeBaseList = () => html`
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Embeddings</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <i class="fas fa-file-pdf text-red-500 mr-3"></i>
              <div>
                <div class="text-sm font-medium text-gray-900">Security Policy v2.0</div>
                <div class="text-sm text-gray-500">security, compliance, policy</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">Policy</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2.4 MB</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                <div class="bg-green-500 h-2 rounded-full" style="width: 100%"></div>
              </div>
              <span class="text-xs text-green-600">Ready</span>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2 hours ago</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <button class="text-blue-600 hover:text-blue-900 mr-3">View</button>
            <button class="text-green-600 hover:text-green-900 mr-3">Re-process</button>
            <button class="text-red-600 hover:text-red-900">Delete</button>
          </td>
        </tr>
        <tr>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <i class="fas fa-file-alt text-blue-500 mr-3"></i>
              <div>
                <div class="text-sm font-medium text-gray-900">Risk Management Framework</div>
                <div class="text-sm text-gray-500">risk, framework, assessment</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Framework</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1.8 MB</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                <div class="bg-yellow-500 h-2 rounded-full" style="width: 60%"></div>
              </div>
              <span class="text-xs text-yellow-600">Processing</span>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">5 hours ago</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <button class="text-blue-600 hover:text-blue-900 mr-3">View</button>
            <button class="text-green-600 hover:text-green-900 mr-3">Re-process</button>
            <button class="text-red-600 hover:text-red-900">Delete</button>
          </td>
        </tr>
        <tr>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <i class="fas fa-file-word text-blue-600 mr-3"></i>
              <div>
                <div class="text-sm font-medium text-gray-900">Compliance Guidelines</div>
                <div class="text-sm text-gray-500">compliance, guidelines, standards</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Guideline</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">950 KB</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                <div class="bg-green-500 h-2 rounded-full" style="width: 100%"></div>
              </div>
              <span class="text-xs text-green-600">Ready</span>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1 day ago</td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <button class="text-blue-600 hover:text-blue-900 mr-3">View</button>
            <button class="text-green-600 hover:text-green-900 mr-3">Re-process</button>
            <button class="text-red-600 hover:text-red-900">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
`;

// Integrations Page
const renderIntegrationsPage = () => html`
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Integrations</h1>
            <p class="mt-1 text-sm text-gray-600">Connect with external services and enterprise tools</p>
          </div>
          <div class="flex space-x-3">
            <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              <i class="fas fa-plus mr-2"></i>Add Integration
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Integration Categories -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        <!-- SIEM & Security Tools -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i class="fas fa-shield-alt text-red-500 mr-2"></i>
            SIEM & Security Tools
          </h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 border rounded-lg">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-black rounded flex items-center justify-center mr-3">
                  <i class="fas fa-search text-white text-sm"></i>
                </div>
                <div>
                  <div class="text-sm font-medium">Splunk</div>
                  <div class="text-xs text-gray-500">SIEM Platform</div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <span class="w-3 h-3 bg-green-500 rounded-full"></span>
                <button hx-get="/admin/integrations/splunk/config" hx-target="#modal-container"
                        class="text-blue-600 hover:text-blue-700 text-sm">Configure</button>
              </div>
            </div>
            
            <div class="flex items-center justify-between p-3 border rounded-lg">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-3">
                  <i class="fas fa-eye text-white text-sm"></i>
                </div>
                <div>
                  <div class="text-sm font-medium">QRadar</div>
                  <div class="text-xs text-gray-500">IBM Security</div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <span class="w-3 h-3 bg-gray-400 rounded-full"></span>
                <button hx-get="/admin/integrations/qradar/config" hx-target="#modal-container"
                        class="text-blue-600 hover:text-blue-700 text-sm">Configure</button>
              </div>
            </div>
            
            <div class="flex items-center justify-between p-3 border rounded-lg">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-orange-500 rounded flex items-center justify-center mr-3">
                  <i class="fas fa-fire text-white text-sm"></i>
                </div>
                <div>
                  <div class="text-sm font-medium">Chronicle</div>
                  <div class="text-xs text-gray-500">Google Security</div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <span class="w-3 h-3 bg-yellow-500 rounded-full"></span>
                <button hx-get="/admin/integrations/chronicle/config" hx-target="#modal-container"
                        class="text-blue-600 hover:text-blue-700 text-sm">Configure</button>
              </div>
            </div>
          </div>
        </div>

        <!-- GRC & Compliance -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i class="fas fa-clipboard-check text-green-500 mr-2"></i>
            GRC & Compliance
          </h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 border rounded-lg">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-purple-600 rounded flex items-center justify-center mr-3">
                  <i class="fas fa-check-circle text-white text-sm"></i>
                </div>
                <div>
                  <div class="text-sm font-medium">ServiceNow GRC</div>
                  <div class="text-xs text-gray-500">GRC Platform</div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <span class="w-3 h-3 bg-green-500 rounded-full"></span>
                <button hx-get="/admin/integrations/servicenow/config" hx-target="#modal-container"
                        class="text-blue-600 hover:text-blue-700 text-sm">Configure</button>
              </div>
            </div>
            
            <div class="flex items-center justify-between p-3 border rounded-lg">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-red-600 rounded flex items-center justify-center mr-3">
                  <i class="fas fa-balance-scale text-white text-sm"></i>
                </div>
                <div>
                  <div class="text-sm font-medium">Archer</div>
                  <div class="text-xs text-gray-500">RSA Governance</div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <span class="w-3 h-3 bg-gray-400 rounded-full"></span>
                <button hx-get="/admin/integrations/archer/config" hx-target="#modal-container"
                        class="text-blue-600 hover:text-blue-700 text-sm">Configure</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Cloud & Infrastructure -->
        <div class="bg-white rounded-lg shadow p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <i class="fas fa-cloud text-blue-500 mr-2"></i>
            Cloud & Infrastructure
          </h3>
          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 border rounded-lg">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-orange-400 rounded flex items-center justify-center mr-3">
                  <i class="fab fa-aws text-white text-sm"></i>
                </div>
                <div>
                  <div class="text-sm font-medium">AWS Security Hub</div>
                  <div class="text-xs text-gray-500">Cloud Security</div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <span class="w-3 h-3 bg-green-500 rounded-full"></span>
                <button hx-get="/admin/integrations/aws/config" hx-target="#modal-container"
                        class="text-blue-600 hover:text-blue-700 text-sm">Configure</button>
              </div>
            </div>
            
            <div class="flex items-center justify-between p-3 border rounded-lg">
              <div class="flex items-center">
                <div class="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-3">
                  <i class="fab fa-microsoft text-white text-sm"></i>
                </div>
                <div>
                  <div class="text-sm font-medium">Azure Sentinel</div>
                  <div class="text-xs text-gray-500">Cloud SIEM</div>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <span class="w-3 h-3 bg-green-500 rounded-full"></span>
                <button hx-get="/admin/integrations/azure/config" hx-target="#modal-container"
                        class="text-blue-600 hover:text-blue-700 text-sm">Configure</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Integration Activity -->
      <div class="mt-8 bg-white rounded-lg shadow">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">Recent Integration Activity</h3>
        </div>
        <div class="p-6">
          <div class="space-y-4">
            <div class="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div class="flex items-center">
                <i class="fas fa-check-circle text-green-500 mr-3"></i>
                <div>
                  <div class="text-sm font-medium text-gray-900">Splunk connection successful</div>
                  <div class="text-xs text-gray-500">2 minutes ago</div>
                </div>
              </div>
              <div class="text-sm text-green-600">Connected</div>
            </div>
            
            <div class="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div class="flex items-center">
                <i class="fas fa-sync fa-spin text-blue-500 mr-3"></i>
                <div>
                  <div class="text-sm font-medium text-gray-900">ServiceNow sync in progress</div>
                  <div class="text-xs text-gray-500">5 minutes ago</div>
                </div>
              </div>
              <div class="text-sm text-blue-600">Syncing</div>
            </div>
            
            <div class="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div class="flex items-center">
                <i class="fas fa-exclamation-triangle text-yellow-500 mr-3"></i>
                <div>
                  <div class="text-sm font-medium text-gray-900">AWS Security Hub rate limit exceeded</div>
                  <div class="text-xs text-gray-500">1 hour ago</div>
                </div>
              </div>
              <div class="text-sm text-yellow-600">Warning</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

// Integration Configuration Modal
const renderIntegrationConfigModal = (integration: string) => html`
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4">
      <div class="flex justify-between items-center p-6 border-b">
        <h3 class="text-lg font-semibold text-gray-900">Configure ${integration.charAt(0).toUpperCase() + integration.slice(1)}</h3>
        <button onclick="document.getElementById('modal-container').innerHTML=''" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <form hx-post="/admin/integrations/${integration}/save" hx-target="#save-result">
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Server URL</label>
            <input type="url" name="server_url" placeholder="https://your-${integration}-server.com"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input type="text" name="username" placeholder="service-account"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Password/API Key</label>
            <input type="password" name="password" placeholder="Enter password or API key"
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Sync Interval (minutes)</label>
            <select name="sync_interval" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="5">Every 5 minutes</option>
              <option value="15">Every 15 minutes</option>
              <option value="30">Every 30 minutes</option>
              <option value="60">Every hour</option>
            </select>
          </div>
          
          <div>
            <label class="flex items-center">
              <input type="checkbox" name="auto_sync" class="mr-2" checked>
              <span class="text-sm text-gray-700">Enable automatic synchronization</span>
            </label>
          </div>
        </div>
        
        <div class="flex justify-between items-center p-6 border-t bg-gray-50">
          <button type="button" 
                  hx-post="/admin/integrations/${integration}/test"
                  hx-include="closest form"
                  hx-target="#test-result"
                  class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
            Test Connection
          </button>
          <div class="flex space-x-3">
            <button type="button" onclick="document.getElementById('modal-container').innerHTML=''"
                    class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              Save Configuration
            </button>
          </div>
        </div>
        
        <div id="test-result"></div>
        <div id="save-result"></div>
      </form>
    </div>
  </div>
`;

// System Settings Page  
const renderSystemSettingsPage = () => html`
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">System Settings</h1>
            <p class="mt-1 text-sm text-gray-600">Configure system-wide settings and preferences</p>
          </div>
          <div class="flex space-x-3">
            <button hx-post="/admin/settings/save" 
                    hx-include="[name]"
                    hx-target="#success-message"
                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              <i class="fas fa-save mr-2"></i>Save All Settings
            </button>
          </div>
        </div>
      </div>
    </div>

    <div id="success-message"></div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        <!-- Settings Navigation -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Settings Categories</h3>
            <nav class="space-y-2">
              <button onclick="showTab('general')" id="general-tab" 
                      class="flex items-center w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">
                <i class="fas fa-cog mr-2"></i>General
              </button>
              <button onclick="showTab('security')" id="security-tab"
                      class="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                <i class="fas fa-shield-alt mr-2"></i>Security
              </button>
              <button onclick="showTab('notifications')" id="notifications-tab"
                      class="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                <i class="fas fa-bell mr-2"></i>Notifications
              </button>
              <button onclick="showTab('audit')" id="audit-tab"
                      class="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                <i class="fas fa-history mr-2"></i>Audit Logs
              </button>
              <button onclick="showTab('backup')" id="backup-tab"
                      class="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                <i class="fas fa-database mr-2"></i>Backup
              </button>
            </nav>
          </div>
        </div>

        <!-- Settings Content -->
        <div class="lg:col-span-3 space-y-6">
          
          <!-- General Settings Tab -->
          <div id="general-content" class="settings-tab bg-white rounded-lg shadow p-6">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium text-gray-900">General Settings</h3>
              <button hx-post="/admin/settings/general" 
                      hx-include="#general-form [name]"
                      hx-target="#general-message"
                      class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm">
                <i class="fas fa-save mr-1"></i>Save
              </button>
            </div>
            <div id="general-message"></div>
            <form id="general-form">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">System Name</label>
                  <input type="text" name="system_name" value="ARIA5 Security Platform" 
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Default Timezone</label>
                  <select name="timezone" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option selected>UTC</option>
                    <option>America/New_York</option>
                    <option>Europe/London</option>
                    <option>Asia/Tokyo</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                  <input type="number" name="session_timeout" value="60" min="15" max="480"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Default Language</label>
                  <select name="default_language" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option selected>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

          <!-- Security Settings Tab -->
          <div id="security-content" class="settings-tab bg-white rounded-lg shadow p-6" style="display:none">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium text-gray-900">Security Settings</h3>
              <button hx-post="/admin/settings/security" 
                      hx-include="#security-form [name]"
                      hx-target="#security-message"
                      class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm">
                <i class="fas fa-shield-alt mr-1"></i>Save
              </button>
            </div>
            <div id="security-message"></div>
            <form id="security-form">
              <div class="space-y-4">
                <div>
                  <label class="flex items-center">
                    <input type="checkbox" name="require_2fa" class="mr-2" checked>
                    <span class="text-sm font-medium">Require two-factor authentication</span>
                  </label>
                  <p class="mt-1 text-xs text-gray-500">Users must enable 2FA within 7 days of account creation</p>
                </div>
                <div>
                  <label class="flex items-center">
                    <input type="checkbox" name="force_password_complexity" class="mr-2" checked>
                    <span class="text-sm font-medium">Force password complexity requirements</span>
                  </label>
                  <p class="mt-1 text-xs text-gray-500">Minimum 8 characters, uppercase, lowercase, numbers, and symbols</p>
                </div>
                <div>
                  <label class="flex items-center">
                    <input type="checkbox" name="enable_ip_allowlist" class="mr-2">
                    <span class="text-sm font-medium">Enable IP allowlisting</span>
                  </label>
                  <p class="mt-1 text-xs text-gray-500">Only allow access from specified IP addresses</p>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Max Login Attempts</label>
                    <input type="number" name="max_login_attempts" value="5" min="1" max="10"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Account Lockout Duration (minutes)</label>
                    <input type="number" name="lockout_duration" value="15" min="5" max="60"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>
                </div>
              </div>
            </form>
          </div>

          <!-- Notifications Settings Tab -->
          <div id="notifications-content" class="settings-tab bg-white rounded-lg shadow p-6" style="display:none">
            <div class="flex justify-between items-center mb-4">
              <h3 class="text-lg font-medium text-gray-900">Notification Settings</h3>
              <button hx-post="/admin/settings/notifications" 
                      hx-include="#notifications-form [name]"
                      hx-target="#notifications-message"
                      class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm">
                <i class="fas fa-bell mr-1"></i>Save
              </button>
            </div>
            <div id="notifications-message"></div>
            <form id="notifications-form">
              <div class="space-y-4">
                <div class="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div class="text-sm font-medium">High-Risk Events</div>
                    <div class="text-xs text-gray-500">Critical security incidents and high-risk assessments</div>
                  </div>
                  <label class="flex items-center">
                    <input type="checkbox" name="notify_high_risk" class="mr-2" checked>
                    <span class="text-sm">Email</span>
                  </label>
                </div>
                <div class="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div class="text-sm font-medium">Failed Logins</div>
                    <div class="text-xs text-gray-500">Multiple failed login attempts</div>
                  </div>
                  <label class="flex items-center">
                    <input type="checkbox" name="notify_failed_logins" class="mr-2" checked>
                    <span class="text-sm">Email</span>
                  </label>
                </div>
                <div class="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div class="text-sm font-medium">System Updates</div>
                    <div class="text-xs text-gray-500">System maintenance and updates</div>
                  </div>
                  <label class="flex items-center">
                    <input type="checkbox" name="notify_system_updates" class="mr-2">
                    <span class="text-sm">Email</span>
                  </label>
                </div>
              </div>
            </form>
          </div>

          <!-- Audit Logs Tab -->
          <div id="audit-content" class="settings-tab bg-white rounded-lg shadow p-6" style="display:none">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Audit Log Settings</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Log Retention Period (days)</label>
                <input type="number" value="365" min="30" max="2555"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <div>
                <label class="flex items-center">
                  <input type="checkbox" class="mr-2" checked>
                  <span class="text-sm font-medium">Log user authentication events</span>
                </label>
              </div>
              <div>
                <label class="flex items-center">
                  <input type="checkbox" class="mr-2" checked>
                  <span class="text-sm font-medium">Log configuration changes</span>
                </label>
              </div>
              <div>
                <label class="flex items-center">
                  <input type="checkbox" class="mr-2" checked>
                  <span class="text-sm font-medium">Log data access events</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Backup Tab -->
          <div id="backup-content" class="settings-tab bg-white rounded-lg shadow p-6" style="display:none">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Backup Settings</h3>
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Backup Frequency</label>
                <select class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Daily</option>
                  <option>Weekly</option>
                  <option>Monthly</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Backup Retention (days)</label>
                <input type="number" value="30" min="7" max="365"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <div class="flex space-x-4">
                <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
                  <i class="fas fa-backup mr-2"></i>Create Backup Now
                </button>
                <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                  <i class="fas fa-download mr-2"></i>Download Latest
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <script>
      function showTab(tabName) {
        // Hide all tabs
        const tabs = document.querySelectorAll('.settings-tab');
        tabs.forEach(tab => tab.style.display = 'none');
        
        // Reset all tab buttons
        const tabButtons = document.querySelectorAll('[id$="-tab"]');
        tabButtons.forEach(button => {
          button.className = 'flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg';
        });
        
        // Show selected tab
        document.getElementById(tabName + '-content').style.display = 'block';
        
        // Activate selected tab button
        const activeTab = document.getElementById(tabName + '-tab');
        if (activeTab) {
          activeTab.className = 'flex items-center w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg';
        }
      }
    </script>
  </div>
`;

// User Management Page
const renderUserManagementPage = () => html`
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">User Management</h1>
            <p class="mt-1 text-sm text-gray-600">Manage users, roles, permissions, and access controls</p>
          </div>
          <div class="flex space-x-3">
            <button hx-get="/admin/users/create" hx-target="#modal-container"
                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              <i class="fas fa-plus mr-2"></i>Add User
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- User Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-users text-2xl text-blue-500"></i>
            </div>
            <div class="ml-4">
              <div class="text-sm font-medium text-gray-500">Total Users</div>
              <div class="text-2xl font-bold text-gray-900">23</div>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-user-check text-2xl text-green-500"></i>
            </div>
            <div class="ml-4">
              <div class="text-sm font-medium text-gray-500">Active Users</div>
              <div class="text-2xl font-bold text-gray-900">19</div>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-user-shield text-2xl text-purple-500"></i>
            </div>
            <div class="ml-4">
              <div class="text-sm font-medium text-gray-500">Admins</div>
              <div class="text-2xl font-bold text-gray-900">3</div>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-user-clock text-2xl text-yellow-500"></i>
            </div>
            <div class="ml-4">
              <div class="text-sm font-medium text-gray-500">Pending</div>
              <div class="text-2xl font-bold text-gray-900">1</div>
            </div>
          </div>
        </div>
      </div>

      <!-- User Table -->
      <div class="bg-white rounded-lg shadow">
        <div class="p-6 border-b border-gray-200">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-medium text-gray-900">All Users</h3>
            <div class="flex items-center space-x-4">
              <input type="search" placeholder="Search users..." 
                     class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <select class="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>All Roles</option>
                <option>Admin</option>
                <option>User</option>
                <option>Auditor</option>
              </select>
            </div>
          </div>
        </div>
        <div id="users-table" hx-get="/admin/users/table" hx-trigger="load">
          <!-- Users table will be loaded here -->
        </div>
      </div>
    </div>
  </div>
`;

// Users Table
const renderUsersTable = () => html`
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">2FA</th>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <tr>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <div class="flex-shrink-0 h-10 w-10">
                <img class="h-10 w-10 rounded-full" src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
              </div>
              <div class="ml-4">
                <div class="text-sm font-medium text-gray-900">John Doe</div>
                <div class="text-sm text-gray-500">john@example.com</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">Admin</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2 hours ago</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <i class="fas fa-check-circle text-green-500"></i>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <button class="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
            <button class="text-red-600 hover:text-red-900">Disable</button>
          </td>
        </tr>
        <tr>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <div class="flex-shrink-0 h-10 w-10">
                <img class="h-10 w-10 rounded-full" src="https://images.unsplash.com/photo-1494790108755-2616b612b786?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
              </div>
              <div class="ml-4">
                <div class="text-sm font-medium text-gray-900">Jane Smith</div>
                <div class="text-sm text-gray-500">jane@example.com</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">User</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Active</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">1 day ago</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <i class="fas fa-check-circle text-green-500"></i>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <button class="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
            <button class="text-red-600 hover:text-red-900">Disable</button>
          </td>
        </tr>
        <tr>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <div class="flex-shrink-0 h-10 w-10">
                <img class="h-10 w-10 rounded-full" src="https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="">
              </div>
              <div class="ml-4">
                <div class="text-sm font-medium text-gray-900">Mike Johnson</div>
                <div class="text-sm text-gray-500">mike@example.com</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">Auditor</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Never</td>
          <td class="px-6 py-4 whitespace-nowrap">
            <i class="fas fa-times-circle text-red-500"></i>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
            <button class="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
            <button class="text-green-600 hover:text-green-900 mr-3">Activate</button>
            <button class="text-red-600 hover:text-red-900">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
`;

// Create User Modal
const renderCreateUserModal = () => html`
  <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4">
      <div class="flex justify-between items-center p-6 border-b">
        <h3 class="text-lg font-semibold text-gray-900">Create New User</h3>
        <button onclick="document.getElementById('modal-container').innerHTML=''" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <form hx-post="/admin/users/create" hx-target="#create-result">
        <div class="p-6 space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">First Name</label>
              <input type="text" name="first_name" required 
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
              <input type="text" name="last_name" required 
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input type="email" name="email" required 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input type="text" name="username" required 
                   class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select name="role" required class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select role...</option>
              <option value="admin">Administrator</option>
              <option value="user">User</option>
              <option value="auditor">Auditor</option>
              <option value="viewer">Viewer</option>
            </select>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Department</label>
            <select name="department" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select department...</option>
              <option value="security">Information Security</option>
              <option value="it">IT Operations</option>
              <option value="compliance">Compliance</option>
              <option value="risk">Risk Management</option>
              <option value="audit">Internal Audit</option>
            </select>
          </div>
          
          <div>
            <label class="flex items-center">
              <input type="checkbox" name="send_invitation" class="mr-2" checked>
              <span class="text-sm text-gray-700">Send email invitation to user</span>
            </label>
          </div>
          
          <div>
            <label class="flex items-center">
              <input type="checkbox" name="require_password_change" class="mr-2" checked>
              <span class="text-sm text-gray-700">Require password change on first login</span>
            </label>
          </div>
        </div>
        
        <div class="flex justify-end items-center p-6 border-t bg-gray-50 space-x-3">
          <button type="button" onclick="document.getElementById('modal-container').innerHTML=''"
                  class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
            Cancel
          </button>
          <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
            Create User
          </button>
        </div>
        
        <div id="create-result"></div>
      </form>
    </div>
  </div>
`;

// Organizations Page
const renderOrganizationsPage = () => html`
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Organizations</h1>
            <p class="mt-1 text-sm text-gray-600">Manage organizational structure, departments, and hierarchies</p>
          </div>
          <div class="flex space-x-3">
            <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
              <i class="fas fa-plus mr-2"></i>Add Organization
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Organization Tree -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-medium text-gray-900 mb-4">Organization Structure</h3>
        <div class="space-y-4">
          
          <!-- Root Organization -->
          <div class="border rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <i class="fas fa-building text-2xl text-blue-500 mr-4"></i>
                <div>
                  <h4 class="text-lg font-semibold text-gray-900">Acme Corporation</h4>
                  <p class="text-sm text-gray-600">Parent Organization • 156 employees</p>
                </div>
              </div>
              <div class="flex items-center space-x-2">
                <button class="text-blue-600 hover:text-blue-700 text-sm">Edit</button>
                <button class="text-green-600 hover:text-green-700 text-sm">Add Department</button>
              </div>
            </div>
            
            <!-- Departments -->
            <div class="ml-12 mt-4 space-y-3">
              
              <!-- IT Department -->
              <div class="border-l-2 border-blue-200 pl-4 py-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <i class="fas fa-laptop text-blue-600 mr-3"></i>
                    <div>
                      <h5 class="font-medium text-gray-900">Information Technology</h5>
                      <p class="text-sm text-gray-600">23 employees • John Smith (Manager)</p>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <button class="text-blue-600 hover:text-blue-700 text-sm">Manage</button>
                  </div>
                </div>
                
                <!-- Sub-departments -->
                <div class="ml-8 mt-2 space-y-2">
                  <div class="flex items-center justify-between py-1">
                    <div class="flex items-center">
                      <i class="fas fa-shield-alt text-green-600 mr-2"></i>
                      <span class="text-sm font-medium">Information Security</span>
                      <span class="ml-2 text-xs text-gray-500">8 employees</span>
                    </div>
                    <button class="text-blue-600 hover:text-blue-700 text-xs">Edit</button>
                  </div>
                  <div class="flex items-center justify-between py-1">
                    <div class="flex items-center">
                      <i class="fas fa-cogs text-orange-600 mr-2"></i>
                      <span class="text-sm font-medium">IT Operations</span>
                      <span class="ml-2 text-xs text-gray-500">15 employees</span>
                    </div>
                    <button class="text-blue-600 hover:text-blue-700 text-xs">Edit</button>
                  </div>
                </div>
              </div>
              
              <!-- Finance Department -->
              <div class="border-l-2 border-green-200 pl-4 py-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <i class="fas fa-dollar-sign text-green-600 mr-3"></i>
                    <div>
                      <h5 class="font-medium text-gray-900">Finance & Accounting</h5>
                      <p class="text-sm text-gray-600">12 employees • Sarah Johnson (Manager)</p>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <button class="text-blue-600 hover:text-blue-700 text-sm">Manage</button>
                  </div>
                </div>
              </div>
              
              <!-- Human Resources -->
              <div class="border-l-2 border-purple-200 pl-4 py-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <i class="fas fa-users text-purple-600 mr-3"></i>
                    <div>
                      <h5 class="font-medium text-gray-900">Human Resources</h5>
                      <p class="text-sm text-gray-600">8 employees • Mike Davis (Manager)</p>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <button class="text-blue-600 hover:text-blue-700 text-sm">Manage</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

// SAML Configuration Page
const renderSAMLConfigPage = () => html`
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">SAML Authentication</h1>
            <p class="mt-1 text-sm text-gray-600">Configure Single Sign-On with SAML identity providers</p>
          </div>
          <div class="flex space-x-3">
            <button class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
              <i class="fas fa-download mr-2"></i>Download Metadata
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <!-- SAML Status -->
      <div class="bg-white rounded-lg shadow p-6 mb-8">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <i class="fas fa-key text-green-600 text-xl"></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">SAML SSO Status</h3>
              <p class="text-sm text-gray-600">Single Sign-On configuration and testing</p>
            </div>
          </div>
          <div class="flex items-center space-x-3">
            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <i class="fas fa-check-circle mr-1"></i>
              Configured
            </span>
            <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
              Test SSO
            </button>
          </div>
        </div>
      </div>

      <!-- SAML Configuration Form -->
      <div class="bg-white rounded-lg shadow">
        <div class="p-6 border-b border-gray-200">
          <h3 class="text-lg font-medium text-gray-900">SAML Configuration</h3>
          <p class="mt-1 text-sm text-gray-600">Configure your Identity Provider (IdP) settings</p>
        </div>
        
        <form hx-post="/admin/saml/save" hx-target="#save-result">
          <div class="p-6 space-y-6">
            
            <!-- Basic Settings -->
            <div>
              <h4 class="text-md font-semibold text-gray-900 mb-4">Identity Provider Settings</h4>
              <div class="grid grid-cols-1 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">SSO URL (IdP Login URL)</label>
                  <input type="url" name="sso_url" value="https://sso.example.com/saml/login"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">IdP Entity ID</label>
                  <input type="text" name="idp_entity_id" value="https://sso.example.com/saml/metadata"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">X.509 Certificate</label>
                  <textarea name="certificate" rows="8" placeholder="-----BEGIN CERTIFICATE-----..."
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
                  <p class="mt-1 text-xs text-gray-500">Paste the X.509 certificate from your identity provider</p>
                </div>
              </div>
            </div>

            <!-- Service Provider Settings -->
            <div>
              <h4 class="text-md font-semibold text-gray-900 mb-4">Service Provider Settings</h4>
              <div class="grid grid-cols-1 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">SP Entity ID</label>
                  <input type="text" name="sp_entity_id" value="https://aria5.example.com/saml/metadata" readonly
                         class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  <p class="mt-1 text-xs text-gray-500">This is your application's entity ID (read-only)</p>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Assertion Consumer Service URL</label>
                  <input type="text" name="acs_url" value="https://aria5.example.com/saml/acs" readonly
                         class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  <p class="mt-1 text-xs text-gray-500">Configure this URL in your IdP (read-only)</p>
                </div>
              </div>
            </div>

            <!-- Attribute Mapping -->
            <div>
              <h4 class="text-md font-semibold text-gray-900 mb-4">Attribute Mapping</h4>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Email Attribute</label>
                  <input type="text" name="email_attr" value="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">First Name Attribute</label>
                  <input type="text" name="first_name_attr" value="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Last Name Attribute</label>
                  <input type="text" name="last_name_attr" value="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Role Attribute (Optional)</label>
                  <input type="text" name="role_attr" value="http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
              </div>
            </div>

            <!-- Advanced Options -->
            <div>
              <h4 class="text-md font-semibold text-gray-900 mb-4">Advanced Options</h4>
              <div class="space-y-4">
                <div>
                  <label class="flex items-center">
                    <input type="checkbox" name="auto_provision" class="mr-2" checked>
                    <span class="text-sm font-medium">Auto-provision new users</span>
                  </label>
                  <p class="mt-1 text-xs text-gray-500 ml-6">Automatically create user accounts for new SSO logins</p>
                </div>
                
                <div>
                  <label class="flex items-center">
                    <input type="checkbox" name="require_signed_assertion" class="mr-2" checked>
                    <span class="text-sm font-medium">Require signed assertions</span>
                  </label>
                  <p class="mt-1 text-xs text-gray-500 ml-6">Only accept digitally signed SAML assertions</p>
                </div>
                
                <div>
                  <label class="flex items-center">
                    <input type="checkbox" name="enforce_sso" class="mr-2">
                    <span class="text-sm font-medium">Enforce SSO for all users</span>
                  </label>
                  <p class="mt-1 text-xs text-gray-500 ml-6">Disable local login and require SSO authentication</p>
                </div>
                
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Default Role for New Users</label>
                  <select name="default_role" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="user">User</option>
                    <option value="auditor">Auditor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <div class="flex justify-end items-center p-6 border-t bg-gray-50 space-x-3">
            <button type="button" class="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              Test Configuration
            </button>
            <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
              Save Configuration
            </button>
          </div>
          
          <div id="save-result"></div>
        </form>
      </div>
    </div>
  </div>
`;