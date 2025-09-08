-- Create dedicated services table (should not be mixed with assets)
-- Services are organizational capabilities, not physical/digital assets

CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT UNIQUE NOT NULL,
  
  -- Basic service information
  name TEXT NOT NULL,
  description TEXT,
  service_category TEXT DEFAULT 'Business Service', -- Web Service, Business Service, Infrastructure Service
  business_department TEXT,
  service_owner TEXT,
  
  -- Business Impact Assessment (CIA Triad)
  confidentiality_impact TEXT DEFAULT 'Medium', -- Very Low, Low, Medium, High, Very High
  integrity_impact TEXT DEFAULT 'Medium',
  availability_impact TEXT DEFAULT 'Medium',
  
  -- Numeric CIA scores (1-5) for calculations
  confidentiality_numeric INTEGER DEFAULT 3,
  integrity_numeric INTEGER DEFAULT 3,
  availability_numeric INTEGER DEFAULT 3,
  
  -- Service Level Requirements
  recovery_time_objective INTEGER DEFAULT 24, -- RTO in hours
  recovery_point_objective INTEGER DEFAULT 24, -- RPO in hours
  service_availability_target REAL DEFAULT 99.0, -- SLA percentage
  
  -- Business context
  business_function TEXT DEFAULT 'General Operations',
  user_impact_scope TEXT DEFAULT 'Internal', -- Public, Customer, Partner, Internal, Limited
  revenue_impact TEXT DEFAULT 'None', -- Direct, Indirect, Support, None
  
  -- AI-calculated criticality
  criticality TEXT DEFAULT 'Medium' CHECK(criticality IN ('Critical', 'High', 'Medium', 'Low')),
  criticality_score INTEGER DEFAULT 50 CHECK(criticality_score >= 0 AND criticality_score <= 100),
  ai_confidence REAL DEFAULT 0.0 CHECK(ai_confidence >= 0 AND ai_confidence <= 1),
  ai_last_assessment DATETIME,
  ai_next_assessment DATETIME,
  
  -- Calculated metrics
  risk_score REAL DEFAULT 0.0,
  business_impact_score INTEGER DEFAULT 50,
  
  -- Service status and lifecycle
  service_status TEXT DEFAULT 'Active' CHECK(service_status IN ('Active', 'Inactive', 'Deprecated', 'Planning', 'Development')),
  
  -- Audit fields
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  
  -- Indexes for performance
  UNIQUE(service_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_services_category ON services(service_category);
CREATE INDEX IF NOT EXISTS idx_services_department ON services(business_department);
CREATE INDEX IF NOT EXISTS idx_services_criticality ON services(criticality);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(service_status);
CREATE INDEX IF NOT EXISTS idx_services_ai_assessment ON services(ai_last_assessment);

-- Service dependencies table (many-to-many relationships between services and assets)
CREATE TABLE IF NOT EXISTS service_dependencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  dependency_type TEXT NOT NULL CHECK(dependency_type IN ('asset', 'service', 'external')),
  dependency_id TEXT NOT NULL, -- asset_id, service_id, or external system identifier
  dependency_name TEXT NOT NULL,
  
  -- Relationship metadata
  relationship_type TEXT DEFAULT 'depends_on' CHECK(relationship_type IN ('depends_on', 'supports', 'integrates_with', 'contains')),
  criticality_level TEXT DEFAULT 'Medium' CHECK(criticality_level IN ('Critical', 'High', 'Medium', 'Low')),
  
  -- Audit
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  
  FOREIGN KEY (service_id) REFERENCES services(service_id),
  UNIQUE(service_id, dependency_type, dependency_id)
);

-- Service risk associations (many-to-many between services and risks)
CREATE TABLE IF NOT EXISTS service_risks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  risk_id INTEGER NOT NULL,
  
  -- Risk relationship metadata
  impact_type TEXT DEFAULT 'affects' CHECK(impact_type IN ('affects', 'threatens', 'impacts', 'degrades', 'disrupts')),
  impact_severity TEXT DEFAULT 'Medium' CHECK(impact_severity IN ('Critical', 'High', 'Medium', 'Low')),
  
  -- Audit
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  
  FOREIGN KEY (service_id) REFERENCES services(service_id),
  FOREIGN KEY (risk_id) REFERENCES risks(id),
  UNIQUE(service_id, risk_id)
);

-- Update service_criticality_assessments to reference services table instead of assets
-- Drop the old foreign key constraint and recreate table
DROP TABLE IF EXISTS service_criticality_assessments;

CREATE TABLE service_criticality_assessments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  calculated_criticality TEXT CHECK(calculated_criticality IN ('Critical', 'High', 'Medium', 'Low')) NOT NULL,
  criticality_score INTEGER CHECK(criticality_score >= 0 AND criticality_score <= 100) NOT NULL,
  confidence_level REAL CHECK(confidence_level >= 0 AND confidence_level <= 1) NOT NULL,
  
  -- Store JSON objects for complex data
  contributing_factors TEXT NOT NULL, -- JSON: CIA, asset deps, risks, business, technical, historical scores
  recommendations TEXT NOT NULL,      -- JSON: array of recommendation strings
  reassessment_triggers TEXT NOT NULL, -- JSON: array of trigger condition strings
  
  last_assessment DATETIME NOT NULL,
  next_assessment_due DATETIME NOT NULL,
  
  -- Audit fields
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key to services table (not assets)
  FOREIGN KEY (service_id) REFERENCES services(service_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_service_assessments_service_id ON service_criticality_assessments(service_id);
CREATE INDEX IF NOT EXISTS idx_service_assessments_criticality ON service_criticality_assessments(calculated_criticality);
CREATE INDEX IF NOT EXISTS idx_service_assessments_score ON service_criticality_assessments(criticality_score DESC);

-- Update service_asset_links and service_risk_links to reference services table
-- These were created in the previous migration but should reference services, not assets

-- Drop and recreate service_asset_links with correct foreign keys
DROP TABLE IF EXISTS service_asset_links;

CREATE TABLE service_asset_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  asset_id TEXT NOT NULL,
  relationship_type TEXT DEFAULT 'depends_on' CHECK(relationship_type IN ('depends_on', 'supports', 'contains', 'integrates_with')),
  dependency_strength TEXT DEFAULT 'medium' CHECK(dependency_strength IN ('critical', 'high', 'medium', 'low')),
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  
  -- Unique constraint to prevent duplicate relationships
  UNIQUE(service_id, asset_id, relationship_type),
  
  -- Foreign key constraints - service_id references services.service_id, asset_id references assets_enhanced.asset_id
  FOREIGN KEY (service_id) REFERENCES services(service_id),
  FOREIGN KEY (asset_id) REFERENCES assets_enhanced(asset_id)
);

-- Drop and recreate service_risk_links with correct foreign keys  
DROP TABLE IF EXISTS service_risk_links;

CREATE TABLE service_risk_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  risk_id INTEGER NOT NULL,
  relationship_type TEXT DEFAULT 'affects' CHECK(relationship_type IN ('affects', 'threatens', 'impacts', 'degrades')),
  impact_level TEXT DEFAULT 'medium' CHECK(impact_level IN ('critical', 'high', 'medium', 'low')),
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  
  -- Unique constraint to prevent duplicate relationships
  UNIQUE(service_id, risk_id, relationship_type),
  
  -- Foreign key constraints
  FOREIGN KEY (service_id) REFERENCES services(service_id),
  FOREIGN KEY (risk_id) REFERENCES risks(id)
);

-- Add indexes for the relationship tables
CREATE INDEX IF NOT EXISTS idx_service_asset_links_service ON service_asset_links(service_id);
CREATE INDEX IF NOT EXISTS idx_service_asset_links_asset ON service_asset_links(asset_id);
CREATE INDEX IF NOT EXISTS idx_service_risk_links_service ON service_risk_links(service_id);
CREATE INDEX IF NOT EXISTS idx_service_risk_links_risk ON service_risk_links(risk_id);

-- Insert sample services for testing
INSERT OR IGNORE INTO services (
  service_id, name, description, service_category, business_department, 
  confidentiality_impact, integrity_impact, availability_impact,
  confidentiality_numeric, integrity_numeric, availability_numeric,
  business_function, criticality, criticality_score
) VALUES 
(
  'SVC-CUSTOMER-PORTAL', 'Customer Portal', 'Primary customer-facing web portal for account management and service requests', 
  'Web Service', 'Customer Service', 
  'High', 'High', 'High',
  4, 4, 4,
  'Customer Service', 'High', 75
),
(
  'SVC-PAYMENT-PROCESSING', 'Payment Processing Service', 'Core payment processing and billing system', 
  'Business Service', 'Finance', 
  'Very High', 'Very High', 'High',
  5, 5, 4,
  'Revenue Generation', 'Critical', 92
),
(
  'SVC-EMAIL-NOTIFICATIONS', 'Email Notification Service', 'Automated email notifications and alerts system', 
  'Infrastructure Service', 'IT Operations', 
  'Medium', 'Medium', 'Medium',
  3, 3, 3,
  'Communications', 'Medium', 55
),
(
  'SVC-DATA-BACKUP', 'Data Backup Service', 'Automated backup and recovery service for critical data', 
  'Infrastructure Service', 'IT Operations', 
  'High', 'Very High', 'Medium',
  4, 5, 3,
  'Data Protection', 'High', 68
);

-- Create view for comprehensive service overview (replaces the asset-based approach)
CREATE VIEW IF NOT EXISTS service_overview AS
SELECT 
  s.service_id,
  s.name as service_name,
  s.service_category,
  s.business_department,
  s.criticality,
  s.criticality_score,
  s.ai_confidence,
  s.business_function,
  s.recovery_time_objective,
  s.recovery_point_objective,
  s.service_availability_target,
  s.service_status,
  
  -- Dependency counts
  (SELECT COUNT(*) FROM service_asset_links sal WHERE sal.service_id = s.service_id) as asset_dependencies,
  (SELECT COUNT(*) FROM service_asset_links sal 
   JOIN assets_enhanced ae ON sal.asset_id = ae.asset_id 
   WHERE sal.service_id = s.service_id AND ae.criticality = 'Critical') as critical_asset_dependencies,
  
  -- Risk associations
  (SELECT COUNT(*) FROM service_risk_links srl WHERE srl.service_id = s.service_id) as associated_risks,
  (SELECT COUNT(*) FROM service_risk_links srl 
   JOIN risks r ON srl.risk_id = r.id 
   WHERE srl.service_id = s.service_id AND r.severity IN ('High', 'Critical')) as high_severity_risks,
  
  -- Latest AI assessment
  sca.criticality_score as latest_ai_score,
  sca.confidence_level as latest_ai_confidence,
  sca.last_assessment as latest_assessment_date,
  
  s.created_at,
  s.updated_at

FROM services s
LEFT JOIN service_criticality_assessments sca ON s.service_id = sca.service_id 
  AND sca.id = (SELECT id FROM service_criticality_assessments WHERE service_id = s.service_id ORDER BY created_at DESC LIMIT 1)
WHERE s.service_status = 'Active'
ORDER BY s.criticality_score DESC, s.name;