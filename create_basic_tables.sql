-- Create basic assets_enhanced table
CREATE TABLE IF NOT EXISTS assets_enhanced (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  asset_type TEXT DEFAULT 'Primary',
  category TEXT DEFAULT 'Systems',
  subcategory TEXT,
  location TEXT,
  criticality TEXT DEFAULT 'Medium',
  confidentiality_numeric INTEGER DEFAULT 2,
  integrity_numeric INTEGER DEFAULT 2,
  availability_numeric INTEGER DEFAULT 2,
  risk_score REAL DEFAULT 0.0,
  operating_system TEXT,
  custodian_id TEXT,
  network_zone TEXT,
  compliance_requirements TEXT,
  patch_management TEXT,
  backup_status TEXT,
  monitoring_level TEXT,
  description TEXT,
  business_function TEXT,
  data_classification TEXT,
  active_status BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create basic risks table
CREATE TABLE IF NOT EXISTS risks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'Operational',
  probability INTEGER DEFAULT 3,
  impact INTEGER DEFAULT 3,
  risk_score INTEGER GENERATED ALWAYS AS (probability * impact) STORED,
  status TEXT DEFAULT 'active',
  severity TEXT DEFAULT 'Medium',
  organization_id INTEGER DEFAULT 1,
  created_by INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample assets
INSERT OR IGNORE INTO assets_enhanced (
  asset_id, name, asset_type, category, subcategory, location, criticality,
  confidentiality_numeric, integrity_numeric, availability_numeric, risk_score,
  operating_system, description, business_function, data_classification
) VALUES 
(
  'ASSET-WEB-01', 'Primary Web Server', 'Physical Server', 'Systems', 'Web Server',
  'Primary Data Center', 'High', 4, 4, 4, 4.0,
  'Ubuntu 22.04 LTS', 'Main customer-facing web server hosting the corporate website and customer portal',
  'Customer Service', 'Internal'
),
(
  'ASSET-DB-01', 'Database Server', 'Virtual Server', 'Systems', 'Database Server',
  'Primary Data Center', 'Critical', 5, 5, 4, 4.7,
  'CentOS 8', 'Primary customer and financial database server with real-time transaction processing',
  'Revenue Generation', 'Confidential'
),
(
  'ASSET-FW-01', 'Perimeter Firewall', 'Network Device', 'Network', 'Firewall',
  'Primary Data Center', 'Critical', 3, 5, 5, 4.3,
  'pfSense', 'Main perimeter firewall protecting internal network infrastructure',
  'Security', 'Internal'
),
(
  'ASSET-BACKUP-01', 'Backup Storage System', 'Storage Device', 'Systems', 'Storage',
  'Secondary Data Center', 'High', 4, 4, 3, 3.7,
  'FreeNAS', 'Network-attached storage system for automated daily backups',
  'Data Protection', 'Internal'
),
(
  'ASSET-LB-01', 'Load Balancer', 'Network Device', 'Network', 'Load Balancer', 
  'Primary Data Center', 'High', 3, 4, 5, 4.0,
  'HAProxy', 'Application load balancer distributing traffic across web servers',
  'Performance', 'Internal'
);

-- Insert sample risks
INSERT OR IGNORE INTO risks (
  title, description, category, probability, impact, status, severity
) VALUES 
(
  'Data Center Power Outage', 
  'Extended power outage at primary data center could cause service disruption', 
  'Infrastructure', 2, 4, 'active', 'High'
),
(
  'Cybersecurity Attack', 
  'Advanced persistent threat targeting customer databases and financial systems', 
  'Security', 3, 5, 'active', 'Critical'
),
(
  'Key Personnel Departure', 
  'Loss of critical technical staff could impact system maintenance and operations', 
  'Operational', 3, 3, 'active', 'Medium'
),
(
  'Software Vulnerability', 
  'Zero-day vulnerabilities in core applications could be exploited by attackers', 
  'Security', 4, 4, 'active', 'High'
),
(
  'Network Infrastructure Failure', 
  'Failure of core network components could cause widespread service outages', 
  'Infrastructure', 2, 5, 'active', 'Critical'
),
(
  'Compliance Violation', 
  'Failure to meet regulatory requirements could result in fines and legal action', 
  'Compliance', 2, 3, 'active', 'Medium'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_assets_criticality ON assets_enhanced(criticality);
CREATE INDEX IF NOT EXISTS idx_assets_category ON assets_enhanced(category);
CREATE INDEX IF NOT EXISTS idx_assets_active ON assets_enhanced(active_status);
CREATE INDEX IF NOT EXISTS idx_risks_status ON risks(status);
CREATE INDEX IF NOT EXISTS idx_risks_severity ON risks(severity);