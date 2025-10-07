-- Basic setup for ARIA51 production - Essential tables and data
-- This creates the minimum viable database for the platform to function

-- Organizations table (required by users)
CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default organization
INSERT OR IGNORE INTO organizations (id, name, description) VALUES 
(1, 'ARIA Security Solutions', 'Main security organization');

-- Users table (authentication required)
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT NOT NULL DEFAULT 'user',
    organization_id INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Insert demo users with bcrypt hashes for 'demo123'
-- Hash: $2b$10$8K1p/a0dF2/4L.zv4I6K4O8r5VvY1f.9sZJ8K7yI1F0M3L.U2e6K.
INSERT OR IGNORE INTO users (id, username, email, password_hash, first_name, last_name, role, organization_id) VALUES
(1, 'admin', 'admin@aria51.com', '$2b$10$8K1p/a0dF2/4L.zv4I6K4O8r5VvY1f.9sZJ8K7yI1F0M3L.U2e6K.', 'Admin', 'User', 'admin', 1),
(2, 'avi_security', 'avi@aria51.com', '$2b$10$8K1p/a0dF2/4L.zv4I6K4O8r5VvY1f.9sZJ8K7yI1F0M3L.U2e6K.', 'Avi', 'Security', 'risk_manager', 1),
(3, 'sjohnson', 'sarah@aria51.com', '$2b$10$8K1p/a0dF2/4L.zv4I6K4O8r5VvY1f.9sZJ8K7yI1F0M3L.U2e6K.', 'Sarah', 'Johnson', 'compliance_officer', 1);

-- MS Defender Incidents table (main feature)
CREATE TABLE IF NOT EXISTS defender_incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id TEXT UNIQUE NOT NULL,
    incident_name TEXT NOT NULL,
    severity TEXT NOT NULL CHECK(severity IN ('Critical', 'High', 'Medium', 'Low', 'Informational')),
    status TEXT NOT NULL CHECK(status IN ('Active', 'InProgress', 'Resolved', 'Closed')),
    classification TEXT,
    assigned_to TEXT,
    alerts_count INTEGER DEFAULT 0,
    entities_count INTEGER DEFAULT 0,
    description TEXT,
    created_time DATETIME,
    last_update_time DATETIME,
    resolved_time DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample MS Defender incidents
INSERT OR IGNORE INTO defender_incidents (
    incident_id, incident_name, severity, status, classification, 
    assigned_to, alerts_count, entities_count, description, 
    created_time, last_update_time, resolved_time
) VALUES
('incident-008', 'Data Exfiltration Attempt', 'Critical', 'InProgress', 'TruePositive', 'SecOps Team', 7, 5, 'Large volumes of sensitive data being uploaded to external services', '2024-09-18 14:30:00', '2024-09-18 15:45:00', NULL),
('incident-007', 'Ransomware Behavior Pattern', 'Critical', 'Active', 'TruePositive', 'Incident Response', 12, 8, 'Multiple endpoints showing file encryption patterns consistent with ransomware', '2024-09-18 12:15:00', '2024-09-18 15:30:00', NULL),
('incident-006', 'Suspicious PowerShell Activity', 'High', 'InProgress', 'TruePositive', 'Threat Hunt Team', 5, 3, 'Obfuscated PowerShell commands executing across multiple systems', '2024-09-18 10:45:00', '2024-09-18 14:20:00', NULL),
('incident-005', 'Unusual Network Traffic', 'High', 'Resolved', 'TruePositive', 'Network Security', 8, 6, 'Abnormal outbound traffic to suspicious IP addresses', '2024-09-17 16:20:00', '2024-09-18 09:10:00', '2024-09-18 09:10:00'),
('incident-004', 'Phishing Email Campaign', 'Medium', 'Resolved', 'TruePositive', 'Email Security', 15, 12, 'Coordinated phishing attack targeting finance department', '2024-09-17 09:30:00', '2024-09-17 18:45:00', '2024-09-17 18:45:00'),
('incident-003', 'Privilege Escalation Attempt', 'High', 'Closed', 'TruePositive', 'SecOps Team', 4, 2, 'Attempted lateral movement with elevated privileges detected', '2024-09-16 14:15:00', '2024-09-17 11:20:00', '2024-09-17 11:20:00'),
('incident-002', 'Malicious File Download', 'Medium', 'Closed', 'TruePositive', 'Endpoint Security', 3, 4, 'Suspicious executable downloaded from compromised website', '2024-09-16 11:30:00', '2024-09-16 16:45:00', '2024-09-16 16:45:00'),
('incident-001', 'Failed Login Attempts', 'Low', 'Closed', 'FalsePositive', 'Identity Team', 25, 1, 'Multiple failed login attempts from various IP addresses', '2024-09-15 08:20:00', '2024-09-15 17:30:00', '2024-09-15 17:30:00');

-- Risk assessments table (core functionality)
CREATE TABLE IF NOT EXISTS risk_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    impact_score INTEGER CHECK(impact_score BETWEEN 1 AND 5),
    probability_score INTEGER CHECK(probability_score BETWEEN 1 AND 5),
    risk_score INTEGER,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'mitigated', 'accepted', 'transferred')),
    owner TEXT,
    organization_id INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Insert sample risk assessments
INSERT OR IGNORE INTO risk_assessments (title, description, category, impact_score, probability_score, risk_score, status, owner) VALUES
('Data Breach Risk', 'Risk of sensitive customer data being compromised', 'Data Security', 5, 3, 15, 'active', 'avi_security'),
('System Downtime', 'Risk of critical systems becoming unavailable', 'Availability', 4, 2, 8, 'active', 'admin'),
('Insider Threat', 'Risk from malicious or negligent insider activities', 'People', 4, 2, 8, 'active', 'avi_security'),
('Compliance Violation', 'Risk of regulatory compliance failures', 'Compliance', 3, 3, 9, 'mitigated', 'sjohnson'),
('Third-Party Risk', 'Risk from vendor and supplier security gaps', 'External', 3, 4, 12, 'active', 'avi_security');

-- Assets table (for asset management)
CREATE TABLE IF NOT EXISTS assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT,
    criticality TEXT CHECK(criticality IN ('Critical', 'High', 'Medium', 'Low')),
    owner TEXT,
    location TEXT,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'decommissioned')),
    organization_id INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Insert sample assets
INSERT OR IGNORE INTO assets (name, type, category, criticality, owner, location, status) VALUES
('Primary Database Server', 'Server', 'Infrastructure', 'Critical', 'IT Operations', 'Data Center A', 'active'),
('Customer Portal', 'Application', 'Web Application', 'High', 'Development Team', 'Cloud', 'active'),
('Employee Workstations', 'Endpoint', 'User Devices', 'Medium', 'IT Support', 'Office Network', 'active'),
('Backup Storage System', 'Storage', 'Infrastructure', 'High', 'IT Operations', 'Data Center B', 'active'),
('Security Monitoring Tools', 'Security System', 'Security', 'Critical', 'Security Team', 'Cloud', 'active');

-- System settings table (application configuration)
CREATE TABLE IF NOT EXISTS system_settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert basic system settings
INSERT OR IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
('platform_name', 'ARIA5.1', 'Platform display name'),
('version', '5.1.0', 'Current platform version'),
('maintenance_mode', 'false', 'Maintenance mode flag'),
('max_risk_score', '25', 'Maximum risk score calculation');