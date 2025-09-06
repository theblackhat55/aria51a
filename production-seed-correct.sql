-- Production seed data that matches the actual schema

-- Insert sample risks with correct schema
INSERT INTO risks (risk_id, title, description, category_id, organization_id, owner_id, status, risk_type, probability, impact, risk_score, created_by, created_at, updated_at)
VALUES 
  ('RISK-001', 'SQL Injection Vulnerability', 'Potential SQL injection in user input fields', 1, 1, 1, 'active', 'Technical', 4, 5, 20, 1, datetime('now', '-5 days'), datetime('now', '-2 days')),
  ('RISK-002', 'Phishing Email Campaign', 'Increased phishing attempts targeting employees', 1, 1, 1, 'active', 'Security', 3, 4, 12, 1, datetime('now', '-7 days'), datetime('now', '-1 day')),
  ('RISK-003', 'Data Center Power Failure', 'Risk of power outage affecting primary data center', 1, 1, 1, 'active', 'Infrastructure', 2, 5, 10, 1, datetime('now', '-10 days'), datetime('now', '-3 days')),
  ('RISK-004', 'Compliance Audit Finding', 'Minor compliance issue found during audit', 1, 1, 1, 'monitoring', 'Compliance', 3, 3, 9, 1, datetime('now', '-15 days'), datetime('now', '-5 days')),
  ('RISK-005', 'Third-party Vendor Risk', 'Security assessment of new vendor required', 1, 1, 1, 'active', 'Vendor', 2, 3, 6, 1, datetime('now', '-8 days'), datetime('now', '-1 day')),
  ('RISK-006', 'Password Policy Violation', 'Users not following password complexity requirements', 1, 1, 1, 'active', 'Security', 4, 3, 12, 1, datetime('now', '-12 days'), datetime('now', '-4 days')),
  ('RISK-007', 'Network Equipment End-of-Life', 'Core network equipment reaching end of support', 1, 1, 1, 'active', 'Infrastructure', 3, 4, 12, 1, datetime('now', '-20 days'), datetime('now', '-7 days')),
  ('RISK-008', 'Insider Threat Detection', 'Suspicious user activity detected by monitoring system', 1, 1, 1, 'monitoring', 'Security', 2, 4, 8, 1, datetime('now', '-6 days'), datetime('now', '-1 day')),
  ('RISK-009', 'Backup System Failure', 'Backup system experienced intermittent failures', 1, 1, 1, 'mitigated', 'Infrastructure', 3, 5, 15, 1, datetime('now', '-14 days'), datetime('now', '-8 days')),
  ('RISK-010', 'Social Engineering Attempt', 'Attempted social engineering attack on support staff', 1, 1, 1, 'active', 'Security', 3, 3, 9, 1, datetime('now', '-4 days'), datetime('now', '-1 day'));

-- Insert sample incidents (check incidents table schema first - simplified version)
INSERT OR IGNORE INTO incidents (title, description, severity, status, created_at, updated_at)
VALUES 
  ('Email Server Outage', 'Primary email server experiencing downtime', 'High', 'open', datetime('now', '-2 hours'), datetime('now', '-1 hour')),
  ('Suspicious Login Activity', 'Multiple failed login attempts from unknown IP', 'Medium', 'open', datetime('now', '-4 hours'), datetime('now', '-3 hours')),
  ('Database Performance Issue', 'Slow query performance affecting user experience', 'Medium', 'open', datetime('now', '-6 hours'), datetime('now', '-4 hours')),
  ('Malware Detection', 'Malware detected on workstation in HR department', 'High', 'resolved', datetime('now', '-1 day'), datetime('now', '-18 hours')),
  ('VPN Connection Issues', 'Remote users unable to connect to VPN', 'Medium', 'resolved', datetime('now', '-1 day'), datetime('now', '-20 hours')),
  ('Website Defacement', 'Unauthorized modification to company website', 'Critical', 'closed', datetime('now', '-2 days'), datetime('now', '-1 day')),
  ('Data Loss Prevention Alert', 'DLP system flagged potential data exfiltration', 'High', 'resolved', datetime('now', '-3 days'), datetime('now', '-2 days')),
  ('Phishing Email Reported', 'Employee reported suspicious email to security team', 'Low', 'closed', datetime('now', '-5 days'), datetime('now', '-4 days')),
  ('System Update Failure', 'Critical security update failed on production server', 'High', 'resolved', datetime('now', '-7 days'), datetime('now', '-6 days'));