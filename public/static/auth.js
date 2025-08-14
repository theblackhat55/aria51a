// DMT Risk Assessment System v2.0 - Authentication JavaScript

document.addEventListener('DOMContentLoaded', function() {
  const loginForm = document.getElementById('login-form');
  const errorDiv = document.getElementById('login-error');
  
  // Check if user is already logged in
  const token = localStorage.getItem('dmt_token');
  if (token) {
    // Redirect to dashboard if already logged in
    window.location.href = '/';
    return;
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      
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
          // Store token and user data
          localStorage.setItem('dmt_token', response.data.data.token);
          localStorage.setItem('dmt_user', JSON.stringify(response.data.data.user));
          
          // Redirect to dashboard
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
  }
});