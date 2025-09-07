/**
 * ARIA5 Conversational Threat Intelligence Assistant - Frontend Interface
 * 
 * Phase 4.3: Interactive frontend for natural language threat intelligence queries
 * 
 * Features:
 * - Natural language input with autocomplete
 * - Real-time response streaming
 * - Conversation history management
 * - Response feedback system
 * - Multiple response formats
 * - Query suggestions and examples
 * 
 * @author ARIA5 Security
 * @version 2.0.0
 */

class ConversationalAssistant {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.userId = 'user_' + Math.random().toString(36).substring(7);
    this.conversationHistory = [];
    this.isProcessing = false;
    this.currentTurnId = null;
    
    this.initializeInterface();
    this.bindEvents();
    this.loadExampleQueries();
  }

  /**
   * Initialize the assistant interface
   */
  initializeInterface() {
    const container = document.getElementById('conversational-assistant-container');
    if (!container) {
      console.warn('Conversational assistant container not found');
      return;
    }

    container.innerHTML = `
      <div class="conversational-assistant bg-white rounded-lg shadow-lg">
        <!-- Header -->
        <div class="assistant-header bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-t-lg">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <i class="fas fa-robot text-2xl"></i>
              <div>
                <h3 class="text-lg font-semibold">ARIA5 TI Assistant</h3>
                <p class="text-sm opacity-90">Ask me anything about threats and security</p>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <div class="status-indicator bg-green-400 w-3 h-3 rounded-full"></div>
              <span class="text-sm">Online</span>
            </div>
          </div>
        </div>

        <!-- Conversation Area -->
        <div class="conversation-area h-96 overflow-y-auto p-4 bg-gray-50" id="conversation-area">
          <!-- Welcome Message -->
          <div class="message assistant-message mb-4">
            <div class="flex items-start space-x-3">
              <div class="avatar bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
                <i class="fas fa-robot text-sm"></i>
              </div>
              <div class="message-content bg-white rounded-lg p-3 shadow-sm max-w-md">
                <p class="text-gray-800">Welcome to ARIA5 Threat Intelligence Assistant! I can help you with:</p>
                <ul class="mt-2 text-sm text-gray-600 space-y-1">
                  <li>• Threat indicator lookups</li>
                  <li>• Risk assessments</li>
                  <li>• Vulnerability information</li>
                  <li>• Incident investigation guidance</li>
                  <li>• Threat hunting recommendations</li>
                </ul>
                <p class="mt-2 text-sm text-gray-600">Try asking: "What can you tell me about this IP: 192.168.1.100?"</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Example Queries -->
        <div class="example-queries px-4 py-2 border-t bg-gray-50" id="example-queries">
          <div class="text-xs text-gray-500 mb-2">Quick Examples:</div>
          <div class="flex flex-wrap gap-2">
            <!-- Examples will be populated here -->
          </div>
        </div>

        <!-- Input Area -->
        <div class="input-area p-4 border-t bg-white rounded-b-lg">
          <div class="flex space-x-3">
            <div class="flex-1 relative">
              <textarea 
                id="query-input" 
                placeholder="Ask me about threats, indicators, risks, or security concerns..."
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows="2"
                maxlength="500"
              ></textarea>
              <div class="character-counter absolute bottom-2 right-3 text-xs text-gray-400">
                <span id="char-count">0</span>/500
              </div>
            </div>
            <button 
              id="send-button" 
              class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              disabled
            >
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Bind event handlers
   */
  bindEvents() {
    const queryInput = document.getElementById('query-input');
    const sendButton = document.getElementById('send-button');
    const charCount = document.getElementById('char-count');

    if (!queryInput || !sendButton) {
      return;
    }

    // Character counter
    queryInput.addEventListener('input', () => {
      const length = queryInput.value.length;
      charCount.textContent = length;
      sendButton.disabled = length === 0 || this.isProcessing;
    });

    // Send on button click
    sendButton.addEventListener('click', () => {
      this.sendQuery();
    });

    // Send on Ctrl+Enter
    queryInput.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        this.sendQuery();
      }
    });

    // Auto-resize textarea
    queryInput.addEventListener('input', () => {
      queryInput.style.height = 'auto';
      queryInput.style.height = Math.min(queryInput.scrollHeight, 120) + 'px';
    });
  }

  /**
   * Load example queries
   */
  loadExampleQueries() {
    const exampleQueries = [
      'Analyze this IP: 192.168.1.100',
      'Tell me about CVE-2024-1234',
      'What are the latest threat trends?',
      'How do I investigate a phishing incident?',
      'Show me APT29 indicators'
    ];

    const examplesContainer = document.querySelector('#example-queries .flex');
    if (!examplesContainer) return;

    exampleQueries.forEach(query => {
      const button = document.createElement('button');
      button.className = 'px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors';
      button.textContent = query;
      button.addEventListener('click', () => {
        document.getElementById('query-input').value = query;
        document.getElementById('char-count').textContent = query.length;
        document.getElementById('send-button').disabled = false;
      });
      examplesContainer.appendChild(button);
    });
  }

  /**
   * Send query to the assistant
   */
  async sendQuery() {
    const queryInput = document.getElementById('query-input');
    const query = queryInput.value.trim();

    if (!query || this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    this.updateSendButton(true);

    // Add user message to conversation
    this.addUserMessage(query);
    
    // Clear input
    queryInput.value = '';
    document.getElementById('char-count').textContent = '0';

    // Show typing indicator
    const typingIndicator = this.showTypingIndicator();

    try {
      // Send request to API
      const response = await fetch('/api/assistant/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: query,
          sessionId: this.sessionId,
          userId: this.userId,
          preferredFormat: 'conversational',
          maxResults: 10,
          includeRecommendations: true
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      // Remove typing indicator
      this.removeTypingIndicator(typingIndicator);

      if (result.success) {
        // Add assistant response
        this.addAssistantMessage(result.response);
        this.conversationHistory.push({
          query: query,
          response: result.response,
          timestamp: new Date()
        });
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }

    } catch (error) {
      console.error('Query failed:', error);
      this.removeTypingIndicator(typingIndicator);
      this.addErrorMessage(`Sorry, I encountered an error: ${error.message}`);
    } finally {
      this.isProcessing = false;
      this.updateSendButton(false);
    }
  }

  /**
   * Add user message to conversation
   */
  addUserMessage(message) {
    const conversationArea = document.getElementById('conversation-area');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message mb-4';
    messageDiv.innerHTML = `
      <div class="flex items-start space-x-3 justify-end">
        <div class="message-content bg-blue-600 text-white rounded-lg p-3 shadow-sm max-w-md">
          <p>${this.escapeHtml(message)}</p>
          <div class="text-xs opacity-75 mt-1">${new Date().toLocaleTimeString()}</div>
        </div>
        <div class="avatar bg-gray-600 text-white w-8 h-8 rounded-full flex items-center justify-center">
          <i class="fas fa-user text-sm"></i>
        </div>
      </div>
    `;
    
    conversationArea.appendChild(messageDiv);
    this.scrollToBottom();
  }

  /**
   * Add assistant message to conversation
   */
  addAssistantMessage(response) {
    const conversationArea = document.getElementById('conversation-area');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant-message mb-4';
    messageDiv.innerHTML = `
      <div class="flex items-start space-x-3">
        <div class="avatar bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
          <i class="fas fa-robot text-sm"></i>
        </div>
        <div class="message-content bg-white rounded-lg p-3 shadow-sm max-w-md">
          <p class="text-gray-800">${this.formatResponse(response.response)}</p>
          <div class="text-xs text-gray-500 mt-2">${new Date().toLocaleTimeString()}</div>
          ${this.renderRecommendations(response.recommendations)}
          ${this.renderFollowUpSuggestions(response.followUpSuggestions)}
        </div>
      </div>
    `;
    
    conversationArea.appendChild(messageDiv);
    this.scrollToBottom();
  }

  /**
   * Add error message to conversation
   */
  addErrorMessage(message) {
    const conversationArea = document.getElementById('conversation-area');
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant-message mb-4';
    messageDiv.innerHTML = `
      <div class="flex items-start space-x-3">
        <div class="avatar bg-red-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
          <i class="fas fa-exclamation-triangle text-sm"></i>
        </div>
        <div class="message-content bg-red-50 border border-red-200 rounded-lg p-3 shadow-sm max-w-md">
          <p class="text-red-800">${this.escapeHtml(message)}</p>
          <div class="text-xs text-red-600 mt-1">${new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    `;
    
    conversationArea.appendChild(messageDiv);
    this.scrollToBottom();
  }

  /**
   * Show typing indicator
   */
  showTypingIndicator() {
    const conversationArea = document.getElementById('conversation-area');
    
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message assistant-message mb-4 typing-indicator';
    typingDiv.innerHTML = `
      <div class="flex items-start space-x-3">
        <div class="avatar bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center">
          <i class="fas fa-robot text-sm"></i>
        </div>
        <div class="message-content bg-white rounded-lg p-3 shadow-sm">
          <div class="flex items-center space-x-1">
            <div class="typing-dots">
              <div class="dot"></div>
              <div class="dot"></div>
              <div class="dot"></div>
            </div>
            <span class="text-gray-500 text-sm">Assistant is thinking...</span>
          </div>
        </div>
      </div>
    `;
    
    conversationArea.appendChild(typingDiv);
    this.scrollToBottom();
    
    return typingDiv;
  }

  /**
   * Remove typing indicator
   */
  removeTypingIndicator(indicator) {
    if (indicator && indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  }

  /**
   * Update send button state
   */
  updateSendButton(processing) {
    const sendButton = document.getElementById('send-button');
    const queryInput = document.getElementById('query-input');
    
    if (processing) {
      sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
      sendButton.disabled = true;
      queryInput.disabled = true;
    } else {
      sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>';
      sendButton.disabled = queryInput.value.trim().length === 0;
      queryInput.disabled = false;
      queryInput.focus();
    }
  }

  /**
   * Format response content
   */
  formatResponse(response) {
    // Basic formatting for threat intelligence responses
    let formatted = this.escapeHtml(response);
    
    // Format IP addresses
    formatted = formatted.replace(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g, 
      '<span class="font-mono bg-gray-100 px-1 rounded">$1</span>');
    
    // Format CVE IDs
    formatted = formatted.replace(/(CVE-\d{4}-\d{4,})/gi, 
      '<span class="font-mono bg-yellow-100 px-1 rounded text-yellow-800">$1</span>');
    
    // Format domains
    formatted = formatted.replace(/([a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}/g, 
      '<span class="font-mono bg-blue-100 px-1 rounded text-blue-800">$&</span>');
    
    return formatted;
  }

  /**
   * Render recommendations
   */
  renderRecommendations(recommendations) {
    if (!recommendations || recommendations.length === 0) {
      return '';
    }
    
    const items = recommendations.map(rec => 
      `<li class="text-sm">${this.escapeHtml(rec)}</li>`
    ).join('');
    
    return `
      <div class="mt-3 p-2 bg-green-50 border border-green-200 rounded">
        <div class="text-sm font-medium text-green-800 mb-1">
          <i class="fas fa-lightbulb mr-1"></i>Recommendations:
        </div>
        <ul class="list-disc list-inside text-green-700">${items}</ul>
      </div>
    `;
  }

  /**
   * Render follow-up suggestions
   */
  renderFollowUpSuggestions(suggestions) {
    if (!suggestions || suggestions.length === 0) {
      return '';
    }
    
    const buttons = suggestions.map(suggestion => 
      `<button class="suggestion-btn text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors" 
               data-suggestion="${this.escapeHtml(suggestion)}">
        ${this.escapeHtml(suggestion)}
       </button>`
    ).join('');
    
    return `
      <div class="mt-3">
        <div class="text-xs text-gray-600 mb-2">Follow-up suggestions:</div>
        <div class="flex flex-wrap gap-1">${buttons}</div>
      </div>
    `;
  }

  /**
   * Scroll conversation to bottom
   */
  scrollToBottom() {
    const conversationArea = document.getElementById('conversation-area');
    if (conversationArea) {
      conversationArea.scrollTop = conversationArea.scrollHeight;
    }
  }

  /**
   * Escape HTML characters
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(7);
  }
}

// CSS for typing indicator animation
const typingCSS = `
  .typing-dots {
    display: flex;
    align-items: center;
    space-x: 1px;
  }
  
  .typing-dots .dot {
    width: 4px;
    height: 4px;
    background-color: #6b7280;
    border-radius: 50%;
    margin: 0 1px;
    animation: typing 1.4s infinite ease-in-out both;
  }
  
  .typing-dots .dot:nth-child(1) { animation-delay: -0.32s; }
  .typing-dots .dot:nth-child(2) { animation-delay: -0.16s; }
  .typing-dots .dot:nth-child(3) { animation-delay: 0; }
  
  @keyframes typing {
    0%, 80%, 100% {
      transform: scale(0);
      opacity: 0.5;
    }
    40% {
      transform: scale(1);
      opacity: 1;
    }
  }
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = typingCSS;
document.head.appendChild(style);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('conversational-assistant-container')) {
    window.conversationalAssistant = new ConversationalAssistant();
  }
});

// Handle suggestion button clicks (using event delegation)
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('suggestion-btn')) {
    const suggestion = e.target.getAttribute('data-suggestion');
    const queryInput = document.getElementById('query-input');
    if (queryInput && suggestion) {
      queryInput.value = suggestion;
      document.getElementById('char-count').textContent = suggestion.length;
      document.getElementById('send-button').disabled = false;
      queryInput.focus();
    }
  }
});