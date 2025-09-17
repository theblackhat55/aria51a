-- Create system_settings table for platform configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'string',
  description TEXT,
  is_encrypted BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- Insert default SMTP settings
INSERT OR IGNORE INTO system_settings (setting_key, setting_value, description) VALUES 
('smtp_host', '', 'SMTP server hostname'),
('smtp_port', '587', 'SMTP server port'),
('smtp_secure', 'true', 'Use SSL/TLS encryption'),
('smtp_username', '', 'SMTP authentication username'),
('smtp_password', '', 'SMTP authentication password'),
('smtp_from_name', 'ARIA5 Platform', 'Display name for outgoing emails'),
('smtp_from_email', 'noreply@aria5.com', 'From email address');

-- Add missing columns to users table for password management
ALTER TABLE users ADD COLUMN password_reset_required BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN deleted_at DATETIME;