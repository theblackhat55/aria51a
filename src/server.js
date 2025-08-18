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
  <title>DMT Risk Assessment Platform</title>
  <meta name="description" content="Next-Generation Enterprise GRC Platform with AI-Powered Intelligence & Advanced Analytics">
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
  <link href="/static/styles.css?v=2" rel="stylesheet">
</head>
<body class="bg-gray-50 font-sans antialiased">
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
              <h1 class="text-xl font-semibold text-gray-900">Risk Management Platform</h1>
              <p class="text-xs text-gray-500">Enterprise GRC Platform v2.0 - Native</p>
            </div>
          </div>
          
          <!-- Main Navigation -->
          <div class="hidden md:flex items-center space-x-4" id="internal-nav">
            <a href="#" id="nav-dashboard" class="nav-menu-item text-sm text-gray-700 hover:text-blue-600">Dashboard</a>
            <a href="#" id="nav-risks" class="nav-menu-item text-sm text-gray-700 hover:text-blue-600">Risks</a>
            <a href="#" id="nav-incidents" class="nav-menu-item text-sm text-gray-700 hover:text-blue-600">Incidents</a>
            <a href="#" id="nav-frameworks" class="nav-menu-item text-sm text-gray-700 hover:text-blue-600">Frameworks</a>
            <a href="#" id="nav-soa" class="nav-menu-item text-sm text-gray-700 hover:text-blue-600">SoA</a>
            <a href="#" id="nav-treatments" class="nav-menu-item text-sm text-gray-700 hover:text-blue-600">Treatments</a>
            <a href="#" id="nav-kris" class="nav-menu-item text-sm text-gray-700 hover:text-blue-600">KRIs</a>
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
  <script src="/static/ai-grc-dashboard.js"></script>
  <script src="/static/ai-assure-module.js"></script>
  <script src="/static/mobile-interface.js"></script>
  <script src="/static/risk-enhancements.js"></script>
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
  <title>Login - DMT Risk Assessment Platform</title>
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
        Sign in to DMT Platform
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        Docker Edition - Ubuntu Ready
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
              <i class="fas fa-sign-in-alt mr-2"></i>Sign In
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
    console.log('🔧 Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialized successfully');

    console.log(`🚀 Starting DMT Risk Assessment Platform on port ${PORT}...`);
    
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
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
  process.exit(0);
});

// Start the server
startServer();