-- ARIA52 Seed Data - Based on Working aria51d Structure
-- Simplified but comprehensive data for all key functionality

-- Organizations
INSERT INTO organizations (id, name, description, parent_id, org_type, contact_email, risk_tolerance, created_at, updated_at) VALUES
(1, 'ARIA5 Corporation', 'Primary demonstration organization for ARIA52 platform', NULL, 'Enterprise', 'admin@aria52.com', 'Medium', '2025-09-16 10:00:00', '2025-09-16 10:00:00');

-- Users (Demo accounts with proper authentication)
INSERT INTO users (id, email, username, password_hash, first_name, last_name, department, job_title, phone, role, is_active, last_login, mfa_enabled, mfa_secret, created_at, updated_at, organization_id, auth_type, saml_subject_id, password_salt, failed_login_attempts, locked_until, password_changed_at, permissions, manager_id, last_password_change, password_expires_at) VALUES
(1, 'admin@aria52.com', 'admin', 'demo123', 'Admin', 'User', '', 'System Administrator', '', 'admin', 1, '2025-09-16 12:05:35', 0, '', '2025-09-16 10:00:00', '2025-09-16 10:00:00', 1, 'local', '', 'd35e9d91ac282125d917fb3c62880fc3daa0292b8a86f607c11f6d4f733fa7b7', 0, '', '2025-09-16 10:00:00', '', NULL, '', ''),
(2, 'avi@aria52.com', 'avi_security', 'demo123', 'Avi', 'Adiyala', 'Security', 'Risk Manager', '', 'risk_manager', 1, '2025-09-16 11:04:17', 0, '', '2025-09-16 10:00:00', '2025-09-16 10:00:00', 1, 'local', '', '6c888763126e759d9ab158845151362d197dd51f13b551705b2316d1067bf4b1', 0, '', '2025-09-16 10:00:00', '', NULL, '', ''),
(3, 'sarah@aria52.com', 'sarah_compliance', 'demo123', 'Sarah', 'Johnson', 'Compliance', 'Compliance Officer', '', 'compliance_officer', 1, '', 0, '', '2025-09-16 10:00:00', '2025-09-16 10:00:00', 1, 'local', '', '', 0, '', '', '', NULL, '', ''),
(4, 'mike@aria52.com', 'mike_analyst', 'demo123', 'Michael', 'Torres', 'Security', 'Security Analyst', '', 'analyst', 1, '', 0, '', '2025-09-16 10:00:00', '2025-09-16 10:00:00', 1, 'local', '', '', 0, '', '', '', NULL, '', ''),
(5, 'demo@aria52.com', 'demo_user', 'demo123', 'Demo', 'User', '', 'Demo Account', '', 'user', 1, '', 0, '', '2025-09-16 10:00:00', '2025-09-16 10:00:00', 1, 'local', '', '', 0, '', '', '', NULL, '', '');

-- Risk Categories
INSERT INTO risk_categories (id, name, description, color, created_at, updated_at) VALUES
(1, 'Cybersecurity', 'Information security and cyber threats', '#dc3545', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(2, 'Operational', 'Business operations and processes', '#fd7e14', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(3, 'Financial', 'Financial and market risks', '#ffc107', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(4, 'Regulatory', 'Compliance and regulatory risks', '#198754', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(5, 'Strategic', 'Strategic and reputational risks', '#6f42c1', '2025-09-16 10:00:00', '2025-09-16 10:00:00');

-- Risks
INSERT INTO risks (id, risk_id, title, description, category_id, organization_id, owner_id, status, risk_type, probability, impact, risk_score, ai_risk_score, root_cause, potential_impact, existing_controls, treatment_strategy, mitigation_plan, target_probability, target_impact, target_risk_score, identified_date, last_reviewed, next_review_date, escalated_at, resolved_at, created_by, created_at, updated_at, category, subcategory, source_type, auto_generated_data, approval_required, approved_by, approved_at, approval_notes, confidence_score, source_system, auto_generated_reason) VALUES
(1, 'RSK-001', 'Cloud Infrastructure Data Breach', 'Risk of unauthorized access to customer data stored in cloud infrastructure due to misconfigured security groups', 1, 1, 2, 'active', 'cybersecurity', 4, 5, 20, 18.5, 'Insufficient cloud security configuration', 'Customer data exposure, regulatory fines, reputational damage', 'Basic access controls, monitoring', 'Mitigate', 'Implement zero-trust architecture, enhance monitoring, regular security audits', 2, 3, 6, '2025-09-10', '2025-09-15', '2025-12-15', NULL, NULL, 2, '2025-09-16 10:00:00', '2025-09-16 10:00:00', 'cybersecurity', 'data protection', 'manual', NULL, 0, NULL, NULL, NULL, 0.95, NULL, NULL),
(2, 'RSK-002', 'Supply Chain Compromise', 'Risk of malicious code injection through third-party dependencies and suppliers', 1, 1, 4, 'active', 'cybersecurity', 3, 4, 12, 11.2, 'Insufficient vendor security assessment', 'System compromise, data theft, service disruption', 'Vendor assessments, code scanning', 'Mitigate', 'Implement supply chain security program, enhance vendor due diligence', 2, 2, 4, '2025-09-12', '2025-09-15', '2025-12-12', NULL, NULL, 2, '2025-09-16 10:00:00', '2025-09-16 10:00:00', 'cybersecurity', 'supply chain', 'manual', NULL, 0, NULL, NULL, NULL, 0.88, NULL, NULL),
(3, 'RSK-003', 'Insider Threat', 'Risk of malicious or accidental data exposure by privileged users', 1, 1, 2, 'monitoring', 'cybersecurity', 2, 4, 8, 7.5, 'Insufficient privilege management and monitoring', 'Data theft, system sabotage, compliance violations', 'User access reviews, basic logging', 'Ongoing', 'Implement privileged access management, enhance user behavior analytics', 1, 2, 2, '2025-09-08', '2025-09-14', '2025-12-08', NULL, NULL, 2, '2025-09-16 10:00:00', '2025-09-16 10:00:00', 'cybersecurity', 'insider threat', 'manual', NULL, 0, NULL, NULL, NULL, 0.82, NULL, NULL),
(4, 'RSK-004', 'Regulatory Compliance Gap', 'Risk of non-compliance with GDPR, SOC2, and other regulatory frameworks', 4, 1, 3, 'escalated', 'regulatory', 3, 4, 12, NULL, 'Insufficient compliance monitoring and controls', 'Regulatory fines, audit findings, business restrictions', 'Annual compliance reviews', 'Mitigate', 'Implement continuous compliance monitoring, enhance control testing', 2, 2, 4, '2025-09-05', '2025-09-10', '2025-11-30', '2025-09-15 10:00:00', NULL, 3, '2025-09-16 10:00:00', '2025-09-16 10:00:00', 'regulatory', 'compliance', 'manual', NULL, 0, NULL, NULL, NULL, 0.90, NULL, NULL),
(5, 'RSK-005', 'API Security Vulnerability', 'Risk of API abuse and unauthorized access to sensitive endpoints', 1, 1, 4, 'active', 'cybersecurity', 3, 3, 9, 8.7, 'Insufficient API security controls', 'Data exposure, service disruption, unauthorized access', 'Basic authentication, rate limiting', 'Mitigate', 'Implement API security gateway, enhance authentication', 2, 2, 4, '2025-09-14', '2025-09-16', '2025-12-14', NULL, NULL, 4, '2025-09-16 10:00:00', '2025-09-16 10:00:00', 'cybersecurity', 'api security', 'automated', '{"detection_method": "security_scan", "confidence": 0.87}', 0, NULL, NULL, NULL, 0.87, 'Security Scanner', 'API security assessment detected vulnerable endpoints');

-- Assets (Enhanced)
INSERT INTO assets_enhanced (id, asset_id, name, description, category, type, owner_id, organization_id, confidentiality, integrity, availability, business_impact, status, location, vendor, version, last_updated, cost, lifecycle_stage, compliance_requirements, security_controls, dependencies, risk_score, criticality_score, data_classification, network_zone, backup_frequency, recovery_time_objective, recovery_point_objective) VALUES
(1, 'AST-001', 'Customer Database', 'Primary database storing customer information and risk data', 'Infrastructure', 'Database', 2, 1, 5, 5, 5, 'Critical', 'active', 'AWS RDS us-east-1', 'PostgreSQL', '15.2', '2025-09-16 08:00:00', 50000, 'Production', 'SOC2, GDPR', 'Encryption, Access Controls, Monitoring', 'Web Application, Backup System', 95, 98, 'Confidential', 'DMZ', 'Daily', 4, 1),
(2, 'AST-002', 'Web Application', 'Customer-facing risk management portal', 'Application', 'Web App', 4, 1, 4, 4, 4, 'Critical', 'active', 'Cloudflare Pages', 'ARIA5 Platform', '5.2.0', '2025-09-15 16:30:00', 25000, 'Production', 'SOC2', 'WAF, Authentication, HTTPS', 'Customer Database, API Gateway', 88, 92, 'Internal', 'Public', 'Daily', 2, 0.5),
(3, 'AST-003', 'AI Risk Engine', 'Machine learning service for automated risk assessment', 'Application', 'API Service', 2, 1, 5, 4, 4, 'Critical', 'active', 'AWS ECS us-west-2', 'Custom ML Platform', '2.1.5', '2025-09-16 10:15:00', 75000, 'Production', 'SOC2', 'API Security, Encryption, Monitoring', 'Customer Database, External APIs', 92, 95, 'Confidential', 'Private', 'Hourly', 1, 0.25),
(4, 'AST-004', 'Identity Provider', 'Single sign-on and identity management system', 'Security', 'Identity System', 3, 1, 5, 5, 5, 'Critical', 'active', 'Okta Cloud', 'Okta Enterprise', '2024.08.2', '2025-09-14 12:00:00', 30000, 'Production', 'SOC2, ISO27001', 'MFA, SAML, OAuth', 'All Applications', 98, 99, 'Confidential', 'DMZ', 'Real-time', 0.5, 0),
(5, 'AST-005', 'Monitoring Platform', 'Security and performance monitoring system', 'Security', 'SIEM', 4, 1, 3, 4, 4, 'High', 'active', 'Datadog Cloud', 'Datadog Enterprise', '7.48.0', '2025-09-15 14:20:00', 40000, 'Production', 'SOC2', 'Log Encryption, Access Controls', 'All Systems', 75, 85, 'Internal', 'Management', 'Continuous', 6, 2);

-- Compliance Frameworks
INSERT INTO compliance_frameworks (id, name, version, description, authority, scope, status, implementation_date, next_review, created_at, updated_at) VALUES
(1, 'SOC 2 Type II', '2017', 'Service Organization Control 2 for security, availability, and confidentiality', 'AICPA', 'Security controls and data protection', 'active', '2025-06-01', '2025-12-01', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(2, 'GDPR', '2018', 'General Data Protection Regulation for EU data privacy', 'European Commission', 'Personal data processing', 'active', '2025-05-01', '2025-11-01', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(3, 'ISO 27001', '2022', 'Information Security Management System standard', 'ISO/IEC', 'Information security management', 'planned', '2026-03-01', '2026-09-01', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(4, 'NIST CSF', 'v2.0', 'National Institute of Standards cybersecurity framework', 'NIST', 'Cybersecurity risk management', 'active', '2025-07-01', '2025-12-15', '2025-09-16 10:00:00', '2025-09-16 10:00:00');

-- Framework Controls  
INSERT INTO framework_controls (id, framework_id, control_id, title, description, category, implementation_status, owner_id, due_date, evidence_required, testing_frequency, last_tested, created_at, updated_at) VALUES
(1, 1, 'CC6.1', 'Multi-Factor Authentication', 'Implement MFA for all administrative and user access', 'Access Control', 'implemented', 2, '2025-06-01', 'MFA configuration, access logs', 'quarterly', '2025-09-01', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(2, 1, 'CC6.2', 'Privileged Access Management', 'Control and monitor privileged user access', 'Access Control', 'implemented', 2, '2025-07-01', 'PAM system logs, access reviews', 'monthly', '2025-09-15', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(3, 1, 'CC7.1', 'System Monitoring', 'Continuous monitoring of system security and performance', 'Monitoring', 'implemented', 4, '2025-08-01', 'Monitoring dashboards, alert logs', 'continuous', '2025-09-16', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(4, 2, 'Art 25', 'Data Protection by Design', 'Implement privacy by design principles', 'Privacy', 'partial', 3, '2025-11-01', 'Privacy impact assessments, technical documentation', 'semi-annual', '2025-08-01', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(5, 2, 'Art 32', 'Security of Processing', 'Ensure appropriate security measures for data processing', 'Data Security', 'implemented', 2, '2025-10-01', 'Security controls documentation, encryption evidence', 'quarterly', '2025-09-10', '2025-09-16 10:00:00', '2025-09-16 10:00:00');

-- Threat Feeds
INSERT INTO threat_feeds (feed_id, name, type, url, api_key, format, description, active, sync_interval, confidence_threshold, auto_sync, validate_indicators, last_sync, last_error, ioc_count, created_at, updated_at) VALUES
(1, 'ARIA52 Internal Feed', 'custom', 'https://api.aria52.com/threats', 'internal-feed-key', 'json', 'Internal threat intelligence and indicators', 1, 24, 75, 1, 1, '2025-09-16 06:00:00', NULL, 156, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(2, 'Commercial TI Feed', 'stix', 'https://feeds.threatintel.com/v1/indicators', 'commercial-api-key', 'stix', 'Commercial threat intelligence feed', 1, 12, 80, 1, 1, '2025-09-16 08:00:00', NULL, 2847, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(3, 'Open Source Intel', 'misp', 'https://misppriv.circl.lu/events/csv/download', NULL, 'csv', 'MISP open source threat intelligence', 1, 48, 70, 1, 1, '2025-09-15 20:00:00', NULL, 1203, '2025-09-16 10:00:00', '2025-09-16 10:00:00');

-- IOCs (Indicators of Compromise)
INSERT INTO iocs (id, indicator_type, indicator_value, threat_type, severity, confidence, source, description, first_seen, last_seen, status, tags, created_at, updated_at) VALUES
(1, 'domain', 'malicious-aria52.com', 'Phishing', 'high', 95, 'Internal Security Team', 'Typosquatting domain targeting ARIA52 users', '2025-09-15 14:30:00', '2025-09-16 09:20:00', 'active', 'phishing,typosquatting,credential-theft', '2025-09-15 14:35:00', '2025-09-16 09:25:00'),
(2, 'ip', '185.220.102.55', 'Malware C2', 'critical', 92, 'Commercial TI Feed', 'Command and control server for banking malware', '2025-09-14 11:15:00', '2025-09-16 08:45:00', 'active', 'malware,c2,banking-trojan', '2025-09-14 11:20:00', '2025-09-16 08:50:00'),
(3, 'hash', 'a1b2c3d4e5f6789012345678901234567890abcdef', 'Ransomware', 'critical', 88, 'VirusTotal', 'Ransomware variant targeting cloud infrastructure', '2025-09-13 08:40:00', '2025-09-15 12:30:00', 'active', 'ransomware,cloud-targeting', '2025-09-13 08:45:00', '2025-09-15 12:35:00'),
(4, 'email', 'security-update@aria52-alerts.net', 'Phishing', 'medium', 82, 'Email Security Gateway', 'Spoofed security alert emails', '2025-09-12 13:25:00', '2025-09-16 07:10:00', 'monitoring', 'phishing,email-spoofing', '2025-09-12 13:30:00', '2025-09-16 07:15:00'),
(5, 'url', 'https://aria52-security-update.net/download', 'Malware', 'high', 90, 'Web Security Scanner', 'Malicious software download site', '2025-09-11 16:20:00', '2025-09-14 11:40:00', 'blocked', 'malware-distribution,fake-updates', '2025-09-11 16:25:00', '2025-09-14 11:45:00');

-- System Configuration
INSERT INTO system_configuration (key, value, description, created_at, updated_at) VALUES
('rag_enabled', 'true', 'Enable RAG functionality for AI assistant', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
('ai_confidence_threshold', '0.85', 'Minimum confidence for AI risk assessments', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
('threat_retention_days', '90', 'Days to retain threat intelligence data', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
('compliance_notification_days', '30', 'Days before compliance review for notifications', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
('risk_review_frequency', '90', 'Default risk review frequency in days', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
('dashboard_refresh_interval', '300', 'Dashboard auto-refresh interval in seconds', '2025-09-16 10:00:00', '2025-09-16 10:00:00');

-- AI Configurations
INSERT INTO ai_configurations (id, name, model_type, endpoint_url, api_key, max_tokens, temperature, enabled, description, created_at, updated_at) VALUES
(1, 'Risk Assessment AI', 'gpt-4', 'https://api.openai.com/v1/chat/completions', 'sk-placeholder-key', 2048, 0.3, 1, 'AI model for automated risk assessment and scoring', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(2, 'Threat Intelligence AI', 'claude-3', 'https://api.anthropic.com/v1/messages', 'sk-ant-placeholder', 1024, 0.2, 1, 'AI model for threat intelligence analysis', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(3, 'Compliance Assistant', 'gpt-3.5-turbo', 'https://api.openai.com/v1/chat/completions', 'sk-placeholder-key-2', 1024, 0.4, 1, 'AI assistant for compliance guidance', '2025-09-16 10:00:00', '2025-09-16 10:00:00');

-- Services
INSERT INTO services (id, name, description, category, owner_id, organization_id, confidentiality, integrity, availability, business_impact, status, dependencies, sla_target, recovery_time, recovery_point, created_at, updated_at) VALUES
(1, 'Customer Portal', 'Main customer-facing risk management application', 'Customer-Facing', 2, 1, 4, 4, 5, 'Critical', 'active', 'Customer Database, Identity Provider', '99.9%', 2, 0.5, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(2, 'Risk Assessment API', 'RESTful API for risk assessment and management', 'Core Business', 4, 1, 5, 4, 4, 'Critical', 'active', 'AI Risk Engine, Customer Database', '99.95%', 1, 0.25, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(3, 'Threat Intelligence Service', 'Automated threat intelligence collection and analysis', 'Security', 4, 1, 4, 4, 4, 'High', 'active', 'Threat Feeds, Monitoring Platform', '99.5%', 4, 1, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(4, 'Compliance Dashboard', 'Compliance monitoring and reporting interface', 'Compliance', 3, 1, 4, 5, 3, 'High', 'active', 'Customer Database, Framework Controls', '99.0%', 6, 2, '2025-09-16 10:00:00', '2025-09-16 10:00:00');

-- Audit Logs
INSERT INTO audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, status, created_at) VALUES
(1, 2, 'CREATE', 'risk', 1, '{"title": "Cloud Infrastructure Data Breach", "category": "cybersecurity"}', '192.168.1.100', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'success', '2025-09-16 09:35:00'),
(2, 3, 'UPDATE', 'compliance_framework', 4, '{"status": "active", "next_review": "2025-12-15"}', '10.0.1.50', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'success', '2025-09-16 10:25:00'),
(3, 4, 'VIEW', 'threat_intelligence', 1, '{"indicator": "malicious-aria52.com", "threat_type": "phishing"}', '172.16.0.25', 'Mozilla/5.0 (X11; Linux x86_64)', 'success', '2025-09-16 11:40:00'),
(4, 1, 'DELETE', 'user_session', 12345, '{"reason": "security_cleanup", "session_age": "7_days"}', '192.168.1.10', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'success', '2025-09-16 12:15:00'),
(5, 2, 'CREATE', 'asset', 5, '{"name": "Monitoring Platform", "category": "Security", "criticality": "High"}', '10.0.2.75', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'success', '2025-09-16 13:25:00');

-- Update database statistics
ANALYZE;