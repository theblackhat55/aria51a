// DMT Risk Assessment Platform - Native Authentication
// Simple JWT-based authentication for native deployment

class DMTNativeAuth {
  constructor() {
    this.baseUrl = window.location.origin;
    this.storagePrefix = 'dmt_native_';
    this.initialized = false;
    this.init();
  }

  async init() {
    if (this.initialized) return;
    
    console.log('🔐 DMT Native Auth: Initializing...');
    
    // Check for existing tokens
    const token = this.getStoredToken();
    
    if (token) {
      console.log('🔐 Found stored token, validating...');
      
      if (await this.validateToken(token)) {
        console.log('🔐 Token validated, user is authenticated');
        this.handleAuthenticated();
        this.initialized = true;
        return;
      } else {
        console.log('🔐 Token invalid, clearing storage');
        this.clearAuth();
      }
    }
    
    console.log('🔐 No valid authentication found');
    this.handleUnauthenticated();
    this.initialized = true;
  }

  getStoredToken() {
    return localStorage.getItem(this.storagePrefix + 'token');
  }

  setStoredToken(token) {
    localStorage.setItem(this.storagePrefix + 'token', token);
  }

  clearAuth() {
    localStorage.removeItem(this.storagePrefix + 'token');
    localStorage.removeItem(this.storagePrefix + 'user');
    localStorage.removeItem(this.storagePrefix + 'expires_at');
  }

  async validateToken(token) {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.user) {
          // Store user info
          localStorage.setItem(this.storagePrefix + 'user', JSON.stringify(data.data.user));
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('🔐 Token validation failed:', error);
      return false;
    }
  }

  async login(credentials) {
    try {
      console.log('🔐 Attempting login...');
      
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      
      if (data.success && data.data.token) {
        console.log('🔐 Login successful');
        
        // Store authentication data
        this.setStoredToken(data.data.token);
        localStorage.setItem(this.storagePrefix + 'user', JSON.stringify(data.data.user));
        localStorage.setItem(this.storagePrefix + 'expires_at', data.data.expires_at);
        
        this.handleAuthenticated();
        return { success: true, user: data.data.user };
      } else {
        console.log('🔐 Login failed:', data.error);
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('🔐 Login error:', error);
      return { success: false, error: 'Network error occurred' };
    }
  }

  logout() {
    console.log('🔐 Logging out...');
    this.clearAuth();
    this.handleUnauthenticated();
  }

  getCurrentUser() {
    const userStr = localStorage.getItem(this.storagePrefix + 'user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isAuthenticated() {
    const token = this.getStoredToken();
    const expiresAt = localStorage.getItem(this.storagePrefix + 'expires_at');
    
    if (!token || !expiresAt) return false;
    
    return new Date(expiresAt) > new Date();
  }

  handleAuthenticated() {
    console.log('🔐 User authenticated, redirecting to dashboard...');
    
    if (window.location.pathname === '/login' || window.location.pathname === '/') {
      window.location.href = `${this.baseUrl}/#dashboard`;
    }
    
    // Hide login forms
    const loginContainer = document.getElementById('login-container');
    if (loginContainer) {
      loginContainer.style.display = 'none';
    }
    
    // Show main app
    this.showMainApp();
  }

  handleUnauthenticated() {
    console.log('🔐 User not authenticated');
    
    if (window.location.pathname !== '/login' && !window.location.pathname.includes('login')) {
      // Don't redirect if already on login page
      if (!window.location.hash.includes('login')) {
        console.log('🔐 Redirecting to login...');
        window.location.href = `${this.baseUrl}/login`;
      }
    }
  }

  showMainApp() {
    // If we're on the main page, initialize the app
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.initializeMainApp());
      } else {
        this.initializeMainApp();
      }
    }
  }

  initializeMainApp() {
    // Hide loading spinner
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) {
      loadingSpinner.style.display = 'none';
    }
    
    // Show main content
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.style.display = 'block';
    }
    
    // Load dashboard by default
    if (typeof window.loadModule === 'function') {
      window.loadModule('dashboard');
    }
  }

  // Utility methods for backward compatibility
  getToken() {
    return this.getStoredToken();
  }
  
  getUser() {
    return this.getCurrentUser();
  }
}

// Initialize global auth instance
window.dmtAuth = new DMTNativeAuth();

// For backward compatibility
window.dmtKeycloakAuth = window.dmtAuth;