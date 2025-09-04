-- Threat Intelligence Seed Data

-- Insert Threat Campaigns
INSERT OR IGNORE INTO threat_campaigns (id, name, description, threat_actor, severity, campaign_type, first_seen, last_activity, target_sectors, geography, confidence, status, mitre_techniques, attribution_notes, created_by) VALUES
(1, 'LokiBot Banking Campaign', 'Advanced banking trojan targeting financial institutions with sophisticated credential theft capabilities.', 'Unknown Cybercriminal Group', 'critical', 'malware', '2024-01-15', '2024-01-22', '["Financial", "Banking"]', 'Global', 98, 'active', '["T1566.001", "T1055", "T1539"]', 'High confidence attribution based on TTPs and infrastructure overlap', 2),
(2, 'APT29 Cozy Bear Phishing', 'Sophisticated spear-phishing campaign attributed to Russian intelligence services targeting government entities.', 'APT29 (Cozy Bear)', 'high', 'apt', '2024-01-08', '2024-01-20', '["Government", "NGO"]', 'North America, Europe', 87, 'active', '["T1566.002", "T1204.002", "T1071.001"]', 'Attribution based on known APT29 TTPs and infrastructure', 2),
(3, 'Ransomware Deployment Wave', 'Coordinated ransomware deployment targeting small to medium businesses across multiple verticals.', 'Various Ransomware Groups', 'medium', 'ransomware', '2024-01-20', '2024-01-22', '["Healthcare", "SMB"]', 'North America', 76, 'active', '["T1486", "T1490"]', 'Multiple ransomware families involved', 2);

-- Insert IOCs
INSERT OR IGNORE INTO iocs (id, value, ioc_type, threat_level, campaign_id, source, first_seen, confidence, tags, notes, created_by) VALUES
(1, '192.168.1.100', 'ip', 'critical', 1, 'internal_detection', '2024-01-15 14:32:00', 95, '["c2", "malware", "banking"]', 'C2 server for LokiBot campaign', 2),
(2, 'malicious-domain.com', 'domain', 'high', 2, 'commercial_feed', '2024-01-14 09:15:00', 87, '["phishing", "apt", "government"]', 'Phishing domain used in APT29 campaign', 2),
(3, 'a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890', 'hash', 'critical', 3, 'partner_sharing', '2024-01-13 16:45:00', 92, '["ransomware", "malware", "encryption"]', 'SHA256 hash of ransomware payload', 2),
(4, 'suspicious.exe', 'hash', 'medium', 1, 'internal_detection', '2024-01-16 10:20:00', 78, '["malware", "banking"]', 'Additional LokiBot variant', 2),
(5, '10.0.0.254', 'ip', 'high', 2, 'osint', '2024-01-12 08:30:00', 85, '["apt", "command-control"]', 'Known APT29 infrastructure', 2);

-- Insert Threat Feeds  
INSERT OR IGNORE INTO threat_feeds (id, name, feed_type, provider, status, last_update, next_update, update_frequency, records_count, reliability) VALUES
(1, 'CrowdStrike Falcon Intel', 'commercial', 'CrowdStrike', 'active', datetime('now', '-5 minutes'), datetime('now', '+10 minutes'), 15, 47234, 98),
(2, 'CISA AIS', 'government', 'CISA', 'active', datetime('now', '-15 minutes'), datetime('now', '+45 minutes'), 60, 1247, 95),
(3, 'ThreatFox', 'open_source', 'Abuse.ch', 'failed', datetime('now', '-2 hours'), datetime('now', '+30 minutes'), 30, 0, 0),
(4, 'MISP Communities', 'open_source', 'MISP Project', 'active', datetime('now', '-18 minutes'), datetime('now', '+42 minutes'), 60, 12456, 89),
(5, 'AlienVault OTX', 'open_source', 'AT&T Cybersecurity', 'active', datetime('now', '-25 minutes'), datetime('now', '+35 minutes'), 60, 34127, 91);

-- Insert Hunt Results
INSERT OR IGNORE INTO hunt_results (id, query_name, hunt_query, query_type, time_range, data_source, execution_time, events_analyzed, hosts_scanned, findings_count, confidence, created_by) VALUES
(1, 'Lateral Movement Detection', 'SecurityEvent | where EventID == 4624 | where LogonType == 10 | summarize count() by AccountName, IpAddress', 'kql', 'Last 24 Hours', 'Windows Event Logs', 2.3, 2347832, 247, 3, 87, 2),
(2, 'C2 Communication Hunt', 'NetworkConnection | where RemotePort in (443, 80, 8080) | where ProcessName != "chrome.exe"', 'kql', 'Last 12 Hours', 'Network Logs', 1.8, 1234567, 189, 5, 92, 2);

-- Insert Hunt Findings
INSERT OR IGNORE INTO hunt_findings (id, hunt_result_id, finding_type, severity, title, description, details, affected_host, source_ip, confidence) VALUES
(1, 1, 'suspicious_login', 'high', 'Suspicious Login Pattern', 'User: admin@company.com from 192.168.1.100', '15 failed attempts in 2 minutes', 'DC-001', '192.168.1.100', 87),
(2, 1, 'network_anomaly', 'medium', 'Abnormal Network Traffic', 'Endpoint: WKS-001 → 185.234.72.45:443', 'Continuous beaconing detected', 'WKS-001', '10.0.0.50', 73),
(3, 1, 'powershell_execution', 'medium', 'PowerShell Execution', 'Host: SRV-002, Encoded command detected', 'Base64 encoded PowerShell script', 'SRV-002', '10.0.0.25', 82),
(4, 2, 'c2_communication', 'critical', 'C2 Communication Detected', 'Process: malware.exe connecting to known C2', 'Outbound connection to known malicious IP', 'WKS-005', '10.0.0.75', 95),
(5, 2, 'data_exfiltration', 'high', 'Potential Data Exfiltration', 'Large file transfer to external IP', 'Unusual data volume transfer detected', 'SRV-003', '10.0.0.30', 88);

-- Insert Threat Reports
INSERT OR IGNORE INTO threat_reports (id, title, report_type, time_range, included_threats, format, status, progress, sections, generated_by) VALUES
(1, 'Weekly Threat Intelligence Report', 'weekly', 'Last 7 Days', '["malware", "phishing"]', 'pdf', 'completed', 100, '["Executive Summary", "Threat Landscape Overview", "IOC Analysis"]', 2),
(2, 'APT Campaign Analysis', 'campaign', 'Last 30 Days', '["apt"]', 'pdf', 'generating', 75, '["Campaign Attribution", "MITRE ATT&CK Mapping", "Recommendations"]', 2);