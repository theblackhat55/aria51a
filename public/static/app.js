// ARIA5.1 - HTMX Edition - Main Application JavaScript
// This file provides HTMX enhancements and authentication helpers

// Global ARIA5 namespace
window.ARIA5 = window.ARIA5 || {};

// Authentication helpers for HTMX requests
window.ARIA5.auth = {
  // Get auth token from localStorage or cookies
  getToken() {
    return localStorage.getItem('aria_token') || this.getCookie('aria_token');
  },
  
  // Get cookie value
  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  },
  
  // Check if user is authenticated
  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const decoded = JSON.parse(atob(token));
      return decoded.expires > Date.now();
    } catch (e) {
      return false;
    }
  },
  
  // Get current user data
  getCurrentUser() {
    const userStr = localStorage.getItem('aria_user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch (e) {
      return null;
    }
  }
};

// HTMX request interceptor to add authentication
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 ARIA5.1 HTMX Edition initialized');
  
  // Add authentication to all HTMX requests
  document.body.addEventListener('htmx:configRequest', function(event) {
    const token = window.ARIA5.auth.getToken();
    if (token) {
      event.detail.headers['Authorization'] = 'Bearer ' + token;
    }
  });
  
  // Handle HTMX authentication errors
  document.body.addEventListener('htmx:responseError', function(event) {
    if (event.detail.xhr.status === 401) {
      console.log('Authentication failed, redirecting to login');
      localStorage.removeItem('aria_token');
      localStorage.removeItem('aria_user');
      window.location.href = '/login';
    }
  });
  
  // Modal management
  window.ARIA5.modals = {
    // Open modal from HTMX response
    open(content) {
      const modalContainer = document.getElementById('modal-container');
      if (modalContainer) {
        modalContainer.innerHTML = content;
        modalContainer.style.display = 'block';
      }
    },
    
    // Close modal
    close() {
      const modalContainer = document.getElementById('modal-container');
      if (modalContainer) {
        modalContainer.innerHTML = '';
        modalContainer.style.display = 'none';
      }
    }
  };
  
  // Close modal on escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      window.ARIA5.modals.close();
    }
  });
  
  // Check authentication status on page load
  if (!window.ARIA5.auth.isAuthenticated() && !window.location.pathname.includes('/login')) {
    console.log('Not authenticated, redirecting to login');
    window.location.href = '/login';
  }
});

// Global functions for HTMX compatibility (backwards compatibility)
function closeModal() {
  window.ARIA5.modals.close();
}

function showNotification(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  
  const toast = document.createElement('div');
  toast.className = `p-4 rounded-lg shadow-lg text-white transition-all duration-300 transform translate-x-full`;
  
  switch (type) {
    case 'success':
      toast.className += ' bg-green-500';
      break;
    case 'error':
      toast.className += ' bg-red-500';
      break;
    case 'warning':
      toast.className += ' bg-yellow-500';
      break;
    default:
      toast.className += ' bg-blue-500';
  }
  
  toast.innerHTML = `
    <div class="flex items-center justify-between">
      <span>${message}</span>
      <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
        <i class="fas fa-times"></i>
      </button>
    </div>
  `;
  
  container.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.className = toast.className.replace('translate-x-full', 'translate-x-0');
  }, 100);
  
  // Auto remove after 5 seconds
  setTimeout(() => {
    if (toast.parentElement) {
      toast.className = toast.className.replace('translate-x-0', 'translate-x-full');
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 300);
    }
  }, 5000);
}

// Debug helpers
window.ARIA5.debug = {
  checkAuth() {
    console.log('Authentication Status:', window.ARIA5.auth.isAuthenticated());
    console.log('Current User:', window.ARIA5.auth.getCurrentUser());
    console.log('Token:', window.ARIA5.auth.getToken()?.substring(0, 50) + '...');
  },
  
  testModal() {
    fetch('/risks/modal/create')
      .then(response => response.text())
      .then(html => {
        window.ARIA5.modals.open(html);
      })
      .catch(error => {
        console.error('Modal test failed:', error);
      });
  }
};

console.log('✅ ARIA5.1 HTMX application loaded successfully');