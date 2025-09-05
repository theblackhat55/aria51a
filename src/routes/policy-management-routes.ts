import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { baseLayout } from '../templates/layout';

import type { CloudflareBindings } from '../types';

export function createPolicyManagementRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware
  app.use('*', requireAuth);
  
  // Main Policy Management page
  app.get('/', async (c) => {
    const user = c.get('user');
    
    // Get current policies from RAG system
    const policies = await c.env.DB.prepare(`
      SELECT id, title, document_type, LENGTH(content) as content_length, 
             created_at, updated_at, metadata
      FROM rag_documents 
      WHERE document_type IN ('policy', 'plan', 'procedure')
      ORDER BY created_at DESC
      LIMIT 50
    `).all();
    
    return c.html(
      baseLayout({
        title: 'Policy Management',
        user,
        content: html`
          <div class="min-h-screen bg-gray-50">
            <!-- Header -->
            <div class="bg-white shadow-sm border-b">
              <div class="max-w-7xl mx-auto px-4 py-6">
                <div class="flex items-center justify-between">
                  <div>
                    <h1 class="text-2xl font-bold text-gray-900">
                      <i class="fas fa-file-alt text-blue-600 mr-2"></i>
                      Policy Management
                    </h1>
                    <p class="text-gray-600 mt-1">Manage security policies and procedures in the RAG system</p>
                  </div>
                  <div class="flex items-center space-x-3">
                    <span class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      <i class="fas fa-database text-xs mr-1"></i>
                      ${policies.results?.length || 0} Policies
                    </span>
                    <button hx-get="/policies/upload-form" 
                            hx-target="#upload-modal" 
                            hx-swap="innerHTML"
                            onclick="document.getElementById('upload-modal').classList.remove('hidden')"
                            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                      <i class="fas fa-plus mr-2"></i>
                      Upload Policy
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="max-w-7xl mx-auto px-4 py-8">
              <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <!-- Search and Filters -->
                <div class="lg:col-span-1">
                  <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">
                      <i class="fas fa-search text-blue-600 mr-2"></i>
                      Search Policies
                    </h3>
                    
                    <!-- Search Form -->
                    <form hx-post="/policies/search" 
                          hx-target="#policies-list" 
                          hx-swap="innerHTML"
                          class="space-y-4">
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Search Query</label>
                        <input type="text" 
                               name="query" 
                               placeholder="Enter search terms..." 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                      </div>
                      
                      <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
                        <select name="document_type" 
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                          <option value="">All Types</option>
                          <option value="policy">Policy</option>
                          <option value="plan">Plan</option>
                          <option value="procedure">Procedure</option>
                          <option value="standard">Standard</option>
                          <option value="guidance">Guidance</option>
                        </select>
                      </div>
                      
                      <button type="submit" 
                              class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                        <i class="fas fa-search mr-2"></i>
                        Search
                      </button>
                    </form>
                    
                    <!-- Quick Actions -->
                    <div class="mt-6 pt-6 border-t">
                      <h4 class="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h4>
                      <div class="space-y-2">
                        <button hx-get="/policies/list" 
                                hx-target="#policies-list"
                                class="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded">
                          <i class="fas fa-list mr-2"></i>
                          Show All Policies
                        </button>
                        <button hx-post="/policies/search" 
                                hx-vals='{"query": "security policy", "document_type": "policy"}'
                                hx-target="#policies-list"
                                class="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded">
                          <i class="fas fa-shield-alt mr-2"></i>
                          Security Policies
                        </button>
                        <button hx-post="/policies/search" 
                                hx-vals='{"query": "access control", "document_type": ""}'
                                hx-target="#policies-list"
                                class="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded">
                          <i class="fas fa-key mr-2"></i>
                          Access Control
                        </button>
                        <button hx-post="/policies/search" 
                                hx-vals='{"query": "incident response", "document_type": "plan"}'
                                hx-target="#policies-list"
                                class="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded">
                          <i class="fas fa-exclamation-triangle mr-2"></i>
                          Incident Response
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Policies List -->
                <div class="lg:col-span-3">
                  <div id="policies-list">
                    ${generatePoliciesList(policies.results || [])}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Upload Modal -->
          <div id="upload-modal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <!-- Modal content will be loaded here -->
          </div>

          <!-- Delete Confirmation Modal -->
          <div id="delete-modal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div class="mt-3 text-center">
                <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                </div>
                <h3 class="text-lg leading-6 font-medium text-gray-900 mt-2">Delete Policy</h3>
                <div class="mt-2 px-7 py-3">
                  <p class="text-sm text-gray-500">Are you sure you want to delete this policy? This action cannot be undone.</p>
                </div>
                <div class="items-center px-4 py-3">
                  <button id="confirm-delete-btn"
                          class="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-24 mr-2 hover:bg-red-700">
                    Delete
                  </button>
                  <button onclick="document.getElementById('delete-modal').classList.add('hidden')"
                          class="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md w-24 hover:bg-gray-600">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>

          <script>
            // Close modal when clicking outside
            document.getElementById('upload-modal').addEventListener('click', function(e) {
              if (e.target === this) {
                this.classList.add('hidden');
              }
            });
            
            // Delete policy function
            function confirmDeletePolicy(policyId, policyTitle) {
              document.getElementById('delete-modal').classList.remove('hidden');
              document.getElementById('confirm-delete-btn').onclick = function() {
                htmx.ajax('DELETE', '/policies/delete/' + policyId, {
                  target: '#policies-list',
                  swap: 'innerHTML'
                });
                document.getElementById('delete-modal').classList.add('hidden');
              };
            }
          </script>
        `
      })
    );
  });
  
  // Get policies list
  app.get('/list', async (c) => {
    const policies = await c.env.DB.prepare(`
      SELECT id, title, document_type, LENGTH(content) as content_length, 
             created_at, updated_at, metadata
      FROM rag_documents 
      WHERE document_type IN ('policy', 'plan', 'procedure', 'standard', 'guidance')
      ORDER BY created_at DESC
      LIMIT 50
    `).all();
    
    return c.html(generatePoliciesList(policies.results || []));
  });
  
  // Search policies
  app.post('/search', async (c) => {
    const formData = await c.req.parseBody();
    const query = formData.query as string || '';
    const documentType = formData.document_type as string || '';
    
    let sql = `
      SELECT id, title, document_type, LENGTH(content) as content_length, 
             created_at, updated_at, metadata
      FROM rag_documents 
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (query) {
      sql += ` AND (LOWER(title) LIKE ? OR LOWER(content) LIKE ?)`;
      const searchPattern = `%${query.toLowerCase()}%`;
      params.push(searchPattern, searchPattern);
    }
    
    if (documentType) {
      sql += ` AND document_type = ?`;
      params.push(documentType);
    }
    
    sql += ` ORDER BY created_at DESC LIMIT 50`;
    
    const policies = await c.env.DB.prepare(sql).bind(...params).all();
    
    return c.html(generatePoliciesList(policies.results || []));
  });
  
  // Upload form
  app.get('/upload-form', async (c) => {
    return c.html(html`
      <div class="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg leading-6 font-medium text-gray-900">Upload New Policy</h3>
          <button onclick="document.getElementById('upload-modal').classList.add('hidden')"
                  class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        
        <form hx-post="/policies/upload" 
              hx-target="#policies-list"
              hx-swap="innerHTML"
              hx-on::after-request="document.getElementById('upload-modal').classList.add('hidden'); this.reset();"
              enctype="multipart/form-data"
              class="space-y-4">
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Policy Title</label>
              <input type="text" 
                     name="title" 
                     placeholder="e.g., Information Security Policy" 
                     required
                     class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
              <select name="document_type" 
                      required
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">Select Type</option>
                <option value="policy">Policy</option>
                <option value="plan">Plan</option>
                <option value="procedure">Procedure</option>
                <option value="standard">Standard</option>
                <option value="guidance">Guidance</option>
                <option value="framework">Framework</option>
              </select>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Upload Method</label>
            <div class="space-y-3">
              <label class="flex items-center">
                <input type="radio" name="upload_method" value="file" checked 
                       onchange="toggleUploadMethod('file')"
                       class="mr-2">
                <span>Upload File (.md, .txt, .pdf)</span>
              </label>
              <label class="flex items-center">
                <input type="radio" name="upload_method" value="text" 
                       onchange="toggleUploadMethod('text')"
                       class="mr-2">
                <span>Paste Text Content</span>
              </label>
            </div>
          </div>
          
          <!-- File Upload -->
          <div id="file-upload" class="upload-method">
            <label class="block text-sm font-medium text-gray-700 mb-2">Select File</label>
            <input type="file" 
                   name="policy_file" 
                   accept=".md,.txt,.pdf"
                   class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <p class="text-xs text-gray-500 mt-1">Supported formats: Markdown (.md), Text (.txt), PDF (.pdf)</p>
          </div>
          
          <!-- Text Upload -->
          <div id="text-upload" class="upload-method hidden">
            <label class="block text-sm font-medium text-gray-700 mb-2">Policy Content</label>
            <textarea name="policy_content" 
                      rows="10"
                      placeholder="Paste your policy content here..."
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Metadata (JSON, Optional)</label>
            <textarea name="metadata" 
                      rows="3"
                      placeholder='{"compliance_frameworks": ["ISO 27001", "SOC 2"], "version": "1.0"}'
                      class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"></textarea>
            <p class="text-xs text-gray-500 mt-1">Additional metadata in JSON format</p>
          </div>
          
          <div class="flex items-center justify-end space-x-3 pt-4 border-t">
            <button type="button"
                    onclick="document.getElementById('upload-modal').classList.add('hidden')"
                    class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
              Cancel
            </button>
            <button type="submit" 
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              <i class="fas fa-upload mr-2"></i>
              Upload Policy
            </button>
          </div>
        </form>
      </div>
      
      <script>
        function toggleUploadMethod(method) {
          document.querySelectorAll('.upload-method').forEach(el => el.classList.add('hidden'));
          document.getElementById(method + '-upload').classList.remove('hidden');
        }
      </script>
    `);
  });
  
  // Upload policy
  app.post('/upload', async (c) => {
    try {
      const formData = await c.req.parseBody();
      const title = formData.title as string;
      const documentType = formData.document_type as string;
      const uploadMethod = formData.upload_method as string;
      const metadata = formData.metadata as string || '{}';
      const user = c.get('user');
      
      let content = '';
      
      if (uploadMethod === 'text') {
        content = formData.policy_content as string;
      } else if (uploadMethod === 'file') {
        const file = formData.policy_file as File;
        if (file && file.size > 0) {
          content = await file.text();
        } else {
          throw new Error('No file uploaded');
        }
      }
      
      if (!content.trim()) {
        throw new Error('Policy content is required');
      }
      
      // Insert policy into RAG documents
      await c.env.DB.prepare(`
        INSERT INTO rag_documents (
          title, content, document_type, metadata, embedding_status,
          uploaded_by, organization_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'pending', ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        title,
        content,
        documentType,
        metadata,
        user.id,
        user.organizationId || 1
      ).run();
      
      // Return updated policies list
      const policies = await c.env.DB.prepare(`
        SELECT id, title, document_type, LENGTH(content) as content_length, 
               created_at, updated_at, metadata
        FROM rag_documents 
        WHERE document_type IN ('policy', 'plan', 'procedure', 'standard', 'guidance')
        ORDER BY created_at DESC
        LIMIT 50
      `).all();
      
      return c.html(generatePoliciesList(policies.results || []));
      
    } catch (error) {
      console.error('Upload error:', error);
      return c.html(html`
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <i class="fas fa-exclamation-circle text-red-400"></i>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">Upload Failed</h3>
              <p class="mt-2 text-sm text-red-700">${error.message}</p>
            </div>
          </div>
        </div>
      `);
    }
  });
  
  // Delete policy
  app.delete('/delete/:id', async (c) => {
    try {
      const policyId = c.req.param('id');
      const user = c.get('user');
      
      // Delete the policy (with basic authorization check)
      await c.env.DB.prepare(`
        DELETE FROM rag_documents 
        WHERE id = ? 
        AND (uploaded_by = ? OR ? = 'admin')
      `).bind(policyId, user.id, user.role).run();
      
      // Return updated policies list
      const policies = await c.env.DB.prepare(`
        SELECT id, title, document_type, LENGTH(content) as content_length, 
               created_at, updated_at, metadata
        FROM rag_documents 
        WHERE document_type IN ('policy', 'plan', 'procedure', 'standard', 'guidance')
        ORDER BY created_at DESC
        LIMIT 50
      `).all();
      
      return c.html(generatePoliciesList(policies.results || []));
      
    } catch (error) {
      console.error('Delete error:', error);
      return c.html(html`
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <p class="text-red-700">Failed to delete policy: ${error.message}</p>
        </div>
      `);
    }
  });
  
  // View policy details
  app.get('/view/:id', async (c) => {
    const policyId = c.req.param('id');
    
    const policy = await c.env.DB.prepare(`
      SELECT id, title, content, document_type, metadata, created_at, updated_at
      FROM rag_documents 
      WHERE id = ?
    `).bind(policyId).first();
    
    if (!policy) {
      return c.html(html`<div class="text-red-600">Policy not found</div>`);
    }
    
    return c.html(html`
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-start justify-between mb-4">
          <div>
            <h2 class="text-xl font-bold text-gray-900">${policy.title}</h2>
            <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span><i class="fas fa-tag mr-1"></i>${policy.document_type}</span>
              <span><i class="fas fa-calendar mr-1"></i>${new Date(policy.created_at).toLocaleDateString()}</span>
              <span><i class="fas fa-file-alt mr-1"></i>${policy.content.length} chars</span>
            </div>
          </div>
          <button onclick="this.parentElement.parentElement.parentElement.remove()"
                  class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="prose max-w-none">
          <pre class="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">${policy.content}</pre>
        </div>
        
        ${policy.metadata && policy.metadata !== '{}' ? html`
          <div class="mt-4 pt-4 border-t">
            <h3 class="text-sm font-semibold text-gray-900 mb-2">Metadata</h3>
            <pre class="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-auto">${policy.metadata}</pre>
          </div>
        ` : ''}
      </div>
    `);
  });
  
  return app;
}

// Helper function to generate policies list HTML
function generatePoliciesList(policies: any[]) {
  if (policies.length === 0) {
    return html`
      <div class="bg-white rounded-lg shadow p-8 text-center">
        <div class="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <i class="fas fa-file-alt text-gray-400 text-xl"></i>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No Policies Found</h3>
        <p class="text-gray-600 mb-4">No policies match your search criteria.</p>
        <button hx-get="/policies/list" 
                hx-target="#policies-list"
                class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Show All Policies
        </button>
      </div>
    `;
  }
  
  return html`
    <div class="bg-white rounded-lg shadow">
      <div class="px-6 py-4 border-b">
        <h2 class="text-lg font-semibold text-gray-900">
          <i class="fas fa-list text-blue-600 mr-2"></i>
          Policies & Documents (${policies.length})
        </h2>
      </div>
      
      <div class="divide-y">
        ${policies.map(policy => html`
          <div class="px-6 py-4 hover:bg-gray-50">
            <div class="flex items-center justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center space-x-3">
                  <div class="flex-shrink-0">
                    <div class="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <i class="fas ${getDocumentTypeIcon(policy.document_type)} text-blue-600"></i>
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="text-sm font-medium text-gray-900 truncate">
                      ${policy.title}
                    </h3>
                    <div class="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span class="capitalize">
                        <i class="fas fa-tag mr-1"></i>
                        ${policy.document_type}
                      </span>
                      <span>
                        <i class="fas fa-file-alt mr-1"></i>
                        ${policy.content_length} chars
                      </span>
                      <span>
                        <i class="fas fa-calendar mr-1"></i>
                        ${new Date(policy.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="flex items-center space-x-2">
                <button hx-get="/policies/view/${policy.id}" 
                        hx-target="#policies-list" 
                        hx-swap="afterbegin"
                        class="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                  <i class="fas fa-eye mr-1"></i>
                  View
                </button>
                <button onclick="confirmDeletePolicy('${policy.id}', '${policy.title}')"
                        class="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">
                  <i class="fas fa-trash mr-1"></i>
                  Delete
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function getDocumentTypeIcon(documentType: string): string {
  const icons: { [key: string]: string } = {
    'policy': 'fa-shield-alt',
    'plan': 'fa-clipboard-list',
    'procedure': 'fa-cogs',
    'standard': 'fa-award',
    'guidance': 'fa-compass',
    'framework': 'fa-sitemap'
  };
  return icons[documentType] || 'fa-file-alt';
}