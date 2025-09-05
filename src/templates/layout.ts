import { html } from 'hono/html';

export interface LayoutProps {
  title: string;
  content: any;
  user?: any;
}

export const baseLayout = ({ title, content, user }: LayoutProps) => html`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ARIA5.1</title>
  <meta name="description" content="ARIA5.1 - Next-Generation AI Risk Intelligence Platform">
  
  <!-- HTMX -->
  <script src="https://unpkg.com/htmx.org@1.9.10"></script>
  <script src="https://unpkg.com/htmx.org/dist/ext/json-enc.js"></script>
  
  <!-- Alpine.js for client-side dropdowns -->
  <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
  <script>
    // Initialize Alpine.js manually to avoid conflicts
    window.Alpine = window.Alpine || {};
    
    // Comprehensive fallback dropdown functionality
    function initFallbackDropdowns() {
      console.log('🔄 Initializing fallback dropdown functionality');
      document.querySelectorAll('[x-data*="open"]').forEach((dropdown, index) => {
        const button = dropdown.querySelector('button');
        const menu = dropdown.querySelector('[x-show="open"], .dropdown-menu');
        
        if (button && menu) {
          // Remove any existing click listeners
          button.removeEventListener('click', button._dropdownHandler);
          
          // Create new click handler
          button._dropdownHandler = function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Close all other dropdowns
            document.querySelectorAll('[x-data*="open"]').forEach(otherDropdown => {
              if (otherDropdown !== dropdown) {
                const otherMenu = otherDropdown.querySelector('[x-show="open"], .dropdown-menu');
                if (otherMenu) {
                  otherMenu.style.display = 'none';
                }
              }
            });
            
            // Toggle current dropdown
            const isVisible = menu.style.display === 'block';
            menu.style.display = isVisible ? 'none' : 'block';
            console.log('🎯 Dropdown', index, isVisible ? 'closed' : 'opened');
          };
          
          button.addEventListener('click', button._dropdownHandler);
          
          // Close on outside click
          document.addEventListener('click', function(e) {
            if (!dropdown.contains(e.target)) {
              menu.style.display = 'none';
            }
          });
        }
      });
    }
    
    // Alpine.js initialization tracking
    document.addEventListener('alpine:init', () => {
      console.log('✅ Alpine.js initialized successfully!');
    });
    
    document.addEventListener('alpine:initialized', () => {
      console.log('✅ Alpine.js fully loaded and ready');
    });
    
    // Initialize fallback dropdowns immediately and after Alpine.js fails
    document.addEventListener('DOMContentLoaded', () => {
      // Wait for Alpine.js to load
      setTimeout(() => {
        if (!window.Alpine || !window.Alpine.version) {
          console.warn('⚠️ Alpine.js not detected - using fallback dropdowns');
          initFallbackDropdowns();
        } else {
          console.log('✅ Alpine.js detected, version:', window.Alpine.version);
        }
      }, 2000);
    });
  </script>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Font Awesome -->
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  
  <!-- Custom Styles -->
  <link href="/static/styles.css" rel="stylesheet">
  
  <!-- Chart.js for Analytics -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  
  <!-- AI Governance Scripts - Commented out temporarily for debugging -->
  <!-- <script src="/static/ai-governance.js"></script> -->
  
  <!-- HTMX Configuration for ARIA5.1 -->
  <script>
    // Configure HTMX for ARIA5.1 HTMX Edition
    htmx.config.defaultSwapStyle = 'innerHTML';
    htmx.config.historyCacheSize = 10;
    htmx.config.refreshOnHistoryMiss = true;
    
    // Enhanced HTMX configuration
    document.addEventListener('DOMContentLoaded', function() {
      console.log('🚀 ARIA5.1 HTMX Edition - Layout initialized');
      
      // Hide loading indicators after page load
      setTimeout(() => {
        document.querySelectorAll('.loading-state, [data-loading]').forEach(el => {
          el.style.display = 'none';
        });
      }, 1000);
      
      // Handle authentication for all HTMX requests
      document.body.addEventListener('htmx:configRequest', function(event) {
        console.log('📡 HTMX request starting:', event.detail.path);
        
        // Always send credentials with requests (safe check for xhr existence)
        if (event.detail.xhr && typeof event.detail.xhr.withCredentials !== 'undefined') {
          event.detail.xhr.withCredentials = true;
        }
        
        // Add authentication token from localStorage if available
        const token = localStorage.getItem('aria_token');
        if (token) {
          event.detail.headers['Authorization'] = 'Bearer ' + token;
          console.log('📡 HTMX request with auth token');
        }
      });
      
      // Enhanced error handling with user feedback
      document.body.addEventListener('htmx:responseError', function(event) {
        const status = event.detail.xhr.status;
        console.error('❌ HTMX Error:', status, event.detail.xhr.statusText);
        
        // Hide loading indicators on error
        document.querySelectorAll('.htmx-indicator').forEach(el => {
          el.style.display = 'none';
        });
        
        if (status === 401) {
          console.log('🔐 Authentication required, redirecting to login');
          localStorage.removeItem('aria_token');
          localStorage.removeItem('aria_user');
          window.location.href = '/login';
        } else if (status === 404) {
          console.warn('⚠️ Resource not found:', event.detail.requestConfig.path);
          // Replace 404 content with user-friendly message
          if (event.detail.target) {
            event.detail.target.innerHTML = '<div class="text-gray-500 text-center p-4">Content not available</div>';
          }
        } else if (status >= 500) {
          console.error('🔥 Server error occurred');
          if (event.detail.target) {
            event.detail.target.innerHTML = '<div class="text-red-500 text-center p-4">Server error. Please try again.</div>';
          }
        }
      });
      
      // Handle successful requests and remove loading states
      document.body.addEventListener('htmx:afterRequest', function(event) {
        // Hide loading indicators
        document.querySelectorAll('.htmx-indicator').forEach(el => {
          el.style.display = 'none';
        });
        
        if (event.detail.xhr.status >= 200 && event.detail.xhr.status < 300) {
          console.log('✅ HTMX request successful');
        }
        
        // Handle modal responses
        if (event.detail.target && event.detail.target.id === 'modal-container') {
          const modalContainer = event.detail.target;
          if (modalContainer.innerHTML.trim()) {
            modalContainer.style.display = 'block';
            console.log('✅ Modal opened successfully');
          }
        }
      });
      
      // Handle requests starting (show loading)
      document.body.addEventListener('htmx:beforeRequest', function(event) {
        console.log('📡 HTMX request starting:', event.detail.requestConfig.path);
      });
    });

  </script>
  
  <style>
    /* Loading indicator */
    .htmx-indicator {
      display: none;
    }
    .htmx-request .htmx-indicator {
      display: inline-block;
    }
    .htmx-request.htmx-indicator {
      display: inline-block;
    }
    
    /* Page transitions */
    .fade-in {
      animation: fadeIn 0.2s ease-in;
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    /* Enhanced dropdown animations */
    .dropdown-enter {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
    }
    .dropdown-enter-active {
      opacity: 1;
      transform: scale(1) translateY(0);
      transition: all 0.2s ease-out;
    }
    .dropdown-leave {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    .dropdown-leave-active {
      opacity: 0;
      transform: scale(0.95) translateY(-10px);
      transition: all 0.15s ease-in;
    }
    
    /* Alpine.js cloak for preventing flash of unstyled content */
    [x-cloak] { 
      display: none !important; 
    }
    
    /* Ensure dropdowns start hidden but Alpine.js can control them */
    .dropdown-menu {
      display: none;
    }
    
    /* Improved hover effects */
    .nav-item {
      transition: all 0.2s ease-in-out;
      position: relative;
    }
    .nav-item:hover {
      transform: translateY(-1px);
    }
    .nav-item::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 50%;
      width: 0;
      height: 2px;
      background: linear-gradient(90deg, #3B82F6, #1D4ED8);
      transition: all 0.3s ease;
      transform: translateX(-50%);
    }
    .nav-item:hover::after {
      width: 80%;
    }
    
    /* Enhanced notification bell */
    .notification-bell {
      position: relative;
      transition: all 0.2s ease;
    }
    .notification-bell:hover {
      transform: rotate(15deg) scale(1.1);
    }
    .notification-badge {
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    
    /* Mobile menu enhancements */
    .mobile-menu {
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }
    
    /* Loading states */
    .loading-skeleton {
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: loading 1.5s infinite;
    }
    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  </style>
</head>
<body class="bg-gray-50 font-sans antialiased">
  ${user ? renderNavigation(user) : ''}
  
  <main id="main-content" class="fade-in">
    ${content}
  </main>
  
  <!-- Global loading indicator -->
  <div class="htmx-indicator fixed top-4 right-4 z-50">
    <div class="bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
      <div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
      <span>Loading...</span>
    </div>
  </div>
  
  <!-- Toast notifications container -->
  <div id="toast-container" class="fixed top-4 right-4 z-50 space-y-2"></div>
  
  <!-- Global modal container for HTMX modals -->
  <div id="modal-container"></div>
  
  ${user ? renderFloatingChatbot() : ''}
</body>
</html>
`;

const renderNavigation = (user: any) => html`
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
              <h1 class="text-xl font-semibold text-gray-900">ARIA5-Ubuntu</h1>
              <p class="text-xs text-gray-500">Phase 1-4 Enterprise Platform</p>
            </div>
          </a>
        </div>
        
        <!-- Navigation Menu -->
        <div class="hidden md:flex items-center space-x-2">
          <!-- Overview Dropdown -->
          <div class="relative" x-data="{ open: false }">
            <button @click="open = !open" @click.away="open = false" class="nav-item flex items-center space-x-1 text-gray-700 hover:text-blue-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
              <i class="fas fa-chart-line mr-1"></i>
              <span>Overview</span>
              <i class="fas fa-chevron-down text-xs transition-transform duration-200" :class="{ 'rotate-180': open }"></i>
            </button>
            <div x-show="open" 
                 x-cloak
                 x-transition:enter="dropdown-enter" 
                 x-transition:enter-active="dropdown-enter-active"
                 x-transition:leave="dropdown-leave" 
                 x-transition:leave-active="dropdown-leave-active"
                 @click.away="open = false"
                 class="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div class="py-2">
                <a href="/dashboard" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <i class="fas fa-tachometer-alt w-5 text-blue-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Dashboard</div>
                    <div class="text-xs text-gray-500">Main overview and metrics</div>
                  </div>
                </a>
                <a href="/reports" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors">
                  <i class="fas fa-chart-bar w-5 text-green-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Reports & Analytics</div>
                    <div class="text-xs text-gray-500">Generate comprehensive reports</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          
          <!-- Risk Dropdown -->
          <div class="relative" x-data="{ open: false }">
            <button @click="open = !open" @click.away="open = false" class="nav-item flex items-center space-x-1 text-gray-700 hover:text-orange-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
              <i class="fas fa-exclamation-triangle mr-1"></i>
              <span>Risk</span>
              <i class="fas fa-chevron-down text-xs transition-transform duration-200" :class="{ 'rotate-180': open }"></i>
            </button>
            <div x-show="open" 
                 x-cloak
                 x-transition:enter="dropdown-enter" 
                 x-transition:enter-active="dropdown-enter-active"
                 x-transition:leave="dropdown-leave" 
                 x-transition:leave-active="dropdown-leave-active"
                 @click.away="open = false"
                 class="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div class="py-2">
                <a href="/risks" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors">
                  <i class="fas fa-list-alt w-5 text-orange-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Risk Register</div>
                    <div class="text-xs text-gray-500">Manage organizational risks</div>
                  </div>
                </a>
                <a href="/risks/treatments" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors">
                  <i class="fas fa-shield-alt w-5 text-blue-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Risk Treatments</div>
                    <div class="text-xs text-gray-500">Mitigation strategies</div>
                  </div>
                </a>
                <a href="/risks/kris" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors">
                  <i class="fas fa-gauge-high w-5 text-purple-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Key Risk Indicators</div>
                    <div class="text-xs text-gray-500">Monitor risk metrics</div>
                  </div>
                </a>
                <hr class="my-2 border-gray-200">
                <a href="/risk/enhanced-dashboard" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 transition-colors">
                  <i class="fas fa-project-diagram w-5 text-indigo-600 mr-3"></i>
                  <div>
                    <div class="font-medium text-indigo-700">Enhanced Risk Framework</div>
                    <div class="text-xs text-indigo-500">Threat sources → Assets flow</div>
                  </div>
                </a>
                <a href="/risk/enhanced-wizard" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 transition-colors">
                  <i class="fas fa-magic w-5 text-purple-600 mr-3"></i>
                  <div>
                    <div class="font-medium text-purple-700">Risk Assessment Wizard</div>
                    <div class="text-xs text-purple-500">Comprehensive risk analysis</div>
                  </div>
                </a>
                <a href="/incidents" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors">
                  <i class="fas fa-fire w-5 text-red-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Incidents</div>
                    <div class="text-xs text-gray-500">Security & operational incidents</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          
          <!-- Compliance Dropdown -->
          <div class="relative" x-data="{ open: false }">
            <button @click="open = !open" @click.away="open = false" class="nav-item flex items-center space-x-1 text-gray-700 hover:text-purple-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
              <i class="fas fa-clipboard-check mr-1"></i>
              <span>Compliance</span>
              <i class="fas fa-chevron-down text-xs transition-transform duration-200" :class="{ 'rotate-180': open }"></i>
            </button>
            <div x-show="open" 
                 x-cloak
                 x-transition:enter="dropdown-enter" 
                 x-transition:enter-active="dropdown-enter-active"
                 x-transition:leave="dropdown-leave" 
                 x-transition:leave-active="dropdown-leave-active"
                 @click.away="open = false"
                 class="absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div class="py-2">
                <a href="/compliance/frameworks" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                  <i class="fas fa-building-columns w-5 text-purple-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Frameworks</div>
                    <div class="text-xs text-gray-500">ISO 27001, SOC 2, GDPR</div>
                  </div>
                </a>
                <a href="/compliance/soa" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                  <i class="fas fa-file-contract w-5 text-blue-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Statement of Applicability</div>
                    <div class="text-xs text-gray-500">Control implementation status</div>
                  </div>
                </a>
                <a href="/compliance/evidence" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                  <i class="fas fa-folder-open w-5 text-green-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Evidence</div>
                    <div class="text-xs text-gray-500">Supporting documentation</div>
                  </div>
                </a>
                <a href="/compliance/assessments" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors">
                  <i class="fas fa-tasks w-5 text-orange-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Assessments</div>
                    <div class="text-xs text-gray-500">Compliance evaluations</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          
          <!-- Operations Dropdown -->
          <div class="relative" x-data="{ open: false }">
            <button @click="open = !open" @click.away="open = false" class="nav-item flex items-center space-x-1 text-gray-700 hover:text-green-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
              <i class="fas fa-cogs mr-1"></i>
              <span>Operations</span>
              <i class="fas fa-chevron-down text-xs transition-transform duration-200" :class="{ 'rotate-180': open }"></i>
            </button>
            <div x-show="open" 
                 x-cloak
                 x-transition:enter="dropdown-enter" 
                 x-transition:enter-active="dropdown-enter-active"
                 x-transition:leave="dropdown-leave" 
                 x-transition:leave-active="dropdown-leave-active"
                 @click.away="open = false"
                 class="absolute left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div class="py-2">
                <a href="/operations" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                  <i class="fas fa-shield-alt w-5 text-blue-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Operations Center</div>
                    <div class="text-xs text-gray-500">Microsoft Defender & security operations</div>
                  </div>
                </a>
                <a href="/assets" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                  <i class="fas fa-server w-5 text-green-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Asset Management</div>
                    <div class="text-xs text-gray-500">IT assets & infrastructure</div>
                  </div>
                </a>
                <a href="/documents" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                  <i class="fas fa-file-alt w-5 text-blue-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Document Management</div>
                    <div class="text-xs text-gray-500">Policies, procedures & documents</div>
                  </div>
                </a>
                <a href="/policies" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                  <i class="fas fa-shield-alt w-5 text-purple-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Policy Management</div>
                    <div class="text-xs text-gray-500">Upload, search & manage security policies</div>
                  </div>
                </a>
                <a href="/notifications" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                  <i class="fas fa-bell w-5 text-yellow-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Real-time Notifications</div>
                    <div class="text-xs text-gray-500">Live WebSocket alerts & messaging</div>
                  </div>
                </a>
                <a href="/keys" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                  <i class="fas fa-key w-5 text-green-500 mr-3"></i>
                  <div>
                    <div class="font-medium">API Key Management</div>
                    <div class="text-xs text-gray-500">Secure credential storage</div>
                  </div>
                </a>
                <a href="/settings" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                  <i class="fas fa-sliders-h w-5 text-gray-500 mr-3"></i>
                  <div>
                    <div class="font-medium">System Settings</div>
                    <div class="text-xs text-gray-500">Platform configuration</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          
          <!-- Intelligence Dropdown -->
          <div class="relative" x-data="{ open: false }">
            <button @click="open = !open" @click.away="open = false" class="nav-item flex items-center space-x-1 text-gray-700 hover:text-indigo-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
              <i class="fas fa-brain mr-1"></i>
              <span>Intelligence</span>
              <i class="fas fa-chevron-down text-xs transition-transform duration-200" :class="{ 'rotate-180': open }"></i>
            </button>
            <div x-show="open" 
                 x-cloak
                 x-transition:enter="dropdown-enter" 
                 x-transition:enter-active="dropdown-enter-active"
                 x-transition:leave="dropdown-leave" 
                 x-transition:leave-active="dropdown-leave-active"
                 @click.away="open = false"
                 class="absolute left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div class="py-2">
                <a href="/ai-governance" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                  <i class="fas fa-robot w-5 text-purple-500 mr-3"></i>
                  <div>
                    <div class="font-medium">AI Governance</div>
                    <div class="text-xs text-gray-500">AI system oversight & ethics</div>
                  </div>
                </a>
                <a href="/ai-governance/systems" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                  <i class="fas fa-microchip w-5 text-blue-500 mr-3"></i>
                  <div>
                    <div class="font-medium">AI Systems Registry</div>
                    <div class="text-xs text-gray-500">Catalog of AI implementations</div>
                  </div>
                </a>
                <a href="/ai-governance/risk-assessments" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                  <i class="fas fa-exclamation-triangle w-5 text-orange-500 mr-3"></i>
                  <div>
                    <div class="font-medium">AI Risk Assessments</div>
                    <div class="text-xs text-gray-500">Risk evaluation & mitigation</div>
                  </div>
                </a>
                <a href="/ai-governance/incidents" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                  <i class="fas fa-bug w-5 text-red-500 mr-3"></i>
                  <div>
                    <div class="font-medium">AI Incidents</div>
                    <div class="text-xs text-gray-500">Issue tracking & resolution</div>
                  </div>
                </a>
                <div class="border-t border-gray-100"></div>
                <a href="/search" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                  <i class="fas fa-search w-5 text-indigo-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Global Search</div>
                    <div class="text-xs text-gray-500">Full-text search across platform</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          
          <!-- Advanced Analytics Dropdown (Phase 3) -->
          <div class="relative" x-data="{ open: false }">
            <button @click="open = !open" @click.away="open = false" class="nav-item flex items-center space-x-1 text-gray-700 hover:text-cyan-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
              <i class="fas fa-chart-pie mr-1"></i>
              <span>Advanced Analytics</span>
              <i class="fas fa-chevron-down text-xs transition-transform duration-200" :class="{ 'rotate-180': open }"></i>
            </button>
            <div x-show="open" 
                 x-cloak
                 x-transition:enter="dropdown-enter" 
                 x-transition:enter-active="dropdown-enter-active"
                 x-transition:leave="dropdown-leave" 
                 x-transition:leave-active="dropdown-leave-active"
                 @click.away="open = false"
                 class="absolute left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div class="py-2">
                <div class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  Machine Learning
                </div>
                <a href="/analytics" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors">
                  <i class="fas fa-brain w-5 text-cyan-500 mr-3"></i>
                  <div>
                    <div class="font-medium">ML Analytics Dashboard</div>
                    <div class="text-xs text-gray-500">AI-powered risk insights</div>
                  </div>
                </a>
                <a href="/analytics/predictions" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors">
                  <i class="fas fa-crystal-ball w-5 text-purple-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Risk Predictions</div>
                    <div class="text-xs text-gray-500">Machine learning risk forecasting</div>
                  </div>
                </a>
                <a href="/analytics/trends" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors">
                  <i class="fas fa-trending-up w-5 text-green-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Trend Analysis</div>
                    <div class="text-xs text-gray-500">Statistical trend modeling</div>
                  </div>
                </a>
                <a href="/analytics/anomalies" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-700 transition-colors">
                  <i class="fas fa-exclamation-circle w-5 text-orange-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Anomaly Detection</div>
                    <div class="text-xs text-gray-500">Outlier identification & analysis</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          
          <!-- Automation Dropdown (Phase 4) -->
          <div class="relative" x-data="{ open: false }">
            <button @click="open = !open" @click.away="open = false" class="nav-item flex items-center space-x-1 text-gray-700 hover:text-amber-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
              <i class="fas fa-magic mr-1"></i>
              <span>Automation</span>
              <i class="fas fa-chevron-down text-xs transition-transform duration-200" :class="{ 'rotate-180': open }"></i>
            </button>
            <div x-show="open" 
                 x-cloak
                 x-transition:enter="dropdown-enter" 
                 x-transition:enter-active="dropdown-enter-active"
                 x-transition:leave="dropdown-leave" 
                 x-transition:leave-active="dropdown-leave-active"
                 @click.away="open = false"
                 class="absolute left-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div class="py-2">
                <div class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  Threat Intelligence
                </div>
                <a href="/threat-intel" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors">
                  <i class="fas fa-search w-5 text-red-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Threat Intelligence Hub</div>
                    <div class="text-xs text-gray-500">IOC management & correlation</div>
                  </div>
                </a>
                <a href="/threat-intel/hunting" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors">
                  <i class="fas fa-crosshairs w-5 text-orange-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Threat Hunting</div>
                    <div class="text-xs text-gray-500">Advanced query builder & templates</div>
                  </div>
                </a>
                <a href="/threat-intel/correlation" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors">
                  <i class="fas fa-project-diagram w-5 text-purple-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Correlation Analysis</div>
                    <div class="text-xs text-gray-500">Automated threat correlation</div>
                  </div>
                </a>
                <div class="border-t border-gray-100"></div>
                <div class="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Incident Response (SOAR)
                </div>
                <a href="/incident-response" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors">
                  <i class="fas fa-fire-extinguisher w-5 text-blue-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Incident Response Center</div>
                    <div class="text-xs text-gray-500">Automated incident orchestration</div>
                  </div>
                </a>
                <a href="/incident-response/workflows" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors">
                  <i class="fas fa-sitemap w-5 text-green-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Response Workflows</div>
                    <div class="text-xs text-gray-500">Playbook automation & execution</div>
                  </div>
                </a>
                <a href="/incident-response/metrics" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-colors">
                  <i class="fas fa-tachometer-alt w-5 text-indigo-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Performance Metrics</div>
                    <div class="text-xs text-gray-500">MTTR, success rates & analytics</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          
          <!-- AI Assistant -->
          <a href="/ai" class="flex items-center space-x-1 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
            <i class="fas fa-robot text-blue-600 mr-1"></i>
            <span>ARIA Assistant</span>
          </a>
          
          <!-- Admin (if authorized) -->
          ${user?.role === 'admin' ? html`
          <div class="relative" x-data="{ open: false }">
            <button @click="open = !open" @click.away="open = false" class="nav-item flex items-center space-x-1 text-gray-700 hover:text-red-600 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200">
              <i class="fas fa-user-shield mr-1"></i>
              <span>Admin</span>
              <i class="fas fa-chevron-down text-xs transition-transform duration-200" :class="{ 'rotate-180': open }"></i>
            </button>
            <div x-show="open" 
                 x-cloak
                 x-transition:enter="dropdown-enter" 
                 x-transition:enter-active="dropdown-enter-active"
                 x-transition:leave="dropdown-leave" 
                 x-transition:leave-active="dropdown-leave-active"
                 @click.away="open = false"
                 class="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div class="py-2">
                <a href="/admin/users" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors">
                  <i class="fas fa-users w-5 text-blue-500 mr-3"></i>
                  <div>
                    <div class="font-medium">User Management</div>
                    <div class="text-xs text-gray-500">Manage system users</div>
                  </div>
                </a>
                <a href="/admin/organizations" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors">
                  <i class="fas fa-building w-5 text-purple-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Organizations</div>
                    <div class="text-xs text-gray-500">Manage organizations</div>
                  </div>
                </a>
                <a href="/admin/system" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors">
                  <i class="fas fa-server w-5 text-gray-500 mr-3"></i>
                  <div>
                    <div class="font-medium">System Health</div>
                    <div class="text-xs text-gray-500">System monitoring</div>
                  </div>
                </a>
                <a href="/admin/logs" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors">
                  <i class="fas fa-file-alt w-5 text-green-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Advanced Audit Logs</div>
                    <div class="text-xs text-gray-500">Comprehensive compliance logging</div>
                  </div>
                </a>
                <div class="border-t border-gray-100"></div>
                <a href="/rbac" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors">
                  <i class="fas fa-shield-alt w-5 text-red-500 mr-3"></i>
                  <div>
                    <div class="font-medium">RBAC Management</div>
                    <div class="text-xs text-gray-500">Role-based access control</div>
                  </div>
                </a>
                <a href="/2fa" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors">
                  <i class="fas fa-lock w-5 text-orange-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Two-Factor Auth</div>
                    <div class="text-xs text-gray-500">TOTP & security management</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
          ` : ''}
        </div>
        
        <!-- Notifications -->
        <div class="flex items-center space-x-4">
          <!-- Notification Bell -->
          <div class="relative" x-data="{ open: false }">
            <button @click="open = !open" class="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none">
              <i class="fas fa-bell text-lg"></i>
              <!-- Notification Badge -->
              <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                3
              </span>
            </button>
            <div x-show="open" @click.away="open = false" x-transition
                 class="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div class="p-4 border-b border-gray-100">
                <h3 class="text-sm font-semibold text-gray-900">Notifications</h3>
              </div>
              <div class="max-h-80 overflow-y-auto">
                <div class="p-4 text-sm text-gray-500 text-center">
                  No new notifications
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
  
  <!-- Mobile menu button -->
  <button class="md:hidden fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-3 shadow-lg z-40"
          onclick="document.getElementById('mobile-menu').classList.toggle('hidden')">
    <i class="fas fa-bars"></i>
  </button>
  
  <!-- Mobile menu -->
  <div id="mobile-menu" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
    <div class="bg-white w-64 h-full shadow-xl">
      <div class="p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <h2 class="text-lg font-bold">ARIA5.1 Menu</h2>
      </div>
      <div class="p-4 space-y-2">
        <a href="/dashboard" class="block px-4 py-2 text-sm hover:bg-gray-100 rounded">Dashboard</a>
        <a href="/risks" class="block px-4 py-2 text-sm hover:bg-gray-100 rounded">Risks</a>
        <a href="/compliance/frameworks" class="block px-4 py-2 text-sm hover:bg-gray-100 rounded">Compliance</a>
        <a href="/assets" class="block px-4 py-2 text-sm hover:bg-gray-100 rounded">Assets</a>
        <a href="/reports" class="block px-4 py-2 text-sm hover:bg-gray-100 rounded">Reports</a>
        <a href="/analytics" class="block px-4 py-2 text-sm hover:bg-gray-100 rounded">ML Analytics</a>
        <a href="/threat-intel" class="block px-4 py-2 text-sm hover:bg-gray-100 rounded">Threat Intelligence</a>
        <a href="/incident-response" class="block px-4 py-2 text-sm hover:bg-gray-100 rounded">Incident Response</a>
        <a href="/ai" class="block px-4 py-2 text-sm hover:bg-gray-100 rounded">ARIA Assistant</a>
        <a href="/settings" class="block px-4 py-2 text-sm hover:bg-gray-100 rounded">Settings</a>
        ${user?.role === 'admin' ? html`<a href="/admin" class="block px-4 py-2 text-sm hover:bg-gray-100 rounded">Admin</a>` : ''}
      </div>
    </div>
  </div>
`;

// Floating ARIA Chatbot Widget
const renderFloatingChatbot = () => html`
  <!-- Floating ARIA Chatbot -->
  <div id="aria-floating-chat" class="fixed bottom-6 right-6 z-50">
    <!-- Chat Toggle Button -->
    <div id="aria-chat-toggle" class="relative">
      <button onclick="toggleAriaChat()" 
              class="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 relative">
        <i class="fas fa-robot text-xl"></i>
        <!-- Notification Badge -->
        <span id="aria-notification-badge" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center hidden">!</span>
      </button>
    </div>
    
    <!-- Chat Window -->
    <div id="aria-chat-window" class="absolute bottom-16 right-0 w-96 h-128 bg-white rounded-lg shadow-2xl border border-gray-200 hidden">
      <!-- Chat Header -->
      <div class="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <i class="fas fa-robot text-lg"></i>
            <div>
              <h3 class="font-semibold">ARIA Assistant</h3>
              <p class="text-blue-100 text-xs">AI-Powered Risk Intelligence</p>
            </div>
          </div>
          <div class="flex items-center space-x-2">
            <span class="px-2 py-1 bg-green-500 text-white text-xs rounded-full">
              <i class="fas fa-circle text-xs mr-1"></i>Online
            </span>
            <button onclick="toggleAriaChat()" class="text-white hover:text-gray-200">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Chat Messages -->
      <div id="aria-chat-messages" class="flex-1 p-4 h-80 overflow-y-auto bg-gray-50">
        <!-- Welcome Message -->
        <div class="mb-4">
          <div class="flex items-start space-x-2">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <i class="fas fa-robot text-blue-600 text-sm"></i>
            </div>
            <div class="flex-1">
              <div class="bg-white rounded-lg px-3 py-2 shadow-sm">
                <p class="text-sm text-gray-800">
                  <strong>Hello! I'm ARIA,</strong> your AI Risk Intelligence Assistant. 
                  I can help you with:
                </p>
                <ul class="mt-2 text-sm text-gray-600 space-y-1">
                  <li>• Security policies and procedures</li>
                  <li>• Risk management guidance</li>
                  <li>• Compliance requirements</li>
                  <li>• Platform navigation help</li>
                </ul>
                <p class="mt-2 text-xs text-gray-500">Ask me anything about risk management!</p>
              </div>
              <p class="text-xs text-gray-400 mt-1">ARIA • Just now</p>
            </div>
          </div>
        </div>
        
        <!-- Quick Action Buttons -->
        <div class="mb-4 space-y-2">
          <p class="text-xs text-gray-500 font-medium">Quick Actions:</p>
          <div class="flex flex-wrap gap-2">
            <button onclick="sendQuickMessage('What are the password requirements?')" 
                    class="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs hover:bg-blue-200">
              Password Policy
            </button>
            <button onclick="sendQuickMessage('How do I create a new risk?')" 
                    class="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs hover:bg-green-200">
              Create Risk
            </button>
            <button onclick="sendQuickMessage('What ISO 27001 controls do we need?')" 
                    class="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs hover:bg-purple-200">
              ISO 27001
            </button>
            <button onclick="sendQuickMessage('How does incident response work?')" 
                    class="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs hover:bg-red-200">
              Incidents
            </button>
          </div>
        </div>
      </div>
      
      <!-- Chat Input -->
      <div class="p-4 border-t bg-white rounded-b-lg">
        <form id="aria-chat-form" class="flex space-x-2">
          <input type="text" 
                 id="aria-chat-input"
                 placeholder="Ask ARIA about policies, risks, or compliance..." 
                 class="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          <button type="submit" 
                  class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            <i class="fas fa-paper-plane"></i>
          </button>
        </form>
        <p class="text-xs text-gray-400 mt-2">
          Powered by RAG & AI • Connected to your policies
        </p>
      </div>
    </div>
  </div>

  <!-- Floating Chat Styles & Scripts -->
  <style>
    #aria-chat-window {
      height: 32rem; /* h-128 equivalent */
    }
    
    .chat-message-user {
      background: #3B82F6;
      color: white;
      margin-left: 2rem;
    }
    
    .chat-message-aria {
      background: white;
      color: #374151;
      margin-right: 2rem;
    }
    
    .animate-bounce-slow {
      animation: bounce 2s infinite;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }
    
    .fade-in-scale {
      animation: fadeIn 0.2s ease-out;
    }
  </style>

  <script>
    let ariaChatOpen = false;
    
    function toggleAriaChat() {
      const chatWindow = document.getElementById('aria-chat-window');
      const chatToggle = document.getElementById('aria-chat-toggle');
      
      ariaChatOpen = !ariaChatOpen;
      
      if (ariaChatOpen) {
        chatWindow.classList.remove('hidden');
        chatWindow.classList.add('fade-in-scale');
        document.getElementById('aria-chat-input').focus();
      } else {
        chatWindow.classList.add('hidden');
        chatWindow.classList.remove('fade-in-scale');
      }
    }
    
    function sendQuickMessage(message) {
      document.getElementById('aria-chat-input').value = message;
      sendAriaMessage();
    }
    
    function sendAriaMessage() {
      const input = document.getElementById('aria-chat-input');
      const message = input.value.trim();
      
      if (!message) return;
      
      // Add user message to chat
      addMessageToChat(message, 'user');
      
      // Clear input
      input.value = '';
      
      // Send to ARIA backend
      fetch('/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'message=' + encodeURIComponent(message)
      })
      .then(response => response.text())
      .then(html => {
        // Extract ARIA response from HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const ariaResponse = doc.querySelector('.bg-gray-100 p');
        
        if (ariaResponse) {
          addMessageToChat(ariaResponse.textContent, 'aria');
        } else {
          addMessageToChat('I''m sorry, I''m having trouble processing your request right now. Please try again or visit the full AI Assistant page.', 'aria');
        }
      })
      .catch(error => {
        console.error('ARIA chat error:', error);
        addMessageToChat('Sorry, I''m experiencing technical difficulties. Please try again later.', 'aria');
      });
    }
    
    function addMessageToChat(message, sender) {
      const messagesContainer = document.getElementById('aria-chat-messages');
      const messageDiv = document.createElement('div');
      messageDiv.className = 'mb-4';
      
      const timestamp = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      
      if (sender === 'user') {
        messageDiv.innerHTML = \`
          <div class="flex items-start space-x-2 justify-end">
            <div class="flex-1 max-w-xs">
              <div class="bg-blue-600 text-white rounded-lg px-3 py-2 text-sm">
                \${message}
              </div>
              <p class="text-xs text-gray-400 mt-1 text-right">You • \${timestamp}</p>
            </div>
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <i class="fas fa-user text-blue-600 text-sm"></i>
            </div>
          </div>
        \`;
      } else {
        messageDiv.innerHTML = \`
          <div class="flex items-start space-x-2">
            <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <i class="fas fa-robot text-blue-600 text-sm"></i>
            </div>
            <div class="flex-1">
              <div class="bg-white rounded-lg px-3 py-2 shadow-sm">
                <p class="text-sm text-gray-800">\${message}</p>
              </div>
              <p class="text-xs text-gray-400 mt-1">ARIA • \${timestamp}</p>
            </div>
          </div>
        \`;
      }
      
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    // Handle form submission
    document.addEventListener('DOMContentLoaded', function() {
      const chatForm = document.getElementById('aria-chat-form');
      if (chatForm) {
        chatForm.addEventListener('submit', function(e) {
          e.preventDefault();
          sendAriaMessage();
        });
      }
    });
    
    // Auto-focus input when chat opens
    document.addEventListener('click', function(e) {
      if (e.target.closest('#aria-chat-toggle')) {
        setTimeout(() => {
          const input = document.getElementById('aria-chat-input');
          if (input && !document.getElementById('aria-chat-window').classList.contains('hidden')) {
            input.focus();
          }
        }, 100);
      }
    });
  </script>
`;