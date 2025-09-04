/**
 * Two-Factor Authentication (2FA) Service
 * Implements TOTP (Time-based One-Time Password) authentication
 * Compatible with Google Authenticator, Authy, and other TOTP apps
 */

export interface TwoFactorSetup {
  userId: string;
  secret: string;
  qrCode: string;
  backupCodes: string[];
  isEnabled: boolean;
  createdAt: string;
}

export interface TwoFactorVerification {
  userId: string;
  token: string;
  timestamp: number;
  isValid: boolean;
  attemptsRemaining?: number;
}

export interface BackupCodeUsage {
  userId: string;
  code: string;
  usedAt: string;
  ipAddress?: string;
}

/**
 * TOTP (Time-based One-Time Password) implementation
 * Compatible with RFC 6238 standard
 */
export class TOTPService {
  private static readonly DIGITS = 6;
  private static readonly PERIOD = 30; // 30 seconds
  private static readonly ALGORITHM = 'SHA-1';
  private static readonly ISSUER = 'ARIA5.1 Platform';

  /**
   * Generate a random secret for TOTP
   */
  static generateSecret(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32 alphabet
    let secret = '';
    
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return secret;
  }

  /**
   * Generate TOTP URI for QR code
   */
  static generateURI(secret: string, accountName: string, issuer: string = this.ISSUER): string {
    const params = new URLSearchParams({
      secret,
      issuer,
      algorithm: this.ALGORITHM,
      digits: this.DIGITS.toString(),
      period: this.PERIOD.toString()
    });

    return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?${params}`;
  }

  /**
   * Generate QR code data URL for TOTP URI
   * Note: In Cloudflare Workers, we'll generate a placeholder
   * In production, you'd use a QR code library
   */
  static generateQRCode(uri: string): string {
    // This is a placeholder. In production, use a library like 'qrcode'
    // For Cloudflare Workers compatibility, we'll return a data URL
    const base64Placeholder = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    return `data:image/png;base64,${base64Placeholder}`;
  }

  /**
   * Generate TOTP code for given secret and time
   */
  static async generateTOTP(secret: string, timeStep?: number): Promise<string> {
    try {
      const time = timeStep || Math.floor(Date.now() / 1000 / this.PERIOD);
      
      // Convert base32 secret to bytes
      const key = this.base32ToBytes(secret);
      
      // Create time bytes (8 bytes, big-endian)
      const timeBytes = new ArrayBuffer(8);
      const timeView = new DataView(timeBytes);
      timeView.setUint32(4, time, false); // Big-endian
      
      // Import key for HMAC
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
      );
      
      // Generate HMAC
      const hmac = await crypto.subtle.sign('HMAC', cryptoKey, timeBytes);
      const hmacArray = new Uint8Array(hmac);
      
      // Dynamic truncation (RFC 4226)
      const offset = hmacArray[hmacArray.length - 1] & 0x0f;
      const code = (
        ((hmacArray[offset] & 0x7f) << 24) |
        ((hmacArray[offset + 1] & 0xff) << 16) |
        ((hmacArray[offset + 2] & 0xff) << 8) |
        (hmacArray[offset + 3] & 0xff)
      ) % (10 ** this.DIGITS);
      
      return code.toString().padStart(this.DIGITS, '0');
    } catch (error) {
      console.error('TOTP generation error:', error);
      throw new Error('Failed to generate TOTP code');
    }
  }

  /**
   * Verify TOTP code
   */
  static async verifyTOTP(secret: string, token: string, windowSize: number = 1): Promise<boolean> {
    try {
      if (!token || token.length !== this.DIGITS) {
        return false;
      }

      const currentTime = Math.floor(Date.now() / 1000 / this.PERIOD);
      
      // Check current time and adjacent windows
      for (let i = -windowSize; i <= windowSize; i++) {
        const timeStep = currentTime + i;
        const expectedToken = await this.generateTOTP(secret, timeStep);
        
        if (token === expectedToken) {
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('TOTP verification error:', error);
      return false;
    }
  }

  /**
   * Convert base32 string to bytes
   */
  private static base32ToBytes(base32: string): Uint8Array {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    
    // Convert base32 to binary string
    for (const char of base32.toUpperCase()) {
      const index = alphabet.indexOf(char);
      if (index === -1) continue;
      bits += index.toString(2).padStart(5, '0');
    }
    
    // Convert binary string to bytes
    const bytes = [];
    for (let i = 0; i < bits.length; i += 8) {
      const byte = bits.substring(i, i + 8);
      if (byte.length === 8) {
        bytes.push(parseInt(byte, 2));
      }
    }
    
    return new Uint8Array(bytes);
  }
}

/**
 * Two-Factor Authentication Service
 */
export class TwoFactorAuthService {
  private db: D1Database;
  private maxAttempts: number = 3;
  private lockoutDuration: number = 300; // 5 minutes

  constructor(db: D1Database) {
    this.db = db;
  }

  /**
   * Initialize 2FA tables
   */
  async initializeTables(): Promise<void> {
    try {
      // User 2FA settings table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS user_2fa (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT UNIQUE NOT NULL,
          secret TEXT NOT NULL,
          backup_codes TEXT, -- JSON array of backup codes
          is_enabled BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          enabled_at DATETIME,
          last_used DATETIME
        );
      `);

      // 2FA verification attempts table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS user_2fa_attempts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          token TEXT NOT NULL,
          success BOOLEAN NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Backup code usage table
      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS user_backup_codes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id TEXT NOT NULL,
          code_hash TEXT NOT NULL,
          used_at DATETIME,
          ip_address TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create indexes
      await this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_user_2fa_user_id ON user_2fa(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_2fa_attempts_user_id ON user_2fa_attempts(user_id);
        CREATE INDEX IF NOT EXISTS idx_user_2fa_attempts_created_at ON user_2fa_attempts(created_at);
        CREATE INDEX IF NOT EXISTS idx_backup_codes_user_id ON user_backup_codes(user_id);
      `);

      console.log('2FA tables initialized successfully');
    } catch (error) {
      console.error('Error initializing 2FA tables:', error);
      throw error;
    }
  }

  /**
   * Setup 2FA for a user
   */
  async setupTwoFactor(userId: string, accountName: string): Promise<TwoFactorSetup> {
    try {
      // Generate secret and backup codes
      const secret = TOTPService.generateSecret();
      const backupCodes = this.generateBackupCodes();
      
      // Generate QR code URI
      const uri = TOTPService.generateURI(secret, accountName);
      const qrCode = TOTPService.generateQRCode(uri);
      
      // Store in database (disabled by default)
      await this.db.prepare(`
        INSERT OR REPLACE INTO user_2fa (user_id, secret, backup_codes, is_enabled)
        VALUES (?, ?, ?, 0)
      `).bind(userId, secret, JSON.stringify(backupCodes)).run();

      // Store backup codes
      await this.storeBackupCodes(userId, backupCodes);

      return {
        userId,
        secret,
        qrCode,
        backupCodes,
        isEnabled: false,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('2FA setup error:', error);
      throw new Error('Failed to setup 2FA');
    }
  }

  /**
   * Enable 2FA after verification
   */
  async enableTwoFactor(userId: string, token: string): Promise<boolean> {
    try {
      // Get user's secret
      const user2fa = await this.db.prepare(`
        SELECT secret FROM user_2fa WHERE user_id = ?
      `).bind(userId).first();

      if (!user2fa) {
        throw new Error('2FA not setup for user');
      }

      // Verify token
      const isValid = await TOTPService.verifyTOTP(user2fa.secret, token);
      
      if (!isValid) {
        await this.recordAttempt(userId, token, false);
        return false;
      }

      // Enable 2FA
      await this.db.prepare(`
        UPDATE user_2fa 
        SET is_enabled = 1, enabled_at = CURRENT_TIMESTAMP, last_used = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `).bind(userId).run();

      await this.recordAttempt(userId, token, true);

      console.log(`2FA enabled for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('2FA enable error:', error);
      throw error;
    }
  }

  /**
   * Disable 2FA
   */
  async disableTwoFactor(userId: string, token: string): Promise<boolean> {
    try {
      // Verify token first
      const isValid = await this.verifyToken(userId, token);
      
      if (!isValid.isValid) {
        return false;
      }

      // Disable 2FA
      await this.db.prepare(`
        UPDATE user_2fa SET is_enabled = 0 WHERE user_id = ?
      `).bind(userId).run();

      console.log(`2FA disabled for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('2FA disable error:', error);
      throw error;
    }
  }

  /**
   * Verify 2FA token
   */
  async verifyToken(userId: string, token: string, ipAddress?: string): Promise<TwoFactorVerification> {
    try {
      // Check if user is locked out
      const lockout = await this.checkLockout(userId);
      if (lockout.isLockedOut) {
        return {
          userId,
          token,
          timestamp: Date.now(),
          isValid: false,
          attemptsRemaining: 0
        };
      }

      // Get user's 2FA settings
      const user2fa = await this.db.prepare(`
        SELECT secret, is_enabled FROM user_2fa WHERE user_id = ?
      `).bind(userId).first();

      if (!user2fa || !user2fa.is_enabled) {
        return {
          userId,
          token,
          timestamp: Date.now(),
          isValid: false
        };
      }

      // Verify TOTP token
      const isValid = await TOTPService.verifyTOTP(user2fa.secret, token);
      
      // Record attempt
      await this.recordAttempt(userId, token, isValid, ipAddress);

      if (isValid) {
        // Update last used timestamp
        await this.db.prepare(`
          UPDATE user_2fa SET last_used = CURRENT_TIMESTAMP WHERE user_id = ?
        `).bind(userId).run();
      }

      return {
        userId,
        token,
        timestamp: Date.now(),
        isValid,
        attemptsRemaining: isValid ? undefined : Math.max(0, this.maxAttempts - lockout.attempts - 1)
      };
    } catch (error) {
      console.error('2FA verification error:', error);
      throw error;
    }
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(userId: string, code: string, ipAddress?: string): Promise<boolean> {
    try {
      // Hash the provided code
      const codeHash = await this.hashBackupCode(code);
      
      // Check if code exists and hasn't been used
      const backupCode = await this.db.prepare(`
        SELECT id FROM user_backup_codes 
        WHERE user_id = ? AND code_hash = ? AND used_at IS NULL
      `).bind(userId, codeHash).first();

      if (!backupCode) {
        await this.recordAttempt(userId, code, false, ipAddress);
        return false;
      }

      // Mark code as used
      await this.db.prepare(`
        UPDATE user_backup_codes 
        SET used_at = CURRENT_TIMESTAMP, ip_address = ?
        WHERE id = ?
      `).bind(ipAddress || null, backupCode.id).run();

      await this.recordAttempt(userId, code, true, ipAddress);

      console.log(`Backup code used for user: ${userId}`);
      return true;
    } catch (error) {
      console.error('Backup code verification error:', error);
      return false;
    }
  }

  /**
   * Get user's 2FA status
   */
  async getTwoFactorStatus(userId: string): Promise<{
    isSetup: boolean;
    isEnabled: boolean;
    backupCodesRemaining: number;
    lastUsed?: string;
  }> {
    try {
      const user2fa = await this.db.prepare(`
        SELECT is_enabled, last_used FROM user_2fa WHERE user_id = ?
      `).bind(userId).first();

      const backupCodesResult = await this.db.prepare(`
        SELECT COUNT(*) as count FROM user_backup_codes 
        WHERE user_id = ? AND used_at IS NULL
      `).bind(userId).first();

      return {
        isSetup: !!user2fa,
        isEnabled: user2fa ? !!user2fa.is_enabled : false,
        backupCodesRemaining: backupCodesResult?.count || 0,
        lastUsed: user2fa?.last_used || undefined
      };
    } catch (error) {
      console.error('2FA status error:', error);
      throw error;
    }
  }

  /**
   * Generate new backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    try {
      // Mark existing codes as used
      await this.db.prepare(`
        UPDATE user_backup_codes 
        SET used_at = CURRENT_TIMESTAMP 
        WHERE user_id = ? AND used_at IS NULL
      `).bind(userId).run();

      // Generate new codes
      const newCodes = this.generateBackupCodes();
      
      // Store new codes
      await this.storeBackupCodes(userId, newCodes);

      console.log(`Generated new backup codes for user: ${userId}`);
      return newCodes;
    } catch (error) {
      console.error('Backup code regeneration error:', error);
      throw error;
    }
  }

  /**
   * Generate backup codes
   */
  private generateBackupCodes(count: number = 10): string[] {
    const codes = [];
    
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = Array.from({ length: 8 }, () => 
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 36)]
      ).join('');
      
      codes.push(code);
    }
    
    return codes;
  }

  /**
   * Store backup codes in database
   */
  private async storeBackupCodes(userId: string, codes: string[]): Promise<void> {
    for (const code of codes) {
      const codeHash = await this.hashBackupCode(code);
      await this.db.prepare(`
        INSERT INTO user_backup_codes (user_id, code_hash)
        VALUES (?, ?)
      `).bind(userId, codeHash).run();
    }
  }

  /**
   * Hash backup code for secure storage
   */
  private async hashBackupCode(code: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(code);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Record verification attempt
   */
  private async recordAttempt(userId: string, token: string, success: boolean, ipAddress?: string): Promise<void> {
    try {
      await this.db.prepare(`
        INSERT INTO user_2fa_attempts (user_id, token, success, ip_address)
        VALUES (?, ?, ?, ?)
      `).bind(userId, token.substring(0, 3) + '***', success, ipAddress || null).run();
    } catch (error) {
      console.error('Error recording 2FA attempt:', error);
    }
  }

  /**
   * Check if user is locked out
   */
  private async checkLockout(userId: string): Promise<{ isLockedOut: boolean; attempts: number; lockoutEnd?: Date }> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - this.lockoutDuration * 1000).toISOString();
      
      const attempts = await this.db.prepare(`
        SELECT COUNT(*) as count FROM user_2fa_attempts 
        WHERE user_id = ? AND success = 0 AND created_at > ?
      `).bind(userId, fiveMinutesAgo).first();

      const attemptCount = attempts?.count || 0;
      const isLockedOut = attemptCount >= this.maxAttempts;

      return {
        isLockedOut,
        attempts: attemptCount,
        lockoutEnd: isLockedOut ? new Date(Date.now() + this.lockoutDuration * 1000) : undefined
      };
    } catch (error) {
      console.error('Lockout check error:', error);
      return { isLockedOut: false, attempts: 0 };
    }
  }

  /**
   * Test 2FA functionality
   */
  async test2FA(): Promise<{ success: boolean; message: string; token?: string }> {
    try {
      // Initialize tables
      await this.initializeTables();

      // Test TOTP generation and verification
      const secret = TOTPService.generateSecret();
      const token = await TOTPService.generateTOTP(secret);
      const isValid = await TOTPService.verifyTOTP(secret, token);

      if (isValid) {
        return {
          success: true,
          message: '2FA functionality working correctly',
          token
        };
      } else {
        return {
          success: false,
          message: 'TOTP verification failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `2FA test failed: ${error.message}`
      };
    }
  }
}

/**
 * Factory function to create 2FA service
 */
export function createTwoFactorService(db: D1Database): TwoFactorAuthService {
  return new TwoFactorAuthService(db);
}

/**
 * Default export
 */
export default TwoFactorAuthService;