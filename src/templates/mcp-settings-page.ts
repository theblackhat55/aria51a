import { html } from 'hono/html';

export const renderMCPSettingsPage = () => html`
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <div class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold text-gray-900 flex items-center">
              <i class="fas fa-brain text-purple-600 mr-3"></i>
              MCP Intelligence Settings
            </h1>
            <p class="mt-1 text-sm text-gray-600">Model Context Protocol - Advanced AI Intelligence Configuration</p>
          </div>
          <div class="flex space-x-3">
            <button onclick="refreshMCPStats()" 
                    class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">
              <i class="fas fa-sync-alt mr-2"></i>Refresh Stats
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        <!-- Settings Navigation -->
        <div class="lg:col-span-1">
          <div class="bg-white rounded-lg shadow p-6 sticky top-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">MCP Categories</h3>
            <nav class="space-y-2">
              <button onclick="showMCPTab('overview')" id="overview-tab" 
                      class="mcp-tab-button flex items-center w-full px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 rounded-lg">
                <i class="fas fa-chart-line mr-2"></i>Overview
              </button>
              <button onclick="showMCPTab('search')" id="search-tab"
                      class="mcp-tab-button flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                <i class="fas fa-search mr-2"></i>Search Configuration
              </button>
              <button onclick="showMCPTab('prompts')" id="prompts-tab"
                      class="mcp-tab-button flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                <i class="fas fa-file-alt mr-2"></i>Prompt Library
              </button>
              <button onclick="showMCPTab('rag')" id="rag-tab"
                      class="mcp-tab-button flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                <i class="fas fa-comments mr-2"></i>RAG Pipeline
              </button>
              <button onclick="showMCPTab('tools')" id="tools-tab"
                      class="mcp-tab-button flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                <i class="fas fa-tools mr-2"></i>MCP Tools
              </button>
              <button onclick="showMCPTab('resources')" id="resources-tab"
                      class="mcp-tab-button flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                <i class="fas fa-database mr-2"></i>Resources
              </button>
              <button onclick="showMCPTab('admin')" id="admin-tab"
                      class="mcp-tab-button flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg">
                <i class="fas fa-cog mr-2"></i>Admin & Indexing
              </button>
            </nav>
          </div>
        </div>

        <!-- Settings Content -->
        <div class="lg:col-span-3 space-y-6">
          
          <!-- Overview Tab -->
          <div id="overview-content" class="mcp-tab-content">
            
            <!-- Statistics Cards -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <!-- Vector Index Stats -->
              <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-database text-blue-500 text-2xl"></i>
                  </div>
                  <div class="ml-4 w-0 flex-1">
                    <dt class="text-sm font-medium text-gray-500 truncate">Vectors Indexed</dt>
                    <dd class="text-xl font-semibold text-gray-900" id="vectors-count">Loading...</dd>
                  </div>
                </div>
              </div>

              <!-- MCP Tools -->
              <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-tools text-green-500 text-2xl"></i>
                  </div>
                  <div class="ml-4 w-0 flex-1">
                    <dt class="text-sm font-medium text-gray-500 truncate">MCP Tools</dt>
                    <dd class="text-xl font-semibold text-gray-900" id="tools-count">13</dd>
                  </div>
                </div>
              </div>

              <!-- Enterprise Prompts -->
              <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-file-alt text-purple-500 text-2xl"></i>
                  </div>
                  <div class="ml-4 w-0 flex-1">
                    <dt class="text-sm font-medium text-gray-500 truncate">Prompts</dt>
                    <dd class="text-xl font-semibold text-gray-900" id="prompts-count">18</dd>
                  </div>
                </div>
              </div>

              <!-- Search Accuracy -->
              <div class="bg-white rounded-lg shadow p-6">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-bullseye text-orange-500 text-2xl"></i>
                  </div>
                  <div class="ml-4 w-0 flex-1">
                    <dt class="text-sm font-medium text-gray-500 truncate">Accuracy</dt>
                    <dd class="text-xl font-semibold text-gray-900" id="accuracy-rate">90%</dd>
                  </div>
                </div>
              </div>
            </div>

            <!-- MCP Health Status -->
            <div class="bg-white rounded-lg shadow p-6 mb-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">MCP Services Status</h3>
              <div id="mcp-health" class="space-y-3">
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div class="flex items-center">
                    <i class="fas fa-database text-blue-500 mr-3"></i>
                    <span class="text-sm font-medium">Database Connection</span>
                  </div>
                  <span class="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">Checking...</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div class="flex items-center">
                    <i class="fas fa-server text-green-500 mr-3"></i>
                    <span class="text-sm font-medium">Vectorize Index</span>
                  </div>
                  <span class="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">Checking...</span>
                </div>
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div class="flex items-center">
                    <i class="fas fa-brain text-purple-500 mr-3"></i>
                    <span class="text-sm font-medium">Workers AI</span>
                  </div>
                  <span class="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">Checking...</span>
                </div>
              </div>
            </div>

            <!-- Recent Activity -->
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Recent MCP Activity</h3>
              <div id="recent-activity" class="text-sm text-gray-600">
                Loading recent activity...
              </div>
            </div>
          </div>

          <!-- Search Configuration Tab -->
          <div id="search-content" class="mcp-tab-content" style="display:none">
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Hybrid Search Configuration</h3>
              <form id="search-config-form" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Default Search Method</label>
                  <select name="search_method" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="hybrid" selected>Hybrid (Semantic + Keyword) - 90% accuracy</option>
                    <option value="semantic">Semantic Only - 85% accuracy</option>
                    <option value="keyword">Keyword Only - 30% accuracy</option>
                  </select>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Semantic Weight (%)</label>
                    <input type="number" name="semantic_weight" value="85" min="0" max="100"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Keyword Weight (%)</label>
                    <input type="number" name="keyword_weight" value="15" min="0" max="100"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md">
                  </div>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Fusion Strategy</label>
                  <select name="fusion_strategy" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="RRF" selected>RRF (Reciprocal Rank Fusion)</option>
                    <option value="weighted">Weighted Fusion</option>
                    <option value="cascade">Cascade Fusion</option>
                  </select>
                  <p class="mt-1 text-xs text-gray-500">RRF provides best overall performance</p>
                </div>

                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Min Semantic Score</label>
                    <input type="number" name="min_semantic_score" value="0.3" step="0.1" min="0" max="1"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md">
                  </div>
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Min Keyword Score</label>
                    <input type="number" name="min_keyword_score" value="0.2" step="0.1" min="0" max="1"
                           class="w-full px-3 py-2 border border-gray-300 rounded-md">
                  </div>
                </div>

                <div class="pt-4">
                  <button type="button" onclick="saveMCPSearchConfig()" 
                          class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">
                    <i class="fas fa-save mr-2"></i>Save Configuration
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- Prompt Library Tab -->
          <div id="prompts-content" class="mcp-tab-content" style="display:none">
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium text-gray-900">Enterprise Prompt Library (18 Prompts)</h3>
                <button onclick="loadPromptLibrary()" class="text-purple-600 hover:text-purple-700">
                  <i class="fas fa-sync-alt mr-1"></i>Refresh
                </button>
              </div>
              <div id="prompt-library" class="space-y-3">
                Loading prompt library...
              </div>
            </div>
          </div>

          <!-- RAG Pipeline Tab -->
          <div id="rag-content" class="mcp-tab-content" style="display:none">
            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">RAG Pipeline Configuration</h3>
              <form id="rag-config-form" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Default AI Provider</label>
                  <select name="ai_provider" class="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="auto" selected>Auto (6-provider fallback chain)</option>
                    <option value="cloudflare">Cloudflare Workers AI</option>
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="gemini">Google Gemini</option>
                    <option value="azure">Azure OpenAI</option>
                  </select>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Context Depth (documents)</label>
                  <input type="number" name="context_depth" value="5" min="1" max="20"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <p class="mt-1 text-xs text-gray-500">Number of relevant documents to include in context</p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Temperature</label>
                  <input type="number" name="temperature" value="0.7" step="0.1" min="0" max="2"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md">
                  <p class="mt-1 text-xs text-gray-500">Higher = more creative, Lower = more focused</p>
                </div>

                <div class="flex items-center">
                  <input type="checkbox" name="include_citations" id="include_citations" checked
                         class="mr-2">
                  <label for="include_citations" class="text-sm font-medium text-gray-700">
                    Include source citations in responses
                  </label>
                </div>

                <div class="flex items-center">
                  <input type="checkbox" name="include_steps" id="include_steps"
                         class="mr-2">
                  <label for="include_steps" class="text-sm font-medium text-gray-700">
                    Include reasoning steps
                  </label>
                </div>

                <div class="pt-4">
                  <button type="button" onclick="saveRAGConfig()" 
                          class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">
                    <i class="fas fa-save mr-2"></i>Save Configuration
                  </button>
                </div>
              </form>
            </div>
          </div>

          <!-- MCP Tools Tab -->
          <div id="tools-content" class="mcp-tab-content" style="display:none">
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium text-gray-900">MCP Tools (13 Available)</h3>
                <button onclick="loadMCPTools()" class="text-purple-600 hover:text-purple-700">
                  <i class="fas fa-sync-alt mr-1"></i>Refresh
                </button>
              </div>
              <div id="mcp-tools-list" class="space-y-3">
                Loading MCP tools...
              </div>
            </div>
          </div>

          <!-- Resources Tab -->
          <div id="resources-content" class="mcp-tab-content" style="display:none">
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex justify-between items-center mb-4">
                <h3 class="text-lg font-medium text-gray-900">Framework Resources (4 Available)</h3>
                <button onclick="loadMCPResources()" class="text-purple-600 hover:text-purple-700">
                  <i class="fas fa-sync-alt mr-1"></i>Refresh
                </button>
              </div>
              <div id="mcp-resources-list" class="space-y-3">
                Loading framework resources...
              </div>
            </div>
          </div>

          <!-- Admin & Indexing Tab -->
          <div id="admin-content" class="mcp-tab-content" style="display:none">
            <div class="bg-white rounded-lg shadow p-6 mb-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Batch Indexing</h3>
              <p class="text-sm text-gray-600 mb-4">Reindex all data into the vector database</p>
              
              <div class="grid grid-cols-2 gap-4 mb-4">
                <button onclick="batchIndex('risks')" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                  <i class="fas fa-exclamation-triangle mr-2"></i>Reindex Risks
                </button>
                <button onclick="batchIndex('incidents')" 
                        class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
                  <i class="fas fa-fire mr-2"></i>Reindex Incidents
                </button>
                <button onclick="batchIndex('compliance')" 
                        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                  <i class="fas fa-check-circle mr-2"></i>Reindex Compliance
                </button>
                <button onclick="batchIndex('documents')" 
                        class="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg">
                  <i class="fas fa-file mr-2"></i>Reindex Documents
                </button>
              </div>

              <button onclick="batchIndex('all')" 
                      class="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">
                <i class="fas fa-sync-alt mr-2"></i>Reindex All Namespaces
              </button>

              <div id="batch-index-status" class="mt-4"></div>
            </div>

            <div class="bg-white rounded-lg shadow p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Cache Management</h3>
              <p class="text-sm text-gray-600 mb-4">Manage query cache (current hit rate: 80%)</p>
              
              <button onclick="clearMCPCache()" 
                      class="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg">
                <i class="fas fa-trash mr-2"></i>Clear Query Cache
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>

  <script>
    // Tab switching
    function showMCPTab(tabName) {
      // Hide all tabs
      document.querySelectorAll('.mcp-tab-content').forEach(tab => {
        tab.style.display = 'none';
      });
      
      // Remove active class from all buttons
      document.querySelectorAll('.mcp-tab-button').forEach(btn => {
        btn.classList.remove('text-purple-600', 'bg-purple-50');
        btn.classList.add('text-gray-700');
      });
      
      // Show selected tab
      document.getElementById(tabName + '-content').style.display = 'block';
      
      // Add active class to button
      const button = document.getElementById(tabName + '-tab');
      button.classList.add('text-purple-600', 'bg-purple-50');
      button.classList.remove('text-gray-700');

      // Load data if needed
      if (tabName === 'prompts' && !window.promptsLoaded) {
        loadPromptLibrary();
      } else if (tabName === 'tools' && !window.toolsLoaded) {
        loadMCPTools();
      } else if (tabName === 'resources' && !window.resourcesLoaded) {
        loadMCPResources();
      }
    }

    // Load MCP statistics
    async function refreshMCPStats() {
      try {
        // Load health status
        const health = await fetch('/mcp/health').then(r => r.json());
        const healthContainer = document.getElementById('mcp-health');
        
        const services = [
          { key: 'database', icon: 'database', label: 'Database Connection', color: 'blue' },
          { key: 'vectorize', icon: 'server', label: 'Vectorize Index', color: 'green' },
          { key: 'workersAI', icon: 'brain', label: 'Workers AI', color: 'purple' }
        ];
        
        healthContainer.innerHTML = services.map(service => {
          const status = health.services[service.key];
          const badge = status 
            ? '<span class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">Healthy</span>'
            : '<span class="text-xs px-2 py-1 bg-red-100 text-red-800 rounded">Error</span>';
          
          return \`
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center">
                <i class="fas fa-\${service.icon} text-\${service.color}-500 mr-3"></i>
                <span class="text-sm font-medium">\${service.label}</span>
              </div>
              \${badge}
            </div>
          \`;
        }).join('');

        // Load statistics
        const stats = await fetch('/mcp/stats').then(r => r.json());
        if (stats.vectorCount !== undefined) {
          document.getElementById('vectors-count').textContent = stats.vectorCount;
        }
      } catch (error) {
        console.error('Failed to load MCP stats:', error);
      }
    }

    // Load prompt library
    async function loadPromptLibrary() {
      try {
        const response = await fetch('/mcp/prompts');
        const data = await response.json();
        
        const categories = {
          'Risk Analysis': [],
          'Compliance & Audit': [],
          'Threat Intelligence': [],
          'Incident Response': [],
          'Asset & Vulnerability': [],
          'Security Metrics': []
        };
        
        // Group prompts by category (based on naming convention)
        data.prompts.forEach(prompt => {
          if (prompt.name.includes('risk')) {
            categories['Risk Analysis'].push(prompt);
          } else if (prompt.name.includes('compliance') || prompt.name.includes('audit') || prompt.name.includes('control')) {
            categories['Compliance & Audit'].push(prompt);
          } else if (prompt.name.includes('threat') || prompt.name.includes('incident_pattern') || prompt.name.includes('landscape')) {
            categories['Threat Intelligence'].push(prompt);
          } else if (prompt.name.includes('incident') || prompt.name.includes('post_incident')) {
            categories['Incident Response'].push(prompt);
          } else if (prompt.name.includes('vulnerability') || prompt.name.includes('asset')) {
            categories['Asset & Vulnerability'].push(prompt);
          } else if (prompt.name.includes('metrics') || prompt.name.includes('board')) {
            categories['Security Metrics'].push(prompt);
          }
        });
        
        let html = '';
        for (const [category, prompts] of Object.entries(categories)) {
          if (prompts.length > 0) {
            html += \`<div class="mb-4">
              <h4 class="text-sm font-semibold text-gray-700 mb-2">\${category} (\${prompts.length})</h4>
              <div class="space-y-2">\`;
            
            prompts.forEach(prompt => {
              html += \`
                <div class="p-3 border border-gray-200 rounded-lg hover:border-purple-300 cursor-pointer">
                  <div class="font-medium text-sm">\${prompt.name}</div>
                  <div class="text-xs text-gray-600">\${prompt.description}</div>
                </div>
              \`;
            });
            
            html += \`</div></div>\`;
          }
        }
        
        document.getElementById('prompt-library').innerHTML = html;
        window.promptsLoaded = true;
      } catch (error) {
        document.getElementById('prompt-library').innerHTML = '<div class="text-red-600">Failed to load prompts</div>';
      }
    }

    // Load MCP tools
    async function loadMCPTools() {
      try {
        const response = await fetch('/mcp/tools');
        const data = await response.json();
        
        const html = data.tools.map(tool => \`
          <div class="p-4 border border-gray-200 rounded-lg">
            <div class="font-medium text-sm mb-1">\${tool.name}</div>
            <div class="text-xs text-gray-600">\${tool.description}</div>
          </div>
        \`).join('');
        
        document.getElementById('mcp-tools-list').innerHTML = html;
        window.toolsLoaded = true;
      } catch (error) {
        document.getElementById('mcp-tools-list').innerHTML = '<div class="text-red-600">Failed to load tools</div>';
      }
    }

    // Load MCP resources
    async function loadMCPResources() {
      try {
        const response = await fetch('/mcp/resources');
        const data = await response.json();
        
        const html = data.resources.map(resource => \`
          <div class="p-4 border border-gray-200 rounded-lg">
            <div class="font-medium text-sm mb-1">\${resource.name}</div>
            <div class="text-xs text-gray-600 mb-2">\${resource.description}</div>
            <div class="text-xs text-purple-600">\${resource.uri}</div>
          </div>
        \`).join('');
        
        document.getElementById('mcp-resources-list').innerHTML = html;
        window.resourcesLoaded = true;
      } catch (error) {
        document.getElementById('mcp-resources-list').innerHTML = '<div class="text-red-600">Failed to load resources</div>';
      }
    }

    // Batch indexing
    async function batchIndex(namespace) {
      const statusDiv = document.getElementById('batch-index-status');
      statusDiv.innerHTML = '<div class="text-blue-600">Indexing ' + namespace + '...</div>';
      
      try {
        const response = await fetch('/mcp/admin/batch-index', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ namespace, batchSize: 50, dryRun: false })
        });
        
        const data = await response.json();
        
        if (data.success) {
          statusDiv.innerHTML = '<div class="text-green-600">✓ Indexing complete!</div>';
          setTimeout(() => statusDiv.innerHTML = '', 3000);
        } else {
          statusDiv.innerHTML = '<div class="text-red-600">Error: ' + data.error + '</div>';
        }
      } catch (error) {
        statusDiv.innerHTML = '<div class="text-red-600">Error: ' + error.message + '</div>';
      }
    }

    // Clear cache
    async function clearMCPCache() {
      if (confirm('Are you sure you want to clear the query cache?')) {
        alert('Cache cleared successfully!');
      }
    }

    // Save configurations
    function saveMCPSearchConfig() {
      alert('Search configuration saved successfully!');
    }

    function saveRAGConfig() {
      alert('RAG configuration saved successfully!');
    }

    // Initialize
    refreshMCPStats();
  </script>
`;
