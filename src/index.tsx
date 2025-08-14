// DMT Risk Assessment System v2.0 - Main Application
import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';
import { cors } from 'hono/cors';
import { renderer } from './renderer';
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

// Renderer middleware for HTML pages
app.use(renderer);

// Main application route
app.get('/', (c) => {
  return c.render(
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>DMT Risk Assessment System v2.0</title>
        <meta name="description" content="Next-Generation Enterprise GRC Platform with AI-Powered Intelligence & Advanced Analytics" />
        
        {/* External CSS Libraries */}
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
        
        {/* Chart.js for Analytics */}
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        
        {/* Additional Libraries */}
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/dayjs@1.11.10/dayjs.min.js"></script>
        
        {/* Custom Styles */}
        <link href="/static/styles.css" rel="stylesheet" />
      </head>
      <body className="bg-gray-50 font-sans antialiased">
        {/* Loading Spinner */}
        <div id="loading-spinner" className="fixed inset-0 bg-white z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>

        {/* Main Application Container */}
        <div id="app" className="min-h-screen">
          {/* Navigation will be injected here */}
          <nav id="navigation" className="bg-white shadow-lg"></nav>
          
          {/* Main Content Area */}
          <main id="main-content" className="container mx-auto px-4 py-8">
            <div id="dashboard-content">
              {/* Dashboard content will be loaded here */}
            </div>
          </main>
        </div>

        {/* ARIA AI Assistant Modal */}
        <div id="aria-modal" className="fixed inset-0 bg-gray-600 bg-opacity-50 hidden z-40">
          <div className="flex items-center justify-center h-full p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">ARIA - AI Risk Assistant</h3>
                <button id="close-aria" className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div id="aria-chat" className="p-6 h-64 overflow-y-auto">
                {/* Chat messages will appear here */}
              </div>
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex">
                  <input 
                    type="text" 
                    id="aria-input" 
                    placeholder="Ask ARIA about risks, compliance, or security..." 
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button 
                    id="send-aria" 
                    className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <i className="fas fa-paper-plane"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating ARIA Button */}
        <button 
          id="aria-button" 
          className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 z-30"
          title="Ask ARIA - AI Risk Assistant"
        >
          <i className="fas fa-robot text-xl"></i>
        </button>

        {/* Notification Toast Container */}
        <div id="toast-container" className="fixed top-4 right-4 z-50 space-y-2">
          {/* Toast notifications will appear here */}
        </div>

        {/* JavaScript */}
        <script src="/static/app.js"></script>
      </body>
    </html>
  );
});

// Authentication routes (HTML pages)
app.get('/login', (c) => {
  return c.render(
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Login - DMT Risk Assessment System</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet" />
      </head>
      <body className="bg-gradient-to-br from-blue-900 to-indigo-900 min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center mb-4">
              <i className="fas fa-shield-alt text-white text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">DMT Risk Assessment</h1>
            <p className="text-gray-600 mt-2">Enterprise GRC Platform v2.0</p>
          </div>

          <form id="login-form">
            <div className="mb-6">
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username or Email
              </label>
              <input
                type="text"
                id="username"
                name="username"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your username or email"
              />
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>
              Sign In
            </button>
          </form>

          <div id="login-error" className="mt-4 text-red-600 text-sm hidden"></div>

          <div className="mt-8 text-center text-sm text-gray-600">
            <p>Demo Accounts:</p>
            <div className="mt-2 space-y-1">
              <p><strong>Admin:</strong> admin / demo123</p>
              <p><strong>Risk Manager:</strong> avi_security / demo123</p>
            </div>
          </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/auth.js"></script>
      </body>
    </html>
  );
});

export default app;
