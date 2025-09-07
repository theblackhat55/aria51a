-- TI Risk Integration Migration
-- Phase 1: Dynamic Risk Integration with existing TI infrastructure
-- Extends existing tables without breaking changes

-- Extend existing IOCs table for risk integration
ALTER TABLE iocs ADD COLUMN risk_id INTEGER;
ALTER TABLE iocs ADD COLUMN auto_risk_created BOOLEAN DEFAULT 0;
ALTER TABLE iocs ADD COLUMN risk_creation_confidence REAL;

-- Extend existing threat_campaigns table for risk association  
ALTER TABLE threat_campaigns ADD COLUMN associated_risks TEXT; -- JSON array of risk IDs

-- Add foreign key constraint for risk linkage (if risks table exists)
-- This will be executed conditionally based on existing schema

-- TI Risk States table - tracks dynamic risk lifecycle
CREATE TABLE IF NOT EXISTS ti_risk_states (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  source_ioc_id INTEGER,
  source_campaign_id INTEGER,
  previous_state TEXT,
  current_state TEXT NOT NULL CHECK (current_state IN ('detected', 'draft', 'validated', 'active', 'retired')),
  transition_reason TEXT,
  automated BOOLEAN DEFAULT FALSE,
  confidence_score REAL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (source_ioc_id) REFERENCES iocs(id),
  FOREIGN KEY (source_campaign_id) REFERENCES threat_campaigns(id)
);

-- TI Risk Creation Rules - configurable rules for auto-risk creation
CREATE TABLE IF NOT EXISTS ti_risk_creation_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_name TEXT NOT NULL UNIQUE,
  description TEXT,
  conditions TEXT NOT NULL, -- JSON with conditions like {"confidence_min": 80, "threat_level": ["critical", "high"]}
  confidence_threshold REAL DEFAULT 0.8 CHECK (confidence_threshold >= 0 AND confidence_threshold <= 1),
  auto_promote_to_draft BOOLEAN DEFAULT FALSE,
  target_category TEXT DEFAULT 'cybersecurity',
  target_impact INTEGER DEFAULT 3 CHECK (target_impact >= 1 AND target_impact <= 5),
  target_probability INTEGER DEFAULT 3 CHECK (target_probability >= 1 AND target_probability <= 5),
  enabled BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 50,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TI Risk Enrichment - AI and analysis data for TI-created risks  
CREATE TABLE IF NOT EXISTS ti_risk_enrichment (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  enrichment_type TEXT NOT NULL CHECK (enrichment_type IN ('ai_analysis', 'correlation', 'threat_context', 'mitigation')),
  enrichment_data TEXT, -- JSON with enrichment details
  confidence REAL CHECK (confidence >= 0 AND confidence <= 1),
  source TEXT, -- 'ai_llm', 'correlation_engine', 'manual'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- TI Processing Logs - audit trail for TI processing activities
CREATE TABLE IF NOT EXISTS ti_processing_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  processing_type TEXT NOT NULL CHECK (processing_type IN ('ioc_processing', 'risk_creation', 'feed_sync', 'correlation')),
  source_id TEXT, -- IOC ID, Campaign ID, etc.
  source_type TEXT, -- 'ioc', 'campaign', 'feed'
  action TEXT NOT NULL, -- 'created', 'updated', 'processed', 'failed'
  details TEXT, -- JSON with processing details
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_iocs_risk_id ON iocs(risk_id);
CREATE INDEX IF NOT EXISTS idx_iocs_auto_risk_created ON iocs(auto_risk_created);
CREATE INDEX IF NOT EXISTS idx_ti_risk_states_risk_id ON ti_risk_states(risk_id);
CREATE INDEX IF NOT EXISTS idx_ti_risk_states_current_state ON ti_risk_states(current_state);
CREATE INDEX IF NOT EXISTS idx_ti_risk_states_source_ioc ON ti_risk_states(source_ioc_id);
CREATE INDEX IF NOT EXISTS idx_ti_risk_creation_rules_enabled ON ti_risk_creation_rules(enabled);
CREATE INDEX IF NOT EXISTS idx_ti_risk_enrichment_risk_id ON ti_risk_enrichment(risk_id);
CREATE INDEX IF NOT EXISTS idx_ti_risk_enrichment_type ON ti_risk_enrichment(enrichment_type);
CREATE INDEX IF NOT EXISTS idx_ti_processing_logs_type ON ti_processing_logs(processing_type);
CREATE INDEX IF NOT EXISTS idx_ti_processing_logs_created ON ti_processing_logs(created_at);

-- Insert default risk creation rules
INSERT OR IGNORE INTO ti_risk_creation_rules 
(rule_name, description, conditions, confidence_threshold, auto_promote_to_draft, target_impact, target_probability, enabled, priority) 
VALUES
-- High confidence critical IOCs
('Critical High Confidence IOCs', 
 'Auto-create risks from IOCs with critical threat level and confidence >= 90%',
 '{"confidence_min": 90, "threat_level": ["critical"], "ioc_types": ["ip", "domain", "hash", "url"]}',
 0.9, 
 true, 
 5, 
 4, 
 true, 
 90),

-- High confidence high IOCs  
('High Confidence IOCs',
 'Auto-create risks from IOCs with high threat level and confidence >= 80%',
 '{"confidence_min": 80, "threat_level": ["high"], "ioc_types": ["ip", "domain", "hash", "url"]}',
 0.8,
 true,
 4,
 4,
 true,
 80),

-- Active campaign indicators
('Active Campaign Threats',
 'Create risks for IOCs associated with active threat campaigns',
 '{"campaign_status": "active", "confidence_min": 70, "threat_level": ["critical", "high"]}',
 0.7,
 true,
 4,
 4,
 true,
 85),

-- Critical infrastructure targeting
('Critical Infrastructure Threats',
 'High-priority IOCs targeting critical infrastructure',
 '{"tags": ["critical_infrastructure", "scada", "industrial", "healthcare", "financial"], "confidence_min": 60, "threat_level": ["high", "critical"]}',
 0.6,
 false,
 5,
 3,
 true,
 95),

-- Government source IOCs  
('Government Source IOCs',
 'IOCs from government sources (CISA, etc.) with high reliability',
 '{"source_patterns": ["cisa", "government", "cert"], "confidence_min": 75}',
 0.75,
 true,
 4,
 4,
 true,
 88),

-- Medium confidence batch processing
('Medium Confidence Batch',
 'Batch process medium confidence IOCs for review',
 '{"confidence_min": 60, "confidence_max": 79, "threat_level": ["medium", "high"], "batch_size": 10}',
 0.6,
 false,
 3,
 3,
 true,
 50);

-- Create sample TI risk state transitions for demonstration
-- (This would normally be populated by the application)
INSERT OR IGNORE INTO ti_risk_states 
(risk_id, current_state, transition_reason, automated, confidence_score) 
VALUES 
-- These will be populated when risks are created from IOCs
-- Adding placeholder entry to establish table structure
(-1, 'detected', 'Sample entry for schema validation', true, 0.8);

-- Remove the placeholder entry
DELETE FROM ti_risk_states WHERE risk_id = -1;

-- Create sample processing log entry
INSERT OR IGNORE INTO ti_processing_logs
(processing_type, source_type, action, details, success, processing_time_ms)
VALUES
('ioc_processing', 'migration', 'schema_created', '{"migration": "0012_ti_risk_integration", "tables_created": ["ti_risk_states", "ti_risk_creation_rules", "ti_risk_enrichment", "ti_processing_logs"]}', true, 0);