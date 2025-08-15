-- Notifications system tables

-- Notification templates for different workflow events
CREATE TABLE IF NOT EXISTS notification_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL, -- 'risk_created', 'risk_updated', 'risk_due', 'incident_created', etc.
  title_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  notification_channels TEXT NOT NULL DEFAULT 'in_app', -- JSON array: ['in_app', 'email', 'sms']
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- User notifications (in-app notifications)
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
  category TEXT, -- 'risk', 'incident', 'compliance', 'system'
  related_entity_type TEXT, -- 'risk', 'incident', 'control', etc.
  related_entity_id INTEGER,
  is_read INTEGER DEFAULT 0,
  is_dismissed INTEGER DEFAULT 0,
  action_url TEXT, -- URL to navigate when notification is clicked
  metadata TEXT, -- JSON metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Workflow automation rules
CREATE TABLE IF NOT EXISTS workflow_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL, -- What triggers this rule
  conditions TEXT NOT NULL, -- JSON conditions that must be met
  actions TEXT NOT NULL, -- JSON actions to perform
  is_active INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 1, -- Higher number = higher priority
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Workflow execution log
CREATE TABLE IF NOT EXISTS workflow_executions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_id INTEGER NOT NULL,
  trigger_event TEXT NOT NULL,
  trigger_data TEXT, -- JSON data that triggered the workflow
  execution_status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  actions_performed TEXT, -- JSON log of actions performed
  error_message TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (rule_id) REFERENCES workflow_rules(id)
);

-- Email queue for sending notifications
CREATE TABLE IF NOT EXISTS email_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  to_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  priority INTEGER DEFAULT 1,
  max_attempts INTEGER DEFAULT 3,
  attempts INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending', -- 'pending', 'sending', 'sent', 'failed'
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  scheduled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_workflow_rules_event_type ON workflow_rules(event_type);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_rule_id ON workflow_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);

-- Insert default notification templates
INSERT OR IGNORE INTO notification_templates (name, event_type, title_template, body_template, notification_channels) VALUES
('Risk Created', 'risk_created', 'New Risk: {{risk_title}}', 'A new risk "{{risk_title}}" has been created in {{organization}}. Risk Score: {{risk_score}}', '["in_app", "email"]'),
('Risk Updated', 'risk_updated', 'Risk Updated: {{risk_title}}', 'Risk "{{risk_title}}" has been updated. New Risk Score: {{risk_score}}', '["in_app"]'),
('High Risk Alert', 'high_risk_created', 'HIGH RISK ALERT: {{risk_title}}', 'A high-risk item "{{risk_title}}" requires immediate attention. Risk Score: {{risk_score}}', '["in_app", "email"]'),
('Risk Review Due', 'risk_review_due', 'Risk Review Due: {{risk_title}}', 'Risk "{{risk_title}}" is due for review on {{due_date}}', '["in_app", "email"]'),
('Incident Created', 'incident_created', 'New Incident: {{incident_title}}', 'A new incident "{{incident_title}}" has been reported. Severity: {{severity}}', '["in_app", "email"]'),
('Control Assessment Due', 'control_due', 'Control Assessment Due: {{control_name}}', 'Control "{{control_name}}" assessment is due on {{due_date}}', '["in_app"]'),
('Compliance Deadline', 'compliance_deadline', 'Compliance Deadline: {{framework_name}}', 'Compliance deadline for {{framework_name}} is approaching on {{deadline_date}}', '["in_app", "email"]');

-- Insert default workflow rules
INSERT OR IGNORE INTO workflow_rules (name, description, event_type, conditions, actions) VALUES
(
  'High Risk Auto-Alert',
  'Automatically alert management when high-risk items are created',
  'risk_created',
  '{"risk_score": {">=": 15}}',
  '[{"type": "notify_users", "targets": ["role:admin", "role:risk_manager"], "template": "High Risk Alert"}]'
),
(
  'Critical Risk Escalation',
  'Escalate critical risks to executives immediately',
  'risk_created',
  '{"risk_score": {">=": 20}}',
  '[{"type": "notify_users", "targets": ["role:admin"], "template": "High Risk Alert"}, {"type": "create_task", "assignee": "auto", "priority": "critical"}]'
),
(
  'Incident Response Automation',
  'Auto-notify incident response team for new incidents',
  'incident_created',
  '{"severity": {"in": ["high", "critical"]}}',
  '[{"type": "notify_users", "targets": ["department:IT", "role:incident_manager"], "template": "Incident Created"}]'
),
(
  'Risk Review Reminder',
  'Send reminders 7 days before risk reviews are due',
  'risk_review_due',
  '{"days_until_due": {"<=": 7}}',
  '[{"type": "notify_users", "targets": ["risk_owner"], "template": "Risk Review Due"}]'
);