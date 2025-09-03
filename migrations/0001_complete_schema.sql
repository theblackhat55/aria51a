-- ARIA5.1 Complete Database Schema
-- Cloudflare D1 SQLite Database

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL DEFAULT 'user',
  organization_id INTEGER,
  is_active BOOLEAN DEFAULT 1,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT,
  industry TEXT,
  size TEXT,
  country TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Risks table
CREATE TABLE IF NOT EXISTS risks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  subcategory TEXT,
  owner_id INTEGER,
  organization_id INTEGER,
  probability INTEGER CHECK (probability >= 1 AND probability <= 5),
  impact INTEGER CHECK (impact >= 1 AND impact <= 5),
  risk_score INTEGER GENERATED ALWAYS AS (probability * impact) STORED,
  inherent_risk INTEGER,
  residual_risk INTEGER,
  status TEXT NOT NULL DEFAULT 'active',
  review_date DATE,
  due_date DATE,
  source TEXT,
  affected_assets TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Risk Treatments table
CREATE TABLE IF NOT EXISTS risk_treatments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  treatment_type TEXT NOT NULL, -- mitigate, accept, transfer, avoid
  description TEXT,
  cost_estimate REAL,
  responsible_party INTEGER,
  implementation_date DATE,
  effectiveness_rating INTEGER,
  status TEXT DEFAULT 'planned',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE,
  FOREIGN KEY (responsible_party) REFERENCES users(id)
);

-- Key Risk Indicators (KRIs) table
CREATE TABLE IF NOT EXISTS kris (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER,
  name TEXT NOT NULL,
  description TEXT,
  metric_type TEXT,
  threshold_value REAL,
  current_value REAL,
  threshold_direction TEXT, -- above, below, between
  frequency TEXT, -- daily, weekly, monthly, quarterly
  owner_id INTEGER,
  status TEXT DEFAULT 'active',
  last_measured DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Compliance Frameworks table
CREATE TABLE IF NOT EXISTS compliance_frameworks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  version TEXT,
  description TEXT,
  regulatory_body TEXT,
  industry TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Framework Controls table
CREATE TABLE IF NOT EXISTS framework_controls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  framework_id INTEGER NOT NULL,
  control_id TEXT NOT NULL,
  control_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  priority TEXT,
  control_type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (framework_id) REFERENCES compliance_frameworks(id) ON DELETE CASCADE
);

-- Statement of Applicability (SoA) table
CREATE TABLE IF NOT EXISTS soa (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  organization_id INTEGER NOT NULL,
  control_id INTEGER NOT NULL,
  is_applicable BOOLEAN DEFAULT 0,
  implementation_status TEXT DEFAULT 'not_started',
  justification TEXT,
  implementation_notes TEXT,
  responsible_party INTEGER,
  review_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (control_id) REFERENCES framework_controls(id),
  FOREIGN KEY (responsible_party) REFERENCES users(id),
  UNIQUE(organization_id, control_id)
);

-- Evidence table
CREATE TABLE IF NOT EXISTS evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT, -- document, screenshot, report, certificate
  file_path TEXT,
  file_size INTEGER,
  mime_type TEXT,
  control_ids TEXT, -- JSON array of control IDs
  risk_ids TEXT, -- JSON array of risk IDs
  uploaded_by INTEGER NOT NULL,
  reviewed_by INTEGER,
  status TEXT DEFAULT 'pending',
  review_notes TEXT,
  valid_from DATE,
  valid_until DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Compliance Assessments table
CREATE TABLE IF NOT EXISTS compliance_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  framework_id INTEGER NOT NULL,
  organization_id INTEGER NOT NULL,
  assessor_id INTEGER,
  status TEXT DEFAULT 'planned',
  start_date DATE,
  end_date DATE,
  compliance_score REAL,
  findings_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (framework_id) REFERENCES compliance_frameworks(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (assessor_id) REFERENCES users(id)
);

-- Assessment Responses table
CREATE TABLE IF NOT EXISTS assessment_responses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assessment_id INTEGER NOT NULL,
  control_id INTEGER NOT NULL,
  compliance_status TEXT, -- compliant, partial, non_compliant, not_applicable
  evidence_ids TEXT, -- JSON array
  notes TEXT,
  reviewed_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assessment_id) REFERENCES compliance_assessments(id) ON DELETE CASCADE,
  FOREIGN KEY (control_id) REFERENCES framework_controls(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Incidents table
CREATE TABLE IF NOT EXISTS incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT,
  severity TEXT,
  status TEXT DEFAULT 'open',
  risk_id INTEGER,
  reported_by INTEGER,
  assigned_to INTEGER,
  organization_id INTEGER,
  detection_date DATETIME,
  resolution_date DATETIME,
  root_cause TEXT,
  impact_description TEXT,
  lessons_learned TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (risk_id) REFERENCES risks(id),
  FOREIGN KEY (reported_by) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT,
  category TEXT,
  owner_id INTEGER,
  organization_id INTEGER,
  location TEXT,
  criticality TEXT,
  value REAL,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- AI Configurations table
CREATE TABLE IF NOT EXISTS ai_configurations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL, -- openai, anthropic, gemini, local
  api_key_encrypted TEXT,
  endpoint_url TEXT,
  model_name TEXT,
  max_tokens INTEGER DEFAULT 1000,
  temperature REAL DEFAULT 0.7,
  is_active BOOLEAN DEFAULT 0,
  organization_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Chat History table
CREATE TABLE IF NOT EXISTS chat_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_id TEXT,
  message_type TEXT, -- user, assistant, system
  message TEXT NOT NULL,
  context TEXT,
  tokens_used INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- RAG Documents table
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

-- Document Chunks for RAG
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

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id INTEGER,
  old_values TEXT, -- JSON
  new_values TEXT, -- JSON
  ip_address TEXT,
  user_agent TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT,
  parameters TEXT, -- JSON
  format TEXT, -- pdf, excel, csv
  file_path TEXT,
  generated_by INTEGER,
  organization_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (generated_by) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_risks_organization ON risks(organization_id);
CREATE INDEX IF NOT EXISTS idx_risks_owner ON risks(owner_id);
CREATE INDEX IF NOT EXISTS idx_risks_status ON risks(status);
CREATE INDEX IF NOT EXISTS idx_evidence_status ON evidence(status);
CREATE INDEX IF NOT EXISTS idx_assessments_org ON compliance_assessments(organization_id);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- Create views for common queries
CREATE VIEW IF NOT EXISTS v_risk_summary AS
SELECT 
  r.id,
  r.title,
  r.risk_score,
  r.status,
  u.first_name || ' ' || u.last_name as owner_name,
  o.name as organization_name
FROM risks r
LEFT JOIN users u ON r.owner_id = u.id
LEFT JOIN organizations o ON r.organization_id = o.id;

CREATE VIEW IF NOT EXISTS v_compliance_overview AS
SELECT 
  cf.name as framework_name,
  COUNT(DISTINCT fc.id) as total_controls,
  COUNT(DISTINCT CASE WHEN s.is_applicable = 1 THEN fc.id END) as applicable_controls,
  COUNT(DISTINCT CASE WHEN s.implementation_status = 'implemented' THEN fc.id END) as implemented_controls
FROM compliance_frameworks cf
LEFT JOIN framework_controls fc ON cf.id = fc.framework_id
LEFT JOIN soa s ON fc.id = s.control_id
GROUP BY cf.id;