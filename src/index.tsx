// DMT Risk Assessment System v2.0 - Main Application
import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import { cors } from 'hono/cors';

import { createAPI } from './api';
import { CloudflareBindings } from './types';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// Enable CORS for all routes
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://*.pages.dev'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));

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
  <title>Risk Management Platform</title>
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
  <link href="/static/styles.css" rel="stylesheet">
</head>
<body class="bg-gray-50 font-sans antialiased">
  <!-- Loading Spinner -->
  <div id="loading-spinner" class="fixed inset-0 bg-white z-50 flex items-center justify-center">
    <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>

  <!-- Main Application Container -->
  <div id="app" class="min-h-screen">
    <!-- Navigation -->
    <nav id="navigation" class="bg-white shadow-lg">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <i class="fas fa-shield-alt text-white"></i>
              </div>
            </div>
            <div class="ml-4">
              <h1 class="text-xl font-semibold text-gray-900">Risk Management Platform</h1>
              <p class="text-xs text-gray-500">Enterprise GRC Platform v2.0</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-4">
            <nav class="flex space-x-8">
              <a href="#" class="nav-item active" id="nav-dashboard">
                <i class="fas fa-chart-pie mr-2"></i>Dashboard
              </a>
              <a href="#" class="nav-item" id="nav-risks">
                <i class="fas fa-exclamation-triangle mr-2"></i>Risks
              </a>
              <a href="#" class="nav-item" id="nav-controls">
                <i class="fas fa-shield-halved mr-2" style="color: #000000;"></i>Controls
              </a>
              <a href="#" class="nav-item" id="nav-compliance">
                <i class="fas fa-clipboard-check mr-2"></i>Compliance
              </a>
              <a href="#" class="nav-item" id="nav-frameworks">
                <i class="fas fa-list-check mr-2"></i>Frameworks
              </a>
              <a href="#" class="nav-item" id="nav-incidents">
                <i class="fas fa-bell mr-2"></i>Incidents
              </a>
              <a href="#" class="nav-item" id="nav-assets">
                <i class="fas fa-server mr-2"></i>Assets
              </a>
              <a href="#" class="nav-item" id="nav-services">
                <i class="fas fa-cogs mr-2"></i>Services
              </a>
              <a href="#" class="nav-item" id="nav-documents">
                <i class="fas fa-file-alt mr-2"></i>Documents
              </a>
              <a href="#" class="nav-item" id="nav-settings">
                <i class="fas fa-cog mr-2"></i>Settings
              </a>
            </nav>
            
            <div class="flex items-center">
              <span class="text-sm text-gray-600 mr-4" id="welcome-message">
                Welcome, Guest
              </span>
              <button class="text-sm text-blue-600 hover:text-blue-700" id="auth-button">
                <i class="fas fa-sign-in-alt mr-1"></i>Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
    
    <!-- Main Content Area -->
    <main id="main-content" class="container mx-auto px-4 py-8">
      <div id="dashboard-content">
        <!-- Dashboard content will be loaded here -->
      </div>
    </main>
  </div>

  <!-- ARIA AI Assistant Modal -->
  <div id="aria-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden z-40">
    <div class="flex items-center justify-center h-full p-4">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900">ARIA - AI Risk Assistant</h3>
          <button id="close-aria" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div id="aria-chat" class="p-6 h-64 overflow-y-auto">
          <!-- Chat messages will appear here -->
        </div>
        <div class="px-6 py-4 border-t border-gray-200 space-y-3">
          <!-- LLM Provider Selection -->
          <div class="flex items-center justify-between text-sm">
            <label for="aria-provider" class="text-gray-700 font-medium">AI Provider:</label>
            <select id="aria-provider" class="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option value="openai">GPT-4 (OpenAI)</option>
              <option value="gemini">Gemini Pro (Google)</option>
              <option value="anthropic">Claude 3 (Anthropic)</option>
              <option value="local">Local LLM</option>
            </select>
          </div>
          
          <!-- Chat Input -->
          <div class="flex space-x-2">
            <input type="text" id="aria-input" placeholder="Ask ARIA about risks, compliance, or security..." class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500">
            <button id="send-aria" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <i class="fas fa-paper-plane"></i>
            </button>
          </div>
          
          <!-- Quick Action Buttons -->
          <div class="flex flex-wrap gap-2">
            <button onclick="quickARIAQuery('Analyze my top risks')" class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200">
              Analyze Risks
            </button>
            <button onclick="quickARIAQuery('Show me compliance insights')" class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200">
              Compliance
            </button>
            <button onclick="quickARIAQuery('What are my risk predictions?')" class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200">
              Predictions
            </button>
            <button onclick="quickARIAQuery('Give me security recommendations')" class="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200">
              Security
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Floating ARIA Button -->
  <button id="aria-button" class="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 z-30" title="Ask ARIA - AI Risk Assistant">
    <i class="fas fa-robot text-xl"></i>
  </button>

  <!-- Notification Toast Container -->
  <div id="toast-container" class="fixed top-4 right-4 z-50 space-y-2">
    <!-- Toast notifications will appear here -->
  </div>

  <!-- JavaScript -->
  <script src="/static/modules.js?v=5"></script>
  <script src="/static/enterprise-modules.js?v=2"></script>
  <script src="/static/notifications.js?v=2"></script>
  <script src="/static/document-management.js?v=2"></script>
  <script src="/static/mobile-interface.js?v=2"></script>
  <script src="/static/app.js?v=5"></script>
</body>
</html>`);
});

// Authentication routes (HTML pages)
app.get('/login', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - Risk Management Platform</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gradient-to-br from-blue-900 to-indigo-900 min-h-screen flex items-center justify-center">
  <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
    <div class="text-center mb-8">
      <div class="mx-auto h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center mb-4">
        <i class="fas fa-shield-alt text-white text-2xl"></i>
      </div>
      <h1 class="text-2xl font-bold text-gray-900">Risk Management Platform</h1>
      <p class="text-gray-600 mt-2">Enterprise GRC Platform v2.0</p>
    </div>

    <form id="login-form">
      <div class="mb-6">
        <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
          Username or Email
        </label>
        <input
          type="text"
          id="username"
          name="username"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your username or email"
        >
      </div>

      <div class="mb-6">
        <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          required
          class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your password"
        >
      </div>

      <button
        type="submit"
        class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150"
      >
        <i class="fas fa-sign-in-alt mr-2"></i>
        Sign In
      </button>
    </form>

    <div id="login-error" class="mt-4 text-red-600 text-sm hidden"></div>

    <div class="mt-8 text-center text-sm text-gray-600">
      <p>Demo Accounts:</p>
      <div class="mt-2 space-y-1">
        <p><strong>Admin:</strong> admin / demo123</p>
        <p><strong>Risk Manager:</strong> avi_security / demo123</p>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script src="/static/auth.js"></script>
</body>
</html>`);
});

export default app;
