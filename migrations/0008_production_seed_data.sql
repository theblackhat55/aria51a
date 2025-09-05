-- ARIA5 Production Seed Data
-- Comprehensive realistic data for production environment

-- Insert organizations
INSERT OR IGNORE INTO organizations (id, name, description, type, industry, size, country, is_active) VALUES
(1, 'ARIA5 Corporation', 'Primary demonstration organization for AI Risk Intelligence', 'Enterprise', 'Technology', 'Large', 'United States', 1),
(2, 'SecureFinance Ltd', 'Financial services with high security requirements', 'Corporation', 'Financial Services', 'Medium', 'United Kingdom', 1),
(3, 'TechInnovate Inc', 'Technology startup with agile security practices', 'Startup', 'Technology', 'Small', 'Canada', 1),
(4, 'HealthGuard Systems', 'Healthcare technology with strict compliance needs', 'Corporation', 'Healthcare', 'Large', 'United States', 1),
(5, 'GlobalManufacturing Co', 'Manufacturing company with distributed operations', 'Corporation', 'Manufacturing', 'Large', 'Germany', 1);

-- Clear existing data that might have foreign key constraints
DELETE FROM api_keys;
DELETE FROM user_sessions;
DELETE FROM audit_logs;
DELETE FROM risks;
DELETE FROM assets;
DELETE FROM users;

-- Note: These password hashes are for 'SecurePass123!' - in production, users should change these
INSERT INTO users (id, username, email, password_hash, password_salt, first_name, last_name, role, organization_id, is_active, failed_login_attempts, password_changed_at, created_at, updated_at) VALUES
(1, 'admin', 'admin@aria5.com', 'demo123', NULL, 'System', 'Administrator', 'admin', 1, 1, 0, datetime('now'), datetime('now'), datetime('now')),
(2, 'avi_security', 'avi@aria5.com', 'demo123', NULL, 'Avi', 'Security', 'risk_manager', 1, 1, 0, datetime('now'), datetime('now'), datetime('now')),
(3, 'sjohnson', 'sjohnson@aria5.com', 'demo123', NULL, 'Sarah', 'Johnson', 'compliance_officer', 1, 1, 0, datetime('now'), datetime('now'), datetime('now')),
(4, 'jsmith', 'jsmith@aria5.com', 'demo123', NULL, 'John', 'Smith', 'analyst', 1, 1, 0, datetime('now'), datetime('now'), datetime('now')),
(5, 'mdoe', 'mdoe@demo.com', 'demo123', NULL, 'Mary', 'Doe', 'user', 1, 1, 0, datetime('now'), datetime('now'), datetime('now')),
(6, 'rmanager', 'rmanager@securefinance.com', 'demo123', NULL, 'Robert', 'Manager', 'risk_manager', 2, 1, 0, datetime('now'), datetime('now'), datetime('now')),
(7, 'compliance', 'compliance@securefinance.com', 'demo123', NULL, 'Lisa', 'Chen', 'compliance_officer', 2, 1, 0, datetime('now'), datetime('now'), datetime('now')),
(8, 'techsec', 'security@techinnovate.com', 'demo123', NULL, 'Mike', 'Torres', 'analyst', 3, 1, 0, datetime('now'), datetime('now'), datetime('now')),
(9, 'healthaudit', 'privacy@healthguard.com', 'demo123', NULL, 'Dr. Emily', 'Watson', 'auditor', 4, 1, 0, datetime('now'), datetime('now'), datetime('now')),
(10, 'manufrisk', 'risk@globalmanuf.com', 'demo123', NULL, 'Carlos', 'Rodriguez', 'risk_manager', 5, 1, 0, datetime('now'), datetime('now'), datetime('now'));

-- Insert comprehensive risk data
INSERT OR IGNORE INTO risks (id, title, description, category, likelihood, impact, risk_score, risk_level, status, owner_id, organization_id, created_at, updated_at) VALUES
(1, 'Data Breach from Unsecured API Endpoints', 'Critical vulnerability in customer-facing API allowing unauthorized data access', 'Data Security', 'High', 'Critical', 20, 'Critical', 'open', 2, 1, datetime('now', '-10 days'), datetime('now', '-2 days')),
(2, 'Supply Chain Ransomware Attack', 'Third-party vendor compromise leading to ransomware deployment across infrastructure', 'Cybersecurity', 'Medium', 'High', 15, 'High', 'in_progress', 6, 2, datetime('now', '-8 days'), datetime('now', '-1 day')),
(3, 'GDPR Compliance Violation', 'Inadequate data processing consent mechanisms violating GDPR Article 7', 'Compliance', 'High', 'High', 16, 'High', 'open', 7, 2, datetime('now', '-6 days'), datetime('now')),
(4, 'Insider Threat - Privileged Access Abuse', 'Potential misuse of administrative privileges by insider threats', 'Human Resources', 'Low', 'High', 10, 'Medium', 'monitoring', 3, 1, datetime('now', '-15 days'), datetime('now', '-3 days')),
(5, 'Cloud Infrastructure Misconfiguration', 'AWS S3 buckets with public read access exposing sensitive customer data', 'Cloud Security', 'Medium', 'High', 15, 'High', 'in_progress', 8, 3, datetime('now', '-12 days'), datetime('now', '-1 day')),
(6, 'AI Model Bias and Discrimination Risk', 'Machine learning models showing discriminatory patterns in healthcare decisions', 'AI Ethics', 'Medium', 'High', 15, 'High', 'open', 9, 4, datetime('now', '-5 days'), datetime('now')),
(7, 'Industrial Control System Vulnerability', 'SCADA systems vulnerable to remote exploitation affecting production safety', 'Operational Technology', 'Low', 'Critical', 15, 'High', 'in_progress', 10, 5, datetime('now', '-20 days'), datetime('now', '-4 days')),
(8, 'Phishing Campaign Targeting Executive Team', 'Sophisticated spear-phishing targeting C-level executives with credential harvesting', 'Social Engineering', 'High', 'Medium', 12, 'Medium', 'open', 2, 1, datetime('now', '-3 days'), datetime('now')),
(9, 'Mobile Application Security Flaws', 'Critical vulnerabilities in customer mobile app allowing data extraction', 'Application Security', 'Medium', 'High', 15, 'High', 'in_progress', 8, 3, datetime('now', '-7 days'), datetime('now', '-1 day')),
(10, 'Regulatory Audit Preparation Gap', 'Insufficient documentation and controls for upcoming SOX compliance audit', 'Compliance', 'High', 'Medium', 12, 'Medium', 'open', 7, 2, datetime('now', '-4 days'), datetime('now'));

-- Insert comprehensive asset data
INSERT OR IGNORE INTO assets (id, name, type, description, criticality, security_classification, owner_id, organization_id, location, status, last_assessment, created_at, updated_at) VALUES
(1, 'Customer Database Server', 'Database', 'Primary PostgreSQL database containing customer PII and transaction data', 'Critical', 'Confidential', 2, 1, 'AWS us-east-1', 'active', datetime('now', '-30 days'), datetime('now', '-100 days'), datetime('now', '-5 days')),
(2, 'Payment Processing Gateway', 'Application', 'PCI-DSS compliant payment processing system handling credit card transactions', 'Critical', 'Restricted', 6, 2, 'On-Premise Data Center', 'active', datetime('now', '-15 days'), datetime('now', '-80 days'), datetime('now', '-2 days')),
(3, 'Employee Identity Management System', 'Identity', 'Active Directory and SSO system for employee authentication and authorization', 'High', 'Internal', 3, 1, 'Azure West US 2', 'active', datetime('now', '-45 days'), datetime('now', '-120 days'), datetime('now', '-10 days')),
(4, 'AI Model Training Infrastructure', 'Compute', 'GPU clusters for training machine learning models with sensitive healthcare data', 'High', 'Confidential', 9, 4, 'Google Cloud us-central1', 'active', datetime('now', '-20 days'), datetime('now', '-90 days'), datetime('now', '-3 days')),
(5, 'Industrial Control Network', 'Network', 'SCADA network controlling manufacturing equipment and safety systems', 'Critical', 'Restricted', 10, 5, 'Factory Floor - Building A', 'active', datetime('now', '-60 days'), datetime('now', '-200 days'), datetime('now', '-15 days')),
(6, 'Executive Email Server', 'Communication', 'Exchange server hosting email for C-level executives and board members', 'High', 'Confidential', 2, 1, 'Microsoft 365 Cloud', 'active', datetime('now', '-25 days'), datetime('now', '-75 days'), datetime('now', '-1 day')),
(7, 'Mobile Application Backend', 'Application', 'REST API backend serving mobile applications with customer data access', 'High', 'Internal', 8, 3, 'Kubernetes Cluster - AWS', 'active', datetime('now', '-35 days'), datetime('now', '-110 days'), datetime('now', '-7 days')),
(8, 'Financial Reporting System', 'Application', 'SAP-based financial reporting system for regulatory compliance and auditing', 'High', 'Confidential', 7, 2, 'On-Premise - Secure Zone', 'active', datetime('now', '-40 days'), datetime('now', '-150 days'), datetime('now', '-12 days')),
(9, 'Backup and Recovery Infrastructure', 'Storage', 'Enterprise backup system containing copies of all critical business data', 'Critical', 'Confidential', 3, 1, 'AWS s3 + Glacier', 'active', datetime('now', '-50 days'), datetime('now', '-130 days'), datetime('now', '-8 days')),
(10, 'Employee Laptop Fleet', 'Endpoint', 'MacBook Pro devices issued to employees with MDM and security controls', 'Medium', 'Internal', 8, 3, 'Distributed - Remote Work', 'active', datetime('now', '-10 days'), datetime('now', '-60 days'), datetime('now', '-1 day')),
(11, 'Vulnerability Management Scanner', 'Security Tool', 'Nessus enterprise scanner for continuous vulnerability assessment', 'Medium', 'Internal', 2, 1, 'Security Operations Center', 'active', datetime('now', '-20 days'), datetime('now', '-70 days'), datetime('now', '-3 days')),
(12, 'Document Management System', 'Storage', 'SharePoint-based system storing contracts, policies, and confidential documents', 'High', 'Confidential', 7, 2, 'Microsoft 365 Cloud', 'active', datetime('now', '-30 days'), datetime('now', '-95 days'), datetime('now', '-5 days')),
(13, 'Network Firewall Cluster', 'Security', 'Palo Alto firewall cluster protecting perimeter and internal network segments', 'Critical', 'Internal', 10, 5, 'Network Operations Center', 'active', datetime('now', '-15 days'), datetime('now', '-180 days'), datetime('now', '-2 days')),
(14, 'HR Information System', 'Application', 'Workday HRIS containing employee personal data, salary, and performance records', 'High', 'Confidential', 3, 1, 'SaaS - Workday Cloud', 'active', datetime('now', '-25 days'), datetime('now', '-85 days'), datetime('now', '-4 days')),
(15, 'Code Repository Server', 'Development', 'GitLab enterprise server containing proprietary source code and IP', 'High', 'Confidential', 8, 3, 'AWS us-west-2', 'active', datetime('now', '-12 days'), datetime('now', '-65 days'), datetime('now', '-1 day'));

-- Insert threat intelligence data
INSERT OR IGNORE INTO threat_campaigns (id, name, description, threat_actor, first_seen, last_seen, severity, status, tags, created_at, updated_at) VALUES
(1, 'Operation CloudStrike', 'Advanced persistent threat targeting cloud infrastructure with credential harvesting', 'APT-29 (Cozy Bear)', datetime('now', '-60 days'), datetime('now', '-5 days'), 'Critical', 'Active', 'cloud,credentials,apt', datetime('now', '-50 days'), datetime('now', '-3 days')),
(2, 'FinancialPhish 2024', 'Large-scale phishing campaign targeting financial institutions and their customers', 'Lazarus Group', datetime('now', '-30 days'), datetime('now', '-2 days'), 'High', 'Active', 'phishing,financial,credentials', datetime('now', '-25 days'), datetime('now', '-1 day')),
(3, 'Manufacturing Sabotage Initiative', 'Industrial espionage and sabotage targeting manufacturing control systems', 'Unknown Nation-State', datetime('now', '-90 days'), datetime('now', '-10 days'), 'High', 'Monitoring', 'scada,manufacturing,sabotage', datetime('now', '-80 days'), datetime('now', '-7 days')),
(4, 'Healthcare Data Harvest', 'Ransomware and data exfiltration specifically targeting healthcare organizations', 'Conti Successor Group', datetime('now', '-45 days'), datetime('now', '-1 day'), 'Critical', 'Active', 'healthcare,ransomware,data-theft', datetime('now', '-40 days'), datetime('now')),
(5, 'Supply Chain Compromise Wave', 'Software supply chain attacks through compromised development tools and repositories', 'UNC2452 (SolarWinds Actors)', datetime('now', '-120 days'), datetime('now', '-15 days'), 'Critical', 'Monitoring', 'supply-chain,development,compromise', datetime('now', '-110 days'), datetime('now', '-12 days'));

-- Insert IOCs (Indicators of Compromise)
INSERT OR IGNORE INTO iocs (id, type, value, description, threat_level, confidence, source, first_seen, last_seen, status, campaign_id, created_at, updated_at) VALUES
(1, 'domain', 'malicious-cloudprovider[.]com', 'Typosquatting domain mimicking legitimate cloud provider for credential phishing', 'High', 95, 'Internal Threat Intel', datetime('now', '-30 days'), datetime('now', '-3 days'), 'active', 1, datetime('now', '-25 days'), datetime('now', '-1 day')),
(2, 'ip', '185.234.217.42', 'Command and control server IP address observed in multiple APT campaigns', 'Critical', 90, 'Commercial Feed', datetime('now', '-45 days'), datetime('now', '-2 days'), 'active', 1, datetime('now', '-40 days'), datetime('now')),
(3, 'hash', 'a1b2c3d4e5f6789012345678901234567890abcd', 'Malicious PowerShell script hash used for initial access and persistence', 'High', 85, 'YARA Rule', datetime('now', '-20 days'), datetime('now', '-1 day'), 'active', 2, datetime('now', '-15 days'), datetime('now')),
(4, 'email', 'security-alert@bank-notification[.]net', 'Spoofed email address used in financial phishing campaigns', 'Medium', 80, 'Email Security Gateway', datetime('now', '-25 days'), datetime('now', '-4 days'), 'active', 2, datetime('now', '-20 days'), datetime('now', '-2 days')),
(5, 'url', 'http://manufacturing-update[.]org/firmware/download.exe', 'Malicious firmware update URL targeting industrial control systems', 'Critical', 95, 'ICS Honeypot', datetime('now', '-60 days'), datetime('now', '-10 days'), 'monitoring', 3, datetime('now', '-55 days'), datetime('now', '-8 days')),
(6, 'registry', 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\\SecurityUpdate', 'Registry persistence mechanism used by healthcare-targeting ransomware', 'High', 90, 'EDR Telemetry', datetime('now', '-35 days'), datetime('now', '-1 day'), 'active', 4, datetime('now', '-30 days'), datetime('now')),
(7, 'certificate', 'CN=Microsoft Corporation, O=Microsoft Corporation, Serial=1234567890ABCDEF', 'Fraudulent code signing certificate used to sign malicious development tools', 'Critical', 95, 'Certificate Transparency', datetime('now', '-90 days'), datetime('now', '-15 days'), 'monitoring', 5, datetime('now', '-85 days'), datetime('now', '-12 days')),
(8, 'domain', 'employee-portal-secure[.]org', 'Fake employee portal used for credential harvesting in supply chain attacks', 'High', 88, 'DNS Analysis', datetime('now', '-40 days'), datetime('now', '-5 days'), 'active', 5, datetime('now', '-35 days'), datetime('now', '-3 days'));

-- Insert threat feeds
INSERT OR IGNORE INTO threat_feeds (id, name, description, provider, feed_type, last_updated, status, url, created_at, updated_at) VALUES
(1, 'Commercial Threat Intelligence', 'Premium threat intelligence feed with IOCs and campaign analysis', 'CrowdStrike Falcon X', 'IOC', datetime('now', '-1 hour'), 'active', 'https://api.crowdstrike.com/intelligence/v2', datetime('now', '-30 days'), datetime('now', '-1 hour')),
(2, 'Open Source Threat Intel', 'Community-driven threat intelligence from multiple OSINT sources', 'MISP Community', 'Mixed', datetime('now', '-2 hours'), 'active', 'https://misp.threatintel.org/feeds', datetime('now', '-45 days'), datetime('now', '-2 hours')),
(3, 'Government Threat Advisories', 'Official government cybersecurity alerts and threat notifications', 'CISA', 'Advisory', datetime('now', '-6 hours'), 'active', 'https://us-cert.cisa.gov/ncas/alerts.xml', datetime('now', '-60 days'), datetime('now', '-6 hours')),
(4, 'Financial Services Threat Feed', 'Specialized threat intelligence for financial sector organizations', 'FS-ISAC', 'IOC', datetime('now', '-3 hours'), 'active', 'https://portal.fsisac.com/threat-feed', datetime('now', '-90 days'), datetime('now', '-3 hours')),
(5, 'Industrial Control Systems Intel', 'Threat intelligence focused on ICS/SCADA and critical infrastructure', 'ICS-CERT', 'Advisory', datetime('now', '-12 hours'), 'active', 'https://ics-cert.us-cert.gov/alerts.xml', datetime('now', '-120 days'), datetime('now', '-12 hours'));

-- Insert hunt results and findings
INSERT OR IGNORE INTO hunt_results (id, hunt_name, description, start_time, end_time, status, findings_count, created_by, created_at, updated_at) VALUES
(1, 'APT29 Infrastructure Hunt', 'Proactive hunt for APT29 infrastructure and TTPs based on latest threat intelligence', datetime('now', '-7 days'), datetime('now', '-5 days'), 'completed', 12, 2, datetime('now', '-7 days'), datetime('now', '-5 days')),
(2, 'Insider Threat Behavioral Analysis', 'Hunt for anomalous user behavior patterns indicating potential insider threats', datetime('now', '-14 days'), datetime('now', '-10 days'), 'completed', 8, 3, datetime('now', '-14 days'), datetime('now', '-10 days')),
(3, 'Cloud Misconfigurations Sweep', 'Systematic hunt for cloud infrastructure misconfigurations and exposed resources', datetime('now', '-3 days'), datetime('now', '-1 day'), 'completed', 15, 8, datetime('now', '-3 days'), datetime('now', '-1 day')),
(4, 'Supply Chain Compromise Indicators', 'Hunt for indicators of supply chain compromise in development and build environments', datetime('now', '-21 days'), datetime('now', '-18 days'), 'completed', 6, 8, datetime('now', '-21 days'), datetime('now', '-18 days')),
(5, 'Healthcare Ransomware Precursors', 'Proactive hunt for early indicators of healthcare-targeting ransomware deployment', datetime('now', '-10 days'), datetime('now', '-8 days'), 'completed', 9, 9, datetime('now', '-10 days'), datetime('now', '-8 days'));

-- Update security settings with production values
UPDATE security_settings SET setting_value = 'false' WHERE setting_key = 'enable_mfa';
UPDATE security_settings SET setting_value = 'true' WHERE setting_key = 'enable_audit_logging';
UPDATE security_settings SET setting_value = '10' WHERE setting_key = 'max_login_attempts';
UPDATE security_settings SET setting_value = '1800' WHERE setting_key = 'lockout_duration';

-- Insert sample audit logs for demonstration
INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address, user_agent, created_at) VALUES
(1, 'login', 'authentication', NULL, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', datetime('now', '-1 hour')),
(2, 'create_risk', 'risk', '1', '10.0.0.50', 'Mozilla/5.0 (Macintosh; Intel Mac OS X)', datetime('now', '-2 hours')),
(3, 'update_user', 'user', '5', '172.16.0.25', 'Mozilla/5.0 (X11; Linux x86_64)', datetime('now', '-3 hours')),
(1, 'system_configuration', 'settings', NULL, '192.168.1.100', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', datetime('now', '-4 hours'));