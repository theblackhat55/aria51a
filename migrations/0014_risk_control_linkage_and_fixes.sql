-- Fix dashboard risk calculation and add AI-powered risk-control linkage
-- Migration: 0014_risk_control_linkage_and_fixes.sql

-- 1. Create risk-control mapping table for automated linkage
CREATE TABLE IF NOT EXISTS risk_control_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    risk_id INTEGER NOT NULL,
    control_id TEXT NOT NULL,
    framework_id INTEGER NOT NULL,
    control_type TEXT NOT NULL, -- 'preventive', 'detective', 'corrective'
    effectiveness_rating INTEGER DEFAULT 3, -- 1-5 scale
    mapping_confidence REAL DEFAULT 0.8, -- AI confidence score 0-1
    ai_rationale TEXT, -- AI explanation for the mapping
    manual_override BOOLEAN DEFAULT FALSE,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (risk_id) REFERENCES risks(id),
    FOREIGN KEY (framework_id) REFERENCES compliance_frameworks(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE(risk_id, control_id, framework_id)
);

-- 2. Create index for efficient risk-control lookups
CREATE INDEX IF NOT EXISTS idx_risk_control_mappings_risk ON risk_control_mappings(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_control_mappings_control ON risk_control_mappings(control_id);
CREATE INDEX IF NOT EXISTS idx_risk_control_mappings_framework ON risk_control_mappings(framework_id);

-- 3. Add control effectiveness tracking
CREATE TABLE IF NOT EXISTS control_effectiveness (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    control_id TEXT NOT NULL,
    framework_id INTEGER NOT NULL,
    risk_reduction_percentage INTEGER DEFAULT 0, -- 0-100%
    implementation_status TEXT DEFAULT 'planned', -- 'planned', 'implementing', 'implemented', 'needs_improvement'
    last_tested_date DATE,
    test_results TEXT,
    effectiveness_score REAL DEFAULT 0.5, -- 0-1 scale
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (framework_id) REFERENCES compliance_frameworks(id),
    UNIQUE(control_id, framework_id)
);

-- 4. Add AI mapping metadata table for ML learning
CREATE TABLE IF NOT EXISTS ai_mapping_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    risk_category TEXT NOT NULL,
    risk_keywords TEXT NOT NULL, -- JSON array of keywords
    control_family TEXT NOT NULL,
    control_keywords TEXT NOT NULL, -- JSON array of keywords
    mapping_strength REAL DEFAULT 0.5, -- Learning weight
    success_rate REAL DEFAULT 0.5, -- Historical accuracy
    framework_type TEXT NOT NULL, -- 'SOC2', 'ISO27001', 'NIST', etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 5. Insert foundational AI mapping patterns for common risk-control relationships
INSERT OR IGNORE INTO ai_mapping_patterns (risk_category, risk_keywords, control_family, control_keywords, mapping_strength, framework_type) VALUES

-- Access Control mappings
('Access Control', '["weak password", "password", "authentication", "login", "access", "credential", "multi-factor"]', 
 'Access Control', '["access control", "authentication", "password policy", "multi-factor", "privileged access", "user access"]', 
 0.95, 'SOC2'),

('Access Control', '["weak password", "password", "authentication", "login", "access", "credential", "multi-factor"]', 
 'A.9', '["access control", "authentication", "password", "user access management", "privileged access"]', 
 0.93, 'ISO27001'),

-- Data Protection mappings  
('Data Protection', '["data breach", "data loss", "encryption", "sensitive data", "personal data", "confidential"]',
 'Data Protection', '["data classification", "encryption", "data loss prevention", "backup", "data retention"]',
 0.92, 'SOC2'),

('Data Protection', '["data breach", "data loss", "encryption", "sensitive data", "personal data", "confidential"]',
 'A.8', '["information classification", "data handling", "encryption", "secure disposal"]',
 0.90, 'ISO27001'),

-- Network Security mappings
('Network Security', '["network attack", "firewall", "intrusion", "malware", "ransomware", "ddos"]',
 'Network Security', '["firewall", "intrusion detection", "network monitoring", "malware protection", "network segmentation"]',
 0.88, 'SOC2'),

('Network Security', '["network attack", "firewall", "intrusion", "malware", "ransomware", "ddos"]',
 'A.13', '["network security management", "network controls", "segregation in networks"]',
 0.87, 'ISO27001'),

-- Third Party Risk mappings
('Third Party Risk', '["vendor risk", "third party", "supply chain", "contractor", "outsourcing", "partner"]',
 'Vendor Management', '["vendor management", "third party assessment", "supplier security", "contract management"]',
 0.85, 'SOC2'),

('Third Party Risk', '["vendor risk", "third party", "supply chain", "contractor", "outsourcing", "partner"]',
 'A.15', '["supplier relationships", "information security in supplier relationships"]',
 0.83, 'ISO27001'),

-- Incident Response mappings
('Incident Management', '["incident", "breach", "security event", "response", "forensics", "recovery"]',
 'Incident Response', '["incident response", "incident management", "forensics", "recovery procedures"]',
 0.90, 'SOC2'),

('Incident Management', '["incident", "breach", "security event", "response", "forensics", "recovery"]',
 'A.16', '["information security incident management", "incident response"]',
 0.88, 'ISO27001'),

-- Business Continuity mappings
('Business Continuity', '["disaster", "outage", "service disruption", "availability", "backup", "recovery"]',
 'Business Continuity', '["business continuity", "disaster recovery", "backup", "resilience"]',
 0.87, 'SOC2'),

('Business Continuity', '["disaster", "outage", "service disruption", "availability", "backup", "recovery"]',
 'A.17', '["business continuity management", "information systems availability"]',
 0.85, 'ISO27001');

-- 6. Create sample risk-control mappings based on existing risks
INSERT OR IGNORE INTO risk_control_mappings (risk_id, control_id, framework_id, control_type, effectiveness_rating, mapping_confidence, ai_rationale)
SELECT 
    r.id,
    CASE 
        WHEN LOWER(r.title) LIKE '%data breach%' OR LOWER(r.title) LIKE '%data%' THEN 'CC6.1'
        WHEN LOWER(r.title) LIKE '%password%' OR LOWER(r.title) LIKE '%access%' THEN 'CC6.2' 
        WHEN LOWER(r.title) LIKE '%vendor%' OR LOWER(r.title) LIKE '%third%' THEN 'CC9.1'
        WHEN LOWER(r.title) LIKE '%ransomware%' OR LOWER(r.title) LIKE '%malware%' THEN 'CC6.7'
        WHEN LOWER(r.title) LIKE '%phishing%' THEN 'CC6.6'
        WHEN LOWER(r.title) LIKE '%fraud%' THEN 'CC6.3'
        ELSE 'CC6.1'
    END,
    1, -- Assuming framework ID 1 is SOC2
    'preventive',
    4, -- High effectiveness
    0.85, -- Good confidence
    CASE 
        WHEN LOWER(r.title) LIKE '%data breach%' THEN 'Data breach risks require data classification and encryption controls'
        WHEN LOWER(r.title) LIKE '%vendor%' THEN 'Third-party risks need vendor management and assessment controls'
        WHEN LOWER(r.title) LIKE '%ransomware%' THEN 'Ransomware requires system protection and backup controls'
        WHEN LOWER(r.title) LIKE '%phishing%' THEN 'Phishing attacks need security awareness and email filtering'
        WHEN LOWER(r.title) LIKE '%fraud%' THEN 'Financial fraud requires monitoring and authorization controls'
        ELSE 'General security risk requiring baseline controls'
    END
FROM risks r
WHERE r.status = 'active';

-- 7. Update any existing controls that may exist (populate compliance_controls if empty)
INSERT OR IGNORE INTO compliance_controls (
    control_id, framework_id, title, description, category, 
    implementation_status, owner_id, created_at
) VALUES
-- SOC 2 Controls (assuming framework_id = 1)
('CC6.1', 1, 'Data Classification and Handling', 'Classify and handle data based on sensitivity levels', 'Data Security', 'implemented', 1, CURRENT_TIMESTAMP),
('CC6.2', 1, 'Access Controls', 'Implement logical and physical access controls', 'Access Control', 'implemented', 1, CURRENT_TIMESTAMP),
('CC6.3', 1, 'Authorization Controls', 'Establish authorization procedures for transactions', 'Authorization', 'implemented', 1, CURRENT_TIMESTAMP),
('CC6.6', 1, 'Security Awareness', 'Provide security awareness training to personnel', 'Training', 'implemented', 1, CURRENT_TIMESTAMP),
('CC6.7', 1, 'System Protection', 'Implement malware and threat protection systems', 'System Security', 'implemented', 1, CURRENT_TIMESTAMP),
('CC9.1', 1, 'Vendor Management', 'Assess and monitor third-party service providers', 'Vendor Management', 'implemented', 1, CURRENT_TIMESTAMP);

-- 8. Create view for risk-control dashboard
CREATE VIEW IF NOT EXISTS v_risk_control_summary AS
SELECT 
    r.id as risk_id,
    r.title as risk_title,
    r.category as risk_category,
    (r.probability * r.impact) as risk_score,
    r.status as risk_status,
    COUNT(rcm.id) as linked_controls_count,
    AVG(rcm.effectiveness_rating) as avg_control_effectiveness,
    GROUP_CONCAT(rcm.control_id) as linked_control_ids,
    CASE 
        WHEN COUNT(rcm.id) = 0 THEN 'unmapped'
        WHEN COUNT(rcm.id) < 2 THEN 'insufficient'
        WHEN AVG(rcm.effectiveness_rating) < 3 THEN 'ineffective'
        ELSE 'adequate'
    END as control_coverage_status
FROM risks r
LEFT JOIN risk_control_mappings rcm ON r.id = rcm.risk_id
WHERE r.status = 'active'
GROUP BY r.id, r.title, r.category, r.probability, r.impact, r.status;