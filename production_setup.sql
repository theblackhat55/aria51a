-- Create services table for production
CREATE TABLE IF NOT EXISTS services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  service_category TEXT DEFAULT 'Business Service',
  business_department TEXT,
  service_owner TEXT,
  confidentiality_impact TEXT DEFAULT 'Medium',
  integrity_impact TEXT DEFAULT 'Medium',
  availability_impact TEXT DEFAULT 'Medium',
  confidentiality_numeric INTEGER DEFAULT 3,
  integrity_numeric INTEGER DEFAULT 3,
  availability_numeric INTEGER DEFAULT 3,
  recovery_time_objective INTEGER DEFAULT 24,
  recovery_point_objective INTEGER DEFAULT 24,
  service_availability_target REAL DEFAULT 99.0,
  business_function TEXT DEFAULT 'General Operations',
  user_impact_scope TEXT DEFAULT 'Internal',
  revenue_impact TEXT DEFAULT 'None',
  criticality TEXT DEFAULT 'Medium',
  criticality_score INTEGER DEFAULT 50,
  ai_confidence REAL DEFAULT 0.0,
  ai_last_assessment DATETIME,
  ai_next_assessment DATETIME,
  risk_score REAL DEFAULT 0.0,
  business_impact_score INTEGER DEFAULT 50,
  service_status TEXT DEFAULT 'Active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

-- Create service relationship tables
CREATE TABLE IF NOT EXISTS service_asset_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  asset_id INTEGER NOT NULL,
  relationship_type TEXT DEFAULT 'dependency',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(service_id, asset_id)
);

CREATE TABLE IF NOT EXISTS service_risk_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  service_id TEXT NOT NULL,
  risk_id INTEGER NOT NULL,
  relationship_type TEXT DEFAULT 'affects',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(service_id, risk_id)
);

-- Add demo users if they don't exist
INSERT OR REPLACE INTO users (id, username, email, password_hash, role, first_name, last_name, organization_id, created_at) VALUES 
(1, 'admin', 'admin@aria52.com', 'demo123', 'admin', 'Admin', 'User', 1, '2024-01-01 00:00:00'),
(2, 'avi_security', 'avi@aria52.com', 'demo123', 'risk_manager', 'Avi', 'Security', 1, '2024-01-01 00:00:00'),
(3, 'sarah_compliance', 'sarah@aria52.com', 'demo123', 'compliance_officer', 'Sarah', 'Compliance', 1, '2024-01-01 00:00:00'),
(4, 'mike_analyst', 'mike@aria52.com', 'demo123', 'analyst', 'Mike', 'Analyst', 1, '2024-01-01 00:00:00'),
(5, 'demo_user', 'demo@aria52.com', 'demo123', 'user', 'Demo', 'User', 1, '2024-01-01 00:00:00');

-- Add sample services
INSERT OR REPLACE INTO services (id, service_id, name, description, service_category, business_department, service_owner, confidentiality_numeric, integrity_numeric, availability_numeric, criticality, criticality_score, service_status) VALUES 
(1, 'SVC-CUSTOMER-PORTAL', 'Customer Portal', 'Primary customer-facing web portal for account management and service requests', 'Web Service', 'Customer Service', 'IT Operations', 4, 4, 4, 'High', 75, 'Active'),
(2, 'SVC-PAYMENT-PROCESSING', 'Payment Processing Service', 'Core payment processing and billing system', 'Business Service', 'Finance', 'Finance Team', 5, 5, 4, 'Critical', 92, 'Active'),
(3, 'SVC-EMAIL-NOTIFICATIONS', 'Email Notification Service', 'Automated email notifications and alerts system', 'Infrastructure Service', 'IT Operations', 'IT Support', 3, 3, 3, 'Medium', 55, 'Active'),
(4, 'SVC-DATA-BACKUP', 'Data Backup Service', 'Automated backup and recovery service for critical data', 'Infrastructure Service', 'IT Operations', 'IT Operations', 4, 5, 3, 'High', 68, 'Active');

-- Add sample assets
INSERT OR REPLACE INTO assets (id, name, type, category, location, criticality, value, status, owner_id, organization_id) VALUES 
(1, 'Primary Database Server', 'Server', 'Infrastructure', 'Data Center A', 'Critical', 150000.00, 'active', 1, 1),
(2, 'Customer Web Portal', 'Application', 'Business Application', 'Cloud AWS', 'High', 75000.00, 'active', 2, 1),
(3, 'Email Server Cluster', 'Server', 'Infrastructure', 'Data Center B', 'High', 45000.00, 'active', 1, 1),
(4, 'Financial Trading System', 'Application', 'Business Application', 'Data Center A', 'Critical', 200000.00, 'active', 3, 1),
(5, 'Network Firewall', 'Network Device', 'Security', 'Data Center A', 'Critical', 25000.00, 'active', 1, 1),
(6, 'Backup Storage Array', 'Storage', 'Infrastructure', 'Data Center B', 'High', 80000.00, 'active', 1, 1),
(7, 'VPN Gateway', 'Network Device', 'Security', 'Cloud AWS', 'Medium', 15000.00, 'active', 2, 1),
(8, 'HR Management System', 'Application', 'Business Application', 'Cloud Office365', 'Medium', 30000.00, 'active', 4, 1);

-- Add sample risks using correct schema
INSERT OR REPLACE INTO risks (id, title, description, category, probability, impact, status, created_at) VALUES 
(1, 'Data Breach via Web Application', 'Potential unauthorized access to customer data through web application vulnerabilities', 'Information Security', 3, 4, 'active', '2024-01-01 00:00:00'),
(2, 'Payment System Downtime', 'Risk of payment processing system becoming unavailable during peak business hours', 'Operational', 2, 5, 'active', '2024-01-01 00:00:00'),
(3, 'Ransomware Attack', 'Risk of ransomware compromising critical business systems and data', 'Information Security', 4, 5, 'active', '2024-01-01 00:00:00'),
(4, 'Third-Party Vendor Failure', 'Risk of critical third-party service provider failing to deliver services', 'Third Party', 3, 3, 'active', '2024-01-01 00:00:00'),
(5, 'Regulatory Compliance Violation', 'Risk of failing to meet regulatory requirements leading to fines and penalties', 'Compliance', 2, 4, 'active', '2024-01-01 00:00:00'),
(6, 'Network Infrastructure Failure', 'Risk of core network infrastructure components failing', 'Operational', 2, 4, 'active', '2024-01-01 00:00:00'),
(7, 'Key Personnel Departure', 'Risk of critical staff members leaving without proper knowledge transfer', 'Human Resources', 3, 3, 'active', '2024-01-01 00:00:00'),
(8, 'Natural Disaster Impact', 'Risk of natural disasters affecting primary data center operations', 'Environmental', 1, 5, 'active', '2024-01-01 00:00:00');