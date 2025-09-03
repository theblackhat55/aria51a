/**
 * ARIA5.1 Executive Dashboard & Security Operations UI
 * 
 * Provides comprehensive security intelligence dashboards:
 * - Executive overview with key metrics and trends
 * - Risk management dashboard with real-time updates
 * - Compliance status and gap analysis
 * - Threat modeling and attack path visualization
 * - Behavioral analytics and anomaly detection
 * - Security operations center (SOC) interface
 */

class ARIA5Dashboard {
  constructor() {
    this.apiBaseUrl = '/api';
    this.token = localStorage.getItem('aria5_token');
    this.currentUser = null;
    this.websocket = null;
    this.charts = new Map();
    this.refreshInterval = 30000; // 30 seconds
    this.autoRefreshTimer = null;

    this.init();
  }

  async init() {
    try {
      await this.authenticate();
      this.setupWebSocket();
      this.setupEventListeners();
      this.loadDashboard();
      this.startAutoRefresh();
    } catch (error) {
      console.error('Dashboard initialization failed:', error);
      this.showLoginForm();
    }
  }

  // =============================================================================
  // AUTHENTICATION
  // =============================================================================

  async authenticate() {
    if (!this.token) {
      throw new Error('No authentication token');
    }

    try {
      const response = await this.apiCall('/auth/me');
      if (response.success) {
        this.currentUser = response.data;
        this.updateUserInterface();
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      localStorage.removeItem('aria5_token');
      throw error;
    }
  }

  async login(email, password) {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        this.token = data.data.token;
        this.currentUser = data.data.user;
        localStorage.setItem('aria5_token', this.token);
        
        this.hideLoginForm();
        await this.init();
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (error) {
      this.showError('Login failed: ' + error.message);
    }
  }

  logout() {
    localStorage.removeItem('aria5_token');
    this.token = null;
    this.currentUser = null;
    if (this.websocket) {
      this.websocket.close();
    }
    this.showLoginForm();
  }

  // =============================================================================
  // API COMMUNICATION
  // =============================================================================

  async apiCall(endpoint, options = {}) {
    const url = `${this.apiBaseUrl}${endpoint}`;
    const config = {
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    return data;
  }

  // =============================================================================
  // WEBSOCKET COMMUNICATION
  // =============================================================================

  setupWebSocket() {
    if (!this.token) return;

    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/api/ws?token=${this.token}`;
      
      // Note: This is a simplified WebSocket setup
      // In production, you'd implement proper WebSocket authentication
      console.log('WebSocket connection would be established to:', wsUrl);
      
      // Mock WebSocket for demo purposes
      this.setupMockWebSocket();
    } catch (error) {
      console.error('WebSocket setup failed:', error);
    }
  }

  setupMockWebSocket() {
    // Simulate real-time updates
    setInterval(() => {
      this.handleWebSocketMessage({
        type: 'risk_alert',
        data: {
          id: Date.now(),
          title: 'New Risk Alert',
          severity: 'medium',
          timestamp: new Date().toISOString()
        }
      });
    }, 60000); // Every minute

    setInterval(() => {
      this.handleWebSocketMessage({
        type: 'compliance_update',
        data: {
          framework: 'ISO 27001',
          score: 88.5 + Math.random() * 2,
          timestamp: new Date().toISOString()
        }
      });
    }, 120000); // Every 2 minutes
  }

  handleWebSocketMessage(message) {
    switch (message.type) {
      case 'risk_alert':
        this.showNotification(message.data.title, 'warning');
        this.updateRiskMetrics();
        break;
      case 'compliance_update':
        this.updateComplianceMetrics();
        break;
      case 'threat_detected':
        this.showNotification('New threat detected', 'error');
        this.updateThreatMetrics();
        break;
      case 'anomaly_detected':
        this.showNotification('Behavioral anomaly detected', 'warning');
        this.updateBehavioralMetrics();
        break;
    }
  }

  // =============================================================================
  // DASHBOARD LOADING
  // =============================================================================

  async loadDashboard() {
    try {
      this.showLoading();
      
      // Load dashboard data in parallel
      const [overview, metrics, notifications] = await Promise.all([
        this.loadDashboardOverview(),
        this.loadDashboardMetrics(),
        this.loadNotifications()
      ]);

      this.renderDashboard(overview, metrics);
      this.renderNotifications(notifications);
      
      this.hideLoading();
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      this.showError('Failed to load dashboard data');
      this.hideLoading();
    }
  }

  async loadDashboardOverview() {
    try {
      const response = await this.apiCall('/dashboard/overview');
      return response.data;
    } catch (error) {
      console.error('Failed to load overview:', error);
      return this.getMockOverviewData();
    }
  }

  async loadDashboardMetrics() {
    try {
      const response = await this.apiCall('/dashboard/metrics?timeRange=30d');
      return response.data;
    } catch (error) {
      console.error('Failed to load metrics:', error);
      return this.getMockMetricsData();
    }
  }

  async loadNotifications() {
    try {
      const response = await this.apiCall('/notifications?limit=10');
      return response.data;
    } catch (error) {
      console.error('Failed to load notifications:', error);
      return { notifications: [], total: 0 };
    }
  }

  // =============================================================================
  // DASHBOARD RENDERING
  // =============================================================================

  renderDashboard(overview, metrics) {
    this.renderOverviewCards(overview);
    this.renderRiskTrends(metrics.risks);
    this.renderComplianceScores(metrics.compliance);
    this.renderThreatDistribution(metrics.threats);
    this.renderRecentActivity();
  }

  renderOverviewCards(overview) {
    const overviewContainer = document.getElementById('overview-cards');
    if (!overviewContainer) return;

    overviewContainer.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        ${this.createOverviewCard('Risks', overview.risks.total, overview.risks.trend, 'bg-red-500', 'fas fa-exclamation-triangle')}
        ${this.createOverviewCard('Compliance', overview.compliance.overallScore + '%', overview.compliance.trend, 'bg-blue-500', 'fas fa-shield-alt')}
        ${this.createOverviewCard('Threats', overview.threats.models, overview.threats.trend, 'bg-purple-500', 'fas fa-bug')}
        ${this.createOverviewCard('Incidents', overview.incidents.total, overview.incidents.trend, 'bg-orange-500', 'fas fa-fire')}
        ${this.createOverviewCard('Anomalies', overview.behavioral.anomalies, overview.behavioral.trend, 'bg-yellow-500', 'fas fa-eye')}
      </div>
    `;
  }

  createOverviewCard(title, value, trend, colorClass, iconClass) {
    const trendColor = trend.startsWith('+') ? 'text-red-500' : trend.startsWith('-') ? 'text-green-500' : 'text-gray-500';
    
    return `
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-gray-600">${title}</p>
            <p class="text-2xl font-bold text-gray-900">${value}</p>
            <p class="text-sm ${trendColor}">${trend} from last month</p>
          </div>
          <div class="${colorClass} rounded-full p-3 text-white">
            <i class="${iconClass} text-xl"></i>
          </div>
        </div>
      </div>
    `;
  }

  renderRiskTrends(risksData) {
    const ctx = document.getElementById('riskTrendsChart');
    if (!ctx) return;

    if (this.charts.has('riskTrends')) {
      this.charts.get('riskTrends').destroy();
    }

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: risksData.timeSeries.map(d => d.date),
        datasets: [
          {
            label: 'Total Risks',
            data: risksData.timeSeries.map(d => d.total),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4
          },
          {
            label: 'Critical Risks',
            data: risksData.timeSeries.map(d => d.critical),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4
          },
          {
            label: 'Resolved',
            data: risksData.timeSeries.map(d => d.resolved),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Risk Trends (30 Days)'
          },
          legend: {
            position: 'bottom'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });

    this.charts.set('riskTrends', chart);
  }

  renderComplianceScores(complianceData) {
    const ctx = document.getElementById('complianceChart');
    if (!ctx) return;

    if (this.charts.has('compliance')) {
      this.charts.get('compliance').destroy();
    }

    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: complianceData.scores.map(s => s.framework),
        datasets: [
          {
            label: 'Current Score',
            data: complianceData.scores.map(s => s.score),
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1
          },
          {
            label: 'Target Score',
            data: complianceData.scores.map(s => s.target),
            backgroundColor: 'rgba(34, 197, 94, 0.3)',
            borderColor: 'rgb(34, 197, 94)',
            borderWidth: 2,
            type: 'line'
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Compliance Framework Scores'
          },
          legend: {
            position: 'bottom'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });

    this.charts.set('compliance', chart);
  }

  renderThreatDistribution(threatsData) {
    const ctx = document.getElementById('threatChart');
    if (!ctx) return;

    if (this.charts.has('threats')) {
      this.charts.get('threats').destroy();
    }

    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: threatsData.distribution.map(t => t.category.replace(/_/g, ' ').toUpperCase()),
        datasets: [{
          data: threatsData.distribution.map(t => t.count),
          backgroundColor: [
            'rgba(239, 68, 68, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)'
          ],
          borderColor: [
            'rgb(239, 68, 68)',
            'rgb(245, 158, 11)',
            'rgb(59, 130, 246)',
            'rgb(16, 185, 129)',
            'rgb(139, 92, 246)',
            'rgb(236, 72, 153)'
          ],
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          title: {
            display: true,
            text: 'Threat Distribution by STRIDE Category'
          },
          legend: {
            position: 'bottom'
          }
        }
      }
    });

    this.charts.set('threats', chart);
  }

  renderRecentActivity() {
    const activityContainer = document.getElementById('recent-activity');
    if (!activityContainer) return;

    const activities = [
      {
        type: 'risk',
        icon: 'fas fa-exclamation-triangle',
        color: 'text-red-500',
        message: 'New high-severity risk identified: Unauthorized Access',
        time: '5 minutes ago',
        user: 'Security Team'
      },
      {
        type: 'compliance',
        icon: 'fas fa-check-circle',
        color: 'text-green-500',
        message: 'ISO 27001 control A.12.1.1 marked as implemented',
        time: '12 minutes ago',
        user: 'Compliance Manager'
      },
      {
        type: 'threat',
        icon: 'fas fa-bug',
        color: 'text-purple-500',
        message: 'New threat model created for payment processing',
        time: '25 minutes ago',
        user: 'Threat Analyst'
      },
      {
        type: 'anomaly',
        icon: 'fas fa-eye',
        color: 'text-yellow-500',
        message: 'Behavioral anomaly detected for user john.doe@company.com',
        time: '35 minutes ago',
        user: 'ML Analytics'
      },
      {
        type: 'incident',
        icon: 'fas fa-fire',
        color: 'text-orange-500',
        message: 'Incident #INC-2024-001 resolved and closed',
        time: '1 hour ago',
        user: 'SOC Team'
      }
    ];

    activityContainer.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div class="space-y-4">
          ${activities.map(activity => `
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0">
                <i class="${activity.icon} ${activity.color} text-lg"></i>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-gray-900">${activity.message}</p>
                <p class="text-xs text-gray-500">${activity.time} by ${activity.user}</p>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="mt-6">
          <a href="#" class="text-blue-600 hover:text-blue-500 text-sm font-medium">
            View all activity →
          </a>
        </div>
      </div>
    `;
  }

  renderNotifications(notificationsData) {
    const notificationContainer = document.getElementById('notifications');
    if (!notificationContainer) return;

    const notifications = notificationsData.notifications || [];
    
    notificationContainer.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-gray-900">Notifications</h3>
          <span class="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
            ${notifications.filter(n => !n.isRead).length} unread
          </span>
        </div>
        <div class="space-y-3">
          ${notifications.slice(0, 5).map(notification => `
            <div class="flex items-start space-x-3 ${notification.isRead ? 'opacity-60' : ''}">
              <div class="flex-shrink-0">
                ${this.getNotificationIcon(notification.type)}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900">${notification.title}</p>
                <p class="text-xs text-gray-500">${notification.message}</p>
                <p class="text-xs text-gray-400">${this.formatTimestamp(notification.timestamp)}</p>
              </div>
              ${!notification.isRead ? `
                <button onclick="dashboard.markNotificationAsRead('${notification.id}')" 
                        class="text-blue-600 hover:text-blue-500 text-xs">
                  Mark as read
                </button>
              ` : ''}
            </div>
          `).join('')}
        </div>
        ${notifications.length > 5 ? `
          <div class="mt-4">
            <a href="#" class="text-blue-600 hover:text-blue-500 text-sm font-medium">
              View all notifications →
            </a>
          </div>
        ` : ''}
      </div>
    `;
  }

  // =============================================================================
  // UTILITY FUNCTIONS
  // =============================================================================

  getNotificationIcon(type) {
    const icons = {
      risk_alert: '<i class="fas fa-exclamation-triangle text-red-500"></i>',
      compliance_update: '<i class="fas fa-shield-alt text-blue-500"></i>',
      security_incident: '<i class="fas fa-fire text-orange-500"></i>',
      system_status: '<i class="fas fa-server text-gray-500"></i>',
      user_activity: '<i class="fas fa-user text-green-500"></i>',
      report_ready: '<i class="fas fa-file-alt text-purple-500"></i>'
    };
    return icons[type] || '<i class="fas fa-bell text-gray-500"></i>';
  }

  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return `${Math.floor(diff / 86400000)} days ago`;
  }

  async markNotificationAsRead(notificationId) {
    try {
      await this.apiCall(`/notifications/${notificationId}/read`, { method: 'POST' });
      // Refresh notifications
      const notifications = await this.loadNotifications();
      this.renderNotifications(notifications);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  // =============================================================================
  // AUTO REFRESH
  // =============================================================================

  startAutoRefresh() {
    this.autoRefreshTimer = setInterval(async () => {
      try {
        await this.updateMetrics();
      } catch (error) {
        console.error('Auto refresh failed:', error);
      }
    }, this.refreshInterval);
  }

  stopAutoRefresh() {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
  }

  async updateMetrics() {
    const overview = await this.loadDashboardOverview();
    this.renderOverviewCards(overview);

    const notifications = await this.loadNotifications();
    this.renderNotifications(notifications);
  }

  async updateRiskMetrics() {
    const metrics = await this.loadDashboardMetrics();
    this.renderRiskTrends(metrics.risks);
  }

  async updateComplianceMetrics() {
    const metrics = await this.loadDashboardMetrics();
    this.renderComplianceScores(metrics.compliance);
  }

  async updateThreatMetrics() {
    const metrics = await this.loadDashboardMetrics();
    this.renderThreatDistribution(metrics.threats);
  }

  async updateBehavioralMetrics() {
    // Update behavioral analytics section
    this.renderRecentActivity();
  }

  // =============================================================================
  // UI MANAGEMENT
  // =============================================================================

  showLoginForm() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('dashboard-container').classList.add('hidden');
  }

  hideLoginForm() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('dashboard-container').classList.remove('hidden');
  }

  updateUserInterface() {
    if (this.currentUser) {
      document.getElementById('user-name').textContent = this.currentUser.name;
      document.getElementById('user-role').textContent = this.currentUser.role;
    }
  }

  showLoading() {
    document.getElementById('loading').classList.remove('hidden');
  }

  hideLoading() {
    document.getElementById('loading').classList.add('hidden');
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    const colors = {
      info: 'bg-blue-500',
      success: 'bg-green-500',
      warning: 'bg-yellow-500',
      error: 'bg-red-500'
    };

    notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-300`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 5000);
  }

  // =============================================================================
  // EVENT LISTENERS
  // =============================================================================

  setupEventListeners() {
    // Login form
    document.getElementById('login-button').addEventListener('click', (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      this.login(email, password);
    });

    // Logout button
    document.getElementById('logout-button').addEventListener('click', () => {
      this.logout();
    });

    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const section = e.target.dataset.section;
        this.navigateToSection(section);
      });
    });

    // Refresh button
    document.getElementById('refresh-button').addEventListener('click', () => {
      this.loadDashboard();
    });

    // Auto-refresh toggle
    document.getElementById('auto-refresh-toggle').addEventListener('change', (e) => {
      if (e.target.checked) {
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }
    });
  }

  navigateToSection(section) {
    // Hide all sections
    document.querySelectorAll('.dashboard-section').forEach(sec => {
      sec.classList.add('hidden');
    });

    // Show selected section
    const targetSection = document.getElementById(`${section}-section`);
    if (targetSection) {
      targetSection.classList.remove('hidden');
    }

    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('bg-blue-100', 'text-blue-700');
      link.classList.add('text-gray-600', 'hover:text-gray-900');
    });

    const activeLink = document.querySelector(`[data-section="${section}"]`);
    if (activeLink) {
      activeLink.classList.remove('text-gray-600', 'hover:text-gray-900');
      activeLink.classList.add('bg-blue-100', 'text-blue-700');
    }
  }

  // =============================================================================
  // MOCK DATA (for development/demo)
  // =============================================================================

  getMockOverviewData() {
    return {
      risks: {
        total: 156,
        open: 42,
        critical: 8,
        high: 15,
        trend: '+12%'
      },
      compliance: {
        frameworks: 4,
        overallScore: 87.5,
        gaps: 23,
        trend: '+5%'
      },
      threats: {
        models: 8,
        highRiskPaths: 12,
        mitigations: 34,
        trend: 'stable'
      },
      incidents: {
        total: 89,
        resolved: 76,
        pending: 13,
        trend: '-8%'
      },
      behavioral: {
        anomalies: 5,
        users: 234,
        riskScore: 6.2,
        trend: 'improving'
      }
    };
  }

  getMockMetricsData() {
    return {
      risks: {
        timeSeries: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          total: 150 + Math.floor(Math.random() * 20),
          critical: 8 + Math.floor(Math.random() * 5),
          resolved: 120 + Math.floor(Math.random() * 10)
        }))
      },
      compliance: {
        scores: [
          { framework: 'ISO 27001', score: 89, target: 95 },
          { framework: 'SOC 2', score: 92, target: 95 },
          { framework: 'NIST CSF', score: 85, target: 90 },
          { framework: 'GDPR', score: 91, target: 95 }
        ]
      },
      threats: {
        distribution: [
          { category: 'spoofing', count: 15 },
          { category: 'tampering', count: 12 },
          { category: 'repudiation', count: 8 },
          { category: 'information_disclosure', count: 25 },
          { category: 'denial_of_service', count: 18 },
          { category: 'elevation_of_privilege', count: 22 }
        ]
      }
    };
  }
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
  dashboard = new ARIA5Dashboard();
});

// Export for global access
window.dashboard = dashboard;