-- Seed data for existing assets and kris tables in ARIA51 production database
-- This populates the empty assets and kris tables with realistic enterprise security data

-- Insert assets data into existing assets table
INSERT OR IGNORE INTO assets (id, name, type, category, owner_id, organization_id, location, criticality, value, status) VALUES
(1, 'Primary Database Server', 'Server', 'Infrastructure', 1, 1, 'Data Center A - Rack 12', 'Critical', 250000.00, 'active'),
(2, 'Customer Portal Application', 'Application', 'Web Services', 2, 1, 'AWS us-east-1', 'High', 150000.00, 'active'),
(3, 'Employee Workstations (50 units)', 'Endpoint', 'User Devices', 2, 1, 'Main Office Floor 2-3', 'Medium', 75000.00, 'active'),
(4, 'Backup Storage System', 'Storage', 'Infrastructure', 1, 1, 'Data Center B - Rack 8', 'High', 180000.00, 'active'),
(5, 'Security Monitoring Platform', 'Security System', 'Security Tools', 2, 1, 'Cloud - Multi-Region', 'Critical', 200000.00, 'active'),
(6, 'Network Firewall Cluster', 'Network Equipment', 'Network Security', 1, 1, 'Data Center A - Network Rack', 'Critical', 80000.00, 'active'),
(7, 'Email Server Infrastructure', 'Server', 'Communications', 1, 1, 'Data Center A - Rack 15', 'High', 120000.00, 'active'),
(8, 'Mobile Device Fleet (120 devices)', 'Endpoint', 'Mobile Devices', 2, 1, 'Remote/Distributed', 'Medium', 60000.00, 'active'),
(9, 'API Gateway Services', 'Application', 'Integration', 2, 1, 'Cloud - Multi-Zone', 'High', 95000.00, 'active'),
(10, 'Identity Management System', 'Security System', 'Identity & Access', 1, 1, 'Hybrid Cloud', 'Critical', 175000.00, 'active');

-- Insert KRI data into existing kris table with realistic risk indicators
INSERT OR IGNORE INTO kris (id, risk_id, name, description, metric_type, threshold_value, current_value, threshold_direction, frequency, owner_id, status, last_measured) VALUES
(1, 1, 'Failed Login Attempts Rate', 'Number of failed authentication attempts per hour across all systems', 'Count', 50.0, 23.0, 'above', 'hourly', 2, 'active', '2024-09-18 15:30:00'),
(2, 2, 'Critical Vulnerability Age', 'Average days that critical vulnerabilities remain unpatched', 'Days', 7.0, 4.2, 'above', 'daily', 2, 'active', '2024-09-18 14:45:00'),
(3, 3, 'System Downtime Percentage', 'Percentage of critical system downtime per month', 'Percentage', 2.0, 0.8, 'above', 'daily', 1, 'active', '2024-09-18 15:00:00'),
(4, 4, 'Compliance Score Deviation', 'Deviation from target compliance score (target: 95%)', 'Percentage', 5.0, 2.1, 'above', 'weekly', 3, 'active', '2024-09-18 10:00:00'),
(5, 5, 'Incident Response Time', 'Average time to respond to critical security incidents (hours)', 'Hours', 4.0, 2.8, 'above', 'daily', 2, 'active', '2024-09-18 13:15:00'),
(6, 1, 'Malware Detection Rate', 'Number of malware detections per day across all endpoints', 'Count', 10.0, 3.0, 'above', 'daily', 2, 'active', '2024-09-18 12:30:00'),
(7, 2, 'Network Anomaly Score', 'AI-based network anomaly detection score (0-100)', 'Score', 75.0, 42.0, 'above', 'hourly', 1, 'active', '2024-09-18 15:45:00'),
(8, 3, 'Data Loss Prevention Alerts', 'Number of DLP policy violations per week', 'Count', 20.0, 8.0, 'above', 'weekly', 2, 'active', '2024-09-18 09:00:00'),
(9, 4, 'Privileged Account Usage', 'Percentage of privileged accounts used in last 30 days', 'Percentage', 80.0, 92.3, 'below', 'monthly', 1, 'active', '2024-09-15 16:00:00'),
(10, 5, 'Security Training Completion', 'Percentage of employees who completed security training', 'Percentage', 95.0, 87.2, 'below', 'monthly', 3, 'active', '2024-09-10 14:00:00'),
(11, 1, 'Phishing Email Click Rate', 'Percentage of users who clicked on phishing simulation emails', 'Percentage', 5.0, 3.2, 'above', 'monthly', 2, 'active', '2024-09-12 11:00:00'),
(12, 2, 'Backup Success Rate', 'Percentage of successful daily backups across all systems', 'Percentage', 95.0, 98.7, 'below', 'daily', 1, 'active', '2024-09-18 02:00:00');