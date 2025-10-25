-- Migration: 0119_incident_workflows.sql
-- Week 6 - Incident Workflow Automation
-- Implements automated incident response workflows based on NIST SP 800-61

CREATE TABLE IF NOT EXISTS incident_workflows (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  trigger_conditions TEXT, -- JSON: {severity: ['critical', 'high'], source: ['ms_defender'], category: ['security']}
  workflow_steps TEXT NOT NULL, -- JSON array of workflow steps
  is_active INTEGER DEFAULT 1,
  organization_id INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_workflows_org_active 
  ON incident_workflows(organization_id, is_active);

CREATE TABLE IF NOT EXISTS incident_workflow_executions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id INTEGER NOT NULL,
  workflow_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, running, completed, failed, cancelled
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 0,
  step_results TEXT, -- JSON array of step execution results
  started_at DATETIME,
  completed_at DATETIME,
  duration_seconds INTEGER,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
  FOREIGN KEY (workflow_id) REFERENCES incident_workflows(id)
);

CREATE INDEX IF NOT EXISTS idx_workflow_exec_incident 
  ON incident_workflow_executions(incident_id);

CREATE INDEX IF NOT EXISTS idx_workflow_exec_status 
  ON incident_workflow_executions(status, started_at);

CREATE TABLE IF NOT EXISTS incident_response_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id INTEGER NOT NULL,
  action_type TEXT NOT NULL, -- notify, contain, investigate, remediate, document, escalate
  description TEXT NOT NULL,
  assigned_to INTEGER,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, failed, cancelled
  priority TEXT DEFAULT 'medium', -- low, medium, high, critical
  due_date DATETIME,
  started_at DATETIME,
  completed_at DATETIME,
  duration_minutes INTEGER,
  notes TEXT,
  automation_enabled INTEGER DEFAULT 0,
  automated_result TEXT, -- JSON result from automated action
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_response_actions_incident 
  ON incident_response_actions(incident_id);

CREATE INDEX IF NOT EXISTS idx_response_actions_assigned 
  ON incident_response_actions(assigned_to, status);

CREATE INDEX IF NOT EXISTS idx_response_actions_due 
  ON incident_response_actions(due_date, status);

-- Incident evidence collection
CREATE TABLE IF NOT EXISTS incident_evidence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id INTEGER NOT NULL,
  evidence_type TEXT NOT NULL, -- log, screenshot, pcap, memory_dump, file, email, network_traffic
  file_name TEXT,
  file_path TEXT, -- R2 path or external URL
  file_size INTEGER,
  file_hash TEXT, -- SHA-256
  description TEXT,
  collected_by INTEGER,
  collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  chain_of_custody TEXT, -- JSON array of custody transfers
  is_critical INTEGER DEFAULT 0,
  tags TEXT, -- JSON array
  metadata TEXT, -- JSON: additional metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
  FOREIGN KEY (collected_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_evidence_incident 
  ON incident_evidence(incident_id, collected_at);

CREATE INDEX IF NOT EXISTS idx_evidence_type 
  ON incident_evidence(evidence_type);

-- Incident timeline for tracking all events
CREATE TABLE IF NOT EXISTS incident_timeline (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id INTEGER NOT NULL,
  event_type TEXT NOT NULL, -- created, updated, status_changed, action_added, evidence_added, comment_added
  event_description TEXT NOT NULL,
  event_data TEXT, -- JSON: additional event data
  user_id INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_timeline_incident 
  ON incident_timeline(incident_id, timestamp);

-- Incident notifications
CREATE TABLE IF NOT EXISTS incident_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id INTEGER NOT NULL,
  notification_type TEXT NOT NULL, -- email, sms, slack, teams, webhook
  recipient TEXT NOT NULL, -- email address, phone number, webhook URL, etc.
  subject TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  sent_at DATETIME,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (incident_id) REFERENCES incidents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_incident 
  ON incident_notifications(incident_id);

CREATE INDEX IF NOT EXISTS idx_notifications_status 
  ON incident_notifications(status, created_at);

-- First, ensure default system user exists for foreign key constraints
INSERT OR IGNORE INTO users (id, username, email, password_hash, first_name, last_name, role, organization_id, is_active)
VALUES (1, 'system', 'system@aria5.local', '$2a$10$dummy.hash.for.system.user', 'System', 'User', 'admin', 1, 1);

-- Insert default workflows
INSERT INTO incident_workflows (name, description, trigger_conditions, workflow_steps, organization_id, created_by)
VALUES 
(
  'Critical Incident Auto-Response',
  'Automated response workflow for critical severity incidents',
  '{"severity": ["critical"], "category": ["security"]}',
  '[
    {"id": "1", "type": "notify", "action": "Send email to security team", "parameters": {"recipients": ["security@example.com"], "template": "critical_incident"}},
    {"id": "2", "type": "investigate", "action": "Create investigation task", "parameters": {"priority": "critical", "assigned_to": "security_team"}},
    {"id": "3", "type": "contain", "action": "Isolate affected systems", "parameters": {"auto_isolate": true}},
    {"id": "4", "type": "document", "action": "Generate incident report", "parameters": {"format": "pdf"}}
  ]',
  1,
  1
),
(
  'High Severity Response',
  'Response workflow for high severity incidents',
  '{"severity": ["high"], "category": ["security"]}',
  '[
    {"id": "1", "type": "notify", "action": "Send email to security team", "parameters": {"recipients": ["security@example.com"], "template": "high_incident"}},
    {"id": "2", "type": "investigate", "action": "Create investigation task", "parameters": {"priority": "high", "assigned_to": "security_team"}}
  ]',
  1,
  1
);
