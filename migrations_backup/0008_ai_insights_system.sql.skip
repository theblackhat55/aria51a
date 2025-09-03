-- AI-Powered Risk Insights and LLM Integration System

-- AI insights cache for storing analysis results
CREATE TABLE IF NOT EXISTS ai_insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  insight_type TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence_score REAL DEFAULT 0,
  severity_level TEXT DEFAULT 'low',
  priority INTEGER DEFAULT 1,
  model_used TEXT,
  analysis_data TEXT,
  recommendations TEXT,
  prediction_date DATETIME,
  valid_until DATETIME,
  status TEXT DEFAULT 'active',
  user_feedback TEXT,
  feedback_rating INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- LLM provider configurations
CREATE TABLE IF NOT EXISTS llm_providers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_name TEXT UNIQUE NOT NULL,
  provider_type TEXT NOT NULL,
  api_endpoint TEXT,
  model_name TEXT,
  api_key_hash TEXT,
  capabilities TEXT,
  max_tokens INTEGER DEFAULT 4096,
  supports_streaming INTEGER DEFAULT 0,
  supports_functions INTEGER DEFAULT 0,
  temperature REAL DEFAULT 0.7,
  top_p REAL DEFAULT 0.9,
  frequency_penalty REAL DEFAULT 0.0,
  presence_penalty REAL DEFAULT 0.0,
  is_active INTEGER DEFAULT 1,
  is_default INTEGER DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  last_used_at DATETIME,
  requests_per_minute INTEGER DEFAULT 60,
  requests_per_day INTEGER DEFAULT 1000,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI conversation history for ARIA
CREATE TABLE IF NOT EXISTS ai_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_id TEXT NOT NULL,
  message_type TEXT NOT NULL,
  content TEXT NOT NULL,
  context_data TEXT,
  llm_provider_id INTEGER,
  model_used TEXT,
  response_time_ms INTEGER,
  token_count INTEGER,
  cost_estimate REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (llm_provider_id) REFERENCES llm_providers(id)
);

-- AI analysis jobs queue
CREATE TABLE IF NOT EXISTS ai_analysis_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  job_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  analysis_params TEXT,
  llm_provider_id INTEGER,
  priority INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending',
  progress_percentage INTEGER DEFAULT 0,
  result_data TEXT,
  error_message TEXT,
  scheduled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME,
  execution_time_ms INTEGER,
  tokens_used INTEGER,
  cost REAL,
  created_by INTEGER,
  FOREIGN KEY (llm_provider_id) REFERENCES llm_providers(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- AI training data and feedback
CREATE TABLE IF NOT EXISTS ai_training_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  data_type TEXT NOT NULL,
  input_data TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  actual_output TEXT,
  accuracy_score REAL,
  user_satisfaction INTEGER,
  model_version TEXT,
  created_by INTEGER,
  validated_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (validated_by) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_entity ON ai_insights(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_status ON ai_insights(status);
CREATE INDEX IF NOT EXISTS idx_ai_insights_created ON ai_insights(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_session ON ai_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_jobs_status ON ai_analysis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_jobs_type ON ai_analysis_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_llm_providers_active ON llm_providers(is_active);

-- Insert default LLM provider configurations
INSERT OR IGNORE INTO llm_providers (
  provider_name, provider_type, model_name, capabilities, max_tokens, 
  supports_streaming, supports_functions, is_active, is_default
) VALUES 
(
  'openai', 'api', 'gpt-4', 
  '["text_generation", "analysis", "summarization", "risk_assessment", "code_generation"]',
  8192, 1, 1, 1, 1
),
(
  'gemini', 'api', 'gemini-pro',
  '["text_generation", "analysis", "summarization", "risk_assessment", "multimodal"]', 
  30720, 1, 1, 1, 0
),
(
  'anthropic', 'api', 'claude-3-opus',
  '["text_generation", "analysis", "summarization", "risk_assessment", "reasoning"]',
  200000, 1, 1, 1, 0
),
(
  'local-llm', 'local', 'llama-2-7b',
  '["text_generation", "analysis", "summarization"]',
  4096, 1, 0, 0, 0
);