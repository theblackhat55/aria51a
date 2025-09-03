// Web Crypto API compatible password hashing for Cloudflare Workers
// Uses PBKDF2 with SHA-256, which is supported by the Web Crypto API

export class PasswordService {
  private static readonly SALT_LENGTH = 16;
  private static readonly ITERATIONS = 100000; // OWASP recommended minimum
  private static readonly HASH_LENGTH = 32;

  /**
   * Hash a password using PBKDF2-SHA256
   * @param password Plain text password
   * @returns Promise<string> Base64 encoded hash with salt and iterations
   */
  static async hashPassword(password: string): Promise<string> {
    // Generate a random salt
    const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
    
    // Convert password to ArrayBuffer
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    
    // Import the password as a key
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );
    
    // Derive the key using PBKDF2
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: this.ITERATIONS,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    
    // Export the derived key as raw bytes
    const keyBuffer = await crypto.subtle.exportKey('raw', derivedKey);
    const hashBytes = new Uint8Array(keyBuffer);
    
    // Combine salt, iterations, and hash
    const result = new Uint8Array(4 + this.SALT_LENGTH + this.HASH_LENGTH);
    
    // Store iterations as 4 bytes (big-endian)
    const iterationsView = new DataView(result.buffer, 0, 4);
    iterationsView.setUint32(0, this.ITERATIONS, false);
    
    // Store salt
    result.set(salt, 4);
    
    // Store hash
    result.set(hashBytes, 4 + this.SALT_LENGTH);
    
    // Return as base64
    return btoa(String.fromCharCode(...result));
  }

  /**
   * Verify a password against a hash
   * @param password Plain text password to verify
   * @param hash Base64 encoded hash from database
   * @returns Promise<boolean> True if password matches
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      // Decode the hash from base64
      const hashBytes = new Uint8Array(
        atob(hash).split('').map(c => c.charCodeAt(0))
      );
      
      // Extract iterations (first 4 bytes)
      const iterationsView = new DataView(hashBytes.buffer, 0, 4);
      const iterations = iterationsView.getUint32(0, false);
      
      // Extract salt (next 16 bytes)
      const salt = hashBytes.slice(4, 4 + this.SALT_LENGTH);
      
      // Extract stored hash (remaining bytes)
      const storedHash = hashBytes.slice(4 + this.SALT_LENGTH);
      
      // Convert password to ArrayBuffer
      const encoder = new TextEncoder();
      const passwordBuffer = encoder.encode(password);
      
      // Import the password as a key
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
      );
      
      // Derive the key using the same parameters
      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: iterations,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      );
      
      // Export the derived key as raw bytes
      const keyBuffer = await crypto.subtle.exportKey('raw', derivedKey);
      const computedHash = new Uint8Array(keyBuffer);
      
      // Compare hashes using constant-time comparison
      return this.constantTimeEqual(storedHash, computedHash);
      
    } catch (error) {
      console.error('Password verification error:', error);
      return false;
    }
  }

  /**
   * Constant-time comparison to prevent timing attacks
   * @param a First byte array
   * @param b Second byte array
   * @returns boolean True if arrays are equal
   */
  private static constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
    if (a.length !== b.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a[i] ^ b[i];
    }
    
    return result === 0;
  }

  /**
   * Generate a secure random token for sessions/API keys
   * @param length Length in bytes (default 32)
   * @returns string Base64 encoded random token
   */
  static generateSecureToken(length: number = 32): string {
    const bytes = crypto.getRandomValues(new Uint8Array(length));
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }

  /**
   * Hash sensitive data (like API keys) for storage
   * @param data Sensitive data to hash
   * @returns Promise<string> SHA-256 hash in hex format
   */
  static async hashSensitiveData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = new Uint8Array(hashBuffer);
    
    return Array.from(hashArray)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Simple encryption for non-critical data (like API keys in database)
   * Note: For production, consider using a proper key management service
   * @param plaintext Data to encrypt
   * @param key Encryption key (should be from environment)
   * @returns Promise<string> Base64 encoded encrypted data with IV
   */
  static async encryptData(plaintext: string, key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Derive key from string key
    const keyBuffer = encoder.encode(key);
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    const derivedKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('aria5-salt'), // In production, use random salt per key
        iterations: 10000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
    
    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Encrypt data
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      derivedKey,
      data
    );
    
    // Combine IV and encrypted data
    const result = new Uint8Array(iv.length + encrypted.byteLength);
    result.set(iv);
    result.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...result));
  }

  /**
   * Decrypt data encrypted with encryptData
   * @param encryptedData Base64 encoded encrypted data
   * @param key Decryption key
   * @returns Promise<string> Decrypted plaintext
   */
  static async decryptData(encryptedData: string, key: string): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      
      // Decode from base64
      const data = new Uint8Array(
        atob(encryptedData).split('').map(c => c.charCodeAt(0))
      );
      
      // Extract IV (first 12 bytes)
      const iv = data.slice(0, 12);
      const encrypted = data.slice(12);
      
      // Derive key
      const keyBuffer = encoder.encode(key);
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        keyBuffer,
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
      );
      
      const derivedKey = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: encoder.encode('aria5-salt'),
          iterations: 10000,
          hash: 'SHA-256'
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      );
      
      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        derivedKey,
        encrypted
      );
      
      return decoder.decode(decrypted);
      
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }
}

// Utility functions for session management
export class SessionService {
  private static readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Create a session token with expiration
   * @param userId User ID
   * @param additionalData Additional data to include in token
   * @returns string Base64 encoded session token
   */
  static createSessionToken(userId: number, additionalData?: any): string {
    const sessionData = {
      userId,
      issued: Date.now(),
      expires: Date.now() + this.SESSION_DURATION,
      ...additionalData
    };
    
    return btoa(JSON.stringify(sessionData));
  }

  /**
   * Validate and decode a session token
   * @param token Base64 encoded session token
   * @returns object|null Session data or null if invalid
   */
  static validateSessionToken(token: string): any | null {
    try {
      const sessionData = JSON.parse(atob(token));
      
      // Check if token is expired
      if (Date.now() > sessionData.expires) {
        return null;
      }
      
      return sessionData;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh a session token if it's close to expiring
   * @param token Current session token
   * @returns string|null New token if refreshed, null if invalid
   */
  static refreshSessionToken(token: string): string | null {
    const sessionData = this.validateSessionToken(token);
    if (!sessionData) {
      return null;
    }
    
    // Refresh if less than 2 hours remaining
    const timeRemaining = sessionData.expires - Date.now();
    if (timeRemaining < 2 * 60 * 60 * 1000) {
      return this.createSessionToken(sessionData.userId, {
        originalIssued: sessionData.issued
      });
    }
    
    return token; // No refresh needed
  }
}