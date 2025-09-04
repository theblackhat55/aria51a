import { html } from 'hono/html';

export const loginPage = () => html`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Login - ARIA5.1</title>
  
  <!-- HTMX -->
  <script src="https://unpkg.com/htmx.org@1.9.10"></script>
  
  <!-- Tailwind CSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  
  <!-- Font Awesome -->
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  
  <style>
    .htmx-indicator {
      display: none;
    }
    .htmx-request .htmx-indicator {
      display: inline-block;
    }
  </style>
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen flex items-center justify-center">
  <div class="max-w-md w-full mx-4">
    <!-- Login Card -->
    <div class="bg-white rounded-2xl shadow-xl p-8">
      <!-- Logo -->
      <div class="text-center mb-8">
        <div class="inline-flex h-16 w-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl items-center justify-center mb-4">
          <i class="fas fa-shield-alt text-white text-2xl"></i>
        </div>
        <h1 class="text-2xl font-bold text-gray-900">ARIA5.1</h1>
        <p class="text-sm text-gray-500 mt-1">AI Risk Intelligence Platform</p>
        <div class="mt-2">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <i class="fas fa-bolt mr-1"></i>HTMX Powered
          </span>
        </div>
      </div>
      
      <!-- Login Form -->
      <form hx-post="/auth/login" 
            hx-target="#login-result" 
            hx-indicator="#login-spinner"
            class="space-y-6">
        
        <!-- Error/Success Messages -->
        <div id="login-result"></div>
        
        <!-- Username Field -->
        <div>
          <label for="username" class="block text-sm font-medium text-gray-700 mb-2">
            Username
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i class="fas fa-user text-gray-400"></i>
            </div>
            <input type="text" 
                   name="username" 
                   id="username"
                   required
                   class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   placeholder="Enter your username">
          </div>
        </div>
        
        <!-- Password Field -->
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i class="fas fa-lock text-gray-400"></i>
            </div>
            <input type="password" 
                   name="password" 
                   id="password"
                   required
                   class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   placeholder="Enter your password">
          </div>
        </div>
        
        <!-- Remember Me -->
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input type="checkbox" 
                   name="remember" 
                   id="remember"
                   class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
            <label for="remember" class="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
          <a href="#" class="text-sm text-blue-600 hover:text-blue-500">
            Forgot password?
          </a>
        </div>
        
        <!-- Submit Button -->
        <button type="submit" 
                class="w-full flex justify-center items-center px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200">
          <span>Sign In</span>
          <span id="login-spinner" class="htmx-indicator ml-2">
            <i class="fas fa-spinner fa-spin"></i>
          </span>
        </button>
      </form>
      
      <!-- Demo Accounts -->
      <div class="mt-8 pt-6 border-t border-gray-200">
        <p class="text-xs text-gray-500 text-center mb-4">Demo Accounts Available</p>
        <div class="space-y-2">
          <button onclick="fillCredentials('admin', 'demo123')"
                  class="w-full text-left px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-sm font-medium text-gray-900">Administrator</span>
                <span class="text-xs text-gray-500 ml-2">admin / demo123</span>
              </div>
              <i class="fas fa-arrow-right text-gray-400"></i>
            </div>
          </button>
          <button onclick="fillCredentials('avi_security', 'demo123')"
                  class="w-full text-left px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-sm font-medium text-gray-900">Risk Manager</span>
                <span class="text-xs text-gray-500 ml-2">avi_security / demo123</span>
              </div>
              <i class="fas fa-arrow-right text-gray-400"></i>
            </div>
          </button>
          <button onclick="fillCredentials('sjohnson', 'demo123')"
                  class="w-full text-left px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <div class="flex items-center justify-between">
              <div>
                <span class="text-sm font-medium text-gray-900">Compliance Officer</span>
                <span class="text-xs text-gray-500 ml-2">sjohnson / demo123</span>
              </div>
              <i class="fas fa-arrow-right text-gray-400"></i>
            </div>
          </button>
        </div>
      </div>
    </div>
    
    <!-- Footer -->
    <div class="text-center mt-6 space-y-2">
      <div>
        <a href="/" class="text-sm text-blue-600 hover:text-blue-500 font-medium">
          <i class="fas fa-arrow-left mr-1"></i>
          Back to Landing Page
        </a>
      </div>
      <p class="text-sm text-gray-600">
        © 2024 ARIA5.1 - Powered by HTMX + Hono
      </p>
    </div>
  </div>
  
  <script>
    function fillCredentials(username, password) {
      document.getElementById('username').value = username;
      document.getElementById('password').value = password;
      // Auto-submit for demo
      document.querySelector('form').requestSubmit();
    }
    
    // Check for demo parameter in URL and prefill credentials
    document.addEventListener('DOMContentLoaded', function() {
      const urlParams = new URLSearchParams(window.location.search);
      const demo = urlParams.get('demo');
      
      if (demo) {
        switch(demo) {
          case 'admin':
            fillCredentials('admin', 'demo123');
            break;
          case 'avi_security':
            fillCredentials('avi_security', 'demo123');
            break;
          case 'sjohnson':
            fillCredentials('sjohnson', 'demo123');
            break;
        }
      }
    });
  </script>
</body>
</html>
`;