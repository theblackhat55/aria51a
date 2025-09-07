-- Migration 18: Dynamic TI Risk Lifecycle Enhancement
-- Extends existing risk management with dynamic threat intelligence capabilities

-- Extend risks table with TI fields (enhancing existing structure)
ALTER TABLE risks ADD COLUMN source_type TEXT DEFAULT 'manual';
ALTER TABLE risks ADD COLUMN dynamic_state TEXT DEFAULT NULL;
ALTER TABLE risks ADD COLUMN confidence_score REAL DEFAULT 0.0;
ALTER TABLE risks ADD COLUMN threat_intel_sources TEXT DEFAULT '[]';
ALTER TABLE risks ADD COLUMN last_ti_update DATETIME DEFAULT NULL;
ALTER TABLE risks ADD COLUMN auto_retirement_date DATETIME DEFAULT NULL;
ALTER TABLE risks ADD COLUMN ti_enrichment_summary TEXT DEFAULT NULL;
ALTER TABLE risks ADD COLUMN framework_mappings TEXT DEFAULT '[]';

-- Dynamic risk state history tracking
CREATE TABLE IF NOT EXISTS dynamic_risk_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  previous_state TEXT,
  current_state TEXT NOT NULL,
  transition_reason TEXT,
  automated BOOLEAN DEFAULT FALSE,
  confidence_change REAL DEFAULT 0.0,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- TI source attribution for risks  
CREATE TABLE IF NOT EXISTS ti_risk_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  source_name TEXT NOT NULL, -- 'cisa-kev', 'nvd', 'otx', 'epss', etc.
  source_type TEXT NOT NULL, -- 'osint', 'premium', 'internal'
  indicator_type TEXT NOT NULL, -- 'cve', 'ioc', 'ttp', 'campaign'
  indicator_value TEXT NOT NULL, -- CVE-2024-1234, hash, IP, etc.
  confidence_level TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  data_payload TEXT, -- JSON with source-specific data
  risk_score_contribution REAL DEFAULT 0.0,
  first_detected DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active', -- 'active', 'retired', 'false_positive'
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE
);

-- TI processing logs for audit trail
CREATE TABLE IF NOT EXISTS ti_risk_processing_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_name TEXT NOT NULL,
  processing_type TEXT NOT NULL, -- 'ingestion', 'correlation', 'risk_creation'
  status TEXT NOT NULL, -- 'success', 'failed', 'partial'
  records_processed INTEGER DEFAULT 0,
  risks_created INTEGER DEFAULT 0,
  risks_updated INTEGER DEFAULT 0,
  errors_encountered TEXT, -- JSON array of errors
  processing_duration INTEGER, -- milliseconds
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  metadata TEXT -- JSON with additional processing info
);

-- Risk creation rules configuration
CREATE TABLE IF NOT EXISTS ti_risk_creation_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_name TEXT UNIQUE NOT NULL,
  source_type TEXT NOT NULL,
  conditions TEXT NOT NULL, -- JSON with rule conditions
  auto_create_enabled BOOLEAN DEFAULT TRUE,
  auto_promote_to_draft BOOLEAN DEFAULT FALSE,
  confidence_threshold REAL DEFAULT 0.7,
  risk_category_mapping TEXT DEFAULT 'cybersecurity',
  priority_level INTEGER DEFAULT 3,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Framework mappings for TI risks
CREATE TABLE IF NOT EXISTS ti_framework_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  framework_name TEXT NOT NULL, -- 'nist-csf', 'mitre-attack', 'iso27001'
  control_id TEXT NOT NULL,
  mapping_confidence REAL DEFAULT 0.0,
  automated BOOLEAN DEFAULT TRUE,
  rationale TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_risks_source_type ON risks(source_type);
CREATE INDEX IF NOT EXISTS idx_risks_dynamic_state ON risks(dynamic_state);
CREATE INDEX IF NOT EXISTS idx_risks_confidence_score ON risks(confidence_score);
CREATE INDEX IF NOT EXISTS idx_dynamic_risk_states_risk_id ON dynamic_risk_states(risk_id);
CREATE INDEX IF NOT EXISTS idx_ti_risk_sources_risk_id ON ti_risk_sources(risk_id);
CREATE INDEX IF NOT EXISTS idx_ti_risk_sources_source_name ON ti_risk_sources(source_name);
CREATE INDEX IF NOT EXISTS idx_ti_risk_sources_indicator_value ON ti_risk_sources(indicator_value);
CREATE INDEX IF NOT EXISTS idx_ti_processing_logs_source_name ON ti_risk_processing_logs(source_name);
CREATE INDEX IF NOT EXISTS idx_ti_processing_logs_started_at ON ti_risk_processing_logs(started_at);

-- Insert default TI risk creation rules
INSERT OR IGNORE INTO ti_risk_creation_rules (rule_name, source_type, conditions, auto_create_enabled, auto_promote_to_draft, confidence_threshold, risk_category_mapping) VALUES
('CISA KEV Auto-Create', 'osint', '{"source": "cisa-kev", "exploitation_status": "active"}', 1, 1, 0.95, 'cybersecurity'),
('High EPSS Score', 'osint', '{"epss_score": {">=": 0.8}}', 1, 1, 0.85, 'cybersecurity'),
('Critical CVE with Assets', 'osint', '{"cvss_score": {">=": 9.0}, "affected_assets": {"exists": true}}', 1, 0, 0.80, 'cybersecurity'),
('Active Malware IOC', 'osint', '{"type": "malware", "confidence": {">=": 0.8}}', 1, 0, 0.75, 'cybersecurity'),
('Ransomware Campaign', 'osint', '{"campaign_type": "ransomware", "status": "active"}', 1, 1, 0.90, 'cybersecurity');

-- Update existing manual risks to have proper source_type
UPDATE risks SET source_type = 'manual' WHERE source_type IS NULL OR source_type = '';

-- Create sample dynamic TI risks based on real threat intelligence
INSERT OR IGNORE INTO risks (title, description, category, owner_id, organization_id, probability, impact, status, review_date, source_type, dynamic_state, confidence_score, threat_intel_sources, framework_mappings, ti_enrichment_summary) VALUES
('CVE-2024-12345 Remote Code Execution', 'Critical RCE vulnerability in Apache Struts framework actively exploited by APT groups', 'cybersecurity', 2, 1, 5, 5, 'active', date('now', '+7 days'), 'Dynamic-TI', 'active', 0.95, 
'[{"source":"cisa-kev","confidence":"high","first_seen":"2024-12-01"},{"source":"nvd","confidence":"high","cvss_score":9.8}]',
'[{"framework":"NIST_CSF","controls":["PR.IP-12","DE.CM-8"]},{"framework":"MITRE_ATT&CK","techniques":["T1190","T1059"]}]',
'Critical vulnerability actively exploited in ransomware campaigns. Apache Struts RCE affects web applications. Immediate patching required for affected systems.'),

('Emotet Malware Campaign IOCs', 'Active Emotet botnet campaign with new infrastructure and TTPs detected across financial sector', 'cybersecurity', 2, 1, 4, 4, 'active', date('now', '+14 days'), 'Dynamic-TI', 'active', 0.88,
'[{"source":"otx","confidence":"high","ioc_count":47},{"source":"abuse-ch","confidence":"high","c2_servers":12}]',
'[{"framework":"NIST_CSF","controls":["PR.PT-1","DE.CM-4","RS.MI-3"]},{"framework":"MITRE_ATT&CK","techniques":["T1566.001","T1027","T1055"]}]',
'Banking trojan campaign targeting financial institutions. Spear phishing with macro-enabled documents leading to credential harvesting and lateral movement.'),

('APT28 Infrastructure Expansion', 'Russian APT28 group expanding C2 infrastructure with new domains and IP ranges for targeting government entities', 'cybersecurity', 2, 1, 3, 5, 'active', date('now', '+30 days'), 'Dynamic-TI', 'validated', 0.82,
'[{"source":"mandiant","confidence":"high","attribution":"apt28"},{"source":"recorded-future","confidence":"medium","infrastructure_count":23}]',
'[{"framework":"NIST_CSF","controls":["ID.AM-1","PR.AC-3","DE.AE-2"]},{"framework":"MITRE_ATT&CK","techniques":["T1583.001","T1071.001","T1027.010"]}]',
'Nation-state campaign targeting government and defense contractors. DNS tunneling and living-off-the-land techniques observed. Enhanced monitoring recommended.'),

('SolarWinds Supply Chain Follow-up', 'New supply chain compromise indicators related to SolarWinds incident affecting additional vendors', 'cybersecurity', 2, 1, 2, 5, 'monitoring', date('now', '+60 days'), 'Dynamic-TI', 'draft', 0.75,
'[{"source":"cisa","confidence":"medium","supply_chain":true},{"source":"internal","confidence":"high","vendor_count":3}]',
'[{"framework":"NIST_CSF","controls":["ID.SC-3","PR.DS-6","DE.CM-7"]},{"framework":"MITRE_ATT&CK","techniques":["T1195.002","T1078","T1027"]}]',
'Supply chain indicators suggesting additional compromised software packages. Vendor security assessment and software inventory review recommended.'),

('Zero-Day Exploitation in the Wild', 'Previously unknown vulnerability being exploited in targeted attacks against critical infrastructure', 'cybersecurity', 2, 1, 4, 5, 'active', date('now', '+3 days'), 'Dynamic-TI', 'draft', 0.70,
'[{"source":"zerodium","confidence":"medium","zero_day":true},{"source":"internal_threat_hunting","confidence":"high","detections":5}]',
'[{"framework":"NIST_CSF","controls":["DE.CM-1","RS.AN-1","RC.IM-1"]},{"framework":"MITRE_ATT&CK","techniques":["T1068","T1055","T1070"]}]',
'Zero-day exploit targeting industrial control systems. No CVE assigned yet. Enhanced monitoring and incident response readiness required.');

-- Insert corresponding TI source attributions
INSERT OR IGNORE INTO ti_risk_sources (risk_id, source_name, source_type, indicator_type, indicator_value, confidence_level, data_payload, risk_score_contribution) VALUES
((SELECT id FROM risks WHERE title = 'CVE-2024-12345 Remote Code Execution'), 'cisa-kev', 'osint', 'cve', 'CVE-2024-12345', 'high', '{"exploitation_status":"active","due_date":"2024-12-15","ransomware_use":"yes"}', 15.0),
((SELECT id FROM risks WHERE title = 'CVE-2024-12345 Remote Code Execution'), 'nvd', 'osint', 'cve', 'CVE-2024-12345', 'high', '{"cvss_score":9.8,"cvss_vector":"CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"}', 10.0),
((SELECT id FROM risks WHERE title = 'Emotet Malware Campaign IOCs'), 'otx', 'osint', 'ioc', 'multiple', 'high', '{"ioc_count":47,"malware_family":"emotet","campaign_active":true}', 12.0),
((SELECT id FROM risks WHERE title = 'Emotet Malware Campaign IOCs'), 'abuse-ch', 'osint', 'ioc', 'c2-infrastructure', 'high', '{"c2_servers":12,"malware_bazaar_samples":23,"active_botnet":true}', 8.0),
((SELECT id FROM risks WHERE title = 'APT28 Infrastructure Expansion'), 'mandiant', 'premium', 'ttp', 'apt28-infrastructure', 'high', '{"threat_actor":"apt28","attribution_confidence":"high","government_targeting":true}', 15.0),
((SELECT id FROM risks WHERE title = 'SolarWinds Supply Chain Follow-up'), 'cisa', 'osint', 'ttp', 'supply-chain-indicators', 'medium', '{"supply_chain_compromise":true,"vendors_affected":3,"ongoing_investigation":true}', 10.0),
((SELECT id FROM risks WHERE title = 'Zero-Day Exploitation in the Wild'), 'internal_threat_hunting', 'internal', 'ttp', 'zero-day-exploitation', 'high', '{"zero_day":true,"critical_infrastructure_targeting":true,"detections":5}', 18.0);

-- Insert dynamic risk state transitions
INSERT OR IGNORE INTO dynamic_risk_states (risk_id, previous_state, current_state, transition_reason, automated, confidence_change) VALUES
((SELECT id FROM risks WHERE title = 'CVE-2024-12345 Remote Code Execution'), 'detected', 'draft', 'Auto-created from CISA KEV feed', 1, 0.95),
((SELECT id FROM risks WHERE title = 'CVE-2024-12345 Remote Code Execution'), 'draft', 'validated', 'CRO approved for tracking', 0, 0.0),
((SELECT id FROM risks WHERE title = 'CVE-2024-12345 Remote Code Execution'), 'validated', 'active', 'Affected assets confirmed in environment', 1, 0.0),
((SELECT id FROM risks WHERE title = 'Emotet Malware Campaign IOCs'), 'detected', 'draft', 'Auto-created from OTX feed correlation', 1, 0.88),
((SELECT id FROM risks WHERE title = 'Emotet Malware Campaign IOCs'), 'draft', 'validated', 'Security team validated threat relevance', 0, 0.0),
((SELECT id FROM risks WHERE title = 'Emotet Malware Campaign IOCs'), 'validated', 'active', 'Email security controls updated', 0, 0.0),
((SELECT id FROM risks WHERE title = 'APT28 Infrastructure Expansion'), 'detected', 'draft', 'Premium feed intelligence correlation', 1, 0.82),
((SELECT id FROM risks WHERE title = 'APT28 Infrastructure Expansion'), 'draft', 'validated', 'Threat intelligence team assessment', 0, 0.0),
((SELECT id FROM risks WHERE title = 'SolarWinds Supply Chain Follow-up'), 'detected', 'draft', 'Supply chain risk assessment triggered', 1, 0.75),
((SELECT id FROM risks WHERE title = 'Zero-Day Exploitation in the Wild'), 'detected', 'draft', 'Internal threat hunting discovery', 1, 0.70);

-- Insert framework mappings
INSERT OR IGNORE INTO ti_framework_mappings (risk_id, framework_name, control_id, mapping_confidence, automated, rationale) VALUES
((SELECT id FROM risks WHERE title = 'CVE-2024-12345 Remote Code Execution'), 'NIST_CSF', 'PR.IP-12', 0.95, 1, 'Vulnerability management process directly applicable'),
((SELECT id FROM risks WHERE title = 'CVE-2024-12345 Remote Code Execution'), 'NIST_CSF', 'DE.CM-8', 0.90, 1, 'Vulnerability scanning and monitoring required'),
((SELECT id FROM risks WHERE title = 'CVE-2024-12345 Remote Code Execution'), 'MITRE_ATT&CK', 'T1190', 0.98, 1, 'Exploit Public-Facing Application technique'),
((SELECT id FROM risks WHERE title = 'CVE-2024-12345 Remote Code Execution'), 'MITRE_ATT&CK', 'T1059', 0.85, 1, 'Command and Scripting Interpreter'),
((SELECT id FROM risks WHERE title = 'Emotet Malware Campaign IOCs'), 'NIST_CSF', 'PR.PT-1', 0.92, 1, 'Malware defense and protection'),
((SELECT id FROM risks WHERE title = 'Emotet Malware Campaign IOCs'), 'NIST_CSF', 'DE.CM-4', 0.95, 1, 'Malicious code detection'),
((SELECT id FROM risks WHERE title = 'Emotet Malware Campaign IOCs'), 'MITRE_ATT&CK', 'T1566.001', 0.96, 1, 'Spearphishing Attachment technique'),
((SELECT id FROM risks WHERE title = 'APT28 Infrastructure Expansion'), 'NIST_CSF', 'ID.AM-1', 0.88, 1, 'Asset inventory and management'),
((SELECT id FROM risks WHERE title = 'APT28 Infrastructure Expansion'), 'MITRE_ATT&CK', 'T1583.001', 0.93, 1, 'Acquire Infrastructure: Domains'),
((SELECT id FROM risks WHERE title = 'SolarWinds Supply Chain Follow-up'), 'NIST_CSF', 'ID.SC-3', 0.94, 1, 'Supply chain risk assessment'),
((SELECT id FROM risks WHERE title = 'SolarWinds Supply Chain Follow-up'), 'MITRE_ATT&CK', 'T1195.002', 0.97, 1, 'Supply Chain Compromise: Software Supply Chain');

-- Create system configuration for TI processing
INSERT OR IGNORE INTO system_configuration (key, value, description, updated_at) VALUES
('ti_processing_enabled', 'true', 'Enable threat intelligence processing', CURRENT_TIMESTAMP),
('ti_auto_risk_creation', 'true', 'Enable automatic risk creation from TI sources', CURRENT_TIMESTAMP),
('ti_confidence_threshold', '0.70', 'Minimum confidence threshold for auto-risk creation', CURRENT_TIMESTAMP),
('ti_max_risks_per_day', '50', 'Maximum number of TI risks created per day', CURRENT_TIMESTAMP),
('ti_feed_sync_interval', '3600', 'Feed synchronization interval in seconds', CURRENT_TIMESTAMP),
('ti_auto_retirement_days', '30', 'Days after which inactive TI risks are auto-retired', CURRENT_TIMESTAMP);