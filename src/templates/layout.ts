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
  <script defer src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js"></script>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Font Awesome -->
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  
  <!-- Custom Styles -->
  <link href="/static/styles.css" rel="stylesheet">
  
  <!-- Chart.js for Analytics -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  
  <!-- Custom HTMX Configuration -->
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      // Configure HTMX
      htmx.config.defaultSwapStyle = 'innerHTML';
      htmx.config.historyCacheSize = 0;
      
      // Add CSRF token to all requests if available
      document.body.addEventListener('htmx:configRequest', function(event) {
        const token = document.querySelector('meta[name="csrf-token"]')?.content;
        if (token) {
          event.detail.headers['X-CSRF-Token'] = token;
        }
      });
      
      // Handle HTMX errors
      document.body.addEventListener('htmx:responseError', function(event) {
        console.error('HTMX Error:', event.detail);
        if (event.detail.xhr.status === 401) {
          window.location.href = '/login';
        }
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
        <div class="hidden md:flex items-center space-x-6">
          <!-- Overview Dropdown -->
          <div class="relative" x-data="{ open: false }">
            <button @click="open = !open" class="flex items-center space-x-1 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              <span>Overview</span>
              <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div x-show="open" @click.away="open = false" x-transition
                 class="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <a href="/dashboard" class="block px-4 py-2 text-sm hover:bg-gray-50">Dashboard</a>
              <a href="/reports" class="block px-4 py-2 text-sm hover:bg-gray-50">Reports & Analytics</a>
            </div>
          </div>
          
          <!-- Risk Dropdown -->
          <div class="relative" x-data="{ open: false }">
            <button @click="open = !open" class="flex items-center space-x-1 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              <span>Risk</span>
              <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div x-show="open" @click.away="open = false" x-transition
                 class="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <a href="/risks" class="block px-4 py-2 text-sm hover:bg-gray-50">Risks</a>
              <a href="/risks/treatments" class="block px-4 py-2 text-sm hover:bg-gray-50">Treatments</a>
              <a href="/risks/kris" class="block px-4 py-2 text-sm hover:bg-gray-50">KRIs</a>
              <a href="/incidents" class="block px-4 py-2 text-sm hover:bg-gray-50">Incidents</a>
            </div>
          </div>
          
          <!-- Compliance Dropdown -->
          <div class="relative" x-data="{ open: false }">
            <button @click="open = !open" class="flex items-center space-x-1 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              <span>Compliance</span>
              <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div x-show="open" @click.away="open = false" x-transition
                 class="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <a href="/compliance/frameworks" class="block px-4 py-2 text-sm hover:bg-gray-50">Frameworks</a>
              <a href="/compliance/soa" class="block px-4 py-2 text-sm hover:bg-gray-50">SoA</a>
              <a href="/compliance/evidence" class="block px-4 py-2 text-sm hover:bg-gray-50">Evidence</a>
              <a href="/compliance/assessments" class="block px-4 py-2 text-sm hover:bg-gray-50">Assessments</a>
            </div>
          </div>
          
          <!-- Operations Dropdown -->
          <div class="relative" x-data="{ open: false }">
            <button @click="open = !open" class="flex items-center space-x-1 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              <span>Operations</span>
              <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div x-show="open" @click.away="open = false" x-transition
                 class="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <a href="/assets" class="block px-4 py-2 text-sm hover:bg-gray-50">Assets</a>
              <a href="/settings" class="block px-4 py-2 text-sm hover:bg-gray-50">Settings</a>
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
            <button @click="open = !open" class="flex items-center space-x-1 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
              <span>Admin</span>
              <i class="fas fa-chevron-down text-xs"></i>
            </button>
            <div x-show="open" @click.away="open = false" x-transition
                 class="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
              <a href="/admin/users" class="block px-4 py-2 text-sm hover:bg-gray-50">Users</a>
              <a href="/admin/organizations" class="block px-4 py-2 text-sm hover:bg-gray-50">Organizations</a>
            </div>
          </div>
          ` : ''}
        </div>
        
        <!-- User Section -->
        <div class="flex items-center space-x-4">
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