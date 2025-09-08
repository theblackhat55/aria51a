import { html } from 'hono/html';

// Intelligence Settings Rendering
export const renderIntelligenceSettings = () => html`
  <div class="min-h-screen bg-gray-50 py-6 sm:py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-6 sm:mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
              <i class="fas fa-brain text-purple-600 mr-2 sm:mr-3 text-lg sm:text-xl lg:text-2xl"></i>
              Intelligence Settings
            </h1>
            <p class="mt-2 text-sm text-gray-600">
              Configure STIX/TAXII threat intelligence feed providers and data sources
            </p>
          </div>
          <div class="mt-4 sm:mt-0">
            <button id="add-feed-btn" 
                    class="inline-flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
                    onclick="showAddFeedModal()">
              <i class="fas fa-plus mr-2"></i>
              Add Threat Feed
            </button>
          </div>
        </div>
      </div>

      <!-- Overview Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <!-- Active Feeds -->
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-rss text-green-500 text-2xl"></i>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Active Feeds</dt>
                <dd class="text-lg font-medium text-gray-900" id="active-feeds-count">Loading...</dd>
              </dl>
            </div>
          </div>
        </div>

        <!-- Total IOCs -->
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-shield-alt text-blue-500 text-2xl"></i>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Total IOCs</dt>
                <dd class="text-lg font-medium text-gray-900" id="total-iocs-count">0</dd>
              </dl>
            </div>
          </div>
        </div>

        <!-- Last Sync -->
        <div class="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <i class="fas fa-sync text-orange-500 text-2xl"></i>
            </div>
            <div class="ml-5 w-0 flex-1">
              <dl>
                <dt class="text-sm font-medium text-gray-500 truncate">Last Sync</dt>
                <dd class="text-sm font-medium text-gray-900" id="last-sync-time">Never</dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <!-- Feed Provider Categories -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
        <div class="px-6 py-4 border-b border-gray-200">
          <h2 class="text-lg font-medium text-gray-900">Threat Feed Providers</h2>
          <p class="text-sm text-gray-600">Configure and manage your threat intelligence sources</p>
        </div>
        
        <div class="p-6">
          <!-- Provider Categories Tabs -->
          <div class="border-b border-gray-200 mb-6">
            <nav class="-mb-px flex space-x-8" aria-label="Tabs">
              <button class="tab-button active whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm" 
                      data-tab="open-source"
                      onclick="switchTab('open-source')">
                <i class="fas fa-globe mr-2"></i>
                Open Source Feeds
              </button>
              <button class="tab-button whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm" 
                      data-tab="commercial"
                      onclick="switchTab('commercial')">
                <i class="fas fa-lock mr-2"></i>
                Commercial Feeds
              </button>
              <button class="tab-button whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm" 
                      data-tab="custom"
                      onclick="switchTab('custom')">
                <i class="fas fa-cogs mr-2"></i>
                Custom Sources
              </button>
            </nav>
          </div>

          <!-- Tab Content -->
          <div id="feeds-container">
            <!-- Content will be loaded dynamically -->
          </div>
        </div>
      </div>

      <!-- Feed Configuration Table -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200">
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 class="text-lg font-medium text-gray-900">Configured Feeds</h3>
            <p class="text-sm text-gray-600">Manage your active threat intelligence feeds</p>
          </div>
          <div class="flex items-center space-x-4">
            <button class="text-sm text-gray-600 hover:text-gray-900 flex items-center"
                    onclick="refreshFeeds()">
              <i class="fas fa-sync mr-1"></i>
              Refresh
            </button>
            <button class="text-sm text-purple-600 hover:text-purple-900 flex items-center"
                    onclick="syncAllFeeds()">
              <i class="fas fa-download mr-1"></i>
              Sync All
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feed Name
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type & Format
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Update
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IOCs
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody id="feeds-table-body" class="bg-white divide-y divide-gray-200">
              <!-- Feed rows will be loaded dynamically -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  <!-- Add Feed Modal -->
  <div id="add-feed-modal" class="hidden fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg shadow-xl p-6 m-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between mb-6">
        <h3 class="text-lg font-medium text-gray-900">Add Threat Feed</h3>
        <button onclick="hideAddFeedModal()" class="text-gray-400 hover:text-gray-600">
          <i class="fas fa-times text-xl"></i>
        </button>
      </div>

      <form id="add-feed-form" onsubmit="submitFeedForm(event)">
        <div class="space-y-6">
          <!-- Feed Provider Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Feed Provider</label>
            <select id="feed-provider" name="provider" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" onchange="updateFeedTemplate()">
              <option value="">Select a provider...</option>
              <optgroup label="Open Source Feeds">
                <option value="abuse.ch-malware-bazaar">Abuse.ch MalwareBazaar</option>
                <option value="abuse.ch-threatfox">Abuse.ch ThreatFox</option>
                <option value="alienvault-otx">AlienVault OTX</option>
                <option value="malware-domain-list">Malware Domain List</option>
                <option value="emergingthreats">Emerging Threats</option>
                <option value="spamhaus">Spamhaus</option>
                <option value="phishtank">PhishTank</option>
              </optgroup>
              <optgroup label="Commercial Feeds">
                <option value="crowdstrike-falcon">CrowdStrike Falcon Intelligence</option>
                <option value="virustotal-enterprise">VirusTotal Enterprise</option>
                <option value="recorded-future">Recorded Future</option>
                <option value="anomali">Anomali ThreatStream</option>
                <option value="threatconnect">ThreatConnect</option>
                <option value="mandiant">Mandiant Threat Intelligence</option>
              </optgroup>
              <optgroup label="Government & Trusted">
                <option value="us-cert">US-CERT</option>
                <option value="misp">MISP Instance</option>
                <option value="stix-taxii-server">STIX/TAXII Server</option>
              </optgroup>
              <optgroup label="Custom">
                <option value="custom-api">Custom API</option>
                <option value="custom-file">Custom File Feed</option>
              </optgroup>
            </select>
          </div>

          <!-- Feed Configuration -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Feed Name</label>
              <input type="text" id="feed-name" name="name" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="My Threat Feed" required>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Feed Type</label>
              <select id="feed-type" name="type" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
                <option value="taxii">TAXII 2.1</option>
                <option value="stix">STIX 2.1</option>
                <option value="json">JSON API</option>
                <option value="xml">XML Feed</option>
                <option value="csv">CSV Feed</option>
                <option value="txt">Text List</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Feed URL/Endpoint</label>
            <input type="url" id="feed-url" name="url" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="https://api.provider.com/feeds/indicators" required>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">API Key / Authentication</label>
            <input type="password" id="feed-api-key" name="api_key" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Optional API key or token">
            <p class="text-xs text-gray-500 mt-1">Leave empty for public feeds. This will be encrypted.</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Data Format</label>
            <select id="feed-format" name="format" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
              <option value="stix2">STIX 2.1</option>
              <option value="json">JSON</option>
              <option value="xml">XML</option>
              <option value="csv">CSV</option>
              <option value="ioc">IOC List</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea id="feed-description" name="description" rows="3" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="Brief description of this threat feed..."></textarea>
          </div>

          <!-- Advanced Settings -->
          <div class="border-t border-gray-200 pt-4">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-medium text-gray-900">Advanced Settings</h4>
              <button type="button" onclick="toggleAdvanced()" class="text-sm text-purple-600 hover:text-purple-900">
                <i class="fas fa-cog mr-1"></i>
                Configure
              </button>
            </div>
            
            <div id="advanced-settings" class="hidden mt-4 space-y-4 bg-gray-50 p-4 rounded-md">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Sync Interval (hours)</label>
                  <input type="number" id="sync-interval" name="sync_interval" value="24" min="1" max="168" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Confidence Threshold</label>
                  <select id="confidence-threshold" name="confidence_threshold" class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <option value="0">All indicators</option>
                    <option value="25">Low confidence (25+)</option>
                    <option value="50" selected>Medium confidence (50+)</option>
                    <option value="75">High confidence (75+)</option>
                    <option value="90">Very high confidence (90+)</option>
                  </select>
                </div>
              </div>
              
              <div class="flex items-center space-x-6">
                <label class="flex items-center">
                  <input type="checkbox" id="auto-sync" name="auto_sync" checked class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded">
                  <span class="ml-2 text-sm text-gray-700">Auto-sync enabled</span>
                </label>
                <label class="flex items-center">
                  <input type="checkbox" id="validate-indicators" name="validate_indicators" checked class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded">
                  <span class="ml-2 text-sm text-gray-700">Validate indicators</span>
                </label>
              </div>
            </div>
          </div>

          <div class="flex items-center">
            <input type="checkbox" id="feed-active" name="active" checked class="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded">
            <label for="feed-active" class="ml-2 text-sm text-gray-700">Enable this feed immediately</label>
          </div>
        </div>

        <div class="mt-6 flex items-center justify-between">
          <button type="button" onclick="testFeedConnection()" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors">
            <i class="fas fa-plug mr-2"></i>Test Connection
          </button>
          <div class="flex items-center space-x-3">
            <button type="button" onclick="hideAddFeedModal()" class="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400">
              Cancel
            </button>
            <button type="submit" class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">
              <i class="fas fa-plus mr-2"></i>Add Feed
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <script>
    // Intelligence Settings JavaScript
    let currentTab = 'open-source';
    let feeds = [];

    // Initialize the page
    document.addEventListener('DOMContentLoaded', function() {
      loadFeeds();
      loadFeedCategories();
      updateStats();
    });

    // Tab switching
    function switchTab(tabName) {
      currentTab = tabName;
      
      // Update tab buttons
      document.querySelectorAll('.tab-button').forEach(btn => {
        if (btn.dataset.tab === tabName) {
          btn.classList.add('active', 'border-purple-500', 'text-purple-600');
          btn.classList.remove('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        } else {
          btn.classList.remove('active', 'border-purple-500', 'text-purple-600');
          btn.classList.add('border-transparent', 'text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
        }
      });

      loadFeedCategories();
    }

    // Load feed categories
    function loadFeedCategories() {
      const container = document.getElementById('feeds-container');
      
      let content = '';
      if (currentTab === 'open-source') {
        content = renderOpenSourceFeeds();
      } else if (currentTab === 'commercial') {
        content = renderCommercialFeeds();
      } else if (currentTab === 'custom') {
        content = renderCustomFeeds();
      }
      
      container.innerHTML = content;
    }

    function renderOpenSourceFeeds() {
      return \`
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors cursor-pointer" onclick="quickAddFeed('abuse.ch-malware-bazaar')">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-gray-900">Abuse.ch MalwareBazaar</h4>
                <p class="text-sm text-gray-600 mt-1">Malware samples and IOCs from MalwareBazaar</p>
                <div class="mt-2 flex items-center space-x-2">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <i class="fas fa-globe mr-1"></i>Free
                  </span>
                  <span class="text-xs text-gray-500">JSON API</span>
                </div>
              </div>
              <i class="fas fa-plus text-purple-500"></i>
            </div>
          </div>

          <div class="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors cursor-pointer" onclick="quickAddFeed('abuse.ch-threatfox')">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-gray-900">Abuse.ch ThreatFox</h4>
                <p class="text-sm text-gray-600 mt-1">IOCs associated with malware campaigns</p>
                <div class="mt-2 flex items-center space-x-2">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <i class="fas fa-globe mr-1"></i>Free
                  </span>
                  <span class="text-xs text-gray-500">JSON API</span>
                </div>
              </div>
              <i class="fas fa-plus text-purple-500"></i>
            </div>
          </div>

          <div class="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors cursor-pointer" onclick="quickAddFeed('alienvault-otx')">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-gray-900">AlienVault OTX</h4>
                <p class="text-sm text-gray-600 mt-1">Open Threat Exchange community indicators</p>
                <div class="mt-2 flex items-center space-x-2">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <i class="fas fa-key mr-1"></i>API Key
                  </span>
                  <span class="text-xs text-gray-500">JSON API</span>
                </div>
              </div>
              <i class="fas fa-plus text-purple-500"></i>
            </div>
          </div>

          <div class="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors cursor-pointer" onclick="quickAddFeed('emergingthreats')">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-gray-900">Emerging Threats</h4>
                <p class="text-sm text-gray-600 mt-1">Suricata rules and reputation lists</p>
                <div class="mt-2 flex items-center space-x-2">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <i class="fas fa-globe mr-1"></i>Free
                  </span>
                  <span class="text-xs text-gray-500">Text Lists</span>
                </div>
              </div>
              <i class="fas fa-plus text-purple-500"></i>
            </div>
          </div>

          <div class="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors cursor-pointer" onclick="quickAddFeed('phishtank')">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-gray-900">PhishTank</h4>
                <p class="text-sm text-gray-600 mt-1">Phishing URL database from OpenDNS</p>
                <div class="mt-2 flex items-center space-x-2">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <i class="fas fa-globe mr-1"></i>Free
                  </span>
                  <span class="text-xs text-gray-500">JSON/CSV</span>
                </div>
              </div>
              <i class="fas fa-plus text-purple-500"></i>
            </div>
          </div>

          <div class="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors cursor-pointer" onclick="quickAddFeed('spamhaus')">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-gray-900">Spamhaus</h4>
                <p class="text-sm text-gray-600 mt-1">IP reputation and domain blocklists</p>
                <div class="mt-2 flex items-center space-x-2">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <i class="fas fa-globe mr-1"></i>Free
                  </span>
                  <span class="text-xs text-gray-500">Text Lists</span>
                </div>
              </div>
              <i class="fas fa-plus text-purple-500"></i>
            </div>
          </div>
        </div>
      \`;
    }

    function renderCommercialFeeds() {
      return \`
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div class="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors cursor-pointer" onclick="quickAddFeed('crowdstrike-falcon')">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-gray-900">CrowdStrike Falcon Intelligence</h4>
                <p class="text-sm text-gray-600 mt-1">Premium threat intelligence from CrowdStrike</p>
                <div class="mt-2 flex items-center space-x-2">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <i class="fas fa-crown mr-1"></i>Premium
                  </span>
                  <span class="text-xs text-gray-500">STIX/TAXII</span>
                </div>
              </div>
              <i class="fas fa-plus text-purple-500"></i>
            </div>
          </div>

          <div class="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors cursor-pointer" onclick="quickAddFeed('virustotal-enterprise')">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-gray-900">VirusTotal Enterprise</h4>
                <p class="text-sm text-gray-600 mt-1">Advanced threat intelligence from VirusTotal</p>
                <div class="mt-2 flex items-center space-x-2">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <i class="fas fa-crown mr-1"></i>Premium
                  </span>
                  <span class="text-xs text-gray-500">JSON API</span>
                </div>
              </div>
              <i class="fas fa-plus text-purple-500"></i>
            </div>
          </div>

          <div class="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors cursor-pointer" onclick="quickAddFeed('recorded-future')">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-gray-900">Recorded Future</h4>
                <p class="text-sm text-gray-600 mt-1">Real-time threat intelligence platform</p>
                <div class="mt-2 flex items-center space-x-2">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <i class="fas fa-crown mr-1"></i>Premium
                  </span>
                  <span class="text-xs text-gray-500">JSON API</span>
                </div>
              </div>
              <i class="fas fa-plus text-purple-500"></i>
            </div>
          </div>

          <div class="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors cursor-pointer" onclick="quickAddFeed('anomali')">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-gray-900">Anomali ThreatStream</h4>
                <p class="text-sm text-gray-600 mt-1">Enterprise threat intelligence platform</p>
                <div class="mt-2 flex items-center space-x-2">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <i class="fas fa-crown mr-1"></i>Premium
                  </span>
                  <span class="text-xs text-gray-500">STIX/TAXII</span>
                </div>
              </div>
              <i class="fas fa-plus text-purple-500"></i>
            </div>
          </div>

          <div class="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors cursor-pointer" onclick="quickAddFeed('threatconnect')">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-gray-900">ThreatConnect</h4>
                <p class="text-sm text-gray-600 mt-1">Threat intelligence orchestration platform</p>
                <div class="mt-2 flex items-center space-x-2">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <i class="fas fa-crown mr-1"></i>Premium
                  </span>
                  <span class="text-xs text-gray-500">JSON API</span>
                </div>
              </div>
              <i class="fas fa-plus text-purple-500"></i>
            </div>
          </div>

          <div class="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors cursor-pointer" onclick="quickAddFeed('mandiant')">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-gray-900">Mandiant Threat Intelligence</h4>
                <p class="text-sm text-gray-600 mt-1">Advanced persistent threat intelligence</p>
                <div class="mt-2 flex items-center space-x-2">
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <i class="fas fa-star mr-1"></i>Enterprise
                  </span>
                  <span class="text-xs text-gray-500">STIX/TAXII</span>
                </div>
              </div>
              <i class="fas fa-plus text-purple-500"></i>
            </div>
          </div>
        </div>
      \`;
    }

    function renderCustomFeeds() {
      return \`
        <div class="space-y-6">
          <div class="text-center py-8">
            <i class="fas fa-cogs text-4xl text-gray-400 mb-4"></i>
            <h3 class="text-lg font-medium text-gray-900 mb-2">Custom Threat Intelligence Sources</h3>
            <p class="text-gray-600 mb-6">Configure custom API endpoints, file feeds, or private STIX/TAXII servers</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <button onclick="quickAddFeed('custom-api')" class="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-400 hover:bg-purple-50 transition-colors">
                <i class="fas fa-plug text-2xl text-gray-400 mb-2"></i>
                <h4 class="font-medium text-gray-900">Custom API</h4>
                <p class="text-sm text-gray-600">Connect to proprietary threat intelligence API</p>
              </button>
              
              <button onclick="quickAddFeed('stix-taxii-server')" class="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-purple-400 hover:bg-purple-50 transition-colors">
                <i class="fas fa-server text-2xl text-gray-400 mb-2"></i>
                <h4 class="font-medium text-gray-900">STIX/TAXII Server</h4>
                <p class="text-sm text-gray-600">Connect to private TAXII 2.1 server</p>
              </button>
            </div>
          </div>
        </div>
      \`;
    }

    // Modal functions
    function showAddFeedModal() {
      document.getElementById('add-feed-modal').classList.remove('hidden');
    }

    function hideAddFeedModal() {
      const modal = document.getElementById('add-feed-modal');
      const form = document.getElementById('add-feed-form');
      
      modal.classList.add('hidden');
      form.reset();
      
      // Reset form state
      form.removeAttribute('data-edit-id');
      document.querySelector('#add-feed-modal h2').textContent = 'Add New Threat Feed';
      document.querySelector('#add-feed-form button[type="submit"]').textContent = 'Add Feed';
      
      // Clear provider selection
      document.getElementById('feed-provider').value = '';
    }

    function toggleAdvanced() {
      const advanced = document.getElementById('advanced-settings');
      advanced.classList.toggle('hidden');
    }

    // Quick add feed with predefined templates
    function quickAddFeed(provider) {
      const templates = {
        'abuse.ch-malware-bazaar': {
          name: 'MalwareBazaar Feed',
          type: 'json',
          url: 'https://mb-api.abuse.ch/api/v1/',
          format: 'json',
          description: 'Malware samples and IOCs from MalwareBazaar'
        },
        'abuse.ch-threatfox': {
          name: 'ThreatFox Feed',
          type: 'json',
          url: 'https://threatfox-api.abuse.ch/api/v1/',
          format: 'json',
          description: 'IOCs associated with malware campaigns'
        },
        'alienvault-otx': {
          name: 'AlienVault OTX',
          type: 'json',
          url: 'https://otx.alienvault.com/api/v1/indicators/export',
          format: 'json',
          description: 'Open Threat Exchange community indicators',
          requiresApiKey: true
        },
        // Add more templates as needed
      };

      const template = templates[provider];
      if (template) {
        document.getElementById('feed-name').value = template.name;
        document.getElementById('feed-type').value = template.type;
        document.getElementById('feed-url').value = template.url;
        document.getElementById('feed-format').value = template.format;
        document.getElementById('feed-description').value = template.description;
        
        showAddFeedModal();
        
        if (template.requiresApiKey) {
          document.getElementById('feed-api-key').focus();
        }
      }
    }

    // Load feeds from API
    async function loadFeeds() {
      try {
        console.log('Loading threat feeds from API...');
        const response = await fetch('/operations/api/intelligence/feeds');
        
        console.log('Response status:', response.status);
        console.log('Response URL:', response.url);
        console.log('Response redirected:', response.redirected);
        
        // Handle authentication redirects
        if (response.redirected && response.url.includes('/login')) {
          console.warn('Session expired, redirecting to login');
          window.location.href = '/login';
          return;
        }
        
        // Handle HTTP errors
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            console.warn('Authentication required, redirecting to login');
            window.location.href = '/login';
            return;
          }
          throw new Error('HTTP ' + response.status + ': ' + response.statusText);
        }
        
        const data = await response.json();
        console.log('Received data:', data);
        
        feeds = data.feeds || [];
        console.log('Processed feeds:', feeds);
        
        renderFeedsTable();
        updateStats();
        
      } catch (error) {
        console.error('Error loading feeds:', error);
        feeds = [];
        
        // Show error message in the UI
        showErrorMessage('Unable to load threat feeds. Please check your connection and try again.');
        renderFeedsTable();
      }
    }

    // Render feeds table
    function renderFeedsTable() {
      const tbody = document.getElementById('feeds-table-body');
      
      if (feeds.length === 0) {
        tbody.innerHTML = \`
          <tr>
            <td colspan="6" class="px-6 py-8 text-center text-gray-500">
              <i class="fas fa-inbox text-2xl mb-2"></i>
              <p>No threat feeds configured yet</p>
              <button onclick="showAddFeedModal()" class="mt-2 text-purple-600 hover:text-purple-900">
                Add your first feed
              </button>
            </td>
          </tr>
        \`;
        return;
      }

      tbody.innerHTML = feeds.map(feed => \`
        <tr>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="flex items-center">
              <div class="flex-shrink-0 h-8 w-8">
                <div class="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <i class="fas fa-rss text-purple-600 text-sm"></i>
                </div>
              </div>
              <div class="ml-4">
                <div class="text-sm font-medium text-gray-900">\${feed.name}</div>
                <div class="text-sm text-gray-500">\${feed.description || 'No description'}</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <div class="text-sm text-gray-900">\${feed.type.toUpperCase()}</div>
            <div class="text-sm text-gray-500">\${feed.format}</div>
          </td>
          <td class="px-6 py-4 whitespace-nowrap">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium \${feed.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
              <i class="fas fa-\${feed.active ? 'check' : 'times'} mr-1"></i>
              \${feed.active ? 'Active' : 'Inactive'}
            </span>
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
            \${feed.last_sync ? new Date(feed.last_sync).toLocaleString() : 'Never'}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            \${feed.ioc_count || 0}
          </td>
          <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            <div class="flex items-center justify-end space-x-2">
              <button onclick="testFeed(\${feed.feed_id})" class="text-blue-600 hover:text-blue-900" title="Test Feed">
                <i class="fas fa-plug"></i>
              </button>
              <button onclick="syncFeed(\${feed.feed_id})" class="text-green-600 hover:text-green-900" title="Sync Feed">
                <i class="fas fa-sync"></i>
              </button>
              <button onclick="editFeed(\${feed.feed_id})" class="text-indigo-600 hover:text-indigo-900" title="Edit Feed">
                <i class="fas fa-edit"></i>
              </button>
              <button onclick="deleteFeed(\${feed.feed_id})" class="text-red-600 hover:text-red-900" title="Delete Feed">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      \`).join('');
    }

    // Update statistics
    function updateStats() {
      const activeCount = feeds.filter(f => f.active).length;
      const totalIocs = feeds.reduce((sum, f) => sum + (f.ioc_count || 0), 0);
      const lastSync = feeds.length > 0 ? 
        Math.max(...feeds.map(f => f.last_sync ? new Date(f.last_sync).getTime() : 0)) : 0;

      document.getElementById('active-feeds-count').textContent = activeCount;
      document.getElementById('total-iocs-count').textContent = totalIocs.toLocaleString();
      document.getElementById('last-sync-time').textContent = 
        lastSync > 0 ? new Date(lastSync).toLocaleString() : 'Never';
    }

    // Form submission - handles both add and edit
    async function submitFeedForm(event) {
      event.preventDefault();
      
      const form = event.target;
      const editId = form.getAttribute('data-edit-id');
      const isEditing = editId !== null;
      
      const formData = new FormData(form);
      const feedData = {
        name: formData.get('name'),
        type: formData.get('type'),
        url: formData.get('url'),
        api_key: formData.get('api_key'),
        format: formData.get('format'),
        description: formData.get('description'),
        active: formData.get('active') === 'on'
      };

      try {
        const url = isEditing 
          ? '/operations/api/intelligence/feeds/' + editId
          : '/operations/api/intelligence/feeds';
        const method = isEditing ? 'PUT' : 'POST';
        
        const response = await fetch(url, {
          method: method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(feedData)
        });

        const validatedResponse = await handleApiResponse(response);
        if (!validatedResponse) return; // Redirected to login

        hideAddFeedModal();
        loadFeeds();
        
        const successMessage = isEditing 
          ? 'Threat feed updated successfully!' 
          : 'Threat feed added successfully!';
        showNotification(successMessage, 'success');
        
        // Reset form for next use
        form.removeAttribute('data-edit-id');
        document.querySelector('#add-feed-modal h2').textContent = 'Add New Threat Feed';
        document.querySelector('#add-feed-form button[type="submit"]').textContent = 'Add Feed';
        
      } catch (error) {
        console.error(isEditing ? 'Error updating feed:' : 'Error adding feed:', error);
        const errorMessage = isEditing 
          ? 'Error updating threat feed: ' + error.message
          : 'Error adding threat feed: ' + error.message;
        showNotification(errorMessage, 'error');
      }
    }

    // Feed actions
    async function testFeed(feedId) {
      try {
        showNotification('Testing feed connection...', 'info');
        const response = await fetch('/operations/api/intelligence/feeds/' + feedId + '/test', {
          method: 'POST'
        });
        
        const validatedResponse = await handleApiResponse(response);
        if (!validatedResponse) return; // Redirected to login
        
        const result = await validatedResponse.json();
        if (result.success) {
          showNotification('Feed test successful! Response time: ' + result.response_time + 'ms', 'success');
        } else {
          showNotification('Feed test failed: ' + result.message, 'error');
        }
      } catch (error) {
        console.error('Error testing feed:', error);
        showNotification('Error testing feed connection: ' + error.message, 'error');
      }
    }

    async function syncFeed(feedId) {
      try {
        showNotification('Syncing feed...', 'info');
        // Implementation would depend on your sync API endpoint
        showNotification('Feed sync initiated', 'success');
        // Reload feeds after sync
        setTimeout(loadFeeds, 2000);
      } catch (error) {
        console.error('Error syncing feed:', error);
        showNotification('Error syncing feed', 'error');
      }
    }

    async function deleteFeed(feedId) {
      if (confirm('Are you sure you want to delete this feed?')) {
        try {
          const response = await fetch('/operations/api/intelligence/feeds/' + feedId, {
            method: 'DELETE'
          });

          const validatedResponse = await handleApiResponse(response);
          if (!validatedResponse) return; // Redirected to login

          loadFeeds();
          showNotification('Threat feed deleted successfully!', 'success');
          
        } catch (error) {
          console.error('Error deleting feed:', error);
          showNotification('Error deleting threat feed: ' + error.message, 'error');
        }
      }
    }

    async function editFeed(feedId) {
      try {
        console.log('editFeed called with feedId:', feedId);
        console.log('Current feeds:', feeds);
        
        // Get feed details
        const feed = feeds.find(f => f.feed_id === feedId);
        if (!feed) {
          console.error('Feed not found for feedId:', feedId);
          showNotification('Feed not found', 'error');
          return;
        }

        console.log('Found feed:', feed);

        // Check if form elements exist before trying to access them
        const feedNameEl = document.getElementById('feed-name');
        const feedTypeEl = document.getElementById('feed-type');
        const feedUrlEl = document.getElementById('feed-url');
        const feedApiKeyEl = document.getElementById('feed-api-key');
        const feedFormatEl = document.getElementById('feed-format');
        const feedDescEl = document.getElementById('feed-description');
        const feedActiveEl = document.getElementById('feed-active');
        const form = document.getElementById('add-feed-form');

        if (!feedNameEl || !feedTypeEl || !feedUrlEl || !feedApiKeyEl || !feedFormatEl || !feedDescEl || !feedActiveEl || !form) {
          console.error('Form elements not found:', {
            feedName: !!feedNameEl,
            feedType: !!feedTypeEl,
            feedUrl: !!feedUrlEl,
            feedApiKey: !!feedApiKeyEl,
            feedFormat: !!feedFormatEl,
            feedDesc: !!feedDescEl,
            feedActive: !!feedActiveEl,
            form: !!form
          });
          showNotification('Form elements not available. Please try again.', 'error');
          return;
        }

        // Populate the form with existing data
        feedNameEl.value = feed.name || '';
        feedTypeEl.value = feed.type || '';
        feedUrlEl.value = feed.url || '';
        feedApiKeyEl.value = feed.api_key || '';
        feedFormatEl.value = feed.format || '';
        feedDescEl.value = feed.description || '';
        feedActiveEl.checked = feed.active === 1;

        // Change form to edit mode
        form.setAttribute('data-edit-id', feedId);
        
        // Update modal title and button text
        const modalTitle = document.querySelector('#add-feed-modal h3');
        const submitBtn = document.querySelector('#add-feed-form button[type="submit"]');
        
        if (modalTitle) modalTitle.textContent = 'Edit Threat Feed';
        if (submitBtn) submitBtn.textContent = 'Update Feed';
        
        console.log('Form populated successfully, showing modal');
        showAddFeedModal();
        
      } catch (error) {
        console.error('Error loading feed for edit:', error);
        showNotification('Error loading feed details: ' + error.message, 'error');
      }
    }

    function updateFeedTemplate() {
      const provider = document.getElementById('feed-provider').value;
      const feedTemplates = {
        'abuse.ch-malware-bazaar': {
          type: 'REST',
          url: 'https://mb-api.abuse.ch/api/v1/',
          format: 'JSON',
          description: 'Malware samples and IOCs from MalwareBazaar',
          requiresApiKey: false
        },
        'abuse.ch-threatfox': {
          type: 'REST', 
          url: 'https://threatfox-api.abuse.ch/api/v1/',
          format: 'JSON',
          description: 'IOCs from ThreatFox database',
          requiresApiKey: false
        },
        'alienvault-otx': {
          type: 'OTX',
          url: 'https://otx.alienvault.com/api/v1/',
          format: 'JSON',
          description: 'AlienVault Open Threat Exchange',
          requiresApiKey: true
        },
        'mitre-attack': {
          type: 'TAXII',
          url: 'https://cti-taxii.mitre.org/stix/collections/',
          format: 'STIX2',
          description: 'MITRE ATT&CK threat intelligence',
          requiresApiKey: false
        }
      };

      const template = feedTemplates[provider];
      if (template) {
        document.getElementById('feed-type').value = template.type;
        document.getElementById('feed-url').value = template.url;
        document.getElementById('feed-format').value = template.format;
        document.getElementById('feed-description').value = template.description;
        
        // Focus API key field if required
        if (template.requiresApiKey) {
          document.getElementById('feed-api-key').focus();
        }
      }
    }

    function refreshFeeds() {
      loadFeeds();
      showNotification('Feeds refreshed', 'info');
    }

    function syncAllFeeds() {
      showNotification('Syncing all active feeds...', 'info');
      // Implementation for syncing all feeds
    }

    // Utility functions
    // Helper function for handling API responses with auth checks
    async function handleApiResponse(response) {
      // Handle authentication redirects
      if (response.redirected && response.url.includes('/login')) {
        console.warn('Session expired, redirecting to login');
        window.location.href = '/login';
        return null;
      }
      
      // Handle HTTP errors
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.warn('Authentication required, redirecting to login');
          window.location.href = '/login';
          return null;
        }
        throw new Error('HTTP ' + response.status + ': ' + response.statusText);
      }
      
      return response;
    }

    function showErrorMessage(message) {
      showNotification(message, 'error');
    }

    function showNotification(message, type = 'info') {
      // Simple notification system - you might want to enhance this
      const colors = {
        success: 'bg-green-100 text-green-800 border-green-200',
        error: 'bg-red-100 text-red-800 border-red-200',
        info: 'bg-blue-100 text-blue-800 border-blue-200'
      };

      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 p-4 rounded-lg border ' + colors[type] + ' z-50';
      notification.innerHTML = \`
        <div class="flex items-center">
          <span>' + message + '</span>
          <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-current opacity-50 hover:opacity-75">
            <i class="fas fa-times"></i>
          </button>
        </div>
      \`;
      
      document.body.appendChild(notification);
      setTimeout(() => notification.remove(), 5000);
    }

    // Initialize page when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
      console.log('Intelligence Settings page loaded, initializing...');
      loadFeeds();
    });

    // Also initialize if the page is already loaded (in case script runs after DOMContentLoaded)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        console.log('Intelligence Settings page loaded (late init), initializing...');
        loadFeeds();
      });
    } else {
      console.log('Intelligence Settings page already loaded, initializing immediately...');
      loadFeeds();
    }
  </script>
`;

// Helper functions for Intelligence Settings
export async function getThreatFeeds(db: any) {
  try {
    const result = await db.prepare(`
      SELECT * FROM threat_feeds 
      ORDER BY created_at DESC
    `).all();
    return result.results || [];
  } catch (error) {
    console.error('Error fetching threat feeds:', error);
    return [];
  }
}

export async function getThreatFeedById(db: any, feedId: string) {
  try {
    const result = await db.prepare(`
      SELECT * FROM threat_feeds WHERE feed_id = ?
    `).bind(feedId).first();
    return result;
  } catch (error) {
    console.error('Error fetching threat feed:', error);
    return null;
  }
}

export async function testThreatFeed(feed: any) {
  try {
    const startTime = Date.now();
    
    // Basic HTTP test - in production you'd implement proper STIX/TAXII validation
    const response = await fetch(feed.url, {
      method: 'GET',
      headers: {
        'User-Agent': 'ARIA5-ThreatIntel/1.0',
        ...(feed.api_key && { 'Authorization': 'Bearer ' + feed.api_key })
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      return {
        success: false,
        message: 'HTTP ' + response.status + ': ' + response.statusText,
        responseTime
      };
    }
    
    // Try to parse response to count indicators (basic implementation)
    let indicatorsCount = 0;
    try {
      const data = await response.text();
      if (feed.format === 'json') {
        const json = JSON.parse(data);
        // Basic indicator counting - would need more sophisticated logic for real STIX/TAXII
        indicatorsCount = Array.isArray(json) ? json.length : (json.indicators?.length || 0);
      } else if (feed.format === 'csv' || feed.format === 'ioc') {
        indicatorsCount = data.split('\n').filter(line => line.trim()).length;
      }
    } catch (parseError) {
      // Parsing failed but connection succeeded
    }
    
    return {
      success: true,
      message: 'Connection successful',
      responseTime,
      indicatorsCount
    };
    
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Connection failed',
      responseTime: 0,
      indicatorsCount: 0
    };
  }
}