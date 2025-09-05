-- Essential security seed data for immediate deployment

-- Ensure security settings exist
INSERT OR REPLACE INTO security_settings (setting_key, setting_value, description, updated_at) VALUES
('password_min_length', '8', 'Minimum password length requirement', datetime('now')),
('password_require_uppercase', 'true', 'Require uppercase letters in passwords', datetime('now')),
('password_require_lowercase', 'true', 'Require lowercase letters in passwords', datetime('now')),
('password_require_numbers', 'true', 'Require numbers in passwords', datetime('now')),
('password_require_symbols', 'false', 'Require special characters in passwords', datetime('now')),
('max_login_attempts', '5', 'Maximum failed login attempts before account lockout', datetime('now')),
('lockout_duration', '900', 'Account lockout duration in seconds (15 minutes)', datetime('now')),
('session_timeout', '86400', 'Session timeout in seconds (24 hours)', datetime('now')),
('api_rate_limit', '100', 'API requests per minute per user', datetime('now')),
('enable_audit_logging', 'true', 'Enable comprehensive audit logging', datetime('now')),
('enable_mfa', 'false', 'Enable multi-factor authentication', datetime('now'));

-- Update existing users to have security fields
UPDATE users SET 
  failed_login_attempts = COALESCE(failed_login_attempts, 0),
  mfa_enabled = COALESCE(mfa_enabled, 0),
  password_changed_at = COALESCE(password_changed_at, datetime('now'))
WHERE id IS NOT NULL;