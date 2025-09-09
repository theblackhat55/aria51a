-- Simple compliance seed data for testing AI features

-- Insert basic frameworks
INSERT OR IGNORE INTO compliance_frameworks (id, name, version, description) VALUES 
(1, 'SOC 2 Type II', '2017', 'AICPA Service Organization Control 2 Type II - Trust Services Criteria'),
(2, 'ISO 27001', '2022', 'ISO/IEC 27001:2022 Information Security Management Systems'),
(3, 'NIST Cybersecurity Framework', '1.1', 'National Institute of Standards and Technology Cybersecurity Framework'),
(4, 'GDPR', '2018', 'General Data Protection Regulation');

-- Insert some sample SOC 2 controls
INSERT OR IGNORE INTO compliance_controls (id, framework_id, control_id, title, description, category, subcategory, control_type, implementation_status, implementation_progress, risk_level, testing_frequency) VALUES
-- CC1 - Control Environment
(1, 1, 'CC1.1', 'Control Environment - Integrity and Ethical Values', 'The entity demonstrates a commitment to integrity and ethical values', 'Security', 'Control Environment', 'preventive', 'implemented', 90, 'high', 'annually'),
(2, 1, 'CC1.2', 'Control Environment - Board Independence', 'The board of directors demonstrates independence from management', 'Security', 'Control Environment', 'preventive', 'implemented', 85, 'medium', 'annually'),
(3, 1, 'CC1.3', 'Control Environment - Management Philosophy', 'Management establishes structures, reporting lines, and authorities', 'Security', 'Control Environment', 'preventive', 'implemented', 95, 'high', 'annually'),

-- CC2 - Communication and Information
(4, 1, 'CC2.1', 'Information and Communication - Quality Information', 'The entity obtains or generates and uses relevant, quality information', 'Security', 'Communication and Information', 'detective', 'implemented', 88, 'high', 'quarterly'),
(5, 1, 'CC2.2', 'Information and Communication - Internal Communication', 'The entity internally communicates information necessary to support the functioning of internal control', 'Security', 'Communication and Information', 'preventive', 'implemented', 92, 'medium', 'quarterly'),

-- CC6 - Logical and Physical Access Controls
(6, 1, 'CC6.1', 'Logical Access - Access Rights Management', 'The entity implements logical access security software and infrastructure', 'Security', 'Logical Access', 'preventive', 'implemented', 95, 'critical', 'monthly'),
(7, 1, 'CC6.2', 'Logical Access - Authentication', 'Prior to issuing system credentials, the entity registers and authorizes new internal and external users', 'Security', 'Logical Access', 'preventive', 'implemented', 88, 'high', 'monthly'),
(8, 1, 'CC6.3', 'Logical Access - Access Reviews', 'The entity authorizes, modifies, or removes access to data, software, and system resources', 'Security', 'Logical Access', 'detective', 'in_progress', 70, 'critical', 'monthly'),

-- CC7 - System Operations
(9, 1, 'CC7.1', 'System Operations - Capacity Management', 'The entity manages system capacity to meet processing requirements', 'Security', 'System Operations', 'preventive', 'implemented', 88, 'medium', 'monthly'),
(10, 1, 'CC7.2', 'System Operations - System Monitoring', 'The entity monitors system components and the operation of controls', 'Security', 'System Operations', 'detective', 'implemented', 92, 'high', 'daily');

-- Insert some sample ISO 27001 controls
INSERT OR IGNORE INTO compliance_controls (id, framework_id, control_id, title, description, category, subcategory, control_type, implementation_status, implementation_progress, risk_level, testing_frequency) VALUES
(11, 2, 'A.5.1', 'Information Security Policies', 'A set of policies for information security should be defined', 'Organizational', 'Information Security Policies', 'preventive', 'implemented', 95, 'critical', 'annually'),
(12, 2, 'A.6.1', 'Screening', 'Background verification checks on all candidates for employment should be carried out', 'People', 'Screening', 'preventive', 'implemented', 88, 'medium', 'annually'),
(13, 2, 'A.8.1', 'User Endpoint Devices', 'Information stored on, processed by or accessible via user endpoint devices should be protected', 'Technological', 'User Endpoint Devices', 'preventive', 'in_progress', 75, 'high', 'monthly'),
(14, 2, 'A.8.2', 'Privileged Access Rights', 'The allocation and use of privileged access rights should be restricted and managed', 'Technological', 'Access Management', 'preventive', 'implemented', 92, 'critical', 'monthly');

-- Insert sample evidence
INSERT OR IGNORE INTO compliance_evidence (id, title, description, file_name, evidence_type, status, tags) VALUES
(1, 'Information Security Policy v3.1', 'Updated information security policy covering all organizational requirements', 'InfoSec-Policy-v3.1.pdf', 'policy', 'current', '["security", "policy", "soc2", "iso27001"]'),
(2, 'Q4 2023 Access Review Report', 'Quarterly privileged access review and certification', 'Access-Review-Q4-2023.xlsx', 'report', 'current', '["access", "review", "soc2"]'),
(3, 'Employee Security Awareness Training Records', 'Training completion records for all employees', 'Security-Training-Records-2023.pdf', 'training_record', 'current', '["training", "awareness", "iso27001"]');