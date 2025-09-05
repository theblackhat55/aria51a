-- Upload Information Security Policies to RAG System
-- This script populates the RAG system with comprehensive ISO 27001/NIST compliant policies

-- 1. Information Security Policy
INSERT OR REPLACE INTO rag_documents (
  id, title, content, document_type, metadata, embedding_status, 
  organization_id, uploaded_by, created_at, updated_at
) VALUES (
  'isp_001_information_security_policy',
  'Information Security Policy (ISP-001)',
  '# Information Security Policy

**Document ID**: ISP-001  
**Version**: 2.1  
**Effective Date**: January 1, 2024  
**Classification**: Internal  
**Owner**: Chief Information Security Officer (CISO)  

## Overview
This Information Security Policy establishes the framework for protecting information assets and ensuring the confidentiality, integrity, and availability of organizational data and systems. Compliant with ISO 27001:2022, NIST CSF v1.1, SOC 2 Type II, and GDPR.

## Information Security Objectives
- Maintain confidentiality of sensitive information (CIA Rating: Level 3+)
- Ensure integrity of business-critical data and systems
- Guarantee availability of essential services (99.9% uptime target)
- Comply with legal, regulatory, and contractual requirements
- Support business continuity and disaster recovery

## Data Classification Framework
### PUBLIC: Information that can be freely shared without restriction
### INTERNAL: Information intended for internal use, moderate impact if disclosed
### CONFIDENTIAL: Sensitive business information requiring protection, significant impact
### RESTRICTED: Highly sensitive information, severe impact if disclosed, legal protection

## Access Control Framework
- **Principle of Least Privilege**: Users granted minimum access necessary
- **Role-Based Access Control (RBAC)**: Access based on job functions
- **Multi-Factor Authentication (MFA)**: Required for all privileged accounts
- **Regular Reviews**: Quarterly access certification by data owners

## Security Controls Implementation
### Technical Controls
- Network Security: Next-generation firewalls, intrusion prevention, zero trust
- Endpoint Security: EDR, device management, antimalware, patch management
- Application Security: Secure development, testing, WAF, API security

### Administrative Controls
- Security Governance: Information Security Committee, policies, risk management
- Human Resources Security: Background checks, training, confidentiality agreements
- Physical Controls: Facility security, surveillance, environmental controls

## Incident Response Process
- **Critical (P1)**: System compromise, data breach - Immediate response
- **High (P2)**: Security policy violation - 1 hour response
- **Medium (P3)**: Potential security threat - 4 hours response
- **Low (P4)**: Minor security issue - 24 hours response

## Compliance Requirements
- **GDPR**: Data Protection Impact Assessments, privacy by design, breach notification
- **SOC 2**: Trust Services Criteria compliance, continuous monitoring, annual audit
- **ISO 27001**: Information security management system, risk assessment, controls

## Training and Awareness
- Annual mandatory security training for all personnel
- Monthly phishing simulation exercises
- Role-specific training based on job responsibilities
- Incident response training and tabletop exercises

This policy is reviewed annually and updated as needed to address emerging threats and regulatory changes.',
  'policy',
  '{"framework": "ISO27001", "type": "security_policy", "classification": "internal", "version": "2.1", "compliance": ["ISO27001", "NIST_CSF", "SOC2", "GDPR"], "category": "information_security", "owner": "CISO"}',
  'pending',
  1,
  1,
  datetime('now'),
  datetime('now')
);

-- 2. Access Control Policy
INSERT OR REPLACE INTO rag_documents (
  id, title, content, document_type, metadata, embedding_status,
  organization_id, uploaded_by, created_at, updated_at
) VALUES (
  'isp_002_access_control_policy',
  'Access Control Policy (ISP-002)',
  '# Access Control Policy

**Document ID**: ISP-002  
**Version**: 2.0  
**Effective Date**: January 1, 2024  
**Classification**: Internal  
**Owner**: Chief Information Security Officer (CISO)  

## Purpose
Establishes requirements for managing user access to organizational information systems, applications, and data in accordance with ISO 27001:2022 A.9 controls, NIST CSF Identity and Access Management, and SOC 2 CC6.1 requirements.

## Access Control Principles
### Principle of Least Privilege
- Users granted minimum access necessary to perform job functions
- Default deny approach - access explicitly granted, not assumed
- Regular validation of access requirements and usage

### Segregation of Duties
- Separation of conflicting responsibilities
- No single individual has complete control over critical processes
- System-enforced controls where possible

## User Access Management
### Account Provisioning Process
1. Formal access request with business justification
2. Manager approval required
3. Data owner approval for sensitive systems
4. HR confirmation of employment status
5. IT provisioning with standard access template

### Account Types
- **Standard User Account**: Regular business user access
- **Service Account**: System-to-system authentication
- **Administrative Account**: Elevated privileges for system management
- **Emergency Account**: Break-glass access for critical incidents

### Privileged Account Management
- Separate administrative accounts from standard user accounts
- Multi-Factor Authentication required for all privileged access
- Just-in-Time access for specific tasks
- Session recording and monitoring of all privileged activities
- Monthly review of privileged account holders

## Authentication Requirements
### Password Management
- Minimum 12 characters, complexity requirements
- No reuse of last 12 passwords
- Maximum 90 days for privileged accounts, 365 days for standard
- Enterprise password management tools required

### Multi-Factor Authentication (MFA)
- Mandatory for privileged accounts and administrative access
- Required for sensitive systems processing restricted data
- Mandatory for all external network access (VPN)
- Required for all Software-as-a-Service applications

## Network Access Control
### Network Segmentation
- User Network: Standard user access with appropriate filtering
- Admin Network: Isolated network for administrative functions
- Guest Network: Limited internet-only access for visitors
- DMZ: Demilitarized zone for public-facing services

### Remote Access
- Enterprise-grade VPN with strong encryption
- Device compliance health checks
- Multi-Factor Authentication required
- All connections logged and monitored

## Monitoring and Review
### Continuous Monitoring
- Real-time monitoring of authentication events
- Behavioral analytics for unusual access patterns
- SIEM correlation and alerting
- Privileged activity monitoring

### Access Reviews
- Quarterly manager certification of direct report access
- Annual comprehensive review of all user access
- Monthly review of privileged account access
- Automated detection of orphaned accounts

This policy ensures appropriate access controls protect organizational information assets while enabling business productivity.',
  'policy',
  '{"framework": "ISO27001", "type": "access_control", "classification": "internal", "version": "2.0", "compliance": ["ISO27001", "NIST_CSF", "SOC2"], "category": "access_management", "owner": "CISO"}',
  'pending',
  1,
  1,
  datetime('now'),
  datetime('now')
);

-- 3. Incident Response Plan
INSERT OR REPLACE INTO rag_documents (
  id, title, content, document_type, metadata, embedding_status,
  organization_id, uploaded_by, created_at, updated_at
) VALUES (
  'irp_001_incident_response_plan',
  'Incident Response Plan (IRP-001)',
  '# Incident Response Plan

**Document ID**: IRP-001  
**Version**: 3.1  
**Effective Date**: January 1, 2024  
**Classification**: Internal  
**Owner**: Chief Information Security Officer (CISO)  

## Purpose
Establishes procedures for detecting, responding to, and recovering from cybersecurity incidents in alignment with ISO 27001:2022 A.16, NIST SP 800-61r2, and SOC 2 CC7.4 requirements.

## Incident Response Team Structure
### Core Team Members
- **Incident Commander (IC)**: Overall incident coordination and decision-making
- **Technical Lead**: Technical investigation and containment activities
- **Communications Lead**: Internal and external stakeholder communications
- **Legal Counsel**: Legal compliance and regulatory notification requirements
- **Business Lead**: Business impact assessment and user communications

## Incident Classification
### Critical (P1) - Response Time: Immediate
- System outage affecting all users or critical business functions
- Confirmed data breach with sensitive information compromised
- Active cyberattack with ongoing damage
- Ransomware affecting critical systems

### High (P2) - Response Time: 1 Hour
- Security control failure or compromise
- Suspected data breach requiring investigation
- Service degradation affecting multiple users
- Confirmed malware on corporate systems

### Medium (P3) - Response Time: 4 Hours
- Policy violation with potential security impact
- Suspicious activity requiring investigation
- System vulnerability with possible exploitation
- Minor service degradation

### Low (P4) - Response Time: 24 Hours
- Policy violations with minimal security impact
- Routine security events requiring documentation
- Informational security alerts
- Minor configuration issues

## Incident Response Process
### Phase 1: Preparation
- Security awareness training for all personnel
- Incident response team training and exercises
- Tool configuration and contact list maintenance
- Detection capabilities (SIEM, IDS, EDR)

### Phase 2: Detection and Analysis (0-45 minutes)
- Automated detection through monitoring systems
- Manual detection through user reporting
- Alert triage and validation
- Initial scoping and severity assessment
- Team notification and documentation

### Phase 3: Containment, Eradication, and Recovery
#### Short-term Containment (Immediate)
- Isolate affected systems to prevent spread
- Disable compromised accounts immediately
- Preserve evidence for investigation
- Implement workarounds to maintain operations

#### Eradication (Variable Timeline)
- Root cause analysis and vulnerability remediation
- Malware removal and system cleaning
- Account cleanup and credential reset
- System hardening and security control enhancement

#### Recovery (Variable Timeline)
- System restoration from clean backups
- Security patch installation and configuration verification
- Gradual restoration with enhanced monitoring
- User acceptance testing and performance monitoring

### Phase 4: Post-Incident Activity (Within 72 hours)
- Lessons learned review meeting
- Comprehensive incident report creation
- Process improvement identification
- Preventive measure implementation

## Communication Procedures
### Internal Communications
- **P1 Critical**: CEO, CISO, CTO, Legal, HR - Immediate notification
- **P2 High**: CISO, IT Director, Business Unit Heads - 1 Hour
- **P3 Medium**: CISO, Security Team, System Owners - 4 Hours
- **P4 Low**: Security Team, System Administrators - 24 Hours

### External Communications
#### Regulatory Notifications
- **GDPR**: 72 hours to supervisory authority for personal data breaches
- **Other Regulations**: Sector-specific notification requirements
- **Law Enforcement**: Criminal activity reporting as appropriate

## Legal and Regulatory Considerations
### Evidence Handling
- Complete chain of custody documentation
- Secure storage and transportation of evidence
- Digital forensics using approved tools and methods
- Expert testimony preparation for potential legal proceedings

### Compliance Requirements
- Breach notification laws (GDPR, CCPA, state laws)
- Industry-specific requirements (HIPAA, PCI DSS, etc.)
- Insurance claim notifications and documentation

This plan ensures coordinated and effective response to cybersecurity incidents while meeting regulatory requirements.',
  'plan',
  '{"framework": "ISO27001", "type": "incident_response", "classification": "internal", "version": "3.1", "compliance": ["ISO27001", "NIST", "SOC2", "GDPR"], "category": "incident_management", "owner": "CISO"}',
  'pending',
  1,
  1,
  datetime('now'),
  datetime('now')
);

-- 4. Data Classification Policy
INSERT OR REPLACE INTO rag_documents (
  id, title, content, document_type, metadata, embedding_status,
  organization_id, uploaded_by, created_at, updated_at
) VALUES (
  'dcp_001_data_classification_policy',
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
  '{"framework": "GDPR", "type": "data_classification", "classification": "internal", "version": "2.0", "compliance": ["GDPR", "ISO27001", "SOC2", "PCI_DSS"], "category": "data_protection", "owner": "CDO"}',
  'pending',
  1,
  1,
  datetime('now'),
  datetime('now')
);

-- 5. Business Continuity Plan
INSERT OR REPLACE INTO rag_documents (
  id, title, content, document_type, metadata, embedding_status,
  organization_id, uploaded_by, created_at, updated_at
) VALUES (
  'bcp_001_business_continuity_plan',
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
  '{"framework": "ISO22301", "type": "business_continuity", "classification": "confidential", "version": "3.0", "compliance": ["ISO22301", "ISO27001", "SOC2"], "category": "business_resilience", "owner": "COO"}',
  'pending',
  1,
  1,
  datetime('now'),
  datetime('now')
);

-- 6. System Configuration for RAG
INSERT OR REPLACE INTO system_configuration (key, value, description, is_public) VALUES
  ('rag_enabled', 'true', 'Enable RAG system with security policies', 0),
  ('policy_upload_date', datetime('now'), 'Date when security policies were uploaded', 0),
  ('policy_version', '2024.01', 'Version of uploaded security policy set', 0),
  ('compliance_frameworks', 'ISO27001,NIST_CSF,SOC2,GDPR,PCI_DSS', 'Supported compliance frameworks', 0);