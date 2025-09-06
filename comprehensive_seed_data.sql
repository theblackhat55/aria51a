-- ARIA5.1 Enterprise Security Intelligence Platform - Comprehensive Seed Data
-- Realistic data for demonstration and testing purposes
-- Target: 10-15 entries per major table/module

-- Clear existing data (maintain referential integrity order)
DELETE FROM risk_control_mappings;
DELETE FROM compliance_evidence;
DELETE FROM compliance_controls;
DELETE FROM compliance_frameworks;
DELETE FROM threat_intelligence;
DELETE FROM service_catalog;
DELETE FROM api_keys;
DELETE FROM user_sessions;
DELETE FROM audit_logs;
DELETE FROM rag_documents;
DELETE FROM risks;
DELETE FROM assets;
DELETE FROM users;
DELETE FROM organizations;

-- Organizations (5 diverse organizations)
INSERT INTO organizations (id, name, description, type, industry, size, country, is_active, created_at, updated_at) VALUES
(1, 'ARIA5 Technologies Inc', 'AI-driven security intelligence platform provider specializing in enterprise risk management', 'Enterprise', 'Technology', 'Medium', 'United States', 1, '2023-01-15 10:00:00', '2025-01-15 10:00:00'),
(2, 'SecureBank Financial', 'Digital banking platform with advanced cybersecurity requirements', 'Corporation', 'Financial Services', 'Large', 'United Kingdom', 1, '2022-06-20 14:30:00', '2024-12-01 09:15:00'),
(3, 'MedTech Innovations', 'Healthcare technology company developing IoT medical devices', 'Corporation', 'Healthcare', 'Medium', 'Canada', 1, '2023-03-10 08:45:00', '2024-11-20 16:22:00'),
(4, 'CloudFirst Solutions', 'Cloud infrastructure and DevOps services provider', 'Startup', 'Technology', 'Small', 'Australia', 1, '2023-08-05 11:20:00', '2024-12-15 13:40:00'),
(5, 'CyberDefense Corp', 'Managed security services and threat hunting specialists', 'Enterprise', 'Cybersecurity', 'Large', 'Germany', 1, '2022-02-28 09:30:00', '2024-10-30 17:50:00');

-- Users (12 users across different roles and organizations)
INSERT INTO users (id, username, email, password_hash, password_salt, first_name, last_name, role, organization_id, is_active, failed_login_attempts, password_changed_at, created_at, updated_at) VALUES
(1, 'admin', 'admin@aria5.com', 'demo123', NULL, 'System', 'Administrator', 'admin', 1, 1, 0, '2025-01-01 00:00:00', '2023-01-15 10:00:00', '2025-01-15 10:00:00'),
(2, 'avi_security', 'avi@aria5.com', 'demo123', NULL, 'Avi', 'Adiyala', 'risk_manager', 1, 1, 0, '2025-01-01 00:00:00', '2023-01-15 11:30:00', '2024-12-20 14:15:00'),
(3, 'sarah_compliance', 'sarah.johnson@aria5.com', 'demo123', NULL, 'Sarah', 'Johnson', 'compliance_officer', 1, 1, 0, '2024-11-15 00:00:00', '2023-02-01 09:15:00', '2024-11-25 16:45:00'),
(4, 'mike_analyst', 'mike.torres@aria5.com', 'demo123', NULL, 'Michael', 'Torres', 'analyst', 1, 1, 0, '2024-10-01 00:00:00', '2023-03-10 14:20:00', '2024-12-01 10:30:00'),
(5, 'emma_auditor', 'emma.chen@aria5.com', 'demo123', NULL, 'Emma', 'Chen', 'auditor', 1, 1, 0, '2024-09-20 00:00:00', '2023-04-15 13:45:00', '2024-11-10 08:20:00'),
(6, 'david_risk', 'david.wilson@securebank.com', 'demo123', NULL, 'David', 'Wilson', 'risk_manager', 2, 1, 0, '2024-08-30 00:00:00', '2022-07-01 10:00:00', '2024-12-05 15:30:00'),
(7, 'lisa_ciso', 'lisa.martinez@securebank.com', 'demo123', NULL, 'Lisa', 'Martinez', 'admin', 2, 1, 0, '2024-12-01 00:00:00', '2022-06-25 09:30:00', '2024-12-10 11:45:00'),
(8, 'john_compliance', 'john.brown@medtech.com', 'demo123', NULL, 'John', 'Brown', 'compliance_officer', 3, 1, 0, '2024-07-15 00:00:00', '2023-03-15 12:00:00', '2024-11-30 14:20:00'),
(9, 'alex_devops', 'alex.garcia@cloudfirst.com', 'demo123', NULL, 'Alexandra', 'Garcia', 'analyst', 4, 1, 0, '2024-06-10 00:00:00', '2023-08-10 15:30:00', '2024-12-12 09:50:00'),
(10, 'robert_threat', 'robert.kim@cyberdefense.com', 'demo123', NULL, 'Robert', 'Kim', 'analyst', 5, 1, 0, '2024-05-20 00:00:00', '2022-03-01 11:15:00', '2024-12-08 16:40:00'),
(11, 'maria_security', 'maria.lopez@cyberdefense.com', 'demo123', NULL, 'Maria', 'Lopez', 'risk_manager', 5, 1, 0, '2024-04-25 00:00:00', '2022-02-28 10:45:00', '2024-11-15 13:25:00'),
(12, 'demo_user', 'demo@demo.com', 'demo123', NULL, 'Demo', 'User', 'user', 1, 1, 0, '2024-01-01 00:00:00', '2024-01-01 12:00:00', '2024-12-15 10:10:00');

-- Assets (15 diverse technology assets)
INSERT INTO assets (id, name, description, category, type, owner_id, organization_id, confidentiality, integrity, availability, business_impact, status, location, vendor, version, last_updated) VALUES
(1, 'ARIA5 Platform Database', 'Primary PostgreSQL database storing customer risk data, user accounts, and analytics', 'Infrastructure', 'Database', 1, 1, 5, 5, 4, 'Critical', 'active', 'AWS us-east-1', 'Amazon RDS', 'PostgreSQL 15.2', '2024-12-15 10:30:00'),
(2, 'Customer Web Portal', 'React-based web application for customer access to risk management dashboards', 'Application', 'Web Application', 2, 1, 4, 4, 4, 'High', 'active', 'Cloudflare Edge', 'Custom Development', 'v5.1.0', '2024-12-14 16:20:00'),
(3, 'AI Risk Engine API', 'Machine learning microservice for automated risk scoring and threat detection', 'Application', 'API Service', 4, 1, 5, 4, 4, 'Critical', 'active', 'AWS us-west-2', 'Custom Development', 'v2.3.1', '2024-12-10 09:15:00'),
(4, 'Employee Workstations', 'MacBook Pro laptops used by development and security teams', 'Endpoint', 'Laptop', 2, 1, 3, 3, 3, 'Medium', 'active', 'Remote/Office Hybrid', 'Apple', 'MacBook Pro M2', '2024-11-20 14:45:00'),
(5, 'Kubernetes Cluster', 'Production container orchestration platform hosting microservices', 'Infrastructure', 'Container Platform', 3, 1, 4, 5, 5, 'Critical', 'active', 'AWS EKS', 'Amazon EKS', 'v1.28.3', '2024-12-12 11:30:00'),
(6, 'SSO Identity Provider', 'Okta-based single sign-on system for employee and customer authentication', 'Security', 'Identity Management', 5, 1, 5, 5, 4, 'Critical', 'active', 'Okta Cloud', 'Okta', 'Enterprise', '2024-12-08 15:50:00'),
(7, 'Code Repository', 'GitHub Enterprise for source code management and version control', 'Development', 'Source Control', 4, 1, 4, 4, 3, 'High', 'active', 'GitHub Cloud', 'GitHub', 'Enterprise Server', '2024-12-13 08:40:00'),
(8, 'Monitoring Platform', 'Datadog for infrastructure monitoring, APM, and security event correlation', 'Security', 'SIEM/Monitoring', 3, 1, 3, 4, 4, 'High', 'active', 'Datadog Cloud', 'Datadog', 'Enterprise', '2024-12-11 13:20:00'),
(9, 'Backup Storage', 'Encrypted S3 buckets for automated daily backups of critical systems', 'Infrastructure', 'Storage', 1, 1, 5, 5, 3, 'High', 'active', 'AWS S3', 'Amazon S3', 'Standard-IA', '2024-12-09 07:25:00'),
(10, 'VPN Gateway', 'FortiGate firewall providing secure remote access for distributed workforce', 'Network', 'VPN', 2, 1, 4, 4, 4, 'High', 'active', 'AWS VPC', 'Fortinet', 'FortiGate 600E', '2024-12-07 12:10:00'),
(11, 'CI/CD Pipeline', 'Jenkins-based continuous integration and deployment automation', 'Development', 'DevOps Tool', 4, 1, 3, 4, 4, 'Medium', 'active', 'AWS EC2', 'Jenkins', 'v2.426.1', '2024-12-06 14:55:00'),
(12, 'Email Security Gateway', 'Proofpoint email security for phishing protection and DLP', 'Security', 'Email Security', 5, 1, 4, 4, 3, 'Medium', 'active', 'Proofpoint Cloud', 'Proofpoint', 'Enterprise', '2024-12-05 09:30:00'),
(13, 'Mobile Device Management', 'Microsoft Intune for securing and managing corporate mobile devices', 'Security', 'MDM', 3, 1, 4, 3, 3, 'Medium', 'active', 'Microsoft Cloud', 'Microsoft', 'Intune', '2024-12-04 16:15:00'),
(14, 'Documentation Wiki', 'Confluence for technical documentation, runbooks, and knowledge sharing', 'Collaboration', 'Documentation', 2, 1, 2, 3, 3, 'Low', 'active', 'Atlassian Cloud', 'Atlassian', 'Confluence Cloud', '2024-12-03 11:40:00'),
(15, 'Network Switches', 'Cisco Catalyst switches in primary data center providing network connectivity', 'Network', 'Switch', 1, 1, 3, 4, 4, 'High', 'active', 'Primary Data Center', 'Cisco', 'Catalyst 9300', '2024-11-30 10:20:00');

-- Risks (12 contemporary cybersecurity risks)
INSERT INTO risks (id, title, description, category, subcategory, owner_id, organization_id, probability, impact, inherent_risk, residual_risk, status, review_date, mitigation_status, tags, created_at, updated_at) VALUES
(1, 'Cloud Infrastructure Data Breach', 'Potential unauthorized access to customer data stored in AWS RDS due to misconfigured security groups and insufficient encryption at rest', 'Cybersecurity', 'Data Protection', 2, 1, 4, 5, 20, 12, 'active', '2025-01-30', 'In Progress', 'cloud,data-breach,aws,encryption', '2024-11-15 09:30:00', '2024-12-15 14:20:00'),
(2, 'Supply Chain Compromise', 'Risk of malicious code injection through third-party npm packages in the React frontend application', 'Cybersecurity', 'Supply Chain', 4, 1, 3, 4, 12, 8, 'active', '2025-02-15', 'Planned', 'supply-chain,npm,frontend,dependencies', '2024-11-20 11:45:00', '2024-12-10 16:30:00'),
(3, 'Insider Threat - Privileged Access', 'Potential misuse of administrative privileges by employees with access to production systems and customer data', 'Operational', 'Human Factor', 5, 1, 2, 4, 8, 6, 'active', '2025-01-15', 'Ongoing', 'insider-threat,privileged-access,monitoring', '2024-11-25 13:20:00', '2024-12-12 10:15:00'),
(4, 'API Rate Limiting Bypass', 'Vulnerability in AI Risk Engine API allowing potential DDoS attacks and service degradation', 'Cybersecurity', 'Application Security', 3, 1, 3, 3, 9, 6, 'active', '2025-02-28', 'Not Started', 'api,rate-limiting,ddos,availability', '2024-12-01 08:50:00', '2024-12-14 15:40:00'),
(5, 'GDPR Compliance Gap', 'Insufficient data retention policies and user consent mechanisms for European customer data processing', 'Compliance', 'Data Privacy', 3, 1, 3, 3, 9, 6, 'active', '2025-01-20', 'In Progress', 'gdpr,privacy,consent,retention', '2024-11-18 14:10:00', '2024-12-08 09:25:00'),
(6, 'Phishing Campaign Targeting', 'Increased sophisticated phishing attempts targeting employee credentials and MFA bypass', 'Cybersecurity', 'Social Engineering', 2, 1, 4, 3, 12, 8, 'monitoring', '2025-03-10', 'Ongoing', 'phishing,social-engineering,mfa,training', '2024-11-22 10:35:00', '2024-12-13 12:45:00'),
(7, 'Kubernetes Security Misconfiguration', 'Pod security policies and RBAC rules may allow lateral movement within the cluster', 'Cybersecurity', 'Container Security', 1, 1, 2, 4, 8, 4, 'mitigated', '2025-02-05', 'Completed', 'kubernetes,rbac,pod-security,containers', '2024-11-10 16:20:00', '2024-12-11 08:30:00'),
(8, 'Third-Party SaaS Integration Risk', 'Okta SSO integration vulnerabilities could compromise authentication across all connected applications', 'Cybersecurity', 'Identity Management', 5, 1, 2, 4, 8, 6, 'active', '2025-01-25', 'In Progress', 'sso,okta,identity,authentication', '2024-11-28 12:15:00', '2024-12-09 14:50:00'),
(9, 'Mobile Device Data Leakage', 'Corporate data exposure through unmanaged BYOD devices and insufficient MDM enforcement', 'Operational', 'Mobile Security', 3, 1, 3, 2, 6, 4, 'active', '2025-02-20', 'Planned', 'mobile,byod,mdm,data-leakage', '2024-12-02 11:40:00', '2024-12-15 13:10:00'),
(10, 'Backup System Failure', 'Potential data loss due to untested backup recovery procedures and storage system vulnerabilities', 'Operational', 'Business Continuity', 1, 1, 2, 3, 6, 3, 'active', '2025-01-10', 'Ongoing', 'backup,recovery,business-continuity,testing', '2024-11-12 09:45:00', '2024-12-07 15:20:00'),
(11, 'Code Repository Exposure', 'Risk of intellectual property theft through GitHub misconfigurations and excessive repository permissions', 'Cybersecurity', 'Source Code Protection', 4, 1, 2, 3, 6, 4, 'monitoring', '2025-02-12', 'In Progress', 'github,source-code,intellectual-property,permissions', '2024-11-30 14:30:00', '2024-12-14 11:25:00'),
(12, 'Vendor Management Gap', 'Insufficient security assessments of critical vendors leading to potential supply chain vulnerabilities', 'Operational', 'Vendor Management', 2, 1, 2, 2, 4, 3, 'active', '2025-03-01', 'Not Started', 'vendor,assessment,supply-chain,due-diligence', '2024-12-05 16:10:00', '2024-12-15 10:05:00');

-- Service Catalog (10 business-critical services)
INSERT INTO service_catalog (id, name, description, category, owner_id, organization_id, confidentiality, integrity, availability, business_impact, status, dependencies, sla_target, recovery_time, recovery_point, created_at, updated_at) VALUES
(1, 'Customer Risk Dashboard', 'Primary web interface for customers to view and manage their risk assessments and compliance status', 'Customer-Facing', 2, 1, 4, 4, 4, 'Critical', 'active', 'Customer Web Portal, ARIA5 Platform Database, SSO Identity Provider', '99.9%', 4, 1, '2023-01-15 10:00:00', '2024-12-15 14:30:00'),
(2, 'AI Risk Scoring Engine', 'Machine learning service providing automated risk scoring, threat detection, and predictive analytics', 'Core Business', 4, 1, 5, 4, 4, 'Critical', 'active', 'AI Risk Engine API, ARIA5 Platform Database, Kubernetes Cluster', '99.95%', 2, 0.5, '2023-02-01 11:20:00', '2024-12-14 16:45:00'),
(3, 'Compliance Reporting Portal', 'Automated generation and delivery of SOC2, ISO27001, and custom compliance reports', 'Compliance', 3, 1, 5, 5, 3, 'High', 'active', 'ARIA5 Platform Database, Documentation Wiki, Email Security Gateway', '99.5%', 8, 4, '2023-02-15 09:30:00', '2024-12-13 12:20:00'),
(4, 'Threat Intelligence Feed', 'Real-time threat intelligence aggregation and correlation service for proactive risk identification', 'Security', 4, 1, 4, 4, 4, 'High', 'active', 'Monitoring Platform, AI Risk Engine API, External APIs', '99.8%', 6, 2, '2023-03-01 14:15:00', '2024-12-12 10:30:00'),
(5, 'User Authentication Service', 'Centralized authentication and authorization for all ARIA5 platform access', 'Infrastructure', 5, 1, 5, 5, 5, 'Critical', 'active', 'SSO Identity Provider, ARIA5 Platform Database', '99.99%', 1, 0, '2023-01-20 08:45:00', '2024-12-15 15:10:00'),
(6, 'Data Backup and Recovery', 'Automated backup service ensuring business continuity and disaster recovery capabilities', 'Infrastructure', 1, 1, 5, 5, 4, 'Critical', 'active', 'Backup Storage, Kubernetes Cluster, Network Switches', '99.9%', 12, 8, '2023-01-25 13:50:00', '2024-12-11 09:15:00'),
(7, 'API Gateway Service', 'Rate limiting, authentication, and routing for all external and internal API communications', 'Infrastructure', 3, 1, 4, 4, 4, 'High', 'active', 'AI Risk Engine API, User Authentication Service, Monitoring Platform', '99.8%', 4, 1, '2023-02-10 11:40:00', '2024-12-10 14:25:00'),
(8, 'Security Monitoring Dashboard', 'Real-time security event monitoring, alerting, and incident response coordination', 'Security', 2, 1, 4, 4, 5, 'High', 'active', 'Monitoring Platform, VPN Gateway, Email Security Gateway', '99.7%', 6, 2, '2023-03-05 16:20:00', '2024-12-09 13:40:00'),
(9, 'Mobile App Backend', 'RESTful API service supporting iOS and Android applications for mobile risk management', 'Customer-Facing', 4, 1, 4, 3, 3, 'Medium', 'active', 'AI Risk Engine API, Mobile Device Management, User Authentication Service', '99.5%', 8, 4, '2023-04-01 10:30:00', '2024-12-08 11:50:00'),
(10, 'Development CI/CD Pipeline', 'Automated build, test, and deployment pipeline ensuring secure software delivery', 'Development', 3, 1, 3, 4, 3, 'Medium', 'active', 'Code Repository, CI/CD Pipeline, Kubernetes Cluster', '99.0%', 24, 12, '2023-02-20 15:10:00', '2024-12-07 16:35:00');

-- Compliance Frameworks (5 major frameworks)
INSERT INTO compliance_frameworks (id, name, version, description, authority, scope, status, implementation_date, next_review, created_at, updated_at) VALUES
(1, 'SOC 2 Type II', '2017', 'Service Organization Control 2 - Security, Availability, Processing Integrity, Confidentiality, and Privacy', 'AICPA', 'Customer data processing and security controls', 'active', '2023-06-01', '2025-06-01', '2023-01-15 10:00:00', '2024-12-01 14:20:00'),
(2, 'ISO 27001:2022', '2022', 'Information Security Management System standard for systematic approach to managing company and customer information', 'ISO/IEC', 'Enterprise information security management', 'active', '2023-09-15', '2025-09-15', '2023-02-01 11:30:00', '2024-11-20 16:45:00'),
(3, 'NIST Cybersecurity Framework', 'v2.0', 'National Institute of Standards and Technology framework for managing and reducing cybersecurity risk', 'NIST', 'Cybersecurity risk management and incident response', 'active', '2023-03-10', '2025-03-10', '2023-01-20 09:15:00', '2024-12-10 13:30:00'),
(4, 'GDPR', '2018', 'General Data Protection Regulation for protection of EU residents personal data', 'European Union', 'Personal data processing of EU residents', 'active', '2023-01-01', '2025-01-01', '2023-01-01 00:00:00', '2024-12-15 10:25:00'),
(5, 'PCI DSS', 'v4.0', 'Payment Card Industry Data Security Standard for organizations handling credit card information', 'PCI SSC', 'Payment card data processing (future scope)', 'planned', '2025-03-01', '2026-03-01', '2024-11-01 12:00:00', '2024-12-05 15:40:00');

-- Compliance Controls (12 key controls across frameworks)
INSERT INTO compliance_controls (id, framework_id, control_id, title, description, category, implementation_status, owner_id, due_date, evidence_required, testing_frequency, last_tested, created_at, updated_at) VALUES
(1, 1, 'CC6.1', 'Multi-Factor Authentication', 'Implement MFA for all user accounts accessing customer data and administrative systems', 'Access Controls', 'implemented', 5, '2024-06-01', 'Configuration screenshots, access logs, policy documentation', 'quarterly', '2024-12-01', '2023-06-01 10:00:00', '2024-12-01 15:20:00'),
(2, 1, 'CC6.2', 'Privileged Access Management', 'Restrict and monitor privileged access to production systems and customer data', 'Access Controls', 'implemented', 2, '2024-07-01', 'PAM system logs, access reviews, approval workflows', 'monthly', '2024-11-15', '2023-06-15 11:30:00', '2024-11-15 14:40:00'),
(3, 1, 'CC7.1', 'System Monitoring', 'Continuous monitoring of system performance, security events, and availability metrics', 'System Operations', 'implemented', 3, '2024-08-01', 'Monitoring dashboards, alert configurations, incident logs', 'continuous', '2024-12-15', '2023-07-01 09:45:00', '2024-12-15 16:10:00'),
(4, 2, 'A.5.1', 'Information Security Policy', 'Establish and maintain comprehensive information security policies and procedures', 'Governance', 'implemented', 1, '2024-09-01', 'Policy documents, approval records, training completion', 'annually', '2024-09-01', '2023-09-15 14:20:00', '2024-09-01 12:30:00'),
(5, 2, 'A.8.1', 'Asset Management', 'Maintain accurate inventory of all IT assets and their security classifications', 'Asset Management', 'implemented', 2, '2024-10-01', 'Asset inventory, classification labels, ownership records', 'quarterly', '2024-10-01', '2023-10-01 13:15:00', '2024-10-01 11:45:00'),
(6, 2, 'A.12.6', 'Security Event Management', 'Collect, analyze, and respond to security events and incidents', 'Incident Management', 'partial', 4, '2025-01-31', 'SIEM configurations, incident response procedures, logs', 'monthly', '2024-11-30', '2024-01-15 10:50:00', '2024-11-30 09:20:00'),
(7, 3, 'ID.AM-1', 'Asset Identification', 'Physical devices and systems within the organization are inventoried', 'Identify', 'implemented', 3, '2024-05-01', 'Asset database, network scans, physical inventory', 'quarterly', '2024-11-01', '2023-05-01 15:30:00', '2024-11-01 14:15:00'),
(8, 3, 'PR.AC-1', 'Access Control Management', 'Identities and credentials are issued, managed, verified, revoked, and audited', 'Protect', 'implemented', 5, '2024-06-15', 'Identity management system, access reviews, audit logs', 'monthly', '2024-12-10', '2023-06-15 12:40:00', '2024-12-10 10:25:00'),
(9, 3, 'DE.CM-1', 'Network Monitoring', 'The network is monitored to detect potential cybersecurity events', 'Detect', 'implemented', 2, '2024-07-20', 'Network monitoring tools, detection rules, alert logs', 'continuous', '2024-12-14', '2023-07-20 11:10:00', '2024-12-14 13:50:00'),
(10, 4, 'Article 25', 'Data Protection by Design', 'Implement data protection measures by design and by default', 'Privacy Engineering', 'partial', 3, '2025-02-28', 'Privacy impact assessments, technical measures documentation', 'semi-annually', '2024-08-01', '2024-02-01 16:00:00', '2024-08-01 15:30:00'),
(11, 4, 'Article 32', 'Security of Processing', 'Implement appropriate technical and organizational security measures', 'Data Security', 'implemented', 2, '2024-12-31', 'Security controls documentation, encryption evidence, access logs', 'quarterly', '2024-12-01', '2023-12-31 09:00:00', '2024-12-01 11:20:00'),
(12, 4, 'Article 33', 'Breach Notification', 'Notify supervisory authority of personal data breaches within 72 hours', 'Incident Response', 'implemented', 4, '2024-01-01', 'Incident response procedures, notification templates, training records', 'annually', '2024-06-01', '2024-01-01 14:45:00', '2024-06-01 16:40:00');

-- Threat Intelligence (8 current threat indicators)
INSERT INTO threat_intelligence (id, indicator_type, indicator_value, threat_type, severity, confidence, source, description, first_seen, last_seen, status, tags, created_at, updated_at) VALUES
(1, 'domain', 'malicious-phishing-aria5.com', 'Phishing', 'high', 95, 'Security Team', 'Typosquatting domain attempting to impersonate ARIA5 login portal', '2024-12-10 14:30:00', '2024-12-15 09:20:00', 'active', 'phishing,typosquatting,aria5,credential-harvesting', '2024-12-10 14:35:00', '2024-12-15 09:25:00'),
(2, 'ip', '185.220.101.42', 'Malware C2', 'critical', 90, 'Threat Intelligence Feed', 'Known command and control server for banking trojan targeting financial services', '2024-12-08 11:15:00', '2024-12-14 16:45:00', 'active', 'malware,c2,banking-trojan,financial', '2024-12-08 11:20:00', '2024-12-14 16:50:00'),
(3, 'hash', 'd1ce85ea5638e6095212e194db958c67', 'Ransomware', 'critical', 85, 'VirusTotal', 'LockBit 3.0 ransomware variant specifically targeting cloud infrastructure', '2024-12-12 08:40:00', '2024-12-13 12:30:00', 'active', 'ransomware,lockbit,cloud-infrastructure,encryption', '2024-12-12 08:45:00', '2024-12-13 12:35:00'),
(4, 'email', 'security-alert@aria5-support.net', 'Phishing', 'medium', 80, 'Email Security Gateway', 'Spoofed sender attempting to deliver credential harvesting emails to employees', '2024-12-11 13:25:00', '2024-12-15 10:10:00', 'monitoring', 'phishing,email-spoofing,credential-theft,employees', '2024-12-11 13:30:00', '2024-12-15 10:15:00'),
(5, 'url', 'https://bit.ly/aria5-urgent-update', 'Social Engineering', 'medium', 75, 'Security Team', 'Shortened URL in phishing campaign directing to malicious software download', '2024-12-09 16:20:00', '2024-12-14 11:40:00', 'blocked', 'social-engineering,malware-download,url-shortener', '2024-12-09 16:25:00', '2024-12-14 11:45:00'),
(6, 'ip', '103.85.24.157', 'Brute Force', 'medium', 70, 'Failed Login Monitor', 'Source of repeated failed authentication attempts against SSO portal', '2024-12-13 09:50:00', '2024-12-15 14:20:00', 'active', 'brute-force,authentication,sso,failed-login', '2024-12-13 09:55:00', '2024-12-15 14:25:00'),
(7, 'domain', 'secure-aria5-update.org', 'Malware Distribution', 'high', 88, 'DNS Monitoring', 'Malicious domain hosting fake software updates containing backdoor trojans', '2024-12-07 12:15:00', '2024-12-12 15:30:00', 'sinkholed', 'malware,backdoor,fake-updates,software-distribution', '2024-12-07 12:20:00', '2024-12-12 15:35:00'),
(8, 'hash', 'a7f2c3e8d9b1f4e6a8c2d5e7f9b3c6d8', 'Supply Chain', 'high', 92, 'Code Analysis', 'Malicious npm package detected in dependency scan of React application', '2024-12-14 10:30:00', '2024-12-15 08:15:00', 'quarantined', 'supply-chain,npm,malicious-package,code-injection', '2024-12-14 10:35:00', '2024-12-15 08:20:00');

-- Risk Control Mappings (15 mappings linking risks to controls)
INSERT INTO risk_control_mappings (id, risk_id, control_id, effectiveness_rating, mapping_confidence, notes, created_at, updated_at) VALUES
(1, 1, 'CC6.1', 85, 0.92, 'MFA directly mitigates unauthorized access risk to cloud infrastructure', '2024-12-01 10:00:00', '2024-12-15 14:30:00'),
(2, 1, 'CC6.2', 90, 0.88, 'PAM controls reduce data breach risk by limiting privileged access to cloud resources', '2024-12-01 10:05:00', '2024-12-15 14:35:00'),
(3, 1, 'A.12.6', 75, 0.85, 'Security event management helps detect and respond to potential data breach attempts', '2024-12-01 10:10:00', '2024-12-15 14:40:00'),
(4, 2, 'ID.AM-1', 70, 0.80, 'Asset identification helps track third-party dependencies that pose supply chain risks', '2024-12-02 11:15:00', '2024-12-14 16:25:00'),
(5, 2, 'DE.CM-1', 80, 0.87, 'Network monitoring can detect anomalous behavior from compromised supply chain components', '2024-12-02 11:20:00', '2024-12-14 16:30:00'),
(6, 3, 'CC6.2', 95, 0.94, 'Privileged access management directly addresses insider threat risks', '2024-12-03 09:30:00', '2024-12-13 12:45:00'),
(7, 3, 'CC7.1', 85, 0.89, 'System monitoring helps detect unusual privileged user activity patterns', '2024-12-03 09:35:00', '2024-12-13 12:50:00'),
(8, 4, 'PR.AC-1', 80, 0.86, 'Access control management includes API rate limiting and authentication controls', '2024-12-04 14:20:00', '2024-12-12 10:15:00'),
(9, 4, 'DE.CM-1', 75, 0.83, 'Network monitoring can detect API abuse and DDoS attack patterns', '2024-12-04 14:25:00', '2024-12-12 10:20:00'),
(10, 5, 'Article 25', 90, 0.91, 'Data protection by design directly addresses GDPR compliance gaps', '2024-12-05 13:40:00', '2024-12-11 15:10:00'),
(11, 5, 'Article 32', 85, 0.88, 'Security of processing measures support GDPR compliance requirements', '2024-12-05 13:45:00', '2024-12-11 15:15:00'),
(12, 6, 'CC6.1', 70, 0.82, 'MFA provides additional protection against phishing credential compromise', '2024-12-06 12:10:00', '2024-12-10 09:30:00'),
(13, 8, 'PR.AC-1', 88, 0.90, 'Identity and access management controls directly mitigate SSO integration risks', '2024-12-08 15:25:00', '2024-12-09 11:40:00'),
(14, 9, 'A.8.1', 75, 0.84, 'Asset management helps track and secure mobile devices containing corporate data', '2024-12-09 10:50:00', '2024-12-08 14:20:00'),
(15, 11, 'A.5.1', 80, 0.86, 'Information security policies include secure code repository management requirements', '2024-12-11 16:15:00', '2024-12-07 13:35:00');

-- System Configuration (Enable RAG and other features)
INSERT OR REPLACE INTO system_configuration (key, value, description, created_at, updated_at) VALUES
('rag_enabled', 'true', 'Enable RAG (Retrieval Augmented Generation) for AI assistant', '2024-12-15 10:00:00', '2024-12-15 10:00:00'),
('ai_confidence_threshold', '0.85', 'Minimum confidence score for AI-generated risk-control mappings', '2024-12-15 10:00:00', '2024-12-15 10:00:00'),
('threat_intelligence_retention_days', '90', 'Number of days to retain threat intelligence indicators', '2024-12-15 10:00:00', '2024-12-15 10:00:00'),
('compliance_review_notification_days', '30', 'Days before compliance review to send notifications', '2024-12-15 10:00:00', '2024-12-15 10:00:00'),
('risk_review_frequency_days', '90', 'Default frequency for risk review in days', '2024-12-15 10:00:00', '2024-12-15 10:00:00');

-- RAG Documents (5 knowledge base documents for AI assistant)
INSERT INTO rag_documents (id, title, content, document_type, source_url, metadata, status, indexed_at, created_at, updated_at) VALUES
(1, 'ARIA5 Platform Security Architecture', 'The ARIA5 Enterprise Security Intelligence Platform employs a multi-layered security architecture built on AWS cloud infrastructure. Core components include: Kubernetes-based microservices with pod security policies, PostgreSQL database with encryption at rest and in transit, React frontend with CSP headers and XSS protection, AI risk engine using machine learning for threat detection, Okta SSO integration for centralized authentication. Security controls implement defense in depth with network segmentation, application firewalls, and continuous monitoring through Datadog SIEM integration.', 'Security Documentation', 'https://docs.aria5.com/security-architecture', '{"classification": "internal", "version": "2.1", "owner": "security-team"}', 'active', '2024-12-15 10:00:00', '2024-11-15 09:30:00', '2024-12-15 10:00:00'),
(2, 'SOC 2 Type II Implementation Guide', 'SOC 2 Type II compliance requires implementation of security, availability, processing integrity, confidentiality, and privacy trust service criteria. Key controls include: Multi-factor authentication for all administrative access (CC6.1), privileged access management with approval workflows (CC6.2), continuous system monitoring and alerting (CC7.1), formal change management processes (CC8.1), and comprehensive logging and retention policies (CC6.3). Evidence collection includes configuration screenshots, access logs, incident reports, and policy documentation reviewed quarterly by internal audit team.', 'Compliance Guide', 'https://docs.aria5.com/compliance/soc2', '{"framework": "SOC2", "type": "Type II", "auditor": "KPMG"}', 'active', '2024-12-14 15:30:00', '2024-06-01 10:00:00', '2024-12-14 15:30:00'),
(3, 'Incident Response Playbook', 'ARIA5 incident response follows NIST framework phases: Preparation includes trained response team, communication plans, and pre-positioned tools. Detection and Analysis use SIEM correlation rules, threat intelligence feeds, and automated alerting for security events. Containment, Eradication, and Recovery procedures include network isolation, malware removal, system restoration from clean backups, and business continuity activation. Post-incident activities include lessons learned reviews, playbook updates, and regulatory notifications within required timeframes (GDPR 72 hours, SOC 2 customer notification).', 'Incident Response', 'https://docs.aria5.com/incident-response', '{"classification": "confidential", "review_frequency": "quarterly", "owner": "security-team"}', 'active', '2024-12-13 11:45:00', '2024-03-10 14:20:00', '2024-12-13 11:45:00'),
(4, 'GDPR Data Processing Inventory', 'ARIA5 processes personal data of EU residents through: Customer account information (name, email, company details) stored in encrypted PostgreSQL database with 3-year retention, Risk assessment data input by customers with legitimate interest legal basis, Authentication logs retained for security monitoring (6 months), Marketing communications with explicit consent and opt-out mechanisms. Data subject rights include access, rectification, erasure, portability, and objection implemented through customer portal and privacy team workflows. Cross-border transfers to US infrastructure protected by Standard Contractual Clauses and adequacy decisions.', 'Privacy Documentation', 'https://docs.aria5.com/privacy/gdpr-inventory', '{"regulation": "GDPR", "dpo": "privacy@aria5.com", "last_review": "2024-11-01"}', 'active', '2024-12-12 14:20:00', '2024-01-01 00:00:00', '2024-12-12 14:20:00'),
(5, 'Threat Intelligence Integration Guide', 'ARIA5 threat intelligence program integrates multiple sources: Commercial feeds (Recorded Future, CrowdStrike), open source intelligence (MISP, AlienVault OTX), internal security team research, and customer-reported indicators. IOCs are normalized to STIX format and correlated with internal security events through Datadog SIEM. Automated enrichment includes geolocation, reputation scoring, and false positive filtering. Threat hunting uses IOCs for proactive detection in network logs, endpoint telemetry, and email security gateways. Intelligence sharing follows TLP protocols with industry partners and government agencies.', 'Threat Intelligence', 'https://docs.aria5.com/threat-intelligence', '{"classification": "internal", "sources": ["commercial", "osint", "internal"], "format": "STIX"}', 'active', '2024-12-11 09:15:00', '2024-08-15 11:30:00', '2024-12-11 09:15:00');

-- Generate some audit logs for recent activity
INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, status, created_at) VALUES
(1, 2, 'CREATE', 'risk', 1, '{"title": "Cloud Infrastructure Data Breach", "risk_score": 20}', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'success', '2024-11-15 09:35:00'),
(2, 3, 'UPDATE', 'compliance_control', 6, '{"status": "partial", "due_date": "2025-01-31"}', '10.0.1.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'success', '2024-11-30 09:25:00'),
(3, 4, 'VIEW', 'threat_intelligence', 1, '{"indicator": "malicious-phishing-aria5.com"}', '172.16.0.25', 'Mozilla/5.0 (X11; Linux x86_64)', 'success', '2024-12-10 14:40:00'),
(4, 1, 'DELETE', 'user_session', 12345, '{"reason": "administrative_cleanup"}', '192.168.1.10', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'success', '2024-12-15 10:15:00'),
(5, 5, 'CREATE', 'asset', 15, '{"name": "Network Switches", "category": "Network"}', '10.0.2.75', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'success', '2024-11-30 10:25:00');

-- Update statistics (this will be reflected in dashboard)
ANALYZE;