-- ARIA5 Security Enhancements Migration
-- Adds secure password hashing, API key management, and audit logging

-- Add password security columns to users table
ALTER TABLE users ADD COLUMN password_salt TEXT;
ALTER TABLE users ADD COLUMN password_changed_at DATETIME;
ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until DATETIME DEFAULT NULL;
ALTER TABLE users ADD COLUMN mfa_enabled INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN mfa_secret TEXT DEFAULT NULL;

-- Update existing users with default values
UPDATE users SET failed_login_attempts = 0 WHERE failed_login_attempts IS NULL;
UPDATE users SET mfa_enabled = 0 WHERE mfa_enabled IS NULL;

-- Create API keys table for secure key management
CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    provider TEXT NOT NULL,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    masked_key TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    last_used DATETIME NULL,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create audit log table for security tracking
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    old_values TEXT,
    new_values TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Create sessions table for secure session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    session_data TEXT,
    csrf_token TEXT,
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    is_active INTEGER DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create security settings table
CREATE TABLE IF NOT EXISTS security_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_by INTEGER,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identifier TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    attempts INTEGER DEFAULT 0,
    window_start DATETIME DEFAULT CURRENT_TIMESTAMP,
    blocked_until DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(identifier, endpoint)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_keys_user_provider ON api_keys(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_id, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier, endpoint);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Insert default security settings
INSERT OR IGNORE INTO security_settings (setting_key, setting_value, description) VALUES
('password_min_length', '8', 'Minimum password length requirement'),
('password_require_uppercase', 'true', 'Require uppercase letters in passwords'),
('password_require_lowercase', 'true', 'Require lowercase letters in passwords'),
('password_require_numbers', 'true', 'Require numbers in passwords'),
('password_require_symbols', 'true', 'Require special characters in passwords'),
('max_login_attempts', '5', 'Maximum failed login attempts before account lockout'),
('lockout_duration', '900', 'Account lockout duration in seconds (15 minutes)'),
('session_timeout', '86400', 'Session timeout in seconds (24 hours)'),
('jwt_secret_rotation', '2592000', 'JWT secret rotation interval in seconds (30 days)'),
('api_rate_limit', '100', 'API requests per minute per user'),
('enable_audit_logging', 'true', 'Enable comprehensive audit logging'),
('enable_mfa', 'false', 'Enable multi-factor authentication'),
('password_history_count', '5', 'Number of previous passwords to remember'),
('force_password_change', 'false', 'Force password change on first login');