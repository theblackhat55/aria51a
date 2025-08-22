-- AI Security Enhancements Migration
-- Adds secure AI usage logging and user provider preferences

-- Add provider_configs column to users table for storing user AI preferences (no API keys)
ALTER TABLE users 
ADD COLUMN provider_configs TEXT DEFAULT '{}';

-- Create AI usage logging table for monitoring and billing protection
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL,
  model TEXT,
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_timestamp ON ai_usage_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider ON ai_usage_logs(provider);

-- Add some comments for documentation
PRAGMA table_info(ai_usage_logs);