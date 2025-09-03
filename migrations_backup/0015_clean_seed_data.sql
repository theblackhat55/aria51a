-- ==============================================
-- RISK OPTICS GRC 5.1 - CLEAN SEED DATA
-- ==============================================
-- This migration adds essential demonstration data to the GRC platform
-- Compatible with existing schema (no new columns)

-- ==============================================
-- USERS - Core team members
-- ==============================================

INSERT OR IGNORE INTO users (
  email, username, password_hash, first_name, last_name, department, job_title, phone, role, is_active, created_at, updated_at
) VALUES 
('admin@riskoptics.com', 'admin', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Sarah', 'Mitchell', 'Executive', 'Chief Executive Officer', '+1-555-0101', 'admin', 1, datetime('now'), datetime('now')),
('ciso@riskoptics.com', 'ciso', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Michael', 'Chen', 'Security', 'Chief Information Security Officer', '+1-555-0102', 'risk_manager', 1, datetime('now'), datetime('now')),
('risk.manager@riskoptics.com', 'riskmanager', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Jennifer', 'Rodriguez', 'Risk Management', 'Senior Risk Manager', '+1-555-0103', 'risk_manager', 1, datetime('now'), datetime('now')),
('compliance@riskoptics.com', 'compliance', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'David', 'Thompson', 'Compliance', 'Compliance Officer', '+1-555-0104', 'compliance_officer', 1, datetime('now'), datetime('now')),
('auditor@riskoptics.com', 'auditor', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Emily', 'Johnson', 'Audit', 'Senior Internal Auditor', '+1-555-0105', 'auditor', 1, datetime('now'), datetime('now'));

-- ==============================================
-- ORGANIZATIONS - Business structure
-- ==============================================

INSERT OR IGNORE INTO organizations (
  name, description, org_type, parent_id, contact_email, risk_tolerance, created_at, updated_at
) VALUES 
('Risk Optics Corp', 'Parent company providing enterprise GRC solutions', 'business_unit', NULL, 'info@riskoptics.com', 'medium', datetime('now'), datetime('now')),
('Technology Division', 'Core technology development and operations', 'division', 1, 'tech@riskoptics.com', 'medium', datetime('now'), datetime('now')),
('Security Operations', 'Information security and cyber defense', 'department', 2, 'security@riskoptics.com', 'low', datetime('now'), datetime('now')),
('Compliance Office', 'Regulatory compliance and governance', 'department', 1, 'compliance@riskoptics.com', 'low', datetime('now'), datetime('now'));

-- ==============================================
-- RISK CATEGORIES - Main risk types
-- ==============================================

INSERT OR IGNORE INTO risk_categories (
  name, description, category_type, risk_appetite, created_at
) VALUES 
('Cybersecurity', 'Information security threats and vulnerabilities', 'technology', 'low', datetime('now')),
('Operational Risk', 'Business process failures and operational disruptions', 'operational', 'medium', datetime('now')),
('Compliance Risk', 'Regulatory violations and compliance failures', 'compliance', 'low', datetime('now')),
('Financial Risk', 'Market, credit, and liquidity risks', 'financial', 'medium', datetime('now'));

-- ==============================================
-- CORE RISKS - Essential risk register
-- ==============================================

INSERT OR IGNORE INTO risks (
  risk_id, title, description, category_id, organization_id, owner_id, status, risk_type,
  probability, impact, risk_score, root_cause, potential_impact, treatment_strategy,
  mitigation_plan, identified_date, next_review_date, created_by, created_at, updated_at
) VALUES

-- Cybersecurity Risks
('RISK-CYBER-2025-001', 'Ransomware Attack Risk', 
 'Potential ransomware attack on critical business systems threatening data integrity and operations.',
 1, 2, 2, 'active', 'inherent', 4, 5, 20, 
 'Inadequate endpoint protection and security awareness',
 'System encryption, operational shutdown, data loss, regulatory fines',
 'mitigate',
 'Deploy EDR solution, implement zero-trust architecture, security training',
 '2025-01-15', '2025-04-15', 2, datetime('now'), datetime('now')),

('RISK-CYBER-2025-002', 'Data Breach Risk',
 'Potential unauthorized access and exfiltration of sensitive customer data.',
 1, 3, 2, 'active', 'inherent', 3, 4, 12,
 'Insufficient access controls and data encryption',
 'Data theft, privacy violations, regulatory penalties, reputation damage',
 'mitigate',
 'Implement data loss prevention, enhance access controls, encrypt sensitive data',
 '2025-01-20', '2025-04-20', 2, datetime('now'), datetime('now')),

-- Operational Risks  
('RISK-OPS-2025-001', 'Key Personnel Departure',
 'Risk of critical knowledge loss due to departure of key technical personnel.',
 2, 2, 3, 'active', 'inherent', 3, 3, 9,
 'Limited documentation and knowledge transfer processes',
 'Project delays, knowledge gaps, operational disruption',
 'mitigate', 
 'Implement knowledge management system, cross-training programs, succession planning',
 '2025-02-01', '2025-05-01', 3, datetime('now'), datetime('now')),

-- Compliance Risks
('RISK-COMP-2025-001', 'GDPR Compliance Violation',
 'Risk of violating GDPR requirements for data protection and privacy.',
 3, 4, 4, 'active', 'inherent', 2, 4, 8,
 'Incomplete privacy impact assessments and consent management',
 'Regulatory fines up to 4% of revenue, legal action, reputation damage',
 'mitigate',
 'Complete privacy impact assessments, implement consent management, staff training',
 '2025-02-10', '2025-05-10', 4, datetime('now'), datetime('now'));

-- ==============================================
-- SECURITY CONTROLS - Key controls
-- ==============================================

INSERT OR IGNORE INTO controls (
  control_id, name, description, control_type, control_category, framework, 
  control_objective, design_effectiveness, operating_effectiveness, owner_id, 
  organization_id, status, created_at, updated_at
) VALUES

('CTRL-SEC-001', 'Multi-Factor Authentication', 
 'Mandatory MFA for all system access to prevent unauthorized access.',
 'preventive', 'automated', 'ISO27001',
 'Ensure only authorized users can access systems and data',
 'effective', 'effective', 2, 3, 'active', datetime('now'), datetime('now')),

('CTRL-SEC-002', 'Data Encryption at Rest',
 'Encryption of sensitive data stored in databases and file systems.',
 'preventive', 'automated', 'ISO27001', 
 'Protect confidentiality of stored sensitive data',
 'effective', 'effective', 2, 3, 'active', datetime('now'), datetime('now')),

('CTRL-OPS-001', 'Regular System Backups',
 'Automated daily backups of critical systems and data.',
 'detective', 'automated', 'NIST',
 'Ensure business continuity and data recovery capabilities', 
 'effective', 'effective', 3, 2, 'active', datetime('now'), datetime('now')),

('CTRL-COMP-001', 'Privacy Impact Assessments',
 'Mandatory privacy assessments for new projects handling personal data.',
 'preventive', 'manual', 'GDPR',
 'Ensure privacy compliance in new initiatives',
 'partially_effective', 'not_tested', 4, 4, 'active', datetime('now'), datetime('now'));

-- ==============================================
-- SAMPLE SECURITY INCIDENTS
-- ==============================================

INSERT OR IGNORE INTO incidents (
  incident_id, title, description, incident_type, severity, priority, status,
  affected_systems, assigned_to, detected_at, reported_at, resolved_at
) VALUES

('INC-2025-001', 'Phishing Email Campaign', 
 'Employees received sophisticated phishing emails attempting credential theft.',
 'security', 'medium', 'p2', 'closed',
 'Email system, user workstations', 2,
 '2025-01-10 09:30:00', '2025-01-10 09:45:00', '2025-01-10 16:45:00'),

('INC-2025-002', 'Failed Login Attempts',
 'Multiple failed login attempts detected on administrative accounts.',
 'security', 'high', 'p1', 'investigating', 
 'Admin portal, authentication system', 2,
 '2025-02-15 14:20:00', '2025-02-15 14:25:00', NULL);

-- ==============================================
-- BASIC NOTIFICATIONS
-- ==============================================

INSERT OR IGNORE INTO notifications (
  user_id, type, title, message, category, is_read, 
  related_entity_type, related_entity_id, created_at
) VALUES

(2, 'warning', 'High Risk Requires Review', 
 'Ransomware Attack Risk (RISK-CYBER-2025-001) requires quarterly review', 
 'risk', 0, 'risk', 1, datetime('now')),

(4, 'warning', 'GDPR Assessment Due',
 'GDPR Compliance Violation risk assessment is due for review',
 'compliance', 0, 'risk', 4, datetime('now')),

(3, 'info', 'Control Effectiveness Review',
 'Privacy Impact Assessments control needs effectiveness review',
 'control', 0, 'control', 4, datetime('now'));

-- ==============================================
-- FINAL STATUS MESSAGE
-- ==============================================

-- Seed data loading complete!
-- Users: 5 (admin, ciso, risk manager, compliance officer, auditor) 
-- Organizations: 4 (corporate structure)
-- Risk Categories: 4 (cyber, operational, compliance, financial)
-- Risks: 4 (diverse risk portfolio)
-- Controls: 4 (security and compliance controls)
-- Incidents: 2 (sample security incidents) 
-- Notifications: 3 (pending alerts)