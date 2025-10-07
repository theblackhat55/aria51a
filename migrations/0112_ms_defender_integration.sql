-- Microsoft Defender Integration Database Schema
-- This migration creates comprehensive tables for MS Defender integration
-- including assets, incidents, vulnerabilities, and their relationships

-- Enhanced Defender Assets Table
CREATE TABLE IF NOT EXISTS defender_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  machine_id TEXT UNIQUE NOT NULL, -- MS Defender machine ID
  device_name TEXT NOT NULL,
  computer_dns_name TEXT,
  os_platform TEXT,
  os_version TEXT,
  os_processor TEXT,
  version TEXT, -- Defender agent version
  last_ip_address TEXT,
  last_external_ip_address TEXT,
  health_status TEXT, -- Active, Inactive, ImpairedCommunication, etc.
  device_value TEXT, -- Normal, Low, High
  risk_score INTEGER DEFAULT 0, -- 0-100 risk score
  exposure_level TEXT, -- None, Low, Medium, High
  aad_device_id TEXT,
  machine_tags TEXT, -- JSON array of tags
  defect_mitigation_status TEXT,
  rbac_group_id INTEGER,
  rbac_group_name TEXT,
  first_seen DATETIME,
  last_seen DATETIME,
  onboarding_status TEXT,
  sensor_health_state TEXT,
  is_aad_joined BOOLEAN DEFAULT 0,
  is_isolated BOOLEAN DEFAULT 0,
  network_adapters TEXT, -- JSON array of network adapters
  
  -- Asset linking to existing assets table
  asset_id INTEGER,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_sync DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

-- Defender Incidents Table
CREATE TABLE IF NOT EXISTS defender_incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  incident_id TEXT UNIQUE NOT NULL, -- MS Defender incident ID
  redirect_incident_id TEXT,
  incident_name TEXT NOT NULL,
  severity TEXT NOT NULL, -- Informational, Low, Medium, High
  status TEXT NOT NULL, -- Active, InProgress, Resolved, Redirected
  classification TEXT, -- TruePosititive, Benign, FalsePosititive
  determination TEXT, -- Malware, Phishing, etc.
  assigned_to TEXT,
  tags TEXT, -- JSON array of tags
  
  -- Investigation details
  investigation_id TEXT,
  investigation_state TEXT,
  
  -- Timing
  created_time DATETIME NOT NULL,
  last_update_time DATETIME NOT NULL,
  resolved_time DATETIME,
  
  -- Asset relationships
  machine_ids TEXT, -- JSON array of machine IDs involved
  
  -- Evidence and alerts count
  alerts_count INTEGER DEFAULT 0,
  entities_count INTEGER DEFAULT 0,
  
  -- Description and additional info
  description TEXT,
  comments TEXT, -- JSON array of comments
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_sync DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Defender Vulnerabilities Table  
CREATE TABLE IF NOT EXISTS defender_vulnerabilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vulnerability_id TEXT UNIQUE NOT NULL, -- CVE ID or MS Defender vuln ID
  cve_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  severity_level TEXT, -- Critical, High, Medium, Low
  cvss_v3_score REAL,
  cvss_vector TEXT,
  
  -- Vulnerability details
  category TEXT,
  family TEXT,
  tags TEXT, -- JSON array of tags
  
  -- Impact assessment  
  exploitability_level TEXT, -- None, Low, Medium, High
  threat_name TEXT,
  public_exploit BOOLEAN DEFAULT 0,
  active_alert BOOLEAN DEFAULT 0,
  
  -- Remediation information
  remediation_type TEXT, -- SecurityUpdate, ConfigurationChange, etc.
  fix_available BOOLEAN DEFAULT 0,
  vendor_fix_available BOOLEAN DEFAULT 0,
  
  -- Exposure statistics
  exposed_machines_count INTEGER DEFAULT 0,
  
  -- Discovery and timing
  published_on DATETIME,
  updated_on DATETIME,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_sync DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Asset-Incident Relationship Table
CREATE TABLE IF NOT EXISTS asset_incidents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL, -- Reference to assets_enhanced
  defender_asset_id INTEGER, -- Reference to defender_assets
  incident_id INTEGER NOT NULL, -- Reference to defender_incidents
  machine_id TEXT, -- MS Defender machine ID for direct reference
  
  -- Involvement details
  involvement_type TEXT, -- Primary, Secondary, Related
  alert_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  FOREIGN KEY (defender_asset_id) REFERENCES defender_assets(id) ON DELETE CASCADE,
  FOREIGN KEY (incident_id) REFERENCES defender_incidents(id) ON DELETE CASCADE
);

-- Asset-Vulnerability Relationship Table
CREATE TABLE IF NOT EXISTS asset_vulnerabilities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_id INTEGER NOT NULL, -- Reference to assets_enhanced
  defender_asset_id INTEGER, -- Reference to defender_assets  
  vulnerability_id INTEGER NOT NULL, -- Reference to defender_vulnerabilities
  machine_id TEXT, -- MS Defender machine ID for direct reference
  
  -- Vulnerability status on this asset
  remediation_status TEXT, -- None, InProgress, Completed, Exception
  remediation_type TEXT,
  fix_available BOOLEAN DEFAULT 0,
  
  -- Discovery details
  first_detected DATETIME,
  last_seen DATETIME,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  FOREIGN KEY (defender_asset_id) REFERENCES defender_assets(id) ON DELETE CASCADE,
  FOREIGN KEY (vulnerability_id) REFERENCES defender_vulnerabilities(id) ON DELETE CASCADE
);

-- Defender Advanced Hunting Queries Table
CREATE TABLE IF NOT EXISTS defender_hunting_queries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_name TEXT NOT NULL,
  query_description TEXT,
  kql_query TEXT NOT NULL,
  query_category TEXT, -- Threat Hunting, Asset Discovery, Incident Investigation
  
  -- Query metadata
  created_by INTEGER,
  is_favorite BOOLEAN DEFAULT 0,
  is_shared BOOLEAN DEFAULT 0,
  execution_count INTEGER DEFAULT 0,
  last_executed DATETIME,
  
  -- Query results caching
  last_results TEXT, -- JSON results from last execution
  results_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Defender API Configuration Table
CREATE TABLE IF NOT EXISTS defender_api_config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  client_id TEXT NOT NULL,
  client_secret TEXT, -- Encrypted
  certificate_path TEXT,
  
  -- API endpoints and scopes
  authority TEXT DEFAULT 'https://login.microsoftonline.com/',
  scope TEXT DEFAULT 'https://api.securitycenter.microsoft.com/.default',
  api_base_url TEXT DEFAULT 'https://api.securitycenter.microsoft.com/api/',
  
  -- Connection status
  is_active BOOLEAN DEFAULT 1,
  last_auth_success DATETIME,
  last_auth_error TEXT,
  access_token TEXT, -- Encrypted, temporary storage
  token_expires_at DATETIME,
  
  -- Sync configuration
  auto_sync_enabled BOOLEAN DEFAULT 1,
  sync_interval_minutes INTEGER DEFAULT 30,
  last_sync_assets DATETIME,
  last_sync_incidents DATETIME,
  last_sync_vulnerabilities DATETIME,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Defender Sync Logs Table for monitoring
CREATE TABLE IF NOT EXISTS defender_sync_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sync_type TEXT NOT NULL, -- assets, incidents, vulnerabilities, hunting
  status TEXT NOT NULL, -- success, error, partial
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  
  -- Error details
  error_message TEXT,
  error_details TEXT,
  
  -- Performance metrics
  execution_time_ms INTEGER,
  api_calls_made INTEGER DEFAULT 0,
  
  -- Timestamps
  started_at DATETIME NOT NULL,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_defender_assets_machine_id ON defender_assets(machine_id);
CREATE INDEX IF NOT EXISTS idx_defender_assets_last_seen ON defender_assets(last_seen);
CREATE INDEX IF NOT EXISTS idx_defender_assets_health_status ON defender_assets(health_status);

CREATE INDEX IF NOT EXISTS idx_defender_incidents_incident_id ON defender_incidents(incident_id);
CREATE INDEX IF NOT EXISTS idx_defender_incidents_severity ON defender_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_defender_incidents_status ON defender_incidents(status);
CREATE INDEX IF NOT EXISTS idx_defender_incidents_created_time ON defender_incidents(created_time);

CREATE INDEX IF NOT EXISTS idx_defender_vulnerabilities_cve_id ON defender_vulnerabilities(cve_id);
CREATE INDEX IF NOT EXISTS idx_defender_vulnerabilities_severity ON defender_vulnerabilities(severity_level);
CREATE INDEX IF NOT EXISTS idx_defender_vulnerabilities_cvss_score ON defender_vulnerabilities(cvss_v3_score);

CREATE INDEX IF NOT EXISTS idx_asset_incidents_asset_id ON asset_incidents(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_incidents_incident_id ON asset_incidents(incident_id);
CREATE INDEX IF NOT EXISTS idx_asset_incidents_machine_id ON asset_incidents(machine_id);

CREATE INDEX IF NOT EXISTS idx_asset_vulnerabilities_asset_id ON asset_vulnerabilities(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_vulnerabilities_vulnerability_id ON asset_vulnerabilities(vulnerability_id);
CREATE INDEX IF NOT EXISTS idx_asset_vulnerabilities_machine_id ON asset_vulnerabilities(machine_id);

-- Insert sample MS Defender data for testing and demonstration

-- Sample Defender API Configuration
INSERT OR IGNORE INTO defender_api_config (
  tenant_id, 
  client_id, 
  client_secret,
  is_active,
  auto_sync_enabled,
  sync_interval_minutes,
  last_auth_success
) VALUES (
  'your-tenant-id-here',
  'your-client-id-here', 
  'your-encrypted-secret-here',
  1,
  1,
  30,
  datetime('now')
);

-- Sample Defender Assets
INSERT OR IGNORE INTO defender_assets (
  machine_id, device_name, computer_dns_name, os_platform, os_version,
  last_ip_address, health_status, device_value, risk_score, exposure_level,
  first_seen, last_seen, onboarding_status, sensor_health_state
) VALUES
  ('machine-001-defender', 'WS-DC-001', 'ws-dc-001.contoso.com', 'Windows10', '10.0.19042.1348', 
   '192.168.1.100', 'Active', 'Normal', 75, 'Medium',
   datetime('now', '-30 days'), datetime('now', '-1 hour'), 'Onboarded', 'Active'),
   
  ('machine-002-defender', 'WS-SRV-001', 'ws-srv-001.contoso.com', 'WindowsServer2019', '10.0.17763.2300',
   '192.168.1.200', 'Active', 'High', 45, 'Low', 
   datetime('now', '-25 days'), datetime('now', '-30 minutes'), 'Onboarded', 'Active'),
   
  ('machine-003-defender', 'WS-LAP-001', 'ws-lap-001.contoso.com', 'Windows11', '10.0.22000.318',
   '192.168.1.150', 'ImpairedCommunication', 'Normal', 85, 'High',
   datetime('now', '-20 days'), datetime('now', '-2 hours'), 'Onboarded', 'ImpairedCommunication'),
   
  ('machine-004-defender', 'LNX-SRV-001', 'lnx-srv-001.contoso.com', 'Linux', 'Ubuntu 20.04.3 LTS',
   '192.168.1.210', 'Active', 'High', 30, 'Low',
   datetime('now', '-15 days'), datetime('now', '-15 minutes'), 'Onboarded', 'Active'),
   
  ('machine-005-defender', 'MAC-WS-001', 'mac-ws-001.contoso.com', 'macOS', '12.0.1',
   '192.168.1.160', 'Active', 'Normal', 60, 'Medium',
   datetime('now', '-10 days'), datetime('now', '-45 minutes'), 'Onboarded', 'Active');

-- Sample Defender Incidents
INSERT OR IGNORE INTO defender_incidents (
  incident_id, incident_name, severity, status, classification,
  created_time, last_update_time, machine_ids, alerts_count, description
) VALUES
  ('incident-001', 'Suspicious PowerShell Activity Detected', 'High', 'Active', 'TruePositive',
   datetime('now', '-2 days'), datetime('now', '-1 hour'), 
   '["machine-001-defender", "machine-003-defender"]', 3,
   'Multiple machines showing suspicious PowerShell execution patterns indicative of potential malware activity.'),
   
  ('incident-002', 'Phishing Email Campaign Detection', 'Medium', 'InProgress', 'TruePositive', 
   datetime('now', '-1 day'), datetime('now', '-30 minutes'),
   '["machine-002-defender", "machine-005-defender"]', 2,
   'Email-based attack campaign detected with malicious attachments targeting multiple users.'),
   
  ('incident-003', 'Ransomware Behavior Pattern', 'Critical', 'Active', 'TruePositive',
   datetime('now', '-6 hours'), datetime('now', '-15 minutes'),
   '["machine-003-defender"]', 5,
   'File encryption behavior and suspicious network activity consistent with ransomware attack.'),
   
  ('incident-004', 'Credential Theft Attempt', 'High', 'Resolved', 'TruePositive',
   datetime('now', '-3 days'), datetime('now', '-12 hours'),
   '["machine-001-defender", "machine-004-defender"]', 4,
   'Attempted credential harvesting detected and blocked. Investigation completed.'),
   
  ('incident-005', 'Network Reconnaissance Activity', 'Medium', 'Active', 'TruePositive',
   datetime('now', '-8 hours'), datetime('now', '-20 minutes'),
   '["machine-004-defender"]', 2,
   'Suspicious network scanning activity detected from Linux server.');

-- Sample Defender Vulnerabilities
INSERT OR IGNORE INTO defender_vulnerabilities (
  vulnerability_id, cve_id, name, description, severity_level, cvss_v3_score,
  exploitability_level, public_exploit, active_alert, exposed_machines_count,
  published_on, updated_on
) VALUES
  ('vuln-001', 'CVE-2021-44228', 'Apache Log4j Remote Code Execution', 
   'A flaw was found in the Apache Log4j logging library in versions from 2.0.0 and before 2.15.0.', 
   'Critical', 10.0, 'High', 1, 1, 2,
   datetime('2021-12-09'), datetime('now', '-1 day')),
   
  ('vuln-002', 'CVE-2021-34527', 'Windows Print Spooler Remote Code Execution Vulnerability',
   'A remote code execution vulnerability exists when the Windows Print Spooler service improperly performs privileged file operations.',
   'Critical', 8.8, 'Medium', 1, 0, 3,
   datetime('2021-07-01'), datetime('now', '-2 days')),
   
  ('vuln-003', 'CVE-2021-26855', 'Microsoft Exchange Server Remote Code Execution Vulnerability',
   'A remote code execution vulnerability exists in Microsoft Exchange Server when the server fails to properly validate cmdlet arguments.',
   'Critical', 9.8, 'High', 1, 1, 1,
   datetime('2021-03-02'), datetime('now', '-3 days')),
   
  ('vuln-004', 'CVE-2021-1675', 'Windows Print Spooler Elevation of Privilege Vulnerability',
   'An elevation of privilege vulnerability exists when the Windows Print Spooler service improperly allows arbitrary writing to the file system.',
   'High', 7.3, 'Low', 0, 0, 2,
   datetime('2021-06-08'), datetime('now', '-1 week')),
   
  ('vuln-005', 'CVE-2021-40444', 'Microsoft MSHTML Remote Code Execution Vulnerability',
   'A remote code execution vulnerability exists when MSHTML uses the ActiveX control in an unsafe manner.',
   'High', 8.8, 'Medium', 1, 0, 4,
   datetime('2021-09-07'), datetime('now', '-5 days'));

-- Sample Asset-Incident Relationships
INSERT OR IGNORE INTO asset_incidents (
  asset_id, incident_id, machine_id, involvement_type, alert_count
) VALUES
  (1, 1, 'machine-001-defender', 'Primary', 2),
  (3, 1, 'machine-003-defender', 'Secondary', 1),
  (2, 2, 'machine-002-defender', 'Primary', 1),
  (5, 2, 'machine-005-defender', 'Secondary', 1),
  (3, 3, 'machine-003-defender', 'Primary', 5),
  (1, 4, 'machine-001-defender', 'Primary', 2),
  (4, 4, 'machine-004-defender', 'Related', 2),
  (4, 5, 'machine-004-defender', 'Primary', 2);

-- Sample Asset-Vulnerability Relationships  
INSERT OR IGNORE INTO asset_vulnerabilities (
  asset_id, vulnerability_id, machine_id, remediation_status, 
  first_detected, last_seen
) VALUES
  (2, 1, 'machine-002-defender', 'InProgress', datetime('now', '-5 days'), datetime('now', '-1 hour')),
  (4, 1, 'machine-004-defender', 'Completed', datetime('now', '-5 days'), datetime('now', '-2 days')),
  (1, 2, 'machine-001-defender', 'None', datetime('now', '-10 days'), datetime('now', '-1 hour')),
  (2, 2, 'machine-002-defender', 'InProgress', datetime('now', '-10 days'), datetime('now', '-30 minutes')),
  (3, 2, 'machine-003-defender', 'None', datetime('now', '-8 days'), datetime('now', '-2 hours')),
  (2, 3, 'machine-002-defender', 'Completed', datetime('now', '-15 days'), datetime('now', '-1 week')),
  (1, 4, 'machine-001-defender', 'InProgress', datetime('now', '-12 days'), datetime('now', '-1 hour')),
  (3, 4, 'machine-003-defender', 'None', datetime('now', '-10 days'), datetime('now', '-2 hours')),
  (1, 5, 'machine-001-defender', 'None', datetime('now', '-8 days'), datetime('now', '-1 hour')),
  (2, 5, 'machine-002-defender', 'InProgress', datetime('now', '-8 days'), datetime('now', '-30 minutes')),
  (3, 5, 'machine-003-defender', 'None', datetime('now', '-6 days'), datetime('now', '-2 hours')),
  (5, 5, 'machine-005-defender', 'None', datetime('now', '-7 days'), datetime('now', '-45 minutes'));

-- Sample Advanced Hunting Queries
INSERT OR IGNORE INTO defender_hunting_queries (
  query_name, query_description, kql_query, query_category, created_by, is_favorite
) VALUES
  ('High Risk Machines', 
   'Find machines with high risk scores and recent security events',
   'DeviceInfo | where RiskScore > 70 | join (AlertInfo | where TimeGenerated > ago(7d)) on DeviceId',
   'Threat Hunting', 1, 1),
   
  ('PowerShell Execution Analysis',
   'Analyze PowerShell execution patterns for suspicious activity',
   'DeviceProcessEvents | where ProcessCommandLine contains "powershell" | where TimeGenerated > ago(24h) | summarize count() by DeviceId, ProcessCommandLine',
   'Threat Hunting', 1, 0),
   
  ('Vulnerability Assessment Summary',
   'Get summary of vulnerabilities by severity across all devices',
   'DeviceTvmSoftwareVulnerabilities | summarize VulnCount = count() by SeverityLevel, DeviceId | order by SeverityLevel desc',
   'Asset Discovery', 1, 1),
   
  ('Recent Incident Timeline',
   'Timeline of incidents and alerts in the last 48 hours',
   'AlertInfo | where TimeGenerated > ago(2d) | project TimeGenerated, AlertId, Title, Severity, Category | order by TimeGenerated desc',
   'Incident Investigation', 1, 0),
   
  ('Network Communication Patterns',
   'Analyze network connections for suspicious patterns',
   'DeviceNetworkEvents | where TimeGenerated > ago(24h) | summarize ConnectionCount = count() by DeviceId, RemoteIP | where ConnectionCount > 100',
   'Threat Hunting', 1, 0);

-- Sample sync log entries
INSERT OR IGNORE INTO defender_sync_logs (
  sync_type, status, records_processed, records_created, records_updated,
  started_at, completed_at, execution_time_ms, api_calls_made
) VALUES
  ('assets', 'success', 25, 5, 20, datetime('now', '-2 hours'), datetime('now', '-2 hours', '+5 minutes'), 45000, 3),
  ('incidents', 'success', 12, 3, 9, datetime('now', '-1 hour'), datetime('now', '-1 hour', '+2 minutes'), 18000, 2),
  ('vulnerabilities', 'partial', 150, 15, 120, datetime('now', '-30 minutes'), datetime('now', '-25 minutes'), 120000, 8);

-- Migration completed successfully