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
      if (!token) {
        // If no token, create sample notifications for demo
        this.createSampleNotifications();
        return this.notifications;
      }

      const response = await axios.get(`/api/notifications?limit=${limit}&offset=${offset}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        this.notifications = response.data.data;
        this.renderNotifications();
        return this.notifications;
      }
    } catch (error) {
      console.log('Using demo notifications - API not available:', error.message);
      // Fallback to sample notifications
      if (this.notifications.length === 0) {
        this.createSampleNotifications();
      }
      return this.notifications;
    }
  }

  async updateNotificationCount() {
    try {
      const token = localStorage.getItem('dmt_token');
      if (!token) {
        // Count local notifications
        this.unreadCount = this.notifications.filter(n => !n.is_read).length;
        this.updateNotificationBadge();
        return { total: this.notifications.length, unread: this.unreadCount };
      }

      const response = await axios.get('/api/notifications/count', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        this.unreadCount = response.data.data.unread || 0;
        this.updateNotificationBadge();
        return response.data.data;
      }
    } catch (error) {
      console.log('Using local notification count - API not available');
      // Count local notifications
      this.unreadCount = this.notifications.filter(n => !n.is_read).length;
      this.updateNotificationBadge();
      return { total: this.notifications.length, unread: this.unreadCount };
    }
  }

  setupNotificationUI() {
    // Use existing notification bell instead of creating new one
    this.setupExistingNotificationBell();
    
    // Create notification dropdown
    this.createNotificationDropdown();
    
    // Setup event listeners
    this.setupEventListeners();
  }

  setupExistingNotificationBell() {
    // Show the existing notification container
    const notificationContainer = document.getElementById('notifications-container');
    if (notificationContainer) {
      notificationContainer.classList.remove('hidden');
    }
    
    // Update notification count immediately
    this.updateNotificationCount();
  }

  createNotificationDropdown() {
    const existingDropdown = document.getElementById('notification-dropdown');
    if (existingDropdown) return;

    const dropdown = document.createElement('div');
    dropdown.id = 'notification-dropdown';
    dropdown.className = 'absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-200 z-50 hidden transform transition-all duration-200 opacity-0 scale-95';
    dropdown.innerHTML = `
      <div class="p-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
        <div class="flex justify-between items-center">
          <div class="flex items-center space-x-2">
            <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <i class="fas fa-bell text-white text-sm"></i>
            </div>
            <h3 class="text-lg font-semibold text-gray-900">Notifications</h3>
          </div>
          <div class="flex items-center space-x-1">
            <button id="mark-all-read" class="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-colors duration-200" title="Mark all as read">
              <i class="fas fa-check-double text-sm"></i>
            </button>
            <button id="refresh-notifications" class="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200" title="Refresh">
              <i class="fas fa-sync-alt text-sm"></i>
            </button>
            <button id="create-sample-notifications" class="p-2 text-green-600 hover:text-green-800 hover:bg-green-100 rounded-lg transition-colors duration-200" title="Create Sample Notifications (Demo)">
              <i class="fas fa-plus text-sm"></i>
            </button>
          </div>
        </div>
      </div>
      <div id="notifications-list" class="max-h-80 overflow-y-auto">
        <div class="p-8 text-center text-gray-500">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-bell-slash text-2xl text-gray-400"></i>
          </div>
          <h4 class="text-sm font-medium text-gray-900 mb-1">No notifications</h4>
          <p class="text-xs text-gray-500">You're all caught up!</p>
        </div>
      </div>
      <div class="p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
        <button id="view-all-notifications" class="w-full text-sm text-blue-600 hover:text-blue-800 font-medium py-2 px-3 rounded-lg hover:bg-blue-50 transition-colors duration-200">
          <i class="fas fa-external-link-alt mr-2"></i>View All Notifications
        </button>
      </div>
    `;

    // Add dropdown to the existing notification bell container
    const existingContainer = document.getElementById('notifications-container');
    if (existingContainer) {
      existingContainer.appendChild(dropdown);
    } else {
      // Fallback to body if container not found
      document.body.appendChild(dropdown);
      dropdown.style.position = 'fixed';
      dropdown.style.top = '60px';
      dropdown.style.right = '20px';
    }
  }

  setupEventListeners() {
    // Use existing notification button
    const existingBell = document.getElementById('notifications-btn');
    if (existingBell) {
      existingBell.addEventListener('click', (e) => {
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

    // Create sample notifications (for demo)
    const createSample = document.getElementById('create-sample-notifications');
    if (createSample) {
      createSample.addEventListener('click', () => {
        this.createSampleNotifications();
        showToast('Sample notifications created', 'success');
      });
    }

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const dropdown = document.getElementById('notification-dropdown');
      const bell = document.getElementById('notifications-btn');
      
      if (dropdown && bell && !dropdown.contains(e.target) && !bell.contains(e.target)) {
        // Animate out
        dropdown.classList.add('opacity-0', 'scale-95');
        dropdown.classList.remove('opacity-100', 'scale-100');
        setTimeout(() => {
          dropdown.classList.add('hidden');
        }, 200);
      }
    });
  }

  toggleNotificationDropdown() {
    const dropdown = document.getElementById('notification-dropdown');
    if (!dropdown) return;

    if (dropdown.classList.contains('hidden')) {
      dropdown.classList.remove('hidden');
      // Animate in
      setTimeout(() => {
        dropdown.classList.remove('opacity-0', 'scale-95');
        dropdown.classList.add('opacity-100', 'scale-100');
      }, 10);
      this.loadNotifications(); // Refresh when opening
    } else {
      // Animate out
      dropdown.classList.add('opacity-0', 'scale-95');
      dropdown.classList.remove('opacity-100', 'scale-100');
      setTimeout(() => {
        dropdown.classList.add('hidden');
      }, 200);
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
      <div class="p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer notification-item ${notification.is_read ? 'read' : 'unread'} transition-colors duration-200" 
           data-id="${notification.id}" 
           onclick="notificationManager.handleNotificationClick(${notification.id})">
        <div class="flex items-start space-x-3">
          <div class="flex-shrink-0">
            <div class="w-10 h-10 rounded-full flex items-center justify-center ${this.getNotificationIconClass(notification.type)} shadow-sm">
              <i class="${this.getNotificationIcon(notification.type)} text-sm"></i>
            </div>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0 mr-2">
                <p class="text-sm font-medium text-gray-900 ${!notification.is_read ? 'font-semibold' : ''}" title="${notification.title}">
                  ${notification.title.length > 40 ? notification.title.substring(0, 40) + '...' : notification.title}
                </p>
                <p class="text-xs text-gray-600 mt-1 line-clamp-2">${notification.message.length > 80 ? notification.message.substring(0, 80) + '...' : notification.message}</p>
                <div class="flex items-center justify-between mt-2">
                  ${notification.category ? `<span class="inline-block px-2 py-1 text-xs ${this.getNotificationTypeClass(notification.type)} rounded-full font-medium">${notification.category}</span>` : '<div></div>'}
                  <span class="text-xs text-gray-500">${this.formatTimeAgo(notification.created_at)}</span>
                </div>
              </div>
              <div class="flex items-center space-x-1">
                ${!notification.is_read ? '<div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>' : ''}
                ${notification.action_url ? '<i class="fas fa-external-link-alt text-xs text-gray-400"></i>' : ''}
              </div>
            </div>
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
    
    // Also update any other notification indicators
    this.updateOtherNotificationIndicators();
  }

  updateOtherNotificationIndicators() {
    // Update page title with notification count
    if (this.unreadCount > 0) {
      document.title = `(${this.unreadCount}) Risk Management Platform`;
    } else {
      document.title = 'Risk Management Platform';
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
      if (!token) {
        // If no token, just mark local notification as read
        const notification = this.notifications.find(n => n.id === notificationId);
        if (notification) {
          notification.is_read = 1;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
          this.updateNotificationBadge();
          this.renderNotifications();
        }
        return;
      }

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
      console.log('API not available, marking local notification as read');
      // Fallback: mark local notification as read silently
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.is_read = 1;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
        this.updateNotificationBadge();
        this.renderNotifications();
      }
    }
  }

  async markAllAsRead() {
    // Prevent rapid successive calls
    if (this.markingAllAsRead) {
      console.log('Already marking all as read, skipping');
      return;
    }
    
    this.markingAllAsRead = true;
    
    try {
      const token = localStorage.getItem('dmt_token');
      if (!token) {
        // If no token, just mark local notifications as read
        this.notifications.forEach(n => n.is_read = 1);
        this.unreadCount = 0;
        this.updateNotificationBadge();
        this.renderNotifications();
        showToast('All notifications marked as read', 'success');
        this.markingAllAsRead = false;
        return;
      }

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
        this.markingAllAsRead = false;
      }
    } catch (error) {
      console.log('API not available, marking local notifications as read');
      // Clear any existing notification error toasts to prevent cascade
      this.clearNotificationErrorToasts();
      
      // Fallback: mark local notifications as read without showing error
      this.notifications.forEach(n => n.is_read = 1);
      this.unreadCount = 0;
      this.updateNotificationBadge();
      this.renderNotifications();
      showToast('All notifications marked as read', 'success');
      this.markingAllAsRead = false;
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
    // Poll for new notifications every 2 minutes (reduced from 30 seconds to avoid rate limiting)
    this.pollingInterval = setInterval(() => {
      this.updateNotificationCount();
    }, 120000);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  // Create in-app notification toast
  showInAppNotification(notification) {
    // Use existing toast system if available
    if (typeof showToast === 'function') {
      showToast(notification.message, notification.type || 'info');
      return;
    }
    
    // Fallback to custom toast
    const toastContainer = this.getOrCreateToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `notification-toast bg-white border-l-4 ${this.getNotificationBorderClass(notification.type)} p-4 mb-3 rounded-r-lg shadow-lg transform translate-x-full transition-transform duration-300`;
    toast.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 rounded-full flex items-center justify-center ${this.getNotificationIconClass(notification.type)}">
            <i class="${this.getNotificationIcon(notification.type)} text-sm"></i>
          </div>
        </div>
        <div class="ml-3 flex-1">
          <h4 class="text-sm font-medium text-gray-900">${notification.title}</h4>
          <p class="text-sm mt-1 text-gray-700">${notification.message}</p>
          ${notification.category ? `<span class="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded mt-2">${notification.category}</span>` : ''}
        </div>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-gray-400 hover:text-gray-600 p-1 rounded">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Animate in
    setTimeout(() => {
      toast.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 7 seconds (longer for notifications)
    setTimeout(() => {
      toast.classList.add('translate-x-full');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 7000);
  }

  getNotificationBorderClass(type) {
    switch (type) {
      case 'success': return 'border-green-400';
      case 'warning': return 'border-yellow-400';
      case 'error': return 'border-red-400';
      case 'info':
      default: return 'border-blue-400';
    }
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

  // Add notification from toast system
  addNotificationFromToast(message, type = 'info', title = null) {
    // Prevent duplicate notifications with same message within 5 seconds
    const now = Date.now();
    const recentDuplicate = this.notifications.find(n => 
      n.message === message && 
      n.type === type && 
      (now - new Date(n.created_at).getTime()) < 5000
    );
    
    if (recentDuplicate) {
      console.log('Preventing duplicate notification:', message);
      return;
    }
    
    const notification = {
      id: now, // Use timestamp as temporary ID
      title: title || this.getDefaultTitle(type),
      message: message,
      type: type,
      category: 'System',
      created_at: new Date().toISOString(),
      is_read: 0,
      action_url: null
    };
    
    // Add to local notifications array
    this.notifications.unshift(notification);
    
    // Limit local notifications to 50
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }
    
    // Update unread count
    this.unreadCount++;
    this.updateNotificationBadge();
    
    // Show in-app notification
    this.showInAppNotification(notification);
    
    // Render updated notifications if dropdown is open
    if (!document.getElementById('notification-dropdown')?.classList.contains('hidden')) {
      this.renderNotifications();
    }
  }

  getDefaultTitle(type) {
    switch (type) {
      case 'success': return 'Success';
      case 'warning': return 'Warning';
      case 'error': return 'Error';
      case 'info':
      default: return 'Information';
    }
  }

  // Create sample notifications for testing
  createSampleNotifications() {
    const sampleNotifications = [
      {
        id: 1,
        title: 'Risk Assessment Completed',
        message: 'High-priority risk assessment for "Web Application Security" has been completed. Review recommended actions.',
        type: 'success',
        category: 'Risk Management',
        created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        is_read: 0,
        action_url: '/risks'
      },
      {
        id: 2,
        title: 'New Vulnerability Detected',
        message: 'Microsoft Defender has detected a new critical vulnerability in your infrastructure. Immediate attention required.',
        type: 'error',
        category: 'Security',
        created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
        is_read: 0,
        action_url: '/assets'
      },
      {
        id: 3,
        title: 'Compliance Report Ready',
        message: 'Monthly SOC 2 compliance report is ready for review. All controls are currently compliant.',
        type: 'info',
        category: 'Compliance',
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
        is_read: 0,
        action_url: '/compliance'
      },
      {
        id: 4,
        title: 'User Access Review Due',
        message: 'Quarterly user access review is due in 3 days. Please review and approve user permissions.',
        type: 'warning',
        category: 'Access Management',
        created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
        is_read: 1,
        action_url: '/settings'
      }
    ];
    
    // Add sample notifications to local array
    this.notifications = [...sampleNotifications, ...this.notifications];
    this.unreadCount = sampleNotifications.filter(n => !n.is_read).length;
    this.updateNotificationBadge();
    this.renderNotifications();
  }

  // Clear notification-related error toasts to prevent cascading
  clearNotificationErrorToasts() {
    const toastContainer = document.getElementById('toast-container');
    if (toastContainer) {
      const errorToasts = toastContainer.querySelectorAll('.alert-error');
      errorToasts.forEach(toast => {
        const toastText = toast.textContent.toLowerCase();
        if (toastText.includes('notification') || toastText.includes('mark') || toastText.includes('failed to mark')) {
          toast.remove();
        }
      });
    }
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