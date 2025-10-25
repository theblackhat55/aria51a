-- Migration: 0117_threat_intelligence_grc_focused.sql
-- Description: GRC-focused Threat Intelligence for Dynamic Risk Management
-- Purpose: TI consumption for compliance risk identification (NOT SOC operations)
-- Author: ARIA5 Security Team
-- Date: 2025-10-24
-- Context: GRC Platform - Consume TI to identify risks, not operate on threats

-- =============================================================================
-- CORE PRINCIPLE: Simplified TI for Risk Management
-- - Focus on CONSUMPTION, not OPERATION
-- - Translate threats to BUSINESS RISKS
-- - Map threats to COMPLIANCE FRAMEWORKS
-- - NO IOC management (that's for SOC tools)
-- - NO threat hunting (that's operational security)
-- =============================================================================

-- =============================================================================
-- 1. THREAT INTELLIGENCE FEEDS (External Sources)
-- =============================================================================
CREATE TABLE IF NOT EXISTS threat_intelligence_feeds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feed_name TEXT NOT NULL UNIQUE,
  feed_url TEXT NOT NULL,
  feed_type TEXT CHECK(feed_type IN ('cisa_kev', 'nist_nvd', 'sector_isac', 'vendor_advisory', 'government', 'commercial')),
  description TEXT,
  polling_interval INTEGER DEFAULT 86400, -- 24 hours (daily polling is sufficient)
  last_poll_at DATETIME,
  next_poll_at DATETIME,
  last_item_count INTEGER DEFAULT 0,
  total_items_imported INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'error')),
  last_error TEXT,
  reliability_rating TEXT DEFAULT 'medium' CHECK(reliability_rating IN ('low', 'medium', 'high', 'verified')),
  
  -- GRC-specific filters
  auto_create_risks BOOLEAN DEFAULT 1,
  relevance_threshold REAL DEFAULT 0.7, -- Only import items with relevance > 0.7
  target_sectors TEXT, -- JSON array ['healthcare', 'finance']
  target_technologies TEXT, -- JSON array ['Windows', 'Linux', 'Cloud']
  
  -- Metadata
  organization_id INTEGER DEFAULT 1,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tif_status ON threat_intelligence_feeds(status);
CREATE INDEX IF NOT EXISTS idx_tif_next_poll ON threat_intelligence_feeds(next_poll_at);
CREATE INDEX IF NOT EXISTS idx_tif_org ON threat_intelligence_feeds(organization_id);

-- =============================================================================
-- 2. THREAT INTELLIGENCE ITEMS (Consumed Threat Intelligence)
-- =============================================================================
CREATE TABLE IF NOT EXISTS threat_intelligence_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  feed_id INTEGER NOT NULL,
  
  -- Threat Information
  external_id TEXT, -- CVE ID, Advisory ID, etc.
  threat_title TEXT NOT NULL,
  threat_description TEXT,
  threat_type TEXT CHECK(threat_type IN ('vulnerability', 'exploit', 'campaign', 'malware', 'technique', 'advisory')),
  severity TEXT CHECK(severity IN ('info', 'low', 'medium', 'high', 'critical')),
  
  -- Business Context (GRC Focus)
  business_impact TEXT, -- Human-readable business impact
  affected_sectors TEXT, -- JSON array ['healthcare', 'finance', 'retail']
  affected_technologies TEXT, -- JSON array ['Windows', 'Exchange', 'VMware']
  affected_products TEXT, -- JSON array specific products
  geographic_scope TEXT, -- 'global', 'US', 'EU', etc.
  
  -- Technical Details
  cve_ids TEXT, -- JSON array ['CVE-2024-1234', 'CVE-2024-5678']
  cwe_ids TEXT, -- JSON array of weakness IDs
  mitre_techniques TEXT, -- JSON array ['T1078', 'T1190']
  cvss_score REAL,
  cvss_vector TEXT,
  
  -- Dates
  published_date DATETIME NOT NULL,
  last_updated_date DATETIME,
  expires_date DATETIME,
  
  -- GRC-Specific Fields
  relevance_score REAL DEFAULT 0.5 CHECK(relevance_score >= 0 AND relevance_score <= 1),
  relevance_reasoning TEXT, -- Why this is relevant to organization
  risk_created BOOLEAN DEFAULT 0,
  risk_id INTEGER, -- Linked risk if auto-created
  
  -- Compliance Impact
  compliance_frameworks_affected TEXT, -- JSON array ['SOC2', 'ISO27001', 'HIPAA']
  controls_affected TEXT, -- JSON array of control IDs
  
  -- Status
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'expired', 'remediated', 'not_applicable')),
  reviewed BOOLEAN DEFAULT 0,
  reviewed_by TEXT,
  reviewed_at DATETIME,
  
  -- Metadata
  organization_id INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (feed_id) REFERENCES threat_intelligence_feeds(id) ON DELETE CASCADE,
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE SET NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tii_feed ON threat_intelligence_items(feed_id);
CREATE INDEX IF NOT EXISTS idx_tii_severity ON threat_intelligence_items(severity);
CREATE INDEX IF NOT EXISTS idx_tii_relevance ON threat_intelligence_items(relevance_score);
CREATE INDEX IF NOT EXISTS idx_tii_status ON threat_intelligence_items(status);
CREATE INDEX IF NOT EXISTS idx_tii_risk ON threat_intelligence_items(risk_id);
CREATE INDEX IF NOT EXISTS idx_tii_published ON threat_intelligence_items(published_date);
CREATE INDEX IF NOT EXISTS idx_tii_org ON threat_intelligence_items(organization_id);
CREATE INDEX IF NOT EXISTS idx_tii_external ON threat_intelligence_items(external_id);

-- =============================================================================
-- 3. TI-RISK MAPPINGS (Link Threat Intelligence to Risks)
-- =============================================================================
CREATE TABLE IF NOT EXISTS ti_risk_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ti_item_id INTEGER NOT NULL,
  risk_id INTEGER NOT NULL,
  
  -- Mapping Type
  mapping_type TEXT CHECK(mapping_type IN ('auto_created', 'manual_link', 'score_adjustment', 'context_enrichment', 'mitigation_validation')),
  
  -- Impact on Risk
  impact_type TEXT CHECK(impact_type IN ('probability_increase', 'probability_decrease', 'impact_increase', 'impact_decrease', 'new_risk', 'risk_closed')),
  
  -- Risk Score Changes
  previous_probability INTEGER,
  new_probability INTEGER,
  previous_impact INTEGER,
  new_impact INTEGER,
  previous_score INTEGER,
  new_score INTEGER,
  
  -- AI Analysis
  confidence_score REAL DEFAULT 0.5 CHECK(confidence_score >= 0 AND confidence_score <= 1),
  ai_rationale TEXT, -- Why AI made this mapping
  ai_recommendations TEXT, -- JSON array of recommendations
  
  -- Compliance Context
  compliance_impact TEXT, -- Which frameworks/controls affected
  control_gaps_identified TEXT, -- JSON array
  
  -- Status
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'validated', 'rejected', 'expired')),
  validated_by TEXT,
  validated_at DATETIME,
  rejection_reason TEXT,
  
  -- Metadata
  organization_id INTEGER DEFAULT 1,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (ti_item_id) REFERENCES threat_intelligence_items(id) ON DELETE CASCADE,
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tirm_ti_item ON ti_risk_mappings(ti_item_id);
CREATE INDEX IF NOT EXISTS idx_tirm_risk ON ti_risk_mappings(risk_id);
CREATE INDEX IF NOT EXISTS idx_tirm_type ON ti_risk_mappings(mapping_type);
CREATE INDEX IF NOT EXISTS idx_tirm_status ON ti_risk_mappings(status);
CREATE INDEX IF NOT EXISTS idx_tirm_org ON ti_risk_mappings(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tirm_unique ON ti_risk_mappings(ti_item_id, risk_id) WHERE status = 'active';

-- =============================================================================
-- 4. TI-COMPLIANCE MAPPINGS (Link TI to Compliance Frameworks)
-- =============================================================================
CREATE TABLE IF NOT EXISTS ti_compliance_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ti_item_id INTEGER NOT NULL,
  
  -- Compliance Framework
  framework TEXT NOT NULL CHECK(framework IN ('SOC2', 'ISO27001', 'NIST_CSF', 'NIST_800-53', 'PCI_DSS', 'HIPAA', 'GDPR', 'CCPA', 'FedRAMP')),
  control_id TEXT NOT NULL,
  control_name TEXT,
  control_category TEXT,
  
  -- Relationship to Control
  relevance_type TEXT CHECK(relevance_type IN ('vulnerability', 'attack_vector', 'threat_scenario', 'control_gap', 'control_validation', 'remediation')),
  
  -- Impact Assessment
  impact_on_control TEXT CHECK(impact_on_control IN ('requires_implementation', 'requires_enhancement', 'currently_mitigated', 'gap_identified', 'control_ineffective')),
  current_control_effectiveness REAL, -- 0-1 scale
  required_control_effectiveness REAL, -- Target effectiveness
  effectiveness_gap REAL, -- Difference
  
  -- AI Analysis
  ai_recommendation TEXT,
  remediation_priority TEXT CHECK(remediation_priority IN ('critical', 'high', 'medium', 'low')),
  estimated_effort TEXT CHECK(estimated_effort IN ('hours', 'days', 'weeks', 'months')),
  estimated_cost TEXT, -- 'low', 'medium', 'high' or dollar amount
  
  -- Business Context
  business_justification TEXT,
  risk_reduction_impact TEXT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'addressed', 'accepted_risk', 'not_applicable')),
  addressed_date DATETIME,
  evidence_reference TEXT,
  
  -- Metadata
  organization_id INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (ti_item_id) REFERENCES threat_intelligence_items(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ticm_ti_item ON ti_compliance_mappings(ti_item_id);
CREATE INDEX IF NOT EXISTS idx_ticm_framework ON ti_compliance_mappings(framework);
CREATE INDEX IF NOT EXISTS idx_ticm_control ON ti_compliance_mappings(control_id);
CREATE INDEX IF NOT EXISTS idx_ticm_impact ON ti_compliance_mappings(impact_on_control);
CREATE INDEX IF NOT EXISTS idx_ticm_priority ON ti_compliance_mappings(remediation_priority);
CREATE INDEX IF NOT EXISTS idx_ticm_org ON ti_compliance_mappings(organization_id);

-- =============================================================================
-- 5. AI RISK ANALYSIS (AI-Generated Insights)
-- =============================================================================
CREATE TABLE IF NOT EXISTS ai_risk_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Analysis Target
  risk_id INTEGER,
  ti_item_id INTEGER,
  
  -- Analysis Type
  analysis_type TEXT CHECK(analysis_type IN ('risk_scoring', 'compliance_mapping', 'control_recommendation', 'threat_briefing', 'business_impact', 'vendor_risk')),
  
  -- AI Model Used
  ai_model TEXT NOT NULL, -- 'cloudflare-llama3', 'openai-gpt4', 'anthropic-claude'
  model_version TEXT,
  
  -- Analysis Results
  analysis_summary TEXT NOT NULL, -- Human-readable summary
  detailed_analysis TEXT, -- JSON object with full analysis
  confidence_score REAL DEFAULT 0.5 CHECK(confidence_score >= 0 AND confidence_score <= 1),
  confidence_reasoning TEXT,
  
  -- Recommendations
  recommendations TEXT, -- JSON array of actionable recommendations
  priority TEXT CHECK(priority IN ('critical', 'high', 'medium', 'low', 'info')),
  
  -- Compliance Impact
  compliance_impact TEXT, -- JSON object mapping frameworks to impacts
  affected_controls TEXT, -- JSON array
  control_gaps TEXT, -- JSON array
  
  -- Business Context
  business_impact_summary TEXT,
  financial_impact_estimate TEXT,
  operational_impact TEXT,
  reputational_impact TEXT,
  
  -- Technical Details
  technical_details TEXT, -- JSON object
  mitre_mapping TEXT, -- JSON array
  attack_scenarios TEXT, -- JSON array
  
  -- Performance Metrics
  processing_time_ms INTEGER,
  api_cost_usd REAL DEFAULT 0.0,
  tokens_used INTEGER DEFAULT 0,
  
  -- Validation
  validated BOOLEAN DEFAULT 0,
  validated_by TEXT,
  validated_at DATETIME,
  validation_notes TEXT,
  
  -- Metadata
  organization_id INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE,
  FOREIGN KEY (ti_item_id) REFERENCES threat_intelligence_items(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_aira_risk ON ai_risk_analysis(risk_id);
CREATE INDEX IF NOT EXISTS idx_aira_ti_item ON ai_risk_analysis(ti_item_id);
CREATE INDEX IF NOT EXISTS idx_aira_type ON ai_risk_analysis(analysis_type);
CREATE INDEX IF NOT EXISTS idx_aira_model ON ai_risk_analysis(ai_model);
CREATE INDEX IF NOT EXISTS idx_aira_priority ON ai_risk_analysis(priority);
CREATE INDEX IF NOT EXISTS idx_aira_created ON ai_risk_analysis(created_at);
CREATE INDEX IF NOT EXISTS idx_aira_org ON ai_risk_analysis(organization_id);

-- =============================================================================
-- 6. TI PROCESSING LOG (Audit Trail)
-- =============================================================================
CREATE TABLE IF NOT EXISTS ti_processing_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Processing Type
  processing_type TEXT NOT NULL CHECK(processing_type IN ('feed_poll', 'ai_analysis', 'risk_creation', 'risk_scoring', 'compliance_mapping', 'executive_briefing')),
  
  -- Status
  status TEXT NOT NULL CHECK(status IN ('started', 'in_progress', 'completed', 'failed', 'cancelled')),
  
  -- Metrics
  items_processed INTEGER DEFAULT 0,
  items_created INTEGER DEFAULT 0,
  items_updated INTEGER DEFAULT 0,
  items_skipped INTEGER DEFAULT 0,
  items_failed INTEGER DEFAULT 0,
  
  -- GRC Metrics
  risks_created INTEGER DEFAULT 0,
  risks_updated INTEGER DEFAULT 0,
  compliance_mappings_created INTEGER DEFAULT 0,
  ai_analyses_performed INTEGER DEFAULT 0,
  
  -- Details
  details TEXT, -- JSON object with processing details
  errors TEXT, -- JSON array of errors
  warnings TEXT, -- JSON array of warnings
  
  -- Performance
  processing_time_ms INTEGER,
  api_calls_made INTEGER DEFAULT 0,
  api_cost_usd REAL DEFAULT 0.0,
  
  -- Metadata
  organization_id INTEGER DEFAULT 1,
  initiated_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tipl_type ON ti_processing_log(processing_type);
CREATE INDEX IF NOT EXISTS idx_tipl_status ON ti_processing_log(status);
CREATE INDEX IF NOT EXISTS idx_tipl_created ON ti_processing_log(created_at);
CREATE INDEX IF NOT EXISTS idx_tipl_org ON ti_processing_log(organization_id);

-- =============================================================================
-- VIEWS FOR COMMON GRC QUERIES
-- =============================================================================

-- Active High-Priority Threats Affecting Compliance
CREATE VIEW IF NOT EXISTS v_active_compliance_threats AS
SELECT 
  tii.id,
  tii.threat_title,
  tii.severity,
  tii.relevance_score,
  tii.business_impact,
  tii.compliance_frameworks_affected,
  COUNT(DISTINCT ticm.id) as control_count,
  COUNT(DISTINCT tirm.risk_id) as linked_risks,
  tii.published_date,
  tii.status
FROM threat_intelligence_items tii
LEFT JOIN ti_compliance_mappings ticm ON tii.id = ticm.ti_item_id
LEFT JOIN ti_risk_mappings tirm ON tii.id = tirm.ti_item_id
WHERE tii.status = 'active' 
  AND tii.severity IN ('high', 'critical')
  AND tii.relevance_score >= 0.7
GROUP BY tii.id
ORDER BY tii.severity DESC, tii.relevance_score DESC;

-- Risk Register Enhanced with Threat Intelligence
CREATE VIEW IF NOT EXISTS v_risks_with_ti_context AS
SELECT 
  r.id as risk_id,
  r.title as risk_title,
  r.category,
  r.probability,
  r.impact,
  r.risk_score,
  r.status,
  COUNT(DISTINCT tirm.ti_item_id) as linked_threats,
  MAX(tii.severity) as max_threat_severity,
  AVG(tii.relevance_score) as avg_threat_relevance,
  MAX(tii.published_date) as latest_threat_date,
  GROUP_CONCAT(DISTINCT tii.threat_title, '; ') as threat_titles
FROM risks r
LEFT JOIN ti_risk_mappings tirm ON r.id = tirm.risk_id AND tirm.status = 'active'
LEFT JOIN threat_intelligence_items tii ON tirm.ti_item_id = tii.id
GROUP BY r.id;

-- Compliance Framework Threat Exposure
CREATE VIEW IF NOT EXISTS v_framework_threat_exposure AS
SELECT 
  ticm.framework,
  ticm.control_id,
  ticm.control_name,
  COUNT(DISTINCT ticm.ti_item_id) as threat_count,
  COUNT(CASE WHEN tii.severity = 'critical' THEN 1 END) as critical_threats,
  COUNT(CASE WHEN tii.severity = 'high' THEN 1 END) as high_threats,
  AVG(CASE WHEN ticm.current_control_effectiveness IS NOT NULL THEN ticm.current_control_effectiveness END) as avg_effectiveness,
  COUNT(CASE WHEN ticm.impact_on_control = 'gap_identified' THEN 1 END) as gaps_identified,
  MAX(tii.published_date) as latest_threat
FROM ti_compliance_mappings ticm
JOIN threat_intelligence_items tii ON ticm.ti_item_id = tii.id
WHERE tii.status = 'active'
GROUP BY ticm.framework, ticm.control_id
ORDER BY threat_count DESC, critical_threats DESC;

-- =============================================================================
-- SEED DATA - Sample TI Sources and Items
-- =============================================================================

-- First, ensure default organization exists for foreign key constraints
INSERT OR IGNORE INTO organizations (id, name, type, industry, is_active, created_at) 
VALUES (1, 'Default Organization', 'enterprise', 'technology', 1, CURRENT_TIMESTAMP);

-- Sample TI Feed (CISA Known Exploited Vulnerabilities)
INSERT OR IGNORE INTO threat_intelligence_feeds (
  id, feed_name, feed_url, feed_type, description, 
  polling_interval, status, reliability_rating, auto_create_risks
) VALUES (
  1,
  'CISA Known Exploited Vulnerabilities',
  'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
  'cisa_kev',
  'CISA catalog of known exploited vulnerabilities requiring immediate action',
  86400, -- Daily polling
  'active',
  'verified',
  1
);

-- Sample TI Feed (NIST NVD)
INSERT OR IGNORE INTO threat_intelligence_feeds (
  id, feed_name, feed_url, feed_type, description,
  polling_interval, status, reliability_rating, auto_create_risks, relevance_threshold
) VALUES (
  2,
  'NIST National Vulnerability Database',
  'https://services.nvd.nist.gov/rest/json/cves/2.0',
  'nist_nvd',
  'Comprehensive vulnerability database from NIST',
  86400, -- Daily polling
  'active',
  'verified',
  0, -- Don't auto-create from everything, too noisy
  0.8 -- Higher threshold for NVD
);

-- Sample TI Item (Demonstrating GRC focus)
INSERT OR IGNORE INTO threat_intelligence_items (
  id, feed_id, external_id, threat_title, threat_description, threat_type, severity,
  business_impact, affected_sectors, affected_technologies,
  cve_ids, mitre_techniques, cvss_score,
  published_date, relevance_score, relevance_reasoning,
  compliance_frameworks_affected, controls_affected, status
) VALUES (
  1,
  1,
  'CVE-2024-DEMO',
  'Critical Remote Code Execution in Popular Web Framework',
  'A critical vulnerability allows unauthenticated remote code execution in widely-used web application framework. Actively exploited in the wild.',
  'vulnerability',
  'critical',
  'Potential compromise of web applications, data breach, system takeover. Average cost of breach: $4.5M',
  '["healthcare", "finance", "retail", "technology"]',
  '["Web Servers", "Application Servers", "Cloud Infrastructure"]',
  '["CVE-2024-DEMO"]',
  '["T1190", "T1068", "T1059"]',
  9.8,
  '2024-10-01 00:00:00',
  0.95,
  'High relevance: Organization uses affected framework, publicly accessible web applications, active exploitation confirmed',
  '["SOC2", "ISO27001", "PCI_DSS"]',
  '["CC6.1", "CC7.2", "A.12.6.1", "A.18.2.3", "6.2"]',
  'active'
);

-- Sample TI-Risk Mapping
INSERT OR IGNORE INTO ti_risk_mappings (
  ti_item_id, risk_id, mapping_type, impact_type,
  previous_probability, new_probability, previous_impact, new_impact,
  previous_score, new_score, confidence_score, ai_rationale
) VALUES (
  1, NULL, 'auto_created', 'new_risk',
  NULL, 5, NULL, 4, NULL, 20,
  0.95,
  'Critical severity CVE with active exploitation, high organizational relevance (0.95), affects publicly accessible systems. Recommended immediate risk creation.'
);

-- Sample TI-Compliance Mapping
INSERT OR IGNORE INTO ti_compliance_mappings (
  ti_item_id, framework, control_id, control_name, relevance_type,
  impact_on_control, current_control_effectiveness, required_control_effectiveness,
  effectiveness_gap, ai_recommendation, remediation_priority
) VALUES (
  1, 'SOC2', 'CC7.2', 'System Monitoring and Intrusion Detection',
  'vulnerability',
  'gap_identified',
  0.60, 0.90, 0.30,
  'Current vulnerability management insufficient for critical RCE vulnerabilities. Recommend: 1) Emergency patch deployment, 2) WAF rules implementation, 3) Enhanced monitoring for exploitation attempts.',
  'critical'
);

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================

-- Summary of changes:
-- ✅ 6 simplified tables (vs 10 operational TI tables)
-- ✅ GRC-focused schema (risk management, not SOC operations)
-- ✅ Compliance mapping built-in
-- ✅ AI analysis for business context
-- ✅ Audit trail for all processing
-- ✅ Sample data demonstrating GRC workflow
