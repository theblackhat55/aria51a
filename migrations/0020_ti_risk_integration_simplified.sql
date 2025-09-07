-- TI-Risk Integration Migration (Simplified)
-- Phase 1: Core TI-GRC Integration Schema Extensions
-- Works with existing IOCs and threat feeds tables

-- Add risk linkage columns to existing IOCs table
ALTER TABLE iocs ADD COLUMN risk_id INTEGER;
ALTER TABLE iocs ADD COLUMN auto_risk_created BOOLEAN DEFAULT 0;
ALTER TABLE iocs ADD COLUMN risk_confidence REAL;

-- Create TI risk states tracking table
CREATE TABLE IF NOT EXISTS ti_risk_states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    risk_id INTEGER NOT NULL,
    current_state TEXT NOT NULL CHECK (current_state IN ('detected', 'draft', 'validated', 'active', 'retired')),
    previous_state TEXT,
    transition_reason TEXT,
    automated BOOLEAN DEFAULT FALSE,
    confidence_score REAL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    source_ioc_id INTEGER,
    transition_user TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE
);

-- Create TI risk creation rules table
CREATE TABLE IF NOT EXISTS ti_risk_creation_rules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rule_name TEXT NOT NULL UNIQUE,
    description TEXT,
    conditions TEXT NOT NULL, -- JSON: IOC type, confidence thresholds, etc.
    confidence_threshold REAL DEFAULT 0.7 CHECK (confidence_threshold >= 0 AND confidence_threshold <= 1),
    auto_promote_to_draft BOOLEAN DEFAULT FALSE,
    target_category TEXT DEFAULT 'cybersecurity',
    target_impact INTEGER DEFAULT 3 CHECK (target_impact >= 1 AND target_impact <= 5),
    target_probability INTEGER DEFAULT 3 CHECK (target_probability >= 1 AND target_probability <= 5),
    enabled BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create TI processing logs for audit trail
CREATE TABLE IF NOT EXISTS ti_processing_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    process_type TEXT NOT NULL, -- 'risk_creation', 'rule_evaluation', 'state_transition', etc.
    entity_id TEXT, -- IOC ID, risk ID, etc.
    entity_type TEXT, -- 'ioc', 'risk', 'rule', etc.
    level TEXT DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warning', 'error')),
    component TEXT DEFAULT 'ti_engine',
    message TEXT,
    details TEXT, -- JSON with additional context
    success BOOLEAN DEFAULT TRUE,
    processing_time_ms INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_iocs_risk_id ON iocs(risk_id);
CREATE INDEX IF NOT EXISTS idx_iocs_auto_created ON iocs(auto_risk_created);
CREATE INDEX IF NOT EXISTS idx_ti_risk_states_risk_id ON ti_risk_states(risk_id);
CREATE INDEX IF NOT EXISTS idx_ti_risk_states_current_state ON ti_risk_states(current_state);
CREATE INDEX IF NOT EXISTS idx_ti_risk_states_created_at ON ti_risk_states(created_at);
CREATE INDEX IF NOT EXISTS idx_ti_processing_logs_entity ON ti_processing_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ti_processing_logs_created_at ON ti_processing_logs(created_at);

-- Insert default risk creation rules
INSERT OR IGNORE INTO ti_risk_creation_rules (
    rule_name, 
    description, 
    conditions, 
    confidence_threshold,
    auto_promote_to_draft,
    target_category,
    target_impact,
    target_probability,
    priority
) VALUES 
(
    'High Confidence Malicious IPs',
    'Create risks for IP addresses with high malicious confidence',
    '{"ioc_type": "ip", "min_confidence": 0.8, "threat_types": ["malware", "c2", "botnet"]}',
    0.8,
    TRUE,
    'cybersecurity',
    4,
    3,
    1
),
(
    'Known Malware Domains',
    'Create risks for domains hosting malware or phishing',
    '{"ioc_type": "domain", "min_confidence": 0.75, "threat_types": ["malware", "phishing"]}',
    0.75,
    TRUE,
    'cybersecurity',
    3,
    3,
    2
),
(
    'Critical CVE IOCs',
    'Create risks for IOCs related to critical vulnerabilities',
    '{"min_confidence": 0.7, "tags": ["cve", "critical"], "severity": ["critical", "high"]}',
    0.7,
    FALSE,
    'vulnerability_management',
    5,
    4,
    3
);

-- Add initial log entry
INSERT INTO ti_processing_logs (
    process_type,
    entity_type,
    level,
    component,
    message,
    details,
    success
) VALUES (
    'schema_migration',
    'database',
    'info',
    'migration_system',
    'TI-Risk integration schema initialized',
    '{"migration": "0020_ti_risk_integration_simplified", "tables_created": ["ti_risk_states", "ti_risk_creation_rules", "ti_processing_logs"], "indexes_created": 7, "default_rules": 3}',
    TRUE
);