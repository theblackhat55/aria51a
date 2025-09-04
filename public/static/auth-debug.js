// Authentication Debug Helper
// This script helps diagnose and fix authentication issues with dropdowns and modals

(function() {
  console.log('🔍 Authentication Debug Helper Loaded');
  
  // Track authentication state
  window.debugAuth = {
    checkAuth: function() {
      const token = localStorage.getItem('aria_token');
      const user = localStorage.getItem('dmt_user');
      const currentUser = window.currentUser;
      
      console.log('🔐 Authentication Status:');
      console.log('  Token present:', !!token);
      console.log('  User data present:', !!user);
      console.log('  CurrentUser loaded:', !!currentUser);
      
      if (token) {
        console.log('  Token preview:', token.substring(0, 30) + '...');
      }
      
      return {
        hasToken: !!token,
        hasUserData: !!user,
        hasCurrentUser: !!currentUser,
        isAuthenticated: !!(token && currentUser)
      };
    },
    
    // Fix authentication state
    fixAuth: async function() {
      const token = localStorage.getItem('aria_token');
      const userData = localStorage.getItem('dmt_user');
      
      if (token && userData && !window.currentUser) {
        console.log('🔧 Fixing authentication state...');
        try {
          window.currentUser = JSON.parse(userData);
          console.log('✅ CurrentUser restored from localStorage');
          
          // Update UI
          if (typeof updateAuthUI === 'function') {
            await updateAuthUI();
            console.log('✅ Auth UI updated');
          }
        } catch (error) {
          console.error('❌ Failed to restore user:', error);
        }
      }
    },
    
    // Monitor click events
    monitorClicks: function() {
      console.log('👁️ Monitoring click events...');
      
      document.addEventListener('click', function(e) {
        const target = e.target;
        
        // Check if click is on dropdown or modal elements
        if (target.closest('.dropdown-toggle') || 
            target.closest('.dropdown-menu') ||
            target.closest('[x-data]') ||
            target.closest('#universal-modal-overlay') ||
            target.closest('.modal')) {
          
          const authStatus = window.debugAuth.checkAuth();
          
          if (!authStatus.isAuthenticated) {
            console.warn('⚠️ Click on interactive element but user not authenticated!');
            console.log('  Element:', target);
            console.log('  Auth status:', authStatus);
            
            // Try to fix authentication
            window.debugAuth.fixAuth();
          }
        }
      }, true); // Use capture phase to catch events early
    },
    
    // Check Alpine.js status
    checkAlpine: function() {
      console.log('🏔️ Alpine.js Status:');
      console.log('  Alpine defined:', typeof window.Alpine !== 'undefined');
      
      if (window.Alpine) {
        console.log('  Alpine version:', window.Alpine.version || 'Unknown');
        
        // Check for Alpine components
        const alpineComponents = document.querySelectorAll('[x-data]');
        console.log('  Alpine components found:', alpineComponents.length);
        
        alpineComponents.forEach((comp, index) => {
          console.log(`    Component ${index + 1}:`, comp.tagName, comp.className);
        });
      }
    },
    
    // Fix dropdown issues
    fixDropdowns: function() {
      console.log('🔧 Fixing dropdown issues...');
      
      // Ensure Alpine dropdowns work
      document.querySelectorAll('[x-data]').forEach(dropdown => {
        if (dropdown.hasAttribute('x-data')) {
          const data = dropdown.getAttribute('x-data');
          if (data.includes('open')) {
            console.log('  Found Alpine dropdown:', dropdown);
            
            // Ensure click handlers don't interfere
            const buttons = dropdown.querySelectorAll('button');
            buttons.forEach(btn => {
              // Remove any duplicate event listeners
              const newBtn = btn.cloneNode(true);
              btn.parentNode.replaceChild(newBtn, btn);
              console.log('  Cleaned button event handlers');
            });
          }
        }
      });
    },
    
    // Initialize debugging
    init: function() {
      console.log('🚀 Initializing Authentication Debug Helper');
      
      // Check initial state
      this.checkAuth();
      this.checkAlpine();
      
      // Try to fix auth if needed
      this.fixAuth();
      
      // Monitor clicks
      this.monitorClicks();
      
      // Fix dropdowns after Alpine loads
      if (window.Alpine) {
        this.fixDropdowns();
      } else {
        document.addEventListener('alpine:initialized', () => {
          console.log('✅ Alpine initialized, fixing dropdowns...');
          this.fixDropdowns();
        });
      }
      
      console.log('📊 Debug commands available:');
      console.log('  debugAuth.checkAuth() - Check authentication status');
      console.log('  debugAuth.fixAuth() - Fix authentication state');
      console.log('  debugAuth.checkAlpine() - Check Alpine.js status');
      console.log('  debugAuth.fixDropdowns() - Fix dropdown issues');
    }
  };
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.debugAuth.init();
    });
  } else {
    // DOM already loaded
    setTimeout(() => {
      window.debugAuth.init();
    }, 100);
  }
})();