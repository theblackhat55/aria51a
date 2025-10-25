-- Compliance DDD Domain Tables
-- Week 4: ComplianceFramework, Control, Assessment entities

-- Compliance Frameworks Table
CREATE TABLE IF NOT EXISTS compliance_frameworks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,  -- nist_csf, iso_27001, soc_2, gdpr, hipaa, pci_dss, etc.
  version TEXT NOT NULL,
  description TEXT NOT NULL,
  scope TEXT,
  target_completion_date DATETIME,
  certification_date DATETIME,
  expiry_date DATETIME,
  is_active INTEGER DEFAULT 1,
  total_controls INTEGER DEFAULT 0,
  implemented_controls INTEGER DEFAULT 0,
  organization_id INTEGER NOT NULL,
  owner_id INTEGER,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Compliance Controls Table
CREATE TABLE IF NOT EXISTS compliance_controls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  framework_id INTEGER NOT NULL,
  control_id TEXT NOT NULL,  -- e.g., "AC-1", "PR.AC-1"
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'not_implemented',  -- not_implemented, planned, partially_implemented, implemented, tested, verified, operational, decommissioned
  implementation_notes TEXT,
  assigned_to INTEGER,
  evidence_required INTEGER DEFAULT 1,
  testing_required INTEGER DEFAULT 1,
  priority TEXT DEFAULT 'medium',  -- critical, high, medium, low
  implementation_date DATETIME,
  last_assessed_date DATETIME,
  next_assessment_date DATETIME,
  organization_id INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (framework_id) REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Compliance Assessments Table
CREATE TABLE IF NOT EXISTS compliance_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  control_id INTEGER NOT NULL,
  framework_id INTEGER NOT NULL,
  assessment_date DATETIME NOT NULL,
  assessor TEXT NOT NULL,
  assessor_id INTEGER,
  result TEXT NOT NULL,  -- compliant, partially_compliant, non_compliant, not_applicable, not_assessed
  score INTEGER,
  findings TEXT,
  recommendations TEXT,
  evidence_ids TEXT,  -- JSON array of evidence IDs
  remediation_required INTEGER DEFAULT 0,
  remediation_deadline DATETIME,
  remediation_completed_date DATETIME,
  next_assessment_date DATETIME,
  organization_id INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (control_id) REFERENCES compliance_controls(id) ON DELETE CASCADE,
  FOREIGN KEY (framework_id) REFERENCES compliance_frameworks(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (assessor_id) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_compliance_frameworks_org ON compliance_frameworks(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_frameworks_type ON compliance_frameworks(type);
CREATE INDEX IF NOT EXISTS idx_compliance_frameworks_active ON compliance_frameworks(is_active);

CREATE INDEX IF NOT EXISTS idx_compliance_controls_framework ON compliance_controls(framework_id);
CREATE INDEX IF NOT EXISTS idx_compliance_controls_org ON compliance_controls(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_controls_status ON compliance_controls(status);
CREATE INDEX IF NOT EXISTS idx_compliance_controls_assigned ON compliance_controls(assigned_to);

CREATE INDEX IF NOT EXISTS idx_compliance_assessments_control ON compliance_assessments(control_id);
CREATE INDEX IF NOT EXISTS idx_compliance_assessments_framework ON compliance_assessments(framework_id);
CREATE INDEX IF NOT EXISTS idx_compliance_assessments_org ON compliance_assessments(organization_id);
CREATE INDEX IF NOT EXISTS idx_compliance_assessments_result ON compliance_assessments(result);
