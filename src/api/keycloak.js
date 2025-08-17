// DMT Risk Assessment Platform - Keycloak Authentication API (Node.js)
// Complete replacement for basic authentication

import { Hono } from 'hono';
import { KeycloakAuthService, keycloakAuthMiddleware, requireRole } from '../auth-keycloak.js';

export function createKeycloakAPI() {
  const app = new Hono();
  const keycloak = new KeycloakAuthService();

  // Get Keycloak login URL
  app.get('/auth/keycloak/login', async (c) => {
    try {
      const redirectUri = c.req.query('redirect_uri') || keycloak.config.redirectUri;
      const state = c.req.query('state') || keycloak.generateState();
      
      const authUrl = keycloak.getAuthorizationUrl(state);
      
      return c.json({
        success: true,
        data: {
          authUrl: authUrl,
          redirectUri: redirectUri,
          state: state
        }
      });
    } catch (error) {
      console.error('Failed to generate Keycloak auth URL:', error);
      return c.json({
        success: false,
        error: 'Failed to generate authentication URL'
      }, 500);
    }
  });

  // Handle OAuth callback from Keycloak
  app.get('/auth/callback', async (c) => {
    try {
      const code = c.req.query('code');
      const state = c.req.query('state');
      const error = c.req.query('error');
      
      if (error) {
        console.error('OAuth error:', error);
        return c.html(`
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Authentication Error - DMT Platform</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
          </head>
          <body class="bg-red-50 flex items-center justify-center min-h-screen">
            <div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
              <div class="text-center">
                <div class="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <i class="fas fa-exclamation-triangle text-red-500 text-2xl"></i>
                </div>
                <h2 class="text-xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
                <p class="text-gray-600 mb-4">Error: ${error}</p>
                <div class="space-y-2">
                  <a href="/login" class="block w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center">
                    Try Again
                  </a>
                  <a href="/" class="block w-full bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 text-center">
                    Back to Home
                  </a>
                </div>
              </div>
            </div>
          </body>
          </html>
        `);
      }

      if (!code) {
        return c.json({ success: false, error: 'No authorization code received' }, 400);
      }

      // Exchange code for tokens
      const tokens = await keycloak.exchangeCodeForTokens(code);
      
      // Get user information
      const userInfo = await keycloak.getUserInfo(tokens.access_token);
      
      // Map to application user format
      const appUser = keycloak.mapKeycloakUserToAppUser(userInfo);
      
      // Store or update user in database (if needed)
      await upsertKeycloakUser(c, appUser, userInfo);

      // Return success page with auto-redirect
      return c.html(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Login Successful - DMT Platform</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        </head>
        <body class="bg-green-50 flex items-center justify-center min-h-screen">
          <div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full mx-4">
            <div class="text-center">
              <div class="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <i class="fas fa-check-circle text-green-500 text-2xl"></i>
              </div>
              <h2 class="text-xl font-bold text-gray-900 mb-2">Login Successful!</h2>
              <p class="text-gray-600 mb-2">Welcome, <strong>${appUser.first_name}</strong>!</p>
              <p class="text-sm text-gray-500 mb-6">Role: ${appUser.role}</p>
              
              <div class="space-y-3">
                <div class="bg-blue-50 p-3 rounded-lg">
                  <div class="flex items-center text-blue-700">
                    <i class="fas fa-clock mr-2"></i>
                    <span class="text-sm">Redirecting in <span id="countdown">3</span> seconds...</span>
                  </div>
                </div>
                
                <button onclick="completeLogin()" class="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 font-medium transition-colors duration-200">
                  <i class="fas fa-arrow-right mr-2"></i>
                  Continue to Dashboard
                </button>
              </div>
            </div>
          </div>
          
          <script>
            // Store tokens securely
            localStorage.setItem('dmt_kc_access_token', '${tokens.access_token}');
            localStorage.setItem('dmt_kc_refresh_token', '${tokens.refresh_token}');
            localStorage.setItem('dmt_kc_user', JSON.stringify(${JSON.stringify(appUser)}));
            localStorage.setItem('dmt_kc_token_expires', '${Date.now() + (tokens.expires_in * 1000)}');
            
            // Clear any legacy tokens
            localStorage.removeItem('dmt_token');
            localStorage.removeItem('dmt_expires_at');
            
            function completeLogin() {
              window.location.href = '/';
            }
            
            // Countdown and auto-redirect
            let countdown = 3;
            const countdownElement = document.getElementById('countdown');
            
            const timer = setInterval(() => {
              countdown--;
              countdownElement.textContent = countdown;
              
              if (countdown <= 0) {
                clearInterval(timer);
                completeLogin();
              }
            }, 1000);
          </script>
        </body>
        </html>
      `);
      
    } catch (error) {
      console.error('OAuth callback error:', error);
      return c.json({
        success: false,
        error: 'Authentication failed',
        details: error.message
      }, 500);
    }
  });

  // Refresh token endpoint
  app.post('/auth/refresh', async (c) => {
    try {
      const { refresh_token } = await c.req.json();
      
      if (!refresh_token) {
        return c.json({ success: false, error: 'Refresh token required' }, 400);
      }

      const tokens = await keycloak.refreshToken(refresh_token);
      const userInfo = await keycloak.getUserInfo(tokens.access_token);
      const appUser = keycloak.mapKeycloakUserToAppUser(userInfo);

      return c.json({
        success: true,
        data: {
          user: appUser,
          tokens: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_in: tokens.expires_in,
            token_type: tokens.token_type
          }
        }
      });
    } catch (error) {
      console.error('Token refresh failed:', error);
      return c.json({
        success: false,
        error: 'Failed to refresh token'
      }, 401);
    }
  });

  // Logout endpoint
  app.post('/auth/logout', async (c) => {
    try {
      const { refresh_token } = await c.req.json();
      
      if (refresh_token) {
        await keycloak.logout(refresh_token);
      }
      
      return c.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      console.error('Logout error:', error);
      return c.json({
        success: true,
        message: 'Logged out successfully'
      });
    }
  });

  // Get current user info (replaces /api/auth/me)
  app.get('/auth/user', keycloakAuthMiddleware, async (c) => {
    try {
      const user = c.get('user');
      
      return c.json({
        success: true,
        data: { user: user }
      });
    } catch (error) {
      console.error('Get user info failed:', error);
      return c.json({
        success: false,
        error: 'Failed to get user information'
      }, 401);
    }
  });

  // Admin-only endpoint example
  app.get('/auth/admin/users', keycloakAuthMiddleware, requireRole(['admin']), async (c) => {
    try {
      // This endpoint is only accessible by admin users
      return c.json({
        success: true,
        data: { message: 'Admin access granted' }
      });
    } catch (error) {
      return c.json({
        success: false,
        error: 'Failed to get admin data'
      }, 500);
    }
  });

  return app;
}

// Helper function to upsert Keycloak user in local database
async function upsertKeycloakUser(c, appUser, keycloakUser) {
  try {
    if (!c.env?.DB) return; // Skip if no database context
    
    // Check if user exists
    const existingUser = c.env.DB.prepare(`
      SELECT id FROM users WHERE email = ?
    `).first(appUser.email);

    if (existingUser.success && existingUser.result) {
      // Update existing user
      await c.env.DB.prepare(`
        UPDATE users SET 
          username = ?, first_name = ?, last_name = ?, 
          department = ?, job_title = ?, phone = ?, 
          role = ?, last_login = ?, updated_at = ?, auth_provider = ?
        WHERE email = ?
      `).run(
        appUser.username, appUser.first_name, appUser.last_name,
        appUser.department, appUser.job_title, appUser.phone,
        appUser.role, appUser.last_login, appUser.last_login, 'keycloak',
        appUser.email
      );
    } else {
      // Create new user record for reference
      await c.env.DB.prepare(`
        INSERT INTO users (
          username, email, first_name, last_name, department, 
          job_title, phone, role, is_active, mfa_enabled, 
          last_login, created_at, updated_at, auth_provider
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        appUser.username, appUser.email, appUser.first_name, appUser.last_name,
        appUser.department, appUser.job_title, appUser.phone, appUser.role,
        1, 0, appUser.last_login, appUser.last_login, appUser.last_login, 'keycloak'
      );
    }
  } catch (error) {
    console.error('Failed to upsert user in local database:', error);
    // Don't fail the authentication if local DB update fails
  }
}