-- Enhanced Features Migration
-- API credentials, Email integration, Vulnerability data, Enhanced roles, Risk notifications

-- Enhanced user roles
ALTER TABLE users ADD COLUMN enhanced_role TEXT CHECK (enhanced_role IN ('admin', 'risk_analyst', 'service_owner', 'auditor', 'integration_operator', 'readonly')) DEFAULT 'readonly';

-- API credentials management
CREATE TABLE IF NOT EXISTS api_credentials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  client_id TEXT UNIQUE NOT NULL,
  client_secret TEXT NOT NULL, -- Encrypted
  credential_type TEXT NOT NULL CHECK (credential_type IN ('oauth', 'api_key', 'jwt')),
  scopes TEXT, -- JSON array of scopes
  expires_at DATETIME,
  is_active BOOLEAN DEFAULT 1,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- JWT settings
CREATE TABLE IF NOT EXISTS jwt_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  access_token_lifetime INTEGER DEFAULT 3600, -- seconds
  refresh_token_lifetime INTEGER DEFAULT 604800, -- 1 week
  secret_key TEXT NOT NULL,
  algorithm TEXT DEFAULT 'HS256',
  auto_rotate BOOLEAN DEFAULT 0,
  rotation_frequency INTEGER DEFAULT 2592000, -- 30 days
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Email integration settings
CREATE TABLE IF NOT EXISTS email_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL CHECK (provider IN ('smtp', 'sendgrid', 'ses', 'outlook')),
  smtp_host TEXT,
  smtp_port INTEGER,
  smtp_username TEXT,
  smtp_password TEXT, -- Encrypted
  smtp_encryption TEXT CHECK (smtp_encryption IN ('none', 'tls', 'ssl')),
  api_key TEXT, -- For API-based providers
  from_email TEXT NOT NULL,
  from_name TEXT DEFAULT 'Risk Management Platform',
  enabled BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Risk notifications
CREATE TABLE IF NOT EXISTS risk_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('review_due', 'overdue', 'escalation')),
  days_before INTEGER NOT NULL, -- 30, 15, 7 days
  sent_at DATETIME,
  recipient_email TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (risk_id) REFERENCES risks(id)
);

-- Microsoft Defender vulnerabilities
CREATE TABLE IF NOT EXISTS defender_vulnerabilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vulnerability_id TEXT UNIQUE NOT NULL,
  cve_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  cvss_score REAL,
  exploit_available BOOLEAN DEFAULT 0,
  public_exploit BOOLEAN DEFAULT 0,
  published_date DATETIME,
  updated_date DATETIME,
  affected_products TEXT, -- JSON array
  mitigation_steps TEXT,
  workarounds TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_sync DATETIME
);

-- Asset vulnerabilities link
CREATE TABLE IF NOT EXISTS asset_vulnerabilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL,
  vulnerability_id INTEGER NOT NULL,
  detected_date DATETIME,
  remediation_status TEXT CHECK (remediation_status IN ('open', 'in_progress', 'fixed', 'accepted', 'mitigated')) DEFAULT 'open',
  remediation_date DATETIME,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (vulnerability_id) REFERENCES defender_vulnerabilities(id),
  UNIQUE(asset_id, vulnerability_id)
);

-- Enhanced risk categories (configurable)
CREATE TABLE IF NOT EXISTS configurable_risk_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color_code TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Risk owners (configurable)
CREATE TABLE IF NOT EXISTS risk_owners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  department TEXT,
  risk_categories TEXT, -- JSON array of category IDs they can own
  notification_preferences TEXT, -- JSON object
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Add new columns to existing tables
ALTER TABLE assets ADD COLUMN vulnerability_score REAL DEFAULT 0.0;
ALTER TABLE assets ADD COLUMN vulnerability_count INTEGER DEFAULT 0;
ALTER TABLE assets ADD COLUMN critical_vulnerabilities INTEGER DEFAULT 0;

-- Enhanced risk calculation fields
ALTER TABLE risks ADD COLUMN vulnerability_impact REAL DEFAULT 0.0;
ALTER TABLE risks ADD COLUMN notification_enabled BOOLEAN DEFAULT 1;
ALTER TABLE risks ADD COLUMN custom_category_id INTEGER;

-- Add foreign keys for new risk fields
-- Note: SQLite doesn't support adding foreign keys to existing tables directly
-- These would need to be handled in application logic

-- Insert default configurable risk categories
INSERT OR IGNORE INTO configurable_risk_categories (name, description, color_code) VALUES 
('Cybersecurity', 'Information security and cyber threats', '#EF4444'),
('Operational Risk', 'Business operations and processes', '#F59E0B'),
('Compliance Governance', 'Regulatory and compliance matters', '#3B82F6'),
('Data Privacy', 'Data protection and privacy', '#8B5CF6'),
('Business Continuity', 'Service availability and continuity', '#10B981'),
('Third-Party Risk', 'Vendor and partner risks', '#F97316'),
('Financial Risk', 'Financial and market risks', '#06B6D4'),
('Reputation Risk', 'Brand and reputation concerns', '#EC4899');

-- Insert default JWT settings
INSERT OR IGNORE INTO jwt_settings (id, access_token_lifetime, refresh_token_lifetime, secret_key) VALUES 
(1, 3600, 604800, 'default-secret-key-change-in-production');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_risk_notifications_risk_id ON risk_notifications(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_notifications_status ON risk_notifications(status);
CREATE INDEX IF NOT EXISTS idx_defender_vulnerabilities_severity ON defender_vulnerabilities(severity);
CREATE INDEX IF NOT EXISTS idx_asset_vulnerabilities_asset_id ON asset_vulnerabilities(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_vulnerabilities_status ON asset_vulnerabilities(remediation_status);
CREATE INDEX IF NOT EXISTS idx_api_credentials_client_id ON api_credentials(client_id);
CREATE INDEX IF NOT EXISTS idx_users_enhanced_role ON users(enhanced_role);