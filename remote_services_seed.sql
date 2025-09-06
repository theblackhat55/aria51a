-- Add service data to remote assets table (services are stored as assets with category='service')
INSERT OR IGNORE INTO assets (
    name, type, category, location, criticality, value, status, 
    created_at, updated_at
) VALUES
('Customer Portal Service', 'Web Application', 'service', 'Cloud - Primary Region', 'critical', 2500000, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Payment Processing Service', 'Financial Service', 'service', 'Cloud - Multi-Region', 'critical', 5000000, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Identity & Authentication Service', 'Security Service', 'service', 'Cloud - Multi-Region', 'critical', 1800000, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Core API Gateway', 'API Service', 'service', 'Cloud - Multi-Region', 'critical', 3200000, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Data Warehouse Service', 'Data Service', 'service', 'Cloud - Primary Region', 'high', 2800000, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Real-time Analytics Engine', 'Analytics Service', 'service', 'Cloud - Multi-Region', 'high', 2200000, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Email & Notification Service', 'Communication Service', 'service', 'Cloud - Primary Region', 'high', 800000, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Third-Party Integration Hub', 'Integration Service', 'service', 'Cloud - Primary Region', 'high', 1500000, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Webhook Management Service', 'Integration Service', 'service', 'Cloud - Primary Region', 'medium', 600000, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Business Intelligence Dashboard', 'Analytics Service', 'service', 'Cloud - Primary Region', 'medium', 1200000, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Container Orchestration Platform', 'Platform Service', 'service', 'Cloud - Multi-Region', 'critical', 1600000, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Log Aggregation & Monitoring', 'Infrastructure Service', 'service', 'Cloud - Multi-Region', 'high', 900000, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Backup & Disaster Recovery Service', 'Infrastructure Service', 'service', 'Cloud - Multi-Region', 'critical', 1400000, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Vulnerability Scanning Service', 'Security Service', 'service', 'Cloud - Primary Region', 'high', 700000, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('Security Information Event Management', 'Security Service', 'service', 'On-Premise + Cloud', 'high', 1100000, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);