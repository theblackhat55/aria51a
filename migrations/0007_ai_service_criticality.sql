-- AI Service Criticality Assessment Database Schema
-- This migration adds tables and columns to support AI-driven service criticality assessment

-- Add criticality assessment history table
CREATE TABLE IF NOT EXISTS service_criticality_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  calculated_criticality TEXT CHECK(calculated_criticality IN ('Critical', 'High', 'Medium', 'Low')) NOT NULL,
  criticality_score INTEGER CHECK(criticality_score >= 0 AND criticality_score <= 100) NOT NULL,
  confidence_level REAL CHECK(confidence_level >= 0 AND confidence_level <= 1) NOT NULL,
  
  -- Store JSON objects for complex data
  contributing_factors TEXT NOT NULL, -- JSON: CIA, asset deps, risks, business, technical, historical scores
  recommendations TEXT NOT NULL,      -- JSON: array of recommendation strings
  reassessment_triggers TEXT NOT NULL, -- JSON: array of trigger condition strings
  
  last_assessment DATETIME NOT NULL,
  next_assessment_due DATETIME NOT NULL,
  
  -- Audit fields
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key constraint
  FOREIGN KEY (service_id) REFERENCES assets_enhanced(asset_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_service_assessments_service_id ON service_criticality_assessments(service_id);
CREATE INDEX IF NOT EXISTS idx_service_assessments_criticality ON service_criticality_assessments(calculated_criticality);
CREATE INDEX IF NOT EXISTS idx_service_assessments_score ON service_criticality_assessments(criticality_score DESC);
CREATE INDEX IF NOT EXISTS idx_service_assessments_next_due ON service_criticality_assessments(next_assessment_due);

-- Service-Asset relationship table for dependency tracking
CREATE TABLE IF NOT EXISTS service_asset_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  relationship_type TEXT DEFAULT 'depends_on' CHECK(relationship_type IN ('depends_on', 'supports', 'contains', 'integrates_with')),
  dependency_strength TEXT DEFAULT 'medium' CHECK(dependency_strength IN ('critical', 'high', 'medium', 'low')),
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  
  -- Unique constraint to prevent duplicate relationships
  UNIQUE(service_id, asset_id, relationship_type),
  
  -- Foreign key constraints
  FOREIGN KEY (service_id) REFERENCES assets_enhanced(asset_id),
  FOREIGN KEY (asset_id) REFERENCES assets_enhanced(asset_id)
);

-- Add indexes for service-asset relationships
CREATE INDEX IF NOT EXISTS idx_service_asset_links_service ON service_asset_links(service_id);
CREATE INDEX IF NOT EXISTS idx_service_asset_links_asset ON service_asset_links(asset_id);
CREATE INDEX IF NOT EXISTS idx_service_asset_links_strength ON service_asset_links(dependency_strength);

-- Service-Risk relationship table for risk correlation
CREATE TABLE IF NOT EXISTS service_risk_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  risk_id INTEGER NOT NULL,
  relationship_type TEXT DEFAULT 'affects' CHECK(relationship_type IN ('affects', 'threatens', 'impacts', 'degrades')),
  impact_level TEXT DEFAULT 'medium' CHECK(impact_level IN ('critical', 'high', 'medium', 'low')),
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  
  -- Unique constraint to prevent duplicate relationships
  UNIQUE(service_id, risk_id, relationship_type),
  
  -- Foreign key constraints
  FOREIGN KEY (service_id) REFERENCES assets_enhanced(asset_id),
  FOREIGN KEY (risk_id) REFERENCES risks(id)
);

-- Add indexes for service-risk relationships
CREATE INDEX IF NOT EXISTS idx_service_risk_links_service ON service_risk_links(service_id);
CREATE INDEX IF NOT EXISTS idx_service_risk_links_risk ON service_risk_links(risk_id);
CREATE INDEX IF NOT EXISTS idx_service_risk_links_impact ON service_risk_links(impact_level);

-- Add additional columns to assets_enhanced table for AI criticality features
ALTER TABLE assets_enhanced ADD COLUMN criticality_reason TEXT;
ALTER TABLE assets_enhanced ADD COLUMN rto_hours INTEGER DEFAULT 24; -- Recovery Time Objective in hours
ALTER TABLE assets_enhanced ADD COLUMN rpo_hours INTEGER DEFAULT 24; -- Recovery Point Objective in hours
ALTER TABLE assets_enhanced ADD COLUMN sla_percentage REAL DEFAULT 99.0; -- Service Level Agreement uptime %
ALTER TABLE assets_enhanced ADD COLUMN business_function TEXT DEFAULT 'General Operations';
ALTER TABLE assets_enhanced ADD COLUMN user_impact_scope TEXT DEFAULT 'Internal' CHECK(user_impact_scope IN ('Public', 'Customer', 'Partner', 'Internal', 'Limited'));
ALTER TABLE assets_enhanced ADD COLUMN revenue_impact TEXT DEFAULT 'None' CHECK(revenue_impact IN ('Direct', 'Indirect', 'Support', 'None'));

-- ML model storage table for criticality assessment models
CREATE TABLE IF NOT EXISTS ml_criticality_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_id TEXT UNIQUE NOT NULL,
  model_name TEXT NOT NULL,
  algorithm_type TEXT CHECK(algorithm_type IN ('random_forest', 'neural_network', 'gradient_boosting', 'ensemble')) NOT NULL,
  model_version TEXT NOT NULL,
  
  -- Model performance metrics
  accuracy_score REAL CHECK(accuracy_score >= 0 AND accuracy_score <= 1),
  precision_score REAL CHECK(precision_score >= 0 AND precision_score <= 1),
  recall_score REAL CHECK(recall_score >= 0 AND recall_score <= 1),
  f1_score REAL CHECK(f1_score >= 0 AND f1_score <= 1),
  
  -- Model metadata
  training_features TEXT NOT NULL,    -- JSON: array of feature names
  feature_importance TEXT,            -- JSON: feature importance scores
  hyperparameters TEXT,              -- JSON: model hyperparameters
  training_data_size INTEGER,
  
  -- Model lifecycle
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'deprecated', 'testing')),
  last_trained DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add index for ML models
CREATE INDEX IF NOT EXISTS idx_ml_models_status ON ml_criticality_models(status);
CREATE INDEX IF NOT EXISTS idx_ml_models_version ON ml_criticality_models(model_version);

-- Criticality assessment audit log for tracking changes
CREATE TABLE IF NOT EXISTS criticality_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  event_type TEXT CHECK(event_type IN ('assessment', 'manual_override', 'batch_update', 'model_update')) NOT NULL,
  
  old_criticality TEXT,
  new_criticality TEXT,
  old_score INTEGER,
  new_score INTEGER,
  
  change_reason TEXT,
  changed_by TEXT,
  model_version TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (service_id) REFERENCES assets_enhanced(asset_id)
);

-- Add indexes for audit log
CREATE INDEX IF NOT EXISTS idx_audit_log_service ON criticality_audit_log(service_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_event_type ON criticality_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON criticality_audit_log(created_at DESC);

-- Criticality thresholds configuration table
CREATE TABLE IF NOT EXISTS criticality_thresholds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  criticality_level TEXT UNIQUE CHECK(criticality_level IN ('Critical', 'High', 'Medium', 'Low')) NOT NULL,
  min_score INTEGER CHECK(min_score >= 0 AND min_score <= 100) NOT NULL,
  max_score INTEGER CHECK(max_score >= 0 AND max_score <= 100) NOT NULL,
  
  -- Associated actions and requirements
  required_actions TEXT,              -- JSON: array of required actions
  monitoring_requirements TEXT,       -- JSON: monitoring specifications
  escalation_procedures TEXT,         -- JSON: escalation procedures
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  CHECK(min_score <= max_score)
);

-- Insert default criticality thresholds
INSERT OR IGNORE INTO criticality_thresholds (criticality_level, min_score, max_score, required_actions, monitoring_requirements, escalation_procedures) VALUES
('Critical', 85, 100, 
 '["24/7 monitoring", "Immediate incident response", "Executive notification", "Disaster recovery testing"]',
 '{"uptime_sla": 99.99, "response_time_max": "< 1 second", "monitoring_interval": "real-time"}',
 '["CTO notification within 5 minutes", "Emergency response team activation", "Customer communication within 15 minutes"]'
),
('High', 65, 84,
 '["Business hours monitoring", "Incident response procedures", "Management notification", "Regular backups"]', 
 '{"uptime_sla": 99.9, "response_time_max": "< 2 seconds", "monitoring_interval": "1 minute"}',
 '["Manager notification within 15 minutes", "Technical team activation", "Stakeholder updates"]'
),
('Medium', 40, 64,
 '["Standard monitoring", "Documented procedures", "Regular maintenance", "Backup verification"]',
 '{"uptime_sla": 99.5, "response_time_max": "< 5 seconds", "monitoring_interval": "5 minutes"}', 
 '["Team lead notification within 30 minutes", "Standard response procedures"]'
),
('Low', 0, 39,
 '["Basic monitoring", "Standard maintenance", "Periodic reviews"]',
 '{"uptime_sla": 99.0, "response_time_max": "< 10 seconds", "monitoring_interval": "15 minutes"}',
 '["Team notification within 1 hour", "Standard procedures"]'
);

-- Service criticality calculation weights configuration
CREATE TABLE IF NOT EXISTS criticality_weights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  factor_name TEXT UNIQUE NOT NULL,
  weight_percentage REAL CHECK(weight_percentage >= 0 AND weight_percentage <= 100) NOT NULL,
  description TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default weights for criticality calculation
INSERT OR IGNORE INTO criticality_weights (factor_name, weight_percentage, description) VALUES
('cia_impact', 40.0, 'Confidentiality, Integrity, Availability impact scores'),
('asset_dependencies', 25.0, 'Number and criticality of dependent assets'),
('risk_associations', 20.0, 'Associated risks and their severity levels'),
('business_impact', 10.0, 'Business function importance and user impact'),
('technical_requirements', 3.0, 'RTO, RPO, and SLA requirements'),
('historical_patterns', 2.0, 'Historical incidents and performance');

-- Create view for comprehensive service criticality overview
CREATE VIEW IF NOT EXISTS service_criticality_overview AS
SELECT 
  ae.asset_id,
  ae.name as service_name,
  ae.criticality as current_criticality,
  ae.business_function,
  ae.rto_hours,
  ae.rpo_hours,
  ae.sla_percentage,
  
  -- Latest AI assessment
  sca.criticality_score as ai_score,
  sca.calculated_criticality as ai_criticality,
  sca.confidence_level,
  sca.last_assessment,
  sca.next_assessment_due,
  
  -- Dependency counts
  (SELECT COUNT(*) FROM service_asset_links sal WHERE sal.service_id = ae.asset_id) as dependency_count,
  (SELECT COUNT(*) FROM service_asset_links sal 
   JOIN assets_enhanced ae2 ON sal.asset_id = ae2.asset_id 
   WHERE sal.service_id = ae.asset_id AND ae2.criticality = 'Critical') as critical_dependencies,
  
  -- Risk associations
  (SELECT COUNT(*) FROM service_risk_links srl WHERE srl.service_id = ae.asset_id) as associated_risks,
  (SELECT COUNT(*) FROM service_risk_links srl 
   JOIN risks r ON srl.risk_id = r.id 
   WHERE srl.service_id = ae.asset_id AND r.severity IN ('High', 'Critical')) as high_severity_risks,
  
  ae.created_at,
  ae.updated_at

FROM assets_enhanced ae
LEFT JOIN service_criticality_assessments sca ON ae.asset_id = sca.service_id 
  AND sca.id = (SELECT id FROM service_criticality_assessments WHERE service_id = ae.asset_id ORDER BY created_at DESC LIMIT 1)
WHERE ae.category = 'service' AND ae.active_status = TRUE;

-- Insert sample service-asset and service-risk relationships for testing
-- These would typically be populated through the UI or data import
INSERT OR IGNORE INTO service_asset_links (service_id, asset_id, relationship_type, dependency_strength) 
SELECT DISTINCT 
  s.asset_id as service_id,
  a.asset_id as asset_id,
  'depends_on' as relationship_type,
  CASE 
    WHEN a.criticality = 'Critical' THEN 'critical'
    WHEN a.criticality = 'High' THEN 'high'  
    ELSE 'medium'
  END as dependency_strength
FROM assets_enhanced s
CROSS JOIN assets_enhanced a
WHERE s.category = 'service' 
  AND a.category != 'service'
  AND s.asset_id != a.asset_id
  AND RANDOM() % 4 = 0  -- Random 25% sample for demo
LIMIT 20;

-- Create trigger to update the updated_at timestamp
CREATE TRIGGER IF NOT EXISTS update_service_assessment_timestamp 
  AFTER UPDATE ON service_criticality_assessments
  FOR EACH ROW
  BEGIN
    UPDATE service_criticality_assessments 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
  END;

-- Create trigger to log criticality changes
CREATE TRIGGER IF NOT EXISTS log_criticality_changes
  AFTER UPDATE OF criticality ON assets_enhanced
  FOR EACH ROW
  WHEN OLD.criticality != NEW.criticality AND NEW.category = 'service'
  BEGIN
    INSERT INTO criticality_audit_log (
      service_id, event_type, old_criticality, new_criticality, 
      change_reason, changed_by
    ) VALUES (
      NEW.asset_id, 'manual_override', OLD.criticality, NEW.criticality,
      'Manual criticality update', 'system'
    );
  END;