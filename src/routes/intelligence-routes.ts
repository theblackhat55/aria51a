import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import type { CloudflareBindings } from '../types';

export function createIntelligenceRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware to all routes
  app.use('*', requireAuth);
  
  // Main intelligence page
  app.get('/', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Threat Intelligence',
        user,
        content: renderIntelligencePage(user)
      })
    );
  });
  
  // Intelligence sections
  app.get('/threats', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Threat Analysis',
        user,
        content: renderThreatsPage(user)
      })
    );
  });
  
  app.get('/feeds', async (c) => {
    const user = c.get('user');
    
    return c.html(
      cleanLayout({
        title: 'Intelligence Feeds',
        user,
        content: renderFeedsPage(user)
      })
    );
  });
  
  return app;
}

const renderIntelligencePage = (user: any) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Threat Intelligence</h1>
        <p class="mt-2 text-lg text-gray-600">Advanced threat detection and intelligence analysis</p>
      </div>
      
      <!-- Intelligence Overview -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-eye text-2xl text-blue-500"></i>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Active Threats</p>
              <p class="text-2xl font-semibold text-gray-900">17</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-shield-alt text-2xl text-green-500"></i>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Blocked Attacks</p>
              <p class="text-2xl font-semibold text-gray-900">234</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-globe text-2xl text-purple-500"></i>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Intel Sources</p>
              <p class="text-2xl font-semibold text-gray-900">12</p>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-chart-line text-2xl text-red-500"></i>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500">Risk Score</p>
              <p class="text-2xl font-semibold text-gray-900">Medium</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Intelligence Dashboard -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Threat Landscape -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">Current Threat Landscape</h2>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div class="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div class="flex items-center">
                  <i class="fas fa-virus text-red-600 mr-3"></i>
                  <div>
                    <p class="font-medium text-gray-900">Malware Campaign</p>
                    <p class="text-sm text-gray-500">Banking trojan targeting financial sector</p>
                  </div>
                </div>
                <span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Critical</span>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div class="flex items-center">
                  <i class="fas fa-user-secret text-orange-600 mr-3"></i>
                  <div>
                    <p class="font-medium text-gray-900">APT Activity</p>
                    <p class="text-sm text-gray-500">Sophisticated phishing campaign detected</p>
                  </div>
                </div>
                <span class="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">High</span>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                <div class="flex items-center">
                  <i class="fas fa-bug text-yellow-600 mr-3"></i>
                  <div>
                    <p class="font-medium text-gray-900">Zero-Day Exploit</p>
                    <p class="text-sm text-gray-500">New vulnerability in popular software</p>
                  </div>
                </div>
                <span class="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Medium</span>
              </div>
            </div>
            
            <div class="mt-6">
              <a href="/intelligence/threats" class="text-blue-600 hover:text-blue-500 font-medium">
                View All Threats →
              </a>
            </div>
          </div>
        </div>
        
        <!-- Intelligence Feeds -->
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-medium text-gray-900">Intelligence Feeds</h2>
          </div>
          <div class="p-6">
            <div class="space-y-4">
              <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div class="flex items-center">
                  <i class="fas fa-rss text-green-600 mr-3"></i>
                  <div>
                    <p class="font-medium text-gray-900">CISA Alerts</p>
                    <p class="text-sm text-gray-500">Last updated: 15 minutes ago</p>
                  </div>
                </div>
                <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div class="flex items-center">
                  <i class="fas fa-satellite-dish text-green-600 mr-3"></i>
                  <div>
                    <p class="font-medium text-gray-900">Commercial Threat Intel</p>
                    <p class="text-sm text-gray-500">Last updated: 2 hours ago</p>
                  </div>
                </div>
                <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Active</span>
              </div>
              
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex items-center">
                  <i class="fas fa-database text-gray-600 mr-3"></i>
                  <div>
                    <p class="font-medium text-gray-900">Internal Threat DB</p>
                    <p class="text-sm text-gray-500">Last updated: 6 hours ago</p>
                  </div>
                </div>
                <span class="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Offline</span>
              </div>
            </div>
            
            <div class="mt-6">
              <a href="/intelligence/feeds" class="text-blue-600 hover:text-blue-500 font-medium">
                Manage Feeds →
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="mt-8">
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <i class="fas fa-search mr-2"></i>Threat Hunting
            </button>
            <button class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              <i class="fas fa-download mr-2"></i>IOC Export
            </button>
            <button class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors">
              <i class="fas fa-chart-bar mr-2"></i>Threat Report
            </button>
            <button class="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors">
              <i class="fas fa-bell mr-2"></i>Set Alert
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

const renderThreatsPage = (user: any) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Threat Analysis</h1>
      
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600">Advanced threat analysis dashboard coming soon...</p>
        
        <div class="mt-4">
          <a href="/intelligence" class="text-blue-600 hover:text-blue-500">← Back to Intelligence</a>
        </div>
      </div>
    </div>
  </div>
`;

const renderFeedsPage = (user: any) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-8">Intelligence Feeds</h1>
      
      <div class="bg-white rounded-lg shadow p-6">
        <p class="text-gray-600">Intelligence feed management coming soon...</p>
        
        <div class="mt-4">
          <a href="/intelligence" class="text-blue-600 hover:text-blue-500">← Back to Intelligence</a>
        </div>
      </div>
    </div>
  </div>
`;