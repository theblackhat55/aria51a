-- Services Table for RMF Hierarchy
-- Implements: Risks → Services → Assets → Incidents/Vulnerabilities
-- Services represent business services, IT systems, or application that use assets

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Service Classification
  type TEXT, -- e.g., 'application', 'infrastructure', 'business_process', 'data_service'
  category TEXT, -- e.g., 'customer_facing', 'internal', 'support'
  
  -- Criticality & Risk Scoring
  criticality TEXT DEFAULT 'medium' CHECK (criticality IN ('critical', 'high', 'medium', 'low', 'minimal')),
  criticality_score INTEGER DEFAULT 3 CHECK (criticality_score >= 1 AND criticality_score <= 5),
  -- 5 = Critical (Revenue-generating, customer-facing, compliance-required)
  -- 4 = High (Important business operations, significant impact)
  -- 3 = Medium (Standard business operations, moderate impact)
  -- 2 = Low (Supporting functions, minor impact)
  -- 1 = Minimal (Development, test systems, negligible impact)
  
  -- Business Impact
  availability_requirement TEXT DEFAULT 'medium' CHECK (availability_requirement IN ('critical', 'high', 'medium', 'low')),
  confidentiality_requirement TEXT DEFAULT 'medium' CHECK (confidentiality_requirement IN ('critical', 'high', 'medium', 'low')),
  integrity_requirement TEXT DEFAULT 'medium' CHECK (integrity_requirement IN ('critical', 'high', 'medium', 'low')),
  
  -- Financial Impact
  revenue_impact REAL, -- Annual revenue impact if service fails
  cost_per_hour_downtime REAL, -- Cost per hour of downtime
  
  -- Compliance & Regulatory
  compliance_relevant BOOLEAN DEFAULT 0, -- Is this service subject to regulatory compliance?
  compliance_frameworks TEXT, -- JSON array: ['SOC2', 'ISO27001', 'GDPR', 'HIPAA']
  
  -- Ownership & Management
  owner_id INTEGER,
  organization_id INTEGER,
  business_unit TEXT,
  technical_owner INTEGER, -- Technical contact
  business_owner INTEGER, -- Business contact
  
  -- Operational Data
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated', 'planned', 'retired')),
  deployment_date DATE,
  last_review_date DATE,
  next_review_date DATE,
  
  -- SLA & Performance
  sla_uptime_percentage REAL, -- e.g., 99.9
  rto_hours REAL, -- Recovery Time Objective in hours
  rpo_hours REAL, -- Recovery Point Objective in hours
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (technical_owner) REFERENCES users(id),
  FOREIGN KEY (business_owner) REFERENCES users(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Service-Assets Linking Table
-- Many-to-many: Services use multiple Assets, Assets support multiple Services
CREATE TABLE IF NOT EXISTS service_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id INTEGER NOT NULL,
  asset_id INTEGER NOT NULL,
  dependency_type TEXT DEFAULT 'uses' CHECK (dependency_type IN ('uses', 'depends_on', 'owns', 'manages')),
  criticality_contribution REAL DEFAULT 1.0, -- How much this asset contributes to service criticality (0.0-1.0)
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  UNIQUE(service_id, asset_id)
);

-- Risk-Services Linking Table
-- Many-to-many: Risks can affect multiple Services, Services can have multiple Risks
CREATE TABLE IF NOT EXISTS risk_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  impact_weight REAL DEFAULT 1.0,  -- How much this service affects risk score (0.0-1.0)
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (risk_id) REFERENCES risks(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  UNIQUE(risk_id, service_id)
);

-- Vulnerabilities Table (if not exists) for complete RMF
CREATE TABLE IF NOT EXISTS vulnerabilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Vulnerability Identification
  cve_id TEXT, -- CVE-2024-12345
  title TEXT NOT NULL,
  description TEXT,
  
  -- Severity & Scoring
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  cvss_score REAL CHECK (cvss_score >= 0 AND cvss_score <= 10), -- CVSS v3 score
  exploitability TEXT CHECK (exploitability IN ('high', 'medium', 'low', 'none')),
  
  -- Classification
  vulnerability_type TEXT, -- e.g., 'SQL Injection', 'XSS', 'Buffer Overflow'
  cwe_id TEXT, -- CWE-89
  
  -- Status & Remediation
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'mitigated', 'accepted', 'fixed', 'false_positive')),
  remediation_plan TEXT,
  remediation_deadline DATE,
  
  -- Associations
  asset_id INTEGER, -- Which asset has this vulnerability
  incident_id INTEGER, -- Related incident if exploited
  risk_id INTEGER, -- Related risk
  
  -- Discovery & Management
  discovered_date DATETIME,
  discovered_by TEXT, -- e.g., 'Security Scan', 'Penetration Test', 'Bug Bounty'
  reported_by INTEGER,
  assigned_to INTEGER,
  organization_id INTEGER,
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (incident_id) REFERENCES incidents(id),
  FOREIGN KEY (risk_id) REFERENCES risks(id),
  FOREIGN KEY (reported_by) REFERENCES users(id),
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_services_criticality ON services(criticality_score);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_organization ON services(organization_id);
CREATE INDEX IF NOT EXISTS idx_services_owner ON services(owner_id);

CREATE INDEX IF NOT EXISTS idx_service_assets_service ON service_assets(service_id);
CREATE INDEX IF NOT EXISTS idx_service_assets_asset ON service_assets(asset_id);

CREATE INDEX IF NOT EXISTS idx_risk_services_risk ON risk_services(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_services_service ON risk_services(service_id);

CREATE INDEX IF NOT EXISTS idx_vulnerabilities_asset ON vulnerabilities(asset_id);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_incident ON vulnerabilities(incident_id);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_risk ON vulnerabilities(risk_id);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_severity ON vulnerabilities(severity);
CREATE INDEX IF NOT EXISTS idx_vulnerabilities_status ON vulnerabilities(status);

-- Triggers for Dynamic Risk Recalculation
-- When service criticality changes, update all linked risks
CREATE TRIGGER IF NOT EXISTS update_risks_on_service_criticality_change
AFTER UPDATE OF criticality_score ON services
FOR EACH ROW
BEGIN
  UPDATE risks 
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id IN (
    SELECT risk_id 
    FROM risk_services 
    WHERE service_id = NEW.id
  );
END;

-- When risk-service linking changes, update risk
CREATE TRIGGER IF NOT EXISTS update_risk_on_service_link_change
AFTER INSERT ON risk_services
FOR EACH ROW
BEGIN
  UPDATE risks 
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.risk_id;
END;

-- When service-asset linking changes, update service and related risks
CREATE TRIGGER IF NOT EXISTS update_service_on_asset_link_change
AFTER INSERT ON service_assets
FOR EACH ROW
BEGIN
  UPDATE services 
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.service_id;
  
  -- Also update all risks linked to this service
  UPDATE risks 
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id IN (
    SELECT risk_id 
    FROM risk_services 
    WHERE service_id = NEW.service_id
  );
END;

-- NOTE: Seed data will be added separately after verifying user/organization/asset IDs exist
-- This ensures foreign key constraints are satisfied

-- RMF Hierarchy Documentation View
CREATE VIEW IF NOT EXISTS v_rmf_hierarchy AS
SELECT 
  r.id as risk_id,
  r.title as risk_title,
  r.risk_score as risk_score,
  s.id as service_id,
  s.name as service_name,
  s.criticality_score as service_criticality,
  a.id as asset_id,
  a.name as asset_name,
  a.criticality as asset_criticality,
  i.id as incident_id,
  i.title as incident_title,
  v.id as vulnerability_id,
  v.title as vulnerability_title,
  v.severity as vulnerability_severity
FROM risks r
LEFT JOIN risk_services rs ON r.id = rs.risk_id
LEFT JOIN services s ON rs.service_id = s.id
LEFT JOIN service_assets sa ON s.id = sa.service_id
LEFT JOIN assets a ON sa.asset_id = a.id
LEFT JOIN incidents i ON r.id = i.risk_id OR a.id = i.organization_id
LEFT JOIN vulnerabilities v ON r.id = v.risk_id OR a.id = v.asset_id;

-- Service Criticality Summary View
CREATE VIEW IF NOT EXISTS v_service_criticality_summary AS
SELECT 
  s.id,
  s.name,
  s.criticality,
  s.criticality_score,
  COUNT(DISTINCT sa.asset_id) as asset_count,
  COUNT(DISTINCT rs.risk_id) as risk_count,
  GROUP_CONCAT(DISTINCT a.name) as linked_assets
FROM services s
LEFT JOIN service_assets sa ON s.id = sa.service_id
LEFT JOIN risk_services rs ON s.id = rs.service_id
LEFT JOIN assets a ON sa.asset_id = a.id
WHERE s.status = 'active'
GROUP BY s.id;
