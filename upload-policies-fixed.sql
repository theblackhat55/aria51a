-- Upload Information Security Policies to RAG System (Fixed for INTEGER id)
-- This script populates the RAG system with comprehensive ISO 27001/NIST compliant policies

-- 1. Information Security Policy
INSERT INTO rag_documents (
  title, content, document_type, metadata, embedding_status, 
  organization_id, uploaded_by, created_at, updated_at
) VALUES (
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
  '{"document_id": "ISP-001", "framework": "ISO27001", "type": "security_policy", "classification": "internal", "version": "2.1", "compliance": ["ISO27001", "NIST_CSF", "SOC2", "GDPR"], "category": "information_security", "owner": "CISO"}',
  'pending',
  1,
  1,
  datetime('now'),
  datetime('now')
);

-- 2. Access Control Policy  
INSERT INTO rag_documents (
  title, content, document_type, metadata, embedding_status,
  organization_id, uploaded_by, created_at, updated_at
) VALUES (
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
  '{"document_id": "ISP-002", "framework": "ISO27001", "type": "access_control", "classification": "internal", "version": "2.0", "compliance": ["ISO27001", "NIST_CSF", "SOC2"], "category": "access_management", "owner": "CISO"}',
  'pending',
  1,
  1,
  datetime('now'),
  datetime('now')
);

-- 3. Incident Response Plan
INSERT INTO rag_documents (
  title, content, document_type, metadata, embedding_status,
  organization_id, uploaded_by, created_at, updated_at
) VALUES (
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
  '{"document_id": "IRP-001", "framework": "ISO27001", "type": "incident_response", "classification": "internal", "version": "3.1", "compliance": ["ISO27001", "NIST", "SOC2", "GDPR"], "category": "incident_management", "owner": "CISO"}',
  'pending',
  1,
  1,
  datetime('now'),
  datetime('now')
);