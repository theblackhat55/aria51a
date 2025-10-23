-- Large Test Dataset for Risk Module v2
-- Purpose: Test pagination, filters, sorting, and performance
-- Total Risks: 100+ (in addition to existing 17)

-- ========================================
-- LARGE DATASET: 100 Additional Risks
-- ========================================

-- Critical Risks (15 risks, score 20-25)
INSERT INTO risks (risk_id, title, description, category, subcategory, probability, impact, status, owner_id, organization_id, created_by, review_date, source) VALUES
('RISK-00018', 'Zero-Day Vulnerability in Core Systems', 'Unpatched zero-day vulnerability discovered in production infrastructure with active exploitation in the wild.', 'cybersecurity', 'vulnerability', 5, 5, 'active', 6, 1, 1, date('now', '+7 days'), 'Security Scan'),
('RISK-00019', 'Nation-State APT Campaign Targeting Organization', 'Advanced Persistent Threat campaign specifically targeting our organization with sophisticated tactics.', 'cybersecurity', 'advanced_threat', 5, 5, 'active', 6, 1, 1, date('now', '+3 days'), 'Threat Intelligence'),
('RISK-00020', 'Critical Infrastructure Failure Without Redundancy', 'Single point of failure in critical infrastructure with no backup systems in place.', 'technology', 'infrastructure', 4, 5, 'active', 3, 1, 1, date('now', '+14 days'), 'Infrastructure Review'),
('RISK-00021', 'Mass Data Exfiltration Incident', 'Confirmed data exfiltration of sensitive customer records by external threat actor.', 'cybersecurity', 'data_breach', 5, 5, 'mitigated', 6, 1, 1, date('now', '+60 days'), 'Incident Response'),
('RISK-00022', 'Critical Regulatory Violation - SEC', 'Material violation of SEC regulations with potential criminal liability and massive fines.', 'compliance', 'regulatory', 5, 5, 'active', 4, 2, 2, date('now', '+10 days'), 'Legal Review'),
('RISK-00023', 'CEO Fraud Wire Transfer Scheme', 'Sophisticated business email compromise targeting finance team for large wire transfers.', 'operational', 'fraud', 4, 5, 'monitoring', 2, 1, 1, date('now', '+30 days'), 'Fraud Detection'),
('RISK-00024', 'Ransomware Gang Threatening Data Leak', 'Ransomware group threatening to publish stolen data if ransom not paid within 48 hours.', 'cybersecurity', 'ransomware', 5, 5, 'active', 6, 1, 1, date('now', '+2 days'), 'Incident Response'),
('RISK-00025', 'Critical Vendor Bankruptcy Filing', 'Critical technology vendor filed for bankruptcy, threatening service continuity.', 'operational', 'vendor_management', 4, 5, 'active', 2, 1, 2, date('now', '+21 days'), 'Vendor Monitoring'),
('RISK-00026', 'Insider Trading Investigation', 'Federal investigation into potential insider trading involving senior executives.', 'compliance', 'financial_crime', 5, 5, 'under_review', 4, 2, 2, date('now', '+14 days'), 'Legal Department'),
('RISK-00027', 'Critical Safety Incident at Manufacturing', 'Fatal accident at manufacturing facility with OSHA investigation and potential shutdown.', 'operational', 'safety', 5, 4, 'active', 2, 1, 1, date('now', '+7 days'), 'Safety Department'),
('RISK-00028', 'Environmental Contamination Liability', 'Confirmed environmental contamination requiring immediate remediation and EPA involvement.', 'compliance', 'environmental', 4, 5, 'active', 4, 2, 2, date('now', '+30 days'), 'Environmental Audit'),
('RISK-00029', 'Major Product Recall Imminent', 'Critical product defect requiring immediate recall of 100,000+ units in market.', 'operational', 'product_quality', 5, 5, 'active', 2, 1, 1, date('now', '+5 days'), 'Quality Assurance'),
('RISK-00030', 'Class Action Lawsuit Filed', 'Multi-million dollar class action lawsuit filed with potential for significant damages.', 'compliance', 'legal', 4, 5, 'under_review', 4, 2, 2, date('now', '+90 days'), 'Legal Department'),
('RISK-00031', 'Critical Intellectual Property Theft', 'Trade secrets stolen by departing executive, now working for competitor.', 'operational', 'ip_theft', 5, 5, 'active', 2, 1, 1, date('now', '+14 days'), 'Legal Investigation'),
('RISK-00032', 'Failure of Primary Data Center', 'Complete failure of primary data center with inadequate DR capabilities.', 'technology', 'disaster_recovery', 4, 5, 'mitigated', 3, 1, 1, date('now', '+60 days'), 'DR Exercise');

-- High Risks (25 risks, score 12-19)
INSERT INTO risks (risk_id, title, description, category, subcategory, probability, impact, status, owner_id, organization_id, created_by, review_date, source) VALUES
('RISK-00033', 'Cloud Misconfiguration Exposing Data', 'Multiple cloud storage buckets configured with public access, exposing sensitive data.', 'technology', 'cloud_security', 4, 4, 'active', 6, 1, 1, date('now', '+20 days'), 'Security Audit'),
('RISK-00034', 'Privileged Access Management Gaps', 'Inadequate controls over privileged accounts with excessive permissions granted.', 'cybersecurity', 'access_control', 4, 4, 'active', 6, 1, 1, date('now', '+30 days'), 'IAM Review'),
('RISK-00035', 'Third-Party API Integration Vulnerabilities', 'Insecure third-party API integrations with inadequate authentication.', 'technology', 'api_security', 4, 4, 'active', 3, 1, 1, date('now', '+25 days'), 'Code Review'),
('RISK-00036', 'GDPR Compliance Gaps Identified', 'Significant gaps in GDPR compliance with potential for enforcement action.', 'compliance', 'regulatory', 3, 5, 'active', 4, 2, 2, date('now', '+45 days'), 'GDPR Audit'),
('RISK-00037', 'Critical Skill Gap in Cybersecurity Team', 'Lack of specialized cybersecurity expertise with multiple open positions.', 'operational', 'human_resources', 3, 4, 'active', 2, 1, 1, date('now', '+60 days'), 'HR Assessment'),
('RISK-00038', 'Legacy Application Security Vulnerabilities', 'Multiple critical vulnerabilities in legacy applications with no patches available.', 'technology', 'application_security', 4, 4, 'accepted', 3, 1, 1, date('now', '+90 days'), 'Vulnerability Scan'),
('RISK-00039', 'Payment Processing System Outages', 'Frequent payment system outages causing revenue loss and customer complaints.', 'technology', 'availability', 4, 4, 'active', 3, 1, 1, date('now', '+15 days'), 'Operations'),
('RISK-00040', 'Mobile Application Security Weaknesses', 'Mobile app lacks proper certificate pinning and secure storage mechanisms.', 'technology', 'mobile_security', 4, 3, 'active', 3, 1, 1, date('now', '+40 days'), 'Mobile Security Review'),
('RISK-00041', 'Inadequate Backup and Recovery Procedures', 'Backup systems not tested regularly, uncertain recovery capabilities.', 'technology', 'backup_recovery', 3, 4, 'active', 3, 1, 1, date('now', '+30 days'), 'DR Test'),
('RISK-00042', 'Supply Chain Cybersecurity Risks', 'Limited visibility into supply chain security practices of critical vendors.', 'operational', 'supply_chain', 3, 4, 'monitoring', 2, 1, 1, date('now', '+45 days'), 'Vendor Assessment'),
('RISK-00043', 'Insider Threat Detection Gaps', 'Inadequate monitoring of insider threats with limited user behavior analytics.', 'cybersecurity', 'insider_threat', 3, 4, 'active', 6, 1, 1, date('now', '+35 days'), 'Security Operations'),
('RISK-00044', 'Cryptocurrency Wallet Security', 'Corporate cryptocurrency assets stored without proper multi-signature controls.', 'financial', 'crypto_security', 4, 4, 'active', 2, 2, 2, date('now', '+20 days'), 'Treasury Review'),
('RISK-00045', 'Social Engineering Campaign Success', 'High success rate of phishing campaigns against employees despite training.', 'cybersecurity', 'social_engineering', 4, 3, 'active', 6, 1, 1, date('now', '+30 days'), 'Security Awareness'),
('RISK-00046', 'API Rate Limiting Bypass', 'API endpoints lack proper rate limiting, vulnerable to abuse and DDoS.', 'technology', 'api_security', 4, 3, 'active', 3, 1, 1, date('now', '+25 days'), 'API Security Review'),
('RISK-00047', 'Database Encryption Gaps', 'Sensitive databases lacking encryption at rest with plaintext storage.', 'cybersecurity', 'data_protection', 4, 4, 'active', 3, 1, 1, date('now', '+40 days'), 'Database Audit'),
('RISK-00048', 'Vendor Due Diligence Inadequate', 'Minimal security due diligence performed before vendor onboarding.', 'operational', 'vendor_management', 3, 4, 'active', 2, 1, 2, date('now', '+50 days'), 'Procurement Review'),
('RISK-00049', 'Network Segmentation Deficiencies', 'Flat network architecture with inadequate segmentation between environments.', 'technology', 'network_security', 4, 4, 'active', 3, 1, 1, date('now', '+45 days'), 'Network Assessment'),
('RISK-00050', 'Incident Response Plan Outdated', 'IR plan not updated in 2 years, untested procedures and outdated contacts.', 'cybersecurity', 'incident_response', 3, 4, 'active', 6, 1, 1, date('now', '+30 days'), 'IR Review'),
('RISK-00051', 'Cryptographic Key Management Weaknesses', 'Encryption keys stored insecurely without proper rotation procedures.', 'cybersecurity', 'cryptography', 4, 4, 'active', 6, 1, 1, date('now', '+35 days'), 'Crypto Review'),
('RISK-00052', 'Business Continuity Plan Gaps', 'BCP missing key procedures for critical business processes.', 'operational', 'business_continuity', 3, 4, 'active', 2, 1, 1, date('now', '+60 days'), 'BCP Review'),
('RISK-00053', 'Shadow IT Discovery', 'Unapproved cloud services and applications being used across organization.', 'technology', 'shadow_it', 3, 4, 'monitoring', 3, 1, 1, date('now', '+40 days'), 'IT Audit'),
('RISK-00054', 'Code Repository Security Issues', 'Secrets and credentials found hardcoded in source code repositories.', 'technology', 'secure_development', 4, 4, 'active', 3, 1, 1, date('now', '+20 days'), 'Code Scan'),
('RISK-00055', 'DNS Security Vulnerabilities', 'DNS infrastructure vulnerable to hijacking and cache poisoning attacks.', 'technology', 'network_security', 3, 4, 'active', 3, 1, 1, date('now', '+30 days'), 'Infrastructure Review'),
('RISK-00056', 'Email Security Gateway Bypass', 'Sophisticated phishing emails bypassing email security controls regularly.', 'cybersecurity', 'email_security', 4, 3, 'active', 6, 1, 1, date('now', '+25 days'), 'Email Security Review'),
('RISK-00057', 'Container Security Misconfigurations', 'Docker containers running with excessive privileges and vulnerabilities.', 'technology', 'container_security', 4, 3, 'active', 3, 1, 1, date('now', '+35 days'), 'Container Audit');

-- Medium Risks (40 risks, score 6-11)
INSERT INTO risks (risk_id, title, description, category, subcategory, probability, impact, status, owner_id, organization_id, created_by, review_date, source) VALUES
('RISK-00058', 'Password Policy Weaknesses', 'Password policy allows weak passwords with infrequent rotation requirements.', 'cybersecurity', 'access_control', 3, 3, 'active', 6, 1, 1, date('now', '+60 days'), 'IAM Audit'),
('RISK-00059', 'Software License Compliance Issues', 'Potential over-deployment of commercial software without adequate licensing.', 'compliance', 'licensing', 3, 2, 'active', 4, 2, 2, date('now', '+90 days'), 'SAM Review'),
('RISK-00060', 'Patch Management Delays', 'Security patches not applied within required timeframes consistently.', 'technology', 'patch_management', 3, 3, 'active', 3, 1, 1, date('now', '+45 days'), 'Patch Review'),
('RISK-00061', 'Remote Access VPN Vulnerabilities', 'VPN infrastructure running outdated software with known vulnerabilities.', 'technology', 'remote_access', 3, 3, 'active', 3, 1, 1, date('now', '+30 days'), 'VPN Assessment'),
('RISK-00062', 'Security Awareness Training Gaps', 'Inconsistent security awareness training with low completion rates.', 'operational', 'training', 3, 2, 'active', 2, 1, 1, date('now', '+60 days'), 'Training Metrics'),
('RISK-00063', 'BYOD Policy Non-Compliance', 'Personal devices accessing corporate resources without proper MDM enrollment.', 'technology', 'mobile_security', 3, 3, 'active', 6, 1, 1, date('now', '+50 days'), 'BYOD Audit'),
('RISK-00064', 'Physical Security Badge System Aging', 'Physical access control system approaching end-of-life with reliability issues.', 'operational', 'physical_security', 2, 3, 'monitoring', 2, 1, 1, date('now', '+120 days'), 'Facilities'),
('RISK-00065', 'Documentation Outdated and Incomplete', 'Technical documentation significantly outdated, hindering operations.', 'operational', 'documentation', 2, 3, 'active', 3, 1, 1, date('now', '+90 days'), 'Documentation Review'),
('RISK-00066', 'Vendor Contract Renewal Delays', 'Multiple critical vendor contracts expiring without renewal initiated.', 'operational', 'vendor_management', 3, 3, 'pending', 2, 1, 2, date('now', '+40 days'), 'Procurement'),
('RISK-00067', 'Log Management and SIEM Gaps', 'Incomplete log collection with retention policies not meeting requirements.', 'cybersecurity', 'monitoring', 3, 3, 'active', 6, 1, 1, date('now', '+60 days'), 'SIEM Review'),
('RISK-00068', 'Change Management Process Bypasses', 'Unauthorized changes to production systems bypassing change control.', 'operational', 'change_management', 3, 3, 'active', 3, 1, 1, date('now', '+45 days'), 'Change Control Audit'),
('RISK-00069', 'SSL/TLS Certificate Expiration Tracking', 'Manual tracking of certificate expirations with history of lapses.', 'technology', 'certificate_management', 3, 2, 'active', 3, 1, 1, date('now', '+60 days'), 'Certificate Audit'),
('RISK-00070', 'Privileged Session Monitoring Gaps', 'Limited monitoring and recording of privileged administrative sessions.', 'cybersecurity', 'privileged_access', 3, 3, 'active', 6, 1, 1, date('now', '+50 days'), 'PAM Review'),
('RISK-00071', 'Asset Inventory Inaccuracies', 'IT asset inventory significantly outdated with unknown device counts.', 'operational', 'asset_management', 3, 2, 'active', 3, 1, 1, date('now', '+60 days'), 'Asset Audit'),
('RISK-00072', 'Vulnerability Scanning Coverage Gaps', 'Significant portions of infrastructure not included in vulnerability scans.', 'cybersecurity', 'vulnerability_management', 3, 3, 'active', 6, 1, 1, date('now', '+45 days'), 'Vuln Management Review'),
('RISK-00073', 'Email Retention Policy Violations', 'Email retention policies not enforced, creating legal discovery risks.', 'compliance', 'data_retention', 2, 3, 'active', 4, 2, 2, date('now', '+90 days'), 'Legal Review'),
('RISK-00074', 'Firewall Rule Creep and Complexity', 'Firewall rulesets overly complex with many outdated and unused rules.', 'technology', 'network_security', 3, 2, 'active', 3, 1, 1, date('now', '+60 days'), 'Firewall Review'),
('RISK-00075', 'Secure Software Development Lifecycle Gaps', 'SDLC lacking security checkpoints and secure coding standards.', 'technology', 'secure_development', 3, 3, 'active', 3, 1, 1, date('now', '+75 days'), 'SDLC Review'),
('RISK-00076', 'Wireless Network Security Weaknesses', 'Guest wireless network not properly segregated from corporate network.', 'technology', 'wireless_security', 3, 3, 'active', 3, 1, 1, date('now', '+45 days'), 'Wireless Audit'),
('RISK-00077', 'Third-Party Risk Assessments Overdue', 'Critical vendors not reassessed within required annual timeframe.', 'operational', 'vendor_management', 3, 3, 'pending', 2, 1, 2, date('now', '+30 days'), 'Vendor Risk'),
('RISK-00078', 'Data Classification Program Immature', 'Data classification inconsistently applied across organization.', 'operational', 'data_governance', 2, 3, 'active', 2, 1, 1, date('now', '+90 days'), 'Data Governance'),
('RISK-00079', 'Security Metrics and KPI Gaps', 'Limited security metrics tracked, hindering risk-based decision making.', 'operational', 'governance', 2, 3, 'active', 6, 1, 1, date('now', '+60 days'), 'Metrics Review'),
('RISK-00080', 'Segregation of Duties Violations', 'Inadequate segregation of duties in financial and IT systems.', 'compliance', 'internal_controls', 3, 3, 'active', 4, 2, 2, date('now', '+60 days'), 'SOD Review'),
('RISK-00081', 'Mobile Device Lost/Stolen Procedures', 'Slow response to lost/stolen mobile device reports increasing data risk.', 'operational', 'mobile_security', 3, 2, 'active', 6, 1, 1, date('now', '+45 days'), 'Mobile Policy Review'),
('RISK-00082', 'Database Access Control Weaknesses', 'Overly permissive database access with shared accounts in use.', 'technology', 'database_security', 3, 3, 'active', 3, 1, 1, date('now', '+50 days'), 'Database Access Review'),
('RISK-00083', 'Privacy Impact Assessments Missing', 'New systems deployed without required privacy impact assessments.', 'compliance', 'privacy', 3, 3, 'active', 4, 2, 2, date('now', '+45 days'), 'Privacy Review'),
('RISK-00084', 'Penetration Test Findings Unresolved', 'Multiple findings from annual penetration test still unresolved.', 'cybersecurity', 'vulnerability_management', 3, 3, 'active', 6, 1, 1, date('now', '+30 days'), 'Pentest Remediation'),
('RISK-00085', 'Encryption Key Escrow Procedures Lacking', 'No formal key escrow procedures for business continuity.', 'cybersecurity', 'cryptography', 2, 3, 'active', 6, 1, 1, date('now', '+60 days'), 'Key Management'),
('RISK-00086', 'Security Information Sharing Gaps', 'Limited participation in threat intelligence sharing communities.', 'cybersecurity', 'threat_intelligence', 2, 2, 'active', 6, 1, 1, date('now', '+90 days'), 'Threat Intel Review'),
('RISK-00087', 'Removable Media Controls Inadequate', 'USB drives and removable media not properly controlled or encrypted.', 'technology', 'data_loss_prevention', 3, 2, 'active', 6, 1, 1, date('now', '+60 days'), 'DLP Review'),
('RISK-00088', 'Cloud Access Security Broker Gaps', 'CASB solution not deployed for all cloud applications in use.', 'technology', 'cloud_security', 3, 3, 'active', 3, 1, 1, date('now', '+45 days'), 'Cloud Security Review'),
('RISK-00089', 'Privileged Account Certification Overdue', 'Annual privileged account recertification process significantly delayed.', 'cybersecurity', 'access_control', 3, 2, 'pending', 6, 1, 1, date('now', '+30 days'), 'Access Review'),
('RISK-00090', 'Vulnerability Disclosure Program Missing', 'No formal vulnerability disclosure program for external researchers.', 'cybersecurity', 'vulnerability_management', 2, 3, 'active', 6, 1, 1, date('now', '+90 days'), 'Bug Bounty Review'),
('RISK-00091', 'Backup Encryption Not Implemented', 'Backup media not encrypted, creating data breach risk if lost.', 'technology', 'backup_recovery', 3, 3, 'active', 3, 1, 1, date('now', '+40 days'), 'Backup Review'),
('RISK-00092', 'Security Architecture Reviews Skipped', 'New projects deployed without mandatory security architecture review.', 'operational', 'governance', 3, 2, 'active', 6, 1, 1, date('now', '+60 days'), 'Architecture Review'),
('RISK-00093', 'Contractor Access Control Weaknesses', 'Contractor and temporary worker access not properly managed.', 'operational', 'access_control', 3, 3, 'active', 2, 1, 1, date('now', '+45 days'), 'Contractor Management'),
('RISK-00094', 'Data Loss Prevention Tuning Required', 'DLP solution generating excessive false positives, reducing effectiveness.', 'technology', 'data_loss_prevention', 2, 3, 'active', 6, 1, 1, date('now', '+60 days'), 'DLP Tuning'),
('RISK-00095', 'Security Tool Consolidation Needed', 'Redundant security tools creating management overhead and gaps.', 'operational', 'tool_management', 2, 2, 'active', 6, 1, 1, date('now', '+120 days'), 'Tool Rationalization'),
('RISK-00096', 'Secure Configuration Baselines Missing', 'Systems deployed without secure configuration baselines applied.', 'technology', 'configuration_management', 3, 3, 'active', 3, 1, 1, date('now', '+50 days'), 'Config Management'),
('RISK-00097', 'Third-Party Code Library Vulnerabilities', 'Open source dependencies with known vulnerabilities not patched.', 'technology', 'supply_chain', 3, 3, 'active', 3, 1, 1, date('now', '+40 days'), 'Dependency Scan');

-- Low Risks (20 risks, score 1-5)
INSERT INTO risks (risk_id, title, description, category, subcategory, probability, impact, status, owner_id, organization_id, created_by, review_date, source) VALUES
('RISK-00098', 'Print Server Security Hardening', 'Legacy print servers not hardened to current security standards.', 'technology', 'legacy_systems', 2, 2, 'accepted', 3, 1, 1, date('now', '+180 days'), 'Infrastructure Review'),
('RISK-00099', 'Security Newsletter Low Readership', 'Internal security newsletter has low employee engagement rates.', 'operational', 'awareness', 2, 1, 'active', 2, 1, 1, date('now', '+90 days'), 'Communications'),
('RISK-00100', 'Conference Room Booking System Outdated', 'Room booking system approaching end-of-support with minor security concerns.', 'technology', 'legacy_systems', 2, 2, 'monitoring', 3, 1, 1, date('now', '+120 days'), 'Facilities IT'),
('RISK-00101', 'Visitor Badge Printer Aging', 'Visitor badge printer frequently jams, causing security desk delays.', 'operational', 'physical_security', 2, 1, 'monitoring', 2, 1, 1, date('now', '+90 days'), 'Reception'),
('RISK-00102', 'Cafeteria Payment System Basic Security', 'Cafeteria payment system uses basic security with no sensitive data.', 'technology', 'payment_systems', 2, 2, 'accepted', 3, 1, 1, date('now', '+180 days'), 'Facilities'),
('RISK-00103', 'Company Intranet Cosmetic Issues', 'Intranet has outdated branding but no security or functional issues.', 'technology', 'web_applications', 1, 2, 'accepted', 3, 1, 1, date('now', '+365 days'), 'Communications'),
('RISK-00104', 'Desk Phone System Legacy Protocol', 'VoIP phone system uses older protocol but is isolated and working.', 'technology', 'telecommunications', 2, 2, 'accepted', 3, 1, 1, date('now', '+180 days'), 'Telecom'),
('RISK-00105', 'Parking Lot Camera Resolution Low', 'Parking lot security cameras have lower resolution than optimal.', 'operational', 'physical_security', 2, 2, 'monitoring', 2, 1, 1, date('now', '+180 days'), 'Security'),
('RISK-00106', 'Employee Directory Incomplete Information', 'Corporate directory missing some employee contact details.', 'operational', 'data_quality', 2, 1, 'active', 2, 1, 1, date('now', '+120 days'), 'HR'),
('RISK-00107', 'Archive Storage Room Climate Control', 'Document archive room has aging climate control system.', 'operational', 'facilities', 2, 2, 'monitoring', 2, 1, 1, date('now', '+90 days'), 'Facilities'),
('RISK-00108', 'Whiteboard Cleaner Low Stock', 'Meeting rooms frequently run out of whiteboard cleaning supplies.', 'operational', 'supplies', 1, 1, 'active', 2, 1, 1, date('now', '+30 days'), 'Office Management'),
('RISK-00109', 'Break Room Coffee Machine Aging', 'Break room coffee machine approaching replacement age.', 'operational', 'facilities', 1, 1, 'monitoring', 2, 1, 1, date('now', '+180 days'), 'Facilities'),
('RISK-00110', 'Office Plant Maintenance Irregular', 'Office plants not maintained on consistent schedule, some dying.', 'operational', 'facilities', 1, 1, 'active', 2, 1, 1, date('now', '+60 days'), 'Facilities'),
('RISK-00111', 'Reception Desk Chair Ergonomics', 'Reception desk chair does not meet current ergonomic standards.', 'operational', 'health_safety', 2, 1, 'pending', 2, 1, 1, date('now', '+90 days'), 'HR'),
('RISK-00112', 'Lobby WiFi Guest Network Naming', 'Guest WiFi network name does not follow current branding.', 'technology', 'wireless_security', 1, 1, 'accepted', 3, 1, 1, date('now', '+365 days'), 'IT'),
('RISK-00113', 'Archived Paper Records Storage Space', 'Paper archive storage approaching capacity, needs expansion plan.', 'operational', 'records_management', 2, 2, 'monitoring', 2, 1, 1, date('now', '+120 days'), 'Records'),
('RISK-00114', 'Company Swag Inventory Management', 'Promotional items inventory not tracked systematically.', 'operational', 'inventory', 1, 1, 'active', 2, 1, 1, date('now', '+180 days'), 'Marketing'),
('RISK-00115', 'Conference Call Audio Quality', 'Some conference rooms have suboptimal audio quality for remote calls.', 'technology', 'telecommunications', 2, 2, 'monitoring', 3, 1, 1, date('now', '+90 days'), 'IT'),
('RISK-00116', 'Employee Parking Permit Design Outdated', 'Parking permit design does not match current company branding.', 'operational', 'facilities', 1, 1, 'accepted', 2, 1, 1, date('now', '+365 days'), 'Facilities'),
('RISK-00117', 'Breakroom Microwave Cleanliness Notices', 'Microwave cleanliness reminders not effective, unit frequently dirty.', 'operational', 'workplace_culture', 1, 1, 'active', 2, 1, 1, date('now', '+60 days'), 'Facilities');

-- ========================================
-- VERIFICATION
-- ========================================

SELECT COUNT(*) as total_risks FROM risks;
SELECT status, COUNT(*) as count FROM risks GROUP BY status;
SELECT category, COUNT(*) as count FROM risks GROUP BY category;
SELECT 
  CASE 
    WHEN probability * impact >= 20 THEN 'Critical'
    WHEN probability * impact >= 12 THEN 'High'
    WHEN probability * impact >= 6 THEN 'Medium'
    ELSE 'Low'
  END as risk_level,
  COUNT(*) as count
FROM risks
GROUP BY risk_level
ORDER BY 
  CASE 
    WHEN probability * impact >= 20 THEN 1
    WHEN probability * impact >= 12 THEN 2
    WHEN probability * impact >= 6 THEN 3
    ELSE 4
  END;
