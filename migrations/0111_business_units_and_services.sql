-- Business Units and Services Integration Migration
-- This migration creates native business units and services management

-- Create business_units table for organization structure management
CREATE TABLE IF NOT EXISTS business_units (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  parent_id INTEGER,
  head_of_unit TEXT,
  email TEXT,
  phone TEXT,
  location TEXT,
  risk_tolerance TEXT CHECK (risk_tolerance IN ('low', 'medium', 'high')) DEFAULT 'medium',
  compliance_requirements TEXT, -- JSON array of applicable frameworks
  budget_allocation DECIMAL(15,2),
  employee_count INTEGER DEFAULT 0,
  status TEXT CHECK (status IN ('active', 'inactive', 'restructuring')) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  FOREIGN KEY (parent_id) REFERENCES business_units(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create services table to replace critical_systems with proper service management
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  service_type TEXT CHECK (service_type IN (
    'application', 'database', 'infrastructure', 'network', 
    'security', 'backup', 'monitoring', 'communication', 'other'
  )) DEFAULT 'application',
  criticality TEXT CHECK (criticality IN ('low', 'medium', 'high', 'critical')) NOT NULL DEFAULT 'medium',
  availability_requirement TEXT CHECK (availability_requirement IN ('99%', '99.5%', '99.9%', '99.95%', '99.99%')) DEFAULT '99%',
  business_unit_id INTEGER,
  owner_id INTEGER,
  technical_contact_id INTEGER,
  vendor TEXT,
  version TEXT,
  environment TEXT CHECK (environment IN ('production', 'staging', 'development', 'testing')) DEFAULT 'production',
  data_classification TEXT CHECK (data_classification IN ('public', 'internal', 'confidential', 'restricted')) DEFAULT 'internal',
  compliance_frameworks TEXT, -- JSON array of applicable frameworks
  risk_score DECIMAL(3,2) DEFAULT 0.00,
  last_assessment_date DATE,
  next_assessment_due DATE,
  backup_frequency TEXT,
  recovery_time_objective INTEGER, -- in minutes
  recovery_point_objective INTEGER, -- in minutes
  monitoring_enabled BOOLEAN DEFAULT TRUE,
  documentation_url TEXT,
  runbook_url TEXT,
  status TEXT CHECK (status IN ('active', 'inactive', 'deprecated', 'maintenance')) DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER,
  FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE SET NULL,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (technical_contact_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create service_dependencies table for service interdependency mapping
CREATE TABLE IF NOT EXISTS service_dependencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id INTEGER NOT NULL,
  depends_on_service_id INTEGER NOT NULL,
  dependency_type TEXT CHECK (dependency_type IN ('critical', 'important', 'optional')) DEFAULT 'important',
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  FOREIGN KEY (depends_on_service_id) REFERENCES services(id) ON DELETE CASCADE,
  UNIQUE(service_id, depends_on_service_id)
);

-- Create business_unit_services mapping table for many-to-many relationship
CREATE TABLE IF NOT EXISTS business_unit_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  business_unit_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  relationship_type TEXT CHECK (relationship_type IN ('primary_owner', 'secondary_owner', 'user', 'stakeholder')) DEFAULT 'user',
  criticality_to_unit TEXT CHECK (criticality_to_unit IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_unit_id) REFERENCES business_units(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  UNIQUE(business_unit_id, service_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_units_parent ON business_units(parent_id);
CREATE INDEX IF NOT EXISTS idx_business_units_status ON business_units(status);
CREATE INDEX IF NOT EXISTS idx_services_business_unit ON services(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_services_owner ON services(owner_id);
CREATE INDEX IF NOT EXISTS idx_services_criticality ON services(criticality);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_service_dependencies_service ON service_dependencies(service_id);
CREATE INDEX IF NOT EXISTS idx_service_dependencies_depends_on ON service_dependencies(depends_on_service_id);
CREATE INDEX IF NOT EXISTS idx_business_unit_services_bu ON business_unit_services(business_unit_id);
CREATE INDEX IF NOT EXISTS idx_business_unit_services_service ON business_unit_services(service_id);

-- Insert default business units
INSERT OR IGNORE INTO business_units (name, description, head_of_unit, email, status) VALUES
('Information Technology', 'IT Department responsible for technology infrastructure and systems', 'IT Director', 'it@company.com', 'active'),
('Security', 'Information Security team responsible for cybersecurity and risk management', 'CISO', 'security@company.com', 'active'),
('Operations', 'Business Operations team managing day-to-day operational activities', 'COO', 'operations@company.com', 'active'),
('Finance', 'Finance Department handling financial operations and reporting', 'CFO', 'finance@company.com', 'active'),
('Human Resources', 'HR Department managing employee relations and organizational development', 'CHRO', 'hr@company.com', 'active'),
('Legal & Compliance', 'Legal team handling regulatory compliance and legal matters', 'General Counsel', 'legal@company.com', 'active');

-- Insert default services (replacing critical_systems)
INSERT OR IGNORE INTO services (name, description, service_type, criticality, business_unit_id, data_classification, compliance_frameworks, status) VALUES
('Active Directory', 'Enterprise directory service for user authentication and authorization', 'infrastructure', 'critical', 1, 'confidential', '["SOX", "PCI-DSS", "GDPR"]', 'active'),
('Email System', 'Corporate email and communication platform', 'communication', 'critical', 1, 'confidential', '["GDPR", "SOX"]', 'active'),
('ERP System', 'Enterprise Resource Planning system for business operations', 'application', 'critical', 3, 'confidential', '["SOX", "GDPR"]', 'active'),
('Database Server', 'Primary database server hosting business-critical data', 'database', 'critical', 1, 'restricted', '["SOX", "PCI-DSS", "HIPAA", "GDPR"]', 'active'),
('Web Application', 'Customer-facing web application and portal', 'application', 'high', 1, 'confidential', '["PCI-DSS", "GDPR"]', 'active'),
('Backup System', 'Enterprise backup and recovery infrastructure', 'backup', 'high', 1, 'confidential', '["SOX", "HIPAA"]', 'active'),
('Network Infrastructure', 'Core networking equipment and connectivity', 'network', 'critical', 1, 'confidential', '["ISO27001", "SOC2"]', 'active'),
('Security Monitoring', 'SIEM and security monitoring platform', 'security', 'critical', 2, 'confidential', '["ISO27001", "SOC2", "NIST"]', 'active'),
('File Server', 'Centralized file storage and sharing system', 'infrastructure', 'medium', 1, 'internal', '["GDPR", "SOX"]', 'active'),
('VPN Gateway', 'Remote access VPN infrastructure', 'network', 'high', 2, 'confidential', '["ISO27001", "SOC2"]', 'active');

-- Insert business unit - service relationships
INSERT OR IGNORE INTO business_unit_services (business_unit_id, service_id, relationship_type, criticality_to_unit) VALUES
-- IT owns most infrastructure services
(1, 1, 'primary_owner', 'critical'),
(1, 2, 'primary_owner', 'critical'),
(1, 4, 'primary_owner', 'critical'),
(1, 5, 'primary_owner', 'high'),
(1, 6, 'primary_owner', 'high'),
(1, 7, 'primary_owner', 'critical'),
(1, 9, 'primary_owner', 'medium'),
-- Security owns security services
(2, 8, 'primary_owner', 'critical'),
(2, 10, 'primary_owner', 'high'),
-- Operations uses ERP and other business systems
(3, 3, 'primary_owner', 'critical'),
(3, 5, 'user', 'high'),
-- Finance uses ERP and database
(4, 3, 'stakeholder', 'critical'),
(4, 4, 'stakeholder', 'critical'),
-- HR uses directory and email
(5, 1, 'user', 'high'),
(5, 2, 'user', 'high');

-- Create service dependencies
INSERT OR IGNORE INTO service_dependencies (service_id, depends_on_service_id, dependency_type, description) VALUES
(2, 1, 'critical', 'Email system requires Active Directory for authentication'),
(5, 4, 'critical', 'Web application requires database server'),
(5, 7, 'critical', 'Web application requires network infrastructure'),
(8, 7, 'important', 'Security monitoring requires network infrastructure'),
(3, 1, 'critical', 'ERP system requires Active Directory for user authentication'),
(3, 4, 'critical', 'ERP system requires database server'),
(10, 7, 'critical', 'VPN Gateway requires network infrastructure');