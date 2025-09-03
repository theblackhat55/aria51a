-- Simplified AI GRC Engine Schema
-- Core tables for AI-powered asset, service, and dynamic risk analysis

-- AI Asset Risk Analysis Results (Simplified)
CREATE TABLE IF NOT EXISTS ai_asset_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id TEXT NOT NULL,
  ai_risk_score REAL NOT NULL,
  risk_level TEXT NOT NULL,
  confidence_level REAL NOT NULL,
  contributing_factors TEXT,
  recommendations TEXT,
  analysis_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI Service Risk Analysis Results (Simplified)
CREATE TABLE IF NOT EXISTS ai_service_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  ai_risk_score REAL NOT NULL,
  risk_level TEXT NOT NULL,
  confidence_level REAL NOT NULL,
  contributing_factors TEXT,
  recommendations TEXT,
  analysis_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Dynamic Risk Assessment Results (Simplified)
CREATE TABLE IF NOT EXISTS ai_dynamic_risk_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  current_risk_score REAL NOT NULL,
  ai_enhanced_score REAL NOT NULL,
  dynamic_multipliers TEXT,
  real_time_factors TEXT,
  analysis_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI Analysis Queue
CREATE TABLE IF NOT EXISTS ai_analysis_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  analysis_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  priority INTEGER DEFAULT 5,
  status TEXT DEFAULT 'pending',
  requested_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI GRC Configuration
CREATE TABLE IF NOT EXISTS ai_grc_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  config_type TEXT NOT NULL,
  config_name TEXT NOT NULL,
  config_value TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_asset_analysis_asset_id ON ai_asset_analysis(asset_id);
CREATE INDEX IF NOT EXISTS idx_ai_service_analysis_service_id ON ai_service_analysis(service_id);
CREATE INDEX IF NOT EXISTS idx_ai_dynamic_risk_analysis_risk_id ON ai_dynamic_risk_analysis(risk_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_queue_status ON ai_analysis_queue(status);

-- Insert default configuration
INSERT OR IGNORE INTO ai_grc_config (config_type, config_name, config_value, created_by) VALUES 
('ai_providers', 'default_config', '{"providers": {"default": "openai"}}', 1),
('asset_weights', 'default_weights', '{"defender_score": 0.3, "vulnerability_count": 0.25}', 1),
('risk_thresholds', 'asset_risk', '{"critical": 80, "high": 60, "medium": 40}', 1);