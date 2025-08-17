// DMT Risk Assessment System - Keycloak Authentication JavaScript

// Keycloak Configuration
const KEYCLOAK_CONFIG = {
  baseUrl: window.location.protocol === 'https:' ? 'https://localhost:8080' : 'http://localhost:8080',
  realm: 'dmt-risk-platform',
  clientId: 'dmt-webapp'
};

// Global authentication state
let currentUser = null;
let isAuthenticated = false;

// Authentication manager for Keycloak
class KeycloakAuthManager {
  constructor() {
    this.baseUrl = KEYCLOAK_CONFIG.baseUrl;
    this.realm = KEYCLOAK_CONFIG.realm;
    this.clientId = KEYCLOAK_CONFIG.clientId;
    
    // Initialize authentication state
    this.initializeAuth();
  }

  async initializeAuth() {
    console.log('KeycloakAuth: Initializing authentication...');
    
    // Check for OAuth callback
    if (this.isOAuthCallback()) {
      console.log('KeycloakAuth: Processing OAuth callback');
      await this.handleOAuthCallback();
      return;
    }

    // Check existing token
    const token = this.getStoredToken();
    if (token && !this.isTokenExpired(token)) {
      console.log('KeycloakAuth: Found valid token, validating...');
      const isValid = await this.validateToken(token.access_token);
      if (isValid) {
        console.log('KeycloakAuth: Token validated successfully');
        this.setAuthenticatedState(true);
        return;
      }
      
      // Token invalid, try refresh
      console.log('KeycloakAuth: Token invalid, attempting refresh...');
      const refreshed = await this.refreshToken(token.refresh_token);
      if (refreshed) {
        console.log('KeycloakAuth: Token refreshed successfully');
        this.setAuthenticatedState(true);
        return;
      }
    }

    // No valid authentication
    console.log('KeycloakAuth: No valid authentication found');
    this.setAuthenticatedState(false);
  }

  // Check if current page is OAuth callback
  isOAuthCallback() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('code') && urlParams.has('state');
  }

  // Handle OAuth callback from Keycloak
  async handleOAuthCallback() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        this.showError(`Authentication failed: ${error}`);
        this.clearAuthData();
        window.location.href = '/';
        return;
      }

      if (!code) {
        console.error('No authorization code received');
        this.showError('Authentication failed: No authorization code');
        this.clearAuthData();
        window.location.href = '/';
        return;
      }

      // Exchange code for tokens via our API
      const response = await fetch('/api/auth/callback?' + new URLSearchParams({
        code: code,
        state: state || ''
      }));

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      // The callback endpoint returns HTML, so we check for success differently
      const responseText = await response.text();
      
      // Check if the response contains success indicators
      if (responseText.includes('Login Successful') && responseText.includes('localStorage.setItem')) {
        console.log('KeycloakAuth: OAuth callback successful');
        
        // Extract token data from the embedded JavaScript (this is handled by the response HTML)
        // The tokens are set by the callback page JavaScript
        setTimeout(() => {
          const token = this.getStoredToken();
          if (token) {
            this.setAuthenticatedState(true);
            window.location.href = '/';
          } else {
            console.error('Tokens not found after callback');
            this.showError('Authentication failed: No tokens received');
            this.clearAuthData();
            window.location.href = '/';
          }
        }, 1000);
        
      } else {
        throw new Error('Authentication callback failed');
      }

    } catch (error) {
      console.error('OAuth callback error:', error);
      this.showError('Authentication failed: ' + error.message);
      this.clearAuthData();
      window.location.href = '/';
    }
  }

  // Initiate Keycloak login
  async login() {
    try {
      console.log('KeycloakAuth: Initiating login...');
      
      const response = await fetch('/api/auth/keycloak/login');
      const data = await response.json();

      if (data.success && data.data.authUrl) {
        console.log('KeycloakAuth: Redirecting to Keycloak login');
        // Store state for callback validation
        localStorage.setItem('keycloak_login_time', Date.now().toString());
        window.location.href = data.data.authUrl;
      } else {
        throw new Error('Failed to get login URL');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showError('Login failed: ' + error.message);
    }
  }

  // Logout from Keycloak
  async logout() {
    try {
      console.log('KeycloakAuth: Logging out...');
      
      const token = this.getStoredToken();
      if (token && token.refresh_token) {
        // Call logout endpoint
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            refresh_token: token.refresh_token
          })
        });
      }

      // Clear local authentication data
      this.clearAuthData();
      this.setAuthenticatedState(false);
      
      console.log('KeycloakAuth: Logout successful');
      window.location.href = '/';
      
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local data even if server logout fails
      this.clearAuthData();
      this.setAuthenticatedState(false);
      window.location.href = '/';
    }
  }

  // Validate token with server
  async validateToken(token) {
    try {
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success && data.data.user) {
        currentUser = data.data.user;
        console.log('KeycloakAuth: User validated:', currentUser);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      console.log('KeycloakAuth: Refreshing token...');
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refresh_token: refreshToken
        })
      });

      const data = await response.json();
      
      if (data.success && data.data.tokens) {
        // Store new tokens
        this.storeTokens(data.data.tokens);
        currentUser = data.data.user;
        console.log('KeycloakAuth: Token refreshed successfully');
        return true;
      } else {
        console.error('Token refresh failed:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  // Get stored token
  getStoredToken() {
    const token = localStorage.getItem('dmt_access_token');
    const refreshToken = localStorage.getItem('dmt_refresh_token');
    const expiresAt = localStorage.getItem('dmt_token_expires');
    const user = localStorage.getItem('dmt_user');

    if (token && refreshToken) {
      return {
        access_token: token,
        refresh_token: refreshToken,
        expires_at: expiresAt,
        user: user ? JSON.parse(user) : null
      };
    }
    return null;
  }

  // Store tokens
  storeTokens(tokens) {
    localStorage.setItem('dmt_access_token', tokens.access_token);
    localStorage.setItem('dmt_refresh_token', tokens.refresh_token);
    localStorage.setItem('dmt_token_expires', (Date.now() + (tokens.expires_in * 1000)).toString());
    
    if (currentUser) {
      localStorage.setItem('dmt_user', JSON.stringify(currentUser));
    }
    
    console.log('KeycloakAuth: Tokens stored successfully');
  }

  // Check if token is expired
  isTokenExpired(token) {
    if (!token.expires_at) return true;
    
    const expiresAt = parseInt(token.expires_at);
    const now = Date.now();
    const buffer = 5 * 60 * 1000; // 5 minutes buffer
    
    return now >= (expiresAt - buffer);
  }

  // Clear authentication data
  clearAuthData() {
    localStorage.removeItem('dmt_access_token');
    localStorage.removeItem('dmt_refresh_token');
    localStorage.removeItem('dmt_token_expires');
    localStorage.removeItem('dmt_user');
    localStorage.removeItem('keycloak_login_time');
    currentUser = null;
    console.log('KeycloakAuth: Authentication data cleared');
  }

  // Set authentication state
  setAuthenticatedState(authenticated) {
    isAuthenticated = authenticated;
    
    if (authenticated) {
      this.showAuthenticatedUI();
    } else {
      this.showUnauthenticatedUI();
    }
  }

  // Show authenticated UI
  showAuthenticatedUI() {
    console.log('KeycloakAuth: Showing authenticated UI');
    
    // Show internal navigation
    const internalNav = document.getElementById('internal-nav');
    if (internalNav) {
      internalNav.classList.remove('hidden');
    }

    // Show notifications container
    const notificationsContainer = document.getElementById('notifications-container');
    if (notificationsContainer) {
      notificationsContainer.classList.remove('hidden');
    }

    // Show ARIA button
    const ariaButton = document.getElementById('aria-button');
    if (ariaButton) {
      ariaButton.classList.remove('hidden');
    }

    // Update welcome message and auth button
    const welcomeMessage = document.getElementById('welcome-message');
    const authButton = document.getElementById('auth-button');
    
    if (currentUser && welcomeMessage) {
      welcomeMessage.textContent = `Welcome, ${currentUser.first_name || currentUser.username}`;
    }
    
    if (authButton) {
      authButton.innerHTML = '<i class="fas fa-sign-out-alt mr-1"></i>Logout';
      authButton.onclick = () => this.logout();
    }

    // Initialize dashboard if we're on main page
    if (window.location.pathname === '/') {
      this.initializeDashboard();
    }
  }

  // Show unauthenticated UI
  showUnauthenticatedUI() {
    console.log('KeycloakAuth: Showing unauthenticated UI');
    
    // Hide internal navigation
    const internalNav = document.getElementById('internal-nav');
    if (internalNav) {
      internalNav.classList.add('hidden');
    }

    // Hide notifications container
    const notificationsContainer = document.getElementById('notifications-container');
    if (notificationsContainer) {
      notificationsContainer.classList.add('hidden');
    }

    // Hide ARIA button
    const ariaButton = document.getElementById('aria-button');
    if (ariaButton) {
      ariaButton.classList.add('hidden');
    }

    // Update welcome message and auth button
    const welcomeMessage = document.getElementById('welcome-message');
    const authButton = document.getElementById('auth-button');
    
    if (welcomeMessage) {
      welcomeMessage.textContent = 'Welcome, Guest';
    }
    
    if (authButton) {
      authButton.innerHTML = '<i class="fas fa-sign-in-alt mr-1"></i>Login';
      authButton.onclick = () => this.login();
    }

    // Show login prompt
    this.showLoginPrompt();
  }

  // Initialize dashboard for authenticated users
  async initializeDashboard() {
    try {
      const token = this.getStoredToken();
      if (!token) return;

      console.log('KeycloakAuth: Initializing dashboard...');
      
      // Call the existing loadDashboard function if it exists
      if (typeof loadDashboard === 'function') {
        await loadDashboard();
      } else {
        console.log('KeycloakAuth: loadDashboard function not found');
      }
    } catch (error) {
      console.error('Dashboard initialization error:', error);
    }
  }

  // Show login prompt
  showLoginPrompt() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    mainContent.innerHTML = `
      <div class="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg">
        <div class="text-center mb-6">
          <div class="mx-auto h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <i class="fas fa-shield-alt text-white text-2xl"></i>
          </div>
          <h2 class="text-2xl font-bold text-gray-900">Secure Access Required</h2>
          <p class="text-gray-600 mt-2">Please authenticate with Keycloak to access the DMT Risk Management Platform</p>
        </div>

        <div class="space-y-4">
          <button onclick="keycloakAuth.login()" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center justify-center space-x-2">
            <i class="fas fa-sign-in-alt"></i>
            <span>Login with Keycloak</span>
          </button>
          
          <div class="text-center text-sm text-gray-500">
            <p>Secure authentication powered by Keycloak IAM</p>
            <p class="mt-1">Supports local accounts and SAML SSO</p>
          </div>
        </div>

        <div class="mt-6 text-center text-xs text-gray-400">
          <p>DMT Risk Management Platform v2.0</p>
          <p>Enterprise GRC with Keycloak Integration</p>
        </div>
      </div>
    `;
  }

  // Show error message
  showError(message) {
    // Create toast notification or use existing showToast function
    if (typeof showToast === 'function') {
      showToast(message, 'error');
    } else {
      console.error('KeycloakAuth Error:', message);
      alert(message); // Fallback
    }
  }

  // Get current user
  getCurrentUser() {
    return currentUser;
  }

  // Check if user is authenticated
  isAuthenticated() {
    return isAuthenticated;
  }

  // Get access token for API calls
  getAccessToken() {
    const token = this.getStoredToken();
    return token ? token.access_token : null;
  }
}

// Initialize Keycloak authentication
const keycloakAuth = new KeycloakAuthManager();

// Export for backward compatibility with existing code
window.keycloakAuth = keycloakAuth;
window.checkAuthentication = async () => {
  return keycloakAuth.isAuthenticated();
};
window.getCurrentUser = () => {
  return keycloakAuth.getCurrentUser();
};

// Override axios defaults to include auth token
if (typeof axios !== 'undefined') {
  axios.interceptors.request.use((config) => {
    const token = keycloakAuth.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  // Handle token refresh on 401 responses
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response && error.response.status === 401) {
        console.log('KeycloakAuth: Received 401, attempting token refresh...');
        const token = keycloakAuth.getStoredToken();
        if (token && token.refresh_token) {
          const refreshed = await keycloakAuth.refreshToken(token.refresh_token);
          if (refreshed) {
            console.log('KeycloakAuth: Token refreshed, retrying request...');
            // Retry the original request with new token
            const newToken = keycloakAuth.getAccessToken();
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return axios.request(error.config);
          }
        }
        
        console.log('KeycloakAuth: Token refresh failed, logging out...');
        keycloakAuth.clearAuthData();
        keycloakAuth.setAuthenticatedState(false);
      }
      return Promise.reject(error);
    }
  );
}

console.log('KeycloakAuth: Authentication manager loaded');

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('KeycloakAuth: DOM ready, starting authentication check...');
  });
} else {
  console.log('KeycloakAuth: DOM already ready, authentication already initializing...');
}