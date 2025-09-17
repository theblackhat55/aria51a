-- ARIA52 Complete Seed Data for Existing Schema
-- Tables: risks, assets_enhanced + create missing essential tables for dashboards

-- Create missing essential tables for dashboard functionality
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT DEFAULT 'user',
  department TEXT,
  job_title TEXT,
  phone TEXT,
  is_active BOOLEAN DEFAULT 1,
  mfa_enabled BOOLEAN DEFAULT 0,
  mfa_secret TEXT,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS threat_intelligence (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  threat_type TEXT,
  severity TEXT DEFAULT 'medium',
  confidence DECIMAL(3,2) DEFAULT 0.5,
  confidence_score INTEGER DEFAULT 50,
  status TEXT DEFAULT 'active',
  source TEXT,
  ioc_value TEXT,
  ioc_type TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS compliance_controls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  control_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  framework TEXT NOT NULL,
  category TEXT,
  status TEXT DEFAULT 'not_implemented',
  compliance_score INTEGER DEFAULT 0,
  evidence_required BOOLEAN DEFAULT 0,
  owner TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_configurations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  provider TEXT NOT NULL,
  model_name TEXT,
  api_endpoint TEXT,
  is_active BOOLEAN DEFAULT 1,
  config_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rag_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  document_type TEXT,
  status TEXT DEFAULT 'pending',
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS service_catalog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  owner TEXT,
  status TEXT DEFAULT 'active',
  criticality TEXT DEFAULT 'medium',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  resource TEXT,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'success',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Clear existing data
DELETE FROM audit_logs;
DELETE FROM service_catalog;
DELETE FROM rag_documents;
DELETE FROM ai_configurations;
DELETE FROM compliance_controls;
DELETE FROM threat_intelligence;
DELETE FROM users;
DELETE FROM assets_enhanced;
DELETE FROM risks;

-- Insert Users (with SHA-256 hash for 'password123')
INSERT INTO users (id, email, password_hash, first_name, last_name, role, department, job_title, is_active, mfa_enabled) VALUES 
(1, 'admin@aria5.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'System', 'Administrator', 'admin', 'IT Security', 'Security Administrator', 1, 0),
(2, 'avi@aria5.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Avi', 'Adiyala', 'risk_manager', 'IT Security', 'Risk Manager', 1, 0),
(3, 'sarah@aria5.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Sarah', 'Johnson', 'compliance_officer', 'Compliance', 'Compliance Officer', 1, 0),
(4, 'mike@aria5.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Michael', 'Torres', 'analyst', 'IT Security', 'Security Analyst', 1, 0),
(5, 'demo@demo.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Demo', 'User', 'user', 'IT', 'System User', 1, 0);

-- Insert Risks (with risk_score calculated field - missing from schema but needed)
INSERT INTO risks (id, title, description, category, probability, impact, status, severity, organization_id, created_by) VALUES 
(1, 'Unpatched Critical Vulnerabilities', 'Multiple critical security patches pending on production servers creating potential attack vectors', 'Technical', 4, 5, 'active', 'Critical', 1, 1),
(2, 'Weak Multi-Factor Authentication', 'Current MFA implementation allows bypass through backup codes creating authentication weakness', 'Security', 3, 4, 'active', 'High', 1, 2),
(3, 'Data Backup Inconsistencies', 'Automated backup system experiencing intermittent failures affecting data recovery capabilities', 'Operational', 2, 5, 'mitigating', 'High', 1, 1),
(4, 'Advanced Persistent Threat Indicators', 'Intelligence indicates targeting by APT-28 group with specific interest in financial sector clients', 'External', 4, 4, 'active', 'Critical', 1, 4),
(5, 'Insider Threat Vulnerability', 'Privileged user access lacks sufficient monitoring and behavioral analytics', 'Human', 2, 4, 'active', 'Medium', 1, 3),
(6, 'Supply Chain Security Gap', 'Third-party vendor security assessments not conducted within required timeframe', 'Vendor', 3, 3, 'active', 'Medium', 1, 3),
(7, 'Cloud Configuration Drift', 'Infrastructure as Code not consistently applied leading to security misconfigurations', 'Technical', 3, 4, 'mitigating', 'High', 1, 4),
(8, 'Encryption Key Management', 'Current key rotation policies do not meet industry best practices for financial data', 'Compliance', 2, 5, 'active', 'High', 1, 2),
(9, 'Social Engineering Susceptibility', 'Recent phishing simulation showed 23% click rate indicating training effectiveness gaps', 'Human', 4, 3, 'active', 'Medium', 1, 3),
(10, 'Network Segmentation Weakness', 'Insufficient micro-segmentation between critical and non-critical systems', 'Technical', 3, 4, 'active', 'High', 1, 1),
(11, 'API Security Vulnerabilities', 'REST APIs lack proper rate limiting and authentication controls', 'Technical', 3, 4, 'active', 'High', 1, 4),
(12, 'Data Loss Prevention Gaps', 'Sensitive data can be exfiltrated through unauthorized channels', 'Data', 2, 5, 'active', 'High', 1, 2);

-- Insert Assets Enhanced (matching the existing schema)
INSERT INTO assets_enhanced (asset_id, name, asset_type, category, subcategory, location, criticality, confidentiality_numeric, integrity_numeric, availability_numeric, risk_score, operating_system, custodian_id, network_zone, compliance_requirements, patch_management, backup_status, monitoring_level, description, business_function, data_classification, active_status) VALUES
('ASSET-001', 'ARIA Platform Database', 'Primary', 'Infrastructure', 'Database', 'AWS us-east-1', 'Critical', 5, 5, 4, 4.2, 'PostgreSQL 15.2', 'admin@aria5.com', 'DMZ', 'SOC2, PCI-DSS', 'Automated', 'Active', 'High', 'Primary PostgreSQL database storing customer risk data and analytics', 'Core Platform', 'Confidential', 1),
('ASSET-002', 'Customer Web Portal', 'Primary', 'Application', 'Web Application', 'Cloudflare Edge', 'High', 4, 4, 4, 3.8, 'Node.js 18.x', 'avi@aria5.com', 'Public', 'SOC2', 'Automated', 'Active', 'High', 'React-based web application for customer access to dashboards', 'Customer Interface', 'Internal', 1),
('ASSET-003', 'AI Risk Engine API', 'Primary', 'Application', 'API Service', 'AWS us-west-2', 'Critical', 5, 4, 4, 4.1, 'Python 3.11', 'mike@aria5.com', 'Internal', 'SOC2, ISO27001', 'Automated', 'Active', 'High', 'Machine learning microservice for automated risk scoring', 'AI Analytics', 'Confidential', 1),
('ASSET-004', 'Employee Workstations', 'Primary', 'Endpoint', 'Laptop', 'Remote/Office', 'Medium', 3, 3, 3, 2.5, 'macOS 14.0', 'admin@aria5.com', 'Corporate', 'Basic', 'Manual', 'Active', 'Medium', 'MacBook Pro laptops used by development teams', 'Productivity', 'Internal', 1),
('ASSET-005', 'Production Firewall', 'Primary', 'Network', 'Security Device', 'Data Center A', 'Critical', 4, 5, 5, 4.5, 'FortiOS 7.2', 'admin@aria5.com', 'Perimeter', 'SOC2, PCI-DSS', 'Automated', 'Active', 'Critical', 'Next-generation firewall protecting production environment', 'Security', 'Restricted', 1),
('ASSET-006', 'Backup Storage System', 'Primary', 'Infrastructure', 'Storage', 'AWS S3', 'High', 4, 5, 3, 3.7, 'AWS S3 Service', 'admin@aria5.com', 'Cloud', 'SOC2', 'Automated', 'Active', 'High', 'Automated backup system for critical data retention', 'Data Protection', 'Confidential', 1),
('ASSET-007', 'Load Balancer', 'Primary', 'Network', 'Load Balancer', 'AWS ELB', 'High', 3, 4, 5, 3.9, 'AWS ALB Service', 'mike@aria5.com', 'Public', 'SOC2', 'Automated', 'Active', 'High', 'Application load balancer distributing traffic', 'Infrastructure', 'Internal', 1),
('ASSET-008', 'Monitoring Infrastructure', 'Primary', 'Infrastructure', 'Monitoring', 'AWS CloudWatch', 'Medium', 3, 3, 4, 2.8, 'AWS CloudWatch', 'sarah@aria5.com', 'Internal', 'Basic', 'Automated', 'Active', 'Medium', 'Comprehensive monitoring and alerting system', 'Operations', 'Internal', 1);

-- Insert Threat Intelligence
INSERT INTO threat_intelligence (id, title, description, threat_type, severity, confidence, confidence_score, status, source, ioc_value, ioc_type) VALUES
(1, 'APT-28 Campaign Targeting Financial Sector', 'Sophisticated spear-phishing campaign using legitimate-looking financial documents', 'APT', 'critical', 0.94, 94, 'active', 'Threat Feed Alpha', '192.168.100.45', 'ip'),
(2, 'Ransomware IOC: Conti Variant Detection', 'New Conti ransomware variant with updated encryption algorithms', 'Malware', 'high', 0.91, 91, 'active', 'Internal Honeypot', 'malware-sample-2024-001.exe', 'hash'),
(3, 'Phishing Infrastructure: Fake Banking Domains', 'Typosquatting domains mimicking major financial institutions', 'Phishing', 'medium', 0.87, 87, 'active', 'External Intel', 'secur3-bank-l0gin.com', 'domain'),
(4, 'C2 Infrastructure: Cobalt Strike Servers', 'Command and control servers associated with Cobalt Strike beacons', 'Infrastructure', 'high', 0.92, 92, 'active', 'Threat Feed Beta', '45.123.67.89', 'ip'),
(5, 'Zero-Day Exploitation: CVE-2024-1234', 'Active exploitation of unpatched vulnerability in web frameworks', 'Exploit', 'critical', 0.96, 96, 'active', 'Security Research', '/api/v1/admin/bypass', 'url'),
(6, 'Credential Stuffing Campaign', 'Large-scale automated login attempts using breached credentials', 'Attack', 'medium', 0.83, 83, 'active', 'Internal Analysis', 'credential-stuffing-botnet-2024', 'campaign'),
(7, 'Suspected Nation-State Activity', 'Network reconnaissance patterns consistent with nation-state TTPs', 'APT', 'high', 0.88, 88, 'active', 'Threat Feed Gamma', 'nation-state-recon-pattern-001', 'pattern'),
(8, 'Malicious Browser Extensions', 'Cryptocurrency wallet stealing browser extensions via fake updates', 'Malware', 'medium', 0.79, 79, 'active', 'External Intel', 'crypto-wallet-stealer-v2.3', 'hash'),
(9, 'Supply Chain Compromise Indicators', 'Potential compromise of software supply chain affecting vendors', 'Supply Chain', 'high', 0.89, 89, 'active', 'Industry Sharing', 'supply-chain-compromise-2024-q4', 'campaign'),
(10, 'AI-Generated Phishing Content', 'Sophisticated phishing using LLMs for personalized social engineering', 'Phishing', 'medium', 0.85, 85, 'active', 'Research', 'ai-generated-phishing-template-001', 'pattern');

-- Insert Compliance Controls
INSERT INTO compliance_controls (id, control_id, title, description, framework, category, status, compliance_score, evidence_required, owner) VALUES
(1, 'AC-1', 'Access Control Policy and Procedures', 'Develop, document, and disseminate access control policy', 'NIST', 'Access Control', 'implemented', 92, 1, 'admin@aria5.com'),
(2, 'AU-2', 'Auditable Events', 'Determine auditable events and coordinate audit function', 'NIST', 'Audit and Accountability', 'implemented', 88, 1, 'sarah@aria5.com'),
(3, 'CA-2', 'Security Assessments', 'Develop security assessment plan and conduct assessments', 'NIST', 'Assessment', 'in_progress', 65, 1, 'mike@aria5.com'),
(4, 'CM-2', 'Baseline Configuration', 'Develop, document, and maintain baseline configuration', 'NIST', 'Configuration Management', 'implemented', 94, 1, 'admin@aria5.com'),
(5, 'CP-1', 'Contingency Planning Policy', 'Develop contingency planning policy and procedures', 'NIST', 'Contingency Planning', 'not_implemented', 0, 1, 'avi@aria5.com'),
(6, 'IA-2', 'User Identification and Authentication', 'Uniquely identify and authenticate organizational users', 'NIST', 'Identification and Authentication', 'implemented', 96, 1, 'admin@aria5.com'),
(7, 'IR-1', 'Incident Response Policy', 'Develop incident response policy and procedures', 'NIST', 'Incident Response', 'implemented', 89, 1, 'mike@aria5.com'),
(8, 'PE-2', 'Physical Access Authorizations', 'Develop physical access authorization procedures', 'NIST', 'Physical Protection', 'in_progress', 72, 1, 'sarah@aria5.com'),
(9, 'RA-3', 'Risk Assessment', 'Conduct assessment of risk to organizational operations', 'NIST', 'Risk Assessment', 'implemented', 91, 1, 'avi@aria5.com'),
(10, 'SC-7', 'Boundary Protection', 'Monitor and control communications at external boundaries', 'NIST', 'System and Communications Protection', 'implemented', 87, 1, 'admin@aria5.com'),
(11, 'SOC2-CC6.1', 'Logical and Physical Access Controls', 'Implement logical and physical access controls', 'SOC2', 'Common Criteria', 'implemented', 93, 1, 'admin@aria5.com'),
(12, 'ISO-A.9.1.1', 'Access Control Policy', 'Establish access control policy based on requirements', 'ISO27001', 'Access Control', 'implemented', 90, 1, 'sarah@aria5.com');

-- Insert AI Configurations
INSERT INTO ai_configurations (id, name, provider, model_name, api_endpoint, is_active, config_json) VALUES
(1, 'OpenAI GPT-4 Production', 'OpenAI', 'gpt-4-turbo', 'https://api.openai.com/v1/chat/completions', 1, '{"temperature": 0.7, "max_tokens": 2048}'),
(2, 'Anthropic Claude Sonnet', 'Anthropic', 'claude-3-sonnet-20240229', 'https://api.anthropic.com/v1/messages', 1, '{"max_tokens": 4096, "temperature": 0.3}'),
(3, 'Azure OpenAI Service', 'Microsoft', 'gpt-4', 'https://aria5-ai.openai.azure.com/', 0, '{"deployment_id": "gpt-4-deployment"}'),
(4, 'Google Gemini Pro', 'Google', 'gemini-pro', 'https://generativelanguage.googleapis.com/', 1, '{"safety_settings": {}}');

-- Insert RAG Documents
INSERT INTO rag_documents (id, title, content, document_type, status, metadata) VALUES
(1, 'NIST Cybersecurity Framework Guide', 'Comprehensive guide to implementing NIST Cybersecurity Framework', 'Policy', 'processed', '{"pages": 45, "classification": "internal"}'),
(2, 'Incident Response Playbook 2024', 'Step-by-step procedures for handling security incidents', 'Procedure', 'processed', '{"version": "2024.1", "classification": "restricted"}'),
(3, 'Risk Assessment Methodology', 'Detailed methodology for conducting risk assessments', 'Methodology', 'processed', '{"author": "Risk Team", "classification": "internal"}'),
(4, 'Compliance Framework Mapping', 'Cross-reference mapping between compliance frameworks', 'Documentation', 'processed', '{"frameworks": ["NIST", "SOC2"], "classification": "internal"}'),
(5, 'Threat Intelligence Report Q4 2024', 'Quarterly threat landscape analysis', 'Report', 'pending', '{"quarter": "Q4_2024", "classification": "confidential"}'),
(6, 'AI Security Best Practices', 'Guidelines for securing AI/ML systems', 'Policy', 'processed', '{"topic": "AI_Security", "classification": "internal"}');

-- Insert Service Catalog
INSERT INTO service_catalog (id, name, description, category, owner, status, criticality) VALUES
(1, 'User Authentication Service', 'Centralized authentication using OAuth 2.0 and SAML', 'Security', 'admin@aria5.com', 'active', 'critical'),
(2, 'Risk Analytics Engine', 'Machine learning-based risk scoring service', 'Analytics', 'avi@aria5.com', 'active', 'critical'),
(3, 'Threat Intelligence Feed Processor', 'Automated ingestion of threat intelligence feeds', 'Security', 'mike@aria5.com', 'active', 'high'),
(4, 'Compliance Reporting Service', 'Automated compliance reports and evidence collection', 'Compliance', 'sarah@aria5.com', 'active', 'high'),
(5, 'Audit Log Management', 'Centralized audit log collection and analysis', 'Operations', 'admin@aria5.com', 'active', 'high');

-- Insert Audit Logs (for AI Performance Calculations)
INSERT INTO audit_logs (id, user_id, action, resource, details, ip_address, user_agent, status, created_at) VALUES
(1, 1, 'AI_QUERY', 'threat_analysis', 'Analyzed APT-28 campaign indicators', '192.168.1.100', 'ARIA5-Platform/5.1', 'success', datetime('now', '-2 hours')),
(2, 2, 'AI_CHAT', 'risk_assessment', 'Generated risk mitigation recommendations', '192.168.1.101', 'ARIA5-Platform/5.1', 'success', datetime('now', '-1 hour')),
(3, 4, 'AI_QUERY', 'compliance_check', 'Automated compliance gap analysis', '192.168.1.102', 'ARIA5-Platform/5.1', 'success', datetime('now', '-30 minutes')),
(4, 3, 'AI_CHAT', 'threat_intelligence', 'IOC correlation analysis completed', '192.168.1.103', 'ARIA5-Platform/5.1', 'success', datetime('now', '-15 minutes')),
(5, 1, 'AI_QUERY', 'behavioral_analysis', 'User behavior anomaly detection', '192.168.1.100', 'ARIA5-Platform/5.1', 'error', datetime('now', '-10 minutes')),
(6, 2, 'AI_CHAT', 'compliance_status', 'Generated compliance dashboard summary', '192.168.1.101', 'ARIA5-Platform/5.1', 'success', datetime('now', '-5 minutes')),
(7, 4, 'AI_QUERY', 'threat_correlation', 'Cross-referenced threat indicators', '192.168.1.102', 'ARIA5-Platform/5.1', 'success', datetime('now', '-3 minutes'));

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_risks_status ON risks(status);
CREATE INDEX IF NOT EXISTS idx_threats_status ON threat_intelligence(status);
CREATE INDEX IF NOT EXISTS idx_threats_confidence ON threat_intelligence(confidence_score);
CREATE INDEX IF NOT EXISTS idx_compliance_framework ON compliance_controls(framework);
CREATE INDEX IF NOT EXISTS idx_compliance_status ON compliance_controls(status);
CREATE INDEX IF NOT EXISTS idx_ai_configs_active ON ai_configurations(is_active);
CREATE INDEX IF NOT EXISTS idx_rag_docs_status ON rag_documents(status);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets_enhanced(active_status);
CREATE INDEX IF NOT EXISTS idx_services_status ON service_catalog(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);