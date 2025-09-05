-- Simple production seed data that works with existing schema
-- This will be executed manually to avoid migration issues

-- Clear and reset existing data
DELETE FROM users;

-- Insert production users (passwords will be migrated to hashed format on first login)
INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, organization_id, is_active, created_at, updated_at) VALUES
(1, 'admin', 'admin@aria5.com', 'demo123', 'System', 'Administrator', 'admin', 1, 1, datetime('now'), datetime('now')),
(2, 'avi_security', 'avi@aria5.com', 'demo123', 'Avi', 'Security', 'risk_manager', 1, 1, datetime('now'), datetime('now')),
(3, 'sjohnson', 'sjohnson@aria5.com', 'demo123', 'Sarah', 'Johnson', 'compliance_officer', 1, 1, datetime('now'), datetime('now')),
(4, 'jsmith', 'jsmith@aria5.com', 'demo123', 'John', 'Smith', 'analyst', 1, 1, datetime('now'), datetime('now')),
(5, 'mdoe', 'mdoe@demo.com', 'demo123', 'Mary', 'Doe', 'user', 1, 1, datetime('now'), datetime('now')),
(6, 'rmanager', 'rmanager@securefinance.com', 'demo123', 'Robert', 'Manager', 'risk_manager', 1, 1, datetime('now'), datetime('now')),
(7, 'compliance', 'compliance@securefinance.com', 'demo123', 'Lisa', 'Chen', 'compliance_officer', 1, 1, datetime('now'), datetime('now')),
(8, 'techsec', 'security@techinnovate.com', 'demo123', 'Mike', 'Torres', 'analyst', 1, 1, datetime('now'), datetime('now')),
(9, 'auditor1', 'auditor@company.com', 'demo123', 'Emily', 'Watson', 'auditor', 1, 1, datetime('now'), datetime('now')),
(10, 'riskspec', 'risk@company.com', 'demo123', 'Carlos', 'Rodriguez', 'risk_manager', 1, 1, datetime('now'), datetime('now'));

-- Add comprehensive risk data
INSERT OR IGNORE INTO risks (title, description, category, likelihood, impact, risk_score, risk_level, status, owner_id, organization_id, created_at, updated_at) VALUES
('Data Breach from Unsecured API Endpoints', 'Critical vulnerability in customer-facing API allowing unauthorized data access', 'Data Security', 'High', 'Critical', 20, 'Critical', 'open', 2, 1, datetime('now', '-10 days'), datetime('now', '-2 days')),
('Supply Chain Ransomware Attack', 'Third-party vendor compromise leading to ransomware deployment across infrastructure', 'Cybersecurity', 'Medium', 'High', 15, 'High', 'in_progress', 6, 1, datetime('now', '-8 days'), datetime('now', '-1 day')),
('GDPR Compliance Violation', 'Inadequate data processing consent mechanisms violating GDPR Article 7', 'Compliance', 'High', 'High', 16, 'High', 'open', 7, 1, datetime('now', '-6 days'), datetime('now')),
('Insider Threat - Privileged Access Abuse', 'Potential misuse of administrative privileges by insider threats', 'Human Resources', 'Low', 'High', 10, 'Medium', 'monitoring', 3, 1, datetime('now', '-15 days'), datetime('now', '-3 days')),
('Cloud Infrastructure Misconfiguration', 'AWS S3 buckets with public read access exposing sensitive customer data', 'Cloud Security', 'Medium', 'High', 15, 'High', 'in_progress', 8, 1, datetime('now', '-12 days'), datetime('now', '-1 day')),
('AI Model Bias and Discrimination Risk', 'Machine learning models showing discriminatory patterns in decisions', 'AI Ethics', 'Medium', 'High', 15, 'High', 'open', 9, 1, datetime('now', '-5 days'), datetime('now')),
('Phishing Campaign Targeting Executives', 'Sophisticated spear-phishing targeting C-level executives', 'Social Engineering', 'High', 'Medium', 12, 'Medium', 'open', 2, 1, datetime('now', '-3 days'), datetime('now')),
('Mobile Application Security Flaws', 'Critical vulnerabilities in customer mobile app allowing data extraction', 'Application Security', 'Medium', 'High', 15, 'High', 'in_progress', 8, 1, datetime('now', '-7 days'), datetime('now', '-1 day')),
('Regulatory Audit Preparation Gap', 'Insufficient documentation and controls for upcoming SOX compliance audit', 'Compliance', 'High', 'Medium', 12, 'Medium', 'open', 7, 1, datetime('now', '-4 days'), datetime('now'));

-- Add comprehensive asset data
INSERT OR IGNORE INTO assets (name, type, description, criticality, security_classification, owner_id, organization_id, location, status, last_assessment, created_at, updated_at) VALUES
('Customer Database Server', 'Database', 'Primary PostgreSQL database containing customer PII and transaction data', 'Critical', 'Confidential', 2, 1, 'AWS us-east-1', 'active', datetime('now', '-30 days'), datetime('now', '-100 days'), datetime('now', '-5 days')),
('Payment Processing Gateway', 'Application', 'PCI-DSS compliant payment processing system handling credit card transactions', 'Critical', 'Restricted', 6, 1, 'On-Premise Data Center', 'active', datetime('now', '-15 days'), datetime('now', '-80 days'), datetime('now', '-2 days')),
('Employee Identity Management System', 'Identity', 'Active Directory and SSO system for employee authentication', 'High', 'Internal', 3, 1, 'Azure West US 2', 'active', datetime('now', '-45 days'), datetime('now', '-120 days'), datetime('now', '-10 days')),
('Executive Email Server', 'Communication', 'Exchange server hosting email for C-level executives and board members', 'High', 'Confidential', 2, 1, 'Microsoft 365 Cloud', 'active', datetime('now', '-25 days'), datetime('now', '-75 days'), datetime('now', '-1 day')),
('Mobile Application Backend', 'Application', 'REST API backend serving mobile applications with customer data access', 'High', 'Internal', 8, 1, 'Kubernetes Cluster - AWS', 'active', datetime('now', '-35 days'), datetime('now', '-110 days'), datetime('now', '-7 days')),
('Financial Reporting System', 'Application', 'SAP-based financial reporting system for regulatory compliance', 'High', 'Confidential', 7, 1, 'On-Premise - Secure Zone', 'active', datetime('now', '-40 days'), datetime('now', '-150 days'), datetime('now', '-12 days')),
('Backup and Recovery Infrastructure', 'Storage', 'Enterprise backup system containing copies of all critical business data', 'Critical', 'Confidential', 3, 1, 'AWS s3 + Glacier', 'active', datetime('now', '-50 days'), datetime('now', '-130 days'), datetime('now', '-8 days')),
('Employee Laptop Fleet', 'Endpoint', 'MacBook Pro devices issued to employees with MDM and security controls', 'Medium', 'Internal', 8, 1, 'Distributed - Remote Work', 'active', datetime('now', '-10 days'), datetime('now', '-60 days'), datetime('now', '-1 day')),
('Vulnerability Management Scanner', 'Security Tool', 'Nessus enterprise scanner for continuous vulnerability assessment', 'Medium', 'Internal', 2, 1, 'Security Operations Center', 'active', datetime('now', '-20 days'), datetime('now', '-70 days'), datetime('now', '-3 days')),
('HR Information System', 'Application', 'Workday HRIS containing employee personal data and salary records', 'High', 'Confidential', 3, 1, 'SaaS - Workday Cloud', 'active', datetime('now', '-25 days'), datetime('now', '-85 days'), datetime('now', '-4 days'));

-- Add threat intelligence campaigns
INSERT OR IGNORE INTO threat_campaigns (name, description, threat_actor, first_seen, last_seen, severity, status, tags, created_at, updated_at) VALUES
('Operation CloudStrike', 'Advanced persistent threat targeting cloud infrastructure', 'APT-29', datetime('now', '-60 days'), datetime('now', '-5 days'), 'Critical', 'Active', 'cloud,credentials,apt', datetime('now', '-50 days'), datetime('now', '-3 days')),
('FinancialPhish 2024', 'Large-scale phishing campaign targeting financial institutions', 'Lazarus Group', datetime('now', '-30 days'), datetime('now', '-2 days'), 'High', 'Active', 'phishing,financial', datetime('now', '-25 days'), datetime('now', '-1 day')),
('Healthcare Data Harvest', 'Ransomware and data exfiltration targeting healthcare organizations', 'Conti Group', datetime('now', '-45 days'), datetime('now', '-1 day'), 'Critical', 'Active', 'healthcare,ransomware', datetime('now', '-40 days'), datetime('now'));

-- Add IOCs
INSERT OR IGNORE INTO iocs (type, value, description, threat_level, confidence, source, first_seen, last_seen, status, created_at, updated_at) VALUES
('domain', 'malicious-cloudprovider[.]com', 'Typosquatting domain mimicking legitimate cloud provider', 'High', 95, 'Internal Intel', datetime('now', '-30 days'), datetime('now', '-3 days'), 'active', datetime('now', '-25 days'), datetime('now', '-1 day')),
('ip', '185.234.217.42', 'Command and control server IP address', 'Critical', 90, 'Commercial Feed', datetime('now', '-45 days'), datetime('now', '-2 days'), 'active', datetime('now', '-40 days'), datetime('now')),
('hash', 'a1b2c3d4e5f6789012345678901234567890abcd', 'Malicious PowerShell script hash', 'High', 85, 'YARA Rule', datetime('now', '-20 days'), datetime('now', '-1 day'), 'active', datetime('now', '-15 days'), datetime('now')),
('email', 'security-alert@bank-notification[.]net', 'Spoofed email address used in phishing', 'Medium', 80, 'Email Gateway', datetime('now', '-25 days'), datetime('now', '-4 days'), 'active', datetime('now', '-20 days'), datetime('now', '-2 days'));

-- Add threat feeds
INSERT OR IGNORE INTO threat_feeds (name, description, provider, feed_type, last_updated, status, url, created_at, updated_at) VALUES
('Commercial Threat Intelligence', 'Premium threat intelligence feed with IOCs', 'CrowdStrike', 'IOC', datetime('now', '-1 hour'), 'active', 'https://api.crowdstrike.com/intel', datetime('now', '-30 days'), datetime('now', '-1 hour')),
('Open Source Threat Intel', 'Community-driven threat intelligence', 'MISP Community', 'Mixed', datetime('now', '-2 hours'), 'active', 'https://misp.threatintel.org', datetime('now', '-45 days'), datetime('now', '-2 hours')),
('Government Advisories', 'Official government cybersecurity alerts', 'CISA', 'Advisory', datetime('now', '-6 hours'), 'active', 'https://us-cert.cisa.gov', datetime('now', '-60 days'), datetime('now', '-6 hours'));

-- Add sample audit logs
INSERT OR IGNORE INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, created_at) VALUES
(1, 'login', 'authentication', NULL, '192.168.1.100', 'Mozilla/5.0 (Windows)', datetime('now', '-1 hour')),
(2, 'create_risk', 'risk', '1', '10.0.0.50', 'Mozilla/5.0 (Macintosh)', datetime('now', '-2 hours')),
(3, 'update_user', 'user', '5', '172.16.0.25', 'Mozilla/5.0 (Linux)', datetime('now', '-3 hours'));