-- Enhanced Enterprise Schema Migration
-- Assets, Services, Microsoft Integrations, and Enhanced Risk Management

-- Services table (IT Services, Business Services)
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  service_type TEXT NOT NULL CHECK (service_type IN ('infrastructure', 'application', 'database', 'network', 'business_process')),
  criticality TEXT NOT NULL CHECK (criticality IN ('critical', 'high', 'medium', 'low')) DEFAULT 'medium',
  service_owner_id INTEGER,
  business_owner_id INTEGER,
  organization_id INTEGER NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'maintenance', 'deprecated')) DEFAULT 'active',
  risk_rating REAL DEFAULT 0.0, -- Calculated risk rating based on linked assets and incidents
  availability_requirement REAL DEFAULT 99.0, -- SLA requirement
  recovery_time_objective INTEGER, -- RTO in minutes
  recovery_point_objective INTEGER, -- RPO in minutes
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_owner_id) REFERENCES users(id),
  FOREIGN KEY (business_owner_id) REFERENCES users(id),
  FOREIGN KEY (organization_id) REFERENCES organizations(id)
);

-- Assets table (IT Assets from Microsoft Defender)
CREATE TABLE IF NOT EXISTS assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id TEXT UNIQUE NOT NULL, -- Microsoft Defender device ID
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('device', 'server', 'workstation', 'mobile', 'network_device', 'iot', 'cloud_resource')),
  operating_system TEXT,
  ip_address TEXT,
  mac_address TEXT,
  domain TEXT,
  last_seen DATETIME,
  risk_score REAL DEFAULT 0.0, -- Microsoft Defender risk score
  exposure_level TEXT CHECK (exposure_level IN ('low', 'medium', 'high', 'critical')),
  device_tags TEXT, -- JSON array of tags from Defender
  compliance_status TEXT CHECK (compliance_status IN ('compliant', 'non_compliant', 'unknown')),
  organization_id INTEGER NOT NULL,
  service_id INTEGER, -- Linked service
  owner_id INTEGER,
  location TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_sync DATETIME, -- Last sync from Microsoft Defender
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Microsoft Defender Incidents (imported from Graph API)
CREATE TABLE IF NOT EXISTS defender_incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id TEXT UNIQUE NOT NULL, -- Microsoft incident ID
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT CHECK (severity IN ('informational', 'low', 'medium', 'high')) DEFAULT 'low',
  status TEXT CHECK (status IN ('active', 'resolved', 'in_progress', 'new')) DEFAULT 'new',
  classification TEXT, -- TruePositive, FalsePositive, etc.
  determination TEXT, -- Malware, Phishing, etc.
  created_datetime DATETIME,
  last_update_datetime DATETIME,
  assigned_to TEXT,
  tags TEXT, -- JSON array
  comments TEXT, -- JSON array of comments
  evidence TEXT, -- JSON array of evidence
  alerts_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_sync DATETIME
);

-- Link assets to defender incidents
CREATE TABLE IF NOT EXISTS asset_incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL,
  incident_id INTEGER NOT NULL,
  defender_incident_id INTEGER,
  impact_level TEXT CHECK (impact_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'low',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (incident_id) REFERENCES incidents(id),
  FOREIGN KEY (defender_incident_id) REFERENCES defender_incidents(id),
  UNIQUE(asset_id, incident_id)
);

-- Service dependencies
CREATE TABLE IF NOT EXISTS service_dependencies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id INTEGER NOT NULL,
  depends_on_service_id INTEGER NOT NULL,
  dependency_type TEXT CHECK (dependency_type IN ('critical', 'important', 'optional')) DEFAULT 'important',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (depends_on_service_id) REFERENCES services(id),
  UNIQUE(service_id, depends_on_service_id)
);

-- Microsoft integration configuration
CREATE TABLE IF NOT EXISTS microsoft_integration_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  client_secret TEXT NOT NULL, -- Encrypted
  redirect_uri TEXT NOT NULL,
  scopes TEXT NOT NULL, -- JSON array of required scopes
  last_sync DATETIME,
  sync_enabled BOOLEAN DEFAULT 1,
  sync_frequency INTEGER DEFAULT 3600, -- seconds
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- SAML configuration for Microsoft Entra ID
CREATE TABLE IF NOT EXISTS saml_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_name TEXT NOT NULL DEFAULT 'Microsoft Entra ID',
  entity_id TEXT NOT NULL,
  sso_url TEXT NOT NULL,
  x509_certificate TEXT NOT NULL,
  binding_type TEXT DEFAULT 'HTTP-POST',
  name_id_format TEXT DEFAULT 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
  attribute_mapping TEXT, -- JSON mapping of SAML attributes to user fields
  enabled BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced risk-asset relationships
CREATE TABLE IF NOT EXISTS risk_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  asset_id INTEGER NOT NULL,
  impact_level TEXT CHECK (impact_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (risk_id) REFERENCES risks(id),
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  UNIQUE(risk_id, asset_id)
);

-- Enhanced risk-service relationships
CREATE TABLE IF NOT EXISTS risk_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  risk_id INTEGER NOT NULL,
  service_id INTEGER NOT NULL,
  impact_level TEXT CHECK (impact_level IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (risk_id) REFERENCES risks(id),
  FOREIGN KEY (service_id) REFERENCES services(id),
  UNIQUE(risk_id, service_id)
);

-- Add new columns to existing risks table for enhanced risk management
ALTER TABLE risks ADD COLUMN asset_based_category TEXT;
ALTER TABLE risks ADD COLUMN service_risk_rating REAL DEFAULT 0.0;
ALTER TABLE risks ADD COLUMN automated_risk_score REAL DEFAULT 0.0;
ALTER TABLE risks ADD COLUMN defender_incident_count INTEGER DEFAULT 0;

-- Add new columns to users table for SAML integration
ALTER TABLE users ADD COLUMN saml_user_id TEXT;
ALTER TABLE users ADD COLUMN auth_provider TEXT DEFAULT 'local' CHECK (auth_provider IN ('local', 'saml', 'oauth'));
ALTER TABLE users ADD COLUMN last_saml_login DATETIME;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assets_service_id ON assets(service_id);
CREATE INDEX IF NOT EXISTS idx_assets_organization_id ON assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_risk_score ON assets(risk_score);
CREATE INDEX IF NOT EXISTS idx_services_organization_id ON services(organization_id);
CREATE INDEX IF NOT EXISTS idx_services_criticality ON services(criticality);
CREATE INDEX IF NOT EXISTS idx_defender_incidents_severity ON defender_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_defender_incidents_status ON defender_incidents(status);
CREATE INDEX IF NOT EXISTS idx_asset_incidents_asset_id ON asset_incidents(asset_id);
CREATE INDEX IF NOT EXISTS idx_risk_assets_risk_id ON risk_assets(risk_id);
CREATE INDEX IF NOT EXISTS idx_risk_services_service_id ON risk_services(service_id);
CREATE INDEX IF NOT EXISTS idx_users_saml_user_id ON users(saml_user_id);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);