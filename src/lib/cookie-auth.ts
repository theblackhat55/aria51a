// ARIA5.1 - Secure Cookie-Based Authentication System
import { Context } from 'hono';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

// User session data structure
export interface UserSession {
  id: number;
  username: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  organizationId: number;
  loginTime: number;
  lastActivity: number;
}

// Encryption utilities using Web Crypto API (Cloudflare Workers compatible)
class SecureCrypto {
  private static textEncoder = new TextEncoder();
  private static textDecoder = new TextDecoder();

  // Generate encryption key from secret
  static async getKey(secret: string): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      this.textEncoder.encode(secret),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: this.textEncoder.encode('aria5-salt-2024'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  // Encrypt data
  static async encrypt(data: string, secret: string): Promise<string> {
    try {
      const key = await this.getKey(secret);
      const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
      const encodedData = this.textEncoder.encode(data);

      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encodedData
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedData), iv.length);

      // Return base64 encoded
      return btoa(String.fromCharCode.apply(null, Array.from(combined)));
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt session data');
    }
  }

  // Decrypt data
  static async decrypt(encryptedData: string, secret: string): Promise<string> {
    try {
      const key = await this.getKey(secret);
      
      // Decode from base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      );

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        encrypted
      );

      return this.textDecoder.decode(decryptedData);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt session data');
    }
  }
}

// Cookie-based session management
export class CookieAuth {
  private static readonly SESSION_COOKIE_NAME = 'aria_session';
  private static readonly CSRF_COOKIE_NAME = 'aria_csrf';
  private static readonly SESSION_TIMEOUT = 86400; // 24 hours
  private static readonly ACTIVITY_TIMEOUT = 3600; // 1 hour of inactivity

  // Get encryption secret from environment
  private static getEncryptionSecret(env: any): string {
    return env?.ENCRYPTION_KEY || env?.COOKIE_SECRET || 'default-encryption-key-change-in-production-32-chars';
  }

  // Generate secure random CSRF token
  private static generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Create encrypted session cookie
  static async createSession(c: Context, userData: Omit<UserSession, 'loginTime' | 'lastActivity'>): Promise<void> {
    try {
      const secret = this.getEncryptionSecret(c.env);
      const now = Date.now();
      
      const sessionData: UserSession = {
        ...userData,
        loginTime: now,
        lastActivity: now
      };

      // Encrypt session data
      const encryptedSession = await SecureCrypto.encrypt(JSON.stringify(sessionData), secret);
      
      // Generate CSRF token
      const csrfToken = this.generateCSRFToken();

      // Determine if we're in production
      const isProduction = c.req.url.includes('.pages.dev') || c.req.url.includes('https://');

      // Set encrypted session cookie
      setCookie(c, this.SESSION_COOKIE_NAME, encryptedSession, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'Lax', // Better browser compatibility
        maxAge: this.SESSION_TIMEOUT,
        path: '/'
      });

      // Set CSRF token cookie (accessible to JavaScript)
      setCookie(c, this.CSRF_COOKIE_NAME, csrfToken, {
        httpOnly: false,
        secure: isProduction,
        sameSite: 'Lax',
        maxAge: this.SESSION_TIMEOUT,
        path: '/'
      });

      // Store user data in localStorage (via response script)
      const userDataForFrontend = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        firstName: userData.firstName,
        lastName: userData.lastName,
        organizationId: userData.organizationId
      };

      // Set user data for frontend (will be used in login response)
      c.set('userDataForFrontend', userDataForFrontend);
      c.set('csrfToken', csrfToken);

      console.log(`Session created for user: ${userData.username} (ID: ${userData.id})`);
    } catch (error) {
      console.error('Failed to create session:', error);
      throw new Error('Session creation failed');
    }
  }

  // Validate and get session data
  static async getSession(c: Context): Promise<UserSession | null> {
    try {
      const secret = this.getEncryptionSecret(c.env);
      const encryptedSession = getCookie(c, this.SESSION_COOKIE_NAME);

      if (!encryptedSession) {
        return null;
      }

      // Decrypt session data
      const sessionJson = await SecureCrypto.decrypt(encryptedSession, secret);
      const sessionData: UserSession = JSON.parse(sessionJson);

      const now = Date.now();
      
      // Check session timeout
      if (now - sessionData.loginTime > this.SESSION_TIMEOUT * 1000) {
        console.log('Session expired (timeout)');
        await this.destroySession(c);
        return null;
      }

      // Check activity timeout
      if (now - sessionData.lastActivity > this.ACTIVITY_TIMEOUT * 1000) {
        console.log('Session expired (inactivity)');
        await this.destroySession(c);
        return null;
      }

      // Update last activity time
      sessionData.lastActivity = now;
      await this.updateSessionActivity(c, sessionData, secret);

      return sessionData;
    } catch (error) {
      console.error('Failed to get session:', error);
      await this.destroySession(c);
      return null;
    }
  }

  // Update session activity timestamp
  private static async updateSessionActivity(c: Context, sessionData: UserSession, secret: string): Promise<void> {
    try {
      const encryptedSession = await SecureCrypto.encrypt(JSON.stringify(sessionData), secret);
      const isProduction = c.req.url.includes('.pages.dev') || c.req.url.includes('https://');

      setCookie(c, this.SESSION_COOKIE_NAME, encryptedSession, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'Lax',
        maxAge: this.SESSION_TIMEOUT,
        path: '/'
      });
    } catch (error) {
      console.error('Failed to update session activity:', error);
    }
  }

  // Destroy session
  static async destroySession(c: Context): Promise<void> {
    deleteCookie(c, this.SESSION_COOKIE_NAME, { path: '/' });
    deleteCookie(c, this.CSRF_COOKIE_NAME, { path: '/' });
    console.log('Session destroyed');
  }

  // Validate CSRF token
  static validateCSRF(c: Context, submittedToken?: string): boolean {
    const cookieToken = getCookie(c, this.CSRF_COOKIE_NAME);
    
    if (!cookieToken || !submittedToken) {
      return false;
    }

    return cookieToken === submittedToken;
  }

  // Get CSRF token for forms
  static getCSRFToken(c: Context): string | undefined {
    return getCookie(c, this.CSRF_COOKIE_NAME);
  }
}

// Authentication middleware using cookie-based sessions
export async function cookieAuthMiddleware(c: Context, next: any) {
  const session = await CookieAuth.getSession(c);
  
  // Check if this is an HTMX request
  const isHTMXRequest = c.req.header('hx-request') === 'true';
  
  if (!session) {
    if (isHTMXRequest) {
      // Return auth modal for HTMX requests
      return c.html(`
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-50">
          <div class="fixed inset-0 z-50 overflow-y-auto">
            <div class="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div class="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md">
                <div class="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                  <div class="sm:flex sm:items-start">
                    <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                      <i class="fas fa-exclamation-triangle text-red-600"></i>
                    </div>
                    <div class="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                      <h3 class="text-lg font-semibold leading-6 text-gray-900">Session Expired</h3>
                      <div class="mt-2">
                        <p class="text-sm text-gray-500">Please log in again to continue.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                  <button onclick="window.location.href='/login'" 
                          class="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 sm:ml-3 sm:w-auto">
                    Go to Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `);
    }
    return c.redirect('/login');
  }

  // Store session data in context for use in routes
  c.set('user', session);
  c.set('userId', session.id);
  c.set('userRole', session.role);
  
  await next();
}

// Role-based access control
export function requireRole(role: string) {
  return async (c: Context, next: any) => {
    const user = c.get('user') as UserSession;
    
    if (!user || user.role !== role) {
      return c.json({ error: 'Insufficient permissions' }, 403);
    }
    
    await next();
  };
}

export function requireAdmin() {
  return requireRole('admin');
}