-- Add RAG (Retrieval-Augmented Generation) columns to documents table
-- These columns enable document search and AI-powered content retrieval

-- Add RAG indexing status and metadata
ALTER TABLE documents ADD COLUMN rag_indexed INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN rag_chunks INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN rag_indexed_at DATETIME;
ALTER TABLE documents ADD COLUMN rag_error TEXT;

-- Add search and content analysis columns
ALTER TABLE documents ADD COLUMN content_summary TEXT;
ALTER TABLE documents ADD COLUMN extracted_text TEXT;
ALTER TABLE documents ADD COLUMN search_keywords TEXT;

-- Create indexes for efficient RAG queries
CREATE INDEX IF NOT EXISTS idx_documents_rag_indexed ON documents(rag_indexed);
CREATE INDEX IF NOT EXISTS idx_documents_search_keywords ON documents(search_keywords);
CREATE INDEX IF NOT EXISTS idx_documents_content_type ON documents(document_type, rag_indexed);

-- Create search analytics table for tracking RAG search queries
CREATE TABLE IF NOT EXISTS search_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  search_query TEXT NOT NULL,
  results_count INTEGER DEFAULT 0,
  search_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create index for search analytics
CREATE INDEX IF NOT EXISTS idx_search_analytics_user_date ON search_analytics(user_id, search_date);
CREATE INDEX IF NOT EXISTS idx_search_analytics_query ON search_analytics(search_query);