-- Seed Sample Services Data
-- Run this after migration to populate sample services for testing

INSERT OR IGNORE INTO services (id, name, description, type, category, criticality, criticality_score, availability_requirement, confidentiality_requirement, integrity_requirement, revenue_impact, cost_per_hour_downtime, compliance_relevant, compliance_frameworks, business_unit, status, sla_uptime_percentage, rto_hours, rpo_hours) VALUES
(1, 'Customer Portal', 'Public-facing customer portal for account management and transactions', 'application', 'customer_facing', 'critical', 5, 'critical', 'high', 'critical', 1000000, 50000, 1, '["SOC2","PCI-DSS","GDPR"]', 'Digital Experience', 'active', 99.95, 1, 0.25),
(2, 'Payment Processing System', 'Core payment processing and transaction handling', 'application', 'customer_facing', 'critical', 5, 'critical', 'critical', 'critical', 5000000, 100000, 1, '["PCI-DSS","SOC2"]', 'Financial Operations', 'active', 99.99, 0.5, 0.1),
(3, 'Internal CRM', 'Customer relationship management system for sales and support', 'application', 'internal', 'high', 4, 'high', 'high', 'high', 200000, 5000, 0, '[]', 'Sales', 'active', 99.9, 4, 1),
(4, 'Email Service', 'Corporate email and communication infrastructure', 'infrastructure', 'internal', 'high', 4, 'high', 'high', 'high', 0, 2000, 1, '["GDPR"]', 'IT Operations', 'active', 99.9, 2, 0.5),
(5, 'Data Warehouse', 'Central data warehouse for analytics and reporting', 'data_service', 'internal', 'medium', 3, 'medium', 'high', 'high', 50000, 1000, 0, '[]', 'Data Analytics', 'active', 99.5, 8, 4),
(6, 'Development Environment', 'Development and testing environment for application development', 'infrastructure', 'support', 'low', 2, 'low', 'low', 'medium', 0, 100, 0, '[]', 'Engineering', 'active', 99.0, 24, 24),
(7, 'Marketing Website', 'Public marketing and informational website', 'application', 'customer_facing', 'medium', 3, 'medium', 'low', 'medium', 100000, 1000, 0, '[]', 'Marketing', 'active', 99.5, 4, 1),
(8, 'API Gateway', 'Central API gateway for microservices and third-party integrations', 'infrastructure', 'customer_facing', 'critical', 5, 'critical', 'high', 'critical', 2000000, 75000, 1, '["SOC2"]', 'Platform Engineering', 'active', 99.95, 1, 0.25);

-- Note: Service-Assets linking will be created through the API once assets exist
-- This maintains referential integrity
