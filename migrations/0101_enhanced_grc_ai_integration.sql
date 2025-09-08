-- Enhanced GRC-AI Integration Database Schema
-- Migration: 0101_enhanced_grc_ai_integration.sql

-- Risk-Compliance Mappings Table
-- Stores AI-generated mappings between risks and compliance framework controls
CREATE TABLE IF NOT EXISTS risk_compliance_mappings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    risk_id INTEGER NOT NULL,
    framework TEXT NOT NULL CHECK (framework IN ('SOC2', 'ISO27001', 'NIST', 'PCI_DSS', 'GDPR', 'HIPAA')),
    control_id TEXT NOT NULL,
    control_name TEXT NOT NULL,
    relevance_score REAL CHECK (relevance_score >= 0 AND relevance_score <= 1),
    ai_rationale TEXT,
    implementation_guidance TEXT,
    risk_mitigation_impact REAL CHECK (risk_mitigation_impact >= 0 AND risk_mitigation_impact <= 1),
    mapping_confidence REAL DEFAULT 0.8,
    validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'rejected')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE
);

-- AI Control Assessments Table  
-- Stores AI-driven effectiveness assessments of security controls
CREATE TABLE IF NOT EXISTS ai_control_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    control_id TEXT NOT NULL,
    framework TEXT NOT NULL,
    current_effectiveness REAL CHECK (current_effectiveness >= 0 AND current_effectiveness <= 1),
    ai_assessment_reasoning TEXT,
    improvement_recommendations TEXT, -- JSON array
    threat_coverage_gaps TEXT, -- JSON array
    automation_opportunities TEXT, -- JSON array
    cost_benefit_analysis TEXT, -- JSON object
    assessment_confidence REAL DEFAULT 0.7,
    last_threat_landscape_update DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Framework Controls Master Table
-- Master reference for all compliance framework controls
CREATE TABLE IF NOT EXISTS framework_controls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    framework TEXT NOT NULL,
    control_id TEXT NOT NULL,
    control_name TEXT NOT NULL,
    control_category TEXT,
    control_description TEXT,
    control_type TEXT CHECK (control_type IN ('preventive', 'detective', 'corrective', 'compensating')),
    criticality_level TEXT DEFAULT 'medium' CHECK (criticality_level IN ('low', 'medium', 'high', 'critical')),
    automation_potential TEXT DEFAULT 'medium' CHECK (automation_potential IN ('low', 'medium', 'high')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(framework, control_id)
);

-- Control Implementations Table
-- Tracks implementation status and effectiveness of controls
CREATE TABLE IF NOT EXISTS control_implementations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    control_id INTEGER NOT NULL,
    implementation_status TEXT DEFAULT 'not_implemented' CHECK (implementation_status IN ('not_implemented', 'planned', 'in_progress', 'implemented', 'needs_improvement')),
    effectiveness_rating INTEGER DEFAULT 3 CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
    automation_status TEXT DEFAULT 'manual' CHECK (automation_status IN ('manual', 'semi_automated', 'automated')),
    implementation_notes TEXT,
    responsible_party TEXT,
    last_review_date DATETIME,
    next_review_date DATETIME,
    evidence_location TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (control_id) REFERENCES framework_controls(id) ON DELETE CASCADE
);

-- GRC Performance Metrics Table
-- Historical tracking of GRC performance with AI insights
CREATE TABLE IF NOT EXISTS grc_performance_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    compliance_score REAL CHECK (compliance_score >= 0 AND compliance_score <= 100),
    risk_posture_improvement REAL, -- percentage change
    control_automation_rate REAL CHECK (control_automation_rate >= 0 AND control_automation_rate <= 1),
    ai_driven_insights TEXT, -- JSON object with AI metrics
    framework_coverage TEXT, -- JSON array of framework coverage data
    total_risks INTEGER DEFAULT 0,
    mitigated_risks INTEGER DEFAULT 0,
    overdue_controls INTEGER DEFAULT 0,
    measurement_period_start DATETIME,
    measurement_period_end DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- AI Compliance Recommendations Table
-- Stores AI-generated compliance improvement recommendations
CREATE TABLE IF NOT EXISTS ai_compliance_recommendations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recommendation_type TEXT CHECK (recommendation_type IN ('control_gap', 'process_improvement', 'automation_opportunity', 'risk_treatment')),
    framework TEXT,
    control_id TEXT,
    priority_level TEXT DEFAULT 'medium' CHECK (priority_level IN ('low', 'medium', 'high', 'critical')),
    recommendation_summary TEXT NOT NULL,
    detailed_analysis TEXT,
    implementation_effort TEXT CHECK (implementation_effort IN ('low', 'medium', 'high')),
    expected_impact TEXT CHECK (expected_impact IN ('low', 'medium', 'high')),
    cost_estimate_range TEXT,
    ai_confidence_score REAL DEFAULT 0.7,
    supporting_evidence TEXT, -- JSON array
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'under_review', 'approved', 'implemented', 'rejected')),
    assigned_to TEXT,
    due_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Compliance Gap Analysis Table
-- AI-identified gaps in compliance coverage
CREATE TABLE IF NOT EXISTS compliance_gap_analysis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    framework TEXT NOT NULL,
    gap_type TEXT CHECK (gap_type IN ('missing_control', 'inadequate_implementation', 'outdated_control', 'coverage_gap')),
    gap_description TEXT NOT NULL,
    affected_control_ids TEXT, -- JSON array
    risk_level TEXT DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    business_impact_description TEXT,
    ai_analysis_summary TEXT,
    remediation_suggestions TEXT, -- JSON array
    estimated_remediation_time TEXT,
    estimated_cost_range TEXT,
    compliance_deadline DATETIME,
    gap_status TEXT DEFAULT 'identified' CHECK (gap_status IN ('identified', 'acknowledged', 'in_progress', 'resolved')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Control Testing Results Table
-- Tracks testing and validation results for controls
CREATE TABLE IF NOT EXISTS control_testing_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    control_id INTEGER NOT NULL,
    test_type TEXT CHECK (test_type IN ('design_effectiveness', 'operating_effectiveness', 'compliance_testing')),
    test_date DATETIME NOT NULL,
    test_result TEXT CHECK (test_result IN ('passed', 'failed', 'needs_improvement', 'not_applicable')),
    test_details TEXT,
    deficiencies_identified TEXT, -- JSON array
    corrective_actions TEXT, -- JSON array
    tester_name TEXT,
    next_test_date DATETIME,
    ai_risk_assessment TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (control_id) REFERENCES framework_controls(id) ON DELETE CASCADE
);

-- Create indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_risk_compliance_mappings_risk_id ON risk_compliance_mappings(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_compliance_mappings_framework ON risk_compliance_mappings(framework);
CREATE INDEX IF NOT EXISTS idx_ai_control_assessments_control_id ON ai_control_assessments(control_id);
CREATE INDEX IF NOT EXISTS idx_ai_control_assessments_framework ON ai_control_assessments(framework);
CREATE INDEX IF NOT EXISTS idx_framework_controls_framework ON framework_controls(framework);
CREATE INDEX IF NOT EXISTS idx_framework_controls_category ON framework_controls(control_category);
CREATE INDEX IF NOT EXISTS idx_control_implementations_status ON control_implementations(implementation_status);
CREATE INDEX IF NOT EXISTS idx_grc_metrics_created_at ON grc_performance_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_compliance_recommendations_priority ON ai_compliance_recommendations(priority_level);
CREATE INDEX IF NOT EXISTS idx_compliance_recommendations_status ON ai_compliance_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_gap_analysis_framework ON compliance_gap_analysis(framework);
CREATE INDEX IF NOT EXISTS idx_gap_analysis_risk_level ON compliance_gap_analysis(risk_level);
CREATE INDEX IF NOT EXISTS idx_control_testing_control_id ON control_testing_results(control_id);
CREATE INDEX IF NOT EXISTS idx_control_testing_result ON control_testing_results(test_result);

-- Insert baseline framework controls for SOC2
INSERT OR IGNORE INTO framework_controls (framework, control_id, control_name, control_category, control_description, control_type, criticality_level) VALUES
('SOC2', 'CC1.1', 'Control Environment', 'Common Criteria', 'Management establishes structures, reporting lines, and appropriate authorities and responsibilities', 'preventive', 'high'),
('SOC2', 'CC2.1', 'Communication and Information', 'Common Criteria', 'Quality information is identified, captured, and communicated to support the functioning of internal control', 'detective', 'high'),
('SOC2', 'CC3.1', 'Risk Assessment', 'Common Criteria', 'Management specifies objectives with sufficient clarity to enable identification and assessment of risks', 'preventive', 'critical'),
('SOC2', 'CC4.1', 'Monitoring Activities', 'Common Criteria', 'Management establishes and operates monitoring activities to monitor the system of internal control', 'detective', 'high'),
('SOC2', 'CC5.1', 'Control Activities', 'Common Criteria', 'Management designs control activities to achieve objectives and respond to risks', 'preventive', 'high'),
('SOC2', 'CC6.1', 'Logical and Physical Access Controls', 'Common Criteria', 'Management implements logical access security measures to protect against threats from sources outside', 'preventive', 'critical'),
('SOC2', 'CC6.2', 'Access Control Management', 'Common Criteria', 'Prior to issuing system credentials and granting access, management authorizes and approves users', 'preventive', 'critical'),
('SOC2', 'CC7.1', 'System Operations', 'Common Criteria', 'To meet its objectives, management uses detection and monitoring procedures', 'detective', 'high'),
('SOC2', 'CC8.1', 'Change Management', 'Common Criteria', 'Management authorizes, designs, develops, configures, documents, tests, approves, and implements changes', 'preventive', 'high'),
('SOC2', 'CC9.1', 'Risk Mitigation', 'Common Criteria', 'Management identifies, develops, and implements activities to mitigate identified security risks', 'corrective', 'high');

-- Insert baseline framework controls for ISO 27001  
INSERT OR IGNORE INTO framework_controls (framework, control_id, control_name, control_category, control_description, control_type, criticality_level) VALUES
('ISO27001', 'A.5.1', 'Information Security Policies', 'Organizational', 'Management direction for information security', 'preventive', 'critical'),
('ISO27001', 'A.6.1', 'Internal Organization', 'Organizational', 'Management commitment and support for information security', 'preventive', 'high'),
('ISO27001', 'A.7.1', 'Prior to Employment', 'Human Resources', 'Security screening and terms and conditions of employment', 'preventive', 'medium'),
('ISO27001', 'A.8.1', 'Responsibility for Assets', 'Asset Management', 'Asset inventory and ownership', 'preventive', 'high'),
('ISO27001', 'A.9.1', 'Access Control Policy', 'Access Control', 'Business requirements for access control', 'preventive', 'critical'),
('ISO27001', 'A.10.1', 'Cryptographic Controls', 'Cryptography', 'Policy on the use of cryptographic controls', 'preventive', 'high'),
('ISO27001', 'A.11.1', 'Physical Security Perimeters', 'Physical Security', 'Physical security perimeters', 'preventive', 'high'),
('ISO27001', 'A.12.1', 'Operational Procedures', 'Operations Security', 'Documented operating procedures', 'preventive', 'medium'),
('ISO27001', 'A.13.1', 'Network Security Management', 'Communications Security', 'Network controls', 'preventive', 'high'),
('ISO27001', 'A.14.1', 'Security Requirements Analysis', 'System Development', 'Information security requirements analysis and specification', 'preventive', 'high');

-- Insert sample control implementations
INSERT OR IGNORE INTO control_implementations (control_id, implementation_status, effectiveness_rating, automation_status, responsible_party) 
SELECT id, 'implemented', 4, 'semi_automated', 'Security Team' FROM framework_controls WHERE framework = 'SOC2' AND control_id IN ('CC1.1', 'CC6.1', 'CC6.2');

INSERT OR IGNORE INTO control_implementations (control_id, implementation_status, effectiveness_rating, automation_status, responsible_party) 
SELECT id, 'in_progress', 3, 'manual', 'Compliance Team' FROM framework_controls WHERE framework = 'ISO27001' AND control_id IN ('A.5.1', 'A.9.1');