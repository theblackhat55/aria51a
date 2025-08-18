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
              <p class="text-xs text-gray-500">Enterprise GRC Platform v2.0 - Docker Edition</p>
            </div>
          </div>
          
          <!-- Navigation Menu -->
          <div class="flex items-center space-x-6">
            <!-- Status Indicator -->
            <div class="flex items-center space-x-2">
              <div class="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-xs text-gray-600">Docker Ready</span>
            </div>
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
  <script src="/static/keycloak-only-auth.js"></script>
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
      <!-- Keycloak-Only SSO Authentication -->
      <div class="space-y-6">
        <div class="text-center">
          <div class="mx-auto h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <i class="fas fa-shield-alt text-blue-600 text-2xl"></i>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-2">Enterprise Single Sign-On</h3>
          <p class="text-gray-600 mb-6">Secure authentication with Keycloak</p>
          
          <button onclick="window.dmtAuth.login()" data-keycloak-login class="w-full flex justify-center items-center py-4 px-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105">
            <i class="fas fa-sign-in-alt mr-3 text-lg"></i>
            Login with Keycloak SSO
          </button>
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
                Password for all users: <code class="bg-white px-2 py-1 rounded font-mono text-blue-700">password123</code>
              </p>
            </div>
          </div>
        </div>
        
        <!-- Error display -->
        <div id="keycloak-error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm hidden">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          <span id="error-message"></span>
        </div>
        
        <!-- Status display -->
        <div class="text-center">
          <div class="inline-flex items-center text-xs text-gray-500">
            <div class="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            Keycloak SSO Ready
          </div>
        </div>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="/static/keycloak-only-auth.js"></script>
  <script>
    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
      console.log('🔐 DMT Login Page: Initializing Keycloak-only authentication');
      
      // Auto-focus the login button after a short delay
      setTimeout(() => {
        const loginBtn = document.querySelector('[data-keycloak-login]');
        if (loginBtn) {
          loginBtn.focus();
        }
      }, 500);
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