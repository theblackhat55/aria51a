// DMT Risk Assessment System - Keycloak Authentication JavaScript

class KeycloakAuth {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.storagePrefix = 'dmt_kc_';
    this.init();
  }

  async init() {
    console.log('Keycloak Auth: Initializing...');
    
    // Check for existing Keycloak tokens
    const accessToken = this.getStoredToken('access_token');
    const refreshToken = this.getStoredToken('refresh_token');
    const tokenExpires = this.getStoredToken('token_expires');
    
    if (accessToken && tokenExpires) {
      const now = Date.now();
      const expiresAt = parseInt(tokenExpires);
      
      console.log('Keycloak Auth: Found stored tokens');
      console.log('Token expires at:', new Date(expiresAt).toISOString());
      console.log('Current time:', new Date(now).toISOString());
      
      if (now < expiresAt - 60000) { // 1 minute buffer
        console.log('Keycloak Auth: Token still valid, validating with server...');
        
        // Validate token with server
        if (await this.validateToken(accessToken)) {
          console.log('Keycloak Auth: Token validated, user is authenticated');
          await this.handleAuthenticated();
          return;
        }
      } else if (refreshToken) {
        console.log('Keycloak Auth: Token expired, attempting refresh...');
        
        // Try to refresh token
        if (await this.refreshToken(refreshToken)) {
          console.log('Keycloak Auth: Token refreshed successfully');
          await this.handleAuthenticated();
          return;
        }
      }
    }
    
    console.log('Keycloak Auth: No valid authentication found');
    this.clearStoredTokens();
  }

  // Get login URL from backend
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
      console.error('Failed to get Keycloak login URL:', error);
      throw error;
    }
  }

  // Redirect to Keycloak for authentication
  async login() {
    try {
      console.log('Keycloak Auth: Initiating login...');
      const loginUrl = await this.getKeycloakLoginUrl();
      console.log('Keycloak Auth: Redirecting to:', loginUrl);
      window.location.href = loginUrl;
    } catch (error) {
      console.error('Keycloak login failed:', error);
      this.showError('Failed to initiate Keycloak login: ' + error.message);
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
      console.error('Token validation failed:', error);
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
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // Handle authenticated state
  async handleAuthenticated() {
    console.log('Keycloak Auth: User is authenticated');
    
    // If on login page, redirect to dashboard
    if (window.location.pathname === '/login') {
      console.log('Keycloak Auth: On login page, redirecting to dashboard');
      window.location.href = '/';
      return;
    }
    
    // If on main app, show authenticated state
    this.showAuthenticatedState();
  }

  // Show authenticated state in UI
  showAuthenticatedState() {
    const user = this.getStoredUser();
    if (!user) return;
    
    console.log('Keycloak Auth: Showing authenticated state for:', user.username);
    
    // Update UI elements
    const userDisplay = document.getElementById('user-display');
    if (userDisplay) {
      userDisplay.innerHTML = `
        <div class="flex items-center space-x-2">
          <i class="fas fa-user-circle text-gray-600"></i>
          <span class="text-sm font-medium">${user.first_name || user.username}</span>
          <span class="text-xs text-gray-500">(${user.role})</span>
        </div>
      `;
    }
    
    // Show authenticated navigation
    const internalNav = document.getElementById('internal-nav');
    if (internalNav) {
      internalNav.classList.remove('hidden');
    }
    
    // Hide login elements
    const loginPrompt = document.getElementById('login-prompt');
    if (loginPrompt) {
      loginPrompt.style.display = 'none';
    }
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
      console.error('Logout API call failed:', error);
    } finally {
      console.log('Keycloak Auth: Logging out, clearing tokens');
      this.clearStoredTokens();
      window.location.href = '/login';
    }
  }

  // Token storage methods
  storeTokens(tokens) {
    localStorage.setItem(this.storagePrefix + 'access_token', tokens.access_token);
    localStorage.setItem(this.storagePrefix + 'refresh_token', tokens.refresh_token);
    localStorage.setItem(this.storagePrefix + 'token_expires', (Date.now() + (tokens.expires_in * 1000)).toString());
    console.log('Keycloak Auth: Tokens stored');
  }

  storeUser(user) {
    localStorage.setItem(this.storagePrefix + 'user', JSON.stringify(user));
    console.log('Keycloak Auth: User data stored');
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
    console.log('Keycloak Auth: All tokens cleared');
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
    console.error('Keycloak Auth Error:', message);
    
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

// Global instance
window.keycloakAuth = new KeycloakAuth();

// Global logout function for compatibility
window.keycloakLogout = function() {
  window.keycloakAuth.logout();
};

// Setup Keycloak login button handlers
document.addEventListener('DOMContentLoaded', function() {
  console.log('Keycloak Auth: DOM loaded, setting up handlers');
  
  // Enable Keycloak login button on login page
  const keycloakInfo = document.getElementById('keycloak-info');
  if (keycloakInfo) {
    keycloakInfo.style.display = 'block';
    console.log('Keycloak Auth: Enabled Keycloak login section');
  }
  
  // Setup Keycloak login button
  const keycloakLoginBtn = document.querySelector('[onclick*="keycloak/login"]');
  if (keycloakLoginBtn) {
    keycloakLoginBtn.onclick = function(e) {
      e.preventDefault();
      window.keycloakAuth.login();
    };
  }
  
  // Setup any other Keycloak login buttons
  document.querySelectorAll('.keycloak-login-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      window.keycloakAuth.login();
    });
  });
});