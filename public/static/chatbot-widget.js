/**
 * Enhanced ARIA Chatbot Widget
 * Unified widget that works across all pages
 * Version: 2.0.0
 */

class ARIAChatbotWidget {
  constructor() {
    this.isOpen = false;
    this.isTyping = false;
    this.conversationHistory = [];
    this.sessionId = null;
    this.messageCount = 0;
    
    // Initialize DOM elements
    this.initializeElements();
    this.bindEvents();
    this.addWelcomeMessage();
    
    console.log('🤖 ARIA Chatbot Widget initialized');
  }
  
  initializeElements() {
    // Create widget HTML if it doesn't exist
    if (!document.getElementById('aria-chatbot-widget')) {
      this.createWidgetHTML();
    }
    
    this.widget = document.getElementById('aria-chatbot-widget');
    this.toggle = document.getElementById('chatbot-toggle');
    this.panel = document.getElementById('chatbot-panel');
    this.closeBtn = document.getElementById('chatbot-close');
    this.messagesContainer = document.getElementById('chatbot-messages');
    this.input = document.getElementById('chatbot-input');
    this.sendBtn = document.getElementById('chatbot-send');
    this.charCount = document.getElementById('char-count');
  }
  
  createWidgetHTML() {
    const widgetHTML = `
      <div id="aria-chatbot-widget" class="fixed bottom-6 right-6 z-50">
        <!-- Toggle Button -->
        <button id="chatbot-toggle" 
                class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-300">
          <i class="fas fa-comments text-xl"></i>
        </button>
        
        <!-- Chat Panel -->
        <div id="chatbot-panel" class="hidden absolute bottom-16 right-0 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          <!-- Header -->
          <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div class="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <i class="fas fa-robot text-sm"></i>
              </div>
              <div>
                <h3 class="font-semibold text-sm">ARIA Assistant</h3>
                <p class="text-xs opacity-75">AI Risk Intelligence</p>
              </div>
            </div>
            <button id="chatbot-close" class="hover:bg-white hover:bg-opacity-10 p-1 rounded transition-colors">
              <i class="fas fa-times text-sm"></i>
            </button>
          </div>
          
          <!-- Messages Container -->
          <div id="chatbot-messages" class="flex-1 overflow-y-auto p-4 space-y-3">
            <!-- Messages will be added here -->
          </div>
          
          <!-- Input Area -->
          <div class="border-t border-gray-200 p-4">
            <div class="flex space-x-2">
              <input type="text" 
                     id="chatbot-input" 
                     placeholder="Ask about risks, compliance, security..." 
                     class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                     maxlength="500">
              <button id="chatbot-send" 
                      class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500">
                <i class="fas fa-paper-plane text-sm"></i>
              </button>
            </div>
            <div class="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span id="char-count">0/500</span>
              <div class="flex space-x-2">
                <button id="clear-chat" class="hover:text-blue-600 transition-colors" title="Clear conversation">
                  <i class="fas fa-eraser"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', widgetHTML);
  }
  
  bindEvents() {
    // Toggle button
    this.toggle?.addEventListener('click', () => this.toggleChat());
    
    // Close button
    this.closeBtn?.addEventListener('click', () => this.closeChat());
    
    // Send button
    this.sendBtn?.addEventListener('click', () => this.sendMessage());
    
    // Enter key to send
    this.input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    
    // Character counter
    this.input?.addEventListener('input', () => this.updateCharCount());
    
    // Clear chat button
    document.getElementById('clear-chat')?.addEventListener('click', () => this.clearChat());
    
    // Click outside to close
    document.addEventListener('click', (e) => {
      if (this.isOpen && this.widget && !this.widget.contains(e.target)) {
        this.closeChat();
      }
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
    this.isOpen = true;
    this.panel?.classList.remove('hidden');
    this.input?.focus();
  }
  
  closeChat() {
    this.isOpen = false;
    this.panel?.classList.add('hidden');
  }
  
  clearChat() {
    if (confirm('Clear chat history?')) {
      this.conversationHistory = [];
      this.messagesContainer.innerHTML = '';
      this.addWelcomeMessage();
      localStorage.removeItem('aria_chat_history');
    }
  }
  
  sendMessage() {
    const message = this.input?.value.trim();
    if (!message || this.isTyping) return;
    
    // Add user message
    this.addMessage(message, 'user');
    this.input.value = '';
    this.updateCharCount();
    
    // Show typing indicator
    this.showTyping();
    
    // Make API call
    this.makeAPICall(message);
  }
  
  async makeAPICall(message) {
    try {
      // Generate session ID if not exists
      if (!this.sessionId) {
        this.sessionId = `widget-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      
      const response = await fetch('/ai/chat-json', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ 
          message: message,
          sessionId: this.sessionId,
          timestamp: Date.now()
        })
      });
      
      this.hideTyping();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const aiResponse = data.response || 'Sorry, I could not process your request.';
      this.addMessage(aiResponse, 'assistant');
      
    } catch (error) {
      console.error('API Error:', error);
      this.hideTyping();
      
      let errorMessage;
      if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = '🔐 Please log in to use the AI Assistant. <a href="/login" class="text-blue-600 hover:underline">Click here to login</a>';
      } else {
        errorMessage = '🤖 I\'m experiencing connection issues. Please try again later or check your internet connection.';
      }
      
      this.addMessage(errorMessage, 'assistant');
    }
  }
  
  addMessage(content, type, isHTML = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `flex ${type === 'user' ? 'justify-end' : 'justify-start'}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = `max-w-xs lg:max-w-md px-4 py-2 rounded-lg text-sm ${
      type === 'user' 
        ? 'bg-blue-600 text-white' 
        : 'bg-gray-100 text-gray-800'
    }`;
    
    if (isHTML) {
      messageContent.innerHTML = content;
    } else {
      messageContent.innerHTML = this.formatMessage(content);
    }
    
    messageDiv.appendChild(messageContent);
    this.messagesContainer?.appendChild(messageDiv);
    this.scrollToBottom();
    
    // Save to history and localStorage
    this.conversationHistory.push({ content, type, timestamp: Date.now() });
    localStorage.setItem('aria_chat_history', JSON.stringify(this.conversationHistory.slice(-20))); // Keep last 20 messages
    this.messageCount++;
  }
  
  formatMessage(text) {
    // Enhanced message formatting
    let formatted = this.escapeHtml(text);
    
    // Convert URLs to links
    formatted = formatted.replace(/https?:\/\/[^\s]+/g, '<a href="$&" target="_blank" class="text-blue-600 hover:underline">$&</a>');
    
    // Convert line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Highlight security terms
    formatted = formatted.replace(/\b(CRITICAL|HIGH|URGENT)\b/gi, '<span class="bg-red-100 text-red-800 px-1 rounded font-semibold">$1</span>');
    formatted = formatted.replace(/\b(LOW|INFORMATIONAL)\b/gi, '<span class="bg-green-100 text-green-800 px-1 rounded">$1</span>');
    formatted = formatted.replace(/\b(MEDIUM|WARNING)\b/gi, '<span class="bg-yellow-100 text-yellow-800 px-1 rounded">$1</span>');
    
    return formatted;
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  showTyping() {
    this.isTyping = true;
    const typingDiv = document.createElement('div');
    typingDiv.id = 'typing-indicator';
    typingDiv.className = 'flex justify-start';
    typingDiv.innerHTML = `
      <div class="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg text-sm max-w-xs">
        <div class="flex items-center space-x-1">
          <div class="flex space-x-1">
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
            <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
          </div>
          <span class="text-gray-500">ARIA is thinking...</span>
        </div>
      </div>
    `;
    this.messagesContainer?.appendChild(typingDiv);
    this.scrollToBottom();
  }
  
  hideTyping() {
    this.isTyping = false;
    const typingIndicator = document.getElementById('typing-indicator');
    typingIndicator?.remove();
  }
  
  scrollToBottom() {
    if (this.messagesContainer) {
      this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
  }
  
  updateCharCount() {
    const length = this.input?.value.length || 0;
    if (this.charCount) {
      this.charCount.textContent = `${length}/500`;
      this.charCount.className = length > 450 ? 'text-red-500 text-xs' : 'text-gray-500 text-xs';
    }
  }
  
  addWelcomeMessage() {
    const welcomeMessage = `Hello! 👋 I'm ARIA, your AI Risk Intelligence Assistant.

I can help you with:
• Risk assessment and analysis
• Compliance framework guidance  
• Security recommendations
• Threat intelligence insights
• Operational risk management

How can I assist you today?`;
    
    this.addMessage(welcomeMessage, 'assistant');
  }
  
  // Load conversation history from localStorage
  loadConversationHistory() {
    const stored = localStorage.getItem('aria_chat_history');
    if (stored) {
      try {
        this.conversationHistory = JSON.parse(stored);
        this.conversationHistory.forEach(message => {
          this.addHistoryMessage(message.content, message.type);
        });
      } catch (e) {
        console.warn('Failed to load chat history:', e);
      }
    }
  }
  
  addHistoryMessage(content, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `flex ${type === 'user' ? 'justify-end' : 'justify-start'}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = `max-w-xs lg:max-w-md px-4 py-2 rounded-lg text-sm ${
      type === 'user' 
        ? 'bg-blue-600 text-white' 
        : 'bg-gray-100 text-gray-800'
    }`;
    
    messageContent.innerHTML = this.formatMessage(content);
    messageDiv.appendChild(messageContent);
    this.messagesContainer?.appendChild(messageDiv);
  }
}

// Initialize chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Check if we should load the widget (skip on login page)
  const isLoginPage = window.location.pathname === '/login';
  const hasExistingWidget = document.getElementById('aria-chatbot-widget');
  
  if (!isLoginPage && !hasExistingWidget) {
    console.log('🔍 Initializing ARIA Chatbot Widget...');
    window.ariaChatbot = new ARIAChatbotWidget();
    console.log('✅ ARIA Chatbot Widget ready');
  } else {
    console.log('ℹ️ Chatbot widget skipped (login page or already exists)');
  }
});