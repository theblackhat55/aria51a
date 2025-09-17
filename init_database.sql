-- ARIA52 Database Initialization - Essential Schema and Demo Data
-- Basic schema for authentication and core functionality

-- Users table
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

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  domain TEXT,
  industry TEXT,
  size TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  criticality TEXT DEFAULT 'medium',
  owner TEXT,
  location TEXT,
  status TEXT DEFAULT 'active',
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Risks table
CREATE TABLE IF NOT EXISTS risks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  likelihood INTEGER DEFAULT 3,
  impact INTEGER DEFAULT 3,
  risk_score DECIMAL(5,2),
  status TEXT DEFAULT 'open',
  owner TEXT,
  mitigation TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Threat Intelligence table
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

-- Compliance Controls table
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

-- AI Configurations table
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

-- RAG Documents table
CREATE TABLE IF NOT EXISTS rag_documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  document_type TEXT,
  status TEXT DEFAULT 'pending',
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Service Catalog table
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

-- Insert demo organization
INSERT OR IGNORE INTO organizations (id, name, domain, industry, size) VALUES 
(1, 'Demo Organization', 'demo.com', 'Technology', 'Medium');

-- Insert demo users with SHA-256 password hash for 'password123'
INSERT OR IGNORE INTO users (email, password_hash, first_name, last_name, role, department, job_title, is_active, mfa_enabled) VALUES 
('admin@demo.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Admin', 'User', 'admin', 'IT Security', 'Security Administrator', 1, 0),
('analyst@demo.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Security', 'Analyst', 'analyst', 'IT Security', 'Security Analyst', 1, 0),
('user@demo.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Demo', 'User', 'user', 'IT', 'System Administrator', 1, 0);

-- Insert sample assets
INSERT OR IGNORE INTO assets (name, type, criticality, owner, location, status) VALUES 
('Production Database', 'Database', 'critical', 'admin@demo.com', 'Data Center A', 'active'),
('Web Application Server', 'Server', 'high', 'admin@demo.com', 'Cloud', 'active'),
('Firewall', 'Network Device', 'critical', 'analyst@demo.com', 'Perimeter', 'active'),
('Workstation-001', 'Endpoint', 'medium', 'user@demo.com', 'Office', 'active'),
('Email Server', 'Server', 'high', 'admin@demo.com', 'Data Center B', 'active');

-- Insert sample risks
INSERT OR IGNORE INTO risks (title, description, category, likelihood, impact, risk_score, status, owner) VALUES 
('Unpatched Server Vulnerabilities', 'Critical security patches missing on production servers', 'Technical', 4, 5, 85.0, 'open', 'admin@demo.com'),
('Weak Password Policy', 'Current password policy allows weak passwords', 'Policy', 3, 4, 70.0, 'open', 'analyst@demo.com'),
('Data Backup Failure', 'Automated backup system has been failing intermittently', 'Operational', 2, 5, 65.0, 'mitigating', 'admin@demo.com'),
('Phishing Attack Risk', 'Employees susceptible to phishing attacks due to lack of training', 'Human', 4, 3, 60.0, 'open', 'analyst@demo.com'),
('Network Segmentation Gap', 'Inadequate network segmentation between critical and non-critical systems', 'Technical', 3, 4, 70.0, 'open', 'admin@demo.com');

-- Insert sample threat intelligence
INSERT OR IGNORE INTO threat_intelligence (title, description, threat_type, severity, confidence, confidence_score, status, source) VALUES 
('APT-29 Campaign Activity', 'Increased activity from APT-29 group targeting healthcare organizations', 'APT', 'high', 0.85, 85, 'active', 'Threat Feed Alpha'),
('Ransomware IOC Detection', 'New ransomware variant IOCs detected in network traffic', 'Malware', 'critical', 0.92, 92, 'active', 'Internal Analysis'),
('Phishing Campaign Indicators', 'Email addresses and domains used in recent phishing campaigns', 'Phishing', 'medium', 0.75, 75, 'active', 'External Intel'),
('C2 Infrastructure Mapping', 'Command and control servers for known threat groups', 'Infrastructure', 'high', 0.88, 88, 'active', 'Threat Feed Beta'),
('Vulnerability Exploitation', 'Active exploitation of CVE-2024-1234 in the wild', 'Exploit', 'high', 0.90, 90, 'active', 'Security Research');

-- Insert sample compliance controls
INSERT OR IGNORE INTO compliance_controls (control_id, title, description, framework, category, status, compliance_score, owner) VALUES 
('AC-1', 'Access Control Policy', 'Develop and implement access control policy', 'NIST', 'Access Control', 'implemented', 85, 'admin@demo.com'),
('AU-2', 'Auditable Events', 'Determine auditable events and logging requirements', 'NIST', 'Audit and Accountability', 'implemented', 90, 'analyst@demo.com'),
('CA-2', 'Security Assessments', 'Conduct security control assessments', 'NIST', 'Assessment and Authorization', 'in_progress', 60, 'admin@demo.com'),
('CP-1', 'Contingency Planning Policy', 'Develop contingency planning procedures', 'NIST', 'Contingency Planning', 'not_implemented', 0, 'admin@demo.com'),
('IA-2', 'Identification and Authentication', 'Uniquely identify and authenticate users', 'NIST', 'Identification and Authentication', 'implemented', 95, 'analyst@demo.com');

-- Insert sample AI configurations
INSERT OR IGNORE INTO ai_configurations (name, provider, model_name, api_endpoint, is_active) VALUES 
('OpenAI GPT-4', 'OpenAI', 'gpt-4', 'https://api.openai.com/v1/chat/completions', 1),
('Anthropic Claude', 'Anthropic', 'claude-3-sonnet', 'https://api.anthropic.com/v1/messages', 1),
('Azure OpenAI', 'Microsoft', 'gpt-4-turbo', 'https://api.cognitive.microsoft.com/openai/deployments/gpt-4/chat/completions', 0);

-- Insert sample RAG documents
INSERT OR IGNORE INTO rag_documents (title, content, document_type, status) VALUES 
('Security Policy Manual', 'Comprehensive security policies and procedures...', 'Policy', 'processed'),
('Incident Response Playbook', 'Step-by-step incident response procedures...', 'Procedure', 'processed'),
('Compliance Framework Guide', 'Guidelines for maintaining regulatory compliance...', 'Documentation', 'pending'),
('Risk Assessment Methodology', 'Methodology for conducting risk assessments...', 'Methodology', 'processed');

-- Insert sample services
INSERT OR IGNORE INTO service_catalog (name, description, category, owner, status, criticality) VALUES 
('User Authentication Service', 'Centralized authentication and authorization', 'Security', 'admin@demo.com', 'active', 'critical'),
('Log Management Service', 'Centralized logging and monitoring', 'Operations', 'analyst@demo.com', 'active', 'high'),
('Backup Service', 'Automated backup and recovery', 'Operations', 'admin@demo.com', 'active', 'critical'),
('Email Security Gateway', 'Email filtering and threat protection', 'Security', 'analyst@demo.com', 'active', 'high');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_risks_status ON risks(status);
CREATE INDEX IF NOT EXISTS idx_threats_status ON threat_intelligence(status);
CREATE INDEX IF NOT EXISTS idx_compliance_framework ON compliance_controls(framework);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);