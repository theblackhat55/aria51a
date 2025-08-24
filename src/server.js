// DMT Risk Assessment System - Node.js Server for Docker/Ubuntu
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { createAPI } from './api/index.js';
import { initializeDatabase } from './database/sqlite.js';

const app = new Hono();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use('*', cors({
  origin: [`http://localhost:${PORT}`, 'http://localhost:3000', 'http://127.0.0.1:3000'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
  credentials: true,
}));

// Add request logging
app.use('*', logger());

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

// Security headers middleware
app.use('*', async (c, next) => {
  await next();
  
  // Security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self'");
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '2.0.1',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mock Keycloak endpoints for native deployment
// import { mockKeycloak } from './mock-keycloak.js';

/* // Mock Keycloak auth page
app.get('/mock-keycloak/auth', (c) => {
  const clientId = c.req.query('client_id');
  const redirectUri = c.req.query('redirect_uri');
  const state = c.req.query('state');
  const scope = c.req.query('scope');
  
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DMT Keycloak - Sign In</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center">
  <div class="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
    <div class="text-center">
      <div class="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
        <i class="fas fa-shield-alt text-white text-2xl"></i>
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        DMT Keycloak SSO
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Enterprise Single Sign-On
      </p>
    </div>
    
    <form id="mock-keycloak-form" class="mt-8 space-y-6">
      <input type="hidden" name="client_id" value="${clientId}">
      <input type="hidden" name="redirect_uri" value="${redirectUri}">
      <input type="hidden" name="state" value="${state}">
      <input type="hidden" name="scope" value="${scope}">
      
      <div class="space-y-4">
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700">Username</label>
          <input type="text" id="username" name="username" required 
                 class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                 placeholder="Enter your username">
        </div>
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
          <input type="password" id="password" name="password" required 
                 class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" 
                 placeholder="Enter your password">
        </div>
      </div>

      <div class="bg-blue-50 p-4 rounded-lg">
        <h4 class="font-medium text-blue-900 mb-2">Test Accounts:</h4>
        <div class="text-sm text-blue-800 space-y-1">
          <div><strong>admin</strong> / password123 (Administrator)</div>
          <div><strong>avi_security</strong> / password123 (Risk Manager)</div>
          <div><strong>sjohnson</strong> / password123 (Compliance Officer)</div>
        </div>
      </div>

      <div id="error-message" class="hidden p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
      </div>

      <button type="submit" id="login-btn" 
              class="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
        <span id="login-text">Sign In</span>
        <div id="login-spinner" class="hidden ml-3">
          <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
        </div>
      </button>
    </form>
  </div>

  <script>
    document.getElementById('mock-keycloak-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const loginBtn = document.getElementById('login-btn');
      const loginText = document.getElementById('login-text');
      const loginSpinner = document.getElementById('login-spinner');
      const errorMessage = document.getElementById('error-message');
      
      // Show loading state
      loginBtn.disabled = true;
      loginText.textContent = 'Signing in...';
      loginSpinner.classList.remove('hidden');
      errorMessage.classList.add('hidden');
      
      const formData = new FormData(e.target);
      
      try {
        const response = await fetch('/mock-keycloak/authenticate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username: formData.get('username'),
            password: formData.get('password'),
            client_id: formData.get('client_id'),
            redirect_uri: formData.get('redirect_uri'),
            state: formData.get('state')
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          window.location.href = data.redirectUrl;
        } else {
          errorMessage.textContent = data.error || 'Authentication failed';
          errorMessage.classList.remove('hidden');
        }
      } catch (error) {
        errorMessage.textContent = 'Network error occurred';
        errorMessage.classList.remove('hidden');
      }
      
      // Reset loading state
      loginBtn.disabled = false;
      loginText.textContent = 'Sign In';
      loginSpinner.classList.add('hidden');
    });
    
    // Auto-focus username field
    document.getElementById('username').focus();
  </script>
</body>
</html>`);
});

*/
// Mock Keycloak authentication handler
/* app.post('/mock-keycloak/authenticate', async (c) => {
  try {
    const { username, password, client_id, redirect_uri, state } = await c.req.json();
    
    const authCode = await mockKeycloak.handleAuth(username, password, state);
    
    const redirectUrl = `${redirect_uri}?code=${authCode}&state=${state}`;
    
    return c.json({
      success: true,
      redirectUrl: redirectUrl
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 400);
  }
});
*/

// API routes
const api = createAPI();
app.route('/', api);

// Main application route
app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ARIA - AI Risk Intelligence Assistant</title>
  <meta name="description" content="AI-Powered Risk Intelligence Assistant - Next-Generation Enterprise GRC Platform with Advanced Analytics">
  <link rel="icon" href="/static/favicon.svg" type="image/svg+xml">
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  
  <!-- Chart.js for Analytics -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  
  <!-- Additional Libraries -->
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js"></script>
  
  <!-- Custom Styles -->
  <link href="/static/styles.css?v=3" rel="stylesheet">
</head>
<body class="bg-gray-50 font-sans antialiased">
  <!-- Helpers to avoid ReferenceErrors must be loaded first -->
  <script src="/static/helpers.js"></script>
  
  <!-- Loading Spinner -->
  <div id="loading-spinner" class="fixed inset-0 bg-white z-50 flex items-center justify-center">
    <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>

  <!-- Main Application Container -->
  <div id="app" class="min-h-screen">
    <!-- Modern Collapsible Navigation -->
    <nav id="navigation" class="bg-white shadow-lg border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex justify-between items-center h-16">
          <!-- Logo and Brand -->
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="h-10 w-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <i class="fas fa-shield-alt text-white"></i>
              </div>
            </div>
            <div class="ml-4">
              <h1 class="text-xl font-semibold text-gray-900">ARIA</h1>
              <p class="text-xs text-gray-500">AI Risk Intelligence Assistant v5.2</p>
            </div>
          </div>
          
          <!-- Mobile Hamburger Menu Button -->
          <button class="hamburger" id="mobile-menu-btn" aria-label="Open navigation menu">
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          <!-- Mobile Login Button (visible when not authenticated) -->
          <button id="mobile-auth-button" class="md:hidden bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200" style="display: none;">
            <i class="fas fa-sign-in-alt mr-1"></i>Login
          </button>
          
          <!-- Grouped navigation with click-to-open dropdowns (restored) -->
          <div class="hidden md:flex items-center space-x-4" id="internal-nav">
            <!-- Overview -->
            <details class="relative dropdown">
              <summary class="nav-menu-item cursor-pointer list-none">
                Overview <i class="fas fa-chevron-down ml-1 text-xs"></i>
              </summary>
              <div class="dropdown-menu absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg">
                <a href="#" data-page="dashboard" class="block px-4 py-2 text-sm hover:bg-gray-50">Dashboard</a>
                <a href="#" data-page="reports" class="block px-4 py-2 text-sm hover:bg-gray-50">Reports</a>
              </div>
            </details>

            <!-- Risk -->
            <details class="relative dropdown">
              <summary class="nav-menu-item cursor-pointer list-none">
                Risk <i class="fas fa-chevron-down ml-1 text-xs"></i>
              </summary>
              <div class="dropdown-menu absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg">
                <a href="#" data-page="risks" class="block px-4 py-2 text-sm hover:bg-gray-50">Risks</a>
                <a href="#" data-page="treatments" class="block px-4 py-2 text-sm hover:bg-gray-50">Treatments</a>
                <a href="#" data-page="kris" class="block px-4 py-2 text-sm hover:bg-gray-50">KRIs</a>
                <a href="#" data-page="incidents" class="block px-4 py-2 text-sm hover:bg-gray-50">Incidents</a>
              </div>
            </details>

            <!-- Compliance -->
            <details class="relative dropdown">
              <summary class="nav-menu-item cursor-pointer list-none">
                Compliance <i class="fas fa-chevron-down ml-1 text-xs"></i>
              </summary>
              <div class="dropdown-menu absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg">
                <a href="#" data-page="frameworks" class="block px-4 py-2 text-sm hover:bg-gray-50">Frameworks</a>
                <a href="#" data-page="soa" class="block px-4 py-2 text-sm hover:bg-gray-50">SoA</a>
                <a href="#" data-page="evidence" class="block px-4 py-2 text-sm hover:bg-gray-50">Evidence</a>
                <a href="#" data-page="assessments" class="block px-4 py-2 text-sm hover:bg-gray-50">Assessments</a>
              </div>
            </details>

            <!-- Operations -->
            <details class="relative dropdown">
              <summary class="nav-menu-item cursor-pointer list-none">
                Operations <i class="fas fa-chevron-down ml-1 text-xs"></i>
              </summary>
              <div class="dropdown-menu absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg">
                <a href="#" data-page="assets" class="block px-4 py-2 text-sm hover:bg-gray-50">Assets</a>
                <a href="#" data-page="services" class="block px-4 py-2 text-sm hover:bg-gray-50">Services</a>
                <a href="#" data-page="documents" class="block px-4 py-2 text-sm hover:bg-gray-50">Documents</a>
              </div>
            </details>

            <!-- Intelligence -->
            <details class="relative dropdown">
              <summary class="nav-menu-item cursor-pointer list-none">
                Intelligence <i class="fas fa-chevron-down ml-1 text-xs"></i>
              </summary>
              <div class="dropdown-menu absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg">
                <a href="#" data-page="ai-assure" class="block px-4 py-2 text-sm hover:bg-gray-50">AI/ARIA</a>
                <a href="#" data-page="ai-providers" class="block px-4 py-2 text-sm hover:bg-gray-50">AI Providers</a>
                <a href="#" data-page="rag-knowledge" class="block px-4 py-2 text-sm hover:bg-gray-50">RAG & Knowledge</a>
                <a href="#" data-page="search" class="block px-4 py-2 text-sm hover:bg-gray-50">Search</a>
                <a href="#" data-page="ai-analytics" class="block px-4 py-2 text-sm hover:bg-gray-50">AI Analytics</a>
              </div>
            </details>

            <!-- Admin -->
            <details id="menu-admin" class="relative dropdown">
              <summary class="nav-menu-item cursor-pointer list-none">
                Admin <i class="fas fa-chevron-down ml-1 text-xs"></i>
              </summary>
              <div class="dropdown-menu absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg">
                <a href="#" data-page="settings" class="block px-4 py-2 text-sm hover:bg-gray-50">Settings</a>
              </div>
            </details>

            <button id="auth-button" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">Login</button>
          </div>

          <!-- Status Indicator -->
          <div class="flex items-center space-x-2">
            <div class="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span class="text-xs text-gray-600">Online</span>
          </div>
        </div>
      </div>
    </nav>

    <!-- Mobile Navigation Overlay -->
    <div class="mobile-nav-overlay" id="mobile-nav-overlay"></div>

    <!-- Mobile Navigation Menu -->
    <nav class="mobile-nav" id="mobile-nav">
      <div class="mobile-nav-header">
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <div class="h-8 w-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <i class="fas fa-shield-alt text-white"></i>
            </div>
            <div class="ml-3">
              <h1 class="text-lg font-semibold">ARIA</h1>
              <p class="text-xs opacity-80">AI Risk Intelligence v5.2</p>
            </div>
          </div>
          <button class="text-white p-2" id="mobile-nav-close">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>
      </div>

      <div class="mobile-nav-content">
        <!-- Overview Section -->
        <div class="mobile-nav-section">
          <div class="mobile-nav-section-title">Overview</div>
          <a href="#" data-page="dashboard" class="mobile-nav-item">
            <i class="fas fa-tachometer-alt"></i>Dashboard
          </a>
          <a href="#" data-page="reports" class="mobile-nav-item">
            <i class="fas fa-chart-bar"></i>Reports
          </a>
        </div>

        <!-- Risk Management -->
        <div class="mobile-nav-section">
          <div class="mobile-nav-section-title">Risk Management</div>
          <a href="#" data-page="risks" class="mobile-nav-item">
            <i class="fas fa-exclamation-triangle"></i>Risks
          </a>
          <a href="#" data-page="treatments" class="mobile-nav-item">
            <i class="fas fa-shield-alt"></i>Treatments
          </a>
          <a href="#" data-page="kris" class="mobile-nav-item">
            <i class="fas fa-chart-line"></i>KRIs
          </a>
          <a href="#" data-page="incidents" class="mobile-nav-item">
            <i class="fas fa-fire"></i>Incidents
          </a>
        </div>

        <!-- Compliance -->
        <div class="mobile-nav-section">
          <div class="mobile-nav-section-title">Compliance</div>
          <a href="#" data-page="frameworks" class="mobile-nav-item">
            <i class="fas fa-sitemap"></i>Frameworks
          </a>
          <a href="#" data-page="soa" class="mobile-nav-item">
            <i class="fas fa-clipboard-check"></i>SoA
          </a>
          <a href="#" data-page="evidence" class="mobile-nav-item">
            <i class="fas fa-file-alt"></i>Evidence
          </a>
          <a href="#" data-page="assessments" class="mobile-nav-item">
            <i class="fas fa-tasks"></i>Assessments
          </a>
        </div>

        <!-- Operations -->
        <div class="mobile-nav-section">
          <div class="mobile-nav-section-title">Operations</div>
          <a href="#" data-page="assets" class="mobile-nav-item">
            <i class="fas fa-server"></i>Assets
          </a>
          <a href="#" data-page="services" class="mobile-nav-item">
            <i class="fas fa-cogs"></i>Services
          </a>
          <a href="#" data-page="documents" class="mobile-nav-item">
            <i class="fas fa-folder"></i>Documents
          </a>
        </div>

        <!-- Intelligence -->
        <div class="mobile-nav-section">
          <div class="mobile-nav-section-title">Intelligence</div>
          <a href="#" data-page="ai-assure" class="mobile-nav-item">
            <i class="fas fa-robot"></i>AI/ARIA
          </a>
          <a href="#" data-page="ai-providers" class="mobile-nav-item">
            <i class="fas fa-cloud"></i>AI Providers
          </a>
          <a href="#" data-page="rag-knowledge" class="mobile-nav-item">
            <i class="fas fa-brain"></i>RAG & Knowledge
          </a>
          <a href="#" data-page="search" class="mobile-nav-item">
            <i class="fas fa-search"></i>Search
          </a>
          <a href="#" data-page="ai-analytics" class="mobile-nav-item">
            <i class="fas fa-chart-pie"></i>AI Analytics
          </a>
        </div>

        <!-- Administration -->
        <div class="mobile-nav-section">
          <div class="mobile-nav-section-title">Administration</div>
          <a href="#" data-page="settings" class="mobile-nav-item">
            <i class="fas fa-cog"></i>Settings
          </a>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main id="main-content" class="container mx-auto px-4 py-8">
      <!-- Content will be loaded here -->
    </main>
  </div>

  <!-- Scripts -->
  <!-- Keycloak auth disabled -->
  <script src="/static/app.js"></script>
  <script src="/static/modules.js"></script>
  <script src="/static/notifications.js"></script>
  <script src="/static/risk-management-enhanced.js"></script>
  <script src="/static/incident-management-enhanced.js"></script>
  <script src="/static/document-management.js"></script>
  <script src="/static/asset-service-management.js"></script>
  <script src="/static/framework-management.js"></script>
  <script src="/static/enhanced-settings.js"></script>
  <script src="/static/enterprise-modules.js"></script>
  <script src="/static/integrated-risk-framework.js"></script>
  <script src="/static/system-settings-integration.js"></script>
  <!-- <script src="/static/ai-grc-dashboard.js"></script> -->
  <script src="/static/ai-assure-module.js"></script>
  <script src="/static/mobile-interface.js"></script>
  <script src="/static/risk-enhancements.js"></script>
  <script src="/static/aria-chat.js"></script>
</body>
</html>
  `);
});

// Login route
app.get('/login', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - ARIA</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gray-50 min-h-screen flex items-center justify-center">
  <div class="max-w-md w-full space-y-8">
    <div>
      <div class="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
        <i class="fas fa-shield-alt text-white text-xl"></i>
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        ARIA
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        AI Risk Intelligence Assistant - Secure Access
      </p>
    </div>
    
    <div id="login-container" class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
      <!-- Basic Authentication Form -->
      <div class="space-y-6">
        <div class="space-y-6">
          <form id="login-form" class="space-y-6">
            <div>
              <label for="username" class="block text-sm font-medium text-gray-700">Username</label>
              <input type="text" id="username" name="username" required class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Enter username" />
            </div>
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" id="password" name="password" required class="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" placeholder="Enter password" />
            </div>
            <div id="login-error" class="hidden p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm"></div>
            <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md">
              <i class="fas fa-sign-in-alt mr-2"></i>Sign In to ARIA
            </button>
          </form>
        </div>
        
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <div class="text-center">
            <h4 class="font-semibold text-blue-900 mb-3">✨ Available Test Users</h4>
            <div class="grid grid-cols-1 gap-2 text-sm text-blue-800">
              <div class="flex justify-between items-center py-1">
                <span class="font-medium">admin</span>
                <span class="text-xs bg-blue-200 px-2 py-1 rounded">System Administrator</span>
              </div>
              <div class="flex justify-between items-center py-1">
                <span class="font-medium">avi_security</span>
                <span class="text-xs bg-green-200 px-2 py-1 rounded">Risk Manager</span>
              </div>
              <div class="flex justify-between items-center py-1">
                <span class="font-medium">sjohnson</span>
                <span class="text-xs bg-yellow-200 px-2 py-1 rounded">Compliance Officer</span>
              </div>
            </div>
            <div class="mt-4 p-3 bg-blue-100 rounded-lg">
              <p class="text-sm text-blue-900">
                <i class="fas fa-key mr-2"></i>
                Password for all users: <code class="bg-white px-2 py-1 rounded font-mono text-blue-700">demo123</code>
              </p>
            </div>
          </div>
        </div>
        
        <!-- Error display -->
        <div id="login-error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm hidden"></div>
        
        <!-- Status display -->
        <div class="text-center">
          <div class="inline-flex items-center text-xs text-gray-500">
            <div class="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Basic authentication active
          </div>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="/static/auth.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      document.getElementById('username')?.focus();
    });
  </script>
</body>
</html>
  `);
});

// Initialize database and start server
async function startServer() {
  try {
    console.log('🔧 Initializing ARIA database...');
    await initializeDatabase();
    console.log('✅ ARIA database initialized successfully');

    console.log(`🚀 Starting ARIA on port ${PORT}...`);
    
    serve({
      fetch: app.fetch,
      port: PORT,
    });

    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`🏥 Health check: http://localhost:${PORT}/health`);
    console.log(`📊 Application: http://localhost:${PORT}`);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 ARIA received SIGINT. Graceful shutdown...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 ARIA received SIGTERM. Graceful shutdown...');
  process.exit(0);
});

// Start the server
startServer();