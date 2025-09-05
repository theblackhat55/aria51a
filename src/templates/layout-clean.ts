import { html } from 'hono/html';

interface LayoutProps {
  title: string;
  content: any;
  user?: any;
}

export const cleanLayout = ({ title, content, user }: LayoutProps) => html`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ARIA5.1</title>
  

  
  <!-- Essential CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/css/all.min.css" rel="stylesheet">
  
  <!-- Preload Font Awesome -->
  <link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.6.0/webfonts/fa-solid-900.woff2" as="font" type="font/woff2" crossorigin>
  
  <style>
    /* Ensure Font Awesome loads properly */
    .fas, .far, .fab, .fal {
      font-family: "Font Awesome 6 Free" !important;
      font-weight: 900;
      display: inline-block;
      font-style: normal;
      font-variant: normal;
      text-rendering: auto;
      line-height: 1;
    }
  </style>
  
  <!-- HTMX -->
  <script src="https://unpkg.com/htmx.org@1.9.10"></script>
  
  <style>
    /* Dropdown animations */
    .dropdown-enter { opacity: 0; transform: scale(0.95) translateY(-10px); }
    .dropdown-enter-active { opacity: 1; transform: scale(1) translateY(0); transition: all 0.15s ease-out; }
    .dropdown-leave { opacity: 1; transform: scale(1) translateY(0); }
    .dropdown-leave-active { opacity: 0; transform: scale(0.95) translateY(-10px); transition: all 0.15s ease-in; }
    
    /* Loading states */
    .htmx-indicator { display: none; }
    .htmx-request .htmx-indicator { display: inline; }
    .htmx-request.htmx-indicator { display: inline; }
    
    /* Ensure dropdowns are hidden by default */
    .dropdown-menu { display: none; }
    .dropdown-menu.show { display: block; }
    
    /* Modal positioning and overlay fixes */
    #modal-container {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9999;
      pointer-events: none; /* Allow clicks through empty space */
    }
    
    #modal-container > * {
      pointer-events: auto; /* Re-enable clicks on modal content */
    }
    
    #modal-container .fixed {
      position: fixed !important;
      z-index: 9999 !important;
    }
    
    /* Hide empty modal container */
    #modal-container:empty {
      display: none;
    }
    
    /* Show modal container when it has content */
    #modal-container:not(:empty) {
      display: block;
    }
    
    /* Prevent body scroll when modal is open */
    body.modal-open {
      overflow: hidden;
    }
  </style>
</head>
<body class="bg-gray-50 font-sans antialiased">
  ${user ? renderCleanNavigation(user) : ''}
  
  <main id="main-content">
    ${content}
  </main>
  
  <!-- Global loading indicator -->
  <div class="htmx-indicator fixed top-4 right-4 z-50">
    <div class="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
      <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
      <span>Loading...</span>
    </div>
  </div>
  
  <!-- Modal container -->
  <div id="modal-container"></div>

  <script>
    // Simple, reliable dropdown functionality
    window.ARIA5 = window.ARIA5 || {};
    
    // Initialize dropdowns with vanilla JavaScript
    window.ARIA5.initDropdowns = function() {
      console.log('🔄 Initializing ARIA5 dropdowns');
      
      // Find all dropdowns (both new and existing)
      const dropdowns = document.querySelectorAll('[data-dropdown]');
      console.log('🔍 Found', dropdowns.length, 'dropdowns to initialize');
      
      dropdowns.forEach((dropdown, index) => {
        const button = dropdown.querySelector('[data-dropdown-button]');
        const menu = dropdown.querySelector('[data-dropdown-menu]');
        
        // Skip if elements don't exist
        if (!button || !menu) {
          console.log('⚠️ Dropdown elements missing for dropdown', index);
          return;
        }
        
        if (!button || !menu) {
          console.warn('⚠️ Dropdown', index, 'missing button or menu');
          return;
        }
        
        // Skip if already initialized (check for existing handler)
        if (button._aria5Initialized) {
          console.log('⏭️ Dropdown', index, 'already initialized');
          return;
        }
        
        // Mark as initialized
        button._aria5Initialized = true;
        
        // Create click handler
        button._aria5Handler = function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          const isOpen = menu.classList.contains('show');
          
          // Close all other dropdowns
          document.querySelectorAll('.dropdown-menu.show').forEach(otherMenu => {
            if (otherMenu !== menu) {
              otherMenu.classList.remove('show');
            }
          });
          
          // Toggle current dropdown
          if (isOpen) {
            menu.classList.remove('show');
          } else {
            menu.classList.add('show');
          }
          
          console.log('🎯 Dropdown', index, isOpen ? 'closed' : 'opened');
        };
        
        button.addEventListener('click', button._aria5Handler);
        console.log('✅ Dropdown', index, 'initialized');
      });
      
      // Ensure outside click handler is only added once
      if (!window.ARIA5.outsideClickHandlerAdded) {
        document.addEventListener('click', function(e) {
          const clickedDropdown = e.target.closest('[data-dropdown]');
          if (!clickedDropdown) {
            document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
              menu.classList.remove('show');
            });
          }
        });
        window.ARIA5.outsideClickHandlerAdded = true;
        console.log('👆 Outside click handler added');
      }
      
      console.log('✅ ARIA5 dropdowns initialization complete');
    };
    
    // HTMX Configuration
    document.addEventListener('DOMContentLoaded', function() {
      console.log('🚀 ARIA5.1 Clean Layout - Initializing');
      
      // Initialize dropdowns
      window.ARIA5.initDropdowns();
      
      // HTMX Authentication and CSRF
      document.body.addEventListener('htmx:configRequest', function(event) {
        console.log('📡 HTMX request to:', event.detail.path);
        
        // Add auth token if available
        const token = localStorage.getItem('aria_token');
        if (token) {
          event.detail.headers['Authorization'] = 'Bearer ' + token;
        }
        
        // Add CSRF token from meta tag or form field
        const csrfMeta = document.querySelector('meta[name="csrf-token"]');
        if (csrfMeta) {
          event.detail.headers['X-CSRF-Token'] = csrfMeta.content;
        } else {
          // Try to get CSRF token from the form being submitted
          const form = event.detail.elt.closest('form');
          if (form) {
            const csrfInput = form.querySelector('input[name="csrf_token"]');
            if (csrfInput && csrfInput.value) {
              event.detail.headers['X-CSRF-Token'] = csrfInput.value;
            }
          }
        }
      });
      
      // Modal management
      document.body.addEventListener('htmx:afterSwap', function(event) {
        const target = event.target;
        if (target && target.id === 'modal-container') {
          const modal = target.querySelector('.fixed.inset-0');
          if (modal) {
            // Modal opened - prevent body scroll
            document.body.classList.add('modal-open');
          } else if (target.innerHTML.trim() === '') {
            // Modal closed - restore body scroll
            document.body.classList.remove('modal-open');
          }
        }
      });
      
      // Close modal when clicking outside
      document.addEventListener('click', function(event) {
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer && event.target === modalContainer.querySelector('.fixed.inset-0')) {
          modalContainer.innerHTML = '';
          document.body.classList.remove('modal-open');
        }
      });
      
      // HTMX Error handling
      document.body.addEventListener('htmx:responseError', function(event) {
        const status = event.detail.xhr.status;
        console.error('❌ HTMX Error:', status);
        
        if (status === 401) {
          console.log('🔐 Redirecting to login');
          localStorage.removeItem('aria_token');
          window.location.href = '/login';
        } else if (status === 404) {
          console.warn('⚠️ 404 Error for:', event.detail.requestConfig.path);
          if (event.detail.target) {
            event.detail.target.innerHTML = '<div class="text-gray-500 p-4 text-center">Content not available</div>';
          }
        }
      });
      
      // Success handler
      document.body.addEventListener('htmx:afterRequest', function(event) {
        if (event.detail.xhr.status >= 200 && event.detail.xhr.status < 300) {
          console.log('✅ HTMX success for:', event.detail.requestConfig.path);
        }
      });
      
      // Handle modal open/close events
      document.body.addEventListener('htmx:afterSwap', function(event) {
        console.log('🔄 Re-initializing dropdowns after HTMX swap');
        window.ARIA5.initDropdowns();
        
        // Check if modal content was loaded
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer && modalContainer.innerHTML.trim() !== '') {
          document.body.classList.add('modal-open');
          console.log('🔓 Modal opened, body scroll disabled');
        }
      });
      
      // Also re-initialize after settle (for animations)
      document.body.addEventListener('htmx:afterSettle', function(event) {
        console.log('🔄 Re-initializing dropdowns after HTMX settle');
        window.ARIA5.initDropdowns();
        
        // Add click handler to close modal when clicking backdrop
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer && modalContainer.innerHTML.trim() !== '') {
          const backdrop = modalContainer.querySelector('.bg-gray-500.bg-opacity-75');
          if (backdrop) {
            backdrop.addEventListener('click', function(e) {
              if (e.target === backdrop) {
                modalContainer.innerHTML = '';
                document.body.classList.remove('modal-open');
                console.log('🔒 Modal closed via backdrop click');
              }
            });
          }
        }
      });
      
      console.log('✅ ARIA5.1 Clean Layout - Ready');
    });
  </script>

  <!-- AI Assistant Chatbot Widget -->
  <div id="chatbot-widget" class="fixed bottom-6 right-6 z-50">
    <!-- Chatbot Toggle Button -->
    <button id="chatbot-toggle" 
            class="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group">
      <i class="fas fa-robot text-xl group-hover:scale-110 transition-transform"></i>
    </button>
    
    <!-- Chatbot Panel -->
    <div id="chatbot-panel" 
         class="hidden absolute bottom-16 right-0 w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col">
      <!-- Header -->
      <div class="bg-blue-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div class="flex items-center">
          <i class="fas fa-robot mr-2"></i>
          <span class="font-medium">AI Risk Assistant</span>
          <span class="ml-2 text-xs bg-blue-500 px-2 py-1 rounded">Powered by Cloudflare AI</span>
        </div>
        <button id="chatbot-close" class="hover:bg-blue-500 rounded p-1">
          <i class="fas fa-times text-sm"></i>
        </button>
      </div>
      
      <!-- Messages Area -->
      <div id="chatbot-messages" class="flex-1 p-4 overflow-y-auto space-y-3">
        <div class="bg-gray-100 rounded-lg p-3 text-sm">
          <div class="flex items-center mb-1">
            <i class="fas fa-robot text-blue-600 mr-2"></i>
            <span class="font-medium text-gray-800">AI Assistant</span>
          </div>
          <p class="text-gray-700">
            Hello! I'm your AI Risk Management Assistant. I can help you with:
          </p>
          <ul class="mt-2 text-gray-600 text-xs space-y-1">
            <li>• Risk analysis and assessment</li>
            <li>• Compliance guidance</li>
            <li>• Control recommendations</li>
            <li>• Best practices advice</li>
          </ul>
          <p class="text-gray-600 text-xs mt-2">How can I assist you today?</p>
        </div>
      </div>
      
      <!-- Input Area -->
      <div class="border-t border-gray-200 p-4">
        <form id="chatbot-form" class="flex space-x-2">
          <input type="text" 
                 id="chatbot-input" 
                 placeholder="Ask about risk management..." 
                 class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <button type="submit" 
                  class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            <i class="fas fa-paper-plane text-sm"></i>
          </button>
        </form>
      </div>
    </div>
  </div>

  <script>
    // Chatbot Widget Functionality
    document.addEventListener('DOMContentLoaded', function() {
      const toggle = document.getElementById('chatbot-toggle');
      const panel = document.getElementById('chatbot-panel');
      const close = document.getElementById('chatbot-close');
      const form = document.getElementById('chatbot-form');
      const input = document.getElementById('chatbot-input');
      const messages = document.getElementById('chatbot-messages');
      
      // Toggle chatbot
      toggle.addEventListener('click', () => {
        panel.classList.toggle('hidden');
        if (!panel.classList.contains('hidden')) {
          input.focus();
        }
      });
      
      // Close chatbot
      close.addEventListener('click', () => {
        panel.classList.add('hidden');
      });
      
      // Handle form submission
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = input.value.trim();
        if (!query) return;
        
        // Add user message
        addMessage(query, 'user');
        input.value = '';
        
        // Add loading indicator
        const loadingId = addMessage('Thinking...', 'assistant', true);
        
        try {
          // Call AI assistant API
          const response = await fetch('/ai/chat-json', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: query })
          });
          
          const data = await response.json();
          
          // Remove loading message
          document.getElementById(loadingId).remove();
          
          // Add AI response
          addMessage(data.response || 'Sorry, I could not process your request.', 'assistant');
        } catch (error) {
          // Remove loading message
          document.getElementById(loadingId).remove();
          addMessage('Sorry, I encountered an error. Please try again.', 'assistant');
        }
      });
      
      function addMessage(text, sender, isLoading = false) {
        const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const isUser = sender === 'user';
        
        const messageDiv = document.createElement('div');
        messageDiv.id = messageId;
        messageDiv.className = isUser 
          ? 'bg-blue-600 text-white rounded-lg p-3 text-sm ml-8' 
          : 'bg-gray-100 rounded-lg p-3 text-sm mr-8';
        
        if (!isUser) {
          messageDiv.innerHTML = \`
            <div class="flex items-center mb-1">
              <i class="fas fa-robot text-blue-600 mr-2"></i>
              <span class="font-medium text-gray-800">AI Assistant</span>
            </div>
            <p class="text-gray-700">\${isLoading ? '<i class="fas fa-spinner fa-spin mr-1"></i>' + text : text}</p>
          \`;
        } else {
          messageDiv.innerHTML = \`<p>\${text}</p>\`;
        }
        
        messages.appendChild(messageDiv);
        messages.scrollTop = messages.scrollHeight;
        
        return messageId;
      }
    });
  </script>
</body>
</html>
`;

const renderCleanNavigation = (user: any) => html`
  <nav class="bg-white shadow-lg border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex justify-between items-center h-16">
        <!-- Logo and Brand -->
        <div class="flex items-center space-x-3">
          <a href="/dashboard" class="flex items-center space-x-3">
            <div class="h-10 w-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <i class="fas fa-shield-alt text-white"></i>
            </div>
            <div>
              <h1 class="text-xl font-semibold text-gray-900">ARIA5.1</h1>
              <p class="text-xs text-gray-500">Clean Edition</p>
            </div>
          </a>
        </div>
        
        <!-- Navigation Menu -->
        <div class="hidden md:flex items-center space-x-2">
          <!-- Overview Dropdown -->
          <div class="relative" data-dropdown>
            <button data-dropdown-button class="flex items-center space-x-1 text-gray-700 hover:text-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <i class="fas fa-chart-line mr-1"></i>
              <span>Overview</span>
              <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div data-dropdown-menu class="dropdown-menu absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div class="py-2">
                <a href="/dashboard" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700">
                  <i class="fas fa-tachometer-alt w-5 text-blue-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Dashboard</div>
                    <div class="text-xs text-gray-500">Main overview and metrics</div>
                  </div>
                </a>
                <a href="/reports" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700">
                  <i class="fas fa-chart-bar w-5 text-green-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Reports & Analytics</div>
                    <div class="text-xs text-gray-500">Generate reports</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          
          <!-- Risk Dropdown -->
          <div class="relative" data-dropdown>
            <button data-dropdown-button class="flex items-center space-x-1 text-gray-700 hover:text-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <i class="fas fa-exclamation-triangle mr-1"></i>
              <span>Risk</span>
              <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div data-dropdown-menu class="dropdown-menu absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div class="py-2">
                <a href="/risk" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700">
                  <i class="fas fa-shield-alt w-5 text-red-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Risk Register</div>
                    <div class="text-xs text-gray-500">View and manage risks</div>
                  </div>
                </a>
                <a href="/risk/create" hx-get="/risk/create" hx-target="#modal-container" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700">
                  <i class="fas fa-plus w-5 text-orange-500 mr-3"></i>
                  <div>
                    <div class="font-medium">New Risk</div>
                    <div class="text-xs text-gray-500">Register new threat</div>
                  </div>
                </a>
                <a href="/risk/assessments" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700">
                  <i class="fas fa-clipboard-check w-5 text-yellow-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Assessments</div>
                    <div class="text-xs text-gray-500">Risk evaluations</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          
          <!-- Compliance Dropdown -->
          <div class="relative" data-dropdown>
            <button data-dropdown-button class="flex items-center space-x-1 text-gray-700 hover:text-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <i class="fas fa-clipboard-check mr-1"></i>
              <span>Compliance</span>
              <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div data-dropdown-menu class="dropdown-menu absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div class="py-2">
                <a href="/compliance/frameworks" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700">
                  <i class="fas fa-layer-group w-5 text-blue-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Framework Management</div>
                    <div class="text-xs text-gray-500">SOC 2, ISO 27001, Custom</div>
                  </div>
                </a>
                <a href="/compliance/soa" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700">
                  <i class="fas fa-file-contract w-5 text-purple-500 mr-3"></i>
                  <div>
                    <div class="font-medium">SoA</div>
                    <div class="text-xs text-gray-500">Statement of Applicability</div>
                  </div>
                </a>
                <a href="/compliance/evidence" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700">
                  <i class="fas fa-folder-open w-5 text-orange-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Evidence</div>
                    <div class="text-xs text-gray-500">Documentation & Proof</div>
                  </div>
                </a>
                <a href="/compliance/assessments" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700">
                  <i class="fas fa-clipboard-check w-5 text-green-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Assessments</div>
                    <div class="text-xs text-gray-500">Compliance Audits</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          
          <!-- Operations Dropdown -->
          <div class="relative" data-dropdown>
            <button data-dropdown-button class="nav-item flex items-center space-x-1 text-gray-700 hover:text-green-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
              <i class="fas fa-cogs mr-1"></i>
              <span>Operations</span>
              <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div data-dropdown-menu class="dropdown-menu absolute left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div class="py-2">
                <a href="/operations" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                  <i class="fas fa-shield-alt w-5 text-blue-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Operations Center</div>
                    <div class="text-xs text-gray-500">Microsoft Defender & security operations</div>
                  </div>
                </a>
                <a href="/operations/assets" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                  <i class="fas fa-server w-5 text-green-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Asset Management</div>
                    <div class="text-xs text-gray-500">IT assets & infrastructure</div>
                  </div>
                </a>
                <a href="/operations/services" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                  <i class="fas fa-sitemap w-5 text-green-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Service Management</div>
                    <div class="text-xs text-gray-500">Business services & CIA ratings</div>
                  </div>
                </a>
                <a href="/documents" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                  <i class="fas fa-file-alt w-5 text-blue-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Document Management</div>
                    <div class="text-xs text-gray-500">Policies, procedures & documents</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          
          <!-- Intelligence -->
          <a href="/intelligence" class="flex items-center space-x-1 text-gray-700 hover:text-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <i class="fas fa-brain mr-1"></i>
            <span>Intelligence</span>
          </a>
          
          <!-- Admin (if admin user) -->
          ${user?.role === 'admin' ? html`
          <div class="relative" data-dropdown>
            <button data-dropdown-button class="flex items-center space-x-1 text-gray-700 hover:text-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <i class="fas fa-user-shield mr-1"></i>
              <span>Admin</span>
              <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div data-dropdown-menu class="dropdown-menu absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div class="py-2">
                <a href="/admin" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700">
                  <i class="fas fa-cogs w-5 text-purple-500 mr-3"></i>
                  <div>
                    <div class="font-medium">System Settings</div>
                    <div class="text-xs text-gray-500">Configuration</div>
                  </div>
                </a>
                <a href="/admin/users" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700">
                  <i class="fas fa-users w-5 text-indigo-500 mr-3"></i>
                  <div>
                    <div class="font-medium">User Management</div>
                    <div class="text-xs text-gray-500">Manage users and roles</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          ` : ''}
        </div>
        
        <!-- Right side: Notifications + User -->
        <div class="flex items-center space-x-4">
          <!-- Notification Bell (Static) -->
          <div class="relative" data-dropdown>
            <button data-dropdown-button class="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none">
              <i class="fas fa-bell text-lg"></i>
              <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                3
              </span>
            </button>
            <div data-dropdown-menu class="dropdown-menu absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div class="p-4 border-b border-gray-100">
                <h3 class="text-sm font-semibold text-gray-900">Notifications</h3>
              </div>
              <div class="max-h-80 overflow-y-auto">
                <div class="p-4">
                  <div class="space-y-3">
                    <div class="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                      <i class="fas fa-exclamation-triangle text-red-500 mt-1"></i>
                      <div class="flex-1 text-sm">
                        <p class="font-medium text-gray-900">High Risk Alert</p>
                        <p class="text-gray-600">New critical risk identified</p>
                        <p class="text-xs text-gray-400 mt-1">2 minutes ago</p>
                      </div>
                    </div>
                    <div class="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                      <i class="fas fa-check-circle text-green-500 mt-1"></i>
                      <div class="flex-1 text-sm">
                        <p class="font-medium text-gray-900">Compliance Update</p>
                        <p class="text-gray-600">ISO 27001 audit completed</p>
                        <p class="text-xs text-gray-400 mt-1">1 hour ago</p>
                      </div>
                    </div>
                    <div class="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
                      <i class="fas fa-info-circle text-blue-500 mt-1"></i>
                      <div class="flex-1 text-sm">
                        <p class="font-medium text-gray-900">System Update</p>
                        <p class="text-gray-600">New features available</p>
                        <p class="text-xs text-gray-400 mt-1">3 hours ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- User Section -->
          <span class="text-sm text-gray-600">Welcome, ${user?.username || 'User'}</span>
          <button hx-post="/auth/logout" 
                  hx-redirect="/"
                  class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <i class="fas fa-sign-out-alt mr-1"></i>Logout
          </button>
        </div>
      </div>
    </div>
  </nav>
`;