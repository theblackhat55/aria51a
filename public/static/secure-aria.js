// Secure ARIA Assistant - Client-side functions for secure AI proxy
// All API keys are handled server-side for security

// Updated secure ARIA message function
async function sendARIAMessageSecure() {
  const ariaInput = document.getElementById('aria-input');
  const ariaChat = document.getElementById('aria-chat');
  const query = ariaInput.value.trim();
  
  if (!query) return;
  
  // Check authentication
  const token = localStorage.getItem('dmt_token');
  if (!token) {
    appendARIAMessage('system', 'Please log in to use ARIA assistant.');
    return;
  }

  // Add user message
  ariaChat.innerHTML += `
    <div class="mb-4">
      <div class="text-right">
        <div class="inline-block bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg px-4 py-2 text-sm max-w-xs shadow-sm">
          ${escapeHtml(query)}
        </div>
        <div class="text-xs text-gray-500 mt-1">Secure server-side processing</div>
      </div>
    </div>
  `;
  
  ariaInput.value = '';
  ariaChat.scrollTop = ariaChat.scrollHeight;
  
  // Add loading message
  const loadingId = 'aria-loading-' + Date.now();
  ariaChat.innerHTML += `
    <div class="mb-4" id="${loadingId}">
      <div class="text-left">
        <div class="inline-block bg-gradient-to-r from-purple-100 to-blue-100 text-gray-800 rounded-lg px-4 py-2 text-sm shadow-sm">
          <i class="fas fa-brain fa-pulse mr-2 text-purple-600"></i>ARIA is analyzing your request...
          <div class="text-xs text-gray-600 mt-1">Using secure AI proxy</div>
        </div>
      </div>
    </div>
  `;

  try {
    const startTime = Date.now();
    
    console.log('🔒 Secure ARIA Call - Making request:', {
      query: query?.substring(0, 50) + '...',
      endpoint: '/api/ai/chat'
    });
    
    const response = await axios.post('/api/ai/chat', {
      message: query,
      provider: 'auto', // Let server choose optimal provider based on user preferences
      context: 'You are ARIA, an AI Risk Assistant specialized in cybersecurity, risk management, compliance, and governance. Provide helpful, accurate, and actionable information.'
    }, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // 60 second timeout
    });

    // Remove loading message
    document.getElementById(loadingId)?.remove();

    if (response.data.success) {
      const aiResponse = response.data.data.response;
      const provider = response.data.data.provider;
      const model = response.data.data.model;
      const usage = response.data.data.usage;
      
      const responseTime = Date.now() - startTime;
      
      console.log('✅ Secure ARIA Response:', {
        provider: provider,
        model: model,
        responseTime: responseTime + 'ms',
        tokens: usage?.total_tokens
      });

      // Add AI response with provider info
      ariaChat.innerHTML += `
        <div class="mb-4">
          <div class="text-left">
            <div class="inline-block bg-gradient-to-r from-purple-50 to-blue-50 text-gray-800 rounded-lg px-4 py-2 text-sm max-w-lg shadow-sm border border-purple-200">
              <div class="flex items-center mb-2">
                <i class="fas fa-robot text-purple-600 mr-2"></i>
                <span class="font-medium text-purple-900">ARIA</span>
                <span class="text-xs text-gray-500 ml-2">via ${provider.toUpperCase()}</span>
              </div>
              <div class="prose prose-sm">${formatMarkdown(aiResponse)}</div>
              <div class="text-xs text-gray-500 mt-2 flex justify-between">
                <span>Response time: ${responseTime}ms</span>
                ${usage ? `<span>Tokens: ${usage.total_tokens}</span>` : ''}
              </div>
            </div>
          </div>
        </div>
      `;
    } else {
      throw new Error(response.data.error || 'AI request failed');
    }

  } catch (error) {
    console.error('❌ Secure ARIA Error:', error);
    
    // Remove loading message
    document.getElementById(loadingId)?.remove();
    
    let errorMessage = 'Sorry, I encountered an error processing your request.';
    
    if (error.response?.status === 503) {
      errorMessage = 'No AI providers are currently configured. Please contact your administrator to set up AI services.';
    } else if (error.response?.status === 401) {
      errorMessage = 'Authentication required. Please log in again.';
    } else if (error.response?.status === 403) {
      errorMessage = 'You don\'t have permission to use AI services. Please contact your administrator.';
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      errorMessage = 'Request timed out. The AI service might be busy. Please try again.';
    } else if (error.response?.data?.error) {
      errorMessage = error.response.data.error;
    }

    // Add error message
    ariaChat.innerHTML += `
      <div class="mb-4">
        <div class="text-left">
          <div class="inline-block bg-red-100 text-red-800 rounded-lg px-4 py-2 text-sm max-w-lg border border-red-200">
            <i class="fas fa-exclamation-triangle mr-2"></i>${escapeHtml(errorMessage)}
            <div class="mt-2 text-xs">
              ${error.response?.status ? `Error ${error.response.status}` : 'Network error'}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  ariaChat.scrollTop = ariaChat.scrollHeight;
}

// Update provider display to show server-side status
async function updateARIAProviderDisplaySecure() {
  const providerDisplay = document.getElementById('current-provider');
  if (!providerDisplay) return;

  try {
    const token = localStorage.getItem('dmt_token');
    if (!token) {
      providerDisplay.innerHTML = '<span class="text-red-600"><i class="fas fa-sign-in-alt mr-1"></i>Login Required</span>';
      providerDisplay.title = 'Please log in to use AI services';
      return;
    }

    // Get AI configuration from server
    const response = await fetch('/api/ai/config', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load AI configuration');
    }

    const result = await response.json();
    
    if (result.success) {
      const config = result.data;
      const enabledProviders = [];
      
      if (config.openai?.enabled) enabledProviders.push('OpenAI');
      if (config.anthropic?.enabled) enabledProviders.push('Anthropic');
      if (config.gemini?.enabled) enabledProviders.push('Gemini');
      
      if (enabledProviders.length === 0) {
        providerDisplay.innerHTML = '<span class="text-yellow-600"><i class="fas fa-cog mr-1"></i>Not Configured</span>';
        providerDisplay.title = 'AI providers not configured by administrator';
      } else if (enabledProviders.length === 1) {
        providerDisplay.innerHTML = `<span class="text-green-600"><i class="fas fa-check-circle mr-1"></i>${enabledProviders[0]}</span>`;
        providerDisplay.title = `Using: ${enabledProviders[0]}`;
      } else {
        providerDisplay.innerHTML = `<span class="text-blue-600"><i class="fas fa-layer-group mr-1"></i>${enabledProviders.length} Providers</span>`;
        providerDisplay.title = `Available: ${enabledProviders.join(', ')}`;
      }
    } else {
      throw new Error('Configuration load failed');
    }
  } catch (error) {
    console.error('Provider display update error:', error);
    providerDisplay.innerHTML = '<span class="text-gray-600"><i class="fas fa-question-circle mr-1"></i>Unknown</span>';
    providerDisplay.title = 'Unable to load AI provider status';
  }
}

// Quick ARIA queries for common tasks
async function quickARIAQuerySecure(predefinedQuery) {
  const ariaInput = document.getElementById('aria-input');
  if (ariaInput) {
    ariaInput.value = predefinedQuery;
    await sendARIAMessageSecure();
  }
}

// Helper function to escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Simple markdown formatter for AI responses
function formatMarkdown(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded text-xs">$1</code>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>');
}

// Replace the old functions with secure versions
if (typeof window !== 'undefined') {
  window.sendARIAMessage = sendARIAMessageSecure;
  window.updateARIAProviderDisplay = updateARIAProviderDisplaySecure;
  window.quickARIAQuery = quickARIAQuerySecure;
}

console.log('🔒 Secure ARIA functions loaded');