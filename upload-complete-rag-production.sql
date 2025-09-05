-- Upload Complete RAG Data to Production Database
-- This script uploads all comprehensive security policies and user guide

-- Clear existing documents first
DELETE FROM rag_documents WHERE document_type IN ('policy', 'plan', 'guidance', 'standard', 'procedure');

-- 1. Information Security Policy (ISP-001)
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

### Physical & Environmental Controls
- Secure Areas: Physical access controls, visitor management, clean desk policy
- Equipment: Asset management, secure disposal, maintenance contracts
- Environmental: Climate control, power systems, fire suppression

## Risk Management
### Risk Assessment Process
1. **Risk Identification**: Systematic identification of threats and vulnerabilities
2. **Risk Analysis**: Qualitative and quantitative risk assessment methodologies  
3. **Risk Evaluation**: Risk appetite and tolerance determination
4. **Risk Treatment**: Selection and implementation of appropriate controls
5. **Risk Monitoring**: Continuous monitoring and review of risk landscape

### Risk Categories
- **Strategic Risks**: Business strategy, reputation, regulatory compliance
- **Operational Risks**: Process failures, human error, system outages
- **Financial Risks**: Fraud, credit risk, market volatility
- **Compliance Risks**: Regulatory violations, legal liability
- **Technology Risks**: Cyber threats, data breaches, system failures

## Incident Management
### Incident Response Team
- **Incident Commander**: Overall response coordination and decision making
- **Technical Team**: System administrators, security analysts, forensics experts  
- **Communications Team**: Internal and external stakeholder communication
- **Legal Team**: Legal compliance, regulatory notification, law enforcement liaison
- **Business Team**: Business impact assessment, recovery planning

### Response Procedures
1. **Detection and Analysis**: Incident identification and initial assessment
2. **Containment**: Immediate actions to prevent incident spread
3. **Eradication**: Removal of threat and vulnerability remediation
4. **Recovery**: System restoration and normal operations resumption
5. **Lessons Learned**: Post-incident analysis and improvement implementation

## Compliance and Legal Requirements
### Regulatory Compliance
- **GDPR**: General Data Protection Regulation compliance for EU data subjects
- **ISO 27001**: Information Security Management System certification
- **SOC 2**: Service Organization Control 2 Type II compliance
- **PCI DSS**: Payment Card Industry Data Security Standard (if applicable)
- **HIPAA**: Health Insurance Portability and Accountability Act (if applicable)

### Contractual Obligations
- Customer data protection requirements
- Vendor and supplier security standards  
- Partnership and alliance security agreements
- Insurance policy security requirements
- Service level agreement security provisions

## Training and Awareness
### Security Training Program
- **New Employee Orientation**: Security policies, procedures, responsibilities
- **Role-Based Training**: Specific security training based on job functions
- **Annual Refresher Training**: Updates on policies, procedures, and threats
- **Specialized Training**: Advanced training for security and IT personnel
- **Incident Response Training**: Tabletop exercises and simulation drills

### Awareness Activities
- Security newsletters and communications
- Phishing simulation and testing programs
- Security metrics and dashboard reporting
- Recognition and incentive programs
- Security event and conference participation

## Policy Enforcement and Violations
### Enforcement Mechanisms
- Regular security audits and assessments
- Continuous monitoring and alerting systems  
- Access reviews and certification processes
- Incident investigation and forensics
- Disciplinary action procedures

### Violation Categories
- **Minor Violations**: Policy oversight, inadvertent non-compliance
- **Major Violations**: Deliberate policy violation, significant security impact
- **Critical Violations**: Malicious activity, criminal behavior, severe impact
- **Repeated Violations**: Pattern of non-compliance despite training and warnings

## Policy Review and Updates
### Review Schedule
- **Annual Review**: Complete policy review and update cycle
- **Triggered Reviews**: Reviews based on incidents, regulatory changes, business changes
- **Continuous Improvement**: Ongoing enhancements based on lessons learned
- **Stakeholder Feedback**: Input from business units, IT, legal, and external auditors

### Change Management
- Policy change request and approval process
- Impact assessment and risk analysis
- Stakeholder consultation and feedback
- Communication and training on changes
- Implementation monitoring and verification

---

**Document Approval:**

CISO Signature: _________________________ Date: _____________

IT Director Signature: _________________________ Date: _____________

**Next Review Date**: December 31, 2024

**Related Documents**: Access Control Policy (ACP-001), Incident Response Plan (IRP-001), Data Classification Policy (DCP-001)',
  'policy',
  '{"policy_id": "ISP-001", "version": "2.1", "compliance_frameworks": ["ISO 27001:2022", "NIST CSF", "SOC 2", "GDPR"], "classification": "Internal", "owner": "CISO"}',
  'pending',
  1,
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- 2. Access Control Policy (ACP-001) - Abbreviated due to size
INSERT INTO rag_documents (
  title, content, document_type, metadata, embedding_status, 
  organization_id, uploaded_by, created_at, updated_at
) VALUES (
  'Access Control Policy (ACP-001)',
  '# Access Control Policy

**Document ID**: ACP-001  
**Version**: 2.0  
**Effective Date**: January 1, 2024  
**Owner**: Chief Information Security Officer (CISO)  
**Classification**: Internal  

## 1. PURPOSE AND SCOPE

This Access Control Policy establishes requirements for managing user access to organizational information systems, applications, and data in accordance with ISO 27001:2022 controls A.9, NIST CSF Identity and Access Management, and SOC 2 CC6.1 requirements.

## 2. ACCESS CONTROL PRINCIPLES

### 2.1 Principle of Least Privilege
- Users granted minimum access necessary to perform job functions
- Default deny approach - access explicitly granted, not assumed
- Regular validation of access requirements and usage
- Time-limited access for temporary assignments

### 2.2 Segregation of Duties
- Separation of conflicting responsibilities
- No single individual has complete control over critical processes
- System-enforced controls where possible
- Documented exceptions with compensating controls

### 2.3 Need-to-Know Basis
- Access granted based on business justification
- Information shared only with authorized individuals
- Regular review of access appropriateness
- Prompt removal when no longer required

## 3. USER ACCESS MANAGEMENT

### 3.1 Account Provisioning Process
1. **Access Request**: Formal request with business justification
2. **Manager Approval**: Line manager authorization required
3. **Data Owner Approval**: Resource owner approval for sensitive systems
4. **Identity Verification**: HR confirmation of employment status
5. **Account Creation**: IT provisioning with standard access template
6. **Access Notification**: Confirmation to requestor and approvers

### 3.2 Account Types
- **Standard User Account**: Regular business user access
- **Service Account**: System-to-system authentication
- **Administrative Account**: Elevated privileges for system management
- **Emergency Account**: Break-glass access for critical incidents
- **Contractor Account**: Time-limited access for external personnel

## 4. AUTHENTICATION REQUIREMENTS

### 4.1 Password Requirements
- **Minimum Length**: 12 characters minimum, 16+ recommended
- **Complexity**: Mix of uppercase, lowercase, numbers, special characters
- **Uniqueness**: No reuse of last 12 passwords
- **Aging**: Maximum 90 days for privileged accounts, 365 days for standard
- **Dictionary Check**: Prevention of common and compromised passwords

### 4.2 Multi-Factor Authentication (MFA)
- **Privileged Accounts**: MFA mandatory for all administrative access
- **Sensitive Systems**: MFA required for systems processing restricted data
- **Remote Access**: MFA mandatory for all external network access
- **Cloud Services**: MFA for all Software-as-a-Service applications
- **High-Risk Users**: MFA for executives and high-privilege users

## 5. NETWORK ACCESS CONTROL

### 5.1 Network Segmentation
- **User Network**: Standard user access with appropriate filtering
- **Admin Network**: Isolated network for administrative functions
- **Guest Network**: Limited access for visitors with internet only
- **IoT Network**: Isolated network for Internet of Things devices
- **DMZ**: Demilitarized zone for public-facing services

### 5.2 Remote Access
- **Approved VPN Solutions**: Enterprise-grade VPN with strong encryption
- **Device Compliance**: Health checks for connecting devices
- **Split Tunneling**: Prohibited for corporate device connections
- **Activity Logging**: All VPN connections logged and monitored
- **Idle Timeout**: Automatic disconnection after inactivity period

## 6. ACCESS MONITORING AND REVIEW

### 6.1 Continuous Monitoring
- **Authentication Monitoring**: Failed login attempts and account lockouts
- **Privileged Activity**: Real-time monitoring of administrative actions
- **Anomaly Detection**: Behavioral analytics for unusual access patterns
- **Geo-Location Tracking**: Monitoring access from unusual locations
- **Concurrent Sessions**: Detection of simultaneous login attempts

### 6.2 Access Reviews and Recertification
- **Quarterly Reviews**: Manager certification of direct report access
- **Annual Recertification**: Comprehensive review of all user access
- **Data Owner Reviews**: Resource owners validate access appropriateness
- **Privileged Account Reviews**: Monthly review of administrative access
- **Exception Reviews**: Regular review of approved access exceptions

---

**Document Approval:**
CISO Signature: _________________________ Date: _____________
IT Director Signature: _________________________ Date: _____________

**Related Documents**: Information Security Policy (ISP-001), Incident Response Plan (IRP-001)',
  'policy',
  '{"policy_id": "ACP-001", "version": "2.0", "compliance_frameworks": ["ISO 27001:2022", "NIST CSF", "SOC 2"], "classification": "Internal", "owner": "CISO"}',
  'pending',
  1,
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

-- 3. Enable RAG system in production
INSERT OR REPLACE INTO system_configuration (key, value, description, created_at, updated_at)
VALUES ('rag_enabled', 'true', 'Enable RAG system for AI-powered document search', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4. Upload User Guide (abbreviated version for production)
INSERT INTO rag_documents (
  title, content, document_type, metadata, embedding_status, 
  organization_id, uploaded_by, created_at, updated_at
) VALUES (
  'ARIA5.1 Platform - User Guide (USR-001)',
  '# ARIA5.1 Platform - Comprehensive User Guide

**Document ID**: USR-001  
**Version**: 1.0  
**Classification**: Internal  
**Owner**: Platform Development Team  

## Platform Overview

ARIA5.1 is an enterprise-grade AI-powered Risk Intelligence Platform designed for comprehensive security risk management, compliance monitoring, and threat intelligence operations.

### Key Features
- AI-Powered Risk Analytics with machine learning capabilities
- Comprehensive Policy Management with AI integration
- ARIA AI Assistant with RAG-enabled chatbot for policy guidance
- Enterprise Security with role-based access control
- Real-time Dashboards for risk metrics and compliance status
- API Integration for third-party tools
- Cloud-Native built on Cloudflare global edge network

## Risk Management

### Risk Register
Access via Risk → Risk Register to manage organizational risks.

#### Creating a New Risk
1. Click "Add Risk" button
2. Fill required fields: Risk Title, Description, Category, Impact Rating (1-5), Probability Rating (1-5)
3. Assign Risk Owner and link to Business Process
4. Optional: Add regulatory mapping, asset references, threat sources

#### Risk Assessment Methodology
Risk Score = Impact × Probability

Risk Categories:
- Critical (20-25): Immediate action required
- High (15-19): Senior management attention needed  
- Medium (8-14): Management attention required
- Low (4-7): Monitor and review
- Very Low (1-3): Accept or minimal controls

### Risk Treatments
Treatment Strategies: Avoid, Mitigate, Transfer, Accept

#### Creating Treatment Plans
1. Select Risk from register
2. Click "Add Treatment"
3. Define Strategy, Control Description, Timeline, Responsible Party, Budget, Success Metrics

### Key Risk Indicators (KRIs)
Navigate to Risk → Key Risk Indicators

Categories:
- Operational KRIs: System uptime, failed logins, patch compliance, backup success
- Security KRIs: Incident count, vulnerability scans, phishing tests, access reviews
- Compliance KRIs: Policy acknowledgment, training completion, audit findings

### Incident Management

#### Incident Severity Classification
- P1 Critical (15min response): Complete outage, active breach, regulatory incident
- P2 High (1hr response): Partial outage, potential data exposure, critical violation
- P3 Medium (4hr response): Limited functionality affected, minor compliance gap
- P4 Low (24hr response): Individual user issues, low-impact events

## Compliance Management

### Supported Frameworks
- ISO 27001:2022: Information Security Management Systems
- SOC 2 Type II: Trust Services Criteria
- GDPR: General Data Protection Regulation
- PCI DSS: Payment Card Industry Data Security Standard
- NIST CSF: Cybersecurity Framework v1.1

### Framework Configuration
1. Navigate to Compliance → Frameworks
2. Select Framework and configure controls
3. Map to internal controls, set implementation status
4. Define evidence requirements and review schedule

## AI Assistant (ARIA)

### Overview
ARIA is your intelligent platform companion powered by RAG technology with access to all platform data and uploaded policies.

### Key Capabilities
- Policy Guidance: Questions about security policies and procedures
- Risk Analysis: Insights on risk management best practices
- Compliance Help: Guidance on regulatory requirements
- Platform Navigation: Help finding features
- Data Analysis: Interpret platform metrics and reports

### Using ARIA Effectively

#### Question Types
Policy Questions: "What are the password requirements?"
Risk Questions: "What are our highest risks?"  
Compliance Questions: "What ISO 27001 controls do we need?"
Platform Questions: "How do I create a new risk?"

#### Best Practices
1. Be specific with context and details
2. Use natural language
3. Follow up with clarifying questions
4. Reference specific policies or requirements
5. Verify critical information with source documents

## Policy Management

### Accessing Policy Management
Navigate to Operations → Policy Management

### Supported Document Types
- Markdown (.md): Structured text with formatting
- Plain Text (.txt): Simple text documents
- PDF (.pdf): Portable document format

### Document Categories
- Policy: High-level organizational directives
- Plan: Comprehensive response and recovery plans
- Procedure: Step-by-step process instructions
- Standard: Technical specifications
- Guidance: Best practice recommendations

### Uploading Documents
1. Click "Upload Policy" button
2. Enter policy title and select document type
3. Choose upload method (file or text)
4. Add optional metadata in JSON format
5. Submit for processing

Documents are automatically:
- Stored in secure database
- Indexed for search
- Added to ARIA knowledge base
- Listed in policy management interface

## Troubleshooting

### Common Issues

#### Authentication Problems
- Cannot login: Verify credentials, check for account lockout, clear browser cache
- Session expires: Check timeout settings, ensure stable connection

#### Performance Issues  
- Slow loading: Check internet connection, clear cache, use Chrome/Firefox
- No search results: Verify spelling, use broader terms, check filters

### Getting Help
- ARIA Assistant: Ask questions directly in platform
- Documentation: Reference this user guide
- Administrator: Contact platform administrator for access issues

---

**Document Information**
- Document ID: USR-001
- Version: 1.0  
- Author: Platform Development Team
- Next Review: July 15, 2024',
  'guidance',
  '{"document_type": "user_guide", "version": "1.0", "classification": "Internal", "covers": ["risk_management", "compliance", "operations", "ai_assistant", "policy_management"]}',
  'pending',
  1,
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);