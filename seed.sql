-- Seed data for ARIA5.1 HTMX Platform

-- Insert Organizations
INSERT OR IGNORE INTO organizations (id, name, description, type, industry, size, country) VALUES
(1, 'ARIA5 Corporation', 'Primary demonstration organization', 'Enterprise', 'Technology', 'Large', 'USA'),
(2, 'Demo Healthcare Inc', 'Healthcare demonstration', 'Healthcare', 'Healthcare', 'Medium', 'USA'),
(3, 'Financial Services Ltd', 'Financial services demo', 'Financial', 'Finance', 'Large', 'UK');

-- Insert Users (password is 'demo123' hashed with bcrypt)
INSERT OR IGNORE INTO users (id, username, email, password_hash, first_name, last_name, role, organization_id) VALUES
(1, 'admin', 'admin@aria5.com', '$2a$10$K7L1OJ0TfPIZ6V3V4sE5ue5gH4JNqyF9hqPbcFmz.YXd6xGzP3P9a', 'Admin', 'User', 'admin', 1),
(2, 'avi_security', 'avi@aria5.com', '$2a$10$K7L1OJ0TfPIZ6V3V4sE5ue5gH4JNqyF9hqPbcFmz.YXd6xGzP3P9a', 'Avi', 'Security', 'risk_manager', 1),
(3, 'sjohnson', 'sjohnson@aria5.com', '$2a$10$K7L1OJ0TfPIZ6V3V4sE5ue5gH4JNqyF9hqPbcFmz.YXd6xGzP3P9a', 'Sarah', 'Johnson', 'compliance_officer', 1),
(4, 'jsmith', 'jsmith@aria5.com', '$2a$10$K7L1OJ0TfPIZ6V3V4sE5ue5gH4JNqyF9hqPbcFmz.YXd6xGzP3P9a', 'John', 'Smith', 'analyst', 1),
(5, 'mdoe', 'mdoe@demo.com', '$2a$10$K7L1OJ0TfPIZ6V3V4sE5ue5gH4JNqyF9hqPbcFmz.YXd6xGzP3P9a', 'Mary', 'Doe', 'user', 2);

-- Insert Compliance Frameworks
INSERT OR IGNORE INTO compliance_frameworks (id, name, version, description, regulatory_body) VALUES
(1, 'ISO 27001', '2022', 'Information Security Management System', 'ISO'),
(2, 'NIST Cybersecurity Framework', '2.0', 'Framework for Improving Critical Infrastructure Cybersecurity', 'NIST'),
(3, 'GDPR', 'EU 2016/679', 'General Data Protection Regulation', 'European Union'),
(4, 'HIPAA', '1996', 'Health Insurance Portability and Accountability Act', 'US HHS'),
(5, 'SOC 2', 'Type II', 'Service Organization Control 2', 'AICPA');

-- Insert sample Framework Controls (ISO 27001)
INSERT OR IGNORE INTO framework_controls (framework_id, control_id, control_name, description, category) VALUES
(1, 'A.5.1', 'Information security policies', 'Policies for information security shall be defined, approved by management', 'Organizational'),
(1, 'A.6.1', 'Internal organization', 'A framework for managing information security shall be established', 'Organizational'),
(1, 'A.6.2', 'Mobile devices and teleworking', 'Policy and supporting security measures for mobile devices', 'Organizational'),
(1, 'A.7.1', 'Prior to employment', 'Background verification checks on all candidates for employment', 'Human Resources'),
(1, 'A.8.1', 'Asset management', 'Assets associated with information shall be identified', 'Asset Management'),
(1, 'A.9.1', 'Access control policy', 'An access control policy shall be established', 'Access Control'),
(1, 'A.10.1', 'Cryptography', 'Policy on the use of cryptographic controls', 'Cryptography'),
(1, 'A.11.1', 'Physical security perimeter', 'Security perimeters shall be defined and used', 'Physical Security'),
(1, 'A.12.1', 'Operating procedures', 'Operating procedures shall be documented', 'Operations Security'),
(1, 'A.13.1', 'Network security management', 'Networks shall be managed and controlled', 'Communications Security');

-- Insert sample Risks
INSERT OR IGNORE INTO risks (id, title, description, category, owner_id, organization_id, probability, impact, status, review_date) VALUES
(1, 'Data Breach Risk', 'Risk of unauthorized access to sensitive customer data', 'cybersecurity', 2, 1, 4, 5, 'active', date('now', '+30 days')),
(2, 'GDPR Non-Compliance', 'Risk of failing to meet GDPR requirements', 'regulatory', 3, 1, 3, 4, 'monitoring', date('now', '+60 days')),
(3, 'Third-Party Vendor Risk', 'Security vulnerabilities in vendor systems', 'third-party', 2, 1, 3, 4, 'active', date('now', '+45 days')),
(4, 'Ransomware Attack', 'Risk of ransomware encrypting critical systems', 'cybersecurity', 2, 1, 2, 5, 'active', date('now', '+30 days')),
(5, 'Insider Threat', 'Risk of malicious insider activity', 'operational', 4, 1, 2, 4, 'monitoring', date('now', '+90 days')),
(6, 'Cloud Service Outage', 'Risk of cloud provider service interruption', 'operational', 4, 1, 3, 3, 'mitigated', date('now', '+120 days')),
(7, 'Phishing Attacks', 'Risk of employees falling for phishing emails', 'cybersecurity', 2, 1, 4, 3, 'active', date('now', '+30 days')),
(8, 'Financial Fraud', 'Risk of financial transaction fraud', 'financial', 4, 1, 2, 4, 'active', date('now', '+60 days'));

-- Insert Risk Treatments
INSERT OR IGNORE INTO risk_treatments (risk_id, treatment_type, description, responsible_party, status) VALUES
(1, 'mitigate', 'Implement data encryption and access controls', 2, 'in_progress'),
(1, 'transfer', 'Purchase cyber insurance coverage', 4, 'completed'),
(2, 'mitigate', 'Conduct GDPR compliance audit and remediation', 3, 'planned'),
(3, 'mitigate', 'Implement vendor security assessment program', 2, 'in_progress'),
(4, 'mitigate', 'Deploy EDR solution and backup systems', 2, 'completed'),
(7, 'mitigate', 'Conduct security awareness training', 4, 'in_progress');

-- Insert KRIs
INSERT OR IGNORE INTO kris (risk_id, name, description, metric_type, threshold_value, current_value, threshold_direction, frequency, owner_id, status) VALUES
(1, 'Failed Login Attempts', 'Number of failed login attempts per day', 'count', 100, 45, 'above', 'daily', 2, 'active'),
(1, 'Data Access Anomalies', 'Unusual data access patterns detected', 'count', 10, 3, 'above', 'daily', 2, 'active'),
(2, 'GDPR Compliance Score', 'Overall GDPR compliance percentage', 'percentage', 80, 85, 'below', 'monthly', 3, 'active'),
(3, 'Vendor Security Scores', 'Average vendor security assessment score', 'score', 70, 75, 'below', 'quarterly', 2, 'active'),
(4, 'Backup Success Rate', 'Percentage of successful backups', 'percentage', 95, 98, 'below', 'daily', 4, 'active'),
(7, 'Phishing Click Rate', 'Percentage of users clicking phishing test emails', 'percentage', 5, 12, 'above', 'monthly', 2, 'active');

-- Insert sample Evidence
INSERT OR IGNORE INTO evidence (name, description, type, uploaded_by, status, control_ids, risk_ids) VALUES
('Information Security Policy v2.1', 'Latest version of IS policy', 'document', 3, 'approved', '[1]', '[]'),
('Penetration Test Report Q4 2024', 'External penetration test results', 'report', 2, 'approved', '[6,9]', '[1,4]'),
('Firewall Configuration Screenshot', 'Current firewall rules', 'screenshot', 2, 'pending', '[10]', '[1]'),
('ISO 27001 Certificate', 'ISO certification document', 'certificate', 3, 'approved', '[1,2,3,4,5]', '[]'),
('Incident Response Plan', 'Current IR procedures', 'document', 2, 'approved', '[9,12]', '[1,4,7]');

-- Insert sample Compliance Assessments
INSERT OR IGNORE INTO compliance_assessments (name, framework_id, organization_id, assessor_id, status, start_date, compliance_score) VALUES
('ISO 27001 Annual Assessment 2024', 1, 1, 3, 'completed', date('now', '-60 days'), 78.5),
('GDPR Compliance Review Q1 2025', 3, 1, 3, 'in_progress', date('now', '-15 days'), NULL),
('NIST CSF Gap Analysis', 2, 1, 2, 'planned', date('now', '+30 days'), NULL);

-- Insert sample Incidents
INSERT OR IGNORE INTO incidents (title, description, type, severity, status, risk_id, reported_by, assigned_to, organization_id, detection_date) VALUES
('Suspicious Login Activity', 'Multiple failed login attempts from unknown IP', 'security', 'medium', 'resolved', 1, 4, 2, 1, datetime('now', '-5 days')),
('Phishing Email Reported', 'Employee reported sophisticated phishing attempt', 'security', 'low', 'closed', 7, 5, 2, 1, datetime('now', '-10 days')),
('Service Degradation', 'Slow response times on main application', 'operational', 'medium', 'open', 6, 4, 4, 1, datetime('now', '-1 day'));

-- Insert sample Assets
INSERT OR IGNORE INTO assets (name, type, category, owner_id, organization_id, criticality, status) VALUES
('Customer Database Server', 'Server', 'IT Infrastructure', 4, 1, 'critical', 'active'),
('HR Management System', 'Application', 'Software', 3, 1, 'high', 'active'),
('Corporate Firewall', 'Network Device', 'Security', 2, 1, 'critical', 'active'),
('Email Server', 'Server', 'IT Infrastructure', 4, 1, 'high', 'active'),
('Backup Storage System', 'Storage', 'IT Infrastructure', 4, 1, 'critical', 'active');

-- Insert AI Configurations
INSERT OR IGNORE INTO ai_configurations (provider, model_name, is_active, organization_id) VALUES
('openai', 'gpt-4-turbo', 0, 1),
('anthropic', 'claude-3-opus', 0, 1),
('gemini', 'gemini-pro', 0, 1),
('local', 'llama2-7b', 0, 1);

-- Insert sample RAG Documents
INSERT OR IGNORE INTO rag_documents (title, content, document_type, uploaded_by, organization_id, embedding_status) VALUES
('NIST Cybersecurity Framework Guide', 'Content of NIST CSF...', 'guidance', 3, 1, 'completed'),
('ISO 27001 Control Objectives', 'ISO 27001 control descriptions...', 'standard', 3, 1, 'completed'),
('Company Security Policies', 'Internal security policy documentation...', 'policy', 2, 1, 'pending');