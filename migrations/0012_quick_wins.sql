-- Quick Wins Migration: SoA, Treatments, Exceptions, KRIs, Evidence, Residual Risk
-- Safe to re-run: uses IF NOT EXISTS and INSERT OR IGNORE where applicable

-- 1) Control Catalog for standards (ISO 27001:2022 Annex A, NIST 800-53)
CREATE TABLE IF NOT EXISTS control_catalog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  framework TEXT NOT NULL,            -- 'ISO27001:2022' | 'NIST800-53'
  external_id TEXT NOT NULL,          -- e.g., 'A.5.1', 'AC-2'
  title TEXT NOT NULL,
  description TEXT,
  UNIQUE(framework, external_id)
);

-- 2) Mapping internal controls to external catalog
CREATE TABLE IF NOT EXISTS control_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  internal_control_id INTEGER NOT NULL, -- references controls.id
  catalog_id INTEGER NOT NULL,          -- references control_catalog.id
  UNIQUE(internal_control_id, catalog_id),
  FOREIGN KEY (internal_control_id) REFERENCES controls(id),
  FOREIGN KEY (catalog_id) REFERENCES control_catalog(id)
);

-- 3) Statement of Applicability (SoA)
CREATE TABLE IF NOT EXISTS statement_of_applicability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  catalog_id INTEGER NOT NULL,        -- references control_catalog.id
  organization_id INTEGER,            -- optional scope
  included BOOLEAN NOT NULL DEFAULT 1,
  implementation_status TEXT,         -- planned | in_progress | implemented | not_applicable
  effectiveness TEXT,                 -- effective | partially_effective | ineffective | not_tested
  justification TEXT,
  evidence_refs TEXT,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(catalog_id, organization_id),
  FOREIGN KEY (catalog_id) REFERENCES control_catalog(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- 4) Risk Treatment Plans
CREATE TABLE IF NOT EXISTS risk_treatments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  strategy TEXT NOT NULL,             -- accept | avoid | mitigate | transfer
  actions TEXT,                       -- JSON or text plan
  owner_id INTEGER,
  budget REAL,
  start_date DATE,
  due_date DATE,
  status TEXT DEFAULT 'planning',     -- planning | in_progress | completed | on_hold
  approval_status TEXT,               -- pending | approved | rejected
  approved_by INTEGER,
  approved_at DATETIME,
  acceptance_justification TEXT,
  acceptance_expiry DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (risk_id) REFERENCES risks(id),
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

-- 5) Risk Exceptions / Control Waivers
CREATE TABLE IF NOT EXISTS risk_exceptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  control_id INTEGER NOT NULL,
  risk_id INTEGER,
  justification TEXT NOT NULL,
  approver_id INTEGER,
  expiry_date DATE,
  status TEXT DEFAULT 'active',      -- active | expired | revoked
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (control_id) REFERENCES controls(id),
  FOREIGN KEY (risk_id) REFERENCES risks(id),
  FOREIGN KEY (approver_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 6) Evidence Management
CREATE TABLE IF NOT EXISTS evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT,                          -- policy, screenshot, log, report, ticket, etc.
  description TEXT,
  file_url TEXT,                      -- external URL or object storage
  related_control_id INTEGER,
  related_assessment_id INTEGER,
  related_finding_id INTEGER,
  related_soa_id INTEGER,
  collected_at DATETIME,
  collected_by INTEGER,
  retention_until DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (related_control_id) REFERENCES controls(id),
  FOREIGN KEY (related_assessment_id) REFERENCES compliance_assessments(id),
  FOREIGN KEY (related_finding_id) REFERENCES assessment_findings(id),
  FOREIGN KEY (related_soa_id) REFERENCES statement_of_applicability(id),
  FOREIGN KEY (collected_by) REFERENCES users(id)
);

-- 7) Key Risk Indicators (KRIs)
CREATE TABLE IF NOT EXISTS kris (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  data_source TEXT,
  threshold REAL NOT NULL,
  direction TEXT NOT NULL,            -- 'above_is_bad' | 'below_is_bad'
  frequency TEXT,                     -- daily | weekly | monthly | realtime
  unit TEXT                           -- %, count, days, etc.
);

CREATE TABLE IF NOT EXISTS kri_readings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kri_id INTEGER NOT NULL,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  value REAL NOT NULL,
  status TEXT,                        -- ok | breached | warning
  FOREIGN KEY (kri_id) REFERENCES kris(id)
);

-- 8) Residual Risk and related fields on risks
ALTER TABLE risks ADD COLUMN residual_score INTEGER;
ALTER TABLE risks ADD COLUMN control_effectiveness TEXT; -- effective | partial | ineffective | not_assessed

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_control_mappings_internal ON control_mappings(internal_control_id);
CREATE INDEX IF NOT EXISTS idx_soa_catalog ON statement_of_applicability(catalog_id);
CREATE INDEX IF NOT EXISTS idx_risk_treatments_risk ON risk_treatments(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_exceptions_control ON risk_exceptions(control_id);
CREATE INDEX IF NOT EXISTS idx_evidence_control ON evidence(related_control_id);
CREATE INDEX IF NOT EXISTS idx_kri_readings_kri_time ON kri_readings(kri_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_risks_residual ON risks(residual_score);

-- Seed minimal catalog and mappings (safe in existing env)
INSERT OR IGNORE INTO control_catalog (framework, external_id, title, description) VALUES
  ('ISO27001:2022', 'A.5.1', 'Policies for information security', 'Define roles and responsibilities for information security policies.'),
  ('ISO27001:2022', 'A.5.17', 'Authentication information', 'Manage authentication information securely.'),
  ('ISO27001:2022', 'A.8.23', 'Information security for use of cloud services', 'Ensure security of cloud services usage.'),
  ('NIST800-53', 'AC-2', 'Account Management', 'Manage information system accounts.'),
  ('NIST800-53', 'IR-4', 'Incident Handling', 'Establish incident handling capability.');

-- Map a few internal controls (IDs 1..5 exist from seed)
INSERT OR IGNORE INTO control_mappings (internal_control_id, catalog_id)
  SELECT 1, cc.id FROM control_catalog cc WHERE (cc.framework='ISO27001:2022' AND cc.external_id='A.5.17');
INSERT OR IGNORE INTO control_mappings (internal_control_id, catalog_id)
  SELECT 3, cc.id FROM control_catalog cc WHERE (cc.framework='NIST800-53' AND cc.external_id='IR-4');
INSERT OR IGNORE INTO control_mappings (internal_control_id, catalog_id)
  SELECT 2, cc.id FROM control_catalog cc WHERE (cc.framework='ISO27001:2022' AND cc.external_id='A.5.1');
INSERT OR IGNORE INTO control_mappings (internal_control_id, catalog_id)
  SELECT 4, cc.id FROM control_catalog cc WHERE (cc.framework='ISO27001:2022' AND cc.external_id='A.8.23');

-- Initial SoA entries for organization 1
INSERT OR IGNORE INTO statement_of_applicability (catalog_id, organization_id, included, implementation_status, effectiveness, justification)
  SELECT cc.id, 1, 1, 'implemented', 'effective', 'Applicable to scope and implemented' FROM control_catalog cc WHERE cc.external_id IN ('A.5.1','A.5.17','IR-4');

-- KRIs and sample readings
INSERT OR IGNORE INTO kris (id, name, description, data_source, threshold, direction, frequency, unit) VALUES
  (1, 'Open High Findings', 'Count of high severity open audit findings', 'assessment_findings', 3, 'above_is_bad', 'weekly', 'count'),
  (2, 'Critical Incidents (30d)', 'Critical or high incidents last 30 days', 'incidents', 1, 'above_is_bad', 'weekly', 'count');

INSERT OR IGNORE INTO kri_readings (kri_id, timestamp, value, status) VALUES
  (1, datetime('now','-7 days'), 2, 'ok'),
  (1, datetime('now','-1 days'), 4, 'breached'),
  (2, datetime('now','-10 days'), 0, 'ok'),
  (2, datetime('now','-1 days'), 1, 'ok');

-- Evidence example
INSERT OR IGNORE INTO evidence (type, description, file_url, related_control_id, collected_at)
  VALUES ('policy', 'Information Security Policy v1.2', 'https://example.com/policy/infosec-v1.2.pdf', 2, datetime('now','-15 days'));

-- Initialize residual_score where null to current risk_score
UPDATE risks SET residual_score = COALESCE(residual_score, risk_score);
