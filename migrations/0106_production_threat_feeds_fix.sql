-- Production Threat Feeds Schema Fix
-- Updates the existing threat_feeds table to match expected API schema

-- Drop the old threat_feeds table if it exists
DROP TABLE IF EXISTS threat_feeds_old;

-- Rename current table to backup
ALTER TABLE threat_feeds RENAME TO threat_feeds_old;

-- Create new threat_feeds table with correct schema
CREATE TABLE threat_feeds (
  feed_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  api_key TEXT,
  format TEXT NOT NULL,
  description TEXT,
  active INTEGER DEFAULT 1,
  sync_interval INTEGER DEFAULT 24,
  confidence_threshold INTEGER DEFAULT 50,
  auto_sync INTEGER DEFAULT 1,
  validate_indicators INTEGER DEFAULT 1,
  last_sync DATETIME,
  last_error TEXT,
  ioc_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Migrate any existing data from old table to new table (if any exists)
INSERT INTO threat_feeds (name, type, url, api_key, format, description, active, created_at, updated_at)
SELECT 
  name,
  COALESCE(feed_type, 'STIX') as type,
  COALESCE(endpoint_url, '') as url,
  COALESCE(api_key_encrypted, '') as api_key,
  'JSON' as format,
  'Migrated from old schema' as description,
  CASE WHEN status = 'active' THEN 1 ELSE 0 END as active,
  created_at,
  updated_at
FROM threat_feeds_old
WHERE name IS NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_threat_feeds_type ON threat_feeds(type);
CREATE INDEX IF NOT EXISTS idx_threat_feeds_active ON threat_feeds(active);
CREATE INDEX IF NOT EXISTS idx_threat_feeds_created_at ON threat_feeds(created_at);

-- Drop the old table
DROP TABLE threat_feeds_old;