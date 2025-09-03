import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { baseLayout } from '../templates/layout';

export function createRiskRoutes() {
  const app = new Hono();
  
  // Apply authentication middleware
  app.use('*', requireAuth);
  
  // Risk list page
  app.get('/risks', async (c) => {
    const user = c.get('user');
    const db = c.env?.DB;
    
    // TODO: Fetch risks from database
    const risks = [];
    
    return c.html(
      baseLayout({
        title: 'Risk Management',
        user,
        content: html`
          <div class="min-h-screen bg-gray-50 py-8">
            <div class="max-w-7xl mx-auto px-4">
              <div class="mb-8 flex justify-between items-center">
                <h1 class="text-3xl font-bold text-gray-900">Risk Management</h1>
                <button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  <i class="fas fa-plus mr-2"></i>New Risk
                </button>
              </div>
              
              <!-- Risk table will go here -->
              <div class="bg-white rounded-lg shadow">
                <div class="p-6">
                  <p class="text-gray-500">Risk management interface coming soon...</p>
                </div>
              </div>
            </div>
          </div>
        `
      })
    );
  });
  
  // Treatments page
  app.get('/treatments', async (c) => {
    const user = c.get('user');
    return c.html(
      baseLayout({
        title: 'Risk Treatments',
        user,
        content: html`
          <div class="min-h-screen bg-gray-50 py-8">
            <div class="max-w-7xl mx-auto px-4">
              <h1 class="text-3xl font-bold text-gray-900 mb-8">Risk Treatments</h1>
              <div class="bg-white rounded-lg shadow p-6">
                <p class="text-gray-500">Risk treatments interface coming soon...</p>
              </div>
            </div>
          </div>
        `
      })
    );
  });
  
  // KRIs page
  app.get('/kris', async (c) => {
    const user = c.get('user');
    return c.html(
      baseLayout({
        title: 'Key Risk Indicators',
        user,
        content: html`
          <div class="min-h-screen bg-gray-50 py-8">
            <div class="max-w-7xl mx-auto px-4">
              <h1 class="text-3xl font-bold text-gray-900 mb-8">Key Risk Indicators</h1>
              <div class="bg-white rounded-lg shadow p-6">
                <p class="text-gray-500">KRI interface coming soon...</p>
              </div>
            </div>
          </div>
        `
      })
    );
  });
  
  // Incidents page
  app.get('/incidents', async (c) => {
    const user = c.get('user');
    return c.html(
      baseLayout({
        title: 'Incidents',
        user,
        content: html`
          <div class="min-h-screen bg-gray-50 py-8">
            <div class="max-w-7xl mx-auto px-4">
              <h1 class="text-3xl font-bold text-gray-900 mb-8">Incident Management</h1>
              <div class="bg-white rounded-lg shadow p-6">
                <p class="text-gray-500">Incident management interface coming soon...</p>
              </div>
            </div>
          </div>
        `
      })
    );
  });
  
  return app;
}