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
  <script src="/static/app.js"></script>
  <script src="/static/modules.js"></script>
  <script src="/static/notifications.js"></script>
  <script src="/static/auth.js"></script>
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
      <!-- Login form will be loaded here -->
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="/static/auth.js"></script>
  <script>
    // Auto-load login form
    document.addEventListener('DOMContentLoaded', function() {
      if (typeof showLogin === 'function') {
        showLogin();
      }
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