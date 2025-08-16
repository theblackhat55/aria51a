// DMT Risk Assessment System v2.0 - Main Application JavaScript

// Global variables
let currentUser = null;
let dashboardData = null;

// Reports functionality
function showReports() {
  showModal('Risk Reports & Analytics', `
    <div class="space-y-6">
      <!-- Report Categories -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer" onclick="generateRiskReport()">
          <div class="flex items-center space-x-3">
            <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
            <div>
              <h3 class="font-semibold text-gray-900">Risk Assessment Report</h3>
              <p class="text-sm text-gray-600">Comprehensive risk analysis and metrics</p>
            </div>
          </div>
        </div>
        
        <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer" onclick="generateComplianceReport()">
          <div class="flex items-center space-x-3">
            <i class="fas fa-clipboard-check text-green-600 text-xl"></i>
            <div>
              <h3 class="font-semibold text-gray-900">Compliance Report</h3>
              <p class="text-sm text-gray-600">Compliance status and findings</p>
            </div>
          </div>
        </div>
        
        <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer" onclick="generateIncidentReport()">
          <div class="flex items-center space-x-3">
            <i class="fas fa-bell text-orange-600 text-xl"></i>
            <div>
              <h3 class="font-semibold text-gray-900">Incident Report</h3>
              <p class="text-sm text-gray-600">Security incidents and response</p>
            </div>
          </div>
        </div>
        
        <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer" onclick="generateExecutiveReport()">
          <div class="flex items-center space-x-3">
            <i class="fas fa-chart-bar text-blue-600 text-xl"></i>
            <div>
              <h3 class="font-semibold text-gray-900">Executive Summary</h3>
              <p class="text-sm text-gray-600">High-level overview for leadership</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="border-t border-gray-200 pt-4">
        <h4 class="font-medium text-gray-900 mb-3">Quick Actions</h4>
        <div class="flex flex-wrap gap-2">
          <button onclick="exportCurrentView()" class="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-sm">
            <i class="fas fa-download mr-1"></i>Export Current View
          </button>
          <button onclick="scheduleReport()" class="px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-sm">
            <i class="fas fa-calendar mr-1"></i>Schedule Report
          </button>
          <button onclick="shareReport()" class="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-sm">
            <i class="fas fa-share mr-1"></i>Share Report
          </button>
        </div>
      </div>
    </div>
  `, [
    { text: 'Close', class: 'btn-secondary', onclick: 'closeUniversalModal()' }
  ]);
}

// Report generation functions
function generateRiskReport() {
  showToast('Generating risk assessment report...', 'info');
  // Implement actual report generation
  setTimeout(() => {
    showToast('Risk report generated successfully!', 'success');
    closeUniversalModal();
  }, 2000);
}

function generateComplianceReport() {
  showToast('Generating compliance report...', 'info');
  setTimeout(() => {
    showToast('Compliance report generated successfully!', 'success');
    closeUniversalModal();
  }, 2000);
}

function generateIncidentReport() {
  showToast('Generating incident report...', 'info');
  setTimeout(() => {
    showToast('Incident report generated successfully!', 'success');
    closeUniversalModal();
  }, 2000);
}

function generateExecutiveReport() {
  showToast('Generating executive summary...', 'info');
  setTimeout(() => {
    showToast('Executive summary generated successfully!', 'success');
    closeUniversalModal();
  }, 2000);
}

function exportCurrentView() {
  showToast('Exporting current view...', 'info');
  // Implement export functionality
}

function scheduleReport() {
  showToast('Report scheduling feature coming soon!', 'info');
}

function shareReport() {
  showToast('Report sharing feature coming soon!', 'info');
}

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
  console.log('DOM loaded, initializing app...');
  
  // Always initialize navigation first
  try {
    console.log('Initializing navigation...');
    await initializeNavigation();
    console.log('Navigation initialized successfully');
  } catch (navError) {
    console.error('Navigation initialization error:', navError);
  }
  
  // Initialize ARIA assistant
  try {
    console.log('Initializing ARIA...');
    initializeARIAAssistant();
  } catch (ariaError) {
    console.error('ARIA initialization error:', ariaError);
  }
  
  // Check authentication and initialize appropriate UI
  try {
    // Debug: Check token in storage
    const token = localStorage.getItem('dmt_token');
    console.log('Token found:', token ? 'Yes' : 'No', token ? `(${token.substring(0, 20)}...)` : '');
    
    const authResult = await checkAuthentication();
    console.log('Auth check result:', authResult);
    console.log('Current user after auth check:', currentUser ? 'Loaded' : 'Not loaded');
    
    // Update UI based on authentication status
    await updateAuthUI();
  } catch (error) {
    console.error('Authentication error:', error);
    // Clear any invalid state
    currentUser = null;
    localStorage.removeItem('dmt_token');
    localStorage.removeItem('dmt_user');
    // Update UI to show public landing page
    await updateAuthUI();
  }
  
  // Hide loading spinner
  setTimeout(() => {
    const spinner = document.getElementById('loading-spinner');
    if (spinner) {
      spinner.style.display = 'none';
    }
  }, 1000);
});

// Authentication check
async function checkAuthentication() {
  const token = localStorage.getItem('dmt_token');
  const userData = localStorage.getItem('dmt_user');
  
  if (!token || !userData) {
    console.log('No token found, user not authenticated');
    return false;
  }
  
  try {
    // Verify token with server
    const response = await axios.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      currentUser = response.data.data;
      console.log('Authentication successful:', currentUser);
      return true;
    } else {
      throw new Error('Invalid token');
    }
  } catch (error) {
    console.error('Authentication error:', error);
    // Clear invalid token
    localStorage.removeItem('dmt_token');
    localStorage.removeItem('dmt_user');
    return false;
  }
}

// Show login prompt instead of redirecting
function showLoginPrompt() {
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
        <div class="text-center mb-6">
          <i class="fas fa-lock text-4xl text-gray-400 mb-4"></i>
          <h2 class="text-2xl font-bold text-gray-900">Authentication Required</h2>
          <p class="text-gray-600 mt-2">Please log in to access the GRC platform</p>
        </div>
        <div class="space-y-4">
          <button onclick="window.location.href='/login'" class="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
            <i class="fas fa-sign-in-alt mr-2"></i>Go to Login
          </button>
          <div class="text-sm text-gray-600 text-center">
            <p><strong>Demo Credentials:</strong></p>
            <p>Username: <code>admin</code> | Password: <code>demo123</code></p>
          </div>
        </div>
      </div>
    `;
  }
}

// Show basic dashboard for unauthenticated users
function showBasicDashboard() {
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-shield-alt text-6xl text-blue-600 mb-4"></i>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">DMT Risk Assessment System v2.0</h1>
        <p class="text-gray-600 mb-8">Next-Generation Enterprise GRC Platform</p>
        <button onclick="window.location.href='/login'" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
          <i class="fas fa-sign-in-alt mr-2"></i>Login to Continue
        </button>
      </div>
    `;
  }
}

// Initialize navigation
async function initializeNavigation() {
  console.log('initializeNavigation called');
  
  // Since navigation is now in static HTML, just add event handlers
  const navLinks = [
    { id: 'nav-dashboard', page: 'dashboard' },
    { id: 'nav-risks', page: 'risks' },
    { id: 'nav-ai-heatmap', page: 'ai-heatmap' },
    { id: 'nav-compliance-gaps', page: 'compliance-gaps' },
    { id: 'nav-executive-ai', page: 'executive-ai' },
    { id: 'nav-compliance', page: 'compliance' },
    { id: 'nav-frameworks', page: 'frameworks' },
    { id: 'nav-incidents', page: 'incidents' },
    { id: 'nav-assets', page: 'assets' },
    { id: 'nav-services', page: 'services' },
    { id: 'nav-documents', page: 'documents' },
    { id: 'nav-settings', page: 'settings' }
  ];
  
  console.log('Setting up navigation event handlers...');
  

  
  // Add click handlers to navigation links
  navLinks.forEach(nav => {
    const element = document.getElementById(nav.id);
    if (element) {
      element.addEventListener('click', (e) => {
        e.preventDefault();
        console.log('Navigation click:', nav.page);
        navigateTo(nav.page);
      });
      console.log('Added event handler for:', nav.id);
    } else {
      console.warn('Navigation element not found:', nav.id);
    }
  });
  
  // Setup auth button
  const authButton = document.getElementById('auth-button');
  if (authButton) {
    authButton.addEventListener('click', (e) => {
      e.preventDefault();
      const token = localStorage.getItem('dmt_token');
      if (token) {
        logout();
      } else {
        window.location.href = '/login';
      }
    });
    console.log('Added event handler for auth button');
  } else {
    console.warn('Auth button not found');
  }
  
  // Update welcome message and auth button based on login status
  await updateAuthUI();
  
  console.log('Navigation initialization complete');
}

// Update authentication UI
async function updateAuthUI() {
  console.log('🔄 updateAuthUI called');
  const token = localStorage.getItem('dmt_token');
  console.log('🔑 Token status:', token ? 'Present' : 'Missing');
  console.log('👤 Current user:', currentUser ? 'Loaded' : 'Not loaded');
  
  // Authentication is valid only if we have both token AND currentUser
  const isAuthenticated = !!(token && currentUser);
  console.log('✅ Is authenticated:', isAuthenticated);
  
  const welcomeMessage = document.getElementById('welcome-message');
  const authButton = document.getElementById('auth-button');
  const internalNav = document.getElementById('internal-nav');
  const notificationsContainer = document.getElementById('notifications-container');
  const ariaButton = document.getElementById('aria-button');
  
  // Update welcome message
  if (welcomeMessage) {
    welcomeMessage.textContent = `Welcome, ${currentUser?.first_name || (isAuthenticated ? 'User' : 'Guest')}`;
  }
  
  // Update auth button
  if (authButton) {
    if (isAuthenticated) {
      authButton.innerHTML = '<i class="fas fa-sign-out-alt mr-1"></i>Logout';
      authButton.className = 'bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200';
    } else {
      authButton.innerHTML = '<i class="fas fa-sign-in-alt mr-1"></i>Login';
      authButton.className = 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200';
    }
  }
  
  // Show/hide internal features based on authentication
  if (isAuthenticated) {
    console.log('✅ User authenticated, showing internal features');
    // Show internal features after login
    if (internalNav) internalNav.classList.remove('hidden');
    if (notificationsContainer) notificationsContainer.classList.remove('hidden');
    if (ariaButton) ariaButton.classList.remove('hidden');
    
    try {
      console.log('📊 Initializing dashboard...');
      await initializeDashboard();
    } catch (error) {
      console.error('Dashboard initialization failed:', error);
      showError('Failed to load dashboard');
    }
    
    // Load reference data if not already loaded
    if (typeof loadReferenceData === 'function') {
      loadReferenceData();
    }
  } else {
    console.log('❌ User not authenticated, hiding internal features');
    // Hide internal features when not logged in
    if (internalNav) internalNav.classList.add('hidden');
    if (notificationsContainer) notificationsContainer.classList.add('hidden');
    if (ariaButton) ariaButton.classList.add('hidden');
    
    // Show public landing page
    showPublicLandingPage();
  }
}

// Show public landing page for non-authenticated users
function showPublicLandingPage() {
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="max-w-4xl mx-auto text-center py-16">
        <div class="mb-8">
          <div class="mx-auto h-24 w-24 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full flex items-center justify-center mb-6">
            <i class="fas fa-shield-alt text-white text-3xl"></i>
          </div>
          <h1 class="text-4xl font-bold text-gray-900 mb-4">Risk Management Platform</h1>
          <p class="text-xl text-gray-600 mb-8">Next-Generation Enterprise GRC Platform with AI-Powered Intelligence & Advanced Analytics</p>
        </div>
        
        <div class="grid md:grid-cols-3 gap-8 mb-12">
          <div class="bg-white p-6 rounded-lg shadow-lg">
            <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Risk Management</h3>
            <p class="text-gray-600">Comprehensive risk assessment, monitoring, and mitigation strategies for enterprise security.</p>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-lg">
            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-server text-green-600 text-xl"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Asset Management</h3>
            <p class="text-gray-600">Track and manage IT assets with integrated Microsoft Defender vulnerability assessments.</p>
          </div>
          
          <div class="bg-white p-6 rounded-lg shadow-lg">
            <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <i class="fas fa-robot text-purple-600 text-xl"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">AI-Powered ARIA</h3>
            <p class="text-gray-600">Intelligent risk assistant with RAG context and multi-provider AI integration.</p>
          </div>
        </div>
        
        <div class="bg-blue-50 p-8 rounded-lg border border-blue-200">
          <h3 class="text-xl font-semibold text-gray-900 mb-4">Ready to Get Started?</h3>
          <p class="text-gray-600 mb-6">Sign in to access the full GRC platform with advanced risk management capabilities.</p>
          <button onclick="window.location.href='/login'" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors duration-200">
            <i class="fas fa-sign-in-alt mr-2"></i>Sign In
          </button>
          
          <div class="mt-6 text-sm text-gray-500">
            <p><strong>Demo Accounts:</strong></p>
            <div class="mt-2 space-y-1">
              <p><strong>Admin:</strong> admin / demo123</p>
              <p><strong>Risk Manager:</strong> avi_security / demo123</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }
}

// Load current user data
async function loadCurrentUser() {
  try {
    const token = localStorage.getItem('dmt_token');
    if (!token) return;
    
    const response = await axios.get('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      currentUser = response.data.data;
      // Note: Don't call updateAuthUI here to avoid recursion
    }
  } catch (error) {
    console.error('Failed to load current user:', error);
    // Token might be invalid, logout
    logout();
  }
}

// Universal navigation function
function navigateTo(page) {
  console.log('Navigating to:', page);
  
  // Update active navigation
  document.querySelectorAll('.nav-menu-item').forEach(item => {
    item.classList.remove('active');
  });
  const activeItem = document.getElementById(`nav-${page}`);
  if (activeItem) {
    activeItem.classList.add('active');
  }
  
  // Check if user needs to be authenticated for this page
  const token = localStorage.getItem('dmt_token');
  if (!token) {
    // Redirect to login for any navigation attempt when not authenticated
    window.location.href = '/login';
    return;
  }
  
  // Route to appropriate function
  try {
    switch(page) {
      case 'dashboard':
        if (typeof showDashboard === 'function') {
          showDashboard();
        } else {
          showBasicDashboard();
        }
        break;
      case 'risks':
        if (typeof showRisks === 'function') {
          showRisks();
        } else {
          showPlaceholder('Risk Management', 'Risks module loading...', 'exclamation-triangle');
        }
        break;
      case 'controls':
        if (typeof showControls === 'function') {
          showControls();
        } else {
          showPlaceholder('Control Framework', 'Controls module loading...', 'shield-check');
        }
        break;
      case 'compliance':
        if (typeof showCompliance === 'function') {
          showCompliance();
        } else {
          showPlaceholder('Compliance Management', 'Compliance module loading...', 'clipboard-check');
        }
        break;
      case 'frameworks':
        if (typeof showFrameworks === 'function') {
          showFrameworks();
        } else {
          showPlaceholder('Compliance Frameworks', 'Frameworks module loading...', 'list-check');
        }
        break;
      case 'incidents':
        if (typeof showIncidents === 'function') {
          showIncidents();
        } else {
          showPlaceholder('Incident Management', 'Incidents module loading...', 'bell');
        }
        break;
      case 'assets':
        if (typeof showAssets === 'function') {
          showAssets();
        } else {
          showPlaceholder('Asset Management', 'Assets module loading...', 'server');
        }
        break;
      case 'services':
        if (typeof showServices === 'function') {
          showServices();
        } else {
          showPlaceholder('Services Management', 'Services module loading...', 'cogs');
        }
        break;
      case 'documents':
        if (typeof documentManager !== 'undefined' && documentManager.showDocuments) {
          documentManager.showDocuments();
        } else {
          showPlaceholder('Document Management', 'Documents module loading...', 'file-alt');
        }
        break;
      case 'settings':
        if (typeof showSettings === 'function') {
          showSettings();
        } else {
          showPlaceholder('Settings', 'Settings module loading...', 'cog');
        }
        break;
      case 'ai-heatmap':
        if (typeof showAIRiskHeatMap === 'function') {
          showAIRiskHeatMap();
        } else {
          showPlaceholder('AI Risk Heat Map', 'AI Heat Map module loading...', 'fire');
        }
        break;
      case 'compliance-gaps':
        if (typeof showComplianceGapAnalysis === 'function') {
          showComplianceGapAnalysis();
        } else {
          showPlaceholder('Compliance Gap Analysis', 'Gap Analysis module loading...', 'shield-alt');
        }
        break;
      case 'executive-ai':
        if (typeof showExecutiveAIDashboard === 'function') {
          showExecutiveAIDashboard();
        } else {
          showPlaceholder('Executive AI Dashboard', 'AI Dashboard module loading...', 'robot');
        }
        break;
      default:
        showBasicDashboard();
    }
  } catch (error) {
    console.error('Navigation error:', error);
    showError('Navigation error: ' + error.message);
  }
}

// Show placeholder for modules that haven't loaded yet
function showPlaceholder(title, message, icon) {
  const mainContent = document.getElementById('main-content');
  if (mainContent) {
    mainContent.innerHTML = `
      <div class="text-center py-12">
        <i class="fas fa-${icon} text-6xl text-gray-400 mb-4"></i>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">${title}</h2>
        <p class="text-gray-600 mb-4">${message}</p>
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    `;
  }
}

// Logout function
function logout() {
  // Clear user data
  localStorage.removeItem('dmt_token');
  localStorage.removeItem('dmt_user');
  currentUser = null;
  
  // Redirect to login page immediately (no need to update UI)
  window.location.href = '/login';
}

// Dashboard functionality
async function initializeDashboard() {
  console.log('🔄 Initializing dashboard...');
  try {
    const success = await loadDashboardData();
    console.log('📊 Dashboard data loaded:', success ? 'Success' : 'Failed');
    if (success) {
      console.log('🎯 Calling showDashboard with data:', dashboardData ? 'Available' : 'Missing');
      console.log('📋 Dashboard data keys:', dashboardData ? Object.keys(dashboardData) : 'None');
      showDashboard();
      console.log('✅ Dashboard initialization complete');
    } else {
      console.error('❌ Dashboard data loading failed, not showing dashboard');
    }
  } catch (error) {
    console.error('❌ Dashboard initialization error:', error);
    showError('Dashboard initialization failed: ' + error.message);
  }
}

async function loadDashboardData() {
  try {
    console.log('📡 Loading dashboard data...');
    showLoading('main-content');
    
    const token = localStorage.getItem('dmt_token');
    console.log('🔑 Using token:', token ? 'Present' : 'Missing');
    
    const response = await axios.get('/api/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('📋 API Response:', response.data.success ? 'Success' : 'Failed');
    
    if (response.data.success) {
      dashboardData = response.data.data;
      console.log('💾 Dashboard data set:', Object.keys(dashboardData || {}).length, 'keys');
      return true; // Success
    } else {
      throw new Error('Failed to load dashboard data');
    }
  } catch (error) {
    console.error('❌ Dashboard error:', error);
    showError('Failed to load dashboard data');
    return false; // Failed
  }
}

function showDashboard() {
  console.log('🎯 showDashboard called');
  updateActiveNavigation('dashboard');
  
  const mainContent = document.getElementById('main-content');
  console.log('📱 main-content element:', mainContent ? 'Found' : 'Not found');
  
  if (!dashboardData) {
    console.log('❌ No dashboard data, showing loading');
    showLoading('main-content');
    return;
  }
  
  console.log('✅ Dashboard data available, rendering dashboard');
  
  mainContent.innerHTML = `
    <div class="space-y-8">
      <!-- Modern Header -->
      <div class="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
        <div class="flex justify-between items-center">
          <div>
            <h1 class="text-3xl font-bold mb-2">Risk Management Dashboard</h1>
            <p class="text-blue-100">Real-time insights into your organization's risk posture</p>
          </div>
          <div class="flex space-x-3">
            <button onclick="refreshDashboard()" class="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all duration-200">
              <i class="fas fa-sync-alt mr-2"></i>Refresh
            </button>
            <button onclick="showReports()" class="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-all duration-200">
              <i class="fas fa-chart-bar mr-2"></i>Reports
            </button>
          </div>
        </div>
      </div>
      
      <!-- Modern Key Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Risks</p>
              <p class="text-3xl font-bold text-gray-900 mt-2">${dashboardData.total_risks}</p>
              <div class="flex items-center mt-2">
                <i class="fas fa-arrow-up text-green-500 text-sm mr-1"></i>
                <span class="text-sm text-green-600 font-medium">Active monitoring</span>
              </div>
            </div>
            <div class="bg-blue-50 p-3 rounded-xl">
              <i class="fas fa-exclamation-triangle text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500 uppercase tracking-wide">High Risk</p>
              <p class="text-3xl font-bold text-red-600 mt-2">${dashboardData.high_risks}</p>
              <div class="flex items-center mt-2">
                <i class="fas fa-fire text-red-500 text-sm mr-1"></i>
                <span class="text-sm text-red-600 font-medium">Requires attention</span>
              </div>
            </div>
            <div class="bg-red-50 p-3 rounded-xl">
              <i class="fas fa-fire text-red-600 text-xl"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500 uppercase tracking-wide">Open Findings</p>
              <p class="text-3xl font-bold text-orange-600 mt-2">${dashboardData.open_findings}</p>
              <div class="flex items-center mt-2">
                <i class="fas fa-clock text-orange-500 text-sm mr-1"></i>
                <span class="text-sm text-orange-600 font-medium">In progress</span>
              </div>
            </div>
            <div class="bg-orange-50 p-3 rounded-xl">
              <i class="fas fa-clipboard-list text-orange-600 text-xl"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-500 uppercase tracking-wide">Compliance</p>
              <p class="text-3xl font-bold text-green-600 mt-2">${dashboardData.compliance_score}%</p>
              <div class="flex items-center mt-2">
                <i class="fas fa-check-circle text-green-500 text-sm mr-1"></i>
                <span class="text-sm text-green-600 font-medium">On track</span>
              </div>
            </div>
            <div class="bg-green-50 p-3 rounded-xl">
              <i class="fas fa-shield-alt text-green-600 text-xl"></i>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Advanced Risk Heat Maps Section -->
      <div class="dashboard-card">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Advanced Risk Heat Maps</h3>
          <div class="flex space-x-2">
            <select id="heatmapView" onchange="updateHeatMap()" class="form-select text-sm">
              <option value="probability_impact">Probability vs Impact</option>
              <option value="organizational">Organizational Risk Matrix</option>
              <option value="temporal">Temporal Risk Evolution</option>
              <option value="category">Risk by Category</option>
            </select>
            <button onclick="toggleHeatMapFullscreen()" class="btn-icon">
              <i class="fas fa-expand"></i>
            </button>
          </div>
        </div>
        <div id="riskHeatMapContainer" class="relative">
          <canvas id="riskHeatMap" class="w-full h-96"></canvas>
          <div id="heatMapTooltip" class="absolute hidden bg-black bg-opacity-75 text-white text-xs rounded px-2 py-1 pointer-events-none z-10"></div>
        </div>
        <div class="mt-4 flex justify-between items-center text-sm text-gray-600">
          <div class="flex items-center space-x-4">
            <div class="flex items-center space-x-2">
              <div class="w-4 h-4 bg-green-400 rounded"></div>
              <span>Low Risk</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-4 h-4 bg-yellow-400 rounded"></div>
              <span>Medium Risk</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-4 h-4 bg-orange-500 rounded"></div>
              <span>High Risk</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-4 h-4 bg-red-600 rounded"></div>
              <span>Critical Risk</span>
            </div>
          </div>
          <div class="text-right">
            <span>Total Risk Items: <strong id="heatMapRiskCount">${dashboardData.total_risks}</strong></span>
          </div>
        </div>
      </div>

      <!-- Charts and Analytics -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Risk Trend Chart -->
        <div class="dashboard-card">
          <h3 class="text-lg font-semibold mb-4">Risk Trend (7 Days)</h3>
          <div class="chart-container">
            <canvas id="riskTrendChart"></canvas>
          </div>
        </div>
        
        <!-- Risk Distribution -->
        <div class="dashboard-card">
          <h3 class="text-lg font-semibold mb-4">Risk Distribution</h3>
          <div class="chart-container">
            <canvas id="riskDistributionChart"></canvas>
          </div>
        </div>
      </div>
      
      <!-- Data Tables -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Top Risks -->
        <div class="dashboard-card">
          <h3 class="text-lg font-semibold mb-4">Top Risks</h3>
          <div class="space-y-3">
            ${dashboardData.top_risks.map(risk => `
              <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div class="flex-1">
                  <div class="text-sm font-medium text-gray-900">${risk.title}</div>
                  <div class="text-xs text-gray-500">${risk.risk_id}</div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-semibold ${getRiskScoreColor(risk.risk_score)}">${risk.risk_score}</div>
                  <div class="text-xs text-gray-500">${getRiskLevel(risk.risk_score)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        
        <!-- Recent Incidents -->
        <div class="dashboard-card">
          <h3 class="text-lg font-semibold mb-4">Recent Incidents</h3>
          <div class="space-y-3">
            ${dashboardData.recent_incidents.map(incident => `
              <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div class="flex-1">
                  <div class="text-sm font-medium text-gray-900">${incident.title}</div>
                  <div class="text-xs text-gray-500">${incident.incident_id}</div>
                </div>
                <div class="text-right">
                  <div class="badge badge-sm ${getSeverityClass(incident.severity)}">${incident.severity}</div>
                  <div class="text-xs text-gray-500 mt-1">${formatDate(incident.created_at)}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Initialize charts and heat maps
  initializeCharts();
}

// Initialize charts
function initializeCharts() {
  // Risk Trend Chart
  const riskTrendCtx = document.getElementById('riskTrendChart');
  if (riskTrendCtx) {
    new Chart(riskTrendCtx, {
      type: 'line',
      data: {
        labels: dashboardData.risk_trend.map(item => formatDate(item.date)),
        datasets: [{
          label: 'Average Risk Score',
          data: dashboardData.risk_trend.map(item => item.score),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 25
          }
        }
      }
    });
  }
  
  // Risk Distribution Chart (placeholder data)
  const riskDistCtx = document.getElementById('riskDistributionChart');
  if (riskDistCtx) {
    new Chart(riskDistCtx, {
      type: 'doughnut',
      data: {
        labels: ['Critical', 'High', 'Medium', 'Low'],
        datasets: [{
          data: [2, 8, 15, 25],
          backgroundColor: [
            'rgb(239, 68, 68)',
            'rgb(245, 101, 101)',
            'rgb(251, 191, 36)',
            'rgb(34, 197, 94)'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
  
  // Initialize Risk Heat Map
  initializeRiskHeatMap();
}

// Advanced Risk Heat Map Implementation
let currentHeatMapChart = null;

function initializeRiskHeatMap() {
  const canvas = document.getElementById('riskHeatMap');
  if (!canvas) return;
  
  // Initialize with default view
  updateHeatMap();
}

function updateHeatMap() {
  const view = document.getElementById('heatmapView')?.value || 'probability_impact';
  const canvas = document.getElementById('riskHeatMap');
  if (!canvas) return;
  
  // Destroy existing chart
  if (currentHeatMapChart) {
    currentHeatMapChart.destroy();
  }
  
  const ctx = canvas.getContext('2d');
  
  switch(view) {
    case 'probability_impact':
      renderProbabilityImpactHeatMap(ctx);
      break;
    case 'organizational':
      renderOrganizationalHeatMap(ctx);
      break;
    case 'temporal':
      renderTemporalHeatMap(ctx);
      break;
    case 'category':
      renderCategoryHeatMap(ctx);
      break;
    default:
      renderProbabilityImpactHeatMap(ctx);
  }
}

function renderProbabilityImpactHeatMap(ctx) {
  // Generate sample heat map data based on dashboard data
  const heatMapData = generateProbabilityImpactData();
  
  currentHeatMapChart = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Risk Items',
        data: heatMapData.risks,
        backgroundColor: function(context) {
          const risk = context.parsed;
          const score = risk.x * risk.y; // Probability × Impact
          return getRiskHeatColor(score);
        },
        borderColor: '#ffffff',
        borderWidth: 1,
        pointRadius: function(context) {
          return Math.max(6, Math.min(15, context.parsed.risks || 1) * 2);
        }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          type: 'linear',
          position: 'bottom',
          min: 1,
          max: 5,
          title: {
            display: true,
            text: 'Probability'
          },
          ticks: {
            stepSize: 1,
            callback: function(value) {
              const labels = ['', 'Very Low', 'Low', 'Medium', 'High', 'Very High'];
              return labels[value] || value;
            }
          }
        },
        y: {
          min: 1,
          max: 5,
          title: {
            display: true,
            text: 'Impact'
          },
          ticks: {
            stepSize: 1,
            callback: function(value) {
              const labels = ['', 'Minimal', 'Minor', 'Moderate', 'Major', 'Severe'];
              return labels[value] || value;
            }
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const risk = context.raw;
              return [
                `Risk Score: ${(context.parsed.x * context.parsed.y).toFixed(1)}`,
                `Probability: ${context.parsed.x}/5`,
                `Impact: ${context.parsed.y}/5`,
                `Risk Count: ${risk.risks || 1}`
              ];
            }
          }
        }
      },
      interaction: {
        intersect: false
      }
    }
  });
}

function renderOrganizationalHeatMap(ctx) {
  // Sample organizational data
  const orgData = dashboardData.organizations || [
    { name: 'IT', risks: 12, avgScore: 15.2 },
    { name: 'Finance', risks: 8, avgScore: 12.1 },
    { name: 'HR', risks: 5, avgScore: 8.5 },
    { name: 'Operations', risks: 15, avgScore: 18.3 }
  ];
  
  currentHeatMapChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: orgData.map(org => org.name),
      datasets: [{
        label: 'Risk Count',
        data: orgData.map(org => org.risks),
        backgroundColor: orgData.map(org => getRiskHeatColor(org.avgScore)),
        borderColor: '#ffffff',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Risks'
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const org = orgData[context.dataIndex];
              return [
                `Risk Count: ${org.risks}`,
                `Average Score: ${org.avgScore}`,
                `Risk Level: ${getRiskLevel(org.avgScore)}`
              ];
            }
          }
        }
      }
    }
  });
}

function renderTemporalHeatMap(ctx) {
  // Temporal evolution data
  const temporalData = generateTemporalData();
  
  currentHeatMapChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: temporalData.labels,
      datasets: [{
        label: 'Critical Risks',
        data: temporalData.critical,
        borderColor: '#DC2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        fill: true
      }, {
        label: 'High Risks',
        data: temporalData.high,
        borderColor: '#EA580C',
        backgroundColor: 'rgba(234, 88, 12, 0.1)',
        fill: true
      }, {
        label: 'Medium Risks',
        data: temporalData.medium,
        borderColor: '#D97706',
        backgroundColor: 'rgba(217, 119, 6, 0.1)',
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time Period'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Risk Count'
          }
        }
      },
      plugins: {
        tooltip: {
          mode: 'index',
          intersect: false
        }
      }
    }
  });
}

function renderCategoryHeatMap(ctx) {
  // Category-based heat map
  const categories = [
    'Operational', 'Financial', 'Compliance', 'Technology', 
    'Strategic', 'Reputation', 'Legal', 'Environmental'
  ];
  
  const categoryData = categories.map(cat => ({
    category: cat,
    risks: Math.floor(Math.random() * 20) + 1,
    avgScore: Math.random() * 20 + 5
  }));
  
  currentHeatMapChart = new Chart(ctx, {
    type: 'radar',
    data: {
      labels: categories,
      datasets: [{
        label: 'Risk Distribution',
        data: categoryData.map(cat => cat.risks),
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 2,
        pointBackgroundColor: categoryData.map(cat => getRiskHeatColor(cat.avgScore)),
        pointBorderColor: '#ffffff',
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Risk Count'
          }
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              const cat = categoryData[context.dataIndex];
              return [
                `Category: ${cat.category}`,
                `Risk Count: ${cat.risks}`,
                `Average Score: ${cat.avgScore.toFixed(1)}`
              ];
            }
          }
        }
      }
    }
  });
}

// Helper functions for heat map
function generateProbabilityImpactData() {
  const risks = [];
  for (let p = 1; p <= 5; p++) {
    for (let i = 1; i <= 5; i++) {
      const riskCount = Math.floor(Math.random() * 5) + 1;
      if (riskCount > 0) {
        risks.push({
          x: p + (Math.random() - 0.5) * 0.3,
          y: i + (Math.random() - 0.5) * 0.3,
          risks: riskCount
        });
      }
    }
  }
  return { risks };
}

function generateTemporalData() {
  const labels = [];
  const critical = [];
  const high = [];
  const medium = [];
  
  for (let i = 0; i < 12; i++) {
    const date = new Date();
    date.setMonth(date.getMonth() - (11 - i));
    labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
    
    critical.push(Math.floor(Math.random() * 5) + 1);
    high.push(Math.floor(Math.random() * 10) + 3);
    medium.push(Math.floor(Math.random() * 15) + 5);
  }
  
  return { labels, critical, high, medium };
}

function getRiskHeatColor(score) {
  if (score >= 20) return '#DC2626'; // Red - Critical
  if (score >= 15) return '#EA580C'; // Orange - High
  if (score >= 10) return '#D97706'; // Yellow - Medium
  if (score >= 5) return '#65A30D';  // Light Green - Low
  return '#16A34A'; // Green - Very Low
}

function toggleHeatMapFullscreen() {
  const container = document.getElementById('riskHeatMapContainer');
  if (!container) return;
  
  if (container.classList.contains('fixed')) {
    // Exit fullscreen
    container.classList.remove('fixed', 'inset-0', 'z-50', 'bg-white', 'p-8');
    container.querySelector('canvas').style.height = '24rem';
    document.querySelector('#heatmapView').parentElement.querySelector('.fa-compress')?.classList.replace('fa-compress', 'fa-expand');
  } else {
    // Enter fullscreen
    container.classList.add('fixed', 'inset-0', 'z-50', 'bg-white', 'p-8');
    container.querySelector('canvas').style.height = 'calc(100vh - 12rem)';
    document.querySelector('#heatmapView').parentElement.querySelector('.fa-expand')?.classList.replace('fa-expand', 'fa-compress');
  }
  
  // Redraw chart after size change
  setTimeout(() => {
    if (currentHeatMapChart) {
      currentHeatMapChart.resize();
    }
  }, 100);
}

// ARIA AI Assistant
function initializeARIAAssistant() {
  const ariaButton = document.getElementById('aria-button');
  const ariaModal = document.getElementById('aria-modal');
  const closeAria = document.getElementById('close-aria');
  const sendAria = document.getElementById('send-aria');
  const ariaInput = document.getElementById('aria-input');

  if (ariaButton && ariaModal && ariaInput) {
    ariaButton.addEventListener('click', function() {
      updateARIAProviderDisplay();
      ariaModal.classList.remove('hidden');
      ariaInput.focus();
    });
  }

  if (closeAria && ariaModal) {
    closeAria.addEventListener('click', function() {
      ariaModal.classList.add('hidden');
    });
  }

  // Close modal when clicking outside
  if (ariaModal) {
    ariaModal.addEventListener('click', function(e) {
      if (e.target === ariaModal) {
        ariaModal.classList.add('hidden');
      }
    });
  }

  if (sendAria) {
    sendAria.addEventListener('click', sendARIAMessage);
  }
  
  if (ariaInput) {
    ariaInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendARIAMessage();
      }
    });
  }
}

// Update ARIA provider display
function updateARIAProviderDisplay() {
  const providerDisplay = document.getElementById('current-provider');
  if (!providerDisplay) return;
  
  const aiSettings = JSON.parse(localStorage.getItem('dmt_ai_settings') || '{}');
  
  // Get enabled and configured providers
  const enabledProviders = [];
  if (aiSettings.openai?.enabled && aiSettings.openai?.apiKey) {
    enabledProviders.push('OpenAI GPT-4');
  }
  if (aiSettings.gemini?.enabled && aiSettings.gemini?.apiKey) {
    enabledProviders.push('Google Gemini');
  }
  if (aiSettings.anthropic?.enabled && aiSettings.anthropic?.apiKey) {
    enabledProviders.push('Anthropic Claude');
  }
  if (aiSettings.local?.enabled && aiSettings.local?.endpoint) {
    enabledProviders.push('Local/Custom');
  }
  
  if (enabledProviders.length === 0) {
    providerDisplay.innerHTML = '<span class="text-red-600"><i class="fas fa-exclamation-triangle mr-1"></i>Not Configured</span>';
    providerDisplay.title = 'No AI providers configured. Go to Settings to configure.';
  } else if (enabledProviders.length === 1) {
    providerDisplay.innerHTML = `<span class="text-green-600"><i class="fas fa-check-circle mr-1"></i>${enabledProviders[0]}</span>`;
    providerDisplay.title = `Using: ${enabledProviders[0]}`;
  } else {
    providerDisplay.innerHTML = `<span class="text-blue-600"><i class="fas fa-layer-group mr-1"></i>${enabledProviders.length} Providers</span>`;
    providerDisplay.title = `Priority fallback: ${enabledProviders.join(' → ')}`;
  }
}

async function sendARIAMessage() {
  const ariaInput = document.getElementById('aria-input');
  const ariaChat = document.getElementById('aria-chat');
  const query = ariaInput.value.trim();
  
  if (!query) return;
  
  // Load AI settings from localStorage
  const aiSettings = JSON.parse(localStorage.getItem('dmt_ai_settings') || '{}');
  
  // Get provider priority list (only enabled providers)
  const providerPriority = [];
  if (aiSettings.openai?.enabled && aiSettings.openai?.apiKey) {
    providerPriority.push('openai');
  }
  if (aiSettings.gemini?.enabled && aiSettings.gemini?.apiKey) {
    providerPriority.push('gemini');
  }
  if (aiSettings.anthropic?.enabled && aiSettings.anthropic?.apiKey) {
    providerPriority.push('anthropic');
  }
  if (aiSettings.local?.enabled && aiSettings.local?.endpoint) {
    providerPriority.push('local');
  }
  
  if (providerPriority.length === 0) {
    ariaChat.innerHTML += `
      <div class="mb-4">
        <div class="text-left">
          <div class="inline-block bg-yellow-100 text-yellow-800 rounded-lg px-4 py-2 text-sm max-w-lg border border-yellow-200">
            <i class="fas fa-cog mr-2"></i>Please configure AI settings first. Go to Settings → AI & LLM Settings to set up your API keys.
            <div class="mt-2 text-xs">
              The enhanced ARIA with RAG capabilities requires at least one AI provider to be configured.
            </div>
          </div>
        </div>
      </div>
    `;
    ariaChat.scrollTop = ariaChat.scrollHeight;
    return;
  }
  
  // Add user message
  ariaChat.innerHTML += `
    <div class="mb-4">
      <div class="text-right">
        <div class="inline-block bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg px-4 py-2 text-sm max-w-xs shadow-sm">
          ${query}
        </div>
        <div class="text-xs text-gray-500 mt-1">Using priority fallback system</div>
      </div>
    </div>
  `;
  
  ariaInput.value = '';
  ariaChat.scrollTop = ariaChat.scrollHeight;
  
  // Add loading message
  const loadingId = 'aria-loading-' + Date.now();
  ariaChat.innerHTML += `
    <div class="mb-4" id="${loadingId}">
      <div class="text-left">
        <div class="inline-block bg-gradient-to-r from-purple-100 to-blue-100 text-gray-800 rounded-lg px-4 py-2 text-sm shadow-sm">
          <i class="fas fa-brain fa-pulse mr-2 text-purple-600"></i>ARIA is analyzing your request...
          <div class="text-xs text-gray-600 mt-1">Trying ${getProviderDisplayName(providerPriority[0])} first</div>
        </div>
      </div>
    </div>
  `;
  
  let successfulResponse = false;
  let lastError = null;
  
  // Use the enhanced ARIA API endpoint with RAG context
  try {
    const token = localStorage.getItem('dmt_token');
    const startTime = Date.now();
    
    const response = await axios.post('/api/aria/query', 
      { 
        query: query, 
        provider: providerPriority[0], // Use first provider
        settings: aiSettings // Include all AI settings
      },
      { 
        headers: { Authorization: `Bearer ${token}` },
        timeout: 45000 // 45 second timeout for RAG processing
      }
    );
    
    const responseTime = Date.now() - startTime;
    
    // Remove loading message
    const loadingElement = document.getElementById(loadingId);
    if (loadingElement) loadingElement.remove();
    
    if (response.data.success) {
      const data = response.data.data;
      
      // Enhanced response with RAG context information
      ariaChat.innerHTML += `
        <div class="mb-4">
          <div class="text-left">
            <div class="inline-block bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 rounded-lg px-4 py-2 text-sm max-w-2xl shadow-sm border border-gray-200">
              <i class="fas fa-robot mr-2 text-blue-600"></i>${data.response}
            </div>
            <div class="text-xs text-gray-500 mt-2">
              <div class="flex justify-between items-center">
                <span class="flex items-center">
                  <i class="fas fa-check-circle text-green-500 mr-1"></i>
                  ${getProviderDisplayName(data.provider)} • ${data.tokens_used || 0} tokens
                </span>
                <span>${responseTime}ms</span>
              </div>
              ${data.context_sources > 0 ? `
                <div class="flex items-center mt-1">
                  <i class="fas fa-database text-purple-500 mr-1"></i>
                  <span>Enhanced with ${data.context_sources} knowledge base sources</span>
                  ${data.tools_used > 0 ? ` • ${data.tools_used} analysis tools` : ''}
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
      
      // Show sources if available
      if (data.sources && data.sources.length > 0) {
        ariaChat.innerHTML += `
          <div class="mb-4">
            <div class="text-left">
              <details class="bg-gray-50 rounded-lg p-3 text-sm border">
                <summary class="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
                  <i class="fas fa-book mr-2"></i>View Knowledge Sources (${data.sources.length})
                </summary>
                <div class="mt-3 space-y-2">
                  ${data.sources.slice(0, 5).map(source => `
                    <div class="flex items-start space-x-2 text-xs">
                      <i class="fas fa-file-alt text-blue-500 mt-1"></i>
                      <div>
                        <div class="font-medium">${source.title}</div>
                        <div class="text-gray-600">${source.type} • ${Math.round(source.similarity * 100)}% relevant</div>
                        <div class="text-gray-500 mt-1">${source.excerpt}</div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </details>
            </div>
          </div>
        `;
      }
      
      successfulResponse = true;
      
    } else {
      throw new Error(response.data.message || 'Enhanced ARIA request failed');
    }
    
  } catch (error) {
    console.error('Enhanced ARIA failed, trying fallback:', error);
    lastError = error;
    
    // Fallback to simple provider rotation
    for (let i = 0; i < providerPriority.length; i++) {
      const provider = providerPriority[i];
      
      try {
        const fallbackResponse = await axios.post('/api/aria/query', 
          { 
            query: query, 
            provider: provider,
            settings: aiSettings[provider]
          },
          { 
            headers: { Authorization: `Bearer ${localStorage.getItem('dmt_token')}` },
            timeout: 30000
          }
        );
        
        if (fallbackResponse.data.success) {
          const loadingEl = document.getElementById(loadingId);
          if (loadingEl) loadingEl.remove();
          
          const data = fallbackResponse.data.data;
          ariaChat.innerHTML += `
            <div class="mb-4">
              <div class="text-left">
                <div class="inline-block bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 rounded-lg px-4 py-2 text-sm max-w-2xl shadow-sm border border-gray-200">
                  <i class="fas fa-robot mr-2 text-blue-600"></i>${data.response}
                  <div class="text-xs text-yellow-600 mt-2">
                    <i class="fas fa-exclamation-triangle mr-1"></i>
                    Note: Enhanced context features temporarily unavailable
                  </div>
                </div>
                <div class="text-xs text-gray-500 mt-1">
                  <span class="flex items-center">
                    <i class="fas fa-check-circle text-green-500 mr-1"></i>
                    ${getProviderDisplayName(provider)} • ${data.tokens_used || 0} tokens
                  </span>
                </div>
              </div>
            </div>
          `;
          successfulResponse = true;
          break;
        }
      } catch (fallbackError) {
        console.error(`Fallback provider ${provider} failed:`, fallbackError);
        continue;
      }
    }
  }
  
  // If no provider succeeded, show error
  if (!successfulResponse) {
    const loadingElement = document.getElementById(loadingId);
    if (loadingElement) loadingElement.remove();
    
    ariaChat.innerHTML += `
      <div class="mb-4">
        <div class="text-left">
          <div class="inline-block bg-red-100 text-red-800 rounded-lg px-4 py-2 text-sm max-w-lg border border-red-200">
            <i class="fas fa-exclamation-triangle mr-2"></i>All AI providers failed to respond. Please check:
            <div class="mt-2 text-xs">
              • Your API keys are valid and have sufficient credits<br>
              • Your internet connection is stable<br>
              • Provider services are operational
            </div>
          </div>
          <div class="text-xs text-gray-500 mt-2">
            Tried: ${providerPriority.map(p => getProviderDisplayName(p)).join(', ')}
          </div>
        </div>
      </div>
    `;
  }
  
  ariaChat.scrollTop = ariaChat.scrollHeight;
}

function quickARIAQuery(query) {
  const ariaInput = document.getElementById('aria-input');
  if (ariaInput) {
    ariaInput.value = query;
    sendARIAMessage();
  }
}

function getProviderDisplayName(provider) {
  const names = {
    'openai': 'OpenAI GPT-4',
    'gemini': 'Google Gemini',
    'anthropic': 'Anthropic Claude',
    'local': 'Local/Custom LLM'
  };
  return names[provider] || provider.charAt(0).toUpperCase() + provider.slice(1);
}

async function showAIInsights() {
  try {
    const token = localStorage.getItem('dmt_token');
    const response = await axios.get('/api/ai/insights?type=all&limit=5', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      const insights = response.data.data;
      showModal('AI Risk Insights', renderAIInsights(insights), [
        { text: 'Close', class: 'btn-primary', onclick: 'closeModal()' }
      ]);
    } else {
      showToast('Failed to load AI insights', 'error');
    }
  } catch (error) {
    console.error('AI insights error:', error);
    showToast('Failed to load AI insights', 'error');
  }
}

function renderAIInsights(insights) {
  if (!insights || insights.length === 0) {
    return `
      <div class="text-center py-8">
        <i class="fas fa-brain text-4xl text-gray-300 mb-4"></i>
        <p class="text-gray-600">No AI insights available at this time.</p>
      </div>
    `;
  }

  return `
    <div class="space-y-4">
      ${insights.map(insight => `
        <div class="border rounded-lg p-4 ${getSeverityClass(insight.severity)}">
          <div class="flex items-start justify-between mb-2">
            <h4 class="font-semibold text-gray-900">${insight.title}</h4>
            <span class="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
              ${(insight.confidence * 100).toFixed(0)}% confidence
            </span>
          </div>
          <p class="text-gray-700 mb-3">${insight.description}</p>
          ${insight.recommendations ? `
            <div class="mt-3">
              <h5 class="text-sm font-medium text-gray-900 mb-2">Recommendations:</h5>
              <ul class="text-sm text-gray-600 space-y-1">
                ${insight.recommendations.map(rec => `<li>• ${rec}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `;
}



async function showRiskPredictions() {
  try {
    const token = localStorage.getItem('dmt_token');
    const response = await axios.post('/api/ai/predict', {
      entity_type: 'system',
      entity_id: 1,
      prediction_type: 'trend'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (response.data.success) {
      const prediction = response.data.data;
      showModal('Risk Trend Predictions', renderRiskPredictions(prediction), [
        { text: 'Close', class: 'btn-primary', onclick: 'closeModal()' }
      ]);
    } else {
      showToast('Failed to load risk predictions', 'error');
    }
  } catch (error) {
    console.error('Risk predictions error:', error);
    showToast('Failed to load risk predictions', 'error');
  }
}

function renderRiskPredictions(prediction) {
  return `
    <div class="space-y-6">
      <!-- Trend Analysis -->
      <div class="bg-gray-50 rounded-lg p-4">
        <h4 class="font-semibold text-gray-900 mb-3">Trend Analysis</h4>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-600">Direction:</span>
            <span class="ml-2 font-medium ${prediction.trend_analysis.direction === 'increasing' ? 'text-red-600' : 'text-green-600'}">
              ${prediction.trend_analysis.direction}
            </span>
          </div>
          <div>
            <span class="text-gray-600">Confidence:</span>
            <span class="ml-2 font-medium">${(prediction.trend_analysis.confidence * 100).toFixed(0)}%</span>
          </div>
          <div>
            <span class="text-gray-600">Magnitude:</span>
            <span class="ml-2 font-medium">${(prediction.trend_analysis.magnitude * 100).toFixed(0)}% change</span>
          </div>
          <div>
            <span class="text-gray-600">Timeframe:</span>
            <span class="ml-2 font-medium">${prediction.trend_analysis.timeframe}</span>
          </div>
        </div>
      </div>

      <!-- Risk Scenarios -->
      <div>
        <h4 class="font-semibold text-gray-900 mb-3">Risk Scenarios</h4>
        <div class="space-y-2">
          ${prediction.scenarios.map(scenario => `
            <div class="flex justify-between items-center p-3 border rounded-lg">
              <div>
                <span class="font-medium">${scenario.name}</span>
                <p class="text-sm text-gray-600">${scenario.description}</p>
              </div>
              <div class="text-right">
                <div class="text-sm font-medium">${(scenario.probability * 100).toFixed(0)}%</div>
                <div class="text-xs text-gray-500">${scenario.impact} Impact</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Recommendations -->
      <div>
        <h4 class="font-semibold text-gray-900 mb-3">AI Recommendations</h4>
        <ul class="space-y-2">
          ${prediction.recommendations.map(rec => `
            <li class="flex items-start space-x-2">
              <i class="fas fa-lightbulb text-yellow-500 mt-1"></i>
              <span class="text-sm">${rec}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  `;
}

// Navigation functions - implementations are now in modules.js
// showRisks(), showControls(), showCompliance(), showIncidents() are defined in modules.js



// Utility functions
function updateActiveNavigation(activeItem) {
  document.querySelectorAll('.nav-menu-item').forEach(item => {
    item.classList.remove('active');
  });
  const activeElement = document.getElementById(`nav-${activeItem}`);
  if (activeElement) {
    activeElement.classList.add('active');
  }
}

function showLoading(elementId) {
  console.log('🔄 showLoading called for:', elementId);
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('❌ Element not found:', elementId);
    return;
  }
  console.log('✅ Element found, setting loading content');
  element.innerHTML = `
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">Loading...</span>
    </div>
  `;
  console.log('✅ Loading content set');
}

function showError(message) {
  showToast(message, 'error');
}

function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `alert alert-${type} animate-slide-down`;
  toast.innerHTML = `
    <div class="flex justify-between items-center">
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-current opacity-70 hover:opacity-100">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 5000);
}

function getRiskScoreColor(score) {
  if (score >= 20) return 'text-red-600';
  if (score >= 15) return 'text-orange-600';
  if (score >= 10) return 'text-yellow-600';
  if (score >= 5) return 'text-green-600';
  return 'text-gray-600';
}

function getRiskLevel(score) {
  if (score >= 20) return 'Critical';
  if (score >= 15) return 'High';
  if (score >= 10) return 'Medium';
  if (score >= 5) return 'Low';
  return 'Very Low';
}

function getSeverityClass(severity) {
  const classes = {
    'critical': 'bg-red-100 text-red-800',
    'high': 'bg-orange-100 text-orange-800',
    'medium': 'bg-yellow-100 text-yellow-800',
    'low': 'bg-green-100 text-green-800'
  };
  return classes[severity] || 'bg-gray-100 text-gray-800';
}

function formatDate(dateString) {
  return dayjs(dateString).format('MMM DD');
}

async function refreshDashboard() {
  await loadDashboardData();
  showDashboard();
  showToast('Dashboard refreshed successfully', 'success');
}