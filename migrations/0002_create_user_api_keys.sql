-- User API Keys Management
CREATE TABLE IF NOT EXISTS user_api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  key_prefix TEXT,
  is_valid INTEGER DEFAULT 0,
  last_updated DATETIME DEFAULT (datetime('now')),
  created_at DATETIME DEFAULT (datetime('now')),
  deleted_at DATETIME NULL
);

-- API Key Audit Log
CREATE TABLE IF NOT EXISTS api_key_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  action TEXT NOT NULL,
  success INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_provider ON user_api_keys(user_id, provider);
CREATE INDEX IF NOT EXISTS idx_api_key_audit_user ON api_key_audit_log(user_id);

-- Add unique constraint separately
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_api_keys_unique ON user_api_keys(user_id, provider) WHERE deleted_at IS NULL;
