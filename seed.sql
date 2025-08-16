-- DMT Risk Assessment System v2.0 - Seed Data
-- Sample data for demonstration and testing

-- Insert sample organizations
INSERT OR IGNORE INTO organizations (id, name, description, org_type, contact_email, risk_tolerance) VALUES
(1, 'DMT Corporation', 'Parent organization for risk management', 'division', 'admin@dmt-corp.com', 'medium'),
(2, 'Information Technology', 'IT department managing technology risks', 'department', 'it@dmt-corp.com', 'low'),
(3, 'Finance & Accounting', 'Financial operations and compliance', 'department', 'finance@dmt-corp.com', 'low'),
(4, 'Human Resources', 'HR operations and employee management', 'department', 'hr@dmt-corp.com', 'medium'),
(5, 'Operations', 'Core business operations', 'department', 'ops@dmt-corp.com', 'medium');

-- Insert sample users (password: demo123)
INSERT OR IGNORE INTO users (id, email, username, password_hash, first_name, last_name, department, job_title, role) VALUES
(1, 'admin@dmt-corp.com', 'admin', 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791', 'System', 'Administrator', 'IT', 'System Administrator', 'admin'),
(2, 'avi@dmt-corp.com', 'avi_security', 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791', 'Avi', 'Security', 'IT', 'Security Specialist', 'risk_manager'),
(3, 'sarah.johnson@dmt-corp.com', 'sjohnson', 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791', 'Sarah', 'Johnson', 'Finance', 'Risk Manager', 'risk_manager'),
(4, 'mike.chen@dmt-corp.com', 'mchen', 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791', 'Mike', 'Chen', 'Operations', 'Compliance Officer', 'compliance_officer'),
(5, 'emma.davis@dmt-corp.com', 'edavis', 'd3ad9315b7be5dd53b31a273b3b3aba5defe700808305aa16a3062b76658a791', 'Emma', 'Davis', 'HR', 'Internal Auditor', 'auditor');

-- Insert risk categories
INSERT OR IGNORE INTO risk_categories (id, name, description, category_type, risk_appetite) VALUES
(1, 'Cybersecurity', 'Information security and cyber threats', 'technology', 'low'),
(2, 'Data Privacy', 'Personal data protection and privacy compliance', 'compliance', 'low'),
(3, 'Operational Risk', 'Business process and operational failures', 'operational', 'medium'),
(4, 'Financial Risk', 'Credit, market, and liquidity risks', 'financial', 'low'),
(5, 'Regulatory Compliance', 'Regulatory and legal compliance risks', 'compliance', 'low'),
(6, 'Third-Party Risk', 'Vendor and supplier risks', 'operational', 'medium'),

(8, 'Business Continuity', 'Disaster recovery and business continuity', 'operational', 'low');

-- Insert sample risks
INSERT OR IGNORE INTO risks (id, risk_id, title, description, category_id, organization_id, owner_id, status, risk_type, probability, impact, risk_score, root_cause, potential_impact, treatment_strategy, identified_date, next_review_date, created_by) VALUES
(1, 'DMT-RISK-2024-001', 'Data Breach Risk', 'Potential unauthorized access to customer personal data', 1, 2, 2, 'active', 'inherent', 4, 5, 20, 'Insufficient access controls and monitoring', 'Customer data exposure, regulatory fines, reputation damage', 'mitigate', '2024-01-15', '2024-12-15', 2),
(2, 'DMT-RISK-2024-002', 'GDPR Non-Compliance', 'Risk of non-compliance with GDPR requirements', 2, 1, 3, 'active', 'inherent', 3, 4, 12, 'Lack of formal data processing procedures', 'Regulatory fines up to 4% of annual revenue', 'mitigate', '2024-02-01', '2024-11-01', 3),
(3, 'DMT-RISK-2024-003', 'Cloud Service Outage', 'Extended outage of critical cloud services', 3, 2, 2, 'monitoring', 'residual', 2, 4, 8, 'Single point of failure in cloud architecture', 'Business operations disruption, revenue loss', 'mitigate', '2024-01-20', '2024-10-20', 2),
(4, 'DMT-RISK-2024-004', 'Key Personnel Departure', 'Loss of critical personnel with unique knowledge', 3, 4, 5, 'active', 'inherent', 3, 3, 9, 'Inadequate knowledge management and succession planning', 'Knowledge loss, project delays', 'mitigate', '2024-03-01', '2024-12-01', 5),
(5, 'DMT-RISK-2024-005', 'Vendor Security Incident', 'Security incident at critical third-party vendor', 6, 1, 4, 'active', 'inherent', 3, 4, 12, 'Limited vendor security assessments', 'Data exposure, service disruption', 'transfer', '2024-02-15', '2024-11-15', 4);

-- Insert sample controls
INSERT OR IGNORE INTO controls (id, control_id, name, description, control_type, control_category, framework, control_family, control_objective, frequency, automation_level, owner_id, organization_id, design_effectiveness, operating_effectiveness, status) VALUES
(1, 'DMT-CTRL-001', 'Multi-Factor Authentication', 'Mandatory MFA for all user accounts accessing sensitive systems', 'preventive', 'automated', 'ISO27001', 'access_control', 'Prevent unauthorized access through strong authentication', 'continuous', 'fully_automated', 2, 2, 'effective', 'effective', 'active'),
(2, 'DMT-CTRL-002', 'Data Classification Policy', 'Formal policy for classifying and handling different types of data', 'preventive', 'manual', 'GDPR', 'data_protection', 'Ensure appropriate protection of sensitive data', 'continuous', 'manual', 3, 1, 'effective', 'effective', 'active'),
(3, 'DMT-CTRL-003', 'Security Monitoring', '24/7 security monitoring and incident detection', 'detective', 'automated', 'NIST', 'incident_management', 'Detect and respond to security incidents promptly', 'continuous', 'fully_automated', 2, 2, 'effective', 'effective', 'active'),
(4, 'DMT-CTRL-004', 'Backup and Recovery Testing', 'Regular testing of backup and recovery procedures', 'corrective', 'manual', 'COBIT', 'business_continuity', 'Ensure data can be recovered in case of incidents', 'monthly', 'semi_automated', 2, 2, 'effective', 'partially_effective', 'active'),
(5, 'DMT-CTRL-005', 'Vendor Risk Assessment', 'Comprehensive security assessment of third-party vendors', 'preventive', 'manual', 'ISO27001', 'third_party_risk', 'Mitigate risks from third-party relationships', 'annually', 'manual', 4, 1, 'partially_effective', 'partially_effective', 'active');

-- Insert risk-control mappings
INSERT OR IGNORE INTO risk_controls (risk_id, control_id, effectiveness_rating, notes) VALUES
(1, 1, 4, 'MFA significantly reduces unauthorized access risk'),
(1, 3, 5, 'Security monitoring provides early detection of breaches'),
(2, 2, 4, 'Data classification supports GDPR compliance'),
(3, 4, 3, 'Backup testing helps with recovery but not prevention'),
(5, 5, 3, 'Vendor assessments reduce but do not eliminate third-party risks');

-- Insert compliance requirements
INSERT OR IGNORE INTO compliance_requirements (id, requirement_id, title, description, framework, regulation_reference, requirement_type, applicable_to, jurisdiction, compliance_status) VALUES
(1, 'DMT-REQ-GDPR-001', 'Data Processing Records', 'Maintain records of all personal data processing activities', 'GDPR', 'Article 30', 'mandatory', 'all_entities', 'EU', 'partially_compliant'),
(2, 'DMT-REQ-GDPR-002', 'Data Breach Notification', 'Report personal data breaches to supervisory authority within 72 hours', 'GDPR', 'Article 33', 'mandatory', 'all_entities', 'EU', 'compliant'),
(3, 'DMT-REQ-ISO-001', 'Information Security Policy', 'Establish and maintain an information security policy', 'ISO27001', 'A.5.1.1', 'mandatory', 'all_entities', 'Global', 'compliant'),
(4, 'DMT-REQ-SOX-001', 'Internal Control Assessment', 'Annual assessment of internal controls over financial reporting', 'SOX', 'Section 404', 'mandatory', 'specific_business_units', 'US', 'compliant'),
(5, 'DMT-REQ-PCI-001', 'Secure Cardholder Data', 'Protect stored cardholder data through encryption', 'PCI-DSS', 'Requirement 3', 'mandatory', 'specific_processes', 'Global', 'not_assessed');

-- Insert sample compliance assessment
INSERT OR IGNORE INTO compliance_assessments (id, assessment_id, title, description, framework, assessment_type, scope, status, overall_rating, lead_assessor_id, organization_id, planned_start_date, planned_end_date, created_by) VALUES
(1, 'DMT-ASSESS-2024-001', 'Annual ISO 27001 Assessment', 'Comprehensive assessment of information security management system', 'ISO27001', 'self_assessment', 'organization_wide', 'completed', 'partially_compliant', 2, 1, '2024-03-01', '2024-04-30', 2),
(2, 'DMT-ASSESS-2024-002', 'GDPR Compliance Review', 'Review of GDPR compliance across all data processing activities', 'GDPR', 'external_audit', 'organization_wide', 'in_progress', NULL, 3, 1, '2024-08-01', '2024-09-30', 3);

-- Insert sample assessment findings
INSERT OR IGNORE INTO assessment_findings (id, finding_id, assessment_id, requirement_id, title, description, finding_type, severity, likelihood, impact, risk_rating, recommendation, status, responsible_party_id, target_completion_date) VALUES
(1, 'DMT-FIND-2024-001', 1, 3, 'Incomplete Security Policy Documentation', 'Information security policy lacks specific procedures for incident response', 'gap', 'medium', 'medium', 'medium', 'medium', 'Update security policy to include detailed incident response procedures', 'open', 2, '2024-10-31'),
(2, 'DMT-FIND-2024-002', 1, 1, 'Missing Data Processing Records', 'Some data processing activities lack proper documentation', 'deficiency', 'high', 'high', 'medium', 'high', 'Complete data processing inventory and maintain proper records', 'in_progress', 3, '2024-09-30');

-- Insert sample incidents
INSERT OR IGNORE INTO incidents (id, incident_id, title, description, incident_type, severity, priority, affected_systems, business_impact, status, assigned_to, detected_at, reported_at, created_by) VALUES
(1, 'DMT-INC-2024-001', 'Phishing Email Campaign', 'Employees received sophisticated phishing emails targeting credentials', 'security', 'medium', 'p2', 'Email system, potential user accounts', 'Potential credential compromise, productivity impact', 'closed', 2, '2024-06-15 09:30:00', '2024-06-15 10:15:00', 2),
(2, 'DMT-INC-2024-002', 'Server Outage', 'Critical application server experienced unexpected downtime', 'operational', 'high', 'p1', 'Customer portal, internal applications', 'Service disruption for 2 hours, customer complaints', 'resolved', 2, '2024-07-02 14:20:00', '2024-07-02 14:25:00', 4);

-- ESG metrics section removed as per user request

-- Insert sample workflows
INSERT OR IGNORE INTO workflows (id, workflow_id, name, description, trigger_type, trigger_config, workflow_steps, created_by, organization_id) VALUES
(1, 'DMT-WF-RISK-REVIEW', 'Risk Review Workflow', 'Automated workflow for quarterly risk reviews', 'scheduled', '{"schedule": "quarterly", "day": 1}', '{"steps": [{"type": "notification", "recipients": ["risk_managers"]}, {"type": "task", "assignee": "risk_owner"}, {"type": "approval", "approvers": ["department_head"]}]}', 2, 1),
(2, 'DMT-WF-INCIDENT-RESPONSE', 'Incident Response Workflow', 'Automated incident response and escalation', 'event_driven', '{"event": "incident_created", "severity": ["high", "critical"]}', '{"steps": [{"type": "notification", "recipients": ["security_team"]}, {"type": "escalation", "delay": "1 hour"}, {"type": "status_update"}]}', 2, 2);

-- Insert sample AI insights
INSERT OR IGNORE INTO ai_insights (insight_type, resource_type, resource_id, confidence_score, insight_data, recommendation, model_version, algorithm_used) VALUES
('risk_prediction', 'risk', 1, 0.85, '{"predicted_score": 22, "factors": ["increasing_threat_landscape", "control_gaps"], "trend": "increasing"}', 'Consider implementing additional detective controls and enhancing security monitoring', 'v1.2', 'random_forest'),
('anomaly_detection', 'control', 4, 0.92, '{"anomaly_type": "performance_degradation", "metrics": {"success_rate": 0.75, "expected": 0.95}}', 'Review backup procedures and test restoration processes more frequently', 'v1.1', 'isolation_forest'),
('trend_analysis', 'compliance', 1, 0.78, '{"trend": "improving", "score_change": "+15%", "period": "6_months"}', 'Continue current improvement initiatives and consider expanding scope', 'v1.0', 'time_series_analysis');