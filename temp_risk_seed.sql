-- Add comprehensive risk seed data (expanding beyond current 10 risks)

INSERT OR IGNORE INTO risks (
    title, description, category, subcategory, probability, impact, 
    inherent_risk, residual_risk, status, source, affected_assets, 
    created_at, updated_at
) VALUES

-- Advanced Cybersecurity Risks
('API Security Vulnerabilities', 'Insecure API endpoints exposing sensitive data through authentication bypass, injection attacks, or excessive data exposure', 'cybersecurity', 'application-security', 4, 4, 16, 8, 'active', 'Security Assessment', 'API Gateway, Microservices, Customer Database', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('Zero-Day Exploit Targeting', 'Advanced persistent threats leveraging unknown vulnerabilities in critical infrastructure components', 'cybersecurity', 'advanced-threats', 2, 5, 10, 6, 'monitoring', 'Threat Intelligence', 'Operating Systems, Network Equipment, Security Tools', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('Social Engineering Campaign', 'Sophisticated social engineering attacks targeting executives and privileged users for credential harvesting', 'cybersecurity', 'human-factor', 3, 4, 12, 6, 'active', 'Security Awareness', 'Email Systems, Identity Provider, Corporate Network', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('IoT Device Compromise', 'Security vulnerabilities in Internet of Things devices providing network access points for attackers', 'cybersecurity', 'iot-security', 3, 3, 9, 5, 'active', 'Network Assessment', 'IoT Sensors, Building Systems, Network Infrastructure', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Operational & Business Risks
('Key Personnel Departure', 'Critical staff leaving organization resulting in knowledge loss and operational disruption', 'operational', 'human-resources', 3, 4, 12, 8, 'monitoring', 'HR Assessment', 'Development Team, Security Team, Operations Team', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('Business Process Automation Failure', 'Critical automated business processes failing due to system errors or dependency issues', 'operational', 'process-automation', 2, 4, 8, 4, 'mitigated', 'Process Review', 'ERP System, Workflow Engine, Database Systems', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('Compliance Audit Failure', 'Failure to pass regulatory compliance audits resulting in fines and business restrictions', 'regulatory', 'audit-compliance', 3, 5, 15, 9, 'active', 'Compliance Review', 'All Systems, Documentation, Processes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Financial & Strategic Risks
('Foreign Exchange Rate Volatility', 'Currency fluctuation impact on international operations and revenue recognition', 'financial', 'currency-risk', 4, 3, 12, 6, 'monitoring', 'Financial Analysis', 'Financial Systems, International Operations', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('Intellectual Property Theft', 'Unauthorized access and theft of proprietary technology, trade secrets, or sensitive business information', 'strategic', 'ip-protection', 2, 5, 10, 5, 'active', 'IP Audit', 'Source Code Repositories, Design Documents, R&D Systems', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Environmental & Physical Risks
('Data Center Environmental Failure', 'HVAC system failure, power outages, or natural disasters affecting data center operations', 'environmental', 'facility-risk', 2, 4, 8, 3, 'mitigated', 'Facility Assessment', 'Primary Data Center, Backup Systems, Power Infrastructure', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Technology & Infrastructure Risks
('Cloud Vendor Lock-in', 'Over-dependence on single cloud provider creating migration challenges and vendor leverage', 'technology', 'vendor-dependency', 3, 3, 9, 6, 'monitoring', 'Architecture Review', 'Cloud Infrastructure, SaaS Applications, Data Storage', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

('Legacy System Obsolescence', 'Critical legacy systems approaching end-of-life with limited vendor support and security updates', 'technology', 'system-lifecycle', 4, 4, 16, 10, 'active', 'Technology Assessment', 'Legacy Applications, Operating Systems, Network Equipment', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Advanced Persistent Threats
('Nation-State Cyber Espionage', 'Sophisticated nation-state actors targeting intellectual property and strategic business information', 'cybersecurity', 'advanced-threats', 1, 5, 5, 3, 'monitoring', 'Threat Intelligence', 'Executive Systems, R&D Infrastructure, Strategic Planning Systems', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Data Protection & Privacy
('Cross-Border Data Transfer Violations', 'Inadequate protection of personal data during international transfers violating GDPR, CCPA regulations', 'regulatory', 'data-protection', 3, 4, 12, 6, 'active', 'Privacy Impact Assessment', 'Customer Data, HR Systems, Analytics Platforms', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- Supply Chain & Third-Party Risks
('Critical Supplier Bankruptcy', 'Financial failure of key suppliers disrupting operations and project delivery timelines', 'third-party', 'supplier-risk', 2, 4, 8, 4, 'monitoring', 'Supplier Assessment', 'Supply Chain, Vendor Systems, Procurement Processes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);