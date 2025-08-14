// DMT Risk Assessment System v2.0 - Main Application JavaScript

// Global variables
let currentUser = null;
let dashboardData = null;

// Initialize application
document.addEventListener('DOMContentLoaded', async function() {
  console.log('DOM loaded, initializing app...');
  
  // Always initialize navigation first
  try {
    console.log('Initializing navigation...');
    initializeNavigation();
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
  
  // Check authentication and initialize dashboard
  try {
    const authResult = await checkAuthentication();
    console.log('Auth check result:', authResult);
    
    if (authResult) {
      console.log('Initializing dashboard...');
      initializeDashboard();
    }
  } catch (error) {
    console.error('Authentication/Dashboard error:', error);
    // Show a basic dashboard even if auth fails
    showBasicDashboard();
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
    console.log('No token found, showing login prompt');
    showLoginPrompt();
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
    // Clear invalid token and show login prompt
    localStorage.removeItem('dmt_token');
    localStorage.removeItem('dmt_user');
    showLoginPrompt();
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
function initializeNavigation() {
  console.log('initializeNavigation called');
  
  // Since navigation is now in static HTML, just add event handlers
  const navLinks = [
    { id: 'nav-dashboard', page: 'dashboard' },
    { id: 'nav-risks', page: 'risks' },
    { id: 'nav-controls', page: 'controls' },
    { id: 'nav-compliance', page: 'compliance' },
    { id: 'nav-incidents', page: 'incidents' },
    { id: 'nav-assets', page: 'assets' },
    { id: 'nav-services', page: 'services' },
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
  updateAuthUI();
  
  console.log('Navigation initialization complete');
}

// Update authentication UI
function updateAuthUI() {
  const token = localStorage.getItem('dmt_token');
  const isLoggedIn = !!token;
  
  const welcomeMessage = document.getElementById('welcome-message');
  const authButton = document.getElementById('auth-button');
  
  if (welcomeMessage) {
    welcomeMessage.textContent = `Welcome, ${currentUser?.first_name || (isLoggedIn ? 'User' : 'Guest')}`;
  }
  
  if (authButton) {
    if (isLoggedIn) {
      authButton.innerHTML = '<i class="fas fa-sign-out-alt mr-1"></i>Logout';
      authButton.className = 'text-sm text-gray-500 hover:text-gray-700';
    } else {
      authButton.innerHTML = '<i class="fas fa-sign-in-alt mr-1"></i>Login';
      authButton.className = 'text-sm text-blue-600 hover:text-blue-700';
    }
  }
}

// Universal navigation function
function navigateTo(page) {
  console.log('Navigating to:', page);
  
  // Update active navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  const activeItem = document.getElementById(`nav-${page}`);
  if (activeItem) {
    activeItem.classList.add('active');
  }
  
  // Check if user needs to be authenticated for this page
  const token = localStorage.getItem('dmt_token');
  if (!token && page !== 'dashboard') {
    showLoginPrompt();
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
      case 'settings':
        if (typeof showSettings === 'function') {
          showSettings();
        } else {
          showPlaceholder('Settings', 'Settings module loading...', 'cog');
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
  localStorage.removeItem('dmt_token');
  localStorage.removeItem('dmt_user');
  window.location.href = '/login';
}

// Dashboard functionality
async function initializeDashboard() {
  await loadDashboardData();
  showDashboard();
}

async function loadDashboardData() {
  try {
    showLoading('main-content');
    
    const token = localStorage.getItem('dmt_token');
    const response = await axios.get('/api/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (response.data.success) {
      dashboardData = response.data.data;
    } else {
      throw new Error('Failed to load dashboard data');
    }
  } catch (error) {
    console.error('Dashboard error:', error);
    showError('Failed to load dashboard data');
  }
}

function showDashboard() {
  updateActiveNavigation('dashboard');
  
  const mainContent = document.getElementById('main-content');
  
  if (!dashboardData) {
    showLoading('main-content');
    return;
  }
  
  mainContent.innerHTML = `
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex justify-between items-center">
        <h2 class="text-2xl font-bold text-gray-900">Risk Dashboard</h2>
        <div class="flex space-x-3">
          <button onclick="refreshDashboard()" class="btn-secondary">
            <i class="fas fa-sync-alt mr-2"></i>Refresh
          </button>
          <button onclick="showReports()" class="btn-primary">
            <i class="fas fa-chart-bar mr-2"></i>Reports
          </button>
        </div>
      </div>
      
      <!-- Key Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div class="metric-card">
          <div>
            <div class="metric-value text-blue-600">${dashboardData.total_risks}</div>
            <div class="metric-label">Total Active Risks</div>
          </div>
          <div class="metric-icon bg-blue-100 text-blue-600">
            <i class="fas fa-exclamation-triangle"></i>
          </div>
        </div>
        
        <div class="metric-card">
          <div>
            <div class="metric-value text-red-600">${dashboardData.high_risks}</div>
            <div class="metric-label">High/Critical Risks</div>
          </div>
          <div class="metric-icon bg-red-100 text-red-600">
            <i class="fas fa-fire"></i>
          </div>
        </div>
        
        <div class="metric-card">
          <div>
            <div class="metric-value text-orange-600">${dashboardData.open_findings}</div>
            <div class="metric-label">Open Findings</div>
          </div>
          <div class="metric-icon bg-orange-100 text-orange-600">
            <i class="fas fa-clipboard-list"></i>
          </div>
        </div>
        
        <div class="metric-card">
          <div>
            <div class="metric-value text-green-600">${dashboardData.compliance_score}%</div>
            <div class="metric-label">Compliance Score</div>
          </div>
          <div class="metric-icon bg-green-100 text-green-600">
            <i class="fas fa-check-circle"></i>
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
  
  // Initialize charts
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
      ariaModal.classList.remove('hidden');
      ariaInput.focus();
    });
  }

  if (closeAria && ariaModal) {
    closeAria.addEventListener('click', function() {
      ariaModal.classList.add('hidden');
    });
  }

  sendAria.addEventListener('click', sendARIAMessage);
  
  ariaInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendARIAMessage();
    }
  });
}

async function sendARIAMessage() {
  const ariaInput = document.getElementById('aria-input');
  const ariaChat = document.getElementById('aria-chat');
  const query = ariaInput.value.trim();
  
  if (!query) return;
  
  // Add user message
  ariaChat.innerHTML += `
    <div class="mb-4">
      <div class="text-right">
        <div class="inline-block bg-blue-100 text-blue-800 rounded-lg px-3 py-2 text-sm">
          ${query}
        </div>
      </div>
    </div>
  `;
  
  ariaInput.value = '';
  ariaChat.scrollTop = ariaChat.scrollHeight;
  
  // Add loading message
  ariaChat.innerHTML += `
    <div class="mb-4" id="aria-loading">
      <div class="text-left">
        <div class="inline-block bg-gray-100 text-gray-800 rounded-lg px-3 py-2 text-sm">
          <i class="fas fa-spinner fa-spin mr-2"></i>ARIA is thinking...
        </div>
      </div>
    </div>
  `;
  
  try {
    const token = localStorage.getItem('dmt_token');
    const response = await axios.post('/api/aria/query', 
      { query: query },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    // Remove loading message
    document.getElementById('aria-loading').remove();
    
    if (response.data.success) {
      ariaChat.innerHTML += `
        <div class="mb-4">
          <div class="text-left">
            <div class="inline-block bg-gray-100 text-gray-800 rounded-lg px-3 py-2 text-sm">
              <i class="fas fa-robot mr-2 text-blue-600"></i>${response.data.data.response}
            </div>
          </div>
        </div>
      `;
    } else {
      ariaChat.innerHTML += `
        <div class="mb-4">
          <div class="text-left">
            <div class="inline-block bg-red-100 text-red-800 rounded-lg px-3 py-2 text-sm">
              Sorry, I encountered an error. Please try again.
            </div>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('ARIA error:', error);
    document.getElementById('aria-loading').remove();
    ariaChat.innerHTML += `
      <div class="mb-4">
        <div class="text-left">
          <div class="inline-block bg-red-100 text-red-800 rounded-lg px-3 py-2 text-sm">
            Sorry, I'm temporarily unavailable. Please try again later.
          </div>
        </div>
      </div>
    `;
  }
  
  ariaChat.scrollTop = ariaChat.scrollHeight;
}

// Navigation functions - implementations are now in modules.js
// showRisks(), showControls(), showCompliance(), showIncidents() are defined in modules.js



// Utility functions
function updateActiveNavigation(activeItem) {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  const activeElement = document.getElementById(`nav-${activeItem}`);
  if (activeElement) {
    activeElement.classList.add('active');
  }
}

function showLoading(elementId) {
  const element = document.getElementById(elementId);
  element.innerHTML = `
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span class="ml-3 text-gray-600">Loading...</span>
    </div>
  `;
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