-- Integration Marketplace Schema
-- Provides extensible integration framework for external vendor integrations

-- Integration Catalog - Available integrations in the marketplace
CREATE TABLE IF NOT EXISTS integration_catalog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  integration_key TEXT UNIQUE NOT NULL, -- Unique identifier (e.g., 'ms-defender', 'servicenow', 'tenable')
  name TEXT NOT NULL,
  vendor TEXT NOT NULL,
  category TEXT NOT NULL, -- 'EDR', 'ITSM', 'Vulnerability', 'SIEM', 'Threat Intelligence', etc.
  description TEXT,
  icon_url TEXT,
  version TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'beta', 'deprecated'
  
  -- Capabilities
  capabilities TEXT, -- JSON array: ['sync_assets', 'sync_vulnerabilities', 'sync_incidents']
  
  -- Configuration
  requires_oauth BOOLEAN DEFAULT 0,
  requires_api_key BOOLEAN DEFAULT 1,
  config_schema TEXT, -- JSON schema for configuration fields
  
  -- Documentation
  documentation_url TEXT,
  setup_instructions TEXT,
  
  -- Metadata
  is_featured BOOLEAN DEFAULT 0,
  install_count INTEGER DEFAULT 0,
  average_rating REAL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Integration Installations - User installations per organization
CREATE TABLE IF NOT EXISTS integration_installations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  integration_key TEXT NOT NULL,
  organization_id INTEGER NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'disabled', 'error'
  is_enabled BOOLEAN DEFAULT 1,
  
  -- Configuration reference (encrypted in KV)
  config_kv_key TEXT, -- Reference to encrypted config in Cloudflare KV
  
  -- Sync Settings
  auto_sync_enabled BOOLEAN DEFAULT 1,
  sync_frequency TEXT DEFAULT 'hourly', -- 'realtime', 'hourly', 'daily', 'manual'
  last_sync_at DATETIME,
  last_sync_status TEXT, -- 'success', 'error', 'partial'
  last_sync_message TEXT,
  next_sync_at DATETIME,
  
  -- Statistics
  total_syncs INTEGER DEFAULT 0,
  successful_syncs INTEGER DEFAULT 0,
  failed_syncs INTEGER DEFAULT 0,
  total_records_synced INTEGER DEFAULT 0,
  
  -- Audit
  installed_by INTEGER NOT NULL,
  installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (integration_key) REFERENCES integration_catalog(integration_key),
  FOREIGN KEY (organization_id) REFERENCES organizations(id),
  FOREIGN KEY (installed_by) REFERENCES users(id),
  UNIQUE(integration_key, organization_id)
);

-- Integration Sync Jobs - Tracks sync operations
CREATE TABLE IF NOT EXISTS integration_sync_jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  installation_id INTEGER NOT NULL,
  
  -- Job Details
  job_type TEXT NOT NULL, -- 'manual', 'scheduled', 'webhook'
  sync_direction TEXT DEFAULT 'pull', -- 'pull', 'push', 'bidirectional'
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
  started_at DATETIME,
  completed_at DATETIME,
  duration_ms INTEGER,
  
  -- Results
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_message TEXT,
  error_details TEXT, -- JSON
  
  -- Metadata
  triggered_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (installation_id) REFERENCES integration_installations(id) ON DELETE CASCADE,
  FOREIGN KEY (triggered_by) REFERENCES users(id)
);

-- Integration Activity Logs - Detailed activity tracking
CREATE TABLE IF NOT EXISTS integration_activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  installation_id INTEGER NOT NULL,
  
  -- Activity Details
  activity_type TEXT NOT NULL, -- 'sync', 'config_update', 'enable', 'disable', 'test_connection'
  action TEXT NOT NULL,
  
  -- Context
  user_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  
  -- Data
  request_data TEXT, -- JSON
  response_data TEXT, -- JSON
  
  -- Status
  status TEXT NOT NULL, -- 'success', 'error', 'warning'
  message TEXT,
  
  -- Timing
  duration_ms INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (installation_id) REFERENCES integration_installations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Integration Data Mappings - Field mapping configuration
CREATE TABLE IF NOT EXISTS integration_data_mappings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  installation_id INTEGER NOT NULL,
  
  -- Mapping Details
  entity_type TEXT NOT NULL, -- 'asset', 'vulnerability', 'incident', 'risk'
  source_field TEXT NOT NULL,
  target_field TEXT NOT NULL,
  
  -- Transformation
  transform_function TEXT, -- Optional: 'uppercase', 'lowercase', 'date_format', etc.
  default_value TEXT,
  is_required BOOLEAN DEFAULT 0,
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (installation_id) REFERENCES integration_installations(id) ON DELETE CASCADE
);

-- Integration Webhooks - Webhook configuration for real-time updates
CREATE TABLE IF NOT EXISTS integration_webhooks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  installation_id INTEGER NOT NULL,
  
  -- Webhook Details
  webhook_url TEXT NOT NULL,
  webhook_secret TEXT NOT NULL, -- For signature verification
  event_types TEXT NOT NULL, -- JSON array: ['asset.created', 'vulnerability.updated']
  
  -- Status
  is_active BOOLEAN DEFAULT 1,
  last_triggered_at DATETIME,
  total_triggers INTEGER DEFAULT 0,
  failed_triggers INTEGER DEFAULT 0,
  
  -- Retry Configuration
  retry_enabled BOOLEAN DEFAULT 1,
  max_retries INTEGER DEFAULT 3,
  retry_delay_seconds INTEGER DEFAULT 60,
  
  -- Metadata
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (installation_id) REFERENCES integration_installations(id) ON DELETE CASCADE
);

-- MS Defender Specific Tables (migrated from existing structure)

-- MS Defender Assets (from Defender devices)
CREATE TABLE IF NOT EXISTS ms_defender_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  installation_id INTEGER NOT NULL,
  
  -- Defender Device Data
  defender_device_id TEXT UNIQUE NOT NULL,
  computer_dns_name TEXT,
  first_seen DATETIME,
  last_seen DATETIME,
  os_platform TEXT,
  os_version TEXT,
  os_build INTEGER,
  last_ip_address TEXT,
  last_external_ip_address TEXT,
  
  -- Health & Risk
  health_status TEXT,
  device_value TEXT,
  risk_score TEXT,
  exposure_level TEXT,
  
  -- Linking
  linked_asset_id INTEGER, -- Link to assets table
  
  -- Metadata
  raw_data TEXT, -- JSON of full Defender response
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (installation_id) REFERENCES integration_installations(id) ON DELETE CASCADE,
  FOREIGN KEY (linked_asset_id) REFERENCES assets(id)
);

-- MS Defender Incidents
CREATE TABLE IF NOT EXISTS ms_defender_incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  installation_id INTEGER NOT NULL,
  
  -- Defender Incident Data
  defender_incident_id INTEGER UNIQUE NOT NULL,
  incident_name TEXT NOT NULL,
  severity TEXT,
  status TEXT,
  classification TEXT,
  determination TEXT,
  assigned_to TEXT,
  
  -- Timing
  created_time DATETIME,
  last_update_time DATETIME,
  
  -- Linking
  linked_incident_id INTEGER, -- Link to incidents table
  linked_risk_id INTEGER, -- Link to risks table
  
  -- Alerts
  alert_count INTEGER DEFAULT 0,
  
  -- Metadata
  tags TEXT, -- JSON array
  raw_data TEXT, -- JSON of full Defender response
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (installation_id) REFERENCES integration_installations(id) ON DELETE CASCADE,
  FOREIGN KEY (linked_incident_id) REFERENCES incidents(id),
  FOREIGN KEY (linked_risk_id) REFERENCES risks(id)
);

-- MS Defender Vulnerabilities
CREATE TABLE IF NOT EXISTS ms_defender_vulnerabilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  installation_id INTEGER NOT NULL,
  
  -- Defender Vulnerability Data
  defender_vuln_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  severity TEXT,
  cvss_v3 REAL,
  
  -- Exposure
  exposed_machines INTEGER DEFAULT 0,
  published_on DATETIME,
  updated_on DATETIME,
  
  -- Exploit Information
  public_exploit BOOLEAN DEFAULT 0,
  exploit_verified BOOLEAN DEFAULT 0,
  exploit_in_kit BOOLEAN DEFAULT 0,
  exploit_types TEXT, -- JSON array
  
  -- Linking
  linked_vulnerability_id INTEGER, -- Link to vulnerabilities table if exists
  linked_risk_id INTEGER, -- Can auto-create risk from vulnerability
  
  -- Metadata
  raw_data TEXT, -- JSON of full Defender response
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (installation_id) REFERENCES integration_installations(id) ON DELETE CASCADE,
  FOREIGN KEY (linked_risk_id) REFERENCES risks(id)
);

-- ServiceNow Specific Tables

-- ServiceNow CMDB Items
CREATE TABLE IF NOT EXISTS servicenow_cmdb_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  installation_id INTEGER NOT NULL,
  
  -- ServiceNow CI Data
  sys_id TEXT UNIQUE NOT NULL,
  ci_class TEXT NOT NULL, -- 'cmdb_ci_server', 'cmdb_ci_network_equipment', etc.
  name TEXT NOT NULL,
  asset_tag TEXT,
  serial_number TEXT,
  
  -- Status
  operational_status TEXT,
  install_status TEXT,
  
  -- Location & Assignment
  location TEXT,
  department TEXT,
  assigned_to TEXT,
  managed_by TEXT,
  
  -- Technical Details
  ip_address TEXT,
  mac_address TEXT,
  os TEXT,
  os_version TEXT,
  
  -- Linking
  linked_asset_id INTEGER, -- Link to assets table
  
  -- Metadata
  raw_data TEXT, -- JSON of full ServiceNow response
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (installation_id) REFERENCES integration_installations(id) ON DELETE CASCADE,
  FOREIGN KEY (linked_asset_id) REFERENCES assets(id)
);

-- ServiceNow Services (from Service Catalogue)
CREATE TABLE IF NOT EXISTS servicenow_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  installation_id INTEGER NOT NULL,
  
  -- ServiceNow Service Data
  sys_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  service_type TEXT,
  
  -- Status
  operational_status TEXT,
  business_criticality TEXT,
  
  -- Ownership
  business_owner TEXT,
  technical_owner TEXT,
  support_group TEXT,
  
  -- SLA
  sla_name TEXT,
  availability_sla REAL, -- Percentage
  
  -- Linking
  linked_service_id INTEGER, -- Link to services table
  
  -- Metadata
  raw_data TEXT, -- JSON of full ServiceNow response
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (installation_id) REFERENCES integration_installations(id) ON DELETE CASCADE,
  FOREIGN KEY (linked_service_id) REFERENCES services(id)
);

-- Tenable.io Specific Tables

-- Tenable Vulnerabilities
CREATE TABLE IF NOT EXISTS tenable_vulnerabilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  installation_id INTEGER NOT NULL,
  
  -- Tenable Vulnerability Data
  plugin_id INTEGER NOT NULL,
  plugin_name TEXT NOT NULL,
  severity_id INTEGER, -- 0=Info, 1=Low, 2=Medium, 3=High, 4=Critical
  severity_name TEXT,
  
  -- CVE & Risk Scoring
  cve TEXT, -- JSON array of CVEs
  cvss_base_score REAL,
  cvss3_base_score REAL,
  vpr_score REAL, -- Vulnerability Priority Rating
  
  -- Asset Context
  asset_uuid TEXT,
  asset_hostname TEXT,
  asset_ip_address TEXT,
  
  -- Vulnerability Details
  description TEXT,
  solution TEXT,
  see_also TEXT, -- Reference URLs
  plugin_publication_date DATETIME,
  plugin_modification_date DATETIME,
  
  -- Detection
  first_found DATETIME,
  last_found DATETIME,
  state TEXT, -- 'OPEN', 'REOPENED', 'FIXED'
  
  -- Proof
  plugin_output TEXT,
  port INTEGER,
  protocol TEXT,
  
  -- Linking
  linked_asset_id INTEGER, -- Link to assets table
  linked_risk_id INTEGER, -- Can auto-create risk from vulnerability
  
  -- Metadata
  raw_data TEXT, -- JSON of full Tenable response
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (installation_id) REFERENCES integration_installations(id) ON DELETE CASCADE,
  FOREIGN KEY (linked_asset_id) REFERENCES assets(id),
  FOREIGN KEY (linked_risk_id) REFERENCES risks(id)
);

-- Tenable Assets
CREATE TABLE IF NOT EXISTS tenable_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  installation_id INTEGER NOT NULL,
  
  -- Tenable Asset Data
  asset_uuid TEXT UNIQUE NOT NULL,
  hostname TEXT,
  fqdn TEXT,
  ipv4 TEXT,
  ipv6 TEXT,
  
  -- Operating System
  operating_system TEXT,
  os_family TEXT,
  
  -- Network
  mac_address TEXT,
  netbios_name TEXT,
  network_id TEXT,
  
  -- Asset Details
  asset_exposure_score INTEGER, -- AES (Asset Exposure Score)
  last_seen DATETIME,
  first_seen DATETIME,
  
  -- Status
  has_agent BOOLEAN DEFAULT 0,
  agent_name TEXT,
  
  -- Tags
  tags TEXT, -- JSON array
  
  -- Linking
  linked_asset_id INTEGER, -- Link to assets table
  
  -- Metadata
  raw_data TEXT, -- JSON of full Tenable response
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (installation_id) REFERENCES integration_installations(id) ON DELETE CASCADE,
  FOREIGN KEY (linked_asset_id) REFERENCES assets(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_integration_installations_org ON integration_installations(organization_id);
CREATE INDEX IF NOT EXISTS idx_integration_installations_key ON integration_installations(integration_key);
CREATE INDEX IF NOT EXISTS idx_integration_sync_jobs_installation ON integration_sync_jobs(installation_id);
CREATE INDEX IF NOT EXISTS idx_integration_activity_logs_installation ON integration_activity_logs(installation_id);
CREATE INDEX IF NOT EXISTS idx_ms_defender_assets_device_id ON ms_defender_assets(defender_device_id);
CREATE INDEX IF NOT EXISTS idx_ms_defender_incidents_incident_id ON ms_defender_incidents(defender_incident_id);
CREATE INDEX IF NOT EXISTS idx_ms_defender_vulnerabilities_vuln_id ON ms_defender_vulnerabilities(defender_vuln_id);
CREATE INDEX IF NOT EXISTS idx_servicenow_cmdb_sys_id ON servicenow_cmdb_items(sys_id);
CREATE INDEX IF NOT EXISTS idx_servicenow_services_sys_id ON servicenow_services(sys_id);
CREATE INDEX IF NOT EXISTS idx_tenable_vulnerabilities_asset ON tenable_vulnerabilities(asset_uuid);
CREATE INDEX IF NOT EXISTS idx_tenable_assets_uuid ON tenable_assets(asset_uuid);

-- Seed initial integration catalog data
INSERT OR IGNORE INTO integration_catalog (integration_key, name, vendor, category, description, capabilities, requires_api_key, config_schema, status, is_featured) VALUES
('ms-defender', 'Microsoft Defender for Endpoint', 'Microsoft', 'EDR', 'Enterprise endpoint detection and response platform with advanced threat protection', '["sync_assets", "sync_vulnerabilities", "sync_incidents", "sync_alerts"]', 1, '{"fields": [{"name": "tenant_id", "label": "Tenant ID", "type": "text", "required": true}, {"name": "client_id", "label": "Client ID", "type": "text", "required": true}, {"name": "client_secret", "label": "Client Secret", "type": "password", "required": true}]}', 'active', 1),

('servicenow', 'ServiceNow ITSM & CMDB', 'ServiceNow', 'ITSM', 'IT Service Management platform with comprehensive CMDB and service catalogue', '["sync_cmdb", "sync_services", "create_incidents", "update_incidents"]', 1, '{"fields": [{"name": "instance_url", "label": "Instance URL", "type": "text", "placeholder": "https://yourinstance.service-now.com", "required": true}, {"name": "username", "label": "Username", "type": "text", "required": true}, {"name": "password", "label": "Password", "type": "password", "required": true}]}', 'active', 1),

('tenable', 'Tenable.io Vulnerability Management', 'Tenable', 'Vulnerability', 'Cloud-based vulnerability assessment and management platform', '["sync_vulnerabilities", "sync_assets", "export_scans", "track_remediation"]', 1, '{"fields": [{"name": "access_key", "label": "Access Key", "type": "text", "required": true}, {"name": "secret_key", "label": "Secret Key", "type": "password", "required": true}]}', 'active', 1);
