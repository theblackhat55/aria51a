/**
 * WebSocket Routes - Real-time notifications and updates
 * 
 * Provides WebSocket endpoints for real-time platform updates.
 */

import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { WebSocketManager, NotificationService } from '../services/websocket-service';

const websocketRoutes = new Hono<{ Bindings: { DB: D1Database } }>();

// Helper function to get current user
async function getCurrentUser(c: any) {
  const sessionId = getCookie(c, 'session_id');
  if (!sessionId) return null;
  
  const session = await c.env.DB.prepare(`
    SELECT u.* FROM users u 
    JOIN user_sessions s ON u.id = s.user_id 
    WHERE s.session_id = ? AND s.expires_at > datetime('now')
  `).bind(sessionId).first();
  
  return session;
}

/**
 * WebSocket connection endpoint
 */
websocketRoutes.get('/ws', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const upgradeHeader = c.req.header('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return c.text('Expected websocket', 400);
  }

  const webSocketManager = new WebSocketManager(c.env.DB);
  return await webSocketManager.handleConnection(c.req.raw, (user as any).id);
});

/**
 * Real-time notifications dashboard
 */
websocketRoutes.get('/notifications', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.redirect('/login');
  }

  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Real-time Notifications - ARIA5-Ubuntu</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <script src="https://unpkg.com/htmx.org@1.9.10"></script>
      <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
      <div class="min-h-screen">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-4">
              <div class="flex items-center space-x-4">
                <a href="/" class="text-blue-600 hover:text-blue-800">
                  <i class="fas fa-arrow-left"></i> Back to Dashboard
                </a>
                <h1 class="text-2xl font-bold text-gray-900">
                  <i class="fas fa-bell mr-2"></i>
                  Real-time Notifications
                </h1>
                <div id="connection-status" class="px-3 py-1 rounded-full text-sm">
                  <i class="fas fa-circle text-gray-400 mr-1"></i>
                  <span>Connecting...</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <!-- Statistics Cards -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="p-2 bg-blue-500 rounded-lg">
                  <i class="fas fa-bell text-white"></i>
                </div>
                <div class="ml-4">
                  <h3 class="text-sm font-medium text-gray-500">Active Connections</h3>
                  <p id="active-connections" class="text-2xl font-semibold text-gray-900">-</p>
                </div>
              </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="p-2 bg-green-500 rounded-lg">
                  <i class="fas fa-paper-plane text-white"></i>
                </div>
                <div class="ml-4">
                  <h3 class="text-sm font-medium text-gray-500">Messages Sent</h3>
                  <p id="messages-sent" class="text-2xl font-semibold text-gray-900">-</p>
                </div>
              </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="p-2 bg-yellow-500 rounded-lg">
                  <i class="fas fa-exclamation-triangle text-white"></i>
                </div>
                <div class="ml-4">
                  <h3 class="text-sm font-medium text-gray-500">Alerts Today</h3>
                  <p id="alerts-today" class="text-2xl font-semibold text-gray-900">-</p>
                </div>
              </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
              <div class="flex items-center">
                <div class="p-2 bg-purple-500 rounded-lg">
                  <i class="fas fa-clock text-white"></i>
                </div>
                <div class="ml-4">
                  <h3 class="text-sm font-medium text-gray-500">Last Update</h3>
                  <p id="last-update" class="text-2xl font-semibold text-gray-900">-</p>
                </div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Live Notifications Feed -->
            <div class="bg-white rounded-lg shadow">
              <div class="px-6 py-4 border-b border-gray-200">
                <div class="flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-gray-900">Live Notifications</h2>
                  <button id="clear-notifications" class="text-sm text-red-600 hover:text-red-800">
                    <i class="fas fa-trash mr-1"></i>Clear All
                  </button>
                </div>
              </div>
              <div id="notifications-feed" class="max-h-96 overflow-y-auto">
                <div class="p-6 text-center text-gray-500">
                  <i class="fas fa-bell-slash text-2xl mb-2"></i>
                  <p>No notifications yet. Connect to receive real-time updates.</p>
                </div>
              </div>
            </div>

            <!-- Test Controls -->
            <div class="bg-white rounded-lg shadow">
              <div class="px-6 py-4 border-b border-gray-200">
                <h2 class="text-lg font-semibold text-gray-900">Test Controls</h2>
              </div>
              <div class="p-6 space-y-4">
                <!-- Connection Controls -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Connection</label>
                  <div class="flex space-x-2">
                    <button id="connect-ws" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      <i class="fas fa-plug mr-1"></i>Connect
                    </button>
                    <button id="disconnect-ws" class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700" disabled>
                      <i class="fas fa-unlink mr-1"></i>Disconnect
                    </button>
                  </div>
                </div>

                <!-- Test Notifications -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Test Notifications</label>
                  <div class="grid grid-cols-2 gap-2">
                    <button onclick="sendTestNotification('info')" class="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                      <i class="fas fa-info-circle mr-1"></i>Info
                    </button>
                    <button onclick="sendTestNotification('warning')" class="px-3 py-2 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700">
                      <i class="fas fa-exclamation-triangle mr-1"></i>Warning
                    </button>
                    <button onclick="sendTestNotification('error')" class="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700">
                      <i class="fas fa-times-circle mr-1"></i>Error
                    </button>
                    <button onclick="sendTestNotification('success')" class="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                      <i class="fas fa-check-circle mr-1"></i>Success
                    </button>
                  </div>
                </div>

                <!-- Broadcast Message -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Broadcast Message</label>
                  <div class="flex space-x-2">
                    <input type="text" id="broadcast-message" class="flex-1 px-3 py-2 border rounded-lg" placeholder="Enter message to broadcast">
                    <button onclick="sendBroadcast()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                      <i class="fas fa-broadcast-tower mr-1"></i>Send
                    </button>
                  </div>
                </div>

                <!-- WebSocket Log -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">WebSocket Log</label>
                  <div id="ws-log" class="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono max-h-32 overflow-y-auto">
                    <div>WebSocket console ready...</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <script>
        let ws = null;
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 5;

        // WebSocket logging
        function logWS(message, type = 'info') {
          const log = document.getElementById('ws-log');
          const timestamp = new Date().toLocaleTimeString();
          const colors = {
            info: 'text-green-400',
            error: 'text-red-400',
            warning: 'text-yellow-400',
            success: 'text-blue-400'
          };
          log.innerHTML += \`<div class="\${colors[type] || colors.info}">[\${timestamp}] \${message}</div>\`;
          log.scrollTop = log.scrollHeight;
        }

        // Update connection status
        function updateConnectionStatus(status) {
          const statusEl = document.getElementById('connection-status');
          const statuses = {
            connecting: { icon: 'fas fa-circle text-yellow-400', text: 'Connecting...', class: 'bg-yellow-100 text-yellow-800' },
            connected: { icon: 'fas fa-circle text-green-400', text: 'Connected', class: 'bg-green-100 text-green-800' },
            disconnected: { icon: 'fas fa-circle text-red-400', text: 'Disconnected', class: 'bg-red-100 text-red-800' },
            error: { icon: 'fas fa-circle text-red-400', text: 'Connection Error', class: 'bg-red-100 text-red-800' }
          };
          
          const config = statuses[status] || statuses.disconnected;
          statusEl.className = \`px-3 py-1 rounded-full text-sm \${config.class}\`;
          statusEl.innerHTML = \`<i class="\${config.icon} mr-1"></i><span>\${config.text}</span>\`;
        }

        // Add notification to feed
        function addNotification(notification) {
          const feed = document.getElementById('notifications-feed');
          
          // Clear "no notifications" message
          if (feed.querySelector('.text-center')) {
            feed.innerHTML = '';
          }

          const typeConfig = {
            info: { icon: 'fas fa-info-circle', color: 'blue' },
            warning: { icon: 'fas fa-exclamation-triangle', color: 'yellow' },
            error: { icon: 'fas fa-times-circle', color: 'red' },
            success: { icon: 'fas fa-check-circle', color: 'green' }
          };

          const config = typeConfig[notification.type] || typeConfig.info;
          const timestamp = new Date().toLocaleTimeString();

          const notificationEl = document.createElement('div');
          notificationEl.className = 'px-6 py-4 border-b border-gray-200 hover:bg-gray-50';
          notificationEl.innerHTML = \`
            <div class="flex items-start space-x-3">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-\${config.color}-100 rounded-full flex items-center justify-center">
                  <i class="\${config.icon} text-\${config.color}-600 text-sm"></i>
                </div>
              </div>
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <h4 class="font-medium text-gray-900">\${notification.title || 'Notification'}</h4>
                  <span class="text-xs text-gray-500">\${timestamp}</span>
                </div>
                <p class="text-sm text-gray-600 mt-1">\${notification.message}</p>
                \${notification.data ? \`<div class="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded font-mono">\${JSON.stringify(notification.data)}</div>\` : ''}
              </div>
            </div>
          \`;

          feed.insertBefore(notificationEl, feed.firstChild);

          // Keep only last 20 notifications
          while (feed.children.length > 20) {
            feed.removeChild(feed.lastChild);
          }
        }

        // Connect WebSocket
        function connectWebSocket() {
          if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
            return;
          }

          updateConnectionStatus('connecting');
          logWS('Attempting to connect WebSocket...');

          const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
          const wsUrl = \`\${protocol}//\${window.location.host}/ws\`;
          
          ws = new WebSocket(wsUrl);

          ws.onopen = function() {
            updateConnectionStatus('connected');
            logWS('WebSocket connected successfully', 'success');
            reconnectAttempts = 0;
            
            document.getElementById('connect-ws').disabled = true;
            document.getElementById('disconnect-ws').disabled = false;

            // Send initial message
            ws.send(JSON.stringify({
              type: 'subscribe',
              channels: ['notifications', 'alerts', 'system']
            }));
          };

          ws.onmessage = function(event) {
            logWS(\`Received: \${event.data}\`);
            
            try {
              const data = JSON.parse(event.data);
              
              if (data.type === 'notification') {
                addNotification(data);
              } else if (data.type === 'stats') {
                updateStats(data.stats);
              }
            } catch (e) {
              logWS(\`Failed to parse message: \${e.message}\`, 'error');
            }
          };

          ws.onclose = function(event) {
            updateConnectionStatus('disconnected');
            logWS(\`WebSocket closed: \${event.code} - \${event.reason}\`, 'warning');
            
            document.getElementById('connect-ws').disabled = false;
            document.getElementById('disconnect-ws').disabled = true;

            // Auto-reconnect
            if (reconnectAttempts < maxReconnectAttempts) {
              reconnectAttempts++;
              setTimeout(() => {
                logWS(\`Attempting reconnect (\${reconnectAttempts}/\${maxReconnectAttempts})...\`);
                connectWebSocket();
              }, 2000 * reconnectAttempts);
            }
          };

          ws.onerror = function(error) {
            updateConnectionStatus('error');
            logWS(\`WebSocket error: \${error}\`, 'error');
          };
        }

        // Disconnect WebSocket
        function disconnectWebSocket() {
          if (ws) {
            ws.close();
            ws = null;
          }
        }

        // Update statistics
        function updateStats(stats) {
          document.getElementById('active-connections').textContent = stats.active_connections || '-';
          document.getElementById('messages-sent').textContent = stats.messages_sent || '-';
          document.getElementById('alerts-today').textContent = stats.alerts_today || '-';
          document.getElementById('last-update').textContent = new Date().toLocaleTimeString();
        }

        // Send test notification
        function sendTestNotification(type) {
          const messages = {
            info: 'This is an info notification for testing purposes.',
            warning: 'This is a warning notification. Please review the system status.',
            error: 'This is an error notification. Immediate attention required!',
            success: 'Operation completed successfully. All systems are working normally.'
          };

          fetch('/api/notifications/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: type,
              title: \`Test \${type.charAt(0).toUpperCase() + type.slice(1)} Notification\`,
              message: messages[type],
              data: { test: true, timestamp: Date.now() }
            })
          }).then(response => response.json())
            .then(data => logWS(\`Test notification sent: \${data.success ? 'SUCCESS' : 'FAILED'}\`, data.success ? 'success' : 'error'))
            .catch(error => logWS(\`Failed to send test notification: \${error}\`, 'error'));
        }

        // Send broadcast message
        function sendBroadcast() {
          const messageInput = document.getElementById('broadcast-message');
          const message = messageInput.value.trim();
          
          if (!message) {
            alert('Please enter a message to broadcast');
            return;
          }

          fetch('/api/notifications/broadcast', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'Broadcast Message',
              message: message,
              type: 'info'
            })
          }).then(response => response.json())
            .then(data => {
              logWS(\`Broadcast sent: \${data.success ? 'SUCCESS' : 'FAILED'}\`, data.success ? 'success' : 'error');
              if (data.success) messageInput.value = '';
            })
            .catch(error => logWS(\`Failed to send broadcast: \${error}\`, 'error'));
        }

        // Event listeners
        document.getElementById('connect-ws').addEventListener('click', connectWebSocket);
        document.getElementById('disconnect-ws').addEventListener('click', disconnectWebSocket);
        document.getElementById('clear-notifications').addEventListener('click', function() {
          document.getElementById('notifications-feed').innerHTML = \`
            <div class="p-6 text-center text-gray-500">
              <i class="fas fa-bell-slash text-2xl mb-2"></i>
              <p>No notifications yet. Connect to receive real-time updates.</p>
            </div>
          \`;
        });

        // Auto-connect on page load
        document.addEventListener('DOMContentLoaded', function() {
          setTimeout(connectWebSocket, 1000);
        });
      </script>
    </body>
    </html>
  `);
});

/**
 * Send notification API
 */
websocketRoutes.post('/api/notifications/send', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { type, title, message, data } = await c.req.json();

    const notificationService = new NotificationService(c.env.DB);
    await notificationService.initializeTables();

    const notificationId = await notificationService.sendNotification(
      (user as any).id,
      type || 'info',
      title || 'Notification',
      message,
      data
    );

    return c.json({
      success: true,
      notification_id: notificationId
    });

  } catch (error) {
    console.error('Send notification error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send notification'
    }, 500);
  }
});

/**
 * Broadcast notification API
 */
websocketRoutes.post('/api/notifications/broadcast', async (c) => {
  const user = await getCurrentUser(c);
  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { type, title, message, data } = await c.req.json();

    const notificationService = new NotificationService(c.env.DB);
    await notificationService.initializeTables();

    await notificationService.broadcastNotification(
      type || 'info',
      title || 'Broadcast',
      message,
      data
    );

    return c.json({
      success: true,
      message: 'Broadcast sent successfully'
    });

  } catch (error) {
    console.error('Broadcast notification error:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send broadcast'
    }, 500);
  }
});

export { websocketRoutes };