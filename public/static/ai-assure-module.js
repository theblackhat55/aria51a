// AI Assure Module - Centralized AI Intelligence Hub
// Includes AI Heat Map, Gap Analysis, AI Dashboard, and AI Engine (formerly AI GRC Platform)

class AIAssureManager {
  constructor() {
    this.currentTab = 'ai-engine';
    this.isDirty = false;
  }

  async showAIAssure() {
    updateActiveNavigation('ai-assure');
    currentModule = 'ai-assure';
    
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `
      <div class="min-h-screen bg-gray-50">
        <!-- Mobile Header -->
        <div class="lg:hidden bg-white shadow-sm border-b border-gray-200 p-4">
          <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold text-gray-900">AI Assure</h1>
            <button id="mobile-ai-assure-menu" class="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <i class="fas fa-bars text-gray-600"></i>
            </button>
          </div>
        </div>

        <div class="flex flex-col lg:flex-row h-full">
          <!-- AI Assure Sidebar -->
          <div id="ai-assure-sidebar" class="lg:w-64 bg-white shadow-sm border-r border-gray-200 lg:block hidden">
            <div class="p-6">
              <h2 class="text-lg font-semibold text-gray-900 mb-4">AI Assure</h2>
              <nav class="space-y-2">
                <!-- Core AI Intelligence -->
                <div class="mb-4">
                  <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Core AI Systems</h3>
                  <button onclick="aiAssureManager.showTab('ai-engine')" 
                    id="tab-ai-engine" 
                    class="ai-assure-nav-item active w-full text-left flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200">
                    <i class="fas fa-brain text-indigo-600"></i>
                    <span>AI Engine</span>
                  </button>
                  <button onclick="aiAssureManager.showTab('ai-dashboard')" 
                    id="tab-ai-dashboard" 
                    class="ai-assure-nav-item w-full text-left flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200">
                    <i class="fas fa-robot text-purple-600"></i>
                    <span>AI Dashboard</span>
                  </button>
                </div>

                <!-- Risk Intelligence -->
                <div class="mb-4">
                  <h3 class="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Risk Intelligence</h3>
                  <button onclick="aiAssureManager.showTab('ai-heatmap')" 
                    id="tab-ai-heatmap" 
                    class="ai-assure-nav-item w-full text-left flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200">
                    <i class="fas fa-fire text-red-500"></i>
                    <span>AI Heat Map</span>
                  </button>
                  <button onclick="aiAssureManager.showTab('gap-analysis')" 
                    id="tab-gap-analysis" 
                    class="ai-assure-nav-item w-full text-left flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200">
                    <i class="fas fa-shield-alt text-blue-500"></i>
                    <span>Gap Analysis</span>
                  </button>
                </div>
              </nav>
            </div>
          </div>

          <!-- Main Content Area -->
          <div class="flex-1 lg:p-8 p-4">
            <div id="ai-assure-content" class="bg-white rounded-lg shadow-sm border border-gray-200 min-h-full">
              <!-- Content will be loaded here -->
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize mobile toggle
    this.setupMobileToggle();
    
    // Load initial tab content
    this.showTab(this.currentTab);
  }

  setupMobileToggle() {
    const mobileMenuBtn = document.getElementById('mobile-ai-assure-menu');
    const sidebar = document.getElementById('ai-assure-sidebar');
    
    if (mobileMenuBtn && sidebar) {
      mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('hidden');
        sidebar.classList.toggle('fixed');
        sidebar.classList.toggle('inset-0');
        sidebar.classList.toggle('z-50');
      });
    }
  }

  showTab(tabName) {
    this.currentTab = tabName;
    
    // Update active navigation
    document.querySelectorAll('.ai-assure-nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    const activeTab = document.getElementById(`tab-${tabName}`);
    if (activeTab) {
      activeTab.classList.add('active');
    }

    // Load tab content
    switch (tabName) {
      case 'ai-engine':
        this.showAIEngine();
        break;
      case 'ai-dashboard':
        this.showAIDashboard();
        break;
      case 'ai-heatmap':
        this.showAIHeatMap();
        break;
      case 'gap-analysis':
        this.showGapAnalysis();
        break;
      default:
        this.showAIEngine();
    }
  }

  showAIEngine() {
    const content = document.getElementById('ai-assure-content');
    content.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-xl font-semibold text-gray-900">AI Engine</h3>
            <p class="text-gray-600 mt-1">Comprehensive AI-powered GRC platform with advanced risk analysis</p>
          </div>
          <div class="flex items-center space-x-2">
            <div class="w-3 h-3 bg-green-500 rounded-full"></div>
            <span class="text-sm text-gray-600">System Online</span>
          </div>
        </div>
        
        <div id="ai-engine-dashboard">
          <div class="text-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-600">Loading AI Engine Dashboard...</p>
          </div>
        </div>
      </div>
    `;

    // Initialize the AI GRC Dashboard
    if (typeof initializeAIGRCDashboard === 'function') {
      // Replace the loading content with the AI GRC Dashboard
      const engineDashboard = document.getElementById('ai-engine-dashboard');
      engineDashboard.innerHTML = '<div id="dashboard-content"></div>';
      initializeAIGRCDashboard();
    } else {
      console.warn('AI GRC Dashboard not available');
      document.getElementById('ai-engine-dashboard').innerHTML = `
        <div class="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div class="flex">
            <i class="fas fa-exclamation-triangle text-yellow-400 mr-3 mt-1"></i>
            <div class="text-yellow-800">AI Engine module is loading. Please wait...</div>
          </div>
        </div>
      `;
    }
  }

  showAIDashboard() {
    const content = document.getElementById('ai-assure-content');
    content.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-xl font-semibold text-gray-900">Executive AI Dashboard</h3>
            <p class="text-gray-600 mt-1">High-level AI-powered insights and executive analytics</p>
          </div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div class="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <h4 class="text-lg font-semibold mb-2">AI Risk Intelligence</h4>
            <p class="text-blue-100 mb-4">Real-time risk assessment powered by machine learning</p>
            <button onclick="aiAssureManager.showTab('ai-engine')" class="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-50 transition-colors">
              Open AI Engine
            </button>
          </div>
          
          <div class="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <h4 class="text-lg font-semibold mb-2">Predictive Analytics</h4>
            <p class="text-purple-100 mb-4">Future risk predictions and trend analysis</p>
            <button onclick="aiAssureManager.showTab('ai-heatmap')" class="bg-white text-purple-600 px-4 py-2 rounded-md hover:bg-purple-50 transition-colors">
              View Heat Map
            </button>
          </div>
        </div>
        
        <div class="mt-8 text-center text-gray-500">
          <i class="fas fa-robot text-4xl mb-4"></i>
          <p class="text-lg">Executive AI Dashboard - Coming Soon</p>
          <p class="text-sm mt-2">Advanced executive insights and AI-powered recommendations</p>
        </div>
      </div>
    `;
  }

  showAIHeatMap() {
    const content = document.getElementById('ai-assure-content');
    content.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-xl font-semibold text-gray-900">AI Risk Heat Map</h3>
            <p class="text-gray-600 mt-1">Visual risk intelligence and threat landscape analysis</p>
          </div>
        </div>
        
        <div class="bg-gradient-to-br from-red-500 to-orange-600 rounded-lg p-8 text-white text-center">
          <i class="fas fa-fire text-6xl mb-4 opacity-80"></i>
          <h4 class="text-2xl font-bold mb-2">Risk Heat Map</h4>
          <p class="text-red-100 mb-6">Advanced visual risk analytics and threat intelligence</p>
          <div class="bg-white bg-opacity-20 rounded-lg p-4">
            <p class="text-sm">Interactive heat map visualization - Coming Soon</p>
          </div>
        </div>
      </div>
    `;
  }

  showGapAnalysis() {
    const content = document.getElementById('ai-assure-content');
    content.innerHTML = `
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h3 class="text-xl font-semibold text-gray-900">Compliance Gap Analysis</h3>
            <p class="text-gray-600 mt-1">AI-powered compliance gap identification and remediation</p>
          </div>
        </div>
        
        <div class="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg p-8 text-white text-center">
          <i class="fas fa-shield-alt text-6xl mb-4 opacity-80"></i>
          <h4 class="text-2xl font-bold mb-2">Gap Analysis</h4>
          <p class="text-blue-100 mb-6">Intelligent compliance gap detection and analysis</p>
          <div class="bg-white bg-opacity-20 rounded-lg p-4">
            <p class="text-sm">Advanced gap analysis engine - Coming Soon</p>
          </div>
        </div>
      </div>
    `;
  }
}

// Create global instance
const aiAssureManager = new AIAssureManager();

// Make functions globally accessible
window.aiAssureManager = aiAssureManager;
window.showAIAssure = () => aiAssureManager.showAIAssure();

// Ensure compatibility with existing function calls
window.showAIRiskHeatMap = () => {
  aiAssureManager.showAIAssure();
  setTimeout(() => aiAssureManager.showTab('ai-heatmap'), 100);
};

window.showComplianceGapAnalysis = () => {
  aiAssureManager.showAIAssure();
  setTimeout(() => aiAssureManager.showTab('gap-analysis'), 100);
};

window.showExecutiveAIDashboard = () => {
  aiAssureManager.showAIAssure();
  setTimeout(() => aiAssureManager.showTab('ai-dashboard'), 100);
};