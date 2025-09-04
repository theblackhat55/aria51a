-- Threat Intelligence Database Schema
-- Support for IOCs, threat campaigns, and threat intelligence feeds

-- Threat Campaigns table
CREATE TABLE IF NOT EXISTS threat_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  threat_actor TEXT,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('apt', 'malware', 'ransomware', 'phishing', 'other')),
  first_seen DATE,
  last_activity DATE,
  target_sectors TEXT, -- JSON array
  geography TEXT,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'monitoring', 'tracked', 'inactive')),
  mitre_techniques TEXT, -- JSON array of MITRE ATT&CK techniques
  attribution_notes TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- IOCs (Indicators of Compromise) table
CREATE TABLE IF NOT EXISTS iocs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  value TEXT NOT NULL,
  ioc_type TEXT NOT NULL CHECK (ioc_type IN ('ip', 'domain', 'url', 'hash', 'email', 'registry_key', 'file_path')),
  threat_level TEXT NOT NULL CHECK (threat_level IN ('critical', 'high', 'medium', 'low', 'info')),
  campaign_id INTEGER,
  source TEXT, -- internal_detection, commercial_feed, osint, partner_sharing, manual_entry
  first_seen DATETIME NOT NULL,
  last_seen DATETIME,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  tags TEXT, -- JSON array
  notes TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES threat_campaigns(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Threat Intelligence Feeds table
CREATE TABLE IF NOT EXISTS threat_feeds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  feed_type TEXT NOT NULL CHECK (feed_type IN ('commercial', 'government', 'open_source')),
  provider TEXT,
  endpoint_url TEXT,
  api_key_encrypted TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'failed', 'paused')),
  last_update DATETIME,
  next_update DATETIME,
  update_frequency INTEGER, -- minutes
  records_count INTEGER DEFAULT 0,
  reliability INTEGER CHECK (reliability >= 0 AND reliability <= 100),
  error_message TEXT,
  configuration TEXT, -- JSON for feed-specific settings
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Threat Hunt Results table
CREATE TABLE IF NOT EXISTS hunt_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_name TEXT NOT NULL,
  hunt_query TEXT NOT NULL,
  query_type TEXT, -- kql, sql, yara
  time_range TEXT,
  data_source TEXT,
  status TEXT DEFAULT 'completed' CHECK (status IN ('running', 'completed', 'failed')),
  execution_time REAL, -- seconds
  events_analyzed INTEGER,
  hosts_scanned INTEGER,
  findings_count INTEGER DEFAULT 0,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Hunt Findings table
CREATE TABLE IF NOT EXISTS hunt_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  hunt_result_id INTEGER NOT NULL,
  finding_type TEXT,
  severity TEXT CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  title TEXT NOT NULL,
  description TEXT,
  details TEXT,
  affected_host TEXT,
  source_ip TEXT,
  destination_ip TEXT,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'resolved', 'false_positive')),
  assigned_to INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hunt_result_id) REFERENCES hunt_results(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Threat Reports table
CREATE TABLE IF NOT EXISTS threat_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  report_type TEXT,
  time_range TEXT,
  included_threats TEXT, -- JSON array
  format TEXT, -- pdf, json, html
  file_path TEXT,
  status TEXT DEFAULT 'generating' CHECK (status IN ('generating', 'completed', 'failed')),
  progress INTEGER DEFAULT 0,
  estimated_time INTEGER, -- seconds
  sections TEXT, -- JSON array
  metadata TEXT, -- JSON
  generated_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (generated_by) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_iocs_value ON iocs(value);
CREATE INDEX IF NOT EXISTS idx_iocs_type ON iocs(ioc_type);
CREATE INDEX IF NOT EXISTS idx_iocs_threat_level ON iocs(threat_level);
CREATE INDEX IF NOT EXISTS idx_iocs_campaign ON iocs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_iocs_first_seen ON iocs(first_seen);
CREATE INDEX IF NOT EXISTS idx_campaigns_severity ON threat_campaigns(severity);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON threat_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON threat_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_feeds_status ON threat_feeds(status);
CREATE INDEX IF NOT EXISTS idx_hunt_results_created ON hunt_results(created_at);
CREATE INDEX IF NOT EXISTS idx_hunt_findings_severity ON hunt_findings(severity);