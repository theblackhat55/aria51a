-- AI-Enhanced Compliance Module Database Enhancements
-- Migration 0108: AI Compliance Intelligence and Automation

-- AI Compliance Assessments Table
CREATE TABLE IF NOT EXISTS ai_compliance_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  control_id INTEGER NOT NULL,
  assessment_type TEXT CHECK (assessment_type IN ('gap_analysis', 'implementation_guidance', 'risk_assessment', 'evidence_review', 'maturity_scoring')) NOT NULL,
  ai_provider TEXT CHECK (ai_provider IN ('openai', 'anthropic', 'cloudflare', 'azure')) NOT NULL,
  prompt_template TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  confidence_score REAL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  assessment_data TEXT, -- JSON data with structured assessment results
  recommendations TEXT, -- AI-generated recommendations
  estimated_effort_hours INTEGER,
  estimated_cost REAL,
  priority_score INTEGER CHECK (priority_score >= 1 AND priority_score <= 10),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME, -- AI assessments have expiry for freshness
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'superseded')),
  FOREIGN KEY (control_id) REFERENCES compliance_controls(id) ON DELETE CASCADE
);

-- Control Automation Rules Table
CREATE TABLE IF NOT EXISTS control_automation_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  control_id INTEGER NOT NULL,
  rule_name TEXT NOT NULL,
  rule_type TEXT CHECK (rule_type IN ('testing', 'evidence_collection', 'monitoring', 'reporting', 'remediation')) NOT NULL,
  automation_config TEXT NOT NULL, -- JSON configuration for automation
  schedule_expression TEXT, -- Cron expression for scheduling
  is_active BOOLEAN DEFAULT true,
  last_executed DATETIME,
  next_execution DATETIME,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (control_id) REFERENCES compliance_controls(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Compliance Workflows Table
CREATE TABLE IF NOT EXISTS compliance_workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  workflow_type TEXT CHECK (workflow_type IN ('control_implementation', 'assessment', 'remediation', 'certification', 'audit_preparation')) NOT NULL,
  framework_id INTEGER,
  workflow_definition TEXT NOT NULL, -- JSON workflow definition
  current_version INTEGER DEFAULT 1,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
  created_by INTEGER,
  assigned_to INTEGER,
  due_date DATETIME,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (framework_id) REFERENCES compliance_frameworks(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Workflow Steps Table
CREATE TABLE IF NOT EXISTS workflow_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  step_description TEXT,
  step_order INTEGER NOT NULL,
  step_type TEXT CHECK (step_type IN ('manual_task', 'automated_task', 'approval', 'review', 'ai_assessment', 'notification')) NOT NULL,
  step_config TEXT, -- JSON configuration for the step
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped', 'blocked')),
  assigned_to INTEGER,
  started_at DATETIME,
  completed_at DATETIME,
  estimated_hours REAL,
  actual_hours REAL,
  output_data TEXT, -- JSON data produced by the step
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workflow_id) REFERENCES compliance_workflows(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- Compliance Maturity Scores Table
CREATE TABLE IF NOT EXISTS compliance_maturity_scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  framework_id INTEGER NOT NULL,
  organization_unit TEXT DEFAULT 'default', -- For multi-tenancy support
  maturity_dimension TEXT CHECK (maturity_dimension IN ('governance', 'processes', 'technology', 'people', 'culture', 'overall')) NOT NULL,
  score REAL CHECK (score >= 0 AND score <= 5), -- 0-5 maturity scale
  max_possible_score REAL DEFAULT 5,
  assessment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  assessment_method TEXT CHECK (assessment_method IN ('manual', 'ai_calculated', 'survey_based', 'control_based')),
  evidence_count INTEGER DEFAULT 0,
  control_coverage_percentage REAL DEFAULT 0,
  benchmark_data TEXT, -- JSON with industry benchmarks
  improvement_recommendations TEXT,
  calculated_by INTEGER,
  expires_at DATETIME,
  FOREIGN KEY (framework_id) REFERENCES compliance_frameworks(id),
  FOREIGN KEY (calculated_by) REFERENCES users(id)
);

-- Regulatory Updates Table
CREATE TABLE IF NOT EXISTS regulatory_updates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  framework_id INTEGER NOT NULL,
  update_type TEXT CHECK (update_type IN ('control_change', 'new_requirement', 'guidance_update', 'deadline_change', 'framework_version')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  effective_date DATETIME,
  impact_level TEXT CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  affected_controls TEXT, -- JSON array of control IDs
  source_url TEXT,
  regulatory_body TEXT,
  status TEXT DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'reviewed', 'implemented', 'not_applicable')),
  impact_assessment TEXT,
  action_required BOOLEAN DEFAULT false,
  reviewed_by INTEGER,
  reviewed_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (framework_id) REFERENCES compliance_frameworks(id),
  FOREIGN KEY (reviewed_by) REFERENCES users(id)
);

-- Risk-Control Mapping Enhancement Table
CREATE TABLE IF NOT EXISTS risk_control_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  control_id INTEGER NOT NULL,
  mapping_type TEXT CHECK (mapping_type IN ('mitigates', 'monitors', 'detects', 'prevents', 'responds_to')) NOT NULL,
  effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
  coverage_percentage REAL CHECK (coverage_percentage >= 0 AND coverage_percentage <= 100),
  residual_risk_reduction REAL, -- Percentage risk reduction
  mapping_confidence REAL CHECK (mapping_confidence >= 0 AND mapping_confidence <= 1),
  ai_generated BOOLEAN DEFAULT false,
  validated_by INTEGER,
  validation_date DATETIME,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE,
  FOREIGN KEY (control_id) REFERENCES compliance_controls(id) ON DELETE CASCADE,
  FOREIGN KEY (validated_by) REFERENCES users(id),
  UNIQUE(risk_id, control_id, mapping_type)
);

-- AI Vector Embeddings for Compliance Intelligence
CREATE TABLE IF NOT EXISTS compliance_embeddings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_type TEXT CHECK (content_type IN ('control', 'framework', 'evidence', 'assessment', 'guidance')) NOT NULL,
  content_id INTEGER NOT NULL,
  embedding_model TEXT NOT NULL,
  embedding_vector TEXT NOT NULL, -- JSON array of floats
  content_text TEXT NOT NULL,
  metadata TEXT, -- JSON metadata about the content
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Enhanced Indexes
CREATE INDEX IF NOT EXISTS idx_ai_assessments_control ON ai_compliance_assessments(control_id);
CREATE INDEX IF NOT EXISTS idx_ai_assessments_type ON ai_compliance_assessments(assessment_type);
CREATE INDEX IF NOT EXISTS idx_ai_assessments_status ON ai_compliance_assessments(status);
CREATE INDEX IF NOT EXISTS idx_automation_rules_control ON control_automation_rules(control_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active ON control_automation_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_workflows_framework ON compliance_workflows(framework_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON compliance_workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow ON workflow_steps(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_status ON workflow_steps(status);
CREATE INDEX IF NOT EXISTS idx_maturity_scores_framework ON compliance_maturity_scores(framework_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_framework ON regulatory_updates(framework_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_status ON regulatory_updates(status);
CREATE INDEX IF NOT EXISTS idx_risk_control_mappings_risk ON risk_control_mappings(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_control_mappings_control ON risk_control_mappings(control_id);
CREATE INDEX IF NOT EXISTS idx_compliance_embeddings_content ON compliance_embeddings(content_type, content_id);