-- Migration: 0117_threat_intelligence_schema.sql
-- Description: Comprehensive Threat Intelligence infrastructure for ARIA5.1
-- Author: ARIA5 Security Team
-- Date: 2025-10-24
-- Phase: 1 - Foundation

-- =============================================================================
-- THREAT INTELLIGENCE CORE TABLES
-- =============================================================================

-- 1. Threat Indicators (IOCs - Indicators of Compromise)
CREATE TABLE IF NOT EXISTS threat_indicators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ioc_type TEXT NOT NULL CHECK(ioc_type IN ('ip', 'domain', 'hash', 'url', 'email', 'file_path', 'registry_key', 'mutex', 'certificate', 'as_number')),
  ioc_value TEXT NOT NULL,
  threat_type TEXT NOT NULL CHECK(threat_type IN ('malware', 'phishing', 'c2', 'exploit', 'ransomware', 'apt', 'botnet', 'backdoor', 'trojan', 'unknown')),
  severity TEXT NOT NULL CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  confidence_score REAL DEFAULT 0.5 CHECK(confidence_score >= 0 AND confidence_score <= 1),
  first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired', 'false_positive', 'investigating', 'archived')),
  source TEXT, -- Feed name or manual entry
  source_reliability TEXT CHECK(source_reliability IN ('A', 'B', 'C', 'D', 'F', 'unknown')),
  tags TEXT, -- JSON array
  context TEXT, -- Additional context/notes
  campaign_id INTEGER,
  actor_id INTEGER,
  kill_chain_phase TEXT, -- MITRE ATT&CK phase
  ttps TEXT, -- JSON array of MITRE ATT&CK techniques
  false_positive_count INTEGER DEFAULT 0,
  validation_status TEXT DEFAULT 'pending' CHECK(validation_status IN ('pending', 'validated', 'rejected')),
  validated_by TEXT,
  validated_at DATETIME,
  expires_at DATETIME,
  organization_id INTEGER DEFAULT 1,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES threat_campaigns(id) ON DELETE SET NULL,
  FOREIGN KEY (actor_id) REFERENCES threat_actors(id) ON DELETE SET NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ti_type ON threat_indicators(ioc_type);
CREATE INDEX IF NOT EXISTS idx_ti_value ON threat_indicators(ioc_value);
CREATE INDEX IF NOT EXISTS idx_ti_status ON threat_indicators(status);
CREATE INDEX IF NOT EXISTS idx_ti_severity ON threat_indicators(severity);
CREATE INDEX IF NOT EXISTS idx_ti_confidence ON threat_indicators(confidence_score);
CREATE INDEX IF NOT EXISTS idx_ti_campaign ON threat_indicators(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ti_actor ON threat_indicators(actor_id);
CREATE INDEX IF NOT EXISTS idx_ti_org ON threat_indicators(organization_id);
CREATE INDEX IF NOT EXISTS idx_ti_created ON threat_indicators(created_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_ti_unique_value_org ON threat_indicators(ioc_value, organization_id);

-- =============================================================================
-- 2. Threat Actors (APT groups, cybercriminals, hacktivists)
CREATE TABLE IF NOT EXISTS threat_actors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  aliases TEXT, -- JSON array ['APT28', 'Fancy Bear', 'Sofacy']
  description TEXT,
  motivation TEXT CHECK(motivation IN ('financial', 'espionage', 'sabotage', 'ideology', 'revenge', 'unknown')),
  sophistication_level TEXT CHECK(sophistication_level IN ('novice', 'intermediate', 'advanced', 'expert', 'nation_state')),
  targeted_sectors TEXT, -- JSON array ['finance', 'healthcare', 'government']
  targeted_countries TEXT, -- JSON array ['US', 'UK', 'CN']
  ttps TEXT, -- JSON array of MITRE ATT&CK techniques
  tools_used TEXT, -- JSON array ['Mimikatz', 'Cobalt Strike']
  infrastructure_patterns TEXT, -- JSON object with C2 patterns
  attribution_confidence REAL DEFAULT 0.5 CHECK(attribution_confidence >= 0 AND attribution_confidence <= 1),
  attribution_evidence TEXT, -- JSON array of evidence
  first_seen DATETIME,
  last_activity DATETIME,
  activity_status TEXT DEFAULT 'active' CHECK(activity_status IN ('active', 'dormant', 'inactive', 'unknown')),
  threat_score INTEGER DEFAULT 50 CHECK(threat_score BETWEEN 0 AND 100),
  organization_id INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ta_name ON threat_actors(name);
CREATE INDEX IF NOT EXISTS idx_ta_motivation ON threat_actors(motivation);
CREATE INDEX IF NOT EXISTS idx_ta_sophistication ON threat_actors(sophistication_level);
CREATE INDEX IF NOT EXISTS idx_ta_org ON threat_actors(organization_id);

-- =============================================================================
-- 3. Threat Campaigns (coordinated attack operations)
CREATE TABLE IF NOT EXISTS threat_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  actor_id INTEGER,
  start_date DATETIME,
  end_date DATETIME,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'dormant', 'finished', 'monitoring')),
  objectives TEXT, -- Campaign goals
  ttps TEXT, -- JSON array of MITRE ATT&CK techniques
  targeted_sectors TEXT, -- JSON array
  targeted_countries TEXT, -- JSON array
  targeted_technologies TEXT, -- JSON array ['Windows', 'VPN', 'Exchange']
  impact_assessment TEXT,
  victim_count INTEGER DEFAULT 0,
  confidence_level TEXT CHECK(confidence_level IN ('low', 'medium', 'high', 'confirmed')),
  severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  attribution_reasoning TEXT,
  related_campaigns TEXT, -- JSON array of campaign IDs
  ioc_count INTEGER DEFAULT 0,
  organization_id INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES threat_actors(id) ON DELETE SET NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tc_name ON threat_campaigns(name);
CREATE INDEX IF NOT EXISTS idx_tc_actor ON threat_campaigns(actor_id);
CREATE INDEX IF NOT EXISTS idx_tc_status ON threat_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_tc_org ON threat_campaigns(organization_id);

-- =============================================================================
-- 4. IOC Correlations (relationships between indicators)
CREATE TABLE IF NOT EXISTS ioc_correlations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ioc_1_id INTEGER NOT NULL,
  ioc_2_id INTEGER NOT NULL,
  correlation_type TEXT NOT NULL CHECK(correlation_type IN ('temporal', 'infrastructure', 'behavioral', 'campaign', 'victim', 'technical')),
  confidence_score REAL DEFAULT 0.5 CHECK(confidence_score >= 0 AND confidence_score <= 1),
  relationship TEXT, -- 'c2_to_domain', 'hash_to_url', etc.
  evidence TEXT, -- JSON object with evidence details
  temporal_window_hours INTEGER, -- Time window for temporal correlation
  first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  occurrence_count INTEGER DEFAULT 1,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'false_positive')),
  validated BOOLEAN DEFAULT 0,
  validated_by TEXT,
  validated_at DATETIME,
  organization_id INTEGER DEFAULT 1,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ioc_1_id) REFERENCES threat_indicators(id) ON DELETE CASCADE,
  FOREIGN KEY (ioc_2_id) REFERENCES threat_indicators(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  CHECK (ioc_1_id != ioc_2_id)
);

CREATE INDEX IF NOT EXISTS idx_corr_ioc1 ON ioc_correlations(ioc_1_id);
CREATE INDEX IF NOT EXISTS idx_corr_ioc2 ON ioc_correlations(ioc_2_id);
CREATE INDEX IF NOT EXISTS idx_corr_type ON ioc_correlations(correlation_type);
CREATE INDEX IF NOT EXISTS idx_corr_confidence ON ioc_correlations(confidence_score);
CREATE INDEX IF NOT EXISTS idx_corr_org ON ioc_correlations(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_corr_unique ON ioc_correlations(ioc_1_id, ioc_2_id, correlation_type);

-- =============================================================================
-- 5. Threat Feeds (external intelligence sources)
CREATE TABLE IF NOT EXISTS threat_feeds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feed_name TEXT NOT NULL UNIQUE,
  feed_type TEXT NOT NULL CHECK(feed_type IN ('stix', 'taxii', 'json', 'csv', 'xml', 'api', 'rss')),
  feed_url TEXT NOT NULL,
  api_key_encrypted TEXT, -- Encrypted API key if needed
  authentication_method TEXT CHECK(authentication_method IN ('none', 'api_key', 'basic_auth', 'oauth2', 'certificate')),
  polling_interval INTEGER DEFAULT 3600, -- seconds
  last_poll DATETIME,
  next_poll DATETIME,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'error', 'maintenance')),
  total_indicators INTEGER DEFAULT 0,
  new_indicators_last_poll INTEGER DEFAULT 0,
  last_error TEXT,
  error_count INTEGER DEFAULT 0,
  reliability_score REAL DEFAULT 0.5 CHECK(reliability_score >= 0 AND reliability_score <= 1),
  auto_import BOOLEAN DEFAULT 1,
  auto_validate BOOLEAN DEFAULT 0,
  default_confidence REAL DEFAULT 0.5,
  ioc_types_filter TEXT, -- JSON array of IOC types to import
  tags TEXT, -- JSON array for categorization
  config TEXT, -- JSON configuration (headers, params, etc)
  organization_id INTEGER DEFAULT 1,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tf_name ON threat_feeds(feed_name);
CREATE INDEX IF NOT EXISTS idx_tf_status ON threat_feeds(status);
CREATE INDEX IF NOT EXISTS idx_tf_next_poll ON threat_feeds(next_poll);
CREATE INDEX IF NOT EXISTS idx_tf_org ON threat_feeds(organization_id);

-- =============================================================================
-- 6. Threat Hunting Queries (saved searches and detection rules)
CREATE TABLE IF NOT EXISTS threat_hunting_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_name TEXT NOT NULL,
  description TEXT,
  query_text TEXT NOT NULL,
  query_type TEXT NOT NULL CHECK(query_type IN ('ioc_search', 'pattern_match', 'correlation', 'timeline', 'statistical', 'ml_based')),
  query_language TEXT DEFAULT 'sql' CHECK(query_language IN ('sql', 'kql', 'spl', 'lucene', 'custom')),
  tags TEXT, -- JSON array
  severity TEXT CHECK(severity IN ('info', 'low', 'medium', 'high', 'critical')),
  mitre_techniques TEXT, -- JSON array
  created_by TEXT,
  last_run DATETIME,
  last_run_results INTEGER,
  run_count INTEGER DEFAULT 0,
  avg_execution_time INTEGER, -- milliseconds
  success_rate REAL DEFAULT 1.0,
  is_scheduled BOOLEAN DEFAULT 0,
  schedule_cron TEXT,
  next_run DATETIME,
  enabled BOOLEAN DEFAULT 1,
  false_positive_rate REAL DEFAULT 0.0,
  alert_on_match BOOLEAN DEFAULT 0,
  alert_threshold INTEGER DEFAULT 1,
  organization_id INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_thq_name ON threat_hunting_queries(query_name);
CREATE INDEX IF NOT EXISTS idx_thq_type ON threat_hunting_queries(query_type);
CREATE INDEX IF NOT EXISTS idx_thq_scheduled ON threat_hunting_queries(is_scheduled);
CREATE INDEX IF NOT EXISTS idx_thq_next_run ON threat_hunting_queries(next_run);
CREATE INDEX IF NOT EXISTS idx_thq_org ON threat_hunting_queries(organization_id);

-- =============================================================================
-- 7. TI-Risk Links (integration with GRC risk module)
CREATE TABLE IF NOT EXISTS ti_risk_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  ioc_id INTEGER,
  campaign_id INTEGER,
  actor_id INTEGER,
  link_type TEXT NOT NULL CHECK(link_type IN ('generated_from', 'related_to', 'mitigates', 'exploits', 'targets')),
  confidence_score REAL DEFAULT 0.5 CHECK(confidence_score >= 0 AND confidence_score <= 1),
  auto_created BOOLEAN DEFAULT 0,
  rule_matched TEXT, -- Rule name that created the link
  impact_contribution REAL DEFAULT 0.0, -- How much this TI contributes to risk impact
  probability_contribution REAL DEFAULT 0.0, -- How much this TI contributes to risk probability
  validation_status TEXT DEFAULT 'pending' CHECK(validation_status IN ('pending', 'validated', 'rejected')),
  validated_by TEXT,
  validated_at DATETIME,
  notes TEXT,
  organization_id INTEGER DEFAULT 1,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE,
  FOREIGN KEY (ioc_id) REFERENCES threat_indicators(id) ON DELETE CASCADE,
  FOREIGN KEY (campaign_id) REFERENCES threat_campaigns(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES threat_actors(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trl_risk ON ti_risk_links(risk_id);
CREATE INDEX IF NOT EXISTS idx_trl_ioc ON ti_risk_links(ioc_id);
CREATE INDEX IF NOT EXISTS idx_trl_campaign ON ti_risk_links(campaign_id);
CREATE INDEX IF NOT EXISTS idx_trl_actor ON ti_risk_links(actor_id);
CREATE INDEX IF NOT EXISTS idx_trl_type ON ti_risk_links(link_type);
CREATE INDEX IF NOT EXISTS idx_trl_org ON ti_risk_links(organization_id);

-- =============================================================================
-- 8. TI Processing Logs (audit trail for automated processes)
CREATE TABLE IF NOT EXISTS ti_processing_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  processing_type TEXT NOT NULL CHECK(processing_type IN ('feed_poll', 'ioc_enrichment', 'correlation_analysis', 'risk_creation', 'validation', 'cleanup')),
  source_id TEXT, -- Feed ID, IOC ID, etc.
  source_type TEXT, -- 'feed', 'ioc', 'campaign', etc.
  status TEXT NOT NULL CHECK(status IN ('started', 'in_progress', 'completed', 'failed', 'cancelled')),
  details TEXT, -- JSON object with processing details
  errors TEXT, -- JSON array of errors
  warnings TEXT, -- JSON array of warnings
  items_processed INTEGER DEFAULT 0,
  items_created INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  processing_time_ms INTEGER,
  organization_id INTEGER DEFAULT 1,
  initiated_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tpl_type ON ti_processing_logs(processing_type);
CREATE INDEX IF NOT EXISTS idx_tpl_status ON ti_processing_logs(status);
CREATE INDEX IF NOT EXISTS idx_tpl_source ON ti_processing_logs(source_id, source_type);
CREATE INDEX IF NOT EXISTS idx_tpl_created ON ti_processing_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_tpl_org ON ti_processing_logs(organization_id);

-- =============================================================================
-- 9. Risk Creation Rules (automated risk generation from TI)
CREATE TABLE IF NOT EXISTS risk_creation_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_name TEXT NOT NULL UNIQUE,
  description TEXT,
  conditions TEXT NOT NULL, -- JSON object with rule conditions
  confidence_threshold REAL DEFAULT 0.7 CHECK(confidence_threshold >= 0 AND confidence_threshold <= 1),
  auto_promote_to_draft BOOLEAN DEFAULT 0,
  target_category TEXT NOT NULL,
  target_impact INTEGER NOT NULL CHECK(target_impact BETWEEN 1 AND 5),
  target_probability INTEGER NOT NULL CHECK(target_probability BETWEEN 1 AND 5),
  risk_template TEXT, -- JSON template for risk creation
  enabled BOOLEAN DEFAULT 1,
  priority INTEGER DEFAULT 5 CHECK(priority BETWEEN 1 AND 10),
  match_count INTEGER DEFAULT 0,
  last_matched DATETIME,
  false_positive_count INTEGER DEFAULT 0,
  effectiveness_score REAL DEFAULT 0.5,
  organization_id INTEGER DEFAULT 1,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rcr_name ON risk_creation_rules(rule_name);
CREATE INDEX IF NOT EXISTS idx_rcr_enabled ON risk_creation_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_rcr_priority ON risk_creation_rules(priority);
CREATE INDEX IF NOT EXISTS idx_rcr_org ON risk_creation_rules(organization_id);

-- =============================================================================
-- 10. AI Threat Analysis (AI-powered IOC enrichment and analysis)
CREATE TABLE IF NOT EXISTS ai_threat_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ioc_id INTEGER NOT NULL,
  analysis_type TEXT NOT NULL CHECK(analysis_type IN ('enrichment', 'attribution', 'classification', 'risk_scoring', 'mitigation')),
  ai_model TEXT NOT NULL, -- 'cloudflare-llama3', 'openai-gpt4', 'anthropic-claude'
  model_version TEXT,
  confidence_score REAL DEFAULT 0.5 CHECK(confidence_score >= 0 AND confidence_score <= 1),
  threat_classification TEXT CHECK(threat_classification IN ('benign', 'suspicious', 'malicious', 'unknown')),
  threat_family TEXT, -- 'Emotet', 'Cobalt Strike', etc.
  threat_actor TEXT, -- Linked actor if identified
  campaign_attribution TEXT, -- Campaign name if identified
  context_summary TEXT, -- Human-readable summary
  technical_details TEXT, -- JSON object with technical analysis
  risk_factors TEXT, -- JSON array ['c2_communication', 'data_exfiltration']
  mitigation_recommendations TEXT, -- JSON array of recommendations
  confidence_reasoning TEXT, -- Why this confidence score
  attribution_evidence TEXT, -- JSON array of evidence
  mitre_techniques TEXT, -- JSON array of MITRE ATT&CK techniques
  kill_chain_phases TEXT, -- JSON array of kill chain phases
  processing_time_ms INTEGER,
  api_cost_usd REAL DEFAULT 0.0,
  tokens_used INTEGER DEFAULT 0,
  organization_id INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ioc_id) REFERENCES threat_indicators(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ata_ioc ON ai_threat_analysis(ioc_id);
CREATE INDEX IF NOT EXISTS idx_ata_type ON ai_threat_analysis(analysis_type);
CREATE INDEX IF NOT EXISTS idx_ata_model ON ai_threat_analysis(ai_model);
CREATE INDEX IF NOT EXISTS idx_ata_classification ON ai_threat_analysis(threat_classification);
CREATE INDEX IF NOT EXISTS idx_ata_created ON ai_threat_analysis(created_at);
CREATE INDEX IF NOT EXISTS idx_ata_org ON ai_threat_analysis(organization_id);

-- =============================================================================
-- SEED DATA - Sample threat intelligence for testing
-- =============================================================================

-- Sample Threat Actor
INSERT OR IGNORE INTO threat_actors (id, name, aliases, description, motivation, sophistication_level, targeted_sectors, attribution_confidence, first_seen, activity_status)
VALUES (
  1,
  'APT-Demo',
  '["Demo APT", "Test Actor"]',
  'Sample advanced persistent threat actor for testing',
  'espionage',
  'advanced',
  '["finance", "healthcare", "technology"]',
  0.8,
  '2024-01-01 00:00:00',
  'active'
);

-- Sample Campaign
INSERT OR IGNORE INTO threat_campaigns (id, name, description, actor_id, start_date, status, objectives, confidence_level, severity)
VALUES (
  1,
  'Operation Demo Storm',
  'Sample campaign demonstrating TI capabilities',
  1,
  '2024-06-01 00:00:00',
  'active',
  'Data exfiltration and credential harvesting',
  'medium',
  'high'
);

-- Sample IOCs
INSERT OR IGNORE INTO threat_indicators (ioc_type, ioc_value, threat_type, severity, confidence_score, source, context, campaign_id, actor_id, tags)
VALUES 
  ('ip', '192.0.2.1', 'c2', 'high', 0.85, 'manual', 'Known C2 infrastructure', 1, 1, '["c2", "demo", "testing"]'),
  ('domain', 'evil-demo.example.com', 'phishing', 'high', 0.90, 'manual', 'Phishing domain targeting finance sector', 1, 1, '["phishing", "demo"]'),
  ('hash', 'd41d8cd98f00b204e9800998ecf8427e', 'malware', 'critical', 0.95, 'manual', 'Sample malware hash', 1, 1, '["malware", "demo"]'),
  ('url', 'http://bad-demo.example.com/payload.exe', 'malware', 'critical', 0.90, 'manual', 'Malware distribution URL', 1, 1, '["malware", "distribution"]');

-- Sample Correlation
INSERT OR IGNORE INTO ioc_correlations (ioc_1_id, ioc_2_id, correlation_type, confidence_score, relationship, evidence)
VALUES (
  1, 2,
  'infrastructure',
  0.85,
  'c2_to_phishing_domain',
  '{"shared_ip": "192.0.2.1", "temporal_proximity": "2h", "dns_records": "same_registrar"}'
);

-- Sample Threat Feed
INSERT OR IGNORE INTO threat_feeds (feed_name, feed_type, feed_url, polling_interval, status, reliability_score, auto_import)
VALUES (
  'Demo Feed',
  'json',
  'https://example.com/demo-feed.json',
  3600,
  'inactive',
  0.7,
  0
);

-- Sample Hunting Query
INSERT OR IGNORE INTO threat_hunting_queries (query_name, description, query_text, query_type, severity, enabled)
VALUES (
  'Find High-Confidence Malicious IPs',
  'Identify IP addresses marked as malicious with confidence > 0.8',
  'SELECT * FROM threat_indicators WHERE ioc_type = "ip" AND threat_type IN ("c2", "malware") AND confidence_score > 0.8 AND status = "active"',
  'ioc_search',
  'high',
  1
);

-- Sample Risk Creation Rule
INSERT OR IGNORE INTO risk_creation_rules (rule_name, description, conditions, confidence_threshold, auto_promote_to_draft, target_category, target_impact, target_probability, enabled)
VALUES (
  'High-Confidence C2 to Risk',
  'Automatically create risks from high-confidence C2 indicators',
  '{"ioc_type": "ip", "threat_type": "c2", "min_confidence": 0.8, "severity": ["high", "critical"]}',
  0.8,
  1,
  'Cyber Threat',
  4,
  4,
  1
);

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Active High-Severity Threats
CREATE VIEW IF NOT EXISTS v_active_high_threats AS
SELECT 
  ti.id,
  ti.ioc_type,
  ti.ioc_value,
  ti.threat_type,
  ti.severity,
  ti.confidence_score,
  tc.name as campaign_name,
  ta.name as actor_name,
  ti.first_seen,
  ti.last_seen,
  ti.status
FROM threat_indicators ti
LEFT JOIN threat_campaigns tc ON ti.campaign_id = tc.id
LEFT JOIN threat_actors ta ON ti.actor_id = ta.id
WHERE ti.status = 'active' 
  AND ti.severity IN ('high', 'critical')
ORDER BY ti.severity DESC, ti.confidence_score DESC;

-- TI-Risk Linkage Overview
CREATE VIEW IF NOT EXISTS v_ti_risk_summary AS
SELECT 
  r.id as risk_id,
  r.title as risk_title,
  r.category,
  r.probability,
  r.impact,
  COUNT(DISTINCT trl.ioc_id) as linked_iocs,
  COUNT(DISTINCT trl.campaign_id) as linked_campaigns,
  COUNT(DISTINCT trl.actor_id) as linked_actors,
  AVG(trl.confidence_score) as avg_confidence
FROM risks r
LEFT JOIN ti_risk_links trl ON r.id = trl.risk_id
GROUP BY r.id;

-- Campaign Activity Summary
CREATE VIEW IF NOT EXISTS v_campaign_activity AS
SELECT 
  tc.id,
  tc.name,
  tc.status,
  tc.severity,
  ta.name as attributed_actor,
  COUNT(DISTINCT ti.id) as ioc_count,
  COUNT(DISTINCT trl.risk_id) as linked_risks,
  MAX(ti.last_seen) as last_activity
FROM threat_campaigns tc
LEFT JOIN threat_actors ta ON tc.actor_id = ta.id
LEFT JOIN threat_indicators ti ON tc.id = ti.campaign_id
LEFT JOIN ti_risk_links trl ON tc.id = trl.campaign_id
GROUP BY tc.id;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
