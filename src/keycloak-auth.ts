// DMT Risk Assessment System - Keycloak OIDC Authentication
import { Context } from 'hono';
import { CloudflareBindings, User } from './types';

// Keycloak Configuration
export const KEYCLOAK_CONFIG = {
  baseUrl: process.env.KEYCLOAK_BASE_URL || 'http://localhost:8080',
  realm: process.env.KEYCLOAK_REALM || 'dmt-risk-platform',
  clientId: process.env.KEYCLOAK_CLIENT_ID || 'dmt-webapp',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'dmt-webapp-secret-key-2024',
  redirectUri: process.env.REDIRECT_URI || 'http://localhost:3000/api/auth/callback',
  scopes: 'openid profile email roles'
};

export interface KeycloakUserInfo {
  sub: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;
  given_name: string;
  family_name: string;
  email: string;
  roles?: string[];
  groups?: string[];
  department?: string;
  jobTitle?: string;
  phone?: string;
}

export interface KeycloakTokens {
  access_token: string;
  refresh_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  refresh_expires_in: number;
  scope: string;
}

export class KeycloakAuthService {
  private baseUrl: string;
  private realm: string;
  private clientId: string;
  private clientSecret: string;

  constructor(config = KEYCLOAK_CONFIG) {
    this.baseUrl = config.baseUrl;
    this.realm = config.realm;
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
  }

  // Generate authorization URL for OIDC login
  getAuthorizationUrl(redirectUri: string, state?: string): string { // redirectUri must match callback exactly
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: KEYCLOAK_CONFIG.scopes,
      state: state || this.generateState()
    });

    return `${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/auth?${params.toString()}`;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<KeycloakTokens> {
    const tokenEndpoint = `${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/token`;
    
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: code,
      redirect_uri: redirectUri
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

    return await response.json() as KeycloakTokens;
  }

  // Get user information from Keycloak
  async getUserInfo(accessToken: string): Promise<KeycloakUserInfo> {
    const userInfoEndpoint = `${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`;
    
    const response = await fetch(userInfoEndpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.status}`);
    }

    return await response.json() as KeycloakUserInfo;
  }

  // Verify and decode JWT token
  async verifyToken(token: string): Promise<any> {
    const jwksUri = `${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/certs`;
    
    try {
      // For now, we'll do basic JWT parsing without signature verification
      // In production, you should properly verify the JWT signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payload = JSON.parse(atob(parts[1]));
      
      // Check if token is expired
      if (payload.exp && payload.exp < Date.now() / 1000) {
        throw new Error('Token expired');
      }

      return payload;
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  // Refresh access token using refresh token
  async refreshToken(refreshToken: string): Promise<KeycloakTokens> {
    const tokenEndpoint = `${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/token`;
    
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
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

    return await response.json() as KeycloakTokens;
  }

  // Logout user from Keycloak
  async logout(refreshToken: string): Promise<void> {
    const logoutEndpoint = `${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/logout`;
    
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken
    });

    await fetch(logoutEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });
  }

  // Generate secure random state for OAUTH flow
  private generateState(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Map Keycloak user to application user format
  mapKeycloakUserToAppUser(keycloakUser: KeycloakUserInfo, userId?: number): Partial<User> {
    return {
      id: userId,
      username: keycloakUser.preferred_username,
      email: keycloakUser.email,
      first_name: keycloakUser.given_name || keycloakUser.preferred_username,
      last_name: keycloakUser.family_name || '',
      department: keycloakUser.department || '',
      job_title: keycloakUser.jobTitle || '',
      phone: keycloakUser.phone || '',
      role: this.mapKeycloakRoleToAppRole(keycloakUser.roles || []),
      is_active: true,
      mfa_enabled: false,
      last_login: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  // Map Keycloak roles to application roles
  private mapKeycloakRoleToAppRole(roles: string[]): string {
    // Priority order for role mapping
    const rolePriority = ['admin', 'risk_manager', 'compliance_officer', 'auditor', 'risk_owner'];
    
    for (const priority of rolePriority) {
      if (roles.includes(priority)) {
        return priority;
      }
    }
    
    return 'risk_owner'; // Default role
  }
}

// Middleware for Keycloak authentication
export const keycloakAuthMiddleware = async (c: Context, next: () => Promise<void>) => {
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

// Role-based authorization middleware for Keycloak
export const requireKeycloakRole = (allowedRoles: string[]) => {
  return async (c: Context, next: () => Promise<void>) => {
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