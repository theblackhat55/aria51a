-- AI Performance Analytics Database Schema
-- Migration: 0102_ai_performance_analytics.sql

-- AI Performance Logs Table
-- Tracks individual AI requests for performance analysis
CREATE TABLE IF NOT EXISTS ai_performance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id TEXT NOT NULL CHECK (provider_id IN ('openai-gpt4', 'openai-gpt35', 'anthropic-claude', 'cloudflare-llama')),
    model TEXT NOT NULL,
    query_type TEXT CHECK (query_type IN ('general', 'threat_intelligence', 'ml_correlation', 'behavioral_analysis', 'risk_assessment', 'compliance_status', 'system_status')),
    query_complexity TEXT CHECK (query_complexity IN ('simple', 'medium', 'complex')),
    response_time_ms INTEGER NOT NULL,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    total_tokens GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
    success INTEGER NOT NULL CHECK (success IN (0, 1)),
    confidence_score REAL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    error_type TEXT,
    user_feedback INTEGER CHECK (user_feedback >= 1 AND user_feedback <= 5),
    cost_estimate REAL DEFAULT 0.0,
    session_id TEXT,
    user_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Chat Conversations Table  
-- Stores chat interactions for learning and improvement
CREATE TABLE IF NOT EXISTS chat_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_query TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    query_analysis TEXT, -- JSON object with analysis details
    response_type TEXT CHECK (response_type IN ('text', 'data', 'alert', 'recommendation')),
    confidence_score REAL CHECK (confidence_score >= 0 AND confidence_score <= 1),
    ai_model TEXT,
    processing_time_ms INTEGER,
    user_feedback_rating INTEGER CHECK (user_feedback_rating >= 1 AND user_feedback_rating <= 5),
    user_feedback_comments TEXT,
    conversation_context TEXT, -- JSON object with conversation context
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI Model Performance Summary Table
-- Aggregated performance metrics for quick dashboard access
CREATE TABLE IF NOT EXISTS ai_model_performance_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id TEXT NOT NULL,
    model TEXT NOT NULL,
    date_period DATE NOT NULL, -- Daily aggregation
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    avg_response_time_ms REAL DEFAULT 0,
    avg_token_usage REAL DEFAULT 0,
    avg_confidence_score REAL DEFAULT 0,
    total_cost REAL DEFAULT 0,
    avg_user_feedback REAL DEFAULT 0,
    error_rate REAL GENERATED ALWAYS AS (
        CASE WHEN total_requests > 0 
        THEN CAST(failed_requests AS REAL) / total_requests 
        ELSE 0 END
    ) STORED,
    success_rate REAL GENERATED ALWAYS AS (
        CASE WHEN total_requests > 0 
        THEN CAST(successful_requests AS REAL) / total_requests 
        ELSE 0 END
    ) STORED,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(provider_id, model, date_period)
);

-- AI Route Optimization Table
-- Tracks routing decisions and their effectiveness
CREATE TABLE IF NOT EXISTS ai_route_optimization (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    query_hash TEXT NOT NULL, -- Hash of query content for deduplication
    query_type TEXT,
    query_complexity TEXT,
    original_provider TEXT,
    selected_provider TEXT,
    routing_reason TEXT,
    routing_confidence REAL CHECK (routing_confidence >= 0 AND routing_confidence <= 1),
    actual_performance_score REAL, -- Measured after execution
    expected_performance_score REAL, -- Predicted before execution
    routing_accuracy REAL GENERATED ALWAYS AS (
        CASE WHEN expected_performance_score > 0 
        THEN 1.0 - ABS(actual_performance_score - expected_performance_score) / expected_performance_score
        ELSE 0 END
    ) STORED,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI Cost Analysis Table
-- Detailed cost tracking and optimization insights
CREATE TABLE IF NOT EXISTS ai_cost_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id TEXT NOT NULL,
    cost_period_start DATETIME NOT NULL,
    cost_period_end DATETIME NOT NULL,
    total_requests INTEGER DEFAULT 0,
    total_input_tokens INTEGER DEFAULT 0,
    total_output_tokens INTEGER DEFAULT 0,
    total_cost REAL DEFAULT 0,
    avg_cost_per_request REAL GENERATED ALWAYS AS (
        CASE WHEN total_requests > 0 
        THEN total_cost / total_requests 
        ELSE 0 END
    ) STORED,
    avg_cost_per_token REAL GENERATED ALWAYS AS (
        CASE WHEN (total_input_tokens + total_output_tokens) > 0 
        THEN total_cost / (total_input_tokens + total_output_tokens)
        ELSE 0 END
    ) STORED,
    optimization_score REAL DEFAULT 0, -- 0-1 score for cost efficiency
    potential_savings REAL DEFAULT 0,
    optimization_recommendations TEXT, -- JSON array of recommendations
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI A/B Testing Results Table
-- Track A/B tests for model selection strategies
CREATE TABLE IF NOT EXISTS ai_ab_testing_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    test_name TEXT NOT NULL,
    test_version TEXT NOT NULL, -- 'A' or 'B'
    provider_id TEXT NOT NULL,
    model TEXT NOT NULL,
    test_start_date DATETIME NOT NULL,
    test_end_date DATETIME,
    sample_size INTEGER DEFAULT 0,
    success_rate REAL DEFAULT 0,
    avg_response_time REAL DEFAULT 0,
    avg_confidence_score REAL DEFAULT 0,
    avg_user_satisfaction REAL DEFAULT 0,
    cost_per_success REAL DEFAULT 0,
    statistical_significance REAL DEFAULT 0, -- p-value
    test_winner INTEGER CHECK (test_winner IN (0, 1)), -- 1 if this version won
    test_status TEXT DEFAULT 'running' CHECK (test_status IN ('running', 'completed', 'paused')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(test_name, test_version)
);

-- AI Provider Health Monitoring Table
-- Track uptime and availability of AI providers
CREATE TABLE IF NOT EXISTS ai_provider_health (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id TEXT NOT NULL,
    health_check_time DATETIME NOT NULL,
    status TEXT CHECK (status IN ('healthy', 'degraded', 'unavailable')),
    response_time_ms INTEGER,
    error_message TEXT,
    availability_score REAL DEFAULT 1.0, -- Rolling 24h availability
    consecutive_failures INTEGER DEFAULT 0,
    last_success_time DATETIME,
    health_details TEXT, -- JSON object with detailed health metrics
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_ai_performance_logs_provider_created ON ai_performance_logs(provider_id, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_performance_logs_query_type ON ai_performance_logs(query_type);
CREATE INDEX IF NOT EXISTS idx_ai_performance_logs_success_time ON ai_performance_logs(success, response_time_ms);
CREATE INDEX IF NOT EXISTS idx_ai_performance_logs_session ON ai_performance_logs(session_id);

CREATE INDEX IF NOT EXISTS idx_chat_conversations_session ON chat_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_created ON chat_conversations(created_at);

CREATE INDEX IF NOT EXISTS idx_model_performance_provider_date ON ai_model_performance_summary(provider_id, date_period);
CREATE INDEX IF NOT EXISTS idx_model_performance_success_rate ON ai_model_performance_summary(success_rate);

CREATE INDEX IF NOT EXISTS idx_route_optimization_query_type ON ai_route_optimization(query_type);
CREATE INDEX IF NOT EXISTS idx_route_optimization_accuracy ON ai_route_optimization(routing_accuracy);

CREATE INDEX IF NOT EXISTS idx_cost_analysis_provider_period ON ai_cost_analysis(provider_id, cost_period_start);
CREATE INDEX IF NOT EXISTS idx_cost_analysis_optimization_score ON ai_cost_analysis(optimization_score);

CREATE INDEX IF NOT EXISTS idx_ab_testing_test_name ON ai_ab_testing_results(test_name);
CREATE INDEX IF NOT EXISTS idx_ab_testing_status ON ai_ab_testing_results(test_status);

CREATE INDEX IF NOT EXISTS idx_provider_health_provider_time ON ai_provider_health(provider_id, health_check_time);
CREATE INDEX IF NOT EXISTS idx_provider_health_status ON ai_provider_health(status);

-- Create triggers to automatically update summary tables
CREATE TRIGGER IF NOT EXISTS update_model_performance_summary
AFTER INSERT ON ai_performance_logs
BEGIN
    INSERT OR REPLACE INTO ai_model_performance_summary (
        provider_id, model, date_period, 
        total_requests, successful_requests, failed_requests,
        avg_response_time_ms, avg_token_usage, avg_confidence_score,
        total_cost, avg_user_feedback, updated_at
    )
    SELECT 
        NEW.provider_id,
        NEW.model,
        DATE(NEW.created_at),
        COUNT(*),
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END),
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END),
        AVG(response_time_ms),
        AVG(total_tokens),
        AVG(confidence_score),
        SUM(cost_estimate),
        AVG(user_feedback),
        CURRENT_TIMESTAMP
    FROM ai_performance_logs 
    WHERE provider_id = NEW.provider_id 
        AND model = NEW.model 
        AND DATE(created_at) = DATE(NEW.created_at);
END;

-- Insert sample AI provider health records
INSERT OR IGNORE INTO ai_provider_health (provider_id, health_check_time, status, response_time_ms, availability_score) VALUES
('cloudflare-llama', CURRENT_TIMESTAMP, 'healthy', 850, 0.99),
('openai-gpt4', CURRENT_TIMESTAMP, 'healthy', 2100, 0.97),
('anthropic-claude', CURRENT_TIMESTAMP, 'healthy', 1800, 0.98);

-- Insert sample performance data for demonstration
INSERT OR IGNORE INTO ai_performance_logs (
    provider_id, model, query_type, query_complexity, response_time_ms,
    input_tokens, output_tokens, success, confidence_score, cost_estimate
) VALUES
('cloudflare-llama', 'llama-3.1-8b-instruct', 'general', 'simple', 750, 50, 150, 1, 0.85, 0.0),
('cloudflare-llama', 'llama-3.1-8b-instruct', 'threat_intelligence', 'medium', 1200, 120, 300, 1, 0.78, 0.0),
('openai-gpt4', 'gpt-4', 'ml_correlation', 'complex', 2800, 200, 500, 1, 0.92, 0.042),
('anthropic-claude', 'claude-3-sonnet', 'compliance_status', 'medium', 1950, 150, 350, 1, 0.87, 0.016);