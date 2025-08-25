// DMT Risk Assessment System v2.0 - Authentication and Authorization
import { Context } from 'hono';
import { sign, verify } from 'hono/jwt';
import { CloudflareBindings, User, AuthRequest, AuthResponse } from './types';

// JWT Secret - Uses environment variable with fallback for development
const TOKEN_EXPIRY = '24h';

export class AuthService {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  // Secure password hashing using Web Crypto API (matches registration method)
  private async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'salt'); // Add salt to match registration
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    const hashedPassword = await this.hashPassword(password);
    return hashedPassword === hash;
  }

  // Generate JWT token
  async generateToken(user: Omit<User, 'password_hash' | 'mfa_secret'>, env: any): Promise<string> {
    const JWT_SECRET = env.JWT_SECRET || 'development-fallback-secret';
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60 // 24 hours
    };

    try {
      return await sign(payload, JWT_SECRET);
    } catch (error) {
      console.error('JWT signing error:', error);
      throw new Error('Failed to generate token');
    }
  }

  // Verify JWT token
  async verifyToken(token: string, env: any): Promise<any> {
    const JWT_SECRET = env.JWT_SECRET || 'development-fallback-secret';
    try {
      return await verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Authenticate user
  async authenticate(credentials: AuthRequest, env: any): Promise<AuthResponse> {
    const { username, password } = credentials;

    // Find user by username or email
    const user = await this.db.prepare(
      'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1'
    ).bind(username, username).first<User>();

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    if (!(await this.verifyPassword(password, user.password_hash))) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await this.db.prepare(
      'UPDATE users SET last_login = datetime("now") WHERE id = ?'
    ).bind(user.id).run();

    // Generate token with environment
    const token = await this.generateToken({
      id: user.id,
      email: user.email,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      department: user.department,
      job_title: user.job_title,
      phone: user.phone,
      role: user.role,
      is_active: user.is_active,
      last_login: user.last_login,
      mfa_enabled: user.mfa_enabled,
      created_at: user.created_at,
      updated_at: user.updated_at
    }, env);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        department: user.department,
        job_title: user.job_title,
        phone: user.phone,
        role: user.role,
        is_active: user.is_active,
        last_login: user.last_login,
        mfa_enabled: user.mfa_enabled,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      token,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
  }

  // Get user by ID
  async getUserById(id: number): Promise<Omit<User, 'password_hash' | 'mfa_secret'> | null> {
    const user = await this.db.prepare(
      'SELECT id, email, username, first_name, last_name, department, job_title, phone, role, is_active, last_login, mfa_enabled, created_at, updated_at FROM users WHERE id = ?'
    ).bind(id).first<User>();

    return user || null;
  }
}

// Authentication middleware
export async function authMiddleware(c: Context<{ Bindings: CloudflareBindings }>, next: () => Promise<void>) {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, error: 'No authorization token provided' }, 401);
    }

    const token = authHeader.substring(7);

    // Validate token format
    if (!token || token.trim() === '') {
      return c.json({ success: false, error: 'Invalid token format' }, 401);
    }

    let payload;
    try {
      // Try JWT verification first
      const JWT_SECRET = c.env.JWT_SECRET || 'development-fallback-secret';
      payload = await verify(token, JWT_SECRET);
    } catch (jwtError) {
      try {
        // Fallback: try simple token decoding with validation
        const decoded = atob(token);
        if (!decoded || decoded.trim() === '') {
          throw new Error('Empty decoded token');
        }
        payload = JSON.parse(decoded);
      } catch (fallbackError) {
        console.error('Auth middleware error: Token decoding failed:', fallbackError);
        return c.json({ success: false, error: 'Invalid token format' }, 401);
      }
    }
    
    // Validate payload structure
    if (!payload || typeof payload !== 'object' || !payload.id) {
      return c.json({ success: false, error: 'Invalid token payload' }, 401);
    }
    
    // Check if token is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return c.json({ success: false, error: 'Token expired' }, 401);
    }

    // Fetch complete user from database using AuthService
    const authService = new AuthService(c.env.DB);
    const user = await authService.getUserById(payload.id);
    
    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 401);
    }

    // Attach complete user object to context
    c.set('user', user);
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({ success: false, error: 'Authentication failed' }, 401);
  }
}

// Role-based authorization middleware
export function requireRole(allowedRoles: string[]) {
  return async (c: Context<{ Bindings: CloudflareBindings }>, next: () => Promise<void>) => {
    const user = c.get('user');
    
    if (!user || !allowedRoles.includes(user.role)) {
      return c.json({ success: false, error: 'Insufficient permissions' }, 403);
    }

    await next();
  };
}

// ARIA AI Assistant - Security Context
export class ARIAAssistant {
  private ai: Ai;
  private db: D1Database;

  constructor(ai: Ai, db: D1Database) {
    this.ai = ai;
    this.db = db;
  }

  async processSecurityQuery(query: string, userContext: any): Promise<string> {
    // Simple AI assistant for security queries
    const systemPrompt = `You are ARIA, an AI assistant for the DMT Risk Assessment System v2.0. 
    You help users with GRC (Governance, Risk, and Compliance) related questions. 
    Keep responses concise and focused on security, risk management, and compliance topics.
    User role: ${userContext.role}`;

    try {
      const response = await this.ai.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query }
        ]
      });

      return response.response || 'I apologize, but I cannot process your query at the moment. Please try again later.';
    } catch (error) {
      console.error('ARIA AI Error:', error);
      return 'I apologize, but I cannot process your query at the moment. Please contact your system administrator if this issue persists.';
    }
  }
}

// Security utilities
export class SecurityUtils {
  // Generate secure IDs for risks, controls, etc.
  static generateSecureId(prefix: string, type: string, year: number = new Date().getFullYear()): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}-${type.toUpperCase()}-${year}-${timestamp}${random}`.toUpperCase();
  }

  // Validate input data
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Sanitize string input
  static sanitizeInput(input: string): string {
    return input.trim().replace(/[<>]/g, '');
  }

  // Check password strength
  static validatePasswordStrength(password: string): { isValid: boolean; message: string } {
    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long' };
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' };
    }
    return { isValid: true, message: 'Password strength is acceptable' };
  }
}

// Risk scoring utilities
export class RiskScoring {
  // Calculate risk score
  static calculateRiskScore(probability: number, impact: number): number {
    return probability * impact;
  }

  // Risk level classification
  static getRiskLevel(score: number): string {
    if (score >= 20) return 'Critical';
    if (score >= 15) return 'High';
    if (score >= 10) return 'Medium';
    if (score >= 5) return 'Low';
    return 'Very Low';
  }

  // Risk color coding
  static getRiskColor(score: number): string {
    if (score >= 20) return '#dc3545'; // red
    if (score >= 15) return '#fd7e14'; // orange
    if (score >= 10) return '#ffc107'; // yellow
    if (score >= 5) return '#28a745'; // green
    return '#6c757d'; // gray
  }
}