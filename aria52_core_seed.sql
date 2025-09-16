-- ARIA52 Core Seed Data - Matching Exact Database Schema
-- Essential data for functional dashboards and authentication

-- Organizations
INSERT INTO organizations (id, name, description, type, industry, size, country, is_active, created_at, updated_at) VALUES
(1, 'ARIA52 Corporation', 'Primary demonstration organization', 'Enterprise', 'Technology', 'Medium', 'United States', 1, '2025-09-16 10:00:00', '2025-09-16 10:00:00');

-- Users (Working demo accounts)
INSERT INTO users (id, username, email, password_hash, first_name, last_name, role, organization_id, is_active, last_login, created_at, updated_at) VALUES
(1, 'admin', 'admin@aria52.com', 'demo123', 'Admin', 'User', 'admin', 1, 1, '2025-09-16 12:05:35', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(2, 'avi_security', 'avi@aria52.com', 'demo123', 'Avi', 'Adiyala', 'risk_manager', 1, 1, '2025-09-16 11:04:17', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(3, 'sarah_compliance', 'sarah@aria52.com', 'demo123', 'Sarah', 'Johnson', 'compliance_officer', 1, 1, NULL, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(4, 'mike_analyst', 'mike@aria52.com', 'demo123', 'Michael', 'Torres', 'analyst', 1, 1, NULL, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(5, 'demo_user', 'demo@aria52.com', 'demo123', 'Demo', 'User', 'user', 1, 1, NULL, '2025-09-16 10:00:00', '2025-09-16 10:00:00');

-- Risks (Core security risks for dashboards)
INSERT INTO risks (id, title, description, category, subcategory, owner_id, organization_id, probability, impact, inherent_risk, residual_risk, status, review_date, due_date, source, affected_assets, created_by, created_at, updated_at) VALUES
(1, 'Cloud Infrastructure Data Breach', 'Risk of unauthorized access to customer data in cloud infrastructure', 'Cybersecurity', 'Data Protection', 2, 1, 4, 5, 20, 12, 'active', '2025-12-15', '2025-11-30', 'Security Assessment', 'Database, Web Application', 2, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(2, 'Supply Chain Compromise', 'Risk of malicious code injection through third-party dependencies', 'Cybersecurity', 'Supply Chain', 4, 1, 3, 4, 12, 8, 'active', '2025-12-12', '2025-11-15', 'Code Analysis', 'Web Application, API', 2, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(3, 'Insider Threat', 'Risk of malicious or accidental data exposure by privileged users', 'Operational', 'Human Factor', 2, 1, 2, 4, 8, 6, 'monitoring', '2025-12-08', '2025-10-30', 'Security Review', 'All Systems', 2, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(4, 'API Security Vulnerability', 'Risk of API abuse and unauthorized access to endpoints', 'Cybersecurity', 'Application Security', 4, 1, 3, 3, 9, 6, 'active', '2025-12-14', '2025-11-20', 'Penetration Test', 'API Gateway, Services', 4, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(5, 'GDPR Compliance Gap', 'Insufficient data retention policies for EU customer data', 'Compliance', 'Data Privacy', 3, 1, 3, 3, 9, 6, 'escalated', '2025-11-30', '2025-10-15', 'Compliance Audit', 'Database, Web Portal', 3, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(6, 'Phishing Campaign Targeting', 'Sophisticated phishing attempts targeting employee credentials', 'Cybersecurity', 'Social Engineering', 2, 1, 4, 3, 12, 8, 'active', '2025-12-30', '2025-11-10', 'Threat Intelligence', 'Identity Systems', 2, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(7, 'Container Security Issues', 'Pod security policies may allow lateral movement', 'Cybersecurity', 'Container Security', 4, 1, 2, 4, 8, 4, 'mitigated', '2025-12-05', NULL, 'Security Scan', 'Container Platform', 4, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(8, 'SSO Integration Risk', 'Authentication vulnerabilities in SSO implementation', 'Cybersecurity', 'Identity Management', 3, 1, 2, 4, 8, 6, 'active', '2025-12-01', '2025-11-25', 'Security Review', 'Identity Provider', 3, '2025-09-16 10:00:00', '2025-09-16 10:00:00');

-- Assets (Core system assets)
INSERT INTO assets (id, name, type, category, owner_id, organization_id, location, criticality, value, status, created_at, updated_at) VALUES
(1, 'Customer Database', 'Database', 'Infrastructure', 2, 1, 'AWS RDS us-east-1', 'Critical', 500000, 'active', '2025-09-16 08:00:00', '2025-09-16 08:00:00'),
(2, 'Web Portal', 'Web Application', 'Application', 4, 1, 'Cloudflare Pages', 'Critical', 250000, 'active', '2025-09-16 09:15:00', '2025-09-16 09:15:00'),
(3, 'AI Risk Engine', 'API Service', 'Application', 2, 1, 'AWS ECS us-west-2', 'Critical', 750000, 'active', '2025-09-16 09:30:00', '2025-09-16 09:30:00'),
(4, 'Identity Provider', 'Identity System', 'Security', 3, 1, 'Okta Cloud', 'Critical', 300000, 'active', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(5, 'Monitoring Platform', 'SIEM', 'Security', 4, 1, 'Datadog Cloud', 'High', 400000, 'active', '2025-09-16 10:15:00', '2025-09-16 10:15:00');

-- Threat Feeds (Essential for threat intelligence)
INSERT OR IGNORE INTO threat_feeds (feed_id, name, type, url, api_key, format, description, active, sync_interval, confidence_threshold, auto_sync, validate_indicators, last_sync, last_error, ioc_count, created_at, updated_at) VALUES
(1, 'Internal TI Feed', 'custom', 'https://api.aria52.com/threats', 'internal-key', 'json', 'Internal threat intelligence', 1, 24, 75, 1, 1, '2025-09-16 06:00:00', NULL, 156, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(2, 'Commercial Feed', 'stix', 'https://feeds.threatintel.com/v1/indicators', 'commercial-key', 'stix', 'Commercial threat feed', 1, 12, 80, 1, 1, '2025-09-16 08:00:00', NULL, 2847, '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(3, 'Open Source Feed', 'misp', 'https://misppriv.circl.lu/events/csv/download', NULL, 'csv', 'MISP community feed', 1, 48, 70, 1, 1, '2025-09-15 20:00:00', NULL, 1203, '2025-09-16 10:00:00', '2025-09-16 10:00:00');

-- IOCs (Threat Intelligence Indicators)
INSERT OR IGNORE INTO iocs (id, indicator_type, indicator_value, threat_type, severity, confidence, source, description, first_seen, last_seen, status, tags, created_at, updated_at) VALUES
(1, 'domain', 'malicious-aria52.com', 'Phishing', 'high', 95, 'Internal Team', 'Typosquatting domain targeting users', '2025-09-15 14:30:00', '2025-09-16 09:20:00', 'active', 'phishing,typosquatting', '2025-09-15 14:35:00', '2025-09-16 09:25:00'),
(2, 'ip', '185.220.102.55', 'Malware C2', 'critical', 92, 'Commercial Feed', 'Command and control server', '2025-09-14 11:15:00', '2025-09-16 08:45:00', 'active', 'malware,c2', '2025-09-14 11:20:00', '2025-09-16 08:50:00'),
(3, 'hash', 'a1b2c3d4e5f6789012345678901234567890abcdef', 'Ransomware', 'critical', 88, 'VirusTotal', 'Ransomware targeting cloud infrastructure', '2025-09-13 08:40:00', '2025-09-15 12:30:00', 'active', 'ransomware,cloud', '2025-09-13 08:45:00', '2025-09-15 12:35:00'),
(4, 'email', 'security-update@aria52-alerts.net', 'Phishing', 'medium', 82, 'Email Gateway', 'Spoofed security alerts', '2025-09-12 13:25:00', '2025-09-16 07:10:00', 'monitoring', 'phishing,spoofing', '2025-09-12 13:30:00', '2025-09-16 07:15:00'),
(5, 'url', 'https://aria52-security-update.net/download', 'Malware', 'high', 90, 'Web Scanner', 'Malicious download site', '2025-09-11 16:20:00', '2025-09-14 11:40:00', 'blocked', 'malware,fake-updates', '2025-09-11 16:25:00', '2025-09-14 11:45:00');

-- System Configuration (Essential settings)
INSERT OR IGNORE INTO system_configuration (key, value, description, created_at, updated_at) VALUES
('rag_enabled', 'true', 'Enable RAG for AI assistant', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
('ai_confidence_threshold', '0.85', 'AI confidence threshold', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
('threat_retention_days', '90', 'Threat data retention period', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
('dashboard_refresh_interval', '300', 'Dashboard refresh interval', '2025-09-16 10:00:00', '2025-09-16 10:00:00');

-- AI Configurations (For AI assistant functionality)
INSERT OR IGNORE INTO ai_configurations (id, name, model_type, endpoint_url, api_key, max_tokens, temperature, enabled, description, created_at, updated_at) VALUES
(1, 'Risk Assessment AI', 'gpt-4', 'https://api.openai.com/v1/chat/completions', 'sk-placeholder', 2048, 0.3, 1, 'Risk assessment AI model', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(2, 'Threat Intelligence AI', 'claude-3', 'https://api.anthropic.com/v1/messages', 'sk-ant-placeholder', 1024, 0.2, 1, 'Threat intelligence AI', '2025-09-16 10:00:00', '2025-09-16 10:00:00'),
(3, 'Compliance Assistant', 'gpt-3.5-turbo', 'https://api.openai.com/v1/chat/completions', 'sk-placeholder-2', 1024, 0.4, 1, 'Compliance AI assistant', '2025-09-16 10:00:00', '2025-09-16 10:00:00');

-- Audit Logs (Recent activity for dashboard)
INSERT OR IGNORE INTO audit_logs (id, user_id, action, resource_type, resource_id, details, ip_address, user_agent, status, created_at) VALUES
(1, 2, 'CREATE', 'risk', 1, '{"title": "Cloud Infrastructure Data Breach", "risk_score": 20}', '192.168.1.100', 'Mozilla/5.0', 'success', '2025-09-16 09:35:00'),
(2, 3, 'UPDATE', 'compliance', 2, '{"framework": "GDPR", "status": "active"}', '10.0.1.50', 'Mozilla/5.0', 'success', '2025-09-16 10:25:00'),
(3, 4, 'VIEW', 'threat_intelligence', 1, '{"indicator": "malicious-aria52.com"}', '172.16.0.25', 'Mozilla/5.0', 'success', '2025-09-16 11:40:00'),
(4, 1, 'DELETE', 'session', 12345, '{"reason": "security_cleanup"}', '192.168.1.10', 'Mozilla/5.0', 'success', '2025-09-16 12:15:00'),
(5, 2, 'CREATE', 'asset', 5, '{"name": "Monitoring Platform", "criticality": "High"}', '10.0.2.75', 'Mozilla/5.0', 'success', '2025-09-16 13:25:00');

-- Update statistics
ANALYZE;