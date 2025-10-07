-- Sample MS Defender Incidents Data for Production

-- Insert sample MS Defender incidents
INSERT OR IGNORE INTO defender_incidents (
  incident_id, incident_name, severity, status, classification, 
  assigned_to, alerts_count, entities_count, description, 
  created_time, last_update_time, resolved_time
) VALUES
(
  'incident-001', 
  'Suspicious PowerShell Activity Detected',
  'High',
  'Active',
  'TruePositive',
  'SOC Team Alpha',
  5,
  3,
  'Detected obfuscated PowerShell commands attempting to download external payloads',
  datetime('now', '-2 days'),
  datetime('now', '-1 hour'),
  NULL
),
(
  'incident-002',
  'Phishing Email Campaign Detection',
  'Medium',
  'InProgress',
  'TruePositive',
  'Security Analyst Beta',
  12,
  8,
  'Large-scale phishing campaign targeting employee credentials',
  datetime('now', '-1 day'),
  datetime('now', '-30 minutes'),
  NULL
),
(
  'incident-003',
  'Ransomware Behavior Pattern',
  'Critical',
  'Active',
  'TruePositive',
  'Incident Response Team',
  25,
  15,
  'File encryption patterns detected across multiple endpoints',
  datetime('now', '-6 hours'),
  datetime('now', '-10 minutes'),
  NULL
),
(
  'incident-004',
  'Credential Theft Attempt',
  'High',
  'Resolved',
  'TruePositive',
  'SOC Team Alpha',
  8,
  4,
  'Attempted credential harvesting from compromised endpoint',
  datetime('now', '-3 days'),
  datetime('now', '-2 days'),
  datetime('now', '-2 days', '+4 hours')
),
(
  'incident-005',
  'Network Reconnaissance Activity',
  'Medium',
  'Active',
  'TruePositive',
  'Network Security Team',
  6,
  2,
  'Unusual network scanning and enumeration activities detected',
  datetime('now', '-8 hours'),
  datetime('now', '-2 hours'),
  NULL
),
(
  'incident-006',
  'Malicious File Execution',
  'High',
  'InProgress',
  'TruePositive',
  'Malware Analysis Team',
  3,
  1,
  'Unknown executable with malicious signatures executed on critical server',
  datetime('now', '-4 hours'),
  datetime('now', '-30 minutes'),
  NULL
),
(
  'incident-007',
  'Lateral Movement Detection',
  'Critical',
  'Active',
  'TruePositive',
  'Incident Response Team',
  18,
  12,
  'Adversary moving laterally through network using compromised credentials',
  datetime('now', '-3 hours'),
  datetime('now', '-15 minutes'),
  NULL
),
(
  'incident-008',
  'Data Exfiltration Attempt',
  'Critical',
  'InProgress',
  'TruePositive',
  'Data Protection Team',
  7,
  5,
  'Large volumes of sensitive data being uploaded to external services',
  datetime('now', '-2 hours'),
  datetime('now', '-5 minutes'),
  NULL
);

-- Verify the data
SELECT 'MS Defender Incidents Created' as table_name, COUNT(*) as count FROM defender_incidents;