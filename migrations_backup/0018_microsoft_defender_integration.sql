-- Microsoft Defender for Endpoint Integration Schema
-- Comprehensive tables for assets, incidents, vulnerabilities and risk scoring

-- Enhanced Microsoft Defender assets table with criticality scoring
CREATE TABLE IF NOT EXISTS defender_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id TEXT UNIQUE NOT NULL, -- Defender device ID
  computer_dns_name TEXT NOT NULL,
  os_platform TEXT NOT NULL,
  os_version TEXT,
  last_ip_address TEXT,
  last_external_ip_address TEXT,
  risk_score TEXT, -- 'None', 'Low', 'Medium', 'High'
  exposure_level TEXT, -- 'None', 'Low', 'Medium', 'High'
  device_value TEXT, -- 'None', 'Low', 'Medium', 'High'
  rbac_group_name TEXT,
  aad_device_id TEXT,
  machine_tags TEXT, -- JSON array
  health_status TEXT,
  onboarding_status TEXT,
  last_seen DATETIME,
  
  -- Enhanced criticality and context
  business_criticality TEXT DEFAULT 'Medium', -- Critical, High, Medium, Low
  asset_type TEXT DEFAULT 'Workstation', -- Server, Workstation, Mobile, IoT
  department TEXT,
  location TEXT,
  asset_owner TEXT,
  compliance_status TEXT DEFAULT 'Unknown',
  
  -- Asset vulnerability summary
  critical_vulnerabilities INTEGER DEFAULT 0,
  high_vulnerabilities INTEGER DEFAULT 0,
  medium_vulnerabilities INTEGER DEFAULT 0,
  low_vulnerabilities INTEGER DEFAULT 0,
  
  -- Calculated risk score based on vulnerabilities and context
  calculated_risk_score REAL DEFAULT 0.0,
  overall_risk_level TEXT DEFAULT 'Low', -- Critical, High, Medium, Low
  
  -- Sync metadata
  synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Microsoft Defender incidents table  
CREATE TABLE IF NOT EXISTS defender_incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id TEXT UNIQUE NOT NULL,
  redirect_incident_id TEXT,
  incident_name TEXT NOT NULL,
  created_time DATETIME NOT NULL,
  last_update_time DATETIME,
  assigned_to TEXT,
  classification TEXT, -- TruePositive, FalsePositive, BenignPositive
  determination TEXT,
  status TEXT, -- Active, Resolved, InProgress
  severity TEXT, -- Informational, Low, Medium, High
  tags TEXT, -- JSON array
  comments TEXT, -- JSON array
  alerts TEXT, -- JSON array of alert details
  
  -- Enhanced incident context
  affected_assets_count INTEGER DEFAULT 0,
  business_impact TEXT DEFAULT 'Low',
  estimated_cost REAL DEFAULT 0.0,
  
  -- Resolution tracking
  resolution_time_hours REAL,
  mean_time_to_detect REAL,
  mean_time_to_respond REAL,
  
  synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Microsoft Defender vulnerabilities table
CREATE TABLE IF NOT EXISTS defender_vulnerabilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vulnerability_id TEXT UNIQUE NOT NULL,
  cve_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT, -- Critical, Important, Moderate, Low
  cvss_score REAL,
  cvss_vector TEXT,
  exploit_available BOOLEAN DEFAULT 0,
  exploit_verified BOOLEAN DEFAULT 0,
  exploit_in_kit BOOLEAN DEFAULT 0,
  public_exploit BOOLEAN DEFAULT 0,
  
  -- Vulnerability details
  affected_software TEXT,
  vendor TEXT,
  product_name TEXT,
  product_version TEXT,
  
  -- Risk assessment
  exposure_count INTEGER DEFAULT 0, -- How many assets are affected
  business_risk_score REAL DEFAULT 0.0,
  remediation_priority TEXT DEFAULT 'Medium',
  
  -- Remediation information
  remediation_type TEXT, -- Update, Configuration, Mitigation
  solution_description TEXT,
  kb_article_id TEXT,
  
  -- Publication details
  published_date DATETIME,
  updated_date DATETIME,
  
  synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Asset-vulnerability relationship table for tracking which vulnerabilities affect which assets
CREATE TABLE IF NOT EXISTS asset_vulnerabilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id TEXT NOT NULL,
  vulnerability_id TEXT NOT NULL,
  
  -- Vulnerability status on this specific asset
  status TEXT DEFAULT 'Active', -- Active, Remediated, Mitigated, Accepted
  detected_date DATETIME,
  remediated_date DATETIME,
  
  -- Asset-specific risk context
  asset_exposure_level TEXT DEFAULT 'Medium',
  remediation_urgency TEXT DEFAULT 'Medium',
  business_justification TEXT,
  
  synced_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (asset_id) REFERENCES defender_assets(asset_id),
  FOREIGN KEY (vulnerability_id) REFERENCES defender_vulnerabilities(vulnerability_id),
  UNIQUE(asset_id, vulnerability_id)
);

-- Microsoft Defender hunting queries for proactive threat detection
CREATE TABLE IF NOT EXISTS defender_hunting_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_name TEXT NOT NULL,
  query_description TEXT,
  kql_query TEXT NOT NULL, -- Kusto Query Language query
  query_category TEXT, -- ThreatHunting, Investigation, Monitoring
  severity_level TEXT DEFAULT 'Medium',
  
  -- Execution tracking
  last_executed DATETIME,
  execution_frequency INTEGER DEFAULT 3600, -- seconds
  is_enabled BOOLEAN DEFAULT 1,
  
  -- Results tracking
  last_result_count INTEGER DEFAULT 0,
  total_detections INTEGER DEFAULT 0,
  
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_defender_assets_risk ON defender_assets(overall_risk_level, calculated_risk_score);
CREATE INDEX IF NOT EXISTS idx_defender_assets_criticality ON defender_assets(business_criticality);
CREATE INDEX IF NOT EXISTS idx_defender_assets_synced ON defender_assets(synced_at);
CREATE INDEX IF NOT EXISTS idx_defender_incidents_severity ON defender_incidents(severity, status);
CREATE INDEX IF NOT EXISTS idx_defender_incidents_created ON defender_incidents(created_at);
CREATE INDEX IF NOT EXISTS idx_defender_vulnerabilities_severity ON defender_vulnerabilities(severity, cvss_score);
CREATE INDEX IF NOT EXISTS idx_defender_vulnerabilities_cve ON defender_vulnerabilities(cve_id);
CREATE INDEX IF NOT EXISTS idx_asset_vulnerabilities_asset ON asset_vulnerabilities(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_vulnerabilities_vuln ON asset_vulnerabilities(vulnerability_id);

-- Insert default Microsoft integration configuration if not exists
INSERT OR IGNORE INTO microsoft_integration_config (
  id, 
  tenant_id, 
  client_id, 
  client_secret, 
  redirect_uri, 
  scopes,
  sync_enabled,
  sync_frequency
) VALUES (
  1,
  '', -- Will be configured by admin
  '', -- Will be configured by admin  
  '', -- Will be configured by admin
  '', -- Will be configured by admin
  '["https://graph.microsoft.com/.default", "https://api.securitycenter.microsoft.com/.default"]',
  0, -- Disabled by default until configured
  3600 -- Sync every hour
);

-- Insert sample hunting queries for Microsoft Defender
INSERT OR IGNORE INTO defender_hunting_queries (query_name, query_description, kql_query, query_category) VALUES
('High Risk Assets Detection', 'Identify assets with high risk scores and multiple vulnerabilities', 
'DeviceInfo
| where RiskScore == "High" 
| join (DeviceTvmSoftwareVulnerabilitiesKB | where VulnerabilitySeverityLevel in ("Critical", "High")) on DeviceId
| summarize VulnCount = count() by DeviceId, DeviceName, OSPlatform
| where VulnCount >= 5
| order by VulnCount desc', 'ThreatHunting'),

('Critical Vulnerability Exposure', 'Find assets exposed to critical vulnerabilities with public exploits',
'DeviceTvmSoftwareVulnerabilitiesKB
| where VulnerabilitySeverityLevel == "Critical" and IsExploitAvailable == true
| join DeviceInfo on DeviceId
| project DeviceName, CveId, VulnerabilityDescription, ExposureScore, DeviceRiskScore
| order by ExposureScore desc', 'Investigation'),

('Incident Response Timeline', 'Track incident response times and resolution patterns',
'AlertInfo
| where Timestamp > ago(30d)
| extend ResponseTime = datetime_diff("hour", ResolvedTime, Timestamp)
| where isnotnull(ResponseTime)
| summarize AvgResponseTime = avg(ResponseTime), IncidentCount = count() by Severity
| order by Severity desc', 'Monitoring');