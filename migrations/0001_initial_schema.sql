-- DMT Risk Assessment System v2.0 Database Schema
-- Core GRC platform with advanced risk management, compliance tracking, and AI-powered analytics

-- Users and Authentication
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    department TEXT,
    job_title TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'user', -- admin, risk_manager, compliance_officer, auditor, user
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Organizations and Business Units
CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    parent_id INTEGER,
    org_type TEXT NOT NULL, -- division, department, subsidiary, business_unit
    contact_email TEXT,
    risk_tolerance TEXT, -- low, medium, high
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES organizations(id)
);

-- Risk Categories and Taxonomy
CREATE TABLE IF NOT EXISTS risk_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    parent_id INTEGER,
    category_type TEXT NOT NULL, -- strategic, operational, financial, compliance, technology, esg
    risk_appetite TEXT, -- low, medium, high
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES risk_categories(id)
);

-- Risk Register - Core risk management
CREATE TABLE IF NOT EXISTS risks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    risk_id TEXT UNIQUE NOT NULL, -- DMT-RISK-2024-001
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,
    owner_id INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- active, mitigated, closed, monitoring
    risk_type TEXT NOT NULL, -- inherent, residual
    
    -- Risk Scoring (1-5 scale)
    probability INTEGER CHECK(probability BETWEEN 1 AND 5),
    impact INTEGER CHECK(impact BETWEEN 1 AND 5),
    risk_score INTEGER, -- calculated: probability * impact
    ai_risk_score REAL, -- AI-generated risk score
    
    -- Risk Assessment Details
    root_cause TEXT,
    potential_impact TEXT,
    existing_controls TEXT,
    
    -- Risk Treatment
    treatment_strategy TEXT, -- accept, avoid, mitigate, transfer
    mitigation_plan TEXT,
    target_probability INTEGER CHECK(target_probability BETWEEN 1 AND 5),
    target_impact INTEGER CHECK(target_impact BETWEEN 1 AND 5),
    target_risk_score INTEGER,
    
    -- Dates and Review
    identified_date DATE,
    last_reviewed DATE,
    next_review_date DATE,
    escalated_at DATETIME,
    resolved_at DATETIME,
    
    -- Metadata
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES risk_categories(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (owner_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Controls Framework
CREATE TABLE IF NOT EXISTS controls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    control_id TEXT UNIQUE NOT NULL, -- DMT-CTRL-001
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    control_type TEXT NOT NULL, -- preventive, detective, corrective, compensating
    control_category TEXT NOT NULL, -- manual, automated, hybrid
    
    -- Control Classification
    framework TEXT, -- ISO27001, SOX, NIST, COBIT
    control_family TEXT, -- access_control, data_protection, incident_management
    
    -- Control Details
    control_objective TEXT,
    control_procedure TEXT,
    frequency TEXT, -- continuous, daily, weekly, monthly, quarterly, annual
    automation_level TEXT, -- manual, semi_automated, fully_automated
    
    -- Ownership and Responsibility
    owner_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,
    
    -- Control Effectiveness
    design_effectiveness TEXT, -- effective, partially_effective, ineffective
    operating_effectiveness TEXT, -- effective, partially_effective, ineffective, not_tested
    
    -- Status and Lifecycle
    status TEXT NOT NULL DEFAULT 'active', -- active, inactive, retired
    implementation_date DATE,
    last_tested DATE,
    next_test_date DATE,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (owner_id) REFERENCES users(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Risk-Control Mapping
CREATE TABLE IF NOT EXISTS risk_controls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    risk_id INTEGER NOT NULL,
    control_id INTEGER NOT NULL,
    effectiveness_rating INTEGER CHECK(effectiveness_rating BETWEEN 1 AND 5),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (risk_id) REFERENCES risks(id),
    FOREIGN KEY (control_id) REFERENCES controls(id),
    UNIQUE(risk_id, control_id)
);

-- Compliance Requirements and Regulations
CREATE TABLE IF NOT EXISTS compliance_requirements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requirement_id TEXT UNIQUE NOT NULL, -- DMT-REQ-GDPR-001
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Regulatory Framework
    framework TEXT NOT NULL, -- GDPR, SOX, HIPAA, PCI-DSS, ISO27001
    regulation_reference TEXT, -- Article 32, Section 404
    requirement_type TEXT, -- mandatory, recommended, best_practice
    
    -- Applicability
    applicable_to TEXT, -- all_entities, specific_business_units, specific_processes
    jurisdiction TEXT, -- EU, US, UK, Global
    
    -- Implementation
    implementation_guidance TEXT,
    due_date DATE,
    compliance_status TEXT DEFAULT 'not_assessed', -- compliant, non_compliant, partially_compliant, not_assessed
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Compliance Assessments
CREATE TABLE IF NOT EXISTS compliance_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assessment_id TEXT UNIQUE NOT NULL, -- DMT-ASSESS-2024-001
    title TEXT NOT NULL,
    description TEXT,
    
    -- Assessment Details
    framework TEXT NOT NULL, -- GDPR, SOX, HIPAA, ISO27001
    assessment_type TEXT NOT NULL, -- self_assessment, external_audit, regulatory_exam
    scope TEXT, -- organization_wide, specific_processes, specific_controls
    
    -- Assessment Status
    status TEXT NOT NULL DEFAULT 'planning', -- planning, in_progress, review, completed, archived
    overall_rating TEXT, -- compliant, non_compliant, partially_compliant
    
    -- Stakeholders
    lead_assessor_id INTEGER,
    organization_id INTEGER NOT NULL,
    
    -- Timeline
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (lead_assessor_id) REFERENCES users(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Assessment Findings
CREATE TABLE IF NOT EXISTS assessment_findings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    finding_id TEXT UNIQUE NOT NULL, -- DMT-FIND-2024-001
    assessment_id INTEGER NOT NULL,
    requirement_id INTEGER,
    control_id INTEGER,
    
    -- Finding Details
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    finding_type TEXT NOT NULL, -- gap, deficiency, observation, best_practice
    severity TEXT NOT NULL, -- critical, high, medium, low
    
    -- Risk Assessment
    likelihood TEXT, -- high, medium, low
    impact TEXT, -- high, medium, low
    risk_rating TEXT, -- critical, high, medium, low
    
    -- Remediation
    recommendation TEXT,
    management_response TEXT,
    agreed_action TEXT,
    responsible_party_id INTEGER,
    target_completion_date DATE,
    actual_completion_date DATE,
    
    -- Status Tracking
    status TEXT NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assessment_id) REFERENCES compliance_assessments(id),
    FOREIGN KEY (requirement_id) REFERENCES compliance_requirements(id),
    FOREIGN KEY (control_id) REFERENCES controls(id),
    FOREIGN KEY (responsible_party_id) REFERENCES users(id)
);

-- Incidents and Issue Management
CREATE TABLE IF NOT EXISTS incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id TEXT UNIQUE NOT NULL, -- DMT-INC-2024-001
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    
    -- Classification
    incident_type TEXT NOT NULL, -- security, operational, compliance, data_breach
    severity TEXT NOT NULL, -- critical, high, medium, low
    priority TEXT NOT NULL, -- p1, p2, p3, p4
    
    -- Impact Assessment
    affected_systems TEXT,
    affected_data TEXT,
    business_impact TEXT,
    financial_impact REAL,
    
    -- Incident Response
    status TEXT NOT NULL DEFAULT 'new', -- new, investigating, containment, eradication, recovery, closed
    assigned_to INTEGER,
    response_team TEXT,
    
    -- Timeline
    detected_at DATETIME,
    reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at DATETIME,
    resolved_at DATETIME,
    closed_at DATETIME,
    
    -- Root Cause Analysis
    root_cause TEXT,
    contributing_factors TEXT,
    lessons_learned TEXT,
    
    -- Regulatory Notification
    requires_notification BOOLEAN DEFAULT FALSE,
    notification_deadline DATETIME,
    notification_status TEXT, -- not_required, pending, submitted, acknowledged
    
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Audit Trails and Activity Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL, -- risk, control, assessment, incident
    resource_id INTEGER,
    old_values TEXT, -- JSON
    new_values TEXT, -- JSON
    ip_address TEXT,
    user_agent TEXT,
    session_id TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ESG (Environmental, Social, Governance) Management
CREATE TABLE IF NOT EXISTS esg_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_id TEXT UNIQUE NOT NULL, -- DMT-ESG-ENV-001
    metric_name TEXT NOT NULL,
    metric_type TEXT NOT NULL, -- environmental, social, governance
    category TEXT NOT NULL, -- carbon_emissions, diversity, board_composition
    
    -- Metric Details
    description TEXT,
    unit_of_measure TEXT, -- tons_co2, percentage, count
    target_value REAL,
    current_value REAL,
    
    -- Data Collection
    data_source TEXT,
    collection_frequency TEXT, -- monthly, quarterly, annually
    last_updated DATETIME,
    next_update_due DATETIME,
    
    -- Ownership
    owner_id INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (owner_id) REFERENCES users(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Workflows and Process Automation
CREATE TABLE IF NOT EXISTS workflows (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_id TEXT UNIQUE NOT NULL, -- DMT-WF-RISK-REVIEW
    name TEXT NOT NULL,
    description TEXT,
    
    -- Workflow Configuration
    trigger_type TEXT NOT NULL, -- manual, scheduled, event_driven
    trigger_config TEXT, -- JSON configuration
    workflow_steps TEXT, -- JSON workflow definition
    
    -- Status and Control
    is_active BOOLEAN DEFAULT TRUE,
    version INTEGER DEFAULT 1,
    
    -- Ownership
    created_by INTEGER NOT NULL,
    organization_id INTEGER NOT NULL,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id),
    FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- AI Analytics and Insights
CREATE TABLE IF NOT EXISTS ai_insights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    insight_type TEXT NOT NULL, -- risk_prediction, anomaly_detection, trend_analysis
    resource_type TEXT NOT NULL, -- risk, control, compliance
    resource_id INTEGER,
    
    -- AI Analysis Results
    confidence_score REAL CHECK(confidence_score BETWEEN 0 AND 1),
    insight_data TEXT, -- JSON with AI analysis results
    recommendation TEXT,
    
    -- Model Information
    model_version TEXT,
    algorithm_used TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME
);

-- Indexes for Performance Optimization
CREATE INDEX IF NOT EXISTS idx_risks_category ON risks(category_id);
CREATE INDEX IF NOT EXISTS idx_risks_organization ON risks(organization_id);
CREATE INDEX IF NOT EXISTS idx_risks_owner ON risks(owner_id);
CREATE INDEX IF NOT EXISTS idx_risks_status ON risks(status);
CREATE INDEX IF NOT EXISTS idx_risks_score ON risks(risk_score);
CREATE INDEX IF NOT EXISTS idx_risks_next_review ON risks(next_review_date);

CREATE INDEX IF NOT EXISTS idx_controls_owner ON controls(owner_id);
CREATE INDEX IF NOT EXISTS idx_controls_organization ON controls(organization_id);
CREATE INDEX IF NOT EXISTS idx_controls_status ON controls(status);
CREATE INDEX IF NOT EXISTS idx_controls_framework ON controls(framework);

CREATE INDEX IF NOT EXISTS idx_assessments_organization ON compliance_assessments(organization_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON compliance_assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_dates ON compliance_assessments(planned_start_date, planned_end_date);

CREATE INDEX IF NOT EXISTS idx_findings_assessment ON assessment_findings(assessment_id);
CREATE INDEX IF NOT EXISTS idx_findings_status ON assessment_findings(status);
CREATE INDEX IF NOT EXISTS idx_findings_severity ON assessment_findings(severity);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON incidents(incident_type);
CREATE INDEX IF NOT EXISTS idx_incidents_assigned ON incidents(assigned_to);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_esg_type ON esg_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_esg_owner ON esg_metrics(owner_id);
CREATE INDEX IF NOT EXISTS idx_esg_organization ON esg_metrics(organization_id);