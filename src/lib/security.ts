/**
 * ARIA5 Security Library
 * Enterprise-grade security utilities for Cloudflare Workers
 */

// Security constants
const PASSWORD_SALT_ROUNDS = 12;
const JWT_ALGORITHM = 'HS256';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const API_KEY_PREFIX = 'aria5_ak_';

/**
 * Generate a secure random salt
 */
export async function generateSalt(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash password using Web Crypto API (PBKDF2)
 */
export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const passwordSalt = salt || await generateSalt();
  
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const saltData = encoder.encode(passwordSalt);
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    data,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  // Derive key using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltData,
      iterations: 100000, // 100k iterations for security
      hash: 'SHA-256'
    },
    keyMaterial,
    256 // 256 bits
  );
  
  const hashArray = Array.from(new Uint8Array(derivedBits));
  const hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return { hash, salt: passwordSalt };
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  try {
    const { hash: newHash } = await hashPassword(password, salt);
    return hash === newHash;
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Generate secure JWT token for Cloudflare Workers
 */
export async function generateJWT(payload: any, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    ...payload,
    iat: now,
    exp: now + (24 * 60 * 60), // 24 hours
    iss: 'aria5-platform',
    aud: 'aria5-users'
  };
  
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '');
  const payloadB64 = btoa(JSON.stringify(jwtPayload)).replace(/=/g, '');
  
  const data = `${headerB64}.${payloadB64}`;
  
  // Import secret for signing
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Sign the JWT
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '');
  
  return `${data}.${signatureB64}`;
}

/**
 * Verify JWT token
 */
export async function verifyJWT(token: string, secret: string): Promise<any> {
  try {
    const [headerB64, payloadB64, signatureB64] = token.split('.');
    
    if (!headerB64 || !payloadB64 || !signatureB64) {
      throw new Error('Invalid token format');
    }
    
    // Verify signature
    const encoder = new TextEncoder();
    const data = `${headerB64}.${payloadB64}`;
    
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify('HMAC', key, signature, encoder.encode(data));
    
    if (!isValid) {
      throw new Error('Invalid signature');
    }
    
    // Parse payload
    const payload = JSON.parse(atob(payloadB64));
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token expired');
    }
    
    return payload;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
}

/**
 * Generate secure API key
 */
export async function generateApiKey(): Promise<string> {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const randomPart = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${API_KEY_PREFIX}${randomPart}`;
}

/**
 * Hash API key for storage (one-way)
 */
export async function hashApiKey(apiKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify API key against hash
 */
export async function verifyApiKey(apiKey: string, hash: string): Promise<boolean> {
  try {
    const keyHash = await hashApiKey(apiKey);
    return keyHash === hash;
  } catch (error) {
    console.error('API key verification error:', error);
    return false;
  }
}

/**
 * Mask API key for display (show only first/last few characters)
 */
export function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 10) return '****';
  return `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`;
}

/**
 * Input sanitization
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim()
    .slice(0, 1000); // Limit length
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  if (password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Rate limiting store (in-memory for Cloudflare Workers)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate limiting check
 */
export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMinutes: number = 15
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const windowMs = windowMinutes * 60 * 1000;
  
  const existing = rateLimitStore.get(identifier);
  
  if (!existing || now > existing.resetTime) {
    // New window or expired window
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: maxAttempts - 1, resetTime: now + windowMs };
  }
  
  if (existing.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetTime: existing.resetTime };
  }
  
  // Increment count
  existing.count++;
  rateLimitStore.set(identifier, existing);
  
  return { allowed: true, remaining: maxAttempts - existing.count, resetTime: existing.resetTime };
}

/**
 * Generate CSRF token
 */
export async function generateCSRFToken(): Promise<string> {
  const array = new Uint8Array(24);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Security headers for responses
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' https://unpkg.com https://cdn.tailwindcss.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self'; font-src 'self' https://cdn.jsdelivr.net;",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  };
}