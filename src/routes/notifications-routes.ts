import { Hono } from 'hono'

const app = new Hono()

// Notification Center Dashboard
app.get('/', async (c) => {
  const filter = c.req.query('filter') || 'all'
  const type = c.req.query('type') || ''
  const search = c.req.query('search') || ''
  
  const notifications = await getNotifications({ filter, type, search })
  const notificationStats = await getNotificationStats()
  
  return c.html(`
    <div class="space-y-6">
      <!-- Page Header -->
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">
            <i class="fas fa-bell mr-3 text-yellow-600"></i>Notification Center
          </h2>
          <p class="text-gray-600 mt-1">Manage your notifications and communication preferences</p>
        </div>
        <div class="flex space-x-3">
          <button 
            hx-post="/notifications/mark-all-read"
            hx-target="#notification-list"
            hx-trigger="click"
            class="btn-secondary">
            <i class="fas fa-check-double mr-2"></i>Mark All Read
          </button>
          <button 
            hx-get="/notifications/settings"
            hx-target="#modal-content"
            hx-trigger="click"
            class="btn-secondary">
            <i class="fas fa-cog mr-2"></i>Settings
          </button>
          <button 
            hx-get="/notifications"
            hx-target="#main-content"
            hx-trigger="click"
            class="btn-secondary">
            <i class="fas fa-sync-alt mr-2"></i>Refresh
          </button>
        </div>
      </div>

      <!-- Notification Statistics -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        ${renderNotificationStats(notificationStats)}
      </div>

      <!-- Notification Filters -->
      <div class="bg-white rounded-lg shadow">
        <div class="p-4 border-b border-gray-200">
          <div class="flex flex-wrap items-center gap-4">
            <!-- Filter Tabs -->
            <div class="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button 
                hx-get="/notifications/list?filter=all"
                hx-target="#notification-list"
                hx-trigger="click"
                class="px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}">
                All (${notificationStats.all})
              </button>
              <button 
                hx-get="/notifications/list?filter=unread"
                hx-target="#notification-list"
                hx-trigger="click"
                class="px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'unread' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}">
                Unread (${notificationStats.unread})
              </button>
              <button 
                hx-get="/notifications/list?filter=important"
                hx-target="#notification-list"
                hx-trigger="click"
                class="px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === 'important' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-900'}">
                Important (${notificationStats.important})
              </button>
            </div>
            
            <!-- Search and Type Filter -->
            <div class="flex items-center space-x-3 flex-1">
              <input 
                type="text" 
                name="search"
                value="${search}"
                placeholder="Search notifications..." 
                class="form-input flex-1 max-w-xs"
                hx-get="/notifications/list"
                hx-target="#notification-list"
                hx-trigger="keyup changed delay:300ms"
                hx-include="[name='filter'], [name='type']">
              
              <select 
                name="type" 
                class="form-select w-auto"
                hx-get="/notifications/list"
                hx-target="#notification-list"
                hx-trigger="change"
                hx-include="[name='search'], [name='filter']">
                <option value="">All Types</option>
                <option value="system" ${type === 'system' ? 'selected' : ''}>System</option>
                <option value="security" ${type === 'security' ? 'selected' : ''}>Security</option>
                <option value="compliance" ${type === 'compliance' ? 'selected' : ''}>Compliance</option>
                <option value="risk" ${type === 'risk' ? 'selected' : ''}>Risk</option>
                <option value="incident" ${type === 'incident' ? 'selected' : ''}>Incident</option>
                <option value="update" ${type === 'update' ? 'selected' : ''}>Update</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Notification List -->
        <div id="notification-list">
          ${renderNotificationList(notifications)}
        </div>
      </div>
    </div>
  `)
})

// Notification list (for HTMX updates)
app.get('/list', async (c) => {
  const filter = c.req.query('filter') || 'all'
  const type = c.req.query('type') || ''
  const search = c.req.query('search') || ''
  
  const notifications = await getNotifications({ filter, type, search })
  return c.html(renderNotificationList(notifications))
})

// Notification dropdown (for header bell)
app.get('/dropdown', async (c) => {
  const notifications = await getRecentNotifications()
  const unreadCount = await getUnreadCount()
  
  return c.html(`
    <div class="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50" id="notification-dropdown">
      <!-- Header -->
      <div class="p-4 border-b border-gray-200">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-gray-900">Notifications</h3>
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-500">${unreadCount} unread</span>
            <button 
              hx-post="/notifications/mark-all-read"
              hx-trigger="click"
              class="text-blue-600 hover:text-blue-700 text-sm font-medium">
              Mark all read
            </button>
          </div>
        </div>
      </div>

      <!-- Recent Notifications -->
      <div class="max-h-96 overflow-y-auto">
        ${notifications.length === 0 ? `
          <div class="p-6 text-center">
            <i class="fas fa-bell-slash text-3xl text-gray-300 mb-2"></i>
            <p class="text-gray-500">No notifications</p>
          </div>
        ` : notifications.map(notification => `
          <div class="p-4 border-b border-gray-100 hover:bg-gray-50 ${!notification.is_read ? 'bg-blue-50' : ''}">
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 rounded-full ${getNotificationTypeColor(notification.type)} flex items-center justify-center">
                  <i class="fas ${getNotificationTypeIcon(notification.type)} text-white text-xs"></i>
                </div>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-start justify-between">
                  <h4 class="text-sm font-medium text-gray-900 truncate">${notification.title}</h4>
                  <span class="text-xs text-gray-500 ml-2">${getRelativeTime(notification.created_at)}</span>
                </div>
                <p class="text-xs text-gray-600 mt-1 line-clamp-2">${notification.message}</p>
                <div class="flex items-center justify-between mt-2">
                  <span class="inline-flex px-2 py-1 text-xs font-medium rounded ${getNotificationTypeColor(notification.type)} bg-opacity-20">
                    ${notification.type}
                  </span>
                  ${!notification.is_read ? `
                    <button 
                      hx-post="/notifications/${notification.id}/mark-read"
                      hx-trigger="click"
                      class="text-blue-600 hover:text-blue-700 text-xs">
                      Mark read
                    </button>
                  ` : ''}
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- Footer -->
      <div class="p-4 border-t border-gray-200">
        <a href="/notifications" class="block text-center text-blue-600 hover:text-blue-700 text-sm font-medium">
          View all notifications →
        </a>
      </div>
    </div>
  `)
})

// Mark notification as read
app.post('/:id/mark-read', async (c) => {
  const id = c.req.param('id')
  await markNotificationAsRead(id)
  
  // Return updated notification item
  const notification = await getNotificationById(id)
  return c.html(`
    <div class="p-4 border-b border-gray-100 hover:bg-gray-50">
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 rounded-full ${getNotificationTypeColor(notification.type)} flex items-center justify-center">
            <i class="fas ${getNotificationTypeIcon(notification.type)} text-white text-xs"></i>
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between">
            <h4 class="text-sm font-medium text-gray-900">${notification.title}</h4>
            <span class="text-xs text-gray-500">${getRelativeTime(notification.created_at)}</span>
          </div>
          <p class="text-xs text-gray-600 mt-1">${notification.message}</p>
          <div class="flex items-center justify-between mt-2">
            <span class="inline-flex px-2 py-1 text-xs font-medium rounded ${getNotificationTypeColor(notification.type)} bg-opacity-20">
              ${notification.type}
            </span>
            <span class="text-xs text-gray-500">Read</span>
          </div>
        </div>
      </div>
    </div>
  `)
})

// Mark all notifications as read
app.post('/mark-all-read', async (c) => {
  await markAllNotificationsAsRead()
  
  // Return updated notification list
  const notifications = await getNotifications({ filter: 'all' })
  return c.html(renderNotificationList(notifications))
})

// Notification Settings Modal
app.get('/settings', async (c) => {
  const settings = await getNotificationSettings()
  
  return c.html(`
    <div class="modal-header">
      <h3 class="text-lg font-semibold text-gray-900">Notification Settings</h3>
    </div>
    <form hx-post="/notifications/settings" hx-target="#modal-content">
      <div class="modal-body space-y-6">
        <!-- Email Notifications -->
        <div>
          <h4 class="text-md font-semibold text-gray-900 mb-4">Email Notifications</h4>
          <div class="space-y-3">
            <label class="flex items-center">
              <input type="checkbox" name="email_security" ${settings.email_security ? 'checked' : ''} class="mr-3">
              <div class="flex-1">
                <span class="text-sm font-medium text-gray-700">Security Alerts</span>
                <p class="text-xs text-gray-500">Receive emails for critical security incidents</p>
              </div>
            </label>
            <label class="flex items-center">
              <input type="checkbox" name="email_compliance" ${settings.email_compliance ? 'checked' : ''} class="mr-3">
              <div class="flex-1">
                <span class="text-sm font-medium text-gray-700">Compliance Updates</span>
                <p class="text-xs text-gray-500">Get notified about compliance status changes</p>
              </div>
            </label>
            <label class="flex items-center">
              <input type="checkbox" name="email_risk" ${settings.email_risk ? 'checked' : ''} class="mr-3">
              <div class="flex-1">
                <span class="text-sm font-medium text-gray-700">Risk Assessments</span>
                <p class="text-xs text-gray-500">Updates on risk assessment deadlines and results</p>
              </div>
            </label>
            <label class="flex items-center">
              <input type="checkbox" name="email_reports" ${settings.email_reports ? 'checked' : ''} class="mr-3">
              <div class="flex-1">
                <span class="text-sm font-medium text-gray-700">Weekly Reports</span>
                <p class="text-xs text-gray-500">Receive weekly summary reports</p>
              </div>
            </label>
          </div>
        </div>

        <!-- In-App Notifications -->
        <div>
          <h4 class="text-md font-semibold text-gray-900 mb-4">In-App Notifications</h4>
          <div class="space-y-3">
            <label class="flex items-center">
              <input type="checkbox" name="app_incidents" ${settings.app_incidents ? 'checked' : ''} class="mr-3">
              <div class="flex-1">
                <span class="text-sm font-medium text-gray-700">Incident Updates</span>
                <p class="text-xs text-gray-500">Real-time incident status changes</p>
              </div>
            </label>
            <label class="flex items-center">
              <input type="checkbox" name="app_tasks" ${settings.app_tasks ? 'checked' : ''} class="mr-3">
              <div class="flex-1">
                <span class="text-sm font-medium text-gray-700">Task Assignments</span>
                <p class="text-xs text-gray-500">New tasks and deadlines</p>
              </div>
            </label>
            <label class="flex items-center">
              <input type="checkbox" name="app_mentions" ${settings.app_mentions ? 'checked' : ''} class="mr-3">
              <div class="flex-1">
                <span class="text-sm font-medium text-gray-700">Mentions & Comments</span>
                <p class="text-xs text-gray-500">When someone mentions you or comments</p>
              </div>
            </label>
          </div>
        </div>

        <!-- Notification Frequency -->
        <div>
          <h4 class="text-md font-semibold text-gray-900 mb-4">Notification Frequency</h4>
          <div class="space-y-3">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email Digest</label>
              <select name="email_frequency" class="form-select">
                <option value="immediate" ${settings.email_frequency === 'immediate' ? 'selected' : ''}>Immediate</option>
                <option value="hourly" ${settings.email_frequency === 'hourly' ? 'selected' : ''}>Hourly</option>
                <option value="daily" ${settings.email_frequency === 'daily' ? 'selected' : ''}>Daily</option>
                <option value="weekly" ${settings.email_frequency === 'weekly' ? 'selected' : ''}>Weekly</option>
                <option value="never" ${settings.email_frequency === 'never' ? 'selected' : ''}>Never</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Quiet Hours</label>
              <div class="grid grid-cols-2 gap-2">
                <input type="time" name="quiet_start" value="${settings.quiet_start || '22:00'}" class="form-input">
                <input type="time" name="quiet_end" value="${settings.quiet_end || '08:00'}" class="form-input">
              </div>
              <p class="text-xs text-gray-500 mt-1">No notifications during these hours</p>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
        <button type="submit" class="btn-primary">Save Settings</button>
      </div>
    </form>
  `)
})

// Save notification settings
app.post('/settings', async (c) => {
  try {
    const formData = await c.req.parseBody()
    await saveNotificationSettings(formData)
    
    return c.html(`
      <div class="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fas fa-check-circle text-green-500"></i>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-green-800">Settings Saved</h3>
            <p class="text-sm text-green-700 mt-1">Your notification preferences have been updated.</p>
          </div>
        </div>
      </div>
      <script>
        setTimeout(() => {
          closeModal();
        }, 2000);
      </script>
    `)
  } catch (error) {
    return c.html(`
      <div class="bg-red-50 border-l-4 border-red-500 p-4">
        <div class="flex">
          <div class="flex-shrink-0">
            <i class="fas fa-exclamation-circle text-red-500"></i>
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800">Save Failed</h3>
            <p class="text-sm text-red-700 mt-1">${error.message}</p>
          </div>
        </div>
      </div>
    `)
  }
})

// Get notification count (for badge)
app.get('/count', async (c) => {
  const unreadCount = await getUnreadCount()
  return c.text(unreadCount.toString())
})

// Create new notification (for system use)
app.post('/create', async (c) => {
  try {
    const notificationData = await c.req.json()
    const notification = await createNotification(notificationData)
    
    return c.json({ success: true, data: notification })
  } catch (error) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

// Mock data functions
async function getNotifications(filters: any = {}) {
  const allNotifications = [
    {
      id: '1',
      type: 'security',
      title: 'Critical Security Alert',
      message: 'Suspicious login attempt detected from unknown IP address. Please review your account security.',
      is_read: false,
      is_important: true,
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      data: { ip_address: '192.168.1.100', location: 'Unknown' }
    },
    {
      id: '2',
      type: 'compliance',
      title: 'Compliance Assessment Due',
      message: 'Your ISO 27001 assessment is due in 3 days. Please complete the required documentation.',
      is_read: false,
      is_important: true,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      data: { framework: 'ISO 27001', due_date: '2024-09-06' }
    },
    {
      id: '3',
      type: 'risk',
      title: 'New Risk Identified',
      message: 'A new high-priority risk has been identified in the Cloud Infrastructure category.',
      is_read: true,
      is_important: false,
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
      data: { risk_id: 'RISK-2024-045', category: 'Cloud Infrastructure' }
    },
    {
      id: '4',
      type: 'incident',
      title: 'Incident Resolved',
      message: 'Security incident INC-2024-089 has been successfully resolved and documented.',
      is_read: true,
      is_important: false,
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
      data: { incident_id: 'INC-2024-089', status: 'resolved' }
    },
    {
      id: '5',
      type: 'system',
      title: 'System Maintenance',
      message: 'Scheduled maintenance completed successfully. All systems are now online.',
      is_read: true,
      is_important: false,
      created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
      data: { maintenance_window: '2024-09-02 02:00-04:00' }
    },
    {
      id: '6',
      type: 'update',
      title: 'New Features Available',
      message: 'ARIA5.1 has been updated with new AI Governance and Document Management features.',
      is_read: false,
      is_important: false,
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      data: { version: '5.1.0', features: ['AI Governance', 'Document Management'] }
    }
  ]
  
  return allNotifications.filter(notification => {
    if (filters.filter === 'unread' && notification.is_read) return false
    if (filters.filter === 'important' && !notification.is_important) return false
    if (filters.type && notification.type !== filters.type) return false
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      if (!notification.title.toLowerCase().includes(searchLower) &&
          !notification.message.toLowerCase().includes(searchLower)) {
        return false
      }
    }
    return true
  })
}

async function getNotificationStats() {
  const notifications = await getNotifications()
  return {
    all: notifications.length,
    unread: notifications.filter(n => !n.is_read).length,
    important: notifications.filter(n => n.is_important).length,
    today: notifications.filter(n => {
      const today = new Date()
      const notifDate = new Date(n.created_at)
      return notifDate.toDateString() === today.toDateString()
    }).length
  }
}

async function getRecentNotifications(limit = 5) {
  const notifications = await getNotifications()
  return notifications.slice(0, limit)
}

async function getUnreadCount() {
  const notifications = await getNotifications()
  return notifications.filter(n => !n.is_read).length
}

async function getNotificationById(id: string) {
  const notifications = await getNotifications()
  const notification = notifications.find(n => n.id === id)
  if (notification) {
    notification.is_read = true
  }
  return notification
}

async function markNotificationAsRead(id: string) {
  // Mock implementation
  console.log(`Marking notification ${id} as read`)
}

async function markAllNotificationsAsRead() {
  // Mock implementation
  console.log('Marking all notifications as read')
}

async function getNotificationSettings() {
  // Mock settings
  return {
    email_security: true,
    email_compliance: true,
    email_risk: false,
    email_reports: true,
    app_incidents: true,
    app_tasks: true,
    app_mentions: true,
    email_frequency: 'daily',
    quiet_start: '22:00',
    quiet_end: '08:00'
  }
}

async function saveNotificationSettings(formData: any) {
  // Mock implementation
  console.log('Saving notification settings:', formData)
}

async function createNotification(data: any) {
  // Mock implementation
  const notification = {
    id: generateId(),
    ...data,
    created_at: new Date().toISOString()
  }
  console.log('Creating notification:', notification)
  return notification
}

// Helper functions
function renderNotificationStats(stats: any) {
  return `
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center">
        <div class="p-3 bg-blue-100 rounded-lg">
          <i class="fas fa-bell text-blue-600 text-xl"></i>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Total Notifications</p>
          <p class="text-2xl font-bold text-gray-900">${stats.all}</p>
        </div>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center">
        <div class="p-3 bg-orange-100 rounded-lg">
          <i class="fas fa-envelope text-orange-600 text-xl"></i>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Unread</p>
          <p class="text-2xl font-bold text-gray-900">${stats.unread}</p>
        </div>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center">
        <div class="p-3 bg-red-100 rounded-lg">
          <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Important</p>
          <p class="text-2xl font-bold text-gray-900">${stats.important}</p>
        </div>
      </div>
    </div>
    <div class="bg-white rounded-lg shadow p-6">
      <div class="flex items-center">
        <div class="p-3 bg-green-100 rounded-lg">
          <i class="fas fa-calendar-day text-green-600 text-xl"></i>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Today</p>
          <p class="text-2xl font-bold text-gray-900">${stats.today}</p>
        </div>
      </div>
    </div>
  `
}

function renderNotificationList(notifications: any[]) {
  if (!notifications.length) {
    return `
      <div class="p-12 text-center">
        <i class="fas fa-bell-slash text-4xl text-gray-300 mb-4"></i>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No notifications found</h3>
        <p class="text-gray-500">You're all caught up! Check back later for new updates.</p>
      </div>
    `
  }

  return `
    <div class="divide-y divide-gray-200">
      ${notifications.map(notification => `
        <div class="p-4 hover:bg-gray-50 ${!notification.is_read ? 'bg-blue-50 border-l-4 border-blue-500' : ''}">
          <div class="flex items-start space-x-4">
            <!-- Icon -->
            <div class="flex-shrink-0">
              <div class="w-10 h-10 rounded-full ${getNotificationTypeColor(notification.type)} flex items-center justify-center">
                <i class="fas ${getNotificationTypeIcon(notification.type)} text-white"></i>
              </div>
            </div>
            
            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between">
                <h4 class="text-sm font-semibold text-gray-900 ${!notification.is_read ? 'font-bold' : ''}">${notification.title}</h4>
                <div class="flex items-center space-x-2 ml-4">
                  ${notification.is_important ? '<i class="fas fa-star text-yellow-500" title="Important"></i>' : ''}
                  <span class="text-xs text-gray-500 whitespace-nowrap">${getRelativeTime(notification.created_at)}</span>
                </div>
              </div>
              <p class="text-sm text-gray-600 mt-1">${notification.message}</p>
              
              <!-- Metadata -->
              <div class="flex items-center justify-between mt-3">
                <div class="flex items-center space-x-3">
                  <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full ${getNotificationTypeColor(notification.type)} bg-opacity-20">
                    ${notification.type}
                  </span>
                  ${!notification.is_read ? `
                    <span class="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      New
                    </span>
                  ` : ''}
                </div>
                
                <!-- Actions -->
                <div class="flex items-center space-x-2">
                  ${!notification.is_read ? `
                    <button 
                      hx-post="/notifications/${notification.id}/mark-read"
                      hx-target="closest div"
                      hx-swap="outerHTML"
                      hx-trigger="click"
                      class="text-blue-600 hover:text-blue-700 text-xs font-medium">
                      Mark as read
                    </button>
                  ` : ''}
                  <button class="text-gray-400 hover:text-gray-600" title="Archive">
                    <i class="fas fa-archive text-xs"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `
}

function getNotificationTypeColor(type: string): string {
  switch (type) {
    case 'security': return 'bg-red-500'
    case 'compliance': return 'bg-purple-500'
    case 'risk': return 'bg-orange-500'
    case 'incident': return 'bg-yellow-500'
    case 'system': return 'bg-blue-500'
    case 'update': return 'bg-green-500'
    default: return 'bg-gray-500'
  }
}

function getNotificationTypeIcon(type: string): string {
  switch (type) {
    case 'security': return 'fa-shield-alt'
    case 'compliance': return 'fa-clipboard-check'
    case 'risk': return 'fa-exclamation-triangle'
    case 'incident': return 'fa-fire'
    case 'system': return 'fa-cog'
    case 'update': return 'fa-rocket'
    default: return 'fa-bell'
  }
}

function getRelativeTime(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
  return date.toLocaleDateString()
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export default app