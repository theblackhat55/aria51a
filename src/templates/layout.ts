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
  
  <!-- Alpine.js for minimal client-side interactivity -->
  <script src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
  <script>
    // Ensure Alpine.js initializes properly
    document.addEventListener('DOMContentLoaded', function() {
      console.log('DOM loaded, checking Alpine.js...');
    });
    
    document.addEventListener('alpine:init', () => {
      console.log('Alpine.js initialized successfully!');
    });
    
    // Fallback check for Alpine.js
    window.addEventListener('load', function() {
      setTimeout(function() {
        if (typeof window.Alpine === 'undefined') {
          console.error('Alpine.js failed to load, initializing fallback dropdowns');
          initFallbackDropdowns();
        } else {
          console.log('Alpine.js is working correctly');
        }
      }, 500);
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
  
  <!-- AI Governance Scripts -->
  <script src="/static/ai-governance.js"></script>
  
  <!-- Custom HTMX Configuration -->
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Configure HTMX
      htmx.config.defaultSwapStyle = 'innerHTML';
      htmx.config.historyCacheSize = 0;
      
      // Add CSRF token and authentication to all requests
      document.body.addEventListener('htmx:configRequest', function(event) {
        // Add CSRF token if available
        const token = document.querySelector('meta[name="csrf-token"]')?.content;
        if (token) {
          event.detail.headers['X-CSRF-Token'] = token;
        }
        
        // Add JWT token from localStorage if available
        const jwtToken = localStorage.getItem('aria_token');
        if (jwtToken) {
          event.detail.headers['Authorization'] = 'Bearer ' + jwtToken;
        }
        
        // Ensure credentials are sent with requests
        event.detail.xhr.withCredentials = true;
      });
      
      // Handle HTMX errors
      document.body.addEventListener('htmx:responseError', function(event) {
        console.error('HTMX Error:', event.detail);
        if (event.detail.xhr.status === 401) {
          window.location.href = '/login';
        }
      });
      
      // Fallback dropdown functionality if Alpine.js fails
      console.log('Checking Alpine.js initialization...');
      setTimeout(function() {
        if (typeof window.Alpine === 'undefined') {
          console.warn('Alpine.js not loaded, using fallback dropdown functionality');
          initFallbackDropdowns();
        } else {
          console.log('Alpine.js loaded successfully');
        }
      }, 1000);
    });
    
    function initFallbackDropdowns() {
      console.log('Initializing fallback dropdown system...');
      
      document.querySelectorAll('[x-data*="open"]').forEach(function(dropdown, index) {
        console.log('Setting up dropdown #' + (index + 1));
        
        const button = dropdown.querySelector('button');
        const menu = dropdown.querySelector('div[x-show]');
        let isOpen = false;
        
        if (button && menu) {
          // Initially hide all dropdowns
          menu.style.display = 'none';
          menu.classList.add('dropdown-closed');
          
          button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            // Close all other dropdowns first
            document.querySelectorAll('[x-data*="open"]').forEach(function(otherDropdown) {
              if (otherDropdown !== dropdown) {
                const otherMenu = otherDropdown.querySelector('div[x-show]');
                if (otherMenu) {
                  otherMenu.style.display = 'none';
                  otherMenu.classList.add('dropdown-closed');
                }
              }
            });
            
            isOpen = !isOpen;
            menu.style.display = isOpen ? 'block' : 'none';
            menu.classList.toggle('dropdown-closed', !isOpen);
            
            console.log('Dropdown #' + (index + 1) + ' is now: ' + (isOpen ? 'open' : 'closed'));
          });
          
          // Close on click outside
          document.addEventListener('click', function(e) {
            if (!dropdown.contains(e.target)) {
              isOpen = false;
              menu.style.display = 'none';
              menu.classList.add('dropdown-closed');
            }
          });
        } else {
          console.warn('Dropdown #' + (index + 1) + ' missing button or menu elements');
        }
      });
    }
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
    
    /* Ensure dropdowns are hidden by default */
    [x-show="open"] {
      display: none;
    }
    [x-cloak] { 
      display: none !important; 
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
              <h1 class="text-xl font-semibold text-gray-900">ARIA5.1</h1>
              <p class="text-xs text-gray-500">HTMX Edition</p>
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
                 x-transition:enter="dropdown-enter" 
                 x-transition:enter-active="dropdown-enter-active"
                 x-transition:leave="dropdown-leave" 
                 x-transition:leave-active="dropdown-leave-active"
                 @click.away="open = false"
                 class="absolute left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div class="py-2">
                <a href="/assets" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                  <i class="fas fa-server w-5 text-blue-500 mr-3"></i>
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
                <a href="/notifications" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors">
                  <i class="fas fa-bell w-5 text-yellow-500 mr-3"></i>
                  <div>
                    <div class="font-medium">Notification Center</div>
                    <div class="text-xs text-gray-500">System alerts & communications</div>
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
                    <div class="font-medium">Audit Logs</div>
                    <div class="text-xs text-gray-500">System audit trail</div>
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
              <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center" 
                    hx-get="/notifications/count" 
                    hx-trigger="load, every 30s" 
                    hx-swap="innerHTML">
                3
              </span>
            </button>
            <div x-show="open" @click.away="open = false" x-transition
                 hx-get="/notifications/dropdown" 
                 hx-trigger="revealed"
                 hx-swap="innerHTML"
                 class="absolute right-0 mt-2 z-50">
              <!-- Notification dropdown will be loaded here -->
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
        <a href="/ai" class="block px-4 py-2 text-sm hover:bg-gray-100 rounded">ARIA Assistant</a>
        <a href="/settings" class="block px-4 py-2 text-sm hover:bg-gray-100 rounded">Settings</a>
        ${user?.role === 'admin' ? html`<a href="/admin" class="block px-4 py-2 text-sm hover:bg-gray-100 rounded">Admin</a>` : ''}
      </div>
    </div>
  </div>
`;