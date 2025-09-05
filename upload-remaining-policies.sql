-- Upload remaining security policies to RAG system

-- 4. Data Classification Policy
INSERT INTO rag_documents (
  title, content, document_type, metadata, embedding_status,
  organization_id, uploaded_by, created_at, updated_at
) VALUES (
  'Data Classification and Handling Policy (DCP-001)',
  '# Data Classification and Handling Policy

**Document ID**: DCP-001  
**Version**: 2.0  
**Effective Date**: January 1, 2024  
**Classification**: Internal  
**Owner**: Chief Data Officer (CDO)  

## Purpose
Establishes framework for classifying, labeling, and handling organizational data based on sensitivity, value, and regulatory requirements in accordance with GDPR, ISO 27001:2022 A.8, and SOC 2 requirements.

## Data Classification Levels
### PUBLIC
- Information that can be freely shared without restriction
- No adverse impact if disclosed
- Examples: Marketing materials, public reports, job postings
- Handling: No special protection required

### INTERNAL
- Information intended for internal organizational use
- Moderate adverse impact if disclosed
- Examples: Internal policies, organizational charts, project plans
- Handling: Access restricted to employees and authorized contractors

### CONFIDENTIAL
- Sensitive business information requiring protection
- Significant adverse impact if disclosed
- Examples: Financial data, customer lists, business strategies
- Handling: Need-to-know basis, encrypted storage and transmission

### RESTRICTED
- Highly sensitive information with severe impact if compromised
- Legal or regulatory protection requirements
- Examples: Personal data (GDPR), payment card information, trade secrets
- Handling: Strict access controls, encryption, comprehensive audit logging

## Data Handling Procedures
### Storage Requirements
#### Digital Storage
- **PUBLIC/INTERNAL**: Standard network shares with access controls
- **CONFIDENTIAL**: Encrypted storage (AES-256), DLP monitoring
- **RESTRICTED**: Dedicated secure environments, HSM key management

#### Physical Storage
- Locked cabinets for confidential materials
- Access control systems with audit trails
- Environmental controls and inventory management
- Secure destruction services for end-of-life materials

### Transmission and Sharing
#### Encryption Requirements
- **INTERNAL**: Standard TLS encryption for email and web
- **CONFIDENTIAL**: Strong encryption (AES-256) for all transmission
- **RESTRICTED**: End-to-end encryption with key management controls

#### Approved Sharing Methods
- Corporate email systems with encryption capabilities
- Approved cloud collaboration platforms with access controls
- Secure file transfer protocols (SFTP, FTPS) for large files
- Virtual data rooms for due diligence activities

## Special Data Categories
### Personal Data (GDPR/Privacy Laws)
#### Personal Data Definition
- Any information relating to identified or identifiable natural persons
- Direct identifiers: names, ID numbers, contact information
- Indirect identifiers: IP addresses, device IDs, biometric data

#### Special Categories (Article 9 GDPR)
- Racial or ethnic origin, political opinions, religious beliefs
- Trade union membership, genetic and biometric data
- Health data and medical records, sexual orientation information
- Enhanced protection: explicit consent, additional security controls

### Financial Data
#### Payment Card Information (PCI DSS)
- Primary Account Number (PAN), cardholder data
- PCI DSS compliance mandatory
- Strong cryptography and restricted access required

### Intellectual Property
#### Trade Secrets
- Proprietary algorithms, manufacturing processes, customer lists
- Non-disclosure agreements for all personnel
- Physical and logical access controls required

## Data Lifecycle Management
### Data Creation and Collection
- Data minimization: collect only necessary data
- Privacy-by-design principles implementation
- Clear purpose specification and user consent

### Data Retention and Disposal
#### Retention Schedules
- Financial records: 7 years minimum
- Employee records: 7 years after termination
- Personal data: only as long as necessary for purpose

#### Secure Disposal
- Cryptographic erasure for encrypted data
- Multi-pass overwriting for unencrypted data (DoD 5220.22-M)
- Physical destruction for highly sensitive media
- Certificate of destruction from approved vendors

## Third-Party Data Sharing
### Data Processing Agreements
- Security and privacy capability assessment
- Clear purpose and scope of data processing
- Data security and protection requirements
- Incident notification and response procedures

### Cross-Border Data Transfers
- GDPR transfer mechanisms (adequacy decisions, SCCs)
- Transfer risk assessment for legal environment
- Data residency requirements and restrictions

This policy ensures appropriate protection measures are applied throughout the data lifecycle.',
  'policy',
  '{"document_id": "DCP-001", "framework": "GDPR", "type": "data_classification", "classification": "internal", "version": "2.0", "compliance": ["GDPR", "ISO27001", "SOC2", "PCI_DSS"], "category": "data_protection", "owner": "CDO"}',
  'pending',
  1,
  1,
  datetime('now'),
  datetime('now')
);

-- 5. Business Continuity Plan
INSERT INTO rag_documents (
  title, content, document_type, metadata, embedding_status,
  organization_id, uploaded_by, created_at, updated_at
) VALUES (
  'Business Continuity Plan (BCP-001)',
  '# Business Continuity Plan

**Document ID**: BCP-001  
**Version**: 3.0  
**Effective Date**: January 1, 2024  
**Classification**: Confidential  
**Owner**: Chief Operating Officer (COO)  

## Purpose
Ensures organization can continue critical business functions during and after disruptive events in alignment with ISO 22301:2019, ISO 27001:2022 A.17, and SOC 2 CC9.1 requirements.

## Critical Business Functions
### Tier 1 - Mission Critical (RTO: 1-4 hours, RPO: 15 minutes - 1 hour)
#### Customer Service Operations
- Recovery Time Objective (RTO): 4 hours
- Recovery Point Objective (RPO): 1 hour
- Impact: Direct customer impact, revenue loss, reputation damage
- Dependencies: Customer database, communication systems, staff
- Workarounds: Remote agents, backup call centers

#### Financial Transaction Processing
- Recovery Time Objective (RTO): 2 hours
- Recovery Point Objective (RPO): 15 minutes
- Impact: Revenue loss, regulatory compliance issues
- Dependencies: Payment systems, banking connections, security infrastructure
- Workarounds: Manual processing, backup payment processors

#### Core Production Systems
- Recovery Time Objective (RTO): 4 hours
- Recovery Point Objective (RPO): 30 minutes
- Impact: Complete business shutdown, customer service disruption
- Dependencies: Data center, network connectivity, application servers
- Workarounds: Secondary data center, cloud failover systems

### Tier 2 - Business Critical (RTO: 4-24 hours, RPO: 1-4 hours)
#### Human Resources Systems
- Payroll, benefits, and employee management
- RTO: 8 hours, RPO: 4 hours
- Workarounds: Manual payroll processing, outsourced HR services

#### Supply Chain Management
- Procurement, inventory, and vendor management
- RTO: 24 hours, RPO: 4 hours
- Workarounds: Manual ordering, alternative suppliers

## Incident Types and Trigger Events
### Natural Disasters
#### Weather-Related Events
- Activation Triggers: National Weather Service warnings, local emergency declarations
- Response Strategy: Remote work activation, facility shutdown procedures

#### Pandemics and Health Emergencies
- Activation Triggers: CDC/WHO declarations, local health department orders
- Response Strategy: Remote work capabilities, health and safety protocols

### Technology Disasters
#### Cybersecurity Incidents
- Ransomware attacks, data breaches
- Response Strategy: Incident response activation, backup system deployment

#### Infrastructure Failures
- Data center outages, network failures
- Response Strategy: Failover to secondary data center, cloud deployment

## Business Continuity Strategies
### Technology Recovery Strategies
#### Data Center Recovery
- **Hot Site Strategy**: Fully equipped backup facility with real-time replication
- **Cloud-Based Recovery**: Scalable cloud infrastructure and platforms
- **Failover Time**: 4 hours maximum for full operations

#### Data Backup and Recovery (3-2-1 Rule)
- **3 Copies**: Primary data plus two backup copies
- **2 Different Media**: Disk and tape/cloud storage
- **1 Offsite**: Geographic separation for disaster protection

### Workforce Continuity Strategies
#### Remote Work Capabilities
- VPN access for secure remote connectivity
- Cloud applications for web-based system access
- Communication tools: video conferencing, messaging, collaboration
- Mobile devices: laptops and phones for remote work

#### Alternative Staffing
- Cross-training programs for critical functions
- Contractor relationships for surge capacity
- Outsourcing options for critical functions
- Consultant network for specialized expertise

## Emergency Response Procedures
### Activation Procedures (0-30 minutes)
1. Safety First: Ensure personnel safety and security
2. Situation Assessment: Evaluate scope and impact
3. Initial Notifications: Alert key personnel and stakeholders
4. Damage Assessment: Preliminary evaluation of affected systems
5. Media Management: Control information flow and communications

### Crisis Management Team
- **Crisis Manager (COO)**: Overall response coordination
- **Technology Lead (CTO/CISO)**: IT infrastructure and security
- **Communications Lead**: Internal and external communications
- **HR Lead**: Personnel and workforce management
- **Legal Counsel**: Legal and regulatory compliance

## Recovery Operations
### Short-Term Recovery (0-72 hours)
1. Personnel Safety: Ensure all personnel safe and accounted for
2. Critical Systems: Restore mission-critical business functions
3. Communication: Establish reliable communication channels
4. Customer Service: Maintain customer service capabilities
5. Security: Protect assets and maintain security posture

### Long-Term Recovery (3 days - 3 months)
- Alternate facilities establishment
- System rebuilding and reconstruction
- Process improvements from lessons learned
- Vendor relationship restoration
- Financial recovery and insurance claims

## Testing and Maintenance
### Testing Schedule
#### Quarterly Tests
- Tabletop exercises with scenario-based discussions
- Crisis Management Team participation
- Documentation of lessons learned and improvements

#### Annual Tests
- Full-scale business continuity plan activation
- Technology failover and recovery testing
- Alternative facility activation
- Comprehensive after-action review

### Plan Maintenance
- Monthly contact information updates
- Annual complete plan review and update
- Change management for organizational or technology changes
- Lessons learned integration from incidents and exercises

This plan ensures organizational resilience and continuity during disruptive events.',
  'plan',
  '{"document_id": "BCP-001", "framework": "ISO22301", "type": "business_continuity", "classification": "confidential", "version": "3.0", "compliance": ["ISO22301", "ISO27001", "SOC2"], "category": "business_resilience", "owner": "COO"}',
  'pending',
  1,
  1,
  datetime('now'),
  datetime('now')
);

-- 6. System Configuration Updates
INSERT OR REPLACE INTO system_configuration (key, value, description, is_public) VALUES
  ('rag_enabled', 'true', 'Enable RAG system with security policies', 0),
  ('policy_upload_date', datetime('now'), 'Date when security policies were uploaded', 0),
  ('policy_version', '2024.01', 'Version of uploaded security policy set', 0),
  ('compliance_frameworks', 'ISO27001,NIST_CSF,SOC2,GDPR,PCI_DSS,ISO22301', 'Supported compliance frameworks', 0),
  ('document_management_enabled', 'true', 'Enable document upload/delete functionality', 0);