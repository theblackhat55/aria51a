// ARIA5.1 - Clean HTMX + Hono Application (Rebuilt from scratch)
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { secureHeaders } from 'hono/secure-headers';
import { html } from 'hono/html';
import { serveStatic } from 'hono/cloudflare-workers';
import { getCookie } from 'hono/cookie';

// Import clean route handlers
import { createAuthRoutes } from './routes/auth-routes';
import { createCleanDashboardRoutes } from './routes/dashboard-routes-clean';
import { createRiskRoutesARIA5 } from './routes/risk-routes-aria5';
import { createComplianceRoutes } from './routes/compliance-routes-complete';
import { createOperationsRoutes } from './routes/operations-routes';
import { createIntelligenceRoutes } from './routes/intelligence-routes';
import { createAdminRoutes } from './routes/admin-routes';
import { createAPIRoutes } from './routes/api-routes';
import { createAIAssistantRoutes } from './routes/ai-assistant-routes';

// Import clean templates
import { cleanLayout } from './templates/layout-clean';
import { loginPage } from './templates/auth/login';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', cors());
app.use('*', secureHeaders());

// Serve static files
app.get('/static/*', serveStatic({ root: './' }));
app.get('/htmx/*', serveStatic({ root: './' }));

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    version: '5.1.0-clean',
    mode: 'Clean HTMX',
    timestamp: new Date().toISOString()
  });
});

// Home page - redirect based on auth
app.get('/', async (c) => {
  const token = getCookie(c, 'aria_token');
  
  if (!token) {
    return c.redirect('/login');
  }
  
  return c.redirect('/dashboard');
});

// Login page
app.get('/login', (c) => {
  return c.html(loginPage());
});

// Test page to verify dropdowns work
app.get('/test', (c) => {
  const testUser = { username: 'test', role: 'admin', firstName: 'Test' };
  
  return c.html(
    cleanLayout({
      title: 'Dropdown Test',
      user: testUser,
      content: html`
        <div class="min-h-screen bg-gray-50 py-12">
          <div class="max-w-4xl mx-auto px-4">
            <div class="bg-white rounded-xl shadow-lg p-8">
              <h1 class="text-3xl font-bold text-gray-900 mb-6">Dropdown Functionality Test</h1>
              
              <div class="space-y-4">
                <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h2 class="text-lg font-semibold text-green-800 mb-2">✅ Test Instructions</h2>
                  <ul class="text-green-700 space-y-1">
                    <li>1. Click on navigation dropdown buttons (Overview, Risk, Compliance, Admin, Notifications)</li>
                    <li>2. Verify dropdowns open and close properly</li>
                    <li>3. Check that only one dropdown opens at a time</li>
                    <li>4. Confirm clicking outside closes dropdowns</li>
                    <li>5. Test all navigation links work (Operations, Intelligence should now work!)</li>
                    <li>6. Test dropdown functionality in modals/other pages</li>
                  </ul>
                </div>
                
                <div class="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h2 class="text-lg font-semibold text-purple-800 mb-2">🔄 HTMX Dropdown Test</h2>
                  <p class="text-purple-700 mb-4">Test dropdowns in HTMX-loaded content:</p>
                  <button hx-get="/test/modal" 
                          hx-target="#modal-test" 
                          hx-swap="innerHTML"
                          class="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                    Load HTMX Modal with Dropdown
                  </button>
                  <div id="modal-test" class="mt-4 p-4 bg-white border border-purple-200 rounded-lg"></div>
                </div>
                
                <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h2 class="text-lg font-semibold text-blue-800 mb-2">🔍 Console Check</h2>
                  <p class="text-blue-700">Open browser DevTools → Console and look for:</p>
                  <ul class="text-blue-700 mt-2 space-y-1">
                    <li>• "✅ ARIA5 dropdowns initialized"</li>
                    <li>• "🎯 Dropdown opened/closed" messages when clicking</li>
                    <li>• No JavaScript errors or warnings</li>
                  </ul>
                </div>
                
                <div class="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h2 class="text-lg font-semibold text-purple-800 mb-2">🚀 Navigation Test</h2>
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                    <a href="/dashboard" class="bg-blue-500 text-white px-4 py-2 rounded text-center hover:bg-blue-600">Dashboard</a>
                    <a href="/risk" class="bg-red-500 text-white px-4 py-2 rounded text-center hover:bg-red-600">Risk Register</a>
                    <a href="/compliance" class="bg-green-500 text-white px-4 py-2 rounded text-center hover:bg-green-600">Compliance</a>
                    <a href="/admin" class="bg-purple-500 text-white px-4 py-2 rounded text-center hover:bg-purple-600">Admin</a>
                    <a href="/reports" class="bg-indigo-500 text-white px-4 py-2 rounded text-center hover:bg-indigo-600">Reports</a>
                    <a href="/operations" class="bg-orange-500 text-white px-4 py-2 rounded text-center hover:bg-orange-600">Operations</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `
    })
  );
});

// Test modal endpoint for HTMX dropdown testing
app.get('/test/modal', (c) => {
  return c.html(html`
    <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <h3 class="text-lg font-semibold text-blue-800 mb-4">HTMX-Loaded Content with Dropdown</h3>
      <p class="text-blue-700 mb-4">This content was loaded via HTMX. Test the dropdown below:</p>
      
      <!-- Test dropdown in HTMX content -->
      <div class="relative" data-dropdown>
        <button data-dropdown-button class="flex items-center space-x-1 text-gray-700 hover:text-blue-600 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium transition-colors">
          <i class="fas fa-cog mr-1"></i>
          <span>HTMX Test Dropdown</span>
          <i class="fas fa-chevron-down text-xs"></i>
        </button>
        <div data-dropdown-menu class="dropdown-menu absolute left-0 mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div class="py-2">
            <a href="#" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700">
              <i class="fas fa-check w-5 text-green-500 mr-3"></i>
              <div>
                <div class="font-medium">Option 1</div>
                <div class="text-xs text-gray-500">This dropdown works in HTMX content</div>
              </div>
            </a>
            <a href="#" class="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700">
              <i class="fas fa-star w-5 text-yellow-500 mr-3"></i>
              <div>
                <div class="font-medium">Option 2</div>
                <div class="text-xs text-gray-500">Dropdowns re-initialize after HTMX swaps</div>
              </div>
            </a>
          </div>
        </div>
      </div>
      
      <div class="mt-4 p-3 bg-green-50 border border-green-200 rounded">
        <p class="text-green-700 text-sm">
          ✅ <strong>Success!</strong> If this dropdown works, then HTMX dropdown re-initialization is working correctly.
        </p>
      </div>
    </div>
  `);
});

// Mount clean route groups
const authRoutes = createAuthRoutes();
const dashboardRoutes = createCleanDashboardRoutes();
const riskRoutes = createRiskRoutesARIA5();
const complianceRoutes = createComplianceRoutes();
const operationsRoutes = createOperationsRoutes();
const intelligenceRoutes = createIntelligenceRoutes();
const adminRoutes = createAdminRoutes();
const apiRoutes = createAPIRoutes();
const aiRoutes = createAIAssistantRoutes();

app.route('/auth', authRoutes);
app.route('/dashboard', dashboardRoutes);
app.route('/risk', riskRoutes);
app.route('/compliance', complianceRoutes);
app.route('/operations', operationsRoutes);
app.route('/intelligence', intelligenceRoutes);
app.route('/admin', adminRoutes);
app.route('/api', apiRoutes);
app.route('/ai', aiRoutes);

// Clean 404 handler - NO full page layout to prevent injection
app.notFound((c) => {
  // Check if this is an HTMX request
  const htmxRequest = c.req.header('HX-Request');
  
  if (htmxRequest) {
    // Return simple error for HTMX requests
    return c.html('<div class="text-gray-500 text-center p-4">Content not available</div>', 404);
  }
  
  // Full page 404 for regular requests
  return c.html(
    cleanLayout({
      title: '404 - Page Not Found',
      content: html`
        <div class="flex items-center justify-center min-h-screen">
          <div class="text-center">
            <h1 class="text-6xl font-bold text-gray-200">404</h1>
            <p class="text-xl text-gray-600 mt-4">Page not found</p>
            <a href="/dashboard" class="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Go to Dashboard
            </a>
          </div>
        </div>
      `
    }),
    404
  );
});

// Clean error handler
app.onError((err, c) => {
  console.error(`Error: ${err}`);
  
  // Check if this is an HTMX request
  const htmxRequest = c.req.header('HX-Request');
  
  if (htmxRequest) {
    // Return simple error for HTMX requests
    return c.html('<div class="text-red-500 text-center p-4">Server error. Please try again.</div>', 500);
  }
  
  // Full page error for regular requests
  return c.html(
    cleanLayout({
      title: 'Error',
      content: html`
        <div class="flex items-center justify-center min-h-screen">
          <div class="text-center">
            <h1 class="text-4xl font-bold text-red-600">Error</h1>
            <p class="text-gray-600 mt-4">Something went wrong. Please try again.</p>
            <a href="/dashboard" class="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Go to Dashboard
            </a>
          </div>
        </div>
      `
    }),
    500
  );
});

export default app;