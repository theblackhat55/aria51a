import { Hono } from 'hono'

const app = new Hono()

// Secure Key Management Dashboard
app.get('/', async (c) => {
  const keyStatus = await getKeyStatus()
  const keyCategories = await getKeyCategories()
  
  return c.html(`
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">
            <i class="fas fa-key mr-3 text-green-600"></i>Secure Key Management
          </h2>
          <p class="text-gray-600 mt-1">Manage API keys and integration credentials securely</p>
        </div>
        <div class="flex space-x-3">
          <button 
            hx-get="/keys/add"
            hx-target="#modal-content"
            hx-trigger="click"
            class="btn-primary">
            <i class="fas fa-plus mr-2"></i>Add Key
          </button>
          <button 
            hx-get="/keys/import"
            hx-target="#modal-content"
            hx-trigger="click"
            class="btn-secondary">
            <i class="fas fa-upload mr-2"></i>Import Keys
          </button>
          <button 
            hx-get="/keys"
            hx-target="#main-content"
            hx-trigger="click"
            class="btn-secondary">
            <i class="fas fa-sync-alt mr-2"></i>Refresh
          </button>
        </div>
      </div>

      <!-- Security Notice -->
      <div class="bg-blue-50 border-l-4 border-blue-500 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fas fa-info-circle text-blue-500"></i>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-blue-800">Security Information</h3>
            <p class="text-sm text-blue-700 mt-1">
              API keys are encrypted and stored securely. Only key prefixes and status information are displayed. 
              Keys are never shown in full after initial creation.
            </p>
          </div>
        </div>
      </div>

      <!-- Key Categories -->
      ${keyCategories.map(category => `
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold text-gray-900">
                <i class="fas ${category.icon} mr-2"></i>${category.name}
              </h3>
              <span class="text-sm text-gray-500">${category.keys.length} keys configured</span>
            </div>
            ${category.description ? `<p class="text-sm text-gray-600 mt-1">${category.description}</p>` : ''}
          </div>
          <div class="p-6">
            ${category.keys.length === 0 ? `
              <div class="text-center py-8">
                <i class="fas fa-key text-3xl text-gray-300 mb-3"></i>
                <h4 class="text-sm font-medium text-gray-900 mb-2">No ${category.name} Keys Configured</h4>
                <p class="text-sm text-gray-500 mb-4">Add your first ${category.name.toLowerCase()} API key to get started.</p>
                <button 
                  hx-get="/keys/add?category=${category.id}"
                  hx-target="#modal-content"
                  hx-trigger="click"
                  class="btn-primary btn-sm">
                  <i class="fas fa-plus mr-2"></i>Add ${category.name} Key
                </button>
              </div>
            ` : `
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${category.keys.map(key => renderKeyCard(key)).join('')}
              </div>
            `}
          </div>
        </div>
      `).join('')}

      <!-- Key Statistics -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Key Management Statistics</h3>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          ${renderKeyStats(keyStatus)}
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="bg-white rounded-lg shadow">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">Recent Key Activity</h3>
        </div>
        <div class="p-6">
          ${renderRecentActivity()}
        </div>
      </div>
    </div>
  `)
})

// Add New Key Modal
app.get('/add', async (c) => {
  const category = c.req.query('category') || ''
  const keyTypes = await getKeyTypes()
  
  return c.html(`
    <div class="modal-header">
      <h3 class="text-lg font-semibold text-gray-900">Add New API Key</h3>
    </div>
    <form hx-post="/keys/create" hx-target="#main-content" hx-swap="outerHTML">
      <div class="modal-body space-y-4">
        <!-- Security Warning -->
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <i class="fas fa-shield-alt text-yellow-600"></i>
            </div>
            <div class="ml-3">
              <h4 class="text-sm font-medium text-yellow-800">Security Notice</h4>
              <p class="text-sm text-yellow-700 mt-1">
                Keys are encrypted and stored securely. Only you will see the full key during this setup process.
                After saving, only the key prefix will be visible.
              </p>
            </div>
          </div>
        </div>

        <!-- Key Configuration -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Key Name *</label>
            <input type="text" name="name" required class="form-input" 
              placeholder="e.g., Production OpenAI Key">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Service Type *</label>
            <select name="service_type" required class="form-select" ${category ? `value="${category}"` : ''}>
              <option value="">Select Service</option>
              ${keyTypes.map(type => `
                <option value="${type.id}" ${category === type.id ? 'selected' : ''}>
                  ${type.name}
                </option>
              `).join('')}
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">API Key *</label>
          <div class="relative">
            <input type="password" name="api_key" required class="form-input pr-12" 
              placeholder="Enter your API key..." id="api-key-input">
            <button type="button" onclick="toggleKeyVisibility()" 
              class="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600">
              <i class="fas fa-eye" id="eye-icon"></i>
            </button>
          </div>
          <p class="text-xs text-gray-500 mt-1">Your key will be encrypted before storage</p>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea name="description" rows="2" class="form-textarea" 
            placeholder="Optional description of this key's purpose..."></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Environment</label>
            <select name="environment" class="form-select">
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development" selected>Development</option>
              <option value="testing">Testing</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Access Level</label>
            <select name="access_level" class="form-select">
              <option value="full" selected>Full Access</option>
              <option value="read_only">Read Only</option>
              <option value="limited">Limited Access</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Expiration Date</label>
            <input type="date" name="expiration_date" class="form-input">
            <p class="text-xs text-gray-500 mt-1">Optional: Set when this key should expire</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Rate Limit (per minute)</label>
            <input type="number" name="rate_limit" class="form-input" placeholder="1000">
            <p class="text-xs text-gray-500 mt-1">Optional: API rate limit if known</p>
          </div>
        </div>

        <!-- Advanced Options -->
        <div class="border-t border-gray-200 pt-4">
          <div class="flex items-center space-x-3">
            <input type="checkbox" name="auto_rotate" id="auto-rotate" class="mr-2">
            <label for="auto-rotate" class="text-sm text-gray-700">
              Enable automatic key rotation (if supported by provider)
            </label>
          </div>
          <div class="flex items-center space-x-3 mt-2">
            <input type="checkbox" name="test_on_save" id="test-on-save" class="mr-2" checked>
            <label for="test-on-save" class="text-sm text-gray-700">
              Test key validity before saving
            </label>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
        <button type="submit" class="btn-primary">
          <i class="fas fa-save mr-2"></i>Save Key
        </button>
      </div>
    </form>

    <script>
      function toggleKeyVisibility() {
        const input = document.getElementById('api-key-input');
        const eyeIcon = document.getElementById('eye-icon');
        
        if (input.type === 'password') {
          input.type = 'text';
          eyeIcon.className = 'fas fa-eye-slash';
        } else {
          input.type = 'password';
          eyeIcon.className = 'fas fa-eye';
        }
      }
    </script>
  `)
})

// Create Key
app.post('/create', async (c) => {
  try {
    const formData = await c.req.parseBody()
    
    // Test key if requested
    if (formData.test_on_save === 'on') {
      const testResult = await testAPIKey(formData.service_type, formData.api_key)
      if (!testResult.valid) {
        return c.html(`
          <div class="bg-red-50 border-l-4 border-red-500 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <i class="fas fa-exclamation-circle text-red-500"></i>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">Key Test Failed</h3>
                <p class="text-sm text-red-700 mt-1">${testResult.error}</p>
              </div>
            </div>
          </div>
        `)
      }
    }

    // Create and encrypt key
    const keyData = {
      id: generateId(),
      name: formData.name,
      service_type: formData.service_type,
      api_key: formData.api_key, // Will be encrypted
      description: formData.description,
      environment: formData.environment,
      access_level: formData.access_level,
      expiration_date: formData.expiration_date,
      rate_limit: formData.rate_limit ? parseInt(formData.rate_limit) : null,
      auto_rotate: formData.auto_rotate === 'on',
      created_at: new Date().toISOString(),
      last_used: null,
      is_active: true
    }

    await createAPIKey(keyData)

    return c.html(`
      <div class="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fas fa-check-circle text-green-500"></i>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-800">API Key Saved Successfully</h3>
            <p class="text-sm text-green-700 mt-1">
              "${keyData.name}" has been encrypted and stored securely. 
              ${formData.test_on_save === 'on' ? 'Key validation passed.' : ''}
            </p>
          </div>
        </div>
      </div>
      <script>
        setTimeout(() => {
          htmx.ajax('GET', '/keys', {target: '#main-content'});
          closeModal();
        }, 2000);
      </script>
    `)
  } catch (error) {
    return c.html(`
      <div class="bg-red-50 border-l-4 border-red-500 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fas fa-exclamation-circle text-red-500"></i>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Save Failed</h3>
            <p class="text-sm text-red-700 mt-1">${error.message}</p>
          </div>
        </div>
      </div>
    `)
  }
})

// Test Key
app.post('/:id/test', async (c) => {
  try {
    const id = c.req.param('id')
    const key = await getKeyById(id)
    
    if (!key) {
      return c.html(`
        <div class="text-red-600">
          <i class="fas fa-times-circle mr-1"></i>Key not found
        </div>
      `)
    }

    const testResult = await testAPIKey(key.service_type, key.api_key)
    
    if (testResult.valid) {
      // Update last tested timestamp
      await updateKeyLastTested(id)
      
      return c.html(`
        <div class="text-green-600">
          <i class="fas fa-check-circle mr-1"></i>Valid (${testResult.responseTime}ms)
        </div>
      `)
    } else {
      return c.html(`
        <div class="text-red-600">
          <i class="fas fa-times-circle mr-1"></i>Invalid: ${testResult.error}
        </div>
      `)
    }
  } catch (error) {
    return c.html(`
      <div class="text-red-600">
        <i class="fas fa-exclamation-triangle mr-1"></i>Test failed
      </div>
    `)
  }
})

// Delete Key
app.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await deleteAPIKey(id)
    
    return c.html(`
      <div class="bg-yellow-50 border-l-4 border-yellow-500 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fas fa-trash text-yellow-600"></i>
          </div>
          <div class="ml-3">
            <p class="text-sm text-yellow-700">API key has been permanently deleted.</p>
          </div>
        </div>
      </div>
    `)
  } catch (error) {
    return c.html(`
      <div class="bg-red-50 border-l-4 border-red-500 p-4">
        <p class="text-sm text-red-700">Failed to delete key: ${error.message}</p>
      </div>
    `)
  }
})

// Mock data functions
async function getKeyStatus() {
  return {
    total_keys: 8,
    active_keys: 7,
    expired_keys: 1,
    invalid_keys: 0
  }
}

async function getKeyCategories() {
  const mockKeys = await getAllKeys()
  
  return [
    {
      id: 'ai_providers',
      name: 'AI Providers',
      icon: 'fa-robot',
      description: 'API keys for AI and machine learning services',
      keys: mockKeys.filter(k => ['openai', 'anthropic', 'google'].includes(k.service_type))
    },
    {
      id: 'cloud_services',
      name: 'Cloud Services',
      icon: 'fa-cloud',
      description: 'Cloud infrastructure and platform API keys',
      keys: mockKeys.filter(k => ['aws', 'azure', 'gcp'].includes(k.service_type))
    },
    {
      id: 'security_tools',
      name: 'Security Tools',
      icon: 'fa-shield-alt',
      description: 'Security and compliance service integrations',
      keys: mockKeys.filter(k => ['defender', 'splunk', 'crowdstrike'].includes(k.service_type))
    },
    {
      id: 'communications',
      name: 'Communications',
      icon: 'fa-envelope',
      description: 'Email, messaging, and notification services',
      keys: mockKeys.filter(k => ['sendgrid', 'twilio', 'slack'].includes(k.service_type))
    }
  ]
}

async function getAllKeys() {
  return [
    {
      id: '1',
      name: 'Production OpenAI',
      service_type: 'openai',
      prefix: 'sk-...xyz',
      environment: 'production',
      access_level: 'full',
      is_active: true,
      last_tested: '2024-09-03T10:00:00Z',
      last_used: '2024-09-03T11:30:00Z',
      created_at: '2024-08-15T09:00:00Z',
      expiration_date: '2025-08-15',
      status: 'valid'
    },
    {
      id: '2',
      name: 'Development Claude',
      service_type: 'anthropic',
      prefix: 'sk-ant-...abc',
      environment: 'development',
      access_level: 'full',
      is_active: true,
      last_tested: '2024-09-02T15:30:00Z',
      last_used: '2024-09-03T08:45:00Z',
      created_at: '2024-08-20T14:00:00Z',
      expiration_date: null,
      status: 'valid'
    },
    {
      id: '3',
      name: 'AWS Production',
      service_type: 'aws',
      prefix: 'AKIA...DEF',
      environment: 'production',
      access_level: 'limited',
      is_active: true,
      last_tested: '2024-09-01T12:00:00Z',
      last_used: '2024-09-03T09:15:00Z',
      created_at: '2024-07-10T10:30:00Z',
      expiration_date: '2025-01-10',
      status: 'valid'
    }
  ]
}

async function getKeyTypes() {
  return [
    { id: 'openai', name: 'OpenAI' },
    { id: 'anthropic', name: 'Anthropic Claude' },
    { id: 'google', name: 'Google Gemini' },
    { id: 'aws', name: 'Amazon Web Services' },
    { id: 'azure', name: 'Microsoft Azure' },
    { id: 'gcp', name: 'Google Cloud Platform' },
    { id: 'defender', name: 'Microsoft Defender' },
    { id: 'splunk', name: 'Splunk' },
    { id: 'crowdstrike', name: 'CrowdStrike' },
    { id: 'sendgrid', name: 'SendGrid' },
    { id: 'twilio', name: 'Twilio' },
    { id: 'slack', name: 'Slack' }
  ]
}

async function testAPIKey(serviceType: string, apiKey: string) {
  // Mock API key testing
  const responses = {
    openai: { valid: true, responseTime: 120 },
    anthropic: { valid: true, responseTime: 85 },
    google: { valid: true, responseTime: 95 },
    aws: { valid: true, responseTime: 45 },
    azure: { valid: true, responseTime: 67 }
  }
  
  return responses[serviceType] || { valid: false, error: 'Unsupported service type' }
}

async function createAPIKey(keyData: any) {
  // Mock implementation - encrypt and store
  console.log('Creating API key:', { ...keyData, api_key: '[ENCRYPTED]' })
  return keyData
}

async function getKeyById(id: string) {
  const keys = await getAllKeys()
  return keys.find(k => k.id === id)
}

async function updateKeyLastTested(id: string) {
  console.log(`Updating last tested timestamp for key ${id}`)
}

async function deleteAPIKey(id: string) {
  console.log(`Deleting API key ${id}`)
}

// Helper functions
function renderKeyCard(key: any) {
  return `
    <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <!-- Key Header -->
      <div class="flex items-start justify-between mb-3">
        <div class="flex-1 min-w-0">
          <h4 class="text-sm font-semibold text-gray-900 truncate">${key.name}</h4>
          <p class="text-xs text-gray-500">${key.prefix}</p>
        </div>
        <div class="flex-shrink-0 ml-2">
          <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(key.status)}">
            ${key.status}
          </span>
        </div>
      </div>

      <!-- Key Details -->
      <div class="space-y-2 text-xs text-gray-600 mb-4">
        <div class="flex justify-between">
          <span>Environment:</span>
          <span class="font-medium">${key.environment}</span>
        </div>
        <div class="flex justify-between">
          <span>Last Used:</span>
          <span>${key.last_used ? getRelativeTime(key.last_used) : 'Never'}</span>
        </div>
        <div class="flex justify-between">
          <span>Last Tested:</span>
          <span id="test-status-${key.id}">
            ${key.last_tested ? getRelativeTime(key.last_tested) : 'Never'}
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between pt-3 border-t border-gray-200">
        <button 
          hx-post="/keys/${key.id}/test"
          hx-target="#test-status-${key.id}"
          hx-trigger="click"
          class="text-blue-600 hover:text-blue-700 text-xs font-medium">
          <i class="fas fa-flask mr-1"></i>Test
        </button>
        <div class="flex items-center space-x-2">
          <button 
            hx-get="/keys/${key.id}/edit"
            hx-target="#modal-content"
            hx-trigger="click"
            class="text-gray-600 hover:text-gray-700"
            title="Edit">
            <i class="fas fa-edit text-xs"></i>
          </button>
          <button 
            hx-delete="/keys/${key.id}"
            hx-target="closest div"
            hx-trigger="click"
            hx-confirm="Are you sure you want to delete this API key? This action cannot be undone."
            class="text-red-600 hover:text-red-700"
            title="Delete">
            <i class="fas fa-trash text-xs"></i>
          </button>
        </div>
      </div>
    </div>
  `
}

function renderKeyStats(stats: any) {
  return `
    <div class="text-center">
      <div class="text-2xl font-bold text-gray-900">${stats.total_keys}</div>
      <div class="text-sm text-gray-600">Total Keys</div>
    </div>
    <div class="text-center">
      <div class="text-2xl font-bold text-green-600">${stats.active_keys}</div>
      <div class="text-sm text-gray-600">Active</div>
    </div>
    <div class="text-center">
      <div class="text-2xl font-bold text-yellow-600">${stats.expired_keys}</div>
      <div class="text-sm text-gray-600">Expired</div>
    </div>
    <div class="text-center">
      <div class="text-2xl font-bold text-red-600">${stats.invalid_keys}</div>
      <div class="text-sm text-gray-600">Invalid</div>
    </div>
  `
}

function renderRecentActivity() {
  return `
    <div class="space-y-3">
      <div class="flex items-center justify-between py-2 border-b border-gray-100">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <i class="fas fa-key text-green-600 text-xs"></i>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">Production OpenAI key tested</p>
            <p class="text-xs text-gray-500">2 hours ago</p>
          </div>
        </div>
        <span class="text-xs text-green-600">✓ Valid</span>
      </div>
      <div class="flex items-center justify-between py-2 border-b border-gray-100">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <i class="fas fa-plus text-blue-600 text-xs"></i>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">New AWS key added</p>
            <p class="text-xs text-gray-500">1 day ago</p>
          </div>
        </div>
        <span class="text-xs text-blue-600">Created</span>
      </div>
      <div class="flex items-center justify-between py-2">
        <div class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <i class="fas fa-clock text-yellow-600 text-xs"></i>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-900">Staging key expires soon</p>
            <p class="text-xs text-gray-500">3 days ago</p>
          </div>
        </div>
        <span class="text-xs text-yellow-600">Warning</span>
      </div>
    </div>
  `
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'valid': return 'bg-green-100 text-green-800'
    case 'invalid': return 'bg-red-100 text-red-800'
    case 'expired': return 'bg-yellow-100 text-yellow-800'
    case 'testing': return 'bg-blue-100 text-blue-800'
    default: return 'bg-gray-100 text-gray-800'
  }
}

function getRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return date.toLocaleDateString()
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export default app