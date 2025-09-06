-- Add comprehensive seed data to remote database
INSERT OR IGNORE INTO risks (
    title, description, category, subcategory, probability, impact, 
    inherent_risk, residual_risk, status, source, affected_assets, 
    created_at, updated_at
) VALUES
('API Security Vulnerabilities', 'Insecure API endpoints exposing sensitive data through authentication bypass, injection attacks, or excessive data exposure', 'cybersecurity', 'application-security', 4, 4, 16, 8, 'active', 'Security Assessment', 'API Gateway, Microservices, Customer Database', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Zero-Day Exploit Targeting', 'Advanced persistent threats leveraging unknown vulnerabilities in critical infrastructure components', 'cybersecurity', 'advanced-threats', 2, 5, 10, 6, 'monitoring', 'Threat Intelligence', 'Operating Systems, Network Equipment, Security Tools', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Social Engineering Campaign', 'Sophisticated social engineering attacks targeting executives and privileged users for credential harvesting', 'cybersecurity', 'human-factor', 3, 4, 12, 6, 'active', 'Security Awareness', 'Email Systems, Identity Provider, Corporate Network', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('IoT Device Compromise', 'Security vulnerabilities in Internet of Things devices providing network access points for attackers', 'cybersecurity', 'iot-security', 3, 3, 9, 5, 'active', 'Network Assessment', 'IoT Sensors, Building Systems, Network Infrastructure', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Key Personnel Departure', 'Critical staff leaving organization resulting in knowledge loss and operational disruption', 'operational', 'human-resources', 3, 4, 12, 8, 'monitoring', 'HR Assessment', 'Development Team, Security Team, Operations Team', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Business Process Automation Failure', 'Critical automated business processes failing due to system errors or dependency issues', 'operational', 'process-automation', 2, 4, 8, 4, 'mitigated', 'Process Review', 'ERP System, Workflow Engine, Database Systems', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Compliance Audit Failure', 'Failure to pass regulatory compliance audits resulting in fines and business restrictions', 'regulatory', 'audit-compliance', 3, 5, 15, 9, 'active', 'Compliance Review', 'All Systems, Documentation, Processes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Foreign Exchange Rate Volatility', 'Currency fluctuation impact on international operations and revenue recognition', 'financial', 'currency-risk', 4, 3, 12, 6, 'monitoring', 'Financial Analysis', 'Financial Systems, International Operations', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Intellectual Property Theft', 'Unauthorized access and theft of proprietary technology, trade secrets, or sensitive business information', 'strategic', 'ip-protection', 2, 5, 10, 5, 'active', 'IP Audit', 'Source Code Repositories, Design Documents, R&D Systems', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Data Center Environmental Failure', 'HVAC system failure, power outages, or natural disasters affecting data center operations', 'environmental', 'facility-risk', 2, 4, 8, 3, 'mitigated', 'Facility Assessment', 'Primary Data Center, Backup Systems, Power Infrastructure', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Add service data to assets table (services are assets with category='service')
INSERT OR IGNORE INTO assets (
    name, type, category, location, criticality, value, status, 
    created_at, updated_at
) VALUES
('Customer Portal Service', 'Web Application', 'service', 'Cloud - Primary Region', 'critical', 2500000, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Payment Processing Service', 'Financial Service', 'service', 'Cloud - Multi-Region', 'critical', 5000000, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Identity & Authentication Service', 'Security Service', 'service', 'Cloud - Multi-Region', 'critical', 1800000, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Core API Gateway', 'API Service', 'service', 'Cloud - Multi-Region', 'critical', 3200000, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Data Warehouse Service', 'Data Service', 'service', 'Cloud - Primary Region', 'high', 2800000, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);