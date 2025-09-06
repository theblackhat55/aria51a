-- Basic seed data for production dashboard testing
-- Only essential data for dashboard metrics

-- Insert sample risks
INSERT INTO risks (title, description, category, probability, impact, status, owner, created_at, updated_at)
VALUES 
  ('SQL Injection Vulnerability', 'Potential SQL injection in user input fields', 'Technical', 4, 5, 'active', 'Security Team', datetime('now', '-5 days'), datetime('now', '-2 days')),
  ('Phishing Email Campaign', 'Increased phishing attempts targeting employees', 'Security', 3, 4, 'active', 'Security Team', datetime('now', '-7 days'), datetime('now', '-1 day')),
  ('Data Center Power Failure', 'Risk of power outage affecting primary data center', 'Infrastructure', 2, 5, 'active', 'IT Operations', datetime('now', '-10 days'), datetime('now', '-3 days')),
  ('Compliance Audit Finding', 'Minor compliance issue found during audit', 'Compliance', 3, 3, 'monitoring', 'Compliance Officer', datetime('now', '-15 days'), datetime('now', '-5 days')),
  ('Third-party Vendor Risk', 'Security assessment of new vendor required', 'Vendor', 2, 3, 'active', 'Procurement', datetime('now', '-8 days'), datetime('now', '-1 day')),
  ('Password Policy Violation', 'Users not following password complexity requirements', 'Security', 4, 3, 'active', 'HR Team', datetime('now', '-12 days'), datetime('now', '-4 days')),
  ('Network Equipment End-of-Life', 'Core network equipment reaching end of support', 'Infrastructure', 3, 4, 'active', 'Network Team', datetime('now', '-20 days'), datetime('now', '-7 days')),
  ('Insider Threat Detection', 'Suspicious user activity detected by monitoring system', 'Security', 2, 4, 'monitoring', 'Security Team', datetime('now', '-6 days'), datetime('now', '-1 day')),
  ('Backup System Failure', 'Backup system experienced intermittent failures', 'Infrastructure', 3, 5, 'mitigated', 'IT Operations', datetime('now', '-14 days'), datetime('now', '-8 days')),
  ('Social Engineering Attempt', 'Attempted social engineering attack on support staff', 'Security', 3, 3, 'active', 'Security Team', datetime('now', '-4 days'), datetime('now', '-1 day'));

-- Insert sample incidents
INSERT INTO incidents (title, description, severity, status, reported_by, assigned_to, created_at, updated_at)
VALUES 
  ('Email Server Outage', 'Primary email server experiencing downtime', 'High', 'open', 'IT Support', 'Network Team', datetime('now', '-2 hours'), datetime('now', '-1 hour')),
  ('Suspicious Login Activity', 'Multiple failed login attempts from unknown IP', 'Medium', 'open', 'Security Monitor', 'Security Team', datetime('now', '-4 hours'), datetime('now', '-3 hours')),
  ('Database Performance Issue', 'Slow query performance affecting user experience', 'Medium', 'open', 'Development Team', 'DBA Team', datetime('now', '-6 hours'), datetime('now', '-4 hours')),
  ('Malware Detection', 'Malware detected on workstation in HR department', 'High', 'resolved', 'Antivirus System', 'Security Team', datetime('now', '-1 day'), datetime('now', '-18 hours')),
  ('VPN Connection Issues', 'Remote users unable to connect to VPN', 'Medium', 'resolved', 'Help Desk', 'Network Team', datetime('now', '-1 day'), datetime('now', '-20 hours')),
  ('Website Defacement', 'Unauthorized modification to company website', 'Critical', 'closed', 'Web Admin', 'Security Team', datetime('now', '-2 days'), datetime('now', '-1 day')),
  ('Data Loss Prevention Alert', 'DLP system flagged potential data exfiltration', 'High', 'resolved', 'DLP System', 'Security Team', datetime('now', '-3 days'), datetime('now', '-2 days')),
  ('Phishing Email Reported', 'Employee reported suspicious email to security team', 'Low', 'closed', 'Employee', 'Security Team', datetime('now', '-5 days'), datetime('now', '-4 days')),
  ('System Update Failure', 'Critical security update failed on production server', 'High', 'resolved', 'System Admin', 'IT Operations', datetime('now', '-7 days'), datetime('now', '-6 days'));

-- Insert some KRI data if table exists
INSERT OR IGNORE INTO kris (name, description, threshold_value, current_value, status, owner, created_at, updated_at)
VALUES 
  ('Failed Login Attempts', 'Number of failed login attempts per hour', 50, 45, 'active', 'Security Team', datetime('now', '-30 days'), datetime('now', '-1 day')),
  ('Patch Compliance Rate', 'Percentage of systems with current patches', 95, 92, 'active', 'IT Operations', datetime('now', '-30 days'), datetime('now', '-2 days')),
  ('Backup Success Rate', 'Percentage of successful backup operations', 98, 99, 'active', 'IT Operations', datetime('now', '-30 days'), datetime('now', '-1 day')),
  ('Security Training Completion', 'Percentage of staff completed security training', 90, 87, 'active', 'HR Team', datetime('now', '-30 days'), datetime('now', '-3 days'));