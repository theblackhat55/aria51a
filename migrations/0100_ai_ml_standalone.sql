-- AI/ML Standalone Schema - Independent AI/ML Tables
-- Created for live AI/ML functionality activation

-- Core threat indicators table (simplified for AI/ML)
CREATE TABLE IF NOT EXISTS threat_indicators (
    id TEXT PRIMARY KEY,
    indicator_type TEXT NOT NULL CHECK (indicator_type IN ('ip', 'domain', 'hash', 'url', 'email', 'file')),
    indicator_value TEXT NOT NULL,
    threat_level TEXT CHECK (threat_level IN ('low', 'medium', 'high', 'critical')),
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
    source TEXT NOT NULL,
    first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
    tags TEXT, -- JSON array
    context TEXT, -- JSON object
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Core threat campaigns table
CREATE TABLE IF NOT EXISTS threat_campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    campaign_type TEXT CHECK (campaign_type IN ('apt', 'malware', 'phishing', 'ransomware', 'scam', 'vulnerability')),
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status TEXT CHECK (status IN ('active', 'dormant', 'closed')),
    first_seen DATETIME,
    last_activity DATETIME,
    target_sectors TEXT, -- JSON array
    geography TEXT,
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Core risks table (simplified for AI/ML)
CREATE TABLE IF NOT EXISTS core_risks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    probability INTEGER CHECK (probability >= 1 AND probability <= 5),
    impact INTEGER CHECK (impact >= 1 AND impact <= 5),
    risk_score REAL,
    status TEXT CHECK (status IN ('identified', 'active', 'mitigated', 'closed')),
    owner_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI Threat Analysis Results Storage
CREATE TABLE IF NOT EXISTS ai_threat_analyses (
    id TEXT PRIMARY KEY,
    indicator_id TEXT NOT NULL,
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('ioc_enrichment', 'campaign_analysis', 'risk_assessment', 'correlation_analysis')),
    ai_model TEXT NOT NULL CHECK (ai_model IN ('cloudflare-llama3', 'openai-gpt4', 'anthropic-claude', 'local-analysis')),
    analysis_result TEXT NOT NULL, -- JSON
    confidence_score REAL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    processing_time_ms INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (indicator_id) REFERENCES threat_indicators(id)
);

-- Enhanced Correlation Results with AI Attribution
CREATE TABLE IF NOT EXISTS enhanced_correlations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    correlation_id TEXT NOT NULL UNIQUE,
    correlation_type TEXT NOT NULL CHECK (correlation_type IN ('infrastructure', 'behavioral', 'temporal', 'campaign', 'ai_pattern')),
    ai_confidence REAL CHECK (ai_confidence >= 0 AND ai_confidence <= 1),
    correlation_strength REAL CHECK (correlation_strength >= 0 AND correlation_strength <= 1),
    attribution_data TEXT, -- JSON - threat actor attribution
    campaign_links TEXT, -- JSON array of linked campaigns
    threat_actor_attribution TEXT,
    evidence_summary TEXT,
    ai_model_used TEXT,
    processing_metadata TEXT, -- JSON - AI processing details
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI Risk Assessments for Enhanced Risk Scoring
CREATE TABLE IF NOT EXISTS ai_risk_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    risk_id INTEGER NOT NULL,
    assessment_type TEXT NOT NULL CHECK (assessment_type IN ('contextual', 'business_impact', 'mitigation', 'comprehensive')),
    ai_analysis TEXT NOT NULL, -- JSON - full AI analysis result
    risk_score REAL CHECK (risk_score >= 0 AND risk_score <= 100),
    business_impact_score REAL CHECK (business_impact_score >= 0 AND business_impact_score <= 30),
    mitigation_recommendations TEXT, -- JSON array
    confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
    ai_model_used TEXT,
    organizational_context TEXT, -- JSON - org context used for assessment
    threat_intelligence_context TEXT, -- JSON - TI context used
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (risk_id) REFERENCES core_risks(id)
);

-- AI Processing Metrics for Performance Monitoring
CREATE TABLE IF NOT EXISTS ai_processing_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation_type TEXT NOT NULL, -- 'ioc_analysis', 'campaign_analysis', 'risk_assessment', 'correlation_analysis'
    ai_model TEXT NOT NULL,
    processing_time_ms INTEGER,
    token_usage INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    cost_estimate REAL, -- Estimated cost in credits/dollars
    rate_limit_hit BOOLEAN DEFAULT FALSE,
    fallback_used BOOLEAN DEFAULT FALSE, -- Whether fallback model was used
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI Campaign Attribution Analysis
CREATE TABLE IF NOT EXISTS ai_campaign_analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id TEXT NOT NULL UNIQUE,
    campaign_name TEXT,
    attribution_analysis TEXT NOT NULL, -- JSON - complete attribution analysis
    threat_actor_primary TEXT,
    threat_actor_confidence REAL CHECK (threat_actor_confidence >= 0 AND threat_actor_confidence <= 1),
    attribution_evidence TEXT, -- JSON array of evidence
    infrastructure_analysis TEXT, -- JSON - C2, domains, hosting patterns
    ttps_analysis TEXT, -- JSON - MITRE ATT&CK mapping
    timeline_analysis TEXT, -- JSON - campaign timeline and evolution
    impact_assessment TEXT, -- JSON - business and operational impact
    ai_model_used TEXT,
    confidence_level TEXT CHECK (confidence_level IN ('low', 'medium', 'high')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ML Correlation Clusters
CREATE TABLE IF NOT EXISTS ml_correlation_clusters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cluster_id TEXT NOT NULL UNIQUE,
    cluster_type TEXT CHECK (cluster_type IN ('infrastructure', 'behavioral', 'temporal', 'attribution', 'campaign')),
    member_indicators TEXT NOT NULL, -- JSON array of indicator IDs
    cluster_confidence REAL CHECK (cluster_confidence >= 0 AND cluster_confidence <= 1),
    threat_actor_attribution TEXT, -- JSON
    campaign_association TEXT, -- JSON
    risk_assessment TEXT, -- JSON
    cluster_features TEXT, -- JSON - ML features
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Behavioral Analysis Profiles
CREATE TABLE IF NOT EXISTS behavioral_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id TEXT NOT NULL UNIQUE,
    entity_type TEXT CHECK (entity_type IN ('user', 'system', 'network', 'threat_actor', 'application')),
    entity_identifier TEXT NOT NULL,
    baseline_established BOOLEAN DEFAULT FALSE,
    baseline_confidence REAL CHECK (baseline_confidence >= 0 AND baseline_confidence <= 1),
    profile_features TEXT NOT NULL, -- JSON
    anomaly_thresholds TEXT, -- JSON
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Neural Network Models
CREATE TABLE IF NOT EXISTS neural_network_models (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_id TEXT NOT NULL UNIQUE,
    model_name TEXT NOT NULL,
    model_type TEXT CHECK (model_type IN ('anomaly_detection', 'threat_prediction', 'behavioral_analysis', 'classification')),
    architecture_config TEXT NOT NULL, -- JSON
    training_config TEXT, -- JSON
    performance_metrics TEXT, -- JSON
    model_status TEXT CHECK (model_status IN ('training', 'active', 'inactive', 'archived')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_trained DATETIME,
    next_training DATETIME
);

-- AI Enrichment Cache for Performance Optimization
CREATE TABLE IF NOT EXISTS ai_enrichment_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key TEXT NOT NULL UNIQUE, -- Hash of input parameters
    cache_type TEXT NOT NULL, -- 'ioc_analysis', 'campaign_attribution', 'risk_assessment'
    input_hash TEXT NOT NULL, -- Hash of input data for cache validation
    ai_model TEXT NOT NULL,
    cached_result TEXT NOT NULL, -- JSON - cached AI result
    confidence_score REAL,
    cache_expiry DATETIME,
    hit_count INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI Model Configuration and Rate Limiting
CREATE TABLE IF NOT EXISTS ai_model_configs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    model_name TEXT NOT NULL UNIQUE,
    model_type TEXT NOT NULL, -- 'primary', 'advanced', 'fallback'
    api_endpoint TEXT,
    rate_limit_rpm INTEGER,
    rate_limit_tpm INTEGER, -- tokens per minute
    cost_per_1k_tokens REAL,
    max_tokens INTEGER,
    temperature REAL,
    is_enabled BOOLEAN DEFAULT TRUE,
    fallback_model TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_ai_threat_analyses_indicator_id ON ai_threat_analyses(indicator_id);
CREATE INDEX IF NOT EXISTS idx_ai_threat_analyses_created_at ON ai_threat_analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_threat_analyses_confidence ON ai_threat_analyses(confidence_score);

CREATE INDEX IF NOT EXISTS idx_enhanced_correlations_type ON enhanced_correlations(correlation_type);
CREATE INDEX IF NOT EXISTS idx_enhanced_correlations_confidence ON enhanced_correlations(ai_confidence);
CREATE INDEX IF NOT EXISTS idx_enhanced_correlations_created_at ON enhanced_correlations(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_risk_assessments_risk_id ON ai_risk_assessments(risk_id);
CREATE INDEX IF NOT EXISTS idx_ai_risk_assessments_score ON ai_risk_assessments(risk_score);
CREATE INDEX IF NOT EXISTS idx_ai_risk_assessments_created_at ON ai_risk_assessments(created_at);

CREATE INDEX IF NOT EXISTS idx_ai_processing_metrics_model ON ai_processing_metrics(ai_model);
CREATE INDEX IF NOT EXISTS idx_ai_processing_metrics_operation ON ai_processing_metrics(operation_type);
CREATE INDEX IF NOT EXISTS idx_ai_processing_metrics_created_at ON ai_processing_metrics(created_at);

CREATE INDEX IF NOT EXISTS idx_ml_correlation_clusters_type ON ml_correlation_clusters(cluster_type);
CREATE INDEX IF NOT EXISTS idx_ml_correlation_clusters_confidence ON ml_correlation_clusters(cluster_confidence);

CREATE INDEX IF NOT EXISTS idx_behavioral_profiles_entity ON behavioral_profiles(entity_type, entity_identifier);
CREATE INDEX IF NOT EXISTS idx_behavioral_profiles_created_at ON behavioral_profiles(created_at);

CREATE INDEX IF NOT EXISTS idx_neural_network_models_status ON neural_network_models(model_status);
CREATE INDEX IF NOT EXISTS idx_neural_network_models_type ON neural_network_models(model_type);

CREATE INDEX IF NOT EXISTS idx_ai_enrichment_cache_key ON ai_enrichment_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_enrichment_cache_expiry ON ai_enrichment_cache(cache_expiry);

-- Insert default AI model configurations
INSERT OR IGNORE INTO ai_model_configs (
    model_name, model_type, rate_limit_rpm, rate_limit_tpm, 
    cost_per_1k_tokens, max_tokens, temperature, is_enabled
) VALUES 
    ('local-analysis', 'primary', 10000, 100000, 0.0, 2048, 0.3, TRUE),
    ('cloudflare-llama3', 'advanced', 1000, 50000, 0.001, 2048, 0.3, TRUE),
    ('openai-gpt4', 'fallback', 100, 10000, 0.03, 2048, 0.3, FALSE),
    ('anthropic-claude', 'fallback', 50, 5000, 0.025, 2048, 0.3, FALSE);

-- Insert sample threat indicators for testing
INSERT OR IGNORE INTO threat_indicators (
    id, indicator_type, indicator_value, threat_level, confidence, source, tags, context
) VALUES 
    ('ti-001', 'ip', '192.168.1.100', 'critical', 95, 'Internal Detection', 
     '["c2", "malware", "exfiltration"]', 
     '{"mitre_technique": "T1071.001", "kill_chain_phase": "command-and-control"}'),
    ('ti-002', 'domain', 'malicious-domain.com', 'high', 87, 'Commercial Feed',
     '["phishing", "credential-theft"]',
     '{"mitre_technique": "T1566.002", "kill_chain_phase": "initial-access"}'),
    ('ti-003', 'hash', 'a1b2c3d4e5f6789012345678901234567890abcdef', 'critical', 92, 'Partner Sharing',
     '["ransomware", "encryption"]',
     '{"mitre_technique": "T1486", "kill_chain_phase": "impact"}'),
    ('ti-004', 'url', 'http://suspicious-site.net/payload.exe', 'medium', 78, 'OSINT',
     '["malware-delivery", "dropper"]',
     '{"mitre_technique": "T1204.002", "kill_chain_phase": "execution"}'),
    ('ti-005', 'email', 'attacker@evil-domain.org', 'high', 83, 'Email Security',
     '["spear-phishing", "social-engineering"]',
     '{"mitre_technique": "T1566.001", "kill_chain_phase": "initial-access"}');

-- Insert sample threat campaigns
INSERT OR IGNORE INTO threat_campaigns (
    name, campaign_type, severity, status, first_seen, last_activity, 
    target_sectors, geography, confidence, description
) VALUES 
    ('LokiBot Banking Campaign', 'malware', 'critical', 'active', 
     '2024-01-15 10:30:00', '2024-01-22 14:45:00',
     '["financial", "banking"]', 'Global', 87,
     'Advanced banking trojan targeting financial institutions with credential theft capabilities'),
    ('APT29 Spear Phishing', 'apt', 'high', 'active',
     '2024-01-08 09:15:00', '2024-01-21 16:20:00',
     '["government", "defense", "ngo"]', 'North America, Europe', 91,
     'Sophisticated spear-phishing campaign attributed to Russian intelligence services'),
    ('Ransomware Deployment Wave', 'ransomware', 'critical', 'active',
     '2024-01-20 12:00:00', '2024-01-22 18:30:00',
     '["healthcare", "manufacturing", "education"]', 'Worldwide', 89,
     'Coordinated ransomware deployment targeting small to medium businesses');

-- Insert sample core risks
INSERT OR IGNORE INTO core_risks (
    title, description, category, probability, impact, risk_score, status, owner_id
) VALUES 
    ('Critical Server Vulnerability', 'Unpatched SQL injection vulnerability in production database server', 'Technical', 4, 5, 20, 'active', 1),
    ('Phishing Campaign Targeting Employees', 'Ongoing spear-phishing campaign targeting finance team credentials', 'Security', 5, 4, 20, 'active', 2),
    ('Ransomware Infrastructure Exposure', 'Critical systems accessible from internet with weak authentication', 'Infrastructure', 3, 5, 15, 'active', 3),
    ('Data Exfiltration Risk', 'Sensitive customer data accessible without proper access controls', 'Compliance', 4, 4, 16, 'active', 1),
    ('Third-party Supply Chain Risk', 'Vendor security posture compromised affecting our operations', 'Business', 3, 4, 12, 'active', 2);

-- Create trigger for automatic cache cleanup
CREATE TRIGGER IF NOT EXISTS cleanup_expired_ai_cache
    AFTER INSERT ON ai_enrichment_cache
    BEGIN
        DELETE FROM ai_enrichment_cache 
        WHERE cache_expiry < datetime('now') 
          AND id NOT IN (
              SELECT id FROM ai_enrichment_cache 
              ORDER BY last_accessed DESC 
              LIMIT 1000
          );
    END;