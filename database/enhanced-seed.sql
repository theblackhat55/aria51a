-- Enhanced Enterprise Seed Data
-- Services, Assets, and Microsoft Integration test data

-- Insert sample IT services
INSERT OR IGNORE INTO services (service_id, name, description, service_type, criticality, service_owner_id, organization_id, risk_rating, availability_requirement) VALUES 
('SVC-001', 'Customer Portal', 'Main customer-facing web portal', 'application', 'critical', 2, 2, 3.5, 99.9),
('SVC-002', 'Internal CRM', 'Customer relationship management system', 'application', 'high', 3, 1, 2.8, 99.5),
('SVC-003', 'Email Infrastructure', 'Corporate email and collaboration', 'infrastructure', 'critical', 2, 2, 2.2, 99.9),
('SVC-004', 'File Sharing Service', 'Internal document sharing platform', 'application', 'medium', 4, 1, 1.5, 99.0),
('SVC-005', 'Database Cluster', 'Primary production database cluster', 'database', 'critical', 2, 2, 4.2, 99.95);

-- Insert sample assets (simulating Microsoft Defender data)
INSERT OR IGNORE INTO assets (asset_id, name, asset_type, operating_system, ip_address, risk_score, exposure_level, service_id, organization_id, owner_id, device_tags) VALUES 
('DEV-001', 'WEBAPP-SERVER-01', 'server', 'Windows Server 2022', '10.1.1.10', 3.2, 'medium', 1, 2, 2, '["web-server", "production", "critical"]'),
('DEV-002', 'DB-SERVER-01', 'server', 'Ubuntu 22.04 LTS', '10.1.1.15', 4.1, 'high', 5, 2, 2, '["database", "production", "critical"]'),
('DEV-003', 'MAIL-SERVER-01', 'server', 'Windows Server 2022', '10.1.1.20', 2.1, 'low', 3, 2, 2, '["mail-server", "production"]'),
('DEV-004', 'WORKSTATION-001', 'workstation', 'Windows 11 Pro', '10.1.2.50', 1.8, 'low', NULL, 1, 3, '["endpoint", "finance"]'),
('DEV-005', 'FILESERVER-01', 'server', 'Windows Server 2022', '10.1.1.25', 2.5, 'medium', 4, 1, 4, '["file-server", "storage"]');

-- Insert sample Microsoft Defender incidents
INSERT OR IGNORE INTO defender_incidents (incident_id, title, description, severity, status, classification, created_datetime, alerts_count) VALUES 
('INC-2024-001', 'Suspicious PowerShell Activity', 'Detected unusual PowerShell execution on multiple endpoints', 'high', 'active', 'TruePositive', '2024-08-14 10:30:00', 5),
('INC-2024-002', 'Malware Detection', 'Trojan malware detected and quarantined', 'medium', 'resolved', 'TruePositive', '2024-08-13 14:15:00', 2),
('INC-2024-003', 'Phishing Email Campaign', 'Users received suspicious emails with malicious attachments', 'high', 'in_progress', 'TruePositive', '2024-08-14 08:45:00', 8),
('INC-2024-004', 'Failed Login Attempts', 'Multiple failed login attempts detected', 'low', 'resolved', 'FalsePositive', '2024-08-12 16:20:00', 12),
('INC-2024-005', 'Unusual Network Traffic', 'Anomalous network communication patterns detected', 'medium', 'active', 'InProgress', '2024-08-14 12:00:00', 3);

-- Link assets to defender incidents
INSERT OR IGNORE INTO asset_incidents (asset_id, defender_incident_id, impact_level) VALUES 
(1, 1, 'high'),    -- WEBAPP-SERVER-01 affected by PowerShell incident
(2, 1, 'medium'),   -- DB-SERVER-01 affected by PowerShell incident
(4, 2, 'high'),     -- WORKSTATION-001 had malware
(4, 3, 'medium'),   -- WORKSTATION-001 received phishing email
(5, 5, 'low');      -- FILESERVER-01 unusual network traffic

-- Insert service dependencies
INSERT OR IGNORE INTO service_dependencies (service_id, depends_on_service_id, dependency_type) VALUES 
(1, 5, 'critical'),  -- Customer Portal depends on Database Cluster
(1, 3, 'important'), -- Customer Portal depends on Email Infrastructure
(2, 5, 'critical'),  -- Internal CRM depends on Database Cluster
(4, 3, 'optional'); -- File Sharing depends on Email Infrastructure

-- Sample Microsoft integration configuration (with placeholder values)
INSERT OR IGNORE INTO microsoft_integration_config (tenant_id, client_id, client_secret, redirect_uri, scopes, sync_enabled) VALUES 
('00000000-0000-0000-0000-000000000000', 'app-client-id', 'encrypted-client-secret', 'https://your-app.pages.dev/auth/callback', '["SecurityEvents.Read.All", "Device.Read.All", "SecurityIncidents.Read.All"]', 0);

-- Sample SAML configuration (disabled by default)
INSERT OR IGNORE INTO saml_config (entity_id, sso_url, x509_certificate, enabled, attribute_mapping) VALUES 
('https://sts.windows.net/tenant-id/', 'https://login.microsoftonline.com/tenant-id/saml2', 'sample-certificate-placeholder', 0, '{"email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress", "firstName": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname", "lastName": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"}');

-- Link existing risks to assets and services
INSERT OR IGNORE INTO risk_assets (risk_id, asset_id, impact_level) VALUES 
(1, 1, 'high'),     -- Data Breach Risk affects WEBAPP-SERVER-01
(1, 2, 'critical'), -- Data Breach Risk affects DB-SERVER-01
(3, 1, 'medium'),   -- Cloud Service Outage affects WEBAPP-SERVER-01
(3, 5, 'low');      -- Cloud Service Outage affects FILESERVER-01

INSERT OR IGNORE INTO risk_services (risk_id, service_id, impact_level) VALUES 
(1, 1, 'critical'), -- Data Breach Risk affects Customer Portal
(1, 2, 'high'),     -- Data Breach Risk affects Internal CRM
(2, 2, 'high'),     -- GDPR Non-Compliance affects Internal CRM
(3, 1, 'critical'), -- Cloud Service Outage affects Customer Portal
(5, 4, 'medium');   -- Vendor Security Incident affects File Sharing Service

-- Update existing risks with asset-based categorization
UPDATE risks SET 
  asset_based_category = 'infrastructure_security',
  service_risk_rating = 3.5,
  automated_risk_score = 18.0,
  defender_incident_count = 2
WHERE id = 1;

UPDATE risks SET 
  asset_based_category = 'compliance_governance',
  service_risk_rating = 2.8,
  automated_risk_score = 12.0,
  defender_incident_count = 0
WHERE id = 2;

UPDATE risks SET 
  asset_based_category = 'infrastructure_availability',
  service_risk_rating = 3.2,
  automated_risk_score = 8.0,
  defender_incident_count = 1
WHERE id = 3;