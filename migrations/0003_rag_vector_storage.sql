-- RAG Vector Storage and Analytics Schema
-- Adds tables for vector embeddings, document chunks, and query analytics

-- Vector Documents table - stores document chunks with embeddings
CREATE TABLE IF NOT EXISTS vector_documents (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  embedding_json TEXT NOT NULL, -- JSON array of embedding vector
  source_type TEXT NOT NULL CHECK (source_type IN ('risk', 'incident', 'service', 'asset', 'document')),
  source_id TEXT NOT NULL,
  title TEXT NOT NULL,
  chunk_index INTEGER DEFAULT 0,
  total_chunks INTEGER DEFAULT 1,
  token_count INTEGER DEFAULT 0,
  metadata_json TEXT, -- Additional metadata as JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Embedding Models table - tracks embedding model configurations
CREATE TABLE IF NOT EXISTS embedding_models (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  model_name TEXT NOT NULL UNIQUE,
  model_type TEXT NOT NULL CHECK (model_type IN ('local', 'openai', 'gemini', 'anthropic')),
  dimensions INTEGER NOT NULL DEFAULT 384,
  max_tokens INTEGER DEFAULT 512,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- RAG Queries table - stores query history and analytics
CREATE TABLE IF NOT EXISTS rag_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_text TEXT NOT NULL,
  query_embedding_json TEXT, -- JSON array of query embedding
  source_types_json TEXT, -- JSON array of requested source types
  limit_count INTEGER DEFAULT 10,
  threshold_score REAL DEFAULT 0.3,
  response_time_ms INTEGER,
  results_count INTEGER DEFAULT 0,
  embedding_time_ms INTEGER DEFAULT 0,
  search_time_ms INTEGER DEFAULT 0,
  user_id INTEGER,
  session_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- RAG Query Results table - stores individual search results
CREATE TABLE IF NOT EXISTS rag_query_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_id INTEGER NOT NULL,
  document_id TEXT NOT NULL,
  similarity_score REAL NOT NULL,
  rank_position INTEGER NOT NULL,
  FOREIGN KEY (query_id) REFERENCES rag_queries(id) ON DELETE CASCADE,
  FOREIGN KEY (document_id) REFERENCES vector_documents(id) ON DELETE CASCADE
);

-- MCP Tool Executions table - tracks MCP tool usage
CREATE TABLE IF NOT EXISTS mcp_tool_executions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tool_name TEXT NOT NULL,
  parameters_json TEXT,
  execution_time_ms INTEGER,
  success BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  result_size INTEGER DEFAULT 0,
  user_id INTEGER,
  session_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Document Upload History table - tracks uploaded documents
CREATE TABLE IF NOT EXISTS document_uploads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  chunks_created INTEGER DEFAULT 0,
  processing_time_ms INTEGER,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT,
  user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- RAG System Stats table - stores system performance metrics
CREATE TABLE IF NOT EXISTS rag_system_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stat_date DATE NOT NULL,
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  metadata_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(stat_date, metric_name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vector_documents_source ON vector_documents(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_vector_documents_created ON vector_documents(created_at);
CREATE INDEX IF NOT EXISTS idx_rag_queries_created ON rag_queries(created_at);
CREATE INDEX IF NOT EXISTS idx_rag_queries_user ON rag_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_rag_query_results_query ON rag_query_results(query_id);
CREATE INDEX IF NOT EXISTS idx_rag_query_results_similarity ON rag_query_results(similarity_score DESC);
CREATE INDEX IF NOT EXISTS idx_mcp_tool_executions_created ON mcp_tool_executions(created_at);
CREATE INDEX IF NOT EXISTS idx_mcp_tool_executions_tool ON mcp_tool_executions(tool_name);
CREATE INDEX IF NOT EXISTS idx_document_uploads_status ON document_uploads(status);
CREATE INDEX IF NOT EXISTS idx_rag_system_stats_date ON rag_system_stats(stat_date, metric_name);

-- Insert default embedding model
INSERT OR IGNORE INTO embedding_models (model_name, model_type, dimensions, max_tokens, is_active) 
VALUES ('local-tfidf', 'local', 384, 512, TRUE);

-- Insert initial system stats
INSERT OR IGNORE INTO rag_system_stats (stat_date, metric_name, metric_value) 
VALUES 
  (DATE('now'), 'total_documents', 0),
  (DATE('now'), 'total_queries', 0),
  (DATE('now'), 'avg_response_time', 0),
  (DATE('now'), 'cache_hit_rate', 0);