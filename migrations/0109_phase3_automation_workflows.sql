-- Phase 3: Advanced Compliance Automation & Orchestration
-- Migration: Enhanced workflow automation and continuous monitoring

-- Enhanced Compliance Workflows table with advanced automation
CREATE TABLE IF NOT EXISTS compliance_workflows_advanced (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  workflow_id TEXT UNIQUE NOT NULL, -- Workflow identifier
  framework_id INTEGER NOT NULL,
  workflow_type TEXT NOT NULL CHECK (workflow_type IN ('assessment', 'remediation', 'monitoring', 'certification', 'audit_prep')),
  name TEXT NOT NULL,
  description TEXT,
  
  -- Automation Configuration
  is_automated BOOLEAN DEFAULT 0,
  automation_level TEXT DEFAULT 'manual' CHECK (automation_level IN ('manual', 'semi_automated', 'fully_automated')),
  trigger_conditions JSON, -- Conditions that trigger workflow
  schedule_cron TEXT, -- Cron expression for scheduled workflows
  
  -- Workflow Definition
  workflow_steps JSON NOT NULL, -- Array of workflow steps with automation rules
  approval_required BOOLEAN DEFAULT 0,
  approver_roles JSON, -- Array of roles that can approve
  
  -- AI Integration
  ai_enabled BOOLEAN DEFAULT 0,
  ai_confidence_threshold REAL DEFAULT 0.8,
  ai_decision_rules JSON, -- Rules for AI-driven decisions
  
  -- Monitoring & Alerts
  monitoring_enabled BOOLEAN DEFAULT 1,
  alert_thresholds JSON, -- Threshold configurations for alerts
  notification_channels JSON, -- Email, Slack, etc.
  
  -- Status & Metadata
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  version INTEGER DEFAULT 1,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (framework_id) REFERENCES compliance_frameworks(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Workflow Executions with detailed tracking
CREATE TABLE IF NOT EXISTS compliance_workflow_executions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  execution_id TEXT UNIQUE NOT NULL,
  workflow_id INTEGER NOT NULL,
  
  -- Execution Context
  triggered_by TEXT NOT NULL CHECK (triggered_by IN ('manual', 'scheduled', 'event', 'ai_recommendation')),
  trigger_data JSON, -- Data that triggered the execution
  execution_context JSON, -- Context data for execution
  
  -- Execution Status
  status TEXT DEFAULT 'running' CHECK (status IN ('pending', 'running', 'waiting_approval', 'completed', 'failed', 'cancelled')),
  current_step INTEGER DEFAULT 1,
  total_steps INTEGER,
  
  -- Results & Outputs
  execution_results JSON, -- Results from each step
  outputs JSON, -- Final outputs/artifacts
  error_logs JSON, -- Error details if failed
  
  -- Performance Metrics
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  duration_seconds INTEGER,
  
  -- AI Insights
  ai_confidence_scores JSON, -- AI confidence per step
  ai_recommendations JSON, -- AI recommendations generated
  
  FOREIGN KEY (workflow_id) REFERENCES compliance_workflows_advanced(id)
);

-- Automated Control Tests with enhanced capabilities
CREATE TABLE IF NOT EXISTS compliance_automated_tests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  test_id TEXT UNIQUE NOT NULL,
  control_id INTEGER NOT NULL,
  
  -- Test Configuration
  test_name TEXT NOT NULL,
  test_type TEXT NOT NULL CHECK (test_type IN ('technical', 'process', 'documentation', 'behavioral', 'continuous')),
  test_method TEXT NOT NULL CHECK (test_method IN ('automated_scan', 'api_validation', 'file_check', 'log_analysis', 'survey', 'ai_assessment')),
  
  -- Automation Details
  automation_script JSON, -- Script or configuration for automated execution
  test_parameters JSON, -- Parameters for test execution
  expected_results JSON, -- Expected outcomes
  pass_criteria JSON, -- Criteria for pass/fail determination
  
  -- Scheduling
  frequency TEXT NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('continuous', 'daily', 'weekly', 'monthly', 'quarterly', 'annually')),
  schedule_cron TEXT,
  next_execution DATETIME,
  
  -- AI Integration
  ai_interpretation BOOLEAN DEFAULT 0,
  ai_evidence_collection BOOLEAN DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (control_id) REFERENCES compliance_controls(id)
);

-- Test Execution Results
CREATE TABLE IF NOT EXISTS compliance_test_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  result_id TEXT UNIQUE NOT NULL,
  test_id INTEGER NOT NULL,
  execution_id INTEGER, -- Links to workflow execution if applicable
  
  -- Execution Details
  executed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  executed_by TEXT, -- 'system' for automated, user ID for manual
  execution_context JSON,
  
  -- Results
  status TEXT NOT NULL CHECK (status IN ('pass', 'fail', 'warning', 'not_applicable', 'error')),
  test_results JSON NOT NULL, -- Detailed test results
  evidence_collected JSON, -- Evidence gathered during test
  
  -- AI Analysis
  ai_analysis JSON, -- AI interpretation of results
  confidence_score REAL,
  risk_indicators JSON,
  
  -- Recommendations
  recommendations JSON, -- Remediation recommendations
  next_test_date DATETIME,
  
  FOREIGN KEY (test_id) REFERENCES compliance_automated_tests(id),
  FOREIGN KEY (execution_id) REFERENCES compliance_workflow_executions(id)
);

-- Continuous Monitoring Rules
CREATE TABLE IF NOT EXISTS compliance_monitoring_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_id TEXT UNIQUE NOT NULL,
  framework_id INTEGER NOT NULL,
  control_ids JSON, -- Array of control IDs this rule monitors
  
  -- Rule Definition
  rule_name TEXT NOT NULL,
  rule_description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('threshold', 'anomaly', 'compliance_drift', 'certification_expiry', 'control_failure')),
  
  -- Monitoring Configuration
  monitoring_query JSON NOT NULL, -- Query/check configuration
  check_frequency INTEGER DEFAULT 3600, -- Seconds between checks
  baseline_data JSON, -- Baseline for comparison
  
  -- Alert Configuration
  alert_conditions JSON NOT NULL, -- Conditions that trigger alerts
  severity_levels JSON, -- Severity mapping
  escalation_rules JSON, -- Escalation configuration
  
  -- AI Enhancement
  ai_anomaly_detection BOOLEAN DEFAULT 0,
  ai_learning_enabled BOOLEAN DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (framework_id) REFERENCES compliance_frameworks(id)
);

-- Monitoring Alerts and Notifications
CREATE TABLE IF NOT EXISTS compliance_monitoring_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_id TEXT UNIQUE NOT NULL,
  rule_id INTEGER NOT NULL,
  
  -- Alert Details
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Alert Data
  trigger_data JSON NOT NULL, -- Data that triggered the alert
  affected_controls JSON, -- Controls affected by this alert
  risk_assessment JSON, -- Risk impact assessment
  
  -- AI Insights
  ai_analysis JSON, -- AI analysis of the alert
  suggested_actions JSON, -- AI-recommended actions
  
  -- Status Tracking
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'investigating', 'resolved', 'false_positive')),
  acknowledged_by INTEGER,
  acknowledged_at DATETIME,
  resolved_by INTEGER,
  resolved_at DATETIME,
  resolution_notes TEXT,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (rule_id) REFERENCES compliance_monitoring_rules(id),
  FOREIGN KEY (acknowledged_by) REFERENCES users(id),
  FOREIGN KEY (resolved_by) REFERENCES users(id)
);

-- Automated Evidence Collection
CREATE TABLE IF NOT EXISTS compliance_evidence_collection (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  collection_id TEXT UNIQUE NOT NULL,
  control_id INTEGER NOT NULL,
  
  -- Collection Configuration
  collection_name TEXT NOT NULL,
  evidence_type TEXT NOT NULL,
  collection_method TEXT NOT NULL CHECK (collection_method IN ('file_system', 'api_call', 'database_query', 'log_analysis', 'screenshot', 'document_scan')),
  
  -- Automation Configuration
  collection_script JSON, -- Script or configuration for collection
  collection_parameters JSON,
  file_patterns JSON, -- File patterns to collect
  api_endpoints JSON, -- API endpoints to query
  
  -- Scheduling
  frequency TEXT DEFAULT 'monthly',
  schedule_cron TEXT,
  retention_days INTEGER DEFAULT 365,
  
  -- AI Processing
  ai_classification BOOLEAN DEFAULT 0,
  ai_extraction_rules JSON, -- Rules for AI data extraction
  
  -- Status
  is_active BOOLEAN DEFAULT 1,
  last_collection DATETIME,
  next_collection DATETIME,
  
  FOREIGN KEY (control_id) REFERENCES compliance_controls(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflows_framework ON compliance_workflows_advanced(framework_id);
CREATE INDEX IF NOT EXISTS idx_workflows_status ON compliance_workflows_advanced(status);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON compliance_workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON compliance_workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_automated_tests_control ON compliance_automated_tests(control_id);
CREATE INDEX IF NOT EXISTS idx_test_results_test ON compliance_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_rules_framework ON compliance_monitoring_rules(framework_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_rule ON compliance_monitoring_alerts(rule_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_alerts_status ON compliance_monitoring_alerts(status);
CREATE INDEX IF NOT EXISTS idx_evidence_collection_control ON compliance_evidence_collection(control_id);