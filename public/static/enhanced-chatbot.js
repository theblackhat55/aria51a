/**
 * Enhanced ARIA Chatbot with Streaming Support
 * Matches the HTML structure in layout-clean.ts
 * Version: 3.0.0
 */

class EnhancedARIAChatbot {
  constructor() {
    this.isOpen = false;
    this.isTyping = false;
    this.conversationHistory = [];
    this.sessionId = null;
    this.messageCount = 0;
    this.currentUser = null;
    
    // Initialize elements and events
    this.initializeElements();
    this.bindEvents();
    
    console.log('🤖 Enhanced ARIA Chatbot initialized successfully');
  }
  
  initializeElements() {
    // Get all chatbot elements
    this.toggle = document.getElementById('chatbot-toggle');
    this.panel = document.getElementById('chatbot-panel');
    this.close = document.getElementById('chatbot-close');
    this.minimize = document.getElementById('chatbot-minimize');
    this.form = document.getElementById('chatbot-form');
    this.input = document.getElementById('chatbot-input');
    this.messages = document.getElementById('chatbot-messages');
    this.sendButton = document.getElementById('send-button');
    this.charCounter = document.getElementById('char-counter');
    this.charCount = document.getElementById('char-count');
    this.typingIndicator = document.getElementById('typing-indicator');
    this.notification = document.getElementById('chatbot-notification');
    this.notificationCount = document.getElementById('notification-count');
    
    // Debug: Check if all elements were found
    const elements = {
      toggle: this.toggle,
      panel: this.panel,
      close: this.close,
      form: this.form,
      input: this.input,
      messages: this.messages,
      sendButton: this.sendButton
    };
    
    let missingElements = [];
    Object.keys(elements).forEach(key => {
      if (!elements[key]) {
        missingElements.push(key);
      }
    });
    
    if (missingElements.length > 0) {
      console.warn('⚠️ Missing chatbot elements:', missingElements);
      console.log('Available IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
    } else {
      console.log('✅ All chatbot elements found successfully');
    }
  }
  
  bindEvents() {
    // Toggle chatbot
    if (this.toggle) {
      console.log('🎯 Binding click event to chatbot toggle button');
      this.toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('🖱️ Chatbot toggle button clicked!');
        this.toggleChat();
      });
      console.log('✅ Chatbot toggle button event bound');
    }
    
    // Close chatbot
    if (this.close) {
      this.close.addEventListener('click', (e) => {
        e.preventDefault();
        this.closeChat();
      });
    }
    
    // Minimize chatbot
    if (this.minimize) {
      this.minimize.addEventListener('click', (e) => {
        e.preventDefault();
        this.minimizeChat();
      });
    }
    
    // Form submission
    if (this.form) {
      this.form.addEventListener('submit', (e) => this.handleSubmission(e));
    }
    
    // Input events
    if (this.input) {
      this.input.addEventListener('input', () => this.handleInputChange());
      this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }
    
    // Quick actions
    document.querySelectorAll('.quick-action-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.handleQuickAction(e));
    });
    
    // Additional action buttons
    document.getElementById('clear-chat')?.addEventListener('click', () => this.clearChat());
    document.getElementById('voice-input')?.addEventListener('click', () => this.startVoiceInput());
    
    // Click outside to close
    document.addEventListener('click', (e) => {
      if (this.isOpen && this.panel && !this.panel.contains(e.target) && !this.toggle.contains(e.target)) {
        this.closeChat();
      }
    });
  }
  
  toggleChat() {
    console.log('🔄 Toggle chat called, current state:', this.isOpen);
    if (this.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }
  
  openChat() {
    console.log('📖 Opening chat...');
    this.isOpen = true;
    
    if (this.panel) {
      this.panel.classList.remove('hidden');
      this.panel.classList.add('show');
      
      // Focus on input
      setTimeout(() => {
        if (this.input) {
          this.input.focus();
        }
      }, 300);
    }
    
    this.hideNotification();
  }
  
  closeChat() {
    console.log('📕 Closing chat...');
    this.isOpen = false;
    
    if (this.panel) {
      this.panel.classList.add('hide');
      setTimeout(() => {
        this.panel.classList.add('hidden');
        this.panel.classList.remove('show', 'hide');
      }, 200);
    }
  }
  
  minimizeChat() {
    console.log('📄 Minimizing chat...');
    this.closeChat();
    this.showNotification(1);
  }
  
  handleSubmission(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const message = this.input?.value.trim();
    if (!message || this.isTyping) return;
    
    console.log('📤 Sending message:', message);
    this.sendMessage(message);
  }
  
  handleInputChange() {
    const length = this.input?.value.length || 0;
    
    // Update character counter
    if (this.charCount) {
      this.charCount.textContent = length;
    }
    
    if (this.charCounter) {
      this.charCounter.classList.toggle('hidden', length === 0);
    }
    
    // Update send button state
    if (this.sendButton) {
      const hasText = length > 0;
      this.sendButton.disabled = !hasText;
      this.sendButton.className = hasText 
        ? 'bg-blue-600 text-white w-12 h-12 rounded-xl transition-all duration-200 flex items-center justify-center hover:bg-blue-700'
        : 'bg-gray-300 text-gray-500 w-12 h-12 rounded-xl transition-all duration-200 flex items-center justify-center disabled:cursor-not-allowed';
    }
    
    // Auto-resize textarea
    if (this.input) {
      this.input.style.height = 'auto';
      this.input.style.height = Math.min(this.input.scrollHeight, 120) + 'px';
    }
  }
  
  handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.handleSubmission(e);
    }
  }
  
  handleQuickAction(e) {
    e.preventDefault();
    const prompt = e.currentTarget.getAttribute('data-prompt');
    if (prompt) {
      console.log('⚡ Quick action:', prompt);
      this.sendMessage(prompt);
    }
  }
  
  sendMessage(message) {
    if (!message.trim() || this.isTyping) return;
    
    // Clear input
    if (this.input) {
      this.input.value = '';
      this.handleInputChange();
    }
    
    // Add user message
    this.addMessage(message, 'user');
    
    // Show typing indicator
    this.showTyping();
    
    // Make API call
    this.makeAPICall(message);
  }
  
  async makeAPICall(message) {
    try {
      // Generate session ID if not exists
      if (!this.sessionId) {
        this.sessionId = `chatbot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
      
      console.log('🌐 Making API call to /ai/chat-json');
      
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
      
      console.log('📡 API Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📦 API Response data:', data);
      
      this.hideTyping();
      
      const aiResponse = data.response || 'Sorry, I could not process your request.';
      this.addMessage(aiResponse, 'assistant');
      
    } catch (error) {
      console.error('❌ API Error:', error);
      this.hideTyping();
      
      let errorMessage;
      if (error.message.includes('401') || error.message.includes('403')) {
        errorMessage = '🔐 Please log in to use the AI Assistant. <a href="/login" class="text-blue-600 hover:underline">Click here to login</a>';
      } else if (error.message.includes('404')) {
        errorMessage = '🔍 The AI service is not available. Please try again later or contact support.';
      } else {
        errorMessage = '🤖 I\'m experiencing connection issues. Please check your connection and try again.';
      }
      
      this.addMessage(errorMessage, 'assistant', true);
    }
  }
  
  addMessage(content, type, isHTML = false) {
    if (!this.messages) return;
    
    console.log('💬 Adding message:', { content: content.substring(0, 100), type });
    
    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container ' + type + '-message';
    
    const messageHTML = type === 'user' 
      ? this.createUserMessage(content)
      : this.createAssistantMessage(content, isHTML);
    
    messageContainer.innerHTML = messageHTML;
    this.messages.appendChild(messageContainer);
    
    // Scroll to bottom
    this.scrollToBottom();
    
    // Save to history
    this.conversationHistory.push({ content, type, timestamp: Date.now() });
    if (this.conversationHistory.length > 50) {
      this.conversationHistory = this.conversationHistory.slice(-50);
    }
    
    this.messageCount++;
  }
  
  createUserMessage(content) {
    const time = new Date().toLocaleTimeString();
    return `
      <div class="flex items-start space-x-3 flex-row-reverse">
        <div class="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <i class="fas fa-user text-white text-sm"></i>
        </div>
        <div class="flex-1 text-right">
          <div class="bg-blue-600 text-white rounded-xl p-3 shadow-sm inline-block">
            <p class="text-sm">${this.escapeHtml(content)}</p>
          </div>
          <p class="text-xs text-gray-500 mt-1">${time}</p>
        </div>
      </div>
    `;
  }
  
  createAssistantMessage(content, isHTML = false) {
    const time = new Date().toLocaleTimeString();
    const formattedContent = isHTML ? content : this.formatMessage(content);
    
    return `
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
          <i class="fas fa-robot text-blue-600 text-sm"></i>
        </div>
        <div class="flex-1">
          <div class="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <div class="flex items-center mb-2">
              <span class="font-semibold text-gray-800 text-sm">ARIA Assistant</span>
              <span class="ml-2 text-xs text-gray-500">${time}</span>
            </div>
            <div class="text-gray-700 text-sm leading-relaxed">${formattedContent}</div>
          </div>
        </div>
      </div>
    `;
  }
  
  formatMessage(text) {
    // Enhanced message formatting
    let formatted = this.escapeHtml(text);
    
    // Convert URLs to links
    formatted = formatted.replace(/https?:\/\/[^\s]+/g, '<a href="$&" target="_blank" class="text-blue-600 hover:underline">$&</a>');
    
    // Convert line breaks
    formatted = formatted.replace(/\n/g, '<br>');
    
    // Format markdown-style lists
    formatted = formatted.replace(/^• (.+)$/gm, '<div class="flex items-start"><span class="text-blue-600 mr-2">•</span><span>$1</span></div>');
    formatted = formatted.replace(/^\* (.+)$/gm, '<div class="flex items-start"><span class="text-blue-600 mr-2">•</span><span>$1</span></div>');
    
    // Format bold text
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');
    
    // Highlight security terms
    formatted = formatted.replace(/\b(CRITICAL|HIGH|URGENT)\b/gi, '<span class="bg-red-100 text-red-800 px-1 rounded font-semibold text-xs">$1</span>');
    formatted = formatted.replace(/\b(LOW|INFORMATIONAL)\b/gi, '<span class="bg-green-100 text-green-800 px-1 rounded text-xs">$1</span>');
    formatted = formatted.replace(/\b(MEDIUM|WARNING)\b/gi, '<span class="bg-yellow-100 text-yellow-800 px-1 rounded text-xs">$1</span>');
    
    return formatted;
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  showTyping() {
    this.isTyping = true;
    
    if (this.typingIndicator) {
      this.typingIndicator.classList.remove('hidden');
      this.scrollToBottom();
    }
  }
  
  hideTyping() {
    this.isTyping = false;
    
    if (this.typingIndicator) {
      this.typingIndicator.classList.add('hidden');
    }
  }
  
  scrollToBottom() {
    if (this.messages) {
      setTimeout(() => {
        this.messages.scrollTop = this.messages.scrollHeight;
      }, 100);
    }
  }
  
  clearChat() {
    if (confirm('Clear chat history?')) {
      this.conversationHistory = [];
      this.sessionId = null;
      
      // Clear messages but keep welcome message
      if (this.messages) {
        // Keep only the first message (welcome message)
        const welcomeMessage = this.messages.querySelector('.message-container');
        this.messages.innerHTML = '';
        if (welcomeMessage) {
          this.messages.appendChild(welcomeMessage);
        }
      }
      
      console.log('🗑️ Chat cleared');
    }
  }
  
  startVoiceInput() {
    console.log('🎤 Voice input feature not implemented yet');
    // TODO: Implement voice input using Web Speech API
  }
  
  showNotification(count = 1) {
    if (this.notification && this.notificationCount) {
      this.notificationCount.textContent = count.toString();
      this.notification.classList.remove('hidden');
    }
  }
  
  hideNotification() {
    if (this.notification) {
      this.notification.classList.add('hidden');
    }
  }
}

// Initialize chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  // Check if we should load the chatbot (skip on login page)
  const isLoginPage = window.location.pathname === '/login';
  const hasToggleButton = document.getElementById('chatbot-toggle');
  
  if (!isLoginPage && hasToggleButton) {
    console.log('🔍 Initializing Enhanced ARIA Chatbot...');
    
    // Wait a bit for DOM to be fully ready
    setTimeout(() => {
      window.ariaChatbot = new EnhancedARIAChatbot();
      console.log('✅ Enhanced ARIA Chatbot ready');
    }, 500);
  } else {
    console.log('ℹ️ Chatbot skipped:', { isLoginPage, hasToggleButton: !!hasToggleButton });
  }
});