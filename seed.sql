-- DMT Risk Assessment Platform - Seed Data for Native Authentication
-- Test users with SHA-256 hashed passwords

-- Insert test users (password is 'password123' for all users)
INSERT OR IGNORE INTO users (
    username, 
    email, 
    password_hash, 
    first_name, 
    last_name, 
    role, 
    department, 
    job_title,
    is_active,
    created_at
) VALUES 
('admin', 'admin@dmt.local', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'System', 'Administrator', 'admin', 'IT', 'System Administrator', TRUE, CURRENT_TIMESTAMP),
('avi_security', 'avi@security.dmt', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Avi', 'Security', 'risk_manager', 'Security', 'Risk Manager', TRUE, CURRENT_TIMESTAMP),
('sjohnson', 'sarah.johnson@dmt.local', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Sarah', 'Johnson', 'compliance_officer', 'Compliance', 'Compliance Officer', TRUE, CURRENT_TIMESTAMP),
('jsmith', 'john.smith@dmt.local', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'John', 'Smith', 'auditor', 'Audit', 'Senior Auditor', TRUE, CURRENT_TIMESTAMP),
('mwilson', 'mary.wilson@dmt.local', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Mary', 'Wilson', 'risk_owner', 'Operations', 'Operations Manager', TRUE, CURRENT_TIMESTAMP);

-- Insert sample organizations
INSERT OR IGNORE INTO organizations (
    name, 
    description, 
    org_type, 
    risk_tolerance,
    created_at
) VALUES 
('DMT Corporation', 'Main organization', 'corporation', 'moderate', CURRENT_TIMESTAMP),
('IT Department', 'Information Technology Division', 'department', 'low', CURRENT_TIMESTAMP),
('Security Team', 'Cybersecurity and Risk Management', 'team', 'very_low', CURRENT_TIMESTAMP),
('Finance Division', 'Financial Operations and Compliance', 'department', 'low', CURRENT_TIMESTAMP),
('Operations Group', 'Business Operations Management', 'department', 'moderate', CURRENT_TIMESTAMP);

-- Insert sample risk categories
INSERT OR IGNORE INTO risk_categories (
    name,
    description,
    category_type,
    risk_appetite,
    created_at
) VALUES 
('Cybersecurity', 'Information security and data protection risks', 'security', 'very_low', CURRENT_TIMESTAMP),
('Operational', 'Business operation and process risks', 'operational', 'moderate', CURRENT_TIMESTAMP),
('Compliance', 'Regulatory and legal compliance risks', 'compliance', 'very_low', CURRENT_TIMESTAMP),
('Financial', 'Financial and market risks', 'financial', 'low', CURRENT_TIMESTAMP),
('Strategic', 'Business strategy and planning risks', 'strategic', 'moderate', CURRENT_TIMESTAMP),
('Technology', 'IT infrastructure and system risks', 'technology', 'low', CURRENT_TIMESTAMP);

-- Insert sample risks for demonstration
INSERT OR IGNORE INTO risks (
    risk_id,
    title,
    description,
    probability,
    impact,
    risk_score,
    category_id,
    organization_id,
    owner_id,
    status,
    risk_type,
    created_by,
    created_at
) VALUES 
('DMT-RISK-2024-001', 'Data Breach Risk', 'Potential unauthorized access to customer data', 3, 5, 15, 1, 1, 2, 'active', 'inherent', 2, CURRENT_TIMESTAMP),
('DMT-RISK-2024-002', 'System Downtime', 'Critical systems may experience unexpected downtime', 2, 4, 8, 2, 2, 5, 'active', 'inherent', 1, CURRENT_TIMESTAMP),
('DMT-RISK-2024-003', 'Regulatory Non-Compliance', 'Risk of failing to meet industry regulations', 2, 4, 8, 3, 1, 3, 'active', 'inherent', 3, CURRENT_TIMESTAMP),
('DMT-RISK-2024-004', 'Vendor Security Risk', 'Third-party vendor may have security vulnerabilities', 3, 3, 9, 1, 1, 2, 'mitigated', 'residual', 2, CURRENT_TIMESTAMP),
('DMT-RISK-2024-005', 'Budget Overrun', 'Project costs may exceed allocated budget', 4, 2, 8, 4, 4, 5, 'monitoring', 'inherent', 1, CURRENT_TIMESTAMP);

-- Insert sample incidents
INSERT OR IGNORE INTO incidents (
    incident_id,
    title,
    description,
    incident_type,
    severity,
    priority,
    status,
    created_by,
    created_at
) VALUES 
('DMT-INC-2024-001', 'Failed Login Attempts', 'Multiple failed login attempts detected', 'security', 'medium', 'p2', 'investigating', 2, CURRENT_TIMESTAMP),
('DMT-INC-2024-002', 'System Performance Degradation', 'Application response times increased significantly', 'operational', 'high', 'p1', 'containment', 1, CURRENT_TIMESTAMP),
('DMT-INC-2024-003', 'Compliance Documentation Missing', 'Required compliance documents not updated', 'compliance', 'medium', 'p3', 'new', 3, CURRENT_TIMESTAMP);

-- Insert configuration settings
INSERT OR IGNORE INTO ai_grc_config (
    config_key,
    config_value,
    description,
    is_active,
    created_at
) VALUES 
('default_risk_threshold', '10', 'Default risk score threshold for escalation', TRUE, CURRENT_TIMESTAMP),
('auto_assessment_enabled', 'true', 'Enable automatic risk assessment features', TRUE, CURRENT_TIMESTAMP),
('notification_enabled', 'true', 'Enable system notifications', TRUE, CURRENT_TIMESTAMP),
('session_timeout_minutes', '60', 'User session timeout in minutes', TRUE, CURRENT_TIMESTAMP);

-- Update sequences for auto-increment fields
UPDATE sqlite_sequence SET seq = 5 WHERE name = 'users';
UPDATE sqlite_sequence SET seq = 5 WHERE name = 'organizations';
UPDATE sqlite_sequence SET seq = 6 WHERE name = 'risk_categories';
UPDATE sqlite_sequence SET seq = 5 WHERE name = 'risks';
UPDATE sqlite_sequence SET seq = 3 WHERE name = 'incidents';