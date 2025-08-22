-- Secure API Key Management Migration
-- Allows users to set/update/delete API keys securely without ever retrieving them

-- User API Keys table - stores encrypted API keys
CREATE TABLE IF NOT EXISTS user_api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL, -- 'openai', 'anthropic', 'gemini'
  encrypted_key TEXT NOT NULL, -- Encrypted API key (never stored in plain text)
  key_prefix TEXT, -- First few characters for identification (e.g., 'sk-proj-***')
  is_valid BOOLEAN DEFAULT 0, -- Whether the key passed validation
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_tested DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME, -- Soft delete for audit purposes
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, provider, deleted_at) -- One active key per user per provider
);

-- API Key Audit Log - tracks all key management operations
CREATE TABLE IF NOT EXISTS api_key_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  action TEXT NOT NULL, -- 'set', 'update', 'delete', 'test'
  success BOOLEAN DEFAULT 0,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_provider ON user_api_keys(user_id, provider, deleted_at);
CREATE INDEX IF NOT EXISTS idx_user_api_keys_provider ON user_api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_api_key_audit_user_id ON api_key_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_api_key_audit_timestamp ON api_key_audit_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_key_audit_provider ON api_key_audit_log(provider);

-- Add validation check
CREATE TRIGGER IF NOT EXISTS validate_api_key_provider
BEFORE INSERT ON user_api_keys
BEGIN
  SELECT CASE 
    WHEN NEW.provider NOT IN ('openai', 'anthropic', 'gemini') 
    THEN RAISE(ABORT, 'Invalid provider. Must be openai, anthropic, or gemini')
  END;
END;

CREATE TRIGGER IF NOT EXISTS validate_audit_log_action
BEFORE INSERT ON api_key_audit_log
BEGIN
  SELECT CASE 
    WHEN NEW.action NOT IN ('set', 'update', 'delete', 'test') 
    THEN RAISE(ABORT, 'Invalid action. Must be set, update, delete, or test')
  END;
END;