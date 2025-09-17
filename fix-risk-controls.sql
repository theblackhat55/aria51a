-- Fix risk control mapping tables for AI-powered risk-control linkage

-- 1. Add missing type column to compliance_frameworks
ALTER TABLE compliance_frameworks ADD COLUMN type TEXT DEFAULT 'SOC2';

-- 2. Create risk-control mapping table for automated linkage
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
    UNIQUE(risk_id, control_id, framework_id)
);

-- 3. Create index for efficient risk-control lookups
CREATE INDEX IF NOT EXISTS idx_risk_control_mappings_risk ON risk_control_mappings(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_control_mappings_control ON risk_control_mappings(control_id);
CREATE INDEX IF NOT EXISTS idx_risk_control_mappings_framework ON risk_control_mappings(framework_id);

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

-- 5. Update existing compliance frameworks with type
UPDATE compliance_frameworks SET type = 'SOC2' WHERE name LIKE '%SOC%';
UPDATE compliance_frameworks SET type = 'ISO27001' WHERE name LIKE '%ISO%';
UPDATE compliance_frameworks SET type = 'NIST' WHERE name LIKE '%NIST%';
UPDATE compliance_frameworks SET type = 'PCI-DSS' WHERE name LIKE '%PCI%';
UPDATE compliance_frameworks SET type = 'GDPR' WHERE name LIKE '%GDPR%';

-- 6. Insert foundational AI mapping patterns for common risk-control relationships
INSERT OR IGNORE INTO ai_mapping_patterns (risk_category, risk_keywords, control_family, control_keywords, mapping_strength, framework_type) VALUES

-- Access Control mappings
('Access Control', '["weak password", "password", "authentication", "login", "access", "credential", "multi-factor"]', 
 'Access Control', '["access control", "authentication", "password policy", "multi-factor", "privileged access", "user access"]', 
 0.95, 'SOC2'),

-- Data Protection mappings  
('Data Protection', '["data breach", "data loss", "encryption", "sensitive data", "personal data", "confidential"]',
 'Data Protection', '["data classification", "encryption", "data loss prevention", "backup", "data retention"]',
 0.92, 'SOC2'),

-- Network Security mappings
('Network Security', '["network attack", "firewall", "intrusion", "malware", "ransomware", "ddos"]',
 'Network Security', '["firewall", "intrusion detection", "network monitoring", "malware protection", "network segmentation"]',
 0.88, 'SOC2'),

-- Third Party Risk mappings
('Third Party Risk', '["vendor risk", "third party", "supply chain", "contractor", "outsourcing", "partner"]',
 'Vendor Management', '["vendor management", "third party assessment", "supplier security", "contract management"]',
 0.85, 'SOC2'),

-- Incident Response mappings
('Incident Management', '["incident", "breach", "security event", "response", "forensics", "recovery"]',
 'Incident Response', '["incident response", "incident management", "forensics", "recovery procedures"]',
 0.90, 'SOC2');

-- 7. Add some basic compliance controls if they don't exist
INSERT OR IGNORE INTO compliance_controls (
    control_id, framework_id, title, description, category, 
    implementation_status, created_at
) VALUES
-- SOC 2 Controls (assuming framework_id = 1)
('CC6.1', 1, 'Data Classification and Handling', 'Classify and handle data based on sensitivity levels', 'Data Security', 'implemented', CURRENT_TIMESTAMP),
('CC6.2', 1, 'Access Controls', 'Implement logical and physical access controls', 'Access Control', 'implemented', CURRENT_TIMESTAMP),
('CC6.3', 1, 'Authorization Controls', 'Establish authorization procedures for transactions', 'Authorization', 'implemented', CURRENT_TIMESTAMP),
('CC6.6', 1, 'Security Awareness', 'Provide security awareness training to personnel', 'Training', 'implemented', CURRENT_TIMESTAMP),
('CC6.7', 1, 'System Protection', 'Implement malware and threat protection systems', 'System Security', 'implemented', CURRENT_TIMESTAMP),
('CC9.1', 1, 'Vendor Management', 'Assess and monitor third-party service providers', 'Vendor Management', 'implemented', CURRENT_TIMESTAMP);