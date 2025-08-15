// Notification System Frontend
class NotificationManager {
  constructor() {
    this.notifications = [];
    this.unreadCount = 0;
    this.isInitialized = false;
    this.pollingInterval = null;
    this.websocket = null;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      await this.loadNotifications();
      await this.updateNotificationCount();
      this.setupNotificationUI();
      this.startPolling();
      this.isInitialized = true;
      console.log('Notification system initialized');
    } catch (error) {
      console.error('Failed to initialize notification system:', error);
    }
  }

  async loadNotifications(limit = 20, offset = 0) {
    try {
      const token = localStorage.getItem('dmt_token');
      if (!token) return;

      const response = await axios.get(`/api/notifications?limit=${limit}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        this.notifications = response.data.data;
        this.renderNotifications();
        return this.notifications;
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
      return [];
    }
  }

  async updateNotificationCount() {
    try {
      const token = localStorage.getItem('dmt_token');
      if (!token) return;

      const response = await axios.get('/api/notifications/count', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        this.unreadCount = response.data.data.unread || 0;
        this.updateNotificationBadge();
        return response.data.data;
      }
    } catch (error) {
      console.error('Failed to update notification count:', error);
      return { total: 0, unread: 0 };
    }
  }

  setupNotificationUI() {
    // Add notification bell to header if not exists
    this.createNotificationBell();
    
    // Create notification dropdown
    this.createNotificationDropdown();
    
    // Setup event listeners
    this.setupEventListeners();
  }

  createNotificationBell() {
    const existingBell = document.getElementById('notification-bell');
    if (existingBell) return;

    // Find a suitable place in the header to add the notification bell
    const header = document.querySelector('header') || document.querySelector('.bg-white.shadow-md');
    if (!header) return;

    const bellContainer = document.createElement('div');
    bellContainer.className = 'relative';
    bellContainer.innerHTML = `
      <button id="notification-bell" class="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg">
        <i class="fas fa-bell text-xl"></i>
        <span id="notification-badge" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center hidden">0</span>
      </button>
    `;

    // Try to insert before the user menu or at the end of the header
    const userMenu = header.querySelector('[data-user-menu]') || header.querySelector('.space-x-3');
    if (userMenu) {
      userMenu.parentNode.insertBefore(bellContainer, userMenu);
    } else {
      header.appendChild(bellContainer);
    }
  }

  createNotificationDropdown() {
    const existingDropdown = document.getElementById('notification-dropdown');
    if (existingDropdown) return;

    const dropdown = document.createElement('div');
    dropdown.id = 'notification-dropdown';
    dropdown.className = 'absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50 hidden';
    dropdown.innerHTML = `
      <div class="p-4 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-semibold text-gray-900">Notifications</h3>
          <div class="flex space-x-2">
            <button id="mark-all-read" class="text-sm text-blue-600 hover:text-blue-800" title="Mark all as read">
              <i class="fas fa-check-double"></i>
            </button>
            <button id="refresh-notifications" class="text-sm text-gray-600 hover:text-gray-800" title="Refresh">
              <i class="fas fa-sync-alt"></i>
            </button>
          </div>
        </div>
      </div>
      <div id="notifications-list" class="max-h-96 overflow-y-auto">
        <div class="p-4 text-center text-gray-500">
          <i class="fas fa-bell-slash text-3xl mb-2"></i>
          <p>No notifications</p>
        </div>
      </div>
      <div class="p-3 border-t border-gray-200">
        <button id="view-all-notifications" class="w-full text-sm text-blue-600 hover:text-blue-800 text-center">
          View All Notifications
        </button>
      </div>
    `;

    // Add dropdown to the notification bell container
    const bellContainer = document.getElementById('notification-bell')?.parentNode;
    if (bellContainer) {
      bellContainer.appendChild(dropdown);
    }
  }

  setupEventListeners() {
    // Notification bell click
    const bell = document.getElementById('notification-bell');
    if (bell) {
      bell.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleNotificationDropdown();
      });
    }

    // Mark all as read
    const markAllRead = document.getElementById('mark-all-read');
    if (markAllRead) {
      markAllRead.addEventListener('click', () => {
        this.markAllAsRead();
      });
    }

    // Refresh notifications
    const refresh = document.getElementById('refresh-notifications');
    if (refresh) {
      refresh.addEventListener('click', () => {
        this.refreshNotifications();
      });
    }

    // View all notifications
    const viewAll = document.getElementById('view-all-notifications');
    if (viewAll) {
      viewAll.addEventListener('click', () => {
        this.showAllNotifications();
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('notification-dropdown');
      const bell = document.getElementById('notification-bell');
      
      if (dropdown && bell && !dropdown.contains(e.target) && !bell.contains(e.target)) {
        dropdown.classList.add('hidden');
      }
    });
  }

  toggleNotificationDropdown() {
    const dropdown = document.getElementById('notification-dropdown');
    if (!dropdown) return;

    if (dropdown.classList.contains('hidden')) {
      dropdown.classList.remove('hidden');
      this.loadNotifications(); // Refresh when opening
    } else {
      dropdown.classList.add('hidden');
    }
  }

  renderNotifications() {
    const container = document.getElementById('notifications-list');
    if (!container) return;

    if (this.notifications.length === 0) {
      container.innerHTML = `
        <div class="p-4 text-center text-gray-500">
          <i class="fas fa-bell-slash text-3xl mb-2"></i>
          <p>No notifications</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.notifications.map(notification => `
      <div class="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer notification-item ${notification.is_read ? 'read' : 'unread'}" 
           data-id="${notification.id}" 
           onclick="notificationManager.handleNotificationClick(${notification.id})">
        <div class="flex items-start space-x-3">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 rounded-full flex items-center justify-center ${this.getNotificationIconClass(notification.type)}">
              <i class="${this.getNotificationIcon(notification.type)} text-sm"></i>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <p class="text-sm font-medium text-gray-900 truncate">
                ${notification.title}
              </p>
              <div class="flex items-center space-x-1">
                ${!notification.is_read ? '<div class="w-2 h-2 bg-blue-500 rounded-full"></div>' : ''}
                <span class="text-xs text-gray-500">${this.formatTimeAgo(notification.created_at)}</span>
              </div>
            </div>
            <p class="text-sm text-gray-600 mt-1">${notification.message}</p>
            ${notification.category ? `<span class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded mt-2">${notification.category}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }

  getNotificationIcon(type) {
    switch (type) {
      case 'success': return 'fas fa-check-circle';
      case 'warning': return 'fas fa-exclamation-triangle';
      case 'error': return 'fas fa-times-circle';
      case 'info':
      default: return 'fas fa-info-circle';
    }
  }

  getNotificationIconClass(type) {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-600';
      case 'warning': return 'bg-yellow-100 text-yellow-600';
      case 'error': return 'bg-red-100 text-red-600';
      case 'info':
      default: return 'bg-blue-100 text-blue-600';
    }
  }

  formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    return date.toLocaleDateString();
  }

  updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (!badge) return;

    if (this.unreadCount > 0) {
      badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  async handleNotificationClick(notificationId) {
    try {
      // Mark as read
      await this.markAsRead(notificationId);
      
      // Find notification and handle action
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification && notification.action_url) {
        // Navigate to the action URL
        const url = new URL(notification.action_url, window.location.origin);
        if (url.pathname.startsWith('/')) {
          // Internal navigation
          const page = url.pathname.substring(1) || 'dashboard';
          navigateTo(page);
        } else {
          // External navigation
          window.open(notification.action_url, '_blank');
        }
      }
      
      // Close dropdown
      const dropdown = document.getElementById('notification-dropdown');
      if (dropdown) {
        dropdown.classList.add('hidden');
      }
    } catch (error) {
      console.error('Failed to handle notification click:', error);
    }
  }

  async markAsRead(notificationId) {
    try {
      const token = localStorage.getItem('dmt_token');
      if (!token) return;

      const response = await axios.put(`/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Update local state
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.is_read = 1;
        }
        
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.updateNotificationBadge();
        this.renderNotifications();
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async markAllAsRead() {
    try {
      const token = localStorage.getItem('dmt_token');
      if (!token) return;

      const response = await axios.put('/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Update local state
        this.notifications.forEach(n => n.is_read = 1);
        this.unreadCount = 0;
        this.updateNotificationBadge();
        this.renderNotifications();
        
        showToast('All notifications marked as read', 'success');
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      showToast('Failed to mark notifications as read', 'error');
    }
  }

  async refreshNotifications() {
    const refreshIcon = document.querySelector('#refresh-notifications i');
    if (refreshIcon) {
      refreshIcon.classList.add('fa-spin');
    }

    try {
      await this.loadNotifications();
      await this.updateNotificationCount();
      showToast('Notifications refreshed', 'success');
    } catch (error) {
      console.error('Failed to refresh notifications:', error);
      showToast('Failed to refresh notifications', 'error');
    } finally {
      if (refreshIcon) {
        refreshIcon.classList.remove('fa-spin');
      }
    }
  }

  showAllNotifications() {
    // Close dropdown
    const dropdown = document.getElementById('notification-dropdown');
    if (dropdown) {
      dropdown.classList.add('hidden');
    }
    
    // Navigate to notifications page
    this.showNotificationsPage();
  }

  showNotificationsPage() {
    const mainContent = document.getElementById('main-content');
    if (!mainContent) return;

    mainContent.innerHTML = `
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h2 class="text-2xl font-bold text-gray-900">Notifications</h2>
          <div class="flex space-x-3">
            <button onclick="notificationManager.markAllAsRead()" class="btn-secondary">
              <i class="fas fa-check-double mr-2"></i>Mark All Read
            </button>
            <button onclick="notificationManager.refreshNotifications()" class="btn-secondary">
              <i class="fas fa-sync-alt mr-2"></i>Refresh
            </button>
          </div>
        </div>
        
        <div class="bg-white rounded-lg shadow">
          <div class="p-6">
            <div id="all-notifications-list" class="space-y-4">
              ${this.renderAllNotificationsHTML()}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderAllNotificationsHTML() {
    if (this.notifications.length === 0) {
      return `
        <div class="text-center py-8">
          <i class="fas fa-bell-slash text-4xl text-gray-400 mb-4"></i>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
          <p class="text-gray-600">You're all caught up!</p>
        </div>
      `;
    }

    return this.notifications.map(notification => `
      <div class="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer notification-item ${notification.is_read ? 'read' : 'unread'}" 
           onclick="notificationManager.handleNotificationClick(${notification.id})">
        <div class="flex items-start space-x-4">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 rounded-full flex items-center justify-center ${this.getNotificationIconClass(notification.type)}">
              <i class="${this.getNotificationIcon(notification.type)}"></i>
            </div>
          </div>
          <div class="flex-1">
            <div class="flex items-center justify-between">
              <h4 class="text-md font-medium text-gray-900">${notification.title}</h4>
              <div class="flex items-center space-x-2">
                ${!notification.is_read ? '<div class="w-3 h-3 bg-blue-500 rounded-full"></div>' : ''}
                <span class="text-sm text-gray-500">${this.formatTimeAgo(notification.created_at)}</span>
              </div>
            </div>
            <p class="text-gray-700 mt-2">${notification.message}</p>
            <div class="flex items-center justify-between mt-3">
              <div class="flex space-x-2">
                ${notification.category ? `<span class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">${notification.category}</span>` : ''}
                ${notification.type ? `<span class="inline-block px-2 py-1 text-xs ${this.getNotificationTypeClass(notification.type)} rounded">${notification.type}</span>` : ''}
              </div>
              ${notification.action_url ? '<i class="fas fa-external-link-alt text-gray-400"></i>' : ''}
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  getNotificationTypeClass(type) {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'info':
      default: return 'bg-blue-100 text-blue-800';
    }
  }

  startPolling() {
    // Poll for new notifications every 30 seconds
    this.pollingInterval = setInterval(() => {
      this.updateNotificationCount();
    }, 30000);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Create in-app notification toast
  showInAppNotification(notification) {
    const toastContainer = this.getOrCreateToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `notification-toast ${this.getNotificationIconClass(notification.type)} border-l-4 p-4 mb-3 rounded-r-lg shadow-lg transform translate-x-full transition-transform duration-300`;
    toast.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <i class="${this.getNotificationIcon(notification.type)} text-lg"></i>
        </div>
        <div class="ml-3 flex-1">
          <h4 class="text-sm font-medium">${notification.title}</h4>
          <p class="text-sm mt-1">${notification.message}</p>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-gray-400 hover:text-gray-600">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 5000);
  }

  getOrCreateToastContainer() {
    let container = document.getElementById('notification-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-toast-container';
      container.className = 'fixed top-4 right-4 z-50 w-96';
      document.body.appendChild(container);
    }
    return container;
  }

  destroy() {
    this.stopPolling();
    if (this.websocket) {
      this.websocket.close();
    }
    this.isInitialized = false;
  }
}

// Global notification manager instance
const notificationManager = new NotificationManager();

// Auto-initialize when user is logged in
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('dmt_token');
  if (token) {
    setTimeout(() => {
      notificationManager.initialize();
    }, 1000); // Delay to ensure UI is ready
  }
});

// Initialize on login
document.addEventListener('user-logged-in', () => {
  setTimeout(() => {
    notificationManager.initialize();
  }, 500);
});

// Cleanup on logout
document.addEventListener('user-logged-out', () => {
  notificationManager.destroy();
});