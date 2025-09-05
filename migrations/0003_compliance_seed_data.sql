-- Compliance Seed Data
-- Insert standard frameworks and controls

-- Insert Standard Compliance Frameworks
INSERT OR IGNORE INTO compliance_frameworks (id, name, version, description, type, status) VALUES 
(1, 'SOC 2 Type II', '2017', 'AICPA Service Organization Control 2 Type II - Trust Services Criteria', 'standard', 'active'),
(2, 'ISO 27001', '2022', 'ISO/IEC 27001:2022 Information Security Management Systems', 'standard', 'active'),
(3, 'NIST Cybersecurity Framework', '1.1', 'National Institute of Standards and Technology Cybersecurity Framework', 'standard', 'active'),
(4, 'GDPR', '2018', 'General Data Protection Regulation', 'regulatory', 'active');

-- SOC 2 Controls (Trust Services Criteria)
-- Security (Common Criteria)
INSERT OR IGNORE INTO compliance_controls (framework_id, control_id, title, description, category, subcategory, control_type, implementation_status, implementation_progress, risk_level, testing_frequency) VALUES
-- CC1 - Control Environment
(1, 'CC1.1', 'Control Environment - Integrity and Ethical Values', 'The entity demonstrates a commitment to integrity and ethical values', 'Security', 'Control Environment', 'preventive', 'implemented', 90, 'high', 'annually'),
(1, 'CC1.2', 'Control Environment - Board Independence', 'The board of directors demonstrates independence from management', 'Security', 'Control Environment', 'preventive', 'implemented', 85, 'medium', 'annually'),
(1, 'CC1.3', 'Control Environment - Management Philosophy', 'Management establishes structures, reporting lines, and authorities', 'Security', 'Control Environment', 'preventive', 'implemented', 95, 'high', 'annually'),
(1, 'CC1.4', 'Control Environment - Commitment to Competence', 'The entity demonstrates commitment to attract, develop, and retain competent individuals', 'Security', 'Control Environment', 'preventive', 'in_progress', 75, 'medium', 'annually'),

-- CC2 - Communication and Information
(1, 'CC2.1', 'Information and Communication - Quality Information', 'The entity obtains or generates and uses relevant, quality information', 'Security', 'Communication and Information', 'detective', 'implemented', 88, 'high', 'quarterly'),
(1, 'CC2.2', 'Information and Communication - Internal Communication', 'The entity internally communicates information necessary to support the functioning of internal control', 'Security', 'Communication and Information', 'preventive', 'implemented', 92, 'medium', 'quarterly'),
(1, 'CC2.3', 'Information and Communication - External Communication', 'The entity communicates with external parties regarding matters affecting internal control', 'Security', 'Communication and Information', 'preventive', 'implemented', 80, 'medium', 'quarterly'),

-- CC3 - Risk Assessment
(1, 'CC3.1', 'Risk Assessment - Objectives', 'The entity specifies objectives with sufficient clarity to enable identification and assessment of risks', 'Security', 'Risk Assessment', 'preventive', 'implemented', 85, 'high', 'annually'),
(1, 'CC3.2', 'Risk Assessment - Risk Identification', 'The entity identifies risks to achievement of objectives across the entity', 'Security', 'Risk Assessment', 'detective', 'implemented', 90, 'high', 'quarterly'),
(1, 'CC3.3', 'Risk Assessment - Fraud Risk', 'The entity considers the potential for fraud in assessing risks', 'Security', 'Risk Assessment', 'detective', 'in_progress', 70, 'high', 'quarterly'),
(1, 'CC3.4', 'Risk Assessment - Significant Changes', 'The entity identifies and assesses changes that could significantly impact internal control', 'Security', 'Risk Assessment', 'detective', 'implemented', 82, 'medium', 'quarterly'),

-- CC4 - Monitoring Activities
(1, 'CC4.1', 'Monitoring - Ongoing and Separate Evaluations', 'The entity selects, develops, and performs ongoing and separate evaluations', 'Security', 'Monitoring Activities', 'detective', 'implemented', 85, 'high', 'quarterly'),
(1, 'CC4.2', 'Monitoring - Deficiency Communication', 'The entity evaluates and communicates internal control deficiencies', 'Security', 'Monitoring Activities', 'corrective', 'implemented', 88, 'medium', 'quarterly'),

-- CC5 - Control Activities
(1, 'CC5.1', 'Control Activities - Selection and Development', 'The entity selects and develops control activities that contribute to mitigation of risks', 'Security', 'Control Activities', 'preventive', 'implemented', 90, 'high', 'quarterly'),
(1, 'CC5.2', 'Control Activities - Technology Controls', 'The entity selects and develops general control activities over technology', 'Security', 'Control Activities', 'preventive', 'implemented', 85, 'high', 'monthly'),
(1, 'CC5.3', 'Control Activities - Policies and Procedures', 'The entity deploys control activities through policies and procedures', 'Security', 'Control Activities', 'preventive', 'implemented', 92, 'medium', 'quarterly'),

-- CC6 - Logical and Physical Access Controls
(1, 'CC6.1', 'Logical Access - Access Rights Management', 'The entity implements logical access security software and infrastructure', 'Security', 'Logical Access', 'preventive', 'implemented', 95, 'critical', 'monthly'),
(1, 'CC6.2', 'Logical Access - Authentication', 'Prior to issuing system credentials, the entity registers and authorizes new internal and external users', 'Security', 'Logical Access', 'preventive', 'implemented', 88, 'high', 'monthly'),
(1, 'CC6.3', 'Logical Access - Access Reviews', 'The entity authorizes, modifies, or removes access to data, software, and system resources', 'Security', 'Logical Access', 'detective', 'implemented', 90, 'critical', 'monthly'),
(1, 'CC6.4', 'Physical Access - Facility Access', 'The entity restricts physical access to facilities and protected information assets', 'Security', 'Physical Access', 'preventive', 'implemented', 85, 'high', 'quarterly'),
(1, 'CC6.5', 'Physical Access - Asset Protection', 'The entity protects against unauthorized physical access to system resources', 'Security', 'Physical Access', 'preventive', 'implemented', 82, 'medium', 'quarterly'),

-- CC7 - System Operations
(1, 'CC7.1', 'System Operations - Capacity Management', 'The entity manages system capacity to meet processing requirements', 'Security', 'System Operations', 'preventive', 'implemented', 88, 'medium', 'monthly'),
(1, 'CC7.2', 'System Operations - System Monitoring', 'The entity monitors system components and the operation of controls', 'Security', 'System Operations', 'detective', 'implemented', 92, 'high', 'daily'),
(1, 'CC7.3', 'System Operations - Job Scheduling', 'The entity evaluates, documents, and manages system components', 'Security', 'System Operations', 'preventive', 'in_progress', 75, 'medium', 'monthly'),
(1, 'CC7.4', 'System Operations - Backup and Recovery', 'The entity implements backup and recovery procedures', 'Security', 'System Operations', 'corrective', 'implemented', 95, 'critical', 'monthly'),
(1, 'CC7.5', 'System Operations - System Disposal', 'The entity identifies, develops, and implements activities for the secure disposal of information', 'Security', 'System Operations', 'preventive', 'implemented', 80, 'medium', 'quarterly'),

-- CC8 - Change Management
(1, 'CC8.1', 'Change Management - Authorization', 'The entity authorizes, designs, develops, configures, documents, tests, approves, and implements changes', 'Security', 'Change Management', 'preventive', 'implemented', 90, 'high', 'monthly');

-- ISO 27001:2022 Controls (Sample - Key Controls)
-- Organizational Controls
INSERT OR IGNORE INTO compliance_controls (framework_id, control_id, title, description, category, subcategory, control_type, implementation_status, implementation_progress, risk_level, testing_frequency) VALUES
(2, 'A.5.1', 'Information Security Policies', 'A set of policies for information security should be defined', 'Organizational', 'Information Security Policies', 'preventive', 'implemented', 95, 'critical', 'annually'),
(2, 'A.5.2', 'Information Security Roles and Responsibilities', 'Information security roles and responsibilities should be defined and allocated', 'Organizational', 'Information Security Roles', 'preventive', 'implemented', 90, 'high', 'annually'),
(2, 'A.5.3', 'Segregation of Duties', 'Conflicting duties and areas of responsibility should be segregated', 'Organizational', 'Information Security Roles', 'preventive', 'implemented', 85, 'high', 'quarterly'),

-- People Controls  
(2, 'A.6.1', 'Screening', 'Background verification checks on all candidates for employment should be carried out', 'People', 'Screening', 'preventive', 'implemented', 88, 'medium', 'annually'),
(2, 'A.6.2', 'Terms and Conditions of Employment', 'The employment contracts should state the employees responsibilities for information security', 'People', 'Terms of Employment', 'preventive', 'implemented', 92, 'medium', 'annually'),
(2, 'A.6.3', 'Information Security Awareness, Education and Training', 'All employees and contractors should receive awareness education and training', 'People', 'Awareness and Training', 'preventive', 'in_progress', 75, 'medium', 'quarterly'),

-- Physical Controls
(2, 'A.7.1', 'Physical Security Perimeters', 'Security perimeters should be defined and used to protect areas containing information', 'Physical', 'Physical Security Perimeters', 'preventive', 'implemented', 90, 'high', 'quarterly'),
(2, 'A.7.2', 'Physical Entry', 'Secure areas should be protected by appropriate entry controls', 'Physical', 'Physical Entry', 'preventive', 'implemented', 88, 'high', 'monthly'),
(2, 'A.7.3', 'Protection Against Environmental Threats', 'Protection against environmental threats should be designed and implemented', 'Physical', 'Environmental Protection', 'preventive', 'not_applicable', 0, 'medium', 'quarterly'),

-- Technological Controls
(2, 'A.8.1', 'User Endpoint Devices', 'Information stored on, processed by or accessible via user endpoint devices should be protected', 'Technological', 'User Endpoint Devices', 'preventive', 'implemented', 85, 'high', 'monthly'),
(2, 'A.8.2', 'Privileged Access Rights', 'The allocation and use of privileged access rights should be restricted and managed', 'Technological', 'Access Management', 'preventive', 'implemented', 92, 'critical', 'monthly'),
(2, 'A.8.3', 'Information Access Restriction', 'Access to information and application system functions should be restricted', 'Technological', 'Access Management', 'preventive', 'implemented', 90, 'critical', 'monthly'),
(2, 'A.8.4', 'Access to Source Code', 'Read and write access to source code, development tools and software libraries should be managed', 'Technological', 'Access Management', 'preventive', 'implemented', 88, 'high', 'quarterly'),
(2, 'A.8.5', 'Secure Authentication', 'Secure authentication technologies and procedures should be implemented', 'Technological', 'Authentication', 'preventive', 'implemented', 95, 'critical', 'monthly'),
(2, 'A.8.6', 'Capacity Management', 'The use of resources should be monitored and tuned', 'Technological', 'System Management', 'detective', 'implemented', 80, 'medium', 'monthly');

-- Sample Evidence Records
INSERT OR IGNORE INTO compliance_evidence (id, title, description, file_name, evidence_type, status, tags) VALUES
(1, 'Information Security Policy v3.1', 'Updated information security policy covering all organizational requirements', 'InfoSec-Policy-v3.1.pdf', 'policy', 'current', '["security", "policy", "soc2", "iso27001"]'),
(2, 'Q4 2023 Access Review Report', 'Quarterly privileged access review and certification', 'Access-Review-Q4-2023.xlsx', 'report', 'current', '["access", "review", "soc2"]'),
(3, 'Employee Security Awareness Training Records', 'Training completion records for all employees', 'Security-Training-Records-2023.pdf', 'training_record', 'current', '["training", "awareness", "iso27001"]'),
(4, 'Data Center Physical Security Procedures', 'Physical security controls and procedures for data center access', 'DC-Physical-Security-Procedures.docx', 'procedure', 'current', '["physical", "datacenter", "soc2"]'),
(5, 'Incident Response Plan v2.0', 'Updated incident response procedures and escalation matrix', 'Incident-Response-Plan-v2.0.pdf', 'procedure', 'current', '["incident", "response", "soc2", "iso27001"]');

-- Map Evidence to Controls
INSERT OR IGNORE INTO control_evidence_mapping (control_id, evidence_id, relationship_type) VALUES
-- Information Security Policy maps to multiple controls
(1, 1, 'implements'), -- CC1.1
(2, 1, 'supports'),   -- CC1.2  
(28, 1, 'implements'), -- A.5.1 (ISO)

-- Access Review Report
(16, 2, 'validates'),  -- CC6.3
(31, 2, 'validates'),  -- A.8.2 (ISO)

-- Training Records
(33, 3, 'validates'),  -- A.6.3 (ISO)

-- Physical Security
(17, 4, 'implements'), -- CC6.4
(34, 4, 'implements'), -- A.7.1 (ISO)

-- Incident Response
(5, 5, 'supports'),    -- CC4.2
(28, 5, 'supports');   -- A.5.1 (ISO)