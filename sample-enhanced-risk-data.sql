-- Sample Enhanced Dynamic Risk Data
-- This creates relationships between existing risks, assets, and services for dynamic scoring

-- First, let's create some sample risks if they don't exist
INSERT OR IGNORE INTO risks (id, title, description, category, probability, impact, inherent_risk, status, owner_id, created_by, created_at, updated_at) VALUES
  (100, 'Ransomware Attack', 'Potential ransomware attack on critical infrastructure', 'Operational', 4, 5, 20, 'active', 1, 1, datetime('now'), datetime('now')),
  (101, 'Data Breach via SQL Injection', 'Customer database compromise through application vulnerabilities', 'Technology', 3, 5, 15, 'active', 1, 1, datetime('now'), datetime('now')),
  (102, 'Supply Chain Disruption', 'Third-party vendor security compromise affecting operations', 'Strategic', 3, 4, 12, 'active', 1, 1, datetime('now'), datetime('now')),
  (103, 'Insider Threat - Privilege Abuse', 'Malicious insider accessing sensitive data', 'Operational', 2, 4, 8, 'active', 1, 1, datetime('now'), datetime('now')),
  (104, 'Cloud Infrastructure Failure', 'Critical cloud services becoming unavailable', 'Technology', 2, 5, 10, 'active', 1, 1, datetime('now'), datetime('now'));

-- Create asset mappings for these risks
-- Each risk affects multiple assets with different impact weights
INSERT OR IGNORE INTO risk_asset_mappings (risk_id, asset_id, impact_weight, exposure_level, mitigation_coverage) VALUES
  -- Ransomware Attack (affects multiple critical assets)
  (100, 1, 2.0, 'high', 0.3),      -- Customer Database Server
  (100, 2, 1.5, 'medium', 0.2),    -- HR Management System
  (100, 4, 1.8, 'high', 0.4),      -- Email Server
  (100, 5, 1.2, 'low', 0.6),       -- Backup Storage System

  -- Data Breach via SQL Injection (primarily database-focused)
  (101, 1, 2.5, 'critical', 0.2),  -- Customer Database Server
  (101, 2, 1.8, 'high', 0.3),      -- HR Management System

  -- Supply Chain Disruption (affects external-facing assets)
  (102, 3, 2.0, 'high', 0.1),      -- Corporate Firewall
  (102, 4, 1.5, 'medium', 0.3),    -- Email Server

  -- Insider Threat (affects sensitive data systems)
  (103, 1, 1.8, 'high', 0.4),      -- Customer Database Server
  (103, 2, 2.0, 'critical', 0.3),  -- HR Management System

  -- Cloud Infrastructure Failure (affects all cloud-based assets)
  (104, 1, 2.2, 'high', 0.2),      -- Customer Database Server
  (104, 2, 1.6, 'medium', 0.3),    -- HR Management System
  (104, 4, 1.9, 'high', 0.2),      -- Email Server
  (104, 5, 2.5, 'critical', 0.1);  -- Backup Storage System

-- Create service mappings for these risks
-- Link risks to affected services with business impact assessments
INSERT OR IGNORE INTO risk_service_mappings (risk_id, service_id, business_impact_level, dependency_criticality, availability_requirement, financial_impact_hourly, user_impact_count) VALUES
  -- Ransomware Attack
  (100, 1, 'critical', 2.0, 0.995, 50000.0, 10000),   -- Customer Portal (high impact)
  (100, 2, 'high', 1.8, 0.99, 25000.0, 5000),         -- Email System
  (100, 3, 'medium', 1.5, 0.95, 15000.0, 2000),       -- Internal Applications

  -- Data Breach via SQL Injection
  (101, 1, 'critical', 2.5, 0.999, 75000.0, 15000),   -- Customer Portal (data exposure)
  (101, 4, 'high', 2.0, 0.98, 30000.0, 8000),         -- HR Management System

  -- Supply Chain Disruption
  (102, 2, 'medium', 1.4, 0.97, 20000.0, 3000),       -- Email System
  (102, 3, 'high', 1.8, 0.99, 35000.0, 7000),         -- Internal Applications

  -- Insider Threat
  (103, 1, 'high', 1.9, 0.995, 40000.0, 8000),        -- Customer Portal
  (103, 4, 'critical', 2.2, 0.999, 60000.0, 12000),   -- HR Management System

  -- Cloud Infrastructure Failure
  (104, 1, 'critical', 2.3, 0.999, 80000.0, 20000),   -- Customer Portal
  (104, 2, 'high', 2.0, 0.995, 45000.0, 10000),       -- Email System
  (104, 3, 'medium', 1.6, 0.98, 25000.0, 5000);       -- Internal Applications

-- Add some threat intelligence data for these risks
INSERT OR IGNORE INTO risk_threat_intelligence (risk_id, threat_source, threat_type, threat_value, confidence_level, severity_score, active_status, metadata) VALUES
  (100, 'MITRE ATT&CK', 'ttp', 'T1486 - Data Encrypted for Impact', 0.9, 9.0, TRUE, '{"framework": "mitre_attack", "tactic": "impact"}'),
  (100, 'Cyber Threat Alliance', 'campaign', 'Ransomware-as-a-Service Operations', 0.8, 8.5, TRUE, '{"campaign_name": "RaaS_2024", "active_since": "2024-01-01"}'),
  
  (101, 'CVE Database', 'cve', 'CVE-2023-1234', 0.95, 8.8, TRUE, '{"cvss_score": 8.8, "exploit_available": true}'),
  (101, 'OWASP', 'ttp', 'A03:2021 – Injection', 0.9, 7.5, TRUE, '{"owasp_top10": "2021", "category": "injection"}'),
  
  (102, 'Supply Chain Security', 'campaign', 'Third-Party Compromise Campaign', 0.7, 7.0, TRUE, '{"target_sectors": ["technology", "finance"], "attribution": "APT29"}'),
  
  (103, 'Insider Threat Program', 'ttp', 'Privilege Escalation via Valid Accounts', 0.8, 6.5, TRUE, '{"mitre_id": "T1078", "detection_difficulty": "high"}'),
  
  (104, 'Cloud Security Alliance', 'ttp', 'Insufficient Identity and Access Management', 0.85, 7.8, TRUE, '{"cloud_provider": "multi", "impact_category": "availability"}}');

-- Add control effectiveness data for these risks
INSERT OR IGNORE INTO risk_control_effectiveness (risk_id, control_id, control_type, effectiveness_score, coverage_percentage, last_tested, test_result, maturity_level, implementation_status) VALUES
  -- Ransomware Attack Controls
  (100, 'BC.1', 'preventive', 0.7, 80.0, datetime('now', '-30 days'), 'Pass', 3, 'implemented'),
  (100, 'BC.2', 'detective', 0.8, 90.0, datetime('now', '-15 days'), 'Pass', 4, 'implemented'),
  (100, 'SC.1', 'corrective', 0.6, 70.0, datetime('now', '-45 days'), 'Partial', 2, 'implemented'),

  -- Data Breach Controls
  (101, 'AC.1', 'preventive', 0.9, 95.0, datetime('now', '-7 days'), 'Pass', 4, 'implemented'),
  (101, 'AC.2', 'detective', 0.85, 88.0, datetime('now', '-20 days'), 'Pass', 3, 'implemented'),
  (101, 'SI.1', 'preventive', 0.75, 85.0, datetime('now', '-10 days'), 'Pass', 3, 'implemented'),

  -- Supply Chain Controls
  (102, 'SA.1', 'preventive', 0.65, 75.0, datetime('now', '-60 days'), 'Partial', 2, 'implemented'),
  (102, 'SA.2', 'detective', 0.7, 80.0, datetime('now', '-25 days'), 'Pass', 3, 'implemented'),

  -- Insider Threat Controls
  (103, 'PS.1', 'preventive', 0.8, 90.0, datetime('now', '-5 days'), 'Pass', 4, 'implemented'),
  (103, 'PS.2', 'detective', 0.9, 95.0, datetime('now', '-12 days'), 'Pass', 5, 'optimized'),

  -- Cloud Infrastructure Controls
  (104, 'ID.1', 'preventive', 0.75, 85.0, datetime('now', '-18 days'), 'Pass', 3, 'implemented'),
  (104, 'PR.1', 'preventive', 0.8, 88.0, datetime('now', '-8 days'), 'Pass', 4, 'implemented');

-- Add some environmental context factors
INSERT OR IGNORE INTO risk_environment_context (risk_id, context_type, context_name, context_value, impact_multiplier, active_period_start, active_period_end) VALUES
  -- High threat period for ransomware
  (100, 'threat', 'High Ransomware Activity Period', 'Q4 2024 increased activity', 1.4, datetime('now', '-30 days'), datetime('now', '+30 days')),
  
  -- Compliance audit period affects data breach risk
  (101, 'compliance', 'Annual SOC2 Audit Period', 'Type II audit in progress', 1.3, datetime('now', '-15 days'), datetime('now', '+45 days')),
  
  -- Business peak season increases supply chain risk
  (102, 'business', 'Peak Business Season', 'Holiday shopping season', 1.2, datetime('now', '-10 days'), datetime('now', '+60 days')),
  
  -- Recent security incidents increase insider threat awareness
  (103, 'technical', 'Post-Incident Heightened Monitoring', 'Enhanced monitoring after recent incident', 0.8, datetime('now', '-7 days'), datetime('now', '+90 days')),
  
  -- Cloud migration project increases infrastructure risk
  (104, 'technical', 'Major Cloud Migration Project', 'Moving critical workloads to cloud', 1.5, datetime('now', '-20 days'), datetime('now', '+120 days'));

-- Verify the data was inserted
SELECT 'Risk Asset Mappings' as table_name, COUNT(*) as count FROM risk_asset_mappings WHERE risk_id >= 100
UNION ALL
SELECT 'Risk Service Mappings' as table_name, COUNT(*) as count FROM risk_service_mappings WHERE risk_id >= 100
UNION ALL  
SELECT 'Risk Threat Intelligence' as table_name, COUNT(*) as count FROM risk_threat_intelligence WHERE risk_id >= 100
UNION ALL
SELECT 'Risk Control Effectiveness' as table_name, COUNT(*) as count FROM risk_control_effectiveness WHERE risk_id >= 100
UNION ALL
SELECT 'Risk Environment Context' as table_name, COUNT(*) as count FROM risk_environment_context WHERE risk_id >= 100;