import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
// import jwt from 'jsonwebtoken'; // Not compatible with Cloudflare Workers - removed
import { baseLayout } from '../templates/layout';
import { html } from 'hono/html';

// const JWT_SECRET = 'aria5-htmx-secret-key-change-in-production'; // Not needed for base64 tokens

export function createHomeRoute() {
  const app = new Hono();
  
  // Main home page - check auth and redirect accordingly
  app.get('/', async (c) => {
    const token = getCookie(c, 'aria_token');
    
    if (!token) {
      // Not authenticated - redirect to login
      return c.redirect('/login');
    }
    
    try {
      // Verify base64 token (compatible with Cloudflare Workers)
      const tokenData = JSON.parse(atob(token));
      
      // Check if token is expired
      if (Date.now() > tokenData.expires) {
        // Token expired - redirect to login
        return c.redirect('/login');
      }
      
      const user = {
        id: tokenData.id,
        username: tokenData.username,
        email: tokenData.email,
        role: tokenData.role,
        firstName: tokenData.firstName,
        lastName: tokenData.lastName
      };
      
      // Authenticated - show HTMX dashboard
      return c.html(
        baseLayout({
          title: 'ARIA5.1 Dashboard',
          user,
          content: html`
            <div class="min-h-screen bg-gray-50 py-8">
              <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <!-- Welcome Header -->
                <div class="mb-8">
                  <h1 class="text-3xl font-bold text-gray-900">
                    Welcome back, ${user.firstName || user.username}!
                  </h1>
                  <p class="text-gray-600 mt-1">
                    ARIA5.1 Platform - AI Risk Intelligence with HTMX
                  </p>
                </div>
                
                <!-- Quick Stats -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-sm text-gray-600">Total Risks</p>
                        <p class="text-2xl font-bold text-gray-900">45</p>
                      </div>
                      <div class="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-exclamation-triangle text-red-600"></i>
                      </div>
                    </div>
                  </div>
                  
                  <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-sm text-gray-600">Compliance Score</p>
                        <p class="text-2xl font-bold text-gray-900">78%</p>
                      </div>
                      <div class="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-check-circle text-green-600"></i>
                      </div>
                    </div>
                  </div>
                  
                  <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-sm text-gray-600">Open Incidents</p>
                        <p class="text-2xl font-bold text-gray-900">3</p>
                      </div>
                      <div class="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-fire text-orange-600"></i>
                      </div>
                    </div>
                  </div>
                  
                  <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center justify-between">
                      <div>
                        <p class="text-sm text-gray-600">KRI Alerts</p>
                        <p class="text-2xl font-bold text-gray-900">5</p>
                      </div>
                      <div class="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-chart-line text-blue-600"></i>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Quick Actions -->
                <div class="bg-white rounded-lg shadow p-6">
                  <h2 class="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <a href="/risks" class="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <i class="fas fa-exclamation-triangle text-red-500 text-2xl mb-2"></i>
                      <span class="text-sm font-medium text-gray-900">Manage Risks</span>
                    </a>
                    <a href="/compliance" class="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <i class="fas fa-clipboard-check text-green-500 text-2xl mb-2"></i>
                      <span class="text-sm font-medium text-gray-900">Compliance</span>
                    </a>
                    <a href="/incidents/create" class="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <i class="fas fa-plus-circle text-blue-500 text-2xl mb-2"></i>
                      <span class="text-sm font-medium text-gray-900">Report Incident</span>
                    </a>
                    <a href="/assessments" class="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                      <i class="fas fa-tasks text-purple-500 text-2xl mb-2"></i>
                      <span class="text-sm font-medium text-gray-900">Assessments</span>
                    </a>
                  </div>
                </div>
                
                <!-- Recent Activity -->
                <div class="mt-8 bg-white rounded-lg shadow p-6">
                  <h2 class="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                  <div class="space-y-4">
                    <div class="flex items-center space-x-3">
                      <div class="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-exclamation text-red-600 text-xs"></i>
                      </div>
                      <div class="flex-1">
                        <p class="text-sm text-gray-900">New critical risk identified: <strong>Data Breach Vulnerability</strong></p>
                        <p class="text-xs text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div class="flex items-center space-x-3">
                      <div class="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-check text-green-600 text-xs"></i>
                      </div>
                      <div class="flex-1">
                        <p class="text-sm text-gray-900">Compliance assessment completed for <strong>ISO 27001</strong></p>
                        <p class="text-xs text-gray-500">5 hours ago</p>
                      </div>
                    </div>
                    <div class="flex items-center space-x-3">
                      <div class="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <i class="fas fa-file text-blue-600 text-xs"></i>
                      </div>
                      <div class="flex-1">
                        <p class="text-sm text-gray-900">Evidence uploaded for <strong>Access Control Policy</strong></p>
                        <p class="text-xs text-gray-500">Yesterday</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `
        })
      );
    } catch (error) {
      // Invalid token - redirect to login
      return c.redirect('/login');
    }
  });
  
  return app;
}