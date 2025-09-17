import { Hono } from 'hono';
import { html, raw } from 'hono/html';
import { requireAuth, requireAdmin } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import type { CloudflareBindings } from '../types';
import SMTPService from '../services/smtp-service';

export function createSMTPSettingsRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();

  // SMTP Settings Page
  app.get('/settings/smtp', async (c) => {
    try {
      const user = c.get('user');

      const smtpService = new SMTPService(c.env);
      const config = await smtpService.loadConfig();

      const content = html`
        <div class="space-y-6">
          <!-- Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-4">
              <button onclick="window.location.href='/admin/settings'" class="flex items-center text-gray-500 hover:text-gray-700">
                <i class="fas fa-arrow-left mr-2"></i>
                Back to Settings
              </button>
              <div>
                <h1 class="text-3xl font-bold text-gray-900">SMTP Settings</h1>
                <p class="mt-1 text-sm text-gray-600">Configure email notifications and messaging</p>
              </div>
            </div>
            <button onclick="testSMTPConnection()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
              <i class="fas fa-paper-plane mr-2"></i>
              Test Connection
            </button>
          </div>

          <!-- SMTP Configuration Form -->
          <div class="bg-white shadow rounded-lg">
            <form hx-post="/admin/settings/smtp" hx-target="#smtp-result" class="divide-y divide-gray-200">
              <!-- Server Configuration -->
              <div class="p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">
                  <i class="fas fa-server mr-2"></i>Server Configuration
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Host <span class="text-red-500">*</span>
                    </label>
                    <input type="text" name="host" value="${config?.host || ''}" required
                           placeholder="smtp.gmail.com"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <p class="mt-1 text-xs text-gray-500">SMTP server hostname</p>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      SMTP Port <span class="text-red-500">*</span>
                    </label>
                    <select name="port" required
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                      <option value="587" ${config?.port === 587 ? 'selected' : ''}>587 (STARTTLS)</option>
                      <option value="465" ${config?.port === 465 ? 'selected' : ''}>465 (SSL/TLS)</option>
                      <option value="25" ${config?.port === 25 ? 'selected' : ''}>25 (Plain)</option>
                      <option value="2587" ${config?.port === 2587 ? 'selected' : ''}>2587 (Alternative)</option>
                    </select>
                    <p class="mt-1 text-xs text-gray-500">SMTP server port</p>
                  </div>
                </div>

                <div class="mt-6">
                  <div class="flex items-center">
                    <input type="checkbox" name="secure" value="true" ${config?.secure ? 'checked' : ''} 
                           class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                    <label class="ml-3 block text-sm text-gray-700">
                      <span class="font-medium">Use SSL/TLS Encryption</span>
                      <span class="text-gray-500 block">Recommended for secure email transmission</span>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Authentication -->
              <div class="p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">
                  <i class="fas fa-key mr-2"></i>Authentication
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Username <span class="text-red-500">*</span>
                    </label>
                    <input type="text" name="username" value="${config?.username || ''}" required
                           placeholder="your-email@domain.com"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <p class="mt-1 text-xs text-gray-500">SMTP authentication username</p>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Password <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                      <input type="password" name="password" value="${config?.password || ''}" required
                             placeholder="Enter password or API key"
                             class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10">
                      <button type="button" onclick="togglePassword(this)" class="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                        <i class="fas fa-eye"></i>
                      </button>
                    </div>
                    <p class="mt-1 text-xs text-gray-500">Password or API key for authentication</p>
                  </div>
                </div>
              </div>

              <!-- Sender Information -->
              <div class="p-6">
                <h3 class="text-lg font-medium text-gray-900 mb-4">
                  <i class="fas fa-envelope mr-2"></i>Sender Information
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      From Name <span class="text-red-500">*</span>
                    </label>
                    <input type="text" name="from_name" value="${config?.from_name || 'ARIA5 Platform'}" required
                           placeholder="ARIA5 Platform"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <p class="mt-1 text-xs text-gray-500">Display name for outgoing emails</p>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      From Email <span class="text-red-500">*</span>
                    </label>
                    <input type="email" name="from_email" value="${config?.from_email || ''}" required
                           placeholder="noreply@your-domain.com"
                           class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <p class="mt-1 text-xs text-gray-500">Email address for outgoing messages</p>
                  </div>
                </div>
              </div>

              <!-- Provider Examples -->
              <div class="p-6 bg-gray-50">
                <h3 class="text-lg font-medium text-gray-900 mb-4">
                  <i class="fas fa-info-circle mr-2"></i>Common Provider Settings
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div class="bg-white p-4 rounded-lg border">
                    <h4 class="font-semibold text-gray-900 mb-2">Gmail</h4>
                    <p class="text-sm text-gray-600 mb-2">Host: smtp.gmail.com</p>
                    <p class="text-sm text-gray-600 mb-2">Port: 587 (TLS)</p>
                    <p class="text-sm text-gray-600">Use App Password</p>
                  </div>
                  
                  <div class="bg-white p-4 rounded-lg border">
                    <h4 class="font-semibold text-gray-900 mb-2">Outlook</h4>
                    <p class="text-sm text-gray-600 mb-2">Host: smtp-mail.outlook.com</p>
                    <p class="text-sm text-gray-600 mb-2">Port: 587 (TLS)</p>
                    <p class="text-sm text-gray-600">Regular credentials</p>
                  </div>
                  
                  <div class="bg-white p-4 rounded-lg border">
                    <h4 class="font-semibold text-gray-900 mb-2">SendGrid</h4>
                    <p class="text-sm text-gray-600 mb-2">Host: smtp.sendgrid.net</p>
                    <p class="text-sm text-gray-600 mb-2">Port: 587 (TLS)</p>
                    <p class="text-sm text-gray-600">Username: apikey</p>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex justify-end items-center p-6 space-x-3">
                <button type="button" onclick="resetForm()" 
                        class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                  <i class="fas fa-undo mr-2"></i>Reset
                </button>
                <button type="submit" class="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium">
                  <i class="fas fa-save mr-2"></i>Save Configuration
                </button>
              </div>
              
              <div id="smtp-result" class="px-6 pb-6"></div>
            </form>
          </div>

          <!-- Test Email Section -->
          <div class="bg-white shadow rounded-lg p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              <i class="fas fa-paper-plane mr-2"></i>Test Email
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Test Email Address</label>
                <input type="email" id="test-email" placeholder="test@example.com"
                       class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              </div>
              <div class="flex items-end">
                <button onclick="sendTestEmail()" class="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium">
                  <i class="fas fa-paper-plane mr-2"></i>Send Test Email
                </button>
              </div>
            </div>
            <div id="test-result" class="mt-4"></div>
          </div>
        </div>

        <script>
          function togglePassword(button) {
            const input = button.previousElementSibling;
            const icon = button.querySelector('i');
            
            if (input.type === 'password') {
              input.type = 'text';
              icon.className = 'fas fa-eye-slash';
            } else {
              input.type = 'password';
              icon.className = 'fas fa-eye';
            }
          }

          function resetForm() {
            if (confirm('Are you sure you want to reset the form? All unsaved changes will be lost.')) {
              document.querySelector('form').reset();
            }
          }

          function testSMTPConnection() {
            document.getElementById('smtp-result').innerHTML = '<div class="text-blue-600"><i class="fas fa-spinner fa-spin mr-2"></i>Testing SMTP connection...</div>';
            
            fetch('/admin/settings/smtp/test', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            })
            .then(response => response.json())
            .then(data => {
              const resultDiv = document.getElementById('smtp-result');
              if (data.success) {
                resultDiv.innerHTML = '<div class="bg-green-50 border border-green-200 rounded-lg p-4"><div class="flex items-center"><i class="fas fa-check-circle text-green-500 mr-2"></i><span class="text-green-700 font-medium">' + data.message + '</span></div></div>';
              } else {
                resultDiv.innerHTML = '<div class="bg-red-50 border border-red-200 rounded-lg p-4"><div class="flex items-center"><i class="fas fa-exclamation-circle text-red-500 mr-2"></i><span class="text-red-700 font-medium">' + data.message + '</span></div></div>';
              }
            })
            .catch(error => {
              document.getElementById('smtp-result').innerHTML = '<div class="bg-red-50 border border-red-200 rounded-lg p-4"><div class="flex items-center"><i class="fas fa-exclamation-circle text-red-500 mr-2"></i><span class="text-red-700 font-medium">Error: ' + error.message + '</span></div></div>';
            });
          }

          function sendTestEmail() {
            const emailInput = document.getElementById('test-email');
            const email = emailInput.value.trim();
            
            if (!email) {
              alert('Please enter a test email address');
              return;
            }

            document.getElementById('test-result').innerHTML = '<div class="text-blue-600"><i class="fas fa-spinner fa-spin mr-2"></i>Sending test email...</div>';
            
            fetch('/admin/settings/smtp/test-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: email })
            })
            .then(response => response.json())
            .then(data => {
              const resultDiv = document.getElementById('test-result');
              if (data.success) {
                resultDiv.innerHTML = '<div class="bg-green-50 border border-green-200 rounded-lg p-4"><div class="flex items-center"><i class="fas fa-check-circle text-green-500 mr-2"></i><span class="text-green-700 font-medium">' + data.message + '</span></div></div>';
              } else {
                resultDiv.innerHTML = '<div class="bg-red-50 border border-red-200 rounded-lg p-4"><div class="flex items-center"><i class="fas fa-exclamation-circle text-red-500 mr-2"></i><span class="text-red-700 font-medium">' + data.message + '</span></div></div>';
              }
            })
            .catch(error => {
              document.getElementById('test-result').innerHTML = '<div class="bg-red-50 border border-red-200 rounded-lg p-4"><div class="flex items-center"><i class="fas fa-exclamation-circle text-red-500 mr-2"></i><span class="text-red-700 font-medium">Error: ' + error.message + '</span></div></div>';
            });
          }
        </script>
      `;

      return c.html(
        cleanLayout({
          title: 'SMTP Settings',
          user,
          content: content
        })
      );
    } catch (error) {
      console.error('❌ Error loading SMTP settings:', error);
      return c.html('Error loading SMTP settings', 500);
    }
  });

  // Save SMTP Configuration
  app.post('/settings/smtp', async (c) => {
    try {
      const formData = await c.req.parseBody();
      
      const config = {
        host: formData.host as string,
        port: parseInt(formData.port as string),
        secure: formData.secure === 'true',
        username: formData.username as string,
        password: formData.password as string,
        from_name: formData.from_name as string,
        from_email: formData.from_email as string
      };

      const smtpService = new SMTPService(c.env);
      const success = await smtpService.saveConfig(config);

      if (success) {
        return c.html(html`
          <div class="bg-green-50 border border-green-200 rounded-lg p-4">
            <div class="flex items-center">
              <i class="fas fa-check-circle text-green-500 mr-2"></i>
              <span class="text-green-700 font-medium">SMTP configuration saved successfully!</span>
            </div>
          </div>
        `);
      } else {
        return c.html(html`
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex items-center">
              <i class="fas fa-exclamation-circle text-red-500 mr-2"></i>
              <span class="text-red-700 font-medium">Failed to save SMTP configuration</span>
            </div>
          </div>
        `);
      }
    } catch (error) {
      console.error('Error saving SMTP config:', error);
      return c.html(html`
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-center">
            <i class="fas fa-exclamation-circle text-red-500 mr-2"></i>
            <span class="text-red-700 font-medium">Error: ${error.message}</span>
          </div>
        </div>
      `);
    }
  });

  // Test SMTP Connection
  app.post('/settings/smtp/test', async (c) => {
    try {
      const smtpService = new SMTPService(c.env);
      const result = await smtpService.testConnection();
      
      return c.json(result);
    } catch (error) {
      console.error('Error testing SMTP connection:', error);
      return c.json({ success: false, message: 'Failed to test connection: ' + error.message });
    }
  });

  // Send Test Email
  app.post('/settings/smtp/test-email', async (c) => {
    try {
      const body = await c.req.json();
      const testEmail = body.email;

      if (!testEmail) {
        return c.json({ success: false, message: 'Email address is required' });
      }

      const smtpService = new SMTPService(c.env);
      const template = SMTPService.getNotificationTemplate(
        'SMTP Test Email',
        'This is a test email from your ARIA5 Platform SMTP configuration. If you received this message, your email settings are working correctly!'
      );

      const result = await smtpService.sendEmail(testEmail, template);
      return c.json(result);
    } catch (error) {
      console.error('Error sending test email:', error);
      return c.json({ success: false, message: 'Failed to send test email: ' + error.message });
    }
  });

  return app;
}

export default createSMTPSettingsRoutes;