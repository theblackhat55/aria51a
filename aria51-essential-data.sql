-- Essential data for ARIA51 demonstration
-- Add users and MS Defender incidents table

-- Check and add demo users if they don't exist
INSERT OR IGNORE INTO users (id, username, email, password_hash, first_name, last_name, role, organization_id) VALUES
(1, 'admin', 'admin@aria51.com', '$2b$10$8K1p/a0dF2/4L.zv4I6K4O8r5VvY1f.9sZJ8K7yI1F0M3L.U2e6K.', 'Admin', 'User', 'admin', 1),
(2, 'avi_security', 'avi@aria51.com', '$2b$10$8K1p/a0dF2/4L.zv4I6K4O8r5VvY1f.9sZJ8K7yI1F0M3L.U2e6K.', 'Avi', 'Security', 'risk_manager', 1),
(3, 'sjohnson', 'sarah@aria51.com', '$2b$10$8K1p/a0dF2/4L.zv4I6K4O8r5VvY1f.9sZJ8K7yI1F0M3L.U2e6K.', 'Sarah', 'Johnson', 'compliance_officer', 1);

-- Create MS Defender Incidents table if it doesn't exist
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