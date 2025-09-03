-- Document Management System

-- Documents table for file metadata and storage
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  file_name TEXT NOT NULL,
  original_file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  file_hash TEXT UNIQUE NOT NULL, -- SHA-256 hash for deduplication
  uploaded_by INTEGER NOT NULL,
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Document metadata
  title TEXT,
  description TEXT,
  document_type TEXT, -- 'policy', 'procedure', 'report', 'evidence', 'certificate', 'other'
  tags TEXT, -- JSON array of tags
  version TEXT DEFAULT '1.0',
  status TEXT DEFAULT 'active', -- 'active', 'archived', 'deleted'
  
  -- Access control
  visibility TEXT DEFAULT 'private', -- 'public', 'private', 'restricted'
  access_permissions TEXT, -- JSON array of user/role permissions
  
  -- Relationships
  related_entity_type TEXT, -- 'risk', 'control', 'incident', 'organization', etc.
  related_entity_id INTEGER,
  
  -- Versioning
  parent_document_id INTEGER, -- For document versions
  is_latest_version INTEGER DEFAULT 1,
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  FOREIGN KEY (parent_document_id) REFERENCES documents(id)
);

-- Document access log for audit trail
CREATE TABLE IF NOT EXISTS document_access_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL, -- 'view', 'download', 'edit', 'delete', 'share'
  ip_address TEXT,
  user_agent TEXT,
  accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (document_id) REFERENCES documents(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Document shares for external sharing
CREATE TABLE IF NOT EXISTS document_shares (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  share_token TEXT UNIQUE NOT NULL,
  shared_by INTEGER NOT NULL,
  shared_with_email TEXT,
  share_type TEXT DEFAULT 'view', -- 'view', 'download'
  expires_at DATETIME,
  password_hash TEXT, -- Optional password protection
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (document_id) REFERENCES documents(id),
  FOREIGN KEY (shared_by) REFERENCES users(id)
);

-- Document comments and annotations
CREATE TABLE IF NOT EXISTS document_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  comment TEXT NOT NULL,
  page_number INTEGER, -- For PDF annotations
  position_x REAL, -- For positional comments
  position_y REAL,
  is_resolved INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (document_id) REFERENCES documents(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Document approval workflow
CREATE TABLE IF NOT EXISTS document_approvals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  document_id INTEGER NOT NULL,
  approver_id INTEGER NOT NULL,
  approval_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approval_date DATETIME,
  comments TEXT,
  approval_level INTEGER DEFAULT 1, -- For multi-level approvals
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (document_id) REFERENCES documents(id),
  FOREIGN KEY (approver_id) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date);
CREATE INDEX IF NOT EXISTS idx_documents_file_hash ON documents(file_hash);
CREATE INDEX IF NOT EXISTS idx_documents_related_entity ON documents(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_visibility ON documents(visibility);
CREATE INDEX IF NOT EXISTS idx_document_access_log_document_id ON document_access_log(document_id);
CREATE INDEX IF NOT EXISTS idx_document_access_log_user_id ON document_access_log(user_id);
CREATE INDEX IF NOT EXISTS idx_document_shares_token ON document_shares(share_token);
CREATE INDEX IF NOT EXISTS idx_document_comments_document_id ON document_comments(document_id);
CREATE INDEX IF NOT EXISTS idx_document_approvals_document_id ON document_approvals(document_id);

-- Document categories/types can be managed through the document_type field
-- Common types: 'policy', 'procedure', 'report', 'evidence', 'certificate', 'contract', 'training', 'audit'