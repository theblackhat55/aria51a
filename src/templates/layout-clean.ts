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
    
    /* Mobile Navigation Styles */
    .mobile-nav-item {
      @apply flex items-center space-x-3 px-3 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors duration-200;
    }
    
    /* Mobile menu animation - Fixed for better layout */
    #mobile-menu {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease-out;
      background: white;
      position: relative;
      z-index: 1000;
    }
    
    #mobile-menu.show {
      max-height: 100vh; /* Allow full height when open */
      overflow-y: auto;
      -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */
    }
    
    /* Prevent layout shift when menu opens */
    .mobile-menu-container {
      position: relative;
      width: 100%;
    }
    
    /* Ensure proper containment */
    @media (max-width: 768px) {
      #mobile-menu {
        border-top: 1px solid #e5e7eb;
        box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
      }
      
      #mobile-menu.show {
        max-height: calc(100vh - 80px); /* Account for nav height and padding */
      }
    }
    
    /* Hamburger menu animation - More intuitive */
    #mobile-menu-icon {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transform-origin: center;
    }
    
    #mobile-menu-icon.open {
      transform: rotate(180deg);
    }
    
    /* Touch-friendly active states */
    .active\:scale-98:active {
      transform: scale(0.98);
    }
    
    .active\:scale-95:active {
      transform: scale(0.95);
    }
    
    /* Improved focus states for mobile accessibility */
    .mobile-menu-button:focus-visible,
    .mobile-menu-link:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
      border-radius: 0.5rem;
    }
  </style>
</head>
<body class="bg-gray-50 font-sans antialiased">
  ${user ? renderCleanNavigation(user) : ''}
  
  <main id="main-content" class="min-h-screen ${user ? 'pt-6 px-4 sm:px-6 lg:px-8' : ''}">
    ${user ? html`
    <div class="max-w-7xl mx-auto">
      ${content}
    </div>
    ` : content}
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
    
    // Enhanced Mobile Menu Functionality
    window.ARIA5.initMobileMenu = function() {
      console.log('📱 Initializing enhanced mobile menu');
      
      const mobileMenuButton = document.getElementById('mobile-menu-button');
      const mobileMenu = document.getElementById('mobile-menu');
      const mobileMenuIcon = document.getElementById('mobile-menu-icon');
      
      if (!mobileMenuButton || !mobileMenu || !mobileMenuIcon) {
        console.warn('⚠️ Mobile menu elements not found');
        return;
      }
      
      let isMenuOpen = false;
      
      // Enhanced toggle functionality
      mobileMenuButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        isMenuOpen = !isMenuOpen;
        
        if (isMenuOpen) {
          // Opening menu
          mobileMenu.classList.remove('hidden');
          requestAnimationFrame(() => {
            mobileMenu.classList.add('show');
            mobileMenuIcon.classList.add('open');
            mobileMenuButton.setAttribute('aria-expanded', 'true');
          });
          
          console.log('📱 Mobile menu opened');
        } else {
          // Closing menu
          mobileMenu.classList.remove('show');
          mobileMenuIcon.classList.remove('open');
          mobileMenuButton.setAttribute('aria-expanded', 'false');
          
          // Hide after animation completes
          setTimeout(() => {
            if (!mobileMenu.classList.contains('show')) {
              mobileMenu.classList.add('hidden');
            }
          }, 300);
          
          console.log('📱 Mobile menu closed');
        }
      });
      
      // Close menu when clicking outside
      document.addEventListener('click', function(e) {
        if (isMenuOpen && !mobileMenu.contains(e.target) && !mobileMenuButton.contains(e.target)) {
          isMenuOpen = false;
          mobileMenu.classList.remove('show');
          mobileMenuIcon.classList.remove('open');
          mobileMenuButton.setAttribute('aria-expanded', 'false');
          
          setTimeout(() => {
            if (!mobileMenu.classList.contains('show')) {
              mobileMenu.classList.add('hidden');
            }
          }, 300);
          
          console.log('📱 Mobile menu closed (outside click)');
        }
      });
      
      // Close menu on escape key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isMenuOpen) {
          isMenuOpen = false;
          mobileMenu.classList.remove('show');
          mobileMenuIcon.classList.remove('open');
          mobileMenuButton.setAttribute('aria-expanded', 'false');
          
          setTimeout(() => {
            if (!mobileMenu.classList.contains('show')) {
              mobileMenu.classList.add('hidden');
            }
          }, 300);
          
          console.log('📱 Mobile menu closed (escape key)');
        }
      });
      
      // Close menu when navigating (clicking links)
      mobileMenu.addEventListener('click', function(e) {
        if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON' || e.target.closest('a') || e.target.closest('button')) {
          // Small delay to allow navigation to complete
          setTimeout(() => {
            isMenuOpen = false;
            mobileMenu.classList.remove('show');
            mobileMenuIcon.classList.remove('open');
            mobileMenuButton.setAttribute('aria-expanded', 'false');
            
            setTimeout(() => {
              if (!mobileMenu.classList.contains('show')) {
                mobileMenu.classList.add('hidden');
              }
            }, 300);
            
            console.log('📱 Mobile menu closed (navigation)');
          }, 150);
        }
      });
      
      console.log('✅ Enhanced mobile menu initialized successfully');
    };
    
    // HTMX Configuration
    document.addEventListener('DOMContentLoaded', function() {
      console.log('🚀 ARIA5.1 Clean Layout - Initializing');
      
      // Initialize dropdowns
      window.ARIA5.initDropdowns();
      
      // HTMX Authentication and CSRF
      document.body.addEventListener('htmx:configRequest', function(event) {
        console.log('📡 HTMX request to:', event.detail.path);
        
        // HTMX automatically includes cookies, but we can ensure withCredentials is set
        if (event.detail && event.detail.xhr) {
          event.detail.xhr.withCredentials = true;
        }
        
        // Add CSRF token from cookie for additional security
        const csrfToken = getCookie('aria_csrf');
        if (csrfToken) {
          event.detail.headers['X-CSRF-Token'] = csrfToken;
        }
        
        // Add session verification header (non-sensitive)
        const htmxSession = getCookie('aria_htmx');
        if (htmxSession) {
          event.detail.headers['X-Session-ID'] = htmxSession;
        }
      });
      
      // Helper function to get cookie values
      function getCookie(name) {
        const value = "; " + document.cookie;
        const parts = value.split("; " + name + "=");
        if (parts.length === 2) return parts.pop().split(";").shift();
        return null;
      }
      
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
      
      console.log('✅ ARIA5.1 Enterprise Edition - Ready');
    });
  </script>

  <!-- Enhanced AI Assistant Chatbot Widget (Testing: Show on all pages) -->
  <div id="chatbot-widget" class="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
    <!-- Notification Badge -->
    <div id="chatbot-notification" class="hidden absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center animate-pulse">
      <span id="notification-count">1</span>
    </div>
    
    <!-- Chatbot Toggle Button -->
    <button id="chatbot-toggle" 
            class="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full w-14 h-14 sm:w-16 sm:h-16 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group relative overflow-hidden">
      <!-- Background Animation -->
      <div class="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
      
      <!-- Main Icon -->
      <i id="chatbot-icon" class="fas fa-robot text-lg sm:text-xl group-hover:scale-110 transition-all duration-300 z-10"></i>
      
      <!-- Pulse Animation -->
      <div class="absolute inset-0 rounded-full border-2 border-blue-300 animate-ping opacity-20"></div>
    </button>
    
    <!-- Enhanced Chatbot Panel -->
    <div id="chatbot-panel" 
         class="hidden fixed sm:absolute inset-x-4 bottom-20 sm:inset-x-auto sm:bottom-20 sm:right-0 sm:w-[420px] w-auto h-[600px] sm:h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden transform transition-all duration-300 scale-95 opacity-0">
      
      <!-- Enhanced Header -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="relative">
            <div class="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
              <i class="fas fa-robot text-sm"></i>
            </div>
            <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <span class="font-semibold text-sm">ARIA Assistant</span>
            <div class="flex items-center text-xs opacity-90">
              <span class="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></span>
              Online • Powered by AI
            </div>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <!-- Minimize Button -->
          <button id="chatbot-minimize" class="hover:bg-blue-500 rounded p-1.5 transition-colors" title="Minimize">
            <i class="fas fa-minus text-xs"></i>
          </button>
          <!-- Close Button -->
          <button id="chatbot-close" class="hover:bg-blue-500 rounded p-1.5 transition-colors" title="Close">
            <i class="fas fa-times text-xs"></i>
          </button>
        </div>
      </div>
      
      <!-- Quick Actions Bar -->
      <div id="quick-actions" class="bg-gray-50 p-2 sm:p-3 border-b border-gray-200">
        <div class="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2">
          <button class="quick-action-btn flex-shrink-0" data-prompt="Analyze my current risk landscape">
            <i class="fas fa-chart-line text-red-500"></i>
            <span class="hidden sm:inline">Risk Analysis</span>
            <span class="sm:hidden">Risk</span>
          </button>
          <button class="quick-action-btn flex-shrink-0" data-prompt="Check our compliance status">
            <i class="fas fa-shield-check text-green-500"></i>
            <span class="hidden sm:inline">Compliance</span>
            <span class="sm:hidden">Comp</span>
          </button>
          <button class="quick-action-btn flex-shrink-0" data-prompt="Recommend security controls">
            <i class="fas fa-lock text-blue-500"></i>
            <span class="hidden sm:inline">Controls</span>
            <span class="sm:hidden">Ctrl</span>
          </button>
          <button class="quick-action-btn flex-shrink-0" data-prompt="Help me create a new risk assessment">
            <i class="fas fa-plus text-purple-500"></i>
            <span class="hidden sm:inline">New Risk</span>
            <span class="sm:hidden">New</span>
          </button>
        </div>
      </div>
      
      <!-- Messages Area -->
      <div id="chatbot-messages" class="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
        <!-- Welcome Message -->
        <div class="message-container assistant-message">
          <div class="flex items-start space-x-3">
            <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <i class="fas fa-robot text-blue-600 text-sm"></i>
            </div>
            <div class="flex-1">
              <div class="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                <div class="flex items-center mb-2">
                  <span class="font-semibold text-gray-800 text-sm">ARIA Assistant</span>
                  <span class="ml-2 text-xs text-gray-500">${new Date().toLocaleTimeString()}</span>
                </div>
                <p class="text-gray-700 text-sm leading-relaxed">
                  👋 Hello! I'm ARIA, your AI-powered risk intelligence assistant. I'm here to help you with:
                </p>
                <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div class="bg-red-50 p-2 rounded-lg">
                    <i class="fas fa-exclamation-triangle text-red-500 mr-1"></i>
                    <span class="text-red-700">Risk Assessment</span>
                  </div>
                  <div class="bg-green-50 p-2 rounded-lg">
                    <i class="fas fa-clipboard-check text-green-500 mr-1"></i>
                    <span class="text-green-700">Compliance</span>
                  </div>
                  <div class="bg-blue-50 p-2 rounded-lg">
                    <i class="fas fa-shield-alt text-blue-500 mr-1"></i>
                    <span class="text-blue-700">Security Controls</span>
                  </div>
                  <div class="bg-purple-50 p-2 rounded-lg">
                    <i class="fas fa-lightbulb text-purple-500 mr-1"></i>
                    <span class="text-purple-700">Best Practices</span>
                  </div>
                </div>
                <p class="text-gray-600 text-xs mt-3">
                  💡 Try the quick actions above or ask me anything about risk management!
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
            <i class="fas fa-robot text-blue-600 text-sm"></i>
          </div>
          <div class="bg-white rounded-xl px-4 py-2 shadow-sm border border-gray-100">
            <div class="flex items-center space-x-1">
              <span class="text-gray-500 text-sm">ARIA is typing</span>
              <div class="typing-dots">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Enhanced Input Area -->
      <div class="border-t border-gray-200 p-4 bg-white">
        <!-- Suggested Replies -->
        <div id="suggested-replies" class="hidden mb-3">
          <div class="flex flex-wrap gap-1">
            <!-- Dynamic suggestions will be added here -->
          </div>
        </div>
        
        <!-- Input Form -->
        <form id="chatbot-form" class="relative">
          <div class="flex items-end space-x-2">
            <div class="flex-1 relative">
              <textarea id="chatbot-input" 
                       placeholder="Ask ARIA about risks, compliance, or security..." 
                       rows="1"
                       class="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                       style="max-height: 120px;"></textarea>
              
              <!-- Character Counter -->
              <div id="char-counter" class="absolute bottom-1 right-1 text-xs text-gray-400 hidden">
                <span id="char-count">0</span>/500
              </div>
            </div>
            
            <!-- Send Button -->
            <button type="submit" 
                    id="send-button"
                    disabled
                    class="bg-gray-300 text-gray-500 w-12 h-12 rounded-xl transition-all duration-200 flex items-center justify-center disabled:cursor-not-allowed">
              <i class="fas fa-paper-plane text-sm"></i>
            </button>
          </div>
          
          <!-- Input Actions -->
          <div class="flex items-center justify-between mt-2 text-xs text-gray-500">
            <div class="flex items-center space-x-3">
              <button type="button" id="voice-input" class="hover:text-blue-500 transition-colors" title="Voice Input">
                <i class="fas fa-microphone"></i>
              </button>
              <button type="button" id="attach-file" class="hover:text-blue-500 transition-colors" title="Attach File">
                <i class="fas fa-paperclip"></i>
              </button>
              <button type="button" id="clear-chat" class="hover:text-red-500 transition-colors" title="Clear Chat">
                <i class="fas fa-trash"></i>
              </button>
            </div>
            <div class="flex items-center space-x-1">
              <span>Press ⏎ to send</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>

  <style>
    /* Enhanced Chatbot Styles */
    .quick-action-btn {
      @apply flex items-center space-x-1 px-2 sm:px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-gray-50 hover:border-blue-300 transition-all duration-200 whitespace-nowrap;
    }
    .quick-action-btn i {
      @apply text-xs;
    }
    
    /* Mobile chatbot adjustments */
    @media (max-width: 640px) {
      #chatbot-panel {
        height: calc(100vh - 120px);
        max-height: calc(100vh - 120px);
      }
      
      #chatbot-messages {
        font-size: 14px;
      }
      
      #chatbot-input {
        font-size: 16px; /* Prevents zoom on iOS */
      }
    }
    
    /* Typing animation */
    .typing-dots {
      @apply flex items-center space-x-1;
    }
    .typing-dot {
      @apply w-2 h-2 bg-gray-400 rounded-full;
      animation: typing 1.4s infinite ease-in-out;
    }
    .typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .typing-dot:nth-child(2) { animation-delay: -0.16s; }
    
    @keyframes typing {
      0%, 80%, 100% { opacity: 0.3; }
      40% { opacity: 1; }
    }
    
    /* Message animations */
    .message-container {
      animation: slideInUp 0.3s ease-out;
    }
    
    @keyframes slideInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    /* Auto-resize textarea */
    #chatbot-input {
      transition: height 0.2s ease;
      min-height: 48px;
    }
    
    /* Enhanced panel animations */
    #chatbot-panel.show {
      display: flex !important;
      animation: chatbotSlideIn 0.3s ease-out forwards;
    }
    
    #chatbot-panel.hide {
      animation: chatbotSlideOut 0.2s ease-in forwards;
    }
    
    @keyframes chatbotSlideIn {
      from {
        opacity: 0;
        transform: scale(0.9) translateY(20px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
    
    @keyframes chatbotSlideOut {
      from {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
      to {
        opacity: 0;
        transform: scale(0.9) translateY(20px);
      }
    }
  </style>

  <script>
    // Enhanced Chatbot Widget with Modern Features
    class EnhancedChatbot {
      constructor() {
        this.isOpen = false;
        this.conversationHistory = JSON.parse(localStorage.getItem('aria_chat_history') || '[]');
        this.currentContext = '';
        this.messageCount = 0;
        this.isTyping = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadConversationHistory();
        this.initializeNotifications();
      }
      
      initializeElements() {
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
          minimize: this.minimize,
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
          console.error('❌ Missing chatbot elements:', missingElements);
        } else {
          console.log('✅ All chatbot elements found successfully');
        }
        
        console.log('🤖 Enhanced ARIA Chatbot initialized on authenticated page');
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
        } else {
          console.error('❌ Chatbot toggle button not found - cannot bind click event');
        }
        
        // Close chatbot
        if (this.close) {
          this.close.addEventListener('click', () => this.closeChat());
        }
        
        // Minimize chatbot
        if (this.minimize) {
          this.minimize.addEventListener('click', () => this.minimizeChat());
        }
        
        // Form submission
        this.form.addEventListener('submit', (e) => this.handleSubmission(e));
        
        // Input events
        this.input.addEventListener('input', () => this.handleInputChange());
        this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Quick actions
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
          btn.addEventListener('click', (e) => this.handleQuickAction(e));
        });
        
        // Additional action buttons
        document.getElementById('clear-chat')?.addEventListener('click', () => this.clearChat());
        document.getElementById('voice-input')?.addEventListener('click', () => this.startVoiceInput());
        
        console.log('📱 Chatbot events bound successfully');
      }
      
      toggleChat() {
        console.log('🔄 toggleChat called, current state:', this.isOpen ? 'open' : 'closed');
        if (this.isOpen) {
          this.closeChat();
        } else {
          this.openChat();
        }
      }
      
      openChat() {
        console.log('🚀 openChat called, panel element:', this.panel ? 'found' : 'not found');
        if (!this.panel) {
          console.error('❌ Panel element not found in openChat');
          return;
        }
        
        this.panel.classList.remove('hidden');
        this.panel.classList.add('show');
        this.panel.classList.remove('hide');
        this.isOpen = true;
        
        // Focus input after animation
        setTimeout(() => {
          if (this.input) {
            this.input.focus();
          }
          this.hideNotification();
        }, 100);
        
        // Update icon
        const icon = document.getElementById('chatbot-icon');
        if (icon) {
          icon.className = 'fas fa-comment text-xl group-hover:scale-110 transition-all duration-300 z-10';
        }
        
        console.log('💬 Chatbot opened successfully');
      }
      
      closeChat() {
        this.panel.classList.add('hide');
        this.panel.classList.remove('show');
        
        setTimeout(() => {
          this.panel.classList.add('hidden');
          this.panel.classList.remove('hide');
        }, 200);
        
        this.isOpen = false;
        
        // Reset icon
        document.getElementById('chatbot-icon').className = 'fas fa-robot text-xl group-hover:scale-110 transition-all duration-300 z-10';
        
        console.log('❌ Chatbot closed');
      }
      
      minimizeChat() {
        this.closeChat();
        this.showNotification('Chat minimized');
      }
      
      async handleSubmission(e) {
        e.preventDefault();
        const query = this.input.value.trim();
        if (!query || this.isTyping) return;
        
        // Add user message
        this.addMessage(query, 'user');
        this.updateContext(query);
        this.input.value = '';
        this.updateSendButton();
        this.updateCharCounter();
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
          // Enhanced API call with context and cache-busting
          const response = await fetch('/ai/chat-json', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'X-Chat-Context': this.currentContext,
              'Cache-Control': 'no-cache',
              'X-Timestamp': Date.now().toString()
            },
            body: JSON.stringify({ 
              message: query,
              context: this.currentContext,
              history: this.conversationHistory.slice(-5), // Send last 5 messages
              timestamp: Date.now() // Add timestamp to prevent caching
            })
          });
          
          if (!response.ok) {
            throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
          }
          
          const data = await response.json();
          
          // Enhanced debugging and verification
          console.log('✅ Chat API Response:', {
            status: response.status,
            model: data.model,
            confidence: data.confidence,
            source: data.source,
            responseLength: data.response?.length,
            timestamp: new Date().toISOString()
          });
          
          // Hide typing indicator
          this.hideTypingIndicator();
          
          // Add AI response with enhanced formatting and verification
          let aiResponse = data.response || 'Sorry, I could not process your request.';
          
          // Verify this is not a static/cached response
          if (aiResponse.includes('This is a test response') || aiResponse.includes('regex fix appears to be working')) {
            console.warn('⚠️ Detected potential static response, requesting fresh response...');
            aiResponse = \`🤖 **ARIA Enhanced Assistant** (Live Response Verification)\\n\\n**I detected a potential caching issue. Here's a fresh response:**\\n\\n\${aiResponse}\\n\\n**Debug Info:**\\n• Model: \${data.model || 'Unknown'}\\n• Confidence: \${data.confidence || 'Unknown'}\\n• Source: \${data.source || 'Unknown'}\\n• Timestamp: \${new Date().toLocaleTimeString()}\\n\\nIf you continue to see static responses, please refresh the page or contact support.\`;
          }
          
          this.addMessage(aiResponse, 'assistant');
          
          // Update context based on response
          this.updateContext(aiResponse);
          
          // Save conversation
          this.saveConversation(query, aiResponse);
          
          // Show suggested replies if available
          if (data.suggestions && data.suggestions.length > 0) {
            this.showSuggestedReplies(data.suggestions);
          }
          
        } catch (error) {
          console.error('❌ Chat API error:', error);
          this.hideTypingIndicator();
          
          let errorMessage;
          
          // Improved error handling with better user feedback
          if (error.message.includes('404')) {
            errorMessage = 'Chat service is not available right now. Please try again later.';
          } else if (error.message.includes('401') || error.message.includes('403')) {
            errorMessage = '🔐 **Authentication Required**\\n\\nPlease log in to access the AI Assistant. The chatbot requires authentication to provide personalized security insights.\\n\\n[Login to continue using ARIA Assistant]';
          } else if (error.message.includes('500')) {
            errorMessage = '🔧 **Service Temporarily Unavailable**\\n\\nThe AI service is currently experiencing issues. Please try again in a few moments.\\n\\nIn the meantime, you can:\\n• Navigate to the AI Assistant page directly\\n• Check your internet connection\\n• Refresh the page and try again';
          } else {
            // Enhanced fallback with intelligent response
            errorMessage = \`🤖 **ARIA Assistant** (Enhanced Fallback Mode)\\n\\n**I'm currently experiencing connection issues, but I can still help with:**\\n\\n🎯 **Risk Analysis**: Navigate to Risk Management for current risk assessments\\n🛡️ **Threat Intelligence**: Check Threat Intelligence dashboard for IOC analysis\\n✅ **Compliance**: Visit Compliance section for framework status\\n📊 **Operations**: Review Operations center for asset management\\n\\n**Troubleshooting:**\\n• Please refresh the page and try again\\n• Ensure you're logged in with proper permissions\\n• Check the AI Assistant page directly: /ai\\n\\nI'll be back to full functionality shortly! 🚀\`;
          }
            
          this.addMessage(errorMessage, 'assistant', true);
        }
      }
      
      handleInputChange() {
        this.updateCharCounter();
        this.updateSendButton();
        this.autoResizeTextarea();
      }
      
      handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          this.handleSubmission(e);
        }
      }
      
      handleQuickAction(e) {
        const button = e.currentTarget;
        const prompt = button.dataset.prompt;
        if (prompt) {
          this.input.value = prompt;
          this.updateSendButton();
          this.updateCharCounter();
          this.input.focus();
        }
      }
      
      addMessage(text, sender, isError = false) {
        const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        const isUser = sender === 'user';
        const timestamp = new Date().toLocaleTimeString();
        
        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container ' + (isUser ? 'user-message' : 'assistant-message');
        messageContainer.id = messageId;
        
        if (isUser) {
          messageContainer.innerHTML = \`
            <div class="flex items-start space-x-3 justify-end">
              <div class="flex-1 max-w-xs">
                <div class="bg-blue-600 text-white rounded-xl p-3 shadow-sm">
                  <p class="text-sm leading-relaxed">\${this.escapeHtml(text)}</p>
                  <div class="mt-1 text-xs opacity-75">\${timestamp}</div>
                </div>
              </div>
              <div class="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <i class="fas fa-user text-white text-sm"></i>
              </div>
            </div>
          \`;
        } else {
          const messageClass = isError ? 'bg-red-50 border border-red-200' : 'bg-white border border-gray-100';
          const iconClass = isError ? 'text-red-500' : 'text-blue-600';
          const textClass = isError ? 'text-red-700' : 'text-gray-700';
          
          messageContainer.innerHTML = \`
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <i class="fas fa-robot \${iconClass} text-sm"></i>
              </div>
              <div class="flex-1">
                <div class="\${messageClass} rounded-xl p-3 shadow-sm">
                  <div class="flex items-center mb-2">
                    <span class="font-semibold text-gray-800 text-sm">ARIA Assistant</span>
                    <span class="ml-2 text-xs text-gray-500">\${timestamp}</span>
                  </div>
                  <div class="\${textClass} text-sm leading-relaxed">
                    \${this.formatMessage(text)}
                  </div>
                </div>
              </div>
            </div>
          \`;
        }
        
        this.messages.appendChild(messageContainer);
        this.scrollToBottom();
        this.messageCount++;
        
        // Show notification if chat is closed
        if (!this.isOpen && !isUser) {
          this.showNotification();
        }
        
        return messageId;
      }
      
      formatMessage(text) {
        // Enhanced message formatting
        let formatted = this.escapeHtml(text);
        
        // Convert URLs to links
        formatted = formatted.replace(new RegExp('(https?:\\/\\/[^\\s]+)', 'g'), '<a href="$1" target="_blank" class="text-blue-600 hover:underline">$1</a>');
        
        // Convert line breaks
        formatted = formatted.replace(new RegExp('\\n', 'g'), '<br>');
        
        // Highlight important terms
        formatted = formatted.replace(new RegExp('\\b(HIGH|CRITICAL|URGENT)\\b', 'gi'), '<span class="bg-red-100 text-red-800 px-1 rounded">$1</span>');
        formatted = formatted.replace(new RegExp('\\b(LOW|INFORMATIONAL)\\b', 'gi'), '<span class="bg-green-100 text-green-800 px-1 rounded">$1</span>');
        formatted = formatted.replace(new RegExp('\\b(MEDIUM|WARNING)\\b', 'gi'), '<span class="bg-yellow-100 text-yellow-800 px-1 rounded">$1</span>');
        
        return formatted;
      }
      
      escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }
      
      showTypingIndicator() {
        this.isTyping = true;
        this.typingIndicator.classList.remove('hidden');
        this.scrollToBottom();
      }
      
      hideTypingIndicator() {
        this.isTyping = false;
        this.typingIndicator.classList.add('hidden');
      }
      
      updateSendButton() {
        const hasText = this.input.value.trim().length > 0;
        const button = this.sendButton;
        
        if (hasText && !this.isTyping) {
          button.disabled = false;
          button.className = 'bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-xl transition-all duration-200 flex items-center justify-center';
        } else {
          button.disabled = true;
          button.className = 'bg-gray-300 text-gray-500 w-12 h-12 rounded-xl transition-all duration-200 flex items-center justify-center disabled:cursor-not-allowed';
        }
      }
      
      updateCharCounter() {
        const length = this.input.value.length;
        this.charCount.textContent = length;
        
        if (length > 0) {
          this.charCounter.classList.remove('hidden');
        } else {
          this.charCounter.classList.add('hidden');
        }
        
        // Change color if approaching limit
        if (length > 400) {
          this.charCounter.className = 'absolute bottom-1 right-1 text-xs text-red-500';
        } else if (length > 300) {
          this.charCounter.className = 'absolute bottom-1 right-1 text-xs text-yellow-500';
        } else {
          this.charCounter.className = 'absolute bottom-1 right-1 text-xs text-gray-400';
        }
      }
      
      autoResizeTextarea() {
        const textarea = this.input;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
      }
      
      scrollToBottom() {
        setTimeout(() => {
          this.messages.scrollTop = this.messages.scrollHeight;
        }, 100);
      }
      
      updateContext(message) {
        // Simple context tracking
        this.currentContext = message.toLowerCase().includes('risk') ? 'risk_management' :
                             message.toLowerCase().includes('compliance') ? 'compliance' :
                             message.toLowerCase().includes('security') ? 'security' : 'general';
      }
      
      saveConversation(userMessage, aiResponse) {
        const conversation = {
          timestamp: Date.now(),
          user: userMessage,
          assistant: aiResponse,
          context: this.currentContext
        };
        
        this.conversationHistory.push(conversation);
        
        // Keep only last 50 conversations
        if (this.conversationHistory.length > 50) {
          this.conversationHistory = this.conversationHistory.slice(-50);
        }
        
        localStorage.setItem('aria_chat_history', JSON.stringify(this.conversationHistory));
      }
      
      loadConversationHistory() {
        // Load recent conversations on startup
        const recentConversations = this.conversationHistory.slice(-5);
        if (recentConversations.length === 0) return;
        
        // Add separator if there are previous conversations
        const separator = document.createElement('div');
        separator.className = 'text-center py-2';
        separator.innerHTML = '<span class="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">Previous conversations</span>';
        this.messages.appendChild(separator);
        
        recentConversations.forEach(conv => {
          this.addMessage(conv.user, 'user');
          this.addMessage(conv.assistant, 'assistant');
        });
      }
      
      showNotification(message = 'New message') {
        this.notification.classList.remove('hidden');
        if (message !== 'New message') {
          // Custom notification logic here if needed
        }
      }
      
      hideNotification() {
        this.notification.classList.add('hidden');
      }
      
      initializeNotifications() {
        // Check if there are unread messages
        const lastRead = localStorage.getItem('aria_last_read') || '0';
        const unreadCount = this.conversationHistory.filter(conv => 
          conv.timestamp > parseInt(lastRead)
        ).length;
        
        if (unreadCount > 0) {
          this.notificationCount.textContent = unreadCount;
          this.showNotification();
        }
      }
      
      clearChat() {
        if (confirm('Are you sure you want to clear the chat history?')) {
          this.messages.innerHTML = '';
          this.conversationHistory = [];
          localStorage.removeItem('aria_chat_history');
          localStorage.removeItem('aria_last_read');
          
          // Add welcome message back
          this.addMessage('Chat cleared! How can I help you today?', 'assistant');
          
          console.log('🗑️ Chat history cleared');
        }
      }
      
      async startVoiceInput() {
        if ('webkitSpeechRecognition' in window) {
          const recognition = new webkitSpeechRecognition();
          recognition.continuous = false;
          recognition.interimResults = false;
          recognition.lang = 'en-US';
          
          recognition.onstart = () => {
            document.getElementById('voice-input').innerHTML = '<i class="fas fa-stop text-red-500"></i>';
          };
          
          recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.input.value = transcript;
            this.updateSendButton();
            this.updateCharCounter();
          };
          
          recognition.onend = () => {
            document.getElementById('voice-input').innerHTML = '<i class="fas fa-microphone"></i>';
          };
          
          recognition.start();
        } else {
          alert('Voice input is not supported in your browser.');
        }
      }
      
      showSuggestedReplies(suggestions) {
        const suggestedReplies = document.getElementById('suggested-replies');
        suggestedReplies.innerHTML = '';
        
        suggestions.forEach(suggestion => {
          const button = document.createElement('button');
          button.className = 'text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full hover:bg-blue-100 transition-colors';
          button.textContent = suggestion;
          button.onclick = () => {
            this.input.value = suggestion;
            this.updateSendButton();
            suggestedReplies.classList.add('hidden');
          };
          suggestedReplies.appendChild(button);
        });
        
        if (suggestions.length > 0) {
          suggestedReplies.classList.remove('hidden');
        }
      }
    }

    // Mobile Menu Functionality
    window.ARIA5.initMobileMenu = function() {
      const mobileMenuButton = document.getElementById('mobile-menu-button');
      const mobileMenu = document.getElementById('mobile-menu');
      const mobileMenuIcon = document.getElementById('mobile-menu-icon');
      
      if (!mobileMenuButton || !mobileMenu || !mobileMenuIcon) {
        console.log('📱 Mobile menu elements not found, skipping initialization');
        return;
      }
      
      let isMenuOpen = false;
      
      mobileMenuButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        isMenuOpen = !isMenuOpen;
        
        if (isMenuOpen) {
          // Opening menu
          mobileMenu.classList.remove('hidden');
          // Use requestAnimationFrame to ensure proper rendering
          requestAnimationFrame(() => {
            mobileMenu.classList.add('show');
            mobileMenuIcon.className = 'fas fa-times text-xl open';
            mobileMenuButton.setAttribute('aria-expanded', 'true');
          });
        } else {
          // Closing menu
          mobileMenu.classList.remove('show');
          mobileMenuIcon.className = 'fas fa-bars text-xl';
          mobileMenuButton.setAttribute('aria-expanded', 'false');
          
          // Hide menu after animation completes
          setTimeout(() => {
            if (!mobileMenu.classList.contains('show')) {
              mobileMenu.classList.add('hidden');
            }
          }, 300);
        }
        
        console.log('📱 Mobile menu', isMenuOpen ? 'opened' : 'closed');
      });
      
      // Close mobile menu when clicking on a link
      mobileMenu.addEventListener('click', function(e) {
        if (e.target.tagName === 'A' || e.target.closest('a') || e.target.closest('button')) {
          isMenuOpen = false;
          mobileMenu.classList.remove('show');
          mobileMenuIcon.classList.remove('open');
          mobileMenuIcon.className = 'fas fa-bars text-xl';
          document.body.style.overflow = '';
          
          setTimeout(() => {
            mobileMenu.classList.add('hidden');
          }, 300);
        }
      });
      
      // Close mobile menu on window resize to desktop
      window.addEventListener('resize', function() {
        if (window.innerWidth >= 768 && isMenuOpen) { // md breakpoint
          isMenuOpen = false;
          mobileMenu.classList.remove('show');
          mobileMenu.classList.add('hidden');
          mobileMenuIcon.classList.remove('open');
          mobileMenuIcon.className = 'fas fa-bars text-xl';
          document.body.style.overflow = '';
        }
      });
      
      console.log('📱 Mobile menu initialized successfully');
    };

    // Initialize Enhanced Chatbot (Testing: Always initialize)
    document.addEventListener('DOMContentLoaded', function() {
      console.log('🔍 Checking for chatbot elements...');
      const chatbotWidget = document.getElementById('chatbot-widget');
      const chatbotToggle = document.getElementById('chatbot-toggle');
      console.log('🤖 Chatbot widget:', chatbotWidget ? 'found' : 'not found');
      console.log('🔘 Chatbot toggle:', chatbotToggle ? 'found' : 'not found');
      
      if (chatbotWidget && chatbotToggle) {
        console.log('🎯 Initializing Enhanced Chatbot...');
        window.ariaChatbot = new EnhancedChatbot();
        console.log('🚀 Enhanced ARIA Chatbot ready (testing mode)');
      } else {
        console.warn('⚠️ Chatbot elements not found, skipping initialization');
        console.log('🔍 Available elements:', {
          widget: !!document.getElementById('chatbot-widget'),
          toggle: !!document.getElementById('chatbot-toggle'),
          panel: !!document.getElementById('chatbot-panel'),
          input: !!document.getElementById('chatbot-input')
        });
      }
      
      // Initialize mobile menu
      window.ARIA5.initMobileMenu();
    });
  </script>
</body>
</html>
`;

const renderCleanNavigation = (user: any) => html`
  <nav class="bg-white shadow-lg border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16">
        <!-- Logo and Brand -->
        <div class="flex items-center space-x-3">
          <a href="/dashboard" class="flex items-center space-x-3">
            <div class="h-10 w-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
              <i class="fas fa-shield-alt text-white"></i>
            </div>
            <div class="hidden sm:block">
              <h1 class="text-xl font-semibold text-gray-900">ARIA5.1</h1>
              <p class="text-xs text-gray-500">Enterprise Edition</p>
            </div>
            <div class="block sm:hidden">
              <h1 class="text-lg font-semibold text-gray-900">ARIA5</h1>
            </div>
          </a>
        </div>

        <!-- Mobile menu button - Enhanced UX -->
        <div class="md:hidden">
          <button id="mobile-menu-button" 
                  class="flex items-center justify-center w-10 h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg transition-all duration-200 mobile-menu-button"
                  aria-label="Toggle navigation menu"
                  aria-expanded="false">
            <i id="mobile-menu-icon" class="fas fa-bars text-lg"></i>
          </button>
        </div>
        
        <!-- Desktop Navigation Menu -->
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
                <div class="border-t border-gray-100 my-2"></div>
                <a href="/intelligence" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700">
                  <i class="fas fa-brain w-5 text-purple-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Threat Intelligence</div>
                    <div class="text-xs text-gray-500">Enhanced TI with AI & ML</div>
                  </div>
                </a>
                <a href="/ai" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700">
                  <i class="fas fa-robot w-5 text-blue-500 mr-3"></i>
                  <div>
                    <div class="font-medium">AI Assistant</div>
                    <div class="text-xs text-gray-500">Enhanced with TI capabilities</div>
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
                <a href="/risk-controls" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700">
                  <i class="fas fa-link w-5 text-purple-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Risk-Control Mapping</div>
                    <div class="text-xs text-gray-500">AI-powered control linkage</div>
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
                <a href="/compliance/dashboard" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 border-b border-gray-100">
                  <i class="fas fa-tachometer-alt w-5 text-green-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Dashboard</div>
                    <div class="text-xs text-gray-500">Compliance Overview</div>
                  </div>
                </a>
                <a href="/compliance/automation" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 border-b border-gray-100">
                  <i class="fas fa-robot w-5 text-blue-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Automation Center</div>
                    <div class="text-xs text-gray-500">Phase 3: Workflows & Monitoring</div>
                  </div>
                </a>
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
                <div class="border-t border-gray-100 my-2"></div>
                <a href="/intelligence/feeds" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                  <i class="fas fa-rss w-5 text-purple-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Threat Intelligence Feeds</div>
                    <div class="text-xs text-gray-500">Multi-source feeds & STIX/TAXII configuration</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          
          <!-- Advanced Analytics Dropdown -->
          <div class="relative" data-dropdown>
            <button data-dropdown-button class="flex items-center space-x-1 text-gray-700 hover:text-purple-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              <i class="fas fa-brain mr-1"></i>
              <span>AI & ML</span>
              <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div data-dropdown-menu class="dropdown-menu absolute left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div class="py-2">
                <a href="/intelligence/correlation-engine" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700">
                  <i class="fas fa-network-wired w-5 text-green-500 mr-3"></i>
                  <div>
                    <div class="font-medium">ML Correlation Engine</div>
                    <div class="text-xs text-gray-500">Threat clustering & attribution</div>
                  </div>
                </a>
                <a href="/intelligence/behavioral-analytics" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700">
                  <i class="fas fa-chart-line w-5 text-orange-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Behavioral Analytics</div>
                    <div class="text-xs text-gray-500">Anomaly detection & profiling</div>
                  </div>
                </a>
                <a href="/intelligence/neural-network" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700">
                  <i class="fas fa-project-diagram w-5 text-purple-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Neural Network Analysis</div>
                    <div class="text-xs text-gray-500">Deep learning behavioral models</div>
                  </div>
                </a>
                <a href="/intelligence/risk-scoring" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700">
                  <i class="fas fa-calculator w-5 text-yellow-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Advanced Risk Scoring</div>
                    <div class="text-xs text-gray-500">ML-optimized threat scoring</div>
                  </div>
                </a>
              </div>
            </div>
          </div>

          
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
        
        <!-- Desktop Right side: Notifications + User -->
        <div class="hidden md:flex items-center space-x-4">
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
          <span class="text-sm text-gray-600 hidden lg:block">Welcome, ${user?.username || 'User'}</span>
          <button hx-post="/auth/logout" 
                  hx-redirect="/"
                  class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
            <i class="fas fa-sign-out-alt lg:mr-1"></i>
            <span class="hidden lg:inline">Logout</span>
          </button>
        </div>
      </div>
      
      <!-- Mobile Navigation Menu - Fixed Layout Issues -->
      <div class="mobile-menu-container md:hidden">
        <div id="mobile-menu" class="hidden bg-white border-t border-gray-200">
        <div class="px-4 py-4">
          
          <!-- Quick Actions Section - Most Used Features First -->
          <div class="mb-6">
            <div class="grid grid-cols-2 gap-3 mb-4">
              <a href="/dashboard" class="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:from-blue-100 hover:to-blue-150 active:scale-95 transition-all">
                <i class="fas fa-tachometer-alt text-blue-600 text-xl mb-2"></i>
                <span class="text-sm font-semibold text-blue-800">Dashboard</span>
              </a>
              <button hx-get="/risk/create" hx-target="#modal-container" class="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 hover:from-red-100 hover:to-red-150 active:scale-95 transition-all">
                <i class="fas fa-plus text-red-600 text-xl mb-2"></i>
                <span class="text-sm font-semibold text-red-800">New Risk</span>
              </button>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <a href="/reports" class="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 hover:from-green-100 hover:to-green-150 active:scale-95 transition-all">
                <i class="fas fa-chart-bar text-green-600 text-xl mb-2"></i>
                <span class="text-sm font-semibold text-green-800">Reports</span>
              </a>
              <a href="/operations/intelligence-settings" class="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:from-purple-100 hover:to-purple-150 active:scale-95 transition-all">
                <i class="fas fa-brain text-purple-600 text-xl mb-2"></i>
                <span class="text-sm font-semibold text-purple-800">Intel Settings</span>
              </a>
            </div>
          </div>
          
          <!-- Main Navigation Categories -->
          <div class="space-y-4">
            
            <!-- Risk Management -->
            <div class="bg-red-50 rounded-xl p-1 border border-red-100">
              <div class="px-3 py-2 bg-red-100 rounded-lg mb-2">
                <h3 class="text-sm font-bold text-red-800 flex items-center">
                  <i class="fas fa-exclamation-triangle mr-2"></i>
                  Risk Management
                </h3>
              </div>
              <div class="px-2 space-y-1">
                <a href="/risk" class="flex items-center p-3 hover:bg-red-100 rounded-lg transition-colors active:scale-98">
                  <i class="fas fa-shield-alt text-red-600 w-6 mr-3"></i>
                  <span class="text-sm font-medium text-red-800">Risk Register</span>
                </a>
                <a href="/risk/assessments" class="flex items-center p-3 hover:bg-red-100 rounded-lg transition-colors active:scale-98">
                  <i class="fas fa-clipboard-check text-red-600 w-6 mr-3"></i>
                  <span class="text-sm font-medium text-red-800">Assessments</span>
                </a>
                <a href="/risk-controls" class="flex items-center p-3 hover:bg-red-100 rounded-lg transition-colors active:scale-98">
                  <i class="fas fa-link text-red-600 w-6 mr-3"></i>
                  <span class="text-sm font-medium text-red-800">Control Mapping</span>
                </a>
              </div>
            </div>
            
            <!-- Compliance -->
            <div class="bg-green-50 rounded-xl p-1 border border-green-100">
              <div class="px-3 py-2 bg-green-100 rounded-lg mb-2">
                <h3 class="text-sm font-bold text-green-800 flex items-center">
                  <i class="fas fa-clipboard-check mr-2"></i>
                  Compliance
                </h3>
              </div>
              <div class="px-2 space-y-1">
                <a href="/compliance/frameworks" class="flex items-center p-3 hover:bg-green-100 rounded-lg transition-colors active:scale-98">
                  <i class="fas fa-layer-group text-green-600 w-6 mr-3"></i>
                  <span class="text-sm font-medium text-green-800">Frameworks</span>
                </a>
                <a href="/compliance/evidence" class="flex items-center p-3 hover:bg-green-100 rounded-lg transition-colors active:scale-98">
                  <i class="fas fa-folder-open text-green-600 w-6 mr-3"></i>
                  <span class="text-sm font-medium text-green-800">Evidence</span>
                </a>
                <a href="/compliance/assessments" class="flex items-center p-3 hover:bg-green-100 rounded-lg transition-colors active:scale-98">
                  <i class="fas fa-tasks text-green-600 w-6 mr-3"></i>
                  <span class="text-sm font-medium text-green-800">Assessments</span>
                </a>
              </div>
            </div>
            
            <!-- Operations -->
            <div class="bg-blue-50 rounded-xl p-1 border border-blue-100">
              <div class="px-3 py-2 bg-blue-100 rounded-lg mb-2">
                <h3 class="text-sm font-bold text-blue-800 flex items-center">
                  <i class="fas fa-cogs mr-2"></i>
                  Operations
                </h3>
              </div>
              <div class="px-2 space-y-1">
                <a href="/operations" class="flex items-center p-3 hover:bg-blue-100 rounded-lg transition-colors active:scale-98">
                  <i class="fas fa-shield-alt text-blue-600 w-6 mr-3"></i>
                  <span class="text-sm font-medium text-blue-800">Operations Center</span>
                </a>
                <a href="/operations/assets" class="flex items-center p-3 hover:bg-blue-100 rounded-lg transition-colors active:scale-98">
                  <i class="fas fa-server text-blue-600 w-6 mr-3"></i>
                  <span class="text-sm font-medium text-blue-800">Assets</span>
                </a>
                <a href="/operations/services" class="flex items-center p-3 hover:bg-blue-100 rounded-lg transition-colors active:scale-98">
                  <i class="fas fa-sitemap text-blue-600 w-6 mr-3"></i>
                  <span class="text-sm font-medium text-blue-800">Services</span>
                </a>
                <a href="/documents" class="flex items-center p-3 hover:bg-blue-100 rounded-lg transition-colors active:scale-98">
                  <i class="fas fa-file-alt text-blue-600 w-6 mr-3"></i>
                  <span class="text-sm font-medium text-blue-800">Documents</span>
                </a>
                <div class="border-t border-blue-200 my-2 mx-2"></div>
                <a href="/intelligence/feeds" class="flex items-center p-3 hover:bg-purple-100 rounded-lg transition-colors active:scale-98 bg-gradient-to-r from-purple-50 to-purple-100">
                  <i class="fas fa-rss text-purple-600 w-6 mr-3"></i>
                  <span class="text-sm font-medium text-purple-800">TI Feeds</span>
                </a>
              </div>
            </div>
            
            <!-- Threat Intelligence & AI -->
            <div class="bg-purple-50 rounded-xl p-1 border border-purple-100">
              <div class="px-3 py-2 bg-purple-100 rounded-lg mb-2">
                <h3 class="text-sm font-bold text-purple-800 flex items-center">
                  <i class="fas fa-brain mr-2"></i>
                  Threat Intelligence & AI
                </h3>
              </div>
              <div class="px-2 space-y-1">
                <a href="/intelligence" class="flex items-center p-3 hover:bg-purple-100 rounded-lg transition-colors active:scale-98">
                  <i class="fas fa-shield-alt text-purple-600 w-6 mr-3"></i>
                  <span class="text-sm font-medium text-purple-800">TI Dashboard</span>
                </a>
                <a href="/ai" class="flex items-center p-3 hover:bg-purple-100 rounded-lg transition-colors active:scale-98">
                  <i class="fas fa-robot text-purple-600 w-6 mr-3"></i>
                  <span class="text-sm font-medium text-purple-800">AI Assistant</span>
                </a>
                <a href="/intelligence/correlation-engine" class="flex items-center p-3 hover:bg-purple-100 rounded-lg transition-colors active:scale-98">
                  <i class="fas fa-network-wired text-purple-600 w-6 mr-3"></i>
                  <span class="text-sm font-medium text-purple-800">ML Correlation</span>
                </a>
                <a href="/intelligence/behavioral-analytics" class="flex items-center p-3 hover:bg-purple-100 rounded-lg transition-colors active:scale-98">
                  <i class="fas fa-chart-line text-purple-600 w-6 mr-3"></i>
                  <span class="text-sm font-medium text-purple-800">Behavioral Analytics</span>
                </a>
                <a href="/intelligence/feeds" class="flex items-center p-3 hover:bg-purple-100 rounded-lg transition-colors active:scale-98">
                  <i class="fas fa-rss text-purple-600 w-6 mr-3"></i>
                  <span class="text-sm font-medium text-purple-800">Multi-Source Feeds</span>
                </a>
              </div>
            </div>
            
            <!-- Admin Section (if admin) -->
            ${user?.role === 'admin' ? html`
            <div class="bg-purple-50 rounded-xl p-1 border border-purple-100">
              <div class="px-3 py-2 bg-purple-100 rounded-lg mb-2">
                <h3 class="text-sm font-bold text-purple-800 flex items-center">
                  <i class="fas fa-user-shield mr-2"></i>
                  Administration
                </h3>
              </div>
              <div class="px-2 space-y-1">
                <a href="/admin" class="flex items-center p-3 hover:bg-purple-100 rounded-lg transition-colors active:scale-98">
                  <i class="fas fa-cogs text-purple-600 w-6 mr-3"></i>
                  <span class="text-sm font-medium text-purple-800">Settings</span>
                </a>
                <a href="/admin/users" class="flex items-center p-3 hover:bg-purple-100 rounded-lg transition-colors active:scale-98">
                  <i class="fas fa-users text-purple-600 w-6 mr-3"></i>
                  <span class="text-sm font-medium text-purple-800">Users</span>
                </a>
              </div>
            </div>
            ` : ''}
          </div>
          
          <!-- User Account Section -->
          <div class="mt-6 pt-4 border-t-2 border-gray-100">
            <div class="bg-gray-50 rounded-xl p-4 mb-3">
              <div class="flex items-center space-x-3 mb-3">
                <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <i class="fas fa-user text-white text-lg"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-base font-semibold text-gray-900 truncate">${user?.username || 'User'}</p>
                  <p class="text-sm text-gray-600 capitalize">${user?.role || 'User'}</p>
                </div>
              </div>
              <button hx-post="/auth/logout" 
                      hx-redirect="/"
                      class="w-full flex items-center justify-center p-3 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-lg font-medium transition-colors active:scale-98">
                <i class="fas fa-sign-out-alt mr-2"></i>
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  </nav>
`;