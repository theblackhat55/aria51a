-- DMT Risk Assessment System v2.0 - Tier 1 AI Features Migration
-- AI-powered risk intelligence, heat maps, and automated compliance gap analysis

-- Add AI-powered columns to risks table (skip ai_risk_score as it already exists)
-- ALTER TABLE risks ADD COLUMN ai_risk_score REAL DEFAULT NULL; -- Already exists
ALTER TABLE risks ADD COLUMN risk_trend TEXT DEFAULT 'stable'; -- 'increasing', 'stable', 'decreasing'
ALTER TABLE risks ADD COLUMN predicted_impact_date DATE DEFAULT NULL;
ALTER TABLE risks ADD COLUMN confidence_level REAL DEFAULT NULL; -- 0.0 to 1.0
ALTER TABLE risks ADD COLUMN threat_multiplier REAL DEFAULT 1.0;
ALTER TABLE risks ADD COLUMN industry_factor REAL DEFAULT 1.0;
ALTER TABLE risks ADD COLUMN external_threat_level REAL DEFAULT 0.0;
ALTER TABLE risks ADD COLUMN ai_analysis_timestamp DATETIME DEFAULT NULL;
ALTER TABLE risks ADD COLUMN risk_velocity REAL DEFAULT 0.0; -- Rate of change in risk score

-- Risk Heat Map Data
CREATE TABLE IF NOT EXISTS risk_heat_map_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    risk_id INTEGER NOT NULL,
    probability REAL NOT NULL,
    impact REAL NOT NULL,
    risk_score REAL NOT NULL,
    ai_risk_score REAL,
    category_name TEXT NOT NULL,
    trend_direction TEXT DEFAULT 'stable',
    heat_intensity REAL DEFAULT 0.0, -- 0.0 to 1.0
    grid_position_x INTEGER DEFAULT 0,
    grid_position_y INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE
);

-- Risk Trend Analysis
CREATE TABLE IF NOT EXISTS risk_trend_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    risk_id INTEGER NOT NULL,
    analysis_date DATE NOT NULL,
    previous_score REAL NOT NULL,
    current_score REAL NOT NULL,
    trend_direction TEXT NOT NULL, -- 'increasing', 'decreasing', 'stable'
    velocity REAL DEFAULT 0.0, -- Rate of change
    predicted_score REAL DEFAULT NULL,
    prediction_confidence REAL DEFAULT NULL,
    factors JSON DEFAULT NULL, -- JSON array of contributing factors
    ai_analysis JSON DEFAULT NULL, -- Full AI analysis results
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE
);

-- AI Risk Predictions
CREATE TABLE IF NOT EXISTS ai_risk_predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    risk_id INTEGER NOT NULL,
    prediction_type TEXT NOT NULL, -- 'score', 'escalation', 'mitigation_success'
    current_value REAL NOT NULL,
    predicted_value REAL NOT NULL,
    prediction_date DATE NOT NULL,
    confidence_level REAL NOT NULL,
    contributing_factors JSON DEFAULT NULL,
    model_version TEXT DEFAULT 'v1.0',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE
);

-- Compliance Gap Analysis
CREATE TABLE IF NOT EXISTS compliance_gap_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    framework TEXT NOT NULL,
    analysis_date DATE NOT NULL,
    total_requirements INTEGER NOT NULL,
    compliant_requirements INTEGER NOT NULL,
    non_compliant_requirements INTEGER NOT NULL,
    partially_compliant_requirements INTEGER NOT NULL,
    overall_compliance_score REAL NOT NULL,
    gap_severity TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low'
    gaps_identified JSON NOT NULL, -- Array of gap details
    recommendations JSON DEFAULT NULL, -- AI-generated recommendations
    next_assessment_date DATE DEFAULT NULL,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Compliance Gap Details
CREATE TABLE IF NOT EXISTS compliance_gap_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gap_analysis_id INTEGER NOT NULL,
    requirement_id TEXT NOT NULL,
    requirement_text TEXT NOT NULL,
    current_status TEXT NOT NULL,
    target_status TEXT NOT NULL,
    gap_type TEXT NOT NULL, -- 'implementation', 'performance', 'documentation', 'critical'
    risk_level TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low'
    estimated_effort TEXT DEFAULT NULL, -- 'low', 'medium', 'high'
    priority_score INTEGER DEFAULT 0,
    remediation_plan TEXT DEFAULT NULL,
    target_completion_date DATE DEFAULT NULL,
    assigned_to INTEGER DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (gap_analysis_id) REFERENCES compliance_gap_analysis(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- AI Analytics Cache
CREATE TABLE IF NOT EXISTS ai_analytics_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key TEXT UNIQUE NOT NULL,
    analysis_type TEXT NOT NULL, -- 'risk_prediction', 'compliance_gap', 'heat_map'
    result_data JSON NOT NULL,
    confidence_level REAL DEFAULT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- External Threat Intelligence
CREATE TABLE IF NOT EXISTS threat_intelligence (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    threat_type TEXT NOT NULL,
    category TEXT NOT NULL,
    threat_level REAL NOT NULL, -- 0.0 to 1.0
    source TEXT NOT NULL, -- 'cve_database', 'threat_feed', 'industry_report'
    description TEXT NOT NULL,
    indicators JSON DEFAULT NULL,
    published_date DATE NOT NULL,
    relevance_score REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_risks_ai_score ON risks(ai_risk_score);
CREATE INDEX IF NOT EXISTS idx_risks_trend ON risks(risk_trend);
CREATE INDEX IF NOT EXISTS idx_risk_heat_map_risk_id ON risk_heat_map_data(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_trend_analysis_risk_id ON risk_trend_analysis(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_trend_analysis_date ON risk_trend_analysis(analysis_date);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_risk_id ON ai_risk_predictions(risk_id);
CREATE INDEX IF NOT EXISTS idx_compliance_gap_framework ON compliance_gap_analysis(framework);
CREATE INDEX IF NOT EXISTS idx_compliance_gap_date ON compliance_gap_analysis(analysis_date);
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_analytics_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_analytics_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_threat_intel_category ON threat_intelligence(category);
CREATE INDEX IF NOT EXISTS idx_threat_intel_level ON threat_intelligence(threat_level);

-- Insert sample threat intelligence data
INSERT OR IGNORE INTO threat_intelligence (threat_type, category, threat_level, source, description, published_date, relevance_score) VALUES 
('ransomware', 'cybersecurity', 0.8, 'threat_feed', 'Increased ransomware activity targeting financial institutions', '2024-08-01', 0.9),
('data_breach', 'data_privacy', 0.7, 'industry_report', 'Rising data breach incidents in healthcare sector', '2024-08-05', 0.8),
('supply_chain', 'third_party_risk', 0.6, 'threat_feed', 'Supply chain vulnerabilities in software vendors', '2024-08-10', 0.7),
('phishing', 'cybersecurity', 0.5, 'cve_database', 'Sophisticated phishing campaigns targeting executives', '2024-08-12', 0.6),
('insider_threat', 'operational_risk', 0.4, 'industry_report', 'Increased insider threat incidents post-pandemic', '2024-08-14', 0.5);

-- Update existing risks with AI analysis (sample data)
UPDATE risks SET 
    ai_risk_score = risk_score * (1 + RANDOM() / 10.0),
    risk_trend = CASE 
        WHEN RANDOM() % 3 = 0 THEN 'increasing'
        WHEN RANDOM() % 3 = 1 THEN 'decreasing' 
        ELSE 'stable'
    END,
    confidence_level = 0.7 + (RANDOM() / 3.3),
    threat_multiplier = 0.8 + (RANDOM() / 2.5),
    industry_factor = 0.9 + (RANDOM() / 5.0),
    ai_analysis_timestamp = CURRENT_TIMESTAMP
WHERE id IS NOT NULL;