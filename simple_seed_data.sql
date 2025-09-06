-- ARIA5.1 Enterprise Security Intelligence Platform - Core Seed Data
-- Simplified version focusing on core tables only

-- Disable foreign key constraints during data loading
PRAGMA foreign_keys = OFF;

-- Clear existing data in safe order
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

-- Re-enable foreign key constraints
PRAGMA foreign_keys = ON;

-- Update database statistics
ANALYZE;