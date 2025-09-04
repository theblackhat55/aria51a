// ARIA5.1 - HTMX + Hono Server-Driven Application
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { html } from 'hono/html';
import { serveStatic } from 'hono/cloudflare-workers';
import { getCookie } from 'hono/cookie';

// Import route handlers
import { createAuthRoutes } from './routes/auth-routes';
import { createDashboardRoutes } from './routes/dashboard-routes';
import { createRiskRoutes } from './routes/risk-routes-complete';
import { createComplianceRoutes } from './routes/compliance-routes-complete';
import { createAdminRoutes } from './routes/admin-routes';
import { createAPIRoutes } from './routes/api-routes';
import { createAIAssistantRoutes } from './routes/ai-assistant-routes';

// Import templates
import { baseLayout } from './templates/layout';
import { loginPage } from './templates/auth/login';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());
app.use('*', secureHeaders());

// Serve static files (including HTMX)
app.get('/static/*', serveStatic({ root: './' }));
app.get('/htmx/*', serveStatic({ root: './' }));

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    version: '5.1.0',
    mode: 'HTMX',
    timestamp: new Date().toISOString()
  });
});

// Home page - redirect to login or dashboard based on auth
app.get('/', async (c) => {
  const token = getCookie(c, 'aria_token');
  
  if (!token) {
    return c.redirect('/login');
  }
  
  return c.redirect('/dashboard');
});

// Login page (no auth required)
app.get('/login', (c) => {
  return c.html(loginPage());
});

// Debug login page (serves static HTML file)
app.get('/debug-login', async (c) => {
  try {
    // Read the static HTML file from the public directory
    const debugHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Debug Login - ARIA5.1</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/htmx.org@1.9.10"></script>
</head>
<body class="bg-gray-100 min-h-screen flex items-center justify-center">
    <div class="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 class="text-2xl font-bold text-center mb-6">ARIA5.1 Debug Login</h1>
        
        <div id="login-result" class="mb-4"></div>
        
        <form hx-post="/auth/login" hx-target="#login-result" hx-swap="innerHTML" class="space-y-4">
            <div>
                <label for="username" class="block text-sm font-medium text-gray-700">Username</label>
                <input type="text" id="username" name="username" value="admin" 
                       class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            </div>
            
            <div>
                <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
                <input type="password" id="password" name="password" value="demo123"
                       class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
            </div>
            
            <button type="submit" 
                    class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <span class="htmx-indicator">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </span>
                Debug Login
            </button>
        </form>
        
        <div class="mt-6 space-y-2">
            <button onclick="testDashboard()" 
                    class="w-full py-2 px-4 bg-green-600 text-white rounded hover:bg-green-700">
                Test Dashboard Access
            </button>
            
            <button onclick="testDropdowns()" 
                    class="w-full py-2 px-4 bg-purple-600 text-white rounded hover:bg-purple-700">
                Test Alpine.js Dropdowns
            </button>
            
            <button onclick="checkErrors()" 
                    class="w-full py-2 px-4 bg-red-600 text-white rounded hover:bg-red-700">
                Check for 404 Errors
            </button>
        </div>
        
        <div id="debug-info" class="mt-4 p-3 bg-gray-50 rounded text-sm"></div>
    </div>

    <script>
        // Configure HTMX for authentication
        document.body.addEventListener('htmx:configRequest', function(event) {
            const token = localStorage.getItem('aria_token');
            if (token) {
                event.detail.headers['Authorization'] = 'Bearer ' + token;
            }
        });

        // Handle login success
        document.body.addEventListener('htmx:afterRequest', function(event) {
            if (event.detail.requestConfig.verb === 'post' && event.detail.xhr.status === 200) {
                const redirectTo = event.detail.xhr.getResponseHeader('HX-Redirect');
                if (redirectTo) {
                    console.log('Login successful, redirecting to:', redirectTo);
                    document.getElementById('debug-info').innerHTML = 
                        '<strong>✅ Login Success!</strong> Redirecting to dashboard...';
                    setTimeout(() => {
                        window.location.href = redirectTo;
                    }, 1500);
                }
            }
        });

        function testDashboard() {
            fetch('/dashboard', {
                credentials: 'include',
                headers: {
                    'Authorization': 'Bearer ' + (localStorage.getItem('aria_token') || '')
                }
            })
            .then(response => {
                document.getElementById('debug-info').innerHTML = \`
                    <strong>Dashboard Test:</strong> \${response.ok ? '✅ Accessible' : '❌ Forbidden'}<br>
                    <strong>Status:</strong> \${response.status}<br>
                    <strong>URL:</strong> \${response.url}
                \`;
                if (response.ok && response.status !== 401) {
                    setTimeout(() => window.location.href = '/dashboard', 1000);
                }
            });
        }

        function testDropdowns() {
            document.getElementById('debug-info').innerHTML = \`
                <strong>Alpine.js Test:</strong><br>
                <strong>Loaded:</strong> \${window.Alpine ? '✅ Yes' : '❌ No'}<br>
                <strong>Version:</strong> \${window.Alpine?.version || 'Unknown'}<br>
                <strong>Status:</strong> Testing dropdown functionality...
            \`;
            
            // Test Alpine.js functionality
            setTimeout(() => {
                const dropdownTest = window.Alpine ? '✅ Working' : '❌ Failed';
                document.getElementById('debug-info').innerHTML += \`<br><strong>Result:</strong> \${dropdownTest}\`;
            }, 1000);
        }

        function checkErrors() {
            // Test for common 404 error sources
            const testUrls = ['/risk/create', '/compliance/create', '/api/stats'];
            
            document.getElementById('debug-info').innerHTML = '<strong>Testing for 404 errors...</strong><br>';
            
            testUrls.forEach((url, index) => {
                fetch(url, {
                    credentials: 'include',
                    headers: {
                        'Authorization': 'Bearer ' + (localStorage.getItem('aria_token') || '')
                    }
                })
                .then(response => {
                    const status = response.status === 404 ? '❌ 404' : 
                                  response.status === 401 ? '🔒 Auth Required' : 
                                  response.ok ? '✅ OK' : \`⚠️ \${response.status}\`;
                    document.getElementById('debug-info').innerHTML += \`<br>\${url}: \${status}\`;
                })
                .catch(error => {
                    document.getElementById('debug-info').innerHTML += \`<br>\${url}: ❌ Error\`;
                });
            });
        }
    </script>
</body>
</html>`;
    
    return c.html(debugHtml);
  } catch (error) {
    return c.text('Debug page error: ' + error, 500);
  }
});

// Mount route groups
const authRoutes = createAuthRoutes();
const dashboardRoutes = createDashboardRoutes();
const riskRoutes = createRiskRoutes();
const complianceRoutes = createComplianceRoutes();
const adminRoutes = createAdminRoutes();
const apiRoutes = createAPIRoutes();
const aiRoutes = createAIAssistantRoutes();

app.route('/auth', authRoutes);
app.route('/dashboard', dashboardRoutes);
app.route('/risk', riskRoutes);
app.route('/compliance', complianceRoutes);
app.route('/admin', adminRoutes);
app.route('/api', apiRoutes);
app.route('/ai', aiRoutes);

// 404 handler
app.notFound((c) => {
  return c.html(
    baseLayout({
      title: '404 - Page Not Found',
      content: html`
        <div class="flex items-center justify-center min-h-screen">
          <div class="text-center">
            <h1 class="text-6xl font-bold text-gray-200">404</h1>
            <p class="text-xl text-gray-600 mt-4">Page not found</p>
            <a href="/" class="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Go Home
            </a>
          </div>
        </div>
      `
    })
  );
});

// Error handler
app.onError((err, c) => {
  console.error(`${err}`);
  return c.html(
    baseLayout({
      title: 'Error',
      content: html`
        <div class="flex items-center justify-center min-h-screen">
          <div class="text-center">
            <h1 class="text-4xl font-bold text-red-600">Error</h1>
            <p class="text-gray-600 mt-4">Something went wrong. Please try again.</p>
            <a href="/" class="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Go Home
            </a>
          </div>
        </div>
      `
    }),
    500
  );
});

export default app;