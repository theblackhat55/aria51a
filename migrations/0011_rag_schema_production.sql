-- RAG Schema for Production Database
-- This migration creates the RAG system tables that were missing from production

-- System Configuration table (needed for RAG settings)
CREATE TABLE IF NOT EXISTS system_configuration (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI Chat History table
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_id TEXT,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  message_type TEXT DEFAULT 'chat',
  processing_time_ms INTEGER,
  model_used TEXT,
  confidence_score REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- RAG Documents table - Main document storage
CREATE TABLE IF NOT EXISTS rag_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  file_path TEXT,
  document_type TEXT,
  embedding_status TEXT DEFAULT 'pending',
  chunk_count INTEGER DEFAULT 0,
  metadata TEXT, -- JSON
  uploaded_by INTEGER,
  organization_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Document Chunks for RAG (for vector embeddings)
CREATE TABLE IF NOT EXISTS document_chunks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding TEXT, -- JSON array of floats
  metadata TEXT, -- JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (document_id) REFERENCES rag_documents(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_config_key ON system_configuration(key);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_user ON ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_session ON ai_chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_history_type ON ai_chat_history(message_type);

CREATE INDEX IF NOT EXISTS idx_rag_documents_type ON rag_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_rag_documents_org ON rag_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_rag_documents_status ON rag_documents(embedding_status);
CREATE INDEX IF NOT EXISTS idx_rag_documents_uploaded_by ON rag_documents(uploaded_by);

CREATE INDEX IF NOT EXISTS idx_document_chunks_doc ON document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_idx ON document_chunks(chunk_index);