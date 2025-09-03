// DMT Risk Assessment System v2.0 - Authentication JavaScript

document.addEventListener('DOMContentLoaded', async function() {
  const loginForm = document.getElementById('login-form');
  const errorDiv = document.getElementById('login-error');
  
  // Check if user is already logged in with valid token
  const token = localStorage.getItem('aria_token');
  console.log('Auth.js: Checking existing token:', token ? 'Found' : 'Not found');
  
  // Only clear Keycloak tokens if user explicitly chooses legacy auth
  const keycloakToken = localStorage.getItem('dmt_access_token') || localStorage.getItem('dmt_kc_access_token');
  const usingLegacy = new URLSearchParams(window.location.search).get('legacy') === '1';
  if (usingLegacy && keycloakToken) {
    localStorage.removeItem('dmt_access_token');
    localStorage.removeItem('dmt_refresh_token');
    localStorage.removeItem('aria_token_expires');
    localStorage.removeItem('dmt_kc_access_token');
    localStorage.removeItem('dmt_kc_refresh_token');
    localStorage.removeItem('dmt_kc_token_expires');
    console.log('Auth.js: Cleared Keycloak tokens for legacy auth');
  }
  
  // Only check token and redirect if NOT on login page
  if (token && !window.location.pathname.includes('/login')) {
    console.log('Auth.js: Validating existing token...');
    // Validate token before redirecting
    try {
      const response = await axios.get('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        console.log('Auth.js: Token valid, redirecting to dashboard');
        // Valid token, redirect to HTMX dashboard
        window.location.href = '/';
        return;
      } else {
        console.log('Auth.js: Token invalid, clearing storage');
        // Invalid token, clear it and continue to login form
        localStorage.removeItem('aria_token');
        localStorage.removeItem('dmt_expires_at');
        localStorage.removeItem('dmt_user');
      }
    } catch (error) {
      // Token validation failed, clear it and continue to login form
      console.log('Auth.js: Token validation failed, clearing storage:', error.message);
      localStorage.removeItem('aria_token');
      localStorage.removeItem('dmt_expires_at');
      localStorage.removeItem('dmt_user');
    }
  }
  
  console.log('Auth.js: Setting up login form listeners');

  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value.trim();
      
      // Client-side validation
      if (!username || username.length < 3) {
        showError('Username must be at least 3 characters');
        return;
      }
      
      if (!password || password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
      }
      
      // Clear previous errors
      errorDiv.classList.add('hidden');
      
      // Disable submit button
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Signing In...';
      submitBtn.disabled = true;

      try {
        const response = await axios.post('/api/auth/login', {
          username: username,
          password: password
        });

        if (response.data.success) {
          console.log('Auth.js: Login successful, storing token and redirecting');
          // Store token with expiration check
          const token = response.data.token;
          const user = response.data.user;
          const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          
          localStorage.setItem('aria_token', token);
          localStorage.setItem('dmt_expires_at', expiresAt);
          localStorage.setItem('dmt_user', JSON.stringify(user));
          
          console.log('Auth.js: Token stored, redirecting to dashboard');
          // Redirect to home (which will show HTMX dashboard)
          window.location.href = '/';
        } else {
          showError(response.data.error || 'Login failed');
        }
      } catch (error) {
        console.error('Login error:', error);
        if (error.response && error.response.data) {
          showError(error.response.data.error || 'Login failed');
        } else {
          showError('Network error. Please try again.');
        }
      } finally {
        // Re-enable submit button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
      errorDiv.classList.add('hidden');
    }, 5000);
  }

  // Add security: Clear sensitive data on logout
  window.logout = function() {
    localStorage.removeItem('aria_token');
    localStorage.removeItem('dmt_expires_at');
    localStorage.removeItem('dmt_user');
    window.location.href = '/login';
  };
});