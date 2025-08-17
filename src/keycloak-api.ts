// DMT Risk Assessment System - Keycloak Authentication API
import { Hono } from 'hono';
import { CloudflareBindings } from './types';
import { KeycloakAuthService, KEYCLOAK_CONFIG } from './keycloak-auth';

export function createKeycloakAPI() {
  const app = new Hono<{ Bindings: CloudflareBindings }>();
  
  // Initialize Keycloak auth service
  const keycloak = new KeycloakAuthService();

  // Get Keycloak login URL
  app.get('/auth/keycloak/login', async (c) => {
    try {
      const redirectUri = c.req.query('redirect_uri') || KEYCLOAK_CONFIG.redirectUri;
      const state = c.req.query('state') || undefined;
      
      const authUrl = keycloak.getAuthorizationUrl(redirectUri, state);
      
      return c.json({
        success: true,
        data: {
          authUrl: authUrl,
          redirectUri: redirectUri
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
          <html>
          <head>
            <title>Authentication Error</title>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-red-50 flex items-center justify-center min-h-screen">
            <div class="bg-white p-8 rounded-lg shadow-md max-w-md">
              <div class="text-center">
                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                <h2 class="text-xl font-bold text-gray-900 mb-2">Authentication Failed</h2>
                <p class="text-gray-600 mb-4">Error: ${error}</p>
                <a href="/login" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Try Again
                </a>
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
      const redirectUri = KEYCLOAK_CONFIG.redirectUri;
      const tokens = await keycloak.exchangeCodeForTokens(code, redirectUri);
      
      // Get user information
      const userInfo = await keycloak.getUserInfo(tokens.access_token);
      
      // Map to application user format
      const appUser = keycloak.mapKeycloakUserToAppUser(userInfo);
      
      // Store or update user in database (optional - depending on your needs)
      await upsertKeycloakUser(c.env.DB, appUser, userInfo);

      // Return success page with tokens (in production, use secure cookies)
      return c.html(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Login Successful</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-green-50 flex items-center justify-center min-h-screen">
          <div class="bg-white p-8 rounded-lg shadow-md max-w-md">
            <div class="text-center">
              <i class="fas fa-check-circle text-green-500 text-4xl mb-4"></i>
              <h2 class="text-xl font-bold text-gray-900 mb-2">Login Successful</h2>
              <p class="text-gray-600 mb-4">Welcome, ${appUser.first_name}!</p>
              <button onclick="completeLogin()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Continue to Dashboard
              </button>
            </div>
          </div>
          <script>
            // Store tokens in localStorage (in production, use secure httpOnly cookies)
            localStorage.setItem('dmt_access_token', '${tokens.access_token}');
            localStorage.setItem('dmt_refresh_token', '${tokens.refresh_token}');
            localStorage.setItem('dmt_user', JSON.stringify(${JSON.stringify(appUser)}));
            localStorage.setItem('dmt_token_expires', '${Date.now() + (tokens.expires_in * 1000)}');
            
            function completeLogin() {
              window.location.href = '/';
            }
            
            // Auto-redirect after 3 seconds
            setTimeout(completeLogin, 3000);
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
      // Even if Keycloak logout fails, we should still return success
      // as the client-side tokens will be cleared
      return c.json({
        success: true,
        message: 'Logged out successfully'
      });
    }
  });

  // Get current user info (for authenticated requests)
  app.get('/auth/user', async (c) => {
    try {
      const authHeader = c.req.header('Authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ success: false, error: 'No authorization header' }, 401);
      }

      const token = authHeader.substring(7);
      const userInfo = await keycloak.getUserInfo(token);
      const appUser = keycloak.mapKeycloakUserToAppUser(userInfo);
      
      return c.json({
        success: true,
        data: { user: appUser }
      });
    } catch (error) {
      console.error('Get user info failed:', error);
      return c.json({
        success: false,
        error: 'Failed to get user information'
      }, 401);
    }
  });

  // SAML SSO initiation endpoint (if SAML is configured in Keycloak)
  app.get('/auth/saml/login', async (c) => {
    try {
      const samlUrl = `${KEYCLOAK_CONFIG.baseUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/saml/clients/${KEYCLOAK_CONFIG.clientId}`;
      
      return c.json({
        success: true,
        data: {
          samlUrl: samlUrl,
          message: 'SAML authentication available through Keycloak'
        }
      });
    } catch (error) {
      return c.json({
        success: false,
        error: 'SAML authentication not configured'
      }, 500);
    }
  });

  return app;
}

// Helper function to upsert Keycloak user in local database (for reference)
async function upsertKeycloakUser(db: any, appUser: any, keycloakUser: any) {
    try {
      // Check if user exists
      const existingUser = await db.prepare(`
        SELECT id FROM users WHERE email = ?
      `).bind(appUser.email).first();

      if (existingUser) {
        // Update existing user
        await db.prepare(`
          UPDATE users SET 
            username = ?, first_name = ?, last_name = ?, 
            department = ?, job_title = ?, phone = ?, 
            role = ?, last_login = ?, updated_at = ?
          WHERE email = ?
        `).bind(
          appUser.username, appUser.first_name, appUser.last_name,
          appUser.department, appUser.job_title, appUser.phone,
          appUser.role, appUser.last_login, appUser.updated_at,
          appUser.email
        ).run();
      } else {
        // Create new user record for reference
        await db.prepare(`
          INSERT INTO users (
            username, email, first_name, last_name, department, 
            job_title, phone, role, is_active, mfa_enabled, 
            last_login, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          appUser.username, appUser.email, appUser.first_name, appUser.last_name,
          appUser.department, appUser.job_title, appUser.phone, appUser.role,
          1, 0, appUser.last_login, appUser.created_at, appUser.updated_at
        ).run();
      }
    } catch (error) {
      console.error('Failed to upsert user in local database:', error);
      // Don't fail the authentication if local DB update fails
    }
}