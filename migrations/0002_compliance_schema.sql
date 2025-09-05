-- Compliance Framework Database Schema
-- This migration creates the complete compliance management structure

-- Compliance Frameworks table
CREATE TABLE IF NOT EXISTS compliance_frameworks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  version TEXT,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('standard', 'custom', 'regulatory')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Controls table - individual controls within frameworks
CREATE TABLE IF NOT EXISTS compliance_controls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  framework_id INTEGER NOT NULL,
  control_id TEXT NOT NULL, -- e.g., 'CC1.1', 'A.5.1.1'
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  subcategory TEXT,
  control_type TEXT CHECK (control_type IN ('preventive', 'detective', 'corrective')),
  implementation_status TEXT DEFAULT 'not_started' CHECK (implementation_status IN ('not_started', 'in_progress', 'implemented', 'tested', 'verified')),
  implementation_progress INTEGER DEFAULT 0 CHECK (implementation_progress >= 0 AND implementation_progress <= 100),
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  owner_id INTEGER,
  reviewer_id INTEGER,
  testing_frequency TEXT, -- monthly, quarterly, annually
  last_tested_date DATETIME,
  next_test_date DATETIME,
  test_status TEXT CHECK (test_status IN ('passed', 'failed', 'pending', 'not_tested')),
  applicability TEXT DEFAULT 'applicable' CHECK (applicability IN ('applicable', 'not_applicable', 'inherited')),
  justification TEXT, -- for SoA - why applicable/not applicable
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (framework_id) REFERENCES compliance_frameworks(id),
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id),
  UNIQUE(framework_id, control_id)
);

-- Evidence table - documents and proof of compliance
CREATE TABLE IF NOT EXISTS compliance_evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT,
  file_path TEXT,
  file_type TEXT, -- pdf, docx, xlsx, etc.
  file_size INTEGER,
  evidence_type TEXT CHECK (evidence_type IN ('policy', 'procedure', 'report', 'certificate', 'screenshot', 'configuration', 'training_record', 'other')),
  upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiry_date DATETIME,
  status TEXT DEFAULT 'current' CHECK (status IN ('current', 'expired', 'archived', 'pending_review')),
  uploaded_by INTEGER,
  reviewed_by INTEGER,
  review_date DATETIME,
  tags TEXT, -- JSON array of tags
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Control-Evidence mapping (many-to-many)
CREATE TABLE IF NOT EXISTS control_evidence_mapping (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  control_id INTEGER NOT NULL,
  evidence_id INTEGER NOT NULL,
  relationship_type TEXT CHECK (relationship_type IN ('implements', 'supports', 'validates', 'documents')),
  mapped_by INTEGER,
  mapped_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (control_id) REFERENCES compliance_controls(id) ON DELETE CASCADE,
  FOREIGN KEY (evidence_id) REFERENCES compliance_evidence(id) ON DELETE CASCADE,
  FOREIGN KEY (mapped_by) REFERENCES users(id),
  UNIQUE(control_id, evidence_id)
);

-- Control Testing Results
CREATE TABLE IF NOT EXISTS control_tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  control_id INTEGER NOT NULL,
  test_date DATETIME NOT NULL,
  test_type TEXT CHECK (test_type IN ('walkthrough', 'inquiry', 'observation', 'inspection', 'reperformance')),
  test_result TEXT CHECK (test_result IN ('passed', 'failed', 'deficient', 'not_applicable')),
  tester_id INTEGER,
  reviewer_id INTEGER,
  test_description TEXT,
  findings TEXT,
  recommendations TEXT,
  evidence_reviewed TEXT, -- list of evidence IDs reviewed
  next_test_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (control_id) REFERENCES compliance_controls(id),
  FOREIGN KEY (tester_id) REFERENCES users(id),
  FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

-- Compliance Assessments (SOC 2 exams, ISO audits, etc.)
CREATE TABLE IF NOT EXISTS compliance_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  framework_id INTEGER NOT NULL,
  assessment_type TEXT CHECK (assessment_type IN ('internal_audit', 'external_audit', 'self_assessment', 'certification', 'surveillance')),
  title TEXT NOT NULL,
  description TEXT,
  assessor TEXT, -- external auditor name/company
  start_date DATETIME,
  end_date DATETIME,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'cancelled')),
  overall_result TEXT CHECK (overall_result IN ('passed', 'failed', 'qualified_opinion', 'pending')),
  scope TEXT, -- which controls/areas are included
  findings_count INTEGER DEFAULT 0,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (framework_id) REFERENCES compliance_frameworks(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Assessment Findings
CREATE TABLE IF NOT EXISTS assessment_findings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  assessment_id INTEGER NOT NULL,
  control_id INTEGER,
  finding_type TEXT CHECK (finding_type IN ('deficiency', 'significant_deficiency', 'material_weakness', 'observation', 'recommendation')),
  severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT,
  impact TEXT,
  recommendation TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'accepted_risk')),
  due_date DATETIME,
  assigned_to INTEGER,
  resolved_date DATETIME,
  resolution_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assessment_id) REFERENCES compliance_assessments(id),
  FOREIGN KEY (control_id) REFERENCES compliance_controls(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_controls_framework ON compliance_controls(framework_id);
CREATE INDEX IF NOT EXISTS idx_controls_status ON compliance_controls(implementation_status);
CREATE INDEX IF NOT EXISTS idx_controls_owner ON compliance_controls(owner_id);
CREATE INDEX IF NOT EXISTS idx_evidence_type ON compliance_evidence(evidence_type);
CREATE INDEX IF NOT EXISTS idx_evidence_status ON compliance_evidence(status);
CREATE INDEX IF NOT EXISTS idx_tests_control ON control_tests(control_id);
CREATE INDEX IF NOT EXISTS idx_tests_date ON control_tests(test_date);
CREATE INDEX IF NOT EXISTS idx_assessments_framework ON compliance_assessments(framework_id);
CREATE INDEX IF NOT EXISTS idx_findings_assessment ON assessment_findings(assessment_id);