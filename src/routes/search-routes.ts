/**
 * Search Routes - Full-text search using SQLite FTS5
 * 
 * Provides endpoints for platform-wide search functionality with faceting and advanced features.
 */

import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { SearchService, SearchOptions } from '../services/search-service';

const searchRoutes = new Hono<{ Bindings: { DB: D1Database } }>();

// Helper function to get current user
async function getCurrentUser(c: any) {
  const sessionId = getCookie(c, 'session_id');
  if (!sessionId) return null;
  
  const session = await c.env.DB.prepare(`
    SELECT u.* FROM users u 
    JOIN user_sessions s ON u.id = s.user_id 
    WHERE s.session_id = ? AND s.expires_at > datetime('now')
  `).bind(sessionId).first();
  
  return session;
}

/**
 * Global Search Interface
 */
searchRoutes.get('/search', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.redirect('/login');
  }

  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Global Search - ARIA5-Ubuntu</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://unpkg.com/htmx.org@1.9.10"></script>
      <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
      <div class="min-h-screen">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-4">
              <div class="flex items-center space-x-4">
                <a href="/" class="text-blue-600 hover:text-blue-800">
                  <i class="fas fa-arrow-left"></i> Back to Dashboard
                </a>
                <h1 class="text-2xl font-bold text-gray-900">
                  <i class="fas fa-search mr-2"></i>
                  Global Search
                </h1>
              </div>
            </div>
          </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <!-- Search Bar -->
          <div class="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i class="fas fa-search text-gray-400"></i>
              </div>
              <input type="text" 
                     id="search-input"
                     class="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                     placeholder="Search across all platforms: assets, services, risks, incidents, documents..."
                     hx-post="/api/search"
                     hx-trigger="keyup changed delay:300ms, search"
                     hx-target="#search-results"
                     hx-include="[name='filters[]']">
            </div>
            
            <!-- Search Filters -->
            <div class="mt-4 flex flex-wrap gap-2">
              <label class="inline-flex items-center">
                <input type="checkbox" name="filters[]" value="assets" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked>
                <span class="ml-2 text-sm text-gray-700">Assets</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="filters[]" value="services" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked>
                <span class="ml-2 text-sm text-gray-700">Services</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="filters[]" value="risks" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked>
                <span class="ml-2 text-sm text-gray-700">Risk Assessments</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="filters[]" value="incidents" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked>
                <span class="ml-2 text-sm text-gray-700">Incidents</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="filters[]" value="documents" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500" checked>
                <span class="ml-2 text-sm text-gray-700">Documents</span>
              </label>
              <label class="inline-flex items-center">
                <input type="checkbox" name="filters[]" value="users" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <span class="ml-2 text-sm text-gray-700">Users</span>
              </label>
            </div>
          </div>

          <!-- Search Results -->
          <div id="search-results" class="space-y-6">
            <!-- Initial state -->
            <div class="text-center py-16">
              <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
              <h3 class="text-xl font-medium text-gray-900 mb-2">Search ARIA5-Ubuntu Platform</h3>
              <p class="text-gray-500 max-w-md mx-auto">
                Use the search bar above to find assets, services, risk assessments, incidents, documents, and more across the entire platform.
              </p>
              <div class="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg mx-auto">
                <div class="text-sm">
                  <i class="fas fa-server text-blue-500 mb-2 block text-lg"></i>
                  <strong>Assets</strong><br>
                  <span class="text-gray-500">Servers, endpoints, devices</span>
                </div>
                <div class="text-sm">
                  <i class="fas fa-cogs text-green-500 mb-2 block text-lg"></i>
                  <strong>Services</strong><br>
                  <span class="text-gray-500">Business services, applications</span>
                </div>
                <div class="text-sm">
                  <i class="fas fa-exclamation-triangle text-orange-500 mb-2 block text-lg"></i>
                  <strong>Risks</strong><br>
                  <span class="text-gray-500">Risk assessments, treatments</span>
                </div>
                <div class="text-sm">
                  <i class="fas fa-fire text-red-500 mb-2 block text-lg"></i>
                  <strong>Incidents</strong><br>
                  <span class="text-gray-500">Security incidents, events</span>
                </div>
                <div class="text-sm">
                  <i class="fas fa-file-alt text-purple-500 mb-2 block text-lg"></i>
                  <strong>Documents</strong><br>
                  <span class="text-gray-500">Policies, procedures, reports</span>
                </div>
                <div class="text-sm">
                  <i class="fas fa-users text-indigo-500 mb-2 block text-lg"></i>
                  <strong>Users</strong><br>
                  <span class="text-gray-500">Team members, contacts</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <script>
        // Trigger search on filter changes
        document.querySelectorAll('input[name="filters[]"]').forEach(checkbox => {
          checkbox.addEventListener('change', () => {
            const searchInput = document.getElementById('search-input');
            if (searchInput.value.trim()) {
              htmx.trigger(searchInput, 'search');
            }
          });
        });
      </script>
    </body>
    </html>
  `);
});

/**
 * Perform search via API
 */
searchRoutes.post('/api/search', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const formData = await c.req.formData();
    const query = formData.get('search-input') as string;
    const filters = formData.getAll('filters[]') as string[];

    if (!query || query.trim().length < 2) {
      return c.html(`
        <div class="text-center py-8">
          <p class="text-gray-500">Enter at least 2 characters to search</p>
        </div>
      `);
    }

    const searchService = new SearchService(c.env.DB);
    await searchService.initializeTables();

    const options: SearchOptions = {
      types: filters.length > 0 ? filters : undefined,
      limit: 20
    };

    const { results, stats } = await searchService.search(query, options);

    if (results.length === 0) {
      return c.html(`
        <div class="text-center py-8">
          <i class="fas fa-search text-4xl text-gray-300 mb-4"></i>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No results found</h3>
          <p class="text-gray-500">Try different keywords or check your spelling</p>
        </div>
      `);
    }

    // Group results by type
    const grouped = results.reduce((acc, result) => {
      if (!acc[result.type]) acc[result.type] = [];
      acc[result.type].push(result);
      return acc;
    }, {} as Record<string, typeof results>);

    return c.html(`
      <div class="space-y-6">
        <!-- Search Stats -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-blue-800 font-medium">
                Found ${stats.total_results} results in ${stats.search_time}ms
              </p>
              <p class="text-blue-600 text-sm">
                Searched ${stats.indexes_used.join(', ')}
              </p>
            </div>
            <i class="fas fa-search-plus text-blue-500 text-xl"></i>
          </div>
        </div>

        <!-- Results by Category -->
        ${Object.entries(grouped).map(([type, items]) => {
          const typeConfig = {
            assets: { icon: 'fas fa-server', color: 'blue', title: 'Assets' },
            services: { icon: 'fas fa-cogs', color: 'green', title: 'Services' },
            risks: { icon: 'fas fa-exclamation-triangle', color: 'orange', title: 'Risk Assessments' },
            incidents: { icon: 'fas fa-fire', color: 'red', title: 'Incidents' },
            documents: { icon: 'fas fa-file-alt', color: 'purple', title: 'Documents' },
            users: { icon: 'fas fa-users', color: 'indigo', title: 'Users' }
          }[type] || { icon: 'fas fa-file', color: 'gray', title: type };

          return `
            <div class="bg-white rounded-lg shadow-sm border">
              <div class="px-6 py-4 border-b border-gray-200">
                <div class="flex items-center space-x-2">
                  <i class="${typeConfig.icon} text-${typeConfig.color}-500"></i>
                  <h3 class="text-lg font-medium text-gray-900">${typeConfig.title}</h3>
                  <span class="text-sm text-gray-500">(${items.length} results)</span>
                </div>
              </div>
              <div class="divide-y divide-gray-200">
                ${items.map(item => `
                  <div class="px-6 py-4 hover:bg-gray-50">
                    <div class="flex items-start justify-between">
                      <div class="flex-1">
                        <h4 class="font-medium text-gray-900 mb-1">${item.title}</h4>
                        <p class="text-gray-600 text-sm mb-2">${item.content.substring(0, 200)}${item.content.length > 200 ? '...' : ''}</p>
                        <div class="flex items-center space-x-4 text-xs text-gray-500">
                          <span><i class="fas fa-star mr-1"></i>Score: ${item.score?.toFixed(2) || 'N/A'}</span>
                          ${item.created_at ? `<span><i class="fas fa-calendar mr-1"></i>${new Date(item.created_at).toLocaleDateString()}</span>` : ''}
                          ${item.metadata?.department ? `<span><i class="fas fa-building mr-1"></i>${item.metadata.department}</span>` : ''}
                        </div>
                      </div>
                      <div class="ml-4 flex-shrink-0">
                        <a href="/${type}/${item.id}" class="text-blue-600 hover:text-blue-800">
                          <i class="fas fa-external-link-alt"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `);

  } catch (error) {
    console.error('Search error:', error);
    return c.html(`
      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="flex items-center">
          <i class="fas fa-exclamation-triangle text-red-500 mr-2"></i>
          <p class="text-red-800">Search error: ${error}</p>
        </div>
      </div>
    `);
  }
});

/**
 * Index content for search
 */
searchRoutes.post('/api/search/index', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { content_type, content_id, title, content, metadata } = await c.req.json();

    const searchService = new SearchService(c.env.DB);
    await searchService.initializeTables();

    await searchService.indexContent(content_type, content_id, title, content, metadata);

    return c.json({ 
      success: true, 
      message: 'Content indexed successfully' 
    });

  } catch (error) {
    console.error('Indexing error:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Indexing failed' 
    }, 500);
  }
});

/**
 * Search statistics API
 */
searchRoutes.get('/api/search/stats', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const searchService = new SearchService(c.env.DB);
    const stats = await searchService.getSearchStats();

    return c.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Search stats error:', error);
    return c.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get search stats' 
    }, 500);
  }
});

export { searchRoutes };