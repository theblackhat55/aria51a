import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { baseLayout } from '../templates/layout';

export function createComplianceRoutes() {
  const app = new Hono();
  
  // Apply authentication middleware
  app.use('*', requireAuth);
  
  // Frameworks page
  app.get('/frameworks', async (c) => {
    const user = c.get('user');
    return c.html(
      baseLayout({
        title: 'Compliance Frameworks',
        user,
        content: html`
          <div class="min-h-screen bg-gray-50 py-8">
            <div class="max-w-7xl mx-auto px-4">
              <h1 class="text-3xl font-bold text-gray-900 mb-8">Compliance Frameworks</h1>
              <div class="bg-white rounded-lg shadow p-6">
                <p class="text-gray-500">Frameworks interface coming soon...</p>
              </div>
            </div>
          </div>
        `
      })
    );
  });
  
  // SoA page
  app.get('/soa', async (c) => {
    const user = c.get('user');
    return c.html(
      baseLayout({
        title: 'Statement of Applicability',
        user,
        content: html`
          <div class="min-h-screen bg-gray-50 py-8">
            <div class="max-w-7xl mx-auto px-4">
              <h1 class="text-3xl font-bold text-gray-900 mb-8">Statement of Applicability</h1>
              <div class="bg-white rounded-lg shadow p-6">
                <p class="text-gray-500">SoA interface coming soon...</p>
              </div>
            </div>
          </div>
        `
      })
    );
  });
  
  // Evidence page
  app.get('/evidence', async (c) => {
    const user = c.get('user');
    return c.html(
      baseLayout({
        title: 'Evidence Management',
        user,
        content: html`
          <div class="min-h-screen bg-gray-50 py-8">
            <div class="max-w-7xl mx-auto px-4">
              <h1 class="text-3xl font-bold text-gray-900 mb-8">Evidence Management</h1>
              <div class="bg-white rounded-lg shadow p-6">
                <p class="text-gray-500">Evidence management interface coming soon...</p>
              </div>
            </div>
          </div>
        `
      })
    );
  });
  
  // Assessments page
  app.get('/assessments', async (c) => {
    const user = c.get('user');
    return c.html(
      baseLayout({
        title: 'Compliance Assessments',
        user,
        content: html`
          <div class="min-h-screen bg-gray-50 py-8">
            <div class="max-w-7xl mx-auto px-4">
              <h1 class="text-3xl font-bold text-gray-900 mb-8">Compliance Assessments</h1>
              <div class="bg-white rounded-lg shadow p-6">
                <p class="text-gray-500">Assessments interface coming soon...</p>
              </div>
            </div>
          </div>
        `
      })
    );
  });
  
  return app;
}