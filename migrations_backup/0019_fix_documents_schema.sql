-- Fix documents table schema to match API expectations
-- Add missing columns required by the documents API

-- Add download_count column
ALTER TABLE documents ADD COLUMN download_count INTEGER DEFAULT 0;

-- Add document_id as a unique identifier (UUID-style)
-- For existing records, we'll use the auto-increment id as fallback
ALTER TABLE documents ADD COLUMN document_id TEXT;

-- Update existing records with document_id based on their id
UPDATE documents SET document_id = 'doc_' || id || '_' || substr(hex(randomblob(8)), 1, 16) WHERE document_id IS NULL;

-- Add is_active column for soft deletes (maps to existing status column logic)
ALTER TABLE documents ADD COLUMN is_active INTEGER DEFAULT 1;

-- Update is_active based on existing status column
UPDATE documents SET is_active = 1 WHERE status = 'active';
UPDATE documents SET is_active = 0 WHERE status != 'active' OR status IS NULL;

-- Create index on document_id for performance
CREATE INDEX IF NOT EXISTS idx_documents_document_id ON documents(document_id);
CREATE INDEX IF NOT EXISTS idx_documents_is_active ON documents(is_active);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

-- Ensure document_id is unique going forward
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_document_id_unique ON documents(document_id) WHERE document_id IS NOT NULL;