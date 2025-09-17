/**
 * Enhanced ARIA Chatbot Widget
 * Unified chatbot with streaming, context awareness, and real-time data
 */

class EnhancedARIAChatbot {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.isOpen = false;
    this.isStreaming = false;
    this.eventSource = null;
    this.conversationHistory = [];
    this.responseCache = new Map();
    this.currentMessageId = null;
    
    // Initialize immediately
    this.initializeElements();
    this.bindEvents();
    this.loadConversationHistory();
    console.log('✅ Enhanced ARIA Chatbot initialized successfully');
  }
  
  getOrCreateSessionId() {
    let sessionId = localStorage.getItem('aria_session_id');
    if (!sessionId) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('aria_session_id', sessionId);
    }
    return sessionId;
  }
  
  initializeElements() {
    // Check if chatbot already exists
    if (document.getElementById('aria-chatbot-widget')) {
      return;
    }
    
    // Create chatbot HTML structure
    const chatbotHTML = `
      <div id="aria-chatbot-widget" class="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
        <!-- Notification Badge -->
        <div id="chatbot-notification" class="hidden absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
          <span id="notification-count">1</span>
        </div>
        
        <!-- Toggle Button -->
        <button id="chatbot-toggle" class="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full w-14 h-14 sm:w-16 sm:h-16 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group relative overflow-hidden">
          <div class="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
          <i id="chatbot-icon" class="fas fa-robot text-lg sm:text-xl group-hover:scale-110 transition-all duration-300 z-10"></i>
          <div class="absolute inset-0 rounded-full border-2 border-blue-300 animate-ping opacity-20"></div>
        </button>
        
        <!-- Chat Panel -->
        <div id="chatbot-panel" class="hidden fixed sm:absolute inset-x-4 bottom-20 sm:inset-x-auto sm:bottom-20 sm:right-0 sm:w-[420px] w-auto h-[600px] sm:h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transform transition-all duration-300 scale-95 opacity-0">
          
          <!-- Header -->
          <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="relative">
                <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <i class="fas fa-brain text-sm"></i>
                </div>
                <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <span class="font-semibold text-sm">ARIA Assistant</span>
                <div class="flex items-center text-xs opacity-90">
                  <span class="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
                  AI-Powered • Real-time Data
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <button id="chatbot-minimize" class="hover:bg-blue-500 rounded p-1.5 transition-colors" title="Minimize">
                <i class="fas fa-minus text-xs"></i>
              </button>
              <button id="chatbot-close" class="hover:bg-blue-500 rounded p-1.5 transition-colors" title="Close">
                <i class="fas fa-times text-xs"></i>
              </button>
            </div>
          </div>
          
          <!-- Quick Actions -->
          <div id="quick-actions" class="bg-gray-50 p-2 sm:p-3 border-b border-gray-200">
            <div class="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2">
              <button class="quick-action-btn" data-action="risk-analysis">
                <i class="fas fa-chart-line text-red-500"></i>
                <span>Risk Analysis</span>
              </button>
              <button class="quick-action-btn" data-action="compliance-check">
                <i class="fas fa-shield-check text-green-500"></i>
                <span>Compliance</span>
              </button>
              <button class="quick-action-btn" data-action="threat-analysis">
                <i class="fas fa-exclamation-triangle text-orange-500"></i>
                <span>Threats</span>
              </button>
              <button class="quick-action-btn" data-action="recommendations">
                <i class="fas fa-lightbulb text-purple-500"></i>
                <span>Recommend</span>
              </button>
            </div>
          </div>
          
          <!-- Messages Area -->
          <div id="chatbot-messages" class="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
            <!-- Welcome Message -->
            <div class="message-container assistant-message">
              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <i class="fas fa-brain text-blue-600 text-sm"></i>
                </div>
                <div class="flex-1">
                  <div class="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                    <div class="flex items-center mb-2">
                      <span class="font-semibold text-gray-800 text-sm">ARIA Assistant</span>
                      <span class="ml-2 text-xs text-gray-500">${new Date().toLocaleTimeString()}</span>
                    </div>
                    <p class="text-gray-700 text-sm leading-relaxed">
                      👋 Hello! I'm ARIA, your AI-powered security assistant with real-time platform data access.
                    </p>
                    <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
                      <div class="bg-red-50 p-2 rounded-lg">
                        <i class="fas fa-exclamation-triangle text-red-500 mr-1"></i>
                        <span class="text-red-700">Risk Analysis</span>
                      </div>
                      <div class="bg-green-50 p-2 rounded-lg">
                        <i class="fas fa-clipboard-check text-green-500 mr-1"></i>
                        <span class="text-green-700">Compliance</span>
                      </div>
                      <div class="bg-orange-50 p-2 rounded-lg">
                        <i class="fas fa-shield-alt text-orange-500 mr-1"></i>
                        <span class="text-orange-700">Threats</span>
                      </div>
                      <div class="bg-purple-50 p-2 rounded-lg">
                        <i class="fas fa-lightbulb text-purple-500 mr-1"></i>
                        <span class="text-purple-700">Insights</span>
                      </div>
                    </div>
                    <p class="text-gray-600 text-xs mt-3">
                      💡 I have access to your live platform data. Ask me anything!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Typing Indicator -->
          <div id="typing-indicator" class="hidden px-4 py-2">
            <div class="flex items-center space-x-2">
              <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <i class="fas fa-brain text-blue-600 text-sm"></i>
              </div>
              <div class="bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-100">
                <div class="flex items-center space-x-1">
                  <span class="text-gray-500 text-sm">ARIA is thinking</span>
                  <div class="typing-dots">
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                    <div class="typing-dot"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Input Area -->
          <div class="border-t border-gray-200 p-4 bg-white">
            <form id="chatbot-form" class="relative">
              <div class="flex items-end space-x-2">
                <div class="flex-1 relative">
                  <textarea id="chatbot-input" 
                           placeholder="Ask about risks, compliance, threats..." 
                           rows="1"
                           class="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                           style="max-height: 120px;"></textarea>
                  
                  <div id="char-counter" class="absolute bottom-1 right-1 text-xs text-gray-400 hidden">
                    <span id="char-count">0</span>/500
                  </div>
                </div>
                
                <button type="submit" 
                        id="send-button"
                        disabled
                        class="bg-gray-300 text-gray-500 w-12 h-12 rounded-xl transition-all duration-200 flex items-center justify-center disabled:cursor-not-allowed">
                  <i class="fas fa-paper-plane text-sm"></i>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    // Add chatbot to page
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);
    
    // Get element references
    this.toggle = document.getElementById('chatbot-toggle');
    this.panel = document.getElementById('chatbot-panel');
    this.close = document.getElementById('chatbot-close');
    this.minimize = document.getElementById('chatbot-minimize');
    this.form = document.getElementById('chatbot-form');
    this.input = document.getElementById('chatbot-input');
    this.messages = document.getElementById('chatbot-messages');
    this.sendButton = document.getElementById('send-button');
    this.typingIndicator = document.getElementById('typing-indicator');
    this.notification = document.getElementById('chatbot-notification');
  }
  
  bindEvents() {
    // Toggle chatbot
    this.toggle?.addEventListener('click', () => this.toggleChat());
    
    // Close chatbot
    this.close?.addEventListener('click', () => this.closeChat());
    
    // Minimize chatbot
    this.minimize?.addEventListener('click', () => this.minimizeChat());
    
    // Form submission
    this.form?.addEventListener('submit', (e) => this.handleSubmission(e));
    
    // Input events
    this.input?.addEventListener('input', () => this.handleInputChange());
    this.input?.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    // Quick actions
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleQuickAction(e));
    });
  }
  
  toggleChat() {
    if (this.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }
  
  openChat() {
    this.panel.classList.remove('hidden');
    setTimeout(() => {
      this.panel.classList.remove('scale-95', 'opacity-0');
      this.panel.classList.add('scale-100', 'opacity-100');
    }, 10);
    
    this.isOpen = true;
    this.input?.focus();
    this.hideNotification();
    
    // Change icon
    const icon = document.getElementById('chatbot-icon');
    if (icon) {
      icon.className = 'fas fa-times text-xl group-hover:scale-110 transition-all duration-300 z-10';
    }
  }
  
  closeChat() {
    this.panel.classList.add('scale-95', 'opacity-0');
    this.panel.classList.remove('scale-100', 'opacity-100');
    
    setTimeout(() => {
      this.panel.classList.add('hidden');
    }, 300);
    
    this.isOpen = false;
    
    // Reset icon
    const icon = document.getElementById('chatbot-icon');
    if (icon) {
      icon.className = 'fas fa-robot text-xl group-hover:scale-110 transition-all duration-300 z-10';
    }
  }
  
  minimizeChat() {
    this.closeChat();
  }
  
  async handleSubmission(e) {
    e.preventDefault();
    const message = this.input.value.trim();
    if (!message || this.isStreaming) return;
    
    // Add user message
    this.addMessage(message, 'user');
    this.input.value = '';
    this.updateSendButton();
    
    // Start streaming response
    await this.streamResponse(message);
  }
  
  async streamResponse(message) {
    this.isStreaming = true;
    this.showTypingIndicator();
    
    // Create assistant message container
    const messageId = this.addStreamingMessage();
    
    try {
      const response = await fetch('/ai/chat-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId: this.sessionId
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              this.hideTypingIndicator();
              this.isStreaming = false;
              return;
            }
            
            try {
              const chunk = JSON.parse(data);
              this.handleStreamChunk(chunk, messageId);
            } catch (e) {
              console.error('Failed to parse chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      this.hideTypingIndicator();
      this.isStreaming = false;
      
      // Show error message
      this.updateStreamingMessage(messageId, 
        '❌ Sorry, I encountered an error. Please try again or check your connection.');
    }
  }
  
  handleStreamChunk(chunk, messageId) {
    if (chunk.type === 'connected') {
      this.sessionId = chunk.sessionId;
      localStorage.setItem('aria_session_id', this.sessionId);
      return;
    }
    
    if (chunk.type === 'text') {
      this.appendToStreamingMessage(messageId, chunk.content);
    } else if (chunk.type === 'error') {
      this.updateStreamingMessage(messageId, `❌ ${chunk.content}`);
      this.hideTypingIndicator();
      this.isStreaming = false;
    } else if (chunk.type === 'end') {
      this.hideTypingIndicator();
      this.isStreaming = false;
    }
  }
  
  async handleQuickAction(e) {
    const button = e.currentTarget;
    const action = button.dataset.action;
    
    if (!action || this.isStreaming) return;
    
    // Map actions to queries
    const queries = {
      'risk-analysis': 'Analyze my current risk landscape and provide recommendations',
      'compliance-check': 'Check our compliance status across all frameworks',
      'threat-analysis': 'Analyze recent threat indicators and provide insights',
      'recommendations': 'Provide security recommendations based on our current posture'
    };
    
    const query = queries[action];
    if (query) {
      this.addMessage(query, 'user');
      await this.streamResponse(query);
    }
  }
  
  addMessage(content, sender) {
    const isUser = sender === 'user';
    const timestamp = new Date().toLocaleTimeString();
    
    const messageHTML = `
      <div class="message-container ${isUser ? 'user-message' : 'assistant-message'}">
        <div class="flex items-start space-x-3 ${isUser ? 'justify-end' : ''}">
          ${isUser ? '' : `
            <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <i class="fas fa-brain text-blue-600 text-sm"></i>
            </div>
          `}
          <div class="flex-1 ${isUser ? 'max-w-xs text-right' : ''}">
            <div class="${isUser ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100'} rounded-xl p-3 shadow-sm ${isUser ? 'inline-block' : ''}">
              ${!isUser ? `
                <div class="flex items-center mb-2">
                  <span class="font-semibold text-gray-800 text-sm">ARIA Assistant</span>
                  <span class="ml-2 text-xs text-gray-500">${timestamp}</span>
                </div>
              ` : ''}
              <div class="${isUser ? 'text-white' : 'text-gray-700'} text-sm leading-relaxed">
                ${this.formatMessage(content)}
              </div>
            </div>
            ${isUser ? `<p class="text-xs text-gray-500 mt-1">You • ${timestamp}</p>` : ''}
          </div>
          ${isUser ? `
            <div class="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <i class="fas fa-user text-white text-sm"></i>
            </div>
          ` : ''}
        </div>
      </div>
    `;
    
    this.messages.insertAdjacentHTML('beforeend', messageHTML);
    this.scrollToBottom();
    
    // Save to history
    this.conversationHistory.push({ content, sender, timestamp });
    this.saveConversationHistory();
  }
  
  addStreamingMessage() {
    const messageId = `msg-${Date.now()}`;
    const timestamp = new Date().toLocaleTimeString();
    
    const messageHTML = `
      <div id="${messageId}" class="message-container assistant-message">
        <div class="flex items-start space-x-3">
          <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <i class="fas fa-brain text-blue-600 text-sm"></i>
          </div>
          <div class="flex-1">
            <div class="bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
              <div class="flex items-center mb-2">
                <span class="font-semibold text-gray-800 text-sm">ARIA Assistant</span>
                <span class="ml-2 text-xs text-gray-500">${timestamp}</span>
              </div>
              <div class="text-gray-700 text-sm leading-relaxed streaming-content"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.messages.insertAdjacentHTML('beforeend', messageHTML);
    this.currentMessageId = messageId;
    this.hideTypingIndicator();
    
    return messageId;
  }
  
  appendToStreamingMessage(messageId, content) {
    const message = document.getElementById(messageId);
    if (message) {
      const contentDiv = message.querySelector('.streaming-content');
      if (contentDiv) {
        contentDiv.innerHTML += this.formatMessage(content);
        this.scrollToBottom();
      }
    }
  }
  
  updateStreamingMessage(messageId, content) {
    const message = document.getElementById(messageId);
    if (message) {
      const contentDiv = message.querySelector('.streaming-content');
      if (contentDiv) {
        contentDiv.innerHTML = this.formatMessage(content);
      }
    }
  }
  
  formatMessage(text) {
    // Convert markdown to HTML
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>')
      .replace(/• /g, '• ')
      .replace(/^\d+\. /gm, '<br>$&')
      .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-1 rounded">$1</code>');
    
    // Highlight important terms
    formatted = formatted
      .replace(/\b(critical|high|urgent)\b/gi, '<span class="text-red-600 font-semibold">$1</span>')
      .replace(/\b(medium|moderate|warning)\b/gi, '<span class="text-yellow-600 font-semibold">$1</span>')
      .replace(/\b(low|info|informational)\b/gi, '<span class="text-green-600 font-semibold">$1</span>');
    
    return formatted;
  }
  
  showTypingIndicator() {
    this.typingIndicator?.classList.remove('hidden');
    this.scrollToBottom();
  }
  
  hideTypingIndicator() {
    this.typingIndicator?.classList.add('hidden');
  }
  
  showNotification() {
    this.notification?.classList.remove('hidden');
  }
  
  hideNotification() {
    this.notification?.classList.add('hidden');
  }
  
  handleInputChange() {
    this.updateSendButton();
    this.autoResizeTextarea();
  }
  
  handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.handleSubmission(e);
    }
  }
  
  updateSendButton() {
    const hasText = this.input?.value.trim().length > 0;
    
    if (hasText && !this.isStreaming) {
      this.sendButton.disabled = false;
      this.sendButton.className = 'bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-xl transition-all duration-200 flex items-center justify-center';
    } else {
      this.sendButton.disabled = true;
      this.sendButton.className = 'bg-gray-300 text-gray-500 w-12 h-12 rounded-xl transition-all duration-200 flex items-center justify-center disabled:cursor-not-allowed';
    }
  }
  
  autoResizeTextarea() {
    if (this.input) {
      this.input.style.height = 'auto';
      this.input.style.height = Math.min(this.input.scrollHeight, 120) + 'px';
    }
  }
  
  scrollToBottom() {
    if (this.messages) {
      setTimeout(() => {
        this.messages.scrollTop = this.messages.scrollHeight;
      }, 50);
    }
  }
  
  loadConversationHistory() {
    const saved = localStorage.getItem('aria_conversation');
    if (saved) {
      try {
        this.conversationHistory = JSON.parse(saved);
      } catch (e) {
        this.conversationHistory = [];
      }
    }
  }
  
  saveConversationHistory() {
    // Keep only last 50 messages
    if (this.conversationHistory.length > 50) {
      this.conversationHistory = this.conversationHistory.slice(-50);
    }
    localStorage.setItem('aria_conversation', JSON.stringify(this.conversationHistory));
  }
}

// Initialize chatbot when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ariaChatbot = new EnhancedARIAChatbot();
  });
} else {
  window.ariaChatbot = new EnhancedARIAChatbot();
}

// Add required styles
const styles = `
<style>
.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 12px;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.quick-action-btn:hover {
  background: #f9fafb;
  border-color: #3b82f6;
}

.quick-action-btn i {
  font-size: 12px;
}

.typing-dots {
  display: flex;
  align-items: center;
  gap: 4px;
}

.typing-dot {
  width: 8px;
  height: 8px;
  background: #9ca3af;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dot:nth-child(1) { animation-delay: -0.32s; }
.typing-dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes typing {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}

.streaming-content {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', styles);

// Auto-initialize the chatbot when the script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ariaChatbot = new EnhancedARIAChatbot();
    console.log('🤖 ARIA Chatbot auto-initialized on DOMContentLoaded');
  });
} else {
  // DOM is already ready
  window.ariaChatbot = new EnhancedARIAChatbot();
  console.log('🤖 ARIA Chatbot auto-initialized immediately');
}