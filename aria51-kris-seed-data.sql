-- Seed data for KRIs table using existing risk IDs

-- Insert KRI data into existing kris table with realistic risk indicators
INSERT OR IGNORE INTO kris (risk_id, name, description, metric_type, threshold_value, current_value, threshold_direction, frequency, status, last_measured) VALUES
(2, 'Failed Login Attempts Rate', 'Number of failed authentication attempts per hour across all systems', 'Count', 50.0, 23.0, 'above', 'hourly', 'active', '2024-09-18 15:30:00'),
(3, 'Critical Vulnerability Age', 'Average days that critical vulnerabilities remain unpatched', 'Days', 7.0, 4.2, 'above', 'daily', 'active', '2024-09-18 14:45:00'),
(4, 'System Downtime Percentage', 'Percentage of critical system downtime per month', 'Percentage', 2.0, 0.8, 'above', 'daily', 'active', '2024-09-18 15:00:00'),
(5, 'Compliance Score Deviation', 'Deviation from target compliance score (target: 95%)', 'Percentage', 5.0, 2.1, 'above', 'weekly', 'active', '2024-09-18 10:00:00'),
(6, 'Incident Response Time', 'Average time to respond to critical security incidents (hours)', 'Hours', 4.0, 2.8, 'above', 'daily', 'active', '2024-09-18 13:15:00'),
(7, 'Malware Detection Rate', 'Number of malware detections per day across all endpoints', 'Count', 10.0, 3.0, 'above', 'daily', 'active', '2024-09-18 12:30:00'),
(8, 'Network Anomaly Score', 'AI-based network anomaly detection score (0-100)', 'Score', 75.0, 42.0, 'above', 'hourly', 'active', '2024-09-18 15:45:00'),
(9, 'Data Loss Prevention Alerts', 'Number of DLP policy violations per week', 'Count', 20.0, 8.0, 'above', 'weekly', 'active', '2024-09-18 09:00:00'),
(2, 'Privileged Account Usage', 'Percentage of privileged accounts used in last 30 days', 'Percentage', 80.0, 92.3, 'below', 'monthly', 'active', '2024-09-15 16:00:00'),
(3, 'Security Training Completion', 'Percentage of employees who completed security training', 'Percentage', 95.0, 87.2, 'below', 'monthly', 'active', '2024-09-10 14:00:00'),
(4, 'Phishing Email Click Rate', 'Percentage of users who clicked on phishing simulation emails', 'Percentage', 5.0, 3.2, 'above', 'monthly', 'active', '2024-09-12 11:00:00'),
(5, 'Backup Success Rate', 'Percentage of successful daily backups across all systems', 'Percentage', 95.0, 98.7, 'below', 'daily', 'active', '2024-09-18 02:00:00');