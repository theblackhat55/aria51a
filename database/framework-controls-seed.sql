-- Framework Controls Population Script
-- Generated from ISO 27001 and UAE ISR JSON data

-- Ensure frameworks exist
INSERT OR IGNORE INTO frameworks (name, code, version, description, effective_date, framework_type) VALUES 
('ISO/IEC 27001:2022', 'ISO27001', '2022', 'Information security management systems - Requirements', '2022-10-01', 'standard'),
('UAE Information Assurance Standard', 'UAE_ISR', '2.0', 'UAE Information Assurance Standard for Information Security Requirements', '2021-01-01', 'regulation');

-- ISO 27001:2022 Controls
-- Total controls: 93
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.1',
      'Policies for Information Security',
      'Organizational Controls',
      1,
      'high',
      'A 5.1.1',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.2',
      'Information Security Roles and Responsibilities',
      'General',
      1,
      'medium',
      'A 5.1.2',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.3',
      'Segregation of Duties',
      'General',
      1,
      'medium',
      'A 6.1.1',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.4',
      'Management Responsibilities',
      'General',
      1,
      'medium',
      'A 6.1.2',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.5',
      'Contact With Authorities',
      'General',
      1,
      'medium',
      'A 7.2.1',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.6',
      'Contact With Special Interest Groups',
      'General',
      1,
      'medium',
      'A 6.1.3',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.7',
      'Threat Intelligence',
      'General',
      1,
      'medium',
      'A 6.1.4',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.8',
      'Information Security in Project Management',
      'General',
      1,
      'medium',
      'NEW',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.9',
      'Inventory of Information and Other Associated Assets',
      'General',
      1,
      'medium',
      'A 6.1.5,  A 14.1.1',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.10',
      'Acceptable Use of Information and Other Associated Assets',
      'General',
      1,
      'medium',
      'A 8.1.1,  A 8.1.2',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.11',
      'Return of Assets',
      'General',
      1,
      'medium',
      'A 8.1.4',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.12',
      'Classification of Information',
      'General',
      0,
      'medium',
      'A 8.2.1',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.13',
      'Labelling of Information',
      'General',
      0,
      'medium',
      'A 8.2.2',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.14',
      'Information Transfer',
      'General',
      1,
      'medium',
      'A 13.2.1,  A 13.2.2,  A 13.2.3',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.15',
      'Access Control',
      'General',
      1,
      'medium',
      'A 9.1.1,  A 9.1.2',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.16',
      'Identity Management',
      'General',
      1,
      'medium',
      'A 9.2.1',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.17',
      'Authentication Information',
      'General',
      1,
      'medium',
      'A 9.2.4,  A 9.3.1,  A 9.4.3',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.18',
      'Access Rights',
      'General',
      1,
      'medium',
      'A 9.2.2,  A 9.2.5,  A 9.2.6',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.19',
      'Information Security in Supplier Relationships',
      'General',
      1,
      'medium',
      'A 15.1.1',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.20',
      'Addressing Information Security Within Supplier Agreements',
      'General',
      1,
      'medium',
      'A 15.1.2',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.21',
      'Managing Information Security in the ICT Supply Chain',
      'General',
      1,
      'medium',
      'A 15.1.3',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.22',
      'Monitoring, Review and Change Management of Supplier Services',
      'General',
      1,
      'medium',
      'A 15.2.1',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.23',
      'Information Security for Use of Cloud Services',
      'General',
      1,
      'medium',
      'A 15.2.2',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.24',
      'Information Security Incident Management Planning and Preparation',
      'General',
      1,
      'medium',
      'NEW',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.25',
      'Assessment and Decision on Information Security Events',
      'General',
      1,
      'medium',
      'A 16.1.1',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.26',
      'Response to Information Security Incidents',
      'General',
      1,
      'medium',
      'A 16.1.4',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.27',
      'Learning From Information Security Incidents',
      'General',
      1,
      'medium',
      'A 16.1.5',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.28',
      'Collection of Evidence',
      'General',
      1,
      'medium',
      'A 16.1.6',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.29',
      'Information Security During Disruption',
      'General',
      1,
      'medium',
      'A 16.1.7',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.30',
      'ICT Readiness for Business Continuity',
      'General',
      1,
      'medium',
      'NEW',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.31',
      'Legal, Statutory, Regulatory and Contractual Requirements',
      'General',
      1,
      'medium',
      'A 18.1.1,  A 18.1.5',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.32',
      'Intellectual Property Rights',
      'General',
      1,
      'medium',
      'A 18.1.2',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.33',
      'Protection of Records',
      'General',
      1,
      'medium',
      'A 18.1.3',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.34',
      'Privacy and Protection of PII',
      'General',
      1,
      'medium',
      'A 18.1.4',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.35',
      'Independent Review of Information Security',
      'General',
      1,
      'medium',
      'A 18.2.1',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.36',
      'Compliance With Policies, Rules and Standards for Information Security',
      'General',
      1,
      'medium',
      'A 18.2.2,  A 18.2.3',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 5.37',
      'Documented Operating Procedures',
      'General',
      1,
      'medium',
      'A 12.1.1',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 6.1',
      'Screening',
      'People Controls',
      1,
      'medium',
      'A 7.1.1',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 6.2',
      'Terms and Conditions of Employment',
      'General',
      1,
      'medium',
      'A 7.1.2',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 6.3',
      'Information Security Awareness, Education and Training',
      'General',
      1,
      'medium',
      'A 7.2.2',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 6.4',
      'Disciplinary Process',
      'General',
      1,
      'medium',
      'A 7.2.3',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 6.5',
      'Responsibilities After Termination or Change of Employment',
      'General',
      1,
      'medium',
      'A 7.3.1',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 6.6',
      'Confidentiality or Non-Disclosure Agreements',
      'General',
      1,
      'medium',
      'A 13.2.4',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 6.7',
      'Remote Working',
      'General',
      1,
      'medium',
      'A 6.2.2',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 6.8',
      'Information Security Event Reporting',
      'General',
      1,
      'medium',
      'A 16.1.2,  A 16.1.3',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 7.1',
      'Physical Security Perimeters',
      'Physical Controls',
      1,
      'medium',
      'A 11.1.1',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 7.2',
      'Physical Entry',
      'General',
      1,
      'medium',
      'A 11.1.2,  A 11.1.6',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 7.3',
      'Securing Offices, Rooms and Facilities',
      'General',
      1,
      'medium',
      'A 11.1.3',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 7.4',
      'Physical Security Monitoring',
      'General',
      1,
      'medium',
      'NEW',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 7.5',
      'Protecting Against Physical and Environmental Threats',
      'General',
      1,
      'medium',
      'A 11.1.4',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 7.6',
      'Working In Secure Areas',
      'General',
      1,
      'medium',
      'A 11.1.5',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 7.7',
      'Clear Desk and Clear Screen',
      'General',
      1,
      'medium',
      'A 11.2.9',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 7.8',
      'Equipment Siting and Protection',
      'General',
      1,
      'medium',
      'A 11.2.1',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 7.9',
      'Security of Assets Off-Premises',
      'General',
      1,
      'medium',
      'A 11.2.6',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 7.10',
      'Storage Media',
      'General',
      1,
      'medium',
      'A 8.3.1,  A 8.3.2,  A 8.3.3,  A 11.2.5',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 7.11',
      'Supporting Utilities',
      'General',
      1,
      'medium',
      'A 11.2.2',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 7.12',
      'Cabling Security',
      'General',
      1,
      'medium',
      'A 11.2.3',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 7.13',
      'Equipment Maintenance',
      'General',
      1,
      'medium',
      'A 11.2.4',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 7.14',
      'Secure Disposal or Re-Use of Equipment',
      'General',
      1,
      'medium',
      'A 11.2.7',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.1',
      'User Endpoint Devices',
      'Technological Controls',
      1,
      'high',
      'A 6.2.1,  A 11.2.8',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.2',
      'Privileged Access Rights',
      'General',
      1,
      'medium',
      'A 9.2.3',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.3',
      'Information Access Restriction',
      'General',
      1,
      'medium',
      'A 9.4.1',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.4',
      'Access to Source Code',
      'General',
      1,
      'medium',
      'A 9.4.5',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.5',
      'Secure Authentication',
      'General',
      1,
      'medium',
      'A 9.4.2',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.6',
      'Capacity Management',
      'General',
      1,
      'medium',
      'A 12.1.3',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.7',
      'Protection Against Malware',
      'General',
      1,
      'medium',
      'A 12.2.1',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.8',
      'Management of Technical Vulnerabilities',
      'General',
      1,
      'medium',
      'A 12.6.1,  A 18.2.3',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.9',
      'Configuration Management',
      'General',
      1,
      'medium',
      'NEW',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.10',
      'Information Deletion',
      'General',
      1,
      'medium',
      'NEW',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.11',
      'Data Masking',
      'General',
      1,
      'medium',
      'NEW',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.12',
      'Data Leakage Prevention',
      'General',
      1,
      'medium',
      'NEW',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.13',
      'Information Backup',
      'General',
      1,
      'medium',
      'A 12.3.1',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.14',
      'Redundancy of Information Processing Facilities',
      'General',
      1,
      'medium',
      'A 17.2.1',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.15',
      'Logging',
      'General',
      1,
      'medium',
      'A 12.4.1,  A 12.4.2,  A 12.4.3',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.16',
      'Monitoring Activities',
      'General',
      1,
      'medium',
      'NEW',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.17',
      'Clock Synchronization',
      'General',
      1,
      'medium',
      'A 12.4.4',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.18',
      'Use of Privileged Utility Programs',
      'General',
      1,
      'medium',
      'A 9.4.4',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.19',
      'Installation of Software on Operational Systems',
      'General',
      1,
      'medium',
      'A 12.5.1,  A 12.6.2',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.20',
      'Networks Security',
      'General',
      1,
      'medium',
      'A 13.1.1',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.21',
      'Security of Network Services',
      'General',
      1,
      'medium',
      'A 13.1.2',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.22',
      'Segregation of Networks',
      'General',
      1,
      'medium',
      'A 13.1.3',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.23',
      'Web filtering',
      'General',
      1,
      'medium',
      'NEW',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.24',
      'Use of Cryptography',
      'General',
      1,
      'medium',
      'A 10.1.1,  A 10.1.2',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.25',
      'Secure Development Life Cycle',
      'General',
      1,
      'medium',
      'A 14.2.1',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.26',
      'Application Security Requirements',
      'General',
      1,
      'medium',
      'A 14.1.2,  A 14.1.3',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.27',
      'Secure System Architecture and Engineering Principles',
      'General',
      1,
      'medium',
      'A 14.2.5',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.28',
      'Secure Coding',
      'General',
      1,
      'medium',
      'NEW',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.29',
      'Security Testing in Development and Acceptance',
      'General',
      1,
      'medium',
      'A 14.2.8,  A 14.2.9',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.30',
      'Outsourced Development',
      'General',
      1,
      'medium',
      'A 14.2.7',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.31',
      'Separation of Development, Test and Production Environments',
      'General',
      1,
      'medium',
      'A 12.1.4,  A 14.2.6',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.32',
      'Change Management',
      'General',
      1,
      'medium',
      'A 12.1.2,  A 14.2.2,  A 14.2.3,  A 14.2.4',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.33',
      'Test Information',
      'General',
      1,
      'medium',
      'A 14.3.1',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, section_name, applicable, 
      priority, legacy_ref, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'ISO27001'),
      'A 8.34',
      'Protection of Information Systems During Audit Testing',
      'General',
      1,
      'medium',
      'A 12.7.1',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );

-- UAE Information Assurance Standard Controls
-- Total controls: 81
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M1.1.1',
      'Understanding the entity and it''s context',
      'The entity shall determine external and internal factors that affect its ability to achieve the intended success of information security arrangements.',
      'Strategy and Planning',
      'M1',
      'Entity context and leadership',
      'M1.1',
      'M1.1.1.1 The entity shall determine interested parties that are relevant to its information security.
M1.1.1.2 The entity shall determine the requirements of these interested parties.
M1.1.1.3 The entity shall determine factors related to its sector or national context.
M1.1.1.4 The entity shall determine its internal capabilities.
M1.1.1.5 The entity shall determine its organizational structure.',
      1,
      'high',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M1.1.2',
      'Leadership and Management commitment',
      'The entity''s top management shall demonstrate leadership and commitment to information security.',
      NULL,
      NULL,
      'Entity context and leadership',
      NULL,
      'M1.1.2.1	Top management commitment shall ensure the information security policy and the information security objectives are established and are compatible with the strategic direction of the entity.
M1.1.2.2	Top management commitment shall ensure the integration of the information security requirements into the entity’s processes.
M1.1.2.3	Top management commitment shall ensure that the resources needed for information security are available.
M1.1.2.4	Top management commitment shall communicate the importance of the effectiveness of information security management.
M1.1.2.5	Top management commitment shall direct and support persons to contribute to the effectiveness of information security and conforming to the requirements of
these Standards.
M1.1.2.6	Top management commitment shall promote continual improvement.
M1.1.2.7	Top management commitment shall support other relevant management roles to demonstrate their leadership as it applies to their areas of responsibility.
M1.1.2.8	Top management commitment shall give direction to and participating in reviews of information security, including risks, controls and effectiveness, on a high level.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M.1.2.2',
      'Supporting policies for information security',
      'The entity shall establish and communicate a set of supporting policies for information security.',
      NULL,
      NULL,
      'Information Security Policy',
      'M1.2',
      'M1.2.2.1	The set of supporting information security polices shall be defined, approved, published and communicated to employees and relevant external parties.
M1.2.2.2	The set of supporting information security polices shall address all aspects of information security that are included in this Standard, based on the risk assessment.
M1.2.2.3	The set of supporting information security polices shall address sector-specific regulations and standards.
M1.2.2.4	The set of supporting information security polices shall be suitable to the entity and shall have a clearly identified audience.
M1.2.2.5	The set of supporting information security polices shall reflect the implementation the entity has chosen and shall not include any statements the entity does not comply with.
M1.2.2.6	The set of supporting information security polices shall include commitment of the Top Management.
M1.2.2.7	The set of supporting information security polices shall be documented
M1.2.2.8	The set of supporting information security polices shall be maintained, reviewed and updated at planned intervals or if significant changes occur.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M.1.3.5',
      'Identification of risks related to external parties',
      'The entity shall identify and properly manage the risks related to its information and information systems from business processes involving external parties',
      NULL,
      NULL,
      'Organization of Information Security',
      'M1.3',
      'M1.3.5.1	The entity shall identify risks to its information and information systems and implement the appropriate controls before granting access to any external party.
M1.3.5.2	The entity shall define an external party access policy.
M1.3.5.3	The entity shall identify and adopt proper controls to limit physical and logical access to information assets and entity information systems.
M1.3.5.4	The entity shall monitor external party access to entity information and entity information systems.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M.1.3.6',
      'Addressing security when dealing with customers',
      'The entity shall address all identified security requirements before giving customers access to the entity’s information or assets.',
      NULL,
      NULL,
      NULL,
      NULL,
      'M1.3.6.1	The entity shall make sure that any customer accessing entity information and information systems are compliant with the entity’s information security policy and security requirements.
M1.3.6.2	The entity shall monitor any customer access and verify compliance to agreed access control policy.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M.1.4.1',
      'Resources',
      'The entity shall determine and provide the appropriate resources needed for the entity’s information security continual improvement',
      NULL,
      NULL,
      'Support',
      'M.1.4',
      'M1.4.1.1	The entity shall determine the necessary competence of person(s) doing work under its control that affects its information security performance.
M1.4.1.2	The entity shall ensure that these persons are competent on the basis of appropriate education, training, or experience.
M1.4.1.3	The entity shall where applicable, take actions to acquire the necessary competence, and evaluate the effectiveness of the actions taken.
M1.4.1.4	The entity shall retain appropriate documented information as evidence of competence.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M.1.4.2',
      'Internal and External Communication',
      'The entity shall determine the plan and mechanism for internal and external communications in support of its information security.',
      NULL,
      NULL,
      NULL,
      NULL,
      'M1.4.2.1	The entity shall determine:
     A. On what to communicate
     B. When to communicate
     C. With whom to communicate
     D. Who shall communicate
     E. The processes by which communication shall be effected.
M1.4.2.2	The entity shall ensure that adequate communication can be maintained with the designated UAE Government entities.
M1.4.2.3	The entity shall document the communication plan.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M.1.4.3',
      'Documentation',
      'The entity shall maintain, protect, and control documentation of its information security controls and their implementation.',
      NULL,
      NULL,
      NULL,
      NULL,
      'M1.4.3.1	The entity shall ensure that documents are approved prior to issue.
M1.4.3.2	The entity shall ensure that documents are reviewed and updated as necessary.
M1.4.3.3	The entity shall ensure that changes and the current revision status of documents are identified.
M1.4.3.4	The entity shall ensure that documents remain legible and readily identifiable
M1.4.3.5	"The entity shall ensure that documents are available to those who need them, are transferred, and stored in accordance with the procedures applicable to
their classification."
M1.4.3.6	The entity shall ensure that documents are disposed of in accordance with the procedures applicable to their classification.
M1.4.3.7	The entity shall ensure that documents of external origin are identified.
M1.4.3.8	The entity shall ensure that the distribution of documents is controlled.
M1.4.3.9	The entity shall ensure that the unintended use of obsolete documents is prevented, and that up to date versions are available.
M1.4.3.10	The entity shall ensure that suitable identification is applied to documents if they are retained for any purpose.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M.2.1.1',
      'Information Security Risk Management Policy',
      'The entity shall establish a formal information security risk management policy',
      'Information Security Risk Management Policy',
      'M2',
      'Information Security Risk Management Policy',
      'M.2.1',
      'M2.1.1.1	The information security risk management policy shall take into account relevant NESA’s issuances in regard to risk management.
M2.1.1.2	The information security risk management policy shall be documented and formally approved.
M2.1.1.3	The information security risk management policy shall addresses the purpose and scope of critical services and their supporting functions.
M2.1.1.4	The information security risk management policy shall categorize Information Asset based on its criticality.
M2.1.1.5	The information security risk management policy shall addresses roles and responsibilities of the risk assessment team involved.
M2.1.1.6	The information security risk management policy shall establish and maintain information security basic criteria, including the risk acceptance criteria, impact criteria, and risk evaluation criteria.
M2.1.1.7	The information security risk management policy shall contain a risk treatment strategy.
M2.1.1.8	The information security risk management policy shall contain a risk monitoring and review strategy.
M2.1.1.9	The information security risk management policy shall determine the criteria for performing, reviewing and updating information security risk assessments.
M2.1.1.10	The information security risk management policy shall ensure that repeated information security risk assessments produce consistent, valid and comparable results.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M2.2.1',
      'Information security risk identification',
      'The entity shall identify its information security risks.',
      NULL,
      NULL,
      'Information Security Risk Assessment',
      'M2.2',
      'M2.2.1.1	The entity shall Apply the information security risk assessment process to identify risks associated with the loss of confidentiality, integrity and availability for its information by:
A. Define the scope of the risk assessment exercise
B. Identify critical business functions
C. Identify critical information systems supporting business critical functions within the scope and boundary of the risk assessment
D. Identifying vulnerabilities related to the information and information systems. (see also T 7.7)
E. Identify existing information security controls
F. dentifying threats and threat sources
M2.2.1.2	The entity shall identify the risk owners.
M2.2.1.3	The entity shall document the results of the risk identification.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M2.2.2',
      'Information security risk analysis',
      'The entity shall analyze its information security risks.',
      NULL,
      NULL,
      NULL,
      NULL,
      'M2.2.2.1	The entity shall assess the potential consequences that would result if the identified risks were to materialize by assessing the consequences of losses of confidentiality, integrity or availability.
M2.2.2.2	The entity shall assess the realistic likelihood of the occurrence of the identified risks based on the existing controls, identified vulnerabilities and threats.
M2.2.2.3	The entity shall determine the levels of risk.
M2.2.2.4	The entity shall document the results of the risk analysis.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M2.2.3',
      'Information security risk evaluation analysis',
      'The entity shall evaluate its information security risks.',
      NULL,
      NULL,
      NULL,
      NULL,
      'M2.2.3.1	The entity shall compare the analyzed risks with the risk criteria established in the information security risk management policy (See M2.1.1).
M2.2.3.2	The entity shall establish priorities for treatment of the identified risks.
M2.2.3.3	The entity shall document the results of the risk evaluation and share with national and sector authorities, as required.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M2.3.1',
      'Information security risk treatment options',
      'The entity shall select appropriate information security risk treatment options, taking account of the risk assessment results.',
      NULL,
      NULL,
      'Information Security Risk Assessment',
      'M2.3',
      'M2.3.1.1	The entity shall consider the following risk treatment options and select one or more of them for each of the risks that have
been assessed:
A. Risk Reduction – Reducing the risk by applying security controls
B. Risk Retention – Accepting the risk based on the entity’s risk
accepting criteria established on the information management
risk policy (See M2.1.1)
C. Risk Avoidance – Avoiding the activity or condition causing the risk
D. Risk Transfer – Transferring the risk to another party
M2.3.1.2	The entity shall assess the risk treatment chosen to ensure that the selection of risk treatment options is successful by:
E. Deciding whether residual risk levels are tolerable
F. f not tolerable, generating a new risk treatment
G. Assessing the effectiveness of that treatment (see also M2.3)',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M2.3.2',
      'Identification of Controls',
      'The entity shall identify all controls that are necessary to implement the information security risk treatment option(s) chosen.',
      NULL,
      NULL,
      NULL,
      NULL,
      'M2.3.2.1	The entity shall consider the controls included in these Standards as a starting point for the control identification.
M2.3.2.2	The entity shall ensure that no controls are overlooked by producing the Statement of Applicability (refer to M2.3.4).
M2.3.2.3	The entity shall identify controls in addition to the controls suggested in this Standard that are specific to the entity.
M2.3.2.4	The entity shall take account of the criteria for accepting risks (refer to M2.3.1) as well as legal, regulatory and contractual requirements when making the control selection.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M2.3.3',
      'Risk treatment plan',
      'The entity shall formulate a risk treatment plan..',
      NULL,
      NULL,
      NULL,
      NULL,
      'M2.3.3.1	The risk treatment plan shall identify:
A. Appropriate management actions
B. Resources required
C. Responsibilities and priorities for managing information security risks
D. Target dates for implementation of the identified controls
M2.3.3.2	The entity shall document the risk treatment plan.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M2.3.4',
      'Statement of applicability',
      'The entity shall compare the controls identified in M2.3.2 above with the “risk-based applicable” controls contained in this Standard and shall verify that no necessary controls have been omitted.',
      NULL,
      NULL,
      NULL,
      NULL,
      'M2.3.4.1	The entity shall produce and document a Statement of Applicability
that contains the controls that have been identified as necessary.
M2.3.4.2	The entity shall produce and document a Statement of Applicability
that contains reasons for identification of these controls.
M2.3.4.3	The entity shall produce and document a Statement of Applicability
that contains their current status of implementation.
M2.3.4.4	The entity shall produce and document a Statement of Applicability
that contains justification for exclusion of any of the “risk-based applicable” controls contained in these Standards.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M2.3.5',
      'Information security objectives',
      'The entity shall establish information security objectives at relevant to its functions and levels.',
      NULL,
      NULL,
      NULL,
      NULL,
      'M2.3.5.1	The information security objectives shall:
     A. Be consistent with the information security policy
     B. Be measurable (if practicable)
     C. Take into account applicable information security requirements, and risk assessment and treatment results
     D. Be communicated within the entity
     E. Be updated as appropriate
     F. Be documented.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M2.4.1',
      'Risk monitoring and review',
      'The entity shall plan and document the process for the review and update of the risk assessment and treatment; this shall include planned reviews and updates as well as ad hoc updates if significant changes occur.',
      NULL,
      NULL,
      'Ongoing Information Security Risk Management',
      'M2.4',
      'M2.4.1.1	The entity’s monitoring and review processes shall encompass all aspects of the risk management process and shall take account of changes in:
     A. The entity itself
     B. Technology used
     C. Business objectives and processes
     D. Risk criteria and the risk assessment process
     E. Assets and consequences of losses of confidentiality, integrity
or availability
     F. Identified threats;
     G. Identified vulnerabilities
     H. Effectiveness of the implemented controls
     I. External events, such as changes to the legal or regulatory environment, changed contractual obligations, and changes in social climate.
M2.4.1.2	The entity shall monitor security incidents (see T8.3.2, T8.3.3) that might trigger the risk assessment process. (see M2.2.1).
M2.4.1.3	Responsibilities for monitoring and review shall be clearly defined
and documented.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M2.4.2',
      'Risk communication and consultation',
      'The entity shall communicate and consult risk information obtained from risk management activities with all stakeholders involved.',
      NULL,
      NULL,
      'Ongoing Information Security Risk Management',
      NULL,
      'M2.4.2.1	The entity shall Establish a risk communication plan for communicating risk information with key stakeholders including decision-makers within the entity during all stages of the risk management process.
M2.4.2.2	The entity shall Take into account all NESA’s issuances with regard to risk management',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M.3.1.1',
      'Awareness and Training policy',
      'The entity shall develop and maintain an awareness and training policy.',
      'Awareness and Training',
      'M3',
      'Awareness and Training policy',
      'M3.1',
      'M3.1.1.1	The awareness and training policy shall be appropriate to the purpose of the entity.
M3.1.1.2	The awareness and training policy shall provide the framework for setting awareness and training objectives.
M3.1.1.3	The awareness and training policy shall facilitate the implementation of the associated controls.
M3.1.1.4	The awareness and training policy shall outline the roles and responsibilities of providers and recipients of awareness and training activities.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M.3.2.1',
      'Awareness and training program',
      'The entity shall develop and maintain an awareness and training program.',
      NULL,
      NULL,
      'Awareness and Training planning',
      'M3.2',
      'M3.2.1.1	The awareness and training program shall inform persons doing work under the entity of their contribution to the effectiveness of information security and the implications of not conforming to the information security requirements.
M3.2.1.2	The entity shall determine the necessary competencies for personnel performing work effecting information security.
M3.2.1.3	The entity shall provide training or taking other actions (e.g. employing competent personnel) to satisfy these needs.
M3.2.1.4	The entity shall evaluate the effectiveness of the actions taken.
M3.2.1.5	The entity shall maintain records of education, training, skills, experience and qualifications.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M.3.3.3',
      'Training execution',
      'The entity shall conduct security training following an established plan.',
      NULL,
      NULL,
      'Security Training',
      'M.3.3',
      'M3.3.3.1	The entity shall ensure that information security training proceeds according to the implementation plan.
M3.3.3.2	The entity shall identify alternative information security training solutions if problems with the implementation plan arise.
M3.3.3.3	The entity shall ensure the updated implementation plan satisfies all of the information security training needs identified.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M.3.3.4',
      'Training results',
      'The entity shall measure and evaluate security training effectiveness.',
      NULL,
      NULL,
      NULL,
      NULL,
      'M3.3.4.1	The entity shall measure the level of information security knowledge and skills in the entity before and after the training plan is implemented.
M3.3.4.2	The entity shall ensure that the information security training solutions implemented are meeting the expected outcomes against the knowledge requirements of the entity.
M3.3.4.3	The entity shall take corrective action to improve or replace training solutions that are not reaching the expected outcome.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M.3.3.5',
      'Records documentation',
      'The entity shall maintain training records of all security personnel.',
      NULL,
      NULL,
      NULL,
      NULL,
      'M3.3.5.1	The entity shall ensure that each target for information security training has a documented training record.
M3.3.5.2	The entity shall ensure that all training activities are captured in the individual training records containing personnel education, training, skills, experience and qualifications.
M3.3.5.3	The entity shall review training records periodically to ensure all stakeholders have completed the necessary training.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M.3.4.1',
      'Awareness campaign',
      'The entity shall plan and conduct a security awareness campaign.',
      NULL,
      NULL,
      NULL,
      NULL,
      'M3.4.1.1	The entity shall define the scope of the awareness campaign in terms of targets and content based on security risks relevant to users’ activities.
M3.4.1.2	The entity shall provide a timeline for deploying specific awareness campaigns to meet the program objectives.
M3.4.1.3	The entity shall ensure that information security campaigns proceed according to the defined program timeline.
M3.4.1.4	The entity shall identify alternative information security awareness campaigns if problems with the program timeline arise.
M3.4.1.5	The entity shall ensure the updated information security awareness campaign satisfies all of the program objectives and needs identified.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M.4.1.1',
      'Human Resources Security Policy',
      'The entity shall develop and maintain a human resources security policy and associated security controls.',
      'Human Resources Security',
      'M4',
      'Human Resources Security Policy',
      'M.4.1',
      'M4.1.1.1	The entity shall establish and maintain a human resources security policy that outlines roles and responsibilities of different stakeholders, and procedures to facilitate the implementation of the associated controls.
M4.1.1.2	The entity shall identify and implement associated controls.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M.5.1.1',
      'Compliance Policy',
      'The entity shall develop and maintain a compliance policy with which the entity must be compliant at the entity, sector, and national levels.',
      'Compliance',
      'M5',
      'Compliance Policy',
      'M.5.1',
      'M5.1.1.1	The compliance policy shall be appropriate to the purpose of the entity.
M5.1.1.2	The compliance policy shall outline the roles and responsibilities for establishing compliance requirements.
M5.1.1.3	The compliance policy shall outline the approach for establishing compliance requirements.
M5.1.1.4	The compliance policy shall outline the approach the entity will follow to ensure compliance with the identified requirements at the entity, sector, and national levels.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M.5.2.5',
      'Prevention of misuse of information systems',
      'The entity shall deter users from using information systems for unauthorized purposes.',
      NULL,
      NULL,
      'Compliance with information security legal requirements',
      'M.5.2',
      'M5.2.5.1	The entity shall clearly communicate to all stakeholders what is considered to be authorized use of information systems.
M5.2.5.2	The entity shall develop the capability to monitor information systems for unauthorized use.
M5.2.5.3	The entity shall take corrective action to stop unauthorized use of information systems when detected.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M.5.2.7',
      'Liability to the information sharing',
      'The entity shall ensure that liability issues and remediation are clarified, understood and approved by all members of an information sharing community, to address situations in which information is intentionally or unintentionally disclosed.',
      NULL,
      NULL,
      NULL,
      NULL,
      'M5.2.7.1	The entity shall identify any liability issues and remediation requirements regarding unauthorized disclosure of information in all information sharing communities in which the entity participates.
M5.2.7.2	The entity shall define specific remediation procedures for each relevant information sharing community.
M5.2.7.3	The entity shall communicate to the relevant information sharing community any issues identified regarding remediation procedures.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M.5.5.2',
      'Protection of information systems audit tools',
      'The entity shall protect access to information systems audit tools to prevent any possible misuse or compromise.',
      NULL,
      NULL,
      'Information Systems Audit Considerations',
      'M.5.5',
      'M5.5.2.1	The entity shall identify all information systems audit tools.
M5.5.2.2	The entity shall identify the types and classification levels of information stored in information systems audit tools.
M5.5.2.3	The entity shall define minimum security requirements for information systems audit tools commensurate to the classification levels of the information held.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M.5.5.3',
      'Audit of community functions',
      'The entity shall specify the audit rights of members to the information sharing community to which it is connected to.',
      NULL,
      NULL,
      NULL,
      NULL,
      'M5.5.3.1	The entity shall identify the audit rights of any information sharing communities to which it is connected.
M5.5.3.2	The entity shall ensure that provisions for external members are accounted for in the entity’s information systems audit plan and tools.
M5.5.3.3	The entity shall ensure that provisions for the entity to exercise its audit rights are accounted for in the entity’s information systems audit plan
and tools.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M.6.1.1',
      'Performance Evaluation Policy',
      'The entity shall have a policy for performance evaluation that sets the framework for all performance evaluations that take place in the entity.',
      'Performance Evaluation and Improvement',
      'M6',
      'Performance Evaluation Policy',
      'M.6.1',
      'M6.1.1.1	The entity shall develop and implement a performance evaluation policy that determines the overall framework for performance evaluation.
M6.1.1.2	The entity shall develop and implement a performance evaluation policy that determines the methods of reporting the performance evaluation results to management.
M6.1.1.3	The entity shall develop and implement a performance evaluation policy that determines how to integrate the detailed performance measurements for controls with higher level performance measurements for information security objectives, risk management, etc.
M6.1.1.4	The entity shall develop and implement a performance evaluation policy that determines how to integrate incident reports in the overall picture of performance monitoring.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M.6.2.1',
      'Monitoring, measurement, analysis and evaluation',
      'The entity shall monitor and evaluate the information security performance and the effectiveness of the information security management system.',
      NULL,
      NULL,
      'Performance Evaluation',
      'M.6.2',
      'M6.2.1.1	The entity shall determine:
     A. What needs to be monitored and measured, including information security processes and controls
     B. The methods for monitoring, measurement, analysis and evaluation, as applicable, to ensure valid results
     C. When the monitoring and measuring shall be performed
     D. Who shall monitor and measure
     E. When the results from monitoring and measurement shall be
analyzed and evaluated
     F. Who shall analyze and evaluate these results.
M6.2.1.2	The entity shall document the monitoring and measurement methods and results.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M.6.3.1',
      'Corrective action',
      'The entity shall correct any nonconformity with these Standards..',
      NULL,
      NULL,
      'Improvement',
      'M.6.3',
      'M6.3.1.1	The entity shall evaluate the need for action to eliminate the causes of nonconformities, in order that it does not recur or occur elsewhere, by:
     A. Reviewing the nonconformity
     B. Determining the causes of the nonconformity
     C. Determining if similar nonconformities exist, or could
potentially occur.
M6.3.1.2	The entity shall implement the appropriate action needed to the effects of the encountered nonconformities.
M6.3.1.3	The entity shall review the effectiveness of any corrective action taken.
M6.3.1.4	The entity shall document the corrective actions taken against the nonconformities.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'M.6.3.2',
      'Continual Improvement',
      'The entity shall continually improve the information security program in place.',
      NULL,
      NULL,
      NULL,
      NULL,
      'M6.3.2.1	The entity shall improve the suitability, adequacy and effectiveness of information security controls in place.
M6.3.2.2	The entity shall take account of the performance measurement results and incidents when identifying improvements.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.1.1.1',
      'Asset Management Policy',
      'The entity shall establish an asset management policy.',
      'Asset Management',
      'T1',
      'Asset Management Policy',
      'T1.1',
      'T1.1.1.1	The asset management policy shall be appropriate to the complexity of the entity and to the assets managed by the entity.
T1.1.1.2	The asset management policy shall include statement of the management commitment, purpose, objective and scope of the policy.
T1.1.1.3	The asset management policy shall outline the roles and responsibilities.
T1.1.1.4	The asset management policy shall provide the framework for managing the entity’s assets, including assignment of owners.
T1.1.1.5	The asset management policy shall provide the framework for managing Bring Your Own Device (BYOD) arrangements.
T1.1.1.6	The asset management policy shall be documented and communicated to all users.
T1.1.1.7	The asset management policy shall be read and acknowledged formally by all users.
T1.1.1.8	The asset management policy shall be maintained, reviewed and updated at planned intervals or if significant changes occur.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.1.2.4',
      'Acceptable bring your own devices (BYOD) arrangements',
      'The entity shall develop rules for the acceptable use of information assets associated with BYOD arrangements.',
      NULL,
      NULL,
      'Responsibility for assets',
      'T.1.2',
      'T1.2.4.1	The entity shall establish the rules for the acceptable use of personal assets that are used on the entity’s environment.
T1.2.4.2	The entity shall adapt rules to the different roles (management, users, administrators, operators, contractors, etc.).
T1.2.4.3	The entity shall ensure circulation and acceptance of the rules by employees, contractors and third parties.
T1.2.4.4	The entity shall measure compliance with these rules.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.1.3.1',
      'Classification of information',
      'The entity shall develop a classification scheme for its information.',
      NULL,
      NULL,
      'Information Classification',
      'T.1.3',
      'T1.3.1.1	The classification shall include an information classification scheme based on information value, legal requirements, sensitivity, and criticality to the entity.
T1.3.1.2	The classification shall include the degree of protection required for each category.
T1.3.1.3	The information classification scheme shall ensure information classification based on the established levels and mapped to accountable owners.
T1.3.1.4	The information classification scheme shall ensure an up-to-date information classification in accordance with changes of their value, sensitivity and criticality through their life-cycle.
T1.3.1.5	The information classification scheme shall ensure the possibility to be accessed by automated systems to enforce specific protections based on the classification level.
T1.3.1.6	The information classification scheme shall ensure sufficient information regarding physical assets (locations, data centers, networks, systems, storage, etc.) used to store, process or transmit information assets is provided.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.2.1.1',
      'Physical and Environmental Security Policy',
      'The entity shall develop and maintain a physical and environmental security policy to ensure appropriate physical protection of assets.',
      'Physical and Environment Security',
      'T2',
      'Physical and Environmental Security Policy',
      'T.2.1',
      'T2.1.1.1	The physical and environmental security policy shall be appropriate to the purpose of the entity.
T2.1.1.2	The physical and environmental security policy shall include statement of the management commitment, purpose, objective and scope of the policy.
T2.1.1.3	The physical and environmental security policy shall outline the roles and responsibilities for the physical and environmental security.
T2.1.1.4	The physical and environmental security policy shall consider the Information Assets classification and their physical location (storage, processing, transfer).
T2.1.1.5	The physical and environmental security policy shall be documented and communicated to all users.
T2.1.1.6	The physical and environmental security policy shall be read and acknowledged formally by all users.
T2.1.1.7	The physical and environmental security policy shall be maintained, reviewed and updated at planned intervals or if significant changes occur.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.3.1.1',
      'Operations Management Policy',
      'The entity shall establish an operations management policy.',
      'Operations Management',
      'T3',
      'Operations Management Policy',
      'T.3.1',
      'T3.1.1.1	The Operations Management Policy shall be appropriate to the purpose of the entity
T3.1.1.2	The Operations Management Policy shall provide the framework for managing the operations of systems, processes, and controls related to information security.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.3.2.1',
      'Common systems configuration guidelines',
      'The entity shall develop recommended configuration settings for common information technology products.',
      NULL,
      NULL,
      'Operational Procedures and Responsibilities',
      'T.3.2',
      'T3.2.1.1	The guidelines shall identify common information technology products used within the entity.
T3.2.1.2	The guidelines shall define minimum security configurations to be employed in
each product.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.3.6.1',
      'Monitoring policy and procedures',
      'The entity shall establish a monitoring policy and related procedures.',
      NULL,
      NULL,
      'Monitoring',
      'T.3.6',
      'T3.6.1.1	The monitoring policy and related procedures shall outline what system aspects shall be monitored, how they shall be monitored, and how often they shall be monitored.
T3.6.1.2	The monitoring policy and related procedures shall assign responsibility for monitoring activities.
T3.6.1.3	The monitoring policy and related procedures shall define how information from monitoring activities will be fed into the incident response process.
T3.6.1.4	The monitoring policy and related procedures shall account for any sector or national requirements regarding information to be shared with external entities.
T3.6.1.5	The monitoring policy and related procedures shall be documented.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.3.6.3',
      'Monitoring system use',
      'The entity shall monitor the use of information systems.',
      NULL,
      NULL,
      NULL,
      NULL,
      'T3.6.3.1	The entity shall identify all types of system use to be monitored.
T3.6.3.2	The entity shall identify minimum information gathering requirements for each monitoring activity.
T3.6.3.3	The entity shall define minimum frequency requirements for reviewing information gathered from monitoring activities.
T3.6.3.4	The entity shall ensure information gathered from monitoring activities is reviewed by personnel with appropriate training and skills.
T3.6.3.5	The entity shall define minimum time requirements for maintaining information gathered from monitoring activities.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.3.6.6',
      'Fault logging',
      'The entity shall log faults related to information processing or communication.',
      NULL,
      NULL,
      NULL,
      NULL,
      'T3.6.6.1	The entity shall identify all faults to be captured in fault logs.
T3.6.6.2	The entity shall identify minimum information requirements for each fault to be captured.
T3.6.6.3	The entity shall define minimum frequency requirements for reviewing fault logs.
T3.6.6.4	The entity shall ensure fault logs are reviewed and analyzed by personnel with appropriate training and skills.
T3.6.6.5	The entity shall define minimum time requirements for maintaining fault logs.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.4.1.1',
      'Communications Policy',
      'The entity shall establish a communications policy to guide the protection of information in transit.',
      'Communications',
      'T4',
      'Communications Policy',
      'T.4.1',
      'T4.1.1.1	The communications policy shall be appropriate to the purpose of the entity.
T4.1.1.2	The communications policy shall include statement of the management commitment, purpose, objective and scope of the policy.
T4.1.1.3	The communications policy shall outline the roles and responsibilities.
T4.1.1.4	The communications policy shall provide the framework to protect information in transit from interception, copying, modification, mis-routing, destruction, and other unauthorized activities.
T4.1.1.5	The communications policy shall be documented and communicated to all users.
T4.1.1.6	The communications policy shall be read and acknowledged formally by all users.
T4.1.1.7	The communications policy shall be maintained, reviewed and updated at planned intervals or if significant changes occur.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.4.2.5',
      'Business information systems',
      'The entity shall develop policies and procedures to protect information transferred across business information systems.',
      NULL,
      NULL,
      'Information Transfer',
      'T.4.2',
      'T4.2.5.1	The policies and procedures shall identify all points of interconnection between business information systems.
T4.2.5.2	The policies and procedures shall identify the types of information to be protected regarding the identified interconnections.
T4.2.5.3	The policies and procedures shall identify appropriate security measures to be taken to protect each type of information.
T4.2.5.4	The policies and procedures shall be documented, maintained, reviewed and updated at planned intervals or if significant changes occur.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.4.3.1',
      'Electronic commerce',
      'The entity shall protect information involved in electronic commerce passing over public networks from fraudulent activity, contract dispute, and unauthorized disclosure and modification.',
      NULL,
      NULL,
      'Electonic Commerce Services',
      'T.4.3',
      'T4.3.1.1	The entity shall identify all instances of electronic commerce within the entity that require passing information over public networks.
T4.3.1.2	The entity shall identify appropriate security measures for information passing over public networks based on the risk assessment.
T4.3.1.3	The entity shall ensure security requirements are captured in service agreements with e-commerce partners.
T4.3.1.4	The entity shall monitor e-commerce activities for on-going compliance with security requirements.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.4.3.3',
      'Publicly available information',
      'The entity shall protect information being made available on a publicly available system against unauthorized modification.',
      NULL,
      NULL,
      NULL,
      NULL,
      'T4.3.3.1	The entity shall identify all information to be made available on a publicly available system.
T4.3.3.2	The entity shall define security requirements for information to be made available on a publicly available system based on the risk assessment.
T4.3.3.3	The entity shall monitor information being made available on publicly available systems for unauthorized modification.
T4.3.3.4	The entity shall ensure that all public information is sanitized and approved.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.4.4.1',
      'Connectivity to information sharing platforms',
      'The entity shall ensure that connectivity to information sharing platforms should be secured.',
      NULL,
      NULL,
      'Information Sharing Protection',
      'T.4.4',
      'T4.4.1.1	The entity shall identify all relevant information sharing platforms to which the entity will connect.
T4.4.1.2	The entity shall determine the security requirements for connecting to identified platforms.
T4.4.1.3	The entity shall identify specific controls needed to meet the security requirements for each information sharing platform.
T4.4.1.4	The entity shall develop the capabilities needed for secure connectivity to any required sector, national, or international information
sharing communities.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.4.4.2',
      'Information released into information sharing communities',
      'The entity shall follow the format, classification, and treatment requirements of the information sharing community for information released into information sharing communities.',
      NULL,
      NULL,
      NULL,
      NULL,
      'T4.4.2.1	For each connected information sharing platform, the entity shall identify all information to be released into the information sharing community utilizing the platform.
T4.4.2.2	For each connected information sharing platform, the entity shall implement minimum format, classification, and treatment requirements as outlined by the platform manager.
T4.4.2.3	For each connected information sharing platform, the entity shall identify and implement any additional security requirements needed to protect the released information in line with the entity’s risk assessment.
T4.4.2.4	For each connected information sharing platform, the entity shall develop the capabilities needed to share information securely within any required sector, national or international information sharing communities.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.4.5.1',
      'Network controls',
      'The entity shall ensure that all networks are adequately managed, controlled, and protected.',
      NULL,
      NULL,
      'Network Security Management',
      'T.4.5',
      'T4.5.1.1	The entity shall identify all network components and interconnectivity between them.
T4.5.1.2	The entity shall document and maintain network diagram that includes all network components as well as their connections.
T4.5.1.3	The entity shall perform a risk assessment on individual network components and the network as a whole to identify vulnerabilities requiring action.
T4.5.1.4	The entity shall identify and implement specific network controls needed to mitigate the vulnerabilities identified.
T4.5.1.5	The entity shall continually monitor the in-place controls for efficiency and effectiveness.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.4.5.4',
      'Security of wireless networks',
      'The entity shall ensure that all wireless networks are adequately secured.',
      NULL,
      NULL,
      NULL,
      NULL,
      'T4.5.4.1	The entity shall undertake and document a site survey to determine the optimal physical locations to avoid stray signal leaking too far outside of the entity’s physical perimeter.
T4.5.4.2	The entity shall identify criteria for grouping information services, users, and information systems into different groups that facilitate segregation on wireless networks.
T4.5.4.3	The entity shall for each wireless network, identify the security controls that should be in place based on the required protection level of the information services, users, and information systems it supports.
T4.5.4.4	The entity shall periodically evaluate the effectiveness of implemented segregation strategies and identify areas for improvement.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.5.4.2',
      'User authentication for external connections',
      'The entity shall use appropriate authentication methods to control access of remote users.',
      'Access Control',
      'T5',
      'Network Access Control',
      'T.5.4',
      'T5.4.2.1	The entity shall require all remote login (users and administrators) to be done over secure channels.
T5.4.2.2	The entity shall ensure appropriate authentication methods to be used to control access by remote users.
T5.4.2.3	The entity shall block access to a machine (either remotely or locally) for administrator-level accounts.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.5.4.3',
      'Equipment identification in networks',
      'The entity shall be able to identify equipment connected to its networks.',
      NULL,
      NULL,
      NULL,
      NULL,
      'T5.4.3.1	The entity shall use equipment identification mechanisms to automatically authenticate legitimate connections and detect unauthorized devices connected to the network.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.5.4.4',
      'Remote diagnostic and configuration protection',
      'The entity shall control access for the purpose of diagnostic and configuration',
      NULL,
      NULL,
      NULL,
      NULL,
      'T5.4.4.1	The entity shall identify all ports and services that are used for diagnostic or configuration.
T5.4.4.2	The entity shall disable or uninstall the diagnostic and configuration services that are not required and define a protection mechanism for the ones that are required.
T5.4.4.3	The entity shall enable access control mechanisms (including strong authentication) to allow access only to authorized personnel.
T5.4.4.4	The entity shall log all remote access activities related to diagnostic and configuration.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.5.4.5',
      'Network connection control',
      'The entity shall restrict user access to shared networks.',
      NULL,
      NULL,
      NULL,
      NULL,
      'T5.4.5.1	The entity shall establish a procedure to provide access to shared networks in line with Access Control Policy and requirements of the business applications (refer to T5.1.1).
T5.4.5.2	The entity shall restrict users access to the network based on predefined tables and rules (e.g. certain time of the day).',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.5.4.6',
      'Network routing control',
      'The entity shall implement network routing controls to ensure that computer connections and information flows do not breach the access control policy of the business applications.',
      NULL,
      NULL,
      NULL,
      NULL,
      'T5.4.6.1	The entity shall Identify all routing equipment (e.g. routers, firewalls, and switches.) (refer to T1.2.1).
T5.4.6.2	The entity shall establish a secure configuration and rules for network routing (refer to T3.2.1).
T5.4.6.3	The entity shall enable source and destination address violation against rules checking on the routing equipment.
T5.4.6.4	The entity shall enable routing protection countermeasures to avoid manipulation of routing systems/tables.
T5.4.6.5	The entity shall implement sub-networks for publicly accessible systems that are separated from internal organizational networks (refer to T4.5.3).
T5.4.6.6	The entity shall connect to external networks or information systems only through managed interfaces consisting of boundary protection devices (such as firewalls).
T5.4.6.7	The entity shall monitor communications with external systems and with key internal systems for suspicious traffic.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.5.5.2',
      'User identification and authentication',
      'The entity shall create a unique identifier (user ID) for each user and implement a suitable authentication technique.',
      NULL,
      NULL,
      'Operating System Access Control',
      'T.5.5',
      'T5.5.2.1	The entity shall provide a unique identifier to each user.
T5.5.2.2	The entity shall enable authentication techniques that are suitable to entity.
T5.5.2.3	The entity shall ensure all restricted activity are logged with the associated authenticated users.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.6.3.1',
      'Information security requirements for cloud environments',
      'The entity shall define information security requirements covering the retention, processing, and storage of data in cloud environments.',
      'Third-Party Security',
      'T6',
      'Cloud Computing',
      'T.6.3',
      'T6.3.1.1	The entity shall perform necessary due diligence to determine requirements and restrictions relevant to information processing, storage and retention in the cloud environment.
T6.3.1.2	The entity shall include the cloud environment (and, where possible, its components) into the risk assessment process.
T6.3.1.3	The entity shall develop and maintain information governance policies and procedures to ensure compliance with identified requirements and risk mitigation strategies.
T6.3.1.4	The entity shall ensure information about security incidents that happen at the cloud service provider are communicated.
T6.3.1.5	The entity shall where possible, reserve a right to audit the security arrangements in place at cloud service provider.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.6.3.2',
      'Service delivery agreements with cloud providers',
      'The entity shall document relevant security requirements in service delivery agreements with cloud service providers.',
      NULL,
      NULL,
      NULL,
      NULL,
      'T6.3.2.1	Each service delivery agreement for cloud services shall include provisions for understanding and maintaining awareness of where information with applicable restrictions will be stored or transmitted in the cloud environment.
T6.3.2.2	Each service delivery agreement for cloud services shall include provisions for ensuring appropriate information migration plans at the end of the service period.
T6.3.2.3	Each service delivery agreement for cloud services shall include provisions for ensuring all other cloud security requirements determined relevant by the entity are included in the service delivery agreement.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.7.2.2',
      'Developer-provided training',
      'The entity shall require the developer of the information system, system component, or information system service to provide the trainings needed.',
      'Information Systems Acquisition, Development and Maintenance',
      'T7',
      'Security Requirements of Information Systems',
      'T.7.2',
      'T7.2.2.1	The entity shall require the developer to identify training requirements based on implemented security functions and in line with the Awareness and Training Policy (refer to M3.1.1) for the correct use and operation of the functions.
T7.2.2.2	The entity shall require the developer to design and execute appropriate training programs to meet these requirements.
T7.2.2.3	The entity shall require the developer to include training provisions in the relevant service delivery agreement.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.7.3.1',
      'Input data validation',
      'The entity shall validate data input to applications to ensure that this data is correct and appropriate.',
      NULL,
      NULL,
      'Correct Processing in Applications',
      'T.7.3',
      'T7.3.1.1	The entity shall define a set of guidelines or parameters to be used to validate data input into applications.
T7.3.1.2	The entity shall define a set of values for each guideline or parameter to identify acceptable and unacceptable values.
T7.3.1.3	The entity shall provide guidance on how to validate each guideline or parameter.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.7.3.2',
      'Control of internal processing',
      'The entity shall incorporate validation checks into applications to detect any corruption of information through processing errors or deliberate acts.',
      NULL,
      NULL,
      NULL,
      NULL,
      'T7.3.2.1	The entity shall provide guidelines to application developers on minimum requirements for validation checks for applications under development.
T7.3.2.2	The entity shall require application developers to provide evidence of compliance with minimum requirements.
T7.3.2.3	The entity shall periodically review existing applications to ensure validation checks included during their development still met minimum requirements.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.7.3.3',
      'Message integrity',
      'The entity shall ensure authenticity and integrity of messages in applications.',
      NULL,
      NULL,
      NULL,
      NULL,
      'T7.3.3.1	The entity shall identify requirements to ensure authenticity and integrity of messages transmitted between systems and applications.
T7.3.3.2	The entity shall adopt proper controls to address the identified requirements.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.7.3.4',
      'Output data validation',
      'The entity shall validate data output from an application',
      NULL,
      NULL,
      NULL,
      NULL,
      'T7.3.4.1	The entity shall define output validation procedures to ensure that the processing of stored information is correct and appropriate to the circumstances.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.7.6.4',
      'Information leakage',
      'The entity shall prevent opportunities for information leakage.',
      NULL,
      NULL,
      'Security in development and support processes',
      'T.7.6',
      'T7.6.4.1	The entity shall Adopt Data Leak Prevention (DLP) measures.
T7.6.4.2	The entity shall adopt identity and access management solutions to limit access to critical data only to authorized personnel.
T7.6.4.3	The entity shall define and enforce a data/information classification policy.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.7.8.1',
      'Supply chain protection strategy',
      'The entity shall develop a comprehensive information security strategy against supply chain threats to the information assets.',
      NULL,
      NULL,
      'Supply Chain Management',
      'T.7.8',
      'T7.8.1.1	The entity shall define a policy to regulate the acquisition of products and services. Such a policy shall include not to disclose to the supplier any unnecessary details about the entity’s configurations and architectures.
T7.8.1.2	The entity shall check for every product/service delivered its compliance to security requirements defined by the policy.
T7.8.1.3	The entity shall define in the contract with the supplier that compliance with the entity security policy is required.
T7.8.1.4	The entity shall incentivize transparency into the security practices of the supplier.
T7.8.1.5	The entity shall include the possibility to audit the supplier’s security practices.
T7.8.1.6	The entity shall ensure all sector and national level requirements for supply chain security are met.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.7.8.2',
      'Supplier reviews',
      'The entity shall conduct a supplier review prior to entering into a contractual agreement to acquire the information system, system component, or information system service.',
      NULL,
      NULL,
      NULL,
      NULL,
      'T7.8.2.1	The entity shall define an evaluation process for suppliers of information systems, system components and services.
T7.8.2.2	The entity shall periodically review supplier evaluations.
T7.8.2.3	The entity shall ensure the supplier review process includes checks with appropriate sector and national level requirements.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.7.8.3',
      'Limitation of harm',
      'The entity shall limit harm from potential adversaries targeting the organizational supply chain.',
      NULL,
      NULL,
      NULL,
      NULL,
      'T7.8.3.1	The entity shall limit information shared with suppliers.
T7.8.3.2	The entity shall employ a diverse set of suppliers for any critical information system product and service area.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.7.8.4',
      'Supply chain operations security',
      'The entity shall employ security controls to protect supply chain operations.',
      NULL,
      NULL,
      NULL,
      NULL,
      'T7.8.4.1	The entity shall evaluate risks to its own information systems/services operations considering also threats/vulnerabilities relate to suppliers.
T7.8.4.2	The entity shall work with suppliers to align controls and have them reported in the service contract.
T7.8.4.3	The entity shall define how controls implemented by suppliers will be monitored by the entity.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.7.8.5',
      'Reliable delivery',
      'The entity shall ensure a reliable delivery of information systems or system components.',
      NULL,
      NULL,
      NULL,
      NULL,
      'T7.8.5.1	The entity shall ensure information systems and components received are genuine.
T7.8.5.2	The entity shall verify software delivered has not being altered.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.7.8.6',
      'Processes to address weaknesses or deficiencies',
      'The entity shall establish a process to address weaknesses or deficiencies in supply chain elements.',
      NULL,
      NULL,
      NULL,
      NULL,
      'T7.8.6.1	The entity shall map supply chain elements and identify any interdependency.
T7.8.6.2	The entity shall identify and address any weaknesses or deficiencies during independent or organizational assessments of the mapped supply chain elements.
T7.8.6.3	The entity shall establish a formal review/audit process.
T7.8.6.4	The entity shall conduct regular assessments and audits of supply chain elements.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.7.8.7',
      'Supply of critical information system components',
      'The entity shall ensure an adequate supply of critical information system and systems components.',
      NULL,
      NULL,
      NULL,
      NULL,
      'T7.8.7.1	The entity shall define contingency plan for any supply of critical information system component.
T7.8.7.2	The entity shall stockpiling of critical spare components.
T7.8.7.3	The entity shall use multiple suppliers for critical components.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.8.1.1',
      'Information Security Incident Management Policy',
      'The entity shall establish a policy to manage and guide the response to information security incidents.',
      'Information Security Incident Management',
      'T8',
      'Information Security Incident Management Policy',
      'T.8.1',
      'T8.1.1.1	The incident management policy shall be appropriate to the purpose of the entity.
T8.1.1.2	The incident management policy shall include statement of the management commitment, purpose, objective and scope of the policy.
T8.1.1.3	The incident management policy shall outline roles and responsibilities.
T8.1.1.4	The incident management policy shall provide the framework for managing incidents.
T8.1.1.5	The incident management policy shall address sector and national level requirements for handling and reporting incidents.
T8.1.1.6	The incident management policy shall be documented and communicated to all users.
T8.1.1.7	The incident management policy shall be read and acknowledged formally by all users.
T8.1.1.8	The incident management policy shall be maintained, reviewed, exercised and updated at planned intervals or if significant changes occur.',
      1,
      'critical',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.8.2.3',
      'Incident classification',
      'The entity shall assess and classify information security incidents.',
      NULL,
      NULL,
      'Management of Information Security Incidents and improvements',
      'T.8.2',
      'T8.2.3.1	The entity shall establish an incident classification scheme in line with the incident response policy taking into account NESA’s issuances with regard to incident management.
T8.2.3.2	The entity shall assess and identify the incidents that should be reported at the sector and national level.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.8.2.4',
      'Incident response training',
      'The entity shall provide incident response training to information system users.',
      NULL,
      NULL,
      NULL,
      NULL,
      'T8.2.4.1	The entity shall establish a training program for the cyber security incident response team (CSIRT), in line with the Awareness and Training Policy (refer to M3.1.1).
T8.2.4.2	The entity shall ensure that the program covers all incident response procedures as well as their users.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.8.2.5',
      'Incident response testing',
      'The entity shall test its incident response capability.',
      NULL,
      NULL,
      NULL,
      NULL,
      'T8.2.5.1	The entity shall develop testing procedures and cases to validate effectiveness and usefulness of its incident response capability.
T8.2.5.2	The entity shall establish expected test results.
T8.2.5.3	The entity shall conduct incident response capability testing and compare outcome to the expected results to identify gaps and weaknesses
for remediation.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.8.2.6',
      'Incident response assistance',
      'The entity shall provide an incident response support resource to offer advice and assistance in case of an incident.',
      NULL,
      NULL,
      NULL,
      NULL,
      'T8.2.6.1	Assign the appropriate resources needed to support employees and external parties in handling and reporting of security incidents.
T8.2.6.2	Establish and make available the procedure to get in touch with the assigned personnel.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.8.2.7',
      'Information security incident documentation',
      'The entity shall document all information security incidents.',
      NULL,
      NULL,
      NULL,
      NULL,
      'T8.2.7.1	The entity shall identify the relevant data to be collected before, during and after an information security incident takes place.
T8.2.7.2	The entity shall collect and document relevant data related to all security incidents.
T8.2.7.3	The entity shall protect the information security incident documentation.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.8.3.1',
      'Situational awareness',
      'The entity shall develop a situational awareness culture by participating in the information sharing community and obtaining cyber security information from various sources.',
      NULL,
      NULL,
      'Information Security Events and Weaknesses Reporting',
      'T.8.3',
      'T8.3.1.1	The entity shall identify priority information and share it internally to build the
entity context.
T8.3.1.2	The entity shall, for the sector context, identify and share priority information that is relevant to entities in the same sector to build the sector context.
T8.3.1.3	The entity shall, for the national context, identify and share priority information that is relevant across all sectors to build the national context.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );
INSERT OR IGNORE INTO framework_controls (
      framework_id, control_ref, control_title, control_description, 
      section_name, section_ref, subsection_name, subsection_ref,
      implementation_guidance, applicable, priority, created_at, updated_at
    ) VALUES (
      (SELECT id FROM frameworks WHERE code = 'UAE_ISR'),
      'T.9.2.1',
      'Developing information systems continuity plans',
      'The entity shall develop its information systems continuity plans.',
      'Information Systems Continuity Management',
      'T9',
      'Information Security aspects of Information Continuity Management',
      'T.9.2',
      'T9.2.1.1	The entity shall identify information continuity requirements in line with the entity’s overall business continuity planning and / or disaster recovery.
T9.2.1.2	The entity shall specify the escalations criteria and the conditions for its activation.
T9.2.1.3	The entity shall outline information continuity roles and responsibilities, and assign individuals with contact information.
T9.2.1.4	The entity shall define a safe mode when incidents are detected that restrict the entity’s operation in accordance with the information systems continuity policy.',
      1,
      'medium',
      CURRENT_TIMESTAMP,
      CURRENT_TIMESTAMP
    );

-- Update framework statistics
UPDATE frameworks SET 
      updated_at = CURRENT_TIMESTAMP 
    WHERE code IN ('ISO27001', 'UAE_ISR');
