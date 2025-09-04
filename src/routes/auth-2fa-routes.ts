import { Hono } from 'hono';
import { html } from 'hono/html';
import { requireAuth } from './auth-routes';
import { cleanLayout } from '../templates/layout-clean';
import { createTwoFactorService } from '../services/2fa-service';
import type { CloudflareBindings } from '../types';

export function createTwoFactorRoutes() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Apply authentication middleware to all routes
  app.use('*', requireAuth);
  
  // Main 2FA management page
  app.get('/', async (c) => {
    const user = c.get('user');
    const { env } = c;
    
    try {
      if (!env.DB) {
        return c.html(
          cleanLayout({
            title: 'Two-Factor Authentication',
            user,
            content: renderDatabaseError()
          })
        );
      }

      const twoFactorService = createTwoFactorService(env.DB);
      const status = await twoFactorService.getTwoFactorStatus(user.id);

      return c.html(
        cleanLayout({
          title: 'Two-Factor Authentication',
          user,
          content: renderTwoFactorPage(user, status)
        })
      );
    } catch (error) {
      console.error('2FA page error:', error);
      return c.html(
        cleanLayout({
          title: 'Two-Factor Authentication',
          user,
          content: renderErrorPage(error.message)
        })
      );
    }
  });

  // Setup 2FA
  app.post('/setup', async (c) => {
    const { env } = c;
    const user = c.get('user');
    
    try {
      if (!env.DB) {
        return c.html(renderDatabaseError());
      }

      const twoFactorService = createTwoFactorService(env.DB);
      const accountName = `${user.username || user.email || user.id}@aria5.com`;
      
      const setup = await twoFactorService.setupTwoFactor(user.id, accountName);
      
      return c.html(renderSetupResult(setup));
    } catch (error) {
      console.error('2FA setup error:', error);
      return c.html(html`
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center">
            <i class="fas fa-times-circle text-red-500 mr-2"></i>
            <span class="text-red-700 font-medium">Setup failed: ${error.message}</span>
          </div>
        </div>
      `);
    }
  });

  // Enable 2FA
  app.post('/enable', async (c) => {
    const { env } = c;
    const user = c.get('user');
    const formData = await c.req.parseBody();
    
    try {
      if (!env.DB) {
        return c.html(renderDatabaseError());
      }

      const token = formData.token as string;
      if (!token || token.length !== 6) {
        return c.html(html`
          <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-times-circle text-red-500 mr-2"></i>
              <span class="text-red-700 font-medium">Please enter a valid 6-digit code</span>
            </div>
          </div>
        `);
      }

      const twoFactorService = createTwoFactorService(env.DB);
      const success = await twoFactorService.enableTwoFactor(user.id, token);

      if (success) {
        return c.html(html`
          <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-check-circle text-green-500 mr-2"></i>
              <span class="text-green-700 font-medium">Two-Factor Authentication enabled successfully!</span>
            </div>
            <p class="text-green-600 text-sm mt-1">
              Your account is now protected with 2FA. Save your backup codes in a secure location.
            </p>
          </div>
          <script>
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          </script>
        `);
      } else {
        return c.html(html`
          <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-times-circle text-red-500 mr-2"></i>
              <span class="text-red-700 font-medium">Invalid verification code</span>
            </div>
            <p class="text-red-600 text-sm mt-1">
              Please check your authenticator app and try again.
            </p>
          </div>
        `);
      }
    } catch (error) {
      console.error('2FA enable error:', error);
      return c.html(html`
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center">
            <i class="fas fa-times-circle text-red-500 mr-2"></i>
            <span class="text-red-700 font-medium">Enable failed: ${error.message}</span>
          </div>
        </div>
      `);
    }
  });

  // Disable 2FA
  app.post('/disable', async (c) => {
    const { env } = c;
    const user = c.get('user');
    const formData = await c.req.parseBody();
    
    try {
      if (!env.DB) {
        return c.html(renderDatabaseError());
      }

      const token = formData.token as string;
      if (!token) {
        return c.html(html`
          <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-times-circle text-red-500 mr-2"></i>
              <span class="text-red-700 font-medium">Please enter your current 2FA code</span>
            </div>
          </div>
        `);
      }

      const twoFactorService = createTwoFactorService(env.DB);
      const success = await twoFactorService.disableTwoFactor(user.id, token);

      if (success) {
        return c.html(html`
          <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-exclamation-triangle text-yellow-500 mr-2"></i>
              <span class="text-yellow-800 font-medium">Two-Factor Authentication disabled</span>
            </div>
            <p class="text-yellow-700 text-sm mt-1">
              Your account is no longer protected with 2FA. You can re-enable it at any time.
            </p>
          </div>
          <script>
            setTimeout(() => {
              window.location.reload();
            }, 2000);
          </script>
        `);
      } else {
        return c.html(html`
          <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-times-circle text-red-500 mr-2"></i>
              <span class="text-red-700 font-medium">Invalid verification code</span>
            </div>
          </div>
        `);
      }
    } catch (error) {
      console.error('2FA disable error:', error);
      return c.html(html`
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center">
            <i class="fas fa-times-circle text-red-500 mr-2"></i>
            <span class="text-red-700 font-medium">Disable failed: ${error.message}</span>
          </div>
        </div>
      `);
    }
  });

  // Regenerate backup codes
  app.post('/regenerate-codes', async (c) => {
    const { env } = c;
    const user = c.get('user');
    const formData = await c.req.parseBody();
    
    try {
      if (!env.DB) {
        return c.html(renderDatabaseError());
      }

      const token = formData.token as string;
      if (!token) {
        return c.html(html`
          <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-times-circle text-red-500 mr-2"></i>
              <span class="text-red-700 font-medium">Please enter your current 2FA code</span>
            </div>
          </div>
        `);
      }

      const twoFactorService = createTwoFactorService(env.DB);
      
      // Verify token first
      const verification = await twoFactorService.verifyToken(user.id, token);
      if (!verification.isValid) {
        return c.html(html`
          <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-times-circle text-red-500 mr-2"></i>
              <span class="text-red-700 font-medium">Invalid verification code</span>
            </div>
          </div>
        `);
      }

      const newCodes = await twoFactorService.regenerateBackupCodes(user.id);

      return c.html(html`
        <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div class="flex items-center mb-3">
            <i class="fas fa-check-circle text-green-500 mr-2"></i>
            <span class="text-green-700 font-medium">New backup codes generated</span>
          </div>
          <div class="bg-white rounded p-3 border border-green-200">
            <p class="text-sm text-green-800 mb-2">Save these codes in a secure location:</p>
            <div class="grid grid-cols-2 gap-2 font-mono text-sm">
              ${newCodes.map(code => html`
                <div class="bg-gray-100 px-2 py-1 rounded text-center">${code}</div>
              `)}
            </div>
            <p class="text-xs text-green-700 mt-2">
              Each code can only be used once. Your previous codes are no longer valid.
            </p>
          </div>
        </div>
      `);
    } catch (error) {
      console.error('Backup code regeneration error:', error);
      return c.html(html`
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center">
            <i class="fas fa-times-circle text-red-500 mr-2"></i>
            <span class="text-red-700 font-medium">Failed to regenerate codes: ${error.message}</span>
          </div>
        </div>
      `);
    }
  });

  // Test 2FA functionality
  app.post('/test', async (c) => {
    const { env } = c;
    
    try {
      if (!env.DB) {
        return c.html(renderDatabaseError());
      }

      const twoFactorService = createTwoFactorService(env.DB);
      const testResult = await twoFactorService.test2FA();

      if (testResult.success) {
        return c.html(html`
          <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-check-circle text-green-500 mr-2"></i>
              <span class="text-green-700 font-medium">${testResult.message}</span>
            </div>
            ${testResult.token ? html`
              <p class="text-green-600 text-sm mt-1">Test token: ${testResult.token}</p>
            ` : ''}
          </div>
        `);
      } else {
        return c.html(html`
          <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div class="flex items-center">
              <i class="fas fa-times-circle text-red-500 mr-2"></i>
              <span class="text-red-700 font-medium">${testResult.message}</span>
            </div>
          </div>
        `);
      }
    } catch (error) {
      console.error('2FA test error:', error);
      return c.html(html`
        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div class="flex items-center">
            <i class="fas fa-times-circle text-red-500 mr-2"></i>
            <span class="text-red-700 font-medium">Test failed: ${error.message}</span>
          </div>
        </div>
      `);
    }
  });

  return app;
}

// Render functions
const renderTwoFactorPage = (user: any, status: any) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">
          <i class="fas fa-shield-alt mr-3 text-blue-600"></i>
          Two-Factor Authentication
        </h1>
        <p class="text-lg text-gray-600">
          Add an extra layer of security to your account with 2FA
        </p>
      </div>

      <!-- Status Card -->
      <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-gray-900">Current Status</h2>
          <div class="flex items-center">
            <i class="fas fa-${status.isEnabled ? 'check-circle text-green-500' : 'times-circle text-red-500'} mr-2"></i>
            <span class="font-medium ${status.isEnabled ? 'text-green-700' : 'text-red-700'}">
              ${status.isEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold ${status.isSetup ? 'text-green-600' : 'text-gray-400'}">${status.isSetup ? 'Yes' : 'No'}</div>
            <div class="text-sm text-gray-600">Setup Complete</div>
          </div>
          
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold ${status.isEnabled ? 'text-green-600' : 'text-gray-400'}">${status.isEnabled ? 'Active' : 'Inactive'}</div>
            <div class="text-sm text-gray-600">Protection Status</div>
          </div>
          
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-2xl font-bold ${status.backupCodesRemaining > 0 ? 'text-blue-600' : 'text-orange-600'}">${status.backupCodesRemaining}</div>
            <div class="text-sm text-gray-600">Backup Codes</div>
          </div>
        </div>

        ${status.lastUsed ? html`
          <div class="mt-4 pt-4 border-t border-gray-200">
            <p class="text-sm text-gray-600">
              Last used: ${new Date(status.lastUsed).toLocaleDateString()}
            </p>
          </div>
        ` : ''}
      </div>

      ${!status.isSetup ? html`
        <!-- Setup Section -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Setup Two-Factor Authentication</h2>
          <div class="space-y-4">
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 class="font-semibold text-blue-900 mb-2">What you'll need:</h3>
              <ul class="text-sm text-blue-800 space-y-1">
                <li>• An authenticator app (Google Authenticator, Authy, 1Password, etc.)</li>
                <li>• A secure place to store backup codes</li>
                <li>• Access to your mobile device</li>
              </ul>
            </div>
            
            <button hx-post="/auth/2fa/setup"
                    hx-target="#setup-result"
                    hx-swap="innerHTML"
                    class="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200">
              <i class="fas fa-qrcode mr-2"></i>Start Setup Process
            </button>
            
            <div id="setup-result"></div>
          </div>
        </div>
      ` : !status.isEnabled ? html`
        <!-- Enable Section -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Enable Two-Factor Authentication</h2>
          <div class="space-y-4">
            <p class="text-gray-600">
              You have completed the setup process. Enter a code from your authenticator app to enable 2FA.
            </p>
            
            <form hx-post="/auth/2fa/enable" hx-target="#enable-result" hx-swap="innerHTML">
              <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Verification Code
                </label>
                <input type="text" 
                       name="token"
                       placeholder="000000"
                       maxlength="6"
                       class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                       required>
                <p class="text-xs text-gray-500 mt-1">Enter the 6-digit code from your authenticator app</p>
              </div>
              
              <button type="submit" 
                      class="w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-200">
                <i class="fas fa-check mr-2"></i>Enable Two-Factor Authentication
              </button>
            </form>
            
            <div id="enable-result"></div>
          </div>
        </div>
      ` : html`
        <!-- Manage Section -->
        <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 class="text-xl font-bold text-gray-900 mb-4">Manage Two-Factor Authentication</h2>
          
          <div class="space-y-6">
            <!-- Regenerate Backup Codes -->
            <div>
              <h3 class="text-lg font-semibold text-gray-800 mb-3">Backup Codes</h3>
              <p class="text-gray-600 mb-4">
                Generate new backup codes if you've lost yours or used several codes.
              </p>
              
              <form hx-post="/auth/2fa/regenerate-codes" hx-target="#regenerate-result" hx-swap="innerHTML">
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input type="text" 
                         name="token"
                         placeholder="000000"
                         maxlength="6"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         required>
                </div>
                
                <button type="submit" 
                        class="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition duration-200">
                  <i class="fas fa-sync mr-2"></i>Generate New Codes
                </button>
              </form>
              
              <div id="regenerate-result" class="mt-4"></div>
            </div>

            <!-- Disable 2FA -->
            <div class="border-t border-gray-200 pt-6">
              <h3 class="text-lg font-semibold text-gray-800 mb-3">Disable Two-Factor Authentication</h3>
              <p class="text-gray-600 mb-4">
                This will remove the extra security layer from your account. Only do this if you're sure.
              </p>
              
              <form hx-post="/auth/2fa/disable" hx-target="#disable-result" hx-swap="innerHTML">
                <div class="mb-4">
                  <label class="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input type="text" 
                         name="token"
                         placeholder="000000"
                         maxlength="6"
                         class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                         required>
                </div>
                
                <button type="submit" 
                        hx-confirm="Are you sure you want to disable two-factor authentication? This will reduce your account security."
                        class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-200">
                  <i class="fas fa-times mr-2"></i>Disable 2FA
                </button>
              </form>
              
              <div id="disable-result" class="mt-4"></div>
            </div>
          </div>
        </div>
      `}

      <!-- Test Section -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-4">Test Functionality</h2>
        <p class="text-gray-600 mb-4">
          Test the 2FA system to ensure it's working correctly.
        </p>
        
        <button hx-post="/auth/2fa/test"
                hx-target="#test-result"
                hx-swap="innerHTML"
                class="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition duration-200">
          <i class="fas fa-vial mr-2"></i>Test 2FA System
        </button>
        
        <div id="test-result" class="mt-4"></div>
      </div>
    </div>
  </div>
`;

const renderSetupResult = (setup: any) => html`
  <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
    <div class="flex items-center mb-4">
      <i class="fas fa-check-circle text-green-500 mr-2"></i>
      <span class="text-green-700 font-medium">2FA Setup Complete</span>
    </div>
    
    <div class="space-y-4">
      <!-- QR Code Section -->
      <div class="bg-white rounded p-4 border border-green-200">
        <h3 class="font-semibold text-green-900 mb-2">Step 1: Scan QR Code</h3>
        <p class="text-sm text-green-800 mb-3">
          Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
        </p>
        <div class="flex items-center justify-center p-4 bg-gray-50 rounded">
          <div class="text-gray-500 text-sm">
            <i class="fas fa-qrcode text-6xl mb-2"></i>
            <p>QR Code would be displayed here</p>
            <p class="text-xs">(Demo mode - QR code generation not implemented)</p>
          </div>
        </div>
      </div>

      <!-- Manual Entry -->
      <div class="bg-white rounded p-4 border border-green-200">
        <h3 class="font-semibold text-green-900 mb-2">Manual Entry</h3>
        <p class="text-sm text-green-800 mb-2">
          If you can't scan the QR code, manually enter this secret:
        </p>
        <div class="bg-gray-100 px-3 py-2 rounded font-mono text-sm break-all">
          ${setup.secret}
        </div>
      </div>

      <!-- Backup Codes -->
      <div class="bg-white rounded p-4 border border-green-200">
        <h3 class="font-semibold text-green-900 mb-2">Step 2: Save Backup Codes</h3>
        <p class="text-sm text-green-800 mb-3">
          Save these backup codes in a secure location. Each code can only be used once:
        </p>
        <div class="grid grid-cols-2 gap-2 mb-3">
          ${setup.backupCodes.map(code => html`
            <div class="bg-gray-100 px-2 py-1 rounded text-center font-mono text-sm">${code}</div>
          `)}
        </div>
        <p class="text-xs text-green-700">
          Store these codes safely - you can use them to access your account if you lose your device.
        </p>
      </div>

      <!-- Next Steps -->
      <div class="bg-blue-50 border border-blue-200 rounded p-4">
        <h3 class="font-semibold text-blue-900 mb-2">Next Steps:</h3>
        <ol class="text-sm text-blue-800 list-decimal list-inside space-y-1">
          <li>Open your authenticator app and add the account</li>
          <li>Save the backup codes in a secure location</li>
          <li>Enter a verification code below to enable 2FA</li>
        </ol>
      </div>
    </div>
  </div>
`;

const renderDatabaseError = () => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="bg-white rounded-xl shadow-lg p-8 text-center">
        <i class="fas fa-database text-6xl text-red-500 mb-4"></i>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Database Not Available</h2>
        <p class="text-gray-600">
          The database is not configured. 2FA functionality requires database access.
        </p>
      </div>
    </div>
  </div>
`;

const renderErrorPage = (error: string) => html`
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="bg-white rounded-xl shadow-lg p-8 text-center">
        <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
        <h2 class="text-2xl font-bold text-gray-900 mb-2">Error</h2>
        <p class="text-gray-600">${error}</p>
      </div>
    </div>
  </div>
`;

export default createTwoFactorRoutes;