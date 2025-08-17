// DMT Risk Assessment Platform - Keycloak Authentication Service (Node.js)
// Replaces basic authentication with enterprise-grade Keycloak SSO

import jwt from 'jsonwebtoken';

export class KeycloakAuthService {
  constructor() {
    this.config = {
      baseUrl: process.env.KEYCLOAK_BASE_URL || 'http://localhost:8080',
      realm: process.env.KEYCLOAK_REALM || 'dmt-risk-platform',
      clientId: process.env.KEYCLOAK_CLIENT_ID || 'dmt-webapp',
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'dmt-webapp-secret-key-2024',
      redirectUri: process.env.REDIRECT_URI || 'http://localhost:3000/api/auth/callback'
    };
  }

  // Generate authorization URL for OIDC login
  getAuthorizationUrl(state) {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'openid profile email roles',
      state: state || this.generateState()
    });

    return `${this.config.baseUrl}/realms/${this.config.realm}/protocol/openid-connect/auth?${params.toString()}`;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code) {
    const tokenEndpoint = `${this.config.baseUrl}/realms/${this.config.realm}/protocol/openid-connect/token`;
    
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code: code,
      redirect_uri: this.config.redirectUri
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Token exchange failed: ${response.status} - ${errorText}`);
    }

    return await response.json();
  }

  // Get user information from Keycloak
  async getUserInfo(accessToken) {
    const userInfoEndpoint = `${this.config.baseUrl}/realms/${this.config.realm}/protocol/openid-connect/userinfo`;
    
    const response = await fetch(userInfoEndpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.status}`);
    }

    return await response.json();
  }

  // Verify JWT token
  async verifyToken(token) {
    try {
      // Get Keycloak public keys
      const jwksUri = `${this.config.baseUrl}/realms/${this.config.realm}/protocol/openid-connect/certs`;
      
      // For development, we'll do basic validation
      // In production, implement proper JWT signature verification
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      // Check if token is expired
      if (payload.exp && payload.exp < Date.now() / 1000) {
        throw new Error('Token expired');
      }

      return payload;
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  // Refresh access token
  async refreshToken(refreshToken) {
    const tokenEndpoint = `${this.config.baseUrl}/realms/${this.config.realm}/protocol/openid-connect/token`;
    
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: refreshToken
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.status}`);
    }

    return await response.json();
  }

  // Logout user from Keycloak
  async logout(refreshToken) {
    const logoutEndpoint = `${this.config.baseUrl}/realms/${this.config.realm}/protocol/openid-connect/logout`;
    
    const body = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: refreshToken
    });

    try {
      await fetch(logoutEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
      });
    } catch (error) {
      console.warn('Keycloak logout failed:', error.message);
      // Don't throw error as local logout should still work
    }
  }

  // Generate secure random state
  generateState() {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  // Map Keycloak user to application user format
  mapKeycloakUserToAppUser(keycloakUser) {
    return {
      username: keycloakUser.preferred_username,
      email: keycloakUser.email,
      first_name: keycloakUser.given_name || keycloakUser.preferred_username,
      last_name: keycloakUser.family_name || '',
      department: keycloakUser.department || '',
      job_title: keycloakUser.jobTitle || '',
      phone: keycloakUser.phone || '',
      role: this.mapKeycloakRoleToAppRole(keycloakUser.realm_access?.roles || []),
      is_active: true,
      mfa_enabled: false,
      last_login: new Date().toISOString(),
      auth_provider: 'keycloak'
    };
  }

  // Map Keycloak roles to application roles
  mapKeycloakRoleToAppRole(roles) {
    const rolePriority = ['admin', 'risk_manager', 'compliance_officer', 'auditor', 'risk_owner'];
    
    for (const priority of rolePriority) {
      if (roles.includes(priority)) {
        return priority;
      }
    }
    
    return 'risk_owner'; // Default role
  }
}

// Authentication middleware for Keycloak
export const keycloakAuthMiddleware = async (c, next) => {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'No valid authorization header' }, 401);
  }

  const token = authHeader.substring(7);
  
  try {
    const keycloakAuth = new KeycloakAuthService();
    const payload = await keycloakAuth.verifyToken(token);
    
    // Store user info in context
    c.set('user', {
      id: payload.sub,
      username: payload.preferred_username,
      email: payload.email,
      role: keycloakAuth.mapKeycloakRoleToAppRole(payload.realm_access?.roles || [])
    });
    
    await next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return c.json({ success: false, error: 'Invalid or expired token' }, 401);
  }
};

// Role-based authorization middleware
export const requireRole = (allowedRoles) => {
  return async (c, next) => {
    const user = c.get('user');
    
    if (!user || !allowedRoles.includes(user.role)) {
      return c.json({ 
        success: false, 
        error: 'Insufficient permissions',
        required_roles: allowedRoles,
        user_role: user?.role
      }, 403);
    }
    
    await next();
  };
};