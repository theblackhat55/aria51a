-- ARIA51A Seed Data
-- Demo users, organizations, and sample data for testing
-- Password for all demo users: Demo123!@#

-- ========================================
-- 1. ORGANIZATIONS
-- ========================================

INSERT INTO organizations (id, name, description, type, industry, size, country, is_active) VALUES
(1, 'TechCorp International', 'Global technology and cybersecurity company', 'Enterprise', 'Technology', 'Large (1000+ employees)', 'USA', 1),
(2, 'FinanceGuard LLC', 'Financial services and compliance firm', 'Corporate', 'Financial Services', 'Medium (100-999)', 'UK', 1),
(3, 'HealthSecure Systems', 'Healthcare security and compliance provider', 'Enterprise', 'Healthcare', 'Large (1000+ employees)', 'Canada', 1);

-- ========================================
-- 2. DEMO USERS
-- ========================================
-- Password for all users: demo123
-- Note: The system accepts simple passwords for demo/testing.
-- In production, these should be proper bcrypt hashes.

INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, organization_id, is_active) VALUES
-- Admin user
(1, 'admin', 'admin@aria51a.local', 'demo123', 'Admin', 'User', 'admin', 1, 1),

-- Risk managers
(2, 'riskmanager', 'risk@aria51a.local', 'demo123', 'Sarah', 'Johnson', 'risk_manager', 1, 1),
(3, 'riskanalyst', 'analyst@aria51a.local', 'demo123', 'Michael', 'Chen', 'analyst', 1, 1),

-- Compliance officers
(4, 'compliance', 'compliance@aria51a.local', 'demo123', 'Emma', 'Williams', 'compliance_officer', 2, 1),
(5, 'auditor', 'auditor@aria51a.local', 'demo123', 'James', 'Brown', 'auditor', 2, 1),

-- Security team
(6, 'securitymgr', 'security@aria51a.local', 'demo123', 'David', 'Martinez', 'security_manager', 1, 1),
(7, 'secanalyst', 'secanalyst@aria51a.local', 'demo123', 'Lisa', 'Anderson', 'analyst', 3, 1),

-- Regular users
(8, 'user1', 'user1@aria51a.local', 'demo123', 'John', 'Smith', 'user', 1, 1),
(9, 'user2', 'user2@aria51a.local', 'demo123', 'Emily', 'Davis', 'user', 2, 1),
(10, 'user3', 'user3@aria51a.local', 'demo123', 'Robert', 'Wilson', 'user', 3, 1);

-- ========================================
-- 3. SAMPLE RISKS
-- ========================================

INSERT INTO risks (
  title, description, category, subcategory,
  probability, impact, status,
  owner_id, organization_id, created_by,
  review_date, source
) VALUES
-- Critical Risks
(
  'Data Breach Through Third-Party Vendor',
  'Potential unauthorized access to customer data through compromised third-party vendor systems. The vendor processes sensitive customer information and has shown security weaknesses in recent assessments.',
  'cybersecurity',
  'data_breach',
  5, 5, 'active',
  6, 1, 1,
  date('now', '+30 days'),
  'Risk Assessment 2025-Q1'
),

(
  'Ransomware Attack on Critical Infrastructure',
  'Risk of ransomware deployment targeting production systems and backup infrastructure. Recent intelligence indicates increased targeting of our industry sector.',
  'cybersecurity',
  'malware',
  4, 5, 'active',
  6, 1, 1,
  date('now', '+14 days'),
  'Threat Intelligence Feed'
),

(
  'Regulatory Non-Compliance - GDPR',
  'Current data handling processes may not fully comply with GDPR requirements, particularly around data subject access requests and right to be forgotten implementation.',
  'compliance',
  'regulatory',
  4, 5, 'pending',
  4, 2, 2,
  date('now', '+21 days'),
  'Compliance Audit 2025'
),

-- High Risks
(
  'Insider Threat - Privileged Access Abuse',
  'Risk of data exfiltration or system sabotage by employees or contractors with elevated access privileges. Insufficient monitoring of privileged account activities.',
  'operational',
  'insider_threat',
  3, 5, 'active',
  6, 1, 2,
  date('now', '+45 days'),
  'Internal Audit'
),

(
  'Cloud Infrastructure Misconfiguration',
  'Improperly configured cloud services exposing sensitive data or creating security vulnerabilities. Recent scans identified multiple S3 buckets with overly permissive access controls.',
  'technology',
  'cloud_security',
  4, 4, 'active',
  6, 1, 3,
  date('now', '+30 days'),
  'Security Assessment'
),

(
  'Supply Chain Disruption',
  'Potential disruption to critical business operations due to single-source dependencies in supply chain. No backup suppliers identified for key components.',
  'operational',
  'supply_chain',
  3, 5, 'monitoring',
  2, 1, 2,
  date('now', '+60 days'),
  'Business Continuity Planning'
),

(
  'DDoS Attack on Customer-Facing Services',
  'Distributed Denial of Service attacks targeting public-facing web applications and APIs, potentially causing service outages and revenue loss.',
  'cybersecurity',
  'availability',
  4, 4, 'mitigated',
  6, 1, 1,
  date('now', '+90 days'),
  'Security Operations'
),

-- Medium Risks
(
  'Phishing Campaign Targeting Employees',
  'Ongoing sophisticated phishing campaigns targeting employees with access to financial systems. Recent employee training completion rate below target.',
  'cybersecurity',
  'social_engineering',
  4, 3, 'active',
  6, 1, 2,
  date('now', '+30 days'),
  'Security Awareness Program'
),

(
  'Legacy System End-of-Life',
  'Critical business application running on unsupported operating system with no vendor patches available. Migration project delayed by 6 months.',
  'technology',
  'technical_debt',
  3, 4, 'accepted',
  3, 1, 3,
  date('now', '+180 days'),
  'IT Infrastructure Review'
),

(
  'Key Personnel Departure Risk',
  'Loss of critical institutional knowledge due to retirement of senior technical staff. No comprehensive knowledge transfer plan in place.',
  'operational',
  'human_resources',
  3, 3, 'active',
  2, 1, 2,
  date('now', '+90 days'),
  'HR Risk Assessment'
),

(
  'API Security Vulnerabilities',
  'Multiple RESTful APIs lack proper authentication, rate limiting, and input validation. Penetration testing identified several exploitable endpoints.',
  'technology',
  'application_security',
  4, 3, 'active',
  6, 1, 1,
  date('now', '+45 days'),
  'Penetration Test Report'
),

-- Low Risks
(
  'Physical Security - Badge System Aging',
  'Physical access control system nearing end-of-life with occasional badge reader failures. Replacement scheduled for next fiscal year.',
  'operational',
  'physical_security',
  2, 3, 'monitoring',
  2, 1, 2,
  date('now', '+120 days'),
  'Facilities Management'
),

(
  'Software License Compliance',
  'Potential over-deployment of licensed software without proper tracking. Annual audit approaching with incomplete software inventory.',
  'compliance',
  'licensing',
  3, 2, 'active',
  4, 2, 4,
  date('now', '+60 days'),
  'Software Asset Management'
),

(
  'Mobile Device Management Gaps',
  'BYOD policy allows personal devices to access corporate email without full MDM enrollment. Limited visibility into device security posture.',
  'technology',
  'mobile_security',
  2, 3, 'active',
  6, 1, 6,
  date('now', '+90 days'),
  'Mobile Security Review'
),

(
  'Vendor Contract Renewal Delays',
  'Critical security services contracts expiring within 60 days without renewal process initiated. May result in service gaps.',
  'operational',
  'vendor_management',
  2, 2, 'pending',
  2, 1, 2,
  date('now', '+30 days'),
  'Procurement Review'
);

-- ========================================
-- 4. RISK TREATMENTS
-- ========================================

INSERT INTO risk_treatments (
  risk_id, treatment_type, description,
  cost_estimate, responsible_party,
  implementation_date, status
) VALUES
-- For Critical Risks
(1, 'mitigate', 'Implement enhanced vendor security assessment program with quarterly audits and real-time monitoring', 150000, 6, date('now', '+60 days'), 'planned'),
(2, 'mitigate', 'Deploy advanced EDR solution and implement network segmentation to contain potential ransomware spread', 250000, 6, date('now', '+45 days'), 'in_progress'),
(3, 'mitigate', 'Engage GDPR compliance consultant and implement automated data subject request handling system', 80000, 4, date('now', '+90 days'), 'planned'),

-- For High Risks
(4, 'mitigate', 'Implement privileged access management (PAM) solution with session recording and anomaly detection', 200000, 6, date('now', '+120 days'), 'planned'),
(5, 'mitigate', 'Deploy cloud security posture management (CSPM) tool and conduct remediation sprints', 50000, 6, date('now', '+30 days'), 'in_progress'),
(6, 'transfer', 'Negotiate business interruption insurance coverage and identify alternate suppliers', 25000, 2, date('now', '+90 days'), 'planned'),
(7, 'mitigate', 'Implement DDoS protection service (Cloudflare) with automated traffic filtering', 60000, 6, date('now', '+14 days'), 'completed'),

-- For Medium Risks
(8, 'mitigate', 'Launch enhanced security awareness training with simulated phishing campaigns', 30000, 6, date('now', '+45 days'), 'in_progress'),
(9, 'accept', 'Accept risk with enhanced monitoring until migration project completes in Q3', 5000, 3, date('now', '+180 days'), 'planned'),
(10, 'mitigate', 'Initiate knowledge transfer program and cross-training initiatives', 15000, 2, date('now', '+60 days'), 'in_progress'),
(11, 'mitigate', 'Implement API gateway with OAuth 2.0, rate limiting, and comprehensive logging', 75000, 6, date('now', '+90 days'), 'planned');

-- ========================================
-- 5. COMPLIANCE FRAMEWORKS
-- ========================================

INSERT INTO compliance_frameworks (name, version, description, regulatory_body, industry, is_active) VALUES
('GDPR', '2016/679', 'General Data Protection Regulation - EU data protection and privacy law', 'European Union', 'General', 1),
('SOC 2 Type II', '2017', 'Service Organization Control 2 - Trust Services Criteria', 'AICPA', 'Technology', 1),
('ISO 27001', '2022', 'Information Security Management System standard', 'ISO/IEC', 'General', 1),
('NIST CSF', '2.0', 'Cybersecurity Framework', 'NIST', 'General', 1),
('HIPAA', '1996', 'Health Insurance Portability and Accountability Act', 'HHS', 'Healthcare', 1),
('PCI DSS', '4.0', 'Payment Card Industry Data Security Standard', 'PCI SSC', 'Financial', 1);

-- ========================================
-- 6. COMPLIANCE REQUIREMENTS
-- ========================================

INSERT INTO compliance_requirements (
  framework_id, control_id, title, description,
  category, priority, status, owner_id
) VALUES
-- GDPR Requirements
(1, 'Art. 32', 'Security of Processing', 'Implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk', 'Security', 'high', 'compliant', 4),
(1, 'Art. 33', 'Notification of Personal Data Breach', 'Notify supervisory authority of data breach within 72 hours', 'Incident Response', 'critical', 'compliant', 4),
(1, 'Art. 15', 'Right of Access', 'Provide data subjects with access to their personal data upon request', 'Privacy', 'high', 'partial', 4),

-- SOC 2 Requirements
(2, 'CC6.1', 'Logical and Physical Access Controls', 'Implement controls to restrict access to assets and data', 'Access Control', 'high', 'compliant', 6),
(2, 'CC7.2', 'System Monitoring', 'Monitor system components and environmental threats', 'Monitoring', 'high', 'compliant', 6),

-- ISO 27001 Requirements
(3, 'A.9.1', 'Business Requirements for Access Control', 'Define and implement access control policy', 'Access Management', 'high', 'compliant', 6),
(3, 'A.12.6', 'Technical Vulnerability Management', 'Manage technical vulnerabilities through timely patching', 'Vulnerability Management', 'high', 'partial', 6),

-- NIST CSF Requirements
(4, 'ID.AM-1', 'Asset Management', 'Maintain inventory of physical devices and systems', 'Identify', 'medium', 'compliant', 3),
(4, 'PR.AC-1', 'Access Control', 'Manage identities and credentials for authorized devices and users', 'Protect', 'high', 'compliant', 6),
(4, 'DE.CM-1', 'Detection Processes', 'Monitor network to detect potential cybersecurity events', 'Detect', 'high', 'compliant', 6);

-- ========================================
-- 7. INCIDENTS
-- ========================================

INSERT INTO incidents (
  title, description, severity, status,
  category, source, affected_systems,
  assigned_to, organization_id, reported_by,
  detected_at
) VALUES
(
  'Suspicious Login Activity Detected',
  'Multiple failed login attempts followed by successful access from unusual geographic location for user account',
  'medium',
  'investigating',
  'security',
  'SIEM Alert',
  'Authentication System, User Portal',
  6, 1, 7,
  datetime('now', '-2 hours')
),
(
  'Phishing Email Campaign',
  'Coordinated phishing campaign detected targeting finance department with fake invoice attachments',
  'high',
  'contained',
  'security',
  'Email Gateway',
  'Email System',
  6, 1, 8,
  datetime('now', '-1 day')
),
(
  'Unauthorized Database Access Attempt',
  'SQL injection attempt detected and blocked by WAF. No data exfiltration confirmed.',
  'high',
  'resolved',
  'security',
  'WAF Logs',
  'Customer Database, Web Application',
  6, 1, 7,
  datetime('now', '-3 days')
);

-- ========================================
-- 8. VULNERABILITIES
-- ========================================

INSERT INTO vulnerabilities (
  cve_id, title, description, severity,
  cvss_score, affected_systems, status,
  discovered_date, assigned_to, organization_id
) VALUES
(
  'CVE-2024-1234',
  'Remote Code Execution in Apache Log4j',
  'Critical vulnerability allowing remote code execution through specially crafted log messages',
  'critical',
  10.0,
  'Application Servers, Log Processing',
  'patched',
  date('now', '-60 days'),
  6, 1
),
(
  'CVE-2024-5678',
  'SQL Injection in Custom Web Portal',
  'SQL injection vulnerability in customer portal search functionality',
  'high',
  8.2,
  'Customer Portal, Database',
  'patched',
  date('now', '-30 days'),
  6, 1
),
(
  'CVE-2024-9012',
  'Cross-Site Scripting (XSS) in Admin Panel',
  'Reflected XSS vulnerability in administration interface',
  'medium',
  6.1,
  'Admin Portal',
  'in_progress',
  date('now', '-14 days'),
  6, 1
),
(
  'N/A',
  'Weak SSL/TLS Configuration',
  'Legacy TLS 1.0 and 1.1 protocols still enabled on payment gateway',
  'medium',
  5.3,
  'Payment Gateway',
  'planned',
  date('now', '-7 days'),
  6, 1
);

-- ========================================
-- 9. THREAT FEEDS
-- ========================================

INSERT INTO threat_feeds (
  name, source, feed_type, reliability_score,
  description, feed_url, is_active
) VALUES
('AlienVault OTX', 'AlienVault', 'community', 85, 'Open Threat Exchange - Community-driven threat intelligence', 'https://otx.alienvault.com', 1),
('MISP Threat Sharing', 'MISP Project', 'community', 90, 'Malware Information Sharing Platform', 'https://www.misp-project.org', 1),
('FBI InfraGard', 'FBI', 'government', 95, 'Public-private partnership for critical infrastructure protection', 'https://www.infragard.org', 1),
('CISA Alerts', 'CISA', 'government', 98, 'Cybersecurity and Infrastructure Security Agency alerts', 'https://www.cisa.gov/uscert', 1);

-- ========================================
-- 10. THREAT INDICATORS (IOCs)
-- ========================================

INSERT INTO threat_indicators (
  indicator_type, indicator_value, threat_type,
  confidence, severity, source,
  first_seen, last_seen, organization_id
) VALUES
('ip', '192.0.2.100', 'malware', 'high', 'high', 'AlienVault OTX', datetime('now', '-7 days'), datetime('now', '-1 day'), 1),
('domain', 'malicious-phishing-site.com', 'phishing', 'high', 'medium', 'MISP', datetime('now', '-14 days'), datetime('now', '-2 days'), 1),
('hash', 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6', 'ransomware', 'high', 'critical', 'CISA', datetime('now', '-3 days'), datetime('now', '-1 day'), 1),
('email', 'attacker@evil-domain.com', 'phishing', 'medium', 'medium', 'Internal', datetime('now', '-5 days'), datetime('now', '-1 day'), 1);

-- ========================================
-- 11. BUSINESS UNITS
-- ========================================

INSERT INTO business_units (
  name, description, parent_id, organization_id,
  manager_id, risk_appetite
) VALUES
('Engineering', 'Software development and infrastructure', NULL, 1, 3, 'moderate'),
('Security Operations', 'Information security and incident response', NULL, 1, 6, 'low'),
('Finance', 'Financial planning and accounting', NULL, 1, 2, 'very_low'),
('Human Resources', 'Employee management and development', NULL, 1, 2, 'moderate'),
('Legal & Compliance', 'Legal affairs and regulatory compliance', NULL, 2, 4, 'very_low');

-- ========================================
-- 12. SERVICES (Critical Business Services)
-- ========================================

INSERT INTO services (
  name, description, business_unit_id, criticality,
  owner_id, status, dependencies
) VALUES
('Customer Portal', 'Public-facing customer service portal', 1, 'critical', 3, 'operational', 'Authentication Service, Database, CDN'),
('Payment Processing', 'Credit card and payment transaction processing', 3, 'critical', 2, 'operational', 'Payment Gateway, Database, Fraud Detection'),
('Email System', 'Corporate email and communication', 1, 'high', 6, 'operational', 'Mail Servers, Authentication, Spam Filter'),
('SIEM Platform', 'Security information and event management', 2, 'critical', 6, 'operational', 'Log Collectors, Database, Alert System');

-- ========================================
-- END OF SEED DATA
-- ========================================

-- Verify counts
SELECT 'Organizations' as table_name, COUNT(*) as count FROM organizations
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Risks', COUNT(*) FROM risks
UNION ALL
SELECT 'Risk Treatments', COUNT(*) FROM risk_treatments
UNION ALL
SELECT 'Compliance Frameworks', COUNT(*) FROM compliance_frameworks
UNION ALL
SELECT 'Compliance Requirements', COUNT(*) FROM compliance_requirements
UNION ALL
SELECT 'Incidents', COUNT(*) FROM incidents
UNION ALL
SELECT 'Vulnerabilities', COUNT(*) FROM vulnerabilities
UNION ALL
SELECT 'Threat Feeds', COUNT(*) FROM threat_feeds
UNION ALL
SELECT 'Threat Indicators', COUNT(*) FROM threat_indicators
UNION ALL
SELECT 'Business Units', COUNT(*) FROM business_units
UNION ALL
SELECT 'Services', COUNT(*) FROM services;
