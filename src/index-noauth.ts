// ARIA5.1 - NO-AUTH VERSION FOR EMERGENCY TESTING
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { html } from 'hono/html';
import { serveStatic } from 'hono/cloudflare-workers';

// Import ONLY risk routes
import { createRiskRoutesARIA5 } from './routes/risk-routes-aria5';
import { createAIAssistantRoutes } from './routes/ai-assistant-routes';
import { cleanLayout } from './templates/layout-clean';

const app = new Hono();

// Minimal security middleware
app.use('*', logger());
app.use('*', cors());

// Fix Font Awesome CSP
app.use('*', async (c, next) => {
  await next();
  c.header('Content-Security-Policy', 'default-src \'self\'; style-src \'self\' \'unsafe-inline\' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; script-src \'self\' \'unsafe-inline\' https://cdn.tailwindcss.com https://unpkg.com; img-src \'self\' data: https:; font-src \'self\' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; connect-src \'self\'');
});

// Serve static files
app.get('/static/*', serveStatic({ root: './' }));

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'healthy - NO AUTH VERSION',
    version: '5.1.0-emergency',
    mode: 'Emergency Fix',
    timestamp: new Date().toISOString()
  });
});

// Direct risk management entry (NO AUTH)
app.get('/', async (c) => {
  return c.html(
    cleanLayout({
      title: 'ARIA5 Emergency Test - Risk Management',
      user: { 
        id: 1, 
        username: 'emergency_user', 
        first_name: 'Emergency', 
        last_name: 'User',
        email: 'emergency@test.com'
      },
      content: html`
        <div class="min-h-screen bg-gray-50 py-12">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <!-- Emergency Notice -->
            <div class="bg-green-50 border-l-4 border-green-500 p-6 mb-8">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <i class="fas fa-check-circle text-green-500 text-2xl"></i>
                </div>
                <div class="ml-3">
                  <h3 class="text-lg font-medium text-green-800">🚀 EMERGENCY FIX DEPLOYED</h3>
                  <div class="mt-2 text-sm text-green-700">
                    <p><strong>✅ Database Fix:</strong> Simple table structure bypassing all constraints</p>
                    <p><strong>✅ AI Integration:</strong> Real Cloudflare Workers AI</p>
                    <p><strong>✅ Authentication:</strong> Completely bypassed for testing</p>
                    <p><strong>✅ Font Awesome:</strong> CSP headers fixed</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Quick Test Buttons -->
            <div class="bg-white rounded-lg shadow p-6 mb-8">
              <h3 class="text-lg font-medium text-gray-900 mb-4">🧪 Emergency Test Controls</h3>
              <div class="space-x-4">
                <button hx-get="/risk/debug-db-test" 
                        hx-target="#test-results" 
                        hx-swap="innerHTML"
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                  Test Database Connection
                </button>
                <button hx-get="/risk/table" 
                        hx-target="#test-results" 
                        hx-swap="innerHTML"
                        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                  Load Risk Table
                </button>
                <button hx-get="/risk/create" 
                        hx-target="#test-results" 
                        hx-swap="innerHTML"
                        class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">
                  Test Risk Creation Form
                </button>
              </div>
              <div id="test-results" class="mt-4"></div>
            </div>

            <!-- Direct Risk Creation Test -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">⚡ Direct Risk Creation Test</h3>
              <form hx-post="/risk/create" 
                    hx-target="#creation-result" 
                    hx-swap="innerHTML"
                    class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Risk Title *</label>
                    <input type="text" 
                           name="title" 
                           value="Emergency Database Test Risk"
                           required
                           class="w-full px-3 py-2 border border-gray-300 rounded-md">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                    <select name="category" required class="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="operational">Operational</option>
                      <option value="technology">Technology</option>
                      <option value="financial">Financial</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                  <textarea name="description" 
                            required
                            class="w-full px-3 py-2 border border-gray-300 rounded-md">Testing emergency database fix with simple table structure</textarea>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Probability *</label>
                    <select name="probability" required class="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="1">1 - Very Low</option>
                      <option value="2">2 - Low</option>
                      <option value="3" selected>3 - Medium</option>
                      <option value="4">4 - High</option>
                      <option value="5">5 - Very High</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Impact *</label>
                    <select name="impact" required class="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option value="1">1 - Minimal</option>
                      <option value="2">2 - Minor</option>
                      <option value="3">3 - Moderate</option>
                      <option value="4" selected>4 - Major</option>
                      <option value="5">5 - Severe</option>
                    </select>
                  </div>
                </div>
                <button type="submit" 
                        class="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md font-medium">
                  🚨 TEST DATABASE FIX - CREATE RISK
                </button>
                <div id="creation-result" class="mt-4"></div>
              </form>
            </div>
          </div>
        </div>
      `
    })
  );
});

// Mount risk management routes (NO AUTH)
app.route('/risk', createRiskRoutesARIA5());

// Mount AI assistant routes 
app.route('/ai', createAIAssistantRoutes());

// Catch all other routes
app.get('*', (c) => {
  return c.redirect('/');
});

export default app;