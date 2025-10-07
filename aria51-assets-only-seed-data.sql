-- Seed data for assets table only (without foreign key constraints)

-- Insert assets data into existing assets table
INSERT OR IGNORE INTO assets (name, type, category, location, criticality, value, status) VALUES
('Primary Database Server', 'Server', 'Infrastructure', 'Data Center A - Rack 12', 'Critical', 250000.00, 'active'),
('Customer Portal Application', 'Application', 'Web Services', 'AWS us-east-1', 'High', 150000.00, 'active'),
('Employee Workstations (50 units)', 'Endpoint', 'User Devices', 'Main Office Floor 2-3', 'Medium', 75000.00, 'active'),
('Backup Storage System', 'Storage', 'Infrastructure', 'Data Center B - Rack 8', 'High', 180000.00, 'active'),
('Security Monitoring Platform', 'Security System', 'Security Tools', 'Cloud - Multi-Region', 'Critical', 200000.00, 'active'),
('Network Firewall Cluster', 'Network Equipment', 'Network Security', 'Data Center A - Network Rack', 'Critical', 80000.00, 'active'),
('Email Server Infrastructure', 'Server', 'Communications', 'Data Center A - Rack 15', 'High', 120000.00, 'active'),
('Mobile Device Fleet (120 devices)', 'Endpoint', 'Mobile Devices', 'Remote/Distributed', 'Medium', 60000.00, 'active'),
('API Gateway Services', 'Application', 'Integration', 'Cloud - Multi-Zone', 'High', 95000.00, 'active'),
('Identity Management System', 'Security System', 'Identity & Access', 'Hybrid Cloud', 'Critical', 175000.00, 'active');