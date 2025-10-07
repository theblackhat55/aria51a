import { Hono } from 'hono';
import { html, raw } from 'hono/html';
import { requireAuth, requireAdmin } from './auth-routes';
import type { CloudflareBindings } from '../types';
import { setCSRFToken, csrfMiddleware } from '../middleware/auth-middleware';
import { getCookie } from 'hono/cookie';

export function createAPIManagementRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication and admin middleware
  app.use('*', requireAuth);
  app.use('*', requireAdmin);

  // ============================================================================
  // API MANAGEMENT MODAL ROUTES
  // ============================================================================

  // Main API Management Page
  app.get('/', async (c) => {
    const csrfToken = setCSRFToken(c);
    const user = c.get('user');
    
    return c.html(renderAPIManagementPage(csrfToken, user));
  });

  // Get All APIs (with filtering)
  app.get('/api/list', async (c) => {
    try {
      const category = c.req.query('category') || '';
      const status = c.req.query('status') || '';
      const search = c.req.query('search') || '';
      
      let query = `
        SELECT 
          ae.*,
          u.username as creator_name,
          (SELECT COUNT(*) FROM api_request_logs WHERE endpoint_id = ae.id) as total_logs
        FROM api_endpoints ae
        LEFT JOIN users u ON ae.created_by = u.id
        WHERE 1=1
      `;
      
      const params: any[] = [];
      
      if (category) {
        query += ` AND ae.route_category = ?`;
        params.push(category);
      }
      
      if (status === 'active') {
        query += ` AND ae.is_active = 1`;
      } else if (status === 'inactive') {
        query += ` AND ae.is_active = 0`;
      } else if (status === 'deprecated') {
        query += ` AND ae.is_deprecated = 1`;
      }
      
      if (search) {
        query += ` AND (ae.endpoint_path LIKE ? OR ae.endpoint_name LIKE ? OR ae.description LIKE ?)`;
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }
      
      query += ` ORDER BY ae.route_category, ae.endpoint_path`;
      
      let stmt = c.env.DB.prepare(query);
      params.forEach(param => {
        stmt = stmt.bind(param);
      });
      
      const result = await stmt.all();
      
      return c.json({
        success: true,
        data: result.results || [],
        count: result.results?.length || 0
      });
    } catch (error: any) {
      console.error('Error fetching APIs:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Get Single API Details
  app.get('/api/details/:id', async (c) => {
    try {
      const id = c.req.param('id');
      
      const api = await c.env.DB.prepare(`
        SELECT 
          ae.*,
          u.username as creator_name
        FROM api_endpoints ae
        LEFT JOIN users u ON ae.created_by = u.id
        WHERE ae.id = ?
      `).bind(id).first();
      
      if (!api) {
        return c.json({ success: false, error: 'API not found' }, 404);
      }
      
      // Get recent logs
      const logs = await c.env.DB.prepare(`
        SELECT * FROM api_request_logs
        WHERE endpoint_id = ?
        ORDER BY created_at DESC
        LIMIT 10
      `).bind(id).all();
      
      // Get health checks
      const healthChecks = await c.env.DB.prepare(`
        SELECT * FROM api_health_checks
        WHERE endpoint_id = ?
        ORDER BY checked_at DESC
        LIMIT 5
      `).bind(id).all();
      
      return c.json({
        success: true,
        data: {
          api,
          logs: logs.results || [],
          healthChecks: healthChecks.results || []
        }
      });
    } catch (error: any) {
      console.error('Error fetching API details:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Create New API
  app.post('/api/create', async (c) => {
    try {
      // CSRF validation is handled by middleware
      const user = c.get('user');
      const body = await c.req.json();
      
      const result = await c.env.DB.prepare(`
        INSERT INTO api_endpoints (
          endpoint_path, http_method, route_category, endpoint_name, description,
          request_body_schema, response_schema, example_request, example_response,
          is_active, is_public, requires_auth, requires_admin,
          rate_limit_requests, rate_limit_window,
          api_version, is_deprecated, required_permissions, allowed_roles,
          requires_csrf, requires_api_key,
          depends_on_services, integration_type, external_service_name,
          tags, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        body.endpoint_path,
        body.http_method,
        body.route_category,
        body.endpoint_name,
        body.description || null,
        body.request_body_schema || null,
        body.response_schema || null,
        body.example_request || null,
        body.example_response || null,
        body.is_active !== undefined ? body.is_active : 1,
        body.is_public || 0,
        body.requires_auth !== undefined ? body.requires_auth : 1,
        body.requires_admin || 0,
        body.rate_limit_requests || 100,
        body.rate_limit_window || 60,
        body.api_version || 'v1',
        body.is_deprecated || 0,
        body.required_permissions || null,
        body.allowed_roles || null,
        body.requires_csrf !== undefined ? body.requires_csrf : 1,
        body.requires_api_key || 0,
        body.depends_on_services || null,
        body.integration_type || 'internal',
        body.external_service_name || null,
        body.tags || null,
        body.notes || null,
        user.id
      ).run();
      
      return c.json({
        success: true,
        message: 'API endpoint created successfully',
        id: result.meta.last_row_id
      });
    } catch (error: any) {
      console.error('Error creating API:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Update API
  app.put('/api/update/:id', async (c) => {
    try {
      // CSRF validation is handled by middleware
      const id = c.req.param('id');
      const body = await c.req.json();
      
      await c.env.DB.prepare(`
        UPDATE api_endpoints SET
          endpoint_path = ?,
          http_method = ?,
          route_category = ?,
          endpoint_name = ?,
          description = ?,
          request_body_schema = ?,
          response_schema = ?,
          example_request = ?,
          example_response = ?,
          is_active = ?,
          is_public = ?,
          requires_auth = ?,
          requires_admin = ?,
          rate_limit_requests = ?,
          rate_limit_window = ?,
          api_version = ?,
          is_deprecated = ?,
          deprecation_date = ?,
          replacement_endpoint = ?,
          required_permissions = ?,
          allowed_roles = ?,
          requires_csrf = ?,
          requires_api_key = ?,
          depends_on_services = ?,
          integration_type = ?,
          external_service_name = ?,
          tags = ?,
          notes = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        body.endpoint_path,
        body.http_method,
        body.route_category,
        body.endpoint_name,
        body.description || null,
        body.request_body_schema || null,
        body.response_schema || null,
        body.example_request || null,
        body.example_response || null,
        body.is_active !== undefined ? body.is_active : 1,
        body.is_public || 0,
        body.requires_auth !== undefined ? body.requires_auth : 1,
        body.requires_admin || 0,
        body.rate_limit_requests || 100,
        body.rate_limit_window || 60,
        body.api_version || 'v1',
        body.is_deprecated || 0,
        body.deprecation_date || null,
        body.replacement_endpoint || null,
        body.required_permissions || null,
        body.allowed_roles || null,
        body.requires_csrf !== undefined ? body.requires_csrf : 1,
        body.requires_api_key || 0,
        body.depends_on_services || null,
        body.integration_type || 'internal',
        body.external_service_name || null,
        body.tags || null,
        body.notes || null,
        id
      ).run();
      
      return c.json({
        success: true,
        message: 'API endpoint updated successfully'
      });
    } catch (error: any) {
      console.error('Error updating API:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Delete API
  app.delete('/api/delete/:id', async (c) => {
    try {
      // CSRF validation is handled by middleware
      const id = c.req.param('id');
      
      await c.env.DB.prepare(`
        DELETE FROM api_endpoints WHERE id = ?
      `).bind(id).run();
      
      return c.json({
        success: true,
        message: 'API endpoint deleted successfully'
      });
    } catch (error: any) {
      console.error('Error deleting API:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Toggle API Status (Active/Inactive)
  app.post('/api/toggle-status/:id', async (c) => {
    try {
      // CSRF validation is handled by middleware
      const id = c.req.param('id');
      
      await c.env.DB.prepare(`
        UPDATE api_endpoints 
        SET is_active = CASE WHEN is_active = 1 THEN 0 ELSE 1 END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(id).run();
      
      return c.json({
        success: true,
        message: 'API status toggled successfully'
      });
    } catch (error: any) {
      console.error('Error toggling API status:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Deprecate API
  app.post('/api/deprecate/:id', async (c) => {
    try {
      // CSRF validation is handled by middleware
      const id = c.req.param('id');
      const body = await c.req.json();
      
      await c.env.DB.prepare(`
        UPDATE api_endpoints 
        SET is_deprecated = 1,
            deprecation_date = ?,
            replacement_endpoint = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(
        body.deprecation_date || new Date().toISOString().split('T')[0],
        body.replacement_endpoint || null,
        id
      ).run();
      
      return c.json({
        success: true,
        message: 'API deprecated successfully'
      });
    } catch (error: any) {
      console.error('Error deprecating API:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Get API Statistics
  app.get('/api/statistics', async (c) => {
    try {
      const stats = await c.env.DB.prepare(`
        SELECT 
          COUNT(*) as total_apis,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_apis,
          SUM(CASE WHEN is_deprecated = 1 THEN 1 ELSE 0 END) as deprecated_apis,
          SUM(CASE WHEN requires_auth = 0 THEN 1 ELSE 0 END) as public_apis,
          SUM(CASE WHEN requires_admin = 1 THEN 1 ELSE 0 END) as admin_apis,
          COUNT(DISTINCT route_category) as total_categories,
          SUM(total_requests) as total_requests,
          AVG(avg_response_time_ms) as avg_response_time
        FROM api_endpoints
      `).first();
      
      // Get category breakdown
      const categories = await c.env.DB.prepare(`
        SELECT 
          route_category,
          COUNT(*) as count,
          SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count
        FROM api_endpoints
        GROUP BY route_category
        ORDER BY count DESC
      `).all();
      
      return c.json({
        success: true,
        data: {
          overview: stats,
          categories: categories.results || []
        }
      });
    } catch (error: any) {
      console.error('Error fetching API statistics:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Perform Health Check
  app.post('/api/health-check/:id', async (c) => {
    try {
      // CSRF validation is handled by middleware
      const id = c.req.param('id');
      const user = c.get('user');
      
      const api = await c.env.DB.prepare(`
        SELECT * FROM api_endpoints WHERE id = ?
      `).bind(id).first();
      
      if (!api) {
        return c.json({ success: false, error: 'API not found' }, 404);
      }
      
      // Simulate health check (in production, this would actually call the endpoint)
      const startTime = Date.now();
      let status = 'success';
      let statusCode = 200;
      let errorMessage = null;
      
      try {
        // In production, make actual HTTP request to the endpoint
        // For now, simulate with random success/failure
        const isHealthy = Math.random() > 0.1; // 90% success rate
        if (!isHealthy) {
          status = 'failure';
          statusCode = 500;
          errorMessage = 'Endpoint returned error status';
        }
      } catch (error: any) {
        status = 'error';
        errorMessage = error.message;
      }
      
      const responseTime = Date.now() - startTime;
      
      // Log health check
      await c.env.DB.prepare(`
        INSERT INTO api_health_checks (
          endpoint_id, status, response_time_ms, status_code, 
          error_message, check_type, checked_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        status,
        responseTime,
        statusCode,
        errorMessage,
        'manual',
        user.id
      ).run();
      
      // Update endpoint health status
      const healthStatus = status === 'success' ? 'healthy' : 'degraded';
      await c.env.DB.prepare(`
        UPDATE api_endpoints 
        SET health_status = ?,
            last_health_check = CURRENT_TIMESTAMP
        WHERE id = ?
      `).bind(healthStatus, id).run();
      
      return c.json({
        success: true,
        data: {
          status,
          statusCode,
          responseTime,
          errorMessage
        }
      });
    } catch (error: any) {
      console.error('Error performing health check:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  // Get API Categories
  app.get('/api/categories', async (c) => {
    try {
      const result = await c.env.DB.prepare(`
        SELECT DISTINCT route_category 
        FROM api_endpoints 
        ORDER BY route_category
      `).all();
      
      return c.json({
        success: true,
        data: result.results || []
      });
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      return c.json({ success: false, error: error.message }, 500);
    }
  });

  return app;
}

// ============================================================================
// RENDER API MANAGEMENT PAGE
// ============================================================================

function renderAPIManagementPage(csrfToken: string, user: any) {
  return html`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>API Management - ARIA5</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
      <script src="https://unpkg.com/htmx.org@1.9.10"></script>
    </head>
    <body class="bg-gray-50">
      <div class="min-h-screen">
        <!-- Header -->
        <div class="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="flex items-center justify-between">
              <div>
                <h1 class="text-2xl font-bold text-gray-900">
                  <i class="fas fa-plug mr-2 text-blue-600"></i>
                  API Management
                </h1>
                <p class="text-sm text-gray-500 mt-1">Manage all backend API endpoints</p>
              </div>
              <div class="flex items-center gap-3">
                <button onclick="refreshAPIList()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <i class="fas fa-sync-alt mr-2"></i>Refresh
                </button>
                <button onclick="openCreateModal()" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                  <i class="fas fa-plus mr-2"></i>Add New API
                </button>
                <a href="/admin" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  <i class="fas fa-arrow-left mr-2"></i>Back to Admin
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistics Cards -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div id="stats-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <!-- Stats will be loaded here -->
          </div>

          <!-- Filters -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select id="filter-category" onchange="filterAPIs()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">All Categories</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select id="filter-status" onchange="filterAPIs()" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="deprecated">Deprecated</option>
                </select>
              </div>
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <div class="relative">
                  <input 
                    type="text" 
                    id="filter-search" 
                    onkeyup="filterAPIs()" 
                    placeholder="Search by path, name, or description..."
                    class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                  <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- API List -->
          <div id="api-list-container" class="bg-white rounded-lg shadow-sm border border-gray-200">
            <!-- APIs will be loaded here -->
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <div id="api-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <div class="flex items-center justify-between">
              <h3 id="modal-title" class="text-xl font-bold text-gray-900">Add New API Endpoint</h3>
              <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
          </div>
          
          <form id="api-form" class="p-6">
            <input type="hidden" id="api-id" name="id">
            <input type="hidden" name="csrf_token" value="${csrfToken}">
            
            <!-- Form will be rendered by JavaScript -->
            <div id="form-content"></div>
            
            <div class="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button type="button" onclick="closeModal()" class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button type="submit" class="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700">
                <i class="fas fa-save mr-2"></i>Save API
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Details Modal -->
      <div id="details-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
          <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <div class="flex items-center justify-between">
              <h3 class="text-xl font-bold text-gray-900">API Endpoint Details</h3>
              <button onclick="closeDetailsModal()" class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-times text-xl"></i>
              </button>
            </div>
          </div>
          
          <div id="details-content" class="p-6">
            <!-- Details will be loaded here -->
          </div>
        </div>
      </div>

      <script>
        const csrfToken = '${csrfToken}';
        let currentAPIs = [];
        
        // Load statistics
        async function loadStatistics() {
          try {
            const response = await fetch('/admin/api-management/api/statistics');
            const data = await response.json();
            
            if (data.success) {
              const stats = data.data.overview;
              document.getElementById('stats-container').innerHTML = \`
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm text-gray-500">Total APIs</p>
                      <p class="text-3xl font-bold text-gray-900">\${stats.total_apis || 0}</p>
                    </div>
                    <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <i class="fas fa-plug text-blue-600 text-xl"></i>
                    </div>
                  </div>
                </div>
                
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm text-gray-500">Active APIs</p>
                      <p class="text-3xl font-bold text-green-600">\${stats.active_apis || 0}</p>
                    </div>
                    <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <i class="fas fa-check-circle text-green-600 text-xl"></i>
                    </div>
                  </div>
                </div>
                
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm text-gray-500">Deprecated</p>
                      <p class="text-3xl font-bold text-orange-600">\${stats.deprecated_apis || 0}</p>
                    </div>
                    <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <i class="fas fa-exclamation-triangle text-orange-600 text-xl"></i>
                    </div>
                  </div>
                </div>
                
                <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-sm text-gray-500">Categories</p>
                      <p class="text-3xl font-bold text-purple-600">\${stats.total_categories || 0}</p>
                    </div>
                    <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <i class="fas fa-layer-group text-purple-600 text-xl"></i>
                    </div>
                  </div>
                </div>
              \`;
            }
          } catch (error) {
            console.error('Error loading statistics:', error);
          }
        }
        
        // Load categories
        async function loadCategories() {
          try {
            const response = await fetch('/admin/api-management/api/categories');
            const data = await response.json();
            
            if (data.success) {
              const select = document.getElementById('filter-category');
              data.data.forEach(cat => {
                const option = document.createElement('option');
                option.value = cat.route_category;
                option.textContent = cat.route_category;
                select.appendChild(option);
              });
            }
          } catch (error) {
            console.error('Error loading categories:', error);
          }
        }
        
        // Load APIs
        async function loadAPIs() {
          try {
            const category = document.getElementById('filter-category').value;
            const status = document.getElementById('filter-status').value;
            const search = document.getElementById('filter-search').value;
            
            const params = new URLSearchParams();
            if (category) params.append('category', category);
            if (status) params.append('status', status);
            if (search) params.append('search', search);
            
            const response = await fetch('/admin/api-management/api/list?' + params);
            const data = await response.json();
            
            if (data.success) {
              currentAPIs = data.data;
              renderAPIList(data.data);
            }
          } catch (error) {
            console.error('Error loading APIs:', error);
          }
        }
        
        // Render API list
        function renderAPIList(apis) {
          const container = document.getElementById('api-list-container');
          
          if (apis.length === 0) {
            container.innerHTML = \`
              <div class="text-center py-12">
                <i class="fas fa-plug text-gray-400 text-5xl mb-4"></i>
                <p class="text-gray-500">No APIs found</p>
              </div>
            \`;
            return;
          }
          
          // Group by category
          const grouped = {};
          apis.forEach(api => {
            if (!grouped[api.route_category]) {
              grouped[api.route_category] = [];
            }
            grouped[api.route_category].push(api);
          });
          
          let html = '';
          Object.keys(grouped).sort().forEach(category => {
            html += \`
              <div class="border-b border-gray-200 last:border-b-0">
                <div class="bg-gray-50 px-6 py-3 border-b border-gray-200">
                  <h3 class="text-sm font-semibold text-gray-700">
                    <i class="fas fa-folder mr-2 text-gray-500"></i>
                    \${category} <span class="text-gray-500">(\${grouped[category].length})</span>
                  </h3>
                </div>
                <div class="divide-y divide-gray-200">
            \`;
            
            grouped[category].forEach(api => {
              const methodColor = {
                'GET': 'bg-green-100 text-green-800',
                'POST': 'bg-blue-100 text-blue-800',
                'PUT': 'bg-yellow-100 text-yellow-800',
                'PATCH': 'bg-orange-100 text-orange-800',
                'DELETE': 'bg-red-100 text-red-800'
              }[api.http_method] || 'bg-gray-100 text-gray-800';
              
              const statusBadge = api.is_active 
                ? '<span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">Active</span>'
                : '<span class="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">Inactive</span>';
              
              const deprecatedBadge = api.is_deprecated
                ? '<span class="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded ml-2">Deprecated</span>'
                : '';
              
              const healthColor = {
                'healthy': 'text-green-500',
                'degraded': 'text-yellow-500',
                'down': 'text-red-500',
                'unknown': 'text-gray-400'
              }[api.health_status] || 'text-gray-400';
              
              html += \`
                <div class="px-6 py-4 hover:bg-gray-50 transition-colors">
                  <div class="flex items-start justify-between">
                    <div class="flex-1">
                      <div class="flex items-center gap-3 mb-2">
                        <span class="px-2 py-1 text-xs font-bold \${methodColor} rounded">\${api.http_method}</span>
                        <code class="text-sm font-mono text-gray-900">\${api.endpoint_path}</code>
                        <i class="fas fa-circle \${healthColor} text-xs" title="Health: \${api.health_status}"></i>
                      </div>
                      <h4 class="text-sm font-semibold text-gray-900 mb-1">\${api.endpoint_name}</h4>
                      <p class="text-xs text-gray-500 mb-2">\${api.description || 'No description'}</p>
                      <div class="flex items-center gap-4 text-xs text-gray-500">
                        <span><i class="fas fa-shield-alt mr-1"></i>\${api.requires_auth ? 'Auth Required' : 'Public'}</span>
                        <span><i class="fas fa-code mr-1"></i>\${api.api_version}</span>
                        <span><i class="fas fa-chart-line mr-1"></i>\${api.total_requests || 0} requests</span>
                      </div>
                    </div>
                    <div class="flex items-center gap-2 ml-4">
                      \${statusBadge}
                      \${deprecatedBadge}
                      <div class="flex items-center gap-1 ml-2">
                        <button onclick="viewAPIDetails(\${api.id})" class="p-2 text-blue-600 hover:bg-blue-50 rounded" title="View Details">
                          <i class="fas fa-eye"></i>
                        </button>
                        <button onclick="editAPI(\${api.id})" class="p-2 text-gray-600 hover:bg-gray-100 rounded" title="Edit">
                          <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="performHealthCheck(\${api.id})" class="p-2 text-green-600 hover:bg-green-50 rounded" title="Health Check">
                          <i class="fas fa-heartbeat"></i>
                        </button>
                        <button onclick="toggleAPIStatus(\${api.id})" class="p-2 text-yellow-600 hover:bg-yellow-50 rounded" title="Toggle Status">
                          <i class="fas fa-power-off"></i>
                        </button>
                        <button onclick="deleteAPI(\${api.id})" class="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              \`;
            });
            
            html += '</div></div>';
          });
          
          container.innerHTML = html;
        }
        
        // Filter APIs
        function filterAPIs() {
          loadAPIs();
        }
        
        // Refresh API list
        function refreshAPIList() {
          loadStatistics();
          loadAPIs();
        }
        
        // Open create modal
        function openCreateModal() {
          document.getElementById('modal-title').textContent = 'Add New API Endpoint';
          document.getElementById('api-id').value = '';
          document.getElementById('api-form').reset();
          renderForm();
          document.getElementById('api-modal').classList.remove('hidden');
        }
        
        // Close modal
        function closeModal() {
          document.getElementById('api-modal').classList.add('hidden');
        }
        
        // Close details modal
        function closeDetailsModal() {
          document.getElementById('details-modal').classList.add('hidden');
        }
        
        // Render form
        function renderForm(api = null) {
          const formContent = document.getElementById('form-content');
          formContent.innerHTML = \`
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <!-- Basic Information -->
              <div class="md:col-span-2">
                <h4 class="text-sm font-semibold text-gray-900 mb-4">Basic Information</h4>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Endpoint Path *</label>
                <input type="text" name="endpoint_path" value="\${api?.endpoint_path || ''}" required
                  placeholder="/api/example/endpoint"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">HTTP Method *</label>
                <select name="http_method" required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="GET" \${api?.http_method === 'GET' ? 'selected' : ''}>GET</option>
                  <option value="POST" \${api?.http_method === 'POST' ? 'selected' : ''}>POST</option>
                  <option value="PUT" \${api?.http_method === 'PUT' ? 'selected' : ''}>PUT</option>
                  <option value="PATCH" \${api?.http_method === 'PATCH' ? 'selected' : ''}>PATCH</option>
                  <option value="DELETE" \${api?.http_method === 'DELETE' ? 'selected' : ''}>DELETE</option>
                  <option value="OPTIONS" \${api?.http_method === 'OPTIONS' ? 'selected' : ''}>OPTIONS</option>
                  <option value="HEAD" \${api?.http_method === 'HEAD' ? 'selected' : ''}>HEAD</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Route Category *</label>
                <input type="text" name="route_category" value="\${api?.route_category || ''}" required
                  placeholder="e.g., Admin, Operations, Risk Management"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Endpoint Name *</label>
                <input type="text" name="endpoint_name" value="\${api?.endpoint_name || ''}" required
                  placeholder="e.g., List Users"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea name="description" rows="3" 
                  placeholder="Describe what this API endpoint does..."
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">\${api?.description || ''}</textarea>
              </div>
              
              <!-- Security & Access -->
              <div class="md:col-span-2 mt-4">
                <h4 class="text-sm font-semibold text-gray-900 mb-4">Security & Access Control</h4>
              </div>
              
              <div class="flex items-center gap-6">
                <label class="flex items-center gap-2">
                  <input type="checkbox" name="is_active" value="1" \${api?.is_active || !api ? 'checked' : ''}
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                  <span class="text-sm text-gray-700">Active</span>
                </label>
                <label class="flex items-center gap-2">
                  <input type="checkbox" name="is_public" value="1" \${api?.is_public ? 'checked' : ''}
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                  <span class="text-sm text-gray-700">Public API</span>
                </label>
              </div>
              
              <div class="flex items-center gap-6">
                <label class="flex items-center gap-2">
                  <input type="checkbox" name="requires_auth" value="1" \${api?.requires_auth || !api ? 'checked' : ''}
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                  <span class="text-sm text-gray-700">Requires Authentication</span>
                </label>
                <label class="flex items-center gap-2">
                  <input type="checkbox" name="requires_admin" value="1" \${api?.requires_admin ? 'checked' : ''}
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                  <span class="text-sm text-gray-700">Requires Admin</span>
                </label>
              </div>
              
              <div class="flex items-center gap-6">
                <label class="flex items-center gap-2">
                  <input type="checkbox" name="requires_csrf" value="1" \${api?.requires_csrf || !api ? 'checked' : ''}
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                  <span class="text-sm text-gray-700">Requires CSRF Token</span>
                </label>
                <label class="flex items-center gap-2">
                  <input type="checkbox" name="requires_api_key" value="1" \${api?.requires_api_key ? 'checked' : ''}
                    class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                  <span class="text-sm text-gray-700">Requires API Key</span>
                </label>
              </div>
              
              <!-- Rate Limiting -->
              <div class="md:col-span-2 mt-4">
                <h4 class="text-sm font-semibold text-gray-900 mb-4">Rate Limiting</h4>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Max Requests</label>
                <input type="number" name="rate_limit_requests" value="\${api?.rate_limit_requests || 100}"
                  min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Time Window (seconds)</label>
                <input type="number" name="rate_limit_window" value="\${api?.rate_limit_window || 60}"
                  min="1" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              
              <!-- Versioning & Deprecation -->
              <div class="md:col-span-2 mt-4">
                <h4 class="text-sm font-semibold text-gray-900 mb-4">Versioning & Deprecation</h4>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">API Version</label>
                <input type="text" name="api_version" value="\${api?.api_version || 'v1'}"
                  placeholder="v1"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              
              <div class="flex items-center">
                <label class="flex items-center gap-2">
                  <input type="checkbox" name="is_deprecated" value="1" \${api?.is_deprecated ? 'checked' : ''}
                    class="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded">
                  <span class="text-sm text-gray-700">Mark as Deprecated</span>
                </label>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Deprecation Date</label>
                <input type="date" name="deprecation_date" value="\${api?.deprecation_date || ''}"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Replacement Endpoint</label>
                <input type="text" name="replacement_endpoint" value="\${api?.replacement_endpoint || ''}"
                  placeholder="/api/v2/new-endpoint"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              
              <!-- Integration -->
              <div class="md:col-span-2 mt-4">
                <h4 class="text-sm font-semibold text-gray-900 mb-4">Integration Details</h4>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Integration Type</label>
                <select name="integration_type" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="internal" \${api?.integration_type === 'internal' ? 'selected' : ''}>Internal</option>
                  <option value="external" \${api?.integration_type === 'external' ? 'selected' : ''}>External</option>
                  <option value="third-party" \${api?.integration_type === 'third-party' ? 'selected' : ''}>Third-Party</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">External Service Name</label>
                <input type="text" name="external_service_name" value="\${api?.external_service_name || ''}"
                  placeholder="e.g., Stripe, SendGrid"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              
              <!-- Documentation -->
              <div class="md:col-span-2 mt-4">
                <h4 class="text-sm font-semibold text-gray-900 mb-4">Documentation</h4>
              </div>
              
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Request Body Schema</label>
                <textarea name="request_body_schema" rows="3" 
                  placeholder='{"field": "type", ...}'
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm">\${api?.request_body_schema || ''}</textarea>
              </div>
              
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Response Schema</label>
                <textarea name="response_schema" rows="3" 
                  placeholder='{"field": "type", ...}'
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm">\${api?.response_schema || ''}</textarea>
              </div>
              
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Example Request</label>
                <textarea name="example_request" rows="3" 
                  placeholder='{"example": "request"}'
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm">\${api?.example_request || ''}</textarea>
              </div>
              
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Example Response</label>
                <textarea name="example_response" rows="3" 
                  placeholder='{"example": "response"}'
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm">\${api?.example_response || ''}</textarea>
              </div>
              
              <!-- Notes & Tags -->
              <div class="md:col-span-2 mt-4">
                <h4 class="text-sm font-semibold text-gray-900 mb-4">Additional Information</h4>
              </div>
              
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                <input type="text" name="tags" value="\${api?.tags || ''}"
                  placeholder="tag1, tag2, tag3"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              </div>
              
              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea name="notes" rows="3" 
                  placeholder="Additional notes or comments..."
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">\${api?.notes || ''}</textarea>
              </div>
            </div>
          \`;
        }
        
        // Edit API
        async function editAPI(id) {
          try {
            const api = currentAPIs.find(a => a.id === id);
            if (!api) return;
            
            document.getElementById('modal-title').textContent = 'Edit API Endpoint';
            document.getElementById('api-id').value = id;
            renderForm(api);
            document.getElementById('api-modal').classList.remove('hidden');
          } catch (error) {
            console.error('Error editing API:', error);
            alert('Error loading API details');
          }
        }
        
        // View API details
        async function viewAPIDetails(id) {
          try {
            const response = await fetch(\`/admin/api-management/api/details/\${id}\`);
            const data = await response.json();
            
            if (data.success) {
              const api = data.data.api;
              const logs = data.data.logs;
              const healthChecks = data.data.healthChecks;
              
              const methodColor = {
                'GET': 'bg-green-100 text-green-800',
                'POST': 'bg-blue-100 text-blue-800',
                'PUT': 'bg-yellow-100 text-yellow-800',
                'PATCH': 'bg-orange-100 text-orange-800',
                'DELETE': 'bg-red-100 text-red-800'
              }[api.http_method] || 'bg-gray-100 text-gray-800';
              
              let detailsHtml = \`
                <div class="space-y-6">
                  <!-- Header -->
                  <div class="flex items-start justify-between pb-4 border-b border-gray-200">
                    <div>
                      <div class="flex items-center gap-3 mb-2">
                        <span class="px-3 py-1 text-sm font-bold \${methodColor} rounded">\${api.http_method}</span>
                        <code class="text-lg font-mono text-gray-900">\${api.endpoint_path}</code>
                      </div>
                      <h4 class="text-xl font-bold text-gray-900 mb-1">\${api.endpoint_name}</h4>
                      <p class="text-sm text-gray-600">\${api.description || 'No description'}</p>
                    </div>
                  </div>
                  
                  <!-- Stats Grid -->
                  <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div class="bg-blue-50 rounded-lg p-4">
                      <p class="text-xs text-blue-600 font-medium mb-1">Total Requests</p>
                      <p class="text-2xl font-bold text-blue-900">\${api.total_requests || 0}</p>
                    </div>
                    <div class="bg-green-50 rounded-lg p-4">
                      <p class="text-xs text-green-600 font-medium mb-1">Successful</p>
                      <p class="text-2xl font-bold text-green-900">\${api.successful_requests || 0}</p>
                    </div>
                    <div class="bg-red-50 rounded-lg p-4">
                      <p class="text-xs text-red-600 font-medium mb-1">Failed</p>
                      <p class="text-2xl font-bold text-red-900">\${api.failed_requests || 0}</p>
                    </div>
                    <div class="bg-purple-50 rounded-lg p-4">
                      <p class="text-xs text-purple-600 font-medium mb-1">Avg Response Time</p>
                      <p class="text-2xl font-bold text-purple-900">\${api.avg_response_time_ms?.toFixed(2) || 0}ms</p>
                    </div>
                  </div>
                  
                  <!-- Details Sections -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Security & Access -->
                    <div>
                      <h5 class="text-sm font-semibold text-gray-900 mb-3">Security & Access</h5>
                      <dl class="space-y-2">
                        <div class="flex justify-between text-sm">
                          <dt class="text-gray-600">Status:</dt>
                          <dd class="font-medium">\${api.is_active ? '<span class="text-green-600">Active</span>' : '<span class="text-gray-600">Inactive</span>'}</dd>
                        </div>
                        <div class="flex justify-between text-sm">
                          <dt class="text-gray-600">Public API:</dt>
                          <dd class="font-medium">\${api.is_public ? 'Yes' : 'No'}</dd>
                        </div>
                        <div class="flex justify-between text-sm">
                          <dt class="text-gray-600">Requires Auth:</dt>
                          <dd class="font-medium">\${api.requires_auth ? 'Yes' : 'No'}</dd>
                        </div>
                        <div class="flex justify-between text-sm">
                          <dt class="text-gray-600">Requires Admin:</dt>
                          <dd class="font-medium">\${api.requires_admin ? 'Yes' : 'No'}</dd>
                        </div>
                        <div class="flex justify-between text-sm">
                          <dt class="text-gray-600">CSRF Required:</dt>
                          <dd class="font-medium">\${api.requires_csrf ? 'Yes' : 'No'}</dd>
                        </div>
                      </dl>
                    </div>
                    
                    <!-- Rate Limiting -->
                    <div>
                      <h5 class="text-sm font-semibold text-gray-900 mb-3">Rate Limiting</h5>
                      <dl class="space-y-2">
                        <div class="flex justify-between text-sm">
                          <dt class="text-gray-600">Max Requests:</dt>
                          <dd class="font-medium">\${api.rate_limit_requests}</dd>
                        </div>
                        <div class="flex justify-between text-sm">
                          <dt class="text-gray-600">Time Window:</dt>
                          <dd class="font-medium">\${api.rate_limit_window}s</dd>
                        </div>
                      </dl>
                      
                      <h5 class="text-sm font-semibold text-gray-900 mt-4 mb-3">Version & Status</h5>
                      <dl class="space-y-2">
                        <div class="flex justify-between text-sm">
                          <dt class="text-gray-600">API Version:</dt>
                          <dd class="font-medium">\${api.api_version}</dd>
                        </div>
                        <div class="flex justify-between text-sm">
                          <dt class="text-gray-600">Deprecated:</dt>
                          <dd class="font-medium">\${api.is_deprecated ? '<span class="text-orange-600">Yes</span>' : 'No'}</dd>
                        </div>
                        <div class="flex justify-between text-sm">
                          <dt class="text-gray-600">Health:</dt>
                          <dd class="font-medium">\${api.health_status}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                  
                  <!-- Recent Health Checks -->
                  <div>
                    <h5 class="text-sm font-semibold text-gray-900 mb-3">Recent Health Checks</h5>
                    <div class="bg-gray-50 rounded-lg p-4">
                      \${healthChecks.length > 0 ? \`
                        <div class="space-y-2">
                          \${healthChecks.map(check => \`
                            <div class="flex items-center justify-between text-sm">
                              <span class="text-gray-600">\${new Date(check.checked_at).toLocaleString()}</span>
                              <span class="flex items-center gap-2">
                                <span class="px-2 py-1 text-xs font-medium rounded \${
                                  check.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }">\${check.status}</span>
                                <span class="text-gray-500">\${check.response_time_ms}ms</span>
                              </span>
                            </div>
                          \`).join('')}
                        </div>
                      \` : '<p class="text-sm text-gray-500">No health checks performed yet</p>'}
                    </div>
                  </div>
                  
                  <!-- Request/Response Examples -->
                  \${api.example_request || api.example_response ? \`
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      \${api.example_request ? \`
                        <div>
                          <h5 class="text-sm font-semibold text-gray-900 mb-2">Example Request</h5>
                          <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">\${api.example_request}</pre>
                        </div>
                      \` : ''}
                      \${api.example_response ? \`
                        <div>
                          <h5 class="text-sm font-semibold text-gray-900 mb-2">Example Response</h5>
                          <pre class="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs">\${api.example_response}</pre>
                        </div>
                      \` : ''}
                    </div>
                  \` : ''}
                  
                  <!-- Notes -->
                  \${api.notes ? \`
                    <div>
                      <h5 class="text-sm font-semibold text-gray-900 mb-2">Notes</h5>
                      <p class="text-sm text-gray-600">\${api.notes}</p>
                    </div>
                  \` : ''}
                  
                  <!-- Metadata -->
                  <div class="pt-4 border-t border-gray-200">
                    <dl class="grid grid-cols-2 gap-4 text-xs text-gray-500">
                      <div>
                        <dt>Created By:</dt>
                        <dd class="mt-1 font-medium text-gray-900">\${api.creator_name || 'Unknown'}</dd>
                      </div>
                      <div>
                        <dt>Created At:</dt>
                        <dd class="mt-1 font-medium text-gray-900">\${new Date(api.created_at).toLocaleString()}</dd>
                      </div>
                      <div>
                        <dt>Last Updated:</dt>
                        <dd class="mt-1 font-medium text-gray-900">\${new Date(api.updated_at).toLocaleString()}</dd>
                      </div>
                      <div>
                        <dt>Last Called:</dt>
                        <dd class="mt-1 font-medium text-gray-900">\${api.last_called_at ? new Date(api.last_called_at).toLocaleString() : 'Never'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              \`;
              
              document.getElementById('details-content').innerHTML = detailsHtml;
              document.getElementById('details-modal').classList.remove('hidden');
            }
          } catch (error) {
            console.error('Error loading API details:', error);
            alert('Error loading API details');
          }
        }
        
        // Toggle API status
        async function toggleAPIStatus(id) {
          if (!confirm('Are you sure you want to toggle this API status?')) return;
          
          try {
            const response = await fetch(\`/admin/api-management/api/toggle-status/\${id}\`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
              }
            });
            
            const data = await response.json();
            if (data.success) {
              alert(data.message);
              refreshAPIList();
            } else {
              alert('Error: ' + data.error);
            }
          } catch (error) {
            console.error('Error toggling API status:', error);
            alert('Error toggling API status');
          }
        }
        
        // Delete API
        async function deleteAPI(id) {
          if (!confirm('Are you sure you want to delete this API endpoint? This action cannot be undone.')) return;
          
          try {
            const response = await fetch(\`/admin/api-management/api/delete/\${id}\`, {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
              }
            });
            
            const data = await response.json();
            if (data.success) {
              alert(data.message);
              refreshAPIList();
            } else {
              alert('Error: ' + data.error);
            }
          } catch (error) {
            console.error('Error deleting API:', error);
            alert('Error deleting API');
          }
        }
        
        // Perform health check
        async function performHealthCheck(id) {
          try {
            const response = await fetch(\`/admin/api-management/api/health-check/\${id}\`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
              }
            });
            
            const data = await response.json();
            if (data.success) {
              const result = data.data;
              const statusColor = result.status === 'success' ? 'green' : 'red';
              alert(\`Health Check Result:\\n\\nStatus: \${result.status}\\nResponse Time: \${result.responseTime}ms\\nStatus Code: \${result.statusCode}\${result.errorMessage ? '\\nError: ' + result.errorMessage : ''}\`);
              refreshAPIList();
            } else {
              alert('Error: ' + data.error);
            }
          } catch (error) {
            console.error('Error performing health check:', error);
            alert('Error performing health check');
          }
        }
        
        // Form submission
        document.getElementById('api-form').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const formData = new FormData(e.target);
          const apiId = document.getElementById('api-id').value;
          
          // Convert form data to JSON
          const data = {};
          formData.forEach((value, key) => {
            if (key === 'csrf_token' || key === 'id') return;
            
            // Handle checkboxes
            if (['is_active', 'is_public', 'requires_auth', 'requires_admin', 'requires_csrf', 'requires_api_key', 'is_deprecated'].includes(key)) {
              data[key] = value === '1' ? 1 : 0;
            } else if (['rate_limit_requests', 'rate_limit_window'].includes(key)) {
              data[key] = parseInt(value) || 0;
            } else {
              data[key] = value;
            }
          });
          
          // Add missing checkboxes (unchecked) as 0
          ['is_active', 'is_public', 'requires_auth', 'requires_admin', 'requires_csrf', 'requires_api_key', 'is_deprecated'].forEach(field => {
            if (data[field] === undefined) {
              data[field] = 0;
            }
          });
          
          try {
            const url = apiId 
              ? \`/admin/api-management/api/update/\${apiId}\`
              : '/admin/api-management/api/create';
            const method = apiId ? 'PUT' : 'POST';
            
            const response = await fetch(url, {
              method,
              headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': csrfToken
              },
              body: JSON.stringify(data)
            });
            
            const result = await response.json();
            if (result.success) {
              alert(result.message);
              closeModal();
              refreshAPIList();
            } else {
              alert('Error: ' + result.error);
            }
          } catch (error) {
            console.error('Error saving API:', error);
            alert('Error saving API');
          }
        });
        
        // Initialize
        loadStatistics();
        loadCategories();
        loadAPIs();
      </script>
    </body>
    </html>
  `;
}
