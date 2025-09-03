-- Compliance Frameworks Migration
-- Support for ISO 27001, UAE ISR, and other compliance frameworks

-- Frameworks table to store different compliance frameworks
CREATE TABLE IF NOT EXISTS frameworks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL, -- e.g., 'ISO27001', 'UAE_ISR'
  version TEXT,
  description TEXT,
  effective_date DATE,
  is_active BOOLEAN DEFAULT 1,
  framework_type TEXT CHECK (framework_type IN ('standard', 'regulation', 'guideline', 'custom')) DEFAULT 'standard',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Framework controls table to store individual controls within frameworks
CREATE TABLE IF NOT EXISTS framework_controls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  framework_id INTEGER NOT NULL,
  
  -- Common fields
  control_ref TEXT NOT NULL, -- e.g., 'A 5.1', 'M1.1.1'
  control_title TEXT NOT NULL,
  control_description TEXT,
  
  -- Hierarchical organization
  section_name TEXT, -- For ISO: 'Organizational Controls', for UAE: Domain Name
  section_ref TEXT,  -- For UAE: Domain Ref like 'M1'
  subsection_name TEXT, -- For UAE: Sub-domain Name
  subsection_ref TEXT,  -- For UAE: Sub-domain Ref like 'M1.1'
  
  -- Control details
  implementation_guidance TEXT, -- For UAE: Sub-Control Description
  applicable BOOLEAN DEFAULT 1,
  mandatory BOOLEAN DEFAULT 1,
  
  -- Control metadata
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  control_type TEXT CHECK (control_type IN ('preventive', 'detective', 'corrective', 'compensating')) DEFAULT 'preventive',
  
  -- Legacy mapping (for version upgrades)
  legacy_ref TEXT, -- For ISO: Status in ISO 27001:2013
  
  -- Custom fields for additional metadata
  custom_fields TEXT, -- JSON object for additional framework-specific data
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (framework_id) REFERENCES frameworks(id) ON DELETE CASCADE,
  UNIQUE(framework_id, control_ref)
);

-- Framework assessments - links controls to compliance assessments
CREATE TABLE IF NOT EXISTS framework_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  framework_id INTEGER NOT NULL,
  assessment_name TEXT NOT NULL,
  assessment_description TEXT,
  
  -- Assessment metadata
  assessment_type TEXT CHECK (assessment_type IN ('gap_analysis', 'maturity', 'certification', 'internal_audit')) DEFAULT 'gap_analysis',
  assessment_status TEXT CHECK (assessment_status IN ('planned', 'in_progress', 'completed', 'cancelled')) DEFAULT 'planned',
  
  -- Assessment timeline
  start_date DATE,
  target_completion_date DATE,
  actual_completion_date DATE,
  
  -- Assessment team
  lead_assessor_id INTEGER,
  assessment_team TEXT, -- JSON array of user IDs
  
  -- Overall scoring
  total_controls INTEGER DEFAULT 0,
  compliant_controls INTEGER DEFAULT 0,
  non_compliant_controls INTEGER DEFAULT 0,
  not_applicable_controls INTEGER DEFAULT 0,
  overall_score REAL DEFAULT 0.0,
  maturity_level TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (framework_id) REFERENCES frameworks(id) ON DELETE CASCADE,
  FOREIGN KEY (lead_assessor_id) REFERENCES users(id)
);

-- Control assessments - individual control compliance status
CREATE TABLE IF NOT EXISTS control_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  framework_assessment_id INTEGER NOT NULL,
  framework_control_id INTEGER NOT NULL,
  
  -- Compliance status
  compliance_status TEXT CHECK (compliance_status IN ('compliant', 'partial', 'non_compliant', 'not_applicable', 'not_assessed')) DEFAULT 'not_assessed',
  implementation_status TEXT CHECK (implementation_status IN ('not_started', 'planned', 'in_progress', 'implemented', 'verified')) DEFAULT 'not_started',
  
  -- Assessment details
  evidence_description TEXT,
  evidence_files TEXT, -- JSON array of file references
  implementation_notes TEXT,
  gaps_identified TEXT,
  remediation_plan TEXT,
  remediation_priority TEXT CHECK (remediation_priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  
  -- Timeline
  assessment_date DATE,
  target_implementation_date DATE,
  actual_implementation_date DATE,
  next_review_date DATE,
  
  -- Scoring
  control_score REAL DEFAULT 0.0,
  maturity_score INTEGER DEFAULT 0, -- 0-5 scale
  
  -- Assignment
  assigned_to_id INTEGER,
  verified_by_id INTEGER,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (framework_assessment_id) REFERENCES framework_assessments(id) ON DELETE CASCADE,
  FOREIGN KEY (framework_control_id) REFERENCES framework_controls(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to_id) REFERENCES users(id),
  FOREIGN KEY (verified_by_id) REFERENCES users(id),
  UNIQUE(framework_assessment_id, framework_control_id)
);

-- Framework control relationships (for controls that relate to each other)
CREATE TABLE IF NOT EXISTS control_relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_control_id INTEGER NOT NULL,
  target_control_id INTEGER NOT NULL,
  relationship_type TEXT CHECK (relationship_type IN ('depends_on', 'supports', 'conflicts_with', 'duplicates')) DEFAULT 'supports',
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (source_control_id) REFERENCES framework_controls(id) ON DELETE CASCADE,
  FOREIGN KEY (target_control_id) REFERENCES framework_controls(id) ON DELETE CASCADE,
  UNIQUE(source_control_id, target_control_id, relationship_type)
);

-- Framework control mappings to risks and assets
CREATE TABLE IF NOT EXISTS control_risk_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  framework_control_id INTEGER NOT NULL,
  risk_id INTEGER NOT NULL,
  mapping_type TEXT CHECK (mapping_type IN ('mitigates', 'addresses', 'monitors')) DEFAULT 'mitigates',
  effectiveness_rating TEXT CHECK (effectiveness_rating IN ('low', 'medium', 'high')) DEFAULT 'medium',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (framework_control_id) REFERENCES framework_controls(id) ON DELETE CASCADE,
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE,
  UNIQUE(framework_control_id, risk_id)
);

CREATE TABLE IF NOT EXISTS control_asset_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  framework_control_id INTEGER NOT NULL,
  asset_id INTEGER NOT NULL,
  applicability TEXT CHECK (applicability IN ('applicable', 'not_applicable', 'inherited')) DEFAULT 'applicable',
  implementation_status TEXT CHECK (implementation_status IN ('not_implemented', 'partial', 'implemented')) DEFAULT 'not_implemented',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (framework_control_id) REFERENCES framework_controls(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  UNIQUE(framework_control_id, asset_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_framework_controls_framework_id ON framework_controls(framework_id);
CREATE INDEX IF NOT EXISTS idx_framework_controls_section ON framework_controls(section_name);
CREATE INDEX IF NOT EXISTS idx_framework_controls_priority ON framework_controls(priority);
CREATE INDEX IF NOT EXISTS idx_framework_assessments_framework_id ON framework_assessments(framework_id);
CREATE INDEX IF NOT EXISTS idx_framework_assessments_status ON framework_assessments(assessment_status);
CREATE INDEX IF NOT EXISTS idx_control_assessments_framework_assessment_id ON control_assessments(framework_assessment_id);
CREATE INDEX IF NOT EXISTS idx_control_assessments_compliance_status ON control_assessments(compliance_status);
CREATE INDEX IF NOT EXISTS idx_control_assessments_assigned_to ON control_assessments(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_control_risk_mappings_control_id ON control_risk_mappings(framework_control_id);
CREATE INDEX IF NOT EXISTS idx_control_risk_mappings_risk_id ON control_risk_mappings(risk_id);
CREATE INDEX IF NOT EXISTS idx_control_asset_mappings_control_id ON control_asset_mappings(framework_control_id);
CREATE INDEX IF NOT EXISTS idx_control_asset_mappings_asset_id ON control_asset_mappings(asset_id);

-- Insert default frameworks
INSERT OR IGNORE INTO frameworks (name, code, version, description, effective_date, framework_type) VALUES 
('ISO/IEC 27001:2022', 'ISO27001', '2022', 'Information security management systems - Requirements', '2022-10-01', 'standard'),
('UAE Information Assurance Standard', 'UAE_ISR', '2.0', 'UAE Information Assurance Standard for Information Security Requirements', '2021-01-01', 'regulation');