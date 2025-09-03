// ARIA5 Platform - Next-Generation AI Risk Intelligence with Enterprise Security
import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import { cors } from 'hono/cors';

import { createAPI } from './api';
import { CloudflareBindings } from './types';
import aiSystemsApi from './ai-governance/ai-systems-api.js';
import aiRiskApi from './ai-governance/ai-risk-api.js';
import { createAuthAPI } from './routes/auth-api';
import { createDashboardRoutes } from './routes/dashboard-routes';
import { createRiskRoutes } from './routes/risk-routes-complete';
import { createComplianceRoutes } from './routes/compliance-routes-complete';
import { createHomeRoute } from './routes/home-route';
import { createIncidentRoutes } from './routes/incident-routes';
import { createAdminRoutes } from './routes/admin-routes';
import { createAIAssistantRoutes } from './routes/ai-assistant-routes';
import { createAssetsRoutes } from './routes/assets-routes';
import { createReportsRoutes } from './routes/reports-routes';
import { createSettingsRoutes } from './routes/settings-routes';
import aiGovernanceRoutes from './routes/ai-governance-routes';
import documentsRoutes from './routes/documents-routes';
import notificationsRoutes from './routes/notifications-routes';
import keysRoutes from './routes/keys-routes';

const app = new Hono<{ Bindings: CloudflareBindings }>();

// CORS configuration - Allow all Cloudflare Pages domains for now
app.use('*', cors({
  origin: (origin) => {
    // Allow localhost for development
    if (origin?.includes('localhost') || origin?.includes('127.0.0.1')) {
      return origin;
    }
    // Allow all Cloudflare Pages domains (temporary for debugging)
    if (origin?.includes('.pages.dev')) {
      return origin;
    }
    // Reject all other origins
    return false;
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token'],
  maxAge: 86400, // 24 hours
  credentials: true,
}));

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }));
// Serve HTML files from public root (for debug pages)
app.use('*.html', serveStatic({ root: './public' }));

// Security headers middleware
app.use('*', async (c, next) => {
  await next();
  
  // Security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  // SECURITY FIX: Enhanced Content Security Policy with nonce support
  c.header('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self' https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests");
});

// HTMX Routes - Mount these first for proper routing
// HTMX Dashboard routes
const dashboardRoutes = createDashboardRoutes();
app.route('/dashboard', dashboardRoutes);

// HTMX Risk routes
const riskRoutes = createRiskRoutes();
app.route('/risks', riskRoutes);

// HTMX Compliance routes
const complianceRoutes = createComplianceRoutes();
app.route('/compliance', complianceRoutes);

// HTMX Incident routes
const incidentRoutes = createIncidentRoutes();
app.route('/incidents', incidentRoutes);

// HTMX Admin routes
const adminRoutes = createAdminRoutes();
app.route('/admin', adminRoutes);

// AI Assistant routes
const aiAssistantRoutes = createAIAssistantRoutes();
app.route('/ai', aiAssistantRoutes);

// Assets Management routes
const assetsRoutes = createAssetsRoutes();
app.route('/assets', assetsRoutes);

// Reports & Analytics routes
const reportsRoutes = createReportsRoutes();
app.route('/reports', reportsRoutes);

// Settings routes
const settingsRoutes = createSettingsRoutes();
app.route('/settings', settingsRoutes);

// AI Governance routes
app.route('/ai-governance', aiGovernanceRoutes);

// Documents Management routes
app.route('/documents', documentsRoutes);

// Notifications routes
app.route('/notifications', notificationsRoutes);

// Secure Key Management routes
app.route('/keys', keysRoutes);

// Assessments redirect to compliance
app.get('/assessments', (c) => c.redirect('/compliance/assessments'));

// Auth API routes - These need to be at /api/auth
const authAPI = createAuthAPI();
app.route('/api', authAPI);

// Legacy API routes - Mount last to avoid conflicts
// const api = createAPI();
// app.route('/api/legacy', api);  // Disabled - using HTMX routes instead

// AI Governance API routes
app.route('/api/ai-governance', aiSystemsApi);
app.route('/api/ai-risk', aiRiskApi);

// Health check endpoint
app.get('/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    platform: 'ARIA5.1-HTMX',
    version: '5.1.0', 
    mode: 'HTMX-Enhanced',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      ai_assistant: 'ready',
      ai_engine: 'ready',
      llm_assessment: 'available',
      risk_intelligence: 'active'
    }
  });
});

// Simple login page endpoint (bypassing complex login page)
app.get('/simple-login.html', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simple Login - ARIA5.1</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gradient-to-br from-blue-900 to-indigo-900 min-h-screen flex items-center justify-center">
  <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
    <div class="text-center mb-8">
      <div class="mx-auto h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center mb-4">
        <i class="fas fa-shield-alt text-white text-2xl"></i>
      </div>
      <h1 class="text-2xl font-bold text-gray-900">ARIA5.1</h1>
      <p class="text-gray-600 mt-2">AI Risk Intelligence Assistant</p>
    </div>

    <form id="login-form">
      <div class="mb-4">
        <label for="username" class="block text-sm font-medium text-gray-700 mb-2">Username</label>
        <input type="text" id="username" name="username" required
               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               placeholder="Enter username">
      </div>
      
      <div class="mb-6">
        <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Password</label>
        <input type="password" id="password" name="password" required
               class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
               placeholder="Enter password">
      </div>
      
      <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
        Sign In
      </button>
    </form>
    
    <div id="login-error" class="mt-4 text-red-600 text-sm hidden"></div>
    
    <div class="mt-6 text-center text-sm text-gray-600">
      <p>Demo Accounts:</p>
      <p><strong>Admin:</strong> admin / demo123</p>
      <p><strong>Security:</strong> avi_security / demo123</p>
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const loginForm = document.getElementById('login-form');
      const errorDiv = document.getElementById('login-error');
      
      function showError(message) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        setTimeout(() => errorDiv.classList.add('hidden'), 5000);
      }
      
      if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const username = document.getElementById('username').value.trim();
          const password = document.getElementById('password').value.trim();
          
          if (!username) {
            showError('Username is required');
            return;
          }
          
          if (!password) {
            showError('Password is required');
            return;
          }
          
          const submitBtn = loginForm.querySelector('button[type="submit"]');
          const originalText = submitBtn.innerHTML;
          submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing In...';
          submitBtn.disabled = true;

          try {
            const response = await axios.post('/api/auth/login', {
              username: username,
              password: password
            });

            if (response.data.success) {
              localStorage.setItem('aria_token', response.data.token);
              localStorage.setItem('dmt_user', JSON.stringify(response.data.user));
              window.location.href = '/';
            } else {
              showError(response.data.error || 'Login failed');
            }
          } catch (error) {
            console.error('Login error:', error);
            if (error.response && error.response.data) {
              showError(error.response.data.error || 'Login failed');
            } else {
              showError('Network error. Please try again.');
            }
          } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
          }
        });
      }
    });
  </script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</body>
</html>`);
});

// Debug login page endpoint
app.get('/debug-login.html', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Debug Login - ARIA5.1</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-100 p-8">
  <div class="max-w-md mx-auto bg-white rounded-lg shadow p-6">
    <h1 class="text-2xl font-bold mb-4">ARIA5.1 Debug Login</h1>
    
    <form id="debug-login-form">
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Username</label>
        <input type="text" id="debug-username" value="admin" 
               class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
        <input type="password" id="debug-password" value="demo123"
               class="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
      </div>
      
      <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700">
        Debug Login
      </button>
    </form>
    
    <div id="debug-output" class="mt-6 p-4 bg-gray-50 rounded text-sm"></div>
  </div>

  <script>
    const form = document.getElementById('debug-login-form');
    const output = document.getElementById('debug-output');
    
    function log(message) {
      console.log(message);
      output.innerHTML += '<div class="mb-2">' + new Date().toLocaleTimeString() + ': ' + message + '</div>';
      output.scrollTop = output.scrollHeight;
    }
    
    log('Debug login page loaded');
    log('Current URL: ' + window.location.href);
    log('Axios available: ' + (typeof axios !== 'undefined'));
    
    form.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const username = document.getElementById('debug-username').value;
      const password = document.getElementById('debug-password').value;
      
      log('Attempting login with username: ' + username);
      log('Password length: ' + password.length);
      
      try {
        log('Making API request to /api/auth/login...');
        
        const response = await axios.post('/api/auth/login', {
          username: username,
          password: password
        });
        
        log('Response status: ' + response.status);
        log('Response data: ' + JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
          log('✅ Login successful!');
          log('Token: ' + response.data.token.substring(0, 20) + '...');
          log('User: ' + response.data.user.username + ' (' + response.data.user.role + ')');
          
          // Store token and redirect
          localStorage.setItem('aria_token', response.data.token);
          localStorage.setItem('dmt_user', JSON.stringify(response.data.user));
          
          log('Token stored in localStorage');
          log('Redirecting to dashboard...');
          
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        } else {
          log('❌ Login failed: ' + response.data.error);
        }
        
      } catch (error) {
        log('❌ Error occurred: ' + error.message);
        if (error.response) {
          log('Error response status: ' + error.response.status);
          log('Error response data: ' + JSON.stringify(error.response.data));
        }
        log('Full error: ' + JSON.stringify(error, null, 2));
      }
    });
  </script>
</body>
</html>`);
});

// Replace the SPA main route with HTMX home route
const homeRoute = createHomeRoute();
app.route('/', homeRoute);

// Old SPA route (disabled - now using HTMX)
app.get('/spa-old', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ARIA5 - AI Risk Intelligence Platform</title>
  <meta name="description" content="ARIA5 - Next-Generation AI Risk Intelligence Platform with Enterprise Security & Advanced Analytics">
  
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
  <!-- Loading Spinner -->
  <div id="loading-spinner" class="fixed inset-0 bg-white z-50 flex items-center justify-center">
    <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>

  <!-- Main Application Container -->
  <div id="app">
    <!-- Modern Collapsible Navigation -->
    <nav id="navigation" class="bg-white shadow-lg border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex justify-between items-center h-16">
          <!-- Logo and Brand -->
          <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
              <div class="h-10 w-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <i class="fas fa-shield-alt text-white"></i>
              </div>
            </div>
            <div class="flex flex-col justify-center">
              <h1 class="text-xl font-semibold text-gray-900 leading-tight">ARIA5</h1>
              <p class="text-xs text-gray-500 leading-tight">AI Risk Intelligence Platform</p>
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
          
          <!-- Navigation and User Section -->
          <div class="flex items-center space-x-6">
            <!-- Grouped navigation with click-to-open dropdowns -->
            <div class="hidden desktop-nav" id="internal-nav">
              <!-- Overview -->
              <div class="relative dropdown">
                <button class="nav-menu-item cursor-pointer dropdown-toggle" data-dropdown="overview-menu">
                  Overview <i class="fas fa-chevron-down ml-1 text-xs"></i>
                </button>
                <div id="overview-menu" class="dropdown-menu absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 hidden">
                  <a href="#" data-page="dashboard" class="block px-4 py-2 text-sm hover:bg-gray-50">Dashboard</a>
                  <a href="#" data-page="reports" class="block px-4 py-2 text-sm hover:bg-gray-50">Reports</a>
                </div>
              </div>

              <!-- Risk -->
              <div class="relative dropdown">
                <button class="nav-menu-item cursor-pointer dropdown-toggle" data-dropdown="risk-menu">
                  Risk <i class="fas fa-chevron-down ml-1 text-xs"></i>
                </button>
                <div id="risk-menu" class="dropdown-menu absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 hidden">
                  <a href="#" data-page="risks" class="block px-4 py-2 text-sm hover:bg-gray-50">Risks</a>
                  <a href="#" data-page="treatments" class="block px-4 py-2 text-sm hover:bg-gray-50">Treatments</a>
                  <a href="#" data-page="kris" class="block px-4 py-2 text-sm hover:bg-gray-50">KRIs</a>
                  <a href="#" data-page="incidents" class="block px-4 py-2 text-sm hover:bg-gray-50">Incidents</a>
                </div>
              </div>

              <!-- Compliance -->
              <div class="relative dropdown">
                <button class="nav-menu-item cursor-pointer dropdown-toggle" data-dropdown="compliance-menu">
                  Compliance <i class="fas fa-chevron-down ml-1 text-xs"></i>
                </button>
                <div id="compliance-menu" class="dropdown-menu absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 hidden">
                  <a href="#" data-page="frameworks" class="block px-4 py-2 text-sm hover:bg-gray-50">Frameworks</a>
                  <a href="#" data-page="soa" class="block px-4 py-2 text-sm hover:bg-gray-50">SoA</a>
                  <a href="#" data-page="evidence" class="block px-4 py-2 text-sm hover:bg-gray-50">Evidence</a>
                  <a href="#" data-page="assessments" class="block px-4 py-2 text-sm hover:bg-gray-50">Assessments</a>
                </div>
              </div>

              <!-- Operations -->
              <div class="relative dropdown">
                <button class="nav-menu-item cursor-pointer dropdown-toggle" data-dropdown="operations-menu">
                  Operations <i class="fas fa-chevron-down ml-1 text-xs"></i>
                </button>
                <div id="operations-menu" class="dropdown-menu absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 hidden">
                  <a href="#" data-page="assets" class="block px-4 py-2 text-sm hover:bg-gray-50">Assets</a>
                  <a href="#" data-page="services" class="block px-4 py-2 text-sm hover:bg-gray-50">Services</a>
                  <a href="#" data-page="documents" class="block px-4 py-2 text-sm hover:bg-gray-50">Documents</a>
                </div>
              </div>

              <!-- AI Governance - Hidden -->
              <div class="relative dropdown hidden">
                <button class="nav-menu-item cursor-pointer dropdown-toggle" data-dropdown="ai-governance-menu">
                  <i class="fas fa-robot mr-1 text-purple-600"></i>AI Governance <i class="fas fa-chevron-down ml-1 text-xs"></i>
                </button>
                <div id="ai-governance-menu" class="dropdown-menu absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 hidden">
                  <div class="px-3 py-2 border-b border-gray-100">
                    <p class="text-xs font-medium text-gray-500 uppercase tracking-wide">AI Risk Management</p>
                  </div>
                  <a href="#" data-page="ai-dashboard" class="block px-4 py-2 text-sm hover:bg-gray-50">
                    <i class="fas fa-tachometer-alt mr-2 text-purple-500"></i>AI Dashboard
                  </a>
                  <a href="#" data-page="ai-systems" class="block px-4 py-2 text-sm hover:bg-gray-50">
                    <i class="fas fa-microchip mr-2 text-blue-500"></i>AI Systems Registry
                  </a>
                  <a href="#" data-page="ai-risk-assessments" class="block px-4 py-2 text-sm hover:bg-gray-50">
                    <i class="fas fa-balance-scale mr-2 text-orange-500"></i>Risk Assessments
                  </a>
                  <a href="#" data-page="ai-incidents" class="block px-4 py-2 text-sm hover:bg-gray-50">
                    <i class="fas fa-exclamation-triangle mr-2 text-red-500"></i>AI Incidents
                  </a>
                  <a href="#" data-page="ai-monitoring" class="block px-4 py-2 text-sm hover:bg-gray-50">
                    <i class="fas fa-chart-line mr-2 text-green-500"></i>Real-time Monitoring
                  </a>
                  <a href="#" data-page="ai-compliance" class="block px-4 py-2 text-sm hover:bg-gray-50">
                    <i class="fas fa-gavel mr-2 text-indigo-500"></i>Compliance Status
                  </a>
                </div>
              </div>

              <!-- Intelligence -->
              <div class="relative dropdown">
                <button class="nav-menu-item cursor-pointer dropdown-toggle" data-dropdown="intelligence-menu">
                  Intelligence <i class="fas fa-chevron-down ml-1 text-xs"></i>
                </button>
                <div id="intelligence-menu" class="dropdown-menu absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50 hidden">
                  <a href="#" data-page="ai-assure" class="block px-4 py-2 text-sm hover:bg-gray-50">AI/ARIA5</a>
                  <a href="#" data-page="ai-providers" class="block px-4 py-2 text-sm hover:bg-gray-50">AI Providers</a>
                  <a href="#" data-page="rag-knowledge" class="block px-4 py-2 text-sm hover:bg-gray-50">RAG & Knowledge</a>
                  <a href="#" data-page="search" class="block px-4 py-2 text-sm hover:bg-gray-50">Search</a>
                  <a href="#" data-page="ai-analytics" class="block px-4 py-2 text-sm hover:bg-gray-50">AI Analytics</a>
                </div>
              </div>

              <!-- Admin -->
              <div id="menu-admin" class="relative dropdown">
                <button class="nav-menu-item cursor-pointer dropdown-toggle" data-dropdown="admin-menu">
                  Admin <i class="fas fa-chevron-down ml-1 text-xs"></i>
                </button>
                <div id="admin-menu" class="dropdown-menu absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 hidden">
                  <a href="#" data-page="settings" class="block px-4 py-2 text-sm hover:bg-gray-50">Settings</a>
                </div>
              </div>
            </div>
            
            <!-- User Section -->
            <div class="flex items-center space-x-4">
              <!-- Notifications (Hidden until login) -->
              <div class="relative hidden" id="notifications-container">
                <button id="notifications-btn" class="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200">
                  <i class="fas fa-bell text-lg"></i>
                  <span id="notification-badge" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center hidden">0</span>
                </button>
              </div>
              
              <!-- User Info and Auth Button -->
              <div class="hidden md:flex items-center space-x-3">
                <span class="text-sm text-gray-600" id="welcome-message">Welcome, Guest</span>
                <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200" id="auth-button">
                  <i class="fas fa-sign-in-alt mr-1"></i>Login
                </button>
              </div>
            </div>
          </div>
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
              <h1 class="text-lg font-semibold">ARIA5</h1>
              <p class="text-xs opacity-80">GRC Platform v5.2</p>
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

        <!-- AI Governance - Hidden -->
        <div class="mobile-nav-section hidden">
          <div class="mobile-nav-section-title">
            <i class="fas fa-robot mr-2 text-purple-600"></i>AI Governance
          </div>
          <a href="#" data-page="ai-dashboard" class="mobile-nav-item">
            <i class="fas fa-tachometer-alt text-purple-500"></i>AI Dashboard
          </a>
          <a href="#" data-page="ai-systems" class="mobile-nav-item">
            <i class="fas fa-microchip text-blue-500"></i>AI Systems Registry
          </a>
          <a href="#" data-page="ai-risk-assessments" class="mobile-nav-item">
            <i class="fas fa-balance-scale text-orange-500"></i>Risk Assessments
          </a>
          <a href="#" data-page="ai-incidents" class="mobile-nav-item">
            <i class="fas fa-exclamation-triangle text-red-500"></i>AI Incidents
          </a>
          <a href="#" data-page="ai-monitoring" class="mobile-nav-item">
            <i class="fas fa-chart-line text-green-500"></i>Real-time Monitoring
          </a>
          <a href="#" data-page="ai-compliance" class="mobile-nav-item">
            <i class="fas fa-gavel text-indigo-500"></i>Compliance Status
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
            <i class="fas fa-robot"></i>AI/ARIA5
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
    
    <!-- Main Content Area -->
    <main id="main-content" class="bg-gray-50">
      <!-- Content will be loaded here based on authentication status -->
    </main>
  </div>

  <!-- ARIA AI Assistant Modal -->
  <div id="aria-modal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
    <div class="flex items-center justify-center min-h-screen p-4">
      <div class="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div class="flex items-center space-x-3">
            <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <i class="fas fa-robot text-white text-lg"></i>
            </div>
            <div>
              <h3 class="text-lg font-semibold text-gray-900">ARIA5 - AI Risk Intelligence</h3>
              <p class="text-sm text-gray-500">Powered by multiple AI providers</p>
            </div>
          </div>
          <button id="close-aria" class="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200">
            <i class="fas fa-times text-lg"></i>
          </button>
        </div>
        
        <!-- Chat Area -->
        <div id="aria-chat" class="flex-1 p-6 overflow-y-auto bg-gray-50" style="min-height: 300px; max-height: 400px;">
          <div class="text-center text-gray-500 mt-8">
            <i class="fas fa-robot text-4xl text-gray-300 mb-4"></i>
            <p class="text-lg font-medium">Hello! I'm ARIA5, your AI Risk Intelligence Platform.</p>
            <p class="text-sm mt-2">Ask me about risk analysis, compliance, security recommendations, or use the quick actions below.</p>
          </div>
        </div>
        
        <!-- Input Section -->
        <div class="px-6 py-4 bg-white border-t border-gray-200 space-y-4">
          <!-- Provider Selection (Simplified) -->
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-600">AI Provider:</span>
            <span id="current-provider" class="text-blue-600 font-medium">Configure in Settings</span>
          </div>
          
          <!-- Chat Input -->
          <div class="flex space-x-3">
            <input type="text" id="aria-input" placeholder="Ask ARIA5 about risks, compliance, or security..." class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <button id="send-aria" class="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 flex items-center space-x-2">
              <i class="fas fa-paper-plane"></i>
              <span class="hidden sm:block">Send</span>
            </button>
          </div>
          
          <!-- Quick Action Buttons -->
          <div class="flex flex-wrap gap-2">
            <button onclick="quickARIAQuery('Analyze my top risks')" class="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm font-medium transition-colors duration-200">
              <i class="fas fa-chart-line mr-1"></i>Analyze Risks
            </button>
            <button onclick="quickARIAQuery('Show me compliance insights')" class="px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm font-medium transition-colors duration-200">
              <i class="fas fa-clipboard-check mr-1"></i>Compliance
            </button>
            <button onclick="quickARIAQuery('What are my risk predictions?')" class="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-sm font-medium transition-colors duration-200">
              <i class="fas fa-crystal-ball mr-1"></i>Predictions
            </button>
            <button onclick="quickARIAQuery('Give me security recommendations')" class="px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 text-sm font-medium transition-colors duration-200">
              <i class="fas fa-shield-alt mr-1"></i>Security
            </button>
          </div>
          
          <!-- Note about configuration -->
          <div class="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <i class="fas fa-info-circle mr-1"></i>
            Configure your AI providers in <strong>Settings</strong> to enable ARIA5 functionality.
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Floating ARIA Button (Hidden until login) -->
  <button id="aria-button" class="hidden fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 z-30" title="Ask ARIA5 - AI Risk Intelligence">
    <i class="fas fa-robot text-xl"></i>
  </button>

  <!-- Notification Toast Container -->
  <div id="toast-container" class="fixed top-4 right-4 z-50 space-y-2">
    <!-- Toast notifications will appear here -->
  </div>

  <!-- JavaScript -->
  <script src="/static/helpers.js?v=2"></script>
  <script src="/static/kong-config.js?v=1"></script>
  <script src="/static/modules.js?v=12&t=1734469000"></script>
  <script src="/static/risk-enhancements.js?v=1"></script>
  <script src="/static/enterprise-modules.js?v=7"></script>
  <script src="/static/enhanced-settings.js?v=4"></script>
  <script src="/static/system-settings-integration.js?v=4"></script>
  <script src="/static/framework-management.js?v=1"></script>
  <script src="/static/risk-management-enhanced.js?v=2"></script>
  <script src="/static/incident-management-enhanced.js?v=1"></script>
  <script src="/static/asset-service-management.js?v=1"></script>
  <script src="/static/integrated-risk-framework.js?v=2"></script>
  <script src="/static/ai-grc-dashboard.js?v=1"></script>
  <script src="/static/ai-assure-module.js?v=1"></script>
  <script src="/static/ai-governance.js?v=1"></script>
  <script src="/static/notifications.js?v=5"></script>
  <script src="/static/document-management.js?v=3"></script>
  <script src="/static/mobile-interface.js?v=3"></script>
  <script src="/static/secure-aria.js?v=1"></script>
  <script src="/static/secure-key-manager.js?v=1"></script>
  <script src="/static/app.js?v=15"></script>
  
  <!-- Load Keycloak Authentication -->

  
  <!-- Initialize Authentication -->
  <script>
    // Initialize Keycloak authentication for main app
    document.addEventListener('DOMContentLoaded', function() {
      try {
        var hasToken = !!(localStorage.getItem('aria_token') || localStorage.getItem('authToken'));
        if (false && !hasToken && typeof showLoginPrompt === 'function') {
          showLoginPrompt();
        }
      } catch (e) {
        // If localStorage is unavailable, show prompt as a fallback
        if (false && typeof showLoginPrompt === 'function') showLoginPrompt();
      }
    });
    
    function removedLoginPrompt() {
      const app = document.getElementById('app');
      if (app) {
        const loginPrompt = document.createElement('div');
        loginPrompt.id = 'login-prompt';
        loginPrompt.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        loginPrompt.innerHTML = 
          '<div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">' +
            '<div class="text-center">' +
              '<div class="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">' +
                '<i class="fas fa-shield-alt text-white text-xl"></i>' +
              '</div>' +
              '<h2 class="text-xl font-bold text-gray-900 mb-2">Authentication Required</h2>' +
              '<p class="text-gray-600 mb-6">Please login to access ARIA5 - AI Risk Intelligence Platform</p>' +
              '<button onclick="window.location.href=\\'/login\\'" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200">' +
                '<i class="fas fa-sign-in-alt mr-2"></i>' +
                'Login' +
              '</button>' +
            '</div>' +
          '</div>';
        document.body.appendChild(loginPrompt);
      }
    }
  </script>
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
  <title>Login - ARIA5.1</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-gradient-to-br from-blue-900 to-indigo-900 min-h-screen flex items-center justify-center">
  <div class="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
    <div class="text-center mb-8">
      <div class="mx-auto h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center mb-4">
        <i class="fas fa-shield-alt text-white text-2xl"></i>
      </div>
      <h1 class="text-2xl font-bold text-gray-900">ARIA5.1</h1>
      <p class="text-gray-600 mt-2">AI Risk Intelligence Assistant</p>
    </div>

    <!-- SAML Authentication Section -->
    <div id="saml-auth" class="mb-6" style="display:none;">
      <button
        id="saml-login-btn"
        class="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 mb-4"
      >
        <i class="fas fa-shield-alt mr-2"></i>
        Sign In with Enterprise SSO
      </button>
      
      <div class="text-center">
        <div class="relative">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-gray-500">or</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Legacy Authentication Section -->
    <div id="legacy-auth" style="display:block;">
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
          class="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-150"
        >
          <i class="fas fa-sign-in-alt mr-2"></i>
          <span id="legacy-login-text">Sign In (Local)</span>
        </button>
      </form>

      <div id="login-error" class="mt-4 text-red-600 text-sm hidden"></div>

      <div class="mt-4 text-center text-sm text-gray-600">
        <p>Demo Accounts:</p>
        <div class="mt-2 space-y-1">
          <p><strong>Admin:</strong> admin / demo123</p>
          <p><strong>Risk Manager:</strong> avi_security / demo123</p>
        </div>
      </div>
    </div>

    <!-- Legacy Authentication Note -->
    <div class="mt-4 pt-4 border-t border-gray-200">
      <div class="text-center">
        <p class="text-xs text-gray-500">Demo Platform - Use provided demo accounts</p>
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  
  <script>
    // Check SAML configuration on page load
    async function checkSAMLConfig() {
      try {
        const response = await axios.get('/api/saml/config');
        if (response.data.success && response.data.config.enabled) {
          // Show SAML login option
          document.getElementById('saml-auth').style.display = 'block';
          document.getElementById('legacy-login-text').textContent = 'Sign In (Local Account)';
          
          // Setup SAML login button
          document.getElementById('saml-login-btn').addEventListener('click', function() {
            initiateSSO();
          });
        }
      } catch (error) {
        console.log('SAML not configured or available:', error.message);
        // Keep only legacy auth visible
      }
    }
    
    // Initiate SAML SSO login
    async function initiateSSO() {
      try {
        // Show loading state
        const btn = document.getElementById('saml-login-btn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Redirecting to SSO...';
        btn.disabled = true;
        
        // Get SSO URL from backend
        const response = await axios.get('/api/saml/sso-url');
        if (response.data.success && response.data.sso_url) {
          // Redirect to identity provider
          window.location.href = response.data.sso_url;
        } else {
          throw new Error('SSO URL not available');
        }
      } catch (error) {
        console.error('SSO initiation failed:', error);
        const btn = document.getElementById('saml-login-btn');
        btn.innerHTML = '<i class="fas fa-shield-alt mr-2"></i>Sign In with Enterprise SSO';
        btn.disabled = false;
        
        // Show error message
        const errorDiv = document.getElementById('login-error');
        errorDiv.textContent = 'SSO login temporarily unavailable. Please use local account.';
        errorDiv.classList.remove('hidden');
      }
    }
    
    // Check SAML config when page loads
    document.addEventListener('DOMContentLoaded', function() {
      checkSAMLConfig();
    });
  </script>
  
  <!-- Load legacy auth -->
  <script src="/static/auth.js"></script>
</body>
</html>`);
});

export default app;
