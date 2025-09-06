-- Threat Intelligence Feeds table
CREATE TABLE IF NOT EXISTS threat_feeds (
  feed_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'taxii', 'stix', 'json', 'xml', 'csv', 'txt'
  url TEXT NOT NULL,
  api_key TEXT, -- Optional API key (will be encrypted)
  format TEXT NOT NULL, -- 'stix2', 'json', 'xml', 'csv', 'ioc'
  description TEXT,
  active INTEGER DEFAULT 1,
  sync_interval INTEGER DEFAULT 24, -- hours
  confidence_threshold INTEGER DEFAULT 50,
  auto_sync INTEGER DEFAULT 1,
  validate_indicators INTEGER DEFAULT 1,
  last_sync DATETIME,
  last_error TEXT,
  ioc_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- IOCs (Indicators of Compromise) table
CREATE TABLE IF NOT EXISTS iocs (
  ioc_id INTEGER PRIMARY KEY AUTOINCREMENT,
  feed_id INTEGER,
  indicator_type TEXT NOT NULL, -- 'ip', 'domain', 'url', 'hash', 'email', etc.
  indicator_value TEXT NOT NULL,
  confidence INTEGER DEFAULT 50,
  threat_type TEXT, -- 'malware', 'phishing', 'botnet', etc.
  first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active INTEGER DEFAULT 1,
  tags TEXT, -- JSON array of tags
  additional_data TEXT, -- JSON for additional metadata
  FOREIGN KEY (feed_id) REFERENCES threat_feeds(feed_id) ON DELETE CASCADE
);

-- Threat Feed Sync Logs
CREATE TABLE IF NOT EXISTS threat_feed_logs (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  feed_id INTEGER,
  sync_started DATETIME DEFAULT CURRENT_TIMESTAMP,
  sync_completed DATETIME,
  status TEXT, -- 'success', 'error', 'partial'
  indicators_fetched INTEGER DEFAULT 0,
  indicators_added INTEGER DEFAULT 0,
  indicators_updated INTEGER DEFAULT 0,
  error_message TEXT,
  FOREIGN KEY (feed_id) REFERENCES threat_feeds(feed_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_threat_feeds_active ON threat_feeds(active);
CREATE INDEX IF NOT EXISTS idx_iocs_type_value ON iocs(indicator_type, indicator_value);
CREATE INDEX IF NOT EXISTS idx_iocs_feed_id ON iocs(feed_id);
CREATE INDEX IF NOT EXISTS idx_iocs_active ON iocs(is_active);
CREATE INDEX IF NOT EXISTS idx_threat_feed_logs_feed_id ON threat_feed_logs(feed_id);
CREATE INDEX IF NOT EXISTS idx_threat_feed_logs_status ON threat_feed_logs(status);