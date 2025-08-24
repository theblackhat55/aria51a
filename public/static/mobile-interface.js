// Mobile Interface Enhancements with Hamburger Navigation
class MobileInterface {
  constructor() {
    this.isMobile = window.innerWidth <= 768;
    this.isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchEndX = 0;
    this.touchEndY = 0;
    this.pullToRefreshThreshold = 100;
    this.isPulling = false;
    this.mobileNavOpen = false;
  }

  initialize() {
    if (this.isMobile) {
      this.setupHamburgerMenu();
      this.setupTouchGestures();
      this.setupPullToRefresh();
      this.optimizeForMobile();
    }
    
    if (this.isTablet) {
      this.optimizeForTablet();
    }

    // Listen for orientation changes
    window.addEventListener('orientationchange', () => {
      setTimeout(() => this.handleOrientationChange(), 100);
    });

    // Listen for resize events
    window.addEventListener('resize', () => this.handleResize());
  }

  setupHamburgerMenu() {
    // Setup hamburger menu functionality
    const hamburgerBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');
    const mobileNavClose = document.getElementById('mobile-nav-close');

    if (!hamburgerBtn || !mobileNav || !mobileNavOverlay) {
      console.warn('Mobile navigation elements not found');
      return;
    }

    // Initially hide hamburger menu if not authenticated
    this.updateMobileAuthUI();

    // Hamburger menu toggle
    hamburgerBtn.addEventListener('click', () => {
      this.toggleMobileNav();
    });

    // Close button
    if (mobileNavClose) {
      mobileNavClose.addEventListener('click', () => {
        this.closeMobileNav();
      });
    }

    // Overlay click to close
    mobileNavOverlay.addEventListener('click', () => {
      this.closeMobileNav();
    });

    // Setup mobile nav item clicks
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    mobileNavItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const page = item.dataset.page;
        if (page) {
          this.navigateToPage(page);
          this.updateMobileNavActive(page);
          this.closeMobileNav();
        }
      });
    });

    // Adjust main content padding for mobile
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      mainContent.style.paddingTop = '1rem';
    }
  }

  toggleMobileNav() {
    if (this.mobileNavOpen) {
      this.closeMobileNav();
    } else {
      this.openMobileNav();
    }
  }

  openMobileNav() {
    const hamburgerBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');

    if (hamburgerBtn) hamburgerBtn.classList.add('active');
    if (mobileNav) mobileNav.classList.add('active');
    if (mobileNavOverlay) mobileNavOverlay.classList.add('active');

    // Prevent body scroll when menu is open
    document.body.style.overflow = 'hidden';
    this.mobileNavOpen = true;
  }

  closeMobileNav() {
    const hamburgerBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');

    if (hamburgerBtn) hamburgerBtn.classList.remove('active');
    if (mobileNav) mobileNav.classList.remove('active');
    if (mobileNavOverlay) mobileNavOverlay.classList.remove('active');

    // Restore body scroll
    document.body.style.overflow = '';
    this.mobileNavOpen = false;
  }

  updateMobileNavActive(page) {
    const mobileNavItems = document.querySelectorAll('.mobile-nav-item');
    mobileNavItems.forEach(item => {
      item.classList.remove('active');
      if (item.dataset.page === page) {
        item.classList.add('active');
      }
    });
  }

  createMobileHeader() {
    const app = document.getElementById('app');
    if (!app) return;

    const header = document.createElement('div');
    header.className = 'mobile-header';
    header.innerHTML = `
      <div class="flex justify-between items-center">
        <div class="flex items-center space-x-3">
          <div class="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <i class="fas fa-shield-alt text-white text-sm"></i>
          </div>
          <h1 id="mobile-page-title">Dashboard</h1>
        </div>
        <div class="flex items-center space-x-2">
          <button id="mobile-notification-bell" class="notification-bell-mobile">
            <i class="fas fa-bell text-xl"></i>
            <span id="mobile-notification-badge" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center hidden">0</span>
          </button>
          <button id="mobile-menu-toggle" class="p-2">
            <i class="fas fa-bars text-xl"></i>
          </button>
        </div>
      </div>
    `;

    app.insertBefore(header, app.firstChild);

    // Setup mobile menu toggle
    this.setupMobileMenu();
  }

  createBottomNavigation() {
    const navItems = [
      { id: 'dashboard', icon: 'chart-pie', label: 'Dashboard' },
      { id: 'risks', icon: 'exclamation-triangle', label: 'Risks' },
      { id: 'documents', icon: 'file-alt', label: 'Docs' },
      { id: 'incidents', icon: 'bell', label: 'Incidents' },
      { id: 'settings', icon: 'cog', label: 'Settings' }
    ];

    const bottomNav = document.createElement('div');
    bottomNav.className = 'nav-mobile';
    bottomNav.innerHTML = navItems.map(item => `
      <a href="#" class="nav-mobile-item" data-page="${item.id}">
        <i class="fas fa-${item.icon}"></i>
        <span>${item.label}</span>
      </a>
    `).join('');

    document.body.appendChild(bottomNav);

    // Add click handlers
    bottomNav.addEventListener('click', (e) => {
      e.preventDefault();
      const link = e.target.closest('.nav-mobile-item');
      if (link) {
        const page = link.dataset.page;
        this.navigateToPage(page);
        this.updateMobileNavigation(page);
      }
    });

    // Set initial active state
    this.updateMobileNavigation('dashboard');
  }

  setupMobileMenu() {
    const menuToggle = document.getElementById('mobile-menu-toggle');
    if (!menuToggle) return;

    menuToggle.addEventListener('click', () => {
      this.showMobileMenu();
    });
  }

  showMobileMenu() {
    const menuItems = [
      { page: 'controls', icon: 'shield-halved', label: 'Controls' },
      { page: 'compliance', icon: 'clipboard-check', label: 'Compliance' },  
      { page: 'frameworks', icon: 'list-check', label: 'Frameworks' },
      { page: 'assets', icon: 'server', label: 'Assets' },
      { page: 'services', icon: 'cogs', label: 'Services' }
    ];

    const menuHTML = `
      <div class="space-y-2">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">More Options</h3>
        ${menuItems.map(item => `
          <button onclick="mobileInterface.navigateToPage('${item.page}'); closeModal();" class="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center space-x-3">
            <i class="fas fa-${item.icon} text-gray-600 w-5"></i>
            <span>${item.label}</span>
          </button>
        `).join('')}
        
        <hr class="my-4">
        
        <button onclick="logout(); closeModal();" class="w-full text-left p-3 rounded-lg hover:bg-red-50 flex items-center space-x-3 text-red-600">
          <i class="fas fa-sign-out-alt w-5"></i>
          <span>Logout</span>
        </button>
      </div>
    `;

    showModal('Menu', menuHTML, [
      { text: 'Close', class: 'btn-primary', onclick: 'closeModal()' }
    ]);
  }

  setupTouchGestures() {
    // Setup swipe gestures for navigation
    document.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
      this.touchStartY = e.changedTouches[0].screenY;
    });

    document.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.touchEndY = e.changedTouches[0].screenY;
      this.handleSwipeGesture();
    });

    // Prevent zoom on double tap for better UX
    document.addEventListener('touchend', (e) => {
      const now = new Date().getTime();
      const timeSince = now - this.lastTap;
      
      if (timeSince < 300 && timeSince > 0) {
        e.preventDefault();
      }
      
      this.lastTap = now;
    });
  }

  handleSwipeGesture() {
    const deltaX = this.touchEndX - this.touchStartX;
    const deltaY = this.touchEndY - this.touchStartY;
    const minSwipeDistance = 50;

    // Horizontal swipe (left/right navigation)
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        // Swipe right - go to previous page
        this.navigateToPreviousPage();
      } else {
        // Swipe left - go to next page
        this.navigateToNextPage();
      }
    }
  }

  setupPullToRefresh() {
    let startY = 0;
    let currentY = 0;
    let pulling = false;

    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    // Create pull to refresh indicator
    const pullIndicator = document.createElement('div');
    pullIndicator.className = 'pull-refresh';
    pullIndicator.innerHTML = '<i class="fas fa-sync-alt"></i> Pull to refresh';
    mainContent.appendChild(pullIndicator);

    mainContent.addEventListener('touchstart', (e) => {
      if (mainContent.scrollTop === 0) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    });

    mainContent.addEventListener('touchmove', (e) => {
      if (!pulling) return;

      currentY = e.touches[0].clientY;
      const diff = currentY - startY;

      if (diff > 0 && mainContent.scrollTop === 0) {
        e.preventDefault();
        
        if (diff > this.pullToRefreshThreshold) {
          pullIndicator.classList.add('show');
          pullIndicator.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Release to refresh';
        } else {
          pullIndicator.classList.remove('show');
          pullIndicator.innerHTML = '<i class="fas fa-sync-alt"></i> Pull to refresh';
        }
      }
    });

    mainContent.addEventListener('touchend', (e) => {
      if (!pulling) return;

      const diff = currentY - startY;
      
      if (diff > this.pullToRefreshThreshold) {
        this.performRefresh();
      }

      pullIndicator.classList.remove('show');
      pulling = false;
    });
  }

  async performRefresh() {
    // Show loading
    const pullIndicator = document.querySelector('.pull-refresh');
    if (pullIndicator) {
      pullIndicator.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Refreshing...';
      pullIndicator.classList.add('show');
    }

    try {
      // Refresh current page data
      const currentPage = this.getCurrentPage();
      await this.refreshPageData(currentPage);
      
      showToast('Page refreshed', 'success');
    } catch (error) {
      console.error('Refresh error:', error);
      showToast('Failed to refresh', 'error');
    } finally {
      // Hide indicator
      setTimeout(() => {
        if (pullIndicator) {
          pullIndicator.classList.remove('show');
        }
      }, 1000);
    }
  }

  async refreshPageData(page) {
    switch(page) {
      case 'dashboard':
        if (typeof refreshDashboard === 'function') {
          await refreshDashboard();
        }
        break;
      case 'risks':
        if (typeof refreshRisks === 'function') {
          await refreshRisks();
        }
        break;
      case 'documents':
        if (typeof documentManager !== 'undefined') {
          await documentManager.refreshDocuments();
        }
        break;
      case 'notifications':
        if (typeof notificationManager !== 'undefined') {
          await notificationManager.refreshNotifications();
        }
        break;
      default:
        // Generic refresh
        window.location.reload();
    }
  }

  optimizeForMobile() {
    // Add mobile-specific classes
    document.body.classList.add('mobile-optimized');

    // Optimize forms for mobile
    this.optimizeFormsForMobile();

    // Optimize tables for mobile
    this.optimizeTablesForMobile();

    // Setup mobile-friendly modals
    this.optimizeModalsForMobile();
  }

  optimizeFormsForMobile() {
    // Make all form inputs touch-friendly
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.classList.add('form-input-mobile');
    });

    // Make all buttons touch-friendly
    const buttons = document.querySelectorAll('button, .btn');
    buttons.forEach(button => {
      button.classList.add('btn-mobile');
    });
  }

  optimizeTablesForMobile() {
    const tables = document.querySelectorAll('table');
    tables.forEach(table => {
      if (!table.closest('.table-mobile')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-mobile';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
    });
  }

  optimizeModalsForMobile() {
    // Override modal display for mobile
    const originalShowModal = window.showModal;
    
    window.showModal = (title, content, buttons = []) => {
      if (this.isMobile) {
        this.showMobileModal(title, content, buttons);
      } else {
        originalShowModal(title, content, buttons);
      }
    };
  }

  showMobileModal(title, content, buttons = []) {
    const modalHTML = `
      <div id="universal-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-end justify-center z-50">
        <div class="bg-white rounded-t-lg shadow-xl w-full max-h-[90vh] overflow-y-auto modal-mobile">
          <div class="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
            <h3 class="text-lg font-semibold text-gray-900">${title}</h3>
            <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 p-2">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          <div class="p-6">${content}</div>
          <div class="px-6 py-4 border-t border-gray-200 flex flex-col space-y-2 sticky bottom-0 bg-white">
            ${buttons.map(button => `<button onclick="${button.onclick}" class="${button.class} btn-mobile">${button.text}</button>`).join('')}
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
  }

  optimizeForTablet() {
    document.body.classList.add('tablet-optimized');
    
    // Tablet-specific optimizations
    const grids = document.querySelectorAll('.grid');
    grids.forEach(grid => {
      if (grid.classList.contains('grid-cols-1')) {
        grid.classList.add('tablet-grid-2');
      } else if (grid.classList.contains('grid-cols-2')) {
        grid.classList.add('tablet-grid-3');
      }
    });
  }

  // Update mobile UI based on authentication state
  updateMobileAuthUI() {
    const token = localStorage.getItem('aria_token') || localStorage.getItem('authToken');
    const isAuthenticated = !!(token && window.currentUser);
    
    const hamburgerBtn = document.getElementById('mobile-menu-btn');
    const mobileNav = document.getElementById('mobile-nav');
    const mobileNavContent = document.querySelector('.mobile-nav-content');
    const mobileAuthBtn = document.getElementById('mobile-auth-button');
    
    const isMobileDevice = window.innerWidth <= 768;
    
    if (hamburgerBtn) {
      // Show hamburger menu only on mobile devices AND when authenticated
      if (isMobileDevice && isAuthenticated) {
        hamburgerBtn.style.display = 'flex';
      } else {
        hamburgerBtn.style.display = 'none';
      }
    }
    
    if (mobileAuthBtn) {
      // Show mobile auth button only on mobile devices AND when NOT authenticated
      if (isMobileDevice && !isAuthenticated) {
        mobileAuthBtn.style.display = 'block';
      } else {
        mobileAuthBtn.style.display = 'none';
      }
      
      // Add click handler for mobile auth button if not already added
      if (!mobileAuthBtn.onclick) {
        mobileAuthBtn.onclick = () => {
          window.location.href = '/login';
        };
      }
    }
    
    if (mobileNavContent) {
      if (isAuthenticated) {
        // Show navigation content for authenticated users
        mobileNavContent.style.display = 'block';
      } else {
        // Hide navigation content and show login message for non-authenticated users
        mobileNavContent.style.display = 'none';
        if (mobileNav) {
          this.showMobileLoginMessage();
        }
      }
    }
  }
  
  // Show login message in mobile navigation
  showMobileLoginMessage() {
    const mobileNavContent = document.querySelector('.mobile-nav-content');
    if (!mobileNavContent) return;
    
    mobileNavContent.innerHTML = `
      <div class="mobile-nav-section">
        <div class="p-6 text-center">
          <div class="mb-4">
            <i class="fas fa-lock text-4xl text-gray-400"></i>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
          <p class="text-gray-600 mb-4">Please login to access the GRC platform features</p>
          <button onclick="window.location.href='/login'" class="btn-primary w-full">
            <i class="fas fa-sign-in-alt mr-2"></i>Login
          </button>
        </div>
      </div>
    `;
  }

  navigateToPage(page) {
    // Use the global navigateTo function
    if (typeof window.navigateTo === 'function') {
      window.navigateTo(page);
    } else if (typeof navigateTo === 'function') {
      navigateTo(page);
    } else {
      // Fallback: try to find and click the corresponding desktop nav item
      const desktopNavItem = document.querySelector(`[data-page="${page}"]`);
      if (desktopNavItem) {
        desktopNavItem.click();
      } else {
        console.warn(`Navigation function not found for page: ${page}`);
      }
    }
  }

  updateMobileNavigation(activePage) {
    const navItems = document.querySelectorAll('.nav-mobile-item');
    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.dataset.page === activePage) {
        item.classList.add('active');
      }
    });
  }

  navigateToPreviousPage() {
    // Implement page navigation logic
    const pages = ['dashboard', 'risks', 'documents', 'incidents', 'settings'];
    const currentPage = this.getCurrentPage();
    const currentIndex = pages.indexOf(currentPage);
    
    if (currentIndex > 0) {
      this.navigateToPage(pages[currentIndex - 1]);
      this.updateMobileNavigation(pages[currentIndex - 1]);
    }
  }

  navigateToNextPage() {
    const pages = ['dashboard', 'risks', 'documents', 'incidents', 'settings'];
    const currentPage = this.getCurrentPage();
    const currentIndex = pages.indexOf(currentPage);
    
    if (currentIndex < pages.length - 1) {
      this.navigateToPage(pages[currentIndex + 1]);
      this.updateMobileNavigation(pages[currentIndex + 1]);
    }
  }

  getCurrentPage() {
    const activeNav = document.querySelector('.nav-mobile-item.active');
    return activeNav ? activeNav.dataset.page : 'dashboard';
  }

  handleOrientationChange() {
    // Adjust layout for orientation change
    if (screen.orientation) {
      const orientation = screen.orientation.angle;
      document.body.classList.toggle('landscape', Math.abs(orientation) === 90);
    }
    
    // Trigger layout recalculation
    if (typeof currentHeatMapChart !== 'undefined' && currentHeatMapChart) {
      setTimeout(() => {
        currentHeatMapChart.resize();
      }, 300);
    }
  }

  handleResize() {
    const wasMobile = this.isMobile;
    this.isMobile = window.innerWidth <= 768;
    this.isTablet = window.innerWidth > 768 && window.innerWidth <= 1024;

    // If switching between mobile/desktop, reinitialize
    if (wasMobile !== this.isMobile) {
      this.reinitialize();
    }
  }

  reinitialize() {
    // Clean up mobile-specific elements
    this.cleanup();
    
    // Reinitialize based on current screen size
    this.initialize();
  }

  cleanup() {
    // Remove mobile-specific elements
    const mobileHeader = document.querySelector('.mobile-header');
    const bottomNav = document.querySelector('.nav-mobile');
    
    if (mobileHeader) mobileHeader.remove();
    if (bottomNav) bottomNav.remove();
    
    // Show desktop navigation if switching to desktop
    if (!this.isMobile) {
      const desktopNav = document.querySelector('nav');
      if (desktopNav) {
        desktopNav.style.display = '';
      }
    }
  }

  // Utility methods for mobile optimization
  isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  getScreenSize() {
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      orientation: screen.orientation ? screen.orientation.angle : 0
    };
  }

  optimizeScrolling() {
    // Enable smooth scrolling on mobile
    document.documentElement.style.scrollBehavior = 'smooth';
    
    // Add momentum scrolling for iOS
    const scrollableElements = document.querySelectorAll('.overflow-auto, .overflow-y-auto');
    scrollableElements.forEach(element => {
      element.style.webkitOverflowScrolling = 'touch';
    });
  }
}

// Global mobile interface instance
const mobileInterface = new MobileInterface();

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  mobileInterface.initialize();
});

// Listen for authentication state changes
document.addEventListener('auth-state-changed', () => {
  if (mobileInterface && typeof mobileInterface.updateMobileAuthUI === 'function') {
    mobileInterface.updateMobileAuthUI();
  }
});

// Make updateMobileAuthUI globally accessible for the main app
window.updateMobileAuthUI = () => {
  if (mobileInterface && typeof mobileInterface.updateMobileAuthUI === 'function') {
    mobileInterface.updateMobileAuthUI();
  }
};

// Handle viewport changes
const metaViewport = document.querySelector('meta[name="viewport"]');
if (!metaViewport) {
  const viewport = document.createElement('meta');
  viewport.name = 'viewport';
  viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
  document.head.appendChild(viewport);
}