-- Sample Data for Week 6-7 Features
-- Provides realistic test data for demonstrations

-- ============================================================================
-- SAMPLE TAXII SERVERS
-- ============================================================================

INSERT OR IGNORE INTO taxii_servers (
  id, name, api_root_url, username, password_hash, api_key,
  verify_ssl, is_active, organization_id, created_by
) VALUES
  (1, 'MISP Public TAXII Server',
   'https://misp-project.org/taxii2/', 
   NULL, NULL, NULL, 1, 1, 1, 1),
  (2, 'CIRCL.LU Threat Feeds',
   'https://www.circl.lu/taxii/2.1/', 
   NULL, NULL, NULL, 1, 1, 1, 1),
  (3, 'AlienVault OTX (Demo)',
   'https://otx.alienvault.com/taxii/2.1/', 
   NULL, NULL, 'demo-api-key-not-real', 1, 0, 1, 1);

-- ============================================================================
-- SAMPLE TAXII COLLECTIONS
-- ============================================================================

INSERT OR IGNORE INTO taxii_collections (
  id, taxii_server_id, collection_id, title, description,
  can_read, can_write, media_types, poll_enabled,
  poll_interval_minutes, organization_id
) VALUES
  (1, 1, 'indicators-2024', 'Threat Indicators', 
   'Collection of malware indicators and IOCs from MISP community',
   1, 0, '["application/stix+json;version=2.1"]', 1, 60, 1),
  (2, 1, 'malware-families', 'Malware Information',
   'Malware families and variants from MISP',
   1, 0, '["application/stix+json;version=2.1"]', 1, 60, 1),
  (3, 2, 'apt-reports', 'APT Reports',
   'Advanced Persistent Threat intelligence reports',
   1, 0, '["application/stix+json;version=2.1"]', 1, 120, 1);

-- ============================================================================
-- SAMPLE STIX OBJECTS
-- ============================================================================

INSERT OR IGNORE INTO stix_objects (
  stix_id, stix_type, stix_version, name, description, spec_version,
  created, modified, stix_object, confidence,
  tlp_marking, labels, pattern, pattern_type,
  valid_from, valid_until, severity, organization_id
) VALUES
  ('indicator--8e2e2d2b-17d4-4cbf-938f-98ee46b3cd3f', 'indicator',
   '2.1', 'C2 Server: Known Ransomware Infrastructure',
   'Command and Control server associated with Conti ransomware group',
   '2.1', '2024-10-01T00:00:00Z', '2024-10-01T00:00:00Z',
   '{"type":"indicator","spec_version":"2.1","id":"indicator--8e2e2d2b-17d4-4cbf-938f-98ee46b3cd3f","created":"2024-10-01T00:00:00Z","modified":"2024-10-01T00:00:00Z","name":"C2 Server: Known Ransomware Infrastructure","description":"Command and Control server associated with Conti ransomware group","pattern":"[ipv4-addr:value = ''192.0.2.100'']","pattern_type":"stix","valid_from":"2024-10-01T00:00:00Z","labels":["malicious-activity","ransomware","conti"]}',
   85, 'TLP:AMBER',
   '["malicious-activity", "ransomware", "conti"]',
   '[ipv4-addr:value = ''192.0.2.100'']', 'stix',
   '2024-10-01T00:00:00Z', '2025-12-31T23:59:59Z', 'critical', 1),
  ('indicator--f3d52c7e-4a33-4d3c-a44e-5d3f964b1234', 'indicator',
   '2.1', 'Phishing Domain: Banking Trojan Campaign',
   'Phishing domain used to distribute banking malware',
   '2.1', '2024-10-05T00:00:00Z', '2024-10-05T00:00:00Z',
   '{"type":"indicator","spec_version":"2.1","id":"indicator--f3d52c7e-4a33-4d3c-a44e-5d3f964b1234","created":"2024-10-05T00:00:00Z","modified":"2024-10-05T00:00:00Z","name":"Phishing Domain: Banking Trojan Campaign","description":"Phishing domain used to distribute banking malware","pattern":"[domain-name:value = ''secure-bank-login.example.com'']","pattern_type":"stix","valid_from":"2024-10-05T00:00:00Z","labels":["phishing","banking-trojan"]}',
   75, 'TLP:AMBER',
   '["phishing", "banking-trojan", "malicious-activity"]',
   '[domain-name:value = ''secure-bank-login.example.com'']', 'stix',
   '2024-10-05T00:00:00Z', '2025-12-31T23:59:59Z', 'high', 1),
  ('malware--a1c3e5f7-9b2d-4e6f-8a4b-3d5e7f9c1b2a', 'malware',
   '2.1', 'Emotet', 'Banking trojan and malware loader',
   '2.1', '2024-09-15T00:00:00Z', '2024-09-15T00:00:00Z',
   '{"type":"malware","spec_version":"2.1","id":"malware--a1c3e5f7-9b2d-4e6f-8a4b-3d5e7f9c1b2a","created":"2024-09-15T00:00:00Z","modified":"2024-09-15T00:00:00Z","name":"Emotet","description":"Banking trojan and malware loader","is_family":true,"malware_types":["trojan","loader"]}',
   90, 'TLP:AMBER',
   '["trojan", "banking", "loader"]', NULL, NULL,
   NULL, NULL, 'high', 1),
  ('threat-actor--b5e6d7f9-3c4e-5f6a-7b8c-9d1e2f3a4b5c', 'threat-actor',
   '2.1', 'APT29 / Cozy Bear', 'Russian state-sponsored APT group',
   '2.1', '2024-08-20T00:00:00Z', '2024-08-20T00:00:00Z',
   '{"type":"threat-actor","spec_version":"2.1","id":"threat-actor--b5e6d7f9-3c4e-5f6a-7b8c-9d1e2f3a4b5c","created":"2024-08-20T00:00:00Z","modified":"2024-08-20T00:00:00Z","name":"APT29 / Cozy Bear","description":"Russian state-sponsored APT group","threat_actor_types":["nation-state"],"sophistication":"strategic","resource_level":"government"}',
   95, 'TLP:RED',
   '["apt", "russia", "state-sponsored"]', NULL, NULL,
   NULL, NULL, 'critical', 1),
  ('campaign--c7d8e9f1-4a5b-6c7d-8e9f-1a2b3c4d5e6f', 'campaign',
   '2.1', 'SolarWinds Supply Chain Attack',
   'Large-scale supply chain compromise affecting government and enterprises',
   '2.1', '2024-07-10T00:00:00Z', '2024-07-10T00:00:00Z',
   '{"type":"campaign","spec_version":"2.1","id":"campaign--c7d8e9f1-4a5b-6c7d-8e9f-1a2b3c4d5e6f","created":"2024-07-10T00:00:00Z","modified":"2024-07-10T00:00:00Z","name":"SolarWinds Supply Chain Attack","description":"Large-scale supply chain compromise affecting government and enterprises","first_seen":"2020-03-01T00:00:00Z","objective":"espionage"}',
   100, 'TLP:RED',
   '["supply-chain", "apt", "espionage"]', NULL, NULL,
   NULL, NULL, 'critical', 1);

-- ============================================================================
-- SAMPLE STIX RELATIONSHIPS
-- ============================================================================

INSERT OR IGNORE INTO stix_relationships (
  stix_id, relationship_type, source_ref, target_ref,
  created, modified, description, stix_relationship, organization_id
) VALUES
  ('relationship--1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d', 'indicates',
   'indicator--8e2e2d2b-17d4-4cbf-938f-98ee46b3cd3f',
   'malware--a1c3e5f7-9b2d-4e6f-8a4b-3d5e7f9c1b2a',
   '2024-10-01T00:00:00Z', '2024-10-01T00:00:00Z',
   'This IP address indicates Emotet C2 activity',
   '{"type":"relationship","spec_version":"2.1","id":"relationship--1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d","created":"2024-10-01T00:00:00Z","modified":"2024-10-01T00:00:00Z","relationship_type":"indicates","source_ref":"indicator--8e2e2d2b-17d4-4cbf-938f-98ee46b3cd3f","target_ref":"malware--a1c3e5f7-9b2d-4e6f-8a4b-3d5e7f9c1b2a","description":"This IP address indicates Emotet C2 activity"}', 1),
  ('relationship--2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e', 'attributed-to',
   'campaign--c7d8e9f1-4a5b-6c7d-8e9f-1a2b3c4d5e6f',
   'threat-actor--b5e6d7f9-3c4e-5f6a-7b8c-9d1e2f3a4b5c',
   '2024-07-10T00:00:00Z', '2024-07-10T00:00:00Z',
   'SolarWinds campaign attributed to APT29',
   '{"type":"relationship","spec_version":"2.1","id":"relationship--2b3c4d5e-6f7a-8b9c-0d1e-2f3a4b5c6d7e","created":"2024-07-10T00:00:00Z","modified":"2024-07-10T00:00:00Z","relationship_type":"attributed-to","source_ref":"campaign--c7d8e9f1-4a5b-6c7d-8e9f-1a2b3c4d5e6f","target_ref":"threat-actor--b5e6d7f9-3c4e-5f6a-7b8c-9d1e2f3a4b5c","description":"SolarWinds campaign attributed to APT29"}', 1);

-- ============================================================================
-- SAMPLE IOCS
-- ============================================================================

-- Note: Get stix_object_id after stix_objects insert
-- First IOC is linked to indicator object
INSERT OR IGNORE INTO iocs (
  ioc_type, ioc_value, description, threat_type, confidence, severity,
  first_seen, last_seen, valid_until, source, tags, organization_id, created_by
)
SELECT
  'ip', '192.0.2.100', 'Conti ransomware C2 server', 'c2', 85, 'critical',
  '2024-10-01T00:00:00Z', '2024-10-25T00:00:00Z', '2025-12-31T23:59:59Z',
  'stix', '["ransomware", "conti", "c2"]', 1, 1
WHERE NOT EXISTS (
  SELECT 1 FROM iocs WHERE ioc_type = 'ip' AND ioc_value = '192.0.2.100'
);

-- Second IOC is linked to phishing indicator
INSERT OR IGNORE INTO iocs (
  ioc_type, ioc_value, description, threat_type, confidence, severity,
  first_seen, last_seen, valid_until, source, tags, organization_id, created_by
)
SELECT
  'domain', 'secure-bank-login.example.com', 'Phishing domain for banking trojan', 'phishing', 75, 'high',
  '2024-10-05T00:00:00Z', '2024-10-20T00:00:00Z', '2025-12-31T23:59:59Z',
  'stix', '["phishing", "banking-trojan"]', 1, 1
WHERE NOT EXISTS (
  SELECT 1 FROM iocs WHERE ioc_type = 'domain' AND ioc_value = 'secure-bank-login.example.com'
);

-- Remaining IOCs not linked to STIX objects
INSERT OR IGNORE INTO iocs (
  ioc_type, ioc_value, description, threat_type, confidence, severity,
  first_seen, last_seen, valid_until, source, tags, organization_id, created_by
) VALUES
  ('file_hash', 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2', 'Emotet malware sample SHA256', 'malware', 90, 'critical',
   '2024-09-15T00:00:00Z', '2024-10-15T00:00:00Z', '2025-12-31T23:59:59Z',
   'manual', '["emotet", "malware", "trojan"]', 1, 1),
  ('url', 'http://malicious-update.example.net/payload.exe', 'Malware dropper URL', 'malware', 80, 'high',
   '2024-10-10T00:00:00Z', '2024-10-22T00:00:00Z', '2025-12-31T23:59:59Z',
   'manual', '["malware", "dropper"]', 1, 1),
  ('email', 'phishing@scam-alerts.example.org', 'Known phishing sender address', 'phishing', 70, 'medium',
   '2024-10-08T00:00:00Z', '2024-10-18T00:00:00Z', '2025-12-31T23:59:59Z',
   'manual', '["phishing", "spam"]', 1, 1);

-- Update stix_object_id for linked IOCs
UPDATE iocs SET stix_object_id = (
  SELECT id FROM stix_objects WHERE stix_id = 'indicator--8e2e2d2b-17d4-4cbf-938f-98ee46b3cd3f'
) WHERE ioc_type = 'ip' AND ioc_value = '192.0.2.100';

UPDATE iocs SET stix_object_id = (
  SELECT id FROM stix_objects WHERE stix_id = 'indicator--f3d52c7e-4a33-4d3c-a44e-5d3f964b1234'
) WHERE ioc_type = 'domain' AND ioc_value = 'secure-bank-login.example.com';

-- ============================================================================
-- SAMPLE INCIDENT WORKFLOWS
-- ============================================================================

INSERT OR IGNORE INTO incident_workflows (
  id, name, description, trigger_conditions, workflow_steps,
  is_active, organization_id, created_by,
  created_at, updated_at
) VALUES
  (3, 'Ransomware Incident Response', 
   'Automated response workflow for ransomware attacks - isolate, investigate, and notify',
   '{"severity": ["critical"], "category": ["malware", "ransomware"]}',
   '[
     {"step_type": "notify", "title": "Alert Security Team", "description": "Immediate notification to security team and CISO", "assigned_to": "security-team", "priority": "critical", "due_hours": 0},
     {"step_type": "contain", "title": "Isolate Affected Systems", "description": "Disconnect affected systems from network to prevent spread", "assigned_to": "security-ops", "priority": "critical", "due_hours": 1},
     {"step_type": "investigate", "title": "Forensic Analysis", "description": "Capture memory dumps and analyze infection vector", "assigned_to": "incident-response", "priority": "high", "due_hours": 4},
     {"step_type": "contain", "title": "Block IOCs", "description": "Block all associated IP addresses and domains at firewall", "assigned_to": "network-ops", "priority": "high", "due_hours": 2},
     {"step_type": "remediate", "title": "Restore from Backups", "description": "Restore affected systems from clean backups", "assigned_to": "system-admin", "priority": "high", "due_hours": 24},
     {"step_type": "document", "title": "Incident Report", "description": "Complete incident documentation and lessons learned", "assigned_to": "incident-response", "priority": "medium", "due_hours": 48}
   ]',
   1, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (4, 'Phishing Campaign Response',
   'Response workflow for suspected phishing campaigns targeting employees',
   '{"severity": ["high", "medium"], "category": ["phishing", "social-engineering"]}',
   '[
     {"step_type": "notify", "title": "Alert Email Admin", "description": "Notify email administrators of phishing campaign", "assigned_to": "email-admin", "priority": "high", "due_hours": 1},
     {"step_type": "contain", "title": "Block Sender", "description": "Add sender to email blacklist and quarantine existing messages", "assigned_to": "email-admin", "priority": "high", "due_hours": 2},
     {"step_type": "investigate", "title": "Analyze Phishing Email", "description": "Extract IOCs and analyze payload if present", "assigned_to": "security-analyst", "priority": "high", "due_hours": 4},
     {"step_type": "notify", "title": "User Awareness Alert", "description": "Send company-wide alert about phishing campaign", "assigned_to": "security-team", "priority": "medium", "due_hours": 8},
     {"step_type": "remediate", "title": "Reset Compromised Credentials", "description": "Force password reset for affected users", "assigned_to": "identity-admin", "priority": "high", "due_hours": 12},
     {"step_type": "document", "title": "Update Training", "description": "Add campaign to security awareness training", "assigned_to": "security-training", "priority": "low", "due_hours": 72}
   ]',
   1, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (5, 'DDoS Attack Mitigation',
   'Automated response for Distributed Denial of Service attacks',
   '{"severity": ["critical", "high"], "category": ["ddos", "availability"]}',
   '[
     {"step_type": "notify", "title": "Alert Network Team", "description": "Immediate notification to network operations center", "assigned_to": "network-ops", "priority": "critical", "due_hours": 0},
     {"step_type": "contain", "title": "Enable DDoS Protection", "description": "Activate DDoS mitigation service (Cloudflare, AWS Shield)", "assigned_to": "network-ops", "priority": "critical", "due_hours": 1},
     {"step_type": "investigate", "title": "Traffic Analysis", "description": "Analyze attack patterns and source IPs", "assigned_to": "security-analyst", "priority": "high", "due_hours": 2},
     {"step_type": "contain", "title": "Block Attack Sources", "description": "Implement rate limiting and block malicious IPs", "assigned_to": "network-ops", "priority": "high", "due_hours": 2},
     {"step_type": "notify", "title": "Customer Communication", "description": "Prepare customer communication about service impact", "assigned_to": "customer-success", "priority": "medium", "due_hours": 4},
     {"step_type": "document", "title": "Attack Report", "description": "Document attack timeline and mitigation effectiveness", "assigned_to": "security-team", "priority": "medium", "due_hours": 24}
   ]',
   1, 1, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- ============================================================================
-- SAMPLE INCIDENTS (to trigger workflows)
-- ============================================================================

INSERT OR IGNORE INTO incidents (
  id, title, description, severity, status, type,
  assigned_to, organization_id,
  created_at, updated_at
) VALUES
  (10, 'Suspected Ransomware Activity on File Server',
   'File server showing signs of ransomware encryption. Multiple files with .locked extension detected. Critical business files potentially encrypted. Estimated 500GB affected.',
   'critical', 'open', 'malware',
   1, 1,
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (11, 'Phishing Campaign Targeting Finance Department',
   'Multiple employees in finance department received identical phishing emails claiming to be from CEO. 15 employees received email, 3 clicked link, 1 entered credentials.',
   'high', 'open', 'phishing',
   1, 1,
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (12, 'Unusual Outbound Traffic to Known C2 Server',
   'Workstation in engineering department making repeated connections to known command and control server. Potential data exfiltration. Network traffic shows 2.5MB uploaded.',
   'high', 'open', 'malware',
   1, 1,
   CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Summary
SELECT '✅ Sample data inserted successfully!' as status;
SELECT 'TAXII Servers: ' || COUNT(*) as count FROM taxii_servers WHERE id IN (1,2,3);
SELECT 'TAXII Collections: ' || COUNT(*) as count FROM taxii_collections WHERE id IN (1,2,3);
SELECT 'STIX Objects: ' || COUNT(*) as count FROM stix_objects WHERE id IN (1,2,3,4,5);
SELECT 'IOCs: ' || COUNT(*) as count FROM iocs WHERE id IN (1,2,3,4,5);
SELECT 'Workflows: ' || COUNT(*) as count FROM incident_workflows WHERE id IN (3,4,5);
SELECT 'Incidents: ' || COUNT(*) as count FROM incidents WHERE id IN (10,11,12);
