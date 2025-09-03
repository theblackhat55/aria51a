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
import { createRiskRoutes } from './routes/risk-routes';
import { createComplianceRoutes } from './routes/compliance-routes';
import { createAdminRoutes } from './routes/admin-routes';
import { createAPIRoutes } from './routes/api-routes';

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

// Mount route groups
const authRoutes = createAuthRoutes();
const dashboardRoutes = createDashboardRoutes();
const riskRoutes = createRiskRoutes();
const complianceRoutes = createComplianceRoutes();
const adminRoutes = createAdminRoutes();
const apiRoutes = createAPIRoutes();

app.route('/auth', authRoutes);
app.route('/dashboard', dashboardRoutes);
app.route('/risk', riskRoutes);
app.route('/compliance', complianceRoutes);
app.route('/admin', adminRoutes);
app.route('/api', apiRoutes);

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