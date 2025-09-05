-- Enhanced Risk Management Framework Migration
-- Based on comprehensive risk management diagram analysis
-- Implements: Threat Sources → Threat Events → Vulnerabilities → Assets → Controls → Security Events → Incidents

-- ========================================
-- THREAT SOURCES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS threat_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Adversarial', 'Non-Adversarial')),
    subcategory TEXT NOT NULL, -- 'Individuals', 'Groups', 'Nation States', 'Human Error', 'System Failures', 'Environmental', 'Infrastructure Outages'
    description TEXT,
    likelihood_score INTEGER DEFAULT 1 CHECK (likelihood_score BETWEEN 1 AND 5),
    impact_potential TEXT DEFAULT 'Medium' CHECK (impact_potential IN ('Low', 'Medium', 'High', 'Critical')),
    active_status BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ========================================
-- THREAT EVENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS threat_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    threat_source_id INTEGER NOT NULL,
    event_type TEXT DEFAULT 'Direct Attack', -- 'Direct Attack', 'Indirect Exploitation', 'Accidental', 'Environmental'
    impact_level TEXT DEFAULT 'Medium' CHECK (impact_level IN ('Low', 'Medium', 'High', 'Critical')),
    frequency_estimate TEXT DEFAULT 'Rare', -- 'Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'
    attack_vector TEXT, -- 'Network', 'Physical', 'Social Engineering', 'Supply Chain', etc.
    active_status BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (threat_source_id) REFERENCES threat_sources(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ========================================
-- ENHANCED VULNERABILITIES TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS vulnerabilities_enhanced (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    vulnerability_type TEXT DEFAULT 'Technical', -- 'Technical', 'Procedural', 'Physical', 'Personnel'
    category TEXT, -- 'Software', 'Hardware', 'Network', 'Process', 'Human Factor'
    severity TEXT DEFAULT 'Medium' CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    cvss_score REAL CHECK (cvss_score >= 0 AND cvss_score <= 10),
    cwe_id TEXT, -- Common Weakness Enumeration ID
    discovery_method TEXT, -- 'Vulnerability Scan', 'Penetration Test', 'Code Review', 'Incident Analysis'
    exploitability TEXT DEFAULT 'Moderate', -- 'Low', 'Moderate', 'High', 'Very High'
    remediation_complexity TEXT DEFAULT 'Medium', -- 'Low', 'Medium', 'High', 'Very High'
    remediation_status TEXT DEFAULT 'Identified' CHECK (remediation_status IN ('Identified', 'Assigned', 'In Progress', 'Remediated', 'Verified', 'Accepted Risk')),
    remediation_due_date DATE,
    business_impact TEXT,
    exploitable_by TEXT, -- JSON array of threat_event_ids that can exploit this vulnerability
    active_status BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    assigned_to INTEGER,
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

-- ========================================
-- ENHANCED ASSETS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS assets_enhanced (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    asset_type TEXT NOT NULL CHECK (asset_type IN ('Primary', 'Supporting')),
    category TEXT NOT NULL, -- 'Data', 'Systems', 'Applications', 'Infrastructure', 'Personnel', 'Facilities'
    subcategory TEXT, -- 'Database', 'Web Server', 'Network Device', 'Mobile Device', etc.
    criticality TEXT DEFAULT 'Medium' CHECK (criticality IN ('Low', 'Medium', 'High', 'Critical')),
    business_function TEXT, -- Core business function this asset supports
    business_impact TEXT, -- Impact if asset is compromised
    confidentiality_requirement TEXT DEFAULT 'Medium' CHECK (confidentiality_requirement IN ('Low', 'Medium', 'High')),
    integrity_requirement TEXT DEFAULT 'Medium' CHECK (integrity_requirement IN ('Low', 'Medium', 'High')),
    availability_requirement TEXT DEFAULT 'Medium' CHECK (availability_requirement IN ('Low', 'Medium', 'High')),
    data_classification TEXT, -- 'Public', 'Internal', 'Confidential', 'Restricted'
    owner_id INTEGER, -- Asset owner (user)
    custodian_id INTEGER, -- Asset custodian (user)
    location TEXT, -- Physical or logical location
    enabled_assets TEXT, -- JSON array for Supporting Assets that enable Primary Assets
    depends_on_assets TEXT, -- JSON array of supporting asset dependencies
    regulatory_requirements TEXT, -- JSON array of applicable regulations
    active_status BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (owner_id) REFERENCES users(id),
    FOREIGN KEY (custodian_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ========================================
-- ENHANCED CONTROLS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS controls_enhanced (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    control_type TEXT NOT NULL CHECK (control_type IN ('Preventive', 'Detective', 'Corrective')),
    control_category TEXT NOT NULL CHECK (control_category IN ('Organizational', 'People', 'Physical', 'Technological')),
    control_family TEXT, -- 'Access Control', 'Audit and Accountability', 'Awareness and Training', etc.
    control_id TEXT UNIQUE, -- Standard control ID (NIST-800-53, ISO 27001, etc.)
    description TEXT,
    implementation_guidance TEXT,
    effectiveness_rating INTEGER DEFAULT 3 CHECK (effectiveness_rating BETWEEN 1 AND 5),
    maturity_level INTEGER DEFAULT 1 CHECK (maturity_level BETWEEN 1 AND 5), -- 1=Initial, 5=Optimized
    implementation_status TEXT DEFAULT 'Planned' CHECK (implementation_status IN ('Planned', 'In Progress', 'Implemented', 'Verified', 'Decommissioned')),
    implementation_date DATE,
    last_assessment_date DATE,
    next_assessment_date DATE,
    cost_estimate DECIMAL(10,2),
    responsible_party INTEGER, -- User responsible for implementation
    testing_frequency TEXT DEFAULT 'Annual', -- 'Monthly', 'Quarterly', 'Semi-Annual', 'Annual'
    automation_level TEXT DEFAULT 'Manual', -- 'Manual', 'Semi-Automated', 'Fully Automated'
    protects_assets TEXT, -- JSON array of asset_ids this control protects
    mitigates_threats TEXT, -- JSON array of threat_event_ids this control mitigates
    addresses_vulnerabilities TEXT, -- JSON array of vulnerability_ids this control addresses
    compliance_frameworks TEXT, -- JSON array of compliance frameworks (ISO27001, NIST, SOC2, etc.)
    active_status BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (responsible_party) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ========================================
-- SECURITY EVENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS security_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    event_type TEXT DEFAULT 'Anomaly' CHECK (event_type IN ('Anomaly', 'Violation', 'Attack', 'Incident', 'False Positive')),
    severity TEXT DEFAULT 'Medium' CHECK (severity IN ('Informational', 'Low', 'Medium', 'High', 'Critical')),
    source_ip TEXT,
    source_system TEXT,
    target_system TEXT,
    event_category TEXT, -- 'Authentication', 'Authorization', 'Data Access', 'Network', 'Malware', etc.
    source_vulnerability_id INTEGER,
    detected_by_control_id INTEGER,
    related_threat_event_id INTEGER,
    affected_assets TEXT, -- JSON array of affected asset_ids
    incident_status TEXT DEFAULT 'Open' CHECK (incident_status IN ('Open', 'Investigating', 'Contained', 'Eradicated', 'Recovered', 'Closed', 'False Positive')),
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('P1-Critical', 'P2-High', 'P3-Medium', 'P4-Low')),
    assigned_analyst INTEGER,
    escalated_to INTEGER,
    resolution_notes TEXT,
    lessons_learned TEXT,
    event_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    detection_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    response_timestamp DATETIME,
    resolution_timestamp DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (source_vulnerability_id) REFERENCES vulnerabilities_enhanced(id),
    FOREIGN KEY (detected_by_control_id) REFERENCES controls_enhanced(id),
    FOREIGN KEY (related_threat_event_id) REFERENCES threat_events(id),
    FOREIGN KEY (assigned_analyst) REFERENCES users(id),
    FOREIGN KEY (escalated_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ========================================
-- RISK RELATIONSHIPS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS risk_relationships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    relationship_type TEXT NOT NULL CHECK (relationship_type IN (
        'imposes', 'exploits', 'impacts', 'enables', 'mitigates', 'detects', 
        'restores', 'causes', 'classified_as', 'compromises', 'depends_on'
    )),
    source_type TEXT NOT NULL CHECK (source_type IN (
        'threat_source', 'threat_event', 'vulnerability', 'asset', 'control', 'security_event'
    )),
    source_id INTEGER NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN (
        'threat_source', 'threat_event', 'vulnerability', 'asset', 'control', 'security_event', 'operation'
    )),
    target_id INTEGER NOT NULL,
    relationship_strength TEXT DEFAULT 'Medium' CHECK (relationship_strength IN ('Low', 'Medium', 'High')),
    probability REAL CHECK (probability >= 0 AND probability <= 1), -- Probability of relationship occurrence
    impact_score INTEGER CHECK (impact_score BETWEEN 1 AND 5),
    confidence_level TEXT DEFAULT 'Medium' CHECK (confidence_level IN ('Low', 'Medium', 'High')),
    evidence_source TEXT, -- Source of evidence for this relationship
    notes TEXT,
    validated BOOLEAN DEFAULT FALSE,
    validation_date DATE,
    validated_by INTEGER,
    active_status BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (validated_by) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id),
    UNIQUE(source_type, source_id, target_type, target_id, relationship_type)
);

-- ========================================
-- ENHANCED RISK ASSESSMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS risk_assessments_enhanced (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    assessment_type TEXT DEFAULT 'Comprehensive' CHECK (assessment_type IN ('Comprehensive', 'Focused', 'Rapid', 'Continuous')),
    scope_definition TEXT, -- What assets/systems are included
    methodology TEXT DEFAULT 'Qualitative', -- 'Qualitative', 'Quantitative', 'Hybrid'
    
    -- Risk Calculation Components
    threat_source_id INTEGER,
    threat_event_id INTEGER,
    vulnerability_id INTEGER,
    primary_asset_id INTEGER,
    
    -- Risk Scores
    threat_likelihood INTEGER CHECK (threat_likelihood BETWEEN 1 AND 5),
    vulnerability_severity INTEGER CHECK (vulnerability_severity BETWEEN 1 AND 5),
    asset_criticality INTEGER CHECK (asset_criticality BETWEEN 1 AND 5),
    control_effectiveness INTEGER CHECK (control_effectiveness BETWEEN 1 AND 5),
    
    -- Calculated Risk
    inherent_risk_score REAL, -- Risk without controls
    residual_risk_score REAL, -- Risk with current controls
    target_risk_score REAL, -- Desired risk level after additional controls
    
    risk_level TEXT CHECK (risk_level IN ('Very Low', 'Low', 'Medium', 'High', 'Very High')),
    risk_appetite TEXT CHECK (risk_appetite IN ('Avoid', 'Mitigate', 'Transfer', 'Accept')),
    
    -- Treatment Plan
    treatment_strategy TEXT CHECK (treatment_strategy IN ('Avoid', 'Mitigate', 'Transfer', 'Accept')),
    treatment_plan TEXT,
    treatment_timeline DATE,
    treatment_cost_estimate DECIMAL(10,2),
    treatment_responsible_party INTEGER,
    
    -- Assessment Metadata
    assessment_status TEXT DEFAULT 'Draft' CHECK (assessment_status IN ('Draft', 'Under Review', 'Approved', 'Implemented', 'Monitored', 'Archived')),
    assessor_id INTEGER,
    reviewer_id INTEGER,
    approver_id INTEGER,
    assessment_date DATE DEFAULT (DATE('now')),
    review_date DATE,
    approval_date DATE,
    next_review_date DATE,
    
    -- Compliance & Audit
    regulatory_impact TEXT, -- Impact on regulatory compliance
    audit_findings TEXT,
    management_response TEXT,
    
    active_status BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    
    FOREIGN KEY (threat_source_id) REFERENCES threat_sources(id),
    FOREIGN KEY (threat_event_id) REFERENCES threat_events(id),
    FOREIGN KEY (vulnerability_id) REFERENCES vulnerabilities_enhanced(id),
    FOREIGN KEY (primary_asset_id) REFERENCES assets_enhanced(id),
    FOREIGN KEY (treatment_responsible_party) REFERENCES users(id),
    FOREIGN KEY (assessor_id) REFERENCES users(id),
    FOREIGN KEY (reviewer_id) REFERENCES users(id),
    FOREIGN KEY (approver_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ========================================
-- CONTROL TESTING RESULTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS control_testing_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    control_id INTEGER NOT NULL,
    test_date DATE NOT NULL,
    test_type TEXT DEFAULT 'Manual' CHECK (test_type IN ('Manual', 'Automated', 'Walkthrough', 'Observation', 'Inspection')),
    test_procedure TEXT,
    tester_id INTEGER,
    test_result TEXT CHECK (test_result IN ('Effective', 'Partially Effective', 'Ineffective', 'Not Tested')),
    test_score INTEGER CHECK (test_score BETWEEN 1 AND 5),
    findings TEXT,
    recommendations TEXT,
    remediation_required BOOLEAN DEFAULT FALSE,
    remediation_timeline DATE,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    evidence_location TEXT,
    compliance_impact TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (control_id) REFERENCES controls_enhanced(id) ON DELETE CASCADE,
    FOREIGN KEY (tester_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================
CREATE INDEX IF NOT EXISTS idx_threat_sources_category ON threat_sources(category, subcategory);
CREATE INDEX IF NOT EXISTS idx_threat_events_source ON threat_events(threat_source_id);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_severity ON vulnerabilities_enhanced(severity, remediation_status);
CREATE INDEX IF NOT EXISTS idx_assets_type_criticality ON assets_enhanced(asset_type, criticality);
CREATE INDEX IF NOT EXISTS idx_controls_type_status ON controls_enhanced(control_type, implementation_status);
CREATE INDEX IF NOT EXISTS idx_security_events_status ON security_events(incident_status, priority);
CREATE INDEX IF NOT EXISTS idx_risk_relationships_source ON risk_relationships(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_risk_relationships_target ON risk_relationships(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_status ON risk_assessments_enhanced(assessment_status, risk_level);

-- ========================================
-- INSERT SAMPLE DATA - THREAT SOURCES
-- ========================================
INSERT OR IGNORE INTO threat_sources (name, category, subcategory, description, likelihood_score, impact_potential) VALUES
-- Adversarial Threats
('Advanced Persistent Threat (APT) Groups', 'Adversarial', 'Nation States', 'State-sponsored cyber espionage groups targeting intellectual property and sensitive data', 3, 'Critical'),
('Organized Cybercriminals', 'Adversarial', 'Groups', 'Professional criminal organizations focused on financial gain through ransomware and fraud', 4, 'High'),
('Hacktivist Collectives', 'Adversarial', 'Groups', 'Ideologically motivated groups conducting cyber attacks for political or social causes', 3, 'Medium'),
('Malicious Insiders', 'Adversarial', 'Individuals', 'Employees or contractors with authorized access who abuse their privileges', 2, 'High'),
('Script Kiddies', 'Adversarial', 'Individuals', 'Inexperienced attackers using readily available tools and exploits', 4, 'Low'),
-- Non-Adversarial Threats
('Human Error - Administrative', 'Non-Adversarial', 'Human Error', 'Accidental misconfigurations, data deletions, or procedural mistakes by staff', 5, 'Medium'),
('Human Error - User Mistakes', 'Non-Adversarial', 'Human Error', 'End-user errors such as clicking malicious links or weak password practices', 5, 'Medium'),
('Hardware Failures', 'Non-Adversarial', 'System Failures', 'Server crashes, disk failures, network equipment malfunctions', 3, 'Medium'),
('Software Bugs', 'Non-Adversarial', 'System Failures', 'Application crashes, memory leaks, logic errors in software systems', 4, 'Medium'),
('Natural Disasters', 'Non-Adversarial', 'Environmental', 'Earthquakes, floods, fires, hurricanes affecting physical infrastructure', 2, 'Critical'),
('Power Outages', 'Non-Adversarial', 'Infrastructure Outages', 'Electrical grid failures affecting data center operations', 3, 'High'),
('Internet Service Provider Outages', 'Non-Adversarial', 'Infrastructure Outages', 'ISP connectivity failures disrupting network services', 3, 'Medium');

-- ========================================
-- INSERT SAMPLE DATA - THREAT EVENTS
-- ========================================
INSERT OR IGNORE INTO threat_events (name, description, threat_source_id, event_type, impact_level, frequency_estimate, attack_vector) VALUES
-- APT Threat Events
('Data Exfiltration Campaign', 'Systematic extraction of intellectual property and sensitive customer data', 1, 'Direct Attack', 'Critical', 'Unlikely', 'Network'),
('Supply Chain Compromise', 'Infiltration through trusted third-party vendors and suppliers', 1, 'Indirect Exploitation', 'High', 'Rare', 'Supply Chain'),
-- Cybercriminal Threat Events
('Ransomware Deployment', 'Encryption of critical systems and data with ransom demands', 2, 'Direct Attack', 'Critical', 'Possible', 'Network'),
('Business Email Compromise', 'Fraudulent wire transfers through compromised executive email accounts', 2, 'Direct Attack', 'High', 'Likely', 'Social Engineering'),
-- Human Error Threat Events
('Accidental Data Deletion', 'Unintentional removal of critical business data or configurations', 6, 'Accidental', 'Medium', 'Likely', 'Physical'),
('Misconfiguration Incident', 'Incorrect system settings exposing sensitive data or creating vulnerabilities', 6, 'Accidental', 'Medium', 'Possible', 'Network'),
-- System Failure Threat Events
('Database Server Crash', 'Critical database system becoming unavailable due to hardware failure', 8, 'Environmental', 'High', 'Unlikely', 'Physical'),
('Network Infrastructure Failure', 'Core networking equipment failure disrupting business operations', 8, 'Environmental', 'High', 'Possible', 'Network');

-- Update the timestamp for the enhanced tables
UPDATE system_configuration SET value = DATETIME('now') WHERE key = 'database_version';
INSERT OR REPLACE INTO system_configuration (key, value) VALUES ('enhanced_risk_framework', 'true');
INSERT OR REPLACE INTO system_configuration (key, value) VALUES ('risk_framework_version', '2.0');