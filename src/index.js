// ARIA - Cloudflare Workers/Pages Entry Point
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// Enable CORS for all routes
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
  credentials: true,
}))

// Serve static files from public directory
app.use('/static/*', serveStatic({ root: './public' }))

// API routes
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'healthy', 
    platform: 'ARIA - AI Risk Intelligence Assistant',
    version: '5.2.0',
    timestamp: new Date().toISOString(),
    environment: 'cloudflare-pages'
  })
})

// Mock authentication endpoints for demo
app.post('/api/auth/login', async (c) => {
  const { username, password } = await c.req.json()
  
  // Demo authentication
  if (password === 'demo123') {
    const users = {
      'admin': { id: 1, username: 'admin', first_name: 'Admin', last_name: 'User', role: 'admin' },
      'avi_security': { id: 2, username: 'avi_security', first_name: 'Avi', last_name: 'Security', role: 'risk_manager' },
      'sjohnson': { id: 3, username: 'sjohnson', first_name: 'Sarah', last_name: 'Johnson', role: 'compliance_officer' }
    }
    
    const user = users[username]
    if (user) {
      return c.json({
        success: true,
        data: {
          token: 'demo-token-' + Date.now(),
          user: user
        }
      })
    }
  }
  
  return c.json({ success: false, error: 'Invalid credentials' }, 401)
})

app.post('/api/auth/demo-login', (c) => {
  return c.json({
    success: true,
    data: {
      token: 'demo-token-' + Date.now(),
      user: { id: 1, username: 'demo', first_name: 'Demo', last_name: 'User', role: 'admin' }
    }
  })
})

app.get('/api/auth/me', (c) => {
  const auth = c.req.header('Authorization')
  if (auth && auth.startsWith('Bearer demo-token-')) {
    return c.json({
      success: true,
      data: {
        user: { id: 1, username: 'demo', first_name: 'Demo', last_name: 'User', role: 'admin' }
      }
    })
  }
  return c.json({ success: false, error: 'Unauthorized' }, 401)
})

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
  <!-- Loading Spinner -->
  <div id="loading-spinner" class="fixed inset-0 bg-white z-50 flex items-center justify-center">
    <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>

  <!-- Main Application Container -->
  <div id="app" class="min-h-screen">
    <!-- Navigation -->
    <nav id="navigation" class="bg-white shadow-lg border-b border-gray-200">
      <div class="max-w-7xl mx-auto px-4">
        <div class="flex justify-between items-center h-16">
          <!-- Logo and Brand -->
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="h-10 w-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <i class="fas fa-robot text-white"></i>
              </div>
            </div>
            <div class="ml-4">
              <h1 class="text-xl font-semibold text-gray-900">ARIA</h1>
              <p class="text-xs text-gray-500">AI Risk Intelligence Assistant v5.2</p>
            </div>
          </div>
          
          <!-- Navigation Menu -->
          <div class="hidden md:flex items-center space-x-4" id="internal-nav">
            <button id="auth-button" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
              Login
            </button>
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
      <div class="max-w-4xl mx-auto text-center py-6">
        <div class="mb-8">
          <div class="mx-auto h-24 w-24 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mb-6">
            <i class="fas fa-robot text-white text-3xl"></i>
          </div>
          <h1 class="text-4xl font-bold text-gray-900 mb-4">ARIA</h1>
          <p class="text-xl text-gray-600 mb-8">AI Risk Intelligence Assistant - Next-Generation Enterprise GRC Platform with Advanced Analytics</p>
        </div>
        
        <div class="grid md:grid-cols-3 gap-8 mb-12">
          <div class="bg-white p-6 rounded-lg shadow-lg">
            <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">AI Risk Management</h3>
            <p class="text-gray-600">Intelligent risk assessment and monitoring with AI-powered analytics and predictive insights.</p>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-lg">
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-brain text-green-600 text-xl"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Smart Compliance</h3>
            <p class="text-gray-600">Automated compliance monitoring with AI-driven framework mapping and evidence collection.</p>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-lg">
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-robot text-purple-600 text-xl"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">ARIA Assistant</h3>
            <p class="text-gray-600">Conversational AI assistant with deep GRC knowledge and contextual recommendations.</p>
          </div>
        </div>
        
        <div class="bg-blue-50 p-8 rounded-lg border border-blue-200">
          <h3 class="text-xl font-semibold text-gray-900 mb-4">Experience the Future of GRC</h3>
          <p class="text-gray-600 mb-6">Sign in to access ARIA's AI-powered risk intelligence platform with advanced GRC capabilities.</p>
          <button onclick="window.location.href='/login'" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors duration-200">
            <i class="fas fa-sign-in-alt mr-2"></i>Sign In to ARIA
          </button>
          
          <div class="mt-6 text-sm text-gray-500">
            <p><strong>Demo Accounts Available:</strong></p>
            <div class="mt-2 space-y-1">
              <p><strong>Admin:</strong> admin / demo123</p>
              <p><strong>Risk Manager:</strong> avi_security / demo123</p>
              <p><strong>Compliance Officer:</strong> sjohnson / demo123</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>

  <!-- Scripts -->
  <script src="/static/helpers.js"></script>
  <script src="/static/app.js"></script>
  <script>
    // Initialize auth button for login page redirect
    document.addEventListener('DOMContentLoaded', function() {
      const authButton = document.getElementById('auth-button');
      if (authButton) {
        authButton.addEventListener('click', function() {
          window.location.href = '/login';
        });
      }
    });
  </script>
</body>
</html>`)
})

// Login page
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
        <i class="fas fa-robot text-white text-xl"></i>
      </div>
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        ARIA
      </h2>
      <p class="mt-2 text-center text-sm text-gray-600">
        AI Risk Intelligence Assistant - Secure Access
      </p>
    </div>
    
    <div id="login-container" class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
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
        
        <div class="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
          <div class="text-center">
            <h4 class="font-semibold text-blue-900 mb-3">✨ Available Demo Users</h4>
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
      </div>
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  <script>
    document.getElementById('login-form').addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const errorDiv = document.getElementById('login-error');
      
      try {
        const response = await axios.post('/api/auth/login', {
          username: username,
          password: password
        });
        
        if (response.data.success) {
          localStorage.setItem('aria_token', response.data.data.token);
          localStorage.setItem('aria_user', JSON.stringify(response.data.data.user));
          window.location.href = '/';
        } else {
          throw new Error(response.data.error || 'Login failed');
        }
      } catch (error) {
        errorDiv.textContent = error.response?.data?.error || error.message || 'Login failed';
        errorDiv.classList.remove('hidden');
      }
    });
    
    document.getElementById('username').focus();
  </script>
</body>
</html>`)
})

export default app