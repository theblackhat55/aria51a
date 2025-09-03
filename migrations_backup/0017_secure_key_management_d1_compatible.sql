-- Secure API Key Management Migration (Simplified for D1)
-- Allows users to set/update/delete API keys securely without ever retrieving them

-- User API Keys table - stores encrypted API keys
CREATE TABLE IF NOT EXISTS user_api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('openai', 'anthropic', 'gemini')),
  encrypted_key TEXT NOT NULL,
  key_prefix TEXT,
  is_valid INTEGER DEFAULT 0,
  last_updated TEXT DEFAULT (datetime('now')),
  last_tested TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  deleted_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- API Key Audit Log - tracks all key management operations
CREATE TABLE IF NOT EXISTS api_key_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('set', 'update', 'delete', 'test')),
  success INTEGER DEFAULT 0,
  timestamp TEXT DEFAULT (datetime('now')),
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

-- Create unique constraint for active keys (where deleted_at is NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_provider_active 
ON user_api_keys(user_id, provider) 
WHERE deleted_at IS NULL;