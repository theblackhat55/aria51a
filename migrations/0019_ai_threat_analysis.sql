-- AI Threat Analysis Schema - Phase 2 Implementation
-- Enhanced database schema for AI-driven threat intelligence analysis

-- AI Analysis Results Storage
CREATE TABLE IF NOT EXISTS ai_threat_analyses (
    id TEXT PRIMARY KEY,
    ioc_id TEXT NOT NULL,
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('ioc_enrichment', 'campaign_analysis', 'risk_assessment', 'correlation_analysis')),
    ai_model TEXT NOT NULL CHECK (ai_model IN ('cloudflare-llama3', 'openai-gpt4', 'anthropic-claude')),
    analysis_result TEXT NOT NULL, -- JSON
    confidence_score REAL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    processing_time_ms INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ioc_id) REFERENCES iocs(id)
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
    FOREIGN KEY (risk_id) REFERENCES risks(id)
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

-- IOC AI Enrichment Status Tracking  
ALTER TABLE iocs ADD COLUMN ai_enriched BOOLEAN DEFAULT FALSE;
ALTER TABLE iocs ADD COLUMN ai_enrichment_date DATETIME;
ALTER TABLE iocs ADD COLUMN ai_confidence_score REAL;
ALTER TABLE iocs ADD COLUMN ai_threat_classification TEXT;
ALTER TABLE iocs ADD COLUMN ai_attribution TEXT; -- JSON - threat actor attribution

-- Campaign AI Enhancement Tracking
ALTER TABLE threat_campaigns ADD COLUMN ai_attributed BOOLEAN DEFAULT FALSE;
ALTER TABLE threat_campaigns ADD COLUMN ai_attribution_confidence REAL;
ALTER TABLE threat_campaigns ADD COLUMN ai_threat_actor TEXT;
ALTER TABLE threat_campaigns ADD COLUMN ai_analysis_summary TEXT;

-- Enhanced Risk AI Scoring
ALTER TABLE risks ADD COLUMN ai_risk_score REAL;
ALTER TABLE risks ADD COLUMN ai_confidence_level TEXT CHECK (ai_confidence_level IN ('low', 'medium', 'high'));
ALTER TABLE risks ADD COLUMN ai_analysis_date DATETIME;
ALTER TABLE risks ADD COLUMN ai_mitigation_recommendations TEXT; -- JSON array

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_ai_threat_analyses_ioc_id ON ai_threat_analyses(ioc_id);
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

CREATE INDEX IF NOT EXISTS idx_ai_enrichment_cache_key ON ai_enrichment_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_ai_enrichment_cache_expiry ON ai_enrichment_cache(cache_expiry);

-- Insert default AI model configurations
INSERT OR IGNORE INTO ai_model_configs (
    model_name, model_type, rate_limit_rpm, rate_limit_tpm, 
    cost_per_1k_tokens, max_tokens, temperature, is_enabled
) VALUES 
    ('cloudflare-llama3', 'primary', 1000, 50000, 0.001, 2048, 0.3, TRUE),
    ('openai-gpt4', 'advanced', 100, 10000, 0.03, 2048, 0.3, TRUE),
    ('anthropic-claude', 'fallback', 50, 5000, 0.025, 2048, 0.3, TRUE);

-- Create trigger for automatic cache cleanup (optional performance enhancement)
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

-- Create trigger for updating IOC AI enrichment status
CREATE TRIGGER IF NOT EXISTS update_ioc_ai_status
    AFTER INSERT ON ai_threat_analyses
    WHEN NEW.analysis_type = 'ioc_enrichment'
    BEGIN
        UPDATE iocs 
        SET 
            ai_enriched = TRUE,
            ai_enrichment_date = NEW.created_at,
            ai_confidence_score = NEW.confidence_score,
            ai_threat_classification = json_extract(NEW.analysis_result, '$.threat_classification'),
            ai_attribution = json_extract(NEW.analysis_result, '$.threat_actor')
        WHERE id = NEW.ioc_id;
    END;

-- Create trigger for updating risk AI scoring
CREATE TRIGGER IF NOT EXISTS update_risk_ai_score
    AFTER INSERT ON ai_risk_assessments
    WHEN NEW.assessment_type = 'comprehensive'
    BEGIN
        UPDATE risks 
        SET 
            ai_risk_score = NEW.risk_score,
            ai_confidence_level = NEW.confidence_level,
            ai_analysis_date = NEW.created_at,
            ai_mitigation_recommendations = NEW.mitigation_recommendations
        WHERE id = NEW.risk_id;
    END;