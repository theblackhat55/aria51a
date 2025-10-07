-- Enhanced Dynamic Risk Scoring Schema
-- Extends existing risks table with dynamic scoring capabilities

-- Add dynamic scoring columns to existing risks table
ALTER TABLE risks ADD COLUMN dynamic_score REAL DEFAULT NULL;
ALTER TABLE risks ADD COLUMN dynamic_level TEXT DEFAULT NULL;
ALTER TABLE risks ADD COLUMN dynamic_trend TEXT DEFAULT NULL;
ALTER TABLE risks ADD COLUMN confidence_score REAL DEFAULT NULL;
ALTER TABLE risks ADD COLUMN last_calculated DATETIME DEFAULT NULL;
ALTER TABLE risks ADD COLUMN next_calculation DATETIME DEFAULT NULL;
ALTER TABLE risks ADD COLUMN calculation_metadata TEXT DEFAULT NULL; -- JSON

-- Risk Factor Components Table
CREATE TABLE IF NOT EXISTS risk_factors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  factor_type TEXT NOT NULL, -- 'asset', 'service', 'threat', 'vulnerability', 'context'
  factor_name TEXT NOT NULL,
  factor_value REAL NOT NULL,
  weight REAL NOT NULL,
  data_source TEXT, -- 'ms_defender', 'threat_intel', 'manual', 'calculated'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE
);

-- Risk Asset Mappings (Enhanced)
CREATE TABLE IF NOT EXISTS risk_asset_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  asset_id INTEGER NOT NULL,
  impact_weight REAL DEFAULT 1.0, -- How much this asset affects the risk
  exposure_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  mitigation_coverage REAL DEFAULT 0.0, -- 0-1 scale
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE,
  UNIQUE(risk_id, asset_id)
);

-- Risk Service Mappings (Enhanced)
CREATE TABLE IF NOT EXISTS risk_service_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  business_impact_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  dependency_criticality REAL DEFAULT 1.0,
  availability_requirement REAL DEFAULT 0.99, -- SLA requirement
  financial_impact_hourly REAL DEFAULT 0.0,
  user_impact_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE
);

-- Dynamic Risk Calculation History
CREATE TABLE IF NOT EXISTS risk_calculation_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  calculation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  previous_score REAL,
  new_score REAL,
  score_change REAL,
  change_reason TEXT,
  triggered_by TEXT, -- 'scheduled', 'asset_update', 'threat_intel', 'manual'
  calculation_details TEXT, -- JSON with component scores
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE
);

-- Threat Intelligence Integration
CREATE TABLE IF NOT EXISTS risk_threat_intelligence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  threat_source TEXT NOT NULL,
  threat_type TEXT NOT NULL, -- 'cve', 'ioc', 'ttp', 'campaign'
  threat_value TEXT NOT NULL,
  confidence_level REAL NOT NULL, -- 0-1
  severity_score REAL NOT NULL, -- 0-10
  active_status BOOLEAN DEFAULT TRUE,
  first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT, -- JSON
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE
);

-- Control Effectiveness Tracking
CREATE TABLE IF NOT EXISTS risk_control_effectiveness (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  control_id TEXT NOT NULL, -- Reference to control framework
  control_type TEXT NOT NULL, -- 'preventive', 'detective', 'corrective'
  effectiveness_score REAL NOT NULL, -- 0-1
  coverage_percentage REAL DEFAULT 0.0, -- 0-100
  last_tested DATETIME,
  test_result TEXT,
  maturity_level INTEGER DEFAULT 1, -- 1-5
  implementation_status TEXT DEFAULT 'planned', -- 'planned', 'implemented', 'tested', 'optimized'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE
);

-- Risk Environment Context
CREATE TABLE IF NOT EXISTS risk_environment_context (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  context_type TEXT NOT NULL, -- 'business', 'compliance', 'threat', 'technical'
  context_name TEXT NOT NULL,
  context_value TEXT NOT NULL,
  impact_multiplier REAL DEFAULT 1.0,
  active_period_start DATETIME,
  active_period_end DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE
);

-- Risk Scoring Configuration
CREATE TABLE IF NOT EXISTS risk_scoring_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_name TEXT UNIQUE NOT NULL,
  config_version TEXT NOT NULL,
  organization_id INTEGER,
  risk_appetite TEXT DEFAULT 'moderate', -- 'conservative', 'moderate', 'aggressive'
  thresholds TEXT NOT NULL, -- JSON with critical/high/medium/low thresholds
  weights TEXT NOT NULL, -- JSON with component weightings
  calculation_frequency TEXT DEFAULT 'hourly', -- 'realtime', 'hourly', 'daily'
  active_status BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default scoring configuration
INSERT OR IGNORE INTO risk_scoring_config (
  config_name, config_version, risk_appetite, thresholds, weights, calculation_frequency
) VALUES (
  'default_enhanced', 'v1.0', 'moderate',
  '{"critical": 80, "high": 60, "medium": 40, "low": 20}',
  '{
    "asset_criticality": 0.25,
    "service_criticality": 0.25, 
    "vulnerability_score": 0.20,
    "threat_intelligence": 0.15,
    "incident_history": 0.10,
    "control_effectiveness": -0.15
  }',
  'hourly'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_risk_factors_risk_id ON risk_factors(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_factors_type ON risk_factors(factor_type);
CREATE INDEX IF NOT EXISTS idx_risk_asset_mappings_risk_id ON risk_asset_mappings(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_asset_mappings_asset_id ON risk_asset_mappings(asset_id);
CREATE INDEX IF NOT EXISTS idx_risk_service_mappings_risk_id ON risk_service_mappings(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_calculation_history_risk_id ON risk_calculation_history(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_calculation_history_date ON risk_calculation_history(calculation_date);
CREATE INDEX IF NOT EXISTS idx_risk_threat_intelligence_risk_id ON risk_threat_intelligence(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_control_effectiveness_risk_id ON risk_control_effectiveness(risk_id);
CREATE INDEX IF NOT EXISTS idx_risks_dynamic_score ON risks(dynamic_score);
CREATE INDEX IF NOT EXISTS idx_risks_dynamic_level ON risks(dynamic_level);
CREATE INDEX IF NOT EXISTS idx_risks_last_calculated ON risks(last_calculated);