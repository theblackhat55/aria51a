// DMT Risk Assessment Platform - Keycloak-Only Authentication
// Replaces basic authentication completely

class DMTKeycloakAuth {
  constructor() {
    this.baseUrl = window.location.origin;
    this.storagePrefix = 'dmt_kc_';
    this.initialized = false;
    this.init();
  }

  async init() {
    if (this.initialized) return;
    
    console.log('🔐 DMT Keycloak Auth: Initializing...');
    
    // Check for existing Keycloak tokens
    const accessToken = this.getStoredToken('access_token');
    const refreshToken = this.getStoredToken('refresh_token');
    const tokenExpires = this.getStoredToken('token_expires');
    
    // Clear any legacy tokens
    this.clearLegacyTokens();
    
    if (accessToken && tokenExpires) {
      const now = Date.now();
      const expiresAt = parseInt(tokenExpires);
      
      console.log('🔐 Found stored tokens, checking validity...');
      
      if (now < expiresAt - 60000) { // 1 minute buffer
        console.log('🔐 Token still valid, validating with server...');
        
        if (await this.validateToken(accessToken)) {
          console.log('🔐 Token validated, user is authenticated');
          this.handleAuthenticated();
          this.initialized = true;
          return;
        }
      } else if (refreshToken) {
        console.log('🔐 Token expired, attempting refresh...');
        
        if (await this.refreshToken(refreshToken)) {
          console.log('🔐 Token refreshed successfully');
          this.handleAuthenticated();
          this.initialized = true;
          return;
        }
      }
    }
    
    console.log('🔐 No valid authentication found');
    this.clearStoredTokens();
    this.handleUnauthenticated();
    
    this.initialized = true;
  }

  // Clear legacy authentication tokens
  clearLegacyTokens() {
    const legacyKeys = ['dmt_token', 'dmt_expires_at', 'dmt_user'];
    legacyKeys.forEach(key => localStorage.removeItem(key));
  }

  // Get Keycloak login URL from backend
  async getKeycloakLoginUrl() {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/keycloak/login`);
      const data = await response.json();
      
      if (data.success) {
        return data.data.authUrl;
      } else {
        throw new Error(data.error || 'Failed to get login URL');
      }
    } catch (error) {
      console.error('🔐 Failed to get Keycloak login URL:', error);
      throw error;
    }
  }

  // Redirect to Keycloak for authentication
  async login() {
    try {
      console.log('🔐 Initiating Keycloak login...');
      this.showLoginLoader();
      
      const loginUrl = await this.getKeycloakLoginUrl();
      console.log('🔐 Redirecting to Keycloak...');
      
      // Store current page for redirect after login
      sessionStorage.setItem('dmt_return_url', window.location.pathname);
      
      window.location.href = loginUrl;
    } catch (error) {
      console.error('🔐 Keycloak login failed:', error);
      this.hideLoginLoader();
      this.showError('Failed to initiate login: ' + error.message);
    }
  }

  // Validate token with server
  async validateToken(accessToken) {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/user`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.storeUser(data.data.user);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('🔐 Token validation failed:', error);
      return false;
    }
  }

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ refresh_token: refreshToken })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          this.storeTokens(data.data.tokens);
          this.storeUser(data.data.user);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('🔐 Token refresh failed:', error);
      return false;
    }
  }

  // Handle authenticated state
  handleAuthenticated() {
    console.log('🔐 User is authenticated');
    
    // If on login page, redirect to return URL or dashboard
    if (window.location.pathname === '/login') {
      const returnUrl = sessionStorage.getItem('dmt_return_url') || '/';
      sessionStorage.removeItem('dmt_return_url');
      console.log('🔐 Redirecting to:', returnUrl);
      window.location.href = returnUrl;
      return;
    }
    
    // Update UI for authenticated state
    this.showAuthenticatedState();
    this.hideLoginPrompt();
    
    // Emit custom event for other components
    window.dispatchEvent(new CustomEvent('dmtAuthStateChanged', {
      detail: { authenticated: true, user: this.getStoredUser() }
    }));
  }

  // Handle unauthenticated state
  handleUnauthenticated() {
    console.log('🔐 User is not authenticated');
    
    // If on protected page, redirect to login
    if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
      sessionStorage.setItem('dmt_return_url', window.location.pathname);
      window.location.href = '/login';
      return;
    }
    
    // Show login prompt if on main page
    if (window.location.pathname === '/') {
      this.showLoginPrompt();
    }
    
    // Emit custom event
    window.dispatchEvent(new CustomEvent('dmtAuthStateChanged', {
      detail: { authenticated: false }
    }));
  }

  // Show authenticated state in UI
  showAuthenticatedState() {
    const user = this.getStoredUser();
    if (!user) return;
    
    console.log('🔐 Showing authenticated state for:', user.username);
    
    // Update user display
    const userDisplay = document.getElementById('user-display');
    if (userDisplay) {
      userDisplay.innerHTML = `
        <div class="flex items-center space-x-3">
          <div class="flex items-center space-x-2">
            <div class="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
              <i class="fas fa-user text-blue-600 text-sm"></i>
            </div>
            <div>
              <div class="text-sm font-medium text-gray-900">${user.first_name || user.username}</div>
              <div class="text-xs text-gray-500">${user.role}</div>
            </div>
          </div>
          <button onclick="window.dmtAuth.logout()" class="text-xs text-gray-400 hover:text-gray-600">
            <i class="fas fa-sign-out-alt"></i>
          </button>
        </div>
      `;
    }
    
    // Show authenticated navigation
    const internalNav = document.getElementById('internal-nav');
    if (internalNav) {
      internalNav.classList.remove('hidden');
    }
    
    // Hide login elements
    const loginPrompts = document.querySelectorAll('.login-prompt, #login-prompt');
    loginPrompts.forEach(prompt => {
      if (prompt) prompt.style.display = 'none';
    });
  }

  // Show login prompt for unauthenticated users
  showLoginPrompt() {
    // Only show on main page
    if (window.location.pathname !== '/') return;
    
    const app = document.getElementById('app');
    if (!app) return;
    
    // Remove existing prompts
    const existingPrompt = document.getElementById('login-prompt');
    if (existingPrompt) existingPrompt.remove();
    
    const loginPrompt = document.createElement('div');
    loginPrompt.id = 'login-prompt';
    loginPrompt.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    loginPrompt.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl p-8 max-w-md w-full mx-4">
        <div class="text-center">
          <div class="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <i class="fas fa-shield-alt text-white text-xl"></i>
          </div>
          <h2 class="text-xl font-bold text-gray-900 mb-2">Authentication Required</h2>
          <p class="text-gray-600 mb-6">Please login with Keycloak to access the DMT Risk Management Platform</p>
          
          <div class="space-y-4">
            <button onclick="window.dmtAuth.login()" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition-colors duration-200">
              <i class="fas fa-sign-in-alt mr-2"></i>
              Login with Keycloak SSO
            </button>
            
            <div class="text-xs text-gray-500">
              <p>Enterprise Single Sign-On</p>
              <p>Secure • Role-Based • OIDC Compliant</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(loginPrompt);
  }

  hideLoginPrompt() {
    const loginPrompt = document.getElementById('login-prompt');
    if (loginPrompt) {
      loginPrompt.remove();
    }
  }

  showLoginLoader() {
    const existingLoader = document.getElementById('login-loader');
    if (existingLoader) return;
    
    const loader = document.createElement('div');
    loader.id = 'login-loader';
    loader.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    loader.innerHTML = `
      <div class="bg-white rounded-lg p-8 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-700">Redirecting to Keycloak...</p>
      </div>
    `;
    
    document.body.appendChild(loader);
  }

  hideLoginLoader() {
    const loader = document.getElementById('login-loader');
    if (loader) loader.remove();
  }

  // Logout
  async logout() {
    try {
      const refreshToken = this.getStoredToken('refresh_token');
      
      if (refreshToken) {
        await fetch(`${this.baseUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ refresh_token: refreshToken })
        });
      }
    } catch (error) {
      console.error('🔐 Logout API call failed:', error);
    } finally {
      console.log('🔐 Logging out, clearing tokens');
      this.clearStoredTokens();
      this.clearLegacyTokens();
      
      // Emit logout event
      window.dispatchEvent(new CustomEvent('dmtAuthStateChanged', {
        detail: { authenticated: false }
      }));
      
      window.location.href = '/login';
    }
  }

  // Token storage methods
  storeTokens(tokens) {
    localStorage.setItem(this.storagePrefix + 'access_token', tokens.access_token);
    localStorage.setItem(this.storagePrefix + 'refresh_token', tokens.refresh_token);
    localStorage.setItem(this.storagePrefix + 'token_expires', (Date.now() + (tokens.expires_in * 1000)).toString());
    console.log('🔐 Tokens stored');
  }

  storeUser(user) {
    localStorage.setItem(this.storagePrefix + 'user', JSON.stringify(user));
    console.log('🔐 User data stored');
  }

  getStoredToken(type) {
    return localStorage.getItem(this.storagePrefix + type);
  }

  getStoredUser() {
    const userStr = localStorage.getItem(this.storagePrefix + 'user');
    return userStr ? JSON.parse(userStr) : null;
  }

  clearStoredTokens() {
    localStorage.removeItem(this.storagePrefix + 'access_token');
    localStorage.removeItem(this.storagePrefix + 'refresh_token');
    localStorage.removeItem(this.storagePrefix + 'token_expires');
    localStorage.removeItem(this.storagePrefix + 'user');
    console.log('🔐 All tokens cleared');
  }

  // Get authorization header for API calls
  getAuthHeader() {
    const token = this.getStoredToken('access_token');
    return token ? `Bearer ${token}` : null;
  }

  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getStoredToken('access_token');
    const expires = this.getStoredToken('token_expires');
    
    if (!token || !expires) return false;
    
    return Date.now() < (parseInt(expires) - 60000); // 1 minute buffer
  }

  // Show error message
  showError(message) {
    console.error('🔐 DMT Auth Error:', message);
    
    const errorDiv = document.getElementById('keycloak-error');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.remove('hidden');
      
      setTimeout(() => {
        errorDiv.classList.add('hidden');
      }, 5000);
    } else {
      alert('Authentication Error: ' + message);
    }
  }
}

// Initialize global authentication instance
window.dmtAuth = new DMTKeycloakAuth();

// Global logout function for compatibility
window.logout = function() {
  window.dmtAuth.logout();
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
  console.log('🔐 DMT Keycloak-Only Auth: DOM loaded, initializing...');
  
  // Setup login buttons
  document.querySelectorAll('.keycloak-login-btn, [data-keycloak-login]').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      window.dmtAuth.login();
    });
  });
  
  // Auto-configure axios if available
  if (window.axios) {
    axios.interceptors.request.use(config => {
      const authHeader = window.dmtAuth.getAuthHeader();
      if (authHeader) {
        config.headers.Authorization = authHeader;
      }
      return config;
    });
    
    // Handle 401 responses
    axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          console.log('🔐 API returned 401, redirecting to login');
          window.dmtAuth.logout();
        }
        return Promise.reject(error);
      }
    );
  }
});

console.log('🔐 DMT Keycloak-Only Auth loaded successfully');