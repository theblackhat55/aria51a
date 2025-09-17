-- ARIA52 Seed Data - Matching Actual Database Schema
-- Clean data insertion for all core functionality

-- Organizations
INSERT INTO organizations (id, name, description, type, industry, size, country, is_active, created_at, updated_at) VALUES
(1, 'ARIA52 Corporation', 'Primary demonstration organization for ARIA52 security platform', 'Enterprise', 'Technology', 'Medium', 'United States', 1, '2025-09-16 10:00:00', '2025-09-16 10:00:00');

-- Users (Demo accounts with working authentication)
INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, organization_id, is_active, last_login, created_at, updated_at) VALUES
(1, 'admin', 'admin@aria52.com', 'demo123', 'Admin', 'User', 'admin', 1, 1, '2025-09-16 12:05:35', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(2, 'avi_security', 'avi@aria52.com', 'demo123', 'Avi', 'Adiyala', 'risk_manager', 1, 1, '2025-09-16 11:04:17', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(3, 'sarah_compliance', 'sarah@aria52.com', 'demo123', 'Sarah', 'Johnson', 'compliance_officer', 1, 1, NULL, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(4, 'mike_analyst', 'mike@aria52.com', 'demo123', 'Michael', 'Torres', 'analyst', 1, 1, NULL, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(5, 'demo_user', 'demo@aria52.com', 'demo123', 'Demo', 'User', 'user', 1, 1, NULL, '2025-09-16 10:00:00', '2025-09-16 10:00:00');

-- Risks (Using actual risks table structure)
INSERT INTO risks (id, title, description, category, subcategory, owner_id, organization_id, probability, impact, inherent_risk, residual_risk, status, review_date, due_date, source, affected_assets, created_by, created_at, updated_at) VALUES
(1, 'Cloud Infrastructure Data Breach', 'Risk of unauthorized access to customer data stored in cloud infrastructure due to misconfigured security groups', 'Cybersecurity', 'Data Protection', 2, 1, 4, 5, 20, 12, 'active', '2025-12-15', '2025-11-30', 'Security Assessment', 'Customer Database, Web Application', 2, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(2, 'Supply Chain Compromise', 'Risk of malicious code injection through third-party dependencies and npm packages', 'Cybersecurity', 'Supply Chain', 4, 1, 3, 4, 12, 8, 'active', '2025-12-12', '2025-11-15', 'Code Analysis', 'Web Application, AI Risk Engine', 2, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(3, 'Insider Threat - Privileged Access', 'Risk of malicious or accidental data exposure by privileged users with administrative access', 'Operational', 'Human Factor', 2, 1, 2, 4, 8, 6, 'monitoring', '2025-12-08', '2025-10-30', 'Security Review', 'All Critical Systems', 2, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(4, 'API Rate Limiting Bypass', 'Vulnerability in API endpoints allowing potential DDoS attacks and service degradation', 'Cybersecurity', 'Application Security', 4, 1, 3, 3, 9, 6, 'active', '2025-12-14', '2025-11-20', 'Penetration Test', 'AI Risk Engine, Customer Portal', 4, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(5, 'GDPR Compliance Gap', 'Insufficient data retention policies and user consent mechanisms for European customer data', 'Compliance', 'Data Privacy', 3, 1, 3, 3, 9, 6, 'escalated', '2025-11-30', '2025-10-15', 'Compliance Audit', 'Customer Database, Web Application', 3, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(6, 'Phishing Campaign Targeting', 'Increased sophisticated phishing attempts targeting employee credentials and MFA bypass', 'Cybersecurity', 'Social Engineering', 2, 1, 4, 3, 12, 8, 'active', '2025-12-30', '2025-11-10', 'Threat Intelligence', 'Identity Provider, Employee Workstations', 2, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(7, 'Kubernetes Security Misconfiguration', 'Pod security policies and RBAC rules may allow lateral movement within container cluster', 'Cybersecurity', 'Container Security', 4, 1, 2, 4, 8, 4, 'mitigated', '2025-12-05', 'NULL', 'Security Scan', 'Container Platform, AI Risk Engine', 4, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(8, 'Third-Party SaaS Integration Risk', 'Okta SSO integration vulnerabilities could compromise authentication across applications', 'Cybersecurity', 'Identity Management', 3, 1, 2, 4, 8, 6, 'active', '2025-12-01', '2025-11-25', 'Security Review', 'Identity Provider, All Applications', 3, '2025-09-16 10:00:00', '2025-09-16 10:00:00');

-- Assets (Using standard assets table if available)
INSERT OR IGNORE INTO assets (id, name, description, category, type, owner_id, organization_id, confidentiality, integrity, availability, business_impact, status, location, vendor, version, last_updated) VALUES
(1, 'Customer Database', 'Primary PostgreSQL database storing customer risk data and user accounts', 'Infrastructure', 'Database', 2, 1, 5, 5, 4, 'Critical', 'active', 'AWS RDS us-east-1', 'PostgreSQL', '15.2', '2025-09-16 08:00:00'),
(2, 'Customer Web Portal', 'React-based web application for customer access to dashboards', 'Application', 'Web Application', 4, 1, 4, 4, 4, 'Critical', 'active', 'Cloudflare Pages', 'ARIA52 Platform', '5.2.0', '2025-09-16 10:15:00'),
(3, 'AI Risk Engine', 'Machine learning microservice for automated risk scoring', 'Application', 'API Service', 2, 1, 5, 4, 4, 'Critical', 'active', 'AWS ECS us-west-2', 'Custom ML Platform', '2.1.5', '2025-09-16 09:30:00'),
(4, 'Identity Provider', 'Okta-based SSO system for authentication', 'Security', 'Identity Management', 3, 1, 5, 5, 4, 'Critical', 'active', 'Okta Cloud', 'Okta Enterprise', '2024.08.2', '2025-09-15 14:20:00'),
(5, 'Monitoring Platform', 'Datadog for infrastructure monitoring and security events', 'Security', 'SIEM/Monitoring', 4, 1, 3, 4, 4, 'High', 'active', 'Datadog Cloud', 'Datadog Enterprise', '7.48.0', '2025-09-16 11:45:00');

-- Compliance Frameworks
INSERT OR IGNORE INTO compliance_frameworks (id, name, version, description, authority, scope, status, implementation_date, next_review, created_at, updated_at) VALUES
(1, 'SOC 2 Type II', '2017', 'Service Organization Control 2 for security, availability, and confidentiality', 'AICPA', 'Security controls and data protection', 'active', '2025-06-01', '2025-12-01', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(2, 'GDPR', '2018', 'General Data Protection Regulation for EU data privacy compliance', 'European Commission', 'Personal data processing of EU residents', 'active', '2025-05-01', '2025-11-01', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(3, 'ISO 27001', '2022', 'Information Security Management System international standard', 'ISO/IEC', 'Enterprise information security management', 'planned', '2026-03-01', '2026-09-01', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(4, 'NIST CSF', 'v2.0', 'National Institute of Standards cybersecurity framework', 'NIST', 'Cybersecurity risk management processes', 'active', '2025-07-01', '2025-12-15', '2025-09-16 10:00:00', '2025-09-16 10:00:00');

-- Threat Feeds
INSERT OR IGNORE INTO threat_feeds (feed_id, name, type, url, api_key, format, description, active, sync_interval, confidence_threshold, auto_sync, validate_indicators, last_sync, last_error, ioc_count, created_at, updated_at) VALUES
(1, 'ARIA52 Internal Feed', 'custom', 'https://api.aria52.com/threats', 'internal-feed-key', 'json', 'Internal threat intelligence and security indicators', 1, 24, 75, 1, 1, '2025-09-16 06:00:00', NULL, 156, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(2, 'Commercial TI Feed', 'stix', 'https://feeds.threatintel.com/v1/indicators', 'commercial-api-key', 'stix', 'Commercial threat intelligence feed with IOCs', 1, 12, 80, 1, 1, '2025-09-16 08:00:00', NULL, 2847, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(3, 'Open Source Intel', 'misp', 'https://misppriv.circl.lu/events/csv/download', NULL, 'csv', 'MISP community threat intelligence sharing', 1, 48, 70, 1, 1, '2025-09-15 20:00:00', NULL, 1203, '2025-09-16 10:00:00', '2025-09-16 10:00:00');

-- IOCs (Threat Intelligence Indicators)
INSERT OR IGNORE INTO iocs (id, indicator_type, indicator_value, threat_type, severity, confidence, source, description, first_seen, last_seen, status, tags, created_at, updated_at) VALUES
(1, 'domain', 'malicious-aria52.com', 'Phishing', 'high', 95, 'Internal Security Team', 'Typosquatting domain targeting ARIA52 users for credential theft', '2025-09-15 14:30:00', '2025-09-16 09:20:00', 'active', 'phishing,typosquatting,credential-theft,aria52', '2025-09-15 14:35:00', '2025-09-16 09:25:00'),
(2, 'ip', '185.220.102.55', 'Malware C2', 'critical', 92, 'Commercial TI Feed', 'Command and control server for banking malware targeting financial services', '2025-09-14 11:15:00', '2025-09-16 08:45:00', 'active', 'malware,c2,banking-trojan,financial-targeting', '2025-09-14 11:20:00', '2025-09-16 08:50:00'),
(3, 'hash', 'a1b2c3d4e5f6789012345678901234567890abcdef', 'Ransomware', 'critical', 88, 'VirusTotal', 'Ransomware variant specifically targeting cloud infrastructure providers', '2025-09-13 08:40:00', '2025-09-15 12:30:00', 'active', 'ransomware,cloud-targeting,infrastructure', '2025-09-13 08:45:00', '2025-09-15 12:35:00'),
(4, 'email', 'security-update@aria52-alerts.net', 'Phishing', 'medium', 82, 'Email Security Gateway', 'Spoofed security alert emails targeting employee credentials', '2025-09-12 13:25:00', '2025-09-16 07:10:00', 'monitoring', 'phishing,email-spoofing,employee-targeting', '2025-09-12 13:30:00', '2025-09-16 07:15:00'),
(5, 'url', 'https://aria52-security-update.net/download', 'Malware Distribution', 'high', 90, 'Web Security Scanner', 'Malicious software download site impersonating security updates', '2025-09-11 16:20:00', '2025-09-14 11:40:00', 'blocked', 'malware-distribution,fake-updates,impersonation', '2025-09-11 16:25:00', '2025-09-14 11:45:00'),
(6, 'ip', '103.85.24.157', 'Brute Force', 'medium', 78, 'Failed Login Monitor', 'Source of repeated authentication attempts against SSO portal', '2025-09-13 09:50:00', '2025-09-16 14:20:00', 'active', 'brute-force,authentication,sso,credential-stuffing', '2025-09-13 09:55:00', '2025-09-16 14:25:00'),
(7, 'domain', 'secure-aria52-update.org', 'Malware Distribution', 'high', 89, 'DNS Monitoring', 'Malicious domain hosting fake software updates with backdoor trojans', '2025-09-10 12:15:00', '2025-09-12 15:30:00', 'sinkholed', 'malware,backdoor,fake-updates,software-distribution', '2025-09-10 12:20:00', '2025-09-12 15:35:00'),
(8, 'hash', 'f7e8d9c1a2b3456789012345678901234567890def', 'Supply Chain', 'high', 94, 'Code Analysis Scanner', 'Malicious npm package detected in dependency chain of web applications', '2025-09-14 10:30:00', '2025-09-15 08:15:00', 'quarantined', 'supply-chain,npm,malicious-package,code-injection', '2025-09-14 10:35:00', '2025-09-15 08:20:00');

-- Services
INSERT OR IGNORE INTO services (id, name, description, category, owner_id, organization_id, confidentiality, integrity, availability, business_impact, status, dependencies, sla_target, recovery_time, recovery_point, created_at, updated_at) VALUES
(1, 'Customer Portal', 'Main customer-facing risk management application', 'Customer-Facing', 2, 1, 4, 4, 5, 'Critical', 'active', 'Customer Database, Identity Provider', '99.9%', 2, 0.5, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(2, 'Risk Assessment API', 'RESTful API for automated risk assessment and scoring', 'Core Business', 4, 1, 5, 4, 4, 'Critical', 'active', 'AI Risk Engine, Customer Database', '99.95%', 1, 0.25, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(3, 'Threat Intelligence Service', 'Automated threat intelligence collection and correlation', 'Security', 4, 1, 4, 4, 4, 'High', 'active', 'Threat Feeds, Monitoring Platform', '99.5%', 4, 1, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(4, 'Compliance Dashboard', 'Compliance monitoring and reporting interface', 'Compliance', 3, 1, 4, 5, 3, 'High', 'active', 'Customer Database, Framework Controls', '99.0%', 6, 2, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(5, 'AI Assistant Service', 'Natural language AI assistant for security guidance', 'AI/ML', 2, 1, 3, 3, 3, 'Medium', 'active', 'RAG Documents, AI Configurations', '98.5%', 8, 4, '2025-09-16 10:00:00', '2025-09-16 10:00:00');

-- System Configuration
INSERT OR IGNORE INTO system_configuration (key, value, description, created_at, updated_at) VALUES
('rag_enabled', 'true', 'Enable RAG functionality for AI assistant responses', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
('ai_confidence_threshold', '0.85', 'Minimum confidence score for AI-generated risk assessments', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
('threat_retention_days', '90', 'Number of days to retain threat intelligence indicators', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
('compliance_notification_days', '30', 'Days before compliance review to send notifications', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
('risk_review_frequency', '90', 'Default frequency for risk reviews in days', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
('dashboard_refresh_interval', '300', 'Dashboard auto-refresh interval in seconds', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
('max_login_attempts', '5', 'Maximum failed login attempts before account lockout', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
('session_timeout_minutes', '30', 'User session timeout in minutes', '2025-09-16 10:00:00', '2025-09-16 10:00:00');

-- AI Configurations
INSERT OR IGNORE INTO ai_configurations (id, name, model_type, endpoint_url, api_key, max_tokens, temperature, enabled, description, created_at, updated_at) VALUES
(1, 'Risk Assessment AI', 'gpt-4', 'https://api.openai.com/v1/chat/completions', 'sk-placeholder-key', 2048, 0.3, 1, 'AI model for automated risk assessment and scoring', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(2, 'Threat Intelligence AI', 'claude-3', 'https://api.anthropic.com/v1/messages', 'sk-ant-placeholder', 1024, 0.2, 1, 'AI model for threat intelligence analysis and correlation', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(3, 'Compliance Assistant', 'gpt-3.5-turbo', 'https://api.openai.com/v1/chat/completions', 'sk-placeholder-key-2', 1024, 0.4, 1, 'AI assistant for compliance guidance and recommendations', '2025-09-16 10:00:00', '2025-09-16 10:00:00');

-- Audit Logs (Recent activity for demonstration)
INSERT OR IGNORE INTO audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, status, created_at) VALUES
(1, 2, 'CREATE', 'risk', 1, '{"title": "Cloud Infrastructure Data Breach", "category": "Cybersecurity", "risk_score": 20}', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'success', '2025-09-16 09:35:00'),
(2, 3, 'UPDATE', 'compliance_framework', 2, '{"name": "GDPR", "status": "active", "next_review": "2025-11-01"}', '10.0.1.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'success', '2025-09-16 10:25:00'),
(3, 4, 'VIEW', 'threat_intelligence', 1, '{"indicator": "malicious-aria52.com", "threat_type": "phishing", "confidence": 95}', '172.16.0.25', 'Mozilla/5.0 (X11; Linux x86_64)', 'success', '2025-09-16 11:40:00'),
(4, 1, 'DELETE', 'user_session', 12345, '{"reason": "security_cleanup", "session_age_hours": 168}', '192.168.1.10', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'success', '2025-09-16 12:15:00'),
(5, 2, 'CREATE', 'asset', 5, '{"name": "Monitoring Platform", "category": "Security", "criticality": "High", "business_impact": "High"}', '10.0.2.75', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'success', '2025-09-16 13:25:00'),
(6, 4, 'UPDATE', 'risk', 7, '{"status": "mitigated", "residual_risk": 4, "review_date": "2025-12-05"}', '172.16.0.30', 'Mozilla/5.0 (X11; Linux x86_64)', 'success', '2025-09-16 14:10:00'),
(7, 3, 'CREATE', 'compliance_framework', 3, '{"name": "ISO 27001", "status": "planned", "implementation_date": "2026-03-01"}', '192.168.1.200', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'success', '2025-09-16 14:45:00'),
(8, 2, 'VIEW', 'dashboard', 'admin', '{"dashboard_type": "admin", "widgets_loaded": 8, "load_time_ms": 1247}', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'success', '2025-09-16 15:20:00');

-- Update database statistics for optimal query performance
ANALYZE;