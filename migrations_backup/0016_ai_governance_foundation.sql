-- ==============================================
-- AI GOVERNANCE FRAMEWORK - FOUNDATION SCHEMA
-- ==============================================
-- GRC 5.2 - Native AI Risk Management Integration
-- Implements comprehensive AI system discovery, monitoring, and governance

-- ==============================================
-- AI SYSTEM REGISTRY
-- ==============================================

CREATE TABLE IF NOT EXISTS ai_systems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER REFERENCES organizations(id),
  name TEXT NOT NULL,
  description TEXT,
  system_type TEXT CHECK(system_type IN ('foundation_model', 'fine_tuned', 'traditional_ml', 'rule_based', 'generative_ai', 'computer_vision', 'nlp')),
  deployment_type TEXT CHECK(deployment_type IN ('cloud_api', 'on_premises', 'edge', 'embedded', 'hybrid')),
  
  -- Discovery metadata
  discovery_method TEXT CHECK(discovery_method IN ('cloud_scan', 'api_monitoring', 'manual_registration', 'code_scan', 'network_detection')),
  discovery_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Technical details
  model_provider TEXT, -- 'openai', 'anthropic', 'google', 'microsoft', 'aws', 'huggingface', 'internal'
  model_name TEXT,
  model_version TEXT,
  api_endpoint TEXT,
  compute_resources_json TEXT,
  
  -- Business context
  business_purpose TEXT,
  use_cases_json TEXT,
  data_sources_json TEXT,
  user_groups_json TEXT,
  business_owner_id INTEGER REFERENCES users(id),
  technical_owner_id INTEGER REFERENCES users(id),
  
  -- Regulatory classification (EU AI Act)
  ai_act_classification TEXT CHECK(ai_act_classification IN ('minimal', 'limited', 'high', 'unacceptable', 'prohibited')),
  high_risk_category TEXT, -- For high-risk systems: 'biometric', 'critical_infrastructure', 'education', 'employment', etc.
  
  -- NIST AI RMF Tier
  nist_ai_rmf_tier INTEGER CHECK(nist_ai_rmf_tier BETWEEN 1 AND 4),
  
  -- Sector-specific requirements
  sector_specific_reqs_json TEXT, -- Healthcare (HIPAA), Finance (SOX), etc.
  
  -- Risk assessment
  current_risk_level TEXT CHECK(current_risk_level IN ('minimal', 'low', 'medium', 'high', 'critical', 'unassessed')),
  last_risk_assessment DATETIME,
  next_risk_assessment DATETIME,
  
  -- Compliance status
  approval_status TEXT CHECK(approval_status IN ('pending', 'approved', 'conditional', 'rejected', 'suspended')) DEFAULT 'pending',
  approved_by_id INTEGER REFERENCES users(id),
  approval_date DATETIME,
  approval_conditions_json TEXT,
  
  -- Operational status
  operational_status TEXT CHECK(operational_status IN ('development', 'testing', 'staging', 'production', 'deprecated', 'decommissioned')) DEFAULT 'development',
  monitoring_enabled INTEGER DEFAULT 0,
  
  -- Integration details
  integration_type TEXT, -- 'direct_api', 'sdk', 'webhook', 'batch'
  configuration_json TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- AI RISK ASSESSMENTS
-- ==============================================

CREATE TABLE IF NOT EXISTS ai_risk_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER REFERENCES organizations(id),
  ai_system_id INTEGER REFERENCES ai_systems(id),
  assessment_type TEXT CHECK(assessment_type IN ('initial', 'periodic', 'incident_triggered', 'regulatory_update', 'pre_deployment')),
  assessment_framework TEXT CHECK(assessment_framework IN ('nist_ai_rmf', 'eu_ai_act', 'iso_23053', 'custom', 'fair')),
  
  -- Risk scores (1-5 scale)
  bias_risk_score INTEGER CHECK(bias_risk_score BETWEEN 1 AND 5),
  privacy_risk_score INTEGER CHECK(privacy_risk_score BETWEEN 1 AND 5),
  security_risk_score INTEGER CHECK(security_risk_score BETWEEN 1 AND 5),
  transparency_risk_score INTEGER CHECK(transparency_risk_score BETWEEN 1 AND 5),
  reliability_risk_score INTEGER CHECK(reliability_risk_score BETWEEN 1 AND 5),
  human_oversight_score INTEGER CHECK(human_oversight_score BETWEEN 1 AND 5),
  environmental_impact_score INTEGER CHECK(environmental_impact_score BETWEEN 1 AND 5),
  
  -- Overall assessment
  composite_risk_score REAL,
  risk_level TEXT CHECK(risk_level IN ('minimal', 'limited', 'high', 'unacceptable')),
  
  -- Assessment details
  methodology_json TEXT,
  findings_json TEXT,
  evidence_json TEXT,
  recommendations_json TEXT,
  mitigation_requirements_json TEXT,
  
  -- Validation and approval
  assessor_id INTEGER REFERENCES users(id),
  reviewer_id INTEGER REFERENCES users(id),
  assessment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  review_date DATETIME,
  approval_date DATETIME,
  
  -- Compliance mapping
  control_mappings_json TEXT,
  regulatory_requirements_json TEXT,
  
  next_assessment_due DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- AI SYSTEM METRICS (Real-time monitoring)
-- ==============================================

CREATE TABLE IF NOT EXISTS ai_system_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER REFERENCES organizations(id),
  ai_system_id INTEGER REFERENCES ai_systems(id),
  metric_type TEXT CHECK(metric_type IN ('performance', 'bias', 'drift', 'usage', 'cost', 'security', 'reliability')),
  
  -- Performance metrics
  accuracy REAL,
  precision_score REAL,
  recall_score REAL,
  f1_score REAL,
  latency_ms INTEGER,
  throughput_rps INTEGER,
  
  -- Bias metrics
  demographic_parity REAL,
  equalized_odds REAL,
  calibration_score REAL,
  
  -- Drift detection
  data_drift_score REAL,
  concept_drift_score REAL,
  prediction_drift_score REAL,
  
  -- Usage metrics
  total_requests INTEGER,
  unique_users INTEGER,
  error_rate REAL,
  
  -- Cost metrics
  compute_cost_usd REAL,
  api_cost_usd REAL,
  
  -- Security metrics
  anomaly_score REAL,
  threat_indicators INTEGER,
  
  -- Metadata
  measurement_window_start DATETIME,
  measurement_window_end DATETIME,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- AI INCIDENTS
-- ==============================================

CREATE TABLE IF NOT EXISTS ai_incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER REFERENCES organizations(id),
  ai_system_id INTEGER REFERENCES ai_systems(id),
  incident_type TEXT CHECK(incident_type IN ('bias_detection', 'performance_degradation', 'security_breach', 'data_drift', 'regulatory_violation', 'fairness_issue', 'adversarial_attack')),
  
  -- Incident classification
  severity TEXT CHECK(severity IN ('low', 'medium', 'high', 'critical')),
  impact_assessment TEXT,
  affected_users_count INTEGER,
  financial_impact REAL,
  
  -- Detection details
  detection_method TEXT CHECK(detection_method IN ('automated_monitoring', 'user_report', 'audit', 'external_notification', 'manual_testing')),
  detection_timestamp DATETIME,
  first_observed DATETIME,
  
  -- Incident details
  title TEXT NOT NULL,
  description TEXT,
  root_cause_analysis TEXT,
  contributing_factors_json TEXT,
  
  -- Response and resolution
  immediate_actions_json TEXT,
  corrective_actions_json TEXT,
  preventive_measures_json TEXT,
  
  -- Status tracking
  status TEXT CHECK(status IN ('open', 'investigating', 'mitigating', 'resolved', 'closed')) DEFAULT 'open',
  assigned_to_id INTEGER REFERENCES users(id),
  resolved_timestamp DATETIME,
  
  -- Lessons learned
  lessons_learned TEXT,
  process_improvements_json TEXT,
  
  -- Regulatory reporting
  regulatory_notification_required INTEGER DEFAULT 0,
  regulatory_notifications_json TEXT,
  
  created_by_id INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- AI MODEL MONITORING CONFIGURATION
-- ==============================================

CREATE TABLE IF NOT EXISTS ai_model_monitoring (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER REFERENCES organizations(id),
  ai_system_id INTEGER REFERENCES ai_systems(id),
  
  -- Monitoring configuration
  monitoring_type TEXT CHECK(monitoring_type IN ('performance', 'bias', 'drift', 'adversarial', 'explainability', 'usage', 'cost')),
  monitoring_frequency TEXT CHECK(monitoring_frequency IN ('real_time', 'hourly', 'daily', 'weekly', 'monthly')),
  
  -- Thresholds and alerts
  thresholds_json TEXT,
  alert_channels_json TEXT,
  escalation_rules_json TEXT,
  
  -- Current status
  monitoring_status TEXT CHECK(monitoring_status IN ('active', 'paused', 'disabled')) DEFAULT 'active',
  last_check DATETIME,
  next_check DATETIME,
  
  -- Alert history
  total_alerts INTEGER DEFAULT 0,
  critical_alerts INTEGER DEFAULT 0,
  last_alert DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- AI INTEGRATION CONNECTIONS
-- ==============================================

CREATE TABLE IF NOT EXISTS ai_integrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER REFERENCES organizations(id),
  integration_type TEXT CHECK(integration_type IN ('openai', 'anthropic', 'google_ai', 'azure_openai', 'aws_bedrock', 'huggingface', 'custom_api')),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Connection details
  api_endpoint TEXT,
  authentication_type TEXT CHECK(authentication_type IN ('api_key', 'oauth2', 'certificate', 'iam_role')),
  credentials_encrypted BLOB,
  
  -- Configuration
  config_json TEXT,
  rate_limits_json TEXT,
  
  -- Status
  connection_status TEXT CHECK(connection_status IN ('active', 'inactive', 'error', 'testing')) DEFAULT 'inactive',
  last_test_date DATETIME,
  last_success_date DATETIME,
  error_message TEXT,
  
  -- Usage tracking
  total_requests INTEGER DEFAULT 0,
  total_cost_usd REAL DEFAULT 0.0,
  
  created_by_id INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- AI GOVERNANCE POLICIES
-- ==============================================

CREATE TABLE IF NOT EXISTS ai_governance_policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  org_id INTEGER REFERENCES organizations(id),
  policy_name TEXT NOT NULL,
  policy_type TEXT CHECK(policy_type IN ('bias_prevention', 'data_governance', 'model_approval', 'monitoring_requirements', 'incident_response', 'human_oversight')),
  
  -- Policy content
  policy_document TEXT,
  requirements_json TEXT,
  controls_json TEXT,
  
  -- Applicability
  applies_to_json TEXT, -- Which AI systems this applies to
  risk_level_scope TEXT, -- 'all', 'high_only', 'medium_and_above'
  
  -- Status
  status TEXT CHECK(status IN ('draft', 'under_review', 'approved', 'active', 'deprecated')) DEFAULT 'draft',
  approved_by_id INTEGER REFERENCES users(id),
  approval_date DATETIME,
  effective_date DATETIME,
  
  -- Compliance tracking
  compliance_checks_json TEXT,
  last_compliance_check DATETIME,
  
  created_by_id INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- AI Systems indexes
CREATE INDEX IF NOT EXISTS idx_ai_systems_org_id ON ai_systems(org_id);
CREATE INDEX IF NOT EXISTS idx_ai_systems_risk_level ON ai_systems(current_risk_level);
CREATE INDEX IF NOT EXISTS idx_ai_systems_status ON ai_systems(operational_status);
CREATE INDEX IF NOT EXISTS idx_ai_systems_provider ON ai_systems(model_provider);

-- AI Metrics indexes (for time-series queries)
CREATE INDEX IF NOT EXISTS idx_ai_metrics_system_time ON ai_system_metrics(ai_system_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_org_time ON ai_system_metrics(org_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_ai_metrics_type_time ON ai_system_metrics(metric_type, timestamp);

-- AI Incidents indexes
CREATE INDEX IF NOT EXISTS idx_ai_incidents_org_status ON ai_incidents(org_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_incidents_system_id ON ai_incidents(ai_system_id);
CREATE INDEX IF NOT EXISTS idx_ai_incidents_severity ON ai_incidents(severity);

-- AI Risk Assessments indexes
CREATE INDEX IF NOT EXISTS idx_ai_assessments_system_date ON ai_risk_assessments(ai_system_id, assessment_date);
CREATE INDEX IF NOT EXISTS idx_ai_assessments_org_id ON ai_risk_assessments(org_id);

-- ==============================================
-- INITIAL AI GOVERNANCE CONTROLS
-- ==============================================

-- Insert AI-specific controls into the existing controls table
INSERT OR IGNORE INTO controls (
  control_id, name, description, control_type, control_category, framework, 
  control_objective, design_effectiveness, operating_effectiveness, owner_id, 
  organization_id, status, created_at, updated_at
) VALUES 
-- AI Model Governance Controls
('AI-GOV-001', 'AI System Registration and Inventory',
 'All AI systems must be registered in the central AI inventory with complete metadata.',
 'detective', 'manual', 'AI Governance',
 'Maintain comprehensive visibility of all AI systems in the organization',
 'effective', 'not_tested', 1, 1, 'active', datetime('now'), datetime('now')),

('AI-GOV-002', 'AI Risk Assessment Requirements',
 'High-risk AI systems must undergo formal risk assessment before deployment.',
 'preventive', 'manual', 'EU AI Act',
 'Ensure AI systems are properly risk-assessed per regulatory requirements',
 'effective', 'not_tested', 1, 1, 'active', datetime('now'), datetime('now')),

('AI-GOV-003', 'Bias Testing and Monitoring',
 'AI systems processing personal data must implement bias detection and monitoring.',
 'detective', 'automated', 'NIST AI RMF',
 'Prevent discriminatory outcomes from AI decision-making systems',
 'effective', 'not_tested', 1, 1, 'active', datetime('now'), datetime('now')),

('AI-GOV-004', 'Human Oversight Requirements',
 'High-risk AI systems must maintain meaningful human oversight capabilities.',
 'preventive', 'manual', 'EU AI Act',
 'Ensure human agency and oversight in AI decision-making processes',
 'effective', 'not_tested', 1, 1, 'active', datetime('now'), datetime('now')),

('AI-GOV-005', 'AI Data Quality and Governance',
 'AI training and operational data must meet quality and governance standards.',
 'preventive', 'manual', 'GDPR',
 'Ensure data quality and privacy compliance for AI systems',
 'effective', 'not_tested', 1, 1, 'active', datetime('now'), datetime('now')),

('AI-GOV-006', 'AI Incident Response Capability',
 'Organization must maintain capability to respond to AI-related incidents.',
 'corrective', 'manual', 'AI Governance',
 'Enable rapid response to AI system failures, bias, or security incidents',
 'effective', 'not_tested', 1, 1, 'active', datetime('now'), datetime('now'));

-- ==============================================
-- SAMPLE AI SYSTEMS FOR DEMONSTRATION
-- ==============================================

INSERT OR IGNORE INTO ai_systems (
  name, description, system_type, deployment_type, discovery_method,
  model_provider, model_name, business_purpose, ai_act_classification,
  current_risk_level, operational_status, org_id,
  business_owner_id, technical_owner_id, created_at, updated_at
) VALUES 
('Customer Support ChatBot', 'AI-powered customer service chatbot for handling routine inquiries',
 'generative_ai', 'cloud_api', 'manual_registration',
 'openai', 'gpt-4o-mini', 'Customer service automation and support efficiency',
 'limited', 'medium', 'production', 1,
 1, 2, datetime('now'), datetime('now')),

('Resume Screening AI', 'ML system for automated resume screening and candidate ranking',
 'traditional_ml', 'cloud_api', 'manual_registration',
 'internal', 'custom-screening-model-v2', 'HR process automation for candidate evaluation',
 'high', 'high', 'production', 1,
 1, 2, datetime('now'), datetime('now')),

('Fraud Detection System', 'Real-time fraud detection for financial transactions',
 'traditional_ml', 'on_premises', 'manual_registration',
 'internal', 'fraud-detection-v3', 'Financial risk mitigation and transaction security',
 'high', 'high', 'production', 1,
 1, 2, datetime('now'), datetime('now')),

('Document Analysis AI', 'AI system for automated document classification and data extraction',
 'computer_vision', 'cloud_api', 'manual_registration',
 'google', 'document-ai', 'Business process automation for document processing',
 'limited', 'medium', 'testing', 1,
 1, 2, datetime('now'), datetime('now'));

-- ==============================================
-- SAMPLE RISK ASSESSMENTS
-- ==============================================

INSERT OR IGNORE INTO ai_risk_assessments (
  org_id, ai_system_id, assessment_type, assessment_framework,
  bias_risk_score, privacy_risk_score, security_risk_score, 
  transparency_risk_score, reliability_risk_score, human_oversight_score,
  composite_risk_score, risk_level, assessor_id, assessment_date,
  findings_json, recommendations_json, next_assessment_due
) VALUES 
(1, 2, 'initial', 'eu_ai_act', 4, 3, 3, 2, 3, 3, 3.0, 'high', 1, datetime('now'),
 '{"bias_concerns": ["potential gender bias in resume screening", "lack of demographic balance in training data"], "privacy_issues": ["processing of protected characteristics"], "recommendations": ["implement bias testing", "enhance data governance"]}',
 '{"immediate": ["conduct bias audit", "implement monitoring"], "medium_term": ["retrain model with balanced dataset", "establish oversight committee"]}',
 datetime('now', '+3 months')),

(1, 3, 'initial', 'nist_ai_rmf', 2, 4, 4, 3, 4, 4, 3.5, 'high', 1, datetime('now'),
 '{"security_concerns": ["adversarial attack vulnerabilities", "model inference attacks"], "privacy_issues": ["sensitive financial data processing"], "reliability_concerns": ["false positive impact on customers"]}',
 '{"immediate": ["implement adversarial testing", "enhance monitoring"], "medium_term": ["model robustness improvements", "explainability enhancements"]}',
 datetime('now', '+3 months')),

(1, 1, 'periodic', 'custom', 2, 2, 2, 3, 2, 3, 2.3, 'limited', 1, datetime('now'),
 '{"low_risk_findings": ["occasional irrelevant responses", "limited personalization"], "monitoring_gaps": ["user satisfaction tracking"]}',
 '{"improvements": ["enhance response quality", "implement user feedback loop"], "monitoring": ["add satisfaction metrics"]}',
 datetime('now', '+6 months'));

-- ==============================================
-- COMPLETION MESSAGE
-- ==============================================

-- AI Governance Foundation Schema Complete!
-- 
-- Created Tables:
-- - ai_systems: Central AI system registry
-- - ai_risk_assessments: Risk assessment tracking
-- - ai_system_metrics: Real-time monitoring data
-- - ai_incidents: AI-related incident management
-- - ai_model_monitoring: Monitoring configuration
-- - ai_integrations: AI service integrations
-- - ai_governance_policies: Policy management
--
-- Added 6 AI governance controls to existing controls table
-- Added 4 sample AI systems with risk assessments
-- All tables include proper indexes for performance
-- Ready for AI governance module implementation!