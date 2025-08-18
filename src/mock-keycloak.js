// DMT Risk Assessment Platform - Mock Keycloak Service for Native Deployment
// Provides Keycloak-compatible API without requiring external Keycloak server

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export class MockKeycloakService {
  constructor() {
    this.config = {
      baseUrl: process.env.KEYCLOAK_BASE_URL || 'http://localhost:3000/mock-keycloak',
      realm: process.env.KEYCLOAK_REALM || 'dmt-risk-platform',
      clientId: process.env.KEYCLOAK_CLIENT_ID || 'dmt-webapp',
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'dmt-webapp-secret-key-2024',
      redirectUri: process.env.REDIRECT_URI || 'http://localhost:3000/api/auth/callback'
    };
    
    // JWT secret for signing tokens
    this.jwtSecret = process.env.JWT_SECRET || 'native-jwt-secret-key-change-in-production-32-chars';
    
    // Mock user database
    this.users = [
      {
        id: '1',
        username: 'admin',
        email: 'admin@dmt.local',
        firstName: 'System',
        lastName: 'Administrator',
        roles: ['admin', 'risk_manager'],
        password: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', // password123
        active: true
      },
      {
        id: '2', 
        username: 'avi_security',
        email: 'avi@security.dmt',
        firstName: 'Avi',
        lastName: 'Security',
        roles: ['risk_manager'],
        password: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', // password123
        active: true
      },
      {
        id: '3',
        username: 'sjohnson',
        email: 'sarah.johnson@dmt.local',
        firstName: 'Sarah',
        lastName: 'Johnson',
        roles: ['compliance_officer'],
        password: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', // password123
        active: true
      }
    ];
    
    // Store active sessions
    this.sessions = new Map();
  }

  // Generate authorization URL (mock)
  getAuthorizationUrl(state) {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'openid profile email roles',
      state: state || this.generateState()
    });

    return `${this.config.baseUrl}/auth?${params.toString()}`;
  }

  // Handle mock authentication
  async handleAuth(username, password, state) {
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    const user = this.users.find(u => u.username === username && u.password === hashedPassword && u.active);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Generate authorization code
    const authCode = this.generateAuthCode();
    
    // Store session
    this.sessions.set(authCode, {
      user,
      state,
      createdAt: Date.now(),
      expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });
    
    return authCode;
  }

  // Exchange authorization code for tokens (mock)
  async exchangeCodeForTokens(code) {
    const session = this.sessions.get(code);
    
    if (!session || session.expiresAt < Date.now()) {
      this.sessions.delete(code);
      throw new Error('Invalid or expired authorization code');
    }
    
    const user = session.user;
    
    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    
    // Clean up the authorization code
    this.sessions.delete(code);
    
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 3600, // 1 hour
      refresh_expires_in: 86400, // 24 hours
      scope: 'openid profile email roles'
    };
  }

  // Get user information (mock)
  async getUserInfo(accessToken) {
    try {
      const payload = jwt.verify(accessToken, this.jwtSecret);
      const user = this.users.find(u => u.id === payload.sub);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return {
        sub: user.id,
        preferred_username: user.username,
        email: user.email,
        given_name: user.firstName,
        family_name: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        roles: user.roles,
        realm_access: {
          roles: user.roles
        }
      };
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  // Verify JWT token (mock)
  async verifyToken(token) {
    try {
      const payload = jwt.verify(token, this.jwtSecret);
      return payload;
    } catch (error) {
      throw new Error(`Token verification failed: ${error.message}`);
    }
  }

  // Generate access token
  generateAccessToken(user) {
    const payload = {
      sub: user.id,
      preferred_username: user.username,
      email: user.email,
      given_name: user.firstName,
      family_name: user.lastName,
      roles: user.roles,
      realm_access: {
        roles: user.roles
      },
      iss: `${this.config.baseUrl}/realms/${this.config.realm}`,
      aud: this.config.clientId,
      typ: 'Bearer',
      azp: this.config.clientId,
      scope: 'openid profile email roles'
    };
    
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: '1h',
      algorithm: 'HS256'
    });
  }

  // Generate refresh token
  generateRefreshToken(user) {
    const payload = {
      sub: user.id,
      typ: 'Refresh',
      azp: this.config.clientId
    };
    
    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: '24h',
      algorithm: 'HS256'
    });
  }

  // Generate random state
  generateState() {
    return crypto.randomBytes(16).toString('hex');
  }

  // Generate authorization code
  generateAuthCode() {
    return crypto.randomBytes(16).toString('hex');
  }
}

// Export singleton instance
export const mockKeycloak = new MockKeycloakService();

// Mock Keycloak auth middleware
export const mockKeycloakAuthMiddleware = () => {
  return async (c, next) => {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'No valid authorization header' }, 401);
    }
    
    const token = authHeader.substring(7);
    
    try {
      const payload = await mockKeycloak.verifyToken(token);
      c.set('user', payload);
      await next();
    } catch (error) {
      return c.json({ error: 'Invalid token' }, 401);
    }
  };
};

// Role-based access control
export const requireRole = (requiredRoles) => {
  return async (c, next) => {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }
    
    const userRoles = user.roles || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }
    
    await next();
  };
};